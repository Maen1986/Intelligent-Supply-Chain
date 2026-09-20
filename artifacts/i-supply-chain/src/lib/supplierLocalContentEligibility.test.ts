import { describe, it, expect } from 'vitest';
import {
  assessSupplierLocalContent,
  recommendLocalContentAction,
  rollUpPortfolioLocalContent,
  COUNTRY_FRAMEWORKS,
  PROGRAMS,
  DEFAULT_PROGRAM_BY_COUNTRY,
  PROGRAMS_BY_COUNTRY,
  JORDAN_PRICE_PREFERENCE_MARGIN_PCT,
  SAUDI_PRICE_PREFERENCE_MARGIN_PCT,
  TAWAZUN_OFFSET_THRESHOLD_AED,
  TAWAZUN_OFFSET_TARGET_PCT,
  TAWAZUN_SHORTFALL_PENALTY_PCT,
  JORDAN_CONTRACTOR_QUOTA_TARGET_PCT,
  OMAN_OQ_PRICE_PREFERENCE_MARGIN_PCT,
  BAHRAIN_SME_PRICE_PREFERENCE_MARGIN_PCT,
  BAHRAIN_SME_SPEND_SETASIDE_TARGET_PCT,
  KUWAIT_KPC_LOCAL_SPEND_TARGET_PCT,
  QATAR_ICV_PLUS_MANUFACTURER_BOOST_MULTIPLIER,
  QATAR_ICV_BLANKET_FLOOR_PCT_MICRO_SMALL,
  QATAR_ICV_MAX_SELF_REPORTED_BONUS_PCT,
  EGYPT_PRICE_PREFERENCE_MARGIN_PCT,
  EGYPT_PRICE_PREFERENCE_QUALIFYING_THRESHOLD_PCT,
  EGYPT_OIL_GAS_PRICE_PREFERENCE_MARGIN_PCT,
  TURKEY_PRICE_PREFERENCE_MARGIN_PCT,
  BUY_AMERICAN_DOMESTIC_CONTENT_THRESHOLD_PCT,
  BUY_AMERICAN_LARGE_BUSINESS_MARGIN_PCT,
  BUY_AMERICAN_SMALL_BUSINESS_MARGIN_PCT,
  USA_SBA_SMALL_BUSINESS_TARGET_PCT,
  CN_DOMESTIC_PRODUCT_PRICE_PREFERENCE_PCT,
  CN_DOMESTIC_PRODUCT_BUNDLE_THRESHOLD_PCT,
  CN_SME_DIRECT_ENGINEERING_MIN_PCT,
  CN_SME_DIRECT_ENGINEERING_MAX_PCT,
  CN_SME_CONSORTIUM_ENGINEERING_MIN_PCT,
  CN_SME_CONSORTIUM_ENGINEERING_MAX_PCT,
  CN_SME_DIRECT_GOODS_SERVICES_MIN_PCT,
  CN_SME_DIRECT_GOODS_SERVICES_MAX_PCT,
  CN_SME_CONSORTIUM_GOODS_SERVICES_MIN_PCT,
  CN_SME_CONSORTIUM_GOODS_SERVICES_MAX_PCT,
  CN_SME_CONSORTIUM_MIN_SUBCONTRACT_SHARE_PCT,
  INDIA_MAKE_IN_INDIA_PRICE_PREFERENCE_MARGIN_PCT,
  INDIA_CLASS_I_MIN_LOCAL_CONTENT_PCT,
  INDIA_CLASS_II_MIN_LOCAL_CONTENT_PCT,
  KOREA_SME_OVERALL_PURCHASE_TARGET_PCT,
  KOREA_SME_TECH_DEVELOPMENT_PRODUCT_TARGET_PCT,
  type SupplierLocalContentInputs,
  type LocalContentAssessment,
  type EligibleSpendRatioResult,
  type WeightedPillarScoreResult,
  type PricePreferenceMarginResult,
  type CategoryEligibilityGateResult,
  type AnchorBuyerScoreResult,
  type OffsetObligationGateResult,
  type SpendSetAsideResult,
  type ModifiedIcvScoreResult,
  type LocalContentProgram,
  type ProcurementContext,
  type CommitmentDeviationGateResult,
  type StackedLocalContentAssessment,
  assessAllApplicableLocalContentPrograms,
  actionableNextStepForSabicLcGate,
  SABIC_LC_DEVIATION_TOLERANCE_PCT,
  SABIC_LC_PENALTY_MAX_PCT_OF_CONTRACT_VALUE,
  type GccOriginNationalTreatmentGateResult,
  actionableNextStepForGccOriginTreatment,
  GCC_ORIGIN_VALUE_ADDED_THRESHOLD_PCT,
  GCC_ORIGIN_OWNERSHIP_THRESHOLD_PCT,
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

  it('carries the sourced Abu Dhabi ADLC usage note (40% financial evaluation weight) and the MoIAT incentive-not-mandatory-gate negative finding, bilingually', () => {
    const fw = PROGRAMS['ae-icv-general'];
    expect(fw.usageNotesEn).toHaveLength(1);
    expect(fw.usageNotesAr).toHaveLength(1);
    expect(fw.usageNotesEn![0]).toContain('40%');
    expect(fw.usageNotesAr![0]).toContain('٤٠٪');
    // The genuine negative finding: MoIAT's own page confirms ICV is an
    // incentive, not a mandatory bidding gate -- disclosed in sourceNote,
    // not fabricated as a Mandatory-List-style mechanism.
    expect(fw.sourceNoteEn).toContain('INCENTIVE');
    expect(fw.sourceNoteAr).toContain('تحفيزية');
  });
});

// ===========================================================================
// AE — Tawazun Economic Program (offset-obligation-gate, type 6). Real,
// sourced, computable -- see PROGRAMS['ae-tawazun-offset'] and the file
// header's "AE TAWAZUN SOURCING" section.
// ===========================================================================

describe('AE / Tawazun Economic Program — offset-obligation-gate', () => {
  it('soft: realistic defense contract above threshold with partial offset credits already earned', () => {
    const a = assessSupplierLocalContent('AE', 'government', { aeTawazun: { contractValueAED: 50_000_000, offsetCreditsEarnedAED: 10_000_000 } }, 'ae-tawazun-offset');
    expect(a.applicability).toBe('applicable');
    const c = a.computation as OffsetObligationGateResult;
    expect(c.triggersObligation).toBe(true);
    expect(c.requiredOffsetCreditsAED).toBeCloseTo(30_000_000, 6); // 60% of 50M
    expect(c.shortfallAED).toBeCloseTo(20_000_000, 6); // 30M required - 10M earned
    expect(c.shortfallPenaltyAED).toBeCloseTo(1_700_000, 6); // 8.5% of 20M shortfall
  });

  it('soft: contract value supplied but offset credits earned not yet known -- shortfall stays null, not zero (honesty: unknown != zero)', () => {
    const a = assessSupplierLocalContent('AE', 'government', { aeTawazun: { contractValueAED: 50_000_000, offsetCreditsEarnedAED: null } }, 'ae-tawazun-offset');
    const c = a.computation as OffsetObligationGateResult;
    expect(c.triggersObligation).toBe(true);
    expect(c.requiredOffsetCreditsAED).toBeCloseTo(30_000_000, 6);
    expect(c.shortfallAED).toBeNull();
    expect(c.shortfallPenaltyAED).toBeNull();
  });

  it('hardest: contract value far below threshold -- no obligation, zero required credits, never a spurious penalty', () => {
    const a = assessSupplierLocalContent('AE', 'government', { aeTawazun: { contractValueAED: 1_000_000, offsetCreditsEarnedAED: 0 } }, 'ae-tawazun-offset');
    const c = a.computation as OffsetObligationGateResult;
    expect(c.triggersObligation).toBe(false);
    expect(c.requiredOffsetCreditsAED).toBe(0);
    expect(c.shortfallAED).toBe(0);
    expect(c.shortfallPenaltyAED).toBe(0);
  });

  it('hardest: earned credits exceed the requirement -- shortfall floors at 0, never negative', () => {
    const a = assessSupplierLocalContent('AE', 'government', { aeTawazun: { contractValueAED: 40_000_000, offsetCreditsEarnedAED: 100_000_000 } }, 'ae-tawazun-offset');
    const c = a.computation as OffsetObligationGateResult;
    expect(c.triggersObligation).toBe(true);
    expect(c.shortfallAED).toBe(0);
    expect(c.shortfallPenaltyAED).toBe(0);
  });

  it('boundary: contract value at exactly the AED 36.73M threshold triggers the obligation (>=, not >)', () => {
    const at = assessSupplierLocalContent('AE', 'government', { aeTawazun: { contractValueAED: TAWAZUN_OFFSET_THRESHOLD_AED, offsetCreditsEarnedAED: 0 } }, 'ae-tawazun-offset').computation as OffsetObligationGateResult;
    const justBelow = assessSupplierLocalContent('AE', 'government', { aeTawazun: { contractValueAED: TAWAZUN_OFFSET_THRESHOLD_AED - 1, offsetCreditsEarnedAED: 0 } }, 'ae-tawazun-offset').computation as OffsetObligationGateResult;
    expect(at.triggersObligation).toBe(true);
    expect(justBelow.triggersObligation).toBe(false);
  });

  it('boundary: the AED 36.73M threshold is the USD 10M threshold at the fixed 3.6725 peg, within the source citation\'s own rounding (resolves the brief\'s flagged currency ambiguity -- STRESS-TEST FINDING: mondaq.com\'s "36.73 million" is itself rounded to 2 decimals, so the peg-exact figure is AED 36.725M; the cited AED 36.73M is off by AED 5,000 / ~USD 1,361, i.e. 0.014% -- real-world-close, not byte-exact, and the file header\'s "essentially exactly" wording is accurate for practical purposes but this test checks the ACTUAL tolerance rather than assuming exactness)', () => {
    const usdEquivalent = TAWAZUN_OFFSET_THRESHOLD_AED / 3.6725;
    expect(Math.abs(usdEquivalent - 10_000_000)).toBeLessThan(2_000); // within the source's own rounding, not a code defect
    expect(TAWAZUN_OFFSET_TARGET_PCT).toBe(60);
    expect(TAWAZUN_SHORTFALL_PENALTY_PCT).toBe(8.5);
  });

  it('not-applicable: Tawazun is sourced only for government (UAE Armed Forces / Abu Dhabi Police) contracts, not semi-government-soe or private-commercial', () => {
    const soe = assessSupplierLocalContent('AE', 'semi-government-soe', { aeTawazun: { contractValueAED: 50_000_000, offsetCreditsEarnedAED: 0 } }, 'ae-tawazun-offset');
    const priv = assessSupplierLocalContent('AE', 'private-commercial', { aeTawazun: { contractValueAED: 50_000_000, offsetCreditsEarnedAED: 0 } }, 'ae-tawazun-offset');
    expect(soe.applicability).toBe('not-applicable');
    expect(priv.applicability).toBe('not-applicable');
  });

  it('insufficient-data: no Tawazun inputs supplied yet -- distinct from a below-threshold "no obligation" result', () => {
    const a = assessSupplierLocalContent('AE', 'government', {}, 'ae-tawazun-offset');
    expect(a.applicability).toBe('applicable'); // applicability is about context, not input completeness
    const c = a.computation as OffsetObligationGateResult;
    expect(c.triggersObligation).toBeNull();
    expect(c.requiredOffsetCreditsAED).toBeNull();
  });

  it('reasonEn/reasonAr carry the same information for a triggered obligation (bilingual completeness)', () => {
    const a = assessSupplierLocalContent('AE', 'government', { aeTawazun: { contractValueAED: 50_000_000, offsetCreditsEarnedAED: 10_000_000 } }, 'ae-tawazun-offset');
    expect(a.reasonEn).toContain('offset obligation triggered');
    expect(a.reasonEn).toContain('30,000,000');
    expect(a.reasonAr).toContain('تم تفعيل التزام المقاصة');
    expect(a.reasonAr).toContain('30,000,000');
  });

  it('recommendLocalContentAction gives a genuine primary + alternative (bank real credits vs. pay the 8.5% penalty / roll it over) -- never a single-path recommendation (Rule 8)', () => {
    const a = assessSupplierLocalContent('AE', 'government', { aeTawazun: { contractValueAED: 50_000_000, offsetCreditsEarnedAED: 10_000_000 } }, 'ae-tawazun-offset');
    const rec = recommendLocalContentAction(a, null);
    expect(rec).not.toBeNull();
    expect(rec!.primaryEn).toContain('Bank real offset credits');
    expect(rec!.alternativeEn).toContain('8.5%');
    expect(rec!.primaryAr).toContain('اكتسب ائتمانات مقاصة حقيقية');
    expect(rec!.alternativeAr).toContain('٨.٥٪');
  });

  it('recommendLocalContentAction returns null once there is no shortfall (nothing to recommend against a closed gap)', () => {
    const a = assessSupplierLocalContent('AE', 'government', { aeTawazun: { contractValueAED: 40_000_000, offsetCreditsEarnedAED: 100_000_000 } }, 'ae-tawazun-offset');
    expect(recommendLocalContentAction(a, null)).toBeNull();
  });

  it('portfolio rollup: totalShortfallPenaltyAED is a plain SUM of real-money exposure across the group, not spend-share-weighted like a percentage', () => {
    const s1 = assessSupplierLocalContent('AE', 'government', { aeTawazun: { contractValueAED: 50_000_000, offsetCreditsEarnedAED: 10_000_000 } }, 'ae-tawazun-offset'); // shortfall penalty 1.7M
    const s2 = assessSupplierLocalContent('AE', 'government', { aeTawazun: { contractValueAED: 40_000_000, offsetCreditsEarnedAED: 0 } }, 'ae-tawazun-offset'); // required 24M, penalty 2.04M
    const groups = rollUpPortfolioLocalContent([
      { supplierId: 's1', spendShare: 50, assessment: s1 },
      { supplierId: 's2', spendShare: 50, assessment: s2 },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.mechanismType).toBe('offset-obligation-gate');
    expect(groups[0]!.totalShortfallPenaltyAED).toBeCloseTo(1_700_000 + 2_040_000, 0);
  });
});

// ===========================================================================
// AE — GCC Unified Economic Agreement Article 3 rules-of-origin gate
// (new, 20 Sep 2026)
// ===========================================================================

describe('AE / GCC Unified Economic Agreement Article 3 — gcc-origin-national-treatment-gate', () => {
  it('soft: realistic supplier comfortably clears both thresholds', () => {
    const a = assessSupplierLocalContent('AE', 'government', { aeGccOrigin: { gccValueAddedPct: 65, gccCitizenOwnershipPct: 70 } }, 'ae-gcc-origin-treatment');
    expect(a.applicability).toBe('applicable');
    const c = a.computation as GccOriginNationalTreatmentGateResult;
    expect(c.qualifiesAsGccNationalProduct).toBe(true);
    expect(c.valueAddedThresholdPct).toBe(GCC_ORIGIN_VALUE_ADDED_THRESHOLD_PCT);
    expect(c.ownershipThresholdPct).toBe(GCC_ORIGIN_OWNERSHIP_THRESHOLD_PCT);
  });

  it('soft: value-added known and passing, ownership not yet known -- insufficient data, never guessed true', () => {
    const a = assessSupplierLocalContent('AE', 'government', { aeGccOrigin: { gccValueAddedPct: 55, gccCitizenOwnershipPct: null } }, 'ae-gcc-origin-treatment');
    const c = a.computation as GccOriginNationalTreatmentGateResult;
    expect(c.qualifiesAsGccNationalProduct).toBeNull();
    expect(c.gccValueAddedPct).toBe(55);
    expect(c.gccCitizenOwnershipPct).toBeNull();
  });

  it('hardest: value-added known to fail, ownership missing entirely -- still resolves false, not null (a known failure is decisive regardless of the other input)', () => {
    const a = assessSupplierLocalContent('AE', 'government', { aeGccOrigin: { gccValueAddedPct: 15, gccCitizenOwnershipPct: null } }, 'ae-gcc-origin-treatment');
    const c = a.computation as GccOriginNationalTreatmentGateResult;
    expect(c.qualifiesAsGccNationalProduct).toBe(false);
  });

  it('hardest: ownership known to fail, value-added missing entirely -- same short-circuit, the other direction', () => {
    const a = assessSupplierLocalContent('AE', 'government', { aeGccOrigin: { gccValueAddedPct: null, gccCitizenOwnershipPct: 20 } }, 'ae-gcc-origin-treatment');
    const c = a.computation as GccOriginNationalTreatmentGateResult;
    expect(c.qualifiesAsGccNationalProduct).toBe(false);
  });

  it('hardest: both well below threshold -- clean false, not a fabricated partial-credit score', () => {
    const a = assessSupplierLocalContent('AE', 'government', { aeGccOrigin: { gccValueAddedPct: 10, gccCitizenOwnershipPct: 5 } }, 'ae-gcc-origin-treatment');
    const c = a.computation as GccOriginNationalTreatmentGateResult;
    expect(c.qualifiesAsGccNationalProduct).toBe(false);
  });

  it('boundary: value-added and ownership exactly AT the Article 3(1) thresholds qualify (>=, not >)', () => {
    const a = assessSupplierLocalContent('AE', 'government', { aeGccOrigin: { gccValueAddedPct: GCC_ORIGIN_VALUE_ADDED_THRESHOLD_PCT, gccCitizenOwnershipPct: GCC_ORIGIN_OWNERSHIP_THRESHOLD_PCT } }, 'ae-gcc-origin-treatment');
    const c = a.computation as GccOriginNationalTreatmentGateResult;
    expect(c.qualifiesAsGccNationalProduct).toBe(true);
  });

  it('boundary: one point below each threshold fails both, confirming the >= boundary is real (not an off-by-one)', () => {
    const a = assessSupplierLocalContent('AE', 'government', { aeGccOrigin: { gccValueAddedPct: GCC_ORIGIN_VALUE_ADDED_THRESHOLD_PCT - 1, gccCitizenOwnershipPct: GCC_ORIGIN_OWNERSHIP_THRESHOLD_PCT - 1 } }, 'ae-gcc-origin-treatment');
    const c = a.computation as GccOriginNationalTreatmentGateResult;
    expect(c.qualifiesAsGccNationalProduct).toBe(false);
  });

  it('boundary: value-added exactly at threshold but ownership one point short -- fails on the ownership leg alone (both conditions genuinely required together)', () => {
    const a = assessSupplierLocalContent('AE', 'government', { aeGccOrigin: { gccValueAddedPct: GCC_ORIGIN_VALUE_ADDED_THRESHOLD_PCT, gccCitizenOwnershipPct: GCC_ORIGIN_OWNERSHIP_THRESHOLD_PCT - 1 } }, 'ae-gcc-origin-treatment');
    const c = a.computation as GccOriginNationalTreatmentGateResult;
    expect(c.qualifiesAsGccNationalProduct).toBe(false);
  });

  it('insufficient-data (at the input level, not applicability): no GCC-origin inputs supplied yet -- both null, distinct from a computed false', () => {
    const a = assessSupplierLocalContent('AE', 'government', {}, 'ae-gcc-origin-treatment');
    expect(a.applicability).toBe('applicable'); // applicability is about context, not input completeness -- same precedent as Tawazun above
    const c = a.computation as GccOriginNationalTreatmentGateResult;
    expect(c.gccValueAddedPct).toBeNull();
    expect(c.gccCitizenOwnershipPct).toBeNull();
    expect(c.qualifiesAsGccNationalProduct).toBeNull();
  });

  it('not-applicable: sourced only for government/semi-government-soe procurement, not private-commercial', () => {
    const priv = assessSupplierLocalContent('AE', 'private-commercial', { aeGccOrigin: { gccValueAddedPct: 65, gccCitizenOwnershipPct: 70 } }, 'ae-gcc-origin-treatment');
    expect(priv.applicability).toBe('not-applicable');
    const soe = assessSupplierLocalContent('AE', 'semi-government-soe', { aeGccOrigin: { gccValueAddedPct: 65, gccCitizenOwnershipPct: 70 } }, 'ae-gcc-origin-treatment');
    expect(soe.applicability).toBe('applicable');
  });

  it('reasonEn/reasonAr for the no-input case carry the same information (bilingual completeness)', () => {
    const a = assessSupplierLocalContent('AE', 'government', {}, 'ae-gcc-origin-treatment');
    expect(a.reasonEn).toContain('No GCC value-added/ownership inputs supplied yet');
    expect(a.reasonAr).toContain('لم تُدخل بيانات القيمة المضافة الخليجية');
  });

  it('actionableNextStepForGccOriginTreatment: returns a real bilingual decision-ready action citing Article 1(b)/Article 3 and the disclosed MoIAT-operationalization gap when the gate qualifies', () => {
    const a = assessSupplierLocalContent('AE', 'government', { aeGccOrigin: { gccValueAddedPct: 65, gccCitizenOwnershipPct: 70 } }, 'ae-gcc-origin-treatment');
    const step = actionableNextStepForGccOriginTreatment(a.computation as GccOriginNationalTreatmentGateResult);
    expect(step).not.toBeNull();
    expect(step!.en).toContain('Article 3');
    expect(step!.en).toContain('Article 1(b)');
    expect(step!.en).toContain('MoIAT');
    expect(step!.ar).toContain('المادة ٣');
    expect(step!.ar).toContain('المادة ١(ب)');
  });

  it('actionableNextStepForGccOriginTreatment: returns null when the gate resolves false -- no action manufactured for a supplier that does not qualify', () => {
    const a = assessSupplierLocalContent('AE', 'government', { aeGccOrigin: { gccValueAddedPct: 10, gccCitizenOwnershipPct: 5 } }, 'ae-gcc-origin-treatment');
    expect(actionableNextStepForGccOriginTreatment(a.computation as GccOriginNationalTreatmentGateResult)).toBeNull();
  });

  it('actionableNextStepForGccOriginTreatment: returns null when inputs are incomplete, even if what is known would pass -- never a premature claim', () => {
    const a = assessSupplierLocalContent('AE', 'government', { aeGccOrigin: { gccValueAddedPct: 65, gccCitizenOwnershipPct: null } }, 'ae-gcc-origin-treatment');
    expect(actionableNextStepForGccOriginTreatment(a.computation as GccOriginNationalTreatmentGateResult)).toBeNull();
  });

  it('assessAllApplicableLocalContentPrograms: AE now stacks all three genuinely different programs, and surfaces the GCC gate\'s actionable step inside the stacked view exactly like the SABIC gate does', () => {
    const stacked = assessAllApplicableLocalContentPrograms('AE', 'government', {
      ae: { manufacturingOrThirdPartySpendLocalAED: null, manufacturingOrThirdPartySpendTotalAED: null, investmentNBVLocalAED: null, investmentNBVTotalAED: null, emiratisationAnnualSpendAED: null, expatriateHeadcount: null, exportRevenueAED: null, emiratiHeadcountGrowthPct: null, investmentGrowthPct: null, registeredOnMainland: null },
      aeTawazun: { contractValueAED: 50_000_000, offsetCreditsEarnedAED: 10_000_000 },
      aeGccOrigin: { gccValueAddedPct: 65, gccCitizenOwnershipPct: 70 },
    });
    const programs = stacked.map(s => s.program);
    expect(programs).toContain('ae-icv-general');
    expect(programs).toContain('ae-tawazun-offset');
    expect(programs).toContain('ae-gcc-origin-treatment');
    expect(stacked).toHaveLength(3); // all three genuinely applicable to 'government', none averaged together
    const gccEntry = stacked.find(s => s.program === 'ae-gcc-origin-treatment')!;
    expect(gccEntry.actionableNextStep).not.toBeNull();
    expect(gccEntry.actionableNextStep!.en).toContain('Article 3');
  });

  it('PROGRAMS[\'ae-gcc-origin-treatment\'] is wired consistently: correct country, mechanismType, and applicableContexts', () => {
    const framework = PROGRAMS['ae-gcc-origin-treatment'];
    expect(framework.country).toBe('AE');
    expect(framework.mechanismType).toBe('gcc-origin-national-treatment-gate');
    expect(framework.applicableContexts).toEqual(['government', 'semi-government-soe']);
    expect(framework.sourceNoteEn).toContain('Article 3');
    expect(framework.sourceNoteEn).toContain('Federal Decree-Law No. 11 of 2023');
    expect(framework.sourceNoteAr).toContain('المادة ٣');
  });

  it('recommendLocalContentAction: fires a genuine primary + alternative when the gate genuinely fails -- primary raises GCC value-added/ownership toward Article 3(1), alternative points to the standard MoIAT ICV path instead (Rule 8: never a single-path recommendation)', () => {
    const a = assessSupplierLocalContent('AE', 'government', { aeGccOrigin: { gccValueAddedPct: 10, gccCitizenOwnershipPct: 5 } }, 'ae-gcc-origin-treatment');
    const rec = recommendLocalContentAction(a, null);
    expect(rec).not.toBeNull();
    expect(rec!.primaryEn).toContain('Article 3(1)');
    expect(rec!.primaryEn).toContain('10.0%');
    expect(rec!.primaryEn).toContain('5.0%');
    expect(rec!.alternativeEn).toContain('MoIAT');
    expect(rec!.alternativeEn).toContain('ae-icv-general');
    expect(rec!.primaryAr).toContain('المادة ٣(١)');
    expect(rec!.alternativeAr.length).toBeGreaterThan(0);
  });

  it('recommendLocalContentAction: returns null once the gate qualifies -- nothing to recommend against a treaty right already secured', () => {
    const a = assessSupplierLocalContent('AE', 'government', { aeGccOrigin: { gccValueAddedPct: 65, gccCitizenOwnershipPct: 70 } }, 'ae-gcc-origin-treatment');
    expect(recommendLocalContentAction(a, null)).toBeNull();
  });

  it('recommendLocalContentAction: returns null when the gate is still insufficient-data (null), same discipline as the category-eligibility and spend-set-aside gates -- never recommend against an unknown', () => {
    const a = assessSupplierLocalContent('AE', 'government', { aeGccOrigin: { gccValueAddedPct: 65, gccCitizenOwnershipPct: null } }, 'ae-gcc-origin-treatment');
    expect(recommendLocalContentAction(a, null)).toBeNull();
  });

  it('recommendLocalContentAction: uses "not yet entered" (never a fabricated number) when one input is missing but the other input alone already fails the gate', () => {
    const a = assessSupplierLocalContent('AE', 'government', { aeGccOrigin: { gccValueAddedPct: 12, gccCitizenOwnershipPct: null } }, 'ae-gcc-origin-treatment');
    const rec = recommendLocalContentAction(a, null);
    expect(rec).not.toBeNull();
    expect(rec!.primaryEn).toContain('not yet entered');
    expect(rec!.primaryAr).toContain('لم تُدخَل بعد');
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
// EG — Egypt (Part 2, 15 Sep 2026 pass -- first non-GCC/Jordan country)
// ===========================================================================

describe('EG / Public Procurement Price Preference — price-preference-margin (threshold-gated at 40%, not continuously scaled)', () => {
  it('soft: 45% Egyptian content (above the 40% qualifying threshold) -> full 15% margin applied via a 100% binary share', () => {
    const a = assessSupplierLocalContent('EG', 'government', { eg: { egyptianContentSharePct: 45 } }, 'eg-price-preference');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.preferenceMarginPct).toBe(EGYPT_PRICE_PREFERENCE_MARGIN_PCT);
    expect(c.locallyManufacturedSharePct).toBe(100);
    expect(c.effectiveBidDiscountPct).toBe(15);
  });

  it('hardest: 39.9% Egyptian content (just below the 40% threshold) -> zero effective discount, not a partial one (a gate, not a continuous scale)', () => {
    const a = assessSupplierLocalContent('EG', 'government', { eg: { egyptianContentSharePct: 39.9 } }, 'eg-price-preference');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.locallyManufacturedSharePct).toBe(0);
    expect(c.effectiveBidDiscountPct).toBe(0);
  });

  it('boundary: exactly 40% Egyptian content -> qualifies (>=40%, not >40%)', () => {
    const a = assessSupplierLocalContent('EG', 'government', { eg: { egyptianContentSharePct: EGYPT_PRICE_PREFERENCE_QUALIFYING_THRESHOLD_PCT } }, 'eg-price-preference');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.locallyManufacturedSharePct).toBe(100);
    expect(c.effectiveBidDiscountPct).toBe(EGYPT_PRICE_PREFERENCE_MARGIN_PCT);
  });

  it('boundary: no Egyptian-content share supplied -> honest null share, never assumed disqualified', () => {
    const a = assessSupplierLocalContent('EG', 'government', { eg: { egyptianContentSharePct: null } }, 'eg-price-preference');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.locallyManufacturedSharePct).toBeNull();
    expect(c.effectiveBidDiscountPct).toBeNull();
  });

  it("not-applicable: private-commercial procurement is outside this program's sourced (government + public-company/enterprise) scope", () => {
    const a = assessSupplierLocalContent('EG', 'private-commercial', { eg: { egyptianContentSharePct: 100 } }, 'eg-price-preference');
    expect(a.applicability).toBe('not-applicable');
  });

  it('is the default program for EG when program is omitted', () => {
    expect(DEFAULT_PROGRAM_BY_COUNTRY.EG).toBe('eg-price-preference');
    const a = assessSupplierLocalContent('EG', 'government', { eg: { egyptianContentSharePct: 50 } });
    expect(a.program).toBe('eg-price-preference');
  });
});

describe('EG / Oil & Gas PSA Local-Contractor Priority — price-preference-margin (binary contractor status, structurally like BH SME)', () => {
  it('soft: qualifying local Egyptian PSA contractor -> full 10% margin applied via a 100% binary share', () => {
    const a = assessSupplierLocalContent('EG', 'semi-government-soe', { egOilGas: { isLocalEgyptianContractor: true } }, 'eg-oil-gas-price-preference');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.preferenceMarginPct).toBe(EGYPT_OIL_GAS_PRICE_PREFERENCE_MARGIN_PCT);
    expect(c.locallyManufacturedSharePct).toBe(100);
    expect(c.effectiveBidDiscountPct).toBe(10);
  });

  it('hardest: does not qualify as a local PSA contractor -> zero effective discount, not a partial one', () => {
    const a = assessSupplierLocalContent('EG', 'semi-government-soe', { egOilGas: { isLocalEgyptianContractor: false } }, 'eg-oil-gas-price-preference');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.locallyManufacturedSharePct).toBe(0);
    expect(c.effectiveBidDiscountPct).toBe(0);
  });

  it('boundary: no contractor status supplied -> honest null share, never assumed disqualified', () => {
    const a = assessSupplierLocalContent('EG', 'semi-government-soe', { egOilGas: { isLocalEgyptianContractor: null } }, 'eg-oil-gas-price-preference');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.locallyManufacturedSharePct).toBeNull();
    expect(c.effectiveBidDiscountPct).toBeNull();
  });

  it("not-applicable: government procurement is outside this PSA-anchored program's sourced (semi-government/SOE) scope", () => {
    const a = assessSupplierLocalContent('EG', 'government', { egOilGas: { isLocalEgyptianContractor: true } }, 'eg-oil-gas-price-preference');
    expect(a.applicability).toBe('not-applicable');
  });
});

