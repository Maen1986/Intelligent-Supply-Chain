import { describe, it, expect } from 'vitest';
import {
  emptyLocalContentInputs, computeBaselineScore, getSectorBenchmark, triage, buildLcgpaPrompt,
  type LocalContentInputs, EXPAT_LABOR_ELIGIBILITY,
} from './lcgpaLocalContent';

function inputs(overrides: Partial<LocalContentInputs> = {}): LocalContentInputs {
  return { ...emptyLocalContentInputs(), ...overrides };
}

describe('computeBaselineScore', () => {
  it('returns hasAnyInput false and a null score for empty inputs', () => {
    const result = computeBaselineScore(emptyLocalContentInputs());
    expect(result.hasAnyInput).toBe(false);
    expect(result.baselineScorePct).toBeNull();
  });

  it('applies the 100% Saudi / 37% expat labor eligibility split', () => {
    expect(EXPAT_LABOR_ELIGIBILITY).toBe(0.37);
    const result = computeBaselineScore(inputs({ saudiCompensationSAR: 100_000, expatCompensationSAR: 100_000 }));
    const labor = result.pillars.find(p => p.key === 'labor')!;
    expect(labor.eligible).toBeCloseTo(100_000 * 1.0 + 100_000 * 0.37);
    expect(labor.total).toBe(200_000);
  });

  it('treats Goods & Services as 100% local / 0% foreign eligible', () => {
    const result = computeBaselineScore(inputs({ localGoodsServicesSpendSAR: 50_000, foreignGoodsServicesSpendSAR: 50_000 }));
    const gs = result.pillars.find(p => p.key === 'goodsServices')!;
    expect(gs.eligible).toBe(50_000);
    expect(gs.total).toBe(100_000);
  });

  it('treats Capacity Building as fully eligible with no partial split', () => {
    const result = computeBaselineScore(inputs({ capacityBuildingSpendSAR: 30_000 }));
    const cb = result.pillars.find(p => p.key === 'capacityBuilding')!;
    expect(cb.eligible).toBe(30_000);
    expect(cb.total).toBe(30_000);
  });

  it('computes the baseline score as a single ratio across all 4 pillars, not a weighted average', () => {
    // Labor: 100 Saudi (100% elig) + 100 expat (37% elig) = 137 elig / 200 total
    // G&S: 200 local (100%) + 0 foreign = 200 elig / 200 total
    // CB: 0
    // D&A: 0
    const result = computeBaselineScore(inputs({
      saudiCompensationSAR: 100, expatCompensationSAR: 100,
      localGoodsServicesSpendSAR: 200, foreignGoodsServicesSpendSAR: 0,
    }));
    // total eligible = 137 + 200 = 337; total spend = 200 + 200 = 400
    expect(result.totalEligible).toBeCloseTo(337);
    expect(result.totalSpend).toBe(400);
    expect(result.baselineScorePct).toBeCloseTo((337 / 400) * 100);
  });

  it('treats negative or NaN figures as zero rather than corrupting the ratio', () => {
    const result = computeBaselineScore(inputs({ saudiCompensationSAR: -50, localGoodsServicesSpendSAR: 100 }));
    expect(result.baselineScorePct).toBe(100); // negative labor figure ignored, only G&S counted
  });
});

describe('getSectorBenchmark', () => {
  const beforePhase1 = '2026-08-28T00:00:00.000Z';
  const afterPhase1 = '2027-06-01T00:00:00.000Z';
  const afterPhase2 = '2028-06-01T00:00:00.000Z';

  it('returns the real MATARAT 39% Hard FM benchmark as always in effect', () => {
    const b = getSectorBenchmark('hardFM', null, beforePhase1);
    expect(b.thresholdPct).toBe(39);
    expect(b.kind).toBe('minimum');
    expect(b.inEffect).toBe(true);
  });

  it('consulting: 30% threshold not yet in effect before 1 Apr 2027 even for large tenders', () => {
    const b = getSectorBenchmark('consulting', 20_000_000, beforePhase1);
    expect(b.thresholdPct).toBe(30);
    expect(b.inEffect).toBe(false);
  });

  it('consulting: 30% threshold in effect for >=SAR10M tenders after 1 Apr 2027', () => {
    const b = getSectorBenchmark('consulting', 20_000_000, afterPhase1);
    expect(b.inEffect).toBe(true);
    expect(b.minTenderValueSAR).toBe(10_000_000);
  });

  it('consulting: SAR5-10M tenders only trigger after the 1 Jan 2028 phase-in, not the 2027 one', () => {
    const notYet = getSectorBenchmark('consulting', 6_000_000, afterPhase1);
    expect(notYet.inEffect).toBe(false);
    const now = getSectorBenchmark('consulting', 6_000_000, afterPhase2);
    expect(now.inEffect).toBe(true);
  });

  it('consulting: below the SAR5M floor has no sourced rule in effect regardless of date', () => {
    const b = getSectorBenchmark('consulting', 1_000_000, afterPhase2);
    expect(b.inEffect).toBe(false);
  });

  it('itServices: weighting-only, no minimum threshold, in effect only for >=SAR10M after 1 Apr 2027', () => {
    const b = getSectorBenchmark('itServices', 15_000_000, afterPhase1);
    expect(b.kind).toBe('weightingOnly');
    expect(b.thresholdPct).toBeNull();
    expect(b.inEffect).toBe(true);
  });

  it('other: returns an explicitly unsourced benchmark', () => {
    const b = getSectorBenchmark('other', null, beforePhase1);
    expect(b.kind).toBe('unsourced');
    expect(b.thresholdPct).toBeNull();
  });
});

