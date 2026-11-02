/**
 * Shared, spreadsheet-safe CSV cell writer (Round C #668, standardisation).
 *
 * Why: a supplier name typed or imported as  =HYPERLINK(...)  or  +cmd|...
 * is executed as a FORMULA when a consultant opens the exported CSV in Excel
 * or Google Sheets (OWASP "CSV injection"). Two modules each had their own
 * private csvCell with no protection and slightly different quoting rules.
 * One writer, one rule, used everywhere a CSV is produced.
 *
 * Rules:
 *  - numbers and null/undefined are written as-is / empty (a real negative
 *    number must stay a number, never get a prefix);
 *  - TEXT whose first character could start a formula (= + - @ TAB CR) is
 *    prefixed with a single quote so spreadsheets show it as text;
 *  - text containing comma, quote, CR or LF is RFC-4180 quoted.
 * Pure, no imports (standalone-first).
 */
const FORMULA_START = /^[=+\-@\t\r]/;
const PLAIN_NUMBER = /^-?\d+(\.\d+)?$/;

export function csvSafeText(s: string): string {
  return FORMULA_START.test(s) && !PLAIN_NUMBER.test(s) ? `'${s}` : s;
}

export function csvCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  const raw = typeof v === 'number' ? (Number.isFinite(v) ? String(v) : '') : csvSafeText(String(v));
  return /[",\n\r]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
}
