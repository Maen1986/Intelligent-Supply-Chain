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

/* GET /api/scorecard-roster
   Returns the authenticated user's stored roster JSON, or null if none yet. */
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await db.execute(
      sql`SELECT scorecard_roster FROM users WHERE id = ${req.session.userId}`,
    );
    const row = result.rows?.[0] as { scorecard_roster: unknown } | undefined;
    res.json({ ok: true, roster: row?.scorecard_roster ?? null });
  } catch (err) {
    logger.error({ err }, '[scorecard-roster] GET failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

/* PUT /api/scorecard-roster
   Replaces the authenticated user's stored roster. Body must be a valid
   RosterState: { suppliers: SupplierRecord[]; activeId: string }            */
router.put('/', requireAuth, async (req, res) => {
  const roster: unknown = req.body;
  if (
    !roster ||
    typeof roster !== 'object' ||
    !Array.isArray((roster as Record<string, unknown>).suppliers)
  ) {
    res.status(400).json({ ok: false, error: 'Invalid roster shape' });
    return;
  }
  try {
    await db.execute(
      sql`UPDATE users
          SET scorecard_roster = ${JSON.stringify(roster)}::jsonb
          WHERE id = ${req.session.userId}`,
    );
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, '[scorecard-roster] PUT failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

export default router;
