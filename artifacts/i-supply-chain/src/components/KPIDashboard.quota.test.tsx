/**
 * KPIDashboard — quota-exceeded auto-save test.
 *
 * Verifies that when the debounced auto-save in handleChange hits a
 * QuotaExceededError, toast.error is called with id="storage-quota-exceeded"
 * so the user is told their KPI values were not saved.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

/* ── mock sonner before importing anything that imports it ─────────────── */
vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

/* ── mock LanguageContext so the component renders without a Provider ──── */
vi.mock('@/lib/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'en', setLang: vi.fn(), t: (k: string) => k }),
}));

import { toast } from 'sonner';
import { KPIDashboard } from './KPIDashboard';

/* ── jsdom doesn't ship ResizeObserver; stub it for recharts ───────────── */
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

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
});
