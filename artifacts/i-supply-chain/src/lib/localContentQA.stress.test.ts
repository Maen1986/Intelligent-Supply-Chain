// Ruthless QA: input hostility, numeric safety, capacity/scalability, data integrity, no-fabrication, boundaries.
import { describe, it, expect } from 'vitest';
import { parseAmount, parsePercent } from './parseLocaleNumber';
import { computeContractMinimum, financialEvaluation } from './lcgpaContractMinimum';
import { computeTargetedLocalContent, gapToThreshold } from './lcgpaTargetedLocalContent';
import { LCGPA_SECTORS } from './lcgpaContractMinimumData';
import { MANDATORY_ROWS, MANDATORY_SECTORS } from './lcgpaMandatoryListData';
import { searchMandatory, exemptionPriceTest } from './lcgpaMandatoryList';
import { findMechanisms } from './lcgpaMechanismFinder';
import { PROGRAM_BRIEFS } from './localContentBriefs';
import { PROGRAMS } from './supplierLocalContentEligibility';

const finite = (o: unknown): boolean => JSON.stringify(o, (_k, v) => (typeof v === 'number' && !Number.isFinite(v) ? '__BAD__' : v)).indexOf('__BAD__') === -1;
const t = (label: string, fn: () => void) => it(label, fn);

describe('QA input hostility', () => {
  t('Arabic-Indic and Persian digits and separators parse', () => {
    expect(parseAmount('٤٢٬٠٠٠٬٠٠٠')).toBe(42_000_000);
    expect(parseAmount('۱٫۵')).toBe(1.5);
    expect(parseAmount('42,000,000')).toBe(42_000_000);
    expect(parseAmount(' 1 000 ')).toBe(1000);
  });
  t('garbage, negatives, NaN, Infinity, scientific overflow all become 0 or are capped', () => {
    for (const bad of ['', 'abc', '-5', 'NaN', 'Infinity', '--', '1e999', '٪', null, undefined]) expect(parseAmount(bad as never)).toBeLessThanOrEqual(1e15);
    expect(parseAmount('abc')).toBe(0); expect(parseAmount('-5')).toBe(0); expect(parseAmount('Infinity')).toBe(0); expect(parseAmount('1e999')).toBe(0);
    expect(parseAmount('1e20')).toBe(1e15);
  });
  t('percent clamps to 100 and accepts % and ٪', () => {
    expect(parsePercent('250')).toBe(100); expect(parsePercent('٧٠٪')).toBe(70); expect(parsePercent('12.5%')).toBe(12.5); expect(parsePercent('-3')).toBe(0);
  });
  t('calculators never emit NaN/Infinity on empty, zero, negative, NaN or huge inputs', () => {
    const hostile = [0, -1, NaN, Infinity, 1e300, 0.0000001];
    for (const h of hostile) {
      expect(finite(computeContractMinimum({ workforce: { saudiCompensation: h, foreignCompensation: h }, items: [{ sectorId: 1, spend: h, localPriceDifferential: h, minPct: h }] }))).toBe(true);
      expect(finite(computeTargetedLocalContent({ mode: 'enterprise', saudiCompensation: h, foreignCompensation: h, goodsServicesTotal: h, goodsServicesLines: [{ sectorId: 999, spend: h, auditedPct: h }], saudiTraining: h, supplierDevelopment: h, researchDevelopment: h, depreciationTotal: h, depreciationSaudiMade: h, revenue: h }))).toBe(true);
      expect(finite(exemptionPriceTest(h, h, 10) ?? {})).toBe(true);
      expect(finite(financialEvaluation({ bidders: [{ name: 'a', price: h, localContentPct: h }, { name: 'b', price: 5, localContentPct: 0.5 }] }))).toBe(true);
    }
    expect(computeContractMinimum({ workforce: { saudiCompensation: 0, foreignCompensation: 0 }, items: [] }).baselinePct).toBe(0);
    expect(computeTargetedLocalContent({ mode: 'contract', saudiCompensation: 0, foreignCompensation: 0, goodsServicesTotal: 0, goodsServicesLines: [], saudiTraining: 0, supplierDevelopment: 0, researchDevelopment: 0, depreciationTotal: 0, depreciationSaudiMade: 0 }).targetedPct).toBe(0);
  });
  t('targeted % never exceeds 100% in enterprise mode even with a huge R&D incentive; contract mode has no incentive', () => {
    const base = { saudiCompensation: 1e6, foreignCompensation: 0, goodsServicesTotal: 0, goodsServicesLines: [], saudiTraining: 0, supplierDevelopment: 0, researchDevelopment: 1e6, depreciationTotal: 0, depreciationSaudiMade: 0, revenue: 1e6 };
    expect(computeTargetedLocalContent({ ...base, mode: 'enterprise' }).targetedPct).toBeLessThanOrEqual(1);
    expect(computeTargetedLocalContent({ ...base, mode: 'contract' }).rdIncentive).toBe(0);
  });
  t('unknown sector id does not throw and is flagged', () => {
    const r = computeTargetedLocalContent({ mode: 'contract', saudiCompensation: 1, foreignCompensation: 1, goodsServicesTotal: 10, goodsServicesLines: [{ sectorId: 12345, spend: 10 }], saudiTraining: 0, supplierDevelopment: 0, researchDevelopment: 0, depreciationTotal: 0, depreciationSaudiMade: 0 });
    expect(r.warnings).toContain('line-without-sector');
  });
  t('gap-to-threshold boundary is exact', () => {
    expect(gapToThreshold(0.6, 0.6).meets).toBe(true);
    expect(gapToThreshold(0.5999, 0.6).meets).toBe(false);
  });
  t('mechanism finder threshold boundary: 24,999,999 vs 25,000,000, and zero/negative value', () => {
    const has = (v: number, p: string) => findMechanisms('services-works', v).find(h => h.program === p)!.applies;
    expect(has(24_999_999, 'sa-contract-minimum')).toBe(false); expect(has(24_999_999, 'sa-sme-preference')).toBe(true);
    expect(has(25_000_000, 'sa-contract-minimum')).toBe(true); expect(has(25_000_000, 'sa-sme-preference')).toBe(false);
    expect(findMechanisms('supply', 1e12).filter(h => h.applies).length).toBe(2);
  });
  t('mandatory search survives regex/special characters, very long and empty queries', () => {
    for (const q of ['(', '[', '.*', '\\', 'a'.repeat(10_000), '   ', '<script>', "'; DROP TABLE", '؟']) expect(() => searchMandatory({ query: q })).not.toThrow();
    expect(searchMandatory({ query: '' }).total).toBe(MANDATORY_ROWS.length);
  });
});

