/**
 * useAIPlan — server-side plan persistence tests (Task 177)
 *
 * Confirms the full round-trip for authenticated users:
 *   Mount          → fetches GET /api/plans/:toolKey and populates savedPlan
 *   generate()     → POSTs the new text to /api/plans/:toolKey and updates savedPlan
 *   viewSaved()    → copies savedPlan.text into `result` (restores the plan)
 *   deleteSaved()  → DELETEs /api/plans/:toolKey and clears savedPlan
 *
 * Also confirms unauthenticated / no-toolKey paths are untouched:
 *   No toolKey     → no fetch, savedPlan stays null
 *   Unauthenticated → no fetch, savedPlan stays null, ephemeral generate still works
 */
import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAIPlan } from './useAIPlan';

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));

/* ── Auth mock — default authenticated ─────────────────────────────────── */
const mockIsAuthenticated = { value: true };
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: mockIsAuthenticated.value }),
}));

/* ── Constants ─────────────────────────────────────────────────────────── */
const TOOL_KEY   = 'kpi';
const PLAN_TEXT  = '## KPI Improvement Plan\n- Reduce lead time [HIGH]';
const SAVED_AT   = '2026-07-20T10:00:00.000Z';
const SAVED_PLAN = { text: PLAN_TEXT, savedAt: SAVED_AT };

/* ── Fetch helpers ─────────────────────────────────────────────────────── */

/** GET returns a saved plan */
function stubGetOk(plan = SAVED_PLAN) {
  return vi.fn().mockImplementation((url: string) => {
    if (url.includes(`/plans/${TOOL_KEY}`)) {
      return Promise.resolve({ ok: true, json: async () => ({ ok: true, plan }) });
    }
    return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
  });
}

/** GET returns no saved plan */
function stubGetEmpty() {
  return vi.fn().mockImplementation((url: string) => {
    if (url.includes(`/plans/${TOOL_KEY}`)) {
      return Promise.resolve({ ok: true, json: async () => ({ ok: true, plan: null }) });
    }
    return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
  });
}

/** Fetch that handles GET (return savedPlan), POST /ai/plan (return text), POST /plans (save), DELETE */
function stubFullFlow(planText = PLAN_TEXT) {
  const savedAt = new Date().toISOString();
  return vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
    const method = opts?.method ?? 'GET';

    // GET /plans/:toolKey
    if (method === 'GET' && url.includes(`/plans/${TOOL_KEY}`)) {
      return Promise.resolve({ ok: true, json: async () => ({ ok: true, plan: null }) });
    }
    // POST /ai/plan — returns generated text
    if (method === 'POST' && url.includes('/ai/plan')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, text: planText }),
      });
    }
    // POST /plans/:toolKey — save plan
    if (method === 'POST' && url.includes(`/plans/${TOOL_KEY}`)) {
      return Promise.resolve({ ok: true, json: async () => ({ ok: true, savedAt }) });
    }
    // DELETE /plans/:toolKey
    if (method === 'DELETE' && url.includes(`/plans/${TOOL_KEY}`)) {
      return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
    }
    return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
  });
}

beforeEach(() => {
  mockIsAuthenticated.value = true;
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  sessionStorage.clear();
});

