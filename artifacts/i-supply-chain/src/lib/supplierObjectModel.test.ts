import { describe, expect, it, beforeEach } from 'vitest';
import {
  OBJECT_MODEL_LEVELS,
  EVIDENCE_LADDER,
  DISCOVERY_STATES,
  impliesFitnessForUse,
  newSupplierNode,
  newSupplierRecord,
  assessSupplierRoleDataQuality,
  evidenceRank,
  isForwardOrEqualEvidenceMove,
  deriveFactConfidence,
  attachFact,
  certificationAppliesToSite,
  resolveSupplierEntity,
  confirmManualResolution,
  logEntityResolution,
  advanceDiscoveryState,
  toOutputSchema,
  _resetIdCounterForTests,
  type RegistryEntry,
} from '@/lib/supplierObjectModel';

beforeEach(() => {
  _resetIdCounterForTests();
});

describe('object model vocabulary', () => {
  it('has all 22 levels from the Charter/Module 03 header line, in order', () => {
    expect(OBJECT_MODEL_LEVELS).toEqual([
      'group', 'parent', 'legalEntity', 'operatingEntity', 'site', 'productionLine',
      'capability', 'technology', 'equipment', 'productService', 'certification',
      'capacity', 'quality', 'customer', 'subTier', 'logistics', 'financialPosition',
      'commercialPosition', 'contract', 'performance', 'risk', 'alternative',
    ]);
  });

  it('evidence ladder is CLAIMED -> DOCUMENTED -> VALIDATED -> OBSERVED -> PROVEN', () => {
    expect(EVIDENCE_LADDER).toEqual(['CLAIMED', 'DOCUMENTED', 'VALIDATED', 'OBSERVED', 'PROVEN']);
  });

  it('discovery states run DISCOVERED through APPROVED with QUALIFIED as the fitness threshold', () => {
    expect(DISCOVERY_STATES[0]).toBe('DISCOVERED');
    expect(DISCOVERY_STATES[DISCOVERY_STATES.length - 1]).toBe('APPROVED');
    expect(impliesFitnessForUse('SCREENED')).toBe(false);
    expect(impliesFitnessForUse('EVIDENCE_SUPPORTED')).toBe(false);
    expect(impliesFitnessForUse('QUALIFIED')).toBe(true);
    expect(impliesFitnessForUse('APPROVED')).toBe(true);
  });

  it('discovery is never qualification -- a supplier can sit at DISCOVERED indefinitely without implying fitness', () => {
    expect(impliesFitnessForUse('DISCOVERED')).toBe(false);
  });
});

describe('supplierRole data quality (Decision 2 -- optional at intake)', () => {
  it('defaults new records to unknown, not a forced choice, and flags the gap', () => {
    const node = newSupplierNode('legalEntity', 'Acme Freight LLC', { country: 'Saudi Arabia' });
    const record = newSupplierRecord(node);
    expect(record.supplierRole).toBe('unknown');
    const gap = assessSupplierRoleDataQuality(record);
    expect(gap.hasGap).toBe(true);
    expect(gap.reasonEn.toLowerCase()).toContain('trader');
  });

  it('confirmed roles have no gap', () => {
    const node = newSupplierNode('legalEntity', 'Acme Manufacturing Co', { country: 'Saudi Arabia' });
    const record = newSupplierRecord(node, 'manufacturer');
    expect(assessSupplierRoleDataQuality(record).hasGap).toBe(false);
  });
});

