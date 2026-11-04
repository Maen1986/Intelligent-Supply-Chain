/**
 * Round C (#668) -- property / invariant tests on the numeric primitives of the supplier engines,
 * plus regression tests for the invalid-number defects the survey found (NaN/Infinity/negative
 * were read as confident results). All random cases are seeded; a failure prints its seed.
 */
import { describe, it, expect } from 'vitest';
import { computeTrend, classifyVariability, checkLatestPeriodShock } from './supplierPerformanceRecovery';
import { computeHHI, bandForHHI, testDimension, computeIntelligenceDebtUSD, type ConcentrationSupplierInput } from './supplierConcentration';
import { rateCategoryScore } from './supplierPeriodicEvaluation';
import { rng, int, HOSTILE_NUMBERS } from './supplierAdversarialKit';

const SEEDS = Array.from({ length: 300 }, (_, i) => 5000 + i);
const BAD = [NaN, Infinity, -Infinity];

describe('R-C regression: invalid numbers are INSUFFICIENT_DATA, never a confident answer', () => {
  it.each(BAD)('computeTrend with %s in the series', (b) => {
    const r = computeTrend([80, b, 78, 77]);
    expect(r.trend).toBe('INSUFFICIENT_DATA');
    expect(r.slope).toBeNull();
  });
  it.each(BAD)('classifyVariability with %s (latest or history)', (b) => {
    expect(classifyVariability([80, 81, 79, 80, 82], b).variability).toBe('INSUFFICIENT_DATA');
    expect(classifyVariability([80, b, 79, 80, 82], 80).variability).toBe('INSUFFICIENT_DATA');
  });
  it.each(BAD)('checkLatestPeriodShock with %s as latest or prior', (b) => {
    expect(checkLatestPeriodShock([80, b])).toMatchObject({ isShock: false, periodOverPeriodChangePct: null });
    expect(checkLatestPeriodShock([b, 80])).toMatchObject({ isShock: false, periodOverPeriodChangePct: null });
  });
  it('prior = 0 and latest != 0 is still a documented real shock (Infinity change), not invalid data', () => {
    expect(checkLatestPeriodShock([0, 50])).toMatchObject({ isShock: true, periodOverPeriodChangePct: Infinity });
  });
  it.each(BAD)('computeIntelligenceDebtUSD(%s)', (b) => {
    expect(computeIntelligenceDebtUSD(b, 100)).toBeNull();
    expect(computeIntelligenceDebtUSD(3, b)).toBeNull();
  });
  it('negative gap count or cost is invalid, not a negative debt', () => {
    expect(computeIntelligenceDebtUSD(-1, 100)).toBeNull();
    expect(computeIntelligenceDebtUSD(2, -100)).toBeNull();
    expect(computeIntelligenceDebtUSD(2, 100)).toBe(200);
  });
  const sup = (id: string, share: number, value = 'PortX'): ConcentrationSupplierInput => ({
    supplierId: id, name: id, capacityOrSpendSharePct: share,
    dependencyFacts: { logistics: { value, evidenceStage: 'VERIFIED' } } as ConcentrationSupplierInput['dependencyFacts'],
  });
  it.each(BAD)('one supplier with share %s must not turn the dimension into "competitive / true diversification"', (b) => {
    const out = testDimension('logistics' as never, [sup('a', 60), sup('b', 40), sup('bad', b)]);
    for (const f of out) {
      expect(Number.isFinite(f.hhi)).toBe(true);
      expect(Number.isFinite(f.affectedSharePct)).toBe(true);
    }
    // the two valid suppliers share one port: that real finding must survive the bad row
    expect(out.length).toBe(1);
    expect(out[0]!.affectedSuppliers.sort()).toEqual(['a', 'b']);
  });
  it('a negative share is excluded, not subtracted', () => {
    const out = testDimension('logistics' as never, [sup('a', 60), sup('b', 40), sup('neg', -50)]);
    expect(out[0]!.affectedSharePct).toBe(100);
  });
});

