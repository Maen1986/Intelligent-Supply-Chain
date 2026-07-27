/**
 * SupplierScorecardTool — server-sync tests
 *
 * Covers the four behaviours described in task 166:
 *  1. On mount with a logged-in user, if the server returns a roster, the
 *     component switches to the server data (not localStorage).
 *  2. On mount with a logged-in user, if the server returns null, the local
 *     roster is uploaded via PUT.
 *  3. On mount without a user, no fetch is made and localStorage is used.
 *  4. Sync status cycles idle → saving → saved after a successful PUT.
 *  5. Sync status cycles idle → saving → error after a failed PUT.
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, act } from '@testing-library/react';

/* ── module-level mocks (hoisted before imports) ───────────────────────── */

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));

/* Auth mock — controlled per-test via mockUseAuth() */
const mockUseAuth = vi.fn(() => ({
  user: { id: 1, fullName: 'Jane' } as { id: number; fullName: string } | null,
  isAuthenticated: true,
  loading: false,
}));
vi.mock('@/lib/AuthContext', () => ({ useAuth: () => mockUseAuth() }));

/* Silence safeSetItem so tests don't pollute localStorage state */
vi.mock('@/lib/storage', () => ({ safeSetItem: vi.fn() }));

/* Stub the AI-plan hook and panel so they don't interfere with fetch mocks */
vi.mock('@/hooks/useAIPlan', () => ({
  useAIPlan: () => ({
    loading: false,
    result: null,
    error: null,
    rateLimited: false,
    generate: vi.fn(),
    reset: vi.fn(),
    savedPlan: null,
    viewSaved: vi.fn(),
    deleteSaved: vi.fn(),
  }),
}));
vi.mock('@/components/AIPlanPanel', () => ({ AIPlanPanel: () => null }));

import { SupplierScorecardTool } from './SupplierScorecard';

/* ── shared fixtures ────────────────────────────────────────────────────── */

const ROSTER_KEY = 'isc-tool-supplier-roster';

const LOCAL_ROSTER = {
  suppliers: [{ id: 'local-1', name: 'Local Supplier', tier: 'Strategic', subScores: {} }],
  activeId: 'local-1',
};

const SERVER_ROSTER = {
  suppliers: [{ id: 'srv-1', name: 'Server Supplier', tier: 'Preferred', subScores: {} }],
  activeId: 'srv-1',
};

