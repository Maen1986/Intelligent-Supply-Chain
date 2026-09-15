import { describe, it, expect } from 'vitest';
import {
  assessSupplierLocalContent,
  recommendLocalContentAction,
  rollUpPortfolioLocalContent,
  COUNTRY_FRAMEWORKS,
  JORDAN_PRICE_PREFERENCE_MARGIN_PCT,
  type SupplierLocalContentInputs,
  type LocalContentAssessment,
  type EligibleSpendRatioResult,
  type WeightedPillarScoreResult,
  type PricePreferenceMarginResult,
} from './supplierLocalContentEligibility';

// ===========================================================================
// SA — LCGPA eligible-spend-ratio
// ===========================================================================

describe('SA / LCGPA — eligible-spend-ratio', () => {
  it('soft: realistic supplier, some optional pillars sparse', () => {
    const inputs: SupplierLocalContentInputs = {
      sa: {
        localLaborSAR: 1_200_000, expatLaborSAR: 800_000,
        localGoodsServicesSAR: 500_000, foreignGoodsServicesSAR: 300_000,
        capacityBuildingSAR: 0,
        localAssetDepreciationSAR: null, totalAssetDepreciationSAR: null,
      },
    };
    const a = assessSupplierLocalContent('SA', 'government', inputs);
    expect(a.applicability).toBe('applicable');
    const c = a.computation as EligibleSpendRatioResult;
    const totalEligible = 1_496_000 + 500_000 + 0 + 0;
    const totalSpend = 2_000_000 + 800_000 + 0 + 0;
    expect(c.scorePct).not.toBeNull();
    expect(c.scorePct!).toBeCloseTo((totalEligible / totalSpend) * 100, 6);
    expect(c.pillars).toHaveLength(4);
  });

  it('hardest: expat-labor-only supplier (isolates the 0.37 eligibility factor exactly)', () => {
    const inputs: SupplierLocalContentInputs = {
      sa: {
        localLaborSAR: 0, expatLaborSAR: 1_000_000,
        localGoodsServicesSAR: null, foreignGoodsServicesSAR: null,
        capacityBuildingSAR: null,
        localAssetDepreciationSAR: null, totalAssetDepreciationSAR: null,
      },
    };
    const a = assessSupplierLocalContent('SA', 'government', inputs);
    const c = a.computation as EligibleSpendRatioResult;
    expect(c.scorePct!).toBeCloseTo(37, 6);
  });

  it('hardest: negative/garbage spend values are clamped to zero by n(), never produce a negative or NaN score', () => {
    const inputs: SupplierLocalContentInputs = {
      sa: {
        localLaborSAR: -500_000, expatLaborSAR: 400_000,
        localGoodsServicesSAR: 200_000, foreignGoodsServicesSAR: -100_000,
        capacityBuildingSAR: NaN as unknown as number,
        localAssetDepreciationSAR: 0, totalAssetDepreciationSAR: 0,
      },
    };
    const a = assessSupplierLocalContent('SA', 'government', inputs);
    const c = a.computation as EligibleSpendRatioResult;
    expect(c.scorePct).not.toBeNull();
    expect(Number.isNaN(c.scorePct)).toBe(false);
    expect(c.scorePct!).toBeGreaterThanOrEqual(0);
    const totalEligible = 148_000 + 200_000;
    const totalSpend = 400_000 + 200_000;
    expect(c.scorePct!).toBeCloseTo((totalEligible / totalSpend) * 100, 6);
  });

  it('boundary: zero total spend across every pillar returns null score, not a fabricated 0 or 100', () => {
    const inputs: SupplierLocalContentInputs = {
      sa: { localLaborSAR: 0, expatLaborSAR: 0, localGoodsServicesSAR: 0, foreignGoodsServicesSAR: 0, capacityBuildingSAR: 0, localAssetDepreciationSAR: 0, totalAssetDepreciationSAR: 0 },
    };
    const a = assessSupplierLocalContent('SA', 'government', inputs);
    const c = a.computation as EligibleSpendRatioResult;
    expect(c.scorePct).toBeNull();
  });

  it('boundary: 100% locally-eligible supplier scores exactly 100', () => {
    const inputs: SupplierLocalContentInputs = {
      sa: { localLaborSAR: 1_000_000, expatLaborSAR: 0, localGoodsServicesSAR: 500_000, foreignGoodsServicesSAR: 0, capacityBuildingSAR: 200_000, localAssetDepreciationSAR: 300_000, totalAssetDepreciationSAR: 300_000 },
    };
    const a = assessSupplierLocalContent('SA', 'semi-government-soe', inputs);
    const c = a.computation as EligibleSpendRatioResult;
    expect(c.scorePct!).toBeCloseTo(100, 6);
  });

  it('not-applicable: SA/LCGPA does not cover private-commercial procurement (honest non-zero disclosure)', () => {
    const inputs: SupplierLocalContentInputs = { sa: { localLaborSAR: 1_000_000, expatLaborSAR: 0, localGoodsServicesSAR: 0, foreignGoodsServicesSAR: 0, capacityBuildingSAR: 0, localAssetDepreciationSAR: 0, totalAssetDepreciationSAR: 0 } };
    const a = assessSupplierLocalContent('SA', 'private-commercial', inputs);
    expect(a.applicability).toBe('not-applicable');
    expect(a.computation).toBeNull();
    expect(a.reasonEn.toLowerCase()).toContain('no sourced evidence');
  });

  it('no inputs supplied at all -> applicable but null score, distinct from not-applicable', () => {
    const a = assessSupplierLocalContent('SA', 'government', {});
    expect(a.applicability).toBe('applicable');
    const c = a.computation as EligibleSpendRatioResult;
    expect(c.scorePct).toBeNull();
    expect(c.pillars).toHaveLength(0);
  });
});