describe('QA capacity and scalability', () => {
  const time = (fn: () => void) => { const s = performance.now(); fn(); return performance.now() - s; };
  t('contract minimum with 5,000 items stays fast (< 250 ms)', () => {
    const items = Array.from({ length: 5000 }, (_, i) => ({ sectorId: LCGPA_SECTORS[i % LCGPA_SECTORS.length].id, spend: 1000 + i, localPriceDifferential: i }));
    expect(time(() => computeContractMinimum({ workforce: { saudiCompensation: 1e6, foreignCompensation: 1e6 }, items }))).toBeLessThan(250);
  });
  t('targeted form with 5,000 supplier lines (< 250 ms)', () => {
    const goodsServicesLines = Array.from({ length: 5000 }, (_, i) => ({ sectorId: LCGPA_SECTORS[i % LCGPA_SECTORS.length].id, spend: 100 + i }));
    expect(time(() => computeTargetedLocalContent({ mode: 'contract', saudiCompensation: 1, foreignCompensation: 1, goodsServicesTotal: 1e9, goodsServicesLines, saudiTraining: 0, supplierDevelopment: 0, researchDevelopment: 0, depreciationTotal: 0, depreciationSaudiMade: 0 }))).toBeLessThan(250);
  });
  t('1,000 keystroke-style searches over all 1,444 products (< 1.5 s total)', () => {
    expect(time(() => { for (let i = 0; i < 1000; i++) searchMandatory({ query: ['خز', 'cab', '70', 'دواء', 'pump'][i % 5], limit: 8 }); })).toBeLessThan(1500);
  });
  t('financial evaluation with 10,000 bidders (< 250 ms) and ranks are a permutation', () => {
    const bidders = Array.from({ length: 10_000 }, (_, i) => ({ name: 'b' + i, price: 100 + (i % 97), localContentPct: (i % 100) / 100 }));
    let out: ReturnType<typeof financialEvaluation> = [];
    expect(time(() => { out = financialEvaluation({ bidders }); })).toBeLessThan(250);
    expect(out).toHaveLength(10_000);
    expect(Math.min(...out.map(o => o.rank))).toBe(1); expect(Math.max(...out.map(o => o.rank))).toBe(10_000);
  });
  t('all briefs loaded: payload sanity (briefs + notes stay under 600 KB of text)', () => {
    expect(JSON.stringify(PROGRAM_BRIEFS).length).toBeLessThan(600_000);
  });
});

