/**
 * /api/pre-qualification -- real backend persistence for the Supplier
 * Lifecycle Governance Pre-Qualification & ASL Operational tier (Item 3,
 * 11 Sep 2026).
 *
 * GET  /api/pre-qualification/register -- the caller's organization's full
 *   ASL decision-event history, newest first. Append-only: every decision
 *   ever recorded is returned, including superseded ones (a supplier that
 *   was approved, later suspended, then reinstated shows all three rows),
 *   so the audit trail is never hidden. Org-scoped, same pattern as
 *   raci.ts's /events: read from res.locals.userId -> usersTable.organizationId
 *   on the server, never trusted from the client.
 * GET  /api/pre-qualification/current -- the caller's organization's
 *   current ASL register state, one row per supplier, computed by
 *   replaying that org's own decision events (mirrors computeCurrentASLState
 *   in supplierPreQualification.ts -- same tier the Advisory client-side
 *   computation runs, just fed this org's real event log).
 * POST /api/pre-qualification/decisions -- append ONE new ASL decision
 *   event (never a whole-state replace -- see aslRegister.ts's schema
 *   header for why). GATED: only a caller who is either this org's
 *   org_admin OR the organization's own current RACI Accountable holder
 *   for the 'prequalification_approval' activity (Item 2's own RACI data,
 *   replayed here from raci_assignment_events) may write. The decision is
 *   also re-validated server-side against the caller-supplied qualification
 *   -gate snapshot before it is ever inserted -- "approved" is refused
 *   unless that snapshot says QUALIFIED, mirroring Module 04's own
 *   critical-fail rule: ASL status is derived, never a manual flag, and
 *   that rule is enforced here, not just suggested by the UI.
 *
 * Advisory tier note: this route is opt-in. A client on the Advisory tier
 * never calls it -- artifacts/i-supply-chain/src/lib/supplierPreQualification.ts's
 * computeAdvisoryASLAssessment() runs fresh in the browser/consultancy
 * session with zero persistence. Nothing here is required for the Advisory
 * tier to work.
 *
 * STANDALONE-FIRST NOTE: this route does not import from the frontend
 * package (artifacts/i-supply-chain) -- same precedent as copq.ts and
 * raci.ts. ASL_DECISION_TYPES, the reason-category lists,
 * validateDecisionServerSide(), determineReviewCadenceDaysServerSide() and the
 * local RACI-accountable-holder replay below are therefore disclosed,
 * manually-synced MIRRORS of the canonical implementations in
 * artifacts/i-supply-chain/src/lib/supplierPreQualification.ts (the ASL
 * derivation rules) and supplierRACI.ts (the RACI replay semantics) -- not
 * a separate methodology. If either canonical implementation changes, this
 * copy must be updated in the same change (same discipline as copq.ts's
 * and raci.ts's own headers).
 */
import { Router } from 'express';
import { db } from '@workspace/db';
import { aslDecisionEventsTable, raciAssignmentEventsTable, usersTable } from '@workspace/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { requireSession } from '../middlewares/requireSession';
import { logger } from '../lib/logger';

const router = Router();
router.use(requireSession);

/* ─── Mirrored core: ASL decision vocabulary (see supplierPreQualification.ts) ─── */

type QualificationGateStatus = 'QUALIFIED' | 'CONDITIONALLY_QUALIFIED' | 'NOT_QUALIFIED' | 'INSUFFICIENT_EVIDENCE';
type DueDiligenceTier = 'STANDARD' | 'ENHANCED';

interface QualificationGateSnapshotLike {
  overallStatus: QualificationGateStatus;
  blockingGate: string | null;
  dueDiligenceTier: DueDiligenceTier;
  dueDiligenceGaps?: string[];
  dueDiligenceGapsAr?: string[];
}

type ASLDecisionType = 'approved' | 'conditionally_approved' | 'declined' | 'suspended' | 'revoked' | 'reinstated';
const ASL_DECISION_TYPES: ASLDecisionType[] = ['approved', 'conditionally_approved', 'declined', 'suspended', 'revoked', 'reinstated'];

