import { describe, expect, it, beforeEach } from 'vitest';
import { newSupplierNode, newSupplierRecord, attachFact, _resetIdCounterForTests } from '@/lib/supplierObjectModel';
import {
  GATE_CATEGORIES,
  DEFAULT_GATE_THRESHOLDS,
  checkGate,
  runQualificationGates,
  type GateThresholds,
} from '@/lib/supplierQualificationGates';

beforeEach(() => {
  _resetIdCounterForTests();
});

function freshRecord(role: 'manufacturer' | 'trader' | 'unknown' = 'unknown') {
  const legalEntity = newSupplierNode('legalEntity', 'Rawabi Advanced Industries', { country: 'Saudi Arabia' });
  return newSupplierRecord(legalEntity, role);
}

describe('gate vocabulary', () => {
  it('has all ten categories from the module doc, in order', () => {
    expect(GATE_CATEGORIES).toEqual([
      'identity', 'capability', 'financial', 'quality', 'compliance',
      'capacity', 'technical', 'commercial', 'risk', 'operational',
    ]);
  });
});

describe('identity gate', () => {
  it('passes a newly-created record (HIGH confidence, no-match-new-entity)', () => {
    const record = freshRecord();
    const result = checkGate(record, 'identity');
    expect(result.result).toBe('PASS');
  });

  it('returns CONDITIONAL for MODERATE/LOW confidence resolution', () => {
    const record = freshRecord();
    record.entityResolution.confidence = 'MODERATE';
    expect(checkGate(record, 'identity').result).toBe('CONDITIONAL');
    record.entityResolution.confidence = 'LOW';
    expect(checkGate(record, 'identity').result).toBe('CONDITIONAL');
  });

  it('returns INSUFFICIENT_EVIDENCE for UNVERIFIED confidence', () => {
    const record = freshRecord();
    record.entityResolution.confidence = 'UNVERIFIED';
    expect(checkGate(record, 'identity').result).toBe('INSUFFICIENT_EVIDENCE');
  });
});

describe('categories with no facts', () => {
  it('return INSUFFICIENT_EVIDENCE, never a guessed PASS', () => {
    const record = freshRecord('manufacturer');
    for (const category of GATE_CATEGORIES) {
      if (category === 'identity') continue;
      expect(checkGate(record, category).result).toBe('INSUFFICIENT_EVIDENCE');
    }
  });

  it('risk gate with no facts discloses the point-in-time/client-supplied-only limit', () => {
    const record = freshRecord('manufacturer');
    const result = checkGate(record, 'risk');
    expect(result.result).toBe('INSUFFICIENT_EVIDENCE');
    expect(result.noteEn).toMatch(/point-in-time and client-supplied only/i);
  });
});

describe('capability gate enforces Module 03s previously-dormant flag (file header)', () => {
  it('CRITICAL_FAILs a manufacturer-level certification claim when supplierRole is still unknown', () => {
    const record = freshRecord('unknown');
    attachFact(record, record.hierarchy.legalEntityId, 'legalEntity', 'certification', 'ISO 9001', 'DOCUMENTED', 'manual');
    const result = checkGate(record, 'capability');
    expect(result.result).toBe('CRITICAL_FAIL');
    expect(result.noteEn).toMatch(/unconfirmed/i);
  });

  it('does not CRITICAL_FAIL the same claim once supplierRole is confirmed', () => {
    const record = freshRecord('manufacturer');
    attachFact(record, record.hierarchy.legalEntityId, 'legalEntity', 'certification', 'ISO 9001', 'VALIDATED', 'manual');
    const result = checkGate(record, 'capability');
    expect(result.result).not.toBe('CRITICAL_FAIL');
  });

  it('does not CRITICAL_FAIL when role is unknown but no capability-relevant fact exists', () => {
    const record = freshRecord('unknown');
    const result = checkGate(record, 'capability');
    expect(result.result).toBe('INSUFFICIENT_EVIDENCE');
  });
});

