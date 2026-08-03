/**
 * Task 794 — ConfidenceTierBadge: ⚠ overlay in non-pill (inline) mode
 *
 * ConfidenceTierBadge has two render paths:
 *   asPill=true  — pill shape, used in MyAssessments card headers
 *   asPill=false — inline span, used in detail/history views
 *
 * The ⚠ and title logic is duplicated in the non-pill branch and has never
 * been tested for consultant_validated.  These tests confirm:
 *
 *  1. The ⚠ character is present in the rendered output when evidence is
 *     flagged (plausible_support=false) and asPill=false.
 *  2. The <span> wrapping ⚠ carries the correct English warning title
 *     'Flagged evidence — review recommended'.
 *  3. The ⚠ span carries the correct Arabic warning title when lang='ar'.
 *  4. No ⚠ appears when evidence is not flagged (asPill=false).
 */

import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ConfidenceTierBadge } from './ConfidenceTierBadge';
import type { EvidenceRecord } from './EvidenceUploadZone';

/* ── Evidence fixtures ───────────────────────────────────────────────────── */

/**
 * ai_evaluated tier with a flagged sub-segment:
 *   - record A: ai_evaluated + plausible_support:true  → establishes the tier
 *   - record B: ai_evaluated + plausible_support:false → triggers hasFlag
 */
const FLAGGED_AI_EVALUATED_EV: EvidenceRecord[] = [
  {
    id: 3,
    segId: 'strategy',
    subSegId: 'strategy-align',
    subSegLabel: 'Strategy doc',
    originalFilename: 'ai-good.pdf',
    mimeType: 'application/pdf',
    confidenceTier: 'ai_evaluated',
    aiEvaluation: { plausible_support: true, confidence: 'high', flag_reason: null, summary: 'Looks good' },
  },
  {
    id: 4,
    segId: 'strategy',
    subSegId: 'strategy-align2',
    subSegLabel: 'Another doc',
    originalFilename: 'ai-flagged.pdf',
    mimeType: 'application/pdf',
    confidenceTier: 'ai_evaluated',
    aiEvaluation: { plausible_support: false, confidence: 'low', flag_reason: 'scope mismatch', summary: 'Flagged' },
  },
];

/**
 * self_reported tier with a flagged evaluation.
 * Tier is self_reported because there is no ai_evaluated record with
 * plausible_support:true; hasFlag is true because plausible_support=false.
 */
const FLAGGED_SELF_REPORTED_EV: EvidenceRecord[] = [
  {
    id: 5,
    segId: 'strategy',
    subSegId: 'strategy-align',
    subSegLabel: 'Self-reported doc',
    originalFilename: 'self-flagged.pdf',
    mimeType: 'application/pdf',
    confidenceTier: 'self_reported',
    aiEvaluation: { plausible_support: false, confidence: 'low', flag_reason: 'unrelated document', summary: 'Flagged' },
  },
];

/** consultant_validated tier with a flagged evaluation (plausible_support=false) */
const FLAGGED_CONSULTANT_EV: EvidenceRecord[] = [
  {
    id: 1,
    segId: 'strategy',
    subSegId: 'strategy-align',
    subSegLabel: 'Strategy doc',
    originalFilename: 'doc.pdf',
    mimeType: 'application/pdf',
    confidenceTier: 'consultant_validated',
    aiEvaluation: {
      plausible_support: false,
      confidence: 'low',
      flag_reason: 'document does not match the claimed scope',
      summary: 'Flagged for review',
    },
  },
];

/** consultant_validated tier with no flagged evaluation */
const CLEAN_CONSULTANT_EV: EvidenceRecord[] = [
  {
    id: 2,
    segId: 'strategy',
    subSegId: 'strategy-align',
    subSegLabel: 'Strategy doc',
    originalFilename: 'doc.pdf',
    mimeType: 'application/pdf',
    confidenceTier: 'consultant_validated',
    aiEvaluation: null,
  },
];

