/**
 * SI Module 03 -- Supplier Object Model & Entity Resolution (8 Sep 2026).
 *
 * BUILT as a pure, tested library -- no UI this cycle, same reasoning as
 * Modules 01 and 02: this is the canonical data model every other SI module
 * reads and writes against, so it ships standalone-first and gets its own
 * worked-example document rather than waiting for a Supplier Command Center
 * screen that doesn't exist yet (Charter core instruction #12).
 *
 * Two OWNER INPUT NEEDED items were open on SI-03-Supplier-Object-Model-
 * Entity-Resolution.md. Per the engine's standing "you decide" rule (owner
 * instruction, 8 Sep 2026: resolve architectural OWNER INPUT NEEDED markers
 * rather than blocking a build on them), both are resolved here and the
 * reasoning is recorded at the point of decision so a future review can
 * correct either call without re-deriving the context:
 *
 * DECISION 1 -- Entity resolution key priority order (spec question 1).
 * KEPT the order the spec draft proposed: registered legal entity number ->
 * matched legal name + country -> matched trading name + declared parent +
 * country -> manual client confirmation. This is not a novel design --
 * it mirrors the standard KYC/UBO and corporate-registry matching cascade
 * (GLEIF LEI-first matching, Dun & Bradstreet DUNS-first matching): a
 * regulator-issued identifier is the only tier that can support an
 * automatic HIGH-confidence merge; every other tier is a fuzzier signal
 * that should surface as a candidate match for a human to confirm, not an
 * automatic merge. Implemented below as four ordered tiers with the
 * confidence dropping at each tier, plus an explicit LOW-confidence "near
 * miss" path so a partial signal is surfaced rather than silently either
 * merged or discarded.
 *
 * DECISION 2 -- supplierRole required or optional at intake (spec question
 * 2). Made OPTIONAL at intake, defaulting to 'unknown' with a disclosed
 * data-quality gap flag, not a blocking required field. Reasoning: the
 * Charter's standalone-first commitment explicitly promises "a client with
 * nothing but a spreadsheet gets real Kraljic positioning, qualification
 * gates, and dependency analysis on day one (minimum input: supplier name +
 * requirement)" -- making supplierRole mandatory at intake would break that
 * promise for the common real case where a client genuinely doesn't know
 * yet whether their contact is the manufacturer or a trader. The gap is not
 * swept under the rug: `assessSupplierRoleDataQuality()` flags 'unknown' as
 * an open qualification risk, and Module 04's gate logic (a separate
 * module) is the enforcement point that can refuse to certify manufacturer-
 * level capability/certification claims until the role is confirmed.
 *
 * Design precedent followed (same as decisionLab.ts / supplierDependency.ts
 * / kraljicScoring.ts): pure functions, no side effects, no network calls,
 * no fabricated data. Every derived judgment (confidence scoring, near-miss
 * detection) is a fixed, disclosed rule, not an AI-invented number
 * (Decision Record 8.7).
 */

// ---------------------------------------------------------------------------
// Core vocabulary (SI-00 Charter "Supplier object model" summary; SI-03 body)
// ---------------------------------------------------------------------------

export type ObjectModelLevel =
  | 'group'
  | 'parent'
  | 'legalEntity'
  | 'operatingEntity'
  | 'site'
  | 'productionLine'
  | 'capability'
  | 'technology'
  | 'equipment'
  | 'productService'
  | 'certification'
  | 'capacity'
  | 'quality'
  | 'customer'
  | 'subTier'
  | 'logistics'
  | 'financialPosition'
  | 'commercialPosition'
  | 'contract'
  | 'performance'
  | 'risk'
  | 'alternative';

/** The full ordered hierarchy from the Charter/Module 03 header line, kept as one source of truth. */
export const OBJECT_MODEL_LEVELS: ObjectModelLevel[] = [
  'group',
  'parent',
  'legalEntity',
  'operatingEntity',
  'site',
  'productionLine',
  'capability',
  'technology',
  'equipment',
  'productService',
  'certification',
  'capacity',
  'quality',
  'customer',
  'subTier',
  'logistics',
  'financialPosition',
  'commercialPosition',
  'contract',
  'performance',
  'risk',
  'alternative',
];

