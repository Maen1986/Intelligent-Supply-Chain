/**
 * Tests: ProcurementToolsSection — accessibility (label/input associations) &
 *         localStorage save & restore
 *
 * Covers:
 *   1. CategoryProfileBuilder — getByLabelText for all 5 fields, persists and
 *      restores from localStorage.
 *   2. SpendParetoChart — getByLabelText for supplier-name and spend inputs
 *      across multiple rows, persists and restores from localStorage.
 *   3. MarketIntelligenceScorecard — getByLabelText for all 6 dimension
 *      sliders, persists and restores from localStorage.
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
const SK_CATPROFILE  = 'isc-tool-procurement-catprofile';
const SK_PARETO      = 'isc-tool-procurement-pareto';
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

/** Mount ProcurementToolsSection in Arabic and activate a named sub-tool tab. */
function renderAndActivateAr(tabLabel: string) {
  render(<ProcurementToolsSection isAr={true} />);
  const tab = screen.getByRole('button', { name: tabLabel });
  fireEvent.click(tab);
}

/* ══════════════════════════════════════════════════════════════════════════
   Suite 1 — CategoryProfileBuilder
   All 5 fields must be reachable via getByLabelText.
══════════════════════════════════════════════════════════════════════════ */
describe('CategoryProfileBuilder — label associations & save/restore', () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
  });

  it('all 5 fields are reachable by label text', () => {
    renderAndActivate('Category Profile Builder');

    // Each of these must resolve to exactly one element without throwing.
    expect(screen.getByLabelText('Category Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Annual Spend (SAR)')).toBeInTheDocument();
    expect(screen.getByLabelText('Number of Qualified Suppliers')).toBeInTheDocument();
    expect(screen.getByLabelText('Strategic Importance (1–5)')).toBeInTheDocument();
    expect(screen.getByLabelText('Market Complexity (1–5)')).toBeInTheDocument();
  });

  it('persists Category Name to localStorage on change', () => {
    renderAndActivate('Category Profile Builder');

    const input = screen.getByLabelText('Category Name') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'MRO Supplies' } });

    const saved = JSON.parse(localStorage.getItem(SK_CATPROFILE) ?? '{}');
    expect(saved.category).toBe('MRO Supplies');
  });

  it('persists Annual Spend to localStorage on change', () => {
    renderAndActivate('Category Profile Builder');

    const input = screen.getByLabelText('Annual Spend (SAR)') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '750000' } });

    const saved = JSON.parse(localStorage.getItem(SK_CATPROFILE) ?? '{}');
    expect(saved.spend).toBe('750000');
  });

  it('persists Number of Qualified Suppliers to localStorage on change', () => {
    renderAndActivate('Category Profile Builder');

    const input = screen.getByLabelText('Number of Qualified Suppliers') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '6' } });

    const saved = JSON.parse(localStorage.getItem(SK_CATPROFILE) ?? '{}');
    expect(saved.suppliers).toBe('6');
  });

  it('persists Strategic Importance to localStorage on change', () => {
    renderAndActivate('Category Profile Builder');

    const input = screen.getByLabelText('Strategic Importance (1–5)') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '4' } });

    const saved = JSON.parse(localStorage.getItem(SK_CATPROFILE) ?? '{}');
    expect(saved.strategic).toBe('4');
  });

  it('persists Market Complexity to localStorage on change', () => {
    renderAndActivate('Category Profile Builder');

    const input = screen.getByLabelText('Market Complexity (1–5)') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '3' } });

    const saved = JSON.parse(localStorage.getItem(SK_CATPROFILE) ?? '{}');
    expect(saved.complexity).toBe('3');
  });

  it('restores all field values from localStorage on remount', () => {
    localStorage.setItem(SK_CATPROFILE, JSON.stringify({
      category: 'IT Hardware',
      spend:    '500000',
      suppliers: '4',
      strategic: '4',
      complexity: '3',
    }));

    render(<ProcurementToolsSection isAr={false} />);
    // Category Profile Builder is the default active tab

    expect((screen.getByLabelText('Category Name') as HTMLInputElement).value).toBe('IT Hardware');
    expect((screen.getByLabelText('Annual Spend (SAR)') as HTMLInputElement).value).toBe('500000');
    expect((screen.getByLabelText('Number of Qualified Suppliers') as HTMLInputElement).value).toBe('4');
    expect((screen.getByLabelText('Strategic Importance (1–5)') as HTMLInputElement).value).toBe('4');
    expect((screen.getByLabelText('Market Complexity (1–5)') as HTMLInputElement).value).toBe('3');

    // Quadrant card should appear: strategic(4) > 3, complexity(3) ≤ 3 → Leverage
    expect(screen.getByText('Leverage')).toBeInTheDocument();
  });

  it('does NOT write to the pareto or marketintel keys', () => {
    renderAndActivate('Category Profile Builder');

    const input = screen.getByLabelText('Category Name') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Office Supplies' } });

    expect(localStorage.getItem(SK_PARETO)).toBeNull();
    expect(localStorage.getItem(SK_MARKETINTEL)).toBeNull();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 2 — SpendParetoChart
   Supplier-name and spend inputs across multiple rows must be reachable via
   getByLabelText (sr-only labels); no getByPlaceholderText fallbacks.
══════════════════════════════════════════════════════════════════════════ */
describe('SpendParetoChart — label associations & save/restore', () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
  });

  it('supplier name inputs are reachable by label text for rows 1–10', () => {
    renderAndActivate('Spend Pareto Analysis');

    for (let i = 1; i <= 10; i++) {
      expect(screen.getByLabelText(`Supplier ${i} name`)).toBeInTheDocument();
    }
  });

  it('supplier spend inputs are reachable by label text for rows 1–10', () => {
    renderAndActivate('Spend Pareto Analysis');

    for (let i = 1; i <= 10; i++) {
      expect(screen.getByLabelText(`Supplier ${i} spend`)).toBeInTheDocument();
    }
  });

  it('persists row data to localStorage when a supplier name is entered via label', () => {
    renderAndActivate('Spend Pareto Analysis');

    const input = screen.getByLabelText('Supplier 1 name') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'ACME Corp' } });

    const saved = JSON.parse(localStorage.getItem(SK_PARETO) ?? '[]');
    expect(saved[0].name).toBe('ACME Corp');
  });

  it('persists spend values to localStorage when entered via label', () => {
    renderAndActivate('Spend Pareto Analysis');

    const input = screen.getByLabelText('Supplier 1 spend') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '1200000' } });

    const saved = JSON.parse(localStorage.getItem(SK_PARETO) ?? '[]');
    expect(saved[0].spend).toBe('1200000');
  });

  it('persists name and spend for multiple rows simultaneously', () => {
    renderAndActivate('Spend Pareto Analysis');

    fireEvent.change(screen.getByLabelText('Supplier 1 name'), { target: { value: 'Alpha' } });
    fireEvent.change(screen.getByLabelText('Supplier 1 spend'), { target: { value: '900000' } });
    fireEvent.change(screen.getByLabelText('Supplier 2 name'), { target: { value: 'Beta' } });
    fireEvent.change(screen.getByLabelText('Supplier 2 spend'), { target: { value: '600000' } });

    const saved = JSON.parse(localStorage.getItem(SK_PARETO) ?? '[]');
    expect(saved[0].name).toBe('Alpha');
    expect(saved[0].spend).toBe('900000');
    expect(saved[1].name).toBe('Beta');
    expect(saved[1].spend).toBe('600000');
  });

  it('restores row data from localStorage on remount', () => {
    const seedRows = Array(10).fill(null).map((_, i) =>
      i === 0 ? { name: 'Top Supplier', spend: '900000' } : { name: '', spend: '' }
    );
    localStorage.setItem(SK_PARETO, JSON.stringify(seedRows));

    renderAndActivate('Spend Pareto Analysis');

    const input = screen.getByLabelText('Supplier 1 name') as HTMLInputElement;
    expect(input.value).toBe('Top Supplier');
  });

  it('does NOT write to the catprofile or marketintel keys', () => {
    renderAndActivate('Spend Pareto Analysis');

    const input = screen.getByLabelText('Supplier 1 spend') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '50000' } });

    expect(localStorage.getItem(SK_CATPROFILE)).toBeNull();
    expect(localStorage.getItem(SK_MARKETINTEL)).toBeNull();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 3 — MarketIntelligenceScorecard
   All 6 dimension sliders must be reachable via getByLabelText.
