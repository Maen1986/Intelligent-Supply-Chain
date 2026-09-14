/**
 * Tests for the Supplier Recovery Portfolio aggregation layer
 * (supplierRecoveryPortfolio.ts). Promoted from ad-hoc verification scripts
 * (run_portfolio.ts / run_portfolio_empty.ts, both still included as
 * worked-example fixtures) into a real, permanent vitest suite before this
 * file's first commit to the repo -- a print script is not a test.
 */
import { describe, it, expect } from 'vitest';
import {
  type SupplierRecord,
  type KraljicItemLite,
  type SupplierCategoryShare,
  type CARRecord,
  buildMockSupplierSpendDataset,
  computeSupplierExposure,
  computeTotalExposureAtRisk,
  computeCarCohorts,
  computeMigrationTrails,
  computeRootCauseByDimension,
  computeRootCauseCOPQBreakdown,
  computeCOPQAttentionPriority,
  computePortfolioKPIs,
  detectSupplier,
} from './supplierRecoveryPortfolio';
import type { CARBusinessImpact, CARCustomerImpactOverride } from './supplierCOPQ';

const supplier: SupplierRecord = {
  supplierId: 'SUP-TEST',
  name: 'Test Supplier',
  category: 'Widgets',
  quadrant: 'bottleneck',
  quadrantPriorQuarter: 'strategic',
  scoreHistory12mo: [90, 88, 85, 80, 76, 71, 68, 65, 62, 60, 58, 55],
  cars: [
    { id: 'CAR-1', supplierId: 'SUP-TEST', category: 'quality', scorecardDimension: 'quality', rootCause: 'x', status: 'closed', createdAt: '2026-01-05', closedAt: '2026-02-10' },
    { id: 'CAR-2', supplierId: 'SUP-TEST', category: 'quality', scorecardDimension: 'quality', rootCause: 'x', status: 'open', createdAt: '2026-08-01', closedAt: null },
  ],
};
const categoryItems: KraljicItemLite[] = [{ id: 'ITEM-1', category: 'Widgets', annualSpendSAR: 10_000_000, quadrant: 'bottleneck' }];
const shares: SupplierCategoryShare[] = [{ supplierId: 'SUP-TEST', category: 'Widgets', capacityOrSpendSharePct: 40 }];

describe('buildMockSupplierSpendDataset', () => {
  it('allocates category total by relative share and tags every record as mock', () => {
    const [rec] = buildMockSupplierSpendDataset([supplier], categoryItems, shares);
    expect(rec!.mockAnnualSpendSAR).toBe(4_000_000); // 10M * 40%
    expect(rec!.derivationNote).toMatch(/MOCK\/SYNTHETIC/);
  });
  it('returns 0 for a supplier with no matching share (no silent fabrication)', () => {
    const other: SupplierRecord = { ...supplier, supplierId: 'SUP-NOSHARE' };
    const [rec] = buildMockSupplierSpendDataset([other], categoryItems, shares);
    expect(rec!.mockAnnualSpendSAR).toBe(0);
  });
});

describe('computeSupplierExposure', () => {
  it('tags the basis as mock-simulated-per-supplier-spend, not a real-data approximation', () => {
    const r = computeSupplierExposure(supplier, categoryItems, shares);
    expect(r.exposureBasis).toBe('mock-simulated-per-supplier-spend');
    expect(r.exposureSAR).toBe(4_000_000);
  });
  it('returns INSUFFICIENT_DATA (not a fabricated 0-as-real) when no category item exists', () => {
    const r = computeSupplierExposure(supplier, [], shares);
    expect(r.exposureBasis).toBe('INSUFFICIENT_DATA');
    expect(r.exposureSAR).toBe(0);
  });
});

describe('computeTotalExposureAtRisk', () => {
  it('sums only suppliers with a resolvable exposure and counts the rest as insufficient-data', () => {
    const noShare: SupplierRecord = { ...supplier, supplierId: 'SUP-NOSHARE', category: 'Unknown' };
    const r = computeTotalExposureAtRisk([supplier, noShare], categoryItems, shares);
    expect(r.totalSAR).toBe(4_000_000);
    expect(r.suppliersWithInsufficientData).toBe(1);
  });
});

