/**
 * /api/rar-analyses -- real backend persistence for the RAR calculator's
 * saved "what-if scenarios" (#182 Disruption Simulator extension of RAR,
 * Wave B-6, 2026-08-24).
 *
 * Whole-state sync, same shape as /api/tco-analyses,
 * /api/spend-variance-analyses, and /api/clm-contracts:
 *
 *   GET /api/rar-analyses  -- list all saved scenarios for the
 *     authenticated user. The RAR *baseline* (rarNodes/rarMeta) is not
 *     stored here -- it stays in localStorage as the always-editable
 *     "current" calculation, exactly as before this change. Only saved
 *     what-if scenarios round-trip through this route.
 *   PUT /api/rar-analyses  -- transactionally REPLACE all of the user's
 *     scenarios with the given array (delete-all + bulk-insert in one
 *     transaction). Returns the freshly-inserted rows (with real DB ids) so
 *     the frontend can reconcile them against its local clientKey values.
 *
 * `data` validation is intentionally light (structural checks only, same
 * depth as tco_analyses'/clm_contracts' validation) since the RarScenario
 * shape ({ nodes, meta }) is defined and owned by the frontend (see
 * ResiliencyTools.tsx) -- this route does not duplicate that shape.
 *
 * Auth: session cookie only, same as /api/tco-analyses,
 * /api/working-capital-analyses, /api/spend-variance-analyses, and
 * /api/clm-contracts -- this is personal UI state, not machine-to-machine
 * data.
 */
import { Router } from 'express';
import { db } from '@workspace/db';
import { rarAnalysesTable, usersTable } from '@workspace/db/schema';
import { eq } from 'drizzle-orm';
import { requireSession } from '../middlewares/requireSession';
import { logger } from '../lib/logger';

const router = Router();
router.use(requireSession);

/** Kept at the 50-scenario cap used for TCO/spend-variance "analyses" (not
 *  clm_contracts' 500-row inventory cap) -- see schema file header: RAR
 *  what-if scenarios are, by design, a handful of named comparisons against
 *  one baseline, not a business register. */
const MAX_ANALYSES_PER_SYNC = 50;

interface RarAnalysisPayload {
  clientKey: string;
  name: string;
  data: Record<string, unknown>;
}

function isValidPayload(a: unknown): a is RarAnalysisPayload {
  if (!a || typeof a !== 'object') return false;
  const r = a as Record<string, unknown>;
  return typeof r.clientKey === 'string' && r.clientKey.length > 0
    && typeof r.name === 'string'
    && typeof r.data === 'object' && r.data !== null && !Array.isArray(r.data);
}

/* ─── GET /api/rar-analyses ─────────────────────────────────────────────── */

router.get('/', async (req, res) => {
  try {
    const userId = res.locals.userId as number;
    const rows = await db
      .select()
      .from(rarAnalysesTable)
      .where(eq(rarAnalysesTable.userId, userId));
    // Newest-edited first -- matches the tco/spend-variance/clm-contracts
    // list convention.
    rows.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    res.json({ ok: true, analyses: rows });
  } catch (err) {
    logger.error({ err }, '[rar-analyses] GET failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

/* ─── PUT /api/rar-analyses ─────────────────────────────────────────────── */

router.put('/', async (req, res) => {
  const body = req.body as { analyses?: unknown };
  if (!Array.isArray(body.analyses) || !body.analyses.every(isValidPayload)) {
    res.status(400).json({ ok: false, error: 'Invalid analyses shape -- expected an array of {clientKey, name, data}' });
    return;
  }
  const analyses = body.analyses as RarAnalysisPayload[];
  if (analyses.length > MAX_ANALYSES_PER_SYNC) {
    res.status(400).json({ ok: false, error: `Too many analyses in one sync (max ${MAX_ANALYSES_PER_SYNC})` });
    return;
  }
  try {
    const userId = res.locals.userId as number;

    // Look up the user's current organization_id (may be null) so new rows
    // carry it -- see schema file header for why this is captured but not
    // yet used for access control.
    const [userRow] = await db
      .select({ organizationId: usersTable.organizationId })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    const organizationId = userRow?.organizationId ?? null;

    const inserted = await db.transaction(async (tx) => {
      await tx.delete(rarAnalysesTable).where(eq(rarAnalysesTable.userId, userId));
      if (analyses.length === 0) return [];
      return tx
        .insert(rarAnalysesTable)
        .values(analyses.map((a) => ({
          userId,
          organizationId,
          clientKey: a.clientKey,
          name:      a.name,
          data:      a.data,
        })))
        .returning();
    });

    logger.info({ userId, count: inserted.length }, '[rar-analyses] Synced');
    res.json({ ok: true, analyses: inserted });
  } catch (err) {
    logger.error({ err }, '[rar-analyses] PUT failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

export default router;
