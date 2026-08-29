import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  COMPLEXITY_LEVELS,
  complexityLevelLabel,
  resolveComplexityLevel,
  resolveReviewDepth,
  resolveMandatoryClauseCategories,
  RFX_TYPES,
  rfxTypeLabel,
  recommendRfxType,
  RFX_DEFAULT_SCORING_TEMPLATE,
  scoreRfxBidders,
  summarizeWiringChecks,
  mockDocumentExtraction,
  type ComplexityLevel,
} from './clmContractLifecycle';

// ---------------------------------------------------------------------------
// Part A -- Complexity tiering
// ---------------------------------------------------------------------------

describe('COMPLEXITY_LEVELS', () => {
  it('has exactly the 3 levels in order', () => {
    expect(COMPLEXITY_LEVELS.map((c) => c.id)).toEqual(['level-1-low', 'level-2-standard', 'level-3-complex']);
  });

  it('every level has a non-empty bilingual label and description', () => {
    for (const level of COMPLEXITY_LEVELS) {
      expect(level.label.length).toBeGreaterThan(0);
      expect(level.labelAr.length).toBeGreaterThan(0);
      expect(level.descriptionEn.length).toBeGreaterThan(0);
      expect(level.descriptionAr.length).toBeGreaterThan(0);
    }
  });

  it('complexityLevelLabel returns the right language and undefined for missing id', () => {
    expect(complexityLevelLabel('level-1-low', false)).toBe('Level 1 -- Low');
    expect(complexityLevelLabel('level-1-low', true)).toContain('منخفض');
    expect(complexityLevelLabel(undefined, false)).toBeUndefined();
  });
});

describe('resolveComplexityLevel', () => {
  it('returns Level 1 for a plain low-value, established, short, single-jurisdiction contract', () => {
    const result = resolveComplexityLevel({
      value: 10000,
      durationMonths: 6,
      counterpartyHistory: 'established',
    });
    expect(result.level).toBe('level-1-low');
  });

  it('escalates to Level 3 on new counterparty alone', () => {
    const result = resolveComplexityLevel({ value: 10000, durationMonths: 3, counterpartyHistory: 'new' });
    expect(result.level).toBe('level-3-complex');
    expect(result.reasonEn).toContain('new/unvetted counterparty');
  });

  it('escalates to Level 3 on unvetted counterparty alone', () => {
    const result = resolveComplexityLevel({ value: 10000, durationMonths: 3, counterpartyHistory: 'unvetted' });
    expect(result.level).toBe('level-3-complex');
  });

  it('escalates to Level 3 on cross-border alone', () => {
    const result = resolveComplexityLevel({ value: 10000, durationMonths: 3, crossBorder: true });
    expect(result.level).toBe('level-3-complex');
    expect(result.reasonEn).toContain('cross-border');
  });

  it('escalates to Level 3 on an active mismatch flag alone', () => {
    const result = resolveComplexityLevel({ value: 10000, durationMonths: 3, hasActiveMismatchFlag: true });
    expect(result.level).toBe('level-3-complex');
    expect(result.reasonEn).toContain('mismatch flag');
  });

  it('escalates to Level 3 on 24+ month duration alone', () => {
    const result = resolveComplexityLevel({ value: 10000, durationMonths: 24 });
    expect(result.level).toBe('level-3-complex');
    expect(result.reasonEn).toContain('multi-year');
  });

  it('does NOT escalate at 23 months', () => {
    const result = resolveComplexityLevel({ value: 10000, durationMonths: 23, counterpartyHistory: 'established' });
    expect(result.level).not.toBe('level-3-complex');
  });

  it('escalates to Level 3 on clauseDeviationCount >= 3', () => {
    const result = resolveComplexityLevel({ value: 10000, durationMonths: 3, clauseDeviationCount: 3 });
    expect(result.level).toBe('level-3-complex');
    expect(result.reasonEn).toContain('3 clause deviations');
  });

  it('does not escalate to Level 3 on clauseDeviationCount of 2, but does move to Level 2', () => {
    const result = resolveComplexityLevel({ value: 10000, durationMonths: 3, clauseDeviationCount: 2, counterpartyHistory: 'established' });
    expect(result.level).toBe('level-2-standard');
  });

  it('combines multiple Level-3 triggers into one joined reason', () => {
    const result = resolveComplexityLevel({
      value: 500000,
      durationMonths: 36,
      counterpartyHistory: 'new',
      crossBorder: true,
      hasActiveMismatchFlag: true,
    });
    expect(result.level).toBe('level-3-complex');
    expect(result.reasonEn).toContain('new/unvetted counterparty');
    expect(result.reasonEn).toContain('cross-border');
    expect(result.reasonEn).toContain('mismatch flag');
    expect(result.reasonEn).toContain('multi-year');
  });

  it('reaches Level 2 at 12+ months with no Level-3 trigger', () => {
    const result = resolveComplexityLevel({ value: 10000, durationMonths: 12, counterpartyHistory: 'established' });
    expect(result.level).toBe('level-2-standard');
  });

  it('reaches Level 2 on a single clause deviation with established counterparty', () => {
    const result = resolveComplexityLevel({ value: 10000, durationMonths: 3, clauseDeviationCount: 1, counterpartyHistory: 'established' });
    expect(result.level).toBe('level-2-standard');
  });

  it('every returned reason has a non-empty English and Arabic string', () => {
    const cases: ComplexityLevel[] = ['level-1-low', 'level-2-standard', 'level-3-complex'];
    const inputs = [
      { value: 1, durationMonths: 1, counterpartyHistory: 'established' as const },
      { value: 1, durationMonths: 12, counterpartyHistory: 'established' as const },
      { value: 1, durationMonths: 1, crossBorder: true },
    ];
    inputs.forEach((inp, i) => {
      const result = resolveComplexityLevel(inp);
      expect(result.level).toBe(cases[i]);
      expect(result.reasonEn.length).toBeGreaterThan(0);
      expect(result.reasonAr.length).toBeGreaterThan(0);
    });
  });
});

