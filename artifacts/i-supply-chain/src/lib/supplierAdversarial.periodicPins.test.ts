/**
 * Round C #668 (RC-4/RC-6) — exact-behaviour pins for supplierPeriodicEvaluation,
 * written from Stryker survivors (every assertion kills a named surviving mutant).
 */
import { describe, it, expect } from 'vitest';
import {
  rateCategoryScore,
  deriveOverallRecommendation,
  computeRecommendedEvaluationCadence,
  assessReviewDueStatus,
  buildEvidenceChecklist,
  checkRecoveryTension,
  type CategoryScoreResult,
} from './supplierPeriodicEvaluation';

const cat = (category: CategoryScoreResult['category'], score: number, rating: CategoryScoreResult['rating']): CategoryScoreResult => ({
  category, score, rating, dataSource: 'manual',
});

describe('rateCategoryScore non-numbers', () => {
  it('non-number and non-finite inputs read at_risk, never strong', () => {
    expect(rateCategoryScore(Infinity)).toBe('at_risk');
    expect(rateCategoryScore(NaN)).toBe('at_risk');
    expect(rateCategoryScore('99' as unknown as number)).toBe('at_risk');
    expect(rateCategoryScore(null as unknown as number)).toBe('at_risk');
    expect(rateCategoryScore(85)).toBe('strong');
    expect(rateCategoryScore(84.99)).toBe('acceptable');
  });
});

describe('deriveOverallRecommendation', () => {
  it('counts every rating exactly', () => {
    const r = deriveOverallRecommendation([
      cat('quality', 90, 'strong'), cat('delivery_otif', 90, 'strong'), cat('cost', 70, 'acceptable'),
      cat('compliance_esg' as never, 50, 'watch'), cat('service' as never, 10, 'at_risk'),
    ]);
    expect(r.ratingCounts).toEqual({ strong: 2, acceptable: 1, watch: 1, at_risk: 1 });
  });
  it('empty input: zero counts, null worst, continue, exact rationale', () => {
    const r = deriveOverallRecommendation([]);
    expect(r.ratingCounts).toEqual({ strong: 0, acceptable: 0, watch: 0, at_risk: 0 });
    expect(r.worstCategory).toBeNull();
    expect(r.overallRecommendation).toBe('continue_standard_cadence');
    expect(r.rationaleEn).toBe('All scored categories are acceptable or better -- continue on the standard recommended cadence.');
    expect(r.rationaleAr).toBe('جميع الفئات المُقيَّمة مقبولة أو أفضل -- الاستمرار وفق الدورة الموصى بها المعتادة.');
  });
  it('first worst category wins a tie (strictly greater replaces)', () => {
    const a = cat('quality', 30, 'at_risk');
    const b = cat('delivery_otif', 20, 'at_risk');
    expect(deriveOverallRecommendation([a, b]).worstCategory).toBe(a);
  });
  it('worse later category replaces an earlier milder one', () => {
    const a = cat('quality', 50, 'watch');
    const b = cat('delivery_otif', 20, 'at_risk');
    expect(deriveOverallRecommendation([a, b]).worstCategory).toBe(b);
  });
  it('at_risk and watch rationales name the category and score, EN and AR', () => {
    const ar = deriveOverallRecommendation([cat('quality', 30, 'at_risk')]);
    expect(ar.overallRecommendation).toBe('escalate_consider');
    expect(ar.rationaleEn).toBe('quality is rated at-risk (score 30) -- the weakest category, not an average, drives this result. Consider escalation per this review.');
    expect(ar.rationaleAr).toContain('فئة quality مصنَّفة معرَّضة للخطر (النتيجة 30)');
    const w = deriveOverallRecommendation([cat('quality', 50, 'watch')]);
    expect(w.overallRecommendation).toBe('monitor_closely');
    expect(w.rationaleEn).toBe('quality is rated watch (score 50) -- the weakest category drives this result. Monitor this category more closely before the next scheduled review.');
    expect(w.rationaleAr).toContain('فئة quality مصنَّفة تحت المراقبة (النتيجة 50)');
  });
});

describe('computeRecommendedEvaluationCadence', () => {
  it('regulated industry -> semi_annual with exact EN/AR prefixes', () => {
    const r = computeRecommendedEvaluationCadence({ kraljicQuadrant: 'strategic', declaredIndustry: 'oil-gas' });
    expect(r.recommendedCadence).toBe('semi_annual');
    expect(r.rationaleEn.startsWith('Semi-annual review recommended, reusing the same governance-tier signal: ')).toBe(true);
    expect(r.rationaleEn.endsWith(r.basis.rationaleEn)).toBe(true);
    expect(r.rationaleAr.startsWith('يُوصى بمراجعة نصف سنوية، بالاعتماد على نفس إشارة طبقة الحوكمة: ')).toBe(true);
    expect(r.rationaleAr.endsWith(r.basis.rationaleAr)).toBe(true);
  });
  it('missing input -> annual with exact EN/AR prefixes', () => {
    const r = computeRecommendedEvaluationCadence({});
    expect(r.recommendedCadence).toBe('annual');
    expect(r.rationaleEn.startsWith('Annual review recommended, reusing the same governance-tier signal: ')).toBe(true);
    expect(r.rationaleEn.endsWith(r.basis.rationaleEn)).toBe(true);
    expect(r.rationaleAr.startsWith('يُوصى بمراجعة سنوية، بالاعتماد على نفس إشارة طبقة الحوكمة: ')).toBe(true);
    expect(r.rationaleAr.endsWith(r.basis.rationaleAr)).toBe(true);
  });
});

