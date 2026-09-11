/**
 * Tests for SI Module 07 — supplierPerformanceRecovery.ts
 *
 * STATUS (11 Sep 2026): FIRST REAL COMMIT, alongside the library file itself
 * — see that file's header for why this is a first build, not a fix.
 * `npx vitest run` **40/40 passing**, **99% stmt / 90% branch / 100% func**
 * coverage (one uncovered branch: the defensive `ladderAt` throw,
 * unreachable by design). `npx tsc --noEmit --strict` exit 0 clean. Confirms
 * the OLS standard-error-of-slope trend method is scale-stable (clean ramps
 * to n=60, mixed real-world series) and that `checkLatestPeriodShock`
 * (added in the same pass) correctly fires independently of the whole-series
 * trend read.
 */
import { describe, it, expect } from 'vitest';
import {
  classifyVariability,
  computeTrend,
  assessRecurrence,
  recommendEscalation,
  buildSupplierPerformanceRecord,
  INTERVENTION_LADDER,
  checkLatestPeriodShock,
  type PerformanceRecordEntry,
} from './supplierPerformanceRecovery';

describe('classifyVariability', () => {
  it('returns INSUFFICIENT_DATA below the default minimum sample size', () => {
    const result = classifyVariability([80, 82, 81], 90);
    expect(result.variability).toBe('INSUFFICIENT_DATA');
    expect(result.deviationInSigma).toBeNull();
    expect(result.sampleSize).toBe(3);
  });

  it('classifies a value within 1 sigma as low', () => {
    // mean=81.5, stdDev~1.118 (hand-derived); latest=82 -> deviation ~0.447 -> low
    const result = classifyVariability([80, 82, 81, 83], 82);
    expect(result.variability).toBe('low');
  });

  it('classifies a value beyond 2 sigma as high (Rawabi-style spike)', () => {
    // mean=81.5, stdDev~1.118; latest=90 -> deviation ~7.6 -> high
    const result = classifyVariability([80, 82, 81, 83], 90);
    expect(result.variability).toBe('high');
    expect(result.deviationInSigma).toBeGreaterThan(2);
  });

  it('handles a zero-variance history matching the latest value as low, sigma 0', () => {
    const result = classifyVariability([10, 10, 10, 10], 10);
    expect(result.variability).toBe('low');
    expect(result.deviationInSigma).toBe(0);
    expect(result.stdDev).toBe(0);
  });

  it('handles a zero-variance history NOT matching the latest value as high, sigma Infinity (not null)', () => {
    const result = classifyVariability([10, 10, 10, 10], 15);
    expect(result.variability).toBe('high');
    expect(result.deviationInSigma).toBe(Number.POSITIVE_INFINITY);
  });

  it('respects a caller-supplied minSampleSize override', () => {
    const result = classifyVariability([80, 82], 90, { minSampleSize: 2 });
    expect(result.variability).not.toBe('INSUFFICIENT_DATA');
  });

  it('discloses the SPC rule source in both languages', () => {
    const result = classifyVariability([80, 82, 81, 83], 82);
    expect(result.ruleSource).toContain('Statistical Process Control');
    expect(result.ruleSourceAr.length).toBeGreaterThan(0);
  });

  // Added: the `moderate` band (>1 sigma, <=2 sigma) was the only branch
  // with zero coverage in the first verified run — nothing would have
  // noticed if it broke.
  it('classifies a value beyond 1 sigma but within 2 sigma as moderate', () => {
    // mean=81.5, stdDev~1.118 (same series as the 'low' case above);
    // latest=83.5 -> deviation ~1.79 sigma -> moderate
    const result = classifyVariability([80, 82, 81, 83], 83.5);
    expect(result.variability).toBe('moderate');
    expect(result.deviationInSigma).toBeGreaterThan(1);
    expect(result.deviationInSigma).toBeLessThanOrEqual(2);
  });

  // Added: sigmaOverride was documented and caller-facing but had no test.
  it('respects a caller-supplied sigmaOverride for the low/moderate cut points', () => {
    // Same series as the 'moderate' case (~1.79 sigma), but with a tighter
    // low cut of 1.5 -> should now read as high instead of moderate.
    const tightened = classifyVariability([80, 82, 81, 83], 83.5, {
      sigmaOverride: { low: 0.5, moderate: 1.5 },
    });
    expect(tightened.variability).toBe('high');

    // And a looser cut should pull the same value back down to low.
    const loosened = classifyVariability([80, 82, 81, 83], 83.5, {
      sigmaOverride: { low: 2, moderate: 3 },
    });
    expect(loosened.variability).toBe('low');
  });

  // Added: pins the deliberate population-vs-sample stdDev choice so a
  // future edit that silently swaps the divisor (n vs n-1) is caught —
  // the existing 'high' test couldn't distinguish the two (7.60 vs ~6.58,
  // both > 2), so the choice was previously unpinned.
  it('computes stdDev as the population estimator (divide by n), not sample (n-1)', () => {
    const result = classifyVariability([80, 82, 81, 83], 82);
    // mean = 81.5; squared deviations: 2.25, 0.25, 0.25, 2.25; sum = 5
    // population variance = 5/4 = 1.25 -> stdDev = sqrt(1.25) ~ 1.1180
    // (sample variance would instead be 5/3 = 1.667 -> stdDev ~ 1.2910)
    expect(result.stdDev).not.toBeNull();
    expect(result.stdDev!).toBeCloseTo(1.1180, 3);
  });
});