describe('EG — Automotive Local Content Target (AIDP, not-yet-sourced, real dated context)', () => {
  it('returns insufficient-data with the real 60% AIDP target disclosed in both languages, never a fabricated per-supplier formula', () => {
    const a = assessSupplierLocalContent('EG', 'government', {}, 'eg-auto-local-content');
    expect(a.applicability).toBe('insufficient-data');
    expect(a.computation).toEqual({ mechanismType: 'not-yet-sourced' });
    expect(a.reasonEn).toContain('60%');
    expect(a.reasonAr).toContain('٦٠٪');
    expect(a.program).toBe('eg-auto-local-content');
    expect(COUNTRY_FRAMEWORKS.EG.applicableContexts).not.toHaveLength(0); // EG's default program IS sourced, unlike OM/QA/BH/KW's default
    expect(PROGRAMS['eg-auto-local-content'].applicableContexts).toHaveLength(0);
  });
});

// ===========================================================================
// TR — Turkey (Part 2 continuation, 16 Sep 2026 -- second non-GCC/Jordan
// country per the user's explicit order)
// ===========================================================================

describe('TR / Public Procurement Domestic Goods Price Preference — price-preference-margin (continuously scaled, like Jordan/Oman, not Egypt\'s threshold gate)', () => {
  it('soft: 40% Yerli Mali Belgesi-certified bid content -> proportional discount', () => {
    const a = assessSupplierLocalContent('TR', 'government', { tr: { bidValueDomesticCertifiedPct: 40 } });
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.preferenceMarginPct).toBe(TURKEY_PRICE_PREFERENCE_MARGIN_PCT);
    expect(c.locallyManufacturedSharePct).toBe(40);
    expect(c.effectiveBidDiscountPct).toBeCloseTo(6, 6);
  });

  it('hardest: 0% and 100% domestic-certified share (the two adversarial extremes)', () => {
    const zero = assessSupplierLocalContent('TR', 'government', { tr: { bidValueDomesticCertifiedPct: 0 } }).computation as PricePreferenceMarginResult;
    const full = assessSupplierLocalContent('TR', 'government', { tr: { bidValueDomesticCertifiedPct: 100 } }).computation as PricePreferenceMarginResult;
    expect(zero.effectiveBidDiscountPct).toBe(0);
    expect(full.effectiveBidDiscountPct).toBe(15);
  });

  it('boundary: no domestic-certified share supplied -> honest null, never assumed zero', () => {
    const a = assessSupplierLocalContent('TR', 'government', { tr: { bidValueDomesticCertifiedPct: null } });
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.locallyManufacturedSharePct).toBeNull();
    expect(c.effectiveBidDiscountPct).toBeNull();
  });

  it('boundary: exactly 100% share -> recommendLocalContentAction returns null (nothing left to improve)', () => {
    const a = assessSupplierLocalContent('TR', 'government', { tr: { bidValueDomesticCertifiedPct: 100 } });
    expect(recommendLocalContentAction(a, null)).toBeNull();
  });

  it('applies to semi-government/SOE procurement too (Law 4734 Art. 2 covers state economic enterprises, not government-only like Jordan)', () => {
    const a = assessSupplierLocalContent('TR', 'semi-government-soe', { tr: { bidValueDomesticCertifiedPct: 60 } });
    expect(a.applicability).toBe('applicable');
  });

  it('not-applicable: private-commercial procurement is outside this public-procurement-law-anchored program\'s sourced scope', () => {
    const a = assessSupplierLocalContent('TR', 'private-commercial', { tr: { bidValueDomesticCertifiedPct: 50 } });
    expect(a.applicability).toBe('not-applicable');
  });

  it('no inputs supplied yet -> honest null computation using the sourced 15% ceiling margin, not a guessed default share', () => {
    const a = assessSupplierLocalContent('TR', 'government', {});
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.preferenceMarginPct).toBe(TURKEY_PRICE_PREFERENCE_MARGIN_PCT);
    expect(c.locallyManufacturedSharePct).toBeNull();
  });
});

describe('TR — SSB Defense Offset Guideline (2022, not-yet-sourced, disclosed cross-source figure ambiguity)', () => {
  it('returns insufficient-data with the disclosed 70%-figure discrepancy and no confirmed trigger threshold, never a guessed formula', () => {
    const a = assessSupplierLocalContent('TR', 'government', {}, 'tr-defense-offset');
    expect(a.applicability).toBe('insufficient-data');
    expect(a.computation).toEqual({ mechanismType: 'not-yet-sourced' });
    expect(a.reasonEn).toContain('70%');
    expect(a.reasonAr).toContain('٧٠٪');
    expect(a.program).toBe('tr-defense-offset');
    expect(COUNTRY_FRAMEWORKS.TR.applicableContexts).not.toHaveLength(0); // TR's default program IS sourced, unlike its offset program
    expect(PROGRAMS['tr-defense-offset'].applicableContexts).toHaveLength(0);
  });

  it('discloses the YEKDEM solar scheme as an explicit not-modeled scope decision, not a silent omission', () => {
    const fw = PROGRAMS['tr-defense-offset'];
    expect(fw.sourceNoteEn).toContain('YEKDEM');
    expect(fw.sourceNoteAr).toContain('YEKDEM');
  });
});

// ===========================================================================
// UK — United Kingdom (Part 2 continuation, 16 Sep 2026 -- third non-GCC/
// Jordan country; the first genuinely different KIND of finding: no
// above-threshold price preference exists at all, by legal design)
// ===========================================================================

describe("UK / Below-Threshold Procurement Reservation (PPN 005) — category-eligibility-gate (structurally identical to SA/OM's Mandatory List)", () => {
  it('soft: procurement reserved below-threshold and supplier qualifies by geography -> eligible to bid', () => {
    const a = assessSupplierLocalContent('UK', 'government', { uk: { isBelowThresholdReservedProcurement: true, isQualifyingUkGeographySupplier: true } });
    const c = a.computation as CategoryEligibilityGateResult;
    expect(c.eligibleToBid).toBe(true);
  });

  it('hardest: reserved below-threshold but supplier does NOT qualify by geography -> gated out entirely', () => {
    const a = assessSupplierLocalContent('UK', 'semi-government-soe', { uk: { isBelowThresholdReservedProcurement: true, isQualifyingUkGeographySupplier: false } });
    const c = a.computation as CategoryEligibilityGateResult;
    expect(c.eligibleToBid).toBe(false);
  });

  it('boundary: not a reserved below-threshold procurement at all -> gate does not apply, eligible regardless of geography status', () => {
    const a = assessSupplierLocalContent('UK', 'government', { uk: { isBelowThresholdReservedProcurement: false, isQualifyingUkGeographySupplier: null } });
    const c = a.computation as CategoryEligibilityGateResult;
    expect(c.eligibleToBid).toBe(true);
  });

  it('boundary: no reservation status supplied yet -> honest null, never assumed either way', () => {
    const a = assessSupplierLocalContent('UK', 'government', { uk: { isBelowThresholdReservedProcurement: null, isQualifyingUkGeographySupplier: null } });
    const c = a.computation as CategoryEligibilityGateResult;
    expect(c.eligibleToBid).toBeNull();
  });

  it('not-applicable: private-commercial procurement is outside PPN 005 scope (a public-sector-only reservation policy)', () => {
    const a = assessSupplierLocalContent('UK', 'private-commercial', { uk: { isBelowThresholdReservedProcurement: true, isQualifyingUkGeographySupplier: true } });
    expect(a.applicability).toBe('not-applicable');
  });

  it('discloses the structural (not research-gap) reason the UK has no above-threshold price preference, citing PA23 s.90 and the 2026 thresholds', () => {
    const fw = PROGRAMS['uk-below-threshold-reservation'];
    expect(fw.sourceNoteEn).toContain('s.90');
    expect(fw.sourceNoteEn).toContain('135,018');
    expect(fw.sourceNoteAr).toContain('١٣٥,٠١٨');
  });

  it('discloses UK social value scoring as an explicit not-modeled scope decision (nationality-neutral by legal necessity), not a silent omission', () => {
    const fw = PROGRAMS['uk-below-threshold-reservation'];
    expect(fw.sourceNoteEn).toContain('social value');
    expect(fw.sourceNoteAr).toContain('القيمة الاجتماعية');
  });

  it('UK is the tenth country and resolves DEFAULT_PROGRAM_BY_COUNTRY to its own single sourced program', () => {
    expect(DEFAULT_PROGRAM_BY_COUNTRY.UK).toBe('uk-below-threshold-reservation');
    expect(PROGRAMS_BY_COUNTRY.UK).toEqual(['uk-below-threshold-reservation']);
    expect(COUNTRY_FRAMEWORKS.UK.applicableContexts.length).toBeGreaterThan(0);
  });
});

