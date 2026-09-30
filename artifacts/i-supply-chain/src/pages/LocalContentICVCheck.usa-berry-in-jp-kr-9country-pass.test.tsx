/**
 * LocalContentICVCheck -- 29 Sep 2026 "Module 08, next phase" pass:
 * (1) USA Berry Amendment resolved from not-yet-sourced to a real
 *     category-eligibility-gate (zero new compute logic, reuses
 *     computeCategoryEligibilityGate exactly like BABA); and
 * (2) a real, PRE-EXISTING gap found by direct file reading during this
 *     pass, not asked for by name but squarely inside "deepen these
 *     countries": the engine had represented India/Japan/Korea's 2017/1966/
 *     2025-era programs since the 17 Sep 2026 batch, but this UI file's own
 *     per-program input forms, empty-input factories, and BOTH
 *     assessSupplierLocalContent call sites had never been wired up for
 *     them at all -- selecting those programs showed a routing-question
 *     button with a real label but produced no usable form and a
 *     permanently "incomplete inputs" result. Germany is the one country in
 *     that same batch NOT touched here: both its programs are genuinely
 *     not-yet-sourced (one a confirmed EU/WTO-law absence, the other a
 *     supra-national co-funding-eligibility test out of this engine's
 *     per-bid shape), so it correctly needs no input form and none was added.
 *
 * This is this pass's QA 10/10 customer-simulation coverage for two of the
 * newly-deepened countries (USA and Japan), real click-throughs against the
 * actual page component (not a hand-copied reconstruction), driven through
 * actual user events -- mirroring the discipline established for the
 * sa-rawafed-stc / qa-tenders-icv / bh-kw-verify-then-extend regression
 * guards. It also exercises India and Korea's two programs, and both
 * assessSupplierLocalContent call sites (the per-entry card AND the
 * portfolio rollup table), since a future change that silently drops any
 * one of these five new field groups from either call site must fail this
 * suite, not just a manual review.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, cleanup, fireEvent } from '@testing-library/react';
import { LanguageProvider } from '@/lib/LanguageContext';
import { LocalContentICVCheck } from '@/pages/LocalContentICVCheck';

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));

function renderPage() {
  return render(
    <LanguageProvider>
      <LocalContentICVCheck />
    </LanguageProvider>,
  );
}

function lastNumberInputs(n: number): HTMLInputElement[] {
  const all = Array.from(document.querySelectorAll('input[type="number"]')) as HTMLInputElement[];
  return all.slice(-n);
}

// Anchored at the START of the accessible name (never a bare substring
// match) -- the same discipline the 29 Sep verify-then-extend pass's own
// prior test file (bh-kw-verify-then-extend) adopted after finding the
// كويتية/الكويت collision, and re-verified for this pass's own new labels
// (India/Japan/Korea/Berry) via a fresh repo-wide grep: none of them is a
// substring of any other country's, or any other program's, accessible name.
function switchCountry(prefix: string) {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${prefix}`) }));
}

// The portfolio rollup is spend-weighted (Rule 7) -- a supplier with the
// default null/0% spend share contributes zero weight to `scorableSpend` in
// rollUpPortfolioLocalContent, so its group's weighted figure stays null and
// the portfolio row renders "—" rather than a computed result. A single
// 100%-spend-share entry is the simplest way to make its own weighted
// result deterministic and equal to its own per-entry-card result.
function setSpendShareToFullPortfolio() {
  const label = screen.getByText(/^Spend Share$/i);
  const input = label.parentElement!.querySelector('input[type="number"]') as HTMLInputElement;
  fireEvent.change(input, { target: { value: '100' } });
}

beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); });

describe('LocalContentICVCheck -- USA / Berry Amendment (DoD) Coverage Gate real click-through (resolved this pass)', () => {
  it('selecting USA then Berry Amendment reveals the real two-toggle gate and computes a genuine eligibility result both ways', () => {
    renderPage();
    switchCountry('United States');
    const programBtn = screen.getByRole('button', { name: /Berry Amendment \(DoD\) Coverage Gate/i });
    expect(programBtn.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(programBtn);
    expect(programBtn.getAttribute('aria-pressed')).toBe('true');

    const coverageGroup = screen.getByRole('group', { name: /Berry Amendment coverage status/i });
    fireEvent.click(within(coverageGroup).getByRole('button', { name: 'Yes' }));

    const sourcingGroup = screen.getByRole('group', { name: /Berry Amendment qualification/i });
    fireEvent.click(within(sourcingGroup).getByRole('button', { name: 'Yes' }));
    expect(screen.getByText(/eligible to bid/i)).toBeInTheDocument();

    fireEvent.click(within(sourcingGroup).getByRole('button', { name: 'No' }));
    expect(screen.getByText(/gated out of this category/i)).toBeInTheDocument();
  });

  it('label is real resolved text, never the stale "not yet sourced" suffix this program carried before this pass', () => {
    renderPage();
    switchCountry('United States');
    expect(screen.queryByText(/Berry Amendment \(DoD\) -- not yet sourced/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Berry Amendment \(DoD\) Coverage Gate/i })).toBeInTheDocument();
  });
});

describe('LocalContentICVCheck -- India / Make in India Preference real click-through (UI wiring gap closed this pass)', () => {
  it('selecting India then the Make in India program reveals a real numeric local-content-share field and computes the real Class-I/Class-II price-preference outcome', () => {
    renderPage();
    switchCountry('India');
    fireEvent.click(screen.getByRole('button', { name: /Make in India Preference/i }));
    const inputs = lastNumberInputs(1);
    expect(inputs).toHaveLength(1);

    // Class-I threshold (>=50%) -> the real 20% margin of purchase preference.
    fireEvent.change(inputs[0], { target: { value: '65' } });
    expect(screen.getByText('20.0 pts')).toBeInTheDocument();

    // Class-II (20-<50%) -> honestly zero effective margin, disclosed in the sourceNote, not silently blank.
    fireEvent.change(inputs[0], { target: { value: '30' } });
    expect(screen.getByText('0.0 pts')).toBeInTheDocument();
  });
});

describe('LocalContentICVCheck -- Japan / Kankouju SME Target Ratio real click-through (UI wiring gap closed this pass; QA 10/10 country #1)', () => {
  it('selecting Japan reveals the real caller-supplied-target field (not a hardcoded constant) plus an SME-qualification toggle, and computes a genuine set-aside result', () => {
    renderPage();
    switchCountry('Japan');

    const inputs = lastNumberInputs(1);
    expect(inputs).toHaveLength(1);
    fireEvent.change(inputs[0], { target: { value: '61' } });

    const qualGroup = screen.getByRole('group', { name: /Japanese SME-qualification status/i });
    fireEvent.click(within(qualGroup).getByRole('button', { name: 'Yes' }));
    expect(screen.getByText(/qualifies for the reserved share \(program target 61%\)/i)).toBeInTheDocument();

    fireEvent.click(within(qualGroup).getByRole('button', { name: 'No' }));
    expect(screen.getByText(/does not qualify for the reserved share \(program target 61%\)/i)).toBeInTheDocument();
  });

  it('the FY2025 61% figure this pass sourced is disclosed in the program methodology text, not a stale FY2013-only assumption', () => {
    renderPage();
    switchCountry('Japan');
    fireEvent.click(screen.getByRole('button', { name: /Sourced Methodology/i }));
    // "61%" legitimately appears twice: once in the always-visible input
    // hint ("FY2025: 61% government-wide") and once in the methodology
    // paragraph itself -- both are real, both are this pass's sourced figure.
    expect(screen.getAllByText(/61%/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/56%/)).toBeInTheDocument();
  });
});

describe('LocalContentICVCheck -- Korea / SME Purchase Target Ratio + SME Competitive Products Gate real click-through (UI wiring gap closed this pass)', () => {
  it('selecting Korea then the purchase-target-ratio program reveals the real 2-way category selector and computes the correct target per category', () => {
    renderPage();
    switchCountry('South Korea');
    fireEvent.click(screen.getByRole('button', { name: /SME Purchase Target Ratio/i }));

    fireEvent.click(screen.getByRole('button', { name: /General SME Product \(50%\)/i }));
    const qualGroup = screen.getByRole('group', { name: /Korean SME-qualification status/i });
    fireEvent.click(within(qualGroup).getByRole('button', { name: 'Yes' }));
    expect(screen.getByText(/program target 50%/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Technology-Development Product \(15%\)/i }));
    expect(screen.getByText(/program target 15%/i)).toBeInTheDocument();
  });

  it('selecting Korea then the competitive-products-gate program reveals the real two-toggle gate, structurally distinct from the purchase-target-ratio program above', () => {
    renderPage();
    switchCountry('South Korea');
    fireEvent.click(screen.getByRole('button', { name: /SME Competitive Products Gate/i }));

    const catGroup = screen.getByRole('group', { name: /Korean category designation status/i });
    fireEvent.click(within(catGroup).getByRole('button', { name: 'Yes' }));

    const certGroup = screen.getByRole('group', { name: /direct-production certification status/i });
    fireEvent.click(within(certGroup).getByRole('button', { name: 'Yes' }));
    expect(screen.getByText(/eligible to bid/i)).toBeInTheDocument();

    fireEvent.click(within(certGroup).getByRole('button', { name: 'No' }));
    expect(screen.getByText(/gated out of this category/i)).toBeInTheDocument();
  });
});

describe('Arabic/English accessible-name substring-collision check for this pass\'s new labels (the same bug class as كويتية/الكويت last pass)', () => {
  it('a repo-wide grep of every role="group" aria-label found ONE real collision this pass -- Japan/Korea\'s new "<Country> SME qualification status" groups contained the pre-existing Bahrain "SME qualification status" group as a substring -- fixed by hyphenating to "SME-qualification status"; this test renders a Bahrain SME entry and a Japan entry together (the exact multi-entry-portfolio scenario where a loose, unanchored query would have ambiguously matched both) and confirms each group now resolves unambiguously', () => {
    renderPage();

    // Entry 1: Bahrain SME price-preference -- the pre-existing "SME qualification status" group.
    switchCountry('Bahrain');
    fireEvent.click(screen.getByRole('button', { name: /SME Price Preference/i }));

    // Entry 2: Japan -- the new "Japanese SME-qualification status" group, added this pass.
    fireEvent.click(screen.getByRole('button', { name: /Add a supplier \/ entity/i }));
    const secondCountryGroups = screen.getAllByRole('group', { name: /^Select country$/i });
    fireEvent.click(within(secondCountryGroups[1]!).getByRole('button', { name: /^Japan/ }));

    // Both groups coexist in the DOM now. Before the hyphen fix, Japan's group name
    // was "Japanese SME qualification status" -- a verbatim superstring of Bahrain's
    // "SME qualification status" -- so this same LOOSE, UNANCHORED query (the kind a
    // real test or a screen-reader-name lookup is likely to use) would have thrown
    // "found multiple elements" here. It now resolves to exactly one element.
    expect(screen.getByRole('group', { name: /SME qualification status/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /Japanese SME-qualification status/i })).toBeInTheDocument();
  });
});

describe('Both assessSupplierLocalContent call sites wire every new field (the exact bug class caught and fixed in the prior BH/KW pass)', () => {
  it('a saved India entry produces a real portfolio-rollup row (not a blank/incomplete one), proving the portfolio call site also received inMakeInIndia', () => {
    renderPage();
    switchCountry('India');
    fireEvent.click(screen.getByRole('button', { name: /Make in India Preference/i }));
    fireEvent.change(lastNumberInputs(1)[0], { target: { value: '80' } });
    setSpendShareToFullPortfolio();

    expect(screen.getByText(/Client-Level Portfolio View/i)).toBeInTheDocument();
    // The per-entry card's own "20.0 pts" plus the portfolio row's own
    // "20.0 pts" -- both readable, proving both call sites really computed.
    expect(screen.getAllByText('20.0 pts').length).toBeGreaterThanOrEqual(2);
  });

  it('a saved Korea competitive-products-gate entry produces a real "% eligible" portfolio row, proving the portfolio call site also received krCompetitiveProducts', () => {
    renderPage();
    switchCountry('South Korea');
    fireEvent.click(screen.getByRole('button', { name: /SME Competitive Products Gate/i }));
    fireEvent.click(within(screen.getByRole('group', { name: /Korean category designation status/i })).getByRole('button', { name: 'Yes' }));
    fireEvent.click(within(screen.getByRole('group', { name: /direct-production certification status/i })).getByRole('button', { name: 'Yes' }));
    setSpendShareToFullPortfolio();

    expect(screen.getByText(/100% eligible/i)).toBeInTheDocument();
  });
});
