/**
 * AI Generate button — per-tool integration tests
 *
 * For each of the five toolkit tools confirms:
 *   1. Sign-in prompt shown (no Generate button) when not authenticated
 *   2. Generate button disabled when no data entered
 *   3. Generate button enabled once data is present
 *   4. Clicking Generate → spinner → result panel after fetch resolves
 *   5. API error → error message with Retry button
 *
 * Tools covered:
 *   • KRIDashboard          (inside RiskToolsSection)
 *   • TrainingNeedsAssessment
 *   • MaturityAssessmentTool
 *   • SupplierScorecardTool
 *   • KPIDashboard           (requires LanguageProvider wrapper)
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));

/* Auth mock — controlled per-suite via mockUseAuth */
const mockUseAuth = vi.fn(() => ({ isAuthenticated: true, user: { id: 1 }, loading: false }));
vi.mock('@/lib/AuthContext', () => ({ useAuth: () => mockUseAuth() }));

import { RiskToolsSection }         from './RiskTools';
import { TrainingNeedsAssessment }  from './TrainingTools';
import { MaturityAssessmentTool }   from './MaturityTools';
import { SupplierScorecardTool }    from './SupplierScorecard';
import { KPIDashboard }             from '@/components/KPIDashboard';
import { LanguageProvider }         from '@/lib/LanguageContext';

/* ── global helpers ────────────────────────────────────────────────────── */

const MOCK_PLAN = '## AI Plan\n- Step one [HIGH]\n- Step two [MEDIUM]';

function stubFetchOk(text = MOCK_PLAN) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ ok: true, text }),
  }));
}

function stubFetchFail(error = 'AI service unavailable') {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: false,
    json: async () => ({ ok: false, error }),
  }));
}

function stubFetchNetworkOff() {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network off')));
}