// ---------------------------------------------------------------------------
// Part C -- Review depth
// ---------------------------------------------------------------------------

describe('resolveReviewDepth', () => {
  it('is always HEAVY at Level 3, regardless of value/threshold', () => {
    const result = resolveReviewDepth('level-3-complex', 1, 999999999);
    expect(result.depth).toBe('heavy');
    expect(result.reasonEn).toContain('Level 3');
  });

  it('is LIGHT at Level 1 when value is below the configured threshold', () => {
    const result = resolveReviewDepth('level-1-low', 50000, 100000);
    expect(result.depth).toBe('light');
  });

  it('is HEAVY at Level 1 when value meets the configured threshold', () => {
    const result = resolveReviewDepth('level-1-low', 100000, 100000);
    expect(result.depth).toBe('heavy');
    expect(result.reasonEn).toContain('threshold');
  });

  it('is HEAVY at Level 1 when value exceeds the configured threshold', () => {
    const result = resolveReviewDepth('level-2-standard', 150000, 100000);
    expect(result.depth).toBe('heavy');
  });

  it('falls back to LIGHT when no threshold is configured and level is not 3', () => {
    const result = resolveReviewDepth('level-2-standard', 999999999);
    expect(result.depth).toBe('light');
  });

  it('never invents a hardcoded SAR figure -- threshold is always caller-supplied', () => {
    // Regression guard: the function signature takes heavyThresholdValue as an
    // optional parameter, not a hardcoded internal constant. This test asserts
    // that behavior is entirely threshold-driven, not value-driven in isolation.
    const low = resolveReviewDepth('level-1-low', 1000000); // no threshold -> LIGHT
    const high = resolveReviewDepth('level-1-low', 1000000, 500000); // threshold set -> HEAVY
    expect(low.depth).toBe('light');
    expect(high.depth).toBe('heavy');
  });
});

// ---------------------------------------------------------------------------
// Part D -- RFx selection + scoring
// ---------------------------------------------------------------------------

describe('RFX_TYPES', () => {
  it('has exactly rfi, rfp, rfq', () => {
    expect(RFX_TYPES.map((r) => r.id)).toEqual(['rfi', 'rfp', 'rfq']);
  });

  it('rfxTypeLabel returns the right language and undefined for missing id', () => {
    expect(rfxTypeLabel('rfq', false)).toContain('RFQ');
    expect(rfxTypeLabel('rfq', true)).toContain('أسعار');
    expect(rfxTypeLabel(undefined, false)).toBeUndefined();
  });
});

