import { Router, type IRouter } from "express";
import healthRouter from "./health";
import openaiRouter from "./openai/index";
import notifyRouter from "./notify";
import intelligenceRouter from "./intelligence";
import assessmentRouter from "./assessment";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/openai", openaiRouter);
router.use("/notify", notifyRouter);
router.use(intelligenceRouter);
router.use(assessmentRouter);

export default router;
