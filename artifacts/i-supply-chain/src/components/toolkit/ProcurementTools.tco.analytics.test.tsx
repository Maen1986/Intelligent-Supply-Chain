/**
 * ProcurementToolsSection — TCO Engine consultancy analytics (#164,
 * "TCO max-enhance: sensitivity analysis, weighted decision scoring beyond
 * raw cost, AI-generated executive insight", 2026-08-23).
 *
 * Confirms the three new analytical layers are real and correctly computed,
 * not decorative: sensitivity analysis recomputes actual TCO arithmetic with
 * one driver varied; weighted decision scoring can genuinely disagree with
 * the raw lowest-TCO pick once qualitative ratings are weighted in; the AI
 * Executive Insight panel is wired up (generation itself needs a live
 * backend, so these tests only confirm the panel renders correctly for an
 * unauthenticated user, matching the existing AIPlanPanel contract).
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';

// Avoids a real network round-trip from AuthContext's session check, which
// does not resolve within this sandbox's test timeout -- same pattern used
// by ProcurementTools.tco.server-sync.test.tsx.
vi.mock('@/lib/AuthContext', () => ({ useAuth: () => ({ user: null, isAuthenticated: false, loading: false }) }));

import { ProcurementToolsSection } from './ProcurementTools';

class ResizeObserverStub { observe() {} unobserve() {} disconnect() {} }
(globalThis as any).ResizeObserver = ResizeObserverStub;

beforeEach(() => { localStorage.clear(); });
afterEach(() => { cleanup(); });

function goToTco() {
  fireEvent.click(screen.getByRole('tab', { name: /TCO Engine/i }));
}

function fillCostRow(table: HTMLElement, label: RegExp, values: string[]) {
  const rows = within(table).getAllByRole('row');
  const row = rows.find(r => within(r).queryByText(label))!;
  const inputs = within(row).getAllByRole('spinbutton');
  values.forEach((v, i) => { if (v !== '') fireEvent.change(inputs[i], { target: { value: v } }); });
}

describe('ProcurementToolsSection — TCO Sensitivity analysis (#164)', () => {
  it('shows a placeholder until the selected supplier has cost data', () => {
    render(<ProcurementToolsSection isAr={false} />);
    goToTco();
    expect(screen.getByText(/Enter cost data for this supplier/i)).toBeInTheDocument();
  });

  it('ranks Unit purchase price as the top driver when it dominates the cost structure', () => {
    const { container } = render(<ProcurementToolsSection isAr={false} />);
    goToTco();
    const table = container.querySelector('table')!;
    fillCostRow(table, /^VAT/i, ['0', '0']);
    fillCostRow(table, /Unit purchase price/i, ['100']);
    fillCostRow(table, /Annual quantity/i, ['10']);
    fillCostRow(table, /^Freight/i, ['50']);

    // Sensitivity section renders a ranked list; the first (highest-impact)
    // row's label should be the unit price driver given these numbers
    // (price swing dominates a small fixed freight cost).
    const sensitivityHeading = screen.getByText(/^Sensitivity analysis$/i);
    const section = sensitivityHeading.closest('div')!.parentElement!;
    const labels = within(section).getAllByText(/^(Unit purchase price|Annual quantity|Freight|VAT rate|Duty rate|Carrying cost %)$/);
    expect(labels[0]).toHaveTextContent('Unit purchase price');
  });
});

describe('ProcurementToolsSection — TCO Weighted decision scoring (#164)', () => {
  it('can disagree with the raw lowest-TCO pick once qualitative ratings are weighted in', () => {
    const { container } = render(<ProcurementToolsSection isAr={false} />);
    goToTco();
    const table = container.querySelector('table')!;
    fillCostRow(table, /^VAT/i, ['0', '0']);
    // Supplier A: cheap (TCO/unit = 50). Supplier B: expensive (TCO/unit = 200).
    fillCostRow(table, /Unit purchase price/i, ['50', '200']);
    fillCostRow(table, /Annual quantity/i, ['10', '10']);

    // Supplier A is the raw lowest-TCO pick by default.
    expect(within(table).getByText('(lowest)')).toBeInTheDocument();

    // Rate Supplier B (second row of each qual <select>) as excellent on every
    // qualitative dimension, Supplier A as poor, then push all weight onto
    // quality so the ranking should flip in Supplier B's favor.
    const qualitySelects = screen.getAllByLabelText(/qualQuality/i);
    const deliverySelects = screen.getAllByLabelText(/qualDelivery/i);
    const riskSelects = screen.getAllByLabelText(/qualRisk/i);
    const fitSelects = screen.getAllByLabelText(/qualStrategicFit/i);
    [qualitySelects, deliverySelects, riskSelects, fitSelects].forEach(pair => {
      fireEvent.change(pair[0], { target: { value: '1' } }); // Supplier A: poor
      fireEvent.change(pair[1], { target: { value: '5' } }); // Supplier B: excellent
    });

    fireEvent.change(screen.getByLabelText(/^Cost %$/i), { target: { value: '0' } });
    fireEvent.change(screen.getByLabelText(/^Quality %$/i), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText(/^Delivery %$/i), { target: { value: '0' } });
    fireEvent.change(screen.getByLabelText(/^Single-source risk %$/i), { target: { value: '0' } });
    fireEvent.change(screen.getByLabelText(/^Strategic fit %$/i), { target: { value: '0' } });

    expect(screen.getByText(/is NOT the lowest-TCO supplier/i)).toBeInTheDocument();
    expect(screen.getByText('(top)')).toBeInTheDocument();
  });
});

describe('ProcurementToolsSection — TCO AI Executive Insight panel (#164)', () => {
  it('renders the AI Executive Insight panel with a sign-in prompt for an unauthenticated user', () => {
    render(<ProcurementToolsSection isAr={false} />);
    goToTco();
    expect(screen.getByText(/^AI Executive Insight$/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign in to generate an AI plan/i)).toBeInTheDocument();
  });
});
