import { describe, it, expect } from 'vitest';
import { dueDiligenceHandoff, negotiationHandoff, quadrantOfSubtype } from './kraljicModuleLinks';
import { SUBTYPES, type SubtypeKey, type Quadrant } from './supplierKraljicSubtypes';
import { determineDueDiligenceTier } from './supplierQualificationGates';
import { recommendClientTactics } from './negotiationTactics';

const QUADS: Quadrant[] = ['strategic', 'leverage', 'bottleneck', 'non-critical'];
const KEYS = Object.keys(SUBTYPES) as SubtypeKey[];

describe('dueDiligenceHandoff (M04)', () => {
  it('always agrees with M04 determineDueDiligenceTier, for every quadrant and geographic score', () => {
    for (const q of [...QUADS, undefined]) {
      for (const g of [undefined, 1, 2, 3, 3.9, 4, 5]) {
        const mine = dueDiligenceHandoff({ subtype: 'unclassified', quadrant: q, geographicRisk: g });
        expect(mine.tier, `${q}/${g}`).toBe(determineDueDiligenceTier({ kraljicQuadrant: q, geographicRisk: g }));
      }
    }
  });
  it('boundary: geographic risk 4 is enhanced, 3.9 is not', () => {
    expect(dueDiligenceHandoff({ subtype: 'leverage-stable', geographicRisk: 4 }).tier).toBe('ENHANCED');
    expect(dueDiligenceHandoff({ subtype: 'leverage-stable', geographicRisk: 3.9 }).tier).toBe('STANDARD');
  });
  it('takes the quadrant from the sub-type when none is given', () => {
    expect(dueDiligenceHandoff({ subtype: 'bottleneck-locked' }).kraljicQuadrant).toBe('bottleneck');
    expect(dueDiligenceHandoff({ subtype: 'bottleneck-locked' }).tier).toBe('ENHANCED');
  });
  it('unclassified with no data is standard and says so, never a guess', () => {
    const h = dueDiligenceHandoff({ subtype: 'unclassified' });
    expect(h.kraljicQuadrant).toBeUndefined();
    expect(h.tier).toBe('STANDARD');
    expect(h.reason.en).toMatch(/Not classified/);
  });
  it('ignores NaN, infinity and null geographic risk', () => {
    for (const g of [NaN, Infinity, null]) {
      expect(dueDiligenceHandoff({ subtype: 'noncritical-pool', geographicRisk: g as number | null }).geographicRisk).toBeUndefined();
    }
  });
  it('every reason is bilingual and non-empty for every sub-type', () => {
    for (const k of KEYS) {
      const h = dueDiligenceHandoff({ subtype: k });
      expect(h.reason.en.length).toBeGreaterThan(10);
      expect(h.reason.ar).toMatch(/[؀-ۿ]/);
    }
  });
});

describe('negotiationHandoff (M06)', () => {
  it('gives a stance and bilingual note for every sub-type', () => {
    for (const k of KEYS) {
      const n = negotiationHandoff({ subtype: k });
      expect(n.stanceNote.en.length).toBeGreaterThan(10);
      expect(n.stanceNote.ar).toMatch(/[؀-ۿ]/);
    }
  });
  it('unclassified gets no stance', () => {
    expect(negotiationHandoff({ subtype: 'unclassified' }).stance).toBe('not-classified');
  });
  it('locked bottleneck is supplier-strong; exploit is buyer-strong', () => {
    expect(negotiationHandoff({ subtype: 'bottleneck-locked' }).stance).toBe('supplier-strong');
    expect(negotiationHandoff({ subtype: 'strategic-exploit' }).stance).toBe('buyer-strong');
  });
  it('the quadrant it hands over works with M06 tactics (chained check)', () => {
    for (const k of KEYS) {
      const q = negotiationHandoff({ subtype: k }).kraljicQuadrant;
      if (!q) continue;
      expect(recommendClientTactics(q).length, k).toBeGreaterThan(0);
    }
  });
  it('quadrantOfSubtype is undefined for unclassified', () => {
    expect(quadrantOfSubtype('unclassified')).toBeUndefined();
  });
});
