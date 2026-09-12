/**
 * /api/onboarding -- real backend persistence for the Supplier Lifecycle
 * Governance Onboarding Operational tier (Item 4, 12 Sep 2026).
 *
 * GET  /api/onboarding/register -- the caller's organization's full
 *   step-event history for a supplier (query param supplierId), newest
 *   first. Append-only: nothing is ever hidden, including reopened/
 *   re-completed steps.
 * GET  /api/onboarding/current -- the caller's organization's current
 *   onboarding completion state for a supplier, computed by replaying that
 *   org's own step events (mirrors computeCurrentOnboardingState in
 *   supplierOnboarding.ts).
 * POST /api/onboarding/events -- append ONE new step-completion or reopen
 *   event (never a whole-state replace). DOUBLE-GATED:
 *     1. The supplier must currently be onASL -- re-derived here from this
 *        org's own asl_decision_events (mirrors computeCurrentASLState in
 *        supplierPreQualification.ts), never trusted from the client.
 *     2. The caller must be this org's org_admin OR the current RACI
 *        Accountable holder for 'onboarding_signoff' (Item 2's real
 *        assignment data, replayed here exactly as preQualification.ts
 *        replays it for 'prequalification_approval').
 *   The event is also re-validated server-side against the checklist
 *   definition (no completion for a step that doesn't exist, no duplicate
 *   completion, ordered dependency for banking_details_verified, and the
 *   independent-verification-channel + first-payment-hold requirement for
 *   that same step) before it is ever inserted.
 *
 * Advisory tier note: this route is opt-in. A client on the Advisory tier
 * never calls it -- supplierOnboarding.ts's generateOnboardingChecklist()
 * runs fresh in the browser with zero persistence.
 *
 * STANDALONE-FIRST NOTE: this route does not import from the frontend
 * package (artifacts/i-supply-chain), same precedent as copq.ts, raci.ts
 * and preQualification.ts. The checklist catalog, the RACI-accountable
 * -holder replay, and the ASL-state replay below are therefore disclosed,
 * manually-synced MIRRORS of the canonical implementations in
 * supplierOnboarding.ts, supplierRACI.ts and supplierPreQualification.ts --
 * not a separate methodology. If any canonical implementation changes,
 * this copy must be updated in the same change.
 */
import { Router } from 'express';
import { db } from '@workspace/db';
import { onboardingStepEventsTable, aslDecisionEventsTable, raciAssignmentEventsTable, usersTable } from '@workspace/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { requireSession } from '../middlewares/requireSession';
import { logger } from '../lib/logger';

const router = Router();
router.use(requireSession);

/* ─── Mirrored core: onboarding checklist vocabulary (see supplierOnboarding.ts) ─── */

type OnboardingStepKey =
  | 'contract_executed' | 'nda_signed' | 'insurance_certificate_collected' | 'code_of_conduct_signed'
  | 'payment_terms_agreed' | 'banking_details_submitted' | 'banking_details_verified' | 'tax_registration_captured'
  | 'system_access_provisioned' | 'ordering_edi_setup' | 'escalation_contacts_confirmed'
  | 'sanctions_screening_cleared' | 'conflict_of_interest_declared' | 'esg_questionnaire_completed';

const REQUIRED_STEP_KEYS: OnboardingStepKey[] = [
  'contract_executed', 'nda_signed', 'insurance_certificate_collected', 'code_of_conduct_signed',
  'payment_terms_agreed', 'banking_details_submitted', 'banking_details_verified', 'tax_registration_captured',
  'system_access_provisioned', 'escalation_contacts_confirmed',
  'sanctions_screening_cleared', 'conflict_of_interest_declared',
];
const ALL_STEP_KEYS: OnboardingStepKey[] = [...REQUIRED_STEP_KEYS, 'ordering_edi_setup', 'esg_questionnaire_completed'];
const STEP_DEPENDENCIES: Partial<Record<OnboardingStepKey, OnboardingStepKey[]>> = {
  banking_details_verified: ['banking_details_submitted'],
};

type OnboardingEventAction = 'completed' | 'reopened';

/* ─── Mirrored core: ASL replay, just enough to check onASL (see supplierPreQualification.ts / preQualification.ts) ─── */

type ASLDecisionType = 'approved' | 'conditionally_approved' | 'declined' | 'suspended' | 'revoked' | 'reinstated';
function decisionKeepsOnASL(decisionType: string): boolean {
  return decisionType === 'approved' || decisionType === 'conditionally_approved' || decisionType === 'reinstated';
}

interface AslEventLike { id: number; supplierId: string; decisionType: string; createdAt: Date }

/** Replays one org's ASL events for one supplier to the latest decision, mirroring computeCurrentASLState(). */
function currentAslState(events: AslEventLike[], supplierId: string): { onASL: boolean; status: string } {
  const own = events
    .filter((e) => e.supplierId === supplierId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id - b.id);
  if (own.length === 0) return { onASL: false, status: 'NEVER_ASSESSED' };
  const latest = own[own.length - 1];
  return { onASL: decisionKeepsOnASL(latest.decisionType), status: latest.decisionType };
}

