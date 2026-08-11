/**
 * Shared Command Centre profile (Task #102 — expert panel finding P1).
 *
 * The five Command Centre tabs (Benchmark Radar, Savings Calculator, Risk
 * Register, Executive Briefing, Consultancy Engine) each used to keep their
 * own, disconnected `industry` / `subIndustry` state — a client had to
 * re-pick the same industry five times switching tabs. This module is a
 * thin localStorage-backed store so any tab can read the last-selected
 * industry/sub-industry on mount and push updates back for the next tab.
 *
 * Deliberately scoped to industry + sub-industry only: revenue / company
 * size are NOT shared here because each tab uses a different shape for it
 * (raw SAR-M revenue numbers with different defaults vs. a qualitative
 * company-size band), and normalizing between those would need a
 * conversion table that hasn't been reviewed. Sharing those is tracked
 * separately.
 */
import { safeSetItem } from './storage';

const INDUSTRY_KEY = 'isc-cc-industry-v1';
const SUBINDUSTRY_KEY = 'isc-cc-subindustry-v1';

export function getSharedIndustry(): string | null {
  try {
    return localStorage.getItem(INDUSTRY_KEY);
  } catch {
    return null;
  }
}

export function setSharedIndustry(value: string): void {
  if (!value) return;
  safeSetItem(INDUSTRY_KEY, value);
}

export function getSharedSubIndustry(): string | null {
  try {
    return localStorage.getItem(SUBINDUSTRY_KEY);
  } catch {
    return null;
  }
}

export function setSharedSubIndustry(value: string): void {
  // Sub-industry can legitimately be cleared (e.g. industry changed), so
  // an empty string is a valid write, not a no-op like industry above.
  safeSetItem(SUBINDUSTRY_KEY, value);
}