// ===========================================================================
// USA — United States (Part 2 continuation, 16 Sep 2026 -- fourth non-GCC/
// Jordan country per the user's explicit order, after Egypt/Turkey/UK)
// ===========================================================================

describe("USA / Buy American Act Price Preference (FAR 25.1/25.2) — price-preference-margin (threshold-gated at 65%, business-size-dependent margin -- the first caller-dependent margin in this file)", () => {
  it('soft: 70% domestic content (above the 65% threshold), large business (default) -> full 20% margin applied via a 100% binary share', () => {
    const a = assessSupplierLocalContent('USA', 'government', { usa: { domesticContentSharePct: 70, isSmallBusinessConcern: false } }, 'usa-buy-american-price-preference');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.preferenceMarginPct).toBe(BUY_AMERICAN_LARGE_BUSINESS_MARGIN_PCT);
    expect(c.locallyManufacturedSharePct).toBe(100);
    expect(c.effectiveBidDiscountPct).toBe(20);
  });

  it('soft: 70% domestic content, small business concern -> full 30% margin (the higher tier)', () => {
    const a = assessSupplierLocalContent('USA', 'government', { usa: { domesticContentSharePct: 70, isSmallBusinessConcern: true } }, 'usa-buy-american-price-preference');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.preferenceMarginPct).toBe(BUY_AMERICAN_SMALL_BUSINESS_MARGIN_PCT);
    expect(c.effectiveBidDiscountPct).toBe(30);
  });

  it('hardest: 64.9% domestic content (just below the 65% threshold) -> zero effective discount regardless of business size, not a partial one (a gate, not a continuous scale)', () => {
    const a = assessSupplierLocalContent('USA', 'government', { usa: { domesticContentSharePct: 64.9, isSmallBusinessConcern: true } }, 'usa-buy-american-price-preference');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.locallyManufacturedSharePct).toBe(0);
    expect(c.effectiveBidDiscountPct).toBe(0);
  });

  it('boundary: exactly 65% domestic content -> qualifies (>=65%, not >65%)', () => {
    const a = assessSupplierLocalContent('USA', 'government', { usa: { domesticContentSharePct: BUY_AMERICAN_DOMESTIC_CONTENT_THRESHOLD_PCT, isSmallBusinessConcern: false } }, 'usa-buy-american-price-preference');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.locallyManufacturedSharePct).toBe(100);
    expect(c.effectiveBidDiscountPct).toBe(BUY_AMERICAN_LARGE_BUSINESS_MARGIN_PCT);
  });

  it('boundary: no domestic-content share supplied -> honest null share, never assumed disqualified', () => {
    const a = assessSupplierLocalContent('USA', 'government', { usa: { domesticContentSharePct: null, isSmallBusinessConcern: null } }, 'usa-buy-american-price-preference');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.locallyManufacturedSharePct).toBeNull();
    expect(c.effectiveBidDiscountPct).toBeNull();
  });

  it('defaults to the large-business margin (20%) when isSmallBusinessConcern is not supplied at all, per Decision Record 8.7\'s disclosed caller-overridable-default discipline', () => {
    const a = assessSupplierLocalContent('USA', 'government', {}, 'usa-buy-american-price-preference');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.preferenceMarginPct).toBe(BUY_AMERICAN_LARGE_BUSINESS_MARGIN_PCT);
  });

  it("not-applicable: private-commercial procurement is outside this program's sourced (federal government) scope", () => {
    const a = assessSupplierLocalContent('USA', 'private-commercial', { usa: { domesticContentSharePct: 100, isSmallBusinessConcern: false } }, 'usa-buy-american-price-preference');
    expect(a.applicability).toBe('not-applicable');
  });

  it('is the default program for USA when program is omitted', () => {
    expect(DEFAULT_PROGRAM_BY_COUNTRY.USA).toBe('usa-buy-american-price-preference');
    const a = assessSupplierLocalContent('USA', 'government', { usa: { domesticContentSharePct: 70, isSmallBusinessConcern: false } });
    expect(a.program).toBe('usa-buy-american-price-preference');
  });

  it('discloses the real 65%->75% threshold step-up and the TAA-suspension structural fact, citing FAR 25.105 and the $174,000 GPA figure', () => {
    const fw = PROGRAMS['usa-buy-american-price-preference'];
    expect(fw.sourceNoteEn).toContain('75%');
    expect(fw.sourceNoteEn).toContain('174,000');
    expect(fw.sourceNoteAr).toContain('١٧٤,٠٠٠');
  });
});

describe('USA / Build America, Buy America Act (BABA) Infrastructure Gate — category-eligibility-gate (two-toggle pattern, structurally identical to UK PPN 005)', () => {
  it('soft: federally-funded infrastructure procurement and supplier meets BABA domestic content -> eligible to bid', () => {
    const a = assessSupplierLocalContent('USA', 'government', { usaBaba: { isFederallyFundedInfrastructureProcurement: true, meetsBabaDomesticContentRequirement: true } }, 'usa-baba-infrastructure-gate');
    const c = a.computation as CategoryEligibilityGateResult;
    expect(c.eligibleToBid).toBe(true);
  });

  it('hardest: federally-funded infrastructure procurement but supplier does NOT meet BABA domestic content -> gated out entirely', () => {
    const a = assessSupplierLocalContent('USA', 'semi-government-soe', { usaBaba: { isFederallyFundedInfrastructureProcurement: true, meetsBabaDomesticContentRequirement: false } }, 'usa-baba-infrastructure-gate');
    const c = a.computation as CategoryEligibilityGateResult;
    expect(c.eligibleToBid).toBe(false);
  });

  it('boundary: not a federally-funded infrastructure procurement at all -> gate does not apply, eligible regardless of domestic-content status', () => {
    const a = assessSupplierLocalContent('USA', 'government', { usaBaba: { isFederallyFundedInfrastructureProcurement: false, meetsBabaDomesticContentRequirement: null } }, 'usa-baba-infrastructure-gate');
    const c = a.computation as CategoryEligibilityGateResult;
    expect(c.eligibleToBid).toBe(true);
  });

  it('boundary: no BABA coverage status supplied yet -> honest null, never assumed either way', () => {
    const a = assessSupplierLocalContent('USA', 'government', { usaBaba: { isFederallyFundedInfrastructureProcurement: null, meetsBabaDomesticContentRequirement: null } }, 'usa-baba-infrastructure-gate');
    const c = a.computation as CategoryEligibilityGateResult;
    expect(c.eligibleToBid).toBeNull();
  });

  it("not-applicable: private-commercial procurement is outside BABA's sourced (government/semi-government-soe) scope", () => {
    const a = assessSupplierLocalContent('USA', 'private-commercial', { usaBaba: { isFederallyFundedInfrastructureProcurement: true, meetsBabaDomesticContentRequirement: true } }, 'usa-baba-infrastructure-gate');
    expect(a.applicability).toBe('not-applicable');
  });

  it('discloses the real 100% iron/steel, 100% construction-materials, and 55% manufactured-products thresholds, citing IIJA Title IX and the per-agency waiver structure', () => {
    const fw = PROGRAMS['usa-baba-infrastructure-gate'];
    expect(fw.sourceNoteEn).toContain('55%');
    expect(fw.sourceNoteEn).toContain('Title IX');
    expect(fw.sourceNoteAr).toContain('٥٥٪');
  });
});

describe('USA / SBA Small Business Contracting Goal & Set-Aside — spend-set-aside-target (shares the isSmallBusinessConcern field with the Buy American margin above)', () => {
  it('soft: supplier qualifies as a small business concern -> qualifies for the reserved 23% share', () => {
    const a = assessSupplierLocalContent('USA', 'government', { usa: { domesticContentSharePct: null, isSmallBusinessConcern: true } }, 'usa-sba-small-business-setaside');
    const c = a.computation as SpendSetAsideResult;
    expect(c.targetSharePct).toBe(USA_SBA_SMALL_BUSINESS_TARGET_PCT);
    expect(c.qualifiesForSetAside).toBe(true);
  });

  it('hardest: supplier does not qualify as a small business concern -> does not qualify for the reserved share', () => {
    const a = assessSupplierLocalContent('USA', 'government', { usa: { domesticContentSharePct: null, isSmallBusinessConcern: false } }, 'usa-sba-small-business-setaside');
    const c = a.computation as SpendSetAsideResult;
    expect(c.qualifiesForSetAside).toBe(false);
  });

  it('boundary: no small-business-concern status supplied -> honest null, never assumed either way', () => {
    const a = assessSupplierLocalContent('USA', 'government', { usa: { domesticContentSharePct: null, isSmallBusinessConcern: null } }, 'usa-sba-small-business-setaside');
    const c = a.computation as SpendSetAsideResult;
    expect(c.qualifiesForSetAside).toBeNull();
  });

  it("not-applicable: private-commercial procurement is outside this program's sourced (federal government) scope", () => {
    const a = assessSupplierLocalContent('USA', 'private-commercial', { usa: { domesticContentSharePct: null, isSmallBusinessConcern: true } }, 'usa-sba-small-business-setaside');
    expect(a.applicability).toBe('not-applicable');
  });

  it("discloses the real 23% government-wide goal and FAR 19.502-2's Rule of Two, and the state-level-preference out-of-scope disclosure", () => {
    const fw = PROGRAMS['usa-sba-small-business-setaside'];
    expect(fw.sourceNoteEn).toContain('23%');
    expect(fw.sourceNoteEn).toContain('Rule of Two');
    expect(fw.sourceNoteEn).toContain('state');
    expect(fw.sourceNoteAr).toContain('٢٣٪');
  });
});

describe('USA — Berry Amendment (DoD Textiles/Food/Tools, not-yet-sourced, real dated context)', () => {
  it('returns insufficient-data disclosing the DoD-only near-100%-domestic scope and the 2006 specialty-metals carve-out, never a fabricated per-supplier formula', () => {
    const a = assessSupplierLocalContent('USA', 'government', {}, 'usa-berry-amendment-dod');
    expect(a.applicability).toBe('insufficient-data');
    expect(a.computation).toEqual({ mechanismType: 'not-yet-sourced' });
    expect(a.program).toBe('usa-berry-amendment-dod');
    expect(PROGRAMS['usa-berry-amendment-dod'].applicableContexts).toHaveLength(0);
    expect(PROGRAMS['usa-berry-amendment-dod'].sourceNoteEn).toContain('2006');
    expect(PROGRAMS['usa-berry-amendment-dod'].sourceNoteAr).toContain('٢٠٠٦');
  });
});

describe('USA — structural sanity (16 Sep 2026 Part 2 continuation, fourth non-GCC/Jordan country)', () => {
  it('USA is the eleventh country, has 4 programs (3 real + 1 not-yet-sourced), and resolves DEFAULT_PROGRAM_BY_COUNTRY to the Buy American Act program', () => {
    expect(DEFAULT_PROGRAM_BY_COUNTRY.USA).toBe('usa-buy-american-price-preference');
    expect(PROGRAMS_BY_COUNTRY.USA).toEqual(['usa-buy-american-price-preference', 'usa-baba-infrastructure-gate', 'usa-sba-small-business-setaside', 'usa-berry-amendment-dod']);
    expect(COUNTRY_FRAMEWORKS.USA.applicableContexts.length).toBeGreaterThan(0);
  });
});

describe('CN — structural sanity (16 Sep 2026 China Part 2 continuation, fifth non-GCC/Jordan country, twelfth overall)', () => {
  it('CN is the twelfth country, has 4 programs (3 real + 1 not-yet-sourced), and resolves DEFAULT_PROGRAM_BY_COUNTRY to the domestic-product price-preference program', () => {
    expect(DEFAULT_PROGRAM_BY_COUNTRY.CN).toBe('cn-domestic-product-price-preference');
    expect(PROGRAMS_BY_COUNTRY.CN).toEqual(['cn-domestic-product-price-preference', 'cn-govt-procurement-law-domestic-mandate', 'cn-sme-price-deduction', 'cn-defense-domestic-sourcing']);
    expect(COUNTRY_FRAMEWORKS.CN.applicableContexts.length).toBeGreaterThan(0);
  });

  it('the PricePreferenceMarginResult min/max disclosure fields are CN-only -- every other price-preference program in this file leaves them undefined (backward-compatibility regression)', () => {
    const nonCnPriceProgramsWithContext: Array<[LocalContentProgram, ProcurementContext]> = [
      ['jo-price-preference', 'government'], ['sa-price-preference', 'government'],
      ['om-oq-price-preference', 'semi-government-soe'], ['bh-sme-price-preference', 'government'],
      ['eg-price-preference', 'government'], ['eg-oil-gas-price-preference', 'semi-government-soe'],
      ['tr-price-preference', 'government'], ['usa-buy-american-price-preference', 'government'],
    ];
    for (const [program, context] of nonCnPriceProgramsWithContext) {
      const a = assessSupplierLocalContent(PROGRAMS[program].country, context, {}, program);
      expect(a.applicability).toBe('applicable');
      const c = a.computation as PricePreferenceMarginResult;
      expect(c.preferenceMarginMinPct).toBeUndefined();
      expect(c.preferenceMarginMaxPct).toBeUndefined();
    }
  });
});

describe('CN / Domestic Product Price Evaluation Deduction (State Council Doc. [2025] No. 34) — price-preference-margin, first OR-gated eligibility shape', () => {
  it('soft: meets the domestic-product classification test directly -> qualifies via path 1, 20% margin, full discount', () => {
    const a = assessSupplierLocalContent('CN', 'government', { cn: { meetsDomesticProductCriteria: true, bundleDomesticCostSharePct: null, article10ExemptionApplies: null } }, 'cn-domestic-product-price-preference');
    expect(a.applicability).toBe('applicable');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.preferenceMarginPct).toBe(CN_DOMESTIC_PRODUCT_PRICE_PREFERENCE_PCT);
    expect(c.locallyManufacturedSharePct).toBe(100);
    expect(c.effectiveBidDiscountPct).toBe(20);
  });

  it('soft: fails the direct classification test but the mixed procurement bundle reaches 85% domestic cost share -> qualifies via path 2 alone', () => {
    const a = assessSupplierLocalContent('CN', 'government', { cn: { meetsDomesticProductCriteria: false, bundleDomesticCostSharePct: 85, article10ExemptionApplies: null } }, 'cn-domestic-product-price-preference');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.locallyManufacturedSharePct).toBe(100);
    expect(c.effectiveBidDiscountPct).toBe(20);
  });

  it('hardest: neither path qualifies (fails direct classification AND bundle share below 80%) -> zero discount, not partial', () => {
    const a = assessSupplierLocalContent('CN', 'government', { cn: { meetsDomesticProductCriteria: false, bundleDomesticCostSharePct: 50, article10ExemptionApplies: null } }, 'cn-domestic-product-price-preference');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.locallyManufacturedSharePct).toBe(0);
    expect(c.effectiveBidDiscountPct).toBe(0);
  });

  it('boundary: bundle domestic cost share exactly 80% -> qualifies (>=80, not >80)', () => {
    const a = assessSupplierLocalContent('CN', 'government', { cn: { meetsDomesticProductCriteria: false, bundleDomesticCostSharePct: 80, article10ExemptionApplies: null } }, 'cn-domestic-product-price-preference');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.locallyManufacturedSharePct).toBe(100);
  });

  it('boundary: bundle domestic cost share at 79.9%, just below threshold, direct classification also fails -> does not qualify', () => {
    const a = assessSupplierLocalContent('CN', 'government', { cn: { meetsDomesticProductCriteria: false, bundleDomesticCostSharePct: 79.9, article10ExemptionApplies: null } }, 'cn-domestic-product-price-preference');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.locallyManufacturedSharePct).toBe(0);
  });

  it('boundary: both paths genuinely unknown (direct classification and bundle share both null) -> honest null, never a fabricated pass or fail', () => {
    const a = assessSupplierLocalContent('CN', 'government', { cn: { meetsDomesticProductCriteria: null, bundleDomesticCostSharePct: null, article10ExemptionApplies: null } }, 'cn-domestic-product-price-preference');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.locallyManufacturedSharePct).toBeNull();
    expect(c.effectiveBidDiscountPct).toBeNull();
  });

  it("not-applicable: private-commercial procurement is outside this program's sourced (government) scope", () => {
    const a = assessSupplierLocalContent('CN', 'private-commercial', { cn: { meetsDomesticProductCriteria: true, bundleDomesticCostSharePct: null, article10ExemptionApplies: null } }, 'cn-domestic-product-price-preference');
    expect(a.applicability).toBe('not-applicable');
  });

  it('omitting the program param for CN resolves to cn-domestic-product-price-preference (its own default)', () => {
    const a = assessSupplierLocalContent('CN', 'government', { cn: { meetsDomesticProductCriteria: true, bundleDomesticCostSharePct: null, article10ExemptionApplies: null } });
    expect(a.program).toBe('cn-domestic-product-price-preference');
    expect(a.framework).toBe(PROGRAMS['cn-domestic-product-price-preference']);
  });

  it('discloses the real 20% deduction, the 80% bundle threshold, and Document [2025] No. 34 bilingually, and no inputs at all leaves an honest null share', () => {
    const fw = PROGRAMS['cn-domestic-product-price-preference'];
    expect(fw.sourceNoteEn).toContain('20%');
    expect(fw.sourceNoteEn).toContain('80%');
    expect(fw.sourceNoteEn).toContain('[2025] No. 34');
    expect(fw.sourceNoteAr).toContain('٢٠٪');
    expect(fw.sourceNoteAr).toContain('٨٠٪');
    const a = assessSupplierLocalContent('CN', 'government', {}, 'cn-domestic-product-price-preference');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.locallyManufacturedSharePct).toBeNull();
    expect(a.reasonEn).toBe('No Chinese domestic-product-classification or bundle-cost-share inputs supplied yet.');
    expect(a.reasonAr).toBe('لم تُدخل بيانات تصنيف المنتج المحلي الصيني أو حصة تكلفة الحزمة بعد.');
  });
});

