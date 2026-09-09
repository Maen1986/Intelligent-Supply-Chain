/**
 * SI Module 06 -- Commercial & Negotiation Intelligence (9 Sep 2026,
 * deep enhancement pass 9 Sep 2026 -- "use Kraljic at as many real levels
 * as legitimately apply", critical-thinking review requested by the owner).
 *
 * BUILT as a pure, tested library -- no UI this cycle, same standalone-first
 * pattern as Modules 02-05: soft-dependency on sibling modules' *types*
 * only, never a hard runtime import of another module's business logic, so
 * this module works even if Modules 02/03/05 haven't been run for a given
 * supplier yet (SI-06-Commercial-Negotiation-Intelligence.md).
 *
 * =====================================================================
 * ARCHITECTURE CORRECTION (9 Sep 2026 deep review)
 * =====================================================================
 * The first "make it great" pass on this module (earlier the same day)
 * hard-imported and CALLED Module 02's `recommendClientTactics()` /
 * `recommendWatchForTactics()` at runtime -- a real, self-inconsistent
 * violation of this file's own stated soft-dependency doctrine (it
 * recomputed a slice of Module 02's own output instead of reusing it by
 * reference), and it duplicated only HALF of what Module 02 already
 * assembles: `buildNegotiationPlan(quadrant)` already returns the
 * negotiation TEAM and LEVEL STRUCTURE alongside both tactic lists, none
 * of which the first pass surfaced. On top of that, its ad-hoc Arabic
 * quadrant labels ('عنق زجاجة' for bottleneck, etc.) did not match the
 * platform's own canonical `QUADRANT_META.labelAr` in kraljicScoring.ts --
 * a real terminology inconsistency. All three are fixed here:
 *   1. Module 06 no longer imports or calls any Module 02 FUNCTION. It
 *      accepts Module 02's already-computed `NegotiationPlanDocument`,
 *      `NegotiationStrategy`, and `RelationshipCompatibility` objects as
 *      plain pass-through input fields (exactly like `tcoReferenceId` /
 *      `contractEntitlementId` are references, never recomputed here),
 *      typed via type-only imports.
 *   2. The full Module 02 output (team, 3-level structure, both tactic
 *      lists, quadrant-level approach/BATNA/ZOPA/MIL guidance, and any
 *      relationship-posture mismatch) is now surfaced in the brief and
 *      narrative -- not just the tactic names.
 *   3. Arabic quadrant labels are reused from `kraljicScoring.ts`'s
 *      canonical `QUADRANT_META`, not re-invented.
 * A related bilingual gap this review found IN MODULE 02 itself --
 * `recommendNegotiationStrategy()`'s narrative guidance fields
 * (approachRationale/batnaGuidance/zopaGuidance/milGuidance/
 * relationshipAdjustment) were English-only -- was fixed directly in
 * `supplierSourcingStrategy.ts` the same day (AR siblings added, with
 * regression tests), since Module 06 now surfaces those fields bilingually
 * and shipping English-only strategic guidance inside an otherwise
 * bilingual Arabic negotiation brief would itself be a new bilingual
 * defect, not a fix.
 *
 * =====================================================================
 * REUSE, NOT REBUILD (SI-06 body, "Existing ISC infrastructure to reuse")
 * =====================================================================
 * This module does NOT compute total cost of ownership -- that stays in
 * the existing TCO Engine (#168 and its extensions). It does not compute
 * concentration/lock-in math either -- that stays in Module 05
 * (supplierConcentration.ts). It does not compute Kraljic quadrant
 * classification, sourcing strategy, relationship-posture compatibility,
 * or the named-tactics library either -- all of that stays in Module 02
 * (kraljicScoring.ts / supplierSourcingStrategy.ts / negotiationTactics.ts).
 * Callers pass those systems' own already-computed, disclosed outputs into
 * this module's functions; nothing here re-derives them. The only new math
 * in this file is price-trajectory classification, cost-driver
 * justification-gap checking, negotiation-leverage framing from Module 05's
 * raw numbers, negotiation-round-history tit-for-tat logic, and (new this
 * pass) two small, honestly-disclosed Kraljic-quadrant-informed heuristics
 * described under KRALJIC USAGE MAP below -- genuinely new capability, not
 * a second copy of an existing one.
 *
 * =====================================================================
 * KRALJIC USAGE MAP (this deep-enhancement pass, all real, all disclosed)
 * =====================================================================
 * Kraljic's quadrant (Kraljic, "Purchasing Must Become Supply Management",
 * Harvard Business Review, 1983) now informs this module at FIVE distinct,
 * non-redundant levels, each sourced or clearly disclosed as a heuristic:
 *   1. Tactics-for-us / tactics-to-watch-for -- pass-through of Module 02's
 *      `NegotiationPlanDocument` (unchanged capability, corrected reuse).
 *   2. Negotiation team size and level structure (1-round vs 3-level,
 *      2-role vs 6-role) -- pass-through of the same document.
 *   3. Strategic approach (distributive/mixed/integrative), BATNA/ZOPA
 *      guidance, and MIL (Must/Intend/Like) objective starting points --
 *      pass-through of Module 02's `NegotiationStrategy`.
 *   4. Relationship-posture compatibility (is the client's actual
 *      relationship with this supplier appropriate for the quadrant?) --
 *      pass-through of Module 02's `RelationshipCompatibility`.
 *   5. TWO NEW, MODULE-06-OWNED, quadrant-informed heuristics (real math
 *      this module computes, not pass-through):
 *      a. QUADRANT-INFORMED PRICE/JUSTIFICATION SCRUTINY -- Kraljic's own
 *         prescription differs sharply by quadrant: Leverage quadrant
 *         calls for exploiting competitive market power (tight price
 *         scrutiny is textbook-correct there); Bottleneck calls for
 *         securing supply continuity, sometimes at a price premium
 *         (excessive price scrutiny can damage the one relationship
 *         keeping supply flowing -- see Module 02's own
 *         `assessRelationshipCompatibility` Bottleneck+Adversarial
 *         finding); Non-critical calls for minimizing transaction cost
 *         (scrutiny effort should be proportionate to low stakes);
 *         Strategic sits in between. This module operationalizes that
 *         DIRECTION with `QUADRANT_FLAT_BAND_PCT` /
 *         `QUADRANT_JUSTIFICATION_TOLERANCE_PCT` -- the qualitative
 *         direction is Kraljic-sourced, but the SPECIFIC numeric values
 *         are disclosed, overridable heuristic defaults, NOT an external
 *         published benchmark (same non-fabrication pattern as
 *         `DEFAULT_FLAT_BAND_PCT` itself and Module 04's
 *         `DEFAULT_GATE_THRESHOLDS`). Every result discloses exactly
 *         which band/tolerance was applied and why via
 *         `flatBandSource`/`toleranceSource`.
 *      b. LEVERAGE/QUADRANT STRUCTURAL CONSISTENCY CHECK -- a Leverage
 *         quadrant supplier has, BY DEFINITION, many qualified
 *         alternatives (low supply risk); a Bottleneck supplier has few
 *         (high supply risk). If Module 05's real computed BATNA leverage
 *         for a Leverage-quadrant supplier comes back WEAK, or a
 *         Bottleneck-quadrant supplier's leverage comes back STRONG, that
 *         is a structural mismatch worth surfacing -- either the market
 *         has genuinely shifted (a real finding) or the underlying data is
 *         stale (also a real finding) -- never silently accepted, same
 *         "don't let one module's output silently override another's
 *         disclosed logic" discipline already applied across Modules
 *         03/04 this session. Only Leverage and Bottleneck get this check
 *         -- Strategic and Non-critical are impact-axis-dominated
 *         quadrants with no equally strong structural prediction on
 *         leverage level from Kraljic's own model, so inventing a
 *         "consistency rule" for them would not be sourced, and none is
 *         applied (Decision Record 8.7).
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
 * NEVER-FABRICATE DISCIPLINE (Decision Record 8.7), applied throughout
 * =====================================================================
 * DECISION A -- price trajectory needs 3+ chronologically-ordered price
 * points before a direction is claimed. A "trend" computed from two data
 * points is indistinguishable from noise and the SI-06 doc explicitly
 * calls this out ("otherwise mark trajectory INSUFFICIENT_DATA rather
 * than inferring a trend from two data points"). With fewer than 3
 * points, `computePriceTrajectory()` returns INSUFFICIENT_DATA, never a
 * guessed direction.
 * DECISION B -- the up/down/flat banding threshold is a generic, disclosed
 * structural default (or, new this pass, a disclosed quadrant-informed
 * default), NOT a sourced industry benchmark -- same non-fabrication
 * pattern as Module 04's DEFAULT_GATE_THRESHOLDS. Always overridable via
 * an explicit `flatBandPct`, and the exact band + its source are always
 * disclosed on the result.
 *
 * Design precedent followed (same as kraljicScoring.ts /
 * supplierObjectModel.ts / supplierQualificationGates.ts /
 * supplierConcentration.ts / supplierSourcingStrategy.ts): pure functions,
 * no side effects, no network calls, no fabricated data.
 */

