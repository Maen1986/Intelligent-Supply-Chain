import { describe, expect, it } from 'vitest';
import {
  DEPENDENCY_DIMENSIONS,
  HHI_MODERATE_THRESHOLD,
  HHI_HIGH_THRESHOLD,
  computeHHI,
  bandForHHI,
  flagForHHI,
  testDimension,
  testAllDimensions,
  filterByKraljicCriticality,
  computeShortfall,
  computeLockInIndex,
  DEFAULT_LOCK_IN_WEIGHTS,
  countUnresolvedEvidenceGaps,
  computeIntelligenceDebtUSD,
  computeHiddenConcentrationIndex,
  computeSupplierMetrics,
  analyzePortfolioConcentration,
  buildCommonModeFindingPrompt,
  buildSupplierMetricsPrompt,
  type ConcentrationSupplierInput,
  type SupplierConcentrationMetricsInput,
} from '@/lib/supplierConcentration';
import type { SupplierFact } from '@/lib/supplierObjectModel';

function fact(overrides: Partial<SupplierFact> = {}): SupplierFact {
  return {
    id: 'f1',
    nodeId: 'n1',
    level: 'subTier',
    attribute: 'source',
    value: 'x',
    evidenceStage: 'CLAIMED',
    dataSource: 'manual',
    capturedAt: '2026-09-09',
    confidence: 'LOW',
    ...overrides,
  };
}

describe('dimension vocabulary', () => {
  it('has all ten dimensions from the Charter/SI-05 doc', () => {
    expect(DEPENDENCY_DIMENSIONS).toEqual([
      'supplier', 'site', 'country', 'region', 'port', 'rawMaterial',
      'subTier', 'technology', 'carrier', 'corridor', 'energySource',
    ]);
  });
});

describe('HHI concentration scoring', () => {
  it('computes standard Sigma(share^2)', () => {
    expect(computeHHI([25, 25, 25, 25])).toBe(2500);
    expect(computeHHI([100])).toBe(10000);
    expect(computeHHI([50, 50])).toBe(5000);
  });

  it('bands at the standard DOJ/FTC-convention thresholds', () => {
    expect(bandForHHI(1000)).toBe('competitive');
    expect(bandForHHI(HHI_MODERATE_THRESHOLD)).toBe('moderatelyConcentrated');
    expect(bandForHHI(2000)).toBe('moderatelyConcentrated');
    expect(bandForHHI(HHI_HIGH_THRESHOLD + 1)).toBe('highlyConcentrated');
  });

  it('flags APPARENT_DIVERSIFICATION above 1,500, TRUE_DIVERSIFICATION at or below', () => {
    expect(flagForHHI(1500)).toBe('TRUE_DIVERSIFICATION');
    expect(flagForHHI(1501)).toBe('APPARENT_DIVERSIFICATION');
    expect(flagForHHI(9000)).toBe('APPARENT_DIVERSIFICATION');
  });
});

