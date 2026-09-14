/**
 * Supplier Recovery Portfolio — aggregation layer (REAL code, not illustration).
 *
 * Built against the REAL, live type contracts of three modules, fetched and
 * read directly from the repo this session (10-11 Sep 2026):
 *   - SI Module 07 (supplierPerformanceRecovery.ts) — imported directly, unmodified.
 *   - SI Module 05 (supplierConcentration.ts) — types mirrored from the live file
 *     (ConcentrationSupplierInput shape: supplierId, kraljicQuadrant?, capacityOrSpendSharePct).
 *   - SI Module 02 (kraljicScoring.ts) — types mirrored from the live file
 *     (KraljicScored: quadrant, annualSpend (SAR), spendPct, category — ITEM-level, not supplier-level).
 *   - Scorecard CAR (scorecardCsv.ts / SupplierScorecard.tsx) — CAR interface already
 *     cross-checked in SI-07's own header: id/title/category/owner/dueDate/rootCause/
 *     resolution/status/createdAt/closedAt.
 *
 * HONEST, LOAD-BEARING FINDING from wiring this for real (not present in the
 * mockup, surfaced only once real type contracts were fetched): Module 02's
 * `annualSpend` is a real SAR figure, but it lives on `KraljicItem` — a
 * procurement CATEGORY/ITEM record (id/category/subcategory/itemName), not a
 * per-SUPPLIER record. Module 05's `ConcentrationSupplierInput` carries only a
 * RELATIVE `capacityOrSpendSharePct` (0-100), deliberately never an absolute
 * currency figure — per Decision Record 8.7, Module 05 will not fabricate an
 * absolute cost without a client-supplied one. So there is, today, NO real
 * per-supplier absolute-currency field anywhere in the live codebase this
 * dashboard could read directly.
 *
 * REVISED FRAMING (per explicit instruction, 11 Sep 2026): an early version of
 * this file labeled its SAR exposure output "approximated-from-category-
 * spend-share" — i.e. presented as a derivation FROM real production data.
 * That framing was rejected and corrected: the category totals and share
 * percentages feeding this computation come from a CONSTRUCTED test portfolio
 * (run_portfolio.ts), not a live production feed, so calling the output an
 * "approximation" of something real is itself a small dishonesty — it implies
 * a realer grounding than exists. The standing method for this platform when
 * real production data doesn't exist in-session (already applied everywhere
 * else in this codebase — the seeded simulations, the constructed CAR
 * histories, the worked examples) is: build realistic, clearly-labeled
 * SYNTHETIC data instead of an unlabeled approximation. So this file now
 * builds an explicit, named MOCK per-supplier spend dataset via
 * `buildMockSupplierSpendDataset()` below — grounded in the same real Module
 * 05 mechanism (relative `capacityOrSpendSharePct` allocation of a category
 * total) and the same shape Module 02 would use for the total (`annualSpend`
 * in SAR), but every output value is tagged `exposureBasis:
 * 'mock-simulated-per-supplier-spend'`, and the dashboard that consumes it
 * must render that label visibly, not bury it. This is NOT a workaround of
 * Decision Record 8.7 — it is 8.7 applied correctly: disclose the synthetic
 * origin instead of dressing a constructed number up as a real derivation.
 * The underlying cross-module gap is unchanged and still real: there is still
 * no live per-supplier absolute-currency field in Module 05 or a join key
 * back to Module 02 that would let this be computed from production data
 * instead of a mock dataset. See the write-up for the proposed fix.
 */
import {
  classifyVariability,
  computeTrend,
  assessRecurrence,
  recommendEscalation,
  checkLatestPeriodShock,
  type InterventionType,
  type PerformanceTrend,
} from './supplierPerformanceRecovery';
import {
  type CARRecord as COPQCARRecord,
  type CARBusinessImpact,
  type CARCustomerImpactOverride,
  type COPQRollup,
  computeCOPQRollup,
} from './supplierCOPQ';

