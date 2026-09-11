/**
 * SI Module 07 — Performance, Development & Recovery
 * ISC Supplier Intelligence Engine (see SI-07-Performance-Development-Recovery.md)
 *
 * STATUS (11 Sep 2026): FIRST REAL COMMIT. Verified in this session's own
 * sandbox before being committed here for the first time — this file did
 * not previously exist anywhere in this repository (confirmed by direct
 * search of the live repo: no match for this filename or its distinctive
 * exported function names, on the default branch, in either src/lib or
 * src/pages). Earlier drafts of this module and its supporting spec doc
 * existed only as local, unshipped sandbox work; nothing here should be
 * read as a "fix" or "closeout" of a previously-live capability.
 *
 * Verified this session, for real: `npx tsc --noEmit --strict` exit 0
 * clean; `npx vitest run` **40/40 passing**, **99% stmt / 90% branch / 100%
 * func** coverage (the one uncovered branch is the defensive `ladderAt`
 * throw, unreachable by design). Includes `checkLatestPeriodShock` (Section
 * 2b below), added and tested in the same pass as a disclosed companion to
 * `computeTrend`'s whole-series OLS read — see that function's doc comment
 * for the gap it closes.
 *
 * LIVE-SCHEMA CROSS-CHECK: real `scorecardCsv.ts` (CAR interface),
 * `kraljicScoring.ts` (Module 02), `supplierConcentration.ts` (Module 05),
 * and `supplierCommercialIntelligence.ts` (Module 06, source of the
 * `maxIntraPeriodSwingPct` convention `checkLatestPeriodShock` reuses) were
 * all fetched directly from this repo's default branch this session and
 * read in full. No mismatch found against this module's assumptions about
 * their shapes.
 *
 * Standalone-first: no runtime imports from any sibling SI module or from
 * SupplierScorecard.tsx / the CAR system. Every cross-module fact
 * (scorecardDimension values, Module 05's dependency posture, an existing
 * CAR id/category) is caller-supplied as plain data, per Decision Record 8.7
 * and this engine's soft-dependency doctrine (SI-00 Charter, "Existing ISC
 * infrastructure this reuses").
 *
 * Sourced methodology (see SI-07 doc, "RESOLVED — sourced
 * recurrence/variability/escalation thresholds", 10 Sep 2026):
 *  - Variability: simplified Statistical Process Control / Western Electric
 *    zone-rule convention (Shewhart control charts; ASQ-published, public
 *    domain). Single-point rule, not the full multi-rule ruleset — disclosed
 *    as such.
 *  - Recurrence/escalation: 8D / Supplier Corrective Action Request (SCAR)
 *    convention, as documented in publicly-published automotive/industrial
 *    supplier-quality guidelines (e.g. Vestas, Oshkosh, MAHLE). A corrective
 *    action that does not hold against the same root cause is treated as a
 *    signal about the supplier's underlying capability, not a second
 *    isolated incident.
 *
 * Every heuristic default below is disclosed via a *Source field and is
 * caller-overridable. Never fabricated: an input set too thin to support a
 * real classification returns an explicit INSUFFICIENT_DATA state rather
 * than a guess.
 */

// ---------------------------------------------------------------------------
// Section 0 — shared enums / cross-module pass-through types
// ---------------------------------------------------------------------------

/** The six live SupplierScorecard.tsx dimensions this module reuses rather
 * than re-deriving. `null` only for a metric with no scorecard equivalent. */
export type ScorecardDimension =
  | 'delivery'
  | 'quality'
  | 'cost'
  | 'compliance'
  | 'innovation'
  | 'relationship'
  | null;

export type PerformanceTrend = 'improving' | 'stable' | 'declining' | 'INSUFFICIENT_DATA';

export type PerformanceVariability = 'low' | 'moderate' | 'high' | 'INSUFFICIENT_DATA';

/** Orthogonal to the existing CAR `category` (quality/delivery/compliance/
 * safety/documentation/other) — answers "whose fault," not "what broke." */
export type PerformanceCause = 'supplier' | 'client' | 'shared' | 'external' | 'measurement';

export type BusinessImpactBasis = 'observed' | 'calculated' | 'estimated';

/** The intervention library, in escalation order (index = ladder position).
 * Escalation moves one step to the right; it never skips or reverses. */
