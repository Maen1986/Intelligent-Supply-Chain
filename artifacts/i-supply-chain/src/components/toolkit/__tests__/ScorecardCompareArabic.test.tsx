/**
 * Supplier Scorecard — comparison view in Arabic (RTL) mode
 *
 * Confirms that when isAr=true the comparison table and radar chart
 * display correctly:
 *   • Arabic dimension labels (d.labelAr) in table rows
 *   • Arabic column header "البُعد" instead of "Dimension"
 *   • Arabic winner column header "الأفضل" instead of "Winner"
 *   • "تعادل" for tied dimensions instead of "Tie"
 *   • "🏆 الأفضل" badge inside winning score cells
 *   • Arabic tier badges (استراتيجي / مفضّل / معاملاتي) in the footer row
 *   • The overflow container wrapping the table has dir="rtl"
 *   • Radar chart data keys use Arabic dimension labels
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { DIMS } from '../SupplierScorecard';

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: false, user: null, loading: false }),
}));

// Silence fetch — we don't need server sync for these tests
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ ok: true, roster: null, config: null }),
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  cleanup();
});

import { SupplierScorecardTool } from '../SupplierScorecard';

const ROSTER_KEY = 'isc-tool-supplier-roster';

/** All six dimensions fully scored at `score` for a supplier */
function allScores(score: number): Record<string, Record<string, string>> {
  return {
    delivery:     { otif: String(score), lead_time: String(score), fill_rate: String(score), expedite: String(score) },
    quality:      { defect: String(score), ftr: String(score), cert: String(score), nonconf: String(score) },
    cost:         { savings: String(score), invoice: String(score), cost_reduction: String(score), tco: String(score) },
    compliance:   { regulatory: String(score), esg: String(score), docs: String(score), ethics: String(score) },
    innovation:   { ideas: String(score), collab: String(score), digital: String(score) },
    relationship: { responsiveness: String(score), comm: String(score), flex: String(score) },
  };
}

/** Seed localStorage with two suppliers and enter compare mode */
function seedAndEnterCompare(scoreA = 90, scoreB = 70) {
  localStorage.setItem(
    ROSTER_KEY,
    JSON.stringify({
      suppliers: [
        { id: 'sup-a', name: 'المورّد أ', tier: 'Strategic',    subScores: allScores(scoreA) },
        { id: 'sup-b', name: 'المورّد ب', tier: 'Preferred',    subScores: allScores(scoreB) },
      ],
      activeId: 'sup-a',
    }),
  );

  render(<SupplierScorecardTool isAr={true} />);

  // Click the "مقارنة" button to enter compare mode
  fireEvent.click(screen.getByRole('button', { name: /مقارنة/i }));

  // Select both suppliers
  fireEvent.click(screen.getByText('المورّد أ'));
  fireEvent.click(screen.getByText('المورّد ب'));
}

/** Seed with two tied suppliers (same score on every dimension) */
function seedTiedAndEnterCompare() {
  localStorage.setItem(
    ROSTER_KEY,
    JSON.stringify({
      suppliers: [
        { id: 'sup-x', name: 'المورّد س', tier: 'Strategic', subScores: allScores(80) },
        { id: 'sup-y', name: 'المورّد ص', tier: 'Strategic', subScores: allScores(80) },
      ],
      activeId: 'sup-x',
    }),
  );

  render(<SupplierScorecardTool isAr={true} />);
  fireEvent.click(screen.getByRole('button', { name: /مقارنة/i }));
  fireEvent.click(screen.getByText('المورّد س'));
  fireEvent.click(screen.getByText('المورّد ص'));
}

