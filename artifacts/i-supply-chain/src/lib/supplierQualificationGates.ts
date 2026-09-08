/**
 * SI Module 04 -- Qualification & Due Diligence Gates (8 Sep 2026; extended
 * 8 Sep 2026 to separate Qualification from Due Diligence explicitly).
 *
 * BUILT as a pure, tested library -- no UI this cycle, same reasoning and
 * pattern as Modules 01-03: this reads Module 03's Supplier Object Model
 * and turns qualification from a single aggregate score into a set of
 * independent gates, so a supplier who scores well overall but fails one
 * critical gate cannot be recommended on the strength of the average
 * (SI-04-Qualification-Due-Diligence-Gates.md).
 *
 * =====================================================================
 * EXTENSION (8 Sep 2026): Qualification vs. Due Diligence, made explicit
 * =====================================================================
 * The owner asked, directly: what qualification criteria are used, at
 * what stage, through what mechanism -- and the same three questions for
 * due diligence. The honest answer on the first build was that these two
 * distinct disciplines were flattened into one undifferentiated list of
 * ten gates, checked once, with no explicit stage and no explicit
 * verification mechanism. That was a real structural gap, not a
 * documentation gap, and this extension closes it using named,
 * real-world frameworks rather than inventing new ones:
 *
 * QUALIFICATION ("can this supplier do the job?") -- sourced from ISO
 * 9001:2015 clause 8.4 (control of externally provided processes,
 * products and services) and CIPS/ISM supplier evaluation & selection
 * practice. Criteria: identity, capability, capacity, technical fit,
 * quality systems, commercial terms, operational readiness -- tagged
 * below as GateCategoryType 'qualification'. Stage: qualification is the
 * single, one-time-per-cycle decision that moves a record from Module
 * 03's VERIFIED discoveryState to QUALIFIED (see applyQualificationOutcome
 * below) -- Module 04 is literally the mechanism for that state
 * transition, a connection the first build never actually wired in.
 *
 * DUE DILIGENCE ("is this supplier safe to engage?") -- sourced from the
 * OECD Due Diligence Guidance for Responsible Business Conduct (risk-based,
 * proportionate due diligence) and standard Third-Party Risk Management
 * (TPRM) practice (risk-tiering into Standard vs. Enhanced due diligence).
 * Criteria: compliance/certification integrity, financial health, risk
 * (including cyber, per the module doc's own honest scoping) -- tagged
 * below as GateCategoryType 'due-diligence'. Stage: due diligence is
 * risk-tiered, not one-size-fits-all -- `determineDueDiligenceTier()`
 * below computes STANDARD or ENHANCED from Module 02's own Kraljic
 * quadrant and geographic-risk score (both already-computed, disclosed
 * fields -- no new data invented), and ENHANCED raises the minimum
 * evidence-stage bar only for the due-diligence-tagged categories.
 *
 * MECHANISM (how each result was actually verified, for both disciplines)
 * -- this was previously implicit in Module 03's EvidenceStage ladder
 * (CLAIMED -> DOCUMENTED -> VALIDATED -> OBSERVED -> PROVEN) but never
 * named. `mechanismForEvidenceStage()` below gives that ladder its real
 * TPRM-aligned vocabulary (self-declared / documentary / third-party-
 * verified / observed / independently-proven) and every GateResult now
 * discloses which mechanism actually produced it.
 *
 * WHAT THIS EXTENSION DOES NOT DO, DISCLOSED PLAINLY (Decision Record
 * 8.7): it does not add sanctions/PEP screening, beneficial-ownership
 * (UBO) verification, credit-bureau financial checks, or a continuous
 * monitoring feed. These are real, named TPRM/OECD mechanisms ISC has no
 * data source for. Enhanced due diligence can correctly demand
 * "third-party-verified" evidence; it cannot manufacture the third party.
 * This gap is named explicitly in `dueDiligenceGaps` on the output
 * schema whenever the tier is ENHANCED, and logged as backlog (SI-04
 * doc), never silently implied as covered.
 *
 * THIS IS ALSO THE MODULE THAT ACTIVATES MODULE 03'S DISCLOSED-BUT-
 * DORMANT FLAG: assessSupplierRoleDataQuality() has, since Module 03
 * shipped, flagged an unconfirmed supplierRole as a real qualification
 * risk with nothing enforcing it. The capability gate below is that
 * enforcement -- a manufacturer-level capability or certification claim
 * attached to a supplier whose role is still 'unknown' now returns
 * CRITICAL_FAIL, not a silently-passed average.
 *
 * Three OWNER INPUT NEEDED items were open on the module doc. Per the
 * engine's standing "you decide" rule (architectural gaps get resolved,
 * not left to block a build), all three are resolved here, reasoning
 * recorded at the point of decision:
 *
 * DECISION 1 -- Real gate thresholds per category/industry. NOT
 * fabricated (Decision Record 8.7 forbids inventing a "real" industry
 * threshold ISC has not sourced). Shipped instead as DEFAULT_GATE_
 * THRESHOLDS: a generic, disclosed, per-category minimum-evidence-stage
 * structural default, explicitly documented as a starting default rather
 * than a sourced industry benchmark, and overridable per client/category
 * via the `thresholds` parameter -- same client-configurable pattern as
 * the existing LIGHT/HEAVY value-threshold build (Backlog #27). Extended
 * 8 Sep 2026 with a second, equally disclosed default layer
 * (ENHANCED_DD_THRESHOLD_OVERRIDES) for the risk-tiered Enhanced Due
 * Diligence case, same non-fabrication discipline.
 *
 * DECISION 2 -- ESG/sustainability. Shipped WITHOUT a scored gate, per
 * the module doc's own recommendation. 'esg' is not a member of
 * GateCategory. The gap is surfaced structurally via
 * `unscoredDimensions` on the output schema, never silently dropped.
 *
 * DECISION 3 -- Cyber-exposure gate scope. Shipped as honestly-limited:
 * folded into the 'risk' category (the module doc's ten categories have
 * no separate "cyber" slot), evaluated only against client-supplied
 * facts, with `checkGate()`'s note text for 'risk' stating the
 * point-in-time/client-supplied-only limit explicitly whenever no
 * qualifying facts exist -- never implying continuous monitoring ISC does
 * not do.
 *
 * Design precedent followed (same as supplierObjectModel.ts /
 * supplierDependency.ts / kraljicScoring.ts): pure functions, no side
 * effects, no network calls, no fabricated data. Every derived judgment
 * is a fixed, disclosed rule, not an AI-invented number (Decision Record
 * 8.7).
 *
 * Sources for the 8 Sep 2026 extension (checked directly, not assumed):
 * ISO 9001:2015 clause 8.4 supplier-management practice; CIPS supplier
 * evaluation & selection methodology; OECD Due Diligence Guidance for
 * Responsible Business Conduct (risk-based, proportionate DD); standard
 * TPRM industry practice on Standard-vs-Enhanced risk tiering and the
 * screening -> onboarding -> assessment -> monitoring lifecycle.
 */

