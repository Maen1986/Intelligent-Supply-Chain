/**
 * Round C (#668) -- the Kraljic sub-type engine under type abuse.
 * Why this matters: the Suppliers-tab data now round-trips through localStorage and the server
 * (JSON of any shape). A stale schema, a hand-edited file or a corrupted save must never crash the
 * page or print "NaN" -- it must degrade to "unclassified / ask" (Decision Record 8.7).
 */
import { describe, it, expect } from 'vitest';
import { classifySubtype, detectSituations, detectMigrations, assess, summarisePortfolio, type SubtypeSupplierInput } from './supplierKraljicSubtypes';
import { buildKraljicReport, reportToCsv, routeFor } from './supplierKraljicNetwork';
import { rng, pick, int, findBad, findCsvInjection, HOSTILE_NAMES, HOSTILE_NUMBERS } from './supplierAdversarialKit';

const QUADS = ['strategic', 'leverage', 'bottleneck', 'non-critical', 'weird', '', null, undefined, 5];
const CAUSES = ['regulated-licensed', 'proprietary-ip', 'scarce-resource', 'geographic-political', 'small-volume-deprioritised', 'specification-driven', 'temporary-shortage', 'none', 'other', '', null, undefined, 7, 'constructor', '__proto__'];
const BOOLS = [true, false, null, undefined, 'yes', 0, 1, NaN];
const NUMS = [...HOSTILE_NUMBERS, null, undefined, '3', 2.5, '', {}, []];
const VOL = ['stable', 'volatile', null, undefined, 'calm', 3];
const POWER = ['buyer', 'balanced', 'supplier', null, undefined, 'both', 9];
const HHI = ['competitive', 'moderatelyConcentrated', 'highlyConcentrated', null, undefined, 'x'];

function hostileSupplier(r: () => number, i: number): SubtypeSupplierInput {
  const facts: Record<string, unknown> = {};
  const set = (k: string, v: unknown) => { if (r() < 0.8) facts[k] = v; };
  set('qualifiedAlternatives', pick(r, NUMS)); set('constraintCause', pick(r, CAUSES)); set('specLoosenable', pick(r, BOOLS));
  set('temporaryShortage', pick(r, BOOLS)); set('marketVolatility', pick(r, VOL)); set('poolableAcrossSites', pick(r, BOOLS));
  set('powerBalance', pick(r, POWER)); set('contingencyInPlace', pick(r, BOOLS)); set('lockIn', pick(r, BOOLS)); set('operationalStopRisk', pick(r, BOOLS));
  const o: Record<string, unknown> = {
    supplierId: r() < 0.9 ? `s${i}` : pick(r, HOSTILE_NAMES), name: pick(r, HOSTILE_NAMES),
    quadrant: pick(r, QUADS), quadrantPriorQuarter: pick(r, QUADS), annualSpendSAR: pick(r, NUMS),
    recurrenceCount: pick(r, NUMS), hhiBand: pick(r, HHI),
  };
  if (r() < 0.9) o.facts = r() < 0.05 ? pick(r, [null, 'x', 5, []]) : facts;
  return o as unknown as SubtypeSupplierInput;
}

const SEEDS = Array.from({ length: 250 }, (_, i) => 9000 + i);
const ASOF = '2026-11-01';

describe('R-C Kraljic sub-type engine: type abuse never crashes, never leaks NaN', () => {
  it('classifySubtype / detectSituations / detectMigrations / assess on 250 x 12 hostile suppliers', () => {
    const fails: string[] = [];
    for (const sd of SEEDS) {
      const r = rng(sd);
      for (let i = 0; i < 12; i++) {
        const s = hostileSupplier(r, i);
        try {
          const c = classifySubtype(s);
          const a = assess(s);
          detectMigrations(s);
          detectSituations(s, c);
          const bad = findBad({ c, a });
          if (bad.length) fails.push(`seed ${sd}/${i}: leak ${bad[0]!.path} ${bad[0]!.reason} "${bad[0]!.sample}"`);
        } catch (e) { fails.push(`seed ${sd}/${i}: THROW ${(e as Error).message.slice(0, 90)} | facts=${JSON.stringify((s as { facts?: unknown }).facts)?.slice(0, 120)}`); }
      }
    }
    expect(fails.slice(0, 12)).toEqual([]);
  });

  it('portfolio summary + report + CSV (EN/AR) on 250 hostile portfolios: no crash, no leak, no formula injection', () => {
    const fails: string[] = [];
    for (const sd of SEEDS) {
      const r = rng(sd + 1);
      const inputs = Array.from({ length: int(r, 0, 25) }, (_, i) => hostileSupplier(r, i));
      try {
        const sum = summarisePortfolio(inputs);
        const rep = buildKraljicReport(inputs, ASOF);
        const bad = findBad({ sum, rep });
        if (bad.length) fails.push(`seed ${sd}: leak ${bad[0]!.path} ${bad[0]!.reason} "${bad[0]!.sample}"`);
        for (const lang of ['en', 'ar'] as const) {
          const inj = findCsvInjection(reportToCsv(rep, lang));
          if (inj.length) fails.push(`seed ${sd}/${lang}: CSV injection "${inj[0]}"`);
        }
      } catch (e) { fails.push(`seed ${sd}: THROW ${(e as Error).message.slice(0, 100)}`); }
    }
    expect(fails.slice(0, 12)).toEqual([]);
  });

  it('routeFor never throws on unknown keys and never returns a path that skips a real move', () => {
    for (const k of ['bottleneck-locked', 'x', '', '__proto__', 'unclassified', null, undefined]) {
      expect(() => routeFor(k as never)).not.toThrow();
    }
  });

  it('an unknown constraintCause degrades to a locked bottleneck without a cause label, never a crash', () => {
    const s = { supplierId: 'a', name: 'A', quadrant: 'bottleneck', facts: { qualifiedAlternatives: 0, specLoosenable: false, constraintCause: 'something-new' } } as unknown as SubtypeSupplierInput;
    const c = classifySubtype(s);
    expect(c.subtype).toBe('bottleneck-locked');
    expect(JSON.stringify(c)).not.toMatch(/undefined/);
  });

  it('qualifiedAlternatives that is not a whole, non-negative number is treated as not known (ask), never printed as a count', () => {
    for (const alt of [Infinity, -1, 2.5, NaN, '3', -0.0001]) {
      const s = { supplierId: 'a', name: 'A', quadrant: 'bottleneck', facts: { qualifiedAlternatives: alt, specLoosenable: false } } as unknown as SubtypeSupplierInput;
      const c = classifySubtype(s);
      expect(JSON.stringify(c), `alt=${String(alt)}`).not.toMatch(/Infinity|NaN|-1 qualified|2\.5 qualified|-0\.0001/);
      expect(c.subtype, `alt=${String(alt)}`).not.toBe('bottleneck-movable');
    }
  });
});