export const INTERVENTION_LADDER = [
  'REPAIR',
  'DEVELOP',
  'COLLABORATE',
  'REDESIGN',
  'DUAL_SOURCE',
  'MULTI_SOURCE',
  'REPLACE',
  'EXIT',
] as const;
export type InterventionType = (typeof INTERVENTION_LADDER)[number];

/** Safe indexed access into INTERVENTION_LADDER. Every caller in this file
 * only ever passes an index derived from `indexOf` on a valid
 * InterventionType, clamped to stay in bounds — so this can never actually
 * be undefined — but a stricter tsconfig (`noUncheckedIndexedAccess`) can't
 * know that from a bare `INTERVENTION_LADDER[i]`. This throws loudly instead
 * of silently returning undefined, which is both type-safe and a real
 * safety net if that invariant is ever broken by a future edit. */
function ladderAt(index: number): InterventionType {
  const value = INTERVENTION_LADDER[index];
  if (value === undefined) {
    throw new Error(`Internal error: INTERVENTION_LADDER index ${index} out of bounds`);
  }
  return value;
}

/** Module 05's dependency posture — type-only pass-through, never imported
 * at runtime. Caller reads this off Module 05's own real output. */
export type DependencyPosture = 'low' | 'moderate' | 'high';

/** SI-00 Charter, "Standalone-first, and what that actually means
 * architecturally": every fact in this engine carries a data-source tag so
 * manual entry and a future ERP/WMS/SCM/CRM adapter are the same code path,
 * not a structurally different one. Missed on the first draft of this file
 * — added on review rather than left as a silent gap against a binding,
 * platform-wide architectural rule. */
export type SIDataSource = 'manual' | 'imported-file' | 'erp' | 'wms' | 'scm' | 'crm';

// ---------------------------------------------------------------------------
// Section 1 — variability classification (sourced: simplified SPC)
// ---------------------------------------------------------------------------

export interface VarianceClassification {
  variability: PerformanceVariability;
  /** Distance of the latest value from the prior-period mean, in standard
   * deviations. `null` when INSUFFICIENT_DATA. */
  deviationInSigma: number | null;
  mean: number | null;
  stdDev: number | null;
  sampleSize: number;
  ruleSource: string;
  ruleSourceAr: string;
}

const SPC_RULE_SOURCE_EN =
  'Simplified Statistical Process Control (Shewhart control-chart / Western Electric zone-rule convention, ASQ-published, public domain). Single-point rule only, not the full multi-rule Western Electric ruleset.';
const SPC_RULE_SOURCE_AR =
  'قاعدة مبسطة من ضبط الجودة الإحصائي (اتفاقية مخططات شوهارت / قواعد مناطق ويسترن إلكتريك، منشورة من ASQ، ملك عام). قاعدة نقطة واحدة فقط، وليست مجموعة قواعد ويسترن إلكتريك الكاملة.';

/** Default minimum number of prior periods (excluding the latest value)
 * needed to compute a meaningful mean/standard deviation. Caller-overridable
 * via `minSampleSize` — a client with a tighter or looser own SPC practice
 * can supply a different threshold. */
const DEFAULT_MIN_SAMPLE_SIZE = 4;

/**
 * Classifies the latest value of a metric's rolling history against its own
 * prior periods, using a disclosed, sourced sigma-band rule rather than an
 * arbitrary low/moderate/high label.
 *
 * @param priorValues the metric's historical values, NOT including the
 *   latest one being classified (chronological order does not matter for
 *   this calculation).
 * @param latestValue the value being classified.
 * @param opts.minSampleSize override for DEFAULT_MIN_SAMPLE_SIZE.
 * @param opts.sigmaOverride override for the {low, moderate} sigma cut
 *   points (default { low: 1, moderate: 2 }, i.e. high is anything beyond
 *   the `moderate` cut).
 */