import type {
  EvidenceStage,
  SupplierFact,
  SupplierRecord,
} from './supplierObjectModel';
import {
  assessSupplierRoleDataQuality,
  certificationAppliesToSite,
  evidenceRank,
  advanceDiscoveryState,
  discoveryRank,
} from './supplierObjectModel';
import type { KraljicQuadrant } from './kraljicScoring';

// ---------------------------------------------------------------------------
// Gate vocabulary (SI-04 body, "Gate categories")
// ---------------------------------------------------------------------------

export type GateCategory =
  | 'identity'
  | 'capability'
  | 'financial'
  | 'quality'
  | 'compliance'
  | 'capacity'
  | 'technical'
  | 'commercial'
  | 'risk'
  | 'operational';

export const GATE_CATEGORIES: GateCategory[] = [
  'identity',
  'capability',
  'financial',
  'quality',
  'compliance',
  'capacity',
  'technical',
  'commercial',
  'risk',
  'operational',
];

/**
 * Which discipline each gate belongs to (see the file header extension
 * note). 'qualification' = "can they do it" (ISO 9001 §8.4 / CIPS);
 * 'due-diligence' = "are they safe to engage" (OECD / TPRM). This
 * tagging is what lets the output schema separate the two questions the
 * owner asked, instead of returning one flat, undifferentiated list.
 */