describe('compliance gate critical-fail rule (expired certification)', () => {
  it('CRITICAL_FAILs on an explicitly flagged expired certification, named by attribute', () => {
    const record = freshRecord('manufacturer');
    attachFact(record, record.hierarchy.legalEntityId, 'legalEntity', 'certificationStatus', 'expired', 'VALIDATED', 'manual');
    const result = checkGate(record, 'compliance');
    expect(result.result).toBe('CRITICAL_FAIL');
    expect(result.noteEn).toMatch(/expired/i);
  });

  it('does not CRITICAL_FAIL a valid certification status', () => {
    const record = freshRecord('manufacturer');
    attachFact(record, record.hierarchy.legalEntityId, 'legalEntity', 'certificationStatus', 'active', 'VALIDATED', 'manual');
    const result = checkGate(record, 'compliance');
    expect(result.result).toBe('PASS');
  });
});

describe('site-scoped certification (Module 03 site/entity distinction, enforced here)', () => {
  // 'certification' (as opposed to 'certificationStatus') routes to the CAPABILITY
  // gate per CATEGORY_ATTRIBUTE_PATTERNS, not compliance -- these tests target
  // 'capability' accordingly. freshRecord('manufacturer') has a CONFIRMED role, so
  // the hasUnconfirmedRoleManufacturerClaim critical-fail path does not fire here.
  it('does NOT let a legal-entity-level certification satisfy a site-specific qualification', () => {
    const record = freshRecord('manufacturer');
    const siteNode = newSupplierNode('site', 'Rawabi Jeddah Plant', { parentNodeId: record.hierarchy.legalEntityId, country: 'Saudi Arabia' });
    record.nodes.push(siteNode);
    record.hierarchy.siteIds.push(siteNode.id);
    // Certification is attached to the LEGAL ENTITY, not the site.
    attachFact(record, record.hierarchy.legalEntityId, 'legalEntity', 'certification', 'ISO 9001', 'VALIDATED', 'manual');
    const withoutSiteTarget = checkGate(record, 'capability', DEFAULT_GATE_THRESHOLDS);
    expect(withoutSiteTarget.result).not.toBe('INSUFFICIENT_EVIDENCE'); // untargeted check still sees the entity-level fact

    const siteTargeted = checkGate(record, 'capability', DEFAULT_GATE_THRESHOLDS, siteNode.id);
    expect(siteTargeted.result).toBe('INSUFFICIENT_EVIDENCE'); // Module 03 rule: entity cert is not assumed to cover the site
  });

  it('DOES let a certification actually attached to that exact site satisfy the site-specific check', () => {
    const record = freshRecord('manufacturer');
    const siteNode = newSupplierNode('site', 'Rawabi Jeddah Plant', { parentNodeId: record.hierarchy.legalEntityId, country: 'Saudi Arabia' });
    record.nodes.push(siteNode);
    record.hierarchy.siteIds.push(siteNode.id);
    attachFact(record, siteNode.id, 'site', 'certification', 'ISO 9001', 'VALIDATED', 'manual');
    const siteTargeted = checkGate(record, 'capability', DEFAULT_GATE_THRESHOLDS, siteNode.id);
    expect(siteTargeted.result).toBe('PASS');
  });

  it('runQualificationGates threads targetSiteId through to every gate', () => {
    const record = freshRecord('manufacturer');
    const siteNode = newSupplierNode('site', 'Rawabi Jeddah Plant', { parentNodeId: record.hierarchy.legalEntityId, country: 'Saudi Arabia' });
    record.nodes.push(siteNode);
    record.hierarchy.siteIds.push(siteNode.id);
    attachFact(record, record.hierarchy.legalEntityId, 'legalEntity', 'certification', 'ISO 9001', 'VALIDATED', 'manual');
    const untargeted = runQualificationGates(record, DEFAULT_GATE_THRESHOLDS);
    const targeted = runQualificationGates(record, DEFAULT_GATE_THRESHOLDS, siteNode.id);
    const capabilityUntargeted = untargeted.gateResults.find((g) => g.category === 'capability')!;
    const capabilityTargeted = targeted.gateResults.find((g) => g.category === 'capability')!;
    expect(capabilityUntargeted.result).not.toBe('INSUFFICIENT_EVIDENCE');
    expect(capabilityTargeted.result).toBe('INSUFFICIENT_EVIDENCE');
  });

  it('non-certification facts (e.g. financial) are unaffected by targetSiteId -- the site/entity distinction is certification-specific', () => {
    const record = freshRecord('manufacturer');
    const siteNode = newSupplierNode('site', 'Rawabi Jeddah Plant', { parentNodeId: record.hierarchy.legalEntityId, country: 'Saudi Arabia' });
    record.nodes.push(siteNode);
    record.hierarchy.siteIds.push(siteNode.id);
    attachFact(record, record.hierarchy.legalEntityId, 'legalEntity', 'financialPosition', 500000, 'DOCUMENTED', 'erp');
    const untargeted = checkGate(record, 'financial');
    const targeted = checkGate(record, 'financial', DEFAULT_GATE_THRESHOLDS, siteNode.id);
    expect(untargeted.result).toBe(targeted.result);
  });
});

