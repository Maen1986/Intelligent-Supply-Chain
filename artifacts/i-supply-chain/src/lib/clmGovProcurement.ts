/**
 * clmGovProcurement.ts
 *
 * Module 03 (Contract Intelligence v10) -- #402, government-track
 * procurement-method framework awareness, built 30 Aug 2026 per owner
 * instruction "make it for all, deep clear and professional" (extending the
 * Saudi-only scoping from item 26's research to the platform's full
 * GCC/Jordan government-adjacent track set).
 *
 * WHAT THIS IS: `recommendRfxType()` (clmContractLifecycle.ts, Part D)
 * answers "which of RFI/RFP/RFQ" for a private-sector-style buying
 * decision. It has zero awareness that a GOVERNMENT counterparty in
 * several of this platform's governing-law tracks is instead gated by a
 * legally mandated procurement METHOD ladder (direct purchase / limited
 * tender / public tender, or that jurisdiction's equivalent) keyed off
 * contract value and category -- a question that precedes, not replaces,
 * the RFI/RFP/RFQ question. This file supplies that framework information,
 * as an informational note only -- see `getGovProcurementFrameworkNote()`.
 *
 * ANTI-FABRICATION DISCIPLINE (Decision Record 8.7), applied literally
 * here: every numeric threshold below is tagged with a
 * `GovProcurementThresholdConfidence`. Several tracks have NO numeric
 * threshold at all -- not because the research was shallow, but because
 * the primary law text itself defers the number to a non-public internal
 * document (UAE), or because no public figure was found in this research
 * pass (Oman, Jordan). Those tracks still get real, sourced content
 * (named law, administering body, real procurement methods) -- they are
 * just honest about what is not publicly known, rather than inventing a
 * plausible-looking figure. See
 * module03-item402-gov-procurement-all-gcc-jordan-research.md (29-30 Aug
 * 2026) for full sourcing.
 *
 * SCOPE: the same seven tracks the platform already treats as its
 * GCC/Jordan government-adjacent set (matching item 25's riba-flag
 * grouping): saudi-gtpl, uae-ctl, qatar-civil, bahrain-civil, oman-civil,
 * kuwait-civil, jordan-civil. Deliberately NOT extended to every other
 * governing-law track in the platform -- no research was done on
 * government-procurement rules for the UK/US/EU/CISG/Asia-Pacific tracks
 * this pass, and asserting anything for them would be invention.
 */

import type { GoverningLawTrack } from './clmLegalTrack';

export type GovProcurementThresholdConfidence =
  | 'primary-confirmed'      // verified directly against the fetched primary law/regulation text
  | 'secondary-sourced'      // corroborated across independent secondary sources, not directly confirmed against primary text this pass
  | 'not-publicly-disclosed' // the primary law itself defers the figure to a non-public document
  | 'not-found-this-pass';   // no public figure located in this research pass -- an honest gap, not a claim of non-existence

export interface GovProcurementMethodMeta {
  labelEn: string;
  labelAr: string;
  triggerEn: string;
  triggerAr: string;
}

export interface GovProcurementThresholdMeta {
  labelEn: string;
  labelAr: string;
  confidence: GovProcurementThresholdConfidence;
}

export interface GovProcurementFrameworkNote {
  trackId: GoverningLawTrack;
  lawNameEn: string;
  lawNameAr: string;
  administeringBodyEn: string;
  administeringBodyAr: string;
  methods: GovProcurementMethodMeta[];
  thresholds: GovProcurementThresholdMeta[];
  liveReformNoteEn?: string;
  liveReformNoteAr?: string;
}

