/**
 * #188 (Decision Record 8.5, Layer 1) -- à la carte module entitlements.
 *
 * MODULE_SEGMENTS is the real, code-confirmed 6-module grouping of the 12
 * core Maturity Assessment segments (maturityData.tsx CORE_SEGMENTS ids),
 * as recorded in the site map's #188 registry entry. Industry/country
 * conditional modules (mfg_ops, fleet_ops, regulatory-*) are NOT yet
 * mapped to a purchase path -- open detail, flagged here and in the site
 * map so nobody assumes it's covered.
 */
import { db, entitlementsTable } from '@workspace/db';
import { eq, or, sql } from 'drizzle-orm';

export const MODULE_SEGMENTS: Record<string, string[]> = {
  m1: ['strategy', 'digital'],
  m2: ['procurement', 'contracts'],
  m3: ['suppliers', 'risk'],
  m4: ['demand', 'inventory'],
  m5: ['logistics', 'quality_ci'],
  m6: ['sustainability', 'org_talent'],
};

export const ALL_MODULE_IDS = Object.keys(MODULE_SEGMENTS);

/** Every module a user owns, expanding 'bundle' to all six. */
export async function getEntitledModules(userId: number): Promise<Set<string>> {
  const rows = await db
    .select({ moduleId: entitlementsTable.moduleId })
    .from(entitlementsTable)
    .where(eq(entitlementsTable.userId, userId));

  const owned = new Set(rows.map(r => r.moduleId));
  if (owned.has('bundle')) return new Set(ALL_MODULE_IDS);
  return owned;
}

/** Every segment id a user has full access to, derived from owned modules. */
export async function getEntitledSegments(userId: number): Promise<Set<string>> {
  const modules = await getEntitledModules(userId);
  const segments = new Set<string>();
  for (const m of modules) {
    for (const s of MODULE_SEGMENTS[m] ?? []) segments.add(s);
  }
  return segments;
}

/** Does this user own the module containing segmentId? */
export async function hasSegmentAccess(userId: number, segmentId: string): Promise<boolean> {
  const segments = await getEntitledSegments(userId);
  return segments.has(segmentId);
}

/**
 * Idempotent grant. ON CONFLICT (user_id, module_id) DO NOTHING -- a
 * duplicate manual grant, or a duplicate Stripe webhook retry once #364
 * exists, is a safe no-op rather than an error.
 */
export async function grantModule(params: {
  userId: number;
  organizationId?: number | null;
  moduleId: string;
  source?: 'manual' | 'stripe';
  grantedBy?: string | null;
}): Promise<void> {
  const { userId, organizationId = null, moduleId, source = 'manual', grantedBy = null } = params;
  await db
    .insert(entitlementsTable)
    .values({ userId, organizationId, moduleId, source, grantedBy })
    .onConflictDoNothing({ target: [entitlementsTable.userId, entitlementsTable.moduleId] });
}