describe('threshold-driven PASS/CONDITIONAL', () => {
  it('PASSes when the weakest relevant fact meets the configured threshold', () => {
    const record = freshRecord('manufacturer');
    attachFact(record, record.hierarchy.legalEntityId, 'legalEntity', 'financialPosition', 500000, 'DOCUMENTED', 'erp');
    expect(checkGate(record, 'financial').result).toBe('PASS');
  });

  it('is CONDITIONAL when the weakest relevant fact is below threshold', () => {
    const record = freshRecord('manufacturer');
    attachFact(record, record.hierarchy.legalEntityId, 'legalEntity', 'financialPosition', 500000, 'CLAIMED', 'manual');
    const result = checkGate(record, 'financial');
    expect(result.result).toBe('CONDITIONAL');
    expect(result.evidenceStage).toBe('CLAIMED');
  });

  it('respects an overridden threshold', () => {
    const record = freshRecord('manufacturer');
    attachFact(record, record.hierarchy.legalEntityId, 'legalEntity', 'financialPosition', 500000, 'CLAIMED', 'manual');
    const looseThresholds: GateThresholds = {
      ...DEFAULT_GATE_THRESHOLDS,
      minEvidenceStageForPass: { ...DEFAULT_GATE_THRESHOLDS.minEvidenceStageForPass, financial: 'CLAIMED' },
    };
    expect(checkGate(record, 'financial', looseThresholds).result).toBe('PASS');
  });
});

describe('runQualificationGates -- Rawabi illustrative example (SI-04 body)', () => {
  it('passes capability, capacity, and commercial but CRITICAL_FAILs on an expired safety certification, blocking overall qualification regardless of the strong picture elsewhere', () => {
    const record = freshRecord('manufacturer');
    const entityId = record.hierarchy.legalEntityId;
    attachFact(record, entityId, 'legalEntity', 'capability', 'motor assembly', 'VALIDATED', 'manual');
    attachFact(record, entityId, 'legalEntity', 'capacity', 50000, 'VALIDATED', 'manual');
    attachFact(record, entityId, 'legalEntity', 'commercialPosition', 'net-30', 'DOCUMENTED', 'erp');
    attachFact(record, entityId, 'legalEntity', 'certificationStatus', 'expired', 'VALIDATED', 'manual');

    const result = runQualificationGates(record);

    const byCategory = Object.fromEntries(result.gateResults.map((g) => [g.category, g.result]));
    expect(byCategory.capability).toBe('PASS');
    expect(byCategory.capacity).toBe('PASS');
    expect(byCategory.commercial).toBe('PASS');
    expect(byCategory.compliance).toBe('CRITICAL_FAIL');
    expect(result.overallStatus).toBe('NOT_QUALIFIED');
    expect(result.blockingGate).toBe('compliance');
  });

  it('never lets the strong aggregate elsewhere hide the named blocking gate', () => {
    const record = freshRecord('manufacturer');
    const entityId = record.hierarchy.legalEntityId;
    for (const cat of ['capability', 'financial', 'quality', 'capacity', 'technical', 'commercial', 'risk', 'operational'] as const) {
      attachFact(record, entityId, 'legalEntity', cat, 'strong', 'PROVEN', 'erp');
    }
    attachFact(record, entityId, 'legalEntity', 'certificationStatus', 'revoked', 'PROVEN', 'erp');

    const result = runQualificationGates(record);
    const passCount = result.gateResults.filter((g) => g.result === 'PASS').length;
    expect(passCount).toBeGreaterThanOrEqual(8);
    expect(result.overallStatus).toBe('NOT_QUALIFIED');
    expect(result.blockingGate).toContain('compliance');
  });
});

