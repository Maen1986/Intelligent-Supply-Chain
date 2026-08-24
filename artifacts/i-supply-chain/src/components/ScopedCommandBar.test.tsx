/**
 * ScopedCommandBar (#180, Wave B-6, 24 Aug 2026) tests.
 *
 * Covers: sign-in gating (no trigger, no fetch), all three fixed intents
 * matching + rendering real data from mocked GET /api/workbench/summary
 * and GET /api/maturity/snapshots, the honest no-match empty state, the
 * honest missing-quarter-data empty state for "compare Q1 vs Q2," and
 * navigation-on-select closing the dialog.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import { ScopedCommandBar, matchIntent, computeSegmentDeltas } from './ScopedCommandBar';

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));

const mockAuthState: { user: { id: number; fullName: string } | null } = { user: null };
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: mockAuthState.user }),
}));

const mockLang = { value: 'en' as 'en' | 'ar' };
vi.mock('@/lib/LanguageContext', () => ({
  useLanguage: () => ({ lang: mockLang.value }),
}));

const navigateSpy = vi.fn();
vi.mock('wouter', () => ({
  useLocation: () => ['/', navigateSpy],
}));

const EMPTY_WORKBENCH = {
  ok: true, hasData: false,
  actions: { total: 0, notStarted: 0, inProgress: 0, done: 0, items: [] },
  investigations: [],
};
const EMPTY_SNAPSHOTS = { ok: true, snapshots: [] };

function mockFetchFor(workbench = EMPTY_WORKBENCH, snapshots = EMPTY_SNAPSHOTS) {
  return vi.fn((url: string) => {
    if (url.includes('/workbench/summary')) return Promise.resolve({ json: async () => workbench });
    if (url.includes('/maturity/snapshots')) return Promise.resolve({ json: async () => snapshots });
    return Promise.resolve({ json: async () => ({ ok: false }) });
  });
}

async function openBar() {
  fireEvent.click(screen.getByRole('button', { name: /ask your data/i }));
  await waitFor(() => expect(screen.getByPlaceholderText(/ask about your data/i)).toBeTruthy());
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  mockAuthState.user = null;
  mockLang.value = 'en';
  navigateSpy.mockClear();
});

describe('matchIntent (fixed keyword router)', () => {
  it('matches "my last diagnosis" style phrasing', () => {
    expect(matchIntent('find my last diagnosis')).toEqual({ type: 'lastDiagnosis' });
    expect(matchIntent('show my last investigation')).toEqual({ type: 'lastDiagnosis' });
  });
  it('matches "my open actions" style phrasing', () => {
    expect(matchIntent('show my open actions')).toEqual({ type: 'openActions' });
    expect(matchIntent('what actions do I have')).toEqual({ type: 'openActions' });
  });
  it('matches "compare Qx vs Qy" style phrasing with and without explicit years', () => {
    expect(matchIntent('compare my Q1 vs Q2 scores')).toMatchObject({ type: 'compareQuarters' });
    expect(matchIntent('Q1 2026 vs Q2 2026')).toEqual({
      type: 'compareQuarters',
      qa: { q: 1, year: 2026 },
      qb: { q: 2, year: 2026 },
    });
  });
  it('returns null for anything it cannot honestly answer', () => {
    expect(matchIntent('what is the weather today')).toBeNull();
    expect(matchIntent('')).toBeNull();
    expect(matchIntent('   ')).toBeNull();
  });
});

describe('computeSegmentDeltas', () => {
  it('matches by title, drops zero deltas, sorts by |delta| descending -- same shape as brief.ts', () => {
    const earlier = { id: 1, takenAt: '2026-02-01', segmentScores: [{ id: 'a', title: 'Procurement', score: 2 }, { id: 'b', title: 'Logistics', score: 3 }] };
    const later = { id: 2, takenAt: '2026-05-01', segmentScores: [{ id: 'a', title: 'Procurement', score: 3 }, { id: 'b', title: 'Logistics', score: 3 }] };
    const deltas = computeSegmentDeltas(earlier, later);
    expect(deltas).toEqual([{ title: 'Procurement', scorePrevious: 2, scoreLatest: 3, delta: 1 }]);
  });
});

describe('ScopedCommandBar sign-in gating', () => {
  it('renders nothing and makes no fetch when signed out', () => {
    mockAuthState.user = null;
    const fetchSpy = vi.spyOn(global, 'fetch');
    const { container } = render(<ScopedCommandBar />);
    expect(container.innerHTML).toBe('');
    expect(screen.queryByRole('button', { name: /ask your data/i })).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('ScopedCommandBar intents', () => {
  it('intent 1: renders the last diagnosis from GET /api/workbench/summary and navigates to /command-center on select', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = mockFetchFor({
      ok: true, hasData: true,
      actions: { total: 0, notStarted: 0, inProgress: 0, done: 0, items: [] },
      investigations: [
        { id: 9, tool: 'diagnostic', industry: 'Manufacturing', subIndustry: 'Automotive', challenge: 'Supplier lead-time volatility', problemCount: 3, createdAt: '2026-08-01T00:00:00Z' },
      ],
    });
    render(<ScopedCommandBar />);
    await openBar();
    fireEvent.change(screen.getByPlaceholderText(/ask about your data/i), { target: { value: 'find my last diagnosis' } });
    await waitFor(() => expect(screen.getByText('Supplier lead-time volatility')).toBeTruthy());
    expect(screen.getByText(/Manufacturing \/ Automotive/)).toBeTruthy();
    fireEvent.click(screen.getByText('Supplier lead-time volatility'));
    expect(navigateSpy).toHaveBeenCalledWith('/command-center');
  });

  it('intent 1: honest empty state when no investigations exist', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = mockFetchFor();
    render(<ScopedCommandBar />);
    await openBar();
    fireEvent.change(screen.getByPlaceholderText(/ask about your data/i), { target: { value: 'my last diagnosis' } });
    await waitFor(() => expect(screen.getByText('No diagnosis on file yet.')).toBeTruthy());
  });

  it('intent 2: renders only OPEN (non-done) actions from the same workbench summary', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = mockFetchFor({
      ok: true, hasData: true,
      actions: {
        total: 3, notStarted: 1, inProgress: 1, done: 1,
        items: [
          { id: 1, source: 'maturity', phase: 'days30', segmentTitle: 'Procurement', action: 'Formalize supplier scorecards', status: 'not_started', createdAt: '2026-08-01T00:00:00Z', completedAt: null, dueAt: '2026-01-01T00:00:00Z', isOverdue: true, daysOverdue: 20 },
          { id: 2, source: 'maturity', phase: 'days60', segmentTitle: 'Logistics', action: 'Renegotiate freight contracts', status: 'in_progress', createdAt: '2026-08-01T00:00:00Z', completedAt: null, dueAt: null, isOverdue: false, daysOverdue: null },
          { id: 3, source: 'maturity', phase: 'days30', segmentTitle: 'Quality', action: 'Already finished action', status: 'done', createdAt: '2026-08-01T00:00:00Z', completedAt: '2026-08-05T00:00:00Z', dueAt: null, isOverdue: false, daysOverdue: null },
        ],
      },
      investigations: [],
    });
    render(<ScopedCommandBar />);
    await openBar();
    fireEvent.change(screen.getByPlaceholderText(/ask about your data/i), { target: { value: 'show my open actions' } });
    await waitFor(() => expect(screen.getByText('Formalize supplier scorecards')).toBeTruthy());
    expect(screen.getByText('Renegotiate freight contracts')).toBeTruthy();
    expect(screen.queryByText('Already finished action')).toBeNull();
    expect(screen.getByText('20d overdue')).toBeTruthy();
  });

  it('intent 2: honest empty state when there are zero open actions', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = mockFetchFor({
      ok: true, hasData: true,
      actions: { total: 1, notStarted: 0, inProgress: 0, done: 1, items: [
        { id: 1, source: 'maturity', phase: 'days30', segmentTitle: null, action: 'Done thing', status: 'done', createdAt: '2026-08-01T00:00:00Z', completedAt: '2026-08-01T00:00:00Z', dueAt: null, isOverdue: false, daysOverdue: null },
      ] },
      investigations: [],
    });
    render(<ScopedCommandBar />);
    await openBar();
    fireEvent.change(screen.getByPlaceholderText(/ask about your data/i), { target: { value: 'my open actions' } });
    await waitFor(() => expect(screen.getByText('No open actions -- nice work.')).toBeTruthy());
  });

  it('intent 3: computes a real per-segment delta between the matched Q1 and Q2 snapshots and navigates to /maturity on select', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = mockFetchFor(EMPTY_WORKBENCH, {
      ok: true,
      snapshots: [
        { id: 1, takenAt: '2026-02-10T00:00:00Z', segmentScores: [{ id: 's1', title: 'Procurement', score: 2.5 }, { id: 's2', title: 'Logistics', score: 3.0 }] },
        { id: 2, takenAt: '2026-05-10T00:00:00Z', segmentScores: [{ id: 's1', title: 'Procurement', score: 3.2 }, { id: 's2', title: 'Logistics', score: 3.0 }] },
      ],
    });
    render(<ScopedCommandBar />);
    await openBar();
    fireEvent.change(screen.getByPlaceholderText(/ask about your data/i), { target: { value: 'compare Q1 2026 vs Q2 2026 scores' } });
    await waitFor(() => expect(screen.getByText('Procurement')).toBeTruthy());
    expect(screen.getByText('2.5 → 3.2')).toBeTruthy();
    expect(screen.getByText('+0.70')).toBeTruthy();
    // Logistics had zero delta -- correctly dropped, not shown as a fabricated "no change" row that could be confused with missing data.
    expect(screen.queryByText('Logistics')).toBeNull();
    fireEvent.click(screen.getByText('Procurement'));
    expect(navigateSpy).toHaveBeenCalledWith('/maturity');
  });

  it('intent 3: honest "no data for that quarter" state -- never fabricates a comparison from a missing snapshot', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = mockFetchFor(EMPTY_WORKBENCH, {
      ok: true,
      snapshots: [
        { id: 1, takenAt: '2026-02-10T00:00:00Z', segmentScores: [{ id: 's1', title: 'Procurement', score: 2.5 }] },
      ],
    });
    render(<ScopedCommandBar />);
    await openBar();
    fireEvent.change(screen.getByPlaceholderText(/ask about your data/i), { target: { value: 'compare Q1 2026 vs Q2 2026 scores' } });
    await waitFor(() => expect(screen.getByText(/No data for Q2 2026/)).toBeTruthy());
  });

  it('shows the honest no-match empty state for anything the fixed router cannot parse', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = mockFetchFor();
    render(<ScopedCommandBar />);
    await openBar();
    fireEvent.change(screen.getByPlaceholderText(/ask about your data/i), { target: { value: 'what should I have for lunch' } });
    await waitFor(() => expect(screen.getByText(/Not sure what you're asking/)).toBeTruthy());
  });
});
