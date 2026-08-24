/**
 * Daily / Weekly Brief (#171, Wave B-4, 23 Aug 2026)
 *
 * GET /api/brief/summary?window=daily|weekly
 *
 * A digest built ENTIRELY from data the platform already has on file for
 * this user -- no new table, no invented signal. Per the site map's own
 * framing (UI/UX Vision Synthesis & Scalability Plan v4, Wave B-4): "what
 * changed / what needs you / what's emerging / recent completions,"
 * refreshed on view rather than pushed live.
 *
 * Two honest scoping decisions, made explicit here rather than silently
 * assumed:
 *
 * 1. "Since last login" (the plan doc's original phrasing) is not buildable
 *    -- users.ts has no last-login timestamp anywhere in this schema (only
 *    lastImportAt, which tracks KPI data imports, not sessions). This
 *    endpoint uses a real, named time window instead (?window=daily -> last
 *    24h, ?window=weekly -> last 7 days, default weekly), which is an
 *    honest substitute for a signal that does not exist rather than a
 *    silent behavior change dressed up as the original spec.
 *
 * 2. The plan doc lists "Consultancy Engine" as a source but consultancy.ts
 *    has no dedicated history table -- /diagnose and /solution persist to
 *    the shared `submissions` table (tool: 'diagnostic' | 'command_centre'),
 *    the same table the admin lead list reads. This endpoint reads that
 *    table filtered to the signed-in user's own rows, which is the only
 *    real, queryable trace of Consultancy Engine activity that exists.
 *
 * Four buckets, each independently empty-safe (no bucket ever fabricates
 * an entry to avoid looking sparse -- Decision Record 8.7):
 *
 *   changed      -- segment score deltas between the two most recent
 *                    maturity_snapshots (needs >= 2 snapshots to exist)
 *   needsYou     -- findings_actions items that are overdue (phase has
 *                    passed its 30/60/90-day mark from plan_started_at) or
 *                    whose plan has sat un-started for 7+ days -- the exact
 *                    same two signals scheduler.ts already computes for its
 *                    email nudges (Signal 1 / Signal 2), reused here for
 *                    in-app display so the two surfaces never disagree
 *                    about what counts as "needs you"
 *   emerging     -- findings_actions items created within the window that
 *                    are still not_started (freshly AI-generated
 *                    recommendations the user hasn't acted on yet)
 *   completions  -- merged, time-sorted feed of real completions within the
 *                    window: findings_actions marked done, new maturity
 *                    snapshots taken, and TCO / Working Capital / Spend
 *                    Variance analyses saved or edited
 *
 * #175 (Trend-Based Early Warning, 24 Aug 2026) extension: a fifth
 * bucket, trendWarning, reuses the SAME snapshot query "changed" already
 * runs (LIMIT bumped from 2 to 3, one query, two honest views -- the same
 * pattern #174 used on roiSummary.ts). "Changed" tells you what moved
 * between the last two assessments; trendWarning asks a stricter question:
 * has a segment declined for two CONSECUTIVE snapshot-to-snapshot
 * intervals in a row (not just one dip), while the account still has at
 * least 3 snapshots to establish a real trend from. A single decline is
 * noise; two in a row, while the segment is still above the lowest band,
 * is an early warning worth surfacing before it gets there. This app has
 * no "Critical" label anywhere (see src/lib/maturityScoring.ts,
 * MATURITY_LEVELS) -- the lowest band is named "Reactive" (score 1.0-1.9).
 * Rather than introduce a new "critical" label the rest of the platform
 * does not use, this endpoint uses "Reactive" consistently, and honestly
 * separates segments that are trending toward Reactive (early warning)
 * from segments already IN Reactive (a different, more urgent state,
 * surfaced but never conflated with the early-warning framing).
 * Consultancy Engine activity (submissions table, tool in diagnostic/
 * command_centre) is intentionally NOT folded into "completions" -- those
 * rows have no natural "done" state (a diagnosis is a single AI call, not a
 * multi-step item that can be marked complete), so surfacing them as
 * "completions" would misrepresent what happened. They would need their
 * own bucket to be shown honestly; left out of v1 rather than mislabeled.
 */
