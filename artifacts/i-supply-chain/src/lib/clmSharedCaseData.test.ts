import { describe, it, expect } from 'vitest';
import { correlateSupplierChecksWithContracts, type CorrelationContractInput } from './clmSharedCaseData';
import { newSupplierCheck, type SupplierCheck } from './supplierDependency';

function criticalCheck(name: string): SupplierCheck {
  return {
    ...newSupplierCheck(name),
    hasNamedAlternative: false,
    contractType: 'relationship',
    volumeConcentrationPct: 90,
    hasRecentStressSignal: true,
  };
}

function lowCheck(name: string): SupplierCheck {
  return {
    ...newSupplierCheck(name),
    hasNamedAlternative: true,
    contractType: 'written',
    volumeConcentrationPct: 5,
    hasRecentStressSignal: false,
  };
}

function contract(overrides: Partial<CorrelationContractInput> = {}): CorrelationContractInput {
  return { id: 'c1', name: 'Test Contract', supplier: 'Acme Supplies', endDate: '', ...overrides };
}

describe('correlateSupplierChecksWithContracts (#381, 2-source correlation)', () => {
  it('returns nothing when supplier names do not match', () => {
    const result = correlateSupplierChecksWithContracts(
      [criticalCheck('Acme Supplies')],
      [contract({ supplier: 'A Totally Different Vendor' })],
    );
    expect(result).toEqual([]);
  });

  it('matches on exact, case-insensitive, trimmed supplier name', () => {
    const result = correlateSupplierChecksWithContracts(
      [criticalCheck('  Acme Supplies  ')],
      [contract({ supplier: 'acme supplies' })],
    );
    expect(result).toHaveLength(1);
    expect(result[0].matchedContractId).toBe('c1');
  });

  it('does NOT fuzzy/substring match -- a partial name is not a match', () => {
    const result = correlateSupplierChecksWithContracts(
      [criticalCheck('Acme')],
      [contract({ supplier: 'Acme Supplies International' })],
    );
    expect(result).toEqual([]);
  });

  it('flags when severity is Critical/Moderate AND renewal is within 90 days', () => {
    const soon = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const result = correlateSupplierChecksWithContracts(
      [criticalCheck('Acme Supplies')],
      [contract({ endDate: soon })],
    );
    expect(result).toHaveLength(1);
    expect(result[0].flagged).toBe(true);
    expect(result[0].narrativeEn).toContain('renewal');
  });

  it('does not flag when severity is Low even with renewal approaching', () => {
    const soon = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const result = correlateSupplierChecksWithContracts(
      [lowCheck('Acme Supplies')],
      [contract({ endDate: soon })],
    );
    expect(result).toHaveLength(1);
    expect(result[0].flagged).toBe(false);
  });

  it('does not flag when severity is Critical but renewal is far away', () => {
    const far = new Date(Date.now() + 400 * 86400000).toISOString().slice(0, 10);
    const result = correlateSupplierChecksWithContracts(
      [criticalCheck('Acme Supplies')],
      [contract({ endDate: far })],
    );
    expect(result).toHaveLength(1);
    expect(result[0].flagged).toBe(false);
  });

  it('handles a contract with no endDate (undefined daysUntilRenewal, not flagged)', () => {
    const result = correlateSupplierChecksWithContracts(
      [criticalCheck('Acme Supplies')],
      [contract({ endDate: '' })],
    );
    expect(result).toHaveLength(1);
    expect(result[0].daysUntilRenewal).toBeUndefined();
    expect(result[0].flagged).toBe(false);
  });

  it('ignores supplier checks and contracts with blank names', () => {
    const result = correlateSupplierChecksWithContracts(
      [{ ...criticalCheck(''), name: '' }],
      [contract({ supplier: '' })],
    );
    expect(result).toEqual([]);
  });

  it('one supplier check can match multiple contracts with the same supplier name', () => {
    const result = correlateSupplierChecksWithContracts(
      [criticalCheck('Acme Supplies')],
      [contract({ id: 'c1', supplier: 'Acme Supplies' }), contract({ id: 'c2', supplier: 'Acme Supplies' })],
    );
    expect(result).toHaveLength(2);
  });
});
