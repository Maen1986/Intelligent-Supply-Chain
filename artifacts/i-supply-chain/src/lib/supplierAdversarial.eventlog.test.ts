/**
 * Round C (#668) -- append-only event logs under attack (ASL, blacklist, RACI + the shared ordering).
 * The state of a supplier (blacklisted? on the approved list? who is accountable?) is REPLAYED from
 * events, so event ORDER is a safety property: a wrong order flips a blacklisted supplier to "clean".
 */
import { describe, it, expect } from 'vitest';
import { sortEventsChronologically } from './eventLogOrder';
import { computeCurrentBlacklistState, computeBlacklistBlockSignal, type BlacklistEventLike } from './supplierBlacklist';
import { computeCurrentASLState, type ASLDecisionEventLike } from './supplierPreQualification';
import { computeCurrentRaci, type RaciAssignmentEvent } from './supplierRACI';
import { rng, pick, int } from './supplierAdversarialKit';

const T = '2026-05-01T10:00:00.000Z';
const bl = (id: number | string, action: BlacklistEventLike['action'], createdAt = T, o: Partial<BlacklistEventLike> = {}): BlacklistEventLike =>
  ({ id, supplierId: 's1', action, durationType: null, effectiveUntilIso: null, createdAt, ...o });
const asl = (id: number | string, decisionType: ASLDecisionEventLike['decisionType'], createdAt = T): ASLDecisionEventLike =>
  ({ id, supplierId: 's1', decisionType, reasonCategory: 'other' as never, reasonNote: null, approverUserId: 1, qualificationGateStatusAtDecision: 'PASS' as never, reviewDueAt: null, createdAt });
const raci = (id: number | string, action: 'assigned' | 'unassigned', userId: number, createdAt = T): RaciAssignmentEvent =>
  ({ id, activityKey: 'copq_review', role: 'R', userId, action, assignedByUserId: 1, createdAt });

describe('R-C shared event ordering', () => {
  it('numeric ids on the same timestamp order as numbers (9 before 10, not "10" before "9")', () => {
    const out = sortEventsChronologically([{ id: 10, createdAt: T }, { id: 9, createdAt: T }, { id: 100, createdAt: T }, { id: 2, createdAt: T }]);
    expect(out.map((e) => e.id)).toEqual([2, 9, 10, 100]);
  });
  it('digit-string ids order numerically, including beyond 2^53 and with leading zeros', () => {
    const ids = ['9007199254740993', '9007199254740992', '010', '9'];
    expect(sortEventsChronologically(ids.map((id) => ({ id, createdAt: T }))).map((e) => e.id)).toEqual(['9', '010', '9007199254740992', '9007199254740993']);
  });
  it('mixed / text ids use plain code-unit order, never the locale', () => {
    expect(sortEventsChronologically(['b', 'a', 'B', 'A'].map((id) => ({ id, createdAt: T }))).map((e) => e.id)).toEqual(['A', 'B', 'a', 'b']);
  });
  it('an unreadable timestamp sorts FIRST and can never override a later, properly dated event', () => {
    const out = sortEventsChronologically([{ id: 2, createdAt: T }, { id: 1, createdAt: 'garbage' }, { id: 3, createdAt: '' }]);
    expect(out.map((e) => e.id)).toEqual([1, 3, 2]);
  });
  it('is stable, does not mutate its input, and is deterministic for equal events', () => {
    const input = [{ id: 1, createdAt: T, tag: 'x' }, { id: 1, createdAt: T, tag: 'y' }];
    const copy = JSON.stringify(input);
    expect(sortEventsChronologically(input).map((e) => e.tag)).toEqual(['x', 'y']);
    expect(JSON.stringify(input)).toBe(copy);
  });
});

describe('R-C regression: same-timestamp event 9 then event 10', () => {
  it('blacklist: finalized(9) then reversed(10) at the same instant -> NOT blacklisted (the reversal is later)', () => {
    const s = computeCurrentBlacklistState('s1', [bl(10, 'reversed'), bl(9, 'finalized')]);
    expect(s.isBlacklisted).toBe(false);
  });
  it('blacklist: reversed(9) then finalized(10) at the same instant -> blacklisted', () => {
    const s = computeCurrentBlacklistState('s1', [bl(10, 'finalized'), bl(9, 'reversed')]);
    expect(s.isBlacklisted).toBe(true);
  });
  it('ASL: approved(9) then revoked(10) at the same instant -> revoked, off the list', () => {
    const s = computeCurrentASLState('s1', [asl(10, 'revoked'), asl(9, 'approved')]);
    expect(s.status).toBe('revoked'); expect(s.onASL).toBe(false);
  });
  it('RACI: assigned(9) then unassigned(10) for the sole owner -> nobody holds it', () => {
    const r = computeCurrentRaci([raci(10, 'unassigned', 7), raci(9, 'assigned', 7)]).find((x) => x.activityKey === 'copq_review' && x.role === 'R')!;
    expect(r.userIds).toEqual([]);
  });
});

