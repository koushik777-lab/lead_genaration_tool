import { Router } from "express";
import { Lead } from "../models/Lead.js";
import crypto from "crypto"; // Native Node crypto for generating temporary request IDs if needed

const router = Router();

let crmToken = null;
let authPromise = null;

const CRM_API_URL = process.env.EXTERNAL_CRM_URL || "https://api.externalcrm.mock";

/**
 * Normalizes a phone number to standard 10 digits
 * @param {string} phone 
 * @returns {string|null}
 */
function cleanPhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  // keep last 10 digits
  return digits.slice(-10);
}

async function getAuthToken() {
  if (crmToken) return crmToken;

  // If already fetching token, wait for it
  if (authPromise) return authPromise;

  authPromise = (async () => {
    try {
      const response = await fetch(`${process.env.EXTERNAL_CRM_URL || CRM_API_URL}/login/admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: process.env.EXTERNAL_CRM_USERNAME,
          password: process.env.EXTERNAL_CRM_PASSWORD
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error("Failed to authenticate with CRM");
      }

      crmToken = data.token;
      return crmToken;

    } catch (error) {
      crmToken = null;
      throw error;
    } finally {
      authPromise = null; // release lock
    }
  })();

  return authPromise;
}

/**
 * Transform Lead Data Mapping
 */
function transformLead(lead, cleanedNumber) {
  return {
    name: lead.businessName,
    company: lead.businessName,
    number: cleanedNumber,
    email: lead.email || "",
    address: lead.location || "",
    address2: lead.country || "",
    source: "LeadGenTool",
    industry: lead.industry || ""
  };
}

/**
 * Send API Request
 */
async function sendLeadToCRM(payload, token, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${CRM_API_URL}/api/lead`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.status === 401) {
      throw new Error("UNAUTHORIZED"); // Special flag for token refresh
    }

    if (response.ok) {
      return { success: true, status: response.status };
    } else {
      const errorText = await response.text().catch(() => "Unknown Server Error");
      throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 50)}`);
    }
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("TIMEOUT");
    }
    throw err;
  }
}

// Main processing engine endpoint
router.post("/", async (req, res) => {
  const { leadIds } = req.body;

  if (!Array.isArray(leadIds) || leadIds.length === 0) {
    return res.status(400).json({ error: "No leadIds provided." });
  }

  try {
    // 1. Fetch leads
    const leads = await Lead.find({ _id: { $in: leadIds } });
    if (!leads.length) {
      return res.status(404).json({ error: "None of the requested leads were found." });
    }

    // Attempt to hydrate token if missing
    if (!crmToken) {
      try {
        await getAuthToken();
      } catch (err) {
        console.error("[CRM_SYNC] Failed initial auth:", err.message);
        return res.status(500).json({ error: "Failed to authenticate with CRM", details: err.message });
      }
    }

    // 2. Clean, Filter & Deduplicate
    const processedLeads = [];
    const seenPhones = new Set();
    const resultsResponse = {
      totalRequested: leads.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      details: []
    };

    for (const lead of leads) {
      // Local check: don't double send if manually triggered edge-case
      if (lead.pushStatus === "sent") {
        resultsResponse.details.push({ id: lead._id, status: "skipped", reason: "Already Sent" });
        continue;
      }

      const cleanedNum = cleanPhone(lead.phone);
      if (!cleanedNum) {
        await Lead.updateOne(
          { _id: lead._id }, 
          { pushStatus: "failed", errorMessage: "Invalid or missing phone", sentAt: new Date() }
        );
        resultsResponse.failed++;
        resultsResponse.details.push({ id: lead._id, status: "failed", reason: "Invalid Phone" });
        continue;
      }

      if (seenPhones.has(cleanedNum)) {
        await Lead.updateOne(
          { _id: lead._id }, 
          { pushStatus: "failed", errorMessage: "Duplicate phone in batch", sentAt: new Date() }
        );
        resultsResponse.failed++;
        resultsResponse.details.push({ id: lead._id, status: "failed", reason: "Duplicate in Batch" });
        continue;
      }

      seenPhones.add(cleanedNum);
      
      processedLeads.push({
        leadDoc: lead,
        payload: transformLead(lead, cleanedNum)
      });
    }

    resultsResponse.processed = processedLeads.length;

    // 3. Batch Executor
    const BATCH_SIZE = 15;
    const DELAY_MS = 200;

    for (let i = 0; i < processedLeads.length; i += BATCH_SIZE) {
      const batch = processedLeads.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map(async (item) => {
        const { leadDoc, payload } = item;
        
        let attempts = 0;
        let successResult = false;
        let finalError = "";

        while (attempts < 2 && !successResult) {
          attempts++;
          try {
            const apiResp = await sendLeadToCRM(payload, crmToken);
            if (apiResp.success) {
              successResult = true;
              console.log(`[CRM_SYNC] Lead ID: ${leadDoc._id} - Status: SENT`);
              await Lead.updateOne(
                { _id: leadDoc._id },
                { pushStatus: "sent", errorMessage: null, sentAt: new Date() }
              );
              resultsResponse.succeeded++;
              resultsResponse.details.push({ id: leadDoc._id, status: "sent" });
            }
          } catch (error) {
            finalError = error.message;

            if (finalError === "UNAUTHORIZED" && attempts === 1) {
              // Token expired, refresh token sequentially then retry
              console.warn(`[CRM_SYNC] Token rejected for Lead ID: ${leadDoc._id}, attempting refresh...`);
              try {
                crmToken = null;
                await getAuthToken(); // Refresh globally
              } catch (authErr) {
                finalError = `Auth Refresh Failed: ${authErr.message}`;
                break; // Break the retry loop if we can't auth
              }
            } else {
              // Standard failure (timeout, 5xx, etc)
              break;
            }
          }
        }

        if (!successResult) {
          console.error(`[CRM_SYNC] Lead ID: ${leadDoc._id} - Status: FAILED - Reason: ${finalError}`);
          await Lead.updateOne(
            { _id: leadDoc._id },
            { pushStatus: "failed", errorMessage: finalError, sentAt: new Date() }
          );
          resultsResponse.failed++;
          resultsResponse.details.push({ id: leadDoc._id, status: "failed", reason: finalError });
        }
      });

      // Execute batch concurrently
      await Promise.allSettled(batchPromises);

      // Delay between batches
      if (i + BATCH_SIZE < processedLeads.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }
    }

    return res.json(resultsResponse);

  } catch (error) {
    console.error(`[CRM_SYNC] Fatal error during sync: ${error.stack}`);
    res.status(500).json({ error: "Internal Server Error during CRM Sync", details: error.message });
  }
});

export default router;
