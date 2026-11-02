/**
 * GCC modifiers for the Kraljic module (Round B5, enrichment item 9).
 *
 * Orthogonal tags and axis inputs, NOT new quadrants:
 *  (a) Mandatory List flag and UPC code on the item. A listed item shrinks the
 *      eligible supplier base, which the supply-risk axis should reflect.
 *  (b) Supplier attributes (national, SME, listed, local-content certificate,
 *      IKTVA score, UAE ICV, Qatar ICV, Oman JSRS).
 *  (c) Price preference as a dated, per-country parameter.
 *  (d) Planning gate (Art. 12(2): consider local content before tender),
 *      flagged as pending in-force confirmation.
 *  (e) Method-ladder check for government buyers, so negotiation tactics stay
 *      inside legal methods.
 *  (f) Contract-clause parameters, shown as "per law-firm summary, verify".
 *  (g) A jurisdiction selector so private-sector users never see government
 *      rules. The sources discuss government entities only.
 *
 * SOURCING HONESTY (Decision Record 8.7). Facts come from secondary sources
 * (CMS 20 Oct 2026 summary of the new Saudi Government Tenders and Procurement
 * Law, Royal Decree M/76; Clyde & Co; Argaam; Global Trade Alert; Ajel; Jordan
 * Times; PwC Qatar). Article numbers are a law-firm summary, not the law text.
 * The in-force status of the new Saudi law was NOT confirmed as of 2 Nov 2026
 * (it enters into force 120 days after Gazette publication; the publication
 * date was not found). Every value carries a source tag and a reviewed-on date.
 * Effects on the axes are ISC inference, not source statements.
 * NOT STATED because not confirmed: a Qatar 15% domestic preference; a Saudi
 * 35% SME procurement quota (the 35% is a GDP-share target); IKTVA tiers or a
 * minimum score; the UAE "10% unscored vendor" rule.
 *
 * STANDALONE-FIRST: no imports.
 */

export type Bilingual = { en: string; ar: string };
const b = (en: string, ar: string): Bilingual => ({ en, ar });

export const GCC_REVIEWED_ON = '2026-11-02';

export type Jurisdiction = 'private' | 'saudi-gov' | 'uae-gov' | 'qatar-gov' | 'oman-gov' | 'jordan-gov';

export const JURISDICTIONS: Array<{ key: Jurisdiction; label: Bilingual }> = [
  { key: 'private', label: b('Private sector (no government rules)', 'القطاع الخاص (دون قواعد حكومية)') },
  { key: 'saudi-gov', label: b('Saudi government entity', 'جهة حكومية سعودية') },
  { key: 'uae-gov', label: b('UAE government entity', 'جهة حكومية إماراتية') },
  { key: 'qatar-gov', label: b('Qatar government entity', 'جهة حكومية قطرية') },
  { key: 'oman-gov', label: b('Oman government entity', 'جهة حكومية عُمانية') },
  { key: 'jordan-gov', label: b('Jordan government entity', 'جهة حكومية أردنية') },
];

/** Government rules are shown only for a government jurisdiction. */
export function rulesVisible(j: Jurisdiction): boolean { return j !== 'private'; }

export type SourceStatus = 'secondary' | 'snippet' | 'unconfirmed';
export const STATUS_LABEL: Record<SourceStatus, Bilingual> = {
  secondary: b('Secondary source (law-firm or press summary)', 'مصدر ثانوي (ملخص مكتب محاماة أو صحافة)'),
  snippet: b('Search snippet only', 'مقتطف بحث فقط'),
  unconfirmed: b('Not confirmed: do not state', 'غير مؤكد: لا تذكره'),
};

export interface GccFacts {
  jurisdiction: Jurisdiction;
  /** Item is on the LCGPA Mandatory List of National Products. */
  mandatoryListed: boolean | null;
  upcCode: string;
  /** How many of the qualified alternatives are eligible under the Mandatory List (national products). */
  nationalAlternatives: number | null;
  supplier: {
    national: boolean | null;
    sme: boolean | null;
    listed: boolean | null;
    localContentCertificate: boolean | null;
    iktvaScore: number | null;
    uaeIcv: number | null;
    qatarIcv: number | null;
    omanJsrs: boolean | null;
  };
}

