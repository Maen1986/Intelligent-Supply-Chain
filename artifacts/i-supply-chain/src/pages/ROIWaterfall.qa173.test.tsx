/**
 * ROIWaterfall — #173/#160 QA tests (23 Aug 2026)
 *
 * Covers the honesty-critical paths: not-signed-in state, honest-empty
 * state (signed in, zero snapshots), and the populated funnel actually
 * rendering the four real counts (never a fabricated 5th "Approved"/
 * "Contracted" stage -- see roiSummary.ts for why those were dropped).
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { ROIWaterfall } from './ROIWaterfall';

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

describe('ROIWaterfall', () => {
  it('shows a sign-in prompt when not authenticated, no fetch made', () => {
    mockAuthState.user = null;
    const fetchSpy = vi.spyOn(global, 'fetch');
    render(<ROIWaterfall />);
    expect(screen.getByText('Sign In')).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('shows the honest-empty state when signed in with zero snapshots', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true, hasData: false,
        funnel: { identified: 0, inProgress: 0, completed: 0, sustained: 0 },
        segments: [], firstSnapshotAt: null, latestSnapshotAt: null, snapshotCount: 0,
      }),
    });
    render(<ROIWaterfall />);
    await waitFor(() => expect(screen.getByText(/No history yet/)).toBeTruthy());
    expect(screen.getByText('Start Maturity Assessment')).toBeTruthy();
  });

  it('renders exactly four funnel stages with real counts, no fabricated 5th stage', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true, hasData: true,
        funnel: { identified: 14, inProgress: 5, completed: 6, sustained: 3 },
        segments: [{ title: 'Procurement Governance', scoreFirst: 2.1, scoreLatest: 3.4, delta: 1.3 }],
        firstSnapshotAt: '2026-05-01T00:00:00Z', latestSnapshotAt: '2026-08-15T00:00:00Z', snapshotCount: 4,
      }),
    });
    render(<ROIWaterfall />);
    await waitFor(() => expect(screen.getByText('Identified')).toBeTruthy());
    expect(screen.getByText('In Progress')).toBeTruthy();
    expect(screen.getByText('Completed')).toBeTruthy();
    expect(screen.getByText('Sustained')).toBeTruthy();
    // The classic procurement funnel's "Approved"/"Contracted" stages must
    // never appear -- this platform has no real data source for them.
    expect(screen.queryByText('Approved')).toBeNull();
    expect(screen.queryByText('Contracted')).toBeNull();

    expect(screen.getByText('14')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
    expect(screen.getByText('6')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();

    // Honest "awaiting verification" note: 6 completed, 3 sustained -> 3 pending.
    expect(screen.getByText(/3 completed actions awaiting a later assessment/)).toBeTruthy();
  });

  it('never claims a dollar/SAR figure anywhere on the page', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true, hasData: true,
        funnel: { identified: 10, inProgress: 2, completed: 4, sustained: 1 },
        segments: [{ title: 'Risk', scoreFirst: 1.0, scoreLatest: 2.0, delta: 1.0 }],
        firstSnapshotAt: '2026-01-01T00:00:00Z', latestSnapshotAt: '2026-06-01T00:00:00Z', snapshotCount: 2,
      }),
    });
    const { container } = render(<ROIWaterfall />);
    await waitFor(() => expect(screen.getByText('Identified')).toBeTruthy());
    expect(container.textContent).not.toMatch(/SAR\s?[\d,]/);
    expect(container.textContent).toMatch(/self-reported/i);
  });

  it('renders Arabic labels and RTL-appropriate stage names when lang=ar', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    mockLang.value = 'ar';
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true, hasData: true,
        funnel: { identified: 8, inProgress: 3, completed: 2, sustained: 1 },
        segments: [{ title: 'Procurement Governance', scoreFirst: 2.0, scoreLatest: 2.5, delta: 0.5 }],
        firstSnapshotAt: '2026-01-01T00:00:00Z', latestSnapshotAt: '2026-06-01T00:00:00Z', snapshotCount: 2,
      }),
    });
    render(<ROIWaterfall />);
    await waitFor(() => expect(screen.getByText('مُحدَّد')).toBeTruthy());
    expect(screen.getByText('قيد التنفيذ')).toBeTruthy();
    expect(screen.getByText('مكتمل')).toBeTruthy();
    expect(screen.getByText('مستدام')).toBeTruthy();
  });
});
