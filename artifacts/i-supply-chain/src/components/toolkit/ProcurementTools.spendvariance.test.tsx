/**
 * ProcurementToolsSection — Opportunity / Spend Variance Finder (#170,
 * Wave B-3, 2026-08-23).
 *
 * Covers:
 *  - Purchase Price Variance (PPV) math: landed unit cost, benchmark
 *    identification (lowest landed cost), PPV/unit, and addressable
 *    opportunity per site are computed correctly.
 *  - The benchmark row is visually labeled "Benchmark".
 *  - MOQ feasibility flag: shown when the benchmark site's stated MOQ
 *    exceeds the volume that would redirect to it; absent otherwise.
 *  - Cross-engine wiring (#178): importing from a saved TCO Engine
 *    analysis populates the site rows with the TCO Engine's real supplier
 *    prices (unit price, freight normalized, quality-cost normalized,
 *    annual quantity) -- never auto-applied, only on explicit selection.
 *  - Server sync: a logged-in user's edit fires a PUT to
 *    /spend-variance-analyses; a guest's edits stay local-only.
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

function goToSpendVariance() {
  fireEvent.click(screen.getByRole('tab', { name: /Spend Variance/i }));
}

function stubFetch({ onPut = (_url: string, _body: any) => {} } = {}) {
  const fetchMock = vi.fn((url: string, opts?: RequestInit) => {
    if (url.includes('/plans/')) {
      return Promise.resolve({ ok: true, json: async () => ({ ok: true, plan: null }) });
    }
    if (url.includes('spend-variance-analyses')) {
      if (opts?.method === 'PUT') {
        onPut(url, JSON.parse((opts.body as string) || '{}'));
        return Promise.resolve({ ok: true, json: async () => ({ ok: true, analyses: [] }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ ok: true, analyses: [] }) });
    }
    if (url.includes('tco-analyses') || url.includes('tco-trend-snapshots') || url.includes('working-capital-analyses')) {
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

describe('ProcurementToolsSection — Spend Variance Finder, PPV math', () => {
  it('computes landed cost, benchmark, PPV/unit, and addressable opportunity correctly', async () => {
    stubFetch();
    render(<ProcurementToolsSection isAr={false} />);
    goToSpendVariance();

    // Row 0 = Site A, Row 1 = Site B (default two rows)
    fireEvent.change(screen.getAllByLabelText('Unit price')[0], { target: { value: '100' } });
    fireEvent.change(screen.getAllByLabelText('Freight per unit')[0], { target: { value: '5' } });
    fireEvent.change(screen.getAllByLabelText('Annual quantity')[0], { target: { value: '1000' } });

    fireEvent.change(screen.getAllByLabelText('Unit price')[1], { target: { value: '110' } });
    fireEvent.change(screen.getAllByLabelText('Freight per unit')[1], { target: { value: '2' } });
    fireEvent.change(screen.getAllByLabelText('Quality adjustment per unit')[1], { target: { value: '1' } });
    fireEvent.change(screen.getAllByLabelText('Annual quantity')[1], { target: { value: '500' } });

    // Site A landed = 100 + 5 = 105 (benchmark, lowest)
    // Site B landed = 110 + 2 + 1 = 113; PPV/unit = 113 - 105 = 8; opportunity = 8 * 500 = 4000
    await waitFor(() => {
      expect(screen.getAllByText(/Benchmark/i).length).toBeGreaterThan(0);
    });
    expect(screen.getByText('SAR 105.00')).toBeInTheDocument();
    expect(screen.getByText('SAR 113.00')).toBeInTheDocument();
    expect(screen.getByText('SAR 8.00')).toBeInTheDocument();
    expect(screen.getAllByText(/SAR 4,000/).length).toBeGreaterThan(0);
  });

  it('shows the MOQ feasibility flag when the benchmark site cannot absorb the redirected volume', async () => {
    stubFetch();
    render(<ProcurementToolsSection isAr={false} />);
    goToSpendVariance();

    fireEvent.change(screen.getAllByLabelText('Unit price')[0], { target: { value: '100' } });
    fireEvent.change(screen.getAllByLabelText('Annual quantity')[0], { target: { value: '1000' } });
    fireEvent.change(screen.getAllByLabelText('MOQ')[0], { target: { value: '2000' } });

    fireEvent.change(screen.getAllByLabelText('Unit price')[1], { target: { value: '110' } });
    fireEvent.change(screen.getAllByLabelText('Annual quantity')[1], { target: { value: '500' } });

    // Site A is the benchmark (100 < 110). Redirectable qty = site B's 500,
    // which is below site A's stated MOQ of 2000 -> flag should appear.
    await waitFor(() => {
      expect(screen.getByText(/Feasibility flag/i)).toBeInTheDocument();
    });
  });

  it('does not show the MOQ feasibility flag when the benchmark site has no MOQ set', async () => {
    stubFetch();
    render(<ProcurementToolsSection isAr={false} />);
    goToSpendVariance();

    fireEvent.change(screen.getAllByLabelText('Unit price')[0], { target: { value: '100' } });
    fireEvent.change(screen.getAllByLabelText('Annual quantity')[0], { target: { value: '1000' } });
    fireEvent.change(screen.getAllByLabelText('Unit price')[1], { target: { value: '110' } });
    fireEvent.change(screen.getAllByLabelText('Annual quantity')[1], { target: { value: '500' } });

    await waitFor(() => {
      expect(screen.getAllByText(/Benchmark/i).length).toBeGreaterThan(0);
    });
    expect(screen.queryByText(/Feasibility flag/i)).not.toBeInTheDocument();
  });
});

describe('ProcurementToolsSection — Spend Variance Finder, cross-engine TCO import (#178)', () => {
  it('does not show the import control when no TCO analysis has real supplier data', async () => {
    stubFetch();
    render(<ProcurementToolsSection isAr={false} />);
    goToSpendVariance();
    expect(screen.queryByLabelText(/Import from TCO Engine/i)).not.toBeInTheDocument();
  });

  it('populates rows from a saved TCO Engine analysis on explicit import selection', async () => {
    localStorage.setItem('isc-tool-catmgmt-tco-v2', JSON.stringify({
      analyses: [{
        id: 'tcoa_test1', name: 'Bearing comparison', industry: '', subSector: '', skuClass: '', itemName: 'Bearing 6205-ZZ',
        suppliers: [
          {
            id: 's1', name: 'Supplier A', unitPrice: 50, annualQty: 2000, vatPct: 15, dutyPct: 0,
            freight: 2, insurance: 0.5, handling: 0.5, lastMile: 1,
            safetyStockDays: 0, carryingCostPct: 25,
            inspectionCost: 100, defectPpm: 0, reworkCost: 50, auditCost: 0,
            poCount: 0, poCostEach: 0, invoiceProcessingCost: 0,
            disposalCost: 0, contractExitCost: 0,
          },
          {
            id: 's2', name: 'Supplier B', unitPrice: 55, annualQty: 1000, vatPct: 15, dutyPct: 0,
            freight: 1, insurance: 0.2, handling: 0.3, lastMile: 0.5,
            safetyStockDays: 0, carryingCostPct: 25,
            inspectionCost: 0, defectPpm: 0, reworkCost: 0, auditCost: 0,
            poCount: 0, poCostEach: 0, invoiceProcessingCost: 0,
            disposalCost: 0, contractExitCost: 0,
          },
        ],
        updatedAt: Date.now(),
      }],
      activeId: 'tcoa_test1',
    }));
    stubFetch();
    render(<ProcurementToolsSection isAr={false} />);
    goToSpendVariance();

    const importSelect = await screen.findByLabelText(/Import from TCO Engine/i);
    fireEvent.change(importSelect, { target: { value: 'tcoa_test1' } });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Supplier A')).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue('Supplier B')).toBeInTheDocument();
    // Site row order follows tco.suppliers order: Supplier A first.
    expect((screen.getAllByLabelText('Unit price')[0] as HTMLInputElement).value).toBe('50');
    // freightPerUnit = freight + insurance + handling + lastMile = 2+0.5+0.5+1 = 4
    expect((screen.getAllByLabelText('Freight per unit')[0] as HTMLInputElement).value).toBe('4');
    // qualityAdjPerUnit = (inspectionCost + reworkCost + auditCost) / annualQty = (100+50+0)/2000 = 0.075
    expect((screen.getAllByLabelText('Quality adjustment per unit')[0] as HTMLInputElement).value).toBe('0.075');
    expect((screen.getAllByLabelText('Annual quantity')[0] as HTMLInputElement).value).toBe('2000');
  });
});

describe('ProcurementToolsSection — Spend Variance Finder, server sync', () => {
  it('guest edits stay local-only (no PUT fires)', async () => {
    const onPut = vi.fn();
    const fetchMock = stubFetch({ onPut });
    render(<ProcurementToolsSection isAr={false} />);
    goToSpendVariance();
    fireEvent.change(screen.getAllByLabelText('Unit price')[0], { target: { value: '100' } });
    await new Promise(r => setTimeout(r, 500));
    expect(onPut).not.toHaveBeenCalled();
    expect(fetchMock.mock.calls.some(c => String(c[0]).includes('spend-variance-analyses'))).toBe(false);
  });

  it('a logged-in user\'s edit fires a PUT to /spend-variance-analyses with the expected payload', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 1, fullName: 'Jane' }, isAuthenticated: true, loading: false });
    const onPut = vi.fn();
    stubFetch({ onPut });
    render(<ProcurementToolsSection isAr={false} />);
    goToSpendVariance();
    fireEvent.change(screen.getAllByLabelText('Unit price')[0], { target: { value: '100' } });

    await waitFor(() => expect(onPut).toHaveBeenCalled());
    const [, body] = onPut.mock.calls[onPut.mock.calls.length - 1];
    expect(Array.isArray(body.analyses)).toBe(true);
    expect(Array.isArray(body.analyses[0].rows)).toBe(true);
    expect(body.analyses[0].rows[0].unitPrice).toBe(100);
    expect(body.analyses[0].clientKey).toBeTruthy();
  });
});
