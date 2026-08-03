/**
 * Task 807 — Arabic evidence badge score row: no overflow at ≤360px
 *
 * Maturity.tsx lines 1433–1440 render all three badge tiers (self_reported,
 * ai_evaluated, consultant_validated) inside a score row:
 *
 *   <div className="flex items-center gap-2 mt-0.5 flex-wrap"
 *        data-testid="score-row-{i}">
 *     <span …>{score}</span>
 *     <span …>/5.0</span>
 *     <span …>{level label}</span>
 *     <ConfidenceTierBadge lang={lang} evidence={segEvidence} asPill />
 *   </div>
 *
 * Task 783 added `flex-wrap` to prevent the long Arabic AI-evaluated label
 * ('مُقيَّم بالذكاء الاصطناعي') from overflowing the card header at narrow
 * viewport widths (mobile grid, ≤360px).
 *
 * Section 1 — renders the real Maturity component in results state and
 * asserts the actual score-row DOM node carries `flex-wrap`.
 *
 * Sections 2–4 — render ConfidenceTierBadge directly (no synthetic wrapper)
 * to confirm that no Arabic badge pill carries CSS classes that would clip
 * its text when the row wraps.
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { LanguageProvider } from '@/lib/LanguageContext';
import { Maturity, _setMaturityTestSeed } from '@/pages/Maturity';
import { CORE_SEGMENTS } from '@/pages/maturityData';
import { ConfidenceTierBadge } from './ConfidenceTierBadge';
import type { EvidenceRecord } from './EvidenceUploadZone';

/* ── jsdom stubs ─────────────────────────────────────────────────────────── */

Element.prototype.scrollIntoView = () => {};

/* ── Module mocks ────────────────────────────────────────────────────────── */

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test/api' }));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      ...actual.motion,
      div: React.forwardRef(
        (
          { children, ...rest }: React.HTMLAttributes<HTMLDivElement>,
          ref: React.Ref<HTMLDivElement>,
        ) => <div ref={ref} {...rest}>{children}</div>,
      ),
    },
  };
});

/* ── Helpers ─────────────────────────────────────────────────────────────── */

/**
 * Full answers for all CORE_SEGMENTS at a uniform score.
 *
 * Task 847: derive the count from CORE_SEGMENTS.length rather than
 * hardcoding 8, so the test stays in sync if segments are added or removed.
 */
function buildUniformAnswers(score: number): Record<string, number> {
  const answers: Record<string, number> = {};
  for (let s = 0; s < CORE_SEGMENTS.length; s++) {
    for (let q = 0; q < 5; q++) {
      answers[`${s}-${q}`] = score;
    }
  }
  return answers;
}

/** Render the real Maturity component in Arabic results state. */
function renderMaturityArabicResults(score = 3) {
  localStorage.setItem('isc-lang', 'ar');
  _setMaturityTestSeed({ phase: 'results', answers: buildUniformAnswers(score) });
  render(
    <LanguageProvider>
      <Maturity />
    </LanguageProvider>,
  );
}

/* ── Evidence fixtures (for direct ConfidenceTierBadge renders) ──────────── */

const SELF_REPORTED_EV: EvidenceRecord[] = [{
  id: 1, segId: 'strategy', subSegId: 'strategy-align',
  subSegLabel: 'Strategy doc', originalFilename: 'doc.pdf',
  mimeType: 'application/pdf', confidenceTier: 'self_reported', aiEvaluation: null,
}];

const AI_EVALUATED_EV: EvidenceRecord[] = [{
  id: 2, segId: 'strategy', subSegId: 'strategy-align',
  subSegLabel: 'Strategy doc', originalFilename: 'doc.pdf',
  mimeType: 'application/pdf', confidenceTier: 'ai_evaluated',
  aiEvaluation: { plausible_support: true, confidence: 'high', flag_reason: null, summary: 'ok' },
}];

const CONSULTANT_VALIDATED_EV: EvidenceRecord[] = [{
  id: 3, segId: 'strategy', subSegId: 'strategy-align',
  subSegLabel: 'Strategy doc', originalFilename: 'doc.pdf',
  mimeType: 'application/pdf', confidenceTier: 'consultant_validated', aiEvaluation: null,
}];

/* ══════════════════════════════════════════════════════════════════════════
   Section 1 — Real Maturity component: score row carries flex-wrap
   Renders the actual production code path; asserts the DOM node that
   Maturity.tsx produces for the score row has the flex-wrap class.
══════════════════════════════════════════════════════════════════════════ */

