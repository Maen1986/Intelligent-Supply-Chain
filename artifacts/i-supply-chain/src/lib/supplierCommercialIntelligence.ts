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
 *
 * =====================================================================
 * EXPERTISE-VIEWPOINT ENHANCEMENT PASS (9 Sep 2026)
 * =====================================================================
 * Owner's instruction: rate this module against real-world best-in-class
 * commercial/negotiation-intelligence practice and enhance it to reach
 * that level -- "wide and deep, easy to use." Reviewed against CIPS/ISM
 * procurement-excellence literature and should-cost/savings-tracking
 * practice, three genuine capability gaps were found and closed, each
 * a thin, pure, bilingual function that composes with the existing brief
 * rather than replacing anything:
 *   1. SHOULD-COST GAP (Section 9) -- the module previously only checked
 *      whether a supplier's claimed cost-INCREASE driver was internally
 *      consistent; it never asked whether the underlying price is fair in
 *      the first place. Should-cost modeling -- an independent buyer-side
 *      estimate of materials + labor + overhead + margin, compared to the
 *      quoted price -- is standard practice (McKinsey, "Find cost
 *      opportunities with today's should-cost analysis"; CIPS whole-life
 *      -costing discipline) and the single highest-leverage negotiation
 *      input this module was missing. `assessShouldCostGap()` adds it as
 *      a caller-supplied cost-breakdown comparison, never a fabricated
 *      cost estimate -- the client (or their engineering/should-cost
 *      function) supplies the component figures; this module only does
 *      the comparison math and quadrant-informed materiality banding
 *      (KRALJIC USAGE MAP item 6, same non-fabrication pattern as items
 *      5a/5b: direction Kraljic-sourced, specific percentages disclosed
 *      heuristics).
 *   2. NEGOTIATED VALUE TRACKING (Section 10) -- the module recommended
 *      negotiation moves but never recorded what negotiation actually
 *      delivered. CIPS distinguishes HARD SAVINGS (a negotiated reduction
 *      in what the organization is actually paying -- finance-recognized)
 *      from COST AVOIDANCE (a proposed increase negotiated down -- e.g. a
 *      supplier asks for +12%, the client negotiates it to +3%; the
 *      9-point difference is real value but a "soft saving," not a
 *      reduction in current spend) -- CIPS: "cost avoidance is a
 *      reduction in cost resulting in a spend that is lower than would
 *      otherwise have been if the cost-avoidance exercise had not been
 *      undertaken." `assessNegotiationOutcome()` classifies outcomes into
 *      exactly these two categories (or NO_VALUE_CAPTURED when the
 *      negotiated price did not improve on the baseline) and always
 *      states which one applies -- never lets a soft saving be presented
 *      as a hard one, which would itself be a Decision-Record-8.7
 *      violation. This module deliberately does NOT hard-code an
 *      industry benchmark rate (e.g. ISM's reported average savings/
 *      avoidance percentages of managed spend) as a target or scorecard
 *      threshold -- that figure describes a cross-industry average, not
 *      this client's own achievable rate, and baking it in as a
 *      comparison point would be exactly the kind of fabricated-relevance
 *      Decision Record 8.7 forbids; it is cited in the module doc as
 *      context only, never in code as a threshold.
 *   3. REBATE-TIER POSITIONING (Section 11) -- volume/rebate tier
 *      structures are a standard, concrete lever (a buyer $50K of annual
 *      volume away from a better rebate tier is immediately actionable
 *      negotiation leverage) that was entirely absent. `assessRebateTierPosition()`
 *      takes caller-supplied tier thresholds (never invented) and the
 *      client's actual current volume, and reports the current tier, the
 *      next tier, the volume gap to it, and (when a per-unit value is
 *      supplied) the retroactive rebate-value difference -- reflecting
 *      how volume rebates are conventionally structured (paid at invoice
 *      price throughout the period, rebated retroactively once a
 *      threshold is verified).
 *   4. INDEX-LINKED-CLAUSE SUGGESTION (folded into Section 4, not a new
 *      section) -- when a cost-driver claim is found unsupported AND a
 *      real reference index figure exists for it, `assessCostDriverJustification()`
 *      now flags that a future index-linked pricing clause (tying future
 *      adjustments to a named, verifiable public index rather than
 *      re-litigating the claim each cycle) is worth proposing -- a
 *      forward-looking, low-cost addition to an existing, already-tested
 *      function rather than a new framework.
 * None of these four re-derive TCO, concentration, or Kraljic
 * classification -- all remain pass-through references to their owning
 * modules, consistent with "REUSE, NOT REBUILD" above.
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
  /**
   * EXPERTISE-VIEWPOINT ENHANCEMENT (9 Sep 2026): true only when a real
   * reference figure existed AND the claim was unsupported -- i.e. there is
   * a verifiable public index for this driver and the supplier's claim
   * doesn't track it. In that specific case, proposing a future
   * index-linked pricing clause (tying subsequent adjustments to the named
   * index automatically rather than re-litigating a claim each cycle) is a
   * standard, sourced commercial-intelligence recommendation. Never set
   * true on INSUFFICIENT_DATA or a supported claim -- there is nothing to
   * fix in either case.
   */
  suggestIndexLinkedClause: boolean;
  /** Present only when suggestIndexLinkedClause is true. */
  indexLinkedClauseNoteEn?: string;
  indexLinkedClauseNoteAr?: string;
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
      suggestIndexLinkedClause: false,
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
  const suggestIndexLinkedClause = !supported;
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
    suggestIndexLinkedClause,
    ...(suggestIndexLinkedClause
      ? {
          indexLinkedClauseNoteEn: `Since a real reference figure exists for "${input.driver}" but the supplier's claim doesn't track it, consider proposing an index-linked pricing clause for this driver going forward -- future adjustments tied automatically to a named, verifiable public index (e.g. LME, Platts, a national statistics office series) instead of being re-argued from scratch each cycle.`,
          indexLinkedClauseNoteAr: `نظراً لوجود رقم مرجعي حقيقي لمحرك التكلفة "${input.driver}" بينما لا يعكس ادعاء المورد ذلك، يُنصح باقتراح بند تسعير مرتبط بمؤشر لهذا المحرك مستقبلاً -- بحيث تُربط التعديلات القادمة تلقائياً بمؤشر عام موثوق ومُعلَن (مثل مؤشرات LME أو Platts أو جهة إحصاء وطنية) بدلاً من التفاوض عليها من جديد في كل دورة.`,
        }
      : {}),
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
// 7. Should-Cost Gap Analysis (EXPERTISE-VIEWPOINT ENHANCEMENT item 1)
// ---------------------------------------------------------------------------
// Source: independent cost-breakdown-structure ("should-cost") modeling --
// McKinsey, "Find cost opportunities with today's should-cost analysis";
// CIPS whole-life-costing discipline. This does NOT estimate a cost model --
// that would fabricate data the client hasn't verified. The client (their
// engineering, cost-engineering, or should-cost function) supplies the
// component breakdown; this module compares it to the quoted price, builds
// a cost-structure fingerprint, and -- when the supplier's OWN cost
// breakdown is also disclosed -- pinpoints exactly which cost category
// drives the gap, not just the headline number. Owner directive (9 Sep
// 2026, follow-up): built as a full, holistic segment, not a thin
// single-number comparison.

/**
 * Standard should-cost / cost-breakdown-structure (CBS) taxonomy --
 * deliberately a SUPERSET spanning multiple industries (manufacturing,
 * logistics, professional services, construction, software), not just a
 * manufacturing-centric list. A freight supplier's should-cost is fuel +
 * driver labor + equipment depreciation, not "raw materials"; a consulting
 * supplier's is labor hours + SG&A, with no materials line at all. Which
 * subset of this taxonomy is EXPECTED for a given supplier is declared via
 * `CostModelArchetype` below, not assumed from the category list alone.
 */
export type CostBreakdownCategory =
  | 'raw_materials'
  | 'direct_labor'
  | 'manufacturing_overhead'
  | 'tooling_equipment'
  | 'packaging'
  | 'logistics_freight'
  | 'fuel_energy'
  | 'equipment_depreciation'
  | 'subcontractor_pass_through'
  | 'license_royalty_fee'
  | 'insurance_bonding'
  | 'duties_tariffs'
  | 'sga_allocation'
  | 'supplier_margin'
  | 'other';

export const COST_BREAKDOWN_CATEGORY_LABEL: Record<CostBreakdownCategory, { en: string; ar: string }> = {
  raw_materials: { en: 'Raw materials', ar: 'المواد الخام' },
  direct_labor: { en: 'Direct labor', ar: 'العمالة المباشرة' },
  manufacturing_overhead: { en: 'Manufacturing overhead', ar: 'التكاليف الصناعية غير المباشرة' },
  tooling_equipment: { en: 'Tooling / equipment amortization', ar: 'استهلاك الأدوات والمعدات' },
  packaging: { en: 'Packaging', ar: 'التغليف' },
  logistics_freight: { en: 'Logistics / freight', ar: 'الخدمات اللوجستية والشحن' },
  fuel_energy: { en: 'Fuel / energy', ar: 'الوقود والطاقة' },
  equipment_depreciation: { en: 'Equipment depreciation', ar: 'استهلاك المعدات' },
  subcontractor_pass_through: { en: 'Subcontractor pass-through', ar: 'تكاليف مقاولين من الباطن (تمرير مباشر)' },
  license_royalty_fee: { en: 'License / royalty fee', ar: 'رسوم الترخيص / الإتاوات' },
  insurance_bonding: { en: 'Insurance / bonding', ar: 'التأمين والضمانات' },
  duties_tariffs: { en: 'Duties / tariffs', ar: 'الرسوم الجمركية' },
  sga_allocation: { en: 'SG&A allocation', ar: 'تخصيص المصاريف الإدارية والعمومية' },
  supplier_margin: { en: 'Supplier margin', ar: 'هامش ربح المورّد' },
  other: { en: 'Other', ar: 'أخرى' },
};

