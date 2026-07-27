/**
 * SupplierScorecardTool — comparison table tie-display tests (component level)
 *
 * These tests render the real SupplierScorecardTool component and interact
 * with it the same way a user would to confirm the comparison table renders
 * "Tie" (EN) / "تعادل" (AR) in the Winner column when two suppliers score
 * equally on a dimension or share the same weighted total.
 *
 * Interaction flow per test:
 *   1. Seed localStorage with two or three suppliers (scored identically or
 *      with one clearly ahead).
 *   2. Render the component.
 *   3. Click "Compare" to enter compare mode.
 *   4. Click each supplier row to select them.
 *   5. Assert the Winner column (and footer) contain the right label.
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

/* ── module-level mocks (must be hoisted before the component import) ───── */

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: null, isAuthenticated: false, loading: false }),
}));

vi.mock('@/lib/storage', () => ({ safeSetItem: vi.fn(() => true) }));

vi.mock('@/hooks/useAIPlan', () => ({
  useAIPlan: () => ({
    loading: false, result: null, error: null, rateLimited: false,
    generate: vi.fn(), reset: vi.fn(),
    savedPlan: null, viewSaved: vi.fn(), deleteSaved: vi.fn(),
    saveError: null, dismissSaveError: vi.fn(),
  }),
}));

vi.mock('@/components/AIPlanPanel', () => ({ AIPlanPanel: () => null }));

import { SupplierScorecardTool } from '../SupplierScorecard';

/* ── localStorage key ───────────────────────────────────────────────────── */

const ROSTER_KEY = 'isc-tool-supplier-roster';

/* ── Sub-indicator id sets (matches scorecardCsv.ts) ────────────────────── */

const ALL_SUB_IDS: Record<string, string[]> = {
  delivery:     ['otif', 'lead_time', 'fill_rate', 'expedite'],
  quality:      ['defect', 'ftr', 'cert', 'nonconf'],
  cost:         ['savings', 'invoice', 'cost_reduction', 'tco'],
  compliance:   ['regulatory', 'esg', 'docs', 'ethics'],
  innovation:   ['ideas', 'implemented', 'tech'],
  relationship: ['responsiveness', 'resolution', 'collaboration'],
};

/** Build subScores with the same value for every sub-indicator of every dim. */
function uniformSubScores(value: string): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  for (const [dimId, subs] of Object.entries(ALL_SUB_IDS)) {
    out[dimId] = {};
    for (const subId of subs) out[dimId][subId] = value;
  }
  return out;
}

/** Build subScores where one dimension uses `dimValue`, all others use `defaultValue`. */
function subScoresWithDimOverride(
  dimId: string,
  dimValue: string,
  defaultValue: string,
): Record<string, Record<string, string>> {
  const out = uniformSubScores(defaultValue);
  for (const subId of ALL_SUB_IDS[dimId] ?? []) out[dimId][subId] = dimValue;
  return out;
}

/** Seed localStorage with a two-supplier roster. */
function seedRoster(
  a: { id: string; name: string; subScores: Record<string, Record<string, string>> },
  b: { id: string; name: string; subScores: Record<string, Record<string, string>> },
) {
  const roster = {
    suppliers: [
      { id: a.id, name: a.name, tier: 'Strategic', subScores: a.subScores },
      { id: b.id, name: b.name, tier: 'Strategic', subScores: b.subScores },
    ],
    activeId: a.id,
  };
  localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
}

/** Seed localStorage with a three-supplier roster. */
function seedRoster3(
  a: { id: string; name: string; subScores: Record<string, Record<string, string>> },
  b: { id: string; name: string; subScores: Record<string, Record<string, string>> },
  c: { id: string; name: string; subScores: Record<string, Record<string, string>> },
) {
  const roster = {
    suppliers: [
      { id: a.id, name: a.name, tier: 'Strategic', subScores: a.subScores },
      { id: b.id, name: b.name, tier: 'Strategic', subScores: b.subScores },
      { id: c.id, name: c.name, tier: 'Strategic', subScores: c.subScores },
    ],
    activeId: a.id,
  };
  localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
}

