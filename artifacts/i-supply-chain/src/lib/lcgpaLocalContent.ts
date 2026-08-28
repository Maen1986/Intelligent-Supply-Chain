/**
 * LCGPA Readiness Self-Check (#373) + Tender Eligibility Triage (#374),
 * 28 Aug 2026 -- directional, non-certified Local Content baseline calculator
 * and sector-threshold triage.
 *
 * Design note (per the closing research pass, lcgpa-373-374-research-draft.md,
 * 25 Aug 2026): the original framing assumed the four LCGPA pillars (Goods &
 * Services, Labor, Capacity Building, Depreciation & Amortization) are each
 * scored separately and then combined with pillar-to-pillar percentage
 * weights. That is not how LCGPA's own official Guide G1 baseline score
 * actually works -- it is a single ratio: (sum of each pillar's
 * locally-eligible spend) / (sum of each pillar's total spend). There is no
 * separate "pillar weight" -- the pillars are summed together first, not
 * weighted against each other. This file implements that real formula, not
 * the originally-assumed weighted-average structure.
 *
 * Real, sourced pillar eligibility rules (LCGPA Guide G1, Version 5.0,
 * 15 Nov 2022):
 *   - Labor: Saudi employee compensation = 100% eligible. Expatriate employee
 *     compensation = 37% eligible (a specific number from the official guide,
 *     not estimated).
 *   - Goods & Services: in-Kingdom spend on goods/services = 100% eligible;
 *     foreign spend = 0%.
 *   - Capacity Building: Saudi training + in-Kingdom supplier development +
 *     in-Kingdom R&D spend = 100% eligible (no partial-eligibility split like
 *     Labor's 37% rule).
 *   - Depreciation & Amortization: depreciation value of in-Kingdom-based
 *     productive assets = 100% eligible; the rest = 0%.
 *
 * Real, sourced sector benchmarks (two dated, primary-source examples --
 * NOT a universal fixed number; the exact threshold for any given tender is
 * set by the individual procuring entity within LCGPA's framework):
 *   - Hard Facility Management (illustrative, from MATARAT's own Dec 2024
 *     contract terms): minimum Target Local Content Score = 39%, gating at
 *     the technical stage.
 *   - Management Consulting (LCGPA/SPA official announcement, 17 Apr 2026):
 *     minimum 30% company-level local content, phased in -- effective
 *     1 Apr 2027 for tenders >=SAR10M, expanding to >=SAR5M from 1 Jan 2028.
 *   - IT Services (same LCGPA/SPA announcement): local content weighted in
 *     financial evaluation from 1 Apr 2027 for tenders >=SAR10M -- a
 *     weighting factor, not a pass/fail minimum.
 *
 * Severity/verdict logic here is a fixed, disclosed rule applied to
 * self-reported figures -- never an AI-invented score (Decision Record 8.7:
 * no fabricated numbers that could mislead a client on a real bid decision).
 * Both the baseline score and the triage verdict are explicitly labeled
 * directional and self-reported, not a certified LCGPA score -- same honesty
 * framing as every other self-declared input on the platform.
 */

export interface LocalContentInputs {
  /** Labor -- SAR, annual. */
  saudiCompensationSAR: number | null;
  expatCompensationSAR: number | null;
  /** Goods & Services -- SAR, annual. */
  localGoodsServicesSpendSAR: number | null;
  foreignGoodsServicesSpendSAR: number | null;
  /** Capacity Building -- SAR, annual (training + supplier development + R&D, in-Kingdom). */
  capacityBuildingSpendSAR: number | null;
  /** Depreciation & Amortization -- SAR, annual. */
  inKingdomAssetDepreciationSAR: number | null;
  totalAssetDepreciationSAR: number | null;
}

export function emptyLocalContentInputs(): LocalContentInputs {
  return {
    saudiCompensationSAR: null,
    expatCompensationSAR: null,
    localGoodsServicesSpendSAR: null,
    foreignGoodsServicesSpendSAR: null,
    capacityBuildingSpendSAR: null,
    inKingdomAssetDepreciationSAR: null,
    totalAssetDepreciationSAR: null,
  };
}