/* ════════════════════════════════════════════════════════════════════════════
   ⚠ overlay in non-pill (inline) mode — consultant_validated + flagged
════════════════════════════════════════════════════════════════════════════ */

describe('ConfidenceTierBadge — ⚠ overlay in non-pill (inline) mode', () => {
  afterEach(() => cleanup());

  /* ── Test 1 ──────────────────────────────────────────────────────────────
     The ⚠ character must be present when evidence is flagged and
     asPill=false (inline render path).
  ─────────────────────────────────────────────────────────────────────────── */
  it('renders ⚠ when evidence is flagged and asPill=false (English)', () => {
    render(
      <ConfidenceTierBadge
        lang="en"
        evidence={FLAGGED_CONSULTANT_EV}
        asPill={false}
      />,
    );
    expect(screen.getByText('⚠')).toBeInTheDocument();
  });

  /* ── Test 2 ──────────────────────────────────────────────────────────────
     The <span> containing ⚠ must carry the English warning title
     'Flagged evidence — review recommended'.
  ─────────────────────────────────────────────────────────────────────────── */
  it('⚠ span carries the English warning title when asPill=false', () => {
    render(
      <ConfidenceTierBadge
        lang="en"
        evidence={FLAGGED_CONSULTANT_EV}
        asPill={false}
      />,
    );
    const warningSpan = screen.getByText('⚠');
    expect(warningSpan.getAttribute('title')).toBe(
      'Flagged evidence — review recommended',
    );
  });

  /* ── Test 3 ──────────────────────────────────────────────────────────────
     The <span> containing ⚠ must carry the Arabic warning title
     'دليل مُحدَّد يتطلب مراجعة' when lang='ar'.
  ─────────────────────────────────────────────────────────────────────────── */
  it('⚠ span carries the Arabic warning title when asPill=false and lang="ar"', () => {
    render(
      <ConfidenceTierBadge
        lang="ar"
        evidence={FLAGGED_CONSULTANT_EV}
        asPill={false}
      />,
    );
    const warningSpan = screen.getByText('⚠');
    expect(warningSpan.getAttribute('title')).toBe('دليل مُحدَّد يتطلب مراجعة');
  });

  /* ── Test 4 ──────────────────────────────────────────────────────────────
     No ⚠ must appear when evidence is not flagged and asPill=false.
  ─────────────────────────────────────────────────────────────────────────── */
  it('does not render ⚠ when evidence is not flagged and asPill=false', () => {
    render(
      <ConfidenceTierBadge
        lang="en"
        evidence={CLEAN_CONSULTANT_EV}
        asPill={false}
      />,
    );
    expect(screen.queryByText('⚠')).toBeNull();
  });
});

/* ════════════════════════════════════════════════════════════════════════════
   Task 831 — ⚠ overlay in inline mode: ai_evaluated and self_reported tiers
   ════════════════════════════════════════════════════════════════════════════ */