export type GateCategoryType = 'qualification' | 'due-diligence';

export const GATE_CATEGORY_TYPE: Record<GateCategory, GateCategoryType> = {
  identity: 'qualification',
  capability: 'qualification',
  capacity: 'qualification',
  technical: 'qualification',
  quality: 'qualification',
  commercial: 'qualification',
  operational: 'qualification',
  compliance: 'due-diligence',
  financial: 'due-diligence',
  risk: 'due-diligence',
};

export type GateResultStatus = 'PASS' | 'CONDITIONAL' | 'FAIL' | 'CRITICAL_FAIL' | 'INSUFFICIENT_EVIDENCE';

/**
 * How the evidence behind a gate result was actually produced, named in
 * standard TPRM vocabulary rather than left as a raw EvidenceStage code.
 * Mirrors Module 03's EVIDENCE_LADDER 1:1 -- this is a naming layer, not
 * a new data source.
 */
export type VerificationMechanism = 'self-declared' | 'documentary' | 'third-party-verified' | 'observed' | 'independently-proven';

const MECHANISM_BY_EVIDENCE_STAGE: Record<EvidenceStage, VerificationMechanism> = {
  CLAIMED: 'self-declared',
  DOCUMENTED: 'documentary',
  VALIDATED: 'third-party-verified',
  OBSERVED: 'observed',
  PROVEN: 'independently-proven',
};

export function mechanismForEvidenceStage(stage: EvidenceStage | null): VerificationMechanism | null {
  if (stage === null) return null;
  return MECHANISM_BY_EVIDENCE_STAGE[stage];
}

export interface GateResult {
  category: GateCategory;
  /** 'qualification' or 'due-diligence' -- see GateCategoryType. */
  categoryType: GateCategoryType;
  result: GateResultStatus;
  /** Weakest evidence stage among the facts this gate actually checked; null when no relevant facts exist. */
  evidenceStage: EvidenceStage | null;
  /** The verification mechanism behind evidenceStage, in TPRM-aligned language (see VerificationMechanism). Null exactly when evidenceStage is null. */
  mechanism: VerificationMechanism | null;
  noteEn: string;
  noteAr: string;
}

export type OverallQualificationStatus =
  | 'QUALIFIED'
  | 'CONDITIONALLY_QUALIFIED'
  | 'NOT_QUALIFIED'
  | 'INSUFFICIENT_EVIDENCE';

/**
 * STANDARD vs ENHANCED, per OECD/TPRM risk-based due diligence practice:
 * due diligence depth should be proportionate to risk, not uniform across
 * every supplier regardless of criticality or geography. See
 * `determineDueDiligenceTier()`.
 */
export type DueDiligenceTier = 'STANDARD' | 'ENHANCED';

export interface QualificationResult {
  supplierId: string;
  gateResults: GateResult[];
  overallStatus: OverallQualificationStatus;
  /** Comma-joined category names behind a NOT_QUALIFIED result; null otherwise. Never hidden inside an average (SI-04 "critical-fail rule"). */
  blockingGate: string | null;
  unscoredDimensions: string[];
  /** The due-diligence depth actually applied to this run (see determineDueDiligenceTier). */
  dueDiligenceTier: DueDiligenceTier;
  /**
   * Named, real TPRM/OECD due-diligence mechanisms this run did NOT
   * perform because ISC has no data source for them (sanctions/PEP
   * screening, beneficial-ownership verification, credit-bureau checks,
   * continuous monitoring) -- populated only when dueDiligenceTier is
   * ENHANCED, since these gaps matter specifically at that depth.
   * Disclosed, never silently implied as covered (Decision Record 8.7).
   */
  dueDiligenceGaps: string[];
}