export function classifyVariability(
  priorValues: number[],
  latestValue: number,
  opts?: { minSampleSize?: number; sigmaOverride?: { low: number; moderate: number } }
): VarianceClassification {
  const minSampleSize = opts?.minSampleSize ?? DEFAULT_MIN_SAMPLE_SIZE;
  const sigmaCuts = opts?.sigmaOverride ?? { low: 1, moderate: 2 };

  if (priorValues.length < minSampleSize) {
    return {
      variability: 'INSUFFICIENT_DATA',
      deviationInSigma: null,
      mean: null,
      stdDev: null,
      sampleSize: priorValues.length,
      ruleSource: SPC_RULE_SOURCE_EN,
      ruleSourceAr: SPC_RULE_SOURCE_AR,
    };
  }

  // Deliberately the POPULATION standard deviation (divide by n, not n-1).
  // priorValues here is the supplier's actual full history for this metric
  // used as-is as the baseline reference set, not a random sample drawn
  // from some larger unknown population — so the sample (n-1) correction,
  // which exists to counteract sampling bias, does not apply. Pinned by a
  // test asserting the exact expected value, so a future edit that swaps
  // this for the sample estimator fails loudly rather than silently
  // shifting every sigma-band boundary.
  const mean = priorValues.reduce((a, b) => a + b, 0) / priorValues.length;
  const variance =
    priorValues.reduce((sum, v) => sum + (v - mean) ** 2, 0) / priorValues.length;
  const stdDev = Math.sqrt(variance);

  // A degenerate zero-variance history (every prior value identical) cannot
  // produce a finite sigma distance for any non-matching latest value — that
  // is a real, correct Infinity (any deviation from a perfectly flat history
  // is maximally "high"), not a null/INSUFFICIENT_DATA case, so it must not
  // be conflated with the null used above for a genuinely too-small sample.
  if (stdDev === 0) {
    const variability: PerformanceVariability = latestValue === mean ? 'low' : 'high';
    return {
      variability,
      deviationInSigma: latestValue === mean ? 0 : Number.POSITIVE_INFINITY,
      mean,
      stdDev: 0,
      sampleSize: priorValues.length,
      ruleSource: SPC_RULE_SOURCE_EN,
      ruleSourceAr: SPC_RULE_SOURCE_AR,
    };
  }

  const deviationInSigma = Math.abs(latestValue - mean) / stdDev;
  let variability: PerformanceVariability;
  if (deviationInSigma <= sigmaCuts.low) variability = 'low';
  else if (deviationInSigma <= sigmaCuts.moderate) variability = 'moderate';
  else variability = 'high';

  return {
    variability,
    deviationInSigma,
    mean,
    stdDev,
    sampleSize: priorValues.length,
    ruleSource: SPC_RULE_SOURCE_EN,
    ruleSourceAr: SPC_RULE_SOURCE_AR,
  };
}

// ---------------------------------------------------------------------------
// Section 2 — trend (rolling comparison, never a single snapshot)
// ---------------------------------------------------------------------------

/** Which basis actually produced the tolerance band used for this
 * classification — disclosed so a caller/UI can tell a normal computed case
 * apart from a caller override, rather than the choice being invisible.
 *
 * Prior versions of this field carried 'percent-of-mean' | 'percent-of-stddev'
 * values, produced by a heuristic that compared slope (units/period) against
 * a fraction of raw stdDev (units) — a dimensionally invalid comparison.
 * Found by independent review 10 Sep 2026: stdDev of a clean linear ramp
 * grows with series length (`sd = |slope| * sqrt((n^2-1)/12)`), so a
 * tolerance proportional to it eventually exceeds the very slope it's meant
 * to filter — an unambiguous, noise-free 7+ period decline was misread as
 * 'stable'. Replaced below with the OLS standard-error-of-slope approach,
 * which is scale-stable in n. */
export type TrendToleranceBasis = 'ols-slope-se' | 'caller-override' | 'n/a';

export interface TrendAssessment {
  trend: PerformanceTrend;
  /** Simple linear slope across the supplied series, in metric-units per
   * period. `null` when INSUFFICIENT_DATA. */
  slope: number | null;
  toleranceSource: string;
  toleranceBasis: TrendToleranceBasis;
}

