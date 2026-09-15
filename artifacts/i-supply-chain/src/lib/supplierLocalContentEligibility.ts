/**
 * Supplier Intelligence Module 08 — Local Content / ICV Eligibility
 * (SI-08, 15 Sep 2026).
 *
 * Extends the pre-existing LCGPA Readiness Self-Check (#373/#374,
 * lcgpaLocalContent.ts, 28 Aug 2026) from a single-country, client-own-spend
 * self-check into a real, multi-country, multi-mechanism SUPPLIER-fact
 * engine that plugs into the rest of the SI engine (Kraljic, qualification,
 * concentration) the way every other SI module does. lcgpaLocalContent.ts
 * and its page (LCGPAReadinessCheck.tsx) remain live and unchanged -- this
 * module is a standalone, separately-tested sibling (standalone-first
 * architecture: no runtime import from lcgpaLocalContent.ts or any other SI
 * module), not a replacement.
 *
 * ============================================================================
 * WHY THIS IS MULTI-COUNTRY, MULTI-MECHANISM, AND GOVERNMENT/PRIVATE-AWARE
 * ============================================================================
 * A 15 Sep 2026 research pass (real web sourcing, not training-data recall)
 * found that "local content" is not one regional concept with country
 * variants -- it is several genuinely different regulatory mechanisms:
 *
 *   - Saudi Arabia (LCGPA): a certified PERCENTAGE SCORE = locally-eligible
 *     spend / total spend across 4 pillars (same real Guide G1 formula as
 *     lcgpaLocalContent.ts). Legally anchored in GOVERNMENT procurement,
 *     extended June 2022 to entities >=50% state-owned. No sourced evidence
 *     it governs pure private-to-private commercial contracts.
 *   - UAE (ICV, MoIAT -- now unified with ADNOC's original program): a
 *     certified WEIGHTED MULTI-PILLAR SCORE (manufacturing/third-party
 *     spend + investment + Emiratisation + expatriate contribution + capped
 *     bonus categories), requiring a MoIAT-authorized audit for a real
 *     certificate. Framed around public spending and "Program Partner"
 *     (government/semi-government) tenders -- no sourced evidence of a
 *     private-to-private mandate.
 *   - Jordan: NOT a scored certificate at all -- a 20% PRICE PREFERENCE
 *     MARGIN for locally-manufactured products in PUBLIC TENDERS only
 *     (Cabinet-approved, per Petra/Jordan News Agency reporting Minister of
 *     Industry, Trade & Supply Yarub Qudah's announcement). This adjusts BID
 *     EVALUATION, not a company's own local-content percentage -- a
 *     genuinely different mechanism type from LCGPA/ICV.
 *   - Oman, Qatar, Bahrain, Kuwait: real named programs exist (Oman runs its
 *     own separate "ICV" program; Qatar Cabinet-approved a National Local
 *     Content Strategy) but this research pass could not source an exact
 *     formula or weighting to the same rigor. Per Decision Record 8.7 these
 *     return an explicit `not-yet-sourced` state -- never a guessed formula.
 *
 * Two disclosed sourcing caveats, stated plainly rather than smoothed over:
 *   1. The UAE ICV master-formula figures below were extracted from an
 *      AI-summarized read of MoIAT's own published supplier certification
 *      guidelines PDF, not a byte-verified manual transcription. Treat the
 *      output here as a directional, best-available-public-sourcing
 *      reconstruction -- verify against the primary MoIAT document before
 *      using this for an actual certification-adjacent decision.
 *   2. Jordan's exact governing bylaw/regulation number was not identified
 *      in available sourcing (only the Cabinet decision and the 20% figure,
 *      reported by Jordan's official state news agency). The mechanism and
 *      figure are real and sourced; the precise legal citation is not.
 *
 * ============================================================================
 * WHY BOTH SUPPLIER-LEVEL AND PORTFOLIO-LEVEL (per Maen's own "why not both")
 * ============================================================================
 * Every other SI module (02 Kraljic, 04 Qualification, 05 Concentration) is
 * a supplier-level fact that a caller can also roll up to portfolio level.
 * `assessSupplierLocalContent()` below produces a per-supplier fact, usable
 * directly inside Kraljic/qualification/concentration; `rollUpPortfolioLocalContent()`
 * aggregates a set of those facts into a client-level tender-eligibility view,
 * mirroring Module 05's HHI rollup pattern -- weighted by spend share,
 * grouped by mechanism type (never averaged across incompatible mechanisms;
 * see Core Instruction #7 / Decision Record 8.7: never collapse a
 * multi-dimensional assessment into one fabricated composite).
 *
 * Sourced methodology (Core Instruction #2): every pillar rule below cites
 * its real source inline. Never Fabricate (#1 / Decision Record 8.7): a
 * country/context combination with no sourced formula returns
 * `not-yet-sourced`, never a guessed number; a country's regime that does
 * not cover private-commercial procurement returns `not-applicable`, never
 * a misleading zero.
 */

// ---------------------------------------------------------------------------
// Section 1 — country / context / mechanism taxonomy
// ---------------------------------------------------------------------------

