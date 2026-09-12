/**
 * supplierPeriodicEvaluation.test.ts
 *
 * Standalone stress-test suite for Item 5's core module, run before UI
 * wiring, following the same "step zero, stress-test standalone first"
 * discipline as Item 4's governance-tier module.
 *
 * Covers (per this build's explicit verification bar): first-ever review
 * (no prior evaluation history), overdue review, missing/conflicting
 * Kraljic or industry signal (reusing the governance-tier module's own
 * handling), a good periodic score coexisting with an active Module 07
 * escalation (tension disclosed, not silently resolved), the weakest-link
 * (never-averaged) overall recommendation rule, cadence override
 * precedence, and boundary conditions on the scoring bands and due-date
 * math.
 */
import { describe, it, expect } from 'vitest';
import {
  rateCategoryScore,
  scoreCategoryResults,
  deriveOverallRecommendation,
  shouldEscalateToFindingsActions,
  computeRecommendedEvaluationCadence,
  resolveEffectiveCadence,
  assessReviewDueStatus,
  buildEvidenceChecklist,
  checkRecoveryTension,
  type CategoryScoreInput,
  type CadenceOverrideLike,
  type Module07EscalationSnapshotLike,
} from './supplierPeriodicEvaluation';

// ---------------------------------------------------------------------------
// Category scoring bands (boundary tests)
// ---------------------------------------------------------------------------
describe('rateCategoryScore -- boundary conditions on the disclosed banding', () => {
  it('rates exactly 85 as strong (lower-inclusive boundary)', () => {
    expect(rateCategoryScore(85)).toBe('strong');
  });
  it('rates 84 as acceptable (just below the strong boundary)', () => {
    expect(rateCategoryScore(84)).toBe('acceptable');
  });
  it('rates exactly 65 as acceptable', () => {
    expect(rateCategoryScore(65)).toBe('acceptable');
  });
  it('rates exactly 40 as watch', () => {
    expect(rateCategoryScore(40)).toBe('watch');
  });
  it('rates 39 as at_risk', () => {
    expect(rateCategoryScore(39)).toBe('at_risk');
  });
  it('rates 0 (zero score) as at_risk', () => {
    expect(rateCategoryScore(0)).toBe('at_risk');
  });
  it('rates 100 (max score) as strong', () => {
    expect(rateCategoryScore(100)).toBe('strong');
  });
});

// ---------------------------------------------------------------------------
// Weakest-link overall recommendation -- never averaged
// ---------------------------------------------------------------------------
describe('deriveOverallRecommendation -- weakest-link rule, never a composite average', () => {
  it('CORE CASE: one at-risk category drives escalate_consider even when every other category is strong (proves no averaging)', () => {
    const inputs: CategoryScoreInput[] = [
      { category: 'quality', score: 20, dataSource: 'manual' }, // at_risk
      { category: 'delivery_otif', score: 98, dataSource: 'manual' },
      { category: 'cost', score: 95, dataSource: 'manual' },
      { category: 'service_responsiveness', score: 92, dataSource: 'manual' },
      { category: 'compliance_esg', score: 99, dataSource: 'manual' },
    ];
    const scored = scoreCategoryResults(inputs);
    // A naive average of [20,98,95,92,99] = 80.8 -> would land in "acceptable"
    // if this module (wrongly) averaged. It must not.
    const result = deriveOverallRecommendation(scored);
    expect(result.overallRecommendation).toBe('escalate_consider');
    expect(result.worstCategory?.category).toBe('quality');
    expect(result.noCompositeScoreDisclosureEn).toMatch(/not an averaged composite/);
    expect(shouldEscalateToFindingsActions(result.overallRecommendation)).toBe(true);
  });

  it('all-strong categories yield continue_standard_cadence and no escalation', () => {
    const inputs: CategoryScoreInput[] = [
      { category: 'quality', score: 90, dataSource: 'erp' },
      { category: 'delivery_otif', score: 88, dataSource: 'erp' },
      { category: 'cost', score: 86, dataSource: 'manual' },
      { category: 'service_responsiveness', score: 91, dataSource: 'manual' },
      { category: 'compliance_esg', score: 95, dataSource: 'manual' },
    ];
    const result = deriveOverallRecommendation(scoreCategoryResults(inputs));
    expect(result.overallRecommendation).toBe('continue_standard_cadence');
    expect(shouldEscalateToFindingsActions(result.overallRecommendation)).toBe(false);
  });

  it('a single watch-rated category (no at-risk) yields monitor_closely, not escalate_consider', () => {
    const inputs: CategoryScoreInput[] = [
      { category: 'quality', score: 55, dataSource: 'manual' }, // watch
      { category: 'delivery_otif', score: 90, dataSource: 'manual' },
      { category: 'cost', score: 90, dataSource: 'manual' },
      { category: 'service_responsiveness', score: 90, dataSource: 'manual' },
      { category: 'compliance_esg', score: 90, dataSource: 'manual' },
    ];
    const result = deriveOverallRecommendation(scoreCategoryResults(inputs));
    expect(result.overallRecommendation).toBe('monitor_closely');
    expect(shouldEscalateToFindingsActions(result.overallRecommendation)).toBe(false);
  });

  it('empty category list returns a null worstCategory without throwing', () => {
    const result = deriveOverallRecommendation([]);
    expect(result.worstCategory).toBeNull();
    expect(result.overallRecommendation).toBe('continue_standard_cadence');
  });
});

