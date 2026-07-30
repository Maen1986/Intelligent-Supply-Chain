/**
 * useAIPlan — sign-out sessionStorage cleanup tests (Task 765)
 *
 * Confirms that the pendingAIPlan_<toolKey> sessionStorage key is removed
 * when the user signs out so that the flag cannot leak to the next user
 * who signs in on the same tab.
 *
 * Scenarios covered:
 *   1. Sign-out while the pending flag is present → flag is removed.
 *   2. Sign-out while the pending flag is absent → no error, still absent.
 *   3. User B signing in on the same tab after User A signed out does NOT
 *      pick up a stale pending flag and does NOT auto-generate a plan.
 *   4. toolKey=undefined on sign-out → no crash, sessionStorage untouched.
 */
import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAIPlan } from './useAIPlan';

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));

/* ── Auth mock — value is mutated per-test ──────────────────────────────── */
const mockAuth = { isAuthenticated: false };
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: mockAuth.isAuthenticated }),
}));

/* ── Constants ─────────────────────────────────────────────────────────── */
const TOOL_KEY = 'risk';
const FLAG_KEY = `pendingAIPlan_${TOOL_KEY}`;

/* ── Minimal fetch stub: GET /plans → no saved plan, ignores everything else ── */
function stubNoSavedPlan() {
  return vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
    const method = opts?.method ?? 'GET';
    if (method === 'GET' && url.includes('/plans/')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ ok: true, plan: null }),
      });
    }
    if (method === 'POST' && url.includes('/ai/plan')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ ok: true, text: 'Generated plan' }),
      });
    }
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
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  sessionStorage.clear();
});