describe('recommendRfxType', () => {
  it('recommends RFI when specs are not fixed', () => {
    const result = recommendRfxType({ specificationsFixed: false, supplierCapabilityKnown: true, needsApproachComparison: false });
    expect(result.type).toBe('rfi');
  });

  it('recommends RFI when supplier capability is unknown, even if specs are fixed', () => {
    const result = recommendRfxType({ specificationsFixed: true, supplierCapabilityKnown: false, needsApproachComparison: false });
    expect(result.type).toBe('rfi');
  });

  it('recommends RFP when specs fixed, capability known, and approach comparison needed', () => {
    const result = recommendRfxType({ specificationsFixed: true, supplierCapabilityKnown: true, needsApproachComparison: true });
    expect(result.type).toBe('rfp');
  });

  it('recommends RFQ when specs fixed, capability known, no approach comparison needed', () => {
    const result = recommendRfxType({ specificationsFixed: true, supplierCapabilityKnown: true, needsApproachComparison: false });
    expect(result.type).toBe('rfq');
  });

  it('does not add a route-to-market caution when marketCompetitionLevel is undeclared', () => {
    const result = recommendRfxType({ specificationsFixed: true, supplierCapabilityKnown: true, needsApproachComparison: false });
    expect(result.routeToMarketCautionEn).toBeUndefined();
    expect(result.routeToMarketCautionAr).toBeUndefined();
  });

  it('does not add a caution when many qualified suppliers exist', () => {
    const result = recommendRfxType({
      specificationsFixed: true, supplierCapabilityKnown: true, needsApproachComparison: false,
      marketCompetitionLevel: 'many-qualified-suppliers',
    });
    expect(result.type).toBe('rfq');
    expect(result.routeToMarketCautionEn).toBeUndefined();
  });

  it('adds a sole-source caution regardless of RFx type (RFQ case)', () => {
    const result = recommendRfxType({
      specificationsFixed: true, supplierCapabilityKnown: true, needsApproachComparison: false,
      marketCompetitionLevel: 'sole-source',
    });
    expect(result.type).toBe('rfq');
    expect(result.routeToMarketCautionEn).toContain('only one qualified supplier');
    expect(result.routeToMarketCautionAr).toContain('مورد مؤهل واحد');
  });

  it('adds a sole-source caution for RFP too', () => {
    const result = recommendRfxType({
      specificationsFixed: true, supplierCapabilityKnown: true, needsApproachComparison: true,
      marketCompetitionLevel: 'sole-source',
    });
    expect(result.type).toBe('rfp');
    expect(result.routeToMarketCautionEn).toContain('only one qualified supplier');
  });

  it('adds a sole-source caution even for RFI (specs not yet fixed)', () => {
    const result = recommendRfxType({
      specificationsFixed: false, supplierCapabilityKnown: true, needsApproachComparison: false,
      marketCompetitionLevel: 'sole-source',
    });
    expect(result.type).toBe('rfi');
    expect(result.routeToMarketCautionEn).toContain('only one qualified supplier');
  });

  it('adds a few-suppliers caution for RFQ', () => {
    const result = recommendRfxType({
      specificationsFixed: true, supplierCapabilityKnown: true, needsApproachComparison: false,
      marketCompetitionLevel: 'few-qualified-suppliers',
    });
    expect(result.type).toBe('rfq');
    expect(result.routeToMarketCautionEn).toContain('RFQ');
    expect(result.routeToMarketCautionEn).toContain('few qualified suppliers');
  });

  it('adds a few-suppliers caution for RFP', () => {
    const result = recommendRfxType({
      specificationsFixed: true, supplierCapabilityKnown: true, needsApproachComparison: true,
      marketCompetitionLevel: 'few-qualified-suppliers',
    });
    expect(result.type).toBe('rfp');
    expect(result.routeToMarketCautionEn).toContain('RFP');
  });

  it('does NOT add a few-suppliers caution for RFI -- a thin market is exactly when RFI helps', () => {
    const result = recommendRfxType({
      specificationsFixed: false, supplierCapabilityKnown: true, needsApproachComparison: false,
      marketCompetitionLevel: 'few-qualified-suppliers',
    });
    expect(result.type).toBe('rfi');
    expect(result.routeToMarketCautionEn).toBeUndefined();
  });
});

