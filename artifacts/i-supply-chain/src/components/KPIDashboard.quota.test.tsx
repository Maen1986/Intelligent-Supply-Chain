/**
 * KPIDashboard — quota-exceeded auto-save tests.
 *
 * Verifies that when the debounced auto-save in handleChange hits a
 * QuotaExceededError:
 *  1. toast.error is called with id="storage-quota-exceeded"
 *  2. The inline description switches to the "⚠ Values not saved" warning
 *     so the user sees in-context feedback, not just the global toast.
 */
import React from 'react';
import { render, fireEvent, screen, act, within } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

/* ── mock sonner before importing anything that imports it ─────────────── */
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), warning: vi.fn(), dismiss: vi.fn() },
}));

/* ── mock LanguageContext so the component renders without a Provider ──── */
vi.mock('@/lib/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'en', setLang: vi.fn(), t: (k: string) => k }),
}));

import { toast } from 'sonner';
import { KPIDashboard } from './KPIDashboard';

function makeQuotaError(): DOMException {
  return new DOMException('The quota has been exceeded.', 'QuotaExceededError');
}

describe('KPIDashboard — handleChange auto-save quota exceeded', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows toast.error with id="storage-quota-exceeded" when the debounced save hits quota', () => {
    const { container } = render(<KPIDashboard slug="supply-chain-strategy" />);

    // Arm the spy BEFORE the user types so the debounced write is intercepted
    const spy = vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => { throw makeQuotaError(); });

    // Simulate the user entering a value into the first KPI input
    const input = container.querySelector('input[type="number"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '90' } });

    // Advance past the 400 ms SAVE_DELAY so the debounced safeSetItem fires
    vi.advanceTimersByTime(500);

    expect(toast.error).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ id: 'storage-quota-exceeded' }),
    );

    spy.mockRestore();
  });

  it('shows the inline ⚠ warning text when the debounced save is dropped', () => {
    const { container } = render(<KPIDashboard slug="supply-chain-strategy" />);
    const view = within(container);

    // Confirm the normal "auto-saved" description is present before any failure
    expect(view.getByText(/auto-saved/i)).toBeInTheDocument();

    const spy = vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => { throw makeQuotaError(); });

    const input = view.getAllByRole('spinbutton')[0] as HTMLInputElement;
    fireEvent.change(input, { target: { value: '55' } });

    // Advance past the debounce delay and flush React state updates
    act(() => { vi.advanceTimersByTime(500); });

    // The inline description must now show the ⚠ warning, not "auto-saved"
    expect(view.getByText(/Values not saved/i)).toBeInTheDocument();
    expect(view.queryByText(/auto-saved/i)).not.toBeInTheDocument();

    spy.mockRestore();
  });

  it('reverts to "auto-saved" after a successful save follows a failed one', () => {
    const { container } = render(<KPIDashboard slug="supply-chain-strategy" />);
    const view = within(container);

    // First save fails
    const failSpy = vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => { throw makeQuotaError(); });

    const input = view.getAllByRole('spinbutton')[0] as HTMLInputElement;
    fireEvent.change(input, { target: { value: '55' } });
    act(() => { vi.advanceTimersByTime(500); });

    expect(view.getByText(/Values not saved/i)).toBeInTheDocument();
    failSpy.mockRestore();

    // Second save succeeds — warning should clear
    fireEvent.change(input, { target: { value: '60' } });
    act(() => { vi.advanceTimersByTime(500); });

    expect(view.getByText(/auto-saved/i)).toBeInTheDocument();
    expect(view.queryByText(/Values not saved/i)).not.toBeInTheDocument();
  });
});