export type LocalContentCountry = 'SA' | 'AE' | 'JO' | 'OM' | 'QA' | 'BH' | 'KW';

/** Which buyer this assessment is for -- see file header: every sourced
 * regime found is anchored in government/SOE-linked procurement. */
export type ProcurementContext = 'government' | 'semi-government-soe' | 'private-commercial';

export type LocalContentMechanismType =
  | 'eligible-spend-ratio'      // Saudi LCGPA
  | 'weighted-pillar-score'     // UAE ICV
  | 'price-preference-margin'   // Jordan
  | 'not-yet-sourced';          // Oman / Qatar / Bahrain / Kuwait

export interface CountryFrameworkInfo {
  country: LocalContentCountry;
  countryNameEn: string;
  countryNameAr: string;
  programNameEn: string;
  programNameAr: string;
  mechanismType: LocalContentMechanismType;
  /** Buyer contexts this research pass found real sourced evidence for. */
  applicableContexts: ProcurementContext[];
  sourceNoteEn: string;
  sourceNoteAr: string;
}

export const COUNTRY_FRAMEWORKS: Record<LocalContentCountry, CountryFrameworkInfo> = {
  SA: {
    country: 'SA', countryNameEn: 'Saudi Arabia', countryNameAr: 'المملكة العربية السعودية',
    programNameEn: 'LCGPA Local Content', programNameAr: 'المحتوى المحلي (هيئة المحتوى المحلي والمشتريات الحكومية)',
    mechanismType: 'eligible-spend-ratio',
    applicableContexts: ['government', 'semi-government-soe'],
    sourceNoteEn: 'LCGPA Guide G1 (Version 5.0, 15 Nov 2022): baseline score = locally-eligible spend / total spend across 4 pillars. Government procurement is directly covered; extended June 2022 to entities >=50% state-owned. No sourced evidence this governs private-to-private commercial contracts.',
    sourceNoteAr: 'دليل هيئة المحتوى المحلي والمشتريات الحكومية G1 (الإصدار ٥.٠، ١٥ نوفمبر ٢٠٢٢): الدرجة الأساسية = الإنفاق المؤهل محلياً ÷ إجمالي الإنفاق عبر أربعة أركان. تشمل مباشرة المشتريات الحكومية، ووُسِّع نطاقها في يونيو ٢٠٢٢ ليغطي الجهات المملوكة للدولة بنسبة ٥٠٪ فأكثر. لا يوجد دليل موثّق على سريانها على العقود التجارية بين القطاع الخاص فقط.',
  },
  AE: {
    country: 'AE', countryNameEn: 'United Arab Emirates', countryNameAr: 'دولة الإمارات العربية المتحدة',
    programNameEn: 'National In-Country Value (ICV)', programNameAr: 'برنامج القيمة الوطنية المضافة (ICV)',
    mechanismType: 'weighted-pillar-score',
    applicableContexts: ['government', 'semi-government-soe'],
    sourceNoteEn: "MoIAT National ICV Program (unified with ADNOC's original ICV program): certified weighted score across Manufacturing/Third-Party Spend, Investment, Emiratisation, Expatriate Contribution, and capped bonus categories, audited by a MoIAT-authorized firm, 14-month validity. Framed around public spending and \"Program Partner\" (government/semi-government) tenders -- no sourced evidence of a private-to-private mandate. Formula figures below are a best-available reconstruction from public secondary sourcing of the official guideline document, not a byte-verified transcription -- verify against the primary MoIAT document before relying on this for a real certification decision.",
    sourceNoteAr: 'برنامج القيمة الوطنية المضافة الوطني التابع لوزارة الصناعة والتقنية المتقدمة (موحّد الآن مع برنامج أدنوك الأصلي): درجة مرجحة معتمدة عبر التصنيع/إنفاق الطرف الثالث، الاستثمار، التوطين، مساهمة العمالة الوافدة، وفئات مكافآت محدودة السقف، يدققها مكتب معتمد من الوزارة، وصلاحية ١٤ شهراً. يتمحور حول الإنفاق العام ومناقصات "شركاء البرنامج" (الحكومة وشبه الحكومة) -- لا يوجد دليل موثّق على إلزاميته بين القطاع الخاص فقط. أرقام الصيغة أدناه إعادة بناء اعتماداً على أفضل مصادر ثانوية متاحة للدليل الرسمي، وليست نسخاً حرفياً موثقاً -- يُنصح بالتحقق من الوثيقة الأصلية للوزارة قبل الاعتماد عليها في قرار تصديق فعلي.',
  },
  JO: {
    country: 'JO', countryNameEn: 'Jordan', countryNameAr: 'المملكة الأردنية الهاشمية',
    programNameEn: 'National Industry Price Preference', programNameAr: 'تفضيل السعر للصناعة الوطنية',
    mechanismType: 'price-preference-margin',
    applicableContexts: ['government'],
    sourceNoteEn: "Cabinet-approved 20% price preference for locally-manufactured products in public tenders, announced by Jordan's Minister of Industry, Trade & Supply (per Petra, Jordan's official state news agency). This adjusts bid evaluation (a price handicap favoring local bidders), not a company's own local-content percentage -- a different mechanism from LCGPA/ICV. The precise governing bylaw/regulation number was not identified in available sourcing; the mechanism and 20% figure are real and sourced, the exact legal citation is not.",
    sourceNoteAr: 'تفضيل سعري بنسبة ٢٠٪ للمنتجات المصنّعة محلياً في المناقصات الحكومية، أقرّه مجلس الوزراء وأعلنه وزير الصناعة والتجارة والتموين الأردني (بحسب وكالة الأنباء الأردنية الرسمية "بترا"). يُطبَّق هذا التفضيل على تقييم العطاءات (خصم سعري لصالح المورّدين المحليين)، وليس كنسبة محتوى محلي خاصة بالشركة -- آلية مختلفة عن LCGPA/ICV. لم يتم تحديد رقم النظام أو التشريع الدقيق ضمن المصادر المتاحة؛ الآلية والنسبة ٢٠٪ موثّقتان، أما الاستشهاد القانوني الدقيق فغير مؤكد.',
  },
  OM: {
    country: 'OM', countryNameEn: 'Oman', countryNameAr: 'سلطنة عُمان',
    programNameEn: 'In-Country Value (ICV) -- not yet sourced', programNameAr: 'القيمة المحلية (ICV) — غير موثّقة بعد',
    mechanismType: 'not-yet-sourced',
    applicableContexts: [],
    sourceNoteEn: "Oman runs its own separate ICV program (distinct from the UAE's, historically anchored in oil & gas / large-JV procurement). This research pass could not confirm an exact pillar formula or weighting to the same rigor as SA/AE/JO -- deliberately not guessed.",
    sourceNoteAr: 'تدير عُمان برنامج قيمة محلية (ICV) خاصاً بها (مختلف عن برنامج الإمارات، وتاريخياً مرتبط بقطاع النفط والغاز والمشاريع المشتركة الكبرى). لم يتمكن هذا البحث من تأكيد صيغة أركان دقيقة أو أوزان بنفس دقة السعودية والإمارات والأردن -- ولم يتم تخمينها عمداً.',
  },
  QA: {
    country: 'QA', countryNameEn: 'Qatar', countryNameAr: 'دولة قطر',
    programNameEn: 'National Local Content Strategy -- not yet sourced', programNameAr: 'الاستراتيجية الوطنية للمحتوى المحلي — غير موثّقة بعد',
    mechanismType: 'not-yet-sourced',
    applicableContexts: [],
    sourceNoteEn: "Qatar's Cabinet approved a National Local Content Strategy recently -- too new for a public formula to be sourced as of this research pass. Deliberately not guessed.",
    sourceNoteAr: 'أقرّ مجلس وزراء دولة قطر مؤخراً استراتيجية وطنية للمحتوى المحلي -- لا تزال حديثة العهد بحيث لم تُنشر صيغة حساب علنية حتى وقت هذا البحث. لم يتم تخمينها عمداً.',
  },
  BH: {
    country: 'BH', countryNameEn: 'Bahrain', countryNameAr: 'مملكة البحرين',
    programNameEn: 'Local content framework -- not yet sourced', programNameAr: 'إطار المحتوى المحلي — غير موثّق بعد',
    mechanismType: 'not-yet-sourced',
    applicableContexts: [],
    sourceNoteEn: 'This research pass found no formalized, publicly-documented national local-content scoring framework for Bahrain to the rigor applied to SA/AE/JO. Deliberately not guessed.',
    sourceNoteAr: 'لم يعثر هذا البحث على إطار وطني موثّق علنياً لتقييم المحتوى المحلي في مملكة البحرين بنفس دقة السعودية والإمارات والأردن. لم يتم تخمينه عمداً.',
  },
  KW: {
    country: 'KW', countryNameEn: 'Kuwait', countryNameAr: 'دولة الكويت',
    programNameEn: 'Local content framework -- not yet sourced', programNameAr: 'إطار المحتوى المحلي — غير موثّق بعد',
    mechanismType: 'not-yet-sourced',
    applicableContexts: [],
    sourceNoteEn: 'This research pass found no formalized, publicly-documented national local-content scoring framework for Kuwait to the rigor applied to SA/AE/JO. Deliberately not guessed.',
    sourceNoteAr: 'لم يعثر هذا البحث على إطار وطني موثّق علنياً لتقييم المحتوى المحلي في دولة الكويت بنفس دقة السعودية والإمارات والأردن. لم يتم تخمينه عمداً.',
  },
};

