/**
 * Tests: NDA Skeleton -- optional Additional Stakeholders (Module 09,
 * item 50, owner-confirmed 26 Aug 2026).
 *
 * The derived 8-role involvement map is confirmed and fixed
 * (clmGenerationEngine.test.ts covers its own derivation logic in full).
 * This file covers the genuinely new UI surface added for item 50's
 * flexibility requirement:
 *   1. The "Additional Stakeholders" section appears only on an
 *      NDA-type contract card (same gate as the rest of the NDA
 *      Skeleton panel), not on other contract types.
 *   2. Clicking "Add" appends a new, initially-blank text input.
 *   3. Typing into that input updates the contract's customStakeholders
 *      array (persisted like every other field, via saveContracts).
 *   4. Clicking the remove (trash) icon removes that entry.
 *   5. Multiple stakeholders can be added independently.
 */
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { ContractHealthChecker } from './CLMTools';

/* ── Module mocks (mirrors CLMTools.test.tsx / CLMTools.rebate.test.tsx) ── */

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

/** Adds a contract, expands its card, and switches its type to 'nda' so
 *  the NDA Skeleton panel (and the Additional Stakeholders section inside
 *  it) is visible. Returns the card container element. */
function addExpandAndSetNda(): HTMLElement {
  fireEvent.click(screen.getByRole('button', { name: /Add Contract/i }));
  const header = screen.getByText('(Contract name)');
  fireEvent.click(header);
  let node: HTMLElement | null = header.parentElement;
  while (node && !node.className.includes('rounded-2xl')) node = node.parentElement;
  expect(node).not.toBeNull();
  const card = node as HTMLElement;
  const typeSelect = within(card).getByDisplayValue('Services') as HTMLSelectElement;
  fireEvent.change(typeSelect, { target: { value: 'nda' } });
  return card;
}

describe('NDA Skeleton -- Additional Stakeholders (item 50)', () => {
  it('does not render the Additional Stakeholders section for a non-NDA contract', () => {
    render(<ContractHealthChecker isAr={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Add Contract/i }));
    const header = screen.getByText('(Contract name)');
    fireEvent.click(header);
    expect(screen.queryByText(/Additional Stakeholders/i)).toBeNull();
  });

  it('renders the Additional Stakeholders section once contract type is set to NDA', () => {
    render(<ContractHealthChecker isAr={false} />);
    const card = addExpandAndSetNda();
    expect(within(card).getByText(/Additional Stakeholders/i)).toBeInTheDocument();
  });

  it('starts with no stakeholder inputs until "Add" is clicked', () => {
    render(<ContractHealthChecker isAr={false} />);
    const card = addExpandAndSetNda();
    expect(within(card).queryByPlaceholderText('e.g. External Sponsor Liaison')).toBeNull();
  });

  it('clicking Add appends a new blank stakeholder input', () => {
    render(<ContractHealthChecker isAr={false} />);
    const card = addExpandAndSetNda();
    fireEvent.click(within(card).getByRole('button', { name: 'Add' }));
    const inputs = within(card).getAllByPlaceholderText('e.g. External Sponsor Liaison');
    expect(inputs).toHaveLength(1);
    expect((inputs[0] as HTMLInputElement).value).toBe('');
  });

  it('typing into a stakeholder input persists the value', () => {
    render(<ContractHealthChecker isAr={false} />);
    const card = addExpandAndSetNda();
    fireEvent.click(within(card).getByRole('button', { name: 'Add' }));
    const [input] = within(card).getAllByPlaceholderText('e.g. External Sponsor Liaison');
    fireEvent.change(input, { target: { value: 'External Sponsor Liaison' } });
    expect((input as HTMLInputElement).value).toBe('External Sponsor Liaison');
  });

  it('supports adding multiple independent stakeholder entries', () => {
    render(<ContractHealthChecker isAr={false} />);
    const card = addExpandAndSetNda();
    fireEvent.click(within(card).getByRole('button', { name: 'Add' }));
    fireEvent.click(within(card).getByRole('button', { name: 'Add' }));
    const inputs = within(card).getAllByPlaceholderText('e.g. External Sponsor Liaison');
    expect(inputs).toHaveLength(2);
    fireEvent.change(inputs[0], { target: { value: 'External Sponsor Liaison' } });
    fireEvent.change(inputs[1], { target: { value: 'Board Observer' } });
    expect((inputs[0] as HTMLInputElement).value).toBe('External Sponsor Liaison');
    expect((inputs[1] as HTMLInputElement).value).toBe('Board Observer');
  });

  it('clicking the remove icon deletes that stakeholder entry', () => {
    render(<ContractHealthChecker isAr={false} />);
    const card = addExpandAndSetNda();
    fireEvent.click(within(card).getByRole('button', { name: 'Add' }));
    fireEvent.click(within(card).getByRole('button', { name: 'Add' }));
    let inputs = within(card).getAllByPlaceholderText('e.g. External Sponsor Liaison');
    fireEvent.change(inputs[0], { target: { value: 'External Sponsor Liaison' } });
    fireEvent.change(inputs[1], { target: { value: 'Board Observer' } });

    const removeButtons = within(card).getAllByRole('button', { name: 'Remove' });
    fireEvent.click(removeButtons[0]);

    inputs = within(card).getAllByPlaceholderText('e.g. External Sponsor Liaison');
    expect(inputs).toHaveLength(1);
    expect((inputs[0] as HTMLInputElement).value).toBe('Board Observer');
  });

  it('persists the stakeholder list across a localStorage reload', () => {
    const { unmount } = render(<ContractHealthChecker isAr={false} />);
    const card = addExpandAndSetNda();
    fireEvent.click(within(card).getByRole('button', { name: 'Add' }));
    const [input] = within(card).getAllByPlaceholderText('e.g. External Sponsor Liaison');
    fireEvent.change(input, { target: { value: 'External Sponsor Liaison' } });
    unmount();

    render(<ContractHealthChecker isAr={false} />);
    const header = screen.getByText('(Contract name)');
    fireEvent.click(header);
    let node: HTMLElement | null = header.parentElement;
    while (node && !node.className.includes('rounded-2xl')) node = node.parentElement;
    const reopened = node as HTMLElement;
    const reopenedInputs = within(reopened).getAllByPlaceholderText('e.g. External Sponsor Liaison');
    expect((reopenedInputs[0] as HTMLInputElement).value).toBe('External Sponsor Liaison');
  });
});
