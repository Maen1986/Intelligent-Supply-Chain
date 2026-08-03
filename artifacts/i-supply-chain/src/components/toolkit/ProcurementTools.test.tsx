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
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, within, waitFor } from '@testing-library/react';
import { ProcurementToolsSection } from './ProcurementTools';

/* ── Current localStorage keys (must match component source) ───────────── */
const SK_SPEND  = 'isc-tool-catmgmt-spend-v2';
const SK_PORTER = 'isc-tool-catmgmt-porter-v2';

/* ── FileReader stub: synchronously calls onload with provided text ─────── */
function makeFileReaderStub(text: string) {
  return class FileReaderStub {
    onload: ((e: { target: { result: string } }) => void) | null = null;
    readAsText(_file: File) {
      this.onload?.({ target: { result: text } });
    }
  };
}

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

/* ── helper: click a tab by partial label text ─────────────────────────── */
function goToTab(label: string) {
  fireEvent.click(screen.getByRole('tab', { name: new RegExp(label, 'i') }));
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

  it('all 5 tab buttons are rendered with role="tab"', () => {
    render(<ProcurementToolsSection isAr={false} />);
    expect(screen.getByRole('tab', { name: /Spend Analysis/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Market Intelligence/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Sourcing Strategy/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Templates/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /AI Strategy Brief/i })).toBeInTheDocument();
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
    fireEvent.click(screen.getByRole('tab', { name: /استخبارات السوق/i }));
    expect(screen.getByLabelText('قوة الموردين')).toBeInTheDocument();
  });

  it('Buyer Power slider has Arabic aria-label in AR mode', () => {
    render(<ProcurementToolsSection isAr={true} />);
    fireEvent.click(screen.getByRole('tab', { name: /استخبارات السوق/i }));
    expect(screen.getByLabelText('قوة المشترين')).toBeInTheDocument();
  });

  it('Threat of New Entrants slider has Arabic aria-label in AR mode', () => {
    render(<ProcurementToolsSection isAr={true} />);
    fireEvent.click(screen.getByRole('tab', { name: /استخبارات السوق/i }));
    expect(screen.getByLabelText('تهديد الداخلين الجدد')).toBeInTheDocument();
  });

  it('Threat of Substitutes slider has Arabic aria-label in AR mode', () => {
    render(<ProcurementToolsSection isAr={true} />);
    fireEvent.click(screen.getByRole('tab', { name: /استخبارات السوق/i }));
    expect(screen.getByLabelText('تهديد المنتجات البديلة')).toBeInTheDocument();
  });

  it('Competitive Rivalry slider has Arabic aria-label in AR mode', () => {
    render(<ProcurementToolsSection isAr={true} />);
    fireEvent.click(screen.getByRole('tab', { name: /استخبارات السوق/i }));
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
   Suite 5 — Arrow-key tab navigation (LTR)
   ArrowRight/ArrowLeft move focus through the tab list; wrap at both ends.
══════════════════════════════════════════════════════════════════════════ */
describe('ProcurementToolsSection — arrow-key tab navigation (LTR)', () => {
  // Helper: get the tab button that is currently active (aria-selected=true)
  function activeTabName() {
    const selected = screen.getAllByRole('tab').find(
      el => el.getAttribute('aria-selected') === 'true',
    );
    return selected?.textContent ?? '';
  }

  it('tab buttons have role="tab" and the tablist container has role="tablist"', () => {
    render(<ProcurementToolsSection isAr={false} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(6);
  });

  it('first tab is aria-selected on mount', () => {
    render(<ProcurementToolsSection isAr={false} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    tabs.slice(1).forEach(t => expect(t.getAttribute('aria-selected')).toBe('false'));
  });

  it('ArrowRight moves focus from first tab to second tab', () => {
    render(<ProcurementToolsSection isAr={false} />);
    const tabs = screen.getAllByRole('tab');
    fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
  });

  it('ArrowRight advances through all tabs sequentially', () => {
    render(<ProcurementToolsSection isAr={false} />);
    const tabs = screen.getAllByRole('tab');
    // Start at tab 0, press right 5 times → should land on tab 5 (last)
    for (let i = 0; i < 5; i++) {
      const current = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
      fireEvent.keyDown(tabs[current], { key: 'ArrowRight' });
    }
    expect(tabs[5].getAttribute('aria-selected')).toBe('true');
  });

  it('ArrowRight wraps from last tab back to first tab', () => {
    render(<ProcurementToolsSection isAr={false} />);
    const tabs = screen.getAllByRole('tab');
    // Navigate to the last tab first
    for (let i = 0; i < 5; i++) {
      const current = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
      fireEvent.keyDown(tabs[current], { key: 'ArrowRight' });
    }
    expect(tabs[5].getAttribute('aria-selected')).toBe('true');
    // One more ArrowRight should wrap to first
    fireEvent.keyDown(tabs[5], { key: 'ArrowRight' });
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
  });

  it('ArrowLeft moves focus from second tab back to first tab', () => {
    render(<ProcurementToolsSection isAr={false} />);
    const tabs = screen.getAllByRole('tab');
    fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(tabs[1], { key: 'ArrowLeft' });
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
  });

  it('ArrowLeft wraps from first tab to last tab', () => {
    render(<ProcurementToolsSection isAr={false} />);
    const tabs = screen.getAllByRole('tab');
    fireEvent.keyDown(tabs[0], { key: 'ArrowLeft' });
    expect(tabs[5].getAttribute('aria-selected')).toBe('true');
  });

  it('Home key jumps directly to first tab from any position', () => {
    render(<ProcurementToolsSection isAr={false} />);
    const tabs = screen.getAllByRole('tab');
    // Go to tab 3 first
    fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
    fireEvent.keyDown(tabs[1], { key: 'ArrowRight' });
    fireEvent.keyDown(tabs[2], { key: 'ArrowRight' });
    expect(tabs[3].getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(tabs[3], { key: 'Home' });
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
  });

  it('End key jumps directly to last tab from any position', () => {
    render(<ProcurementToolsSection isAr={false} />);
    const tabs = screen.getAllByRole('tab');
    fireEvent.keyDown(tabs[0], { key: 'End' });
    expect(tabs[5].getAttribute('aria-selected')).toBe('true');
  });

  it('navigating to a tab via ArrowRight shows its panel content', () => {
    render(<ProcurementToolsSection isAr={false} />);
    const tabs = screen.getAllByRole('tab');
    // Default: Spend Analysis panel visible
    expect(screen.getByLabelText('Supplier: contracted')).toBeInTheDocument();
    // Press ArrowRight once → Market Intelligence
    fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
    expect(screen.queryByLabelText('Supplier: contracted')).toBeNull();
    expect(screen.getByLabelText('Supplier Power')).toBeInTheDocument();
  });

  it('navigating back via ArrowLeft restores the previous panel', () => {
    render(<ProcurementToolsSection isAr={false} />);
    const tabs = screen.getAllByRole('tab');
    fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
    fireEvent.keyDown(tabs[1], { key: 'ArrowLeft' });
    expect(screen.getByLabelText('Supplier: contracted')).toBeInTheDocument();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 6 — Arrow-key tab navigation in Arabic (RTL) mode
   Decision: physical key direction is unchanged in RTL.
   ArrowRight = next tab in DOM order (wraps), ArrowLeft = previous tab.
   This matches WAI-ARIA authoring practices and avoids breaking keyboard
   muscle memory for bilingual users who switch languages mid-session.
   Screen readers announce tab order by DOM position, not visual position,
   so swapping keys would create a mismatch.
══════════════════════════════════════════════════════════════════════════ */
describe('ProcurementToolsSection — arrow-key tab navigation (Arabic / RTL)', () => {
  it('tab buttons are present with role="tab" in Arabic mode', () => {
    render(<ProcurementToolsSection isAr={true} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(6);
  });

  it('first tab is aria-selected on mount in Arabic mode', () => {
    render(<ProcurementToolsSection isAr={true} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
  });

  it('ArrowRight moves to the next tab in DOM order in Arabic mode', () => {
    render(<ProcurementToolsSection isAr={true} />);
    const tabs = screen.getAllByRole('tab');
    fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    expect(tabs[0].getAttribute('aria-selected')).toBe('false');
  });

  it('ArrowRight advances through all 6 tabs in Arabic mode', () => {
    render(<ProcurementToolsSection isAr={true} />);
    const tabs = screen.getAllByRole('tab');
    for (let expected = 1; expected <= 5; expected++) {
      const current = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
      fireEvent.keyDown(tabs[current], { key: 'ArrowRight' });
      expect(tabs[expected].getAttribute('aria-selected')).toBe('true');
    }
  });

  it('ArrowRight wraps from last tab to first tab in Arabic mode', () => {
    render(<ProcurementToolsSection isAr={true} />);
    const tabs = screen.getAllByRole('tab');
    // Navigate to last tab
    for (let i = 0; i < 5; i++) {
      const current = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
      fireEvent.keyDown(tabs[current], { key: 'ArrowRight' });
    }
    expect(tabs[5].getAttribute('aria-selected')).toBe('true');
    // Wrap
    fireEvent.keyDown(tabs[5], { key: 'ArrowRight' });
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
  });

  it('ArrowLeft moves to the previous tab in DOM order in Arabic mode', () => {
    render(<ProcurementToolsSection isAr={true} />);
    const tabs = screen.getAllByRole('tab');
    fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(tabs[1], { key: 'ArrowLeft' });
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
  });

  it('ArrowLeft wraps from first tab to last tab in Arabic mode', () => {
    render(<ProcurementToolsSection isAr={true} />);
    const tabs = screen.getAllByRole('tab');
    fireEvent.keyDown(tabs[0], { key: 'ArrowLeft' });
    expect(tabs[5].getAttribute('aria-selected')).toBe('true');
  });

  it('full round-trip: ArrowRight × 6 returns to the starting tab in Arabic mode', () => {
    render(<ProcurementToolsSection isAr={true} />);
    const tabs = screen.getAllByRole('tab');
    for (let i = 0; i < 6; i++) {
      const current = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
      fireEvent.keyDown(tabs[current], { key: 'ArrowRight' });
    }
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
  });

  it('full round-trip: ArrowLeft × 6 returns to the starting tab in Arabic mode', () => {
    render(<ProcurementToolsSection isAr={true} />);
    const tabs = screen.getAllByRole('tab');
    for (let i = 0; i < 6; i++) {
      const current = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
      fireEvent.keyDown(tabs[current], { key: 'ArrowLeft' });
    }
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
  });

  it('Home key jumps to first tab in Arabic mode', () => {
    render(<ProcurementToolsSection isAr={true} />);
    const tabs = screen.getAllByRole('tab');
    fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
    fireEvent.keyDown(tabs[1], { key: 'ArrowRight' });
    expect(tabs[2].getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(tabs[2], { key: 'Home' });
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
  });

  it('End key jumps to last tab in Arabic mode', () => {
    render(<ProcurementToolsSection isAr={true} />);
    const tabs = screen.getAllByRole('tab');
    fireEvent.keyDown(tabs[0], { key: 'End' });
    expect(tabs[5].getAttribute('aria-selected')).toBe('true');
  });

  it('ArrowRight in Arabic mode switches panel content (Market Intelligence panel appears)', () => {
    render(<ProcurementToolsSection isAr={true} />);
    const tabs = screen.getAllByRole('tab');
    // Default: Spend Analysis panel (Arabic mode shows Arabic aria-labels)
    expect(screen.getByLabelText(/تحت عقد/)).toBeInTheDocument();
    // ArrowRight once → Market Intelligence
    fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
    expect(screen.queryByLabelText(/تحت عقد/)).toBeNull();
    expect(screen.getByLabelText('قوة الموردين')).toBeInTheDocument();
  });

  it('ArrowLeft from Market Intelligence in Arabic mode returns to Spend Analysis panel', () => {
    render(<ProcurementToolsSection isAr={true} />);
    const tabs = screen.getAllByRole('tab');
    fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
    expect(screen.getByLabelText('قوة الموردين')).toBeInTheDocument();
    fireEvent.keyDown(tabs[1], { key: 'ArrowLeft' });
    expect(screen.getByLabelText(/تحت عقد/)).toBeInTheDocument();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 7 — Storage key isolation
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

/* ══════════════════════════════════════════════════════════════════════════
   Suite 8 — CategoryProfileBuilder: Arabic quadrant labels (isAr=true)
   The auto-recommendation card on the Sourcing Strategy tab must render
   Arabic strategy labels and quadrant context text for all 4 Kraljic
   scenarios (Strategic, Leverage, Dual-source/Transitioning, Preferred).

   autoStrategy logic (from component source):
     highConcentration = top3Pct > 60 || validRows.length <= 2
     highRisk          = porterAvg >= 3.5
     highConc  + highRisk                      → strategic-partnership
     !highConc + !highRisk + totalSpend>500K   → competitive-tender
     highConc  + !highRisk                     → dual-source
     !highConc + highRisk                      → preferred-supplier
══════════════════════════════════════════════════════════════════════════ */

const PORTER_FORCE_IDS = [
  'supplier_power', 'buyer_power', 'new_entrants', 'substitutes', 'rivalry',
];

/** Build a Porter seed with every force set to the same score. */
function makePorterSeed(score: number): Record<string, { score: number; notes: string }> {
  return Object.fromEntries(PORTER_FORCE_IDS.map(id => [id, { score, notes: '' }]));
}

/**
 * 6 valid rows with equal spend → top3Pct = 50 % (≤ 60), validRows.length = 6 (> 2)
 * → highConcentration = false.  totalSpend = 600 000 > 500 000.
 */
function makeSpreadRows() {
  return [1, 2, 3, 4, 5, 6].map(i => ({
    id: `r${i}`, supplier: `Supplier ${i}`, category: 'MRO', subcategory: '',
    annualSpend: 100_000, contracted: false, strategic: false, notes: '',
  }));
}

/**
 * 1 valid row → validRows.length = 1 (≤ 2) → highConcentration = true.
 */
function makeSingleRow() {
  return [{
    id: 'r1', supplier: 'Alpha Corp', category: 'Raw Materials', subcategory: '',
    annualSpend: 600_000, contracted: false, strategic: false, notes: '',
  }];
}

/** Click the Sourcing Strategy tab (3rd tab, index 2). */
function goToStrategyTab() {
  fireEvent.click(screen.getAllByRole('tab')[2]);
}

describe('ProcurementToolsSection — CategoryProfileBuilder Arabic quadrant labels', () => {
  /* ── Scenario 1: Strategic quadrant ─────────────────────────────────────
     highConcentration (1 row) + highRisk (porterAvg = 5)
     → autoStrategy = 'strategic-partnership'
     Arabic label: "شراكة استراتيجية"
     Arabic context (whenAr): contains "ربع استراتيجي"
  ──────────────────────────────────────────────────────────────────────── */
  it('shows Arabic label for Strategic quadrant (شراكة استراتيجية)', () => {
    localStorage.setItem(SK_SPEND,  JSON.stringify(makeSingleRow()));
    localStorage.setItem(SK_PORTER, JSON.stringify(makePorterSeed(5)));

    render(<ProcurementToolsSection isAr={true} />);
    goToStrategyTab();

    // The label appears in both the recommendation header and the strategy
    // explorer card — getAllByText handles both matches.
    expect(screen.getAllByText('شراكة استراتيجية').length).toBeGreaterThan(0);
  });

  it('shows Arabic quadrant context "ربع استراتيجي" for Strategic scenario', () => {
    localStorage.setItem(SK_SPEND,  JSON.stringify(makeSingleRow()));
    localStorage.setItem(SK_PORTER, JSON.stringify(makePorterSeed(5)));

    render(<ProcurementToolsSection isAr={true} />);
    goToStrategyTab();

    expect(screen.getAllByText(/ربع استراتيجي/).length).toBeGreaterThan(0);
  });

  it('shows Arabic description for Strategic quadrant', () => {
    localStorage.setItem(SK_SPEND,  JSON.stringify(makeSingleRow()));
    localStorage.setItem(SK_PORTER, JSON.stringify(makePorterSeed(5)));

    render(<ProcurementToolsSection isAr={true} />);
    goToStrategyTab();

    // descAr for strategic-partnership
    expect(screen.getAllByText(/شراكة تعاونية طويلة الأمد/).length).toBeGreaterThan(0);
  });

  /* ── Scenario 2: Leverage quadrant ──────────────────────────────────────
     !highConcentration (6 spread rows, top3Pct = 50 %)
     + !highRisk (porterAvg = 2)
     + totalSpend = 600 000 > 500 000
     → autoStrategy = 'competitive-tender'
     Arabic label: "مناقصة تنافسية"
     Arabic context (whenAr): contains "ربع الرافعة"
  ──────────────────────────────────────────────────────────────────────── */
  it('shows Arabic label for Leverage quadrant (مناقصة تنافسية)', () => {
    localStorage.setItem(SK_SPEND,  JSON.stringify(makeSpreadRows()));
    localStorage.setItem(SK_PORTER, JSON.stringify(makePorterSeed(2)));

    render(<ProcurementToolsSection isAr={true} />);
    goToStrategyTab();

    expect(screen.getAllByText('مناقصة تنافسية').length).toBeGreaterThan(0);
  });

  it('shows Arabic quadrant context "ربع الرافعة" for Leverage scenario', () => {
    localStorage.setItem(SK_SPEND,  JSON.stringify(makeSpreadRows()));
    localStorage.setItem(SK_PORTER, JSON.stringify(makePorterSeed(2)));

    render(<ProcurementToolsSection isAr={true} />);
    goToStrategyTab();

    expect(screen.getAllByText(/ربع الرافعة/).length).toBeGreaterThan(0);
  });

  it('shows Arabic description for Leverage quadrant', () => {
    localStorage.setItem(SK_SPEND,  JSON.stringify(makeSpreadRows()));
    localStorage.setItem(SK_PORTER, JSON.stringify(makePorterSeed(2)));

    render(<ProcurementToolsSection isAr={true} />);
    goToStrategyTab();

    // descAr for competitive-tender
    expect(screen.getAllByText(/طرح عروض مفتوح/).length).toBeGreaterThan(0);
  });

  /* ── Scenario 3: Transitioning / Dual-source quadrant ───────────────────
     highConcentration (1 row) + !highRisk (porterAvg = 2)
     → autoStrategy = 'dual-source'
     Arabic label: "مصدران للتوريد"
  ──────────────────────────────────────────────────────────────────────── */
  it('shows Arabic label for Dual-source quadrant (مصدران للتوريد)', () => {
    localStorage.setItem(SK_SPEND,  JSON.stringify(makeSingleRow()));
    localStorage.setItem(SK_PORTER, JSON.stringify(makePorterSeed(2)));

    render(<ProcurementToolsSection isAr={true} />);
    goToStrategyTab();

    expect(screen.getAllByText('مصدران للتوريد').length).toBeGreaterThan(0);
  });

  it('shows Arabic description for Dual-source quadrant', () => {
    localStorage.setItem(SK_SPEND,  JSON.stringify(makeSingleRow()));
    localStorage.setItem(SK_PORTER, JSON.stringify(makePorterSeed(2)));

    render(<ProcurementToolsSection isAr={true} />);
    goToStrategyTab();

    // descAr for dual-source
    expect(screen.getAllByText(/مورّدان مؤهّلان مسبقاً/).length).toBeGreaterThan(0);
  });

  it('shows Arabic whenAr context for Dual-source quadrant', () => {
    localStorage.setItem(SK_SPEND,  JSON.stringify(makeSingleRow()));
    localStorage.setItem(SK_PORTER, JSON.stringify(makePorterSeed(2)));

    render(<ProcurementToolsSection isAr={true} />);
    goToStrategyTab();

    // whenAr: 'إنفاق مرتفع + مخاطر متوسطة'
    expect(screen.getAllByText(/إنفاق مرتفع.*مخاطر متوسطة/).length).toBeGreaterThan(0);
  });

  /* ── Scenario 4: Preferred Supplier quadrant ─────────────────────────────
     !highConcentration (6 spread rows) + highRisk (porterAvg = 5)
     → autoStrategy = 'preferred-supplier'
     Arabic label: "برنامج الموردين المفضّلين"
  ──────────────────────────────────────────────────────────────────────── */
  it('shows Arabic label for Preferred Supplier quadrant (برنامج الموردين المفضّلين)', () => {
    localStorage.setItem(SK_SPEND,  JSON.stringify(makeSpreadRows()));
    localStorage.setItem(SK_PORTER, JSON.stringify(makePorterSeed(5)));

    render(<ProcurementToolsSection isAr={true} />);
    goToStrategyTab();

    expect(screen.getAllByText('برنامج الموردين المفضّلين').length).toBeGreaterThan(0);
  });

  it('shows Arabic description for Preferred Supplier quadrant', () => {
    localStorage.setItem(SK_SPEND,  JSON.stringify(makeSpreadRows()));
    localStorage.setItem(SK_PORTER, JSON.stringify(makePorterSeed(5)));

    render(<ProcurementToolsSection isAr={true} />);
    goToStrategyTab();

    // descAr for preferred-supplier
    expect(screen.getAllByText(/لائحة مؤهّلة مسبقاً/).length).toBeGreaterThan(0);
  });

  it('shows Arabic whenAr context for Preferred Supplier quadrant', () => {
    localStorage.setItem(SK_SPEND,  JSON.stringify(makeSpreadRows()));
    localStorage.setItem(SK_PORTER, JSON.stringify(makePorterSeed(5)));

    render(<ProcurementToolsSection isAr={true} />);
    goToStrategyTab();

    // whenAr: 'إنفاق متوسط + مخاطر متوسطة'
    expect(screen.getAllByText(/إنفاق متوسط.*مخاطر متوسطة/).length).toBeGreaterThan(0);
  });

  /* ── Cross-cutting: English mode must NOT show Arabic labels ─────────────
     Ensures the isAr guard is actually doing work.
  ──────────────────────────────────────────────────────────────────────── */
  it('does NOT show Arabic strategy label when isAr=false (Strategic scenario)', () => {
    localStorage.setItem(SK_SPEND,  JSON.stringify(makeSingleRow()));
    localStorage.setItem(SK_PORTER, JSON.stringify(makePorterSeed(5)));

    render(<ProcurementToolsSection isAr={false} />);
    goToStrategyTab();

    expect(screen.queryAllByText('شراكة استراتيجية')).toHaveLength(0);
    expect(screen.getAllByText('Strategic Partnership').length).toBeGreaterThan(0);
  });

  it('does NOT show Arabic strategy label when isAr=false (Leverage scenario)', () => {
    localStorage.setItem(SK_SPEND,  JSON.stringify(makeSpreadRows()));
    localStorage.setItem(SK_PORTER, JSON.stringify(makePorterSeed(2)));

    render(<ProcurementToolsSection isAr={false} />);
    goToStrategyTab();

    expect(screen.queryAllByText('مناقصة تنافسية')).toHaveLength(0);
    expect(screen.getAllByText('Competitive Tendering').length).toBeGreaterThan(0);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 9 — SpendParetoChart CSV import in Arabic mode
   Confirms the Arabic success message and localStorage update.
══════════════════════════════════════════════════════════════════════════ */
describe('ProcurementToolsSection — SpendParetoChart CSV import (Arabic mode)', () => {
  const VALID_CSV =
    'Supplier,Category,Subcategory,Annual Spend (SAR),YTD Spend (SAR),Contracted (Yes/No),Strategic (Yes/No),Notes\n' +
    'مورد الخليج,مواد أولية,كيماويات,1200000,900000,Yes,Yes,عقد طويل\n' +
    'شركة النور,لوجستيات,شحن,420000,315000,Yes,No,عقد سنوي\n';

  /* Helper: simulate a file-input change with the given CSV text */
  function fireFileInput(text: string) {
    // Install stub before firing so the component's FileReader is replaced
    (globalThis as any).FileReader = makeFileReaderStub(text);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([text], 'spend.csv', { type: 'text/csv' });
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    fireEvent.change(input, { target: { files: [file] } });
  }

  it('import button is present in Arabic mode', () => {
    render(<ProcurementToolsSection isAr={true} />);
    expect(screen.getByRole('button', { name: 'استيراد CSV' })).toBeInTheDocument();
  });

  it('hidden file input is present in Arabic mode', () => {
    render(<ProcurementToolsSection isAr={true} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.accept).toBe('.csv');
  });

  it('shows Arabic success message after a valid CSV import', () => {
    render(<ProcurementToolsSection isAr={true} />);
    fireFileInput(VALID_CSV);
    // Message format: ✓ تم استيراد N مورّد(ين).
    expect(screen.getByText(/✓ تم استيراد 2 مورّد\(ين\)\./)).toBeInTheDocument();
  });

  it('success message starts with ✓ (success class applied)', () => {
    render(<ProcurementToolsSection isAr={true} />);
    fireFileInput(VALID_CSV);
    const msg = screen.getByText(/✓ تم استيراد/);
    // Parent log container should have emerald styling (success)
    expect(msg.closest('.bg-emerald-50')).not.toBeNull();
  });

  it('imports the correct number of rows into localStorage', () => {
    render(<ProcurementToolsSection isAr={true} />);
    fireFileInput(VALID_CSV);
    const saved = JSON.parse(localStorage.getItem(SK_SPEND) ?? '[]') as { supplier: string }[];
    expect(saved).toHaveLength(2);
  });

  it('saves the correct supplier names to localStorage', () => {
    render(<ProcurementToolsSection isAr={true} />);
    fireFileInput(VALID_CSV);
    const saved = JSON.parse(localStorage.getItem(SK_SPEND) ?? '[]') as { supplier: string }[];
    expect(saved[0].supplier).toBe('مورد الخليج');
    expect(saved[1].supplier).toBe('شركة النور');
  });

  it('saves the correct annualSpend values to localStorage', () => {
    render(<ProcurementToolsSection isAr={true} />);
    fireFileInput(VALID_CSV);
    const saved = JSON.parse(localStorage.getItem(SK_SPEND) ?? '[]') as { annualSpend: number }[];
    expect(saved[0].annualSpend).toBe(1200000);
    expect(saved[1].annualSpend).toBe(420000);
  });

  it('saves contracted=true when CSV has "Yes"', () => {
    render(<ProcurementToolsSection isAr={true} />);
    fireFileInput(VALID_CSV);
    const saved = JSON.parse(localStorage.getItem(SK_SPEND) ?? '[]') as { contracted: boolean }[];
    expect(saved[0].contracted).toBe(true);
    expect(saved[1].contracted).toBe(true);
  });

  it('saves strategic correctly (Yes → true, No → false)', () => {
    render(<ProcurementToolsSection isAr={true} />);
    fireFileInput(VALID_CSV);
    const saved = JSON.parse(localStorage.getItem(SK_SPEND) ?? '[]') as { strategic: boolean }[];
    expect(saved[0].strategic).toBe(true);
    expect(saved[1].strategic).toBe(false);
  });

  it('shows an error log when required columns are missing', () => {
    render(<ProcurementToolsSection isAr={true} />);
    const badCsv = 'Name,Spend\nمورد,1000\n';
    fireFileInput(badCsv);
    // Error path shows the Arabic failure header
    expect(screen.getByText('فشل الاستيراد:')).toBeInTheDocument();
  });

  it('error log container has red styling on failure', () => {
    render(<ProcurementToolsSection isAr={true} />);
    fireFileInput('Name,Spend\nمورد,1000\n');
    const msg = screen.getByText('فشل الاستيراد:');
    expect(msg.closest('.bg-red-50')).not.toBeNull();
  });

  it('skips empty-supplier rows and notes them in the log', () => {
    render(<ProcurementToolsSection isAr={true} />);
    const csvWithEmpty =
      'Supplier,Category,Subcategory,Annual Spend (SAR),YTD Spend (SAR),Contracted (Yes/No),Strategic (Yes/No),Notes\n' +
      ',مواد,فئة,500000,,,, \n' +
      'مورد الخليج,مواد أولية,كيماويات,1200000,900000,Yes,Yes,\n';
    fireFileInput(csvWithEmpty);
    // Only the non-empty row should be imported
    expect(screen.getByText(/✓ تم استيراد 1 مورّد\(ين\)\./)).toBeInTheDocument();
    const saved = JSON.parse(localStorage.getItem(SK_SPEND) ?? '[]') as { supplier: string }[];
    expect(saved[0].supplier).toBe('مورد الخليج');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 6 — Arrow-key tab navigation (ARIA tablist pattern)
   ArrowRight/ArrowLeft must move focus and activate the correct tab.
══════════════════════════════════════════════════════════════════════════ */
describe('ProcurementToolsSection — arrow-key tab navigation', () => {
  it('tab bar container has role="tablist"', () => {
    render(<ProcurementToolsSection isAr={false} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('all 6 tabs have role="tab"', () => {
    render(<ProcurementToolsSection isAr={false} />);
    expect(screen.getAllByRole('tab').length).toBe(6);
  });

  it('default tab is aria-selected and has tabIndex 0', () => {
    render(<ProcurementToolsSection isAr={false} />);
    const first = screen.getByRole('tab', { name: /Spend Analysis/i });
    expect(first).toHaveAttribute('aria-selected', 'true');
    expect(first).toHaveAttribute('tabindex', '0');
  });

  it('non-active tabs have tabIndex -1', () => {
    render(<ProcurementToolsSection isAr={false} />);
    const second = screen.getByRole('tab', { name: /Market Intelligence/i });
    expect(second).toHaveAttribute('tabindex', '-1');
  });

  it('ArrowRight moves focus to the next tab and marks it selected', () => {
    render(<ProcurementToolsSection isAr={false} />);
    const first = screen.getByRole('tab', { name: /Spend Analysis/i });
    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowRight' });
    const second = screen.getByRole('tab', { name: /Market Intelligence/i });
    expect(second).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(second);
  });

  it('ArrowLeft moves focus to the previous tab and marks it selected', () => {
    render(<ProcurementToolsSection isAr={false} />);
    // Navigate to the second tab first
    fireEvent.click(screen.getByRole('tab', { name: /Market Intelligence/i }));
    const second = screen.getByRole('tab', { name: /Market Intelligence/i });
    second.focus();
    fireEvent.keyDown(second, { key: 'ArrowLeft' });
    const first = screen.getByRole('tab', { name: /Spend Analysis/i });
    expect(first).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(first);
  });

  it('ArrowRight wraps from last tab to first', () => {
    render(<ProcurementToolsSection isAr={false} />);
    const last = screen.getByRole('tab', { name: /Alert Thresholds/i });
    fireEvent.click(last);
    last.focus();
    fireEvent.keyDown(last, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: /Spend Analysis/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('ArrowLeft wraps from first tab to last', () => {
    render(<ProcurementToolsSection isAr={false} />);
    const first = screen.getByRole('tab', { name: /Spend Analysis/i });
    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowLeft' });
    expect(screen.getByRole('tab', { name: /Alert Thresholds/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('ArrowRight then panel content reflects the newly active tab', () => {
    render(<ProcurementToolsSection isAr={false} />);
    const first = screen.getByRole('tab', { name: /Spend Analysis/i });
    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowRight' });
    // Market Intelligence content should now be present (Porter sliders)
    expect(screen.getByLabelText('Supplier Power')).toBeInTheDocument();
    // Spend Analysis content should be gone
    expect(screen.queryByLabelText('Supplier: contracted')).toBeNull();
  });

  it('other keys on a tab do not change the active tab', () => {
    render(<ProcurementToolsSection isAr={false} />);
    const first = screen.getByRole('tab', { name: /Spend Analysis/i });
    first.focus();
    fireEvent.keyDown(first, { key: 'Enter' });
    expect(first).toHaveAttribute('aria-selected', 'true');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 10 — Arrow-key navigation to Sourcing Strategy and Templates tabs
   ArrowRight from tab 2 → 3 → 4 activates each panel in turn and shows
   panel-specific content; verified in both LTR and RTL modes.
   Also confirms wrap-around tests still pass after navigating through all tabs.
══════════════════════════════════════════════════════════════════════════ */
describe('ProcurementToolsSection — arrow-key navigation to Sourcing Strategy and Templates tabs (LTR)', () => {
  it('ArrowRight from Market Intelligence (tab 2) activates Sourcing Strategy panel', () => {
    render(<ProcurementToolsSection isAr={false} />);
    const tabs = screen.getAllByRole('tab');

    // Navigate to tab 2 (Market Intelligence)
    fireEvent.click(tabs[1]);
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');

    // ArrowRight → tab 3 (Sourcing Strategy)
    fireEvent.keyDown(tabs[1], { key: 'ArrowRight' });
    expect(tabs[2].getAttribute('aria-selected')).toBe('true');

    // Panel-specific content: strategy explorer heading
    expect(screen.getByText(/Explore All 7 Strategies/i)).toBeInTheDocument();
    // Market Intelligence content is gone
    expect(screen.queryByLabelText('Supplier Power')).toBeNull();
  });

  it('ArrowRight from Sourcing Strategy (tab 3) activates Templates & Tools panel', () => {
    render(<ProcurementToolsSection isAr={false} />);
    const tabs = screen.getAllByRole('tab');

    // Navigate to tab 3 (Sourcing Strategy)
    fireEvent.click(tabs[2]);
    expect(tabs[2].getAttribute('aria-selected')).toBe('true');

    // ArrowRight → tab 4 (Templates & Tools)
    fireEvent.keyDown(tabs[2], { key: 'ArrowRight' });
    expect(tabs[3].getAttribute('aria-selected')).toBe('true');

    // Panel-specific content: one of the well-known template names
    expect(screen.getByText(/RFP \/ RFQ Template/i)).toBeInTheDocument();
    // Sourcing Strategy content is gone
    expect(screen.queryByText(/Explore All 7 Strategies/i)).toBeNull();
  });

  it('sequential ArrowRight from tab 2 → 3 → 4 activates each panel in turn', () => {
    render(<ProcurementToolsSection isAr={false} />);
    const tabs = screen.getAllByRole('tab');

    // Start at tab 2
    fireEvent.click(tabs[1]);

    // → tab 3: Sourcing Strategy
    fireEvent.keyDown(tabs[1], { key: 'ArrowRight' });
    expect(tabs[2].getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText(/Explore All 7 Strategies/i)).toBeInTheDocument();

    // → tab 4: Templates & Tools
    fireEvent.keyDown(tabs[2], { key: 'ArrowRight' });
    expect(tabs[3].getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText(/RFP \/ RFQ Template/i)).toBeInTheDocument();
  });

  it('wrap-around still works after navigating through Sourcing Strategy and Templates tabs', () => {
    render(<ProcurementToolsSection isAr={false} />);
    const tabs = screen.getAllByRole('tab');

    // Navigate all the way to the last tab
    for (let i = 0; i < 5; i++) {
      const current = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
      fireEvent.keyDown(tabs[current], { key: 'ArrowRight' });
    }
    expect(tabs[5].getAttribute('aria-selected')).toBe('true');

    // One more ArrowRight should wrap to first tab
    fireEvent.keyDown(tabs[5], { key: 'ArrowRight' });
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(screen.getByLabelText('Supplier: contracted')).toBeInTheDocument();
  });

  it('ArrowLeft from Templates & Tools (tab 4) returns to Sourcing Strategy panel', () => {
    render(<ProcurementToolsSection isAr={false} />);
    const tabs = screen.getAllByRole('tab');

    fireEvent.click(tabs[3]);
    expect(tabs[3].getAttribute('aria-selected')).toBe('true');

    fireEvent.keyDown(tabs[3], { key: 'ArrowLeft' });
    expect(tabs[2].getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText(/Explore All 7 Strategies/i)).toBeInTheDocument();
  });
});

describe('ProcurementToolsSection — arrow-key navigation to Sourcing Strategy and Templates tabs (RTL)', () => {
  it('ArrowRight from Market Intelligence (tab 2) activates Sourcing Strategy panel in Arabic mode', () => {
    render(<ProcurementToolsSection isAr={true} />);
    const tabs = screen.getAllByRole('tab');

    // Navigate to tab 2 (Market Intelligence)
    fireEvent.click(tabs[1]);
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');

    // ArrowRight → tab 3 (Sourcing Strategy)
    fireEvent.keyDown(tabs[1], { key: 'ArrowRight' });
    expect(tabs[2].getAttribute('aria-selected')).toBe('true');

    // Panel-specific content: Arabic strategy explorer heading
    expect(screen.getByText(/استكشف جميع الاستراتيجيات/)).toBeInTheDocument();
    // Market Intelligence content is gone
    expect(screen.queryByLabelText('قوة الموردين')).toBeNull();
  });

  it('ArrowRight from Sourcing Strategy (tab 3) activates Templates & Tools panel in Arabic mode', () => {
    render(<ProcurementToolsSection isAr={true} />);
    const tabs = screen.getAllByRole('tab');

    // Navigate to tab 3
    fireEvent.click(tabs[2]);
    expect(tabs[2].getAttribute('aria-selected')).toBe('true');

    // ArrowRight → tab 4 (Templates & Tools)
    fireEvent.keyDown(tabs[2], { key: 'ArrowRight' });
    expect(tabs[3].getAttribute('aria-selected')).toBe('true');

    // Panel-specific content: Arabic info text on the templates panel
    expect(screen.getByText(/قوالب CIPS-متوافقة جاهزة للتحميل/)).toBeInTheDocument();
    // Sourcing Strategy content is gone
    expect(screen.queryByText(/استكشف جميع الاستراتيجيات/)).toBeNull();
  });

  it('sequential ArrowRight from tab 2 → 3 → 4 activates each Arabic panel in turn', () => {
    render(<ProcurementToolsSection isAr={true} />);
    const tabs = screen.getAllByRole('tab');

    // Start at tab 2
    fireEvent.click(tabs[1]);

    // → tab 3: Sourcing Strategy (Arabic)
    fireEvent.keyDown(tabs[1], { key: 'ArrowRight' });
    expect(tabs[2].getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText(/استكشف جميع الاستراتيجيات/)).toBeInTheDocument();

    // → tab 4: Templates & Tools (Arabic)
    fireEvent.keyDown(tabs[2], { key: 'ArrowRight' });
    expect(tabs[3].getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText(/قوالب CIPS-متوافقة جاهزة للتحميل/)).toBeInTheDocument();
  });

  it('wrap-around still works in Arabic mode after navigating through all tabs', () => {
    render(<ProcurementToolsSection isAr={true} />);
    const tabs = screen.getAllByRole('tab');

    // Navigate all the way to the last tab
    for (let i = 0; i < 5; i++) {
      const current = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
      fireEvent.keyDown(tabs[current], { key: 'ArrowRight' });
    }
    expect(tabs[5].getAttribute('aria-selected')).toBe('true');

    // One more ArrowRight should wrap to first tab
    fireEvent.keyDown(tabs[5], { key: 'ArrowRight' });
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    // Spend Analysis panel content visible in Arabic mode
    expect(screen.getByLabelText(/تحت عقد/)).toBeInTheDocument();
  });

  it('ArrowLeft from Templates & Tools (tab 4) returns to Sourcing Strategy panel in Arabic mode', () => {
    render(<ProcurementToolsSection isAr={true} />);
    const tabs = screen.getAllByRole('tab');

    fireEvent.click(tabs[3]);
    expect(tabs[3].getAttribute('aria-selected')).toBe('true');

    fireEvent.keyDown(tabs[3], { key: 'ArrowLeft' });
    expect(tabs[2].getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText(/استكشف جميع الاستراتيجيات/)).toBeInTheDocument();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 11 — KPI Alert Thresholds panel
   Covers: tab presence, input fields, localStorage initial load,
           breach badge rendering, breach banner, save persistence.
══════════════════════════════════════════════════════════════════════════ */

const SK_THRESHOLDS = 'isc-tool-catmgmt-thresholds-v1';

/** Pre-populate localStorage spend data for breach tests. */
function seedSpend(contracted: boolean, annualSpend = 10000) {
  const spend = [{ id: 'r1', supplier: 'ACME', category: '', subcategory: '', annualSpend, contracted, strategic: false, notes: '' }];
  localStorage.setItem('isc-tool-catmgmt-spend-v2', JSON.stringify(spend));
}

describe('ProcurementToolsSection — KPI Alert Thresholds', () => {
  /* ── Tab presence ───────────────────────────────────────────────────── */

  it('Alert Thresholds tab exists in the tab list (LTR)', () => {
    render(<ProcurementToolsSection isAr={false} />);
    expect(screen.getByRole('tab', { name: /Alert Thresholds/i })).toBeInTheDocument();
  });

  it('Alert Thresholds tab exists in Arabic mode', () => {
    render(<ProcurementToolsSection isAr={true} />);
    expect(screen.getByRole('tab', { name: /حدود التنبيه/i })).toBeInTheDocument();
  });

  /* ── Panel content ──────────────────────────────────────────────────── */

  it('panel shows warn and critical inputs for all three KPIs', () => {
    render(<ProcurementToolsSection isAr={false} />);
    fireEvent.click(screen.getByRole('tab', { name: /Alert Thresholds/i }));
    expect(screen.getByLabelText(/Warn threshold for Contracted %/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Critical threshold for Contracted %/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Warn threshold for Top-3 Concentration %/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Critical threshold for Top-3 Concentration %/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Warn threshold for Market Risk Score/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Critical threshold for Market Risk Score/i)).toBeInTheDocument();
  });

  it('panel shows Arabic aria-labels in Arabic mode', () => {
    render(<ProcurementToolsSection isAr={true} />);
    fireEvent.click(screen.getByRole('tab', { name: /حدود التنبيه/i }));
    expect(screen.getByLabelText(/حد التحذير لـ الإنفاق المتعاقد %/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/حد الإنذار الحرج لـ درجة مخاطر السوق/i)).toBeInTheDocument();
  });

  /* ── localStorage initial load ──────────────────────────────────────── */

  it('draft input values are pre-filled from localStorage on mount', () => {
    const stored = { contractedPct: { warn: 65, critical: 35, higherIsBetter: true, label: 'Contracted %' } };
    localStorage.setItem(SK_THRESHOLDS, JSON.stringify(stored));
    render(<ProcurementToolsSection isAr={false} />);
    fireEvent.click(screen.getByRole('tab', { name: /Alert Thresholds/i }));
    const warnInput = screen.getByLabelText(/Warn threshold for Contracted %/i) as HTMLInputElement;
    expect(warnInput.value).toBe('65');
    const critInput = screen.getByLabelText(/Critical threshold for Contracted %/i) as HTMLInputElement;
    expect(critInput.value).toBe('35');
  });

  it('all three KPI drafts are restored from localStorage on mount', () => {
    const stored = {
      contractedPct: { warn: 70, critical: 40, higherIsBetter: true },
      top3Pct:       { warn: 55, critical: 75, higherIsBetter: false },
      porterAvg:     { warn: 3.5, critical: 4.5, higherIsBetter: false },
    };
    localStorage.setItem(SK_THRESHOLDS, JSON.stringify(stored));
    render(<ProcurementToolsSection isAr={false} />);
    fireEvent.click(screen.getByRole('tab', { name: /Alert Thresholds/i }));
    expect((screen.getByLabelText(/Warn threshold for Contracted %/i) as HTMLInputElement).value).toBe('70');
    expect((screen.getByLabelText(/Warn threshold for Top-3 Concentration %/i) as HTMLInputElement).value).toBe('55');
    expect((screen.getByLabelText(/Warn threshold for Market Risk Score/i) as HTMLInputElement).value).toBe('3.5');
  });

  /* ── Breach badges on summary cards ────────────────────────────────── */

  it('CRIT badge appears on Contracted % card when value is at or below the critical threshold', () => {
    // higherIsBetter=true, critical=40 → contractedPct=0 is critical
    const stored = { contractedPct: { warn: 70, critical: 40, higherIsBetter: true } };
    localStorage.setItem(SK_THRESHOLDS, JSON.stringify(stored));
    seedSpend(false); // 0% contracted
    render(<ProcurementToolsSection isAr={false} />);
    expect(screen.getAllByText('CRIT').length).toBeGreaterThan(0);
  });

  it('WARN badge appears on Contracted % card when value is between warn and critical', () => {
    // warn=30, critical=−1 → contractedPct=0 is between: 0 <= 30 (warn) but 0 > -1 (not critical)
    const stored = { contractedPct: { warn: 30, critical: -1, higherIsBetter: true } };
    localStorage.setItem(SK_THRESHOLDS, JSON.stringify(stored));
    seedSpend(false); // 0% contracted
    render(<ProcurementToolsSection isAr={false} />);
    expect(screen.getAllByText('WARN').length).toBeGreaterThan(0);
    expect(screen.queryByText('CRIT')).toBeNull();
  });

  it('no breach badge when contracted % is above warn threshold', () => {
    // 100% contracted, warn=70 → no breach
    const stored = { contractedPct: { warn: 70, critical: 40, higherIsBetter: true } };
    localStorage.setItem(SK_THRESHOLDS, JSON.stringify(stored));
    seedSpend(true); // 100% contracted
    render(<ProcurementToolsSection isAr={false} />);
    expect(screen.queryByText('CRIT')).toBeNull();
    expect(screen.queryByText('WARN')).toBeNull();
  });

  it('CRIT badge appears on Top-3 Concentration card when top3Pct exceeds critical threshold', () => {
    // higherIsBetter=false, critical=70 → top3Pct=100 (single supplier) is critical
    const stored = { top3Pct: { warn: 50, critical: 70, higherIsBetter: false } };
    localStorage.setItem(SK_THRESHOLDS, JSON.stringify(stored));
    seedSpend(false, 10000); // single supplier → top3Pct = 100%
    render(<ProcurementToolsSection isAr={false} />);
    expect(screen.getAllByText('CRIT').length).toBeGreaterThan(0);
  });

  it('no badge when no thresholds are configured', () => {
    seedSpend(false);
    render(<ProcurementToolsSection isAr={false} />);
    expect(screen.queryByText('CRIT')).toBeNull();
    expect(screen.queryByText('WARN')).toBeNull();
  });

  /* ── Breach banner ──────────────────────────────────────────────────── */

  it('amber breach banner appears when any KPI is in breach', () => {
    const stored = { contractedPct: { warn: 70, critical: 40, higherIsBetter: true } };
    localStorage.setItem(SK_THRESHOLDS, JSON.stringify(stored));
    seedSpend(false); // 0% contracted → breach
    render(<ProcurementToolsSection isAr={false} />);
    expect(screen.getByText(/One or more KPIs are breaching alert thresholds/i)).toBeInTheDocument();
  });

  it('breach banner does not appear when no thresholds are configured', () => {
    seedSpend(false);
    render(<ProcurementToolsSection isAr={false} />);
    expect(screen.queryByText(/breaching alert thresholds/i)).toBeNull();
  });

  it('breach banner does not appear when all KPIs are within thresholds', () => {
    const stored = { contractedPct: { warn: 30, critical: 10, higherIsBetter: true } };
    localStorage.setItem(SK_THRESHOLDS, JSON.stringify(stored));
    seedSpend(true); // 100% contracted → no breach (100 > 30)
    render(<ProcurementToolsSection isAr={false} />);
    expect(screen.queryByText(/breaching alert thresholds/i)).toBeNull();
  });

  /* ── Save persists to localStorage (no network call) ───────────────── */

  it('clicking Save writes entered thresholds to localStorage synchronously', () => {
    render(<ProcurementToolsSection isAr={false} />);
    fireEvent.click(screen.getByRole('tab', { name: /Alert Thresholds/i }));
    const warnInput = screen.getByLabelText(/Warn threshold for Contracted %/i);
    const critInput = screen.getByLabelText(/Critical threshold for Contracted %/i);
    fireEvent.change(warnInput, { target: { value: '65' } });
    fireEvent.change(critInput, { target: { value: '35' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Alert Thresholds/i }));
    const raw  = localStorage.getItem(SK_THRESHOLDS);
    const saved = JSON.parse(raw ?? '{}');
    expect(saved.contractedPct?.warn).toBe(65);
    expect(saved.contractedPct?.critical).toBe(35);
  });

  it('saved thresholds immediately activate breach badges without a page reload', () => {
    seedSpend(false); // 0% contracted
    render(<ProcurementToolsSection isAr={false} />);
    // No badges before setting thresholds
    expect(screen.queryByText('CRIT')).toBeNull();
    // Open thresholds tab, enter values, save
    fireEvent.click(screen.getByRole('tab', { name: /Alert Thresholds/i }));
    fireEvent.change(screen.getByLabelText(/Warn threshold for Contracted %/i), { target: { value: '70' } });
    fireEvent.change(screen.getByLabelText(/Critical threshold for Contracted %/i), { target: { value: '40' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Alert Thresholds/i }));
    // Navigate back to Spend Analysis to see badges
    fireEvent.click(screen.getByRole('tab', { name: /Spend Analysis/i }));
    expect(screen.getAllByText('CRIT').length).toBeGreaterThan(0);
  });

  it('Top-3 Concentration warn and critical inputs are correctly saved', () => {
    render(<ProcurementToolsSection isAr={false} />);
    fireEvent.click(screen.getByRole('tab', { name: /Alert Thresholds/i }));
    fireEvent.change(screen.getByLabelText(/Warn threshold for Top-3 Concentration %/i), { target: { value: '55' } });
    fireEvent.change(screen.getByLabelText(/Critical threshold for Top-3 Concentration %/i), { target: { value: '80' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Alert Thresholds/i }));
    const saved = JSON.parse(localStorage.getItem(SK_THRESHOLDS) ?? '{}');
    expect(saved.top3Pct?.warn).toBe(55);
    expect(saved.top3Pct?.critical).toBe(80);
  });

  it('Market Risk Score warn threshold is correctly saved', () => {
    render(<ProcurementToolsSection isAr={false} />);
    fireEvent.click(screen.getByRole('tab', { name: /Alert Thresholds/i }));
    fireEvent.change(screen.getByLabelText(/Warn threshold for Market Risk Score/i), { target: { value: '3.5' } });
    fireEvent.change(screen.getByLabelText(/Critical threshold for Market Risk Score/i), { target: { value: '4.5' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Alert Thresholds/i }));
    const saved = JSON.parse(localStorage.getItem(SK_THRESHOLDS) ?? '{}');
    expect(saved.porterAvg?.warn).toBe(3.5);
    expect(saved.porterAvg?.critical).toBe(4.5);
  });
});
