/**
 * IndustryBenchmark (#398, 30 Aug 2026; demo mode added same day) tests.
 *
 * Covers: sign-in gate (no fetch made), no-snapshot honest-empty state,
 * insufficient-sample state (below privacy floor -- no fabricated
 * comparison shown), a real cohort comparison rendering sample size, mean,
 * and your score correctly, and the client-side-only demo/illustrative
 * toggle -- hidden by default, clearly labeled when shown, never fetched.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import { IndustryBenchmark } from './IndustryBenchmark';

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

const NO_SNAPSHOT = { ok: true, minCohortSize: 5, hasSnapshot: false, industry: null, companySize: null, takenAt: null, rows: [] };

function mockFetchFor(res: unknown = NO_SNAPSHOT) {
  return vi.fn(() => Promise.resolve({ json: async () => res }));
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  mockAuthState.user = null;
  mockAuthState.loading = false;
  mockLang.value = 'en';
});

describe('IndustryBenchmark', () => {
  it('shows a sign-in prompt when not authenticated, no fetch made', () => {
    mockAuthState.user = null;
    const fetchSpy = vi.spyOn(global, 'fetch');
    render(<IndustryBenchmark />);
    expect(screen.getByText('Sign In')).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('shows the honest-empty state when signed in with no completed assessment', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = mockFetchFor();
    render(<IndustryBenchmark />);
    await waitFor(() => expect(screen.getByText('No assessment yet')).toBeTruthy());
    expect(screen.getByText('Start the Assessment')).toBeTruthy();
  });

  it('shows the insufficient-sample message rather than a fabricated comparison', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = mockFetchFor({
      ok: true, minCohortSize: 5, hasSnapshot: true, industry: 'Retail', companySize: '1-10', takenAt: '2026-08-30',
      rows: [{ segmentId: 'strategy', segmentTitle: 'Strategy', segmentTitleAr: null, yourScore: 3.2, insufficientSample: true, sampleSize: null, mean: null, median: null, p25: null, p75: null }],
    });
    render(<IndustryBenchmark />);
    await waitFor(() => expect(screen.getByText('Strategy')).toBeTruthy());
    expect(screen.getByText(/Not enough contributing organizations yet/)).toBeTruthy();
    expect(screen.getByText('3.2/5.0')).toBeTruthy();
  });

  it('renders a real cohort comparison with sample size and mean when data clears the privacy floor', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = mockFetchFor({
      ok: true, minCohortSize: 5, hasSnapshot: true, industry: 'Energy & Oil', companySize: '51-200', takenAt: '2026-08-30',
      rows: [{ segmentId: 'risk', segmentTitle: 'Risk', segmentTitleAr: null, yourScore: 3.2, insufficientSample: false, sampleSize: 7, mean: 3.5, median: 3.4, p25: 3.0, p75: 4.0 }],
    });
    render(<IndustryBenchmark />);
    await waitFor(() => expect(screen.getByText('Risk')).toBeTruthy());
    expect(screen.getByText(/Based on 7 ISC clients/)).toBeTruthy();
    expect(screen.getByText('3.5')).toBeTruthy();
  });

  it('hides the demo/illustrative example by default and shows it only when toggled, with an unmistakable label', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = mockFetchFor();
    render(<IndustryBenchmark />);
    await waitFor(() => expect(screen.getByText('No assessment yet')).toBeTruthy());

    expect(screen.queryByTestId('mib-demo-block')).toBeNull();
    expect(screen.queryByText(/Illustrative Example/)).toBeNull();

    fireEvent.click(screen.getByTestId('mib-demo-toggle'));
    expect(screen.getByTestId('mib-demo-block')).toBeTruthy();
    expect(screen.getByText(/Illustrative Example.*Synthetic Data, Not Real ISC Clients/)).toBeTruthy();
    expect(screen.getByText('Strategy & Governance')).toBeTruthy();

    fireEvent.click(screen.getByTestId('mib-demo-toggle'));
    expect(screen.queryByTestId('mib-demo-block')).toBeNull();
  });

  it('never fetches when showing the demo -- it is purely client-side synthetic data', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    const fetchMock = mockFetchFor();
    global.fetch = fetchMock;
    render(<IndustryBenchmark />);
    await waitFor(() => expect(screen.getByText('No assessment yet')).toBeTruthy());
    const callsBeforeDemo = (fetchMock as ReturnType<typeof vi.fn>).mock.calls.length;

    fireEvent.click(screen.getByTestId('mib-demo-toggle'));
    expect(screen.getByTestId('mib-demo-block')).toBeTruthy();
    expect((fetchMock as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsBeforeDemo);
  });
});
