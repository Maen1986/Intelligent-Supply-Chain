/**
 * SI Module 06 -- Commercial & Negotiation Intelligence (9 Sep 2026).
 *
 * BUILT as a pure, tested library -- no UI this cycle, same standalone-first
 * pattern as Modules 02-05: soft-dependency on sibling modules' *types*
 * only (KraljicQuadrant), never a hard import of a full upstream object, so
 * this module works even if Modules 02/03/05 haven't been run for a given
 * supplier yet (SI-06-Commercial-Negotiation-Intelligence.md).
 *
 * =====================================================================
 * REUSE, NOT REBUILD (SI-06 body, "Existing ISC infrastructure to reuse")
 * =====================================================================
 * This module does NOT compute total cost of ownership -- that stays in
 * the existing TCO Engine (#168 and its extensions). It does not compute
 * concentration/lock-in math either -- that stays in Module 05
 * (supplierConcentration.ts). Callers pass those systems' own already
 * -computed, disclosed outputs (a TCO analysis ID, a lockInIndex number,
 * an isSurvivable boolean) into this module's functions; nothing here
 * re-derives them. The only new math in this file is price-trajectory
 * classification, cost-driver justification-gap checking, negotiation-
 * leverage framing, and negotiation-round-history tit-for-tat logic --
 * genuinely new capability, not a second copy of an existing one.
 *
 * =====================================================================
 * FRAMEWORK 1: BATNA -- Best Alternative to a Negotiated Agreement
 * =====================================================================
 * Source: Roger Fisher, William Ury & Bruce Patton, "Getting to Yes:
 * Negotiating Agreement Without Giving In" (Houghton Mifflin, 1981),
 * Harvard Program on Negotiation. BATNA is the standard, sourced concept
 * for what actually gives a party leverage in a negotiation: not
 * aggression, but a credible, executable alternative to the deal on the
 * table. This module operationalizes BATNA strength from two already
 * -computed Module 05 metrics rather than inventing a new "leverage
 * score": (a) `lockInIndex` (0-5, higher = more locked in = fewer real
 * alternatives = weaker BATNA) and (b) `isSurvivable` (from Module 05's
 * Sheffi Time-to-Recover/Time-to-Survive shortfall test -- whether the
 * client can actually operate through a transition without this
 * supplier, i.e. whether the alternative is executable, not just
 * theoretical). A strong BATNA requires BOTH low lock-in AND survivable
 * continuity; a technically-low-lock-in supplier the client cannot
 * actually survive without switching from is not real leverage, and
 * this module's banding reflects that conjunction explicitly rather than
 * averaging the two inputs into a single number that would hide it.
 *
 * =====================================================================
 * FRAMEWORK 2: Axelrod/Rapoport Tit-for-Tat, made operational
 * =====================================================================
 * Source: Robert Axelrod's iterated Prisoner's Dilemma tournaments and
 * Anatol Rapoport's tit-for-tat strategy (already cited in Module 02's
 * `negotiationTactics.ts`, tactic id `prisoners-dilemma-tit-for-tat`).
 * Module 02 could explain this tactic but had no field recording what a
 * counterpart actually did last round, so the tactic was documentation
 * only, not a live recommendation -- flagged 8 Sep 2026 during a direct
 * review of Module 02's shipped code (SI-06 doc, "Known gap carried from
 * Module 02"). `recommendNextMove()` below is the fix: it reads
 * `negotiationRoundHistory` and applies the exact rule already published
 * in Module 02's own tactic description, word for word --
 * "cooperate first, then mirror the counterpart's last move... never
 * punish more harshly than the original defection, and never hold a
 * grudge past one retaliatory round ('generous' tit-for-tat)". Concretely:
 *   1. No history yet -> cooperate (the documented opening move).
 *   2. We already retaliated last round (our last move was 'defected') ->
 *      cooperate this round regardless of what happens next -- this is
 *      literally "never hold a grudge past one retaliatory round."
 *   3. Counterpart's last move was 'defected' (and we have not just
 *      retaliated) -> match-defection once.
 *   4. Otherwise (counterpart cooperated, or the signal was 'unclear') ->
 *      cooperate. An ambiguous signal is deliberately NOT treated as a
 *      defection trigger -- generous tit-for-tat variants (Nowak &
 *      Sigmund) exist precisely because retaliating on noisy/ambiguous
 *      signals causes needless escalation spirals; this module resolves
 *      genuine ambiguity toward cooperation rather than inventing
 *      certainty Decision Record 8.7 would forbid.
 *
 * =====================================================================
 * NEVER-FABRICATE DISCIPLINE (Decision Record 8.7), applied twice here
 * =====================================================================
 * DECISION A -- price trajectory needs 3+ chronologically-ordered price
 * points before a direction is claimed. A "trend" computed from two data
 * points is indistinguishable from noise and the SI-06 doc explicitly
 * calls this out ("otherwise mark trajectory INSUFFICIENT_DATA rather
 * than inferring a trend from two data points"). With fewer than 3
 * points, `computePriceTrajectory()` returns INSUFFICIENT_DATA, never a
 * guessed direction.
 * DECISION B -- the up/down/flat banding threshold (+/-3% total change)
 * is a generic, disclosed structural default, NOT a sourced industry
 * benchmark -- same non-fabrication pattern as Module 04's
 * DEFAULT_GATE_THRESHOLDS. Overridable via the `flatBandPct` parameter
 * once real, sourced category thresholds exist (SI-06 OWNER INPUT
 * NEEDED #1).
 *
 * Design precedent followed (same as kraljicScoring.ts /
 * supplierObjectModel.ts / supplierQualificationGates.ts /
 * supplierConcentration.ts): pure functions, no side effects, no network
 * calls, no fabricated data.
 */

