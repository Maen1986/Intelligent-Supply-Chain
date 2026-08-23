/**
 * ROI Waterfall / Value Realization routes (#173, 23 Aug 2026)
 *
 * GET /api/maturity/roi-summary
 *
 * Builds a self-reported value-realization summary entirely from data the
 * user already generated: their own Maturity Assessment snapshot history
 * (score deltas per segment over time) and their own findings_actions
 * completions (the same table ActionTracker.tsx and the scheduler already
 * read/write -- see maturitySnapshots.ts). No dollar figure is invented:
 * ISC has no access to a client's actual financial ledger, so this screen
 * never claims a SAR amount. It reports what is genuinely known --
 * assessment score movement and action completion -- honestly labeled as
 * self-reported.
 *
 * #160 (Value Funnel Labeling) note: the concept doc's original 5-stage
 * funnel (Identified/Approved/Contracted/Realized/Sustained) does not
 * match what this platform actually tracks -- findings_actions only has
 * three real states (not_started/in_progress/done; see maturitySnapshots.ts
 * and ActionTracker.tsx). "Approved" and "Contracted" are procurement-
 * finance checkpoints ISC has no data source for. Rather than fabricate
 * those two stages, this endpoint reports the four stages that are
 * honestly derivable from real data:
 *   Identified  -- every AI-recommended action ever generated for this user
 *   In Progress -- status = 'in_progress'
 *   Completed   -- status = 'done'
 *   Sustained   -- a subset of Completed: the action's segment score, in
 *                  the user's most recent snapshot taken after completion,
 *                  is at or above the score at the time the action was
 *                  identified. If no later snapshot exists yet, the action
 *                  stays "Completed" (not yet verifiable), which is itself
 *                  an honest state -- it is never silently promoted.
 */
import { Router }          from 'express';
import { db }              from '@workspace/db';
import { sql }             from 'drizzle-orm';
import { requireSession }  from '../middlewares/requireSession';
import { logger }          from '../lib/logger';

const router = Router();

interface SnapshotRow {
  id: number;
  taken_at: string;
  segment_scores: Array<{ id: string; title: string; titleAr?: string; score: number }> | null;
}

interface FindingRow {
  id: number;
  source_ref_id: number;
  item_key: string;
  phase: string | null;
  segment_title: string | null;
  action: string;
  status: 'not_started' | 'in_progress' | 'done';
  completed_at: string | null;
  created_at: string;
}

router.get('/maturity/roi-summary', requireSession, async (req, res) => {
  const userId = res.locals.userId as number;

  try {
    const snapResult = await db.execute(sql`
      SELECT id, taken_at, segment_scores
      FROM maturity_snapshots
      WHERE user_id = ${userId}
      ORDER BY taken_at ASC
    `);
    const snapshots = ((snapResult as any).rows ?? snapResult) as SnapshotRow[];

    if (snapshots.length === 0) {
      // Honest-empty state -- no assessment ever taken, nothing to summarise.
      res.json({
        ok: true,
        hasData: false,
        funnel: { identified: 0, inProgress: 0, completed: 0, sustained: 0 },
        segments: [],
        firstSnapshotAt: null,
        latestSnapshotAt: null,
        snapshotCount: 0,
      });
      return;
    }

    const findResult = await db.execute(sql`
      SELECT id, source_ref_id, item_key, phase, segment_title, action, status, completed_at, created_at
      FROM findings_actions
      WHERE user_id = ${userId} AND source = 'maturity'
      ORDER BY created_at ASC
    `);
    const findings = ((findResult as any).rows ?? findResult) as FindingRow[];

    // ---- Funnel counts (three real states, honestly derived) ----
    const identified  = findings.length;
    const inProgress  = findings.filter(f => f.status === 'in_progress').length;
    const completed   = findings.filter(f => f.status === 'done').length;

    // ---- Sustained: for each completed item, was the segment score held
    //      or improved in the most recent snapshot taken after completion? ----
    let sustained = 0;
    const sortedSnapshots = snapshots; // already ASC by taken_at
    for (const f of findings) {
      if (f.status !== 'done' || !f.completed_at || !f.segment_title) continue;

      // Score for this segment at the time the action was identified
      // (the snapshot it was generated from, source_ref_id).
      const originSnapshot = sortedSnapshots.find(s => s.id === f.source_ref_id);
      const originScore = originSnapshot?.segment_scores?.find(sg => sg.title === f.segment_title)?.score;
      if (originScore === undefined) continue;

      // Most recent snapshot taken strictly after completion.
      const completedAtMs = new Date(f.completed_at).getTime();
      const laterSnapshots = sortedSnapshots.filter(s => new Date(s.taken_at).getTime() > completedAtMs);
      if (laterSnapshots.length === 0) continue; // not yet verifiable -- stays "Completed"

      const mostRecent = laterSnapshots[laterSnapshots.length - 1];
      const latestScore = mostRecent.segment_scores?.find(sg => sg.title === f.segment_title)?.score;
      if (latestScore !== undefined && latestScore >= originScore) {
        sustained += 1;
      }
    }

    // ---- Per-segment score movement across the user's full history ----
    const firstSnap = sortedSnapshots[0];
    const latestSnap = sortedSnapshots[sortedSnapshots.length - 1];
    const segmentTitles = new Set<string>();
    for (const s of sortedSnapshots) {
      for (const sg of s.segment_scores ?? []) segmentTitles.add(sg.title);
    }
    const segments = Array.from(segmentTitles).map(title => {
      const scoreFirst  = firstSnap.segment_scores?.find(sg => sg.title === title)?.score ?? null;
      const scoreLatest = latestSnap.segment_scores?.find(sg => sg.title === title)?.score ?? null;
      return {
        title,
        scoreFirst,
        scoreLatest,
        delta: scoreFirst !== null && scoreLatest !== null ? Number((scoreLatest - scoreFirst).toFixed(2)) : null,
      };
    });

    res.json({
      ok: true,
      hasData: true,
      funnel: { identified, inProgress, completed, sustained },
      segments,
      firstSnapshotAt: firstSnap.taken_at,
      latestSnapshotAt: latestSnap.taken_at,
      snapshotCount: sortedSnapshots.length,
    });
  } catch (err) {
    logger.error({ err, userId }, '[roiSummary] Fetch failed');
    res.status(500).json({ ok: false, error: 'Could not build ROI summary' });
  }
});

export default router;