describe('computeCarCohorts', () => {
  it('buckets by creation quarter and computes 90-day resolution correctly', () => {
    const cohorts = computeCarCohorts(supplier.cars, '2026-09-10');
    const q1 = cohorts.find((c) => c.quarter === '2026-Q1')!;
    expect(q1.opened).toBe(1);
    expect(q1.resolvedWithin90d).toBe(1); // Jan 5 -> Feb 10 = 36 days
    expect(q1.medianDaysToClose).toBe(36);
    const q3 = cohorts.find((c) => c.quarter === '2026-Q3')!;
    expect(q3.stillOpenAtEndOfQuarter).toBe(1);
    expect(q3.medianDaysToClose).toBeNull();
  });
  it('returns an empty array for no CARs, not a crash or a fabricated zero-quarter', () => {
    expect(computeCarCohorts([], '2026-09-10')).toEqual([]);
  });
});

describe('computeMigrationTrails', () => {
  it('flags migration only when prior differs from current', () => {
    const [trail] = computeMigrationTrails([supplier]);
    expect(trail!.migrated).toBe(true);
    expect(trail!.prior).toBe('strategic');
    expect(trail!.current).toBe('bottleneck');
  });
  it('does not flag migration when prior is null (no history) or equal to current', () => {
    const noHistory: SupplierRecord = { ...supplier, quadrantPriorQuarter: null };
    const stable: SupplierRecord = { ...supplier, quadrantPriorQuarter: 'bottleneck' };
    expect(computeMigrationTrails([noHistory])[0]!.migrated).toBe(false);
    expect(computeMigrationTrails([stable])[0]!.migrated).toBe(false);
  });
});

describe('computeRootCauseByDimension', () => {
  it('always returns all 6 dimensions, zero-filled, no division by zero', () => {
    const dims = computeRootCauseByDimension([]);
    expect(dims).toHaveLength(6);
    expect(dims.every((d) => d.count === 0 && d.pctOfTotal === 0)).toBe(true);
  });
  it('computes percentages that sum to 100 across a real CAR set', () => {
    const dims = computeRootCauseByDimension(supplier.cars);
    const total = dims.reduce((s, d) => s + d.pctOfTotal, 0);
    expect(total).toBeCloseTo(100, 5);
  });
});

describe('computePortfolioKPIs -- zero-suppliers edge case (built and verified per explicit instruction, 11 Sep 2026)', () => {
  it('degrades to all-zero / null KPIs with no crash and no NaN on an empty portfolio', () => {
    const { kpis, detections } = computePortfolioKPIs([], [], [], '2026-09-10');
    expect(kpis.totalActiveSuppliers).toBe(0);
    expect(kpis.suppliersInEscalation).toBe(0);
    expect(kpis.totalExposureAtRiskSAR).toBe(0);
    expect(kpis.avgDaysInRecovery).toBeNull(); // null (no data), not 0 (zero days) -- a real distinction
    expect(kpis.combinedSignalFlagCount).toBe(0);
    expect(detections).toEqual([]);
  });
});

describe('detectSupplier + computePortfolioKPIs -- non-empty portfolio sanity', () => {
  it('classifies the declining, recurring test supplier as escalated, not REPAIR', () => {
    const d = detectSupplier(supplier);
    expect(d.trend).toBe('declining');
    expect(d.recommendedIntervention).not.toBe('REPAIR');
  });
  it('rolls a single escalated supplier up into the portfolio KPIs correctly', () => {
    const { kpis } = computePortfolioKPIs([supplier], categoryItems, shares, '2026-09-10');
    expect(kpis.totalActiveSuppliers).toBe(1);
    expect(kpis.suppliersInEscalation).toBe(1);
    expect(kpis.totalExposureAtRiskSAR).toBe(4_000_000);
  });
});

