import { Router, type IRouter } from "express";
import healthRouter from "./health";
import openaiRouter from "./openai/index";
import notifyRouter from "./notify";
import intelligenceRouter from "./intelligence";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/openai", openaiRouter);
router.use("/notify", notifyRouter);
router.use(intelligenceRouter);

export default router;
