/**
 * Tests: ResiliencyToolsSection — RAR "what-if scenario" extension (#182
 * Disruption Simulator extension of the Revenue-at-Risk calculator,
 * Wave B-6, 2026-08-24).
 *
 * Decision Record 8.10 finding this closes: RAR's node model had no
 * lead-time/route field, and there was no way to save a second named
 * variant of the node set to compare against the baseline exposure figure.
 * This is NOT the pre-existing "Disruption Simulator" TAB (tab id
 * `scenario`, the preset port-closure/supplier-failure/freight-spike/
 * cyber-attack picker) -- that tab is untouched and not exercised here.
 *
 * Covers:
 *   1. A lead-time (days) field is addable/editable on a baseline RAR node.
 *   2. "Duplicate as what-if scenario" clones the current node set + meta
 *      into a new named, independently-editable scenario.
 *   3. Editing a field on the duplicated scenario does NOT mutate the
 *      baseline's own node values.
 *   4. The side-by-side comparison table shows a non-zero delta once the
 *      scenario diverges from the baseline, reusing computeRarExposure for
 *      both -- and editing the scenario's inputs back to exactly match the
 *      baseline yields a zero ("±0.0pp") delta, proving there is no second,
 *      diverging calculation.
 *   5. computeRarExposure itself is a pure, deterministic function (direct
 *      unit coverage), imported and used identically for baseline and
 *      scenario recompute.
 */
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { vi } from 'vitest';
import { ResiliencyToolsSection, computeRarExposure } from './ResiliencyTools';

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

function openRarTab() {
  render(<ResiliencyToolsSection isAr={false} />);
  fireEvent.click(screen.getByRole('tab', { name: /Revenue-at-Risk/i }));
  return screen.getByRole('tabpanel');
}

/* ══════════════════════════════════════════════════════════════════════════
   computeRarExposure -- pure function, direct unit coverage
══════════════════════════════════════════════════════════════════════════ */