import { QUADRANT_META, type KraljicQuadrant } from './kraljicScoring';
import type { RelationshipCompatibility, NegotiationStrategy, NegotiationPlanDocument } from './supplierSourcingStrategy';

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
// 2. Quadrant-informed scrutiny defaults (KRALJIC USAGE MAP item 5a)
// ---------------------------------------------------------------------------

export type ThresholdSource = 'caller-override' | 'quadrant-informed-default' | 'generic-default';

const DEFAULT_FLAT_BAND_PCT = 3;

/**
 * Heuristic, disclosed defaults -- the DIRECTION (Leverage tightest,
 * Bottleneck/Non-critical loosest) is Kraljic-sourced; the specific
 * percentages are this module's own non-fabricated heuristic, exactly
 * like DEFAULT_FLAT_BAND_PCT itself, always overridable, always disclosed
 * via `flatBandSource` on the result.
 */
const QUADRANT_FLAT_BAND_PCT: Record<KraljicQuadrant, number> = {
  leverage: 2,
  strategic: 3,
  bottleneck: 5,
  'non-critical': 5,
};

const JUSTIFICATION_GAP_TOLERANCE_PCT = 2;

const QUADRANT_JUSTIFICATION_TOLERANCE_PCT: Record<KraljicQuadrant, number> = {
  leverage: 1,
  strategic: 2,
  bottleneck: 3,
  'non-critical': 4,
};

