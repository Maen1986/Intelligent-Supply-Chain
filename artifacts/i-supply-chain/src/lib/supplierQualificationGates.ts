/**
 * SI Module 04 -- Qualification & Due Diligence Gates (8 Sep 2026).
 *
 * BUILT as a pure, tested library -- no UI this cycle, same reasoning and
 * pattern as Modules 01-03: this reads Module 03's Supplier Object Model
 * and turns qualification from a single aggregate score into a set of
 * independent gates, so a supplier who scores well overall but fails one
 * critical gate cannot be recommended on the strength of the average
 * (SI-04-Qualification-Due-Diligence-Gates.md).
 *
 * THIS IS THE MODULE THAT ACTIVATES MODULE 03'S DISCLOSED-BUT-DORMANT
 * FLAG: assessSupplierRoleDataQuality() has, since Module 03 shipped,
 * flagged an unconfirmed supplierRole as a real qualification risk with
 * nothing enforcing it. The capability gate below is that enforcement --
 * a manufacturer-level capability or certification claim attached to a
 * supplier whose role is still 'unknown' now returns CRITICAL_FAIL, not a
 * silently-passed average.
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
 * the existing LIGHT/HEAVY value-threshold build (Backlog #27).
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
 */

import type {
  EvidenceStage,
  SupplierFact,
  SupplierRecord,
} from './supplierObjectModel';
import { assessSupplierRoleDataQuality, certificationAppliesToSite, evidenceRank } from './supplierObjectModel';

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

export type GateResultStatus = 'PASS' | 'CONDITIONAL' | 'FAIL' | 'CRITICAL_FAIL' | 'INSUFFICIENT_EVIDENCE';

export interface GateResult {
  category: GateCategory;
  result: GateResultStatus;
  /** Weakest evidence stage among the facts this gate actually checked; null when no relevant facts exist. */
  evidenceStage: EvidenceStage | null;
  noteEn: string;
  noteAr: string;
}

export type OverallQualificationStatus =
  | 'QUALIFIED'
  | 'CONDITIONALLY_QUALIFIED'
  | 'NOT_QUALIFIED'
  | 'INSUFFICIENT_EVIDENCE';

export interface QualificationResult {
  supplierId: string;
  gateResults: GateResult[];
  overallStatus: OverallQualificationStatus;
  /** Comma-joined category names behind a NOT_QUALIFIED result; null otherwise. Never hidden inside an average (SI-04 "critical-fail rule"). */
  blockingGate: string | null;
  unscoredDimensions: string[];
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
 */
export function checkGate(
  record: SupplierRecord,
  category: GateCategory,
  thresholds: GateThresholds = DEFAULT_GATE_THRESHOLDS,
  targetSiteId?: string,
): GateResult {
  if (category === 'identity') {
    const confidence = record.entityResolution.confidence;
    if (confidence === 'HIGH') {
      return { category, result: 'PASS', evidenceStage: null, noteEn: 'Entity resolved with high confidence.', noteAr: 'تم تحديد هوية المنشأة بثقة عالية.' };
    }
    if (confidence === 'MODERATE' || confidence === 'LOW') {
      return {
        category,
        result: 'CONDITIONAL',
        evidenceStage: null,
        noteEn: `Entity resolution confidence is ${confidence.toLowerCase()} (${record.entityResolution.method}) -- recommend manual confirmation before relying on this identity for qualification.`,
        noteAr: `مستوى الثقة في تحديد هوية المنشأة ${confidence === 'MODERATE' ? 'متوسط' : 'منخفض'} (${record.entityResolution.method}) -- يوصى بالتأكيد اليدوي قبل الاعتماد على هذه الهوية في التأهيل.`,
      };
    }
    return {
      category,
      result: 'INSUFFICIENT_EVIDENCE',
      evidenceStage: null,
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
      result: 'CRITICAL_FAIL',
      evidenceStage: relevantFacts.length ? weakestEvidenceStage(relevantFacts) : null,
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
        result: 'CRITICAL_FAIL',
        evidenceStage: expired.evidenceStage,
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
      result: 'INSUFFICIENT_EVIDENCE',
      evidenceStage: null,
      noteEn: `No ${category} facts recorded for this supplier yet.${limitNote}`,
      noteAr: `لا توجد بيانات مسجّلة لهذا المورّد ضمن فئة ${category} حتى الآن.`,
    };
  }

  const weakest = weakestEvidenceStage(relevantFacts);
  const required = thresholds.minEvidenceStageForPass[category];
  if (evidenceRank(weakest) >= evidenceRank(required)) {
    return {
      category,
      result: 'PASS',
      evidenceStage: weakest,
      noteEn: `Evidence at or above ${required} threshold (weakest fact: ${weakest}).`,
      noteAr: `الأدلة عند أو أعلى من حد ${required} (أضعف بيان: ${weakest}).`,
    };
  }
  return {
    category,
    result: 'CONDITIONAL',
    evidenceStage: weakest,
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
): QualificationResult {
  const gateResults = GATE_CATEGORIES.map((category) => checkGate(record, category, thresholds, targetSiteId));

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
  };
}
