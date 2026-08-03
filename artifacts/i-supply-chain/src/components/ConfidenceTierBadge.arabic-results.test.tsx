/**
 * Task 783 — ConfidenceTierBadge: Arabic labels on the results page segment
 * card headers.
 *
 * The badge is rendered with `asPill={true}` and `lang="ar"` inside each
 * per-segment card header on the Maturity results page.  These tests confirm:
 *
 *  1. The self_reported tier shows 'مُبلَّغ ذاتياً' (not the English label)
 *     in Arabic mode.
 *  2. The ai_evaluated tier shows 'مُقيَّم بالذكاء الاصطناعي' in Arabic mode.
 *  3. The consultant_validated tier shows 'مُعتمَد من الاستشاري' in Arabic mode.
 *  4. None of the English labels leak through in Arabic mode for any tier.
 *  5. All three Arabic badges render as pills (rounded-full) — the same shape
 *     used in the card header score row.
 */

import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ConfidenceTierBadge } from './ConfidenceTierBadge';
import type { EvidenceRecord } from './EvidenceUploadZone';

/* ── Evidence fixtures ───────────────────────────────────────────────────── */

const SELF_REPORTED_EV: EvidenceRecord[] = [
  {
    id: 1,
    segId: 'strategy',
    subSegId: 'strategy-align',
    subSegLabel: 'Strategy doc',
    originalFilename: 'doc.pdf',
    mimeType: 'application/pdf',
    confidenceTier: 'self_reported',
    aiEvaluation: null,
  },
];

const AI_EVALUATED_EV: EvidenceRecord[] = [
  {
    id: 2,
    segId: 'strategy',
    subSegId: 'strategy-align',
    subSegLabel: 'Strategy doc',
    originalFilename: 'doc.pdf',
    mimeType: 'application/pdf',
    confidenceTier: 'ai_evaluated',
    aiEvaluation: { plausible_support: true, confidence: 'high', flag_reason: null, summary: 'ok' },
  },
];

