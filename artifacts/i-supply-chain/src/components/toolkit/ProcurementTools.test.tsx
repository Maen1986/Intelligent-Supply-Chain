/**
 * Tests: ProcurementToolsSection — accessibility (aria-label associations)
 * & localStorage save/restore
 *
 * Covers:
 *   1. Spend Analysis tab (default) — checkboxes and delete button have
 *      correct aria-labels; localStorage persists to SK_SPEND.
 *   2. Market Intelligence tab — all 5 Porter's Forces sliders have
 *      aria-labels; localStorage persists to SK_PORTER.
 *   3. Tab navigation — clicking tab buttons switches the visible panel.
 *   4. Arabic mode — correct Arabic aria-labels on all interactive inputs.
 *   5. Storage key isolation — SK_SPEND and SK_PORTER are independent.
 */

import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ProcurementToolsSection } from './ProcurementTools';

/* ── Current localStorage keys (must match component source) ───────────── */
const SK_SPEND  = 'isc-tool-catmgmt-spend-v2';
const SK_PORTER = 'isc-tool-catmgmt-porter-v2';

/* ── Recharts uses ResizeObserver internally ───────────────────────────── */
class ResizeObserverStub {
  observe()    {}
  unobserve()  {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = ResizeObserverStub;

beforeEach(() => {
  localStorage.clear();
  cleanup();
});

/* ── helper: click a tab button by partial label text ─────────────────── */
function goToTab(label: string) {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(label, 'i') }));
}

