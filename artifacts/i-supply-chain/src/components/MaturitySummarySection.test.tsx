/**
 * Tests for MaturitySummarySection
 *
 * Covers:
 *  - EN render: score, level badge, top-3 segments, coverage bar, roadmap table
 *  - AR render: Arabic labels, RTL dir attribute, Arabic level/segment labels
 *  - Level badge colour reflects maturity score (smoke test via text)
 *  - Coverage indicator hidden when coveragePct is undefined
 *  - Roadmap hidden when no remedies are provided
 *  - Roadmap table headers shown in both languages
 *  - GCC gap note rendered for weakest segments that have gccAvg
 *  - Segment with no titleAr falls back to English title in AR mode
 *  - SVG radar renders (aria-hidden, non-null)
 *  - 0-item roadmap phases show "No actions" / fallback text
 */

import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { MaturitySummarySection, type MSSContext } from './MaturitySummarySection';

afterEach(cleanup);

/* ── Fixtures ────────────────────────────────────────────────────────────── */

const BASE_SEGS = [
  { id: 'strategy',    title: 'Strategy',    titleAr: 'الاستراتيجية', score: 1.8, level: 'Aware',    levelAr: 'مُدرِك',  gccAvg: 2.3, bestClass: 4.4 },
  { id: 'procurement', title: 'Procurement', titleAr: 'المشتريات',    score: 2.2, level: 'Aware',    levelAr: 'مُدرِك',  gccAvg: 2.3, bestClass: 4.4 },
  { id: 'logistics',   title: 'Logistics',   titleAr: 'اللوجستيات',   score: 3.5, level: 'Managed',  levelAr: 'مُدار',   gccAvg: 2.5, bestClass: 4.2 },
  { id: 'inventory',   title: 'Inventory',   titleAr: 'المخزون',      score: 4.0, level: 'Managed',  levelAr: 'مُدار',   gccAvg: 2.6, bestClass: 4.5 },
  { id: 'digital',     title: 'Digital',     titleAr: 'الرقمنة',      score: 2.8, level: 'Defined',  levelAr: 'مُعرَّف', gccAvg: 2.1, bestClass: 4.6 },
];

const REMEDIES = {
  days30: [
    { segmentTitle: 'Strategy', action: 'Map current procurement workflows', framework: 'SCOR', effort: 'Low' },
    { segmentTitle: 'Procurement', action: 'Conduct supplier risk assessment', framework: 'ISO31000' },
  ],
  days60: [
    { segmentTitle: 'Logistics', action: 'Implement demand sensing pilot', effort: 'Medium' },
  ],
  days90: [
    { segmentTitle: 'Digital', action: 'Deploy ERP integration roadmap' },
    { segmentTitle: 'Inventory', action: 'Launch cycle counting programme', framework: 'APICS' },
  ],
};

function makeContext(overrides: Partial<MSSContext> = {}): MSSContext {
  return {
    overallScore:   2.86,
    overallLevel:   'Defined',
    overallLevelAr: 'مُعرَّف',
    segmentScores:  BASE_SEGS,
    remedies:       REMEDIES,
    coveragePct:    72.5,
    ...overrides,
  };
}

/* ── English mode ────────────────────────────────────────────────────────── */

describe('MaturitySummarySection — English (default)', () => {
  it('renders the container with correct dir attribute (ltr)', () => {
    render(<MaturitySummarySection maturity={makeContext()} />);
    const container = screen.getByTestId('maturity-summary-section');
    expect(container.getAttribute('dir')).toBe('ltr');
  });

  it('displays the overall level badge in English', () => {
    render(<MaturitySummarySection maturity={makeContext()} />);
    expect(screen.getByTestId('mss-level-badge').textContent).toBe('Defined');
  });

  it('displays the overall score formatted to 1 decimal', () => {
    render(<MaturitySummarySection maturity={makeContext()} />);
    // Score is shown inside the score circle
    expect(screen.getByText('2.9')).toBeTruthy();
  });

  it('renders top-3 weakest segment slots', () => {
    render(<MaturitySummarySection maturity={makeContext()} />);
    // Top 3 weakest by score: Strategy (1.8), Procurement (2.2), Digital (2.8)
    expect(screen.getByTestId('mss-weak-segment-0')).toBeTruthy();
    expect(screen.getByTestId('mss-weak-segment-1')).toBeTruthy();
    expect(screen.getByTestId('mss-weak-segment-2')).toBeTruthy();
    expect(screen.queryByTestId('mss-weak-segment-3')).toBeNull();
  });

  it('shows the weakest segment title (English) in rank 0 slot', () => {
    render(<MaturitySummarySection maturity={makeContext()} />);
    const slot = screen.getByTestId('mss-weak-segment-0');
    expect(slot.textContent).toContain('Strategy');
  });

  it('shows GCC gap for segments with gccAvg', () => {
    render(<MaturitySummarySection maturity={makeContext()} />);
    // Strategy: score 1.8, gccAvg 2.3, gap = -0.5
    expect(screen.getAllByText(/GCC gap:/i).length).toBeGreaterThan(0);
  });

  it('renders the coverage indicator when coveragePct is provided', () => {
    render(<MaturitySummarySection maturity={makeContext()} />);
    expect(screen.getByTestId('mss-coverage')).toBeTruthy();
    expect(screen.getByTestId('mss-coverage').textContent).toContain('73');
  });

  it('hides the coverage indicator when coveragePct is undefined', () => {
    render(<MaturitySummarySection maturity={makeContext({ coveragePct: undefined })} />);
    expect(screen.queryByTestId('mss-coverage')).toBeNull();
  });

  it('renders the 30/60/90 roadmap when remedies are present', () => {
    render(<MaturitySummarySection maturity={makeContext()} />);
    expect(screen.getByTestId('mss-roadmap')).toBeTruthy();
  });

  it('shows English phase headers in the roadmap', () => {
    render(<MaturitySummarySection maturity={makeContext()} />);
    expect(screen.getByText('Days 0–30')).toBeTruthy();
    expect(screen.getByText('Days 31–60')).toBeTruthy();
    expect(screen.getByText('Days 61–90')).toBeTruthy();
  });

  it('renders action text from days30 remedies', () => {
    render(<MaturitySummarySection maturity={makeContext()} />);
    expect(screen.getByText('Map current procurement workflows')).toBeTruthy();
  });

  it('renders framework badge when framework is present', () => {
    render(<MaturitySummarySection maturity={makeContext()} />);
    expect(screen.getByText('SCOR')).toBeTruthy();
  });

  it('hides roadmap when remedies are absent', () => {
    render(<MaturitySummarySection maturity={makeContext({ remedies: undefined })} />);
    expect(screen.queryByTestId('mss-roadmap')).toBeNull();
  });

  it('shows "No actions" placeholder for empty phase', () => {
    const ctx = makeContext({ remedies: { days30: [], days60: [], days90: [] } });
    render(<MaturitySummarySection maturity={ctx} />);
    // roadmap still renders (even with empty arrays)
    expect(screen.getAllByText('No actions').length).toBe(3);
  });

  it('renders the SVG radar element', () => {
    const { container } = render(<MaturitySummarySection maturity={makeContext()} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg!.getAttribute('aria-hidden')).toBe('true');
  });
});

