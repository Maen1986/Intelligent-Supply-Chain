/**
 * Tests: Contract Review -- "Apply NDA/MSA Best-Practice Defaults" button
 * (#371 Contract Intelligence professional-readiness audit, 30 Aug 2026).
 *
 * Real gap this closes: Review's clauseCategoriesNotApplicable field was
 * a purely manual, per-contract client toggle with zero awareness of
 * contract type, so an NDA reviewed without the client manually flagging
 * commercial-payment / performance-service / risk-allocation as N/A would
 * show a misleadingly low clause-health score -- as if a confidentiality
 * agreement were missing a pricing clause. This button seeds the correct,
 * already-authored NDA_NOT_APPLICABLE_CATEGORY_IDS list (reused verbatim
 * from clmGenerationEngine.ts, not duplicated) with one explicit click,
 * and clears it for MSA (no category is N/A for an MSA). Always
 * client-triggered, always overridable afterward via the existing
 * per-category N/A toggle -- Decision Record 8.7, stand by a click.
 */
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { ContractHealthChecker } from './CLMTools';

/* ── Module mocks (mirrors CLMTools.stakeholders.test.tsx) ── */

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

/** Adds a contract, expands its card, and switches its type. Returns the
 *  card container element (same pattern as CLMTools.stakeholders.test.tsx). */
function addExpandAndSetType(type: string): HTMLElement {
  fireEvent.click(screen.getByRole('button', { name: /Add Contract/i }));
  const header = screen.getByText('(Contract name)');
  fireEvent.click(header);
  let node: HTMLElement | null = header.parentElement;
  while (node && !node.className.includes('rounded-2xl')) node = node.parentElement;
  expect(node).not.toBeNull();
  const card = node as HTMLElement;
  const typeSelect = within(card).getByDisplayValue('Services') as HTMLSelectElement;
  fireEvent.change(typeSelect, { target: { value: type } });
  return card;
}

/** Category labels (e.g. "Legal / Governance") also appear in the Option 3
 *  Clause Language Library accordion elsewhere on the same card, so
 *  queries must be scoped to the Clause Coverage panel specifically. */
function getClauseCoveragePanel(card: HTMLElement): HTMLElement {
  const heading = within(card).getByText('Clause Coverage');
  let node: HTMLElement | null = heading.parentElement;
  while (node && !node.className.includes('rounded-xl')) node = node.parentElement;
  expect(node).not.toBeNull();
  return node as HTMLElement;
}

describe('Review -- Apply Best-Practice Defaults button gating', () => {
  it('does not render for a non-NDA/MSA contract type (e.g. goods)', () => {
    render(<ContractHealthChecker isAr={false} />);
    const card = addExpandAndSetType('goods');
    expect(within(card).queryByRole('button', { name: /Apply NDA Best-Practice Defaults/i })).toBeNull();
    expect(within(card).queryByRole('button', { name: /Apply MSA Best-Practice Defaults/i })).toBeNull();
  });

  it('renders the NDA-labeled button for an NDA contract', () => {
    render(<ContractHealthChecker isAr={false} />);
    const card = addExpandAndSetType('nda');
    expect(within(card).getByRole('button', { name: /Apply NDA Best-Practice Defaults/i })).toBeInTheDocument();
  });

  it('renders the MSA-labeled button for an MSA contract', () => {
    render(<ContractHealthChecker isAr={false} />);
    const card = addExpandAndSetType('msa');
    expect(within(card).getByRole('button', { name: /Apply MSA Best-Practice Defaults/i })).toBeInTheDocument();
  });
});

describe('Review -- Apply NDA Best-Practice Defaults behavior', () => {
  it('marks Commercial/Payment, Performance & Service, and Risk Allocation as N/A, leaving other categories untouched', () => {
    render(<ContractHealthChecker isAr={false} />);
    const card = addExpandAndSetType('nda');
    fireEvent.click(within(card).getByRole('button', { name: /Apply NDA Best-Practice Defaults/i }));

    const panel = getClauseCoveragePanel(card);
    const commercialRow = within(panel).getByText('Commercial / Payment').closest('button') as HTMLElement;
    const performanceRow = within(panel).getByText('Performance & Service').closest('button') as HTMLElement;
    const riskRow = within(panel).getByText('Risk Allocation').closest('button') as HTMLElement;
    const legalRow = within(panel).getByText('Legal / Governance').closest('button') as HTMLElement;

    expect(within(commercialRow).getByText('N/A')).toBeInTheDocument();
    expect(within(performanceRow).getByText('N/A')).toBeInTheDocument();
    expect(within(riskRow).getByText('N/A')).toBeInTheDocument();
    // Legal/Governance is real, applicable content for an NDA -- must NOT be marked N/A.
    expect(within(legalRow).queryByText('N/A')).toBeNull();
  });

  it('is fully overridable afterward via the existing per-category N/A toggle', () => {
    render(<ContractHealthChecker isAr={false} />);
    const card = addExpandAndSetType('nda');
    fireEvent.click(within(card).getByRole('button', { name: /Apply NDA Best-Practice Defaults/i }));

    const panel = getClauseCoveragePanel(card);
    const commercialRow = within(panel).getByText('Commercial / Payment').closest('button') as HTMLElement;
    expect(within(commercialRow).getByText('N/A')).toBeInTheDocument();

    // Expand the category to reach its own N/A checkbox and flip it back off.
    fireEvent.click(commercialRow);
    const naToggle = within(panel).getByLabelText(/Not applicable to this contract/i, { selector: 'input' });
    fireEvent.click(naToggle);

    const commercialRowAfter = within(panel).getByText('Commercial / Payment').closest('button') as HTMLElement;
    expect(within(commercialRowAfter).queryByText('N/A')).toBeNull();
  });
});

describe('Review -- Apply MSA Best-Practice Defaults behavior', () => {
  it('clears all N/A category flags (no category is N/A for an MSA)', () => {
    render(<ContractHealthChecker isAr={false} />);
    // Start as NDA, apply NDA defaults (sets 3 categories N/A), then switch to MSA.
    const card = addExpandAndSetType('nda');
    fireEvent.click(within(card).getByRole('button', { name: /Apply NDA Best-Practice Defaults/i }));
    const typeSelect = within(card).getByDisplayValue('Non-Disclosure Agreement') as HTMLSelectElement;
    fireEvent.change(typeSelect, { target: { value: 'msa' } });

    // Categories still carry the inherited NDA-era N/A flags until the MSA
    // defaults button is explicitly clicked (never silent on type change).
    const panel = getClauseCoveragePanel(card);
    let commercialRow = within(panel).getByText('Commercial / Payment').closest('button') as HTMLElement;
    expect(within(commercialRow).getByText('N/A')).toBeInTheDocument();

    fireEvent.click(within(card).getByRole('button', { name: /Apply MSA Best-Practice Defaults/i }));

    commercialRow = within(panel).getByText('Commercial / Payment').closest('button') as HTMLElement;
    const performanceRow = within(panel).getByText('Performance & Service').closest('button') as HTMLElement;
    const riskRow = within(panel).getByText('Risk Allocation').closest('button') as HTMLElement;
    expect(within(commercialRow).queryByText('N/A')).toBeNull();
    expect(within(performanceRow).queryByText('N/A')).toBeNull();
    expect(within(riskRow).queryByText('N/A')).toBeNull();
  });
});