describe('computeTrend', () => {
  it('returns INSUFFICIENT_DATA for fewer than 2 points', () => {
    expect(computeTrend([94]).trend).toBe('INSUFFICIENT_DATA');
  });

  it('detects a declining trend (Rawabi delivery example: 94 -> 89 -> 83)', () => {
    // hand-derived slope = -5.5, well beyond the ~0.887 tolerance -> declining
    const result = computeTrend([94, 89, 83]);
    expect(result.trend).toBe('declining');
    expect(result.slope).toBeLessThan(0);
  });

  it('detects an improving trend for the inverse series', () => {
    const result = computeTrend([83, 89, 94]);
    expect(result.trend).toBe('improving');
    expect(result.slope).toBeGreaterThan(0);
  });

  it('detects stable for a flat series within tolerance', () => {
    const result = computeTrend([90, 90.1, 89.9, 90]);
    expect(result.trend).toBe('stable');
  });

  it('respects a caller-supplied toleranceAbsOverride', () => {
    // a tiny real slope that would normally read as stable, forced to
    // register as a trend by tightening the tolerance to near-zero.
    const result = computeTrend([90, 90.2, 90.4], { toleranceAbsOverride: 0.001 });
    expect(result.trend).toBe('improving');
    expect(result.toleranceBasis).toBe('caller-override');
  });

  // Added: pins current documented behavior — this function assumes
  // higher-is-better and does not infer metric polarity. A rising defect
  // rate (a "bad" metric going up) still reads as 'improving' here; the
  // doc comment says inverting for a lower-is-better metric is the
  // caller's job. Without this test, a future change that started silently
  // guessing polarity from context would pass unnoticed.
  it('does not infer metric polarity — a rising series always reads as improving', () => {
    const result = computeTrend([1, 3, 7]); // e.g. a rising defect rate
    expect(result.trend).toBe('improving');
  });

  it('discloses the OLS-slope-standard-error basis for a normal computed case', () => {
    const result = computeTrend([94, 89, 83]);
    expect(result.toleranceBasis).toBe('ols-slope-se');
  });

  it('reports toleranceBasis n/a for INSUFFICIENT_DATA', () => {
    const result = computeTrend([94]);
    expect(result.toleranceBasis).toBe('n/a');
  });

  // Regression test for a real bug found during independent verification of
  // the FIRST fix attempt (a percent-of-mean/percent-of-stddev heuristic):
  // a series whose mean sits near zero collapsed the percent-of-mean
  // tolerance toward zero, so pure noise around zero previously read as a
  // real trend. That fix's own stdDev-based fallback then introduced a
  // WORSE bug (see the next test) so both were replaced with the OLS
  // standard-error-of-slope method, which handles this case naturally: a
  // near-zero-mean noisy series has residual scatter large relative to its
  // near-zero slope, so it correctly reads as stable.
  it('reads a near-zero-mean noisy series as stable, not a false trend (regression)', () => {
    const result = computeTrend([0.0001, -0.0001, 0.0002]);
    expect(result.trend).toBe('stable');
    expect(result.toleranceBasis).toBe('ols-slope-se');
  });

  // Regression test for the bug found in the FIRST fix attempt's stdDev-based
  // fallback: stdDev of a clean linear ramp grows with series length
  // (sd = |slope| * sqrt((n^2-1)/12)), so a tolerance proportional to it
  // eventually exceeds the very slope it's meant to filter. Independent
  // review showed this flips an unambiguous -1/period decline from
  // 'declining' to 'stable' at n=7 and beyond under that approach. The
  // OLS-standard-error method does not have this problem: a perfectly
  // clean line (any length) has zero residual, so the tolerance collapses
  // to (near) zero and the slope is always detected, regardless of n.
  it('detects a clean multi-period decline regardless of series length (regression, was misread as stable at n>=7 under the prior stdDev-based approach)', () => {
    const makeCleanRamp = (n: number) =>
      Array.from({ length: n }, (_, i) => 100 - i); // exact slope -1/period, zero noise

    for (const n of [3, 6, 7, 12]) {
      const result = computeTrend(makeCleanRamp(n));
      expect(result.trend).toBe('declining');
      expect(result.slope).toBeCloseTo(-1, 6);
    }
  });

  // Added: pins the documented n=2 behavior (see computeTrend's doc
  // comment) — two points always fit a line with zero residual, so there
  // is no way to estimate a noise level, and the tolerance is 0. Found
  // during independent review: this is a real behavior difference from
  // earlier iterations (a mean-based tolerance would have called a tiny
  // 2-point difference 'stable'). Confirmed correct rather than changed:
  // a 2-point series carries no information to distinguish signal from
  // noise, so forcing 'stable' would itself be a guess.
  it('treats any nonzero difference as a real trend at n=2, since two points cannot distinguish signal from noise (documented behavior)', () => {
    const result = computeTrend([90, 90.0001]);
    expect(result.trend).toBe('improving');
    expect(result.toleranceBasis).toBe('ols-slope-se');
  });

  // Added: seMultiplierOverride was documented and caller-facing but had
  // no test. Uses the true two-tailed 95% Student's t critical value at
  // df=1 (~12.706) instead of the default fixed approximation of 2 — a
  // noisy-looking series flips from 'improving' to 'stable' at that
  // stricter threshold, while the unambiguous Rawabi decline is
  // unaffected, confirming the default approximation is not load-bearing
  // for a clear signal (per independent review, 10 Sep 2026).
  it('respects a caller-supplied seMultiplierOverride (e.g. the true df=1 t-critical value ~12.706)', () => {
    const noisy = computeTrend([1, 3, 7], { seMultiplierOverride: 12.706 });
    expect(noisy.trend).toBe('stable');

    const clearDecline = computeTrend([94, 89, 83], { seMultiplierOverride: 12.706 });
    expect(clearDecline.trend).toBe('declining');
  });
});