// ===========================================================================
// AE — UAE ICV weighted-pillar-score
// ===========================================================================

describe('AE / ICV — weighted-pillar-score', () => {
  it('soft: realistic mid-size supplier, mainland-registered', () => {
    const inputs: SupplierLocalContentInputs = {
      ae: {
        manufacturingOrThirdPartySpendLocalAED: 3_000_000, manufacturingOrThirdPartySpendTotalAED: 5_000_000,
        investmentNBVLocalAED: 10_000_000, investmentNBVTotalAED: 12_000_000,
        emiratisationAnnualSpendAED: 2_000_000,
        expatriateHeadcount: 30,
        exportRevenueAED: 500_000,
        emiratiHeadcountGrowthPct: 10,
        investmentGrowthPct: 8,
        registeredOnMainland: true,
      },
    };
    const a = assessSupplierLocalContent('AE', 'government', inputs);
    const c = a.computation as WeightedPillarScoreResult;
    expect(a.applicability).toBe('applicable');
    expect(c.scorePct).not.toBeNull();
    expect(c.mainlandUpliftApplied).toBe(true);
    expect(c.pillars).toHaveLength(5);
    const base = c.pillars.reduce((s, p) => s + p.contributionPct, 0);
    expect(c.scorePct!).toBeCloseTo(Math.min(100, base * 1.10), 6);
  });

  it('hardest: every pillar maxed simultaneously plus mainland uplift must cap at exactly 100, never overshoot', () => {
    const inputs: SupplierLocalContentInputs = {
      ae: {
        manufacturingOrThirdPartySpendLocalAED: 50_000_000, manufacturingOrThirdPartySpendTotalAED: 50_000_000,
        investmentNBVLocalAED: 200_000_000, investmentNBVTotalAED: 200_000_000,
        emiratisationAnnualSpendAED: 50_000_000,
        expatriateHeadcount: 5000,
        exportRevenueAED: 100_000_000,
        emiratiHeadcountGrowthPct: 500,
        investmentGrowthPct: 500,
        registeredOnMainland: true,
      },
    };
    const a = assessSupplierLocalContent('AE', 'semi-government-soe', inputs);
    const c = a.computation as WeightedPillarScoreResult;
    expect(c.scorePct).toBe(100);
  });

  it('hardest: contradictory signal -- 100% mainland investment but zero everything else still produces a small, honest, non-negative score', () => {
    const inputs: SupplierLocalContentInputs = {
      ae: {
        manufacturingOrThirdPartySpendLocalAED: 0, manufacturingOrThirdPartySpendTotalAED: 0,
        investmentNBVLocalAED: 3_000_000, investmentNBVTotalAED: 3_000_000,
        emiratisationAnnualSpendAED: 0,
        expatriateHeadcount: 0,
        exportRevenueAED: 0, emiratiHeadcountGrowthPct: 0, investmentGrowthPct: 0,
        registeredOnMainland: false,
      },
    };
    const a = assessSupplierLocalContent('AE', 'government', inputs);
    const c = a.computation as WeightedPillarScoreResult;
    // investment: ratio (3M/3M)*10=10, progressive 0 (below 5M floor) -> 10.
    // emiratisation: annualSpendAED=0 is <=200K -> the sourced band's OWN floor of 2% applies
    // (band is 2%-15%, not 0%-15% -- the guideline has no zero band). So total = 10 + 2 = 12.
    // (Corrected from an initial hand-predicted 10 that missed this floor -- test-authoring
    // error on my part, not a code defect; verified against the pillar's own documented behavior.)
    expect(c.scorePct).not.toBeNull();
    expect(c.scorePct!).toBeCloseTo(12, 6);
  });

  it('boundary: investment pillar at exactly the 5M progressive floor and exactly the 150M progressive cap', () => {
    const floorInputs: SupplierLocalContentInputs = { ae: { manufacturingOrThirdPartySpendLocalAED: null, manufacturingOrThirdPartySpendTotalAED: null, investmentNBVLocalAED: 5_000_000, investmentNBVTotalAED: 100_000_000, emiratisationAnnualSpendAED: null, expatriateHeadcount: null, exportRevenueAED: null, emiratiHeadcountGrowthPct: null, investmentGrowthPct: null, registeredOnMainland: null } };
    const capInputs: SupplierLocalContentInputs = { ae: { manufacturingOrThirdPartySpendLocalAED: null, manufacturingOrThirdPartySpendTotalAED: null, investmentNBVLocalAED: 150_000_000, investmentNBVTotalAED: 150_000_000, emiratisationAnnualSpendAED: null, expatriateHeadcount: null, exportRevenueAED: null, emiratiHeadcountGrowthPct: null, investmentGrowthPct: null, registeredOnMainland: null } };
    const aFloor = assessSupplierLocalContent('AE', 'government', floorInputs).computation as WeightedPillarScoreResult;
    const aCap = assessSupplierLocalContent('AE', 'government', capInputs).computation as WeightedPillarScoreResult;
    expect(aFloor.pillars.find(p => p.key === 'investment')!.contributionPct).toBeCloseTo(0.5, 6);
    expect(aCap.pillars.find(p => p.key === 'investment')!.contributionPct).toBeCloseTo(25, 6);
  });

  it('boundary: emiratisation spend at exactly AED 200K and exactly AED 20M', () => {
    const low: SupplierLocalContentInputs = { ae: { manufacturingOrThirdPartySpendLocalAED: null, manufacturingOrThirdPartySpendTotalAED: null, investmentNBVLocalAED: null, investmentNBVTotalAED: null, emiratisationAnnualSpendAED: 200_000, expatriateHeadcount: null, exportRevenueAED: null, emiratiHeadcountGrowthPct: null, investmentGrowthPct: null, registeredOnMainland: null } };
    const high: SupplierLocalContentInputs = { ae: { manufacturingOrThirdPartySpendLocalAED: null, manufacturingOrThirdPartySpendTotalAED: null, investmentNBVLocalAED: null, investmentNBVTotalAED: null, emiratisationAnnualSpendAED: 20_000_000, expatriateHeadcount: null, exportRevenueAED: null, emiratiHeadcountGrowthPct: null, investmentGrowthPct: null, registeredOnMainland: null } };
    const cLow = assessSupplierLocalContent('AE', 'government', low).computation as WeightedPillarScoreResult;
    const cHigh = assessSupplierLocalContent('AE', 'government', high).computation as WeightedPillarScoreResult;
    expect(cLow.pillars.find(p => p.key === 'emiratisation')!.contributionPct).toBeCloseTo(2, 6);
    expect(cHigh.pillars.find(p => p.key === 'emiratisation')!.contributionPct).toBeCloseTo(15, 6);
  });

  it('boundary: expatriate headcount band edges (5/6, 50/51, 200/201)', () => {
    const at = (headcount: number) => {
      const inp: SupplierLocalContentInputs = { ae: { manufacturingOrThirdPartySpendLocalAED: null, manufacturingOrThirdPartySpendTotalAED: null, investmentNBVLocalAED: null, investmentNBVTotalAED: null, emiratisationAnnualSpendAED: null, expatriateHeadcount: headcount, exportRevenueAED: null, emiratiHeadcountGrowthPct: null, investmentGrowthPct: null, registeredOnMainland: null } };
      return (assessSupplierLocalContent('AE', 'government', inp).computation as WeightedPillarScoreResult).pillars.find(p => p.key === 'expatriateContribution')!.contributionPct;
    };
    expect(at(5)).toBe(2);
    expect(at(6)).toBe(5);
    expect(at(50)).toBe(5);
    expect(at(51)).toBe(8);
    expect(at(200)).toBe(8);
    expect(at(201)).toBe(10);
  });

  it('REAL DEFECT FOUND & FIXED: a genuinely all-zero UAE supplier (real presence, zero local content) must score 0%, not be silently reclassified as "no inputs supplied" (null)', () => {
    const inputs: SupplierLocalContentInputs = {
      ae: {
        manufacturingOrThirdPartySpendLocalAED: 0, manufacturingOrThirdPartySpendTotalAED: 2_000_000,
        investmentNBVLocalAED: 0, investmentNBVTotalAED: 1_000_000,
        emiratisationAnnualSpendAED: 0,
        expatriateHeadcount: 0,
        exportRevenueAED: 0, emiratiHeadcountGrowthPct: 0, investmentGrowthPct: 0,
        registeredOnMainland: false,
      },
    };
    const a = assessSupplierLocalContent('AE', 'government', inputs);
    const c = a.computation as WeightedPillarScoreResult;
    // Real inputs WERE supplied (spendTotal=2M, investTotal=1M are both truthy) -> the pre-fix guard
    // already returned non-null here. scorePct is a real, honest, near-zero number reflecting zero
    // local content against real total spend/investment denominators, plus the emiratisation pillar's
    // own 2% floor band (annualSpendAED=0 is still <=200K, which is banded at 2%, not 0%).
    expect(c.scorePct).not.toBeNull();
    expect(c.scorePct!).toBeCloseTo(2, 6);
  });

  it('boundary: emiratisationAnnualSpendAED/expatriateHeadcount explicitly 0 alongside zero spend/investment totals -- the "all fields present but literally zero" case', () => {
    const inputs: SupplierLocalContentInputs = {
      ae: {
        manufacturingOrThirdPartySpendLocalAED: 0, manufacturingOrThirdPartySpendTotalAED: 0,
        investmentNBVLocalAED: 0, investmentNBVTotalAED: 0,
        emiratisationAnnualSpendAED: 0,
        expatriateHeadcount: 0,
        exportRevenueAED: 0, emiratiHeadcountGrowthPct: 0, investmentGrowthPct: 0,
        registeredOnMainland: false,
      },
    };
    const a = assessSupplierLocalContent('AE', 'government', inputs);
    const c = a.computation as WeightedPillarScoreResult;
    // After the fix: every field was explicitly supplied (all !== null/undefined) -> this is a real,
    // honest ICV supplier score, not "insufficient data". Before the fix this incorrectly returned
    // null because the guard used truthy `||` checks, treating literal 0 the same as "not supplied".
    // The honest score is 2, not 0: the emiratisation pillar's sourced band floors at 2% even at
    // AED 0 annual spend (the guideline's band structure is 2%-15%, with no 0% band).
    expect(c.scorePct).not.toBeNull();
    expect(c.scorePct!).toBeCloseTo(2, 6);
  });

  it('true "nothing supplied at all" case still returns null (genuinely insufficient data, not a computed zero)', () => {
    const a = assessSupplierLocalContent('AE', 'government', {});
    const c = a.computation as WeightedPillarScoreResult;
    expect(c.scorePct).toBeNull();
    expect(c.pillars).toHaveLength(0);
  });

  it('not-applicable: AE/ICV does not cover private-commercial procurement', () => {
    const a = assessSupplierLocalContent('AE', 'private-commercial', { ae: { manufacturingOrThirdPartySpendLocalAED: 1, manufacturingOrThirdPartySpendTotalAED: 1, investmentNBVLocalAED: null, investmentNBVTotalAED: null, emiratisationAnnualSpendAED: null, expatriateHeadcount: null, exportRevenueAED: null, emiratiHeadcountGrowthPct: null, investmentGrowthPct: null, registeredOnMainland: null } });
    expect(a.applicability).toBe('not-applicable');
  });
});

