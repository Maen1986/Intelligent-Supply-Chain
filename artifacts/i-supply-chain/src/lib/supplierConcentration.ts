/**
 * SI Module 05 -- Dependency, Concentration & True Diversification (9 Sep 2026).
 *
 * BUILT as a pure, tested library -- no UI this cycle, same reasoning as
 * Modules 01/02/03: this is the analysis every other SI module (09
 * consultancy framing, 10 signal detection) reads output from, so it ships
 * standalone-first and gets its own worked-example document rather than
 * waiting for a screen that doesn't exist yet (Charter core instruction #12).
 *
 * This module replaces the 28 Aug draft's unsourced metric definitions with
 * four independently-documented frameworks (see SI-05-Dependency-
 * Concentration-Diversification.md for full citations):
 *
 *   1. Herfindahl-Hirschman Index (HHI) -- concentration scoring, DOJ/FTC
 *      merger-guideline convention: Sigma(share^2), thresholds 1500/2500.
 *   2. MIT Sheffi Time-to-Recover (TTR) / Time-to-Survive (TTS) -- exposure
 *      metric replacing the draft's ungrounded "Time-to-Replace."
 *   3. Common-Cause Failure (CCF) analysis (reliability engineering) --
 *      grounds testing across ten dimensions instead of trusting nominal
 *      supplier count as independence.
 *   4. N-tier hidden concentration / "diamond structure" -- sourced term
 *      for what the draft called APPARENT DIVERSIFICATION at the sub-tier
 *      level specifically.
 *
 * CORRECTED INFRASTRUCTURE CLAIM (found during this rewrite, not carried
 * forward silently, per the Charter's build-to-sustain standard, core
 * instruction #13): the 28 Aug draft said this module would consume #379
 * (freeZoneRouting.ts) for port/corridor data. Checked against the live
 * #379 code: it is a JAFZA/KEZAD storage-cost-vs-duty calculator for a
 * routing choice already made, not a database of which supplier routes
 * through which port. Port/corridor/site dependency values below come from
 * Module 03's SupplierFact records instead (dataSource-tagged, standalone-
 * first). #379 remains a legitimate *downstream* tool -- once this module
 * flags a port-dimension common-mode finding, a client can be pointed to
 * #379 to price the cost of qualifying an alternate routing -- but it is
 * not the source of detection.
 *
 * DECISION (Lock-In Index weighting) -- OWNER INPUT NEEDED item 1 on the
 * spec. Per the engine's standing "you decide" rule (owner instruction,
 * 8 Sep 2026: resolve architectural OWNER INPUT NEEDED markers rather than
 * blocking a build on them, same precedent as supplierObjectModel.ts's
 * DECISION 1/2), this ships with EQUAL weighting (25% each) across
 * switching cost, tooling/IP ownership, regulatory re-approval burden, and
 * integration effort as the disclosed default -- the standard convention
 * for a composite score with no stated preference order -- with every
 * caller free to pass explicit weights that sum to 1. The default is never
 * silently applied without being named in the result.
 *
 * DECISION (Time-to-Recover default) -- OWNER INPUT NEEDED item 2 on the
 * spec. Per Decision Record 8.7 (never fabricate a data point to fill a
 * gap) and the same precedent #379 itself sets (no benchmark found for
 * mainland warehousing -> left blank, not invented), TTR stays
 * INSUFFICIENT_DATA until a client-supplied or documented figure exists.
 * No industry-benchmark default is invented here.
 *
 * Design precedent followed (same as kraljicScoring.ts / supplierDependency
 * .ts / supplierObjectModel.ts / supplierQualificationGates.ts): pure
 * functions, no side effects, no network calls, no fabricated data. Every
 * derived judgment is a fixed, disclosed rule (Decision Record 8.7), and
 * this module keeps only a soft dependency on kraljicScoring.ts (the
 * KraljicQuadrant type), same pattern as supplierQualificationGates.ts's
 * determineDueDiligenceTier -- callers who haven't run Module 02 can still
 * use this module.
 */

import type { KraljicQuadrant } from './kraljicScoring';
import type { EvidenceStage, SupplierFact } from './supplierObjectModel';
import { evidenceRank } from './supplierObjectModel';