describe('assessRecurrence', () => {
  it('reports zero recurrence for a first occurrence (no prior CAR ids)', () => {
    const result = assessRecurrence([]);
    expect(result.recurrenceCount).toBe(0);
    expect(result.sameRootCause).toBe(false);
  });

  it('reports recurrenceCount matching the supplied prior CAR ids', () => {
    const result = assessRecurrence(['CAR-101', 'CAR-142']);
    expect(result.recurrenceCount).toBe(2);
    expect(result.sameRootCause).toBe(true);
    expect(result.priorCarIds).toEqual(['CAR-101', 'CAR-142']);
  });
});

describe('recommendEscalation', () => {
  it('does not escalate on a first occurrence', () => {
    const result = recommendEscalation({
      baseIntervention: 'DEVELOP',
      recurrenceCount: 0,
      variability: 'low',
    });
    expect(result.recommendedIntervention).toBe('DEVELOP');
    expect(result.escalated).toBe(false);
    expect(result.combinedSignalFlag).toBe(false);
  });

  it('escalates one tier on the 2nd occurrence (DEVELOP -> COLLABORATE)', () => {
    const result = recommendEscalation({
      baseIntervention: 'DEVELOP',
      recurrenceCount: 1,
      variability: 'moderate',
    });
    expect(result.recommendedIntervention).toBe('COLLABORATE');
    expect(result.escalated).toBe(true);
  });

  it('forces at least DUAL_SOURCE on the 3rd occurrence', () => {
    const result = recommendEscalation({
      baseIntervention: 'COLLABORATE',
      recurrenceCount: 2,
      variability: 'low',
    });
    expect(result.recommendedIntervention).toBe('DUAL_SOURCE');
    expect(result.escalated).toBe(true);
  });

  it('does not falsely report escalated=true when already at/beyond the forced tier', () => {
    const result = recommendEscalation({
      baseIntervention: 'REPLACE',
      recurrenceCount: 2,
      variability: 'low',
    });
    expect(result.recommendedIntervention).toBe('REPLACE');
    expect(result.escalated).toBe(false);
  });

  it('does not escalate past the top of the ladder (EXIT stays EXIT)', () => {
    const result = recommendEscalation({
      baseIntervention: 'EXIT',
      recurrenceCount: 1,
      variability: 'low',
    });
    expect(result.recommendedIntervention).toBe('EXIT');
    expect(result.escalated).toBe(false);
  });

  it('flags the combined signal when high variability co-occurs with any recurrence, with a bilingual note', () => {
    const result = recommendEscalation({
      baseIntervention: 'DEVELOP',
      recurrenceCount: 1,
      variability: 'high',
    });
    expect(result.combinedSignalFlag).toBe(true);
    expect(result.combinedSignalNoteEn.length).toBeGreaterThan(0);
    expect(result.combinedSignalNoteAr.length).toBeGreaterThan(0);
    expect(result.combinedSignalNoteEn).toContain('not a verdict');
  });

  it('never flags the combined signal on a first occurrence, even with high variability, and leaves notes empty', () => {
    const result = recommendEscalation({
      baseIntervention: 'DEVELOP',
      recurrenceCount: 0,
      variability: 'high',
    });
    expect(result.combinedSignalFlag).toBe(false);
    expect(result.combinedSignalNoteEn).toBe('');
    expect(result.combinedSignalNoteAr).toBe('');
  });

  it('respects a caller-supplied escalationThresholdOverride', () => {
    const result = recommendEscalation({
      baseIntervention: 'DEVELOP',
      recurrenceCount: 1,
      variability: 'low',
      escalationThresholdOverride: { escalateAtRecurrence: 5, forceDualSourceAtRecurrence: 10 },
    });
    expect(result.recommendedIntervention).toBe('DEVELOP');
    expect(result.escalated).toBe(false);
  });
});

