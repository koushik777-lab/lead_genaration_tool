import { Router } from "express";
import { Campaign } from "../models/Campaign.js";
import { Template } from "../models/Template.js";

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
