import { describe, it, expect } from 'vitest';
import spec from './fixtures/spec_tier_strings.json';
import { TIER_STRINGS, SHORT_STRINGS, SR_STRINGS, RESOLVED_GAPS, FORBIDDEN_TIER2_EN } from './tierStrings';
import { findForbiddenTier2Words } from './tierRecord';

const rows = spec.rows as Record<string, { en: string; ar: string }>;

describe('tier strings are EXACTLY the spec 6.15A table (soft)', () => {
  it('literal strings from the owner brief', () => {
    expect(TIER_STRINGS.t1.en).toBe('Tier 1: Certain');
    expect(TIER_STRINGS.t1.ar).toBe('المستوى الأول: مؤكد');
    expect(TIER_STRINGS.t2.en).toBe('Tier 2: Reviewed and corrected by ISC, please confirm before relying on it');
    expect(TIER_STRINGS.t2.ar).toBe('المستوى الثاني: راجعته ISC وصوبته، يرجى التأكد قبل الاعتماد عليه');
    expect(TIER_STRINGS.t2_prompt.en).toBe('Please confirm this with an expert.');
    expect(TIER_STRINGS.t2_prompt.ar).toBe('يرجى التأكد من ذلك مع خبير.');
    expect(TIER_STRINGS.t3.en).toBe('Tier 3: Cannot confirm. Specialist or legal expert opinion required');
    expect(TIER_STRINGS.t3.ar).toBe('المستوى الثالث: تعذر التأكد، يتطلب رأي مختص أو خبير قانوني');
    expect(TIER_STRINGS.t3_prompt.en).toBe('Specialist or legal expert opinion required. Please check with an expert.');
    expect(TIER_STRINGS.t3_prompt.ar).toBe('يتطلب رأي مختص أو خبير قانوني. يرجى الرجوع إلى خبير.');
  });
  for (const k of Object.keys(TIER_STRINGS) as (keyof typeof TIER_STRINGS)[]) {
    it(`tier.${k} equals the spec fixture (en and ar, except spec EN descriptions)`, () => {
      const r = rows[`tier.${k}`];
      expect(r).toBeDefined();
      expect(TIER_STRINGS[k].ar).toBe(r.ar);
      // Spec EN column of field_tier/choose carries "(field label)" / "(dropdown prompt)" annotations only.
      const enSpec = r.en.replace(/ \((field label|dropdown prompt)\)$/, '');
      expect(TIER_STRINGS[k].en).toBe(enSpec);
    });
  }
  it('screen-reader and short strings equal the spec, EN and AR (v3.8: English written)', () => {
    for (const k of ['sr_t1', 'sr_t2', 'sr_t3'] as const) for (const l of ['en', 'ar'] as const) expect(SR_STRINGS[k][l]).toBe(rows[`tier.${k}`][l]);
    for (const k of ['t1_short', 't2_short', 't3_short'] as const) for (const l of ['en', 'ar'] as const) expect(SHORT_STRINGS[k][l]).toBe(rows[`tier.${k}`][l]);
  });
  it('every key of the fixture (25) is in the package and vice versa', () => {
    const mine = [...Object.keys(TIER_STRINGS), ...Object.keys(SR_STRINGS), ...Object.keys(SHORT_STRINGS)].map((k) => `tier.${k}`).sort();
    expect(mine).toEqual(Object.keys(rows).sort());
    expect(mine).toHaveLength(25);
  });
  it('the five keys added in spec v3.8, literal', () => {
    expect(TIER_STRINGS.possible_answers).toEqual({ en: 'Possible answers', ar: 'الإجابات المحتملة' });
    expect(TIER_STRINGS.source_label).toEqual({ en: 'Source', ar: 'المصدر' });
    expect(TIER_STRINGS.vlevel_label).toEqual({ en: 'V level', ar: 'مستوى التحقق من المصدر' });
    expect(TIER_STRINGS.insufficient).toEqual({ en: 'Insufficient data to confirm a confidence tier.', ar: 'بيانات غير كافية للتأكد من مستوى الثقة.' });
    expect(TIER_STRINGS.close).toEqual({ en: 'Close', ar: 'إغلاق' });
  });
  it('no English cell is a description (no "(short badge)", no "Screen reader, ")', () => {
    for (const r of Object.values(rows)) { expect(r.en).not.toMatch(/\(short badge\)$/); expect(r.en).not.toMatch(/^Screen reader, /); }
  });
  it('Arabic cells: no diacritics, no Arabic-Indic digits, no English except ISC and V codes', () => {
    for (const [k, r] of Object.entries(rows)) {
      expect(r.ar, k).not.toMatch(/[\u064b-\u065f\u0670\u0640\u0660-\u0669\u06f0-\u06f9]/);
      expect(r.ar.replace(/ISC|V\d\*?/g, ''), k).not.toMatch(/[A-Za-z]/);
    }
  });
  it('label in name (WCAG 2.5.3): every sr sentence contains its visible label exactly, EN and AR', () => {
    const bidi = /[\u2066-\u2069\u200e\u200f]/g;
    for (const n of [1, 2, 3] as const) for (const l of ['en', 'ar'] as const) {
      const label = (TIER_STRINGS as Record<string, { en: string; ar: string }>)[`t${n}`][l];
      expect(SR_STRINGS[`sr_t${n}` as 'sr_t1'][l].replace(bidi, ''), `${n} ${l}`).toContain(label.replace(bidi, ''));
    }
    expect(SR_STRINGS.sr_t2.ar).toContain('وصوبته');
  });
  it('gaps G1..G8 are recorded as resolved', () => { expect(RESOLVED_GAPS.map((g) => g.id)).toEqual(['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8']); });
  it('guard (test 266): Tier 2 strings and the added labels carry no forbidden word', () => {
    for (const v of [TIER_STRINGS.t2, TIER_STRINGS.t2_prompt, SR_STRINGS.sr_t2, SHORT_STRINGS.t2_short, TIER_STRINGS.insufficient, TIER_STRINGS.possible_answers, TIER_STRINGS.source_label, TIER_STRINGS.vlevel_label, TIER_STRINGS.close])
      for (const l of ['en', 'ar'] as const) expect(findForbiddenTier2Words(v[l]), v[l]).toEqual([]);
  });
  it('fixture records the spec file hash', () => { expect(spec.sha256).toMatch(/^[0-9a-f]{64}$/); });
});