describe('R-C properties: replay does not depend on the order the rows arrive in (300 shuffles each)', () => {
  const SEEDS = Array.from({ length: 300 }, (_, i) => 7000 + i);
  const shuffle = <T,>(r: () => number, xs: T[]) => xs.map((x) => [r(), x] as const).sort((a, b) => a[0] - b[0]).map((p) => p[1]);
  it('blacklist state', () => {
    const fails: string[] = [];
    for (const s of SEEDS) {
      const r = rng(s); const n = int(r, 1, 12);
      const evs = Array.from({ length: n }, (_, i) => bl(i + 1, pick(r, ['draft_set', 'draft_clear', 'finalized', 'reversed'] as const), new Date(Date.UTC(2026, 0, 1 + int(r, 0, 5))).toISOString()));
      const a = computeCurrentBlacklistState('s1', evs, new Date('2026-12-01')); const b = computeCurrentBlacklistState('s1', shuffle(r, evs), new Date('2026-12-01'));
      if (JSON.stringify(a) !== JSON.stringify(b)) fails.push(`seed ${s}`);
    }
    expect(fails.slice(0, 8)).toEqual([]);
  });
  it('ASL state', () => {
    const fails: string[] = [];
    for (const s of SEEDS) {
      const r = rng(s); const n = int(r, 1, 12);
      const evs = Array.from({ length: n }, (_, i) => asl(i + 1, pick(r, ['approved', 'conditionally_approved', 'declined', 'suspended', 'revoked', 'reinstated'] as const), new Date(Date.UTC(2026, 0, 1 + int(r, 0, 5))).toISOString()));
      const a = computeCurrentASLState('s1', evs, new Date('2026-12-01')); const b = computeCurrentASLState('s1', shuffle(r, evs), new Date('2026-12-01'));
      if (JSON.stringify(a) !== JSON.stringify(b)) fails.push(`seed ${s}`);
    }
    expect(fails.slice(0, 8)).toEqual([]);
  });
  it('RACI state', () => {
    const fails: string[] = [];
    for (const s of SEEDS) {
      const r = rng(s); const n = int(r, 1, 14);
      const evs = Array.from({ length: n }, (_, i) => raci(i + 1, pick(r, ['assigned', 'unassigned'] as const), int(r, 1, 4), new Date(Date.UTC(2026, 0, 1 + int(r, 0, 5))).toISOString()));
      if (JSON.stringify(computeCurrentRaci(evs)) !== JSON.stringify(computeCurrentRaci(shuffle(r, evs)))) fails.push(`seed ${s}`);
    }
    expect(fails.slice(0, 8)).toEqual([]);
  });
});

describe('R-C hostile event data: fail safe, never crash', () => {
  it('a time-bound blacklist entry with an unreadable end date stays blacklisted (fail-closed), never silently expires', () => {
    const s = computeCurrentBlacklistState('s1', [bl(1, 'finalized', T, { durationType: 'time_bound', effectiveUntilIso: 'not a date' })], new Date('2030-01-01'));
    expect(s.isBlacklisted).toBe(true);
    expect(computeBlacklistBlockSignal(s)).toBeTruthy();
  });
  it('a time-bound entry with a real past end date is expired, not blacklisted', () => {
    const s = computeCurrentBlacklistState('s1', [bl(1, 'finalized', T, { durationType: 'time_bound', effectiveUntilIso: '2026-06-01T00:00:00Z' })], new Date('2026-07-01'));
    expect(s.isExpired).toBe(true); expect(s.isBlacklisted).toBe(false);
  });
  it('events for other suppliers, empty logs and duplicate ids never crash', () => {
    expect(() => computeCurrentBlacklistState('s1', [])).not.toThrow();
    expect(() => computeCurrentASLState('s1', [asl(1, 'approved'), asl(1, 'revoked')])).not.toThrow();
    expect(() => computeCurrentRaci([])).not.toThrow();
  });
  it('a review date that is unreadable is not reported as overdue (no false alarm) and not as on-time', () => {
    const e = { ...asl(1, 'approved'), reviewDueAt: 'garbage' };
    expect(computeCurrentASLState('s1', [e], new Date('2030-01-01')).isReviewOverdue).toBe(false);
  });
});
