/**
 * #382 — Coverage / Source-Quality Badge, Platform-Wide (Maturity country picker).
 *
 * Confirms the country-picker grid on the Maturity intake screen renders the
 * regulatory coverageLevel as a colored pill badge (same visual pattern as the
 * #139 GCC-scope badge on KPI Dashboard and the Country Coverage summary box
 * further down this same page), for all three coverageLevel states, in both
 * English and Arabic.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { LanguageProvider } from '@/lib/LanguageContext';
import {
  Maturity,
  _clearMaturityTestSeed,
  _setMaturityTestSeed,
  MATURITY_DRAFT_KEY,
} from '@/pages/Maturity';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = ResizeObserverStub;
Element.prototype.scrollIntoView = () => {};

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
        ({ children, ...rest }: React.HTMLAttributes<HTMLDivElement>, ref: React.Ref<HTMLDivElement>) =>
          <div ref={ref} {...rest}>{children}</div>,
      ),
    },
  };
});

const MOCK_COUNTRIES = [
  { id: 'ksa', name: 'Saudi Arabia', nameAr: 'السعودية', isoCode: 'SA', region: 'gcc', coverageLevel: 'full', isDefault: true, sortOrder: 1 },
  { id: 'uae', name: 'UAE', nameAr: 'الإمارات', isoCode: 'AE', region: 'gcc', coverageLevel: 'partial', isDefault: false, sortOrder: 2 },
  { id: 'qatar', name: 'Qatar', nameAr: 'قطر', isoCode: 'QA', region: 'gcc', coverageLevel: 'roadmap', isDefault: false, sortOrder: 3 },
];

function intakeDraft() {
  return {
    phase: 'intake' as const,
    answers: {},
    intakeData: { industry: '', companySize: '', country: 'ksa' },
    selectedSegmentIds: [],
  };
}

function renderMaturity() {
  render(
    <LanguageProvider>
      <Maturity />
    </LanguageProvider>,
  );
}

beforeEach(() => {
  // Real (non-seeded) path so the component's own /regulatory/countries
  // fetch effect runs and regCountries populates from our mock response.
  _clearMaturityTestSeed();
  sessionStorage.clear();
  localStorage.setItem(MATURITY_DRAFT_KEY, JSON.stringify(intakeDraft()));
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (typeof url === 'string' && url.includes('/regulatory/countries')) {
        return { ok: true, status: 200, json: async () => ({ ok: true, countries: MOCK_COUNTRIES }) };
      }
      return { ok: true, status: 201, json: async () => ({}) };
    }) as unknown as typeof fetch,
  );
});

afterEach(() => {
  cleanup();
  _setMaturityTestSeed({});
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('Maturity intake — country-picker coverage badge (#382)', () => {
  it('renders a "Full regulatory coverage" badge for a full-coverage country (EN)', async () => {
    renderMaturity();
    const badge = await screen.findByTestId('intake-country-coverage-ksa');
    expect(badge).toHaveTextContent('Full regulatory coverage');
    expect(badge.className).toContain('bg-emerald-100');
    expect(badge.className).toContain('text-emerald-700');
  });

  it('renders a "Live — pending review" badge for a partial-coverage country (EN)', async () => {
    renderMaturity();
    const badge = await screen.findByTestId('intake-country-coverage-uae');
    expect(badge).toHaveTextContent('Live — pending review');
    expect(badge.className).toContain('bg-amber-100');
    expect(badge.className).toContain('text-amber-700');
  });

  it('renders a "Coming soon" badge for a roadmap-only country (EN)', async () => {
    renderMaturity();
    const badge = await screen.findByTestId('intake-country-coverage-qatar');
    expect(badge).toHaveTextContent('Coming soon');
    expect(badge.className).toContain('bg-slate-200');
    expect(badge.className).toContain('text-slate-600');
  });

  it('renders the Arabic coverage-level labels when in Arabic mode', async () => {
    localStorage.setItem('isc-lang', 'ar');
    renderMaturity();
    const full = await screen.findByTestId('intake-country-coverage-ksa');
    expect(full).toHaveTextContent('تغطية تنظيمية كاملة');
    const partial = await screen.findByTestId('intake-country-coverage-uae');
    expect(partial).toHaveTextContent('قيد المراجعة');
    const roadmap = await screen.findByTestId('intake-country-coverage-qatar');
    expect(roadmap).toHaveTextContent('قريبًا');
  });

  it('badge is a sibling of the country name, not replacing it', async () => {
    renderMaturity();
    const countryButton = await screen.findByTestId('intake-country-ksa');
    expect(countryButton).toHaveTextContent('Saudi Arabia');
    expect(countryButton).toHaveTextContent('Full regulatory coverage');
  });
});
