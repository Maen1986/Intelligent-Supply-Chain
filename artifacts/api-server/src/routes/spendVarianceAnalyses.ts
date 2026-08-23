/**
 * /api/spend-variance-analyses -- real backend persistence for the
 * Opportunity / Spend Variance Finder (#170, Wave B-3, 2026-08-23).
 *
 * Whole-state sync, identical shape to /api/tco-analyses:
 *
 *   GET /api/spend-variance-analyses  -- list all analyses for the
 *     authenticated user.
 *   PUT /api/spend-variance-analyses  -- transactionally REPLACE all of the
 *     user's analyses with the given array (delete-all + bulk-insert in one
 *     transaction). Returns the freshly-inserted rows (with real DB ids) so
 *     the frontend can reconcile them against its local clientKey values.
 *
 * Row-shape validation is intentionally light (structural checks only,
 * same depth as tco_analyses' `suppliers` validation) since `rows` is a
 * variable-length JSONB array of site/supplier comparison entries -- the
 * frontend is the source of truth for exact field names (see
 * ProcurementTools.tsx's SpendVarianceRow interface).
 *
 * Auth: session cookie only, same as /api/tco-analyses and
 * /api/working-capital-analyses -- this is personal UI state.
 */
import { Router } from 'express';
import { db } from '@workspace/db';
import { spendVarianceAnalysesTable, usersTable } from '@workspace/db/schema';
import { eq } from 'drizzle-orm';
import { requireSession } from '../middlewares/requireSession';
import { logger } from '../lib/logger';

const router = Router();
router.use(requireSession);

interface SpendVarianceAnalysisPayload {
  clientKey: string;
  name: string;
  itemSpec?: string | null;
  rows: unknown[];
}

function isValidPayload(a: unknown): a is SpendVarianceAnalysisPayload {
  if (!a || typeof a !== 'object') return false;
  const r = a as Record<string, unknown>;
  return typeof r.clientKey === 'string' && r.clientKey.length > 0
    && typeof r.name === 'string'
    && Array.isArray(r.rows);
}

/* ─── GET /api/spend-variance-analyses ─────────────────────────────────── */

router.get('/', async (req, res) => {
  try {
    const userId = res.locals.userId as number;
    const rows = await db
      .select()
      .from(spendVarianceAnalysesTable)
      .where(eq(spendVarianceAnalysesTable.userId, userId));
    rows.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    res.json({ ok: true, analyses: rows });
  } catch (err) {
    logger.error({ err }, '[spend-variance-analyses] GET failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

/* ─── PUT /api/spend-variance-analyses ─────────────────────────────────── */

router.put('/', async (req, res) => {
  const body = req.body as { analyses?: unknown };
  if (!Array.isArray(body.analyses) || !body.analyses.every(isValidPayload)) {
    res.status(400).json({ ok: false, error: 'Invalid analyses shape -- expected an array of {clientKey, name, rows, ...}' });
    return;
  }
  const analyses = body.analyses as SpendVarianceAnalysisPayload[];
  if (analyses.length > 50) {
    res.status(400).json({ ok: false, error: 'Too many analyses in one sync (max 50)' });
    return;
  }
  try {
    const userId = res.locals.userId as number;
    const [userRow] = await db
      .select({ organizationId: usersTable.organizationId })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    const organizationId = userRow?.organizationId ?? null;

    const inserted = await db.transaction(async (tx) => {
      await tx.delete(spendVarianceAnalysesTable).where(eq(spendVarianceAnalysesTable.userId, userId));
      if (analyses.length === 0) return [];
      return tx
        .insert(spendVarianceAnalysesTable)
        .values(analyses.map((a) => ({
          userId,
          organizationId,
          clientKey: a.clientKey,
          name:      a.name,
          itemSpec:  a.itemSpec ?? null,
          rows:      a.rows,
        })))
        .returning();
    });

    logger.info({ userId, count: inserted.length }, '[spend-variance-analyses] Synced');
    res.json({ ok: true, analyses: inserted });
  } catch (err) {
    logger.error({ err }, '[spend-variance-analyses] PUT failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

export default router;