══════════════════════════════════════════════════════════════════════════ */
describe('MarketIntelligenceScorecard — label associations & save/restore', () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
  });

  it('all 6 dimension sliders are reachable by label text', () => {
    renderAndActivate('Market Intelligence Scorecard');

    expect(screen.getByLabelText('Supplier Concentration')).toBeInTheDocument();
    expect(screen.getByLabelText('Market Growth Rate')).toBeInTheDocument();
    expect(screen.getByLabelText('Technology Change Rate')).toBeInTheDocument();
    expect(screen.getByLabelText('Regulatory Complexity')).toBeInTheDocument();
    expect(screen.getByLabelText('Price Volatility')).toBeInTheDocument();
    expect(screen.getByLabelText('Supply Continuity Risk')).toBeInTheDocument();
  });

  it('persists Supplier Concentration slider score via label', () => {
    renderAndActivate('Market Intelligence Scorecard');

    const slider = screen.getByLabelText('Supplier Concentration') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '8' } });

    const saved = JSON.parse(localStorage.getItem(SK_MARKETINTEL) ?? '{}');
    expect(saved.concentration).toBe(8);
  });

  it('persists Market Growth Rate slider score via label', () => {
    renderAndActivate('Market Intelligence Scorecard');

    const slider = screen.getByLabelText('Market Growth Rate') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '7' } });

    const saved = JSON.parse(localStorage.getItem(SK_MARKETINTEL) ?? '{}');
    expect(saved.growth).toBe(7);
  });

  it('persists Technology Change Rate slider score via label', () => {
    renderAndActivate('Market Intelligence Scorecard');

    const slider = screen.getByLabelText('Technology Change Rate') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '6' } });

    const saved = JSON.parse(localStorage.getItem(SK_MARKETINTEL) ?? '{}');
    expect(saved.technology).toBe(6);
  });

  it('persists Regulatory Complexity slider score via label', () => {
    renderAndActivate('Market Intelligence Scorecard');

    const slider = screen.getByLabelText('Regulatory Complexity') as HTMLInputElement;
    // Use 7 (not the default 5) so the change event triggers a state update
    fireEvent.change(slider, { target: { value: '7' } });

    const saved = JSON.parse(localStorage.getItem(SK_MARKETINTEL) ?? '{}');
    expect(saved.regulation).toBe(7);
  });

  it('persists Price Volatility slider score via label', () => {
    renderAndActivate('Market Intelligence Scorecard');

    const slider = screen.getByLabelText('Price Volatility') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '9' } });

    const saved = JSON.parse(localStorage.getItem(SK_MARKETINTEL) ?? '{}');
    expect(saved.price).toBe(9);
  });

  it('persists Supply Continuity Risk slider score via label', () => {
    renderAndActivate('Market Intelligence Scorecard');

    const slider = screen.getByLabelText('Supply Continuity Risk') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '4' } });

    const saved = JSON.parse(localStorage.getItem(SK_MARKETINTEL) ?? '{}');
    expect(saved.continuity).toBe(4);
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
    expect(screen.getByText('Composite Market Risk Score')).toBeInTheDocument();

    // Verify each slider reflects the restored value
    expect((screen.getByLabelText('Supplier Concentration') as HTMLInputElement).value).toBe('9');
    expect((screen.getByLabelText('Market Growth Rate') as HTMLInputElement).value).toBe('7');
    expect((screen.getByLabelText('Technology Change Rate') as HTMLInputElement).value).toBe('6');
    expect((screen.getByLabelText('Regulatory Complexity') as HTMLInputElement).value).toBe('8');
    expect((screen.getByLabelText('Price Volatility') as HTMLInputElement).value).toBe('9');
    expect((screen.getByLabelText('Supply Continuity Risk') as HTMLInputElement).value).toBe('8');
  });

  it('does NOT write to the catprofile or pareto keys', () => {
    renderAndActivate('Market Intelligence Scorecard');

    const slider = screen.getByLabelText('Supplier Concentration') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '5' } });

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

    const input = screen.getByLabelText('Category Name') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Logistics Services' } });

    // Confirm the key was written by the Projects-tab render
    const afterProjectsTab = JSON.parse(localStorage.getItem(SK_CATPROFILE) ?? '{}');
    expect(afterProjectsTab.category).toBe('Logistics Services');

    // ── Unmount (tab switch / page navigation) ──
    cleanup();

    // ── Mount again (simulates the Challenges tab rendering the same component) ──
    render(<ProcurementToolsSection isAr={false} />);

    // The second instance should read the same key and restore the value
    const restored = screen.getByLabelText('Category Name') as HTMLInputElement;
    expect(restored.value).toBe('Logistics Services');
  });

  it('data written by the Challenges-tab instance is read by the Projects-tab instance', () => {
    // ── Simulate Challenges tab writing data ──
    render(<ProcurementToolsSection isAr={false} />);
    const input = screen.getByLabelText('Category Name') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Raw Materials' } });
    cleanup();

    // ── Simulate Projects tab remounting and reading back ──
    render(<ProcurementToolsSection isAr={false} />);
    const restored = screen.getByLabelText('Category Name') as HTMLInputElement;
    expect(restored.value).toBe('Raw Materials');
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
    const supplierInput = screen.getByLabelText('Supplier 1 name') as HTMLInputElement;
    expect(supplierInput.value).toBe('FuelCo');

    // Switch to Market Intelligence Scorecard — Low Risk (composite ≈ 2.7 → 3)
    fireEvent.click(screen.getByRole('button', { name: 'Market Intelligence Scorecard' }));
    expect(screen.getByText('Low Risk')).toBeInTheDocument();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 5 — CategoryProfileBuilder (Arabic mode)
   All 5 fields must be reachable via getByLabelText when isAr={true}.
══════════════════════════════════════════════════════════════════════════ */
describe('CategoryProfileBuilder — Arabic label associations', () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
  });

  it('all 5 Arabic fields are reachable by label text', () => {
    renderAndActivateAr('بناء ملف الفئة');

    expect(screen.getByLabelText('اسم الفئة')).toBeInTheDocument();
    expect(screen.getByLabelText('الإنفاق السنوي (ريال)')).toBeInTheDocument();
    expect(screen.getByLabelText('عدد المورّدين المؤهّلين')).toBeInTheDocument();
    expect(screen.getByLabelText('الأهمية الاستراتيجية (1–5)')).toBeInTheDocument();
    expect(screen.getByLabelText('تعقيد السوق (1–5)')).toBeInTheDocument();
  });

  it('Arabic label for Category Name is wired to the correct input', () => {
    renderAndActivateAr('بناء ملف الفئة');

    const input = screen.getByLabelText('اسم الفئة') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'مواد خام' } });

    const saved = JSON.parse(localStorage.getItem(SK_CATPROFILE) ?? '{}');
    expect(saved.category).toBe('مواد خام');
  });

  it('Arabic label for Annual Spend is wired to the correct input', () => {
    renderAndActivateAr('بناء ملف الفئة');

    const input = screen.getByLabelText('الإنفاق السنوي (ريال)') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '500000' } });

    const saved = JSON.parse(localStorage.getItem(SK_CATPROFILE) ?? '{}');
    expect(saved.spend).toBe('500000');
  });

  it('Arabic label for Number of Qualified Suppliers is wired to the correct input', () => {
    renderAndActivateAr('بناء ملف الفئة');

    const input = screen.getByLabelText('عدد المورّدين المؤهّلين') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '3' } });

    const saved = JSON.parse(localStorage.getItem(SK_CATPROFILE) ?? '{}');
    expect(saved.suppliers).toBe('3');
  });

  it('Arabic label for Strategic Importance is wired to the correct input', () => {
    renderAndActivateAr('بناء ملف الفئة');

    const input = screen.getByLabelText('الأهمية الاستراتيجية (1–5)') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '5' } });

    const saved = JSON.parse(localStorage.getItem(SK_CATPROFILE) ?? '{}');
    expect(saved.strategic).toBe('5');
  });

  it('Arabic label for Market Complexity is wired to the correct input', () => {
    renderAndActivateAr('بناء ملف الفئة');

    const input = screen.getByLabelText('تعقيد السوق (1–5)') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '2' } });

    const saved = JSON.parse(localStorage.getItem(SK_CATPROFILE) ?? '{}');
    expect(saved.complexity).toBe('2');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 6 — SpendParetoChart (Arabic mode)
   sr-only Arabic labels must connect to the correct inputs.