describe('guard words over the Tier 2 strings (hardest, test 259)', () => {
  const tier2Texts = [TIER_STRINGS.t2, TIER_STRINGS.t2_prompt, SR_STRINGS.sr_t2, SHORT_STRINGS.t2_short, TIER_STRINGS.never_certifies, TIER_STRINGS.insufficient];
  it('no forbidden word in any Tier 2 string, EN or AR', () => {
    for (const s of tier2Texts) for (const l of ['en', 'ar'] as const) {
      const v = (s as { en: string; ar: string })[l];
      if (v) expect(findForbiddenTier2Words(v), v).toEqual([]);
    }
  });
  it('whole-word rule: "confirm" and "please confirm" allowed, "confirmed" refused', () => {
    expect(findForbiddenTier2Words('Please confirm this')).toEqual([]);
    expect(findForbiddenTier2Words('it was Confirmed')).toEqual(['confirmed']);
    expect(findForbiddenTier2Words('confirmation, uncertain, certainty')).toEqual([]);
  });
  it.each(FORBIDDEN_TIER2_EN.map((w) => [w]))('refuses %s (any case)', (w) => {
    expect(findForbiddenTier2Words(`this is ${w.toUpperCase()}.`)).toEqual([w]);
  });
  it('Arabic forbidden words with and without diacritics; التأكد is allowed', () => {
    expect(findForbiddenTier2Words('هذا مؤكد')).toEqual(['مؤكد']);
    expect(findForbiddenTier2Words('هذا مُؤَكَّد')).toEqual(['مؤكد']); // diacritics stripped before matching
    expect(findForbiddenTier2Words('معتمد')).toEqual(['معتمد']);
    expect(findForbiddenTier2Words('موثّق')).toEqual(['موثق']);
    expect(findForbiddenTier2Words('يرجى التأكد من ذلك')).toEqual([]);
  });
});