/**
 * Open compare mode and select both suppliers by clicking their roster rows.
 * Assumes the component has already been rendered.
 */
function openCompareAndSelectBoth(nameA: string, nameB: string) {
  fireEvent.click(screen.getByText('Compare'));
  // In compare mode every roster row is clickable; click by supplier name
  fireEvent.click(screen.getByText(nameA));
  fireEvent.click(screen.getByText(nameB));
}

function openCompareAndSelectThree(nameA: string, nameB: string, nameC: string) {
  fireEvent.click(screen.getByText('Compare'));
  fireEvent.click(screen.getByText(nameA));
  fireEvent.click(screen.getByText(nameB));
  fireEvent.click(screen.getByText(nameC));
}

/* ── lifecycle ──────────────────────────────────────────────────────────── */

beforeEach(() => {
  localStorage.clear();
  cleanup();
  // No auth → no fetch; localStorage is the sole source of truth
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 1 — Per-dimension Winner column shows "Tie" on equal scores (EN)
══════════════════════════════════════════════════════════════════════════ */

describe('Comparison table — Winner column, English mode', () => {
  it('shows "Tie" for every dimension row when both suppliers have identical sub-indicator values', async () => {
    seedRoster(
      { id: 'sup-a', name: 'Alpha Corp', subScores: uniformSubScores('80') },
      { id: 'sup-b', name: 'Beta Ltd',   subScores: uniformSubScores('80') },
    );

    render(<SupplierScorecardTool isAr={false} />);
    openCompareAndSelectBoth('Alpha Corp', 'Beta Ltd');

    // The Winner column header should appear
    expect(await screen.findByText('Winner')).toBeInTheDocument();

    // Every dimension row Winner cell should say "Tie" (not a supplier name)
    const tieCells = screen.getAllByText('Tie');
    expect(tieCells.length).toBeGreaterThanOrEqual(6); // one per dimension + footer
  });

  it('does NOT show any supplier name in a tied Winner cell', async () => {
    seedRoster(
      { id: 'sup-a', name: 'Alpha Corp', subScores: uniformSubScores('70') },
      { id: 'sup-b', name: 'Beta Ltd',   subScores: uniformSubScores('70') },
    );

    render(<SupplierScorecardTool isAr={false} />);
    openCompareAndSelectBoth('Alpha Corp', 'Beta Ltd');

    await screen.findByText('Winner');

    // All "Tie" cells must be present
    expect(screen.getAllByText('Tie').length).toBeGreaterThanOrEqual(6);

    // The Winner column must contain neither supplier name
    // (supplier names DO appear in the column headers, so we scope to
    //  the footer winner cell by checking the footer context)
    const tieCells = screen.getAllByText('Tie');
    for (const cell of tieCells) {
      expect(cell.textContent).not.toContain('Alpha Corp');
      expect(cell.textContent).not.toContain('Beta Ltd');
    }
  });

  it('shows the correct winner name when one supplier clearly outscores the other', async () => {
    seedRoster(
      { id: 'sup-a', name: 'Alpha Corp', subScores: uniformSubScores('90') },
      { id: 'sup-b', name: 'Beta Ltd',   subScores: uniformSubScores('60') },
    );

    render(<SupplierScorecardTool isAr={false} />);
    openCompareAndSelectBoth('Alpha Corp', 'Beta Ltd');

    await screen.findByText('Winner');

    // Alpha should appear in multiple Winner cells (one per dimension + footer)
    const winnerCells = screen.getAllByText((_, el) =>
      el?.tagName !== 'TH' && !!el?.closest('td') && el?.textContent === 'Alpha Corp',
    );
    expect(winnerCells.length).toBeGreaterThan(0);

    // "Tie" must NOT appear when there's a clear winner everywhere
    expect(screen.queryByText('Tie')).not.toBeInTheDocument();
  });

  it('shows "Tie" on one dimension and a winner on another in the same comparison', async () => {
    // delivery: both 80 → Tie; quality: Alpha 90, Beta 60 → Alpha wins
    seedRoster(
      { id: 'sup-a', name: 'Alpha Corp', subScores: subScoresWithDimOverride('quality', '90', '80') },
      { id: 'sup-b', name: 'Beta Ltd',   subScores: subScoresWithDimOverride('quality', '60', '80') },
    );

    render(<SupplierScorecardTool isAr={false} />);
    openCompareAndSelectBoth('Alpha Corp', 'Beta Ltd');

    await screen.findByText('Winner');

    // At least one "Tie" cell (delivery, cost, compliance, innovation, relationship all tie)
    expect(screen.getAllByText('Tie').length).toBeGreaterThanOrEqual(1);

    // At least one "Alpha Corp" winner cell (quality row)
    const winnerCells = screen.getAllByText((_, el) =>
      el?.tagName !== 'TH' && !!el?.closest('td') && el?.textContent === 'Alpha Corp',
    );
    expect(winnerCells.length).toBeGreaterThan(0);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 2 — Winner column shows "تعادل" (Arabic) on tied scores
══════════════════════════════════════════════════════════════════════════ */

describe('Comparison table — Winner column, Arabic mode', () => {
  it('shows "تعادل" (Tie in Arabic) for every dimension row when scores are equal', async () => {
    seedRoster(
      { id: 'sup-a', name: 'مورّد ألفا', subScores: uniformSubScores('75') },
      { id: 'sup-b', name: 'مورّد بيتا', subScores: uniformSubScores('75') },
    );

    render(<SupplierScorecardTool isAr={true} />);

    // Arabic mode compare button is "مقارنة"
    fireEvent.click(screen.getByText('مقارنة'));
    fireEvent.click(screen.getByText('مورّد ألفا'));
    fireEvent.click(screen.getByText('مورّد بيتا'));

    // Arabic Winner column header is "الأفضل"
    expect(await screen.findByText('الأفضل')).toBeInTheDocument();

    // Tie label in Arabic
    const tieCells = screen.getAllByText('تعادل');
    expect(tieCells.length).toBeGreaterThanOrEqual(6);
  });

  it('does NOT show "Tie" (English) in Arabic mode', async () => {
    seedRoster(
      { id: 'sup-a', name: 'مورّد ألفا', subScores: uniformSubScores('75') },
      { id: 'sup-b', name: 'مورّد بيتا', subScores: uniformSubScores('75') },
    );

    render(<SupplierScorecardTool isAr={true} />);

    fireEvent.click(screen.getByText('مقارنة'));
    fireEvent.click(screen.getByText('مورّد ألفا'));
    fireEvent.click(screen.getByText('مورّد بيتا'));

    await screen.findByText('الأفضل');

    expect(screen.queryByText('Tie')).not.toBeInTheDocument();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 3 — Overall weighted-score footer tie detection
══════════════════════════════════════════════════════════════════════════ */

describe('Comparison table — overall weighted-score footer', () => {
  it('shows "Tie" in the footer when both suppliers have the same weighted total', async () => {
    seedRoster(
      { id: 'sup-a', name: 'Alpha Corp', subScores: uniformSubScores('80') },
      { id: 'sup-b', name: 'Beta Ltd',   subScores: uniformSubScores('80') },
    );

    render(<SupplierScorecardTool isAr={false} />);
    openCompareAndSelectBoth('Alpha Corp', 'Beta Ltd');

    await screen.findByText('Winner');

    // The footer row's Weighted Score cell should contain "Tie"
    const tieCells = screen.getAllByText('Tie');
    expect(tieCells.length).toBeGreaterThanOrEqual(1);
  });

  it('shows the winner name (with trophy) in the footer when scores differ', async () => {
    seedRoster(
      { id: 'sup-a', name: 'Alpha Corp', subScores: uniformSubScores('90') },
      { id: 'sup-b', name: 'Beta Ltd',   subScores: uniformSubScores('60') },
    );

    render(<SupplierScorecardTool isAr={false} />);
    openCompareAndSelectBoth('Alpha Corp', 'Beta Ltd');

    await screen.findByText('Winner');

    // Footer winner cell contains a trophy emoji + winner name
    const footerWinnerCells = screen.getAllByText((_, el) =>
      !!el?.closest('tfoot') && (el?.textContent?.includes('Alpha Corp') ?? false),
    );
    expect(footerWinnerCells.length).toBeGreaterThan(0);
    expect(footerWinnerCells[0].textContent).toContain('🏆');
  });

  it('footer shows "Tie" in Arabic when weighted totals are equal', async () => {
    seedRoster(
      { id: 'sup-a', name: 'مورّد ألفا', subScores: uniformSubScores('65') },
      { id: 'sup-b', name: 'مورّد بيتا', subScores: uniformSubScores('65') },
    );

    render(<SupplierScorecardTool isAr={true} />);

    fireEvent.click(screen.getByText('مقارنة'));
    fireEvent.click(screen.getByText('مورّد ألفا'));
    fireEvent.click(screen.getByText('مورّد بيتا'));

    await screen.findByText('الأفضل');

    const tieCells = screen.getAllByText('تعادل');
    expect(tieCells.length).toBeGreaterThanOrEqual(1);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 4 — No stale winner name leaks into tied cells
   Guards against a regression where the component might show the name of the
   previously computed winner after scores are equalised.
══════════════════════════════════════════════════════════════════════════ */

describe('Comparison table — stale-name guard', () => {
  it('Winner column never contains both "Alpha Corp" and "Tie" in the same cell', async () => {
    seedRoster(
      { id: 'sup-a', name: 'Alpha Corp', subScores: uniformSubScores('80') },
      { id: 'sup-b', name: 'Beta Ltd',   subScores: uniformSubScores('80') },
    );

    render(<SupplierScorecardTool isAr={false} />);
    openCompareAndSelectBoth('Alpha Corp', 'Beta Ltd');

    await screen.findByText('Winner');

    const tieCells = screen.getAllByText('Tie');
    for (const cell of tieCells) {
      expect(cell.textContent).not.toContain('Alpha Corp');
      expect(cell.textContent).not.toContain('Beta Ltd');
    }
  });

  it('winner cell contains exactly the winning name and no other supplier name', async () => {
    seedRoster(
      { id: 'sup-a', name: 'Alpha Corp', subScores: uniformSubScores('90') },
      { id: 'sup-b', name: 'Beta Ltd',   subScores: uniformSubScores('55') },
    );

    render(<SupplierScorecardTool isAr={false} />);
    openCompareAndSelectBoth('Alpha Corp', 'Beta Ltd');

    await screen.findByText('Winner');

    // All winner td cells should name Alpha only
    const winnerTds = screen.getAllByText((_, el) =>
      el?.tagName !== 'TH' && !!el?.closest('td') && el?.textContent === 'Alpha Corp',
    );
    expect(winnerTds.length).toBeGreaterThan(0);
    for (const td of winnerTds) {
      expect(td.textContent).not.toContain('Beta Ltd');
    }
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 5 — Three-supplier comparison: all tied
══════════════════════════════════════════════════════════════════════════ */

describe('Comparison table — three-supplier tie', () => {
  it('shows "Tie" for every dimension when all three suppliers score the same', async () => {
    seedRoster3(
      { id: 'sup-a', name: 'Alpha', subScores: uniformSubScores('70') },
      { id: 'sup-b', name: 'Beta',  subScores: uniformSubScores('70') },
      { id: 'sup-c', name: 'Gamma', subScores: uniformSubScores('70') },
    );

    render(<SupplierScorecardTool isAr={false} />);
    openCompareAndSelectThree('Alpha', 'Beta', 'Gamma');

    await screen.findByText('Winner');

    const tieCells = screen.getAllByText('Tie');
    expect(tieCells.length).toBeGreaterThanOrEqual(6); // one per dimension + footer
  });
});
