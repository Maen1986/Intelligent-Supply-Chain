/**
 * /api/working-capital-analyses -- real backend persistence for the
 * Working Capital Control Tower (#169, Wave B-3, 2026-08-23).
 *
 * Same whole-state sync pattern already proven in this codebase for
 * tco_analyses: the frontend does not do per-row CRUD, it syncs the whole
 * list on every change via PUT, which transactionally replaces all of the
 * user's rows. See lib/db/src/schema/workingCapitalAnalyses.ts for the
 * full design rationale.
 *
 *   GET /api/working-capital-analyses  -- list all analyses for the
 *     authenticated user.
 *   PUT /api/working-capital-analyses  -- transactionally REPLACE all of
 *     the user's analyses with the given array. Returns the
 *     freshly-inserted rows (with real DB ids) so the frontend can
 *     reconcile them against its local clientKey values.
 *
 * Auth: session cookie only, same as /api/tco-analyses -- this is personal
 * UI state, not machine-to-machine data.
 */
import { Router } from 'express';
import { db } from '@workspace/db';
import { workingCapitalAnalysesTable, usersTable } from '@workspace/db/schema';
import { eq } from 'drizzle-orm';
import { requireSession } from '../middlewares/requireSession';
import { logger } from '../lib/logger';

const router = Router();
router.use(requireSession);

interface WorkingCapitalAnalysisPayload {
  clientKey: string;
  name: string;
  inventoryValue: number;
  dioDays: number;
  dsoDays: number;
  dpoDays: number;
  annualCogs: number;
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function isValidPayload(a: unknown): a is WorkingCapitalAnalysisPayload {
  if (!a || typeof a !== 'object') return false;
  const r = a as Record<string, unknown>;
  return typeof r.clientKey === 'string' && r.clientKey.length > 0
    && typeof r.name === 'string'
    && isFiniteNumber(r.inventoryValue)
    && isFiniteNumber(r.dioDays)
    && isFiniteNumber(r.dsoDays)
    && isFiniteNumber(r.dpoDays)
    && isFiniteNumber(r.annualCogs);
}

/* ─── GET /api/working-capital-analyses ────────────────────────────────── */

router.get('/', async (req, res) => {
  try {
    const userId = res.locals.userId as number;
    const rows = await db
      .select()
      .from(workingCapitalAnalysesTable)
      .where(eq(workingCapitalAnalysesTable.userId, userId));
    rows.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    res.json({ ok: true, analyses: rows });
  } catch (err) {
    logger.error({ err }, '[working-capital-analyses] GET failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

/* ─── PUT /api/working-capital-analyses ────────────────────────────────── */

router.put('/', async (req, res) => {
  const body = req.body as { analyses?: unknown };
  if (!Array.isArray(body.analyses) || !body.analyses.every(isValidPayload)) {
    res.status(400).json({ ok: false, error: 'Invalid analyses shape -- expected an array of {clientKey, name, inventoryValue, dioDays, dsoDays, dpoDays, annualCogs}' });
    return;
  }
  const analyses = body.analyses as WorkingCapitalAnalysisPayload[];
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
      await tx.delete(workingCapitalAnalysesTable).where(eq(workingCapitalAnalysesTable.userId, userId));
      if (analyses.length === 0) return [];
      return tx
        .insert(workingCapitalAnalysesTable)
        .values(analyses.map((a) => ({
          userId,
          organizationId,
          clientKey:      a.clientKey,
          name:           a.name,
          inventoryValue: String(a.inventoryValue),
          dioDays:        String(a.dioDays),
          dsoDays:        String(a.dsoDays),
          dpoDays:        String(a.dpoDays),
          annualCogs:     String(a.annualCogs),
        })))
        .returning();
    });

    logger.info({ userId, count: inserted.length }, '[working-capital-analyses] Synced');
    res.json({ ok: true, analyses: inserted });
  } catch (err) {
    logger.error({ err }, '[working-capital-analyses] PUT failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

export default router;