export type SupplierRole = 'manufacturer' | 'authorized-distributor' | 'trader' | 'agent' | 'unknown';

export type EvidenceStage = 'CLAIMED' | 'DOCUMENTED' | 'VALIDATED' | 'OBSERVED' | 'PROVEN';

/** Ordered weakest-to-strongest. Index is used to detect backward moves and to derive confidence. */
export const EVIDENCE_LADDER: EvidenceStage[] = ['CLAIMED', 'DOCUMENTED', 'VALIDATED', 'OBSERVED', 'PROVEN'];

export type DataSource = 'manual' | 'imported-file' | 'erp' | 'wms' | 'scm' | 'crm';

export type ConfidenceLevel = 'HIGH' | 'MODERATE' | 'LOW' | 'UNVERIFIED';

export type DiscoveryState =
  | 'DISCOVERED'
  | 'POTENTIALLY_RELEVANT'
  | 'SCREENED'
  | 'EVIDENCE_SUPPORTED'
  | 'VERIFIED'
  | 'QUALIFIED'
  | 'RECOMMENDED'
  | 'SELECTED'
  | 'APPROVED';

export const DISCOVERY_STATES: DiscoveryState[] = [
  'DISCOVERED',
  'POTENTIALLY_RELEVANT',
  'SCREENED',
  'EVIDENCE_SUPPORTED',
  'VERIFIED',
  'QUALIFIED',
  'RECOMMENDED',
  'SELECTED',
  'APPROVED',
];

/** Charter core instruction #4: discovery is never qualification. Nothing before QUALIFIED implies fitness for use. */
export const QUALIFICATION_THRESHOLD_STATE: DiscoveryState = 'QUALIFIED';

export function impliesFitnessForUse(state: DiscoveryState): boolean {
  return DISCOVERY_STATES.indexOf(state) >= DISCOVERY_STATES.indexOf(QUALIFICATION_THRESHOLD_STATE);
}

// ---------------------------------------------------------------------------
// Object model nodes and facts
// ---------------------------------------------------------------------------

export interface SupplierNode {
  id: string;
  level: ObjectModelLevel;
  /** Own record. A certification/site/etc. is never a text field on a parent row (Module 03 body). */
  name: string;
  parentNodeId: string | null;
  country: string | null;
  /** Only meaningful up to legalEntity/operatingEntity; null below that. */
  legalEntityNumber: string | null;
  /** Alternate/DBA names this node is known by -- what makes the Rawabi resolution possible. */
  tradingNames: string[];
}

export interface SupplierFact {
  id: string;
  /** The node this fact is attached to -- a fact never floats free of a specific level's own record. */
  nodeId: string;
  level: ObjectModelLevel;
  attribute: string;
  value: string | number;
  evidenceStage: EvidenceStage;
  dataSource: DataSource;
  capturedAt: string; // ISO date
  confidence: ConfidenceLevel;
}

export interface EntityResolutionRecord {
  resolvedAgainst: string | null; // existing supplierId, or null if this is a new entity
  method: ResolutionMethod;
  confidence: ConfidenceLevel;
  reasonEn: string;
  reasonAr: string;
  decidedAt: string; // ISO date -- every resolution decision is logged (Module 03 body)
}

export interface SupplierRecord {
  supplierId: string;
  supplierRole: SupplierRole;
  hierarchy: {
    group: string | null;
    parentId: string | null;
    legalEntityId: string;
    operatingEntityId: string | null;
    siteIds: string[];
  };
  nodes: SupplierNode[];
  facts: SupplierFact[];
  discoveryState: DiscoveryState;
  entityResolution: EntityResolutionRecord;
}

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

/** Reset the id counter -- test-only helper so ids are deterministic per test run. */
export function _resetIdCounterForTests(): void {
  idCounter = 0;
}

export function newSupplierNode(
  level: ObjectModelLevel,
  name: string,
  opts: Partial<Omit<SupplierNode, 'id' | 'level' | 'name'>> = {},
): SupplierNode {
  return {
    id: nextId('node'),
    level,
    name,
    parentNodeId: opts.parentNodeId ?? null,
    country: opts.country ?? null,
    legalEntityNumber: opts.legalEntityNumber ?? null,
    tradingNames: opts.tradingNames ?? [],
  };
}

