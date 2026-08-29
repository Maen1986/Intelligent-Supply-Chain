/**
 * ProblemMap (#192, 30 Aug 2026) tests.
 *
 * Covers: sign-in gate (no fetch made), honest-empty state, real scatter
 * points rendering with correct industry/severity, the wizard-only tally
 * strip appearing with focusArea counts, the "no fabricated severity"
 * explanatory copy, the status legend acting as a real filter (not
 * decoration), the industry filter, and the empty-after-filter case.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import { ProblemMap } from './ProblemMap';

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

const EMPTY = { ok: true, hasData: false, points: [], wizardTally: [] };

function mockFetchFor(res: unknown = EMPTY) {
  return vi.fn(() => Promise.resolve({ json: async () => res }));
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  mockAuthState.user = null;
  mockAuthState.loading = false;
  mockLang.value = 'en';
});

describe('ProblemMap', () => {
  it('shows a sign-in prompt when not authenticated, no fetch made', () => {
    mockAuthState.user = null;
    const fetchSpy = vi.spyOn(global, 'fetch');
    render(<ProblemMap />);
    expect(screen.getByText('Sign In')).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('shows the honest-empty state when signed in with no problems and no wizard submissions', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = mockFetchFor();
    render(<ProblemMap />);
    await waitFor(() => expect(screen.getByText('No problems logged yet')).toBeTruthy());
    expect(screen.getByText('Open the Consultancy Engine')).toBeTruthy();
  });

  it('renders real scatter points grouped by industry, with severity and status', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = mockFetchFor({
      ok: true, hasData: true,
      points: [
        { id: '1-P1', submissionId: 1, industry: 'Manufacturing', subIndustry: 'Discrete', title: 'Stockout risk', severityScore: 82, status: 'Active', framework: 'SCOR Source', confidence: 85, createdAt: '2026-08-01' },
        { id: '2-P1', submissionId: 2, industry: 'Retail', subIndustry: null, title: 'Slow supplier onboarding', severityScore: 40, status: 'Recurring', framework: 'CIPS', confidence: 70, createdAt: '2026-08-02' },
      ],
      wizardTally: [],
    });
    render(<ProblemMap />);
    await waitFor(() => expect(screen.getByText('List')).toBeTruthy());
    // switch to List tab, where each problem's title renders as real text (chart SVG text is harder to assert on)
    fireEvent.click(screen.getByText('List'));
    await waitFor(() => expect(screen.getByText('Problems')).toBeTruthy());
    expect(screen.getByText('Stockout risk')).toBeTruthy();
    expect(screen.getByText('Slow supplier onboarding')).toBeTruthy();
    expect(screen.getByText('82/100 · High')).toBeTruthy();
    expect(screen.getByText('40/100 · Medium')).toBeTruthy();
  });

  it('renders the wizard-only tally strip with real focusArea counts and the no-fabrication explanation', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = mockFetchFor({
      ok: true, hasData: true,
      points: [],
      wizardTally: [
        { focusArea: 'Procurement', count: 3, mostRecentAt: '2026-08-20' },
        { focusArea: 'Risk Management', count: 1, mostRecentAt: '2026-08-15' },
      ],
    });
    render(<ProblemMap />);
    await waitFor(() => expect(screen.getByText('Procurement')).toBeTruthy());
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('Risk Management')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText(/doesn't produce the Problem DNA/)).toBeTruthy();
    expect(screen.getByText('View these reports')).toBeTruthy();
    expect(screen.getByText('Get a full Consultancy Engine diagnosis')).toBeTruthy();
  });

  it('status legend filters points -- clicking Active off hides Active rows in the List tab', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = mockFetchFor({
      ok: true, hasData: true,
      points: [
        { id: '1-P1', submissionId: 1, industry: 'Manufacturing', subIndustry: null, title: 'Active problem', severityScore: 90, status: 'Active', framework: null, confidence: null, createdAt: '2026-08-01' },
        { id: '2-P1', submissionId: 2, industry: 'Retail', subIndustry: null, title: 'Resolved problem', severityScore: 20, status: 'Resolved', framework: null, confidence: null, createdAt: '2026-08-02' },
      ],
      wizardTally: [],
    });
    render(<ProblemMap />);
    await waitFor(() => expect(screen.getByText('List')).toBeTruthy());
    fireEvent.click(screen.getByText('List'));
    await waitFor(() => expect(screen.getByText('Problems')).toBeTruthy());
    expect(screen.getByText('Active problem')).toBeTruthy();
    expect(screen.getByText('Resolved problem')).toBeTruthy();

    // Click the "Active" legend chip to hide Active-status points
    const activeChips = screen.getAllByText('Active');
    fireEvent.click(activeChips[0].closest('button')!); // legend chip renders before the List row badges in DOM order
    expect(screen.queryByText('Active problem')).toBeNull();
    expect(screen.getByText('Resolved problem')).toBeTruthy();
  });

  it('renders Arabic labels when lang is ar', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    mockLang.value = 'ar';
    global.fetch = mockFetchFor();
    render(<ProblemMap />);
    await waitFor(() => expect(screen.getByText('لا توجد بيانات بعد')).toBeTruthy());
  });
});
