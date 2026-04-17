import { Router } from "express";
import { db } from "@workspace/db";
import { leadsTable, notesTable, activityTable } from "@workspace/db";
import { eq, ilike, and, desc, sql } from "drizzle-orm";
import {
  ListLeadsQueryParams,
  CreateLeadBody,
  GetLeadParams,
  UpdateLeadBody,
  UpdateLeadParams,
  DeleteLeadParams,
  GetLeadNotesParams,
  AddLeadNoteParams,
  AddLeadNoteBody,
} from "@workspace/api-zod";

const router = Router();

function computeScore(data: {
  noWebsite?: boolean | null;
  poorSeo?: boolean | null;
  mobileUnfriendly?: boolean | null;
  noSocialPresence?: boolean | null;
}): { score: number; category: string } {
  let score = 0;
  if (data.noWebsite) score += 30;
  if (data.poorSeo) score += 25;
  if (data.mobileUnfriendly) score += 20;
  if (data.noSocialPresence) score += 15;
  score += 10; // active business base

  let category = "Cold";
  if (score >= 60) category = "Hot";
  else if (score >= 35) category = "Warm";

  return { score, category };
}

// GET /api/leads
router.get("/leads", async (req, res) => {
  const parsed = ListLeadsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }

  const { search, score, industry, status, page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (search) {
    conditions.push(ilike(leadsTable.businessName, `%${search}%`));
  }
  if (score) {
    conditions.push(eq(leadsTable.scoreCategory, score));
  }
  if (industry) {
    conditions.push(eq(leadsTable.industry, industry));
  }
  if (status) {
    conditions.push(eq(leadsTable.crmStage, status));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [leads, countResult] = await Promise.all([
    db.select().from(leadsTable).where(whereClause).orderBy(desc(leadsTable.leadScore)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(leadsTable).where(whereClause),
  ]);

  res.json({
    leads,
    total: Number(countResult[0]?.count ?? 0),
    page,
    limit,
  });
});

// POST /api/leads
router.post("/leads", async (req, res) => {
  const parsed = CreateLeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", details: parsed.error.issues });
    return;
  }

  const data = parsed.data;
  const { score, category } = computeScore(data);

  const [lead] = await db.insert(leadsTable).values({
    ...data,
    tags: data.tags ?? [],
    noWebsite: data.noWebsite ?? false,
    poorSeo: data.poorSeo ?? false,
    noSocialPresence: data.noSocialPresence ?? false,
    mobileUnfriendly: data.mobileUnfriendly ?? false,
    crmStage: data.crmStage ?? "New Lead",
    leadScore: score,
    scoreCategory: category,
  }).returning();

  await db.insert(activityTable).values({
    type: "lead_created",
    description: `New lead added: ${lead.businessName}`,
    leadName: lead.businessName,
  });

  res.status(201).json(lead);
});

// GET /api/leads/:id
router.get("/leads/:id", async (req, res) => {
  const parsed = GetLeadParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.id, parsed.data.id));
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }

  res.json(lead);
});

// PUT /api/leads/:id
router.put("/leads/:id", async (req, res) => {
  const paramParsed = UpdateLeadParams.safeParse({ id: Number(req.params.id) });
  if (!paramParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const bodyParsed = UpdateLeadBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid body", details: bodyParsed.error.issues });
    return;
  }

  const data = bodyParsed.data;
  const { score, category } = computeScore({
    noWebsite: data.noWebsite,
    poorSeo: data.poorSeo,
    mobileUnfriendly: data.mobileUnfriendly,
    noSocialPresence: data.noSocialPresence,
  });

  const [lead] = await db
    .update(leadsTable)
    .set({
      ...data,
      leadScore: score,
      scoreCategory: category,
      updatedAt: new Date(),
    })
    .where(eq(leadsTable.id, paramParsed.data.id))
    .returning();

  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }

  res.json(lead);
});

// DELETE /api/leads/:id
router.delete("/leads/:id", async (req, res) => {
  const parsed = DeleteLeadParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  await db.delete(leadsTable).where(eq(leadsTable.id, parsed.data.id));
  res.status(204).send();
});

// GET /api/leads/:id/notes
router.get("/leads/:id/notes", async (req, res) => {
  const parsed = GetLeadNotesParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const notes = await db
    .select()
    .from(notesTable)
    .where(eq(notesTable.leadId, parsed.data.id))
    .orderBy(desc(notesTable.createdAt));

  res.json(notes);
});

// POST /api/leads/:id/notes
router.post("/leads/:id/notes", async (req, res) => {
  const paramParsed = AddLeadNoteParams.safeParse({ id: Number(req.params.id) });
  if (!paramParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const bodyParsed = AddLeadNoteBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const [note] = await db.insert(notesTable).values({
    leadId: paramParsed.data.id,
    content: bodyParsed.data.content,
  }).returning();

  const [lead] = await db.select({ businessName: leadsTable.businessName }).from(leadsTable).where(eq(leadsTable.id, paramParsed.data.id));

  await db.insert(activityTable).values({
    type: "note_added",
    description: `Note added to lead: ${lead?.businessName ?? "Unknown"}`,
    leadName: lead?.businessName,
  });

  res.status(201).json(note);
});

export default router;
