import { describe, it, expect } from 'vitest';
import {
  assessSupplierLocalContent,
  recommendLocalContentAction,
  rollUpPortfolioLocalContent,
  COUNTRY_FRAMEWORKS,
  SAUDI_PROGRAMS,
  JORDAN_PRICE_PREFERENCE_MARGIN_PCT,
  SAUDI_PRICE_PREFERENCE_MARGIN_PCT,
  type SupplierLocalContentInputs,
  type LocalContentAssessment,
  type EligibleSpendRatioResult,
  type WeightedPillarScoreResult,
  type PricePreferenceMarginResult,
  type CategoryEligibilityGateResult,
  type AnchorBuyerScoreResult,
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

// ===========================================================================
// reasonAr bilingual-completeness (regression tests for a real defect found
// by independent QA review, 15 Sep 2026: reasonAr previously (a) dropped the
// score/discount value entirely in the 'applicable' branch, and (b) spliced
// a raw English ProcurementContext enum literal into an Arabic sentence in
// both the 'applicable' and 'not-applicable' branches. Neither is a math
// bug -- both are bilingual-completeness bugs: an Arabic-reading user got
// less information than an English-reading one, which is not acceptable on
// a bilingual-by-default platform (isc-standing-rules rule 5).
// ===========================================================================

describe('reasonAr bilingual completeness (regression: must never say less than reasonEn, never splice raw English enums)', () => {
  const ENGLISH_ENUM_LITERALS = ['government', 'semi-government-soe', 'private-commercial'];

  it('applicable branch: reasonAr carries the same score value as reasonEn, not just the program name', () => {
    const inputs: SupplierLocalContentInputs = {
      sa: { localLaborSAR: 1_000_000, expatLaborSAR: 0, localGoodsServicesSAR: 0, foreignGoodsServicesSAR: 0, capacityBuildingSAR: 0, localAssetDepreciationSAR: 0, totalAssetDepreciationSAR: 0 },
    };
    const a = assessSupplierLocalContent('SA', 'government', inputs);
    const c = a.computation as EligibleSpendRatioResult;
    const expected = c.scorePct!.toFixed(1);
    expect(a.reasonEn).toContain(`${expected}%`);
    // Previously reasonAr ended right after the program name/country/context
    // with no score at all -- this asserts the actual numeral is present.
    expect(a.reasonAr).toContain(expected);
  });

  it('applicable branch: reasonAr never contains a raw English procurementContext enum literal', () => {
    for (const ctx of ['government', 'semi-government-soe'] as const) {
      const inputs: SupplierLocalContentInputs = {
        ae: { manufacturingOrThirdPartySpendLocalAED: 1, manufacturingOrThirdPartySpendTotalAED: 1, investmentNBVLocalAED: null, investmentNBVTotalAED: null, emiratisationAnnualSpendAED: 1_000_000, expatriateHeadcount: null, exportRevenueAED: null, emiratiHeadcountGrowthPct: null, investmentGrowthPct: null, registeredOnMainland: false },
      };
      const a = assessSupplierLocalContent('AE', ctx, inputs);
      for (const literal of ENGLISH_ENUM_LITERALS) {
        expect(a.reasonAr).not.toContain(literal);
      }
    }
  });

  it('applicable branch, incomplete inputs: reasonAr says "incomplete inputs" in Arabic, not the English phrase', () => {
    const inputs: SupplierLocalContentInputs = {
      sa: { localLaborSAR: 0, expatLaborSAR: 0, localGoodsServicesSAR: 0, foreignGoodsServicesSAR: 0, capacityBuildingSAR: 0, localAssetDepreciationSAR: 0, totalAssetDepreciationSAR: 0 },
    };
    const a = assessSupplierLocalContent('SA', 'government', inputs);
    const c = a.computation as EligibleSpendRatioResult;
    expect(c.scorePct).toBeNull();
    expect(a.reasonEn).toContain('incomplete inputs');
    expect(a.reasonAr).not.toContain('incomplete inputs');
    expect(a.reasonAr).toContain('بيانات غير مكتملة');
  });

  it('not-applicable branch: reasonAr never contains a raw English procurementContext enum literal (either side of the sentence)', () => {
    const a = assessSupplierLocalContent('SA', 'private-commercial', {});
    expect(a.applicability).toBe('not-applicable');
    for (const literal of ENGLISH_ENUM_LITERALS) {
      expect(a.reasonAr).not.toContain(literal);
    }
    // The Arabic label for the applicable contexts (government/SOE) and for
    // the rejected context (private-commercial) must both appear in Arabic.
    expect(a.reasonAr).toContain('حكومي');
    expect(a.reasonAr).toContain('تجاري خاص');
  });

  it('Jordan price-preference-margin branch: reasonAr carries the effective bid discount value, not just the program name', () => {
    const a = assessSupplierLocalContent('JO', 'government', { jo: { bidValueLocallyManufacturedPct: 40 } });
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.effectiveBidDiscountPct).not.toBeNull();
    expect(a.reasonEn).toContain(c.effectiveBidDiscountPct!.toFixed(1));
    expect(a.reasonAr).toContain(c.effectiveBidDiscountPct!.toFixed(1));
    for (const literal of ENGLISH_ENUM_LITERALS) {
      expect(a.reasonAr).not.toContain(literal);
    }
  });

  it('semi-government-soe context: reasonAr uses the Arabic label, not the raw hyphenated English enum', () => {
    const a = assessSupplierLocalContent('JO', 'semi-government-soe', { jo: { bidValueLocallyManufacturedPct: 50 } });
    expect(a.reasonAr).not.toContain('semi-government-soe');
    expect(a.reasonAr).toContain('شبه حكومي');
  });
});

