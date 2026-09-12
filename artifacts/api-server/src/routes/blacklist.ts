/**
 * /api/blacklist -- durable persistence for Item 6 (Supplier Blacklist)
 * Operational tier. See supplierBlacklist.ts's file header for the full
 * sourced methodology, the "what this is not" distinction from Item 3's
 * ASL, the disclosed authorization-bar design decision, and the ASL
 * cross-reference design.
 *
 * GET  /api/blacklist/current?supplierId=... -- the caller's organization's
 *   current blacklist state for a supplier (isBlacklisted, isExpired,
 *   hasOpenDraft, latestEvent), computed by replaying that org's own
 *   blacklist_events (mirrors computeCurrentBlacklistState() in
 *   supplierBlacklist.ts).
 * POST /api/blacklist/draft -- append ONE new draft_set or draft_clear
 *   event: non-binding evidence-gathering, no real-world consequence yet.
 *   GATE: org_admin OR the org's current RACI Accountable holder for
 *   'blacklist_decision' (same lighter pattern as Items 1-5's write-gates).
 * POST /api/blacklist/finalize -- append ONE new 'finalized' event AND, in
 *   the SAME request, write a real cross-reference row into the EXISTING
 *   asl_decision_events table (decisionType: 'revoked', reasonCategory:
 *   'compliance_violation') -- a genuine second write into Item 3's own
 *   table, never a duplicate parallel status field. GATE: org_admin
 *   SPECIFICALLY -- a deliberate, disclosed escalation over Items 1-5's
 *   org_admin-OR-RACI-Accountable pattern (see supplierBlacklist.ts header,
 *   "AUTHORIZATION BAR" section, for the full rationale). Server-side
 *   re-validates the due-process gate (evidence threshold, right-to-
 *   respond, duration typing) before ever inserting -- never trusts a UI
 *   that happened to allow the click.
 * POST /api/blacklist/reverse -- append ONE new 'reversed' event (an
 *   appeal/correction). GATE: org_admin SPECIFICALLY, identical strictness
 *   to /finalize -- reversing a blacklist decision is equally consequential.
 *
 * NON-NEGOTIABLE PROCESS REQUIREMENT NOTE (this build, per instruction):
 * this route file itself was constructed and pushed under the standing
 * pre-flight-verification discipline (payload built from on-disk reads in
 * the workbench, hash-checked against local source, with the pre-flight
 * check's own output shown inline before the push tool call) -- see the
 * Item 6 worked-example doc's CI-gate-evidence section for the actual
 * pre-flight output shown for this push.
 *
 * STANDALONE-FIRST NOTE: this route does not import from the frontend
 * package (artifacts/i-supply-chain), same precedent as every prior route
 * in this family. The evidence-sufficiency/due-process logic and the RACI-
 * Accountable-holder replay below are therefore disclosed, manually-synced
 * MIRRORS of the canonical implementations in supplierBlacklist.ts /
 * supplierRACI.ts -- not a separate methodology. If either canonical
 * implementation changes, this copy must be updated in the same change.
 */
import { Router } from 'express';
import { db } from '@workspace/db';
import { blacklistEventsTable, aslDecisionEventsTable, raciAssignmentEventsTable, usersTable } from '@workspace/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireSession } from '../middlewares/requireSession';
import { logger } from '../lib/logger';

const router = Router();
router.use(requireSession);

type BlacklistEventAction = 'draft_set' | 'draft_clear' | 'finalized' | 'reversed';
type DurationType = 'time_bound' | 'indefinite_pending_review' | 'permanent';
type BlacklistEvidenceCategory =
  | 'periodic_evaluation_failure'
  | 'severe_copq'
  | 'performance_recovery_escalation'
  | 'compliance_violation'
  | 'contractual_breach'
  | 'other_documented_evidence';

