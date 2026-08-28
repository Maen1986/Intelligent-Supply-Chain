/**
 * /api/admin/platform-impact -- #185 (registry #185), the investor-facing
 * meta/admin view (ISC_UIUX_Vision_Synthesis_and_Scalability_Plan_v4.pdf,
 * F2 Part XXIII "Investor-Level UI"). Not a client-facing feature: aggregates
 * ISC's OWN platform-wide usage across every client for Maen's own investor
 * conversations. Admin-gated (requireAdmin), same pattern as
 * adminBenchmarks.ts -- not the general client entitlement system.
 *
 * Product-shape decisions made this pass (see
 * platform-impact-dashboard-185-scoping-draft.md for the two open items it
 * flagged, and #399/Decision-Record-8.10-style precedent for how this
 * engagement resolves this kind of scoped micro-decision without stopping
 * to ask):
 *
 *   1. Real admin-gated page vs. on-demand export -- built as a real route
 *      (this file) returning JSON a frontend page renders, reusing
 *      requireAdmin exactly as adminBenchmarks.ts already does. Matches the
 *      concept doc's own framing ("a meta/admin view"), not a separate
 *      export mechanism.
 *   2. "Gaps identified" definition -- reuses the REAL, already-shipped
 *      REACTIVE_CEILING = 2.0 threshold from brief.ts (the lowest named
 *      maturity band, "Reactive", score 1.0-1.9) rather than inventing a
 *      new definition. A "gap" = one segment scoring below 2.0 on a client's
 *      MOST RECENT maturity snapshot (deduplicated per user so a client who
 *      reassessed five times isn't counted five times over -- same
 *      dedup principle flagged in cross-client-benchmarking-infrastructure-
 *      scoping-v1.md).
 *
 * The #184 findings_actions write-path question the scoping draft flagged
 * as a shared open dependency is now resolved (confirmed live in
 * maturitySnapshots.ts's two PATCH handlers, and #184 itself shipped a
 * third mirror path for CLM contracts) -- so "actions tracked" below reads
 * from a table now known to be kept in sync, not an unverified one.
 */
import { Router } from 'express';
import { sql } from 'drizzle-orm';
import { db, submissionsTable, maturitySnapshotsTable, findingsActionsTable, usersTable, organizationsTable } from '@workspace/db';
import { requireAdmin } from '../middlewares/requireAdmin';
import { logger } from '../lib/logger';

const router = Router();
router.use(requireAdmin);

/** Mirrors brief.ts's own REACTIVE_CEILING exactly -- the lowest named
 *  maturity band ("Reactive", score 1.0-1.9) is the honest, already-shipped
 *  definition of "gap" reused here rather than inventing a new threshold. */
const REACTIVE_CEILING = 2.0;

interface SegmentScoreEntry {
  id?: string;
  score?: number;
}

// ── GET /api/admin/platform-impact ─────────────────────────────────────────
router.get('/', async (_req, res) => {
  try {
    const [
      diagnosticsRunRows,
      assessmentsRows,
      actionsRows,
      orgRows,
      userRows,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(submissionsTable),
      db.select({ count: sql<number>`count(*)::int` }).from(maturitySnapshotsTable),
      db
        .select({ status: findingsActionsTable.status, count: sql<number>`count(*)::int` })
        .from(findingsActionsTable)
        .groupBy(findingsActionsTable.status),
      db.select({ count: sql<number>`count(distinct ${usersTable.organizationId})::int` }).from(usersTable),
      db.select({ count: sql<number>`count(*)::int` }).from(usersTable),
    ]);

    const diagnosticsRun = diagnosticsRunRows[0]?.count ?? 0;
    const assessmentsCompleted = assessmentsRows[0]?.count ?? 0;
    const totalUsers = userRows[0]?.count ?? 0;
    const organizationsEngaged = orgRows[0]?.count ?? 0;

    const actionsByStatus: Record<string, number> = {};
    let actionsTracked = 0;
    for (const r of actionsRows) {
      const status = r.status ?? 'unknown';
      actionsByStatus[status] = r.count;
      actionsTracked += r.count;
    }

    // Gaps identified: latest snapshot per user (Postgres DISTINCT ON,
    // ordered by user then most recent taken_at), then count segments
    // scoring below REACTIVE_CEILING across those deduplicated snapshots
    // only -- never across every historical snapshot, which would let a
    // client who reassessed often dominate the count.
    const latestSnapshots = await db.execute<{ user_id: number; segment_scores: unknown }>(sql`
      SELECT DISTINCT ON (user_id) user_id, segment_scores
      FROM maturity_snapshots
      ORDER BY user_id, taken_at DESC
    `);

    let gapsIdentified = 0;
    let assessedUsersWithAtLeastOneGap = 0;
    for (const row of latestSnapshots.rows as Array<{ segment_scores: unknown }>) {
      const segments = Array.isArray(row.segment_scores) ? (row.segment_scores as SegmentScoreEntry[]) : [];
      const gapsInThisSnapshot = segments.filter(
        (s) => typeof s.score === 'number' && s.score < REACTIVE_CEILING,
      ).length;
      gapsIdentified += gapsInThisSnapshot;
      if (gapsInThisSnapshot > 0) assessedUsersWithAtLeastOneGap += 1;
    }

    res.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      metrics: {
        diagnosticsRun,
        assessmentsCompleted,
        actionsTracked,
        actionsByStatus,
        gapsIdentified,
        assessedUsersWithAtLeastOneGap,
        distinctUsersAssessed: latestSnapshots.rows.length,
        organizationsEngaged,
        totalUsers,
      },
      definitions: {
        gap: `A segment scoring below ${REACTIVE_CEILING} ("Reactive" maturity band) on a client's most recent assessment. Deduplicated per user -- reassessing does not inflate the count.`,
        actionsTracked: 'Row count in findings_actions across all sources (maturity remediation, diagnostic follow-ups, contract renewal obligations).',
        organizationsEngaged: `Distinct organizations linked via users.organization_id. Note: organizations are only created via self-serve signup (Engine 4) -- users predating that engine are not backfilled into one, so this undercounts total platform reach relative to totalUsers (${totalUsers}).`,
      },
    });
  } catch (err) {
    logger.error({ err }, '[admin/platform-impact] GET failed');
    res.status(500).json({ ok: false, error: 'Failed to load platform impact metrics' });
  }
});

export default router;
