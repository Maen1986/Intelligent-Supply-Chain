/**
 * Regression test: trend snapshot is recorded per-supplier even when two
 * suppliers share the same weighted score.
 *
 * Before the fix, `prevTrendScoreRef` tracked only the numeric score, so
 * switching from Supplier A (score X) to Supplier B (also score X) caused
 * the snapshot effect to return early, leaving Supplier B without a snapshot.
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';

/* ── Module-level mocks ─────────────────────────────────────────────────── */

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));
vi.mock('@/lib/AuthContext', () => ({ useAuth: () => ({ user: null, isAuthenticated: false, loading: false }) }));
vi.mock('@/lib/storage', () => ({ safeSetItem: vi.fn(() => true) }));
vi.mock('@/hooks/useAIPlan', () => ({
  useAIPlan: () => ({
    loading: false, result: null, error: null, rateLimited: false,
    generate: vi.fn(), reset: vi.fn(), savedPlan: null,
    viewSaved: vi.fn(), deleteSaved: vi.fn(),
    saveError: null, dismissSaveError: vi.fn(),
  }),
}));
vi.mock('@/components/AIPlanPanel', () => ({ AIPlanPanel: () => null }));

import { SupplierScorecardTool } from '../SupplierScorecard';
import { SUB_INDICATORS, DIMS } from '@/lib/scorecardCsv';

/* ── Helpers ────────────────────────────────────────────────────────────── */

const ROSTER_KEY = 'isc-tool-supplier-roster';

/** Build a subScores object that gives a fully-scored supplier (all sub-indicators = value). */
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

/** Read and parse a trend snapshot array from localStorage. */
function readTrend(supplierId: string): { month: string; weightedScore: number }[] {
  try {
    const raw = localStorage.getItem(`isc-tool-scorecard-trend-${supplierId}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

/* ── Tests ──────────────────────────────────────────────────────────────── */

describe('Scorecard trend snapshot — supplier-aware deduplication', () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
    vi.useFakeTimers({ now: new Date('2025-06-15T12:00:00Z') });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('records a snapshot for Supplier B even when it has the same weighted score as Supplier A', async () => {
    // Both suppliers have all sub-indicators set to 80 → identical weighted scores.
    const supplierA = {
      id: 'sup-a-001',
      name: 'Supplier Alpha',
      tier: 'Strategic',
      subScores: fullSubScores('80'),
    };
    const supplierB = {
      id: 'sup-b-001',
      name: 'Supplier Beta',
      tier: 'Strategic',
      subScores: fullSubScores('80'),
    };

    // Start with Supplier A active.
    const initialRoster = { suppliers: [supplierA, supplierB], activeId: supplierA.id };
    localStorage.setItem(ROSTER_KEY, JSON.stringify(initialRoster));

    const { rerender } = render(<SupplierScorecardTool isAr={false} />);

    // Let effects settle — Supplier A's snapshot should be recorded.
    await act(async () => { vi.advanceTimersByTime(100); });

    const trendA_after_first_render = readTrend(supplierA.id);
    expect(trendA_after_first_render.length).toBeGreaterThan(0);
    expect(trendA_after_first_render[0].month).toBe('2025-06');

    // Now switch to Supplier B (same score) by updating localStorage and re-rendering.
    const rosterB = { ...initialRoster, activeId: supplierB.id };
    localStorage.setItem(ROSTER_KEY, JSON.stringify(rosterB));

    // Simulate the component re-rendering with Supplier B active.
    cleanup();
    render(<SupplierScorecardTool isAr={false} />);
    await act(async () => { vi.advanceTimersByTime(100); });

    const trendB = readTrend(supplierB.id);
    expect(trendB.length).toBeGreaterThan(0);
    expect(trendB[0].month).toBe('2025-06');
    expect(trendB[0].weightedScore).toBeGreaterThan(0);
  });

  it('does not duplicate a snapshot when the same supplier is re-rendered with an unchanged score', async () => {
    const supplier = {
      id: 'sup-c-001',
      name: 'Stable Corp',
      tier: 'Strategic',
      subScores: fullSubScores('75'),
    };
    const roster = { suppliers: [supplier], activeId: supplier.id };
    localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));

    const { rerender } = render(<SupplierScorecardTool isAr={false} />);
    await act(async () => { vi.advanceTimersByTime(100); });

    const before = readTrend(supplier.id);
    expect(before.length).toBe(1);

    // Re-render without changing anything.
    rerender(<SupplierScorecardTool isAr={false} />);
    await act(async () => { vi.advanceTimersByTime(100); });

    const after = readTrend(supplier.id);
    // Still exactly one entry for this month — no duplicate appended.
    expect(after.filter(s => s.month === '2025-06').length).toBe(1);
  });
});
