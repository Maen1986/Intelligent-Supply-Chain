/**
 * Tests: ContractHealthChecker — Contract Value Tracker rebate fields (#179)
 *
 * Decision Record 8.10 finding: CLMTools.tsx already had full renewal-date
 * tracking (NOTIFY NOW / AUTO-RENEWAL badges) but no rebate-threshold /
 * purchase-volume tracking at all. This file covers the genuinely new
 * surface added in #179:
 *   1. rebateThreshold / purchaseVolume are editable, optional inputs on a
 *      contract in the Contract Inventory tab.
 *   2. The "CLAIMABLE REBATE" badge appears ONLY when both fields are
 *      present and purchaseVolume >= rebateThreshold.
 *   3. The badge does NOT appear when either field is missing, or when
 *      purchaseVolume is below rebateThreshold (never fabricate a
 *      claimable status from partial or insufficient data).
 *   4. The Contract Inventory summary "Claimable Rebates" count reflects
 *      the same logic.
 */
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { ContractHealthChecker } from './CLMTools';

/* ── Module mocks (mirrors CLMTools.test.tsx) ────────────────────────────── */

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: null, isAuthenticated: false, loading: false }),
}));

vi.mock('@/hooks/useAIPlan', () => ({
  useAIPlan: () => ({
    loading: false, result: null, error: null, rateLimited: false,
    generate: vi.fn(), reset: vi.fn(), savedPlan: null,
    viewSaved: vi.fn(), deleteSaved: vi.fn(),
  }),
}));

vi.mock('@/components/AIPlanPanel', () => ({ AIPlanPanel: () => null }));

beforeEach(() => { localStorage.clear(); cleanup(); });

/** Adds a contract via the "Add Contract" button and expands its card so
 *  the edit form (including the rebate fields) is visible. Returns the
 *  card container element. */
function addAndExpandContract(): HTMLElement {
  fireEvent.click(screen.getByRole('button', { name: /Add Contract/i }));
  const header = screen.getByText('(Contract name)');
  fireEvent.click(header);
  // The card container is the closest ancestor with the health-border class;
  // walk up to a stable ancestor that contains both header and form.
  let node: HTMLElement | null = header.parentElement;
  while (node && !node.className.includes('rounded-2xl')) node = node.parentElement;
  expect(node).not.toBeNull();
  return node as HTMLElement;
}

describe('ContractHealthChecker — rebate fields (#179)', () => {
  it('renders Rebate Threshold and Purchase Volume inputs on an expanded contract card', () => {
    render(<ContractHealthChecker isAr={false} />);
    addAndExpandContract();
    const inputs = screen.getAllByPlaceholderText('Leave blank if N/A');
    expect(inputs.length).toBe(2);
  });

  it('shows no CLAIMABLE REBATE badge when both fields are empty (never fabricate)', () => {
    render(<ContractHealthChecker isAr={false} />);
    const card = addAndExpandContract();
    expect(within(card).queryByText(/CLAIMABLE REBATE/i)).toBeNull();
  });

  it('shows no badge when only rebateThreshold is filled in', () => {
    render(<ContractHealthChecker isAr={false} />);
    const card = addAndExpandContract();
    const [thresholdInput] = screen.getAllByPlaceholderText('Leave blank if N/A');
    fireEvent.change(thresholdInput, { target: { value: '1000000' } });
    expect(within(card).queryByText(/CLAIMABLE REBATE/i)).toBeNull();
  });

  it('shows no badge when purchaseVolume is below rebateThreshold', () => {
    render(<ContractHealthChecker isAr={false} />);
    const card = addAndExpandContract();
    const [thresholdInput, volumeInput] = screen.getAllByPlaceholderText('Leave blank if N/A');
    fireEvent.change(thresholdInput, { target: { value: '1000000' } });
    fireEvent.change(volumeInput, { target: { value: '500000' } });
    expect(within(card).queryByText(/CLAIMABLE REBATE/i)).toBeNull();
  });

  it('shows the CLAIMABLE REBATE badge when purchaseVolume meets rebateThreshold', () => {
    render(<ContractHealthChecker isAr={false} />);
    const card = addAndExpandContract();
    const [thresholdInput, volumeInput] = screen.getAllByPlaceholderText('Leave blank if N/A');
    fireEvent.change(thresholdInput, { target: { value: '1000000' } });
    fireEvent.change(volumeInput, { target: { value: '1000000' } });
    expect(within(card).queryByText(/CLAIMABLE REBATE/i)).not.toBeNull();
  });

  it('shows the badge when purchaseVolume exceeds rebateThreshold', () => {
    render(<ContractHealthChecker isAr={false} />);
    const card = addAndExpandContract();
    const [thresholdInput, volumeInput] = screen.getAllByPlaceholderText('Leave blank if N/A');
    fireEvent.change(thresholdInput, { target: { value: '1000000' } });
    fireEvent.change(volumeInput, { target: { value: '1500000' } });
    expect(within(card).queryByText(/CLAIMABLE REBATE/i)).not.toBeNull();
  });

  it('removes the badge again when rebateThreshold is cleared back out', () => {
    render(<ContractHealthChecker isAr={false} />);
    const card = addAndExpandContract();
    const [thresholdInput, volumeInput] = screen.getAllByPlaceholderText('Leave blank if N/A');
    fireEvent.change(thresholdInput, { target: { value: '1000000' } });
    fireEvent.change(volumeInput, { target: { value: '1500000' } });
    expect(within(card).queryByText(/CLAIMABLE REBATE/i)).not.toBeNull();
    fireEvent.change(thresholdInput, { target: { value: '' } });
    expect(within(card).queryByText(/CLAIMABLE REBATE/i)).toBeNull();
  });

  it('updates the Contract Inventory "Claimable Rebates" summary count', () => {
    render(<ContractHealthChecker isAr={false} />);
    // Before any rebate data: no summary card shown yet (contracts.length===0
    // gate) -- add and qualify one contract first.
    const [thresholdInput, volumeInput] = (() => {
      addAndExpandContract();
      return screen.getAllByPlaceholderText('Leave blank if N/A');
    })();
    fireEvent.change(thresholdInput, { target: { value: '1000000' } });
    fireEvent.change(volumeInput, { target: { value: '1200000' } });
    expect(screen.getByText(/Claimable Rebates/i)).toBeInTheDocument();
    const summaryCard = screen.getByText(/Claimable Rebates/i).closest('div');
    expect(summaryCard).not.toBeNull();
    expect(within(summaryCard as HTMLElement).getByText('1')).toBeInTheDocument();
  });

  it('a contract with rebate fields unset does not count toward Claimable Rebates', () => {
    render(<ContractHealthChecker isAr={false} />);
    addAndExpandContract();
    const summaryCard = screen.getByText(/Claimable Rebates/i).closest('div');
    expect(summaryCard).not.toBeNull();
    expect(within(summaryCard as HTMLElement).getByText('0')).toBeInTheDocument();
  });
});
