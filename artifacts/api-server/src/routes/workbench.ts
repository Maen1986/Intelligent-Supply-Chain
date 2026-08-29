/**
 * My Workbench (#172, Wave B-4, 23 Aug 2026)
 *
 * GET /api/workbench/summary
 *
 * A personal aggregation view -- "my actions, my investigations, my
 * commitments, my decisions" -- pulling together data already spread
 * across separate tools, per the site map's own framing (UI/UX Vision
 * Synthesis & Scalability Plan v4, Wave B-4).
 *
 * This route covers exactly two of those four buckets: actions and
 * investigations. The other two are deliberately NOT duplicated here:
 *
 *   - "My commitments" already has a real, working, server-persisted
 *     endpoint: GET /api/plans (see plans.ts), already rendered on
 *     AccountSettings via SavedPlansSection.tsx. Re-implementing that read
 *     here would create two code paths for the same data that could drift
 *     out of sync with each other. The frontend calls /api/plans directly.
 *
 *   - "My decisions" (Decision Lab, #166) has no server persistence at
 *     all -- DecisionLab.tsx stores only the single most recent scenario,
 *     client-side, under localStorage key 'isc-decision-lab-v1' (see
 *     DecisionLab.tsx's own header comment: "the scenario itself is
 *     localStorage only"). There is nothing this backend route could
 *     honestly return for that bucket -- the frontend reads the same
 *     localStorage key directly and labels it "on this device" rather
 *     than silently presenting device-local data as if it were synced.
 *
 * "My actions": the FULL findings_actions list for this user (not time-
 * windowed, unlike the Daily/Weekly Brief's #171 needsYou bucket, which
 * only shows what needs attention right now) -- Workbench is a persistent
 * workspace, not a digest, so every action the user has ever been given
 * belongs here, grouped by status.
 *
 * "My investigations": the user's own Consultancy Engine history --
 * submissions rows this user generated via POST /api/consultancy/diagnose
 * or /solution (see consultancy.ts). The unauthenticated public /diagnostic
 * tool does not persist to this table at all (checked in consultancy.ts vs
 * diagnostic.ts before building this), so there is no risk of leaking a
 * pre-signup session's submission into a signed-in user's workbench.
 *
 * #178 delta (24 Aug 2026, Decision Record 8.10): each investigation now
 * also carries problemStatus, a count of its Problem DNA problems[] by
 * status (Active/Resolved/Recurring, #167) -- the honest, buildable half
 * of the original "Problem Map" ask (the literal ask needed a domain
 * taxonomy that exists nowhere in this codebase; see consultancy.ts's
 * header for the full reasoning). Consultancy Engine diagnoses'
 * urgentActions[] are now also written to findings_actions at diagnose
 * time (source='command_centre'), so they show up in "My Actions" above
 * too -- before this delta a Consultancy diagnosis produced zero trackable
 * rows in this workbench at all.
 */
import { Router }          from 'express';
import { db }               from '@workspace/db';
import { sql }              from 'drizzle-orm';
import { requireSession }   from '../middlewares/requireSession';
import { logger }           from '../lib/logger';

const router = Router();

