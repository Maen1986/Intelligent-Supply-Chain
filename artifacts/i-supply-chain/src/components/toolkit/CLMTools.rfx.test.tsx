/**
 * Tests: RFx Builder tab (Module 03 Part D, built 26 Aug 2026, closes
 * Site Map registry #394 -- "no RFx UI exists yet" gap disclosed in the
 * #371 v97 update).
 *
 * The underlying business logic (recommendRfxType, scoreRfxBidders) is
 * already fully covered in clmContractLifecycle.test.ts. This file covers
 * only the new UI surface:
 *   1. The RFx Builder tab renders and can be switched to.
 *   2. Toggling the three selection checkboxes changes the recommended
 *      RFx type badge (RFI -> RFP -> RFQ), matching recommendRfxType()'s
 *      real selection rule.
 *   3. Adding a bidder appends an editable row; removing it removes the row.
 *   4. Weighted scoring computes correctly for a bidder that passes the
 *      mandatory gate.
 *   5. A bidder that fails the mandatory gate is disqualified and excluded
 *      from the weighted comparison, per the two-stage compliance-gate
 *      pattern.
 */
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { ContractHealthChecker } from './CLMTools';

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

function openRfxTab() {
  render(<ContractHealthChecker isAr={false} />);
  fireEvent.click(screen.getByRole('tab', { name: /RFx Builder/i }));
}

describe('RFx Builder tab (registry #394)', () => {
  it('renders the RFx Builder tab and its three selection checkboxes', () => {
    openRfxTab();
    expect(screen.getByText(/Which RFx type do you need\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Specifications are fixed/i)).toBeInTheDocument();
    expect(screen.getByText(/Supplier capability \/ market is known/i)).toBeInTheDocument();
    expect(screen.getByText(/I need to compare supplier approaches/i)).toBeInTheDocument();
  });

  it('recommends RFI by default (specs not fixed, capability unknown)', () => {
    openRfxTab();
    expect(screen.getAllByText('RFI (Request for Information)').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/start with an RFI to narrow the field/i)).toBeInTheDocument();
  });

  it('recommends RFQ once specs are fixed and capability is known (price-only comparison)', () => {
    openRfxTab();
    fireEvent.click(screen.getByLabelText(/Specifications are fixed/i));
    fireEvent.click(screen.getByLabelText(/Supplier capability \/ market is known/i));
    expect(screen.getAllByText('RFQ (Request for Quotation)').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/fast, transparent price comparison/i)).toBeInTheDocument();
  });

  it('recommends RFP once specs are fixed, capability known, and approach comparison is needed', () => {
    openRfxTab();
    fireEvent.click(screen.getByLabelText(/Specifications are fixed/i));
    fireEvent.click(screen.getByLabelText(/Supplier capability \/ market is known/i));
    fireEvent.click(screen.getByLabelText(/I need to compare supplier approaches/i));
    expect(screen.getAllByText('RFP (Request for Proposal)').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/compare differing supplier approaches\/solutions/i)).toBeInTheDocument();
  });

  it('adds and removes a bidder row', () => {
    openRfxTab();
    expect(screen.queryByPlaceholderText('Bidder name')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Add Bidder/i }));
    expect(screen.getByPlaceholderText('Bidder name')).toBeInTheDocument();
    const trashButtons = document.querySelectorAll('table button');
    fireEvent.click(trashButtons[trashButtons.length - 1]);
    expect(screen.queryByPlaceholderText('Bidder name')).not.toBeInTheDocument();
  });

  it('computes the weighted total correctly for a bidder that passes the mandatory gate', () => {
    openRfxTab();
    fireEvent.click(screen.getByRole('button', { name: /Add Bidder/i }));
    const nameInput = screen.getByPlaceholderText('Bidder name');
    fireEvent.change(nameInput, { target: { value: 'Acme Supplies' } });
    // Default template: technical-approach 40%, price 28%, past-performance 18%, vendor-viability 14%.
    const scoreInputs = screen.getAllByRole('spinbutton').filter(el => (el as HTMLInputElement).disabled === false && !(el as HTMLInputElement).value);
    // Score all four weighted criteria at 100 -> weighted total should be 100.
    const row = nameInput.closest('tr') as HTMLElement;
    const inputs = within(row).getAllByRole('spinbutton');
    inputs.forEach(inp => fireEvent.change(inp, { target: { value: '100' } }));
    expect(within(row).getByText('100')).toBeInTheDocument();
  });

  it('disqualifies a bidder that fails the mandatory gate and excludes it from ranking', () => {
    openRfxTab();
    fireEvent.click(screen.getByRole('button', { name: /Add Bidder/i }));
    const nameInput = screen.getByPlaceholderText('Bidder name');
    fireEvent.change(nameInput, { target: { value: 'Rejected Co' } });
    const row = nameInput.closest('tr') as HTMLElement;
    const gateCheckbox = within(row).getByRole('checkbox');
    fireEvent.click(gateCheckbox); // uncheck -- fails mandatory gate
    expect(within(row).getByText('Disqualified')).toBeInTheDocument();
    expect(screen.getByText(/Disqualified -- failed mandatory gate/i)).toBeInTheDocument();
  });
});