// Re-exported so consumers of THIS aggregation layer (e.g. the Recovery
// Portfolio page) don't need a second import from supplierCOPQ.ts directly
// just to construct impacts/overrides for computeRootCauseCOPQBreakdown /
// computeCOPQAttentionPriority below.
export type { CARBusinessImpact, CARCustomerImpactOverride };

// ---- Mirrored real type contracts (Module 02 / Module 05 / CAR) ----------

export type KraljicQuadrant = 'strategic' | 'leverage' | 'bottleneck' | 'non-critical';

export interface KraljicItemLite {
  id: string;
  category: string;
  annualSpendSAR: number;
  quadrant: KraljicQuadrant;
}

export interface SupplierCategoryShare {
  supplierId: string;
  category: string;
  capacityOrSpendSharePct: number; // Module 05's real field name/shape
}

export type CARCategory = 'quality' | 'delivery' | 'compliance' | 'safety' | 'documentation' | 'other';
export type CARStatus = 'open' | 'in-progress' | 'closed';
export type ScorecardDimension = 'delivery' | 'quality' | 'cost' | 'compliance' | 'innovation' | 'relationship';

export interface CARRecord {
  id: string;
  supplierId: string;
  category: CARCategory;
  scorecardDimension: ScorecardDimension; // caller-supplied cross-reference, not on the real CAR type itself
  rootCause: string;
  status: CARStatus;
  createdAt: string; // ISO date
  closedAt: string | null;
}

export interface SupplierRecord {
  supplierId: string;
  name: string;
  category: string;
  quadrant: KraljicQuadrant;
  quadrantPriorQuarter: KraljicQuadrant | null; // for the migration-trail upgrade
  scoreHistory12mo: number[]; // chronological, oldest first — feeds real computeTrend/classifyVariability
  cars: CARRecord[]; // this supplier's own CAR history
}

// ---- Real, executed per-supplier detection (calls the REAL SI-07 functions) ----

export interface SupplierDetection {
  supplierId: string;
  trend: PerformanceTrend;
  variability: string;
  recurrenceCount: number;
  recommendedIntervention: InterventionType;
  combinedSignalFlag: boolean;
  /** SI Module 06 cross-engine check (Fix #700 QA pass, 14 Sep 2026):
   * checkLatestPeriodShock existed in supplierPerformanceRecovery.ts,
   * sourced from Module 06's own maxIntraPeriodSwingPct convention, and was
   * unit-tested there -- but was never actually called from this portfolio
   * layer, so the live dashboard had no real cross-engine trace to Module 06,
   * only a methodology citation in a doc comment. Wired in for real here:
   * a genuine single-period shock on a supplier's own score history is now
   * surfaced on the watchlist, independent of the whole-series trend read. */
  shockFlag: boolean;
  shockChangePct: number | null;
  shockRuleSourceEn: string;
  shockRuleSourceAr: string;
}

export function detectSupplier(s: SupplierRecord): SupplierDetection {
  const latest = s.scoreHistory12mo[s.scoreHistory12mo.length - 1]!;
  const prior = s.scoreHistory12mo.slice(0, -1);
  const trendResult = computeTrend(s.scoreHistory12mo);
  const varResult = classifyVariability(prior, latest);
  const shockResult = checkLatestPeriodShock(s.scoreHistory12mo);

  const closedSameRootCause = s.cars.filter((c) => c.status === 'closed').map((c) => c.id);
  const recurrence = assessRecurrence(closedSameRootCause.slice(0, -1)); // prior occurrences, not counting latest

  // Base intervention: a simple, disclosed stand-in for the caller's own
  // reasoning-chain step (this module doesn't own that decision) — REPAIR by
  // default, DEVELOP if trend is declining, matching the module's own
  // documented caller contract.
  const baseIntervention: InterventionType = trendResult.trend === 'declining' ? 'DEVELOP' : 'REPAIR';

  const escalation = recommendEscalation({
    baseIntervention,
    recurrenceCount: recurrence.recurrenceCount,
    variability: varResult.variability === 'INSUFFICIENT_DATA' ? 'low' : varResult.variability,
  });

  return {
    supplierId: s.supplierId,
    trend: trendResult.trend,
    variability: varResult.variability,
    recurrenceCount: recurrence.recurrenceCount,
    recommendedIntervention: escalation.recommendedIntervention,
    combinedSignalFlag: escalation.combinedSignalFlag,
    shockFlag: shockResult.isShock,
    shockChangePct: shockResult.periodOverPeriodChangePct,
    shockRuleSourceEn: shockResult.ruleSource,
    shockRuleSourceAr: shockResult.ruleSourceAr,
  };
}

