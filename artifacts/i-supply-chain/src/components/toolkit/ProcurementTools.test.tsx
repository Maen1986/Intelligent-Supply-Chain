/**
 * Tests: ProcurementToolsSection — localStorage save & restore
 *
 * Covers:
 *   1. CategoryProfileBuilder persists all field values to localStorage and
 *      restores them on remount (simulating page refresh).
 *   2. SpendParetoChart persists row data to localStorage and restores it.
 *   3. MarketIntelligenceScorecard persists slider scores to localStorage
 *      and restores them.
 *   4. Each tool uses its own isolated localStorage key — no cross-tool
 *      contamination.
 *   5. A second mount of ProcurementToolsSection (simulating the same
 *      component rendered in both the Projects tab and the Challenges tab)
 *      reads the same persisted data — confirming the shared-key design
 *      is consistent, not a collision.
 */

import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ProcurementToolsSection } from './ProcurementTools';

/* ── localStorage keys matched to the component source ────────────────── */
const SK_CATPROFILE = 'isc-tool-procurement-catprofile';
const SK_PARETO     = 'isc-tool-procurement-pareto';
const SK_MARKETINTEL = 'isc-tool-procurement-marketintel';

/* ── Recharts uses ResizeObserver internally ───────────────────────────── */
class ResizeObserverStub {
  observe()    {}
  unobserve()  {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = ResizeObserverStub;

/* ── Helpers ───────────────────────────────────────────────────────────── */

/** Mount ProcurementToolsSection in English and activate a named sub-tool tab. */
function renderAndActivate(tabLabel: string) {
  render(<ProcurementToolsSection isAr={false} />);
  const tab = screen.getByRole('button', { name: tabLabel });
  fireEvent.click(tab);
}

/** Fill a labelled text/number input in the active panel. */
function fillInput(labelText: string, value: string) {
  const input = screen.getByLabelText(labelText) as HTMLInputElement;
  fireEvent.change(input, { target: { value } });
}

/* ══════════════════════════════════════════════════════════════════════════
   Suite 1 — CategoryProfileBuilder
══════════════════════════════════════════════════════════════════════════ */
describe('CategoryProfileBuilder — save & restore', () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
  });

  it('persists field values to localStorage on change', () => {
    renderAndActivate('Category Profile Builder');

    // Category Name is the only type="text" input (the rest are number spinbuttons)
    const categoryInput = screen.getAllByRole('textbox')[0] as HTMLInputElement;
    fireEvent.change(categoryInput, { target: { value: 'MRO Supplies' } });

    const saved = JSON.parse(localStorage.getItem(SK_CATPROFILE) ?? '{}');
    expect(saved.category).toBe('MRO Supplies');
  });

  it('restores all field values from localStorage on remount', () => {
    // Pre-seed localStorage as if data was entered in a previous session
    localStorage.setItem(SK_CATPROFILE, JSON.stringify({
      category: 'IT Hardware',
      spend: '500000',
      suppliers: '4',
      strategic: '4',
      complexity: '3',
    }));

    render(<ProcurementToolsSection isAr={false} />);
    // Category Profile Builder is the default active tab

    const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[];
    // spend, suppliers, strategic, complexity — order matches field definition
    const spendInput     = inputs.find(i => (i as HTMLInputElement).value === '500000');
    const suppliersInput = inputs.find(i => (i as HTMLInputElement).value === '4');

    expect(spendInput).toBeDefined();
    expect(suppliersInput).toBeDefined();

    // Quadrant card should appear because strategic(4) > 3 && complexity(3) <= 3
    expect(screen.getByText('Leverage')).toBeInTheDocument();
  });

