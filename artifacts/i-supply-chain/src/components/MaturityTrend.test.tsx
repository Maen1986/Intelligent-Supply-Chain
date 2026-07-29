/**
 * UI tests for MaturityTrend component
 *
 * Covers:
 *  - 0 snapshots: renders nothing
 *  - 1 snapshot: retake prompt shows; delta sections hidden
 *  - ≥2 snapshots: delta panel, trajectory chart, retake button shown
 *  - Delta badge sorting: improved first, flat, declined last
 *  - Improved / flat / declined badge visual + data-testid
 *  - Remedy correlation panel: hidden when no prior remedyActions
 *  - Remedy correlation panel: visible with correct indicators when remedyActions present
 *  - Overall delta header shows prev → curr scores and level labels
 *  - Arabic labels render correctly in AR mode
 *  - Bilingual retake button label
 */

import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';

afterEach(cleanup);
import { MaturityTrend, type SnapshotRecord, type SegmentMeta } from './MaturityTrend';

/* ── Mock recharts (JSDOM has no SVG rendering engine) ─────────────────── */
vi.mock('recharts', () => {
  const noop = ({ children }: any) => <div>{children}</div>;
  return {
    ResponsiveContainer: noop,
    LineChart:  ({ children }: any) => <div data-testid="line-chart">{children}</div>,
    Line:       () => null,
    XAxis:      () => null,
    YAxis:      () => null,
    CartesianGrid: () => null,
    Tooltip:    () => null,
    Legend:     () => null,
  };
});

/* ── Fixtures ───────────────────────────────────────────────────────────── */

const SEGS: SegmentMeta[] = [
  { id: 'strategy',    color: '#0B3D91', shortTitle: 'Strategy',    shortTitleAr: 'الاستراتيجية' },
  { id: 'procurement', color: '#C9A84C', shortTitle: 'Procurement', shortTitleAr: 'المشتريات'    },
  { id: 'logistics',   color: '#22C55E', shortTitle: 'Logistics',   shortTitleAr: 'اللوجستيات'   },
];

function makeSnapshot(
  id: number,
  takenAt: string,
  segScores: Array<[string, number]>,
  remedyActions: SnapshotRecord['remedyActions'] = null,
): SnapshotRecord {
  return {
    id,
    takenAt,
    industry:      'retail',
    companySize:   'large',
    segmentScores: segScores.map(([segId, score]) => ({
      id:      segId,
      title:   SEGS.find(s => s.id === segId)?.shortTitle ?? segId,
      titleAr: SEGS.find(s => s.id === segId)?.shortTitleAr,
      score,
      level:   score >= 3 ? 'Defined' : 'Aware',
    })),
    overallScore:  String(segScores.reduce((s, [, v]) => s + v, 0) / segScores.length),
    coveragePct:   '0.00',
    remedyActions,
  };
}

/** Snapshot 1: all segments at 2.0 */
const SNAP1 = makeSnapshot('2025-01-01T00:00:00Z' as any, '2025-01-01T00:00:00Z', [
  ['strategy', 2.0],
  ['procurement', 2.0],
  ['logistics', 2.0],
]);
// Fix: first arg is number
const SNAP_1 = makeSnapshot(1, '2025-01-01T00:00:00Z', [
  ['strategy', 2.0],
  ['procurement', 2.0],
  ['logistics', 2.0],
]);

/** Snapshot 2: strategy improved (+1.5), procurement flat (0.0), logistics declined (-0.5) */
const SNAP_2 = makeSnapshot(2, '2025-07-01T00:00:00Z', [
  ['strategy',    3.5],   // +1.5 → improved
  ['procurement', 2.0],   // 0.0 → flat
  ['logistics',   1.5],   // -0.5 → declined
]);

/** Prior snapshot with remedyActions */
const SNAP_WITH_REMEDIES = makeSnapshot(1, '2025-01-01T00:00:00Z', [
  ['strategy', 2.0],
  ['procurement', 2.0],
  ['logistics', 2.0],
], {
  executiveSummary: 'Good baseline.',
  days30: [
    {
      segmentTitle: 'Strategy',
      action: 'Establish S&OP cadence',
      effort: 'Low',
    },
  ],
  days60: [
    {
      segmentTitle: 'Procurement',
      action: 'Run spend analysis',
      effort: 'Medium',
    },
  ],
  days90: [],
});

const noop = () => {};

/* ═══════════════════════════════════════════════════════════════════════════
   TESTS
═══════════════════════════════════════════════════════════════════════════ */

describe('MaturityTrend — 0 snapshots', () => {
  it('renders nothing', () => {
    const { container } = render(
      <MaturityTrend snapshots={[]} segmentList={SEGS} ar={false} onRetake={noop} />,
    );
    expect(container.firstChild).toBeNull();
  });
});

