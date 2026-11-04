// Round C (#668) -- exact-output pins for recommendLocalContentAction branches
// (DAP, GAMI, EP, EDIP, TR, BH). Added to close surviving mutants; exact EN/AR strings are
// frozen as inline snapshots so any wording/guard change is detected.
import { describe, it, expect } from 'vitest';
import { recommendLocalContentAction } from './supplierLocalContentEligibility';

const mk = (c: Record<string, unknown>): any => ({ applicability: 'applicable', computation: c });
const rec = (c: Record<string, unknown>) => recommendLocalContentAction(mk(c), null);

describe('Round C pins: DAP offset recommendation guards', () => {
  const base = { mechanismType: 'offset-multiplier-credit-gate', meetsOffsetObligation: false };
  it('null when obligation met / unknown', () => {
    expect(rec({ ...base, meetsOffsetObligation: true, shortfallINR: 100 })).toBeNull();
    expect(rec({ ...base, meetsOffsetObligation: null, shortfallINR: 100 })).toBeNull();
  });
  it('null when shortfall null, 0, or negative', () => {
    expect(rec({ ...base, shortfallINR: null })).toBeNull();
    expect(rec({ ...base, shortfallINR: 0 })).toBeNull();
    expect(rec({ ...base, shortfallINR: -5 })).toBeNull();
  });
  it('non-null for any positive shortfall, includes formatted amount', () => {
    const r = rec({ ...base, shortfallINR: 0.5 })!;
    expect(r).not.toBeNull();
    expect(r.primaryEn).toContain('INR 0.5 offset shortfall');
    expect(r.primaryAr).toContain('0.5');
    const r2 = rec({ ...base, shortfallINR: 1234567 })!;
    expect(r2.primaryEn).toContain((1234567).toLocaleString());
    expect(r2.primaryAr).toContain((1234567).toLocaleString());
    expect(r2.primaryEn.length).toBeGreaterThan(50);
    expect(r2.alternativeEn.length).toBeGreaterThan(50);
    expect(r2.primaryAr).toMatch(/[؀-ۿ]/);
    expect(r2.alternativeAr).toMatch(/[؀-ۿ]/);
  });
});

describe('Round C pins: GAMI liquidation recommendation guards', () => {
  const base = { mechanismType: 'gami-valuation-factor-credit-gate', meetsCommitment: false, requiredCommitmentSAR: 90_000_000 };
  it('null when commitment met/unknown', () => {
    expect(rec({ ...base, meetsCommitment: true, liquidationSAR: 5 })).toBeNull();
    expect(rec({ ...base, meetsCommitment: null, liquidationSAR: 5 })).toBeNull();
  });
  it('null when liquidation null / 0 / negative', () => {
    expect(rec({ ...base, liquidationSAR: null })).toBeNull();
    expect(rec({ ...base, liquidationSAR: 0 })).toBeNull();
    expect(rec({ ...base, liquidationSAR: -1 })).toBeNull();
  });
  it('commitment text uses formatted value, or empty string when null', () => {
    const r = rec({ ...base, liquidationSAR: 1 })!;
    expect(r.primaryEn).toContain(`SAR ${(90_000_000).toLocaleString()} commitment`);
    expect(r.primaryAr).toContain(`البالغ ${(90_000_000).toLocaleString()} ريال`);
    const n = rec({ ...base, requiredCommitmentSAR: null, liquidationSAR: 1 })!;
    expect(n.primaryEn).toContain('SAR  commitment');
    expect(n.primaryAr).toContain('البالغ  ريال');
    expect(n.primaryEn).not.toContain('undefined');
    expect(n.primaryAr).not.toContain('undefined');
    expect(r.alternativeEn.length).toBeGreaterThan(50);
    expect(r.alternativeAr).toMatch(/[؀-ۿ]/);
  });
});

describe('Round C pins: EP commitment recommendation', () => {
  const base = { mechanismType: 'import-value-participation-gate', meetsCommitment: false, requiredCommitmentSAR: 35_000_000 };
  it('null unless exactly false', () => {
    expect(rec({ ...base, meetsCommitment: true })).toBeNull();
    expect(rec({ ...base, meetsCommitment: null })).toBeNull();
  });
  it('formatted vs null commitment', () => {
    const r = rec(base)!;
    expect(r.primaryEn).toContain(`SAR ${(35_000_000).toLocaleString()} commitment`);
    expect(r.primaryAr).toContain(`البالغ ${(35_000_000).toLocaleString()} ريال`);
    const n = rec({ ...base, requiredCommitmentSAR: null })!;
    expect(n.primaryEn).toContain('SAR  commitment');
    expect(n.primaryAr).toContain('البالغ  ريال');
    expect(r.alternativeEn.length).toBeGreaterThan(50);
    expect(r.alternativeAr).toMatch(/[؀-ۿ]/);
  });
});

