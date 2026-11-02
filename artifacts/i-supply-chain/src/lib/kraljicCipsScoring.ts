/**
 * CIPS seven-step weighted Kraljic scoring (Round B4, item 2).
 *
 * The seven steps, as CIPS publishes them: (1) define relevant risk and
 * profit factors, (2) weight them, (3) define a scale where the high end
 * means high risk / high profit potential, (4) compute the maximum weighted
 * score for each axis, (5) assess each factor, (6) multiply weight by
 * assessment and total each axis, (7) place the item on the matrix.
 * Source: CIPS, "How to optimise purchasing costs with the Kraljic Matrix"
 * (2026). The factor LISTS are CIPS's. The default equal weights, the 50%
 * boundary, the borderline margin and the coverage rule are ISC defaults:
 * CIPS publishes none of them. All are caller-overridable.
 *
 * Honest limits: scoring is subjective by nature (Gelderman & van Weele
 * 2003). This module makes the subjectivity visible: it flags borderline
 * items and shows which single weight change would flip the quadrant.
 * Missing factors are never guessed; too few answers = 'insufficient'.
 *
 * STANDALONE-FIRST: no imports.
 */

export type Bilingual = { en: string; ar: string };
export type Quadrant = 'strategic' | 'leverage' | 'bottleneck' | 'non-critical';
export type Axis = 'risk' | 'profit';

export interface Factor { id: string; axis: Axis; label: Bilingual; defaultWeight: number }

const f = (id: string, axis: Axis, en: string, ar: string): Factor => ({ id, axis, label: { en, ar }, defaultWeight: 1 });

/** CIPS's own factor lists. */
export const CIPS_FACTORS: Factor[] = [
  f('exp', 'risk', 'Experience with the product', 'الخبرة بالمنتج'),
  f('sdbal', 'risk', 'Supply / demand balance', 'توازن العرض والطلب'),
  f('complex', 'risk', 'Supply chain complexity', 'تعقيد سلسلة الإمداد'),
  f('fin', 'risk', 'Financial risks', 'المخاطر المالية'),
  f('safeenv', 'risk', 'Safety and environmental risk', 'مخاطر السلامة والبيئة'),
  f('design', 'risk', 'Design maturity', 'نضج التصميم'),
  f('mfg', 'risk', 'Manufacturing complexity', 'تعقيد التصنيع'),
  f('mkt', 'profit', 'Structure of the market', 'هيكل السوق'),
  f('spend', 'profit', 'Value of spend', 'قيمة الإنفاق'),
  f('psdbal', 'profit', 'Supply / demand balance', 'توازن العرض والطلب'),
  f('peff', 'profit', 'Efficiency of the procurement process', 'كفاءة عملية الشراء'),
  f('pdev', 'profit', 'Development of the procurement process', 'تطوير عملية الشراء'),
];

export const SCALE_NOTE: Bilingual = {
  en: 'Rate each factor from 1 to 5, where 5 means it pushes risk (or profit potential) up.',
  ar: 'قيّم كل عامل من 1 إلى 5، حيث تعني 5 أنه يرفع الخطر (أو الربحية المحتملة).',
};

export interface ScoringConfig {
  /** Weight per factor id; default 1 (equal). Weight 0 switches a factor off. */
  weights?: Record<string, number>;
  /** Boundary as a share of the maximum score (0-100). ISC default 50. */
  boundaryPct?: number;
  /** Within this many points of the boundary on an axis = borderline. ISC default 5. */
  borderlineMargin?: number;
  /** Minimum share of weighted factors answered per axis. ISC default 0.6. */
  minCoverage?: number;
}

export const DEFAULTS = { boundaryPct: 50, borderlineMargin: 5, minCoverage: 0.6 } as const;

export interface AxisScore {
  /** 0-100 share of the maximum weighted score, over answered factors only. */
  pct: number;
  weighted: number;
  maxWeighted: number;
  answered: number;
  total: number;
  coverage: number;
}

export interface ScoringResult {
  status: 'scored' | 'insufficient';
  risk: AxisScore;
  profit: AxisScore;
  quadrant: Quadrant | null;
  borderline: boolean;
  borderlineAxes: Axis[];
  /** Factors whose weight change (to 0 or doubled) would flip the quadrant. */
  flipFactors: Array<{ id: string; label: Bilingual; flipsTo: Quadrant }>;
  missing: Array<{ id: string; axis: Axis; label: Bilingual }>;
  stepsNoteEn: string;
  stepsNoteAr: string;
}

