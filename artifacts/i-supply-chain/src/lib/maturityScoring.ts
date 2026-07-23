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