// ---------------------------------------------------------------------------
// 3. Price trajectory (DECISION A/B above)
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
  /** The actual +/-% band applied to classify up/down/flat. Undefined when INSUFFICIENT_DATA (no banding decision was exercised). Optional so directly-constructed literals (tests, callers) don't have to supply it. */
  flatBandPctApplied?: number;
  /** Discloses whether the band above came from an explicit caller override, a Kraljic-quadrant-informed heuristic default, or the plain generic default -- never silently applied. */
  flatBandSource?: ThresholdSource;
}

/**
 * DECISION A/B: needs 3+ points to claim a direction; the +/-band is
 * disclosed (generic, quadrant-informed, or caller-overridden -- never a
 * sourced benchmark).
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
 *
 * KRALJIC USAGE MAP item 5a: pass `quadrant` to apply a disclosed,
 * quadrant-informed default band instead of the plain generic default --
 * an explicit `flatBandPct` always wins over both.
 */
export function computePriceTrajectory(
  points: PricePoint[],
  opts: { periodMonths?: number; basis?: EvidenceBasis; flatBandPct?: number; quadrant?: KraljicQuadrant | null } = {},
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

  let flatBand: number;
  let flatBandSource: ThresholdSource;
  if (opts.flatBandPct !== undefined) {
    flatBand = opts.flatBandPct;
    flatBandSource = 'caller-override';
  } else if (opts.quadrant) {
    flatBand = QUADRANT_FLAT_BAND_PCT[opts.quadrant];
    flatBandSource = 'quadrant-informed-default';
  } else {
    flatBand = DEFAULT_FLAT_BAND_PCT;
    flatBandSource = 'generic-default';
  }

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
    flatBandPctApplied: flatBand,
    flatBandSource,
  };
}

