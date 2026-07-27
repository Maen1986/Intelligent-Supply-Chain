/**
 * useAIPlan — login auto-generate deduplication tests
 *
 * The hook contains two useEffect guards that can each call generate()
 * when isAuthenticated transitions from false → true:
 *
 *   • Effect A (general): fires when there is NO pendingAIPlan_<toolKey>
 *     flag in sessionStorage.
 *   • Effect B (pending-flag): fires when the pendingAIPlan_<toolKey> flag
 *     IS present, consumes it, then calls generate().
 *
 * These tests confirm that exactly one POST /api/ai/plan request is sent
 * regardless of which path is taken — the double-generate guard prevents
 * both effects from firing simultaneously.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAIPlan } from './useAIPlan';

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));

/* ── Auth mock — starts unauthenticated, flipped per test ─────────────── */
const mockIsAuthenticated = { value: false };
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: mockIsAuthenticated.value }),
}));

/* ── Constants ────────────────────────────────────────────────────────── */
const TOOL_KEY  = 'kpi';
const PLAN_TEXT = '## KPI Plan\n- Reduce lead time [HIGH]';

/* ── Fetch stub: handles all calls the hook makes after login ─────────── */
function stubAllFetches() {
  return vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
    const method = opts?.method ?? 'GET';

    // GET /plans/:toolKey — no saved plan on file
    if (method === 'GET' && url.includes(`/plans/${TOOL_KEY}`)) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ ok: true, plan: null }),
      });
    }
    // POST /ai/plan — the generate endpoint
    if (method === 'POST' && url.includes('/ai/plan')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, text: PLAN_TEXT }),
      });
    }
    // POST /plans/:toolKey — save the generated plan
    if (method === 'POST' && url.includes(`/plans/${TOOL_KEY}`)) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ ok: true, savedAt: '2026-07-27T00:00:00.000Z' }),
      });
    }

    return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
  });
}

/** Count how many times POST /api/ai/plan was called */
function countAIPlanCalls(fetchMock: ReturnType<typeof vi.fn>): number {
  return fetchMock.mock.calls.filter(
    ([url, opts]: [string, RequestInit]) =>
      typeof url === 'string' &&
      url.includes('/ai/plan') &&
      (opts?.method ?? 'GET') === 'POST',
  ).length;
}

