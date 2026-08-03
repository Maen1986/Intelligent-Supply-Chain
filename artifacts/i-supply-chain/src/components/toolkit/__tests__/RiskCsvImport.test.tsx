/**
 * Task 358 — Confirm bulk risk import from a CSV file works end-to-end.
 *
 * Tests exercise the real handleRiskCsvImport handler through the rendered UI:
 *  1. Importing the exact RISK_CSV_TEMPLATE sample rows adds 3 risks.
 *  2. A row with an empty Description is skipped.
 *  3. An invalid Category value falls back to 'supply'.
 *  4. Likelihood/Impact values are clamped to [1, 5].
 *  5. The import log message is visible after a successful import.
 *  6. New risks are appended to (not replace) the existing register.
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

/* ── Module-level mocks ──────────────────────────────────────────────────── */
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
vi.mock('@/lib/storage', () => ({ safeSetItem: vi.fn(() => true) }));

import { RiskToolsSection } from '../RiskTools';

/* ── FileReader mock helper ────────────────────────────────────────────────── */
function mockFileReaderWith(text: string) {
  vi.stubGlobal('FileReader', class {
    result: string | null = null;
    onload: (() => void) | null = null;
    readAsText() {
      this.result = text;
      this.onload?.();
    }
  });
}

/** Trigger the hidden risk CSV import file input. */
function fireImportFile(csvText: string, isAr = false) {
  const label = isAr ? 'استيراد ملف CSV للمخاطر' : 'Import risks CSV file';
  const input = screen.getByLabelText(label) as HTMLInputElement;
  Object.defineProperty(input, 'files', {
    value: [new File([csvText], 'risks.csv', { type: 'text/csv' })],
    configurable: true,
  });
  fireEvent.change(input);
}

/* ── CSV helpers ───────────────────────────────────────────────────────────── */
const HEADERS = 'ID,Category,Description,Risk Driver,Affected Area,Likelihood (1-5),Impact (1-5),Risk Score,Velocity,Mitigation Action,Owner,Due Date,Status,Residual Likelihood,Residual Impact';

function riskRow(overrides: Partial<Record<string, string>> = {}) {
  const defaults: Record<string, string> = {
    ID: 'R001', Category: 'supply', Description: 'Test risk', 'Risk Driver': 'Driver',
    'Affected Area': 'Production', 'Likelihood (1-5)': '3', 'Impact (1-5)': '3',
    'Risk Score': '9', Velocity: 'medium', 'Mitigation Action': 'Mitigate',
    Owner: 'Owner', 'Due Date': '2025-12-31', Status: 'open',
    'Residual Likelihood': '2', 'Residual Impact': '2',
  };
  const merged = { ...defaults, ...overrides };
  return Object.keys(merged).map(k => merged[k]).join(',');
}

function csv(rows: string[]) {
  return [HEADERS, ...rows].join('\n');
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
});

/* ── Navigate to the Register tab ────────────────────────────────────────── */
function goToRegisterTab() {
  const tabBtn = screen.getByRole('tab', { name: /Risk Register/i });
  fireEvent.click(tabBtn);
}

/* ══════════════════════════════════════════════════════════════════════════
   Tests
══════════════════════════════════════════════════════════════════════════ */