// ---------------------------------------------------------------------------
// 4. Cost drivers + justification-gap check (Rawabi illustrative example, operationalized)
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
  /** The +/-point tolerance actually applied. Undefined when INSUFFICIENT_DATA (no tolerance decision was exercised). */
  toleranceApplied?: number;
  toleranceSource?: ThresholdSource;
}

/**
 * Operationalizes the SI-06 illustrative example: a supplier's claimed 12%
 * driven-by-aluminum-pricing justification checked against real 4%
 * aluminum market movement is NOT supported -- an 8-point gap the client
 * should open the negotiation with, not accept on faith.
 *
 * KRALJIC USAGE MAP item 5a: pass `quadrant` in `opts` to apply a
 * disclosed, quadrant-informed tolerance instead of the plain generic
 * default -- an explicit `toleranceOverride` always wins over both.
 */
export function assessCostDriverJustification(
  input: CostDriverInput,
  referenceImpactPct: number | null,
  opts: { toleranceOverride?: number; quadrant?: KraljicQuadrant | null } = {},
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

  let tolerance: number;
  let toleranceSource: ThresholdSource;
  if (opts.toleranceOverride !== undefined) {
    tolerance = opts.toleranceOverride;
    toleranceSource = 'caller-override';
  } else if (opts.quadrant) {
    tolerance = QUADRANT_JUSTIFICATION_TOLERANCE_PCT[opts.quadrant];
    toleranceSource = 'quadrant-informed-default';
  } else {
    tolerance = JUSTIFICATION_GAP_TOLERANCE_PCT;
    toleranceSource = 'generic-default';
  }

  const gapPct = Math.round((input.claimedImpactPct - referenceImpactPct) * 100) / 100;
  const supported = Math.abs(gapPct) <= tolerance;
  return {
    driver: input.driver,
    claimedImpactPct: input.claimedImpactPct,
    referenceImpactPct,
    supported,
    gapPct,
    note: supported
      ? `Claimed ${input.claimedImpactPct}% impact is consistent with the ${referenceImpactPct}% reference figure (within ${tolerance} points).`
      : `Claimed ${input.claimedImpactPct}% impact vs. a ${referenceImpactPct}% reference figure -- a ${Math.abs(gapPct)}-point gap, stated plainly as an opening negotiation fact rather than accepted.`,
    toleranceApplied: tolerance,
    toleranceSource,
  };
}

// ---------------------------------------------------------------------------
// 5. Negotiation leverage (FRAMEWORK 1: BATNA + KRALJIC USAGE MAP item 5b)
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
  /**
   * KRALJIC USAGE MAP item 5b: populated only when a quadrant was supplied
   * AND a genuine structural mismatch was found (WEAK leverage in a
   * Leverage quadrant, or STRONG leverage in a Bottleneck quadrant) --
   * never populated for a normal, consistent result, and never applied to
   * Strategic/Non-critical (no equally strong Kraljic-sourced structural
   * prediction exists for those two).
   */
  quadrantConsistencyNote: string | null;
  quadrantConsistencyNoteAr: string | null;
}

const LOW_LOCK_IN_THRESHOLD = 2;
const HIGH_LOCK_IN_THRESHOLD = 4;

/**
 * BATNA strength requires BOTH low lock-in AND survivable continuity -- a
 * conjunction, not an average, so one weak input can't be masked by the
 * other.
 *
 * KRALJIC USAGE MAP item 5b: pass `quadrant` to run the structural
 * consistency check described in this file's header.
 */
