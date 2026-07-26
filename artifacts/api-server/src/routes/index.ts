import { Router, type IRouter } from "express";
import healthRouter          from "./health";
import openaiRouter          from "./openai/index";
import notifyRouter          from "./notify";
import intelligenceRouter    from "./intelligence";
import assessmentRouter      from "./assessment";
import authRouter            from "./auth";
import submissionsRouter     from "./submissions";
import debugRouter           from "./debug";
import consultancyRouter     from "./consultancy";
import leadsRouter           from "./leads";
import feedbackRouter        from "./feedback";
import scorecardRosterRouter from "./scorecardRoster";
import v1Router              from "./v1";
import integrationsRouter    from "./integrations";
import aiPlanRouter          from "./aiPlan";
import plansRouter           from "./plans";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/openai",            openaiRouter);
router.use("/notify",            notifyRouter);
router.use("/auth",              authRouter);
router.use("/submissions",       submissionsRouter);
router.use("/consultancy",       consultancyRouter);
router.use("/leads",             leadsRouter);
router.use("/feedback",          feedbackRouter);
router.use("/debug",             debugRouter);
router.use("/scorecard-roster",  scorecardRosterRouter);
router.use("/v1",                v1Router);
router.use("/integrations",      integrationsRouter);
router.use("/plans",             plansRouter);
router.use(aiPlanRouter);
router.use(intelligenceRouter);
router.use(assessmentRouter);

export default router;