describe('triage', () => {
  it('returns incomplete when the baseline score has not been computed yet', () => {
    const baseline = computeBaselineScore(emptyLocalContentInputs());
    const benchmark = getSectorBenchmark('hardFM', null, '2026-08-28T00:00:00.000Z');
    const result = triage(baseline, benchmark, null);
    expect(result.verdict).toBe('incomplete');
  });

  it('flags clears when the baseline score meets or exceeds the threshold', () => {
    const baseline = computeBaselineScore(inputs({ saudiCompensationSAR: 100, localGoodsServicesSpendSAR: 100 }));
    const benchmark = getSectorBenchmark('hardFM', null, '2026-08-28T00:00:00.000Z');
    const result = triage(baseline, benchmark, null);
    expect(result.verdict).toBe('clears');
    expect(result.gapPct).toBe(0);
  });

  it('flags gap with the correct point difference when below threshold', () => {
    const baseline = computeBaselineScore(inputs({ saudiCompensationSAR: 20, foreignGoodsServicesSpendSAR: 80 }));
    // eligible = 20, total = 100 -> 20%
    const benchmark = getSectorBenchmark('hardFM', null, '2026-08-28T00:00:00.000Z'); // 39%
    const result = triage(baseline, benchmark, null);
    expect(result.verdict).toBe('gap');
    expect(result.gapPct).toBeCloseTo(19);
  });

  it('flags weightingOnly for IT services with no custom threshold entered', () => {
    const baseline = computeBaselineScore(inputs({ saudiCompensationSAR: 50 }));
    const benchmark = getSectorBenchmark('itServices', 15_000_000, '2027-06-01T00:00:00.000Z');
    const result = triage(baseline, benchmark, null);
    expect(result.verdict).toBe('weightingOnly');
  });

  it('a custom threshold overrides a weightingOnly sector benchmark', () => {
    const baseline = computeBaselineScore(inputs({ saudiCompensationSAR: 20, foreignGoodsServicesSpendSAR: 80 }));
    const benchmark = getSectorBenchmark('itServices', 15_000_000, '2027-06-01T00:00:00.000Z');
    const result = triage(baseline, benchmark, 25);
    expect(result.verdict).toBe('gap');
    expect(result.effectiveThresholdPct).toBe(25);
  });

  it('flags notYetInEffect for a phased minimum whose date has not arrived', () => {
    const baseline = computeBaselineScore(inputs({ saudiCompensationSAR: 50 }));
    const benchmark = getSectorBenchmark('consulting', 20_000_000, '2026-08-28T00:00:00.000Z');
    const result = triage(baseline, benchmark, null);
    expect(result.verdict).toBe('notYetInEffect');
  });

  it('flags noBenchmark for the "other" sector with no custom threshold entered', () => {
    const baseline = computeBaselineScore(inputs({ saudiCompensationSAR: 50 }));
    const benchmark = getSectorBenchmark('other', null, '2026-08-28T00:00:00.000Z');
    const result = triage(baseline, benchmark, null);
    expect(result.verdict).toBe('noBenchmark');
  });
});

describe('buildLcgpaPrompt', () => {
  it('includes the score, verdict reason, and source note in English', () => {
    const baseline = computeBaselineScore(inputs({ saudiCompensationSAR: 20, foreignGoodsServicesSpendSAR: 80 }));
    const benchmark = getSectorBenchmark('hardFM', null, '2026-08-28T00:00:00.000Z');
    const result = triage(baseline, benchmark, null);
    const prompt = buildLcgpaPrompt(baseline, benchmark, result, false);
    expect(prompt).toContain('20.0%');
    expect(prompt).toContain('MATARAT');
  });

  it('renders in Arabic when isAr is true', () => {
    const baseline = computeBaselineScore(inputs({ saudiCompensationSAR: 20 }));
    const benchmark = getSectorBenchmark('hardFM', null, '2026-08-28T00:00:00.000Z');
    const result = triage(baseline, benchmark, null);
    const prompt = buildLcgpaPrompt(baseline, benchmark, result, true);
    expect(prompt).toContain('جاهزية المحتوى المحلي');
  });
});