// ---------------------------------------------------------------------------
// Cadence recommendation -- REAL reuse of the governance-tier module
// ---------------------------------------------------------------------------
describe('computeRecommendedEvaluationCadence -- reuses computeRecommendedGovernanceTier, does not fork', () => {
  it('missing Kraljic AND industry signal defaults to annual (the lighter cadence), mirroring the governance-tier module\'s own Advisory default', () => {
    const rec = computeRecommendedEvaluationCadence({});
    expect(rec.recommendedCadence).toBe('annual');
    expect(rec.basis.recommendedTier).toBe('advisory');
    expect(rec.basis.dataCompleteness).toBe('neither-present');
  });

  it('missing only Kraljic quadrant (industry present but unregulated) still defaults to annual', () => {
    const rec = computeRecommendedEvaluationCadence({ declaredIndustry: 'retail-fmcg' });
    expect(rec.recommendedCadence).toBe('annual');
    expect(rec.basis.dataCompleteness).toBe('industry-only');
  });

  it('malformed/differently-cased Kraljic input is defensively normalized (reusing normalizeKraljicQuadrant internally) rather than treated as a crash or silently misclassified', () => {
    const rec = computeRecommendedEvaluationCadence({ kraljicQuadrant: 'STRATEGIC', declaredIndustry: 'retail-fmcg' });
    expect(rec.basis.resolvedInputs.kraljicQuadrant).toBe('strategic');
    expect(rec.recommendedCadence).toBe('semi_annual'); // strategic -> high-touch -> operational -> semi-annual
  });

  it('CONFLICTING-SIGNAL CASE 1 (named, reused from the governance-tier suite): Strategic quadrant + unregulated (retail-fmcg) industry -> semi-annual (supply risk alone is enough)', () => {
    const rec = computeRecommendedEvaluationCadence({ kraljicQuadrant: 'strategic', declaredIndustry: 'retail-fmcg' });
    expect(rec.recommendedCadence).toBe('semi_annual');
    expect(rec.basis.kraljicSignal).toBe('high-touch');
    expect(rec.basis.industrySignal).toBe('not-regulated');
  });

  it('CONFLICTING-SIGNAL CASE 2 (named, reused from the governance-tier suite): Non-critical quadrant + regulated (government) industry -> semi-annual (regulatory exposure alone is enough)', () => {
    const rec = computeRecommendedEvaluationCadence({ kraljicQuadrant: 'non-critical', declaredIndustry: 'government' });
    expect(rec.recommendedCadence).toBe('semi_annual');
    expect(rec.basis.kraljicSignal).toBe('low-touch');
    expect(rec.basis.industrySignal).toBe('regulated');
  });

  it('both signals low-risk -> annual', () => {
    const rec = computeRecommendedEvaluationCadence({ kraljicQuadrant: 'leverage', declaredIndustry: 'logistics' });
    expect(rec.recommendedCadence).toBe('annual');
  });
});

describe('resolveEffectiveCadence -- override always wins until explicitly changed, in both directions', () => {
  it('CORE STRESS CASE A: a client override to annual persists even after re-scoring would newly recommend semi-annual', () => {
    const override: CadenceOverrideLike = { cadence: 'annual', overriddenAt: '2026-01-01T00:00:00Z' };
    const newRecommendation = computeRecommendedEvaluationCadence({ kraljicQuadrant: 'strategic', declaredIndustry: 'government' });
    expect(newRecommendation.recommendedCadence).toBe('semi_annual');
    const effective = resolveEffectiveCadence(newRecommendation, override);
    expect(effective.cadence).toBe('annual');
    expect(effective.source).toBe('client-override');
  });

  it('CORE STRESS CASE B: a client override to semi-annual persists even after re-scoring would newly recommend annual', () => {
    const override: CadenceOverrideLike = { cadence: 'semi_annual', overriddenAt: '2026-01-01T00:00:00Z' };
    const newRecommendation = computeRecommendedEvaluationCadence({ kraljicQuadrant: 'leverage', declaredIndustry: 'logistics' });
    expect(newRecommendation.recommendedCadence).toBe('annual');
    const effective = resolveEffectiveCadence(newRecommendation, override);
    expect(effective.cadence).toBe('semi_annual');
    expect(effective.source).toBe('client-override');
  });

  it('no override present -> effective cadence is just the recommendation', () => {
    const rec = computeRecommendedEvaluationCadence({ kraljicQuadrant: 'bottleneck', declaredIndustry: 'oil-gas' });
    const effective = resolveEffectiveCadence(rec, null);
    expect(effective.source).toBe('recommendation');
    expect(effective.cadence).toBe('semi_annual');
  });
});

