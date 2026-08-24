import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { LanguageProvider } from '@/lib/LanguageContext';
import { Diagnostic } from './Diagnostic';

// Keep the test light: the report view itself is not under test (same
// convention as Diagnostic.rate-limit.test.tsx).
vi.mock('@/lib/diagnosticEngine', () => ({
  generateReport: vi.fn(() => ({ executiveSummary: 'summary' })),
}));
vi.mock('@/components/ReportOutput', () => ({
  ReportOutput: () => <div data-testid="report-output">report</div>,
}));

// All 8 SYMPTOM_OPTIONS ids, mirrored here so tests fail loudly if the
// picker's option set ever changes shape.
const ALL_SYMPTOM_IDS = [
  'stockouts',
  'excess_inventory',
  'late_deliveries',
  'high_cost',
  'supplier_reliability',
  'quality_defects',
  'data_visibility',
  'other',
];

/** Drive steps 1-4 with fixed answers, leaving the wizard on step 5
 *  (focus area) so each test can pick its own focus area. */
function advanceToStep5() {
  fireEvent.click(screen.getByLabelText(/Startup/i));
  fireEvent.click(screen.getByTestId('button-wizard-next'));
  fireEvent.click(screen.getByLabelText(/Saudi Arabia/i));
  fireEvent.click(screen.getByTestId('button-wizard-next'));
  fireEvent.click(screen.getByLabelText(/Manufacturing/i));
  fireEvent.click(screen.getByTestId('button-wizard-next'));
  fireEvent.click(screen.getByLabelText(/Make-to-Stock/i));
  fireEvent.click(screen.getByTestId('button-wizard-next'));
}

/** Pick a focus area on step 5, then drive steps 5-6 to land on step 7. */
function pickFocusAreaAndAdvanceToStep7(focusAreaLabel: RegExp) {
  fireEvent.click(screen.getByLabelText(focusAreaLabel));
  fireEvent.click(screen.getByTestId('button-wizard-next'));
  fireEvent.click(screen.getByLabelText(/Spreadsheets/i));
  fireEvent.click(screen.getByTestId('button-wizard-next'));
}

function renderWizard() {
  render(
    <LanguageProvider>
      <Diagnostic />
    </LanguageProvider>,
  );
}

describe('Diagnostic Step 7 — adaptive symptom picker (#181)', () => {
  afterEach(() => {
    cleanup();
  });

  it('narrows the symptom grid to the ones tagged for the chosen focus area, plus "other"', () => {
    renderWizard();
    advanceToStep5();
    // CLM is tagged on only high_cost and supplier_reliability.
    pickFocusAreaAndAdvanceToStep7(/^CLM$/i);

    expect(screen.getByTestId('symptom-high_cost')).toBeInTheDocument();
    expect(screen.getByTestId('symptom-supplier_reliability')).toBeInTheDocument();
    expect(screen.getByTestId('symptom-other')).toBeInTheDocument();

    // Symptoms not tagged to CLM must not be rendered at all — filtered out,
    // not just visually hidden.
    expect(screen.queryByTestId('symptom-stockouts')).not.toBeInTheDocument();
    expect(screen.queryByTestId('symptom-excess_inventory')).not.toBeInTheDocument();
    expect(screen.queryByTestId('symptom-late_deliveries')).not.toBeInTheDocument();
    expect(screen.queryByTestId('symptom-quality_defects')).not.toBeInTheDocument();
    expect(screen.queryByTestId('symptom-data_visibility')).not.toBeInTheDocument();
  });

  it('always shows "other" regardless of the chosen focus area', () => {
    renderWizard();
    advanceToStep5();
    // Organizational Design is tagged on only data_visibility.
    pickFocusAreaAndAdvanceToStep7(/Organizational Design/i);

    expect(screen.getByTestId('symptom-data_visibility')).toBeInTheDocument();
    expect(screen.getByTestId('symptom-other')).toBeInTheDocument();
    expect(screen.queryByTestId('symptom-stockouts')).not.toBeInTheDocument();
  });

  it('offers a "Show all symptoms" escape hatch that reveals the full 8-item list', () => {
    renderWizard();
    advanceToStep5();
    pickFocusAreaAndAdvanceToStep7(/^CLM$/i);

    // Filtered down first — escape hatch is visible because items are hidden.
    expect(screen.queryByTestId('symptom-stockouts')).not.toBeInTheDocument();
    const showAll = screen.getByTestId('button-show-all-symptoms');
    expect(showAll).toBeInTheDocument();

    fireEvent.click(showAll);

    for (const id of ALL_SYMPTOM_IDS) {
      expect(screen.getByTestId(`symptom-${id}`)).toBeInTheDocument();
    }
    // Once everything is shown there's nothing left to reveal.
    expect(screen.queryByTestId('button-show-all-symptoms')).not.toBeInTheDocument();
  });

  it('does not show the escape hatch when the focus area already surfaces every symptom', () => {
    renderWizard();
    advanceToStep5();
    pickFocusAreaAndAdvanceToStep7(/^CLM$/i);
    fireEvent.click(screen.getByTestId('button-show-all-symptoms'));
    expect(screen.queryByTestId('button-show-all-symptoms')).not.toBeInTheDocument();
  });

  it('keeps a prior selection visible and selected after the user goes back and changes focus area', () => {
    renderWizard();
    advanceToStep5();
    // CLM surfaces supplier_reliability; select it.
    pickFocusAreaAndAdvanceToStep7(/^CLM$/i);
    fireEvent.click(screen.getByTestId('symptom-supplier_reliability'));
    expect(screen.getByTestId('symptom-supplier_reliability')).toHaveClass('border-primary');

    // Go back to step 5 (one Back click lands on step 6 - data maturity;
    // click Back again to reach step 5).
    fireEvent.click(screen.getByTestId('button-wizard-back'));
    fireEvent.click(screen.getByTestId('button-wizard-back'));

    // Switch focus area to one that does NOT tag supplier_reliability
    // (Organizational Design -> only data_visibility + other).
    fireEvent.click(screen.getByLabelText(/Organizational Design/i));
    fireEvent.click(screen.getByTestId('button-wizard-next'));
    fireEvent.click(screen.getByTestId('button-wizard-next')); // step 6 -> 7 (data maturity kept from before)

    // The previously-selected symptom is still visible (not silently
    // hidden) and still marked selected (not silently cleared), flagged as
    // carried over from an earlier answer.
    const kept = screen.getByTestId('symptom-supplier_reliability');
    expect(kept).toBeInTheDocument();
    expect(kept).toHaveClass('border-primary');
    expect(kept).toHaveTextContent(/From an earlier answer/i);

    // The new focus area's own tagged symptom is present too.
    expect(screen.getByTestId('symptom-data_visibility')).toBeInTheDocument();
  });
});