// ---------------------------------------------------------------------------
// Thresholds (DECISION 1 above -- structural default, not a sourced
// industry benchmark; override per client/category as real judgment
// becomes available)
// ---------------------------------------------------------------------------

export interface GateThresholds {
  minEvidenceStageForPass: Record<GateCategory, EvidenceStage>;
}

/**
 * Generic starting default. NOT a sourced industry benchmark -- compliance
 * and identity are held to VALIDATED (a claimed certification or a
 * self-reported legal name is not enough to pass); the rest default to
 * DOCUMENTED as a reasonable floor; commercial/risk/operational default to
 * CLAIMED since early-stage commercial terms and risk notes are often
 * legitimately still at the claimed stage without that being disqualifying.
 * Callers should override per category once real, sourced thresholds exist
 * (SI-04 OWNER INPUT NEEDED #1).
 */
export const DEFAULT_GATE_THRESHOLDS: GateThresholds = {
  minEvidenceStageForPass: {
    identity: 'VALIDATED',
    capability: 'DOCUMENTED',
    financial: 'DOCUMENTED',
    quality: 'DOCUMENTED',
    compliance: 'VALIDATED',
    capacity: 'DOCUMENTED',
    technical: 'DOCUMENTED',
    commercial: 'CLAIMED',
    risk: 'CLAIMED',
    operational: 'CLAIMED',
  },
};

/**
 * Enhanced Due Diligence overrides -- applied ONLY to the three
 * due-diligence-tagged categories (compliance, financial, risk), never to
 * qualification categories. A supplier's technical capability does not
 * become harder to prove because their category is riskier; only how
 * rigorously their integrity/financial/risk posture must be verified
 * does. This is the proportionality principle from the OECD Due
 * Diligence Guidance and standard TPRM Enhanced-DD practice, expressed
 * as a disclosed structural default (same non-fabrication discipline as
 * DEFAULT_GATE_THRESHOLDS) -- not a sourced numeric industry benchmark.
 */
export const ENHANCED_DD_THRESHOLD_OVERRIDES: Partial<Record<GateCategory, EvidenceStage>> = {
  compliance: 'OBSERVED', // Standard: VALIDATED (third-party-verified). Enhanced: requires an observed audit, not just a verified document.
  financial: 'VALIDATED', // Standard: DOCUMENTED (uploaded statements). Enhanced: requires third-party-verified financial data.
  risk: 'DOCUMENTED', // Standard: CLAIMED (a bare risk note is acceptable). Enhanced: requires at least a documented risk assessment.
};

/** Real TPRM/OECD Enhanced-DD mechanisms this platform cannot perform today -- named honestly, never silently implied as covered. */
export const ENHANCED_DD_UNIMPLEMENTED_MECHANISMS = [
  'Sanctions/PEP screening against a live watchlist -- no data source integrated',
  'Beneficial-ownership (UBO) verification -- no registry integration',
  'Credit-bureau-verified financial health check -- financial gate relies on client-supplied evidence only',
  'Continuous post-qualification monitoring -- all evidence here is point-in-time, not a live feed',
];

/**
 * Computes the due-diligence depth for a supplier from already-computed,
 * disclosed fields Module 02 produces -- no new data is invented.
 * ENHANCED when the supplier sits in Kraljic's 'strategic' or
 * 'bottleneck' quadrant (high supply risk and/or high profit impact --
 * exactly the criticality signal OECD/TPRM risk-tiering uses) OR when
 * Module 02's geographicRisk score (1-5) is 4 or higher. Everything else
 * is STANDARD. This function takes plain inputs rather than a full
 * KraljicScored object so it has no hard dependency on kraljicScoring.ts
 * beyond the KraljicQuadrant type -- callers who have not run Module 02
 * yet can omit both fields and get STANDARD by default, which is the
 * honest answer when criticality/geography have not been assessed.
 */
