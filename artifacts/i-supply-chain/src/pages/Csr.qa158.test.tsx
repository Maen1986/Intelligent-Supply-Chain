/**
 * Csr — QA pass for #158's evidenceSummary badge (23 Aug 2026)
 *
 * Written retroactively as part of an owner-requested QA audit. Csr.tsx had
 * ZERO test coverage before this -- not just for #158, for anything. This
 * exercises the real form -> fetch -> report flow, checking:
 *   - the AI success path renders the evidence badge
 *   - the outage fallback path (static content) never shows a badge, since
 *     showing "confidence" on hand-written filler text would be dishonest
 */
import React from 'react';
import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { LanguageProvider } from '@/lib/LanguageContext';
import { Csr } from './Csr';

// Radix Select uses these DOM APIs for keyboard/scroll behaviour; jsdom
// doesn't implement them, which otherwise throws when the dropdown opens.
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
});

afterEach(cleanup);

function renderCsr() {
  return render(
    <LanguageProvider>
      <Csr />
    </LanguageProvider>,
  );
}

async function fillAndSubmit() {
  // Open the industry Select and pick the first real option
  fireEvent.click(screen.getByRole('combobox'));
  const option = await screen.findByText('Manufacturing');
  fireEvent.click(option);

  fireEvent.change(screen.getByPlaceholderText('Describe your current challenge in a few sentences...'), {
    target: { value: 'We keep running out of raw materials because our supplier lead times are unpredictable.' },
  });

  fireEvent.click(screen.getByRole('button', { name: /Generate Free Report/i }));
}

describe('Csr — #158 evidence badge QA', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('shows the evidence badge after a real AI-generated report', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        report: {
          summary: 'Your top risk is unmanaged supplier lead time variability.',
          gaps: ['No supplier scorecards', 'No safety stock policy', 'No backup suppliers'],
          risks: ['Single-source dependency', 'No written payment terms'],
          roadmap: ['Month 1: List top 5 suppliers', 'Month 2: Set reorder points', 'Month 3: Qualify a backup supplier'],
          evidenceSummary: { dataUsed: ['stated challenge: supplier lead-time unpredictability'], assumptions: [], confidence: 55 },
        },
      }),
    });

    renderCsr();
    await fillAndSubmit();

    await waitFor(() => expect(screen.getByText(/unmanaged supplier lead time/)).toBeInTheDocument());
    expect(screen.getByText('Show me why')).toBeInTheDocument();
    expect(screen.getByText('55% confidence')).toBeInTheDocument();
  });

  it('never shows an evidence badge on the static outage-fallback report (honesty rule)', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('AI service unavailable'));

    renderCsr();
    await fillAndSubmit();

    await waitFor(() => expect(screen.getByText(/temporarily unavailable/i)).toBeInTheDocument());
    expect(screen.queryByText('Show me why')).not.toBeInTheDocument();
  });
});