describe('MaturityTrend — single snapshot', () => {
  it('shows the retake prompt', () => {
    render(<MaturityTrend snapshots={[SNAP_1]} segmentList={SEGS} ar={false} onRetake={noop} />);
    expect(screen.getByTestId('maturity-retake-prompt')).toBeTruthy();
  });

  it('does NOT show the trend panel or trajectory chart', () => {
    render(<MaturityTrend snapshots={[SNAP_1]} segmentList={SEGS} ar={false} onRetake={noop} />);
    expect(screen.queryByTestId('maturity-trend-panel')).toBeNull();
    expect(screen.queryByTestId('trajectory-chart')).toBeNull();
  });

  it('shows the retake button', () => {
    render(<MaturityTrend snapshots={[SNAP_1]} segmentList={SEGS} ar={false} onRetake={noop} />);
    expect(screen.getByTestId('button-retake-assessment')).toBeTruthy();
  });

  it('renders bilingual text — EN: "Come back in 3–6 months"', () => {
    render(<MaturityTrend snapshots={[SNAP_1]} segmentList={SEGS} ar={false} onRetake={noop} />);
    expect(
      screen.getByText(/Come back in 3/i),
    ).toBeTruthy();
  });

  it('renders bilingual text — AR: Arabic retake prompt', () => {
    render(<MaturityTrend snapshots={[SNAP_1]} segmentList={SEGS} ar={true} onRetake={noop} />);
    expect(
      screen.getByText(/عُد بعد 3 إلى 6 أشهر/),
    ).toBeTruthy();
  });

  it('Arabic retake button shows "إعادة التقييم"', () => {
    render(<MaturityTrend snapshots={[SNAP_1]} segmentList={SEGS} ar={true} onRetake={noop} />);
    expect(screen.getByText('إعادة التقييم')).toBeTruthy();
  });
});

describe('MaturityTrend — ≥2 snapshots', () => {
  it('shows the main trend panel', () => {
    render(
      <MaturityTrend snapshots={[SNAP_1, SNAP_2]} segmentList={SEGS} ar={false} onRetake={noop} />,
    );
    expect(screen.getByTestId('maturity-trend-panel')).toBeTruthy();
  });

  it('shows the overall delta header', () => {
    render(
      <MaturityTrend snapshots={[SNAP_1, SNAP_2]} segmentList={SEGS} ar={false} onRetake={noop} />,
    );
    expect(screen.getByTestId('trend-overall-delta')).toBeTruthy();
  });

  it('shows the trajectory chart', () => {
    render(
      <MaturityTrend snapshots={[SNAP_1, SNAP_2]} segmentList={SEGS} ar={false} onRetake={noop} />,
    );
    expect(screen.getByTestId('trajectory-chart')).toBeTruthy();
  });

  it('renders a delta card for each segment', () => {
    render(
      <MaturityTrend snapshots={[SNAP_1, SNAP_2]} segmentList={SEGS} ar={false} onRetake={noop} />,
    );
    expect(screen.getByTestId('delta-card-strategy')).toBeTruthy();
    expect(screen.getByTestId('delta-card-procurement')).toBeTruthy();
    expect(screen.getByTestId('delta-card-logistics')).toBeTruthy();
  });

  it('shows an improved badge for strategy (+1.5)', () => {
    render(
      <MaturityTrend snapshots={[SNAP_1, SNAP_2]} segmentList={SEGS} ar={false} onRetake={noop} />,
    );
    const improved = screen.getAllByTestId('delta-badge-improved');
    expect(improved.length).toBeGreaterThanOrEqual(1);
  });

  it('shows a flat badge for procurement (0.0 delta)', () => {
    render(
      <MaturityTrend snapshots={[SNAP_1, SNAP_2]} segmentList={SEGS} ar={false} onRetake={noop} />,
    );
    const flat = screen.getAllByTestId('delta-badge-flat');
    expect(flat.length).toBeGreaterThanOrEqual(1);
  });

  it('shows a declined badge for logistics (−0.5)', () => {
    render(
      <MaturityTrend snapshots={[SNAP_1, SNAP_2]} segmentList={SEGS} ar={false} onRetake={noop} />,
    );
    const declined = screen.getAllByTestId('delta-badge-declined');
    expect(declined.length).toBeGreaterThanOrEqual(1);
  });

  it('strategy card appears before logistics card (improved before declined)', () => {
    const { container } = render(
      <MaturityTrend snapshots={[SNAP_1, SNAP_2]} segmentList={SEGS} ar={false} onRetake={noop} />,
    );
    const cards = container.querySelectorAll('[data-testid^="delta-card-"]');
    const ids = Array.from(cards).map(c => c.getAttribute('data-testid'));
    expect(ids.indexOf('delta-card-strategy')).toBeLessThan(ids.indexOf('delta-card-logistics'));
  });

  it('shows the retake button inside the trend panel', () => {
    render(
      <MaturityTrend snapshots={[SNAP_1, SNAP_2]} segmentList={SEGS} ar={false} onRetake={noop} />,
    );
    expect(screen.getByTestId('button-retake-assessment')).toBeTruthy();
  });
});

