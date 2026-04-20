import { Router } from "express";
import { Lead } from "../models/Lead.js";
import { Activity } from "../models/Activity.js";

const CRM_STAGES = ["New Lead", "Contacted", "Qualified", "Proposal Sent", "Closed Won", "Closed Lost"];

const router = Router();

// GET /api/crm/pipeline
router.get("/pipeline", async (_req, res) => {
  try {
    const leads = await Lead.find();

    const stages = CRM_STAGES.map((stage) => ({
      stage,
      leads: leads.filter((l) => l.crmStage === stage),
    }));

    res.json({ stages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/crm/leads/:id/stage
router.put("/leads/:id/stage", async (req, res) => {
  try {
    const { stage } = req.body;
    if (!stage || !CRM_STAGES.includes(stage)) {
      return res.status(400).json({ error: "Invalid stage" });
    }

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { crmStage: stage },
      { new: true, runValidators: true }
    );

    if (!lead) return res.status(404).json({ error: "Lead not found" });

    await Activity.create({
      type: "stage_changed",
      description: `${lead.businessName} moved to ${stage}`,
      leadName: lead.businessName,
    });

    res.json(lead);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
