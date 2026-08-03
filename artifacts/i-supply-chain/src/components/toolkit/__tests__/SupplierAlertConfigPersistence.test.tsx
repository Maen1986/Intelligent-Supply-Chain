/**
 * Task 349 — SupplierAlertConfig thresholds survive a page refresh
 * (simulated by unmounting and remounting the component with localStorage intact)
 * and revert to defaults after the storage-clear event fires.
 *
 * The component stores thresholds under 'isc-tool-risk-alerts' via RiskToolsSection.
 * We navigate to the "Supplier Alerts" tab, edit a threshold input, unmount, remount,
 * and verify the edited value is restored.  We also confirm that clearing storage
 * causes the component to revert to its default thresholds.
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';

/* ── Module mocks ─────────────────────────────────────────────────────── */
vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: null, isAuthenticated: false, loading: false }),
}));
vi.mock('@/hooks/useAIPlan', () => ({
  useAIPlan: () => ({
    loading: false, result: null, error: null, rateLimited: false,
    generate: vi.fn(), reset: vi.fn(),
    savedPlan: null, viewSaved: vi.fn(), deleteSaved: vi.fn(),
  }),
}));
vi.mock('@/components/AIPlanPanel', () => ({ AIPlanPanel: () => null }));
// Use a passthrough mock so safeSetItem actually writes to localStorage while
// still being interceptable for error-path tests.
const { mockSafeSetItem } = vi.hoisted(() => ({
  mockSafeSetItem: vi.fn((key: string, value: string) => {
    localStorage.setItem(key, value);
    return true;
  }),
}));
vi.mock('@/lib/storage', () => ({ safeSetItem: mockSafeSetItem }));

import { RiskToolsSection } from '../RiskTools';

const ALERTS_KEY = 'isc-tool-risk-alerts';

/* Navigate to the Supplier Alerts tab */
function goToAlertsTab() {
  const tabBtn = screen.getAllByRole('tab').find(t => t.textContent?.includes('Supplier Alerts'));
  expect(tabBtn).toBeDefined();
  fireEvent.click(tabBtn!);
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
});

/* ══════════════════════════════════════════════════════════════════════════
   Tests
══════════════════════════════════════════════════════════════════════════ */

describe('RiskToolsSection — SupplierAlertConfig thresholds persist across remount (Task 349)', () => {
  it('a custom OTIF threshold is still shown after the component is unmounted and remounted', () => {
    // ── First mount ───────────────────────────────────────────────────────
    render(<RiskToolsSection isAr={false} />);
    goToAlertsTab();

    // Find the Strategic — OTIF input (aria-label: "Strategic — OTIF (%)")
    const table = screen.getByRole('table', { name: /Supplier alert thresholds/i });
    const input = within(table).getByRole('spinbutton', { name: /Strategic.*OTIF/i }) as HTMLInputElement;
    expect(input).toBeDefined();
    const defaultValue = input.value;

    // Change the threshold
    const newValue = String(Number(defaultValue) - 5);
    fireEvent.change(input, { target: { value: newValue } });
    expect(input.value).toBe(newValue);

    // Unmount (simulates page unload; localStorage keeps the change)
    cleanup();

    // ── Second mount (simulated page reload) ─────────────────────────────
    render(<RiskToolsSection isAr={false} />);
    goToAlertsTab();

    const inputAfter = within(
      screen.getByRole('table', { name: /Supplier alert thresholds/i }),
    ).getByRole('spinbutton', { name: /Strategic.*OTIF/i }) as HTMLInputElement;
    expect(inputAfter.value).toBe(newValue);
  });

  it('pre-seeding localStorage with custom thresholds loads them on first mount', () => {
    // Seed custom values directly in localStorage
    const custom = [
      { otif: '88', defect: '800', financial: '65' },
      { otif: '82', defect: '1800', financial: '52' },
      { otif: '77', defect: '2800', financial: '38' },
    ];
    localStorage.setItem(ALERTS_KEY, JSON.stringify(custom));

    render(<RiskToolsSection isAr={false} />);
    goToAlertsTab();

    const table = screen.getByRole('table', { name: /Supplier alert thresholds/i });
    const otifInput = within(table).getByRole('spinbutton', { name: /Strategic.*OTIF/i }) as HTMLInputElement;
    expect(otifInput.value).toBe('88');
  });

  it('clearing localStorage causes the component to revert to defaults on remount', () => {
    // Set a custom threshold
    const custom = [
      { otif: '77', defect: '800', financial: '60' },
      { otif: '72', defect: '1800', financial: '45' },
      { otif: '67', defect: '2800', financial: '30' },
    ];
    localStorage.setItem(ALERTS_KEY, JSON.stringify(custom));

    render(<RiskToolsSection isAr={false} />);
    goToAlertsTab();

    // Verify the custom value is loaded
    let table = screen.getByRole('table', { name: /Supplier alert thresholds/i });
    let otifInput = within(table).getByRole('spinbutton', { name: /Strategic.*OTIF/i }) as HTMLInputElement;
    expect(otifInput.value).toBe('77');
    cleanup();

    // Clear localStorage (simulate clear-storage flow)
    localStorage.removeItem(ALERTS_KEY);

    // Remount — must revert to defaults (90 for Strategic OTIF)
    render(<RiskToolsSection isAr={false} />);
    goToAlertsTab();

    table = screen.getByRole('table', { name: /Supplier alert thresholds/i });
    otifInput = within(table).getByRole('spinbutton', { name: /Strategic.*OTIF/i }) as HTMLInputElement;
    expect(otifInput.value).toBe('90');
  });
});
