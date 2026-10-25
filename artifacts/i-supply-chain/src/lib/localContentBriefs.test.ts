import { describe, it, expect } from 'vitest';
import { PROGRAMS_BY_COUNTRY, PROGRAMS } from './supplierLocalContentEligibility';
import { PROGRAM_BRIEFS } from './localContentBriefs';
import { findMechanisms } from './lcgpaMechanismFinder';

const all = Object.values(PROGRAMS_BY_COUNTRY).flat();
const textOf = (b: (typeof PROGRAM_BRIEFS)[string]) => [b.headline.value, b.headline.label, b.verdict, ...b.steps, ...b.watch, ...b.next.map(n => n.text)];

describe('Program briefs', () => {
  it('every program has a brief', () => {
    const missing = all.filter(p => !PROGRAM_BRIEFS[p]);
    expect(missing).toEqual([]);
  });
  it('no brief without a program', () => {
    expect(Object.keys(PROGRAM_BRIEFS).filter(k => !(k in PROGRAMS))).toEqual([]);
  });
  it('every brief has verdict, 2-4 steps, an action and bilingual non-empty text', () => {
    for (const [k, b] of Object.entries(PROGRAM_BRIEFS)) {
      expect(b.steps.length, k).toBeGreaterThanOrEqual(2);
      expect(b.steps.length, k).toBeLessThanOrEqual(4);
      expect(b.next.length, k).toBeGreaterThan(0);
      for (const t of textOf(b)) { expect(t.en.trim().length, k).toBeGreaterThan(0); expect(/[؀-ۿ]/.test(t.ar), k + ' ' + t.en).toBe(true); }
    }
  });
  it('Arabic text has no internal-process words or ASCII double hyphen', () => {
    for (const [k, b] of Object.entries(PROGRAM_BRIEFS)) for (const t of textOf(b)) { expect(t.ar, k).not.toMatch(/--|جولة|ثغرة/); expect(t.en, k).not.toMatch(/--/); }
  });
  it('SA mechanism finder: supply vs high-value services', () => {
    const on = (t: 'supply' | 'services-works', v: number) => findMechanisms(t, v).filter(h => h.applies).map(h => h.program);
    expect(on('supply', 50_000_000)).toEqual(['sa-mandatory-list', 'sa-price-preference']);
    expect(on('services-works', 30_000_000)).toContain('sa-contract-minimum');
    expect(on('services-works', 30_000_000)).not.toContain('sa-sme-preference');
    expect(on('services-works', 1_000_000)).toContain('sa-sme-preference');
  });
});