describe('ConfidenceTierBadge — ⚠ overlay in non-pill mode (ai_evaluated and self_reported tiers)', () => {
  afterEach(() => cleanup());

  /* ── ai_evaluated tier ───────────────────────────────────────────────── */

  it('renders ⚠ with Arabic warning title for ai_evaluated flagged evidence (asPill=false, lang=ar)', () => {
    render(
      <ConfidenceTierBadge
        lang="ar"
        evidence={FLAGGED_AI_EVALUATED_EV}
        asPill={false}
      />,
    );
    const warningSpan = screen.getByText('⚠');
    expect(warningSpan).toBeInTheDocument();
    expect(warningSpan.getAttribute('title')).toBe('دليل مُحدَّد يتطلب مراجعة');
  });

  it('renders ⚠ with English warning title for ai_evaluated flagged evidence (asPill=false, lang=en)', () => {
    render(
      <ConfidenceTierBadge
        lang="en"
        evidence={FLAGGED_AI_EVALUATED_EV}
        asPill={false}
      />,
    );
    const warningSpan = screen.getByText('⚠');
    expect(warningSpan).toBeInTheDocument();
    expect(warningSpan.getAttribute('title')).toBe('Flagged evidence — review recommended');
  });

  /* ── self_reported tier ──────────────────────────────────────────────── */

  it('renders ⚠ with Arabic warning title for self_reported flagged evidence (asPill=false, lang=ar)', () => {
    render(
      <ConfidenceTierBadge
        lang="ar"
        evidence={FLAGGED_SELF_REPORTED_EV}
        asPill={false}
      />,
    );
    const warningSpan = screen.getByText('⚠');
    expect(warningSpan).toBeInTheDocument();
    expect(warningSpan.getAttribute('title')).toBe('دليل مُحدَّد يتطلب مراجعة');
  });

  it('renders ⚠ with English warning title for self_reported flagged evidence (asPill=false, lang=en)', () => {
    render(
      <ConfidenceTierBadge
        lang="en"
        evidence={FLAGGED_SELF_REPORTED_EV}
        asPill={false}
      />,
    );
    const warningSpan = screen.getByText('⚠');
    expect(warningSpan).toBeInTheDocument();
    expect(warningSpan.getAttribute('title')).toBe('Flagged evidence — review recommended');
  });
});

/* ════════════════════════════════════════════════════════════════════════════
   Task 855 — inline Arabic badge for mixed-tier evidence
   The inline (asPill=false) path must render the correct Arabic label even
   when the segment has multiple records of different tiers.
════════════════════════════════════════════════════════════════════════════ */

/** Mixed-tier: one self_reported + one consultant_validated — tier = consultant_validated */
const MIXED_CV_SR: EvidenceRecord[] = [
  {
    id: 50, segId: 'strategy', subSegId: 'ss1', subSegLabel: 'SS1',
    originalFilename: 'cv.pdf', mimeType: 'application/pdf',
    confidenceTier: 'consultant_validated',
    aiEvaluation: null,
  },
  {
    id: 51, segId: 'strategy', subSegId: 'ss2', subSegLabel: 'SS2',
    originalFilename: 'sr.pdf', mimeType: 'application/pdf',
    confidenceTier: 'self_reported',
    aiEvaluation: null,
  },
];

/** Mixed-tier: one self_reported + one ai_evaluated — tier = ai_evaluated */
const MIXED_AI_SR: EvidenceRecord[] = [
  {
    id: 52, segId: 'strategy', subSegId: 'ss1', subSegLabel: 'SS1',
    originalFilename: 'ai.pdf', mimeType: 'application/pdf',
    confidenceTier: 'ai_evaluated',
    aiEvaluation: { plausible_support: true, confidence: 'high', flag_reason: null, summary: '' },
  },
  {
    id: 53, segId: 'strategy', subSegId: 'ss2', subSegLabel: 'SS2',
    originalFilename: 'sr.pdf', mimeType: 'application/pdf',
    confidenceTier: 'self_reported',
    aiEvaluation: null,
  },
];

describe('ConfidenceTierBadge — inline Arabic label for mixed-tier evidence (Task 855)', () => {
  afterEach(() => cleanup());

  it('inline Arabic label is "مُعتمَد من الاستشاري" for consultant_validated+self_reported mix', () => {
    render(<ConfidenceTierBadge lang="ar" evidence={MIXED_CV_SR} asPill={false} />);
    expect(screen.getByText('مُعتمَد من الاستشاري')).toBeInTheDocument();
    expect(screen.queryByText('مُبلَّغ ذاتياً')).toBeNull();
  });

  it('inline Arabic label is "مُقيَّم بالذكاء الاصطناعي" for ai_evaluated+self_reported mix', () => {
    render(<ConfidenceTierBadge lang="ar" evidence={MIXED_AI_SR} asPill={false} />);
    expect(screen.getByText('مُقيَّم بالذكاء الاصطناعي')).toBeInTheDocument();
    expect(screen.queryByText('مُبلَّغ ذاتياً')).toBeNull();
  });
});