describe('QA data integrity (official datasets)', () => {
  t('mandatory list: 1,444 unique codes, valid sector index, ceilings only 10/15/25/30/null, ISO dates', () => {
    expect(MANDATORY_ROWS.length).toBe(1444);
    // The official workbook itself reuses 8 Etimad codes for different products (source data issue, disclosed to the owner): code+name is the unique key.
    expect(new Set(MANDATORY_ROWS.map(r => r[0] + '|' + r[3])).size).toBe(1444);
    expect(new Set(MANDATORY_ROWS.map(r => r[0])).size).toBe(1435);
    for (const r of MANDATORY_ROWS) {
      expect(r[1]).toBeGreaterThanOrEqual(0); expect(r[1]).toBeLessThan(MANDATORY_SECTORS.length);
      expect([10, 15, 25, 30, null]).toContain(r[4]);
      for (const d of [r[5], r[6], r[8]]) if (d) expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r[2].length).toBeGreaterThan(0); expect(r[3].length).toBeGreaterThan(0);
    }
  });
  t('contract-minimum sectors: 38, unique ids, pct in [0,1], bilingual names, each with sub-sectors', () => {
    expect(LCGPA_SECTORS.length).toBe(38);
    expect(new Set(LCGPA_SECTORS.map(s => s.id)).size).toBe(38);
    for (const s of LCGPA_SECTORS) { expect(s.pct).toBeGreaterThanOrEqual(0); expect(s.pct).toBeLessThanOrEqual(1); expect(s.nameAr.length).toBeGreaterThan(0); expect(s.nameEn.length).toBeGreaterThan(0); expect(s.subs.length, s.nameEn).toBeGreaterThan(0); }
  });
});

describe('QA honesty (no fabricated figures)', () => {
  const nums = (s: string) => (s.match(/\d[\d,.]*/g) ?? []).map(x => x.replace(/[,.]+$/, ''));
  t('every percentage/amount in a non-Saudi-official brief headline appears in the program\'s own sourced note', () => {
    const official = new Set(['sa-mandatory-list', 'sa-price-preference', 'sa-contract-minimum', 'sa-financial-evaluation-weight', 'sa-sme-preference']);
    const bad: string[] = [];
    for (const [k, b] of Object.entries(PROGRAM_BRIEFS)) {
      if (official.has(k)) continue;
      const note = (PROGRAMS as Record<string, { sourceNoteEn: string }>)[k].sourceNoteEn.replace(/,/g, '');
      for (const n of nums(b.headline.value.en + ' ' + b.headline.label.en)) if (Number(n.replace(/,/g, '')) > 10) if (!note.includes(n.replace(/,/g, ''))) bad.push(`${k}: ${n}`);
    }
    expect(bad).toEqual([]);
  });
  t('every brief carries a confidence label and every Arabic text is non-identical to English', () => {
    for (const [k, b] of Object.entries(PROGRAM_BRIEFS)) { expect(b.confidence, k).toBeTruthy(); expect(b.verdict.ar, k).not.toBe(b.verdict.en); }
  });
});