// ---------------------------------------------------------------------------
// Section 2 — supplier-level inputs (only the fields for the country you're
// assessing need to be populated; the rest are ignored)
// ---------------------------------------------------------------------------

export interface SupplierLocalContentInputs {
  /** LCGPA (SA) pillars -- SAR, same real Guide G1 structure as lcgpaLocalContent.ts,
   * expressed as this SUPPLIER's own spend/labor breakdown. */
  sa?: {
    localLaborSAR: number | null; expatLaborSAR: number | null;
    localGoodsServicesSAR: number | null; foreignGoodsServicesSAR: number | null;
    capacityBuildingSAR: number | null;
    localAssetDepreciationSAR: number | null; totalAssetDepreciationSAR: number | null;
  };
  /** UAE ICV (AE) pillars -- AED. Field-level sourced bands documented next to their use in computeIcvAe(). */
  ae?: {
    manufacturingOrThirdPartySpendLocalAED: number | null;
    manufacturingOrThirdPartySpendTotalAED: number | null;
    investmentNBVLocalAED: number | null; investmentNBVTotalAED: number | null;
    emiratisationAnnualSpendAED: number | null;
    expatriateHeadcount: number | null;
    exportRevenueAED: number | null;
    emiratiHeadcountGrowthPct: number | null;
    investmentGrowthPct: number | null;
    registeredOnMainland: boolean | null;
  };
  /** Jordan price-preference mechanism -- % of this bid's value that is
   * Jordanian-manufactured (self-reported, caller-supplied). */
  jo?: {
    bidValueLocallyManufacturedPct: number | null;
  };
}