export function newSupplierRecord(legalEntityNode: SupplierNode, supplierRole: SupplierRole = 'unknown'): SupplierRecord {
  return {
    supplierId: nextId('supplier'),
    supplierRole,
    hierarchy: {
      group: null,
      parentId: null,
      legalEntityId: legalEntityNode.id,
      operatingEntityId: null,
      siteIds: [],
    },
    nodes: [legalEntityNode],
    facts: [],
    discoveryState: 'DISCOVERED',
    entityResolution: {
      resolvedAgainst: null,
      method: 'no-match-new-entity',
      confidence: 'HIGH',
      reasonEn: 'No existing registry entry matched at intake; recorded as a new entity.',
      reasonAr: 'لم يتطابق أي سجل حالي عند الإدخال؛ تم تسجيله كمنشأة جديدة.',
      decidedAt: new Date().toISOString(),
    },
  };
}

/**
 * DECISION 2 (see file header): supplierRole is optional at intake. This is
 * the disclosed gap flag Module 04's qualification gate reads, rather than
 * a silent default. Never blocks a build/screen -- surfaces a real risk.
 */
export function assessSupplierRoleDataQuality(record: SupplierRecord): { hasGap: boolean; reasonEn: string; reasonAr: string } {
  if (record.supplierRole === 'unknown') {
    return {
      hasGap: true,
      reasonEn:
        "supplierRole is unconfirmed. A trader or agent claiming a manufacturer's certification and capacity is a common real-world qualification failure -- do not let any manufacturer-level capability or certification claim advance past SCREENED until this is confirmed.",
      reasonAr:
        'دور المورّد غير مؤكد. ادعاء الوكيل أو التاجر بشهادات وقدرات الشركة المصنّعة هو أحد أكثر إخفاقات التأهيل شيوعاً في الواقع -- لا تسمح بتقدّم أي ادعاء قدرة أو شهادة على مستوى المصنّع بعد مرحلة الفرز حتى يتم تأكيد هذا الدور.',
    };
  }
  return { hasGap: false, reasonEn: 'supplierRole confirmed.', reasonAr: 'تم تأكيد دور المورّد.' };
}

// ---------------------------------------------------------------------------
// Evidence ladder
// ---------------------------------------------------------------------------

export function evidenceRank(stage: EvidenceStage): number {
  return EVIDENCE_LADDER.indexOf(stage);
}

/** True if `to` is not a backward move on the ladder relative to `from`. Skipping forward is allowed (e.g. a client-supplied audit report can land straight at VALIDATED). */
export function isForwardOrEqualEvidenceMove(from: EvidenceStage, to: EvidenceStage): boolean {
  return evidenceRank(to) >= evidenceRank(from);
}

/**
 * Deterministic, disclosed confidence-derivation rule (a "you decide" call:
 * the spec defines evidenceStage and dataSource as sibling fields on a fact
 * but does not state how confidence is derived from them -- filled in here
 * rather than left as an unexplained free field, following the same
 * disclosed-rule pattern as supplierDependency.ts's deriveSeverity()).
 *
 *   HIGH       = OBSERVED or PROVEN, from any source; or VALIDATED from a
 *                system-of-record source (erp/wms/scm/crm) rather than a
 *                manual claim about a document.
 *   MODERATE   = VALIDATED (manual/imported-file) or DOCUMENTED from a
 *                system-of-record source.
 *   LOW        = DOCUMENTED (manual/imported-file).
 *   UNVERIFIED = CLAIMED, from any source -- the supplier said so, nothing
 *                attached, regardless of which system it was typed into.
 */
export function deriveFactConfidence(evidenceStage: EvidenceStage, dataSource: DataSource): ConfidenceLevel {
  const isSystemOfRecord = dataSource === 'erp' || dataSource === 'wms' || dataSource === 'scm' || dataSource === 'crm';

  if (evidenceStage === 'CLAIMED') return 'UNVERIFIED';
  if (evidenceStage === 'OBSERVED' || evidenceStage === 'PROVEN') return 'HIGH';
  if (evidenceStage === 'VALIDATED') return isSystemOfRecord ? 'HIGH' : 'MODERATE';
  // DOCUMENTED
  return isSystemOfRecord ? 'MODERATE' : 'LOW';
}