describe('Round C pins: EDIP recommendation pct text', () => {
  const base = { mechanismType: 'eu-content-threshold-gate', meetsEuContentThreshold: false, euContentThresholdPct: 65, nonEuContentCapPct: 35 };
  it('null unless exactly false', () => {
    expect(rec({ ...base, meetsEuContentThreshold: true, euOrAssociatedContentPct: 70 })).toBeNull();
    expect(rec({ ...base, meetsEuContentThreshold: null, euOrAssociatedContentPct: 70 })).toBeNull();
  });
  it('entered value is shown to 1 decimal; null shows placeholder in both languages', () => {
    const r = rec({ ...base, euOrAssociatedContentPct: 40.25 })!;
    expect(r.primaryEn).toContain('(currently 40.3%)'.replace('40.3', (40.25).toFixed(1)));
    expect(r.primaryAr).toContain(`(حالياً ${(40.25).toFixed(1)}%)`);
    const z = rec({ ...base, euOrAssociatedContentPct: 0 })!;
    expect(z.primaryEn).toContain('(currently 0.0%)');
    expect(z.primaryAr).toContain('(حالياً 0.0%)');
    const n = rec({ ...base, euOrAssociatedContentPct: null })!;
    expect(n.primaryEn).toContain('(currently not yet entered)');
    expect(n.primaryAr).toContain('(حالياً لم تُدخَل بعد)');
    expect(r.alternativeEn).toContain('35%');
    expect(r.alternativeAr).toContain('35');
  });
});

describe('Round C pins: TR industrialization recommendation text', () => {
  const base = {
    mechanismType: 'industrialization-liability-gate', meetsAllLiabilities: false,
    ysSmeThresholdPct: 20, eydepThresholdPct: 70, techAcquisitionThresholdPct: 2,
    meetsYsSmeThreshold: true, meetsEydepThreshold: true, meetsTechAcquisitionThreshold: true,
    ysSmeWorkSharePct: 25, eydepWorkSharePct: 75,
  };
  it('null unless exactly false', () => {
    expect(rec({ ...base, meetsAllLiabilities: true })).toBeNull();
    expect(rec({ ...base, meetsAllLiabilities: null })).toBeNull();
  });
  it('single YS/SME failure -> singular "liability", formatted pct', () => {
    const r = rec({ ...base, meetsYsSmeThreshold: false, ysSmeWorkSharePct: 12.34 })!;
    expect(r.primaryEn).toBe(`Close the shortfall on the failing liability before SSB's own contractual deadline: YS/SME work share (12.3% vs 20% required). Each of the three liabilities is independently binding -- raising one does not offset a shortfall on another.`);
    expect(r.primaryAr).toContain('YS/SME work share (12.3% vs 20% required)');
    expect(r.primaryAr).toMatch(/^أغلق النقص في الالتزام \(أو الالتزامات\) المتعثرة/);
  });
  it('single EYDEP failure and single TUK failure', () => {
    const e = rec({ ...base, meetsEydepThreshold: false, eydepWorkSharePct: 50 })!;
    expect(e.primaryEn).toBe(`Close the shortfall on the failing liability before SSB's own contractual deadline: EYDEP-accredited work share (50.0% vs 70% required). Each of the three liabilities is independently binding -- raising one does not offset a shortfall on another.`);
    const t = rec({ ...base, meetsTechAcquisitionThreshold: false })!;
    expect(t.primaryEn).toBe(`Close the shortfall on the failing liability before SSB's own contractual deadline: TUK technology-acquisition value (vs 2% of bid value required). Each of the three liabilities is independently binding -- raising one does not offset a shortfall on another.`);
  });
  it('multiple failures -> plural "liabilities", joined with "; " (EN) and "؛ " (AR)', () => {
    const r = rec({ ...base, meetsYsSmeThreshold: false, ysSmeWorkSharePct: 10, meetsEydepThreshold: false, eydepWorkSharePct: 60, meetsTechAcquisitionThreshold: false })!;
    expect(r.primaryEn).toBe(`Close the shortfall on the failing liabilities before SSB's own contractual deadline: YS/SME work share (10.0% vs 20% required); EYDEP-accredited work share (60.0% vs 70% required); TUK technology-acquisition value (vs 2% of bid value required). Each of the three liabilities is independently binding -- raising one does not offset a shortfall on another.`);
    expect(r.primaryAr).toContain('YS/SME work share (10.0% vs 20% required)؛ EYDEP-accredited work share (60.0% vs 70% required)؛ TUK technology-acquisition value (vs 2% of bid value required).');
    expect(r.alternativeEn.length).toBeGreaterThan(50);
    expect(r.alternativeAr).toMatch(/[؀-ۿ]/);
  });
  it('null work-share value renders as undefined% (current disclosed behaviour, pinned)', () => {
    const r = rec({ ...base, meetsYsSmeThreshold: false, ysSmeWorkSharePct: null })!;
    expect(r.primaryEn).toContain('YS/SME work share (undefined% vs 20% required)');
    const e = rec({ ...base, meetsEydepThreshold: false, eydepWorkSharePct: null })!;
    expect(e.primaryEn).toContain('EYDEP-accredited work share (undefined% vs 70% required)');
  });
});

describe('Round C pins: BH percentage-threshold text', () => {
  const base = { mechanismType: 'percentage-threshold-gate', meetsThreshold: false, thresholdPct: 36 };
  it('null unless exactly false; pct text value vs placeholder', () => {
    expect(rec({ ...base, meetsThreshold: true, actualPct: 50 })).toBeNull();
    expect(rec({ ...base, meetsThreshold: null, actualPct: 50 })).toBeNull();
    const r = rec({ ...base, actualPct: 20 })!;
    expect(r.primaryEn).toContain('(currently 20.0%)');
    expect(r.primaryAr).toContain('(حالياً 20.0%)');
    const z = rec({ ...base, actualPct: 0 })!;
    expect(z.primaryEn).toContain('(currently 0.0%)');
    const n = rec({ ...base, actualPct: null })!;
    expect(n.primaryEn).toContain('(currently not yet entered)');
    expect(n.primaryAr).toContain('(حالياً لم تُدخَل بعد)');
  });
});
