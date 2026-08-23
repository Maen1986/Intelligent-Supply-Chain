/**
 * ProcurementToolsSection — TCO Engine server-sync tests (#168 v3, 2026-08-23).
 *
 * Mirrors SupplierScorecard.server-sync.test.tsx's pattern for the TCO
 * Engine's whole-list sync against /api/tco-analyses:
 *  1. Logged-out: no fetch is made, localStorage is used directly.
 *  2. Logged-in, server has analyses: server data replaces local state.
 *  3. Logged-in, server has none: local analyses are uploaded via PUT.
 *  4. Sync status cycles idle -> saving -> saved on a successful PUT.
 *  5. Sync status cycles idle -> saving -> error on a failed PUT.
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, within } from '@testing-library/react';

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));

const mockUseAuth = vi.fn(() => ({
  user: { id: 1, fullName: 'Jane' } as { id: number; fullName: string } | null,
  isAuthenticated: true,
  loading: false,
}));
vi.mock('@/lib/AuthContext', () => ({ useAuth: () => mockUseAuth() }));

import { ProcurementToolsSection } from './ProcurementTools';

const SK_TCO_V2 = 'isc-tool-catmgmt-tco-v2';

class ResizeObserverStub { observe() {} unobserve() {} disconnect() {} }
(globalThis as any).ResizeObserver = ResizeObserverStub;

function goToTco() {
  fireEvent.click(screen.getByRole('tab', { name: /TCO Engine/i }));
}

const SERVER_ANALYSIS = {
  id: 99, clientKey: 'srv-key-1', name: 'Server Analysis', industry: null,
  subSector: null, skuClass: null, itemName: null,
  suppliers: [{ id: 'srv-s1', name: 'Server Supplier', unitPrice: 0, annualQty: 0, vatPct: 15, dutyPct: 0,
    freight: 0, insurance: 0, handling: 0, lastMile: 0, safetyStockDays: 0, carryingCostPct: 25,
    inspectionCost: 0, defectPpm: 0, reworkCost: 0, auditCost: 0, poCount: 0, poCostEach: 0,
    invoiceProcessingCost: 0, disposalCost: 0, contractExitCost: 0 }],
  updatedAt: '2026-08-23T00:00:00.000Z',
};

// ProcurementToolsSection also calls useAIPlan() unconditionally (for the AI
// Strategy Brief tab), which fires its own fetch to `/plans/<toolKey>` on
// mount whenever the mocked user is authenticated. That call races the TCO
// bootstrap GET, so the mock must route by URL rather than by call order --
// otherwise whichever effect happens to call fetch() first "steals" the
// response meant for the other endpoint.
function stubFetch({ getOk = true, getAnalyses = [] as any[], putOk = true } = {}) {
  const fetchMock = vi.fn((url: string, opts?: RequestInit) => {
    if (url.includes('/plans/')) {
      // Unrelated saved-AI-plan lookup fired by useAIPlan() -- always answer
      // "no saved plan" so it never interferes with the TCO assertions.
      return Promise.resolve({ ok: true, json: async () => ({ ok: true, plan: null }) });
    }
    if (url.includes('tco-analyses')) {
      if (opts?.method === 'PUT') {
        return Promise.resolve({ ok: putOk, json: async () => ({ ok: putOk, analyses: [] }) });
      }
      return Promise.resolve({ ok: getOk, json: async () => ({ ok: getOk, analyses: getAnalyses }) });
    }
    return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

beforeEach(() => {
  localStorage.clear();
  mockUseAuth.mockReturnValue({ user: { id: 1, fullName: 'Jane' }, isAuthenticated: true, loading: false });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  cleanup();
});

describe('TCO Engine — bootstrap, no authenticated user', () => {
  it('makes no fetch and uses localStorage directly', () => {
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false, loading: false });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { container } = render(<ProcurementToolsSection isAr={false} />);
    goToTco();

    expect(fetchMock).not.toHaveBeenCalled();
    // Scoped to the main cost table -- the #164 sensitivity-analysis supplier
    // picker is a <select> that also legitimately displays a supplier name.
    const table = container.querySelector('table')!;
    expect(within(table).getByDisplayValue('Supplier A')).toBeInTheDocument();
  });
});

describe('TCO Engine — bootstrap, server has analyses', () => {
  it('replaces local state with the server analyses on mount', async () => {
    stubFetch({ getAnalyses: [SERVER_ANALYSIS] });
    const { container } = render(<ProcurementToolsSection isAr={false} />);
    goToTco();

    // Scoped to the main cost table -- the #164 sensitivity-analysis supplier
    // picker is a <select> that also legitimately displays a supplier name.
    await waitFor(() => {
      const table = container.querySelector('table')!;
      expect(within(table).getByDisplayValue('Server Supplier')).toBeInTheDocument();
    });
    const table = container.querySelector('table')!;
    expect(within(table).queryByDisplayValue('Supplier A')).not.toBeInTheDocument();
  });
});

describe('TCO Engine — bootstrap, server has no analyses', () => {
  it('uploads the local analyses via PUT', async () => {
    const fetchMock = stubFetch({ getAnalyses: [] });
    render(<ProcurementToolsSection isAr={false} />);
    goToTco();

    await waitFor(() => {
      const calls = fetchMock.mock.calls as Array<[string, RequestInit]>;
      const putCall = calls.find(([url, opts]) => url.includes('tco-analyses') && opts?.method === 'PUT');
      expect(putCall).toBeDefined();
    });
  });
});

describe('TCO Engine — sync status indicator', () => {
  it('shows "Synced to server" after a successful edit-triggered PUT', async () => {
    stubFetch({ getAnalyses: [] });
    render(<ProcurementToolsSection isAr={false} />);
    goToTco();

    // Let bootstrap settle first (it fires its own PUT for the empty-server case).
    await waitFor(() => expect(screen.getByText(/Saved to your account|Synced to server/i)).toBeInTheDocument());

    const nameInputs = screen.getAllByDisplayValue(/Supplier [AB]/);
    fireEvent.change(nameInputs[0], { target: { value: 'Acme Corp' } });

    await waitFor(() => expect(screen.getByText(/Synced to server/i)).toBeInTheDocument());
  });

  it('shows "Sync failed" when the PUT fails', async () => {
    stubFetch({ getAnalyses: [], putOk: false });
    render(<ProcurementToolsSection isAr={false} />);
    goToTco();

    const nameInputs = screen.getAllByDisplayValue(/Supplier [AB]/);
    fireEvent.change(nameInputs[0], { target: { value: 'Acme Corp' } });

    await waitFor(() => expect(screen.getByText(/Sync failed/i)).toBeInTheDocument());
  });
});