// ---------------------------------------------------------------------------
// Core vocabulary
// ---------------------------------------------------------------------------

export type DependencyDimension =
  | 'supplier'
  | 'site'
  | 'country'
  | 'region'
  | 'port'
  | 'rawMaterial'
  | 'subTier'
  | 'technology'
  | 'carrier'
  | 'corridor'
  | 'energySource';

export const DEPENDENCY_DIMENSIONS: DependencyDimension[] = [
  'supplier',
  'site',
  'country',
  'region',
  'port',
  'rawMaterial',
  'subTier',
  'technology',
  'carrier',
  'corridor',
  'energySource',
];

/** DOJ/FTC merger-guideline convention, widely adopted in procurement risk practice. */
export type ConcentrationBand = 'competitive' | 'moderatelyConcentrated' | 'highlyConcentrated';

export const HHI_MODERATE_THRESHOLD = 1500;
export const HHI_HIGH_THRESHOLD = 2500;

export type DiversificationFlag = 'APPARENT_DIVERSIFICATION' | 'TRUE_DIVERSIFICATION';

// ---------------------------------------------------------------------------
// 1. HHI concentration scoring
// ---------------------------------------------------------------------------

/** Sigma(share^2), shares expressed as percentages (0-100). Standard HHI, not an ISC invention. */
export function computeHHI(sharesPct: number[]): number {
  return sharesPct.reduce((sum, s) => sum + s * s, 0);
}

export function bandForHHI(hhi: number): ConcentrationBand {
  if (hhi > HHI_HIGH_THRESHOLD) return 'highlyConcentrated';
  if (hhi >= HHI_MODERATE_THRESHOLD) return 'moderatelyConcentrated';
  return 'competitive';
}

/** Per SI-05 doc: HHI > 1,500 on a dimension is APPARENT_DIVERSIFICATION; below is TRUE_DIVERSIFICATION. */
export function flagForHHI(hhi: number): DiversificationFlag {
  return hhi > HHI_MODERATE_THRESHOLD ? 'APPARENT_DIVERSIFICATION' : 'TRUE_DIVERSIFICATION';
}

// ---------------------------------------------------------------------------
// 2. Common-mode dependency test across the ten dimensions (CCF-grounded)
// ---------------------------------------------------------------------------

export interface DependencyFactInput {
  value: string;
  evidenceStage: EvidenceStage;
}

export interface ConcentrationSupplierInput {
  supplierId: string;
  name: string;
  /** Optional -- soft dependency on Module 02, see header. */
  kraljicQuadrant?: KraljicQuadrant;
  /** This supplier's share (0-100) of total qualified capacity or spend for the item in question. The candidate set's shares should sum to ~100. */
  capacityOrSpendSharePct: number;
  /** One fact per dimension this supplier has evidence for; dimensions with no fact are excluded from that dimension's grouping, not assumed zero. */
  dependencyFacts: Partial<Record<DependencyDimension, DependencyFactInput>>;
}

export interface CommonModeFinding {
  dimension: DependencyDimension;
  sharedValue: string;
  affectedSuppliers: string[];
  /** Combined share (0-100) of the affected suppliers on this shared value. */
  affectedSharePct: number;
  /**
   * HHI computed across ALL groups on this dimension (not just the affected
   * group) -- the dimension's overall concentration score.
   *
   * QA correction (customer-simulation pass, 9 Sep 2026): this HHI is
   * computed only over suppliers who have a logged fact for this dimension
   * -- see dimensionCoverageSharePct. A reader must not treat it as the
   * whole portfolio's concentration if coverage is well below 100%; a low
   * apparent concentration could simply mean most of the portfolio hasn't
   * been asked about this dimension yet, not that it is genuinely
   * diversified.
   */
  hhi: number;
  /** Share (0-100) of the candidate set that had a fact for this dimension at all -- what the hhi/flag above is actually computed over. Below 100 means part of the portfolio has no evidence yet on this dimension, not that it's confirmed diversified. */
  dimensionCoverageSharePct: number;
  concentrationBand: ConcentrationBand;
  flag: DiversificationFlag;
  /** True only for the subTier dimension with 2+ suppliers sharing a value -- the n-tier hidden-concentration / "diamond structure" pattern. */
  isHiddenConcentration: boolean;
  /** Weakest evidence stage among the affected suppliers' facts for this dimension -- a finding is only as strong as its weakest supporting fact. */
  evidenceStage: EvidenceStage;
}

