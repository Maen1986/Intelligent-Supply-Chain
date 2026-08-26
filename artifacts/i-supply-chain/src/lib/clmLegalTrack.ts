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
 * recommendedPractice / recommendedPracticeAr (NEW, 26 Aug 2026, owner
 * question: "what will ISC recommend to clients as facts and real
 * practice" for GCC/Jordan contracts): a short, sourced, real-world
 * practice note -- standard dispute-resolution forum, language/notarization
 * conventions, and any live legal-reform developments worth flagging --
 * populated on the seven GCC/Jordan tracks (uae-ctl, uae-difc-adgm,
 * qatar-civil, bahrain-civil, oman-civil, kuwait-civil, jordan-civil) added
 * in Tier 0b above. Deliberately left undefined on every other track
 * (saudi-*, uk-*, us-ucc, eu-pecl, cisg-full, other): this is advisory
 * content, not jurisdiction recognition, so per Decision Record 8.7 it is
 * only populated where actually researched this pass, never inferred by
 * pattern-matching from a track that does have one. Two honest scope notes
 * carried in the field content itself rather than silently omitted:
 * Qatar's Arabic-language contract-drafting convention was not confirmed to
 * the same depth as UAE/Saudi this pass; Jordan's proposed Jordan
 * Arbitration Centre (JAC) is, as of 26 Aug 2026, a draft law -- not yet
 * enacted -- so the Amman Chamber of Commerce Arbitration Center (ACAC)
 * remains the current real-world recommendation until/unless that changes.
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
  /** Real-world practice recommendation (dispute-resolution forum, language/
   *  notarization convention, live legal-reform notes) -- undefined unless
   *  actually researched and sourced for this track (Decision Record 8.7:
   *  never fabricate advisory content). See header comment. */
  recommendedPractice?: string;
  recommendedPracticeAr?: string;
}

