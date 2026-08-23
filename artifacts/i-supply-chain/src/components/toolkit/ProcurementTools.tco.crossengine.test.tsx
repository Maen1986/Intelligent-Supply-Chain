/**
 * ProcurementToolsSection — TCO Engine wired into other engines (#165,
 * "TCO max-enhance: wire into other engines", 2026-08-23).
 *
 * Confirms three real cross-engine wires, not decorative mentions:
 *  1. Supplier Scorecard cross-link -- a TCO supplier whose name matches a
 *     saved Supplier Scorecard roster entry shows that REAL rating and can
 *     apply it into the TCO decision-scoring inputs on a literal click
 *     (Decision Record 8.7: "stand by a click", never auto-filled).
 *  2. Sourcing Strategy tab surfaces the biggest real TCO savings
 *     opportunity and can jump straight to the TCO Engine tab.
 *  3. The AI Category Strategy Brief prompt is grounded in real TCO data
 *     when it exists, instead of being estimated blind.
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, within, waitFor } from '@testing-library/react';

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));
const mockUseAuth = vi.fn(() => ({ user: null, isAuthenticated: false, loading: false }));
vi.mock('@/lib/AuthContext', () => ({ useAuth: () => mockUseAuth() }));

import { ProcurementToolsSection } from './ProcurementTools';

const SK_SPEND = 'isc-tool-catmgmt-spend-v2';
const ROSTER_KEY = 'isc-tool-supplier-roster';

class ResizeObserverStub { observe() {} unobserve() {} disconnect() {} }
(globalThis as any).ResizeObserver = ResizeObserverStub;

beforeEach(() => {
  localStorage.clear();
  mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false, loading: false });
});
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); cleanup(); });

function goToTco() {
  fireEvent.click(screen.getByRole('tab', { name: /TCO Engine/i }));
}
function goToStrategy() {
  fireEvent.click(screen.getByRole('tab', { name: /Sourcing Strategy/i }));
}

describe('ProcurementToolsSection — Supplier Scorecard cross-link (#165)', () => {
  it('shows the real Scorecard rating for a name-matched supplier and applies it on click', () => {
    localStorage.setItem(ROSTER_KEY, JSON.stringify({
      suppliers: [{
        id: 'sup-1', name: 'Supplier A', tier: 'Strategic',
        subScores: { quality: { defect: '90' }, delivery: { otif: '80' } },
      }],
      activeId: 'sup-1',
    }));

    render(<ProcurementToolsSection isAr={false} />);
    goToTco();

    expect(screen.getByText(/Scorecard rating 85\/100/i)).toBeInTheDocument();

    const qualitySelect = screen.getAllByLabelText(/qualQuality/i)[0] as HTMLSelectElement;
    const deliverySelect = screen.getAllByLabelText(/qualDelivery/i)[0] as HTMLSelectElement;
    expect(qualitySelect.value).toBe('3'); // neutral default before applying
    fireEvent.click(screen.getByRole('button', { name: /Apply rating/i }));
    // quality 90 -> round(90/20) = 5 (clamped); delivery 80 -> round(80/20) = 4
    expect(qualitySelect.value).toBe('5');
    expect(deliverySelect.value).toBe('4');
  });

  it('shows no cross-link callout when no scorecard supplier name matches', () => {
    localStorage.setItem(ROSTER_KEY, JSON.stringify({
      suppliers: [{ id: 'sup-1', name: 'Totally Different Co', tier: 'Strategic', subScores: {} }],
      activeId: 'sup-1',
    }));
    render(<ProcurementToolsSection isAr={false} />);
    goToTco();
    expect(screen.queryByText(/Matched against your saved Supplier Scorecard/i)).not.toBeInTheDocument();
  });
});

describe('ProcurementToolsSection — Sourcing Strategy TCO signal (#165)', () => {
  it('surfaces the biggest TCO savings opportunity and jumps to the TCO Engine tab', () => {
    const { container } = render(<ProcurementToolsSection isAr={false} />);
    goToTco();
    const table = container.querySelector('table')!;
    const rows = within(table).getAllByRole('row');
    const vatRow = rows.find(r => within(r).queryByText(/^VAT/i))!;
    const priceRow = rows.find(r => within(r).queryByText(/Unit purchase price/i))!;
    const qtyRow = rows.find(r => within(r).queryByText(/Annual quantity/i))!;
    within(vatRow).getAllByRole('spinbutton').forEach(el => fireEvent.change(el, { target: { value: '0' } }));
    const priceInputs = within(priceRow).getAllByRole('spinbutton');
    const qtyInputs = within(qtyRow).getAllByRole('spinbutton');
    fireEvent.change(priceInputs[0], { target: { value: '50' } });
    fireEvent.change(qtyInputs[0], { target: { value: '10' } });
    fireEvent.change(priceInputs[1], { target: { value: '100' } });
    fireEvent.change(qtyInputs[1], { target: { value: '10' } });

    goToStrategy();
    expect(screen.getByText(/Biggest TCO Engine savings opportunity/i)).toBeInTheDocument();
    expect(screen.getByText(/50\.0%/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Open TCO Engine/i }));
    expect(screen.getByRole('tabpanel', { name: /TCO Engine/i })).toBeInTheDocument();
  });

  it('shows no TCO signal when no TCO cost data has been entered', () => {
    render(<ProcurementToolsSection isAr={false} />);
    goToStrategy();
    expect(screen.queryByText(/Biggest TCO Engine savings opportunity/i)).not.toBeInTheDocument();
  });
});

describe('ProcurementToolsSection — AI Category Brief grounded in real TCO data (#165)', () => {
  it('includes the real TCO analysis in the generated prompt sent to the server', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 1, fullName: 'Jane' }, isAuthenticated: true, loading: false });
    localStorage.setItem(SK_SPEND, JSON.stringify([
      { id: 'r1', supplier: 'Acme', annualSpend: 100000, contracted: true },
      { id: 'r2', supplier: 'Globex', annualSpend: 50000, contracted: false },
    ]));

    const fetchMock = vi.fn((url: string, opts?: RequestInit) => {
      if (url.includes('/plans/')) return Promise.resolve({ ok: true, json: async () => ({ ok: true, plan: null }) });
      if (url.includes('/ai/plan')) return Promise.resolve({ ok: true, json: async () => ({ ok: true, text: 'ok' }) });
      return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
    });
    vi.stubGlobal('fetch', fetchMock);

    const { container } = render(<ProcurementToolsSection isAr={false} />);
    goToTco();
    const table = container.querySelector('table')!;
    const rows = within(table).getAllByRole('row');
    const vatRow = rows.find(r => within(r).queryByText(/^VAT/i))!;
    const priceRow = rows.find(r => within(r).queryByText(/Unit purchase price/i))!;
    const qtyRow = rows.find(r => within(r).queryByText(/Annual quantity/i))!;
    within(vatRow).getAllByRole('spinbutton').forEach(el => fireEvent.change(el, { target: { value: '0' } }));
    fireEvent.change(within(priceRow).getAllByRole('spinbutton')[0], { target: { value: '100' } });
    fireEvent.change(within(qtyRow).getAllByRole('spinbutton')[0], { target: { value: '10' } });

    fireEvent.click(screen.getByRole('tab', { name: /Spend Analysis/i }));
    fireEvent.click(screen.getByRole('tab', { name: /AI Strategy Brief/i }));
    fireEvent.click(screen.getByRole('button', { name: /Generate Category Strategy/i }));

    await waitFor(() => {
      const call = fetchMock.mock.calls.find(([url]) => (url as string).includes('/ai/plan'));
      expect(call).toBeDefined();
      const body = JSON.parse((call![1] as RequestInit).body as string);
      expect(body.prompt).toContain('TCO Engine data (real, user-entered)');
      expect(body.prompt).toContain('New analysis');
    });
  });
});