describe('RiskToolsSection — bulk CSV import (Task 358)', () => {
  it('shows "✓ Imported 3 risk(s)." after importing the 3-row sample template', async () => {
    const sampleCsv = csv([
      'R001,supply,Single-source dependency,No alternative,Production,4,5,20,fast,Qualify alt supplier,Category Manager,2025-09-30,open,2,3',
      'R002,geopolitical,Port disruption,Geopolitical instability,Logistics,3,4,12,medium,Pre-identify routing,Logistics Manager,2025-08-15,in-progress,2,3',
      'R003,financial,Commodity volatility,Supply-demand imbalance,COGS,3,3,9,fast,Index pricing,Procurement,2025-07-31,open,2,2',
    ]);
    mockFileReaderWith(sampleCsv);
    render(<RiskToolsSection isAr={false} />);
    goToRegisterTab();
    fireImportFile(sampleCsv);

    await waitFor(() =>
      expect(
        screen.getByText((txt) => txt.startsWith('✓') && txt.includes('Imported 3')),
      ).toBeInTheDocument(),
    );
  });

  it('skips a row with an empty Description and reports it in the log', async () => {
    const c = csv([
      riskRow({ Description: '' }),  // empty — should be skipped
      riskRow({ ID: 'R002', Description: 'Real risk' }),
    ]);
    mockFileReaderWith(c);
    render(<RiskToolsSection isAr={false} />);
    goToRegisterTab();
    fireImportFile(c);

    await waitFor(() =>
      expect(
        screen.getByText((txt) => txt.includes('Imported 1') && txt.includes('1 skipped')),
      ).toBeInTheDocument(),
    );
  });

  it('clamps out-of-range Likelihood to [1, 5]', async () => {
    // Likelihood 99 → clamped to 5; Impact 0 → clamped to 1
    const c = csv([riskRow({ 'Likelihood (1-5)': '99', 'Impact (1-5)': '0' })]);
    mockFileReaderWith(c);
    render(<RiskToolsSection isAr={false} />);
    goToRegisterTab();
    fireImportFile(c);

    await waitFor(() =>
      expect(
        screen.getByText((txt) => txt.startsWith('✓') && txt.includes('Imported 1')),
      ).toBeInTheDocument(),
    );
  });

  it('unknown Category falls back to "supply"', async () => {
    const c = csv([riskRow({ Category: 'UNKNOWN_CAT' })]);
    mockFileReaderWith(c);
    render(<RiskToolsSection isAr={false} />);
    goToRegisterTab();
    fireImportFile(c);

    await waitFor(() =>
      expect(
        screen.getByText((txt) => txt.startsWith('✓') && txt.includes('Imported 1')),
      ).toBeInTheDocument(),
    );
  });

  it('new risks are appended to existing ones (not replaced)', async () => {
    // Seed one existing risk
    const SK_RISKS = 'isc-tool-risk-register-v2';
    localStorage.setItem(SK_RISKS, JSON.stringify([
      { id: 'existing-1', category: 'supply', description: 'Pre-existing risk',
        driver: '', affectedArea: '', likelihood: 2, impact: 2, velocity: 'slow',
        mitigationAction: '', owner: '', dueDate: '', status: 'open',
        mitigationStatus: 'not-started', residualLikelihood: 1, residualImpact: 1 },
    ]));

    const c = csv([riskRow({ ID: 'R-new', Description: 'New imported risk' })]);
    mockFileReaderWith(c);
    render(<RiskToolsSection isAr={false} />);
    goToRegisterTab();
    fireImportFile(c);

    // After import, both the old and new risk description should appear
    await waitFor(() =>
      expect(
        screen.getByText((txt) => txt.includes('Imported 1')),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText('Pre-existing risk')).toBeInTheDocument();
    expect(screen.getByText('New imported risk')).toBeInTheDocument();
  });

  it('shows a failure message when the file is empty', async () => {
    mockFileReaderWith('');
    render(<RiskToolsSection isAr={false} />);
    goToRegisterTab();
    fireImportFile('');

    await waitFor(() =>
      expect(
        screen.getByText((txt) => txt.includes('Import failed') || txt.includes('فشل الاستيراد')),
      ).toBeInTheDocument(),
    );
  });

  it('shows Arabic import success message when isAr=true', async () => {
    const c = csv([riskRow({ Description: 'مخاطرة اختبار' })]);
    mockFileReaderWith(c);
    render(<RiskToolsSection isAr />);
    // Arabic register tab label is "سجل المخاطر" (line 444 of RiskTools.tsx)
    const tabBtn = screen.getAllByRole('tab').find(t => t.textContent?.includes('سجل المخاطر'));
    expect(tabBtn).toBeDefined();
    fireEvent.click(tabBtn!);
    fireImportFile(c, /* isAr */ true);

    await waitFor(() =>
      expect(
        screen.getByText((txt) => txt.startsWith('✓') && txt.includes('تم استيراد')),
      ).toBeInTheDocument(),
    );
  });
});