const EVIDENCE_ORDER: EvidenceStage[] = ['CLAIMED', 'DOCUMENTED', 'VALIDATED', 'OBSERVED', 'PROVEN'];

function weakestEvidenceStage(stages: EvidenceStage[]): EvidenceStage {
  return stages.reduce((weakest, s) => (evidenceRank(s) < evidenceRank(weakest) ? s : weakest), stages[0] ?? EVIDENCE_ORDER[0]);
}

/**
 * Tests one dimension for common-mode dependency. Suppliers sharing a value
 * are treated as one "node" for HHI purposes (their shares are summed) --
 * this is the CCF-grounded point: apparent N-way diversification collapses
 * to fewer effective nodes once a shared upstream dependency is found.
 */
export function testDimension(dimension: DependencyDimension, suppliers: ConcentrationSupplierInput[]): CommonModeFinding[] {
  const withFact = suppliers.filter((s) => s.dependencyFacts[dimension] !== undefined);
  if (withFact.length === 0) return [];

  const groups = new Map<string, ConcentrationSupplierInput[]>();
  for (const s of withFact) {
    const value = s.dependencyFacts[dimension]!.value;
    const g = groups.get(value) ?? [];
    g.push(s);
    groups.set(value, g);
  }

  const nodeShares = Array.from(groups.values()).map((g) => g.reduce((sum, s) => sum + s.capacityOrSpendSharePct, 0));
  const hhi = computeHHI(nodeShares);
  const band = bandForHHI(hhi);
  const flag = flagForHHI(hhi);
  const dimensionCoverageSharePct = nodeShares.reduce((sum, s) => sum + s, 0);

  const findings: CommonModeFinding[] = [];
  for (const [value, group] of groups.entries()) {
    if (group.length < 2) continue; // a shared-dependency finding requires 2+ suppliers converging on the same value
    findings.push({
      dimension,
      sharedValue: value,
      affectedSuppliers: group.map((s) => s.supplierId),
      affectedSharePct: group.reduce((sum, s) => sum + s.capacityOrSpendSharePct, 0),
      hhi,
      dimensionCoverageSharePct,
      concentrationBand: band,
      flag,
      isHiddenConcentration: dimension === 'subTier' && group.length >= 2,
      evidenceStage: weakestEvidenceStage(group.map((s) => s.dependencyFacts[dimension]!.evidenceStage)),
    });
  }
  return findings;
}

export function testAllDimensions(
  suppliers: ConcentrationSupplierInput[],
  dimensions: DependencyDimension[] = DEPENDENCY_DIMENSIONS,
): CommonModeFinding[] {
  return dimensions.flatMap((d) => testDimension(d, suppliers));
}

/** Optional pre-filter matching the spec's reasoning-chain step 1 -- not baked into testAllDimensions so callers without Module 02 data can still use this module. */
export function filterByKraljicCriticality(suppliers: ConcentrationSupplierInput[]): ConcentrationSupplierInput[] {
  return suppliers.filter((s) => s.kraljicQuadrant === 'strategic' || s.kraljicQuadrant === 'bottleneck');
}

// ---------------------------------------------------------------------------
// 3. MIT Sheffi Time-to-Recover / Time-to-Survive
// ---------------------------------------------------------------------------

export interface ShortfallResult {
  /** null when either input is missing -- INSUFFICIENT_DATA, never fabricated (see header DECISION). */
  shortfallWeeks: number | null;
  isSurvivable: boolean | null;
}

/**
 * Sheffi's decision rule: TTS >= TTR -> survivable without customer impact;
 * TTR > TTS -> a quantifiable shortfall window (TTR - TTS).
 */
export function computeShortfall(timeToRecoverWeeks: number | null, timeToSurviveWeeks: number | null): ShortfallResult {
  if (timeToRecoverWeeks === null || timeToSurviveWeeks === null) {
    return { shortfallWeeks: null, isSurvivable: null };
  }
  if (timeToSurviveWeeks >= timeToRecoverWeeks) {
    return { shortfallWeeks: null, isSurvivable: true };
  }
  return { shortfallWeeks: timeToRecoverWeeks - timeToSurviveWeeks, isSurvivable: false };
}