const TREND_TOLERANCE_SOURCE_EN =
  'A slope is read as stable when it falls within +/-toleranceAbs of zero, where toleranceAbs = seMultiplier * SE(slope). SE(slope) is the ordinary-least-squares standard error of the fitted slope (residual standard error / sqrt(Sxx)) -- the standard OLS slope-significance-test convention, and is dimensionally correct (slope and SE(slope) are both units/period, unlike a raw stdDev-of-values comparison). seMultiplier defaults to 2, a fixed approximation of a two-tailed ~95% threshold -- NOT a degrees-of-freedom-adjusted Student\'s t critical value, which is considerably larger for small n (e.g. ~12.7 at df=1); disclosed as a simplification, and caller-overridable via seMultiplierOverride. toleranceAbsOverride bypasses this entirely. This replaced an earlier percent-of-mean/percent-of-stddev heuristic that was not scale-stable in series length -- see TrendToleranceBasis doc comment for what broke and why.';
const DEFAULT_TREND_SE_MULTIPLIER = 2;

/**
 * Computes trend via a rolling comparison across the full supplied series
 * (ordered chronologically, oldest first) rather than an endpoint-only
 * comparison — the same "don't hide a mid-period swing" discipline Module
 * 06's price-trajectory check already applies (maxIntraPeriodSwingPct).
 *
 * NOTE on exactly 2 points: two points always fit a line with zero
 * residual, so there is no way to estimate a noise level from the data
 * itself. The tolerance is therefore 0 at n=2, meaning ANY nonzero
 * difference between the two values reads as 'improving' or 'declining' —
 * never 'stable'. This is deliberate (confirmed during independent review,
 * 10 Sep 2026), not an oversight: a 2-point series carries no information
 * to distinguish signal from noise, so calling it "stable" would itself be
 * a guess. Treat a 2-point trend read from this function as low-confidence
 * and prefer at least 3 points where the data allows it.
 *
 * IMPORTANT, disclosed per Rule 2 (Sourced Methodology Only): this function
 * evaluates the WHOLE supplied series for a net trend. It does not, on its
 * own, flag a single catastrophic period embedded in an otherwise-stable
 * series — a one-period shock can sit inside a "stable" read here until
 * enough subsequent periods accumulate to move the OLS slope. That is a
 * real, known gap (surfaced during the 10-11 Sep 2026 adversarial review),
 * not an oversight left undisclosed. See `checkLatestPeriodShock` below for
 * the companion, disclosed single-period check that closes it — sourced to
 * Module 06's own `maxIntraPeriodSwingPct` convention.
 */
export function computeTrend(
  orderedValues: number[],
  opts?: { toleranceAbsOverride?: number; seMultiplierOverride?: number }
): TrendAssessment {
  if (orderedValues.length < 2) {
    return { trend: 'INSUFFICIENT_DATA', slope: null, toleranceSource: TREND_TOLERANCE_SOURCE_EN, toleranceBasis: 'n/a' };
  }

  const n = orderedValues.length;
  // Index positions are 0..n-1, an arithmetic sequence, so their mean is
  // (n-1)/2 in closed form — computed directly rather than via an
  // intermediate indices array, which also avoids an indexed array access
  // that a stricter tsconfig (noUncheckedIndexedAccess) flags as possibly
  // undefined even though it never is here.
  const xMean = (n - 1) / 2;
  const yMean = orderedValues.reduce((a, b) => a + b, 0) / n;
  const sXY = orderedValues.reduce((sum, y, i) => sum + (i - xMean) * (y - yMean), 0);
  const sXX = orderedValues.reduce((sum, _y, i) => sum + (i - xMean) ** 2, 0);
  const slope = sXX === 0 ? 0 : sXY / sXX;
  const intercept = yMean - slope * xMean;

  // Residual sum of squares around the fitted line — this is the piece that
  // makes the tolerance scale-stable: a clean linear series (any n) has
  // residuals near zero regardless of length, so any real slope survives;
  // pure noise has residuals large relative to its (near-zero) slope, so it
  // gets filtered. With only 2 points a line fits exactly (SSE is always 0,
  // and n-2 degrees of freedom is 0), so there is no way to estimate noise
  // from the data itself — residualStdError is left at 0 in that case,
  // which means any nonzero slope is treated as a real trend rather than
  // silently guessing a noise level from 2 points.
  const sse = orderedValues.reduce((sum, y, i) => sum + (y - (intercept + slope * i)) ** 2, 0);
  const degreesOfFreedom = n - 2;
  const residualVariance = degreesOfFreedom > 0 ? sse / degreesOfFreedom : 0;
  const residualStdError = Math.sqrt(residualVariance);
  const slopeStdError = sXX === 0 ? 0 : residualStdError / Math.sqrt(sXX);

  let toleranceAbs: number;
  let toleranceBasis: TrendToleranceBasis;
  if (opts?.toleranceAbsOverride !== undefined) {
    toleranceAbs = opts.toleranceAbsOverride;
    toleranceBasis = 'caller-override';
  } else {
    const seMultiplier = opts?.seMultiplierOverride ?? DEFAULT_TREND_SE_MULTIPLIER;
    toleranceAbs = seMultiplier * slopeStdError;
    toleranceBasis = 'ols-slope-se';
  }

  let trend: PerformanceTrend;
  if (Math.abs(slope) <= toleranceAbs) trend = 'stable';
  else trend = slope > 0 ? 'improving' : 'declining';

  return { trend, slope, toleranceSource: TREND_TOLERANCE_SOURCE_EN, toleranceBasis };
}