// ---------------------------------------------------------------------------
// Review due-status -- first-ever review, overdue, boundary
// ---------------------------------------------------------------------------
describe('assessReviewDueStatus -- never-evaluated is NOT overdue; boundary and overdue handling', () => {
  it('FIRST-EVER-REVIEW CASE: a supplier with no prior evaluation history is never_evaluated, never overdue', () => {
    const result = assessReviewDueStatus({ cadence: 'annual', lastEvaluationCompletedAt: null });
    expect(result.status).toBe('never_evaluated');
    expect(result.dueDate).toBeNull();
    expect(result.daysOverdue).toBeNull();
  });

  it('OVERDUE CASE: an annual-cadence supplier last evaluated 400 days ago is overdue', () => {
    const asOf = new Date('2026-09-12T00:00:00Z');
    const last = new Date(asOf.getTime() - 400 * 24 * 60 * 60 * 1000).toISOString();
    const result = assessReviewDueStatus({ cadence: 'annual', lastEvaluationCompletedAt: last, asOfDate: asOf.toISOString() });
    expect(result.status).toBe('overdue');
    expect(result.daysOverdue).toBeGreaterThan(0);
  });

  it('BOUNDARY CASE: exactly on the due date (365 days for annual) is not yet overdue', () => {
    const last = '2025-09-12T00:00:00Z';
    const asOf = '2026-09-12T00:00:00Z'; // exactly 365 days later
    const result = assessReviewDueStatus({ cadence: 'annual', lastEvaluationCompletedAt: last, asOfDate: asOf });
    expect(result.status).not.toBe('overdue');
  });

  it('semi-annual cadence uses 182 days, not 365', () => {
    const last = '2026-01-01T00:00:00Z';
    const asOf = '2026-08-01T00:00:00Z'; // 212 days later -- overdue for semi-annual, not yet for annual
    const semiAnnual = assessReviewDueStatus({ cadence: 'semi_annual', lastEvaluationCompletedAt: last, asOfDate: asOf });
    const annual = assessReviewDueStatus({ cadence: 'annual', lastEvaluationCompletedAt: last, asOfDate: asOf });
    expect(semiAnnual.status).toBe('overdue');
    expect(annual.status).not.toBe('overdue');
  });

  it('due_soon fires within the disclosed 30-day default window before the due date', () => {
    const last = '2025-09-12T00:00:00Z';
    const asOf = '2026-08-20T00:00:00Z'; // 23 days before the annual due date
    const result = assessReviewDueStatus({ cadence: 'annual', lastEvaluationCompletedAt: last, asOfDate: asOf });
    expect(result.status).toBe('due_soon');
  });
});

// ---------------------------------------------------------------------------
// Evidence checklist
// ---------------------------------------------------------------------------
describe('buildEvidenceChecklist -- pulls from Module 06/07 as caller-supplied facts', () => {
  it('marks Module 06 and Module 07 items present/absent exactly per caller-supplied booleans, never fabricating data', () => {
    const checklist = buildEvidenceChecklist({ hasModule06CommercialData: true, hasModule07PerformanceData: false });
    const m06 = checklist.find((c) => c.category === 'commercial_module06');
    const m07 = checklist.find((c) => c.category === 'performance_module07');
    expect(m06?.present).toBe(true);
    expect(m07?.present).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Module 07 tension -- surfaced, never silently resolved
// ---------------------------------------------------------------------------
describe('checkRecoveryTension -- the good-score-plus-active-Module-07-escalation stress case', () => {
  it('CORE STRESS CASE: a clean periodic recommendation (continue_standard_cadence) coexisting with an active, escalated Module 07 record is flagged as a tension, not silently resolved either way', () => {
    const activeEscalation: Module07EscalationSnapshotLike = {
      recommendedIntervention: 'DUAL_SOURCE',
      escalated: true,
      combinedSignalFlag: false,
    };
    const result = checkRecoveryTension('continue_standard_cadence', activeEscalation);
    expect(result.tensionFlag).toBe(true);
    expect(result.tensionNoteEn).toMatch(/does not resolve that tension/);
    expect(result.tensionNoteAr.length).toBeGreaterThan(0);
  });

  it('no tension when there is no active Module 07 escalation', () => {
    const result = checkRecoveryTension('continue_standard_cadence', null);
    expect(result.tensionFlag).toBe(false);
    expect(result.tensionNoteEn).toBe('');
  });

  it('no separate tension flagged when the periodic review itself already recommends escalate_consider (the two signals already agree, nothing hidden)', () => {
    const activeEscalation: Module07EscalationSnapshotLike = {
      recommendedIntervention: 'REPLACE',
      escalated: true,
      combinedSignalFlag: true,
    };
    const result = checkRecoveryTension('escalate_consider', activeEscalation);
    expect(result.tensionFlag).toBe(false);
  });

  it('a combinedSignalFlag-only escalation (escalated=false) still counts as active for tension purposes', () => {
    const activeEscalation: Module07EscalationSnapshotLike = {
      recommendedIntervention: 'COLLABORATE',
      escalated: false,
      combinedSignalFlag: true,
    };
    const result = checkRecoveryTension('continue_standard_cadence', activeEscalation);
    expect(result.tensionFlag).toBe(true);
  });
});
