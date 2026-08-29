/**
 * Cross-client benchmarking infrastructure (registry #398, Score-Max Plan v3
 * lever 3, built 30 Aug 2026 per direct owner instruction). Implements
 * cross-client-benchmarking-infrastructure-scoping-v1.md's proposed
 * architecture: nightly recompute of anonymized, cohort-level Maturity
 * Assessment benchmarks (by industry + company size + segment), gated
 * server-side by a minimum-cohort-size privacy floor.
 *
 * Honest gating fact (Decision Record 8.7): this can legitimately compute
 * zero rows today -- ISC has zero confirmed paying clients. The pipes are
 * real; the water in them depends on Traction. See
 * ISC_Investor_Pitch_Readiness_Positioning.docx, Competitive Moat row.
 */
import { db }        from '@workspace/db';
import { sql }        from 'drizzle-orm';
import { logger }     from './logger';

/** Never surface (or even store) a cohort cell built from fewer than this
 *  many distinct contributing organizations -- the same anonymization
 *  discipline national statistics agencies (GASTAT, Tamkeen) use for SME
 *  data. Enforced here (write side) AND at read time (belt and suspenders):
 *  a cell that drops below this floor is deleted, not merely hidden. */
export const MIN_COHORT_SIZE = 5;

interface SegmentScoreEntry {
  id?: string;
  title?: string;
  titleAr?: string;
  score?: number;
}