══════════════════════════════════════════════════════════════════════════ */
describe('SpendParetoChart — Arabic label associations', () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
  });

  it('Arabic supplier name inputs are reachable by label text for rows 1–10', () => {
    renderAndActivateAr('تحليل باريتو للإنفاق');

    for (let i = 1; i <= 10; i++) {
      expect(screen.getByLabelText(`اسم المورّد ${i}`)).toBeInTheDocument();
    }
  });

  it('Arabic supplier spend inputs are reachable by label text for rows 1–10', () => {
    renderAndActivateAr('تحليل باريتو للإنفاق');

    for (let i = 1; i <= 10; i++) {
      expect(screen.getByLabelText(`إنفاق المورّد ${i}`)).toBeInTheDocument();
    }
  });

  it('Arabic supplier name label is wired to the correct input', () => {
    renderAndActivateAr('تحليل باريتو للإنفاق');

    const input = screen.getByLabelText('اسم المورّد 1') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'شركة الخليج' } });

    const saved = JSON.parse(localStorage.getItem(SK_PARETO) ?? '[]');
    expect(saved[0].name).toBe('شركة الخليج');
  });

  it('Arabic supplier spend label is wired to the correct input', () => {
    renderAndActivateAr('تحليل باريتو للإنفاق');

    const input = screen.getByLabelText('إنفاق المورّد 1') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '750000' } });

    const saved = JSON.parse(localStorage.getItem(SK_PARETO) ?? '[]');
    expect(saved[0].spend).toBe('750000');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 7 — MarketIntelligenceScorecard (Arabic mode)
   All 6 dimension sliders must be reachable via getByLabelText when isAr={true}.