describe('testDimension -- common-mode dependency test (CCF-grounded)', () => {
  const rawabiLike: ConcentrationSupplierInput[] = [
    { supplierId: 's1', name: 'Saudi Packaging Co', capacityOrSpendSharePct: 30, dependencyFacts: { port: { value: 'Jebel Ali', evidenceStage: 'VALIDATED' } } },
    { supplierId: 's2', name: 'UAE Packaging Co', capacityOrSpendSharePct: 28, dependencyFacts: { port: { value: 'Jebel Ali', evidenceStage: 'DOCUMENTED' } } },
    { supplierId: 's3', name: 'Turkey Packaging Co', capacityOrSpendSharePct: 20, dependencyFacts: { port: { value: 'Jebel Ali', evidenceStage: 'CLAIMED' } } },
    { supplierId: 's4', name: 'Bahrain Packaging Co', capacityOrSpendSharePct: 22, dependencyFacts: { port: { value: 'Sohar', evidenceStage: 'VALIDATED' } } },
  ];

  it('finds the shared port dependency and flags APPARENT_DIVERSIFICATION', () => {
    const findings = testDimension('port', rawabiLike);
    expect(findings).toHaveLength(1);
    const f = findings[0];
    expect(f.dimension).toBe('port');
    expect(f.sharedValue).toBe('Jebel Ali');
    expect(f.affectedSuppliers.sort()).toEqual(['s1', 's2', 's3']);
    expect(f.affectedSharePct).toBe(78);
    // HHI across both nodes: 78^2 + 22^2 = 6084 + 484 = 6568
    expect(f.hhi).toBe(6568);
    expect(f.dimensionCoverageSharePct).toBe(100);
    expect(f.concentrationBand).toBe('highlyConcentrated');
    expect(f.flag).toBe('APPARENT_DIVERSIFICATION');
    expect(f.isHiddenConcentration).toBe(false);
    // weakest of VALIDATED/DOCUMENTED/CLAIMED is CLAIMED
    expect(f.evidenceStage).toBe('CLAIMED');
  });

  it('does not report a finding for a singleton (no shared value)', () => {
    const suppliers: ConcentrationSupplierInput[] = [
      { supplierId: 's1', name: 'A', capacityOrSpendSharePct: 50, dependencyFacts: { country: { value: 'Saudi Arabia', evidenceStage: 'VALIDATED' } } },
      { supplierId: 's2', name: 'B', capacityOrSpendSharePct: 50, dependencyFacts: { country: { value: 'UAE', evidenceStage: 'VALIDATED' } } },
    ];
    expect(testDimension('country', suppliers)).toEqual([]);
  });

  it('excludes suppliers with no fact for the dimension from grouping, not as zero', () => {
    const suppliers: ConcentrationSupplierInput[] = [
      { supplierId: 's1', name: 'A', capacityOrSpendSharePct: 50, dependencyFacts: { port: { value: 'Jebel Ali', evidenceStage: 'VALIDATED' } } },
      { supplierId: 's2', name: 'B', capacityOrSpendSharePct: 50, dependencyFacts: {} },
    ];
    expect(testDimension('port', suppliers)).toEqual([]);
  });

  it('marks subTier shared-value findings as hidden concentration (diamond structure)', () => {
    const suppliers: ConcentrationSupplierInput[] = [
      { supplierId: 's1', name: 'A', capacityOrSpendSharePct: 50, dependencyFacts: { subTier: { value: 'Resin Co X', evidenceStage: 'DOCUMENTED' } } },
      { supplierId: 's2', name: 'B', capacityOrSpendSharePct: 50, dependencyFacts: { subTier: { value: 'Resin Co X', evidenceStage: 'CLAIMED' } } },
    ];
    const findings = testDimension('subTier', suppliers);
    expect(findings).toHaveLength(1);
    expect(findings[0].isHiddenConcentration).toBe(true);
  });

  it('does not mark hidden concentration for non-subTier dimensions', () => {
    const findings = testDimension('port', rawabiLike);
    expect(findings[0].isHiddenConcentration).toBe(false);
  });

  it('discloses partial dimension coverage when some suppliers have no fact for the dimension (QA-found gap, fixed)', () => {
    const suppliers: ConcentrationSupplierInput[] = [
      { supplierId: 's1', name: 'A', capacityOrSpendSharePct: 40, dependencyFacts: { port: { value: 'Jebel Ali', evidenceStage: 'VALIDATED' } } },
      { supplierId: 's2', name: 'B', capacityOrSpendSharePct: 30, dependencyFacts: { port: { value: 'Jebel Ali', evidenceStage: 'VALIDATED' } } },
      { supplierId: 's3', name: 'C', capacityOrSpendSharePct: 30, dependencyFacts: {} }, // no port fact logged yet
    ];
    const findings = testDimension('port', suppliers);
    expect(findings).toHaveLength(1);
    // coverage is only the 70% that has a port fact -- s3's 30% is not counted as diversified, it's just unknown
    expect(findings[0].dimensionCoverageSharePct).toBe(70);
    expect(findings[0].affectedSharePct).toBe(70);
  });

  it('flags full (100%) coverage when every supplier has a fact for the dimension', () => {
    const findings = testDimension('port', rawabiLike);
    expect(findings[0].dimensionCoverageSharePct).toBe(100);
  });

  it('testAllDimensions aggregates findings across all requested dimensions', () => {
    const suppliers: ConcentrationSupplierInput[] = [
      { supplierId: 's1', name: 'A', capacityOrSpendSharePct: 60, dependencyFacts: { port: { value: 'Jebel Ali', evidenceStage: 'VALIDATED' }, country: { value: 'UAE', evidenceStage: 'VALIDATED' } } },
      { supplierId: 's2', name: 'B', capacityOrSpendSharePct: 40, dependencyFacts: { port: { value: 'Jebel Ali', evidenceStage: 'VALIDATED' }, country: { value: 'Saudi Arabia', evidenceStage: 'VALIDATED' } } },
    ];
    const findings = testAllDimensions(suppliers, ['port', 'country']);
    expect(findings).toHaveLength(1); // only port has a shared value
    expect(findings[0].dimension).toBe('port');
  });
});