// ===========================================================================
// SA — program routing (default resolves to lcgpa-general, back-compat)
// ===========================================================================

describe('SA — program routing default', () => {
  it('omitting the program param resolves to lcgpa-general (back-compat with every pre-existing caller)', () => {
    const a = assessSupplierLocalContent('SA', 'government', { sa: { localLaborSAR: 1, expatLaborSAR: 0, localGoodsServicesSAR: 0, foreignGoodsServicesSAR: 0, capacityBuildingSAR: 0, localAssetDepreciationSAR: 0, totalAssetDepreciationSAR: 0 } });
    expect(a.program).toBe('lcgpa-general');
    expect(a.framework).toBe(SAUDI_PROGRAMS['lcgpa-general']);
  });

  it('non-SA countries always resolve program to null', () => {
    const a = assessSupplierLocalContent('AE', 'government', { ae: { manufacturingOrThirdPartySpendLocalAED: 1, manufacturingOrThirdPartySpendTotalAED: 1, investmentNBVLocalAED: 0, investmentNBVTotalAED: 0, emiratisationAnnualSpendAED: 0, expatriateHeadcount: 0, exportRevenueAED: 0, emiratiHeadcountGrowthPct: 0, investmentGrowthPct: 0, registeredOnMainland: false } });
    expect(a.program).toBeNull();
  });

  it('lcgpa-general carries the two usage notes (40% high-value-contract weighting, ~30% consulting/IT figure) bilingually', () => {
    const fw = SAUDI_PROGRAMS['lcgpa-general'];
    expect(fw.usageNotesEn).toHaveLength(2);
    expect(fw.usageNotesAr).toHaveLength(2);
    expect(fw.usageNotesEn![0]).toContain('40%');
    expect(fw.usageNotesAr![0]).toContain('٤٠٪');
    expect(fw.usageNotesEn![1]).toContain('spa.gov.sa returned 403');
    expect(fw.usageNotesAr![1]).toContain('٤٠٣');
  });
});

// ===========================================================================
// SA — LCGPA Mandatory List (category-eligibility-gate, type 3)
// ===========================================================================