import type { KraljicQuadrant } from './kraljicScoring';
import { recommendClientTactics, recommendWatchForTactics, type NamedNegotiationTactic } from './negotiationTactics';

// ---------------------------------------------------------------------------
// 1. Evidence-basis tiering (SI-06 body, "The labeling discipline")
// ---------------------------------------------------------------------------

export type EvidenceBasis = 'observed' | 'calculated' | 'estimated';

export interface CommercialFigure<T = number> {
  value: T;
  basis: EvidenceBasis;
  /** Required when basis is 'estimated' -- what assumption filled the gap, stated next to the figure, not in a footnote. */
  note?: string;
}

// ---------------------------------------------------------------------------
// 2. Price trajectory (DECISION A/B above)
// ---------------------------------------------------------------------------

export interface PricePoint {
  periodLabel: string;
  price: number;
  /** ISO date or period-ordering key; points are sorted by this before trend classification. */
  sortKey: string;
}

export type PriceTrajectoryDirection = 'up' | 'down' | 'flat' | 'INSUFFICIENT_DATA';

export interface PriceTrajectory {
  direction: PriceTrajectoryDirection;
  periodMonths: number | null;
  percentChange: number | null;
  basis: EvidenceBasis | null;
  /**
   * Largest absolute percent move from the first point to ANY intermediate
   * point, not just to the last one. Null when INSUFFICIENT_DATA.
   * See `hasIntermediateVolatility` -- an endpoint-only comparison can
   * silently erase a real mid-period spike or dip (pressure-test-found
   * gap, fixed 9 Sep 2026; see Module 06 doc).
   */
  maxIntraPeriodSwingPct: number | null;
  /**
   * True when the largest intermediate swing exceeds the headline
   * percentChange by more than the flat band -- i.e. `direction` alone
   * (especially "flat") would understate real volatility a reader should
   * know about. Null when INSUFFICIENT_DATA.
   */
  hasIntermediateVolatility: boolean | null;
}

const DEFAULT_FLAT_BAND_PCT = 3;

/**
 * DECISION A/B: needs 3+ points to claim a direction; +/-flatBandPct% is a
 * disclosed default band, not a sourced benchmark.
 *
 * PRESSURE-TEST-FOUND GAP, FIXED (9 Sep 2026): an adversarial scenario --
 * price 100 -> 130 -> 128 -> 101 -- classified as "flat" under a pure
 * first-vs-last comparison (net change ~1%), silently erasing a real 30%
 * mid-period spike a procurement lead would need to know about (a spot
 * -market event, a temporary surcharge, or a data anomaly). Fixed by also
 * computing `maxIntraPeriodSwingPct` (largest swing from the first point to
 * ANY point, not just the last) and flagging `hasIntermediateVolatility`
 * whenever that swing materially exceeds the headline percentChange --
 * disclosed on the schema and surfaced in the narrative, never hidden
 * behind a single trend label (Decision Record 8.7).
 */