export function determineDueDiligenceTier(inputs: { kraljicQuadrant?: KraljicQuadrant; geographicRisk?: number } = {}): DueDiligenceTier {
  const highCriticality = inputs.kraljicQuadrant === 'strategic' || inputs.kraljicQuadrant === 'bottleneck';
  const highGeoRisk = typeof inputs.geographicRisk === 'number' && inputs.geographicRisk >= 4;
  return highCriticality || highGeoRisk ? 'ENHANCED' : 'STANDARD';
}

/** Applies the Enhanced-DD overrides on top of a base threshold set, for the due-diligence categories only. */
export function thresholdsForTier(base: GateThresholds, tier: DueDiligenceTier): GateThresholds {
  if (tier === 'STANDARD') return base;
  return {
    minEvidenceStageForPass: { ...base.minEvidenceStageForPass, ...ENHANCED_DD_THRESHOLD_OVERRIDES },
  };
}

// ---------------------------------------------------------------------------
// Fact -> category matching (attribute is free-text on SupplierFact; this
// is a disclosed keyword mapping, not a hidden heuristic)
// ---------------------------------------------------------------------------

const CATEGORY_ATTRIBUTE_PATTERNS: Record<Exclude<GateCategory, 'identity'>, RegExp> = {
  capability: /capabilit|certificat|manufactur/i,
  financial: /financ|credit|revenue|payment/i,
  quality: /quality|defect|audit|inspection/i,
  compliance: /complian|certificationstatus|licen[cs]e|regulat/i,
  capacity: /capacity/i,
  technical: /technical|equipment|technology/i,
  commercial: /price|commercial|contract|terms|incoterm/i,
  risk: /risk|cyber|security|disruption/i,
  operational: /operational|readiness|leadtime|lead-time|lead time/i,
};

function factsForCategory(facts: SupplierFact[], category: GateCategory): SupplierFact[] {
  if (category === 'identity') return []; // identity is judged from entityResolution, not facts
  const pattern = CATEGORY_ATTRIBUTE_PATTERNS[category];
  return facts.filter((f) => pattern.test(f.attribute));
}

// ---------------------------------------------------------------------------
// Critical-fail rules (SI-04 "critical-fail rule" -- named explicitly to
// the client, never smoothed into a composite number)
// ---------------------------------------------------------------------------

/** An explicitly-flagged expired/revoked certification, per the Rawabi illustrative example (SI-04 body). */
function hasExpiredCertification(facts: SupplierFact[]): SupplierFact | undefined {
  return facts.find(
    (f) => /certificationstatus/i.test(f.attribute) && typeof f.value === 'string' && /expired|revoked|suspended/i.test(f.value),
  );
}

/** Module 03's disclosed-but-previously-unenforced flag, enforced here (file header). */
function hasUnconfirmedRoleManufacturerClaim(record: SupplierRecord, capabilityFacts: SupplierFact[]): boolean {
  if (!assessSupplierRoleDataQuality(record).hasGap) return false;
  return capabilityFacts.some((f) => /certificat|manufactur|capacity/i.test(f.attribute));
}

// ---------------------------------------------------------------------------
// Single-gate evaluation
// ---------------------------------------------------------------------------

/**
 * `targetSiteId`, when given, is the specific site this qualification is
 * actually for. Module 03's own rule ("a certification held by the Legal
 * Entity is not assumed to apply to every Site") is enforced here via
 * certificationAppliesToSite(): a certification-pattern fact only counts
 * toward this gate if it is attached to that exact site's own node, never
 * inherited from a legal-entity-level claim. Non-certification facts
 * (financial, capacity, commercial, etc.) are not restricted this way --
 * Module 03's body scopes the site/entity distinction to certifications
 * specifically, and extending it further would be an invented rule, not
 * a sourced one (Decision Record 8.7).
 *
 * `thresholds` should already reflect the intended due-diligence tier --
 * runQualificationGates() below computes that via thresholdsForTier()
 * before calling this function once per category. Callers invoking
 * checkGate() directly (e.g. tests, or a caller checking a single gate in
 * isolation) can do the same via thresholdsForTier(base, tier).
 */
