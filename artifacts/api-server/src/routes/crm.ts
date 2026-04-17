import { Router } from "express";
import { db } from "@workspace/db";
import { leadsTable, activityTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateLeadStageParams, UpdateLeadStageBody } from "@workspace/api-zod";

const router = Router();

const CRM_STAGES = [
  "New Lead",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Closed Won",
  "Closed Lost",
];

// GET /api/crm/pipeline
router.get("/crm/pipeline", async (_req, res) => {
  const leads = await db.select().from(leadsTable);

  const stages = CRM_STAGES.map((stage) => ({
    stage,
    leads: leads.filter((l) => l.crmStage === stage),
  }));

  res.json({ stages });
});

// PUT /api/crm/leads/:id/stage
router.put("/crm/leads/:id/stage", async (req, res) => {
  const paramParsed = UpdateLeadStageParams.safeParse({ id: Number(req.params.id) });
  if (!paramParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const bodyParsed = UpdateLeadStageBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const [lead] = await db
    .update(leadsTable)
    .set({ crmStage: bodyParsed.data.stage, updatedAt: new Date() })
    .where(eq(leadsTable.id, paramParsed.data.id))
    .returning();

  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }

  await db.insert(activityTable).values({
    type: "stage_changed",
    description: `${lead.businessName} moved to ${bodyParsed.data.stage}`,
    leadName: lead.businessName,
  });

  res.json(lead);
});

export default router;