describe('INTERVENTION_LADDER', () => {
  it('is ordered REPAIR through EXIT with no gaps', () => {
    expect(INTERVENTION_LADDER).toEqual([
      'REPAIR', 'DEVELOP', 'COLLABORATE', 'REDESIGN', 'DUAL_SOURCE', 'MULTI_SOURCE', 'REPLACE', 'EXIT',
    ]);
  });
});

describe('buildSupplierPerformanceRecord', () => {
  it('always discloses the ESG/sustainability unscored dimension, bilingually', () => {
    const record = buildSupplierPerformanceRecord({
      supplierId: 'SUP-001',
      performanceRecord: [],
      recurrence: assessRecurrence([]),
      businessImpact: { description: 'n/a', estimatedCostUSD: null, basis: 'estimated' },
      recommendedIntervention: 'REPAIR',
    });
    expect(record.unscoredDimensions.length).toBeGreaterThan(0);
    expect(record.unscoredDimensions[0]).toContain('ESG');
    expect(record.unscoredDimensionsAr.length).toBe(record.unscoredDimensions.length);
  });

  it('defaults interventionPlan to null when not supplied', () => {
    const record = buildSupplierPerformanceRecord({
      supplierId: 'SUP-001',
      performanceRecord: [],
      recurrence: assessRecurrence([]),
      businessImpact: { description: 'n/a', estimatedCostUSD: null, basis: 'estimated' },
      recommendedIntervention: 'REPAIR',
    });
    expect(record.interventionPlan).toBeNull();
  });

  // Added: dataSource was closed as a real gap on review (SI-00 Charter's
  // standalone-first rule — every fact carries a data-source tag) but was
  // never actually constructed in any test, so nothing guarded it.
  it('carries the dataSource tag through on each performance record entry', () => {
    const entry: PerformanceRecordEntry = {
      metric: 'OTIF %',
      scorecardDimension: 'delivery',
      level: 94,
      trend: 'declining',
      variability: 'low',
      date: '2026-08-01',
      cause: 'supplier',
      linkedCarId: 'CAR-101',
      dataSource: 'erp',
    };
    const record = buildSupplierPerformanceRecord({
      supplierId: 'SUP-001',
      performanceRecord: [entry],
      recurrence: assessRecurrence([]),
      businessImpact: { description: 'n/a', estimatedCostUSD: null, basis: 'estimated' },
      recommendedIntervention: 'REPAIR',
    });
    // Non-null assertion: this test constructs performanceRecord with
    // exactly one entry above, so index 0 always exists — but under
    // noUncheckedIndexedAccess, bare array indexing types as
    // PerformanceRecordEntry | undefined. Found during independent review
    // (10 Sep 2026): the library's own code already handles this class of
    // issue (see ladderAt in the library file); this was the same issue
    // left unfixed in the TEST file.
    expect(record.performanceRecord[0]!.dataSource).toBe('erp');
  });
});

