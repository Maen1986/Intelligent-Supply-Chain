import { describe, it, expect } from 'vitest';
import { penaltyExposure, referralCheck, PENALTY_RULES, TOTAL_CAP_PCT } from './lcgpaPenalties';
import { checklistFor, TENDER_CHECKLIST } from './lcgpaTenderChecklist';

describe('penalty ceilings (Arts 29-32)', () => {
  it('one breach = its ceiling on the right base', () => {
    const r = penaltyExposure({ contractValue: 100e6, breaches: ['art31'] });
    expect(r.total).toBe(10e6); expect(r.capBinds).toBe(false);
  });
  it('item-based rule uses item value', () => {
    expect(penaltyExposure({ contractValue: 100e6, itemValue: 5e6, breaches: ['art30'] }).total).toBe(0.5e6);
    expect(penaltyExposure({ contractValue: 100e6, breaches: ['art30'] }).total).toBe(0); // no item value given: nothing invented
  });
  it('Art. 34: 20% cap binds across Art 30-32 but not Art 29(2)', () => {
    const r = penaltyExposure({ contractValue: 100e6, itemValue: 100e6, breaches: ['art31', 'art32-1', 'art32-2', 'art30'] });
    expect(r.underCap).toBe(10e6 + 5e6 + 10e6 + 10e6);
    expect(r.capBinds).toBe(true);
    expect(r.total).toBe(100e6 * TOTAL_CAP_PCT);
    const w = penaltyExposure({ contractValue: 100e6, breaches: ['art29-2', 'art31', 'art32-2', 'art32-1'] });
    expect(w.total).toBe(10e6 + 20e6); // 29(2) outside the cap + capped 20
  });
  it('other fines under the Law consume cap room; boundary exactly at cap does not bind', () => {
    expect(penaltyExposure({ contractValue: 100e6, breaches: ['art31', 'art32-2'] }).capBinds).toBe(false);
    const r = penaltyExposure({ contractValue: 100e6, breaches: ['art31'], otherFinesUnderLaw: 15e6 });
    expect(r.capBinds).toBe(true); expect(r.total).toBe(5e6);
  });
  it('stated tender rate is clamped to the ceiling, negatives and NaN ignored', () => {
    expect(penaltyExposure({ contractValue: 100e6, breaches: ['art31'], statedRates: { art31: 0.25 } }).total).toBe(10e6);
    expect(penaltyExposure({ contractValue: 100e6, breaches: ['art31'], statedRates: { art31: 0.04 } }).total).toBe(4e6);
    expect(penaltyExposure({ contractValue: NaN, breaches: ['art31'] }).total).toBe(0);
    expect(penaltyExposure({ contractValue: -5, breaches: [] }).total).toBe(0);
  });
  it('duplicates counted once; amended-text rule flagged', () => {
    const r = penaltyExposure({ contractValue: 10e6, breaches: ['art32-1', 'art32-1'] });
    expect(r.lines).toHaveLength(1); expect(r.lines[0].amendedText).toBe(true);
    expect(PENALTY_RULES.filter(x => x.amendedText).map(x => x.id)).toEqual(['art32-1']);
  });
});
describe('referral triggers (Arts 37-38)', () => {
  const lvl = (a: string, i: Parameters<typeof referralCheck>[0]) => referralCheck(i).find(f => f.article === a)!.level;
  it('supply gap boundary: exactly 50 is clear, 50.1 crosses', () => {
    expect(lvl('Art. 37(1)', { supplyShareGapPts: 50 })).toBe('clear');
    expect(lvl('Art. 37(1)', { supplyShareGapPts: 50.1 })).toBe('crossed');
  });
  it('local-content gap: printed figures 10 and 15 are never silently resolved', () => {
    expect(lvl('Art. 37(2)', { localContentGapPts: 10 })).toBe('clear');
    expect(lvl('Art. 37(2)', { localContentGapPts: 12 })).toBe('ambiguous');
    expect(lvl('Art. 37(2)', { localContentGapPts: 15 })).toBe('ambiguous');
    expect(lvl('Art. 37(2)', { localContentGapPts: 15.5 })).toBe('crossed');
  });
  it('repeat rules need 3 contracts; missing report', () => {
    expect(lvl('Art. 38(1)', { repeatSupplyContracts: 2 })).toBe('clear');
    expect(lvl('Art. 38(1)', { repeatSupplyContracts: 3 })).toBe('crossed');
    expect(lvl('Art. 38(2)', { repeatLcContracts: 3 })).toBe('ambiguous');
    expect(lvl('Art. 37(3)', { finalReportMissing: true })).toBe('crossed');
    expect(referralCheck({})).toEqual([]);
  });
  it('every flag is bilingual', () => {
    referralCheck({ supplyShareGapPts: 60, localContentGapPts: 12, finalReportMissing: true, repeatSupplyContracts: 3, repeatLcContracts: 3, repeatMissingFinalReports: 3 })
      .forEach(f => { expect(f.en.length).toBeGreaterThan(10); expect(/[؀-ۿ]/.test(f.ar)).toBe(true); });
  });
});
describe('tender checklist (Art. 7 and linked articles)', () => {
  const ids = (c: Parameters<typeof checklistFor>[0]) => checklistFor(c).map(i => i.id);
  it('high-value non-supply gets the minimum-content study, not the weight formula', () => {
    const x = ids({ kind: 'works-services', highValue: true, framework: false, hasMandatoryListItems: false });
    expect(x).toContain('minimum'); expect(x).not.toContain('weight'); expect(x).not.toContain('sme'); expect(x).toContain('plan');
  });
  it('high-value supply gets the weight formula and the Mandatory List items', () => {
    const x = ids({ kind: 'supply', highValue: true, framework: false, hasMandatoryListItems: true });
    expect(x).toContain('weight'); expect(x).toContain('ml-statement'); expect(x).not.toContain('minimum'); expect(x).toContain('price-pref');
  });
  it('below-high-value services get the SME preference only', () => {
    const x = ids({ kind: 'works-services', highValue: false, framework: true, hasMandatoryListItems: false });
    expect(x).toContain('sme'); expect(x).toContain('framework'); expect(x).not.toContain('weight'); expect(x).not.toContain('minimum');
  });
  it('mixed tenders mention predominant-value rule; all items cite an article and are bilingual', () => {
    expect(ids({ kind: 'mixed', highValue: false, framework: false, hasMandatoryListItems: false })).toContain('mixed');
    TENDER_CHECKLIST.forEach(i => { expect(i.article).toMatch(/Art/); expect(/[؀-ۿ]/.test(i.ar)).toBe(true); expect(i.en.length).toBeGreaterThan(10); });
    expect(new Set(TENDER_CHECKLIST.map(i => i.id)).size).toBe(TENDER_CHECKLIST.length);
  });
});
