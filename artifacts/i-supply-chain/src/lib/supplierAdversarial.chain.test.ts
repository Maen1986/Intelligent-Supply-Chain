/**
 * Round C (#668) -- cross-engine CHAIN under attack.
 * M02 Kraljic quadrant -> M04 due-diligence tier -> M05 concentration metrics -> M06 negotiation leverage.
 * Each handoff is fed corrupted data; the rule (Decision Record 8.7): never a confident answer from garbage.
 */
import { describe, it, expect } from 'vitest';
import { determineDueDiligenceTier } from './supplierQualificationGates';
import { computeShortfall, computeSupplierMetrics, computeLockInIndex, buildSupplierMetricsPrompt } from './supplierConcentration';
import { assessNegotiationLeverage } from './supplierCommercialIntelligence';
import { HOSTILE_NUMBERS, rng, pick, findBad } from './supplierAdversarialKit';

const BAD = [NaN, Infinity, -Infinity, -1, -0.0001];

describe('R-C M05 dependency maths: garbage in -> "not assessable", never a confident number', () => {
  it.each(BAD)('computeShortfall(%s, 5) and (5, %s) are null/null, not "not survivable, NaN weeks"', (v) => {
    expect(computeShortfall(v, 5)).toEqual({ shortfallWeeks: null, isSurvivable: null });
    expect(computeShortfall(5, v)).toEqual({ shortfallWeeks: null, isSurvivable: null });
  });
  it('boundaries: equal recover/survive is survivable; one week short is a 1-week shortfall; zero/zero survivable', () => {
    expect(computeShortfall(4, 4)).toEqual({ shortfallWeeks: null, isSurvivable: true });
    expect(computeShortfall(5, 4)).toEqual({ shortfallWeeks: 1, isSurvivable: false });
    expect(computeShortfall(0, 0).isSurvivable).toBe(true);
  });
  it('metrics: a non-finite lock-in factor or share becomes null, never NaN/Infinity', () => {
    const m = computeSupplierMetrics({
      supplierId: 's', timeToRecoverWeeks: NaN, timeToSurviveWeeks: 3,
      lockIn: { switchingCost: NaN, toolingIpOwnership: 2, regulatoryReapprovalBurden: 2, integrationEffort: 2 },
      unresolvedEvidenceGapCount: 2, costPerUnresolvedGapUSD: 100, capacityOrSpendSharePct: Infinity, subTierFacts: [],
    });
    expect(m.isSurvivable).toBeNull(); expect(m.lockInIndex).toBeNull(); expect(m.hiddenConcentrationIndex).toBeNull();
    expect(findBad(m)).toEqual([]);
  });
  it('metrics prompt (EN and AR) never prints NaN / Infinity / undefined, even for a bad share', () => {
    const m = computeSupplierMetrics({ supplierId: 's', timeToRecoverWeeks: null, timeToSurviveWeeks: null, lockIn: null,
      unresolvedEvidenceGapCount: 0, costPerUnresolvedGapUSD: null, capacityOrSpendSharePct: NaN, subTierFacts: [] });
    for (const ar of [false, true]) expect(buildSupplierMetricsPrompt(m, ar)).not.toMatch(/NaN|Infinity|undefined|null/);
  });
  it('a valid supplier still gets real numbers (no over-blocking)', () => {
    const m = computeSupplierMetrics({ supplierId: 's', timeToRecoverWeeks: 8, timeToSurviveWeeks: 3,
      lockIn: { switchingCost: 4, toolingIpOwnership: 4, regulatoryReapprovalBurden: 4, integrationEffort: 4 },
      unresolvedEvidenceGapCount: 3, costPerUnresolvedGapUSD: 1000, capacityOrSpendSharePct: 60, subTierFacts: [] });
    expect(m).toMatchObject({ isSurvivable: false, shortfallWeeks: 5, lockInIndex: 4, intelligenceDebtUSD: 3000, hiddenConcentrationIndex: 60 });
  });
});