export function checkGate(
  record: SupplierRecord,
  category: GateCategory,
  thresholds: GateThresholds = DEFAULT_GATE_THRESHOLDS,
  targetSiteId?: string,
): GateResult {
  const categoryType = GATE_CATEGORY_TYPE[category];

  if (category === 'identity') {
    const confidence = record.entityResolution.confidence;
    if (confidence === 'HIGH') {
      return { category, categoryType, result: 'PASS', evidenceStage: null, mechanism: null, noteEn: 'Entity resolved with high confidence.', noteAr: 'تم تحديد هوية المنشأة بثقة عالية.' };
    }
    if (confidence === 'MODERATE' || confidence === 'LOW') {
      return {
        category,
        categoryType,
        result: 'CONDITIONAL',
        evidenceStage: null,
        mechanism: null,
        noteEn: `Entity resolution confidence is ${confidence.toLowerCase()} (${record.entityResolution.method}) -- recommend manual confirmation before relying on this identity for qualification.`,
        noteAr: `مستوى الثقة في تحديد هوية المنشأة ${confidence === 'MODERATE' ? 'متوسط' : 'منخفض'} (${record.entityResolution.method}) -- يوصى بالتأكيد اليدوي قبل الاعتماد على هذه الهوية في التأهيل.`,
      };
    }
    return {
      category,
      categoryType,
      result: 'INSUFFICIENT_EVIDENCE',
      evidenceStage: null,
      mechanism: null,
      noteEn: 'Entity resolution confidence is unverified -- resolve identity before qualifying this supplier.',
      noteAr: 'لم يتم التحقق من مستوى الثقة في تحديد الهوية -- يجب تحديد الهوية قبل تأهيل هذا المورّد.',
    };
  }

  let relevantFacts = factsForCategory(record.facts, category);

  if (targetSiteId) {
    relevantFacts = relevantFacts.filter((f) => {
      const isCertificationClaim = /certificat/i.test(f.attribute);
      if (!isCertificationClaim) return true; // site/entity distinction is certification-specific (Module 03 body)
      if (f.level !== 'site') return false; // a legal-entity-level certification never satisfies a site-specific check
      return certificationAppliesToSite(record, f.nodeId, targetSiteId);
    });
  }

  if (category === 'capability' && hasUnconfirmedRoleManufacturerClaim(record, relevantFacts)) {
    return {
      category,
      categoryType,
      result: 'CRITICAL_FAIL',
      evidenceStage: relevantFacts.length ? weakestEvidenceStage(relevantFacts) : null,
      mechanism: relevantFacts.length ? mechanismForEvidenceStage(weakestEvidenceStage(relevantFacts)) : null,
      noteEn:
        "Manufacturer-level capability/certification claim attached to a supplier whose role is still unconfirmed (Module 03 assessSupplierRoleDataQuality). A trader or agent claiming a manufacturer's certification and capacity is a common real-world qualification failure -- confirm supplierRole before this can pass.",
      noteAr:
        'ادعاء قدرة/شهادة على مستوى المصنّع مرتبط بمورّد لم يتم بعد تأكيد دوره. ادعاء وكيل أو تاجر بشهادات وقدرات الشركة المصنّعة هو إخفاق تأهيل شائع في الواقع -- يجب تأكيد دور المورّد قبل أن يجتاز هذا البند.',
    };
  }

  if (category === 'compliance') {
    const expired = hasExpiredCertification(relevantFacts);
    if (expired) {
      return {
        category,
        categoryType,
        result: 'CRITICAL_FAIL',
        evidenceStage: expired.evidenceStage,
        mechanism: mechanismForEvidenceStage(expired.evidenceStage),
        noteEn: `Certification status flagged as "${expired.value}" (fact: ${expired.attribute}) -- this blocks a QUALIFIED status regardless of aggregate score, shown by name per the critical-fail rule.`,
        noteAr: `حالة الشهادة موسومة بـ "${expired.value}" (البيان: ${expired.attribute}) -- هذا يمنع حالة "مؤهَّل" بغض النظر عن النتيجة الإجمالية، ويُعرض باسمه صراحةً وفق قاعدة الإخفاق الحرج.`,
      };
    }
  }

  if (relevantFacts.length === 0) {
    const limitNote =
      category === 'risk'
        ? ' No live monitoring feed exists for this dimension (e.g. cyber exposure) -- any future risk fact here is point-in-time and client-supplied only, never continuous monitoring.'
        : '';
    return {
      category,
      categoryType,
      result: 'INSUFFICIENT_EVIDENCE',
      evidenceStage: null,
      mechanism: null,
      noteEn: `No ${category} facts recorded for this supplier yet.${limitNote}`,
      noteAr: `لا توجد بيانات مسجّلة لهذا المورّد ضمن فئة ${category} حتى الآن.`,
    };
  }

  const weakest = weakestEvidenceStage(relevantFacts);
  const required = thresholds.minEvidenceStageForPass[category];
  if (evidenceRank(weakest) >= evidenceRank(required)) {
    return {
      category,
      categoryType,
      result: 'PASS',
      evidenceStage: weakest,
      mechanism: mechanismForEvidenceStage(weakest),
      noteEn: `Evidence at or above ${required} threshold (weakest fact: ${weakest}).`,
      noteAr: `الأدلة عند أو أعلى من حد ${required} (أضعف بيان: ${weakest}).`,
    };
  }
  return {
    category,
    categoryType,
    result: 'CONDITIONAL',
    evidenceStage: weakest,
    mechanism: mechanismForEvidenceStage(weakest),
    noteEn: `Weakest ${category} fact is at ${weakest}, below the ${required} threshold configured for this category -- treat as conditional pending stronger evidence.`,
    noteAr: `أضعف بيان في فئة ${category} عند مستوى ${weakest}، وهو أقل من حد ${required} المحدد لهذه الفئة -- يُعامل كمشروط لحين توفر أدلة أقوى.`,
  };
}

