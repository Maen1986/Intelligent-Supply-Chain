import { describe, it, expect } from 'vitest';
import {
  classifySubtype, detectSituations, detectMigrations, assess, summarisePortfolio,
  SUBTYPES, ALTERNATIVES_FOR_MIGRATION, RECURRENCE_THRESHOLD,
  type SubtypeSupplierInput,
} from './supplierKraljicSubtypes';

const base = (o: Partial<SubtypeSupplierInput>): SubtypeSupplierInput => ({ supplierId: 's1', name: 'S1', quadrant: 'bottleneck', ...o });

describe('bottleneck classification', () => {
  it('locked: zero alternatives and spec cannot change', () => {
    const r = classifySubtype(base({ facts: { qualifiedAlternatives: 0, specLoosenable: false, constraintCause: 'regulated-licensed' } }));
    expect(r.subtype).toBe('bottleneck-locked');
    expect(r.whyEn).toContain('regulated or licensed');
    expect(r.whyEn).not.toContain('regulated-licensed');
    expect(r.whyAr).toContain('منظَّم');
  });
  it('movable: one alternative is enough (boundary 1)', () => {
    expect(classifySubtype(base({ facts: { qualifiedAlternatives: 1 } })).subtype).toBe('bottleneck-movable');
  });
  it('movable: spec can be loosened even with zero alternatives', () => {
    expect(classifySubtype(base({ facts: { qualifiedAlternatives: 0, specLoosenable: true } })).subtype).toBe('bottleneck-movable');
  });
  it('situational: temporary shortage wins', () => {
    expect(classifySubtype(base({ facts: { temporaryShortage: true, qualifiedAlternatives: 0, specLoosenable: false } })).subtype).toBe('bottleneck-situational');
  });
  it('never guesses: zero alternatives but spec unknown -> unclassified', () => {
    const r = classifySubtype(base({ facts: { qualifiedAlternatives: 0 } }));
    expect(r.subtype).toBe('unclassified');
    expect(r.missingFacts).toEqual(['specLoosenable']);
  });
  it('never guesses: no facts at all lists both missing facts', () => {
    const r = classifySubtype(base({}));
    expect(r.subtype).toBe('unclassified');
    expect(r.missingFacts).toEqual(['qualifiedAlternatives', 'specLoosenable']);
  });
});

describe('other quadrants', () => {
  it('leverage stable / volatile / unknown', () => {
    expect(classifySubtype(base({ quadrant: 'leverage', facts: { marketVolatility: 'stable' } })).subtype).toBe('leverage-stable');
    expect(classifySubtype(base({ quadrant: 'leverage', facts: { marketVolatility: 'volatile' } })).subtype).toBe('leverage-volatile');
    expect(classifySubtype(base({ quadrant: 'leverage' })).subtype).toBe('unclassified');
  });
  it('non-critical pool / process / unknown', () => {
    expect(classifySubtype(base({ quadrant: 'non-critical', facts: { poolableAcrossSites: true } })).subtype).toBe('noncritical-pool');
    expect(classifySubtype(base({ quadrant: 'non-critical', facts: { poolableAcrossSites: false } })).subtype).toBe('noncritical-process');
    expect(classifySubtype(base({ quadrant: 'non-critical' })).subtype).toBe('unclassified');
  });
  it('strategic follows power balance', () => {
    expect(classifySubtype(base({ quadrant: 'strategic', facts: { powerBalance: 'buyer' } })).subtype).toBe('strategic-exploit');
    expect(classifySubtype(base({ quadrant: 'strategic', facts: { powerBalance: 'balanced' } })).subtype).toBe('strategic-balance');
    expect(classifySubtype(base({ quadrant: 'strategic', facts: { powerBalance: 'supplier' } })).subtype).toBe('strategic-diversify');
    expect(classifySubtype(base({ quadrant: 'strategic' })).subtype).toBe('unclassified');
  });
});