export function quadrantFor(riskPct: number, profitPct: number, boundary: number): Quadrant {
  const highRisk = riskPct >= boundary;
  const highProfit = profitPct >= boundary;
  if (highProfit && highRisk) return 'strategic';
  if (highProfit) return 'leverage';
  if (highRisk) return 'bottleneck';
  return 'non-critical';
}

function axisScore(axis: Axis, ratings: Record<string, number | null | undefined>, weights: Record<string, number>, factors: Factor[]): AxisScore {
  const fs = factors.filter((x) => x.axis === axis && (weights[x.id] ?? x.defaultWeight) > 0);
  const total = fs.length;
  let weighted = 0; let maxWeighted = 0; let answered = 0;
  for (const x of fs) {
    const r = ratings[x.id];
    const w = weights[x.id] ?? x.defaultWeight;
    if (typeof r === 'number' && r >= 1 && r <= 5) {
      weighted += w * r; maxWeighted += w * 5; answered += 1;
    }
  }
  const pct = maxWeighted === 0 ? 0 : (weighted / maxWeighted) * 100;
  return { pct: Math.round(pct * 10) / 10, weighted, maxWeighted, answered, total, coverage: total === 0 ? 0 : answered / total };
}

export function scoreItem(ratings: Record<string, number | null | undefined>, config: ScoringConfig = {}, factors: Factor[] = CIPS_FACTORS): ScoringResult {
  const weights = config.weights ?? {};
  const boundary = config.boundaryPct ?? DEFAULTS.boundaryPct;
  const margin = config.borderlineMargin ?? DEFAULTS.borderlineMargin;
  const minCov = config.minCoverage ?? DEFAULTS.minCoverage;

  const risk = axisScore('risk', ratings, weights, factors);
  const profit = axisScore('profit', ratings, weights, factors);
  const missing = factors
    .filter((x) => (weights[x.id] ?? x.defaultWeight) > 0 && !(typeof ratings[x.id] === 'number' && (ratings[x.id] as number) >= 1 && (ratings[x.id] as number) <= 5))
    .map((x) => ({ id: x.id, axis: x.axis, label: x.label }));

  const insufficient = risk.coverage < minCov || profit.coverage < minCov;
  if (insufficient) {
    return {
      status: 'insufficient', risk, profit, quadrant: null, borderline: false, borderlineAxes: [], flipFactors: [], missing,
      stepsNoteEn: `Not enough factors answered (need at least ${Math.round(minCov * 100)}% on each axis). ISC does not guess.`,
      stepsNoteAr: `عدد العوامل المُجاب عنها غير كافٍ (يلزم ${Math.round(minCov * 100)}% على الأقل لكل محور). ISC لا تخمّن.`,
    };
  }
  const quadrant = quadrantFor(risk.pct, profit.pct, boundary);
  const borderlineAxes: Axis[] = [];
  if (Math.abs(risk.pct - boundary) <= margin) borderlineAxes.push('risk');
  if (Math.abs(profit.pct - boundary) <= margin) borderlineAxes.push('profit');

  // Sensitivity: would switching one factor off, or doubling it, change the quadrant?
  const flip: ScoringResult['flipFactors'] = [];
  for (const x of factors) {
    const base = weights[x.id] ?? x.defaultWeight;
    if (base <= 0) continue;
    for (const alt of [0, base * 2]) {
      const w2 = { ...weights, [x.id]: alt };
      const r2 = axisScore('risk', ratings, w2, factors);
      const p2 = axisScore('profit', ratings, w2, factors);
      if (r2.maxWeighted === 0 || p2.maxWeighted === 0) continue;
      const q2 = quadrantFor(r2.pct, p2.pct, boundary);
      if (q2 !== quadrant && !flip.some((z) => z.id === x.id)) flip.push({ id: x.id, label: x.label, flipsTo: q2 });
    }
  }
  return {
    status: 'scored', risk, profit, quadrant, borderline: borderlineAxes.length > 0, borderlineAxes, flipFactors: flip, missing,
    stepsNoteEn: 'Scored with the CIPS seven-step method. Weights, boundary and margin are ISC defaults you can change.',
    stepsNoteAr: 'تم التقييم بطريقة CIPS ذات الخطوات السبع. الأوزان والحد والهامش قيم افتراضية من ISC يمكنك تغييرها.',
  };
}