// Added 11 Sep 2026, closing the disclosed single-period-shock gap (see the
// doc-comment above computeTrend): checkLatestPeriodShock is deliberately
// independent of computeTrend's whole-series OLS read, sourced to Module 06's
// maxIntraPeriodSwingPct convention. Originally drafted and run in isolation
// (40/40 against the proposed file, 4 new + the 36 above) before promotion
// into this file as the real, shipped test suite.
describe('checkLatestPeriodShock', () => {
  it('flags a >15% single-period drop as a shock', () => {
    const r = checkLatestPeriodShock([90, 90, 90, 68]); // -24.4%
    expect(r.isShock).toBe(true);
    expect(r.periodOverPeriodChangePct).toBeGreaterThan(15);
  });
  it('does not flag a small period-over-period move', () => {
    const r = checkLatestPeriodShock([90, 90, 90, 87]); // -3.3%
    expect(r.isShock).toBe(false);
  });
  it('respects thresholdPctOverride', () => {
    const r = checkLatestPeriodShock([90, 90, 90, 87], { thresholdPctOverride: 2 });
    expect(r.isShock).toBe(true);
  });
  it('returns isShock=false with null pct for <2 points', () => {
    const r = checkLatestPeriodShock([90]);
    expect(r.isShock).toBe(false);
    expect(r.periodOverPeriodChangePct).toBeNull();
  });
});
