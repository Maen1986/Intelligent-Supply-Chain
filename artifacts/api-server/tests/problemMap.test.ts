/**
 * Tests for GET /api/workbench/problem-map (#192 Problem Map)
 *
 * Covers:
 *  - 401 when unauthenticated
 *  - honest-empty state (hasData=false, empty points and wizardTally)
 *  - points: extracted from submissions.outputs.problems[] where present,
 *    industry/subIndustry pulled from inputs, severityScore clamped to
 *    0-100, status/framework/confidence passed through
 *  - a problem missing severityScore is excluded (never fabricated)
 *  - a diagnostic-shape row with no industry is excluded from points
 *    (no X-value to plot, and never guessed)
 *  - wizardTally: rows with no problems[] tallied by focusArea, counted
 *    and sorted descending
 *  - a row with neither problems[] nor focusArea (e.g. a command_centre
 *    'solution' follow-up) appears in neither bucket
 *  - 500 on a database failure
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { makeApp, resetDbState, makeDbMock, makeLoggerMock } from './helpers';

vi.mock('@workspace/db', () => makeDbMock());
vi.mock('../src/lib/logger', () => makeLoggerMock());

import workbenchRouter from '../src/routes/workbench';

beforeEach(async () => {
  resetDbState();
  const { db } = await import('@workspace/db');
  (db.execute as ReturnType<typeof vi.fn>).mockReset();
  (db.execute as ReturnType<typeof vi.fn>).mockResolvedValue({ rows: [] });
});

describe('GET /api/workbench/problem-map', () => {
  it('returns 401 when called without a session', async () => {
    const app = makeApp('/api', workbenchRouter);
    const res = await request(app).get('/api/workbench/problem-map');
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  it('honest-empty state: hasData is false with no submissions', async () => {
    const app = makeApp('/api', workbenchRouter, { userId: 1 });
    const res = await request(app).get('/api/workbench/problem-map');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.hasData).toBe(false);
    expect(res.body.points).toEqual([]);
    expect(res.body.wizardTally).toEqual([]);
  });

  it('extracts one point per Problem DNA problem, with industry/subIndustry/severity/status/framework/confidence', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          inputs: { industry: 'Manufacturing', subIndustry: 'Automotive', challenge: 'Late deliveries' },
          outputs: { problems: [
            { id: 'P1', title: 'Stockout risk', status: 'Active', severityScore: 82, framework: 'SCOR Source', confidence: 85 },
            { id: 'P2', title: 'Slow onboarding', status: 'Recurring', severityScore: 40, framework: 'CIPS', confidence: 60 },
          ] },
          created_at: '2026-08-20T00:00:00Z',
        },
      ],
    });
    const app = makeApp('/api', workbenchRouter, { userId: 1 });
    const res = await request(app).get('/api/workbench/problem-map');
    expect(res.body.points).toHaveLength(2);
    expect(res.body.points[0]).toMatchObject({
      id: '10-P1', submissionId: 10, industry: 'Manufacturing', subIndustry: 'Automotive',
      title: 'Stockout risk', severityScore: 82, status: 'Active', framework: 'SCOR Source', confidence: 85,
    });
    expect(res.body.points[1]).toMatchObject({ id: '10-P2', severityScore: 40, status: 'Recurring' });
    expect(res.body.hasData).toBe(true);
  });

  it('clamps an out-of-range severityScore to 0-100 rather than plotting it off-chart', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      rows: [{
        id: 11, inputs: { industry: 'Retail' },
        outputs: { problems: [{ id: 'P1', status: 'Active', severityScore: 140 }] },
        created_at: '2026-08-20T00:00:00Z',
      }],
    });
    const app = makeApp('/api', workbenchRouter, { userId: 1 });
    const res = await request(app).get('/api/workbench/problem-map');
    expect(res.body.points[0].severityScore).toBe(100);
  });

  it('clamps a below-range (negative) severityScore to 0 rather than plotting it off-chart', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      rows: [{
        id: 12, inputs: { industry: 'Retail' },
        outputs: { problems: [{ id: 'P1', status: 'Active', severityScore: -35 }] },
        created_at: '2026-08-20T00:00:00Z',
      }],
    });
    const app = makeApp('/api', workbenchRouter, { userId: 1 });
    const res = await request(app).get('/api/workbench/problem-map');
    expect(res.body.points[0].severityScore).toBe(0);
  });

  it('excludes a problem missing severityScore rather than fabricating one', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      rows: [{
        id: 12, inputs: { industry: 'Logistics' },
        outputs: { problems: [{ id: 'P1', status: 'Active' /* no severityScore */ }] },
        created_at: '2026-08-20T00:00:00Z',
      }],
    });
    const app = makeApp('/api', workbenchRouter, { userId: 1 });
    const res = await request(app).get('/api/workbench/problem-map');
    expect(res.body.points).toEqual([]);
  });

  it('excludes problems[] rows with no industry -- no X-value to plot, never guessed', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      rows: [{
        id: 13, inputs: { challenge: 'no industry field on this row' },
        outputs: { problems: [{ id: 'P1', status: 'Active', severityScore: 55 }] },
        created_at: '2026-08-20T00:00:00Z',
      }],
    });
    const app = makeApp('/api', workbenchRouter, { userId: 1 });
    const res = await request(app).get('/api/workbench/problem-map');
    expect(res.body.points).toEqual([]);
  });

  it('tallies wizard-only rows (no problems[]) by focusArea, sorted descending by count', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      rows: [
        { id: 20, inputs: { focusArea: 'Procurement' }, outputs: { executiveSummary: 'x' }, created_at: '2026-08-10T00:00:00Z' },
        { id: 21, inputs: { focusArea: 'Procurement' }, outputs: { executiveSummary: 'y' }, created_at: '2026-08-20T00:00:00Z' },
        { id: 22, inputs: { focusArea: 'Risk Management' }, outputs: { executiveSummary: 'z' }, created_at: '2026-08-15T00:00:00Z' },
      ],
    });
    const app = makeApp('/api', workbenchRouter, { userId: 1 });
    const res = await request(app).get('/api/workbench/problem-map');
    expect(res.body.wizardTally).toEqual([
      { focusArea: 'Procurement', count: 2, mostRecentAt: '2026-08-20T00:00:00Z' },
      { focusArea: 'Risk Management', count: 1, mostRecentAt: '2026-08-15T00:00:00Z' },
    ]);
    expect(res.body.hasData).toBe(true);
  });

  it('a row with neither problems[] nor focusArea (e.g. a command_centre solution follow-up) appears in neither bucket', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      rows: [{
        id: 30, inputs: { industry: 'Retail', challenge: 'Follow-up solution request' },
        outputs: { solutionPlan: 'text, no problems[]' },
        created_at: '2026-08-20T00:00:00Z',
      }],
    });
    const app = makeApp('/api', workbenchRouter, { userId: 1 });
    const res = await request(app).get('/api/workbench/problem-map');
    expect(res.body.points).toEqual([]);
    expect(res.body.wizardTally).toEqual([]);
    expect(res.body.hasData).toBe(false);
  });

  it('returns 500 on a database failure', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('db failure (test)'));
    const app = makeApp('/api', workbenchRouter, { userId: 1 });
    const res = await request(app).get('/api/workbench/problem-map');
    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
  });
});