// ---------------------------------------------------------------------------
// Section 2b — single-period shock (sourced: Module 06's maxIntraPeriodSwingPct)
// ---------------------------------------------------------------------------

export interface ShockCheckResult {
  isShock: boolean;
  periodOverPeriodChangePct: number | null;
  thresholdPct: number;
  ruleSource: string;
  ruleSourceAr: string;
}

const SHOCK_RULE_SOURCE_EN =
  "Single-period percentage swing check, sourced from this platform's own Module 06 " +
  '(commercial/negotiation intelligence) maxIntraPeriodSwingPct convention, applied here ' +
  'to performance metrics rather than price. Deliberately independent of computeTrend\'s ' +
  "whole-series OLS read -- catches a one-period shock computeTrend alone would not flag " +
  'until it accumulates into a net-slope change.';
const SHOCK_RULE_SOURCE_AR =
  'فحص التغيّر النسبي بين فترة واحدة والتي تليها مباشرة، مصدره اتفاقية maxIntraPeriodSwingPct ' +
  'المستخدمة في الوحدة 06 من هذه المنصة (الذكاء التجاري/التفاوضي)، مطبّق هنا على مؤشرات ' +
  'الأداء بدلاً من السعر. مستقل عمداً عن قراءة computeTrend الإجمالية عبر الانحدار الخطي.';
const DEFAULT_SHOCK_THRESHOLD_PCT = 15;

/**
 * Flags a single-period shock: the latest value's percentage change from the
 * immediately prior period, independent of any multi-period trend read.
 * Caller-overridable threshold, exactly like every other tolerance in this
 * file. Returns isShock=false (not INSUFFICIENT_DATA) with a null pct when
 * fewer than 2 points are supplied -- a shock is inherently a 2-point
 * comparison, not a sample-size question the way trend/variability are.
 */
export function checkLatestPeriodShock(
  orderedValues: number[],
  opts?: { thresholdPctOverride?: number }
): ShockCheckResult {
  const thresholdPct = opts?.thresholdPctOverride ?? DEFAULT_SHOCK_THRESHOLD_PCT;
  if (orderedValues.length < 2) {
    return {
      isShock: false,
      periodOverPeriodChangePct: null,
      thresholdPct,
      ruleSource: SHOCK_RULE_SOURCE_EN,
      ruleSourceAr: SHOCK_RULE_SOURCE_AR,
    };
  }
  const prior = orderedValues[orderedValues.length - 2]!;
  const latest = orderedValues[orderedValues.length - 1]!;
  const changePct = prior === 0 ? (latest === 0 ? 0 : Infinity) : (100 * Math.abs(latest - prior)) / Math.abs(prior);
  return {
    isShock: changePct > thresholdPct,
    periodOverPeriodChangePct: changePct,
    thresholdPct,
    ruleSource: SHOCK_RULE_SOURCE_EN,
    ruleSourceAr: SHOCK_RULE_SOURCE_AR,
  };
}

/**
 * NOTE for the caller: whether a positive slope means "improving" depends on
 * the metric's own polarity (higher OTIF % is good; higher defect rate is
 * bad). This function assumes higher-is-better. For a lower-is-better
 * metric, pass `orderedValues.map(v => -v)` and read the result as-is, or
 * invert the returned `trend` before display. Documented here rather than
 * guessed silently inside the function, since guessing polarity from the
 * metric name would be exactly the kind of fabricated inference Decision
 * Record 8.7 exists to prevent.
 */