export function computePriceTrajectory(
  points: PricePoint[],
  opts: { periodMonths?: number; basis?: EvidenceBasis; flatBandPct?: number } = {},
): PriceTrajectory {
  if (points.length < 3) {
    return {
      direction: 'INSUFFICIENT_DATA',
      periodMonths: null,
      percentChange: null,
      basis: null,
      maxIntraPeriodSwingPct: null,
      hasIntermediateVolatility: null,
    };
  }
  const sorted = [...points].sort((a, b) => (a.sortKey < b.sortKey ? -1 : a.sortKey > b.sortKey ? 1 : 0));
  const first = sorted[0].price;
  const last = sorted[sorted.length - 1].price;
  const percentChange = first === 0 ? null : ((last - first) / first) * 100;
  const flatBand = opts.flatBandPct ?? DEFAULT_FLAT_BAND_PCT;

  let direction: PriceTrajectoryDirection;
  if (percentChange === null) {
    direction = 'INSUFFICIENT_DATA';
  } else if (percentChange > flatBand) {
    direction = 'up';
  } else if (percentChange < -flatBand) {
    direction = 'down';
  } else {
    direction = 'flat';
  }

  let maxIntraPeriodSwingPct: number | null = null;
  let hasIntermediateVolatility: boolean | null = null;
  if (first !== 0) {
    const swings = sorted.map((p) => Math.abs(((p.price - first) / first) * 100));
    const maxSwing = Math.max(...swings);
    maxIntraPeriodSwingPct = Math.round(maxSwing * 100) / 100;
    const headlineAbs = percentChange === null ? 0 : Math.abs(percentChange);
    hasIntermediateVolatility = maxSwing - headlineAbs > flatBand;
  }

  return {
    direction,
    periodMonths: opts.periodMonths ?? null,
    percentChange: percentChange === null ? null : Math.round(percentChange * 100) / 100,
    basis: opts.basis ?? 'observed',
    maxIntraPeriodSwingPct,
    hasIntermediateVolatility,
  };
}

// ---------------------------------------------------------------------------
// 3. Cost drivers + justification-gap check (Rawabi illustrative example, operationalized)
// ---------------------------------------------------------------------------

export interface CostDriverInput {
  driver: string;
  /** Percent impact the supplier/client attributes to this driver, if stated. */
  claimedImpactPct: number | null;
  basis: EvidenceBasis;
  note?: string;
}

export interface CostDriverJustification {
  driver: string;
  claimedImpactPct: number | null;
  /** A real, client- or owner-supplied reference figure for the same driver over the same period (e.g. an actual market index move). Never fabricated -- null when no reference exists. */
  referenceImpactPct: number | null;
  /** null when no reference figure exists to check against -- never assumed unsupported. */
  supported: boolean | null;
  gapPct: number | null;
  note: string;
}

const JUSTIFICATION_GAP_TOLERANCE_PCT = 2;

/** Operationalizes the SI-06 illustrative example: a supplier's claimed 12% driven-by-aluminum-pricing justification checked against real 4% aluminum market movement is NOT supported -- an 8-point gap the client should open the negotiation with, not accept on faith. */
export function assessCostDriverJustification(
  input: CostDriverInput,
  referenceImpactPct: number | null,
): CostDriverJustification {
  if (input.claimedImpactPct === null || referenceImpactPct === null) {
    return {
      driver: input.driver,
      claimedImpactPct: input.claimedImpactPct,
      referenceImpactPct,
      supported: null,
      gapPct: null,
      note: 'No reference market figure available to check this claim against -- neither supported nor unsupported, INSUFFICIENT_DATA.',
    };
  }
  const gapPct = Math.round((input.claimedImpactPct - referenceImpactPct) * 100) / 100;
  const supported = Math.abs(gapPct) <= JUSTIFICATION_GAP_TOLERANCE_PCT;
  return {
    driver: input.driver,
    claimedImpactPct: input.claimedImpactPct,
    referenceImpactPct,
    supported,
    gapPct,
    note: supported
      ? `Claimed ${input.claimedImpactPct}% impact is consistent with the ${referenceImpactPct}% reference figure (within ${JUSTIFICATION_GAP_TOLERANCE_PCT} points).`
      : `Claimed ${input.claimedImpactPct}% impact vs. a ${referenceImpactPct}% reference figure -- a ${Math.abs(gapPct)}-point gap, stated plainly as an opening negotiation fact rather than accepted.`,
  };
}