══════════════════════════════════════════════════════════════════════════ */
describe('MarketIntelligenceScorecard — Arabic label associations', () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
  });

  it('all 6 Arabic dimension sliders are reachable by label text', () => {
    renderAndActivateAr('بطاقة استخبارات السوق');

    expect(screen.getByLabelText('تركّز المورّدين')).toBeInTheDocument();
    expect(screen.getByLabelText('معدّل نمو السوق')).toBeInTheDocument();
    expect(screen.getByLabelText('معدّل التغيّر التقني')).toBeInTheDocument();
    expect(screen.getByLabelText('تعقيد التنظيمات')).toBeInTheDocument();
    expect(screen.getByLabelText('تذبذب الأسعار')).toBeInTheDocument();
    expect(screen.getByLabelText('مخاطر استمرارية التوريد')).toBeInTheDocument();
  });

  it('Arabic Supplier Concentration label is wired to the correct slider', () => {
    renderAndActivateAr('بطاقة استخبارات السوق');

    const slider = screen.getByLabelText('تركّز المورّدين') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '9' } });

    const saved = JSON.parse(localStorage.getItem(SK_MARKETINTEL) ?? '{}');
    expect(saved.concentration).toBe(9);
  });

  it('Arabic Market Growth Rate label is wired to the correct slider', () => {
    renderAndActivateAr('بطاقة استخبارات السوق');

    const slider = screen.getByLabelText('معدّل نمو السوق') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '6' } });

    const saved = JSON.parse(localStorage.getItem(SK_MARKETINTEL) ?? '{}');
    expect(saved.growth).toBe(6);
  });

  it('Arabic Technology Change Rate label is wired to the correct slider', () => {
    renderAndActivateAr('بطاقة استخبارات السوق');

    const slider = screen.getByLabelText('معدّل التغيّر التقني') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '7' } });

    const saved = JSON.parse(localStorage.getItem(SK_MARKETINTEL) ?? '{}');
    expect(saved.technology).toBe(7);
  });

  it('Arabic Regulatory Complexity label is wired to the correct slider', () => {
    renderAndActivateAr('بطاقة استخبارات السوق');

    const slider = screen.getByLabelText('تعقيد التنظيمات') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '8' } });

    const saved = JSON.parse(localStorage.getItem(SK_MARKETINTEL) ?? '{}');
    expect(saved.regulation).toBe(8);
  });

  it('Arabic Price Volatility label is wired to the correct slider', () => {
    renderAndActivateAr('بطاقة استخبارات السوق');

    const slider = screen.getByLabelText('تذبذب الأسعار') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '4' } });

    const saved = JSON.parse(localStorage.getItem(SK_MARKETINTEL) ?? '{}');
    expect(saved.price).toBe(4);
  });

  it('Arabic Supply Continuity Risk label is wired to the correct slider', () => {
    renderAndActivateAr('بطاقة استخبارات السوق');

    const slider = screen.getByLabelText('مخاطر استمرارية التوريد') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '3' } });

    const saved = JSON.parse(localStorage.getItem(SK_MARKETINTEL) ?? '{}');
    expect(saved.continuity).toBe(3);
  });
});
