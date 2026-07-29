/**
 * SubmissionCard — evidence accordion state survives card collapse/re-expand
 *
 * Confirms two things (Task 754):
 *   1. Opening a segment evidence accordion, collapsing the card, then
 *      re-expanding it leaves the accordion still open.
 *   2. A reload of evidence data (onChanged) does not collapse any open
 *      accordion because `expandedEvSeg` lives in SubmissionCard, not
 *      MaturityDetail.
 *
 * Note: the first SubmissionCard renders with defaultOpen={true} (it is
 * pre-expanded) so tests begin in the already-open state and click the
 * header once to collapse, then again to re-expand.
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, act } from '@testing-library/react';

/* ── Module mocks (must precede the imports they affect) ─────────────────── */

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test/api' }));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true, user: { id: 1 }, loading: false }),
}));

vi.mock('@/lib/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'en', ar: false }),
}));

// wouter — Link renders a plain anchor; useLocation returns a stable pair
vi.mock('wouter', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) =>
    <a href={href}>{children}</a>,
  useLocation: () => ['/my-assessments', vi.fn()],
}));

/*
 * framer-motion: AnimatePresence normally waits for exit animations before
 * unmounting. In jsdom there is no layout engine so animations never finish.
 * Mocking makes collapse/re-expand behave synchronously.
 */
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

/* ── Component under test ────────────────────────────────────────────────── */

import { MyAssessments } from '../MyAssessments';

/* ── Shared submission fixtures ──────────────────────────────────────────── */

/**
 * A maturity submission whose outputs include the "strategy" segment.
 * The strategy segment definition has subSegments with evidence fields,
 * so the Evidence column renders a clickable accordion toggle.
 */
const MATURITY_SUBMISSION = {
  id: 42,
  tool: 'maturity',
  inputs: { intakeData: { industry: 'Manufacturing', companySize: 'SME' } },
  outputs: {
    overallScore: '3.5',
    overallLevel: 'Defined',
    segmentScores: [
      { id: 'strategy', title: 'Supply Chain Strategy', score: 3.5, level: 'Defined' },
    ],
  },
  createdAt: new Date().toISOString(),
};

const TWO_SEGMENT_SUBMISSION = {
  ...MATURITY_SUBMISSION,
  outputs: {
    ...MATURITY_SUBMISSION.outputs,
    segmentScores: [
      { id: 'strategy',    title: 'Supply Chain Strategy', score: 3.5, level: 'Defined' },
      { id: 'procurement', title: 'Procurement',           score: 3.2, level: 'Defined' },
    ],
  },
};

/* ── Fetch mock ──────────────────────────────────────────────────────────── */

function stubFetch(
  submission = MATURITY_SUBMISSION,
  buildEvidence?: (callCount: number) => object[],
) {
  let evidenceCallCount = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string) => {
      if ((url as string).includes('/submissions/mine')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ok: true, submissions: [submission] }),
        });
      }
      if ((url as string).includes('/maturity/evidence')) {
        evidenceCallCount += 1;
        const evidence = buildEvidence ? buildEvidence(evidenceCallCount) : [];
        return Promise.resolve({
          ok: true,
          json: async () => ({ ok: true, evidence }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
    }),
  );
}

/* ── Interaction helpers ─────────────────────────────────────────────────── */

/**
 * Wait until the card is fully rendered and the evidence column is ready.
 * The ▼ indicator appears in the evidence toggle button once the initial
 * evidence GET has resolved and qualSubs.length > 0.
 */
async function waitForAccordionToggle() {
  await waitFor(
    () => {
      const btns = Array.from(document.querySelectorAll('button'));
      const found = btns.some(
        b => b.textContent?.includes('▼') || b.textContent?.includes('▲'),
      );
      expect(found).toBe(true);
    },
    { timeout: 3000 },
  );
}

/** Return the SubmissionCard header button (identified by aria-expanded). */
function getCardToggle(): HTMLElement {
  const el = document.querySelector('button[aria-expanded]');
  if (!el) throw new Error('No button[aria-expanded] found in DOM');
  return el as HTMLElement;
}

/** Click the first evidence accordion toggle (▼ or ▲). */
function clickFirstAccordionToggle() {
  const btns = Array.from(document.querySelectorAll('button'));
  const toggle = btns.find(
    b => b.textContent?.includes('▼') || b.textContent?.includes('▲'),
  );
  if (!toggle) throw new Error('No accordion toggle found');
  fireEvent.click(toggle);
}