describe('every definition is complete and bilingual', () => {
  it.each(Object.values(SUBTYPES))('$key has EN+AR text, an alternative and a trade-off', (d) => {
    for (const b of [d.label, d.meaning, d.primary, d.alternative, d.tradeoff, d.source]) {
      expect(b.en.length).toBeGreaterThan(5);
      expect(b.ar.length).toBeGreaterThan(5);
      expect(b.ar).not.toBe(b.en);
      expect(/[؀-ۿ]/.test(b.ar)).toBe(true);
    }
    expect(d.reviewDays).toBeGreaterThan(0);
  });
  it('anything not published is labelled an ISC convention', () => {
    for (const k of ['bottleneck-situational', 'leverage-volatile', 'unclassified'] as const) expect(SUBTYPES[k].basis).toBe('isc-convention');
  });
});

describe('situations: the problems this solves', () => {
  const locked = base({ facts: { qualifiedAlternatives: 0, specLoosenable: false } });
  it('locked with no contingency is a high-severity single point of failure', () => {
    const a = assess(locked);
    const s = a.situations.find((x) => x.key === 'locked-no-contingency');
    expect(s?.severity).toBe('high');
    expect(s?.links.some((l) => l.module === 'M03' && l.built)).toBe(true);
  });
  it('contingency on record removes that situation', () => {
    const a = assess({ ...locked, facts: { ...locked.facts, contingencyInPlace: true } });
    expect(a.situations.find((x) => x.key === 'locked-no-contingency')).toBeUndefined();
  });
  it('locked + failing: warns NOT to threaten exit', () => {
    const a = assess({ ...locked, recurrenceCount: RECURRENCE_THRESHOLD });
    const s = a.situations.find((x) => x.key === 'locked-recurring-failures');
    expect(s?.caution?.en).toMatch(/not threaten/i);
  });
  it('boundary: recurrence one below threshold raises nothing', () => {
    const a = assess({ ...locked, recurrenceCount: RECURRENCE_THRESHOLD - 1 });
    expect(a.situations.find((x) => x.key === 'locked-recurring-failures')).toBeUndefined();
  });
  it('movable + failing: exit is credible, but check cause mix first', () => {
    const a = assess(base({ facts: { qualifiedAlternatives: 1 }, recurrenceCount: 3 }));
    const s = a.situations.find((x) => x.key === 'movable-recurring-failures');
    expect(s?.caution?.en).toMatch(/cause mix/i);
  });
  it('locked in a highly concentrated category compounds', () => {
    const a = assess({ ...locked, hhiBand: 'highlyConcentrated' });
    expect(a.situations.some((x) => x.key === 'locked-and-concentrated')).toBe(true);
    expect(assess({ ...locked, hhiBand: 'competitive' }).situations.some((x) => x.key === 'locked-and-concentrated')).toBe(false);
  });
  it('volatile leverage asks for an index clause (M03 link)', () => {
    const a = assess(base({ quadrant: 'leverage', facts: { marketVolatility: 'volatile' } }));
    expect(a.situations.find((x) => x.key === 'volatile-needs-index')?.links.some((l) => l.module === 'M03')).toBe(true);
  });
  it('the M04 link is marked built (hand-off function exists)', () => {
    const a = assess(base({ facts: { qualifiedAlternatives: 1 } }));
    const l = a.situations.flatMap((x) => x.links).find((x) => x.module === 'M04');
    expect(l?.built).toBe(true);
  });
  it('an unclassified supplier raises no situations from guesses', () => {
    expect(assess(base({})).situations).toEqual([]);
  });
  it('every situation is bilingual and mapped to a Problem Map area', () => {
    const all = [
      assess({ ...locked, recurrenceCount: 2, hhiBand: 'highlyConcentrated' }),
      assess(base({ facts: { qualifiedAlternatives: 1 }, recurrenceCount: 2 })),
      assess(base({ facts: { temporaryShortage: true } })),
      assess(base({ quadrant: 'leverage', facts: { marketVolatility: 'volatile' }, recurrenceCount: 2 })),
      assess(base({ quadrant: 'non-critical', facts: { poolableAcrossSites: true } })),
      assess(base({ quadrant: 'strategic', facts: { powerBalance: 'supplier' }, quadrantPriorQuarter: 'leverage' })),
    ].flatMap((a) => a.situations);
    expect(all.length).toBeGreaterThan(8);
    for (const s of all) {
      expect(/[؀-ۿ]/.test(s.problem.ar) && /[؀-ۿ]/.test(s.action.ar)).toBe(true);
      expect(['Supplier Governance', 'Risk Management']).toContain(s.problemMapArea);
    }
  });
});

