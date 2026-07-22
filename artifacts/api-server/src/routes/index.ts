import { Router, type IRouter } from "express";
import healthRouter       from "./health";
import openaiRouter       from "./openai/index";
import notifyRouter       from "./notify";
import intelligenceRouter from "./intelligence";
import assessmentRouter   from "./assessment";
import authRouter         from "./auth";
import submissionsRouter  from "./submissions";
import debugRouter        from "./debug";
import consultancyRouter  from "./consultancy";
import { authRateLimiter } from "../lib/rateLimit";
import leadsRouter        from "./leads";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/openai",       openaiRouter);
router.use("/notify",       notifyRouter);
router.use("/auth",         authRateLimiter, authRouter);
router.use("/submissions",  submissionsRouter);
router.use("/consultancy",  consultancyRouter);
router.use("/leads",        leadsRouter);
router.use("/debug",        debugRouter);
router.use(intelligenceRouter);
router.use(assessmentRouter);

export default router;