export const EXPAT_LABOR_ELIGIBILITY = 0.37;

export interface PillarBreakdown {
  key: 'labor' | 'goodsServices' | 'capacityBuilding' | 'depreciation';
  eligible: number;
  total: number;
}

export interface BaselineResult {
  /** True once at least one pillar has any figure entered. */
  hasAnyInput: boolean;
  /** Sum of locally-eligible spend across all 4 pillars. */
  totalEligible: number;
  /** Sum of total spend across all 4 pillars. */
  totalSpend: number;
  /** totalEligible / totalSpend, as a 0-100 percentage. Null if totalSpend is 0. */
  baselineScorePct: number | null;
  pillars: PillarBreakdown[];
}

function n(v: number | null): number {
  return v === null || Number.isNaN(v) || v < 0 ? 0 : v;
}

export function computeBaselineScore(inputs: LocalContentInputs): BaselineResult {
  const hasAnyInput = Object.values(inputs).some(v => v !== null && v !== 0);

  const labor: PillarBreakdown = {
    key: 'labor',
    eligible: n(inputs.saudiCompensationSAR) * 1.0 + n(inputs.expatCompensationSAR) * EXPAT_LABOR_ELIGIBILITY,
    total: n(inputs.saudiCompensationSAR) + n(inputs.expatCompensationSAR),
  };
  const goodsServices: PillarBreakdown = {
    key: 'goodsServices',
    eligible: n(inputs.localGoodsServicesSpendSAR),
    total: n(inputs.localGoodsServicesSpendSAR) + n(inputs.foreignGoodsServicesSpendSAR),
  };
  const capacityBuilding: PillarBreakdown = {
    key: 'capacityBuilding',
    eligible: n(inputs.capacityBuildingSpendSAR),
    total: n(inputs.capacityBuildingSpendSAR),
  };
  const depreciation: PillarBreakdown = {
    key: 'depreciation',
    eligible: n(inputs.inKingdomAssetDepreciationSAR),
    total: n(inputs.totalAssetDepreciationSAR),
  };

  const pillars = [labor, goodsServices, capacityBuilding, depreciation];
  const totalEligible = pillars.reduce((s, p) => s + p.eligible, 0);
  const totalSpend = pillars.reduce((s, p) => s + p.total, 0);

  return {
    hasAnyInput,
    totalEligible,
    totalSpend,
    baselineScorePct: totalSpend > 0 ? (totalEligible / totalSpend) * 100 : null,
    pillars,
  };
}

export type Sector = 'hardFM' | 'consulting' | 'itServices' | 'other';

export interface SectorBenchmark {
  sector: Sector;
  /** Whether a sourced minimum threshold applies (gates the bid) vs. only a financial-evaluation weighting. */
  kind: 'minimum' | 'weightingOnly' | 'unsourced';
  /** The sourced threshold percentage, if any. */
  thresholdPct: number | null;
  /** Whether the sourced rule is already in effect as of `todayISO`, given its phased effective date and the tender value. */
  inEffect: boolean | null;
  effectiveDateISO: string | null;
  minTenderValueSAR: number | null;
  sourceNoteEn: string;
  sourceNoteAr: string;
}

/**
 * Real, dated phase-in rule for Management Consulting tenders (LCGPA/SPA,
 * 17 Apr 2026 announcement): 30% minimum, effective 1 Apr 2027 for tenders
 * >=SAR10M, expanding to >=SAR5M from 1 Jan 2028.
 */