describe('filterByKraljicCriticality', () => {
  it('keeps only strategic and bottleneck suppliers, soft-dependency on Module 02', () => {
    const suppliers: ConcentrationSupplierInput[] = [
      { supplierId: 's1', name: 'A', capacityOrSpendSharePct: 25, kraljicQuadrant: 'strategic', dependencyFacts: {} },
      { supplierId: 's2', name: 'B', capacityOrSpendSharePct: 25, kraljicQuadrant: 'leverage', dependencyFacts: {} },
      { supplierId: 's3', name: 'C', capacityOrSpendSharePct: 25, kraljicQuadrant: 'bottleneck', dependencyFacts: {} },
      { supplierId: 's4', name: 'D', capacityOrSpendSharePct: 25, dependencyFacts: {} },
    ];
    expect(filterByKraljicCriticality(suppliers).map((s) => s.supplierId)).toEqual(['s1', 's3']);
  });
});

describe('computeShortfall -- MIT Sheffi TTR/TTS decision rule', () => {
  it('is INSUFFICIENT_DATA (both null) when either input is missing', () => {
    expect(computeShortfall(null, 5)).toEqual({ shortfallWeeks: null, isSurvivable: null });
    expect(computeShortfall(10, null)).toEqual({ shortfallWeeks: null, isSurvivable: null });
    expect(computeShortfall(null, null)).toEqual({ shortfallWeeks: null, isSurvivable: null });
  });

  it('is survivable when TTS >= TTR, with no shortfall reported', () => {
    expect(computeShortfall(10, 10)).toEqual({ shortfallWeeks: null, isSurvivable: true });
    expect(computeShortfall(10, 15)).toEqual({ shortfallWeeks: null, isSurvivable: true });
  });

  it('reports a quantified shortfall window when TTR > TTS', () => {
    expect(computeShortfall(10, 6)).toEqual({ shortfallWeeks: 4, isSurvivable: false });
  });
});

describe('Lock-In Index', () => {
  it('defaults to equal (25%) weighting across the four inputs', () => {
    expect(DEFAULT_LOCK_IN_WEIGHTS).toEqual({
      switchingCost: 0.25, toolingIpOwnership: 0.25, regulatoryReapprovalBurden: 0.25, integrationEffort: 0.25,
    });
  });

  it('computes a weighted composite', () => {
    const score = computeLockInIndex({ switchingCost: 5, toolingIpOwnership: 5, regulatoryReapprovalBurden: 5, integrationEffort: 5 });
    expect(score).toBe(5);
    const zero = computeLockInIndex({ switchingCost: 0, toolingIpOwnership: 0, regulatoryReapprovalBurden: 0, integrationEffort: 0 });
    expect(zero).toBe(0);
  });

  it('honors custom weights', () => {
    const score = computeLockInIndex(
      { switchingCost: 4, toolingIpOwnership: 0, regulatoryReapprovalBurden: 0, integrationEffort: 0 },
      { switchingCost: 1, toolingIpOwnership: 0, regulatoryReapprovalBurden: 0, integrationEffort: 0 },
    );
    expect(score).toBe(4);
  });
});

