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

/* ── Evidence coverage & tier badges ────────────────────────────────────── */

describe('MaturitySummarySection — evidence coverage row', () => {
  it('renders mss-evidence-coverage when evidencePct is provided', () => {
    render(<MaturitySummarySection maturity={makeContext({ evidencePct: 75 })} />);
    expect(screen.getByTestId('mss-evidence-coverage')).toBeTruthy();
  });

  it('shows the correct rounded percentage in the evidence coverage row', () => {
    render(<MaturitySummarySection maturity={makeContext({ evidencePct: 75.6 })} />);
    const row = screen.getByTestId('mss-evidence-coverage');
    expect(row.textContent).toContain('76');
  });

  it('shows the English "Evidence Coverage" label by default', () => {
    render(<MaturitySummarySection maturity={makeContext({ evidencePct: 50 })} />);
    const row = screen.getByTestId('mss-evidence-coverage');
    expect(row.textContent).toContain('Evidence Coverage');
  });

  it('shows the Arabic "تغطية الأدلة" label when isAr=true', () => {
    render(<MaturitySummarySection maturity={makeContext({ evidencePct: 50 })} isAr />);
    const row = screen.getByTestId('mss-evidence-coverage');
    expect(row.textContent).toContain('تغطية الأدلة');
  });

  it('shows "evidence-backed" suffix in English mode', () => {
    render(<MaturitySummarySection maturity={makeContext({ evidencePct: 40 })} />);
    const row = screen.getByTestId('mss-evidence-coverage');
    expect(row.textContent).toContain('evidence-backed');
  });

  it('shows Arabic "مُوثَّق بأدلة" suffix in Arabic mode', () => {
    render(<MaturitySummarySection maturity={makeContext({ evidencePct: 40 })} isAr />);
    const row = screen.getByTestId('mss-evidence-coverage');
    expect(row.textContent).toContain('مُوثَّق بأدلة');
  });

  it('does not render mss-evidence-coverage when evidencePct is absent', () => {
    render(<MaturitySummarySection maturity={makeContext({ evidencePct: undefined })} />);
    expect(screen.queryByTestId('mss-evidence-coverage')).toBeNull();
  });

  it('renders without crashing when both evidencePct and evidenceTiers are absent', () => {
    render(
      <MaturitySummarySection
        maturity={makeContext({ evidencePct: undefined, evidenceTiers: undefined })}
      />,
    );
    expect(screen.getByTestId('maturity-summary-section')).toBeTruthy();
  });
});