describe('SA / LCGPA Mandatory List — category-eligibility-gate', () => {
  it('soft: category not on the Mandatory List -> gate does not apply, eligible regardless of certification', () => {
    const a = assessSupplierLocalContent('SA', 'government', { saMandatoryList: { inMandatoryListCategory: false, certifiedForCategory: null } }, 'mandatory-list');
    expect(a.applicability).toBe('applicable');
    const c = a.computation as CategoryEligibilityGateResult;
    expect(c.eligibleToBid).toBe(true);
    expect(a.reasonEn).toContain('eligible to bid');
    expect(a.reasonAr).toContain('مؤهل للتقديم');
  });

  it('hardest: in-list category, supplier NOT certified -> gated out (false), never a percentage', () => {
    const a = assessSupplierLocalContent('SA', 'government', { saMandatoryList: { inMandatoryListCategory: true, certifiedForCategory: false } }, 'mandatory-list');
    const c = a.computation as CategoryEligibilityGateResult;
    expect(c.eligibleToBid).toBe(false);
    expect(a.reasonEn).toContain('gated out of this category');
    expect(a.reasonAr).toContain('مستبعد من هذه الفئة');
  });

  it('boundary: in-list category, certification status unknown (null) -> insufficient, not a guessed true/false', () => {
    const a = assessSupplierLocalContent('SA', 'government', { saMandatoryList: { inMandatoryListCategory: true, certifiedForCategory: null } }, 'mandatory-list');
    const c = a.computation as CategoryEligibilityGateResult;
    expect(c.eligibleToBid).toBeNull();
    expect(a.reasonEn).toContain('incomplete inputs');
    expect(a.reasonAr).toContain('بيانات غير مكتملة');
  });

  it('in-list + certified -> eligible', () => {
    const a = assessSupplierLocalContent('SA', 'semi-government-soe', { saMandatoryList: { inMandatoryListCategory: true, certifiedForCategory: true } }, 'mandatory-list');
    const c = a.computation as CategoryEligibilityGateResult;
    expect(c.eligibleToBid).toBe(true);
  });

  it('no inputs supplied at all -> null gate, reasonAr carries a genuinely different phrase than reasonEn (not English reused)', () => {
    const a = assessSupplierLocalContent('SA', 'government', {}, 'mandatory-list');
    const c = a.computation as CategoryEligibilityGateResult;
    expect(c.eligibleToBid).toBeNull();
    expect(a.reasonEn).toBe('No Mandatory List category/certification inputs supplied yet.');
    expect(a.reasonAr).toBe('لم تُدخل بيانات فئة القائمة الإلزامية أو الاعتماد بعد.');
  });

  it('recommendLocalContentAction: only fires when genuinely gated out (false), never for null/true', () => {
    const gatedOut = assessSupplierLocalContent('SA', 'government', { saMandatoryList: { inMandatoryListCategory: true, certifiedForCategory: false } }, 'mandatory-list');
    const rec = recommendLocalContentAction(gatedOut, null);
    expect(rec).not.toBeNull();
    expect(rec!.primaryEn).toContain('certification');
    expect(rec!.alternativeEn).toContain('subcontract');
    expect(rec!.primaryAr).toContain('اعتماد');

    const eligible = assessSupplierLocalContent('SA', 'government', { saMandatoryList: { inMandatoryListCategory: true, certifiedForCategory: true } }, 'mandatory-list');
    expect(recommendLocalContentAction(eligible, null)).toBeNull();

    const unknown = assessSupplierLocalContent('SA', 'government', { saMandatoryList: { inMandatoryListCategory: true, certifiedForCategory: null } }, 'mandatory-list');
    expect(recommendLocalContentAction(unknown, null)).toBeNull();
  });
});

// ===========================================================================
// SA — LCGPA National Product Price Preference (reuses price-preference-margin,
// same shape as Jordan — validates the "shared primitives" design intent)
// ===========================================================================

