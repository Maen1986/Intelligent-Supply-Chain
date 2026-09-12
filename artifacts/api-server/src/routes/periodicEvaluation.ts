/**
 * /api/periodic-evaluation -- durable persistence for Item 5 (Periodic
 * Supplier Evaluation) Operational tier: a client's cadence override, and
 * the sign-off record of a COMPLETED periodic review (category scores +
 * derived overall recommendation). See supplierPeriodicEvaluation.ts's own
 * "WHAT THIS IS NOT" header -- this route does not touch Module 07's
 * continuous recurrence/escalation tracking at all.
 *
 * GET  /api/periodic-evaluation/current?supplierId=... -- the caller's
 *   organization's current cadence override (if any) and the most recent
 *   completed evaluation for a supplier, both computed by replaying that
 *   org's own periodic_evaluation_events.
 * POST /api/periodic-evaluation/cadence-override -- append ONE new
 *   cadence-override-set or -clear event.
 * POST /api/periodic-evaluation/complete -- append ONE new completed-
 *   evaluation event: validates category scores, derives the overall
 *   recommendation server-side (never trusts a client-submitted
 *   recommendation), and escalates into findings_actions (source =
 *   'periodic_evaluation') when that recommendation is 'escalate_consider'
 *   -- mirroring copq.ts's own alert-on-write pattern, no new alert table.
 *
 * WRITE-GATE, both POST routes (mirroring onboarding.ts's and
 * governanceTier.ts's own technique exactly): the caller must be this
 * org's org_admin OR the current RACI Accountable holder for
 * 'periodic_evaluation' -- the activity key supplierRACI.ts's
 * RACI_ACTIVITY_KEYS already anticipated at Item 2's own build, reused
 * as-is here rather than the 'periodic_evaluation_signoff' key floated at
 * spec time (checked against the existing taxonomy before picking a key,
 * per this build's own reuse discipline).
 *
 * STANDALONE-FIRST NOTE: this route does not import from the frontend
 * package (artifacts/i-supply-chain), same precedent as onboarding.ts,
 * copq.ts, raci.ts, preQualification.ts and governanceTier.ts. The
 * category-scoring/weakest-link logic and the RACI-Accountable-holder
 * replay below are therefore disclosed, manually-synced MIRRORS of the
 * canonical implementations in supplierPeriodicEvaluation.ts /
 * supplierRACI.ts -- not a separate methodology. If either canonical
 * implementation changes, this copy must be updated in the same change.
 */
import { Router } from 'express';
import { db } from '@workspace/db';
import { periodicEvaluationEventsTable, raciAssignmentEventsTable, findingsActionsTable, usersTable } from '@workspace/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireSession } from '../middlewares/requireSession';
import { logger } from '../lib/logger';

const router = Router();
router.use(requireSession);

type EvaluationCadence = 'annual' | 'semi_annual';
type CadenceOverrideAction = 'set' | 'clear';
type ScorecardCategory = 'quality' | 'delivery_otif' | 'cost' | 'service_responsiveness' | 'compliance_esg';
type CategoryRating = 'strong' | 'acceptable' | 'watch' | 'at_risk';
type OverallRecommendation = 'continue_standard_cadence' | 'monitor_closely' | 'escalate_consider';
type SIDataSourceLike = 'manual' | 'imported-file' | 'erp' | 'wms' | 'scm' | 'crm';

const VALID_CATEGORIES: ReadonlySet<string> = new Set(['quality', 'delivery_otif', 'cost', 'service_responsiveness', 'compliance_esg']);
const VALID_DATA_SOURCES: ReadonlySet<string> = new Set(['manual', 'imported-file', 'erp', 'wms', 'scm', 'crm']);

/* ─── Mirrored core: minimal RACI replay for 'periodic_evaluation' (see supplierRACI.ts / onboarding.ts / governanceTier.ts) ─── */

interface RaciEventLike { id: number; activityKey: string; role: string; userId: number; action: 'assigned' | 'unassigned'; createdAt: Date }

function currentAccountableHolder(events: RaciEventLike[], activityKey: string): number | null {
  const ordered = [...events]
    .filter((e) => e.activityKey === activityKey && e.role === 'A')
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id - b.id);
  let holder: number | null = null;
  for (const ev of ordered) {
    if (ev.action === 'assigned') holder = ev.userId;
    else if (holder === ev.userId) holder = null;
  }
  return holder;
}

/* ─── Mirrored core: cadence-override replay (mirrors governanceTier.ts's own override-replay technique) ─── */

interface CadenceOverrideEventLike { supplierId: string; action: CadenceOverrideAction; cadence: string | null; createdAt: Date }

