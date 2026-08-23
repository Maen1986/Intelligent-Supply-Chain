/**
 * /api/tco-analyses -- real backend persistence for the TCO Engine (#168 v3,
 * "maximum technical and consultancy wise" enhancement, 2026-08-23).
 *
 * Two routes, mirroring the whole-state sync pattern already proven in this
 * codebase for scorecard-roster, but backed by a real per-row table
 * (tco_analyses) instead of a JSONB blob column, so each analysis is
 * independently queryable server-side (used by the Portfolio comparison
 * view). See lib/db/src/schema/tcoAnalyses.ts for the full design
 * rationale, including why this is user-scoped rather than org-scoped.
 *
 *   GET /api/tco-analyses  -- list all analyses for the authenticated user.
 *   PUT /api/tco-analyses  -- transactionally REPLACE all of the user's
 *     analyses with the given array (delete-all + bulk-insert in one
 *     transaction). Returns the freshly-inserted rows (with real DB ids) so
 *     the frontend can reconcile them against its local clientKey values.
 *
 * Auth: session cookie only, same as /api/plans and /api/scorecard-roster --
 * this is personal UI state, not machine-to-machine data.
 */
import { Router } from 'express';
import { db } from '@workspace/db';
import { tcoAnalysesTable, usersTable } from '@workspace/db/schema';
import { eq } from 'drizzle-orm';
import { requireSession } from '../middlewares/requireSession';
import { logger } from '../lib/logger';

const router = Router();
router.use(requireSession);

interface TcoAnalysisPayload {
  clientKey: string;
  name: string;
  industry?: string | null;
  subSector?: string | null;
  skuClass?: string | null;
  itemName?: string | null;
  suppliers: unknown[];
}

function isValidPayload(a: unknown): a is TcoAnalysisPayload {
  if (!a || typeof a !== 'object') return false;
  const r = a as Record<string, unknown>;
  return typeof r.clientKey === 'string' && r.clientKey.length > 0
    && typeof r.name === 'string'
    && Array.isArray(r.suppliers);
}

/* ─── GET /api/tco-analyses ────────────────────────────────────────────── */

router.get('/', async (req, res) => {
  try {
    const userId = res.locals.userId as number;
    const rows = await db
      .select()
      .from(tcoAnalysesTable)
      .where(eq(tcoAnalysesTable.userId, userId));
    // Newest-edited first -- matches the analysis switcher's expected order.
    rows.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    res.json({ ok: true, analyses: rows });
  } catch (err) {
    logger.error({ err }, '[tco-analyses] GET failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

/* ─── PUT /api/tco-analyses ────────────────────────────────────────────── */

router.put('/', async (req, res) => {
  const body = req.body as { analyses?: unknown };
  if (!Array.isArray(body.analyses) || !body.analyses.every(isValidPayload)) {
    res.status(400).json({ ok: false, error: 'Invalid analyses shape -- expected an array of {clientKey, name, suppliers, ...}' });
    return;
  }
  const analyses = body.analyses as TcoAnalysisPayload[];
  if (analyses.length > 50) {
    res.status(400).json({ ok: false, error: 'Too many analyses in one sync (max 50)' });
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
      await tx.delete(tcoAnalysesTable).where(eq(tcoAnalysesTable.userId, userId));
      if (analyses.length === 0) return [];
      return tx
        .insert(tcoAnalysesTable)
        .values(analyses.map((a) => ({
          userId,
          organizationId,
          clientKey:  a.clientKey,
          name:       a.name,
          industry:   a.industry ?? null,
          subSector:  a.subSector ?? null,
          skuClass:   a.skuClass ?? null,
          itemName:   a.itemName ?? null,
          suppliers:  a.suppliers,
        })))
        .returning();
    });

    logger.info({ userId, count: inserted.length }, '[tco-analyses] Synced');
    res.json({ ok: true, analyses: inserted });
  } catch (err) {
    logger.error({ err }, '[tco-analyses] PUT failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

export default router;
