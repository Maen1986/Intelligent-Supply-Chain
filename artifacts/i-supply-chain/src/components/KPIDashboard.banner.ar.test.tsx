/**
 * KPIDashboard — Arabic data-collection banner tests.
 *
 * Verifies that with lang='ar' the guidance banner renders its headline and
 * step descriptions in Arabic, and that the download button and manual-entry
 * link also use Arabic copy — not English.
 *
 * The banner is only visible when:
 *   - no values have been entered yet (hasAnyValue === false), and
 *   - it has not been dismissed (bannerDismissed === false).
 * Both conditions are met by starting each test with an empty localStorage.
 */
import React from 'react';
import { render, screen, within, cleanup, fireEvent, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';

/* ── Top-level mocks (hoisted before any imports) ───────────────────────── */

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), warning: vi.fn(), dismiss: vi.fn(), success: vi.fn() },
  Toaster: () => null,
}));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: null, isLoading: false }),
}));

vi.mock('@/hooks/useAIPlan', () => ({
  useAIPlan: () => ({ plan: null, loading: false, error: null, generate: vi.fn(), clear: vi.fn() }),
}));

vi.mock('@/components/AIPlanPanel', () => ({
  AIPlanPanel: () => null,
}));

/* Render with lang='ar' — the key mock for this test suite */
vi.mock('@/lib/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'ar', setLang: vi.fn(), t: (k: string) => k }),
}));

/* ── Component under test (imported after all vi.mock calls) ─────────────── */
import { KPIDashboard } from './KPIDashboard';

/* ── Helpers ────────────────────────────────────────────────────────────── */

/** Render and scope to the data-collection banner via its unique Arabic headline. */
function renderAndGetBanner(): HTMLElement {
  render(<KPIDashboard slug="supply-chain-strategy" />);
  const headline = screen.getByText('كيف تُدخل بياناتك بدقة؟');
  return headline.closest('div.relative') as HTMLElement;
}

describe('KPIDashboard banner — Arabic rendering', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the Arabic headline in the banner', () => {
    const banner = renderAndGetBanner();
    expect(within(banner).getByText('كيف تُدخل بياناتك بدقة؟')).toBeInTheDocument();
  });

  it('renders the step-1 Arabic description in the banner', () => {
    const banner = renderAndGetBanner();
    expect(within(banner).getByText(/حمّل نموذج CSV/)).toBeInTheDocument();
  });

  it('renders the step-2 Arabic description in the banner', () => {
    const banner = renderAndGetBanner();
    expect(within(banner).getByText(/أدخل الأرقام الخام/)).toBeInTheDocument();
  });

  it('renders the step-3 Arabic description in the banner', () => {
    const banner = renderAndGetBanner();
    expect(within(banner).getByText(/استورد الملف/)).toBeInTheDocument();
  });

  it('renders the Arabic "تنزيل النموذج" download button in the banner', () => {
    const banner = renderAndGetBanner();
    expect(within(banner).getByRole('button', { name: /تنزيل النموذج/ })).toBeInTheDocument();
  });

  it('renders the Arabic "سأدخل الأرقام يدوياً" manual-entry button in the banner', () => {
    const banner = renderAndGetBanner();
    expect(within(banner).getByRole('button', { name: /سأدخل الأرقام يدوياً/ })).toBeInTheDocument();
  });

  it('does NOT show the English headline when lang is ar', () => {
    renderAndGetBanner();
    expect(screen.queryByText(/How to get accurate KPI results/i)).not.toBeInTheDocument();
  });

  it('does NOT show English button labels in the banner when lang is ar', () => {
    const banner = renderAndGetBanner();
    expect(within(banner).queryByText(/Download Template/i)).not.toBeInTheDocument();
    expect(within(banner).queryByText(/I'll enter numbers manually/i)).not.toBeInTheDocument();
  });

  it('hides the banner after a CSV import populates KPI values', () => {
    // Mock FileReader to fire onload synchronously with CSV text.
    // This mirrors how the component calls reader.readAsText(file) and then
    // reads e.target.result inside reader.onload.
    vi.stubGlobal('FileReader', vi.fn().mockImplementation(function(
      this: { onload: ((e: unknown) => void) | null; readAsText: (f: Blob) => void }
    ) {
      this.onload = null;
      this.readAsText = (_f: Blob) => {
        // Legacy direct-entry format: KPI ID + Actual Value
        const csv = 'KPI ID,Actual Value\npor,90\notif,85\nsccost,7\nc2c,25\nfa,80\nturns,12';
        this.onload?.({ target: { result: csv } });
      };
    }));

    render(<KPIDashboard slug="supply-chain-strategy" />);

    // Banner is visible before the import
    expect(screen.getByText('كيف تُدخل بياناتك بدقة؟')).toBeInTheDocument();

    // Trigger the hidden file input — same path a real user would take
    const fileInput = document.querySelector('input[accept=".csv"]') as HTMLInputElement;
    const file = new File([''], 'kpis.csv', { type: 'text/csv' });
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
    act(() => { fireEvent.change(fileInput); });

    // Banner should now be gone because hasAnyValue is true (values were imported)
    expect(screen.queryByText('كيف تُدخل بياناتك بدقة؟')).not.toBeInTheDocument();
  });
});
