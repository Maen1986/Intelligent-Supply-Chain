/**
 * KPIDashboard — slug-switch KPI value isolation tests.
 *
 * Confirms:
 *  1. When the slug prop changes on a mounted component, slug A's entered values
 *     do not appear in slug B's inputs.
 *  2. Switching back to slug A restores the values that were entered for it.
 *  3. Slug B starts empty (no stored data) when slug A had values but slug B has none.
 *  4. If slug B already has values saved in localStorage they are shown, not slug A's.
 */
import React from 'react';
import { render, fireEvent, cleanup, within, act } from '@testing-library/react';
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

const SLUG_A = 'supply-chain-strategy';
const SLUG_B = 'procurement-excellence';

const STORAGE_KEY_A = `isc-kpi-${SLUG_A}`;
const STORAGE_KEY_B = `isc-kpi-${SLUG_B}`;

/** Returns all number inputs in the container. */
function allInputs(container: HTMLElement): HTMLInputElement[] {
  return Array.from(container.querySelectorAll('input[type="number"]')) as HTMLInputElement[];
}

/** Returns true when every number input in the container has an empty value. */
function allInputsEmpty(container: HTMLElement): boolean {
  return allInputs(container).every(i => i.value === '');
}

describe('KPIDashboard — slug-switch KPI value isolation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('slug B inputs are all empty when slug A had a value but slug B has none', () => {
    const { container, rerender } = render(<KPIDashboard slug={SLUG_A} />);

    // Enter a value for slug A's first KPI input
    const inputA = allInputs(container)[0];
    fireEvent.change(inputA, { target: { value: '88' } });
    expect(inputA.value).toBe('88');

    // Flush the auto-save timer so localStorage is written for slug A
    act(() => { vi.runAllTimers(); });

    // Switch to slug B — slug B has no saved data
    rerender(<KPIDashboard slug={SLUG_B} />);

    // All inputs must now be empty (slug A's value must not leak in)
    expect(allInputsEmpty(container)).toBe(true);
  });

  it('switching back to slug A restores the value that was entered for it', () => {
    const { container, rerender } = render(<KPIDashboard slug={SLUG_A} />);

    // Enter a value for slug A
    const inputA = allInputs(container)[0];
    fireEvent.change(inputA, { target: { value: '75' } });
    act(() => { vi.runAllTimers(); });

    // Verify slug A's value is in localStorage
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY_A) ?? '{}')).toMatchObject(
      expect.objectContaining({ por: '75' }),
    );

    // Switch to slug B
    rerender(<KPIDashboard slug={SLUG_B} />);
    expect(allInputsEmpty(container)).toBe(true);

    // Switch back to slug A — inputs must reflect slug A's saved value
    rerender(<KPIDashboard slug={SLUG_A} />);

    const restoredInput = allInputs(container)[0];
    expect(restoredInput.value).toBe('75');
  });

  it('slug B shows its own saved values (not slug A\'s) after a slug switch', () => {
    // Pre-populate slug B's storage key with a known value for its first KPI ('savings')
    localStorage.setItem(STORAGE_KEY_B, JSON.stringify({ savings: '12' }));

    const { container, rerender } = render(<KPIDashboard slug={SLUG_A} />);

    // Enter a different value for slug A
    const inputA = allInputs(container)[0];
    fireEvent.change(inputA, { target: { value: '99' } });
    act(() => { vi.runAllTimers(); });

    // Switch to slug B
    rerender(<KPIDashboard slug={SLUG_B} />);

    // Slug B's first input should show its own saved value, not slug A's '99'
    const inputB = allInputs(container)[0];
    expect(inputB.value).toBe('12');
  });

  it('entering a value in slug B does not overwrite slug A\'s stored values', () => {
    const { container, rerender } = render(<KPIDashboard slug={SLUG_A} />);

    // Enter a value for slug A and save
    fireEvent.change(allInputs(container)[0], { target: { value: '55' } });
    act(() => { vi.runAllTimers(); });

    // Switch to slug B and enter a different value
    rerender(<KPIDashboard slug={SLUG_B} />);
    fireEvent.change(allInputs(container)[0], { target: { value: '33' } });
    act(() => { vi.runAllTimers(); });

    // Slug A's localStorage key must still hold its original value
    const savedA = JSON.parse(localStorage.getItem(STORAGE_KEY_A) ?? '{}');
    expect(savedA).toMatchObject(expect.objectContaining({ por: '55' }));

    // Slug B's localStorage key must hold only slug B's value
    const savedB = JSON.parse(localStorage.getItem(STORAGE_KEY_B) ?? '{}');
    expect(savedB).toMatchObject(expect.objectContaining({ savings: '33' }));
  });
});
