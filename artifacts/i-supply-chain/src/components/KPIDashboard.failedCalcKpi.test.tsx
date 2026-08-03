/**
 * KPIDashboard — click-to-jump for failed-calculation KPIs (Task 423).
 *
 * When a data-collection CSV is imported and a KPI's calculate() returns NaN
 * (e.g. crm with total_critical_risks=0 ÷ 0), the import log must show a ⚠️
 * line with a clickable button for that KPI's label. The button is NOT rendered
 * when the import is fully successful (no NaN).
 */
import React from 'react';
import { render, fireEvent, cleanup, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), warning: vi.fn(), dismiss: vi.fn() },
}));

vi.mock('@/lib/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'en', setLang: vi.fn(), t: (k: string) => k }),
}));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    loading: false,
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    changePassword: vi.fn(),
    updateProfile: vi.fn(),
  }),
}));

vi.mock('@/hooks/useAIPlan', () => ({
  useAIPlan: () => ({
    loading: false,
    result: null,
    error: null,
    rateLimited: false,
    generate: vi.fn(),
    reset: vi.fn(),
    savedPlan: null,
    viewSaved: vi.fn(),
    deleteSaved: vi.fn(),
  }),
}));

import { KPIDashboard } from './KPIDashboard';

/** Trigger a CSV import via the hidden file input using a synchronous FileReader stub. */
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

/* ─── CSV helpers ─────────────────────────────────────────────────────────── */

/**
 * Data-collection format CSV for risk-management where CRM will return NaN
 * because pct(safe(0), safe(0)) = NaN (denominator is 0).
 */
const CRM_NAN_CSV = [
  'KPI ID,Input Field,Your Value,Unit,Target,GCC Benchmark,Status',
  'crm,Total supply chain risks classified as High or Critical (top two tiers of your risk matrix),0,risks,>90%,48%,',
  'crm,Critical risks with a fully implemented and evidenced mitigation control (not just planned),0,risks,>90%,48%,',
].join('\n');

/**
 * Data-collection format CSV for risk-management where CRM succeeds:
 * pct(safe(17), safe(20)) = 85.
 */
const CRM_OK_CSV = [
  'KPI ID,Input Field,Your Value,Unit,Target,GCC Benchmark,Status',
  'crm,Total supply chain risks classified as High or Critical (top two tiers of your risk matrix),20,risks,>90%,48%,',
  'crm,Critical risks with a fully implemented and evidenced mitigation control (not just planned),17,risks,>90%,48%,',
].join('\n');

/* ══════════════════════════════════════════════════════════════════════════
   Task 423 — click-to-jump for failed-calculation KPIs
══════════════════════════════════════════════════════════════════════════ */
describe('KPIDashboard — click-to-jump for failed-calculation KPIs (Task 423)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('shows a ⚠️ log line with a clickable button for the failing KPI label when calculate() returns NaN', () => {
    const { container } = render(<KPIDashboard slug="risk-management" />);

    simulateCsvImport(container, CRM_NAN_CSV);

    // The amber ⚠️ line must appear in the import log
    const amberLines = Array.from(container.querySelectorAll('p')).filter(p =>
      p.textContent?.includes('⚠️') && p.textContent?.includes('returned an invalid result'),
    );
    expect(amberLines.length).toBeGreaterThan(0);

    // That line must contain a button element whose text is the CRM label
    const jumpBtn = amberLines[0].querySelector('button');
    expect(jumpBtn).not.toBeNull();
    expect(jumpBtn?.textContent).toContain('Critical Risk Mitigation Rate');
  });

  it('does NOT show the ⚠️ failed-calculation line when the import is fully successful', () => {
    const { container } = render(<KPIDashboard slug="risk-management" />);

    simulateCsvImport(container, CRM_OK_CSV);

    // Import log must exist (✓ banner)
    const importLogSection = container.querySelector('[class*="emerald"],[class*="bg-emerald"]') as HTMLElement | null;
    expect(importLogSection).not.toBeNull();

    // No amber ⚠️ "returned an invalid result" line
    const amberLines = Array.from(container.querySelectorAll('p')).filter(p =>
      p.textContent?.includes('⚠️') && p.textContent?.includes('returned an invalid result'),
    );
    expect(amberLines.length).toBe(0);
  });
});
