import { describe, it, expect } from 'vitest';
import { computeContractMinimum, financialEvaluation } from './lcgpaContractMinimum';
import { LCGPA_SECTORS } from './lcgpaContractMinimumData';

describe('LCGPA contract minimum calc', () => {
  it('has 38 sectors and every sector has at least one sub-sector', () => {
    expect(LCGPA_SECTORS.length).toBe(38);
    LCGPA_SECTORS.forEach((s) => expect(s.subs.length).toBeGreaterThan(0));
  });
  it('workforce-only: Saudi 100%, foreign 53.4%', () => {
    const r = computeContractMinimum({ workforce: { saudiCompensation: 100, foreignCompensation: 100 }, items: [] });
    expect(r.baselinePct).toBeCloseTo((100 + 53.4) / 200, 6);
  });
  it('item at sector %, minimum below baseline is ignored', () => {
    const s = LCGPA_SECTORS[0];
    const r = computeContractMinimum({ workforce: { saudiCompensation: 0, foreignCompensation: 0 }, items: [{ sectorId: s.id, spend: 1000, minPct: s.pct / 2 }] });
    expect(r.baselinePct).toBeCloseTo(s.pct, 6);
    expect(r.items[0].minPctIgnored).toBe(true);
    expect(r.minimumPct).toBeCloseTo(s.pct, 6);
  });
  it('higher minimum with price differential raises pct and cost', () => {
    const s = LCGPA_SECTORS[0];
    const hi = Math.min(1, s.pct + 0.2);
    const r = computeContractMinimum({ workforce: { saudiCompensation: 0, foreignCompensation: 0 }, items: [{ sectorId: s.id, spend: 1000, minPct: hi, localPriceDifferential: 100 }] });
    expect(r.minimumPct).toBeCloseTo(hi, 6);
    expect(r.financialImpact).toBe(100);
  });
  it('flags >10% cost mismatch', () => {
    const r = computeContractMinimum({ workforce: { saudiCompensation: 100, foreignCompensation: 0 }, items: [], totalCostOverride: 150 });
    expect(r.warnings).toContain('cost-mismatch-10pct');
  });
  it('financial evaluation 60/40', () => {
    const rows = financialEvaluation({ bidders: [{ name: 'A', price: 100, localContentPct: 0.4 }, { name: 'B', price: 110, localContentPct: 0.6 }] });
    expect(rows.find((x) => x.name === 'A')!.total).toBeCloseTo(0.6 * 1 + 0.4 * (0.4 / 0.6), 6);
    expect(rows.find((x) => x.name === 'B')!.rank).toBe(1);
  });
});