describe('evidence ladder mechanics', () => {
  it('ranks stages in ascending strength order', () => {
    expect(evidenceRank('CLAIMED')).toBe(0);
    expect(evidenceRank('PROVEN')).toBe(4);
    expect(evidenceRank('OBSERVED')).toBeGreaterThan(evidenceRank('VALIDATED'));
  });

  it('allows forward or equal moves, rejects backward moves', () => {
    expect(isForwardOrEqualEvidenceMove('CLAIMED', 'DOCUMENTED')).toBe(true);
    expect(isForwardOrEqualEvidenceMove('CLAIMED', 'PROVEN')).toBe(true);
    expect(isForwardOrEqualEvidenceMove('VALIDATED', 'VALIDATED')).toBe(true);
    expect(isForwardOrEqualEvidenceMove('PROVEN', 'CLAIMED')).toBe(false);
  });

  it('deriveFactConfidence: CLAIMED is always UNVERIFIED regardless of source', () => {
    expect(deriveFactConfidence('CLAIMED', 'erp')).toBe('UNVERIFIED');
    expect(deriveFactConfidence('CLAIMED', 'manual')).toBe('UNVERIFIED');
  });

  it('deriveFactConfidence: OBSERVED/PROVEN are always HIGH regardless of source', () => {
    expect(deriveFactConfidence('OBSERVED', 'manual')).toBe('HIGH');
    expect(deriveFactConfidence('PROVEN', 'manual')).toBe('HIGH');
    expect(deriveFactConfidence('OBSERVED', 'erp')).toBe('HIGH');
  });

  it('deriveFactConfidence: VALIDATED is HIGH from a system-of-record, MODERATE from manual/imported-file', () => {
    expect(deriveFactConfidence('VALIDATED', 'erp')).toBe('HIGH');
    expect(deriveFactConfidence('VALIDATED', 'wms')).toBe('HIGH');
    expect(deriveFactConfidence('VALIDATED', 'scm')).toBe('HIGH');
    expect(deriveFactConfidence('VALIDATED', 'crm')).toBe('HIGH');
    expect(deriveFactConfidence('VALIDATED', 'manual')).toBe('MODERATE');
    expect(deriveFactConfidence('VALIDATED', 'imported-file')).toBe('MODERATE');
  });

  it('deriveFactConfidence: DOCUMENTED is MODERATE from a system-of-record, LOW from manual/imported-file', () => {
    expect(deriveFactConfidence('DOCUMENTED', 'erp')).toBe('MODERATE');
    expect(deriveFactConfidence('DOCUMENTED', 'manual')).toBe('LOW');
    expect(deriveFactConfidence('DOCUMENTED', 'imported-file')).toBe('LOW');
  });

  it('attachFact stamps derived confidence and records the fact on the record', () => {
    const node = newSupplierNode('site', 'Dammam Site 1');
    const record = newSupplierRecord(node);
    const fact = attachFact(record, node.id, 'site', 'ISO 9001', 'valid', 'DOCUMENTED', 'manual', '2026-01-01T00:00:00.000Z');
    expect(fact.confidence).toBe('LOW');
    expect(record.facts).toHaveLength(1);
    expect(record.facts[0].id).toBe(fact.id);
  });
});

describe('certification site-binding (never trickles down from legal entity)', () => {
  it('a certification only applies to the exact site it is attached to', () => {
    const legalEntity = newSupplierNode('legalEntity', 'Parent Co');
    const record = newSupplierRecord(legalEntity);
    const site = newSupplierNode('site', 'Site A', { parentNodeId: legalEntity.id });
    record.hierarchy.siteIds.push(site.id);
    record.nodes.push(site);

    expect(certificationAppliesToSite(record, site.id, site.id)).toBe(true);
    expect(certificationAppliesToSite(record, legalEntity.id, site.id)).toBe(false);
  });

  it('a certification does not apply to a site never registered on the record', () => {
    const legalEntity = newSupplierNode('legalEntity', 'Parent Co');
    const record = newSupplierRecord(legalEntity);
    expect(certificationAppliesToSite(record, 'some-other-site', 'some-other-site')).toBe(false);
  });
});

