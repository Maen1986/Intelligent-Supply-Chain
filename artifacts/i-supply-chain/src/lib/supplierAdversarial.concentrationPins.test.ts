/**
 * Round C #668 (RC-6): mutation-driven pins for supplierConcentration -- exact arithmetic, validity rules and the
 * rendered EN/AR prompt text (so a silent wording or branch change is caught).
 */
import { describe, it, expect } from 'vitest';
import {
  computeShortfall, countUnresolvedEvidenceGaps, computeIntelligenceDebtUSD, computeHiddenConcentrationIndex,
  computeSupplierMetrics, testDimension, buildCommonModeFindingPrompt, buildSupplierMetricsPrompt,
  type ConcentrationSupplierInput,
} from './supplierConcentration';

const fact = (evidenceStage: string) => ({ evidenceStage }) as never;

describe('computeShortfall exact rules', () => {
  it('any missing / invalid duration is not assessable', () => {
    const none = { shortfallWeeks: null, isSurvivable: null };
    for (const [r, s] of [[null, 5], [5, null], [NaN, 3], [3, NaN], [-1, 3], [3, -1], [Infinity, 1], [1, Infinity]] as const) {
      expect(computeShortfall(r, s)).toEqual(none);
    }
  });
  it('survivable at equality and with zero durations; shortfall otherwise', () => {
    expect(computeShortfall(2, 2)).toEqual({ shortfallWeeks: null, isSurvivable: true });
    expect(computeShortfall(0, 0)).toEqual({ shortfallWeeks: null, isSurvivable: true });
    expect(computeShortfall(5, 2)).toEqual({ shortfallWeeks: 3, isSurvivable: false });
  });
});

describe('intelligence debt exact rules', () => {
  it('counts only facts below VALIDATED', () => {
    expect(countUnresolvedEvidenceGaps(['CLAIMED', 'DOCUMENTED', 'VALIDATED', 'OBSERVED', 'PROVEN'].map(fact))).toBe(2);
    expect(countUnresolvedEvidenceGaps([])).toBe(0);
  });
  it('multiplies, allows zero, rejects invalid / overflow', () => {
    expect(computeIntelligenceDebtUSD(3, 100)).toBe(300);
    expect(computeIntelligenceDebtUSD(0, 100)).toBe(0);
    expect(computeIntelligenceDebtUSD(3, 0)).toBe(0);
    for (const [n, c] of [[-1, 100], [3, -1], [NaN, 1], [1, NaN], [Infinity, 1], [3, null], [1e308, 10]] as const) {
      expect(computeIntelligenceDebtUSD(n, c)).toBeNull();
    }
  });
  it('hidden concentration index: share x unresolved ratio; empty facts echo the share', () => {
    expect(computeHiddenConcentrationIndex(40, [])).toBe(40);
    expect(computeHiddenConcentrationIndex(40, [fact('CLAIMED'), fact('PROVEN')])).toBe(20);
  });
});

describe('computeSupplierMetrics exact echo rules', () => {
  const base = { supplierId: 'S', lockIn: null, unresolvedEvidenceGapCount: 0, costPerUnresolvedGapUSD: null, capacityOrSpendSharePct: 50, subTierFacts: [] as never[] };
  it('echoes durations only when usable; invalid share is not assessable', () => {
    const bad = computeSupplierMetrics({ ...base, timeToRecoverWeeks: NaN, timeToSurviveWeeks: 4, capacityOrSpendSharePct: 101 });
    expect(bad.timeToRecoverWeeks).toBeNull();
    expect(bad.timeToSurviveWeeks).toBe(4);
    expect(bad.hiddenConcentrationIndex).toBeNull();
    const neg = computeSupplierMetrics({ ...base, timeToRecoverWeeks: -2, timeToSurviveWeeks: 4, capacityOrSpendSharePct: -1 });
    expect(neg.timeToRecoverWeeks).toBeNull();
    expect(neg.hiddenConcentrationIndex).toBeNull();
    const edge = computeSupplierMetrics({ ...base, timeToRecoverWeeks: 3, timeToSurviveWeeks: 6, capacityOrSpendSharePct: 100 });
    expect(edge).toMatchObject({ timeToRecoverWeeks: 3, timeToSurviveWeeks: 6, isSurvivable: true, hiddenConcentrationIndex: 100 });
    expect(computeSupplierMetrics({ ...base, timeToRecoverWeeks: 1, timeToSurviveWeeks: 1, capacityOrSpendSharePct: 0 }).hiddenConcentrationIndex).toBe(0);
  });
});

