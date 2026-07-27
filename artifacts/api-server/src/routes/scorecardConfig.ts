import { Router } from 'express';
import type { RequestHandler } from 'express';
import { sql } from 'drizzle-orm';
import { db } from '@workspace/db';
import { logger } from '../lib/logger';

const router = Router();

/* Inline auth guard — rejects unauthenticated callers with 401. */
const requireAuth: RequestHandler = (req, res, next) => {
  if (!req.session?.userId) {
    res.status(401).json({ ok: false, error: 'Authentication required' });
    return;
  }
  next();
};

/* GET /api/scorecard-config
   Returns the authenticated user's stored framework config, or null if none. */
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await db.execute(
      sql`SELECT scorecard_config FROM users WHERE id = ${req.session.userId}`,
    );
    const row = result.rows?.[0] as { scorecard_config: unknown } | undefined;
    res.json({ ok: true, config: row?.scorecard_config ?? null });
  } catch (err) {
    logger.error({ err }, '[scorecard-config] GET failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

/* PUT /api/scorecard-config
   Replaces the authenticated user's stored framework config.
   Body must be a valid ScorecardConfig:
     { weights: Record<string, number>; tiers: { strategic: number; preferred: number } } */
router.put('/', requireAuth, async (req, res) => {
  const config: unknown = req.body;
  if (
    !config ||
    typeof config !== 'object' ||
    typeof (config as Record<string, unknown>).weights !== 'object' ||
    !(config as Record<string, unknown>).weights ||
    typeof (config as Record<string, unknown>).tiers !== 'object' ||
    !(config as Record<string, unknown>).tiers
  ) {
    res.status(400).json({ ok: false, error: 'Invalid config shape' });
    return;
  }
  try {
    await db.execute(
      sql`UPDATE users
          SET scorecard_config = ${JSON.stringify(config)}::jsonb
          WHERE id = ${req.session.userId as number}`,
    );
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, '[scorecard-config] PUT failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

export default router;