/** Stub a successful GET response, optionally followed by a PUT response. */
function stubFetch({
  getOk = true,
  getRoster = null as typeof SERVER_ROSTER | null,
  putOk = true,
} = {}) {
  const fetchMock = vi.fn();

  fetchMock.mockResolvedValueOnce({
    ok: getOk,
    json: async () => ({ ok: getOk, roster: getRoster }),
  });

  // Any subsequent call (PUT from syncToServer) uses putOk
  fetchMock.mockResolvedValue({
    ok: putOk,
    json: async () => ({ ok: putOk }),
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/* ── global test lifecycle (real timers by default) ─────────────────────── */

beforeEach(() => {
  localStorage.clear();
  cleanup();
  mockUseAuth.mockReturnValue({
    user: { id: 1, fullName: 'Jane' },
    isAuthenticated: true,
    loading: false,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

/* ══════════════════════════════════════════════════════════════════════════
   1. Bootstrap — server has a roster
══════════════════════════════════════════════════════════════════════════ */

describe('bootstrap — server has roster data', () => {
  it('replaces the localStorage roster with the server roster on mount', async () => {
    // localStorage holds "Local Supplier" but the server has "Server Supplier"
    localStorage.setItem(ROSTER_KEY, JSON.stringify(LOCAL_ROSTER));
    stubFetch({ getRoster: SERVER_ROSTER });

    render(<SupplierScorecardTool isAr={false} />);

    // Wait for the async bootstrap effect to finish and re-render
    await waitFor(() =>
      expect(screen.getByText('Server Supplier')).toBeInTheDocument(),
    );

    // The local name must no longer be the active supplier
    expect(screen.queryByText('Local Supplier')).not.toBeInTheDocument();
  });

  it('does not re-fetch when the same user is already bootstrapped', async () => {
    stubFetch({ getRoster: SERVER_ROSTER });
    const { rerender } = render(<SupplierScorecardTool isAr={false} />);

    await waitFor(() =>
      expect(screen.getByText('Server Supplier')).toBeInTheDocument(),
    );

    const callsBefore = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length;

    // Rerender with the same auth user — must NOT fire a second GET
    rerender(<SupplierScorecardTool isAr={false} />);
    await waitFor(() => {}); // flush microtasks

    expect((global.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsBefore);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   2. Bootstrap — server has no roster (null)
══════════════════════════════════════════════════════════════════════════ */

describe('bootstrap — server returns null', () => {
  it('uploads the local roster via PUT when the server has no data', async () => {
    localStorage.setItem(ROSTER_KEY, JSON.stringify(LOCAL_ROSTER));
    const fetchMock = stubFetch({ getRoster: null });

    render(<SupplierScorecardTool isAr={false} />);

    await waitFor(() => {
      const calls = fetchMock.mock.calls as Array<[string, RequestInit]>;
      const putCall = calls.find(
        ([url, opts]) => url.includes('scorecard-roster') && opts?.method === 'PUT',
      );
      expect(putCall).toBeDefined();
    });
  });

  it('keeps displaying the local supplier when the server has no data', async () => {
    localStorage.setItem(ROSTER_KEY, JSON.stringify(LOCAL_ROSTER));
    stubFetch({ getRoster: null });

    render(<SupplierScorecardTool isAr={false} />);

    // The local supplier name should remain in the roster list
    await waitFor(() =>
      expect(screen.getByText('Local Supplier')).toBeInTheDocument(),
    );
  });

  it('makes no PUT when localStorage also has no roster', async () => {
    // No localStorage data → nothing to upload
    const fetchMock = stubFetch({ getRoster: null });

    render(<SupplierScorecardTool isAr={false} />);

    // Give effects time to flush
    await waitFor(() => {
      const getCall = (fetchMock.mock.calls as Array<[string, RequestInit]>).find(([url]) =>
        url.includes('scorecard-roster'),
      );
      expect(getCall).toBeDefined();
    });

    const putCall = (fetchMock.mock.calls as Array<[string, RequestInit]>).find(
      ([url, opts]) => url.includes('scorecard-roster') && opts?.method === 'PUT',
    );
    expect(putCall).toBeUndefined();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   3. Bootstrap — no authenticated user
══════════════════════════════════════════════════════════════════════════ */

describe('bootstrap — no authenticated user', () => {
  it('makes no fetch and renders the localStorage roster directly', async () => {
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false, loading: false });
    localStorage.setItem(ROSTER_KEY, JSON.stringify(LOCAL_ROSTER));
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<SupplierScorecardTool isAr={false} />);

    // The local supplier must appear without any fetch
    expect(screen.getByText('Local Supplier')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uses a fresh default supplier when localStorage is also empty', () => {
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false, loading: false });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<SupplierScorecardTool isAr={false} />);

    // Fallback: a blank supplier shows "New Supplier" placeholder (may appear
    // in more than one place — roster list and scorecard body — so use getAllByText)
    expect(screen.getAllByText('New Supplier').length).toBeGreaterThan(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   4 & 5. Sync status — after user edits trigger a PUT
   These tests use fake timers to control the 400 ms debounce.
   vi.runAllTimersAsync() fires the setTimeout AND awaits the async fetch
   inside it, so a single call flushes the full save cycle.
══════════════════════════════════════════════════════════════════════════ */

describe('sync status', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
  });

  /** Seed localStorage with a named supplier so the header shows sync text. */
  function seedNamedRoster() {
    localStorage.setItem(ROSTER_KEY, JSON.stringify(LOCAL_ROSTER));
  }

  /**
   * Render and flush the async bootstrap GET effect.
   * With fake timers active we cannot use waitFor (its setInterval polling is
   * also faked). Instead we wrap in act + runAllTimersAsync which fires all
   * pending timers AND awaits all promises created inside them, so React's
   * state updates from the resolved fetch land in the DOM synchronously.
   */
  async function renderAndBootstrap(fetchMock: ReturnType<typeof vi.fn>) {
    vi.stubGlobal('fetch', fetchMock);
    render(<SupplierScorecardTool isAr={false} />);
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(screen.getByText('Local Supplier')).toBeInTheDocument();
  }

  /**
   * Trigger a save() on the named "Local Supplier" by clicking its roster row.
   * The row's onClick calls setActiveId() → save(), and since active.name is
   * "Local Supplier" the sync status text becomes visible in the header.
   */
  function triggerSaveOnNamedSupplier() {
    // The span inside the roster row holds the supplier name; clicking it
    // bubbles up to the parent div's onClick handler.
    fireEvent.click(screen.getByText('Local Supplier'));
  }

  it('shows "Saving…" immediately after an edit while the debounce is pending', async () => {
    seedNamedRoster();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, roster: null }) })  // GET
      .mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });                   // PUT
    await renderAndBootstrap(fetchMock);

    // Wrap in act so React flushes setSyncStatus('saving') before we assert
    await act(async () => {
      triggerSaveOnNamedSupplier();
    });

    // Header now reads "Evaluating: Local Supplier — Saving…"
    expect(screen.getByText(/Saving/)).toBeInTheDocument();
  });

  it('shows "Saved ✓" after the debounced PUT succeeds', async () => {
    seedNamedRoster();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, roster: null }) })  // GET
      .mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });                   // PUT
    await renderAndBootstrap(fetchMock);

    await act(async () => {
      triggerSaveOnNamedSupplier();
    });

    // Advance exactly past the 400 ms debounce + async PUT, but NOT past the
    // 2500 ms idle-reset timer that runs after success — otherwise the status
    // flips back to 'idle' before the assertion sees 'saved'.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    // Header now reads "Evaluating: Local Supplier — Saved ✓"
    expect(screen.getByText(/Saved/)).toBeInTheDocument();
  });

  it('shows "Could not sync" after the debounced PUT returns a non-ok response', async () => {
    seedNamedRoster();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, roster: null }) })  // GET
      .mockResolvedValue({ ok: false, json: async () => ({ ok: false }) });                 // PUT fails
    await renderAndBootstrap(fetchMock);

    triggerSaveOnNamedSupplier();

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(screen.getByText(/Could not sync/)).toBeInTheDocument();
  });

  it('shows "Could not sync" when the PUT throws a network error', async () => {
    seedNamedRoster();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, roster: null }) })  // GET
      .mockRejectedValue(new Error('network error'));                                        // PUT throws
    await renderAndBootstrap(fetchMock);

    triggerSaveOnNamedSupplier();

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(screen.getByText(/Could not sync/)).toBeInTheDocument();
  });

  it('does not make any sync PUT when there is no logged-in user', async () => {
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false, loading: false });
    seedNamedRoster();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<SupplierScorecardTool isAr={false} />);
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(screen.getByText('Local Supplier')).toBeInTheDocument();

    // Clicking the roster row would normally trigger a sync PUT, but there's no user
    triggerSaveOnNamedSupplier();
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // No fetch of any kind should have been made (no user = no server sync)
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   6. User account switch — roster refreshes for new user id
   Verifies that switching from user A to user B (same session, no page
   reload) causes the component to re-fetch and display B's roster, and
   that re-rendering with the same user id never fires a duplicate GET.
