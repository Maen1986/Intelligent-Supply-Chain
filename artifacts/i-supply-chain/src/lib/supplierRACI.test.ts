/**
 * Tests for supplierRACI.ts — includes the mandatory soft/hardest/boundary
 * three-tier stress test (isc-standing-rules, Rule 7) in addition to normal
 * unit coverage. Every stress case and its outcome is also written up in the
 * Item 2 worked-example doc per Rule 6.
 */
import { describe, it, expect } from 'vitest';
import {
  RACI_ROLES,
  RACI_ACTIVITY_KEYS,
  RACI_ACTIVITIES,
  RACI_TEMPLATE,
  isSingleOwnerRole,
  getTemplateRow,
  computeCurrentRaci,
  computeRoleHistory,
  hasAccountabilityGap,
  computeCompleteness,
  type RaciAssignmentEvent,
  type RaciActivityKey,
} from './supplierRACI';

function ev(overrides: Partial<RaciAssignmentEvent> = {}): RaciAssignmentEvent {
  return {
    id: Math.random().toString(36).slice(2),
    activityKey: 'copq_review',
    role: 'A',
    userId: 1,
    action: 'assigned',
    assignedByUserId: 99,
    createdAt: '2026-06-01T00:00:00.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Section 1 — fixed activity/role scaffolding
// ---------------------------------------------------------------------------

describe('fixed scaffolding', () => {
  it('has exactly 7 activities, matching RACI_ACTIVITY_KEYS 1:1', () => {
    expect(RACI_ACTIVITY_KEYS).toHaveLength(7);
    expect(RACI_ACTIVITIES).toHaveLength(7);
    expect(RACI_ACTIVITIES.map((a) => a.key).sort()).toEqual([...RACI_ACTIVITY_KEYS].sort());
  });

  it('has all 4 canonical roles', () => {
    expect(RACI_ROLES).toEqual(['R', 'A', 'C', 'I']);
  });

  it('classifies R and A as single-owner, C and I as multi-assignee', () => {
    expect(isSingleOwnerRole('R')).toBe(true);
    expect(isSingleOwnerRole('A')).toBe(true);
    expect(isSingleOwnerRole('C')).toBe(false);
    expect(isSingleOwnerRole('I')).toBe(false);
  });

  it('every activity has a bilingual label and a bilingual governance-item reference', () => {
    for (const a of RACI_ACTIVITIES) {
      expect(a.labelEn.length).toBeGreaterThan(0);
      expect(a.labelAr.length).toBeGreaterThan(0);
      expect(a.governanceItemEn.length).toBeGreaterThan(0);
      expect(a.governanceItemAr.length).toBeGreaterThan(0);
      // Arabic label must actually contain Arabic script, never the English
      // string reused as a placeholder (Decision Record 8.7 / Rule 5).
      expect(/[؀-ۿ]/.test(a.labelAr)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Section 2 — Advisory tier: RACI_TEMPLATE
// ---------------------------------------------------------------------------

describe('RACI_TEMPLATE (Advisory tier)', () => {
  it('has exactly one template row per activity, no real names', () => {
    expect(RACI_TEMPLATE).toHaveLength(7);
    const seen = new Set<string>();
    for (const row of RACI_TEMPLATE) {
      expect(seen.has(row.activityKey)).toBe(false);
      seen.add(row.activityKey);
      // Heuristic honesty check: a real person's name would not contain
      // generic archetype language. This is not proof of "no PII", but a
      // sanity net that every row reads as a role, not a name.
      expect(row.accountableArchetypeEn).toMatch(/[A-Za-z]/);
      expect(row.consultedArchetypesEn.length).toBeGreaterThan(0);
      expect(row.informedArchetypesEn.length).toBeGreaterThan(0);
      expect(row.consultedArchetypesAr.length).toBe(row.consultedArchetypesEn.length);
      expect(row.informedArchetypesAr.length).toBe(row.informedArchetypesEn.length);
    }
  });

  it('getTemplateRow returns the matching row', () => {
    const row = getTemplateRow('blacklist_decision');
    expect(row.activityKey).toBe('blacklist_decision');
    expect(row.accountableArchetypeEn).toMatch(/Procurement Director|CPO|Executive Committee/);
  });

  it('getTemplateRow throws for an unknown key rather than silently returning undefined', () => {
    expect(() => getTemplateRow('not_a_real_key' as RaciActivityKey)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Section 3 — Operational tier: computeCurrentRaci() replay semantics
// ---------------------------------------------------------------------------

describe('computeCurrentRaci — R/A single-owner supersession', () => {
  it('a single assign gives that role exactly one holder', () => {
    const current = computeCurrentRaci([ev({ role: 'A', userId: 5 })]);
    const row = current.find((c) => c.activityKey === 'copq_review' && c.role === 'A')!;
    expect(row.userIds).toEqual([5]);
  });

  it('a later assign REPLACES the prior holder (supersession, not merge)', () => {
    const events = [
      ev({ role: 'A', userId: 5, createdAt: '2026-06-01T00:00:00.000Z' }),
      ev({ role: 'A', userId: 7, createdAt: '2026-06-02T00:00:00.000Z' }),
    ];
    const current = computeCurrentRaci(events);
    const row = current.find((c) => c.activityKey === 'copq_review' && c.role === 'A')!;
    expect(row.userIds).toEqual([7]);
  });

  it('unassigning the current holder clears the role', () => {
    const events = [
      ev({ role: 'A', userId: 5, action: 'assigned', createdAt: '2026-06-01T00:00:00.000Z' }),
      ev({ role: 'A', userId: 5, action: 'unassigned', createdAt: '2026-06-02T00:00:00.000Z' }),
    ];
    const current = computeCurrentRaci(events);
    const row = current.find((c) => c.activityKey === 'copq_review' && c.role === 'A')!;
    expect(row.userIds).toEqual([]);
  });

  it('a STALE unassign targeting an already-superseded holder is a documented no-op', () => {
    const events = [
      ev({ role: 'A', userId: 5, action: 'assigned', createdAt: '2026-06-01T00:00:00.000Z' }),
      ev({ role: 'A', userId: 7, action: 'assigned', createdAt: '2026-06-02T00:00:00.000Z' }), // supersedes 5
      ev({ role: 'A', userId: 5, action: 'unassigned', createdAt: '2026-06-03T00:00:00.000Z' }), // stale — targets the OLD holder
    ];
    const current = computeCurrentRaci(events);
    const row = current.find((c) => c.activityKey === 'copq_review' && c.role === 'A')!;
    // 7 must still hold the role — the stale unassign for 5 must not clear it
    expect(row.userIds).toEqual([7]);
  });
});

describe('computeCurrentRaci — C/I multi-assignee set semantics', () => {
  it('multiple assigns accumulate distinct holders', () => {
    const events = [
      ev({ role: 'C', userId: 1, createdAt: '2026-06-01T00:00:00.000Z' }),
      ev({ role: 'C', userId: 2, createdAt: '2026-06-02T00:00:00.000Z' }),
      ev({ role: 'C', userId: 3, createdAt: '2026-06-03T00:00:00.000Z' }),
    ];
    const current = computeCurrentRaci(events);
    const row = current.find((c) => c.activityKey === 'copq_review' && c.role === 'C')!;
    expect(row.userIds.sort()).toEqual([1, 2, 3]);
  });

  it('a duplicate assign for an already-present member is a no-op (no duplicate entries)', () => {
    const events = [
      ev({ role: 'I', userId: 1, createdAt: '2026-06-01T00:00:00.000Z' }),
      ev({ role: 'I', userId: 1, createdAt: '2026-06-02T00:00:00.000Z' }),
    ];
    const current = computeCurrentRaci(events);
    const row = current.find((c) => c.activityKey === 'copq_review' && c.role === 'I')!;
    expect(row.userIds).toEqual([1]);
  });

  it('unassigning one member leaves the others intact', () => {
    const events = [
      ev({ role: 'C', userId: 1, createdAt: '2026-06-01T00:00:00.000Z' }),
      ev({ role: 'C', userId: 2, createdAt: '2026-06-02T00:00:00.000Z' }),
      ev({ role: 'C', userId: 1, action: 'unassigned', createdAt: '2026-06-03T00:00:00.000Z' }),
    ];
    const current = computeCurrentRaci(events);
    const row = current.find((c) => c.activityKey === 'copq_review' && c.role === 'C')!;
    expect(row.userIds).toEqual([2]);
  });
});

describe('computeCurrentRaci — chronological ordering and tiebreaks', () => {
  it('is insensitive to input array order — always replays by createdAt, not array position', () => {
    const events = [
      ev({ role: 'A', userId: 7, createdAt: '2026-06-02T00:00:00.000Z' }),
      ev({ role: 'A', userId: 5, createdAt: '2026-06-01T00:00:00.000Z' }), // earlier, listed second
    ];
    const current = computeCurrentRaci(events);
    const row = current.find((c) => c.activityKey === 'copq_review' && c.role === 'A')!;
    expect(row.userIds).toEqual([7]); // the chronologically later one wins
  });

  it('breaks an exact-timestamp tie deterministically by id', () => {
    const sameTs = '2026-06-01T00:00:00.000Z';
    const eventsA = [
      ev({ role: 'A', userId: 5, id: 'a', createdAt: sameTs }),
      ev({ role: 'A', userId: 7, id: 'b', createdAt: sameTs }),
    ];
    const eventsB = [...eventsA].reverse(); // same events, different input order
    const rowA = computeCurrentRaci(eventsA).find((c) => c.role === 'A' && c.activityKey === 'copq_review')!;
    const rowB = computeCurrentRaci(eventsB).find((c) => c.role === 'A' && c.activityKey === 'copq_review')!;
    // Deterministic: both orderings of the SAME event set must resolve identically
    expect(rowA.userIds).toEqual(rowB.userIds);
    expect(rowA.userIds).toEqual([7]); // id 'b' sorts after id 'a' lexically
  });

  it('returns all 28 activity×role combinations even with zero events', () => {
    const current = computeCurrentRaci([]);
    expect(current).toHaveLength(7 * 4);
    expect(current.every((c) => c.userIds.length === 0)).toBe(true);
  });

  it('activities are fully independent — an event on one never leaks into another', () => {
    const events = [
      ev({ activityKey: 'copq_review', role: 'A', userId: 1 }),
      ev({ activityKey: 'blacklist_decision', role: 'A', userId: 2 }),
    ];
    const current = computeCurrentRaci(events);
    expect(current.find((c) => c.activityKey === 'copq_review' && c.role === 'A')!.userIds).toEqual([1]);
    expect(current.find((c) => c.activityKey === 'blacklist_decision' && c.role === 'A')!.userIds).toEqual([2]);
    expect(current.find((c) => c.activityKey === 'onboarding_signoff' && c.role === 'A')!.userIds).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Section 4 — computeRoleHistory, hasAccountabilityGap, computeCompleteness
// ---------------------------------------------------------------------------

describe('computeRoleHistory', () => {
  it('returns the full chronological audit trail for one activity+role, oldest first', () => {
    const events = [
      ev({ role: 'A', userId: 7, createdAt: '2026-06-02T00:00:00.000Z' }),
      ev({ role: 'A', userId: 5, createdAt: '2026-06-01T00:00:00.000Z' }),
      ev({ role: 'C', userId: 9, createdAt: '2026-06-01T00:00:00.000Z' }), // different role — must be excluded
    ];
    const history = computeRoleHistory(events, 'copq_review', 'A');
    expect(history.map((e) => e.userId)).toEqual([5, 7]);
  });

  it('returns an empty array for an activity+role with no events, not undefined/throw', () => {
    expect(computeRoleHistory([], 'copq_review', 'A')).toEqual([]);
  });
});

describe('hasAccountabilityGap', () => {
  it('is true for an activity with no Accountable ever assigned', () => {
    const current = computeCurrentRaci([]);
    expect(hasAccountabilityGap(current, 'copq_review')).toBe(true);
  });

  it('is false once an Accountable is assigned', () => {
    const current = computeCurrentRaci([ev({ role: 'A', userId: 5 })]);
    expect(hasAccountabilityGap(current, 'copq_review')).toBe(false);
  });

  it('reverts to true after the sole Accountable is unassigned (a real, surfaced governance gap)', () => {
    const events = [
      ev({ role: 'A', userId: 5, action: 'assigned', createdAt: '2026-06-01T00:00:00.000Z' }),
      ev({ role: 'A', userId: 5, action: 'unassigned', createdAt: '2026-06-02T00:00:00.000Z' }),
    ];
    const current = computeCurrentRaci(events);
    expect(hasAccountabilityGap(current, 'copq_review')).toBe(true);
  });
});

describe('computeCompleteness', () => {
  it('reports zero coverage for a completely empty event log across all 7 activities', () => {
    const current = computeCurrentRaci([]);
    const completeness = computeCompleteness(current);
    expect(completeness).toHaveLength(7);
    expect(completeness.every((c) => !c.hasAccountable && !c.hasResponsible && c.consultedCount === 0 && c.informedCount === 0)).toBe(true);
  });

  it('reports accurate per-activity coverage when partially assigned', () => {
    const events = [
      ev({ activityKey: 'onboarding_signoff', role: 'A', userId: 1 }),
      ev({ activityKey: 'onboarding_signoff', role: 'C', userId: 2 }),
      ev({ activityKey: 'onboarding_signoff', role: 'C', userId: 3 }),
    ];
    const current = computeCurrentRaci(events);
    const row = computeCompleteness(current).find((c) => c.activityKey === 'onboarding_signoff')!;
    expect(row.hasAccountable).toBe(true);
    expect(row.hasResponsible).toBe(false);
    expect(row.consultedCount).toBe(2);
    expect(row.informedCount).toBe(0);
  });
});

// ===========================================================================
// MANDATORY THREE-TIER STRESS TEST (isc-standing-rules, Rule 7)
// ===========================================================================

describe('STRESS TEST — soft tier (realistic but messy inputs)', () => {
  it('handles an org that has assigned C/I but never set an A or R (partial, realistic setup)', () => {
    const events = [
      ev({ role: 'C', userId: 10, activityKey: 'periodic_evaluation' }),
      ev({ role: 'I', userId: 11, activityKey: 'periodic_evaluation' }),
    ];
    const current = computeCurrentRaci(events);
    expect(hasAccountabilityGap(current, 'periodic_evaluation')).toBe(true);
    const row = computeCompleteness(current).find((c) => c.activityKey === 'periodic_evaluation')!;
    expect(row.consultedCount).toBe(1);
    expect(row.informedCount).toBe(1);
  });

  it('handles the same user holding two different roles on the same activity (unusual but not invalid — a small org)', () => {
    const events = [
      ev({ role: 'A', userId: 1, activityKey: 'second_party_audit' }),
      ev({ role: 'R', userId: 1, activityKey: 'second_party_audit' }),
    ];
    const current = computeCurrentRaci(events);
    expect(current.find((c) => c.activityKey === 'second_party_audit' && c.role === 'A')!.userIds).toEqual([1]);
    expect(current.find((c) => c.activityKey === 'second_party_audit' && c.role === 'R')!.userIds).toEqual([1]);
  });

  it('handles events arriving with out-of-order but valid ISO timestamps across activities', () => {
    const events = [
      ev({ activityKey: 'blacklist_decision', role: 'A', userId: 1, createdAt: '2026-05-15T09:00:00.000Z' }),
      ev({ activityKey: 'offboarding_decision', role: 'A', userId: 2, createdAt: '2026-01-01T00:00:00.000Z' }),
      ev({ activityKey: 'blacklist_decision', role: 'A', userId: 3, createdAt: '2026-05-15T09:00:01.000Z' }),
    ];
    const current = computeCurrentRaci(events);
    expect(current.find((c) => c.activityKey === 'blacklist_decision' && c.role === 'A')!.userIds).toEqual([3]);
    expect(current.find((c) => c.activityKey === 'offboarding_decision' && c.role === 'A')!.userIds).toEqual([2]);
  });
});

describe('STRESS TEST — hardest tier (adversarial inputs)', () => {
  it('does not let an unassign for a role/activity that never had ANY event become a phantom entry', () => {
    const events = [ev({ role: 'A', action: 'unassigned', userId: 999, activityKey: 'blacklist_decision' })];
    const current = computeCurrentRaci(events);
    const row = current.find((c) => c.activityKey === 'blacklist_decision' && c.role === 'A')!;
    expect(row.userIds).toEqual([]); // unassign-before-any-assign is a no-op, not an error and not a phantom holder
  });

  it('a rapid assign/unassign/assign/unassign burst on the same single-owner role resolves correctly regardless of storage order', () => {
    const burst = [
      ev({ role: 'A', userId: 1, action: 'assigned', createdAt: '2026-06-01T00:00:00.000Z', id: '1' }),
      ev({ role: 'A', userId: 1, action: 'unassigned', createdAt: '2026-06-01T00:01:00.000Z', id: '2' }),
      ev({ role: 'A', userId: 2, action: 'assigned', createdAt: '2026-06-01T00:02:00.000Z', id: '3' }),
      ev({ role: 'A', userId: 2, action: 'unassigned', createdAt: '2026-06-01T00:03:00.000Z', id: '4' }),
      ev({ role: 'A', userId: 3, action: 'assigned', createdAt: '2026-06-01T00:04:00.000Z', id: '5' }),
    ];
    // Feed it in three different scramble orders — result must be identical every time.
    const orderings = [burst, [...burst].reverse(), [burst[2], burst[0], burst[4], burst[1], burst[3]]];
    const results = orderings.map((set) => computeCurrentRaci(set).find((c) => c.activityKey === 'copq_review' && c.role === 'A')!.userIds);
    expect(results[0]).toEqual([3]);
    expect(results[1]).toEqual([3]);
    expect(results[2]).toEqual([3]);
  });

  it('an org_admin reassigning A away from themselves and back does not create duplicate/ghost holders', () => {
    const events = [
      ev({ role: 'A', userId: 1, action: 'assigned', createdAt: '2026-06-01T00:00:00.000Z' }),
      ev({ role: 'A', userId: 2, action: 'assigned', createdAt: '2026-06-02T00:00:00.000Z' }),
      ev({ role: 'A', userId: 1, action: 'assigned', createdAt: '2026-06-03T00:00:00.000Z' }), // back to original
    ];
    const current = computeCurrentRaci(events);
    const row = current.find((c) => c.activityKey === 'copq_review' && c.role === 'A')!;
    expect(row.userIds).toEqual([1]); // single value, not [1,1] or [1,2]
  });

  it('a large C/I roster (50 members) contains no duplicates and preserves every distinct id', () => {
    const events = Array.from({ length: 50 }, (_, i) =>
      ev({ role: 'I', userId: i + 1, createdAt: `2026-06-01T00:${String(i).padStart(2, '0')}:00.000Z` })
    );
    const current = computeCurrentRaci(events);
    const row = current.find((c) => c.activityKey === 'copq_review' && c.role === 'I')!;
    expect(row.userIds).toHaveLength(50);
    expect(new Set(row.userIds).size).toBe(50);
  });

  it('mixing single-owner and multi-assignee actions for the SAME userId across different roles never cross-contaminates', () => {
    const events = [
      ev({ role: 'A', userId: 1, activityKey: 'prequalification_approval' }),
      ev({ role: 'C', userId: 1, activityKey: 'prequalification_approval' }),
      ev({ role: 'I', userId: 1, activityKey: 'prequalification_approval' }),
    ];
    const current = computeCurrentRaci(events).filter((c) => c.activityKey === 'prequalification_approval');
    expect(current.find((c) => c.role === 'A')!.userIds).toEqual([1]);
    expect(current.find((c) => c.role === 'C')!.userIds).toEqual([1]);
    expect(current.find((c) => c.role === 'I')!.userIds).toEqual([1]);
    expect(current.find((c) => c.role === 'R')!.userIds).toEqual([]);
  });
});

describe('STRESS TEST — boundary tier (exact thresholds / edge counts)', () => {
  it('a single event log entry (the minimum non-empty case) resolves correctly', () => {
    const current = computeCurrentRaci([ev({ role: 'R', userId: 1 })]);
    expect(current.find((c) => c.activityKey === 'copq_review' && c.role === 'R')!.userIds).toEqual([1]);
  });

  it('exactly zero events (the minimum case) never throws and returns the full 28-row shape', () => {
    expect(() => computeCurrentRaci([])).not.toThrow();
    expect(computeCurrentRaci([])).toHaveLength(28);
  });

  it('unassign immediately following assign at the SAME exact timestamp resolves via the id tiebreak, not silently ignored', () => {
    const sameTs = '2026-06-01T00:00:00.000Z';
    const events = [
      ev({ role: 'A', userId: 1, action: 'assigned', createdAt: sameTs, id: '1' }),
      ev({ role: 'A', userId: 1, action: 'unassigned', createdAt: sameTs, id: '2' }),
    ];
    const current = computeCurrentRaci(events);
    const row = current.find((c) => c.activityKey === 'copq_review' && c.role === 'A')!;
    expect(row.userIds).toEqual([]); // id '2' (unassign) sorts after id '1' (assign) — correctly wins
  });

  it('the 7th and last activity key (offboarding_decision) is not silently dropped by any off-by-one in iteration', () => {
    const current = computeCurrentRaci([ev({ activityKey: 'offboarding_decision', role: 'A', userId: 1 })]);
    const row = current.find((c) => c.activityKey === 'offboarding_decision' && c.role === 'A')!;
    expect(row.userIds).toEqual([1]);
  });

  it('a C/I role with exactly one member behaves identically to an R/A role with one holder (no accidental array-vs-scalar bug)', () => {
    const current = computeCurrentRaci([ev({ role: 'C', userId: 1 })]);
    const row = current.find((c) => c.activityKey === 'copq_review' && c.role === 'C')!;
    expect(Array.isArray(row.userIds)).toBe(true);
    expect(row.userIds).toEqual([1]);
  });
});
