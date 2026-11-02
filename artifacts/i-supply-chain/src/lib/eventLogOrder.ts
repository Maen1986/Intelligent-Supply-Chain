/**
 * Shared, deterministic ordering for append-only event logs (Round C #668, standardisation).
 *
 * Five engines (ASL pre-qualification, onboarding, blacklist, offboarding, RACI) each carried their
 * own private copy of the same sort, and all five shared two real bugs found by the Round C attack:
 *  1. Tie-break by String(id).localeCompare: with ids 9 and 10 on the same timestamp the text order is
 *     "10" < "9", so event 10 was replayed BEFORE event 9. A "reversed" (id 10) landed before its
 *     "finalized" (id 9) and a blacklisted supplier read as NOT blacklisted. localeCompare also varies
 *     by runtime locale.
 *  2. An unreadable createdAt made the comparator return NaN, which leaves the order undefined.
 *
 * Rules: valid timestamps ascending; same timestamp -> numeric ids compare as numbers, otherwise by
 * plain code-unit order (never locale); an event with an unreadable timestamp sorts FIRST (oldest), so
 * it can never override a properly dated later event. Equal everything -> original order (stable).
 * Pure, no imports (standalone-first).
 */
export interface OrderableEvent { id: number | string; createdAt: string }

const NUMERIC = /^\d+$/;

function compareIds(a: number | string, b: number | string): number {
  const sa = String(a); const sb = String(b);
  if (NUMERIC.test(sa) && NUMERIC.test(sb)) {
    // digit strings: shorter (after trimming leading zeros) is smaller, else lexicographic. Safe beyond 2^53.
    const ta = sa.replace(/^0+(?=\d)/, ''); const tb = sb.replace(/^0+(?=\d)/, '');
    if (ta.length !== tb.length) return ta.length - tb.length;
    return ta < tb ? -1 : ta > tb ? 1 : 0;
  }
  return sa < sb ? -1 : sa > sb ? 1 : 0;
}

export function sortEventsChronologically<T extends OrderableEvent>(events: readonly T[]): T[] {
  const keyed = events.map((e, i) => {
    const t = new Date(e.createdAt).getTime();
    return { e, i, t: Number.isNaN(t) ? -Infinity : t };
  });
  keyed.sort((x, y) => {
    if (x.t !== y.t) return x.t < y.t ? -1 : 1;
    const c = compareIds(x.e.id, y.e.id);
    return c !== 0 ? c : x.i - y.i;
  });
  return keyed.map((k) => k.e);
}
