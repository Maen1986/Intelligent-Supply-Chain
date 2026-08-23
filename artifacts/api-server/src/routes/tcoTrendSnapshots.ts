/**
 * /api/tco-trend-snapshots -- real backend persistence for TCO trend
 * history (#168 TCO reporting, 2026-08-23).
 *
 * One row per (user, analysis, calendar month). See
 * lib/db/src/schema/tcoTrendSnapshots.ts for the full design rationale.
 *
 *   POST /api/tco-trend-snapshots  -- capture (or replace) this month's
 *     best-TCO snapshot for one analysis. The month is computed server-side
 *     from the current date -- never trusts a client-sent month -- so a
 *     snapshot can't be backdated. Upserts on the (user, analysisClientKey,
 *     month) UNIQUE constraint: calling this again later in the same month
 *     replaces that month's figure with the latest one.
 *
 *   GET /api/tco-trend-snapshots?analysisClientKey=... -- list this user's
 *     snapshots for one analysis, oldest first, capped to the most recent
 *     12 months (matches Supplier Scorecard's trend window).
 *
 * Auth: session cookie only, same as /api/tco-analyses -- this is personal
 * UI state, not machine-to-machine data.
 */
import { Router } from 'express';
import { db } from '@workspace/db';
import { tcoTrendSnapshotsTable } from '@workspace/db/schema';
import { and, eq, desc } from 'drizzle-orm';
import { requireSession } from '../middlewares/requireSession';
import { logger } from '../lib/logger';

const router = Router();
router.use(requireSession);

const MAX_MONTHS = 12;

interface SnapshotPayload {
  analysisClientKey: string;
  analysisName: string;
  itemName?: string | null;
  bestSupplierName?: string | null;
  bestTcoPerUnit: number;
  bestTcoAnnual?: number | null;
  savingsPct?: number | null;
  supplierCount?: number | null;
}

function isValidPayload(b: unknown): b is SnapshotPayload {
  if (!b || typeof b !== 'object') return false;
  const r = b as Record<string, unknown>;
  return typeof r.analysisClientKey === 'string' && r.analysisClientKey.length > 0
    && typeof r.analysisName === 'string' && r.analysisName.length > 0
    && typeof r.bestTcoPerUnit === 'number' && Number.isFinite(r.bestTcoPerUnit);
}

/** "YYYY-MM" in UTC -- server-computed, never client-supplied. */
function currentMonth(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/* ─── POST /api/tco-trend-snapshots ────────────────────────────────────── */

router.post('/', async (req, res) => {
  if (!isValidPayload(req.body)) {
    res.status(400).json({ ok: false, error: 'Invalid snapshot -- expected {analysisClientKey, analysisName, bestTcoPerUnit, ...}' });
    return;
  }
  const body = req.body as SnapshotPayload;
  try {
    const userId = res.locals.userId as number;
    const month = currentMonth();

    const [row] = await db
      .insert(tcoTrendSnapshotsTable)
      .values({
        userId,
        analysisClientKey: body.analysisClientKey,
        month,
        analysisName:      body.analysisName,
        itemName:          body.itemName ?? null,
        bestSupplierName:  body.bestSupplierName ?? null,
        bestTcoPerUnit:    String(body.bestTcoPerUnit),
        bestTcoAnnual:     body.bestTcoAnnual != null ? String(body.bestTcoAnnual) : null,
        savingsPct:        body.savingsPct != null ? String(body.savingsPct) : null,
        supplierCount:     body.supplierCount ?? null,
      })
      .onConflictDoUpdate({
        target: [tcoTrendSnapshotsTable.userId, tcoTrendSnapshotsTable.analysisClientKey, tcoTrendSnapshotsTable.month],
        set: {
          analysisName:     body.analysisName,
          itemName:         body.itemName ?? null,
          bestSupplierName: body.bestSupplierName ?? null,
          bestTcoPerUnit:   String(body.bestTcoPerUnit),
          bestTcoAnnual:    body.bestTcoAnnual != null ? String(body.bestTcoAnnual) : null,
          savingsPct:       body.savingsPct != null ? String(body.savingsPct) : null,
          supplierCount:    body.supplierCount ?? null,
        },
      })
      .returning();

    logger.info({ userId, analysisClientKey: body.analysisClientKey, month }, '[tco-trend-snapshots] Snapshot saved');
    res.json({ ok: true, snapshot: row });
  } catch (err) {
    logger.error({ err }, '[tco-trend-snapshots] POST failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

/* ─── GET /api/tco-trend-snapshots ─────────────────────────────────────── */

router.get('/', async (req, res) => {
  const analysisClientKey = req.query.analysisClientKey;
  if (typeof analysisClientKey !== 'string' || analysisClientKey.length === 0) {
    res.status(400).json({ ok: false, error: 'Missing required query param: analysisClientKey' });
    return;
  }
  try {
    const userId = res.locals.userId as number;
    const rows = await db
      .select()
      .from(tcoTrendSnapshotsTable)
      .where(and(
        eq(tcoTrendSnapshotsTable.userId, userId),
        eq(tcoTrendSnapshotsTable.analysisClientKey, analysisClientKey),
      ))
      .orderBy(desc(tcoTrendSnapshotsTable.month))
      .limit(MAX_MONTHS);
    // Oldest-first for chart plotting (chronological x-axis).
    rows.reverse();
    res.json({ ok: true, snapshots: rows });
  } catch (err) {
    logger.error({ err }, '[tco-trend-snapshots] GET failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

export default router;