export function attachFact(
  record: SupplierRecord,
  nodeId: string,
  level: ObjectModelLevel,
  attribute: string,
  value: string | number,
  evidenceStage: EvidenceStage,
  dataSource: DataSource,
  capturedAt: string = new Date().toISOString(),
): SupplierFact {
  const fact: SupplierFact = {
    id: nextId('fact'),
    nodeId,
    level,
    attribute,
    value,
    evidenceStage,
    dataSource,
    capturedAt,
    confidence: deriveFactConfidence(evidenceStage, dataSource),
  };
  record.facts.push(fact);
  return fact;
}

/**
 * Module 03 body: "A certification held by the Legal Entity is not assumed
 * to apply to every Site; a Site's certification must be attached to that
 * Site's own record or it does not exist for qualification purposes."
 * This is the enforcement function Module 04's gate calls.
 */
export function certificationAppliesToSite(record: SupplierRecord, certificationHolderNodeId: string, siteId: string): boolean {
  return certificationHolderNodeId === siteId && record.hierarchy.siteIds.includes(siteId);
}

// ---------------------------------------------------------------------------
// Entity resolution
// ---------------------------------------------------------------------------

export type ResolutionMethod =
  | 'legal-entity-number'
  | 'legal-name-country'
  | 'trading-name-parent-country'
  | 'manual-confirmation'
  | 'no-match-new-entity'
  | 'near-miss-unconfirmed';

export interface ResolutionCandidateInput {
  legalEntityNumber?: string;
  legalName?: string;
  tradingName?: string;
  declaredParent?: string;
  country: string;
}

/** A minimal view of the existing registry this function needs -- the caller supplies whatever store it uses. */
export interface RegistryEntry {
  supplierId: string;
  legalEntityNumber: string | null;
  legalName: string;
  tradingNames: string[];
  declaredParent: string | null;
  country: string;
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/[\s\-.,]+/g, ' ').trim();
}

function normalizeId(s: string): string {
  return s.trim().toUpperCase().replace(/[\s\-]+/g, '');
}

export interface ResolutionResult {
  isNewEntity: boolean;
  resolvedAgainst: string | null;
  method: ResolutionMethod;
  confidence: ConfidenceLevel;
  reasonEn: string;
  reasonAr: string;
  /** Populated only for 'near-miss-unconfirmed' -- candidates worth a human look, never auto-merged. */
  candidateMatches?: string[];
}

/**
 * Resolution keys, in order of reliability, exactly as SI-03 specifies
 * (DECISION 1, file header): legal entity number -> legal name + country ->
 * trading name + declared parent + country -> manual confirmation (handled
 * by confirmManualResolution below, not this function). A false merge
 * (treating two real suppliers as one) is exactly as damaging as a false
 * split (Module 03 body) -- so anything short of an exact tier-1/tier-2
 * match that still shows partial overlap is surfaced as a near-miss for a
 * human to confirm rather than either merged automatically or silently
 * treated as unrelated.
 */
