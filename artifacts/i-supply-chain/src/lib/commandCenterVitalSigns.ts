/**
 * Control Tower Vital Signs — shared store (#161, 21 Aug 2026).
 *
 * "Reframe the existing widget layout around a small set of vital signs at
 * the top" (UI/UX Vision Synthesis v4, Wave A-3). The Control Tower's five
 * tabs (Benchmark Radar, Savings Calculator, Risk Exposure, AI Executive
 * Briefing, AI Consultancy Engine) are each independently-mounted function
 * components -- only the active tab exists in the DOM at a time (see
 * CommandCenter()'s `{tab === 'x' && <XTab />}` pattern) -- so there is no
 * shared React state to lift a top-of-page summary strip from without a
 * structural rewrite.
 *
 * Mirrors the localStorage-backed pattern already proven by sharedProfile.ts
 * (Task #102): each tab writes its own headline number here whenever it has
 * a *real, user-computed* value; the strip reads it back. A sign is only
 * ever set from an actual computed result -- never fabricated -- so a tool
 * the user hasn't touched yet correctly shows as "not yet run" rather than
 * a placeholder number (the "honest empty" rule already enforced in
 * #139/#141/#142).
 */
import { safeSetItem } from './storage';

export type VitalSignKey = 'benchmark' | 'savings' | 'risk' | 'briefing' | 'consultancy';

export interface VitalSign {
  /** Short headline value, e.g. "-12 pts vs top quartile" or "SAR 4.2M". */
  value: string;
  valueAr: string;
  tone: 'good' | 'warn' | 'bad' | 'neutral';
}

const STORAGE_KEY = 'isc-cc-vitals-v1';

export function getVitalSigns(): Partial<Record<VitalSignKey, VitalSign>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function setVitalSign(key: VitalSignKey, sign: VitalSign): void {
  const next = { ...getVitalSigns(), [key]: sign };
  safeSetItem(STORAGE_KEY, JSON.stringify(next));
}