function consultingBenchmark(tenderValueSAR: number | null, todayISO: string): SectorBenchmark {
  const today = new Date(todayISO);
  const phase1 = new Date('2027-04-01');
  const phase2 = new Date('2028-01-01');
  const value = tenderValueSAR ?? 0;

  let inEffect: boolean | null = null;
  let effectiveDateISO: string | null = '2027-04-01';
  let minTenderValueSAR: number | null = 10_000_000;

  if (tenderValueSAR === null) {
    inEffect = null; // can't determine without a tender value
  } else if (value >= 10_000_000) {
    inEffect = today >= phase1;
    effectiveDateISO = '2027-04-01';
    minTenderValueSAR = 10_000_000;
  } else if (value >= 5_000_000) {
    inEffect = today >= phase2;
    effectiveDateISO = '2028-01-01';
    minTenderValueSAR = 5_000_000;
  } else {
    inEffect = false; // below the SAR5M floor -- no sourced rule covers it yet
    effectiveDateISO = '2028-01-01';
    minTenderValueSAR = 5_000_000;
  }

  return {
    sector: 'consulting',
    kind: 'minimum',
    thresholdPct: 30,
    inEffect,
    effectiveDateISO,
    minTenderValueSAR,
    sourceNoteEn: 'LCGPA/SPA official announcement, 17 Apr 2026: 30% minimum company-level local content for Management Consulting, phased in -- effective 1 Apr 2027 for tenders >=SAR10M, expanding to >=SAR5M from 1 Jan 2028.',
    sourceNoteAr: 'إعلان رسمي من هيئة المحتوى المحلي والمشتريات الحكومية / وكالة الأنباء السعودية، ١٧ أبريل ٢٠٢٦: حد أدنى ٣٠٪ للمحتوى المحلي على مستوى الشركة لعقود الاستشارات الإدارية، بتطبيق تدريجي -- ساري من ١ أبريل ٢٠٢٧ للمناقصات ≥١٠ مليون ريال، ويتوسع ليشمل ≥٥ مليون ريال من ١ يناير ٢٠٢٨.',
  };
}

/**
 * Real, dated rule for IT Services tenders (same LCGPA/SPA 17 Apr 2026
 * announcement): weighted in financial evaluation from 1 Apr 2027 for
 * tenders >=SAR10M -- a weighting factor, not a pass/fail minimum.
 */
function itServicesBenchmark(tenderValueSAR: number | null, todayISO: string): SectorBenchmark {
  const today = new Date(todayISO);
  const effective = new Date('2027-04-01');
  const value = tenderValueSAR ?? 0;
  const meetsValueFloor = tenderValueSAR === null ? null : value >= 10_000_000;
  const inEffect = meetsValueFloor === null ? null : meetsValueFloor && today >= effective;

  return {
    sector: 'itServices',
    kind: 'weightingOnly',
    thresholdPct: null,
    inEffect,
    effectiveDateISO: '2027-04-01',
    minTenderValueSAR: 10_000_000,
    sourceNoteEn: 'LCGPA/SPA official announcement, 17 Apr 2026: for IT Services, local content is weighted in financial evaluation from 1 Apr 2027 for tenders >=SAR10M -- no minimum-threshold requirement, weighting only.',
    sourceNoteAr: 'إعلان رسمي من هيئة المحتوى المحلي والمشتريات الحكومية / وكالة الأنباء السعودية، ١٧ أبريل ٢٠٢٦: بالنسبة لخدمات تقنية المعلومات، يُدرَج المحتوى المحلي كعامل ترجيح في التقييم المالي اعتباراً من ١ أبريل ٢٠٢٧ للمناقصات ≥١٠ مليون ريال -- ترجيح فقط، دون حد أدنى إلزامي.',
  };
}

/**
 * Illustrative benchmark from a real, dated, live contract-governance
 * document (MATARAT -- Saudi Civil Aviation Holding Company, "Local Content
 * Terms & Conditions," Rev 1.2, Dec 2024): for Hard Facility Management
 * specifically, minimum Target Local Content Score = 39%, gating at the
 * technical stage. Presented as one procuring entity's real, current
 * practice -- not a universal rule for the whole sector.
 */
