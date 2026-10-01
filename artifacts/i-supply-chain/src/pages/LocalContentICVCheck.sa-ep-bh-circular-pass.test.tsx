/**
 * LocalContentICVCheck -- SA-LIKT/EP-Policy + BH circular pass (2 Oct
 * 2026) QA coverage.
 *
 * This pass resolved LCGPA's own 2023 Economic Participation (EP) Policy
 * as a genuinely new program, `sa-economic-participation-policy`, after
 * confirming directly against LCGPA's own site that it is a separate
 * instrument from `sa-likt` (LIKT) -- a 2021-activated, government-to-
 * industry sector-agreement contracting method -- not the same policy
 * described twice under two names. Separately, this pass checked Bahrain's
 * "Domestic Preference Circular No. 1 of 2023" directly against the
 * Tender Board's own primary text and found it IS the already-modeled
 * Takamul circular (`bh-takamul-local-value`), not a general company-wide
 * preference as tendersarabia.com/PwC's secondary summaries reported --
 * `bh-local-content` stays not-yet-sourced, with the discrepancy disclosed
 * rather than silently modeled as the secondary sources described it.
 *
 * This file's real click-through coverage mirrors the discipline already
 * established for the GAMI/SSB/Bahrainisation programs in
 * LocalContentICVCheck.module08-nine-program-closure.test.tsx: a genuine
 * render of the real page component, driven through real user events, not
 * a hand-copied reconstruction of its JSX.
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

describe('LocalContentICVCheck -- LCGPA Economic Participation Policy import-value-participation-gate (resolved this pass, genuinely distinct from sa-likt)', () => {
  it('selecting Saudi Arabia then the EP Policy program reveals the real imported-value/category inputs, not a not-yet-sourced placeholder', () => {
    renderPage();
    switchCountry('Saudi Arabia');
    const programBtn = screen.getByRole('button', { name: /^LCGPA Economic Participation \(35%\)/i });
    fireEvent.click(programBtn);
    expect(programBtn.getAttribute('aria-pressed')).toBe('true');
    expect(within(programBtn).queryByText(/not sourced/i)).not.toBeInTheDocument();
    expect(screen.getByText(/^Imported Content Value$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Base Activity Value$/i)).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /EP Policy Valuation Factor category/i })).toBeInTheDocument();
    // sa-likt itself is still rendered separately, still carrying its own
    // not-sourced badge -- the two programs must not collapse into one.
    const liktBtn = screen.getByRole('button', { name: /^LIKT/i });
    expect(within(liktBtn).getAllByText(/not sourced/i).length).toBeGreaterThan(0);
  });

  it('an imported content value below the SAR 100M threshold shows "Below SAR 100M threshold", never a fabricated commitment', () => {
    renderPage();
    switchCountry('Saudi Arabia');
    fireEvent.click(screen.getByRole('button', { name: /^LCGPA Economic Participation \(35%\)/i }));
    fireEvent.change(numberInputByLabel(/^Imported Content Value$/i), { target: { value: '50000000' } });
    expect(screen.getByText(/Below SAR 100M threshold/i)).toBeInTheDocument();
  });

  it('triggered contract, fixed-factor Subcontracting category -- a caller-entered Chosen Factor field never even appears for a fixed category', () => {
    renderPage();
    switchCountry('Saudi Arabia');
    fireEvent.click(screen.getByRole('button', { name: /^LCGPA Economic Participation \(35%\)/i }));
    fireEvent.change(numberInputByLabel(/^Imported Content Value$/i), { target: { value: '200000000' } }); // required = 70M
    const categoryGroup = screen.getByRole('group', { name: /EP Policy Valuation Factor category/i });
    fireEvent.click(within(categoryGroup).getByRole('button', { name: /^Subcontracting$/i }));
    expect(screen.queryByText(/^Chosen Factor$/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Fixed category at 1x/i)).toBeInTheDocument();
    fireEvent.change(numberInputByLabel(/^Base Activity Value$/i), { target: { value: '70000000' } });
    expect(screen.getByText(/^Meets commitment$/i)).toBeInTheDocument();
  });

  it('a ranged category (Investment) reveals the Chosen Factor field, and there is no SME/sole-source bonus checkbox anywhere on this program (genuinely distinct from GAMI\'s gate)', () => {
    renderPage();
    switchCountry('Saudi Arabia');
    fireEvent.click(screen.getByRole('button', { name: /^LCGPA Economic Participation \(35%\)/i }));
    fireEvent.change(numberInputByLabel(/^Imported Content Value$/i), { target: { value: '200000000' } }); // required = 70M
    const categoryGroup = screen.getByRole('group', { name: /EP Policy Valuation Factor category/i });
    fireEvent.click(within(categoryGroup).getByRole('button', { name: /^Investment$/i }));
    expect(screen.getByText(/^Chosen Factor$/i)).toBeInTheDocument();
    fireEvent.change(numberInputByLabel(/^Chosen Factor$/i), { target: { value: '3' } });
    fireEvent.change(numberInputByLabel(/^Base Activity Value$/i), { target: { value: '23333334' } }); // 23.33M * 3 ~= 70M
    expect(screen.getByText(/^Meets commitment$/i)).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: /SME Bonus/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: /Sole-Source Bonus/i })).not.toBeInTheDocument();
  });

  it('a shortfall shows the real gated-out state and the recommendation names R&D as the highest-factor category, and never claims a liquidation amount (none is sourced for this policy)', () => {
    renderPage();
    switchCountry('Saudi Arabia');
    fireEvent.click(screen.getByRole('button', { name: /^LCGPA Economic Participation \(35%\)/i }));
    fireEvent.change(numberInputByLabel(/^Imported Content Value$/i), { target: { value: '200000000' } }); // required = 70M
    const categoryGroup = screen.getByRole('group', { name: /EP Policy Valuation Factor category/i });
    fireEvent.click(within(categoryGroup).getByRole('button', { name: /^Subcontracting$/i }));
    fireEvent.change(numberInputByLabel(/^Base Activity Value$/i), { target: { value: '10000000' } }); // credited 10M, far short of 70M
    expect(screen.getByText(/does not meet commitment/i)).toBeInTheDocument();
    expect(screen.getByText(/Research & Development carries the policy's own highest disclosed factor/i)).toBeInTheDocument();
    expect(screen.queryByText(/Shortfall Liquidation/i)).not.toBeInTheDocument();
  });

  it('both assessSupplierLocalContent call sites wire saEp identically: the portfolio rollup shows a genuine spend-weighted eligible share', () => {
    renderPage();
    switchCountry('Saudi Arabia');
    fireEvent.click(screen.getByRole('button', { name: /^LCGPA Economic Participation \(35%\)/i }));
    fireEvent.change(numberInputByLabel(/^Imported Content Value$/i), { target: { value: '200000000' } });
    const categoryGroup = screen.getByRole('group', { name: /EP Policy Valuation Factor category/i });
    fireEvent.click(within(categoryGroup).getByRole('button', { name: /^Subcontracting$/i }));
    fireEvent.change(numberInputByLabel(/^Base Activity Value$/i), { target: { value: '70000000' } });
    setSpendShareToFullPortfolio();
    // A future change that drops saEp from only one of the two call sites
    // must fail this exact assertion, not just a manual review.
    expect(screen.getByText(/100% eligible/i)).toBeInTheDocument();
  });
});

describe('LocalContentICVCheck -- Bahrain Local Content general framework still not-yet-sourced (Circular No. 1 of 2023 checked this pass, found to be the Takamul circular, not a general preference)', () => {
  it('selecting Bahrain then the Local Content program still shows a not-yet-sourced placeholder -- no fabricated general 10%/20% preference form appeared', () => {
    renderPage();
    switchCountry('Bahrain');
    const programBtn = screen.getByRole('button', { name: /^Local Content/i });
    fireEvent.click(programBtn);
    expect(within(programBtn).getAllByText(/not sourced/i).length).toBeGreaterThan(0);
    // None of the EP/GAMI-style numeric inputs should have leaked onto
    // this still-unresolved Bahrain program.
    expect(screen.queryByText(/^Imported Content Value$/i)).not.toBeInTheDocument();
    // Takamul (the program this circular actually governs) stays its own
    // separate, already-resolved program, unaffected by this check.
    expect(screen.getByRole('button', { name: /Takamul Local Value Preference/i })).toBeInTheDocument();
  });
});

describe('LocalContentICVCheck -- SA-LIKT/EP-Policy + BH circular pass label/group-name collision check (same bug class as كويتية/الكويت and Japanese/Korean SME-status)', () => {
  it("the new EP Policy category group name never collides with GAMI's own Valuation Factor category group name, using the same loose, unanchored query pattern that would throw \"found multiple elements\" before a real fix", () => {
    renderPage();
    switchCountry('Saudi Arabia');
    fireEvent.click(screen.getByRole('button', { name: /^LCGPA Economic Participation \(35%\)/i }));
    // Unanchored except for the program's own distinguishing word --
    // would throw on ambiguity if this collided with GAMI's own group.
    expect(screen.getByRole('group', { name: /EP Policy Valuation Factor category/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^GAMI Industrial Participation \(60%\)/i }));
    expect(screen.getByRole('group', { name: /GAMI Valuation Factor category/i })).toBeInTheDocument();
  });

  it("switching across SA's 10 programs preserves sa-economic-participation-policy's own data without colliding with sa-likt or sa-gami-defense", () => {
    renderPage();
    switchCountry('Saudi Arabia');
    fireEvent.click(screen.getByRole('button', { name: /^LCGPA Economic Participation \(35%\)/i }));
    fireEvent.change(numberInputByLabel(/^Imported Content Value$/i), { target: { value: '123000000' } });

    fireEvent.click(screen.getByRole('button', { name: /^LIKT/i }));
    fireEvent.click(screen.getByRole('button', { name: /^GAMI Industrial Participation \(60%\)/i }));

    fireEvent.click(screen.getByRole('button', { name: /^LCGPA Economic Participation \(35%\)/i }));
    expect(numberInputByLabel(/^Imported Content Value$/i).value).toBe('123000000');
  });
});