/* ─── Mirrored core: minimal RACI replay for 'onboarding_signoff' (see supplierRACI.ts / preQualification.ts) ─── */

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

/* ─── Mirrored core: minimal onboarding-state replay, just enough to validate a new event server-side ─── */

interface OnboardingEventLike { stepKey: string; action: OnboardingEventAction; createdAt: Date }

function completedStepSet(events: OnboardingEventLike[]): Set<string> {
  const ordered = [...events].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const completed = new Set<string>();
  for (const ev of ordered) {
    if (ev.action === 'completed') completed.add(ev.stepKey);
    else completed.delete(ev.stepKey);
  }
  return completed;
}

/** Server-side re-enforcement of the checklist rules -- mirrors validateStepCompletion() in supplierOnboarding.ts. */
function validateEventServerSide(
  stepKey: string,
  action: OnboardingEventAction,
  completed: Set<string>,
  verificationChannelNote: string | null | undefined,
  firstPaymentHoldAcknowledged: boolean | null | undefined,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!ALL_STEP_KEYS.includes(stepKey as OnboardingStepKey)) {
    errors.push(`'${stepKey}' is not a step in the onboarding checklist -- cannot record an event for a step that does not exist.`);
    return { valid: false, errors };
  }
  if (action === 'completed') {
    if (completed.has(stepKey)) {
      errors.push(`'${stepKey}' is already marked complete -- reopen it first if it needs to be redone.`);
    }
    const deps = STEP_DEPENDENCIES[stepKey as OnboardingStepKey];
    if (deps) {
      const missing = deps.filter((d) => !completed.has(d));
      if (missing.length > 0) errors.push(`'${stepKey}' requires these steps to be completed first: ${missing.join(', ')}.`);
    }
    if (stepKey === 'banking_details_verified') {
      if (!verificationChannelNote || verificationChannelNote.trim().length === 0) {
        errors.push('Independently-sourced verification channel must be recorded before this step can be marked complete.');
      }
      if (firstPaymentHoldAcknowledged !== true) {
        errors.push('First-payment-hold acknowledgement is required for a banking-detail verification.');
      }
    }
  } else {
    // 'reopened'
    if (!completed.has(stepKey)) {
      errors.push(`'${stepKey}' is not currently marked complete -- nothing to reopen.`);
    }
  }
  return { valid: errors.length === 0, errors };
}

/* ─── Payload validation ─────────────────────────────────────────────────── */

interface EventPayload {
  supplierId: string;
  stepKey: string;
  action: OnboardingEventAction;
  note?: string | null;
  verificationChannelNote?: string | null;
  firstPaymentHoldAcknowledged?: boolean | null;
}

function isValidPayload(a: unknown): a is EventPayload {
  if (!a || typeof a !== 'object') return false;
  const r = a as Record<string, unknown>;
  return (
    typeof r.supplierId === 'string' && r.supplierId.length > 0 &&
    typeof r.stepKey === 'string' && r.stepKey.length > 0 &&
    (r.action === 'completed' || r.action === 'reopened') &&
    (r.note === undefined || r.note === null || typeof r.note === 'string') &&
    (r.verificationChannelNote === undefined || r.verificationChannelNote === null || typeof r.verificationChannelNote === 'string') &&
    (r.firstPaymentHoldAcknowledged === undefined || r.firstPaymentHoldAcknowledged === null || typeof r.firstPaymentHoldAcknowledged === 'boolean')
  );
}

/* ─── GET /api/onboarding/register?supplierId=... ────────────────────────── */

