/**
 * LocalContentICVCheck -- KW Public Tenders Law Price Preference (Art. 62)
 * real click-through (20 Sep 2026, Kuwait deepening pass)
 *
 * Genuinely renders the real page component (not a hand-copied
 * reconstruction of its JSX) and drives it through actual user events,
 * mirroring the discipline established for the sa-rawafed-stc /
 * sa-sabic-lc-commitment / qa-tenders-icv regression guards: a future change
 * that silently removes the kw-tender-law-price-preference input block,
 * breaks its wiring into assessSupplierLocalContent (the
 * `kwTenderLawPricePreference: entry.kwTenderLawPricePreference` spread at
 * both call sites -- the exact class of wiring omission that caused the
 * earlier SA regression bug), or breaks its price-margin math will fail
 * this suite rather than only being caught by manual review.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
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

function switchCountryToKuwait() {
  const kuwaitBtn = screen.getByRole('button', { name: /Kuwait|الكويت/i });
  fireEvent.click(kuwaitBtn);
}

beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); });

describe('LocalContentICVCheck -- KW / Public Tenders Law Price Preference (Art. 62) real click-through', () => {
  it('selecting Kuwait then the Tender Law Price Preference program reveals the real 1-field form and a genuinely computed discount', () => {
    renderPage();
    switchCountryToKuwait();
    const programBtn = screen.getByRole('button', { name: /Tender Law Price Preference/i });
    expect(programBtn.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(programBtn);
    expect(programBtn.getAttribute('aria-pressed')).toBe('true');

    // Article 62 / 15% max-margin disclosure copy (the NumberField hint) renders before any input.
    expect(screen.getByText(/Maximum price preference margin/i)).toBeTruthy();

    const inputs = lastNumberInputs(1);
    expect(inputs).toHaveLength(1);
    fireEvent.change(inputs[0], { target: { value: '40' } });
    // 15% margin * 40% national/GCC-product share = 6.0 percentage points.
    expect(screen.getByText('6.0 pts')).toBeInTheDocument();
  });

  it('label is real translated text ("National/GCC-Product Share of Bid Value"), never a raw camelCase key, in both EN and AR', () => {
    renderPage();
    switchCountryToKuwait();
    fireEvent.click(screen.getByRole('button', { name: /Tender Law Price Preference/i }));
    expect(screen.getByText('National/GCC-Product Share of Bid Value')).toBeInTheDocument();
    expect(screen.queryByText('bidValueNationalProductPct')).not.toBeInTheDocument();

    localStorage.setItem('isc-lang', 'ar');
    cleanup();
    renderPage();
    switchCountryToKuwait();
    fireEvent.click(screen.getByRole('button', { name: 'تفضيل سعر قانون المناقصات (١٥٪)' }));
    expect(screen.getByText('نسبة المنتج الوطني/الخليجي من قيمة العطاء')).toBeInTheDocument();
    expect(screen.queryByText('National/GCC-Product Share of Bid Value')).not.toBeInTheDocument();
  });

  it("switching between Kuwait's three programs does not wipe kw-tender-law-price-preference's own data", () => {
    renderPage();
    switchCountryToKuwait();
    fireEvent.click(screen.getByRole('button', { name: /Tender Law Price Preference/i }));
    const inputs = lastNumberInputs(1);
    fireEvent.change(inputs[0], { target: { value: '55' } });
    fireEvent.click(screen.getByRole('button', { name: /KPC Local Spend Target/i }));
    expect(screen.queryByText('National/GCC-Product Share of Bid Value')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Tender Law Price Preference/i }));
    const inputsAgain = lastNumberInputs(1);
    expect(inputsAgain[0].value).toBe('55');
  });
});
