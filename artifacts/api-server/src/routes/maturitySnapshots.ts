/**
 * Maturity Snapshot routes
 *
 * POST   /api/maturity/snapshots                    — save a completed assessment (1/day per user)
 * GET    /api/maturity/snapshots                     — list all saved assessments for the session user
 * PATCH  /api/maturity/snapshots/:id/remedies        — attach AI remedy actions once they resolve
 * PATCH  /api/maturity/snapshots/:id/action-status   — update one Action Tracker item's status (#19)
 *
 * Ownership is enforced at the DB query level on every operation so that
 * user A cannot read or modify user B's data even with a valid session.
 */
import { Router }          from 'express';
import { db }              from '@workspace/db';
import { sql }             from 'drizzle-orm';
import { z }               from 'zod';
import { requireSession }  from '../middlewares/requireSession';
import { getEntitledSegments, gateSegmentScores, gateRemedyActions, entitledTitlesFrom } from '../lib/entitlements';
import { snapshotRateLimiter } from '../lib/rateLimit';
import { logger }          from '../lib/logger';

const router = Router();

/* ──── Zod schema for POST body ────
   The client submits answers + pre-computed per-segment scores (with titles
   for display). The server recomputes and validates the overall score to
   prevent tampering.                                                         */

const SegmentScoreSchema = z.object({
  id:      z.string(),
  title:   z.string(),
  titleAr: z.string().optional(),
  score:   z.number().min(0).max(5),
  level:   z.string(),
});

const PostSnapshotSchema = z.object({
  answers:       z.record(z.string(), z.number()),
  intakeData:    z.object({
    industry:    z.string().optional().default(''),
    companySize: z.string().optional().default(''),
  }),
  numSegments:   z.number().int().min(1).max(20),
  segmentScores: z.array(SegmentScoreSchema).min(1).max(20),
  coveragePct:   z.number().min(0).max(100).default(0),
  remedyActions: z.record(z.string(), z.unknown()).optional().nullable(),
});

/* ──── Server-side score recomputation ────
   Mirrors maturityScoring.segScore / overallScore pure functions.           */
function serverSegScore(answers: Record<string, number>, segIdx: number): number | null {
  const vals   = [0, 1, 2, 3, 4].map(q => answers[`${segIdx}-${q}`] ?? 0);
  const filled = vals.filter(v => v > 0);
  return filled.length === 5 ? filled.reduce((a, b) => a + b, 0) / 5 : null;
}

function serverOverallScore(answers: Record<string, number>, numSegments: number): number {
  const scores: number[] = [];
  for (let i = 0; i < numSegments; i++) {
    const s = serverSegScore(answers, i);
    if (s !== null) scores.push(s);
  }
  return scores.length === 0 ? 0 : scores.reduce((a, b) => a + b, 0) / scores.length;
}

/* ──── POST /api/maturity/snapshots ──── */
router.post(
  '/maturity/snapshots',
  requireSession,
  snapshotRateLimiter,
  async (req, res) => {
    const userId = res.locals.userId as number;

    const parsed = PostSnapshotSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ ok: false, error: 'Invalid snapshot data', details: parsed.error.format() });
      return;
    }

    const { answers, intakeData, numSegments, segmentScores, coveragePct, remedyActions } = parsed.data;

    // Recompute overall score server-side to prevent score inflation from clients
    const computedOverall = serverOverallScore(answers, numSegments);

    try {
      const result = await db.execute(sql`
        INSERT INTO maturity_snapshots
          (user_id, industry, company_size, answers, segment_scores,
           overall_score, coverage_pct, remedy_actions)
        VALUES (
          ${userId},
          ${intakeData.industry || null},
          ${intakeData.companySize || null},
          ${JSON.stringify(answers)}::jsonb,
          ${JSON.stringify(segmentScores)}::jsonb,
          ${computedOverall.toFixed(2)},
          ${coveragePct.toFixed(2)},
          ${remedyActions ? JSON.stringify(remedyActions) : null}::jsonb
        )
        RETURNING id, taken_at
      `);

      const rows = (result as any).rows ?? (result as any);
      const row  = Array.isArray(rows) ? rows[0] : rows;
      logger.info({ userId, snapshotId: row?.id }, '[maturitySnapshots] Snapshot saved');

      res.json({ ok: true, id: row?.id, takenAt: row?.taken_at });
    } catch (err) {
      logger.error({ err, userId }, '[maturitySnapshots] Save failed');
      res.status(500).json({ ok: false, error: 'Could not save snapshot' });
    }
  },
);