export function emptyGccFacts(): GccFacts {
  return {
    jurisdiction: 'private', mandatoryListed: null, upcCode: '', nationalAlternatives: null,
    supplier: { national: null, sme: null, listed: null, localContentCertificate: null, iktvaScore: null, uaeIcv: null, qatarIcv: null, omanJsrs: null },
  };
}

// (a) Mandatory List effect on the supply-risk input ----------------------------

export interface GccAdjustment {
  /** Alternatives that count after the Mandatory List. null when the answer is still needed. */
  effectiveAlternatives: number | null;
  reducedBy: number;
  note: Bilingual;
  /** True when ISC needs one more answer. */
  ask: boolean;
}

export function gccAdjustment(qualifiedAlternatives: number | null, f: GccFacts): GccAdjustment {
  if (!rulesVisible(f.jurisdiction)) {
    return { effectiveAlternatives: qualifiedAlternatives, reducedBy: 0, note: b('Private sector: no government rule applied.', 'القطاع الخاص: لم تُطبَّق أي قاعدة حكومية.'), ask: false };
  }
  if (f.mandatoryListed !== true) {
    return {
      effectiveAlternatives: qualifiedAlternatives, reducedBy: 0, ask: f.mandatoryListed === null,
      note: f.mandatoryListed === null
        ? b('Is the item on the Mandatory List of National Products? ISC does not guess.', 'هل البند ضمن قائمة المنتجات الوطنية الإلزامية؟ لا تخمّن ISC.')
        : b('Not on the Mandatory List: the alternatives count unchanged.', 'ليس ضمن القائمة الإلزامية: يبقى عدد البدائل كما هو.'),
    };
  }
  if (f.nationalAlternatives === null || qualifiedAlternatives === null) {
    return {
      effectiveAlternatives: null, reducedBy: 0, ask: true,
      note: b('Listed item: how many of the qualified alternatives are eligible national products? Non-compliant bids may be excluded.', 'بند مدرج: كم من البدائل المؤهَّلة منتج وطني مؤهل؟ فقد تُستبعد العروض غير المطابقة.'),
    };
  }
  const eff = Math.min(qualifiedAlternatives, Math.max(0, Math.floor(f.nationalAlternatives)));
  return {
    effectiveAlternatives: eff, reducedBy: qualifiedAlternatives - eff, ask: false,
    note: b(
      `Listed item: ${eff} of ${qualifiedAlternatives} alternatives are eligible. Use ${eff} as the supply-risk input. This effect is ISC inference.`,
      `بند مدرج: ${eff} من ${qualifiedAlternatives} بدائل مؤهلة. استخدم ${eff} مدخلًا لخطر الإمداد. هذا الأثر استنتاج من ISC.`,
    ),
  };
}

// (c) Price preference, dated and per country ---------------------------------

export interface PricePreference {
  key: string;
  country: Bilingual;
  valuePct: number;
  rule: Bilingual;
  source: string;
  status: SourceStatus;
  reviewedOn: string;
  dateNote: Bilingual;
}

export const PRICE_PREFERENCES: PricePreference[] = [
  {
    key: 'sa-lcgpa', country: b('Saudi Arabia', 'السعودية'), valuePct: 10,
    rule: b('Foreign bid price is treated as 10% higher when evaluating against local products.', 'يُعامَل سعر العرض الأجنبي كأنه أعلى بنسبة 10% عند التقييم مقابل المنتجات المحلية.'),
    source: 'Argaam (LCGPA price preference)', status: 'secondary', reviewedOn: GCC_REVIEWED_ON,
    dateNote: b('Publication date of the source not captured: confirm with LCGPA.', 'لم يُسجَّل تاريخ نشر المصدر: تأكد من الهيئة.'),
  },
  {
    key: 'jo-industrial', country: b('Jordan', 'الأردن'), valuePct: 20,
    rule: b('Price preference for local industrial products, raised from 15% to 20%.', 'أفضلية سعرية للمنتجات الصناعية المحلية، رُفعت من 15% إلى 20%.'),
    source: 'Jordan Times', status: 'secondary', reviewedOn: GCC_REVIEWED_ON,
    dateNote: b('The date is not on the fetched text and Law 28/2019 was not opened: verify.', 'التاريخ غير ظاهر في النص المسترجع ولم يُفتح القانون 28/2019: تحقق.'),
  },
];