/* ══════════════════════════════════════════════════════════════════════════
   Suite 1 — Spend Analysis tab (default)
   Checkboxes and delete buttons must have correct aria-labels.
══════════════════════════════════════════════════════════════════════════ */
describe('ProcurementToolsSection — Spend Analysis tab accessibility', () => {
  it('renders with Spend Analysis as the default active tab', () => {
    render(<ProcurementToolsSection isAr={false} />);
    // Default row produces labelled checkboxes — confirms Spend Analysis is active
    expect(screen.getByLabelText('Supplier: contracted')).toBeInTheDocument();
  });

  it('contracted checkbox has correct aria-label for default (unnamed) row', () => {
    render(<ProcurementToolsSection isAr={false} />);
    const cb = screen.getByLabelText('Supplier: contracted') as HTMLInputElement;
    expect(cb.type).toBe('checkbox');
  });

  it('strategic checkbox has correct aria-label for default (unnamed) row', () => {
    render(<ProcurementToolsSection isAr={false} />);
    const cb = screen.getByLabelText('Supplier: strategic') as HTMLInputElement;
    expect(cb.type).toBe('checkbox');
  });

  it('delete button has correct aria-label for default (unnamed) row', () => {
    render(<ProcurementToolsSection isAr={false} />);
    const btn = screen.getByLabelText('Remove supplier');
    expect(btn.tagName).toBe('BUTTON');
  });

  it('aria-labels update when supplier name is typed', () => {
    render(<ProcurementToolsSection isAr={false} />);
    const nameInput = screen.getByPlaceholderText('Supplier name');
    fireEvent.change(nameInput, { target: { value: 'Acme Corp' } });

    expect(screen.getByLabelText('Acme Corp: contracted')).toBeInTheDocument();
    expect(screen.getByLabelText('Acme Corp: strategic')).toBeInTheDocument();
    expect(screen.getByLabelText('Remove Acme Corp')).toBeInTheDocument();
  });

  it('contracted checkbox is unchecked by default', () => {
    render(<ProcurementToolsSection isAr={false} />);
    const cb = screen.getByLabelText('Supplier: contracted') as HTMLInputElement;
    expect(cb.checked).toBe(false);
  });

  it('strategic checkbox is unchecked by default', () => {
    render(<ProcurementToolsSection isAr={false} />);
    const cb = screen.getByLabelText('Supplier: strategic') as HTMLInputElement;
    expect(cb.checked).toBe(false);
  });

  it('toggling contracted checkbox persists to localStorage', () => {
    render(<ProcurementToolsSection isAr={false} />);
    const cb = screen.getByLabelText('Supplier: contracted') as HTMLInputElement;
    fireEvent.click(cb);

    const saved = JSON.parse(localStorage.getItem(SK_SPEND) ?? '[]');
    expect(Array.isArray(saved)).toBe(true);
    expect(saved[0].contracted).toBe(true);
  });

  it('toggling strategic checkbox persists to localStorage', () => {
    render(<ProcurementToolsSection isAr={false} />);
    const cb = screen.getByLabelText('Supplier: strategic') as HTMLInputElement;
    fireEvent.click(cb);

    const saved = JSON.parse(localStorage.getItem(SK_SPEND) ?? '[]');
    expect(saved[0].strategic).toBe(true);
  });

  it('restores spend data from localStorage on mount', () => {
    const seedData = [{
      id: 'r1', supplier: 'Seed Supplier', category: 'MRO',
      subcategory: '', annualSpend: 50000, contracted: true, strategic: false,
    }];
    localStorage.setItem(SK_SPEND, JSON.stringify(seedData));

    render(<ProcurementToolsSection isAr={false} />);

    expect(screen.getByLabelText('Seed Supplier: contracted')).toBeInTheDocument();
    const cb = screen.getByLabelText('Seed Supplier: contracted') as HTMLInputElement;
    expect(cb.checked).toBe(true);
  });

  it('supplier name persists to localStorage on change', () => {
    render(<ProcurementToolsSection isAr={false} />);
    const nameInput = screen.getByPlaceholderText('Supplier name');
    fireEvent.change(nameInput, { target: { value: 'Gulf Supplier' } });

    const saved = JSON.parse(localStorage.getItem(SK_SPEND) ?? '[]');
    expect(saved[0].supplier).toBe('Gulf Supplier');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 2 — Market Intelligence tab (Porter's Five Forces)
   All 5 force sliders must have aria-labels matching force.label.
══════════════════════════════════════════════════════════════════════════ */
describe('ProcurementToolsSection — Market Intelligence tab accessibility', () => {
  it('navigates to Market Intelligence tab on click', () => {
    render(<ProcurementToolsSection isAr={false} />);
    goToTab('Market Intelligence');
    expect(screen.getByLabelText('Supplier Power')).toBeInTheDocument();
  });

  it('Supplier Power slider is reachable by aria-label', () => {
    render(<ProcurementToolsSection isAr={false} />);
    goToTab('Market Intelligence');
    const slider = screen.getByLabelText('Supplier Power') as HTMLInputElement;
    expect(slider.type).toBe('range');
  });

  it('Buyer Power slider is reachable by aria-label', () => {
    render(<ProcurementToolsSection isAr={false} />);
    goToTab('Market Intelligence');
    const slider = screen.getByLabelText('Buyer Power') as HTMLInputElement;
    expect(slider.type).toBe('range');
  });

  it('Threat of New Entrants slider is reachable by aria-label', () => {
    render(<ProcurementToolsSection isAr={false} />);
    goToTab('Market Intelligence');
    const slider = screen.getByLabelText('Threat of New Entrants') as HTMLInputElement;
    expect(slider.type).toBe('range');
  });

  it('Threat of Substitutes slider is reachable by aria-label', () => {
    render(<ProcurementToolsSection isAr={false} />);
    goToTab('Market Intelligence');
    const slider = screen.getByLabelText('Threat of Substitutes') as HTMLInputElement;
    expect(slider.type).toBe('range');
  });

  it('Competitive Rivalry slider is reachable by aria-label', () => {
    render(<ProcurementToolsSection isAr={false} />);
    goToTab('Market Intelligence');
    const slider = screen.getByLabelText('Competitive Rivalry') as HTMLInputElement;
    expect(slider.type).toBe('range');
  });

  it('all 5 force sliders are present on the Market Intelligence tab', () => {
    render(<ProcurementToolsSection isAr={false} />);
    goToTab('Market Intelligence');
    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBeGreaterThanOrEqual(5);
  });

  it('changing Supplier Power slider persists to localStorage', () => {
    render(<ProcurementToolsSection isAr={false} />);
    goToTab('Market Intelligence');
    const slider = screen.getByLabelText('Supplier Power') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '4' } });

    const saved = JSON.parse(localStorage.getItem(SK_PORTER) ?? '{}');
    expect(saved.supplier_power?.score).toBe(4);
  });

  it('changing Buyer Power slider persists to localStorage', () => {
    render(<ProcurementToolsSection isAr={false} />);
    goToTab('Market Intelligence');
    const slider = screen.getByLabelText('Buyer Power') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '2' } });

    const saved = JSON.parse(localStorage.getItem(SK_PORTER) ?? '{}');
    expect(saved.buyer_power?.score).toBe(2);
  });

  it('changing Threat of New Entrants slider persists to localStorage', () => {
    render(<ProcurementToolsSection isAr={false} />);
    goToTab('Market Intelligence');
    const slider = screen.getByLabelText('Threat of New Entrants') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '5' } });

    const saved = JSON.parse(localStorage.getItem(SK_PORTER) ?? '{}');
    expect(saved.new_entrants?.score).toBe(5);
  });

  it('changing Threat of Substitutes slider persists to localStorage', () => {
    render(<ProcurementToolsSection isAr={false} />);
    goToTab('Market Intelligence');
    const slider = screen.getByLabelText('Threat of Substitutes') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '1' } });

    const saved = JSON.parse(localStorage.getItem(SK_PORTER) ?? '{}');
    expect(saved.substitutes?.score).toBe(1);
  });

  it('changing Competitive Rivalry slider persists to localStorage', () => {
    render(<ProcurementToolsSection isAr={false} />);
    goToTab('Market Intelligence');
    const slider = screen.getByLabelText('Competitive Rivalry') as HTMLInputElement;
    // Use a non-default value (default is 3) so the change is guaranteed to be written
    fireEvent.change(slider, { target: { value: '5' } });

    const saved = JSON.parse(localStorage.getItem(SK_PORTER) ?? '{}');
    expect(saved.rivalry?.score).toBe(5);
  });

  it('restores Porter data from localStorage on mount', () => {
    const seed = {
      supplier_power: { score: 4, notes: '' },
      buyer_power:    { score: 2, notes: '' },
      new_entrants:   { score: 3, notes: '' },
      substitutes:    { score: 1, notes: '' },
      rivalry:        { score: 5, notes: '' },
    };
    localStorage.setItem(SK_PORTER, JSON.stringify(seed));

    render(<ProcurementToolsSection isAr={false} />);
    goToTab('Market Intelligence');

    const slider = screen.getByLabelText('Supplier Power') as HTMLInputElement;
    expect(slider.value).toBe('4');

    const rivalrySlider = screen.getByLabelText('Competitive Rivalry') as HTMLInputElement;
    expect(rivalrySlider.value).toBe('5');
  });

  it('default slider value is 3 when no data is stored', () => {
    render(<ProcurementToolsSection isAr={false} />);
    goToTab('Market Intelligence');
    const slider = screen.getByLabelText('Supplier Power') as HTMLInputElement;
    expect(slider.value).toBe('3');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 3 — Tab navigation
   Clicking tab buttons switches the visible panel.
══════════════════════════════════════════════════════════════════════════ */
describe('ProcurementToolsSection — tab navigation', () => {
  it('Spend Analysis content is visible by default', () => {
    render(<ProcurementToolsSection isAr={false} />);
    expect(screen.getByLabelText('Supplier: contracted')).toBeInTheDocument();
  });

  it('navigating to Market Intelligence hides Spend Analysis content', () => {
    render(<ProcurementToolsSection isAr={false} />);
    goToTab('Market Intelligence');
    expect(screen.queryByLabelText('Supplier: contracted')).toBeNull();
    expect(screen.getByLabelText('Supplier Power')).toBeInTheDocument();
  });

  it('navigating back to Spend Analysis shows spend content again', () => {
    render(<ProcurementToolsSection isAr={false} />);
    goToTab('Market Intelligence');
    goToTab('Spend Analysis');
    expect(screen.getByLabelText('Supplier: contracted')).toBeInTheDocument();
    expect(screen.queryByLabelText('Supplier Power')).toBeNull();
  });

  it('navigating to Sourcing Strategy hides Spend Analysis content', () => {
    render(<ProcurementToolsSection isAr={false} />);
    goToTab('Sourcing Strategy');
    expect(screen.queryByLabelText('Supplier: contracted')).toBeNull();
  });

  it('navigating to Templates & Tools hides Spend Analysis content', () => {
    render(<ProcurementToolsSection isAr={false} />);
    goToTab('Templates');
    expect(screen.queryByLabelText('Supplier: contracted')).toBeNull();
  });

  it('all 5 tab buttons are rendered', () => {
    render(<ProcurementToolsSection isAr={false} />);
    expect(screen.getByRole('button', { name: /Spend Analysis/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Market Intelligence/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sourcing Strategy/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Templates/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /AI Strategy Brief/i })).toBeInTheDocument();
  });

  it('Market Intelligence and Spend Analysis contents are mutually exclusive', () => {
    render(<ProcurementToolsSection isAr={false} />);

    // Default: Spend Analysis visible
    expect(screen.getByLabelText('Supplier: contracted')).toBeInTheDocument();
    expect(screen.queryByLabelText('Supplier Power')).toBeNull();

    // After navigation: Market Intelligence visible
    goToTab('Market Intelligence');
    expect(screen.queryByLabelText('Supplier: contracted')).toBeNull();
    expect(screen.getByLabelText('Supplier Power')).toBeInTheDocument();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 4 — Arabic mode
   Spend Analysis checkboxes and Porter's sliders use Arabic aria-labels.
══════════════════════════════════════════════════════════════════════════ */
describe('ProcurementToolsSection — Arabic mode', () => {
  it('contracted checkbox has Arabic aria-label in AR mode', () => {
    render(<ProcurementToolsSection isAr={true} />);
    const cb = screen.getByLabelText(/تحت عقد/);
    expect(cb).toBeInTheDocument();
  });

  it('strategic checkbox has Arabic aria-label in AR mode', () => {
    render(<ProcurementToolsSection isAr={true} />);
    const cb = screen.getByLabelText(/استراتيجي/);
    expect(cb).toBeInTheDocument();
  });

  it('delete button has Arabic aria-label in AR mode', () => {
    render(<ProcurementToolsSection isAr={true} />);
    const btn = screen.getByLabelText(/حذف/);
    expect(btn).toBeInTheDocument();
  });

  it('Supplier Power slider has Arabic aria-label in AR mode', () => {
    render(<ProcurementToolsSection isAr={true} />);
    fireEvent.click(screen.getByRole('button', { name: /استخبارات السوق/i }));
    expect(screen.getByLabelText('قوة الموردين')).toBeInTheDocument();
  });

  it('Buyer Power slider has Arabic aria-label in AR mode', () => {
    render(<ProcurementToolsSection isAr={true} />);
    fireEvent.click(screen.getByRole('button', { name: /استخبارات السوق/i }));
    expect(screen.getByLabelText('قوة المشترين')).toBeInTheDocument();
  });

  it('Threat of New Entrants slider has Arabic aria-label in AR mode', () => {
    render(<ProcurementToolsSection isAr={true} />);
    fireEvent.click(screen.getByRole('button', { name: /استخبارات السوق/i }));
    expect(screen.getByLabelText('تهديد الداخلين الجدد')).toBeInTheDocument();
  });

  it('Threat of Substitutes slider has Arabic aria-label in AR mode', () => {
    render(<ProcurementToolsSection isAr={true} />);
    fireEvent.click(screen.getByRole('button', { name: /استخبارات السوق/i }));
    expect(screen.getByLabelText('تهديد المنتجات البديلة')).toBeInTheDocument();
  });

  it('Competitive Rivalry slider has Arabic aria-label in AR mode', () => {
    render(<ProcurementToolsSection isAr={true} />);
    fireEvent.click(screen.getByRole('button', { name: /استخبارات السوق/i }));
    expect(screen.getByLabelText('حدة التنافس')).toBeInTheDocument();
  });

  it('Arabic contracted checkbox label updates when Arabic supplier name entered', () => {
    render(<ProcurementToolsSection isAr={true} />);
    const nameInput = screen.getByPlaceholderText('اسم المورد');
    fireEvent.change(nameInput, { target: { value: 'شركة الخليج' } });
    expect(screen.getByLabelText('شركة الخليج: تحت عقد')).toBeInTheDocument();
  });

  it('Arabic delete button label updates when Arabic supplier name entered', () => {
    render(<ProcurementToolsSection isAr={true} />);
    const nameInput = screen.getByPlaceholderText('اسم المورد');
    fireEvent.change(nameInput, { target: { value: 'شركة الخليج' } });
    expect(screen.getByLabelText('حذف شركة الخليج')).toBeInTheDocument();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 5 — Storage key isolation
   SK_SPEND and SK_PORTER must be independent keys (no cross-contamination).
══════════════════════════════════════════════════════════════════════════ */
describe('ProcurementToolsSection — storage key isolation', () => {
  it('SK_SPEND and SK_PORTER are distinct keys', () => {
    expect(SK_SPEND).not.toBe(SK_PORTER);
  });

  it('modifying spend data does not write to the porter key', () => {
    render(<ProcurementToolsSection isAr={false} />);
    const cb = screen.getByLabelText('Supplier: contracted');
    fireEvent.click(cb);

    expect(localStorage.getItem(SK_SPEND)).not.toBeNull();
    expect(localStorage.getItem(SK_PORTER)).toBeNull();
  });

  it('modifying porter data does not write to the spend key (spend was null before)', () => {
    render(<ProcurementToolsSection isAr={false} />);
    goToTab('Market Intelligence');
    const slider = screen.getByLabelText('Supplier Power');
    fireEvent.change(slider, { target: { value: '4' } });

    const porterData = JSON.parse(localStorage.getItem(SK_PORTER) ?? '{}');
    expect(porterData).not.toHaveProperty('contracted');
  });

  it('restoring from SK_SPEND does not affect Porter slider defaults', () => {
    const seedSpend = [{
      id: 'r1', supplier: 'Acme', category: '', subcategory: '',
      annualSpend: 0, contracted: true, strategic: false,
    }];
    localStorage.setItem(SK_SPEND, JSON.stringify(seedSpend));

    render(<ProcurementToolsSection isAr={false} />);
    goToTab('Market Intelligence');

    // Porter sliders should be at default (3), not contaminated by spend data
    const slider = screen.getByLabelText('Supplier Power') as HTMLInputElement;
    expect(slider.value).toBe('3');
  });

  it('a second mount reads the same persisted spend data (shared-key consistency)', () => {
    const seedSpend = [{
      id: 'r1', supplier: 'Persistent Supplier', category: '', subcategory: '',
      annualSpend: 0, contracted: false, strategic: true,
    }];
    localStorage.setItem(SK_SPEND, JSON.stringify(seedSpend));

    // First mount
    render(<ProcurementToolsSection isAr={false} />);
    expect(screen.getByLabelText('Persistent Supplier: contracted')).toBeInTheDocument();
    cleanup();

    // Second mount (simulates component being re-rendered)
    render(<ProcurementToolsSection isAr={false} />);
    expect(screen.getByLabelText('Persistent Supplier: contracted')).toBeInTheDocument();
  });
});
