/**
 * Task 696 — ReportGenerator full browser flow
 *
 * Exercises the three-phase lifecycle of ReportGenerator in jsdom:
 *
 *  Phase A — Form renders with all required fields and the Generate button is
 *             disabled until all four required fields (name, company, industry,
 *             companySize) are filled.
 *
 *  Phase B — Generating phase: after clicking Generate the spinner/progress
 *             view appears before the fetch resolves, confirming the UI
 *             transitions immediately.
 *
 *  Phase C — Ready phase: once the mocked API resolves the report content
 *             renders on screen — executive summary headline, recommendation
 *             titles, investment scenario values.
 *
 *  Phase D — Print: clicking "Download PDF" calls window.print() and the
 *             hidden ReportPrintLayout root is present in the DOM so the
 *             browser would render it when the print dialog opens.
 *
 *  Phase E — Error path: when the API returns an error the component returns
 *             to the form phase and shows the error message.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor, act } from '@testing-library/react';
import { LanguageProvider } from '@/lib/LanguageContext';
import { ReportGenerator } from '@/pages/ReportGenerator';

/* ── jsdom stubs ──────────────────────────────────────────────────────────── */
Element.prototype.scrollIntoView = () => {};

/* ── Shared mocks ─────────────────────────────────────────────────────────── */
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      ...actual.motion,
      div: React.forwardRef(
        (
          { children, ...rest }: React.HTMLAttributes<HTMLDivElement>,
          ref: React.Ref<HTMLDivElement>,
        ) => <div ref={ref} {...rest}>{children}</div>,
      ),
    },
  };
});

vi.mock('wouter', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
  useLocation: () => ['/report-generator', vi.fn()],
}));