// ---------------------------------------------------------------------------
// Section 3 — recurrence (checked against the supplier's own CAR history)
// ---------------------------------------------------------------------------

export interface RecurrenceAssessment {
  /** Number of PRIOR occurrences of the same root cause, not counting the
   * current/latest one. 0 = first occurrence. */
  recurrenceCount: number;
  sameRootCause: boolean;
  priorCarIds: string[];
}

/**
 * Recurrence is deliberately checked against the supplier's real CAR
 * history (caller-supplied CAR ids for the same root cause) rather than a
 * fresh count local to this module — per SI-00 Charter core instruction and
 * this module's own "Existing ISC infrastructure this reuses" section.
 */
export function assessRecurrence(priorCarIdsForSameRootCause: string[]): RecurrenceAssessment {
  return {
    recurrenceCount: priorCarIdsForSameRootCause.length,
    sameRootCause: priorCarIdsForSameRootCause.length > 0,
    priorCarIds: [...priorCarIdsForSameRootCause],
  };
}

// ---------------------------------------------------------------------------
// Section 4 — escalation (sourced: 8D / SCAR convention)
// ---------------------------------------------------------------------------

export interface EscalationRecommendation {
  recommendedIntervention: InterventionType;
  /** True only when this recommendation moved up the ladder from the
   * caller-supplied base recommendation because of recurrence. */
  escalated: boolean;
  /** True when a `high` variability classification co-occurs with any
   * recurrence >= 1 — a named, disclosed "worth a question" combined
   * signal toward REPLACE/EXIT. Never an automatic verdict. */
  combinedSignalFlag: boolean;
  /** Bilingual explanation of the combined-signal flag, following the same
   * disclosure convention as every other named flag in this engine (e.g.
   * Module 06's quadrantConsistencyNote). Empty string when the flag is
   * false — never omitted, so the shape is stable for callers either way. */
  combinedSignalNoteEn: string;
  combinedSignalNoteAr: string;
  escalationReasonEn: string;
  escalationReasonAr: string;
  escalationRuleSource: string;
  escalationRuleSourceAr: string;
}

const ESCALATION_RULE_SOURCE_EN =
  '8D / Supplier Corrective Action Request (SCAR) convention, as documented in publicly-published automotive/industrial supplier-quality guidelines (e.g. Vestas, Oshkosh, MAHLE supplier-quality manuals) — a corrective action that does not hold against the same root cause is treated as a signal about the supplier\'s underlying capability, not a second isolated incident.';
const ESCALATION_RULE_SOURCE_AR =
  'اتفاقية 8D / طلب الإجراء التصحيحي للمورد (SCAR)، كما هي موثقة في أدلة جودة الموردين المنشورة علنًا في قطاعي السيارات والصناعة (مثل أدلة Vestas وOshkosh وMAHLE) — يُنظر إلى الإجراء التصحيحي الذي لا يصمد أمام تكرار السبب الجذري نفسه على أنه إشارة إلى قدرة المورد الأساسية، لا كحادثة معزولة ثانية.';

/**
 * Applies the 8D/SCAR escalation ladder on top of a caller-supplied base
 * recommendation (produced by the caller's own reasoning-chain step 4 —
 * performance + cause + Module 05 dependency posture — which this module
 * does not re-derive).
 *
 * Ladder rule (disclosed default, caller-overridable via
 * `escalationThresholdOverride`):
 *  - recurrenceCount 0 (1st occurrence): no forced escalation.
 *  - recurrenceCount 1 (2nd occurrence): escalate one ladder position.
 *  - recurrenceCount >= 2 (3rd+ occurrence): force at least DUAL_SOURCE,
 *    regardless of dependency posture.
 */
