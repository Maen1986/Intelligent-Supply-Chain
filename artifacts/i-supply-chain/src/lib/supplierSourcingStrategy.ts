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

import { scoreItems, type KraljicItem, type KraljicScored, type KraljicQuadrant } from '@/lib/kraljicScoring';
import { scoreOptions, type DecisionScenario, type ScoredOption } from '@/lib/decisionLab';

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

