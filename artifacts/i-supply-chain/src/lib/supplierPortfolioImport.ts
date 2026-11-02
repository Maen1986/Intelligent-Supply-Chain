/**
 * SI Module 07 -- Portfolio import (Round B1, Nov 2026).
 *
 * Why this exists: before Round B a real user could only enter suppliers by
 * hand, one score at a time. Nobody with 30 suppliers will do that, so the
 * module could not be used professionally. This file turns two plain CSV
 * exports (a scores file and a corrective-action file) into SupplierRecords.
 *
 * Pure functions, no runtime imports from other modules (standalone-first).
 * Every imported record is tagged dataSource: 'imported-file'.
 *
 * Honesty rules (Decision Record 8.7):
 *  - A row that cannot be read is REJECTED with a reason, never silently fixed.
 *  - Nothing is invented: a missing cost stays uncosted, a missing cause stays
 *    'unassessed', a missing spend stays INSUFFICIENT_DATA downstream.
 *  - The report states exactly what was accepted, rejected and warned.
 */
import type {
  CARCategory,
  CARRecord,
  CARStatus,
  KraljicQuadrant,
  ScorecardDimension,
  SupplierRecord,
} from './supplierRecoveryPortfolio';
import type { PerformanceCause } from './supplierPerformanceRecovery';

export interface ImportRowIssue {
  /** 1-based line number in the file (header = line 1). */
  line: number;
  reasonEn: string;
  reasonAr: string;
}

export interface ImportReport {
  rowsRead: number;
  rowsAccepted: number;
  rejected: ImportRowIssue[];
  warnings: ImportRowIssue[];
  fatalEn: string | null;
  fatalAr: string | null;
}

export interface ScoreImportResult {
  suppliers: SupplierRecord[];
  report: ImportReport;
}

export interface CarImportResult {
  cars: Array<CARRecord & { supplierName: string }>;
  report: ImportReport;
}

// ---------------------------------------------------------------------------
// Templates (shown to the user as a download so the format is never a guess)
// ---------------------------------------------------------------------------

export const SCORES_TEMPLATE_CSV =
  'supplier,category,quadrant,period,score,annual_spend_sar\n' +
  'Example Supplier Co.,Packaging,leverage,2026-01,88,1200000\n' +
  'Example Supplier Co.,Packaging,leverage,2026-02,86,\n' +
  'Example Supplier Co.,Packaging,leverage,2026-03,81,\n' +
  'Example Supplier Co.,Packaging,leverage,2026-04,79,\n';

export const CARS_TEMPLATE_CSV =
  'supplier,car_id,category,dimension,root_cause,status,opened,closed,cause,cost_usd,cost_basis,customer_impact\n' +
  'Example Supplier Co.,CAR-001,delivery,delivery,late-shipment-root-A,closed,2026-02-10,2026-03-20,supplier,8000,estimated,internal\n' +
  'Example Supplier Co.,CAR-002,delivery,delivery,late-shipment-root-A,open,2026-05-02,,shared,,,\n';

// ---------------------------------------------------------------------------
// CSV text parser (RFC-4180: quotes, escaped quotes, CRLF, BOM)
// ---------------------------------------------------------------------------

export function parseCsvText(text: string): string[][] {
  const src = text.replace(/^﻿/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (inQuotes) {
      if (ch === '"' && src[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((c) => c.trim() !== '')) rows.push(row);
  return rows;
}

function normHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[\s\-]+/g, '_');
}
export function normName(n: string): string {
  return n.trim().replace(/\s+/g, ' ').toLowerCase();
}

function emptyReport(): ImportReport {
  return { rowsRead: 0, rowsAccepted: 0, rejected: [], warnings: [], fatalEn: null, fatalAr: null };
}

function toObjects(
  text: string,
  required: string[],
  report: ImportReport,
): { obj: Record<string, string>; line: number }[] {
  const rows = parseCsvText(text);
  if (rows.length === 0) {
    report.fatalEn = 'The file is empty.';
    report.fatalAr = 'الملف فارغ.';
    return [];
  }
  const headers = rows[0]!.map(normHeader);
  const missing = required.filter((r) => !headers.includes(r));
  if (missing.length > 0) {
    report.fatalEn = `Missing required column(s): ${missing.join(', ')}. Download the template to see the expected format.`;
    report.fatalAr = `أعمدة مطلوبة مفقودة: ${missing.join(', ')}. نزّل القالب للاطلاع على الصيغة المطلوبة.`;
    return [];
  }
  return rows.slice(1).map((cells, idx) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = (cells[i] ?? '').trim(); });
    return { obj, line: idx + 2 };
  });
}

