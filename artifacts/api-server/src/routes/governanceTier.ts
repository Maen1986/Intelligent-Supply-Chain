/**
 * /api/governance-tier -- durable persistence for a client's explicit
 * override of supplierGovernanceTierRecommendation.ts's Advisory-vs-
 * Operational recommendation (added 12 Sep 2026, same day as Item 4, after
 * a QA review flagged that the override was previously component-state-only
 * and silently lost on reload).
 *
 * GET  /api/governance-tier/current?supplierId=... -- the caller's
 *   organization's current override for a supplier, computed by replaying
 *   that org's own governance_tier_override_events (mirrors
 *   currentGovernanceTierOverride() below). Returns { override: null } when
 *   no override has ever been set, or the latest one was a 'clear'.
 * POST /api/governance-tier/override -- append ONE new override-set or
 *   override-clear event (never a whole-state replace). WRITE-GATED exactly
 *   like /api/onboarding/events: the caller must be this org's org_admin OR
 *   the current RACI Accountable holder for 'onboarding_signoff' (Item 2's
 *   real assignment data, replayed here exactly as onboarding.ts and
 *   preQualification.ts replay it). This reuses Item 4's existing
 *   authorization rule rather than inventing a separate one, since setting
 *   the governance tier is the same class of decision as onboarding
 *   sign-off itself.
 *
 * STANDALONE-FIRST NOTE: this route does not import from the frontend
 * package (artifacts/i-supply-chain), same precedent as onboarding.ts,
 * copq.ts, raci.ts and preQualification.ts. The RACI-Accountable-holder
 * replay below is therefore a disclosed, manually-synced MIRROR of the
 * canonical implementation in supplierRACI.ts / onboarding.ts -- not a
 * separate methodology. If the canonical implementation changes, this copy
 * must be updated in the same change.
 */
import { Router } from 'express';
import { db } from '@workspace/db';
import { governanceTierOverrideEventsTable, raciAssignmentEventsTable, usersTable } from '@workspace/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireSession } from '../middlewares/requireSession';
import { logger } from '../lib/logger';

const router = Router();
router.use(requireSession);

type GovernanceTier = 'advisory' | 'operational';
type OverrideAction = 'set' | 'clear';

/* ─── Mirrored core: minimal RACI replay for 'onboarding_signoff' (see supplierRACI.ts / onboarding.ts) ─── */

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

/* ─── Mirrored core: override replay (mirrors the "override always wins" contract in supplierGovernanceTierRecommendation.ts) ─── */

interface OverrideEventLike { supplierId: string; action: OverrideAction; tier: string | null; createdAt: Date }

function currentGovernanceTierOverride(events: OverrideEventLike[], supplierId: string): { tier: GovernanceTier; overriddenAt: string } | null {
  const own = events
    .filter((e) => e.supplierId === supplierId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  if (own.length === 0) return null;
  const latest = own[own.length - 1];
  if (latest.action === 'clear' || latest.tier !== 'advisory' && latest.tier !== 'operational') return null;
  return { tier: latest.tier, overriddenAt: latest.createdAt.toISOString() };
}

/* ─── Payload validation ─────────────────────────────────────────────────── */

interface OverridePayload {
  supplierId: string;
  action: OverrideAction;
  tier?: GovernanceTier;
}

function isValidPayload(a: unknown): a is OverridePayload {
  if (!a || typeof a !== 'object') return false;
  const r = a as Record<string, unknown>;
  if (typeof r.supplierId !== 'string' || r.supplierId.length === 0) return false;
  if (r.action === 'clear') return true;
  if (r.action === 'set') return r.tier === 'advisory' || r.tier === 'operational';
  return false;
}

/* ─── GET /api/governance-tier/current?supplierId=... ────────────────────── */

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
      res.json({ ok: true, override: null });
      return;
    }
    const rows = await db
      .select()
      .from(governanceTierOverrideEventsTable)
      .where(and(eq(governanceTierOverrideEventsTable.organizationId, me.organizationId), eq(governanceTierOverrideEventsTable.supplierId, supplierId)));
    const override = currentGovernanceTierOverride(rows as unknown as OverrideEventLike[], supplierId);
    res.json({ ok: true, override });
  } catch (err) {
    logger.error({ err }, '[governance-tier/current] GET failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

/* ─── POST /api/governance-tier/override ─────────────────────────────────── */

router.post('/override', async (req, res) => {
  const body = req.body as unknown;
  if (!isValidPayload(body)) {
    res.status(400).json({ ok: false, error: "Invalid override shape -- expected {supplierId, action: 'set', tier} or {supplierId, action: 'clear'}" });
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
      res.status(403).json({ ok: false, error: 'No organization on this account -- cannot record a governance-tier override.' });
      return;
    }

    // Write-gate -- org_admin OR the org's own current RACI Accountable
    // holder for 'onboarding_signoff', same rule as /api/onboarding/events.
    if (actor.orgRole !== 'org_admin') {
      const raciRows = await db
        .select({ id: raciAssignmentEventsTable.id, activityKey: raciAssignmentEventsTable.activityKey, role: raciAssignmentEventsTable.role, userId: raciAssignmentEventsTable.userId, action: raciAssignmentEventsTable.action, createdAt: raciAssignmentEventsTable.createdAt })
        .from(raciAssignmentEventsTable)
        .where(eq(raciAssignmentEventsTable.organizationId, actor.organizationId));
      const accountableHolder = currentAccountableHolder(raciRows as RaciEventLike[], 'onboarding_signoff');
      if (accountableHolder !== actingUserId) {
        res.status(403).json({ ok: false, error: "Only your organization's admin, or the RACI Accountable holder for Onboarding Sign-off, may set a governance-tier override." });
        return;
      }
    }

    const [inserted] = await db
      .insert(governanceTierOverrideEventsTable)
      .values({
        organizationId: actor.organizationId,
        supplierId: body.supplierId,
        action: body.action,
        tier: body.action === 'set' ? body.tier ?? null : null,
        actorUserId: actingUserId,
      })
      .returning();

    logger.info({ actingUserId, organizationId: actor.organizationId, supplierId: body.supplierId, action: body.action, tier: body.action === 'set' ? body.tier : null }, '[governance-tier/override] Event recorded');
    res.json({ ok: true, event: inserted });
  } catch (err) {
    logger.error({ err }, '[governance-tier/override] POST failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

export default router;