  it('does NOT write to the pareto or marketintel keys', () => {
    renderAndActivate('Category Profile Builder');

    const textboxes = screen.getAllByRole('textbox') as HTMLInputElement[];
    fireEvent.change(textboxes[0], { target: { value: 'Office Supplies' } });

    expect(localStorage.getItem(SK_PARETO)).toBeNull();
    expect(localStorage.getItem(SK_MARKETINTEL)).toBeNull();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 2 — SpendParetoChart
══════════════════════════════════════════════════════════════════════════ */
describe('SpendParetoChart — save & restore', () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
  });

  it('persists row data to localStorage when a supplier name is entered', () => {
    renderAndActivate('Spend Pareto Analysis');

    const supplierInputs = screen.getAllByPlaceholderText(/Supplier \d+/);
    fireEvent.change(supplierInputs[0], { target: { value: 'ACME Corp' } });

    const saved = JSON.parse(localStorage.getItem(SK_PARETO) ?? '[]');
    expect(saved[0].name).toBe('ACME Corp');
  });

  it('persists spend values to localStorage', () => {
    renderAndActivate('Spend Pareto Analysis');

    const spendInputs = screen.getAllByPlaceholderText(/Spend \(SAR\)/);
    fireEvent.change(spendInputs[0], { target: { value: '1200000' } });

    const saved = JSON.parse(localStorage.getItem(SK_PARETO) ?? '[]');
    expect(saved[0].spend).toBe('1200000');
  });

  it('restores row data from localStorage on remount', () => {
    const seedRows = Array(10).fill(null).map((_, i) =>
      i === 0 ? { name: 'Top Supplier', spend: '900000' } : { name: '', spend: '' }
    );
    localStorage.setItem(SK_PARETO, JSON.stringify(seedRows));

    renderAndActivate('Spend Pareto Analysis');

    const supplierInputs = screen.getAllByPlaceholderText(/Supplier \d+/) as HTMLInputElement[];
    expect(supplierInputs[0].value).toBe('Top Supplier');
  });

  it('does NOT write to the catprofile or marketintel keys', () => {
    renderAndActivate('Spend Pareto Analysis');

    const spendInputs = screen.getAllByPlaceholderText(/Spend \(SAR\)/);
    fireEvent.change(spendInputs[0], { target: { value: '50000' } });

    expect(localStorage.getItem(SK_CATPROFILE)).toBeNull();
    expect(localStorage.getItem(SK_MARKETINTEL)).toBeNull();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 3 — MarketIntelligenceScorecard
══════════════════════════════════════════════════════════════════════════ */
describe('MarketIntelligenceScorecard — save & restore', () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
  });

  it('persists slider scores to localStorage on change', () => {
    renderAndActivate('Market Intelligence Scorecard');

    const sliders = screen.getAllByRole('slider') as HTMLInputElement[];
    // Move the first slider (Supplier Concentration) to 8
    fireEvent.change(sliders[0], { target: { value: '8' } });

    const saved = JSON.parse(localStorage.getItem(SK_MARKETINTEL) ?? '{}');
    expect(saved.concentration).toBe(8);
  });

  it('restores all slider scores from localStorage on remount', () => {
    localStorage.setItem(SK_MARKETINTEL, JSON.stringify({
      concentration: 9,
      growth:        7,
      technology:    6,
      regulation:    8,
      price:         9,
      continuity:    8,
    }));

    renderAndActivate('Market Intelligence Scorecard');

    // Composite = round((9+7+6+8+9+8)/6) = round(7.83) = 8 → High Risk
    expect(screen.getByText('High Risk')).toBeInTheDocument();
    // The composite score renders as "8" inside a <p> followed by "/10" in a <span>
    expect(screen.getByText('Composite Market Risk Score')).toBeInTheDocument();
  });

  it('does NOT write to the catprofile or pareto keys', () => {
    renderAndActivate('Market Intelligence Scorecard');

    const sliders = screen.getAllByRole('slider') as HTMLInputElement[];
    fireEvent.change(sliders[0], { target: { value: '5' } });

    expect(localStorage.getItem(SK_CATPROFILE)).toBeNull();
    expect(localStorage.getItem(SK_PARETO)).toBeNull();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 4 — Dual-tab consistency (Projects tab vs Challenges tab)
   Both tabs render <ProcurementToolsSection> with the same keys.
   Data entered via one instance must be visible in a second instance
   (simulating navigation from Projects tab → Challenges tab after refresh).
══════════════════════════════════════════════════════════════════════════ */
describe('Dual-tab shared-key consistency', () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
  });

  it('data written by the Projects-tab instance is read by the Challenges-tab instance', () => {
    // ── Simulate user filling Category Profile Builder from the Projects tab ──
    render(<ProcurementToolsSection isAr={false} />);
    // Category Profile Builder is active by default

    const textboxes = screen.getAllByRole('textbox') as HTMLInputElement[];
    fireEvent.change(textboxes[0], { target: { value: 'Logistics Services' } });

    // Confirm the key was written by the Projects-tab render
    const afterProjectsTab = JSON.parse(localStorage.getItem(SK_CATPROFILE) ?? '{}');
    expect(afterProjectsTab.category).toBe('Logistics Services');

    // ── Unmount (tab switch / page navigation) ──
    cleanup();

    // ── Mount again (simulates the Challenges tab rendering the same component) ──
    render(<ProcurementToolsSection isAr={false} />);

    // The second instance should read the same key and restore the value
    const restoredTextboxes = screen.getAllByRole('textbox') as HTMLInputElement[];
    expect(restoredTextboxes[0].value).toBe('Logistics Services');
  });

  it('data written by the Challenges-tab instance is read by the Projects-tab instance', () => {
    // ── Simulate Challenges tab writing data ──
    render(<ProcurementToolsSection isAr={false} />);
    const textboxes = screen.getAllByRole('textbox') as HTMLInputElement[];
    fireEvent.change(textboxes[0], { target: { value: 'Raw Materials' } });
    cleanup();

    // ── Simulate Projects tab remounting and reading back ──
    render(<ProcurementToolsSection isAr={false} />);
    const restoredTextboxes = screen.getAllByRole('textbox') as HTMLInputElement[];
    expect(restoredTextboxes[0].value).toBe('Raw Materials');
  });

  it('all three localStorage keys remain isolated from each other across instances', () => {
    // Write different values to each tool
    localStorage.setItem(SK_CATPROFILE,  JSON.stringify({ category: 'Fuel', spend: '1000000', suppliers: '2', strategic: '5', complexity: '4' }));
    localStorage.setItem(SK_PARETO,      JSON.stringify([{ name: 'FuelCo', spend: '1000000' }, ...Array(9).fill({ name: '', spend: '' })]));
    localStorage.setItem(SK_MARKETINTEL, JSON.stringify({ concentration: 3, growth: 2, technology: 2, regulation: 3, price: 4, continuity: 2 }));

    render(<ProcurementToolsSection isAr={false} />);

    // Category Profile Builder should show Strategic quadrant (strategic=5 > 3, complexity=4 > 3)
    expect(screen.getByText('Strategic')).toBeInTheDocument();

    // Switch to Spend Pareto
    fireEvent.click(screen.getByRole('button', { name: 'Spend Pareto Analysis' }));
    const supplierInputs = screen.getAllByPlaceholderText(/Supplier \d+/) as HTMLInputElement[];
    expect(supplierInputs[0].value).toBe('FuelCo');

    // Switch to Market Intelligence Scorecard — Low Risk (composite ≈ 2.7 → 3)
    fireEvent.click(screen.getByRole('button', { name: 'Market Intelligence Scorecard' }));
    expect(screen.getByText('Low Risk')).toBeInTheDocument();
  });
});
