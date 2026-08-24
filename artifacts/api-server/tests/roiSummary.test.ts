/**
 * Tests for GET /api/maturity/roi-summary (#173 ROI Waterfall, extended by
 * #174 Decision Memory to also expose learningItems -- no prior test file
 * existed for this route; written now while touching it for #174.)
 *
 * Covers:
 *  - 401 when unauthenticated
 *  - honest-empty state (hasData=false, learningItems=[]) with zero
 *    snapshots
 *  - funnel counts (identified/inProgress/completed/sustained) computed
 *    correctly from findings_actions
 *  - learningItems: a completed action whose segment score held/improved
 *    in a later snapshot is held=true and counted in "sustained"; one
 *    whose score dropped is held=false and NOT counted; one with no later
 *    snapshot yet is held=null (not yet verifiable) and NOT counted
 *  - learningItems are sorted newest-completed-first
 *  - segments: per-segment first/latest score movement across full history
 *  - 500 on a database failure
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { makeApp, resetDbState, makeDbMock, makeLoggerMock } from './helpers';

vi.mock('@workspace/db', () => makeDbMock());
vi.mock('../src/lib/logger', () => makeLoggerMock());

import roiSummaryRouter from '../src/routes/roiSummary';

beforeEach(async () => {
  resetDbState();
  const { db } = await import('@workspace/db');
  (db.execute as ReturnType<typeof vi.fn>).mockReset();
  (db.execute as ReturnType<typeof vi.fn>).mockResolvedValue({ rows: [] });
});

describe('GET /api/maturity/roi-summary', () => {
  it('returns 401 when called without a session', async () => {
    const app = makeApp('/api', roiSummaryRouter);
    const res = await request(app).get('/api/maturity/roi-summary');
    expect(res.status).toBe(401);
  });

  it('honest-empty state when the user has no snapshots at all', async () => {
    const app = makeApp('/api', roiSummaryRouter, { userId: 1 });
    const res = await request(app).get('/api/maturity/roi-summary');
    expect(res.status).toBe(200);
    expect(res.body.hasData).toBe(false);
    expect(res.body.learningItems).toEqual([]);
    expect(res.body.funnel).toEqual({ identified: 0, inProgress: 0, completed: 0, sustained: 0 });
  });

  // "Most recent snapshot taken after completion" (per the route's own documented
  // semantics -- see roiSummary.ts header) resolves to the SAME latest snapshot for
  // every item completed before it, within one segment. So held vs. not-held is
  // exercised via two separate scenarios below (a rising latest score, and a falling
  // one), not by cramming both into a single snapshot history.

  const SNAPSHOTS_RISING = [
    { id: 100, taken_at: '2026-07-01T00:00:00Z', segment_scores: [{ id: 'seg1', title: 'Procurement', score: 2.0 }] },
    { id: 101, taken_at: '2026-08-01T00:00:00Z', segment_scores: [{ id: 'seg1', title: 'Procurement', score: 1.5 }] },
    { id: 102, taken_at: '2026-08-20T00:00:00Z', segment_scores: [{ id: 'seg1', title: 'Procurement', score: 3.0 }] }, // latest -- above origin
  ];

  it('funnel + learningItems: held=true when the latest snapshot is at/above the origin score, and counted in "sustained"', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ rows: SNAPSHOTS_RISING })
      .mockResolvedValueOnce({
        rows: [
          { id: 1, source_ref_id: 100, item_key: 'k1', phase: 'days30', segment_title: 'Procurement', action: 'Renegotiate contract', status: 'done', completed_at: '2026-08-10T00:00:00Z', created_at: '2026-07-05T00:00:00Z' },
          // Completed AFTER the latest snapshot -- no later snapshot exists -> not yet verifiable.
          { id: 3, source_ref_id: 100, item_key: 'k3', phase: 'days60', segment_title: 'Procurement', action: 'Automate PO approval', status: 'done', completed_at: '2026-08-22T00:00:00Z', created_at: '2026-07-05T00:00:00Z' },
          { id: 4, source_ref_id: 100, item_key: 'k4', phase: null, segment_title: 'Procurement', action: 'In-progress item', status: 'in_progress', completed_at: null, created_at: '2026-07-05T00:00:00Z' },
        ],
      });
    const app = makeApp('/api', roiSummaryRouter, { userId: 1 });
    const res = await request(app).get('/api/maturity/roi-summary');

    expect(res.body.funnel).toEqual({ identified: 3, inProgress: 1, completed: 2, sustained: 1 });
    expect(res.body.learningItems).toHaveLength(2);

    const byId = Object.fromEntries(res.body.learningItems.map((i: any) => [i.id, i]));
    expect(byId[1]).toMatchObject({ action: 'Renegotiate contract', scoreBefore: 2.0, scoreAfter: 3.0, delta: 1.0, held: true });
    expect(byId[3]).toMatchObject({ action: 'Automate PO approval', scoreBefore: 2.0, scoreAfter: null, delta: null, held: null });

    // Sorted newest-completed-first: item 3 (Aug 22) before item 1 (Aug 10).
    expect(res.body.learningItems.map((i: any) => i.id)).toEqual([3, 1]);
  });

  const SNAPSHOTS_FALLING = [
    { id: 200, taken_at: '2026-07-01T00:00:00Z', segment_scores: [{ id: 'seg1', title: 'Risk', score: 3.0 }] },
    { id: 201, taken_at: '2026-08-15T00:00:00Z', segment_scores: [{ id: 'seg1', title: 'Risk', score: 1.5 }] }, // latest -- below origin
  ];

  it('learningItems: held=false when the latest snapshot has dropped below the origin score, and NOT counted in "sustained"', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ rows: SNAPSHOTS_FALLING })
      .mockResolvedValueOnce({
        rows: [
          { id: 5, source_ref_id: 200, item_key: 'k5', phase: 'days30', segment_title: 'Risk', action: 'Diversify supplier base', status: 'done', completed_at: '2026-07-20T00:00:00Z', created_at: '2026-07-05T00:00:00Z' },
        ],
      });
    const app = makeApp('/api', roiSummaryRouter, { userId: 1 });
    const res = await request(app).get('/api/maturity/roi-summary');

    expect(res.body.funnel.sustained).toBe(0);
    expect(res.body.learningItems).toHaveLength(1);
    expect(res.body.learningItems[0]).toMatchObject({ action: 'Diversify supplier base', scoreBefore: 3.0, scoreAfter: 1.5, delta: -1.5, held: false });
  });

  it('segments: reports first/latest score and delta per segment across full history', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ rows: SNAPSHOTS_RISING })
      .mockResolvedValueOnce({ rows: [] });
    const app = makeApp('/api', roiSummaryRouter, { userId: 1 });
    const res = await request(app).get('/api/maturity/roi-summary');
    expect(res.body.segments).toEqual([
      { title: 'Procurement', scoreFirst: 2.0, scoreLatest: 3.0, delta: 1.0 },
    ]);
  });

  it('returns 500 on a database failure', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('db failure (test)'));
    const app = makeApp('/api', roiSummaryRouter, { userId: 1 });
    const res = await request(app).get('/api/maturity/roi-summary');
    expect(res.status).toBe(500);
  });
});
