/**
 * /api/raci -- real backend persistence for the Supplier Lifecycle
 * Governance RACI Operational tier (Item 2, 11 Sep 2026).
 *
 * GET  /api/raci/events    -- the caller's organization's full RACI
 *   assignment-event history, newest first. Append-only: every event ever
 *   written is returned (assigns AND unassigns, including superseded R/A
 *   holders), so the audit trail is never hidden. Org-scoped: a user only
 *   ever sees their OWN organization's events (read from res.locals.userId
 *   -> usersTable.organizationId on the server, never trusted from the
 *   client).
 * GET  /api/raci/current    -- the caller's organization's current RACI
 *   state (computeCurrentRaci() replayed over that org's events) plus a
 *   completeness summary (computeCompleteness()) and any accountability
 *   gaps (hasAccountabilityGap()) -- the same computation the Advisory tier
 *   runs client-side, just fed this org's real event log instead of a
 *   caller-supplied hypothetical one.
 * POST /api/raci/events    -- append ONE new assignment event (never a
 *   whole-state replace -- see raciAssignments.ts's schema header for why).
 *   GATED: only a caller whose own usersTable.orgRole is 'org_admin' may
 *   write. The org_admin's own organizationId is stamped onto the event and
 *   used as its scope -- a client-supplied organizationId is never trusted.
 *   The target user (userId being assigned/unassigned) must belong to the
 *   SAME organization as the acting org_admin, verified server-side on
 *   every write, not merely assumed from the request.
 *
 * Advisory tier note: this route is opt-in. A client on the Advisory tier
 * never calls it -- artifacts/i-supply-chain/src/lib/supplierRACI.ts's
 * RACI_TEMPLATE renders fresh in the browser/consultancy session with zero
 * persistence and no real names. Nothing here is required for the Advisory
 * tier to work.
 *
 * STANDALONE-FIRST NOTE: this route does not import from the frontend
 * package (artifacts/i-supply-chain) -- same precedent as copq.ts and
 * maturityRemedies.ts. RACI_ACTIVITY_KEYS, RaciRole, isSingleOwnerRole(),
 * and computeCurrentRaci()/computeCompleteness()/hasAccountabilityGap() are
 * therefore disclosed, manually-synced MIRRORS of the canonical
 * implementation in artifacts/i-supply-chain/src/lib/supplierRACI.ts (same
 * 7 activities, same R/A-supersession + C/I-set replay semantics) -- not a
 * separate methodology. If the canonical logic changes, this copy must be
 * updated in the same change (same discipline as copq.ts's own header).
 */
import { Router } from 'express';
import { db } from '@workspace/db';
import { raciAssignmentEventsTable, usersTable } from '@workspace/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireSession } from '../middlewares/requireSession';
import { logger } from '../lib/logger';

const router = Router();
router.use(requireSession);

/* ─── Mirrored core (see file header) ────────────────────────────────────────────── */

type RaciRole = 'R' | 'A' | 'C' | 'I';
const RACI_ROLES: RaciRole[] = ['R', 'A', 'C', 'I'];
function isSingleOwnerRole(role: RaciRole): boolean {
  return role === 'R' || role === 'A';
}

type RaciActivityKey =
  | 'copq_review'
  | 'prequalification_approval'
  | 'onboarding_signoff'
  | 'periodic_evaluation'
  | 'second_party_audit'
  | 'blacklist_decision'
  | 'offboarding_decision';

const RACI_ACTIVITY_KEYS: RaciActivityKey[] = [
  'copq_review',
  'prequalification_approval',
  'onboarding_signoff',
  'periodic_evaluation',
  'second_party_audit',
  'blacklist_decision',
  'offboarding_decision',
];

type RaciEventAction = 'assigned' | 'unassigned';

interface RaciAssignmentEventLike {
  id: number | string;
  activityKey: RaciActivityKey;
  role: RaciRole;
  userId: number;
  action: RaciEventAction;
  assignedByUserId: number;
  createdAt: string;
}

interface RaciCurrentAssignment {
  activityKey: RaciActivityKey;
  role: RaciRole;
  userIds: number[];
}

