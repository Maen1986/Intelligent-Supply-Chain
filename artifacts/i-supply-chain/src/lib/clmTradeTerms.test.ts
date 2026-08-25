import { describe, it, expect } from 'vitest';
import { INCOTERMS_2020, PAYMENT_TERMS, ISO_4217_CURRENCIES, currencyLabel } from './clmTradeTerms';

describe('INCOTERMS_2020', () => {
  it('has exactly the 11 real ICC Incoterms 2020 rules', () => {
    expect(INCOTERMS_2020).toHaveLength(11);
    expect(INCOTERMS_2020.map(i => i.code)).toEqual([
      'EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP', 'FAS', 'FOB', 'CFR', 'CIF',
    ]);
  });
  it('classifies the 4 sea/inland-waterway-only rules correctly', () => {
    const seaOnly = INCOTERMS_2020.filter(i => i.mode === 'sea-inland-waterway').map(i => i.code);
    expect(seaOnly).toEqual(['FAS', 'FOB', 'CFR', 'CIF']);
  });
  it('classifies the 7 any-mode rules correctly', () => {
    const anyMode = INCOTERMS_2020.filter(i => i.mode === 'any-mode').map(i => i.code);
    expect(anyMode).toEqual(['EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP']);
  });
  it('every rule has non-empty bilingual labels and notes', () => {
    for (const r of INCOTERMS_2020) {
      expect(r.label.length).toBeGreaterThan(0);
      expect(r.labelAr.length).toBeGreaterThan(0);
      expect(r.noteEn.length).toBeGreaterThan(0);
      expect(r.noteAr.length).toBeGreaterThan(0);
    }
  });
});

describe('PAYMENT_TERMS', () => {
  it('has exactly the 7 named payment-term categories', () => {
    expect(PAYMENT_TERMS).toHaveLength(7);
    expect(PAYMENT_TERMS.map(p => p.id)).toEqual([
      'advance', 'lc', 'documentary-collection', 'open-account', 'cod', 'consignment', 'escrow-milestone',
    ]);
  });
  it('LC cites UCP 600 and Documentary Collection cites URC 522 -- not conflated with general practice', () => {
    const lc = PAYMENT_TERMS.find(p => p.id === 'lc');
    const dc = PAYMENT_TERMS.find(p => p.id === 'documentary-collection');
    expect(lc?.sourceEn).toContain('UCP 600');
    expect(dc?.sourceEn).toContain('URC 522');
  });
  it('the 5 general-practice terms are honestly NOT attributed to a single ICC instrument', () => {
    const generalIds: Array<typeof PAYMENT_TERMS[number]['id']> = ['advance', 'open-account', 'cod', 'consignment', 'escrow-milestone'];
    for (const id of generalIds) {
      const t = PAYMENT_TERMS.find(p => p.id === id);
      expect(t?.sourceEn).toContain('not codified by a single ICC instrument');
    }
  });
});

describe('ISO_4217_CURRENCIES', () => {
  it('has a large, real currency list (not a hand-picked handful)', () => {
    expect(ISO_4217_CURRENCIES.length).toBeGreaterThan(150);
  });
  it('contains USD, SAR, EUR, AED, GBP, JPY, XDR', () => {
    const codes = ISO_4217_CURRENCIES.map(c => c.code);
    for (const code of ['USD', 'SAR', 'EUR', 'AED', 'GBP', 'JPY', 'XDR']) {
      expect(codes).toContain(code);
    }
  });
  it('excludes precious-metal and non-currency codes', () => {
    const codes = ISO_4217_CURRENCIES.map(c => c.code);
    for (const code of ['XAU', 'XAG', 'XPD', 'XPT', 'XTS', 'XXX', 'XBA', 'XBB', 'XBC', 'XBD']) {
      expect(codes).not.toContain(code);
    }
  });
  it('every entry has a non-empty English and Arabic label', () => {
    for (const c of ISO_4217_CURRENCIES) {
      expect(c.label.length).toBeGreaterThan(0);
      expect(c.labelAr.length).toBeGreaterThan(0);
    }
  });
  it('codes are unique', () => {
    const codes = ISO_4217_CURRENCIES.map(c => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe('currencyLabel', () => {
  it('returns undefined-safe empty string when no code given', () => {
    expect(currencyLabel(undefined, false)).toBe('');
  });
  it('formats a known code with its English label', () => {
    expect(currencyLabel('USD', false)).toContain('USD');
    expect(currencyLabel('USD', false)).toContain('Dollar');
  });
  it('formats a known code with its Arabic label', () => {
    expect(currencyLabel('SAR', true)).toContain('SAR');
    expect(currencyLabel('SAR', true)).toContain('ريال');
  });
  it('falls back to the raw code for an unknown code rather than fabricating a name', () => {
    expect(currencyLabel('ZZZ', false)).toBe('ZZZ');
  });
});