// ---------------------------------------------------------------------------
// 4. Negotiation leverage (FRAMEWORK 1: BATNA)
// ---------------------------------------------------------------------------

export type LeverageLevel = 'STRONG' | 'MODERATE' | 'WEAK' | 'INSUFFICIENT_DATA';

export interface NegotiationLeverageInputs {
  /** Module 05's computeLockInIndex() output, 0-5, higher = more locked in. Null if Module 05 hasn't been run for this supplier. */
  lockInIndex: number | null;
  /** Module 05's computeShortfall().isSurvivable. Null if TTR/TTS data doesn't exist yet. */
  isSurvivable: boolean | null;
}

export interface NegotiationLeverage {
  level: LeverageLevel;
  lockInIndex: number | null;
  isSurvivable: boolean | null;
  framingEn: string;
  framingAr: string;
}

const LOW_LOCK_IN_THRESHOLD = 2;
const HIGH_LOCK_IN_THRESHOLD = 4;

/** BATNA strength requires BOTH low lock-in AND survivable continuity -- a conjunction, not an average, so one weak input can't be masked by the other. */
export function assessNegotiationLeverage(inputs: NegotiationLeverageInputs): NegotiationLeverage {
  const { lockInIndex, isSurvivable } = inputs;

  if (lockInIndex === null || isSurvivable === null) {
    return {
      level: 'INSUFFICIENT_DATA',
      lockInIndex,
      isSurvivable,
      framingEn: 'Negotiation leverage cannot be assessed yet -- Module 05 has not produced a Lock-In Index and/or survivability result for this supplier.',
      framingAr: 'لا يمكن تقييم قوة التفاوض بعد -- لم تُصدر الوحدة 05 بعد مؤشر التقييد أو نتيجة القدرة على الاستمرار (أو كليهما) لهذا المورّد.',
    };
  }

  let level: LeverageLevel;
  if (lockInIndex <= LOW_LOCK_IN_THRESHOLD && isSurvivable) {
    level = 'STRONG';
  } else if (lockInIndex >= HIGH_LOCK_IN_THRESHOLD || !isSurvivable) {
    level = 'WEAK';
  } else {
    level = 'MODERATE';
  }

  const en =
    level === 'STRONG'
      ? `Strong BATNA: Lock-In Index ${lockInIndex.toFixed(1)}/5 (low) and the client is survivable through a transition -- a credible, executable alternative to this deal exists and can be stated plainly at the table.`
      : level === 'WEAK'
        ? `Weak BATNA: ${lockInIndex >= HIGH_LOCK_IN_THRESHOLD ? `Lock-In Index ${lockInIndex.toFixed(1)}/5 (high)` : 'not survivable through a transition'} -- walking away is not a credible threat today; negotiate accordingly and prioritize reducing lock-in before the next cycle.`
        : `Moderate BATNA: Lock-In Index ${lockInIndex.toFixed(1)}/5, ${isSurvivable ? 'survivable' : 'not survivable'} through a transition -- some leverage exists but is not unconditional.`;
  const ar =
    level === 'STRONG'
      ? `قوة تفاوضية عالية: مؤشر التقييد ${lockInIndex.toFixed(1)}/5 (منخفض) والعميل قادر على الاستمرار خلال فترة الانتقال -- يوجد بديل حقيقي وقابل للتنفيذ عن هذه الصفقة ويمكن ذكره صراحةً على طاولة التفاوض.`
      : level === 'WEAK'
        ? `قوة تفاوضية ضعيفة: ${lockInIndex >= HIGH_LOCK_IN_THRESHOLD ? `مؤشر التقييد ${lockInIndex.toFixed(1)}/5 (مرتفع)` : 'عدم القدرة على الاستمرار خلال فترة الانتقال'} -- الانسحاب ليس تهديداً قابلاً للتصديق اليوم؛ يجب التفاوض وفقاً لذلك وإعطاء أولوية لتقليل التقييد قبل الدورة القادمة.`
        : `قوة تفاوضية متوسطة: مؤشر التقييد ${lockInIndex.toFixed(1)}/5، و${isSurvivable ? 'قادر' : 'غير قادر'} على الاستمرار خلال فترة الانتقال -- توجد بعض القوة التفاوضية لكنها غير مطلقة.`;

  return { level, lockInIndex, isSurvivable, framingEn: en, framingAr: ar };
}

