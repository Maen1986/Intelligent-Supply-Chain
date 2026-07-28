/**
 * /api/admin/benchmarks — Admin CRUD for the gcc_benchmarks table.
 *
 * GET  /api/admin/benchmarks             — list all rows (paginated)
 * PUT  /api/admin/benchmarks/:id         — update label + data for a row
 * POST /api/admin/benchmarks/seed-reset  — reset all rows to factory defaults
 *
 * All routes require an authenticated admin session.
 */

import { Router } from 'express';
import { eq, sql } from 'drizzle-orm';
import { db, gccBenchmarksTable } from '@workspace/db';
import { requireAdmin } from '../middlewares/requireAdmin';
import { logger } from '../lib/logger';
import type { InsertGccBenchmark } from '@workspace/db';

const router = Router();
router.use(requireAdmin);

// ── GET /api/admin/benchmarks ─────────────────────────────────────────────────
router.get('/', async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(gccBenchmarksTable)
      .orderBy(gccBenchmarksTable.category, gccBenchmarksTable.itemId, gccBenchmarksTable.industry);
    res.json({ ok: true, rows, total: rows.length });
  } catch (err) {
    logger.error({ err }, '[admin/benchmarks] GET failed');
    res.status(500).json({ ok: false, error: 'Failed to load benchmarks' });
  }
});

// ── PUT /api/admin/benchmarks/:id ─────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ ok: false, error: 'Invalid id' });
    return;
  }

  const { label, data } = req.body as { label?: string; data?: Record<string, number> };
  if (!data || typeof data !== 'object') {
    res.status(400).json({ ok: false, error: 'data object is required' });
    return;
  }

  // Validate data values are all numbers
  for (const [k, v] of Object.entries(data)) {
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      res.status(400).json({ ok: false, error: `data.${k} must be a finite number` });
      return;
    }
  }

  try {
    const updated = await db
      .update(gccBenchmarksTable)
      .set({
        ...(label !== undefined ? { label } : {}),
        data,
        updatedAt: new Date(),
        updatedBy: req.session.userEmail ?? 'admin',
      })
      .where(eq(gccBenchmarksTable.id, id))
      .returning();

    if (updated.length === 0) {
      res.status(404).json({ ok: false, error: 'Benchmark row not found' });
      return;
    }
    logger.info({ id, updatedBy: req.session.userEmail }, '[admin/benchmarks] Row updated');
    res.json({ ok: true, row: updated[0] });
  } catch (err) {
    logger.error({ err, id }, '[admin/benchmarks] PUT failed');
    res.status(500).json({ ok: false, error: 'Update failed' });
  }
});

// ── POST /api/admin/benchmarks/seed-reset ─────────────────────────────────────
// Clears and re-seeds with GCC-wide factory defaults. Useful after bulk edits
// go wrong. Industry-specific overrides are preserved — only industry=NULL rows
// are touched.
router.post('/seed-reset', async (req, res) => {
  try {
    // Delete existing GCC-wide rows
    await db
      .delete(gccBenchmarksTable)
      .where(sql`industry IS NULL`);

    // Re-insert factory defaults
    await db.insert(gccBenchmarksTable).values(FACTORY_DEFAULTS);

    logger.info({ admin: req.session.userEmail }, '[admin/benchmarks] Factory seed reset');
    res.json({ ok: true, message: 'GCC-wide benchmarks reset to factory defaults', count: FACTORY_DEFAULTS.length });
  } catch (err) {
    logger.error({ err }, '[admin/benchmarks] seed-reset failed');
    res.status(500).json({ ok: false, error: 'Seed reset failed' });
  }
});

// ── Factory defaults ──────────────────────────────────────────────────────────
export const FACTORY_DEFAULTS = [
  // KPI benchmarks (0-100 normalised score space)
  { category: 'kpi',   itemId: 'otif',        industry: null, label: 'OTIF %',                    data: { median: 88, topQ: 95  } },
  { category: 'kpi',   itemId: 'invTurns',    industry: null, label: 'Inventory Turns',             data: { median: 57, topQ: 100 } },
  { category: 'kpi',   itemId: 'procCycle',   industry: null, label: 'Procurement Cycle Time',      data: { median: 61, topQ: 100 } },
  { category: 'kpi',   itemId: 'forecastAcc', industry: null, label: 'Forecast Accuracy',           data: { median: 73, topQ: 88  } },
  { category: 'kpi',   itemId: 'procCost',    industry: null, label: 'Procurement Cost % Revenue',  data: { median: 56, topQ: 100 } },
  { category: 'kpi',   itemId: 'perfOrder',   industry: null, label: 'Perfect Order Rate',          data: { median: 87, topQ: 96  } },
  // Lever max savings potentials (as fraction of procurement spend)
  { category: 'lever', itemId: 'catMgmt',     industry: null, label: 'Strategic Category Management',         data: { maxPct: 0.13 } },
  { category: 'lever', itemId: 'suppCons',    industry: null, label: 'Supplier Consolidation',                 data: { maxPct: 0.09 } },
  { category: 'lever', itemId: 'procAuto',    industry: null, label: 'Process & eProcurement Automation',      data: { maxPct: 0.05 } },
  { category: 'lever', itemId: 'invOpt',      industry: null, label: 'Inventory Optimisation',                 data: { maxPct: 0.07 } },
  { category: 'lever', itemId: 'demand',      industry: null, label: 'Demand Forecasting Improvement',         data: { maxPct: 0.04 } },
  // Risk category benchmarks (raw exposure point scale)
  { category: 'risk',  itemId: 'supply',      industry: null, label: 'Supply Risk',                   data: { gcMedian: 45, gcTopQ: 22 } },
  { category: 'risk',  itemId: 'demand',      industry: null, label: 'Demand Risk',                   data: { gcMedian: 40, gcTopQ: 20 } },
  { category: 'risk',  itemId: 'operational', industry: null, label: 'Operational Risk',               data: { gcMedian: 48, gcTopQ: 25 } },
  { category: 'risk',  itemId: 'financial',   industry: null, label: 'Financial Risk',                 data: { gcMedian: 38, gcTopQ: 18 } },
  { category: 'risk',  itemId: 'geopolitical',industry: null, label: 'Geopolitical / Regulatory Risk', data: { gcMedian: 42, gcTopQ: 20 } },
  { category: 'risk',  itemId: 'esg',         industry: null, label: 'ESG / Sustainability Risk',      data: { gcMedian: 52, gcTopQ: 28 } },
  { category: 'risk',  itemId: 'cyber',       industry: null, label: 'Cyber / Technology Risk',        data: { gcMedian: 55, gcTopQ: 25 } },
  { category: 'risk',  itemId: 'contract',    industry: null, label: 'Contract / Governance Risk',     data: { gcMedian: 44, gcTopQ: 20 } },
] satisfies InsertGccBenchmark[];

export default router;