describe('recommendRfxType -- govProcurementNote (#402, 30 Aug 2026)', () => {
  it('does not attach a note when counterpartyType is undeclared', () => {
    const result = recommendRfxType({
      specificationsFixed: true, supplierCapabilityKnown: true, needsApproachComparison: false,
      procurementGoverningLawClause: 'saudi-gtpl',
    });
    expect(result.govProcurementNote).toBeUndefined();
  });

  it('does not attach a note for a private counterparty, even with a researched track selected', () => {
    const result = recommendRfxType({
      specificationsFixed: true, supplierCapabilityKnown: true, needsApproachComparison: false,
      counterpartyType: 'private', procurementGoverningLawClause: 'saudi-gtpl',
    });
    expect(result.govProcurementNote).toBeUndefined();
  });

  it('does not attach a note when governing law is undeclared, even for a government counterparty', () => {
    const result = recommendRfxType({
      specificationsFixed: true, supplierCapabilityKnown: true, needsApproachComparison: false,
      counterpartyType: 'government',
    });
    expect(result.govProcurementNote).toBeUndefined();
  });

  it('does not attach a note for a governing-law track outside the researched GCC/Jordan set', () => {
    const result = recommendRfxType({
      specificationsFixed: true, supplierCapabilityKnown: true, needsApproachComparison: false,
      counterpartyType: 'government', procurementGoverningLawClause: 'uk-common-law',
    });
    expect(result.govProcurementNote).toBeUndefined();
  });

  it('attaches a primary-confirmed Saudi GTPL note for a government counterparty, including the live-reform note', () => {
    const result = recommendRfxType({
      specificationsFixed: true, supplierCapabilityKnown: true, needsApproachComparison: false,
      counterpartyType: 'government', procurementGoverningLawClause: 'saudi-gtpl',
    });
    expect(result.govProcurementNote).toBeDefined();
    expect(result.govProcurementNote?.lawNameEn).toContain('Government Tenders and Procurement Law');
    expect(result.govProcurementNote?.thresholds.some((t) => t.confidence === 'primary-confirmed')).toBe(true);
    expect(result.govProcurementNote?.liveReformNoteEn).toContain('4 Aug 2026');
  });

  it('attaches a not-publicly-disclosed UAE note, honestly reflecting the non-public Manual', () => {
    const result = recommendRfxType({
      specificationsFixed: true, supplierCapabilityKnown: true, needsApproachComparison: false,
      counterpartyType: 'government', procurementGoverningLawClause: 'uae-ctl',
    });
    expect(result.govProcurementNote).toBeDefined();
    expect(result.govProcurementNote?.thresholds.every((t) => t.confidence === 'not-publicly-disclosed')).toBe(true);
    expect(result.govProcurementNote?.methods.length).toBeGreaterThan(0);
  });

  it('attaches a secondary-sourced Qatar note with real committee thresholds', () => {
    const result = recommendRfxType({
      specificationsFixed: true, supplierCapabilityKnown: true, needsApproachComparison: false,
      counterpartyType: 'government', procurementGoverningLawClause: 'qatar-civil',
    });
    expect(result.govProcurementNote?.thresholds.some((t) => t.labelEn.includes('5,000,000'))).toBe(true);
  });

  it('attaches a Bahrain note including its own live-reform note', () => {
    const result = recommendRfxType({
      specificationsFixed: true, supplierCapabilityKnown: true, needsApproachComparison: false,
      counterpartyType: 'government', procurementGoverningLawClause: 'bahrain-civil',
    });
    expect(result.govProcurementNote?.liveReformNoteEn).toContain('22 Mar 2025');
  });

  it('attaches an honest not-found-this-pass note for Oman and Jordan (no invented thresholds)', () => {
    const oman = recommendRfxType({
      specificationsFixed: true, supplierCapabilityKnown: true, needsApproachComparison: false,
      counterpartyType: 'government', procurementGoverningLawClause: 'oman-civil',
    });
    const jordan = recommendRfxType({
      specificationsFixed: true, supplierCapabilityKnown: true, needsApproachComparison: false,
      counterpartyType: 'government', procurementGoverningLawClause: 'jordan-civil',
    });
    expect(oman.govProcurementNote?.thresholds.every((t) => t.confidence === 'not-found-this-pass')).toBe(true);
    expect(jordan.govProcurementNote?.thresholds.every((t) => t.confidence === 'not-found-this-pass')).toBe(true);
  });

  it('attaches a Kuwait note with the CAPT KD 75,000 threshold', () => {
    const result = recommendRfxType({
      specificationsFixed: true, supplierCapabilityKnown: true, needsApproachComparison: false,
      counterpartyType: 'government', procurementGoverningLawClause: 'kuwait-civil',
    });
    expect(result.govProcurementNote?.thresholds.some((t) => t.labelEn.includes('75,000'))).toBe(true);
  });

  it('co-exists with a market-competition caution without either overwriting the other', () => {
    const result = recommendRfxType({
      specificationsFixed: true, supplierCapabilityKnown: true, needsApproachComparison: false,
      counterpartyType: 'government', procurementGoverningLawClause: 'saudi-gtpl',
      marketCompetitionLevel: 'sole-source',
    });
    expect(result.govProcurementNote).toBeDefined();
    expect(result.routeToMarketCautionEn).toContain('only one qualified supplier');
  });
});