describe('runQualificationGates -- clean qualification path', () => {
  it('returns QUALIFIED when every gate PASSes', () => {
    const record = freshRecord('manufacturer');
    const entityId = record.hierarchy.legalEntityId;
    for (const cat of ['capability', 'financial', 'quality', 'compliance', 'capacity', 'technical', 'commercial', 'risk', 'operational'] as const) {
      attachFact(record, entityId, 'legalEntity', cat, 'strong', 'PROVEN', 'erp');
    }
    const result = runQualificationGates(record);
    expect(result.overallStatus).toBe('QUALIFIED');
    expect(result.blockingGate).toBeNull();
  });

  it('always discloses the ESG gap, never a silently-dropped dimension (Decision Record 8.7)', () => {
    const record = freshRecord('manufacturer');
    const result = runQualificationGates(record);
    expect(result.unscoredDimensions.some((d) => /ESG/i.test(d))).toBe(true);
  });

  it('returns INSUFFICIENT_EVIDENCE overall when no gate has failed but evidence is missing', () => {
    const record = freshRecord('manufacturer');
    const result = runQualificationGates(record);
    expect(result.overallStatus).toBe('INSUFFICIENT_EVIDENCE');
  });

  it('returns CONDITIONALLY_QUALIFIED when the weakest link is CONDITIONAL, not a failure', () => {
    const record = freshRecord('manufacturer');
    const entityId = record.hierarchy.legalEntityId;
    for (const cat of ['capability', 'financial', 'quality', 'compliance', 'capacity', 'technical', 'commercial', 'risk', 'operational'] as const) {
      attachFact(record, entityId, 'legalEntity', cat, 'strong', 'PROVEN', 'erp');
    }
    // Weaken exactly one category below its threshold, without triggering a critical-fail rule.
    attachFact(record, entityId, 'legalEntity', 'quality', 'thin', 'CLAIMED', 'manual');
    const result = runQualificationGates(record);
    expect(result.overallStatus).toBe('CONDITIONALLY_QUALIFIED');
  });
});

// ---------------------------------------------------------------------------
// EXTENSION TESTS (8 Sep 2026) -- Qualification vs. Due Diligence framework
// ---------------------------------------------------------------------------

import {
  mechanismForEvidenceStage,
  determineDueDiligenceTier,
  thresholdsForTier,
  applyQualificationOutcome,
  GATE_CATEGORY_TYPE,
  ENHANCED_DD_THRESHOLD_OVERRIDES,
  ENHANCED_DD_UNIMPLEMENTED_MECHANISMS,
  type QualificationResult,
} from '@/lib/supplierQualificationGates';

describe('mechanismForEvidenceStage -- TPRM-aligned vocabulary over Module 03s evidence ladder', () => {
  it('maps every evidence stage to its named mechanism, 1:1', () => {
    expect(mechanismForEvidenceStage('CLAIMED')).toBe('self-declared');
    expect(mechanismForEvidenceStage('DOCUMENTED')).toBe('documentary');
    expect(mechanismForEvidenceStage('VALIDATED')).toBe('third-party-verified');
    expect(mechanismForEvidenceStage('OBSERVED')).toBe('observed');
    expect(mechanismForEvidenceStage('PROVEN')).toBe('independently-proven');
  });

  it('returns null for null input, never a guessed mechanism', () => {
    expect(mechanismForEvidenceStage(null)).toBeNull();
  });
});

describe('GATE_CATEGORY_TYPE -- qualification vs due-diligence tagging', () => {
  it('tags the seven ISO 9001 / CIPS "can they do it" categories as qualification', () => {
    for (const cat of ['identity', 'capability', 'capacity', 'technical', 'quality', 'commercial', 'operational'] as const) {
      expect(GATE_CATEGORY_TYPE[cat]).toBe('qualification');
    }
  });

  it('tags the three OECD/TPRM "is it safe to engage" categories as due-diligence', () => {
    for (const cat of ['compliance', 'financial', 'risk'] as const) {
      expect(GATE_CATEGORY_TYPE[cat]).toBe('due-diligence');
    }
  });

  it('every GateResult from checkGate carries the correct categoryType', () => {
    const record = freshRecord('manufacturer');
    for (const category of GATE_CATEGORIES) {
      const result = checkGate(record, category);
      expect(result.categoryType).toBe(GATE_CATEGORY_TYPE[category]);
    }
  });
});

