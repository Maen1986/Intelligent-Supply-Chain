import { describe, it, expect } from 'vitest';
import { newSupplierCheck, isCheckComplete, deriveSeverity, buildSupplierDependencyPrompt, type SupplierCheck } from './supplierDependency';

function check(overrides: Partial<SupplierCheck> = {}): SupplierCheck {
  return { ...newSupplierCheck('Test Supplier'), ...overrides };
}

describe('isCheckComplete', () => {
  it('is false until the 3 required questions are answered', () => {
    expect(isCheckComplete(newSupplierCheck())).toBe(false);
    expect(isCheckComplete(check({ hasNamedAlternative: true }))).toBe(false);
    expect(isCheckComplete(check({ hasNamedAlternative: true, contractType: 'written' }))).toBe(false);
    expect(isCheckComplete(check({ hasNamedAlternative: true, contractType: 'written', hasRecentStressSignal: false }))).toBe(true);
  });

  it('treats false answers as answered, not missing', () => {
    const c = check({ hasNamedAlternative: false, contractType: 'relationship', hasRecentStressSignal: false });
    expect(isCheckComplete(c)).toBe(true);
  });
});

describe('deriveSeverity', () => {
  it('returns Incomplete when required questions are unanswered', () => {
    const result = deriveSeverity(newSupplierCheck(), false);
    expect(result.level).toBe('Incomplete');
    expect(result.signalsFired).toHaveLength(0);
  });

  it('flags Critical for the exact no-alternative + relationship + recent-stress combo', () => {
    const c = check({ hasNamedAlternative: false, contractType: 'relationship', hasRecentStressSignal: true });
    const result = deriveSeverity(c, false);
    expect(result.level).toBe('Critical');
    expect(result.signalsFired).toContain('noAlternative');
    expect(result.signalsFired).toContain('relationship');
    expect(result.signalsFired).toContain('recentStress');
  });

  it('does not flag Critical if only 2 of the 3 critical-combo signals fire', () => {
    // no alternative + relationship, but no recent stress -> Moderate (2 signals), not Critical
    const c = check({ hasNamedAlternative: false, contractType: 'relationship', hasRecentStressSignal: false });
    const result = deriveSeverity(c, false);
    expect(result.level).toBe('Moderate');
  });

  it('flags Moderate when exactly 2 of the 4 signals are present', () => {
    // relationship + high concentration, alternative exists, no recent stress
    const c = check({
      hasNamedAlternative: true, contractType: 'relationship', hasRecentStressSignal: false,
      volumeConcentrationPct: 75,
    });
    const result = deriveSeverity(c, false);
    expect(result.level).toBe('Moderate');
    expect(result.signalsFired).toEqual(expect.arrayContaining(['relationship', 'highConcentration']));
  });

  it('flags Low when a named alternative exists and no other signals fire', () => {
    const c = check({ hasNamedAlternative: true, contractType: 'written', hasRecentStressSignal: false, volumeConcentrationPct: 10 });
    const result = deriveSeverity(c, false);
    expect(result.level).toBe('Low');
    expect(result.signalsFired).toHaveLength(0);
  });

  it('flags Low when exactly 1 signal fires', () => {
    const c = check({ hasNamedAlternative: true, contractType: 'written', hasRecentStressSignal: true });
    const result = deriveSeverity(c, false);
    expect(result.level).toBe('Low');
    expect(result.signalsFired).toEqual(['recentStress']);
  });

  it('treats the 50% concentration boundary as inclusive', () => {
    const below = check({ hasNamedAlternative: true, contractType: 'written', hasRecentStressSignal: false, volumeConcentrationPct: 49 });
    const at = check({ hasNamedAlternative: true, contractType: 'written', hasRecentStressSignal: false, volumeConcentrationPct: 50 });
    expect(deriveSeverity(below, false).signalsFired).not.toContain('highConcentration');
    expect(deriveSeverity(at, false).signalsFired).toContain('highConcentration');
  });

  it('provides both English and Arabic reason text regardless of the isAr flag passed', () => {
    const c = check({ hasNamedAlternative: false, contractType: 'relationship', hasRecentStressSignal: true });
    const resultEn = deriveSeverity(c, false);
    const resultAr = deriveSeverity(c, true);
    expect(resultEn.reasonEn).toBeTruthy();
    expect(resultEn.reasonAr).toBeTruthy();
    expect(resultAr.reasonEn).toBeTruthy();
    expect(resultAr.reasonAr).toBeTruthy();
  });
});

describe('buildSupplierDependencyPrompt', () => {
  it('includes the supplier name, severity level, and answers in English', () => {
    const c = check({
      name: 'Acme Logistics',
      hasNamedAlternative: false,
      contractType: 'relationship',
      switchingCostNote: 'Lead time would double',
      volumeConcentrationPct: 80,
      hasRecentStressSignal: true,
      recentStressNote: 'Late delivery last quarter',
    });
    const severity = deriveSeverity(c, false);
    const prompt = buildSupplierDependencyPrompt(c, severity, false);

    expect(prompt).toContain('Acme Logistics');
    expect(prompt).toContain('Critical');
    expect(prompt).toContain('Lead time would double');
    expect(prompt).toContain('80%');
    expect(prompt).toContain('Late delivery last quarter');
  });

  it('renders in Arabic when isAr is true', () => {
    const c = check({ hasNamedAlternative: true, contractType: 'written', hasRecentStressSignal: false });
    const severity = deriveSeverity(c, true);
    const prompt = buildSupplierDependencyPrompt(c, severity, true);
    expect(prompt).toContain('فحص اعتمادية المورّد');
  });
});
