/**
 * Supplier Intelligence Module 02 — Kraljic Positioning & Sourcing Strategy
 * (SI-02, 8 Sep 2026).
 *
 * Pure functions, no side effects -- same pattern as Module 01. Fully
 * absorbs and extends #372 (supplier-discovery.md, Decision Record 8.8).
 *
 * Reuses, never rebuilds, two real shipped engines:
 * - `kraljicScoring.ts`'s `scoreItems()` -- the live Kraljic (1983)
 *   two-axis classification already used by KraljicMatrix.tsx, with real
 *   industry-specific thresholds (CIPS Category Management Toolkit / ISM
 *   Practitioner Standards / ISC GCC practice data). This module calls that
 *   function directly (`classifyKraljicPosition`) rather than re-deriving
 *   quadrant math a second way.
 * - `decisionLab.ts`'s `scoreOptions()` -- once a client enters real
 *   candidate suppliers as options against weighted criteria, ranking them
 *   is the exact same weighted-decision math Decision Lab already does for
 *   any scenario comparison. `rankCandidateSuppliers()` below is an
 *   explicit passthrough, not a second scoring engine.
 *
 * This module is NOT a supplier database or discovery engine -- it helps a
 * client structure a sourcing decision and evaluate candidates they already
 * found elsewhere, per SI-02.md and Decision Record 8.7 (no fabricated
 * supplier data).
 *
 * Local content: Module 08's own status is that only Saudi LCGPA is
 * real/researched (#373/#374); every other GCC market is an honest,
 * disclosed gap, not assumed equivalent. `checkLocalContentRelevance()`
 * reflects that truthfully rather than guessing at a foreign ICV regime
 * this platform has not researched.
 */

import { scoreItems, ACTION_PLANS, QUADRANT_META, type KraljicItem, type KraljicScored, type KraljicQuadrant } from '@/lib/kraljicScoring';
import { scoreOptions, type DecisionScenario, type ScoredOption } from '@/lib/decisionLab';
import {
  buildNegotiationTeam,
  recommendClientTactics,
  recommendNegotiationLevels,
  recommendWatchForTactics,
  type NegotiationLevel,
  type NegotiationRole,
  type NamedNegotiationTactic,
} from '@/lib/negotiationTactics';

export interface EvaluationCriterionSuggestion {
  criterion: string;
  /** 1-10, same weight scale as decisionLab.ts's DecisionCriterion, so a
   *  client can carry these straight into a Decision Lab scenario. */
  suggestedWeight: number;
  rationale: string;
}

export interface RfpSection {
  section: string;
  guidance: string;
}

export type SolutionTimeframe = 'same day' | 'this week' | '2-4 weeks' | 'quarter+';
export type SolutionEffort = 'Low' | 'Medium' | 'High';

export interface SolutionAction {
  action: string;
  timeframe: SolutionTimeframe;
  effort: SolutionEffort;
}

export interface LocalContentFlag {
  relevant: boolean;
  note: string;
}

export interface SourcingStrategyOutput {
  sourcingBrief: string;
  kraljicQuadrant: KraljicQuadrant;
  evaluationCriteria: EvaluationCriterionSuggestion[];
  localContentRelevant: boolean;
  localContentNote: string;
  rfpStructureDraft: RfpSection[];
  solutionSet: SolutionAction[];
  relationshipCompatibility: RelationshipCompatibility | null;
  negotiationStrategy: NegotiationStrategy;
  /** Full negotiation plan document -- team roles, a multi-level structure
   *  for complex Strategic/Bottleneck cases, client-usable tactics, and a
   *  counterpart watch-list -- built directly from negotiationTactics.ts,
   *  never a second, contradictory tactics source. */
  negotiationPlan: NegotiationPlanDocument;
  evidenceSummary: { dataUsed: string[]; assumptions: string[]; confidence: number };
}

/** Direct passthrough to the live Kraljic engine -- classification math is
 *  never re-derived here. */
/**
 * Direct passthrough to the live Kraljic engine -- classification math is
 * never re-derived here.
 *
 * `portfolioContext` matters more than it looks: `scoreItems()` computes
 * profit-impact partly from this item's spend as a percentage of the total
 * spend across every item passed to it. Classify a single item alone and it
 * is 100% of "the portfolio" by construction, which inflates its
 * profit-impact score regardless of how large the item actually is in the
 * client's real spend. Passing the client's other real portfolio items
 * (even a partial list) gives a meaningful percentage; passing none is a
 * disclosed limitation, not a silent one -- see `assessSourcingConfidence`.
 */
export function classifyKraljicPosition(item: KraljicItem, portfolioContext: KraljicItem[], industryKey: string | null): KraljicScored {
  const fullList = portfolioContext.some(i => i.id === item.id) ? portfolioContext : [...portfolioContext, item];
  const scored = scoreItems(fullList, industryKey);
  return scored.find(s => s.id === item.id)!;
}

/**
 * Generic, ISM/CIPS-grounded evaluation-criteria libraries per quadrant.
 * Real category-specific weights remain OWNER INPUT NEEDED (SI-02.md item 1)
 * -- these are the standard, textbook Kraljic-strategy starting weights any
 * trained category manager would recognize, not a fabricated benchmark.
 */
const QUADRANT_CRITERIA: Record<KraljicQuadrant, EvaluationCriterionSuggestion[]> = {
  strategic: [
    { criterion: 'Technical/quality capability', suggestedWeight: 9, rationale: 'A Strategic-quadrant failure is high-impact and hard to replace -- capability must be verified, not assumed.' },
    { criterion: 'Long-term collaboration & innovation fit', suggestedWeight: 8, rationale: 'Strategic suppliers are managed as partners, not transactions -- willingness to co-invest matters as much as current price.' },
    { criterion: 'Financial stability', suggestedWeight: 7, rationale: 'Losing a Strategic supplier to insolvency is a high-consequence event; their financial health is the client\'s exposure too.' },
    { criterion: 'Price / commercial terms', suggestedWeight: 4, rationale: 'Lowest weight here deliberately -- optimizing a Strategic relationship purely on price undermines the collaboration this quadrant needs.' },
  ],
  leverage: [
    { criterion: 'Price / commercial terms', suggestedWeight: 9, rationale: 'Low supply risk plus real market competition means this is exactly where competitive pressure should be used.' },
    { criterion: 'Contract flexibility / switching ease', suggestedWeight: 7, rationale: 'Keeping the ability to switch preserves the leverage this quadrant is defined by.' },
    { criterion: 'Quality baseline (pass/fail)', suggestedWeight: 6, rationale: 'Quality still gates the shortlist, but does not need to be optimized once it clears a baseline -- price competition does the rest.' },
    { criterion: 'Delivery reliability', suggestedWeight: 5, rationale: 'Matters, but many qualified alternatives exist, so it is a screening criterion rather than the deciding one.' },
  ],
  bottleneck: [
    { criterion: 'Supply continuity / security of supply', suggestedWeight: 10, rationale: 'The defining risk in this quadrant is availability, not price -- continuity has to outweigh every other criterion.' },
    { criterion: 'Dual-source / alternative-capability development', suggestedWeight: 8, rationale: 'The real fix for a Bottleneck position is reducing the bottleneck itself, not just picking the least-bad single source.' },
    { criterion: 'Lead time & buffer stock terms', suggestedWeight: 7, rationale: 'With few qualified suppliers, the client absorbs schedule risk unless the contract terms address it directly.' },
    { criterion: 'Price / commercial terms', suggestedWeight: 3, rationale: 'Genuinely secondary here -- a client with real Bottleneck exposure that optimizes for price first is choosing the wrong risk to manage.' },
  ],
  'non-critical': [
    { criterion: 'Administrative efficiency / ease of ordering', suggestedWeight: 8, rationale: 'Non-critical spend should cost as little management time as possible -- process efficiency matters more than supplier selection precision.' },
    { criterion: 'Price / commercial terms', suggestedWeight: 7, rationale: 'Low risk, low impact -- price is a reasonable primary criterion once a baseline of reliability is met.' },
    { criterion: 'Consolidation potential', suggestedWeight: 5, rationale: 'The real opportunity in this quadrant is usually reducing supplier count and transaction overhead, not optimizing any single award.' },
  ],
};

export function suggestEvaluationCriteria(quadrant: KraljicQuadrant): EvaluationCriterionSuggestion[] {
  return QUADRANT_CRITERIA[quadrant];
}