describe('GateResult.mechanism is populated consistently with evidenceStage', () => {
  it('mechanism is null exactly when evidenceStage is null (identity gate, no-fact gates)', () => {
    const record = freshRecord('manufacturer');
    const identity = checkGate(record, 'identity');
    expect(identity.evidenceStage).toBeNull();
    expect(identity.mechanism).toBeNull();

    const noFacts = checkGate(record, 'financial');
    expect(noFacts.evidenceStage).toBeNull();
    expect(noFacts.mechanism).toBeNull();
  });

  it('mechanism reflects the actual weakest evidenceStage on a PASS', () => {
    const record = freshRecord('manufacturer');
    attachFact(record, record.hierarchy.legalEntityId, 'legalEntity', 'financialPosition', 500000, 'DOCUMENTED', 'erp');
    const result = checkGate(record, 'financial');
    expect(result.result).toBe('PASS');
    expect(result.evidenceStage).toBe('DOCUMENTED');
    expect(result.mechanism).toBe('documentary');
  });

  it('mechanism reflects evidenceStage on a CRITICAL_FAIL (expired certification)', () => {
    const record = freshRecord('manufacturer');
    attachFact(record, record.hierarchy.legalEntityId, 'legalEntity', 'certificationStatus', 'expired', 'VALIDATED', 'manual');
    const result = checkGate(record, 'compliance');
    expect(result.result).toBe('CRITICAL_FAIL');
    expect(result.evidenceStage).toBe('VALIDATED');
    expect(result.mechanism).toBe('third-party-verified');
  });
});

describe('determineDueDiligenceTier -- risk-based tiering from Module 02s own fields (OECD/TPRM proportionality)', () => {
  it('is ENHANCED for the strategic Kraljic quadrant', () => {
    expect(determineDueDiligenceTier({ kraljicQuadrant: 'strategic' })).toBe('ENHANCED');
  });

  it('is ENHANCED for the bottleneck Kraljic quadrant', () => {
    expect(determineDueDiligenceTier({ kraljicQuadrant: 'bottleneck' })).toBe('ENHANCED');
  });

  it('is STANDARD for leverage and non-critical quadrants absent high geographic risk', () => {
    expect(determineDueDiligenceTier({ kraljicQuadrant: 'leverage' })).toBe('STANDARD');
    expect(determineDueDiligenceTier({ kraljicQuadrant: 'non-critical' })).toBe('STANDARD');
  });

  it('is ENHANCED when geographicRisk is 4 or higher, regardless of quadrant', () => {
    expect(determineDueDiligenceTier({ kraljicQuadrant: 'non-critical', geographicRisk: 4 })).toBe('ENHANCED');
    expect(determineDueDiligenceTier({ kraljicQuadrant: 'non-critical', geographicRisk: 5 })).toBe('ENHANCED');
  });

  it('is STANDARD when geographicRisk is below 4', () => {
    expect(determineDueDiligenceTier({ geographicRisk: 3 })).toBe('STANDARD');
    expect(determineDueDiligenceTier({ geographicRisk: 1 })).toBe('STANDARD');
  });

  it('defaults to STANDARD with no inputs -- the honest answer when criticality/geography have not been assessed', () => {
    expect(determineDueDiligenceTier()).toBe('STANDARD');
    expect(determineDueDiligenceTier({})).toBe('STANDARD');
  });
});