// ---------------------------------------------------------------------------
// 5. Negotiation round history + Tit-for-Tat (FRAMEWORK 2)
// ---------------------------------------------------------------------------

export type OurMove = 'cooperated' | 'defected';
export type CounterpartMove = 'cooperated' | 'defected' | 'unclear';

export interface NegotiationRound {
  date: string;
  ourMove: OurMove;
  counterpartMove: CounterpartMove;
  note: string;
}

export type NegotiationRoundHistory = NegotiationRound[];

export type RecommendedMove = 'cooperate' | 'match-defection';

export interface NextMoveRecommendation {
  move: RecommendedMove;
  rationaleEn: string;
  rationaleAr: string;
}

/** Implements Module 02's own published tit-for-tat rule exactly (see FRAMEWORK 2 header note). Rounds are assumed already in chronological order (oldest first); only the most recent 1-2 rounds are examined, per the rule's own "one retaliatory round" scope. */
export function recommendNextMove(history: NegotiationRoundHistory): NextMoveRecommendation {
  if (history.length === 0) {
    return {
      move: 'cooperate',
      rationaleEn: 'No negotiation-round history yet -- tit-for-tat opens every new relationship in good faith (cooperate).',
      rationaleAr: 'لا يوجد سجل جولات تفاوض بعد -- استراتيجية المثل بالمثل تبدأ كل علاقة جديدة بحسن نية (تعاون).',
    };
  }

  const last = history[history.length - 1];

  if (last.ourMove === 'defected') {
    return {
      move: 'cooperate',
      rationaleEn: `We already retaliated in the last round (${last.date}) -- generous tit-for-tat never holds a grudge past one retaliatory round, so this round returns to cooperation regardless of the counterpart's most recent move.`,
      rationaleAr: `قمنا بالرد بالمثل في الجولة الأخيرة (${last.date}) -- استراتيجية "المثل بالمثل السخية" لا تحمل ضغينة بعد جولة انتقام واحدة، لذا تعود هذه الجولة إلى التعاون بغض النظر عن آخر تحرك للطرف الآخر.`,
    };
  }

  if (last.counterpartMove === 'defected') {
    return {
      move: 'match-defection',
      rationaleEn: `Counterpart defected in the last round (${last.date}: "${last.note}") -- tit-for-tat mirrors that on this round, once, then returns to cooperation on the next.`,
      rationaleAr: `خان الطرف الآخر في الجولة الأخيرة (${last.date}: "${last.note}") -- استراتيجية المثل بالمثل تحاكي ذلك في هذه الجولة، مرة واحدة، ثم تعود إلى التعاون في الجولة التالية.`,
    };
  }

  return {
    move: 'cooperate',
    rationaleEn:
      last.counterpartMove === 'unclear'
        ? `Counterpart's last move (${last.date}) was recorded as unclear -- an ambiguous signal is not treated as a defection trigger, to avoid an unnecessary escalation spiral; this round cooperates.`
        : `Counterpart cooperated in the last round (${last.date}) -- tit-for-tat continues cooperating.`,
    rationaleAr:
      last.counterpartMove === 'unclear'
        ? `آخر تحرك للطرف الآخر (${last.date}) سُجِّل كغير واضح -- لا تُعامل الإشارة الغامضة كمحفّز للخيانة تجنباً لدوامة تصعيد غير ضرورية؛ هذه الجولة تتعاون.`
        : `تعاون الطرف الآخر في الجولة الأخيرة (${last.date}) -- تستمر استراتيجية المثل بالمثل في التعاون.`,
  };
}

