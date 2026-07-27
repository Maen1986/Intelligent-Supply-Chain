/**
 * KPIDashboard — data-collection guidance banner tests.
 *
 * Confirms:
 *  1. The banner is visible on first load (no localStorage dismiss key, no values).
 *  2. The banner is hidden when the dismiss key is already set in localStorage.
 *  3. The banner is hidden when at least one KPI value has been entered.
 *  4. Clicking the X (Dismiss) button hides the banner and persists the key.
 *  5. The banner stays hidden across a remount when the dismiss key is set.
 */
import React from 'react';
import { render, fireEvent, cleanup, within, act, waitFor } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

/* ── mock sonner before any component import ────────────────────────────── */
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), warning: vi.fn(), dismiss: vi.fn() },
}));

/* ── mock LanguageContext ────────────────────────────────────────────────── */
vi.mock('@/lib/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'en', setLang: vi.fn(), t: (k: string) => k }),
}));

/* ── mock AuthContext (no network needed) ───────────────────────────────── */
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

/* ── mock useAIPlan (prevents fetch calls) ──────────────────────────────── */
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

/** The banner heading text (English). Scoped to its element for precision. */
const BANNER_HEADING_TEXT = 'How to get accurate KPI results';

/** localStorage key for the supply-chain-strategy framework */
const DISMISS_KEY = 'isc-kpi-banner-dismissed-supply-chain-strategy';

/** Returns true when the guidance banner is present in the given container. */
function bannerVisible(container: HTMLElement): boolean {
  return within(container).queryByText(BANNER_HEADING_TEXT) !== null;
}

