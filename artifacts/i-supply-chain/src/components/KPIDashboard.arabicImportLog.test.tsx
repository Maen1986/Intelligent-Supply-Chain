/**
 * KPIDashboard — Arabic on-target label appears in the import log panel UI (Task 567).
 *
 * Confirms that when a data-collection CSV is imported with isAr=true, the
 * import log panel shows the Arabic "✅ حسب الهدف" label and NOT the English
 * "On Target" or "Below Target" strings.  Also confirms the off-target Arabic
 * label ("❌ دون الهدف") appears for a value that misses the target.
 *
 * Uses the risk-management slug (crm KPI, target 90%) so the test is
 * independent of framework-specific data.
 */
import React from 'react';
import { render, fireEvent, cleanup, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), warning: vi.fn(), dismiss: vi.fn() },
}));

/* Mutable language mock — tests can switch lang mid-suite without re-mocking */
const mockLang = { lang: 'en' as 'en' | 'ar' };
vi.mock('@/lib/LanguageContext', () => ({
  useLanguage: () => ({ lang: mockLang.lang, setLang: vi.fn(), t: (en: string, ar: string) => mockLang.lang === 'ar' ? ar : en }),
}));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({
    user: null, isAuthenticated: false, loading: false,
    register: vi.fn(), login: vi.fn(), logout: vi.fn(),
    changePassword: vi.fn(), updateProfile: vi.fn(),
  }),
}));

vi.mock('@/hooks/useAIPlan', () => ({
  useAIPlan: () => ({
    loading: false, result: null, error: null, rateLimited: false,
    generate: vi.fn(), reset: vi.fn(), savedPlan: null,
    viewSaved: vi.fn(), deleteSaved: vi.fn(),
  }),
}));

import { KPIDashboard } from './KPIDashboard';

/* Reset lang before each test */

/** Trigger a CSV import using a synchronous FileReader stub. */
function simulateCsvImport(container: HTMLElement, csvText: string) {
  const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
  if (!fileInput) throw new Error('simulateCsvImport: file input not found');
  const OrigFileReader = (globalThis as Record<string, unknown>).FileReader;
  class SyncFileReader {
    result: string | null = null;
    onload: ((e: { target: SyncFileReader }) => void) | null = null;
    readAsText() { this.result = csvText; this.onload?.({ target: this }); }
  }
  (globalThis as Record<string, unknown>).FileReader = SyncFileReader;
  try {
    const file = new File([csvText], 'kpis.csv', { type: 'text/csv' });
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
    act(() => { fireEvent.change(fileInput); });
  } finally {
    (globalThis as Record<string, unknown>).FileReader = OrigFileReader;
  }
}

/* ─── CSV fixtures for risk-management (crm KPI, target ≥ 90%) ─────────── */

/** crm = pct(90, 100) = 90 — exactly on target */
const CRM_ON_TARGET_CSV = [
  'KPI ID,Input Field,Your Value,Unit,Target,GCC Benchmark,Status',
  'crm,Total supply chain risks classified as High or Critical (top two tiers of your risk matrix),100,risks,,',
  'crm,Critical risks with a fully implemented and evidenced mitigation control (not just planned),90,risks,,',
].join('\n');

/** crm = pct(50, 100) = 50 — below target */
const CRM_BELOW_TARGET_CSV = [
  'KPI ID,Input Field,Your Value,Unit,Target,GCC Benchmark,Status',
  'crm,Total supply chain risks classified as High or Critical (top two tiers of your risk matrix),100,risks,,',
  'crm,Critical risks with a fully implemented and evidenced mitigation control (not just planned),50,risks,,',
].join('\n');

