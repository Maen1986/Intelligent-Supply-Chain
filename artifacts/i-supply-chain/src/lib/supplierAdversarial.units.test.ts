/**
 * Round C (#668) -- exact-behaviour unit tests for the two shared utilities this round introduced.
 * Written after a mutation run (Stryker) showed the first suites killed only 18% (csvSafe) / 58% (eventLogOrder)
 * of injected bugs: a green property test is not proof that every branch is pinned.
 */
import { describe, it, expect } from 'vitest';
import { csvSafeText, csvCell } from './csvSafe';
import { sortEventsChronologically } from './eventLogOrder';

describe('csvSafeText -- CSV/Excel formula injection', () => {
  it.each(['=1+1', '+SUM(A1)', '-2+3', '@cmd', '\tx', '\rx', '=cmd|calc', '-a', '+a'])('prefixes a quote to %j', (s) => {
    expect(csvSafeText(s)).toBe(`'${s}`);
  });
  it.each(['-12', '-123.45', '-5', '-5.25', '-0', '-0.5', '12', '3.14', '+', '=', 'a=b', 'x+1', ' =1', 'Acme', 'مورد', ''])('leaves %j alone', (s) => {
    // plain negative numbers are data, text that merely CONTAINS a formula character mid-string is not a formula
    // ('+' alone and '=' alone ARE formula starters and are covered below)
    if (s === '+' || s === '=') return;
    expect(csvSafeText(s)).toBe(s);
  });
  it('a lone "+" or "=" is still neutralised', () => {
    expect(csvSafeText('+')).toBe("'+"); expect(csvSafeText('=')).toBe("'=");
  });
  it('numbers with a malformed shape are NOT treated as plain numbers', () => {
    for (const s of ['-1.', '-.5', '-1.2.3', '-1e5', '--1', '-1a', '-1,5', '-١٢']) expect(csvSafeText(s)).toBe(`'${s}`);
  });
  it('is not applied twice (an already-quoted cell stays single-quoted once)', () => {
    expect(csvSafeText(csvSafeText('=1'))).toBe("'=1");
  });
});

describe('csvCell -- RFC 4180 quoting + safety', () => {
  it('null and undefined are empty, 0 / false / "" are NOT confused with them', () => {
    expect(csvCell(null)).toBe(''); expect(csvCell(undefined)).toBe('');
    expect(csvCell(0)).toBe('0'); expect(csvCell(false)).toBe('false'); expect(csvCell('')).toBe('');
  });
  it('finite numbers are written as-is (negatives are data, never quoted-as-formula)', () => {
    expect(csvCell(-12.5)).toBe('-12.5'); expect(csvCell(1e21)).toBe(String(1e21)); expect(csvCell(0)).toBe('0');
  });
  it('NaN / +-Infinity numbers become empty, never "NaN"', () => {
    for (const n of [NaN, Infinity, -Infinity]) expect(csvCell(n)).toBe('');
  });
  it('a number-like STRING from a user that starts with a formula char is still neutralised unless it is a plain number', () => {
    expect(csvCell('=1+1')).toBe("'=1+1"); expect(csvCell('-3')).toBe('-3'); expect(csvCell('@x')).toBe("'@x");
  });
  it('quotes on comma, double-quote, LF and CR -- and doubles inner quotes', () => {
    expect(csvCell('a,b')).toBe('"a,b"'); expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('l1\nl2')).toBe('"l1\nl2"'); expect(csvCell('l1\rl2')).toBe('"l1\rl2"'); expect(csvCell('plain')).toBe('plain');
  });
  it('a formula that also needs quoting gets both treatments, in order', () => {
    expect(csvCell('=A1,B1')).toBe(`"'=A1,B1"`);
  });
  it('non-string, non-number values are stringified safely (boolean, bigint, object)', () => {
    expect(csvCell(true)).toBe('true'); expect(csvCell(10n)).toBe('10'); expect(csvCell({ a: 1 })).toBe('[object Object]');
  });
});