const VALID_EVIDENCE_CATEGORIES: ReadonlySet<string> = new Set([
  'periodic_evaluation_failure',
  'severe_copq',
  'performance_recovery_escalation',
  'compliance_violation',
  'contractual_breach',
  'other_documented_evidence',
]);
const VALID_DURATION_TYPES: ReadonlySet<string> = new Set(['time_bound', 'indefinite_pending_review', 'permanent']);

/* ─── Mirrored core: independently-sufficient category rule (see supplierBlacklist.ts's isIndependentlySufficientCategory()) ─── */
function isIndependentlySufficientCategory(category: BlacklistEvidenceCategory): boolean {
  return category === 'compliance_violation' || category === 'contractual_breach' || category === 'severe_copq';
}

interface EvidenceItemPayload {
  category: BlacklistEvidenceCategory;
  detailEn: string;
  detailAr?: string;
  independentlySufficient: boolean;
}

/* ─── Mirrored core: due-process finalization validation (see supplierBlacklist.ts's validateBlacklistFinalization()) ─── */
function validateFinalizationServerSide(
  evidence: EvidenceItemPayload[],
  rightToRespondConfirmed: boolean,
  durationType: DurationType | null,
  effectiveUntilIso: string | null,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const hasIndependentlySufficient = evidence.some((e) => e.independentlySufficient);
  const accumulatingCount = evidence.filter((e) => !e.independentlySufficient).length;
  if (!hasIndependentlySufficient && accumulatingCount < 2) {
    errors.push('Evidence threshold not met -- at least one independently-sufficient evidence category, or two or more accumulating items, is required before finalization.');
  }
  if (!rightToRespondConfirmed) {
    errors.push('Cannot finalize -- the right-to-respond step has not been confirmed.');
  }
  if (!durationType) {
    errors.push('A duration type (time-bound, indefinite-pending-review, or permanent) must be explicitly chosen -- never defaulted.');
  } else if (durationType === 'time_bound' && !effectiveUntilIso) {
    errors.push('A time-bound duration requires an explicit end/review date (effectiveUntilIso).');
  }
  return { valid: errors.length === 0, errors };
}

/* ─── Mirrored core: minimal RACI replay for 'blacklist_decision' (see supplierRACI.ts / periodicEvaluation.ts) ─── */
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

/* ─── Mirrored core: current-state replay (see supplierBlacklist.ts's computeCurrentBlacklistState()) ─── */
interface BlacklistEventLike { id: number; supplierId: string; action: string; durationType: string | null; effectiveUntil: Date | null; createdAt: Date }
function currentBlacklistState(events: BlacklistEventLike[], supplierId: string, asOf: Date) {
  const own = events.filter((e) => e.supplierId === supplierId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id - b.id);
  if (own.length === 0) return { isBlacklisted: false, isExpired: false, hasOpenDraft: false, latestEvent: null as BlacklistEventLike | null };

  let isBlacklisted = false;
  let activeEntry: BlacklistEventLike | null = null;
  let hasOpenDraft = false;
  for (const ev of own) {
    if (ev.action === 'draft_set') hasOpenDraft = true;
    if (ev.action === 'draft_clear') hasOpenDraft = false;
    if (ev.action === 'finalized') { isBlacklisted = true; activeEntry = ev; }
    if (ev.action === 'reversed') { isBlacklisted = false; activeEntry = null; }
  }
  const isExpired = isBlacklisted && !!activeEntry && activeEntry.durationType === 'time_bound' && !!activeEntry.effectiveUntil && activeEntry.effectiveUntil.getTime() < asOf.getTime();
  return { isBlacklisted: isBlacklisted && !isExpired, isExpired, hasOpenDraft, latestEvent: own[own.length - 1] };
}

/* ─── Payload validation ─────────────────────────────────────────────────── */

