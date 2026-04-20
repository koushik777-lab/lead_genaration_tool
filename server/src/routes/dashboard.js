import { Router } from "express";
import { Lead } from "../models/Lead.js";
import { Campaign } from "../models/Campaign.js";
import { Activity } from "../models/Activity.js";

const router = Router();

// GET /api/dashboard/stats
router.get("/stats", async (_req, res) => {
  try {
    const [leadsStats, campaignStats] = await Promise.all([
      Lead.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            hot: { $sum: { $cond: [{ $eq: ["$scoreCategory", "Hot"] }, 1, 0] } },
            warm: { $sum: { $cond: [{ $eq: ["$scoreCategory", "Warm"] }, 1, 0] } },
            cold: { $sum: { $cond: [{ $eq: ["$scoreCategory", "Cold"] }, 1, 0] } },
            contacted: { $sum: { $cond: [{ $eq: ["$crmStage", "Contacted"] }, 1, 0] } },
            qualified: { $sum: { $cond: [{ $eq: ["$crmStage", "Qualified"] }, 1, 0] } },
            closedWon: { $sum: { $cond: [{ $eq: ["$crmStage", "Closed Won"] }, 1, 0] } },
            avgScore: { $avg: "$leadScore" },
          },
        },
      ]),
      Campaign.aggregate([
        {
          $group: {
            _id: null,
            active: { $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] } },
            emailsSent: { $sum: "$sentCount" },
          },
        },
      ]),
    ]);

    const ls = leadsStats[0] || {};
    const cs = campaignStats[0] || {};

    res.json({
      totalLeads: ls.total ?? 0,
      hotLeads: ls.hot ?? 0,
      warmLeads: ls.warm ?? 0,
      coldLeads: ls.cold ?? 0,
      contactedLeads: ls.contacted ?? 0,
      qualifiedLeads: ls.qualified ?? 0,
      closedWon: ls.closedWon ?? 0,
      activeCampaigns: cs.active ?? 0,
      emailsSentThisMonth: cs.emailsSent ?? 0,
      avgLeadScore: Math.round(ls.avgScore ?? 0),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/lead-scores
router.get("/lead-scores", async (_req, res) => {
  try {
    const total = await Lead.countDocuments();
    const totalCount = total || 1;

    const rows = await Lead.aggregate([
      { $group: { _id: "$scoreCategory", count: { $sum: 1 } } },
    ]);

    const result = rows.map((r) => ({
      category: r._id,
      count: r.count,
      percentage: Math.round((r.count / totalCount) * 100),
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/pipeline-values
router.get("/pipeline-values", async (_req, res) => {
  try {
    const stages = ["New Lead", "Contacted", "Qualified", "Proposal Sent", "Closed Won", "Closed Lost"];

    const rows = await Lead.aggregate([
      { $group: { _id: "$crmStage", count: { $sum: 1 } } },
    ]);

    const countMap = Object.fromEntries(rows.map((r) => [r._id, r.count]));
    const result = stages.map((stage) => ({ stage, count: countMap[stage] ?? 0 }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/recent-activity
router.get("/recent-activity", async (_req, res) => {
  try {
    const activities = await Activity.find().sort({ createdAt: -1 }).limit(20);
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/industry-breakdown
router.get("/industry-breakdown", async (_req, res) => {
  try {
    const rows = await Lead.aggregate([
      { $match: { industry: { $ne: null, $exists: true } } },
      { $group: { _id: "$industry", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const result = rows.map((r) => ({ industry: r._id, count: r.count }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
