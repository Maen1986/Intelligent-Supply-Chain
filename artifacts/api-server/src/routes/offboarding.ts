/**
 * /api/offboarding -- durable persistence for Item 7 (Offboarding &
 * Transition) Operational tier. See supplierOffboarding.ts's file header
 * for the full sourced methodology, the "what this is not" distinction
 * from Item 6's blacklist and Item 3's ASL, the disclosed (NOT escalated)
 * authorization-bar design decision, and the ASL cross-reference design.
 *
 * GET  /api/offboarding/current?supplierId=... -- the caller's
 *   organization's current transition state for a supplier (isOpen,
 *   isClosed, triggerReason, cooperationLevel, checklist, completionPct),
 *   computed by replaying that org's own transition_events (mirrors
 *   computeCurrentTransitionState() in supplierOffboarding.ts).
 * POST /api/offboarding/open -- append ONE new 'opened' event, fixing
 *   triggerReason/cooperationLevel/replacementSupplierNamed for the life
 *   of this transition record. GATE: org_admin OR the org's current RACI
 *   Accountable holder for 'offboarding_decision' -- the STANDARD gate,
 *   deliberately NOT escalated the way Item 6's finalize/reverse are (see
 *   supplierOffboarding.ts header for the full rationale).
 * POST /api/offboarding/checklist -- append ONE new 'checklist_item_updated'
 *   event. Same standard gate.
 * POST /api/offboarding/close -- append ONE new 'closed' event AND,
 *   ONLY when the trigger reason is one of the five ordinary-business
 *   reasons (never for the two cross-referenced triggers, which already
 *   represent a decision Item 6 or Item 3 made), write a real cross-
 *   reference row into the EXISTING asl_decision_events table --
 *   guarded additionally against writing when the supplier is already off
 *   the ASL (no duplicate revocation). Server-side re-validates closure
 *   (every mandatory/conditional-mandatory checklist item complete or
 *   not_applicable) before ever inserting. Same standard gate.
 * POST /api/offboarding/reopen -- append ONE new 'reopened' event. Same
 *   standard gate.
 *
 * STANDALONE-FIRST NOTE: this route does not import from the frontend
 * package (artifacts/i-supply-chain), same precedent as every prior route
 * in this family. The requirement-level/closure-validation logic and the
 * RACI-Accountable-holder replay below are therefore disclosed, manually-
 * synced MIRRORS of the canonical implementations in
 * supplierOffboarding.ts / supplierRACI.ts -- not a separate methodology.
 * If either canonical implementation changes, this copy must be updated in
 * the same change.
 */
import { Router } from 'express';
import { db } from '@workspace/db';
import { transitionEventsTable, aslDecisionEventsTable, raciAssignmentEventsTable, usersTable } from '@workspace/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireSession } from '../middlewares/requireSession';
import { logger } from '../lib/logger';

const router = Router();
router.use(requireSession);

type TransitionEventAction = 'opened' | 'checklist_item_updated' | 'closed' | 'reopened';
type OffboardingTriggerReason =
  | 'natural_contract_end'
  | 'mutual_termination'
  | 'supplier_initiated_exit'
  | 'replaced_by_another_supplier'
  | 'insourced'
  | 'blacklist_finalized'
  | 'asl_revoked_unrelated';
type CooperationLevel = 'cooperative' | 'limited' | 'adversarial';
type TransitionChecklistItemKey =
  | 'access_revocation'
  | 'data_return_or_destruction'
  | 'asset_recovery'
  | 'knowledge_transfer'
  | 'final_settlement'
  | 'contractual_closeout'
  | 'open_commitment_wind_down'
  | 'exit_feedback_and_reference'
  | 'post_exit_follow_up';
type TransitionItemStatus = 'pending' | 'in_progress' | 'complete' | 'not_applicable';
type ChecklistRequirementLevel = 'mandatory' | 'conditional_mandatory' | 'recommended' | 'not_applicable';

const VALID_TRIGGERS: ReadonlySet<string> = new Set([
  'natural_contract_end', 'mutual_termination', 'supplier_initiated_exit',
  'replaced_by_another_supplier', 'insourced', 'blacklist_finalized', 'asl_revoked_unrelated',
]);
const VALID_COOPERATION_LEVELS: ReadonlySet<string> = new Set(['cooperative', 'limited', 'adversarial']);
const CHECKLIST_KEYS: TransitionChecklistItemKey[] = [
  'access_revocation', 'data_return_or_destruction', 'asset_recovery', 'knowledge_transfer',
  'final_settlement', 'contractual_closeout', 'open_commitment_wind_down',
  'exit_feedback_and_reference', 'post_exit_follow_up',
];
const VALID_CHECKLIST_KEYS: ReadonlySet<string> = new Set(CHECKLIST_KEYS);
const VALID_ITEM_STATUSES: ReadonlySet<string> = new Set(['pending', 'in_progress', 'complete', 'not_applicable']);

