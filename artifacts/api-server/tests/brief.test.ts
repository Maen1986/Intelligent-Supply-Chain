/**
 * Tests for GET /api/brief/summary (#171 Daily/Weekly Brief)
 *
 * Covers:
 *  - 401 when unauthenticated
 *  - Honest-empty state: hasData=false when every source query returns no rows
 *  - "changed": segment deltas computed correctly between two snapshots,
 *    zero-delta segments filtered out, sorted by |delta| descending
 *  - "changed": hasComparison=false when fewer than two snapshots exist
 *  - "trendWarning" (#175): two consecutive declines flagged, a single dip
 *    is NOT flagged, already-Reactive segments are labeled distinctly,
 *    hasEnoughHistory=false with fewer than 3 snapshots
 *  - "needsYou": overdue items and not-started items both surfaced
 *  - "emerging": new not-started findings_actions within the window
 *  - "completions": merged feed across actions/assessment/tco/wc/sv, sorted
 *    newest-first, each item shaped with type/label/occurredAt/href
 *  - ?window=daily narrows the window to 1 day (passed through in response)
 *  - 500 on a database failure
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { makeApp, resetDbState, makeDbMock, makeLoggerMock } from './helpers';

vi.mock('@workspace/db', () => makeDbMock());
vi.mock('../src/lib/logger', () => makeLoggerMock());

import briefRouter from '../src/routes/brief';

beforeEach(async () => {
  resetDbState();
  const { db } = await import('@workspace/db');
  (db.execute as ReturnType<typeof vi.fn>).mockReset();
  (db.execute as ReturnType<typeof vi.fn>).mockResolvedValue({ rows: [] });
});

describe('GET /api/brief/summary', () => {
  it('returns 401 when called without a session', async () => {
    const app = makeApp('/api', briefRouter);
    const res = await request(app).get('/api/brief/summary');
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  it('honest-empty state: hasData is false when every source is empty', async () => {
    const app = makeApp('/api', briefRouter, { userId: 1 });
    const res = await request(app).get('/api/brief/summary');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.hasData).toBe(false);
    expect(res.body.everHasHistory).toBe(false);
    expect(res.body.changed.hasComparison).toBe(false);
    expect(res.body.trendWarning.hasEnoughHistory).toBe(false);
    expect(res.body.trendWarning.segments).toEqual([]);
    expect(res.body.needsYou.overdue).toEqual([]);
    expect(res.body.needsYou.notStarted).toEqual([]);
    expect(res.body.emerging).toEqual([]);
    expect(res.body.completions).toEqual([]);
  });

  it('defaults to the weekly window (7 days) when no ?window is given', async () => {
    const app = makeApp('/api', briefRouter, { userId: 1 });
    const res = await request(app).get('/api/brief/summary');
    expect(res.body.window).toBe('weekly');
    expect(res.body.windowDays).toBe(7);
  });

  it('?window=daily narrows to a 1-day window', async () => {
    const app = makeApp('/api', briefRouter, { userId: 1 });
    const res = await request(app).get('/api/brief/summary?window=daily');
    expect(res.body.window).toBe('daily');
    expect(res.body.windowDays).toBe(1);
  });

  it('"changed": computes segment deltas between the two most recent snapshots, drops zero-delta segments, sorts by |delta| desc', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        rows: [
          { id: 2, taken_at: '2026-08-20T00:00:00Z', segment_scores: [
            { title: 'Procurement', score: 3.5 },
            { title: 'Logistics', score: 2.0 },
            { title: 'Unchanged', score: 3.0 },
          ] },
          { id: 1, taken_at: '2026-08-01T00:00:00Z', segment_scores: [
            { title: 'Procurement', score: 2.0 },
            { title: 'Logistics', score: 2.5 },
            { title: 'Unchanged', score: 3.0 },
          ] },
        ],
      }); // snapshots query
    const app = makeApp('/api', briefRouter, { userId: 1 });
    const res = await request(app).get('/api/brief/summary');
    expect(res.body.changed.hasComparison).toBe(true);
    expect(res.body.changed.segments).toHaveLength(2);
    // Procurement: +1.5 (largest abs delta) sorts first
    expect(res.body.changed.segments[0]).toMatchObject({ title: 'Procurement', delta: 1.5 });
    expect(res.body.changed.segments[1]).toMatchObject({ title: 'Logistics', delta: -0.5 });
  });

  it('"changed": hasComparison is false with only one snapshot, but everHasHistory is still true', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      rows: [{ id: 1, taken_at: '2026-08-20T00:00:00Z', segment_scores: [{ title: 'Procurement', score: 3.5 }] }],
    });
    const app = makeApp('/api', briefRouter, { userId: 1 });
    const res = await request(app).get('/api/brief/summary');
    expect(res.body.changed.hasComparison).toBe(false);
    expect(res.body.changed.segments).toEqual([]);
    // Personalization (Decision Record 8.6, dimension 3): a client with one real snapshot
    // is not "brand new," even though there is nothing to compare yet.
    expect(res.body.everHasHistory).toBe(true);
  });

  it('everHasHistory is false when the user has never taken a maturity snapshot', async () => {
    const app = makeApp('/api', briefRouter, { userId: 1 });
    const res = await request(app).get('/api/brief/summary');
    expect(res.body.everHasHistory).toBe(false);
  });

  it('"trendWarning": flags a segment with two CONSECUTIVE declines, distinguishes already-Reactive from early-warning', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      rows: [
        // latest (most recent)
        { id: 3, taken_at: '2026-08-22T00:00:00Z', segment_scores: [
          { title: 'Supplier Risk', score: 2.8 },   // still above Reactive (2.0) -- early warning
          { title: 'Contract Mgmt', score: 1.6 },   // already IN Reactive
          { title: 'Steady', score: 3.0 },          // flat, never declines
        ] },
        // middle
        { id: 2, taken_at: '2026-08-08T00:00:00Z', segment_scores: [
          { title: 'Supplier Risk', score: 3.2 },
          { title: 'Contract Mgmt', score: 2.0 },
          { title: 'Steady', score: 3.0 },
        ] },
        // oldest
        { id: 1, taken_at: '2026-07-25T00:00:00Z', segment_scores: [
          { title: 'Supplier Risk', score: 3.6 },
          { title: 'Contract Mgmt', score: 2.4 },
          { title: 'Steady', score: 3.0 },
        ] },
      ],
    }); // snapshots (LIMIT 3)
    const app = makeApp('/api', briefRouter, { userId: 1 });
    const res = await request(app).get('/api/brief/summary');
    expect(res.body.trendWarning.hasEnoughHistory).toBe(true);
    expect(res.body.trendWarning.segments).toHaveLength(2);
    // Steady never appears -- no decline at all, correctly excluded.
    const titles = res.body.trendWarning.segments.map((s: any) => s.title);
    expect(titles).not.toContain('Steady');
    // Sorted steepest most-recent decline first: Contract Mgmt (-0.4) before Supplier Risk (-0.4)...
    // both deltas equal here, so check each entry's shape instead of exact order.
    const byTitle = Object.fromEntries(res.body.trendWarning.segments.map((s: any) => [s.title, s]));
    expect(byTitle['Supplier Risk']).toMatchObject({
      scoreOldest: 3.6, scoreMiddle: 3.2, scoreLatest: 2.8,
      delta1: -0.4, delta2: -0.4, alreadyReactive: false,
    });
    expect(byTitle['Contract Mgmt']).toMatchObject({
      scoreOldest: 2.4, scoreMiddle: 2.0, scoreLatest: 1.6,
      delta1: -0.4, delta2: -0.4, alreadyReactive: true,
    });
    expect(res.body.hasData).toBe(true);
  });

  it('"trendWarning": a single dip (one decline, then recovery) is NOT flagged -- two consecutive declines are required', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      rows: [
        { id: 3, taken_at: '2026-08-22T00:00:00Z', segment_scores: [{ title: 'Logistics', score: 3.0 }] }, // recovered
        { id: 2, taken_at: '2026-08-08T00:00:00Z', segment_scores: [{ title: 'Logistics', score: 2.5 }] }, // dipped
        { id: 1, taken_at: '2026-07-25T00:00:00Z', segment_scores: [{ title: 'Logistics', score: 3.2 }] },
      ],
    });
    const app = makeApp('/api', briefRouter, { userId: 1 });
    const res = await request(app).get('/api/brief/summary');
    expect(res.body.trendWarning.hasEnoughHistory).toBe(true);
    expect(res.body.trendWarning.segments).toEqual([]);
  });

  it('"trendWarning": hasEnoughHistory is false with only two snapshots (changed still works from the same query)', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      rows: [
        { id: 2, taken_at: '2026-08-20T00:00:00Z', segment_scores: [{ title: 'Procurement', score: 3.5 }] },
        { id: 1, taken_at: '2026-08-01T00:00:00Z', segment_scores: [{ title: 'Procurement', score: 2.0 }] },
      ],
    });
    const app = makeApp('/api', briefRouter, { userId: 1 });
    const res = await request(app).get('/api/brief/summary');
    expect(res.body.trendWarning.hasEnoughHistory).toBe(false);
    expect(res.body.trendWarning.segments).toEqual([]);
    // "changed" still works off the same 2-row result -- one query, two honest views.
    expect(res.body.changed.hasComparison).toBe(true);
  });

  it('"needsYou": surfaces overdue and not-started items separately', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ rows: [] }) // snapshots
      .mockResolvedValueOnce({ rows: [
        // due_at is far enough in the past that daysOverdue is deterministic and non-trivial
        // regardless of what "today" happens to be when this test runs.
        { id: 5, phase: 'days30', action: 'Fix OTIF', segment_title: 'Logistics', plan_started_at: '2020-01-01', due_at: '2020-01-31' },
      ] }) // overdue
      .mockResolvedValueOnce({ rows: [
        { id: 6, action: 'Review contracts', segment_title: 'CLM', source: 'diagnostic', created_at: '2026-08-01' },
      ] }); // not started
    const app = makeApp('/api', briefRouter, { userId: 1 });
    const res = await request(app).get('/api/brief/summary');
    expect(res.body.hasData).toBe(true);
    expect(res.body.needsYou.overdue).toHaveLength(1);
    expect(res.body.needsYou.overdue[0]).toMatchObject({ id: 5, action: 'Fix OTIF' });
    // Decision-readiness (Decision Record 8.6, dimension 1): the server computes and returns
    // a real days-overdue figure rather than leaving the client to subtract dates itself.
    expect(res.body.needsYou.overdue[0].daysOverdue).toBeGreaterThan(2000);
    expect(res.body.needsYou.notStarted).toHaveLength(1);
    expect(res.body.needsYou.notStarted[0]).toMatchObject({ id: 6, action: 'Review contracts' });
  });

  it('"emerging": surfaces new not-started findings_actions within the window', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ rows: [] }) // snapshots
      .mockResolvedValueOnce({ rows: [] }) // overdue
      .mockResolvedValueOnce({ rows: [] }) // not started
      .mockResolvedValueOnce({ rows: [
        { id: 9, action: 'New recommendation', segment_title: 'Risk', source: 'maturity', created_at: '2026-08-22' },
      ] }); // emerging
    const app = makeApp('/api', briefRouter, { userId: 1 });
    const res = await request(app).get('/api/brief/summary');
    expect(res.body.emerging).toHaveLength(1);
    expect(res.body.emerging[0]).toMatchObject({ id: 9, action: 'New recommendation' });
  });

  it('"completions": merges and sorts across actions/assessment/tco/wc/sv, each shaped with type/label/occurredAt/href', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ rows: [] }) // snapshots
      .mockResolvedValueOnce({ rows: [] }) // overdue
      .mockResolvedValueOnce({ rows: [] }) // not started
      .mockResolvedValueOnce({ rows: [] }) // emerging
      .mockResolvedValueOnce({ rows: [
        { id: 1, action: 'Completed action', segment_title: 'Procurement', completed_at: '2026-08-20T10:00:00Z' },
      ] }) // done actions
      .mockResolvedValueOnce({ rows: [
        { id: 2, taken_at: '2026-08-22T10:00:00Z', overall_score: '3.20' },
      ] }) // new snapshots
      .mockResolvedValueOnce({ rows: [
        { id: 3, name: 'Widget TCO', updated_at: '2026-08-21T10:00:00Z' },
      ] }) // tco
      .mockResolvedValueOnce({ rows: [
        { id: 4, name: 'Base Case', updated_at: '2026-08-19T10:00:00Z' },
      ] }) // working capital
      .mockResolvedValueOnce({ rows: [
        { id: 5, name: 'Site Comparison', updated_at: '2026-08-23T10:00:00Z' },
      ] }); // spend variance
    const app = makeApp('/api', briefRouter, { userId: 1 });
    const res = await request(app).get('/api/brief/summary');
    expect(res.body.completions).toHaveLength(5);
    // Sorted newest-first: spend variance (23rd) > new snapshot (22nd) > done action (20th) > tco (21st)...
    expect(res.body.completions[0]).toMatchObject({ type: 'spendvariance', label: 'Spend Variance comparison saved: Site Comparison', href: '/procurement-tools#spendvariance' });
    expect(res.body.completions[0]).toHaveProperty('occurredAt');
    expect(res.body.completions[0]).toHaveProperty('href');
    const types = res.body.completions.map((c: any) => c.type);
    expect(types).toEqual(expect.arrayContaining(['action', 'assessment', 'tco', 'workingcapital', 'spendvariance']));
    // Actionability (Decision Record 8.6, dimension 4): each engine's completion deep-links to
    // its own tab, not the generic page (which always lands on the unrelated default tab).
    const byType = Object.fromEntries(res.body.completions.map((c: any) => [c.type, c.href]));
    expect(byType.tco).toBe('/procurement-tools#tco');
    expect(byType.workingcapital).toBe('/procurement-tools#workingcapital');
    expect(byType.spendvariance).toBe('/procurement-tools#spendvariance');
    // verify sort order is strictly descending by occurredAt
    const times = res.body.completions.map((c: any) => new Date(c.occurredAt).getTime());
    for (let i = 1; i < times.length; i++) expect(times[i]).toBeLessThanOrEqual(times[i - 1]);
  });

  it('returns 500 on a database failure', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('db failure (test)'));
    const app = makeApp('/api', briefRouter, { userId: 1 });
    const res = await request(app).get('/api/brief/summary');
    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
  });
});