// ---------------------------------------------------------------------------
// Value normalisers
// ---------------------------------------------------------------------------

const QUADRANT_ALIASES: Record<string, KraljicQuadrant> = {
  strategic: 'strategic', 'استراتيجي': 'strategic',
  leverage: 'leverage', 'نفوذ سوق': 'leverage',
  bottleneck: 'bottleneck', 'نقطة اختناق': 'bottleneck', 'نقطة اختناق (إمداد هش)': 'bottleneck', 'إمداد هش': 'bottleneck',
  'non-critical': 'non-critical', non_critical: 'non-critical', noncritical: 'non-critical',
  'non critical': 'non-critical', routine: 'non-critical', 'غير حرج': 'non-critical',
};
export function parseQuadrant(v: string): KraljicQuadrant | null {
  return QUADRANT_ALIASES[v.trim().toLowerCase()] ?? null;
}

/** Accepts YYYY-MM or YYYY-MM-DD; returns YYYY-MM or null. */
export function parsePeriod(v: string): string | null {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(v.trim());
  if (!m) return null;
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) return null;
  return `${m[1]}-${m[2]}`;
}

export function parseIsoDate(v: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v.trim());
  if (!m) return null;
  const d = new Date(`${v.trim()}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v.trim()) return null;
  return v.trim();
}

function parseNumber(v: string): number | null {
  if (v === '') return null;
  const n = Number(v.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

// ---------------------------------------------------------------------------
// Scores file -> suppliers
// ---------------------------------------------------------------------------

export function parseScoresCsv(text: string, opts: { idFactory?: (name: string) => string } = {}): ScoreImportResult {
  const report = emptyReport();
  const rows = toObjects(text, ['supplier', 'period', 'score'], report);
  if (report.fatalEn) return { suppliers: [], report };

  const idFor = opts.idFactory ?? ((n: string) => `imp-${normName(n).replace(/[^a-z0-9؀-ۿ]+/g, '-')}`);
  interface Acc {
    name: string; category: string; quadrant: KraljicQuadrant | null;
    points: Map<string, number>; spend: number | null;
  }
  const byName = new Map<string, Acc>();

  for (const { obj, line } of rows) {
    report.rowsRead++;
    const name = obj['supplier'] ?? '';
    const reject = (en: string, ar: string) => report.rejected.push({ line, reasonEn: en, reasonAr: ar });
    if (!name) { reject('Supplier name is empty.', 'اسم المورد فارغ.'); continue; }
    const period = parsePeriod(obj['period'] ?? '');
    if (!period) { reject(`Period "${obj['period']}" is not YYYY-MM.`, `الفترة "${obj['period']}" ليست بصيغة YYYY-MM.`); continue; }
    const score = parseNumber(obj['score'] ?? '');
    if (score === null) { reject(`Score "${obj['score']}" is not a number.`, `الدرجة "${obj['score']}" ليست رقماً.`); continue; }
    if (score < 0 || score > 100) { reject(`Score ${score} is outside 0-100.`, `الدرجة ${score} خارج النطاق 0-100.`); continue; }

    let quadrant: KraljicQuadrant | null = null;
    if (obj['quadrant']) {
      quadrant = parseQuadrant(obj['quadrant']);
      if (!quadrant) { reject(`Quadrant "${obj['quadrant']}" is not recognised (strategic, leverage, bottleneck, non-critical).`, `الربع "${obj['quadrant']}" غير معروف (استراتيجي، نفوذ سوق، نقطة اختناق، غير حرج).`); continue; }
    }
    let spend: number | null = null;
    if (obj['annual_spend_sar']) {
      spend = parseNumber(obj['annual_spend_sar']);
      if (spend === null || spend < 0) { reject(`annual_spend_sar "${obj['annual_spend_sar']}" is not a non-negative number.`, `قيمة annual_spend_sar "${obj['annual_spend_sar']}" ليست رقماً غير سالب.`); continue; }
    }

    const key = normName(name);
    let acc = byName.get(key);
    if (!acc) { acc = { name: name.trim().replace(/\s+/g, ' '), category: '', quadrant: null, points: new Map(), spend: null }; byName.set(key, acc); }
    if (obj['category']) acc.category = obj['category'];
    if (quadrant) acc.quadrant = quadrant;
    if (spend !== null) acc.spend = spend;
    if (acc.points.has(period)) {
      report.warnings.push({ line, reasonEn: `Duplicate period ${period} for "${name}" -- the later row was kept.`, reasonAr: `فترة مكررة ${period} للمورد "${name}" -- تم الاحتفاظ بالصف الأحدث.` });
    }
    acc.points.set(period, score);
    report.rowsAccepted++;
  }

  const suppliers: SupplierRecord[] = [];
  const usedIds = new Set<string>();
  /** Round C #668: two different names ("A B", "A-B", "---") can slug to the same id,
   * which would merge their cars and actions downstream. Make ids unique, in file order. */
  const uniqueId = (base: string): string => {
    let id = base || 'imp-supplier'; let n = 2;
    while (usedIds.has(id)) id = `${base || 'imp-supplier'}-${n++}`;
    usedIds.add(id);
    return id;
  };
  for (const acc of byName.values()) {
    const periods = [...acc.points.keys()].sort();
    if (!acc.category) report.warnings.push({ line: 0, reasonEn: `"${acc.name}" has no category -- exposure will show insufficient data.`, reasonAr: `المورد "${acc.name}" بلا فئة -- سيُعرض التعرّض كبيانات غير كافية.` });
    if (!acc.quadrant) report.warnings.push({ line: 0, reasonEn: `"${acc.name}" has no Kraljic quadrant -- defaulted to non-critical (lowest weight). Set it for a correct priority.`, reasonAr: `المورد "${acc.name}" بلا ربع كرالييك -- تم افتراضه غير حرج (أقل وزن). حدّده للحصول على أولوية صحيحة.` });
    if (periods.length < 4) report.warnings.push({ line: 0, reasonEn: `"${acc.name}" has only ${periods.length} period(s) -- trend and variability need at least 4.`, reasonAr: `المورد "${acc.name}" لديه ${periods.length} فترة فقط -- الاتجاه والتذبذب يحتاجان 4 فترات على الأقل.` });
    suppliers.push({
      supplierId: uniqueId(idFor(acc.name)),
      name: acc.name,
      category: acc.category,
      quadrant: acc.quadrant ?? 'non-critical',
      quadrantDefaulted: acc.quadrant === null ? true : undefined,
      quadrantPriorQuarter: null,
      scoreHistory12mo: periods.map((p) => acc.points.get(p)!),
      scorePeriods: periods,
      cars: [],
      annualSpendSAR: acc.spend,
      dataSource: 'imported-file',
    });
  }
  return { suppliers, report };
}

// ---------------------------------------------------------------------------
// Corrective-action file -> CARs
// ---------------------------------------------------------------------------

const CAR_CATEGORIES: CARCategory[] = ['quality', 'delivery', 'compliance', 'safety', 'documentation', 'other'];
const DIMENSIONS: ScorecardDimension[] = ['delivery', 'quality', 'cost', 'compliance', 'innovation', 'relationship'];
const STATUSES: CARStatus[] = ['open', 'in-progress', 'closed'];
const CAUSES: PerformanceCause[] = ['supplier', 'client', 'shared', 'external', 'measurement'];

export function parseCarsCsv(text: string): CarImportResult {
  const report = emptyReport();
  const rows = toObjects(text, ['supplier', 'car_id', 'category', 'dimension', 'root_cause', 'status', 'opened'], report);
  if (report.fatalEn) return { cars: [], report };

  const cars: CarImportResult['cars'] = [];
  const seen = new Set<string>();
  for (const { obj, line } of rows) {
    report.rowsRead++;
    const reject = (en: string, ar: string) => report.rejected.push({ line, reasonEn: en, reasonAr: ar });
    const name = obj['supplier'] ?? '';
    if (!name) { reject('Supplier name is empty.', 'اسم المورد فارغ.'); continue; }
    const id = obj['car_id'] ?? '';
    if (!id) { reject('car_id is empty.', 'معرّف الطلب car_id فارغ.'); continue; }
    if (seen.has(`${normName(name)}|${id}`)) { reject(`Duplicate car_id "${id}" for this supplier.`, `معرّف مكرر "${id}" لهذا المورد.`); continue; }
    const category = (obj['category'] ?? '').toLowerCase() as CARCategory;
    if (!CAR_CATEGORIES.includes(category)) { reject(`category "${obj['category']}" must be one of ${CAR_CATEGORIES.join(', ')}.`, `الفئة "${obj['category']}" يجب أن تكون إحدى: ${CAR_CATEGORIES.join(', ')}.`); continue; }
    const dimension = (obj['dimension'] ?? '').toLowerCase() as ScorecardDimension;
    if (!DIMENSIONS.includes(dimension)) { reject(`dimension "${obj['dimension']}" must be one of ${DIMENSIONS.join(', ')}.`, `البُعد "${obj['dimension']}" يجب أن يكون أحد: ${DIMENSIONS.join(', ')}.`); continue; }
    const status = (obj['status'] ?? '').toLowerCase() as CARStatus;
    if (!STATUSES.includes(status)) { reject(`status "${obj['status']}" must be open, in-progress or closed.`, `الحالة "${obj['status']}" يجب أن تكون open أو in-progress أو closed.`); continue; }
    const opened = parseIsoDate(obj['opened'] ?? '');
    if (!opened) { reject(`opened "${obj['opened']}" is not a valid YYYY-MM-DD date.`, `تاريخ الفتح "${obj['opened']}" ليس تاريخاً صحيحاً بصيغة YYYY-MM-DD.`); continue; }
    let closed: string | null = null;
    if (obj['closed']) {
      closed = parseIsoDate(obj['closed']);
      if (!closed) { reject(`closed "${obj['closed']}" is not a valid YYYY-MM-DD date.`, `تاريخ الإغلاق "${obj['closed']}" ليس تاريخاً صحيحاً.`); continue; }
      if (closed < opened) { reject('closed date is before the opened date.', 'تاريخ الإغلاق قبل تاريخ الفتح.'); continue; }
    }
    if (status === 'closed' && !closed) { reject('status is closed but no closed date was given.', 'الحالة مغلقة لكن بلا تاريخ إغلاق.'); continue; }
    if (status !== 'closed' && closed) {
      report.warnings.push({ line, reasonEn: `${id}: has a closed date but status is ${status} -- treated as ${status}, closed date ignored.`, reasonAr: `${id}: لديه تاريخ إغلاق لكن حالته ${status} -- عُومل كـ ${status} وتم تجاهل تاريخ الإغلاق.` });
      closed = null;
    }
    let cause: PerformanceCause | undefined;
    if (obj['cause']) {
      const c = obj['cause'].toLowerCase() as PerformanceCause;
      if (!CAUSES.includes(c)) { reject(`cause "${obj['cause']}" must be one of ${CAUSES.join(', ')} (or empty = unassessed).`, `السبب "${obj['cause']}" يجب أن يكون أحد: ${CAUSES.join(', ')} (أو فارغاً = غير مقيّم).`); continue; }
      cause = c;
    }
    let cost: number | null | undefined;
    if (obj['cost_usd']) {
      cost = parseNumber(obj['cost_usd']);
      if (cost === null || cost < 0) { reject(`cost_usd "${obj['cost_usd']}" is not a non-negative number.`, `قيمة cost_usd "${obj['cost_usd']}" ليست رقماً غير سالب.`); continue; }
    }
    let costBasis: 'observed' | 'calculated' | 'estimated' | undefined;
    if (cost !== undefined) {
      const b = (obj['cost_basis'] ?? '').toLowerCase();
      if (b === 'observed' || b === 'calculated' || b === 'estimated') costBasis = b;
      else {
        costBasis = 'estimated';
        report.warnings.push({ line, reasonEn: `${id}: cost has no valid cost_basis -- labelled "estimated" (the most cautious basis).`, reasonAr: `${id}: التكلفة بلا أساس صحيح -- وُسمت "estimated" (الأساس الأكثر حذراً).` });
      }
    }
    const impact = (obj['customer_impact'] ?? '').toLowerCase();
    seen.add(`${normName(name)}|${id}`);
    cars.push({
      supplierName: name.trim().replace(/\s+/g, ' '),
      id,
      supplierId: '',
      category,
      scorecardDimension: dimension,
      rootCause: obj['root_cause'] ?? '',
      status,
      createdAt: opened,
      closedAt: closed,
      ...(cause ? { cause } : {}),
      ...(cost !== undefined ? { estimatedCostUSD: cost, costBasis } : {}),
      ...(impact === 'external' || impact === 'internal' ? { customerImpact: impact as 'internal' | 'external' } : {}),
    });
    report.rowsAccepted++;
  }
  return { cars, report };
}

// ---------------------------------------------------------------------------
// Merge into an existing portfolio
// ---------------------------------------------------------------------------

export interface MergeSummary {
  suppliersAdded: number;
  suppliersUpdated: number;
  carsAdded: number;
  carsUpdated: number;
  carsUnmatched: string[];
}

/**
 * Policy (stated in the UI): the scores file is the source of truth for a
 * supplier's score series; suppliers not in the file are untouched; CARs are
 * matched by supplier name + car_id (new ones added, same id updated). A CAR
 * whose supplier is not in the portfolio is reported, never auto-created.
 */
export function mergeImport(
  existing: SupplierRecord[],
  scores: SupplierRecord[],
  cars: CarImportResult['cars'],
): { merged: SupplierRecord[]; summary: MergeSummary } {
  const out = existing.map((s) => ({ ...s, cars: [...s.cars] }));
  const summary: MergeSummary = { suppliersAdded: 0, suppliersUpdated: 0, carsAdded: 0, carsUpdated: 0, carsUnmatched: [] };

  // Round C #668 (scale): index by normalised name and by id once. The old findIndex/some per row was
  // O(n^2) -- 5,000 suppliers took ~10 s, 50,000 would not finish. First match wins, as before.
  const byName = new Map<string, number>();
  const ids = new Set<string>();
  out.forEach((s, i) => { const k = normName(s.name); if (!byName.has(k)) byName.set(k, i); ids.add(s.supplierId); });

  for (const inc of scores) {
    const key = normName(inc.name);
    const idx = byName.get(key) ?? -1;
    if (idx === -1) {
      // Round C #668: a new supplier must not reuse an id already in the portfolio.
      let id = inc.supplierId; let n = 2;
      while (ids.has(id)) id = `${inc.supplierId}-${n++}`;
      ids.add(id); byName.set(key, out.length);
      out.push(id === inc.supplierId ? inc : { ...inc, supplierId: id }); summary.suppliersAdded++; continue;
    }
    const cur = out[idx]!;
    out[idx] = {
      ...cur,
      category: inc.category || cur.category,
      // Round C #668: a file with no quadrant column must not silently downgrade a
      // supplier the user already classed (e.g. strategic -> non-critical). Keep theirs.
      quadrant: inc.quadrantDefaulted ? cur.quadrant : inc.quadrant,
      quadrantDefaulted: inc.quadrantDefaulted ? cur.quadrantDefaulted : undefined,
      scoreHistory12mo: inc.scoreHistory12mo,
      scorePeriods: inc.scorePeriods,
      annualSpendSAR: inc.annualSpendSAR ?? cur.annualSpendSAR ?? null,
      dataSource: 'imported-file',
    };
    summary.suppliersUpdated++;
  }

  for (const c of cars) {
    const idx = byName.get(normName(c.supplierName)) ?? -1;
    if (idx === -1) { summary.carsUnmatched.push(`${c.supplierName} / ${c.id}`); continue; }
    const sup = out[idx]!;
    const { supplierName: _drop, ...rec } = c;
    const car: CARRecord = { ...rec, supplierId: sup.supplierId };
    const ci = sup.cars.findIndex((x) => x.id === car.id);
    if (ci === -1) { sup.cars.push(car); summary.carsAdded++; }
    else { sup.cars[ci] = car; summary.carsUpdated++; }
  }
  return { merged: out, summary };
}
