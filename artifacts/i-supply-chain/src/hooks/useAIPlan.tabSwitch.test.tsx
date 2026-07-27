/**
 * useAIPlan — tab-switch isolation test
 *
 * Confirms that changing toolKey immediately clears `result` and `savedPlan`
 * so a plan generated for one tool never flashes while the new tool's
 * saved-plan fetch is still in-flight.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAIPlan } from './useAIPlan';

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));

/* ── Auth mock — default authenticated ─────────────────────────────────── */
const mockIsAuthenticated = { value: true };
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: mockIsAuthenticated.value }),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  mockIsAuthenticated.value = true;
});

/* ── Helpers ────────────────────────────────────────────────────────────── */

const TOOL_A_PLAN = '## Tool A Plan\n- Action one [HIGH]';
const TOOL_B_PLAN = '## Tool B Plan\n- Action two [HIGH]';
const SAVED_AT    = '2026-07-27T10:00:00.000Z';

/**
 * Returns a fetch stub that:
 *  - GET  /plans/tool-a  → { ok: true, plan: { text: TOOL_A_PLAN, savedAt } }
 *  - GET  /plans/tool-b  → never resolves (keeps the fetch in-flight)
 *  - POST /ai/plan       → { ok: true, text: TOOL_A_PLAN }
 *  - POST /plans/tool-a  → { ok: true, savedAt }
 */
function stubWithHangingToolBFetch() {
  return vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
    const method = (opts?.method ?? 'GET').toUpperCase();

    if (method === 'GET' && url.includes('/plans/tool-a')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ ok: true, plan: { text: TOOL_A_PLAN, savedAt: SAVED_AT } }),
      });
    }

    if (method === 'GET' && url.includes('/plans/tool-b')) {
      // Hangs indefinitely — simulates a slow network response
      return new Promise(() => {});
    }

    if (method === 'POST' && url.includes('/ai/plan')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ ok: true, text: TOOL_A_PLAN }),
      });
    }

    if (method === 'POST' && url.includes('/plans/')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ ok: true, savedAt: SAVED_AT }),
      });
    }

    return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
  });
}

/* ── Tests ──────────────────────────────────────────────────────────────── */

describe('useAIPlan — tab-switch isolation', () => {
  it('clears result immediately when toolKey changes, before the new fetch resolves', async () => {
    vi.stubGlobal('fetch', stubWithHangingToolBFetch());

    const { result, rerender } = renderHook(
      ({ toolKey }: { toolKey: string }) =>
        useAIPlan(() => 'prompt', false, toolKey),
      { initialProps: { toolKey: 'tool-a' } },
    );

    // Wait for the tool-a saved plan to populate
    await waitFor(() => expect(result.current.savedPlan).not.toBeNull());

    // Trigger generate() so `result` gets a non-null value
    await act(() => result.current.generate());
    expect(result.current.result).toBe(TOOL_A_PLAN);

    // Switch to tool-b — the fetch for tool-b hangs, so we can inspect
    // the state synchronously right after the rerender
    act(() => {
      rerender({ toolKey: 'tool-b' });
    });

    // result and savedPlan must both be null *before* the tool-b fetch resolves
    expect(result.current.result).toBeNull();
    expect(result.current.savedPlan).toBeNull();
  });

  it('does not show tool-a savedPlan after switching to tool-b', async () => {
    vi.stubGlobal('fetch', stubWithHangingToolBFetch());

    const { result, rerender } = renderHook(
      ({ toolKey }: { toolKey: string }) =>
        useAIPlan(() => 'prompt', false, toolKey),
      { initialProps: { toolKey: 'tool-a' } },
    );

    // Let tool-a's saved plan load
    await waitFor(() => expect(result.current.savedPlan).not.toBeNull());
    expect(result.current.savedPlan?.text).toBe(TOOL_A_PLAN);

    // Switch tabs while tool-b fetch is still in-flight
    act(() => {
      rerender({ toolKey: 'tool-b' });
    });

    // Tool-a's savedPlan must not linger
    expect(result.current.savedPlan).toBeNull();
  });

  it('clears result and savedPlan when toolKey changes to a key with no saved plan (fetch resolves empty)', async () => {
    // Both fetches resolve, but tool-b has no plan
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
        const method = (opts?.method ?? 'GET').toUpperCase();

        if (method === 'GET' && url.includes('/plans/tool-a')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ ok: true, plan: { text: TOOL_A_PLAN, savedAt: SAVED_AT } }),
          });
        }

        if (method === 'GET' && url.includes('/plans/tool-b')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ ok: true, plan: null }),
          });
        }

        if (method === 'POST' && url.includes('/ai/plan')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ ok: true, text: TOOL_A_PLAN }),
          });
        }

        if (method === 'POST' && url.includes('/plans/')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ ok: true, savedAt: SAVED_AT }),
          });
        }

        return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
      }),
    );

    const { result, rerender } = renderHook(
      ({ toolKey }: { toolKey: string }) =>
        useAIPlan(() => 'prompt', false, toolKey),
      { initialProps: { toolKey: 'tool-a' } },
    );

    // Wait for tool-a saved plan to load and generate a result
    await waitFor(() => expect(result.current.savedPlan).not.toBeNull());
    await act(() => result.current.generate());
    expect(result.current.result).toBe(TOOL_A_PLAN);

    // Switch to tool-b
    act(() => {
      rerender({ toolKey: 'tool-b' });
    });

    // Immediately after switch: result and savedPlan must be null
    expect(result.current.result).toBeNull();
    expect(result.current.savedPlan).toBeNull();

    // After tool-b fetch settles: savedPlan stays null (no plan for tool-b)
    await waitFor(() => {
      // loading has settled — fetch for tool-b has resolved
      expect(result.current.savedPlan).toBeNull();
    });
    expect(result.current.result).toBeNull();
  });
});