const QUADRANT_RFP_STRUCTURE: Record<KraljicQuadrant, RfpSection[]> = {
  strategic: [
    { section: 'Partnership & governance model', guidance: 'Ask how the supplier proposes to run joint business reviews, escalation paths, and shared roadmaps -- not just delivery terms.' },
    { section: 'Technical capability evidence', guidance: 'Require documented, not claimed, evidence per Module 03\'s evidence ladder -- site visits or third-party audits where the relationship value justifies the cost.' },
    { section: 'Continuity & succession planning', guidance: 'Ask what happens to the relationship if key personnel or ownership changes on the supplier\'s side.' },
    { section: 'Commercial terms', guidance: 'Structure as a starting negotiation position, not a fixed bid -- Strategic awards are relationships, not one-time purchases.' },
  ],
  leverage: [
    { section: 'Competitive pricing structure', guidance: 'Request tiered/volume pricing and clear unit-cost breakdowns to keep the comparison apples-to-apples across bidders.' },
    { section: 'Quality baseline certification', guidance: 'A pass/fail gate, not a scored dimension -- do not let a strong price compensate for a quality certification gap.' },
    { section: 'Contract term & exit clause', guidance: 'Keep terms short and exit clauses clean -- this quadrant\'s value depends on being able to re-compete easily.' },
  ],
  bottleneck: [
    { section: 'Supply continuity commitments', guidance: 'Ask explicitly for capacity guarantees, allocation priority in a shortage, and buffer-stock terms -- this is the section that matters most.' },
    { section: 'Alternative-development cooperation', guidance: 'Ask whether the incumbent will cooperate with qualifying a second source, or resists it -- the answer itself is diagnostic.' },
    { section: 'Lead time & force majeure terms', guidance: 'Bottleneck exposure usually shows up first as a schedule problem -- get real committed lead times in writing.' },
    { section: 'Price / commercial terms', guidance: 'Keep this section short and secondary -- do not let a pricing negotiation distract from the continuity terms that actually matter here.' },
  ],
  'non-critical': [
    { section: 'Standard commercial terms', guidance: 'Use the platform\'s standard template terms -- this spend does not justify custom negotiation time.' },
    { section: 'Ordering & administrative process', guidance: 'Optimize for how little staff time this supplier relationship consumes going forward.' },
  ],
};

export function draftRfpStructure(quadrant: KraljicQuadrant): RfpSection[] {
  return QUADRANT_RFP_STRUCTURE[quadrant];
}

const QUADRANT_SOLUTION_SET: Record<KraljicQuadrant, SolutionAction[]> = {
  strategic: [
    { action: 'Schedule a joint business review with the incumbent before any RFP decision', timeframe: 'this week', effort: 'Low' },
    { action: 'Commission Module 03 evidence-ladder verification of technical capability claims', timeframe: '2-4 weeks', effort: 'Medium' },
    { action: 'Build a multi-year partnership governance proposal, not a one-time RFP', timeframe: 'quarter+', effort: 'High' },
  ],
  leverage: [
    { action: 'Issue a competitive RFP to at least 3 qualified alternatives', timeframe: '2-4 weeks', effort: 'Medium' },
    { action: 'Benchmark current pricing against the RFP responses before renewing', timeframe: 'this week', effort: 'Low' },
  ],
  bottleneck: [
    { action: 'Quantify the real cost of a supply interruption before negotiating anything', timeframe: 'same day', effort: 'Low' },
    { action: 'Open a parallel qualification track for a second source, even if the incumbent stays primary', timeframe: 'quarter+', effort: 'High' },
    { action: 'Negotiate buffer-stock or committed-capacity terms into the current contract now, independent of any RFP timeline', timeframe: '2-4 weeks', effort: 'Medium' },
  ],
  'non-critical': [
    { action: 'Check whether this spend can be consolidated with an existing supplier relationship', timeframe: 'this week', effort: 'Low' },
    { action: 'Move to a standard-terms purchase order process rather than a custom negotiation', timeframe: 'same day', effort: 'Low' },
  ],
};

export function buildSolutionSet(quadrant: KraljicQuadrant): SolutionAction[] {
  return QUADRANT_SOLUTION_SET[quadrant];
}

/**
 * Honest, disclosed local-content check. Only Saudi LCGPA is real/researched
 * (Module 08's own status, #373/#374) -- every other market returns an
 * explicit "not yet researched" note rather than assuming ICV-equivalence
 * with Saudi's framework, which real GCC programmes do not share.
 */
export function checkLocalContentRelevance(targetMarket: string | null): LocalContentFlag {
  if (!targetMarket || !targetMarket.trim()) {
    return {
      relevant: false,
      note: 'No target market specified -- local content only applies when sourcing against a specific country\'s public-sector or ICV requirement.',
    };
  }
  const normalized = targetMarket.trim().toLowerCase();
  if (normalized === 'saudi arabia' || normalized === 'saudi' || normalized === 'ksa') {
    return {
      relevant: true,
      note: 'Saudi LCGPA local-content requirements may apply -- run the LCGPA Readiness Self-Check (#373/#374, lcgpaLocalContent.ts) for a real assessment against this specific supplier and spend.',
    };
  }
  return {
    relevant: false,
    note: `Local-content research has not yet been completed for "${targetMarket}" (Module 08's own disclosed gap) -- this flag cannot be resolved with real data for this market today, and is not assumed equivalent to Saudi's LCGPA framework.`,
  };
}

/** Explicit passthrough to Decision Lab's real scoring engine -- Module 02
 *  never re-implements weighted ranking once a client enters real
 *  candidates. */
export function rankCandidateSuppliers(scenario: DecisionScenario): ScoredOption[] {
  return scoreOptions(scenario);
}

const KRALJIC_DEFAULT_FIELDS: Array<keyof KraljicItem> = [
  'supplierCount', 'leadTimeDays', 'qualityImpact', 'revenueImpact', 'marketCompetitiveness', 'geographicRisk', 'substitutability',
];
const KRALJIC_DEFAULTS: Partial<KraljicItem> = {
  supplierCount: 3, leadTimeDays: 14, qualityImpact: 3, revenueImpact: 3, marketCompetitiveness: 3, geographicRisk: 2, substitutability: 3,
};

/**
 * Disclosed, rule-based confidence (0-100), never an AI-invented score
 * (Decision Record 8.7). Zero when annualSpend is unset -- the single most
 * load-bearing input to the Kraljic classification -- because a
 * classification computed against a zero/default spend is not a real
 * classification, whatever quadrant the math happens to land on. Otherwise
 * rises with how many of the 7 risk/impact inputs have been actually
 * entered rather than left at their form defaults.
 */
export function assessSourcingConfidence(item: KraljicItem, portfolioContext: KraljicItem[] = []): number {
  if (!item.annualSpend || item.annualSpend <= 0) return 0;
  const enteredCount = KRALJIC_DEFAULT_FIELDS.filter(f => item[f] !== KRALJIC_DEFAULTS[f]).length;
  const raw = 30 + enteredCount * 10;
  const cap = portfolioContext.length > 0 ? 100 : 50;
  return Math.min(cap, raw);
}

export function buildSourcingStrategy(input: {
  statedNeed: string;
  kraljicItem: KraljicItem;
  portfolioContext?: KraljicItem[];
  industryKey: string | null;
  targetMarket: string | null;
  /** The client's real, observed current relationship posture with this
   *  supplier, if known. Omitted entirely (not guessed) when not supplied --
   *  see relationshipCompatibility: null in the output. */
  currentRelationshipPosture?: RelationshipPosture;
  assumptions: string[];
}): SourcingStrategyOutput {
  const portfolioContext = input.portfolioContext ?? [];
  const scored = classifyKraljicPosition(input.kraljicItem, portfolioContext, input.industryKey);
  const localContent = checkLocalContentRelevance(input.targetMarket);
  const confidence = assessSourcingConfidence(input.kraljicItem, portfolioContext);
  const assumptions = portfolioContext.length > 0
    ? input.assumptions
    : [...input.assumptions, "No wider portfolio context was provided -- this item's spend is being read as 100% of the comparison set, which caps confidence at 50."];

  const relationshipCompatibility = input.currentRelationshipPosture
    ? assessRelationshipCompatibility(scored.quadrant, input.currentRelationshipPosture)
    : null;

  return {
    sourcingBrief: input.statedNeed,
    kraljicQuadrant: scored.quadrant,
    evaluationCriteria: suggestEvaluationCriteria(scored.quadrant),
    localContentRelevant: localContent.relevant,
    localContentNote: localContent.note,
    rfpStructureDraft: draftRfpStructure(scored.quadrant),
    solutionSet: buildSolutionSet(scored.quadrant),
    relationshipCompatibility,
    negotiationStrategy: recommendNegotiationStrategy(scored.quadrant, relationshipCompatibility),
    negotiationPlan: buildNegotiationPlan(scored.quadrant),
    evidenceSummary: {
      dataUsed: [`Kraljic profit-impact score: ${scored.profitImpactScore}`, `Kraljic supply-risk score: ${scored.supplyRiskScore}`, `industry: ${input.industryKey ?? 'default'}`],
      assumptions,
      confidence,
    },
  };
}

