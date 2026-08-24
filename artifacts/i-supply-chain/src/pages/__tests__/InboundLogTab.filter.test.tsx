/**
 * InboundLogTab — action filter and status dropdown
 *
 * Confirms that:
 *   A. Typing a partial action string fires a new fetch with `action=<value>`
 *      and the table shows only the rows returned for that query.
 *   B. Selecting "error" from the status dropdown fires a fetch with
 *      `status=error` and the table hides OK rows.
 *   C. Clearing the action filter restores all rows (fetch called without
 *      `action` param).
 *   D. Both action and status filters combine: the URL carries both params.
 *
 * Strategy: mock global.fetch to inspect the requested URL and return
 * controlled fixture data.  No server or Playwright needed.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { InboundLogTab } from '../AdminAutomations';

/* ── Cleanup ──────────────────────────────────────────────────────────────── */

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/* ── Fixture rows ─────────────────────────────────────────────────────────── */

const ALL_ROWS = [
  { id: 1, action: 'supplier.update',  bodySnippet: null, status: 'ok',    error: null, receivedAt: '2026-01-01T10:00:00Z' },
  { id: 2, action: 'kpi.import',       bodySnippet: null, status: 'ok',    error: null, receivedAt: '2026-01-01T11:00:00Z' },
  { id: 3, action: 'supplier.delete',  bodySnippet: null, status: 'error', error: 'Not found', receivedAt: '2026-01-01T12:00:00Z' },
];

const SUPPLIER_ROWS  = ALL_ROWS.filter(r => r.action.includes('supplier'));
const ERROR_ROWS     = ALL_ROWS.filter(r => r.status === 'error');
const SUPPLIER_ERROR = ALL_ROWS.filter(r => r.action.includes('supplier') && r.status === 'error');

/* ── Fetch mock helper ────────────────────────────────────────────────────── */

/**
 * Intercepts every call to fetch(`…/inbound-log?…`) and returns rows
 * according to the `action` and `status` query params present in the URL.
 * Any other fetch call (e.g. other API routes) resolves to an empty-ok response.
 */
function mockInboundFetch() {
  vi.spyOn(global, 'fetch').mockImplementation((input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();

    if (!url.includes('inbound-log')) {
      return Promise.resolve({
        json: () => Promise.resolve({ ok: true, logs: [], total: 0 }),
      } as unknown as Response);
    }

    const parsed  = new URL(url, 'http://localhost');
    const action  = parsed.searchParams.get('action');
    const status  = parsed.searchParams.get('status');

    let rows = ALL_ROWS;
    if (action)  rows = rows.filter(r => r.action.includes(action));
    if (status)  rows = rows.filter(r => r.status === status);

    return Promise.resolve({
      json: () => Promise.resolve({ ok: true, logs: rows, total: rows.length }),
    } as unknown as Response);
  });
}

/* ── Tests ────────────────────────────────────────────────────────────────── */