function sortEventsChronologically(events: RaciAssignmentEventLike[]): RaciAssignmentEventLike[] {
  return [...events].sort((a, b) => {
    const t = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (t !== 0) return t;
    return String(a.id).localeCompare(String(b.id));
  });
}

function computeCurrentRaci(events: RaciAssignmentEventLike[]): RaciCurrentAssignment[] {
  const ordered = sortEventsChronologically(events);
  const state = new Map<string, number[]>();

  for (const ev of ordered) {
    const key = `${ev.activityKey}::${ev.role}`;
    const current = state.get(key) ?? [];

    if (isSingleOwnerRole(ev.role)) {
      if (ev.action === 'assigned') {
        state.set(key, [ev.userId]);
      } else if (current[0] === ev.userId) {
        state.set(key, []);
      }
    } else {
      if (ev.action === 'assigned') {
        if (!current.includes(ev.userId)) state.set(key, [...current, ev.userId]);
      } else {
        state.set(key, current.filter((u) => u !== ev.userId));
      }
    }
  }

  const results: RaciCurrentAssignment[] = [];
  for (const activityKey of RACI_ACTIVITY_KEYS) {
    for (const role of RACI_ROLES) {
      const key = `${activityKey}::${role}`;
      results.push({ activityKey, role, userIds: state.get(key) ?? [] });
    }
  }
  return results;
}

function hasAccountabilityGap(current: RaciCurrentAssignment[], activityKey: RaciActivityKey): boolean {
  const row = current.find((c) => c.activityKey === activityKey && c.role === 'A');
  return !row || row.userIds.length === 0;
}

function computeCompleteness(current: RaciCurrentAssignment[]) {
  return RACI_ACTIVITY_KEYS.map((activityKey) => {
    const rows = current.filter((c) => c.activityKey === activityKey);
    const a = rows.find((r) => r.role === 'A');
    const r = rows.find((r) => r.role === 'R');
    const c = rows.find((r) => r.role === 'C');
    const i = rows.find((r) => r.role === 'I');
    return {
      activityKey,
      hasAccountable: !!a && a.userIds.length > 0,
      hasResponsible: !!r && r.userIds.length > 0,
      consultedCount: c?.userIds.length ?? 0,
      informedCount: i?.userIds.length ?? 0,
    };
  });
}

/* ─── Payload validation ─────────────────────────────────────────────────── */

interface EventPayload {
  activityKey: RaciActivityKey;
  role: RaciRole;
  userId: number;
  action: RaciEventAction;
}

function isValidPayload(a: unknown): a is EventPayload {
  if (!a || typeof a !== 'object') return false;
  const r = a as Record<string, unknown>;
  return (
    typeof r.activityKey === 'string' && (RACI_ACTIVITY_KEYS as string[]).includes(r.activityKey) &&
    typeof r.role === 'string' && (RACI_ROLES as string[]).includes(r.role) &&
    typeof r.userId === 'number' &&
    (r.action === 'assigned' || r.action === 'unassigned')
  );
}

/* ─── GET /api/raci/events ──────────────────────────────────────────── */

