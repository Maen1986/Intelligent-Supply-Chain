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
function stubAllFetches({ hasSavedPlan = false }: { hasSavedPlan?: boolean } = {}) {
  const savedPlan = hasSavedPlan
    ? { text: PLAN_TEXT, savedAt: '2026-07-01T00:00:00.000Z' }
    : null;

  return vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
    const method = opts?.method ?? 'GET';

    // GET /plans/:toolKey — optionally return a saved plan
    if (method === 'GET' && url.includes(`/plans/${TOOL_KEY}`)) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ ok: true, plan: savedPlan }),
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
   Saved-plan guard — pending flag must be a no-op when a plan already exists
   on the server, even when the flag is consumed during a real login transition.

   The risk: Effect B fires on false→true and removes the flag; Effect C then
   fetches the saved plan. Without the guard, generate() would be called before
   the GET resolves — overwriting the existing plan. The fix: Effect B sets a
   deferred-generate ref; Effect C calls generate() only when GET returns null.

   Expected: POST /api/ai/plan is NEVER called; the existing plan is preserved.
══════════════════════════════════════════════════════════════════════════ */
describe('useAIPlan pending-flag — saved plan guard', () => {
  it('does NOT call generate() when the server has a saved plan and the user logs in with a pending flag', async () => {
    // Arrange: pending flag is set (simulating "Sign in to generate" redirect)
    sessionStorage.setItem(`pendingAIPlan_${TOOL_KEY}`, '1');

    // GET /plans/:toolKey returns an existing saved plan
    const fetchMock = stubAllFetches({ hasSavedPlan: true });
    vi.stubGlobal('fetch', fetchMock);

    const { result, rerender } = renderHook(
      ({ authed }: { authed: boolean }) => {
        mockIsAuthenticated.value = authed;
        return useAIPlan(() => 'build me a KPI plan', false, TOOL_KEY);
      },
      { initialProps: { authed: false } },
    );

    // Transition: unauthenticated → authenticated (real login event)
    await act(async () => { rerender({ authed: true }); });

    // Wait for the saved-plan GET to complete (savedPlan becomes populated)
    await waitFor(() => expect(result.current.savedPlan).not.toBeNull(), { timeout: 500 });

    // Assert: POST /api/ai/plan was NEVER called — existing plan was preserved
    expect(countAIPlanCalls(fetchMock)).toBe(0);
  });

  it('preserves the server-side plan text and leaves result null after login with a pending flag', async () => {
    sessionStorage.setItem(`pendingAIPlan_${TOOL_KEY}`, '1');

    const fetchMock = stubAllFetches({ hasSavedPlan: true });
    vi.stubGlobal('fetch', fetchMock);

    const { result, rerender } = renderHook(
      ({ authed }: { authed: boolean }) => {
        mockIsAuthenticated.value = authed;
        return useAIPlan(() => 'build me a KPI plan', false, TOOL_KEY);
      },
      { initialProps: { authed: false } },
    );

    await act(async () => { rerender({ authed: true }); });

    // Wait for savedPlan to load
    await waitFor(() => expect(result.current.savedPlan).not.toBeNull(), { timeout: 500 });

    // The saved plan from the server must be intact, no new result generated
    expect(result.current.savedPlan?.text).toBe(PLAN_TEXT);
    expect(result.current.result).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('still removes the pending flag from sessionStorage even when generate() is skipped', async () => {
    sessionStorage.setItem(`pendingAIPlan_${TOOL_KEY}`, '1');

    const fetchMock = stubAllFetches({ hasSavedPlan: true });
    vi.stubGlobal('fetch', fetchMock);

    const { result, rerender } = renderHook(
      ({ authed }: { authed: boolean }) => {
        mockIsAuthenticated.value = authed;
        return useAIPlan(() => 'prompt', false, TOOL_KEY);
      },
      { initialProps: { authed: false } },
    );

    await act(async () => { rerender({ authed: true }); });

    // Wait for savedPlan load to confirm the full cycle completed
    await waitFor(() => expect(result.current.savedPlan).not.toBeNull(), { timeout: 500 });

    // Flag must be cleaned up regardless — prevents stale flags from accumulating
    expect(sessionStorage.getItem(`pendingAIPlan_${TOOL_KEY}`)).toBeNull();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   savedPlan fetch resolves after login — no second POST /api/ai/plan
   The risk: savedPlan is in Effect A's dependency array (line 85 of the hook).
   When the saved-plan GET (or the save after generate) resolves and sets
   savedPlan, Effect A re-evaluates. The prevAuthenticated ref must already
   be true at that point so !wasAuthenticated is false and generate() is
   NOT called a second time.
══════════════════════════════════════════════════════════════════════════ */
describe('useAIPlan — savedPlan fetch resolves after login', () => {
  it('does NOT fire a second POST /api/ai/plan when savedPlan is populated after the auth transition', async () => {
    // No pending flag, no existing plan on server — Effect A will fire generate()
    const fetchMock = stubAllFetches({ hasSavedPlan: false });
    vi.stubGlobal('fetch', fetchMock);

    const { result, rerender } = renderHook(
      ({ authed }: { authed: boolean }) => {
        mockIsAuthenticated.value = authed;
        return useAIPlan(() => 'build me a KPI plan', false, TOOL_KEY);
      },
      { initialProps: { authed: false } },
    );

    // Transition: unauthenticated → authenticated
    await act(async () => { rerender({ authed: true }); });

    // Wait for generate to complete AND savedPlan to become non-null.
    // generate() calls setSavedPlan once the POST /plans/:toolKey save succeeds,
    // which re-evaluates Effect A (savedPlan is in its dep array).
    await waitFor(() => expect(result.current.savedPlan).not.toBeNull(), { timeout: 1000 });

    // The prevAuthenticated ref is already true at this point, so the
    // !wasAuthenticated guard in Effect A prevents a second generate() call.
    expect(countAIPlanCalls(fetchMock)).toBe(1);
  });

  it('also fires exactly once when the load-saved-plan GET resolves after generate() already ran', async () => {
    // Simulate a race: the hook's load-effect (Effect C) fetches GET /plans/:toolKey.
    // Effect A's generate() may complete first, then savedPlan is set by the GET result.
    // Either way, only one POST /api/ai/plan should ever fire.
    const fetchMock = stubAllFetches({ hasSavedPlan: false });
    vi.stubGlobal('fetch', fetchMock);

    const { result, rerender } = renderHook(
      ({ authed }: { authed: boolean }) => {
        mockIsAuthenticated.value = authed;
        return useAIPlan(() => 'build me a KPI plan', false, TOOL_KEY);
      },
      { initialProps: { authed: false } },
    );

    await act(async () => { rerender({ authed: true }); });

    // Wait until the hook is fully settled (no loading, result present)
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 1000 });
    await waitFor(() => expect(result.current.result).not.toBeNull(), { timeout: 1000 });

    // Give any trailing Effect A re-runs a chance to fire a spurious second call
    await act(async () => { await new Promise(r => setTimeout(r, 80)); });

    expect(countAIPlanCalls(fetchMock)).toBe(1);
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

  /* ── Unmount / remount while already authenticated ────────────────────
     When the component unmounts and remounts while isAuthenticated is already
     true, both prevAuthenticated and prevAuthRef refs are re-initialised to
     true (their initial value is the current isAuthenticated at mount time).
     Therefore the false→true transition is never seen by either effect on the
     second mount, and auto-generate must NOT fire a second time.
  ──────────────────────────────────────────────────────────────────────── */
  it('does NOT auto-generate again when the hook is unmounted and remounted while already authenticated', async () => {
    // sessionStorage is clear (see beforeEach)
    const fetchMock = stubAllFetches();
    vi.stubGlobal('fetch', fetchMock);

    // First mount: unauthenticated
    const { rerender, unmount } = renderHook(
      ({ authed }: { authed: boolean }) => {
        mockIsAuthenticated.value = authed;
        return useAIPlan(() => 'build me a KPI plan', false, TOOL_KEY);
      },
      { initialProps: { authed: false } },
    );

    // Transition false → true: auto-generate fires exactly once
    await act(async () => { rerender({ authed: true }); });
    await waitFor(() => expect(countAIPlanCalls(fetchMock)).toBe(1), { timeout: 500 });

    // Unmount the hook while still authenticated
    act(() => { unmount(); });

    // Reset the fetch spy counter so we can cleanly count calls from the second mount
    fetchMock.mockClear();

    // Remount a fresh hook instance with isAuthenticated already true.
    // Both prevAuthenticated and prevAuthRef initialise to true, so neither
    // effect sees a false→true transition — auto-generate must NOT fire.
    const { rerender: rerender2 } = renderHook(
      ({ authed }: { authed: boolean }) => {
        mockIsAuthenticated.value = authed;
        return useAIPlan(() => 'build me a KPI plan', false, TOOL_KEY);
      },
      { initialProps: { authed: true } },
    );
    void rerender2; // used only to keep the hook alive

    // Allow any pending microtasks / effects to flush
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    // No new generate() call should have been made after remount
    expect(countAIPlanCalls(fetchMock)).toBe(0);
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
