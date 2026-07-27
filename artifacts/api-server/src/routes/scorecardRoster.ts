import { Router } from 'express';
import type { RequestHandler } from 'express';
import { sql } from 'drizzle-orm';
import { db } from '@workspace/db';
import { logger } from '../lib/logger';
import { dispatchEvent } from '../lib/webhookDispatch';

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
    const userId = req.session.userId as number;

    // Fetch existing roster to detect tier changes before overwriting
    const existing = await db.execute(
      sql`SELECT scorecard_roster FROM users WHERE id = ${userId}`,
    );
    const existingRoster = (existing.rows?.[0] as { scorecard_roster: unknown } | undefined)
      ?.scorecard_roster;

    // Build map of supplierId → tier from the old roster
    const oldTierMap = new Map<string, string>();
    if (
      existingRoster &&
      typeof existingRoster === 'object' &&
      Array.isArray((existingRoster as Record<string, unknown>).suppliers)
    ) {
      for (const s of (existingRoster as { suppliers: unknown[] }).suppliers) {
        if (s && typeof s === 'object') {
          const r = s as Record<string, unknown>;
          if (typeof r.id === 'string' && typeof r.tier === 'string') {
            oldTierMap.set(r.id, r.tier);
          }
        }
      }
    }

    await db.execute(
      sql`UPDATE users
          SET scorecard_roster = ${JSON.stringify(roster)}::jsonb
          WHERE id = ${userId}`,
    );

    // Dispatch supplier.tier_changed for each supplier whose tier differs
    const newSuppliers = (roster as { suppliers: unknown[] }).suppliers;
    for (const s of newSuppliers) {
      if (s && typeof s === 'object') {
        const r = s as Record<string, unknown>;
        if (typeof r.id === 'string' && typeof r.tier === 'string') {
          const oldTier = oldTierMap.get(r.id);
          if (oldTier !== undefined && oldTier !== r.tier) {
            dispatchEvent(userId, 'supplier.tier_changed', {
              supplierId: r.id,
              supplierName: typeof r.name === 'string' ? r.name : r.id,
              oldTier,
              newTier: r.tier,
            });
          }
        }
      }
    }

    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, '[scorecard-roster] PUT failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

export default router;