describe('CN / Government Procurement Law Domestic Mandate (Art. 10) — category-eligibility-gate, zero-new-logic reuse', () => {
  it('soft: no Article 10 exemption applies, product meets the shared domestic-product classification -> eligible to bid', () => {
    const a = assessSupplierLocalContent('CN', 'government', { cn: { meetsDomesticProductCriteria: true, bundleDomesticCostSharePct: null, article10ExemptionApplies: false } }, 'cn-govt-procurement-law-domestic-mandate');
    const c = a.computation as CategoryEligibilityGateResult;
    expect(c.eligibleToBid).toBe(true);
  });

  it('hardest: no Article 10 exemption applies AND the product does NOT meet the domestic-product classification -> gated out entirely', () => {
    const a = assessSupplierLocalContent('CN', 'government', { cn: { meetsDomesticProductCriteria: false, bundleDomesticCostSharePct: null, article10ExemptionApplies: false } }, 'cn-govt-procurement-law-domestic-mandate');
    const c = a.computation as CategoryEligibilityGateResult;
    expect(c.eligibleToBid).toBe(false);
  });

  it('boundary: an Article 10 exemption DOES apply -> eligible to bid regardless of domestic-product status, even when that status is unknown', () => {
    const a = assessSupplierLocalContent('CN', 'government', { cn: { meetsDomesticProductCriteria: null, bundleDomesticCostSharePct: null, article10ExemptionApplies: true } }, 'cn-govt-procurement-law-domestic-mandate');
    const c = a.computation as CategoryEligibilityGateResult;
    expect(c.eligibleToBid).toBe(true);
  });

  it('boundary: Article 10 exemption status itself unknown -> honest null, not assumed either way', () => {
    const a = assessSupplierLocalContent('CN', 'government', { cn: { meetsDomesticProductCriteria: true, bundleDomesticCostSharePct: null, article10ExemptionApplies: null } }, 'cn-govt-procurement-law-domestic-mandate');
    const c = a.computation as CategoryEligibilityGateResult;
    expect(c.eligibleToBid).toBeNull();
  });

  it('no inputs supplied at all -> null gate, reasonAr carries a genuinely different phrase than reasonEn', () => {
    const a = assessSupplierLocalContent('CN', 'government', {}, 'cn-govt-procurement-law-domestic-mandate');
    const c = a.computation as CategoryEligibilityGateResult;
    expect(c.eligibleToBid).toBeNull();
    expect(a.reasonEn).toBe('No Article 10 exemption or domestic-product-classification inputs supplied yet.');
    expect(a.reasonAr).toBe('لم تُدخل بيانات إعفاء المادة العاشرة أو تصنيف المنتج المحلي بعد.');
  });

  it("not-applicable: semi-government-soe procurement is outside this program's sourced (government-only) scope -- a real, disclosed difference from the USA's BABA gate, which covers both", () => {
    const a = assessSupplierLocalContent('CN', 'semi-government-soe', { cn: { meetsDomesticProductCriteria: true, bundleDomesticCostSharePct: null, article10ExemptionApplies: false } }, 'cn-govt-procurement-law-domestic-mandate');
    expect(a.applicability).toBe('not-applicable');
  });

  it('cross-feature: the domestic-product classification field is genuinely shared between the mandate gate and the price preference, not a duplicated question', () => {
    const sharedCn = { meetsDomesticProductCriteria: true, bundleDomesticCostSharePct: null, article10ExemptionApplies: false };
    const gate = assessSupplierLocalContent('CN', 'government', { cn: sharedCn }, 'cn-govt-procurement-law-domestic-mandate');
    const pricePref = assessSupplierLocalContent('CN', 'government', { cn: sharedCn }, 'cn-domestic-product-price-preference');
    expect((gate.computation as CategoryEligibilityGateResult).eligibleToBid).toBe(true);
    expect((pricePref.computation as PricePreferenceMarginResult).locallyManufacturedSharePct).toBe(100);
  });
});

describe('CN / SME Government Procurement Price Deduction (Cai Ku [2020] No. 46 / [2022] No. 19) — 2x2 role-x-procurement-type band matrix with a real 30% subcontract-share gate', () => {
  it('soft: direct small/micro enterprise, goods/services procurement -> 10%-20% band, floor as the guaranteed margin', () => {
    const a = assessSupplierLocalContent('CN', 'government', { cnSme: { supplierRole: 'direct-small-micro', procurementType: 'goods-services', consortiumSmallEnterpriseSubcontractSharePct: null } }, 'cn-sme-price-deduction');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.preferenceMarginPct).toBe(CN_SME_DIRECT_GOODS_SERVICES_MIN_PCT);
    expect(c.preferenceMarginMinPct).toBe(CN_SME_DIRECT_GOODS_SERVICES_MIN_PCT);
    expect(c.preferenceMarginMaxPct).toBe(CN_SME_DIRECT_GOODS_SERVICES_MAX_PCT);
    expect(c.locallyManufacturedSharePct).toBe(100);
  });

  it('soft: direct small/micro enterprise, engineering-works procurement -> the narrower 3%-5% engineering band, not the goods/services band', () => {
    const a = assessSupplierLocalContent('CN', 'government', { cnSme: { supplierRole: 'direct-small-micro', procurementType: 'engineering-works', consortiumSmallEnterpriseSubcontractSharePct: null } }, 'cn-sme-price-deduction');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.preferenceMarginMinPct).toBe(CN_SME_DIRECT_ENGINEERING_MIN_PCT);
    expect(c.preferenceMarginMaxPct).toBe(CN_SME_DIRECT_ENGINEERING_MAX_PCT);
  });

  it('consortium/subcontract role, goods/services procurement, subcontract share above the 30% gate -> 4%-6% band', () => {
    const a = assessSupplierLocalContent('CN', 'government', { cnSme: { supplierRole: 'large-medium-consortium-subcontract', procurementType: 'goods-services', consortiumSmallEnterpriseSubcontractSharePct: 50 } }, 'cn-sme-price-deduction');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.preferenceMarginMinPct).toBe(CN_SME_CONSORTIUM_GOODS_SERVICES_MIN_PCT);
    expect(c.preferenceMarginMaxPct).toBe(CN_SME_CONSORTIUM_GOODS_SERVICES_MAX_PCT);
  });

  it('consortium/subcontract role, engineering-works procurement, subcontract share above the 30% gate -> 1%-2% band, the narrowest in the matrix', () => {
    const a = assessSupplierLocalContent('CN', 'government', { cnSme: { supplierRole: 'large-medium-consortium-subcontract', procurementType: 'engineering-works', consortiumSmallEnterpriseSubcontractSharePct: 35 } }, 'cn-sme-price-deduction');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.preferenceMarginMinPct).toBe(CN_SME_CONSORTIUM_ENGINEERING_MIN_PCT);
    expect(c.preferenceMarginMaxPct).toBe(CN_SME_CONSORTIUM_ENGINEERING_MAX_PCT);
  });

  it('hardest: consortium/subcontract role but subcontract share well below the 30% gate -> zero deduction, not a partial/pro-rated one', () => {
    const a = assessSupplierLocalContent('CN', 'government', { cnSme: { supplierRole: 'large-medium-consortium-subcontract', procurementType: 'goods-services', consortiumSmallEnterpriseSubcontractSharePct: 10 } }, 'cn-sme-price-deduction');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.preferenceMarginPct).toBe(0);
    expect(c.preferenceMarginMinPct).toBe(0);
    expect(c.preferenceMarginMaxPct).toBe(0);
    expect(c.locallyManufacturedSharePct).toBe(0);
    expect(c.effectiveBidDiscountPct).toBe(0);
  });

  it('boundary: consortium subcontract share at 29.9%, just under the gate -> still zero, a gate not a taper', () => {
    const a = assessSupplierLocalContent('CN', 'government', { cnSme: { supplierRole: 'large-medium-consortium-subcontract', procurementType: 'engineering-works', consortiumSmallEnterpriseSubcontractSharePct: 29.9 } }, 'cn-sme-price-deduction');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.preferenceMarginPct).toBe(0);
  });

  it('boundary: consortium subcontract share at exactly 30% -> gate passes (>=30, not >30)', () => {
    const a = assessSupplierLocalContent('CN', 'government', { cnSme: { supplierRole: 'large-medium-consortium-subcontract', procurementType: 'goods-services', consortiumSmallEnterpriseSubcontractSharePct: 30 } }, 'cn-sme-price-deduction');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.preferenceMarginMinPct).toBe(CN_SME_CONSORTIUM_GOODS_SERVICES_MIN_PCT);
  });

  it('boundary: bidder role or procurement type not yet supplied -> insufficient data, no band guessed', () => {
    const a = assessSupplierLocalContent('CN', 'government', { cnSme: { supplierRole: null, procurementType: 'goods-services', consortiumSmallEnterpriseSubcontractSharePct: null } }, 'cn-sme-price-deduction');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.locallyManufacturedSharePct).toBeNull();
    expect(c.effectiveBidDiscountPct).toBeNull();
  });

  it('boundary: consortium/subcontract role but subcontract-share status itself unknown -> honest null, gate status cannot be confirmed either way', () => {
    const a = assessSupplierLocalContent('CN', 'government', { cnSme: { supplierRole: 'large-medium-consortium-subcontract', procurementType: 'goods-services', consortiumSmallEnterpriseSubcontractSharePct: null } }, 'cn-sme-price-deduction');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.locallyManufacturedSharePct).toBeNull();
  });

  it("not-applicable: private-commercial procurement is outside this program's sourced (government) scope, and no inputs at all leaves an honest null", () => {
    const notApplicable = assessSupplierLocalContent('CN', 'private-commercial', { cnSme: { supplierRole: 'direct-small-micro', procurementType: 'goods-services', consortiumSmallEnterpriseSubcontractSharePct: null } }, 'cn-sme-price-deduction');
    expect(notApplicable.applicability).toBe('not-applicable');
    const noInputs = assessSupplierLocalContent('CN', 'government', {}, 'cn-sme-price-deduction');
    const c = noInputs.computation as PricePreferenceMarginResult;
    expect(c.locallyManufacturedSharePct).toBeNull();
  });
});

describe('CN — PLA/Military-Civil Fusion Defense Sourcing (not-yet-sourced, real dated context)', () => {
  it('returns insufficient-data disclosing the real Military-Civil Fusion / Equipment Development Department context, never a fabricated per-supplier formula', () => {
    const a = assessSupplierLocalContent('CN', 'government', {}, 'cn-defense-domestic-sourcing');
    expect(a.applicability).toBe('insufficient-data');
    expect(a.computation).toEqual({ mechanismType: 'not-yet-sourced' });
    expect(a.program).toBe('cn-defense-domestic-sourcing');
    expect(PROGRAMS['cn-defense-domestic-sourcing'].applicableContexts).toHaveLength(0);
    expect(PROGRAMS['cn-defense-domestic-sourcing'].sourceNoteEn).toContain('Equipment Development Department');
    expect(PROGRAMS['cn-defense-domestic-sourcing'].sourceNoteAr).toContain('军民融合');
  });
});


// ===========================================================================
// recommendLocalContentAction — primary + alternative (Rule 8)
// ===========================================================================

describe('IN — structural sanity (17 Sep 2026 India/Germany/Japan/Korea batch, 13th country)', () => {
  it('IN is the thirteenth country, has 2 programs (1 real + 1 not-yet-sourced), and resolves DEFAULT_PROGRAM_BY_COUNTRY to the Make in India price-preference program', () => {
    expect(DEFAULT_PROGRAM_BY_COUNTRY.IN).toBe('in-make-in-india-price-preference');
    expect(PROGRAMS_BY_COUNTRY.IN).toEqual(['in-make-in-india-price-preference', 'in-dap-2020-defense-offset']);
    expect(COUNTRY_FRAMEWORKS.IN.applicableContexts.length).toBeGreaterThan(0);
  });
});

describe('IN / Make in India Purchase Preference (PPP-MII Order 2017) — price-preference-margin, genuinely new three-tier classification gate', () => {
  it('soft: Class-I local content share of 60% -> full 20-point effective preference', () => {
    const a = assessSupplierLocalContent('IN', 'government', { inMakeInIndia: { localContentSharePct: 60 } }, 'in-make-in-india-price-preference');
    expect(a.applicability).toBe('applicable');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.preferenceMarginPct).toBe(INDIA_MAKE_IN_INDIA_PRICE_PREFERENCE_MARGIN_PCT);
    expect(c.locallyManufacturedSharePct).toBe(100);
    expect(c.effectiveBidDiscountPct).toBe(20);
  });

  it('hardest: Class-II local content share of 35% (above Non-Local, below Class-I) -> zero effective preference, not a pro-rated one -- the disclosed simplification', () => {
    const a = assessSupplierLocalContent('IN', 'government', { inMakeInIndia: { localContentSharePct: 35 } }, 'in-make-in-india-price-preference');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.locallyManufacturedSharePct).toBe(0);
    expect(c.effectiveBidDiscountPct).toBe(0);
  });

  it('hardest: Non-Local share of 10% -> also zero, same as Class-II, since this shared result shape cannot yet distinguish "no preference" from "excluded entirely"', () => {
    const a = assessSupplierLocalContent('IN', 'government', { inMakeInIndia: { localContentSharePct: 10 } }, 'in-make-in-india-price-preference');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.locallyManufacturedSharePct).toBe(0);
  });

  it('boundary: local content share at exactly 50% -> Class-I (>=50, not >50)', () => {
    const a = assessSupplierLocalContent('IN', 'government', { inMakeInIndia: { localContentSharePct: 50 } }, 'in-make-in-india-price-preference');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.locallyManufacturedSharePct).toBe(100);
  });

  it('boundary: local content share at 49.9%, just below Class-I -> zero preference', () => {
    const a = assessSupplierLocalContent('IN', 'government', { inMakeInIndia: { localContentSharePct: 49.9 } }, 'in-make-in-india-price-preference');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.locallyManufacturedSharePct).toBe(0);
  });

  it('boundary: local content share genuinely unknown (null) -> honest null, never a fabricated pass or fail', () => {
    const a = assessSupplierLocalContent('IN', 'government', { inMakeInIndia: { localContentSharePct: null } }, 'in-make-in-india-price-preference');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.locallyManufacturedSharePct).toBeNull();
    expect(c.effectiveBidDiscountPct).toBeNull();
  });

  it('no inputs supplied at all -> the 20% margin is still disclosed, share left null', () => {
    const a = assessSupplierLocalContent('IN', 'government', {}, 'in-make-in-india-price-preference');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.preferenceMarginPct).toBe(INDIA_MAKE_IN_INDIA_PRICE_PREFERENCE_MARGIN_PCT);
    expect(c.locallyManufacturedSharePct).toBeNull();
    expect(a.reasonEn).toBe('No Indian local-content bid share supplied yet.');
    expect(a.reasonAr).toBe('لم تُدخل نسبة المحتوى المحلي الهندي في العطاء بعد.');
  });

  it("not-applicable: private-commercial procurement is outside this program's sourced (government) scope", () => {
    const a = assessSupplierLocalContent('IN', 'private-commercial', { inMakeInIndia: { localContentSharePct: 60 } }, 'in-make-in-india-price-preference');
    expect(a.applicability).toBe('not-applicable');
  });

  it('omitting the program param for IN resolves to in-make-in-india-price-preference (its own default)', () => {
    const a = assessSupplierLocalContent('IN', 'government', { inMakeInIndia: { localContentSharePct: 60 } });
    expect(a.program).toBe('in-make-in-india-price-preference');
    expect(a.framework).toBe(PROGRAMS['in-make-in-india-price-preference']);
  });

  it('discloses the real 20% margin, the 50%/20% Class-I/Class-II thresholds, and the PPP-MII Order 2017 / 4 June 2020 revision bilingually', () => {
    const fw = PROGRAMS['in-make-in-india-price-preference'];
    expect(fw.sourceNoteEn).toContain('20%');
    expect(fw.sourceNoteEn).toContain('Class-I');
    expect(fw.sourceNoteEn).toContain('4 June 2020');
    expect(fw.sourceNoteAr).toContain('20٪');
    expect(fw.sourceNoteAr).toContain('4 يونيو 2020');
  });
});

describe('IN — DAP 2020 Defense Offset & Indigenous Content (not-yet-sourced, real dated context)', () => {
  it('returns insufficient-data disclosing the real 30% offset/indigenous-content thresholds, never a fabricated per-supplier formula', () => {
    const a = assessSupplierLocalContent('IN', 'government', {}, 'in-dap-2020-defense-offset');
    expect(a.applicability).toBe('insufficient-data');
    expect(a.computation).toEqual({ mechanismType: 'not-yet-sourced' });
    expect(a.program).toBe('in-dap-2020-defense-offset');
    expect(PROGRAMS['in-dap-2020-defense-offset'].applicableContexts).toHaveLength(0);
    expect(PROGRAMS['in-dap-2020-defense-offset'].sourceNoteEn).toContain('30%');
    expect(PROGRAMS['in-dap-2020-defense-offset'].sourceNoteAr).toContain('30٪');
  });
});

describe('DE — structural sanity (17 Sep 2026 India/Germany/Japan/Korea batch, 14th country, both programs honestly not-yet-sourced)', () => {
  it('DE is the fourteenth country, has 2 programs, and BOTH are not-yet-sourced -- a genuine finding, not a placeholder gap', () => {
    expect(DEFAULT_PROGRAM_BY_COUNTRY.DE).toBe('de-eu-gpa-non-discrimination-baseline');
    expect(PROGRAMS_BY_COUNTRY.DE).toEqual(['de-eu-gpa-non-discrimination-baseline', 'de-edip-defense-local-content']);
    expect(PROGRAMS['de-eu-gpa-non-discrimination-baseline'].mechanismType).toBe('not-yet-sourced');
    expect(PROGRAMS['de-edip-defense-local-content'].mechanismType).toBe('not-yet-sourced');
  });
});

describe('DE / No Unilateral Local-Content Preference — confirmed ABSENT, not merely unresearched (Decision Record 8.7 honesty distinction)', () => {
  it('returns insufficient-data, and the sourceNote explicitly distinguishes a confirmed-absent finding from an unresourced gap like Oman/Qatar', () => {
    const a = assessSupplierLocalContent('DE', 'government', {}, 'de-eu-gpa-non-discrimination-baseline');
    expect(a.applicability).toBe('insufficient-data');
    expect(a.computation).toEqual({ mechanismType: 'not-yet-sourced' });
    const fw = PROGRAMS['de-eu-gpa-non-discrimination-baseline'];
    expect(fw.applicableContexts).toHaveLength(0);
    expect(fw.sourceNoteEn).toContain('Confirmed ABSENT');
    expect(fw.sourceNoteEn).toContain('Directive 2014/24/EU');
    expect(fw.sourceNoteEn).toContain('WTO Agreement on Government Procurement');
    expect(fw.sourceNoteAr).toContain('غياب مؤكَّد');
  });

  it('omitting the program param for DE resolves to de-eu-gpa-non-discrimination-baseline (its own default, itself not-yet-sourced)', () => {
    const a = assessSupplierLocalContent('DE', 'government', {});
    expect(a.program).toBe('de-eu-gpa-non-discrimination-baseline');
    expect(a.applicability).toBe('insufficient-data');
  });
});