/* ------------------------------------------------------------------------
 * Relationship spectrum: adversarial -> partnership
 *
 * Real, sourced framework -- not invented. Grounded in Cousins & Spekman's
 * buyer-supplier relationship continuum (2003), Bensaou's buyer-supplier
 * portfolio model (HBR, 1999: Market Exchange / Captive Buyer / Captive
 * Supplier / Strategic Partnership), and the CIPS category-management
 * practice of pairing each Kraljic quadrant with a distinct relationship
 * posture and governance model, not treating "supplier relationship" as one
 * undifferentiated concept.
 *
 * The genuinely useful output here is not the spectrum itself (textbook)
 * but the COMPATIBILITY check against a client's real, current relationship
 * posture: Kraljic quadrant tells you where a category SHOULD sit; a
 * client's actual relationship posture with a given supplier is a separate,
 * observable fact that can be badly mismatched with that ideal -- and the
 * most dangerous mismatch in the whole framework is a Bottleneck-quadrant
 * supplier where the relationship is Adversarial, because that adversarial
 * posture is usually not a choice the client made -- it is the supplier
 * exercising the exact scarcity power that put the category in Bottleneck
 * in the first place. Naming that explicitly is more useful than the
 * spectrum taxonomy alone.
 * ------------------------------------------------------------------------ */

export type RelationshipPosture = 'adversarial' | 'transactional' | 'cooperative' | 'collaborative' | 'partnership';

export interface RelationshipStageProfile {
  posture: RelationshipPosture;
  label: string;
  labelAr: string;
  /** What actually characterizes this stage in practice -- not a slogan. */
  characteristics: string[];
  governanceFeatures: string[];
  typicalKpis: string[];
  contractCharacteristics: string[];
}

/** Ordered low (adversarial) to high (partnership) -- index is used as the
 *  distance metric in `assessRelationshipCompatibility`. */
export const RELATIONSHIP_SPECTRUM: RelationshipStageProfile[] = [
  {
    posture: 'adversarial',
    label: 'Adversarial',
    labelAr: 'علائقي تنافسي/عدائي',
    characteristics: [
      'Win-lose negotiating stance on both sides',
      'Minimal information sharing beyond what a purchase order requires',
      'Either party will switch the moment a better deal appears, and both know it',
      'Often not a choice -- frequently the default when one side holds most of the power',
    ],
    governanceFeatures: ['Purchase-order-level interaction only', 'No joint planning or shared forecasts', 'Disputes resolved contractually, not collaboratively'],
    typicalKpis: ['Price / unit cost only'],
    contractCharacteristics: ['Short-term or spot', 'Heavily one-sided penalty/liability terms', 'No renewal commitment either way'],
  },
  {
    posture: 'transactional',
    label: 'Transactional',
    labelAr: 'علائقي معاملاتي',
    characteristics: [
      'Repeat business, but each order is still evaluated on its own merits',
      'Some standard information sharing (lead times, catalog pricing)',
      'Neither party is investing in the relationship beyond the transaction itself',
    ],
    governanceFeatures: ['Standard purchase-order and catalog processes', 'Periodic (not continuous) performance checks', 'Single point of contact each side, procurement-to-sales'],
    typicalKpis: ['Price', 'On-time delivery (pass/fail)'],
    contractCharacteristics: ['Framework or call-off agreement', 'Auto-renewing but easily terminated', 'Standard terms, minimal customization'],
  },
  {
    posture: 'cooperative',
    label: 'Cooperative',
    labelAr: 'علائقي تعاوني',
    characteristics: [
      'Both sides share some forward-looking information (demand forecasts, capacity plans)',
      'Willingness to solve a specific recurring problem jointly, rather than just penalizing it',
      'Still fundamentally price-sensitive, but not price-only',
    ],
    governanceFeatures: ['Scheduled quarterly or semi-annual business reviews', 'Multi-dimensional scorecard, not price alone', 'A named relationship owner on both sides, not just transactional contacts'],
    typicalKpis: ['Price', 'Delivery reliability', 'Quality/defect rate', 'Responsiveness to change requests'],
    contractCharacteristics: ['1-2 year terms', 'Some negotiated flexibility on volume/schedule', 'Basic continuous-improvement clause'],
  },
  {
    posture: 'collaborative',
    label: 'Collaborative',
    labelAr: 'علائقي تشاركي',
    characteristics: [
      'Joint problem-solving extends beyond the immediate transaction into process and design',
      'Real information transparency -- shared systems or data feeds, not just periodic reports',
      'Both sides accept some shared risk in exchange for shared upside',
    ],
    governanceFeatures: ['Cross-functional contacts (engineering-to-engineering, quality-to-quality), not procurement-only', 'Joint improvement roadmap tracked over multiple cycles', 'Formal escalation path above the day-to-day relationship owners'],
    typicalKpis: ['Total cost of ownership, not unit price', 'Joint improvement-initiative delivery', 'Innovation contribution'],
    contractCharacteristics: ['Multi-year with defined renewal criteria', 'Shared-risk/shared-reward mechanisms (e.g. gain-sharing)', 'Some exclusivity or preferred-status commitment'],
  },
  {
    posture: 'partnership',
    label: 'Strategic Partnership',
    labelAr: 'شراكة استراتيجية',
    characteristics: [
      'Mutual dependency is acknowledged and actively managed, not denied',
      'Joint investment -- capital, engineering time, or co-developed IP -- on both sides',
      'Executive-level sponsorship and governance, not delegated entirely to procurement',
    ],
    governanceFeatures: ['Executive steering committee with joint business reviews (reuses maturitySubSegSrm.ts\'s Strategic Partnership Governance sub-segment)', 'Consolidated real-time tracker for joint-initiative status and partnership KPIs', 'Formal succession/continuity planning on both sides'],
    typicalKpis: ['Joint roadmap milestones', 'Co-innovation output', 'Total value delivered across the relationship, not a single transaction'],
    contractCharacteristics: ['Multi-year, often with automatic long-term renewal presumption', 'Joint investment or capacity-reservation commitments', 'Named escalation to both organizations\' executive sponsors'],
  },
];

const POSTURE_INDEX: Record<RelationshipPosture, number> = { adversarial: 0, transactional: 1, cooperative: 2, collaborative: 3, partnership: 4 };

export function getRelationshipStageProfile(posture: RelationshipPosture): RelationshipStageProfile {
  return RELATIONSHIP_SPECTRUM[POSTURE_INDEX[posture]];
}

/**
 * The textbook-ideal relationship posture per Kraljic quadrant (CIPS
 * category-management practice). This is a starting point, not a rule --
 * `assessRelationshipCompatibility` is what actually does useful work by
 * comparing this ideal against a client's real, current posture.
 */
export const IDEAL_POSTURE_BY_QUADRANT: Record<KraljicQuadrant, RelationshipPosture> = {
  strategic: 'partnership',
  leverage: 'transactional',
  bottleneck: 'collaborative',
  'non-critical': 'transactional',
};

export type MismatchSeverity = 'aligned' | 'monitor' | 'high-risk';

export interface RelationshipCompatibility {
  quadrant: KraljicQuadrant;
  idealPosture: RelationshipPosture;
  currentPosture: RelationshipPosture;
  /** Positive: relationship is under-invested relative to the ideal.
   *  Negative: relationship is over-invested (not necessarily a problem,
   *  but a real cost/effort question worth naming). Zero: aligned. */
  gap: number;
  severity: MismatchSeverity;
  advisory: string;
  advisoryAr: string;
}

/**
 * The real, useful output: compares a client's actual relationship posture
 * for a supplier against the Kraljic-ideal for that category's quadrant,
 * and names the specific risk of any mismatch rather than a generic
 * "consider improving the relationship" line.
 */