// ---------------------------------------------------------------------------
// Section 3 — result shapes (discriminated by mechanismType -- never averaged
// across incompatible mechanisms; Decision Record 8.7)
// ---------------------------------------------------------------------------

export interface EligibleSpendRatioResult {
  mechanismType: 'eligible-spend-ratio';
  scorePct: number | null;
  pillars: { key: string; eligible: number; total: number }[];
}

export interface WeightedPillarScoreResult {
  mechanismType: 'weighted-pillar-score';
  scorePct: number | null;
  pillars: { key: string; contributionPct: number; noteEn: string; noteAr: string }[];
  mainlandUpliftApplied: boolean;
}

export interface PricePreferenceMarginResult {
  mechanismType: 'price-preference-margin';
  /** The preference margin applied to the LOCAL portion of the bid during
   * evaluation -- this is not a local-content percentage score. */
  preferenceMarginPct: number;
  locallyManufacturedSharePct: number | null;
  effectiveBidDiscountPct: number | null; // preferenceMarginPct * locallyManufacturedSharePct / 100
}

export interface NotYetSourcedResult {
  mechanismType: 'not-yet-sourced';
}

export type LocalContentComputation =
  | EligibleSpendRatioResult
  | WeightedPillarScoreResult
  | PricePreferenceMarginResult
  | NotYetSourcedResult;

export type LocalContentApplicability = 'applicable' | 'not-applicable' | 'insufficient-data';

export interface LocalContentAssessment {
  country: LocalContentCountry;
  procurementContext: ProcurementContext;
  applicability: LocalContentApplicability;
  framework: CountryFrameworkInfo;
  computation: LocalContentComputation | null;
  /** Never a certified score -- always self-reported/directional, per
   * Decision Record 8.7's honesty convention (same framing as lcgpaLocalContent.ts). */
  certificationCaveatEn: string;
  certificationCaveatAr: string;
  reasonEn: string;
  reasonAr: string;
}

function n(v: number | null | undefined): number {
  return v === null || v === undefined || Number.isNaN(v) || v < 0 ? 0 : v;
}

const NOT_CERTIFIED_EN = 'This is a directional, self-reported estimate, not a certified score from the relevant national authority -- use it for early-stage planning before a formal audit/certification.';
const NOT_CERTIFIED_AR = 'هذا تقدير توجيهي ذاتي التصريح، وليس درجة معتمدة من الجهة الوطنية المختصة -- استخدمه للتخطيط المبكر قبل تدقيق/تصديق رسمي.';

// ---------------------------------------------------------------------------
// Section 4 — SA: LCGPA eligible-spend-ratio (same real Guide G1 formula as
// lcgpaLocalContent.ts, independently expressed for supplier-fact inputs
// per the standalone-first architecture rule)
// ---------------------------------------------------------------------------

const SA_EXPAT_LABOR_ELIGIBILITY = 0.37;

function computeLcgpaSa(sa: NonNullable<SupplierLocalContentInputs['sa']>): EligibleSpendRatioResult {
  const labor = { key: 'labor', eligible: n(sa.localLaborSAR) * 1.0 + n(sa.expatLaborSAR) * SA_EXPAT_LABOR_ELIGIBILITY, total: n(sa.localLaborSAR) + n(sa.expatLaborSAR) };
  const goodsServices = { key: 'goodsServices', eligible: n(sa.localGoodsServicesSAR), total: n(sa.localGoodsServicesSAR) + n(sa.foreignGoodsServicesSAR) };
  const capacityBuilding = { key: 'capacityBuilding', eligible: n(sa.capacityBuildingSAR), total: n(sa.capacityBuildingSAR) };
  const depreciation = { key: 'depreciation', eligible: n(sa.localAssetDepreciationSAR), total: n(sa.totalAssetDepreciationSAR) };
  const pillars = [labor, goodsServices, capacityBuilding, depreciation];
  const totalEligible = pillars.reduce((s, p) => s + p.eligible, 0);
  const totalSpend = pillars.reduce((s, p) => s + p.total, 0);
  return { mechanismType: 'eligible-spend-ratio', scorePct: totalSpend > 0 ? (totalEligible / totalSpend) * 100 : null, pillars };
}

