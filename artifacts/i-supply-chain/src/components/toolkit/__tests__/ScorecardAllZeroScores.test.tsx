/**
 * Regression guard: a supplier whose every sub-indicator is 0 must show
 * "0" in the Weighted Score cell and "Transactional" in the Supplier Tier
 * cell — not blank.
 *
 * The pure-function unit test in ScorecardCsvRoundtrip confirms
 * calcWeightedScore returns 0 (not null) for all-zero input.  This
 * component test guards against the complementary UI bug: JSX code that
 * evaluates `weightedScore && <Cell>` would treat 0 as falsy and silently
 * hide the cell even though the score is valid.
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within, act, cleanup } from '@testing-library/react';

/* ── Module-level mocks ─────────────────────────────────────────────────── */

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: null, isAuthenticated: false, loading: false }),
}));
vi.mock('@/lib/storage', () => ({ safeSetItem: vi.fn(() => true) }));
vi.mock('@/hooks/useAIPlan', () => ({
  useAIPlan: () => ({
    loading: false,
    result: null,
    error: null,
    rateLimited: false,
    generate: vi.fn(),
    reset: vi.fn(),
    savedPlan: null,
    viewSaved: vi.fn(),
    deleteSaved: vi.fn(),
    saveError: null,
    dismissSaveError: vi.fn(),
  }),
}));
vi.mock('@/components/AIPlanPanel', () => ({ AIPlanPanel: () => null }));

import { SupplierScorecardTool } from '../SupplierScorecard';
import { DIMS, SUB_INDICATORS } from '@/lib/scorecardCsv';

/* ── Helpers ────────────────────────────────────────────────────────────── */

const ROSTER_KEY = 'isc-tool-supplier-roster';

/** Build a subScores object with every sub-indicator set to the given value. */
function fullSubScores(value: string): Record<string, Record<string, string>> {
  const subScores: Record<string, Record<string, string>> = {};
  DIMS.forEach(d => {
    subScores[d.id] = {};
    (SUB_INDICATORS[d.id] ?? []).forEach(sub => {
      subScores[d.id][sub.id] = value;
    });
  });
  return subScores;
}

/** Seed localStorage with one supplier whose every sub-indicator = value. */
function seedSupplierWithScore(value: string, id = 'sup-zero-001') {
  const supplier = {
    id,
    name: 'Zero Corp',
    tier: 'Strategic',
    subScores: fullSubScores(value),
  };
  localStorage.setItem(
    ROSTER_KEY,
    JSON.stringify({ suppliers: [supplier], activeId: id }),
  );
}

/* ── Tests ──────────────────────────────────────────────────────────────── */

describe('SupplierScorecardTool — all-zero sub-scores', () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, roster: null, config: null }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows "0" in the Weighted Score cell — not blank', async () => {
    seedSupplierWithScore('0');

    render(<SupplierScorecardTool isAr={false} />);

    await act(async () => {
      await new Promise(r => setTimeout(r, 30));
    });

    // The Weighted Score label must be present (score section rendered at all)
    expect(screen.getByText('Weighted Score')).toBeInTheDocument();

    // The numeric score must be "0" followed by "/100"
    // The component renders: <p>{weightedScore}<span>/100</span></p>
    // getAllByText finds any element containing "0" — we want the score display
    // which is inside a <p> alongside the "/100" span.
    const scoreEl = screen.getByText((content, element) => {
      if (!element) return false;
      // The <p> contains textContent "0/100"
      return element.tagName === 'P' && element.textContent === '0/100';
    });
    expect(scoreEl).toBeInTheDocument();
  });

  it('shows "Transactional" as the Supplier Tier — not blank', async () => {
    seedSupplierWithScore('0');

    render(<SupplierScorecardTool isAr={false} />);

    await act(async () => {
      await new Promise(r => setTimeout(r, 30));
    });

    // The "Supplier Tier" card must contain "Transactional".
    // We use the label <p> to locate its parent container so the query is
    // scoped and won't collide with the "Transactional" entry in the
    // Tier Thresholds list.
    const tierLabel = screen.getByText('Supplier Tier');
    const tierCard  = tierLabel.closest('div') as HTMLElement;
    expect(within(tierCard).getByText('Transactional')).toBeInTheDocument();
  });

  it('does not show the "incomplete" hint when all dimensions have a score of 0', async () => {
    seedSupplierWithScore('0');

    render(<SupplierScorecardTool isAr={false} />);

    await act(async () => {
      await new Promise(r => setTimeout(r, 30));
    });

    // The incomplete hint only shows when weightedScore === null
    expect(
      screen.queryByText(/Enter at least one sub-indicator in every dimension/i),
    ).toBeNull();
  });

  /* ── Arabic render path (Task 645) ──────────────────────────────────── */

  it('shows "الدرجة المرجّحة" (Arabic Weighted Score label) — not blank', async () => {
    seedSupplierWithScore('0');

    render(<SupplierScorecardTool isAr={true} />);

    await act(async () => {
      await new Promise(r => setTimeout(r, 30));
    });

    // Arabic label must be present
    expect(screen.getByText('الدرجة المرجّحة')).toBeInTheDocument();

    // Numeric score must still show "0/100"
    const scoreEl = screen.getByText((content, element) => {
      if (!element) return false;
      return element.tagName === 'P' && element.textContent === '0/100';
    });
    expect(scoreEl).toBeInTheDocument();
  });

  it('shows "معاملاتي" as the Arabic Supplier Tier — not blank', async () => {
    seedSupplierWithScore('0');

    render(<SupplierScorecardTool isAr={true} />);

    await act(async () => {
      await new Promise(r => setTimeout(r, 30));
    });

    // Arabic tier label container must be present
    const tierLabel = screen.getByText('تصنيف المورّد');
    expect(tierLabel).toBeInTheDocument();

    // Arabic Transactional label must appear inside the tier card
    const tierCard = tierLabel.closest('div') as HTMLElement;
    expect(tierCard).not.toBeNull();
    expect(tierCard.textContent).toContain('معاملاتي');
  });

  it('score card is absent (not "0") when sub-scores are genuinely missing', async () => {
    // Supplier with no sub-scores — calcWeightedScore returns null
    localStorage.setItem(
      ROSTER_KEY,
      JSON.stringify({
        suppliers: [
          { id: 'sup-empty-001', name: 'Empty Corp', tier: 'Strategic', subScores: {} },
        ],
        activeId: 'sup-empty-001',
      }),
    );

    render(<SupplierScorecardTool isAr={false} />);

    await act(async () => {
      await new Promise(r => setTimeout(r, 30));
    });

    // Score section must NOT render for a genuinely incomplete supplier
    expect(screen.queryByText('Weighted Score')).toBeNull();
    expect(screen.queryByText('Supplier Tier')).toBeNull();
  });
});
