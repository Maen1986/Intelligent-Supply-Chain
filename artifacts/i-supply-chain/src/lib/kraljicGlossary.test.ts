import { describe, it, expect } from 'vitest';
import { KRALJIC_GLOSSARY } from './kraljicGlossary';
describe('Kraljic glossary', () => {
  it('has unique abbreviations, each with English and Arabic', () => {
    const seen = new Set<string>();
    for (const e of KRALJIC_GLOSSARY) {
      expect(seen.has(e.abbr)).toBe(false); seen.add(e.abbr);
      expect(e.en.length).toBeGreaterThan(2);
      expect(/[؀-ۿ]/.test(e.ar)).toBe(true);
    }
  });
  it('states honestly when an expansion is not confirmed', () => {
    const upc = KRALJIC_GLOSSARY.find((e) => e.abbr === 'UPC')!;
    expect(upc.confirmed).toBe(false);
    expect(upc.en).toMatch(/not confirmed/);
  });
  it('covers the abbreviations the owner asked about', () => {
    for (const a of ['IKTVA', 'CAR', 'OTIF', 'PPM', 'TCO', 'VMI', 'GPO', 'NIGP', 'PPSD', 'COPQ', 'ISM', 'CPSM', 'PO', 'SRM', 'RFP']) expect(KRALJIC_GLOSSARY.some((e) => e.abbr === a)).toBe(true);
  });
  it('gives every entry a plain-language meaning in English and Arabic', () => {
    for (const e of KRALJIC_GLOSSARY) {
      expect(e.plainEn.length).toBeGreaterThan(10);
      expect(/[\u0600-\u06FF]/.test(e.plainAr)).toBe(true);
    }
  });
  it('defines the abbreviations the screens use', () => {
    for (const a of ['NIGP', 'PPSD', 'COPQ', 'ISM', 'CPSM', 'PO', 'SRM', 'RFP', 'UAE', 'MRO']) expect(KRALJIC_GLOSSARY.some((e) => e.abbr === a)).toBe(true);
  });
});
