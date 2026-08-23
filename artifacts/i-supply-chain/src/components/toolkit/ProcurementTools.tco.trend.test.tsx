/**
 * ProcurementToolsSection — TCO trend history (#168/#169 TCO reporting,
 * 2026-08-23).
 *
 * Covers:
 *  - Guest (no session): shows the sign-in prompt, makes no fetch to
 *    /tco-trend-snapshots.
 *  - Logged in, fewer than 2 saved snapshots: shows the "builds
 *    automatically" placeholder, not a chart.
 *  - Logged in, 2+ saved snapshots: renders the trend chart section instead
 *    of either placeholder.
 *  - Logged in, priced analysis: auto-fires a POST to /tco-trend-snapshots
 *    with the expected payload shape once the analysis has valid data.
 *  - The auto-snapshot POST does not refire on an unrelated keystroke that
 *    doesn't change the composite (analysis, month, rounded value) key.
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, within } from '@testing-library/react';

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));

const mockUseAuth = vi.fn(() => ({
  user: null as { id: number; fullName: string } | null,
  isAuthenticated: false,
  loading: false,
}));
vi.mock('@/lib/AuthContext', () => ({ useAuth: () => mockUseAuth() }));

import { ProcurementToolsSection } from './ProcurementTools';

class ResizeObserverStub { observe() {} unobserve() {} disconnect() {} }
(globalThis as any).ResizeObserver = ResizeObserverStub;

function goToTco() {
  fireEvent.click(screen.getByRole('tab', { name: /TCO Engine/i }));
}

function enterValidCostData(container: HTMLElement) {
  const table = container.querySelector('table')!;
  const rows = within(table).getAllByRole('row');
  const unitPriceRow = rows.find(r => within(r).queryByText(/Unit purchase price/i))!;
  const qtyRow = rows.find(r => within(r).queryByText(/Annual quantity/i))!;
  fireEvent.change(within(unitPriceRow).getAllByRole('spinbutton')[0], { target: { value: '100' } });
  fireEvent.change(within(qtyRow).getAllByRole('spinbutton')[0], { target: { value: '10' } });
}

// Same URL-routing rationale as ProcurementTools.tco.server-sync.test.tsx --
// useAIPlan() and the /tco-analyses bootstrap both fire on mount too, so the
// mock must answer by URL, not call order.
function stubFetch({ trendSnapshots = [] as any[], onPost = (_body: any) => {} } = {}) {
  const fetchMock = vi.fn((url: string, opts?: RequestInit) => {
    if (url.includes('/plans/')) {
      return Promise.resolve({ ok: true, json: async () => ({ ok: true, plan: null }) });
    }
    if (url.includes('tco-trend-snapshots')) {
      if (opts?.method === 'POST') {
        onPost(JSON.parse((opts.body as string) || '{}'));
        return Promise.resolve({ ok: true, json: async () => ({ ok: true, snapshot: {} }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ ok: true, snapshots: trendSnapshots }) });
    }
    if (url.includes('tco-analyses')) {
      return Promise.resolve({ ok: true, json: async () => ({ ok: true, analyses: [] }) });
    }
    return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

beforeEach(() => {
  localStorage.clear();
  mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false, loading: false });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  cleanup();
});

describe('ProcurementToolsSection — TCO trend history, guest', () => {
  it('shows the sign-in prompt and never fetches /tco-trend-snapshots', async () => {
    const fetchMock = stubFetch();
    render(<ProcurementToolsSection isAr={false} />);
    goToTco();
    expect(screen.getByText(/Sign in to track this analysis.s best TCO\/unit/i)).toBeInTheDocument();
    await new Promise(r => setTimeout(r, 20));
    expect(fetchMock.mock.calls.some(c => String(c[0]).includes('tco-trend-snapshots'))).toBe(false);
  });
});

describe('ProcurementToolsSection — TCO trend history, logged in', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: { id: 1, fullName: 'Jane' }, isAuthenticated: true, loading: false });
  });

  it('shows the "builds automatically" placeholder with fewer than 2 snapshots', async () => {
    stubFetch({ trendSnapshots: [{ id: 1, month: '2026-08', bestTcoPerUnit: '115.00', bestSupplierName: 'Supplier A', savingsPct: null }] });
    render(<ProcurementToolsSection isAr={false} />);
    goToTco();
    await waitFor(() => {
      expect(screen.getByText(/trend builds automatically/i)).toBeInTheDocument();
    });
  });

  it('renders the trend chart section with 2+ saved snapshots', async () => {
    stubFetch({
      trendSnapshots: [
        { id: 1, month: '2026-07', bestTcoPerUnit: '120.00', bestSupplierName: 'Supplier A', savingsPct: '5.0' },
        { id: 2, month: '2026-08', bestTcoPerUnit: '115.00', bestSupplierName: 'Supplier A', savingsPct: '8.0' },
      ],
    });
    render(<ProcurementToolsSection isAr={false} />);
    goToTco();
    await waitFor(() => {
      expect(screen.queryByText(/trend builds automatically/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Sign in to track/i)).not.toBeInTheDocument();
    });
    expect(screen.getByText(/TCO trend history/i)).toBeInTheDocument();
  });

  it('auto-fires a POST to /tco-trend-snapshots with the expected payload once the analysis has valid data', async () => {
    const onPost = vi.fn();
    stubFetch({ onPost });
    const { container } = render(<ProcurementToolsSection isAr={false} />);
    goToTco();
    enterValidCostData(container);

    await waitFor(() => {
      expect(onPost).toHaveBeenCalled();
    });
    const body = onPost.mock.calls[0][0];
    expect(body.analysisClientKey).toBeTruthy();
    expect(body.analysisName).toBeTruthy();
    expect(typeof body.bestTcoPerUnit).toBe('number');
    expect(body.bestTcoPerUnit).toBeGreaterThan(0);
  });

  it('does not refire the snapshot POST for an edit that keeps the same rounded value in the same month', async () => {
    const onPost = vi.fn();
    stubFetch({ onPost });
    const { container } = render(<ProcurementToolsSection isAr={false} />);
    goToTco();
    enterValidCostData(container);
    await waitFor(() => expect(onPost).toHaveBeenCalledTimes(1));

    // Rename the analysis (an edit that doesn't change bestTcoPerUnit) --
    // should not trigger a second snapshot POST.
    const nameInput = screen.getByLabelText(/Analysis name/i);
    fireEvent.change(nameInput, { target: { value: 'Renamed analysis' } });
    await new Promise(r => setTimeout(r, 20));
    expect(onPost).toHaveBeenCalledTimes(1);
  });
});
