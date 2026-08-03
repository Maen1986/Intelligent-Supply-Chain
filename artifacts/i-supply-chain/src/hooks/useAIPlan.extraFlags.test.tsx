/**
 * useAIPlan — additional pending-flag edge-case tests
 *
 * Covers three scenarios not in useAIPlan.pendingFlag.test.tsx:
 *
 *  Task 421 — Flag is safely discarded when the saved-plan fetch fails.
 *    Effect B removes the flag AND sets pendingFlagConsumed. Effect C's catch
 *    block resets pendingFlagConsumed → generate() never fires. The flag must
 *    be gone (removed by Effect B before the fetch even starts).
 *
 *  Task 437 — Flag is removed from sessionStorage after auto-generate fires
 *    on a remount cycle: unmount while unauthenticated, remount with the flag
 *    still set, then authenticate → flag is consumed and generate() fires.
 *
 *  Task 584 — Flag does NOT linger when the hook mounts while already
 *    authenticated. There is no false→true transition in that case, so the
 *    normal transition branch in Effect B never fires. The first-mount cleanup
 *    added to Effect B's else branch must remove the flag instead.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAIPlan } from './useAIPlan';

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));

const mockAuth = { isAuthenticated: false };
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: mockAuth.isAuthenticated }),
}));

const TOOL_KEY = 'risk';
const FLAG_KEY = `pendingAIPlan_${TOOL_KEY}`;

/* ── Fetch stub helpers ──────────────────────────────────────────────────── */

/** Fetch that succeeds for POST /ai/plan but FAILS for GET /plans/:toolKey */
function stubFetchWithPlanFetchFailure() {
  return vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
    const method = opts?.method ?? 'GET';
    if (method === 'POST' && url.includes('/ai/plan')) {
      return Promise.resolve({
        ok: true, status: 200,
        json: async () => ({ ok: true, text: '## Plan' }),
      });
    }
    if (method === 'GET' && url.includes('/plans/')) {
      return Promise.reject(new Error('Network error'));
    }
    return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
  });
}

/** Fetch that succeeds for everything (no saved plan) */
function stubFetchNoSavedPlan() {
  return vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
    const method = opts?.method ?? 'GET';
    if (method === 'POST' && url.includes('/ai/plan')) {
      return Promise.resolve({
        ok: true, status: 200,
        json: async () => ({ ok: true, text: '## Generated plan' }),
      });
    }
    if (method === 'GET' && url.includes('/plans/')) {
      return Promise.resolve({
        ok: true, json: async () => ({ ok: false, plan: null }),
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
  vi.restoreAllMocks();
  sessionStorage.clear();
});

/* ══════════════════════════════════════════════════════════════════════════
   Task 421 — Flag discarded when saved-plan fetch fails
══════════════════════════════════════════════════════════════════════════ */

describe('useAIPlan pendingFlag — flag discarded when saved-plan fetch fails (Task 421)', () => {
  it('flag is removed from sessionStorage even when the saved-plan fetch throws', async () => {
    vi.stubGlobal('fetch', stubFetchWithPlanFetchFailure());

    sessionStorage.setItem(FLAG_KEY, '1');

    const { rerender } = renderHook(
      ({ authed }: { authed: boolean }) => {
        mockAuth.isAuthenticated = authed;
        return useAIPlan(() => 'prompt', true, TOOL_KEY);
      },
      { initialProps: { authed: false } },
    );

    // Simulate login
    await act(async () => { rerender({ authed: true }); });
    await act(async () => { await new Promise(r => setTimeout(r, 60)); });

    // Effect B removes the flag before Effect C (the fetch) even runs.
    expect(sessionStorage.getItem(FLAG_KEY)).toBeNull();
  });

  it('generate() is NOT called when the saved-plan fetch throws (Effect C catch resets pendingFlagConsumed)', async () => {
    const fetchMock = stubFetchWithPlanFetchFailure();
    vi.stubGlobal('fetch', fetchMock);

    sessionStorage.setItem(FLAG_KEY, '1');

    const { rerender } = renderHook(
      ({ authed }: { authed: boolean }) => {
        mockAuth.isAuthenticated = authed;
        return useAIPlan(() => 'prompt', true, TOOL_KEY);
      },
      { initialProps: { authed: false } },
    );

    await act(async () => { rerender({ authed: true }); });
    await act(async () => { await new Promise(r => setTimeout(r, 60)); });

    // No POST /ai/plan should have been called — the catch resets pendingFlagConsumed
    const aiPlanCalls = fetchMock.mock.calls.filter(
      ([url, opts]) => url.includes('/ai/plan') && (opts?.method ?? 'GET') === 'POST',
    );
    expect(aiPlanCalls).toHaveLength(0);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Task 437 — Flag removed after auto-generate fires on remount
══════════════════════════════════════════════════════════════════════════ */

describe('useAIPlan pendingFlag — flag consumed on remount + authenticate (Task 437)', () => {
  it('flag is removed from sessionStorage after auto-generate fires following a remount', async () => {
    vi.stubGlobal('fetch', stubFetchNoSavedPlan());

    // First mount (unauthenticated, no flag yet)
    const { unmount, rerender } = renderHook(
      ({ authed }: { authed: boolean }) => {
        mockAuth.isAuthenticated = authed;
        return useAIPlan(() => 'prompt', true, TOOL_KEY);
      },
      { initialProps: { authed: false } },
    );

    // Unmount (simulates user navigating away)
    unmount();

    // Set the pending flag (user clicked "Sign in to generate" on the landing page)
    sessionStorage.setItem(FLAG_KEY, '1');

    // Remount — still unauthenticated
    const { rerender: rerender2 } = renderHook(
      ({ authed }: { authed: boolean }) => {
        mockAuth.isAuthenticated = authed;
        return useAIPlan(() => 'prompt', true, TOOL_KEY);
      },
      { initialProps: { authed: false } },
    );

    // Simulate login on the remounted hook
    await act(async () => { rerender2({ authed: true }); });
    await act(async () => { await new Promise(r => setTimeout(r, 60)); });

    // Flag must be removed after consumption
    expect(sessionStorage.getItem(FLAG_KEY)).toBeNull();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Task 584 — Flag removed when already authenticated on mount
══════════════════════════════════════════════════════════════════════════ */

describe('useAIPlan pendingFlag — flag removed when mounting while already authenticated (Task 584)', () => {
  it('stale flag is removed immediately when the hook mounts with isAuthenticated=true', async () => {
    vi.stubGlobal('fetch', stubFetchNoSavedPlan());

    // Set the stale flag (left over from a previous session)
    sessionStorage.setItem(FLAG_KEY, '1');

    // Mount while already authenticated — no false→true transition
    mockAuth.isAuthenticated = true;
    renderHook(() => useAIPlan(() => 'prompt', true, TOOL_KEY));

    await act(async () => { await new Promise(r => setTimeout(r, 30)); });

    // The flag must be gone — the first-mount cleanup in Effect B's else branch handles this
    expect(sessionStorage.getItem(FLAG_KEY)).toBeNull();
  });

  it('no stale flag → mounting authenticated is a no-op (flag-related cleanup does not crash)', async () => {
    vi.stubGlobal('fetch', stubFetchNoSavedPlan());

    // No flag set
    expect(sessionStorage.getItem(FLAG_KEY)).toBeNull();

    mockAuth.isAuthenticated = true;
    expect(() => {
      renderHook(() => useAIPlan(() => 'prompt', true, TOOL_KEY));
    }).not.toThrow();

    // Still no flag
    expect(sessionStorage.getItem(FLAG_KEY)).toBeNull();
  });
});