export function assessRelationshipCompatibility(quadrant: KraljicQuadrant, currentPosture: RelationshipPosture): RelationshipCompatibility {
  const idealPosture = IDEAL_POSTURE_BY_QUADRANT[quadrant];
  const gap = POSTURE_INDEX[idealPosture] - POSTURE_INDEX[currentPosture];

  // The specific, named case this feature exists for: Bottleneck + Adversarial.
  if (quadrant === 'bottleneck' && currentPosture === 'adversarial') {
    return {
      quadrant, idealPosture, currentPosture, gap,
      severity: 'high-risk',
      advisory: 'This is the highest-risk combination in the framework: a Bottleneck-quadrant supplier held at arm\'s length usually isn\'t a choice -- it is the supplier exercising the exact scarcity power that put this category in Bottleneck to begin with. Price-based negotiation will not fix this; the real levers are guaranteed-volume commitments, early or accelerated payment terms, and engineering-level collaboration that give the supplier a reason to prioritize this client without requiring competitive leverage neither side actually has.',
      advisoryAr: 'هذا أخطر مزيج في هذا الإطار: عندما يُبقي العميل مورد "اختناق" على مسافة تنافسية، فهذا غالبًا ليس خيارًا بل نتيجة استغلال المورد للندرة ذاتها التي وضعت هذه الفئة في موقع الاختناق أصلًا. التفاوض على السعر لن يعالج هذا؛ الأدوات الفعلية هي التزامات كمية مضمونة، وشروط دفع مبكر أو معجّل، وتعاون هندسي مباشر يمنح المورد سببًا لإعطاء الأولوية لهذا العميل دون الاعتماد على نفوذ تفاوضي لا يملكه أي من الطرفين فعليًا.',
    };
  }

  if (quadrant === 'strategic' && (currentPosture === 'adversarial' || currentPosture === 'transactional')) {
    return {
      quadrant, idealPosture, currentPosture, gap,
      severity: 'high-risk',
      advisory: 'A Strategic-quadrant supplier held at a Transactional or Adversarial distance is under-governed relative to how much this relationship actually matters -- a high-impact, high-risk category with no executive sponsorship or joint planning is exposed to exactly the kind of relationship failure this quadrant is meant to prevent. Escalate governance toward Collaborative or Partnership deliberately, not as an afterthought once something has already gone wrong.',
      advisoryAr: 'مورد فئة "استراتيجي" يُدار بمسافة معاملاتية أو عدائية يعني حوكمة أضعف بكثير مما تستحقه هذه العلاقة فعليًا -- فئة عالية الأثر وعالية الخطورة دون رعاية تنفيذية أو تخطيط مشترك تظل معرّضة لذات إخفاق العلاقة الذي يُفترض بهذه الفئة تفاديه. ارفع مستوى الحوكمة عمدًا نحو التشارك أو الشراكة، لا كرد فعل متأخر بعد وقوع مشكلة.',
    };
  }

  const severity: MismatchSeverity = Math.abs(gap) >= 2 ? 'high-risk' : Math.abs(gap) === 1 ? 'monitor' : 'aligned';

  if (severity === 'aligned') {
    return {
      quadrant, idealPosture, currentPosture, gap, severity,
      advisory: `Current posture (${currentPosture}) matches the textbook ideal for a ${quadrant} category -- no relationship-governance change indicated by this check alone.`,
      advisoryAr: `الوضع الحالي (${getRelationshipStageProfile(currentPosture).labelAr}) يطابق المستوى المثالي لفئة "${quadrant}" -- لا يوجد ما يستدعي تغيير حوكمة العلاقة بناءً على هذا الفحص وحده.`,
    };
  }

  if (gap > 0) {
    return {
      quadrant, idealPosture, currentPosture, gap, severity,
      advisory: `Relationship is under-invested for this quadrant: ideal is ${idealPosture}, actual is ${currentPosture}. ${severity === 'high-risk' ? 'This gap is wide enough to warrant a deliberate plan to move up the spectrum, not just awareness of it.' : 'Worth monitoring -- not urgent, but don\'t let this gap widen further.'}`,
      advisoryAr: `العلاقة أقل استثمارًا مما تتطلبه هذه الفئة: المستوى المثالي هو "${idealPosture}" والواقع هو "${currentPosture}". ${severity === 'high-risk' ? 'هذه الفجوة كبيرة بما يكفي لتستدعي خطة مقصودة للارتقاء على مقياس العلاقة، لا مجرد إدراكها.' : 'تستحق المتابعة دون أن تكون عاجلة، لكن لا تدع الفجوة تتسع أكثر.'}`,
    };
  }

  return {
    quadrant, idealPosture, currentPosture, gap, severity,
    advisory: `Relationship is over-invested relative to this quadrant's ideal (${idealPosture}) -- not inherently a risk, but worth confirming the governance overhead (steering committees, joint planning time) is proportionate to what a ${quadrant} category actually needs.`,
    advisoryAr: `العلاقة تحمل استثمارًا أكبر مما تتطلبه هذه الفئة (المستوى المثالي: "${idealPosture}") -- ليس خطرًا بحد ذاته، لكن يستحق التأكد أن عبء الحوكمة (لجان التوجيه، وقت التخطيط المشترك) يتناسب مع ما تحتاجه فئة "${quadrant}" فعليًا.`,
  };
}

/** The concrete next-stage actions to move one step up the spectrum toward
 *  the ideal posture -- pulled directly from the next stage's own governance
 *  features, not a separately invented action list. */
export function recommendRelationshipUpgrade(currentPosture: RelationshipPosture, idealPosture: RelationshipPosture): string[] {
  const currentIdx = POSTURE_INDEX[currentPosture];
  const idealIdx = POSTURE_INDEX[idealPosture];
  if (idealIdx <= currentIdx) return [];
  const nextStage = RELATIONSHIP_SPECTRUM[currentIdx + 1];
  return nextStage.governanceFeatures;
}


/* ------------------------------------------------------------------------
 * Negotiation strategy: real, sourced tactics -- not invented advice
 *
 * Grounded in three real bodies of negotiation research, applied to the
 * Kraljic quadrant this module already computes and the relationship
 * posture Module 02's own compatibility check already tracks:
 *
 * - Fisher & Ury, "Getting to Yes" (Harvard Program on Negotiation, 1981) --
 *   principled negotiation: separate people from the problem, focus on
 *   interests not positions, generate options for mutual gain, insist on
 *   objective criteria. BATNA (Best Alternative to a Negotiated Agreement)
 *   and ZOPA (Zone of Possible Agreement) both originate here.
 * - Lewicki / Walton & McKersie's distributive-vs-integrative distinction --
 *   distributive (win-lose, claim value from a fixed pie) suits one-time,
 *   price-primary, commodity-style deals; integrative (win-win, expand the
 *   total value) suits ongoing relationships with multiple tradeable
 *   variables.
 * - CIPS negotiation-strategy guidance and standard Kraljic-quadrant
 *   negotiation postures taught across procurement practice.
 *
 * IMPORTANT -- this does not duplicate ISC's existing negotiation content.
 * kraljicScoring.ts's ACTION_PLANS already ships 5 real, bilingual,
 * quadrant-specific negotiation actions per quadrant, live today in
 * KraljicMatrix.tsx's "Negotiation Approach" tab. Those 5 items per
 * quadrant are REUSED here directly (never re-authored or contradicted --
 * see NEGOTIATION_PROFILE_BY_QUADRANT below, which pulls them from
 * ACTION_PLANS[quadrant].negotiation/negotiationAr as the first entries in
 * each tactics list). What this module adds on top, and what ACTION_PLANS
 * does not have, is threefold: (1) an explicit distributive/integrative
 * approach classification with academic rationale, (2) BATNA/ZOPA framing,
 * and (3) a relationship-posture-adjusted advisory -- ACTION_PLANS is
 * quadrant-only and has no awareness of the client's real, observed
 * current relationship posture the way assessRelationshipCompatibility()
 * does. The additional tactics beyond the reused 5 focus on HOW to
 * negotiate (technique) rather than WHAT to negotiate for (ACTION_PLANS'
 * focus), so the two lists are complementary, not overlapping.
 *
 * Why this belongs in Module 02 and not a new module: quadrant and
 * relationship posture are the two real inputs a negotiation approach
 * depends on, and this module already computes both. The eventual
 * client-facing surface for this, like the rest of Module 02, is Module
 * 09's consultancy output layer; ISC's live Maturity Assessment already
 * separately diagnoses WHETHER a client has disciplined negotiation
 * planning practice (maturitySubSegProcurement.ts, the "leverage
 * assessment / BATNA / walk-away positioning" question) -- this module is
 * the first place ISC actually prescribes real tactics once that gap is
 * identified, not a second, competing maturity check.
 * ------------------------------------------------------------------------ */

