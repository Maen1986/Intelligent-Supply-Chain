/**
 * Pure scoring helpers for the Supply Chain Maturity Assessment.
 *
 * Extracted here so they can be unit-tested independently of the React
 * component. The component imports and uses these directly.
 */

export const MATURITY_LEVELS = [
  { label: 'Reactive',   labelAr: 'تفاعلي',   min: 1.0, max: 1.9, color: '#EF4444', bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200' },
  { label: 'Aware',      labelAr: 'مُدرِك',    min: 2.0, max: 2.9, color: '#F97316', bg: 'bg-orange-50',  text: 'text-orange-700', border: 'border-orange-200' },
  { label: 'Defined',    labelAr: 'مُعرَّف',   min: 3.0, max: 3.9, color: '#EAB308', bg: 'bg-yellow-50',  text: 'text-yellow-700', border: 'border-yellow-200' },
  { label: 'Managed',    labelAr: 'مُدار',     min: 4.0, max: 4.4, color: '#22C55E', bg: 'bg-green-50',   text: 'text-green-700',  border: 'border-green-200' },
  { label: 'Optimised',  labelAr: 'مُحسَّن',   min: 4.5, max: 5.0, color: '#0B3D91', bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200' },
] as const;

export type MaturityLabel = typeof MATURITY_LEVELS[number]['label'];

/**
 * Map a numeric score (1–5) to the matching maturity level entry.
 * Falls back to Reactive if no range matches (e.g. score < 1.0).
 */
export function getLevel(score: number) {
  return MATURITY_LEVELS.find(l => score >= l.min && score <= l.max) ?? MATURITY_LEVELS[0];
}

/**
 * Compute the mean score for a single segment.
 *
 * Returns `null` if any of the five questions in the segment is unanswered
 * (value 0 or missing), so the caller can distinguish "not yet complete"
 * from a legitimate low score.
 *
 * @param answers  Flat answer map keyed as `"<segIdx>-<questionIdx>"`.
 * @param seg      Zero-based segment index.
 */
export function segScore(answers: Record<string, number>, seg: number): number | null {
  const vals   = [0, 1, 2, 3, 4].map(q => answers[`${seg}-${q}`] ?? 0);
  const filled = vals.filter(v => v > 0);
  return filled.length === 5 ? filled.reduce((a, b) => a + b, 0) / 5 : null;
}

/**
 * Compute the overall maturity score across all segments.
 *
 * Only segments with a fully-answered (non-null) score are included in the
 * average. Partially-answered segments are excluded so they cannot deflate
 * the result. Returns 0 when no segment has been completed yet.
 *
 * @param answers      Flat answer map.
 * @param numSegments  Total number of segments (8 in the current assessment).
 */
export function overallScore(answers: Record<string, number>, numSegments: number): number {
  const scores: number[] = [];
  for (let i = 0; i < numSegments; i++) {
    const s = segScore(answers, i);
    if (s !== null) scores.push(s);
  }
  return scores.length === 0 ? 0 : scores.reduce((a, b) => a + b, 0) / scores.length;
}

/* ── Sub-segment & industry-weighted scoring ────────────────────────────── */

/**
 * Minimal shape of a sub-segment needed by the weighted scoring engine.
 * Avoids importing from maturityData.tsx (which is a React module) so this
 * file remains pure and independently testable.
 */
export interface SubSegmentLike {
  questions: readonly unknown[];      // only .length is used
  industryWeights: Record<string, number>;
}

export interface SegmentLike {
  subSegments?: readonly SubSegmentLike[];
}

/**
 * Compute the mean score for a single sub-segment.
 *
 * Answer keys follow the 3-part format `"{segIdx}-{subIdx}-{questionIdx}"`,
 * distinct from the legacy 2-part flat-question keys used by `segScore`.
 *
 * Returns `null` if any question in the sub-segment is unanswered (0 or
 * missing), so the caller can exclude incomplete sub-segments from weighted
 * averages without deflating results.
 *
 * @param answers       Flat answer map (may contain both 2-part and 3-part keys).
 * @param segIdx        Zero-based segment index.
 * @param subIdx        Zero-based sub-segment index within the segment.
 * @param questionCount Number of questions in this sub-segment.
 */
export function subSegScore(
  answers: Record<string, number>,
  segIdx: number,
  subIdx: number,
  questionCount: number,
): number | null {
  if (questionCount === 0) return null;
  const vals = Array.from({ length: questionCount }, (_, q) =>
    answers[`${segIdx}-${subIdx}-${q}`] ?? 0,
  );
  const filled = vals.filter(v => v > 0);
  return filled.length === questionCount
    ? filled.reduce((a, b) => a + b, 0) / questionCount
    : null;
}

/**
 * Compute the industry-weighted mean score for a segment's sub-segments.
 *
 * Only sub-segments with a fully-answered (non-null) score contribute to the
 * mean. Each sub-segment's contribution is scaled by
 * `subSeg.industryWeights[industryId]` (defaults to `1.0` when the key is
 * absent). Returns `null` when no sub-segment has been answered yet.
 *
 * @param answers     Flat answer map (3-part keys expected).
 * @param seg         Segment object containing `subSegments`.
 * @param segIdx      Zero-based segment index (needed to build answer keys).
 * @param industryId  Industry identifier from intake data.
 */
export function weightedSegScore(
  answers: Record<string, number>,
  seg: SegmentLike,
  segIdx: number,
  industryId: string,
): number | null {
  const subs = seg.subSegments;
  if (!subs || subs.length === 0) return null;

  let weightedSum = 0;
  let weightSum   = 0;

  for (let si = 0; si < subs.length; si++) {
    const sub   = subs[si];
    const score = subSegScore(answers, segIdx, si, sub.questions.length);
    if (score === null) continue;

    const weight  = sub.industryWeights[industryId] ?? 1.0;
    weightedSum  += score * weight;
    weightSum    += weight;
  }

  return weightSum === 0 ? null : weightedSum / weightSum;
}

/**
 * Compute the industry-weighted overall maturity score across all segments.
 *
 * Averages the non-null `weightedSegScore` values across all segments.
 * Returns `0` when no segment has any completed sub-segment answers.
 *
 * @param answers    Flat answer map (3-part keys expected).
 * @param segments   Array of segment objects.
 * @param industryId Industry identifier from intake data.
 */
export function weightedOverallScore(
  answers: Record<string, number>,
  segments: readonly SegmentLike[],
  industryId: string,
): number {
  const scores: number[] = [];
  for (let i = 0; i < segments.length; i++) {
    const s = weightedSegScore(answers, segments[i], i, industryId);
    if (s !== null) scores.push(s);
  }
  return scores.length === 0 ? 0 : scores.reduce((a, b) => a + b, 0) / scores.length;
}

/**
 * Count how many sub-segments have been fully answered via 3-part answer keys.
 *
 * Used to compute the coverage percentage shown in the coverage indicator.
 * Only 3-part keys (`"{segIdx}-{subIdx}-{qIdx}"`) are considered — flat
 * 2-part segment answers do NOT count as sub-segment coverage.  This
 * ensures the indicator honestly reflects whether granular sub-segment data
 * is present, not just whether the top-level questions were completed.
 *
 * @param answers  Flat answer map (may contain both 2-part and 3-part keys).
 * @param segments Ordered array of segment objects.
 */
export function countCoveredSubSegments(
  answers: Record<string, number>,
  segments: readonly SegmentLike[],
): number {
  let covered = 0;
  for (let i = 0; i < segments.length; i++) {
    const subs = segments[i].subSegments;
    if (!subs) continue;
    for (let si = 0; si < subs.length; si++) {
      if (subSegScore(answers, i, si, subs[si].questions.length) !== null) {
        covered++;
      }
    }
  }
  return covered;
}