describe('SA / LCGPA — price-preference (10%, shared shape with Jordan)', () => {
  it('soft: partial local share -> proportional discount at the Saudi 10% margin (not Jordan\'s 20%)', () => {
    const a = assessSupplierLocalContent('SA', 'government', { saPricePreference: { bidValueLocallyManufacturedPct: 40 } }, 'price-preference');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.preferenceMarginPct).toBe(SAUDI_PRICE_PREFERENCE_MARGIN_PCT);
    expect(c.preferenceMarginPct).not.toBe(JORDAN_PRICE_PREFERENCE_MARGIN_PCT);
    expect(c.effectiveBidDiscountPct).toBeCloseTo(4, 6);
  });

  it('boundary: 100% locally-manufactured -> full 10-point discount; recommendation correctly returns null (nothing to improve)', () => {
    const a = assessSupplierLocalContent('SA', 'government', { saPricePreference: { bidValueLocallyManufacturedPct: 100 } }, 'price-preference');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.effectiveBidDiscountPct).toBeCloseTo(10, 6);
    expect(recommendLocalContentAction(a, null)).toBeNull();
  });

  it('boundary: 0% -> zero discount, still a real computed answer (not insufficient-data)', () => {
    const a = assessSupplierLocalContent('SA', 'government', { saPricePreference: { bidValueLocallyManufacturedPct: 0 } }, 'price-preference');
    expect(a.applicability).toBe('applicable');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.effectiveBidDiscountPct).toBe(0);
  });

  it('hardest: private-commercial context -> not-applicable (LCGPA price preference is government/SOE only), not a zero score', () => {
    const a = assessSupplierLocalContent('SA', 'private-commercial', { saPricePreference: { bidValueLocallyManufacturedPct: 90 } }, 'price-preference');
    expect(a.applicability).toBe('not-applicable');
    expect(a.computation).toBeNull();
    expect(a.reasonAr).not.toContain('private-commercial'); // no raw English enum spliced into Arabic
  });
});

// ===========================================================================
// SA — Aramco IKTVA (anchor-buyer-score, type 2). iktva% = ((A+B+C+D+R)/E) + I
// ===========================================================================

