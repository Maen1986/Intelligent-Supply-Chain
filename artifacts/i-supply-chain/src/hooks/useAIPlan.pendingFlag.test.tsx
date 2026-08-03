/**
 * useAIPlan — pending-flag auto-generate tests (Task 232)
 *
 * Covers the sessionStorage-based pending-plan flag that was added so the AI
 * plan auto-generates once the user lands back on the tool page after signing
 * in (rather than requiring a second click).
 *
 * Four behaviours under test:
 *   1. isAuthenticated transitions false→true WITH pendingAIPlan_<toolKey> set
 *      → generate() fires automatically (fetch POST /ai/plan is called)
 *   2. isAuthenticated transitions false→true WITHOUT the flag
 *      → the pending-flag path does NOT trigger (sessionStorage.removeItem is
 *        never called for that key, and no extra generate fires when other
 *        auto-generate conditions are suppressed via canGenerate=false)
 *   3. The flag is removed from sessionStorage after it is consumed, so it
 *      cannot retrigger on the next render cycle
 *   4. Flag present + server already has a saved plan → generate() is NOT
 *      auto-called (existing plan is preserved, not overwritten)
 */
import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import { useAIPlan } from './useAIPlan';

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));

/* ── Auth mock — value is mutated per-test ──────────────────────────────── */
const mockAuth = { isAuthenticated: false };
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: mockAuth.isAuthenticated }),
}));

/* ── Constants ─────────────────────────────────────────────────────────── */
const TOOL_KEY  = 'supplier';
const FLAG_KEY  = `pendingAIPlan_${TOOL_KEY}`;
const PLAN_TEXT = '## Supplier Plan\n- Reduce lead time [HIGH]';

/* ── Fetch stub — returns a successful AI plan, no saved-plan side effects ─ */
function stubSuccessfulGenerate(text = PLAN_TEXT) {
  return vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
    const method = opts?.method ?? 'GET';
    if (method === 'POST' && url.includes('/ai/plan')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, text }),
      });
    }
    // GET /plans/:toolKey — no saved plan so we don't confuse the savedPlan effect
    if (method === 'GET' && url.includes('/plans/')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ ok: true, plan: null }),
      });
    }
    // POST /plans/:toolKey — save the plan
    if (method === 'POST' && url.includes('/plans/')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ ok: true, savedAt: new Date().toISOString() }),
      });
    }
    return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
  });
}

beforeEach(() => {
  mockAuth.isAuthenticated = false;
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  sessionStorage.clear();
});