describe('thresholdsForTier -- Enhanced-DD overrides applied only to due-diligence categories', () => {
  it('STANDARD returns the base threshold object unchanged', () => {
    const result = thresholdsForTier(DEFAULT_GATE_THRESHOLDS, 'STANDARD');
    expect(result).toBe(DEFAULT_GATE_THRESHOLDS);
  });

  it('ENHANCED applies the three overrides (compliance/financial/risk) and leaves qualification categories untouched', () => {
    const result = thresholdsForTier(DEFAULT_GATE_THRESHOLDS, 'ENHANCED');
    expect(result.minEvidenceStageForPass.compliance).toBe(ENHANCED_DD_THRESHOLD_OVERRIDES.compliance);
    expect(result.minEvidenceStageForPass.financial).toBe(ENHANCED_DD_THRESHOLD_OVERRIDES.financial);
    expect(result.minEvidenceStageForPass.risk).toBe(ENHANCED_DD_THRESHOLD_OVERRIDES.risk);
    // Qualification categories must be unaffected -- proportionality principle (file header DECISION on ENHANCED_DD_THRESHOLD_OVERRIDES).
    expect(result.minEvidenceStageForPass.capability).toBe(DEFAULT_GATE_THRESHOLDS.minEvidenceStageForPass.capability);
    expect(result.minEvidenceStageForPass.identity).toBe(DEFAULT_GATE_THRESHOLDS.minEvidenceStageForPass.identity);
    expect(result.minEvidenceStageForPass.commercial).toBe(DEFAULT_GATE_THRESHOLDS.minEvidenceStageForPass.commercial);
  });

  it('does not mutate the base thresholds object', () => {
    const baseCopy = JSON.parse(JSON.stringify(DEFAULT_GATE_THRESHOLDS));
    thresholdsForTier(DEFAULT_GATE_THRESHOLDS, 'ENHANCED');
    expect(DEFAULT_GATE_THRESHOLDS).toEqual(baseCopy);
  });
});

describe('runQualificationGates -- ENHANCED tier end-to-end (proves the raised bar actually changes outcomes)', () => {
  it('a financial fact that PASSes under STANDARD becomes CONDITIONAL under ENHANCED', () => {
    const record = freshRecord('manufacturer');
    // DOCUMENTED clears the STANDARD financial threshold (DOCUMENTED) but not
    // the ENHANCED override (VALIDATED).
    attachFact(record, record.hierarchy.legalEntityId, 'legalEntity', 'financialPosition', 500000, 'DOCUMENTED', 'erp');

    const standard = runQualificationGates(record, DEFAULT_GATE_THRESHOLDS, undefined, 'STANDARD');
    const enhanced = runQualificationGates(record, DEFAULT_GATE_THRESHOLDS, undefined, 'ENHANCED');

    const standardFinancial = standard.gateResults.find((g) => g.category === 'financial')!;
    const enhancedFinancial = enhanced.gateResults.find((g) => g.category === 'financial')!;
    expect(standardFinancial.result).toBe('PASS');
    expect(enhancedFinancial.result).toBe('CONDITIONAL');
  });

  it('a compliance fact that PASSes under STANDARD (VALIDATED) becomes CONDITIONAL under ENHANCED (requires OBSERVED)', () => {
    const record = freshRecord('manufacturer');
    attachFact(record, record.hierarchy.legalEntityId, 'legalEntity', 'certificationStatus', 'active', 'VALIDATED', 'manual');

    const standard = runQualificationGates(record, DEFAULT_GATE_THRESHOLDS, undefined, 'STANDARD');
    const enhanced = runQualificationGates(record, DEFAULT_GATE_THRESHOLDS, undefined, 'ENHANCED');

    expect(standard.gateResults.find((g) => g.category === 'compliance')!.result).toBe('PASS');
    expect(enhanced.gateResults.find((g) => g.category === 'compliance')!.result).toBe('CONDITIONAL');
  });

  it('does NOT raise the bar for qualification categories (capability unaffected by tier)', () => {
    const record = freshRecord('manufacturer');
    attachFact(record, record.hierarchy.legalEntityId, 'legalEntity', 'capability', 'motor assembly', 'DOCUMENTED', 'manual');

    const standard = runQualificationGates(record, DEFAULT_GATE_THRESHOLDS, undefined, 'STANDARD');
    const enhanced = runQualificationGates(record, DEFAULT_GATE_THRESHOLDS, undefined, 'ENHANCED');

    expect(standard.gateResults.find((g) => g.category === 'capability')!.result)
      .toBe(enhanced.gateResults.find((g) => g.category === 'capability')!.result);
  });

  it('defaults to STANDARD when the tier argument is omitted (backward compatible)', () => {
    const record = freshRecord('manufacturer');
    attachFact(record, record.hierarchy.legalEntityId, 'legalEntity', 'financialPosition', 500000, 'DOCUMENTED', 'erp');
    const result = runQualificationGates(record);
    expect(result.dueDiligenceTier).toBe('STANDARD');
    expect(result.gateResults.find((g) => g.category === 'financial')!.result).toBe('PASS');
  });

  it('reports the actual tier used on the result object', () => {
    const record = freshRecord('manufacturer');
    expect(runQualificationGates(record, DEFAULT_GATE_THRESHOLDS, undefined, 'ENHANCED').dueDiligenceTier).toBe('ENHANCED');
    expect(runQualificationGates(record, DEFAULT_GATE_THRESHOLDS, undefined, 'STANDARD').dueDiligenceTier).toBe('STANDARD');
  });
});

