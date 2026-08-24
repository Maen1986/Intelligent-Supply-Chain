/**
 * DailyBrief — #175 Trend-Based Early Warning QA tests (24 Aug 2026)
 *
 * Built into the initial pass (not bolted on after) per Decision Record
 * 8.6 Addendum 3. Covers: honest "not enough history" state (<3
 * snapshots), the real no-decline state, two consecutive declines
 * rendering with the 3-point score sequence, the visual distinction
 * between "already Reactive" and "declining -- early warning" (honesty --
 * these are different severities and must never be conflated), the
 * Review Maturity Assessment CTA only appearing when there is something
 * to review, and Arabic labels.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
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

const BASE = {
  ok: true, hasData: true, everHasHistory: true, window: 'weekly', windowDays: 7,
  changed: { hasComparison: true, latestSnapshotAt: '2026-08-20T00:00:00Z', previousSnapshotAt: '2026-08-01T00:00:00Z', segments: [] },
  needsYou: { overdue: [], notStarted: [] },
  emerging: [],
  completions: [],
};

const NOT_ENOUGH_HISTORY = {
  ...BASE,
  trendWarning: { hasEnoughHistory: false, oldestSnapshotAt: null, middleSnapshotAt: null, latestSnapshotAt: null, segments: [] },
};

const NO_DECLINE = {
  ...BASE,
  trendWarning: {
    hasEnoughHistory: true,
    oldestSnapshotAt: '2026-07-25T00:00:00Z', middleSnapshotAt: '2026-08-08T00:00:00Z', latestSnapshotAt: '2026-08-20T00:00:00Z',
    segments: [],
  },
};

const DECLINING = {
  ...BASE,
  trendWarning: {
    hasEnoughHistory: true,
    oldestSnapshotAt: '2026-07-25T00:00:00Z', middleSnapshotAt: '2026-08-08T00:00:00Z', latestSnapshotAt: '2026-08-20T00:00:00Z',
    segments: [
      { title: 'Supplier Risk', scoreOldest: 3.6, scoreMiddle: 3.2, scoreLatest: 2.8, delta1: -0.4, delta2: -0.4, alreadyReactive: false },
      { title: 'Contract Management', scoreOldest: 2.4, scoreMiddle: 2.0, scoreLatest: 1.6, delta1: -0.4, delta2: -0.4, alreadyReactive: true },
    ],
  },
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  mockAuthState.user = null;
  mockAuthState.loading = false;
  mockLang.value = 'en';
});

describe('DailyBrief -- Early Warning (#175)', () => {
  it('shows the honest "not enough history" message with fewer than 3 snapshots, no CTA', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => NOT_ENOUGH_HISTORY });
    render(<DailyBrief />);
    await waitFor(() => expect(screen.getByText('Early Warning')).toBeTruthy());
    expect(screen.getByText(/Needs at least three assessments/)).toBeTruthy();
    expect(screen.queryByText('Review Maturity Assessment')).toBeNull();
  });

  it('shows the honest "no decline" message when enough history exists but nothing is trending down, no CTA', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => NO_DECLINE });
    render(<DailyBrief />);
    await waitFor(() => expect(screen.getByText(/No segment has declined/)).toBeTruthy());
    expect(screen.queryByText('Review Maturity Assessment')).toBeNull();
  });

  it('renders declining segments with the real 3-point score sequence and the Review CTA', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => DECLINING });
    render(<DailyBrief />);
    await waitFor(() => expect(screen.getByText('Supplier Risk')).toBeTruthy());
    expect(screen.getByText('3.6 → 3.2 → 2.8 (two consecutive declines)')).toBeTruthy();
    expect(screen.getByText('Contract Management')).toBeTruthy();
    expect(screen.getByText('2.4 → 2.0 → 1.6 (two consecutive declines)')).toBeTruthy();
    const cta = screen.getByText('Review Maturity Assessment').closest('a');
    expect(cta?.getAttribute('href')).toBe('/maturity');
  });

  it('honestly distinguishes "already in Reactive" from "declining -- early warning" -- never conflates the two severities', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => DECLINING });
    render(<DailyBrief />);
    await waitFor(() => expect(screen.getByText('Declining — early warning')).toBeTruthy());
    expect(screen.getByText('Already in Reactive')).toBeTruthy();
  });

  it('renders Arabic labels for the Early Warning section', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    mockLang.value = 'ar';
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => DECLINING });
    render(<DailyBrief />);
    await waitFor(() => expect(screen.getByText('تحذير مبكر')).toBeTruthy());
    expect(screen.getByText('اتجاه تنازلي — إنذار مبكر')).toBeTruthy();
    expect(screen.getByText('داخل النطاق التفاعلي بالفعل')).toBeTruthy();
  });
});
