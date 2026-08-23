/**
 * ReportGenerator — TCO Engine wiring (#168/#170 TCO reporting, 2026-08-23).
 *
 * Covers:
 *  - Guest: never fetches /tco-analyses, and the POST to /report/generate
 *    carries no tcoData field (backward-compatible for every account that
 *    never used the TCO Engine).
 *  - Logged in with saved, priced TCO analyses: the fetched best-supplier
 *    figures are computed correctly and sent as tcoData in the generate POST.
 *  - Logged in with no saved analyses: same as guest -- no tcoData sent.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor, act } from '@testing-library/react';
import { LanguageProvider } from '@/lib/LanguageContext';
import { ReportGenerator } from '@/pages/ReportGenerator';

Element.prototype.scrollIntoView = () => {};

const mockUseAuth = vi.fn(() => ({ user: null as { id: number; fullName: string } | null, loading: false }));
vi.mock('@/lib/AuthContext', () => ({ useAuth: () => mockUseAuth() }));

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

const MINIMAL_REPORT = {
  reportTitle: 'x', reportSubtitle: 'y',
  executiveSummary: { headline: 'h', body: 'b' },
  companyContext: { headline: 'h', body: 'b' },
  maturityAnalysis: { headline: 'h', body: 'b', keyStrengths: [], criticalGaps: [], benchmarkInsight: 'b' },
  gapAnalysis: { headline: 'h', body: 'b', priorityGaps: [] },
  strategicRecommendations: [],
  implementationRoadmap: { headline: 'h', overview: 'o', phase1: PHASE(), phase2: PHASE(), phase3: PHASE() },
  investmentProjection: { headline: 'h', body: 'b', scenarios: [] },
  conclusion: { headline: 'h', body: 'b', immediateNextSteps: [] },
};
function PHASE() { return { title: 't', objective: 'o', activities: [], milestones: [], resources: 'r', risks: [] }; }

const ONE_TCO_ANALYSIS = {
  clientKey: 'tcoa1', name: 'Bearing supplier comparison', itemName: 'Bearing 6205-ZZ',
  suppliers: [
    // priced: directPurchase 100*10=1000, +15% VAT=1150, tcoPerUnit=115
    { id: 's1', name: 'Supplier A', unitPrice: 100, annualQty: 10, vatPct: 15, dutyPct: 0,
      freight: 0, insurance: 0, handling: 0, lastMile: 0, safetyStockDays: 0, carryingCostPct: 0,
      inspectionCost: 0, reworkCost: 0, auditCost: 0, poCount: 0, poCostEach: 0, invoiceProcessingCost: 0, disposalCost: 0 },
    // priced: directPurchase 200*10=2000, +15% VAT=2300, tcoPerUnit=230
    { id: 's2', name: 'Supplier B', unitPrice: 200, annualQty: 10, vatPct: 15, dutyPct: 0,
      freight: 0, insurance: 0, handling: 0, lastMile: 0, safetyStockDays: 0, carryingCostPct: 0,
      inspectionCost: 0, reworkCost: 0, auditCost: 0, poCount: 0, poCostEach: 0, invoiceProcessingCost: 0, disposalCost: 0 },
  ],
};

function renderPage() {
  render(
    <LanguageProvider>
      <ReportGenerator />
    </LanguageProvider>,
  );
}

function fillRequiredFields() {
  fireEvent.change(screen.getByPlaceholderText('e.g. Ahmed Al-Rashidi'), { target: { value: 'Ahmed Al-Rashidi' } });
  fireEvent.change(screen.getByPlaceholderText('e.g. Saudi Logistics Co.'), { target: { value: 'Acme Logistics' } });
  fireEvent.click(screen.getByRole('button', { name: 'Manufacturing' }));
  fireEvent.click(screen.getByRole('button', { name: /SME — 50–250/i }));
}

function stubFetch({ tcoAnalyses = [] as any[] } = {}) {
  const fetchMock = vi.fn((url: string, opts?: RequestInit) => {
    if (url.includes('tco-analyses')) {
      return Promise.resolve(new Response(JSON.stringify({ ok: true, analyses: tcoAnalyses }), { status: 200 }));
    }
    if (url.includes('report/generate')) {
      return Promise.resolve(new Response(JSON.stringify({ ok: true, report: MINIMAL_REPORT, generatedAt: '2026-08-23T00:00:00.000Z' }), { status: 200 }));
    }
    return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(window, 'print').mockImplementation(() => {});
  mockUseAuth.mockReturnValue({ user: null, loading: false });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('ReportGenerator — TCO wiring, guest', () => {
  it('never fetches /tco-analyses and sends no tcoData in the generate POST', async () => {
    const fetchMock = stubFetch();
    renderPage();
    fillRequiredFields();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Generate My Report/i }));
    });
    await waitFor(() => expect(screen.getByText('x')).toBeInTheDocument());

    expect(fetchMock.mock.calls.some(c => String(c[0]).includes('tco-analyses'))).toBe(false);
    const genCall = fetchMock.mock.calls.find(c => String(c[0]).includes('report/generate'))!;
    const body = JSON.parse((genCall[1] as RequestInit).body as string);
    expect(body.tcoData).toBeUndefined();
  });
});

describe('ReportGenerator — TCO wiring, logged in', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: { id: 1, fullName: 'Jane' }, loading: false });
  });

  it('sends the correctly-computed best-supplier TCO summary as tcoData', async () => {
    const fetchMock = stubFetch({ tcoAnalyses: [ONE_TCO_ANALYSIS] });
    renderPage();
    await waitFor(() => expect(fetchMock.mock.calls.some(c => String(c[0]).includes('tco-analyses'))).toBe(true));
    fillRequiredFields();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Generate My Report/i }));
    });
    await waitFor(() => expect(screen.getByText('x')).toBeInTheDocument());

    const genCall = fetchMock.mock.calls.find(c => String(c[0]).includes('report/generate'))!;
    const body = JSON.parse((genCall[1] as RequestInit).body as string);
    expect(body.tcoData).toHaveLength(1);
    const t = body.tcoData[0];
    expect(t.name).toBe('Bearing supplier comparison');
    expect(t.itemName).toBe('Bearing 6205-ZZ');
    expect(t.bestSupplierName).toBe('Supplier A');
    expect(t.bestTcoPerUnit).toBeCloseTo(115, 5);
    expect(t.bestTcoAnnual).toBeCloseTo(1150, 5);
    expect(t.savingsPct).toBeCloseTo(50, 5); // (230-115)/230 * 100
    expect(t.supplierCount).toBe(2);
  });

  it('sends no tcoData when the account has no saved analyses', async () => {
    const fetchMock = stubFetch({ tcoAnalyses: [] });
    renderPage();
    await waitFor(() => expect(fetchMock.mock.calls.some(c => String(c[0]).includes('tco-analyses'))).toBe(true));
    fillRequiredFields();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Generate My Report/i }));
    });
    await waitFor(() => expect(screen.getByText('x')).toBeInTheDocument());

    const genCall = fetchMock.mock.calls.find(c => String(c[0]).includes('report/generate'))!;
    const body = JSON.parse((genCall[1] as RequestInit).body as string);
    expect(body.tcoData).toBeUndefined();
  });
});