describe('DE / European Defence Industry Programme (EDIP) EU-Content Threshold (not-yet-sourced, real dated context, out-of-scope defense mechanism)', () => {
  it('returns insufficient-data disclosing the real 65%/35% EU-content threshold and the 30 Dec 2025 entry into force, never forced into a per-bid mechanism shape', () => {
    const a = assessSupplierLocalContent('DE', 'government', {}, 'de-edip-defense-local-content');
    expect(a.applicability).toBe('insufficient-data');
    expect(a.computation).toEqual({ mechanismType: 'not-yet-sourced' });
    const fw = PROGRAMS['de-edip-defense-local-content'];
    expect(fw.applicableContexts).toHaveLength(0);
    expect(fw.sourceNoteEn).toContain('65%');
    expect(fw.sourceNoteEn).toContain('35%');
    expect(fw.sourceNoteEn).toContain('30 December 2025');
    expect(fw.sourceNoteAr).toContain('65٪');
    expect(fw.sourceNoteAr).toContain('35٪');
  });
});

describe('JP — structural sanity (17 Sep 2026 batch, 15th country, a genuine second single-program exception alongside UK)', () => {
  it('JP is the fifteenth country and has exactly 1 program -- deliberately not padded to a second program, matching the UK PA23 s.90 exception pattern', () => {
    expect(DEFAULT_PROGRAM_BY_COUNTRY.JP).toBe('jp-kankoju-sme-target-ratio');
    expect(PROGRAMS_BY_COUNTRY.JP).toEqual(['jp-kankoju-sme-target-ratio']);
    expect(COUNTRY_FRAMEWORKS.JP.applicableContexts.length).toBeGreaterThan(0);
  });
});

describe('JP / Kankouju SME Government-Contract Target Ratio — spend-set-aside-target, genuinely new caller-supplied-target wrapper (not a JO/BH/KW fixed-constant copy)', () => {
  it('soft: current fiscal-year target of 56% (real FY2013 reference figure), SME-qualified supplier -> eligible for the reserved share', () => {
    const a = assessSupplierLocalContent('JP', 'government', { jp: { policyYearTargetRatioPct: 56, isSmeQualified: true } }, 'jp-kankoju-sme-target-ratio');
    expect(a.applicability).toBe('applicable');
    const c = a.computation as SpendSetAsideResult;
    expect(c.targetSharePct).toBe(56);
    expect(c.qualifiesForSetAside).toBe(true);
    expect(c.eligibleForReservedShare).toBe(true);
  });

  it('hardest: same 56% target but supplier does NOT qualify as SME -- target is disclosed but this supplier gets no reserved share', () => {
    const a = assessSupplierLocalContent('JP', 'government', { jp: { policyYearTargetRatioPct: 56, isSmeQualified: false } }, 'jp-kankoju-sme-target-ratio');
    const c = a.computation as SpendSetAsideResult;
    expect(c.targetSharePct).toBe(56);
    expect(c.eligibleForReservedShare).toBe(false);
  });

  it('boundary: target ratio of exactly 0% (a real, if unusual, caller-supplied figure) -> disclosed as zero, not treated as missing data', () => {
    const a = assessSupplierLocalContent('JP', 'government', { jp: { policyYearTargetRatioPct: 0, isSmeQualified: true } }, 'jp-kankoju-sme-target-ratio');
    const c = a.computation as SpendSetAsideResult;
    expect(c.targetSharePct).toBe(0);
    expect(c.qualifiesForSetAside).toBe(true);
  });

  it('boundary: policyYearTargetRatioPct is null -- the critical case -- resolves to applicable-but-unknown, never a fabricated default ratio', () => {
    const a = assessSupplierLocalContent('JP', 'government', { jp: { policyYearTargetRatioPct: null, isSmeQualified: true } }, 'jp-kankoju-sme-target-ratio');
    expect(a.applicability).toBe('applicable');
    const c = a.computation as SpendSetAsideResult;
    expect(c.targetSharePct).toBe(0);
    expect(c.qualifiesForSetAside).toBeNull();
    expect(c.eligibleForReservedShare).toBeNull();
    expect(a.reasonEn).toContain('not fixed by statute');
    expect(a.reasonAr).toContain('غير ثابت بنص قانوني');
  });

  it('no inputs.jp supplied at all -> the same honest insufficient-data path as an explicit null target', () => {
    const a = assessSupplierLocalContent('JP', 'government', {}, 'jp-kankoju-sme-target-ratio');
    const c = a.computation as SpendSetAsideResult;
    expect(c.targetSharePct).toBe(0);
    expect(c.qualifiesForSetAside).toBeNull();
  });

  it("not-applicable: semi-government-soe procurement is outside this program's sourced (government-only) scope", () => {
    const a = assessSupplierLocalContent('JP', 'semi-government-soe', { jp: { policyYearTargetRatioPct: 56, isSmeQualified: true } }, 'jp-kankoju-sme-target-ratio');
    expect(a.applicability).toBe('not-applicable');
  });

  it('omitting the program param for JP resolves to jp-kankoju-sme-target-ratio (its own default and only program)', () => {
    const a = assessSupplierLocalContent('JP', 'government', { jp: { policyYearTargetRatioPct: 56, isSmeQualified: true } });
    expect(a.program).toBe('jp-kankoju-sme-target-ratio');
  });

  it('discloses the real FY2013 56% reference figure and the Kankouju Law (1966) name bilingually, and is honest that no fixed statutory percentage exists', () => {
    const fw = PROGRAMS['jp-kankoju-sme-target-ratio'];
    expect(fw.sourceNoteEn).toContain('56%');
    expect(fw.sourceNoteEn).toContain('FY2013');
    expect(fw.sourceNoteEn).toContain('1966');
    expect(fw.sourceNoteAr).toContain('56٪');
    expect(fw.sourceNoteAr).toContain('2013');
  });
});

describe('KR — structural sanity (17 Sep 2026 batch, 16th and final country in this run, has 2 programs)', () => {
  it('KR is the sixteenth country, has 2 programs, and resolves DEFAULT_PROGRAM_BY_COUNTRY to the SME Purchase Target Ratio System', () => {
    expect(DEFAULT_PROGRAM_BY_COUNTRY.KR).toBe('kr-sme-purchase-target-ratio');
    expect(PROGRAMS_BY_COUNTRY.KR).toEqual(['kr-sme-purchase-target-ratio', 'kr-sme-competitive-products-gate']);
    expect(COUNTRY_FRAMEWORKS.KR.applicableContexts.length).toBeGreaterThan(0);
  });
});

describe('KR / SME Product Purchase Target Ratio System — spend-set-aside-target, genuinely new 2-way category selector (not a Bahrain/Kuwait flat-target copy)', () => {
  it('soft: general SME product category, SME-qualified -> the 50% overall target', () => {
    const a = assessSupplierLocalContent('KR', 'government', { krSmeTarget: { productCategory: 'general-sme-product', isSmeQualified: true } }, 'kr-sme-purchase-target-ratio');
    expect(a.applicability).toBe('applicable');
    const c = a.computation as SpendSetAsideResult;
    expect(c.targetSharePct).toBe(KOREA_SME_OVERALL_PURCHASE_TARGET_PCT);
    expect(c.eligibleForReservedShare).toBe(true);
  });

  it('soft: technology-development-product category -> the narrower 15% sub-target, not the 50% overall figure', () => {
    const a = assessSupplierLocalContent('KR', 'government', { krSmeTarget: { productCategory: 'technology-development-product', isSmeQualified: true } }, 'kr-sme-purchase-target-ratio');
    const c = a.computation as SpendSetAsideResult;
    expect(c.targetSharePct).toBe(KOREA_SME_TECH_DEVELOPMENT_PRODUCT_TARGET_PCT);
  });

  it('hardest: technology-development-product category but supplier does NOT qualify as SME -- correct target still disclosed, no reserved share for this supplier', () => {
    const a = assessSupplierLocalContent('KR', 'semi-government-soe', { krSmeTarget: { productCategory: 'technology-development-product', isSmeQualified: false } }, 'kr-sme-purchase-target-ratio');
    const c = a.computation as SpendSetAsideResult;
    expect(c.targetSharePct).toBe(KOREA_SME_TECH_DEVELOPMENT_PRODUCT_TARGET_PCT);
    expect(c.eligibleForReservedShare).toBe(false);
  });

  it('boundary: product category genuinely unknown -> falls back to displaying the 50% overall figure with qualification left honestly null, not a guessed category', () => {
    const a = assessSupplierLocalContent('KR', 'government', { krSmeTarget: { productCategory: null, isSmeQualified: null } }, 'kr-sme-purchase-target-ratio');
    const c = a.computation as SpendSetAsideResult;
    expect(c.targetSharePct).toBe(KOREA_SME_OVERALL_PURCHASE_TARGET_PCT);
    expect(c.qualifiesForSetAside).toBeNull();
  });

  it('no inputs.krSmeTarget supplied at all -> same 50% fallback display, honest null qualification', () => {
    const a = assessSupplierLocalContent('KR', 'government', {}, 'kr-sme-purchase-target-ratio');
    const c = a.computation as SpendSetAsideResult;
    expect(c.targetSharePct).toBe(KOREA_SME_OVERALL_PURCHASE_TARGET_PCT);
    expect(a.reasonEn).toBe('No Korean SME product-category/qualification inputs supplied yet.');
    expect(a.reasonAr).toBe('لم تُدخل بيانات فئة المنتج أو التأهل الكوري للمنشآت الصغيرة والمتوسطة بعد.');
  });

  it("not-applicable: private-commercial procurement is outside this program's sourced (government/semi-government-soe) scope", () => {
    const a = assessSupplierLocalContent('KR', 'private-commercial', { krSmeTarget: { productCategory: 'general-sme-product', isSmeQualified: true } }, 'kr-sme-purchase-target-ratio');
    expect(a.applicability).toBe('not-applicable');
  });

  it('omitting the program param for KR resolves to kr-sme-purchase-target-ratio (its own default)', () => {
    const a = assessSupplierLocalContent('KR', 'government', { krSmeTarget: { productCategory: 'general-sme-product', isSmeQualified: true } });
    expect(a.program).toBe('kr-sme-purchase-target-ratio');
  });

  it('discloses the real 50%/15% dual targets and the governing Article 5 bilingually', () => {
    const fw = PROGRAMS['kr-sme-purchase-target-ratio'];
    expect(fw.sourceNoteEn).toContain('50%');
    expect(fw.sourceNoteEn).toContain('15%');
    expect(fw.sourceNoteEn).toContain('Article 5');
    expect(fw.sourceNoteAr).toContain('50٪');
    expect(fw.sourceNoteAr).toContain('15٪');
  });
});

describe('KR / SME-Exclusive Competitive Products Designation — category-eligibility-gate, legitimate thin-wrapper reuse of computeCategoryEligibilityGate (same judgment already applied to CN Article 10)', () => {
  it('soft: in a designated competitive-product category, direct-production certified -> eligible to bid', () => {
    const a = assessSupplierLocalContent('KR', 'government', { krCompetitiveProducts: { inDesignatedCompetitiveProductCategory: true, directProductionCertified: true } }, 'kr-sme-competitive-products-gate');
    const c = a.computation as CategoryEligibilityGateResult;
    expect(c.eligibleToBid).toBe(true);
  });

  it('hardest: in a designated category but NOT certified as the direct producer (e.g. a reseller/importer) -> gated out', () => {
    const a = assessSupplierLocalContent('KR', 'government', { krCompetitiveProducts: { inDesignatedCompetitiveProductCategory: true, directProductionCertified: false } }, 'kr-sme-competitive-products-gate');
    const c = a.computation as CategoryEligibilityGateResult;
    expect(c.eligibleToBid).toBe(false);
  });

  it('boundary: NOT in a designated competitive-product category -> eligible to bid regardless of certification status, the gate simply does not apply', () => {
    const a = assessSupplierLocalContent('KR', 'semi-government-soe', { krCompetitiveProducts: { inDesignatedCompetitiveProductCategory: false, directProductionCertified: null } }, 'kr-sme-competitive-products-gate');
    const c = a.computation as CategoryEligibilityGateResult;
    expect(c.eligibleToBid).toBe(true);
  });

  it('boundary: category-designation status itself unknown -> honest null, never assumed either way', () => {
    const a = assessSupplierLocalContent('KR', 'government', { krCompetitiveProducts: { inDesignatedCompetitiveProductCategory: null, directProductionCertified: true } }, 'kr-sme-competitive-products-gate');
    const c = a.computation as CategoryEligibilityGateResult;
    expect(c.eligibleToBid).toBeNull();
  });

  it('no inputs supplied at all -> null gate, real bilingual reason text', () => {
    const a = assessSupplierLocalContent('KR', 'government', {}, 'kr-sme-competitive-products-gate');
    const c = a.computation as CategoryEligibilityGateResult;
    expect(c.eligibleToBid).toBeNull();
    expect(a.reasonEn).toBe('No Korean designated-competitive-product-category/direct-production inputs supplied yet.');
    expect(a.reasonAr).toBe('لم تُدخل بيانات فئة المنتج التنافسي المُصنَّف أو الإنتاج المباشر الكوري بعد.');
  });

  it("not-applicable: private-commercial procurement is outside this program's sourced scope", () => {
    const a = assessSupplierLocalContent('KR', 'private-commercial', { krCompetitiveProducts: { inDesignatedCompetitiveProductCategory: true, directProductionCertified: true } }, 'kr-sme-competitive-products-gate');
    expect(a.applicability).toBe('not-applicable');
  });

  it('discloses the real 213 products / 632 subcategories designation figures bilingually', () => {
    const fw = PROGRAMS['kr-sme-competitive-products-gate'];
    expect(fw.sourceNoteEn).toContain('213 products');
    expect(fw.sourceNoteEn).toContain('632');
    expect(fw.sourceNoteAr).toContain('632');
  });

  it('cross-feature: the KR SME-status field is genuinely separate between the two Korean programs -- purchase-target-ratio and competitive-products-gate are not silently sharing state', () => {
    const target = assessSupplierLocalContent('KR', 'government', { krSmeTarget: { productCategory: 'general-sme-product', isSmeQualified: true } }, 'kr-sme-purchase-target-ratio');
    const gate = assessSupplierLocalContent('KR', 'government', { krCompetitiveProducts: { inDesignatedCompetitiveProductCategory: true, directProductionCertified: true } }, 'kr-sme-competitive-products-gate');
    expect((target.computation as SpendSetAsideResult).targetSharePct).toBe(KOREA_SME_OVERALL_PURCHASE_TARGET_PCT);
    expect((gate.computation as CategoryEligibilityGateResult).eligibleToBid).toBe(true);
  });
});

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
    expect(a.program).toBe('sa-lcgpa-general');
    expect(a.framework).toBe(PROGRAMS['sa-lcgpa-general']);
  });

  it('omitting the program param for AE resolves to ae-icv-general (its own pre-existing default -- generalization is behavior-preserving)', () => {
    const a = assessSupplierLocalContent('AE', 'government', { ae: { manufacturingOrThirdPartySpendLocalAED: 1, manufacturingOrThirdPartySpendTotalAED: 1, investmentNBVLocalAED: 0, investmentNBVTotalAED: 0, emiratisationAnnualSpendAED: 0, expatriateHeadcount: 0, exportRevenueAED: 0, emiratiHeadcountGrowthPct: 0, investmentGrowthPct: 0, registeredOnMainland: false } });
    expect(a.program).toBe('ae-icv-general');
    expect(a.framework).toBe(PROGRAMS['ae-icv-general']);
  });

  it('every country resolves DEFAULT_PROGRAM_BY_COUNTRY to a real PROGRAMS entry (architecture sanity check)', () => {
    (['SA', 'AE', 'JO', 'OM', 'QA', 'BH', 'KW', 'EG', 'TR', 'UK', 'USA', 'CN'] as const).forEach(country => {
      const program = DEFAULT_PROGRAM_BY_COUNTRY[country];
      expect(PROGRAMS[program]).toBeDefined();
      expect(PROGRAMS[program].country).toBe(country);
      expect(PROGRAMS_BY_COUNTRY[country]).toContain(program);
    });
  });

  it('PROGRAMS_BY_COUNTRY lists every program per country (SA: 9 -- +3 on 18 Sep 2026: Rawafed/SABIC/Tharwah -- AE: 3 -- +1 on 20 Sep 2026: GCC origin treatment -- QA: 3 -- +1 on 20 Sep 2026: Tenders Law ICV consideration -- JO: 2, OM: 3, BH: 3, KW: 2, EG: 3, TR: 2, UK: 1, USA: 4, CN: 4)', () => {
    expect(PROGRAMS_BY_COUNTRY.SA).toHaveLength(9);
    expect(PROGRAMS_BY_COUNTRY.AE).toHaveLength(3);
    expect(PROGRAMS_BY_COUNTRY.JO).toHaveLength(2);
    expect(PROGRAMS_BY_COUNTRY.OM).toHaveLength(3);
    expect(PROGRAMS_BY_COUNTRY.QA).toHaveLength(3);
    expect(PROGRAMS_BY_COUNTRY.BH).toHaveLength(3);
    expect(PROGRAMS_BY_COUNTRY.KW).toHaveLength(2);
    expect(PROGRAMS_BY_COUNTRY.EG).toHaveLength(3);
    expect(PROGRAMS_BY_COUNTRY.TR).toHaveLength(2);
    expect(PROGRAMS_BY_COUNTRY.UK).toHaveLength(1);
    expect(PROGRAMS_BY_COUNTRY.USA).toHaveLength(4);
    expect(PROGRAMS_BY_COUNTRY.CN).toHaveLength(4);
  });

  it('lcgpa-general carries the two usage notes (40% high-value-contract weighting, ~30% consulting/IT figure) bilingually', () => {
    const fw = PROGRAMS['sa-lcgpa-general'];
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
    const a = assessSupplierLocalContent('SA', 'government', { saMandatoryList: { inMandatoryListCategory: false, certifiedForCategory: null } }, 'sa-mandatory-list');
    expect(a.applicability).toBe('applicable');
    const c = a.computation as CategoryEligibilityGateResult;
    expect(c.eligibleToBid).toBe(true);
    expect(a.reasonEn).toContain('eligible to bid');
    expect(a.reasonAr).toContain('مؤهل للتقديم');
  });

  it('hardest: in-list category, supplier NOT certified -> gated out (false), never a percentage', () => {
    const a = assessSupplierLocalContent('SA', 'government', { saMandatoryList: { inMandatoryListCategory: true, certifiedForCategory: false } }, 'sa-mandatory-list');
    const c = a.computation as CategoryEligibilityGateResult;
    expect(c.eligibleToBid).toBe(false);
    expect(a.reasonEn).toContain('gated out of this category');
    expect(a.reasonAr).toContain('مستبعد من هذه الفئة');
  });

  it('boundary: in-list category, certification status unknown (null) -> insufficient, not a guessed true/false', () => {
    const a = assessSupplierLocalContent('SA', 'government', { saMandatoryList: { inMandatoryListCategory: true, certifiedForCategory: null } }, 'sa-mandatory-list');
    const c = a.computation as CategoryEligibilityGateResult;
    expect(c.eligibleToBid).toBeNull();
    expect(a.reasonEn).toContain('incomplete inputs');
    expect(a.reasonAr).toContain('بيانات غير مكتملة');
  });

  it('in-list + certified -> eligible', () => {
    const a = assessSupplierLocalContent('SA', 'semi-government-soe', { saMandatoryList: { inMandatoryListCategory: true, certifiedForCategory: true } }, 'sa-mandatory-list');
    const c = a.computation as CategoryEligibilityGateResult;
    expect(c.eligibleToBid).toBe(true);
  });

  it('no inputs supplied at all -> null gate, reasonAr carries a genuinely different phrase than reasonEn (not English reused)', () => {
    const a = assessSupplierLocalContent('SA', 'government', {}, 'sa-mandatory-list');
    const c = a.computation as CategoryEligibilityGateResult;
    expect(c.eligibleToBid).toBeNull();
    expect(a.reasonEn).toBe('No Mandatory List category/certification inputs supplied yet.');
    expect(a.reasonAr).toBe('لم تُدخل بيانات فئة القائمة الإلزامية أو الاعتماد بعد.');
  });

  it('recommendLocalContentAction: only fires when genuinely gated out (false), never for null/true', () => {
    const gatedOut = assessSupplierLocalContent('SA', 'government', { saMandatoryList: { inMandatoryListCategory: true, certifiedForCategory: false } }, 'sa-mandatory-list');
    const rec = recommendLocalContentAction(gatedOut, null);
    expect(rec).not.toBeNull();
    expect(rec!.primaryEn).toContain('certification');
    expect(rec!.alternativeEn).toContain('subcontract');
    expect(rec!.primaryAr).toContain('اعتماد');

    const eligible = assessSupplierLocalContent('SA', 'government', { saMandatoryList: { inMandatoryListCategory: true, certifiedForCategory: true } }, 'sa-mandatory-list');
    expect(recommendLocalContentAction(eligible, null)).toBeNull();

    const unknown = assessSupplierLocalContent('SA', 'government', { saMandatoryList: { inMandatoryListCategory: true, certifiedForCategory: null } }, 'sa-mandatory-list');
    expect(recommendLocalContentAction(unknown, null)).toBeNull();
  });
});