describe('dueDiligenceGaps -- disclosed, never silently implied as covered (Decision Record 8.7)', () => {
  it('is empty under STANDARD tier', () => {
    const record = freshRecord('manufacturer');
    const result = runQualificationGates(record, DEFAULT_GATE_THRESHOLDS, undefined, 'STANDARD');
    expect(result.dueDiligenceGaps).toEqual([]);
  });

  it('lists all four named unimplemented mechanisms under ENHANCED tier', () => {
    const record = freshRecord('manufacturer');
    const result = runQualificationGates(record, DEFAULT_GATE_THRESHOLDS, undefined, 'ENHANCED');
    expect(result.dueDiligenceGaps).toEqual(ENHANCED_DD_UNIMPLEMENTED_MECHANISMS);
    expect(result.dueDiligenceGaps.length).toBe(4);
    expect(result.dueDiligenceGaps.some((g) => /sanctions|PEP/i.test(g))).toBe(true);
    expect(result.dueDiligenceGaps.some((g) => /beneficial-ownership|UBO/i.test(g))).toBe(true);
    expect(result.dueDiligenceGaps.some((g) => /credit-bureau/i.test(g))).toBe(true);
    expect(result.dueDiligenceGaps.some((g) => /continuous/i.test(g))).toBe(true);
  });
});

describe('applyQualificationOutcome -- wires the qualification decision back into Module 03s discoveryState lifecycle', () => {
  function resultWith(overallStatus: QualificationResult['overallStatus']): QualificationResult {
    return {
      supplierId: 'test-supplier',
      gateResults: [],
      overallStatus,
      blockingGate: overallStatus === 'NOT_QUALIFIED' ? 'compliance' : null,
      unscoredDimensions: [],
      dueDiligenceTier: 'STANDARD',
      dueDiligenceGaps: [],
    };
  }

  it('advances a VERIFIED record to QUALIFIED on a QUALIFIED result', () => {
    const record = freshRecord('manufacturer');
    record.discoveryState = 'VERIFIED';
    const updated = applyQualificationOutcome(record, resultWith('QUALIFIED'));
    expect(updated.discoveryState).toBe('QUALIFIED');
  });

  it('advances a record below VERIFIED (e.g. SCREENED) straight to QUALIFIED on a QUALIFIED result', () => {
    const record = freshRecord('manufacturer');
    record.discoveryState = 'SCREENED';
    const updated = applyQualificationOutcome(record, resultWith('QUALIFIED'));
    expect(updated.discoveryState).toBe('QUALIFIED');
  });

  it('leaves a record already at RECOMMENDED/SELECTED/APPROVED untouched on a fresh QUALIFIED result -- never pulled backward', () => {
    for (const state of ['RECOMMENDED', 'SELECTED', 'APPROVED'] as const) {
      const record = freshRecord('manufacturer');
      record.discoveryState = state;
      const updated = applyQualificationOutcome(record, resultWith('QUALIFIED'));
      expect(updated.discoveryState).toBe(state);
    }
  });

  it('regresses QUALIFIED/RECOMMENDED/SELECTED/APPROVED to VERIFIED on a NOT_QUALIFIED result (failed re-audit, not a full delisting)', () => {
    for (const state of ['QUALIFIED', 'RECOMMENDED', 'SELECTED', 'APPROVED'] as const) {
      const record = freshRecord('manufacturer');
      record.discoveryState = state;
      const updated = applyQualificationOutcome(record, resultWith('NOT_QUALIFIED'));
      expect(updated.discoveryState).toBe('VERIFIED');
    }
  });

  it('does nothing on a NOT_QUALIFIED result for a record that was never qualified in the first place', () => {
    for (const state of ['DISCOVERED', 'POTENTIALLY_RELEVANT', 'SCREENED', 'EVIDENCE_SUPPORTED', 'VERIFIED'] as const) {
      const record = freshRecord('manufacturer');
      record.discoveryState = state;
      const updated = applyQualificationOutcome(record, resultWith('NOT_QUALIFIED'));
      expect(updated.discoveryState).toBe(state);
    }
  });

  it('is inert on CONDITIONALLY_QUALIFIED -- ambiguous evidence must never imply an earned lifecycle move', () => {
    const record = freshRecord('manufacturer');
    record.discoveryState = 'VERIFIED';
    const updated = applyQualificationOutcome(record, resultWith('CONDITIONALLY_QUALIFIED'));
    expect(updated.discoveryState).toBe('VERIFIED');
  });

  it('is inert on INSUFFICIENT_EVIDENCE -- missing evidence must never imply an earned lifecycle move', () => {
    const record = freshRecord('manufacturer');
    record.discoveryState = 'SCREENED';
    const updated = applyQualificationOutcome(record, resultWith('INSUFFICIENT_EVIDENCE'));
    expect(updated.discoveryState).toBe('SCREENED');
  });

  it('mutates and returns the same record instance (matches logEntityResolution mutation pattern)', () => {
    const record = freshRecord('manufacturer');
    record.discoveryState = 'VERIFIED';
    const updated = applyQualificationOutcome(record, resultWith('QUALIFIED'));
    expect(updated).toBe(record);
  });

  it('end-to-end: runQualificationGates -> applyQualificationOutcome moves a real record from VERIFIED to QUALIFIED', () => {
    const record = freshRecord('manufacturer');
    record.discoveryState = 'VERIFIED';
    const entityId = record.hierarchy.legalEntityId;
    for (const cat of ['capability', 'financial', 'quality', 'compliance', 'capacity', 'technical', 'commercial', 'risk', 'operational'] as const) {
      attachFact(record, entityId, 'legalEntity', cat, 'strong', 'PROVEN', 'erp');
    }
    const result = runQualificationGates(record);
    expect(result.overallStatus).toBe('QUALIFIED');
    applyQualificationOutcome(record, result);
    expect(record.discoveryState).toBe('QUALIFIED');
  });

  it('end-to-end: a real record with an expired certification is regressed from QUALIFIED back to VERIFIED', () => {
    const record = freshRecord('manufacturer');
    record.discoveryState = 'QUALIFIED';
    const entityId = record.hierarchy.legalEntityId;
    attachFact(record, entityId, 'legalEntity', 'certificationStatus', 'expired', 'VALIDATED', 'manual');
    const result = runQualificationGates(record);
    expect(result.overallStatus).toBe('NOT_QUALIFIED');
    applyQualificationOutcome(record, result);
    expect(record.discoveryState).toBe('VERIFIED');
  });
});

