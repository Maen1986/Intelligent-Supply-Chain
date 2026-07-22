/**
 * Shared ranking logic for "weakest areas" lists.
 *
 * Both the assessment page (Maturity.tsx priority action plan) and the
 * command-center briefing (CommandCenter.tsx weakest sub-dimensions) rank
 * items by ascending score and keep the lowest N. Keeping the rule in one
 * place guarantees the two pages can never disagree on tie-breaking or
 * ordering semantics.
 *
 * Ranking rules:
 * - Sort ascending by score (lowest = weakest first).
 * - Ties keep original (definition) order — sort is stable.
 * - Return the first `count` items.
 */
export function rankWeakest<T>(
  items: T[],
  getScore: (item: T) => number,
  count: number,
): T[] {
  return [...items].sort((a, b) => getScore(a) - getScore(b)).slice(0, count);
}