/* ── Arabic mode ─────────────────────────────────────────────────────────── */

describe('MaturitySummarySection — Arabic (isAr=true)', () => {
  it('sets dir="rtl" on the container', () => {
    render(<MaturitySummarySection maturity={makeContext()} isAr />);
    expect(screen.getByTestId('maturity-summary-section').getAttribute('dir')).toBe('rtl');
  });

  it('displays the Arabic level label from overallLevelAr', () => {
    render(<MaturitySummarySection maturity={makeContext()} isAr />);
    expect(screen.getByTestId('mss-level-badge').textContent).toBe('مُعرَّف');
  });

  it('falls back to overallLevel when overallLevelAr is missing', () => {
    render(<MaturitySummarySection maturity={makeContext({ overallLevelAr: undefined })} isAr />);
    expect(screen.getByTestId('mss-level-badge').textContent).toBe('Defined');
  });

  it('shows Arabic segment title for rank-0 weakest slot', () => {
    render(<MaturitySummarySection maturity={makeContext()} isAr />);
    const slot = screen.getByTestId('mss-weak-segment-0');
    expect(slot.textContent).toContain('الاستراتيجية');
  });

  it('falls back to English title when titleAr is absent (AR mode)', () => {
    const segsNoAr = BASE_SEGS.map(s => ({ ...s, titleAr: undefined }));
    render(<MaturitySummarySection maturity={makeContext({ segmentScores: segsNoAr })} isAr />);
    const slot = screen.getByTestId('mss-weak-segment-0');
    expect(slot.textContent).toContain('Strategy');
  });

  it('shows Arabic phase headers in the roadmap', () => {
    render(<MaturitySummarySection maturity={makeContext()} isAr />);
    expect(screen.getByTestId('mss-roadmap')).toBeTruthy();
    expect(screen.getByText('أول 30 يومًا')).toBeTruthy();
    expect(screen.getByText('31–60 يومًا')).toBeTruthy();
    expect(screen.getByText('61–90 يومًا')).toBeTruthy();
  });

  it('shows Arabic "No actions" fallback in AR mode', () => {
    const ctx = makeContext({ remedies: { days30: [], days60: [], days90: [] } });
    render(<MaturitySummarySection maturity={ctx} isAr />);
    expect(screen.getAllByText('لا توجد إجراءات').length).toBe(3);
  });

  it('shows Arabic coverage label', () => {
    render(<MaturitySummarySection maturity={makeContext()} isAr />);
    expect(screen.getByTestId('mss-coverage').textContent).toContain('تغطية المجالات الفرعية');
  });

  it('shows Arabic segments-assessed label', () => {
    render(<MaturitySummarySection maturity={makeContext()} isAr />);
    expect(screen.getByText(/مجالاً مُقيَّمًا/)).toBeTruthy();
  });
});

/* ── Edge cases ──────────────────────────────────────────────────────────── */

describe('MaturitySummarySection — edge cases', () => {
  it('handles fewer than 3 segments gracefully (shows however many exist)', () => {
    const ctx = makeContext({ segmentScores: BASE_SEGS.slice(0, 2) });
    render(<MaturitySummarySection maturity={ctx} />);
    // Only 2 weakest slots should appear
    expect(screen.getByTestId('mss-weak-segment-0')).toBeTruthy();
    expect(screen.getByTestId('mss-weak-segment-1')).toBeTruthy();
    expect(screen.queryByTestId('mss-weak-segment-2')).toBeNull();
  });

  it('does not render SVG radar when segment count < 3', () => {
    const ctx = makeContext({ segmentScores: BASE_SEGS.slice(0, 2) });
    const { container } = render(<MaturitySummarySection maturity={ctx} />);
    expect(container.querySelector('svg')).toBeNull();
  });

  it('handles segments missing gccAvg (no GCC gap label rendered)', () => {
    const segsNoGcc = BASE_SEGS.map(s => ({ ...s, gccAvg: undefined }));
    render(<MaturitySummarySection maturity={makeContext({ segmentScores: segsNoGcc })} />);
    expect(screen.queryByText(/GCC gap:/i)).toBeNull();
  });
});
