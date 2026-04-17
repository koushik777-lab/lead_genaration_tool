import { Router } from "express";
import { db } from "@workspace/db";
import { leadsTable, campaignsTable, activityTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";

const router = Router();

// GET /api/dashboard/stats
router.get("/dashboard/stats", async (_req, res) => {
  const [leadsStats] = await db.select({
    total: sql<number>`count(*)`,
    hot: sql<number>`count(*) filter (where score_category = 'Hot')`,
    warm: sql<number>`count(*) filter (where score_category = 'Warm')`,
    cold: sql<number>`count(*) filter (where score_category = 'Cold')`,
    contacted: sql<number>`count(*) filter (where crm_stage = 'Contacted')`,
    qualified: sql<number>`count(*) filter (where crm_stage = 'Qualified')`,
    closedWon: sql<number>`count(*) filter (where crm_stage = 'Closed Won')`,
    avgScore: sql<number>`avg(lead_score)`,
  }).from(leadsTable);

  const [campaignStats] = await db.select({
    active: sql<number>`count(*) filter (where status = 'Active')`,
    emailsSent: sql<number>`coalesce(sum(sent_count), 0)`,
  }).from(campaignsTable);

  res.json({
    totalLeads: Number(leadsStats?.total ?? 0),
    hotLeads: Number(leadsStats?.hot ?? 0),
    warmLeads: Number(leadsStats?.warm ?? 0),
    coldLeads: Number(leadsStats?.cold ?? 0),
    contactedLeads: Number(leadsStats?.contacted ?? 0),
    qualifiedLeads: Number(leadsStats?.qualified ?? 0),
    closedWon: Number(leadsStats?.closedWon ?? 0),
    activeCampaigns: Number(campaignStats?.active ?? 0),
    emailsSentThisMonth: Number(campaignStats?.emailsSent ?? 0),
    avgLeadScore: Math.round(Number(leadsStats?.avgScore ?? 0)),
  });
});

// GET /api/dashboard/lead-scores
router.get("/dashboard/lead-scores", async (_req, res) => {
  const [total] = await db.select({ count: sql<number>`count(*)` }).from(leadsTable);
  const totalCount = Number(total?.count ?? 1) || 1;

  const rows = await db.select({
    category: leadsTable.scoreCategory,
    count: sql<number>`count(*)`,
  }).from(leadsTable).groupBy(leadsTable.scoreCategory);

  const result = rows.map((r) => ({
    category: r.category,
    count: Number(r.count),
    percentage: Math.round((Number(r.count) / totalCount) * 100),
  }));

  res.json(result);
});

// GET /api/dashboard/pipeline-values
router.get("/dashboard/pipeline-values", async (_req, res) => {
  const stages = ["New Lead", "Contacted", "Qualified", "Proposal Sent", "Closed Won", "Closed Lost"];

  const rows = await db.select({
    stage: leadsTable.crmStage,
    count: sql<number>`count(*)`,
  }).from(leadsTable).groupBy(leadsTable.crmStage);

  const countMap = Object.fromEntries(rows.map((r) => [r.stage, Number(r.count)]));

  const result = stages.map((stage) => ({ stage, count: countMap[stage] ?? 0 }));
  res.json(result);
});

// GET /api/dashboard/recent-activity
router.get("/dashboard/recent-activity", async (_req, res) => {
  const activities = await db.select().from(activityTable).orderBy(desc(activityTable.createdAt)).limit(20);
  res.json(activities);
});

// GET /api/dashboard/industry-breakdown
router.get("/dashboard/industry-breakdown", async (_req, res) => {
  const rows = await db.select({
    industry: leadsTable.industry,
    count: sql<number>`count(*)`,
  }).from(leadsTable).groupBy(leadsTable.industry).orderBy(sql`count(*) desc`).limit(10);

  const result = rows
    .filter((r) => r.industry)
    .map((r) => ({ industry: r.industry!, count: Number(r.count) }));

  res.json(result);
});

export default router;