const CONSULTANT_VALIDATED_EV: EvidenceRecord[] = [
  {
    id: 3,
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
   Arabic label rendering — as rendered in the results page card header
════════════════════════════════════════════════════════════════════════════ */

describe('ConfidenceTierBadge — Arabic labels in results page card header (asPill, lang="ar")', () => {
  afterEach(() => cleanup());

  /* ── Test 1 ──────────────────────────────────────────────────────────────
     self_reported tier must show the Arabic label 'مُبلَّغ ذاتياً'.
  ─────────────────────────────────────────────────────────────────────────── */
  it('shows "مُبلَّغ ذاتياً" for self_reported tier in Arabic mode', () => {
    render(<ConfidenceTierBadge lang="ar" evidence={SELF_REPORTED_EV} asPill />);
    expect(screen.getByText('مُبلَّغ ذاتياً')).toBeInTheDocument();
  });

  /* ── Test 2 ──────────────────────────────────────────────────────────────
     ai_evaluated tier must show the Arabic label 'مُقيَّم بالذكاء الاصطناعي'.
  ─────────────────────────────────────────────────────────────────────────── */
  it('shows "مُقيَّم بالذكاء الاصطناعي" for ai_evaluated tier in Arabic mode', () => {
    render(<ConfidenceTierBadge lang="ar" evidence={AI_EVALUATED_EV} asPill />);
    expect(screen.getByText('مُقيَّم بالذكاء الاصطناعي')).toBeInTheDocument();
  });

  /* ── Test 3 ──────────────────────────────────────────────────────────────
     consultant_validated tier must show 'مُعتمَد من الاستشاري'.
  ─────────────────────────────────────────────────────────────────────────── */
  it('shows "مُعتمَد من الاستشاري" for consultant_validated tier in Arabic mode', () => {
    render(<ConfidenceTierBadge lang="ar" evidence={CONSULTANT_VALIDATED_EV} asPill />);
    expect(screen.getByText('مُعتمَد من الاستشاري')).toBeInTheDocument();
  });

  /* ── Test 4 ──────────────────────────────────────────────────────────────
     No English label must appear for any tier when lang="ar".
  ─────────────────────────────────────────────────────────────────────────── */
  it('does not show "Self-reported" in Arabic mode', () => {
    render(<ConfidenceTierBadge lang="ar" evidence={SELF_REPORTED_EV} asPill />);
    expect(screen.queryByText('Self-reported')).toBeNull();
  });

  it('does not show "AI-evaluated" in Arabic mode', () => {
    render(<ConfidenceTierBadge lang="ar" evidence={AI_EVALUATED_EV} asPill />);
    expect(screen.queryByText('AI-evaluated')).toBeNull();
  });

  it('does not show "Consultant-validated" in Arabic mode', () => {
    render(<ConfidenceTierBadge lang="ar" evidence={CONSULTANT_VALIDATED_EV} asPill />);
    expect(screen.queryByText('Consultant-validated')).toBeNull();
  });

  /* ── Test 5 ──────────────────────────────────────────────────────────────
     All three Arabic badges must render as pills (rounded-full), matching
     the asPill shape used in the card header score row.
  ─────────────────────────────────────────────────────────────────────────── */
  it('renders the Arabic self-reported badge as a pill (rounded-full)', () => {
    render(<ConfidenceTierBadge lang="ar" evidence={SELF_REPORTED_EV} asPill />);
    const badge = screen.getByText('مُبلَّغ ذاتياً');
    expect(badge.className).toContain('rounded-full');
  });

  it('renders the Arabic ai_evaluated badge as a pill (rounded-full)', () => {
    render(<ConfidenceTierBadge lang="ar" evidence={AI_EVALUATED_EV} asPill />);
    const badge = screen.getByText('مُقيَّم بالذكاء الاصطناعي');
    expect(badge.className).toContain('rounded-full');
  });

  it('renders the Arabic consultant_validated badge as a pill (rounded-full)', () => {
    render(<ConfidenceTierBadge lang="ar" evidence={CONSULTANT_VALIDATED_EV} asPill />);
    const badge = screen.getByText('مُعتمَد من الاستشاري');
    expect(badge.className).toContain('rounded-full');
  });
});

/* ════════════════════════════════════════════════════════════════════════════
   Task 832 — ⚠ overlay for ai_evaluated and self_reported tiers in Arabic
   pill mode (asPill=true, lang="ar").
   Task 793 covered consultant_validated; the same hasFlag() path fires for
   all three tiers.
════════════════════════════════════════════════════════════════════════════ */

/**
 * ai_evaluated tier with a flagged sub-segment (second record has
 * plausible_support:false → hasFlag returns true).
 */
const FLAGGED_AI_EV_AR: EvidenceRecord[] = [
  {
    id: 10, segId: 'strategy', subSegId: 'strategy-align', subSegLabel: 'Strategy doc',
    originalFilename: 'ai-good.pdf', mimeType: 'application/pdf',
    confidenceTier: 'ai_evaluated',
    aiEvaluation: { plausible_support: true, confidence: 'high', flag_reason: null, summary: 'Good' },
  },
  {
    id: 11, segId: 'strategy', subSegId: 'strategy-align2', subSegLabel: 'Strategy doc 2',
    originalFilename: 'ai-bad.pdf', mimeType: 'application/pdf',
    confidenceTier: 'ai_evaluated',
    aiEvaluation: { plausible_support: false, confidence: 'low', flag_reason: 'scope mismatch', summary: '' },
  },
];

/**
 * self_reported tier with a flagged evaluation.
 */
const FLAGGED_SR_EV_AR: EvidenceRecord[] = [
  {
    id: 12, segId: 'strategy', subSegId: 'strategy-align', subSegLabel: 'Strategy doc',
    originalFilename: 'sr-flagged.pdf', mimeType: 'application/pdf',
    confidenceTier: 'self_reported',
    aiEvaluation: { plausible_support: false, confidence: 'low', flag_reason: 'unrelated', summary: '' },
  },
];

describe('ConfidenceTierBadge — ⚠ overlay in Arabic pill mode for ai_evaluated and self_reported (Task 832)', () => {
  afterEach(() => cleanup());

  it('shows ⚠ in the pill for flagged ai_evaluated evidence in Arabic mode', () => {
    render(<ConfidenceTierBadge lang="ar" evidence={FLAGGED_AI_EV_AR} asPill />);
    expect(screen.getByText('⚠')).toBeInTheDocument();
  });

  it('pill carries Arabic title attribute for flagged ai_evaluated in Arabic mode', () => {
    const { container } = render(<ConfidenceTierBadge lang="ar" evidence={FLAGGED_AI_EV_AR} asPill />);
    const pill = container.querySelector('span.rounded-full') as HTMLElement;
    expect(pill).not.toBeNull();
    expect(pill.getAttribute('title')).toBe('دليل مُحدَّد يتطلب مراجعة');
  });

  it('shows ⚠ in the pill for flagged self_reported evidence in Arabic mode', () => {
    render(<ConfidenceTierBadge lang="ar" evidence={FLAGGED_SR_EV_AR} asPill />);
    expect(screen.getByText('⚠')).toBeInTheDocument();
  });

  it('pill carries Arabic title attribute for flagged self_reported in Arabic mode', () => {
    const { container } = render(<ConfidenceTierBadge lang="ar" evidence={FLAGGED_SR_EV_AR} asPill />);
    const pill = container.querySelector('span.rounded-full') as HTMLElement;
    expect(pill).not.toBeNull();
    expect(pill.getAttribute('title')).toBe('دليل مُحدَّد يتطلب مراجعة');
  });

  it('no ⚠ appears in the Arabic pill when evidence is not flagged (ai_evaluated, Task 832)', () => {
    render(<ConfidenceTierBadge lang="ar" evidence={AI_EVALUATED_EV} asPill />);
    expect(screen.queryByText('⚠')).toBeNull();
  });
});

/* ════════════════════════════════════════════════════════════════════════════
   Task 854 — Arabic ⚠ overlay for mixed-tier evidence with a flagged record.
   When one record is ai_evaluated with plausible_support:false alongside
   a consultant_validated winner, the ⚠ overlay must still appear in Arabic.
════════════════════════════════════════════════════════════════════════════ */

const MIXED_TIER_WITH_FLAG_AR: EvidenceRecord[] = [
  {
    id: 20, segId: 'strategy', subSegId: 'strategy-align', subSegLabel: 'Strategy doc',
    originalFilename: 'cv.pdf', mimeType: 'application/pdf',
    confidenceTier: 'consultant_validated',
    aiEvaluation: null,
  },
  {
    id: 21, segId: 'strategy', subSegId: 'strategy-align2', subSegLabel: 'Strategy doc 2',
    originalFilename: 'ai-flagged.pdf', mimeType: 'application/pdf',
    confidenceTier: 'ai_evaluated',
    aiEvaluation: { plausible_support: false, confidence: 'low', flag_reason: 'scope mismatch', summary: '' },
  },
];

describe('ConfidenceTierBadge — Arabic ⚠ for mixed-tier with flagged record (Task 854)', () => {
  afterEach(() => cleanup());

  it('shows ⚠ in Arabic pill when a flagged ai_evaluated record accompanies a consultant_validated winner', () => {
    render(<ConfidenceTierBadge lang="ar" evidence={MIXED_TIER_WITH_FLAG_AR} asPill />);
    // Tier is consultant_validated (wins), but hasFlag is true → ⚠ must appear
    expect(screen.getByText('مُعتمَد من الاستشاري')).toBeInTheDocument();
    expect(screen.getByText('⚠')).toBeInTheDocument();
  });

  it('pill carries the Arabic flag title in mixed-tier + flagged scenario', () => {
    const { container } = render(
      <ConfidenceTierBadge lang="ar" evidence={MIXED_TIER_WITH_FLAG_AR} asPill />,
    );
    const pill = container.querySelector('span.rounded-full') as HTMLElement;
    expect(pill.getAttribute('title')).toBe('دليل مُحدَّد يتطلب مراجعة');
  });
});
