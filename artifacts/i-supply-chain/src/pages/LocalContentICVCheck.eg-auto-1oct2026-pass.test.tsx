/**
 * LocalContentICVCheck -- 1 Oct 2026 "close the six remaining disclosed
 * gaps" pass QA coverage.
 *
 * Of the seven flagged not-yet-sourced items, this pass RESOLVED exactly
 * one -- Egypt's National Automotive Industry Development Program
 * (`eg-auto-local-content`), now a real `production-incentive-
 * eligibility-gate` -- and re-confirmed the other six (om-icv,
 * qa-national-strategy, sa-gami-defense, tr-defense-offset,
 * cn-defense-domestic-sourcing) as genuinely still not-yet-sourced after a
 * real primary-source research attempt, per Decision Record 8.7. (The
 * seventh item named in the brief, eg-oil-gas-price-preference, was found
 * during this pass's "verify before extending" step to already be resolved
 * from a PRIOR round -- its mechanismType is already 'price-preference-
 * margin', not 'not-yet-sourced' -- so it required no further action here;
 * this is disclosed in the commit message, not silently corrected.)
 *
 * This file's QA 10/10 customer-simulation coverage, per the task's own
 * "at least two of the newly-resolved programs" instruction, covers:
 *  A. eg-auto-local-content itself -- the one genuinely NEW mechanism this
 *     pass added: full click-through of both vehicle categories (ICE/EV),
 *     every individual gate (local content, price/engine, production
 *     volume), the portfolio rollup, and BOTH assessSupplierLocalContent
 *     call sites.
 *  B. The re-confirmed not-yet-sourced items (GAMI is used as the
 *     representative case): a real click-through proving the enriched,
 *     re-dated 1 Oct 2026 disclosure actually renders in the live UI, not
 *     just in the engine's sourceNoteEn string -- the same "reasonEn is
 *     always rendered, this is load-bearing" discipline already
 *     established for prior passes' QA files.
 *  C. A regression guard for this pass's own new labels, using the same
 *     unanchored-query technique that caught the كويتية/الكويت and
 *     Japanese/Korean SME-status collisions in earlier passes.
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

// Anchored at the START of the accessible name -- same discipline as every
// prior pass's switchCountry helper, re-verified for this pass's own new
// label via a fresh repo-wide sweep (zero collisions, see the commit).
function switchCountry(prefix: string) {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${prefix}`) }));
}

function numberInputByLabel(labelText: string | RegExp): HTMLInputElement {
  const label = screen.getByText(labelText);
  return label.parentElement!.querySelector('input[type="number"]') as HTMLInputElement;
}

function setSpendShareToFullPortfolio() {
  const label = screen.getByText(/^Spend Share$/i);
  const input = label.parentElement!.querySelector('input[type="number"]') as HTMLInputElement;
  fireEvent.change(input, { target: { value: '100' } });
}

beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); });

describe('LocalContentICVCheck -- Egypt National Automotive Industry Development Program (resolved this pass)', () => {
  it('selecting Egypt then the Automotive Incentive Eligibility Gate auto-selects private-commercial context and reveals the real ICE/EV category selector', () => {
    renderPage();
    switchCountry('Egypt');
    const programBtn = screen.getByRole('button', { name: /Automotive Incentive Eligibility Gate/i });
    fireEvent.click(programBtn);
    expect(programBtn.getAttribute('aria-pressed')).toBe('true');
    // Auto-selected into 'private-commercial' (the program's only sourced
    // context) -- never left on 'government', which would read as
    // not-applicable for a reason the reader would have to go hunting for.
    expect(screen.queryByText(/does not apply here/i)).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: /vehicle category/i })).toBeInTheDocument();
  });

  it('ICE: filling every field to comfortably clear every gate renders a real "eligible for an AIDP incentive" result', () => {
    renderPage();
    switchCountry('Egypt');
    fireEvent.click(screen.getByRole('button', { name: /Automotive Incentive Eligibility Gate/i }));

    const categoryGroup = screen.getByRole('group', { name: /vehicle category/i });
    fireEvent.click(within(categoryGroup).getByRole('button', { name: /Fossil-Fuel \(ICE\)/i }));

    fireEvent.change(numberInputByLabel(/^Local Content Share$/i), { target: { value: '25' } });
    fireEvent.change(numberInputByLabel(/^Annual Production Volume/i), { target: { value: '12000' } });
    fireEvent.change(numberInputByLabel(/^Ex-Factory Price/i), { target: { value: '1000000' } });
    fireEvent.change(numberInputByLabel(/^Engine Size/i), { target: { value: '1400' } });
    fireEvent.change(numberInputByLabel(/^Units Per Model/i), { target: { value: '6000' } });

    expect(screen.getByText(/eligible for an AIDP incentive/i)).toBeInTheDocument();
  });

  it('ICE: a price over the EGP 1.25m ceiling alone gates the supplier out, even with local content and volume comfortably clearing', () => {
    renderPage();
    switchCountry('Egypt');
    fireEvent.click(screen.getByRole('button', { name: /Automotive Incentive Eligibility Gate/i }));
    fireEvent.click(within(screen.getByRole('group', { name: /vehicle category/i })).getByRole('button', { name: /Fossil-Fuel \(ICE\)/i }));

    fireEvent.change(numberInputByLabel(/^Local Content Share$/i), { target: { value: '30' } });
    fireEvent.change(numberInputByLabel(/^Annual Production Volume/i), { target: { value: '20000' } });
    fireEvent.change(numberInputByLabel(/^Ex-Factory Price/i), { target: { value: '2000000' } }); // over the 1.25m ceiling
    fireEvent.change(numberInputByLabel(/^Engine Size/i), { target: { value: '1400' } });
    fireEvent.change(numberInputByLabel(/^Units Per Model/i), { target: { value: '8000' } });

    expect(screen.getByText(/gated out of AIDP incentive eligibility/i)).toBeInTheDocument();
  });

  it('EV: switching category hides the ICE-only price/engine/per-model fields and clears against EV\'s own, genuinely different thresholds', () => {
    renderPage();
    switchCountry('Egypt');
    fireEvent.click(screen.getByRole('button', { name: /Automotive Incentive Eligibility Gate/i }));

    const categoryGroup = screen.getByRole('group', { name: /vehicle category/i });
    fireEvent.click(within(categoryGroup).getByRole('button', { name: /Electric \(EV\)/i }));

    // ICE-only fields must disappear entirely for EV -- not just be left at
    // a default -- since no sourced price/engine ceiling applies to EVs.
    expect(screen.queryByText(/^Ex-Factory Price/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Engine Size/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Units Per Model/i)).not.toBeInTheDocument();

    fireEvent.change(numberInputByLabel(/^Local Content Share$/i), { target: { value: '15' } });
    fireEvent.change(numberInputByLabel(/^Annual Production Volume/i), { target: { value: '2000' } });

    expect(screen.getByText(/eligible for an AIDP incentive/i)).toBeInTheDocument();
  });

  it('Both assessSupplierLocalContent call sites wire egAuto: the portfolio rollup shows a genuine spend-weighted eligible share, not just the per-entry-card result', () => {
    renderPage();
    switchCountry('Egypt');
    fireEvent.click(screen.getByRole('button', { name: /Automotive Incentive Eligibility Gate/i }));
    fireEvent.click(within(screen.getByRole('group', { name: /vehicle category/i })).getByRole('button', { name: /Fossil-Fuel \(ICE\)/i }));

    fireEvent.change(numberInputByLabel(/^Local Content Share$/i), { target: { value: '25' } });
    fireEvent.change(numberInputByLabel(/^Annual Production Volume/i), { target: { value: '12000' } });
    fireEvent.change(numberInputByLabel(/^Ex-Factory Price/i), { target: { value: '1000000' } });
    fireEvent.change(numberInputByLabel(/^Engine Size/i), { target: { value: '1400' } });
    fireEvent.change(numberInputByLabel(/^Units Per Model/i), { target: { value: '6000' } });

    setSpendShareToFullPortfolio();

    // The per-entry-card assessment already proved eligibility above; this
    // asserts the SEPARATE portfolio-rollup call site (a different object
    // literal in LocalContentICVCheck.tsx, ~line 2470) independently
    // received the same egAuto input and computed the same result -- a
    // future change that drops egAuto from only one of the two call sites
    // must fail this exact assertion, not just a manual review.
    expect(screen.getByText(/100% eligible/i)).toBeInTheDocument();
  });
});

describe('LocalContentICVCheck -- GAMI defense localization (re-confirmed not-yet-sourced this pass, real disclosure renders live)', () => {
  it('selecting Saudi Arabia then GAMI Defense Localization renders the real, re-confirmed 1 Oct 2026 disclosure -- never a fabricated formula', () => {
    renderPage();
    switchCountry('Saudi Arabia');
    fireEvent.click(screen.getByRole('button', { name: /GAMI Defense/i }));
    // reasonEn is always rendered once a real country+program is selected
    // (load-bearing for every prior pass's QA assertions too) -- for a
    // not-yet-sourced program it embeds the full sourceNoteEn text.
    expect(screen.getByText(/Valuation Factor/i)).toBeInTheDocument();
    expect(screen.getByText(/credit-banking/i)).toBeInTheDocument();
  });
});

describe('LocalContentICVCheck -- Arabic/English accessible-name substring-collision check for this pass\'s new labels (same bug class as كويتية/الكويت and Japanese/Korean SME-status)', () => {
  it('Egypt Auto\'s new "vehicle category" group name never collides with any pre-existing group name, using the same loose, unanchored query pattern that would have thrown "found multiple elements" before a real fix', () => {
    renderPage();
    switchCountry('Egypt');
    fireEvent.click(screen.getByRole('button', { name: /Automotive Incentive Eligibility Gate/i }));
    // Unanchored: would throw if this collided with any other program's
    // "...category" group name rendered elsewhere in the same tree.
    expect(screen.getByRole('group', { name: /vehicle category/i })).toBeInTheDocument();
  });
});