export type NegotiationApproach = 'distributive' | 'mixed' | 'integrative';

export interface BilingualTactic {
  en: string;
  ar: string;
}

export type MilLevel = 'must' | 'intend' | 'like';

export interface MilObjective {
  level: MilLevel;
  objective: BilingualTactic;
}

export interface NegotiationStrategy {
  quadrant: KraljicQuadrant;
  recommendedApproach: NegotiationApproach;
  approachRationale: string;
  approachRationaleAr: string;
  batnaGuidance: string;
  batnaGuidanceAr: string;
  zopaGuidance: string;
  zopaGuidanceAr: string;
  /** Reused ACTION_PLANS.negotiation entries first, then additional
   *  technique-level tactics grounded in Fisher & Ury / CIPS / Lewicki --
   *  never a second, contradictory list. */
  tactics: BilingualTactic[];
  avoid: BilingualTactic[];
  /** How to use the MIL objective grid below (Must / Intend / Like), a
   *  standard CIPS negotiation-planning discipline -- explained once here
   *  rather than repeated per objective. */
  milGuidance: string;
  milGuidanceAr: string;
  /** Illustrative starting-point objectives for this quadrant, classified
   *  by priority tier. These are examples to replace with the client's own
   *  real priorities before the session, not a fixed checklist -- the
   *  whole point of the MIL discipline is that the CLIENT decides what is
   *  actually a Must versus a Like for their specific negotiation. */
  milObjectives: MilObjective[];
  /** Only populated when a relationshipCompatibility check ran and found a
   *  real mismatch -- never guessed when no current posture was supplied. */
  relationshipAdjustment: string | null;
  relationshipAdjustmentAr: string | null;
}

interface NegotiationProfile {
  recommendedApproach: NegotiationApproach;
  approachRationale: string;
  approachRationaleAr: string;
  batnaGuidance: string;
  batnaGuidanceAr: string;
  zopaGuidance: string;
  zopaGuidanceAr: string;
  additionalTactics: BilingualTactic[];
  avoid: BilingualTactic[];
  milObjectives: MilObjective[];
}

const MIL_GUIDANCE = "Before entering this negotiation, classify the client's own objectives using the MIL framework (Must / Intend / Like), a standard CIPS negotiation-planning discipline. Must-have objectives are the non-negotiable minimum -- walk away rather than concede them. Intend-to-have objectives are real priorities worth pushing hard for, but an acceptable deal can still be reached without every one of them. Like-to-have objectives are the first things to trade away to protect the Must and Intend tiers. The objectives below are illustrative starting points for this quadrant, not a fixed checklist -- the whole point of the MIL discipline is that the client sets these based on their own real priorities before the session, not from a generic template.";

const MIL_GUIDANCE_AR = "قبل الدخول في هذا التفاوض، صنّف أهداف العميل الخاصة باستخدام إطار العمل MIL (يجب / أنوي / أحبذ)، وهو انضباط قياسي في تخطيط التفاوض معتمد من CIPS. الأهداف من مستوى \"يجب\" هي الحد الأدنى غير القابل للتفاوض -- انسحب بدلاً من التنازل عنها. الأهداف من مستوى \"أنوي\" هي أولويات حقيقية تستحق الدفع بقوة من أجلها، لكن يمكن التوصل إلى صفقة مقبولة دون تحقيق كل واحدة منها. الأهداف من مستوى \"أحبذ\" هي أول ما يُضحّى به لحماية مستويي \"يجب\" و\"أنوي\". الأهداف أدناه نقاط انطلاق توضيحية لهذا الربع، وليست قائمة ثابتة -- فجوهر انضباط MIL هو أن يحدد العميل هذه الأهداف بناءً على أولوياته الحقيقية الخاصة قبل الجلسة، لا من قالب عام.";