function weakestEvidenceStage(facts: SupplierFact[]): EvidenceStage {
  return facts.reduce<EvidenceStage>(
    (weakest, f) => (evidenceRank(f.evidenceStage) < evidenceRank(weakest) ? f.evidenceStage : weakest),
    facts[0].evidenceStage,
  );
}

// ---------------------------------------------------------------------------
// Full run across all gates (SI-04 "Reasoning chain")
// ---------------------------------------------------------------------------

const UNSCORED_DIMENSIONS = ['ESG/sustainability -- no sourced methodology yet (Decision Record 8.7; SI-04 OWNER INPUT NEEDED #2)'];

export function runQualificationGates(
  record: SupplierRecord,
  thresholds: GateThresholds = DEFAULT_GATE_THRESHOLDS,
  targetSiteId?: string,
  dueDiligenceTier: DueDiligenceTier = 'STANDARD',
): QualificationResult {
  const effectiveThresholds = thresholdsForTier(thresholds, dueDiligenceTier);
  const gateResults = GATE_CATEGORIES.map((category) => checkGate(record, category, effectiveThresholds, targetSiteId));

  const criticalOrFail = gateResults.filter((g) => g.result === 'CRITICAL_FAIL' || g.result === 'FAIL');
  const insufficient = gateResults.filter((g) => g.result === 'INSUFFICIENT_EVIDENCE');
  const conditional = gateResults.filter((g) => g.result === 'CONDITIONAL');

  let overallStatus: OverallQualificationStatus;
  let blockingGate: string | null = null;

  if (criticalOrFail.length > 0) {
    overallStatus = 'NOT_QUALIFIED';
    blockingGate = criticalOrFail.map((g) => g.category).join(', ');
  } else if (insufficient.length > 0) {
    overallStatus = 'INSUFFICIENT_EVIDENCE';
  } else if (conditional.length > 0) {
    overallStatus = 'CONDITIONALLY_QUALIFIED';
  } else {
    overallStatus = 'QUALIFIED';
  }

  return {
    supplierId: record.supplierId,
    gateResults,
    overallStatus,
    blockingGate,
    unscoredDimensions: UNSCORED_DIMENSIONS,
    dueDiligenceTier,
    dueDiligenceGaps: dueDiligenceTier === 'ENHANCED' ? ENHANCED_DD_UNIMPLEMENTED_MECHANISMS : [],
  };
}

