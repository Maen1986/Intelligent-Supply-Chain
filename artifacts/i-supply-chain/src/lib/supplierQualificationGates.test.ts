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
