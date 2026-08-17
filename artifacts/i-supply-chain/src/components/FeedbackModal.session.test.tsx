/**
 * Tests for the feedback-modal session-gate and non-blocking behaviour.
 *
 * Covers:
 *  - shouldShowFeedback returns true the first time and false on every
 *    subsequent call for the same tool within the same session.
 *  - shouldShowFeedback is scoped per tool: two different tools each get
 *    their own independent gate.
 *  - The modal auto-opens once after the Diagnostic report renders, and
 *    never re-opens within the same session.
 *  - Dismissing the modal (without submitting) does not hide or block
 *    the report beneath it.
 *  - A submission failure does not hide or block the report beneath it.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup, waitFor } from '@testing-library/react';
import { LanguageProvider } from '@/lib/LanguageContext';
import { shouldShowFeedback, FeedbackModal } from './FeedbackModal';
import { Diagnostic } from '@/pages/Diagnostic';

/* ── Radix Slider requires ResizeObserver ──────────────────────────────── */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = ResizeObserverStub;

/* ── Mocks shared across all suites ───────────────────────────────────── */
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

vi.mock('@/lib/diagnosticEngine', () => ({
  generateReport: vi.fn(() => ({ executiveSummary: 'summary' })),
}));

vi.mock('@/components/ReportOutput', () => ({
  ReportOutput: () => <div data-testid="report-output">report</div>,
}));

/* ── Helpers ────────────────────────────────────────────────────────────── */
async function completeWizardAndSubmit() {
  // Diagnostic is a 7-step wizard (see Diagnostic.tsx isStepValid): steps
  // 4 (supply chain type) and 6 (data maturity) also require a selection
  // before Next enables, and the submit button only appears at step 7.
  fireEvent.click(screen.getByLabelText(/Startup/i));
  fireEvent.click(screen.getByTestId('button-wizard-next'));
  fireEvent.click(screen.getByLabelText(/Saudi Arabia/i));
  fireEvent.click(screen.getByTestId('button-wizard-next'));
  fireEvent.click(screen.getByLabelText(/Manufacturing/i));
  fireEvent.click(screen.getByTestId('button-wizard-next'));
  fireEvent.click(screen.getByLabelText(/Make-to-Stock/i));
  fireEvent.click(screen.getByTestId('button-wizard-next'));
  fireEvent.click(screen.getByLabelText(/Procurement/i));
  fireEvent.click(screen.getByTestId('button-wizard-next'));
  fireEvent.click(screen.getByLabelText(/Spreadsheets/i));
  fireEvent.click(screen.getByTestId('button-wizard-next'));
  // Step 7 (symptoms) is optional — submit directly.
  fireEvent.click(screen.getByTestId('button-wizard-submit'));
  // handleSubmit waits 1200 ms before setting the report
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1300);
  });
}