const NEGOTIATION_PROFILE_BY_QUADRANT: Record<KraljicQuadrant, NegotiationProfile> = {
  strategic: {
    recommendedApproach: 'integrative',
    approachRationale: "High profit impact and high supply risk mean a win-lose outcome costs the client more than it gains -- Fisher & Ury's principled-negotiation logic and CIPS's collaborative-strategy guidance both point toward joint value creation over price extraction in this quadrant.",
    approachRationaleAr: "التأثير المرتفع على الربحية مع مخاطر التوريد العالية يعنيان أن نتيجة الفوز/الخسارة تكلّف العميل أكثر مما تكسبه -- منطق التفاوض المبدئي لفيشر ويوري وإرشادات CIPS للاستراتيجية التعاونية يشيران كلاهما إلى خلق قيمة مشتركة بدلاً من استخلاص السعر في هذا الربع.",
    batnaGuidance: "Real leverage rarely comes from threatening to switch suppliers here -- qualified alternatives are scarce by definition in a Strategic position. The BATNA worth building is credible in-house capability or a genuine, funded dual-source development plan, not a bluff the supplier can see through.",
    batnaGuidanceAr: "نادراً ما يأتي النفوذ الحقيقي هنا من التهديد بتغيير المورد -- فالبدائل المؤهلة نادرة بحكم تعريف الموقع الاستراتيجي. البديل الأفضل الجدير بالبناء هو قدرة داخلية موثوقة أو خطة تطوير مصدر ثانٍ ممولة وحقيقية، لا خدعة يمكن للمورد كشفها بسهولة.",
    zopaGuidance: "Expect a wide negotiating mix beyond unit price: joint investment, exclusivity terms, innovation-sharing, and payment-term trade-offs. Price alone rarely captures the real zone of possible agreement in a Strategic relationship.",
    zopaGuidanceAr: "توقّع مزيجاً تفاوضياً واسعاً يتجاوز سعر الوحدة: استثمار مشترك، شروط حصرية، تبادل الابتكار، ومقايضات في شروط الدفع. نادراً ما يعكس السعر وحده منطقة الاتفاق الممكنة الحقيقية في علاقة استراتيجية.",
    additionalTactics: [
      { en: "Separate the people from the problem -- critique the proposed terms, not the supplier relationship, when pushing back (Fisher & Ury, Getting to Yes).", ar: "افصل بين الأشخاص والمشكلة -- انتقد الشروط المقترحة لا العلاقة مع المورد عند الاعتراض (فيشر ويوري، الوصول إلى نعم)." },
      { en: "Focus on interests, not stated positions -- ask why a term matters to the supplier before rejecting it outright.", ar: "ركّز على المصالح لا على المواقف المعلنة -- اسأل عن سبب أهمية بند معين للمورد قبل رفضه مباشرة." },
      { en: "Generate multiple options before committing to one deal structure -- brainstorm several ways to satisfy both sides' real interests.", ar: "ولّد عدة خيارات قبل الالتزام بهيكل صفقة واحد -- اطرح طرقاً متعددة لتلبية المصالح الحقيقية لكلا الطرفين." },
      { en: "Insist on objective, verifiable criteria (market indices, audited cost models) to resolve disagreements rather than a battle of wills.", ar: "أصرّ على معايير موضوعية يمكن التحقق منها (مؤشرات السوق، نماذج التكلفة المدقَّقة) لحل الخلافات بدلاً من صراع الإرادات." },
      { en: "Run interest-based bargaining sessions rather than single-round offer/counter-offer exchanges.", ar: "أجرِ جلسات تفاوض قائمة على المصالح بدلاً من تبادل عروض ومقابل عروض من جولة واحدة." },
      { en: "Build joint negotiation teams with technical and commercial members on both sides, not procurement versus sales alone.", ar: "شكّل فرق تفاوض مشتركة تضم أعضاء تقنيين وتجاريين من الطرفين، وليس المشتريات مقابل المبيعات فقط." },
      { en: "Rehearse likely objections and prepare fallback trade-offs before the session -- the same structured planning discipline ISC's own Maturity Assessment already scores.", ar: "تدرّب على الاعتراضات المحتملة وجهّز مقايضات بديلة قبل الجلسة -- وهو نفس انضباط التخطيط المنظّم الذي يقيّمه تقييم النضج الخاص بـ ISC بالفعل." },
    ],
    avoid: [
      { en: "Aggressive, price-only tactics that treat a Strategic partner like a commodity supplier.", ar: "تكتيكات عدوانية قائمة على السعر فقط تعامل شريكاً استراتيجياً كأنه مورد سلعي." },
      { en: "Single-issue bargaining that ignores the wider relationship.", ar: "مساومة على قضية واحدة تتجاهل العلاقة الأوسع." },
      { en: "Surprise competitive RFPs run against a supplier the client actually depends on -- this reads as adversarial and can trigger real retaliation risk.", ar: "طرح مناقصات تنافسية مفاجئة ضد مورد يعتمد عليه العميل فعلياً -- يُقرأ كخطوة خصومية وقد يستدعي مخاطر رد فعل حقيقية." },
      { en: "Letting procurement negotiate a Strategic relationship without executive visibility or involvement.", ar: "ترك المشتريات تتفاوض على علاقة استراتيجية دون رؤية أو مشاركة تنفيذية." },
      { en: "Treating a signed framework agreement as the end of the relationship rather than the start of joint execution.", ar: "معاملة الاتفاقية الإطارية الموقعة كنهاية للعلاقة بدلاً من بداية التنفيذ المشترك." },
    ],
    milObjectives: [
      { level: 'must', objective: { en: "Guaranteed capacity or priority allocation during any future shortage; no unilateral price increase without objective cost justification.", ar: "ضمان أولوية التخصيص أو الطاقة الإنتاجية عند أي نقص مستقبلي؛ عدم رفع الأسعار من جانب واحد دون تبرير موضوعي للتكلفة." } },
      { level: 'intend', objective: { en: "Joint innovation or R&D investment commitment; a multi-year price-review band tied to a published index rather than open renegotiation every year.", ar: "التزام استثماري مشترك في الابتكار والبحث والتطوير؛ نطاق مراجعة أسعار متعدد السنوات مرتبط بمؤشر منشور بدلاً من إعادة تفاوض سنوية مفتوحة." } },
      { level: 'like', objective: { en: "Executive-to-executive quarterly business reviews; joint case-study or co-branding participation.", ar: "مراجعات عمل تنفيذية ربع سنوية بين الطرفين؛ المشاركة في دراسات حالة مشتركة أو العلامة التجارية المشتركة." } },
    ],
  },
  leverage: {
    recommendedApproach: 'distributive',
    approachRationale: "Multiple qualified suppliers and low switching cost is exactly the condition distributive, competitive negotiation is suited for (CIPS, Lewicki) -- this is the one quadrant where playing suppliers against each other is the textbook-correct approach, not an aggressive overreach.",
    approachRationaleAr: "تعدد الموردين المؤهلين وانخفاض تكلفة التبديل هو بالضبط الشرط الذي يناسب التفاوض التوزيعي التنافسي (CIPS، لويكي) -- هذا هو الربع الوحيد الذي تُعد فيه المنافسة بين الموردين النهج الصحيح أكاديمياً، لا تجاوزاً عدوانياً.",
    batnaGuidance: "A credible competing bid in hand is the real BATNA here -- run an actual competitive process (RFQ, reverse auction) rather than negotiating from a single quote and hoping the threat of alternatives is believed.",
    batnaGuidanceAr: "وجود عرض منافس حقيقي في اليد هو البديل الأفضل الحقيقي هنا -- أجرِ عملية تنافسية فعلية (طلب عروض أسعار، مزاد عكسي) بدلاً من التفاوض بناءً على عرض واحد على أمل أن يُصدَّق تهديد وجود بدائل.",
    zopaGuidance: "Price is usually the primary variable; the zone of possible agreement is narrow and centers on unit price, payment terms, and volume discounts rather than a wide multi-issue trade.",
    zopaGuidanceAr: "السعر عادة هو المتغير الأساسي؛ منطقة الاتفاق الممكنة ضيقة وتتمحور حول سعر الوحدة وشروط الدفع وخصومات الكمية بدلاً من مقايضة واسعة متعددة القضايا.",
    additionalTactics: [
      { en: "Anchor first and anchor firmly -- the opening number has a disproportionate effect on where a distributive negotiation lands.", ar: "ابدأ بترسية الرقم أولاً وبثبات -- للرقم الافتتاحي تأثير غير متناسب على نتيجة التفاوض التنافسي." },
      { en: "Use silence deliberately after making an offer -- do not fill the silence or negotiate against yourself.", ar: "استخدم الصمت عن قصد بعد تقديم العرض -- لا تملأ الصمت ولا تفاوض ضد نفسك." },
      { en: "Create genuine time pressure only where it is real (quarter-end, budget cycles) -- fabricated deadlines are quickly detected and cost credibility.", ar: "اخلق ضغط وقت حقيقياً فقط عندما يكون فعلياً (نهاية الربع، دورات الميزانية) -- المواعيد النهائية المصطنعة تُكتشف بسرعة وتكلّف المصداقية." },
      { en: "Bundle multiple small requests into a single ask rather than trickling concessions across several rounds.", ar: "اجمع عدة طلبات صغيرة في طلب واحد بدلاً من تسريب التنازلات عبر جولات متعددة." },
      { en: "Never make the first concession without extracting a matching concession in return.", ar: "لا تُقدّم أول تنازل دون الحصول على تنازل مقابل له." },
      { en: "Keep your own walk-away point private -- never disclose the maximum acceptable price to the other side.", ar: "أبقِ نقطة انسحابك سرّية -- لا تكشف أبداً للطرف الآخر عن أقصى سعر يمكنك قبوله." },
      { en: "Use competitive bid data transparently as leverage -- let the supplier see, or credibly infer, that real alternatives exist.", ar: "استخدم بيانات العروض التنافسية بشفافية كأداة ضغط -- دع المورد يرى، أو يستدل بمصداقية، أن هناك بدائل حقيقية." },
      { en: "Recognize and resist anchoring tactics used against you -- a supplier's high opening price is a tactic, not a fact about true cost.", ar: "تعرّف على تكتيكات الترسية المستخدمة ضدك وقاومها -- سعر الافتتاح المرتفع من المورد تكتيك وليس حقيقة عن التكلفة الفعلية." },
    ],
    avoid: [
      { en: "Over-investing relationship effort in a category that does not need it -- Leverage items are, by definition, low switching-risk.", ar: "الإفراط في الاستثمار العلائقي في فئة لا تحتاج لذلك -- أصناف النفوذ منخفضة مخاطر التبديل بحكم تعريفها." },
      { en: "Single-sourcing without maintaining real competitive tension behind it.", ar: "الاعتماد على مصدر واحد دون الحفاظ على توتر تنافسي حقيقي خلفه." },
      { en: "Disclosing your own budget or target price before the supplier reveals theirs.", ar: "الكشف عن ميزانيتك أو سعرك المستهدف قبل أن يكشف المورد عن سعره." },
      { en: "Accepting the supplier's proposed negotiation format or agenda without proposing your own.", ar: "قبول صيغة أو جدول أعمال التفاوض الذي يقترحه المورد دون اقتراح صيغتك الخاصة." },
    ],
    milObjectives: [
      { level: 'must', objective: { en: "Price at or below the best of at least two to three competing, qualified bids.", ar: "سعر عند أو أقل من أفضل عرضين إلى ثلاثة عروض تنافسية مؤهلة." } },
      { level: 'intend', objective: { en: "Extended payment terms (DPO 60-90 days) and tiered volume rebates.", ar: "تمديد شروط الدفع (60-90 يوماً) وخصومات متدرجة على الكمية." } },
      { level: 'like', objective: { en: "Marginal service upgrades -- faster delivery windows, a dedicated account contact -- at no additional cost.", ar: "تحسينات خدمية هامشية -- مواعيد تسليم أسرع، جهة اتصال مخصصة -- دون تكلفة إضافية." } },
    ],
  },
  bottleneck: {
    recommendedApproach: 'mixed',
    approachRationale: "Real supply risk with few alternatives usually means the client, not the supplier, is the vulnerable party -- distributive or competitive tactics can backfire by damaging the one relationship keeping supply flowing. This is the same finding this module's relationshipCompatibility check flags as high-risk for a Bottleneck supplier held at Adversarial distance.",
    approachRationaleAr: "مخاطر التوريد الحقيقية مع قلة البدائل تعني غالباً أن العميل، لا المورد، هو الطرف الأضعف -- والتكتيكات التوزيعية أو التنافسية قد ترتد سلباً بإضرارها بالعلاقة الوحيدة التي تُبقي الإمداد مستمراً. هذا هو نفس ما يرصده فحص توافق العلاقة في هذه الوحدة كخطر مرتفع عندما يُبقى مورد اختناق على مسافة عدائية.",
    batnaGuidance: "Building a genuine BATNA -- a second qualified source, an in-house substitute, or a specification change that unlocks alternative suppliers -- is the single highest-value negotiation action available in this quadrant. Until it exists, any negotiating leverage the client claims to have is largely theoretical.",
    batnaGuidanceAr: "بناء بديل أفضل حقيقي -- مصدر ثانٍ مؤهل، بديل داخلي، أو تعديل في المواصفات يفتح المجال لموردين بديلين -- هو أعلى إجراء تفاوضي قيمة متاح في هذا الربع. وإلى أن يتحقق ذلك، فإن أي نفوذ تفاوضي يدّعيه العميل يبقى نظرياً إلى حد كبير.",
    zopaGuidance: "Broaden the negotiating mix past price: guaranteed volumes, priority allocation during a shortage, accelerated payment terms, and joint engineering work are the real levers when price leverage genuinely does not exist.",
    zopaGuidanceAr: "وسّع مزيج التفاوض إلى ما هو أبعد من السعر: الكميات المضمونة، أولوية التخصيص أثناء النقص، شروط الدفع المعجّلة، والعمل الهندسي المشترك هي الأدوات الفعلية الحقيقية عندما لا يكون هناك نفوذ سعري فعلي أصلاً.",
    additionalTactics: [
      { en: "Separate the relationship from the immediate deal -- protect the long-term relationship even while pushing on a specific term (Fisher & Ury).", ar: "افصل بين العلاقة والصفقة الآنية -- احمِ العلاقة طويلة الأمد حتى أثناء التفاوض على بند معين." },
      { en: "Lead every conversation with the client's investment in the supplier's success, not with demands.", ar: "ابدأ كل محادثة باستثمار العميل في نجاح المورد، لا بالمطالب." },
      { en: "Offer to solve a real problem for the supplier -- forecast visibility, faster payment, engineering support -- before asking for anything in return.", ar: "اعرض حل مشكلة حقيقية للمورد -- كوضوح التوقعات، أو دفع أسرع، أو دعم هندسي -- قبل طلب أي شيء بالمقابل." },
      { en: "Never threaten to switch suppliers unless a real, funded alternative genuinely exists -- an empty threat, once discovered, damages trust permanently.", ar: "لا تهدّد بتغيير المورد إلا إذا كان هناك بديل حقيقي وممول فعلاً -- التهديد الفارغ، إذا اكتُشف، يضر بالثقة بشكل دائم." },
      { en: "Justify any price pushback with objective, published cost or market data so it reads as fact-based rather than adversarial.", ar: "برّر أي اعتراض على السعر ببيانات تكلفة أو سوق منشورة وموضوعية حتى يبدو مبنياً على الحقائق لا خصومياً." },
      { en: "Escalate to executive-to-executive contact rather than working-level pressure, which a scarce supplier can more easily ignore.", ar: "صعّد إلى تواصل تنفيذي بين الطرفين بدلاً من الضغط على المستوى التنفيذي الأدنى الذي يمكن للمورد النادر تجاهله بسهولة أكبر." },
      { en: "Document any verbal commitments in writing promptly -- goodwill fades faster than a signed provision.", ar: "وثّق أي التزامات شفهية كتابياً على الفور -- حسن النية يتلاشى أسرع من بند موقّع." },
    ],
    avoid: [
      { en: "Ultimatums or aggressive price pressure -- the client typically lacks the leverage to make these stick.", ar: "إنذارات نهائية أو ضغط سعري عدواني -- عادة ما يفتقر العميل للنفوذ اللازم لفرضها." },
      { en: "Single-issue, price-only bargaining, which ignores every lever that actually works in this quadrant.", ar: "مساومة أحادية القضية تقتصر على السعر وتتجاهل كل الأدوات الفعالة فعلياً في هذا الربع." },
      { en: "Any tactic that reads as adversarial toward a supplier that already holds the real leverage in the relationship.", ar: "أي تكتيك يبدو خصومياً تجاه مورد يملك النفوذ الحقيقي أصلاً في العلاقة." },
      { en: "Assuming the current sole-source status is permanent instead of actively working to end it.", ar: "افتراض أن وضع المصدر الوحيد الحالي دائم بدلاً من العمل الفعلي لإنهائه." },
    ],
    milObjectives: [
      { level: 'must', objective: { en: "A guaranteed minimum allocation or continuity commitment during any shortage, with documented force majeure and allocation-priority terms.", ar: "التزام بحد أدنى مضمون من التخصيص أو استمرارية الإمداد عند أي نقص، مع شروط موثقة للقوة القاهرة وأولوية التخصيص." } },
      { level: 'intend', objective: { en: "A long-term agreement with a defined volume commitment in exchange for price stability.", ar: "اتفاقية طويلة الأمد بالتزام كمية محدد مقابل استقرار السعر." } },
      { level: 'like', objective: { en: "Joint engineering collaboration or early access to the supplier's product roadmap.", ar: "تعاون هندسي مشترك أو اطلاع مبكر على خارطة طريق منتجات المورد." } },
    ],
  },
  'non-critical': {
    recommendedApproach: 'distributive',
    approachRationale: "Low profit impact and low supply risk mean the real question is not which tactic to use but whether negotiating hard is worth the transaction cost at all. CIPS and Kraljic literature agree the right strategy here is standardization and process efficiency, not negotiation intensity.",
    approachRationaleAr: "انخفاض التأثير على الربحية ومخاطر التوريد يعني أن السؤال الحقيقي ليس عن التكتيك المناسب، بل عمّا إذا كان التفاوض المكثف يستحق تكلفة المعاملة أصلاً. تتفق أدبيات CIPS وكرالييك على أن الاستراتيجية الصحيحة هنا هي التوحيد القياسي وكفاءة العملية، لا شدة التفاوض.",
    batnaGuidance: "BATNA is trivial to establish -- many substitutable suppliers exist by definition in this quadrant. The real decision is whether the effort of negotiating exceeds the savings realistically available.",
    batnaGuidanceAr: "بناء البديل الأفضل أمر بسيط هنا -- إذ يوجد العديد من الموردين القابلين للاستبدال بحكم تعريف هذا الربع. القرار الحقيقي هو ما إذا كان جهد التفاوض يفوق الوفورات المتاحة فعلياً.",
    zopaGuidance: "Narrow, price/terms-only zone of possible agreement; extensive multi-issue trade-off analysis is rarely justified for the spend and risk at stake.",
    zopaGuidanceAr: "منطقة اتفاق ممكنة ضيقة تقتصر على السعر والشروط؛ نادراً ما يكون تحليل المقايضات المتعدد القضايا مبرراً بالنظر إلى حجم الإنفاق والمخاطر المعنية.",
    additionalTactics: [
      { en: "Decide up front whether this negotiation is worth doing at all -- calculate the transaction cost before starting.", ar: "قرّر مسبقاً ما إذا كان هذا التفاوض يستحق الخوض فيه أصلاً -- احسب تكلفة المعاملة قبل البدء." },
      { en: "Use pre-negotiated framework or catalogue pricing wherever it already exists rather than opening a fresh negotiation.", ar: "استخدم التسعير الإطاري أو تسعير الكتالوج المتفاوض عليه مسبقاً كلما توفر بدلاً من فتح تفاوض جديد." },
      { en: "Delegate low-value negotiations to junior staff or automate acceptance entirely, reserving senior negotiator time for Leverage, Strategic, and Bottleneck categories.", ar: "فوّض المفاوضات منخفضة القيمة لموظفين مبتدئين أو أتمتة القبول بالكامل، واحتفظ بوقت كبار المفاوضين لفئات النفوذ والاستراتيجية والاختناق." },
      { en: "Accept reasonable supplier standard terms rather than spending negotiation capital disproportionate to the spend at stake.", ar: "اقبل الشروط القياسية المعقولة للمورد بدلاً من إنفاق رأس مال تفاوضي لا يتناسب مع حجم الإنفاق المعني." },
      { en: "Batch multiple small purchases into a single negotiation cycle to justify the time spent.", ar: "اجمع عدة مشتريات صغيرة في دورة تفاوض واحدة لتبرير الوقت المستغرق." },
    ],
    avoid: [
      { en: "Spending negotiation effort disproportionate to the spend or risk actually at stake in this quadrant.", ar: "إنفاق جهد تفاوضي لا يتناسب مع حجم الإنفاق أو المخاطر الفعلية في هذا الربع." },
      { en: "Treating every purchase as worthy of individual negotiation rather than standardizing.", ar: "معاملة كل عملية شراء وكأنها تستحق تفاوضاً فردياً بدلاً من التوحيد القياسي." },
    ],
    milObjectives: [
      { level: 'must', objective: { en: "Standard commercial terms with no unusual liability exposure.", ar: "شروط تجارية قياسية دون أي تعرض غير معتاد للمسؤولية." } },
      { level: 'intend', objective: { en: "Framework or catalogue pricing that avoids per-order negotiation.", ar: "تسعير إطاري أو كتالوجي يتجنب التفاوض في كل طلب." } },
      { level: 'like', objective: { en: "A minor payment-term extension or a small volume-based discount.", ar: "تمديد بسيط لشروط الدفع أو خصم صغير قائم على الكمية." } },
    ],
  },
};