// ---------------------------------------------------------------------------
// 6. Negotiation Brief orchestration (SI-06 output schema)
// ---------------------------------------------------------------------------

export interface NegotiationBriefInput {
  supplierId: string;
  kraljicQuadrant: KraljicQuadrant | null;
  priceTrajectory: PriceTrajectory;
  costDriverJustifications: CostDriverJustification[];
  /** Reference only -- an ID into the existing TCO Engine, never a recomputed figure. */
  tcoReferenceId: string | null;
  /** Reference only -- an ID into Contract Intelligence's obligation tracking, never recomputed here. */
  contractEntitlementId: string | null;
  negotiationLeverage: NegotiationLeverage;
  negotiationRoundHistory: NegotiationRoundHistory;
}

/**
 * QA-found gap, fixed (9 Sep 2026, "make it great" review): `kraljicQuadrant`
 * was accepted on `NegotiationBriefInput` and never read anywhere in
 * `buildNegotiationBrief()` -- a dead input that silently discarded real
 * Module 02 context instead of using it. Fixed by cross-referencing the
 * quadrant against Module 02's own already-sourced, already-published
 * tactics library (`negotiationTactics.ts`) rather than inventing any new
 * scoring or ranking heuristic: `recommendedTactics.forUs` reuses
 * `recommendClientTactics()` (low-ethical-risk tactics suited to this
 * quadrant) and `.watchFor` reuses `recommendWatchForTactics()` (moderate/
 * high-risk tactics a counterpart might use, each already carrying its own
 * counter-tactic). Null when no quadrant is available yet (Module 02 not
 * run for this supplier) -- never defaulted to a guessed quadrant.
 */
export interface RecommendedTactics {
  quadrant: KraljicQuadrant;
  forUs: NamedNegotiationTactic[];
  watchFor: NamedNegotiationTactic[];
}

export interface NegotiationBrief {
  supplierId: string;
  kraljicQuadrant: KraljicQuadrant | null;
  priceTrajectory: PriceTrajectory;
  costDriverJustifications: CostDriverJustification[];
  tcoReferenceId: string | null;
  contractEntitlementId: string | null;
  negotiationLeverage: NegotiationLeverage;
  recommendedTactics: RecommendedTactics | null;
  nextMove: NextMoveRecommendation;
  unsupportedCostDriverCount: number;
}

export function buildNegotiationBrief(input: NegotiationBriefInput): NegotiationBrief {
  const nextMove = recommendNextMove(input.negotiationRoundHistory);
  const unsupportedCostDriverCount = input.costDriverJustifications.filter((j) => j.supported === false).length;
  const recommendedTactics: RecommendedTactics | null =
    input.kraljicQuadrant === null
      ? null
      : {
          quadrant: input.kraljicQuadrant,
          forUs: recommendClientTactics(input.kraljicQuadrant),
          watchFor: recommendWatchForTactics(input.kraljicQuadrant),
        };

  return {
    supplierId: input.supplierId,
    kraljicQuadrant: input.kraljicQuadrant,
    priceTrajectory: input.priceTrajectory,
    costDriverJustifications: input.costDriverJustifications,
    tcoReferenceId: input.tcoReferenceId,
    contractEntitlementId: input.contractEntitlementId,
    negotiationLeverage: input.negotiationLeverage,
    recommendedTactics,
    nextMove,
    unsupportedCostDriverCount,
  };
}

// ---------------------------------------------------------------------------
// 7. Bilingual narrative (Module 09 consultancy framing)
// ---------------------------------------------------------------------------

/**
 * Arabic labels for the trend-direction and evidence-basis enums.
 *
 * PRESSURE-TEST/QA-FOUND GAP, FIXED (9 Sep 2026): the Arabic narrative
 * originally interpolated the raw English enum values (`direction`,
 * `basis`) directly into Arabic sentences -- e.g. "اتجاه السعر: up (...)" --
 * because only the 'observed' basis case had a translated branch. A native
 * Arabic reader would hit an untranslated English word mid-sentence. Fixed
 * by translating every enum value used in Arabic output, not just one case
 * of one field (isc-qa-customer-simulation bilingual-correctness dimension).
 */