function renderDiagnostic() {
  render(
    <LanguageProvider>
      <Diagnostic />
    </LanguageProvider>,
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   1. shouldShowFeedback — pure unit tests (sessionStorage)
══════════════════════════════════════════════════════════════════════════ */
describe('shouldShowFeedback session gate', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('returns true the first time for a given tool', () => {
    expect(shouldShowFeedback('diagnostic')).toBe(true);
  });

  it('returns false on every subsequent call for the same tool', () => {
    shouldShowFeedback('diagnostic');
    expect(shouldShowFeedback('diagnostic')).toBe(false);
    expect(shouldShowFeedback('diagnostic')).toBe(false);
  });

  it('is scoped per tool: different tools have independent gates', () => {
    expect(shouldShowFeedback('diagnostic')).toBe(true);
    expect(shouldShowFeedback('maturity')).toBe(true);
    // Second calls for each tool are now false
    expect(shouldShowFeedback('diagnostic')).toBe(false);
    expect(shouldShowFeedback('maturity')).toBe(false);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   2. FeedbackModal — dismiss without submitting
══════════════════════════════════════════════════════════════════════════ */
describe('FeedbackModal dismiss behaviour', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('calls onClose when the dismiss button is clicked without a rating', () => {
    const onClose = vi.fn();
    render(
      <LanguageProvider>
        <FeedbackModal open tool="diagnostic" onClose={onClose} />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByTestId('button-feedback-dismiss'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('never calls fetch when dismissed without submitting', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy as unknown as typeof fetch);
    const onClose = vi.fn();

    render(
      <LanguageProvider>
        <FeedbackModal open tool="diagnostic" onClose={onClose} />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByTestId('button-feedback-dismiss'));
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   3. Diagnostic page — modal auto-opens once, report remains visible
══════════════════════════════════════════════════════════════════════════ */
describe('Diagnostic page feedback modal integration', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers();
    // Default: lead-capture fetch succeeds so it doesn't interfere
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, status: 201, json: async () => ({}) })) as unknown as typeof fetch,
    );
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('modal auto-opens after the report renders (2500 ms delay)', async () => {
    renderDiagnostic();
    await completeWizardAndSubmit();

    // Report is visible; modal is not yet open
    expect(screen.getByTestId('report-output')).toBeInTheDocument();
    expect(screen.queryByTestId('button-feedback-dismiss')).toBeNull();

    // Advance past the 2500 ms delay
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2600);
    });

    expect(screen.getByTestId('button-feedback-dismiss')).toBeInTheDocument();
  });

  it('report remains fully visible while the modal is open', async () => {
    renderDiagnostic();
    await completeWizardAndSubmit();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2600);
    });

    // Both the report and the modal dismiss button are in the DOM at the same time
    expect(screen.getByTestId('report-output')).toBeInTheDocument();
    expect(screen.getByTestId('button-feedback-dismiss')).toBeInTheDocument();
  });

  it('dismissing the modal does not remove or hide the report', async () => {
    renderDiagnostic();
    await completeWizardAndSubmit();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2600);
    });

    fireEvent.click(screen.getByTestId('button-feedback-dismiss'));

    // Report is still present after dismiss
    expect(screen.getByTestId('report-output')).toBeInTheDocument();
    // Modal form is gone
    expect(screen.queryByTestId('button-feedback-dismiss')).toBeNull();
  });

  it('modal does not auto-open a second time within the same session', async () => {
    renderDiagnostic();
    await completeWizardAndSubmit();

    // Let the modal open then dismiss it
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2600);
    });
    fireEvent.click(screen.getByTestId('button-feedback-dismiss'));

    // "Start Over" resets the report but keeps step=5 and the filled formData,
    // so we can submit directly without re-filling all five steps.
    fireEvent.click(screen.getByText(/Start Over/i));
    fireEvent.click(screen.getByTestId('button-wizard-submit'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1300);
    });

    // Advance well past the 2500 ms delay — modal must NOT reappear
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(screen.queryByTestId('button-feedback-dismiss')).toBeNull();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   4. Submit failure — report is never blocked or hidden
══════════════════════════════════════════════════════════════════════════ */
describe('Diagnostic page: submit failure does not block the report', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers();
    // Lead-capture succeeds; feedback submission will fail
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (String(url).includes('/feedback')) {
          return { ok: false, status: 500 };
        }
        return { ok: true, status: 201, json: async () => ({}) };
      }) as unknown as typeof fetch,
    );
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('report is still visible and the error message is shown after a failed submit', async () => {
    renderDiagnostic();
    await completeWizardAndSubmit();

    // Open the modal
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2600);
    });

    // Give a star rating and submit
    fireEvent.click(screen.getByTestId('star-3'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('button-feedback-submit'));
    });

    // Error is shown inside the modal
    expect(screen.getByTestId('text-feedback-error')).toBeInTheDocument();
    // Modal did not auto-close after the failure
    expect(screen.getByTestId('button-feedback-dismiss')).toBeInTheDocument();
    // The report behind the modal is still in the DOM
    expect(screen.getByTestId('report-output')).toBeInTheDocument();
  });

  it('modal can still be dismissed after a submit failure, leaving the report intact', async () => {
    renderDiagnostic();
    await completeWizardAndSubmit();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2600);
    });

    fireEvent.click(screen.getByTestId('star-3'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('button-feedback-submit'));
    });

    // Dismiss after failure
    fireEvent.click(screen.getByTestId('button-feedback-dismiss'));

    expect(screen.queryByTestId('button-feedback-dismiss')).toBeNull();
    expect(screen.getByTestId('report-output')).toBeInTheDocument();
  });
});