export const GOVERNING_LAW_TRACKS: GoverningLawTrackMeta[] = [
  { id: 'saudi-ctl', label: 'Saudi Civil Transactions Law (private counterparty)', labelAr: 'نظام المعاملات المدنية السعودي (طرف خاص)', jurisdictionKeywords: ['saudi', 'ksa', 'kingdom of saudi arabia'] },
  { id: 'saudi-gtpl', label: 'Saudi GTPL / MOF-Etimad (government counterparty)', labelAr: 'نظام المنافسات والمشتريات الحكومية / اعتماد (طرف حكومي)', jurisdictionKeywords: ['saudi', 'ksa', 'kingdom of saudi arabia'] },
  // UAE onshore: Federal Decree-Law No. 25 of 2025 (Civil Transactions Law),
  // in force 1 Jun 2026, repealing and replacing Federal Law No. 5 of 1985.
  {
    id: 'uae-ctl', label: 'UAE Civil Transactions Law (onshore -- Federal Decree-Law No. 25/2025)', labelAr: 'قانون المعاملات المدنية الإماراتي (البر الرئيسي -- المرسوم بقانون اتحادي رقم 25 لسنة 2025)',
    jurisdictionKeywords: ['uae', 'united arab emirates', 'dubai', 'abu dhabi', 'sharjah', 'ajman', 'fujairah', 'ras al khaimah', 'umm al quwain', 'emirates'],
    recommendedPractice: "Recommended real-world practice: state the governing-law choice explicitly (UAE Civil Transactions Law, Federal Decree-Law No. 25/2025, in force 1 Jun 2026) rather than relying on silence, since silence now defaults to this law for contracts executed after that date. Standard dispute-resolution forum: DIAC for Dubai-seated matters, or arbitrateAD for Abu Dhabi-seated matters (replaced ADCCAC in 2024). Onshore contracts: state that the Arabic text prevails (UAE courts operate in Arabic); best practice is a synchronized bilingual Arabic/English draft prepared in parallel and reviewed by bilingual counsel, not a translation added afterward. Notarization is required only for specific transaction types (commercial agency agreements, business/share transfers, real estate, security instruments) -- not a blanket requirement for a standard MSA or NDA; qualified e-signatures carry equal legal force under the UAE's Trust Services framework.",
    recommendedPracticeAr: "الممارسة العملية الموصى بها: يُنصح بالنص صراحة على اختيار القانون الحاكم (قانون المعاملات المدنية الإماراتي، المرسوم بقانون اتحادي رقم 25 لسنة 2025، ساري اعتباراً من 1 يونيو 2026) بدلاً من الاعتماد على السكوت، لأن السكوت أصبح يعني تطبيق هذا القانون تلقائياً على العقود المبرمة بعد هذا التاريخ. جهة تسوية المنازعات المعتادة: مركز دبي للتحكيم الدولي (DIAC) للعقود التي مقرها دبي، أو مركز أبوظبي للتحكيم (arbitrateAD) للعقود التي مقرها أبوظبي (حلّ محل مركز أبوظبي للتوفيق والتحكيم التجاري عام 2024). بالنسبة للعقود داخل الدولة: يُنصح بالنص على أن النص العربي هو الساري (إذ تُدار محاكم الدولة بالعربية)؛ وأفضل ممارسة هي إعداد نسخة عربية-إنجليزية متزامنة بالتوازي ومراجعتها من مستشار قانوني ثنائي اللغة، لا ترجمة تُضاف لاحقاً. التوثيق (التصديق) مطلوب فقط لأنواع معاملات محددة (عقود الوكالة التجارية، نقل الأعمال أو الحصص، العقارات، أدوات الضمان) -- وليس شرطاً عاماً لاتفاقية إطارية أو اتفاقية عدم إفصاح قياسية؛ وللتوقيع الإلكتروني المعتمد ذات القوة القانونية بموجب إطار خدمات الثقة الإماراتي.",
  },
  // DIFC (Dubai) and ADGM (Abu Dhabi): financial free zones each running
  // their own directly-imported English common law and English-language
  // common-law courts, distinct from onshore UAE civil law.
  {
    id: 'uae-difc-adgm', label: 'UAE DIFC / ADGM common law (financial free zones)', labelAr: 'القانون العام لمركز دبي المالي العالمي / سوق أبوظبي العالمي (مناطق مالية حرة)',
    jurisdictionKeywords: ['difc', 'adgm', 'dubai international financial centre', 'abu dhabi global market'],
    recommendedPractice: "Recommended real-world practice: an opt-in to DIFC or ADGM courts/law must be explicit, clear, and unambiguous in the jurisdiction clause -- vague or inconsistent wording invites disputes over which forum actually applies. Real point of divergence worth flagging: asymmetric jurisdiction clauses (common in international finance agreements) are invalid under onshore UAE law but enforceable in DIFC/ADGM. Liability caps and liquidated-damages figures treated as near-absolute under DIFC/ADGM common law can still be revisited by onshore courts to reflect actual loss if the same relationship is ever read onshore -- worth flagging to the client at drafting stage, not after a dispute arises.",
    recommendedPracticeAr: "الممارسة العملية الموصى بها: يجب أن يكون اختيار الخضوع لاختصاص محاكم أو قانون مركز دبي المالي العالمي (DIFC) أو سوق أبوظبي العالمي (ADGM) صريحاً وواضحاً وغير قابل للَبس في بند الاختصاص -- فالصياغة الغامضة أو غير المتسقة تفتح الباب لنزاعات حول الجهة التي تنطبق فعلياً. نقطة اختلاف حقيقية تستحق التنبيه: بنود الاختصاص غير المتماثلة (شائعة في اتفاقيات التمويل الدولي) باطلة بموجب القانون الإماراتي داخل الدولة، لكنها نافذة ضمن DIFC/ADGM. كما أن حدود المسؤولية ومبالغ التعويض المتفق عليها التي تُعامل باعتبارها شبه نهائية بموجب القانون العام في DIFC/ADGM يمكن أن تعيد المحاكم داخل الدولة النظر فيها لتعكس الضرر الفعلي إذا نُظرت العلاقة ذاتها داخل الدولة في أي وقت -- يستحق التنبيه للعميل عند الصياغة، لا بعد نشوء النزاع.",
  },
  // Qatar Civil Code, Law No. 22 of 2004.
  {
    id: 'qatar-civil', label: 'Qatar Civil Code (Law No. 22 of 2004)', labelAr: 'القانون المدني القطري (القانون رقم 22 لسنة 2004)',
    jurisdictionKeywords: ['qatar'],
    recommendedPractice: "Recommended real-world practice: standard dispute-resolution forum is QICCA (Qatar International Centre for Conciliation and Arbitration), which issued an overhauled rules set in 2024. Qatar is not a CISG Contracting State, so full-form CISG does not apply by default to a Qatar-governed cross-border goods contract. Honest gap: Qatar-specific Arabic-language contract requirements were not confirmed to the same level of detail as UAE/Saudi in this research pass -- flagged as an open item rather than assumed identical, pending further research.",
    recommendedPracticeAr: "الممارسة العملية الموصى بها: جهة تسوية المنازعات المعتادة هي المركز القطري الدولي للتوفيق والتحكيم (QICCA)، الذي أصدر مجموعة قواعد منقّحة بالكامل عام 2024. قطر ليست دولة طرفاً في اتفاقية البيع الدولي للبضائع (CISG)، لذا لا تنطبق الصيغة الكاملة للاتفاقية تلقائياً على عقد بضائع عابر للحدود يخضع للقانون القطري. فجوة يُقر بها بصدق: لم يتم التحقق من متطلبات اللغة العربية الخاصة بقطر في العقود بنفس مستوى التفصيل الذي تم للإمارات والسعودية في هذه الجولة من البحث -- تم تسجيلها كبند مفتوح بدلاً من افتراض تطابقها، ريثما يُستكمل البحث.",
  },
  // Bahrain Civil Code, Legislative Decree No. 19 of 2001. Bahrain is also
  // a full CISG Contracting State (no Part III exclusion on record) -- a
  // Bahrain-Bahrain-or-other-Contracting-State goods contract may separately
  // qualify for the cisg-full track below; this track is Bahrain's own
  // civil code for everything else.
  {
    id: 'bahrain-civil', label: 'Bahrain Civil Code (Legislative Decree No. 19 of 2001)', labelAr: 'القانون المدني البحريني (المرسوم بقانون رقم 19 لسنة 2001)',
    jurisdictionKeywords: ['bahrain'],
    recommendedPractice: "Recommended real-world practice: two standing arbitration institutions are headquartered in Bahrain -- BCDR-AAA (Bahrain Chamber for Dispute Resolution, jointly administered with the American Arbitration Association, 2009 rules) and the GCC Commercial Arbitration Centre (1994 rules, serving the whole GCC region). Bahrain is a full CISG Contracting State with no Part III exclusion on record, so a Bahrain-to-another-Contracting-State cross-border goods contract may separately qualify for this platform's CISG full-form track alongside Bahrain's own civil code.",
    recommendedPracticeAr: "الممارسة العملية الموصى بها: يوجد مقران لمؤسستي تحكيم دائمتين في البحرين -- غرفة البحرين لتسوية المنازعات بالشراكة مع جمعية التحكيم الأمريكية (BCDR-AAA، قواعد عام 2009)، ومركز التحكيم التجاري الخليجي (قواعد عام 1994، ويخدم منطقة الخليج بأكملها). البحرين دولة طرف كاملة العضوية في اتفاقية البيع الدولي للبضائع (CISG) دون استثناء مسجل للباب الثالث منها، لذا فإن عقد بضائع عابر للحدود بين البحرين ودولة طرف أخرى في الاتفاقية قد يستوفي أيضاً بشكل منفصل مسار الاتفاقية الكاملة في هذه المنصة إلى جانب القانون المدني البحريني ذاته.",
  },
  // Oman Civil Transactions Law, Royal Decree 29/2013.
  {
    id: 'oman-civil', label: 'Oman Civil Transactions Law (Royal Decree 29/2013)', labelAr: 'قانون المعاملات المدنية العماني (المرسوم السلطاني رقم 29/2013)',
    jurisdictionKeywords: ['oman'],
    recommendedPractice: "Recommended real-world practice: standard dispute-resolution forum is the OAC (Oman Commercial Arbitration Centre, established Royal Decree 26/2018, with its own rules in force since 6 Dec 2020) for both domestic and international arbitration. The underlying arbitration statute is the Law of Arbitration in Civil and Commercial Disputes (Royal Decree 47/1997), modeled on the UNCITRAL Model Law -- when Oman is the chosen seat, Omani law governs the arbitration procedure and Omani courts hold supervisory jurisdiction over it.",
    recommendedPracticeAr: "الممارسة العملية الموصى بها: جهة تسوية المنازعات المعتادة هي مركز عُمان للتحكيم التجاري (OAC، أُنشئ بموجب المرسوم السلطاني رقم 26/2018، وقواعده الخاصة سارية منذ 6 ديسمبر 2020) للتحكيم المحلي والدولي على حد سواء. القانون الأساسي المنظم للتحكيم هو قانون التحكيم في المنازعات المدنية والتجارية (المرسوم السلطاني رقم 47/1997)، المستوحى من قانون الأونسيترال النموذجي -- وعندما يكون عُمان مقراً مختاراً للتحكيم، يحكم القانون العُماني إجراءات التحكيم وتتولى المحاكم العُمانية الاختصاص الإشرافي عليه.",
  },
  // Kuwait Civil Code, Decree-Law No. 67 of 1980 (replaced the Ottoman
  // Majalla).
  {
    id: 'kuwait-civil', label: 'Kuwait Civil Code (Decree-Law No. 67 of 1980)', labelAr: 'القانون المدني الكويتي (المرسوم بقانون رقم 67 لسنة 1980)',
    jurisdictionKeywords: ['kuwait'],
    recommendedPractice: "Recommended real-world practice: standard dispute-resolution forum is KCAC (Kuwait Commercial Arbitration Centre, established 1999 by the Kuwait Chamber of Commerce and Industry); where KCAC's own rules are silent on a procedural point, the UNCITRAL Arbitration Rules apply by default. Kuwaiti courts issued a notable run of 2024-2025 decisions narrowing the scope of arbitral jurisdiction and clarifying the enforcement of foreign awards -- worth a currency check with local counsel on any Kuwait-seated arbitration clause given the pace of recent case law.",
    recommendedPracticeAr: "الممارسة العملية الموصى بها: جهة تسوية المنازعات المعتادة هي مركز الكويت للتحكيم التجاري (KCAC، أُنشئ عام 1999 من قبل غرفة تجارة وصناعة الكويت)؛ وعند سكوت قواعد المركز عن نقطة إجرائية معينة، تُطبَّق قواعد الأونسيترال للتحكيم تلقائياً. أصدرت المحاكم الكويتية سلسلة لافتة من الأحكام خلال 2024-2025 ضيّقت نطاق الاختصاص التحكيمي ووضّحت آلية تنفيذ الأحكام الأجنبية -- يستحق الأمر مراجعة حداثة أي بند تحكيم مقره الكويت مع مستشار قانوني محلي نظراً لوتيرة الاجتهاد القضائي الأخير.",
  },
  // Jordan Civil Code, Law No. 43 of 1976 (Egyptian-Civil-Code-influenced;
  // replaced Jordan's 1952 code, which had replaced the Ottoman Majalla).
  {
    id: 'jordan-civil', label: 'Jordan Civil Code (Law No. 43 of 1976)', labelAr: 'القانون المدني الأردني (القانون رقم 43 لسنة 1976)',
    jurisdictionKeywords: ['jordan'],
    recommendedPractice: "Recommended real-world practice: the established forum today is the Amman Chamber of Commerce Arbitration Center (ACAC), administering domestic and international cases under Jordan's Arbitration Law No. 31 of 2001 (modeled on the UNCITRAL Model Law). Honest, time-stamped note: a 2026 draft Arbitration Law proposes an independent Jordan Arbitration Centre (JAC) with its own legal personality and a built-in New York Convention enforcement pathway -- as of this research (26 Aug 2026) this is a proposed/draft law, not yet enacted, so ACAC remains the current real-world recommendation; revisit JAC once (and if) the draft law is actually passed.",
    recommendedPracticeAr: "الممارسة العملية الموصى بها: الجهة المعتمدة حالياً هي مركز غرفة تجارة عمان للتحكيم (ACAC)، الذي يدير القضايا المحلية والدولية بموجب قانون التحكيم الأردني رقم 31 لسنة 2001 (المستوحى من قانون الأونسيترال النموذجي). ملاحظة صريحة ومؤرخة: يقترح مشروع قانون تحكيم لعام 2026 إنشاء مركز تحكيم أردني (JAC) مستقل بشخصية اعتبارية خاصة وآلية تنفيذ مدمجة بموجب اتفاقية نيويورك -- وحتى تاريخ هذا البحث (26 أغسطس 2026) لا يزال هذا مشروع قانون مقترحاً ولم يُقرّ بعد، لذا يبقى مركز غرفة عمان (ACAC) هو التوصية العملية الحالية؛ وتجدر إعادة النظر في JAC عند (وإذا) إقرار مشروع القانون فعلياً.",
  },
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

/**
 * Real-world practice recommendation for a governing-law track (dispute
 * forum, language/notarization convention, live legal-reform notes) --
 * returns undefined for tracks where this has not been researched and
 * sourced (Decision Record 8.7: never fabricate advisory content). See the
 * header comment's "recommendedPractice / recommendedPracticeAr" note.
 */
export function governingLawPracticeNote(track: GoverningLawTrack, isAr: boolean): string | undefined {
  const meta = GOVERNING_LAW_TRACKS.find((t) => t.id === track);
  if (!meta) return undefined;
  return isAr ? meta.recommendedPracticeAr : meta.recommendedPractice;
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
