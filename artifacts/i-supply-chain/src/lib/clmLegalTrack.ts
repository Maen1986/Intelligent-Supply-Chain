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
 * Tier 0b (NEW, 26 Aug 2026): named civil-law tracks for the other five GCC
 * states plus Jordan -- ISC's stated GCC/Jordan target market (see
 * ISC_TAM_SAM market-sizing doc and #186 GTM plan), previously only
 * reachable via the generic "Other / not specified" track. Each cites a
 * real, current civil/commercial code (see per-track comments below for
 * sources) -- no jurisdiction is invented or guessed. UAE gets two tracks
 * because it is not legally homogeneous: onshore UAE is civil law, but the
 * DIFC (Dubai) and ADGM (Abu Dhabi) financial free zones each run their own
 * directly-imported English common-law system with their own courts --
 * conflating the two would misrepresent a real and legally significant
 * split, not simplify it.
 *
 * Tier 1 (v10): five secondary/comparative international tracks a
 * cross-border contract may reference alongside the Saudi anchor -- UK
 * common law, UK Sale of Goods Act 1979 (goods-specific, see below), US
 * UCC Article 2, EU civil law (PECL), and full-form CISG (Parts II+III,
 * for a genuinely non-Saudi cross-border goods contract between two CISG
 * Contracting States -- Bahrain is one; UAE, Qatar, Oman, Kuwait and
 * Jordan are not, per the official Pace/UNCITRAL Contracting States list,
 * last updated 5 Dec 2024).
 *
 * uk-sga (NEW, 26 Aug 2026, owner-prompted verification): the UK Sale of
 * Goods Act 1979 sits alongside uk-common-law rather than replacing it --
 * the same relationship us-ucc already has to general US contract law
 * (a goods-specific statute layered on top of, not instead of, general
 * common-law principles). Confirmed current and in force via
 * legislation.gov.uk (checked 26 Aug 2026, "up to date" status as
 * amended, most recently by the Consumer Rights Act 2015 for
 * consumer-to-consumer scope carve-outs -- B2B sale-of-goods terms
 * implied by SGA 1979 ss.12-15 (title, description, satisfactory
 * quality, fitness for purpose, sample) remain the operative default
 * for commercial goods contracts). Its jurisdictionKeywords deliberately
 * exclude "commonwealth": SGA 1979 is a UK-specific Act -- Australia,
 * Canada's provinces, New Zealand and others each have their own,
 * separately-numbered Sale of Goods Acts modeled on the UK's original
 * 1893 Act, not this one, so a bare "Commonwealth" mention should not
 * silently match the UK-specific 1979 citation. The complementary Supply
 * of Goods and Services Act 1982 Part II (implied terms for the services
 * side of a UK B2B contract, also still in force) is documented here as
 * context rather than given its own track, for the same proportionality
 * reason the platform has no separate "US services" track alongside
 * us-ucc.
 *
 * This is T1 pure conditional logic, same spirit as CLMTools.tsx's existing
 * claimableRebate() -- no AI, no invented jurisdictions, a directional
 * review flag from self-reported free text (Decision Record 8.7: never
 * present an uncertain match as a certain compliance verdict).
 *
 * Honest scope note: the riba/interest-flag logic in clmClauseTaxonomy.ts
 * (checkCommercialRibaFlag, checkGovernanceRibaArbitrationFlag) remains
 * Saudi-specific by design and is NOT extended to these new tracks here --
 * whether and how each of these six jurisdictions treats interest-bearing
 * clauses in commercial contract law is a distinct, per-country legal
 * question that was not researched as part of this pass. Flagged as an
 * open item rather than silently assumed to be the same as Saudi's
 * explicit, sourced CISG Part III exclusion.
 */

