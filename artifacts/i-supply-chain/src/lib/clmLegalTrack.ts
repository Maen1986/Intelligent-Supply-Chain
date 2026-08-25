/**
 * clmLegalTrack.ts
 *
 * Module 01 (Contract Intelligence v10, Legal & Jurisdiction Framework,
 * Decision Record 8.8) -- governing-law recognition for the CLM contract
 * register.
 *
 * Tier 0 (unchanged since v1): Saudi/GCC dual track -- government
 * counterparty -> Saudi GTPL + MOF/Etimad standard forms; private
 * counterparty -> Saudi Civil Transactions Law (CTL, Royal Decree M/191),
 * which stays the substantive law even in nominally CISG-governed
 * international sale-of-goods contracts (Saudi excluded CISG Part III).
 *
 * Tier 1 (new in v10): four secondary/comparative international tracks a
 * cross-border contract may reference alongside the Saudi anchor -- UK
 * common law, US UCC Article 2, EU civil law (PECL), and full-form CISG
 * (Parts II+III, for a genuinely non-Saudi cross-border goods contract).
 *
 * This is T1 pure conditional logic, same spirit as CLMTools.tsx's existing
 * claimableRebate() -- no AI, no invented jurisdictions, a directional
 * review flag from self-reported free text (Decision Record 8.7: never
 * present an uncertain match as a certain compliance verdict).
 */

export type GoverningLawTrack =
  | 'saudi-ctl' | 'saudi-gtpl' | 'uk-common-law' | 'us-ucc'
  | 'eu-pecl' | 'cisg-full' | 'other' | '';

export interface GoverningLawTrackMeta {
  id: GoverningLawTrack;
  label: string;
  labelAr: string;
  /** Lowercase keywords tested against counterpartyJurisdiction /
   *  performanceLocation free text. Empty for tracks with no single home
   *  jurisdiction (CISG full-form applies between two non-Saudi Contracting
   *  States; "Other" is unspecified by design). */
  jurisdictionKeywords: string[];
}

export const GOVERNING_LAW_TRACKS: GoverningLawTrackMeta[] = [
  { id: 'saudi-ctl', label: 'Saudi Civil Transactions Law (private counterparty)', labelAr: 'نظام المعاملات المدنية السعودي (طرف خاص)', jurisdictionKeywords: ['saudi', 'ksa', 'kingdom of saudi arabia'] },
  { id: 'saudi-gtpl', label: 'Saudi GTPL / MOF-Etimad (government counterparty)', labelAr: 'نظام المنافسات والمشتريات الحكومية / اعتماد (طرف حكومي)', jurisdictionKeywords: ['saudi', 'ksa', 'kingdom of saudi arabia'] },
  { id: 'uk-common-law', label: 'UK / Commonwealth common law', labelAr: 'القانون العام البريطاني / الكومنولث', jurisdictionKeywords: ['uk', 'united kingdom', 'england', 'britain', 'commonwealth'] },
  { id: 'us-ucc', label: 'US UCC Article 2 (Sale of Goods)', labelAr: 'القانون التجاري الموحد الأمريكي (المادة 2 -- بيع البضائع)', jurisdictionKeywords: ['us', 'usa', 'united states', 'america'] },
  { id: 'eu-pecl', label: 'EU civil law (Principles of European Contract Law)', labelAr: 'القانون المدني الأوروبي (مبادئ قانون العقود الأوروبي)', jurisdictionKeywords: ['eu', 'europe', 'european union', 'germany', 'france', 'italy', 'spain', 'netherlands'] },
  { id: 'cisg-full', label: 'CISG, full form (non-Saudi cross-border goods contract)', labelAr: 'اتفاقية البيع الدولي للبضائع (الصيغة الكاملة -- عقد بضائع عابر للحدود بين طرفين غير سعوديين)', jurisdictionKeywords: [] },
  { id: 'other', label: 'Other / not specified', labelAr: 'أخرى / غير محدد', jurisdictionKeywords: [] },
];

export function governingLawTrackLabel(track: GoverningLawTrack, isAr: boolean): string {
  const meta = GOVERNING_LAW_TRACKS.find((t) => t.id === track);
  if (!meta) return '';
  return isAr ? meta.labelAr : meta.label;
}

export interface JurisdictionCheck {
  flagged: boolean;
  reasonEn: string;
  reasonAr: string;
}

const SAUDI_KEYWORDS = ['saudi', 'ksa', 'kingdom of saudi arabia'];

function mentionsAny(text: string | undefined, keywords: string[]): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

/**
 * Directional review flag (not a compliance verdict): flags when the stated
 * governing-law track's home jurisdiction matches neither the counterparty's
 * jurisdiction, nor the performance location, nor Saudi Arabia (the
 * platform's always-relevant anchor). A flag does not mean the choice is
 * wrong -- parties can validly choose a neutral third-country law -- it is
 * an unusual-enough pattern to be worth a review, same spirit as Module 04's
 * pricing misuse-flags.
 */
export function checkGoverningLawMismatch(
  governingLawClause: GoverningLawTrack | undefined,
  counterpartyJurisdiction: string | undefined,
  performanceLocation: string | undefined,
): JurisdictionCheck {
  const notFlagged: JurisdictionCheck = { flagged: false, reasonEn: '', reasonAr: '' };

  if (!governingLawClause || governingLawClause === 'other' || governingLawClause === 'cisg-full') {
    // No single home jurisdiction to compare against for these tracks.
    return notFlagged;
  }

  const meta = GOVERNING_LAW_TRACKS.find((t) => t.id === governingLawClause);
  if (!meta || meta.jurisdictionKeywords.length === 0) return notFlagged;

  const matchesTrack = mentionsAny(counterpartyJurisdiction, meta.jurisdictionKeywords) || mentionsAny(performanceLocation, meta.jurisdictionKeywords);
  const matchesSaudi = mentionsAny(counterpartyJurisdiction, SAUDI_KEYWORDS) || mentionsAny(performanceLocation, SAUDI_KEYWORDS);

  if (matchesTrack || matchesSaudi) return notFlagged;

  // Nothing to compare against at all -- both fields blank -- not enough
  // information to flag, not a mismatch.
  if (!counterpartyJurisdiction && !performanceLocation) return notFlagged;

  return {
    flagged: true,
    reasonEn: `Governing law is ${meta.label}, but neither the counterparty's jurisdiction nor the performance location mentions it (or Saudi Arabia). Not necessarily wrong -- parties can validly choose a neutral third-country law -- worth a review.`,
    reasonAr: `القانون الحاكم هو ${meta.labelAr}، إلا أن ولاية الطرف المقابل ولا موقع التنفيذ يشيران إليه (أو إلى السعودية). ليس بالضرورة خطأً -- يجوز للأطراف اختيار قانون دولة ثالثة محايدة بشكل صحيح -- لكنه يستحق المراجعة.`,
  };
}
