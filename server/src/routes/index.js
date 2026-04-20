import { Router } from "express";
import leadsRouter from "./leads.js";
import dashboardRouter from "./dashboard.js";
import crmRouter from "./crm.js";
import outreachRouter from "./outreach.js";
import searchRouter from "./search.js";

const router = Router();

router.get("/health", (_req, res) => res.json({ status: "ok" }));

router.use("/leads", leadsRouter);
router.use("/dashboard", dashboardRouter);
router.use("/crm", crmRouter);
router.use("/outreach", outreachRouter);
router.use("/search", searchRouter);

export default router;
