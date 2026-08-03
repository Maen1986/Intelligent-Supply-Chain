/**
 * Task 365 — Confirm the "⚠ not saved locally" status text appears when
 * safeSetItem fails (i.e. storage quota is exceeded).
 *
 * The SupplierScorecard header renders the sync label from a ternary chain.
 * When localSaveFailed is true and syncStatus is idle/neither saving/saved/error,
 * the header reads "Evaluating: <name> — ⚠ not saved locally".
 *
 * We mock safeSetItem to return false and trigger a save (rename the supplier)
 * to set localSaveFailed=true, then assert the warning text is visible.
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

/* ── Module-level mocks ──────────────────────────────────────────────────── */

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: null, isAuthenticated: false, loading: false }),
}));
vi.mock('@/hooks/useAIPlan', () => ({
  useAIPlan: () => ({
    loading: false, result: null, error: null, rateLimited: false,
    generate: vi.fn(), reset: vi.fn(),
    savedPlan: null, viewSaved: vi.fn(), deleteSaved: vi.fn(),
  }),
}));
vi.mock('@/components/AIPlanPanel', () => ({ AIPlanPanel: () => null }));

// Use vi.hoisted so the mock variable is available inside the vi.mock factory.
const { mockSafeSetItem } = vi.hoisted(() => ({
  mockSafeSetItem: vi.fn(() => true),
}));
vi.mock('@/lib/storage', () => ({ safeSetItem: mockSafeSetItem }));

import { SupplierScorecardTool } from '../SupplierScorecard';

const ROSTER_KEY = 'isc-tool-supplier-roster';

beforeEach(() => {
  localStorage.clear();
  mockSafeSetItem.mockReturnValue(true); // default: saves succeed
});

afterEach(() => {
  cleanup();
});

describe('SupplierScorecard — "⚠ not saved locally" warning appears on storage failure (Task 365)', () => {
  it('shows the "not saved locally" text when safeSetItem returns false', async () => {
    localStorage.setItem(
      ROSTER_KEY,
      JSON.stringify({
        suppliers: [{ id: 's-365', name: 'Storage Corp', tier: 'Strategic', subScores: {} }],
        activeId: 's-365',
      }),
    );

    render(<SupplierScorecardTool isAr={false} />);

    // Make the next save fail
    mockSafeSetItem.mockReturnValue(false);

    // Trigger a rename (fires the save path)
    const nameInput = screen.getByDisplayValue('Storage Corp');
    fireEvent.change(nameInput, { target: { value: 'Storage Corp Updated' } });
    fireEvent.blur(nameInput);

    // The header must now show the storage warning
    await waitFor(() =>
      expect(
        screen.getByText((txt) => txt.includes('not saved locally')),
      ).toBeInTheDocument(),
    );
  });

  it('does NOT show the warning when safeSetItem succeeds', () => {
    localStorage.setItem(
      ROSTER_KEY,
      JSON.stringify({
        suppliers: [{ id: 's-365b', name: 'Happy Corp', tier: 'Strategic', subScores: {} }],
        activeId: 's-365b',
      }),
    );

    render(<SupplierScorecardTool isAr={false} />);

    // safeSetItem returns true (default) — no warning expected
    expect(
      screen.queryByText((txt) => txt.includes('not saved locally')),
    ).toBeNull();
  });

  it('shows the Arabic warning when isAr=true and save fails', async () => {
    localStorage.setItem('isc-lang', 'ar');
    localStorage.setItem(
      ROSTER_KEY,
      JSON.stringify({
        suppliers: [{ id: 's-365c', name: 'Arabic Corp', tier: 'Strategic', subScores: {} }],
        activeId: 's-365c',
      }),
    );

    render(<SupplierScorecardTool isAr />);

    mockSafeSetItem.mockReturnValue(false);

    const nameInput = screen.getByDisplayValue('Arabic Corp');
    fireEvent.change(nameInput, { target: { value: 'Arabic Corp Updated' } });
    fireEvent.blur(nameInput);

    await waitFor(() =>
      expect(
        screen.getByText((txt) => txt.includes('تعذّر الحفظ محلياً')),
      ).toBeInTheDocument(),
    );

    localStorage.removeItem('isc-lang');
  });
});