interface LatestSnapshotRow {
  cohort_key: string;
  industry: string;
  company_size: string;
  segment_scores: unknown;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function median(sorted: number[]): number {
  return percentile(sorted, 0.5);
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Recomputes every (industry, companySize, segmentId) cohort cell from the
 * latest maturity_snapshots row per organization (never every historical
 * snapshot -- a client who reassesses monthly must not dominate the
 * benchmark they're compared against). Called nightly by the scheduler
 * (job 6, scheduler.ts) and exposed here standalone for tests / manual runs.
 *
 * Returns a small summary object for logging/testing rather than void, so
 * a test can assert on real behavior (cellsWritten, cellsPrunedBelowFloor)
 * without re-querying the DB.
 */
export async function recomputeIndustryBenchmarks(): Promise<{
  cellsWritten: number;
  cellsPrunedBelowFloor: number;
  contributingOrganizations: number;
}> {
  const latestResult = await db.execute(sql`
    SELECT DISTINCT ON (cohort_key)
      cohort_key, industry, company_size, segment_scores
    FROM (
      SELECT
        COALESCE(u.organization_id::text, '-' || u.id::text) AS cohort_key,
        ms.industry, ms.company_size, ms.segment_scores, ms.taken_at
      FROM maturity_snapshots ms
      JOIN users u ON u.id = ms.user_id
      WHERE ms.industry IS NOT NULL AND ms.industry != ''
        AND ms.company_size IS NOT NULL AND ms.company_size != ''
    ) ranked
    ORDER BY cohort_key, taken_at DESC
  `);
  const rows = ((latestResult as any).rows ?? latestResult) as LatestSnapshotRow[];

  // (industry, companySize, segmentId) -> { scores: number[], title, titleAr }
  type CellKey = string;
  const cells = new Map<CellKey, { industry: string; companySize: string; segmentId: string; title?: string; titleAr?: string; scores: number[] }>();

  for (const row of rows) {
    const entries = Array.isArray(row.segment_scores) ? row.segment_scores as SegmentScoreEntry[] : [];
    for (const entry of entries) {
      if (typeof entry.id !== 'string' || typeof entry.score !== 'number') continue;
      const key = `${row.industry} ${row.company_size} ${entry.id}`;
      const cell = cells.get(key) ?? { industry: row.industry, companySize: row.company_size, segmentId: entry.id, title: entry.title, titleAr: entry.titleAr, scores: [] };
      cell.scores.push(entry.score);
      if (!cell.title && entry.title) cell.title = entry.title;
      cells.set(key, cell);
    }
  }

  let cellsWritten = 0;
  let cellsPrunedBelowFloor = 0;

  for (const cell of cells.values()) {
    if (cell.scores.length < MIN_COHORT_SIZE) {
      await db.execute(sql`
        DELETE FROM industry_benchmarks
        WHERE industry = ${cell.industry} AND company_size = ${cell.companySize} AND segment_id = ${cell.segmentId}
      `);
      cellsPrunedBelowFloor++;
      continue;
    }
    const sorted = [...cell.scores].sort((a, b) => a - b);
    const meanScore = mean(sorted);
    const medianScore = median(sorted);
    const p25 = percentile(sorted, 0.25);
    const p75 = percentile(sorted, 0.75);

    await db.execute(sql`
      INSERT INTO industry_benchmarks
        (industry, company_size, segment_id, segment_title, segment_title_ar, sample_size, mean_score, median_score, p25_score, p75_score, last_computed_at)
      VALUES
        (${cell.industry}, ${cell.companySize}, ${cell.segmentId}, ${cell.title ?? null}, ${cell.titleAr ?? null}, ${sorted.length}, ${meanScore.toFixed(2)}, ${medianScore.toFixed(2)}, ${p25.toFixed(2)}, ${p75.toFixed(2)}, NOW())
      ON CONFLICT (industry, company_size, segment_id) DO UPDATE SET
        segment_title = EXCLUDED.segment_title,
        segment_title_ar = EXCLUDED.segment_title_ar,
        sample_size = EXCLUDED.sample_size,
        mean_score = EXCLUDED.mean_score,
        median_score = EXCLUDED.median_score,
        p25_score = EXCLUDED.p25_score,
        p75_score = EXCLUDED.p75_score,
        last_computed_at = NOW()
    `);
    cellsWritten++;
  }

  logger.info({ cellsWritten, cellsPrunedBelowFloor, contributingOrganizations: rows.length }, '[industryBenchmarks] Recompute complete');
  return { cellsWritten, cellsPrunedBelowFloor, contributingOrganizations: rows.length };
}

export interface BenchmarkComparisonRow {
  segmentId: string;
  segmentTitle: string;
  yourScore: number;
  sampleSize: number;
  insufficientSample: boolean;
  mean: number | null;
  median: number | null;
  p25: number | null;
  p75: number | null;
}

/**
 * Reads the requesting user's own most recent snapshot, then joins each of
 * its segment scores against the (industry, companySize) cohort cells.
 * Deliberately does NOT accept an arbitrary industry/companySize from the
 * client -- always the user's own latest snapshot -- so there is no way to
 * probe another industry's cohort for competitive intelligence, and no
 * extra round-trip is needed to look up "what industry am I."
 */
export async function getBenchmarkComparisonForUser(userId: number): Promise<{
  hasSnapshot: boolean;
  industry: string | null;
  companySize: string | null;
  takenAt: string | null;
  rows: BenchmarkComparisonRow[];
}> {
  const snapResult = await db.execute(sql`
    SELECT industry, company_size, segment_scores, taken_at
    FROM maturity_snapshots
    WHERE user_id = ${userId}
    ORDER BY taken_at DESC
    LIMIT 1
  `);
  const snapRows = ((snapResult as any).rows ?? snapResult) as Array<{ industry: string | null; company_size: string | null; segment_scores: unknown; taken_at: string }>;
  const snap = snapRows[0];
  if (!snap || !snap.industry || !snap.company_size) {
    return { hasSnapshot: false, industry: null, companySize: null, takenAt: null, rows: [] };
  }

  const entries = Array.isArray(snap.segment_scores) ? snap.segment_scores as SegmentScoreEntry[] : [];
  const cohortResult = await db.execute(sql`
    SELECT segment_id, segment_title, sample_size, mean_score, median_score, p25_score, p75_score
    FROM industry_benchmarks
    WHERE industry = ${snap.industry} AND company_size = ${snap.company_size}
  `);
  const cohortRows = ((cohortResult as any).rows ?? cohortResult) as Array<{ segment_id: string; segment_title: string | null; sample_size: number; mean_score: string; median_score: string; p25_score: string; p75_score: string }>;
  const cohortMap = new Map(cohortRows.map(r => [r.segment_id, r]));

  const rows: BenchmarkComparisonRow[] = entries
    .filter((e): e is SegmentScoreEntry & { id: string; score: number } => typeof e.id === 'string' && typeof e.score === 'number')
    .map(e => {
      const cohort = cohortMap.get(e.id);
      return {
        segmentId: e.id,
        segmentTitle: e.title ?? cohort?.segment_title ?? e.id,
        yourScore: e.score,
        sampleSize: cohort?.sample_size ?? 0,
        insufficientSample: !cohort,
        mean: cohort ? Number(cohort.mean_score) : null,
        median: cohort ? Number(cohort.median_score) : null,
        p25: cohort ? Number(cohort.p25_score) : null,
        p75: cohort ? Number(cohort.p75_score) : null,
      };
    });

  return { hasSnapshot: true, industry: snap.industry, companySize: snap.company_size, takenAt: snap.taken_at, rows };
}