import { Router }          from 'express';
import { db }               from '@workspace/db';
import { sql }              from 'drizzle-orm';
import { requireSession }   from '../middlewares/requireSession';
import { logger }           from '../lib/logger';

const router = Router();

interface SegmentScoreRow {
  title: string;
  titleAr?: string;
  score: number;
}

interface CompletionItem {
  type: 'assessment' | 'action' | 'tco' | 'workingcapital' | 'spendvariance';
  label: string;
  occurredAt: string;
  href: string;
}

router.get('/brief/summary', requireSession, async (req, res) => {
  const userId = res.locals.userId as number;
  const windowParam = (req.query.window === 'daily') ? 'daily' : 'weekly';
  const windowDays = windowParam === 'daily' ? 1 : 7;

  try {
    // ── "Changed": segment deltas between the two most recent snapshots ──
    const snapResult = await db.execute(sql`
      SELECT id, taken_at, segment_scores
      FROM maturity_snapshots
      WHERE user_id = ${userId}
      ORDER BY taken_at DESC
      LIMIT 3
    `);
    const snapRows = ((snapResult as any).rows ?? snapResult) as Array<{
      id: number; taken_at: string; segment_scores: SegmentScoreRow[] | null;
    }>;

    let changed: {
      hasComparison: boolean;
      latestSnapshotAt: string | null;
      previousSnapshotAt: string | null;
      segments: Array<{ title: string; scoreLatest: number; scorePrevious: number; delta: number }>;
    } = { hasComparison: false, latestSnapshotAt: null, previousSnapshotAt: null, segments: [] };

    if (snapRows.length >= 2) {
      const [latest, previous] = snapRows;
      const prevByTitle = new Map((previous.segment_scores ?? []).map(s => [s.title, s.score]));
      const segments = (latest.segment_scores ?? [])
        .filter(s => prevByTitle.has(s.title))
        .map(s => ({
          title: s.title,
          scoreLatest: s.score,
          scorePrevious: prevByTitle.get(s.title)!,
          delta: Math.round((s.score - prevByTitle.get(s.title)!) * 100) / 100,
        }))
        .filter(s => s.delta !== 0)
        .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
      changed = {
        hasComparison: true,
        latestSnapshotAt: latest.taken_at,
        previousSnapshotAt: previous.taken_at,
        segments,
      };
    }

    // ── "Trend warning" (#175): two CONSECUTIVE declines in a row, not just
    //    one dip -- needs a third, older snapshot to establish an interval
    //    before the most recent one. REACTIVE_CEILING mirrors
    //    MATURITY_LEVELS[0].max + a hair (1.9 -> boundary at 2.0) from
    //    src/lib/maturityScoring.ts on the frontend; kept as a literal here
    //    since this is a raw-SQL route with no import path into that file. ──
    const REACTIVE_CEILING = 2.0;
    let trendWarning: {
      hasEnoughHistory: boolean;
      oldestSnapshotAt: string | null;
      middleSnapshotAt: string | null;
      latestSnapshotAt: string | null;
      segments: Array<{
        title: string;
        scoreOldest: number; scoreMiddle: number; scoreLatest: number;
        delta1: number; delta2: number;
        alreadyReactive: boolean;
      }>;
    } = { hasEnoughHistory: false, oldestSnapshotAt: null, middleSnapshotAt: null, latestSnapshotAt: null, segments: [] };

    if (snapRows.length === 3) {
      const [latest, middle, oldest] = snapRows;
      const middleByTitle = new Map((middle.segment_scores ?? []).map(s => [s.title, s.score]));
      const oldestByTitle = new Map((oldest.segment_scores ?? []).map(s => [s.title, s.score]));
      const declining = (latest.segment_scores ?? [])
        .filter(s => middleByTitle.has(s.title) && oldestByTitle.has(s.title))
        .map(s => {
          const scoreMiddle = middleByTitle.get(s.title)!;
          const scoreOldest = oldestByTitle.get(s.title)!;
          return {
            title: s.title,
            scoreOldest,
            scoreMiddle,
            scoreLatest: s.score,
            delta1: Math.round((scoreMiddle - scoreOldest) * 100) / 100,
            delta2: Math.round((s.score - scoreMiddle) * 100) / 100,
            alreadyReactive: s.score < REACTIVE_CEILING,
          };
        })
        // Two consecutive declines, not one -- a single dip is noise, not a trend.
        .filter(s => s.delta1 < 0 && s.delta2 < 0)
        .sort((a, b) => a.delta2 - b.delta2); // steepest most-recent decline first
      trendWarning = {
        hasEnoughHistory: true,
        oldestSnapshotAt: oldest.taken_at,
        middleSnapshotAt: middle.taken_at,
        latestSnapshotAt: latest.taken_at,
        segments: declining,
      };
    }

    // ── "Needs you": same two overdue signals as scheduler.ts (reused, not re-derived) ──
    const overdueResult = await db.execute(sql`
      SELECT id, phase, action, segment_title, plan_started_at,
        plan_started_at + (
          CASE phase
            WHEN 'days30' THEN INTERVAL '30 days'
            WHEN 'days60' THEN INTERVAL '60 days'
            WHEN 'days90' THEN INTERVAL '90 days'
            ELSE INTERVAL '9999 days'
          END
        ) AS due_at
      FROM findings_actions
      WHERE user_id = ${userId}
        AND status != 'done'
        AND plan_started_at IS NOT NULL
        AND phase IS NOT NULL
        AND plan_started_at + (
          CASE phase
            WHEN 'days30' THEN INTERVAL '30 days'
            WHEN 'days60' THEN INTERVAL '60 days'
            WHEN 'days90' THEN INTERVAL '90 days'
            ELSE INTERVAL '9999 days'
          END
        ) < NOW()
      ORDER BY due_at ASC
      LIMIT 10
    `);
    const overdueItems = (overdueResult as any).rows ?? overdueResult;

    const notStartedResult = await db.execute(sql`
      SELECT id, action, segment_title, source, created_at
      FROM findings_actions
      WHERE user_id = ${userId}
        AND status = 'not_started'
        AND plan_started_at IS NULL
        AND created_at < NOW() - INTERVAL '7 days'
      ORDER BY created_at ASC
      LIMIT 10
    `);
    const notStartedItems = (notStartedResult as any).rows ?? notStartedResult;

    // ── "Emerging": new recommendations created within the window, untouched ──
    const emergingResult = await db.execute(sql`
      SELECT id, action, segment_title, source, created_at
      FROM findings_actions
      WHERE user_id = ${userId}
        AND status = 'not_started'
        AND created_at >= NOW() - (${windowDays} || ' days')::INTERVAL
      ORDER BY created_at DESC
      LIMIT 10
    `);
    const emergingItems = (emergingResult as any).rows ?? emergingResult;

    // ── "Recent completions": merged feed across four real sources ──
    const completions: CompletionItem[] = [];

    const doneActionsResult = await db.execute(sql`
      SELECT id, action, segment_title, completed_at
      FROM findings_actions
      WHERE user_id = ${userId}
        AND status = 'done'
        AND completed_at >= NOW() - (${windowDays} || ' days')::INTERVAL
      ORDER BY completed_at DESC
      LIMIT 10
    `);
    for (const r of ((doneActionsResult as any).rows ?? doneActionsResult) as Array<{ id: number; action: string; segment_title: string | null; completed_at: string }>) {
      completions.push({ type: 'action', label: r.segment_title ? `${r.segment_title}: ${r.action}` : r.action, occurredAt: r.completed_at, href: '/action-tracker' });
    }

    const newSnapsResult = await db.execute(sql`
      SELECT id, taken_at, overall_score
      FROM maturity_snapshots
      WHERE user_id = ${userId}
        AND taken_at >= NOW() - (${windowDays} || ' days')::INTERVAL
      ORDER BY taken_at DESC
      LIMIT 5
    `);
    for (const r of ((newSnapsResult as any).rows ?? newSnapsResult) as Array<{ id: number; taken_at: string; overall_score: string }>) {
      completions.push({ type: 'assessment', label: `Maturity Assessment completed (score ${Number(r.overall_score).toFixed(1)})`, occurredAt: r.taken_at, href: '/maturity' });
    }

    const tcoResult = await db.execute(sql`
      SELECT id, name, updated_at FROM tco_analyses
      WHERE user_id = ${userId} AND updated_at >= NOW() - (${windowDays} || ' days')::INTERVAL
      ORDER BY updated_at DESC LIMIT 5
    `);
    for (const r of ((tcoResult as any).rows ?? tcoResult) as Array<{ id: number; name: string; updated_at: string }>) {
      completions.push({ type: 'tco', label: `TCO analysis saved: ${r.name}`, occurredAt: r.updated_at, href: '/procurement-tools#tco' });
    }

    const wcResult = await db.execute(sql`
      SELECT id, name, updated_at FROM working_capital_analyses
      WHERE user_id = ${userId} AND updated_at >= NOW() - (${windowDays} || ' days')::INTERVAL
      ORDER BY updated_at DESC LIMIT 5
    `);
    for (const r of ((wcResult as any).rows ?? wcResult) as Array<{ id: number; name: string; updated_at: string }>) {
      completions.push({ type: 'workingcapital', label: `Working Capital scenario saved: ${r.name}`, occurredAt: r.updated_at, href: '/procurement-tools#workingcapital' });
    }

    const svResult = await db.execute(sql`
      SELECT id, name, updated_at FROM spend_variance_analyses
      WHERE user_id = ${userId} AND updated_at >= NOW() - (${windowDays} || ' days')::INTERVAL
      ORDER BY updated_at DESC LIMIT 5
    `);
    for (const r of ((svResult as any).rows ?? svResult) as Array<{ id: number; name: string; updated_at: string }>) {
      completions.push({ type: 'spendvariance', label: `Spend Variance comparison saved: ${r.name}`, occurredAt: r.updated_at, href: '/procurement-tools#spendvariance' });
    }

    completions.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

    const hasData = changed.hasComparison || overdueItems.length > 0 || notStartedItems.length > 0
      || emergingItems.length > 0 || completions.length > 0 || trendWarning.segments.length > 0;
    // Personalization (Decision Record 8.6, dimension 3): an empty brief means two very
    // different things for a client who has never taken an assessment vs. one with real
    // history and simply a quiet window -- everHasHistory lets the frontend tell them apart
    // instead of showing identical copy to both. snapRows already reflects ALL of this
    // user's snapshots (not window-limited), so no extra query is needed.
    const everHasHistory = snapRows.length > 0;

    res.json({
      ok: true,
      hasData,
      everHasHistory,
      window: windowParam,
      windowDays,
      changed,
      trendWarning,
      needsYou: {
        overdue: overdueItems.map((r: any) => ({ id: r.id, phase: r.phase, action: r.action, segmentTitle: r.segment_title, dueAt: r.due_at, daysOverdue: Math.max(1, Math.floor((Date.now() - new Date(r.due_at).getTime()) / 86400000)) })),
        notStarted: notStartedItems.map((r: any) => ({ id: r.id, action: r.action, segmentTitle: r.segment_title, source: r.source, createdAt: r.created_at })),
      },
      emerging: emergingItems.map((r: any) => ({ id: r.id, action: r.action, segmentTitle: r.segment_title, source: r.source, createdAt: r.created_at })),
      completions: completions.slice(0, 15),
    });
  } catch (err) {
    logger.error({ err }, '[brief/summary] failed');
    res.status(500).json({ ok: false, error: 'Failed to build brief' });
  }
});

export default router;
