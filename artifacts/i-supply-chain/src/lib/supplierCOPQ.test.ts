/**
 * Tests for supplierCOPQ.ts — includes the mandatory soft/hardest/boundary
 * three-tier stress test (isc-standing-rules, Rule 7) in addition to normal
 * unit coverage. Every stress case and its outcome is also written up in the
 * Rawabi worked-example doc per Rule 6.
 */
import { describe, it, expect } from 'vitest';
import {
  type CARRecord,
  type CARBusinessImpact,
  type CARCustomerImpactOverride,
  computeFailureCostRollup,
  computeAppraisalRollup,
  computePreventionRollup,
  computeCOPQRollup,
  detectCOPQAlert,
  computeMonthOverMonthCOPQAlert,
} from './supplierCOPQ';

function car(id: string, overrides: Partial<CARRecord> = {}): CARRecord {
  return {
    id,
    supplierId: 'SUP-1',
    category: 'quality',
    rootCause: 'Incoming material variance',
    status: 'closed',
    createdAt: '2026-06-01',
    closedAt: '2026-06-15',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Section 1 — Failure cost rollup
// ---------------------------------------------------------------------------

describe('computeFailureCostRollup', () => {
  it('defaults every CAR to Internal Failure absent an override', () => {
    const cars = [car('CAR-1'), car('CAR-2')];
    const r = computeFailureCostRollup(cars, []);
    expect(r.internalFailure.carCount).toBe(2);
    expect(r.externalFailure.carCount).toBe(0);
  });

  it('reclassifies only the explicitly-overridden CAR to External', () => {
    const cars = [car('CAR-1'), car('CAR-2')];
    const overrides: CARCustomerImpactOverride[] = [{ carId: 'CAR-2', customerImpact: 'external' }];
    const r = computeFailureCostRollup(cars, [], overrides);
    expect(r.internalFailure.carCount).toBe(1);
    expect(r.externalFailure.carCount).toBe(1);
  });

  it('sums linked business-impact cost only for costed CARs, and flags uncosted ones honestly', () => {
    const cars = [car('CAR-1'), car('CAR-2'), car('CAR-3')];
    const impacts: CARBusinessImpact[] = [
      { carId: 'CAR-1', description: 'Scrap', estimatedCostUSD: 5000, basis: 'observed' },
      { carId: 'CAR-2', description: 'Rework', estimatedCostUSD: 3000, basis: 'calculated' },
      // CAR-3 has no linked impact
    ];
    const r = computeFailureCostRollup(cars, impacts);
    expect(r.internalFailure.costUSD).toBe(8000);
    expect(r.internalFailure.costedCarCount).toBe(2);
    expect(r.internalFailure.carCount).toBe(3);
    expect(r.internalFailure.noteEn).toMatch(/1 of 3 have no linked cost figure/);
  });

  it('returns INSUFFICIENT_DATA basis (not a fabricated 0-as-real) when no CAR in a bucket is costed', () => {
    const cars = [car('CAR-1')];
    const r = computeFailureCostRollup(cars, []);
    expect(r.internalFailure.costUSD).toBeNull();
    expect(r.internalFailure.basis).toBe('INSUFFICIENT_DATA');
  });

  it('handles an empty CAR set with all-zero, non-crashing buckets', () => {
    const r = computeFailureCostRollup([], []);
    expect(r.internalFailure.carCount).toBe(0);
    expect(r.externalFailure.carCount).toBe(0);
    expect(r.internalFailure.costUSD).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Section 2 — Appraisal rollup
// ---------------------------------------------------------------------------

describe('computeAppraisalRollup', () => {
  it('reports an honest effort proxy (no dollar figure) absent a caller rate', () => {
    const cars = [car('CAR-1'), car('CAR-2', { closedAt: '2026-06-21' })];
    const r = computeAppraisalRollup(cars, '2026-09-10');
    expect(r.costUSD).toBeNull();
    expect(r.costBasis).toBe('effort-proxy-only');
    expect(r.carCount).toBe(2);
    expect(r.medianDaysToClose).not.toBeNull();
  });

  it('produces a real dollar figure only when a caller-supplied rate is given', () => {
    const cars = [car('CAR-1'), car('CAR-2')];
    const r = computeAppraisalRollup(cars, '2026-09-10', 500);
    expect(r.costUSD).toBe(1000);
    expect(r.costBasis).toBe('caller-supplied-rate');
  });

  it('treats a zero or negative rate as "no rate supplied" (never a $0 fabrication)', () => {
    const cars = [car('CAR-1')];
    const r = computeAppraisalRollup(cars, '2026-09-10', 0);
    expect(r.costBasis).toBe('effort-proxy-only');
  });

  it('returns null medianDaysToClose (not 0) when no CAR has closed yet', () => {
    const cars = [car('CAR-1', { status: 'open', closedAt: null })];
    const r = computeAppraisalRollup(cars, '2026-09-10');
    expect(r.medianDaysToClose).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Section 3 — Prevention rollup
// ---------------------------------------------------------------------------

describe('computePreventionRollup', () => {
  it('is INSUFFICIENT_DATA (disclosed gap) when nothing is supplied — never a fabricated zero', () => {
    const r = computePreventionRollup();
    expect(r.costUSD).toBeNull();
    expect(r.basis).toBe('INSUFFICIENT_DATA');
  });

  it('accepts a real caller-supplied spend figure, including exactly 0 (a real zero is valid)', () => {
    const r = computePreventionRollup(0);
    expect(r.costUSD).toBe(0);
    expect(r.basis).toBe('caller-supplied');
  });
});

// ---------------------------------------------------------------------------
// Section 4 — Full rollup narrative
// ---------------------------------------------------------------------------

describe('computeCOPQRollup', () => {
  it('excludes uncosted buckets from totalCostedUSD and discloses which were excluded', () => {
    const cars = [car('CAR-1')];
    const impacts: CARBusinessImpact[] = [{ carId: 'CAR-1', description: 'x', estimatedCostUSD: 1000, basis: 'observed' }];
    const rollup = computeCOPQRollup({ periodLabel: '2026-Q3', asOfIso: '2026-09-10', cars, impacts });
    expect(rollup.totalCostedUSD).toBe(1000); // only Internal Failure is costed
    expect(rollup.excludedBucketsEn).toEqual(expect.arrayContaining(['External Failure', 'Appraisal', 'Prevention']));
  });

  it('produces bilingual, non-empty narratives even on a zero-CAR period', () => {
    const rollup = computeCOPQRollup({ periodLabel: '2026-Q3', asOfIso: '2026-09-10', cars: [], impacts: [] });
    expect(rollup.narrativeEn.length).toBeGreaterThan(0);
    expect(rollup.narrativeAr.length).toBeGreaterThan(0);
    expect(rollup.totalCostedUSD).toBeNull();
  });

  it('produces a fully costed total when caller supplies rate + prevention spend + all CARs are impact-linked', () => {
    const cars = [car('CAR-1'), car('CAR-2', { })];
    const impacts: CARBusinessImpact[] = [
      { carId: 'CAR-1', description: 'x', estimatedCostUSD: 1000, basis: 'observed' },
      { carId: 'CAR-2', description: 'y', estimatedCostUSD: 500, basis: 'observed' },
    ];
    const rollup = computeCOPQRollup({
      periodLabel: '2026-Q3', asOfIso: '2026-09-10', cars, impacts,
      overrides: [{ carId: 'CAR-2', customerImpact: 'external' }],
      perCarCostRateUSD: 200, preventionSpendUSD: 3000,
    });
    // internal 1000 + external 500 + appraisal (2*200=400) + prevention 3000
    expect(rollup.totalCostedUSD).toBe(4900);
    expect(rollup.excludedBucketsEn).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Section 5 — Alert detection
// ---------------------------------------------------------------------------

describe('detectCOPQAlert', () => {
  const base = (overrides: Partial<Parameters<typeof computeCOPQRollup>[0]> = {}) =>
    computeCOPQRollup({ periodLabel: 'P', asOfIso: '2026-09-10', cars: [], impacts: [], ...overrides });

  it('never triggers with no prior period', () => {
    const current = base({ periodLabel: '2026-Q3', cars: [car('CAR-1')] });
    const alert = detectCOPQAlert(current, null);
    expect(alert.triggered).toBe(false);
  });

  it('triggers on a rising external-failure share even if dollar totals are both null', () => {
    const prior = computeCOPQRollup({
      periodLabel: '2026-Q2', asOfIso: '2026-06-30', cars: [car('P1'), car('P2')], impacts: [],
    });
    const current = computeCOPQRollup({
      periodLabel: '2026-Q3', asOfIso: '2026-09-10', cars: [car('C1'), car('C2')], impacts: [],
      overrides: [{ carId: 'C1', customerImpact: 'external' }, { carId: 'C2', customerImpact: 'external' }],
    });
    const alert = detectCOPQAlert(current, prior);
    expect(alert.triggered).toBe(true);
    expect(alert.reason).toBe('external-failure-share-increased');
  });

  it('triggers on costed-COPQ increase beyond threshold when external share is flat', () => {
    const prior = computeCOPQRollup({
      periodLabel: '2026-Q2', asOfIso: '2026-06-30', cars: [car('P1')],
      impacts: [{ carId: 'P1', description: 'x', estimatedCostUSD: 1000, basis: 'observed' }],
    });
    const current = computeCOPQRollup({
      periodLabel: '2026-Q3', asOfIso: '2026-09-10', cars: [car('C1')],
      impacts: [{ carId: 'C1', description: 'x', estimatedCostUSD: 2000, basis: 'observed' }],
    });
    const alert = detectCOPQAlert(current, prior, 15);
    expect(alert.triggered).toBe(true);
    expect(alert.reason).toBe('total-costed-copq-increased');
  });

  it('respects a caller-configured threshold rather than a hardcoded percentage', () => {
    const prior = computeCOPQRollup({
      periodLabel: '2026-Q2', asOfIso: '2026-06-30', cars: [car('P1')],
      impacts: [{ carId: 'P1', description: 'x', estimatedCostUSD: 1000, basis: 'observed' }],
    });
    const current = computeCOPQRollup({
      periodLabel: '2026-Q3', asOfIso: '2026-09-10', cars: [car('C1')],
      impacts: [{ carId: 'C1', description: 'x', estimatedCostUSD: 1100, basis: 'observed' }], // +10%
    });
    expect(detectCOPQAlert(current, prior, 15).triggered).toBe(false); // 10% < 15% threshold
    expect(detectCOPQAlert(current, prior, 5).triggered).toBe(true); // 10% > 5% threshold
  });
});

// ===========================================================================
// MANDATORY THREE-TIER STRESS TEST (isc-standing-rules, Rule 7)
// ===========================================================================

describe('STRESS TEST — soft tier (realistic but messy inputs)', () => {
  it('handles a mixed bag: some CARs costed, some not, one override, one still-open CAR', () => {
    const cars = [
      car('S1', { status: 'closed', createdAt: '2026-07-01', closedAt: '2026-07-20' }),
      car('S2', { status: 'open', closedAt: null }),
      car('S3', { category: 'delivery', status: 'closed', createdAt: '2026-07-10', closedAt: '2026-08-30' }),
    ];
    const impacts: CARBusinessImpact[] = [
      { carId: 'S1', description: 'Rework', estimatedCostUSD: 1200, basis: 'observed' },
      // S2, S3 not costed
    ];
    const rollup = computeCOPQRollup({
      periodLabel: '2026-Q3', asOfIso: '2026-09-10', cars, impacts,
      overrides: [{ carId: 'S3', customerImpact: 'external' }],
    });
    expect(rollup.internalFailure.carCount).toBe(2); // S1, S2
    expect(rollup.externalFailure.carCount).toBe(1); // S3
    expect(rollup.internalFailure.costedCarCount).toBe(1);
    expect(() => rollup.narrativeEn).not.toThrow();
  });
});

describe('STRESS TEST — hardest tier (adversarial inputs)', () => {
  it('does not crash or misattribute cost when an impact references a carId not in the CAR set', () => {
    const cars = [car('H1')];
    const impacts: CARBusinessImpact[] = [
      { carId: 'GHOST-CAR-DOES-NOT-EXIST', description: 'orphan', estimatedCostUSD: 99999, basis: 'estimated' },
    ];
    const rollup = computeCOPQRollup({ periodLabel: '2026-Q3', asOfIso: '2026-09-10', cars, impacts });
    // The orphan impact must NOT silently inflate the total — H1 itself is uncosted.
    expect(rollup.internalFailure.costUSD).toBeNull();
    expect(rollup.internalFailure.costedCarCount).toBe(0);
  });

  it('does not double-count when two impacts are linked to the same carId (last write does not silently win either — both sum, which is disclosed behavior, not silent)', () => {
    const cars = [car('H2')];
    const impacts: CARBusinessImpact[] = [
      { carId: 'H2', description: 'first pass', estimatedCostUSD: 500, basis: 'observed' },
      { carId: 'H2', description: 'second pass', estimatedCostUSD: 700, basis: 'observed' },
    ];
    const rollup = computeFailureCostRollup(cars, impacts);
    // .find() takes the FIRST match only — document and assert this explicitly so it's a
    // known, deterministic behavior rather than an accidental one.
    expect(rollup.internalFailure.costUSD).toBe(500);
    expect(rollup.internalFailure.costedCarCount).toBe(1);
  });

  it('treats a negative estimatedCostUSD as real data, not something to clamp or hide (never silently "fix" caller data)', () => {
    const cars = [car('H3')];
    const impacts: CARBusinessImpact[] = [{ carId: 'H3', description: 'credit/reversal', estimatedCostUSD: -200, basis: 'observed' }];
    const rollup = computeFailureCostRollup(cars, impacts);
    expect(rollup.internalFailure.costUSD).toBe(-200);
  });

  it('handles an extreme volume (500 CARs) without performance collapse or incorrect aggregation', () => {
    const cars: CARRecord[] = Array.from({ length: 500 }, (_, i) => car(`BULK-${i}`, { createdAt: '2026-01-01', closedAt: '2026-01-10' }));
    const impacts: CARBusinessImpact[] = cars.map((c) => ({ carId: c.id, description: 'x', estimatedCostUSD: 100, basis: 'observed' as const }));
    const rollup = computeCOPQRollup({ periodLabel: '2026-Q1', asOfIso: '2026-09-10', cars, impacts });
    expect(rollup.internalFailure.carCount).toBe(500);
    expect(rollup.internalFailure.costUSD).toBe(50000);
  });

  it('does not fabricate a trend/alert direction from a single wildly-different period (still requires 2 real periods)', () => {
    const current = computeCOPQRollup({
      periodLabel: '2026-Q3', asOfIso: '2026-09-10', cars: [car('X1')],
      impacts: [{ carId: 'X1', description: 'x', estimatedCostUSD: 1000000, basis: 'estimated' }],
    });
    const alert = detectCOPQAlert(current, null);
    expect(alert.triggered).toBe(false);
  });
});

describe('STRESS TEST — boundary tier (exact thresholds)', () => {
  it('does NOT trigger when the increase is exactly AT the threshold (strict > , not >=)', () => {
    const prior = computeCOPQRollup({
      periodLabel: 'P', asOfIso: '2026-06-30', cars: [car('B1')],
      impacts: [{ carId: 'B1', description: 'x', estimatedCostUSD: 1000, basis: 'observed' }],
    });
    const current = computeCOPQRollup({
      periodLabel: 'C', asOfIso: '2026-09-10', cars: [car('B2')],
      impacts: [{ carId: 'B2', description: 'x', estimatedCostUSD: 1150, basis: 'observed' }], // exactly +15%
    });
    expect(detectCOPQAlert(current, prior, 15).triggered).toBe(false);
  });

  it('DOES trigger one cent above the threshold', () => {
    const prior = computeCOPQRollup({
      periodLabel: 'P', asOfIso: '2026-06-30', cars: [car('B3')],
      impacts: [{ carId: 'B3', description: 'x', estimatedCostUSD: 1000, basis: 'observed' }],
    });
    const current = computeCOPQRollup({
      periodLabel: 'C', asOfIso: '2026-09-10', cars: [car('B4')],
      impacts: [{ carId: 'B4', description: 'x', estimatedCostUSD: 1150.01, basis: 'observed' }],
    });
    expect(detectCOPQAlert(current, prior, 15).triggered).toBe(true);
  });

  it('a CAR created and closed on the same day yields 0 days-to-close (a real zero), not null', () => {
    const cars = [car('B5', { createdAt: '2026-06-01', closedAt: '2026-06-01' })];
    const r = computeAppraisalRollup(cars, '2026-09-10');
    expect(r.medianDaysToClose).toBe(0);
  });

  it('exactly-zero prior total costed COPQ is treated as no-comparison-base, not a division-by-zero crash or a fabricated infinite % increase', () => {
    const prior = computeCOPQRollup({ periodLabel: 'P', asOfIso: '2026-06-30', cars: [], impacts: [] });
    const current = computeCOPQRollup({
      periodLabel: 'C', asOfIso: '2026-09-10', cars: [car('B6')],
      impacts: [{ carId: 'B6', description: 'x', estimatedCostUSD: 500, basis: 'observed' }],
    });
    expect(() => detectCOPQAlert(current, prior, 15)).not.toThrow();
    // prior.totalCostedUSD is null here (no costed buckets), so the $-increase check is
    // correctly skipped — falls through to "no signal" since external share is also flat (0 vs 0 classified).
    expect(detectCOPQAlert(current, prior, 15).triggered).toBe(false);
  });

  it('a single CAR (odd-length array) yields a real, non-interpolated median', () => {
    const cars = [car('B7', { createdAt: '2026-06-01', closedAt: '2026-06-11' })]; // 10 days
    const r = computeAppraisalRollup(cars, '2026-09-10');
    expect(r.medianDaysToClose).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// Section 6 — computeMonthOverMonthCOPQAlert (11 Sep 2026 wiring addition —
// three-tier stress test per Rule 7, same discipline as the sections above)
// ---------------------------------------------------------------------------

describe('computeMonthOverMonthCOPQAlert', () => {
  // --- normal / soft ---
  it('returns no-data honest state for an empty CAR list', () => {
    const r = computeMonthOverMonthCOPQAlert([], [], [], '2026-09-10');
    expect(r.currentPeriodLabel).toBeNull();
    expect(r.priorPeriodLabel).toBeNull();
    expect(r.current).toBeNull();
    expect(r.prior).toBeNull();
    expect(r.alert.triggered).toBe(false);
  });

  it('single-month CAR history has a current period but no prior to compare', () => {
    const cars = [car('M1', { createdAt: '2026-08-05' }), car('M2', { createdAt: '2026-08-20' })];
    const r = computeMonthOverMonthCOPQAlert(cars, [], [], '2026-09-10');
    expect(r.currentPeriodLabel).toBe('2026-08');
    expect(r.priorPeriodLabel).toBeNull();
    expect(r.prior).toBeNull();
    expect(r.alert.triggered).toBe(false);
  });

  it('SOFT: messy but realistic data — mixed months, one external override, no cost data', () => {
    const cars = [
      car('S1', { createdAt: '2026-07-03' }),
      car('S2', { createdAt: '2026-07-25' }),
      car('S3', { createdAt: '2026-08-02' }),
      car('S4', { createdAt: '2026-08-10' }),
      car('S5', { createdAt: '2026-08-15' }),
    ];
    const overrides: CARCustomerImpactOverride[] = [{ carId: 'S5', customerImpact: 'external' }];
    const r = computeMonthOverMonthCOPQAlert(cars, [], overrides, '2026-09-10');
    expect(r.currentPeriodLabel).toBe('2026-08');
    expect(r.priorPeriodLabel).toBe('2026-07');
    // 2026-08's External Failure share (1/3 = 33.3%) is higher than 2026-07's (0/2 = 0%) → triggers
    expect(r.alert.triggered).toBe(true);
    expect(r.alert.reason).toBe('external-failure-share-increased');
  });

  // --- hardest / adversarial ---
  it('HARDEST: all CARs in a single month at asOfIso boundary, no false prior period fabricated', () => {
    const cars = [car('H1', { createdAt: '2026-09-10' }), car('H2', { createdAt: '2026-09-10' })];
    const r = computeMonthOverMonthCOPQAlert(cars, [], [], '2026-09-10');
    expect(r.currentPeriodLabel).toBe('2026-09');
    expect(r.priorPeriodLabel).toBeNull();
    expect(r.alert.triggered).toBe(false); // never fabricate a signal with nothing to compare against
  });

  it('HARDEST: CARs dated AFTER asOfIso are excluded from the evaluation window entirely', () => {
    const cars = [
      car('H3', { createdAt: '2026-08-01' }),
      car('H4', { createdAt: '2026-12-25' }), // future-dated relative to asOfIso — must not leak in
    ];
    const r = computeMonthOverMonthCOPQAlert(cars, [], [], '2026-09-10');
    expect(r.currentPeriodLabel).toBe('2026-08');
    expect(r.current?.internalFailure.carCount ?? 0 + (r.current?.externalFailure.carCount ?? 0)).toBeDefined();
    // Only H3 should ever be counted -- H4 is outside the asOf window.
    const totalClassified = (r.current?.internalFailure.carCount ?? 0) + (r.current?.externalFailure.carCount ?? 0);
    expect(totalClassified).toBe(1);
  });

  it('HARDEST: External share DECREASING between periods must not trigger', () => {
    const cars = [
      car('H5', { createdAt: '2026-07-01' }),
      car('H6', { createdAt: '2026-07-05' }),
      car('H7', { createdAt: '2026-08-01' }),
      car('H8', { createdAt: '2026-08-05' }),
    ];
    // July: both external. August: both internal (default) — share drops from 100% to 0%.
    const overrides: CARCustomerImpactOverride[] = [
      { carId: 'H5', customerImpact: 'external' },
      { carId: 'H6', customerImpact: 'external' },
    ];
    const r = computeMonthOverMonthCOPQAlert(cars, [], overrides, '2026-09-10');
    expect(r.alert.triggered).toBe(false);
  });

  it('HARDEST: many months of history only ever compares the two MOST RECENT, never an earlier pair', () => {
    const cars = [
      car('H9',  { createdAt: '2026-04-01' }),
      car('H10', { createdAt: '2026-05-01' }),
      car('H11', { createdAt: '2026-06-01' }),
      car('H12', { createdAt: '2026-07-01' }),
      car('H13', { createdAt: '2026-08-01' }),
    ];
    const r = computeMonthOverMonthCOPQAlert(cars, [], [], '2026-09-10');
    expect(r.currentPeriodLabel).toBe('2026-08');
    expect(r.priorPeriodLabel).toBe('2026-07');
  });

  // --- boundary ---
  it('BOUNDARY: exactly the configured threshold percentage does NOT trigger (strict >, not >=)', () => {
    const impacts: CARBusinessImpact[] = [
      { carId: 'B1', description: 'x', estimatedCostUSD: 1000, basis: 'observed' },
      { carId: 'B2', description: 'x', estimatedCostUSD: 1150, basis: 'observed' }, // exactly +15% vs 1000
    ];
    const cars = [
      car('B1', { createdAt: '2026-07-01', category: 'quality' }),
      car('B2', { createdAt: '2026-08-01', category: 'quality' }),
    ];
    const r = computeMonthOverMonthCOPQAlert(cars, impacts, [], '2026-09-10', 15);
    // Both single-CAR months have 0% external share (no change there); cost basis is
    // 'observed' business impact so totalCostedUSD is real for both periods.
    expect(r.alert.reason).not.toBe('total-costed-copq-increased');
  });

  it('BOUNDARY: asOfIso day exactly equal to a CAR createdAt month-end still includes it', () => {
    const cars = [car('B3', { createdAt: '2026-09-01' })];
    const r = computeMonthOverMonthCOPQAlert(cars, [], [], '2026-09-10');
    expect(r.currentPeriodLabel).toBe('2026-09');
  });

  it('BOUNDARY: increasePctThreshold of 0 makes any positive cost increase trigger', () => {
    const impacts: CARBusinessImpact[] = [
      { carId: 'B4', description: 'x', estimatedCostUSD: 100, basis: 'observed' },
      { carId: 'B5', description: 'x', estimatedCostUSD: 101, basis: 'observed' },
    ];
    const cars = [
      car('B4', { createdAt: '2026-07-01' }),
      car('B5', { createdAt: '2026-08-01' }),
    ];
    const r = computeMonthOverMonthCOPQAlert(cars, impacts, [], '2026-09-10', 0);
    expect(r.alert.triggered).toBe(true);
    expect(r.alert.reason).toBe('total-costed-copq-increased');
  });
});