describe('migration alerts (dynamic)', () => {
  it('bottleneck gaining two alternatives -> review as non-critical, never leverage (boundary 2)', () => {
    const m = detectMigrations(base({ facts: { qualifiedAlternatives: ALTERNATIVES_FOR_MIGRATION } }));
    expect(m.map((x) => x.trigger)).toContain('alternatives-gained');
    expect(m.find((x) => x.trigger === 'alternatives-gained')?.reviewAs).toBe('non-critical');
    expect(detectMigrations(base({ facts: { qualifiedAlternatives: ALTERNATIVES_FOR_MIGRATION - 1 } }))).toEqual([]);
  });
  it('leverage with recurring failures -> sourced non-performance trigger', () => {
    const m = detectMigrations(base({ quadrant: 'leverage', recurrenceCount: 2 }));
    expect(m[0].trigger).toBe('supplier-non-performance');
    expect(m[0].basis).toBe('sourced');
  });
  it('quadrant changed since last quarter', () => {
    const m = detectMigrations(base({ quadrant: 'leverage', quadrantPriorQuarter: 'bottleneck' }));
    expect(m.find((x) => x.trigger === 'quadrant-changed')?.fromQuadrant).toBe('bottleneck');
  });
  it('same quadrant, no signals -> nothing', () => {
    expect(detectMigrations(base({ quadrantPriorQuarter: 'bottleneck' }))).toEqual([]);
  });
  it('threshold is overridable', () => {
    expect(detectMigrations(base({ quadrant: 'leverage', recurrenceCount: 1 }), { recurrenceThreshold: 1 }).length).toBe(1);
  });
});

describe('portfolio outcomes', () => {
  const set: SubtypeSupplierInput[] = [
    base({ supplierId: 'a', facts: { qualifiedAlternatives: 0, specLoosenable: false } }),
    base({ supplierId: 'b', facts: { qualifiedAlternatives: 0, specLoosenable: false, contingencyInPlace: true } }),
    base({ supplierId: 'c', facts: { qualifiedAlternatives: 2 } }),
    base({ supplierId: 'd', quadrant: 'non-critical', annualSpendSAR: 10000, facts: { poolableAcrossSites: true } }),
    base({ supplierId: 'e', quadrant: 'non-critical', facts: { poolableAcrossSites: true } }),
    base({ supplierId: 'f', quadrant: 'leverage' }),
  ];
  const s = summarisePortfolio(set);
  it('counts exposures and candidates from the data', () => {
    expect(s.total).toBe(6);
    expect(s.lockedWithoutContingency).toBe(1);
    expect(s.movableBottlenecks).toBe(1);
    expect(s.migrations).toBe(1);
  });
  it('pool spend counts only suppliers that have spend and says how many', () => {
    expect(s.poolable).toEqual({ suppliers: 2, withSpend: 1, spendSAR: 10000 });
  });
  it('reports unclassified and which facts are missing', () => {
    expect(s.unclassified).toBe(1);
    expect(s.missingFactCounts.marketVolatility).toBe(1);
  });
  it('counts sum to total', () => {
    expect(Object.values(s.bySubtype).reduce((a, b) => a + b, 0)).toBe(s.total);
  });
  it('empty portfolio is safe', () => {
    expect(summarisePortfolio([]).total).toBe(0);
  });
});