export type GoverningLawTrack =
  | 'saudi-ctl' | 'saudi-gtpl'
  | 'uae-ctl' | 'uae-difc-adgm' | 'qatar-civil' | 'bahrain-civil'
  | 'oman-civil' | 'kuwait-civil' | 'jordan-civil'
  | 'uk-common-law' | 'uk-sga' | 'us-ucc' | 'eu-pecl' | 'cisg-full' | 'other' | '';

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
  // UAE onshore: Federal Decree-Law No. 25 of 2025 (Civil Transactions Law),
  // in force 1 Jun 2026, repealing and replacing Federal Law No. 5 of 1985.
  { id: 'uae-ctl', label: 'UAE Civil Transactions Law (onshore -- Federal Decree-Law No. 25/2025)', labelAr: 'قانون المعاملات المدنية الإماراتي (البر الرئيسي -- المرسوم بقانون اتحادي رقم 25 لسنة 2025)', jurisdictionKeywords: ['uae', 'united arab emirates', 'dubai', 'abu dhabi', 'sharjah', 'ajman', 'fujairah', 'ras al khaimah', 'umm al quwain', 'emirates'] },
  // DIFC (Dubai) and ADGM (Abu Dhabi): financial free zones each running
  // their own directly-imported English common law and English-language
  // common-law courts, distinct from onshore UAE civil law.
  { id: 'uae-difc-adgm', label: 'UAE DIFC / ADGM common law (financial free zones)', labelAr: 'القانون العام لمركز دبي المالي العالمي / سوق أبوظبي العالمي (مناطق مالية حرة)', jurisdictionKeywords: ['difc', 'adgm', 'dubai international financial centre', 'abu dhabi global market'] },
  // Qatar Civil Code, Law No. 22 of 2004.
  { id: 'qatar-civil', label: 'Qatar Civil Code (Law No. 22 of 2004)', labelAr: 'القانون المدني القطري (القانون رقم 22 لسنة 2004)', jurisdictionKeywords: ['qatar'] },
  // Bahrain Civil Code, Legislative Decree No. 19 of 2001. Bahrain is also
  // a full CISG Contracting State (no Part III exclusion on record) -- a
  // Bahrain-Bahrain-or-other-Contracting-State goods contract may separately
  // qualify for the cisg-full track below; this track is Bahrain's own
  // civil code for everything else.
  { id: 'bahrain-civil', label: 'Bahrain Civil Code (Legislative Decree No. 19 of 2001)', labelAr: 'القانون المدني البحريني (المرسوم بقانون رقم 19 لسنة 2001)', jurisdictionKeywords: ['bahrain'] },
  // Oman Civil Transactions Law, Royal Decree 29/2013.
  { id: 'oman-civil', label: 'Oman Civil Transactions Law (Royal Decree 29/2013)', labelAr: 'قانون المعاملات المدنية العماني (المرسوم السلطاني رقم 29/2013)', jurisdictionKeywords: ['oman'] },
  // Kuwait Civil Code, Decree-Law No. 67 of 1980 (replaced the Ottoman
  // Majalla).
  { id: 'kuwait-civil', label: 'Kuwait Civil Code (Decree-Law No. 67 of 1980)', labelAr: 'القانون المدني الكويتي (المرسوم بقانون رقم 67 لسنة 1980)', jurisdictionKeywords: ['kuwait'] },
  // Jordan Civil Code, Law No. 43 of 1976 (Egyptian-Civil-Code-influenced;
  // replaced Jordan's 1952 code, which had replaced the Ottoman Majalla).
  { id: 'jordan-civil', label: 'Jordan Civil Code (Law No. 43 of 1976)', labelAr: 'القانون المدني الأردني (القانون رقم 43 لسنة 1976)', jurisdictionKeywords: ['jordan'] },
  { id: 'uk-common-law', label: 'UK / Commonwealth common law', labelAr: 'القانون العام البريطاني / الكومنولث', jurisdictionKeywords: ['uk', 'united kingdom', 'england', 'britain', 'commonwealth'] },
  // UK Sale of Goods Act 1979 (as amended) -- goods-specific implied terms
  // (title, description, satisfactory quality, fitness for purpose,
  // sample), sits alongside uk-common-law rather than replacing it, same
  // relationship us-ucc has to general US contract law. UK-specific by
  // design -- see header comment for why "commonwealth" is deliberately
  // excluded from its keywords.
  { id: 'uk-sga', label: 'UK Sale of Goods Act 1979 (B2B goods contracts)', labelAr: 'قانون بيع البضائع البريطاني لعام 1979 (عقود البضائع بين الشركات)', jurisdictionKeywords: ['uk', 'united kingdom', 'england', 'britain', 'scotland', 'wales', 'northern ireland'] },
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
