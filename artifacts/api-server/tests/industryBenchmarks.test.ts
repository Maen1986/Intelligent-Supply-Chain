/**
 * Industry Benchmark tests (registry #398, built 30 Aug 2026).
 *
 * Covers: recomputeIndustryBenchmarks() writing a cell that meets the
 * MIN_COHORT_SIZE floor, pruning a cell that falls below it, the read-side
 * getBenchmarkComparisonForUser() honest-empty/insufficient-sample/real-
 * comparison cases, the route's 401/200/500 behavior, and
 * getCohortProgress() (added 30 Aug 2026, admin-facing operational
 * visibility into how close each cohort is to crossing the privacy
 * floor for real -- not the demo mode).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { makeApp, resetDbState, makeDbMock, makeLoggerMock } from './helpers';

vi.mock('@workspace/db', () => makeDbMock());
vi.mock('../src/lib/logger', () => makeLoggerMock());

import industryBenchmarksRouter from '../src/routes/industryBenchmarks';
import { recomputeIndustryBenchmarks, getBenchmarkComparisonForUser, getCohortProgress, MIN_COHORT_SIZE } from '../src/lib/industryBenchmarks';

beforeEach(() => {
  resetDbState();
  vi.clearAllMocks();
});

describe('MIN_COHORT_SIZE', () => {
  it('is 5 -- the privacy floor documented in the scoping doc', () => {
    expect(MIN_COHORT_SIZE).toBe(5);
  });
});

describe('recomputeIndustryBenchmarks', () => {
  it('writes a cohort cell that meets the privacy floor (5 contributing organizations)', async () => {
    const { db } = await import('@workspace/db');
    const scores = [60, 65, 70, 75, 80]; // 5 orgs, one segment, one industry/size cell
    (db.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      rows: scores.map((score, i) => ({
        cohort_key: `${i + 1}`,
        industry: 'Manufacturing',
        company_size: '11-50',
        segment_scores: [{ id: 'strategy', title: 'Strategy', score }],
      })),
    });
    // Every subsequent db.execute call (the upsert) just needs to resolve.
    (db.execute as ReturnType<typeof vi.fn>).mockResolvedValue({ rows: [] });

    const result = await recomputeIndustryBenchmarks();
    expect(result.cellsWritten).toBe(1);
    expect(result.cellsPrunedBelowFloor).toBe(0);
    expect(result.contributingOrganizations).toBe(5);
  });

  it('prunes (deletes) a cohort cell that falls below the privacy floor rather than storing a small sample', async () => {
    const { db } = await import('@workspace/db');
    const scores = [60, 65, 70]; // only 3 orgs -- below MIN_COHORT_SIZE
    (db.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      rows: scores.map((score, i) => ({
        cohort_key: `${i + 1}`,
        industry: 'Retail',
        company_size: '1-10',
        segment_scores: [{ id: 'procurement', title: 'Procurement', score }],
      })),
    });
    (db.execute as ReturnType<typeof vi.fn>).mockResolvedValue({ rows: [] });

    const result = await recomputeIndustryBenchmarks();
    expect(result.cellsWritten).toBe(0);
    expect(result.cellsPrunedBelowFloor).toBe(1);
  });

  it('ignores snapshot entries with no industry/companySize (no domain to key the cohort on)', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ rows: [] });
    const result = await recomputeIndustryBenchmarks();
    expect(result.contributingOrganizations).toBe(0);
    expect(result.cellsWritten).toBe(0);
  });
});

describe('getCohortProgress', () => {
  it('marks a cohort at/above the privacy floor as live, with needed: 0', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      rows: [{ industry: 'Manufacturing', company_size: '11-50', contributing_organizations: 5 }],
    });
    const result = await getCohortProgress();
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      industry: 'Manufacturing',
      companySize: '11-50',
      contributingOrganizations: 5,
      needed: 0,
      live: true,
    });
  });

  it('marks a cohort below the privacy floor as not live, with the correct remainder needed', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      rows: [{ industry: 'Retail', company_size: '1-10', contributing_organizations: 2 }],
    });
    const result = await getCohortProgress();
    expect(result[0].live).toBe(false);
    expect(result[0].needed).toBe(3); // 5 - 2
  });

  it('never returns a negative needed count for a cohort already past the floor', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      rows: [{ industry: 'Energy & Oil', company_size: '201+', contributing_organizations: 12 }],
    });
    const result = await getCohortProgress();
    expect(result[0].needed).toBe(0);
    expect(result[0].live).toBe(true);
  });

  it('preserves the closest-to-live-first order the SQL query already sorts by', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      rows: [
        { industry: 'Manufacturing', company_size: '11-50', contributing_organizations: 4 },
        { industry: 'Retail', company_size: '1-10', contributing_organizations: 2 },
        { industry: 'Logistics', company_size: '51-200', contributing_organizations: 0 },
      ],
    });
    const result = await getCohortProgress();
    expect(result.map(r => r.industry)).toEqual(['Manufacturing', 'Retail', 'Logistics']);
    expect(result.map(r => r.needed)).toEqual([1, 3, 5]);
  });

  it('returns an empty array (not a zero-row entry) when no cohort has any assessment data yet', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ rows: [] });
    const result = await getCohortProgress();
    expect(result).toEqual([]);
  });
});

describe('getBenchmarkComparisonForUser', () => {
  it('returns hasSnapshot: false when the user has never completed an assessment', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ rows: [] });
    const result = await getBenchmarkComparisonForUser(1);
    expect(result.hasSnapshot).toBe(false);
    expect(result.rows).toEqual([]);
  });

  it('marks a segment insufficientSample when no cohort row exists yet (honest, not fabricated)', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      rows: [{ industry: 'Energy & Oil', company_size: '51-200', segment_scores: [{ id: 'risk', title: 'Risk', score: 3.2 }], taken_at: '2026-08-30' }],
    });
    (db.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ rows: [] }); // no cohort cell yet
    const result = await getBenchmarkComparisonForUser(1);
    expect(result.hasSnapshot).toBe(true);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].insufficientSample).toBe(true);
    expect(result.rows[0].mean).toBeNull();
    expect(result.rows[0].yourScore).toBe(3.2);
  });

  it('returns a real comparison once a cohort cell exists', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      rows: [{ industry: 'Energy & Oil', company_size: '51-200', segment_scores: [{ id: 'risk', title: 'Risk', score: 3.2 }], taken_at: '2026-08-30' }],
    });
    (db.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      rows: [{ segment_id: 'risk', segment_title: 'Risk', sample_size: 7, mean_score: '3.50', median_score: '3.40', p25_score: '3.00', p75_score: '4.00' }],
    });
    const result = await getBenchmarkComparisonForUser(1);
    expect(result.rows[0].insufficientSample).toBe(false);
    expect(result.rows[0].sampleSize).toBe(7);
    expect(result.rows[0].mean).toBe(3.5);
  });
});

describe('GET /api/benchmarks/mine', () => {
  it('returns 401 when called without a session', async () => {
    const app = makeApp('/api', industryBenchmarksRouter, { userId: null });
    const res = await request(app).get('/api/benchmarks/mine');
    expect(res.status).toBe(401);
  });

  it('returns the comparison with minCohortSize included, when signed in', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ rows: [] }); // no snapshot
    const app = makeApp('/api', industryBenchmarksRouter, { userId: 1 });
    const res = await request(app).get('/api/benchmarks/mine');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.minCohortSize).toBe(5);
    expect(res.body.hasSnapshot).toBe(false);
  });

  it('returns 500 on a database failure', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('db down'));
    const app = makeApp('/api', industryBenchmarksRouter, { userId: 1 });
    const res = await request(app).get('/api/benchmarks/mine');
    expect(res.status).toBe(500);
  });
});