/** Evaluation price after a preference: foreign price uplifted by pct. Invalid input returns null. */
export function evaluationPrice(foreignPrice: number, pct: number): number | null {
  if (!Number.isFinite(foreignPrice) || !Number.isFinite(pct) || foreignPrice < 0 || pct < 0) return null;
  return Math.round(foreignPrice * (1 + pct / 100) * 100) / 100;
}

/** Claims ISC must not make: not confirmed by any opened source. */
export const NOT_CONFIRMED: Bilingual[] = [
  b('A Qatar 15% domestic price preference.', 'أفضلية سعرية محلية قطرية بنسبة 15%.'),
  b('A Saudi 35% SME procurement quota (35% is a GDP-share target).', 'حصة سعودية 35% للمنشآت الصغيرة والمتوسطة في المشتريات (نسبة 35% مستهدف لحصة الناتج المحلي).'),
  b('IKTVA tiers or a minimum IKTVA score.', 'مستويات برنامج «اكتفا» أو حد أدنى لدرجته.'),
  b('A UAE "10% unscored vendor" rule.', 'قاعدة إماراتية بشأن «10% للمورد غير المقيَّم».'),
];

// (d) Planning gate ------------------------------------------------------------

export const PLANNING_GATE = {
  text: b(
    'Before a government tender, coordinate with LCGPA on local content in the advance procurement plan (Art. 12(2) per CMS summary).',
    'قبل المنافسة الحكومية، نسّق مع هيئة المحتوى المحلي والمشتريات الحكومية بشأن المحتوى المحلي في خطة المشتريات المسبقة (المادة 12(2) وفق ملخص CMS).',
  ),
  status: b('Pending in-force confirmation of the new law.', 'بانتظار تأكيد نفاذ النظام الجديد.'),
  source: 'CMS, 20 Oct 2026 (secondary)',
};

// (e) Method ladder (Saudi only: the only ladder captured) ----------------------

export type SaMethod = 'public-tender' | 'limited-tender' | 'direct' | 'framework' | 'negotiation';

export const SA_DIRECT_CEILING_SAR = 1_000_000;

export const SA_METHOD_LADDER: Array<{ key: SaMethod; label: Bilingual; rule: Bilingual; article: string }> = [
  { key: 'public-tender', label: b('Public tender (default)', 'منافسة عامة (الأصل)'), rule: b('The default method.', 'الطريقة الأصلية.'), article: 'Art. 28' },
  { key: 'limited-tender', label: b('Limited tender', 'منافسة محدودة'), rule: b('Only with recorded reasons.', 'بمسوّغات مسجَّلة فقط.'), article: 'per CMS summary' },
  { key: 'direct', label: b('Direct procurement', 'شراء مباشر'), rule: b('Up to SAR 1,000,000.', 'حتى 1,000,000 ريال.'), article: 'Art. 32' },
  { key: 'framework', label: b('Framework agreement', 'اتفاقية إطارية'), rule: b('Allowed as a method.', 'مسموح بها كطريقة.'), article: 'Art. 58' },
  { key: 'negotiation', label: b('Negotiation', 'تفاوض'), rule: b('Triggered when the best bid exceeds the estimate plus contingency.', 'تُفعَّل عندما يتجاوز أفضل عرض التقدير مضافًا إليه الاحتياطي.'), article: 'Art. 45' },
];

export interface MethodCheck { ok: boolean; message: Bilingual }

