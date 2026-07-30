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
