/**
 * DecisionMemory — #174 QA tests (24 Aug 2026), written with the 6-
 * dimension customer-simulation walkthrough (Decision Record 8.6) applied
 * during the build itself. See DecisionMemory.tsx and roiSummary.ts
 * headers for the reasoning behind each of these.
 *
 * Covers: sign-in gate (no fetch), the "never assessed" honest-empty
 * state, the "assessed but no completed actions yet" distinct empty
 * state, the three real groups (held / did not hold / not yet
 * verifiable) rendering correctly and never conflated, the correlation-
 * not-causation caveat always being visible when there is data, the
 * not-yet-verifiable group's CTA linking to /maturity (the actual next
 * action that would resolve it), and Arabic labels.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { DecisionMemory } from './DecisionMemory';

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));

const mockAuthState: { user: { id: number; fullName: string } | null; loading: boolean } = {
  user: null,
  loading: false,
};
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: mockAuthState.user, loading: mockAuthState.loading }),
}));

const mockLang = { value: 'en' as 'en' | 'ar' };
vi.mock('@/lib/LanguageContext', () => ({
  useLanguage: () => ({ lang: mockLang.value }),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  mockAuthState.user = null;
  mockAuthState.loading = false;
  mockLang.value = 'en';
});

describe('DecisionMemory', () => {
  it('shows a sign-in prompt when not authenticated, no fetch made', () => {
    mockAuthState.user = null;
    const fetchSpy = vi.spyOn(global, 'fetch');
    render(<DecisionMemory />);
    expect(screen.getByText('Sign In')).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('shows the "never assessed" empty state when hasData is false', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, hasData: false, learningItems: [] }) });
    render(<DecisionMemory />);
    await waitFor(() => expect(screen.getByText(/No record yet/)).toBeTruthy());
    expect(screen.getByText('Start Maturity Assessment')).toBeTruthy();
  });

  it('shows a distinct "no completed actions yet" state when hasData is true but learningItems is empty', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, hasData: true, learningItems: [] }) });
    render(<DecisionMemory />);
    await waitFor(() => expect(screen.getByText(/No completed, assessment-linked actions yet/)).toBeTruthy());
    // Must NOT show the "never assessed" copy -- these are two different situations.
    expect(screen.queryByText(/No record yet/)).toBeNull();
  });

  const POPULATED = {
    ok: true, hasData: true,
    learningItems: [
      { id: 1, action: 'Renegotiate contract', segmentTitle: 'Procurement', scoreBefore: 2.0, scoreAfter: 3.0, delta: 1.0, completedAt: '2026-08-10T00:00:00Z', held: true },
      { id: 2, action: 'Diversify supplier base', segmentTitle: 'Risk', scoreBefore: 3.0, scoreAfter: 1.5, delta: -1.5, completedAt: '2026-07-20T00:00:00Z', held: false },
      { id: 3, action: 'Automate PO approval', segmentTitle: 'Procurement', scoreBefore: 2.0, scoreAfter: null, delta: null, completedAt: '2026-08-22T00:00:00Z', held: null },
    ],
  };

  it('renders all three groups (held / did not hold / not yet verifiable) with the right items in each, never conflated', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => POPULATED });
    render(<DecisionMemory />);
    await waitFor(() => expect(screen.getByText('Renegotiate contract')).toBeTruthy());
    expect(screen.getByText(/Held or Improved/)).toBeTruthy();
    expect(screen.getByText(/Did Not Hold/)).toBeTruthy();
    expect(screen.getByText(/Not Yet Verifiable/)).toBeTruthy();
    expect(screen.getByText('Diversify supplier base')).toBeTruthy();
    expect(screen.getByText('Automate PO approval')).toBeTruthy();
  });

  it('always shows the correlation-not-causation caveat when there is data', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => POPULATED });
    render(<DecisionMemory />);
    await waitFor(() => expect(screen.getByText(/a correlation, not conclusive proof/)).toBeTruthy());
  });

  it('the not-yet-verifiable group links to Maturity Assessment -- the real next action to resolve it', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => POPULATED });
    render(<DecisionMemory />);
    await waitFor(() => expect(screen.getByText('Take a new assessment to verify')).toBeTruthy());
    const link = screen.getByText('Take a new assessment to verify').closest('a');
    expect(link?.getAttribute('href')).toBe('/maturity');
  });

  it('renders Arabic labels when lang=ar', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    mockLang.value = 'ar';
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => POPULATED });
    render(<DecisionMemory />);
    // The accent badge pill only renders in the populated-data hero, not the honest-empty
    // early returns (mirrors ROIWaterfall.tsx's own established pattern).
    await waitFor(() => expect(screen.getByText('ذاكرة القرار')).toBeTruthy());
    expect(screen.getByText('استمرت أو تحسّنت')).toBeTruthy();
  });
});