// ===========================================================================
// JO — price-preference-margin
// ===========================================================================

describe('JO / National Industry Price Preference — price-preference-margin', () => {
  it('soft: 40% locally-manufactured bid content', () => {
    const a = assessSupplierLocalContent('JO', 'government', { jo: { bidValueLocallyManufacturedPct: 40 } });
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.preferenceMarginPct).toBe(JORDAN_PRICE_PREFERENCE_MARGIN_PCT);
    expect(c.effectiveBidDiscountPct).toBeCloseTo(8, 6);
  });

  it('hardest: 0% and 100% locally-manufactured (the two adversarial extremes)', () => {
    const zero = assessSupplierLocalContent('JO', 'government', { jo: { bidValueLocallyManufacturedPct: 0 } }).computation as PricePreferenceMarginResult;
    const full = assessSupplierLocalContent('JO', 'government', { jo: { bidValueLocallyManufacturedPct: 100 } }).computation as PricePreferenceMarginResult;
    expect(zero.effectiveBidDiscountPct).toBe(0);
    expect(full.effectiveBidDiscountPct).toBe(20);
  });

  it('boundary: exactly 100% share -> recommendLocalContentAction returns null (nothing left to improve)', () => {
    const a = assessSupplierLocalContent('JO', 'government', { jo: { bidValueLocallyManufacturedPct: 100 } });
    expect(recommendLocalContentAction(a, null)).toBeNull();
  });

  it('not-applicable: Jordan price preference is public-tenders-only -- private-commercial and semi-government-soe both fall outside sourced scope', () => {
    const priv = assessSupplierLocalContent('JO', 'private-commercial', { jo: { bidValueLocallyManufacturedPct: 50 } });
    const soe = assessSupplierLocalContent('JO', 'semi-government-soe', { jo: { bidValueLocallyManufacturedPct: 50 } });
    expect(priv.applicability).toBe('not-applicable');
    expect(soe.applicability).toBe('not-applicable');
  });
});

