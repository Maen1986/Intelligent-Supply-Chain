// Full Saudi trial: a realistic high-value mixed-scope tender walked through every Saudi mechanism end to end.
import { describe, it, expect } from 'vitest';
import { findMechanisms } from './lcgpaMechanismFinder';
import { LCGPA_SECTORS } from './lcgpaContractMinimumData';
import { computeContractMinimum, financialEvaluation } from './lcgpaContractMinimum';
import { computeTargetedLocalContent, gapToThreshold } from './lcgpaTargetedLocalContent';
import { searchMandatory, exemptionPriceTest, effectiveDateFor, allMandatoryProducts } from './lcgpaMandatoryList';
import { assessSupplierLocalContent, PROGRAMS_BY_COUNTRY } from './supplierLocalContentEligibility';

describe('Saudi end-to-end trial: facility-management + equipment tender, SAR 42M', () => {
  const on = findMechanisms('mixed', 42_000_000).filter(h => h.applies).map(h => h.program);
  it('step 1: mechanisms found for a mixed high-value contract', () => {
    expect(on).toEqual(expect.arrayContaining(['sa-mandatory-list', 'sa-price-preference', 'sa-contract-minimum', 'sa-financial-evaluation-weight']));
    expect(on).not.toContain('sa-sme-preference');
  });
  it('step 2: all 13 Saudi programs assess without throwing for government and SOE buyers', () => {
    for (const p of PROGRAMS_BY_COUNTRY.SA) for (const ctx of ['government', 'semi-government-soe'] as const) {
      const a = assessSupplierLocalContent('SA', ctx, {} as never, p);
      expect(a.reasonEn.length).toBeGreaterThan(0);
      expect(a.reasonAr.length).toBeGreaterThan(0);
    }
  });
  it('step 3: three-item contract (several sectors/sub-sectors) gives a sensible minimum study', () => {
    const picks = [LCGPA_SECTORS[2], LCGPA_SECTORS[3], LCGPA_SECTORS[7]]; // industrial, security, construction services
    const items = picks.map((s, i) => ({ sectorId: s.id, subSector: s.subs[0]?.ar, spend: 5_000_000 * (i + 1), localPriceDifferential: 100_000 * i }));
    const r = computeContractMinimum({ workforce: { saudiCompensation: 6_000_000, foreignCompensation: 9_000_000 }, items });
    expect(r.items).toHaveLength(3);
    expect(r.baselinePct).toBeGreaterThan(0.4);
    expect(r.baselinePct).toBeLessThan(1);
    expect(Math.abs(r.minimumPct - r.baselinePct)).toBeLessThan(0.02); // local price differentials enlarge the cost base
    const expected = (6e6 * 1 + 9e6 * 0.534 + 5e6 * picks[0].pct + 10e6 * picks[1].pct + 15e6 * picks[2].pct) / (15e6 + 30e6);
    expect(r.baselinePct).toBeCloseTo(expected, 6);
  });
  it('step 4: targeted form with multiple supplier items; shortfall vs the buyer minimum is reported', () => {
    const res = computeTargetedLocalContent({ mode: 'contract', saudiCompensation: 6e6, foreignCompensation: 9e6, goodsServicesTotal: 30e6,
      goodsServicesLines: [{ sectorId: LCGPA_SECTORS[2].id, spend: 10e6 }, { sectorId: LCGPA_SECTORS[3].id, spend: 12e6, auditedPct: 0.9 }],
      saudiTraining: 500_000, supplierDevelopment: 300_000, researchDevelopment: 0, depreciationTotal: 2e6, depreciationSaudiMade: 0.5e6 });
    expect(res.targetedPct).toBeGreaterThan(0.4);
    expect(res.itemisedShare).toBeCloseTo(22 / 30, 6);
    expect(gapToThreshold(res.targetedPct, 0.99).meets).toBe(false);
    expect(gapToThreshold(res.targetedPct, 0.2).meets).toBe(true);
  });
  it('step 5: mandatory list lookup (Arabic and English) and exemption price test', () => {
    const p = allMandatoryProducts()[0];
    expect(searchMandatory({ query: p.code }).total).toBeGreaterThan(0);
    expect(searchMandatory({ query: p.nameAr.slice(0, 6) }).total).toBeGreaterThan(0);
    expect(effectiveDateFor(p, 'government')).not.toBeUndefined();
    const withCeiling = allMandatoryProducts().find(x => x.ceilingPct !== null)!;
    const t = exemptionPriceTest(100, 100 * (1 + (withCeiling.ceilingPct! + 5) / 100), withCeiling.ceilingPct);
    expect(t?.exceedsCeiling).toBe(true);
    expect(t?.negotiateTargetPrice).toBeCloseTo(100 * (1 + withCeiling.ceilingPct! / 100), 6);
  });
  it('step 6: 60/40 financial evaluation ranks a dearer but more local bidder above a cheap non-local one', () => {
    const out = financialEvaluation({ bidders: [{ name: 'A', price: 100, localContentPct: 0.2 }, { name: 'B', price: 110, localContentPct: 0.7 }] });
    expect(out.find(o => o.name === 'B')!.rank).toBe(1);
  });
});