describe('R-C M06 leverage: a NaN Lock-In Index is INSUFFICIENT_DATA, not MODERATE', () => {
  it.each([NaN, Infinity, -Infinity])('lockInIndex %s', (v) => {
    expect(assessNegotiationLeverage({ lockInIndex: v, isSurvivable: true }).level).toBe('INSUFFICIENT_DATA');
    expect(assessNegotiationLeverage({ lockInIndex: v, isSurvivable: false }).level).toBe('INSUFFICIENT_DATA');
  });
  it('real values keep their bands (STRONG low+survivable, WEAK when not survivable)', () => {
    expect(assessNegotiationLeverage({ lockInIndex: 0.5, isSurvivable: true }).level).toBe('STRONG');
    expect(assessNegotiationLeverage({ lockInIndex: 2.5, isSurvivable: false }).level).toBe('WEAK');
  });
});

describe('R-C schema cross-check: the quadrant label is the handoff -- a mis-cased label must not silently downgrade due diligence', () => {
  it('canonical lower-case labels: strategic/bottleneck -> ENHANCED; leverage/non-critical/none -> STANDARD', () => {
    expect(determineDueDiligenceTier({ kraljicQuadrant: 'strategic' })).toBe('ENHANCED');
    expect(determineDueDiligenceTier({ kraljicQuadrant: 'bottleneck' })).toBe('ENHANCED');
    expect(determineDueDiligenceTier({ kraljicQuadrant: 'leverage' })).toBe('STANDARD');
    expect(determineDueDiligenceTier({})).toBe('STANDARD');
  });
  it('geographic risk >= 4 forces ENHANCED; 3.99 and NaN do not', () => {
    expect(determineDueDiligenceTier({ geographicRisk: 4 })).toBe('ENHANCED');
    expect(determineDueDiligenceTier({ geographicRisk: 3.99 })).toBe('STANDARD');
    expect(determineDueDiligenceTier({ geographicRisk: NaN })).toBe('STANDARD');
  });
  it('the case-study module uses Capitalised labels ("Strategic"): the tier function must treat them as strategic, not STANDARD', () => {
    expect(determineDueDiligenceTier({ kraljicQuadrant: 'Strategic' as never })).toBe('ENHANCED');
    expect(determineDueDiligenceTier({ kraljicQuadrant: ' BOTTLENECK ' as never })).toBe('ENHANCED');
  });
});

describe('R-C full chain, 400 random hostile suppliers: no engine emits NaN/Infinity/"undefined" into the next', () => {
  it('quadrant -> tier -> metrics -> leverage', () => {
    const fails: string[] = [];
    for (let seed = 1; seed <= 400; seed++) {
      const r = rng(seed);
      const num = () => pick(r, HOSTILE_NUMBERS as number[]);
      const tier = determineDueDiligenceTier({ kraljicQuadrant: pick(r, ['strategic', 'leverage', 'bottleneck', 'non-critical', 'x', undefined] as never[]), geographicRisk: num() });
      const ttr = r() < 0.3 ? null : num(); const tts = r() < 0.3 ? null : num();
      const m = computeSupplierMetrics({ supplierId: `s${seed}`, timeToRecoverWeeks: ttr, timeToSurviveWeeks: tts,
        lockIn: r() < 0.3 ? null : { switchingCost: num(), toolingIpOwnership: num(), regulatoryReapprovalBurden: num(), integrationEffort: num() },
        unresolvedEvidenceGapCount: num(), costPerUnresolvedGapUSD: r() < 0.3 ? null : num(), capacityOrSpendSharePct: num(), subTierFacts: [] });
      const lev = assessNegotiationLeverage({ lockInIndex: m.lockInIndex, isSurvivable: m.isSurvivable }, pick(r, ['strategic', 'leverage', null] as never[]));
      const bad = findBad({ tier, m, lev });
      if (bad.length) fails.push(`seed ${seed}: ${JSON.stringify(bad[0])}`);
      if (lev.level !== 'INSUFFICIENT_DATA' && (m.lockInIndex === null || m.isSurvivable === null)) fails.push(`seed ${seed}: leverage decided without evidence`);
    }
    expect(fails.slice(0, 10)).toEqual([]);
  });
});
void computeLockInIndex;