// ---------------------------------------------------------------------------
// 4. Lock-In Index
// ---------------------------------------------------------------------------

export interface LockInInputs {
  /** Each 0-5, higher = more locked in. */
  switchingCost: number;
  toolingIpOwnership: number;
  regulatoryReapprovalBurden: number;
  integrationEffort: number;
}

export interface LockInWeights {
  switchingCost: number;
  toolingIpOwnership: number;
  regulatoryReapprovalBurden: number;
  integrationEffort: number;
}

/** Disclosed default -- see header DECISION. Must sum to 1. */
export const DEFAULT_LOCK_IN_WEIGHTS: LockInWeights = {
  switchingCost: 0.25,
  toolingIpOwnership: 0.25,
  regulatoryReapprovalBurden: 0.25,
  integrationEffort: 0.25,
};

export function computeLockInIndex(inputs: LockInInputs, weights: LockInWeights = DEFAULT_LOCK_IN_WEIGHTS): number {
  return (
    inputs.switchingCost * weights.switchingCost +
    inputs.toolingIpOwnership * weights.toolingIpOwnership +
    inputs.regulatoryReapprovalBurden * weights.regulatoryReapprovalBurden +
    inputs.integrationEffort * weights.integrationEffort
  );
}

// ---------------------------------------------------------------------------
// 5. Supplier Intelligence Debt (platform-native, Module 03 evidence ladder)
// ---------------------------------------------------------------------------

const VALIDATED_RANK = evidenceRank('VALIDATED');

/** Facts below VALIDATED are the "unresolved" ones this metric costs out. */
export function countUnresolvedEvidenceGaps(facts: SupplierFact[]): number {
  return facts.filter((f) => evidenceRank(f.evidenceStage) < VALIDATED_RANK).length;
}

/**
 * costPerUnresolvedGapUSD is a required client input, not a default -- there
 * is no sourced, general-purpose dollar figure for "cost of one unresolved
 * evidence gap" to fall back on (Decision Record 8.7). Returns null
 * (INSUFFICIENT_DATA) when the client hasn't supplied one yet.
 */
export function computeIntelligenceDebtUSD(unresolvedGapCount: number, costPerUnresolvedGapUSD: number | null): number | null {
  if (costPerUnresolvedGapUSD === null) return null;
  return unresolvedGapCount * costPerUnresolvedGapUSD;
}

// ---------------------------------------------------------------------------
// 6. Hidden Concentration / Invisibility Index (n-tier / "diamond structure")
// ---------------------------------------------------------------------------

/**
 * Proportion (0-100) of this supplier's dependency share that sits at the
 * sub-tier level and has not been resolved past CLAIMED evidence. A
 * supplier with zero sub-tier facts logged at all is treated as fully
 * unresolved at that level (100% of its share) -- the client hasn't even
 * claimed to know its sub-tier structure, which is a stronger invisibility
 * signal than a claim that simply hasn't been validated yet, not a weaker
 * one.
 */
export function computeHiddenConcentrationIndex(capacityOrSpendSharePct: number, subTierFacts: SupplierFact[]): number {
  if (subTierFacts.length === 0) return capacityOrSpendSharePct;
  const unresolvedCount = subTierFacts.filter((f) => f.evidenceStage === 'CLAIMED').length;
  return capacityOrSpendSharePct * (unresolvedCount / subTierFacts.length);
}

// ---------------------------------------------------------------------------
// 7. Portfolio-level orchestration + output schema
// ---------------------------------------------------------------------------

export interface SupplierConcentrationMetricsInput {
  supplierId: string;
  timeToRecoverWeeks: number | null;
  timeToSurviveWeeks: number | null;
  lockIn: LockInInputs | null;
  lockInWeights?: LockInWeights;
  unresolvedEvidenceGapCount: number;
  costPerUnresolvedGapUSD: number | null;
  capacityOrSpendSharePct: number;
  subTierFacts: SupplierFact[];
}