describe('Supplier Intelligence Debt', () => {
  it('counts facts below VALIDATED as unresolved gaps', () => {
    const facts = [fact({ evidenceStage: 'CLAIMED' }), fact({ evidenceStage: 'DOCUMENTED' }), fact({ evidenceStage: 'VALIDATED' }), fact({ evidenceStage: 'PROVEN' })];
    expect(countUnresolvedEvidenceGaps(facts)).toBe(2);
  });

  it('is null (INSUFFICIENT_DATA) when no per-gap cost has been supplied -- never fabricated', () => {
    expect(computeIntelligenceDebtUSD(5, null)).toBeNull();
  });

  it('multiplies gap count by the client-supplied per-gap cost', () => {
    expect(computeIntelligenceDebtUSD(5, 2000)).toBe(10000);
  });
});

describe('Hidden Concentration / Invisibility Index (n-tier / diamond structure)', () => {
  it('treats zero sub-tier facts as fully unresolved -- the whole share is invisible', () => {
    expect(computeHiddenConcentrationIndex(40, [])).toBe(40);
  });

  it('scales by the proportion of sub-tier facts still stuck at CLAIMED', () => {
    const facts = [fact({ evidenceStage: 'CLAIMED' }), fact({ evidenceStage: 'VALIDATED' })];
    expect(computeHiddenConcentrationIndex(40, facts)).toBe(20); // 1 of 2 claimed -> 40 * 0.5
  });

  it('is zero when all sub-tier facts have moved past CLAIMED', () => {
    const facts = [fact({ evidenceStage: 'VALIDATED' }), fact({ evidenceStage: 'PROVEN' })];
    expect(computeHiddenConcentrationIndex(40, facts)).toBe(0);
  });
});

describe('computeSupplierMetrics + analyzePortfolioConcentration orchestration', () => {
  it('assembles the full per-supplier metrics record', () => {
    const input: SupplierConcentrationMetricsInput = {
      supplierId: 's1',
      timeToRecoverWeeks: 10,
      timeToSurviveWeeks: 6,
      lockIn: { switchingCost: 4, toolingIpOwnership: 3, regulatoryReapprovalBurden: 2, integrationEffort: 3 },
      unresolvedEvidenceGapCount: 3,
      costPerUnresolvedGapUSD: 1500,
      capacityOrSpendSharePct: 30,
      subTierFacts: [fact({ evidenceStage: 'CLAIMED' })],
    };
    const metrics = computeSupplierMetrics(input);
    expect(metrics.supplierId).toBe('s1');
    expect(metrics.shortfallWeeks).toBe(4);
    expect(metrics.isSurvivable).toBe(false);
    expect(metrics.lockInIndex).toBeCloseTo(3.0);
    expect(metrics.intelligenceDebtUSD).toBe(4500);
    expect(metrics.hiddenConcentrationIndex).toBe(30);
  });

  it('handles a supplier with no lock-in data entered yet', () => {
    const metrics = computeSupplierMetrics({
      supplierId: 's2',
      timeToRecoverWeeks: null,
      timeToSurviveWeeks: null,
      lockIn: null,
      unresolvedEvidenceGapCount: 0,
      costPerUnresolvedGapUSD: null,
      capacityOrSpendSharePct: 10,
      subTierFacts: [],
    });
    expect(metrics.lockInIndex).toBeNull();
    expect(metrics.intelligenceDebtUSD).toBeNull();
    expect(metrics.isSurvivable).toBeNull();
  });

  it('analyzePortfolioConcentration ties findings and metrics to a portfolioId', () => {
    const suppliers: ConcentrationSupplierInput[] = [
      { supplierId: 's1', name: 'A', capacityOrSpendSharePct: 60, dependencyFacts: { port: { value: 'Jebel Ali', evidenceStage: 'VALIDATED' } } },
      { supplierId: 's2', name: 'B', capacityOrSpendSharePct: 40, dependencyFacts: { port: { value: 'Jebel Ali', evidenceStage: 'VALIDATED' } } },
    ];
    const metricsInputs: SupplierConcentrationMetricsInput[] = [
      { supplierId: 's1', timeToRecoverWeeks: null, timeToSurviveWeeks: null, lockIn: null, unresolvedEvidenceGapCount: 0, costPerUnresolvedGapUSD: null, capacityOrSpendSharePct: 60, subTierFacts: [] },
    ];
    const result = analyzePortfolioConcentration('rawabi-packaging', suppliers, metricsInputs);
    expect(result.portfolioId).toBe('rawabi-packaging');
    expect(result.commonModeFindings).toHaveLength(1);
    expect(result.metrics).toHaveLength(1);
  });
});