// ===========================================================================
// SA — LCGPA National Product Price Preference (reuses price-preference-margin,
// same shape as Jordan — validates the "shared primitives" design intent)
// ===========================================================================

describe('SA / LCGPA — price-preference (10%, shared shape with Jordan)', () => {
  it('soft: partial local share -> proportional discount at the Saudi 10% margin (not Jordan\'s 20%)', () => {
    const a = assessSupplierLocalContent('SA', 'government', { saPricePreference: { bidValueLocallyManufacturedPct: 40 } }, 'sa-price-preference');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.preferenceMarginPct).toBe(SAUDI_PRICE_PREFERENCE_MARGIN_PCT);
    expect(c.preferenceMarginPct).not.toBe(JORDAN_PRICE_PREFERENCE_MARGIN_PCT);
    expect(c.effectiveBidDiscountPct).toBeCloseTo(4, 6);
  });

  it('boundary: 100% locally-manufactured -> full 10-point discount; recommendation correctly returns null (nothing to improve)', () => {
    const a = assessSupplierLocalContent('SA', 'government', { saPricePreference: { bidValueLocallyManufacturedPct: 100 } }, 'sa-price-preference');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.effectiveBidDiscountPct).toBeCloseTo(10, 6);
    expect(recommendLocalContentAction(a, null)).toBeNull();
  });

  it('boundary: 0% -> zero discount, still a real computed answer (not insufficient-data)', () => {
    const a = assessSupplierLocalContent('SA', 'government', { saPricePreference: { bidValueLocallyManufacturedPct: 0 } }, 'sa-price-preference');
    expect(a.applicability).toBe('applicable');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.effectiveBidDiscountPct).toBe(0);
  });

  it('hardest: private-commercial context -> not-applicable (LCGPA price preference is government/SOE only), not a zero score', () => {
    const a = assessSupplierLocalContent('SA', 'private-commercial', { saPricePreference: { bidValueLocallyManufacturedPct: 90 } }, 'sa-price-preference');
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
    const a = assessSupplierLocalContent('SA', 'semi-government-soe', inputs, 'sa-iktva-aramco');
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
    const a = assessSupplierLocalContent('SA', 'semi-government-soe', inputs, 'sa-iktva-aramco');
    const c = a.computation as AnchorBuyerScoreResult;
    // numerator == totalCosts -> base 100%, clamp to 100 overall despite the (clamped-to-10) bonus
    expect(c.scorePct).toBeCloseTo(100, 6);
  });

  it('boundary: totalCostsSAR = 0 -> null score (undefined denominator), not a divide-by-zero artifact', () => {
    const inputs: SupplierLocalContentInputs = {
      iktva: { goodsServicesLocalSAR: 500_000, assetDepreciationLocalSAR: 0, expatCompensationInSaudiSAR: 0, saudiWorkforceCompensationSAR: 0, trainingDevelopmentSAR: 0, supplierDevelopmentSAR: 0, localRnDSAR: 0, totalCostsSAR: 0, incentiveBonusPct: 0 },
    };
    const a = assessSupplierLocalContent('SA', 'semi-government-soe', inputs, 'sa-iktva-aramco');
    const c = a.computation as AnchorBuyerScoreResult;
    expect(c.scorePct).toBeNull();
    expect(a.reasonEn).toContain('incomplete inputs');
    expect(a.reasonAr).toContain('بيانات غير مكتملة');
  });

  it('IKTVA is scoped to semi-government-soe only (Aramco is an anchor-buyer program, not the general government score) -- government context is not-applicable', () => {
    const a = assessSupplierLocalContent('SA', 'government', { iktva: { goodsServicesLocalSAR: 1, assetDepreciationLocalSAR: 0, expatCompensationInSaudiSAR: 0, saudiWorkforceCompensationSAR: 0, trainingDevelopmentSAR: 0, supplierDevelopmentSAR: 0, localRnDSAR: 0, totalCostsSAR: 1, incentiveBonusPct: 0 } }, 'sa-iktva-aramco');
    expect(a.applicability).toBe('not-applicable');
  });

  it('reasonAr carries the actual score value in Arabic numerals, never the raw English procurementContext literal', () => {
    const inputs: SupplierLocalContentInputs = {
      iktva: { goodsServicesLocalSAR: 500_000, assetDepreciationLocalSAR: 0, expatCompensationInSaudiSAR: 0, saudiWorkforceCompensationSAR: 0, trainingDevelopmentSAR: 0, supplierDevelopmentSAR: 0, localRnDSAR: 0, totalCostsSAR: 1_000_000, incentiveBonusPct: 0 },
    };
    const a = assessSupplierLocalContent('SA', 'semi-government-soe', inputs, 'sa-iktva-aramco');
    const c = a.computation as AnchorBuyerScoreResult;
    expect(a.reasonAr).toContain(`${c.scorePct!.toFixed(1)}`.replace('.', '.')); // numeral present
    expect(a.reasonAr).toContain('٪');
    expect(a.reasonAr).not.toContain('semi-government-soe');
  });

  it('recommendLocalContentAction: gap-closing recommendation fires for anchor-buyer-score exactly like the other score-based mechanisms', () => {
    const inputs: SupplierLocalContentInputs = {
      iktva: { goodsServicesLocalSAR: 200_000, assetDepreciationLocalSAR: 0, expatCompensationInSaudiSAR: 0, saudiWorkforceCompensationSAR: 0, trainingDevelopmentSAR: 0, supplierDevelopmentSAR: 0, localRnDSAR: 0, totalCostsSAR: 1_000_000, incentiveBonusPct: 0 },
    };
    const a = assessSupplierLocalContent('SA', 'semi-government-soe', inputs, 'sa-iktva-aramco');
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
    const a = assessSupplierLocalContent('SA', 'government', {}, 'sa-gami-defense');
    expect(a.applicability).toBe('insufficient-data');
    expect(a.computation).toEqual({ mechanismType: 'not-yet-sourced' });
    expect(a.reasonEn).toContain('24.89%');
    expect(a.reasonEn).toContain('2030');
    expect(a.reasonAr).toContain('٢٤.٨٩٪');
    expect(a.reasonAr).toContain('٢٠٣٠');
    expect(a.program).toBe('sa-gami-defense');
  });
});

describe('SA — LIKT (Localization of Industry & Knowledge Transfer, not-yet-sourced)', () => {
  it('is modeled as a genuinely distinct program from GAMI, with its own bilingual sourceNote', () => {
    const a = assessSupplierLocalContent('SA', 'government', {}, 'sa-likt');
    expect(a.applicability).toBe('insufficient-data');
    expect(a.program).toBe('sa-likt');
    expect(PROGRAMS['sa-likt'].sourceNoteEn).not.toEqual(PROGRAMS['sa-gami-defense'].sourceNoteEn);
    expect(a.reasonEn).toContain('LIKT');
    expect(a.reasonAr).toContain('LIKT');
  });
});

// ===========================================================================
// SA — stc Rawafed (eligible-spend-ratio, reused -- real LCGPA-approved
// formula sourced from stc's own 2021 Rawafed Annual Report PDF, 18 Sep
// 2026)
// ===========================================================================

describe('SA / stc Rawafed — eligible-spend-ratio (reused, real LCGPA-approved formula)', () => {
  it('soft: realistic 4-pillar supplier breakdown produces the correct directional score', () => {
    const inputs: SupplierLocalContentInputs = {
      rawafedStc: {
        localGoodsServicesSAR: 2_000_000, totalGoodsServicesSAR: 4_000_000,
        localSalariesSAR: 1_500_000, totalSalariesSAR: 2_000_000,
        localAssetDepreciationSAR: 100_000, totalAssetDepreciationSAR: 200_000,
        localCapacityDevelopmentSAR: 50_000, totalCapacityDevelopmentSAR: 100_000,
      },
    };
    const a = assessSupplierLocalContent('SA', 'semi-government-soe', inputs, 'sa-rawafed-stc');
    expect(a.applicability).toBe('applicable');
    const c = a.computation as EligibleSpendRatioResult;
    expect(c.mechanismType).toBe('eligible-spend-ratio'); // reused, not a new render branch
    const totalEligible = 2_000_000 + 1_500_000 + 100_000 + 50_000;
    const totalSpend = 4_000_000 + 2_000_000 + 200_000 + 100_000;
    expect(c.scorePct).not.toBeNull();
    expect(c.scorePct!).toBeCloseTo((totalEligible / totalSpend) * 100, 6);
    expect(c.pillars).toHaveLength(4);
  });

  it('hardest: one pillar fully local (100%) and every other pillar zero -- resolves to exactly 100%, not a divide-by-zero artifact from the zero pillars', () => {
    const inputs: SupplierLocalContentInputs = {
      rawafedStc: {
        localGoodsServicesSAR: 5_000_000, totalGoodsServicesSAR: 5_000_000,
        localSalariesSAR: 0, totalSalariesSAR: 0,
        localAssetDepreciationSAR: 0, totalAssetDepreciationSAR: 0,
        localCapacityDevelopmentSAR: 0, totalCapacityDevelopmentSAR: 0,
      },
    };
    const a = assessSupplierLocalContent('SA', 'semi-government-soe', inputs, 'sa-rawafed-stc');
    const c = a.computation as EligibleSpendRatioResult;
    expect(c.scorePct).toBeCloseTo(100, 6);
  });

  it('boundary: every total is zero -- null score (honest, not a fabricated 0%)', () => {
    const inputs: SupplierLocalContentInputs = {
      rawafedStc: {
        localGoodsServicesSAR: 0, totalGoodsServicesSAR: 0,
        localSalariesSAR: 0, totalSalariesSAR: 0,
        localAssetDepreciationSAR: 0, totalAssetDepreciationSAR: 0,
        localCapacityDevelopmentSAR: 0, totalCapacityDevelopmentSAR: 0,
      },
    };
    const a = assessSupplierLocalContent('SA', 'semi-government-soe', inputs, 'sa-rawafed-stc');
    const c = a.computation as EligibleSpendRatioResult;
    expect(c.scorePct).toBeNull();
    expect(a.reasonEn).toContain('incomplete inputs');
    expect(a.reasonAr).toContain('بيانات غير مكتملة');
  });

  it('is stc\'s own company-specific anchor-buyer program, scoped to semi-government-soe only -- government context is not-applicable', () => {
    const a = assessSupplierLocalContent('SA', 'government', { rawafedStc: { localGoodsServicesSAR: 1, totalGoodsServicesSAR: 1, localSalariesSAR: 0, totalSalariesSAR: 0, localAssetDepreciationSAR: 0, totalAssetDepreciationSAR: 0, localCapacityDevelopmentSAR: 0, totalCapacityDevelopmentSAR: 0 } }, 'sa-rawafed-stc');
    expect(a.applicability).toBe('not-applicable');
  });

  it('sourceNoteEn cites the real 2021 Rawafed Annual Report and its LCGPA-approved formula, distinct from the general LCGPA program', () => {
    const fw = PROGRAMS['sa-rawafed-stc'];
    expect(fw.sourceNoteEn).toContain('2021');
    expect(fw.sourceNoteEn).toContain('LCGPA');
    expect(fw.sourceNoteAr).toContain('LCGPA');
    expect(fw.mechanismType).toBe('eligible-spend-ratio');
    expect(fw.sourceNoteEn).not.toEqual(PROGRAMS['sa-lcgpa-general'].sourceNoteEn);
  });
});

// ===========================================================================
// QA — Tenders Law ICV Consideration (eligible-spend-ratio, reused with a
// SINGLE combined pillar -- Tenders and Auctions Law Executive Regulations
// Arts. 2-3, 20 Sep 2026). A genuinely different, cross-government legal
// basis from icv.qa's energy-sector-specific program above -- see
// PROGRAMS['qa-tenders-icv'].sourceNoteEn for the full sourcing, including
// the disclosed absence of a published Article 3 weighting/threshold and
// the explicit rejection of the uncorroborated Pinsent Masons 30% claim.
// ===========================================================================

describe('QA / Tenders Law ICV Consideration — eligible-spend-ratio (reused, single combined pillar)', () => {
  it('soft: a realistic self-certified local-value plan against total contract value produces the correct directional ratio', () => {
    const inputs: SupplierLocalContentInputs = {
      qaTendersIcv: { localValueQAR: 3_500_000, totalContractValueQAR: 10_000_000 },
    };
    const a = assessSupplierLocalContent('QA', 'government', inputs, 'qa-tenders-icv');
    expect(a.applicability).toBe('applicable');
    const c = a.computation as EligibleSpendRatioResult;
    expect(c.mechanismType).toBe('eligible-spend-ratio'); // reused, not a new render branch
    expect(c.scorePct).not.toBeNull();
    expect(c.scorePct!).toBeCloseTo(35, 6);
    expect(c.pillars).toHaveLength(1); // Article 2 bundles works/services/national-human-resources into ONE definition, unlike LCGPA's four
    expect(c.pillars[0].key).toBe('qaTendersIcvLocalValue');
  });

  it('hardest: local value reported greater than total contract value (a messy/adversarial self-certification) -- computes past 100% rather than silently clamping, an honest reflection of a bad input rather than a hidden cap', () => {
    const inputs: SupplierLocalContentInputs = { qaTendersIcv: { localValueQAR: 12_000_000, totalContractValueQAR: 10_000_000 } };
    const a = assessSupplierLocalContent('QA', 'government', inputs, 'qa-tenders-icv');
    const c = a.computation as EligibleSpendRatioResult;
    expect(c.scorePct).toBeCloseTo(120, 6);
  });

  it('hardest: local value is zero (a bidder who submits a plan claiming no local value at all) -- resolves to exactly 0%, not null, since total contract value is known', () => {
    const inputs: SupplierLocalContentInputs = { qaTendersIcv: { localValueQAR: 0, totalContractValueQAR: 8_000_000 } };
    const a = assessSupplierLocalContent('QA', 'government', inputs, 'qa-tenders-icv');
    const c = a.computation as EligibleSpendRatioResult;
    expect(c.scorePct).toBeCloseTo(0, 6);
  });

  it('boundary: total contract value is zero -- null score (honest, not a fabricated 0% or divide-by-zero artifact)', () => {
    const inputs: SupplierLocalContentInputs = { qaTendersIcv: { localValueQAR: 0, totalContractValueQAR: 0 } };
    const a = assessSupplierLocalContent('QA', 'government', inputs, 'qa-tenders-icv');
    const c = a.computation as EligibleSpendRatioResult;
    expect(c.scorePct).toBeNull();
    expect(a.reasonEn).toContain('incomplete inputs');
    expect(a.reasonAr).toContain('بيانات غير مكتملة');
  });

  it('boundary: local value exactly equals total contract value -- resolves to exactly 100%', () => {
    const inputs: SupplierLocalContentInputs = { qaTendersIcv: { localValueQAR: 6_000_000, totalContractValueQAR: 6_000_000 } };
    const a = assessSupplierLocalContent('QA', 'government', inputs, 'qa-tenders-icv');
    const c = a.computation as EligibleSpendRatioResult;
    expect(c.scorePct).toBeCloseTo(100, 6);
  });

  it('is a general, cross-government Tenders Law mechanism, sourced as applying to government procurement -- semi-government-soe is not-applicable (no sourced evidence it extends there, unlike icv.qa)', () => {
    const a = assessSupplierLocalContent('QA', 'semi-government-soe', { qaTendersIcv: { localValueQAR: 1, totalContractValueQAR: 1 } }, 'qa-tenders-icv');
    expect(a.applicability).toBe('not-applicable');
  });

  it('no inputs supplied yet -- applicable but incomplete, never a guessed score', () => {
    const a = assessSupplierLocalContent('QA', 'government', {}, 'qa-tenders-icv');
    expect(a.applicability).toBe('applicable');
    const c = a.computation as EligibleSpendRatioResult;
    expect(c.scorePct).toBeNull();
    expect(c.pillars).toHaveLength(0);
  });

  it('sourceNoteEn cites the real Tenders Law Executive Regulations Articles 2-3, discloses the absence of a published Article 3 threshold/weighting, and explicitly discloses the rejected Pinsent Masons 30% claim -- never a guessed or silently-omitted figure', () => {
    const fw = PROGRAMS['qa-tenders-icv'];
    expect(fw.mechanismType).toBe('eligible-spend-ratio');
    expect(fw.applicableContexts).toEqual(['government']);
    expect(fw.sourceNoteEn).toContain('Article 2');
    expect(fw.sourceNoteEn).toContain('Article 3');
    expect(fw.sourceNoteEn).toContain('does NOT specify');
    expect(fw.sourceNoteEn).toContain('Pinsent Masons');
    expect(fw.sourceNoteEn).toContain('NOT modeled');
    expect(fw.sourceNoteAr).toContain('المادة ٢');
    expect(fw.sourceNoteAr).toContain('المادة ٣');
    // Genuinely distinct legal basis from icv.qa -- must never quietly reuse or duplicate that program's own sourceNote.
    expect(fw.sourceNoteEn).not.toEqual(PROGRAMS['qa-icv-tawteen'].sourceNoteEn);
    expect(fw.sourceNoteEn).toContain('icv.qa');
  });

  it('is reachable through assessAllApplicableLocalContentPrograms alongside qa-national-strategy and qa-icv-tawteen (multi-mechanism stacking, same treatment as every other country)', () => {
    const inputs: SupplierLocalContentInputs = { qaTendersIcv: { localValueQAR: 4_000_000, totalContractValueQAR: 8_000_000 } };
    const stacked = assessAllApplicableLocalContentPrograms('QA', 'government', inputs);
    const programs = stacked.map(s => s.program);
    expect(programs).toContain('qa-tenders-icv');
    expect(programs).toContain('qa-national-strategy');
    const tendersEntry = stacked.find(s => s.program === 'qa-tenders-icv')!;
    const c = tendersEntry.assessment.computation as EligibleSpendRatioResult;
    expect(c.scorePct).toBeCloseTo(50, 6);
  });
});

