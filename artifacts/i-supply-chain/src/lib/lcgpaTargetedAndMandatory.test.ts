import { describe, it, expect } from 'vitest';
import { computeTargetedLocalContent, gapToThreshold } from './lcgpaTargetedLocalContent';
import { allMandatoryProducts, searchMandatory, exemptionPriceTest, mandatorySectors, effectiveDateFor } from './lcgpaMandatoryList';
import { LCGPA_SECTORS } from './lcgpaContractMinimumData';

const base = { saudiCompensation: 0, foreignCompensation: 0, goodsServicesTotal: 0, goodsServicesLines: [], saudiTraining: 0, supplierDevelopment: 0, researchDevelopment: 0, depreciationTotal: 0, depreciationSaudiMade: 0 };

describe('targeted local content (official forms OM-LRF-09 / 10)', () => {
  it('workforce: Saudi 100%, foreign 53.4%', () => {
    const r = computeTargetedLocalContent({ ...base, mode: 'contract', saudiCompensation: 100, foreignCompensation: 100 });
    expect(r.basePct).toBeCloseTo(153.4 / 200, 6);
  });
  it('un-itemised goods remainder takes the weighted average of itemised lines', () => {
    const s = LCGPA_SECTORS[0];
    const r = computeTargetedLocalContent({ ...base, mode: 'contract', goodsServicesTotal: 1000, goodsServicesLines: [{ sectorId: s.id, spend: 500 }] });
    expect(r.basePct).toBeCloseTo(s.pct, 6);
    expect(r.itemisedShare).toBeCloseTo(0.5, 6);
    expect(r.warnings).toContain('itemised-below-70pct');
  });
  it('audited % overrides the sector %', () => {
    const s = LCGPA_SECTORS[0];
    const r = computeTargetedLocalContent({ ...base, mode: 'contract', goodsServicesTotal: 100, goodsServicesLines: [{ sectorId: s.id, spend: 100, auditedPct: 0.9 }] });
    expect(r.basePct).toBeCloseTo(0.9, 6);
  });
  it('training, supplier development and R&D count at 100%', () => {
    const r = computeTargetedLocalContent({ ...base, mode: 'contract', saudiTraining: 10, supplierDevelopment: 10, researchDevelopment: 10 });
    expect(r.basePct).toBe(1);
  });
  it('depreciation: Saudi-made 100%, rest 30%', () => {
    const r = computeTargetedLocalContent({ ...base, mode: 'contract', depreciationTotal: 100, depreciationSaudiMade: 40 });
    expect(r.localValue).toBeCloseTo(40 + 60 * 0.3, 6);
  });
  it('enterprise R&D incentive: full 10 pts at >=2% of revenue, pro-rata below, capped at 100%', () => {
    const full = computeTargetedLocalContent({ ...base, mode: 'enterprise', saudiCompensation: 1000, researchDevelopment: 20, revenue: 1000 });
    expect(full.rdIncentive).toBeCloseTo(0.1, 9);
    const half = computeTargetedLocalContent({ ...base, mode: 'enterprise', foreignCompensation: 1000, researchDevelopment: 10, revenue: 1000 });
    expect(half.rdIncentive).toBeCloseTo(0.05, 9);
    expect(full.targetedPct).toBe(1);
    const contract = computeTargetedLocalContent({ ...base, mode: 'contract', saudiCompensation: 1000, researchDevelopment: 20, revenue: 1000 });
    expect(contract.rdIncentive).toBe(0);
  });
  it('gap to threshold', () => {
    expect(gapToThreshold(0.4, 0.5).meets).toBe(false);
    expect(gapToThreshold(0.5, 0.5).meets).toBe(true);
  });
});

describe('mandatory list data + lookup', () => {
  it('has 1,444 products over 16 sectors', () => {
    expect(allMandatoryProducts().length).toBe(1444);
    expect(mandatorySectors().length).toBe(16);
  });
  it('ceilings are only 10/15/25/30 or null', () => {
    const set = new Set(allMandatoryProducts().map((p) => p.ceilingPct));
    for (const v of set) expect([10, 15, 25, 30, null]).toContain(v);
  });
  it('finds concrete reinforcement by code and by English name', () => {
    expect(searchMandatory({ query: '2001' }).items.some((p) => p.nameEn.includes('Concrete Reinforcement'))).toBe(true);
    expect(searchMandatory({ query: 'reinforcement' }).total).toBeGreaterThan(0);
  });
  it('SOE and government effective dates differ for a known product', () => {
    const p = searchMandatory({ query: 'Concrete Reinforcement Materials', sectorIndex: 0 }).items[0];
    expect(effectiveDateFor(p, 'government')).toBe('2019-12-09');
    expect(effectiveDateFor(p, 'soe')).toBe('2022-12-18');
  });
  it('exemption price test', () => {
    const t = exemptionPriceTest(100, 140, 30)!;
    expect(t.exceedsCeiling).toBe(true);
    expect(t.negotiateTargetPrice).toBeCloseTo(130, 6);
    expect(exemptionPriceTest(100, 120, 30)!.exceedsCeiling).toBe(false);
    expect(exemptionPriceTest(0, 120, 30)).toBeNull();
  });
});