describe('MaturitySummarySection — per-segment tier badges', () => {
  it('renders no tier badges when evidenceTiers is absent', () => {
    render(<MaturitySummarySection maturity={makeContext({ evidenceTiers: undefined })} />);
    // Tier badge labels should not appear in any weak-segment slot
    expect(screen.queryByText('Self-reported')).toBeNull();
    expect(screen.queryByText('AI-evaluated')).toBeNull();
    expect(screen.queryByText('Consultant-validated')).toBeNull();
  });

  it('renders no tier badges when evidenceTiers is an empty array', () => {
    render(<MaturitySummarySection maturity={makeContext({ evidenceTiers: [] })} />);
    expect(screen.queryByText('Self-reported')).toBeNull();
    expect(screen.queryByText('AI-evaluated')).toBeNull();
    expect(screen.queryByText('Consultant-validated')).toBeNull();
  });

  it('shows the correct self_reported label for a segment with that tier', () => {
    // Strategy is weakest (rank 0); give it self_reported tier
    const tiers = [{ segId: 'strategy', subSegId: 'strategy-1', tier: 'self_reported' as const }];
    render(<MaturitySummarySection maturity={makeContext({ evidenceTiers: tiers })} />);
    const slot = screen.getByTestId('mss-weak-segment-0');
    expect(slot.textContent).toContain('Self-reported');
  });

  it('shows the correct ai_evaluated label for a segment with that tier', () => {
    const tiers = [{ segId: 'strategy', subSegId: 'strategy-1', tier: 'ai_evaluated' as const }];
    render(<MaturitySummarySection maturity={makeContext({ evidenceTiers: tiers })} />);
    const slot = screen.getByTestId('mss-weak-segment-0');
    expect(slot.textContent).toContain('AI-evaluated');
  });

  it('shows the correct consultant_validated label for a segment with that tier', () => {
    const tiers = [{ segId: 'strategy', subSegId: 'strategy-1', tier: 'consultant_validated' as const }];
    render(<MaturitySummarySection maturity={makeContext({ evidenceTiers: tiers })} />);
    const slot = screen.getByTestId('mss-weak-segment-0');
    expect(slot.textContent).toContain('Consultant-validated');
  });

  it('picks the highest-rank tier when a segment has multiple sub-segment entries', () => {
    // self_reported + ai_evaluated → should show ai_evaluated
    const tiers = [
      { segId: 'strategy', subSegId: 'strategy-1', tier: 'self_reported' as const },
      { segId: 'strategy', subSegId: 'strategy-2', tier: 'ai_evaluated' as const },
    ];
    render(<MaturitySummarySection maturity={makeContext({ evidenceTiers: tiers })} />);
    const slot = screen.getByTestId('mss-weak-segment-0');
    expect(slot.textContent).toContain('AI-evaluated');
    expect(slot.textContent).not.toContain('Self-reported');
  });

  it('consultant_validated beats ai_evaluated when both appear for the same segment (EN)', () => {
    // ai_evaluated + consultant_validated → should show consultant_validated
    const tiers = [
      { segId: 'strategy', subSegId: 'strategy-1', tier: 'ai_evaluated' as const },
      { segId: 'strategy', subSegId: 'strategy-2', tier: 'consultant_validated' as const },
    ];
    render(<MaturitySummarySection maturity={makeContext({ evidenceTiers: tiers })} />);
    const slot = screen.getByTestId('mss-weak-segment-0');
    expect(slot.textContent).toContain('Consultant-validated');
    expect(slot.textContent).not.toContain('AI-evaluated');
  });

  it('consultant_validated beats ai_evaluated when both appear for the same segment (AR)', () => {
    // ai_evaluated + consultant_validated → should show مُعتمَد من الاستشاري in AR mode
    const tiers = [
      { segId: 'strategy', subSegId: 'strategy-1', tier: 'ai_evaluated' as const },
      { segId: 'strategy', subSegId: 'strategy-2', tier: 'consultant_validated' as const },
    ];
    render(<MaturitySummarySection maturity={makeContext({ evidenceTiers: tiers })} isAr />);
    const slot = screen.getByTestId('mss-weak-segment-0');
    expect(slot.textContent).toContain('مُعتمَد من الاستشاري');
    expect(slot.textContent).not.toContain('مُقيَّم بالذكاء الاصطناعي');
  });

  it('shows no badge for a segment that has no matching evidenceTiers entry', () => {
    // Only procurement and logistics have tiers; Strategy (rank 0) has none
    const tiers = [
      { segId: 'procurement', subSegId: 'proc-1', tier: 'ai_evaluated' as const },
      { segId: 'logistics',   subSegId: 'log-1',  tier: 'consultant_validated' as const },
    ];
    render(<MaturitySummarySection maturity={makeContext({ evidenceTiers: tiers })} />);
    const rank0 = screen.getByTestId('mss-weak-segment-0'); // Strategy
    expect(rank0.textContent).not.toContain('Self-reported');
    expect(rank0.textContent).not.toContain('AI-evaluated');
    expect(rank0.textContent).not.toContain('Consultant-validated');
  });

  it('shows Arabic self_reported label in AR mode', () => {
    const tiers = [{ segId: 'strategy', subSegId: 'strategy-1', tier: 'self_reported' as const }];
    render(<MaturitySummarySection maturity={makeContext({ evidenceTiers: tiers })} isAr />);
    const slot = screen.getByTestId('mss-weak-segment-0');
    expect(slot.textContent).toContain('مُبلَّغ ذاتياً');
  });

  it('shows Arabic ai_evaluated label in AR mode', () => {
    const tiers = [{ segId: 'strategy', subSegId: 'strategy-1', tier: 'ai_evaluated' as const }];
    render(<MaturitySummarySection maturity={makeContext({ evidenceTiers: tiers })} isAr />);
    const slot = screen.getByTestId('mss-weak-segment-0');
    expect(slot.textContent).toContain('مُقيَّم بالذكاء الاصطناعي');
  });

  it('shows Arabic consultant_validated label in AR mode', () => {
    const tiers = [{ segId: 'strategy', subSegId: 'strategy-1', tier: 'consultant_validated' as const }];
    render(<MaturitySummarySection maturity={makeContext({ evidenceTiers: tiers })} isAr />);
    const slot = screen.getByTestId('mss-weak-segment-0');
    expect(slot.textContent).toContain('مُعتمَد من الاستشاري');
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
    expect(container.querySelector('[data-testid="mss-radar-wrapper"] svg')).toBeNull();
  });

  it('handles segments missing gccAvg (no GCC gap label rendered)', () => {
    const segsNoGcc = BASE_SEGS.map(s => ({ ...s, gccAvg: undefined }));
    render(<MaturitySummarySection maturity={makeContext({ segmentScores: segsNoGcc })} />);
    expect(screen.queryByText(/GCC gap:/i)).toBeNull();
  });
});
