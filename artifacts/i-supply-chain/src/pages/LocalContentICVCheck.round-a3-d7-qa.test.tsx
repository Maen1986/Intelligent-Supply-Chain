/**
 * LocalContentICVCheck -- Round A.3 D7 QA (22 Oct 2026)
 *
 * The brief's D7 asks for a "10/10 customer simulation": open Module 08 in
 * Arabic at mobile width (375px) and desktop, and check the Sourced
 * Methodology accordion for 6 programs (3 not-yet-sourced, 3 calculated
 * incl. cn-govt-procurement-law-domestic-mandate and
 * in-make-in-india-price-preference) for RTL alignment, numerals, scrambled-
 * citation risk, line breaks, and keyboard open/close -- and says plainly:
 * "If you cannot run a browser in your environment, say so explicitly and
 * do not claim the pass."
 *
 * DISCLOSED LIMITATION (read this before trusting anything below): no
 * browser tool available in this session can reach an unpublished dev
 * server running in the cloud sandbox this builder session runs in --
 * both available browser-automation tool families drive a browser on the
 * USER's own computer, which cannot open a localhost URL that only exists
 * inside this sandbox. There is NO live-browser visual pass behind this
 * file. What follows instead is jsdom/@testing-library/react evidence --
 * real DOM structure, real attribute values (dir, aria-expanded), and real
 * rendered text content, driven by actually clicking the actual buttons --
 * which is a genuine, non-fabricated check of everything jsdom CAN see.
 * It is NOT a substitute for a visual QA pass and does NOT verify:
 *   - true mobile-width (375px) layout or reflow -- jsdom has no box model;
 *     this app also has no JS-driven responsive logic (confirmed: no
 *     `matchMedia`/`innerWidth` reads anywhere in LocalContentICVCheck.tsx),
 *     so there is nothing a resize-and-rerender trick would even exercise --
 *     the responsive behavior is pure Tailwind breakpoint CSS, which jsdom
 *     never evaluates. Setting `window.innerWidth` here would be theater,
 *     not evidence, so this file does not do it.
 *   - actual visual line-break positions (where Arabic text wraps)
 *   - true glyph-level bidi rendering (how a real browser's text shaper
 *     lays out mixed RTL/LTR runs pixel-by-pixel)
 * Those three remain unverified. Say so, per Decision Record 8.7 -- don't
 * claim a pass this file cannot support.
 *
 * What IS real evidence here:
 *   - the page root really carries dir="rtl" in Arabic mode (reusing the
 *     Round A.1 regression pattern from LocalContentICVCheck.round-a1-qa)
 *   - for each of the 6 target programs: the country (and, where the
 *     target program isn't that country's default, the program) button is
 *     actually clicked; the Sourced Methodology accordion button actually
 *     toggles aria-expanded and actually mounts/unmounts the sourceNoteAr
 *     paragraph in the real DOM -- this is "keyboard/click open-close
 *     works", observed directly, not assumed
 *   - the rendered sourceNoteAr text, as it actually appears in the DOM
 *     (not the raw source string), is scanned for the same two risks D3/D4
 *     guard statically: a bare Latin digit outside an LRI...PDI isolate,
 *     and an isolated citation code that failed to survive into the
 *     rendered output (i.e. that React/JSX didn't silently strip the
 *     invisible isolate marks)
 *   - Arabic-Indic numerals appear in the rendered text for the two
 *     calculated programs whose notes carry a percentage/date (D4's fix)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { LanguageProvider } from '@/lib/LanguageContext';
import { LocalContentICVCheck } from '@/pages/LocalContentICVCheck';

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));

const LRI = '⁦'; // LEFT-TO-RIGHT ISOLATE
const PDI = '⁩'; // POP DIRECTIONAL ISOLATE

function renderArabicPage() {
  localStorage.setItem('isc-lang', 'ar');
  return render(
    <LanguageProvider>
      <LocalContentICVCheck />
    </LanguageProvider>,
  );
}

/** Clicks the first button anywhere in the document whose own text content
 * includes `text`. Used for the country/program routing buttons, whose
 * accessible name also carries a flag emoji (aria-hidden, so excluded from
 * the accessible name) and sometimes a "not sourced" badge span -- matching
 * on textContent-includes is more robust here than an exact accessible-name
 * match would be, and is still a real click on the real button the customer
 * would tap. */
function clickButtonContaining(text: string) {
  const buttons = screen.getAllByRole('button');
  const match = buttons.find(b => b.textContent?.includes(text));
  if (!match) throw new Error(`No button found containing: ${text}`);
  fireEvent.click(match);
}

function getMethodologyButton(): HTMLElement {
  const buttons = screen.getAllByRole('button');
  const match = buttons.find(b => b.textContent?.includes('المنهجية الموثّقة'));
  if (!match) throw new Error('Sourced Methodology accordion button not found');
  return match;
}

beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); });

describe('Round A.3 D7: page root is really dir="rtl" in Arabic mode (precondition for everything below)', () => {
  it('root container carries dir="rtl"', () => {
    const { container } = renderArabicPage();
    expect((container.firstChild as HTMLElement).getAttribute('dir')).toBe('rtl');
  });
});

type D7Case = {
  label: string;
  countryNameAr: string;
  programLabelAr?: string; // only needed when the target program isn't the country's default
  programNameAr: string; // full programNameAr, as it appears in the accordion header
  expectIsolatedSubstring?: string; // a citation code expected wrapped in LRI...PDI in the rendered text
  expectArabicIndicNumeral?: boolean;
};