export function recommendEscalation(input: {
  baseIntervention: InterventionType;
  recurrenceCount: number;
  variability: PerformanceVariability;
  escalationThresholdOverride?: { escalateAtRecurrence: number; forceDualSourceAtRecurrence: number };
}): EscalationRecommendation {
  const thresholds = input.escalationThresholdOverride ?? {
    escalateAtRecurrence: 1,
    forceDualSourceAtRecurrence: 2,
  };

  const baseIndex = INTERVENTION_LADDER.indexOf(input.baseIntervention);
  let finalIndex = baseIndex;
  let escalated = false;
  let escalationReasonEn = 'First occurrence of this root cause — no forced escalation; intervention chosen per the existing reasoning chain.';
  let escalationReasonAr = 'أول حالة لهذا السبب الجذري — لا يوجد تصعيد إلزامي؛ يُختار الإجراء وفق سلسلة الاستدلال الحالية.';

  if (input.recurrenceCount >= thresholds.forceDualSourceAtRecurrence) {
    const dualSourceIndex = INTERVENTION_LADDER.indexOf('DUAL_SOURCE');
    finalIndex = Math.max(baseIndex, dualSourceIndex);
    escalated = finalIndex !== baseIndex;
    if (escalated) {
      escalationReasonEn = `Root cause has recurred ${input.recurrenceCount} times (3rd+ occurrence) — per 8D/SCAR doctrine, a twice-failed correction is treated as a systemic capability signal, not a run of bad luck; escalated to at least DUAL_SOURCE consideration regardless of dependency tier.`;
      escalationReasonAr = `تكرر السبب الجذري ${input.recurrenceCount} مرات (الحالة الثالثة أو أكثر) — وفق مبدأ 8D/SCAR، يُعامل الإصلاح الذي يفشل مرتين كإشارة إلى قدرة منهجية، لا كسوء حظ عابر؛ تم التصعيد إلى اعتبار مصدر مزدوج على الأقل بغض النظر عن مستوى الاعتماد.`;
    } else {
      escalationReasonEn = `Root cause has recurred ${input.recurrenceCount} times (3rd+ occurrence), but the intervention is already at or beyond DUAL_SOURCE (${input.baseIntervention}) — no further forced move; the recurrence itself remains a real, disclosed signal worth surfacing.`;
      escalationReasonAr = `تكرر السبب الجذري ${input.recurrenceCount} مرات (الحالة الثالثة أو أكثر)، لكن الإجراء الحالي (${input.baseIntervention}) هو أصلاً عند مستوى مصدر مزدوج أو أبعد منه — لا داعي لتصعيد إضافي إلزامي؛ يبقى التكرار نفسه إشارة حقيقية يجب الإفصاح عنها.`;
    }
  } else if (input.recurrenceCount >= thresholds.escalateAtRecurrence) {
    finalIndex = Math.min(baseIndex + 1, INTERVENTION_LADDER.length - 1);
    escalated = finalIndex !== baseIndex;
    if (escalated) {
      escalationReasonEn = `Root cause has recurred (2nd occurrence) — the prior corrective action is judged not to have held; escalated one tier per 8D/SCAR doctrine ("repeated SCARs pointing to the same process weakness should escalate, not be treated as isolated issues").`;
      escalationReasonAr = `تكرر السبب الجذري (الحالة الثانية) — يُعتبر الإجراء التصحيحي السابق غير فعّال؛ تم التصعيد درجة واحدة وفق مبدأ 8D/SCAR ("طلبات الإجراء التصحيحي المتكررة التي تشير إلى ضعف العملية نفسه يجب أن تُصعَّد، لا أن تُعامل كحالات معزولة").`;
    } else {
      escalationReasonEn = `Root cause has recurred (2nd occurrence), but the intervention is already at the top of the ladder (${input.baseIntervention}) — no further tier to escalate to; the recurrence remains a real, disclosed signal.`;
      escalationReasonAr = `تكرر السبب الجذري (الحالة الثانية)، لكن الإجراء الحالي (${input.baseIntervention}) هو أصلاً في أعلى السلّم — لا توجد درجة أعلى للتصعيد إليها؛ يبقى التكرار إشارة حقيقية يجب الإفصاح عنها.`;
    }
  }

  const combinedSignalFlag = input.variability === 'high' && input.recurrenceCount >= 1;
  const combinedSignalNoteEn = combinedSignalFlag
    ? 'Worth a question, not a verdict: this metric is both highly variable (SPC-flagged) and has recurred at least once for the same root cause. Together these point toward REPLACE/EXIT as a topic worth raising — the combination, not either signal alone, is what makes it noteworthy.'
    : '';
  const combinedSignalNoteAr = combinedSignalFlag
    ? 'يستحق طرح سؤال، لا إصدار حكم: هذا المؤشر شديد التذبذب (وفق ضبط الجودة الإحصائي) وقد تكرر مرة واحدة على الأقل لنفس السبب الجذري. مجتمعين، يشيران إلى أن الاستبدال/الخروج موضوع يستحق الطرح — الجمع بين الإشارتين، لا كل واحدة بمفردها، هو ما يجعل الأمر لافتًا.'
    : '';

  return {
    recommendedIntervention: ladderAt(finalIndex),
    escalated,
    combinedSignalFlag,
    combinedSignalNoteEn,
    combinedSignalNoteAr,
    escalationReasonEn,
    escalationReasonAr,
    escalationRuleSource: ESCALATION_RULE_SOURCE_EN,
    escalationRuleSourceAr: ESCALATION_RULE_SOURCE_AR,
  };
}

