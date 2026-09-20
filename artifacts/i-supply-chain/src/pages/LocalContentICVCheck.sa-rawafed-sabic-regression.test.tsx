/**
 * LocalContentICVCheck -- SA regression: sa-rawafed-stc / sa-sabic-lc-commitment
 * real click-through (20 Sep 2026)
 *
 * A prior commit (0088485) claimed the UI wiring for these two SA programs
 * was shipped and QA-verified, but no conditional-render blocks for either
 * program ID actually existed: clicking "stc Rawafed" or "SABIC Commitment
 * Gate" rendered the methodology text and then a dead screen (no input
 * fields, no results). The platform owner caught this by independently
 * re-reading the live pushed source, not from anything this suite reported.
 *
 * This file is the permanent, re-runnable regression guard for that fix
 * (commit 05f215d). It renders the real page component -- not a hand-copied
 * reconstruction of its JSX -- and drives it through actual user events, so
 * a future change that silently removes either input block, breaks the
 * PILLAR_LABELS translation for Rawafed's pillars, or breaks the SABIC
 * tolerance-deviation math will fail this suite rather than only being
 * caught by another manual owner review.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { LanguageProvider } from '@/lib/LanguageContext';
import { LocalContentICVCheck } from '@/pages/LocalContentICVCheck';
import { SABIC_LC_DEVIATION_TOLERANCE_PCT } from '@/lib/supplierLocalContentEligibility';

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function renderPage() {
  return render(
    <LanguageProvider>
      <LocalContentICVCheck />
    </LanguageProvider>,
  );
}

/**
 * The page always renders a "Target Tender Threshold" field and, per entry,
 * a "Spend Share" field ahead of whichever program's own inputs are showing
 * -- both exist regardless of program, so a program's own N fields are
 * always the LAST N number inputs on the page for a single-entry portfolio.
 */
function lastNumberInputs(n: number): HTMLInputElement[] {
  const all = Array.from(document.querySelectorAll('input[type="number"]')) as HTMLInputElement[];
  return all.slice(-n);
}

beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); });

/* ══════════════════════════════════════════════════════════════════════════
   sa-rawafed-stc
══════════════════════════════════════════════════════════════════════════ */

describe('LocalContentICVCheck -- sa-rawafed-stc real click-through', () => {
  it('clicking the program button reveals the real 8-field form and a genuinely computed result', () => {
    renderPage();

    const rawafedBtn = screen.getByRole('button', { name: /stc Rawafed/i });
    expect(rawafedBtn.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(rawafedBtn);
    expect(rawafedBtn.getAttribute('aria-pressed')).toBe('true');

    // Edge case: no result yet with nothing entered
    expect(screen.getByText('Enter the figures above to see the result.')).toBeInTheDocument();

    const inputs = lastNumberInputs(8);
    expect(inputs).toHaveLength(8);

    const values = [800000, 1000000, 400000, 500000, 100000, 200000, 150000, 300000];
    values.forEach((v, i) => fireEvent.change(inputs[i], { target: { value: String(v) } }));

    const totalEligible = 800000 + 400000 + 100000 + 150000;
    const totalSpend = 1000000 + 500000 + 200000 + 300000;
    const expectedPct = `${((totalEligible / totalSpend) * 100).toFixed(1)}%`;
    expect(screen.getByText(expectedPct)).toBeInTheDocument();
  });

  it('pillar labels are real translated text in both EN and AR, never the raw camelCase key', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /stc Rawafed/i }));
    const inputs = lastNumberInputs(8);
    [800000, 1000000, 400000, 500000, 100000, 200000, 150000, 300000].forEach((v, i) =>
      fireEvent.change(inputs[i], { target: { value: String(v) } }),
    );

    expect(screen.getByText('Salaries')).toBeInTheDocument();
    expect(screen.getByText('Asset Depreciation')).toBeInTheDocument();
    expect(screen.getByText('Capacity Development')).toBeInTheDocument();
    expect(screen.queryByText('salaries')).not.toBeInTheDocument();
    expect(screen.queryByText('assetDepreciation')).not.toBeInTheDocument();
    expect(screen.queryByText('capacityDevelopment')).not.toBeInTheDocument();

    localStorage.setItem('isc-lang', 'ar');
    cleanup();
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'روافد (STC)' }));
    const inputsAr = lastNumberInputs(8);
    [800000, 1000000, 400000, 500000, 100000, 200000, 150000, 300000].forEach((v, i) =>
      fireEvent.change(inputsAr[i], { target: { value: String(v) } }),
    );

    expect(screen.getByText('الرواتب')).toBeInTheDocument();
    expect(screen.getByText('إهلاك الأصول')).toBeInTheDocument();
    expect(screen.getByText('تطوير القدرات')).toBeInTheDocument();
    expect(screen.queryByText('Salaries')).not.toBeInTheDocument();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   sa-sabic-lc-commitment
══════════════════════════════════════════════════════════════════════════ */

describe('LocalContentICVCheck -- sa-sabic-lc-commitment real click-through', () => {
  it('shows the honesty disclosure before any input, then computes a real breach vs. within-tolerance result', () => {
    renderPage();

    const sabicBtn = screen.getByRole('button', { name: /SABIC Commitment Gate/i });
    fireEvent.click(sabicBtn);
    expect(sabicBtn.getAttribute('aria-pressed')).toBe('true');

    // Rule 8 / Decision Record 8.7: the "not a published SABIC standard"
    // disclosure must be visible before the reader enters anything.
    expect(screen.getByText(/not a published SABIC-wide local-content standard/i)).toBeInTheDocument();

    const inputs = lastNumberInputs(2);
    expect(inputs).toHaveLength(2);

    // Breach: 10pt deviation, tolerance is SABIC_LC_DEVIATION_TOLERANCE_PCT (5pt)
    fireEvent.change(inputs[0], { target: { value: '80' } });
    fireEvent.change(inputs[1], { target: { value: '70' } });
    expect(SABIC_LC_DEVIATION_TOLERANCE_PCT).toBe(5);
    expect(screen.getByText('Breach')).toBeInTheDocument();
    expect(screen.getByText('10.0 pts')).toBeInTheDocument();

    // Within tolerance: 3pt deviation
    fireEvent.change(inputs[1], { target: { value: '77' } });
    expect(screen.getByText('Within tolerance')).toBeInTheDocument();
    expect(screen.queryByText('Breach')).not.toBeInTheDocument();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Cross-feature data safety
══════════════════════════════════════════════════════════════════════════ */

describe('LocalContentICVCheck -- switching SA programs does not wipe another program\'s data', () => {
  it('Rawafed values survive a round trip through a different program', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /stc Rawafed/i }));
    const inputs = lastNumberInputs(8);
    fireEvent.change(inputs[0], { target: { value: '500000' } });

    fireEvent.click(screen.getByRole('button', { name: /LCGPA General Score/i }));
    expect(screen.queryByText('Local: Goods & Services')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /stc Rawafed/i }));
    const inputsAgain = lastNumberInputs(8);
    expect(inputsAgain[0].value).toBe('500000');
  });
});
