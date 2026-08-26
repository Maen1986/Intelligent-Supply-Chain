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
 * in Tier 0b above. Two honest scope notes carried in the field content
 * itself rather than silently omitted: Qatar's Arabic-language
 * contract-drafting convention was not confirmed to the same depth as
 * UAE/Saudi this pass; Jordan's proposed Jordan Arbitration Centre (JAC)
 * is, as of 26 Aug 2026, a draft law -- not yet enacted -- so the Amman
 * Chamber of Commerce Arbitration Center (ACAC) remains the current
 * real-world recommendation until/unless that changes.
 *
 * recommendedPractice, round 2 (NEW, 26 Aug 2026, owner follow-up: "what
 * about the rest of the world and dominant and international laws"):
 * extended to the remaining seven tracks -- saudi-ctl, saudi-gtpl,
 * uk-common-law, uk-sga, us-ucc, eu-pecl, cisg-full. At this point "other"
 * was still deliberately undefined. Three more honest scope notes from
 * this round: (1) Saudi's new Government Tenders and Procurement Law was
 * approved by the Council of Ministers 4 Aug 2026 but its implementing
 * regulations were not yet published as of this research -- saudi-gtpl's
 * note describes the still-operative prior framework (Board of
 * Grievances / Minister-of-Finance approval for arbitration) and flags
 * the pending regulations rather than guessing their content; (2)
 * eu-pecl's note leads with a fabrication-adjacent risk rather than
 * papering over it: PECL is academic soft law, not the enacted law of
 * the EU or any member state, so real EU cross-border contracts are
 * governed by a named member state's law under Rome I (EC 593/2008), not
 * PECL itself -- the note says this plainly instead of treating PECL as
 * if it were a normal governing-law choice; (3) us-ucc's note names
 * Louisiana's non-adoption of UCC Article 2 explicitly rather than
 * treating "US law" as internally uniform, since Louisiana sales of
 * movables run on its own Civil Code articles instead.
 *
 * "other" label + recommendedPractice, round 3 (NEW, 26 Aug 2026, owner
 * follow-up on round 2's summary: "1- can you simply define 'other'
 * because it is anonymous word not professional? 2- can we say now all
 * world countries and all continents are covered properly?"): two
 * separate, honest responses, both landing in this same track. First,
 * the label itself changed from the vague "Other / not specified" to
 * "Other / Rest of World (not yet modeled)" -- a real rename, not just a
 * tooltip, since the old label gave a client-facing user no information
 * about what selecting it actually meant. Second, "other" now carries its
 * own recommendedPractice/recommendedPracticeAr -- but this is
 * deliberately NOT a jurisdiction-specific legal-practice note like every
 * other track's (there is no single "other" law to describe); it is an
 * honest disclosure of the platform's own scope boundary: which regions
 * fall into this catch-all (named explicitly -- most of Asia, all of
 * Africa, all of Latin America, Canada, Australia/Oceania) and a
 * recommendation to engage local counsel for any of them, precisely
 * because ISC has not researched them. The answer to the owner's second
 * question is "no" -- this content exists so that "no" is stated plainly
 * in the product itself rather than implied by a vague label. Logged as a
 * new backlog item (full world/continent coverage expansion) rather than
 * silently left as a gap -- see Module 01 doc and site map registry.
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

 *
 * China/India/Egypt/South Africa, wave 1 of world/continent coverage (NEW,
 * 26 Aug 2026, owner-steered: "proceed" on registry #387, "Asia and Africa
 * look like the highest-value candidates"): four named tracks carved out
 * of the "other" catch-all -- China (PRC Civil Code 2021, CIETAC), India
 * (Contract Act 1872 / Sale of Goods Act 1930, MCIA), Egypt (Civil Code
 * Law No. 131 of 1948, CRCICA), and South Africa (Roman-Dutch common law,
 * AFSA). Chosen as a deliberately scoped first wave -- four major,
 * legally-distinct economies, not an attempt at exhaustive Asia/Africa
 * coverage in one pass, consistent with the same anti-vagueness principle
 * that drove the "other" rename in round 3. Each cites a real arbitral
 * institution and a real, current CISG Contracting-State status (China:
 * ratified 1986, Article 96 declaration withdrawn 2013; India and South
 * Africa: confirmed NOT Contracting States; Egypt: acceded 1988, with a
 * disclosed caveat about inconsistent court application). Honest gap:
 * Egypt's Arabic-language contract-drafting and notarization conventions
 * were not confirmed to the same depth as UAE/Saudi this pass -- flagged
 * in-content rather than assumed. Registry #387 remains open for the rest
 * of Asia, the rest of Africa, Latin America, Canada, and Australia/
 * Oceania -- this wave narrows but does not close that gap.
 */

export type GoverningLawTrack =
  | 'saudi-ctl' | 'saudi-gtpl'
  | 'uae-ctl' | 'uae-difc-adgm' | 'qatar-civil' | 'bahrain-civil'
  | 'oman-civil' | 'kuwait-civil' | 'jordan-civil'
  | 'uk-common-law' | 'uk-sga' | 'us-ucc' | 'eu-pecl' | 'cisg-full'
  | 'china-civil' | 'india-contract-act' | 'egypt-civil' | 'south-africa-common-law'
  | 'other' | '';

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
  // Saudi Civil Transactions Law -- private counterparty.
  {
    id: 'saudi-ctl', label: 'Saudi Civil Transactions Law (private counterparty)', labelAr: 'نظام المعاملات المدنية السعودي (طرف خاص)',
    jurisdictionKeywords: ['saudi', 'ksa', 'kingdom of saudi arabia'],
    recommendedPractice: "Recommended real-world practice: standard dispute-resolution forum is the SCCA (Saudi Center for Commercial Arbitration), operating under its 2023 Arbitration Rules (effective 1 May 2023, based on the UNCITRAL Arbitration Rules) with the SCCA Court handling key administrative decisions -- its international caseload has grown steadily since. A contract intended for use within the Kingdom (e.g. for notarization) that is not already in Arabic needs a certified Arabic translation, and a Kingdom-certified legal translator must be present at notarization of a foreign-language document; general commercial contracts (a standard MSA or NDA) do not require notarization to be valid -- mutual consent, given orally, in writing, or by conduct, is enough. Notarization is required only for specific transaction types (power of attorney, agency/franchise agreements, government-entity contracts), handled via the Najiz e-platform (Ministry of Justice), the Ministry of Commerce, or a Chamber of Commerce. Best practice given Saudi courts operate in Arabic: prepare a bilingual Arabic/English draft in parallel rather than translating after the fact, and state which language text prevails.",
    recommendedPracticeAr: "الممارسة العملية الموصى بها: جهة تسوية المنازعات المعتادة هي مركز التحكيم التجاري السعودي (SCCA)، الذي يعمل بموجب قواعد التحكيم لعام 2023 (سارية اعتباراً من 1 مايو 2023، ومستوحاة من قواعد الأونسيترال للتحكيم)، وتتولى \"محكمة SCCA\" اتخاذ القرارات الإدارية الرئيسية -- وقد شهد عدد القضايا الدولية لديه نمواً مطرداً منذ ذلك الحين. أي عقد يُراد استخدامه داخل المملكة (كالتوثيق مثلاً) وليس محرراً أصلاً بالعربية يستلزم ترجمة عربية معتمدة، ويجب حضور مترجم قانوني معتمد من المملكة عند توثيق مستند بلغة أجنبية؛ أما العقود التجارية العامة (كاتفاقية إطارية أو اتفاقية عدم إفصاح قياسية) فلا تستلزم التوثيق لتكون صحيحة -- إذ يكفي التراضي، سواء كان شفهياً أو كتابياً أو بالسلوك. التوثيق مطلوب فقط لأنواع معاملات محددة (الوكالة، عقود الوكالة التجارية/الامتياز، عقود الجهات الحكومية)، ويتم عبر منصة ناجز الإلكترونية (وزارة العدل)، أو وزارة التجارة، أو غرفة تجارية. أفضل ممارسة نظراً لأن المحاكم السعودية تعمل بالعربية: إعداد نسخة عربية-إنجليزية متزامنة بالتوازي بدلاً من الترجمة لاحقاً، مع النص صراحة على النص الذي يسود عند الاختلاف.",
  },
  // Saudi GTPL / MOF-Etimad -- government counterparty.
  {
    id: 'saudi-gtpl', label: 'Saudi GTPL / MOF-Etimad (government counterparty)', labelAr: 'نظام المنافسات والمشتريات الحكومية / اعتماد (طرف حكومي)',
    jurisdictionKeywords: ['saudi', 'ksa', 'kingdom of saudi arabia'],
    recommendedPractice: "Recommended real-world practice, current framework: disputes with a government counterparty default to the Board of Grievances (Diwan Al-Mazalim) within the Saudi court system; arbitration is only available if the Minister of Finance approves it for that specific contract -- do not assume an arbitration clause is enforceable against a government entity without that sign-off. All bidding and procurement runs through the Etimad e-procurement portal (Ministry of Finance, launched 2018). Live legal-reform flag: the Council of Ministers approved a new Government Tenders and Procurement Law on 4 Aug 2026, intended to modernize the prior framework and strengthen transparency and equal opportunity in tenders -- as of this research (26 Aug 2026) implementing regulations had not yet been published, so the Board-of-Grievances/Minister-of-Finance-approval framework above is the current, still-operative practice; revisit once the implementing regulations are published.",
    recommendedPracticeAr: "الممارسة العملية الموصى بها ضمن الإطار الحالي: تُحال المنازعات مع طرف حكومي افتراضياً إلى ديوان المظالم ضمن النظام القضائي السعودي؛ ولا يتاح اللجوء إلى التحكيم إلا بموافقة وزير المالية على ذلك العقد تحديداً -- فلا يُفترض نفاذ بند التحكيم ضد جهة حكومية دون تلك الموافقة. تُدار جميع عمليات المنافسات والمشتريات عبر بوابة اعتماد الإلكترونية (وزارة المالية، أُطلقت عام 2018). تنبيه لتطور تشريعي جارٍ: وافق مجلس الوزراء بتاريخ 4 أغسطس 2026 على نظام جديد للمنافسات والمشتريات الحكومية يهدف إلى تحديث الإطار السابق وتعزيز الشفافية وتكافؤ الفرص في المنافسات -- وحتى تاريخ هذا البحث (26 أغسطس 2026) لم تُنشر بعد اللائحة التنفيذية، لذا يبقى إطار ديوان المظالم/موافقة وزير المالية أعلاه هو الممارسة النافذة حالياً؛ وتجدر إعادة النظر فور نشر اللائحة التنفيذية.",
  },
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
  {
    id: 'uk-common-law', label: 'UK / Commonwealth common law', labelAr: 'القانون العام البريطاني / الكومنولث',
    jurisdictionKeywords: ['uk', 'united kingdom', 'england', 'britain', 'commonwealth'],
    recommendedPractice: "Recommended real-world practice: LCIA (London Court of International Arbitration) and ICC (International Chamber of Commerce, London) are the standard arbitral institutions for English-law commercial disputes; English courts remain the default forum where the contract simply names 'the courts of England and Wales' without an arbitration clause. Live legal-reform note: the Arbitration Act 2025 (in force) added Section 6A, under which the law of the seat now governs the arbitration agreement itself by default unless the parties expressly choose a different law for it -- this mirrors the existing LCIA Rules 2020 default (Rule 16.4) but is a real change from the prior position, and differs from the ICC Rules 2021, which still leave the question to conflict-of-laws principles rather than stating a default. Where the seat of arbitration differs from the contract's chosen governing law, state explicitly which law governs the arbitration agreement itself, not just the contract -- silence used to default one way and now defaults another. The 2025 Act's new Section 41A also formally recognizes emergency-arbitrator procedures (available under both LCIA and ICC rules) and lets an emergency arbitrator issue enforceable peremptory orders.",
    recommendedPracticeAr: "الممارسة العملية الموصى بها: مركز لندن للتحكيم الدولي (LCIA) والغرفة التجارية الدولية (ICC، فرع لندن) هما المؤسستان المعتادتان للتحكيم في المنازعات التجارية الخاضعة للقانون الإنجليزي؛ وتبقى محاكم إنجلترا وويلز الجهة الافتراضية عندما يكتفي العقد بالنص على \"اختصاص محاكم إنجلترا وويلز\" دون بند تحكيم. تطور تشريعي جارٍ: أضاف قانون التحكيم لعام 2025 (النافذ حالياً) المادة 6A، التي بموجبها يحكم قانون مقر التحكيم اتفاق التحكيم ذاته افتراضياً ما لم يختر الطرفان صراحة قانوناً آخر له -- وهذا يطابق الوضع الافتراضي المعمول به أصلاً بموجب قواعد LCIA لعام 2020 (المادة 16.4)، لكنه يمثل تغييراً حقيقياً عن الوضع السابق، ويختلف عن قواعد ICC لعام 2021 التي لا تزال تترك هذه المسألة لمبادئ تنازع القوانين دون تحديد افتراضي. عندما يختلف مقر التحكيم عن القانون الحاكم المختار للعقد، يُنصح بالنص صراحة على القانون الذي يحكم اتفاق التحكيم ذاته وليس العقد فقط -- فالسكوت كان يعني أمراً وأصبح يعني أمراً آخر. كما أن المادة الجديدة 41A من قانون 2025 تعترف رسمياً بإجراءات \"المحكّم الطارئ\" (المتاحة بموجب قواعد كل من LCIA وICC) وتمنحه صلاحية إصدار أوامر إلزامية قابلة للتنفيذ.",
  },
  // UK Sale of Goods Act 1979 (as amended) -- goods-specific implied terms
  // (title, description, satisfactory quality, fitness for purpose,
  // sample), sits alongside uk-common-law rather than replacing it, same
  // relationship us-ucc has to general US contract law. UK-specific by
  // design -- see header comment for why "commonwealth" is deliberately
  // excluded from its keywords.
  {
    id: 'uk-sga', label: 'UK Sale of Goods Act 1979 (B2B goods contracts)', labelAr: 'قانون بيع البضائع البريطاني لعام 1979 (عقود البضائع بين الشركات)',
    jurisdictionKeywords: ['uk', 'united kingdom', 'england', 'britain', 'scotland', 'wales', 'northern ireland'],
    recommendedPractice: "Recommended real-world practice: dispute-resolution forum and the Arbitration Act 2025 changes are the same as the wider uk-common-law track (see that track's note) -- SGA 1979 sits alongside general contract law rather than replacing its dispute-resolution conventions. On the goods-specific content itself: SGA 1979 implies terms into a B2B goods contract by default -- satisfactory quality, fitness for purpose, and correspondence with description -- which the parties may exclude or limit by express contract language, subject to a reasonableness test under the Unfair Contract Terms Act 1977 (a materially higher bar applies if either party is dealing as a consumer, which a B2B MSA should not be). Real drafting practice is to state expressly which SGA implied terms are varied or excluded and why, rather than relying on the statute's defaults by silence -- an exclusion clause that looks reasonable on paper can still fail the 1977 Act's reasonableness test in practice.",
    recommendedPracticeAr: "الممارسة العملية الموصى بها: جهة تسوية المنازعات والتغييرات التي أدخلها قانون التحكيم لعام 2025 هي ذاتها المطبقة على مسار القانون العام البريطاني الأوسع (راجع ملاحظة ذلك المسار) -- إذ يقوم قانون بيع البضائع لعام 1979 إلى جانب القانون العام للعقود دون أن يستبدل أعرافه الخاصة بتسوية المنازعات. أما من حيث المضمون الخاص بالبضائع: يفترض قانون 1979 ضمنياً شروطاً في عقد البضائع بين الشركات ما لم يُنص على خلاف ذلك -- الجودة المرضية، الملاءمة للغرض، ومطابقة الوصف -- ويجوز للطرفين استبعادها أو تقييدها بنص تعاقدي صريح، رهناً باختبار المعقولية بموجب قانون شروط العقود غير المنصفة لعام 1977 (ويُطبَّق معيار أعلى بكثير إذا تعاقد أحد الطرفين بصفته مستهلكاً، وهو ما لا ينبغي أن يكون عليه الحال في اتفاقية إطارية بين شركات). الممارسة الفعلية في الصياغة هي النص صراحة على الشروط الضمنية التي يتم تعديلها أو استبعادها وسببها، بدلاً من الاعتماد على الأحكام الافتراضية للقانون بالسكوت -- فبند الاستبعاد الذي يبدو معقولاً على الورق قد يفشل عملياً أمام اختبار المعقولية بموجب قانون 1977.",
  },
  {
    id: 'us-ucc', label: 'US UCC Article 2 (Sale of Goods)', labelAr: 'القانون التجاري الموحد الأمريكي (المادة 2 -- بيع البضائع)',
    jurisdictionKeywords: ['us', 'usa', 'united states', 'america'],
    recommendedPractice: "Recommended real-world practice: UCC Article 2 is not one uniform federal statute -- each US state enacts its own version, and most states adopt it with only modest local variations, so the governing-law clause should name a specific state (e.g. 'the laws of the State of Delaware'), not just 'United States law.' One state-level exception worth flagging by name: Louisiana has not adopted UCC Article 2 at all -- sales of movables there are governed instead by Louisiana Civil Code Articles 2438-2659, rooted in French and Spanish civil-law tradition rather than the common-law-derived UCC framework used everywhere else in the US; a Louisiana counterparty changes the applicable body of law entirely, not just its details. Standard dispute-resolution forum: the American Arbitration Association (AAA) is the primary forum referenced in US commercial contracts; state the venue explicitly in the arbitration clause, since under AAA practice a party can object to the administrator's default venue and have it changed, which is a real source of delay if left unaddressed at drafting stage.",
    recommendedPracticeAr: "الممارسة العملية الموصى بها: المادة الثانية من القانون التجاري الموحد (UCC) ليست تشريعاً فيدرالياً موحداً واحداً -- إذ تسنّ كل ولاية أمريكية نسختها الخاصة، وتعتمدها معظم الولايات بفروق محلية طفيفة فقط، لذا ينبغي أن يحدد بند القانون الحاكم ولاية بعينها (مثل \"قوانين ولاية ديلاوير\")، لا مجرد \"القانون الأمريكي\". استثناء على مستوى الولايات يستحق التنبيه صراحة: لم تعتمد لويزيانا المادة الثانية من UCC إطلاقاً -- إذ تخضع بيوع المنقولات فيها بدلاً من ذلك لمواد القانون المدني للويزيانا رقم 2438-2659، المستمدة من التقاليد المدنية الفرنسية والإسبانية لا من إطار UCC المستمد من القانون العام المطبق في بقية الولايات الأمريكية؛ فالتعاقد مع طرف من لويزيانا يغيّر المنظومة القانونية المطبقة بالكامل، لا مجرد تفاصيلها. جهة تسوية المنازعات المعتادة: جمعية التحكيم الأمريكية (AAA) هي الجهة الأساسية المشار إليها في العقود التجارية الأمريكية؛ ويُنصح بالنص صراحة على مكان التحكيم ضمن بند التحكيم، إذ يجوز بموجب ممارسات AAA لأي طرف الاعتراض على المكان الافتراضي الذي تحدده الإدارة وتغييره، وهو مصدر تأخير حقيقي إن لم يُعالج عند الصياغة.",
  },
  {
    id: 'eu-pecl', label: 'EU civil law (Principles of European Contract Law)', labelAr: 'القانون المدني الأوروبي (مبادئ قانون العقود الأوروبي)',
    jurisdictionKeywords: ['eu', 'europe', 'european union', 'germany', 'france', 'italy', 'spain', 'netherlands'],
    recommendedPractice: "Honest gap disclosed up front: the Principles of European Contract Law (PECL) are an academic 'soft law' drafting project, not the enacted law of the EU or of any member state -- they were compiled as a first draft toward a possible future European Civil Code that was never adopted as such, and 52 of their first 132 articles are themselves modeled on CISG provisions. Naming PECL alone as a contract's governing law is unusual in real practice and its enforceability that way is untested in most national courts; PECL is realistically used as an interpretive or gap-filling reference, or cited within a 'general principles'/lex mercatoria clause in arbitration, not as a standalone governing-law choice. Recommended real-world practice for an actual EU cross-border contract: choose the national law of a specific EU member state under the freedom of choice granted by the Rome I Regulation (EC 593/2008), and be aware that CISG applies automatically to a goods contract between two CISG Contracting States unless the parties expressly exclude it under CISG Article 6 -- most EU member states are CISG Contracting States (Germany, France, Italy, Netherlands, Spain among them), but the UK notably never ratified it. Standard dispute-resolution forums vary by the member state chosen: ICC Paris and DIS (German Arbitration Institute) are common defaults, alongside country-specific chambers.",
    recommendedPracticeAr: "فجوة تُقر بها بصدق من البداية: مبادئ قانون العقود الأوروبي (PECL) هي مشروع صياغة أكاديمي من \"القانون الرخو\" (soft law)، وليست تشريعاً نافذاً للاتحاد الأوروبي أو لأي دولة عضو فيه -- فقد جُمعت كمسودة أولى نحو قانون مدني أوروبي محتمل لم يُعتمد بهذه الصيغة قط، كما أن 52 من أصل 132 مادة في جزأيها الأولين مستوحاة أصلاً من أحكام اتفاقية البيع الدولي للبضائع (CISG). واختيار PECL وحدها كقانون حاكم للعقد أمر غير مألوف في الممارسة الفعلية، ونفاذها بهذه الصفة لم يُختبر أمام معظم المحاكم الوطنية؛ والاستخدام الواقعي لـPECL هو كمرجع تفسيري أو سادّ للثغرات، أو استشهاد بها ضمن بند \"المبادئ العامة\"/الشريعة التجارية الدولية (lex mercatoria) في التحكيم، لا كاختيار قائم بذاته للقانون الحاكم. الممارسة العملية الموصى بها لعقد أوروبي عابر للحدود فعلي: اختيار القانون الوطني لدولة عضو محددة في الاتحاد الأوروبي بموجب حرية الاختيار التي تمنحها لائحة روما الأولى (EC 593/2008)، مع مراعاة أن اتفاقية CISG تنطبق تلقائياً على عقد بضائع بين دولتين طرفين فيها ما لم يستبعدها الطرفان صراحة بموجب المادة 6 منها -- ومعظم دول الاتحاد الأوروبي أطراف في الاتفاقية (منها ألمانيا وفرنسا وإيطاليا وهولندا وإسبانيا)، لكن المملكة المتحدة لم تصادق عليها قط. جهات تسوية المنازعات المعتادة تختلف بحسب الدولة العضو المختارة: الغرفة التجارية الدولية في باريس (ICC Paris) والمعهد الألماني للتحكيم (DIS) خياران شائعان، إلى جانب الغرف الوطنية الخاصة بكل دولة.",
  },
  {
    id: 'cisg-full', label: 'CISG, full form (non-Saudi cross-border goods contract)', labelAr: 'اتفاقية البيع الدولي للبضائع (الصيغة الكاملة -- عقد بضائع عابر للحدود بين طرفين غير سعوديين)',
    jurisdictionKeywords: [],
    recommendedPractice: "Recommended real-world practice: CISG (97 Contracting States as of 2026) governs contract formation and the parties' substantive rights and obligations for an international goods sale, but it does not itself name a dispute-resolution forum or procedure -- that must be chosen separately, e.g. litigation in a named national court, or arbitration under institutional rules (ICC, UNCITRAL Arbitration Rules) with an explicit seat and language. Pairing a CISG governing-law choice with an explicit dispute-resolution clause matters more than under a national-law contract, since national law at least defaults to that country's courts by default -- CISG leaves the forum question entirely open if the contract is silent. If arbitration is chosen, enforcement of the resulting award relies on the New York Convention (146 signatories as of 2026) -- confirm both parties' countries are signatories at drafting stage, since coverage is wide but not universal. CISG's own default rules can be modified or excluded under Article 6; state explicitly which CISG provisions (if any) the parties are varying or excluding, rather than leaving the scope of application implicit.",
    recommendedPracticeAr: "الممارسة العملية الموصى بها: تحكم اتفاقية البيع الدولي للبضائع (CISG) (97 دولة طرفاً حتى عام 2026) تكوين العقد وحقوق والتزامات الطرفين الجوهرية في بيع دولي للبضائع، لكنها لا تحدد بذاتها جهة أو إجراء تسوية المنازعات -- إذ يجب اختيار ذلك بشكل منفصل، سواء بالتقاضي أمام محكمة وطنية محددة، أو بالتحكيم بموجب قواعد مؤسسية (ICC، أو قواعد الأونسيترال للتحكيم) مع تحديد صريح لمقر التحكيم ولغته. اقتران اختيار CISG كقانون حاكم ببند صريح لتسوية المنازعات أكثر أهمية منه في عقد خاضع لقانون وطني، إذ يفترض القانون الوطني على الأقل اختصاص محاكم تلك الدولة افتراضياً -- بينما تترك CISG مسألة الجهة مفتوحة تماماً إذا سكت العقد عنها. وفي حال اختيار التحكيم، يعتمد تنفيذ الحكم الصادر على اتفاقية نيويورك (146 دولة موقعة حتى عام 2026) -- يُنصح بالتحقق من انضمام دولتي الطرفين إليها عند الصياغة، فتغطيتها واسعة لكنها ليست شاملة. كما يجوز تعديل أو استبعاد القواعد الافتراضية لاتفاقية CISG بموجب المادة 6 منها؛ ويُنصح بالنص صراحة على أحكام CISG التي يعدّلها الطرفان أو يستبعدانها، إن وُجدت، بدلاً من ترك نطاق التطبيق ضمنياً.",
  },
  // Tier 2 (NEW, 26 Aug 2026, owner-steered wave 1 of world/continent
  // coverage expansion, registry #387): four named tracks for major
  // economies previously reachable only via the catch-all "other" track --
  // China and India (Asia), Egypt and South Africa (Africa). Chosen as the
  // highest-value first wave given ISC's stated international ambitions
  // and existing GCC/Jordan trade relevance, not an attempt at exhaustive
  // Asia/Africa coverage in one pass -- see registry #387 for what remains
  // open (most of Asia, most of Africa, Latin America, Canada, Australia).
  {
    id: 'china-civil', label: 'China Civil Code (2021, PRC)', labelAr: 'القانون المدني الصيني (2021، جمهورية الصين الشعبية)',
    jurisdictionKeywords: ['china', 'prc', 'mainland china', "people's republic of china"],
    recommendedPractice: "Recommended real-world practice: standard dispute-resolution forum is CIETAC (China International Economic and Trade Arbitration Commission), the oldest and most recognized Chinese arbitral institution (founded 1956); state the language of arbitration explicitly (English, or bilingual English/Chinese) in the arbitration clause, since CIETAC's default absent agreement is Chinese or a language CIETAC itself designates. Contracts may be drafted in a foreign language, but government filings, administrative approvals, or submission to Chinese courts or local arbitration typically require a certified Chinese translation; where a contract is executed in two or more equally authoritative language versions, Article 466 of the PRC Civil Code (2021) presumes the versions carry the same meaning -- state explicitly which version prevails in case of conflict rather than relying on that presumption. China is a full CISG Contracting State (ratified 1986) and withdrew its Article 96 written-form declaration effective 1 Aug 2013, so an oral or informally-formed international sale-of-goods contract can be valid under CISG even though Chinese domestic practice still favors a signed, stamped written contract bearing the company chop (seal) as the practical mark of authority.",
    recommendedPracticeAr: "الممارسة العملية الموصى بها: جهة تسوية المنازعات المعتادة هي لجنة الصين الدولية للتحكيم الاقتصادي والتجاري (CIETAC)، أقدم وأكثر مؤسسات التحكيم الصينية اعترافاً (تأسست عام 1956)؛ ويُنصح بالنص صراحة على لغة التحكيم (الإنجليزية، أو ثنائية اللغة إنجليزي/صيني) في بند التحكيم، إذ إن اللغة الافتراضية لدى CIETAC عند غياب الاتفاق هي الصينية أو لغة تحددها اللجنة نفسها. يجوز تحرير العقود بلغة أجنبية، لكن الإيداعات الحكومية أو الموافقات الإدارية أو التقاضي أمام المحاكم الصينية أو التحكيم المحلي تستلزم عادة ترجمة صينية معتمدة؛ وعند تحرير العقد بنسختين لغويتين أو أكثر متساويتين في الحجية، تفترض المادة 466 من القانون المدني الصيني (2021) تطابق معنى النسختين -- يُنصح بالنص صراحة على النسخة السائدة عند الاختلاف بدلاً من الاعتماد على هذا الافتراض. الصين دولة طرف كاملة العضوية في اتفاقية البيع الدولي للبضائع (CISG) (صادقت عليها عام 1986) وسحبت إعلانها بشأن اشتراط الشكل الكتابي (المادة 96) اعتباراً من 1 أغسطس 2013، لذا يمكن أن يكون عقد بيع دولي للبضائع شفهياً أو غير رسمي التكوين صحيحاً بموجب CISG رغم أن الممارسة الصينية المحلية لا تزال تفضل عقداً كتابياً موقعاً ومختوماً بختم الشركة الرسمي كعلامة عملية على السلطة.",
  },
  {
    id: 'india-contract-act', label: 'India Contract Act 1872 / Sale of Goods Act 1930', labelAr: 'قانون العقود الهندي لعام 1872 / قانون بيع البضائع لعام 1930',
    jurisdictionKeywords: ['india'],
    recommendedPractice: "Recommended real-world practice: the dispute-resolution forum increasingly used for commercial matters is the MCIA (Mumbai Centre for International Arbitration, founded 2016, 2025 Rules in force), alongside older, still-used domestic institutions; the underlying statute is the Arbitration and Conciliation Act 1996, with Part I governing India-seated arbitration and Part II incorporating the New York Convention regime for enforcing foreign awards. Real, practical drafting point: under the Indian Stamp Act 1899, a commercial contract (including an arbitration agreement) that is not duly stamped is inadmissible as evidence in Indian proceedings -- a curable defect (stamp duty and penalty can be paid later), not automatic invalidity, but worth budgeting for and addressing at signing rather than after a dispute arises. India is not a CISG Contracting State, so full-form CISG does not apply by default to an India-governed cross-border goods contract; the India-specific Sale of Goods Act 1930 (carved out of the Indian Contract Act 1872) governs goods contracts instead.",
    recommendedPracticeAr: "الممارسة العملية الموصى بها: جهة تسوية المنازعات المتزايد استخدامها للمسائل التجارية هي مركز مومباي للتحكيم الدولي (MCIA، تأسس عام 2016، وقواعده لعام 2025 سارية حالياً) إلى جانب المؤسسات المحلية الأقدم التي لا تزال مستخدمة؛ والقانون الأساسي المنظم هو قانون التحكيم والتوفيق لعام 1996، الذي يحكم الجزء الأول منه التحكيم الذي مقره الهند، بينما يتضمن الجزء الثاني نظام اتفاقية نيويورك لتنفيذ الأحكام الأجنبية. نقطة عملية مهمة في الصياغة: بموجب قانون الطوابع الهندي لعام 1899، يكون العقد التجاري (بما في ذلك اتفاق التحكيم) غير المختوم بالطابع المناسب غير مقبول كدليل في الإجراءات الهندية -- وهو عيب قابل للتصحيح (يمكن سداد رسم الطابع والغرامة لاحقاً) وليس بطلاناً تلقائياً، لكنه يستحق التخطيط له ومعالجته عند التوقيع لا بعد نشوء النزاع. الهند ليست دولة طرفاً في اتفاقية البيع الدولي للبضائع (CISG)، لذا لا تنطبق الصيغة الكاملة للاتفاقية تلقائياً على عقد بضائع عابر للحدود يخضع للقانون الهندي؛ ويحكم قانون بيع البضائع الهندي لعام 1930 (المنبثق عن قانون العقود الهندي لعام 1872) عقود البضائع بدلاً من ذلك.",
  },
  {
    id: 'egypt-civil', label: 'Egypt Civil Code (Law No. 131 of 1948)', labelAr: 'القانون المدني المصري (القانون رقم 131 لسنة 1948)',
    jurisdictionKeywords: ['egypt'],
    recommendedPractice: "Recommended real-world practice: standard dispute-resolution forum is CRCICA (Cairo Regional Centre for International Commercial Arbitration), operating under Egypt's International Commercial Arbitration Law No. 27 of 1994; the Civil Code (Law No. 131 of 1948) provides the general contract-law framework, with the Commercial Code (Law No. 17 of 1999) layered on top for commercial-specific matters. Egypt is a full CISG Contracting State (acceded 1 Jan 1988) -- one of five Arab Contracting States -- but application has been inconsistent in practice: Egyptian courts have on occasion applied domestic law instead of CISG even where both parties were in Contracting States, so state the CISG choice explicitly in the contract rather than assuming automatic, uncontested application. Honest gap: Egypt-specific Arabic-language contract-drafting and notarization conventions were not confirmed to the same level of detail as UAE/Saudi in this research pass -- flagged as an open item pending further research rather than assumed identical.",
    recommendedPracticeAr: "الممارسة العملية الموصى بها: جهة تسوية المنازعات المعتادة هي المركز الإقليمي للتحكيم التجاري الدولي بالقاهرة (CRCICA)، الذي يعمل بموجب قانون التحكيم التجاري الدولي المصري رقم 27 لسنة 1994؛ ويوفر القانون المدني (القانون رقم 131 لسنة 1948) الإطار العام لقانون العقود، مع القانون التجاري (القانون رقم 17 لسنة 1999) المطبق فوقه للمسائل التجارية الخاصة. مصر دولة طرف كاملة العضوية في اتفاقية البيع الدولي للبضائع (CISG) (انضمت في 1 يناير 1988) -- وهي إحدى خمس دول عربية أطراف في الاتفاقية -- إلا أن التطبيق كان غير متسق عملياً: فقد طبّقت المحاكم المصرية أحياناً القانون المحلي بدلاً من CISG حتى عندما كان الطرفان في دولتين طرفين في الاتفاقية، لذا يُنصح بالنص صراحة على اختيار CISG في العقد بدلاً من افتراض تطبيقها تلقائياً ودون منازعة. فجوة يُقر بها بصدق: لم يتم التحقق من أعراف صياغة العقود باللغة العربية والتوثيق الخاصة بمصر بنفس مستوى التفصيل الذي تم للإمارات والسعودية في هذه الجولة من البحث -- تم تسجيلها كبند مفتوح ريثما يُستكمل البحث بدلاً من افتراض تطابقها.",
  },
  {
    id: 'south-africa-common-law', label: 'South Africa Roman-Dutch common law', labelAr: 'القانون العام الروماني الهولندي لجنوب أفريقيا',
    jurisdictionKeywords: ['south africa', 'rsa'],
    recommendedPractice: "Recommended real-world practice: standard dispute-resolution forum is AFSA (Arbitration Foundation of Southern Africa, established 1996, headquartered in Sandton/Johannesburg with regional offices in Pretoria, Cape Town, and Durban), offering both Commercial Rules and Expedited Rules; the Association of Arbitrators (Southern Africa) is a secondary option. South Africa's contract law is Roman-Dutch in origin -- distinct from the English common law used in many other African common-law jurisdictions (e.g. Kenya) -- though English remains the primary language of commercial contracting in practice. South Africa is not a CISG Contracting State, so full-form CISG does not apply by default to a South Africa-governed cross-border goods contract; contract formation under South African common law is broadly similar in structure to CISG Part II, but the two are not interchangeable without an explicit choice.",
    recommendedPracticeAr: "الممارسة العملية الموصى بها: جهة تسوية المنازعات المعتادة هي مؤسسة التحكيم لجنوب أفريقيا (AFSA، تأسست عام 1996، ومقرها الرئيسي في ساندتون/جوهانسبرغ مع مكاتب إقليمية في بريتوريا وكيب تاون ودوربان)، وتوفر كلاً من القواعد التجارية والقواعد المعجّلة؛ وتُعد رابطة المحكّمين (جنوب أفريقيا) خياراً ثانوياً. قانون العقود في جنوب أفريقيا رومانيّ-هولنديّ الأصل -- ويختلف عن القانون العام الإنجليزي المطبق في كثير من الدول الأفريقية الأخرى ذات النظام العام (مثل كينيا) -- رغم أن الإنجليزية تبقى اللغة الأساسية للتعاقد التجاري عملياً. جنوب أفريقيا ليست دولة طرفاً في اتفاقية البيع الدولي للبضائع (CISG)، لذا لا تنطبق الصيغة الكاملة للاتفاقية تلقائياً على عقد بضائع عابر للحدود يخضع لقانون جنوب أفريقيا؛ وتكوين العقد بموجب القانون العام لجنوب أفريقيا مشابه إلى حد كبير في بنيته للجزء الثاني من CISG، لكن الاثنين ليسا قابلين للتبادل دون اختيار صريح.",
  },
  // "Other" is the catch-all for any governing law outside every named
  // track above -- a real, honest label change and content addition, 26
  // Aug 2026, owner-prompted ("simply define 'other' because it is
  // anonymous, not professional"). Not a jurisdiction ISC has researched;
  // it is the platform's own scope boundary, disclosed rather than hidden
  // behind a vague label.
  {
    id: 'other', label: 'Other / Rest of World (not yet modeled)', labelAr: 'أخرى / بقية دول العالم (لم تُدرَج تفصيلاً بعد)',
    jurisdictionKeywords: [],
    recommendedPractice: "This track is used when the contract's governing law falls outside every named track above -- i.e. a jurisdiction ISC has not yet researched and modeled in named detail. As of 26 Aug 2026 that means most of Asia (China, India, Japan, Singapore, and others), all of Africa, all of Latin America, Canada, Australia/Oceania, and other jurisdictions beyond Saudi/GCC/Jordan, the UK, the US, the EU, and the multilateral CISG. Selecting this track does not mean no law governs the contract -- it means ISC has not yet built jurisdiction-specific guidance for whichever law does. Recommended practice regardless of jurisdiction: state the governing law and dispute-resolution forum explicitly in the contract rather than leaving it silent, and have qualified local counsel in that jurisdiction confirm applicable law, language, notarization, and dispute-resolution conventions before relying on this platform's general clause guidance.",
    recommendedPracticeAr: "يُستخدم هذا المسار عندما يقع القانون الحاكم للعقد خارج جميع المسارات المسمّاة أعلاه -- أي أنه اختصاص قضائي لم تبحثه ISC ولم تُدرجه بعد بتفصيل مسمّى. حتى تاريخ 26 أغسطس 2026، يشمل ذلك معظم آسيا (الصين، الهند، اليابان، سنغافورة، وغيرها)، وكامل أفريقيا، وكامل أمريكا اللاتينية، وكندا، وأستراليا/أوقيانوسيا، وأي اختصاصات أخرى خارج السعودية/دول الخليج والأردن، والمملكة المتحدة، والولايات المتحدة، والاتحاد الأوروبي، واتفاقية البيع الدولي للبضائع (CISG) متعددة الأطراف. اختيار هذا المسار لا يعني عدم وجود قانون يحكم العقد -- بل يعني أن ISC لم تُنشئ بعد إرشادات خاصة بذلك الاختصاص القضائي المحدد. الممارسة الموصى بها بصرف النظر عن الاختصاص القضائي: النص صراحة على القانون الحاكم وجهة تسوية المنازعات في العقد بدلاً من ترك ذلك دون تحديد، والاستعانة بمستشار قانوني محلي مؤهل في ذلك الاختصاص للتحقق من القانون الواجب التطبيق واللغة والتوثيق وأعراف تسوية المنازعات قبل الاعتماد على إرشادات البنود العامة في هذه المنصة.",
  },
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

/**
 * International Contracting Practice Guide (NEW, 26 Aug 2026, owner-prompted:
 * "research and consider international contracting between GCC, Jordan,
 * Middle East and other continents, what are the most used and common
 * contract laws to be used and highlighted... at the engine"). Distinct in
 * kind from governingLawPracticeNote() above: that function describes what
 * a NAMED jurisdiction's law actually says (a fact sheet, per track). This
 * function describes what governing law and dispute forum parties actually
 * CHOOSE most often in real cross-border contracts connecting the GCC,
 * Jordan, and the wider Middle East to other continents -- a market-practice
 * observation, not a jurisdiction definition and not a recommendation for
 * any specific deal. Sourced to public 2025-2026 industry data: The Law
 * Society of England & Wales' Sept 2025 annual report on the global position
 * of English law; the 2025 Queen Mary University of London / White & Case
 * International Arbitration Survey; and Kayrouz & Associates' 2026 analysis
 * of the 2024-2025 DIFC legislative reforms. Decision Record 8.7 applies:
 * this is real, cited, publicly reported data, not an invented ranking --
 * and it names its own limits (a global/regional pattern is not a
 * substitute for legal advice on any one contract).
 */
export function internationalContractingPracticeGuide(isAr: boolean): string {
  return isAr
    ? "في الممارسة العملية -- هذه ملاحظة عن السوق وليست توصية: يُعد القانون الإنجليزي القانون الحاكم الأكثر اختياراً على الإطلاق في العقود التجارية الدولية عالمياً، إذ يحكم نحو 40% من المعاملات التجارية والمالية الدولية عالمياً (تقرير نقابة المحامين الإنجليزية والويلزية، سبتمبر 2025)، ويحكم 78% من قضايا محكمة لندن للتحكيم الدولي (LCIA) لعام 2024، وهو الاختيار الأكثر شيوعاً في قضايا غرفة التجارة الدولية (ICC) الجديدة (15%، يليه القانون السويسري 7.2%، والقانون البرازيلي 5%، والقانون الفرنسي 5%، وقانون نيويورك 4.8%). بالنسبة للشرق الأوسط تحديداً، وجد استطلاع التحكيم الدولي لعام 2025 (جامعة كوين ماري بالتعاون مع وايت آند كيس) أن لندن (63%) وسنغافورة (43%) هما أكثر مقرّي تحكيم اختياراً من قبل المشاركين من الشرق الأوسط، مع تفضيل قواعد ICC كأكثر قواعد تحكيم شيوعاً في المنطقة (59%). بالنسبة للعقود العابرة للحدود المرتبطة بالإمارات تحديداً، يبقى القانون الإنجليزي الاختيار الأكثر شيوعاً للقانون الحاكم، ويُقترن عادة بمحاكم مركز دبي المالي العالمي (DIFC) أو تحكيم LCIA أو ICC أو DIAC -- إلا أن إصلاحات DIFC التشريعية لعامي 2024-2025 (القانون رقم 8 لسنة 2024، وقانون دبي رقم 2 لسنة 2025، وحكم محكمة التمييز بدبي في أكتوبر 2024 الذي أبطل بنود الاختصاص غير المتماثلة داخل الدولة) تعني أن القانون الإنجليزي لم يعد يُطبَّق تلقائياً لسد الفراغ داخل تشريعات DIFC، وأن بنود اختصاص DIFC النمطية قد لا تستوفي المعيار الجديد المتمثل في أن تكون «محددة وواضحة وصريحة». تعترف كل من السعودية والأردن بحرية الأطراف في اختيار القانون الحاكم للعقود الدولية (مع مراعاة قيود الشريعة/النظام العام في السعودية)، مع قبول بنود تحكيم SCCA وICC وLCIA عادة في السعودية، وقواعد ICC/الأونسيترال الشائعة في الأردن؛ وكلا البلدين طرف في اتفاقية نيويورك، ما يدعم تنفيذ الأحكام العابرة للحدود. أما الصفقات التي تربط المنطقة بآسيا -- بما في ذلك العقود المرتبطة بمبادرة الحزام والطريق الصينية -- فإن مؤسسات HKIAC وSIAC وICC وCIETAC (بما في ذلك مركزها بهونغ كونغ) هي الأكثر استخداماً كجهات تحكيم، مع استمرار اختيار القانون الإنجليزي بشكل متكرر كقانون حاكم حتى في العقود المرتبطة بالصين. هذا وصف لما يختاره أطراف آخرون عادة، مستقى من بيانات صناعية عامة لعامي 2025-2026، وليس توصية بشأن أي عقد بعينه -- الهدف تمكين من يصوغ العقد من موازنة أي اختيار غير معتاد مقابل الافتراض السوقي الشائع، بدلاً من الاختيار بلا معلومة، مع ضرورة مراجعة مستشار قانوني مؤهل قبل الاعتماد على أي بند فعلي."
    : "In practice -- this is a market observation, not a recommendation: English law is the single most commonly chosen governing law for international commercial contracts worldwide, governing roughly 40% of international business and financial transactions globally (The Law Society of England and Wales, Sept 2025 annual report), 78% of LCIA cases in 2024, and the largest single share of new ICC cases (15%, ahead of Swiss law at 7.2%, Brazilian law at 5%, French law at 5%, and New York law at 4.8%). For the Middle East specifically, the 2025 Queen Mary University of London / White & Case International Arbitration Survey found London (63%) and Singapore (43%) as the top two arbitration seats chosen by Middle East respondents, with ICC Rules the most preferred arbitral rules in the region (59%). For UAE-linked cross-border contracts specifically, English law remains the most common governing-law choice, typically paired with DIFC Courts, LCIA, ICC, or DIAC arbitration -- though the 2024-2025 DIFC legislative reforms (DIFC Law No. 8 of 2024, Dubai Law No. 2 of 2025, and an October 2024 Dubai Court of Cassation ruling invalidating asymmetric jurisdiction clauses onshore) mean English law is no longer an automatic gap-filler inside DIFC statutes, and boilerplate DIFC jurisdiction clauses may no longer meet the new 'specific, clear and express' threshold. Saudi Arabia and Jordan both recognize party autonomy in choice of governing law for international contracts (subject to Sharia/public-policy limits in Saudi Arabia), with SCCA, ICC, and LCIA arbitration clauses commonly upheld in Saudi Arabia and ICC/UNCITRAL rules common in Jordan; both are New York Convention signatories, supporting cross-border award enforcement. For deals connecting the region to Asia -- including China's Belt and Road-linked contracts -- HKIAC, SIAC, ICC, and CIETAC (including its Hong Kong Arbitration Center) are the most commonly used arbitral institutions, with English law still frequently chosen as the governing law even in China-linked contracts. None of this is a recommendation for any specific contract -- it is a description of what other parties commonly choose, sourced to public 2025-2026 industry data, so a drafter can weigh a genuinely unusual choice against the market default rather than choosing blind, and should still have qualified legal counsel review the actual clause before relying on it.";
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
