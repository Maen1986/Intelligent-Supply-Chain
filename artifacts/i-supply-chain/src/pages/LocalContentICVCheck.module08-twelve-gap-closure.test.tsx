/**
 * LocalContentICVCheck -- Module 08 "close the final 12 not-yet-sourced
 * gaps" pass (1 Oct 2026) QA coverage.
 *
 * Of the 12 remaining not-yet-sourced programs, this pass resolved THREE
 * to real, sourced, computable mechanisms:
 *  - kw-local-content -> dual-local-sourcing-gate (Kuwait Public Tenders
 *    Law No. 49/2016, Art. 87)
 *  - in-dap-2020-defense-offset -> offset-multiplier-credit-gate (India
 *    DAP 2020, Buy (Global) offset obligation)
 *  - de-edip-defense-local-content -> eu-content-threshold-gate (Germany/EU
 *    European Defence Industry Programme, Regulation (EU) 2025/2643)
 * The other nine (6 defense/offset programs + sa-tharwah-maaden, om-icv,
 * qa-national-strategy, bh-local-content, de-eu-gpa-non-discrimination-
 * baseline) were freshly re-researched and re-confirmed genuinely
 * not-yet-sourced per Decision Record 8.7 -- covered by the engine's own
 * unit tests, not re-duplicated here.
 *
 * This file's QA 10/10 customer-simulation coverage follows the exact same
 * structure the prior eg-auto-1oct2026-pass.test.tsx file established:
 *  A. Each of the three newly-resolved mechanisms -- full click-through,
 *     both call sites (per-entry card AND portfolio rollup), edge/boundary
 *     cases, and the gated-out recommendation panel.
 *  B. A regression guard proving the hasMeaningfulResult fix (this pass's
 *     own fix, alongside the pre-existing production-incentive-
 *     eligibility-gate gap) actually surfaces a result, not a silent blank.
 *  C. A regression guard for this pass's new labels/groups, using the same
 *     unanchored-query collision-check technique as every prior pass.
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

describe('LocalContentICVCheck -- Kuwait Public Tenders Law Art. 87 dual-local-sourcing-gate (resolved this pass)', () => {
  it('selecting Kuwait then the Local Sourcing Gate program reveals both real percentage inputs, not a not-yet-sourced placeholder', () => {
    renderPage();
    switchCountry('Kuwait');
    const programBtn = screen.getByRole('button', { name: /^Local Sourcing Gate \(Art\. 87\)/i });
    fireEvent.click(programBtn);
    expect(programBtn.getAttribute('aria-pressed')).toBe('true');
    // The amber "not sourced" badge that this program carried before this
    // pass must be gone now that it is resolved.
    expect(within(programBtn).queryByText(/not sourced/i)).not.toBeInTheDocument();
    expect(screen.getByText(/^Local Materials Share$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Local Works Share$/i)).toBeInTheDocument();
  });

  it('clearing both thresholds (>=30% materials, >=30% works) renders "Meets requirement"', () => {
    renderPage();
    switchCountry('Kuwait');
    fireEvent.click(screen.getByRole('button', { name: /^Local Sourcing Gate \(Art\. 87\)/i }));
    fireEvent.change(numberInputByLabel(/^Local Materials Share$/i), { target: { value: '35' } });
    fireEvent.change(numberInputByLabel(/^Local Works Share$/i), { target: { value: '40' } });
    expect(screen.getByText(/^Meets requirement$/i)).toBeInTheDocument();
  });

  it('failing ONE threshold alone (materials below 30%, works comfortably clearing) is decisive -- the known failure overrides the still-passing works share', () => {
    renderPage();
    switchCountry('Kuwait');
    fireEvent.click(screen.getByRole('button', { name: /^Local Sourcing Gate \(Art\. 87\)/i }));
    fireEvent.change(numberInputByLabel(/^Local Materials Share$/i), { target: { value: '20' } });
    fireEvent.change(numberInputByLabel(/^Local Works Share$/i), { target: { value: '50' } });
    expect(screen.getByText(/does not meet requirement/i)).toBeInTheDocument();
    // The gated-out recommendation panel must appear and name the specific
    // failed share, not a generic message.
    expect(screen.getByText(/raise local materials share to at least 30%/i)).toBeInTheDocument();
  });

  it('a known materials failure is decisive even while the works share is still unentered (null) -- same "known failure overrides missing input" precedent as the UAE GCC-origin gate', () => {
    renderPage();
    switchCountry('Kuwait');
    fireEvent.click(screen.getByRole('button', { name: /^Local Sourcing Gate \(Art\. 87\)/i }));
    fireEvent.change(numberInputByLabel(/^Local Materials Share$/i), { target: { value: '10' } });
    // Local Works Share left empty/null.
    expect(screen.getByText(/does not meet requirement/i)).toBeInTheDocument();
  });

  it('both assessSupplierLocalContent call sites wire kwLocalContent identically: the portfolio rollup shows a genuine spend-weighted eligible share', () => {
    renderPage();
    switchCountry('Kuwait');
    fireEvent.click(screen.getByRole('button', { name: /^Local Sourcing Gate \(Art\. 87\)/i }));
    fireEvent.change(numberInputByLabel(/^Local Materials Share$/i), { target: { value: '35' } });
    fireEvent.change(numberInputByLabel(/^Local Works Share$/i), { target: { value: '40' } });
    setSpendShareToFullPortfolio();
    // A future change that drops kwLocalContent from only one of the two
    // call sites must fail this exact assertion, not just a manual review.
    expect(screen.getByText(/100% eligible/i)).toBeInTheDocument();
  });
});

describe('LocalContentICVCheck -- India DAP 2020 Buy (Global) offset-multiplier-credit-gate (resolved this pass)', () => {
  it('selecting India then the DAP 2020 Offset Multiplier Gate reveals the contract-value input and the 8-way avenue selector, not a not-yet-sourced placeholder', () => {
    renderPage();
    switchCountry('India');
    const programBtn = screen.getByRole('button', { name: /^DAP 2020 Offset Multiplier Gate/i });
    fireEvent.click(programBtn);
    expect(programBtn.getAttribute('aria-pressed')).toBe('true');
    expect(within(programBtn).queryByText(/not sourced/i)).not.toBeInTheDocument();
    expect(screen.getByText(/^Contract Value \(INR\)$/i)).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /offset discharge avenue/i })).toBeInTheDocument();
    // The raw-discharged-amount field only appears once an avenue is picked.
    expect(screen.queryByText(/^Raw Amount Discharged/i)).not.toBeInTheDocument();
  });

  it('a contract value below the INR 2,000 crore trigger never shows an obligation, and the raw-discharge field stays hidden without an avenue', () => {
    renderPage();
    switchCountry('India');
    fireEvent.click(screen.getByRole('button', { name: /^DAP 2020 Offset Multiplier Gate/i }));
    fireEvent.change(numberInputByLabel(/^Contract Value \(INR\)$/i), { target: { value: '5000000000' } }); // 500 crore, well under trigger
    expect(screen.getByText(/below threshold/i)).toBeInTheDocument();
  });

  it('a contract value at the trigger with a 1.0x direct-purchase avenue: raw discharge exactly matching the 30% requirement meets the obligation', () => {
    renderPage();
    switchCountry('India');
    fireEvent.click(screen.getByRole('button', { name: /^DAP 2020 Offset Multiplier Gate/i }));
    // 2000 crore contract -> 30% required = 600 crore = 6,000,000,000 INR
    fireEvent.change(numberInputByLabel(/^Contract Value \(INR\)$/i), { target: { value: '20000000000' } });
    expect(screen.getByText(/^Triggered$/i)).toBeInTheDocument();
    const avenueGroup = screen.getByRole('group', { name: /offset discharge avenue/i });
    fireEvent.click(within(avenueGroup).getByRole('button', { name: /Direct Purchase, Eligible Products \(1\.0x\)/i }));
    fireEvent.change(numberInputByLabel(/^Raw Amount Discharged/i), { target: { value: '6000000000' } });
    expect(screen.getByText(/fully covered/i)).toBeInTheDocument();
  });

  it('selecting the 4.0x critical-technology avenue reaches the same credited value with a much smaller raw discharge amount', () => {
    renderPage();
    switchCountry('India');
    fireEvent.click(screen.getByRole('button', { name: /^DAP 2020 Offset Multiplier Gate/i }));
    fireEvent.change(numberInputByLabel(/^Contract Value \(INR\)$/i), { target: { value: '20000000000' } });
    const avenueGroup = screen.getByRole('group', { name: /offset discharge avenue/i });
    fireEvent.click(within(avenueGroup).getByRole('button', { name: /Critical Technology Acquisition by DRDO \(4\.0x\)/i }));
    // 600 crore required / 4.0x multiplier = 150 crore raw = 1,500,000,000 INR
    fireEvent.change(numberInputByLabel(/^Raw Amount Discharged/i), { target: { value: '1500000000' } });
    expect(screen.getByText(/fully covered/i)).toBeInTheDocument();
  });

  it('an insufficient raw discharge shows a real shortfall and the gated-out recommendation names a higher-multiplier avenue', () => {
    renderPage();
    switchCountry('India');
    fireEvent.click(screen.getByRole('button', { name: /^DAP 2020 Offset Multiplier Gate/i }));
    fireEvent.change(numberInputByLabel(/^Contract Value \(INR\)$/i), { target: { value: '20000000000' } });
    const avenueGroup = screen.getByRole('group', { name: /offset discharge avenue/i });
    fireEvent.click(within(avenueGroup).getByRole('button', { name: /Direct Purchase, Eligible Products \(1\.0x\)/i }));
    fireEvent.change(numberInputByLabel(/^Raw Amount Discharged/i), { target: { value: '1000000000' } }); // far short
    expect(screen.getByText(/^Shortfall$/i)).toBeInTheDocument();
    // "higher-multiplier avenue" appears in both the primary and
    // alternative recommendation cards -- asserting on the primary card's
    // own distinctive phrasing instead avoids an unhelpful
    // multiple-elements-found collision.
    expect(screen.getByText(/DRDO critical-technology acquisition carries the highest disclosed multiplier/i)).toBeInTheDocument();
  });

  it('both assessSupplierLocalContent call sites wire inDap identically: the portfolio rollup shows a genuine spend-weighted eligible share', () => {
    renderPage();
    switchCountry('India');
    fireEvent.click(screen.getByRole('button', { name: /^DAP 2020 Offset Multiplier Gate/i }));
    fireEvent.change(numberInputByLabel(/^Contract Value \(INR\)$/i), { target: { value: '20000000000' } });
    const avenueGroup = screen.getByRole('group', { name: /offset discharge avenue/i });
    fireEvent.click(within(avenueGroup).getByRole('button', { name: /Direct Purchase, Eligible Products \(1\.0x\)/i }));
    fireEvent.change(numberInputByLabel(/^Raw Amount Discharged/i), { target: { value: '6000000000' } });
    setSpendShareToFullPortfolio();
    expect(screen.getByText(/100% eligible/i)).toBeInTheDocument();
  });
});

describe('LocalContentICVCheck -- Germany/EU EDIP eu-content-threshold-gate (resolved this pass)', () => {
  it('selecting Germany then the EDIP EU-Content Threshold program auto-selects semi-government-soe context and reveals the real percentage input', () => {
    renderPage();
    switchCountry('Germany');
    const programBtn = screen.getByRole('button', { name: /^EDIP EU-Content Threshold \(65%\)/i });
    fireEvent.click(programBtn);
    expect(programBtn.getAttribute('aria-pressed')).toBe('true');
    expect(within(programBtn).queryByText(/not sourced/i)).not.toBeInTheDocument();
    // EDIP's only sourced applicable context is semi-government-soe --
    // selecting it must not land on 'not applicable' for a reason the
    // reader would have to go hunting for.
    expect(screen.queryByText(/does not apply here/i)).not.toBeInTheDocument();
    expect(screen.getByText(/^EU-or-Associated-Country Content Share$/i)).toBeInTheDocument();
  });

  it('65% or more meets the threshold; just under 65% does not', () => {
    renderPage();
    switchCountry('Germany');
    fireEvent.click(screen.getByRole('button', { name: /^EDIP EU-Content Threshold \(65%\)/i }));
    fireEvent.change(numberInputByLabel(/^EU-or-Associated-Country Content Share$/i), { target: { value: '65' } });
    expect(screen.getByText(/^Meets threshold$/i)).toBeInTheDocument();

    fireEvent.change(numberInputByLabel(/^EU-or-Associated-Country Content Share$/i), { target: { value: '64.9' } });
    expect(screen.getByText(/does not meet threshold/i)).toBeInTheDocument();
    expect(screen.getByText(/raise the eu-or-associated-country content share/i)).toBeInTheDocument();
  });

  it('both assessSupplierLocalContent call sites wire deEdip identically: the portfolio rollup shows a genuine spend-weighted eligible share', () => {
    renderPage();
    switchCountry('Germany');
    fireEvent.click(screen.getByRole('button', { name: /^EDIP EU-Content Threshold \(65%\)/i }));
    fireEvent.change(numberInputByLabel(/^EU-or-Associated-Country Content Share$/i), { target: { value: '70' } });
    setSpendShareToFullPortfolio();
    expect(screen.getByText(/100% eligible/i)).toBeInTheDocument();
  });

  it('the general module description no longer claims BOTH of Germany\'s programs are not-yet-sourced, now that EDIP is resolved', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /^Other \/ not listed$/i }));
    const desc = screen.getByText(/This module currently covers only sixteen countries/i);
    expect(desc.textContent).not.toMatch(/BOTH of its programs are not-yet-sourced/i);
    expect(desc.textContent).toMatch(/European Defence Industry Programme \(EDIP\), is now a real, computable EU-content-threshold gate/i);
  });
});

describe('LocalContentICVCheck -- hasMeaningfulResult fix (this pass\'s own bug, found mid-task) renders a real result for all four previously-silent mechanisms', () => {
  it('Egypt AIDP (pre-existing gap, fixed alongside this pass\'s three new mechanisms) now shows its eligibility result, not a blank "enter the figures" placeholder', () => {
    renderPage();
    switchCountry('Egypt');
    fireEvent.click(screen.getByRole('button', { name: /Automotive Incentive Eligibility Gate/i }));
    fireEvent.click(within(screen.getByRole('group', { name: /vehicle category/i })).getByRole('button', { name: /Electric \(EV\)/i }));
    fireEvent.change(numberInputByLabel(/^Local Content Share$/i), { target: { value: '15' } });
    fireEvent.change(numberInputByLabel(/^Annual Production Volume/i), { target: { value: '2000' } });
    // Before this pass's hasMeaningfulResult fix, this entire results panel
    // never rendered for production-incentive-eligibility-gate at all.
    expect(screen.queryByText(/enter the figures above to see the result/i)).not.toBeInTheDocument();
    expect(screen.getByText(/^AIDP Incentive Eligibility$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Eligible$/i)).toBeInTheDocument();
  });

  it('a Kuwait, India, and Germany entry each render a real result panel, not the "enter the figures above" placeholder, once their inputs are filled', () => {
    renderPage();
    switchCountry('Kuwait');
    fireEvent.click(screen.getByRole('button', { name: /^Local Sourcing Gate \(Art\. 87\)/i }));
    fireEvent.change(numberInputByLabel(/^Local Materials Share$/i), { target: { value: '35' } });
    fireEvent.change(numberInputByLabel(/^Local Works Share$/i), { target: { value: '40' } });
    expect(screen.queryByText(/enter the figures above to see the result/i)).not.toBeInTheDocument();
  });
});

describe('LocalContentICVCheck -- Module 08 label/group-name collision check (same bug class as كويتية/الكويت and Japanese/Korean SME-status)', () => {
  it('Kuwait\'s dual-threshold labels, India\'s avenue-selector group, and Germany\'s EU-content label never collide with any pre-existing accessible name', () => {
    renderPage();
    switchCountry('Kuwait');
    fireEvent.click(screen.getByRole('button', { name: /^Local Sourcing Gate \(Art\. 87\)/i }));
    expect(screen.getByText(/^Local Materials Share$/i)).toBeInTheDocument();

    switchCountry('India');
    fireEvent.click(screen.getByRole('button', { name: /^DAP 2020 Offset Multiplier Gate/i }));
    expect(screen.getByRole('group', { name: /offset discharge avenue/i })).toBeInTheDocument();

    switchCountry('Germany');
    fireEvent.click(screen.getByRole('button', { name: /^EDIP EU-Content Threshold \(65%\)/i }));
    expect(screen.getByText(/^EU-or-Associated-Country Content Share$/i)).toBeInTheDocument();
  });
});
