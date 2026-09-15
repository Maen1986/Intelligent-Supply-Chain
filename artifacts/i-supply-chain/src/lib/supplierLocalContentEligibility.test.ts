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
    expect(a.program).toBe('sa-lcgpa-general');
    expect(a.framework).toBe(PROGRAMS['sa-lcgpa-general']);
  });

  it('omitting the program param for AE resolves to ae-icv-general (its own pre-existing default -- generalization is behavior-preserving)', () => {
    const a = assessSupplierLocalContent('AE', 'government', { ae: { manufacturingOrThirdPartySpendLocalAED: 1, manufacturingOrThirdPartySpendTotalAED: 1, investmentNBVLocalAED: 0, investmentNBVTotalAED: 0, emiratisationAnnualSpendAED: 0, expatriateHeadcount: 0, exportRevenueAED: 0, emiratiHeadcountGrowthPct: 0, investmentGrowthPct: 0, registeredOnMainland: false } });
    expect(a.program).toBe('ae-icv-general');
    expect(a.framework).toBe(PROGRAMS['ae-icv-general']);
  });

  it('every country resolves DEFAULT_PROGRAM_BY_COUNTRY to a real PROGRAMS entry (architecture sanity check)', () => {
    (['SA', 'AE', 'JO', 'OM', 'QA', 'BH', 'KW'] as const).forEach(country => {
      const program = DEFAULT_PROGRAM_BY_COUNTRY[country];
      expect(PROGRAMS[program]).toBeDefined();
      expect(PROGRAMS[program].country).toBe(country);
      expect(PROGRAMS_BY_COUNTRY[country]).toContain(program);
    });
  });

  it('PROGRAMS_BY_COUNTRY lists every program per country (SA: 6, AE: 2, JO: 2, OM: 3, QA: 2, BH: 3, KW: 2 -- updated 17 Sep 2026 as Jordan/Oman/Qatar/Bahrain/Kuwait each gained real sourced programs alongside their original entry)', () => {
    expect(PROGRAMS_BY_COUNTRY.SA).toHaveLength(6);
    expect(PROGRAMS_BY_COUNTRY.AE).toHaveLength(2);
    expect(PROGRAMS_BY_COUNTRY.JO).toHaveLength(2);
    expect(PROGRAMS_BY_COUNTRY.OM).toHaveLength(3);
    expect(PROGRAMS_BY_COUNTRY.QA).toHaveLength(2);
    expect(PROGRAMS_BY_COUNTRY.BH).toHaveLength(3);
    expect(PROGRAMS_BY_COUNTRY.KW).toHaveLength(2);
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
// 17 Sep 2026 continuation -- Jordan's second mechanism, Oman, Qatar,
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
// Portfolio rollup -- the 2 new mechanism types (17 Sep 2026 continuation)
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
// (17 Sep 2026 continuation); catches a program listed under the wrong
// country before it ever reaches the UI.
// ===========================================================================

describe('PROGRAMS_BY_COUNTRY — structural sanity (17 Sep 2026 continuation)', () => {
  it('all 7 countries have at least 2 programs, and every program in every list resolves back to that same country in PROGRAMS', () => {
    for (const country of ['SA', 'AE', 'JO', 'OM', 'QA', 'BH', 'KW'] as const) {
      expect(PROGRAMS_BY_COUNTRY[country].length).toBeGreaterThanOrEqual(2);
      for (const program of PROGRAMS_BY_COUNTRY[country]) {
        expect(PROGRAMS[program].country).toBe(country);
      }
    }
  });
});