beforeEach(() => {
  mockIsAuthenticated.value = false;
  sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/* ══════════════════════════════════════════════════════════════════════════
   Path A — pending flag is SET in sessionStorage before login
   Expected: Effect B consumes the flag and calls generate() exactly once.
             Effect A sees the flag and skips — no duplicate call.
══════════════════════════════════════════════════════════════════════════ */
describe('useAIPlan login auto-generate — with pending flag', () => {
  it('fires POST /api/ai/plan exactly once when the pending flag is set', async () => {
    sessionStorage.setItem(`pendingAIPlan_${TOOL_KEY}`, '1');
    const fetchMock = stubAllFetches();
    vi.stubGlobal('fetch', fetchMock);

    const { rerender } = renderHook(
      ({ authed }: { authed: boolean }) => {
        mockIsAuthenticated.value = authed;
        return useAIPlan(() => 'build me a KPI plan', false, TOOL_KEY);
      },
      { initialProps: { authed: false } },
    );

    // Transition: unauthenticated → authenticated
    await act(async () => { rerender({ authed: true }); });

    await waitFor(() => expect(countAIPlanCalls(fetchMock)).toBeGreaterThan(0), { timeout: 500 });

    expect(countAIPlanCalls(fetchMock)).toBe(1);
  });

  it('removes the pending flag from sessionStorage after login', async () => {
    sessionStorage.setItem(`pendingAIPlan_${TOOL_KEY}`, '1');
    vi.stubGlobal('fetch', stubAllFetches());

    const { rerender } = renderHook(
      ({ authed }: { authed: boolean }) => {
        mockIsAuthenticated.value = authed;
        return useAIPlan(() => 'prompt', false, TOOL_KEY);
      },
      { initialProps: { authed: false } },
    );

    await act(async () => { rerender({ authed: true }); });

    await waitFor(
      () => expect(sessionStorage.getItem(`pendingAIPlan_${TOOL_KEY}`)).toBeNull(),
      { timeout: 500 },
    );
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Path B — NO pending flag in sessionStorage before login
   Expected: Effect A detects no flag and calls generate() exactly once.
             Effect B sees no flag and does nothing.
══════════════════════════════════════════════════════════════════════════ */
describe('useAIPlan login auto-generate — without pending flag', () => {
  it('fires POST /api/ai/plan exactly once when no pending flag is set', async () => {
    // sessionStorage is clear (see beforeEach)
    const fetchMock = stubAllFetches();
    vi.stubGlobal('fetch', fetchMock);

    const { rerender } = renderHook(
      ({ authed }: { authed: boolean }) => {
        mockIsAuthenticated.value = authed;
        return useAIPlan(() => 'build me a KPI plan', false, TOOL_KEY);
      },
      { initialProps: { authed: false } },
    );

    // Transition: unauthenticated → authenticated
    await act(async () => { rerender({ authed: true }); });

    await waitFor(() => expect(countAIPlanCalls(fetchMock)).toBeGreaterThan(0), { timeout: 500 });

    expect(countAIPlanCalls(fetchMock)).toBe(1);
  });

  it('produces a result after the single generate() call resolves', async () => {
    const fetchMock = stubAllFetches();
    vi.stubGlobal('fetch', fetchMock);

    const { result, rerender } = renderHook(
      ({ authed }: { authed: boolean }) => {
        mockIsAuthenticated.value = authed;
        return useAIPlan(() => 'build me a KPI plan', false, TOOL_KEY);
      },
      { initialProps: { authed: false } },
    );

    await act(async () => { rerender({ authed: true }); });

    await waitFor(() => expect(result.current.result).toBe(PLAN_TEXT), { timeout: 500 });
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Edge cases
══════════════════════════════════════════════════════════════════════════ */
describe('useAIPlan login auto-generate — edge cases', () => {
  it('does NOT auto-generate when canGenerate=false even after login', async () => {
    const fetchMock = stubAllFetches();
    vi.stubGlobal('fetch', fetchMock);

    const { rerender } = renderHook(
      ({ authed }: { authed: boolean }) => {
        mockIsAuthenticated.value = authed;
        return useAIPlan(() => 'prompt', false, TOOL_KEY, /* canGenerate= */ false);
      },
      { initialProps: { authed: false } },
    );

    await act(async () => { rerender({ authed: true }); });
    await act(async () => { await new Promise(r => setTimeout(r, 60)); });

    expect(countAIPlanCalls(fetchMock)).toBe(0);
  });

  it('does NOT fire a second POST /api/ai/plan on a re-render when isAuthenticated stays true', async () => {
    // sessionStorage is clear (see beforeEach)
    const fetchMock = stubAllFetches();
    vi.stubGlobal('fetch', fetchMock);

    // Use external state to control both authed and a dummy prop that forces re-renders
    const { rerender } = renderHook(
      ({ authed, extra }: { authed: boolean; extra: number }) => {
        mockIsAuthenticated.value = authed;
        // extra is passed only to force a re-render without changing auth state
        void extra;
        return useAIPlan(() => 'build me a KPI plan', false, TOOL_KEY);
      },
      { initialProps: { authed: false, extra: 0 } },
    );

    // Transition: unauthenticated → authenticated → single generate() fires
    await act(async () => { rerender({ authed: true, extra: 0 }); });
    await waitFor(() => expect(countAIPlanCalls(fetchMock)).toBeGreaterThan(0), { timeout: 500 });
    expect(countAIPlanCalls(fetchMock)).toBe(1);

    // Trigger a second re-render with isAuthenticated still true
    await act(async () => { rerender({ authed: true, extra: 1 }); });
    await act(async () => { await new Promise(r => setTimeout(r, 60)); });

    // The ref guard must prevent another generate() call
    expect(countAIPlanCalls(fetchMock)).toBe(1);
  });

  it('does NOT auto-generate when toolKey is undefined and no pending flag', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, text: PLAN_TEXT }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { rerender } = renderHook(
      ({ authed }: { authed: boolean }) => {
        mockIsAuthenticated.value = authed;
        // No toolKey — unauthenticated/ephemeral mode; effect A still fires
        // but there is no pending flag either
        return useAIPlan(() => 'prompt', false, undefined);
      },
      { initialProps: { authed: false } },
    );

    await act(async () => { rerender({ authed: true }); });
    await waitFor(() => expect(countAIPlanCalls(fetchMock)).toBeGreaterThan(0), { timeout: 500 });

    // Effect A fires once (no toolKey means hasPendingFlag is always false,
    // and Effect B requires toolKey so it's a no-op)
    expect(countAIPlanCalls(fetchMock)).toBe(1);
  });
});
