/**
 * AskConsultant — QA pass for #191 Ask the Consultant (24 Aug 2026)
 *
 * Built into the initial pass (not bolted on after) per Decision Record
 * 8.6 Addendum 3, using the Decision Record 8.10 "verify before building"
 * process to scope it. Covers: the question input round-trips to
 * POST /consultancy/ask with the real industry/challenge/diagnosis (and
 * solution, when present) context, the answer renders with its
 * frameworkApplied badge visible (the owner's explicit "profound, not
 * generic" requirement made checkable), EvidenceSummary/ConsiderAlso reuse
 * (not reinvented), multiple questions accumulate as session history
 * without replacing each other, an empty/whitespace question never fires a
 * request, a failed request shows an inline error without crashing, and
 * Arabic labels.
 */
import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { AskConsultant } from './AskConsultant';

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const DIAGNOSIS = { challengeSummary: 'Late deliveries', problems: [{ id: 'P1', framework: 'SCOR - Source' }] };

const ANSWER_PAYLOAD = {
  ok: true,
  answer: {
    answer: 'Your OTIF decline traces to a SCOR Source-process reliability gap in carrier onboarding.',
    frameworkApplied: 'SCOR — Source (Reliability, Responsiveness)',
    evidenceSummary: { dataUsed: ['P1: Carrier capacity mismatch'], assumptions: [], confidence: 82 },
    considerAlso: 'If the 3PL contract renews within 60 days, a renegotiated SLA may resolve this faster.',
  },
};

async function askQuestion(text: string) {
  const input = screen.getByPlaceholderText('Type your question here...');
  fireEvent.change(input, { target: { value: text } });
  fireEvent.click(screen.getByText('Ask'));
}

describe('AskConsultant — #191 QA', () => {
  it('sends the real industry/challenge/diagnosis context with the question, no solution field when none is passed', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: async () => ANSWER_PAYLOAD });
    global.fetch = fetchSpy;
    render(<AskConsultant industry="FMCG" challenge="OTIF is 62%" diagnosis={DIAGNOSIS} />);
    await askQuestion('Why carrier capacity over demand forecasting?');
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const [url, opts] = fetchSpy.mock.calls[0];
    expect(url).toBe('http://test-server/api/consultancy/ask');
    const body = JSON.parse((opts as RequestInit).body as string);
    expect(body).toMatchObject({ industry: 'FMCG', challenge: 'OTIF is 62%', diagnosis: DIAGNOSIS, question: 'Why carrier capacity over demand forecasting?' });
    expect(body.solution).toBeUndefined();
  });

  it('includes the real solution in the request when one is passed (solution-stage usage)', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: async () => ANSWER_PAYLOAD });
    global.fetch = fetchSpy;
    const solution = { executiveSolution: 'Renegotiate SLA' };
    render(<AskConsultant industry="FMCG" challenge="x" diagnosis={DIAGNOSIS} solution={solution} />);
    await askQuestion('Does this apply to our Riyadh site?');
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(body.solution).toEqual(solution);
  });

  it('renders the answer with its frameworkApplied badge visible (owner requirement: profound, not generic)', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ANSWER_PAYLOAD });
    render(<AskConsultant industry="FMCG" challenge="x" diagnosis={DIAGNOSIS} />);
    await askQuestion('Why carrier capacity?');
    await waitFor(() => expect(screen.getByText(/SCOR Source-process reliability gap/)).toBeInTheDocument());
    expect(screen.getByText(/SCOR — Source \(Reliability, Responsiveness\)/)).toBeInTheDocument();
  });

  it('reuses EvidenceSummary and ConsiderAlso for the answer rather than reinventing them', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ANSWER_PAYLOAD });
    render(<AskConsultant industry="FMCG" challenge="x" diagnosis={DIAGNOSIS} />);
    await askQuestion('Why carrier capacity?');
    await waitFor(() => expect(screen.getByText('Show me why')).toBeInTheDocument());
    expect(screen.getByText(/renegotiated SLA may resolve this faster/)).toBeInTheDocument();
  });

  it('accumulates multiple questions as session history rather than replacing the previous answer', async () => {
    const secondAnswer = { ok: true, answer: { ...ANSWER_PAYLOAD.answer, answer: 'Second answer text here.', frameworkApplied: 'CIPS Level 4' } };
    const fetchSpy = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ANSWER_PAYLOAD })
      .mockResolvedValueOnce({ ok: true, json: async () => secondAnswer });
    global.fetch = fetchSpy;
    render(<AskConsultant industry="FMCG" challenge="x" diagnosis={DIAGNOSIS} />);
    await askQuestion('First question');
    await waitFor(() => expect(screen.getByText(/SCOR Source-process reliability gap/)).toBeInTheDocument());
    await askQuestion('Second question');
    await waitFor(() => expect(screen.getByText('Second answer text here.')).toBeInTheDocument());
    // Both remain visible -- history, not replacement.
    expect(screen.getByText(/SCOR Source-process reliability gap/)).toBeInTheDocument();
    expect(screen.getByText('First question')).toBeInTheDocument();
    expect(screen.getByText('Second question')).toBeInTheDocument();
  });

  it('never fires a request for an empty or whitespace-only question', async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;
    render(<AskConsultant industry="FMCG" challenge="x" diagnosis={DIAGNOSIS} />);
    fireEvent.click(screen.getByText('Ask'));
    const input = screen.getByPlaceholderText('Type your question here...');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(screen.getByText('Ask'));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('shows an inline error without crashing when the request fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: false, error: 'AI unavailable' }) });
    render(<AskConsultant industry="FMCG" challenge="x" diagnosis={DIAGNOSIS} />);
    await askQuestion('Why?');
    await waitFor(() => expect(screen.getByText('AI unavailable')).toBeInTheDocument());
  });

  it('renders Arabic labels when ar=true', () => {
    render(<AskConsultant industry="FMCG" challenge="x" diagnosis={DIAGNOSIS} ar />);
    expect(screen.getByText("اسأل ما'ين سؤالاً")).toBeInTheDocument();
    expect(screen.getByPlaceholderText('اكتب سؤالك هنا...')).toBeInTheDocument();
  });
});