/* ══════════════════════════════════════════════════════════════════════════
   1. Flag present → generate() fires on auth transition
══════════════════════════════════════════════════════════════════════════ */
describe('useAIPlan pendingFlag — flag present: generate() fires on auth false→true', () => {
  it('calls generate() automatically when auth transitions false→true with the flag set', async () => {
    const fetchMock = stubSuccessfulGenerate();
    vi.stubGlobal('fetch', fetchMock);

    // Set the flag BEFORE the hook mounts (simulates returning from login page)
    sessionStorage.setItem(FLAG_KEY, '1');

    const { rerender } = renderHook(
      ({ authed }: { authed: boolean }) => {
        mockAuth.isAuthenticated = authed;
        return useAIPlan(() => 'my prompt', false, TOOL_KEY);
      },
      { initialProps: { authed: false } },
    );

    // Confirm no generate fired while unauthenticated
    await act(async () => { await new Promise(r => setTimeout(r, 10)); });
    const preTransitionCalls = (fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
      ([url, opts]) => url.includes('/ai/plan') && opts?.method === 'POST',
    );
    expect(preTransitionCalls).toHaveLength(0);

    // Simulate login
    await act(async () => { rerender({ authed: true }); });

    // generate() should have fired — POST /ai/plan must appear
    await waitFor(() => {
      const aiPlanCalls = (fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
        ([url, opts]) => url.includes('/ai/plan') && opts?.method === 'POST',
      );
      expect(aiPlanCalls.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('the resulting AI plan text is populated in `result` after the auto-generate', async () => {
    vi.stubGlobal('fetch', stubSuccessfulGenerate(PLAN_TEXT));
    sessionStorage.setItem(FLAG_KEY, '1');

    const { result, rerender } = renderHook(
      ({ authed }: { authed: boolean }) => {
        mockAuth.isAuthenticated = authed;
        return useAIPlan(() => 'my prompt', false, TOOL_KEY);
      },
      { initialProps: { authed: false } },
    );

    await act(async () => { rerender({ authed: true }); });

    await waitFor(() => {
      expect(result.current.result).toBe(PLAN_TEXT);
    });
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   2. Flag absent → pending-flag path does NOT trigger
══════════════════════════════════════════════════════════════════════════ */
describe('useAIPlan pendingFlag — flag absent: pending-flag path does not trigger', () => {
  it('does NOT call sessionStorage.removeItem for the flag key when no flag is set', async () => {
    const removeSpy = vi.spyOn(Storage.prototype, 'removeItem');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, plan: null }),
    }));

    // canGenerate=false suppresses all auto-generate effects so we can isolate
    // the pending-flag path specifically
    const { rerender } = renderHook(
      ({ authed }: { authed: boolean }) => {
        mockAuth.isAuthenticated = authed;
        return useAIPlan(() => 'prompt', false, TOOL_KEY, false);
      },
      { initialProps: { authed: false } },
    );

    await act(async () => { rerender({ authed: true }); });
    await act(async () => { await new Promise(r => setTimeout(r, 20)); });

    // removeItem should NOT have been called with the flag key — nothing to consume
    const flagRemovals = removeSpy.mock.calls.filter(([key]) => key === FLAG_KEY);
    expect(flagRemovals).toHaveLength(0);
  });

  it('does NOT fire POST /ai/plan when auth transitions but flag is absent and canGenerate=false', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, plan: null }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { rerender } = renderHook(
      ({ authed }: { authed: boolean }) => {
        mockAuth.isAuthenticated = authed;
        return useAIPlan(() => 'prompt', false, TOOL_KEY, false /* canGenerate=false */);
      },
      { initialProps: { authed: false } },
    );

    await act(async () => { rerender({ authed: true }); });
    await act(async () => { await new Promise(r => setTimeout(r, 20)); });

    const aiPlanCalls = fetchMock.mock.calls.filter(
      ([url, opts]) => url.includes('/ai/plan') && opts?.method === 'POST',
    );
    expect(aiPlanCalls).toHaveLength(0);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   3. Flag is consumed — removed from sessionStorage after auto-generate
══════════════════════════════════════════════════════════════════════════ */
describe('useAIPlan pendingFlag — flag is consumed after auto-generate', () => {
  it('removes the flag from sessionStorage after consuming it on auth transition', async () => {
    vi.stubGlobal('fetch', stubSuccessfulGenerate());
    sessionStorage.setItem(FLAG_KEY, '1');

    const { rerender } = renderHook(
      ({ authed }: { authed: boolean }) => {
        mockAuth.isAuthenticated = authed;
        return useAIPlan(() => 'my prompt', false, TOOL_KEY);
      },
      { initialProps: { authed: false } },
    );

    await act(async () => { rerender({ authed: true }); });

    // Wait for the generate() call to be triggered (flag must be consumed first)
    await waitFor(() => {
      const aiCalls = (fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
        ([url, opts]) => url.includes('/ai/plan') && opts?.method === 'POST',
      );
      expect(aiCalls.length).toBeGreaterThanOrEqual(1);
    });

    // Flag must be gone from sessionStorage
    expect(sessionStorage.getItem(FLAG_KEY)).toBeNull();
  });

  it('does NOT retrigger generate() on a subsequent re-render once the flag has been consumed', async () => {
    const fetchMock = stubSuccessfulGenerate();
    vi.stubGlobal('fetch', fetchMock);
    sessionStorage.setItem(FLAG_KEY, '1');

    const { result, rerender } = renderHook(
      ({ authed }: { authed: boolean }) => {
        mockAuth.isAuthenticated = authed;
        return useAIPlan(() => 'my prompt', false, TOOL_KEY);
      },
      { initialProps: { authed: false } },
    );

    // Trigger login → flag consumed, generate fires once
    await act(async () => { rerender({ authed: true }); });
    await waitFor(() => expect(result.current.result).toBe(PLAN_TEXT));

    const callsAfterFirstGenerate = fetchMock.mock.calls.filter(
      ([url, opts]) => url.includes('/ai/plan') && opts?.method === 'POST',
    ).length;

    // Force a re-render (same auth state, flag already gone)
    await act(async () => { rerender({ authed: true }); });
    await act(async () => { await new Promise(r => setTimeout(r, 20)); });

    const callsAfterRerender = fetchMock.mock.calls.filter(
      ([url, opts]) => url.includes('/ai/plan') && opts?.method === 'POST',
    ).length;

    // No additional generate call triggered
    expect(callsAfterRerender).toBe(callsAfterFirstGenerate);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   4. Flag present + savedPlan exists → generate() is NOT auto-called
      (existing plan must not be overwritten)
══════════════════════════════════════════════════════════════════════════ */
describe('useAIPlan pendingFlag — flag present but savedPlan exists: generate() is suppressed', () => {
  const SAVED_PLAN_TEXT = '## Existing Plan\n- Already generated [HIGH]';
  const SAVED_AT = '2026-07-01T10:00:00.000Z';

  /** Fetch stub that returns an existing saved plan from the server. */
  function stubWithExistingPlan() {
    return vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
      const method = opts?.method ?? 'GET';
      // GET /plans/:toolKey — return an existing saved plan
      if (method === 'GET' && url.includes('/plans/')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ok: true, plan: { text: SAVED_PLAN_TEXT, savedAt: SAVED_AT } }),
        });
      }
      // Any other request — should NOT happen in this scenario
      return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
    });
  }

  it('does NOT call POST /ai/plan when the pending flag is set but a saved plan already exists', async () => {
    const fetchMock = stubWithExistingPlan();
    vi.stubGlobal('fetch', fetchMock);

    // Set the pending flag — as if the user clicked "Sign in to generate"
    sessionStorage.setItem(FLAG_KEY, '1');

    const { rerender } = renderHook(
      ({ authed }: { authed: boolean }) => {
        mockAuth.isAuthenticated = authed;
        return useAIPlan(() => 'my prompt', false, TOOL_KEY);
      },
      { initialProps: { authed: false } },
    );

    // Simulate login
    await act(async () => { rerender({ authed: true }); });

    // Allow time for Effect B (flag consumption) and Effect C (saved-plan fetch) to settle
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });

    // generate() must NOT have fired — no POST /ai/plan
    const aiPlanCalls = fetchMock.mock.calls.filter(
      ([url, opts]) => url.includes('/ai/plan') && (opts?.method ?? 'GET') === 'POST',
    );
    expect(aiPlanCalls).toHaveLength(0);
  });

  it('leaves the existing savedPlan intact when the flag is present but a plan is already saved', async () => {
    const fetchMock = stubWithExistingPlan();
    vi.stubGlobal('fetch', fetchMock);

    sessionStorage.setItem(FLAG_KEY, '1');

    const { result, rerender } = renderHook(
      ({ authed }: { authed: boolean }) => {
        mockAuth.isAuthenticated = authed;
        return useAIPlan(() => 'my prompt', false, TOOL_KEY);
      },
      { initialProps: { authed: false } },
    );

    await act(async () => { rerender({ authed: true }); });

    // Wait for the saved-plan fetch to complete and populate savedPlan
    await waitFor(() => {
      expect(result.current.savedPlan).not.toBeNull();
    });

    // The saved plan from the server must be intact
    expect(result.current.savedPlan?.text).toBe(SAVED_PLAN_TEXT);
    expect(result.current.savedPlan?.savedAt).toBe(SAVED_AT);

    // No in-session result should have been set (generate() never ran)
    expect(result.current.result).toBeNull();
  });

  it('still removes the flag from sessionStorage even when generate() is suppressed', async () => {
    const fetchMock = stubWithExistingPlan();
    vi.stubGlobal('fetch', fetchMock);

    sessionStorage.setItem(FLAG_KEY, '1');

    const { rerender } = renderHook(
      ({ authed }: { authed: boolean }) => {
        mockAuth.isAuthenticated = authed;
        return useAIPlan(() => 'my prompt', false, TOOL_KEY);
      },
      { initialProps: { authed: false } },
    );

    await act(async () => { rerender({ authed: true }); });
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });

    // Flag must be cleared regardless of whether generate() was called
    expect(sessionStorage.getItem(FLAG_KEY)).toBeNull();
  });
});