describe('testDimension grouping rules', () => {
  const sup = (id: string, share: number, value: string | null): ConcentrationSupplierInput => ({
    supplierId: id, name: id, capacityOrSpendSharePct: share,
    dependencyFacts: value === null ? {} : { subTier: { value, evidenceStage: 'CLAIMED' }, country: { value, evidenceStage: 'PROVEN' } },
  });
  it('no usable facts -> no findings; excluded: missing fact, NaN share, negative share', () => {
    expect(testDimension('subTier', [])).toEqual([]);
    expect(testDimension('subTier', [sup('a', 50, null), sup('b', NaN, 'X'), sup('c', -5, 'X')])).toEqual([]);
  });
  it('zero share is kept; hidden-concentration flag only for subTier with 2+ suppliers', () => {
    const f = testDimension('subTier', [sup('a', 0, 'X'), sup('b', 60, 'X'), sup('c', 40, 'Y')]);
    expect(f).toHaveLength(1);
    expect(f[0]).toMatchObject({ sharedValue: 'X', affectedSuppliers: ['a', 'b'], affectedSharePct: 60, isHiddenConcentration: true, evidenceStage: 'CLAIMED' });
    const g = testDimension('country', [sup('a', 50, 'X'), sup('b', 50, 'X')]);
    expect(g[0].isHiddenConcentration).toBe(false);
    expect(testDimension('subTier', [sup('a', 50, 'X'), sup('b', 50, 'Y')])).toEqual([]);
  });
});