// ---------------------------------------------------------------------------
// Saturation pass -- additional edge-case precision (identity mechanism-null
// on every branch, and the exact geographicRisk boundary) per the standing
// "enhancement saturation" instruction: verify, don't assume, every branch.
// ---------------------------------------------------------------------------

describe('identity gate -- mechanism is null on every confidence branch, not just PASS', () => {
  it('CONDITIONAL (MODERATE/LOW) and INSUFFICIENT_EVIDENCE (UNVERIFIED) branches also carry mechanism: null', () => {
    const record = freshRecord();
    record.entityResolution.confidence = 'MODERATE';
    expect(checkGate(record, 'identity').mechanism).toBeNull();
    record.entityResolution.confidence = 'LOW';
    expect(checkGate(record, 'identity').mechanism).toBeNull();
    record.entityResolution.confidence = 'UNVERIFIED';
    expect(checkGate(record, 'identity').mechanism).toBeNull();
  });
});

describe('determineDueDiligenceTier -- exact geographicRisk boundary', () => {
  it('3.99 stays STANDARD, exactly 4 flips to ENHANCED', () => {
    expect(determineDueDiligenceTier({ geographicRisk: 3.99 })).toBe('STANDARD');
    expect(determineDueDiligenceTier({ geographicRisk: 4 })).toBe('ENHANCED');
  });
});

describe('ENHANCED_DD_THRESHOLD_OVERRIDES -- scoped to exactly the three due-diligence categories', () => {
  it('has exactly compliance, financial, and risk as keys -- no accidental qualification-category override', () => {
    expect(Object.keys(ENHANCED_DD_THRESHOLD_OVERRIDES).sort()).toEqual(['compliance', 'financial', 'risk']);
  });
});
