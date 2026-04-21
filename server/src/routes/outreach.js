import { Router } from "express";
import { Campaign } from "../models/Campaign.js";
import { Template } from "../models/Template.js";
import { Activity } from "../models/Activity.js";

const router = Router();

// GET all campaigns
router.get("/campaigns", async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 }).populate("templateId");
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch campaigns", details: err.message });
  }
});

// GET single campaign
router.get("/campaigns/:id", async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).populate("templateId");
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch campaign", details: err.message });
  }
});

// POST new campaign
router.post("/campaigns", async (req, res) => {
  try {
    const { name, channel, templateId, isScheduled, scheduledAt } = req.body;
    const campaign = new Campaign({
      name,
      channel,
      templateId,
      status: isScheduled ? "Active" : "Draft",
      isScheduled: isScheduled || false,
      scheduledAt: scheduledAt || null,
    });
    await campaign.save();

    await Activity.create({
      type: "Campaign Created",
      description: `Created new ${channel} campaign: ${name}`,
    });

    res.status(201).json(campaign);
  } catch (err) {
    res.status(400).json({ error: "Failed to create campaign", details: err.message });
  }
});

// POST toggle campaign status (Play/Pause logic)
router.post("/campaigns/:id/toggle", async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });

    // Dummy engine behavior
    if (campaign.status === "Draft" || campaign.status === "Paused") {
      campaign.status = "Active";
    } else if (campaign.status === "Active") {
      campaign.status = "Paused";
    } else {
      campaign.status = "Draft"; // reset completed ones
    }
    await campaign.save();
    
    await Activity.create({
      type: "Campaign Status Updated",
      description: `Campaign ${campaign.name} marked as ${campaign.status}`
    });

    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: "Failed to update campaign", details: err.message });
  }
});

// GET all templates
router.get("/templates", async (req, res) => {
  try {
    const templates = await Template.find().sort({ createdAt: -1 });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch templates", details: err.message });
  }
});

// POST new template
router.post("/templates", async (req, res) => {
  try {
    const { name, channel, subject, body } = req.body;
    const template = new Template({
      name,
      channel,
      subject,
      body,
    });
    await template.save();

    await Activity.create({
      type: "Template Created",
      description: `Created new ${channel} template: ${name}`,
    });

    res.status(201).json(template);
  } catch (err) {
    res.status(400).json({ error: "Failed to create template", details: err.message });
  }
});

export default router;