describe('assessReviewDueStatus boundaries', () => {
  const base = { cadence: 'annual' as const, lastEvaluationCompletedAt: '2026-01-01T00:00:00.000Z' };
  it('exactly on the due-soon window edge is due_soon; one day further is not_yet_due', () => {
    // due 2027-01-01 (365 d). asOf 30 d before due => diff 30
    const edge = assessReviewDueStatus({ ...base, asOfDate: '2026-12-02T00:00:00.000Z' });
    expect(edge.status).toBe('due_soon');
    expect(edge.daysUntilDue).toBe(30);
    const out = assessReviewDueStatus({ ...base, asOfDate: '2026-12-01T00:00:00.000Z' });
    expect(out).toEqual({ status: 'not_yet_due', dueDate: '2027-01-01T00:00:00.000Z', daysUntilDue: 31, daysOverdue: null });
  });
  it('due today is due_soon with 0 days; one day late is overdue', () => {
    expect(assessReviewDueStatus({ ...base, asOfDate: '2027-01-01T00:00:00.000Z' }).status).toBe('due_soon');
    const late = assessReviewDueStatus({ ...base, asOfDate: '2027-01-02T00:00:00.000Z' });
    expect(late).toEqual({ status: 'overdue', dueDate: '2027-01-01T00:00:00.000Z', daysUntilDue: null, daysOverdue: 1 });
  });
  it('custom window and semi-annual cadence (182 d)', () => {
    const r = assessReviewDueStatus({ cadence: 'semi_annual', lastEvaluationCompletedAt: '2026-01-01T00:00:00.000Z', asOfDate: '2026-06-01T00:00:00.000Z', dueSoonWindowDays: 0 });
    expect(r.status).toBe('not_yet_due');
    expect(r.dueDate).toBe('2026-07-02T00:00:00.000Z');
  });
});

describe('buildEvidenceChecklist exact content', () => {
  it('three items, exact labels and flags', () => {
    expect(buildEvidenceChecklist({ hasModule06CommercialData: true, hasModule07PerformanceData: false })).toEqual([
      { category: 'commercial_module06', labelEn: 'Commercial intelligence (pricing/cost trend)', labelAr: 'الاستخبارات التجارية (اتجاه السعر/التكلفة)', present: true },
      { category: 'performance_module07', labelEn: 'Performance/recovery history (CARs, recurrence, escalation)', labelAr: 'سجل الأداء/التعافي (الإجراءات التصحيحية، التكرار، التصعيد)', present: false },
      { category: 'manual', labelEn: 'Client-supplied qualitative feedback', labelAr: 'ملاحظات نوعية مقدَّمة من العميل', present: false },
    ]);
  });
  it('manual item is never present even when both modules are', () => {
    const items = buildEvidenceChecklist({ hasModule06CommercialData: true, hasModule07PerformanceData: true });
    expect(items.map((i) => i.present)).toEqual([true, true, false]);
  });
});

describe('checkRecoveryTension', () => {
  const snap = (escalated: boolean, combinedSignalFlag: boolean) => ({ recommendedIntervention: 'x', escalated, combinedSignalFlag });
  it('no escalation signal -> no tension, empty notes', () => {
    expect(checkRecoveryTension('continue_standard_cadence', snap(false, false))).toEqual({ tensionFlag: false, tensionNoteEn: '', tensionNoteAr: '' });
    expect(checkRecoveryTension('continue_standard_cadence', null)).toEqual({ tensionFlag: false, tensionNoteEn: '', tensionNoteAr: '' });
  });
  it('either signal alone raises tension with non-empty bilingual notes', () => {
    for (const s of [snap(true, false), snap(false, true)]) {
      const r = checkRecoveryTension('continue_standard_cadence', s);
      expect(r.tensionFlag).toBe(true);
      expect(r.tensionNoteEn.startsWith('Tension: this periodic review recommends continuing')).toBe(true);
      expect(r.tensionNoteAr.startsWith('تعارض: توصي هذه المراجعة الدورية')).toBe(true);
    }
  });
  it('no tension when the review already recommends monitoring or escalation', () => {
    expect(checkRecoveryTension('monitor_closely', snap(true, true)).tensionFlag).toBe(false);
    expect(checkRecoveryTension('escalate_consider', snap(true, true)).tensionNoteAr).toBe('');
  });
});