/* ════════════════════════════════════════════════════════════════════════════
   Task 858 — stronger inline assertions for ai_evaluated and consultant_validated
   The inline span must carry the tier-specific text-colour class.
════════════════════════════════════════════════════════════════════════════ */

describe('ConfidenceTierBadge — inline tier-specific classes (Task 858)', () => {
  afterEach(() => cleanup());

  it('ai_evaluated inline span carries text-blue-800', () => {
    render(<ConfidenceTierBadge lang="en" evidence={FLAGGED_AI_EVALUATED_EV} asPill={false} />);
    const span = screen.getByText('AI-evaluated').closest('span') as HTMLElement;
    expect(span.className).toContain('text-blue-800');
  });

  it('consultant_validated inline span carries text-amber-800', () => {
    render(<ConfidenceTierBadge lang="en" evidence={FLAGGED_CONSULTANT_EV} asPill={false} />);
    const span = screen.getByText('Consultant-validated').closest('span') as HTMLElement;
    expect(span.className).toContain('text-amber-800');
  });

  it('self_reported inline span carries text-slate-600 (baseline sanity)', () => {
    render(<ConfidenceTierBadge lang="en" evidence={FLAGGED_SELF_REPORTED_EV} asPill={false} />);
    const span = screen.getByText('Self-reported').closest('span') as HTMLElement;
    expect(span.className).toContain('text-slate-600');
  });
});

/* ════════════════════════════════════════════════════════════════════════════
   Task 862 — inline badge for consultant_validated has no rounded-full class
════════════════════════════════════════════════════════════════════════════ */

describe('ConfidenceTierBadge — inline mode has no pill styling for consultant_validated (Task 862)', () => {
  afterEach(() => cleanup());

  it('consultant_validated inline badge has no rounded-full class', () => {
    const { container } = render(
      <ConfidenceTierBadge lang="en" evidence={CLEAN_CONSULTANT_EV} asPill={false} />,
    );
    // The rendered span must not carry pill/bubble styling
    const spans = container.querySelectorAll('span');
    spans.forEach(s => {
      expect(s.className).not.toContain('rounded-full');
    });
  });

  it('consultant_validated inline badge carries font-semibold (inline structural class)', () => {
    const { container } = render(
      <ConfidenceTierBadge lang="en" evidence={CLEAN_CONSULTANT_EV} asPill={false} />,
    );
    const outerSpan = container.querySelector('span') as HTMLElement;
    expect(outerSpan.className).toContain('font-semibold');
  });
});

/* ════════════════════════════════════════════════════════════════════════════
   Task 863 — ⚠ flag overlay in inline mode for consultant_validated (English)
════════════════════════════════════════════════════════════════════════════ */

describe('ConfidenceTierBadge — ⚠ overlay in inline mode for flagged consultant_validated (Task 863)', () => {
  afterEach(() => cleanup());

  it('renders ⚠ in inline mode when consultant_validated evidence is flagged (English)', () => {
    render(<ConfidenceTierBadge lang="en" evidence={FLAGGED_CONSULTANT_EV} asPill={false} />);
    expect(screen.getByText('⚠')).toBeInTheDocument();
  });

  it('⚠ span carries the English warning title in inline mode for consultant_validated', () => {
    render(<ConfidenceTierBadge lang="en" evidence={FLAGGED_CONSULTANT_EV} asPill={false} />);
    const warningSpan = screen.getByText('⚠');
    expect(warningSpan.getAttribute('title')).toBe('Flagged evidence — review recommended');
  });

  it('no ⚠ appears in inline mode for a clean (non-flagged) consultant_validated record', () => {
    render(<ConfidenceTierBadge lang="en" evidence={CLEAN_CONSULTANT_EV} asPill={false} />);
    expect(screen.queryByText('⚠')).toBeNull();
  });
});