export interface SupplierConcentrationMetrics {
  supplierId: string;
  timeToRecoverWeeks: number | null;
  timeToSurviveWeeks: number | null;
  shortfallWeeks: number | null;
  isSurvivable: boolean | null;
  lockInIndex: number | null;
  intelligenceDebtUSD: number | null;
  hiddenConcentrationIndex: number;
}

export function computeSupplierMetrics(input: SupplierConcentrationMetricsInput): SupplierConcentrationMetrics {
  const shortfall = computeShortfall(input.timeToRecoverWeeks, input.timeToSurviveWeeks);
  return {
    supplierId: input.supplierId,
    timeToRecoverWeeks: input.timeToRecoverWeeks,
    timeToSurviveWeeks: input.timeToSurviveWeeks,
    shortfallWeeks: shortfall.shortfallWeeks,
    isSurvivable: shortfall.isSurvivable,
    lockInIndex: input.lockIn ? computeLockInIndex(input.lockIn, input.lockInWeights) : null,
    intelligenceDebtUSD: computeIntelligenceDebtUSD(input.unresolvedEvidenceGapCount, input.costPerUnresolvedGapUSD),
    hiddenConcentrationIndex: computeHiddenConcentrationIndex(input.capacityOrSpendSharePct, input.subTierFacts),
  };
}

export interface ConcentrationAnalysisResult {
  portfolioId: string;
  commonModeFindings: CommonModeFinding[];
  metrics: SupplierConcentrationMetrics[];
}

export function analyzePortfolioConcentration(
  portfolioId: string,
  suppliers: ConcentrationSupplierInput[],
  metricsInputs: SupplierConcentrationMetricsInput[],
  dimensions: DependencyDimension[] = DEPENDENCY_DIMENSIONS,
): ConcentrationAnalysisResult {
  return {
    portfolioId,
    commonModeFindings: testAllDimensions(suppliers, dimensions),
    metrics: metricsInputs.map(computeSupplierMetrics),
  };
}

// ---------------------------------------------------------------------------
// 8. Bilingual narrative (consultancy framing, Module 09 consumer)
// ---------------------------------------------------------------------------

const DIMENSION_LABEL_EN: Record<DependencyDimension, string> = {
  supplier: 'supplier',
  site: 'site',
  country: 'country',
  region: 'region',
  port: 'port',
  rawMaterial: 'raw material',
  subTier: 'sub-tier source',
  technology: 'technology',
  carrier: 'carrier',
  corridor: 'corridor',
  energySource: 'energy source',
};

const DIMENSION_LABEL_AR: Record<DependencyDimension, string> = {
  supplier: 'المورّد',
  site: 'الموقع',
  country: 'الدولة',
  region: 'المنطقة',
  port: 'الميناء',
  rawMaterial: 'المادة الخام',
  subTier: 'مصدر الطبقة الفرعية',
  technology: 'التقنية',
  carrier: 'الناقل',
  corridor: 'الممر اللوجستي',
  energySource: 'مصدر الطاقة',
};