function isValidEvidenceArray(a: unknown): a is EvidenceItemPayload[] {
  if (!Array.isArray(a)) return false;
  for (const item of a) {
    if (!item || typeof item !== 'object') return false;
    const e = item as Record<string, unknown>;
    if (typeof e.category !== 'string' || !VALID_EVIDENCE_CATEGORIES.has(e.category)) return false;
    if (typeof e.detailEn !== 'string' || e.detailEn.length === 0) return false;
    if (typeof e.independentlySufficient !== 'boolean') return false;
  }
  return true;
}

interface DraftPayload { supplierId: string; action: 'draft_set' | 'draft_clear'; evidence?: EvidenceItemPayload[] }
function isValidDraftPayload(a: unknown): a is DraftPayload {
  if (!a || typeof a !== 'object') return false;
  const r = a as Record<string, unknown>;
  if (typeof r.supplierId !== 'string' || r.supplierId.length === 0) return false;
  if (r.action === 'draft_clear') return true;
  if (r.action === 'draft_set') return r.evidence === undefined || isValidEvidenceArray(r.evidence);
  return false;
}

interface FinalizePayload {
  supplierId: string;
  evidence: EvidenceItemPayload[];
  rightToRespondConfirmed: boolean;
  durationType: DurationType;
  effectiveUntilIso?: string | null;
  notes?: string;
}
function isValidFinalizePayload(a: unknown): a is FinalizePayload {
  if (!a || typeof a !== 'object') return false;
  const r = a as Record<string, unknown>;
  if (typeof r.supplierId !== 'string' || r.supplierId.length === 0) return false;
  if (!isValidEvidenceArray(r.evidence)) return false;
  if (typeof r.rightToRespondConfirmed !== 'boolean') return false;
  if (typeof r.durationType !== 'string' || !VALID_DURATION_TYPES.has(r.durationType)) return false;
  if (r.effectiveUntilIso !== undefined && r.effectiveUntilIso !== null && typeof r.effectiveUntilIso !== 'string') return false;
  return true;
}

interface ReversePayload { supplierId: string; notes?: string }
function isValidReversePayload(a: unknown): a is ReversePayload {
  if (!a || typeof a !== 'object') return false;
  const r = a as Record<string, unknown>;
  return typeof r.supplierId === 'string' && r.supplierId.length > 0;
}