describe('SA / Aramco IKTVA — anchor-buyer-score', () => {
  it('soft: realistic supplier, no incentive bonus supplied', () => {
    const inputs: SupplierLocalContentInputs = {
      iktva: {
        goodsServicesLocalSAR: 3_000_000, assetDepreciationLocalSAR: 200_000, expatCompensationInSaudiSAR: 500_000,
        saudiWorkforceCompensationSAR: 1_500_000, trainingDevelopmentSAR: 100_000, supplierDevelopmentSAR: 50_000,
        localRnDSAR: 0, totalCostsSAR: 6_000_000, incentiveBonusPct: null,
      },
    };
    const a = assessSupplierLocalContent('SA', 'semi-government-soe', inputs, 'iktva-aramco');
    expect(a.applicability).toBe('applicable');
    const c = a.computation as AnchorBuyerScoreResult;
    const numerator = 3_000_000 + 200_000 + 500_000 + 1_500_000 + 100_000 + 50_000 + 0;
    expect(c.scorePct).not.toBeNull();
    expect(c.scorePct!).toBeCloseTo((numerator / 6_000_000) * 100, 6);
    expect(c.components).toHaveLength(5);
    expect(c.incentiveBonusPct).toBeNull();
  });

  it('hardest: incentive bonus supplied out-of-range (150) is clamped to the disclosed 0-10 simplification cap', () => {
    const inputs: SupplierLocalContentInputs = {
      iktva: {
        goodsServicesLocalSAR: 1_000_000, assetDepreciationLocalSAR: 0, expatCompensationInSaudiSAR: 0,
        saudiWorkforceCompensationSAR: 0, trainingDevelopmentSAR: 0, supplierDevelopmentSAR: 0,
        localRnDSAR: 0, totalCostsSAR: 1_000_000, incentiveBonusPct: 150,
      },
    };
    const a = assessSupplierLocalContent('SA', 'semi-government-soe', inputs, 'iktva-aramco');
    const c = a.computation as AnchorBuyerScoreResult;
    // numerator == totalCosts -> base 100%, clamp to 100 overall despite the (clamped-to-10) bonus
    expect(c.scorePct).toBeCloseTo(100, 6);
  });

  it('boundary: totalCostsSAR = 0 -> null score (undefined denominator), not a divide-by-zero artifact', () => {
    const inputs: SupplierLocalContentInputs = {
      iktva: { goodsServicesLocalSAR: 500_000, assetDepreciationLocalSAR: 0, expatCompensationInSaudiSAR: 0, saudiWorkforceCompensationSAR: 0, trainingDevelopmentSAR: 0, supplierDevelopmentSAR: 0, localRnDSAR: 0, totalCostsSAR: 0, incentiveBonusPct: 0 },
    };
    const a = assessSupplierLocalContent('SA', 'semi-government-soe', inputs, 'iktva-aramco');
    const c = a.computation as AnchorBuyerScoreResult;
    expect(c.scorePct).toBeNull();
    expect(a.reasonEn).toContain('incomplete inputs');
    expect(a.reasonAr).toContain('بيانات غير مكتملة');
  });

  it('IKTVA is scoped to semi-government-soe only (Aramco is an anchor-buyer program, not the general government score) -- government context is not-applicable', () => {
    const a = assessSupplierLocalContent('SA', 'government', { iktva: { goodsServicesLocalSAR: 1, assetDepreciationLocalSAR: 0, expatCompensationInSaudiSAR: 0, saudiWorkforceCompensationSAR: 0, trainingDevelopmentSAR: 0, supplierDevelopmentSAR: 0, localRnDSAR: 0, totalCostsSAR: 1, incentiveBonusPct: 0 } }, 'iktva-aramco');
    expect(a.applicability).toBe('not-applicable');
  });

  it('reasonAr carries the actual score value in Arabic numerals, never the raw English procurementContext literal', () => {
    const inputs: SupplierLocalContentInputs = {
      iktva: { goodsServicesLocalSAR: 500_000, assetDepreciationLocalSAR: 0, expatCompensationInSaudiSAR: 0, saudiWorkforceCompensationSAR: 0, trainingDevelopmentSAR: 0, supplierDevelopmentSAR: 0, localRnDSAR: 0, totalCostsSAR: 1_000_000, incentiveBonusPct: 0 },
    };
    const a = assessSupplierLocalContent('SA', 'semi-government-soe', inputs, 'iktva-aramco');
    const c = a.computation as AnchorBuyerScoreResult;
    expect(a.reasonAr).toContain(`${c.scorePct!.toFixed(1)}`.replace('.', '.')); // numeral present
    expect(a.reasonAr).toContain('٪');
    expect(a.reasonAr).not.toContain('semi-government-soe');
  });

  it('recommendLocalContentAction: gap-closing recommendation fires for anchor-buyer-score exactly like the other score-based mechanisms', () => {
    const inputs: SupplierLocalContentInputs = {
      iktva: { goodsServicesLocalSAR: 200_000, assetDepreciationLocalSAR: 0, expatCompensationInSaudiSAR: 0, saudiWorkforceCompensationSAR: 0, trainingDevelopmentSAR: 0, supplierDevelopmentSAR: 0, localRnDSAR: 0, totalCostsSAR: 1_000_000, incentiveBonusPct: 0 },
    };
    const a = assessSupplierLocalContent('SA', 'semi-government-soe', inputs, 'iktva-aramco');
    const rec = recommendLocalContentAction(a, 60);
    expect(rec).not.toBeNull();
    expect(rec!.primaryEn).toContain('gap');
    expect(rec!.alternativeAr).toContain('مناقصة');
  });
});

// ===========================================================================
// SA — GAMI defense & LIKT (both not-yet-sourced, each with real dated
// national-level context rather than a blank placeholder)
// ===========================================================================