/* ─── Mirrored core: requirement-level logic (see supplierOffboarding.ts's determineChecklistRequirement()) ─── */
function determineChecklistRequirement(
  key: TransitionChecklistItemKey,
  trigger: OffboardingTriggerReason,
  cooperationLevel: CooperationLevel,
  replacementSupplierNamed: boolean,
): ChecklistRequirementLevel {
  switch (key) {
    case 'access_revocation':
    case 'data_return_or_destruction':
    case 'final_settlement':
    case 'contractual_closeout':
    case 'open_commitment_wind_down':
    case 'asset_recovery':
      return 'mandatory';
    case 'knowledge_transfer':
      return trigger === 'replaced_by_another_supplier' || trigger === 'insourced' || replacementSupplierNamed
        ? 'conditional_mandatory'
        : 'recommended';
    case 'exit_feedback_and_reference':
      return cooperationLevel === 'adversarial' ? 'not_applicable' : 'mandatory';
    case 'post_exit_follow_up':
      return 'recommended';
  }
}
function isGatingRequirement(level: ChecklistRequirementLevel): boolean {
  return level === 'mandatory' || level === 'conditional_mandatory';
}

/* ─── Mirrored core: ASL cross-reference mapping (see supplierOffboarding.ts's mapTriggerToAslReasonCategory()) ─── */
function mapTriggerToAslReasonCategory(trigger: OffboardingTriggerReason): 'commercial_relationship_ended' | 'voluntary_exit' | null {
  switch (trigger) {
    case 'supplier_initiated_exit':
      return 'voluntary_exit';
    case 'natural_contract_end':
    case 'mutual_termination':
    case 'replaced_by_another_supplier':
    case 'insourced':
      return 'commercial_relationship_ended';
    case 'blacklist_finalized':
    case 'asl_revoked_unrelated':
      return null;
  }
}

/* ─── Mirrored core: current-state replay (see supplierOffboarding.ts's computeCurrentTransitionState()) ─── */
interface TransitionEventLike {
  id: number; supplierId: string; action: string;
  triggerReason: string | null; cooperationLevel: string | null; replacementSupplierNamed: boolean | null;
  checklistItemKey: string | null; itemStatus: string | null; createdAt: Date;
}
function currentTransitionState(events: TransitionEventLike[], supplierId: string) {
  const own = events.filter((e) => e.supplierId === supplierId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id - b.id);
  if (own.length === 0 || own[0].action !== 'opened') {
    return { isOpen: false, isClosed: false, triggerReason: null as OffboardingTriggerReason | null, cooperationLevel: null as CooperationLevel | null, replacementSupplierNamed: false, checklist: [] as { key: TransitionChecklistItemKey; requirement: ChecklistRequirementLevel; status: TransitionItemStatus }[], latestEvent: own.length > 0 ? own[own.length - 1] : null };
  }
  const opened = own[0];
  const trigger = opened.triggerReason as OffboardingTriggerReason;
  const cooperationLevel = opened.cooperationLevel as CooperationLevel;
  const replacementSupplierNamed = !!opened.replacementSupplierNamed;

  const map = new Map<TransitionChecklistItemKey, { key: TransitionChecklistItemKey; requirement: ChecklistRequirementLevel; status: TransitionItemStatus }>();
  for (const key of CHECKLIST_KEYS) {
    const requirement = determineChecklistRequirement(key, trigger, cooperationLevel, replacementSupplierNamed);
    map.set(key, { key, requirement, status: requirement === 'not_applicable' ? 'not_applicable' : 'pending' });
  }
  let isClosed = false;
  for (const ev of own) {
    if (ev.action === 'checklist_item_updated' && ev.checklistItemKey && ev.itemStatus) {
      const cur = map.get(ev.checklistItemKey as TransitionChecklistItemKey);
      if (cur) map.set(ev.checklistItemKey as TransitionChecklistItemKey, { ...cur, status: ev.itemStatus as TransitionItemStatus });
    }
    if (ev.action === 'closed') isClosed = true;
    if (ev.action === 'reopened') isClosed = false;
  }
  return { isOpen: true, isClosed, triggerReason: trigger, cooperationLevel, replacementSupplierNamed, checklist: CHECKLIST_KEYS.map((k) => map.get(k)!), latestEvent: own[own.length - 1] };
}

