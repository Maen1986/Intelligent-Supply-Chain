import { describe, it, expect } from 'vitest';
import {
  assessNegotiationLeverage, assessLeverageSensitivity, DEFAULT_LEVERAGE_THRESHOLDS,
} from './supplierCommercialIntelligence';

const ok = (lockInIndex: number) => ({ lockInIndex, isSurvivable: true });

describe('leverage cut-offs: defaults, overrides, reporting (E3 closure 6 Nov 2026)', () => {
  it('defaults are 2 and 4 and the result reports them as ISC calibration', () => {
    expect(DEFAULT_LEVERAGE_THRESHOLDS).toEqual({ low: 2, high: 4 });
    const r = assessNegotiationLeverage(ok(1));
    expect(r.thresholds).toEqual({ low: 2, high: 4 });
    expect(r.thresholdSource).toBe('isc-calibration-default');
    expect(r.thresholdOverrideRejected).toBe(false);
  });
  it('a valid override changes the reading and is reported as caller-override', () => {
    expect(assessNegotiationLeverage(ok(1.5)).level).toBe('STRONG');
    const strict = assessNegotiationLeverage(ok(1.5), null, { thresholds: { low: 1, high: 4 } });
    expect(strict.level).toBe('MODERATE');
    expect(strict.thresholdSource).toBe('caller-override');
    expect(assessNegotiationLeverage(ok(3.5)).level).toBe('MODERATE');
    expect(assessNegotiationLeverage(ok(3.5), null, { thresholds: { low: 2, high: 3 } }).level).toBe('WEAK');
  });
  it('a partial override keeps the other default', () => {
    const r = assessNegotiationLeverage(ok(1), null, { thresholds: { high: 3 } });
    expect(r.thresholds).toEqual({ low: 2, high: 3 });
    expect(r.thresholdSource).toBe('caller-override');
  });
  it('boundary: exactly at low is STRONG, exactly at high is WEAK, for overridden cut-offs too', () => {
    const o = { thresholds: { low: 1.5, high: 3.5 } };
    expect(assessNegotiationLeverage(ok(1.5), null, o).level).toBe('STRONG');
    expect(assessNegotiationLeverage(ok(1.6), null, o).level).toBe('MODERATE');
    expect(assessNegotiationLeverage(ok(3.5), null, o).level).toBe('WEAK');
    expect(assessNegotiationLeverage(ok(3.4), null, o).level).toBe('MODERATE');
  });
  it('invalid overrides fall back to the defaults and say so', () => {
    const bad: Array<{ low?: number; high?: number }> = [
      { low: 4, high: 2 }, { low: 3, high: 3 }, { low: -1, high: 4 }, { low: 2, high: 6 },
      { low: NaN, high: 4 }, { low: 2, high: Infinity }, { low: Number.NEGATIVE_INFINITY },
    ];
    for (const thresholds of bad) {
      const r = assessNegotiationLeverage(ok(1), null, { thresholds });
      expect(r.thresholds).toEqual({ low: 2, high: 4 });
      expect(r.thresholdSource).toBe('isc-calibration-default');
      expect(r.thresholdOverrideRejected).toBe(true);
      expect(r.level).toBe('STRONG');
    }
  });
  it('an all-undefined override is simply the default, not a rejection', () => {
    const r = assessNegotiationLeverage(ok(1), null, { thresholds: { low: undefined, high: undefined } });
    expect(r.thresholdOverrideRejected).toBe(false);
    expect(r.thresholdSource).toBe('isc-calibration-default');
  });
  it('INSUFFICIENT_DATA still reports the cut-offs and ignores them for the level', () => {
    const r = assessNegotiationLeverage({ lockInIndex: null, isSurvivable: true }, null, { thresholds: { low: 1, high: 3 } });
    expect(r.level).toBe('INSUFFICIENT_DATA');
    expect(r.thresholds).toEqual({ low: 1, high: 3 });
  });
  it('not survivable is WEAK whatever the cut-offs', () => {
    expect(assessNegotiationLeverage({ lockInIndex: 0, isSurvivable: false }, null, { thresholds: { low: 0.5, high: 4.9 } }).level).toBe('WEAK');
  });
  it('framing text follows the overridden weak cut-off', () => {
    const r = assessNegotiationLeverage(ok(3.2), null, { thresholds: { low: 1, high: 3 } });
    expect(r.level).toBe('WEAK');
    expect(r.framingEn).toMatch(/Lock-In Index 3\.2\/5 \(high\)/);
  });
});

describe('assessLeverageSensitivity', () => {
  it('lock-in 2 survivable: stricter cut-offs change the reading, looser do not', () => {
    const s = assessLeverageSensitivity(ok(2));
    expect(s.base).toBe('STRONG');
    expect(s.moreCautious).toBe('MODERATE');
    expect(s.lessCautious).toBe('STRONG');
    expect(s.changes).toBe(true);
    expect(s.step).toBe(0.5);
  });
  it('lock-in 3 survivable is stable in both directions', () => {
    const s = assessLeverageSensitivity(ok(3));
    expect(s).toMatchObject({ base: 'MODERATE', moreCautious: 'MODERATE', lessCautious: 'MODERATE', changes: false });
  });
  it('lock-in 4 survivable: looser cut-offs lift it from WEAK', () => {
    const s = assessLeverageSensitivity(ok(4));
    expect(s.base).toBe('WEAK');
    expect(s.lessCautious).toBe('MODERATE');
    expect(s.changes).toBe(true);
  });
  it('not survivable never changes; insufficient data never changes', () => {
    expect(assessLeverageSensitivity({ lockInIndex: 1, isSurvivable: false }).changes).toBe(false);
    const s = assessLeverageSensitivity({ lockInIndex: null, isSurvivable: null });
    expect(s).toMatchObject({ base: 'INSUFFICIENT_DATA', moreCautious: 'INSUFFICIENT_DATA', lessCautious: 'INSUFFICIENT_DATA', changes: false });
  });
  it('uses the cut-offs in force and survives extreme overrides and bad steps', () => {
    const s = assessLeverageSensitivity(ok(1), null, { thresholds: { low: 0, high: 5 } }, 10);
    expect(['STRONG', 'MODERATE', 'WEAK']).toContain(s.moreCautious);
    expect(['STRONG', 'MODERATE', 'WEAK']).toContain(s.lessCautious);
    expect(assessLeverageSensitivity(ok(1), null, undefined, NaN).step).toBe(0.5);
    expect(assessLeverageSensitivity(ok(1), null, undefined, -3).step).toBe(0.5);
  });
});