describe('MaturityTrend — remedy correlation panel', () => {
  it('does NOT show when the prior snapshot has no remedyActions', () => {
    render(
      <MaturityTrend snapshots={[SNAP_1, SNAP_2]} segmentList={SEGS} ar={false} onRetake={noop} />,
    );
    expect(screen.queryByTestId('remedy-correlation-panel')).toBeNull();
  });

  it('shows when the prior snapshot has remedyActions', () => {
    render(
      <MaturityTrend
        snapshots={[SNAP_WITH_REMEDIES, SNAP_2]}
        segmentList={SEGS}
        ar={false}
        onRetake={noop}
      />,
    );
    expect(screen.getByTestId('remedy-correlation-panel')).toBeTruthy();
  });

  it('renders a correlation row for each prior roadmap action', () => {
    render(
      <MaturityTrend
        snapshots={[SNAP_WITH_REMEDIES, SNAP_2]}
        segmentList={SEGS}
        ar={false}
        onRetake={noop}
      />,
    );
    // days30 has 1 action + days60 has 1 action = 2 rows
    const rows = screen.getAllByTestId(/^correlation-row-/);
    expect(rows).toHaveLength(2);
  });

  it('shows "Moved" for strategy (+1.5, threshold ≥ 0.3)', () => {
    render(
      <MaturityTrend
        snapshots={[SNAP_WITH_REMEDIES, SNAP_2]}
        segmentList={SEGS}
        ar={false}
        onRetake={noop}
      />,
    );
    expect(screen.getByText('Moved')).toBeTruthy();
  });

  it('shows "No change yet" for procurement (0.0 delta)', () => {
    render(
      <MaturityTrend
        snapshots={[SNAP_WITH_REMEDIES, SNAP_2]}
        segmentList={SEGS}
        ar={false}
        onRetake={noop}
      />,
    );
    expect(screen.getByText('No change yet')).toBeTruthy();
  });

  it('shows EN panel header text', () => {
    render(
      <MaturityTrend
        snapshots={[SNAP_WITH_REMEDIES, SNAP_2]}
        segmentList={SEGS}
        ar={false}
        onRetake={noop}
      />,
    );
    expect(screen.getByText(/Did your roadmap actions make a difference/i)).toBeTruthy();
  });

  it('shows EN caveat text about correlation vs causation', () => {
    render(
      <MaturityTrend
        snapshots={[SNAP_WITH_REMEDIES, SNAP_2]}
        segmentList={SEGS}
        ar={false}
        onRetake={noop}
      />,
    );
    expect(screen.getByText(/Correlation, not causation/i)).toBeTruthy();
  });
});

describe('MaturityTrend — Arabic bilingual labels', () => {
  it('shows AR panel header in remedy correlation', () => {
    render(
      <MaturityTrend
        snapshots={[SNAP_WITH_REMEDIES, SNAP_2]}
        segmentList={SEGS}
        ar={true}
        onRetake={noop}
      />,
    );
    expect(screen.getByText(/هل أسفرت إجراءات خطتك/)).toBeTruthy();
  });

  it('shows AR caveat text', () => {
    render(
      <MaturityTrend
        snapshots={[SNAP_WITH_REMEDIES, SNAP_2]}
        segmentList={SEGS}
        ar={true}
        onRetake={noop}
      />,
    );
    expect(screen.getByText(/ارتباط، لا سببية/)).toBeTruthy();
  });

  it('shows "تحرّك" (AR for Moved) for strategy (+1.5)', () => {
    render(
      <MaturityTrend
        snapshots={[SNAP_WITH_REMEDIES, SNAP_2]}
        segmentList={SEGS}
        ar={true}
        onRetake={noop}
      />,
    );
    expect(screen.getByText('تحرّك')).toBeTruthy();
  });

  it('shows "لا تغيير بعد" (AR for No change yet) for procurement', () => {
    render(
      <MaturityTrend
        snapshots={[SNAP_WITH_REMEDIES, SNAP_2]}
        segmentList={SEGS}
        ar={true}
        onRetake={noop}
      />,
    );
    expect(screen.getByText('لا تغيير بعد')).toBeTruthy();
  });

  it('shows AR overall delta label', () => {
    render(
      <MaturityTrend
        snapshots={[SNAP_1, SNAP_2]}
        segmentList={SEGS}
        ar={true}
        onRetake={noop}
      />,
    );
    expect(screen.getByText(/التغيّر الإجمالي/)).toBeTruthy();
  });

  it('shows AR trajectory chart description', () => {
    render(
      <MaturityTrend
        snapshots={[SNAP_1, SNAP_2]}
        segmentList={SEGS}
        ar={true}
        onRetake={noop}
      />,
    );
    expect(screen.getByText(/مسار النضج بمرور الوقت/)).toBeTruthy();
  });
});