// ---------------------------------------------------------------------------
// Section 5 — AE: UAE ICV weighted-pillar-score. Banded percentages sourced
// from a public secondary read of MoIAT's official supplier certification
// guidelines (see COUNTRY_FRAMEWORKS.AE.sourceNoteEn for the verification
// caveat). Each band is disclosed per-pillar, not hidden inside one opaque
// number.
// ---------------------------------------------------------------------------

/** Investment pillar: NBV-ratio component (x0.1) + a progressive component
 * from AED 5M to AED 150M NBV scaling toward 15%, per the sourced guideline. */
function investmentPillarPct(localNBV: number, totalNBV: number): number {
  if (totalNBV <= 0) return 0;
  const ratioComponent = (localNBV / totalNBV) * 10; // x0.1 expressed as percentage points
  const progressiveCeiling = 15;
  const progressiveFloor = 5_000_000;
  const progressiveCap = 150_000_000;
  const progressiveComponent = localNBV <= progressiveFloor
    ? 0
    : Math.min(progressiveCeiling, ((Math.min(localNBV, progressiveCap) - progressiveFloor) / (progressiveCap - progressiveFloor)) * progressiveCeiling);
  return Math.min(25, ratioComponent + progressiveComponent); // ratio + progressive components, disclosed as additive per sourced structure
}

/** Emiratisation pillar: progressive 2% (at <=AED 200K annual spend) to 15%
 * (at >=AED 20M annual spend), per the sourced guideline. */
function emiratisationPillarPct(annualSpendAED: number): number {
  if (annualSpendAED <= 200_000) return 2;
  if (annualSpendAED >= 20_000_000) return 15;
  const span = 20_000_000 - 200_000;
  return 2 + ((annualSpendAED - 200_000) / span) * (15 - 2);
}

/** Expatriate contribution pillar: banded by headcount, per the sourced
 * guideline (1-5: 1-3%, 6-50: 4-6%, 51-200: 7-9%, 200+: 10%). Midpoint of
 * each band used as the directional figure, disclosed as such. */
function expatriateContributionPillarPct(headcount: number): number {
  if (headcount <= 0) return 0;
  if (headcount <= 5) return 2;    // midpoint of 1-3%
  if (headcount <= 50) return 5;   // midpoint of 4-6%
  if (headcount <= 200) return 8;  // midpoint of 7-9%
  return 10;
}

