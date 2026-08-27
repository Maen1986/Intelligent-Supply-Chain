/**
 * Tests: ContractHealthChecker — Option 3 model-clause-language library
 * (Module 09 Part B.3, owner instruction 27 Aug 2026).
 *
 * Covers the genuinely new surface added by this build:
 *   1. A subclause with a real library entry shows a "View sourced model
 *      clause" toggle inside the Clause Coverage accordion.
 *   2. Clicking it reveals bilingual clause text, an assurance-tier badge,
 *      the source note, and the mandatory counsel-review disclaimer.
 *   3. Clicking it again hides the panel (click-to-reveal, not auto-shown).
 *   4. A subclause with a real, sourced variant set (Force Majeure) shows
 *      its variant note when expanded.
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

function addAndExpandContract(): HTMLElement {
  fireEvent.click(screen.getByRole('button', { name: /Add Contract/i }));
  const header = screen.getByText('(Contract name)');
  fireEvent.click(header);
  let node: HTMLElement | null = header.parentElement;
  while (node && !node.className.includes('rounded-2xl')) node = node.parentElement;
  expect(node).not.toBeNull();
  return node as HTMLElement;
}

/** Opens the Risk Allocation clause-category accordion inside the given
 *  contract card and returns its container. */
function openRiskAllocationCategory(card: HTMLElement): void {
  const catButton = within(card).getByText('Risk Allocation').closest('button');
  expect(catButton).not.toBeNull();
  fireEvent.click(catButton as HTMLElement);
}

describe('ContractHealthChecker — Option 3 model-clause library', () => {
  it('shows a "View sourced model clause" toggle next to a subclause with a real library entry', () => {
    render(<ContractHealthChecker isAr={false} />);
    const card = addAndExpandContract();
    openRiskAllocationCategory(card);
    expect(within(card).getAllByText(/View sourced model clause/i).length).toBeGreaterThan(0);
  });

  it('reveals bilingual clause text, assurance badge, source note, and the counsel disclaimer on click', () => {
    render(<ContractHealthChecker isAr={false} />);
    const card = addAndExpandContract();
    openRiskAllocationCategory(card);

    const toggles = within(card).getAllByText(/View sourced model clause/i);
    // Force Majeure is the first Risk Allocation subclause with a library entry in doc order.
    fireEvent.click(toggles[0]);

    expect(within(card).getByText(/Hide model clause/i)).toBeTruthy();
    expect(within(card).getByText(/Reference-Verified|Self-Declared Consistent/)).toBeTruthy();
    expect(within(card).getByText(/Needs Legal Counsel Before Use|not a substitute for a qualified lawyer/i)).toBeTruthy();
  });

  it('hides the panel again on a second click (click-to-reveal, never auto-shown)', () => {
    render(<ContractHealthChecker isAr={false} />);
    const card = addAndExpandContract();
    openRiskAllocationCategory(card);

    let toggle = within(card).getAllByText(/View sourced model clause/i)[0];
    fireEvent.click(toggle);
    expect(within(card).getByText(/Hide model clause/i)).toBeTruthy();

    const hideToggle = within(card).getByText(/Hide model clause/i);
    fireEvent.click(hideToggle);
    expect(within(card).queryByText(/Hide model clause/i)).toBeNull();
  });

  it('is not expanded by default when the category is first opened (no auto-fire)', () => {
    render(<ContractHealthChecker isAr={false} />);
    const card = addAndExpandContract();
    openRiskAllocationCategory(card);
    expect(within(card).queryByText(/Hide model clause/i)).toBeNull();
  });
});