const APPROVAL_REASON_CATEGORIES = ['audit', 'qualification_form', 'certification', 'engineering_approval', 'performance_record', 'commercial_agreement'];
const LIFECYCLE_REASON_CATEGORIES = ['failed_re_review', 'certification_lapsed', 'performance_below_threshold', 'compliance_violation', 'commercial_relationship_ended', 'voluntary_exit'];

function decisionKeepsOnASL(decisionType: ASLDecisionType): boolean {
  return decisionType === 'approved' || decisionType === 'conditionally_approved' || decisionType === 'reinstated';
}

/** Server-side re-enforcement of "ASL status is derived, never manual" -- mirrors validateASLDecision() in supplierPreQualification.ts. */
function validateDecisionServerSide(
  decisionType: ASLDecisionType,
  gate: QualificationGateSnapshotLike | null,
  reasonCategory: string | null,
  priorStateWasSuspended: boolean,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (decisionType === 'approved' || decisionType === 'conditionally_approved') {
    if (!gate) {
      errors.push('No qualification-gate snapshot supplied -- cannot approve without a real gate result.');
    } else if (decisionType === 'approved' && gate.overallStatus !== 'QUALIFIED') {
      errors.push(`Cannot record 'approved' -- gate result is ${gate.overallStatus}, not QUALIFIED.`);
    } else if (decisionType === 'conditionally_approved' && gate.overallStatus !== 'QUALIFIED' && gate.overallStatus !== 'CONDITIONALLY_QUALIFIED') {
      errors.push(`Cannot record 'conditionally_approved' -- gate result is ${gate.overallStatus}.`);
    }
    if (!reasonCategory || !APPROVAL_REASON_CATEGORIES.includes(reasonCategory)) {
      errors.push('A documented approval reason (audit, qualification form, certification, engineering approval, performance record, or commercial agreement) is required.');
    }
  }

  if (decisionType === 'declined' && gate && gate.overallStatus !== 'NOT_QUALIFIED' && gate.overallStatus !== 'INSUFFICIENT_EVIDENCE') {
    errors.push(`Cannot record 'declined' -- gate result is ${gate.overallStatus}, which does not block approval.`);
  }

  if ((decisionType === 'suspended' || decisionType === 'revoked') && (!reasonCategory || !LIFECYCLE_REASON_CATEGORIES.includes(reasonCategory))) {
    errors.push('A documented lifecycle reason (failed re-review, certification lapsed, performance below threshold, compliance violation, commercial relationship ended, or voluntary exit) is required.');
  }

  if (decisionType === 'reinstated') {
    if (!priorStateWasSuspended) {
      errors.push("Cannot record 'reinstated' -- this supplier's current ASL state is not 'suspended'.");
    }
    if (!gate || (gate.overallStatus !== 'QUALIFIED' && gate.overallStatus !== 'CONDITIONALLY_QUALIFIED')) {
      errors.push("Cannot record 'reinstated' -- a fresh QUALIFIED or CONDITIONALLY_QUALIFIED gate result is required.");
    }
    if (!reasonCategory || !LIFECYCLE_REASON_CATEGORIES.includes(reasonCategory)) {
      errors.push('A documented lifecycle reason is required to explain the reinstatement.');
    }
  }

  return { valid: errors.length === 0, errors };
}

/** Mirrors determineReviewCadence() in supplierPreQualification.ts. */
function determineReviewCadenceDaysServerSide(riskSignals: { kraljicQuadrant?: string; concentrationBand?: string } | undefined): number {
  const highCriticality = riskSignals?.kraljicQuadrant === 'strategic' || riskSignals?.kraljicQuadrant === 'bottleneck';
  const concentrated = riskSignals?.concentrationBand === 'highlyConcentrated' || riskSignals?.concentrationBand === 'moderatelyConcentrated';
  if (highCriticality) return 90;
  if (concentrated) return 182;
  return 365;
}

/* ─── Mirrored core: minimal RACI replay, just enough to find the current Accountable holder for 'prequalification_approval' (see supplierRACI.ts / raci.ts) ─── */