router.get('/workbench/summary', requireSession, async (req, res) => {
  const userId = res.locals.userId as number;

  try {
    // Decision-readiness (Decision Record 8.6): compute a real due_at per item, the same
    // 30/60/90-day phase-offset formula scheduler.ts and brief.ts already use, so a client
    // sees the same "overdue" definition everywhere in the platform rather than three
    // silently-different ones.
    const actionsResult = await db.execute(sql`
      SELECT id, source, phase, segment_title, action, status, notes, plan_started_at, completed_at, created_at, updated_at,
        CASE
          WHEN plan_started_at IS NOT NULL AND phase IS NOT NULL THEN
            plan_started_at + (
              CASE phase
                WHEN 'days30' THEN INTERVAL '30 days'
                WHEN 'days60' THEN INTERVAL '60 days'
                WHEN 'days90' THEN INTERVAL '90 days'
                ELSE INTERVAL '9999 days'
              END
            )
          ELSE NULL
        END AS due_at
      FROM findings_actions
      WHERE user_id = ${userId}
      ORDER BY
        CASE status WHEN 'not_started' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,
        created_at DESC
      LIMIT 50
    `);
    const actionRows = ((actionsResult as any).rows ?? actionsResult) as Array<{
      id: number; source: string; phase: string | null; segment_title: string | null;
      action: string; status: string; notes: string | null;
      plan_started_at: string | null; completed_at: string | null; created_at: string; updated_at: string;
      due_at: string | null;
    }>;

    const investigationsResult = await db.execute(sql`
      SELECT id, tool, inputs, outputs, created_at
      FROM submissions
      WHERE user_id = ${userId} AND tool IN ('diagnostic', 'command_centre')
      ORDER BY created_at DESC
      LIMIT 20
    `);
    const investigationRows = ((investigationsResult as any).rows ?? investigationsResult) as Array<{
      id: number; tool: string; inputs: any; outputs: any; created_at: string;
    }>;

    const actions = {
      total: actionRows.length,
      notStarted: actionRows.filter(a => a.status === 'not_started').length,
      inProgress: actionRows.filter(a => a.status === 'in_progress').length,
      done: actionRows.filter(a => a.status === 'done').length,
      items: actionRows.map(a => {
        const isOverdue = a.status !== 'done' && !!a.due_at && new Date(a.due_at).getTime() < Date.now();
        return {
          id: a.id,
          source: a.source,
          phase: a.phase,
          segmentTitle: a.segment_title,
          action: a.action,
          status: a.status,
          createdAt: a.created_at,
          completedAt: a.completed_at,
          dueAt: a.due_at,
          isOverdue,
          daysOverdue: isOverdue ? Math.max(1, Math.floor((Date.now() - new Date(a.due_at as string).getTime()) / 86400000)) : null,
        };
      }),
    };

    // #178 delta (24 Aug 2026, Decision Record 8.10): normalize each
    // investigation's Problem DNA statuses (Active/Resolved/Recurring, #167)
    // into one summary object so the frontend can show a real status badge
    // instead of just a raw problem count. This is the honest, buildable
    // half of #178's "status vocabulary" ask -- it reconciles the ONE
    // status field that genuinely exists on Problem DNA data; it does not
    // invent a cross-tool vocabulary spanning findings_actions'
    // not_started/in_progress/done too, since those are a different grain
    // (per-action, not per-problem) and force-mapping them would be a
    // fabricated equivalence, not a real one. problemStatus is null for
    // submissions with no problems[] (the public wizard's flat-shape rows).
    const investigations = investigationRows.map(r => {
      const problems = Array.isArray(r.outputs?.problems) ? r.outputs.problems as Array<{ status?: string }> : null;
      const problemStatus = problems ? {
        active:    problems.filter(p => p.status === 'Active').length,
        resolved:  problems.filter(p => p.status === 'Resolved').length,
        recurring: problems.filter(p => p.status === 'Recurring').length,
      } : null;
      return {
        id: r.id,
        tool: r.tool,
        industry: r.inputs?.industry ?? null,
        subIndustry: r.inputs?.subIndustry ?? null,
        challenge: r.inputs?.challenge ?? null,
        // Problem DNA (#167) count -- only present on 'diagnostic' tool outputs; a
        // real, cheap-to-read decision-relevant detail, not an invented one.
        problemCount: problems ? problems.length : null,
        problemStatus,
        createdAt: r.created_at,
      };
    });

    res.json({
      ok: true,
      hasData: actions.total > 0 || investigations.length > 0,
      actions,
      investigations,
    });
  } catch (err) {
    logger.error({ err }, '[workbench/summary] failed');
    res.status(500).json({ ok: false, error: 'Failed to build workbench' });
  }
});

