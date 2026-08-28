import { describe, it, expect } from 'vitest';
import {
  defaultRoutingInputs, defaultFreeZoneRate, computeRouting, buildFreeZoneRoutingPrompt,
  GCC_CET_RATE_PCT, FREE_ZONE_BENCHMARKS, type RoutingInputs,
} from './freeZoneRouting';

function inputs(overrides: Partial<RoutingInputs> = {}): RoutingInputs {
  return { ...defaultRoutingInputs(), ...overrides };
}

describe('defaultFreeZoneRate', () => {
  it('returns the midpoint of the JAFZA published range', () => {
    expect(defaultFreeZoneRate('jafza')).toBe(130); // (80+180)/2
  });

  it('returns the midpoint of the KEZAD published range', () => {
    expect(defaultFreeZoneRate('kezad')).toBe(110); // (70+150)/2
  });

  it('returns null for custom (no benchmark)', () => {
    expect(defaultFreeZoneRate('custom')).toBeNull();
  });
});

describe('GCC_CET_RATE_PCT', () => {
  it('is the real, sourced 5% flat rate', () => {
    expect(GCC_CET_RATE_PCT).toBe(5);
  });
});

describe('computeRouting', () => {
  it('returns nulls when no inputs are entered', () => {
    const result = computeRouting(inputs({ freeZoneRateAedSqmYr: null, shipmentValueCifAed: null, storageDurationMonths: null, storageAreaSqm: null }));
    expect(result.hasEnoughForDuty).toBe(false);
    expect(result.hasEnoughForStorage).toBe(false);
    expect(result.dutyAmountAed).toBeNull();
    expect(result.freeZoneStorageCostAed).toBeNull();
  });

  it('computes duty as 5% of CIF value', () => {
    const result = computeRouting(inputs({ shipmentValueCifAed: 1_000_000 }));
    expect(result.dutyAmountAed).toBe(50_000);
  });

  it('re-export via Makasa avoids duty entirely in the UAE', () => {
    const result = computeRouting(inputs({ shipmentValueCifAed: 1_000_000, routingChoice: 'reExport' }));
    expect(result.dutyAvoidedInUaeAed).toBe(50_000);
    expect(result.dutyDeferredAed).toBeNull();
  });

  it('mainland sale defers (does not avoid) duty', () => {
    const result = computeRouting(inputs({ shipmentValueCifAed: 1_000_000, routingChoice: 'mainlandSale' }));
    expect(result.dutyAvoidedInUaeAed).toBe(0);
    expect(result.dutyDeferredAed).toBe(50_000);
  });

  it('computes free-zone storage cost from rate x duration x area', () => {
    const result = computeRouting(inputs({
      freeZoneRateAedSqmYr: 120, storageDurationMonths: 6, storageAreaSqm: 500,
    }));
    // 120/12 * 6 * 500 = 30,000
    expect(result.freeZoneStorageCostAed).toBe(30_000);
  });

  it('leaves mainland storage cost null when no mainland rate is entered', () => {
    const result = computeRouting(inputs({
      freeZoneRateAedSqmYr: 120, storageDurationMonths: 6, storageAreaSqm: 500, mainlandRateAedSqmYr: null,
    }));
    expect(result.hasMainlandStorageRate).toBe(false);
    expect(result.mainlandStorageCostAed).toBeNull();
    expect(result.mainlandPathTotalAed).toBeNull();
    expect(result.savingsAed).toBeNull();
  });

  it('computes a full comparison once a mainland rate is entered', () => {
    const result = computeRouting(inputs({
      freeZoneRateAedSqmYr: 120, mainlandRateAedSqmYr: 200,
      storageDurationMonths: 12, storageAreaSqm: 1000,
      shipmentValueCifAed: 2_000_000, routingChoice: 'reExport',
    }));
    // FZ storage: 120*1000 = 120,000; duty avoided via re-export -> FZ path total = 120,000 (no duty added)
    expect(result.freeZoneStorageCostAed).toBe(120_000);
    expect(result.freeZonePathTotalAed).toBe(120_000);
    // Mainland storage: 200*1000 = 200,000; + duty 5%*2,000,000 = 100,000 -> total 300,000
    expect(result.mainlandStorageCostAed).toBe(200_000);
    expect(result.mainlandPathTotalAed).toBe(300_000);
    expect(result.savingsAed).toBe(180_000);
  });

  it('adds deferred duty into the free-zone path total for a mainland-sale routing choice', () => {
    const result = computeRouting(inputs({
      freeZoneRateAedSqmYr: 120, mainlandRateAedSqmYr: 200,
      storageDurationMonths: 12, storageAreaSqm: 1000,
      shipmentValueCifAed: 2_000_000, routingChoice: 'mainlandSale',
    }));
    // FZ path total = 120,000 storage + 100,000 duty (deferred but still paid eventually) = 220,000
    expect(result.freeZonePathTotalAed).toBe(220_000);
    expect(result.mainlandPathTotalAed).toBe(300_000);
    expect(result.savingsAed).toBe(80_000);
  });

  it('treats negative or missing figures as zero rather than corrupting the result', () => {
    const result = computeRouting(inputs({ shipmentValueCifAed: -500 }));
    expect(result.hasEnoughForDuty).toBe(false);
    expect(result.dutyAmountAed).toBeNull();
  });
});

describe('FREE_ZONE_BENCHMARKS', () => {
  it('sources JAFZA and KEZAD ranges but not custom', () => {
    expect(FREE_ZONE_BENCHMARKS.jafza.rateRangeLowAedSqmYr).toBe(80);
    expect(FREE_ZONE_BENCHMARKS.jafza.rateRangeHighAedSqmYr).toBe(180);
    expect(FREE_ZONE_BENCHMARKS.kezad.rateRangeLowAedSqmYr).toBe(70);
    expect(FREE_ZONE_BENCHMARKS.kezad.rateRangeHighAedSqmYr).toBe(150);
    expect(FREE_ZONE_BENCHMARKS.custom.rateRangeLowAedSqmYr).toBeNull();
  });
});

describe('buildFreeZoneRoutingPrompt', () => {
  it('includes the duty amount and path totals in English', () => {
    const inp = inputs({
      freeZoneRateAedSqmYr: 120, mainlandRateAedSqmYr: 200,
      storageDurationMonths: 12, storageAreaSqm: 1000,
      shipmentValueCifAed: 2_000_000, routingChoice: 'reExport',
    });
    const result = computeRouting(inp);
    const prompt = buildFreeZoneRoutingPrompt(inp, result, false);
    expect(prompt).toContain('100,000');
    expect(prompt).toContain('120,000');
    expect(prompt).toContain('Re-export via Makasa');
  });

  it('renders in Arabic when isAr is true', () => {
    const inp = inputs({ shipmentValueCifAed: 1_000_000 });
    const result = computeRouting(inp);
    const prompt = buildFreeZoneRoutingPrompt(inp, result, true);
    expect(prompt).toContain('أداة توجيه المنطقة الحرة');
  });
});