/* ── Fixture: minimal but structurally complete report ────────────────────── */
const MOCK_REPORT = {
  reportTitle: 'Supply Chain Strategy Report: Acme Logistics',
  reportSubtitle: 'SME Growth Programme — Strategic Assessment & 6-Month Transformation Roadmap',
  executiveSummary: {
    headline: 'Acme Logistics must urgently modernise its procurement infrastructure to remain competitive in the Saudi market.',
    body: 'Paragraph one of the executive summary.\n\nParagraph two with detailed context.',
  },
  companyContext: {
    headline: 'Organisation & Industry Context',
    body: 'GCC logistics dynamics paragraph.\n\nSaudi Vision 2030 implications.',
  },
  maturityAnalysis: {
    headline: 'Current Maturity State: Detailed Analysis',
    body: 'Maturity analysis body text.\n\nFurther detail.',
    keyStrengths: ['Strong inventory visibility across 3 main warehouses', 'Established supplier base with 85% on-time delivery'],
    criticalGaps: ['Procurement lacks e-sourcing capability — estimated SAR 2M annual cost impact', 'No formal S&OP process in place'],
    benchmarkInsight: 'GCC peer comparison paragraph.\n\nBest-in-class delta values.',
  },
  gapAnalysis: {
    headline: 'Gap Analysis & Root Cause Assessment',
    body: 'Gap methodology paragraph.',
    priorityGaps: [
      {
        rank: 1,
        area: 'Procurement Digitalisation',
        currentState: 'Manual PO process via email',
        targetState: 'e-procurement platform, GCC benchmark: 80% digital orders',
        rootCause: 'No IT investment in supply chain tools',
        businessImpact: 'SAR 3M annual inefficiency',
        interdependencies: 'Blocks supplier performance management improvements',
      },
    ],
  },
  strategicRecommendations: [
    {
      title: 'Deploy e-Procurement Platform',
      priority: 'Critical',
      description: 'Deploy a cloud-based e-procurement system.\n\nThis will unlock digital supplier collaboration.',
      framework: 'CIPS Category Cube',
      timeframe: '90 days',
      expectedOutcome: 'SAR 2M cost savings in Year 1',
      kpis: ['PO cycle time (target: <24h)', 'Supplier invoice accuracy (target: >98%)'],
      implementationSteps: ['Define requirements', 'Shortlist 3 vendors', 'Run pilot with top 10 suppliers', 'Full rollout'],
    },
    {
      title: 'Implement S&OP Process',
      priority: 'High',
      description: 'Establish monthly S&OP rhythm.\n\nAlign supply and demand planning.',
      framework: 'SCOR-P',
      timeframe: '60 days',
      expectedOutcome: '15% reduction in stockouts',
      kpis: ['Forecast accuracy (target: >85%)', 'Stockout rate (target: <3%)'],
      implementationSteps: ['Appoint S&OP champion', 'Define meeting cadence', 'Build data templates'],
    },
  ],
  implementationRoadmap: {
    headline: '6-Month Transformation Roadmap',
    overview: 'Transformation philosophy paragraph.\n\nPhase sequencing rationale.',
    phase1: {
      title: 'Phase 1 — Foundation & Quick Wins (Months 1–2)',
      objective: 'Establish baseline processes and deliver early wins',
      activities: ['Activity 1', 'Activity 2', 'Activity 3'],
      milestones: ['Milestone A by end of Month 1', 'Milestone B by end of Month 2'],
      resources: 'Project manager + 2 procurement staff',
      risks: ['Risk of stakeholder resistance', 'Data quality issues'],
    },
    phase2: {
      title: 'Phase 2 — Process Formalisation (Months 3–4)',
      objective: 'Formalise and document all core processes',
      activities: ['Activity 4', 'Activity 5', 'Activity 6'],
      milestones: ['Milestone C', 'Milestone D'],
      resources: 'Same team + IT support',
      risks: ['Integration complexity'],
    },
    phase3: {
      title: 'Phase 3 — Capability Scaling & Measurement (Months 5–6)',
      objective: 'Scale capabilities and embed measurement frameworks',
      activities: ['Activity 7', 'Activity 8', 'Activity 9'],
      milestones: ['Milestone E', 'Milestone F'],
      resources: 'Full team + external CIPS-certified advisor',
      risks: ['Budget constraints in H2'],
    },
  },
  investmentProjection: {
    headline: 'Investment & Return Projection',
    body: 'Investment philosophy paragraph.\n\nReturn compounding paragraph.',
    scenarios: [
      { name: 'Conservative', assumption: 'Partial implementation, 50–60% adoption', year1SavingsRange: 'SAR 1.5–2.5M', keyDrivers: ['Cost reduction', 'Efficiency gains'], roi: '120% ROI' },
      { name: 'Base Case',    assumption: 'Full implementation, 75–85% adoption',    year1SavingsRange: 'SAR 3–5M',     keyDrivers: ['Cost reduction', 'Revenue enablement', 'Risk mitigation'], roi: '210% ROI' },
      { name: 'Optimistic',   assumption: 'Full implementation with strong leadership', year1SavingsRange: 'SAR 6–8M', keyDrivers: ['Full digital transformation', 'Supplier consolidation'], roi: '350% ROI' },
    ],
  },
  conclusion: {
    headline: 'Conclusion & Recommended Next Steps',
    body: 'Strategic opportunity synthesis.\n\nWhy now paragraph.',
    immediateNextSteps: [
      'Schedule executive alignment meeting this week',
      'Appoint internal project champion by Friday',
      'Issue RFI to 3 e-procurement vendors by end of week',
    ],
  },
};

const API_RESPONSE = {
  ok: true,
  report: MOCK_REPORT,
  generatedAt: '2026-07-28T10:00:00.000Z',
};

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function renderPage() {
  render(
    <LanguageProvider>
      <ReportGenerator />
    </LanguageProvider>,
  );
}

function fillRequiredFields() {
  fireEvent.change(screen.getByPlaceholderText('e.g. Ahmed Al-Rashidi'), {
    target: { value: 'Ahmed Al-Rashidi' },
  });
  fireEvent.change(screen.getByPlaceholderText('e.g. Saudi Logistics Co.'), {
    target: { value: 'Acme Logistics' },
  });
  // Industry: click "Manufacturing" button
  fireEvent.click(screen.getByRole('button', { name: 'Manufacturing' }));
  // Size: click "SME — 50–250 employees" button
  fireEvent.click(screen.getByRole('button', { name: /SME — 50–250/i }));
}

/* ══════════════════════════════════════════════════════════════════════════════
   Tests
   ══════════════════════════════════════════════════════════════════════════════ */

