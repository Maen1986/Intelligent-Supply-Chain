/**
 * Industry Benchmark routes
 *
 * GET /api/benchmarks/mine — the requesting user's own most recent Maturity
 *   Assessment, compared segment-by-segment against the anonymized
 *   industry-benchmarks cohort. Registry #398 (Score-Max Plan v3 lever 3),
 *   built 30 Aug 2026. See lib/industryBenchmarks.ts for the aggregation
 *   logic and the privacy-floor discipline.
 *
 * Deliberately takes no params -- always the caller's own latest snapshot,
 * so there is no way to probe another industry/company-size cohort.
 */
import { Router }   from 'express';
import { requireSession } from '../middlewares/requireSession';
import { getBenchmarkComparisonForUser, MIN_COHORT_SIZE } from '../lib/industryBenchmarks';
import { logger }   from '../lib/logger';

const router = Router();

router.get('/benchmarks/mine', requireSession, async (req, res) => {
  const userId = res.locals.userId as number;
  try {
    const result = await getBenchmarkComparisonForUser(userId);
    res.json({ ok: true, minCohortSize: MIN_COHORT_SIZE, ...result });
  } catch (err) {
    logger.error({ err }, '[benchmarks/mine] failed');
    res.status(500).json({ ok: false, error: 'Failed to load benchmark comparison' });
  }
});

export default router;
