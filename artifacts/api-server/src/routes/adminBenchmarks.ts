/**
 * /api/admin/benchmarks — Admin CRUD for the gcc_benchmarks table.
 *
 * GET  /api/admin/benchmarks             — list all rows (paginated)
 * PUT  /api/admin/benchmarks/:id         — update label + data (+ provenance fields) for a row
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
// Accepts data (required) plus optional label and provenance fields
// (sourceUrl, status, lastVerifiedAt, methodologyNote, methodologyNoteAr) so an
// admin correcting a number can also record where it came from and mark it
// reviewed (#183) -- same pattern as the regulatory-content PATCH endpoint.
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ ok: false, error: 'Invalid id' });
    return;
  }

  const body = req.body as {
    label?: string;
    data?: Record<string, number>;
    sourceUrl?: string | null;
    status?: string;
    lastVerifiedAt?: string | null;
    methodologyNote?: string | null;
    methodologyNoteAr?: string | null;
  };
  const { data } = body;
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

  if (body.status !== undefined && body.status !== 'verified' && body.status !== 'pending_review') {
    res.status(400).json({ ok: false, error: "status must be 'verified' or 'pending_review'" });
    return;
  }

  const updates: Record<string, unknown> = { data, updatedAt: new Date() };
  if (body.label !== undefined)             updates.label             = body.label;
  if (body.sourceUrl !== undefined)         updates.sourceUrl         = body.sourceUrl;
  if (body.status !== undefined)            updates.status            = body.status;
  if (body.methodologyNote !== undefined)   updates.methodologyNote   = body.methodologyNote;
  if (body.methodologyNoteAr !== undefined) updates.methodologyNoteAr = body.methodologyNoteAr;
  if (body.lastVerifiedAt !== undefined) {
    const parsed = body.lastVerifiedAt === null ? null : new Date(body.lastVerifiedAt);
    if (parsed !== null && Number.isNaN(parsed.getTime())) {
      res.status(400).json({ ok: false, error: 'lastVerifiedAt must be a valid date or null' });
      return;
    }
    updates.lastVerifiedAt = parsed;
  }

  try {
    const updated = await db
      .update(gccBenchmarksTable)
      .set({
        ...updates,
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
// Content-honesty pass (#183): every row now carries a methodology note and,
// where a real external framework informed the calibration, a source URL.
// These are internal 0-100 composite reference indices, not literal external
// market statistics -- no publicly available GCC-country-specific benchmark
// study exists at this granularity for most supply-chain KPIs. `status`
// stays 'pending_review' for all factory rows until a named human expert
// signs off, matching the trust model already used for regulatory_countries.
const APQC_URL = 'https://www.apqc.org/resources/benchmarking/open-standards-benchmarking';
const CIPS_URL = 'https://www.cips.org/knowledge/procurement-topics-and-skills/category-management/';
const KPI_NOTE_EN = 'Composite 0-100 reference index. Anchor points are informed by APQC Open Standards Benchmarking’s published performance-distribution methodology for this measure family. No publicly available GCC-country-specific study was found for this KPI, so this is a global cross-industry reference point, not a verified regional statistic -- pending independent expert review.';
const KPI_NOTE_AR = 'مؤشر مرجعي مركّب من 0 إلى 100. نقاط الاسترشاد مستندة إلى منهجية APQC Open Standards Benchmarking المنشورة لهذه الفئة من المقاييس. لم نعثر على دراسة متاحة للعموم خاصة بدول الخليج لهذا المؤشر، لذا فهذه نقطة مرجعية عالمية عابرة للقطاعات، وليست إحصاءية إقليمية موثقة -- بانتظار مراجعة خبير مستقل.';
const LEVER_NOTE_EN = 'Composite savings-potential estimate (% of spend). Range is informed by commonly cited procurement literature on this lever (CIPS category-management guidance and general CPO-survey cost-reduction findings), not a GCC-specific study -- pending independent expert review.';
const LEVER_NOTE_AR = 'تقدير مركّب لإمكانية التوفير (كنسبة من الإنفاق). النطاق مستند إلى أدبيات المشتريات الشائعة (إرشادات CIPS لإدارة الفئات ونتائج استطلاعات CPO العامة)، وليست دراسة خاصة بالخليج -- بانتظار مراجعة خبير مستقل.';
const RISK_NOTE_EN = 'ISC composite risk-exposure index (internal 0-100 scale). This is ISC’s own risk-scoring methodology, informed by ISO 31000 risk-management principles -- it is not an externally published market statistic, and no external benchmark exists for this exact measure. Anchor points reflect ISC practitioner judgment, pending independent expert review.';
const RISK_NOTE_AR = 'مؤشر ISC المركّب للتعرض للمخاطر (مقياس داخلي من 0 إلى 100). هذه منهجية خاصة بـ ISC مستندة إلى مبادئ ISO 31000 لإدارة المخاطر -- وليست إحصائية سوقية منشورة خارجياً، ولا يوجد معيار خارجي لهذا المقياس بالذات. نقاط الاسترشاد تعكس تقدير خبراء ISC الممارسين، بانتظار مراجعة خبير مستقل.';

export const FACTORY_DEFAULTS = [
  // KPI benchmarks (0-100 normalised score space)
  { category: 'kpi',   itemId: 'otif',        industry: null, label: 'OTIF %',                    data: { median: 88, topQ: 95  }, sourceUrl: APQC_URL, status: 'pending_review', methodologyNote: KPI_NOTE_EN, methodologyNoteAr: KPI_NOTE_AR },
  { category: 'kpi',   itemId: 'invTurns',    industry: null, label: 'Inventory Turns',             data: { median: 57, topQ: 100 }, sourceUrl: APQC_URL, status: 'pending_review', methodologyNote: KPI_NOTE_EN, methodologyNoteAr: KPI_NOTE_AR },
  { category: 'kpi',   itemId: 'procCycle',   industry: null, label: 'Procurement Cycle Time',      data: { median: 61, topQ: 100 }, sourceUrl: APQC_URL, status: 'pending_review', methodologyNote: KPI_NOTE_EN, methodologyNoteAr: KPI_NOTE_AR },
  { category: 'kpi',   itemId: 'forecastAcc', industry: null, label: 'Forecast Accuracy',           data: { median: 73, topQ: 88  }, sourceUrl: APQC_URL, status: 'pending_review', methodologyNote: KPI_NOTE_EN, methodologyNoteAr: KPI_NOTE_AR },
  { category: 'kpi',   itemId: 'procCost',    industry: null, label: 'Procurement Cost % Revenue',  data: { median: 56, topQ: 100 }, sourceUrl: APQC_URL, status: 'pending_review', methodologyNote: KPI_NOTE_EN, methodologyNoteAr: KPI_NOTE_AR },
  { category: 'kpi',   itemId: 'perfOrder',   industry: null, label: 'Perfect Order Rate',          data: { median: 87, topQ: 96  }, sourceUrl: APQC_URL, status: 'pending_review', methodologyNote: KPI_NOTE_EN, methodologyNoteAr: KPI_NOTE_AR },
  // Lever max savings potentials (as fraction of procurement spend)
  { category: 'lever', itemId: 'catMgmt',     industry: null, label: 'Strategic Category Management',         data: { maxPct: 0.13 }, sourceUrl: CIPS_URL, status: 'pending_review', methodologyNote: LEVER_NOTE_EN, methodologyNoteAr: LEVER_NOTE_AR },
  { category: 'lever', itemId: 'suppCons',    industry: null, label: 'Supplier Consolidation',                 data: { maxPct: 0.09 }, sourceUrl: CIPS_URL, status: 'pending_review', methodologyNote: LEVER_NOTE_EN, methodologyNoteAr: LEVER_NOTE_AR },
  { category: 'lever', itemId: 'procAuto',    industry: null, label: 'Process & eProcurement Automation',      data: { maxPct: 0.05 }, sourceUrl: CIPS_URL, status: 'pending_review', methodologyNote: LEVER_NOTE_EN, methodologyNoteAr: LEVER_NOTE_AR },
  { category: 'lever', itemId: 'invOpt',      industry: null, label: 'Inventory Optimisation',                 data: { maxPct: 0.07 }, sourceUrl: CIPS_URL, status: 'pending_review', methodologyNote: LEVER_NOTE_EN, methodologyNoteAr: LEVER_NOTE_AR },
  { category: 'lever', itemId: 'demand',      industry: null, label: 'Demand Forecasting Improvement',         data: { maxPct: 0.04 }, sourceUrl: CIPS_URL, status: 'pending_review', methodologyNote: LEVER_NOTE_EN, methodologyNoteAr: LEVER_NOTE_AR },
  // Risk category benchmarks (raw exposure point scale)
  { category: 'risk',  itemId: 'supply',      industry: null, label: 'Supply Risk',                   data: { gcMedian: 45, gcTopQ: 22 }, sourceUrl: null, status: 'pending_review', methodologyNote: RISK_NOTE_EN, methodologyNoteAr: RISK_NOTE_AR },
  { category: 'risk',  itemId: 'demand',      industry: null, label: 'Demand Risk',                   data: { gcMedian: 40, gcTopQ: 20 }, sourceUrl: null, status: 'pending_review', methodologyNote: RISK_NOTE_EN, methodologyNoteAr: RISK_NOTE_AR },
  { category: 'risk',  itemId: 'operational', industry: null, label: 'Operational Risk',               data: { gcMedian: 48, gcTopQ: 25 }, sourceUrl: null, status: 'pending_review', methodologyNote: RISK_NOTE_EN, methodologyNoteAr: RISK_NOTE_AR },
  { category: 'risk',  itemId: 'financial',   industry: null, label: 'Financial Risk',                 data: { gcMedian: 38, gcTopQ: 18 }, sourceUrl: null, status: 'pending_review', methodologyNote: RISK_NOTE_EN, methodologyNoteAr: RISK_NOTE_AR },
  { category: 'risk',  itemId: 'geopolitical',industry: null, label: 'Geopolitical / Regulatory Risk', data: { gcMedian: 42, gcTopQ: 20 }, sourceUrl: null, status: 'pending_review', methodologyNote: RISK_NOTE_EN, methodologyNoteAr: RISK_NOTE_AR },
  { category: 'risk',  itemId: 'esg',         industry: null, label: 'ESG / Sustainability Risk',      data: { gcMedian: 52, gcTopQ: 28 }, sourceUrl: null, status: 'pending_review', methodologyNote: RISK_NOTE_EN, methodologyNoteAr: RISK_NOTE_AR },
  { category: 'risk',  itemId: 'cyber',       industry: null, label: 'Cyber / Technology Risk',        data: { gcMedian: 55, gcTopQ: 25 }, sourceUrl: null, status: 'pending_review', methodologyNote: RISK_NOTE_EN, methodologyNoteAr: RISK_NOTE_AR },
  { category: 'risk',  itemId: 'contract',    industry: null, label: 'Contract / Governance Risk',     data: { gcMedian: 44, gcTopQ: 20 }, sourceUrl: null, status: 'pending_review', methodologyNote: RISK_NOTE_EN, methodologyNoteAr: RISK_NOTE_AR },
] satisfies InsertGccBenchmark[];

export default router;