// ---------------------------------------------------------------------------
// Section 5 — output schema assembly (per SI-07 doc's "Output schema (draft)")
// ---------------------------------------------------------------------------

export interface PerformanceRecordEntry {
  metric: string;
  scorecardDimension: ScorecardDimension;
  level: number;
  trend: PerformanceTrend;
  variability: PerformanceVariability;
  date: string;
  cause: PerformanceCause;
  linkedCarId: string | null;
  /** SI-00 Charter, "Standalone-first" — every fact carries this tag.
   * Actually wired onto the record here, not just declared as an unused
   * type (a real gap in the first pass of this file, closed on review). */
  dataSource: SIDataSource;
}

export interface BusinessImpact {
  description: string;
  estimatedCostUSD: number | null;
  basis: BusinessImpactBasis;
}

export interface InterventionPlan {
  objective: string;
  milestones: string[];
  kpi: string;
  verificationDate: string | null;
  linkedCarId: string | null;
}

export interface SupplierPerformanceRecord {
  supplierId: string;
  performanceRecord: PerformanceRecordEntry[];
  recurrence: RecurrenceAssessment;
  businessImpact: BusinessImpact;
  recommendedIntervention: InterventionType;
  interventionPlan: InterventionPlan | null;
  /** Bilingual disclosure of dimensions this record does not score.
   * Sustainability/ESG is always present here until a real supplier-level
   * methodology is sourced (see SI-07 doc; Problem Map's own "Sustainability"
   * focusArea category is the correct cross-reference point, corrected
   * 10 Sep 2026 — NOT a Maturity-segment reference). */
  unscoredDimensions: string[];
  unscoredDimensionsAr: string[];
}

const DEFAULT_UNSCORED_DIMENSIONS_EN = [
  'ESG/sustainability — no sourced supplier-level methodology yet (see Problem Map focusArea "Sustainability" for the client-side cross-reference point).',
];
const DEFAULT_UNSCORED_DIMENSIONS_AR = [
  'الاستدامة/البيئة والمجتمع والحوكمة (ESG) — لا توجد منهجية موثوقة على مستوى المورد بعد (راجع فئة "الاستدامة" في خريطة المشكلات كنقطة إحالة على جانب العميل).',
];

/**
 * Assembles the full per-supplier performance record. Does not itself
 * compute level/trend/variability/recurrence — those are produced by the
 * functions above (or supplied directly by the caller from real scorecard
 * data) and passed in already-resolved, per this module's own reasoning
 * chain (ingest -> compute -> classify cause -> recommend -> track).
 */
export function buildSupplierPerformanceRecord(input: {
  supplierId: string;
  performanceRecord: PerformanceRecordEntry[];
  recurrence: RecurrenceAssessment;
  businessImpact: BusinessImpact;
  recommendedIntervention: InterventionType;
  interventionPlan?: InterventionPlan | null;
}): SupplierPerformanceRecord {
  return {
    supplierId: input.supplierId,
    performanceRecord: input.performanceRecord,
    recurrence: input.recurrence,
    businessImpact: input.businessImpact,
    recommendedIntervention: input.recommendedIntervention,
    interventionPlan: input.interventionPlan ?? null,
    unscoredDimensions: [...DEFAULT_UNSCORED_DIMENSIONS_EN],
    unscoredDimensionsAr: [...DEFAULT_UNSCORED_DIMENSIONS_AR],
  };
}
