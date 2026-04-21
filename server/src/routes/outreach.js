import { Router } from "express";
import mongoose from "mongoose";
import { Campaign } from "../models/Campaign.js";
import { Template } from "../models/Template.js";
import { Lead } from "../models/Lead.js";
import { addEmailToQueue } from "../lib/queue.js";
import logger from "../lib/logger.js";

const router = Router();

// GET /api/outreach/campaigns
router.get("/campaigns", async (_req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: 1 });
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/outreach/campaigns
router.post("/campaigns", async (req, res) => {
  try {
    const { name, channel, templateId } = req.body;
    if (!name || !channel) {
      return res.status(400).json({ error: "name and channel are required" });
    }

    const campaign = await Campaign.create({
      name,
      channel,
      templateId: templateId ?? null,
    });

    res.status(201).json(campaign);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/outreach/campaigns/:id
router.get("/campaigns/:id", async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    res.json(campaign);
  } catch (err) {
    res.status(400).json({ error: "Invalid id" });
  }
});

// POST /api/outreach/campaigns/:id/execute
router.post("/campaigns/:id/execute", async (req, res) => {
  let session = null;
  try {
    const isReplicaSet = mongoose.connection.host.includes("replicaSet") || 
                         await mongoose.connection.db.admin().serverStatus().then(s => !!s.repl);
    
    if (isReplicaSet) {
      session = await mongoose.startSession();
      session.startTransaction();
    }

    const { tag } = req.body;
    if (!tag) throw new Error("tag is required to target leads");

    const campaign = await Campaign.findById(req.params.id).populate("templateId").session(session);
    if (!campaign) throw new Error("Campaign not found");
    if (!campaign.templateId) throw new Error("Campaign has no template");

    const leads = await Lead.find({ tags: tag, email: { $ne: null, $exists: true } }).session(session);
    if (leads.length === 0) throw new Error("No leads found with this tag and email");

    logger.info(`Queuing campaign ${campaign.name} for ${leads.length} leads`);

    for (const lead of leads) {
      await addEmailToQueue({
        to: lead.email,
        subject: campaign.templateId.subject || `Message from LeadForge`,
        html: campaign.templateId.body.replace("{{name}}", lead.businessName),
        text: campaign.templateId.body.replace("{{name}}", lead.businessName),
      });
    }

    campaign.sentCount += leads.length;
    campaign.status = "Active";
    await campaign.save({ session });

    if (session) await session.commitTransaction();
    res.json({
      message: `Enqueued ${leads.length} emails for delivery`,
      totalLeads: leads.length,
    });
  } catch (err) {
    if (session) await session.abortTransaction();
    res.status(500).json({ error: err.message });
  } finally {
    if (session) session.endSession();
  }
});

// GET /api/outreach/templates
router.get("/templates", async (_req, res) => {
  try {
    const templates = await Template.find().sort({ createdAt: 1 });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/outreach/templates
router.post("/templates", async (req, res) => {
  try {
    const { name, channel, subject, body } = req.body;
    if (!name || !channel || !body) {
      return res.status(400).json({ error: "name, channel, and body are required" });
    }

    const template = await Template.create({ name, channel, subject: subject ?? null, body });
    res.status(201).json(template);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
