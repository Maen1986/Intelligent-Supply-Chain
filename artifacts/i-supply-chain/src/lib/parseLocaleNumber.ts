// Numeric input parsing for Module 08 tools. Arabic-speaking users type Arabic-Indic digits (٤٢٠٠٠٠٠٠) and Arabic separators (٬ ٫);
// plain parseFloat would silently read them as 0. Never throws, never returns NaN/Infinity/negative.
const AR = '٠١٢٣٤٥٦٧٨٩', FA = '۰۱۲۳۴۵۶۷۸۹';
export function normalizeDigits(s: string): string {
  return s.replace(/[٠-٩]/g, c => String(AR.indexOf(c))).replace(/[۰-۹]/g, c => String(FA.indexOf(c)))
    .replace(/[٬,\s_']/g, '').replace(/٫/g, '.');
}
export function parseAmount(s: string | undefined | null): number {
  if (!s) return 0;
  const v = Number(normalizeDigits(String(s)));
  return Number.isFinite(v) && v > 0 ? Math.min(v, 1e15) : 0;
}
/** Percent typed as 0-100 (accepts a trailing % or ٪). Out-of-range is clamped, not rejected. */
export function parsePercent(s: string | undefined | null): number {
  if (!s) return 0;
  return Math.min(100, parseAmount(String(s).replace(/[%٪]/g, '')));
}
