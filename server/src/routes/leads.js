import { Router } from "express";
import { Lead } from "../models/Lead.js";
import { Note } from "../models/Note.js";
import { Activity } from "../models/Activity.js";

const router = Router();

function computeScore({ noWebsite, poorSeo, mobileUnfriendly, noSocialPresence }) {
  let score = 10; // active business base
  if (noWebsite) score += 30;
  if (poorSeo) score += 25;
  if (mobileUnfriendly) score += 20;
  if (noSocialPresence) score += 15;

  let category = "Cold";
  if (score >= 60) category = "Hot";
  else if (score >= 35) category = "Warm";

  return { score, category };
}

// GET /api/leads
router.get("/", async (req, res) => {
  try {
    const { search, score, industry, status, page = 1, limit = 25 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (search) filter.businessName = { $regex: search, $options: "i" };
    if (score) filter.scoreCategory = score;
    if (industry) filter.industry = industry;
    if (status) filter.crmStage = status;

    const [leads, total] = await Promise.all([
      Lead.find(filter).sort({ leadScore: -1 }).skip(skip).limit(limitNum),
      Lead.countDocuments(filter),
    ]);

    res.json({ leads, total, page: pageNum, limit: limitNum });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/leads
router.post("/", async (req, res) => {
  try {
    const data = req.body;
    if (!data.businessName) {
      return res.status(400).json({ error: "businessName is required" });
    }

    const { score, category } = computeScore({
      noWebsite: data.noWebsite ?? false,
      poorSeo: data.poorSeo ?? false,
      mobileUnfriendly: data.mobileUnfriendly ?? false,
      noSocialPresence: data.noSocialPresence ?? false,
    });

    const lead = await Lead.create({
      ...data,
      leadScore: score,
      scoreCategory: category,
      tags: data.tags ?? [],
      crmStage: data.crmStage ?? "New Lead",
    });

    await Activity.create({
      type: "lead_created",
      description: `New lead added: ${lead.businessName}`,
      leadName: lead.businessName,
    });

    res.status(201).json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/leads/:id
router.get("/:id", async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    res.json(lead);
  } catch (err) {
    res.status(400).json({ error: "Invalid id" });
  }
});

// PUT /api/leads/:id
router.put("/:id", async (req, res) => {
  try {
    const data = req.body;
    const { score, category } = computeScore({
      noWebsite: data.noWebsite,
      poorSeo: data.poorSeo,
      mobileUnfriendly: data.mobileUnfriendly,
      noSocialPresence: data.noSocialPresence,
    });

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { ...data, leadScore: score, scoreCategory: category },
      { new: true, runValidators: true }
    );

    if (!lead) return res.status(404).json({ error: "Lead not found" });
    res.json(lead);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/leads/:id
router.delete("/:id", async (req, res) => {
  try {
    await Lead.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: "Invalid id" });
  }
});

// DELETE /api/leads (Bulk delete by tag)
router.delete("/", async (req, res) => {
  try {
    const { tag } = req.query;
    if (!tag) return res.status(400).json({ error: "tag parameter is required" });

    const result = await Lead.deleteMany({ tags: tag });
    res.json({ message: `Successfully deleted ${result.deletedCount} leads`, deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/leads/:id/notes
router.get("/:id/notes", async (req, res) => {
  try {
    const notes = await Note.find({ leadId: req.params.id }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(400).json({ error: "Invalid id" });
  }
});

// POST /api/leads/:id/notes
router.post("/:id/notes", async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "content is required" });

    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    const note = await Note.create({ leadId: req.params.id, content });

    await Activity.create({
      type: "note_added",
      description: `Note added to lead: ${lead.businessName}`,
      leadName: lead.businessName,
    });

    res.status(201).json(note);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