router.get('/events', async (_req, res) => {
  try {
    const userId = res.locals.userId as number;
    const [me] = await db.select({ organizationId: usersTable.organizationId }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!me?.organizationId) {
      res.json({ ok: true, events: [] });
      return;
    }
    const rows = await db
      .select()
      .from(raciAssignmentEventsTable)
      .where(eq(raciAssignmentEventsTable.organizationId, me.organizationId))
      .orderBy(desc(raciAssignmentEventsTable.createdAt));
    res.json({ ok: true, events: rows });
  } catch (err) {
    logger.error({ err }, '[raci/events] GET failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

/* ─── GET /api/raci/org-members ─────────────────────────────────────
   Real, named members of the caller's OWN organization only (never another
   org's) -- so the Operational-tier UI can let an org_admin pick a real
   colleague by name rather than typing a raw userId, and so assigned
   holders can be rendered as names rather than numeric ids. This endpoint
   is new with Item 2; it did not exist before because no feature needed an
   org-scoped member list until RACI's self-service assignment did. */

router.get('/org-members', async (_req, res) => {
  try {
    const userId = res.locals.userId as number;
    const [me] = await db.select({ organizationId: usersTable.organizationId }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!me?.organizationId) {
      res.json({ ok: true, members: [] });
      return;
    }
    const members = await db
      .select({ id: usersTable.id, fullName: usersTable.fullName, email: usersTable.email, orgRole: usersTable.orgRole })
      .from(usersTable)
      .where(eq(usersTable.organizationId, me.organizationId));
    res.json({ ok: true, members });
  } catch (err) {
    logger.error({ err }, '[raci/org-members] GET failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

/* ─── GET /api/raci/current ──────────────────────────────────────────── */

router.get('/current', async (_req, res) => {
  try {
    const userId = res.locals.userId as number;
    const [me] = await db.select({ organizationId: usersTable.organizationId }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!me?.organizationId) {
      const empty = computeCurrentRaci([]);
      res.json({ ok: true, current: empty, completeness: computeCompleteness(empty), gaps: RACI_ACTIVITY_KEYS.filter((k) => hasAccountabilityGap(empty, k)) });
      return;
    }
    const rows = await db
      .select()
      .from(raciAssignmentEventsTable)
      .where(eq(raciAssignmentEventsTable.organizationId, me.organizationId));
    const events: RaciAssignmentEventLike[] = rows.map((r) => ({
      id: r.id,
      activityKey: r.activityKey as RaciActivityKey,
      role: r.role as RaciRole,
      userId: r.userId,
      action: r.action as RaciEventAction,
      assignedByUserId: r.assignedByUserId,
      createdAt: r.createdAt.toISOString(),
    }));
    const current = computeCurrentRaci(events);
    res.json({
      ok: true,
      current,
      completeness: computeCompleteness(current),
      gaps: RACI_ACTIVITY_KEYS.filter((k) => hasAccountabilityGap(current, k)),
    });
  } catch (err) {
    logger.error({ err }, '[raci/current] GET failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

/* ─── POST /api/raci/events ────────────────────────────────────────── */

router.post('/events', async (req, res) => {
  const body = req.body as unknown;
  if (!isValidPayload(body)) {
    res.status(400).json({ ok: false, error: 'Invalid event shape -- expected {activityKey, role, userId, action}' });
    return;
  }
  try {
    const actingUserId = res.locals.userId as number;
    const [actor] = await db
      .select({ organizationId: usersTable.organizationId, orgRole: usersTable.orgRole })
      .from(usersTable)
      .where(eq(usersTable.id, actingUserId))
      .limit(1);

    // Write-gate: only an org_admin may assign/unassign RACI roles
    // (client-confirmed 11 Sep 2026 -- "RACI assigned by the client's own
    // org admin, not ISC"). Re-checked here from the DB on every write --
    // never trusts a client-supplied role claim or a stale session field.
    if (!actor?.organizationId) {
      res.status(403).json({ ok: false, error: 'No organization on this account -- cannot assign RACI roles.' });
      return;
    }
    if (actor.orgRole !== 'org_admin') {
      res.status(403).json({ ok: false, error: 'Only your organization’s admin can assign RACI roles.' });
      return;
    }

    // The target user must belong to the SAME organization as the acting
    // org_admin -- verified server-side, never assumed from the request.
    const [target] = await db
      .select({ id: usersTable.id, organizationId: usersTable.organizationId })
      .from(usersTable)
      .where(eq(usersTable.id, body.userId))
      .limit(1);
    if (!target || target.organizationId !== actor.organizationId) {
      res.status(400).json({ ok: false, error: 'Target user is not a member of your organization.' });
      return;
    }

    const [inserted] = await db
      .insert(raciAssignmentEventsTable)
      .values({
        organizationId: actor.organizationId,
        activityKey: body.activityKey,
        role: body.role,
        userId: body.userId,
        action: body.action,
        assignedByUserId: actingUserId,
      })
      .returning();

    logger.info({ actingUserId, organizationId: actor.organizationId, activityKey: body.activityKey, role: body.role, action: body.action }, '[raci/events] Event recorded');
    res.json({ ok: true, event: inserted });
  } catch (err) {
    logger.error({ err }, '[raci/events] POST failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

export default router;
