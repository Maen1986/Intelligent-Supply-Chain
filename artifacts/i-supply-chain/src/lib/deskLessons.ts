// src/lib/deskLessons.ts
//
// Lessons and Experience Engine, Phase 1 (registry #809, spec v3, 6 Nov 2026).
// Pure logic for the "close this negotiation and record the lesson" step and for "Your past experience".
//
// Honesty rules (Decision Record 8.7):
//  - A lesson is TYPED BY THE USER. evidence is always 'client-reported'. ISC never measures, infers or drafts it.
//  - Matching is categorical (same supplier name, or same purchase type). It never claims semantic similarity.
//  - Nothing here is pooled or shared. A lesson lives inside the saved case (JSON `data`), private to the user's account.
//  - Outcome labels show what happened. They are NOT proof that the approach caused the result.

export type LessonOutcome = 'held' | 'improved' | 'declined' | 'unverified';
export type LessonWhy = 'market-price' | 'supplier-capacity' | 'our-position' | 'timing' | 'contract-terms' | 'relationship' | 'other';

export interface Lesson {
  outcome: LessonOutcome;
  expected: string;
  happened: string;
  why: LessonWhy;
  whyNote: string;
  repeat: string;
  change: string;
  evidence: 'client-reported';
  closedAt: string;
}

export const FIELD_MAX = 500;

export const OUTCOMES: { id: LessonOutcome; en: string; ar: string }[] = [
  { id: 'held', en: 'Held: the agreed result stayed in place', ar: 'ثبتت: بقيت النتيجة المتفق عليها كما هي' },
  { id: 'improved', en: 'Improved: better than planned', ar: 'تحسنت: أفضل مما خُطط' },
  { id: 'declined', en: 'Declined: worse than planned', ar: 'تراجعت: أسوأ مما خُطط' },
  { id: 'unverified', en: 'Not yet verifiable', ar: 'لا يمكن التحقق منها بعد' },
];

export const WHYS: { id: LessonWhy; en: string; ar: string }[] = [
  { id: 'market-price', en: 'Market prices moved', ar: 'تحركت أسعار السوق' },
  { id: 'supplier-capacity', en: 'Supplier capacity or supply limits', ar: 'طاقة المورّد أو قيود التوريد' },
  { id: 'our-position', en: 'Our negotiating position', ar: 'موقفنا التفاوضي' },
  { id: 'timing', en: 'Timing', ar: 'التوقيت' },
  { id: 'contract-terms', en: 'Contract terms', ar: 'شروط العقد' },
  { id: 'relationship', en: 'The relationship', ar: 'العلاقة' },
  { id: 'other', en: 'Something else', ar: 'سبب آخر' },
];

const clip = (v: unknown): string => (typeof v === 'string' ? v.trim().slice(0, FIELD_MAX) : '');

/** Build a Lesson from form input, or null when it is not usable (no outcome, or nothing written). */
export function makeLesson(input: Partial<Record<keyof Lesson, unknown>>, nowIso: string): Lesson | null {
  const outcome = OUTCOMES.find(o => o.id === input.outcome)?.id;
  if (!outcome) return null;
  const why = WHYS.find(w => w.id === input.why)?.id ?? 'other';
  const lesson: Lesson = {
    outcome, expected: clip(input.expected), happened: clip(input.happened), why,
    whyNote: clip(input.whyNote), repeat: clip(input.repeat), change: clip(input.change),
    evidence: 'client-reported', closedAt: nowIso,
  };
  if (!lesson.happened && !lesson.repeat && !lesson.change) return null;
  return lesson;
}

export interface CaseLike { supplier: string; quadrant: string; lesson?: Lesson; archivedAt?: string }
interface SavedLike { clientKey: string; name: string; data: CaseLike }

export const normName = (s: string): string => s.trim().toLowerCase().replace(/\s+/g, ' ');

const byRecent = (a: SavedLike, b: SavedLike): number =>
  (b.data.lesson?.closedAt ?? '').localeCompare(a.data.lesson?.closedAt ?? '');

/**
 * Primary: the most recent lesson on the SAME supplier name.
 * Alternative: the most recent lesson on the SAME purchase type (quadrant) that is not the primary.
 * Both come from the user's own saved cases only (archived ones included). Returns nulls when there is nothing to show.
 */
export function findPastExperience<T extends SavedLike>(cur: { supplier: string; quadrant: string }, others: T[]): { primary: T | null; alternative: T | null } {
  const name = normName(cur.supplier);
  if (!name) return { primary: null, alternative: null };
  const withLesson = others.filter(c => c.data.lesson).sort(byRecent);
  const primary = withLesson.find(c => normName(c.data.supplier) === name) ?? null;
  const alternative = withLesson.find(c => c !== primary && c.data.quadrant === cur.quadrant) ?? null;
  return { primary, alternative };
}

/** Keep at most maxActive visible cases and maxArchived archived ones. Order within each group is preserved. */
export function capCases<T extends { data: { archivedAt?: string } }>(list: T[], maxActive: number, maxArchived: number): T[] {
  return [...list.filter(c => !c.data.archivedAt).slice(0, maxActive), ...list.filter(c => c.data.archivedAt).slice(0, maxArchived)];
}

export const isArchived = (c: { data: { archivedAt?: string } }): boolean => Boolean(c.data.archivedAt);

/** "Erase" a case: a case that has a lesson is archived (kept, hidden); one without a lesson is removed as before. */
export function eraseOrArchive<T extends { clientKey: string; data: { lesson?: Lesson; archivedAt?: string } }>(list: T[], key: string, nowIso: string): T[] {
  return list.flatMap(c => (c.clientKey !== key ? [c] : c.data.lesson ? [{ ...c, data: { ...c.data, archivedAt: nowIso } } as T] : []));
}
