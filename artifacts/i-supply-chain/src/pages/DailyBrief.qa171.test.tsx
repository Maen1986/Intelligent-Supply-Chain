/**
 * DailyBrief — #171 QA tests (23 Aug 2026)
 *
 * Covers the honesty-critical paths: not-signed-in state (no fetch made),
 * honest-empty state (signed in, zero activity in the window), the four
 * real sections rendering from real data, the daily/weekly window toggle
 * re-fetching with the right query param, and Arabic labels.
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

const EMPTY_SUMMARY = {
  ok: true, hasData: false, window: 'weekly', windowDays: 7,
  changed: { hasComparison: false, latestSnapshotAt: null, previousSnapshotAt: null, segments: [] },
  needsYou: { overdue: [], notStarted: [] },
  emerging: [],
  completions: [],
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

  it('shows the honest-empty state when signed in with zero activity', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => EMPTY_SUMMARY });
    render(<DailyBrief />);
    await waitFor(() => expect(screen.getByText(/No new activity/)).toBeTruthy());
    expect(screen.getByText('Go to Action Tracker')).toBeTruthy();
  });

  it('fetches the weekly window by default', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: async () => EMPTY_SUMMARY });
    global.fetch = fetchSpy;
    render(<DailyBrief />);
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    expect(fetchSpy.mock.calls[0][0]).toContain('window=weekly');
  });

  it('clicking the Daily toggle re-fetches with window=daily', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: async () => EMPTY_SUMMARY });
    global.fetch = fetchSpy;
    render(<DailyBrief />);
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByText('Daily'));
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
    expect(fetchSpy.mock.calls[1][0]).toContain('window=daily');
  });

  it('renders all four real sections with populated data, no fabricated content', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true, hasData: true, window: 'weekly', windowDays: 7,
        changed: {
          hasComparison: true, latestSnapshotAt: '2026-08-20T00:00:00Z', previousSnapshotAt: '2026-08-01T00:00:00Z',
          segments: [{ title: 'Procurement', scoreLatest: 3.5, scorePrevious: 2.0, delta: 1.5 }],
        },
        needsYou: {
          overdue: [{ id: 1, phase: 'days30', action: 'Fix OTIF', segmentTitle: 'Logistics', dueAt: '2026-08-01T00:00:00Z' }],
          notStarted: [{ id: 2, action: 'Review contracts', segmentTitle: 'CLM', source: 'diagnostic', createdAt: '2026-08-01T00:00:00Z' }],
        },
        emerging: [{ id: 3, action: 'New recommendation', segmentTitle: 'Risk', source: 'maturity', createdAt: '2026-08-22T00:00:00Z' }],
        completions: [{ type: 'tco', label: 'TCO analysis saved: Widget TCO', occurredAt: '2026-08-21T10:00:00Z', href: '/procurement-tools' }],
      }),
    });
    render(<DailyBrief />);
    await waitFor(() => expect(screen.getByText('What Changed')).toBeTruthy());
    expect(screen.getByText("What Needs You")).toBeTruthy();
    expect(screen.getByText("What's Emerging")).toBeTruthy();
    expect(screen.getByText('Recent Completions')).toBeTruthy();

    expect(screen.getByText('Procurement')).toBeTruthy();
    expect(screen.getByText('Fix OTIF')).toBeTruthy();
    expect(screen.getByText('Review contracts')).toBeTruthy();
    expect(screen.getByText('New recommendation')).toBeTruthy();
    expect(screen.getByText('TCO analysis saved: Widget TCO')).toBeTruthy();
  });

  it('renders Arabic labels when lang=ar', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    mockLang.value = 'ar';
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => EMPTY_SUMMARY });
    render(<DailyBrief />);
    await waitFor(() => expect(screen.getByText('ملخصك')).toBeTruthy());
  });
});