export function resolveSupplierEntity(input: ResolutionCandidateInput, registry: RegistryEntry[]): ResolutionResult {
  // Tier 1 -- registered legal entity number. Exact-match only; a regulator-issued ID is the one
  // signal reliable enough to support an automatic HIGH-confidence merge.
  if (input.legalEntityNumber) {
    const key = normalizeId(input.legalEntityNumber);
    const hit = registry.find((r) => r.legalEntityNumber !== null && normalizeId(r.legalEntityNumber) === key);
    if (hit) {
      return {
        isNewEntity: false,
        resolvedAgainst: hit.supplierId,
        method: 'legal-entity-number',
        confidence: 'HIGH',
        reasonEn: `Registered legal entity number matches existing supplier ${hit.supplierId} exactly -- highest-reliability resolution key.`,
        reasonAr: `رقم السجل القانوني المسجّل مطابق تماماً للمورّد الحالي ${hit.supplierId} -- أعلى مفتاح موثوقية للتحليل.`,
      };
    }
  }

  // Tier 2 -- matched legal name + country.
  if (input.legalName) {
    const nameKey = normalize(input.legalName);
    const hit = registry.find((r) => normalize(r.legalName) === nameKey && normalize(r.country) === normalize(input.country));
    if (hit) {
      return {
        isNewEntity: false,
        resolvedAgainst: hit.supplierId,
        method: 'legal-name-country',
        confidence: 'MODERATE',
        reasonEn: `Legal name and country match existing supplier ${hit.supplierId} exactly; no legal entity number was available to confirm at the highest tier.`,
        reasonAr: `الاسم القانوني والدولة يطابقان تماماً المورّد الحالي ${hit.supplierId}؛ لم يتوفر رقم سجل قانوني للتأكيد على أعلى مستوى.`,
      };
    }
  }

  // Tier 3 -- matched trading name + declared parent + country.
  if (input.tradingName && input.declaredParent) {
    const tradeKey = normalize(input.tradingName);
    const parentKey = normalize(input.declaredParent);
    const hit = registry.find(
      (r) =>
        r.tradingNames.some((t) => normalize(t) === tradeKey) &&
        r.declaredParent !== null &&
        normalize(r.declaredParent) === parentKey &&
        normalize(r.country) === normalize(input.country),
    );
    if (hit) {
      return {
        isNewEntity: false,
        resolvedAgainst: hit.supplierId,
        method: 'trading-name-parent-country',
        confidence: 'LOW',
        reasonEn: `Trading name, declared parent, and country match existing supplier ${hit.supplierId} -- the weakest automatic tier. Recommend confirming with a legal entity number when available.`,
        reasonAr: `الاسم التجاري والشركة الأم المُعلنة والدولة تطابق المورّد الحالي ${hit.supplierId} -- أضعف مستوى تلقائي. يُنصح بالتأكيد برقم السجل القانوني عند توفره.`,
      };
    }
  }

  // Near-miss detection: partial overlap that didn't clear any tier above -- flagged, never merged.
  // Token-overlap heuristic (>=2 shared significant words, e.g. "gulf" + "line"), not a raw
  // substring check -- a raw substring check misses cases like "Gulf Line Trading Est." vs.
  // "Gulf Line Logistics Holding W.L.L." where neither name contains the other in full.
  const STOPWORDS = new Set(['co', 'company', 'llc', 'wll', 'w l l', 'est', 'establishment', 'holding', 'group', 'services', 'service', 'the', 'of']);
  function significantTokens(s: string): Set<string> {
    return new Set(
      normalize(s)
        .split(' ')
        .filter((t) => t.length > 2 && !STOPWORDS.has(t)),
    );
  }
  function sharesTokens(a: string, b: string, minShared = 2): boolean {
    const ta = significantTokens(a);
    const tb = significantTokens(b);
    let shared = 0;
    ta.forEach((t) => {
      if (tb.has(t)) shared += 1;
    });
    return shared >= minShared;
  }

  const candidateMatches = registry
    .filter((r) => {
      const countryMatch = normalize(r.country) === normalize(input.country);
      if (!countryMatch) return false;
      const nameHint =
        (input.legalName && (sharesTokens(r.legalName, input.legalName) || normalize(r.legalName).includes(normalize(input.legalName)) || normalize(input.legalName).includes(normalize(r.legalName)))) ||
        (input.tradingName &&
          r.tradingNames.some(
            (t) => sharesTokens(t, input.tradingName!) || normalize(t).includes(normalize(input.tradingName!)) || normalize(input.tradingName!).includes(normalize(t)),
          ));
      return Boolean(nameHint);
    })
    .map((r) => r.supplierId);

  if (candidateMatches.length > 0) {
    return {
      isNewEntity: false,
      resolvedAgainst: null,
      method: 'near-miss-unconfirmed',
      confidence: 'LOW',
      reasonEn: `Partial name/country overlap with ${candidateMatches.length} existing record(s), but nothing cleared an automatic resolution tier. Flagged for manual confirmation rather than merged or discarded.`,
      reasonAr: `تداخل جزئي في الاسم/الدولة مع ${candidateMatches.length} سجل(سجلات) حالية، لكن لم يتحقق أي مستوى تحليل تلقائي. تم وضع علامة للتأكيد اليدوي بدلاً من الدمج أو التجاهل.`,
      candidateMatches,
    };
  }

  return {
    isNewEntity: true,
    resolvedAgainst: null,
    method: 'no-match-new-entity',
    confidence: 'HIGH',
    reasonEn: 'No existing registry entry matches on any resolution tier or partial signal. Recorded as a new entity.',
    reasonAr: 'لا يوجد سجل حالي مطابق على أي مستوى تحليل أو إشارة جزئية. تم تسجيله كمنشأة جديدة.',
  };
}