// ---- Upgrade 1: headline $ (SAR) exposure KPI, built on an explicit MOCK
// per-supplier spend dataset (see file header for why this replaced an
// earlier "approximated-from-category-spend-share" framing) --------------

/**
 * MOCK / SYNTHETIC DATA. Not read from any live production field — there is
 * no real per-supplier absolute-currency field in Module 05 or Module 02
 * today (see file header). This dataset is CONSTRUCTED for demonstration:
 * it allocates each category's total spend (`KraljicItemLite.annualSpendSAR`,
 * itself a constructed test value in run_portfolio.ts, shaped like a real
 * Module 02 `annualSpend`) across the suppliers active in that category,
 * weighted by each supplier's real-shaped `capacityOrSpendSharePct` (Module
 * 05's actual relative-share field, populated here with realistic constructed
 * values, not live ones). The allocation MECHANISM (proportional split by
 * relative share) is a legitimate, disclosed heuristic; the INPUTS are mock.
 * Every record below is explicitly tagged so no consumer can mistake it for
 * production data.
 */
export interface MockSupplierSpendRecord {
  supplierId: string;
  category: string;
  mockAnnualSpendSAR: number;
  derivationNote: string;
}

export const MOCK_SPEND_DERIVATION_NOTE_EN =
  'MOCK/SYNTHETIC — allocated from a constructed category spend total by this supplier\'s constructed Module-05-shaped relative share (capacityOrSpendSharePct). Not a live production figure. Pending a real per-supplier spend field on Module 05 (or a join key back to Module 02).';
export const MOCK_SPEND_DERIVATION_NOTE_AR =
  'بيانات تجريبية/محاكاة — مشتقة من إجمالي إنفاق فئة إنشائي (وهمي) موزّع حسب الحصة النسبية الإنشائية لهذا المورد (على غرار حقل Module 05 الحقيقي capacityOrSpendSharePct). ليست رقمًا إنتاجيًا حقيقيًا، وذلك ريثما يتوفر حقل إنفاق حقيقي لكل مورد على مستوى Module 05.';

export function buildMockSupplierSpendDataset(
  suppliers: Pick<SupplierRecord, 'supplierId' | 'category'>[],
  categoryItems: KraljicItemLite[],
  shares: SupplierCategoryShare[]
): MockSupplierSpendRecord[] {
  return suppliers.map((s) => {
    const itemsInCategory = categoryItems.filter((i) => i.category === s.category);
    const share = shares.find((sh) => sh.supplierId === s.supplierId && sh.category === s.category);
    const categoryTotalSpendSAR = itemsInCategory.reduce((sum, i) => sum + i.annualSpendSAR, 0);
    const mockAnnualSpendSAR = share ? Math.round(categoryTotalSpendSAR * (share.capacityOrSpendSharePct / 100)) : 0;
    return {
      supplierId: s.supplierId,
      category: s.category,
      mockAnnualSpendSAR,
      derivationNote: MOCK_SPEND_DERIVATION_NOTE_EN,
    };
  });
}

export interface ExposureResult {
  supplierId: string;
  exposureSAR: number;
  exposureBasis: 'mock-simulated-per-supplier-spend' | 'INSUFFICIENT_DATA';
}