function currentCadenceOverride(events: CadenceOverrideEventLike[], supplierId: string): { cadence: EvaluationCadence; overriddenAt: string } | null {
  const own = events.filter((e) => e.supplierId === supplierId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  if (own.length === 0) return null;
  const latest = own[own.length - 1];
  if (latest.action === 'clear' || (latest.cadence !== 'annual' && latest.cadence !== 'semi_annual')) return null;
  return { cadence: latest.cadence, overriddenAt: latest.createdAt.toISOString() };
}

/* ─── Mirrored core: category scoring bands + weakest-link overall recommendation (mirrors supplierPeriodicEvaluation.ts Sections 2-3) ─── */

function rateCategoryScore(score: number): CategoryRating {
  if (score >= 85) return 'strong';
  if (score >= 65) return 'acceptable';
  if (score >= 40) return 'watch';
  return 'at_risk';
}

const RATING_SEVERITY: Record<CategoryRating, number> = { strong: 0, acceptable: 1, watch: 2, at_risk: 3 };

function deriveOverallRecommendation(scored: { category: ScorecardCategory; rating: CategoryRating }[]): OverallRecommendation {
  let worst: CategoryRating | null = null;
  for (const s of scored) {
    if (worst === null || RATING_SEVERITY[s.rating] > RATING_SEVERITY[worst]) worst = s.rating;
  }
  if (worst === 'at_risk') return 'escalate_consider';
  if (worst === 'watch') return 'monitor_closely';
  return 'continue_standard_cadence';
}

/* ─── Latest completed evaluation replay ─────────────────────────────────── */

interface CompletedEventLike { supplierId: string; action: string; categoryScores: unknown; overallRecommendation: string | null; createdAt: Date }

function latestCompletedEvaluation(events: CompletedEventLike[], supplierId: string) {
  const own = events
    .filter((e) => e.supplierId === supplierId && e.action === 'completed')
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  if (own.length === 0) return null;
  const latest = own[own.length - 1];
  return {
    completedAt: latest.createdAt.toISOString(),
    categoryScores: latest.categoryScores,
    overallRecommendation: latest.overallRecommendation,
  };
}

/* ─── Payload validation ─────────────────────────────────────────────────── */

interface CadenceOverridePayload {
  supplierId: string;
  action: CadenceOverrideAction;
  cadence?: EvaluationCadence;
}

function isValidCadenceOverridePayload(a: unknown): a is CadenceOverridePayload {
  if (!a || typeof a !== 'object') return false;
  const r = a as Record<string, unknown>;
  if (typeof r.supplierId !== 'string' || r.supplierId.length === 0) return false;
  if (r.action === 'clear') return true;
  if (r.action === 'set') return r.cadence === 'annual' || r.cadence === 'semi_annual';
  return false;
}

interface CategoryScorePayload {
  category: ScorecardCategory;
  score: number;
  dataSource: SIDataSourceLike;
  notes?: string;
}

interface CompleteEvaluationPayload {
  supplierId: string;
  categoryScores: CategoryScorePayload[];
  notes?: string;
}

function isValidCompletePayload(a: unknown): a is CompleteEvaluationPayload {
  if (!a || typeof a !== 'object') return false;
  const r = a as Record<string, unknown>;
  if (typeof r.supplierId !== 'string' || r.supplierId.length === 0) return false;
  if (!Array.isArray(r.categoryScores) || r.categoryScores.length === 0) return false;
  for (const entry of r.categoryScores) {
    if (!entry || typeof entry !== 'object') return false;
    const e = entry as Record<string, unknown>;
    if (typeof e.category !== 'string' || !VALID_CATEGORIES.has(e.category)) return false;
    if (typeof e.score !== 'number' || !Number.isFinite(e.score) || e.score < 0 || e.score > 100) return false;
    if (typeof e.dataSource !== 'string' || !VALID_DATA_SOURCES.has(e.dataSource)) return false;
  }
  return true;
}

/* ─── GET /api/periodic-evaluation/current?supplierId=... ────────────────── */

router.get('/current', async (req, res) => {
  try {
    const userId = res.locals.userId as number;
    const supplierId = typeof req.query.supplierId === 'string' ? req.query.supplierId : null;
    if (!supplierId) {
      res.status(400).json({ ok: false, error: 'supplierId query parameter is required' });
      return;
    }
    const [me] = await db.select({ organizationId: usersTable.organizationId }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!me?.organizationId) {
      res.json({ ok: true, cadenceOverride: null, latestEvaluation: null });
      return;
    }
    const rows = await db
      .select()
      .from(periodicEvaluationEventsTable)
      .where(and(eq(periodicEvaluationEventsTable.organizationId, me.organizationId), eq(periodicEvaluationEventsTable.supplierId, supplierId)));

    const cadenceOverride = currentCadenceOverride(rows as unknown as CadenceOverrideEventLike[], supplierId);
    const latestEvaluation = latestCompletedEvaluation(rows as unknown as CompletedEventLike[], supplierId);
    res.json({ ok: true, cadenceOverride, latestEvaluation });
  } catch (err) {
    logger.error({ err }, '[periodic-evaluation/current] GET failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

/* ─── Shared write-gate helper ────────────────────────────────────────────── */

async function assertWriteGate(actingUserId: number, res: import('express').Response): Promise<number | null> {
  const [actor] = await db
    .select({ organizationId: usersTable.organizationId, orgRole: usersTable.orgRole })
    .from(usersTable)
    .where(eq(usersTable.id, actingUserId))
    .limit(1);

  if (!actor?.organizationId) {
    res.status(403).json({ ok: false, error: 'No organization on this account -- cannot record a periodic-evaluation action.' });
    return null;
  }

  if (actor.orgRole !== 'org_admin') {
    const raciRows = await db
      .select({ id: raciAssignmentEventsTable.id, activityKey: raciAssignmentEventsTable.activityKey, role: raciAssignmentEventsTable.role, userId: raciAssignmentEventsTable.userId, action: raciAssignmentEventsTable.action, createdAt: raciAssignmentEventsTable.createdAt })
      .from(raciAssignmentEventsTable)
      .where(eq(raciAssignmentEventsTable.organizationId, actor.organizationId));
    const accountableHolder = currentAccountableHolder(raciRows as RaciEventLike[], 'periodic_evaluation');
    if (accountableHolder !== actingUserId) {
      res.status(403).json({ ok: false, error: "Only your organization's admin, or the RACI Accountable holder for Periodic Evaluation, may record this action." });
      return null;
    }
  }

  return actor.organizationId;
}

/* ─── POST /api/periodic-evaluation/cadence-override ─────────────────────── */

router.post('/cadence-override', async (req, res) => {
  const body = req.body as unknown;
  if (!isValidCadenceOverridePayload(body)) {
    res.status(400).json({ ok: false, error: "Invalid cadence-override shape -- expected {supplierId, action: 'set', cadence} or {supplierId, action: 'clear'}" });
    return;
  }
  try {
    const actingUserId = res.locals.userId as number;
    const organizationId = await assertWriteGate(actingUserId, res);
    if (organizationId === null) return;

    const [inserted] = await db
      .insert(periodicEvaluationEventsTable)
      .values({
        organizationId,
        supplierId: body.supplierId,
        action: body.action === 'set' ? 'cadence_override_set' : 'cadence_override_clear',
        cadence: body.action === 'set' ? body.cadence ?? null : null,
        categoryScores: null,
        overallRecommendation: null,
        actorUserId: actingUserId,
      })
      .returning();

    logger.info({ actingUserId, organizationId, supplierId: body.supplierId, action: body.action }, '[periodic-evaluation/cadence-override] Event recorded');
    res.json({ ok: true, event: inserted });
  } catch (err) {
    logger.error({ err }, '[periodic-evaluation/cadence-override] POST failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

/* ─── POST /api/periodic-evaluation/complete ──────────────────────────────── */

router.post('/complete', async (req, res) => {
  const body = req.body as unknown;
  if (!isValidCompletePayload(body)) {
    res.status(400).json({ ok: false, error: 'Invalid completed-evaluation shape -- expected {supplierId, categoryScores: [{category, score (0-100), dataSource}], notes?}' });
    return;
  }
  try {
    const actingUserId = res.locals.userId as number;
    const organizationId = await assertWriteGate(actingUserId, res);
    if (organizationId === null) return;

    const scored = body.categoryScores.map((c) => ({ ...c, rating: rateCategoryScore(c.score) }));
    const overallRecommendation = deriveOverallRecommendation(scored);
    const shouldEscalate = overallRecommendation === 'escalate_consider';

    const [inserted] = await db
      .insert(periodicEvaluationEventsTable)
      .values({
        organizationId,
        supplierId: body.supplierId,
        action: 'completed',
        cadence: null,
        categoryScores: scored,
        overallRecommendation,
        actorUserId: actingUserId,
        notes: body.notes ?? null,
      })
      .returning();

    if (shouldEscalate && inserted) {
      await db.insert(findingsActionsTable).values({
        userId: actingUserId,
        organizationId,
        source: 'periodic_evaluation',
        sourceRefId: inserted.id,
        sourceRefKey: null,
        itemKey: `periodic-evaluation-alert-${inserted.id}`,
        phase: null,
        segmentTitle: 'Periodic Supplier Evaluation',
        action: `Supplier ${body.supplierId}'s periodic evaluation flagged at least one at-risk category -- review before the next scheduled cycle.`,
        framework: 'ISO 9001:2015 Clause 8.4.1 (re-evaluation of external providers)',
        measurableTarget: 'Review the flagged category/categories and confirm whether escalation (e.g. a Module 07 intervention, or a Item 6 audit) is warranted.',
        status: 'not_started',
        notes: `الفئة الأضعف دفعت هذه التوصية (وليس متوسطاً) للمورد ${body.supplierId} -- يلزم المراجعة قبل الدورة المقررة التالية.`,
      });
    }

    logger.info({ actingUserId, organizationId, supplierId: body.supplierId, overallRecommendation, escalated: shouldEscalate }, '[periodic-evaluation/complete] Event recorded');
    res.json({ ok: true, event: inserted, overallRecommendation, escalated: shouldEscalate });
  } catch (err) {
    logger.error({ err }, '[periodic-evaluation/complete] POST failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

export default router;