describe('ReportGenerator — full browser flow', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(window, 'print').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  /* ── Phase A — form renders ───────────────────────────────────────────── */
  it('A: renders the form phase with required fields and a disabled Generate button', () => {
    renderPage();

    expect(screen.getByPlaceholderText('e.g. Ahmed Al-Rashidi')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Saudi Logistics Co.')).toBeInTheDocument();

    const generateBtn = screen.getByRole('button', { name: /Generate My Report/i });
    expect(generateBtn).toBeDisabled();
  });

  it('A2: Generate button becomes enabled once all required fields are filled', () => {
    renderPage();
    fillRequiredFields();
    expect(screen.getByRole('button', { name: /Generate My Report/i })).not.toBeDisabled();
  });

  /* ── Phase B — generating phase ───────────────────────────────────────── */
  it('B: generating phase appears immediately after clicking Generate', async () => {
    // fetch never resolves during this test — we just check the interim state
    let resolveFetch!: (value: Response) => void;
    vi.spyOn(globalThis, 'fetch').mockReturnValue(
      new Promise<Response>((resolve) => { resolveFetch = resolve; }),
    );

    renderPage();
    fillRequiredFields();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Generate My Report/i }));
    });

    expect(screen.getByText(/Generating Your Strategy Report/i)).toBeInTheDocument();
    expect(screen.getByText(/Analysing maturity scores/i)).toBeInTheDocument();
    expect(screen.getByText(/please keep this tab open/i)).toBeInTheDocument();

    // Resolve to avoid hanging promises after test ends
    resolveFetch(new Response(JSON.stringify(API_RESPONSE), { status: 200, headers: { 'Content-Type': 'application/json' } }));
  });

  /* ── Phase C — ready phase with report content ────────────────────────── */
  it('C: report sections render on screen after the API resolves', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(API_RESPONSE), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    );

    renderPage();
    fillRequiredFields();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Generate My Report/i }));
    });

    // Wait for ready phase
    await waitFor(() => {
      expect(screen.getByText(/Your strategy report is ready/i)).toBeInTheDocument();
    });

    // Executive summary headline visible in screen preview card (also present in print layout)
    const summaryHeadlines = screen.getAllByText(/Acme Logistics must urgently modernise/i);
    expect(summaryHeadlines.length).toBeGreaterThanOrEqual(1);

    // Strategic recommendations appear
    expect(screen.getByText('Deploy e-Procurement Platform')).toBeInTheDocument();
    expect(screen.getByText('Implement S&OP Process')).toBeInTheDocument();

    // Investment scenarios appear (values exist in both screen card and print layout)
    expect(screen.getAllByText('SAR 1.5–2.5M').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('SAR 3–5M').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('SAR 6–8M').length).toBeGreaterThanOrEqual(1);

    // Roadmap phase labels appear
    expect(screen.getAllByText(/Phase 1/i).length).toBeGreaterThanOrEqual(1);

    // Download PDF button present
    expect(screen.getByRole('button', { name: /Download PDF/i })).toBeInTheDocument();
  });

  /* ── Phase D — print ──────────────────────────────────────────────────── */
  it('D: clicking Download PDF calls window.print() and ReportPrintLayout is in the DOM', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(API_RESPONSE), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    );

    renderPage();
    fillRequiredFields();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Generate My Report/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/Your strategy report is ready/i)).toBeInTheDocument();
    });

    // The hidden print layout should be in the DOM (display:none on screen, block on print)
    const printRoot = document.getElementById('report-print-root');
    expect(printRoot).not.toBeNull();

    // Print root contains the cover page company name
    expect(printRoot?.textContent).toContain('Acme Logistics');

    // Click Download PDF
    fireEvent.click(screen.getByRole('button', { name: /Download PDF/i }));
    expect(window.print).toHaveBeenCalledTimes(1);
  });

  /* ── Phase E — error path ─────────────────────────────────────────────── */
  it('E: API error returns to form phase and displays the error message', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'AI service temporarily unavailable' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    renderPage();
    fillRequiredFields();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Generate My Report/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/Generation failed/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/AI service temporarily unavailable/i)).toBeInTheDocument();

    // Must be back on the form phase
    expect(screen.getByRole('button', { name: /Generate My Report/i })).toBeInTheDocument();
  });
});