describe('InboundLogTab — action filter', () => {

  /* ── A. Typing a partial action string narrows the table ─────────────── */

  it('A — typing "supplier" shows only the two supplier rows', async () => {
    mockInboundFetch();

    render(<InboundLogTab ar={false} refresh={0} />);

    // Wait for initial load — all three rows visible
    await waitFor(() => {
      expect(screen.getByText('supplier.update')).toBeInTheDocument();
    });
    expect(screen.getByText('kpi.import')).toBeInTheDocument();
    expect(screen.getByText('supplier.delete')).toBeInTheDocument();

    // Type into the action filter input
    const input = screen.getByPlaceholderText('Filter by action…');
    fireEvent.change(input, { target: { value: 'supplier' } });

    // Wait for the filtered fetch to fully resolve into its final state.
    // A single combined waitFor is required here, not a "wait for the old
    // row to disappear" step followed by synchronous asserts: while the
    // new fetch is in flight, load() sets loading=true and the component
    // replaces the whole table with a spinner -- which *also* makes
    // 'kpi.import' disappear, satisfying an absence-only waitFor before the
    // filtered data has actually arrived. Asserting presence of the new
    // content synchronously right after was a race against that loading
    // state, not just against the network mock.
    await waitFor(() => {
      expect(screen.queryByText('kpi.import')).not.toBeInTheDocument();
      expect(screen.getByText('supplier.update')).toBeInTheDocument();
      expect(screen.getByText('supplier.delete')).toBeInTheDocument();
      expect(screen.getByText(`${SUPPLIER_ROWS.length} records`)).toBeInTheDocument();
    });
  });

  /* ── B. Status dropdown "error" hides OK rows ────────────────────────── */

  it('B — selecting "error" from the status dropdown shows only error rows', async () => {
    mockInboundFetch();

    render(<InboundLogTab ar={false} refresh={0} />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('supplier.update')).toBeInTheDocument();
    });

    // Change status select to "error"
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'error' } });

    // Wait for the filtered fetch to fully resolve into its final state --
    // same combined-waitFor reasoning as test A above: the interim loading
    // spinner also satisfies an absence-only check, so presence of the new
    // row must be asserted inside the same waitFor, not synchronously after.
    await waitFor(() => {
      expect(screen.queryByText('supplier.update')).not.toBeInTheDocument();
      expect(screen.queryByText('kpi.import')).not.toBeInTheDocument();
      expect(screen.getByText('supplier.delete')).toBeInTheDocument();
      expect(screen.getByText(`${ERROR_ROWS.length} records`)).toBeInTheDocument();
    });
  });

  /* ── C. Clearing the action filter restores all rows ─────────────────── */

  it('C — clearing the action filter after typing restores all rows', async () => {
    mockInboundFetch();

    render(<InboundLogTab ar={false} refresh={0} />);

    // Initial load
    await waitFor(() => {
      expect(screen.getByText('kpi.import')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Filter by action…');

    // Apply a filter first
    fireEvent.change(input, { target: { value: 'supplier' } });
    await waitFor(() => {
      expect(screen.queryByText('kpi.import')).not.toBeInTheDocument();
    });

    // Clear the filter
    fireEvent.change(input, { target: { value: '' } });

    // All rows restored
    await waitFor(() => {
      expect(screen.getByText('kpi.import')).toBeInTheDocument();
    });
    expect(screen.getByText('supplier.update')).toBeInTheDocument();
    expect(screen.getByText('supplier.delete')).toBeInTheDocument();
    expect(screen.getByText(`${ALL_ROWS.length} records`)).toBeInTheDocument();
  });

  /* ── D. Action + status filters combine ─────────────────────────────── */

  it('D — combining action "supplier" and status "error" returns only the matching row', async () => {
    mockInboundFetch();

    render(<InboundLogTab ar={false} refresh={0} />);

    // Initial load
    await waitFor(() => {
      expect(screen.getByText('supplier.update')).toBeInTheDocument();
    });

    // Set action filter
    const input = screen.getByPlaceholderText('Filter by action…');
    fireEvent.change(input, { target: { value: 'supplier' } });

    await waitFor(() => {
      expect(screen.queryByText('kpi.import')).not.toBeInTheDocument();
    });

    // Also set status filter to "error"
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'error' } });

    // Combined waitFor -- same reasoning as tests A/B: the interim loading
    // spinner satisfies an absence-only check before the combined-filter
    // fetch has actually resolved.
    await waitFor(() => {
      expect(screen.queryByText('supplier.update')).not.toBeInTheDocument();
      expect(screen.getByText('supplier.delete')).toBeInTheDocument();
      expect(screen.getByText(`${SUPPLIER_ERROR.length} records`)).toBeInTheDocument();
    });
  });

  /* ── E. fetch URL carries correct query params ───────────────────────── */

  it('E — typing "kpi" causes fetch to be called with action=kpi in the URL', async () => {
    mockInboundFetch();

    render(<InboundLogTab ar={false} refresh={0} />);

    await waitFor(() => {
      expect(screen.getByText('supplier.update')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Filter by action…');
    fireEvent.change(input, { target: { value: 'kpi' } });

    await waitFor(() => {
      expect(screen.queryByText('supplier.update')).not.toBeInTheDocument();
    });

    // At least one fetch call must have carried action=kpi
    const fetchMock = vi.mocked(global.fetch);
    const inboundCalls = fetchMock.mock.calls
      .map(args => String(args[0]))
      .filter(u => u.includes('inbound-log') && u.includes('action=kpi'));

    expect(inboundCalls.length).toBeGreaterThan(0);
  });

  /* ── F. fetch URL carries status=error when dropdown is "error" ──────── */

  it('F — selecting "error" causes fetch to be called with status=error in the URL', async () => {
    mockInboundFetch();

    render(<InboundLogTab ar={false} refresh={0} />);

    await waitFor(() => {
      expect(screen.getByText('supplier.update')).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'error' } });

    await waitFor(() => {
      expect(screen.queryByText('supplier.update')).not.toBeInTheDocument();
    });

    const fetchMock = vi.mocked(global.fetch);
    const inboundCalls = fetchMock.mock.calls
      .map(args => String(args[0]))
      .filter(u => u.includes('inbound-log') && u.includes('status=error'));

    expect(inboundCalls.length).toBeGreaterThan(0);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   Task 679 — CSV export carries active filters in the request URL
   ═══════════════════════════════════════════════════════════════════════════ */

describe('InboundLogTab — CSV export carries active filters (Task 679)', () => {
  beforeEach(() => {
    // jsdom does not implement URL.createObjectURL / revokeObjectURL.
    // Patch only the missing static methods so exportCsv can complete
    // without throwing — the URL constructor itself must remain intact.
    if (!URL.createObjectURL) {
      URL.createObjectURL = vi.fn().mockReturnValue('blob:test-url');
    } else {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
    }
    if (!URL.revokeObjectURL) {
      URL.revokeObjectURL = vi.fn();
    } else {
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    }
  });

  /* ── G — export with action filter active ─────────────────────────────── */

  it('G — Export CSV sends export=1 AND action=supplier when action filter is active', async () => {
    mockInboundFetch();

    render(<InboundLogTab ar={false} refresh={0} />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('supplier.update')).toBeInTheDocument();
    });

    // Apply action filter
    const input = screen.getByPlaceholderText('Filter by action…');
    fireEvent.change(input, { target: { value: 'supplier' } });

    await waitFor(() => {
      expect(screen.queryByText('kpi.import')).not.toBeInTheDocument();
    });

    // Click export
    fireEvent.click(screen.getByText('Export CSV'));

    // Wait for the export fetch (it is async)
    await waitFor(() => {
      const exportCalls = vi.mocked(global.fetch).mock.calls
        .map(args => String(args[0]))
        .filter(u => u.includes('inbound-log') && u.includes('export=1'));
      expect(exportCalls.length).toBeGreaterThan(0);
    });

    // The export URL must carry the active action filter
    const exportUrl = vi.mocked(global.fetch).mock.calls
      .map(args => String(args[0]))
      .find(u => u.includes('inbound-log') && u.includes('export=1'));

    expect(exportUrl).toContain('action=supplier');
  });

  /* ── H — export with both filters active ──────────────────────────────── */

  it('H — Export CSV sends both action=supplier and status=error when both filters are active', async () => {
    mockInboundFetch();

    render(<InboundLogTab ar={false} refresh={0} />);

    await waitFor(() => {
      expect(screen.getByText('supplier.update')).toBeInTheDocument();
    });

    // Apply action filter
    const input = screen.getByPlaceholderText('Filter by action…');
    fireEvent.change(input, { target: { value: 'supplier' } });
    await waitFor(() => expect(screen.queryByText('kpi.import')).not.toBeInTheDocument());

    // Apply status filter
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'error' } });
    await waitFor(() => expect(screen.queryByText('supplier.update')).not.toBeInTheDocument());

    // Click export
    fireEvent.click(screen.getByText('Export CSV'));

    await waitFor(() => {
      const exportCalls = vi.mocked(global.fetch).mock.calls
        .map(args => String(args[0]))
        .filter(u => u.includes('inbound-log') && u.includes('export=1'));
      expect(exportCalls.length).toBeGreaterThan(0);
    });

    const exportUrl = vi.mocked(global.fetch).mock.calls
      .map(args => String(args[0]))
      .find(u => u.includes('inbound-log') && u.includes('export=1'));

    expect(exportUrl).toContain('action=supplier');
    expect(exportUrl).toContain('status=error');
    // Page-limiting params must be absent from the export URL
    expect(exportUrl).not.toContain('limit=');
    expect(exportUrl).not.toContain('offset=');
  });
});
