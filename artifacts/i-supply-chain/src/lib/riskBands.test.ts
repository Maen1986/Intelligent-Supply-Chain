import { describe, it, expect } from 'vitest';
import { riskBand, RISK_BAND_MIN } from './riskBands';

describe('riskBands (#863): one 15/10/5 band set', () => {
  it('uses 15 / 10 / 5 as the lower edges', () => {
    expect(RISK_BAND_MIN).toEqual({ critical: 15, high: 10, medium: 5 });
  });
  it.each([
    [1, 'low'], [4, 'low'], [5, 'medium'], [9, 'medium'],
    [10, 'high'], [14, 'high'], [15, 'critical'], [25, 'critical'],
  ])('score %i is %s', (score, band) => {
    expect(riskBand(score as number)).toBe(band);
  });
  it('every 5x5 cell gets exactly one band and 20 and 12 are no longer edges', () => {
    expect(riskBand(12)).toBe('high');
    expect(riskBand(16)).toBe('critical');
    expect(riskBand(6)).toBe('medium');
    for (let l = 1; l <= 5; l++) for (let i = 1; i <= 5; i++) {
      expect(['critical', 'high', 'medium', 'low']).toContain(riskBand(l * i));
    }
  });
});