function hardFMBenchmark(): SectorBenchmark {
  return {
    sector: 'hardFM',
    kind: 'minimum',
    thresholdPct: 39,
    inEffect: true,
    effectiveDateISO: null,
    minTenderValueSAR: 50_000_000,
    sourceNoteEn: "MATARAT (Saudi Civil Aviation Holding Company), Local Content Terms & Conditions Rev 1.2, Dec 2024: for service/mixed contracts >=SAR50M, Hard Facility Management carries a minimum Target Local Content Score of 39%, gating at the technical stage. This is one procuring entity's own stated practice, not a universal sector rule -- treat as an illustrative benchmark and confirm your specific tender's stated requirement.",
    sourceNoteAr: "شركة مطارات (شركة قابضة لمرافق الطيران المدني السعودية)، شروط وأحكام المحتوى المحلي، الإصدار ١.٢، ديسمبر ٢٠٢٤: للعقود الخدمية/المختلطة بقيمة ≥٥٠ مليون ريال، تشترط إدارة المرافق الشاملة حداً أدنى لدرجة المحتوى المحلي المستهدفة ٣٩٪، وتُستبعد العروض دون ذلك في المرحلة الفنية. هذه ممارسة معلنة لجهة شراء واحدة وليست قاعدة قطاعية عامة -- استخدمها كمعيار توضيحي وتأكد من المتطلب المحدد في مناقصتك.",
  };
}

export function getSectorBenchmark(sector: Sector, tenderValueSAR: number | null, todayISO: string = new Date().toISOString()): SectorBenchmark {
  if (sector === 'hardFM') return hardFMBenchmark();
  if (sector === 'consulting') return consultingBenchmark(tenderValueSAR, todayISO);
  if (sector === 'itServices') return itServicesBenchmark(tenderValueSAR, todayISO);
  return {
    sector: 'other',
    kind: 'unsourced',
    thresholdPct: null,
    inEffect: null,
    effectiveDateISO: null,
    minTenderValueSAR: null,
    sourceNoteEn: 'No sourced sector-specific LCGPA threshold has been verified for this sector yet. Enter your tender\'s own stated local-content requirement below if you have it.',
    sourceNoteAr: 'لم يتم التحقق من حد أدنى قطاعي مُوثّق لهذا القطاع بعد. أدخل متطلب المحتوى المحلي المذكور في مناقصتك أدناه إن كان متوفراً.',
  };
}

export type TriageVerdict = 'clears' | 'gap' | 'weightingOnly' | 'notYetInEffect' | 'noBenchmark' | 'incomplete';

export interface TriageResult {
  verdict: TriageVerdict;
  /** The threshold actually used -- the client's own entered figure takes priority over the sourced sector benchmark. */
  effectiveThresholdPct: number | null;
  gapPct: number | null;
  reasonEn: string;
  reasonAr: string;
}

