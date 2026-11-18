import { describe, it, expect } from 'vitest';
import { REGIONAL_INDICATORS } from './regionalIndicators';

describe('regional indicators register (#892)', () => {
  it('has 19 rows with unique ids', () => {
    expect(REGIONAL_INDICATORS).toHaveLength(19);
    expect(new Set(REGIONAL_INDICATORS.map((r) => r.id)).size).toBe(19);
  });
  it('labels every row as an ISC definition with Arabic pending', () => {
    for (const r of REGIONAL_INDICATORS) {
      expect(r.evidenceLabel).toBe('ISC definition');
      expect(r.arabicPending).toBe(true);
    }
  });
  it('gives every row an indicator, a formula, a unit and a frequency', () => {
    for (const r of REGIONAL_INDICATORS) {
      expect(r.indicator.length).toBeGreaterThan(3);
      expect(r.formula).toMatch(/[\/\-]/);
      expect(r.unit.length).toBeGreaterThan(0);
      expect(r.frequency.length).toBeGreaterThan(0);
    }
  });
  it('keeps unconfirmed parameters honest', () => {
    const unconfirmed = REGIONAL_INDICATORS.filter((r) => r.parameterStatus === 'unconfirmed').map((r) => r.id);
    expect(unconfirmed.sort()).toEqual(['D4', 'H1']);
    for (const r of REGIONAL_INDICATORS.filter((x) => x.parameterStatus !== 'none')) {
      expect(r.parameterNote).toMatch(/Status:/);
    }
  });
  it('covers all six groups', () => {
    expect(new Set(REGIONAL_INDICATORS.map((r) => r.group)).size).toBe(6);
  });
});