describe('RFX_DEFAULT_SCORING_TEMPLATE', () => {
  it('has exactly one mandatory-gate criterion with weight 0', () => {
    const gates = RFX_DEFAULT_SCORING_TEMPLATE.filter((c) => c.isMandatoryGate);
    expect(gates.length).toBe(1);
    expect(gates[0].weight).toBe(0);
  });

  it('non-gate weights sum to 100', () => {
    const sum = RFX_DEFAULT_SCORING_TEMPLATE.filter((c) => !c.isMandatoryGate).reduce((acc, c) => acc + c.weight, 0);
    expect(sum).toBe(100);
  });
});

describe('scoreRfxBidders', () => {
  const criteria = RFX_DEFAULT_SCORING_TEMPLATE;

  it('disqualifies a bidder that fails the mandatory gate, weightedTotal is null', () => {
    const results = scoreRfxBidders(criteria, [
      { bidderId: 'b1', bidderName: 'Bidder One', passedMandatoryGate: false, scores: { 'technical-approach': 100, price: 100, 'past-performance': 100, 'vendor-viability': 100 } },
    ]);
    expect(results[0].disqualified).toBe(true);
    expect(results[0].weightedTotal).toBeNull();
  });

  it('computes a correct weighted total for a fully-scored, gate-passing bidder', () => {
    const results = scoreRfxBidders(criteria, [
      { bidderId: 'b1', bidderName: 'Bidder One', passedMandatoryGate: true, scores: { 'technical-approach': 100, price: 100, 'past-performance': 100, 'vendor-viability': 100 } },
    ]);
    expect(results[0].disqualified).toBe(false);
    expect(results[0].weightedTotal).toBe(100);
  });

  it('treats a missing per-criterion score as 0, not an error', () => {
    const results = scoreRfxBidders(criteria, [
      { bidderId: 'b1', bidderName: 'Bidder One', passedMandatoryGate: true, scores: { 'technical-approach': 100 } },
    ]);
    // 100 * 40 / 100 = 40, everything else defaults to 0
    expect(results[0].weightedTotal).toBe(40);
  });

  it('ranks multiple bidders correctly relative to each other', () => {
    const results = scoreRfxBidders(criteria, [
      { bidderId: 'low', bidderName: 'Low Bidder', passedMandatoryGate: true, scores: { 'technical-approach': 50, price: 50, 'past-performance': 50, 'vendor-viability': 50 } },
      { bidderId: 'high', bidderName: 'High Bidder', passedMandatoryGate: true, scores: { 'technical-approach': 90, price: 90, 'past-performance': 90, 'vendor-viability': 90 } },
      { bidderId: 'dq', bidderName: 'Disqualified Bidder', passedMandatoryGate: false, scores: { 'technical-approach': 100, price: 100, 'past-performance': 100, 'vendor-viability': 100 } },
    ]);
    const low = results.find((r) => r.bidderId === 'low')!;
    const high = results.find((r) => r.bidderId === 'high')!;
    const dq = results.find((r) => r.bidderId === 'dq')!;
    expect(dq.disqualified).toBe(true);
    expect(low.weightedTotal).toBeLessThan(high.weightedTotal!);
  });
});

// ---------------------------------------------------------------------------
// Part E -- Wiring composition
// ---------------------------------------------------------------------------

describe('resolveMandatoryClauseCategories (Part E, rule 4, second half)', () => {
  it('Level 1: no mandatory categories', () => {
    const r = resolveMandatoryClauseCategories('level-1-low');
    expect(r.categories).toEqual([]);
  });
  it('Level 2: Legal/Governance only', () => {
    const r = resolveMandatoryClauseCategories('level-2-standard');
    expect(r.categories).toEqual(['legal-governance']);
  });
  it('Level 3: Commercial/Payment, Risk Allocation, Legal/Governance', () => {
    const r = resolveMandatoryClauseCategories('level-3-complex');
    expect(r.categories).toEqual(['commercial-payment', 'risk-allocation', 'legal-governance']);
  });
  it('reasons are bilingual and non-empty for every level', () => {
    (['level-1-low', 'level-2-standard', 'level-3-complex'] as const).forEach((level) => {
      const r = resolveMandatoryClauseCategories(level);
      expect(r.reasonEn.length).toBeGreaterThan(0);
      expect(r.reasonAr.length).toBeGreaterThan(0);
    });
  });
});