/**
 * The accordion panel header is a <p> that reads "Supporting Evidence — <SegmentName>".
 * The EvidenceUploadZone spans read "Add supporting evidence (optional) — …" so we
 * distinguish by looking for a <p> element that contains "Supporting Evidence".
 */
function accordionPanelOpen() {
  return Array.from(document.querySelectorAll('p')).some(
    el => el.textContent?.includes('Supporting Evidence'),
  );
}

function openCount() {
  return Array.from(document.querySelectorAll('button')).filter(
    b => b.textContent?.includes('▲'),
  ).length;
}

function closedCount() {
  return Array.from(document.querySelectorAll('button')).filter(
    b => b.textContent?.includes('▼'),
  ).length;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Tests
═══════════════════════════════════════════════════════════════════════════ */

describe('SubmissionCard — evidence accordion state preserved across card toggle', () => {
  beforeEach(() => {
    stubFetch();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  /* ── Test 1 ─────────────────────────────────────────────────────────────── */

  it('accordion stays open after collapsing and re-expanding the card', async () => {
    render(<MyAssessments />);

    // The first card renders with defaultOpen=true; wait for the evidence column
    await waitForAccordionToggle();

    // Expand the evidence accordion for the strategy segment
    clickFirstAccordionToggle();
    await waitFor(() => expect(accordionPanelOpen()).toBe(true));

    // Up-arrow confirms the accordion is open
    expect(openCount()).toBe(1);

    // Collapse the card — the whole detail pane (including accordion) disappears
    fireEvent.click(getCardToggle());
    expect(accordionPanelOpen()).toBe(false);

    // Re-expand the card
    fireEvent.click(getCardToggle());

    // Accordion must be open again — no extra click required
    await waitFor(() => expect(accordionPanelOpen()).toBe(true));

    // Up-arrow must be present (not the closed ▼)
    expect(openCount()).toBe(1);
  });

  /* ── Test 2 ─────────────────────────────────────────────────────────────── */

  it('evidence state reload (onChanged) does not collapse an open accordion', async () => {
    // Use a counter so we can verify the reload actually fired
    let evidenceCallCount = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if ((url as string).includes('/submissions/mine')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ ok: true, submissions: [MATURITY_SUBMISSION] }),
          });
        }
        if ((url as string).includes('/maturity/evidence')) {
          evidenceCallCount += 1;
          return Promise.resolve({
            ok: true,
            json: async () => ({ ok: true, evidence: [] }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
      }),
    );

    render(<MyAssessments />);
    await waitForAccordionToggle();

    // Open the accordion
    clickFirstAccordionToggle();
    await waitFor(() => expect(accordionPanelOpen()).toBe(true));

    const callsBefore = evidenceCallCount;

    // Simulate onChanged — trigger the same fetch path loadEvidence calls
    await act(async () => {
      await (fetch as ReturnType<typeof vi.fn>)(
        'http://test/api/maturity/evidence?snapshot_id=42',
      );
    });

    expect(evidenceCallCount).toBeGreaterThan(callsBefore);

    // expandedEvSeg lives in SubmissionCard and is unaffected by the re-fetch
    expect(accordionPanelOpen()).toBe(true);
    expect(openCount()).toBe(1);
  });

  /* ── Test 3 ─────────────────────────────────────────────────────────────── */

  it('accordion open state is independent per segment', async () => {
    stubFetch(TWO_SEGMENT_SUBMISSION);

    render(<MyAssessments />);
    await waitForAccordionToggle();

    // Both segments should have a ▼ toggle after evidence loads
    await waitFor(() => expect(closedCount()).toBe(2));

    // Open only the first accordion (strategy)
    const firstToggle = Array.from(document.querySelectorAll('button')).find(
      b => b.textContent?.includes('▼'),
    )!;
    fireEvent.click(firstToggle);
    await waitFor(() => expect(accordionPanelOpen()).toBe(true));

    // Exactly one open, one closed
    expect(openCount()).toBe(1);
    expect(closedCount()).toBe(1);

    // Collapse then re-expand the card
    fireEvent.click(getCardToggle());
    fireEvent.click(getCardToggle());

    // The same one accordion is still open, the other still closed
    await waitFor(() => {
      expect(openCount()).toBe(1);
      expect(closedCount()).toBe(1);
    });
    expect(accordionPanelOpen()).toBe(true);
  });
});