/* ══════════════════════════════════════════════════════════════════════════
   Task 567 — Arabic on-target label in the import log panel UI
══════════════════════════════════════════════════════════════════════════ */
describe('KPIDashboard — Arabic on-target label in import log panel (Task 567)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockLang.lang = 'en'; // reset to English before each test
  });

  afterEach(() => {
    cleanup();
  });

  it('shows Arabic "حسب الهدف" in the log panel when an on-target value is imported with isAr=true', () => {
    mockLang.lang = 'ar';
    const { container } = render(<KPIDashboard slug="risk-management" />);

    simulateCsvImport(container, CRM_ON_TARGET_CSV);

    // Arabic on-target label must appear somewhere in the log
    expect(container.textContent).toContain('حسب الهدف');
    // English equivalents must NOT appear
    expect(container.textContent).not.toContain('On Target');
    expect(container.textContent).not.toContain('Below Target');
  });

  it('shows Arabic "دون الهدف" in the log panel when a below-target value is imported with isAr=true', () => {
    mockLang.lang = 'ar';
    const { container } = render(<KPIDashboard slug="risk-management" />);

    simulateCsvImport(container, CRM_BELOW_TARGET_CSV);

    // Arabic off-target label must appear somewhere in the log
    expect(container.textContent).toContain('دون الهدف');
    // English equivalents must NOT appear
    expect(container.textContent).not.toContain('On Target');
    expect(container.textContent).not.toContain('Below Target');
  });

  it('shows English "On Target" in the log panel when isAr=false', () => {
    mockLang.lang = 'en';
    const { container } = render(<KPIDashboard slug="risk-management" />);

    simulateCsvImport(container, CRM_ON_TARGET_CSV);

    expect(container.textContent).toContain('On Target');
    expect(container.textContent).not.toContain('حسب الهدف');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Task 568 — English status labels NEVER appear when isAr=true across
   a full KPI framework (supply-chain-ops, all 6 KPIs via legacy format)
══════════════════════════════════════════════════════════════════════════ */

/**
 * Legacy-format CSV covering all 6 KPIs in the supply-chain-ops framework.
 * Values are chosen so every KPI is below its target, triggering the
 * "❌ ... — دون الهدف" branch in the import-log ternary (line 1381 of
 * KPIDashboard.tsx).  higherIsBetter:false KPIs (sccost, c2c) use values
 * above target so the same branch fires.
 */
const SUPPLY_CHAIN_ALL_BELOW_CSV = [
  'KPI ID,Actual Value',
  'por,50',      // target 95 (higher is better) → 50 < 95 → below
  'otif,80',     // target 92 (higher is better) → 80 < 92 → below
  'sccost,15',   // target 8  (lower is better)  → 15 > 8  → below
  'c2c,45',      // target 28 (lower is better)  → 45 > 28 → below
  'fa,70',       // target 85 (higher is better) → 70 < 85 → below
  'turns,8',     // target 10 (higher is better) → 8  < 10 → below
].join('\n');

/**
 * Same KPIs but all on-target, triggering the "✅ ... — حسب الهدف" branch.
 */
const SUPPLY_CHAIN_ALL_ON_TARGET_CSV = [
  'KPI ID,Actual Value',
  'por,96',      // target 95 (higher is better) → 96 ≥ 95 → on target
  'otif,93',     // target 92 → on target
  'sccost,7',    // target 8  (lower is better)  → 7  ≤ 8  → on target
  'c2c,25',      // target 28 (lower is better)  → 25 ≤ 28 → on target
  'fa,88',       // target 85 → on target
  'turns,11',    // target 10 → on target
].join('\n');

describe('KPIDashboard — Arabic mode never shows English status words across a full framework (Task 568)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockLang.lang = 'en';
  });

  afterEach(() => {
    cleanup();
  });

  it('all 6 below-target KPIs in Arabic mode show Arabic status — no English "Below Target"', () => {
    mockLang.lang = 'ar';
    const { container } = render(<KPIDashboard slug="supply-chain-strategy" />);

    simulateCsvImport(container, SUPPLY_CHAIN_ALL_BELOW_CSV);

    // Every entry must carry the Arabic below-target label
    expect(container.textContent).toContain('دون الهدف');

    // No English status label must ever leak into the Arabic log
    expect(container.textContent).not.toContain('Below Target');
    expect(container.textContent).not.toContain('On Target');
    expect(container.textContent).not.toContain('Above Target');
  });

  it('all 6 on-target KPIs in Arabic mode show Arabic status — no English "On Target"', () => {
    mockLang.lang = 'ar';
    const { container } = render(<KPIDashboard slug="supply-chain-strategy" />);

    simulateCsvImport(container, SUPPLY_CHAIN_ALL_ON_TARGET_CSV);

    expect(container.textContent).toContain('حسب الهدف');
    expect(container.textContent).not.toContain('On Target');
    expect(container.textContent).not.toContain('Below Target');
  });

  it('same CSV in English mode correctly shows English status labels', () => {
    mockLang.lang = 'en';
    const { container } = render(<KPIDashboard slug="supply-chain-strategy" />);

    simulateCsvImport(container, SUPPLY_CHAIN_ALL_BELOW_CSV);

    expect(container.textContent).toContain('Below Target');
    expect(container.textContent).not.toContain('دون الهدف');
  });
});