/* ══════════════════════════════════════════════════════════════════════════
   1. Sign-out while pending flag is present → flag is removed
══════════════════════════════════════════════════════════════════════════ */
describe('useAIPlan sign-out — flag present on sign-out is removed', () => {
  it('removes pendingAIPlan_<toolKey> from sessionStorage when isAuthenticated transitions true→false', async () => {
    vi.stubGlobal('fetch', stubNoSavedPlan());

    // Mount with the user already authenticated
    mockAuth.isAuthenticated = true;
    const { rerender } = renderHook(
      ({ authed }: { authed: boolean }) => {
        mockAuth.isAuthenticated = authed;
        return useAIPlan(() => 'prompt', false, TOOL_KEY);
      },
      { initialProps: { authed: true } },
    );

    // Allow mount effects to settle
    await act(async () => { await new Promise(r => setTimeout(r, 20)); });

    // Plant the pending flag while authenticated (simulates an edge case where
    // the flag was set in a different tab or via direct sessionStorage write)
    sessionStorage.setItem(FLAG_KEY, '1');
    expect(sessionStorage.getItem(FLAG_KEY)).toBe('1');

    // Sign out
    await act(async () => { rerender({ authed: false }); });
    await act(async () => { await new Promise(r => setTimeout(r, 20)); });

    // Flag must be gone
    expect(sessionStorage.getItem(FLAG_KEY)).toBeNull();
  });

  it('calls sessionStorage.removeItem with the flag key on sign-out', async () => {
    vi.stubGlobal('fetch', stubNoSavedPlan());
    const removeSpy = vi.spyOn(Storage.prototype, 'removeItem');

    mockAuth.isAuthenticated = true;
    const { rerender } = renderHook(
      ({ authed }: { authed: boolean }) => {
        mockAuth.isAuthenticated = authed;
        return useAIPlan(() => 'prompt', false, TOOL_KEY);
      },
      { initialProps: { authed: true } },
    );

    await act(async () => { await new Promise(r => setTimeout(r, 20)); });
    sessionStorage.setItem(FLAG_KEY, '1');
    removeSpy.mockClear(); // ignore any removeItem calls from mount/settle

    // Sign out
    await act(async () => { rerender({ authed: false }); });
    await act(async () => { await new Promise(r => setTimeout(r, 10)); });

    const flagRemovals = removeSpy.mock.calls.filter(([key]) => key === FLAG_KEY);
    expect(flagRemovals.length).toBeGreaterThanOrEqual(1);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   2. Sign-out while flag is absent → no crash, key stays absent
══════════════════════════════════════════════════════════════════════════ */
describe('useAIPlan sign-out — flag absent on sign-out: no crash', () => {
  it('does not throw and sessionStorage key remains absent after sign-out with no flag set', async () => {
    vi.stubGlobal('fetch', stubNoSavedPlan());

    mockAuth.isAuthenticated = true;
    const { rerender } = renderHook(
      ({ authed }: { authed: boolean }) => {
        mockAuth.isAuthenticated = authed;
        return useAIPlan(() => 'prompt', false, TOOL_KEY);
      },
      { initialProps: { authed: true } },
    );

    await act(async () => { await new Promise(r => setTimeout(r, 20)); });

    // No flag is set at this point
    expect(sessionStorage.getItem(FLAG_KEY)).toBeNull();

    // Sign out — must not throw
    await expect(
      act(async () => { rerender({ authed: false }); }),
    ).resolves.not.toThrow();

    expect(sessionStorage.getItem(FLAG_KEY)).toBeNull();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   3. User B does NOT pick up User A's stale pending flag after sign-out
══════════════════════════════════════════════════════════════════════════ */
describe('useAIPlan sign-out — cross-user isolation', () => {
  it('User B signing in does not trigger an auto-generate from User A\'s stale flag', async () => {
    const fetchMock = stubNoSavedPlan();
    vi.stubGlobal('fetch', fetchMock);

    // ── User A session ──────────────────────────────────────────────────
    // Mount as User A (authenticated). Manually plant a pending flag (simulates
    // the flag surviving from before User A fully consumed it — an edge case
    // this fix specifically guards against).
    mockAuth.isAuthenticated = true;
    const { rerender } = renderHook(
      ({ authed }: { authed: boolean }) => {
        mockAuth.isAuthenticated = authed;
        // canGenerate=false: suppresses the Effect A auto-generate path so we can
        // isolate the pending-flag path for User B specifically.
        return useAIPlan(() => 'User A prompt', false, TOOL_KEY, false);
      },
      { initialProps: { authed: true } },
    );
    await act(async () => { await new Promise(r => setTimeout(r, 20)); });

    sessionStorage.setItem(FLAG_KEY, '1');

    // User A signs out → hook must wipe the flag
    await act(async () => { rerender({ authed: false }); });
    await act(async () => { await new Promise(r => setTimeout(r, 20)); });

    expect(sessionStorage.getItem(FLAG_KEY)).toBeNull();

    // ── User B session ──────────────────────────────────────────────────
    // Reset call count so we can measure only User B's generate() activity
    fetchMock.mockClear();

    // User B signs in on the same tab — there must be no pending flag in
    // sessionStorage, so the pending-flag path (Effect B) must NOT trigger
    // a generate() call for User B.
    await act(async () => { rerender({ authed: true }); });
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });

    // Assert 1: flag is gone — User B cannot see a stale key
    expect(sessionStorage.getItem(FLAG_KEY)).toBeNull();

    // Assert 2: no POST /ai/plan was triggered by the stale flag path
    const aiPlanCallsForUserB = fetchMock.mock.calls.filter(
      ([url, opts]: [string, RequestInit | undefined]) =>
        url.includes('/ai/plan') && (opts?.method ?? 'GET') === 'POST',
    );
    expect(aiPlanCallsForUserB).toHaveLength(0);
  });

  it('after sign-out, a fresh User B login does not see a stale flag in sessionStorage', async () => {
    vi.stubGlobal('fetch', stubNoSavedPlan());

    // Simulate User A leaving a pending flag (set before sign-out happens)
    sessionStorage.setItem(FLAG_KEY, '1');

    // Mount as User A (authenticated), then immediately sign out
    mockAuth.isAuthenticated = true;
    const { rerender } = renderHook(
      ({ authed }: { authed: boolean }) => {
        mockAuth.isAuthenticated = authed;
        return useAIPlan(() => 'prompt', false, TOOL_KEY);
      },
      { initialProps: { authed: true } },
    );
    await act(async () => { await new Promise(r => setTimeout(r, 20)); });

    // Sign out — hook wipes the flag
    await act(async () => { rerender({ authed: false }); });
    await act(async () => { await new Promise(r => setTimeout(r, 20)); });

    // User B would now log in. Assert they see no flag.
    expect(sessionStorage.getItem(FLAG_KEY)).toBeNull();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   4. toolKey=undefined on sign-out → no crash
══════════════════════════════════════════════════════════════════════════ */
describe('useAIPlan sign-out — toolKey undefined: no crash', () => {
  it('does not throw on sign-out when toolKey is undefined', async () => {
    vi.stubGlobal('fetch', stubNoSavedPlan());

    mockAuth.isAuthenticated = true;
    const { rerender } = renderHook(
      ({ authed }: { authed: boolean }) => {
        mockAuth.isAuthenticated = authed;
        // No toolKey provided
        return useAIPlan(() => 'prompt', false, undefined);
      },
      { initialProps: { authed: true } },
    );

    await act(async () => { await new Promise(r => setTimeout(r, 20)); });

    await expect(
      act(async () => { rerender({ authed: false }); }),
    ).resolves.not.toThrow();
  });
});