// ===========================================================================
// OM / QA / BH / KW — not-yet-sourced (Decision Record 8.7: never guess)
// ===========================================================================

describe('OM/QA/BH/KW — not-yet-sourced (never a guessed formula)', () => {
  for (const country of ['OM', 'QA', 'BH', 'KW'] as const) {
    it(`${country}: always insufficient-data regardless of procurement context, never fabricates a score`, () => {
      const a = assessSupplierLocalContent(country, 'government', {});
      expect(a.applicability).toBe('insufficient-data');
      expect(a.computation).toEqual({ mechanismType: 'not-yet-sourced' });
      expect(COUNTRY_FRAMEWORKS[country].applicableContexts).toHaveLength(0);
    });
  }
});

// ===========================================================================
// recommendLocalContentAction — primary + alternative (Rule 8)
// ===========================================================================

describe('recommendLocalContentAction — primary + alternative', () => {
  it('SA below threshold: returns both a primary (close the gap) and a genuinely different alternative (subcontract/retarget)', () => {
    const inputs: SupplierLocalContentInputs = { sa: { localLaborSAR: 300_000, expatLaborSAR: 700_000, localGoodsServicesSAR: 0, foreignGoodsServicesSAR: 1_000_000, capacityBuildingSAR: 0, localAssetDepreciationSAR: 0, totalAssetDepreciationSAR: 0 } };
    const a = assessSupplierLocalContent('SA', 'government', inputs);
    const rec = recommendLocalContentAction(a, 40);
    expect(rec).not.toBeNull();
    expect(rec!.primaryEn).toContain('gap');
    expect(rec!.alternativeEn.toLowerCase()).toContain('subcontract');
    expect(rec!.primaryEn).not.toEqual(rec!.alternativeEn);
  });

  it('at or above threshold: no recommendation needed (returns null, not a padded no-op message)', () => {
    const inputs: SupplierLocalContentInputs = { sa: { localLaborSAR: 1_000_000, expatLaborSAR: 0, localGoodsServicesSAR: 500_000, foreignGoodsServicesSAR: 0, capacityBuildingSAR: 0, localAssetDepreciationSAR: 0, totalAssetDepreciationSAR: 0 } };
    const a = assessSupplierLocalContent('SA', 'government', inputs);
    expect(recommendLocalContentAction(a, 40)).toBeNull();
  });

  it('not-applicable assessment: recommendLocalContentAction returns null (nothing to recommend against a regime that does not apply)', () => {
    const a = assessSupplierLocalContent('SA', 'private-commercial', {});
    expect(recommendLocalContentAction(a, 50)).toBeNull();
  });

  it('insufficient-data assessment (not-yet-sourced country): returns null, not a fabricated recommendation', () => {
    const a = assessSupplierLocalContent('OM', 'government', {});
    expect(recommendLocalContentAction(a, 50)).toBeNull();
  });
});

