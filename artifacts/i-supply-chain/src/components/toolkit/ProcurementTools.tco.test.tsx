/**
 * ProcurementToolsSection — TCO Engine tab (#168, 2026-08-23).
 *
 * Confirms the live interactive TCO calculator (mirroring the RAR calculator's
 * pattern in ResiliencyTools.tsx) actually computes real numbers from real
 * inputs, tags the lowest per-unit TCO, persists to localStorage, and supports
 * add/remove supplier rows up to the 5-supplier cap.
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { ProcurementToolsSection } from './ProcurementTools';

const SK_TCO = 'isc-tool-catmgmt-tco-v1';

class ResizeObserverStub { observe() {} unobserve() {} disconnect() {} }
(globalThis as any).ResizeObserver = ResizeObserverStub;

beforeEach(() => { localStorage.clear(); });
afterEach(() => { cleanup(); });

function goToTco() {
  fireEvent.click(screen.getByRole('tab', { name: /TCO Engine/i }));
}

describe('ProcurementToolsSection — TCO Engine tab', () => {
  it('starts with two supplier columns (A and B)', () => {
    const { container } = render(<ProcurementToolsSection isAr={false} />);
    goToTco();
    const nameInputs = within(container).getAllByDisplayValue(/Supplier [AB]/);
    expect(nameInputs.length).toBe(2);
  });

  it('computes TCO per unit correctly from entered direct-cost inputs', () => {
    const { container } = render(<ProcurementToolsSection isAr={false} />);
    goToTco();
    const table = container.querySelector('table')!;
    const rows = within(table).getAllByRole('row');
    const unitPriceRow = rows.find(r => within(r).queryByText(/Unit purchase price/i))!;
    const qtyRow = rows.find(r => within(r).queryByText(/Annual quantity/i))!;

    fireEvent.change(within(unitPriceRow).getAllByRole('spinbutton')[0], { target: { value: '100' } });
    fireEvent.change(within(qtyRow).getAllByRole('spinbutton')[0], { target: { value: '10' } });

    // direct purchase = 100*10 = 1000; + VAT 15% (150) = 1150; TCO per unit = 115.00
    // TCO per unit appears in the tfoot row labelled "TCO per unit".
    const tfoot = table.querySelector('tfoot')!;
    const perUnitRow = within(tfoot).getAllByRole('row').find(r => within(r).queryByText(/TCO per unit/i))!;
    expect(within(perUnitRow).getByText(/SAR 115(\.00)?/)).toBeInTheDocument();
  });

  it('tags the lowest TCO-per-unit supplier once both have data', () => {
    const { container } = render(<ProcurementToolsSection isAr={false} />);
    goToTco();
    const table = container.querySelector('table')!;
    const rows = within(table).getAllByRole('row');
    const unitPriceRow = rows.find(r => within(r).queryByText(/Unit purchase price/i))!;
    const qtyRow = rows.find(r => within(r).queryByText(/Annual quantity/i))!;
    const vatRow = rows.find(r => within(r).queryByText(/^VAT/i))!;

    const priceInputs = within(unitPriceRow).getAllByRole('spinbutton') as HTMLInputElement[];
    const qtyInputs = within(qtyRow).getAllByRole('spinbutton') as HTMLInputElement[];
    const vatInputs = within(vatRow).getAllByRole('spinbutton') as HTMLInputElement[];

    fireEvent.change(vatInputs[0], { target: { value: '0' } });
    fireEvent.change(vatInputs[1], { target: { value: '0' } });
    fireEvent.change(priceInputs[0], { target: { value: '100' } });
    fireEvent.change(qtyInputs[0], { target: { value: '10' } });
    fireEvent.change(priceInputs[1], { target: { value: '50' } });
    fireEvent.change(qtyInputs[1], { target: { value: '10' } });

    expect(within(table).getByText('(lowest)')).toBeInTheDocument();
  });

  it('persists supplier rows to localStorage under SK_TCO', () => {
    const { container } = render(<ProcurementToolsSection isAr={false} />);
    goToTco();
    const table = container.querySelector('table')!;
    const nameInputs = within(table).getAllByDisplayValue(/Supplier [AB]/) as HTMLInputElement[];
    fireEvent.change(nameInputs[0], { target: { value: 'Acme Corp' } });

    const stored = JSON.parse(localStorage.getItem(SK_TCO) || '[]');
    expect(stored[0].name).toBe('Acme Corp');
  });

  it('adds a supplier column up to the 5-supplier cap', () => {
    const { container } = render(<ProcurementToolsSection isAr={false} />);
    goToTco();
    const addButton = screen.getByRole('button', { name: /Add supplier/i });
    fireEvent.click(addButton); // 3
    fireEvent.click(addButton); // 4
    fireEvent.click(addButton); // 5
    let table = container.querySelector('table')!;
    expect(within(table).getAllByDisplayValue(/Supplier [A-E]/).length).toBe(5);
    expect(addButton).toBeDisabled();
  });

  it('removes a supplier column when its trash icon is clicked', () => {
    const { container } = render(<ProcurementToolsSection isAr={false} />);
    goToTco();
    let table = container.querySelector('table')!;
    const removeButtons = within(table).getAllByLabelText(/Remove supplier/i);
    fireEvent.click(removeButtons[0]);
    table = container.querySelector('table')!;
    expect(within(table).getAllByDisplayValue(/Supplier [AB]/).length).toBe(1);
  });

  it('shows the single-source-risk honesty caveat once two suppliers have real TCO data', () => {
    const { container } = render(<ProcurementToolsSection isAr={false} />);
    goToTco();
    // No caveat before any data is entered
    expect(screen.queryByText(/not automatically the right choice/i)).toBeNull();

    const table = container.querySelector('table')!;
    const rows = within(table).getAllByRole('row');
    const unitPriceRow = rows.find(r => within(r).queryByText(/Unit purchase price/i))!;
    const qtyRow = rows.find(r => within(r).queryByText(/Annual quantity/i))!;
    const priceInputs = within(unitPriceRow).getAllByRole('spinbutton') as HTMLInputElement[];
    const qtyInputs = within(qtyRow).getAllByRole('spinbutton') as HTMLInputElement[];

    fireEvent.change(priceInputs[0], { target: { value: '100' } });
    fireEvent.change(qtyInputs[0], { target: { value: '10' } });
    fireEvent.change(priceInputs[1], { target: { value: '80' } });
    fireEvent.change(qtyInputs[1], { target: { value: '10' } });

    expect(screen.getByText(/not automatically the right choice/i)).toBeInTheDocument();
  });
});