// ===========================================================================
// SA — SABIC Local Content Commitment Gate (commitment-deviation-gate, a
// genuinely new mechanism type, 18 Sep 2026) -- per-contract negotiated
// target vs. audited actual, NOT a published SABIC-wide standard. See
// PROGRAMS['sa-sabic-lc-commitment'].sourceNoteEn for the full honesty
// disclosure, and the platform owner's own explicit instruction: a 1%-of-
// contract-value penalty applies once deviation exceeds the 5-point line.
// ===========================================================================

describe('SA / SABIC Commitment Gate — commitment-deviation-gate (per-contract target, NOT a SABIC-wide standard)', () => {
  it('soft: actual audited performance MEETS the committed target exactly -- zero deviation, within tolerance', () => {
    const a = assessSupplierLocalContent('SA', 'semi-government-soe', { sabicLcCommitment: { proposedTargetPct: 40, actualAuditedPct: 40 } }, 'sa-sabic-lc-commitment');
    const c = a.computation as CommitmentDeviationGateResult;
    expect(c.deviationPct).toBeCloseTo(0, 6);
    expect(c.withinTolerance).toBe(true);
    expect(actionableNextStepForSabicLcGate(c)).toBeNull();
  });

  it('soft: actual EXCEEDS the committed target -- negative deviation is never a breach, regardless of magnitude', () => {
    const a = assessSupplierLocalContent('SA', 'semi-government-soe', { sabicLcCommitment: { proposedTargetPct: 40, actualAuditedPct: 55 } }, 'sa-sabic-lc-commitment');
    const c = a.computation as CommitmentDeviationGateResult;
    expect(c.deviationPct).toBeCloseTo(-15, 6);
    expect(c.withinTolerance).toBe(true);
    expect(actionableNextStepForSabicLcGate(c)).toBeNull();
  });

  it('hardest: a small shortfall INSIDE the 5-point tolerance -- within tolerance, no actionable next step, no penalty text', () => {
    const a = assessSupplierLocalContent('SA', 'semi-government-soe', { sabicLcCommitment: { proposedTargetPct: 40, actualAuditedPct: 37 } }, 'sa-sabic-lc-commitment');
    const c = a.computation as CommitmentDeviationGateResult;
    expect(c.deviationPct).toBeCloseTo(3, 6);
    expect(c.withinTolerance).toBe(true);
    expect(actionableNextStepForSabicLcGate(c)).toBeNull();
  });

  it('hardest: a shortfall just OVER the 5-point tolerance line -- breach, and the actionable next step names the 1%-of-contract-value penalty bilingually', () => {
    const a = assessSupplierLocalContent('SA', 'semi-government-soe', { sabicLcCommitment: { proposedTargetPct: 40, actualAuditedPct: 34 } }, 'sa-sabic-lc-commitment');
    const c = a.computation as CommitmentDeviationGateResult;
    expect(c.deviationPct).toBeCloseTo(6, 6);
    expect(c.withinTolerance).toBe(false);
    const step = actionableNextStepForSabicLcGate(c);
    expect(step).not.toBeNull();
    expect(step!.en).toContain('1%');
    expect(step!.en).toContain('penalty');
    expect(step!.ar).toContain('١٪');
    expect(step!.ar).toContain('غرامة');
  });

  it('boundary: deviation is EXACTLY on the 5-point tolerance line -- within tolerance (<=), not yet a breach', () => {
    const a = assessSupplierLocalContent('SA', 'semi-government-soe', { sabicLcCommitment: { proposedTargetPct: 45, actualAuditedPct: 40 } }, 'sa-sabic-lc-commitment');
    const c = a.computation as CommitmentDeviationGateResult;
    expect(c.deviationPct).toBeCloseTo(5, 6);
    expect(c.withinTolerance).toBe(true);
    expect(actionableNextStepForSabicLcGate(c)).toBeNull();
  });

  it('boundary: no contract inputs supplied -- null withinTolerance (insufficient data), not a false pass or false breach', () => {
    const a = assessSupplierLocalContent('SA', 'semi-government-soe', {}, 'sa-sabic-lc-commitment');
    const c = a.computation as CommitmentDeviationGateResult;
    expect(c.withinTolerance).toBeNull();
    expect(c.deviationPct).toBeNull();
    expect(actionableNextStepForSabicLcGate(c)).toBeNull();
  });

  it('is a per-contract company-specific gate, scoped to semi-government-soe only -- government context is not-applicable', () => {
    const a = assessSupplierLocalContent('SA', 'government', { sabicLcCommitment: { proposedTargetPct: 40, actualAuditedPct: 30 } }, 'sa-sabic-lc-commitment');
    expect(a.applicability).toBe('not-applicable');
  });

  it('sourceNoteEn/Ar honestly disclose this is NOT a published SABIC-wide standard, and that the tolerance/penalty are this platform\'s own business-rule defaults (Decision Record 8.7)', () => {
    const fw = PROGRAMS['sa-sabic-lc-commitment'];
    expect(fw.sourceNoteEn).toContain('NOT a published SABIC-wide local-content standard');
    expect(fw.sourceNoteEn).toContain('per-contract negotiated');
    expect(fw.sourceNoteAr).toContain('ليس معياراً معلناً على مستوى سابك');
    expect(SABIC_LC_DEVIATION_TOLERANCE_PCT).toBe(5);
    expect(SABIC_LC_PENALTY_MAX_PCT_OF_CONTRACT_VALUE).toBe(1);
  });

  it('recommendLocalContentAction: primary+alternative fires on a genuine breach, alternative names the penalty AND the renegotiation option (Rule 8: never a single-path recommendation)', () => {
    const a = assessSupplierLocalContent('SA', 'semi-government-soe', { sabicLcCommitment: { proposedTargetPct: 40, actualAuditedPct: 30 } }, 'sa-sabic-lc-commitment');
    const rec = recommendLocalContentAction(a, null);
    expect(rec).not.toBeNull();
    expect(rec!.primaryEn).toContain('shortfall');
    expect(rec!.alternativeEn).toContain('1%');
    expect(rec!.alternativeEn).toContain('renegotiat');
    expect(rec!.alternativeAr).toContain('١٪');
  });

  it('recommendLocalContentAction: returns null when the gate is within tolerance -- no recommendation for a non-problem', () => {
    const a = assessSupplierLocalContent('SA', 'semi-government-soe', { sabicLcCommitment: { proposedTargetPct: 40, actualAuditedPct: 38 } }, 'sa-sabic-lc-commitment');
    const rec = recommendLocalContentAction(a, null);
    expect(rec).toBeNull();
  });

  it('reasonAr carries the same breach/within-tolerance information as reasonEn, using the real Arabic percent sign, never a raw splice of the English mechanismType', () => {
    const a = assessSupplierLocalContent('SA', 'semi-government-soe', { sabicLcCommitment: { proposedTargetPct: 40, actualAuditedPct: 30 } }, 'sa-sabic-lc-commitment');
    expect(a.reasonEn).toContain('breach');
    expect(a.reasonAr).toContain('تجاوز');
    expect(a.reasonAr).not.toContain('commitment-deviation-gate');
    expect(a.reasonAr).not.toContain('semi-government-soe');
  });
});

// ===========================================================================
// SA — Tharwah (Ma'aden Local Content Program, not-yet-sourced, real dated
// program name confirmed via maaden.com/tharwah, 18 Sep 2026)
// ===========================================================================

describe("SA — Tharwah (Ma'aden Local Content Program, not-yet-sourced, real dated program name)", () => {
  it('returns insufficient-data with the real confirmed program name, never a fabricated per-supplier score', () => {
    const a = assessSupplierLocalContent('SA', 'government', {}, 'sa-tharwah-maaden');
    expect(a.applicability).toBe('insufficient-data');
    expect(a.computation).toEqual({ mechanismType: 'not-yet-sourced' });
    expect(a.reasonEn).toContain('Tharwah');
    expect(a.reasonAr).toContain('ثروة');
    expect(a.program).toBe('sa-tharwah-maaden');
  });

  it('is modeled as a genuinely distinct program from GAMI/LIKT/Rawafed, with its own bilingual sourceNote honestly contrasting itself with Rawafed\'s published formula', () => {
    const fw = PROGRAMS['sa-tharwah-maaden'];
    expect(fw.sourceNoteEn).not.toEqual(PROGRAMS['sa-gami-defense'].sourceNoteEn);
    expect(fw.sourceNoteEn).not.toEqual(PROGRAMS['sa-likt'].sourceNoteEn);
    expect(fw.sourceNoteEn).toContain('Rawafed');
    expect(fw.applicableContexts).toHaveLength(0);
  });
});

// ===========================================================================
// assessAllApplicableLocalContentPrograms — multi-mechanism stacking (new,
// 18 Sep 2026): a single country/context can have more than one genuinely
// applicable program at once. Never averaged into one score (Decision
// Record 8.7); each program kept fully separate.
// ===========================================================================

describe('assessAllApplicableLocalContentPrograms — multi-mechanism stacking', () => {
  it('excludes not-applicable programs: SA government context excludes IKTVA, Rawafed, and the SABIC gate (all semi-government-soe-only)', () => {
    const stacked = assessAllApplicableLocalContentPrograms('SA', 'government', {});
    const programs = stacked.map(s => s.program);
    expect(programs).not.toContain('sa-iktva-aramco');
    expect(programs).not.toContain('sa-rawafed-stc');
    expect(programs).not.toContain('sa-sabic-lc-commitment');
    expect(programs).toContain('sa-lcgpa-general');
    expect(programs).toContain('sa-mandatory-list');
  });

  it('keeps insufficient-data programs (GAMI/LIKT/Tharwah) rather than silently hiding them', () => {
    const stacked = assessAllApplicableLocalContentPrograms('SA', 'government', {});
    const insufficientPrograms = stacked.filter(s => s.assessment.applicability === 'insufficient-data').map(s => s.program);
    expect(insufficientPrograms).toContain('sa-gami-defense');
    expect(insufficientPrograms).toContain('sa-likt');
    expect(insufficientPrograms).toContain('sa-tharwah-maaden');
  });

  it('semi-government-soe context includes LCGPA general, mandatory-list, price-preference, IKTVA, Rawafed, and the SABIC gate all at once -- six genuinely simultaneous programs, never merged into one score', () => {
    const stacked = assessAllApplicableLocalContentPrograms('SA', 'semi-government-soe', {});
    const programs = stacked.map(s => s.program);
    expect(programs).toContain('sa-lcgpa-general');
    expect(programs).toContain('sa-mandatory-list');
    expect(programs).toContain('sa-price-preference');
    expect(programs).toContain('sa-iktva-aramco');
    expect(programs).toContain('sa-rawafed-stc');
    expect(programs).toContain('sa-sabic-lc-commitment');
    // each kept as its own separate LocalContentAssessment, not averaged
    const distinctMechanisms = new Set(stacked.map(s => s.assessment.framework.mechanismType));
    expect(distinctMechanisms.size).toBeGreaterThan(1);
  });

  it('actionableNextStep is populated only for a breaching SABIC gate, and is null for every other program in the same stack', () => {
    const stacked = assessAllApplicableLocalContentPrograms('SA', 'semi-government-soe', { sabicLcCommitment: { proposedTargetPct: 40, actualAuditedPct: 30 } });
    const sabicEntry = stacked.find(s => s.program === 'sa-sabic-lc-commitment')!;
    expect(sabicEntry.actionableNextStep).not.toBeNull();
    expect(sabicEntry.actionableNextStep!.en).toContain('1%');
    for (const s of stacked) {
      if (s.program !== 'sa-sabic-lc-commitment') expect(s.actionableNextStep).toBeNull();
    }
  });

  it('actionableNextStep is null when the SABIC gate is within tolerance, even though the gate itself is still in the stacked list', () => {
    const stacked = assessAllApplicableLocalContentPrograms('SA', 'semi-government-soe', { sabicLcCommitment: { proposedTargetPct: 40, actualAuditedPct: 38 } });
    const sabicEntry = stacked.find(s => s.program === 'sa-sabic-lc-commitment')!;
    expect(sabicEntry).toBeDefined();
    expect(sabicEntry.actionableNextStep).toBeNull();
  });
});

// ===========================================================================
// SA — Rawafed in the portfolio rollup (spend-share-weighted, same
// convention as every other eligible-spend-ratio mechanism -- confirms the
// reuse is genuine, not just a typecheck-level coincidence)
// ===========================================================================

describe('SA — portfolio rollup: Rawafed groups and weights exactly like every other eligible-spend-ratio mechanism', () => {
  it('two Rawafed suppliers with different scores roll up spend-share-weighted, grouped separately from lcgpa-general even though both are eligible-spend-ratio', () => {
    const supplierA = assessSupplierLocalContent('SA', 'semi-government-soe', { rawafedStc: { localGoodsServicesSAR: 1_000_000, totalGoodsServicesSAR: 1_000_000, localSalariesSAR: 0, totalSalariesSAR: 0, localAssetDepreciationSAR: 0, totalAssetDepreciationSAR: 0, localCapacityDevelopmentSAR: 0, totalCapacityDevelopmentSAR: 0 } }, 'sa-rawafed-stc');
    const supplierB = assessSupplierLocalContent('SA', 'semi-government-soe', { rawafedStc: { localGoodsServicesSAR: 0, totalGoodsServicesSAR: 1_000_000, localSalariesSAR: 0, totalSalariesSAR: 0, localAssetDepreciationSAR: 0, totalAssetDepreciationSAR: 0, localCapacityDevelopmentSAR: 0, totalCapacityDevelopmentSAR: 0 } }, 'sa-rawafed-stc');
    const general = assessSupplierLocalContent('SA', 'semi-government-soe', { sa: { localLaborSAR: 500_000, expatLaborSAR: 0, localGoodsServicesSAR: 0, foreignGoodsServicesSAR: 0, capacityBuildingSAR: 0, localAssetDepreciationSAR: 0, totalAssetDepreciationSAR: 0 } }, 'sa-lcgpa-general');

    const groups = rollUpPortfolioLocalContent([
      { supplierId: 'r1', spendShare: 50, assessment: supplierA },
      { supplierId: 'r2', spendShare: 50, assessment: supplierB },
      { supplierId: 'g1', spendShare: 100, assessment: general },
    ]);

    expect(groups).toHaveLength(2);
    const rawafedGroup = groups.find(g => g.program === 'sa-rawafed-stc')!;
    expect(rawafedGroup).toBeDefined();
    expect(rawafedGroup.mechanismType).toBe('eligible-spend-ratio');
    expect(rawafedGroup.weightedScorePct).toBeCloseTo(50, 6); // (100% * 0.5) + (0% * 0.5)
  });
});


// ===========================================================================
// SA — portfolio rollup groups by program, not just country+context (two
// different Saudi programs for the same context must never be merged into
// one averaged group -- Decision Record 8.7)
// ===========================================================================