describe('computeRarExposure (pure, shared by baseline and every scenario)', () => {
  it('computes raw exposure as the sum of at-risk nodes\' revenuePct', () => {
    const nodes = [
      { id: 'a', name: 'A', revenuePct: 20, atRisk: true },
      { id: 'b', name: 'B', revenuePct: 15, atRisk: false },
      { id: 'c', name: 'C', revenuePct: 10, atRisk: true },
    ];
    const r = computeRarExposure(nodes, { interdependenciesMapped: true, annualRevenue: '' });
    expect(r.rawExposurePct).toBe(30);
    // interdependenciesMapped=true -> no correction -> low===high===raw
    expect(r.correctionLow).toBe(0);
    expect(r.adjustedLowPct).toBe(30);
    expect(r.adjustedHighPct).toBe(30);
    expect(r.midPct).toBe(30);
  });

  it('applies the unmapped-interdependency correction range and produces a wider band', () => {
    const nodes = [{ id: 'a', name: 'A', revenuePct: 20, atRisk: true }];
    const r = computeRarExposure(nodes, { interdependenciesMapped: false, annualRevenue: '' });
    expect(r.correctionLow).toBeGreaterThan(0);
    expect(r.adjustedHighPct).toBeGreaterThan(r.adjustedLowPct);
    expect(r.midPct).toBeGreaterThan(r.rawExposurePct);
  });

  it('is deterministic: identical (nodes, meta) inputs always produce identical output', () => {
    const nodes = [{ id: 'a', name: 'A', revenuePct: 33, atRisk: true, leadTimeDays: 12, route: 'X' }];
    const meta = { interdependenciesMapped: false, annualRevenue: '1000000' };
    const r1 = computeRarExposure(nodes, meta);
    const r2 = computeRarExposure(nodes.map(n => ({ ...n })), { ...meta });
    expect(r2).toEqual(r1);
  });

  it('leadTimeDays and route have no effect on the exposure calculation (honest manual-calculator scope)', () => {
    const base = { id: 'a', name: 'A', revenuePct: 25, atRisk: true };
    const withLeadRoute = { ...base, leadTimeDays: 90, route: 'Suez Canal' };
    const meta = { interdependenciesMapped: true, annualRevenue: '' };
    expect(computeRarExposure([withLeadRoute], meta)).toEqual(computeRarExposure([base], meta));
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Lead-time field on a baseline RAR node
══════════════════════════════════════════════════════════════════════════ */

describe('RAR baseline node — lead-time and route fields', () => {
  it('renders an addable, editable lead-time (days) field on a node', () => {
    const panel = openRarTab();
    fireEvent.click(within(panel).getByRole('button', { name: /Add node/i }));
    const leadInput = within(panel).getByLabelText('Lead time in days') as HTMLInputElement;
    fireEvent.change(leadInput, { target: { value: '30' } });
    expect(leadInput.value).toBe('30');
  });

  it('renders an editable "Primary route/corridor" text field on a node', () => {
    const panel = openRarTab();
    fireEvent.click(within(panel).getByRole('button', { name: /Add node/i }));
    const routeInput = within(panel).getByPlaceholderText('Primary route/corridor') as HTMLInputElement;
    fireEvent.change(routeInput, { target: { value: 'Jebel Ali -> Red Sea -> Suez' } });
    expect(routeInput.value).toBe('Jebel Ali -> Red Sea -> Suez');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Duplicate as what-if scenario
══════════════════════════════════════════════════════════════════════════ */

/** Adds one baseline node with name/%/at-risk/lead-time/route filled in.
 *  Returns the tabpanel. */
function addBaselineNode(panel: HTMLElement) {
  fireEvent.click(within(panel).getByRole('button', { name: /Add node/i }));
  fireEvent.change(within(panel).getByPlaceholderText('Node name'), { target: { value: 'Primary Freight Forwarder' } });
  fireEvent.change(within(panel).getByPlaceholderText('%'), { target: { value: '20' } });
  fireEvent.click(within(panel).getByLabelText(/TTR > TTS/i));
  fireEvent.change(within(panel).getByLabelText('Lead time in days'), { target: { value: '45' } });
  fireEvent.change(within(panel).getByPlaceholderText('Primary route/corridor'), { target: { value: 'Jebel Ali Corridor' } });
}

describe('RAR "Duplicate as what-if scenario"', () => {
  it('is disabled with zero baseline nodes and enabled once a node exists', () => {
    const panel = openRarTab();
    const dupBtn = within(panel).getByRole('button', { name: /Duplicate as what-if scenario/i });
    expect(dupBtn).toBeDisabled();
    fireEvent.click(within(panel).getByRole('button', { name: /Add node/i }));
    expect(dupBtn).not.toBeDisabled();
  });

  it('clones the current node set + meta into a new named, saved scenario', () => {
    const panel = openRarTab();
    addBaselineNode(panel);
    fireEvent.click(within(panel).getByRole('button', { name: /Duplicate as what-if scenario/i }));

    expect(within(panel).getByText(/Saved What-If Scenarios/i)).toBeInTheDocument();
    const scenarioNameInput = within(panel).getByLabelText('Scenario name') as HTMLInputElement;
    expect(scenarioNameInput.value).toBe('Scenario 1');

    // Cloned node values appear a second time (baseline + scenario copy).
    const nameInputs = within(panel).getAllByPlaceholderText('Node name') as HTMLInputElement[];
    expect(nameInputs).toHaveLength(2);
    expect(nameInputs[0].value).toBe('Primary Freight Forwarder');
    expect(nameInputs[1].value).toBe('Primary Freight Forwarder');
  });

  it('editing a duplicated scenario\'s node does not mutate the baseline', () => {
    const panel = openRarTab();
    addBaselineNode(panel);
    fireEvent.click(within(panel).getByRole('button', { name: /Duplicate as what-if scenario/i }));

    const pctInputs = within(panel).getAllByPlaceholderText('%') as HTMLInputElement[];
    expect(pctInputs).toHaveLength(2);
    expect(pctInputs[0].value).toBe('20'); // baseline
    expect(pctInputs[1].value).toBe('20'); // scenario clone

    // Edit only the scenario's copy (index 1).
    fireEvent.change(pctInputs[1], { target: { value: '55' } });

    const pctInputsAfter = within(panel).getAllByPlaceholderText('%') as HTMLInputElement[];
    expect(pctInputsAfter[0].value).toBe('20'); // baseline untouched
    expect(pctInputsAfter[1].value).toBe('55'); // scenario changed
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Side-by-side comparison delta -- proves baseline and scenario share one
   calculation function (computeRarExposure), not two diverging ones.
══════════════════════════════════════════════════════════════════════════ */

describe('RAR side-by-side comparison delta', () => {
  it('shows a non-zero delta once the scenario diverges, and a zero delta once edited back to match the baseline exactly', () => {
    const panel = openRarTab();
    addBaselineNode(panel);
    fireEvent.click(within(panel).getByRole('button', { name: /Duplicate as what-if scenario/i }));

    const row = () => within(panel).getByText('Scenario 1').closest('tr') as HTMLElement;

    // Fresh clone -- identical inputs -- delta must already read zero.
    expect(within(row()).getByText(/±0\.0pp/)).toBeInTheDocument();

    // Diverge the scenario's revenuePct from the baseline's.
    const pctInputs = within(panel).getAllByPlaceholderText('%') as HTMLInputElement[];
    fireEvent.change(pctInputs[1], { target: { value: '80' } });
    const deltaCellAfterDiverge = within(row()).getAllByRole('cell')[3];
    expect(deltaCellAfterDiverge.textContent).not.toMatch(/±0\.0pp/);
    expect(deltaCellAfterDiverge.textContent).toMatch(/^\+/);

    // Edit the scenario's revenuePct back to exactly match the baseline (20).
    const pctInputsNow = within(panel).getAllByPlaceholderText('%') as HTMLInputElement[];
    fireEvent.change(pctInputsNow[1], { target: { value: '20' } });
    expect(within(row()).getByText(/±0\.0pp/)).toBeInTheDocument();
  });
});