describe('R-C properties: trend', () => {
  it('strictly rising / falling / flat series classify correctly, and are shift- and scale-invariant (300 seeds)', () => {
    const fails: string[] = [];
    for (const s of SEEDS) {
      const r = rng(s); const n = int(r, 4, 14); const step = 1 + r() * 5; const base = 20 + r() * 60;
      const up = Array.from({ length: n }, (_, i) => base + i * step);
      const down = up.map((v) => 200 - v);
      const flat = Array.from({ length: n }, () => base);
      if (computeTrend(up).trend !== 'improving') fails.push(`seed ${s}: up not improving`);
      if (computeTrend(down).trend !== 'declining') fails.push(`seed ${s}: down not declining`);
      if (computeTrend(flat).trend !== 'stable') fails.push(`seed ${s}: flat not stable`);
      const shifted = computeTrend(up.map((v) => v + 1000)).trend; const scaled = computeTrend(up.map((v) => v * 3)).trend;
      if (shifted !== 'improving' || scaled !== 'improving') fails.push(`seed ${s}: shift/scale changed the trend`);
    }
    expect(fails.slice(0, 10)).toEqual([]);
  });
});

describe('R-C properties: variability', () => {
  it('order of the history never changes the answer; deviation never negative; farther latest is never "calmer" (300 seeds)', () => {
    const rank = { low: 0, moderate: 1, high: 2 } as const;
    const fails: string[] = [];
    for (const s of SEEDS) {
      const r = rng(s); const n = int(r, 5, 12);
      const hist = Array.from({ length: n }, () => 60 + r() * 30);
      const shuffled = [...hist].sort(() => r() - 0.5);
      const latest = 40 + r() * 60;
      const a = classifyVariability(hist, latest); const b = classifyVariability(shuffled, latest);
      if (a.variability !== b.variability) fails.push(`seed ${s}: order changed class`);
      if (a.deviationInSigma !== null && a.deviationInSigma < 0) fails.push(`seed ${s}: negative sigma`);
      const mean = a.mean!;
      const near = classifyVariability(hist, mean + 0.1); const far = classifyVariability(hist, mean + 50);
      if (rank[far.variability as 'low'] < rank[near.variability as 'low']) fails.push(`seed ${s}: farther value rated calmer`);
    }
    expect(fails.slice(0, 10)).toEqual([]);
  });
});

describe('R-C properties: concentration (HHI)', () => {
  const bandRank = { competitive: 0, moderatelyConcentrated: 1, highlyConcentrated: 2 } as const;
  it('HHI bounds, order-invariance, splitting never raises it, band is monotone (300 seeds)', () => {
    const fails: string[] = [];
    for (const s of SEEDS) {
      const r = rng(s); const n = int(r, 1, 12);
      const raw = Array.from({ length: n }, () => 1 + r() * 20); const tot = raw.reduce((a, b) => a + b, 0);
      const shares = raw.map((x) => (100 * x) / tot);
      const h = computeHHI(shares);
      if (h < 10000 / n - 1e-6 || h > 10000 + 1e-6) fails.push(`seed ${s}: HHI ${h} outside [10000/n, 10000]`);
      if (Math.abs(computeHHI([...shares].reverse()) - h) > 1e-6) fails.push(`seed ${s}: order changed HHI`);
      const split = [...shares.slice(1), shares[0]! / 2, shares[0]! / 2];
      if (computeHHI(split) > h + 1e-9) fails.push(`seed ${s}: splitting a supplier raised HHI`);
      const h2 = h + r() * 3000;
      if (bandRank[bandForHHI(h2)] < bandRank[bandForHHI(h)]) fails.push(`seed ${s}: band not monotone`);
    }
    expect(fails.slice(0, 10)).toEqual([]);
    expect(computeHHI([100])).toBe(10000);
    expect(computeHHI([])).toBe(0);
  });
});

describe('R-C properties: rating bands', () => {
  it('rateCategoryScore is monotone and exact at its cut points', () => {
    const rank = { at_risk: 0, watch: 1, acceptable: 2, strong: 3 } as const;
    let prev = -1;
    for (let x = 0; x <= 100; x += 0.5) { const k = rank[rateCategoryScore(x)]; expect(k).toBeGreaterThanOrEqual(prev); prev = k; }
    expect(rateCategoryScore(85)).toBe('strong'); expect(rateCategoryScore(84.999)).toBe('acceptable');
    expect(rateCategoryScore(65)).toBe('acceptable'); expect(rateCategoryScore(64.999)).toBe('watch');
    expect(rateCategoryScore(40)).toBe('watch'); expect(rateCategoryScore(39.999)).toBe('at_risk');
  });
  it('hostile numbers never throw', () => {
    for (const x of HOSTILE_NUMBERS) expect(() => rateCategoryScore(x)).not.toThrow();
  });
});
