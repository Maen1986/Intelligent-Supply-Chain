/**
 * DailyBrief — #171 QA tests (23 Aug 2026, hardened after the required
 * 6-dimension customer-simulation walkthrough -- see brief.ts and the site
 * map v62 changelog for what the walkthrough found and why each of these
 * cases exists)
 *
 * Covers the honesty-critical paths: not-signed-in state (no fetch made),
 * the TWO distinct empty states (never-assessed vs. real-history-but-quiet-
 * window -- personalization, dimension 3), the four real sections rendering
 * from real data, the server-computed days-overdue figure actually
 * rendering the number the backend sent rather than making the reader do
 * the subtraction (decision-readiness, dimension 1), completions deep-
 * linking to the correct ProcurementTools tab instead of always landing on
 * the default tab (actionability, dimension 4), the daily/weekly window
 * toggle re-fetching with the right query param, and Arabic labels.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import { DailyBrief } from './DailyBrief';

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

const EMPTY_SUMMARY_NEVER_ASSESSED = {
  ok: true, hasData: false, everHasHistory: false, window: 'weekly', windowDays: 7,
  changed: { hasComparison: false, latestSnapshotAt: null, previousSnapshotAt: null, segments: [] },
  trendWarning: { hasEnoughHistory: false, oldestSnapshotAt: null, middleSnapshotAt: null, latestSnapshotAt: null, segments: [] },
  needsYou: { overdue: [], notStarted: [] },
  emerging: [],
  completions: [],
};

const EMPTY_SUMMARY_QUIET_WEEK = {
  ...EMPTY_SUMMARY_NEVER_ASSESSED,
  everHasHistory: true,
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  mockAuthState.user = null;
  mockAuthState.loading = false;
  mockLang.value = 'en';
});

describe('DailyBrief', () => {
  it('shows a sign-in prompt when not authenticated, no fetch made', () => {
    mockAuthState.user = null;
    const fetchSpy = vi.spyOn(global, 'fetch');
    render(<DailyBrief />);
    expect(screen.getByText('Sign In')).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('never-assessed empty state (everHasHistory=false) points to Maturity Assessment, not Action Tracker', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => EMPTY_SUMMARY_NEVER_ASSESSED });
    render(<DailyBrief />);
    await waitFor(() => expect(screen.getByText(/No history yet/)).toBeTruthy());
    expect(screen.getByText('Start Maturity Assessment')).toBeTruthy();
    expect(screen.queryByText('Go to Action Tracker')).toBeNull();
  });

  it('quiet-week empty state (everHasHistory=true) reassures an existing user instead of prompting them to start over', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => EMPTY_SUMMARY_QUIET_WEEK });
    render(<DailyBrief />);
    await waitFor(() => expect(screen.getByText(/everything's on track/)).toBeTruthy());
    expect(screen.getByText('Go to Action Tracker')).toBeTruthy();
    expect(screen.queryByText('Start Maturity Assessment')).toBeNull();
  });

  it('fetches the weekly window by default', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: async () => EMPTY_SUMMARY_NEVER_ASSESSED });
    global.fetch = fetchSpy;
    render(<DailyBrief />);
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    expect(fetchSpy.mock.calls[0][0]).toContain('window=weekly');
  });

  it('clicking the Daily toggle re-fetches with window=daily', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: async () => EMPTY_SUMMARY_NEVER_ASSESSED });
    global.fetch = fetchSpy;
    render(<DailyBrief />);
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByText('Daily'));
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
    expect(fetchSpy.mock.calls[1][0]).toContain('window=daily');
  });

  const POPULATED_SUMMARY = {
    ok: true, hasData: true, everHasHistory: true, window: 'weekly', windowDays: 7,
    changed: {
      hasComparison: true, latestSnapshotAt: '2026-08-20T00:00:00Z', previousSnapshotAt: '2026-08-01T00:00:00Z',
      segments: [{ title: 'Procurement', scoreLatest: 3.5, scorePrevious: 2.0, delta: 1.5 }],
    },
    trendWarning: {
      hasEnoughHistory: true, oldestSnapshotAt: '2026-07-25T00:00:00Z',
      middleSnapshotAt: '2026-08-08T00:00:00Z', latestSnapshotAt: '2026-08-20T00:00:00Z',
      segments: [],
    },
    needsYou: {
      overdue: [{ id: 1, phase: 'days30', action: 'Fix OTIF', segmentTitle: 'Logistics', dueAt: '2026-08-01T00:00:00Z', daysOverdue: 22 }],
      notStarted: [{ id: 2, action: 'Review contracts', segmentTitle: 'CLM', source: 'diagnostic', createdAt: '2026-08-01T00:00:00Z' }],
    },
    emerging: [{ id: 3, action: 'New recommendation', segmentTitle: 'Risk', source: 'maturity', createdAt: '2026-08-22T00:00:00Z' }],
    completions: [
      { type: 'tco', label: 'TCO analysis saved: Widget TCO', occurredAt: '2026-08-21T10:00:00Z', href: '/procurement-tools#tco' },
      { type: 'workingcapital', label: 'Working Capital scenario saved: Base Case', occurredAt: '2026-08-19T10:00:00Z', href: '/procurement-tools#workingcapital' },
    ],
  };

  it('renders all five real sections with populated data, no fabricated content', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => POPULATED_SUMMARY });
    render(<DailyBrief />);
    await waitFor(() => expect(screen.getByText('What Changed')).toBeTruthy());
    expect(screen.getByText('Early Warning')).toBeTruthy();
    expect(screen.getByText("What Needs You")).toBeTruthy();
    expect(screen.getByText("What's Emerging")).toBeTruthy();
    expect(screen.getByText('Recent Completions')).toBeTruthy();

    expect(screen.getByText('Procurement')).toBeTruthy();
    expect(screen.getByText('Fix OTIF')).toBeTruthy();
    expect(screen.getByText('Review contracts')).toBeTruthy();
    expect(screen.getByText('New recommendation')).toBeTruthy();
    expect(screen.getByText('TCO analysis saved: Widget TCO')).toBeTruthy();
  });

  it('renders the server-computed days-overdue figure verbatim rather than only a bare date (decision-readiness)', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => POPULATED_SUMMARY });
    render(<DailyBrief />);
    await waitFor(() => expect(screen.getByText(/22 days overdue/)).toBeTruthy());
  });

  it('deep-links each completion to its own ProcurementTools tab, not the generic page (actionability)', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => POPULATED_SUMMARY });
    render(<DailyBrief />);
    await waitFor(() => expect(screen.getByText('TCO analysis saved: Widget TCO')).toBeTruthy());
    const tcoLink = screen.getByText('TCO analysis saved: Widget TCO').closest('a');
    expect(tcoLink?.getAttribute('href')).toBe('/procurement-tools#tco');
    const wcLink = screen.getByText('Working Capital scenario saved: Base Case').closest('a');
    expect(wcLink?.getAttribute('href')).toBe('/procurement-tools#workingcapital');
  });

  it('renders Arabic labels when lang=ar', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    mockLang.value = 'ar';
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => EMPTY_SUMMARY_NEVER_ASSESSED });
    render(<DailyBrief />);
    await waitFor(() => expect(screen.getByText('ملخصك')).toBeTruthy());
  });
});
