/**
 * Supplier Scorecard — supplier-switch clears the AI plan
 *
 * Confirms two things (Task 188):
 *   1. Switching the active supplier resets the displayed plan result to null
 *      (neither the old plan text nor the panel heading should remain visible).
 *   2. The toolKey passed to useAIPlan is `scorecard-<supplierId>`, so each
 *      supplier gets its own isolated plan slot.
 *
 * Coverage split:
 *   • Unit tests on useAIPlan directly — verify that changing toolKey
 *     immediately clears `result` and `savedPlan`.
 *   • Integration tests on SupplierScorecardTool — generate a plan for
 *     Supplier A, click Supplier B in the roster, confirm the panel is gone.
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));

/* ── Auth mock ──────────────────────────────────────────────────────────── */
const mockUseAuth = vi.fn(() => ({
  isAuthenticated: true,
  user: { id: 1 },
  loading: false,
}));
vi.mock('@/lib/AuthContext', () => ({ useAuth: () => mockUseAuth() }));

import { useAIPlan } from '@/hooks/useAIPlan';
import { SupplierScorecardTool } from '../SupplierScorecard';

/* ── Constants ──────────────────────────────────────────────────────────── */
const ROSTER_KEY = 'isc-tool-supplier-roster';
const PLAN_TEXT  = '## Supplier Development Plan\n- Improve delivery [HIGH]';

/* ── Fetch helpers ──────────────────────────────────────────────────────── */

/** Stub that keeps fetch suspended so the plan loading never completes */
function stubFetchPending() {
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
}

/** Stub for a successful AI plan generation (also silences /plans/* GETs) */
function stubFetchOk(text = PLAN_TEXT) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
      const method = (opts?.method ?? 'GET').toUpperCase();
      // Silently satisfy plan persistence and scorecard-roster calls
      if (method === 'GET') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ok: true, plan: null, roster: null }),
        });
      }
      if (method === 'POST' && (url as string).includes('/ai/plan')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ok: true, text }),
        });
      }
      // POST /plans/* (save) and other mutations
      return Promise.resolve({
        ok: true,
        json: async () => ({ ok: true, savedAt: new Date().toISOString() }),
      });
    }),
  );
}

/* ── Roster seeds ───────────────────────────────────────────────────────── */

