/**
 * Tests: RiskToolsSection — arrow-key tab navigation (ARIA tablist pattern)
 *
 * Verifies that the Risk Management tab bar:
 *   1. Exposes role="tablist" and role="tab" correctly
 *   2. Applies roving tabIndex (active tab = 0, others = -1)
 *   3. ArrowRight and ArrowLeft move focus and activate the correct panel
 *   4. Wrapping behaviour (last → first, first → last) works correctly
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { RiskToolsSection } from './RiskTools';

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
describe('RiskToolsSection — ARIA roles', () => {
  it('renders a tablist container', () => {
    render(<RiskToolsSection isAr={false} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('renders exactly 6 tabs', () => {
    render(<RiskToolsSection isAr={false} />);
    expect(screen.getAllByRole('tab').length).toBe(6);
  });

  it('first tab (KRI Monitor) is aria-selected by default', () => {
    render(<RiskToolsSection isAr={false} />);
    expect(screen.getByRole('tab', { name: /KRI Monitor/i }))
      .toHaveAttribute('aria-selected', 'true');
  });

  it('non-active tabs are aria-selected=false', () => {
    render(<RiskToolsSection isAr={false} />);
    expect(screen.getByRole('tab', { name: /Risk Register/i }))
      .toHaveAttribute('aria-selected', 'false');
  });

  it('active tab has tabIndex 0', () => {
    render(<RiskToolsSection isAr={false} />);
    expect(screen.getByRole('tab', { name: /KRI Monitor/i }))
      .toHaveAttribute('tabindex', '0');
  });

  it('inactive tabs have tabIndex -1 (roving tabIndex)', () => {
    render(<RiskToolsSection isAr={false} />);
    expect(screen.getByRole('tab', { name: /Risk Register/i }))
      .toHaveAttribute('tabindex', '-1');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 2 — Arrow-key navigation
══════════════════════════════════════════════════════════════════════════ */
describe('RiskToolsSection — arrow-key tab navigation', () => {
  it('ArrowRight activates the next tab', () => {
    render(<RiskToolsSection isAr={false} />);
    const first = screen.getByRole('tab', { name: /KRI Monitor/i });
    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: /Risk Register/i }))
      .toHaveAttribute('aria-selected', 'true');
  });

  it('ArrowRight moves DOM focus to the next tab', () => {
    render(<RiskToolsSection isAr={false} />);
    const first = screen.getByRole('tab', { name: /KRI Monitor/i });
    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(
      screen.getByRole('tab', { name: /Risk Register/i }),
    );
  });

  it('ArrowLeft activates the previous tab', () => {
    render(<RiskToolsSection isAr={false} />);
    fireEvent.click(screen.getByRole('tab', { name: /Risk Register/i }));
    const second = screen.getByRole('tab', { name: /Risk Register/i });
    second.focus();
    fireEvent.keyDown(second, { key: 'ArrowLeft' });
    expect(screen.getByRole('tab', { name: /KRI Monitor/i }))
      .toHaveAttribute('aria-selected', 'true');
  });

  it('ArrowLeft moves DOM focus to the previous tab', () => {
    render(<RiskToolsSection isAr={false} />);
    fireEvent.click(screen.getByRole('tab', { name: /Risk Register/i }));
    const second = screen.getByRole('tab', { name: /Risk Register/i });
    second.focus();
    fireEvent.keyDown(second, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(
      screen.getByRole('tab', { name: /KRI Monitor/i }),
    );
  });

  it('ArrowRight wraps from last tab back to first', () => {
    render(<RiskToolsSection isAr={false} />);
    const last = screen.getByRole('tab', { name: /AI Risk Brief/i });
    fireEvent.click(last);
    last.focus();
    fireEvent.keyDown(last, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: /KRI Monitor/i }))
      .toHaveAttribute('aria-selected', 'true');
  });

  it('ArrowLeft wraps from first tab to last', () => {
    render(<RiskToolsSection isAr={false} />);
    const first = screen.getByRole('tab', { name: /KRI Monitor/i });
    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowLeft' });
    expect(screen.getByRole('tab', { name: /AI Risk Brief/i }))
      .toHaveAttribute('aria-selected', 'true');
  });

  it('other keys do not change the active tab', () => {
    render(<RiskToolsSection isAr={false} />);
    const first = screen.getByRole('tab', { name: /KRI Monitor/i });
    first.focus();
    fireEvent.keyDown(first, { key: 'Home' });
    expect(first).toHaveAttribute('aria-selected', 'true');
  });

  it('tab navigation sequence: first → second → third via ArrowRight', () => {
    render(<RiskToolsSection isAr={false} />);
    const first = screen.getByRole('tab', { name: /KRI Monitor/i });
    first.focus();

    fireEvent.keyDown(first, { key: 'ArrowRight' });
    const second = screen.getByRole('tab', { name: /Risk Register/i });
    expect(second).toHaveAttribute('aria-selected', 'true');
    second.focus();

    fireEvent.keyDown(second, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: /Heat Map/i }))
      .toHaveAttribute('aria-selected', 'true');
  });

  it('clicking a tab updates aria-selected and tabIndex', () => {
    render(<RiskToolsSection isAr={false} />);
    const mitigation = screen.getByRole('tab', { name: /Mitigation Plans/i });
    fireEvent.click(mitigation);
    expect(mitigation).toHaveAttribute('aria-selected', 'true');
    expect(mitigation).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: /KRI Monitor/i }))
      .toHaveAttribute('tabindex', '-1');
  });
});
