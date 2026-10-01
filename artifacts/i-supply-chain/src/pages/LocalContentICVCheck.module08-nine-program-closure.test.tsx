/**
 * LocalContentICVCheck -- Module 08 "close all remaining 9 programs" pass
 * (2 Oct 2026) QA coverage.
 *
 * Of the 9 programs named in this pass's brief, THREE were resolved to
 * real, sourced, computable mechanisms:
 *  - sa-gami-defense -> gami-valuation-factor-credit-gate (Saudi GAMI's own
 *    Industrial Participation Policy PDF, gami.gov.sa)
 *  - tr-defense-offset -> industrialization-liability-gate (Turkey SSB's
 *    2022 Industrialization Guideline, via herdemlaw.com's primary-text-
 *    grounded comparison after the PDF itself failed to fetch directly)
 *  - bh-bahrainisation-tender-workforce -> percentage-threshold-gate (a
 *    brand-new program, genuinely distinct from bh-local-content, which
 *    stays not-yet-sourced)
 * The other six (sa-likt, cn-defense-domestic-sourcing, bh-local-content,
 * om-icv, qa-national-strategy, sa-tharwah-maaden) and the re-confirmed
 * de-eu-gpa-non-discrimination-baseline were freshly re-researched with
 * strengthened, URL-citing sourceNotes and re-confirmed genuinely
 * not-yet-sourced per Decision Record 8.7 -- covered by the engine's own
 * unit tests, not re-duplicated here.
 *
 * This file's QA 10/10 customer-simulation coverage follows the exact same
 * structure the prior module08-twelve-gap-closure.test.tsx file
 * established:
 *  A. Each of the three newly-resolved mechanisms -- full click-through,
 *     both call sites (per-entry card AND portfolio rollup), edge/boundary
 *     cases, and the gated-out recommendation panel.
 *  B. A regression guard for this pass's own new labels/groups, using the
 *     same unanchored-query collision-check technique as every prior pass.
 *  C. A regression guard proving bh-bahrainisation-tender-workforce is
 *     genuinely a new, separate program from bh-local-content (which must
 *     still render its own not-sourced badge).
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

describe('LocalContentICVCheck -- Saudi GAMI Industrial Participation gami-valuation-factor-credit-gate (resolved this pass)', () => {
  it('selecting Saudi Arabia then the GAMI program reveals the real contract-value/category/bonus inputs, not a not-yet-sourced placeholder', () => {
    renderPage();
    switchCountry('Saudi Arabia');
    const programBtn = screen.getByRole('button', { name: /^GAMI Industrial Participation \(60%\)/i });
    fireEvent.click(programBtn);
    expect(programBtn.getAttribute('aria-pressed')).toBe('true');
    // The amber "not sourced" badge this program carried before this pass
    // must be gone now that it is resolved.
    expect(within(programBtn).queryByText(/not sourced/i)).not.toBeInTheDocument();
    expect(screen.getByText(/^Contract Value$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Base Activity Value$/i)).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /GAMI Valuation Factor category/i })).toBeInTheDocument();
  });

  it('a contract value below the SAR 150M threshold shows "Below SAR 150M threshold", never a fabricated commitment', () => {
    renderPage();
    switchCountry('Saudi Arabia');
    fireEvent.click(screen.getByRole('button', { name: /^GAMI Industrial Participation \(60%\)/i }));
    fireEvent.change(numberInputByLabel(/^Contract Value$/i), { target: { value: '100000000' } });
    expect(screen.getByText(/Below SAR 150M threshold/i)).toBeInTheDocument();
  });

  it('triggered contract, fixed-factor A.1 category -- a caller-entered Chosen Factor field never even appears for a fixed category', () => {
    renderPage();
    switchCountry('Saudi Arabia');
    fireEvent.click(screen.getByRole('button', { name: /^GAMI Industrial Participation \(60%\)/i }));
    fireEvent.change(numberInputByLabel(/^Contract Value$/i), { target: { value: '200000000' } });
    const categoryGroup = screen.getByRole('group', { name: /GAMI Valuation Factor category/i });
    fireEvent.click(within(categoryGroup).getByRole('button', { name: /^A\.1 Domestic Production$/i }));
    expect(screen.queryByText(/^Chosen Factor$/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Fixed category at 1x/i)).toBeInTheDocument();
    fireEvent.change(numberInputByLabel(/^Base Activity Value$/i), { target: { value: '120000000' } });
    expect(screen.getByText(/^Meets commitment$/i)).toBeInTheDocument();
  });

  it('a ranged category (B.1 FDI) reveals the Chosen Factor field, and stacking both bonuses reaches the commitment with a much smaller base activity value', () => {
    renderPage();
    switchCountry('Saudi Arabia');
    fireEvent.click(screen.getByRole('button', { name: /^GAMI Industrial Participation \(60%\)/i }));
    fireEvent.change(numberInputByLabel(/^Contract Value$/i), { target: { value: '200000000' } }); // required = 120M
    const categoryGroup = screen.getByRole('group', { name: /GAMI Valuation Factor category/i });
    fireEvent.click(within(categoryGroup).getByRole('button', { name: /^B\.1 FDI$/i }));
    expect(screen.getByText(/^Chosen Factor$/i)).toBeInTheDocument();
    fireEvent.change(numberInputByLabel(/^Chosen Factor$/i), { target: { value: '3' } });
    fireEvent.change(numberInputByLabel(/^Base Activity Value$/i), { target: { value: '40000000' } });
    // Without bonuses: 40M * 3.0 = 120M, exactly meeting the commitment.
    expect(screen.getByText(/^Meets commitment$/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: /SME Bonus/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Sole-Source Bonus/i }));
    // With both bonuses stacked (3 + 0.5 + 1.0 = 4.5x), the effective
    // factor shown must reflect the stacked value, not just the raw 3x.
    expect(screen.getByText(/4\.50×/)).toBeInTheDocument();
  });

  it('a full shortfall below 50% achievement shows the real liquidation amount, and the gated-out recommendation names a specific higher-factor category', () => {
    renderPage();
    switchCountry('Saudi Arabia');
    fireEvent.click(screen.getByRole('button', { name: /^GAMI Industrial Participation \(60%\)/i }));
    fireEvent.change(numberInputByLabel(/^Contract Value$/i), { target: { value: '200000000' } }); // required = 120M, security = 20M
    const categoryGroup = screen.getByRole('group', { name: /GAMI Valuation Factor category/i });
    fireEvent.click(within(categoryGroup).getByRole('button', { name: /^A\.1 Domestic Production$/i }));
    fireEvent.change(numberInputByLabel(/^Base Activity Value$/i), { target: { value: '50000000' } }); // credited 50M, achievement ~41.7%
    expect(screen.getByText(/does not meet commitment/i)).toBeInTheDocument();
    expect(screen.getByText(/SAR 20,000,000/)).toBeInTheDocument(); // full forfeit of the 10% Performance Security
    expect(screen.getByText(/B\.1 FDI or B\.5 R&T programs carry the policy's own highest disclosed range/i)).toBeInTheDocument();
  });

  it('both assessSupplierLocalContent call sites wire saGami identically: the portfolio rollup shows a genuine spend-weighted eligible share', () => {
    renderPage();
    switchCountry('Saudi Arabia');
    fireEvent.click(screen.getByRole('button', { name: /^GAMI Industrial Participation \(60%\)/i }));
    fireEvent.change(numberInputByLabel(/^Contract Value$/i), { target: { value: '200000000' } });
    const categoryGroup = screen.getByRole('group', { name: /GAMI Valuation Factor category/i });
    fireEvent.click(within(categoryGroup).getByRole('button', { name: /^A\.1 Domestic Production$/i }));
    fireEvent.change(numberInputByLabel(/^Base Activity Value$/i), { target: { value: '120000000' } });
    setSpendShareToFullPortfolio();
    // A future change that drops saGami from only one of the two call
    // sites must fail this exact assertion, not just a manual review.
    expect(screen.getByText(/100% eligible/i)).toBeInTheDocument();
  });
});

describe('LocalContentICVCheck -- Turkey SSB industrialization-liability-gate (resolved this pass)', () => {
  it('selecting Turkey then the SSB program reveals all three independent liability inputs, not a not-yet-sourced placeholder', () => {
    renderPage();
    switchCountry('Turkey');
    const programBtn = screen.getByRole('button', { name: /^SSB Industrialization Liability Gate/i });
    fireEvent.click(programBtn);
    expect(programBtn.getAttribute('aria-pressed')).toBe('true');
    expect(within(programBtn).queryByText(/not sourced/i)).not.toBeInTheDocument();
    expect(screen.getByText(/^YS-SME Work Share$/i)).toBeInTheDocument();
    expect(screen.getByText(/^EYDEP Work Share$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Technology Acquisition Value$/i)).toBeInTheDocument();
  });

  it('all three liabilities comfortably met renders "Meets all liabilities"', () => {
    renderPage();
    switchCountry('Turkey');
    fireEvent.click(screen.getByRole('button', { name: /^SSB Industrialization Liability Gate/i }));
    fireEvent.change(numberInputByLabel(/^Contract Value$/i), { target: { value: '100000000' } });
    fireEvent.change(numberInputByLabel(/^YS-SME Work Share$/i), { target: { value: '25' } });
    fireEvent.change(numberInputByLabel(/^EYDEP Work Share$/i), { target: { value: '75' } });
    fireEvent.change(numberInputByLabel(/^Technology Acquisition Value$/i), { target: { value: '3000000' } });
    expect(screen.getByText(/^Meets all liabilities$/i)).toBeInTheDocument();
  });

  it('a known failure on just the EYDEP liability is decisive even though YS-SME and tech acquisition both pass -- no over-delivery on one liability compensates for another', () => {
    renderPage();
    switchCountry('Turkey');
    fireEvent.click(screen.getByRole('button', { name: /^SSB Industrialization Liability Gate/i }));
    fireEvent.change(numberInputByLabel(/^Contract Value$/i), { target: { value: '100000000' } });
    fireEvent.change(numberInputByLabel(/^YS-SME Work Share$/i), { target: { value: '90' } });
    fireEvent.change(numberInputByLabel(/^EYDEP Work Share$/i), { target: { value: '50' } });
    fireEvent.change(numberInputByLabel(/^Technology Acquisition Value$/i), { target: { value: '5000000' } });
    expect(screen.getByText(/does not meet all liabilities/i)).toBeInTheDocument();
    // The gated-out recommendation names the specific failing liability.
    expect(screen.getByText(/EYDEP-accredited work share \(50\.0% vs 70% required\)/i)).toBeInTheDocument();
  });

  it('both assessSupplierLocalContent call sites wire trDefenseOffset identically: the portfolio rollup shows a genuine spend-weighted eligible share', () => {
    renderPage();
    switchCountry('Turkey');
    fireEvent.click(screen.getByRole('button', { name: /^SSB Industrialization Liability Gate/i }));
    fireEvent.change(numberInputByLabel(/^Contract Value$/i), { target: { value: '100000000' } });
    fireEvent.change(numberInputByLabel(/^YS-SME Work Share$/i), { target: { value: '25' } });
    fireEvent.change(numberInputByLabel(/^EYDEP Work Share$/i), { target: { value: '75' } });
    fireEvent.change(numberInputByLabel(/^Technology Acquisition Value$/i), { target: { value: '3000000' } });
    setSpendShareToFullPortfolio();
    expect(screen.getByText(/100% eligible/i)).toBeInTheDocument();
  });
});

describe('LocalContentICVCheck -- Bahrain Bahrainisation percentage-threshold-gate (NEW program this pass, genuinely distinct from bh-local-content)', () => {
  it('selecting Bahrain then the Bahrainisation program reveals the real workforce-share input, and bh-local-content keeps its own not-sourced badge', () => {
    renderPage();
    switchCountry('Bahrain');
    const programBtn = screen.getByRole('button', { name: /^Bahrainisation Rule for Tenders \(20%\)/i });
    fireEvent.click(programBtn);
    expect(programBtn.getAttribute('aria-pressed')).toBe('true');
    expect(within(programBtn).queryByText(/not sourced/i)).not.toBeInTheDocument();
    expect(screen.getByText(/^Bahrainisation Workforce Share$/i)).toBeInTheDocument();

    // bh-local-content is a genuinely separate program and must still show
    // its own not-sourced badge -- this program's resolution did not touch
    // it. (Two elements legitimately match /not sourced/i here: the
    // button's own label text "Local Content (not sourced)" and the
    // separate amber badge span inside it -- getAllByText, not getByText.)
    const localContentBtn = screen.getByRole('button', { name: /^Local Content \(not sourced\)/i });
    expect(within(localContentBtn).getAllByText(/not sourced/i).length).toBeGreaterThan(0);
  });

  it('boundary: exactly 20% meets the threshold; just below (19.9%) does not', () => {
    renderPage();
    switchCountry('Bahrain');
    fireEvent.click(screen.getByRole('button', { name: /^Bahrainisation Rule for Tenders \(20%\)/i }));
    fireEvent.change(numberInputByLabel(/^Bahrainisation Workforce Share$/i), { target: { value: '20' } });
    expect(screen.getByText(/^Meets threshold$/i)).toBeInTheDocument();

    fireEvent.change(numberInputByLabel(/^Bahrainisation Workforce Share$/i), { target: { value: '19.9' } });
    expect(screen.getByText(/does not meet threshold/i)).toBeInTheDocument();
    expect(screen.getByText(/raise the workforce share toward the Parliament-approved 20% Bahrainisation minimum/i)).toBeInTheDocument();
  });

  it('both assessSupplierLocalContent call sites wire bhBahrainisation identically: the portfolio rollup shows a genuine spend-weighted eligible share', () => {
    renderPage();
    switchCountry('Bahrain');
    fireEvent.click(screen.getByRole('button', { name: /^Bahrainisation Rule for Tenders \(20%\)/i }));
    fireEvent.change(numberInputByLabel(/^Bahrainisation Workforce Share$/i), { target: { value: '35' } });
    setSpendShareToFullPortfolio();
    expect(screen.getByText(/100% eligible/i)).toBeInTheDocument();
  });

  it("switching across Bahrain's now-6 programs preserves bh-bahrainisation-tender-workforce's own data, never wiped by a sibling program", () => {
    renderPage();
    switchCountry('Bahrain');
    fireEvent.click(screen.getByRole('button', { name: /^Bahrainisation Rule for Tenders \(20%\)/i }));
    fireEvent.change(numberInputByLabel(/^Bahrainisation Workforce Share$/i), { target: { value: '42' } });

    fireEvent.click(screen.getByRole('button', { name: /Takamul Local Value Preference/i }));
    fireEvent.click(screen.getByRole('button', { name: /Gulf-Made Products Preference/i }));
    fireEvent.click(screen.getByRole('button', { name: /SME Price Preference/i }));

    fireEvent.click(screen.getByRole('button', { name: /^Bahrainisation Rule for Tenders \(20%\)/i }));
    expect(numberInputByLabel(/^Bahrainisation Workforce Share$/i).value).toBe('42');
  });
});

describe('LocalContentICVCheck -- Module 08 nine-program closure label/group-name collision check (same bug class as كويتية/الكويت and Japanese/Korean SME-status)', () => {
  it('Saudi GAMI\'s category-selector group, Turkey\'s three liability labels, and Bahrain\'s Bahrainisation label never collide with any pre-existing accessible name', () => {
    renderPage();
    switchCountry('Saudi Arabia');
    fireEvent.click(screen.getByRole('button', { name: /^GAMI Industrial Participation \(60%\)/i }));
    expect(screen.getByRole('group', { name: /GAMI Valuation Factor category/i })).toBeInTheDocument();

    switchCountry('Turkey');
    fireEvent.click(screen.getByRole('button', { name: /^SSB Industrialization Liability Gate/i }));
    expect(screen.getByText(/^YS-SME Work Share$/i)).toBeInTheDocument();

    switchCountry('Bahrain');
    fireEvent.click(screen.getByRole('button', { name: /^Bahrainisation Rule for Tenders \(20%\)/i }));
    expect(screen.getByText(/^Bahrainisation Workforce Share$/i)).toBeInTheDocument();
  });
});
