import { describe, it, expect } from 'vitest';
import { DESK_ROUTES, STEP_IDS, getRoute, stepNeed, buildSuggestions, matchSuggestion, parsePastedPrices } from '@/lib/deskRoutes';

describe('DESK_ROUTES', () => {
  it('every route has valid, non-empty needs and a landing step inside needs, with EN and AR text', () => {
    for (const r of DESK_ROUTES) {
      expect(r.needs.length).toBeGreaterThan(0);
      r.needs.forEach(n => expect(STEP_IDS).toContain(n));
      expect(r.needs).toContain(r.landing);
      expect(r.en && r.ar && r.whenEn && r.whenAr).toBeTruthy();
    }
    expect(new Set(DESK_ROUTES.map(r => r.id)).size).toBe(DESK_ROUTES.length);
  });
  it('stepNeed: no route means all needed; unknown route too; others optional', () => {
    expect(stepNeed(undefined, 'rounds')).toBe('needed');
    expect(stepNeed('nope', 'rounds')).toBe('needed');
    expect(stepNeed('price-rise', 'price')).toBe('needed');
    expect(stepNeed('price-rise', 'tactics')).toBe('optional');
    expect(getRoute('full')?.needs).toHaveLength(6);
  });
});

describe('buildSuggestions', () => {
  it('dedupes case-insensitively, keeps best source and merges quadrant/check', () => {
    const l = buildSuggestions({
      cases: [{ name: 'Acme', quadrant: 'strategic' }],
      portfolio: [{ name: 'acme', category: 'Packaging', quadrant: 'leverage' }, { name: 'Beta', quadrant: 'weird' }],
      checks: [{ id: 'c1', name: 'ACME' }, { name: '  ' }],
      categories: [{ label: 'Beta' }, { label: 'IT services' }],
    });
    const acme = l.find(s => s.name === 'Acme')!;
    expect(acme.source).toBe('case'); expect(acme.quadrant).toBe('strategic'); expect(acme.checkId).toBe('c1'); expect(acme.detail).toBe('Packaging');
    expect(l.find(s => s.name === 'Beta')!.source).toBe('portfolio');
    expect(l.find(s => s.name === 'Beta')!.quadrant).toBeUndefined();
    expect(l.map(s => s.name)).toEqual(['Acme', 'Beta', 'IT services']);
  });
  it('handles empty and junk input', () => {
    expect(buildSuggestions({})).toEqual([]);
    expect(buildSuggestions({ cases: [{ name: undefined }], checks: [{ name: '' }] })).toEqual([]);
  });
  it('matchSuggestion is case-insensitive and ignores blanks', () => {
    const l = buildSuggestions({ checks: [{ id: 'x', name: 'Foo Ltd' }] });
    expect(matchSuggestion(l, ' foo ltd ')?.checkId).toBe('x');
    expect(matchSuggestion(l, '')).toBeUndefined();
    expect(matchSuggestion(l, 'Foo')).toBeUndefined();
  });
});

describe('parsePastedPrices', () => {
  const base = '2026-01-01';
  it('parses labels, tabs, commas and thousands separators', () => {
    const r = parsePastedPrices('Q1 100\nQ2, 1,200.50\n2026-03-01\t98\n105', base);
    expect(r.skipped).toBe(0);
    expect(r.points.map(p => p.price)).toEqual([100, 1200.5, 98, 105]);
    expect(r.points[0].periodLabel).toBe('Q1');
    expect(r.points[2].sortKey).toBe('2026-03-01');
    expect(r.points[3].periodLabel).toBe('P4');
  });
  it('assigns increasing sort keys for undated rows', () => {
    const k = parsePastedPrices('a 1\nb 2\nc 3', base).points.map(p => p.sortKey);
    expect([...k].sort()).toEqual(k);
    expect(new Set(k).size).toBe(3);
  });
  it('skips lines without a positive price and normalises Arabic digits', () => {
    const r = parsePastedPrices('no number here\nQ1 0\nQ2 -5\nQ3 ١٢٠\n\n', base);
    expect(r.skipped).toBe(3);
    expect(r.points).toHaveLength(1);
    expect(r.points[0].price).toBe(120);
  });
  it('empty text gives nothing', () => {
    expect(parsePastedPrices('', base)).toEqual({ points: [], skipped: 0 });
  });
});
