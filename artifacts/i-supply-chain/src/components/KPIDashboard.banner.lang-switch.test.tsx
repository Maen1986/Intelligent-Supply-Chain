/**
 * KPIDashboard — banner language-switch test (ar → en).
 *
 * Confirms that when the LanguageContext switches from lang='ar' to lang='en'
 * the banner re-renders with the English headline and the Arabic headline is
 * removed — verifying the component is correctly subscribed to LanguageContext
 * rather than capturing lang at mount time.
 */
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
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

/**
 * useLanguage is mocked with a vi.fn() so individual tests can swap the
 * return value between renders to simulate a live language toggle.
 */
const mockUseLanguage = vi.hoisted(() => vi.fn());

vi.mock('@/lib/LanguageContext', () => ({
  useLanguage: mockUseLanguage,
}));

/* ── Component under test (imported after all vi.mock calls) ─────────────── */
import { KPIDashboard } from './KPIDashboard';

/* ── Test suite ──────────────────────────────────────────────────────────── */

describe('KPIDashboard banner — language switch ar → en', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('shows the Arabic headline initially, then shows the English headline after switching to lang=en', () => {
    // Start in Arabic
    mockUseLanguage.mockReturnValue({ lang: 'ar', setLang: vi.fn(), t: (k: string) => k });

    const { rerender } = render(<KPIDashboard slug="supply-chain-strategy" />);

    // Arabic headline must be present; English headline must be absent
    expect(screen.getByText('كيف تُدخل بياناتك بدقة؟')).toBeInTheDocument();
    expect(screen.queryByText(/How to get accurate KPI results/i)).not.toBeInTheDocument();

    // Simulate the user switching back to English
    mockUseLanguage.mockReturnValue({ lang: 'en', setLang: vi.fn(), t: (k: string) => k });
    rerender(<KPIDashboard slug="supply-chain-strategy" />);

    // English headline must now be visible; Arabic headline must be gone
    expect(screen.getByText(/How to get accurate KPI results/i)).toBeInTheDocument();
    expect(screen.queryByText('كيف تُدخل بياناتك بدقة؟')).not.toBeInTheDocument();
  });
});