/* ─── Mirrored core: minimal RACI replay for 'offboarding_decision' (see supplierRACI.ts) ─── */
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

/* ─── Payload validation ─────────────────────────────────────────────────── */

interface OpenPayload { supplierId: string; triggerReason: OffboardingTriggerReason; cooperationLevel: CooperationLevel; replacementSupplierNamed?: boolean; notes?: string }
function isValidOpenPayload(a: unknown): a is OpenPayload {
  if (!a || typeof a !== 'object') return false;
  const r = a as Record<string, unknown>;
  if (typeof r.supplierId !== 'string' || r.supplierId.length === 0) return false;
  if (typeof r.triggerReason !== 'string' || !VALID_TRIGGERS.has(r.triggerReason)) return false;
  if (typeof r.cooperationLevel !== 'string' || !VALID_COOPERATION_LEVELS.has(r.cooperationLevel)) return false;
  if (r.replacementSupplierNamed !== undefined && typeof r.replacementSupplierNamed !== 'boolean') return false;
  return true;
}

interface ChecklistPayload { supplierId: string; checklistItemKey: TransitionChecklistItemKey; itemStatus: TransitionItemStatus; notes?: string }
function isValidChecklistPayload(a: unknown): a is ChecklistPayload {
  if (!a || typeof a !== 'object') return false;
  const r = a as Record<string, unknown>;
  if (typeof r.supplierId !== 'string' || r.supplierId.length === 0) return false;
  if (typeof r.checklistItemKey !== 'string' || !VALID_CHECKLIST_KEYS.has(r.checklistItemKey)) return false;
  if (typeof r.itemStatus !== 'string' || !VALID_ITEM_STATUSES.has(r.itemStatus)) return false;
  return true;
}

interface ClosePayload { supplierId: string; notes?: string }
function isValidClosePayload(a: unknown): a is ClosePayload {
  if (!a || typeof a !== 'object') return false;
  const r = a as Record<string, unknown>;
  return typeof r.supplierId === 'string' && r.supplierId.length > 0;
}

interface ReopenPayload { supplierId: string; notes?: string }
function isValidReopenPayload(a: unknown): a is ReopenPayload {
  return isValidClosePayload(a);
}