function computeIcvAe(ae: NonNullable<SupplierLocalContentInputs['ae']>): WeightedPillarScoreResult {
  const pillars: WeightedPillarScoreResult['pillars'] = [];

  const spendLocal = n(ae.manufacturingOrThirdPartySpendLocalAED);
  const spendTotal = n(ae.manufacturingOrThirdPartySpendTotalAED);
  const spendPct = spendTotal > 0 ? (spendLocal / spendTotal) * 100 : 0;
  pillars.push({
    key: 'manufacturingOrThirdPartySpend', contributionPct: spendPct,
    noteEn: 'Manufacturing / Third-Party Spend: spend with UAE-based (and ICV-certified) suppliers contributes positively; international procurement reduces this share.',
    noteAr: 'التصنيع / إنفاق الطرف الثالث: الإنفاق مع موردين مقيمين في الإمارات (وحاصلين على شهادة ICV) يسهم إيجاباً؛ الشراء الدولي يقلّل هذه الحصة.',
  });

  const investPct = investmentPillarPct(n(ae.investmentNBVLocalAED), n(ae.investmentNBVTotalAED));
  pillars.push({
    key: 'investment', contributionPct: investPct,
    noteEn: 'Investment: net book value of UAE-based facilities/equipment/R&D assets, ratio component plus a progressive component from AED 5M to AED 150M NBV.',
    noteAr: 'الاستثمار: القيمة الدفترية الصافية لأصول المنشآت/المعدات/البحث والتطوير المقيمة في الإمارات، مكوّن نسبي بالإضافة إلى مكوّن تدريجي من ٥ مليون إلى ١٥٠ مليون درهم.',
  });

  const emiratisationPct = ae.emiratisationAnnualSpendAED !== null && ae.emiratisationAnnualSpendAED !== undefined
    ? emiratisationPillarPct(ae.emiratisationAnnualSpendAED) : 0;
  pillars.push({
    key: 'emiratisation', contributionPct: emiratisationPct,
    noteEn: 'Emiratisation: employment of UAE nationals, a heavily-weighted component, progressive from 2% (<=AED 200K annual spend) to 15% (>=AED 20M).',
    noteAr: 'التوطين: توظيف المواطنين الإماراتيين، مكوّن مرجّح بقوة، يتدرّج من ٢٪ (إنفاق سنوي ≤٢٠٠ ألف درهم) إلى ١٥٪ (≥٢٠ مليون درهم).',
  });

  const expatPct = ae.expatriateHeadcount !== null && ae.expatriateHeadcount !== undefined
    ? expatriateContributionPillarPct(ae.expatriateHeadcount) : 0;
  pillars.push({
    key: 'expatriateContribution', contributionPct: expatPct,
    noteEn: 'Expatriate Contribution: banded by expatriate headcount (1-5: ~2%, 6-50: ~5%, 51-200: ~8%, 200+: 10%) -- band midpoints used as a directional figure.',
    noteAr: 'مساهمة العمالة الوافدة: تصنّف حسب عدد الموظفين الوافدين (١-٥: ~٢٪، ٦-٥٠: ~٥٪، ٥١-٢٠٠: ~٨٪، أكثر من ٢٠٠: ١٠٪) -- تُستخدم نقطة المنتصف كرقم توجيهي.',
  });

  const bonusExport = ae.exportRevenueAED && ae.manufacturingOrThirdPartySpendTotalAED
    ? Math.min(5, (ae.exportRevenueAED / Math.max(1, ae.manufacturingOrThirdPartySpendTotalAED)) * 5) : 0;
  const bonusEmiratiGrowth = Math.min(5, Math.max(0, n(ae.emiratiHeadcountGrowthPct)) / 4);
  const bonusInvestGrowth = Math.min(5, Math.max(0, n(ae.investmentGrowthPct)) / 4);
  const bonusTotal = bonusExport + bonusEmiratiGrowth + bonusInvestGrowth;
  pillars.push({
    key: 'bonus', contributionPct: bonusTotal,
    noteEn: 'Bonus categories (export revenue, Emirati headcount growth, investment growth), each capped at 5 percentage points per the sourced guideline.',
    noteAr: 'فئات المكافآت (إيرادات التصدير، نمو التوطين، نمو الاستثمار)، كل منها محدود بسقف ٥ نقاط مئوية وفق الدليل الموثّق.',
  });

  const mainlandUplift = ae.registeredOnMainland === true;
  const baseScore = pillars.reduce((s, p) => s + p.contributionPct, 0);
  const scorePct = Math.min(100, baseScore * (mainlandUplift ? 1.10 : 1.0));

  // NOTE (defect fixed 15 Sep 2026, found by this module's own boundary stress test): this must
  // check whether each field was EXPLICITLY SUPPLIED (not null/undefined), never whether it is
  // truthy. A genuinely all-zero-but-real UAE supplier (real total spend/investment denominators,
  // zero local content in every pillar) is a valid, honest 0%-ish score -- not "insufficient data".
  // The previous `||` truthy guard conflated a real 0 with "field never supplied", silently
  // reclassifying a computed answer as null. Decision Record 8.7: never let a real answer collapse
  // into a missing-data state just because that answer happens to be zero.
  const hasAnyAeInput = [
    ae.manufacturingOrThirdPartySpendTotalAED,
    ae.investmentNBVTotalAED,
    ae.emiratisationAnnualSpendAED,
    ae.expatriateHeadcount,
  ].some(v => v !== null && v !== undefined);

  return { mechanismType: 'weighted-pillar-score', scorePct: hasAnyAeInput ? scorePct : null, pillars, mainlandUpliftApplied: mainlandUplift };
}

// ---------------------------------------------------------------------------
// Section 6 — JO: price-preference-margin (a bid-evaluation adjustment, not
// a local-content score)
// ---------------------------------------------------------------------------

export const JORDAN_PRICE_PREFERENCE_MARGIN_PCT = 20;

function computePricePreferenceJo(jo: NonNullable<SupplierLocalContentInputs['jo']>): PricePreferenceMarginResult {
  const share = jo.bidValueLocallyManufacturedPct;
  return {
    mechanismType: 'price-preference-margin',
    preferenceMarginPct: JORDAN_PRICE_PREFERENCE_MARGIN_PCT,
    locallyManufacturedSharePct: share ?? null,
    effectiveBidDiscountPct: share !== null && share !== undefined ? (JORDAN_PRICE_PREFERENCE_MARGIN_PCT * share) / 100 : null,
  };
}

// ---------------------------------------------------------------------------
// Section 7 — top-level supplier assessment: resolves applicability first
// (government/SOE vs private-commercial, and sourced vs not-yet-sourced),
// then computes with the right mechanism.
// ---------------------------------------------------------------------------