const GOV_PROCUREMENT_FRAMEWORKS: Partial<Record<GoverningLawTrack, GovProcurementFrameworkNote>> = {
  'saudi-gtpl': {
    trackId: 'saudi-gtpl',
    lawNameEn: 'Government Tenders and Procurement Law (GTPL)',
    lawNameAr: 'نظام المنافسات والمشتريات الحكومية',
    administeringBodyEn: 'Etimad e-procurement portal (Ministry of Finance, since 2018)',
    administeringBodyAr: 'بوابة اعتماد الإلكترونية (وزارة المالية، منذ 2018)',
    methods: [
      { labelEn: 'Direct purchase', labelAr: 'الشراء المباشر', triggerEn: 'Budget under SAR 100,000 (rising to SAR 1,000,000 once the 4 Aug 2026 reform is in force), or military/single-source/national-security cases.', triggerAr: 'ميزانية أقل من 100,000 ريال (سترتفع إلى 1,000,000 ريال عند نفاذ إصلاح 4 أغسطس 2026)، أو حالات عسكرية/مصدر وحيد/أمن وطني.' },
      { labelEn: 'Limited (invitation-only) tendering', labelAr: 'المنافسة المحدودة (بالدعوة)', triggerEn: 'Highly specialized projects, budget under SAR 500,000 (pre-reform figure), or consulting/university services.', triggerAr: 'مشاريع متخصصة للغاية، ميزانية أقل من 500,000 ريال (الرقم قبل الإصلاح)، أو خدمات استشارية/جامعية.' },
      { labelEn: 'General (public) competitive tendering', labelAr: 'المنافسة العامة (التنافسية)', triggerEn: 'Above the direct-purchase and limited-tendering thresholds.', triggerAr: 'أعلى من حدي الشراء المباشر والمنافسة المحدودة.' },
    ],
    thresholds: [
      { labelEn: 'Direct-purchase ceiling: SAR 100,000 (current), rising to SAR 1,000,000 once the 4 Aug 2026 reform takes effect', labelAr: 'سقف الشراء المباشر: 100,000 ريال (حالياً)، يرتفع إلى 1,000,000 ريال عند نفاذ إصلاح 4 أغسطس 2026', confidence: 'primary-confirmed' },
      { labelEn: 'Limited-tendering ceiling: SAR 500,000 (pre-reform figure)', labelAr: 'سقف المنافسة المحدودة: 500,000 ريال (الرقم قبل الإصلاح)', confidence: 'primary-confirmed' },
    ],
    liveReformNoteEn: 'Live legal reform in flight: a new GTPL was approved by the Council of Ministers on 4 Aug 2026, tenfold-raising the direct-purchase threshold and expanding limited tendering to independent professionals -- not yet in force as of this research (120 days after Official Gazette publication, publication date not yet confirmed).',
    liveReformNoteAr: 'إصلاح تشريعي جارٍ: وافق مجلس الوزراء بتاريخ 4 أغسطس 2026 على نظام منافسات ومشتريات حكومية جديد يرفع حد الشراء المباشر عشرة أضعاف ويوسّع المنافسة المحدودة لتشمل المهنيين المستقلين -- لم يدخل بعد حيز النفاذ حتى إعداد هذا البحث (يسري بعد 120 يوماً من نشره في الجريدة الرسمية، وتاريخ النشر لم يتأكد بعد).',
  },
  'uae-ctl': {
    trackId: 'uae-ctl',
    lawNameEn: 'Federal Law No. 11 of 2023 on Procurement in the Federal Government (in force 1 Dec 2023), Executive Regulation via Cabinet Resolution No. 122 of 2024',
    lawNameAr: 'القانون الاتحادي رقم 11 لسنة 2023 بشأن المشتريات في الحكومة الاتحادية (ساري اعتباراً من 1 ديسمبر 2023)، واللائحة التنفيذية بموجب قرار مجلس الوزراء رقم 122 لسنة 2024',
    administeringBodyEn: 'Federal Procurement System (Ministry of Finance)',
    administeringBodyAr: 'نظام المشتريات الاتحادي (وزارة المالية)',
    methods: [
      { labelEn: 'Public Tender', labelAr: 'المناقصة العامة', triggerEn: 'Mandatory above the value threshold set in the (non-public) Manual of Procurement Procedures.', triggerAr: 'إلزامية أعلى من الحد القيمي المحدد في دليل إجراءات المشتريات (غير المنشور).' },
      { labelEn: 'Limited Tender', labelAr: 'المناقصة المحدودة', triggerEn: 'Prequalified suppliers only, for procurement needing specific technical/managerial/financial capabilities.', triggerAr: 'للموردين المؤهلين مسبقاً فقط، للمشتريات التي تتطلب قدرات فنية/إدارية/مالية محددة.' },
      { labelEn: 'Direct Order and Exclusive Source', labelAr: 'الطلب المباشر والمصدر الحصري', triggerEn: 'Direct contracting with a registered supplier (justified), or sole-source contracting where no alternative supplier exists.', triggerAr: 'التعاقد المباشر مع مورد مسجل (بمبررات)، أو التعاقد من مصدر وحيد عند عدم وجود مورد بديل.' },
      { labelEn: 'Price Agreement', labelAr: 'اتفاقية الأسعار', triggerEn: 'Fixed-price framework agreement for a specified period, tendered in advance.', triggerAr: 'اتفاقية إطارية بأسعار ثابتة لفترة محددة، يتم طرحها مسبقاً عبر منافسة.' },
      { labelEn: 'Purchase below threshold / Petty Cash Card', labelAr: 'الشراء دون الحد الأدنى / بطاقة العهدة النثرية', triggerEn: 'Low-value purchases managed directly by the requesting organizational unit, without a formal tender.', triggerAr: 'مشتريات منخفضة القيمة تديرها الوحدة التنظيمية الطالبة مباشرة دون منافسة رسمية.' },
    ],
    thresholds: [
      { labelEn: 'No AED figures for any of the above are publicly disclosed -- the primary law and its Executive Regulation both defer every numeric threshold to a non-public "Manual of Procurement Procedures" and "Powers Delegation Matrix."', labelAr: 'لا توجد أرقام بالدرهم معلنة لأي مما سبق -- يحيل القانون ولائحته التنفيذية جميع الحدود الرقمية إلى "دليل إجراءات المشتريات" و"مصفوفة تفويض الصلاحيات" غير المنشورين.', confidence: 'not-publicly-disclosed' },
    ],
  },
  'qatar-civil': {
    trackId: 'qatar-civil',
    lawNameEn: 'Law No. 24 of 2015 Regulating Tenders and Auctions (in force 13 Jun 2016, amended by Decree Law 18/2018 and a 2024 amendment)',
    lawNameAr: 'القانون رقم 24 لسنة 2015 بتنظيم المناقصات والمزايدات (ساري اعتباراً من 13 يونيو 2016، وتم تعديله بالمرسوم بقانون رقم 18 لسنة 2018 وتعديل عام 2024)',
    administeringBodyEn: 'Central Tenders Committee (CTC) and Local Tenders Committee (LTC)',
    administeringBodyAr: 'لجنة المناقصات المركزية ولجنة المناقصات المحلية',
    methods: [
      { labelEn: 'Public tender', labelAr: 'المناقصة العامة', triggerEn: 'The default competitive method for goods, construction works, or services.', triggerAr: 'الأسلوب التنافسي الافتراضي للسلع وأعمال الإنشاءات والخدمات.' },
      { labelEn: 'Limited tender', labelAr: 'المناقصة المحدودة', triggerEn: 'Restricted to a pre-identified supplier group.', triggerAr: 'مقتصرة على مجموعة موردين محددة مسبقاً.' },
      { labelEn: '"Practice" (negotiated procurement)', labelAr: 'الممارسة (شراء بالتفاوض)', triggerEn: 'Used when tendering is deemed inapplicable -- a qualitative trigger, not a pure value line -- selecting from at least three registered suppliers, or where specifications cannot be precisely defined without negotiation.', triggerAr: 'تُستخدم عندما يُعتبر طرح المناقصة غير عملي -- معيار نوعي وليس خطاً قيمياً بحتاً -- بالاختيار من ثلاثة موردين مسجلين على الأقل، أو عندما يتعذر تحديد المواصفات بدقة دون تفاوض.' },
      { labelEn: 'Direct agreement', labelAr: 'الاتفاق المباشر', triggerEn: 'Urgent cases or confidential security-related projects only, subject to strict financial oversight.', triggerAr: 'الحالات العاجلة أو المشاريع الأمنية السرية فقط، وتخضع لرقابة مالية صارمة.' },
    ],
    thresholds: [
      { labelEn: 'Central Tenders Committee (CTC) jurisdiction: contracts over QAR 5,000,000', labelAr: 'اختصاص لجنة المناقصات المركزية: العقود التي تزيد قيمتها عن 5,000,000 ريال قطري', confidence: 'secondary-sourced' },
      { labelEn: 'Local Tenders Committee (LTC) jurisdiction: QAR 5,000,000 or below (local suppliers only)', labelAr: 'اختصاص لجنة المناقصات المحلية: 5,000,000 ريال قطري أو أقل (للموردين المحليين فقط)', confidence: 'secondary-sourced' },
      { labelEn: 'Prime Minister approval required above QAR 50,000,000', labelAr: 'تُشترط موافقة رئيس مجلس الوزراء أعلى من 50,000,000 ريال قطري', confidence: 'secondary-sourced' },
      { labelEn: 'Performance-bond exemption for values under QAR 500,000 (2019 amendment)', labelAr: 'إعفاء من ضمان حسن التنفيذ للقيم أقل من 500,000 ريال قطري (تعديل 2019)', confidence: 'secondary-sourced' },
    ],
  },
  'bahrain-civil': {
    trackId: 'bahrain-civil',
    lawNameEn: 'Legislative Decree No. 36 of 2002 (Law Regulating Government Tenders and Purchases) and its Implementing Regulations (Decree No. 37 of 2002)',
    lawNameAr: 'المرسوم بقانون رقم 36 لسنة 2002 بتنظيم المناقصات والمشتريات الحكومية ولائحته التنفيذية (المرسوم رقم 37 لسنة 2002)',
    administeringBodyEn: 'Tender Board (Bahrain)',
    administeringBodyAr: 'مجلس المناقصات (البحرين)',
    methods: [
      { labelEn: 'Public tender', labelAr: 'المناقصة العامة', triggerEn: 'The default competitive method.', triggerAr: 'الأسلوب التنافسي الافتراضي.' },
      { labelEn: 'Limited tender', labelAr: 'المناقصة المحدودة', triggerEn: 'Highly sensitive/limited-supplier goods, or purchases strengthening the national economy or foreign-currency reserves.', triggerAr: 'سلع بالغة الحساسية أو محدودة الموردين، أو مشتريات تعزز الاقتصاد الوطني أو احتياطي العملة الأجنبية.' },
      { labelEn: 'Competitive negotiation', labelAr: 'التفاوض التنافسي', triggerEn: 'Negotiation with the largest possible number of approved operators in the relevant business type.', triggerAr: 'التفاوض مع أكبر عدد ممكن من المتعاملين المعتمدين في نوع النشاط المعني.' },
      { labelEn: 'Direct purchase (single source)', labelAr: 'الشراء المباشر (من مصدر واحد)', triggerEn: 'With Tender Board approval, in the cases the Law provides for.', triggerAr: 'بموافقة مجلس المناقصات، في الحالات التي ينص عليها القانون.' },
      { labelEn: 'Requests for Proposals', labelAr: 'طلبات تقديم العروض', triggerEn: 'Services procurement, via one of three selection sub-methods (without negotiation / consecutive negotiation / simultaneous negotiation).', triggerAr: 'مشتريات الخدمات، عبر إحدى طرق الاختيار الثلاث الفرعية (دون تفاوض / تفاوض متتابع / تفاوض متزامن).' },
    ],
    thresholds: [
      { labelEn: 'e-portal publication required above BD 10,000; dual Official Gazette publication above BD 1,000,000', labelAr: 'يُشترط النشر عبر البوابة الإلكترونية أعلى من 10,000 دينار بحريني؛ ونشر مزدوج في الجريدة الرسمية أعلى من 1,000,000 دينار بحريني', confidence: 'secondary-sourced' },
      { labelEn: 'Ministries’ internal-purchase ceiling: BD 25,000 (current) -- a 2025 draft law, reported passed and in effect around May 2026 but not independently confirmed against the Official Gazette this pass, would raise it to BD 50,000', labelAr: 'سقف الشراء الداخلي للوزارات: 25,000 دينار بحريني (حالياً) -- مشروع قانون لعام 2025، ورد أنه أُقر ونفذ حوالي مايو 2026 دون تأكيد مستقل من الجريدة الرسمية في هذا البحث، سيرفعه إلى 50,000 دينار بحريني', confidence: 'secondary-sourced' },
      { labelEn: 'Wholly state-owned companies’ internal-purchase ceiling: BD 50,000 (current), proposed to rise to BD 100,000 under the same reform', labelAr: 'سقف الشراء الداخلي للشركات المملوكة بالكامل للدولة: 50,000 دينار بحريني (حالياً)، ومقترح رفعه إلى 100,000 دينار بحريني ضمن الإصلاح ذاته', confidence: 'secondary-sourced' },
    ],
    liveReformNoteEn: 'Live legal reform in flight, directly analogous to Saudi’s GTPL reform: a draft law (Financial and Economic Affairs Committee) was before Parliament from 22 Mar 2025, doubling both internal-purchase ceilings and adding a negotiation mechanism for near-tied or single-bid outcomes. A later report (not independently primary-source-verified this pass) says it passed and took effect around May 2026.',
    liveReformNoteAr: 'إصلاح تشريعي جارٍ، مماثل مباشرة لإصلاح نظام المنافسات والمشتريات السعودي: كان مشروع قانون (من لجنة الشؤون المالية والاقتصادية) معروضاً على البرلمان منذ 22 مارس 2025، يضاعف سقفي الشراء الداخلي ويضيف آلية تفاوض لحالات تقارب العروض أو العرض الوحيد. أفاد تقرير لاحق (لم يتم التحقق منه بشكل مستقل من مصدر أولي في هذا البحث) بأنه أُقر ونفذ حوالي مايو 2026.',
  },
  'oman-civil': {
    trackId: 'oman-civil',
    lawNameEn: 'Royal Decree 36/2008 (Tender Law), in force 1 Oct 2008',
    lawNameAr: 'المرسوم السلطاني رقم 36/2008 (قانون المناقصات)، ساري اعتباراً من 1 أكتوبر 2008',
    administeringBodyEn: 'Tender Board (Oman)',
    administeringBodyAr: 'مجلس المناقصات (عُمان)',
    methods: [
      { labelEn: 'Public tender', labelAr: 'المناقصة العامة', triggerEn: 'The default competitive method, including international tenders.', triggerAr: 'الأسلوب التنافسي الافتراضي، ويشمل المناقصات الدولية.' },
      { labelEn: 'Limited/restricted tender', labelAr: 'المناقصة المحدودة/المقيدة', triggerEn: 'Restricted to a pre-identified supplier group.', triggerAr: 'مقتصرة على مجموعة موردين محددة مسبقاً.' },
      { labelEn: 'Direct purchase', labelAr: 'الشراء المباشر', triggerEn: 'Specific circumstances defined in the Law.', triggerAr: 'حالات محددة ينص عليها القانون.' },
    ],
    thresholds: [
      { labelEn: 'No public OMR threshold figure was located or confirmed in this research pass.', labelAr: 'لم يتم العثور على أو تأكيد أي رقم حد قيمي بالريال العُماني منشور علنياً في هذا البحث.', confidence: 'not-found-this-pass' },
    ],
  },
  'kuwait-civil': {
    trackId: 'kuwait-civil',
    lawNameEn: 'Law No. 49 of 2016 on Public Tenders, amended by Law No. 74 of 2019 and Law No. 1 of 2024',
    lawNameAr: 'القانون رقم 49 لسنة 2016 بشأن المناقصات العامة، المعدَّل بالقانون رقم 74 لسنة 2019 والقانون رقم 1 لسنة 2024',
    administeringBodyEn: 'Central Agency for Public Tenders (CAPT)',
    administeringBodyAr: 'الجهاز المركزي للمناقصات العامة',
    methods: [
      { labelEn: 'CAPT-administered tender', labelAr: 'مناقصة يديرها الجهاز المركزي', triggerEn: 'Contracts valued over the CAPT jurisdiction threshold.', triggerAr: 'العقود التي تتجاوز قيمتها حد اختصاص الجهاز المركزي.' },
      { labelEn: 'Direct contracting by the entity itself', labelAr: 'التعاقد المباشر من قبل الجهة نفسها', triggerEn: 'Contracts at or below the CAPT jurisdiction threshold, without CAPT permission -- with an anti-splitting rule preventing repeat use for the same item/work within a fiscal year.', triggerAr: 'العقود التي تساوي أو تقل عن حد اختصاص الجهاز المركزي، دون الحاجة لإذنه -- مع قاعدة لمنع تجزئة نفس البند/العمل خلال السنة المالية.' },
    ],
    thresholds: [
      { labelEn: 'CAPT jurisdiction threshold: KD 75,000 (sourced to CAPT’s own domain via a corroborating summary; not independently confirmed against the amended statutory text this pass)', labelAr: 'حد اختصاص الجهاز المركزي: 75,000 دينار كويتي (مصدره نطاق الجهاز المركزي نفسه عبر ملخص مؤكِّد؛ لم يُتحقق منه بشكل مستقل من النص القانوني المعدَّل في هذا البحث)', confidence: 'secondary-sourced' },
    ],
  },
  'jordan-civil': {
    trackId: 'jordan-civil',
    lawNameEn: 'Government Procurement Bylaw No. 8 of 2022 (succeeding Bylaw No. 28 of 2019, which unified 50+ prior bylaws)',
    lawNameAr: 'نظام الشراء الحكومي رقم 8 لسنة 2022 (خلَفاً للنظام رقم 28 لسنة 2019 الذي وحّد أكثر من 50 نظاماً سابقاً)',
    administeringBodyEn: 'Government Procurement Department (GPD) / Government Tenders Directorate (GTD); JONEPS e-procurement (since 2018)',
    administeringBodyAr: 'دائرة الشراء الحكومي / مديرية المناقصات الحكومية؛ نظام جونبس للشراء الإلكتروني (منذ 2018)',
    methods: [
      { labelEn: 'Public/general tender', labelAr: 'المناقصة العامة', triggerEn: 'The default competitive method, published via JONEPS.', triggerAr: 'الأسلوب التنافسي الافتراضي، يُنشر عبر نظام جونبس.' },
      { labelEn: 'Limited tender', labelAr: 'المناقصة المحدودة', triggerEn: 'Restricted to a pre-identified supplier group.', triggerAr: 'مقتصرة على مجموعة موردين محددة مسبقاً.' },
      { labelEn: 'Direct purchase/contracting', labelAr: 'الشراء/التعاقد المباشر', triggerEn: 'Specific circumstances defined in the Bylaw.', triggerAr: 'حالات محددة ينص عليها النظام.' },
    ],
    thresholds: [
      { labelEn: 'No public JOD threshold figure was located or confirmed in this research pass.', labelAr: 'لم يتم العثور على أو تأكيد أي رقم حد قيمي بالدينار الأردني منشور علنياً في هذا البحث.', confidence: 'not-found-this-pass' },
    ],
  },
};

/**
 * Returns the government-procurement framework note for a track, but only
 * when the contract is actually government-track (`counterpartyType ===
 * 'government'`) -- a private-sector contract under the same governing-law
 * track gets no note, since these rules do not apply to it. Informational
 * only: this never overrides `recommendRfxType()`'s own RFI/RFP/RFQ
 * recommendation, it precedes/accompanies it, per item 26's original
 * "gate or precede, don't replace" design.
 */
export function getGovProcurementFrameworkNote(
  counterpartyType: 'government' | 'private' | undefined,
  governingLawClause: GoverningLawTrack | undefined,
): GovProcurementFrameworkNote | undefined {
  if (counterpartyType !== 'government') return undefined;
  if (!governingLawClause) return undefined;
  return GOV_PROCUREMENT_FRAMEWORKS[governingLawClause];
}
