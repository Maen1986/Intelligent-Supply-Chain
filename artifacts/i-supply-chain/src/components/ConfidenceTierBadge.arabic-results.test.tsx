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
