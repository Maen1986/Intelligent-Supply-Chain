/**
 * Tests: ContractHealthChecker — arrow-key tab navigation (ARIA tablist pattern)
 *
 * Verifies that the CLM tab bar:
 *   1. Exposes role="tablist" and role="tab" correctly
 *   2. Applies roving tabIndex (active tab = 0, others = -1)
 *   3. ArrowRight and ArrowLeft move focus and activate the correct panel
 *   4. Wrapping behaviour (last → first, first → last) works correctly
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ContractHealthChecker } from './CLMTools';

/* ── Module mocks ──────────────────────────────────────────────────────── */

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

/* ══════════════════════════════════════════════════════════════════════════
   Suite 1 — ARIA roles
══════════════════════════════════════════════════════════════════════════ */
describe('ContractHealthChecker — ARIA roles', () => {
  it('renders a tablist container', () => {
    render(<ContractHealthChecker isAr={false} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('renders exactly 5 tabs', () => {
    render(<ContractHealthChecker isAr={false} />);
    expect(screen.getAllByRole('tab').length).toBe(5);
  });

  it('first tab (Contract Inventory) is aria-selected by default', () => {
    render(<ContractHealthChecker isAr={false} />);
    const first = screen.getByRole('tab', { name: /Contract Inventory/i });
    expect(first).toHaveAttribute('aria-selected', 'true');
  });

  it('non-active tabs are aria-selected=false', () => {
    render(<ContractHealthChecker isAr={false} />);
    const second = screen.getByRole('tab', { name: /Renewal Pipeline/i });
    expect(second).toHaveAttribute('aria-selected', 'false');
  });

  it('active tab has tabIndex 0', () => {
    render(<ContractHealthChecker isAr={false} />);
    const first = screen.getByRole('tab', { name: /Contract Inventory/i });
    expect(first).toHaveAttribute('tabindex', '0');
  });

  it('inactive tabs have tabIndex -1 (roving tabIndex)', () => {
    render(<ContractHealthChecker isAr={false} />);
    const second = screen.getByRole('tab', { name: /Renewal Pipeline/i });
    expect(second).toHaveAttribute('tabindex', '-1');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 2 — Arrow-key navigation
══════════════════════════════════════════════════════════════════════════ */
describe('ContractHealthChecker — arrow-key tab navigation', () => {
  it('ArrowRight activates the next tab', () => {
    render(<ContractHealthChecker isAr={false} />);
    const first = screen.getByRole('tab', { name: /Contract Inventory/i });
    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: /Renewal Pipeline/i }))
      .toHaveAttribute('aria-selected', 'true');
  });

  it('ArrowRight moves DOM focus to the next tab', () => {
    render(<ContractHealthChecker isAr={false} />);
    const first = screen.getByRole('tab', { name: /Contract Inventory/i });
    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(
      screen.getByRole('tab', { name: /Renewal Pipeline/i }),
    );
  });

  it('ArrowLeft activates the previous tab', () => {
    render(<ContractHealthChecker isAr={false} />);
    // Navigate to second tab first
    fireEvent.click(screen.getByRole('tab', { name: /Renewal Pipeline/i }));
    const second = screen.getByRole('tab', { name: /Renewal Pipeline/i });
    second.focus();
    fireEvent.keyDown(second, { key: 'ArrowLeft' });
    expect(screen.getByRole('tab', { name: /Contract Inventory/i }))
      .toHaveAttribute('aria-selected', 'true');
  });

  it('ArrowLeft moves DOM focus to the previous tab', () => {
    render(<ContractHealthChecker isAr={false} />);
    fireEvent.click(screen.getByRole('tab', { name: /Renewal Pipeline/i }));
    const second = screen.getByRole('tab', { name: /Renewal Pipeline/i });
    second.focus();
    fireEvent.keyDown(second, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(
      screen.getByRole('tab', { name: /Contract Inventory/i }),
    );
  });

  it('ArrowRight wraps from last tab back to first', () => {
    render(<ContractHealthChecker isAr={false} />);
    const last = screen.getByRole('tab', { name: /AI Portfolio Brief/i });
    fireEvent.click(last);
    last.focus();
    fireEvent.keyDown(last, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: /Contract Inventory/i }))
      .toHaveAttribute('aria-selected', 'true');
  });

  it('ArrowLeft wraps from first tab to last', () => {
    render(<ContractHealthChecker isAr={false} />);
    const first = screen.getByRole('tab', { name: /Contract Inventory/i });
    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowLeft' });
    expect(screen.getByRole('tab', { name: /AI Portfolio Brief/i }))
      .toHaveAttribute('aria-selected', 'true');
  });

  it('other keys do not change the active tab', () => {
    render(<ContractHealthChecker isAr={false} />);
    const first = screen.getByRole('tab', { name: /Contract Inventory/i });
    first.focus();
    fireEvent.keyDown(first, { key: 'Tab' });
    expect(first).toHaveAttribute('aria-selected', 'true');
  });

  it('tab navigation sequence: first → second → third via ArrowRight', () => {
    render(<ContractHealthChecker isAr={false} />);
    const first = screen.getByRole('tab', { name: /Contract Inventory/i });
    first.focus();

    fireEvent.keyDown(first, { key: 'ArrowRight' });
    const second = screen.getByRole('tab', { name: /Renewal Pipeline/i });
    expect(second).toHaveAttribute('aria-selected', 'true');
    second.focus(); // keep focus in sync with the moved element

    fireEvent.keyDown(second, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: /Portfolio Health/i }))
      .toHaveAttribute('aria-selected', 'true');
  });
});