export function assessSupplierLocalContent(
  country: LocalContentCountry,
  procurementContext: ProcurementContext,
  inputs: SupplierLocalContentInputs,
): LocalContentAssessment {
  const framework = COUNTRY_FRAMEWORKS[country];

  if (framework.mechanismType === 'not-yet-sourced') {
    return {
      country, procurementContext, applicability: 'insufficient-data', framework, computation: { mechanismType: 'not-yet-sourced' },
      certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR,
      reasonEn: `No local-content formula for ${framework.countryNameEn} has been sourced to this platform's verification standard yet. ${framework.sourceNoteEn}`,
      reasonAr: `لم يتم بعد توثيق صيغة محتوى محلي لـ${framework.countryNameAr} وفق معيار التحقق المعتمد في هذه المنصة. ${framework.sourceNoteAr}`,
    };
  }

  if (!framework.applicableContexts.includes(procurementContext)) {
    return {
      country, procurementContext, applicability: 'not-applicable', framework, computation: null,
      certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR,
      reasonEn: `${framework.programNameEn} is sourced as applying to ${framework.applicableContexts.join('/')} procurement in ${framework.countryNameEn}. No sourced evidence it applies to ${procurementContext} procurement -- this assessment does not apply here, not a zero score.`,
      reasonAr: `${framework.programNameAr} موثّق كأنه يسري على مشتريات ${framework.applicableContexts.join(' / ')} في ${framework.countryNameAr}. لا يوجد دليل موثّق على سريانه على مشتريات من نوع ${procurementContext} -- هذا التقييم لا ينطبق هنا، وليس درجة صفرية.`,
    };
  }

  let computation: LocalContentComputation;
  if (country === 'SA') {
    if (!inputs.sa) {
      return { country, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'eligible-spend-ratio', scorePct: null, pillars: [] }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No SA/LCGPA pillar inputs supplied yet.', reasonAr: 'لم تُدخل بيانات أركان LCGPA بعد.' };
    }
    computation = computeLcgpaSa(inputs.sa);
  } else if (country === 'AE') {
    if (!inputs.ae) {
      return { country, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'weighted-pillar-score', scorePct: null, pillars: [], mainlandUpliftApplied: false }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No AE/ICV pillar inputs supplied yet.', reasonAr: 'لم تُدخل بيانات أركان ICV بعد.' };
    }
    computation = computeIcvAe(inputs.ae);
  } else if (country === 'JO') {
    if (!inputs.jo) {
      return { country, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'price-preference-margin', preferenceMarginPct: JORDAN_PRICE_PREFERENCE_MARGIN_PCT, locallyManufacturedSharePct: null, effectiveBidDiscountPct: null }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No Jordan locally-manufactured bid share supplied yet.', reasonAr: 'لم تُدخل نسبة التصنيع المحلي في العطاء بعد.' };
    }
    computation = computePricePreferenceJo(inputs.jo);
  } else {
    computation = { mechanismType: 'not-yet-sourced' };
  }

  const scoreLine = computation.mechanismType === 'eligible-spend-ratio' || computation.mechanismType === 'weighted-pillar-score'
    ? (computation.scorePct !== null ? `directional score ${computation.scorePct.toFixed(1)}%` : 'incomplete inputs')
    : computation.mechanismType === 'price-preference-margin'
      ? (computation.effectiveBidDiscountPct !== null ? `effective bid discount ${computation.effectiveBidDiscountPct.toFixed(1)} points` : 'incomplete inputs')
      : 'not sourced';

  return {
    country, procurementContext, applicability: 'applicable', framework, computation,
    certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR,
    reasonEn: `${framework.programNameEn} (${framework.countryNameEn}, ${procurementContext}): ${scoreLine}.`,
    reasonAr: `${framework.programNameAr} (${framework.countryNameAr}، ${procurementContext})`,
  };
}

// ---------------------------------------------------------------------------
// Section 8 — primary + alternative recommendation (Core Instruction / Rule
// 8: never a single-path recommendation)
// ---------------------------------------------------------------------------

export interface LocalContentRecommendation {
  primaryEn: string; primaryAr: string;
  alternativeEn: string; alternativeAr: string;
}