/* ──── GET /api/maturity/snapshots ──── */

/**
 * Normalise a raw DB row (snake_case) into the camelCase shape that
 * MaturityTrend / SnapshotRecord expects. This is the single place where
 * the contract is enforced; the frontend never sees raw DB column names.
 */
function normaliseSnapshot(row: Record<string, unknown>, entitledSegmentIds: Set<string>) {
  const rawSegments = (row.segment_scores ?? []) as Array<{ id: string; title: string; titleAr?: string }>;
  const rawRemedies = row.remedy_actions as
    { days30?: { segmentTitle: string }[]; days60?: { segmentTitle: string }[]; days90?: { segmentTitle: string }[] } | null
    ?? null;
  const entitledTitles = entitledTitlesFrom(entitledSegmentIds, rawSegments);
  return {
    id:            row.id,
    takenAt:       row.taken_at,
    industry:      row.industry ?? null,
    companySize:   row.company_size ?? null,
    // #188: locked segments keep id/title (still shows "assessed") but drop
    // score/level/benchmarks. Overall score/level below stays free/unlocked.
    segmentScores: gateSegmentScores(entitledSegmentIds, rawSegments),
    overallScore:  row.overall_score,
    coveragePct:   row.coverage_pct,
    remedyActions: gateRemedyActions(entitledTitles, rawRemedies) ?? null, // preserve explicit-null shape frontend already expects
  };
}

router.get('/maturity/snapshots', requireSession, async (req, res) => {
  const userId = res.locals.userId as number;

  try {
    const result = await db.execute(sql`
      SELECT id, user_id, taken_at, industry, company_size,
             answers, segment_scores, overall_score, coverage_pct,
             remedy_actions, created_at
      FROM maturity_snapshots
      WHERE user_id = ${userId}
      ORDER BY taken_at ASC
    `);

    const rows: Record<string, unknown>[] = (result as any).rows ?? result;
    const entitledSegmentIds = await getEntitledSegments(userId);
    res.json({ ok: true, snapshots: rows.map(row => normaliseSnapshot(row, entitledSegmentIds)) });
  } catch (err) {
    logger.error({ err, userId }, '[maturitySnapshots] Fetch failed');
    res.status(500).json({ ok: false, error: 'Could not fetch snapshots' });
  }
});

/* ──── findings_actions mirror helpers (Engine 2, Task #205/#189) ────
 * Best-effort: mirror failures are logged but never fail the primary
 * request -- remedy_actions (read by ActionTracker.tsx) remains the source
 * of truth for the live UI; findings_actions exists for automation (the
 * scheduler's action-followup job) and future engines to read from instead
 * of scanning JSON blobs. Raw SQL to match this file's existing style;
 * upserts via the UNIQUE(user_id, source, source_ref_id, item_key)
 * constraint created in migrate.ts.
 */
interface RemedyItemShape {
  segmentTitle?: string;
  action?: string;
  framework?: string;
  measurableTarget?: string;
}