/**
 * Named cost-model archetypes, each with its own EXPECTED category subset
 * (declared in `ARCHETYPE_TYPICAL_CATEGORIES` below). This is a
 * classification/QA aid, not a numeric benchmark -- it never asserts what
 * a category's dollar value or % should be for an industry (that would be
 * exactly the fabricated-benchmark Decision Record 8.7 forbids). It only
 * flags when a component's category is unusual for the declared archetype
 * (e.g. "raw_materials" on a declared professional_services model), which
 * is far more often a mis-categorization than a real anomaly and is worth
 * a disclosed check, same pattern as the Kraljic leverage/quadrant
 * structural-consistency check in Section 5. Complements, and can be
 * cross-referenced against, the platform's existing UNSPSC-based Services
 * Classification Book (#241) for a supplier's category code -- a
 * reference concept only, never a hard runtime import.
 */
export type CostModelArchetype =
  | 'manufactured_goods'
  | 'raw_material_commodity'
  | 'logistics_freight_services'
  | 'professional_services'
  | 'construction_works'
  | 'software_license_saas'
  | 'generic';

export const COST_MODEL_ARCHETYPE_LABEL: Record<CostModelArchetype, { en: string; ar: string }> = {
  manufactured_goods: { en: 'Manufactured goods', ar: 'سلع مُصنَّعة' },
  raw_material_commodity: { en: 'Raw-material commodity', ar: 'سلعة أساسية (مادة خام)' },
  logistics_freight_services: { en: 'Logistics / freight services', ar: 'خدمات لوجستية وشحن' },
  professional_services: { en: 'Professional services', ar: 'خدمات مهنية' },
  construction_works: { en: 'Construction works', ar: 'أعمال إنشائية' },
  software_license_saas: { en: 'Software license / SaaS', ar: 'ترخيص برمجيات / SaaS' },
  generic: { en: 'Generic / unclassified', ar: 'عام / غير مصنّف' },
};

/**
 * The EXPECTED category subset per archetype. 'generic' intentionally
 * allows every category (no structural check fires) -- for suppliers that
 * genuinely don't fit one of the named archetypes, 'generic' is always a
 * safe, honest choice rather than forcing a bad fit.
 */
const ARCHETYPE_TYPICAL_CATEGORIES: Record<CostModelArchetype, CostBreakdownCategory[]> = {
  manufactured_goods: ['raw_materials', 'direct_labor', 'manufacturing_overhead', 'tooling_equipment', 'packaging', 'logistics_freight', 'duties_tariffs', 'sga_allocation', 'supplier_margin', 'other'],
  raw_material_commodity: ['raw_materials', 'logistics_freight', 'duties_tariffs', 'sga_allocation', 'supplier_margin', 'other'],
  logistics_freight_services: ['direct_labor', 'fuel_energy', 'equipment_depreciation', 'insurance_bonding', 'duties_tariffs', 'sga_allocation', 'supplier_margin', 'other'],
  professional_services: ['direct_labor', 'subcontractor_pass_through', 'sga_allocation', 'supplier_margin', 'other'],
  construction_works: ['raw_materials', 'direct_labor', 'equipment_depreciation', 'subcontractor_pass_through', 'insurance_bonding', 'sga_allocation', 'supplier_margin', 'other'],
  software_license_saas: ['license_royalty_fee', 'direct_labor', 'sga_allocation', 'supplier_margin', 'other'],
  generic: ['raw_materials', 'direct_labor', 'manufacturing_overhead', 'tooling_equipment', 'packaging', 'logistics_freight', 'fuel_energy', 'equipment_depreciation', 'subcontractor_pass_through', 'license_royalty_fee', 'insurance_bonding', 'duties_tariffs', 'sga_allocation', 'supplier_margin', 'other'],
};

export interface CostBreakdownComponent {
  category: CostBreakdownCategory;
  /** Free-text specifics, e.g. "6061 aluminum extrusion, 4.2kg @ spot". */
  description: string;
  amount: number;
  basis: EvidenceBasis;
  /** True when this component is tied to a verifiable public market index -- links conceptually to Section 4's index-linked-clause suggestion. */
  isMarketIndexed?: boolean;
  note?: string;
}

export interface ShouldCostModel {
  components: CostBreakdownComponent[];
  currency: string;
  /** Overall evidence tier of the model as a whole -- 'estimated' if any component is a rough estimate. */
  basis: EvidenceBasis;
  /** Declares which industry cost-structure this model represents, so category-taxonomy checks apply the RIGHT expected categories for this supplier's actual business, not a one-size-fits-all manufacturing list. Use 'generic' when no named archetype fits -- always safe, never forces a bad fit. */
  archetype: CostModelArchetype;
  /**
   * Reference-only traceability to the platform's existing UNSPSC-based
   * Services Classification Book (#241) -- e.g. a specific commodity/class
   * code. Never used in any calculation here; purely lets a reader trace
   * which specific category this should-cost model represents, since
   * should-cost structure genuinely varies WITHIN an archetype too (an
   * aluminum-extrusion part and an injection-molded part are both
   * 'manufactured_goods' but have different real cost structures) -- see
   * `categoryTypicalOverride` on `assessShouldCostGap` for how a
   * category-specific expected-category set can refine the archetype
   * default without this module inventing category-specific numbers.
   */
  unspscCategoryCode?: string;
  categoryLabel?: string;
}

/** The supplier's OWN disclosed cost breakdown, if they provide one -- optional, never fabricated on their behalf. */
export interface QuotedCostBreakdown {
  components: CostBreakdownComponent[];
  currency: string;
}

export type ShouldCostGapSeverity = 'ALIGNED' | 'MODERATE_GAP' | 'MATERIAL_GAP' | 'INSUFFICIENT_DATA';

export interface CostCategoryFingerprintEntry {
  category: CostBreakdownCategory;
  amount: number;
  pctOfTotal: number;
}

export interface CostCategoryGap {
  category: CostBreakdownCategory;
  shouldCostAmount: number;
  quotedAmount: number;
  gapAmount: number;
  gapPct: number | null;
}

export interface ShouldCostMarginObservation {
  marginPctOfShouldCost: number;
  /** The client's own expected/target margin for comparison -- never invented by this module (Decision Record 8.7). */
  expectationPct: number | null;
  exceedsExpectation: boolean | null;
}

export interface ShouldCostGap {
  shouldCostTotal: number | null;
  quotedPrice: number | null;
  /** quotedPrice - shouldCostTotal. Positive = quote sits above the should-cost estimate. */
  gapAmount: number | null;
  gapPct: number | null;
  severity: ShouldCostGapSeverity;
  toleranceApplied?: number;
  toleranceSource?: ThresholdSource;
  componentBreakdown: CostBreakdownComponent[];
  /** Echoed from the supplied ShouldCostModel -- null only in the INSUFFICIENT_DATA case where no model exists at all. */
  archetype: CostModelArchetype | null;
  /**
   * Categories present in the model that are NOT expected for the
   * declared archetype (e.g. 'raw_materials' on a declared
   * professional_services model) -- a structural/categorization check,
   * not a numeric judgment. Empty array (not null) when the model exists
   * and every category fits; always empty for archetype 'generic'.
   */
  categoryArchetypeWarnings: CostBreakdownCategory[];
  /**
   * Discloses whether the expected-category set used for the check above
   * came from the caller's own category-specific override
   * (`categoryTypicalOverride`) or the plain archetype-level default --
   * since should-cost structure genuinely varies WITHIN an archetype too,
   * not just across archetypes (same non-fabrication disclosure pattern
   * as `ThresholdSource` elsewhere in this file). Undefined only in the
   * INSUFFICIENT_DATA case (no check was exercised).
   */
  categoryCheckSource?: 'caller-override' | 'archetype-default';
  /** Cost-structure fingerprint of the should-cost model -- % of total by category, sorted descending. Always computed when a model exists. */
  categoryFingerprint: CostCategoryFingerprintEntry[];
  /**
   * Populated only when the caller also supplies the supplier's own quoted
   * cost breakdown -- a category-by-category comparison, sorted by
   * absolute gap descending, so the negotiation can target the SPECIFIC
   * cost categories driving the gap rather than the headline price alone.
   * Null when no quoted breakdown was supplied.
   */
  categoryGaps: CostCategoryGap[] | null;
  granularity: 'aggregate' | 'category-level';
  /**
   * Populated only when the should-cost model includes a 'supplier_margin'
   * component. Purely factual (% of should-cost total) unless the caller
   * also supplies an expectation to compare against -- this module never
   * invents a "typical margin" benchmark (Decision Record 8.7).
   */
  marginObservation: ShouldCostMarginObservation | null;
  narrativeEn: string;
  narrativeAr: string;
}

const DEFAULT_SHOULD_COST_TOLERANCE_PCT = 10;

/**
 * Heuristic, disclosed defaults -- direction is Kraljic-sourced (Leverage
 * quadrant calls for exploiting competitive market power, so a tighter band
 * is appropriate there; Bottleneck calls for securing supply continuity,
 * where a premium above should-cost is sometimes the accepted cost of
 * reliable supply); specific percentages are this module's own
 * non-fabricated heuristic, always overridable, always disclosed via
 * `toleranceSource` (KRALJIC USAGE MAP item 6).
 */