/* ─── GET /api/offboarding/current?supplierId=... ────────────────────────── */

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
      res.json({ ok: true, isOpen: false, isClosed: false, triggerReason: null, cooperationLevel: null, replacementSupplierNamed: false, checklist: [], latestEvent: null });
      return;
    }
    const rows = await db
      .select()
      .from(transitionEventsTable)
      .where(and(eq(transitionEventsTable.organizationId, me.organizationId), eq(transitionEventsTable.supplierId, supplierId)));

    const state = currentTransitionState(rows as unknown as TransitionEventLike[], supplierId);
    res.json({ ok: true, ...state });
  } catch (err) {
    logger.error({ err }, '[offboarding/current] GET failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

/* ─── Shared write-gate ────────────────────────────────────────────────────
 * The STANDARD org_admin-OR-RACI-Accountable-holder gate, used for EVERY
 * write action in this route -- deliberately NOT split into a lighter/
 * stricter pair the way blacklist.ts's draft-vs-finalize gates are, since
 * every action here is equally neutral operational logistics (see
 * supplierOffboarding.ts's own "AUTHORIZATION BAR" header). */
async function assertOffboardingWriteGate(actingUserId: number, res: import('express').Response): Promise<number | null> {
  const [actor] = await db
    .select({ organizationId: usersTable.organizationId, orgRole: usersTable.orgRole })
    .from(usersTable)
    .where(eq(usersTable.id, actingUserId))
    .limit(1);

  if (!actor?.organizationId) {
    res.status(403).json({ ok: false, error: 'No organization on this account -- cannot record a transition event.' });
    return null;
  }

  if (actor.orgRole !== 'org_admin') {
    const raciRows = await db
      .select({ id: raciAssignmentEventsTable.id, activityKey: raciAssignmentEventsTable.activityKey, role: raciAssignmentEventsTable.role, userId: raciAssignmentEventsTable.userId, action: raciAssignmentEventsTable.action, createdAt: raciAssignmentEventsTable.createdAt })
      .from(raciAssignmentEventsTable)
      .where(eq(raciAssignmentEventsTable.organizationId, actor.organizationId));
    const accountableHolder = currentAccountableHolder(raciRows as RaciEventLike[], 'offboarding_decision');
    if (accountableHolder !== actingUserId) {
      res.status(403).json({ ok: false, error: "Only your organization's admin, or the RACI Accountable holder for Offboarding Decision, may record a transition event." });
      return null;
    }
  }
  return actor.organizationId;
}

/* ─── POST /api/offboarding/open ──────────────────────────────────────────── */

router.post('/open', async (req, res) => {
  const body = req.body as unknown;
  if (!isValidOpenPayload(body)) {
    res.status(400).json({ ok: false, error: 'Invalid open shape -- expected {supplierId, triggerReason, cooperationLevel, replacementSupplierNamed?, notes?}' });
    return;
  }
  try {
    const actingUserId = res.locals.userId as number;
    const organizationId = await assertOffboardingWriteGate(actingUserId, res);
    if (organizationId === null) return;

    const [inserted] = await db
      .insert(transitionEventsTable)
      .values({
        organizationId,
        supplierId: body.supplierId,
        action: 'opened',
        triggerReason: body.triggerReason,
        cooperationLevel: body.cooperationLevel,
        replacementSupplierNamed: body.replacementSupplierNamed ?? false,
        checklistItemKey: null,
        itemStatus: null,
        actorUserId: actingUserId,
        notes: body.notes ?? null,
      })
      .returning();

    logger.info({ actingUserId, organizationId, supplierId: body.supplierId, triggerReason: body.triggerReason }, '[offboarding/open] Event recorded');
    res.json({ ok: true, event: inserted });
  } catch (err) {
    logger.error({ err }, '[offboarding/open] POST failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

/* ─── POST /api/offboarding/checklist ─────────────────────────────────────── */

router.post('/checklist', async (req, res) => {
  const body = req.body as unknown;
  if (!isValidChecklistPayload(body)) {
    res.status(400).json({ ok: false, error: 'Invalid checklist shape -- expected {supplierId, checklistItemKey, itemStatus, notes?}' });
    return;
  }
  try {
    const actingUserId = res.locals.userId as number;
    const organizationId = await assertOffboardingWriteGate(actingUserId, res);
    if (organizationId === null) return;

    const existingRows = await db
      .select()
      .from(transitionEventsTable)
      .where(and(eq(transitionEventsTable.organizationId, organizationId), eq(transitionEventsTable.supplierId, body.supplierId)));
    const state = currentTransitionState(existingRows as unknown as TransitionEventLike[], body.supplierId);
    if (!state.isOpen) {
      res.status(400).json({ ok: false, error: 'No open transition record exists for this supplier -- open one before updating its checklist.' });
      return;
    }
    if (state.isClosed) {
      res.status(400).json({ ok: false, error: 'This transition record is already closed -- reopen it before updating its checklist.' });
      return;
    }

    const [inserted] = await db
      .insert(transitionEventsTable)
      .values({
        organizationId,
        supplierId: body.supplierId,
        action: 'checklist_item_updated',
        triggerReason: null,
        cooperationLevel: null,
        replacementSupplierNamed: null,
        checklistItemKey: body.checklistItemKey,
        itemStatus: body.itemStatus,
        actorUserId: actingUserId,
        notes: body.notes ?? null,
      })
      .returning();

    logger.info({ actingUserId, organizationId, supplierId: body.supplierId, checklistItemKey: body.checklistItemKey, itemStatus: body.itemStatus }, '[offboarding/checklist] Event recorded');
    res.json({ ok: true, event: inserted });
  } catch (err) {
    logger.error({ err }, '[offboarding/checklist] POST failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

/* ─── POST /api/offboarding/close ─────────────────────────────────────────── */

router.post('/close', async (req, res) => {
  const body = req.body as unknown;
  if (!isValidClosePayload(body)) {
    res.status(400).json({ ok: false, error: 'Invalid close shape -- expected {supplierId, notes?}' });
    return;
  }
  try {
    const actingUserId = res.locals.userId as number;
    const organizationId = await assertOffboardingWriteGate(actingUserId, res);
    if (organizationId === null) return;

    const existingRows = await db
      .select()
      .from(transitionEventsTable)
      .where(and(eq(transitionEventsTable.organizationId, organizationId), eq(transitionEventsTable.supplierId, body.supplierId)));
    const state = currentTransitionState(existingRows as unknown as TransitionEventLike[], body.supplierId);

    if (!state.isOpen) {
      res.status(400).json({ ok: false, error: 'No open transition record exists for this supplier.' });
      return;
    }
    if (state.isClosed) {
      res.status(400).json({ ok: false, error: 'This transition record is already closed.' });
      return;
    }
    const blockingItems = state.checklist.filter((c) => isGatingRequirement(c.requirement) && c.status !== 'complete' && c.status !== 'not_applicable');
    if (blockingItems.length > 0) {
      res.status(400).json({ ok: false, error: `Cannot close -- the following mandatory checklist items are not yet complete: ${blockingItems.map((b) => b.key).join(', ')}.` });
      return;
    }

    const [inserted] = await db
      .insert(transitionEventsTable)
      .values({
        organizationId,
        supplierId: body.supplierId,
        action: 'closed',
        triggerReason: null,
        cooperationLevel: null,
        replacementSupplierNamed: null,
        checklistItemKey: null,
        itemStatus: null,
        actorUserId: actingUserId,
        notes: body.notes ?? null,
        data: { checklistSnapshot: state.checklist },
      })
      .returning();

    // Real cross-reference into Item 3's OWN asl_decision_events table --
    // GUARDED, unlike blacklist.ts's own unconditional write: only fires
    // for the five ordinary-business trigger reasons (never for
    // 'blacklist_finalized'/'asl_revoked_unrelated', which already
    // represent a decision Item 6 or Item 3 made -- see
    // mapTriggerToAslReasonCategory()'s own header), and only when the
    // supplier is not ALREADY off the ASL, to avoid writing a duplicate
    // 'revoked' row.
    let aslCrossReference = null;
    if (inserted && state.triggerReason) {
      const reasonCategory = mapTriggerToAslReasonCategory(state.triggerReason);
      if (reasonCategory) {
        const aslRows = await db
          .select()
          .from(aslDecisionEventsTable)
          .where(and(eq(aslDecisionEventsTable.organizationId, organizationId), eq(aslDecisionEventsTable.supplierId, body.supplierId)));
        const sorted = [...aslRows].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id - b.id);
        const latestAsl = sorted[sorted.length - 1];
        const currentlyOffAsl = latestAsl && ['declined', 'suspended', 'revoked'].includes(latestAsl.decisionType);

        if (!currentlyOffAsl) {
          const [aslRow] = await db
            .insert(aslDecisionEventsTable)
            .values({
              organizationId,
              supplierId: body.supplierId,
              decisionType: 'revoked',
              reasonCategory,
              reasonNote: `Automatically marked as revoked on the Approved Supplier List as a direct consequence of Item 7 transition event #${inserted.id} closing (trigger: ${state.triggerReason}). This is a real cross-reference, not an independent decision.`,
              approverUserId: actingUserId,
              qualificationGateStatusAtDecision: 'INSUFFICIENT_EVIDENCE',
              dueDiligenceTierAtDecision: 'STANDARD',
              reviewDueAt: null,
              data: { crossReferenceFromTransitionEventId: inserted.id },
            })
            .returning();
          aslCrossReference = aslRow ?? null;
        }
      }
    }

    logger.info({ actingUserId, organizationId, supplierId: body.supplierId, transitionEventId: inserted?.id, aslCrossReferenceId: aslCrossReference?.id }, '[offboarding/close] Event recorded');
    res.json({ ok: true, event: inserted, aslCrossReference });
  } catch (err) {
    logger.error({ err }, '[offboarding/close] POST failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

/* ─── POST /api/offboarding/reopen ────────────────────────────────────────── */

router.post('/reopen', async (req, res) => {
  const body = req.body as unknown;
  if (!isValidReopenPayload(body)) {
    res.status(400).json({ ok: false, error: 'Invalid reopen shape -- expected {supplierId, notes?}' });
    return;
  }
  try {
    const actingUserId = res.locals.userId as number;
    const organizationId = await assertOffboardingWriteGate(actingUserId, res);
    if (organizationId === null) return;

    const existingRows = await db
      .select()
      .from(transitionEventsTable)
      .where(and(eq(transitionEventsTable.organizationId, organizationId), eq(transitionEventsTable.supplierId, body.supplierId)));
    const state = currentTransitionState(existingRows as unknown as TransitionEventLike[], body.supplierId);
    if (!state.isOpen || !state.isClosed) {
      res.status(400).json({ ok: false, error: 'Only a closed transition record can be reopened.' });
      return;
    }

    const [inserted] = await db
      .insert(transitionEventsTable)
      .values({
        organizationId,
        supplierId: body.supplierId,
        action: 'reopened',
        triggerReason: null,
        cooperationLevel: null,
        replacementSupplierNamed: null,
        checklistItemKey: null,
        itemStatus: null,
        actorUserId: actingUserId,
        notes: body.notes ?? null,
      })
      .returning();

    logger.info({ actingUserId, organizationId, supplierId: body.supplierId }, '[offboarding/reopen] Event recorded');
    res.json({ ok: true, event: inserted });
  } catch (err) {
    logger.error({ err }, '[offboarding/reopen] POST failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

export default router;