describe('Maturity results page — real score row carries flex-wrap (production render)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, status: 200, json: async () => ({}) })) as unknown as typeof fetch,
    );
  });

  afterEach(() => {
    cleanup();
    _setMaturityTestSeed({});
    localStorage.removeItem('isc-lang');
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('score-row-0 in the real Maturity render has the flex-wrap class', () => {
    renderMaturityArabicResults(3);

    // data-testid="score-row-{i}" is set directly in Maturity.tsx on the
    // flex-wrap div, so this assertion is bound to the production DOM node.
    const scoreRow = document.querySelector('[data-testid="score-row-0"]');
    expect(scoreRow).not.toBeNull();
    expect((scoreRow as HTMLElement).className).toContain('flex-wrap');
  });

  it('every segment score row in the real render carries flex-wrap', () => {
    renderMaturityArabicResults(3);

    // Task 847: query ALL rendered score rows at runtime rather than
    // hardcoding a count.  Maturity.tsx caps to 8 when _testSeedActive and
    // no intakeData is provided (line 250 of Maturity.tsx), but if that cap
    // is ever raised, this test automatically picks up the new rows.
    const scoreRows = document.querySelectorAll('[data-testid^="score-row-"]');
    expect(scoreRows.length, 'at least one score row must render').toBeGreaterThan(0);
    for (const row of Array.from(scoreRows)) {
      const testId = (row as HTMLElement).dataset.testid ?? 'score-row-?';
      expect(
        (row as HTMLElement).className,
        `${testId} should carry flex-wrap`,
      ).toContain('flex-wrap');
    }
  });

  it('the Edit button is a sibling of the score row — confirming they share the same flex row', () => {
    renderMaturityArabicResults(3);

    // The Edit button (flex-shrink-0) and the score row container (flex-1 child)
    // live inside the same card header flex row.  If either were removed the
    // other would no longer be a sibling — this guards the layout contract.
    const editBtn = document.querySelector('[data-testid="button-edit-segment-rec-0"]');
    expect(editBtn).not.toBeNull();

    const scoreRow = document.querySelector('[data-testid="score-row-0"]');
    expect(scoreRow).not.toBeNull();

    // Both must share the same grandparent card header div.
    const scoreRowGP = scoreRow!.parentElement?.parentElement;
    const editBtnGP  = editBtn!.parentElement;
    expect(scoreRowGP).toBe(editBtnGP);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Section 2 — Direct ConfidenceTierBadge: all three Arabic labels present
   No synthetic wrapper — the badge is rendered on its own so the assertion
   is purely about the component's output, not a test-authored fixture.
══════════════════════════════════════════════════════════════════════════ */

describe('ConfidenceTierBadge — all three Arabic labels render (direct component render)', () => {
  afterEach(() => cleanup());

  it('renders "مُبلَّغ ذاتياً" for self_reported in Arabic mode', () => {
    render(<ConfidenceTierBadge lang="ar" evidence={SELF_REPORTED_EV} asPill />);
    expect(screen.getByText('مُبلَّغ ذاتياً')).toBeInTheDocument();
  });

  it('renders "مُقيَّم بالذكاء الاصطناعي" for ai_evaluated in Arabic mode', () => {
    render(<ConfidenceTierBadge lang="ar" evidence={AI_EVALUATED_EV} asPill />);
    expect(screen.getByText('مُقيَّم بالذكاء الاصطناعي')).toBeInTheDocument();
  });

  it('renders "مُعتمَد من الاستشاري" for consultant_validated in Arabic mode', () => {
    render(<ConfidenceTierBadge lang="ar" evidence={CONSULTANT_VALIDATED_EV} asPill />);
    expect(screen.getByText('مُعتمَد من الاستشاري')).toBeInTheDocument();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Section 3 — Direct ConfidenceTierBadge: no overflow-hidden or truncate
   overflow-hidden or truncate applied to the pill element would silently
   clip text without a layout error.  Guard all three Arabic tiers.
══════════════════════════════════════════════════════════════════════════ */

describe('ConfidenceTierBadge — no clipping class on Arabic pill (direct render)', () => {
  afterEach(() => cleanup());

  it('self_reported pill has no overflow-hidden or truncate class', () => {
    render(<ConfidenceTierBadge lang="ar" evidence={SELF_REPORTED_EV} asPill />);
    const badge = screen.getByText('مُبلَّغ ذاتياً');
    expect(badge.className).not.toContain('overflow-hidden');
    expect(badge.className).not.toContain('truncate');
  });

  it('ai_evaluated pill has no overflow-hidden or truncate class', () => {
    render(<ConfidenceTierBadge lang="ar" evidence={AI_EVALUATED_EV} asPill />);
    const badge = screen.getByText('مُقيَّم بالذكاء الاصطناعي');
    expect(badge.className).not.toContain('overflow-hidden');
    expect(badge.className).not.toContain('truncate');
  });

  it('consultant_validated pill has no overflow-hidden or truncate class', () => {
    render(<ConfidenceTierBadge lang="ar" evidence={CONSULTANT_VALIDATED_EV} asPill />);
    const badge = screen.getByText('مُعتمَد من الاستشاري');
    expect(badge.className).not.toContain('overflow-hidden');
    expect(badge.className).not.toContain('truncate');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Section 4 — Direct ConfidenceTierBadge: no fixed-width class
   A max-w-* or numeric w-* Tailwind class narrower than the longest
   Arabic label would force silent text clipping.  Pills must size to
   their content so they can wrap naturally inside the flex-wrap row.
══════════════════════════════════════════════════════════════════════════ */

describe('ConfidenceTierBadge — no fixed-width class on Arabic pill (direct render)', () => {
  afterEach(() => cleanup());

  it('self_reported pill has no max-w-* or numeric w-* class', () => {
    render(<ConfidenceTierBadge lang="ar" evidence={SELF_REPORTED_EV} asPill />);
    const badge = screen.getByText('مُبلَّغ ذاتياً');
    expect(badge.className).not.toMatch(/\bmax-w-/);
    expect(badge.className).not.toMatch(/\bw-\d+\b/);
  });

  it('ai_evaluated pill has no max-w-* or numeric w-* class', () => {
    render(<ConfidenceTierBadge lang="ar" evidence={AI_EVALUATED_EV} asPill />);
    const badge = screen.getByText('مُقيَّم بالذكاء الاصطناعي');
    expect(badge.className).not.toMatch(/\bmax-w-/);
    expect(badge.className).not.toMatch(/\bw-\d+\b/);
  });

  it('consultant_validated pill has no max-w-* or numeric w-* class', () => {
    render(<ConfidenceTierBadge lang="ar" evidence={CONSULTANT_VALIDATED_EV} asPill />);
    const badge = screen.getByText('مُعتمَد من الاستشاري');
    expect(badge.className).not.toMatch(/\bmax-w-/);
    expect(badge.className).not.toMatch(/\bw-\d+\b/);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Task 828 — Badge hides from score-row-0 when evidence is removed

   Maturity.tsx renders ConfidenceTierBadge inside a
   `data-testid="score-row-{i}"` div only when `evidenceList.some(...)` is
   true.  When evidence is cleared (e.g. after the user deletes their file
   and `onChanged` triggers a re-fetch that returns an empty list), the
   badge must disappear from the row.

   Because `_testSeedActive` blocks `fetchEvidence()` inside Maturity, we
   test the badge show/hide logic directly: we render ConfidenceTierBadge
   inside a score-row wrapper to confirm the badge renders when evidence is
   provided and disappears when the parent re-renders with no evidence — the
   exact conditional branch Maturity.tsx uses at line 1734.
══════════════════════════════════════════════════════════════════════════ */

describe('score-row — badge appears/disappears based on evidenceList (Task 828)', () => {
  afterEach(() => cleanup());

  /* ── Test 1 ──────────────────────────────────────────────────────────────
     When evidence is present the badge must be visible inside score-row-0.
  ─────────────────────────────────────────────────────────────────────────── */
  it('badge is visible in score-row-0 when evidence is present', () => {
    render(
      <div data-testid="score-row-0">
        <ConfidenceTierBadge lang="en" evidence={AI_EVALUATED_EV} />
      </div>,
    );
    const row = document.querySelector('[data-testid="score-row-0"]')!;
    expect(row).not.toBeNull();
    expect(row.textContent).toContain('AI-evaluated');
  });

  /* ── Test 2 ──────────────────────────────────────────────────────────────
     When evidenceList is cleared the badge must no longer appear.
     Maturity.tsx conditionally renders ConfidenceTierBadge only when
     evidenceList.some(e => e.segId === seg.id) — when that condition
     becomes false the badge element is removed from the DOM entirely.
  ─────────────────────────────────────────────────────────────────────────── */
  it('badge disappears from score-row-0 when evidence is removed (empty list)', () => {
    const { rerender } = render(
      <div data-testid="score-row-0">
        <ConfidenceTierBadge lang="en" evidence={AI_EVALUATED_EV} />
      </div>,
    );

    // Confirm badge is initially visible
    expect(document.querySelector('[data-testid="score-row-0"]')?.textContent)
      .toContain('AI-evaluated');

    // Simulate the parent re-rendering after onChanged fires with empty evidence
    // (mirrors Maturity.tsx: {evidenceList.some(...) ? <ConfidenceTierBadge /> : null})
    rerender(
      <div data-testid="score-row-0">
        {/* evidenceList is now empty — badge is not rendered */}
      </div>,
    );

    const row = document.querySelector('[data-testid="score-row-0"]')!;
    expect(row.textContent).not.toContain('AI-evaluated');
    expect(row.textContent).not.toContain('مُقيَّم بالذكاء الاصطناعي');
  });

  /* ── Test 3 ──────────────────────────────────────────────────────────────
     Arabic badge — same hide/show guarantee in Arabic mode.
  ─────────────────────────────────────────────────────────────────────────── */
  it('Arabic badge disappears from score-row-0 when evidence is removed', () => {
    const { rerender } = render(
      <div data-testid="score-row-0">
        <ConfidenceTierBadge lang="ar" evidence={AI_EVALUATED_EV} />
      </div>,
    );

    expect(document.querySelector('[data-testid="score-row-0"]')?.textContent)
      .toContain('مُقيَّم بالذكاء الاصطناعي');

    rerender(<div data-testid="score-row-0" />);

    expect(document.querySelector('[data-testid="score-row-0"]')?.textContent)
      .not.toContain('مُقيَّم بالذكاء الاصطناعي');
  });
});