const QUADRANT_SHOULD_COST_TOLERANCE_PCT: Record<KraljicQuadrant, number> = {
  leverage: 6,
  strategic: 10,
  bottleneck: 15,
  'non-critical': 15,
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Compares a caller-supplied should-cost breakdown against the quoted
 * price, always computing the cost-structure fingerprint, and -- when the
 * supplier's own quoted breakdown is supplied -- a category-level gap
 * analysis that pinpoints which specific cost categories drive the gap.
 * Returns INSUFFICIENT_DATA if either the model or the quoted price is
 * missing -- never guesses a should-cost figure.
 */
export function assessShouldCostGap(
  model: ShouldCostModel | null,
  quotedPrice: number | null,
  opts: {
    toleranceOverride?: number;
    quadrant?: KraljicQuadrant | null;
    quotedBreakdown?: QuotedCostBreakdown | null;
    marginExpectationPct?: number | null;
    /**
     * Refines the archetype-level expected-category set for THIS
     * specific category/item -- e.g. an aluminum-extrusion sub-category
     * of 'manufactured_goods' might reasonably exclude 'tooling_equipment'
     * that a custom-molded sub-category would expect. Caller-supplied
     * only (e.g. informed by the platform's own UNSPSC classification for
     * this item) -- this module never invents a category-specific list on
     * its own. Wins over the archetype default when supplied.
     */
    categoryTypicalOverride?: CostBreakdownCategory[];
  } = {},
): ShouldCostGap {
  if (model === null || quotedPrice === null || model.components.length === 0) {
    return {
      shouldCostTotal: null,
      quotedPrice,
      gapAmount: null,
      gapPct: null,
      severity: 'INSUFFICIENT_DATA',
      componentBreakdown: model?.components ?? [],
      archetype: model?.archetype ?? null,
      categoryArchetypeWarnings: [],
      categoryFingerprint: [],
      categoryGaps: null,
      granularity: 'aggregate',
      marginObservation: null,
      narrativeEn: 'Should-cost gap cannot be assessed yet -- no independent cost-breakdown model has been supplied for this item/supplier.',
      narrativeAr: 'لا يمكن تقييم فجوة التكلفة المستهدفة (should-cost) بعد -- لم يتم توفير نموذج تفصيلي مستقل لتكوين التكلفة لهذا البند/المورّد.',
    };
  }

  const shouldCostTotal = round2(model.components.reduce((sum, c) => sum + c.amount, 0));
  const gapAmount = round2(quotedPrice - shouldCostTotal);
  const gapPct = shouldCostTotal === 0 ? null : round2((gapAmount / shouldCostTotal) * 100);

  // Cost-structure fingerprint -- always computed from the should-cost model itself.
  const byCategory = new Map<CostBreakdownCategory, number>();
  for (const c of model.components) byCategory.set(c.category, (byCategory.get(c.category) ?? 0) + c.amount);
  const categoryFingerprint: CostCategoryFingerprintEntry[] = [...byCategory.entries()]
    .map(([category, amount]) => ({ category, amount: round2(amount), pctOfTotal: shouldCostTotal === 0 ? 0 : round2((amount / shouldCostTotal) * 100) }))
    .sort((a, b) => b.amount - a.amount);

  // Industry-archetype (or, when supplied, caller's category-specific
  // override) category-taxonomy check -- structural/categorization only,
  // never a numeric judgment (see CostModelArchetype doc comment). Should
  // -cost structure varies WITHIN an archetype too, not just across
  // archetypes, so an explicit categoryTypicalOverride always wins.
  const categoryCheckSource: 'caller-override' | 'archetype-default' = opts.categoryTypicalOverride ? 'caller-override' : 'archetype-default';
  const typicalCategories = new Set(opts.categoryTypicalOverride ?? ARCHETYPE_TYPICAL_CATEGORIES[model.archetype]);
  const categoryArchetypeWarnings: CostBreakdownCategory[] = [...byCategory.keys()].filter((cat) => !typicalCategories.has(cat));

  // Margin observation -- factual by default, evaluative only if the caller supplies their own expectation.
  const marginAmount = byCategory.get('supplier_margin');
  const marginObservation: ShouldCostMarginObservation | null =
    marginAmount !== undefined && shouldCostTotal !== 0
      ? {
          marginPctOfShouldCost: round2((marginAmount / shouldCostTotal) * 100),
          expectationPct: opts.marginExpectationPct ?? null,
          exceedsExpectation:
            opts.marginExpectationPct !== undefined && opts.marginExpectationPct !== null
              ? round2((marginAmount / shouldCostTotal) * 100) > opts.marginExpectationPct
              : null,
        }
      : null;

  if (gapPct === null) {
    return {
      shouldCostTotal,
      quotedPrice,
      gapAmount,
      gapPct: null,
      severity: 'INSUFFICIENT_DATA',
      componentBreakdown: model.components,
      archetype: model.archetype,
      categoryArchetypeWarnings,
      categoryCheckSource,
      categoryFingerprint,
      categoryGaps: null,
      granularity: 'aggregate',
      marginObservation,
      narrativeEn: 'Should-cost total computed as zero -- gap percentage cannot be expressed; review the supplied cost-breakdown components.',
      narrativeAr: 'بلغ إجمالي التكلفة المستهدفة صفراً -- لا يمكن حساب نسبة الفجوة؛ يرجى مراجعة عناصر تفصيل التكلفة المُدخلة.',
    };
  }

  let tolerance: number;
  let toleranceSource: ThresholdSource;
  if (opts.toleranceOverride !== undefined) {
    tolerance = opts.toleranceOverride;
    toleranceSource = 'caller-override';
  } else if (opts.quadrant) {
    tolerance = QUADRANT_SHOULD_COST_TOLERANCE_PCT[opts.quadrant];
    toleranceSource = 'quadrant-informed-default';
  } else {
    tolerance = DEFAULT_SHOULD_COST_TOLERANCE_PCT;
    toleranceSource = 'generic-default';
  }

  const absGap = Math.abs(gapPct);
  const severity: ShouldCostGapSeverity = absGap <= tolerance ? 'ALIGNED' : absGap <= tolerance * 2 ? 'MODERATE_GAP' : 'MATERIAL_GAP';
  const aboveEn = gapAmount > 0 ? 'above' : 'below';
  const aboveAr = gapAmount > 0 ? 'أعلى من' : 'أدنى من';

  // Category-level gap analysis -- only when the supplier's own breakdown is disclosed.
  let categoryGaps: CostCategoryGap[] | null = null;
  let granularity: 'aggregate' | 'category-level' = 'aggregate';
  if (opts.quotedBreakdown && opts.quotedBreakdown.components.length > 0) {
    granularity = 'category-level';
    const quotedByCategory = new Map<CostBreakdownCategory, number>();
    for (const c of opts.quotedBreakdown.components) quotedByCategory.set(c.category, (quotedByCategory.get(c.category) ?? 0) + c.amount);
    const allCategories = new Set<CostBreakdownCategory>([...byCategory.keys(), ...quotedByCategory.keys()]);
    categoryGaps = [...allCategories]
      .map((category) => {
        const shouldCostAmount = round2(byCategory.get(category) ?? 0);
        const quotedAmount = round2(quotedByCategory.get(category) ?? 0);
        const catGapAmount = round2(quotedAmount - shouldCostAmount);
        const catGapPct = shouldCostAmount === 0 ? null : round2((catGapAmount / shouldCostAmount) * 100);
        return { category, shouldCostAmount, quotedAmount, gapAmount: catGapAmount, gapPct: catGapPct };
      })
      .sort((a, b) => Math.abs(b.gapAmount) - Math.abs(a.gapAmount));
  }

  const topDriver = categoryGaps && categoryGaps.length > 0 ? categoryGaps[0] : null;
  const topDriverClauseEn = topDriver
    ? ` The largest single driver is "${COST_BREAKDOWN_CATEGORY_LABEL[topDriver.category].en}" (${topDriver.gapAmount > 0 ? 'quoted above should-cost' : 'quoted below should-cost'} by ${Math.abs(topDriver.gapAmount)} ${model.currency}) -- negotiate that specific line item, not the total.`
    : '';
  const topDriverClauseAr = topDriver
    ? ` أكبر محرك منفرد هو "${COST_BREAKDOWN_CATEGORY_LABEL[topDriver.category].ar}" (${topDriver.gapAmount > 0 ? 'مُسعّر أعلى من التكلفة المستهدفة' : 'مُسعّر أدنى من التكلفة المستهدفة'} بفارق ${Math.abs(topDriver.gapAmount)} ${model.currency}) -- ينبغي التفاوض على هذا البند تحديداً وليس على الإجمالي فقط.`
    : '';
  const marginClauseEn = marginObservation
    ? ` Supplier margin represents ${marginObservation.marginPctOfShouldCost}% of the modeled should-cost total${marginObservation.expectationPct !== null ? ` (client expectation: ${marginObservation.expectationPct}% -- ${marginObservation.exceedsExpectation ? 'exceeds it' : 'within it'})` : ' (no client expectation supplied for comparison -- stated as fact only, not a judgment)'}.`
    : '';
  const marginClauseAr = marginObservation
    ? ` يمثّل هامش ربح المورّد ${marginObservation.marginPctOfShouldCost}% من إجمالي التكلفة المستهدفة المحتسبة${marginObservation.expectationPct !== null ? ` (توقّع العميل: ${marginObservation.expectationPct}% -- ${marginObservation.exceedsExpectation ? 'يتجاوزه' : 'ضمن الحدود المتوقعة'})` : ' (لم يتم توفير توقّع من العميل للمقارنة -- تُذكر كحقيقة فقط دون حكم)'}.`
    : '';
  const categoryCheckSourceClauseEn =
    categoryCheckSource === 'caller-override'
      ? ' this check used a caller-supplied category-specific override, not the generic archetype default (should-cost structure varies by specific category, not only by broad industry archetype).'
      : ` this check used the generic "${COST_MODEL_ARCHETYPE_LABEL[model.archetype].en}" archetype default (no category-specific override was supplied for this item).`;
  const categoryCheckSourceClauseAr =
    categoryCheckSource === 'caller-override'
      ? ' استخدم هذا الفحص تجاوزاً خاصاً بفئة محددة لهيكل التكلفة المتوقع، وليس افتراض التصنيف الصناعي العام (يختلف هيكل التكلفة المستهدف حسب الفئة المحددة، وليس فقط حسب التصنيف الصناعي الواسع).'
      : ` استخدم هذا الفحص افتراض التصنيف العام "${COST_MODEL_ARCHETYPE_LABEL[model.archetype].ar}" (لم يتم توفير تجاوز خاص بفئة محددة لهذا البند).`;
  const archetypeWarningClauseEn =
    categoryArchetypeWarnings.length > 0
      ? ` Note: this model is declared as "${COST_MODEL_ARCHETYPE_LABEL[model.archetype].en}", but includes ${categoryArchetypeWarnings.length === 1 ? 'a category' : 'categories'} unusual for that archetype (${categoryArchetypeWarnings.map((c) => COST_BREAKDOWN_CATEGORY_LABEL[c].en).join(', ')}) -- worth confirming this isn't a mis-categorized line item before relying on the fingerprint above. (Disclosure:${categoryCheckSourceClauseEn})`
      : ` (Disclosure:${categoryCheckSourceClauseEn})`;
  const archetypeWarningClauseAr =
    categoryArchetypeWarnings.length > 0
      ? ` ملاحظة: هذا النموذج مصنَّف كـ"${COST_MODEL_ARCHETYPE_LABEL[model.archetype].ar}"، لكنه يتضمن ${categoryArchetypeWarnings.length === 1 ? 'فئة' : 'فئات'} غير معتادة لهذا التصنيف (${categoryArchetypeWarnings.map((c) => COST_BREAKDOWN_CATEGORY_LABEL[c].ar).join('، ')}) -- يستحق التأكد من أن هذا ليس بنداً مصنَّفاً بشكل خاطئ قبل الاعتماد على البصمة أعلاه. (إفصاح:${categoryCheckSourceClauseAr})`
      : ` (إفصاح:${categoryCheckSourceClauseAr})`;

  const narrativeEn =
    severity === 'ALIGNED'
      ? `Quoted price (${quotedPrice} ${model.currency}) is within ${tolerance}% of the independently modeled should-cost (${shouldCostTotal} ${model.currency}) -- broadly aligned, not a priority negotiation lever.${marginClauseEn}${archetypeWarningClauseEn}`
      : `Quoted price (${quotedPrice} ${model.currency}) sits ${absGap}% ${aboveEn} the independently modeled should-cost (${shouldCostTotal} ${model.currency}) -- a ${severity === 'MATERIAL_GAP' ? 'material' : 'moderate'} gap of ${Math.abs(gapAmount)} ${model.currency}.${topDriverClauseEn}${marginClauseEn}${granularity === 'aggregate' ? ' (Aggregate comparison only -- no category-level supplier breakdown was supplied, so the gap cannot yet be attributed to a specific cost category.)' : ''}${archetypeWarningClauseEn}`;
  const narrativeAr =
    severity === 'ALIGNED'
      ? `السعر المعروض (${quotedPrice} ${model.currency}) يقع ضمن هامش ${tolerance}% من التكلفة المستهدفة المحتسبة باستقلالية (${shouldCostTotal} ${model.currency}) -- متوافق إلى حد كبير، وليس أولوية تفاوضية.${marginClauseAr}${archetypeWarningClauseAr}`
      : `السعر المعروض (${quotedPrice} ${model.currency}) ${aboveAr} التكلفة المستهدفة المحتسبة باستقلالية (${shouldCostTotal} ${model.currency}) بنسبة ${absGap}% -- فجوة ${severity === 'MATERIAL_GAP' ? 'جوهرية' : 'متوسطة'} قدرها ${Math.abs(gapAmount)} ${model.currency}.${topDriverClauseAr}${marginClauseAr}${granularity === 'aggregate' ? ' (مقارنة إجمالية فقط -- لم يتم توفير تفصيل تكلفة من المورّد على مستوى الفئات، لذا لا يمكن بعد نسب الفجوة لفئة تكلفة محددة.)' : ''}${archetypeWarningClauseAr}`;

  return {
    shouldCostTotal,
    quotedPrice,
    gapAmount,
    gapPct,
    severity,
    toleranceApplied: tolerance,
    toleranceSource,
    componentBreakdown: model.components,
    archetype: model.archetype,
    categoryArchetypeWarnings,
    categoryCheckSource,
    categoryFingerprint,
    categoryGaps,
    granularity,
    marginObservation,
    narrativeEn,
    narrativeAr,
  };
}

// ---------------------------------------------------------------------------
// 8. Negotiated Value Tracking -- Hard Savings, Cost Avoidance & Working
//    Capital (EXPERTISE-VIEWPOINT ENHANCEMENT item 2)
// ---------------------------------------------------------------------------
// Source: CIPS definitions. Hard savings = a negotiated reduction in what
// the organization is actually paying (finance-recognized). Cost avoidance =
// "a reduction in cost resulting in a spend that is lower than would
// otherwise have been if the cost-avoidance exercise had not been
// undertaken" (CIPS) -- e.g. a supplier proposes +12%, the client negotiates
// it to +3%; the 9-point difference is real value delivered, but a "soft
// saving" because current spend still went up. This module deliberately
// keeps the two categories distinct and never lets one be presented as the
// other. Built as a full value-tracking segment, not a single calculation:
// single-outcome classification, a ledger aggregator across many recorded
// outcomes, recurring-value annualization, and a distinct payment-terms/
// working-capital calculator (a real commercial lever that is NOT a price
// change and must never be folded into a savings/avoidance figure).
//
// This module does NOT hard-code an industry-average savings/avoidance
// benchmark (e.g. ISM's reported cross-industry averages) as a target or
// scorecard threshold -- a cross-industry average is not evidence of what
// THIS client can or should achieve, and treating it as a comparison point
// would itself be a fabricated-relevance violation. Cited only as narrative
// context in the module's own documentation, never baked into this code.

export type ValueType = 'HARD_SAVINGS' | 'COST_AVOIDANCE' | 'NO_VALUE_CAPTURED';

export interface NegotiationOutcomeInput {
  /** Caller-supplied identifier for this negotiated line item/round -- used for ledger traceability. */
  id: string;
  description: string;
  /**
   * The price/rate the comparison is measured against. Two real-world
   * cases, disambiguated by `wasBaselineAlreadyPaid`:
   *   - the price the client was ALREADY paying before this negotiation
   *     (wasBaselineAlreadyPaid: true) -- a reduction from this is a hard
   *     saving; or
   *   - a price/increase the supplier PROPOSED and the client negotiated
   *     down (wasBaselineAlreadyPaid: false) -- a reduction from this is
   *     cost avoidance, not a hard saving, because current spend did not
   *     go down.
   */
  baselinePrice: number;
  negotiatedPrice: number;
  /** Quantity or annualized spend basis used to convert the per-unit/per-period delta into an absolute value. */
  volumeOrSpend: number;
  wasBaselineAlreadyPaid: boolean;
  /** True when this value recurs every period (e.g. a per-unit price cut on an ongoing contract) rather than being a one-time event (e.g. a single rebate/credit). */
  recurring: boolean;
  /** Required to annualize a recurring value -- e.g. 12 for monthly, 4 for quarterly, 1 for annual. Never assumed by this module; annualizedValue stays null without it. */
  periodsPerYear?: number;
  /**
   * OPTIONAL. The value originally forecast/approved for this negotiation (e.g.
   * from a business case, budget line, or sourcing-event target) -- distinct
   * from `baselinePrice`, which is a price reference point, not a value target.
   * When supplied, this enables a forecast-vs-actual variance check (the
   * "leakage" governance discipline named tools like JAGGAER's Value Tracker
   * document -- see SI-06 doc's re-rating section for the sourced comparison).
   * Left undefined, the check is simply not run -- no forecast is assumed.
   */
  forecastValue?: number;
  /**
   * OPTIONAL. Overrides this module's own generic default materiality band
   * (+/-5%) for flagging a forecast-vs-actual divergence as worth reviewing.
   * Always disclosed via `varianceToleranceSource` on the result -- never a
   * silent default.
   */
  varianceToleranceOverridePct?: number;
}

/** Forecast-vs-actual "leakage" governance status -- NOT_ASSESSED when no forecastValue was supplied (never guessed). */
export type ValueRealizationVarianceStatus = 'ON_TRACK' | 'SHORTFALL' | 'EXCEEDED' | 'NOT_ASSESSED';

const DEFAULT_VALUE_VARIANCE_TOLERANCE_PCT = 5;

export interface NegotiationOutcome {
  id: string;
  description: string;
  valueType: ValueType;
  unitDelta: number;
  unitDeltaPct: number | null;
  /** Always >= 0. Zero when valueType is NO_VALUE_CAPTURED. */
  absoluteValue: number;
  recurring: boolean;
  /** absoluteValue * periodsPerYear, only when recurring AND periodsPerYear was supplied. Null otherwise -- never guessed. */
  annualizedValue: number | null;
  /** Echoes the caller-supplied forecast value, or null if none was supplied. */
  forecastValue: number | null;
  /** absoluteValue - forecastValue. Null when no forecastValue was supplied. */
  forecastVariance: number | null;
  /** Null when no forecastValue was supplied, or when forecastValue is 0 (percent undefined at that base). */
  forecastVariancePct: number | null;
  varianceStatus: ValueRealizationVarianceStatus;
  /** Null when varianceStatus is NOT_ASSESSED. */
  varianceToleranceAppliedPct: number | null;
  /** Null when varianceStatus is NOT_ASSESSED. */
  varianceToleranceSource: ThresholdSource | null;
  narrativeEn: string;
  narrativeAr: string;
}

/**
 * Classifies a single negotiated outcome into CIPS's hard-savings /
 * cost-avoidance distinction, with disclosed recurring-value annualization.
 * Never claims value was captured when the negotiated price did not
 * actually improve on the baseline.
 */
export function assessNegotiationOutcome(input: NegotiationOutcomeInput): NegotiationOutcome {
  const { id, description, baselinePrice, negotiatedPrice, volumeOrSpend, wasBaselineAlreadyPaid, recurring, periodsPerYear, forecastValue, varianceToleranceOverridePct } = input;
  const unitDelta = round2(baselinePrice - negotiatedPrice);
  const unitDeltaPct = baselinePrice === 0 ? null : round2((unitDelta / baselinePrice) * 100);

  /**
   * Forecast-vs-actual "leakage" check -- runs on absoluteValue regardless of
   * unitDelta's sign, so a NO_VALUE_CAPTURED result against a real forecast
   * still surfaces as a SHORTFALL (this is the case leakage-tracking exists
   * to catch, per the sourced comparison in the SI-06 doc). Computed once
   * here and applied to both return branches below.
   */
  function computeVariance(absoluteValueForVariance: number): {
    forecastVariance: number | null;
    forecastVariancePct: number | null;
    varianceStatus: ValueRealizationVarianceStatus;
    varianceToleranceAppliedPct: number | null;
    varianceToleranceSource: ThresholdSource | null;
    clauseEn: string;
    clauseAr: string;
  } {
    if (forecastValue === undefined) {
      return { forecastVariance: null, forecastVariancePct: null, varianceStatus: 'NOT_ASSESSED', varianceToleranceAppliedPct: null, varianceToleranceSource: null, clauseEn: '', clauseAr: '' };
    }
    const toleranceApplied = varianceToleranceOverridePct !== undefined ? varianceToleranceOverridePct : DEFAULT_VALUE_VARIANCE_TOLERANCE_PCT;
    const toleranceSource: ThresholdSource = varianceToleranceOverridePct !== undefined ? 'caller-override' : 'generic-default';
    const forecastVariance = round2(absoluteValueForVariance - forecastValue);

    if (forecastValue === 0) {
      const status: ValueRealizationVarianceStatus = absoluteValueForVariance > 0 ? 'EXCEEDED' : 'ON_TRACK';
      const clauseEn =
        status === 'EXCEEDED'
          ? ` No forecast value had been set for this item (0) -- the realized ${absoluteValueForVariance} is unplanned upside, not a shortfall.`
          : '';
      const clauseAr =
        status === 'EXCEEDED'
          ? ` لم يتم تحديد قيمة متوقعة (صفر) لهذا البند -- القيمة المحققة ${absoluteValueForVariance} تُعد فائضاً غير مخطط له، وليست عجزاً.`
          : '';
      return { forecastVariance, forecastVariancePct: null, varianceStatus: status, varianceToleranceAppliedPct: toleranceApplied, varianceToleranceSource: toleranceSource, clauseEn, clauseAr };
    }

    const forecastVariancePct = round2((forecastVariance / forecastValue) * 100);
    let status: ValueRealizationVarianceStatus;
    let clauseEn: string;
    let clauseAr: string;
    if (forecastVariancePct < -toleranceApplied) {
      status = 'SHORTFALL';
      clauseEn = ` Falls short of the forecast value (${forecastValue}) by ${Math.abs(forecastVariancePct)}% -- beyond the ${toleranceApplied}% tolerance band (${toleranceSource}), flagged for leakage review rather than assumed benign.`;
      clauseAr = ` يقل عن القيمة المتوقعة (${forecastValue}) بنسبة ${Math.abs(forecastVariancePct)}% -- وهو خارج نطاق التفاوت المسموح به (${toleranceApplied}%، ${toleranceSource === 'caller-override' ? 'حد مُدخل من المستخدم' : 'افتراض عام'})، ويُرصد كفجوة تحتاج مراجعة بدلاً من افتراضه غير ضار.`;
    } else if (forecastVariancePct > toleranceApplied) {
      status = 'EXCEEDED';
      clauseEn = ` Exceeds the forecast value (${forecastValue}) by ${forecastVariancePct}% -- beyond the ${toleranceApplied}% tolerance band (${toleranceSource}), worth confirming the original forecast wasn't understated rather than assuming pure upside.`;
      clauseAr = ` يتجاوز القيمة المتوقعة (${forecastValue}) بنسبة ${forecastVariancePct}% -- وهو خارج نطاق التفاوت المسموح به (${toleranceApplied}%، ${toleranceSource === 'caller-override' ? 'حد مُدخل من المستخدم' : 'افتراض عام'})، ويستحق التحقق من أن التوقّع الأصلي لم يكن أقل من الواقع بدلاً من افتراضه فائضاً بحتاً.`;
    } else {
      status = 'ON_TRACK';
      clauseEn = ` Tracking to the forecast value (${forecastValue}) within a ${toleranceApplied}% tolerance band -- no leakage flag.`;
      clauseAr = ` يتماشى مع القيمة المتوقعة (${forecastValue}) ضمن نطاق تفاوت ${toleranceApplied}% -- لا يوجد ما يستدعي رصد فجوة تسرّب.`;
    }
    return { forecastVariance, forecastVariancePct, varianceStatus: status, varianceToleranceAppliedPct: toleranceApplied, varianceToleranceSource: toleranceSource, clauseEn, clauseAr };
  }

  if (unitDelta <= 0) {
    const v = computeVariance(0);
    return {
      id,
      description,
      valueType: 'NO_VALUE_CAPTURED',
      unitDelta,
      unitDeltaPct,
      absoluteValue: 0,
      recurring,
      annualizedValue: null,
      forecastValue: forecastValue ?? null,
      forecastVariance: v.forecastVariance,
      forecastVariancePct: v.forecastVariancePct,
      varianceStatus: v.varianceStatus,
      varianceToleranceAppliedPct: v.varianceToleranceAppliedPct,
      varianceToleranceSource: v.varianceToleranceSource,
      narrativeEn: `[${description}] The negotiated price (${negotiatedPrice}) did not improve on the baseline (${baselinePrice}) -- no negotiated value to record here (a real, honest result, not padded).${v.clauseEn}`,
      narrativeAr: `[${description}] السعر المتفاوَض عليه (${negotiatedPrice}) لم يتحسّن مقارنةً بسعر الأساس (${baselinePrice}) -- لا توجد قيمة تفاوضية تُسجَّل هنا (نتيجة حقيقية وصريحة، غير مُبالَغ فيها).${v.clauseAr}`,
    };
  }

  const absoluteValue = round2(unitDelta * volumeOrSpend);
  const valueType: ValueType = wasBaselineAlreadyPaid ? 'HARD_SAVINGS' : 'COST_AVOIDANCE';
  const v = computeVariance(absoluteValue);

  let annualizedValue: number | null = null;
  let recurrenceEn = '';
  let recurrenceAr = '';
  if (recurring) {
    if (periodsPerYear !== undefined && periodsPerYear > 0) {
      annualizedValue = round2(absoluteValue * periodsPerYear);
      recurrenceEn = ` This value recurs each period -- annualized across ${periodsPerYear} period(s)/year, the projected run-rate value is approximately ${annualizedValue} (a projection based on current terms holding, not a guarantee).`;
      recurrenceAr = ` هذه القيمة متكررة كل دورة -- وبتحويلها إلى قيمة سنوية عبر ${periodsPerYear} دورة/سنة، تُقدَّر القيمة السنوية بنحو ${annualizedValue} (توقّع مبني على استمرار الشروط الحالية، وليس ضماناً).`;
    } else {
      recurrenceEn = ' This value is marked recurring, but no periods-per-year figure was supplied -- annualized value is not computed rather than guessed.';
      recurrenceAr = ' تم تصنيف هذه القيمة كمتكررة، لكن لم يتم توفير عدد الدورات في السنة -- لذلك لم يتم احتساب القيمة السنوية بدلاً من تخمينها.';
    }
  }

  const narrativeEn =
    valueType === 'HARD_SAVINGS'
      ? `[${description}] Hard saving: negotiated price reduced from ${baselinePrice} (what the client was already paying) to ${negotiatedPrice} -- a real reduction in current spend of approximately ${absoluteValue} across the stated volume/spend basis. Finance-recognized (CIPS "hard savings").${recurrenceEn}${v.clauseEn}`
      : `[${description}] Cost avoidance: the supplier's proposed price/increase of ${baselinePrice} was negotiated down to ${negotiatedPrice} -- approximately ${absoluteValue} of value delivered across the stated volume/spend basis, but current spend did NOT decrease (a "soft saving" per CIPS's definition -- real value, harder to defend on a P&L than a hard saving, and never presented as one).${recurrenceEn}${v.clauseEn}`;
  const narrativeAr =
    valueType === 'HARD_SAVINGS'
      ? `[${description}] توفير فعلي (Hard Saving): انخفض السعر المتفاوَض عليه من ${baselinePrice} (ما كان العميل يدفعه فعلاً) إلى ${negotiatedPrice} -- انخفاض حقيقي في الإنفاق الحالي بقيمة تقارب ${absoluteValue} عبر أساس الحجم/الإنفاق المذكور. مُعترَف به مالياً (تعريف CIPS لـ"التوفير الفعلي").${recurrenceAr}${v.clauseAr}`
      : `[${description}] تجنّب تكلفة (Cost Avoidance): تم التفاوض على تخفيض السعر/الزيادة المقترحة من المورّد (${baselinePrice}) إلى (${negotiatedPrice}) -- بقيمة تقارب ${absoluteValue} عبر أساس الحجم/الإنفاق المذكور، إلا أن الإنفاق الحالي لم ينخفض فعلياً (توفير غير مباشر بحسب تعريف CIPS -- قيمة حقيقية، يصعب إثباتها في القوائم المالية مقارنة بالتوفير الفعلي، ولا تُعرض أبداً كأنها توفير فعلي).${recurrenceAr}${v.clauseAr}`;

  return {
    id,
    description,
    valueType,
    unitDelta,
    unitDeltaPct,
    absoluteValue,
    recurring,
    annualizedValue,
    forecastValue: forecastValue ?? null,
    forecastVariance: v.forecastVariance,
    forecastVariancePct: v.forecastVariancePct,
    varianceStatus: v.varianceStatus,
    varianceToleranceAppliedPct: v.varianceToleranceAppliedPct,
    varianceToleranceSource: v.varianceToleranceSource,
    narrativeEn,
    narrativeAr,
  };
}

export interface NegotiationValueLedgerSummary {
  recordCount: number;
  hardSavingsCount: number;
  costAvoidanceCount: number;
  noValueCapturedCount: number;
  totalHardSavings: number;
  totalCostAvoidance: number;
  /** Hard savings + cost avoidance -- always disclosed as a combined figure, never presented as pure "savings." */
  totalCombinedValue: number;
  totalAnnualizedValue: number;
  /**
   * Portfolio-level forecast-vs-actual "leakage" early-warning counts -- only
   * counts records where a forecastValue was actually supplied (see
   * `assessNegotiationOutcome`'s `varianceStatus`). Records with
   * varianceStatus NOT_ASSESSED (no forecast supplied) are excluded from all
   * four counts below, not silently folded into onTrack.
   */
  onTrackCount: number;
  shortfallCount: number;
  exceededCount: number;
  notAssessedCount: number;
  narrativeEn: string;
  narrativeAr: string;
}

/**
 * Rolls up a history of recorded negotiation outcomes for a supplier (or a
 * portfolio) into a real value ledger -- the aggregate view CIPS/ISM-style
 * procurement-value reporting is judged on, never collapsing the hard-
 * savings/cost-avoidance distinction even in the rollup. Also rolls up
 * forecast-vs-actual "leakage" status across the portfolio (see
 * `assessNegotiationOutcome`'s `varianceStatus`) so a shortfall pattern
 * across many records surfaces here rather than only per-record.
 */
export function buildNegotiationValueLedger(outcomes: NegotiationOutcome[]): NegotiationValueLedgerSummary {
  const hardSavings = outcomes.filter((o) => o.valueType === 'HARD_SAVINGS');
  const costAvoidance = outcomes.filter((o) => o.valueType === 'COST_AVOIDANCE');
  const noValue = outcomes.filter((o) => o.valueType === 'NO_VALUE_CAPTURED');
  const totalHardSavings = round2(hardSavings.reduce((s, o) => s + o.absoluteValue, 0));
  const totalCostAvoidance = round2(costAvoidance.reduce((s, o) => s + o.absoluteValue, 0));
  const totalCombinedValue = round2(totalHardSavings + totalCostAvoidance);
  const totalAnnualizedValue = round2(outcomes.reduce((s, o) => s + (o.annualizedValue ?? 0), 0));
  const onTrackCount = outcomes.filter((o) => o.varianceStatus === 'ON_TRACK').length;
  const shortfallCount = outcomes.filter((o) => o.varianceStatus === 'SHORTFALL').length;
  const exceededCount = outcomes.filter((o) => o.varianceStatus === 'EXCEEDED').length;
  const notAssessedCount = outcomes.filter((o) => o.varianceStatus === 'NOT_ASSESSED').length;
  const assessedCount = onTrackCount + shortfallCount + exceededCount;

  const leakageClauseEn = assessedCount === 0 ? '' : ` Forecast-vs-actual tracking (${assessedCount} record(s) with a forecast on file): ${onTrackCount} on track, ${shortfallCount} shortfall(s) flagged for leakage review, ${exceededCount} exceeding forecast${notAssessedCount > 0 ? `; ${notAssessedCount} record(s) had no forecast supplied and are excluded from this check` : ''}.`;
  const leakageClauseAr = assessedCount === 0 ? '' : ` تتبّع التوقّع مقابل الفعلي (${assessedCount} سجل/سجلات لديها قيمة متوقعة مُسجَّلة): ${onTrackCount} ضمن المسار المتوقع، ${shortfallCount} حالة/حالات عجز تحتاج مراجعة كفجوة تسرّب، و${exceededCount} حالة/حالات تتجاوز التوقّع${notAssessedCount > 0 ? `؛ ${notAssessedCount} سجل/سجلات لم تُزوَّد بقيمة متوقعة واستُثنيت من هذا الفحص` : ''}.`;

  const narrativeEn =
    outcomes.length === 0
      ? 'No negotiation outcomes recorded yet for this ledger.'
      : `${outcomes.length} negotiation outcome(s) recorded: ${hardSavings.length} hard saving(s) totaling ${totalHardSavings}, ${costAvoidance.length} cost-avoidance record(s) totaling ${totalCostAvoidance} (kept separate per CIPS -- never combined into an undifferentiated "savings" figure), and ${noValue.length} record(s) with no value captured. Combined negotiated value (hard + avoidance): ${totalCombinedValue}${totalAnnualizedValue > 0 ? `; projected annualized run-rate value: ${totalAnnualizedValue}` : ''}.${leakageClauseEn}`;
  const narrativeAr =
    outcomes.length === 0
      ? 'لم يتم تسجيل أي نتائج تفاوض بعد في هذا السجل.'
      : `تم تسجيل ${outcomes.length} نتيجة/نتائج تفاوض: ${hardSavings.length} توفيراً فعلياً بإجمالي ${totalHardSavings}، و${costAvoidance.length} سجل/سجلات تجنّب تكلفة بإجمالي ${totalCostAvoidance} (تُحفظ منفصلة وفق تعريف CIPS -- ولا تُدمج أبداً في رقم "توفير" واحد غير مُميَّز)، و${noValue.length} سجل/سجلات دون قيمة مُحقَّقة. إجمالي القيمة التفاوضية المجمّعة (الفعلي + التجنّب): ${totalCombinedValue}${totalAnnualizedValue > 0 ? `؛ القيمة السنوية المُتوقعة (run-rate): ${totalAnnualizedValue}` : ''}.${leakageClauseAr}`;

  return {
    recordCount: outcomes.length,
    hardSavingsCount: hardSavings.length,
    costAvoidanceCount: costAvoidance.length,
    noValueCapturedCount: noValue.length,
    totalHardSavings,
    totalCostAvoidance,
    totalCombinedValue,
    totalAnnualizedValue,
    onTrackCount,
    shortfallCount,
    exceededCount,
    notAssessedCount,
    narrativeEn,
    narrativeAr,
  };
}

export interface PaymentTermsValueInput {
  baselineDays: number;
  negotiatedDays: number;
  annualSpend: number;
  /** The client's own annualized cost of capital / short-term borrowing rate, as a percent. Never assumed by this module -- a required input. */
  costOfCapitalPctAnnual: number;
}

export interface PaymentTermsValue {
  /** negotiatedDays - baselineDays. Positive = extended terms (favorable to the buyer's cash flow). */
  daysDelta: number;
  /** Monetized annual value (or cost, if negative) of the payment-terms change, using the standard treasury working-capital financing-value formula: (daysDelta / 365) * annualSpend * costOfCapitalPctAnnual. */
  annualFinancingValue: number;
  narrativeEn: string;
  narrativeAr: string;
}

/**
 * Monetizes a payment-terms (DPO) negotiation using the standard
 * treasury/procurement working-capital financing-value calculation. This
 * is a DISTINCT value category from price reduction or cost avoidance --
 * it does not reduce spend, it reduces the cost of financing that spend --
 * and must never be folded into a savings/avoidance ledger figure. The
 * cost-of-capital rate is always the client's own supplied figure; this
 * module never assumes or fabricates one (Decision Record 8.7). Related,
 * but standalone from, the platform's existing Working Capital Control
 * Tower (#169) -- a reference concept, not a hard runtime dependency.
 */
export function assessPaymentTermsValue(input: PaymentTermsValueInput): PaymentTermsValue {
  const { baselineDays, negotiatedDays, annualSpend, costOfCapitalPctAnnual } = input;
  const daysDelta = negotiatedDays - baselineDays;
  const annualFinancingValue = round2((daysDelta / 365) * annualSpend * (costOfCapitalPctAnnual / 100));

  const narrativeEn =
    daysDelta > 0
      ? `Payment terms extended from ${baselineDays} to ${negotiatedDays} days -- using the client-supplied cost of capital (${costOfCapitalPctAnnual}%/year) and annual spend (${annualSpend}), the freed-up working capital is worth an estimated ${annualFinancingValue} per year. This is a working-capital/financing value, distinct from hard savings or cost avoidance -- it reduces the cost of financing this spend, not the spend itself.`
      : daysDelta < 0
        ? `Payment terms tightened from ${baselineDays} to ${negotiatedDays} days -- a working-capital COST to the client (not a saving) of an estimated ${Math.abs(annualFinancingValue)} per year at the supplied cost of capital.`
        : `Payment terms unchanged (${baselineDays} days) -- no working-capital value or cost from this dimension.`;
  const narrativeAr =
    daysDelta > 0
      ? `تم تمديد شروط الدفع من ${baselineDays} إلى ${negotiatedDays} يوماً -- وباستخدام تكلفة رأس المال التي أدخلها العميل (${costOfCapitalPctAnnual}% سنوياً) والإنفاق السنوي (${annualSpend})، تُقدَّر قيمة رأس المال العامل المُحرَّر بنحو ${annualFinancingValue} سنوياً. هذه قيمة تمويلية/رأسمالية عاملة، مختلفة عن التوفير الفعلي أو تجنّب التكلفة -- فهي تخفّض تكلفة تمويل هذا الإنفاق وليس الإنفاق نفسه.`
      : daysDelta < 0
        ? `تم تقليص شروط الدفع من ${baselineDays} إلى ${negotiatedDays} يوماً -- وهذه تكلفة على رأس المال العامل للعميل (وليست توفيراً) تُقدَّر بنحو ${Math.abs(annualFinancingValue)} سنوياً وفق تكلفة رأس المال المُدخلة.`
        : `شروط الدفع لم تتغيّر (${baselineDays} يوماً) -- لا توجد قيمة أو تكلفة رأسمالية عاملة من هذا البُعد.`;

  return { daysDelta, annualFinancingValue, narrativeEn, narrativeAr };
}

// ---------------------------------------------------------------------------
// 9. Rebate-Tier Positioning & Volume Consolidation
//    (EXPERTISE-VIEWPOINT ENHANCEMENT item 3)
// ---------------------------------------------------------------------------
// Source: standard volume-rebate-agreement mechanics -- tiered thresholds
// where crossing a volume/spend threshold unlocks a higher rebate
// percentage, conventionally applied RETROACTIVELY across the qualifying
// volume once verified (the buyer pays invoice price throughout the period;
// the rebate is issued after the threshold is confirmed). Tier thresholds
// and rates are always caller-supplied (the client's actual contract terms)
// -- never invented. Built as a full segment: the complete tier ladder
// (every rung, tagged achieved/current/next/future), progress and
// time-to-next-tier projections, AND a volume-consolidation-opportunity
// analysis -- operationalizing Kraljic's own Leverage-quadrant
// prescription of aggregating fragmented volume across business units to
// unlock a better tier.

export interface RebateTier {
  /** Minimum cumulative volume/spend required to qualify for this tier. */
  thresholdVolume: number;
  /** Rebate percentage applied retroactively across the qualifying volume once this tier is reached. */
  rebatePct: number;
  label?: string;
}

export type RebateTierStatus = 'achieved' | 'current' | 'next' | 'future';

export interface RebateTierLadderEntry {
  tier: RebateTier;
  status: RebateTierStatus;
  /** Rebate value if volume exactly equals this tier's threshold, when a per-unit value is supplied. A reference point for comparing rungs, not the client's actual current value (see rebateValueAtCurrentTier for that). */
  rebateValueAtThreshold: number | null;
}

export interface RebateTierPosition {
  currentVolume: number;
  /** The full tier ladder, ascending, every rung tagged with its status relative to currentVolume. */
  ladder: RebateTierLadderEntry[];
  currentTier: RebateTier | null;
  nextTier: RebateTier | null;
  volumeToNextTier: number | null;
  /** currentVolume / nextTier.thresholdVolume * 100 -- a quick visual progress indicator. Null when already at/above the top tier. */
  progressToNextTierPct: number | null;
  /** Based on the client's ACTUAL current volume at the current tier's rate -- the accurate current rebate value (distinct from the ladder's threshold-based reference points). */
  rebateValueAtCurrentTier: number | null;
  rebateValueIfNextTierReached: number | null;
  incrementalValueOfNextTier: number | null;
  /** Only populated when a runRatePerPeriod is supplied -- a disclosed projection, not a guarantee, of how many periods until the next tier at the current pace. */
  estimatedPeriodsToNextTier: number | null;
  narrativeEn: string;
  narrativeAr: string;
}

/**
 * Reports the client's FULL tier ladder position -- every rung tagged
 * achieved/current/next/future -- plus (when a per-unit value is supplied)
 * the retroactive rebate-value swing of reaching the next tier, and (when a
 * run-rate is supplied) a projected time-to-next-tier.
 */
export function assessRebateTierPosition(
  tiers: RebateTier[],
  currentVolume: number,
  opts: { unitValue?: number; runRatePerPeriod?: number } = {},
): RebateTierPosition {
  if (tiers.length === 0) {
    return {
      currentVolume,
      ladder: [],
      currentTier: null,
      nextTier: null,
      volumeToNextTier: null,
      progressToNextTierPct: null,
      rebateValueAtCurrentTier: null,
      rebateValueIfNextTierReached: null,
      incrementalValueOfNextTier: null,
      estimatedPeriodsToNextTier: null,
      narrativeEn: 'No rebate-tier structure has been supplied for this supplier -- nothing to position against.',
      narrativeAr: 'لم يتم توفير هيكل شرائح خصم/استرداد (rebate tiers) لهذا المورّد -- لا يوجد ما يمكن قياس الموقع الحالي بالنسبة له.',
    };
  }

  const sorted = [...tiers].sort((a, b) => a.thresholdVolume - b.thresholdVolume);
  const currentTierIdx = (() => {
    let idx = -1;
    for (let i = 0; i < sorted.length; i++) if (sorted[i].thresholdVolume <= currentVolume) idx = i;
    return idx;
  })();
  const currentTier = currentTierIdx >= 0 ? sorted[currentTierIdx] : null;
  const nextTier = sorted[currentTierIdx + 1] ?? null;
  const volumeToNextTier = nextTier ? round2(nextTier.thresholdVolume - currentVolume) : null;
  const progressToNextTierPct = nextTier ? round2((currentVolume / nextTier.thresholdVolume) * 100) : null;

  const unitValue = opts.unitValue;
  const ladder: RebateTierLadderEntry[] = sorted.map((t, i) => ({
    tier: t,
    status: i < currentTierIdx ? 'achieved' : i === currentTierIdx ? 'current' : i === currentTierIdx + 1 ? 'next' : 'future',
    rebateValueAtThreshold: unitValue !== undefined ? round2(t.thresholdVolume * unitValue * (t.rebatePct / 100)) : null,
  }));

  const rebateValueAtCurrentTier = unitValue !== undefined && currentTier ? round2(currentVolume * unitValue * (currentTier.rebatePct / 100)) : null;
  const rebateValueIfNextTierReached = unitValue !== undefined && nextTier ? round2(nextTier.thresholdVolume * unitValue * (nextTier.rebatePct / 100)) : null;
  const incrementalValueOfNextTier = rebateValueIfNextTierReached !== null ? round2(rebateValueIfNextTierReached - (rebateValueAtCurrentTier ?? 0)) : null;
  const estimatedPeriodsToNextTier =
    opts.runRatePerPeriod !== undefined && opts.runRatePerPeriod > 0 && volumeToNextTier !== null ? Math.ceil(volumeToNextTier / opts.runRatePerPeriod) : null;

  let narrativeEn: string;
  let narrativeAr: string;
  const rungsRemaining = sorted.length - (currentTierIdx + 1);
  if (!nextTier) {
    narrativeEn = currentTier
      ? `Already at the top rebate tier (${currentTier.label ?? `${currentTier.rebatePct}%`}) of ${sorted.length} total tier(s) at the current volume of ${currentVolume} -- no further volume-driven rebate upside available under this structure.`
      : `Current volume (${currentVolume}) does not qualify for any of the ${sorted.length} supplied rebate tier(s).`;
    narrativeAr = currentTier
      ? `تم بالفعل الوصول إلى أعلى شريحة استرداد (${currentTier.label ?? `${currentTier.rebatePct}%`}) من أصل ${sorted.length} شريحة عند الحجم الحالي البالغ ${currentVolume} -- لا توجد فرصة إضافية لزيادة الاسترداد مرتبطة بالحجم ضمن هذا الهيكل.`
      : `الحجم الحالي (${currentVolume}) لا يؤهل لأي من الشرائح الـ${sorted.length} المُدخلة.`;
  } else {
    const valueClauseEn = incrementalValueOfNextTier !== null ? ` Reaching it (retroactively applied across ${nextTier.thresholdVolume} units) is worth an estimated ${incrementalValueOfNextTier} in additional rebate value over the current tier -- disclosed as an estimate (caller-supplied unit value), not an observed figure.` : '';
    const valueClauseAr = incrementalValueOfNextTier !== null ? ` والوصول إليها (مُطبَّقة بأثر رجعي على ${nextTier.thresholdVolume} وحدة) يُقدَّر بقيمة استرداد إضافية تبلغ ${incrementalValueOfNextTier} مقارنةً بالشريحة الحالية -- رقم مُقدَّر (بناءً على قيمة الوحدة المُدخلة) وليس رقماً مُلاحَظاً فعلياً.` : '';
    const periodsClauseEn = estimatedPeriodsToNextTier !== null ? ` At the supplied run-rate, this is projected to take approximately ${estimatedPeriodsToNextTier} period(s) -- a projection, not a guarantee.` : '';
    const periodsClauseAr = estimatedPeriodsToNextTier !== null ? ` وبمعدل الاستهلاك المُدخل، يُتوقَّع أن يستغرق ذلك نحو ${estimatedPeriodsToNextTier} دورة/دورات -- وهذا توقّع وليس ضماناً.` : '';
    narrativeEn = `Currently at rung ${currentTierIdx + 1} of ${sorted.length} (${progressToNextTierPct}% of the way to the next tier), ${volumeToNextTier} units/spend short of ${nextTier.label ?? `${nextTier.rebatePct}%`} at ${nextTier.thresholdVolume} -- ${rungsRemaining} rung(s) remain above it.${valueClauseEn}${periodsClauseEn}`;
    narrativeAr = `الموقع الحالي عند الشريحة ${currentTierIdx + 1} من أصل ${sorted.length} (${progressToNextTierPct}% من المسافة نحو الشريحة التالية)، ويفصله ${volumeToNextTier} وحدة/إنفاق عن شريحة ${nextTier.label ?? `${nextTier.rebatePct}%`} عند ${nextTier.thresholdVolume} -- وتبقى ${rungsRemaining} شريحة/شرائح أعلى منها.${valueClauseAr}${periodsClauseAr}`;
  }

  return { currentVolume, ladder, currentTier, nextTier, volumeToNextTier, progressToNextTierPct, rebateValueAtCurrentTier, rebateValueIfNextTierReached, incrementalValueOfNextTier, estimatedPeriodsToNextTier, narrativeEn, narrativeAr };
}

export interface VolumeConsolidationEntityInput {
  /** e.g. a business unit, region, or legal entity currently buying from this supplier separately. */
  entityLabel: string;
  currentVolume: number;
}

export interface VolumeConsolidationEntityResult {
  entityLabel: string;
  currentVolume: number;
  tierAlone: RebateTier | null;
}

export interface VolumeConsolidationOpportunity {
  entities: VolumeConsolidationEntityResult[];
  consolidatedVolume: number;
  tierConsolidated: RebateTier | null;
  /** Sum of each entity's own rebate value at its own tier and volume, when a per-unit value is supplied. */
  valueAtCurrentFragmentedTiers: number | null;
  /** Rebate value if the full consolidated volume qualified at the consolidated tier, when a per-unit value is supplied. */
  valueAtConsolidatedTier: number | null;
  valueUpliftFromConsolidation: number | null;
  narrativeEn: string;
  narrativeAr: string;
}

/**
 * Operationalizes Kraljic's Leverage-quadrant "aggregate volume" tactic:
 * given the SAME supplier's tier structure and each business unit/entity's
 * OWN current volume, computes what tier they qualify for individually vs.
 * what they would collectively unlock if their volume were consolidated
 * under one negotiated agreement -- a real, sourced, high-value commercial-
 * intelligence finding this module previously had no way to surface. This
 * is a structural/organizational finding (executing it may require
 * internal coordination across business units), not a supplier-facing
 * claim -- disclosed as such in the narrative.
 */
export function assessVolumeConsolidationOpportunity(
  tiers: RebateTier[],
  entities: VolumeConsolidationEntityInput[],
  opts: { unitValue?: number } = {},
): VolumeConsolidationOpportunity {
  if (tiers.length === 0 || entities.length === 0) {
    return {
      entities: [],
      consolidatedVolume: 0,
      tierConsolidated: null,
      valueAtCurrentFragmentedTiers: null,
      valueAtConsolidatedTier: null,
      valueUpliftFromConsolidation: null,
      narrativeEn: 'Volume-consolidation opportunity cannot be assessed -- either no rebate-tier structure or no per-entity volume breakdown was supplied.',
      narrativeAr: 'لا يمكن تقييم فرصة توحيد الحجم -- لم يتم توفير هيكل شرائح الاسترداد أو تفصيل الحجم لكل جهة/وحدة.',
    };
  }

  const sorted = [...tiers].sort((a, b) => a.thresholdVolume - b.thresholdVolume);
  const tierFor = (vol: number): RebateTier | null => {
    let found: RebateTier | null = null;
    for (const t of sorted) if (t.thresholdVolume <= vol) found = t;
    return found;
  };

  const entityResults: VolumeConsolidationEntityResult[] = entities.map((e) => ({ entityLabel: e.entityLabel, currentVolume: e.currentVolume, tierAlone: tierFor(e.currentVolume) }));
  const consolidatedVolume = round2(entities.reduce((s, e) => s + e.currentVolume, 0));
  const tierConsolidated = tierFor(consolidatedVolume);

  const unitValue = opts.unitValue;
  const valueAtCurrentFragmentedTiers =
    unitValue !== undefined ? round2(entityResults.reduce((s, e) => s + (e.tierAlone ? e.currentVolume * unitValue * (e.tierAlone.rebatePct / 100) : 0), 0)) : null;
  const valueAtConsolidatedTier = unitValue !== undefined ? round2(tierConsolidated ? consolidatedVolume * unitValue * (tierConsolidated.rebatePct / 100) : 0) : null;
  const valueUpliftFromConsolidation =
    valueAtConsolidatedTier !== null && valueAtCurrentFragmentedTiers !== null ? round2(valueAtConsolidatedTier - valueAtCurrentFragmentedTiers) : null;

  const fragmentedCount = entityResults.filter((e) => e.tierAlone !== tierConsolidated).length;
  const upliftClauseEn = valueUpliftFromConsolidation !== null ? ` Consolidating unlocks an estimated additional ${valueUpliftFromConsolidation} in rebate value (caller-supplied unit value) versus each entity negotiating separately.` : '';
  const upliftClauseAr = valueUpliftFromConsolidation !== null ? ` يؤدي التوحيد إلى فتح قيمة استرداد إضافية تُقدَّر بـ ${valueUpliftFromConsolidation} (بناءً على قيمة الوحدة المُدخلة) مقارنةً بتفاوض كل جهة بشكل منفصل.` : '';
  const narrativeEn =
    fragmentedCount === 0
      ? `All ${entities.length} entities already sit at the same tier as the consolidated volume would reach -- no structural consolidation upside from this tier structure today.`
      : `${entities.length} entities are currently buying separately from this supplier (combined volume ${consolidatedVolume}); ${fragmentedCount} of them sit at a lower tier than the consolidated volume would reach (${tierConsolidated ? tierConsolidated.label ?? `${tierConsolidated.rebatePct}%` : 'no tier'}).${upliftClauseEn} This is a structural/organizational finding -- executing it requires internal coordination to negotiate as one buyer, not a claim about what the supplier has already agreed to.`;
  const narrativeAr =
    fragmentedCount === 0
      ? `جميع الجهات الـ${entities.length} تقع بالفعل ضمن نفس الشريحة التي سيصل إليها الحجم الموحّد -- لا توجد فرصة توحيد بنيوية إضافية من هذا الهيكل حالياً.`
      : `تشتري ${entities.length} جهة حالياً من هذا المورّد بشكل منفصل (الحجم المجمّع ${consolidatedVolume})؛ ${fragmentedCount} منها تقع عند شريحة أقل مما سيصل إليه الحجم الموحّد (${tierConsolidated ? tierConsolidated.label ?? `${tierConsolidated.rebatePct}%` : 'لا توجد شريحة'}).${upliftClauseAr} هذه نتيجة بنيوية/تنظيمية -- تنفيذها يتطلب تنسيقاً داخلياً للتفاوض كمشترٍ واحد، وليست ادعاءً بأن المورّد وافق على ذلك بالفعل.`;

  return { entities: entityResults, consolidatedVolume, tierConsolidated, valueAtCurrentFragmentedTiers, valueAtConsolidatedTier, valueUpliftFromConsolidation, narrativeEn, narrativeAr };
}

// ---------------------------------------------------------------------------
// 10. Negotiation Brief orchestration (SI-06 output schema)
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
  /**
   * EXPERTISE-VIEWPOINT ENHANCEMENT fields (9 Sep 2026). Deliberately
   * OPTIONAL, unlike the core fields above -- these are genuinely new,
   * additive capabilities, and requiring every existing/future caller to
   * explicitly pass null for all of them would be a regression against
   * "easy to use." Undefined is treated identically to null/[] inside
   * buildNegotiationBrief -- never silently dropped, always defaulted
   * explicitly in code, never left ambiguous.
   */
  shouldCostGap?: ShouldCostGap | null;
  /** Caller supplies each outcome via `assessNegotiationOutcome()` first; the brief rolls the list up into `negotiationValueLedger` automatically -- real math this module computes, consistent with `nextMove`/`unsupportedCostDriverCount`. */
  negotiationValueHistory?: NegotiationOutcome[];
  rebateTierPosition?: RebateTierPosition | null;
  volumeConsolidationOpportunity?: VolumeConsolidationOpportunity | null;
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
  shouldCostGap: ShouldCostGap | null;
  negotiationValueHistory: NegotiationOutcome[];
  negotiationValueLedger: NegotiationValueLedgerSummary;
  rebateTierPosition: RebateTierPosition | null;
  volumeConsolidationOpportunity: VolumeConsolidationOpportunity | null;
}