export function triage(
  baseline: BaselineResult,
  benchmark: SectorBenchmark,
  customThresholdPct: number | null,
): TriageResult {
  if (baseline.baselineScorePct === null) {
    return {
      verdict: 'incomplete',
      effectiveThresholdPct: null,
      gapPct: null,
      reasonEn: 'Complete the Readiness Self-Check above to see a triage read.',
      reasonAr: 'أكمل فحص الجاهزية أعلاه لعرض نتيجة الفرز.',
    };
  }

  const threshold = customThresholdPct !== null ? customThresholdPct : benchmark.thresholdPct;

  if (benchmark.kind === 'weightingOnly' && customThresholdPct === null) {
    return {
      verdict: 'weightingOnly',
      effectiveThresholdPct: null,
      gapPct: null,
      reasonEn: `No pass/fail minimum applies for this sourced benchmark -- local content is weighted in the financial evaluation instead. Your baseline score (${baseline.baselineScorePct.toFixed(1)}%) is the figure that would feed that weighting.`,
      reasonAr: `لا يوجد حد أدنى إلزامي وفق هذا المعيار الموثّق -- يُستخدم المحتوى المحلي كعامل ترجيح في التقييم المالي بدلاً من ذلك. درجتك الأساسية (${baseline.baselineScorePct.toFixed(1)}٪) هي الرقم الذي سيُستخدم في هذا الترجيح.`,
    };
  }

  if (threshold === null) {
    return {
      verdict: 'noBenchmark',
      effectiveThresholdPct: null,
      gapPct: null,
      reasonEn: 'No sourced or entered threshold is available to triage against yet.',
      reasonAr: 'لا يوجد حد مرجعي موثّق أو مُدخل بعد لإجراء الفرز مقابله.',
    };
  }

  if (benchmark.kind === 'minimum' && benchmark.inEffect === false && customThresholdPct === null) {
    return {
      verdict: 'notYetInEffect',
      effectiveThresholdPct: threshold,
      gapPct: null,
      reasonEn: `This sourced ${threshold}% minimum is not yet in effect for a tender of this value as of today (${benchmark.effectiveDateISO ? `takes effect ${benchmark.effectiveDateISO}` : 'phase-in date not yet reached'}). Shown for planning ahead, not a current gate.`,
      reasonAr: `الحد الأدنى الموثّق ${threshold}٪ لم يدخل حيز التنفيذ بعد لمناقصة بهذه القيمة حتى تاريخ اليوم (${benchmark.effectiveDateISO ? `يسري اعتباراً من ${benchmark.effectiveDateISO}` : 'لم يحن موعد التطبيق التدريجي بعد'}). يُعرض لأغراض التخطيط المسبق فقط، وليس كحاجز حالي.`,
    };
  }

  const gapPct = threshold - baseline.baselineScorePct;

  if (gapPct <= 0) {
    return {
      verdict: 'clears',
      effectiveThresholdPct: threshold,
      gapPct: 0,
      reasonEn: `Your directional baseline score (${baseline.baselineScorePct.toFixed(1)}%) clears the ${threshold}% threshold.`,
      reasonAr: `درجتك الأساسية التوجيهية (${baseline.baselineScorePct.toFixed(1)}٪) تفوق الحد المرجعي ${threshold}٪.`,
    };
  }

  return {
    verdict: 'gap',
    effectiveThresholdPct: threshold,
    gapPct,
    reasonEn: `Your directional baseline score (${baseline.baselineScorePct.toFixed(1)}%) is below the ${threshold}% threshold by ${gapPct.toFixed(1)} points.`,
    reasonAr: `درجتك الأساسية التوجيهية (${baseline.baselineScorePct.toFixed(1)}٪) أقل من الحد المرجعي ${threshold}٪ بفارق ${gapPct.toFixed(1)} نقطة.`,
  };
}

export function buildLcgpaPrompt(baseline: BaselineResult, benchmark: SectorBenchmark, triageResult: TriageResult, isAr: boolean): string {
  const header = isAr ? '## جاهزية المحتوى المحلي (LCGPA)' : '## LCGPA Local Content Readiness';
  const scoreLine = baseline.baselineScorePct !== null
    ? (isAr ? `الدرجة الأساسية التوجيهية: ${baseline.baselineScorePct.toFixed(1)}٪` : `Directional baseline score: ${baseline.baselineScorePct.toFixed(1)}%`)
    : (isAr ? 'لم تُدخل بيانات كافية بعد' : 'Not enough data entered yet');

  const lines = [
    header,
    '',
    scoreLine,
    isAr ? triageResult.reasonAr : triageResult.reasonEn,
    '',
    isAr ? benchmark.sourceNoteAr : benchmark.sourceNoteEn,
    '',
    isAr
      ? 'اقترح خطوات عملية محددة لتحسين درجة المحتوى المحلي، مستندة إلى الأرقام أعلاه فقط -- لا تفترض بيانات غير مُدخلة.'
      : 'Suggest specific, practical steps to improve the local-content score, grounded only in the figures above -- do not assume data that was not entered.',
  ].filter(Boolean);

  return lines.join('\n');
}