async function mirrorRemediesIntoFindingsActions(
  userId: number,
  snapshotId: number,
  remedyActions: Record<string, unknown>,
): Promise<void> {
  const phases: Array<'days30' | 'days60' | 'days90'> = ['days30', 'days60', 'days90'];
  for (const phase of phases) {
    const items = (remedyActions[phase] ?? []) as RemedyItemShape[];
    if (!Array.isArray(items)) continue;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item?.action) continue;
      const itemKey = `${phase}-${i}`;
      try {
        await db.execute(sql`
          INSERT INTO findings_actions
            (user_id, source, source_ref_id, item_key, phase, segment_title, action, framework, measurable_target)
          VALUES
            (${userId}, 'maturity', ${snapshotId}, ${itemKey}, ${phase},
             ${item.segmentTitle ?? null}, ${item.action}, ${item.framework ?? null}, ${item.measurableTarget ?? null})
          ON CONFLICT (user_id, source, source_ref_id, item_key)
          DO UPDATE SET
            phase = EXCLUDED.phase,
            segment_title = EXCLUDED.segment_title,
            action = EXCLUDED.action,
            framework = EXCLUDED.framework,
            measurable_target = EXCLUDED.measurable_target,
            updated_at = NOW()
        `);
      } catch (err) {
        logger.error({ err, userId, snapshotId, itemKey }, '[maturitySnapshots] findings_actions remedies mirror failed');
      }
    }
  }
}

async function mirrorActionStatusIntoFindingsActions(
  userId: number,
  snapshotId: number,
  itemKey: string,
  status: 'not_started' | 'in_progress' | 'done',
  notes: string | null,
  completedAtIso: string | null,
  fallbackItem: RemedyItemShape | undefined,
): Promise<void> {
  const phaseMatch = itemKey.match(/^(days\d+)-\d+$/);
  const phase = phaseMatch ? phaseMatch[1] : null;

  try {
    await db.execute(sql`
      INSERT INTO findings_actions
        (user_id, source, source_ref_id, item_key, phase, segment_title, action, framework, measurable_target, status, notes, completed_at)
      VALUES
        (${userId}, 'maturity', ${snapshotId}, ${itemKey}, ${phase},
         ${fallbackItem?.segmentTitle ?? null}, ${fallbackItem?.action ?? itemKey}, ${fallbackItem?.framework ?? null}, ${fallbackItem?.measurableTarget ?? null},
         ${status}, ${notes}, ${completedAtIso})
      ON CONFLICT (user_id, source, source_ref_id, item_key)
      DO UPDATE SET
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        completed_at = EXCLUDED.completed_at,
        updated_at = NOW()
    `);

    // First engagement with this plan starts the 30/60/90-day clock -- see
    // findingsActions.ts header for why this anchors to first engagement
    // rather than row creation (anchoring to creation would flag historical
    // plans as instantly "overdue" the moment this ships).
    if (status !== 'not_started') {
      await db.execute(sql`
        UPDATE findings_actions
        SET plan_started_at = NOW()
        WHERE user_id = ${userId} AND source = 'maturity' AND source_ref_id = ${snapshotId}
          AND plan_started_at IS NULL
      `);
    }
  } catch (err) {
    logger.error({ err, userId, snapshotId, itemKey }, '[maturitySnapshots] findings_actions action-status mirror failed');
  }
}

/* ──── PATCH /api/maturity/snapshots/:id/remedies ──── */
router.patch('/maturity/snapshots/:id/remedies', requireSession, async (req, res) => {
  const userId = res.locals.userId as number;
  const id     = parseInt(String(req.params.id), 10);

  if (isNaN(id) || id < 1) {
    res.status(400).json({ ok: false, error: 'Invalid snapshot ID' });
    return;
  }

  const { remedyActions } = req.body as { remedyActions?: unknown };
  if (!remedyActions || typeof remedyActions !== 'object') {
    res.status(400).json({ ok: false, error: 'Missing or invalid remedyActions' });
    return;
  }

  try {
    const result = await db.execute(sql`
      UPDATE maturity_snapshots
      SET remedy_actions = ${JSON.stringify(remedyActions)}::jsonb
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING id
    `);

    const rows = (result as any).rows ?? result;
    if (rows.length === 0) {
      res.status(404).json({ ok: false, error: 'Snapshot not found or access denied' });
      return;
    }

    await mirrorRemediesIntoFindingsActions(userId, id, remedyActions as Record<string, unknown>);

    res.json({ ok: true });
  } catch (err) {
    logger.error({ err, userId, id }, '[maturitySnapshots] Remedies patch failed');
    res.status(500).json({ ok: false, error: 'Could not update snapshot' });
  }
});