const DIRECTION_LABEL_AR: Record<'up' | 'down' | 'flat', string> = {
  up: 'ارتفاع',
  down: 'انخفاض',
  flat: 'مستقر',
};

const BASIS_LABEL_AR: Record<EvidenceBasis, string> = {
  observed: 'مُلاحَظ',
  calculated: 'مُحتسب',
  estimated: 'مُقدَّر',
};

const QUADRANT_LABEL_AR: Record<KraljicQuadrant, string> = {
  strategic: 'استراتيجي',
  leverage: 'ذو قوة تفاوضية',
  bottleneck: 'عنق زجاجة',
  'non-critical': 'غير حرج',
};

export function buildNegotiationBriefPrompt(brief: NegotiationBrief, isAr: boolean): string {
  const lines: string[] = [];
  lines.push(isAr ? '## موجز التفاوض' : '## Negotiation brief');

  if (brief.priceTrajectory.direction === 'INSUFFICIENT_DATA') {
    lines.push(
      isAr
        ? 'اتجاه السعر: بيانات غير كافية (أقل من 3 نقاط سعرية زمنية) -- لا يُفترض أي اتجاه.'
        : 'Price trajectory: INSUFFICIENT_DATA (fewer than 3 chronological price points) -- no direction assumed.',
    );
  } else {
    const dir = brief.priceTrajectory.direction as 'up' | 'down' | 'flat';
    const basis = brief.priceTrajectory.basis as EvidenceBasis;
    const dirAr = DIRECTION_LABEL_AR[dir];
    const basisAr = BASIS_LABEL_AR[basis];
    lines.push(
      isAr
        ? `اتجاه السعر: ${dirAr} (${brief.priceTrajectory.percentChange}%، ${basisAr}).`
        : `Price trajectory: ${brief.priceTrajectory.direction} (${brief.priceTrajectory.percentChange}%, ${brief.priceTrajectory.basis}).`,
    );
    if (brief.priceTrajectory.hasIntermediateVolatility) {
      lines.push(
        isAr
          ? `تنبيه: تحرك السعر خلال الفترة ${brief.priceTrajectory.maxIntraPeriodSwingPct}% في نقطة ما وسط الفترة -- وهذا أكبر بكثير من صافي التغيّر بين البداية والنهاية، لذا فإن تصنيف "${dirAr}" وحده لا يعكس التقلب الفعلي.`
          : `Caveat: price moved ${brief.priceTrajectory.maxIntraPeriodSwingPct}% at some point mid-period -- materially more than the net start-to-end change, so the "${brief.priceTrajectory.direction}" label alone understates real volatility.`,
      );
    }
  }

  if (brief.unsupportedCostDriverCount > 0) {
    lines.push(
      isAr
        ? `${brief.unsupportedCostDriverCount} من مبررات محرّكات التكلفة غير مدعومة بمرجع حقيقي -- ينبغي فتح التفاوض بهذه الفجوة.`
        : `${brief.unsupportedCostDriverCount} cost-driver justification(s) not supported by a real reference figure -- open the negotiation with this gap.`,
    );
  }

  lines.push(isAr ? brief.negotiationLeverage.framingAr : brief.negotiationLeverage.framingEn);

  if (brief.recommendedTactics) {
    const { forUs, watchFor } = brief.recommendedTactics;
    if (forUs.length > 0) {
      const names = forUs.map((t) => (isAr ? t.name.ar : t.name.en)).join('، ');
      lines.push(
        isAr
          ? `تكتيكات موصى بها (الوحدة 02، ربع ${QUADRANT_LABEL_AR[brief.recommendedTactics.quadrant]}): ${names}.`
          : `Recommended tactics (Module 02, ${brief.recommendedTactics.quadrant} quadrant): ${names}.`,
      );
    }
    if (watchFor.length > 0) {
      const names = watchFor.map((t) => (isAr ? t.name.ar : t.name.en)).join('، ');
      lines.push(
        isAr
          ? `تكتيكات يُحتمل أن يستخدمها الطرف الآخر -- انتبه لها: ${names}.`
          : `Tactics the counterpart may use -- watch for: ${names}.`,
      );
    }
  }

  lines.push(isAr ? brief.nextMove.rationaleAr : brief.nextMove.rationaleEn);

  return lines.join('\n');
}
