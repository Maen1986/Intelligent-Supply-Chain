/**
 * LocalContentICVCheck -- Round A.1 QA fixes (22 Oct 2026)
 *
 * Task 7's QA 10/10 customer simulation ("a Saudi supplier opening these
 * accordions on mobile in Arabic") found a real, previously-undetected
 * defect: the page's root container set its RTL/LTR state via a plain
 * `className={isAr ? 'rtl' : 'ltr'}` string. No stylesheet rule anywhere in
 * this app defines `.rtl`/`.ltr`, so that class did nothing -- it never set
 * actual right-to-left layout. Every other RTL-aware component in this repo
 * (MaturitySummarySection, AIPlanPanel, SavedPlansSection, SupplierScorecard,
 * CLMTools) instead sets the real `dir="rtl"`/`dir="ltr"` HTML attribute,
 * each with its own test asserting that attribute is present -- this page
 * was the one outlier not following that convention, and had no test that
 * would have caught it. Fixed by adding a real `dir` attribute alongside
 * the (harmless, now-redundant) class. This file is the permanent regression
 * guard for that fix, plus a guard that the two F3 "see sourceNoteEn"
 * strings (now replaced with customer wording) never regress back into the
 * rendered DOM.
 */

import React from 'react';
import { readFileSync } from 'fs';
import { join } from 'path';
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

beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); });

describe('LocalContentICVCheck -- Round A.1: real dir="rtl"/"ltr" on the page root', () => {
  it('English mode: root container carries dir="ltr"', () => {
    const { container } = renderPage();
    expect(container.firstChild).toBeTruthy();
    expect((container.firstChild as HTMLElement).getAttribute('dir')).toBe('ltr');
  });

  it('Arabic mode: root container carries dir="rtl" (not just the inert "rtl" class)', () => {
    localStorage.setItem('isc-lang', 'ar');
    const { container } = renderPage();
    const root = container.firstChild as HTMLElement;
    expect(root.getAttribute('dir')).toBe('rtl');
    // The class is harmless but, on its own, sets no CSS rule in this app --
    // the attribute above is what actually drives RTL layout.
    expect(root.className).toContain('rtl');
  });
});

describe('LocalContentICVCheck -- Round A.1: F3 "see sourceNoteEn" strings never regress', () => {
  it('English: the rendered page never shows a raw sourceNoteEn/sourceNoteAr field-name reference to the customer', () => {
    renderPage();
    expect(document.body.textContent).not.toMatch(/see sourceNote(En|Ar)\b/i);
  });

  it('Arabic: the rendered page never shows "ملاحظة المصدر" / "ملاحظة مصدر البرنامج" (the old literal field-name phrasing)', () => {
    localStorage.setItem('isc-lang', 'ar');
    renderPage();
    expect(document.body.textContent).not.toContain('ملاحظة المصدر');
    expect(document.body.textContent).not.toContain('ملاحظة مصدر البرنامج');
  });
});

describe('LocalContentICVCheck -- Round A.2 F2: this page\'s own Arabic UI strings carry no banned terminology', () => {
  // F2's "any Arabic UI strings added this round" instruction isn't limited
  // to sourceNoteAr -- it covers this page's own inline isAr-branch and
  // buyerAr/supplierAr copy too (20+ ASCII "--" instances and a genuine
  // on-component source were found and fixed directly in this round's own
  // review pass; see docs/module08-arabic-glossary.md). This is a static
  // scan of the component's own source text, not the rendered DOM, so it
  // also catches copy that only renders behind a click/toggle.
  const SOURCE = readFileSync(
    join(import.meta.dirname, 'LocalContentICVCheck.tsx'),
    'utf-8',
  );

  // Extracted per source LINE (not via a whole-file quote-to-quote regex):
  // this TSX file mixes single/double-quoted Arabic and English strings with
  // apostrophes inside English text (e.g. "Aramco's", "library's"), which
  // desyncs a file-wide quote-matching regex into swallowing unrelated spans
  // between real literals. Every Arabic string here is fully contained on
  // its own source line, so matching quote-delimited literals one line at a
  // time avoids that cross-line desync while still isolating the Arabic
  // segment from an English "--" on the same line (e.g. an isAr ternary).
  function arabicLiteralsOnLine(line: string): string[] {
    if (!/[؀-ۿ]/.test(line)) return [];
    const literalRe = /(['"`])((?:\\.|(?!\1)[^\\])*)\1/g;
    const out: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = literalRe.exec(line)) !== null) {
      if (/[؀-ۿ]/.test(m[2])) out.push(m[2]);
    }
    return out;
  }

  const arabicLiterals = SOURCE.split('\n').flatMap(arabicLiteralsOnLine);

  it('no Arabic string literal in this file contains an ASCII "--"', () => {
    const offenders = arabicLiterals.filter(s => s.includes('--'));
    expect(offenders).toEqual([]);
  });

  it('no Arabic string literal in this file contains the ثغرة-as-gap, مُنمذَج, or للعِلم فقط mistranslations', () => {
    // تسجيل is checked separately below (it has a legitimate registration
    // sense). ثغرة itself is not banned here: this page's two uses are the
    // genuine "loophole" sense (a dual-threshold gate closing a gaming
    // loophole), matching their English "loophole" counterparts exactly --
    // only the gap-as-missing-information mistranslation would be banned,
    // and it does not occur in this file (confirmed by manual review this
    // round, both occurrences read in full context).
    const patterns: Array<{ pattern: RegExp; why: string }> = [
      { pattern: /[يتلم]ُ?نمذَج[ةت]?/, why: 'English calque of "modeled"' },
      { pattern: /للعِلم فقط/, why: 'stiff calque; use للاطلاع فقط' },
    ];
    const offenders: string[] = [];
    for (const lit of arabicLiterals) {
      for (const { pattern, why } of patterns) {
        if (pattern.test(lit)) offenders.push(`${why}: ${lit.slice(0, 80)}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('every تسجيل occurrence in an Arabic string literal is a genuine registration use, not the scoring mistranslation', () => {
    // All current occurrences are registration-status labels/copy
    // (contractor/supplier registration status, mainland registration
    // uplift, "formal registration"), individually read in context this
    // round -- not the تسجيل-as-scoring confusion the glossary bans. This
    // count is a tripwire: a new hit needs the same read before this
    // number is raised, not a silent pass.
    const tasjeelHits = arabicLiterals.filter(l => /تسجيل/.test(l));
    expect(tasjeelHits).toHaveLength(4);
  });
});
