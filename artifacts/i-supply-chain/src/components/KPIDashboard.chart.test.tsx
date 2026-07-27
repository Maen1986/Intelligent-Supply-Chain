/**
 * KPI bar chart — conditional rendering tests.
 *
 * Covers:
 *  • When all KPI values are empty, the bar chart container (.kpi-chart-wrap)
 *    is NOT present in the DOM (hasAnyValue is false).
 *  • When at least one valid KPI value is entered, the bar chart container
 *    (.kpi-chart-wrap) IS present in the DOM (hasAnyValue becomes true).
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KPIDashboard } from './KPIDashboard';

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('@/lib/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'en' }),
}));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: false }),
}));

vi.mock('@/hooks/useAIPlan', () => ({
  useAIPlan: () => ({
    loading: false,
    result: null,
    error: null,
    savedPlan: null,
    rateLimited: false,
    saveError: null,
    generatePlan: vi.fn(),
    resetPlan: vi.fn(),
    viewSavedPlan: vi.fn(),
    deleteSavedPlan: vi.fn(),
    dismissSaveError: vi.fn(),
  }),
}));

vi.mock('@/components/AIPlanPanel', () => ({
  AIPlanPanel: () => null,
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Use a well-known slug that has a KPI framework defined. */
const TEST_SLUG = 'supply-chain-strategy';

/** The localStorage key the component uses for this slug. */
const STORAGE_KEY = `isc-kpi-${TEST_SLUG}`;

function renderDashboard() {
  return render(<KPIDashboard slug={TEST_SLUG} />);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('KPI bar chart — conditional rendering on hasAnyValue', () => {
  beforeEach(() => {
    // Ensure localStorage is clear so no saved values bleed across tests.
    localStorage.removeItem(STORAGE_KEY);
  });

  it('does NOT render .kpi-chart-wrap when all KPI values are empty', () => {
    renderDashboard();

    // The bar chart container should be absent — hasAnyValue is false.
    const chartWrap = document.querySelector('.kpi-chart-wrap');
    expect(chartWrap).toBeNull();
  });

  it('renders .kpi-chart-wrap once a valid value is entered in any KPI field', () => {
    renderDashboard();

    // Before entering any value, the chart must be absent.
    expect(document.querySelector('.kpi-chart-wrap')).toBeNull();

    // Find the first numeric input rendered for the dashboard KPIs.
    // The inputs have type="number" and are rendered inside each KPI card.
    const inputs = document.querySelectorAll<HTMLInputElement>('input[type="number"]');
    expect(inputs.length).toBeGreaterThan(0);

    // Enter a valid numeric value into the first KPI input.
    const firstInput = inputs[0];
    fireEvent.change(firstInput, { target: { value: '85' } });

    // Now hasAnyValue should be true and the chart container must be present.
    const chartWrap = document.querySelector('.kpi-chart-wrap');
    expect(chartWrap).not.toBeNull();
  });
});
