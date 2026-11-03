/**
 * Round C #668 (RC-4/RC-6) — exact-behaviour pins for supplierPerformanceRecovery,
 * written from Stryker survivors (statistics, boundaries, escalation text).
 */
import { describe, it, expect } from 'vitest';
import {
  classifyVariability,
  computeTrend,
  checkLatestPeriodShock,
  recommendEscalation,
} from './supplierPerformanceRecovery';

describe('classifyVariability exact sigma boundaries', () => {
  // history [8,12] -> mean 10, population sd 2. latest 12 => 1.0 sigma exactly; 14 => 2.0 exactly.
  it('exactly 1 sigma is low, exactly 2 sigma is moderate (inclusive upper edges)', () => {
    const one = classifyVariability([8, 12], 12, { minSampleSize: 2 });
    expect(one.deviationInSigma).toBe(1);
    expect(one.variability).toBe('low');
    const two = classifyVariability([8, 12], 14, { minSampleSize: 2 });
    expect(two.deviationInSigma).toBe(2);
    expect(two.variability).toBe('moderate');
    const above = classifyVariability([8, 12], 14.01, { minSampleSize: 2 });
    expect(above.variability).toBe('high');
    expect(classifyVariability([8, 12], 11.99, { minSampleSize: 2 }).variability).toBe('low');
  });
});

describe('computeTrend exact OLS arithmetic', () => {
  it('perfect line y=2x+1 has slope exactly 2 and reads improving', () => {
    const r = computeTrend([1, 3, 5, 7, 9]);
    expect(r.slope).toBeCloseTo(2, 12);
    expect(r.trend).toBe('improving');
    expect(r.toleranceBasis).toBe('ols-slope-se');
  });
  it('perfect descending line reads declining with negative slope', () => {
    const r = computeTrend([9, 7, 5, 3, 1]);
    expect(r.slope).toBeCloseTo(-2, 12);
    expect(r.trend).toBe('declining');
  });
  it('slope depends on position, not on the sign of the mean (mutant: i + xMean)', () => {
    expect(computeTrend([10, 20, 30]).slope).toBeCloseTo(10, 12);
    expect(computeTrend([100, 100, 100]).slope).toBe(0);
    expect(computeTrend([-5, -3, -1]).slope).toBeCloseTo(2, 12);
  });
  it('flat series is stable with slope exactly 0', () => {
    const r = computeTrend([5, 5, 5, 5]);
    expect(r.slope).toBe(0);
    expect(r.trend).toBe('stable');
  });
  it('two points: any non-zero slope is a real trend (zero residual error)', () => {
    expect(computeTrend([1, 2]).trend).toBe('improving');
    expect(computeTrend([2, 1]).trend).toBe('declining');
    expect(computeTrend([3, 3]).trend).toBe('stable');
  });
  it('noisy series is filtered by the slope standard error; the degrees-of-freedom term n-2 is used', () => {
    // y = [0,10,0,10,0,10]: slope ~ 0.857, residual noise large -> stable under 2xSE default
    const noisy = computeTrend([0, 10, 0, 10, 0, 10]);
    expect(noisy.trend).toBe('stable');
    // exact tolerance check via override: zero tolerance makes the same series non-stable
    expect(computeTrend([0, 10, 0, 10, 0, 10], { toleranceAbsOverride: 0 }).trend).toBe('improving');
    expect(computeTrend([0, 10, 0, 10, 0, 10], { toleranceAbsOverride: 0 }).toleranceBasis).toBe('caller-override');
  });
  it('slope exactly equal to tolerance is stable (inclusive)', () => {
    expect(computeTrend([1, 3, 5], { toleranceAbsOverride: 2 }).trend).toBe('stable');
    expect(computeTrend([1, 3, 5], { toleranceAbsOverride: 1.999 }).trend).toBe('improving');
  });
  it('seMultiplierOverride scales the tolerance', () => {
    const strict = computeTrend([0, 4, 1, 5, 2, 6], { seMultiplierOverride: 0 });
    expect(strict.trend).toBe('improving');
  });
});

describe('computeTrend exact standard-error threshold', () => {
  // y=[0,3,1,4,2,5]: slope 0.714286, OLS slope SE 0.349927 (n-2 d.o.f.), ratio 2.04124
  it('multiplier just below the ratio -> improving, just above -> stable', () => {
    const y = [0, 3, 1, 4, 2, 5];
    expect(computeTrend(y, { seMultiplierOverride: 2.04 }).trend).toBe('improving');
    expect(computeTrend(y, { seMultiplierOverride: 2.05 }).trend).toBe('stable');
    expect(computeTrend(y).trend).toBe('improving');
  });
  it('zero slope with a negative tolerance reads declining, never improving', () => {
    expect(computeTrend([5, 5, 5], { toleranceAbsOverride: -1 }).trend).toBe('declining');
  });
});

describe('checkLatestPeriodShock', () => {
  it('uses only the last two points', () => {
    const r = checkLatestPeriodShock([1000, 50, 100, 110]);
    expect(r.periodOverPeriodChangePct).toBeCloseTo(10, 10);
    expect(r.isShock).toBe(false);
    expect(checkLatestPeriodShock([1, 1, 1, 100]).isShock).toBe(true);
  });
  it('a non-finite value earlier than the last two does not poison the check', () => {
    const r = checkLatestPeriodShock([NaN, 100, 110]);
    expect(r.periodOverPeriodChangePct).toBeCloseTo(10, 10);
  });
  it('threshold is strict: exactly 15% is not a shock, just above is', () => {
    expect(checkLatestPeriodShock([100, 115]).isShock).toBe(false);
    expect(checkLatestPeriodShock([100, 115.01]).isShock).toBe(true);
    expect(checkLatestPeriodShock([100, 130], { thresholdPctOverride: 30 }).isShock).toBe(false);
  });
  it('prior zero: latest zero is 0%, latest non-zero is Infinity and a shock', () => {
    expect(checkLatestPeriodShock([0, 0]).periodOverPeriodChangePct).toBe(0);
    expect(checkLatestPeriodShock([0, 0]).isShock).toBe(false);
    const inf = checkLatestPeriodShock([0, 5]);
    expect(inf.periodOverPeriodChangePct).toBe(Infinity);
    expect(inf.isShock).toBe(true);
  });
});