describe('summarizeWiringChecks', () => {
  it('passes through flags unchanged, as a thin composition layer', () => {
    const input = [
      { id: 'law-mismatch', labelEn: 'Law mismatch', labelAr: 'عدم تطابق القانون', flagged: true },
      { id: 'pricing-misuse', labelEn: 'Pricing misuse', labelAr: 'سوء استخدام التسعير', flagged: false },
    ];
    const result = summarizeWiringChecks(input);
    expect(result).toEqual(input);
  });

  it('returns an empty array for an empty input', () => {
    expect(summarizeWiringChecks([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Part F -- Mock document extraction (must stay clearly gated)
// ---------------------------------------------------------------------------

describe('mockDocumentExtraction', () => {
  it('always returns isSimulated: true', () => {
    const result = mockDocumentExtraction('plain vanilla contract text with nothing unusual');
    expect(result.isSimulated).toBe(true);
  });

  it('counts deviation-signal phrases deterministically', () => {
    const text = 'This clause is bespoke. Notwithstanding the foregoing, this is a special condition.';
    const result = mockDocumentExtraction(text);
    // 'bespoke', 'notwithstanding the foregoing', 'special condition' = 3 signals
    expect(result.simulatedClauseDeviationCount).toBe(3);
  });

  it('returns 0 for text with no deviation signals', () => {
    const result = mockDocumentExtraction('The parties agree to the standard terms set out below.');
    expect(result.simulatedClauseDeviationCount).toBe(0);
  });

  it('is case-insensitive', () => {
    const result = mockDocumentExtraction('BESPOKE arrangement, NON-STANDARD terms.');
    expect(result.simulatedClauseDeviationCount).toBe(2);
  });

  it('labels its output as simulated in both languages, not silently generic', () => {
    const result = mockDocumentExtraction('bespoke');
    expect(result.simulatedNotesEn.toUpperCase()).toContain('SIMULATED');
    expect(result.simulatedNotesAr).toContain('محاكاة');
  });

  it('is deterministic -- same input always yields same output', () => {
    const text = 'bespoke amended to read as an exception to the general rule';
    const r1 = mockDocumentExtraction(text);
    const r2 = mockDocumentExtraction(text);
    expect(r1).toEqual(r2);
  });
});

// ---------------------------------------------------------------------------
// Guardrail -- the mock layer must never be reachable from CLMTools.tsx's
// production save/load path. This is enforced by static source inspection,
// not just convention, per the owner-agreed non-negotiable rule (26 Aug
// 2026): simulated data must never reach a real client disguised as real.
// ---------------------------------------------------------------------------

describe('mock-extraction production-path guardrail', () => {
  it('CLMTools.tsx does not import mockDocumentExtraction or MockExtractionResult from clmContractLifecycle', () => {
    // Mentioning the function's name in a doc comment (to explain where a
    // field may ALSO be populated from, in dev/demo contexts only) is fine
    // and expected -- what must never happen is an actual import/call site
    // in this production component. Check the named-import list specifically,
    // not the whole file text, so doc-comment mentions don't false-positive.
    const clmToolsPath = join(import.meta.dirname, '..', 'components', 'toolkit', 'CLMTools.tsx');
    const source = readFileSync(clmToolsPath, 'utf-8');
    const importLine = source.split('\n').find((line) => line.includes("from '@/lib/clmContractLifecycle'"));
    expect(importLine).toBeDefined();
    expect(importLine).not.toContain('mockDocumentExtraction');
    expect(importLine).not.toContain('MockExtractionResult');
    // Also guard against a live call site (`mockDocumentExtraction(...)`)
    // anywhere in the file outside of a comment -- mentioning the name in a
    // doc comment (to explain where a field may ALSO be populated from, in
    // dev/demo contexts only) is fine; strip comment lines/blocks first so
    // only real code is checked.
    const codeOnly = source
      .replace(/\/\*[\s\S]*?\*\//g, '') // block comments
      .split('\n')
      .filter((line) => !line.trim().startsWith('*') && !line.trim().startsWith('//'))
      .join('\n');
    expect(codeOnly).not.toContain('mockDocumentExtraction(');
  });
});