interface RaciEventLike {
  id: number;
  activityKey: string;
  role: string;
  userId: number;
  action: 'assigned' | 'unassigned';
  createdAt: Date;
}

/** Replays one org's RACI events for a single (activityKey, role='A') cell -- R/A are single-owner roles, so the latest 'assigned' event (not since superseded by an 'unassigned' for that same user) wins. */
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

/* ─── Payload validation ─────────────────────────────────────────────────── */

interface DecisionPayload {
  supplierId: string;
  decisionType: ASLDecisionType;
  reasonCategory: string;
  reasonNote?: string | null;
  gate: QualificationGateSnapshotLike | null;
  riskSignals?: { kraljicQuadrant?: string; concentrationBand?: string };
}

function isValidGate(g: unknown): g is QualificationGateSnapshotLike {
  if (g === null) return true;
  if (!g || typeof g !== 'object') return false;
  const r = g as Record<string, unknown>;
  const statuses: QualificationGateStatus[] = ['QUALIFIED', 'CONDITIONALLY_QUALIFIED', 'NOT_QUALIFIED', 'INSUFFICIENT_EVIDENCE'];
  const tiers: DueDiligenceTier[] = ['STANDARD', 'ENHANCED'];
  return (
    typeof r.overallStatus === 'string' && statuses.includes(r.overallStatus as QualificationGateStatus) &&
    (r.blockingGate === null || typeof r.blockingGate === 'string') &&
    typeof r.dueDiligenceTier === 'string' && tiers.includes(r.dueDiligenceTier as DueDiligenceTier)
  );
}

function isValidPayload(a: unknown): a is DecisionPayload {
  if (!a || typeof a !== 'object') return false;
  const r = a as Record<string, unknown>;
  return (
    typeof r.supplierId === 'string' && r.supplierId.length > 0 &&
    typeof r.decisionType === 'string' && (ASL_DECISION_TYPES as string[]).includes(r.decisionType) &&
    typeof r.reasonCategory === 'string' && r.reasonCategory.length > 0 &&
    (r.reasonNote === undefined || r.reasonNote === null || typeof r.reasonNote === 'string') &&
    'gate' in r && isValidGate(r.gate)
  );
}

/* ─── GET /api/pre-qualification/register ───────────────────────────────── */

