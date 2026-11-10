// tierStrings.ts -- label table for the ISC Confidence tier badge (spec X-01, sections 6.15A and 6.15B).
//
// Source of every string: ISC_Super_MD_E4 spec v3.8 section 6.15A string table (keys tier.*, 25 keys),
// as extracted by scripts/extract-spec-strings.py into fixtures/spec_tier_strings.json (spec file SHA-256 recorded there).
// Arabic status: owner-delegated, back-translated, REVIEWED, NOT CERTIFIED. Professional proofreading is gate RG-09 (postponed by the owner).
// DO NOT edit these strings here without a spec change: tierStrings.test.ts compares every one with the fixture.
//
// Owner decisions 9-10 Nov 2026 (delegated, settled): (a) INSUFFICIENT_DATA keeps the extra reason line under the Tier 3 label and prompt
// ('insufficient' below); (b) the Arabic for "V level" stays مستوى التحقق من المصدر, which is Glossary v8 entry G-367 (already the glossary term).
// Arabic stays 'reviewed, not certified' (RG-09 postponed). No string text changed by these decisions; tierDecisions.test.ts locks them.
//
// Placeholders are in square brackets, as in the spec; the badge replaces them at display time.

export type Lang = 'en' | 'ar';
export type TierNumber = 1 | 2 | 3;

export interface Bilingual {
  en: string;
  ar: string;
}

/** Strings of the spec table (English and Arabic). */
export const TIER_STRINGS = {
  't1': { en: 'Tier 1: Certain', ar: 'المستوى الأول: مؤكد' },
  't2': { en: 'Tier 2: Reviewed and corrected by ISC, please confirm before relying on it', ar: 'المستوى الثاني: راجعته ISC وصوبته، يرجى التأكد قبل الاعتماد عليه' },
  't3': { en: 'Tier 3: Cannot confirm. Specialist or legal expert opinion required', ar: 'المستوى الثالث: تعذر التأكد، يتطلب رأي مختص أو خبير قانوني' },
  't2_prompt': { en: 'Please confirm this with an expert.', ar: 'يرجى التأكد من ذلك مع خبير.' },
  't3_prompt': { en: 'Specialist or legal expert opinion required. Please check with an expert.', ar: 'يتطلب رأي مختص أو خبير قانوني. يرجى الرجوع إلى خبير.' },
  't1_by': { en: 'Confirmed by [name, role], [date]', ar: 'أكده [الاسم، الصفة] بتاريخ [التاريخ]' },
  't1_source': { en: 'Source opened by ISC: [source], [date]', ar: 'اطلعت ISC على المصدر: [المصدر]، [التاريخ]' },
  'na': { en: 'Not applicable (no confidence tier for this row)', ar: 'لا ينطبق' },
  'field_tier': { en: 'Confidence tier', ar: 'مستوى الثقة' },
  'choose': { en: 'Choose a confidence tier', ar: 'اختر مستوى الثقة' },
  'field_basis': { en: 'Basis', ar: 'الأساس' },
  't3_guidance': { en: 'ISC cannot verify this. Possible answers are shown with their sources. Please check with an expert.', ar: 'تعذر على ISC التحقق من هذا. الإجابات المحتملة ومصادرها معروضة أدناه. يرجى الرجوع إلى خبير.' },
  'none': { en: 'No tier on this output', ar: 'لا يوجد مستوى ثقة لهذا المخرج' },
  'never_certifies': { en: 'ISC output is not legal, tax, insurance, sanctions, security or accessibility advice or certification', ar: 'مخرجات ISC ليست استشارة قانونية أو ضريبية أو تأمينية أو أمنية أو في مجال العقوبات أو إمكانية الوصول، وليست شهادة امتثال' },
  'possible_answers': { en: 'Possible answers', ar: 'الإجابات المحتملة' },
  'source_label': { en: 'Source', ar: 'المصدر' },
  'vlevel_label': { en: 'V level', ar: 'مستوى التحقق من المصدر' },
  'insufficient': { en: 'Insufficient data to confirm a confidence tier.', ar: 'بيانات غير كافية للتأكد من مستوى الثقة.' },
  'close': { en: 'Close', ar: 'إغلاق' },
} as const satisfies Record<string, Bilingual>;