// 3 not-yet-sourced + 3 calculated, per the brief; each is that country's
// DEFAULT_PROGRAM_BY_COUNTRY except SA (default sa-lcgpa-general, so sa-likt
// needs its own program-button click) and CN (default
// cn-domestic-product-price-preference, so cn-govt-procurement-law-domestic-
// mandate needs its own program-button click too).
const CASES: D7Case[] = [
  {
    label: 'SA / sa-likt (not-yet-sourced)',
    countryNameAr: 'المملكة العربية السعودية',
    programLabelAr: 'LIKT (غير موثّق)',
    programNameAr: 'برنامج توطين الصناعة ونقل المعرفة (LIKT)',
  },
  {
    label: 'OM / om-icv (not-yet-sourced, is OM\'s default program)',
    countryNameAr: 'سلطنة عُمان',
    programNameAr: 'القيمة المحلية (ICV) — غير موثّقة بعد',
  },
  {
    label: 'QA / qa-national-strategy (not-yet-sourced, is QA\'s default program)',
    countryNameAr: 'دولة قطر',
    programNameAr: 'الاستراتيجية الوطنية للمحتوى المحلي — غير موثّقة بعد',
  },
  {
    label: 'CN / cn-govt-procurement-law-domestic-mandate (calculated)',
    countryNameAr: 'جمهورية الصين الشعبية',
    programLabelAr: 'بوابة تفويض المادة العاشرة',
    programNameAr: 'تفويض المادة العاشرة من قانون المشتريات الحكومية',
    expectIsolatedSubstring: 'Guobanfa [2025] No. 34',
  },
  {
    label: 'IN / in-make-in-india-price-preference (calculated, is IN\'s default program)',
    countryNameAr: 'جمهورية الهند',
    programNameAr: 'تفضيل الشراء لصنع في الهند (أمر تفضيل صنع في الهند للمشتريات الحكومية لعام 2017)',
    expectIsolatedSubstring: 'L1',
    expectArabicIndicNumeral: true,
  },
  {
    label: 'USA / usa-buy-american-price-preference (calculated, is USA\'s default program)',
    countryNameAr: 'الولايات المتحدة الأمريكية',
    programNameAr: 'تفضيل سعر قانون الشراء الأمريكي (FAR ٢٥.١/٢٥.٢)',
    expectIsolatedSubstring: 'FAR 25.105',
    expectArabicIndicNumeral: true,
  },
];

describe('Round A.3 D7: Sourced Methodology accordion -- 6-program customer simulation (Arabic)', () => {
  for (const c of CASES) {
    it(`${c.label}: country/program selection renders the right methodology header, and the accordion really opens/closes`, () => {
      renderArabicPage();

      clickButtonContaining(c.countryNameAr);
      if (c.programLabelAr) clickButtonContaining(c.programLabelAr);

      const methodologyButton = getMethodologyButton();
      // Correct program resolved into the accordion header -- not just "some"
      // methodology text, but this program's own programNameAr.
      expect(methodologyButton.textContent).toContain(c.programNameAr);

      // Closed by default.
      expect(methodologyButton.getAttribute('aria-expanded')).toBe('false');

      // Open it (this is the literal click/keyboard-operable check D7 asks
      // for -- a real onClick handler on a real <button type="button">,
      // actually invoked here, not assumed from reading the source).
      fireEvent.click(methodologyButton);
      expect(methodologyButton.getAttribute('aria-expanded')).toBe('true');

      // The sourceNoteAr paragraph is now actually in the DOM.
      const noteParagraph = document.querySelector('p.text-\\[11px\\].text-muted-foreground.leading-relaxed');
      expect(noteParagraph).toBeTruthy();
      const renderedText = noteParagraph!.textContent ?? '';
      expect(renderedText.length).toBeGreaterThan(20);

      // Scrambled-citation check (D3/D4's own static-source checks, now
      // re-run against the actually-rendered DOM text instead of the
      // source string -- confirms React did not strip the invisible
      // LRI/PDI isolate marks on the way to the screen).
      if (c.expectIsolatedSubstring) {
        expect(renderedText).toContain(`${LRI}${c.expectIsolatedSubstring}${PDI}`);
      }
      const strippedOfIsolates = renderedText.replace(new RegExp(`${LRI}.*?${PDI}`, 'gu'), '');
      const bareDigits = strippedOfIsolates.match(/[0-9]+/g);
      expect(bareDigits).toBeNull();

      // No ASCII comma joining two Arabic-Indic digits (the D7-found,
      // D7-fixed USA defect -- regression-guarded here at the rendered-DOM
      // level too, not just the source-string level in
      // supplierLocalContentEligibility.test.ts).
      expect(renderedText).not.toMatch(/[٠-٩],[٠-٩]/);

      if (c.expectArabicIndicNumeral) {
        expect(renderedText).toMatch(/[٠-٩]/);
      }

      // Close it again -- the paragraph really unmounts, not just a CSS
      // hide (confirms the conditional-render pattern, not a display:none
      // that would leave stale text behind for a screen reader).
      fireEvent.click(methodologyButton);
      expect(methodologyButton.getAttribute('aria-expanded')).toBe('false');
      expect(document.querySelector('p.text-\\[11px\\].text-muted-foreground.leading-relaxed')).toBeNull();
    });
  }
});