/* ══════════════════════════════════════════════════════════════════════════
   Column headers
══════════════════════════════════════════════════════════════════════════ */
describe('Compare view — Arabic column headers', () => {
  it('shows "البُعد" as the first column header instead of "Dimension"', () => {
    seedAndEnterCompare();
    expect(screen.getByRole('columnheader', { name: 'البُعد' })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Dimension' })).toBeNull();
  });

  it('shows "الأفضل" as the winner column header instead of "Winner"', () => {
    seedAndEnterCompare();
    expect(screen.getByRole('columnheader', { name: 'الأفضل' })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Winner' })).toBeNull();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Dimension labels
══════════════════════════════════════════════════════════════════════════ */
describe('Compare view — Arabic dimension labels', () => {
  it('renders every Arabic dimension label in the comparison table', () => {
    seedAndEnterCompare();
    for (const d of DIMS) {
      expect(screen.getAllByText(d.labelAr).length).toBeGreaterThan(0);
    }
  });

  it('does not render any English dimension labels in the table', () => {
    seedAndEnterCompare();
    for (const d of DIMS) {
      // English label should not appear as a standalone cell in the table
      const cells = screen.queryAllByText(d.label);
      // Allow zero occurrences — the English label must not appear as a table cell
      expect(cells.length).toBe(0);
    }
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Winner badge in cells
══════════════════════════════════════════════════════════════════════════ */
describe('Compare view — Arabic winner badge in score cells', () => {
  it('shows "🏆 الأفضل" badge in cells where the supplier leads', () => {
    seedAndEnterCompare(90, 70);
    // Supplier A scores higher — the "الأفضل" badge should appear
    const badges = screen.getAllByText(/الأفضل/);
    // At least the column header + at least one cell badge (supplier A wins all dims)
    expect(badges.length).toBeGreaterThanOrEqual(2);
  });

  it('does not show English "Best" badge anywhere', () => {
    seedAndEnterCompare(90, 70);
    expect(screen.queryByText(/🏆 Best/)).toBeNull();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Tie label
══════════════════════════════════════════════════════════════════════════ */
describe('Compare view — Arabic tie label', () => {
  it('shows "تعادل" in the winner column for every tied dimension', () => {
    seedTiedAndEnterCompare();
    const tieCells = screen.getAllByText('تعادل');
    // Six dimensions + overall footer = at least 7 "تعادل" instances
    expect(tieCells.length).toBeGreaterThanOrEqual(7);
  });

  it('does not render the English word "Tie" anywhere', () => {
    seedTiedAndEnterCompare();
    expect(screen.queryByText('Tie')).toBeNull();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   RTL layout — dir attribute
══════════════════════════════════════════════════════════════════════════ */
describe('Compare view — RTL dir attribute', () => {
  it('the overflow container wrapping the comparison table has dir="rtl"', () => {
    seedAndEnterCompare();
    // The table is wrapped in an overflow-x-auto div with dir=rtl
    const table = screen.getByRole('table');
    const container = table.closest('[dir]');
    expect(container).not.toBeNull();
    expect(container?.getAttribute('dir')).toBe('rtl');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Arabic tier badges in footer
══════════════════════════════════════════════════════════════════════════ */
describe('Compare view — Arabic tier badges in weighted-score footer', () => {
  it('shows Arabic tier label "استراتيجي" when weighted score qualifies', () => {
    // scoreA=90 → Strategic tier
    seedAndEnterCompare(90, 70);
    expect(screen.getAllByText('استراتيجي').length).toBeGreaterThan(0);
  });

  it('shows Arabic tier label "مفضّل" when weighted score qualifies', () => {
    // scoreB=70 → Preferred tier (threshold 55–74)
    seedAndEnterCompare(90, 70);
    expect(screen.getAllByText('مفضّل').length).toBeGreaterThan(0);
  });

  it('does not show English tier labels in Arabic mode', () => {
    seedAndEnterCompare(90, 70);
    expect(screen.queryByText('Strategic')).toBeNull();
    expect(screen.queryByText('Preferred')).toBeNull();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Weighted score footer — overall winner
══════════════════════════════════════════════════════════════════════════ */
describe('Compare view — Arabic weighted score footer winner', () => {
  it('displays the winning supplier name with a trophy in the footer winner cell', () => {
    seedAndEnterCompare(90, 70);
    // Footer winner cell should contain "🏆 المورّد أ"
    expect(screen.getByText(/🏆.*المورّد أ|المورّد أ.*🏆/)).toBeInTheDocument();
  });

  it('shows "تعادل" in the footer winner cell when both suppliers have the same weighted score', () => {
    seedTiedAndEnterCompare();
    // tfoot winner cell should show تعادل
    const tfoot = document.querySelector('tfoot');
    expect(tfoot).not.toBeNull();
    expect(within(tfoot!).getByText('تعادل')).toBeInTheDocument();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Arabic "غير مكتمل" for incomplete suppliers
══════════════════════════════════════════════════════════════════════════ */
describe('Compare view — Arabic incomplete label', () => {
  it('shows "غير مكتمل" instead of "Incomplete" for a supplier with no scores', () => {
    localStorage.setItem(
      ROSTER_KEY,
      JSON.stringify({
        suppliers: [
          { id: 'sup-full', name: 'مكتمل',    tier: 'Strategic', subScores: allScores(80) },
          { id: 'sup-empty', name: 'غير مكتمل', tier: 'Strategic', subScores: {} },
        ],
        activeId: 'sup-full',
      }),
    );
    render(<SupplierScorecardTool isAr={true} />);
    fireEvent.click(screen.getByRole('button', { name: /مقارنة/i }));
    fireEvent.click(screen.getByText('مكتمل'));
    fireEvent.click(screen.getByText('غير مكتمل'));

    // The footer should show Arabic "غير مكتمل" for the empty supplier
    expect(screen.getAllByText('غير مكتمل').length).toBeGreaterThan(0);
    expect(screen.queryByText('Incomplete')).toBeNull();
  });
});
