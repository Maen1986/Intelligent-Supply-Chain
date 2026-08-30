import { describe, it, expect } from 'vitest';
import {
  defaultReorderPointInputs, getCapacityFactor, getEidClosureOverlapDays,
  computeReorderPoint, buildReorderPointPrompt, type ReorderPointInputs,
} from './reorderPointRamadan';

function inputs(overrides: Partial<ReorderPointInputs> = {}): ReorderPointInputs {
  return { ...defaultReorderPointInputs(), ...overrides };
}

describe('getCapacityFactor', () => {
  it('is 0.75 for Saudi (6h/8h standard day)', () => {
    expect(getCapacityFactor('saudi')).toBeCloseTo(0.75);
  });

  it('is 1.0 for Jordan (no mandated reduction)', () => {
    expect(getCapacityFactor('jordan')).toBe(1.0);
  });

  it('is 0.75 for Oman despite the lower weekly cap (daily hours still 6/8)', () => {
    expect(getCapacityFactor('oman')).toBeCloseTo(0.75);
  });
});

describe('getEidClosureOverlapDays', () => {
  it('counts real overlapping Eid al-Fitr days for Saudi 2026', () => {
    // Eid al-Fitr 2026 Saudi: 2026-03-20 to 2026-03-22 (3 days)
    // Order placed 2026-03-15 with a 10-day lead time -> window 03-15 to 03-25, fully covers Eid al-Fitr
    const days = getEidClosureOverlapDays('saudi', '2026-03-15', 10);
    expect(days).toBe(3);
  });

  it('returns 0 when the lead-time window does not touch any Eid window', () => {
    const days = getEidClosureOverlapDays('saudi', '2026-01-01', 10);
    expect(days).toBe(0);
  });

  it('returns 0 for an unsourced year (honest, no guessing)', () => {
    const days = getEidClosureOverlapDays('saudi', '2027-03-15', 10);
    expect(days).toBe(0);
  });
});

describe('computeReorderPoint', () => {
  it('returns hasEnoughInputs=false and all nulls when inputs are missing', () => {
    const r = computeReorderPoint(inputs({ avgDailyUsage: null, baseLeadTimeDays: null }));
    expect(r.hasEnoughInputs).toBe(false);
    expect(r.baselineReorderPoint).toBeNull();
    expect(r.adjustedReorderPoint).toBeNull();
  });

  it('computes the classic baseline reorder point as avgDailyUsage x baseLeadTimeDays', () => {
    const r = computeReorderPoint(inputs({ country: 'jordan', avgDailyUsage: 100, baseLeadTimeDays: 14, orderDate: '2026-01-01', seasonalDemandMultiplier: 1 }));
    expect(r.baselineReorderPoint).toBe(1400);
  });

  it('Jordan (capacity factor 1.0, no Eid overlap) yields adjusted == baseline when demand multiplier is 1', () => {
    const r = computeReorderPoint(inputs({ country: 'jordan', avgDailyUsage: 100, baseLeadTimeDays: 14, orderDate: '2026-01-01', seasonalDemandMultiplier: 1 }));
    expect(r.adjustedReorderPoint).toBeCloseTo(r.baselineReorderPoint!);
  });

  it('Saudi with a capacity-reducing Ramadan window increases the adjusted reorder point even at demand multiplier 1', () => {
    const r = computeReorderPoint(inputs({ country: 'saudi', avgDailyUsage: 100, baseLeadTimeDays: 14, orderDate: '2026-02-10', seasonalDemandMultiplier: 1 }));
    // effective lead time = 14/0.75 = 18.67 (Ramadan starts 2026-02-19, inside the window, but capacity factor
    // is applied platform-wide as a simplifying, disclosed assumption -- see file header)
    expect(r.effectiveLeadTimeDays).toBeCloseTo(14 / 0.75, 2);
    expect(r.adjustedReorderPoint!).toBeGreaterThan(r.baselineReorderPoint!);
  });

  it('adding Eid closure overlap days further increases the adjusted reorder point', () => {
    const withoutEid = computeReorderPoint(inputs({ country: 'saudi', avgDailyUsage: 100, baseLeadTimeDays: 10, orderDate: '2026-01-01', seasonalDemandMultiplier: 1 }));
    const withEid = computeReorderPoint(inputs({ country: 'saudi', avgDailyUsage: 100, baseLeadTimeDays: 10, orderDate: '2026-03-15', seasonalDemandMultiplier: 1 }));
    expect(withEid.eidClosureOverlapDays).toBeGreaterThan(withoutEid.eidClosureOverlapDays);
    expect(withEid.adjustedReorderPoint!).toBeGreaterThan(withoutEid.adjustedReorderPoint!);
  });

  it('respects a client-entered seasonal demand multiplier below 1 (demand falls)', () => {
    const r = computeReorderPoint(inputs({ country: 'jordan', avgDailyUsage: 100, baseLeadTimeDays: 14, orderDate: '2026-01-01', seasonalDemandMultiplier: 0.7 }));
    expect(r.adjustedReorderPoint).toBeCloseTo(100 * 0.7 * 14, 5);
  });

  it('deltaUnits is adjusted minus baseline', () => {
    const r = computeReorderPoint(inputs({ country: 'saudi', avgDailyUsage: 50, baseLeadTimeDays: 7, orderDate: '2026-01-01', seasonalDemandMultiplier: 1.2 }));
    expect(r.deltaUnits).toBeCloseTo(r.adjustedReorderPoint! - r.baselineReorderPoint!, 5);
  });
});

describe('buildReorderPointPrompt', () => {
  it('discloses the client-entered demand multiplier and its source rather than presenting it as a platform estimate', () => {
    const i = inputs({ country: 'saudi', avgDailyUsage: 100, baseLeadTimeDays: 14, seasonalDemandMultiplier: 1.3, demandMultiplierSource: '2025 POS data' });
    const r = computeReorderPoint(i);
    const prompt = buildReorderPointPrompt(i, r, false);
    expect(prompt).toContain('1.3');
    expect(prompt).toContain('2025 POS data');
    expect(prompt.toLowerCase()).toContain('client-supplied');
  });
});