/**
 * Recommends a negotiation approach for a Kraljic-classified sourcing
 * decision, and tightens that recommendation when a real relationship
 * mismatch has already been found by assessRelationshipCompatibility().
 *
 * tactics[] always leads with ACTION_PLANS[quadrant].negotiation/
 * negotiationAr -- ISC's existing, live, shipped negotiation content --
 * paired index-for-index into { en, ar }, followed by this module's
 * additional technique-level tactics. Reused, never re-derived.
 *
 * relationshipAdjustment is never guessed: it is populated only when a real
 * relationshipCompatibility object was computed (i.e. the client supplied
 * an actual, observed current posture), and only carries a specific note
 * when that check found a real gap worth acting on.
 */
export function recommendNegotiationStrategy(
  quadrant: KraljicQuadrant,
  relationshipCompatibility: RelationshipCompatibility | null,
): NegotiationStrategy {
  const profile = NEGOTIATION_PROFILE_BY_QUADRANT[quadrant];
  const existingPlan = ACTION_PLANS[quadrant];
  const reusedTactics: BilingualTactic[] = existingPlan.negotiation.map((en, i) => ({
    en,
    ar: existingPlan.negotiationAr[i] ?? '',
  }));

  let relationshipAdjustment: string | null = null;
  let relationshipAdjustmentAr: string | null = null;
  if (relationshipCompatibility) {
    const postureAr = getRelationshipStageProfile(relationshipCompatibility.currentPosture).labelAr;
    const idealPostureAr = getRelationshipStageProfile(relationshipCompatibility.idealPosture).labelAr;
    const quadrantAr = QUADRANT_META[quadrant].labelAr;
    if (relationshipCompatibility.severity === 'high-risk') {
      relationshipAdjustment = `The client's actual ${relationshipCompatibility.currentPosture} posture on this ${quadrant} supplier makes ${profile.recommendedApproach === 'distributive' ? 'distributive, price-led' : 'the usual'} tactics especially likely to backfire right now -- see relationshipCompatibility.advisory for the specific, real levers to use instead of pushing harder on price.`;
      relationshipAdjustmentAr = `الوضع العلائقي الفعلي (${postureAr}) لمورد فئة "${quadrantAr}" هذا يجعل تكتيكات ${profile.recommendedApproach === 'distributive' ? 'التفاوض التوزيعي القائم على السعر' : 'التفاوض المعتادة'} أكثر عرضة للارتداد سلباً الآن -- راجع نص التوصية (advisoryAr) في فحص توافق العلاقة للحصول على الأدوات الفعلية المحددة بدلاً من زيادة الضغط على السعر.`;
    } else if (relationshipCompatibility.severity === 'monitor') {
      relationshipAdjustment = `The client's current ${relationshipCompatibility.currentPosture} posture is close to, but not fully at, this quadrant's ideal (${relationshipCompatibility.idealPosture}) -- proceed with the strategy below, but treat closing that gap as part of the negotiation's own agenda, not a separate initiative.`;
      relationshipAdjustmentAr = `الوضع العلائقي الحالي (${postureAr}) قريب من المستوى المثالي لهذا الربع (${idealPostureAr}) لكنه لم يصل إليه بالكامل -- امضِ في الاستراتيجية أدناه، لكن عامل سدّ هذه الفجوة كجزء من أجندة التفاوض نفسها، لا كمبادرة منفصلة.`;
    } else {
      relationshipAdjustment = `The client's current ${relationshipCompatibility.currentPosture} posture already matches this quadrant's ideal -- the strategy below can be applied directly without a relationship-repair step first.`;
      relationshipAdjustmentAr = `الوضع العلائقي الحالي (${postureAr}) يطابق بالفعل المستوى المثالي لهذا الربع -- يمكن تطبيق الاستراتيجية أدناه مباشرة دون الحاجة لخطوة إصلاح علاقة أولاً.`;
    }
  }

  return {
    quadrant,
    recommendedApproach: profile.recommendedApproach,
    approachRationale: profile.approachRationale,
    approachRationaleAr: profile.approachRationaleAr,
    batnaGuidance: profile.batnaGuidance,
    batnaGuidanceAr: profile.batnaGuidanceAr,
    zopaGuidance: profile.zopaGuidance,
    zopaGuidanceAr: profile.zopaGuidanceAr,
    tactics: [...reusedTactics, ...profile.additionalTactics],
    avoid: profile.avoid,
    milGuidance: MIL_GUIDANCE,
    milGuidanceAr: MIL_GUIDANCE_AR,
    milObjectives: profile.milObjectives,
    relationshipAdjustment,
    relationshipAdjustmentAr,
  };
}

