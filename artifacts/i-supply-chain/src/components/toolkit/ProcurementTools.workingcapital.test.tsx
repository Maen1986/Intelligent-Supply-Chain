/**
 * ProcurementToolsSection — Working Capital Control Tower (#169, Wave B-3,
 * 2026-08-23).
 *
 * Covers:
 *  - Tab renders with default inputs and computes CCC = DIO + DSO - DPO
 *    correctly, plus the CCC dollar impact = CCC x (Annual COGS / 365).
 *  - The three cash levers are shown separately and are never summed into
 *    one blended total (honesty note is present).
 *  - RAR cross-engine exposure (#174 wiring): shows "Not yet run" when the
 *    client has no saved Resiliency-toolkit RAR data.
 *  - RAR cross-engine exposure: surfaces the real figure once the client
 *    has saved RAR nodes + meta in localStorage (read-only cross-engine
 *    read, same pattern as the TCO Engine's Supplier Scorecard read).
 *  - Server sync: a logged-in user's edit fires a PUT to
 *    /working-capital-analyses with the expected payload shape.
 *  - Guest (no session): edits stay local-only, no PUT fires.
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

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

function goToWorkingCapital() {
  fireEvent.click(screen.getByRole('tab', { name: /Working Capital/i }));
}

function stubFetch({ onPut = (_url: string, _body: any) => {} } = {}) {
  const fetchMock = vi.fn((url: string, opts?: RequestInit) => {
    if (url.includes('/plans/')) {
      return Promise.resolve({ ok: true, json: async () => ({ ok: true, plan: null }) });
    }
    if (url.includes('working-capital-analyses')) {
      if (opts?.method === 'PUT') {
        onPut(url, JSON.parse((opts.body as string) || '{}'));
        return Promise.resolve({ ok: true, json: async () => ({ ok: true, analyses: [] }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ ok: true, analyses: [] }) });
    }
    if (url.includes('tco-analyses') || url.includes('tco-trend-snapshots')) {
      return Promise.resolve({ ok: true, json: async () => ({ ok: true, analyses: [], snapshots: [] }) });
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

describe('ProcurementToolsSection — Working Capital Control Tower, core calculator', () => {
  it('computes CCC = DIO + DSO - DPO and the CCC dollar impact', async () => {
    stubFetch();
    render(<ProcurementToolsSection isAr={false} />);
    goToWorkingCapital();

    fireEvent.change(screen.getByLabelText('DIO'), { target: { value: '62' } });
    fireEvent.change(screen.getByLabelText('DSO'), { target: { value: '48' } });
    fireEvent.change(screen.getByLabelText('DPO'), { target: { value: '35' } });
    fireEvent.change(screen.getByLabelText(/Annual COGS/i), { target: { value: '18500000' } });

    // CCC = 62 + 48 - 35 = 75 days
    await waitFor(() => {
      expect(screen.getByText(/CCC 75\.0 days/i)).toBeInTheDocument();
    });
    // CCC dollar impact = 75 * (18,500,000 / 365) = 3,801,369.86...
    expect(screen.getAllByText(/SAR 3,801,370/).length).toBeGreaterThan(0);
  });

  it('shows the three cash levers separately with a never-summed honesty note', async () => {
    stubFetch();
    render(<ProcurementToolsSection isAr={false} />);
    goToWorkingCapital();
    expect(screen.getByText(/1\. Inventory value/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. CCC dollar impact/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. Revenue-at-Risk exposure/i)).toBeInTheDocument();
    expect(screen.getByText(/never added together/i)).toBeInTheDocument();
  });
});

describe('ProcurementToolsSection — Working Capital Control Tower, RAR cross-engine wiring (#174)', () => {
  it('shows "Not yet run" when the client has no saved RAR data', async () => {
    stubFetch();
    render(<ProcurementToolsSection isAr={false} />);
    goToWorkingCapital();
    expect(screen.getByText(/Not yet run/i)).toBeInTheDocument();
    expect(screen.getByText(/Run the Revenue-at-Risk \(RAR\) calculator/i)).toBeInTheDocument();
  });

  it('surfaces the real RAR exposure figure once the client has saved RAR data', async () => {
    localStorage.setItem('isc-tool-resiliency-rar-nodes-v1', JSON.stringify([
      { id: 'n1', name: 'Port of Jeddah', revenuePct: 40, atRisk: true },
    ]));
    localStorage.setItem('isc-tool-resiliency-rar-meta-v1', JSON.stringify({
      interdependenciesMapped: true, annualRevenue: '10000000',
    }));
    stubFetch();
    render(<ProcurementToolsSection isAr={false} />);
    goToWorkingCapital();
    // interdependenciesMapped=true -> no correction -> rawExposurePct=40%
    // dollarAtMedian = 0.40 * 10,000,000 * (6/365) = 65,753.42...
    await waitFor(() => {
      expect(screen.queryByText(/Not yet run/i)).not.toBeInTheDocument();
    });
    expect(screen.getByText(/SAR 65,753/)).toBeInTheDocument();
  });
});

describe('ProcurementToolsSection — Working Capital Control Tower, server sync', () => {
  it('guest edits stay local-only (no PUT fires)', async () => {
    const onPut = vi.fn();
    const fetchMock = stubFetch({ onPut });
    render(<ProcurementToolsSection isAr={false} />);
    goToWorkingCapital();
    fireEvent.change(screen.getByLabelText(/Inventory value/i), { target: { value: '4200000' } });
    await new Promise(r => setTimeout(r, 500));
    expect(onPut).not.toHaveBeenCalled();
    expect(fetchMock.mock.calls.some(c => String(c[0]).includes('working-capital-analyses'))).toBe(false);
  });

  it('a logged-in user\'s edit fires a PUT to /working-capital-analyses with the expected payload', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 1, fullName: 'Jane' }, isAuthenticated: true, loading: false });
    const onPut = vi.fn();
    stubFetch({ onPut });
    render(<ProcurementToolsSection isAr={false} />);
    goToWorkingCapital();
    fireEvent.change(screen.getByLabelText(/Inventory value/i), { target: { value: '4200000' } });

    await waitFor(() => expect(onPut).toHaveBeenCalled());
    const [, body] = onPut.mock.calls[onPut.mock.calls.length - 1];
    expect(Array.isArray(body.analyses)).toBe(true);
    expect(body.analyses[0].inventoryValue).toBe(4200000);
    expect(body.analyses[0].clientKey).toBeTruthy();
  });
});