describe('rendered prompt text is pinned (EN + AR)', () => {
  const finding = testDimension('subTier', [
    { supplierId: 'A', name: 'A', capacityOrSpendSharePct: 50, dependencyFacts: { subTier: { value: 'X', evidenceStage: 'CLAIMED' } } },
    { supplierId: 'B', name: 'B', capacityOrSpendSharePct: 30, dependencyFacts: { subTier: { value: 'X', evidenceStage: 'DOCUMENTED' } } },
  ])[0];
  const full = { ...finding, dimensionCoverageSharePct: 100 };
  const partial = { ...finding, dimensionCoverageSharePct: 80, flag: 'TRUE_DIVERSIFICATION' as const };
  it('common-mode finding EN', () => {
    expect(buildCommonModeFindingPrompt(finding, false)).toMatchInlineSnapshot(`
      "## Common-mode finding: sub-tier source
      2 suppliers, representing 80% of qualified capacity/spend, share: X.
      Concentration Index (HHI) = 6400 (highly concentrated).
      Flag: Apparent, not real, diversification.
      Supporting evidence stage: CLAIMED.
       This is hidden concentration at the sub-tier level (the "diamond structure" pattern) -- diversification appears real at the surface level while the actual source converges one tier down.
       This concentration score covers 80% of the candidate set -- the rest has no logged fact for this dimension yet, not confirmed diversification."
    `);
    expect(buildCommonModeFindingPrompt(full, false)).toMatchInlineSnapshot(`
      "## Common-mode finding: sub-tier source
      2 suppliers, representing 80% of qualified capacity/spend, share: X.
      Concentration Index (HHI) = 6400 (highly concentrated).
      Flag: Apparent, not real, diversification.
      Supporting evidence stage: CLAIMED.
       This is hidden concentration at the sub-tier level (the "diamond structure" pattern) -- diversification appears real at the surface level while the actual source converges one tier down."
    `);
    expect(buildCommonModeFindingPrompt(partial, false)).toMatchInlineSnapshot(`
      "## Common-mode finding: sub-tier source
      2 suppliers, representing 80% of qualified capacity/spend, share: X.
      Concentration Index (HHI) = 6400 (highly concentrated).
      Flag: True diversification.
      Supporting evidence stage: CLAIMED.
       This is hidden concentration at the sub-tier level (the "diamond structure" pattern) -- diversification appears real at the surface level while the actual source converges one tier down.
       This concentration score covers 80% of the candidate set -- the rest has no logged fact for this dimension yet, not confirmed diversification."
    `);
  });
  it('common-mode finding AR', () => {
    expect(buildCommonModeFindingPrompt(finding, true)).toMatchInlineSnapshot(`
      "## نتيجة اعتماد مشترك: مصدر الطبقة الفرعية
      2 موردين، يمثلون 80٪ من القدرة/الإنفاق المؤهل، يتشاركون في: X.
      مؤشر التركّز (HHI) = 6400 (مرتفع التركّز).
      التصنيف: تنويع ظاهري وليس فعلياً.
      درجة الأدلة الداعمة: CLAIMED.
       هذا تركّز خفي عند الطبقة الفرعية (نمط "البنية الماسية") -- يبدو التنويع ظاهرياً عند المستوى الأول بينما يتقارب المصدر الفعلي عند طبقة أدنى.
       تغطي درجة التركّز هذه 80٪ من المجموعة المرشحة -- الباقي لا يملك بيانات مسجّلة لهذا البُعد بعد، وهذا لا يعني تنويعاً مؤكداً."
    `);
    expect(buildCommonModeFindingPrompt(partial, true)).toMatchInlineSnapshot(`
      "## نتيجة اعتماد مشترك: مصدر الطبقة الفرعية
      2 موردين، يمثلون 80٪ من القدرة/الإنفاق المؤهل، يتشاركون في: X.
      مؤشر التركّز (HHI) = 6400 (مرتفع التركّز).
      التصنيف: تنويع فعلي.
      درجة الأدلة الداعمة: CLAIMED.
       هذا تركّز خفي عند الطبقة الفرعية (نمط "البنية الماسية") -- يبدو التنويع ظاهرياً عند المستوى الأول بينما يتقارب المصدر الفعلي عند طبقة أدنى.
       تغطي درجة التركّز هذه 80٪ من المجموعة المرشحة -- الباقي لا يملك بيانات مسجّلة لهذا البُعد بعد، وهذا لا يعني تنويعاً مؤكداً."
    `);
  });
  const m = (o: object) => ({ supplierId: 'S1', timeToRecoverWeeks: null, timeToSurviveWeeks: null, shortfallWeeks: null, isSurvivable: null, lockInIndex: null, intelligenceDebtUSD: null, hiddenConcentrationIndex: null, ...o });
  const variants = [m({}), m({ isSurvivable: true, lockInIndex: 3.14, intelligenceDebtUSD: 1234567, hiddenConcentrationIndex: 42.4 }), m({ isSurvivable: false, shortfallWeeks: 3 })];
  it('supplier metrics EN', () => {
    expect(buildSupplierMetricsPrompt(variants[0], false)).toMatchInlineSnapshot(`
      "## Dependency metrics: S1
      Time-to-Recover/Survive: insufficient data.
      Lock-In Index: not yet entered.
      Supplier Intelligence Debt: insufficient data (no per-gap cost set yet).
      Hidden Concentration (sub-tier) Index: insufficient data (supplier share missing or invalid)."
    `);
    expect(buildSupplierMetricsPrompt(variants[1], false)).toMatchInlineSnapshot(`
      "## Dependency metrics: S1
      Survivable: buffer/alternates fully cover the estimated recovery window.
      Lock-In Index: 3.1 of 5.
      Supplier Intelligence Debt: $1,234,567.
      Hidden Concentration (sub-tier) Index: 42%."
    `);
    expect(buildSupplierMetricsPrompt(variants[2], false)).toMatchInlineSnapshot(`
      "## Dependency metrics: S1
      3-week shortfall window between recovery time and survival time.
      Lock-In Index: not yet entered.
      Supplier Intelligence Debt: insufficient data (no per-gap cost set yet).
      Hidden Concentration (sub-tier) Index: insufficient data (supplier share missing or invalid)."
    `);
  });
  it('supplier metrics AR', () => {
    expect(buildSupplierMetricsPrompt(variants[0], true)).toMatchInlineSnapshot(`
      "## مقاييس الاعتمادية: S1
      وقت الاستعادة/البقاء: بيانات غير كافية.
      مؤشر الارتباط بالمورّد: لم يُدخل بعد.
      دين المعرفة عن المورّد: بيانات غير كافية (لم يُحدد تكلفة الفجوة الواحدة).
      مؤشر الإخفاء عند الطبقة الفرعية: بيانات غير كافية (حصة المورّد غير صالحة)."
    `);
    expect(buildSupplierMetricsPrompt(variants[1], true)).toMatchInlineSnapshot(`
      "## مقاييس الاعتمادية: S1
      قابل للاحتمال: المخزون/البدائل تغطي فترة الاستعادة المقدّرة بالكامل.
      مؤشر الارتباط بالمورّد: 3.1 من 5.
      دين المعرفة عن المورّد: 1,234,567 دولار.
      مؤشر الإخفاء عند الطبقة الفرعية: 42٪."
    `);
    expect(buildSupplierMetricsPrompt(variants[2], true)).toMatchInlineSnapshot(`
      "## مقاييس الاعتمادية: S1
      فجوة زمنية 3 أسابيع بين وقت الاستعادة ووقت البقاء.
      مؤشر الارتباط بالمورّد: لم يُدخل بعد.
      دين المعرفة عن المورّد: بيانات غير كافية (لم يُحدد تكلفة الفجوة الواحدة).
      مؤشر الإخفاء عند الطبقة الفرعية: بيانات غير كافية (حصة المورّد غير صالحة)."
    `);
  });
});
