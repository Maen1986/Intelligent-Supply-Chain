/**
 * ProcurementToolsSection — TCO Engine tab (#168, rebuilt v2, 2026-08-23).
 *
 * Confirms the rebuilt, category-aware TCO calculator: real arithmetic from
 * real inputs (unchanged from v1), the new multi-analysis save/switch model
 * (replacing the old single-instance-overwrite limitation), the new
 * End-of-life cost stage, the v1-to-v2 localStorage migration path, and the
 * grounded checklist that appears only once a Category is selected.
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { ProcurementToolsSection } from './ProcurementTools';

const SK_TCO_V1 = 'isc-tool-catmgmt-tco-v1';
const SK_TCO_V2 = 'isc-tool-catmgmt-tco-v2';

class ResizeObserverStub { observe() {} unobserve() {} disconnect() {} }
(globalThis as any).ResizeObserver = ResizeObserverStub;

beforeEach(() => { localStorage.clear(); });
afterEach(() => { cleanup(); });

function goToTco() {
  fireEvent.click(screen.getByRole('tab', { name: /TCO Engine/i }));
}

describe('ProcurementToolsSection — TCO Engine tab', () => {
  it('starts with two supplier columns (A and B) in a single default analysis', () => {
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

  it('persists supplier rows to localStorage under SK_TCO_V2, nested under the active analysis', () => {
    const { container } = render(<ProcurementToolsSection isAr={false} />);
    goToTco();
    const table = container.querySelector('table')!;
    const nameInputs = within(table).getAllByDisplayValue(/Supplier [AB]/) as HTMLInputElement[];
    fireEvent.change(nameInputs[0], { target: { value: 'Acme Corp' } });

    const stored = JSON.parse(localStorage.getItem(SK_TCO_V2) || '{}');
    const active = stored.analyses.find((a: any) => a.id === stored.activeId);
    expect(active.suppliers[0].name).toBe('Acme Corp');
  });

  it('migrates v1 single-instance data into one named analysis on first load', () => {
    const v1Suppliers = [
      { id: 's1', name: 'Legacy Supplier A', unitPrice: 42, annualQty: 5, vatPct: 15, dutyPct: 0,
        freight: 0, insurance: 0, handling: 0, lastMile: 0, safetyStockDays: 0, carryingCostPct: 25,
        inspectionCost: 0, defectPpm: 0, reworkCost: 0, auditCost: 0, poCount: 0, poCostEach: 0, invoiceProcessingCost: 0 },
    ];
    localStorage.setItem(SK_TCO_V1, JSON.stringify(v1Suppliers));
    render(<ProcurementToolsSection isAr={false} />);
    goToTco();
    expect(screen.getByDisplayValue('Legacy Supplier A')).toBeInTheDocument();
    const stored = JSON.parse(localStorage.getItem(SK_TCO_V2) || '{}');
    expect(stored.analyses[0].suppliers[0].name).toBe('Legacy Supplier A');
    // Migrated rows get real defaults for the new End-of-life fields rather than undefined.
    expect(stored.analyses[0].suppliers[0].disposalCost).toBe(0);
  });

  it('adds a supplier column up to the 5-supplier cap', () => {
    const { container } = render(<ProcurementToolsSection isAr={false} />);
    goToTco();
    const addButton = screen.getByRole('button', { name: /^Add supplier/i });
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

  it('has End-of-life cost fields (disposal + one-time contract exit) not present in the old model', () => {
    const { container } = render(<ProcurementToolsSection isAr={false} />);
    goToTco();
    const table = container.querySelector('table')!;
    expect(within(table).getByText(/Disposal \/ recycling \/ waste handling/i)).toBeInTheDocument();
    expect(within(table).getByText(/Contract exit \/ switching \/ decommission/i)).toBeInTheDocument();
    const tfoot = table.querySelector('tfoot')!;
    expect(within(tfoot).getByText(/One-time exit cost/i)).toBeInTheDocument();
  });

  it('shows no checklist until a Category is selected, honoring the honesty placeholder', () => {
    render(<ProcurementToolsSection isAr={false} />);
    goToTco();
    expect(screen.getByText(/Select a Category above to see/i)).toBeInTheDocument();
  });

  it('shows the grounded, category-specific checklist once a Category (SKU class) is selected', () => {
    render(<ProcurementToolsSection isAr={false} />);
    goToTco();
    const categorySelect = screen.getByLabelText(/Category \(item type\)/i) as HTMLSelectElement;
    fireEvent.change(categorySelect, { target: { value: 'spare-parts-mro' } });
    expect(screen.queryByText(/Select a Category above to see/i)).toBeNull();
    // spare-parts-mro's grounded checklist cites the Capgemini indirect-cost finding.
    expect(screen.getAllByText(/Capgemini/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\[source\]/i).length).toBeGreaterThan(0);
  });

  it('filters the Sub-sector dropdown to the selected Industry', () => {
    render(<ProcurementToolsSection isAr={false} />);
    goToTco();
    const industrySelect = screen.getByLabelText(/^Industry$/i) as HTMLSelectElement;
    fireEvent.change(industrySelect, { target: { value: 'oil-gas' } });
    const subSectorSelect = screen.getByLabelText(/Sub-sector/i) as HTMLSelectElement;
    const optionLabels = Array.from(subSectorSelect.options).map(o => o.textContent);
    expect(optionLabels).toContain('Oil & Gas Upstream');
    expect(optionLabels).not.toContain('Grocery & Supermarkets');
  });

  it('supports multiple named, saved analyses that keep their own supplier data independently', () => {
    render(<ProcurementToolsSection isAr={false} />);
    goToTco();
    const priceInputsFirst = screen.getAllByRole('spinbutton');
    fireEvent.change(priceInputsFirst[0], { target: { value: '111' } });

    fireEvent.click(screen.getByRole('button', { name: /^New$/i }));
    const priceInputsSecond = screen.getAllByRole('spinbutton');
    expect((priceInputsSecond[0] as HTMLInputElement).value).not.toBe('111');

    const switcher = screen.getByLabelText(/^Analysis:$/i) as HTMLSelectElement ?? screen.getAllByRole('combobox')[0];
    const stored = JSON.parse(localStorage.getItem(SK_TCO_V2) || '{}');
    expect(stored.analyses.length).toBe(2);
  });

  it('exports the active analysis as a downloadable CSV via the Export button', () => {
    const clickSpy = vi.fn();
    const origCreateObjectURL = (globalThis as any).URL.createObjectURL;
    (globalThis as any).URL.createObjectURL = vi.fn(() => 'blob:mock');
    (globalThis as any).URL.revokeObjectURL = vi.fn();
    const origCreateElement = document.createElement.bind(document);
    const clickedTags: string[] = [];
    document.createElement = ((tag: string) => {
      const el = origCreateElement(tag);
      if (tag === 'a') { el.click = clickSpy; }
      return el;
    }) as any;

    render(<ProcurementToolsSection isAr={false} />);
    goToTco();
    fireEvent.click(screen.getByRole('button', { name: /Export this analysis/i }));
    expect(clickSpy).toHaveBeenCalled();

    document.createElement = origCreateElement;
    (globalThis as any).URL.createObjectURL = origCreateObjectURL;
  });

  it('renders the sources panel with real, named citations', () => {
    render(<ProcurementToolsSection isAr={false} />);
    goToTco();
    fireEvent.click(screen.getByText(/Sources & methodology/i));
    expect(screen.getAllByText(/CIPS.*Total Cost of Ownership/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Ellram/i).length).toBeGreaterThan(0);
  });
});