/* ══════════════════════════════════════════════════════════════════════════
   1. Mount — load saved plan
══════════════════════════════════════════════════════════════════════════ */
describe('useAIPlan persistence — mount: load saved plan', () => {
  it('fetches GET /api/plans/:toolKey on mount when authenticated + toolKey provided', async () => {
    const fetchMock = stubGetOk();
    vi.stubGlobal('fetch', fetchMock);

    renderHook(() => useAIPlan(() => 'prompt', false, TOOL_KEY));

    await waitFor(() => {
      const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls;
      const getCall = calls.find(([url]) => url.includes(`/plans/${TOOL_KEY}`));
      expect(getCall).toBeDefined();
    });
  });

  it('populates savedPlan when the server returns a saved plan', async () => {
    vi.stubGlobal('fetch', stubGetOk());

    const { result } = renderHook(() => useAIPlan(() => 'prompt', false, TOOL_KEY));

    await waitFor(() => {
      expect(result.current.savedPlan).not.toBeNull();
    });
    expect(result.current.savedPlan?.text).toBe(PLAN_TEXT);
    expect(result.current.savedPlan?.savedAt).toBe(SAVED_AT);
  });

  it('leaves savedPlan as null when the server returns plan: null', async () => {
    vi.stubGlobal('fetch', stubGetEmpty());

    const { result } = renderHook(() => useAIPlan(() => 'prompt', false, TOOL_KEY));

    // Give the effect time to settle
    await act(async () => { await new Promise(r => setTimeout(r, 20)); });
    expect(result.current.savedPlan).toBeNull();
  });

  it('does NOT fetch when no toolKey is provided', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    renderHook(() => useAIPlan(() => 'prompt', false));

    await act(async () => { await new Promise(r => setTimeout(r, 20)); });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does NOT fetch when user is not authenticated', async () => {
    mockIsAuthenticated.value = false;
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    renderHook(() => useAIPlan(() => 'prompt', false, TOOL_KEY));

    await act(async () => { await new Promise(r => setTimeout(r, 20)); });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('savedPlan is null when user is not authenticated even with toolKey', async () => {
    mockIsAuthenticated.value = false;
    vi.stubGlobal('fetch', vi.fn());

    const { result } = renderHook(() => useAIPlan(() => 'prompt', false, TOOL_KEY));

    await act(async () => { await new Promise(r => setTimeout(r, 20)); });
    expect(result.current.savedPlan).toBeNull();
  });

  it('the fetch uses credentials: include', async () => {
    const fetchMock = stubGetOk();
    vi.stubGlobal('fetch', fetchMock);

    renderHook(() => useAIPlan(() => 'prompt', false, TOOL_KEY));

    await waitFor(() => {
      const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls;
      const [, opts] = calls.find(([url]) => url.includes(`/plans/${TOOL_KEY}`)) ?? [];
      expect(opts?.credentials).toBe('include');
    });
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   2. generate() — save after generation
══════════════════════════════════════════════════════════════════════════ */
describe('useAIPlan persistence — generate() saves the plan', () => {
  it('POSTs to /api/plans/:toolKey after a successful generation', async () => {
    const fetchMock = stubFullFlow();
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAIPlan(() => 'my prompt', false, TOOL_KEY));
    await act(() => result.current.generate());

    const postCall = (fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      ([url, opts]) => url.includes(`/plans/${TOOL_KEY}`) && opts?.method === 'POST',
    );
    expect(postCall).toBeDefined();
  });

  it('POST body contains the generated text', async () => {
    const fetchMock = stubFullFlow(PLAN_TEXT);
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAIPlan(() => 'my prompt', false, TOOL_KEY));
    await act(() => result.current.generate());

    const [, opts] = (fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      ([url, o]) => url.includes(`/plans/${TOOL_KEY}`) && o?.method === 'POST',
    ) ?? [];
    const body = JSON.parse(opts?.body as string);
    expect(body.text).toBe(PLAN_TEXT);
  });

  it('updates savedPlan after successful generation + save', async () => {
    vi.stubGlobal('fetch', stubFullFlow(PLAN_TEXT));

    const { result } = renderHook(() => useAIPlan(() => 'my prompt', false, TOOL_KEY));
    await act(() => result.current.generate());

    expect(result.current.savedPlan).not.toBeNull();
    expect(result.current.savedPlan?.text).toBe(PLAN_TEXT);
    expect(result.current.savedPlan?.savedAt).toBeTruthy();
  });

  it('does NOT POST to /plans when no toolKey is provided', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, status: 200, json: async () => ({ ok: true, text: PLAN_TEXT }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAIPlan(() => 'prompt', false));
    await act(() => result.current.generate());

    const planPost = (fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      ([url, opts]) => url.includes('/plans/') && opts?.method === 'POST',
    );
    expect(planPost).toBeUndefined();
  });

  it('does NOT POST to /plans when user is not authenticated', async () => {
    mockIsAuthenticated.value = false;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, status: 200, json: async () => ({ ok: true, text: PLAN_TEXT }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAIPlan(() => 'prompt', false, TOOL_KEY));
    await act(() => result.current.generate());

    const planPost = (fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      ([url, opts]) => url.includes('/plans/') && opts?.method === 'POST',
    );
    expect(planPost).toBeUndefined();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   3. viewSaved() — restores the plan text into result
══════════════════════════════════════════════════════════════════════════ */
describe('useAIPlan persistence — viewSaved() restores the plan', () => {
  it('copies savedPlan.text into result when viewSaved() is called', async () => {
    vi.stubGlobal('fetch', stubGetOk());

    const { result } = renderHook(() => useAIPlan(() => 'prompt', false, TOOL_KEY));

    // Wait for savedPlan to load
    await waitFor(() => expect(result.current.savedPlan).not.toBeNull());

    act(() => result.current.viewSaved());

    expect(result.current.result).toBe(PLAN_TEXT);
  });

  it('result stays null when viewSaved() is called with no savedPlan', async () => {
    vi.stubGlobal('fetch', stubGetEmpty());

    const { result } = renderHook(() => useAIPlan(() => 'prompt', false, TOOL_KEY));
    await act(async () => { await new Promise(r => setTimeout(r, 20)); });

    act(() => result.current.viewSaved());

    expect(result.current.result).toBeNull();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   4. deleteSaved() — removes the plan
══════════════════════════════════════════════════════════════════════════ */
describe('useAIPlan persistence — deleteSaved() removes the plan', () => {
  it('clears savedPlan immediately (optimistic update) when deleteSaved() is called', async () => {
    vi.stubGlobal('fetch', stubGetOk());

    const { result } = renderHook(() => useAIPlan(() => 'prompt', false, TOOL_KEY));
    await waitFor(() => expect(result.current.savedPlan).not.toBeNull());

    // Stub DELETE response
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ ok: true }),
    }));

    await act(() => result.current.deleteSaved());

    expect(result.current.savedPlan).toBeNull();
  });

  it('sends DELETE /api/plans/:toolKey when deleteSaved() is called', async () => {
    vi.stubGlobal('fetch', stubGetOk());

    const { result } = renderHook(() => useAIPlan(() => 'prompt', false, TOOL_KEY));
    await waitFor(() => expect(result.current.savedPlan).not.toBeNull());

    const deleteFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    vi.stubGlobal('fetch', deleteFetch);

    await act(() => result.current.deleteSaved());

    const deleteCall = deleteFetch.mock.calls.find(
      ([url, opts]) => url.includes(`/plans/${TOOL_KEY}`) && opts?.method === 'DELETE',
    );
    expect(deleteCall).toBeDefined();
  });

  it('DELETE uses credentials: include', async () => {
    vi.stubGlobal('fetch', stubGetOk());

    const { result } = renderHook(() => useAIPlan(() => 'prompt', false, TOOL_KEY));
    await waitFor(() => expect(result.current.savedPlan).not.toBeNull());

    const deleteFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    vi.stubGlobal('fetch', deleteFetch);

    await act(() => result.current.deleteSaved());

    const [, opts] = deleteFetch.mock.calls.find(
      ([url, o]) => url.includes(`/plans/${TOOL_KEY}`) && o?.method === 'DELETE',
    ) ?? [];
    expect(opts?.credentials).toBe('include');
  });

  it('does nothing when deleteSaved() is called without a toolKey', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAIPlan(() => 'prompt', false));
    await act(() => result.current.deleteSaved());

    expect(fetchMock).not.toHaveBeenCalled();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   5. Unauthenticated ephemeral flow — unchanged
══════════════════════════════════════════════════════════════════════════ */
describe('useAIPlan persistence — unauthenticated ephemeral flow', () => {
  beforeEach(() => {
    mockIsAuthenticated.value = false;
  });

  it('generate() still returns a result for unauthenticated users', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, status: 200, json: async () => ({ ok: true, text: PLAN_TEXT }),
    }));

    const { result } = renderHook(() => useAIPlan(() => 'prompt', false, TOOL_KEY));
    await act(() => result.current.generate());

    expect(result.current.result).toBe(PLAN_TEXT);
    expect(result.current.error).toBeNull();
  });

  it('savedPlan remains null after generate() for unauthenticated users', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, status: 200, json: async () => ({ ok: true, text: PLAN_TEXT }),
    }));

    const { result } = renderHook(() => useAIPlan(() => 'prompt', false, TOOL_KEY));
    await act(() => result.current.generate());

    expect(result.current.savedPlan).toBeNull();
  });

  it('auth state change from false→true triggers a fetch for the saved plan', async () => {
    mockIsAuthenticated.value = false;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ ok: true, plan: SAVED_PLAN }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result, rerender } = renderHook(
      ({ authed }: { authed: boolean }) => {
        mockIsAuthenticated.value = authed;
        return useAIPlan(() => 'prompt', false, TOOL_KEY);
      },
      { initialProps: { authed: false } },
    );

    await act(async () => { await new Promise(r => setTimeout(r, 10)); });
    expect(result.current.savedPlan).toBeNull();

    // Simulate login
    await act(async () => { rerender({ authed: true }); });
    await waitFor(() => expect(result.current.savedPlan).not.toBeNull());
    expect(result.current.savedPlan?.text).toBe(PLAN_TEXT);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   6. pendingAIPlan_<toolKey> flag — canGenerate gate
   When the user returns after a redirect-to-login the flag may already be
   in sessionStorage. If the form is still empty (canGenerate=false) the
   flag must be silently discarded — generate() must NOT fire. If the form
   is filled (canGenerate=true) the flag is consumed and generate() runs.
══════════════════════════════════════════════════════════════════════════ */
describe('useAIPlan persistence — pending flag + canGenerate gate', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('removes the flag without calling generate() when canGenerate=false on login', async () => {
    mockIsAuthenticated.value = false;
    sessionStorage.setItem(`pendingAIPlan_${TOOL_KEY}`, '1');

    // GET /plans returns no saved plan; /ai/plan should NOT be called
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes(`/plans/${TOOL_KEY}`)) {
        return Promise.resolve({ ok: true, json: async () => ({ ok: true, plan: null }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
    });
    vi.stubGlobal('fetch', fetchMock);

    const { rerender } = renderHook(
      ({ authed, canGenerate }: { authed: boolean; canGenerate: boolean }) => {
        mockIsAuthenticated.value = authed;
        return useAIPlan(() => 'prompt', false, TOOL_KEY, canGenerate);
      },
      { initialProps: { authed: false, canGenerate: false } },
    );

    await act(async () => { await new Promise(r => setTimeout(r, 10)); });

    // Simulate sign-in with an empty form (canGenerate still false)
    await act(async () => { rerender({ authed: true, canGenerate: false }); });
    await act(async () => { await new Promise(r => setTimeout(r, 30)); });

    // Flag must be gone — no stale entry left in sessionStorage
    expect(sessionStorage.getItem(`pendingAIPlan_${TOOL_KEY}`)).toBeNull();

    // generate() must NOT have been called
    const aiPlanCall = fetchMock.mock.calls.find(
      ([url, opts]: [string, RequestInit]) =>
        url.includes('/ai/plan') && opts?.method === 'POST',
    );
    expect(aiPlanCall).toBeUndefined();
  });

  it('flag is gone immediately after sign-in regardless of the subsequent fetch result', async () => {
    mockIsAuthenticated.value = false;
    sessionStorage.setItem(`pendingAIPlan_${TOOL_KEY}`, '1');

    // Deliberately slow GET so we can check the flag removal timing
    let resolveGet!: () => void;
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes(`/plans/${TOOL_KEY}`)) {
        return new Promise<Response>((res) => {
          resolveGet = () =>
            res({ ok: true, json: async () => ({ ok: true, plan: null }) } as Response);
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({ ok: true }) } as Response);
    });
    vi.stubGlobal('fetch', fetchMock);

    const { rerender } = renderHook(
      ({ authed, canGenerate }: { authed: boolean; canGenerate: boolean }) => {
        mockIsAuthenticated.value = authed;
        return useAIPlan(() => 'prompt', false, TOOL_KEY, canGenerate);
      },
      { initialProps: { authed: false, canGenerate: false } },
    );

    await act(async () => { rerender({ authed: true, canGenerate: false }); });

    // Flag removed before the GET even resolves
    expect(sessionStorage.getItem(`pendingAIPlan_${TOOL_KEY}`)).toBeNull();

    // Let the GET finish cleanly
    await act(async () => { resolveGet(); await new Promise(r => setTimeout(r, 10)); });
  });

  it('removes the flag and calls generate() when canGenerate=true and no saved plan exists', async () => {
    mockIsAuthenticated.value = false;
    sessionStorage.setItem(`pendingAIPlan_${TOOL_KEY}`, '1');

    const fetchMock = stubFullFlow(PLAN_TEXT);
    vi.stubGlobal('fetch', fetchMock);

    const { result, rerender } = renderHook(
      ({ authed, canGenerate }: { authed: boolean; canGenerate: boolean }) => {
        mockIsAuthenticated.value = authed;
        return useAIPlan(() => 'prompt', false, TOOL_KEY, canGenerate);
      },
      { initialProps: { authed: false, canGenerate: true } },
    );

    await act(async () => { await new Promise(r => setTimeout(r, 10)); });

    // Simulate sign-in with a filled form (canGenerate=true)
    await act(async () => { rerender({ authed: true, canGenerate: true }); });
    await waitFor(() => expect(result.current.result).toBe(PLAN_TEXT));

    // Flag consumed — must be gone
    expect(sessionStorage.getItem(`pendingAIPlan_${TOOL_KEY}`)).toBeNull();

    // generate() must have been called
    const aiPlanCall = fetchMock.mock.calls.find(
      ([url, opts]: [string, RequestInit]) =>
        url.includes('/ai/plan') && opts?.method === 'POST',
    );
    expect(aiPlanCall).toBeDefined();
  });
});