export function assessNegotiationLeverage(inputs: NegotiationLeverageInputs, quadrant?: KraljicQuadrant | null): NegotiationLeverage {
  const { lockInIndex, isSurvivable } = inputs;

  if (lockInIndex === null || isSurvivable === null) {
    return {
      level: 'INSUFFICIENT_DATA',
      lockInIndex,
      isSurvivable,
      framingEn: 'Negotiation leverage cannot be assessed yet -- Module 05 has not produced a Lock-In Index and/or survivability result for this supplier.',
      framingAr: 'لا يمكن تقييم قوة التفاوض بعد -- لم تُصدر الوحدة 05 بعد مؤشر التقييد أو نتيجة القدرة على الاستمرار (أو كليهما) لهذا المورّد.',
      quadrantConsistencyNote: null,
      quadrantConsistencyNoteAr: null,
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

  let quadrantConsistencyNote: string | null = null;
  let quadrantConsistencyNoteAr: string | null = null;
  if (quadrant === 'leverage' && level === 'WEAK') {
    quadrantConsistencyNote = 'Worth re-verifying: a Leverage-quadrant supplier (many qualified alternatives, low switching cost by definition) showing WEAK computed leverage is a structural mismatch -- confirm the Kraljic classification is still current and that Module 05\'s Lock-In Index reflects real, not stale, alternative-supplier data.';
    quadrantConsistencyNoteAr = 'يستحق إعادة التحقق: مورد من ربع "النفوذ" (يملك بحكم تعريفه بدائل مؤهلة عديدة وتكلفة تبديل منخفضة) يُظهر قوة تفاوضية ضعيفة محسوبة هو تناقض بنيوي -- تأكد من أن تصنيف كرالييك ما زال حديثاً وأن مؤشر التقييد في الوحدة 05 يعكس بيانات موردين بديلين حقيقية وليست قديمة.';
  } else if (quadrant === 'bottleneck' && level === 'STRONG') {
    quadrantConsistencyNote = 'Worth re-verifying: a Bottleneck-quadrant supplier (few real alternatives by definition) showing STRONG computed leverage is a structural mismatch -- confirm whether a genuine new alternative has emerged (in which case the Kraljic quadrant itself may be ready to move) or whether Module 05\'s inputs need review.';
    quadrantConsistencyNoteAr = 'يستحق إعادة التحقق: مورد من ربع "الاختناق" (يملك بحكم تعريفه بدائل حقيقية قليلة) يُظهر قوة تفاوضية عالية محسوبة هو تناقض بنيوي -- تأكد مما إذا كان قد ظهر بديل حقيقي جديد فعلاً (وعندها قد يكون تصنيف كرالييك نفسه جاهزاً للتغيير) أو ما إذا كانت مدخلات الوحدة 05 بحاجة لمراجعة.';
  }

  return { level, lockInIndex, isSurvivable, framingEn: en, framingAr: ar, quadrantConsistencyNote, quadrantConsistencyNoteAr };
}

// ---------------------------------------------------------------------------
// 6. Negotiation round history + Tit-for-Tat (FRAMEWORK 2)
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
// 7. Negotiation Brief orchestration (SI-06 output schema)
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
  /**
   * Pass-through of Module 02's `assessRelationshipCompatibility(quadrant,
   * currentPosture)` output, computed by the caller -- null when the
   * client's current relationship posture for this supplier hasn't been
   * recorded yet. Never computed inside this module (see ARCHITECTURE
   * CORRECTION above).
   */
  relationshipCompatibility: RelationshipCompatibility | null;
  /**
   * Pass-through of Module 02's `recommendNegotiationStrategy(quadrant,
   * relationshipCompatibility)` output -- the quadrant-level approach,
   * BATNA/ZOPA guidance, and MIL objectives. Null when `kraljicQuadrant`
   * is null (Module 02 not yet run for this supplier).
   */
  negotiationStrategy: NegotiationStrategy | null;
  /**
   * Pass-through of Module 02's `buildNegotiationPlan(quadrant)` output --
   * the negotiation team, level structure, and both named-tactic lists.
   * Null when `kraljicQuadrant` is null.
   */
  negotiationPlan: NegotiationPlanDocument | null;
}

export interface NegotiationBrief {
  supplierId: string;
  kraljicQuadrant: KraljicQuadrant | null;
  priceTrajectory: PriceTrajectory;
  costDriverJustifications: CostDriverJustification[];
  tcoReferenceId: string | null;
  contractEntitlementId: string | null;
  negotiationLeverage: NegotiationLeverage;
  relationshipCompatibility: RelationshipCompatibility | null;
  negotiationStrategy: NegotiationStrategy | null;
  negotiationPlan: NegotiationPlanDocument | null;
  nextMove: NextMoveRecommendation;
  unsupportedCostDriverCount: number;
}

/**
 * Pure orchestration -- every field on the output is either a value this
 * module itself computed (priceTrajectory, costDriverJustifications,
 * negotiationLeverage, nextMove) or a straight pass-through of a value the
 * CALLER already computed elsewhere (relationshipCompatibility,
 * negotiationStrategy, negotiationPlan, tcoReferenceId,
 * contractEntitlementId). This function never calls into Module 02, 05,
 * the TCO Engine, or Contract Intelligence itself.
 */
export function buildNegotiationBrief(input: NegotiationBriefInput): NegotiationBrief {
  const nextMove = recommendNextMove(input.negotiationRoundHistory);
  const unsupportedCostDriverCount = input.costDriverJustifications.filter((j) => j.supported === false).length;

  return {
    supplierId: input.supplierId,
    kraljicQuadrant: input.kraljicQuadrant,
    priceTrajectory: input.priceTrajectory,
    costDriverJustifications: input.costDriverJustifications,
    tcoReferenceId: input.tcoReferenceId,
    contractEntitlementId: input.contractEntitlementId,
    negotiationLeverage: input.negotiationLeverage,
    relationshipCompatibility: input.relationshipCompatibility,
    negotiationStrategy: input.negotiationStrategy,
    negotiationPlan: input.negotiationPlan,
    nextMove,
    unsupportedCostDriverCount,
  };
}

// ---------------------------------------------------------------------------
// 8. Bilingual narrative (Module 09 consultancy framing)
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

const APPROACH_LABEL_AR: Record<NegotiationStrategy['recommendedApproach'], string> = {
  distributive: 'توزيعي (تنافسي)',
  mixed: 'مختلط',
  integrative: 'تكاملي (تعاوني)',
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
  if (brief.negotiationLeverage.quadrantConsistencyNote) {
    lines.push(isAr ? brief.negotiationLeverage.quadrantConsistencyNoteAr! : brief.negotiationLeverage.quadrantConsistencyNote);
  }

  if (brief.relationshipCompatibility) {
    lines.push(isAr ? brief.relationshipCompatibility.advisoryAr : brief.relationshipCompatibility.advisory);
  }

  if (brief.negotiationStrategy) {
    const s = brief.negotiationStrategy;
    const approachAr = APPROACH_LABEL_AR[s.recommendedApproach];
    lines.push(
      isAr
        ? `النهج التفاوضي الموصى به (الوحدة 02، ربع ${QUADRANT_META[s.quadrant].labelAr}): ${approachAr} -- ${s.approachRationaleAr}`
        : `Recommended negotiation approach (Module 02, ${s.quadrant} quadrant): ${s.recommendedApproach} -- ${s.approachRationale}`,
    );
    if (s.relationshipAdjustment) {
      lines.push(isAr ? s.relationshipAdjustmentAr! : s.relationshipAdjustment);
    }
  }

  if (brief.negotiationPlan) {
    const p = brief.negotiationPlan;
    lines.push(
      isAr
        ? `هيكل التفاوض: فريق من ${p.team.length} أدوار عبر ${p.levels.length} مستوى/مستويات.`
        : `Negotiation structure: ${p.team.length}-role team across ${p.levels.length} level(s).`,
    );
    if (p.recommendedTactics.length > 0) {
      const names = p.recommendedTactics.map((t) => (isAr ? t.name.ar : t.name.en)).join('، ');
      lines.push(
        isAr
          ? `تكتيكات موصى بها: ${names}.`
          : `Recommended tactics: ${names}.`,
      );
    }
    if (p.watchForTactics.length > 0) {
      const names = p.watchForTactics.map((t) => (isAr ? t.name.ar : t.name.en)).join('، ');
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