/* ──── PATCH /api/maturity/snapshots/:id/action-status ────
 * Action Tracker (#19) — updates the status of ONE remedy item without
 * requiring a new table/migration. Deliberately reuses the existing
 * remedy_actions JSONB column rather than a dedicated action_tracker
 * table: this repo's schema changes require a manual `drizzle-kit push`
 * against production that isn't wired into the deploy pipeline, so a new
 * table would ship as dead code until someone runs that by hand. Storing
 * status inside remedy_actions.actionStatus (a plain key→status map,
 * additive to the existing executiveSummary/days30/days60/days90/
 * estimatedImpact shape) works the moment this deploys — no operator
 * step required — while staying fully backward compatible with every
 * other reader of remedy_actions (MaturityTrend, remedy correlation).
 *
 * itemKey is a deterministic "{phase}-{index}" composite (e.g. "days30-2"),
 * computed identically on the client from array position — no server-side
 * id needs to be persisted into the days30/60/90 arrays themselves.
 */
const ActionStatusSchema = z.object({
  itemKey: z.string().min(1).max(40),
  status:  z.enum(['not_started', 'in_progress', 'done']),
  notes:   z.string().max(2000).optional().nullable(),
});

router.patch('/maturity/snapshots/:id/action-status', requireSession, async (req, res) => {
  const userId = res.locals.userId as number;
  const id     = parseInt(String(req.params.id), 10);

  if (isNaN(id) || id < 1) {
    res.status(400).json({ ok: false, error: 'Invalid snapshot ID' });
    return;
  }

  const parsed = ActionStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: 'Invalid action-status payload', details: parsed.error.format() });
    return;
  }
  const { itemKey, status, notes } = parsed.data;

  try {
    const current = await db.execute(sql`
      SELECT remedy_actions FROM maturity_snapshots
      WHERE id = ${id} AND user_id = ${userId}
    `);
    const currentRows = (current as any).rows ?? current;
    if (currentRows.length === 0) {
      res.status(404).json({ ok: false, error: 'Snapshot not found or access denied' });
      return;
    }

    const remedyActions = (currentRows[0].remedy_actions ?? {}) as Record<string, unknown>;
    const actionStatus = (remedyActions.actionStatus ?? {}) as Record<string, unknown>;
    actionStatus[itemKey] = {
      status,
      notes: notes ?? null,
      completedAt: status === 'done' ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    };
    remedyActions.actionStatus = actionStatus;

    await db.execute(sql`
      UPDATE maturity_snapshots
      SET remedy_actions = ${JSON.stringify(remedyActions)}::jsonb
      WHERE id = ${id} AND user_id = ${userId}
    `);

    const phaseMatch  = itemKey.match(/^(days\d+)-(\d+)$/);
    const fallbackItem = phaseMatch
      ? ((remedyActions[phaseMatch[1]] as RemedyItemShape[] | undefined)?.[Number(phaseMatch[2])])
      : undefined;
    await mirrorActionStatusIntoFindingsActions(
      userId, id, itemKey, status, notes ?? null,
      status === 'done' ? new Date().toISOString() : null,
      fallbackItem,
    );

    res.json({ ok: true, actionStatus: actionStatus[itemKey] });
  } catch (err) {
    logger.error({ err, userId, id }, '[maturitySnapshots] Action-status patch failed');
    res.status(500).json({ ok: false, error: 'Could not update action status' });
  }
});

export default router;