/**
 * Last-resort tier: manual client confirmation. Always logged with a
 * reviewer note, per Module 03's "every resolution decision is logged with
 * its confidence" requirement -- this is the only tier that can force a
 * merge across a LOW/near-miss result, and it does so explicitly rather
 * than silently.
 */
export function confirmManualResolution(resolvedAgainst: string | null, reviewerNote: string): ResolutionResult {
  return {
    isNewEntity: resolvedAgainst === null,
    resolvedAgainst,
    method: 'manual-confirmation',
    confidence: 'MODERATE',
    reasonEn: `Manually confirmed by reviewer: ${reviewerNote}`,
    reasonAr: `تم التأكيد يدوياً من قِبل المراجع: ${reviewerNote}`,
  };
}

export function logEntityResolution(record: SupplierRecord, result: ResolutionResult): void {
  record.entityResolution = {
    resolvedAgainst: result.resolvedAgainst,
    method: result.method,
    confidence: result.confidence,
    reasonEn: result.reasonEn,
    reasonAr: result.reasonAr,
    decidedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Discovery state
// ---------------------------------------------------------------------------

export function discoveryRank(state: DiscoveryState): number {
  return DISCOVERY_STATES.indexOf(state);
}

/** Forward-only by default; a regression (e.g. QUALIFIED -> SCREENED after a failed re-audit) must go through this with `allowRegression: true` so it's an explicit, not accidental, downgrade. */
export function advanceDiscoveryState(current: DiscoveryState, next: DiscoveryState, allowRegression = false): DiscoveryState {
  if (!allowRegression && discoveryRank(next) < discoveryRank(current)) {
    throw new Error(
      `Cannot move discoveryState backward from ${current} to ${next} without allowRegression: true (a regression like a failed re-audit must be explicit, not accidental).`,
    );
  }
  return next;
}

// ---------------------------------------------------------------------------
// Output schema serialization (matches SI-03's draft JSON shape)
// ---------------------------------------------------------------------------

export interface SupplierOutputSchema {
  supplierId: string;
  supplierRole: SupplierRole;
  hierarchy: { group: string | null; legalEntity: string; operatingEntity: string | null; sites: string[] };
  facts: Array<{
    level: ObjectModelLevel;
    attribute: string;
    value: string | number;
    evidenceStage: EvidenceStage;
    dataSource: DataSource;
    capturedAt: string;
    confidence: ConfidenceLevel;
  }>;
  discoveryState: DiscoveryState;
  entityResolution: { resolvedAgainst: string | null; method: ResolutionMethod; confidence: ConfidenceLevel };
}

export function toOutputSchema(record: SupplierRecord): SupplierOutputSchema {
  return {
    supplierId: record.supplierId,
    supplierRole: record.supplierRole,
    hierarchy: {
      group: record.hierarchy.group,
      legalEntity: record.hierarchy.legalEntityId,
      operatingEntity: record.hierarchy.operatingEntityId,
      sites: record.hierarchy.siteIds,
    },
    facts: record.facts.map((f) => ({
      level: f.level,
      attribute: f.attribute,
      value: f.value,
      evidenceStage: f.evidenceStage,
      dataSource: f.dataSource,
      capturedAt: f.capturedAt,
      confidence: f.confidence,
    })),
    discoveryState: record.discoveryState,
    entityResolution: {
      resolvedAgainst: record.entityResolution.resolvedAgainst,
      method: record.entityResolution.method,
      confidence: record.entityResolution.confidence,
    },
  };
}
