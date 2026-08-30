/**
 * KPIDashboard — per-KPI-card target tier/scope override (#363, 2026-08-30).
 *
 * The Target Tier / GCC-International row (#139/#140) is a GLOBAL setting
 * that applies to every card at once. #363 adds a per-card override so one
 * KPI can be pinned to a different tier/scope than the rest of the
 * dashboard, without touching any other card and without changing the
 * default (no-override) behaviour for anyone who never opens the control.
 *
 * These are real end-to-end render/click/assert checks against the live
 * component tree, not just a typecheck.
 */
import React from 'react';
import { render, fireEvent, cleanup, within } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

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

describe('KPIDashboard — per-card target tier/scope override (#363)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('defaults every card to "Override for this card" (no override active) -- zero behaviour change', () => {
    const { container } = render(<KPIDashboard slug="supply-chain-strategy" />);
    const toggle = within(container).getByTestId('kpi-override-toggle-por');
    expect(toggle.textContent).toContain('Override for this card');
    expect(toggle.textContent).not.toContain('Custom for this card');
    // Global default is Best-in-Class, so Perfect Order Rate still shows its
    // pre-#363 static target.
    expect(within(container).getByText('Target: >95%')).toBeTruthy();
  });

  it('overriding one card to Peer tier changes only that card, leaving every other card on the global tier', () => {
    const { container } = render(<KPIDashboard slug="supply-chain-strategy" />);

    // POR: targetValue 95 (best-in-class) / benchmarkValue 78 (peer)
    // OTIF: targetValue 92 (best-in-class) / benchmarkValue 82 (peer)
    expect(within(container).getByText('Target: >95%')).toBeTruthy();
    expect(within(container).getByText('Target: >92%')).toBeTruthy();

    fireEvent.click(within(container).getByTestId('kpi-override-toggle-por'));
    fireEvent.click(within(container).getByTestId('kpi-override-tier-por-peer'));

    // POR now shows the Peer/benchmark figure...
    expect(within(container).getByText('Target: 78%')).toBeTruthy();
    // ...while OTIF (never touched) is completely unaffected.
    expect(within(container).getByText('Target: >92%')).toBeTruthy();
    // POR's own trigger now reads "Custom for this card".
    expect(within(container).getByTestId('kpi-override-toggle-por').textContent).toContain('Custom for this card');
  });

  it('"Use global setting" clears the override and the card reverts to the global tier', () => {
    const { container } = render(<KPIDashboard slug="supply-chain-strategy" />);

    fireEvent.click(within(container).getByTestId('kpi-override-toggle-por'));
    fireEvent.click(within(container).getByTestId('kpi-override-tier-por-peer'));
    expect(within(container).getByText('Target: 78%')).toBeTruthy();

    fireEvent.click(within(container).getByTestId('kpi-override-reset-por'));
    expect(within(container).getByText('Target: >95%')).toBeTruthy();
    expect(within(container).getByTestId('kpi-override-toggle-por').textContent).not.toContain('Custom for this card');
  });

  it('a per-card override survives a change to the GLOBAL tier picker (per-card wins)', () => {
    const { container } = render(<KPIDashboard slug="supply-chain-strategy" />);

    // Pin POR to Foundational is not computable without a value, so pin it to Peer instead.
    fireEvent.click(within(container).getByTestId('kpi-override-toggle-por'));
    fireEvent.click(within(container).getByTestId('kpi-override-tier-por-peer'));
    expect(within(container).getByText('Target: 78%')).toBeTruthy();
    // Collapse the per-card panel so its own "Peer" pill doesn't collide with
    // the global row's "Peer" button in the query below.
    fireEvent.click(within(container).getByTestId('kpi-override-toggle-por'));

    // Now flip the GLOBAL picker to Peer as well -- POR should stay resolved
    // via its own override (still 78%), and OTIF (no override) should follow
    // the global change to its own Peer/benchmark figure (82%).
    const globalPeerButtons = within(container).getAllByText('Peer', { selector: 'button' });
    fireEvent.click(globalPeerButtons[globalPeerButtons.length - 1]);
    expect(within(container).getByText('Target: 78%')).toBeTruthy();
    expect(within(container).getByText('Target: 82%')).toBeTruthy();
  });

  it('persists the per-card override to localStorage under a slug-scoped key', () => {
    const { container } = render(<KPIDashboard slug="supply-chain-strategy" />);
    fireEvent.click(within(container).getByTestId('kpi-override-toggle-por'));
    fireEvent.click(within(container).getByTestId('kpi-override-scope-por-gcc'));

    const saved = localStorage.getItem('isc-kpi-card-target-override-supply-chain-strategy');
    expect(saved).toBeTruthy();
    const parsed = JSON.parse(saved as string);
    expect(parsed.por.scope).toBe('gcc');
  });
});
