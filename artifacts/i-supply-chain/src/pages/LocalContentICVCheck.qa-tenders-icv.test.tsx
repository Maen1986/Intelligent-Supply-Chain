/**
 * LocalContentICVCheck -- QA Tenders Law ICV Consideration real click-through
 * (20 Sep 2026, Qatar mechanism-stacking pass)
 *
 * Genuinely renders the real page component (not a hand-copied
 * reconstruction of its JSX) and drives it through actual user events,
 * mirroring the discipline established for the sa-rawafed-stc /
 * sa-sabic-lc-commitment regression guard: a future change that silently
 * removes the qa-tenders-icv input block, breaks its wiring into
 * assessSupplierLocalContent (the `qaTendersIcv: entry.qaTendersIcv` spread
 * at both call sites), or breaks its Article-2 ratio math will fail this
 * suite rather than only being caught by manual review.
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

function switchCountryToQatar() {
  // Country selector is a button row above the routing-question row; QA's
  // own button carries the country's short label (see COUNTRY_FRAMEWORKS-
  // derived button labels). Locate it by its accessible name.
  const qatarBtn = screen.getByRole('button', { name: /Qatar|قطر/i });
  fireEvent.click(qatarBtn);
}

beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); });

describe('LocalContentICVCheck -- QA / Tenders Law ICV Consideration real click-through', () => {
  it('selecting Qatar then the Tenders Law ICV program reveals the real 2-field form and a genuinely computed ratio', () => {
    renderPage();
    switchCountryToQatar();
    const programBtn = screen.getByRole('button', { name: /Tenders Law ICV/i });
    expect(programBtn.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(programBtn);
    expect(programBtn.getAttribute('aria-pressed')).toBe('true');

    // Article 3 disclosure copy renders before any input.
    expect(screen.getByText(/does not|Article 3|no fixed threshold/i)).toBeTruthy();

    const inputs = lastNumberInputs(2);
    expect(inputs).toHaveLength(2);
    fireEvent.change(inputs[0], { target: { value: '3500000' } });
    fireEvent.change(inputs[1], { target: { value: '10000000' } });
    expect(screen.getByText('35.0%')).toBeInTheDocument();
  });

  it('pillar label is real translated text ("Local Value (Tenders Law Art. 2)"), never the raw camelCase key, in both EN and AR', () => {
    renderPage();
    switchCountryToQatar();
    fireEvent.click(screen.getByRole('button', { name: /Tenders Law ICV/i }));
    const inputs = lastNumberInputs(2);
    fireEvent.change(inputs[0], { target: { value: '4000000' } });
    fireEvent.change(inputs[1], { target: { value: '8000000' } });
    expect(screen.getByText('Local Value (Tenders Law Art. 2)')).toBeInTheDocument();
    expect(screen.queryByText('qaTendersIcvLocalValue')).not.toBeInTheDocument();

    localStorage.setItem('isc-lang', 'ar');
    cleanup();
    renderPage();
    switchCountryToQatar();
    fireEvent.click(screen.getByRole('button', { name: 'القيمة المحلية بقانون المناقصات (المادتان ٢-٣)' }));
    const inputsAr = lastNumberInputs(2);
    fireEvent.change(inputsAr[0], { target: { value: '4000000' } });
    fireEvent.change(inputsAr[1], { target: { value: '8000000' } });
    expect(screen.getByText('القيمة المحلية (قانون المناقصات، المادة ٢)')).toBeInTheDocument();
    expect(screen.queryByText('Local Value (Tenders Law Art. 2)')).not.toBeInTheDocument();
  });

  it("switching between Qatar's three programs does not wipe qa-tenders-icv's own data", () => {
    renderPage();
    switchCountryToQatar();
    fireEvent.click(screen.getByRole('button', { name: /Tenders Law ICV/i }));
    const inputs = lastNumberInputs(2);
    fireEvent.change(inputs[0], { target: { value: '1234567' } });
    fireEvent.click(screen.getByRole('button', { name: /Tawteen \/ ICV/i }));
    expect(screen.queryByText('Local Value (Tenders Law Art. 2)')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Tenders Law ICV/i }));
    const inputsAgain = lastNumberInputs(2);
    expect(inputsAgain[0].value).toBe('1234567');
  });
});
