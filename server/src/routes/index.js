import { Router } from "express";
import authRouter from "./auth.js";
import leadsRouter from "./leads.js";
import dashboardRouter from "./dashboard.js";
import crmRouter from "./crm.js";
import outreachRouter from "./outreach.js";
import searchRouter from "./search.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.get("/health", (_req, res) => res.json({ status: "ok" }));

router.use("/auth", authRouter);

// Protected routes
router.use("/leads", protect, leadsRouter);
router.use("/dashboard", protect, dashboardRouter);
router.use("/crm", protect, crmRouter);
router.use("/outreach", protect, outreachRouter);
router.use("/search", protect, searchRouter);

export default router;