router.get('/register', async (_req, res) => {
  try {
    const userId = res.locals.userId as number;
    const [me] = await db.select({ organizationId: usersTable.organizationId }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!me?.organizationId) {
      res.json({ ok: true, events: [] });
      return;
    }
    const rows = await db
      .select()
      .from(aslDecisionEventsTable)
      .where(eq(aslDecisionEventsTable.organizationId, me.organizationId))
      .orderBy(desc(aslDecisionEventsTable.createdAt));
    res.json({ ok: true, events: rows });
  } catch (err) {
    logger.error({ err }, '[pre-qualification/register] GET failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

/* ─── GET /api/pre-qualification/current ─────────────────────────────────
   Computed current ASL state per supplier, by replaying this org's own
   decision events -- mirrors computeCurrentASLState() in
   supplierPreQualification.ts, the Operational-tier read side of the
   Advisory/Operational split. */

router.get('/current', async (_req, res) => {
  try {
    const userId = res.locals.userId as number;
    const [me] = await db.select({ organizationId: usersTable.organizationId }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!me?.organizationId) {
      res.json({ ok: true, current: [] });
      return;
    }
    const rows = await db
      .select()
      .from(aslDecisionEventsTable)
      .where(eq(aslDecisionEventsTable.organizationId, me.organizationId))
      .orderBy(desc(aslDecisionEventsTable.createdAt));

    const bySupplier = new Map<string, typeof rows[number][]>();
    for (const row of rows) {
      const list = bySupplier.get(row.supplierId) ?? [];
      list.push(row);
      bySupplier.set(row.supplierId, list);
    }

    const now = Date.now();
    const current = Array.from(bySupplier.entries()).map(([supplierId, events]) => {
      const latest = events[0]; // already newest-first from the query
      const onASL = decisionKeepsOnASL(latest.decisionType as ASLDecisionType);
      const reviewDueAt = latest.reviewDueAt;
      const isReviewOverdue = onASL && !!reviewDueAt && new Date(reviewDueAt).getTime() < now;
      return { supplierId, status: latest.decisionType, onASL, latestEvent: latest, reviewDueAt, isReviewOverdue };
    });

    res.json({ ok: true, current });
  } catch (err) {
    logger.error({ err }, '[pre-qualification/current] GET failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

/* ─── POST /api/pre-qualification/decisions ──────────────────────────────── */

router.post('/decisions', async (req, res) => {
  const body = req.body as unknown;
  if (!isValidPayload(body)) {
    res.status(400).json({ ok: false, error: 'Invalid decision shape -- expected {supplierId, decisionType, reasonCategory, reasonNote?, gate, riskSignals?}' });
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
      res.status(403).json({ ok: false, error: 'No organization on this account -- cannot record an ASL decision.' });
      return;
    }

    // Write-gate: org_admin OR the org's own current RACI Accountable
    // holder for 'prequalification_approval' (Item 2's real assignment
    // data, replayed here) -- never a client-supplied role claim.
    if (actor.orgRole !== 'org_admin') {
      const raciRows = await db
        .select({ id: raciAssignmentEventsTable.id, activityKey: raciAssignmentEventsTable.activityKey, role: raciAssignmentEventsTable.role, userId: raciAssignmentEventsTable.userId, action: raciAssignmentEventsTable.action, createdAt: raciAssignmentEventsTable.createdAt })
        .from(raciAssignmentEventsTable)
        .where(eq(raciAssignmentEventsTable.organizationId, actor.organizationId));
      const accountableHolder = currentAccountableHolder(raciRows as RaciEventLike[], 'prequalification_approval');
      if (accountableHolder !== actingUserId) {
        res.status(403).json({ ok: false, error: "Only your organization's admin, or the RACI Accountable holder for Pre-Qualification Approval, may record ASL decisions." });
        return;
      }
    }

    // Determine this supplier's current ASL state server-side -- never
    // trust a client-supplied "prior state" claim for a 'reinstated' decision.
    const priorRows = await db
      .select()
      .from(aslDecisionEventsTable)
      .where(and(eq(aslDecisionEventsTable.organizationId, actor.organizationId), eq(aslDecisionEventsTable.supplierId, body.supplierId)))
      .orderBy(desc(aslDecisionEventsTable.createdAt))
      .limit(1);
    const priorStateWasSuspended = priorRows.length > 0 && priorRows[0].decisionType === 'suspended';

    const validation = validateDecisionServerSide(body.decisionType, body.gate, body.reasonCategory, priorStateWasSuspended);
    if (!validation.valid) {
      res.status(400).json({ ok: false, error: validation.errors.join(' ') });
      return;
    }

    const reviewDueAt = decisionKeepsOnASL(body.decisionType)
      ? new Date(Date.now() + determineReviewCadenceDaysServerSide(body.riskSignals) * 24 * 60 * 60 * 1000)
      : null;

    const [inserted] = await db
      .insert(aslDecisionEventsTable)
      .values({
        organizationId: actor.organizationId,
        supplierId: body.supplierId,
        decisionType: body.decisionType,
        reasonCategory: body.reasonCategory,
        reasonNote: body.reasonNote ?? null,
        approverUserId: actingUserId,
        qualificationGateStatusAtDecision: body.gate?.overallStatus ?? 'INSUFFICIENT_EVIDENCE',
        dueDiligenceTierAtDecision: body.gate?.dueDiligenceTier ?? 'STANDARD',
        reviewDueAt,
        data: { gate: body.gate, riskSignals: body.riskSignals ?? null },
      })
      .returning();

    logger.info({ actingUserId, organizationId: actor.organizationId, supplierId: body.supplierId, decisionType: body.decisionType }, '[pre-qualification/decisions] Decision recorded');
    res.json({ ok: true, event: inserted });
  } catch (err) {
    logger.error({ err }, '[pre-qualification/decisions] POST failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

export default router;
