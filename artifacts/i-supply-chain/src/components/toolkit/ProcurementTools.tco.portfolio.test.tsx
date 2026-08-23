/**
 * ProcurementToolsSection — TCO Engine Portfolio comparison view (#163,
 * "TCO max-enhance: cross-item portfolio comparison view", 2026-08-23).
 *
 * Directly answers the earlier honest-assessment gap: the TCO Engine could
 * only compare suppliers WITHIN one item, never items/categories AGAINST
 * each other. These tests confirm the new Portfolio view actually does
 * that cross-item comparison with real, correctly-computed numbers -- not
 * just that the toggle renders.
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { ProcurementToolsSection } from './ProcurementTools';

class ResizeObserverStub { observe() {} unobserve() {} disconnect() {} }
(globalThis as any).ResizeObserver = ResizeObserverStub;

beforeEach(() => { localStorage.clear(); });
afterEach(() => { cleanup(); });

function goToTco() {
  fireEvent.click(screen.getByRole('tab', { name: /TCO Engine/i }));
}

function fillActiveAnalysisSupplierA(container: HTMLElement, unitPrice: string, qty: string, vat = '0') {
  const table = container.querySelector('table')!;
  const rows = within(table).getAllByRole('row');
  const unitPriceRow = rows.find(r => within(r).queryByText(/Unit purchase price/i))!;
  const qtyRow = rows.find(r => within(r).queryByText(/Annual quantity/i))!;
  const vatRow = rows.find(r => within(r).queryByText(/^VAT/i))!;
  fireEvent.change(within(vatRow).getAllByRole('spinbutton')[0], { target: { value: vat } });
  fireEvent.change(within(unitPriceRow).getAllByRole('spinbutton')[0], { target: { value: unitPrice } });
  fireEvent.change(within(qtyRow).getAllByRole('spinbutton')[0], { target: { value: qty } });
}

describe('ProcurementToolsSection — TCO Portfolio comparison view (#163)', () => {
  it('defaults to Single analysis view, with the Portfolio toggle showing a count of 1', () => {
    render(<ProcurementToolsSection isAr={false} />);
    goToTco();
    expect(screen.getByRole('button', { name: /Portfolio comparison \(1\)/i })).toBeInTheDocument();
    // Single-analysis-only UI (the analysis switcher) is visible by default.
    expect(screen.getByLabelText(/^Analysis:$/i)).toBeInTheDocument();
  });

  it('lists every saved analysis with its own correctly-computed best-supplier TCO once switched to Portfolio view', () => {
    const { container } = render(<ProcurementToolsSection isAr={false} />);
    goToTco();

    // Analysis 1 ("New analysis"): unit price 100, qty 10, VAT 0% -> TCO/unit = 100.00
    fillActiveAnalysisSupplierA(container, '100', '10');

    // Add a second analysis and give it different numbers so the two rows
    // must show DIFFERENT figures if the portfolio is really per-analysis.
    fireEvent.click(screen.getByRole('button', { name: /^New$/i }));
    // Second analysis's item name, so we can identify its row later.
    fireEvent.change(screen.getByLabelText(/^Item name$/i), { target: { value: 'Bearing 6205-ZZ' } });
    fillActiveAnalysisSupplierA(container, '50', '10'); // TCO/unit = 50.00

    fireEvent.click(screen.getByRole('button', { name: /Portfolio comparison \(2\)/i }));

    // Both rows present.
    const table = container.querySelector('table')!;
    const rows = within(table).getAllByRole('row');
    const row1 = rows.find(r => within(r).queryByText('New analysis'))!;
    const row2 = rows.find(r => within(r).queryByText('Bearing 6205-ZZ'))!;
    expect(row1).toBeTruthy();
    expect(row2).toBeTruthy();

    expect(within(row1).getByText(/^SAR 100(\.00)?$/)).toBeInTheDocument();
    expect(within(row2).getByText(/^SAR 50(\.00)?$/)).toBeInTheDocument();
  });

  it('shows "no data yet" for an analysis with no cost entered, without crashing', () => {
    const { container } = render(<ProcurementToolsSection isAr={false} />);
    goToTco();
    fireEvent.click(screen.getByRole('button', { name: /Portfolio comparison \(1\)/i }));
    const table = container.querySelector('table')!;
    expect(within(table).getByText(/no data yet/i)).toBeInTheDocument();
  });

  it('computes savings potential as the % gap between the best and costliest supplier within the same analysis', () => {
    const { container } = render(<ProcurementToolsSection isAr={false} />);
    goToTco();
    const table = container.querySelector('table')!;
    const rows = within(table).getAllByRole('row');
    const unitPriceRow = rows.find(r => within(r).queryByText(/Unit purchase price/i))!;
    const qtyRow = rows.find(r => within(r).queryByText(/Annual quantity/i))!;
    const vatRow = rows.find(r => within(r).queryByText(/^VAT/i))!;
    const vatInputs = within(vatRow).getAllByRole('spinbutton');
    fireEvent.change(vatInputs[0], { target: { value: '0' } });
    fireEvent.change(vatInputs[1], { target: { value: '0' } });
    const priceInputs = within(unitPriceRow).getAllByRole('spinbutton');
    const qtyInputs = within(qtyRow).getAllByRole('spinbutton');
    // Supplier A: 100/unit, Supplier B: 50/unit -> best=50, worst=100, savings = 50%.
    fireEvent.change(priceInputs[0], { target: { value: '100' } });
    fireEvent.change(qtyInputs[0], { target: { value: '10' } });
    fireEvent.change(priceInputs[1], { target: { value: '50' } });
    fireEvent.change(qtyInputs[1], { target: { value: '10' } });

    fireEvent.click(screen.getByRole('button', { name: /Portfolio comparison \(1\)/i }));
    expect(screen.getByText(/50\.0%/)).toBeInTheDocument();
  });

  it('"Open" on a portfolio row switches back to Single analysis view with that analysis active', () => {
    const { container } = render(<ProcurementToolsSection isAr={false} />);
    goToTco();
    fillActiveAnalysisSupplierA(container, '100', '10');

    fireEvent.click(screen.getByRole('button', { name: /^New$/i }));
    fireEvent.change(screen.getByLabelText(/^Analysis name$/i), { target: { value: 'Second Item Analysis' } });
    fillActiveAnalysisSupplierA(container, '50', '10');

    // Go back to the first analysis via the switcher so we're not already on it,
    // then open it from the portfolio table to prove the click actually switches.
    fireEvent.change(screen.getByLabelText(/^Analysis:$/i), { target: { value: (screen.getByLabelText(/^Analysis:$/i) as HTMLSelectElement).options[0].value } });

    fireEvent.click(screen.getByRole('button', { name: /Portfolio comparison \(2\)/i }));
    const table = container.querySelector('table')!;
    const row2 = within(table).getAllByRole('row').find(r => within(r).queryByText('Second Item Analysis'))!;
    fireEvent.click(within(row2).getByRole('button', { name: /Open/i }));

    // Back on Single analysis view, with "Second Item Analysis" as the active one.
    expect(screen.getByLabelText(/^Analysis:$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Analysis name$/i)).toHaveValue('Second Item Analysis');
  });

  it('exports the portfolio as a downloadable CSV via the Export portfolio button', () => {
    const clickSpy = vi.fn();
    const origCreateObjectURL = (globalThis as any).URL.createObjectURL;
    (globalThis as any).URL.createObjectURL = vi.fn(() => 'blob:mock');
    (globalThis as any).URL.revokeObjectURL = vi.fn();
    const origCreateElement = document.createElement.bind(document);
    document.createElement = ((tag: string) => {
      const el = origCreateElement(tag);
      if (tag === 'a') { el.click = clickSpy; }
      return el;
    }) as any;

    render(<ProcurementToolsSection isAr={false} />);
    goToTco();
    fireEvent.click(screen.getByRole('button', { name: /Portfolio comparison \(1\)/i }));
    fireEvent.click(screen.getByRole('button', { name: /Export portfolio/i }));
    expect(clickSpy).toHaveBeenCalled();

    document.createElement = origCreateElement;
    (globalThis as any).URL.createObjectURL = origCreateObjectURL;
  });
});
