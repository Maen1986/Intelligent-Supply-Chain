/**
 * Task 866 — Confirm the ⚠ flag tooltip text switches to Arabic when the
 * language is toggled.
 *
 * ConfidenceTierBadge renders a `title` attribute on the pill wrapper when
 * the evidence is flagged (hasFlag()=true). This test confirms:
 *  - In English mode the title is "Flagged evidence — review recommended"
 *  - In Arabic mode the title is "دليل مُحدَّد يتطلب مراجعة"
 *
 * The test uses both the `lang="en"` and `lang="ar"` prop paths, and also
 * verifies the text changes when the component is re-rendered with a
 * different `lang` value (simulating a language-toggle).
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { ConfidenceTierBadge } from './ConfidenceTierBadge';
import type { EvidenceRecord } from '@/lib/types';

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function makeFlaggedAiEvidence(): EvidenceRecord[] {
  return [
    {
      id: 'ev-1',
      segmentId: 'strategy',
      fileUrl: 'https://example.com/ev.pdf',
      fileName: 'ev.pdf',
      fileSize: 1024,
      uploadedAt: '2025-01-01T00:00:00Z',
      tier: 'ai_evaluated',
      aiEvaluation: {
        tier: 'ai_evaluated',
        explanation: 'Marginal support',
        plausible_support: false, // flagged = true because plausible_support is false
        relevant_quote: '',
      },
    } as EvidenceRecord,
  ];
}

beforeEach(() => {
  /* nothing needed */
});

afterEach(() => {
  cleanup();
});

describe('ConfidenceTierBadge — ⚠ flag tooltip switches language (Task 866)', () => {
  it('English tooltip: "Flagged evidence — review recommended" when lang=en', () => {
    const { container } = render(
      <ConfidenceTierBadge lang="en" evidence={makeFlaggedAiEvidence()} />,
    );

    // The pill wrapper should carry the English title attribute
    const pill = container.querySelector('[title]');
    expect(pill).not.toBeNull();
    expect(pill!.getAttribute('title')).toBe('Flagged evidence — review recommended');
  });

  it('Arabic tooltip: "دليل مُحدَّد يتطلب مراجعة" when lang=ar', () => {
    const { container } = render(
      <ConfidenceTierBadge lang="ar" evidence={makeFlaggedAiEvidence()} />,
    );

    const pill = container.querySelector('[title]');
    expect(pill).not.toBeNull();
    expect(pill!.getAttribute('title')).toBe('دليل مُحدَّد يتطلب مراجعة');
  });

  it('tooltip changes when lang prop switches from en to ar (language toggle simulation)', () => {
    const { container, rerender } = render(
      <ConfidenceTierBadge lang="en" evidence={makeFlaggedAiEvidence()} />,
    );

    // Before toggle — English title
    expect(container.querySelector('[title]')!.getAttribute('title')).toBe(
      'Flagged evidence — review recommended',
    );

    // Simulate language toggle to Arabic
    rerender(<ConfidenceTierBadge lang="ar" evidence={makeFlaggedAiEvidence()} />);

    // After toggle — Arabic title
    expect(container.querySelector('[title]')!.getAttribute('title')).toBe(
      'دليل مُحدَّد يتطلب مراجعة',
    );
  });

  it('non-flagged evidence has no title attribute (no tooltip shown)', () => {
    const nonFlagged: EvidenceRecord[] = [
      {
        id: 'ev-2',
        segmentId: 'strategy',
        fileUrl: 'https://example.com/ev2.pdf',
        fileName: 'ev2.pdf',
        fileSize: 1024,
        uploadedAt: '2025-01-01T00:00:00Z',
        tier: 'ai_evaluated',
        aiEvaluation: {
          tier: 'ai_evaluated',
          explanation: 'Strong support',
          plausible_support: true, // not flagged
          relevant_quote: 'Direct evidence',
        },
      } as EvidenceRecord,
    ];

    const { container } = render(
      <ConfidenceTierBadge lang="en" evidence={nonFlagged} />,
    );

    // Pill must not carry a flag tooltip when evidence is not flagged
    const pill = container.querySelector('[title="Flagged evidence — review recommended"]');
    expect(pill).toBeNull();
  });
});
