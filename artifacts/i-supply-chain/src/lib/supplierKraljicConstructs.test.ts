import { describe, it, expect } from 'vitest';
import { SUBTYPES, assess, type SubtypeKey } from './supplierKraljicSubtypes';
import { CONSTRUCTS } from './supplierKraljicConstructs';
import { CIPS_QUADRANT_LABEL, CIPS_ONE_LINE, PREFERENCING_LABEL } from './kraljicCipsWording';

const keys = Object.keys(SUBTYPES) as SubtypeKey[];
const ar = (s: string) => /[؀-ۿ]/.test(s);

describe('sub-type constructs', () => {
  it('every sub-type has a construct, why-here questions and grounding in both languages', () => {
    for (const k of keys) {
      const c = CONSTRUCTS[k];
      expect(c, k).toBeDefined();
      expect(c.whyHere.length).toBeGreaterThan(0);
      for (const t of [c.construct, c.grounding, ...c.whyHere]) { expect(t.en.length).toBeGreaterThan(5); expect(ar(t.ar)).toBe(true); }
    }
  });
  it('ISC-synthesis origin is declared for the sub-types no source defines', () => {
    expect(CONSTRUCTS['bottleneck-situational'].origin).toBe('isc-synthesis');
    expect(CONSTRUCTS['leverage-volatile'].origin).toBe('isc-synthesis');
    expect(CONSTRUCTS['bottleneck-movable'].origin).toBe('sourced');
  });
});

describe('new situations', () => {
  const strat = { supplierId: 's', name: 'S', quadrant: 'strategic' as const, facts: { powerBalance: 'supplier' as const, lockIn: true } };
  it('forced strategic dependence raises a high-severity situation with a no-threat caution', () => {
    const s = assess(strat).situations.find((x) => x.key === 'strategic-locked-in');
    expect(s?.severity).toBe('high');
    expect(s?.caution).toBeDefined();
  });
  it('no lock-in fact, no situation (never guess)', () => {
    expect(assess({ ...strat, facts: { powerBalance: 'supplier' } }).situations.some((x) => x.key === 'strategic-locked-in')).toBe(false);
  });
  it('routine item with operational stop risk is surfaced', () => {
    const r = assess({ supplierId: 'r', name: 'R', quadrant: 'non-critical', facts: { poolableAcrossSites: false, operationalStopRisk: true } });
    expect(r.situations.some((x) => x.key === 'routine-operational-exception')).toBe(true);
  });
});

describe('CIPS wording', () => {
  it('uses CIPS names first with aliases, in both languages', () => {
    expect(CIPS_QUADRANT_LABEL.strategic.en).toBe('Critical (Strategic)');
    expect(CIPS_QUADRANT_LABEL['non-critical'].en).toBe('Routine (Non-critical)');
    for (const q of Object.keys(CIPS_QUADRANT_LABEL) as Array<keyof typeof CIPS_QUADRANT_LABEL>) {
      expect(ar(CIPS_QUADRANT_LABEL[q].ar)).toBe(true);
      expect(CIPS_ONE_LINE[q].strategy.en.length).toBeGreaterThan(10);
    }
  });
  it('has the four Supplier Preferencing names', () => {
    expect(Object.keys(PREFERENCING_LABEL).sort()).toEqual(['core', 'development', 'exploitable', 'nuisance']);
  });
});