══════════════════════════════════════════════════════════════════════════ */

describe('user account switch — roster refreshes for new user id', () => {
  const ROSTER_A = {
    suppliers: [{ id: 'a-1', name: 'Supplier A', tier: 'Strategic', subScores: {} }],
    activeId: 'a-1',
  };
  const ROSTER_B = {
    suppliers: [{ id: 'b-1', name: 'Supplier B', tier: 'Preferred', subScores: {} }],
    activeId: 'b-1',
  };

  it('re-fetches and shows the new account roster when the user switches from A to B', async () => {
    // Start with user A (id: 1)
    mockUseAuth.mockReturnValue({ user: { id: 1, fullName: 'Alice' }, isAuthenticated: true, loading: false });

    const fetchMock = vi.fn()
      // First GET: bootstrap for user A
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, roster: ROSTER_A }) })
      // Second GET: bootstrap for user B after auth switch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, roster: ROSTER_B }) })
      // Any subsequent PUT calls
      .mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    vi.stubGlobal('fetch', fetchMock);

    const { rerender } = render(<SupplierScorecardTool isAr={false} />);

    // Wait for user A's roster to load
    await waitFor(() => expect(screen.getByText('Supplier A')).toBeInTheDocument());

    // Switch auth context to user B (id: 2) — simulates logout → login as different account
    mockUseAuth.mockReturnValue({ user: { id: 2, fullName: 'Bob' }, isAuthenticated: true, loading: false });
    rerender(<SupplierScorecardTool isAr={false} />);

    // Component must re-fetch and display B's roster
    await waitFor(() => expect(screen.getByText('Supplier B')).toBeInTheDocument());

    // User A's supplier must no longer be rendered
    expect(screen.queryByText('Supplier A')).not.toBeInTheDocument();
  });

  it('does not fire a duplicate GET when the same user id re-appears (e.g. tab regains focus)', async () => {
    // User A (id: 1) is logged in
    mockUseAuth.mockReturnValue({ user: { id: 1, fullName: 'Alice' }, isAuthenticated: true, loading: false });

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, roster: ROSTER_A }) })
      .mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    vi.stubGlobal('fetch', fetchMock);

    const { rerender } = render(<SupplierScorecardTool isAr={false} />);

    // Wait for the initial bootstrap GET to complete
    await waitFor(() => expect(screen.getByText('Supplier A')).toBeInTheDocument());

    const getCallsBefore = (fetchMock.mock.calls as Array<[string, RequestInit]>).filter(
      ([url, opts]) => url.includes('scorecard-roster') && (!opts?.method || opts.method === 'GET'),
    ).length;

    // Same user id re-appears (e.g. visibility-change event causes a rerender)
    rerender(<SupplierScorecardTool isAr={false} />);
    await waitFor(() => {}); // flush any pending microtasks

    const getCallsAfter = (fetchMock.mock.calls as Array<[string, RequestInit]>).filter(
      ([url, opts]) => url.includes('scorecard-roster') && (!opts?.method || opts.method === 'GET'),
    ).length;

    // No additional GET should have been fired
    expect(getCallsAfter).toBe(getCallsBefore);
  });
});