/** Does a planned method fit the Saudi ladder? Other jurisdictions: the ladder was not captured. */
export function methodCheck(j: Jurisdiction, method: SaMethod, estimatedValueSar: number | null, hasReasons: boolean): MethodCheck {
  if (j !== 'saudi-gov') {
    return { ok: true, message: rulesVisible(j) ? b('Method ladder not captured for this country yet: check the local law.', 'لم تُسجَّل سلّم طرق الشراء لهذا البلد بعد: راجع النظام المحلي.') : b('Private sector: no method ladder applies.', 'القطاع الخاص: لا ينطبق سلّم طرق شراء.') };
  }
  if (method === 'direct') {
    if (estimatedValueSar === null || !Number.isFinite(estimatedValueSar)) return { ok: false, message: b('Enter the estimated value: direct procurement has a SAR 1,000,000 ceiling (Art. 32).', 'أدخل القيمة التقديرية: للشراء المباشر سقف 1,000,000 ريال (المادة 32).') };
    if (estimatedValueSar > SA_DIRECT_CEILING_SAR) return { ok: false, message: b('Above the SAR 1,000,000 direct-procurement ceiling: use another method (Art. 32).', 'أعلى من سقف الشراء المباشر 1,000,000 ريال: استخدم طريقة أخرى (المادة 32).') };
  }
  if (method === 'limited-tender' && !hasReasons) return { ok: false, message: b('A limited tender needs recorded reasons.', 'المنافسة المحدودة تتطلب مسوّغات مسجَّلة.') };
  return { ok: true, message: b('Within the ladder. Negotiation tactics must stay inside the chosen method.', 'ضمن السلّم. يجب أن تبقى تكتيكات التفاوض داخل الطريقة المختارة.') };
}

// (f) Contract-clause parameters -----------------------------------------------

export const SA_CLAUSE_PARAMS: Array<{ key: string; label: Bilingual; value: string; article: string }> = [
  { key: 'final-guarantee', label: b('Final guarantee', 'الضمان النهائي'), value: '5%', article: 'Art. 59' },
  { key: 'delay-cap', label: b('Delay penalty cap', 'الحد الأقصى لغرامة التأخير'), value: '15%', article: 'Art. 70' },
  { key: 'delay-cap-supply', label: b('Delay penalty cap, supply contracts', 'الحد الأقصى لغرامة التأخير في عقود التوريد'), value: '6%', article: 'Art. 70' },
];

export const SA_LAW_NOTE: Bilingual = b(
  'Per a law-firm summary (CMS, 20 Oct 2026) of the new Government Tenders and Procurement Law (Royal Decree M/76). Article numbers are not from the law text. In-force status is not confirmed: it enters into force 120 days after Gazette publication and the publication date was not found. Verify against the law text and a legal reviewer.',
  'وفق ملخص مكتب محاماة (CMS، 20 أكتوبر 2026) لنظام المنافسات والمشتريات الحكومية الجديد (المرسوم الملكي م/76). أرقام المواد ليست من نص النظام. حالة النفاذ غير مؤكدة: يبدأ النفاذ بعد 120 يومًا من النشر في الجريدة الرسمية ولم يُعثر على تاريخ النشر. تحقق من نص النظام ومن مراجع قانوني.',
);

/** Summary tags for a supplier, for display. Only the attributes that are set. */
export function supplierTags(f: GccFacts): Bilingual[] {
  const s = f.supplier; const t: Bilingual[] = [];
  if (s.national === true) t.push(b('National', 'وطني'));
  if (s.sme === true) t.push(b('SME', 'منشأة صغيرة أو متوسطة'));
  if (s.listed === true) t.push(b('Listed company', 'شركة مدرجة'));
  if (s.localContentCertificate === true) t.push(b('Local-content certificate', 'شهادة محتوى محلي'));
  if (s.iktvaScore !== null) t.push(b(`IKTVA score ${s.iktvaScore}`, `درجة اكتفا ${s.iktvaScore}`));
  if (s.uaeIcv !== null) t.push(b(`UAE ICV ${s.uaeIcv}`, `القيمة المحلية المضافة الإماراتية ${s.uaeIcv}`));
  if (s.qatarIcv !== null) t.push(b(`Qatar ICV ${s.qatarIcv}`, `القيمة المحلية المضافة القطرية ${s.qatarIcv}`));
  if (s.omanJsrs === true) t.push(b('Oman JSRS', 'JSRS العُمانية'));
  return t;
}