router.get('/register', async (req, res) => {
  try {
    const userId = res.locals.userId as number;
    const supplierId = typeof req.query.supplierId === 'string' ? req.query.supplierId : null;
    const [me] = await db.select({ organizationId: usersTable.organizationId }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!me?.organizationId) {
      res.json({ ok: true, events: [] });
      return;
    }
    const whereClause = supplierId
      ? and(eq(onboardingStepEventsTable.organizationId, me.organizationId), eq(onboardingStepEventsTable.supplierId, supplierId))
      : eq(onboardingStepEventsTable.organizationId, me.organizationId);
    const rows = await db.select().from(onboardingStepEventsTable).where(whereClause).orderBy(desc(onboardingStepEventsTable.createdAt));
    res.json({ ok: true, events: rows });
  } catch (err) {
    logger.error({ err }, '[onboarding/register] GET failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

/* ─── GET /api/onboarding/current?supplierId=... ─────────────────────────── */

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
      res.json({ ok: true, completedStepKeys: [], isComplete: false });
      return;
    }
    const rows = await db
      .select()
      .from(onboardingStepEventsTable)
      .where(and(eq(onboardingStepEventsTable.organizationId, me.organizationId), eq(onboardingStepEventsTable.supplierId, supplierId)))
      .orderBy(desc(onboardingStepEventsTable.createdAt));
    const completed = completedStepSet(rows as unknown as OnboardingEventLike[]);
    const completedRequired = REQUIRED_STEP_KEYS.filter((k) => completed.has(k)).length;
    res.json({
      ok: true,
      completedStepKeys: Array.from(completed),
      isComplete: completedRequired === REQUIRED_STEP_KEYS.length,
      requiredStepCount: REQUIRED_STEP_KEYS.length,
      completedRequiredCount: completedRequired,
    });
  } catch (err) {
    logger.error({ err }, '[onboarding/current] GET failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

/* ─── POST /api/onboarding/events ─────────────────────────────────────────── */

router.post('/events', async (req, res) => {
  const body = req.body as unknown;
  if (!isValidPayload(body)) {
    res.status(400).json({ ok: false, error: 'Invalid event shape -- expected {supplierId, stepKey, action, note?, verificationChannelNote?, firstPaymentHoldAcknowledged?}' });
    return;
  }
  try {
    const actingUserId = res.locals.userId as number;
    const [actor] = await db
      .select({ organizationId: usersTable.organizationId, orgRole: usersTable.orgRole })
      .from(usersTable)
      .where(eq(usersTable.id, actingUserId))
      .limit(1);

    if (!actor?.organizationId) {
      res.status(403).json({ ok: false, error: 'No organization on this account -- cannot record an onboarding event.' });
      return;
    }

    // Gate 1: the supplier must currently be onASL -- re-derived from this
    // org's own asl_decision_events, never trusted from the client.
    const aslRows = await db
      .select({ id: aslDecisionEventsTable.id, supplierId: aslDecisionEventsTable.supplierId, decisionType: aslDecisionEventsTable.decisionType, createdAt: aslDecisionEventsTable.createdAt })
      .from(aslDecisionEventsTable)
      .where(eq(aslDecisionEventsTable.organizationId, actor.organizationId));
    const aslState = currentAslState(aslRows as AslEventLike[], body.supplierId);
    if (!aslState.onASL) {
      res.status(403).json({ ok: false, error: `This supplier's current ASL status is '${aslState.status}' -- onboarding cannot be recorded for a supplier that is not currently on the Approved Supplier List.` });
      return;
    }

    // Gate 2: write-gate -- org_admin OR the org's own current RACI
    // Accountable holder for 'onboarding_signoff'.
    if (actor.orgRole !== 'org_admin') {
      const raciRows = await db
        .select({ id: raciAssignmentEventsTable.id, activityKey: raciAssignmentEventsTable.activityKey, role: raciAssignmentEventsTable.role, userId: raciAssignmentEventsTable.userId, action: raciAssignmentEventsTable.action, createdAt: raciAssignmentEventsTable.createdAt })
        .from(raciAssignmentEventsTable)
        .where(eq(raciAssignmentEventsTable.organizationId, actor.organizationId));
      const accountableHolder = currentAccountableHolder(raciRows as RaciEventLike[], 'onboarding_signoff');
      if (accountableHolder !== actingUserId) {
        res.status(403).json({ ok: false, error: "Only your organization's admin, or the RACI Accountable holder for Onboarding Sign-off, may record onboarding events." });
        return;
      }
    }

    // Checklist validation -- replay this supplier's own prior onboarding events.
    const priorRows = await db
      .select({ stepKey: onboardingStepEventsTable.stepKey, action: onboardingStepEventsTable.action, createdAt: onboardingStepEventsTable.createdAt })
      .from(onboardingStepEventsTable)
      .where(and(eq(onboardingStepEventsTable.organizationId, actor.organizationId), eq(onboardingStepEventsTable.supplierId, body.supplierId)));
    const completed = completedStepSet(priorRows as OnboardingEventLike[]);

    const validation = validateEventServerSide(body.stepKey, body.action, completed, body.verificationChannelNote, body.firstPaymentHoldAcknowledged);
    if (!validation.valid) {
      res.status(400).json({ ok: false, error: validation.errors.join(' ') });
      return;
    }

    const [inserted] = await db
      .insert(onboardingStepEventsTable)
      .values({
        organizationId: actor.organizationId,
        supplierId: body.supplierId,
        stepKey: body.stepKey,
        action: body.action,
        actorUserId: actingUserId,
        note: body.note ?? null,
        verificationChannelNote: body.verificationChannelNote ?? null,
        firstPaymentHoldAcknowledged: body.firstPaymentHoldAcknowledged ?? null,
        aslStatusAtEvent: aslState.status,
      })
      .returning();

    logger.info({ actingUserId, organizationId: actor.organizationId, supplierId: body.supplierId, stepKey: body.stepKey, action: body.action }, '[onboarding/events] Event recorded');
    res.json({ ok: true, event: inserted });
  } catch (err) {
    logger.error({ err }, '[onboarding/events] POST failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

export default router;
