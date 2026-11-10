/**
 * X-01 wiring: TierBadgeSlot on the Maturity intake country card.
 * 1) No country row carries tierRecord (today's API): no tier badge appears, the existing coverage badges stay.
 * 2) A country row with tierRecord: the badge appears for the SELECTED country only (EN and AR).
 * Same harness as Maturity.coverage-badge.test.tsx.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { LanguageProvider } from '@/lib/LanguageContext';
import { Maturity, _clearMaturityTestSeed, _setMaturityTestSeed, MATURITY_DRAFT_KEY } from '@/pages/Maturity';
import { TIER_STRINGS } from '@/components/TierBadge';

class ResizeObserverStub { observe() {} unobserve() {} disconnect() {} }
(globalThis as any).ResizeObserver = ResizeObserverStub;
Element.prototype.scrollIntoView = () => {};

vi.mock('@/lib/AuthContext', () => ({ useAuth: () => ({ user: null, loading: false }) }));
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: { ...actual.motion, div: React.forwardRef(({ children, ...rest }: React.HTMLAttributes<HTMLDivElement>, ref: React.Ref<HTMLDivElement>) => <div ref={ref} {...rest}>{children}</div>) },
  };
});

const BASE = [
  { id: 'ksa', name: 'Saudi Arabia', nameAr: 'السعودية', isoCode: 'SA', region: 'gcc', coverageLevel: 'full', isDefault: true, sortOrder: 1 },
  { id: 'uae', name: 'UAE', nameAr: 'الإمارات', isoCode: 'AE', region: 'gcc', coverageLevel: 'partial', isDefault: false, sortOrder: 2 },
];
const WITH_TIER = [
  { ...BASE[0], tierRecord: { tier: 1, basis: 'Primary regulation text', confirmedBy: 'A. Smith, Counsel', confirmedOn: '2026-11-09' } },
  { ...BASE[1], tierRecord: { tier: 2, basis: 'ISC desk review', source: 'Regulator page', sourceOpenedOn: '2026-11-09' } },
];

function setup(countries: unknown[], selected: string) {
  _clearMaturityTestSeed();
  sessionStorage.clear();
  localStorage.setItem(MATURITY_DRAFT_KEY, JSON.stringify({ phase: 'intake', answers: {}, intakeData: { industry: '', companySize: '', country: selected }, selectedSegmentIds: [] }));
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (typeof url === 'string' && url.includes('/regulatory/countries')) return { ok: true, status: 200, json: async () => ({ ok: true, countries }) };
    return { ok: true, status: 201, json: async () => ({}) };
  }) as unknown as typeof fetch);
  render(<LanguageProvider><Maturity /></LanguageProvider>);
}
afterEach(() => { cleanup(); _setMaturityTestSeed({}); localStorage.clear(); vi.restoreAllMocks(); });
beforeEach(() => {});

describe('Maturity intake: TierBadgeSlot wiring', () => {
  it('no tierRecord on any country: no tier badge, existing coverage badge unchanged', async () => {
    setup(BASE, 'ksa');
    const badge = await screen.findByTestId('intake-country-coverage-ksa');
    expect(badge).toHaveTextContent('Full regulatory coverage');
    expect(document.body.textContent).not.toContain(TIER_STRINGS.t1.en);
    expect(document.body.textContent).not.toContain(TIER_STRINGS.t3.en);
    expect(document.querySelector('[data-part="basis"]')).toBeNull();
  });
  it('tierRecord on the selected country: the badge appears (EN), other country record does not', async () => {
    setup(WITH_TIER, 'ksa');
    await screen.findByTestId('intake-country-coverage-ksa');
    await waitFor(() => expect(document.body.textContent).toContain(TIER_STRINGS.t1.en));
    expect(document.body.textContent).not.toContain(TIER_STRINGS.t2.en);
  });
  it('switching selected country shows that country record (UAE = Tier 2)', async () => {
    setup(WITH_TIER, 'uae');
    await screen.findByTestId('intake-country-coverage-uae');
    await waitFor(() => expect(document.body.textContent).toContain(TIER_STRINGS.t2.en));
    expect(document.body.textContent).not.toContain(TIER_STRINGS.t1.en);
  });
  it('Arabic: the Arabic tier label shows', async () => {
    localStorage.setItem('isc-lang', 'ar');
    setup(WITH_TIER, 'ksa');
    await screen.findByTestId('intake-country-coverage-ksa');
    await waitFor(() => expect(document.body.textContent).toContain(TIER_STRINGS.t1.ar));
  });
});
