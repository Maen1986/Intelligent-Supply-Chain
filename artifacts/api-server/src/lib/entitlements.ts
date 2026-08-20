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

/* ── Shared gating helpers (#188) ────────────────────────────────────────
 * Used by both GET /maturity/snapshots and POST /report/generate so a
 * locked segment behaves identically whether a user is viewing their own
 * saved results or generating a report -- and so report generation can't
 * be tricked into including gated content just because the client sent it
 * in the request body (maturitySnapshots.ts's existing principle: ownership
 * enforced at the query/data level, never trusted from the client alone).
 *
 * UX decision (made here, since it needed an explicit answer rather than a
 * guess): overall score/level/coverage stays free -- consistent with how
 * the free Diagnostic already works, and it's the number that drives
 * someone to want the detail. What's gated is exactly what Decision Record
 * 8.5 named: per-segment score/level/benchmarks for segments outside a
 * purchased module, and each locked segment's itemized 30/60/90-day
 * actions. A locked segment still shows it was assessed (id + title
 * survive) -- it never disappears or reads as "not done," it reads as
 * "done, not unlocked yet." The AI executive summary and estimated
 * financial impact stay visible even with zero modules owned: they are
 * holistic narrative, not itemized per-segment detail, and cutting them
 * for a zero-module viewer would leave a confusing near-empty page with no
 * teaser value at all. */

export interface GatableSegmentScore {
  id: string;
  title: string;
  titleAr?: string;
}

/** Loosely typed on purpose -- called with SegmentScore[] from two different
 * route files with slightly different local interfaces; only id/title/titleAr
 * are read here, everything else passes through unchanged for owned segments
 * and is dropped for locked ones. */
export function gateSegmentScores<T extends GatableSegmentScore>(
  entitledSegmentIds: Set<string>,
  segmentScores: T[],
): Array<T & { locked: false } | { id: string; title: string; titleAr?: string; locked: true }> {
  return segmentScores.map(seg => {
    if (entitledSegmentIds.has(seg.id)) return { ...seg, locked: false as const };
    return { id: seg.id, title: seg.title, titleAr: seg.titleAr, locked: true as const };
  });
}

interface RemedyItemLike {
  segmentTitle: string;
}

interface RemediesLike {
  days30?: RemedyItemLike[];
  days60?: RemedyItemLike[];
  days90?: RemedyItemLike[];
}

/** Loosely typed on purpose -- same reason as gateSegmentScores above.
 * Accepts null/undefined so both call sites (one reads a nullable DB
 * column, one reads an optional request field) can pass their value
 * straight through without extra normalisation at the call site. */
export function gateRemedyActions<R extends RemediesLike>(
  entitledTitles: Set<string>,
  remedyActions: R | null | undefined,
): R | undefined {
  if (remedyActions == null) return undefined;
  const filterPhase = (items?: RemedyItemLike[]) =>
    items?.filter(item => entitledTitles.has(item.segmentTitle));
  return {
    ...remedyActions,
    days30: filterPhase(remedyActions.days30),
    days60: filterPhase(remedyActions.days60),
    days90: filterPhase(remedyActions.days90),
  };
}

/** Titles of every segment a user is entitled to, given the full scored list. */
export function entitledTitlesFrom(entitledSegmentIds: Set<string>, segmentScores: GatableSegmentScore[]): Set<string> {
  return new Set(segmentScores.filter(s => entitledSegmentIds.has(s.id)).map(s => s.title));
}
