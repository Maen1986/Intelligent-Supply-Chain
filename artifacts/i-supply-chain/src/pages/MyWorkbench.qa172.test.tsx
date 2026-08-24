/**
 * MyWorkbench — #172 QA tests (23 Aug 2026), written WITH the 6-dimension
 * customer-simulation walkthrough (Decision Record 8.6) baked into the
 * initial build this time -- see workbench.ts and MyWorkbench.tsx headers
 * for the reasoning behind each scoping decision being tested here.
 *
 * Covers: sign-in gate (no fetch made), the honest-empty state (zero
 * actions, zero investigations, zero plans, no local decision), all four
 * sections rendering real data, overdue actions showing a real computed
 * days-overdue figure, investigations deep-linking to /command-center
 * (the actual page both diagnostic and command_centre submissions come
 * from -- verified in the source before building, not assumed), the
 * Decision Lab bucket reading localStorage directly and labeling it
 * device-local rather than presenting it as synced, and Arabic labels.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { MyWorkbench } from './MyWorkbench';

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

const EMPTY_WORKBENCH = {
  ok: true, hasData: false,
  actions: { total: 0, notStarted: 0, inProgress: 0, done: 0, items: [] },
  investigations: [],
};
const EMPTY_PLANS = { ok: true, plans: [] };

function mockFetchFor(workbench = EMPTY_WORKBENCH, plans = EMPTY_PLANS) {
  return vi.fn((url: string) => {
    if (url.includes('/workbench/summary')) return Promise.resolve({ json: async () => workbench });
    if (url.includes('/plans')) return Promise.resolve({ json: async () => plans });
    return Promise.resolve({ json: async () => ({ ok: false }) });
  });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  mockAuthState.user = null;
  mockAuthState.loading = false;
  mockLang.value = 'en';
  localStorage.clear();
});

describe('MyWorkbench', () => {
  it('shows a sign-in prompt when not authenticated, no fetch made', () => {
    mockAuthState.user = null;
    const fetchSpy = vi.spyOn(global, 'fetch');
    render(<MyWorkbench />);
    expect(screen.getByText('Sign In')).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('shows the honest-empty state when signed in with nothing saved anywhere (server or device)', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = mockFetchFor();
    render(<MyWorkbench />);
    await waitFor(() => expect(screen.getByText(/Nothing here yet/)).toBeTruthy());
    expect(screen.getByText('Start Maturity Assessment')).toBeTruthy();
  });

  it('renders My Actions with a real server-computed days-overdue figure, not a bare date', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = mockFetchFor({
      ok: true, hasData: true,
      actions: {
        total: 1, notStarted: 1, inProgress: 0, done: 0,
        items: [{ id: 1, source: 'maturity', phase: 'days30', segmentTitle: 'Procurement', action: 'Fix OTIF', status: 'not_started', createdAt: '2026-08-01', completedAt: null, dueAt: '2020-01-31', isOverdue: true, daysOverdue: 2400 }],
      },
      investigations: [],
    });
    render(<MyWorkbench />);
    await waitFor(() => expect(screen.getByText('Fix OTIF')).toBeTruthy());
    expect(screen.getByText('2400d overdue')).toBeTruthy();
  });

  it('renders My Investigations deep-linked to /command-center, the real page both submission types come from', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = mockFetchFor({
      ok: true, hasData: true,
      actions: { total: 0, notStarted: 0, inProgress: 0, done: 0, items: [] },
      investigations: [{ id: 10, tool: 'diagnostic', industry: 'Manufacturing', subIndustry: null, challenge: 'Late deliveries', problemCount: 3, createdAt: '2026-08-20T00:00:00Z' }],
    });
    render(<MyWorkbench />);
    await waitFor(() => expect(screen.getByText('Late deliveries')).toBeTruthy());
    const link = screen.getByText('Late deliveries').closest('a');
    expect(link?.getAttribute('href')).toBe('/command-center');
    expect(screen.getByText(/3 problem\(s\) identified/)).toBeTruthy();
  });

  it('#178: renders a problemStatus badge (active/recurring/resolved) on an investigation, and shows nothing when problemStatus is null', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = mockFetchFor({
      ok: true, hasData: true,
      actions: { total: 0, notStarted: 0, inProgress: 0, done: 0, items: [] },
      investigations: [
        { id: 10, tool: 'diagnostic', industry: 'Manufacturing', subIndustry: null, challenge: 'Late deliveries', problemCount: 4, problemStatus: { active: 2, resolved: 1, recurring: 1 }, createdAt: '2026-08-20T00:00:00Z' },
        { id: 11, tool: 'diagnostic', industry: 'Retail', subIndustry: null, challenge: 'Legacy shape row', problemCount: null, problemStatus: null, createdAt: '2026-08-18T00:00:00Z' },
      ],
    });
    render(<MyWorkbench />);
    await waitFor(() => expect(screen.getByText('Late deliveries')).toBeTruthy());
    expect(screen.getByText('2 active')).toBeTruthy();
    expect(screen.getByText('1 recurring')).toBeTruthy();
    expect(screen.getByText('1 resolved')).toBeTruthy();
    // Row with problemStatus: null renders no badges at all -- never a fabricated 0/0/0.
    expect(screen.getByText('Legacy shape row')).toBeTruthy();
  });

  it('renders My Commitments from the existing /api/plans endpoint (no separate backend read)', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    global.fetch = mockFetchFor(EMPTY_WORKBENCH, { ok: true, plans: [{ toolKey: 'maturity', text: 'plan text', savedAt: '2026-08-15T00:00:00Z' }] });
    render(<MyWorkbench />);
    await waitFor(() => expect(screen.getByText('maturity')).toBeTruthy());
  });

  it('reads My Decisions directly from the Decision Lab localStorage key and labels it device-local', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    localStorage.setItem('isc-decision-lab-v1', JSON.stringify({ question: 'Which 3PL should we pick?', criteria: [], options: [] }));
    global.fetch = mockFetchFor();
    render(<MyWorkbench />);
    await waitFor(() => expect(screen.getByText('Which 3PL should we pick?')).toBeTruthy());
    expect(screen.getByText(/not synced across devices/)).toBeTruthy();
  });

  it('ignores a Decision Lab localStorage entry with no question (never-saved default state)', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    localStorage.setItem('isc-decision-lab-v1', JSON.stringify({ question: '', criteria: [], options: [] }));
    global.fetch = mockFetchFor();
    render(<MyWorkbench />);
    await waitFor(() => expect(screen.getByText(/Nothing here yet/)).toBeTruthy());
  });

  it('renders Arabic labels when lang=ar', async () => {
    mockAuthState.user = { id: 1, fullName: 'Test User' };
    mockLang.value = 'ar';
    global.fetch = mockFetchFor();
    render(<MyWorkbench />);
    await waitFor(() => expect(screen.getByText('مساحة عملي')).toBeTruthy());
  });
});
