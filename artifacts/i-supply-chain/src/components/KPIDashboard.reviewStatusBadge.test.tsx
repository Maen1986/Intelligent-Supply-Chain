/**
 * KPIDashboard — coverage / source-quality badge tests (#382, 2026-08-23).
 *
 * Confirms the badge introduced in kpiReviewStatus.ts actually renders in the
 * live component tree when a user picks an industry with a real tracked
 * exception (Government / Public Sector), and stays absent for a fully
 * Verified selection -- a real end-to-end check, not just a typecheck.
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

describe('KPIDashboard — coverage / source-quality badge (#382)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('shows no review-status badge before any industry is selected (default General)', () => {
    const { container } = render(<KPIDashboard slug="supply-chain-strategy" />);
    expect(within(container).queryByText(/Benchmark: Context-specific/)).toBeNull();
    expect(within(container).queryByText(/Target: Context-specific/)).toBeNull();
  });

  it('shows Context-specific badges on the Perfect Order Rate card after selecting Government / Public Sector', () => {
    const { container } = render(<KPIDashboard slug="supply-chain-strategy" />);

    const govButton = within(container).getByText(/Government \/ Public Sector/);
    fireEvent.click(govButton);

    // por|government is a real tracked exception in both the Industry KPI tab
    // and the Targets Industry tab of ISC Benchmark Final v54.xlsx.
    expect(within(container).getAllByText(/Benchmark: Context-specific/).length).toBeGreaterThan(0);
    expect(within(container).getAllByText(/Target: Context-specific/).length).toBeGreaterThan(0);
  });

  it('shows no badge for a fully Verified industry (Retail / FMCG) on the same KPI', () => {
    const { container } = render(<KPIDashboard slug="supply-chain-strategy" />);

    const retailButton = within(container).getByText(/Retail \/ FMCG/);
    fireEvent.click(retailButton);

    expect(within(container).queryByText(/Benchmark: Context-specific/)).toBeNull();
    expect(within(container).queryByText(/Benchmark: Estimated/)).toBeNull();
  });
});
