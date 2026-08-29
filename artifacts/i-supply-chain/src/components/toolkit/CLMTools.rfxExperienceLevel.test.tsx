/**
 * Tests: #396 -- RFx panel Guided vs Expert experience-level toggle
 * (30 Aug 2026, owner-approved build).
 *
 * Confirms the Category-Aware Scope Builder panel (#395) defaults to
 * "Guided" (all elicitation-guidance/"why" text visible), and switching to
 * "Expert" collapses that guidance text while the underlying checklist
 * (WBS nodes, mandatory fields) stays fully present and checkable --
 * this is a UI-density preference, not a data/logic change.
 */
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
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

function openRfxTabWithScope() {
  render(<ContractHealthChecker isAr={false} />);
  fireEvent.click(screen.getByRole('tab', { name: /RFx Builder/i }));
  const bucketSelect = screen.getByDisplayValue('-- Select --');
  fireEvent.change(bucketSelect, { target: { value: 'supply-goods' } });
}

describe('#396 RFx panel Guided vs Expert toggle', () => {
  it('defaults to Guided mode: elicitation guidance and field "why" text are visible', () => {
    openRfxTabWithScope();
    expect(screen.getByText('Guided')).toBeInTheDocument();
    expect(screen.getByText('Expert')).toBeInTheDocument();
    expect(screen.getByText(/How to Gather These Requirements/i)).toBeInTheDocument();
  });

  it('switching to Expert collapses the elicitation-guidance card but keeps the checklist', () => {
    openRfxTabWithScope();
    fireEvent.click(screen.getByText('Expert'));

    // The full guidance card heading disappears...
    expect(screen.queryByText(/How to Gather These Requirements/i)).not.toBeInTheDocument();
    // ...but the WBS checklist and mandatory fields remain checkable (real checkboxes still render).
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it('persists the experience-level choice to localStorage under the SK_RFX namespace', () => {
    openRfxTabWithScope();
    fireEvent.click(screen.getByText('Expert'));
    expect(localStorage.getItem('isc-tool-clm-rfx-v1:experienceLevel')).toBe('"expert"');
  });

  it('switching back to Guided restores the guidance text', () => {
    openRfxTabWithScope();
    fireEvent.click(screen.getByText('Expert'));
    expect(screen.queryByText(/How to Gather These Requirements/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Guided'));
    expect(screen.getByText(/How to Gather These Requirements/i)).toBeInTheDocument();
  });
});