describe('recommendEscalation exact reasons and flags', () => {
  it('first occurrence: no escalation, exact reason EN/AR', () => {
    const r = recommendEscalation({ baseIntervention: 'REPAIR', recurrenceCount: 0, variability: 'low' });
    expect(r.escalated).toBe(false);
    expect(r.recommendedIntervention).toBe('REPAIR');
    expect(r.escalationReasonEn).toBe('First occurrence of this root cause — no forced escalation; intervention chosen per the existing reasoning chain.');
    expect(r.escalationReasonAr).toBe('أول حالة لهذا السبب الجذري — لا يوجد تصعيد إلزامي؛ يُختار الإجراء وفق سلسلة الاستدلال الحالية.');
    expect(r.combinedSignalFlag).toBe(false);
    expect(r.combinedSignalNoteEn).toBe('');
    expect(r.combinedSignalNoteAr).toBe('');
  });
  it('2nd occurrence escalates one tier with the 2nd-occurrence text', () => {
    const r = recommendEscalation({ baseIntervention: 'DEVELOP', recurrenceCount: 1, variability: 'low' });
    expect(r.escalated).toBe(true);
    expect(r.recommendedIntervention).toBe('COLLABORATE');
    expect(r.escalationReasonEn.startsWith('Root cause has recurred (2nd occurrence) — the prior corrective action is judged not to have held;')).toBe(true);
    expect(r.escalationReasonAr.startsWith('تكرر السبب الجذري (الحالة الثانية) — يُعتبر الإجراء التصحيحي السابق غير فعّال')).toBe(true);
  });
  it('2nd occurrence at the top of the ladder: no move, top-of-ladder text names the intervention', () => {
    const r = recommendEscalation({ baseIntervention: 'EXIT', recurrenceCount: 1, variability: 'low' });
    expect(r.escalated).toBe(false);
    expect(r.recommendedIntervention).toBe('EXIT');
    expect(r.escalationReasonEn).toContain('already at the top of the ladder (EXIT)');
    expect(r.escalationReasonAr).toContain('(EXIT)');
    expect(r.escalationReasonAr).toContain('أعلى السلّم');
  });
  it('3rd+ occurrence forces at least DUAL_SOURCE with the count in the text', () => {
    const r = recommendEscalation({ baseIntervention: 'REPAIR', recurrenceCount: 3, variability: 'low' });
    expect(r.escalated).toBe(true);
    expect(r.recommendedIntervention).toBe('DUAL_SOURCE');
    expect(r.escalationReasonEn.startsWith('Root cause has recurred 3 times (3rd+ occurrence) — per 8D/SCAR doctrine')).toBe(true);
    expect(r.escalationReasonAr.startsWith('تكرر السبب الجذري 3 مرات (الحالة الثالثة أو أكثر) — وفق مبدأ 8D/SCAR')).toBe(true);
  });
  it('3rd+ occurrence already beyond DUAL_SOURCE: not escalated, text names the base intervention', () => {
    const r = recommendEscalation({ baseIntervention: 'REPLACE', recurrenceCount: 4, variability: 'low' });
    expect(r.escalated).toBe(false);
    expect(r.recommendedIntervention).toBe('REPLACE');
    expect(r.escalationReasonEn).toContain('4 times (3rd+ occurrence), but the intervention is already at or beyond DUAL_SOURCE (REPLACE)');
    expect(r.escalationReasonAr).toContain('الإجراء الحالي (REPLACE)');
  });
  it('combined signal needs BOTH high variability AND recurrence >= 1', () => {
    expect(recommendEscalation({ baseIntervention: 'REPAIR', recurrenceCount: 0, variability: 'high' }).combinedSignalFlag).toBe(false);
    expect(recommendEscalation({ baseIntervention: 'REPAIR', recurrenceCount: 1, variability: 'moderate' }).combinedSignalFlag).toBe(false);
    const both = recommendEscalation({ baseIntervention: 'REPAIR', recurrenceCount: 1, variability: 'high' });
    expect(both.combinedSignalFlag).toBe(true);
    expect(both.combinedSignalNoteEn.startsWith('Worth a question, not a verdict:')).toBe(true);
    expect(both.combinedSignalNoteAr.startsWith('يستحق طرح سؤال، لا إصدار حكم:')).toBe(true);
  });
  it('threshold overrides move the boundaries', () => {
    const o = { escalateAtRecurrence: 2, forceDualSourceAtRecurrence: 5 };
    expect(recommendEscalation({ baseIntervention: 'REPAIR', recurrenceCount: 1, variability: 'low', escalationThresholdOverride: o }).escalated).toBe(false);
    expect(recommendEscalation({ baseIntervention: 'REPAIR', recurrenceCount: 2, variability: 'low', escalationThresholdOverride: o }).recommendedIntervention).toBe('DEVELOP');
    expect(recommendEscalation({ baseIntervention: 'REPAIR', recurrenceCount: 5, variability: 'low', escalationThresholdOverride: o }).recommendedIntervention).toBe('DUAL_SOURCE');
  });
});
