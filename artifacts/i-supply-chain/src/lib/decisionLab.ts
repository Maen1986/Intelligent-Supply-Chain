/**
 * Decision Lab — scoring/prompt logic (#166, 20 Aug 2026)
 *
 * Structured scenario-comparison tool: a manual-input weighted decision
 * matrix. Formalizes what the Consultancy Engine already half-does (compare
 * options in prose) into a dedicated, reusable tool. Named and scoped at
 * concept level in ISC_UIUX_Vision_Synthesis_and_Scalability_Plan.docx (v4),
 * Wave B-1: "Manual scenario input (options, criteria, weights) -- no live
 * data required." This module is the file-level design that concept
 * required before build.
 *
 * Same pattern as kraljicScoring.ts: pure functions, no side effects, no
 * network calls -- the page component owns state/persistence/AI-plan wiring.
 */

export interface DecisionCriterion {
  id: string;
  name: string;
  /** 1-10. A criterion with weight 0 is effectively excluded from scoring. */
  weight: number;
}

export interface DecisionOption {
  id: string;
  name: string;
  /** criterionId -> 1-5 rating. Missing entries are treated as unscored (0). */
  scores: Record<string, number>;
}

export interface DecisionScenario {
  question: string;
  criteria: DecisionCriterion[];
  options: DecisionOption[];
}

export interface CriterionContribution {
  criterionId: string;
  name: string;
  rawScore: number;
  weight: number;
  /** rawScore * weight, before normalisation. */
  contribution: number;
}

export interface ScoredOption {
  id: string;
  name: string;
  /** Weighted average on the same 1-5 scale as the input ratings, so it reads
   *  consistently with the Maturity Assessment's 1-5 convention elsewhere in
   *  the app. 0 when no criteria have both a weight and a score entered. */
  weightedScore: number;
  rank: number;
  breakdown: CriterionContribution[];
}

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

export function newCriterion(name = ''): DecisionCriterion {
  return { id: nextId('crit'), name, weight: 5 };
}

export function newOption(name = ''): DecisionOption {
  return { id: nextId('opt'), name, scores: {} };
}

/**
 * Weighted-average scoring. Deliberately NOT normalised to 0-100 -- keeping
 * the 1-5 scale means a Decision Lab result reads on the same scale as every
 * other score in the app (Maturity Assessment segments, KPI ratings), rather
 * than introducing a fourth scoring convention a client has to re-learn.
 */
export function scoreOptions(scenario: DecisionScenario): ScoredOption[] {
  const activeCriteria = scenario.criteria.filter(c => c.weight > 0 && c.name.trim());

  const scored: ScoredOption[] = scenario.options
    .filter(o => o.name.trim())
    .map(option => {
      const breakdown: CriterionContribution[] = activeCriteria.map(c => {
        const rawScore = option.scores[c.id] ?? 0;
        return { criterionId: c.id, name: c.name, rawScore, weight: c.weight, contribution: rawScore * c.weight };
      });
      const totalWeight = breakdown.reduce((s, b) => s + b.weight, 0);
      const totalContribution = breakdown.reduce((s, b) => s + b.contribution, 0);
      const weightedScore = totalWeight > 0 ? Math.round((totalContribution / totalWeight) * 100) / 100 : 0;
      return { id: option.id, name: option.name, weightedScore, rank: 0, breakdown };
    });

  scored.sort((a, b) => b.weightedScore - a.weightedScore);
  scored.forEach((s, i) => { s.rank = i + 1; });
  return scored;
}

/** True once there's enough entered to compute a meaningful result. */
export function isScenarioScoreable(scenario: DecisionScenario): boolean {
  const namedOptions = scenario.options.filter(o => o.name.trim());
  const activeCriteria = scenario.criteria.filter(c => c.weight > 0 && c.name.trim());
  return namedOptions.length >= 2 && activeCriteria.length >= 1;
}

export interface DecisiveCriterion {
  criterionId: string;
  name: string;
  /** Absolute weighted-contribution gap this criterion opened up between the
   *  top two options -- i.e. how much of the overall score gap it explains. */
  contributionDelta: number;
}

/**
 * Honesty/self-critique aid (customer-simulation QA finding, 20 Aug 2026):
 * a "close call" flag alone tells the reader the top two are near-tied, but
 * not *why* -- which criterion is actually carrying the ranking. Identifies
 * the single criterion with the largest absolute weighted-contribution gap
 * between the top two scored options, so the reader knows exactly where to
 * scrutinize their own input (a rating they're less sure about, a weight
 * that may deserve a second look) before treating the ranking as settled.
 * Returns null when there are fewer than 2 scored options.
 */
export function mostDecisiveCriterion(scored: ScoredOption[]): DecisiveCriterion | null {
  if (scored.length < 2) return null;
  const [first, second] = scored;

  let best: DecisiveCriterion | null = null;
  for (const b of first.breakdown) {
    const other = second.breakdown.find(o => o.criterionId === b.criterionId);
    const otherContribution = other?.contribution ?? 0;
    const delta = Math.abs(b.contribution - otherContribution);
    if (!best || delta > best.contributionDelta) {
      best = { criterionId: b.criterionId, name: b.name, contributionDelta: delta };
    }
  }
  return best;
}

export function buildDecisionPrompt(scenario: DecisionScenario, scored: ScoredOption[], isAr: boolean): string {
  const criteriaLines = scenario.criteria
    .filter(c => c.weight > 0 && c.name.trim())
    .map(c => `  - ${c.name} (weight ${c.weight}/10)`)
    .join('\n');

  const optionLines = scored
    .map(s => {
      const detail = s.breakdown.map(b => `${b.name}: ${b.rawScore || '—'}/5`).join(', ');
      return `  ${s.rank}. ${s.name} -- weighted score ${s.weightedScore}/5 (${detail})`;
    })
    .join('\n');

  const header = isAr
    ? `## مختبر القرار: ${scenario.question || 'مقارنة خيارات'}`
    : `## Decision Lab: ${scenario.question || 'Options comparison'}`;

  return [
    header,
    '',
    isAr ? '## معايير التقييم' : '## Evaluation Criteria',
    criteriaLines,
    '',
    isAr ? '## الخيارات المرتبة حسب النتيجة الموزونة' : '## Options Ranked by Weighted Score',
    optionLines,
  ].join('\n');
}