export function recommendLocalContentAction(assessment: LocalContentAssessment, targetThresholdPct: number | null): LocalContentRecommendation | null {
  if (assessment.applicability !== 'applicable' || !assessment.computation) return null;
  const c = assessment.computation;

  if (c.mechanismType === 'eligible-spend-ratio' || c.mechanismType === 'weighted-pillar-score') {
    if (c.scorePct === null || targetThresholdPct === null || c.scorePct >= targetThresholdPct) return null;
    const gap = targetThresholdPct - c.scorePct;
    return {
      primaryEn: `Close the ${gap.toFixed(1)}-point gap directly: increase spend in the pillar(s) with the lowest eligible share first (see the pillar breakdown above) -- this raises the certified score itself, the durable fix.`,
      primaryAr: `أغلق الفجوة البالغة ${gap.toFixed(1)} نقطة مباشرة: زد الإنفاق في الركن (الأركان) ذات النسبة المؤهلة الأدنى أولاً (انظر تفصيل الأركان أعلاه) -- هذا يرفع الدرجة المعتمدة نفسها، وهو الحل الدائم.`,
      alternativeEn: 'If the gap cannot close before this tender\'s deadline: partner or subcontract the shortfall portion of scope with an already-certified local entity, or target a different tender/procuring entity whose threshold this supplier already clears.',
      alternativeAr: 'إذا تعذّر إغلاق الفجوة قبل موعد هذه المناقصة: أشرك جهة محلية معتمدة مسبقاً كشريك أو مقاول من الباطن للجزء الناقص من النطاق، أو استهدف مناقصة/جهة شراء أخرى يفي هذا المورّد بحدّها الأدنى بالفعل.',
    };
  }
  if (c.mechanismType === 'price-preference-margin') {
    if (c.locallyManufacturedSharePct === null || c.locallyManufacturedSharePct >= 100) return null;
    return {
      primaryEn: `Increasing the locally-manufactured share of this bid raises the effective price-preference discount directly (currently ${c.effectiveBidDiscountPct?.toFixed(1) ?? '0'} of a possible ${c.preferenceMarginPct} points) -- source more of the bid's content from Jordanian manufacturing where the specification allows it.`,
      primaryAr: `زيادة الحصة المصنّعة محلياً في هذا العطاء ترفع الخصم السعري الفعلي مباشرة (حالياً ${c.effectiveBidDiscountPct?.toFixed(1) ?? '0'} من أصل ${c.preferenceMarginPct} نقطة ممكنة) -- استمد جزءاً أكبر من محتوى العطاء من التصنيع الأردني حيثما تسمح المواصفة.`,
      alternativeEn: 'If the specification genuinely cannot be met locally, the bid still competes on its own technical/commercial merits without the preference -- confirm whether the gap is decisive before investing in re-sourcing.',
      alternativeAr: 'إذا تعذّر فعلياً استيفاء المواصفة محلياً، يظل العطاء قادراً على المنافسة بمزاياه الفنية والتجارية دون التفضيل -- تأكد من أن الفجوة حاسمة قبل الاستثمار في إعادة التوريد.',
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Section 9 — portfolio-level rollup (mirrors Module 05's HHI rollup
// pattern: weighted by spend share, grouped by mechanism type, never
// averaged across incompatible mechanisms)
// ---------------------------------------------------------------------------

export interface PortfolioLocalContentInput {
  supplierId: string;
  spendShare: number; // 0-100, this supplier's share of the relevant portfolio spend
  assessment: LocalContentAssessment;
}

export interface PortfolioLocalContentGroup {
  country: LocalContentCountry;
  procurementContext: ProcurementContext;
  mechanismType: LocalContentMechanismType;
  supplierCount: number;
  portfolioSpendSharePct: number; // sum of spendShare across suppliers in this group
  weightedScorePct: number | null; // only for score-based mechanisms
  weightedEffectiveDiscountPct: number | null; // only for price-preference-margin
  suppliersWithInsufficientData: number;
  suppliersNotApplicable: number;
}

export function rollUpPortfolioLocalContent(inputs: PortfolioLocalContentInput[]): PortfolioLocalContentGroup[] {
  const groups = new Map<string, PortfolioLocalContentInput[]>();
  for (const item of inputs) {
    const key = `${item.assessment.country}__${item.assessment.procurementContext}`;
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }

  const result: PortfolioLocalContentGroup[] = [];
  for (const [, items] of groups) {
    const first = items[0]!.assessment;
    const applicableItems = items.filter(i => i.assessment.applicability === 'applicable' && i.assessment.computation);
    const insufficientCount = items.filter(i => i.assessment.applicability === 'insufficient-data').length;
    const notApplicableCount = items.filter(i => i.assessment.applicability === 'not-applicable').length;
    const totalSpendShare = items.reduce((s, i) => s + i.spendShare, 0);

    let weightedScorePct: number | null = null;
    let weightedEffectiveDiscountPct: number | null = null;

    if (first.framework.mechanismType === 'eligible-spend-ratio' || first.framework.mechanismType === 'weighted-pillar-score') {
      const scorable = applicableItems.filter(i => {
        const c = i.assessment.computation;
        return c && (c.mechanismType === 'eligible-spend-ratio' || c.mechanismType === 'weighted-pillar-score') && c.scorePct !== null;
      });
      const scorableSpend = scorable.reduce((s, i) => s + i.spendShare, 0);
      if (scorableSpend > 0) {
        weightedScorePct = scorable.reduce((s, i) => {
          const c = i.assessment.computation as EligibleSpendRatioResult | WeightedPillarScoreResult;
          return s + (c.scorePct as number) * (i.spendShare / scorableSpend);
        }, 0);
      }
    } else if (first.framework.mechanismType === 'price-preference-margin') {
      const scorable = applicableItems.filter(i => {
        const c = i.assessment.computation;
        return c && c.mechanismType === 'price-preference-margin' && c.effectiveBidDiscountPct !== null;
      });
      const scorableSpend = scorable.reduce((s, i) => s + i.spendShare, 0);
      if (scorableSpend > 0) {
        weightedEffectiveDiscountPct = scorable.reduce((s, i) => {
          const c = i.assessment.computation as PricePreferenceMarginResult;
          return s + (c.effectiveBidDiscountPct as number) * (i.spendShare / scorableSpend);
        }, 0);
      }
    }

    result.push({
      country: first.country, procurementContext: first.procurementContext, mechanismType: first.framework.mechanismType,
      supplierCount: items.length, portfolioSpendSharePct: totalSpendShare,
      weightedScorePct, weightedEffectiveDiscountPct,
      suppliersWithInsufficientData: insufficientCount, suppliersNotApplicable: notApplicableCount,
    });
  }
  return result;
}