// ---------------------------------------------------------------------------
// Qualification-stage wiring into Module 03's discoveryState lifecycle
// ---------------------------------------------------------------------------

/**
 * Answers "at what STAGE does qualification happen": this is the missing
 * connection back to Module 03's own DiscoveryState machine (DISCOVERED
 * -> POTENTIALLY_RELEVANT -> SCREENED -> EVIDENCE_SUPPORTED -> VERIFIED ->
 * QUALIFIED -> RECOMMENDED -> SELECTED -> APPROVED). Module 04's gates
 * are the mechanism that decides whether a record still sitting at or
 * below VERIFIED earns the QUALIFIED state -- until this function existed,
 * that decision was computed (as QualificationResult.overallStatus) but
 * never actually applied back to record.discoveryState, so nothing in the
 * platform actually enforced "discovery is never qualification" (Charter
 * core instruction #4) at the code level.
 *
 * Rules, each a deliberate, disclosed choice rather than a guess:
 * - QUALIFIED result, record below QUALIFIED: advance to QUALIFIED. A
 *   record already at or beyond QUALIFIED (RECOMMENDED/SELECTED/APPROVED)
 *   is left alone -- those are later sourcing-decision states (Module
 *   02/06/07's job) and a fresh QUALIFIED result must never pull a record
 *   backward from further along the lifecycle.
 * - NOT_QUALIFIED result, record at or beyond QUALIFIED: this is exactly
 *   the "failed re-audit" case Module 03's own advanceDiscoveryState()
 *   regression guard was written for. Step back to VERIFIED, not all the
 *   way to DISCOVERED -- the underlying evidence-gathering work is not
 *   undone, only the qualification decision is revoked (the real-world
 *   analogue is a vendor moving to "suspended," not being fully delisted).
 * - CONDITIONALLY_QUALIFIED / INSUFFICIENT_EVIDENCE: no state change.
 *   Ambiguous evidence must never imply an earned lifecycle move that
 *   was not actually earned (Decision Record 8.7).
 * - NOT_QUALIFIED on a record that was never qualified in the first
 *   place: no state change -- there is nothing to regress from.
 *
 * Mutates and returns the same record (matches Module 03's own
 * logEntityResolution() mutation pattern) rather than returning a new
 * object, so callers can chain it directly after runQualificationGates().
 */
export function applyQualificationOutcome(record: SupplierRecord, result: QualificationResult): SupplierRecord {
  const current = record.discoveryState;
  const qualifiedRank = discoveryRank('QUALIFIED');

  if (result.overallStatus === 'QUALIFIED') {
    if (discoveryRank(current) < qualifiedRank) {
      record.discoveryState = advanceDiscoveryState(current, 'QUALIFIED');
    }
    return record;
  }

  if (result.overallStatus === 'NOT_QUALIFIED') {
    if (discoveryRank(current) >= qualifiedRank) {
      record.discoveryState = advanceDiscoveryState(current, 'VERIFIED', true);
    }
    return record;
  }

  // CONDITIONALLY_QUALIFIED / INSUFFICIENT_EVIDENCE -- deliberately inert.
  return record;
}