/**
 * Pure orchestration -- every field on the output is either a value this
 * module itself computed (priceTrajectory, costDriverJustifications,
 * negotiationLeverage, nextMove, shouldCostGap, negotiationValueLedger,
 * rebateTierPosition, volumeConsolidationOpportunity) or a straight
 * pass-through of a value the CALLER already computed elsewhere
 * (relationshipCompatibility, negotiationStrategy, negotiationPlan,
 * tcoReferenceId, contractEntitlementId, negotiationValueHistory itself).
 * This function never calls into Module 02, 05, the TCO Engine, or
 * Contract Intelligence itself.
 */
export function buildNegotiationBrief(input: NegotiationBriefInput): NegotiationBrief {
  const nextMove = recommendNextMove(input.negotiationRoundHistory);
  const unsupportedCostDriverCount = input.costDriverJustifications.filter((j) => j.supported === false).length;
  const negotiationValueHistory = input.negotiationValueHistory ?? [];
  const negotiationValueLedger = buildNegotiationValueLedger(negotiationValueHistory);

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
    shouldCostGap: input.shouldCostGap ?? null,
    negotiationValueHistory,
    negotiationValueLedger,
    rebateTierPosition: input.rebateTierPosition ?? null,
    volumeConsolidationOpportunity: input.volumeConsolidationOpportunity ?? null,
  };
}

