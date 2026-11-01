import { describe, it, expect } from 'vitest';
import {
  TRANSITIONS, outgoing, incoming, findPath, routeFor, crossesQuadrant, DEFAULT_GOAL,
  QUADRANT_IDEAS, buildKraljicReport, reportToCsv,
} from './supplierKraljicNetwork';
import { SUBTYPES, type SubtypeKey, type SubtypeSupplierInput } from './supplierKraljicSubtypes';

const keys = (Object.keys(SUBTYPES) as SubtypeKey[]).filter((k) => k !== 'unclassified');
const arabic = (s: string) => /[؀-ۿ]/.test(s);

describe('network integrity', () => {
  it('edge ids are unique and endpoints are real sub-types', () => {
    const ids = new Set(TRANSITIONS.map((t) => t.id));
    expect(ids.size).toBe(TRANSITIONS.length);
    for (const t of TRANSITIONS) {
      expect(SUBTYPES[t.from]).toBeDefined();
      expect(SUBTYPES[t.to]).toBeDefined();
      expect(t.from).not.toBe(t.to);
      expect(t.from).not.toBe('unclassified');
      expect(t.to).not.toBe('unclassified');
    }
  });
  it('every sub-type can be left and can be reached (no dead ends, no orphans)', () => {
    for (const k of keys) {
      expect(outgoing(k).length, `${k} outgoing`).toBeGreaterThan(0);
      expect(incoming(k).length, `${k} incoming`).toBeGreaterThan(0);
    }
  });
  it('every edge is bilingual with steps and a payoff', () => {
    for (const t of TRANSITIONS) {
      for (const x of [t.trigger, t.payoff, ...t.steps]) { expect(x.en.length).toBeGreaterThan(3); expect(arabic(x.ar), t.id).toBe(true); }
      expect(t.steps.length).toBeGreaterThan(0);
    }
  });
  it('axis logic: falling risk on a Bottleneck never lands in Leverage', () => {
    const bad = TRANSITIONS.filter((t) => SUBTYPES[t.from].quadrant === 'bottleneck' && SUBTYPES[t.to].quadrant === 'leverage');
    expect(bad).toEqual([]);
  });
  it('moves exist both inside and across quadrants', () => {
    expect(TRANSITIONS.some((t) => crossesQuadrant(t))).toBe(true);
    expect(TRANSITIONS.some((t) => !crossesQuadrant(t))).toBe(true);
  });
  it('every sub-type is reachable from every other (one connected network)', () => {
    for (const a of keys) for (const z of keys) {
      if (a === z) continue;
      expect(findPath(a, z), `${a} -> ${z}`).not.toBeNull();
    }
  });
});

describe('routes', () => {
  it('Locked reaches Non-critical through Movable in two moves', () => {
    const p = findPath('bottleneck-locked', 'noncritical-process')!;
    expect(p.map((t) => t.to)).toEqual(['bottleneck-movable', 'noncritical-process']);
  });
  it('same position needs no moves', () => { expect(findPath('leverage-stable', 'leverage-stable')).toEqual([]); });
  it('default goals are all reachable', () => {
    for (const [from, goal] of Object.entries(DEFAULT_GOAL)) expect(findPath(from as SubtypeKey, goal as SubtypeKey), from).not.toBeNull();
  });
  it('routeFor reports total effort as the hardest step', () => {
    const r = routeFor('bottleneck-locked');
    expect(r.steps.length).toBe(2);
    expect(r.totalEffort).toBe('high');
  });
  it('hold positions and unclassified are handled honestly', () => {
    expect(routeFor('leverage-stable').steps).toEqual([]);
    expect(routeFor('leverage-stable').note.en).toMatch(/Hold/);
    expect(routeFor('unclassified').note.en).toMatch(/missing facts/i);
  });
});

describe('quadrant ideas', () => {
  it('each quadrant has a bilingual headline, idea, first question and measure', () => {
    expect(Object.keys(QUADRANT_IDEAS).sort()).toEqual(['bottleneck', 'leverage', 'non-critical', 'strategic']);
    for (const q of Object.values(QUADRANT_IDEAS)) {
      for (const x of [q.headline, q.idea, q.firstQuestion, q.measure]) { expect(x.en.length).toBeGreaterThan(10); expect(arabic(x.ar)).toBe(true); }
      expect(q.basis).toBe('isc-convention');
    }
  });
});

describe('report', () => {
  const inputs: SubtypeSupplierInput[] = [
    { supplierId: 'a', name: 'A, Ltd', quadrant: 'bottleneck', annualSpendSAR: 500000, facts: { qualifiedAlternatives: 0, specLoosenable: false } },
    { supplierId: 'b', name: 'B', quadrant: 'bottleneck', facts: { qualifiedAlternatives: 2 } },
    { supplierId: 'c', name: 'C', quadrant: 'leverage', annualSpendSAR: 2000000, facts: { marketVolatility: 'volatile' }, recurrenceCount: 2 },
    { supplierId: 'd', name: 'D', quadrant: 'non-critical' },
    { supplierId: 'e', name: 'E', quadrant: 'strategic', facts: { powerBalance: 'supplier' } },
  ];
  const r = buildKraljicReport(inputs, '2026-11-02');
  it('totals reconcile', () => {
    expect(r.total).toBe(5);
    expect(r.classified + r.unclassified).toBe(5);
    expect(r.unclassified).toBe(1);
    expect(r.quadrants.reduce((t, q) => t + q.count, 0)).toBe(5);
    expect(r.quadrants.map((q) => q.quadrant)).toEqual(['strategic', 'leverage', 'bottleneck', 'non-critical']);
  });
  it('spend counts only suppliers that have a figure, and says how many', () => {
    const bn = r.quadrants.find((q) => q.quadrant === 'bottleneck')!;
    expect(bn.spendSAR).toBe(500000);
    expect(bn.spendKnownCount).toBe(1);
    expect(bn.count).toBe(2);
  });
  it('review dates are computed from the as-of date', () => {
    const a = r.quadrants.find((q) => q.quadrant === 'bottleneck')!.rows.find((x) => x.supplierId === 'a')!;
    expect(a.review).toBe('2027-01-31');
  });
  it('priority moves put high-severity first and skip hold positions', () => {
    expect(r.priorityMoves.length).toBeGreaterThan(0);
    expect(r.priorityMoves[0].severity).toBe('high');
    expect(r.priorityMoves.every((m) => m.route.steps.length > 0)).toBe(true);
  });
  it('lists migrations and data gaps', () => {
    expect(r.migrations.some((m) => m.supplierId === 'b' && m.reviewAs === 'non-critical')).toBe(true);
    expect(r.migrations.some((m) => m.supplierId === 'c' && m.reviewAs === 'strategic')).toBe(true);
    expect(r.dataGaps.map((g) => g.supplierId)).toEqual(['d']);
  });
  it('CSV: BOM, header in both languages, commas escaped, one row per supplier', () => {
    const en = reportToCsv(r, 'en');
    expect(en.startsWith('﻿')).toBe(true);
    expect(en.split('\n').length).toBe(6);
    expect(en).toContain('"A, Ltd"');
    expect(arabic(reportToCsv(r, 'ar').split('\n')[0])).toBe(true);
  });
  it('empty portfolio is safe', () => {
    const e = buildKraljicReport([], '2026-11-02');
    expect(e.total).toBe(0);
    expect(reportToCsv(e, 'en').split('\n').length).toBe(1);
  });
});