describe('sortEventsChronologically -- exact ordering rules', () => {
  const T = '2026-05-01T10:00:00.000Z';
  const ids = (xs: Array<{ id: number | string }>) => xs.map((x) => x.id);
  it('time first: earlier before later, whatever the ids', () => {
    expect(ids(sortEventsChronologically([{ id: 1, createdAt: '2026-05-02T00:00:00Z' }, { id: 99, createdAt: '2026-05-01T00:00:00Z' }]))).toEqual([99, 1]);
  });
  it('same instant, numeric ids compare by VALUE (2 < 10), by length first, then digit-wise', () => {
    expect(ids(sortEventsChronologically([{ id: 10, createdAt: T }, { id: 2, createdAt: T }]))).toEqual([2, 10]);
    expect(ids(sortEventsChronologically([{ id: '19', createdAt: T }, { id: '21', createdAt: T }, { id: '20', createdAt: T }]))).toEqual(['19', '20', '21']);
  });
  it('leading zeros are ignored for numeric ids ("007" == 7 < 10) but a single "0" is kept', () => {
    expect(ids(sortEventsChronologically([{ id: '10', createdAt: T }, { id: '007', createdAt: T }, { id: '0', createdAt: T }]))).toEqual(['0', '007', '10']);
    expect(ids(sortEventsChronologically([{ id: '00', createdAt: T }, { id: '0', createdAt: T }, { id: '1', createdAt: T }])).slice(2)).toEqual(['1']);
  });
  it('an id that is only partly digits is NOT numeric: plain code-unit order', () => {
    expect(ids(sortEventsChronologically([{ id: 'a10', createdAt: T }, { id: 'a9', createdAt: T }, { id: '10', createdAt: T }]))).toEqual(['10', 'a10', 'a9']);
    expect(ids(sortEventsChronologically([{ id: '9x', createdAt: T }, { id: '10', createdAt: T }]))).toEqual(['10', '9x']);
    expect(ids(sortEventsChronologically([{ id: 'x9', createdAt: T }, { id: '10', createdAt: T }]))).toEqual(['10', 'x9']);
  });
  it('equal time and equal id keep arrival order (stable) -- for any number of ties', () => {
    const e = ['a', 'b', 'c', 'd'].map((tag) => ({ id: 5, createdAt: T, tag }));
    expect(sortEventsChronologically([...e].reverse()).map((x) => x.tag)).toEqual(['d', 'c', 'b', 'a']);
    expect(sortEventsChronologically(e).map((x) => x.tag)).toEqual(['a', 'b', 'c', 'd']);
  });
  it('code-unit order is deterministic: uppercase before lowercase, and a prefix before its extension', () => {
    expect(ids(sortEventsChronologically([{ id: 'b', createdAt: T }, { id: 'B', createdAt: T }, { id: 'ab', createdAt: T }, { id: 'a', createdAt: T }]))).toEqual(['B', 'a', 'ab', 'b']);
  });
  it('invalid timestamps (garbage, empty, "undefined") sort before every real one and keep id order among themselves', () => {
    const out = ids(sortEventsChronologically([{ id: 3, createdAt: T }, { id: 2, createdAt: 'nope' }, { id: 1, createdAt: '' }, { id: 4, createdAt: 'undefined' }]));
    expect(out).toEqual([1, 2, 4, 3]);
  });
  it('empty and single-item inputs, and the input array is never mutated or aliased', () => {
    expect(sortEventsChronologically([])).toEqual([]);
    const one = [{ id: 1, createdAt: T }]; const out = sortEventsChronologically(one);
    expect(out).toEqual(one); expect(out).not.toBe(one);
  });
  it('numeric vs text: one numeric id is NOT enough for numeric comparison (text "!!!" < "5" by code unit)', () => {
    expect(ids(sortEventsChronologically([{ id: '5', createdAt: T }, { id: '!!!', createdAt: T }]))).toEqual(['!!!', '5']);
    expect(ids(sortEventsChronologically([{ id: '!!!', createdAt: T }, { id: '5', createdAt: T }]))).toEqual(['!!!', '5']);
  });
  it('leading zeros: "007" and "7", "0000" and "0" are the SAME number -> arrival order decides, in either arrival order', () => {
    expect(ids(sortEventsChronologically([{ id: '007', createdAt: T }, { id: '7', createdAt: T }]))).toEqual(['007', '7']);
    expect(ids(sortEventsChronologically([{ id: '7', createdAt: T }, { id: '007', createdAt: T }]))).toEqual(['7', '007']);
    expect(ids(sortEventsChronologically([{ id: '0000', createdAt: T }, { id: '0', createdAt: T }]))).toEqual(['0000', '0']);
    expect(ids(sortEventsChronologically([{ id: '0', createdAt: T }, { id: '0000', createdAt: T }]))).toEqual(['0', '0000']);
    expect(ids(sortEventsChronologically([{ id: '0100', createdAt: T }, { id: '99', createdAt: T }]))).toEqual(['99', '0100']);
  });
  it('a large block of fully tied events (same time, same id) keeps arrival order exactly (stability under merges)', () => {
    const tied = Array.from({ length: 300 }, (_, i) => ({ id: 7, createdAt: T, n: i }));
    expect(sortEventsChronologically(tied).map((x) => x.n)).toEqual(tied.map((x) => x.n));
    const mixed = Array.from({ length: 300 }, (_, i) => ({ id: i % 3, createdAt: T, n: i }));
    const out = sortEventsChronologically(mixed);
    for (const k of [0, 1, 2]) { const ns = out.filter((x) => x.id === k).map((x) => x.n); expect(ns).toEqual([...ns].sort((a, b) => a - b)); }
    expect(out.map((x) => x.id).join('')).toBe([...mixed].map((x) => x.id).sort((a, b) => a - b).join(''));
  });
});