/**
 * GET /api/workbench/problem-map (#192, 30 Aug 2026, Decision Record 8.7/8.10)
 *
 * Owner-approved design (see ISC_Problem_Map_192_Design_Proposal.docx v2,
 * Decision 1 as revised during build-out, Decision 2 Option A "enhanced to
 * the maximum"):
 *
 *   X-axis was originally proposed as the 10-category focusArea taxonomy
 *   (diagnosticEngine.ts). Grounding this route in the real schema surfaced
 *   a fact the proposal got wrong: focusArea is captured ONLY on the public
 *   Diagnostic wizard's submissions -- and the wizard never produces
 *   Problem DNA (no problems[], no severityScore, see the honest-gap note
 *   below). The ONLY rows that carry severityScore are authenticated
 *   Consultancy Engine diagnoses (POST /consultancy/diagnose), and those
 *   rows carry industry/subIndustry (CommandCenter.tsx's own 24-item
 *   INDUSTRY_TREE), never focusArea. There is no real row anywhere in this
 *   codebase with both a focusArea tag and a severityScore. Rather than
 *   fabricate that pairing, the X-axis was corrected -- with the owner's
 *   explicit sign-off -- to industry/subIndustry, the one dimension that
 *   genuinely co-occurs with severityScore on every Problem DNA row.
 *
 *   "Level" note (owner asked "at which level ... make all levels"): the
 *   only real two-level hierarchy in this data is industry -> subIndustry
 *   (Command Centre's own INDUSTRY_TREE). Level 1 (industry) drives the
 *   plotted X-axis, since ~24 categories is chart-legible; Level 2
 *   (subIndustry) is surfaced in the tooltip and as a filter, the same
 *   "category -> subcategory" pattern KraljicMatrix.tsx's ScatterTooltip
 *   already uses. focusArea (flat, one level, no sub-level exists) moves
 *   to the wizard-only tally strip below, where it is the real field.
 *
 * "diagnostic" is an overloaded tool value in `submissions`: both the
 * public wizard AND POST /consultancy/diagnose write tool='diagnostic'
 * (only the follow-up /consultancy/solution step writes
 * tool='command_centre', and that step has no problems[] either). So the
 * only honest way to tell a scored diagnosis from a flat wizard report is
 * the same JSON-shape check workbench/summary already uses one function up:
 * Array.isArray(outputs?.problems). Reused verbatim here, not reinvented.
 *
 * Two disjoint result sets, matching the two disjoint real populations:
 *
 *   - points[]: one entry per Problem DNA problem (has severityScore) --
 *     plots on the scatter.
 *   - wizardTally[]: one entry per focusArea, counting Diagnostic-wizard
 *     submissions with no problems[] -- the enhanced tally strip (Decision
 *     2). Rows with neither problems[] nor a focusArea (e.g. a
 *     tool='command_centre' /solution follow-up) belong to neither bucket
 *     and are silently excluded -- correct, not a bug: they carry no
 *     domain tag and no severity value, so nothing here could honestly
 *     place them on this page.
 */
export async function resolveProblemMapPoints(userId: number) {
  const result = await db.execute(sql`
    SELECT id, inputs, outputs, created_at
    FROM submissions
    WHERE user_id = ${userId} AND tool IN ('diagnostic', 'command_centre')
    ORDER BY created_at DESC
    LIMIT 100
  `);
  const rows = ((result as any).rows ?? result) as Array<{
    id: number; inputs: any; outputs: any; created_at: string;
  }>;

  type Point = {
    id: string; submissionId: number; industry: string; subIndustry: string | null;
    title: string; severityScore: number; status: string; framework: string | null;
    confidence: number | null; createdAt: string;
  };
  const points: Point[] = [];

  type TallyRow = { focusArea: string; count: number; mostRecentAt: string };
  const tallyMap = new Map<string, TallyRow>();

  for (const r of rows) {
    const problems = Array.isArray(r.outputs?.problems) ? r.outputs.problems as Array<{
      id?: string; title?: string; status?: string; severityScore?: number;
      framework?: string; confidence?: number;
    }> : null;

    if (problems) {
      const industry = typeof r.inputs?.industry === 'string' ? r.inputs.industry : null;
      if (!industry) continue; // no domain to plot on X -- exclude rather than guess one
      const subIndustry = typeof r.inputs?.subIndustry === 'string' ? r.inputs.subIndustry : null;
      problems.forEach((p, idx) => {
        if (typeof p.severityScore !== 'number') return; // no Y-value -- exclude, never fabricate
        points.push({
          id: `${r.id}-${p.id ?? idx}`,
          submissionId: r.id,
          industry,
          subIndustry,
          title: p.title ?? 'Untitled problem',
          severityScore: Math.max(0, Math.min(100, p.severityScore)),
          status: p.status ?? 'Active',
          framework: p.framework ?? null,
          confidence: typeof p.confidence === 'number' ? p.confidence : null,
          createdAt: r.created_at,
        });
      });
    } else {
      const focusArea = typeof r.inputs?.focusArea === 'string' ? r.inputs.focusArea : null;
      if (!focusArea) continue; // neither problems[] nor focusArea -- nothing honest to plot
      const existing = tallyMap.get(focusArea);
      if (existing) {
        existing.count += 1;
        if (r.created_at > existing.mostRecentAt) existing.mostRecentAt = r.created_at;
      } else {
        tallyMap.set(focusArea, { focusArea, count: 1, mostRecentAt: r.created_at });
      }
    }
  }

  const wizardTally = Array.from(tallyMap.values()).sort((a, b) => b.count - a.count);
  return { points, wizardTally };
}

router.get('/workbench/problem-map', requireSession, async (req, res) => {
  const userId = res.locals.userId as number;
  try {
    const { points, wizardTally } = await resolveProblemMapPoints(userId);
    res.json({
      ok: true,
      hasData: points.length > 0 || wizardTally.length > 0,
      points,
      wizardTally,
    });
  } catch (err) {
    logger.error({ err }, '[workbench/problem-map] failed');
    res.status(500).json({ ok: false, error: 'Failed to build problem map' });
  }
});

export default router;