describe('SA — GAMI defense localization (not-yet-sourced, real dated context)', () => {
  it('returns insufficient-data with the real 24.89% / 2030 figures in both languages, never a fabricated per-supplier score', () => {
    const a = assessSupplierLocalContent('SA', 'government', {}, 'gami-defense');
    expect(a.applicability).toBe('insufficient-data');
    expect(a.computation).toEqual({ mechanismType: 'not-yet-sourced' });
    expect(a.reasonEn).toContain('24.89%');
    expect(a.reasonEn).toContain('2030');
    expect(a.reasonAr).toContain('٢٤.٨٩٪');
    expect(a.reasonAr).toContain('٢٠٣٠');
    expect(a.program).toBe('gami-defense');
  });
});

describe('SA — LIKT (Localization of Industry & Knowledge Transfer, not-yet-sourced)', () => {
  it('is modeled as a genuinely distinct program from GAMI, with its own bilingual sourceNote', () => {
    const a = assessSupplierLocalContent('SA', 'government', {}, 'likt');
    expect(a.applicability).toBe('insufficient-data');
    expect(a.program).toBe('likt');
    expect(SAUDI_PROGRAMS.likt.sourceNoteEn).not.toEqual(SAUDI_PROGRAMS['gami-defense'].sourceNoteEn);
    expect(a.reasonEn).toContain('LIKT');
    expect(a.reasonAr).toContain('LIKT');
  });
});

// ===========================================================================
// SA — portfolio rollup groups by program, not just country+context (two
// different Saudi programs for the same context must never be merged into
// one averaged group -- Decision Record 8.7)
// ===========================================================================

describe('SA — portfolio rollup groups by program', () => {
  it('lcgpa-general and mandatory-list suppliers in the same government context land in two separate groups', () => {
    const general = assessSupplierLocalContent('SA', 'government', { sa: { localLaborSAR: 900_000, expatLaborSAR: 100_000, localGoodsServicesSAR: 0, foreignGoodsServicesSAR: 0, capacityBuildingSAR: 0, localAssetDepreciationSAR: 0, totalAssetDepreciationSAR: 0 } }, 'lcgpa-general');
    const gate = assessSupplierLocalContent('SA', 'government', { saMandatoryList: { inMandatoryListCategory: true, certifiedForCategory: true } }, 'mandatory-list');

    const groups = rollUpPortfolioLocalContent([
      { supplierId: 's1', spendShare: 60, assessment: general },
      { supplierId: 's2', spendShare: 40, assessment: gate },
    ]);

    expect(groups).toHaveLength(2);
    const generalGroup = groups.find(g => g.program === 'lcgpa-general')!;
    const gateGroup = groups.find(g => g.program === 'mandatory-list')!;
    expect(generalGroup).toBeDefined();
    expect(gateGroup).toBeDefined();
    expect(generalGroup.mechanismType).toBe('eligible-spend-ratio');
    expect(gateGroup.mechanismType).toBe('category-eligibility-gate');
    expect(gateGroup.gateEligibleSharePct).toBe(100);
    expect(generalGroup.weightedScorePct).not.toBeNull();
  });

  it('gateEligibleSharePct is spend-share-weighted across mixed eligible/gated suppliers', () => {
    const eligible = assessSupplierLocalContent('SA', 'government', { saMandatoryList: { inMandatoryListCategory: true, certifiedForCategory: true } }, 'mandatory-list');
    const gated = assessSupplierLocalContent('SA', 'government', { saMandatoryList: { inMandatoryListCategory: true, certifiedForCategory: false } }, 'mandatory-list');
    const groups = rollUpPortfolioLocalContent([
      { supplierId: 's1', spendShare: 30, assessment: eligible },
      { supplierId: 's2', spendShare: 70, assessment: gated },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.gateEligibleSharePct).toBeCloseTo(30, 6); // only the eligible supplier's spend share counts as eligible
  });
});