beforeEach(() => {
  localStorage.clear();
  cleanup();
  mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { id: 1 }, loading: false });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/* ══════════════════════════════════════════════════════════════════════════
   KRI Dashboard (inside RiskToolsSection)
══════════════════════════════════════════════════════════════════════════ */
describe('KRIDashboard — Generate button', () => {
  const SK = 'isc-tool-risk-kri-v2';

  /** Navigate to the AI Risk Brief tab inside RiskToolsSection */
  function goToAiTab() {
    fireEvent.click(screen.getByRole('tab', { name: /AI Risk Brief/i }));
  }

  it('shows sign-in prompt when not authenticated', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
    render(<RiskToolsSection isAr={false} />);
    goToAiTab();
    await waitFor(() =>
      expect(screen.getByText(/Sign in to generate an AI plan/i)).toBeInTheDocument(),
    );
    expect(screen.queryByRole('button', { name: /Generate Risk Assessment/i })).toBeNull();
  });

  it('Generate button is disabled when no KRI values are entered', async () => {
    render(<RiskToolsSection isAr={false} />);
    goToAiTab();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Generate Risk Assessment/i })).toBeDisabled(),
    );
  });

  it('Generate button is enabled once KRI values are stored', async () => {
    localStorage.setItem(SK, JSON.stringify({ concentration: '55', dio: '50' }));
    render(<RiskToolsSection isAr={false} />);
    goToAiTab();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Generate Risk Assessment/i })).not.toBeDisabled(),
    );
  });

  it('clicking Generate shows spinner then result panel', async () => {
    localStorage.setItem(SK, JSON.stringify({ concentration: '55', dio: '50' }));
    stubFetchOk();
    render(<RiskToolsSection isAr={false} />);
    goToAiTab();

    const btn = await waitFor(() => {
      const b = screen.getByRole('button', { name: /Generate Risk Assessment/i });
      expect(b).not.toBeDisabled();
      return b;
    });
    fireEvent.click(btn);

    // Spinner appears synchronously before the fetch resolves
    expect(screen.getByText(/Generating/i)).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText('AI-Generated Plan')).toBeInTheDocument(),
    );
    expect(screen.getByText('AI Plan')).toBeInTheDocument();
  });

  it('API error shows error message with Retry button', async () => {
    localStorage.setItem(SK, JSON.stringify({ concentration: '55' }));
    stubFetchFail('AI service unavailable');
    render(<RiskToolsSection isAr={false} />);
    goToAiTab();

    const btn = await waitFor(() => {
      const b = screen.getByRole('button', { name: /Generate Risk Assessment/i });
      expect(b).not.toBeDisabled();
      return b;
    });
    fireEvent.click(btn);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument(),
    );
    expect(screen.getByText('AI service unavailable')).toBeInTheDocument();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Training Needs Assessment
══════════════════════════════════════════════════════════════════════════ */
describe('TrainingNeedsAssessment — Generate button', () => {
  const SK_MEMBERS = 'isc-tool-training-members';
  const SK_SCORES  = 'isc-tool-training-scores';

  it('shows sign-in prompt when not authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
    render(<TrainingNeedsAssessment isAr={false} />);
    expect(screen.getByText(/Sign in to generate an AI plan/i)).toBeInTheDocument();
  });

  it('Generate button is disabled when no member scores are entered', () => {
    render(<TrainingNeedsAssessment isAr={false} />);
    expect(screen.getByRole('button', { name: /Generate Learning Roadmap/i })).toBeDisabled();
  });

  it('Generate button is enabled once scores are present', () => {
    localStorage.setItem(SK_MEMBERS, JSON.stringify(['Alice', 'Bob']));
    localStorage.setItem(SK_SCORES, JSON.stringify({ Alice: { strategy: 2, procurement: 3 } }));
    render(<TrainingNeedsAssessment isAr={false} />);
    expect(screen.getByRole('button', { name: /Generate Learning Roadmap/i })).not.toBeDisabled();
  });

  it('clicking Generate shows spinner then result panel', async () => {
    localStorage.setItem(SK_MEMBERS, JSON.stringify(['Alice']));
    localStorage.setItem(SK_SCORES, JSON.stringify({ Alice: { strategy: 2, procurement: 3, risk: 4 } }));
    stubFetchOk();
    render(<TrainingNeedsAssessment isAr={false} />);

    fireEvent.click(screen.getByRole('button', { name: /Generate Learning Roadmap/i }));
    expect(screen.getByText(/Generating/i)).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText('AI-Generated Plan')).toBeInTheDocument(),
    );
  });

  it('API error shows error message with Retry button', async () => {
    localStorage.setItem(SK_MEMBERS, JSON.stringify(['Alice']));
    localStorage.setItem(SK_SCORES, JSON.stringify({ Alice: { strategy: 2 } }));
    stubFetchFail('AI service unavailable');
    render(<TrainingNeedsAssessment isAr={false} />);

    fireEvent.click(screen.getByRole('button', { name: /Generate Learning Roadmap/i }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument(),
    );
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Maturity Assessment Tool
══════════════════════════════════════════════════════════════════════════ */
describe('MaturityAssessmentTool — Generate button', () => {
  const slug = 'resiliency';
  const SK   = `isc-tool-maturity-${slug}`;

  it('shows sign-in prompt when not authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
    render(<MaturityAssessmentTool slug={slug} isAr={false} />);
    expect(screen.getByText(/Sign in to generate an AI plan/i)).toBeInTheDocument();
  });

  it('Generate button is disabled when no dimensions are rated', () => {
    render(<MaturityAssessmentTool slug={slug} isAr={false} />);
    expect(screen.getByRole('button', { name: /Generate Maturity Roadmap/i })).toBeDisabled();
  });

  it('Generate button is enabled once at least one dimension is rated', () => {
    localStorage.setItem(SK, JSON.stringify({ visibility: 3, dual_source: 4 }));
    render(<MaturityAssessmentTool slug={slug} isAr={false} />);
    expect(screen.getByRole('button', { name: /Generate Maturity Roadmap/i })).not.toBeDisabled();
  });

  it('clicking Generate shows spinner then result panel', async () => {
    localStorage.setItem(SK, JSON.stringify({ visibility: 3, dual_source: 4, bcp: 2 }));
    stubFetchOk();
    render(<MaturityAssessmentTool slug={slug} isAr={false} />);

    fireEvent.click(screen.getByRole('button', { name: /Generate Maturity Roadmap/i }));
    expect(screen.getByText(/Generating/i)).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText('AI-Generated Plan')).toBeInTheDocument(),
    );
  });

  it('API error shows error message with Retry button', async () => {
    localStorage.setItem(SK, JSON.stringify({ visibility: 3 }));
    stubFetchFail('Service error');
    render(<MaturityAssessmentTool slug={slug} isAr={false} />);

    fireEvent.click(screen.getByRole('button', { name: /Generate Maturity Roadmap/i }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument(),
    );
  });

  it('works for value-engineering slug', () => {
    const veSlug = 'value-engineering';
    localStorage.setItem(`isc-tool-maturity-${veSlug}`, JSON.stringify({ function: 3 }));
    render(<MaturityAssessmentTool slug={veSlug} isAr={false} />);
    expect(screen.getByRole('button', { name: /Generate Maturity Roadmap/i })).not.toBeDisabled();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Supplier Scorecard Tool
   AuthContext mock: user logged in — data from localStorage, no server sync
══════════════════════════════════════════════════════════════════════════ */
describe('SupplierScorecardTool — Generate button', () => {
  const ROSTER_KEY = 'isc-tool-supplier-roster';

  /** Pre-seed all 6 dimensions so calcWeightedScore returns non-null */
  function seedFullRoster(name = 'Acme Supplier') {
    localStorage.setItem(ROSTER_KEY, JSON.stringify({
      suppliers: [{
        id: 'sup-test-1',
        name,
        tier: 'Strategic',
        subScores: {
          delivery:     { otif: '90' },
          quality:      { defect: '85' },
          cost:         { savings: '80' },
          compliance:   { regulatory: '90' },
          innovation:   { ideas: '75' },
          relationship: { responsiveness: '85' },
        },
      }],
      activeId: 'sup-test-1',
    }));
  }

  it('shows sign-in prompt when not authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null, loading: false });
    seedFullRoster();
    stubFetchNetworkOff();
    render(<SupplierScorecardTool isAr={false} />);
    expect(screen.getByText(/Sign in to generate an AI plan/i)).toBeInTheDocument();
  });

  it('Generate button absent when weighted score cannot be calculated (incomplete dimensions)', () => {
    // Only one dimension scored — weightedScore is null → panel not rendered
    localStorage.setItem(ROSTER_KEY, JSON.stringify({
      suppliers: [{ id: 'sup-2', name: 'Partial', tier: 'Strategic', subScores: { delivery: { otif: '90' } } }],
      activeId: 'sup-2',
    }));
    stubFetchNetworkOff();
    render(<SupplierScorecardTool isAr={false} />);
    expect(screen.queryByRole('button', { name: /Generate Development Plan/i })).toBeNull();
  });

  it('Generate button enabled when all 6 dimensions are scored', () => {
    seedFullRoster();
    stubFetchNetworkOff();
    render(<SupplierScorecardTool isAr={false} />);
    expect(screen.getByRole('button', { name: /Generate Development Plan/i })).not.toBeDisabled();
  });

  it('clicking Generate shows spinner then result panel', async () => {
    seedFullRoster();
    stubFetchOk();
    render(<SupplierScorecardTool isAr={false} />);

    fireEvent.click(screen.getByRole('button', { name: /Generate Development Plan/i }));
    expect(screen.getByText(/Generating/i)).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText('AI-Generated Plan')).toBeInTheDocument(),
    );
  });

  it('API error shows Retry button', async () => {
    seedFullRoster();
    stubFetchFail('AI service error');
    render(<SupplierScorecardTool isAr={false} />);

    fireEvent.click(screen.getByRole('button', { name: /Generate Development Plan/i }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument(),
    );
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   KPI Dashboard
   Requires LanguageProvider wrapper; inline Generate button gated on auth
══════════════════════════════════════════════════════════════════════════ */
describe('KPIDashboard — Generate button', () => {
  const slug = 'supply-chain-strategy';
  const SK   = `isc-kpi-${slug}`;

  function renderKPI() {
    return render(
      <LanguageProvider>
        <KPIDashboard slug={slug} />
      </LanguageProvider>,
    );
  }

  it('does not show Generate button when no KPI values are entered', () => {
    renderKPI();
    expect(screen.queryByRole('button', { name: /Generate Performance Brief/i })).toBeNull();
  });

  it('does not show Generate button even with data when not authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
    localStorage.setItem(SK, JSON.stringify({ por: '88' }));
    renderKPI();
    expect(screen.queryByRole('button', { name: /Generate Performance Brief/i })).toBeNull();
  });

  it('Generate button appears once at least one KPI value is stored (authenticated)', () => {
    localStorage.setItem(SK, JSON.stringify({ por: '88' }));
    renderKPI();
    expect(screen.getByRole('button', { name: /Generate Performance Brief/i })).toBeInTheDocument();
  });

  it('clicking Generate shows spinner then result panel', async () => {
    localStorage.setItem(SK, JSON.stringify({ por: '88', otif: '91' }));
    stubFetchOk();
    renderKPI();

    fireEvent.click(screen.getByRole('button', { name: /Generate Performance Brief/i }));

    await waitFor(() =>
      expect(screen.getByText('AI-Generated Plan')).toBeInTheDocument(),
    );
  });

  it('API error on KPI dashboard shows Retry button', async () => {
    localStorage.setItem(SK, JSON.stringify({ por: '88' }));
    stubFetchFail('Quota exceeded');
    renderKPI();

    fireEvent.click(screen.getByRole('button', { name: /Generate Performance Brief/i }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument(),
    );
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Arabic path — isAr=true for all five tools
   Confirms:
     1. Arabic button label is shown
     2. fetch body sends language='ar'
     3. Result panel has dir="rtl"
══════════════════════════════════════════════════════════════════════════ */

/** Find the fetch call that targeted the AI plan endpoint and parse its body */
function getAIPlanFetchBody(): Record<string, unknown> {
  const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls as [string, RequestInit][];
  const match = calls.find(([url]) => typeof url === 'string' && url.includes('/ai/plan'));
  if (!match) throw new Error('No fetch call to /ai/plan was found');
  return JSON.parse(match[1].body as string);
}

describe('KRIDashboard — Arabic path (isAr=true)', () => {
  const SK = 'isc-tool-risk-kri-v2';

  function goToAiTabAr() {
    fireEvent.click(screen.getByRole('tab', { name: /تقرير المخاطر/i }));
  }

  it('shows Arabic generate button label', () => {
    localStorage.setItem(SK, JSON.stringify({ concentration: '55' }));
    render(<RiskToolsSection isAr={true} />);
    goToAiTabAr();
    expect(screen.getByRole('button', { name: /توليد تقرير المخاطر/i })).toBeInTheDocument();
  });

  it('sends language=ar in the fetch body', async () => {
    localStorage.setItem(SK, JSON.stringify({ concentration: '55', dio: '50' }));
    stubFetchOk();
    render(<RiskToolsSection isAr={true} />);
    goToAiTabAr();

    const btn = await waitFor(() => {
      const b = screen.getByRole('button', { name: /توليد تقرير المخاطر/i });
      expect(b).not.toBeDisabled();
      return b;
    });
    fireEvent.click(btn);

    // Arabic spinner appears synchronously before the fetch resolves
    expect(screen.getByText(/جارٍ التوليد/i)).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText('الخطة المُولَّدة بالذكاء الاصطناعي')).toBeInTheDocument());
    expect(getAIPlanFetchBody().language).toBe('ar');
  });

  it('result panel renders with dir="rtl"', async () => {
    localStorage.setItem(SK, JSON.stringify({ concentration: '55', dio: '50' }));
    stubFetchOk();
    const { container } = render(<RiskToolsSection isAr={true} />);
    goToAiTabAr();

    const btn = await waitFor(() => {
      const b = screen.getByRole('button', { name: /توليد تقرير المخاطر/i });
      expect(b).not.toBeDisabled();
      return b;
    });
    fireEvent.click(btn);

    await waitFor(() => expect(screen.getByText('الخطة المُولَّدة بالذكاء الاصطناعي')).toBeInTheDocument());
    expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument();
  });
});

describe('TrainingNeedsAssessment — Arabic path (isAr=true)', () => {
  const SK_MEMBERS = 'isc-tool-training-members';
  const SK_SCORES  = 'isc-tool-training-scores';

  it('shows Arabic generate button label', () => {
    localStorage.setItem(SK_MEMBERS, JSON.stringify(['أحمد']));
    localStorage.setItem(SK_SCORES, JSON.stringify({ أحمد: { strategy: 2 } }));
    render(<TrainingNeedsAssessment isAr={true} />);
    expect(screen.getByRole('button', { name: /توليد خارطة التعلّم/i })).toBeInTheDocument();
  });

  it('sends language=ar in the fetch body', async () => {
    localStorage.setItem(SK_MEMBERS, JSON.stringify(['أحمد']));
    localStorage.setItem(SK_SCORES, JSON.stringify({ أحمد: { strategy: 2, procurement: 3 } }));
    stubFetchOk();
    render(<TrainingNeedsAssessment isAr={true} />);

    fireEvent.click(screen.getByRole('button', { name: /توليد خارطة التعلّم/i }));

    await waitFor(() => expect(screen.getByText('الخطة المُولَّدة بالذكاء الاصطناعي')).toBeInTheDocument());
    expect(getAIPlanFetchBody().language).toBe('ar');
  });

  it('result panel renders with dir="rtl"', async () => {
    localStorage.setItem(SK_MEMBERS, JSON.stringify(['أحمد']));
    localStorage.setItem(SK_SCORES, JSON.stringify({ أحمد: { strategy: 2, procurement: 3 } }));
    stubFetchOk();
    const { container } = render(<TrainingNeedsAssessment isAr={true} />);

    fireEvent.click(screen.getByRole('button', { name: /توليد خارطة التعلّم/i }));

    await waitFor(() => expect(screen.getByText('الخطة المُولَّدة بالذكاء الاصطناعي')).toBeInTheDocument());
    expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument();
  });
});

describe('MaturityAssessmentTool — Arabic path (isAr=true)', () => {
  const slug = 'resiliency';
  const SK   = `isc-tool-maturity-${slug}`;

  it('shows Arabic generate button label', () => {
    localStorage.setItem(SK, JSON.stringify({ visibility: 3 }));
    render(<MaturityAssessmentTool slug={slug} isAr={true} />);
    expect(screen.getByRole('button', { name: /توليد خارطة طريق النضج/i })).toBeInTheDocument();
  });

  it('sends language=ar in the fetch body', async () => {
    localStorage.setItem(SK, JSON.stringify({ visibility: 3, dual_source: 4 }));
    stubFetchOk();
    render(<MaturityAssessmentTool slug={slug} isAr={true} />);

    fireEvent.click(screen.getByRole('button', { name: /توليد خارطة طريق النضج/i }));

    await waitFor(() => expect(screen.getByText('الخطة المُولَّدة بالذكاء الاصطناعي')).toBeInTheDocument());
    expect(getAIPlanFetchBody().language).toBe('ar');
  });

  it('result panel renders with dir="rtl"', async () => {
    localStorage.setItem(SK, JSON.stringify({ visibility: 3, dual_source: 4 }));
    stubFetchOk();
    const { container } = render(<MaturityAssessmentTool slug={slug} isAr={true} />);

    fireEvent.click(screen.getByRole('button', { name: /توليد خارطة طريق النضج/i }));

    await waitFor(() => expect(screen.getByText('الخطة المُولَّدة بالذكاء الاصطناعي')).toBeInTheDocument());
    expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument();
  });
});

describe('SupplierScorecardTool — Arabic path (isAr=true)', () => {
  const ROSTER_KEY = 'isc-tool-supplier-roster';

  function seedFullRoster() {
    localStorage.setItem(ROSTER_KEY, JSON.stringify({
      suppliers: [{
        id: 'sup-ar-1',
        name: 'مورّد نموذجي',
        tier: 'Strategic',
        subScores: {
          delivery:     { otif: '90' },
          quality:      { defect: '85' },
          cost:         { savings: '80' },
          compliance:   { regulatory: '90' },
          innovation:   { ideas: '75' },
          relationship: { responsiveness: '85' },
        },
      }],
      activeId: 'sup-ar-1',
    }));
  }

  it('shows Arabic generate button label', () => {
    seedFullRoster();
    stubFetchNetworkOff();
    render(<SupplierScorecardTool isAr={true} />);
    expect(screen.getByRole('button', { name: /توليد خطة التطوير/i })).toBeInTheDocument();
  });

  it('sends language=ar in the fetch body', async () => {
    seedFullRoster();
    stubFetchOk();
    render(<SupplierScorecardTool isAr={true} />);

    fireEvent.click(screen.getByRole('button', { name: /توليد خطة التطوير/i }));

    await waitFor(() => expect(screen.getByText('الخطة المُولَّدة بالذكاء الاصطناعي')).toBeInTheDocument());
    expect(getAIPlanFetchBody().language).toBe('ar');
  });

  it('result panel renders with dir="rtl"', async () => {
    seedFullRoster();
    stubFetchOk();
    const { container } = render(<SupplierScorecardTool isAr={true} />);

    fireEvent.click(screen.getByRole('button', { name: /توليد خطة التطوير/i }));

    await waitFor(() => expect(screen.getByText('الخطة المُولَّدة بالذكاء الاصطناعي')).toBeInTheDocument());
    expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument();
  });
});

describe('KPIDashboard — Arabic path (isAr=true via LanguageProvider)', () => {
  const slug = 'supply-chain-strategy';
  const SK   = `isc-kpi-${slug}`;

  /** Render KPIDashboard with Arabic pre-set via localStorage so LanguageProvider starts in AR mode */
  function renderKPIAr() {
    localStorage.setItem('isc-lang', 'ar');
    return render(
      <LanguageProvider>
        <KPIDashboard slug={slug} />
      </LanguageProvider>,
    );
  }

  it('shows Arabic generate button label', () => {
    localStorage.setItem(SK, JSON.stringify({ por: '88' }));
    renderKPIAr();
    expect(screen.getByRole('button', { name: /توليد التقرير التنفيذي/i })).toBeInTheDocument();
  });

  it('sends language=ar in the fetch body', async () => {
    localStorage.setItem(SK, JSON.stringify({ por: '88', otif: '91' }));
    stubFetchOk();
    renderKPIAr();

    fireEvent.click(screen.getByRole('button', { name: /توليد التقرير التنفيذي/i }));

    await waitFor(() => expect(screen.getByText('الخطة المُولَّدة بالذكاء الاصطناعي')).toBeInTheDocument());
    expect(getAIPlanFetchBody().language).toBe('ar');
  });

  it('result panel renders with dir="rtl"', async () => {
    localStorage.setItem(SK, JSON.stringify({ por: '88', otif: '91' }));
    stubFetchOk();
    const { container } = renderKPIAr();

    fireEvent.click(screen.getByRole('button', { name: /توليد التقرير التنفيذي/i }));

    await waitFor(() => expect(screen.getByText('الخطة المُولَّدة بالذكاء الاصطناعي')).toBeInTheDocument());
    expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument();
  });
});