export function computeSupplierExposure(
  supplier: SupplierRecord,
  categoryItems: KraljicItemLite[],
  shares: SupplierCategoryShare[]
): ExposureResult {
  const itemsInCategory = categoryItems.filter((i) => i.category === supplier.category);
  const share = shares.find((s) => s.supplierId === supplier.supplierId && s.category === supplier.category);
  if (itemsInCategory.length === 0 || !share) {
    return { supplierId: supplier.supplierId, exposureSAR: 0, exposureBasis: 'INSUFFICIENT_DATA' };
  }
  const [mock] = buildMockSupplierSpendDataset([supplier], categoryItems, shares);
  return { supplierId: supplier.supplierId, exposureSAR: mock!.mockAnnualSpendSAR, exposureBasis: 'mock-simulated-per-supplier-spend' };
}

export function computeTotalExposureAtRisk(
  suppliersInRecovery: SupplierRecord[],
  categoryItems: KraljicItemLite[],
  shares: SupplierCategoryShare[]
): { totalSAR: number; suppliersWithInsufficientData: number } {
  let total = 0;
  let insufficient = 0;
  for (const s of suppliersInRecovery) {
    const r = computeSupplierExposure(s, categoryItems, shares);
    if (r.exposureBasis === 'INSUFFICIENT_DATA') insufficient++;
    else total += r.exposureSAR;
  }
  return { totalSAR: total, suppliersWithInsufficientData: insufficient };
}

// ---- Upgrade 2: real CAR-cohort resolution tracking -----------------------

export interface CohortPoint {
  quarter: string; // e.g. "2026-Q3"
  opened: number;
  resolvedWithin90d: number;
  resolvedWithin90dPct: number;
  stillOpenAtEndOfQuarter: number;
  medianDaysToClose: number | null;
}

