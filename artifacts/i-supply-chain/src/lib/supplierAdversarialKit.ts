/**
 * Round C (#668) adversarial kit -- shared by every supplier-engine stress test.
 *
 * Why this is a file and not copy-paste: the platform had no common way to
 * hurt an engine. Each module's tests invented their own bad inputs, so
 * coverage was uneven and nothing could be re-run against a new module.
 * This kit gives every present and future engine the same weapons:
 *  - a seeded PRNG (every failure reproduces from its seed; no new dependency)
 *  - hostile value pools (numbers, text, dates) incl. Arabic / bidi / injection
 *  - deep scanners that find NaN / Infinity / "NaN" / "undefined" leaking into
 *    anything a user could read or export
 *
 * Pure, no imports from any engine (standalone-first, SI-00).
 */

/** mulberry32: tiny deterministic PRNG. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(r: () => number, xs: readonly T[]): T {
  return xs[Math.floor(r() * xs.length)];
}
export function int(r: () => number, lo: number, hi: number): number {
  return lo + Math.floor(r() * (hi - lo + 1));
}

const AR = (...cp: number[]) => String.fromCodePoint(...cp);
const ARABIC_NAME = AR(0x634, 0x631, 0x643, 0x629, 0x20, 0x627, 0x644, 0x62e, 0x644, 0x64a, 0x62c); // "شركة الخليج"
const ARABIC_INDIC_50 = AR(0x665, 0x660); // "٥٠"
const ARABIC_INDIC_2026_01 = AR(0x662, 0x660, 0x662, 0x666) + '-' + AR(0x660, 0x661);
const RLO = AR(0x202e);
const ZWSP = AR(0x200b);
const BOM = AR(0xfeff);

/** Names that have broken real systems. */
export const HOSTILE_NAMES: readonly string[] = [
  '', ' ', '   ', '\t', 'A', 'a'.repeat(5000), ARABIC_NAME, `Acme ${RLO}gnp.exe`, `Zero${ZWSP}Width Co`,
  '=HYPERLINK("http://evil.example","x")', '+cmd|\' /C calc\'!A0', '-2+3', '@SUM(1+1)', '\tTAB=1+1',
  '__proto__', 'constructor', 'prototype', 'toString', 'hasOwnProperty', '<script>alert(1)</script>', '"quoted"',
  'comma, inside', 'new\nline', 'cr\rhere', 'Supplier \u{1F680}', 'O\'Brien & Sons', 'A-B', 'A B', 'a  b', 'ACME', 'acme',
  '---', '###', '...', AR(0x660), 'Café', 'Café',
];

/** Numeric strings as they arrive from a spreadsheet export. */
export const HOSTILE_NUMBER_STRINGS: readonly string[] = [
  '', ' ', 'NaN', 'nan', 'Infinity', '-Infinity', 'inf', '1e999', '-1e999', '1e-999', '-0', '0', '0.0', '100', '100.0000001',
  '-1', '-0.0001', '101', '50.5', '50,5', '1,200,000', '1.200.000', '$50', '50%', '0x10', '1_000', '  77  ', ' 77',
  ARABIC_INDIC_50, '5 0', '5e1', '.5', '5.', '--5', '+5', '9'.repeat(400), '١٬٢٠٠٬٠٠٠',
];

export const HOSTILE_PERIODS: readonly string[] = [
  '', '2026-01', '2026-1', '2026-13', '2026-00', '0000-00', '9999-12', ' 2026-01 ', '2026/01', '2026-01-15', 'Jan 2026',
  ARABIC_INDIC_2026_01, '2026-01\n', '26-01', '2026-001',
];

export const HOSTILE_DATES: readonly string[] = [
  '', '2026-01-01', '2026-02-30', '2026-13-01', '0000-00-00', '9999-12-31', '1970-01-01', '2026-1-1', '01/02/2026', 'not a date',
  '2026-01-01T00:00:00Z', ' 2026-01-01 ', '2026-01-01\n', '2026-W01',
];

export const QUADRANT_WORDS: readonly string[] = [
  '', 'strategic', 'leverage', 'bottleneck', 'non-critical', 'noncritical', 'Non Critical', 'STRATEGIC', ' leverage ', 'routine', 'critical',
  'security', ARABIC_NAME,
];

/** Hostile raw JS numbers for engines that take numbers directly. */
export const HOSTILE_NUMBERS: readonly number[] = [
  0, -0, 1, -1, 0.5, 100, 101, -101, 1e-12, 1e12, 1e308, -1e308, Number.MAX_SAFE_INTEGER, Number.MIN_VALUE, NaN, Infinity, -Infinity,
];

export { BOM as HOSTILE_BOM };

export interface BadFinding { path: string; reason: string; sample: string }

/**
 * Walk any value; report leaks a user could see or export:
 * NaN / +-Infinity numbers, strings containing the words NaN/undefined/[object Object]/Infinity,
 * and cycles that would break JSON.stringify.
 */
export function findBad(value: unknown, path = '$', ancestors: object[] = [], out: BadFinding[] = []): BadFinding[] {
  if (out.length > 25) return out;
  if (typeof value === 'number') {
    if (Number.isNaN(value)) out.push({ path, reason: 'NaN number', sample: 'NaN' });
    else if (!Number.isFinite(value)) out.push({ path, reason: 'Infinite number', sample: String(value) });
    return out;
  }
  if (typeof value === 'string') {
    // A message that ECHOES the user's own bad input inside quotes ("NaN" is not a number) is honest, not a leak.
    const unquoted = value.replace(/"[^"]*"/g, '""');
    if (/\bNaN\b|\bundefined\b|\[object Object\]|\bInfinity\b|\bnull%|\bNaN%/.test(unquoted)) {
      out.push({ path, reason: 'placeholder leaked into text', sample: value.slice(0, 120) });
    }
    return out;
  }
  if (value && typeof value === 'object') {
    // Only a true cycle (object inside its own ancestry) is a defect; shared references are fine.
    if (ancestors.includes(value as object)) { out.push({ path, reason: 'cycle', sample: '' }); return out; }
    const next = [...ancestors, value as object];
    if (Array.isArray(value)) value.forEach((v, i) => findBad(v, `${path}[${i}]`, next, out));
    else for (const [k, v] of Object.entries(value as Record<string, unknown>)) findBad(v, `${path}.${k}`, next, out);
  }
  return out;
}

/** Spreadsheet formula injection: a CSV cell that Excel/Sheets would execute. */
export function findCsvInjection(csv: string): string[] {
  const bad: string[] = [];
  // minimal RFC-4180 split into rows/cells
  const rows: string[][] = [];
  let row: string[] = []; let f = ''; let q = false;
  for (let i = 0; i < csv.length; i++) {
    const c = csv[i];
    if (q) { if (c === '"') { if (csv[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  row.push(f); rows.push(row);
  for (const r of rows.slice(1)) for (const cell of r) if (/^[=+\-@\t\r]/.test(cell) && !/^-?\d+(\.\d+)?$/.test(cell)) bad.push(cell.slice(0, 80));
  return bad;
}

export function assertNoPrototypePollution(): string[] {
  const polluted: string[] = [];
  const probe = {} as Record<string, unknown>;
  for (const k of ['polluted', 'isAdmin', 'x', 'name', 'supplier', 'score']) if (k in probe) polluted.push(k);
  return polluted;
}