describe('entity resolution -- Rawabi two-freight-forwarders scenario', () => {
  // Client's spreadsheet lists these as two unrelated suppliers under two
  // different trading names; both are actually the same legal group.
  const registry: RegistryEntry[] = [
    {
      supplierId: 'supplier-gulf-line',
      legalEntityNumber: '1010-445-9182',
      legalName: 'Gulf Line Logistics Holding W.L.L.',
      tradingNames: ['Gulf Line Freight', 'GLF Forwarding'],
      declaredParent: null,
      country: 'Saudi Arabia',
    },
  ];

  it('Tier 1 -- resolves "Al Rawabi Cargo Services" to the same group via exact legal entity number match', () => {
    const result = resolveSupplierEntity(
      {
        legalEntityNumber: '1010-445-9182',
        legalName: 'Al Rawabi Cargo Services Co.',
        tradingName: 'Al Rawabi Cargo',
        country: 'Saudi Arabia',
      },
      registry,
    );
    expect(result.isNewEntity).toBe(false);
    expect(result.resolvedAgainst).toBe('supplier-gulf-line');
    expect(result.method).toBe('legal-entity-number');
    expect(result.confidence).toBe('HIGH');
  });

  it('legal entity number match is exact-only and tolerant of formatting (dashes/spaces/case)', () => {
    const result = resolveSupplierEntity(
      { legalEntityNumber: ' 1010 445 9182 ', country: 'Saudi Arabia' },
      registry,
    );
    expect(result.resolvedAgainst).toBe('supplier-gulf-line');
    expect(result.method).toBe('legal-entity-number');
  });

  it('Tier 2 -- falls back to legal name + country when no legal entity number is supplied', () => {
    const result = resolveSupplierEntity(
      { legalName: 'Gulf Line Logistics Holding W.L.L.', country: 'Saudi Arabia' },
      registry,
    );
    expect(result.resolvedAgainst).toBe('supplier-gulf-line');
    expect(result.method).toBe('legal-name-country');
    expect(result.confidence).toBe('MODERATE');
  });

  it('Tier 3 -- falls back to trading name + declared parent + country', () => {
    const withParent: RegistryEntry[] = [{ ...registry[0], declaredParent: 'Gulf Line Holding Group' }];
    const result = resolveSupplierEntity(
      { tradingName: 'GLF Forwarding', declaredParent: 'Gulf Line Holding Group', country: 'Saudi Arabia' },
      withParent,
    );
    expect(result.resolvedAgainst).toBe('supplier-gulf-line');
    expect(result.method).toBe('trading-name-parent-country');
    expect(result.confidence).toBe('LOW');
  });

  it('flags a near-miss (partial overlap, no tier cleared) instead of auto-merging or discarding', () => {
    const result = resolveSupplierEntity(
      { legalName: 'Gulf Line Trading Est.', country: 'Saudi Arabia' },
      registry,
    );
    expect(result.resolvedAgainst).toBeNull();
    expect(result.method).toBe('near-miss-unconfirmed');
    expect(result.confidence).toBe('LOW');
    expect(result.candidateMatches).toContain('supplier-gulf-line');
  });

  it('records a genuinely new entity when nothing matches on any tier or partial signal', () => {
    const result = resolveSupplierEntity(
      { legalName: 'Zenith Component Traders', country: 'United Arab Emirates' },
      registry,
    );
    expect(result.isNewEntity).toBe(true);
    expect(result.method).toBe('no-match-new-entity');
    expect(result.confidence).toBe('HIGH');
  });

  it('a false merge and a false split are both avoided: two different real suppliers in the same country never collide', () => {
    const other: RegistryEntry = {
      supplierId: 'supplier-independent-forwarder',
      legalEntityNumber: '2020-777-0001',
      legalName: 'Falcon Freight Services Co.',
      tradingNames: ['Falcon Freight'],
      declaredParent: null,
      country: 'Saudi Arabia',
    };
    const result = resolveSupplierEntity(
      { legalEntityNumber: '2020-777-0001', legalName: 'Falcon Freight Services Co.', country: 'Saudi Arabia' },
      [...registry, other],
    );
    expect(result.resolvedAgainst).toBe('supplier-independent-forwarder');
    expect(result.resolvedAgainst).not.toBe('supplier-gulf-line');
  });

  it('manual confirmation is the logged last resort and never auto-fires from resolveSupplierEntity', () => {
    const manual = confirmManualResolution('supplier-gulf-line', 'Reviewer called both forwarders; confirmed same ownership by phone.');
    expect(manual.method).toBe('manual-confirmation');
    expect(manual.confidence).toBe('MODERATE');
    expect(manual.resolvedAgainst).toBe('supplier-gulf-line');

    const node = newSupplierNode('legalEntity', 'Al Rawabi Cargo Services Co.', { country: 'Saudi Arabia' });
    const record = newSupplierRecord(node);
    logEntityResolution(record, manual);
    expect(record.entityResolution.method).toBe('manual-confirmation');
    expect(record.entityResolution.decidedAt).toBeTruthy();
  });
});

describe('discovery state transitions', () => {
  it('advances forward freely', () => {
    expect(advanceDiscoveryState('DISCOVERED', 'SCREENED')).toBe('SCREENED');
  });

  it('rejects an accidental backward move', () => {
    expect(() => advanceDiscoveryState('QUALIFIED', 'SCREENED')).toThrow(/backward/);
  });

  it('allows an explicit, flagged regression (e.g. failed re-audit)', () => {
    expect(advanceDiscoveryState('QUALIFIED', 'SCREENED', true)).toBe('SCREENED');
  });
});

describe('toOutputSchema', () => {
  it('matches the SI-03 draft output shape', () => {
    const node = newSupplierNode('legalEntity', 'Al Rawabi Cargo Services Co.', { country: 'Saudi Arabia', legalEntityNumber: '1010-445-9182' });
    const record = newSupplierRecord(node, 'trader');
    attachFact(record, node.id, 'legalEntity', 'ISO 9001', 'valid', 'DOCUMENTED', 'manual');
    const schema = toOutputSchema(record);
    expect(schema.supplierId).toBe(record.supplierId);
    expect(schema.supplierRole).toBe('trader');
    expect(schema.hierarchy.legalEntity).toBe(node.id);
    expect(schema.facts).toHaveLength(1);
    expect(schema.facts[0].confidence).toBe('LOW');
    expect(schema.discoveryState).toBe('DISCOVERED');
  });
});