// ---------------------------------------------------------------------------
// detectSupplier -- SI Module 06 cross-engine shock check (Fix #700 QA pass,
// 14 Sep 2026). checkLatestPeriodShock existed in supplierPerformanceRecovery.ts,
// sourced from Module 06's maxIntraPeriodSwingPct convention, but was never
// wired into this portfolio layer -- the live dashboard had no real
// cross-engine trace to Module 06, only a methodology citation in a comment.
// Three-tier stress test per Rule 7, proving the wiring end-to-end.
// ---------------------------------------------------------------------------
describe('detectSupplier -- Module 06 cross-engine shock check', () => {
  it('SOFT: a gradual decline with no single-period jump does not flag shock', () => {
    // reuses the module-level `supplier` fixture: ...60, 58, 55 -- a ~5.2%
    // final-period move, real decline but not a shock.
    const d = detectSupplier(supplier);
    expect(d.shockFlag).toBe(false);
    expect(d.shockChangePct).not.toBeNull();
    expect(d.shockChangePct!).toBeLessThan(15);
  });

  it('HARDEST: a shock on the latest period is flagged independently of an otherwise-stable multi-period trend', () => {
    // Ten flat periods at 80, then a sharp one-period drop to 64 (a 20% move)
    // -- computeTrend's whole-series OLS read would not necessarily call
    // this "declining" on its own (a single late-series outlier can sit
    // inside an otherwise near-stable fit), but checkLatestPeriodShock must
    // still catch it, proving it is a genuinely independent, wired check.
    const shockSupplier: SupplierRecord = {
      ...supplier,
      supplierId: 'SUP-SHOCK',
      scoreHistory12mo: [80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 64],
    };
    const d = detectSupplier(shockSupplier);
    expect(d.shockFlag).toBe(true);
    expect(d.shockChangePct!).toBeCloseTo(20, 0);
    expect(d.shockRuleSourceEn).toMatch(/Module 06/);
    expect(d.shockRuleSourceAr.length).toBeGreaterThan(0);
  });

  it('BOUNDARY: exactly the 15% default threshold does not flag (isShock is strictly greater-than)', () => {
    const boundarySupplier: SupplierRecord = {
      ...supplier,
      supplierId: 'SUP-BOUNDARY',
      scoreHistory12mo: [...supplier.scoreHistory12mo.slice(0, -1), 100, 85], // exactly 15.0% drop
    };
    const d = detectSupplier(boundarySupplier);
    expect(d.shockChangePct!).toBeCloseTo(15, 5);
    expect(d.shockFlag).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// computeRootCauseCOPQBreakdown / computeCOPQAttentionPriority (11 Sep 2026
// wiring addition) — three-tier stress test per Rule 7.
// ---------------------------------------------------------------------------

const strategicSupplier: SupplierRecord = {
  supplierId: 'SUP-STRAT',
  name: 'Strategic Test Supplier',
  category: 'Widgets',
  quadrant: 'strategic',
  quadrantPriorQuarter: 'strategic',
  scoreHistory12mo: [90, 88, 85, 82, 80, 78, 76, 74, 72, 70, 68, 66],
  cars: [
    { id: 'CAR-S1', supplierId: 'SUP-STRAT', category: 'quality', scorecardDimension: 'quality', rootCause: 'defect', status: 'closed', createdAt: '2026-06-01', closedAt: '2026-06-20' },
    { id: 'CAR-S2', supplierId: 'SUP-STRAT', category: 'delivery', scorecardDimension: 'delivery', rootCause: 'late', status: 'open', createdAt: '2026-08-01', closedAt: null },
  ],
};

const nonCriticalSupplier: SupplierRecord = {
  supplierId: 'SUP-NC',
  name: 'Non-Critical Test Supplier',
  category: 'Widgets',
  quadrant: 'non-critical',
  quadrantPriorQuarter: 'non-critical',
  scoreHistory12mo: [95, 94, 93, 92, 91, 90, 89, 88, 87, 86, 85, 84],
  cars: [
    { id: 'CAR-N1', supplierId: 'SUP-NC', category: 'quality', scorecardDimension: 'quality', rootCause: 'minor variance', status: 'closed', createdAt: '2026-07-01', closedAt: '2026-07-10' },
  ],
};

const zeroCarSupplier: SupplierRecord = {
  supplierId: 'SUP-ZERO',
  name: 'No-Issues Test Supplier',
  category: 'Widgets',
  quadrant: 'bottleneck',
  quadrantPriorQuarter: 'bottleneck',
  scoreHistory12mo: [92, 92, 92, 92, 92, 92, 92, 92, 92, 92, 92, 92],
  cars: [],
};

const testImpacts: CARBusinessImpact[] = [
  { carId: 'CAR-S1', description: 'coating rework', estimatedCostUSD: 20_000, basis: 'estimated' },
  { carId: 'CAR-S2', description: 'expedite fee', estimatedCostUSD: 5_000, basis: 'estimated' },
  { carId: 'CAR-N1', description: 'minor sort cost', estimatedCostUSD: 1_000, basis: 'estimated' },
  { carId: 'CAR-1', description: 'quality rework, base fixture', estimatedCostUSD: 8_000, basis: 'estimated' },
  { carId: 'CAR-2', description: 'quality rework, base fixture, open', estimatedCostUSD: 12_000, basis: 'estimated' },
];

const testOverrides: CARCustomerImpactOverride[] = [{ carId: 'CAR-S1', customerImpact: 'external' }];

describe('computeRootCauseCOPQBreakdown', () => {
  it('SOFT: quality dimension gets a real costed total when impacts are supplied', () => {
    const allCars = [...supplier.cars, ...strategicSupplier.cars, ...nonCriticalSupplier.cars];
    const rows = computeRootCauseCOPQBreakdown(allCars, testImpacts, testOverrides, '2026-09-10');
    const quality = rows.find((r) => r.dimension === 'quality')!;
    expect(quality.costedUSD).not.toBeNull();
    expect(quality.costBasis).toBe('derived-from-linked-business-impact');
    // Quality-dimension CARs across all three suppliers: CAR-1 (8000), CAR-2 (12000),
    // CAR-S1 (20000), CAR-N1 (1000) = 41000 total costed for the quality dimension.
    expect(quality.costedUSD).toBe(41_000);
  });

  it('HARDEST: a dimension with CARs but zero matching impacts stays honestly INSUFFICIENT_DATA, never a fabricated $0', () => {
    const cars = [
      { id: 'X1', supplierId: 'SUP-X', category: 'compliance' as const, scorecardDimension: 'compliance' as const, rootCause: 'r', status: 'open' as const, createdAt: '2026-08-01', closedAt: null },
    ];
    const rows = computeRootCauseCOPQBreakdown(cars, [], [], '2026-09-10');
    const compliance = rows.find((r) => r.dimension === 'compliance')!;
    expect(compliance.count).toBe(1);
    expect(compliance.costedUSD).toBeNull();
    expect(compliance.costBasis).toBe('INSUFFICIENT_DATA');
    expect(compliance.pctOfCostedTotal).toBeNull();
  });

  it('BOUNDARY: empty CAR list returns all six dimensions at zero, never throws', () => {
    const rows = computeRootCauseCOPQBreakdown([], [], [], '2026-09-10');
    expect(rows).toHaveLength(6);
    expect(rows.every((r) => r.count === 0 && r.costedUSD === null)).toBe(true);
  });

  it('BOUNDARY: pctOfCostedTotal across costed dimensions sums to ~100', () => {
    const allCars = [...strategicSupplier.cars, ...nonCriticalSupplier.cars];
    const rows = computeRootCauseCOPQBreakdown(allCars, testImpacts, testOverrides, '2026-09-10');
    const sum = rows.reduce((s, r) => s + (r.pctOfCostedTotal ?? 0), 0);
    expect(Math.round(sum)).toBeGreaterThanOrEqual(99);
    expect(Math.round(sum)).toBeLessThanOrEqual(101);
  });
});

describe('computeCOPQAttentionPriority', () => {
  it('SOFT: a supplier with zero CARs scores 0, not a hidden default, and is not silently dropped', () => {
    const rows = computeCOPQAttentionPriority([zeroCarSupplier], testImpacts, testOverrides, '2026-09-10');
    const zero = rows.find((r) => r.supplierId === 'SUP-ZERO')!;
    expect(zero.priorityScore).toBe(0);
    expect(zero.costBasis).toBe('INSUFFICIENT_DATA');
  });

  it('HARDEST: a strategic supplier with a costly, externally-classified CAR outranks a non-critical supplier with a cheap internal one', () => {
    const rows = computeCOPQAttentionPriority([strategicSupplier, nonCriticalSupplier], testImpacts, testOverrides, '2026-09-10');
    const stratIdx = rows.findIndex((r) => r.supplierId === 'SUP-STRAT');
    const ncIdx = rows.findIndex((r) => r.supplierId === 'SUP-NC');
    expect(stratIdx).toBeLessThan(ncIdx); // sorted descending by priorityScore -- strategic must come first
  });

  it('HARDEST: results are always sorted descending by priorityScore, including a three-way mix with a zero-CAR supplier', () => {
    const rows = computeCOPQAttentionPriority([nonCriticalSupplier, zeroCarSupplier, strategicSupplier], testImpacts, testOverrides, '2026-09-10');
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1]!.priorityScore).toBeGreaterThanOrEqual(rows[i]!.priorityScore);
    }
  });

  it('BOUNDARY: empty supplier list returns an empty array, not an error', () => {
    const rows = computeCOPQAttentionPriority([], [], [], '2026-09-10');
    expect(rows).toEqual([]);
  });

  it('BOUNDARY: every row discloses the same non-empty formula string (never a silent black-box score)', () => {
    const rows = computeCOPQAttentionPriority([strategicSupplier, zeroCarSupplier], testImpacts, testOverrides, '2026-09-10');
    for (const r of rows) {
      expect(r.formulaEn.length).toBeGreaterThan(20);
      expect(r.formulaAr.length).toBeGreaterThan(20);
    }
  });
});