/* ------------------------------------------------------------------------
 * Negotiation Plan Document -- combines this module's own quadrant-level
 * strategy (approach/BATNA/ZOPA/MIL, above) with negotiationTactics.ts's
 * named-tactic library and team/level structure into one client-ready
 * document. Direct response to: "some good companies build negotiation
 * strategy docs that have all roles, participants, tactics... for
 * complicated cases... more than one level of negotiation" and "make that
 * clear when, where, how, follow up and results achievement for whoever
 * wants to use negotiation tactics" -- the per-tactic when/where/how/
 * followUp/desiredResult/counterTactic fields answering the latter live on
 * NamedNegotiationTactic itself (negotiationTactics.ts), not duplicated
 * here.
 * ------------------------------------------------------------------------ */

export interface NegotiationPlanDocument {
  quadrant: KraljicQuadrant;
  /** The client-side negotiation team for this quadrant's complexity --
   *  full 6-role team for Strategic/Bottleneck, a lean 2-role team for
   *  Leverage/Non-critical. See buildNegotiationTeam() in
   *  negotiationTactics.ts. */
  team: NegotiationRole[];
  /** 3-level structure (technical pre-negotiation, commercial, executive
   *  escalation) for Strategic/Bottleneck; a single round otherwise. See
   *  recommendNegotiationLevels() in negotiationTactics.ts. */
  levels: NegotiationLevel[];
  /** Low-ethical-risk tactics appropriate for the client to actually use in
   *  this quadrant, each carrying its own when/where/how/followUp/
   *  desiredResult fields. */
  recommendedTactics: NamedNegotiationTactic[];
  /** Moderate/high-ethical-risk tactics the client should watch for from a
   *  counterpart in this quadrant, each carrying its own counterTactic. */
  watchForTactics: NamedNegotiationTactic[];
}

/**
 * Assembles the full negotiation plan document for a Kraljic-classified
 * sourcing decision. Deliberately thin -- every real piece of content
 * (team roles, level structure, tactic library) already lives in
 * negotiationTactics.ts; this function only selects and packages it by
 * quadrant, exactly the same reuse discipline recommendNegotiationStrategy()
 * already applies to ACTION_PLANS.
 */
export function buildNegotiationPlan(quadrant: KraljicQuadrant): NegotiationPlanDocument {
  return {
    quadrant,
    team: buildNegotiationTeam(quadrant),
    levels: recommendNegotiationLevels(quadrant),
    recommendedTactics: recommendClientTactics(quadrant),
    watchForTactics: recommendWatchForTactics(quadrant),
  };
}