/** Screen-reader sentences (tier.sr_t1..3). Each contains the visible label of its tier exactly (WCAG 2.5.3, ARQ-23). [basis] / [الأساس] is replaced by the record's basis. */
export const SR_STRINGS = {
  'sr_t1': { en: 'Confidence tier: Tier 1: Certain. [basis].', ar: 'مستوى الثقة: المستوى الأول: مؤكد. [الأساس].' },
  'sr_t2': { en: 'Confidence tier: Tier 2: Reviewed and corrected by ISC, please confirm before relying on it. Please confirm this with an expert.', ar: 'مستوى الثقة: المستوى الثاني: راجعته ISC وصوبته، يرجى التأكد قبل الاعتماد عليه. يرجى التأكد من ذلك مع خبير.' },
  'sr_t3': { en: 'Confidence tier: Tier 3: Cannot confirm. Specialist or legal expert opinion required. Please check with an expert.', ar: 'مستوى الثقة: المستوى الثالث: تعذر التأكد، يتطلب رأي مختص أو خبير قانوني. يرجى الرجوع إلى خبير.' },
} as const satisfies Record<string, Bilingual>;

/** Short badges (tier.t1_short..3). A display form for narrow screens and table cells: this package exports the strings and the accessible-name rule (shortBadgeName) but does NOT render the short variant yet. */
export const SHORT_STRINGS = {
  't1_short': { en: 'Tier 1: Certain', ar: 'المستوى 1: مؤكد' },
  't2_short': { en: 'Tier 2: Reviewed by ISC, please confirm before relying', ar: 'المستوى 2: راجعته ISC، يرجى التأكد قبل الاعتماد' },
  't3_short': { en: 'Tier 3: Cannot confirm', ar: 'المستوى 3: تعذر التأكد' },
} as const satisfies Record<string, Bilingual>;

/** Gaps G1..G8 of Build Report v1, all closed by spec v3.8 (defect SD-66, section 6.15B). Kept as a record, nothing is needed from the spec any more. */
export const RESOLVED_GAPS = [
  { id: 'G1', was: 'no string for the possible-answers heading', now: 'tier.possible_answers' },
  { id: 'G2', was: 'no Source label, no V level label', now: 'tier.source_label, tier.vlevel_label' },
  { id: 'G3', was: 'no message for INSUFFICIENT_DATA', now: 'tier.insufficient; display rule 2 of 6.15B' },
  { id: 'G4', was: 'no English short badges', now: 'tier.t1_short .. tier.t3_short (English written)' },
  { id: 'G5', was: 'no key for the Close button', now: 'tier.close' },
  { id: 'G6', was: 'sr sentences did not contain the visible label (Tier 2 Arabic lacked وصوبته; comma for colon in all three)', now: 'tier.sr_t1..3 corrected; the label-prepend workaround is removed' },
  { id: 'G7', was: 'tier.t3_guidance says "below" in Arabic only', now: 'unchanged text; the possible answers stay below the sentence' },
  { id: 'G8', was: 'English screen-reader sentences only in Arabic Recheck v4', now: 'English strings in tier.sr_t1..3' },
] as const;

export const FORBIDDEN_TIER2_EN = ['certain', 'confirmed', 'verified', 'proven', 'approved', 'cleared', 'compliant'] as const;
/** Arabic forbidden words (spec test 259), stored without diacritics; matching strips diacritics first. */
export const FORBIDDEN_TIER2_AR = ['مؤكد', 'معتمد', 'موثق'] as const;

export function t(key: keyof typeof TIER_STRINGS, lang: Lang): string {
  return TIER_STRINGS[key][lang];
}

export function labelKey(tier: TierNumber): 't1' | 't2' | 't3' {
  return `t${tier}` as 't1' | 't2' | 't3';
}