describe('bilingual narrative builders', () => {
  const finding = testDimension('subTier', [
    { supplierId: 's1', name: 'A', capacityOrSpendSharePct: 55, dependencyFacts: { subTier: { value: 'Resin Co X', evidenceStage: 'DOCUMENTED' } } },
    { supplierId: 's2', name: 'B', capacityOrSpendSharePct: 45, dependencyFacts: { subTier: { value: 'Resin Co X', evidenceStage: 'CLAIMED' } } },
  ])[0];

  it('builds an English narrative that names the diamond-structure pattern for hidden concentration', () => {
    const text = buildCommonModeFindingPrompt(finding, false);
    expect(text).toContain('diamond structure');
    expect(text).toContain('Apparent, not real, diversification');
  });

  it('builds an Arabic narrative for the same finding', () => {
    const text = buildCommonModeFindingPrompt(finding, true);
    expect(text).toContain('البنية الماسية');
    expect(text.length).toBeGreaterThan(0);
  });

  it('surfaces a coverage caveat in the narrative when the dimension is not fully covered (QA-found gap, fixed)', () => {
    const suppliers: ConcentrationSupplierInput[] = [
      { supplierId: 's1', name: 'A', capacityOrSpendSharePct: 40, dependencyFacts: { port: { value: 'Jebel Ali', evidenceStage: 'VALIDATED' } } },
      { supplierId: 's2', name: 'B', capacityOrSpendSharePct: 30, dependencyFacts: { port: { value: 'Jebel Ali', evidenceStage: 'VALIDATED' } } },
      { supplierId: 's3', name: 'C', capacityOrSpendSharePct: 30, dependencyFacts: {} },
    ];
    const partialFinding = testDimension('port', suppliers)[0];
    const en = buildCommonModeFindingPrompt(partialFinding, false);
    const ar = buildCommonModeFindingPrompt(partialFinding, true);
    expect(en).toContain('covers 70%');
    expect(ar).toContain('70٪');
  });

  it('omits the coverage caveat when the dimension has full coverage', () => {
    const text = buildCommonModeFindingPrompt(finding, false);
    expect(text).not.toContain('covers');
  });

  it('builds bilingual supplier metrics narratives', () => {
    const metrics = computeSupplierMetrics({
      supplierId: 's1',
      timeToRecoverWeeks: 10,
      timeToSurviveWeeks: 6,
      lockIn: null,
      unresolvedEvidenceGapCount: 0,
      costPerUnresolvedGapUSD: null,
      capacityOrSpendSharePct: 20,
      subTierFacts: [],
    });
    expect(buildSupplierMetricsPrompt(metrics, false)).toContain('4-week shortfall');
    expect(buildSupplierMetricsPrompt(metrics, true)).toContain('فجوة زمنية');
  });
});