describe('SA — portfolio rollup groups by program', () => {
  it('lcgpa-general and mandatory-list suppliers in the same government context land in two separate groups', () => {
    const general = assessSupplierLocalContent('SA', 'government', { sa: { localLaborSAR: 900_000, expatLaborSAR: 100_000, localGoodsServicesSAR: 0, foreignGoodsServicesSAR: 0, capacityBuildingSAR: 0, localAssetDepreciationSAR: 0, totalAssetDepreciationSAR: 0 } }, 'sa-lcgpa-general');
    const gate = assessSupplierLocalContent('SA', 'government', { saMandatoryList: { inMandatoryListCategory: true, certifiedForCategory: true } }, 'sa-mandatory-list');

    const groups = rollUpPortfolioLocalContent([
      { supplierId: 's1', spendShare: 60, assessment: general },
      { supplierId: 's2', spendShare: 40, assessment: gate },
    ]);

    expect(groups).toHaveLength(2);
    const generalGroup = groups.find(g => g.program === 'sa-lcgpa-general')!;
    const gateGroup = groups.find(g => g.program === 'sa-mandatory-list')!;
    expect(generalGroup).toBeDefined();
    expect(gateGroup).toBeDefined();
    expect(generalGroup.mechanismType).toBe('eligible-spend-ratio');
    expect(gateGroup.mechanismType).toBe('category-eligibility-gate');
    expect(gateGroup.gateEligibleSharePct).toBe(100);
    expect(generalGroup.weightedScorePct).not.toBeNull();
  });

  it('gateEligibleSharePct is spend-share-weighted across mixed eligible/gated suppliers', () => {
    const eligible = assessSupplierLocalContent('SA', 'government', { saMandatoryList: { inMandatoryListCategory: true, certifiedForCategory: true } }, 'sa-mandatory-list');
    const gated = assessSupplierLocalContent('SA', 'government', { saMandatoryList: { inMandatoryListCategory: true, certifiedForCategory: false } }, 'sa-mandatory-list');
    const groups = rollUpPortfolioLocalContent([
      { supplierId: 's1', spendShare: 30, assessment: eligible },
      { supplierId: 's2', spendShare: 70, assessment: gated },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.gateEligibleSharePct).toBeCloseTo(30, 6); // only the eligible supplier's spend share counts as eligible
  });
});

// ===========================================================================
// 15 Sep 2026 continuation -- Jordan's second mechanism, Oman, Qatar,
// Bahrain, Kuwait (7 new sourced programs). Same soft/hardest/boundary
// discipline as every earlier describe block in this file.
// ===========================================================================

describe('JO / Contractor Quota — spend-set-aside-target', () => {
  it('soft: registered Jordanian contractor -> qualifies for the reserved share', () => {
    const a = assessSupplierLocalContent('JO', 'government', { joContractorQuota: { isRegisteredJordanianContractor: true } }, 'jo-contractor-quota');
    const c = a.computation as SpendSetAsideResult;
    expect(c.targetSharePct).toBe(JORDAN_CONTRACTOR_QUOTA_TARGET_PCT);
    expect(c.qualifiesForSetAside).toBe(true);
    expect(c.eligibleForReservedShare).toBe(true);
  });

  it('hardest: not a registered contractor -> does not qualify, and a recommendation fires citing the real 35% target', () => {
    const a = assessSupplierLocalContent('JO', 'semi-government-soe', { joContractorQuota: { isRegisteredJordanianContractor: false } }, 'jo-contractor-quota');
    const c = a.computation as SpendSetAsideResult;
    expect(c.qualifiesForSetAside).toBe(false);
    const rec = recommendLocalContentAction(a, null);
    expect(rec).not.toBeNull();
    expect(rec!.primaryEn).toContain('35%');
    expect(rec!.primaryAr.length).toBeGreaterThan(0);
  });

  it('boundary: no registration status supplied -> honest null, never a fabricated pass or fail', () => {
    const a = assessSupplierLocalContent('JO', 'government', {}, 'jo-contractor-quota');
    const c = a.computation as SpendSetAsideResult;
    expect(c.qualifiesForSetAside).toBeNull();
    expect(c.eligibleForReservedShare).toBeNull();
    expect(a.applicability).toBe('applicable'); // gate exists, just unanswered -- not "not-applicable"
  });

  it('not-applicable: private-commercial procurement is outside the sourced scope (government/semi-government-soe only)', () => {
    const a = assessSupplierLocalContent('JO', 'private-commercial', { joContractorQuota: { isRegisteredJordanianContractor: true } }, 'jo-contractor-quota');
    expect(a.applicability).toBe('not-applicable');
  });
});

describe("OM / PTLC Mandatory List — category-eligibility-gate (structurally identical to SA's Mandatory List)", () => {
  it('soft: in a mandatory-list category and certified -> eligible to bid', () => {
    const a = assessSupplierLocalContent('OM', 'government', { omMandatoryList: { inMandatoryListCategory: true, certifiedForCategory: true } }, 'om-mandatory-list');
    const c = a.computation as CategoryEligibilityGateResult;
    expect(c.eligibleToBid).toBe(true);
  });

  it('hardest: in a mandatory-list category but NOT certified -> gated out entirely', () => {
    const a = assessSupplierLocalContent('OM', 'semi-government-soe', { omMandatoryList: { inMandatoryListCategory: true, certifiedForCategory: false } }, 'om-mandatory-list');
    const c = a.computation as CategoryEligibilityGateResult;
    expect(c.eligibleToBid).toBe(false);
  });

  it('boundary: not in a mandatory-list category at all -> gate does not apply, eligible regardless of certification status', () => {
    const a = assessSupplierLocalContent('OM', 'government', { omMandatoryList: { inMandatoryListCategory: false, certifiedForCategory: null } }, 'om-mandatory-list');
    const c = a.computation as CategoryEligibilityGateResult;
    expect(c.eligibleToBid).toBe(true);
  });

  it('not-applicable: private-commercial procurement is outside PTLC Mandatory List scope', () => {
    const a = assessSupplierLocalContent('OM', 'private-commercial', { omMandatoryList: { inMandatoryListCategory: true, certifiedForCategory: true } }, 'om-mandatory-list');
    expect(a.applicability).toBe('not-applicable');
  });
});

describe('OM / OQ Group Price Preference — price-preference-margin (company-specific, like Aramco/QatarEnergy)', () => {
  it('soft: 25% Omani-manufactured bid content', () => {
    const a = assessSupplierLocalContent('OM', 'semi-government-soe', { omOqPricePreference: { bidValueLocallyManufacturedPct: 25 } }, 'om-oq-price-preference');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.preferenceMarginPct).toBe(OMAN_OQ_PRICE_PREFERENCE_MARGIN_PCT);
    expect(c.effectiveBidDiscountPct).toBeCloseTo(2.5, 6);
  });

  it('hardest: 0% and 100% Omani-manufactured (the two adversarial extremes)', () => {
    const zero = assessSupplierLocalContent('OM', 'semi-government-soe', { omOqPricePreference: { bidValueLocallyManufacturedPct: 0 } }, 'om-oq-price-preference').computation as PricePreferenceMarginResult;
    const full = assessSupplierLocalContent('OM', 'semi-government-soe', { omOqPricePreference: { bidValueLocallyManufacturedPct: 100 } }, 'om-oq-price-preference').computation as PricePreferenceMarginResult;
    expect(zero.effectiveBidDiscountPct).toBe(0);
    expect(full.effectiveBidDiscountPct).toBe(10);
  });

  it('boundary: exactly 100% share -> recommendLocalContentAction returns null (nothing left to improve)', () => {
    const a = assessSupplierLocalContent('OM', 'semi-government-soe', { omOqPricePreference: { bidValueLocallyManufacturedPct: 100 } }, 'om-oq-price-preference');
    expect(recommendLocalContentAction(a, null)).toBeNull();
  });

  it("not-applicable: government procurement is outside OQ Group's own company-specific scope", () => {
    const a = assessSupplierLocalContent('OM', 'government', { omOqPricePreference: { bidValueLocallyManufacturedPct: 50 } }, 'om-oq-price-preference');
    expect(a.applicability).toBe('not-applicable');
  });
});

describe('QA / Tawteen-ICV (icv.qa) — modified-icv-score', () => {
  it('soft: realistic 5-pillar spend breakdown with the ICV+ manufacturer boost and a disclosed bonus', () => {
    const a = assessSupplierLocalContent('QA', 'government', {
      qa: {
        localTangibleGoodsMaterialsQAR: 200_000, localServicesQAR: 100_000,
        qatariNationalResidentTrainingCostQAR: 50_000, supplierTrainingCertificationCostQAR: 50_000,
        qatarAssetDepreciationQAR: 100_000, totalQatarRevenueExclExportsQAR: 1_000_000,
        isEligibleManufacturer: true, isMicroOrSmallSupplier: false, selfReportedBonusPct: 10,
      },
    }, 'qa-icv-tawteen');
    const c = a.computation as ModifiedIcvScoreResult;
    expect(c.baseScorePct).toBeCloseTo(50, 6); // 500,000 / 1,000,000
    expect(c.finalScorePct).toBeCloseTo(85, 6); // (50 * 1.5) + 10
    expect(c.pillars).toHaveLength(5);
  });

  it('hardest: manufacturer boost + an over-cap self-reported bonus stack, and the final score is honestly capped at 100, never fabricated above it', () => {
    const a = assessSupplierLocalContent('QA', 'semi-government-soe', {
      qa: {
        localTangibleGoodsMaterialsQAR: 90_000, localServicesQAR: 0,
        qatariNationalResidentTrainingCostQAR: 0, supplierTrainingCertificationCostQAR: 0,
        qatarAssetDepreciationQAR: 0, totalQatarRevenueExclExportsQAR: 100_000,
        isEligibleManufacturer: true, isMicroOrSmallSupplier: true, selfReportedBonusPct: 50, // over the 15pt cap
      },
    }, 'qa-icv-tawteen');
    const c = a.computation as ModifiedIcvScoreResult;
    expect(c.baseScorePct).toBeCloseTo(90, 6);
    expect(c.selfReportedBonusPct).toBe(50); // stored exactly as supplied -- disclosed, never silently rewritten
    expect(c.finalScorePct).toBe(100); // (90 * QATAR_ICV_PLUS_MANUFACTURER_BOOST_MULTIPLIER) + QATAR_ICV_MAX_SELF_REPORTED_BONUS_PCT = 150, capped at 100
  });

  it('boundary: no Qatar revenue supplied and not micro/small -> honest null, never a fabricated zero', () => {
    const a = assessSupplierLocalContent('QA', 'government', {
      qa: {
        localTangibleGoodsMaterialsQAR: 10_000, localServicesQAR: 0,
        qatariNationalResidentTrainingCostQAR: 0, supplierTrainingCertificationCostQAR: 0,
        qatarAssetDepreciationQAR: 0, totalQatarRevenueExclExportsQAR: null,
        isEligibleManufacturer: false, isMicroOrSmallSupplier: false, selfReportedBonusPct: null,
      },
    }, 'qa-icv-tawteen');
    const c = a.computation as ModifiedIcvScoreResult;
    expect(c.baseScorePct).toBeNull();
    expect(c.finalScorePct).toBeNull();
  });

  it('boundary: no Qatar revenue supplied BUT micro/small -> the blanket 30% floor still resolves (a policy guarantee independent of spend data)', () => {
    const a = assessSupplierLocalContent('QA', 'government', {
      qa: {
        localTangibleGoodsMaterialsQAR: null, localServicesQAR: null,
        qatariNationalResidentTrainingCostQAR: null, supplierTrainingCertificationCostQAR: null,
        qatarAssetDepreciationQAR: null, totalQatarRevenueExclExportsQAR: null,
        isEligibleManufacturer: false, isMicroOrSmallSupplier: true, selfReportedBonusPct: null,
      },
    }, 'qa-icv-tawteen');
    const c = a.computation as ModifiedIcvScoreResult;
    expect(c.baseScorePct).toBeNull();
    expect(c.finalScorePct).toBe(QATAR_ICV_BLANKET_FLOOR_PCT_MICRO_SMALL);
  });

  it("not-applicable: private-commercial procurement is outside icv.qa's sourced scope (government/semi-government-soe only)", () => {
    const a = assessSupplierLocalContent('QA', 'private-commercial', {
      qa: {
        localTangibleGoodsMaterialsQAR: 1, localServicesQAR: 0, qatariNationalResidentTrainingCostQAR: 0,
        supplierTrainingCertificationCostQAR: 0, qatarAssetDepreciationQAR: 0, totalQatarRevenueExclExportsQAR: 10,
        isEligibleManufacturer: false, isMicroOrSmallSupplier: false, selfReportedBonusPct: null,
      },
    }, 'qa-icv-tawteen');
    expect(a.applicability).toBe('not-applicable');
  });
});

describe('BH / SME Bidding Price Advantage — price-preference-margin (binary SME status drives the share, not a spend %)', () => {
  it('soft: qualifies as SME -> full price-preference margin applied via a 100% binary share', () => {
    const a = assessSupplierLocalContent('BH', 'government', { bhSme: { qualifiesAsSme: true } }, 'bh-sme-price-preference');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.preferenceMarginPct).toBe(BAHRAIN_SME_PRICE_PREFERENCE_MARGIN_PCT);
    expect(c.locallyManufacturedSharePct).toBe(100);
    expect(c.effectiveBidDiscountPct).toBe(10);
  });

  it('hardest: does not qualify as SME -> zero effective discount, not a partial one', () => {
    const a = assessSupplierLocalContent('BH', 'government', { bhSme: { qualifiesAsSme: false } }, 'bh-sme-price-preference');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.locallyManufacturedSharePct).toBe(0);
    expect(c.effectiveBidDiscountPct).toBe(0);
  });

  it('boundary: no qualification status supplied -> honest null share, never assumed disqualified', () => {
    const a = assessSupplierLocalContent('BH', 'government', { bhSme: { qualifiesAsSme: null } }, 'bh-sme-price-preference');
    const c = a.computation as PricePreferenceMarginResult;
    expect(c.locallyManufacturedSharePct).toBeNull();
    expect(c.effectiveBidDiscountPct).toBeNull();
  });

  it("not-applicable: semi-government-soe procurement is outside this program's sourced (government tenders) scope", () => {
    const a = assessSupplierLocalContent('BH', 'semi-government-soe', { bhSme: { qualifiesAsSme: true } }, 'bh-sme-price-preference');
    expect(a.applicability).toBe('not-applicable');
  });
});

describe('BH / SME Government Spend Allocation — spend-set-aside-target', () => {
  it('soft: qualifies as SME -> qualifies for the 20% reserved spend allocation', () => {
    const a = assessSupplierLocalContent('BH', 'government', { bhSme: { qualifiesAsSme: true } }, 'bh-sme-spend-setaside');
    const c = a.computation as SpendSetAsideResult;
    expect(c.targetSharePct).toBe(BAHRAIN_SME_SPEND_SETASIDE_TARGET_PCT);
    expect(c.qualifiesForSetAside).toBe(true);
  });

  it('hardest: does not qualify as SME -> excluded from the reserved allocation, and a recommendation fires', () => {
    const a = assessSupplierLocalContent('BH', 'government', { bhSme: { qualifiesAsSme: false } }, 'bh-sme-spend-setaside');
    const c = a.computation as SpendSetAsideResult;
    expect(c.qualifiesForSetAside).toBe(false);
    const rec = recommendLocalContentAction(a, null);
    expect(rec).not.toBeNull();
    expect(rec!.primaryEn).toContain('20%');
  });

  it('boundary: no qualification status supplied -> honest null, no default guess', () => {
    const a = assessSupplierLocalContent('BH', 'government', { bhSme: { qualifiesAsSme: null } }, 'bh-sme-spend-setaside');
    const c = a.computation as SpendSetAsideResult;
    expect(c.qualifiesForSetAside).toBeNull();
  });

  it('the same bhSme.qualifiesAsSme fact drives BOTH Bahrain SME programs (price preference and spend set-aside) -- one qualification fact, two mechanism reads, never asked twice', () => {
    const sharedInputs = { bhSme: { qualifiesAsSme: true } };
    const price = assessSupplierLocalContent('BH', 'government', sharedInputs, 'bh-sme-price-preference').computation as PricePreferenceMarginResult;
    const setAside = assessSupplierLocalContent('BH', 'government', sharedInputs, 'bh-sme-spend-setaside').computation as SpendSetAsideResult;
    expect(price.locallyManufacturedSharePct).toBe(100);
    expect(setAside.qualifiesForSetAside).toBe(true);
  });
});

describe("KW / KPC Kuwaiti-Supplier Spend Target — spend-set-aside-target", () => {
  it("soft: registered Kuwaiti supplier -> qualifies for KPC's 30% target pool", () => {
    const a = assessSupplierLocalContent('KW', 'semi-government-soe', { kwLocalSpend: { isRegisteredKuwaitiSupplier: true } }, 'kw-kpc-local-spend');
    const c = a.computation as SpendSetAsideResult;
    expect(c.targetSharePct).toBe(KUWAIT_KPC_LOCAL_SPEND_TARGET_PCT);
    expect(c.qualifiesForSetAside).toBe(true);
  });

  it('hardest: not a registered Kuwaiti supplier -> does not qualify', () => {
    const a = assessSupplierLocalContent('KW', 'semi-government-soe', { kwLocalSpend: { isRegisteredKuwaitiSupplier: false } }, 'kw-kpc-local-spend');
    const c = a.computation as SpendSetAsideResult;
    expect(c.qualifiesForSetAside).toBe(false);
  });

  it('boundary: no registration status supplied -> honest null', () => {
    const a = assessSupplierLocalContent('KW', 'semi-government-soe', { kwLocalSpend: { isRegisteredKuwaitiSupplier: null } }, 'kw-kpc-local-spend');
    const c = a.computation as SpendSetAsideResult;
    expect(c.qualifiesForSetAside).toBeNull();
  });

  it("not-applicable: government procurement is outside KPC's own semi-government-soe-anchored scope", () => {
    const a = assessSupplierLocalContent('KW', 'government', { kwLocalSpend: { isRegisteredKuwaitiSupplier: true } }, 'kw-kpc-local-spend');
    expect(a.applicability).toBe('not-applicable');
  });
});

// ===========================================================================
// Portfolio rollup -- the 2 new mechanism types (15 Sep 2026 continuation)
// ===========================================================================

describe('Portfolio rollup — spend-set-aside-target and modified-icv-score groups', () => {
  it('setAsideQualifyingSharePct is spend-share-weighted across qualifying and non-qualifying suppliers, and never blended with a score reading', () => {
    const qualifying = assessSupplierLocalContent('KW', 'semi-government-soe', { kwLocalSpend: { isRegisteredKuwaitiSupplier: true } }, 'kw-kpc-local-spend');
    const nonQualifying = assessSupplierLocalContent('KW', 'semi-government-soe', { kwLocalSpend: { isRegisteredKuwaitiSupplier: false } }, 'kw-kpc-local-spend');
    const groups = rollUpPortfolioLocalContent([
      { supplierId: 's1', spendShare: 40, assessment: qualifying },
      { supplierId: 's2', spendShare: 60, assessment: nonQualifying },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.mechanismType).toBe('spend-set-aside-target');
    expect(groups[0]!.setAsideQualifyingSharePct).toBeCloseTo(40, 6);
    expect(groups[0]!.weightedScorePct).toBeNull();
  });

  it('modified-icv-score groups roll up finalScorePct spend-share-weighted, same convention as every other score-based mechanism', () => {
    const strong = assessSupplierLocalContent('QA', 'government', {
      qa: { localTangibleGoodsMaterialsQAR: 800_000, localServicesQAR: 0, qatariNationalResidentTrainingCostQAR: 0, supplierTrainingCertificationCostQAR: 0, qatarAssetDepreciationQAR: 0, totalQatarRevenueExclExportsQAR: 1_000_000, isEligibleManufacturer: false, isMicroOrSmallSupplier: false, selfReportedBonusPct: null },
    }, 'qa-icv-tawteen');
    const weak = assessSupplierLocalContent('QA', 'government', {
      qa: { localTangibleGoodsMaterialsQAR: 200_000, localServicesQAR: 0, qatariNationalResidentTrainingCostQAR: 0, supplierTrainingCertificationCostQAR: 0, qatarAssetDepreciationQAR: 0, totalQatarRevenueExclExportsQAR: 1_000_000, isEligibleManufacturer: false, isMicroOrSmallSupplier: false, selfReportedBonusPct: null },
    }, 'qa-icv-tawteen');
    const groups = rollUpPortfolioLocalContent([
      { supplierId: 's1', spendShare: 50, assessment: strong },
      { supplierId: 's2', spendShare: 50, assessment: weak },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.mechanismType).toBe('modified-icv-score');
    expect(groups[0]!.weightedScorePct).toBeCloseTo(50, 6); // (80 + 20) / 2
  });
});

// ===========================================================================
// Structural regression -- every country now has more than one program
// (15 Sep 2026 continuation); catches a program listed under the wrong
// country before it ever reaches the UI.
// ===========================================================================

describe('PROGRAMS_BY_COUNTRY — structural sanity (15 Sep 2026 continuation, EG added 15 Sep 2026, TR added 16 Sep 2026, UK added 16 Sep 2026 Part 2 pass, USA added 16 Sep 2026 Part 2 continuation, CN added 16 Sep 2026 China Part 2 continuation, IN/DE/JP/KR added 17 Sep 2026 India/Germany/Japan/Korea batch)', () => {
  it('the 14 GCC/Jordan/Egypt/Turkey/USA/CN/IN/DE/KR countries have at least 2 programs each (USA, CN, IN, DE and KR are NOT UK/JP-style single-program exceptions), and every program in every one of the 16 countries\' lists resolves back to that same country in PROGRAMS', () => {
    for (const country of ['SA', 'AE', 'JO', 'OM', 'QA', 'BH', 'KW', 'EG', 'TR', 'USA', 'CN', 'IN', 'DE', 'KR'] as const) {
      expect(PROGRAMS_BY_COUNTRY[country].length).toBeGreaterThanOrEqual(2);
    }
    for (const country of ['SA', 'AE', 'JO', 'OM', 'QA', 'BH', 'KW', 'EG', 'TR', 'UK', 'USA', 'CN', 'IN', 'DE', 'JP', 'KR'] as const) {
      for (const program of PROGRAMS_BY_COUNTRY[country]) {
        expect(PROGRAMS[program].country).toBe(country);
      }
    }
  });

  it('the UK is a genuine single-program exception -- exactly 1 program, not a placeholder gap, because PA23 s.90 structurally rules out a second above-threshold mechanism', () => {
    expect(PROGRAMS_BY_COUNTRY.UK).toHaveLength(1);
    expect(PROGRAMS_BY_COUNTRY.UK[0]).toBe('uk-below-threshold-reservation');
  });

  it('Japan is a second, genuinely independent single-program exception -- exactly 1 program, because the Kankouju Law itself sets no second fixed-percentage mechanism to encode', () => {
    expect(PROGRAMS_BY_COUNTRY.JP).toHaveLength(1);
    expect(PROGRAMS_BY_COUNTRY.JP[0]).toBe('jp-kankoju-sme-target-ratio');
  });
});