// ---------------------------------------------------------------------------
// 11. Bilingual narrative (Module 09 consultancy framing)
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
  for (const j of brief.costDriverJustifications) {
    if (j.suggestIndexLinkedClause) {
      lines.push(isAr ? j.indexLinkedClauseNoteAr! : j.indexLinkedClauseNoteEn!);
    }
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

  if (brief.shouldCostGap && brief.shouldCostGap.severity !== 'INSUFFICIENT_DATA') {
    lines.push(isAr ? brief.shouldCostGap.narrativeAr : brief.shouldCostGap.narrativeEn);
  }

  if (brief.negotiationValueLedger.recordCount > 0) {
    lines.push(isAr ? brief.negotiationValueLedger.narrativeAr : brief.negotiationValueLedger.narrativeEn);
  }

  if (brief.rebateTierPosition) {
    lines.push(isAr ? brief.rebateTierPosition.narrativeAr : brief.rebateTierPosition.narrativeEn);
  }

  if (brief.volumeConsolidationOpportunity) {
    lines.push(isAr ? brief.volumeConsolidationOpportunity.narrativeAr : brief.volumeConsolidationOpportunity.narrativeEn);
  }

  lines.push(isAr ? brief.nextMove.rationaleAr : brief.nextMove.rationaleEn);

  return lines.join('\n');
}
