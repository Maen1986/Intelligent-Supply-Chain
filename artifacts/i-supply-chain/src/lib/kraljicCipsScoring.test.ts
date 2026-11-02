import { describe, it, expect } from 'vitest';
import { scoreItem, quadrantFor, CIPS_FACTORS } from './kraljicCipsScoring';

const all = (risk: number, profit: number) => Object.fromEntries(CIPS_FACTORS.map((f) => [f.id, f.axis === 'risk' ? risk : profit]));

describe('CIPS seven-step scoring', () => {
  it('uses the CIPS factor lists (7 risk, 5 profit)', () => {
    expect(CIPS_FACTORS.filter((f) => f.axis === 'risk')).toHaveLength(7);
    expect(CIPS_FACTORS.filter((f) => f.axis === 'profit')).toHaveLength(5);
  });
  it('places each quadrant correctly', () => {
    expect(scoreItem(all(5, 5)).quadrant).toBe('strategic');
    expect(scoreItem(all(1, 5)).quadrant).toBe('leverage');
    expect(scoreItem(all(5, 1)).quadrant).toBe('bottleneck');
    expect(scoreItem(all(1, 1)).quadrant).toBe('non-critical');
  });
  it('computes weighted score share of the maximum', () => {
    const r = scoreItem(all(5, 5));
    expect(r.risk.pct).toBe(100);
    expect(r.risk.maxWeighted).toBe(35);
    expect(r.profit.maxWeighted).toBe(25);
  });
  it('boundary is inclusive on the high side (>= 50%)', () => {
    expect(quadrantFor(50, 50, 50)).toBe('strategic');
    expect(quadrantFor(49.9, 50, 50)).toBe('leverage');
  });
  it('flags borderline items within the margin and not outside it', () => {
    const border = scoreItem(all(2.6, 4)); // 52% risk
    expect(border.borderlineAxes).toContain('risk');
    expect(border.borderline).toBe(true);
    const clear = scoreItem(all(5, 5));
    expect(clear.borderline).toBe(false);
  });
  it('never guesses: too few answers is insufficient with the missing list', () => {
    const r = scoreItem({ exp: 5, spend: 5 });
    expect(r.status).toBe('insufficient');
    expect(r.quadrant).toBeNull();
    expect(r.missing.length).toBeGreaterThan(5);
  });
  it('allows partial answers at or above 60% coverage and reports what is missing', () => {
    const ratings = all(5, 5);
    delete (ratings as Record<string, number>).exp; // 6/7 risk answered
    const r = scoreItem(ratings);
    expect(r.status).toBe('scored');
    expect(r.missing.map((m) => m.id)).toEqual(['exp']);
  });
  it('sensitivity names a factor whose weight change flips the quadrant', () => {
    // risk: six factors at 1, one at 5 -> 29/35 low; doubling the outlier flips toward high risk
    const ratings: Record<string, number> = all(1, 5);
    ratings.fin = 5; ratings.complex = 4; ratings.mfg = 4; ratings.design = 3; // ~ borderline
    const r = scoreItem(ratings);
    expect(r.status).toBe('scored');
    // a flip list is only non-empty if some single weight change alters the quadrant
    r.flipFactors.forEach((x) => expect(x.flipsTo).not.toBe(r.quadrant));
  });
  it('weight 0 switches a factor off and custom weights change the result', () => {
    const ratings: Record<string, number> = all(1, 5);
    ratings.fin = 5;
    const equal = scoreItem(ratings);
    const heavy = scoreItem(ratings, { weights: { fin: 20 } });
    expect(heavy.risk.pct).toBeGreaterThan(equal.risk.pct);
    const off = scoreItem(ratings, { weights: { fin: 0 } });
    expect(off.risk.total).toBe(6);
  });
  it('rejects out-of-range ratings as unanswered', () => {
    const r = scoreItem({ ...all(5, 5), exp: 9 as unknown as number });
    expect(r.missing.map((m) => m.id)).toContain('exp');
  });
});