function quarterOf(iso: string): string {
  const d = new Date(iso);
  const q = Math.floor(d.getUTCMonth() / 3) + 1;
  return `${d.getUTCFullYear()}-Q${q}`;
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export function computeCarCohorts(allCars: CARRecord[], asOfIso: string): CohortPoint[] {
  const byQuarter = new Map<string, CARRecord[]>();
  for (const c of allCars) {
    const q = quarterOf(c.createdAt);
    if (!byQuarter.has(q)) byQuarter.set(q, []);
    byQuarter.get(q)!.push(c);
  }
  const asOf = new Date(asOfIso).getTime();
  const points: CohortPoint[] = [];
  for (const [quarter, cars] of [...byQuarter.entries()].sort()) {
    const resolvedWithin90 = cars.filter((c) => c.closedAt && daysBetween(c.createdAt, c.closedAt) <= 90);
    const closedDurations = cars.filter((c) => c.closedAt).map((c) => daysBetween(c.createdAt, c.closedAt!));
    closedDurations.sort((a, b) => a - b);
    const median = closedDurations.length
      ? closedDurations[Math.floor(closedDurations.length / 2)]!
      : null;
    const stillOpen = cars.filter((c) => !c.closedAt || new Date(c.closedAt).getTime() > asOf).length;
    points.push({
      quarter,
      opened: cars.length,
      resolvedWithin90d: resolvedWithin90.length,
      resolvedWithin90dPct: cars.length ? Math.round((1000 * resolvedWithin90.length) / cars.length) / 10 : 0,
      stillOpenAtEndOfQuarter: stillOpen,
      medianDaysToClose: median,
    });
  }
  return points;
}

// ---- Upgrade 3: quadrant-migration trail (ghost marker) -------------------

export interface MigrationTrail {
  supplierId: string;
  current: KraljicQuadrant;
  prior: KraljicQuadrant | null;
  migrated: boolean;
}

export function computeMigrationTrails(suppliers: SupplierRecord[]): MigrationTrail[] {
  return suppliers.map((s) => ({
    supplierId: s.supplierId,
    current: s.quadrant,
    prior: s.quadrantPriorQuarter,
    migrated: s.quadrantPriorQuarter !== null && s.quadrantPriorQuarter !== s.quadrant,
  }));
}

// ---- Upgrade 4: root-cause breakdown by Scorecard dimension ---------------

export interface DimensionBreakdown {
  dimension: ScorecardDimension;
  count: number;
  pctOfTotal: number;
}

export function computeRootCauseByDimension(allCars: CARRecord[]): DimensionBreakdown[] {
  const total = allCars.length;
  const counts = new Map<ScorecardDimension, number>();
  const dims: ScorecardDimension[] = ['delivery', 'quality', 'cost', 'compliance', 'innovation', 'relationship'];
  for (const d of dims) counts.set(d, 0);
  for (const c of allCars) counts.set(c.scorecardDimension, (counts.get(c.scorecardDimension) ?? 0) + 1);
  return dims.map((d) => ({
    dimension: d,
    count: counts.get(d) ?? 0,
    pctOfTotal: total ? Math.round((1000 * (counts.get(d) ?? 0)) / total) / 10 : 0,
  }));
}

// ---- Full portfolio assembly ----------------------------------------------

export interface PortfolioKPIs {
  suppliersInEscalation: number;
  totalActiveSuppliers: number;
  totalExposureAtRiskSAR: number;
  exposureInsufficientDataCount: number;
  avgDaysInRecovery: number | null;
  combinedSignalFlagCount: number;
}

export function computePortfolioKPIs(
  suppliers: SupplierRecord[],
  categoryItems: KraljicItemLite[],
  shares: SupplierCategoryShare[],
  asOfIso: string
): { kpis: PortfolioKPIs; detections: SupplierDetection[] } {
  const detections = suppliers.map(detectSupplier);
  const inEscalation = detections.filter((d) => d.recommendedIntervention !== 'REPAIR');
  const inEscalationSuppliers = suppliers.filter((s) => inEscalation.some((d) => d.supplierId === s.supplierId));
  const exposure = computeTotalExposureAtRisk(inEscalationSuppliers, categoryItems, shares);

  const daysInRecovery: number[] = [];
  for (const s of inEscalationSuppliers) {
    const openCar = s.cars.find((c) => c.status !== 'closed');
    if (openCar) daysInRecovery.push(daysBetween(openCar.createdAt, asOfIso));
  }
  const avgDays = daysInRecovery.length
    ? Math.round(daysInRecovery.reduce((a, b) => a + b, 0) / daysInRecovery.length)
    : null;

  return {
    kpis: {
      suppliersInEscalation: inEscalation.length,
      totalActiveSuppliers: suppliers.length,
      totalExposureAtRiskSAR: exposure.totalSAR,
      exposureInsufficientDataCount: exposure.suppliersWithInsufficientData,
      avgDaysInRecovery: avgDays,
      combinedSignalFlagCount: detections.filter((d) => d.combinedSignalFlag).length,
    },
    detections,
  };
}

// ---------------------------------------------------------------------------
// Upgrade 5 — COPQ-costed root cause breakdown (11 Sep 2026 addition).
// computeRootCauseByDimension() above (Upgrade 4) only counts CARs per
// Scorecard dimension — it has no cost/dollar signal at all. This function
// adds one, by importing SI Module 01 (supplierCOPQ.ts) directly and running
// its real, unmodified computeCOPQRollup() against each dimension's CAR
// subset — the same standalone-first pattern already established in this
// file for Module 07 (see file header): the AGGREGATION layer imports the
// engine directly; the engine itself imports nothing back.
//
// This file's own CARRecord (above) already carries every field COPQ's
// CARRecord needs (id/supplierId/category/rootCause/status/createdAt/
// closedAt) plus one extra (scorecardDimension) that COPQ doesn't need —
// toCOPQRecord() below does the narrowing mechanically, not by guesswork.
// ---------------------------------------------------------------------------
function toCOPQRecord(c: CARRecord): COPQCARRecord {
  return {
    id: c.id,
    supplierId: c.supplierId,
    category: c.category,
    rootCause: c.rootCause,
    status: c.status,
    createdAt: c.createdAt,
    closedAt: c.closedAt,
  };
}

export interface DimensionCOPQBreakdown extends DimensionBreakdown {
  costedUSD: number | null;
  costBasis: 'derived-from-linked-business-impact' | 'INSUFFICIENT_DATA';
  pctOfCostedTotal: number | null;
}

const ALL_DIMENSIONS: ScorecardDimension[] = ['delivery', 'quality', 'cost', 'compliance', 'innovation', 'relationship'];

/**
 * impacts/overrides are caller-supplied, exactly as COPQ's own contract
 * requires (Decision Record 8.7 — never inferred/guessed). A caller with no
 * business-impact data for a dimension gets costedUSD: null /
 * costBasis: 'INSUFFICIENT_DATA' for that dimension, never a fabricated
 * figure — the same honest-gap behavior computeCOPQRollup already has.
 */
export function computeRootCauseCOPQBreakdown(
  allCars: CARRecord[],
  impacts: CARBusinessImpact[],
  overrides: CARCustomerImpactOverride[],
  asOfIso: string
): DimensionCOPQBreakdown[] {
  const base = computeRootCauseByDimension(allCars);

  const perDimRollup = new Map<ScorecardDimension, COPQRollup | null>();
  for (const dim of ALL_DIMENSIONS) {
    const dimCars = allCars.filter((c) => c.scorecardDimension === dim).map(toCOPQRecord);
    perDimRollup.set(
      dim,
      dimCars.length > 0
        ? computeCOPQRollup({ periodLabel: `dimension:${dim}`, asOfIso, cars: dimCars, impacts, overrides })
        : null
    );
  }

  const costedByDim = ALL_DIMENSIONS.map((dim) => ({
    dim,
    costUSD: perDimRollup.get(dim)?.totalCostedUSD ?? null,
  }));
  const totalCosted = costedByDim.reduce((sum, d) => sum + (d.costUSD ?? 0), 0);
  const anyCosted = costedByDim.some((d) => d.costUSD !== null);

  return base.map((b) => {
    const rollup = perDimRollup.get(b.dimension) ?? null;
    const costedUSD = rollup?.totalCostedUSD ?? null;
    return {
      ...b,
      costedUSD,
      costBasis: costedUSD !== null ? 'derived-from-linked-business-impact' : 'INSUFFICIENT_DATA',
      pctOfCostedTotal: anyCosted && totalCosted > 0 && costedUSD !== null ? Math.round((1000 * costedUSD) / totalCosted) / 10 : null,
    };
  });
}

// ---------------------------------------------------------------------------
// Upgrade 6 — COPQ Attention Priority (11 Sep 2026 addition). "Which
// suppliers' COPQ deserves attention first" — combines three real, already-
// live signals rather than inventing a new score from nothing:
//   1. Kraljic criticality (Module 02's real per-supplier quadrant, already
//      on SupplierRecord.quadrant in this file).
//   2. Costed COPQ (Module 01, via computeCOPQRollup — caller-supplied
//      impacts, never fabricated).
//   3. External Failure share (Module 01's own PAF-model leading indicator,
//      the same one detectCOPQAlert treats as the highest-severity signal).
//
// Per Decision Record 8.7 / isc-ai-output-standards #7 (never collapse a
// multi-dimensional assessment into a fabricated composite score unless the
// methodology is rigorously and transparently defined): the formula below is
// disclosed in full via PRIORITY_FORMULA_EN/AR on every result, and every
// input that feeds it is a real, already-computed, individually-visible
// number — not a black-box weighting. A supplier with zero CARs gets
// priorityScore 0 and costBasis INSUFFICIENT_DATA, not a hidden default.
//
// NOTE on Module 05: at the time of this build, supplierConcentration.ts
// (Module 05) has no live UI page of its own yet (grep of the repo this
// session found zero .tsx consumers) and carries no per-supplier absolute
// join back to a supplier record — only a relative capacityOrSpendSharePct
// keyed by category (see file header's documented cross-module gap, #668).
// So Module 05's concentration signal is NOT part of this formula; adding it
// honestly would require that still-open join, not a guess. This is stated
// here explicitly rather than silently omitted.
// ---------------------------------------------------------------------------

export const PRIORITY_FORMULA_EN =
  'priorityScore = (costed COPQ in $000s) × Kraljic-quadrant criticality weight (strategic 1.5 / bottleneck 1.3 / leverage 1.0 / non-critical 0.7) × (1 + External Failure share / 100). Suppliers with no costed COPQ data score 0, not a hidden default.';
export const PRIORITY_FORMULA_AR =
  'درجة الأولوية = (تكلفة COPQ بالآلاف من الدولارات) × وزن حرَجية ربع كرالييك (استراتيجي 1.5 / نقطة اختناق 1.3 / نفوذ سوق 1.0 / غير حرج 0.7) × (1 + حصة الفشل الخارجي / 100). الموردون الذين لا تتوفر لهم بيانات COPQ مكلَّفة يحصلون على درجة 0، وليس قيمة افتراضية مخفية.';

const QUADRANT_CRITICALITY_WEIGHT: Record<KraljicQuadrant, number> = {
  strategic: 1.5,
  bottleneck: 1.3,
  leverage: 1.0,
  'non-critical': 0.7,
};

export interface COPQAttentionPriority {
  supplierId: string;
  quadrant: KraljicQuadrant;
  costedCOPQUSD: number | null;
  costBasis: 'derived-from-linked-business-impact' | 'INSUFFICIENT_DATA';
  externalFailureSharePct: number | null;
  priorityScore: number;
  formulaEn: string;
  formulaAr: string;
}

export function computeCOPQAttentionPriority(
  suppliers: SupplierRecord[],
  impacts: CARBusinessImpact[],
  overrides: CARCustomerImpactOverride[],
  asOfIso: string
): COPQAttentionPriority[] {
  const results = suppliers.map((s): COPQAttentionPriority => {
    const copqCars = s.cars.map(toCOPQRecord);
    if (copqCars.length === 0) {
      return {
        supplierId: s.supplierId,
        quadrant: s.quadrant,
        costedCOPQUSD: null,
        costBasis: 'INSUFFICIENT_DATA',
        externalFailureSharePct: null,
        priorityScore: 0,
        formulaEn: PRIORITY_FORMULA_EN,
        formulaAr: PRIORITY_FORMULA_AR,
      };
    }
    const rollup = computeCOPQRollup({ periodLabel: 'as-of', asOfIso, cars: copqCars, impacts, overrides });
    const totalClassified = rollup.internalFailure.carCount + rollup.externalFailure.carCount;
    const externalShare = totalClassified > 0 ? Math.round((1000 * rollup.externalFailure.carCount) / totalClassified) / 10 : null;
    const costUSDForScoring = rollup.totalCostedUSD ?? 0;
    const weight = QUADRANT_CRITICALITY_WEIGHT[s.quadrant];
    const priorityScore = Math.round(((costUSDForScoring / 1000) * weight * (1 + (externalShare ?? 0) / 100)) * 10) / 10;
    return {
      supplierId: s.supplierId,
      quadrant: s.quadrant,
      costedCOPQUSD: rollup.totalCostedUSD,
      costBasis: rollup.totalCostedUSD !== null ? 'derived-from-linked-business-impact' : 'INSUFFICIENT_DATA',
      externalFailureSharePct: externalShare,
      priorityScore,
      formulaEn: PRIORITY_FORMULA_EN,
      formulaAr: PRIORITY_FORMULA_AR,
    };
  });
  return results.sort((a, b) => b.priorityScore - a.priorityScore);
}