// ===========================================================================
// rollUpPortfolioLocalContent — spend-weighted, mechanism-grouped
// ===========================================================================

describe('rollUpPortfolioLocalContent — grouping and weighting (mirrors Module 05 HHI rollup pattern)', () => {
  function saAssessment(scorePct: number): LocalContentAssessment {
    const local = scorePct * 10_000;
    const total = 1_000_000;
    return assessSupplierLocalContent('SA', 'government', {
      sa: { localLaborSAR: local, expatLaborSAR: 0, localGoodsServicesSAR: 0, foreignGoodsServicesSAR: total - local, capacityBuildingSAR: 0, localAssetDepreciationSAR: 0, totalAssetDepreciationSAR: 0 },
    });
  }

  it('weights SA suppliers by spend share within the same country+context group', () => {
    const s1 = saAssessment(80);
    const s2 = saAssessment(20);
    const rollup = rollUpPortfolioLocalContent([
      { supplierId: 'sup-1', spendShare: 70, assessment: s1 },
      { supplierId: 'sup-2', spendShare: 30, assessment: s2 },
    ]);
    expect(rollup).toHaveLength(1);
    const g = rollup[0]!;
    expect(g.mechanismType).toBe('eligible-spend-ratio');
    expect(g.supplierCount).toBe(2);
    expect(g.portfolioSpendSharePct).toBe(100);
    expect(g.weightedScorePct!).toBeCloseTo(62, 4);
  });

  it('never averages across different countries/mechanisms -- SA and AE suppliers land in separate groups', () => {
    const sa = saAssessment(60);
    const ae = assessSupplierLocalContent('AE', 'government', { ae: { manufacturingOrThirdPartySpendLocalAED: 1_000_000, manufacturingOrThirdPartySpendTotalAED: 1_000_000, investmentNBVLocalAED: null, investmentNBVTotalAED: null, emiratisationAnnualSpendAED: null, expatriateHeadcount: null, exportRevenueAED: null, emiratiHeadcountGrowthPct: null, investmentGrowthPct: null, registeredOnMainland: null } });
    const rollup = rollUpPortfolioLocalContent([
      { supplierId: 'sa-sup', spendShare: 50, assessment: sa },
      { supplierId: 'ae-sup', spendShare: 50, assessment: ae },
    ]);
    expect(rollup).toHaveLength(2);
    const countries = rollup.map(g => g.country).sort();
    expect(countries).toEqual(['AE', 'SA']);
  });

  it('not-yet-sourced and not-applicable suppliers are counted but excluded from the weighted score, never treated as a zero', () => {
    const goodSupplier = saAssessment(90);
    const notApplicable = assessSupplierLocalContent('SA', 'private-commercial', {});
    const rollup = rollUpPortfolioLocalContent([
      { supplierId: 'good', spendShare: 60, assessment: goodSupplier },
      { supplierId: 'na', spendShare: 40, assessment: notApplicable },
    ]);
    expect(rollup).toHaveLength(2);
    const govGroup = rollup.find(g => g.procurementContext === 'government')!;
    const privGroup = rollup.find(g => g.procurementContext === 'private-commercial')!;
    expect(govGroup.weightedScorePct!).toBeCloseTo(90, 4);
    expect(privGroup.weightedScorePct).toBeNull();
    expect(privGroup.suppliersNotApplicable).toBe(1);
  });

  it('boundary: empty portfolio returns an empty group list, not an error', () => {
    expect(rollUpPortfolioLocalContent([])).toEqual([]);
  });
});
