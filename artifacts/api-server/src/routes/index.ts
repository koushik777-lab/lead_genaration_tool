import { Router, type IRouter } from "express";
import healthRouter from "./health";
import leadsRouter from "./leads";
import crmRouter from "./crm";
import outreachRouter from "./outreach";
import dashboardRouter from "./dashboard";
import searchRouter from "./search";

const router: IRouter = Router();

router.use(healthRouter);
router.use(leadsRouter);
router.use(crmRouter);
router.use(outreachRouter);
router.use(dashboardRouter);
router.use(searchRouter);

export default router;