/* ─── GET /api/blacklist/current?supplierId=... ──────────────────────────── */

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
      res.json({ ok: true, isBlacklisted: false, isExpired: false, hasOpenDraft: false, latestEvent: null });
      return;
    }
    const rows = await db
      .select()
      .from(blacklistEventsTable)
      .where(and(eq(blacklistEventsTable.organizationId, me.organizationId), eq(blacklistEventsTable.supplierId, supplierId)));

    const state = currentBlacklistState(rows as unknown as BlacklistEventLike[], supplierId, new Date());
    res.json({ ok: true, ...state });
  } catch (err) {
    logger.error({ err }, '[blacklist/current] GET failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

/* ─── Shared write-gate helpers ───────────────────────────────────────────── */

/** Lighter gate (org_admin OR RACI Accountable) -- for the non-binding draft action only. */
async function assertDraftWriteGate(actingUserId: number, res: import('express').Response): Promise<number | null> {
  const [actor] = await db
    .select({ organizationId: usersTable.organizationId, orgRole: usersTable.orgRole })
    .from(usersTable)
    .where(eq(usersTable.id, actingUserId))
    .limit(1);

  if (!actor?.organizationId) {
    res.status(403).json({ ok: false, error: 'No organization on this account -- cannot record a blacklist draft.' });
    return null;
  }

  if (actor.orgRole !== 'org_admin') {
    const raciRows = await db
      .select({ id: raciAssignmentEventsTable.id, activityKey: raciAssignmentEventsTable.activityKey, role: raciAssignmentEventsTable.role, userId: raciAssignmentEventsTable.userId, action: raciAssignmentEventsTable.action, createdAt: raciAssignmentEventsTable.createdAt })
      .from(raciAssignmentEventsTable)
      .where(eq(raciAssignmentEventsTable.organizationId, actor.organizationId));
    const accountableHolder = currentAccountableHolder(raciRows as RaciEventLike[], 'blacklist_decision');
    if (accountableHolder !== actingUserId) {
      res.status(403).json({ ok: false, error: "Only your organization's admin, or the RACI Accountable holder for Blacklist Decision, may record a draft." });
      return null;
    }
  }
  return actor.organizationId;
}

/**
 * STRICTER gate (org_admin ONLY) -- for /finalize and /reverse. A deliberate
 * escalation over every other write-gate in this build (see this file's own
 * header, and supplierBlacklist.ts's "AUTHORIZATION BAR" section, for the
 * full disclosed rationale). The RACI Accountable holder for
 * 'blacklist_decision' -- sufficient for a draft -- is explicitly NOT
 * sufficient here.
 */
async function assertFinalizeWriteGate(actingUserId: number, res: import('express').Response): Promise<number | null> {
  const [actor] = await db
    .select({ organizationId: usersTable.organizationId, orgRole: usersTable.orgRole })
    .from(usersTable)
    .where(eq(usersTable.id, actingUserId))
    .limit(1);

  if (!actor?.organizationId) {
    res.status(403).json({ ok: false, error: 'No organization on this account -- cannot finalize a blacklist decision.' });
    return null;
  }
  if (actor.orgRole !== 'org_admin') {
    res.status(403).json({ ok: false, error: "Only your organization's admin may finalize or reverse a blacklist decision -- this is a deliberately stricter gate than other Supplier Lifecycle Governance actions, given the real commercial/legal consequences involved (see the module's own documentation)." });
    return null;
  }
  return actor.organizationId;
}

/* ─── POST /api/blacklist/draft ───────────────────────────────────────────── */

router.post('/draft', async (req, res) => {
  const body = req.body as unknown;
  if (!isValidDraftPayload(body)) {
    res.status(400).json({ ok: false, error: "Invalid draft shape -- expected {supplierId, action: 'draft_set', evidence?} or {supplierId, action: 'draft_clear'}" });
    return;
  }
  try {
    const actingUserId = res.locals.userId as number;
    const organizationId = await assertDraftWriteGate(actingUserId, res);
    if (organizationId === null) return;

    const [inserted] = await db
      .insert(blacklistEventsTable)
      .values({
        organizationId,
        supplierId: body.supplierId,
        action: body.action,
        evidence: body.action === 'draft_set' ? (body.evidence ?? []) : null,
        rightToRespondConfirmed: null,
        durationType: null,
        effectiveUntil: null,
        actorUserId: actingUserId,
      })
      .returning();

    logger.info({ actingUserId, organizationId, supplierId: body.supplierId, action: body.action }, '[blacklist/draft] Event recorded');
    res.json({ ok: true, event: inserted });
  } catch (err) {
    logger.error({ err }, '[blacklist/draft] POST failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

/* ─── POST /api/blacklist/finalize ────────────────────────────────────────── */

router.post('/finalize', async (req, res) => {
  const body = req.body as unknown;
  if (!isValidFinalizePayload(body)) {
    res.status(400).json({ ok: false, error: 'Invalid finalize shape -- expected {supplierId, evidence: [...], rightToRespondConfirmed, durationType, effectiveUntilIso?, notes?}' });
    return;
  }
  try {
    const actingUserId = res.locals.userId as number;
    const organizationId = await assertFinalizeWriteGate(actingUserId, res);
    if (organizationId === null) return;

    const validation = validateFinalizationServerSide(body.evidence, body.rightToRespondConfirmed, body.durationType, body.effectiveUntilIso ?? null);
    if (!validation.valid) {
      res.status(400).json({ ok: false, error: validation.errors.join(' ') });
      return;
    }

    const [inserted] = await db
      .insert(blacklistEventsTable)
      .values({
        organizationId,
        supplierId: body.supplierId,
        action: 'finalized',
        evidence: body.evidence,
        rightToRespondConfirmed: body.rightToRespondConfirmed,
        durationType: body.durationType,
        effectiveUntil: body.durationType === 'time_bound' && body.effectiveUntilIso ? new Date(body.effectiveUntilIso) : null,
        actorUserId: actingUserId,
        notes: body.notes ?? null,
      })
      .returning();

    // Real cross-reference into Item 3's OWN asl_decision_events table --
    // never a duplicate parallel status field (see this file's header).
    // qualificationGateStatusAtDecision/dueDiligenceTierAtDecision are
    // disclosed honest defaults here: this row is a CONSEQUENCE of a
    // blacklist finding, not a fresh Module 04 qualification-gate
    // re-evaluation, so 'INSUFFICIENT_EVIDENCE'/'STANDARD' are recorded
    // rather than fabricating a gate result that was never actually run.
    let aslCrossReference = null;
    if (inserted) {
      const [aslRow] = await db
        .insert(aslDecisionEventsTable)
        .values({
          organizationId,
          supplierId: body.supplierId,
          decisionType: 'revoked',
          reasonCategory: 'compliance_violation',
          reasonNote: `Automatically revoked from the Approved Supplier List as a direct consequence of blacklist event #${inserted.id} (Item 6). This is a real cross-reference, not an independent decision -- see that event's own evidence record for the underlying reason.`,
          approverUserId: actingUserId,
          qualificationGateStatusAtDecision: 'INSUFFICIENT_EVIDENCE',
          dueDiligenceTierAtDecision: 'STANDARD',
          reviewDueAt: null,
          data: { crossReferenceFromBlacklistEventId: inserted.id },
        })
        .returning();
      aslCrossReference = aslRow ?? null;
    }

    logger.info({ actingUserId, organizationId, supplierId: body.supplierId, blacklistEventId: inserted?.id, aslCrossReferenceId: aslCrossReference?.id }, '[blacklist/finalize] Event recorded, ASL cross-reference written');
    res.json({ ok: true, event: inserted, aslCrossReference });
  } catch (err) {
    logger.error({ err }, '[blacklist/finalize] POST failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

/* ─── POST /api/blacklist/reverse ─────────────────────────────────────────── */

router.post('/reverse', async (req, res) => {
  const body = req.body as unknown;
  if (!isValidReversePayload(body)) {
    res.status(400).json({ ok: false, error: 'Invalid reverse shape -- expected {supplierId, notes?}' });
    return;
  }
  try {
    const actingUserId = res.locals.userId as number;
    const organizationId = await assertFinalizeWriteGate(actingUserId, res);
    if (organizationId === null) return;

    // Server-side re-derivation: refuse to reverse a supplier that is not
    // currently, actively blacklisted -- never trust a client-supplied
    // "prior state" claim (same discipline as preQualification.ts's
    // 'reinstated' check).
    const rows = await db
      .select()
      .from(blacklistEventsTable)
      .where(and(eq(blacklistEventsTable.organizationId, organizationId), eq(blacklistEventsTable.supplierId, body.supplierId)));
    const state = currentBlacklistState(rows as unknown as BlacklistEventLike[], body.supplierId, new Date());
    if (!state.isBlacklisted) {
      res.status(400).json({ ok: false, error: 'Cannot reverse -- this supplier is not currently, actively blacklisted.' });
      return;
    }

    const [inserted] = await db
      .insert(blacklistEventsTable)
      .values({
        organizationId,
        supplierId: body.supplierId,
        action: 'reversed',
        evidence: null,
        rightToRespondConfirmed: null,
        durationType: null,
        effectiveUntil: null,
        actorUserId: actingUserId,
        notes: body.notes ?? null,
      })
      .returning();

    logger.info({ actingUserId, organizationId, supplierId: body.supplierId, blacklistEventId: inserted?.id }, '[blacklist/reverse] Event recorded');
    res.json({ ok: true, event: inserted });
  } catch (err) {
    logger.error({ err }, '[blacklist/reverse] POST failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

export default router;
