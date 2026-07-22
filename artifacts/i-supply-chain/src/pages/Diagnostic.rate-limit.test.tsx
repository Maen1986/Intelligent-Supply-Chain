import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { LanguageProvider } from '@/lib/LanguageContext';
import { Diagnostic } from './Diagnostic';

// Keep the test light: the report view itself is not under test.
vi.mock('@/lib/diagnosticEngine', () => ({
  generateReport: vi.fn(() => ({ executiveSummary: 'summary' })),
}));
vi.mock('@/components/ReportOutput', () => ({
  ReportOutput: () => <div data-testid="report-output">report</div>,
}));

function mock429(retryAfterSeconds: number) {
  return vi.fn(async () => ({
    status: 429,
    headers: { get: (name: string) => (name === 'Retry-After' ? String(retryAfterSeconds) : null) },
    json: async () => ({ retryAfterSeconds }),
  })) as unknown as typeof fetch;
}

async function completeWizardAndSubmit() {
  // Step 1-4: pick the first option, click Next.
  fireEvent.click(screen.getByLabelText(/Startup/i));
  fireEvent.click(screen.getByTestId('button-wizard-next'));
  fireEvent.click(screen.getByLabelText(/Saudi Arabia/i));
  fireEvent.click(screen.getByTestId('button-wizard-next'));
  fireEvent.click(screen.getByLabelText(/Manufacturing/i));
  fireEvent.click(screen.getByTestId('button-wizard-next'));
  fireEvent.click(screen.getByLabelText(/Procurement/i));
  fireEvent.click(screen.getByTestId('button-wizard-next'));
  // Step 5 is optional — submit directly.
  fireEvent.click(screen.getByTestId('button-wizard-submit'));
  // handleSubmit waits 1200ms before generating the report, then the
  // background lead-capture fetch resolves with the 429.
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1300);
  });
}

describe('Diagnostic rate-limit recovery', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('shows the notice, counts down, then re-enables submit', async () => {
    vi.stubGlobal('fetch', mock429(3));

    render(
      <LanguageProvider>
        <Diagnostic />
      </LanguageProvider>,
    );

    await completeWizardAndSubmit();

    // Report is shown; go back to the wizard where the notice lives.
    expect(screen.getByTestId('report-output')).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Start Over/i));

    // Notice is visible with the initial countdown, submit is disabled.
    const notice = screen.getByTestId('notice-rate-limit');
    expect(notice).toHaveTextContent(/try again in 3 seconds/i);
    expect(screen.getByTestId('button-wizard-submit')).toBeDisabled();

    // Counts down.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(screen.getByTestId('notice-rate-limit')).toHaveTextContent(/in 2 seconds/i);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(screen.getByTestId('notice-rate-limit')).toHaveTextContent(/in 1 second\b/i);

    // Window frees up: notice disappears and submit re-enables.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });
    expect(screen.queryByTestId('notice-rate-limit')).not.toBeInTheDocument();
    expect(screen.getByTestId('button-wizard-submit')).toBeEnabled();
  });

  it('falls back to the response body when Retry-After header is missing', async () => {
    const retryAfterSeconds = 120;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        status: 429,
        headers: { get: () => null },
        json: async () => ({ retryAfterSeconds }),
      })) as unknown as typeof fetch,
    );

    render(
      <LanguageProvider>
        <Diagnostic />
      </LanguageProvider>,
    );

    await completeWizardAndSubmit();
    fireEvent.click(screen.getByText(/Start Over/i));

    expect(screen.getByTestId('notice-rate-limit')).toHaveTextContent(/about 2 minutes/i);
    expect(screen.getByTestId('button-wizard-submit')).toBeDisabled();
  });
});