/** Seed localStorage with two fully-scored suppliers; active = Supplier A */
function seedTwoSuppliers() {
  const allScores = {
    delivery:     { otif: '90' },
    quality:      { defect: '85' },
    cost:         { savings: '80' },
    compliance:   { regulatory: '90' },
    innovation:   { ideas: '75' },
    relationship: { responsiveness: '85' },
  };
  localStorage.setItem(
    ROSTER_KEY,
    JSON.stringify({
      suppliers: [
        { id: 'sup-a', name: 'Supplier A', tier: 'Strategic', subScores: allScores },
        { id: 'sup-b', name: 'Supplier B', tier: 'Preferred',  subScores: allScores },
      ],
      activeId: 'sup-a',
    }),
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   1. useAIPlan unit tests — toolKey change resets state
══════════════════════════════════════════════════════════════════════════ */
describe('useAIPlan — toolKey change resets result and savedPlan', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it('result resets to null immediately when toolKey changes to a new supplier', async () => {
    // Generate a plan for supplier A's key, then switch to supplier B's key
    stubFetchOk(PLAN_TEXT);

    const { result, rerender } = renderHook(
      ({ toolKey }: { toolKey: string }) =>
        useAIPlan(() => 'prompt', false, toolKey),
      { initialProps: { toolKey: 'scorecard-sup-a' } },
    );

    // Generate a plan while on supplier A
    await act(() => result.current.generate());
    expect(result.current.result).toBe(PLAN_TEXT);

    // Switch to supplier B
    await act(async () => {
      rerender({ toolKey: 'scorecard-sup-b' });
    });

    // result must be null — supplier A's plan must not show under B
    expect(result.current.result).toBeNull();
  });

  it('savedPlan resets to null immediately when toolKey changes (no plan exists for new supplier)', async () => {
    // Stub a GET that returns a saved plan ONLY for scorecard-sup-a.
    // scorecard-sup-b has no saved plan, so after the switch savedPlan should stay null.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if ((url as string).includes('/plans/scorecard-sup-a')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ ok: true, plan: { text: PLAN_TEXT, savedAt: '2026-07-01T00:00:00Z' } }),
          });
        }
        if ((url as string).includes('/plans/scorecard-sup-b')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ ok: true, plan: null }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
      }),
    );

    const { result, rerender } = renderHook(
      ({ toolKey }: { toolKey: string }) =>
        useAIPlan(() => 'prompt', false, toolKey),
      { initialProps: { toolKey: 'scorecard-sup-a' } },
    );

    // Wait for savedPlan to populate from the GET for supplier A
    await waitFor(() => expect(result.current.savedPlan).not.toBeNull());
    expect(result.current.savedPlan?.text).toBe(PLAN_TEXT);

    // Switch to supplier B — effect clears savedPlan immediately, then fetches
    // /plans/scorecard-sup-b which returns null, so savedPlan stays null.
    await act(async () => {
      rerender({ toolKey: 'scorecard-sup-b' });
    });

    // Give the async fetch for sup-b time to resolve
    await waitFor(() => {
      // The fetch for sup-b must have been called (confirms the key is right)
      const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls;
      const supBFetch = calls.find(([url]: [string]) =>
        (url as string).includes('/plans/scorecard-sup-b'),
      );
      expect(supBFetch).toBeDefined();
    });

    // savedPlan must be null — no plan was stored for supplier B
    expect(result.current.savedPlan).toBeNull();
  });

  it('result stays null when switching back after reset', async () => {
    stubFetchOk(PLAN_TEXT);

    const { result, rerender } = renderHook(
      ({ toolKey }: { toolKey: string }) =>
        useAIPlan(() => 'prompt', false, toolKey),
      { initialProps: { toolKey: 'scorecard-sup-a' } },
    );

    await act(() => result.current.generate());
    expect(result.current.result).toBe(PLAN_TEXT);

    // Switch away, then back
    await act(async () => { rerender({ toolKey: 'scorecard-sup-b' }); });
    await act(async () => { rerender({ toolKey: 'scorecard-sup-a' }); });

    // The in-session result is gone even on return; only a server fetch could restore it
    expect(result.current.result).toBeNull();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   2. useAIPlan unit tests — per-supplier toolKey format
══════════════════════════════════════════════════════════════════════════ */
describe('useAIPlan — per-supplier toolKey reaches the right API path', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it('uses scorecard-<supplierId> as the plan endpoint path', async () => {
    const supplierId = 'sup-xyz-99';
    const toolKey    = `scorecard-${supplierId}`;

    const fetchMock = vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
      const method = (opts?.method ?? 'GET').toUpperCase();
      if (method === 'GET')  return Promise.resolve({ ok: true, json: async () => ({ ok: true, plan: null }) });
      if (method === 'POST' && (url as string).includes('/ai/plan'))
        return Promise.resolve({ ok: true, json: async () => ({ ok: true, text: PLAN_TEXT }) });
      return Promise.resolve({ ok: true, json: async () => ({ ok: true, savedAt: new Date().toISOString() }) });
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() =>
      useAIPlan(() => 'prompt', false, toolKey),
    );

    await act(() => result.current.generate());

    // The plan-save POST must include the supplier-specific key in the URL
    const saveCall = fetchMock.mock.calls.find(
      ([url, opts]: [string, RequestInit]) =>
        (url as string).includes(`/plans/${toolKey}`) && (opts?.method ?? '').toUpperCase() === 'POST',
    );
    expect(saveCall).toBeDefined();
  });

  it('fetches the plan from the supplier-specific path on mount', async () => {
    const supplierId = 'sup-abc-42';
    const toolKey    = `scorecard-${supplierId}`;

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, plan: null }),
    });
    vi.stubGlobal('fetch', fetchMock);

    renderHook(() => useAIPlan(() => 'prompt', false, toolKey));

    await waitFor(() => {
      const getCall = fetchMock.mock.calls.find(
        ([url]: [string]) => (url as string).includes(`/plans/${toolKey}`),
      );
      expect(getCall).toBeDefined();
    });
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   3. SupplierScorecardTool integration — plan panel clears on supplier switch
══════════════════════════════════════════════════════════════════════════ */
describe('SupplierScorecardTool — switching supplier clears the AI plan panel', () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
    mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { id: 1 }, loading: false });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('plan result panel disappears after switching from Supplier A to Supplier B', async () => {
    seedTwoSuppliers();
    stubFetchOk(PLAN_TEXT);

    render(<SupplierScorecardTool isAr={false} />);

    // Generate a plan for Supplier A (the active one)
    const generateBtn = screen.getByRole('button', { name: /Generate Development Plan/i });
    fireEvent.click(generateBtn);

    // Wait until the result panel appears
    await waitFor(() =>
      expect(screen.getByText('AI-Generated Plan')).toBeInTheDocument(),
    );

    // Now click Supplier B in the roster list
    fireEvent.click(screen.getByText('Supplier B'));

    // The plan panel heading should no longer be visible
    await waitFor(() =>
      expect(screen.queryByText('AI-Generated Plan')).toBeNull(),
    );
  });

  it('plan text content is gone after switching suppliers', async () => {
    seedTwoSuppliers();
    stubFetchOk(PLAN_TEXT);

    render(<SupplierScorecardTool isAr={false} />);

    fireEvent.click(screen.getByRole('button', { name: /Generate Development Plan/i }));

    await waitFor(() =>
      expect(screen.getByText('AI-Generated Plan')).toBeInTheDocument(),
    );

    // The raw plan text (markdown heading) should appear somewhere in the panel
    expect(screen.getByText(/Supplier Development Plan/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Supplier B'));

    // Plan text must be cleared after the switch
    await waitFor(() =>
      expect(screen.queryByText(/Supplier Development Plan/)).toBeNull(),
    );
  });

  it('switching back to Supplier A does not restore the previous in-session result', async () => {
    seedTwoSuppliers();
    stubFetchOk(PLAN_TEXT);

    render(<SupplierScorecardTool isAr={false} />);

    fireEvent.click(screen.getByRole('button', { name: /Generate Development Plan/i }));
    await waitFor(() =>
      expect(screen.getByText('AI-Generated Plan')).toBeInTheDocument(),
    );

    // Switch to B, then back to A
    fireEvent.click(screen.getByText('Supplier B'));
    await waitFor(() =>
      expect(screen.queryByText('AI-Generated Plan')).toBeNull(),
    );

    fireEvent.click(screen.getByText('Supplier A'));

    // Give effects a tick to settle — result must remain null
    await act(async () => { await new Promise(r => setTimeout(r, 30)); });
    expect(screen.queryByText('AI-Generated Plan')).toBeNull();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   4. SupplierScorecardTool integration — toolKey format verification
      Confirms the correct scorecard-{supplierId} key is used per supplier
══════════════════════════════════════════════════════════════════════════ */
describe('SupplierScorecardTool — per-supplier toolKey is used', () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
    mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { id: 1 }, loading: false });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('generates and saves to scorecard-<supplierId> for Supplier A', async () => {
    seedTwoSuppliers();
    stubFetchOk(PLAN_TEXT);

    render(<SupplierScorecardTool isAr={false} />);

    fireEvent.click(screen.getByRole('button', { name: /Generate Development Plan/i }));
    await waitFor(() =>
      expect(screen.getByText('AI-Generated Plan')).toBeInTheDocument(),
    );

    // The plan-save POST URL should contain scorecard-sup-a (the active supplier's id)
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    const saveCall = fetchMock.mock.calls.find(
      ([url, opts]: [string, RequestInit]) =>
        (url as string).includes('/plans/scorecard-sup-a') &&
        (opts?.method ?? '').toUpperCase() === 'POST',
    );
    expect(saveCall).toBeDefined();
  });

  it('after switching to Supplier B, the plan GET uses scorecard-sup-b', async () => {
    seedTwoSuppliers();
    // Use pending fetch so no auto-generation fires on switch
    stubFetchPending();

    render(<SupplierScorecardTool isAr={false} />);

    // Allow initial mount effects to settle
    await act(async () => { await new Promise(r => setTimeout(r, 20)); });

    // Capture calls before the switch
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockClear();

    // Switch to Supplier B
    stubFetchOk(PLAN_TEXT);
    fireEvent.click(screen.getByText('Supplier B'));

    // A GET for scorecard-sup-b should fire shortly after
    await waitFor(() => {
      const getCall = (fetch as ReturnType<typeof vi.fn>).mock.calls.find(
        ([url]: [string]) => (url as string).includes('/plans/scorecard-sup-b'),
      );
      expect(getCall).toBeDefined();
    });
  });
});
