import { Router } from "express";
import { db } from "@workspace/db";
import { campaignsTable, templatesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateCampaignBody, GetCampaignParams, CreateTemplateBody } from "@workspace/api-zod";

const router = Router();

// GET /api/outreach/campaigns
router.get("/outreach/campaigns", async (_req, res) => {
  const campaigns = await db.select().from(campaignsTable).orderBy(campaignsTable.createdAt);
  res.json(campaigns);
});

// POST /api/outreach/campaigns
router.post("/outreach/campaigns", async (req, res) => {
  const parsed = CreateCampaignBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const [campaign] = await db.insert(campaignsTable).values({
    name: parsed.data.name,
    channel: parsed.data.channel,
    templateId: parsed.data.templateId ?? null,
  }).returning();

  res.status(201).json(campaign);
});

// GET /api/outreach/campaigns/:id
router.get("/outreach/campaigns/:id", async (req, res) => {
  const parsed = GetCampaignParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, parsed.data.id));
  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }

  res.json(campaign);
});

// GET /api/outreach/templates
router.get("/outreach/templates", async (_req, res) => {
  const templates = await db.select().from(templatesTable).orderBy(templatesTable.createdAt);
  res.json(templates);
});

// POST /api/outreach/templates
router.post("/outreach/templates", async (req, res) => {
  const parsed = CreateTemplateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const [template] = await db.insert(templatesTable).values({
    name: parsed.data.name,
    channel: parsed.data.channel,
    subject: parsed.data.subject ?? null,
    body: parsed.data.body,
  }).returning();

  res.status(201).json(template);
});

export default router;