export function buildCommonModeFindingPrompt(finding: CommonModeFinding, isAr: boolean): string {
  const bandLabel = { competitive: isAr ? 'تنافسي' : 'competitive', moderatelyConcentrated: isAr ? 'متوسط التركّز' : 'moderately concentrated', highlyConcentrated: isAr ? 'مرتفع التركّز' : 'highly concentrated' }[finding.concentrationBand];

  const coverageCaveatEn = finding.dimensionCoverageSharePct < 100
    ? ` This concentration score covers ${finding.dimensionCoverageSharePct.toFixed(0)}% of the candidate set -- the rest has no logged fact for this dimension yet, not confirmed diversification.`
    : '';
  const coverageCaveatAr = finding.dimensionCoverageSharePct < 100
    ? ` تغطي درجة التركّز هذه ${finding.dimensionCoverageSharePct.toFixed(0)}٪ من المجموعة المرشحة -- الباقي لا يملك بيانات مسجّلة لهذا البُعد بعد، وهذا لا يعني تنويعاً مؤكداً.`
    : '';

  if (isAr) {
    const hidden = finding.isHiddenConcentration
      ? ` هذا تركّز خفي عند الطبقة الفرعية (نمط "البنية الماسية") -- يبدو التنويع ظاهرياً عند المستوى الأول بينما يتقارب المصدر الفعلي عند طبقة أدنى.`
      : '';
    return [
      `## نتيجة اعتماد مشترك: ${DIMENSION_LABEL_AR[finding.dimension]}`,
      `${finding.affectedSuppliers.length} موردين، يمثلون ${finding.affectedSharePct.toFixed(0)}٪ من القدرة/الإنفاق المؤهل، يتشاركون في: ${finding.sharedValue}.`,
      `مؤشر التركّز (HHI) = ${finding.hhi.toFixed(0)} (${bandLabel}).`,
      `التصنيف: ${finding.flag === 'APPARENT_DIVERSIFICATION' ? 'تنويع ظاهري وليس فعلياً' : 'تنويع فعلي'}.`,
      `درجة الأدلة الداعمة: ${finding.evidenceStage}.`,
      hidden,
      coverageCaveatAr,
    ].filter(Boolean).join('\n');
  }

  const hidden = finding.isHiddenConcentration
    ? ` This is hidden concentration at the sub-tier level (the "diamond structure" pattern) -- diversification appears real at the surface level while the actual source converges one tier down.`
    : '';
  return [
    `## Common-mode finding: ${DIMENSION_LABEL_EN[finding.dimension]}`,
    `${finding.affectedSuppliers.length} suppliers, representing ${finding.affectedSharePct.toFixed(0)}% of qualified capacity/spend, share: ${finding.sharedValue}.`,
    `Concentration Index (HHI) = ${finding.hhi.toFixed(0)} (${bandLabel}).`,
    `Flag: ${finding.flag === 'APPARENT_DIVERSIFICATION' ? 'Apparent, not real, diversification' : 'True diversification'}.`,
    `Supporting evidence stage: ${finding.evidenceStage}.`,
    hidden,
    coverageCaveatEn,
  ].filter(Boolean).join('\n');
}

export function buildSupplierMetricsPrompt(metrics: SupplierConcentrationMetrics, isAr: boolean): string {
  if (isAr) {
    const lines = [
      `## مقاييس الاعتمادية: ${metrics.supplierId}`,
      metrics.isSurvivable === null
        ? 'وقت الاستعادة/البقاء: بيانات غير كافية.'
        : metrics.isSurvivable
          ? `قابل للاحتمال: المخزون/البدائل تغطي فترة الاستعادة المقدّرة بالكامل.`
          : `فجوة زمنية ${metrics.shortfallWeeks} أسابيع بين وقت الاستعادة ووقت البقاء.`,
      metrics.lockInIndex !== null ? `مؤشر الارتباط بالمورّد: ${metrics.lockInIndex.toFixed(1)} من 5.` : 'مؤشر الارتباط بالمورّد: لم يُدخل بعد.',
      metrics.intelligenceDebtUSD !== null ? `دين المعرفة عن المورّد: ${metrics.intelligenceDebtUSD.toLocaleString()} دولار.` : 'دين المعرفة عن المورّد: بيانات غير كافية (لم يُحدد تكلفة الفجوة الواحدة).',
      `مؤشر الإخفاء عند الطبقة الفرعية: ${metrics.hiddenConcentrationIndex.toFixed(0)}٪.`,
    ];
    return lines.join('\n');
  }
  const lines = [
    `## Dependency metrics: ${metrics.supplierId}`,
    metrics.isSurvivable === null
      ? 'Time-to-Recover/Survive: insufficient data.'
      : metrics.isSurvivable
        ? 'Survivable: buffer/alternates fully cover the estimated recovery window.'
        : `${metrics.shortfallWeeks}-week shortfall window between recovery time and survival time.`,
    metrics.lockInIndex !== null ? `Lock-In Index: ${metrics.lockInIndex.toFixed(1)} of 5.` : 'Lock-In Index: not yet entered.',
    metrics.intelligenceDebtUSD !== null ? `Supplier Intelligence Debt: $${metrics.intelligenceDebtUSD.toLocaleString()}.` : 'Supplier Intelligence Debt: insufficient data (no per-gap cost set yet).',
    `Hidden Concentration (sub-tier) Index: ${metrics.hiddenConcentrationIndex.toFixed(0)}%.`,
  ];
  return lines.join('\n');
}