describe('KPIDashboard — data-collection guidance banner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup(); // unmount and reset DOM between each test
  });

  it('shows the banner on first load when no dismiss key and no values are present', () => {
    const { container } = render(<KPIDashboard slug="supply-chain-strategy" />);

    expect(bannerVisible(container)).toBe(true);
  });

  it('hides the banner when the dismiss key is already set in localStorage', () => {
    localStorage.setItem(DISMISS_KEY, '1');

    const { container } = render(<KPIDashboard slug="supply-chain-strategy" />);

    expect(bannerVisible(container)).toBe(false);
  });

  it('hides the banner when at least one KPI value is entered', () => {
    const { container } = render(<KPIDashboard slug="supply-chain-strategy" />);

    // Banner must be visible before any value is entered
    expect(bannerVisible(container)).toBe(true);

    // Enter a value into the first KPI input
    const input = container.querySelector('input[type="number"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '90' } });

    // Banner must disappear once a value exists
    expect(bannerVisible(container)).toBe(false);
  });

  it('hides the banner after the user clicks the X (Dismiss) button', () => {
    const { container } = render(<KPIDashboard slug="supply-chain-strategy" />);

    expect(bannerVisible(container)).toBe(true);

    const view = within(container);
    fireEvent.click(view.getByRole('button', { name: /dismiss/i }));

    expect(bannerVisible(container)).toBe(false);
  });

  it('persists the dismiss state in localStorage after clicking the X button', () => {
    const { container } = render(<KPIDashboard slug="supply-chain-strategy" />);

    const view = within(container);
    fireEvent.click(view.getByRole('button', { name: /dismiss/i }));

    expect(localStorage.getItem(DISMISS_KEY)).toBe('1');
  });

  it('keeps the banner hidden across a remount when the dismiss key is already set', () => {
    // First mount: user dismissed the banner
    const { container: c1, unmount } = render(<KPIDashboard slug="supply-chain-strategy" />);
    within(c1).getByRole('button', { name: /dismiss/i }).click();
    unmount();

    // Second mount (simulates navigating away and back)
    const { container: c2 } = render(<KPIDashboard slug="supply-chain-strategy" />);
    expect(bannerVisible(c2)).toBe(false);
  });

  it('reappears after all values are cleared when the dismiss key is absent', () => {
    const { container } = render(<KPIDashboard slug="supply-chain-strategy" />);

    // Banner must be visible before any value is entered
    expect(bannerVisible(container)).toBe(true);

    // Enter a value — banner hides because hasAnyValue is true
    const input = container.querySelector('input[type="number"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '90' } });
    expect(bannerVisible(container)).toBe(false);

    // Clear the value — banner should reappear because hasAnyValue is now false
    // and the dismiss key was never set
    fireEvent.change(input, { target: { value: '' } });
    expect(bannerVisible(container)).toBe(true);
  });

  it('stays hidden after all values are cleared when the dismiss key is present', () => {
    localStorage.setItem(DISMISS_KEY, '1');

    const { container } = render(<KPIDashboard slug="supply-chain-strategy" />);

    // Banner is hidden from the start because the dismiss key is already set
    expect(bannerVisible(container)).toBe(false);

    // Enter a value — banner remains hidden
    const input = container.querySelector('input[type="number"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '90' } });
    expect(bannerVisible(container)).toBe(false);

    // Clear the value — banner must remain hidden even though hasAnyValue is
    // now false, because the dismiss key takes precedence
    fireEvent.change(input, { target: { value: '' } });
    expect(bannerVisible(container)).toBe(false);
  });

  it('dismissing the banner for one framework does not suppress it for a different framework', () => {
    // Mount framework A and dismiss its banner
    const { container: cA, unmount: unmountA } = render(<KPIDashboard slug="supply-chain-strategy" />);
    expect(bannerVisible(cA)).toBe(true);
    fireEvent.click(within(cA).getByRole('button', { name: /dismiss/i }));
    expect(bannerVisible(cA)).toBe(false);
    unmountA();

    // Mount framework B — its banner must still be visible
    const { container: cB } = render(<KPIDashboard slug="procurement-excellence" />);
    expect(bannerVisible(cB)).toBe(true);
  });

  it('each slug produces its own unique localStorage dismiss key', () => {
    const slugA = 'supply-chain-strategy';
    const slugB = 'procurement-excellence';

    const keyA = `isc-kpi-banner-dismissed-${slugA}`;
    const keyB = `isc-kpi-banner-dismissed-${slugB}`;

    // Keys must be distinct
    expect(keyA).not.toBe(keyB);

    // Dismiss framework A and confirm only its key is written
    const { container: cA, unmount: unmountA } = render(<KPIDashboard slug={slugA} />);
    fireEvent.click(within(cA).getByRole('button', { name: /dismiss/i }));
    unmountA();

    expect(localStorage.getItem(keyA)).toBe('1');
    expect(localStorage.getItem(keyB)).toBeNull();

    // Dismiss framework B and confirm both keys are now set independently
    const { container: cB } = render(<KPIDashboard slug={slugB} />);
    fireEvent.click(within(cB).getByRole('button', { name: /dismiss/i }));

    expect(localStorage.getItem(keyA)).toBe('1');
    expect(localStorage.getItem(keyB)).toBe('1');
  });

  it('re-shows the banner when the slug prop changes to a framework whose banner was never dismissed', () => {
    const slugA = 'supply-chain-strategy';
    const slugB = 'procurement-excellence';

    // Mount with slug A, dismiss its banner
    const { container, rerender } = render(<KPIDashboard slug={slugA} />);
    expect(bannerVisible(container)).toBe(true);
    fireEvent.click(within(container).getByRole('button', { name: /dismiss/i }));
    expect(bannerVisible(container)).toBe(false);

    // Re-render the same component instance with slug B (no dismiss key for B)
    rerender(<KPIDashboard slug={slugB} />);

    // Banner must re-appear because slug B was never dismissed
    expect(bannerVisible(container)).toBe(true);
  });

  // ── CSV import path ──────────────────────────────────────────────────────

  /**
   * Trigger a CSV import via the hidden file input.
   * Uses the legacy format (KPI ID + Actual Value) to avoid the new-format
   * calculation path, which requires KPI_DATA_SPECS entries.
   *
   * FileReader is replaced with a synchronous stub so the test works under
   * vi.useFakeTimers() without any timer advancement or async flushing.
   */
  function simulateCsvImport(container: HTMLElement, csvText: string) {
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    if (!fileInput) throw new Error('simulateCsvImport: file input not found in container');

    // Synchronous FileReader stub — fires onload immediately in readAsText.
    const OrigFileReader = (globalThis as Record<string, unknown>).FileReader;
    class SyncFileReader {
      result: string | null = null;
      onload: ((e: { target: SyncFileReader }) => void) | null = null;
      readAsText() {
        this.result = csvText;
        this.onload?.({ target: this });
      }
    }
    (globalThis as Record<string, unknown>).FileReader = SyncFileReader;

    try {
      // Override the read-only `files` property for the test.
      const file = new File([csvText], 'kpis.csv', { type: 'text/csv' });
      Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });

      // act() ensures React flushes all synchronous state updates from onload.
      act(() => {
        fireEvent.change(fileInput);
      });
    } finally {
      (globalThis as Record<string, unknown>).FileReader = OrigFileReader;
    }
  }

  /** Clear every numeric input in the dashboard (simulates "clear all values"). */
  function clearAllInputs(container: HTMLElement) {
    const inputs = container.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
      fireEvent.change(input, { target: { value: '' } });
    });
  }

  /** Legacy-format CSV that sets a value for every supply-chain-strategy KPI. */
  const ALL_KPI_CSV = [
    'KPI ID,Actual Value',
    'por,90',
    'otif,85',
    'sccost,7',
    'c2c,25',
    'fa,80',
    'turns,12',
  ].join('\n');

  it('hides the banner during a CSV import and reappears after all values are cleared when dismiss key is absent', () => {
    const { container } = render(<KPIDashboard slug="supply-chain-strategy" />);

    // Banner visible before import (no values, no dismiss key)
    expect(bannerVisible(container)).toBe(true);

    // Simulate CSV import populating all KPI values via handleKpiImport
    simulateCsvImport(container, ALL_KPI_CSV);

    // Banner must hide because hasAnyValue is now true
    expect(bannerVisible(container)).toBe(false);

    // Clear every value — hasAnyValue becomes false again
    clearAllInputs(container);

    // Banner must reappear because the dismiss key was never set
    expect(bannerVisible(container)).toBe(true);
  });

  it('keeps the banner hidden after a CSV import and subsequent clear when the dismiss key is present', () => {
    localStorage.setItem(DISMISS_KEY, '1');

    const { container } = render(<KPIDashboard slug="supply-chain-strategy" />);

    // Banner hidden from the start due to dismiss key
    expect(bannerVisible(container)).toBe(false);

    // Simulate CSV import populating all KPI values via handleKpiImport
    simulateCsvImport(container, ALL_KPI_CSV);

    // Banner must remain hidden
    expect(bannerVisible(container)).toBe(false);

    // Clear every value — hasAnyValue becomes false
    clearAllInputs(container);

    // Banner must stay hidden because the dismiss key takes precedence
    expect(bannerVisible(container)).toBe(false);
  });

  it('keeps the banner hidden when switching back to a slug whose banner was already dismissed', () => {
    const slugA = 'supply-chain-strategy';
    const slugB = 'procurement-excellence';

    // Mount with slug A and dismiss its banner
    const { container, rerender } = render(<KPIDashboard slug={slugA} />);
    fireEvent.click(within(container).getByRole('button', { name: /dismiss/i }));
    expect(bannerVisible(container)).toBe(false);

    // Switch to slug B — banner re-appears for the new framework
    rerender(<KPIDashboard slug={slugB} />);
    expect(bannerVisible(container)).toBe(true);

    // Switch back to slug A — banner must remain hidden (dismiss key still set)
    rerender(<KPIDashboard slug={slugA} />);
    expect(bannerVisible(container)).toBe(false);
  });
});
