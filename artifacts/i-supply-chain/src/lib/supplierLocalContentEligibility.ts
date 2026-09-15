/**
 * Supplier Intelligence Module 08 — Local Content / ICV Eligibility
 * (SI-08, 15 Sep 2026; Saudi Arabia decomposition 16 Sep 2026; UAE
 * decomposition + program-architecture generalization 16 Sep 2026).
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
 * variants -- it is several genuinely different regulatory mechanisms, and
 * as of 16 Sep 2026 (see below), most countries turn out to run MULTIPLE
 * distinct mechanisms of their own, not just one:
 *
 *   - Saudi Arabia (LCGPA + Aramco + GAMI + LIKT): six distinct programs,
 *     decomposed 16 Sep 2026 (see `PROGRAMS`, keys `sa-*`) -- a certified
 *     PERCENTAGE SCORE (LCGPA general), a CATEGORY ELIGIBILITY GATE
 *     (Mandatory List), a PRICE PREFERENCE (10% national-product), an
 *     ANCHOR-BUYER SCORE (Aramco IKTVA, a real computable formula from
 *     Aramco's own guideline), and two not-yet-sourced OFFSET/TECH-TRANSFER
 *     programs (GAMI defense, LIKT) each carrying real dated national
 *     context instead of a blank placeholder.
 *   - UAE (MoIAT ICV + Tawazun): two distinct programs, decomposed 16 Sep
 *     2026 (see `PROGRAMS`, keys `ae-*`) -- `ae-icv-general`, a certified
 *     WEIGHTED MULTI-PILLAR SCORE (manufacturing/third-party spend +
 *     investment + Emiratisation + expatriate contribution + capped bonus
 *     categories), requiring a MoIAT-authorized audit; and `ae-tawazun-
 *     offset`, the Tawazun Economic Council's real, sourced defense-sector
 *     OFFSET obligation (a genuinely different mechanism run by a
 *     genuinely different body for a genuinely different buyer, not a
 *     variant of the general ICV score). See Section "AE Tawazun sourcing"
 *     below for the exact figures and how this research pass resolved the
 *     brief's own flagged "$10M vs AED10M" ambiguity.
 *   - Jordan: NOT a scored certificate at all -- a 20% PRICE PREFERENCE
 *     MARGIN for locally-manufactured products in PUBLIC TENDERS only
 *     (Cabinet-approved, per Petra/Jordan News Agency reporting Minister of
 *     Industry, Trade & Supply Yarub Qudah's announcement). This adjusts BID
 *     EVALUATION, not a company's own local-content percentage -- a
 *     genuinely different mechanism type from LCGPA/ICV. Single program for
 *     now (`jo-price-preference`); no second Jordanian mechanism has been
 *     sourced yet.
 *   - Oman, Qatar, Bahrain, Kuwait: real named programs exist (Oman runs its
 *     own separate "ICV" program; Qatar Cabinet-approved a National Local
 *     Content Strategy; Kuwait's KPC/KOC run anchor-buyer-style programs;
 *     Bahrain reserves a share of tenders for SMEs) but this research pass
 *     has not yet sourced an exact formula or weighting to the same rigor
 *     as SA/AE/JO. Each keeps ONE `not-yet-sourced` program for now (`om-
 *     icv`, `qa-national-strategy`, `bh-local-content`, `kw-local-content`)
 *     -- Decision Record 8.7: an explicit `not-yet-sourced` state, never a
 *     guessed formula. Their own multi-program decomposition is future work
 *     (Part 1 continues), using the exact same `PROGRAMS`/`program`
 *     mechanism this file now generalizes for that purpose.
 *
 * Two disclosed sourcing caveats carried over from the original build,
 * stated plainly rather than smoothed over:
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
 * WHY THE PROGRAM ARCHITECTURE IS NOW GENERAL, NOT SAUDI-SPECIFIC
 * (16 Sep 2026, this pass)
 * ============================================================================
 * The 16 Sep 2026 Saudi Arabia decomposition introduced a `SaudiProgram`
 * union and a `SAUDI_PROGRAMS` record, scoped to Saudi Arabia only, because
 * Saudi Arabia was the first country found to run more than one real
 * mechanism. As soon as this same UAE research pass found Tawazun to be a
 * second, genuinely distinct UAE mechanism, it became clear the "one
 * country, one program" assumption baked into a per-country union type
 * would not survive contact with the second country, let alone the four
 * still to be researched (Oman/Qatar/Bahrain/Kuwait, per the brief's own
 * taxonomy notes, likely also run more than one mechanism each: Oman's own
 * ICV anchor-buyer program plus a PTLC Mandatory List; Qatar's QatarEnergy
 * Tawteen anchor-buyer program; Kuwait's KPC/KOC anchor-buyer program plus
 * a spend set-aside; Bahrain's SME category reservation plus a stacked
 * price preference). Rather than duplicate the Saudi-specific pattern a
 * second time for UAE and then a third/fourth/fifth/sixth time for the
 * rest, this pass generalizes it once: `LocalContentProgram` is now a flat
 * union of EVERY program key across every country (`sa-*`, `ae-*`, `jo-*`,
 * `om-*`, `qa-*`, `bh-*`, `kw-*`), `PROGRAMS` is the single record keyed by
 * that union, `PROGRAMS_BY_COUNTRY` lists which programs exist for a given
 * country (for UI routing), and `DEFAULT_PROGRAM_BY_COUNTRY` is what
 * `assessSupplierLocalContent` resolves to when `program` is omitted --
 * always the country's ORIGINAL single pre-existing mechanism, so this
 * refactor is a pure behavior-preserving rename for AE/JO/OM/QA/BH/KW and
 * for Saudi Arabia's own pre-existing default (`sa-lcgpa-general`), not a
 * silent change to what any existing caller gets back. `COUNTRY_FRAMEWORKS`
 * (the original single-program-per-country lookup, still used by the UI's
 * country-selector buttons) is now a derived view: `PROGRAMS[
 * DEFAULT_PROGRAM_BY_COUNTRY[country]]`, not a second source of truth.
 *
 * ============================================================================
 * AE TAWAZUN SOURCING (16 Sep 2026) -- resolves a flagged open item
 * ============================================================================
 * The brief flagged a "$10M vs AED10M" currency discrepancy in its own
 * Tawazun citation, to be resolved in a later (non-Saudi) pass. This
 * research pass resolved it: the UAE Dirham has been fixed-pegged to the US
 * Dollar at exactly AED 3.6725 = USD 1 since 1997 (a matter of public
 * record, not something this pass needed to re-verify per-transaction).
 * AED 36.73 million (cited by mondaq.com's legal summary of the Tawazun
 * Economic Council's 2019 policy guidelines) divided by 3.6725 equals
 * essentially exactly USD 10.00 million (cited independently by both
 * afridi-angell.com's legal summary and the US government's own
 * trade.gov UAE Defense Country Commercial Guide). These are the SAME
 * threshold expressed in two currencies via a fixed peg, not two different
 * numbers -- the brief's flagged ambiguity was a citation-formatting
 * artifact, not a real source conflict. Sourced also: a 60% offset-credit
 * target as a share of the underlying contract value, and an 8.5%
 * shortfall-penalty rate (payable in cash, or securable via a bank
 * guarantee, per afridi-angell.com and mondaq.com) when accumulated credits
 * fall short at the end of the performance period -- both real, both
 * disclosed with their sources inline in `PROGRAMS['ae-tawazun-offset']`.
 * No more recent (2020+) revision to these guidelines' numeric figures was
 * found in this research pass; trade.gov's own UAE Defense guide (a US
 * government source, generally kept current) cites the same 2019 guidelines
 * without noting a later update, and that absence of a newer figure is
 * disclosed rather than treated as silent confirmation nothing has changed.
 */

// ---------------------------------------------------------------------------
// Section 1 — country / context / mechanism taxonomy
// ---------------------------------------------------------------------------

export type LocalContentCountry = 'SA' | 'AE' | 'JO' | 'OM' | 'QA' | 'BH' | 'KW';

/** Every program key across every country this engine represents, flat
 * (not nested per-country) so the routing/resolution logic below is the
 * same regardless of which country a program belongs to. `undefined`/
 * omitted resolves to `DEFAULT_PROGRAM_BY_COUNTRY[country]` everywhere, so
 * every pre-existing caller (and every pre-existing test) that never knew
 * about programs keeps its exact prior behavior -- this is a rename/
 * generalization of the 16 Sep 2026 Saudi-specific `SaudiProgram`, not a
 * behavior change. See the file header's two "WHY" sections above for the
 * full rationale and sourcing. */
export type LocalContentProgram =
  | 'sa-lcgpa-general'    // SA type 1: certification score (the module's original mechanism)
  | 'sa-mandatory-list'   // SA type 3: category eligibility gate
  | 'sa-price-preference' // SA type 4: bid-evaluation price preference (reuses price-preference-margin)
  | 'sa-iktva-aramco'     // SA type 2: anchor-buyer program
  | 'sa-gami-defense'     // SA type 6: offset/tech-transfer obligation (not-yet-sourced)
  | 'sa-likt'             // SA type 6: offset/tech-transfer obligation (not-yet-sourced)
  | 'ae-icv-general'      // AE type 1: certification score (the module's original mechanism)
  | 'ae-tawazun-offset'   // AE type 6: offset/tech-transfer obligation (Tawazun Economic Council, real formula)
  | 'jo-price-preference' // JO type 4: bid-evaluation price preference (the module's original mechanism)
  | 'om-icv'              // OM: not-yet-sourced (the module's original mechanism)
  | 'qa-national-strategy' // QA: not-yet-sourced (the module's original mechanism)
  | 'bh-local-content'    // BH: not-yet-sourced (the module's original mechanism)
  | 'kw-local-content';   // KW: not-yet-sourced (the module's original mechanism)

/** Which program `assessSupplierLocalContent` resolves to when `program` is
 * omitted -- always each country's original pre-existing single mechanism,
 * so this generalization changes no caller's default behavior. */
export const DEFAULT_PROGRAM_BY_COUNTRY: Record<LocalContentCountry, LocalContentProgram> = {
  SA: 'sa-lcgpa-general', AE: 'ae-icv-general', JO: 'jo-price-preference',
  OM: 'om-icv', QA: 'qa-national-strategy', BH: 'bh-local-content', KW: 'kw-local-content',
};

/** Every program that exists for a given country, in display order -- used
 * by the UI to render the routing-question button row whenever a country
 * has more than one (today: SA and AE; every other country still has
 * exactly one, so no routing question is shown for them yet). */
export const PROGRAMS_BY_COUNTRY: Record<LocalContentCountry, LocalContentProgram[]> = {
  SA: ['sa-lcgpa-general', 'sa-mandatory-list', 'sa-price-preference', 'sa-iktva-aramco', 'sa-gami-defense', 'sa-likt'],
  AE: ['ae-icv-general', 'ae-tawazun-offset'],
  JO: ['jo-price-preference'],
  OM: ['om-icv'],
  QA: ['qa-national-strategy'],
  BH: ['bh-local-content'],
  KW: ['kw-local-content'],
};

/** Which buyer this assessment is for -- see file header: every sourced
 * regime found is anchored in government/SOE-linked procurement. */
export type ProcurementContext = 'government' | 'semi-government-soe' | 'private-commercial';

// Bilingual-completeness fix (found by independent QA review, 15 Sep 2026):
// reasonAr must never splice a raw English enum literal into an Arabic
// sentence, and must never carry LESS information than reasonEn. This map
// is the Arabic label for each procurement context, used everywhere
// procurementContext is rendered inside reasonAr.
const PROCUREMENT_CONTEXT_LABEL_AR: Record<ProcurementContext, string> = {
  government: 'حكومي',
  'semi-government-soe': 'شبه حكومي / مملوك للدولة',
  'private-commercial': 'تجاري خاص',
};

export type LocalContentMechanismType =
  | 'eligible-spend-ratio'      // Saudi LCGPA general score
  | 'weighted-pillar-score'     // UAE ICV
  | 'price-preference-margin'   // Jordan; Saudi LCGPA national-product preference
  | 'category-eligibility-gate' // Saudi LCGPA Mandatory List
  | 'anchor-buyer-score'        // Saudi Aramco IKTVA
  | 'offset-obligation-gate'    // UAE Tawazun defense-sector offset obligation
  | 'not-yet-sourced';          // Oman / Qatar / Bahrain / Kuwait; Saudi GAMI / LIKT

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
  /** Which program key (see `LocalContentProgram`) this framework describes. */
  program: LocalContentProgram;
  /** "How the same score gets used differently by context" notes -- per the
   * brief's own UAE precedent, this is deliberately NOT a new mechanism,
   * just disclosure text attached to the program it describes. Populated
   * for `sa-lcgpa-general` and `ae-icv-general`. */
  usageNotesEn?: string[];
  usageNotesAr?: string[];
}

// ---------------------------------------------------------------------------
// Section 1b — Saudi Arabia: 6 programs (5 modeled mechanisms + the general
// score's usage notes). See file header for full sourcing.
// ---------------------------------------------------------------------------

const SA_PROGRAMS: Record<'sa-lcgpa-general' | 'sa-mandatory-list' | 'sa-price-preference' | 'sa-iktva-aramco' | 'sa-gami-defense' | 'sa-likt', CountryFrameworkInfo> = {
  'sa-lcgpa-general': {
    country: 'SA', countryNameEn: 'Saudi Arabia', countryNameAr: 'المملكة العربية السعودية',
    programNameEn: 'LCGPA Local Content (general score)', programNameAr: 'المحتوى المحلي العام (هيئة المحتوى المحلي والمشتريات الحكومية)',
    mechanismType: 'eligible-spend-ratio', program: 'sa-lcgpa-general',
    applicableContexts: ['government', 'semi-government-soe'],
    sourceNoteEn: 'LCGPA Guide G1 (Version 5.0, 15 Nov 2022): baseline score = locally-eligible spend / total spend across 4 pillars. Government procurement is directly covered; extended June 2022 to entities >=50% state-owned. No sourced evidence this governs private-to-private commercial contracts.',
    sourceNoteAr: 'دليل هيئة المحتوى المحلي والمشتريات الحكومية G1 (الإصدار ٥.٠، ١٥ نوفمبر ٢٠٢٢): الدرجة الأساسية = الإنفاق المؤهل محلياً ÷ إجمالي الإنفاق عبر أربعة أركان. تشمل مباشرة المشتريات الحكومية، ووُسِّع نطاقها في يونيو ٢٠٢٢ ليغطي الجهات المملوكة للدولة بنسبة ٥٠٪ فأكثر. لا يوجد دليل موثّق على سريانها على العقود التجارية بين القطاع الخاص فقط.',
    usageNotesEn: [
      'LCGPA\'s own official Local Content Mechanisms page (lcgpa.gov.sa) states that for high-value government contracts (excluding sourcing contracts), technical/commercial evaluation weighs local content at 40% against 60% price, plus a bonus for Tadawul-listed companies. This is the SAME general score above being used in a specific evaluation weighting -- not a separate score to compute.',
      'A separately-cited figure (attributed to SPA, Saudi Press Agency) describes a ~30%, phased local-content weighting specific to consulting/IT-sector bid evaluation. This research pass could not confirm with full confidence whether this is the same 40% high-value-contract rule described differently, or a genuinely separate sector-specific rule -- spa.gov.sa returned 403 on every direct verification attempt. Disclosed as an open item, not resolved by assumption.',
    ],
    usageNotesAr: [
      'تذكر الصفحة الرسمية لآليات المحتوى المحلي التابعة لهيئة المحتوى المحلي والمشتريات الحكومية (lcgpa.gov.sa) أن التقييم الفني/التجاري للعقود الحكومية عالية القيمة (باستثناء عقود التوريد) يمنح المحتوى المحلي وزناً ٤٠٪ مقابل ٦٠٪ للسعر، إضافة إلى ميزة إضافية للشركات المدرجة في تداول. هذه هي نفس الدرجة العامة أعلاه تُستخدم ضمن ترجيح تقييم محدد -- وليست درجة منفصلة يجب حسابها.',
      'يشير رقم آخر منسوب إلى وكالة الأنباء السعودية (واس) إلى ترجيح محتوى محلي يقارب ٣٠٪، متدرّج زمنياً، خاص بتقييم عطاءات قطاعي الاستشارات وتقنية المعلومات. لم يتمكن هذا البحث من التأكد بثقة كاملة مما إذا كانت هذه نفس قاعدة الـ٤٠٪ للعقود عالية القيمة موصوفة بصياغة مختلفة، أو قاعدة قطاعية منفصلة فعلاً -- إذ أعاد موقع spa.gov.sa خطأ ٤٠٣ في كل محاولة تحقق مباشرة. يُفصَح عن هذه النقطة كمسألة مفتوحة، دون حسمها بافتراض.',
    ],
  },
  'sa-mandatory-list': {
    country: 'SA', countryNameEn: 'Saudi Arabia', countryNameAr: 'المملكة العربية السعودية',
    programNameEn: 'LCGPA Mandatory List (category eligibility gate)', programNameAr: 'القائمة الإلزامية لهيئة المحتوى المحلي (بوابة أهلية الفئة)',
    mechanismType: 'category-eligibility-gate', program: 'sa-mandatory-list',
    applicableContexts: ['government', 'semi-government-soe'],
    sourceNoteEn: 'LCGPA\'s official Local Content Mechanisms page lists a Mandatory List of 233+ products/services where government entities MUST procure from LCGPA-certified local sources -- a pass/fail bidding gate for the listed categories, not a percentage score. No single sourced percentage threshold applies here; eligibility is binary (in-list + certified, or not).',
    sourceNoteAr: 'تُدرج الصفحة الرسمية لآليات المحتوى المحلي التابعة للهيئة قائمة إلزامية تضم أكثر من ٢٣٣ منتجاً وخدمة يتوجب على الجهات الحكومية شراءها من مصادر محلية معتمدة من الهيئة فقط -- بوابة ثنائية (نجاح/فشل) للفئات المدرجة، وليست درجة نسبية. لا تنطبق هنا نسبة مئوية موثّقة واحدة؛ الأهلية ثنائية (مدرج ومعتمد، أو لا).',
  },
  'sa-price-preference': {
    country: 'SA', countryNameEn: 'Saudi Arabia', countryNameAr: 'المملكة العربية السعودية',
    programNameEn: 'LCGPA National Product Price Preference', programNameAr: 'تفضيل سعر المنتج الوطني (هيئة المحتوى المحلي)',
    mechanismType: 'price-preference-margin', program: 'sa-price-preference',
    applicableContexts: ['government', 'semi-government-soe'],
    sourceNoteEn: 'LCGPA\'s official Local Content Mechanisms page states a 10% price preference is added to foreign products when compared against qualifying national products in government tenders -- structurally identical to Jordan\'s price-preference mechanism (a bid-evaluation adjustment, not a local-content percentage score), reusing the same computation shape.',
    sourceNoteAr: 'تنص الصفحة الرسمية لآليات المحتوى المحلي التابعة للهيئة على إضافة تفضيل سعري بنسبة ١٠٪ للمنتجات الأجنبية عند مقارنتها بالمنتجات الوطنية المؤهلة في المناقصات الحكومية -- آلية مطابقة من حيث البنية لآلية التفضيل السعري الأردنية (تعديل في تقييم العطاء، وليست درجة نسبة محتوى محلي)، وتُستخدم نفس بنية الحساب.',
  },
  'sa-iktva-aramco': {
    country: 'SA', countryNameEn: 'Saudi Arabia', countryNameAr: 'المملكة العربية السعودية',
    programNameEn: 'Aramco IKTVA (In-Kingdom Total Value Add)', programNameAr: 'برنامج أرامكو لإجمالي القيمة المضافة داخل المملكة (إكتفاء)',
    mechanismType: 'anchor-buyer-score', program: 'sa-iktva-aramco',
    applicableContexts: ['semi-government-soe'],
    sourceNoteEn: 'Aramco\'s own official "2021 iktva Guideline v13" (iktva.sa): iktva% = ((A+B+C+D+R)/E) + I, where A = local goods/services spend + local asset depreciation + Saudi-based expatriate compensation, B = Saudi workforce compensation, C = training & development spend, D = supplier development spend, R = local R&D spend, E = total costs (denominator), I = incentive bonuses (export ratio, ESG/cybersecurity/regional-HQ bonuses). This is Aramco\'s OWN separate anchor-buyer program, distinct from the LCGPA general government score -- a real, computable formula, not a guessed one. Simplification disclosed: the I bonus component is modeled here as a single optional bonus-points input (0-10, caller-supplied) rather than the full tiered export-ratio/ESG sub-formula -- directional only, not a substitute for Aramco\'s own certified iktva calculation.',
    sourceNoteAr: 'دليل أرامكو الرسمي "iktva Guideline v13 لعام ٢٠٢١" (iktva.sa): نسبة إكتفاء = ((A+B+C+D+R)/E) + I، حيث A = إنفاق السلع/الخدمات المحلية + إهلاك الأصول المحلية + تعويضات العمالة الوافدة المقيمة في السعودية، B = تعويضات القوى العاملة السعودية، C = إنفاق التدريب والتطوير، D = إنفاق تطوير الموردين، R = إنفاق البحث والتطوير المحلي، E = إجمالي التكاليف (المقام)، I = مكافآت تحفيزية (نسبة التصدير، مكافآت الاستدامة/الأمن السيبراني/المقر الإقليمي). هذا برنامج أرامكو الخاص بها كمشترٍ رئيسي، منفصل عن الدرجة الحكومية العامة لهيئة المحتوى المحلي -- صيغة حقيقية قابلة للحساب، وليست مخمّنة. تبسيط مُفصَح عنه: تُمثَّل مكافأة I هنا كمُدخل نقاط مكافأة اختياري واحد (٠-١٠، يُدخله المستخدم) بدلاً من الصيغة الفرعية الكاملة المتدرجة لنسبة التصدير/الاستدامة -- توجيهي فقط، وليس بديلاً عن حساب إكتفاء المعتمد من أرامكو نفسها.',
  },
  'sa-gami-defense': {
    country: 'SA', countryNameEn: 'Saudi Arabia', countryNameAr: 'المملكة العربية السعودية',
    programNameEn: 'GAMI Defense Localization', programNameAr: 'برنامج التوطين الدفاعي (الهيئة العامة للصناعات العسكرية)',
    mechanismType: 'not-yet-sourced', program: 'sa-gami-defense',
    applicableContexts: [],
    sourceNoteEn: 'GAMI\'s own official site states national defense-sector localization reached 24.89% as of end-2024, with a public target of >50% by 2030. No publicly disclosed per-supplier computable formula, joint-venture requirement structure, or offset calculation methodology was found in this research pass -- a real, dated national-level figure is disclosed here rather than a fabricated per-supplier score.',
    sourceNoteAr: 'يذكر الموقع الرسمي للهيئة العامة للصناعات العسكرية (GAMI) أن نسبة التوطين في قطاع الصناعات الدفاعية الوطنية بلغت ٢٤.٨٩٪ حتى نهاية عام ٢٠٢٤، مع هدف معلن يتجاوز ٥٠٪ بحلول عام ٢٠٣٠. لم يُعثر في هذا البحث على صيغة حساب علنية على مستوى المورّد، أو هيكل اشتراط مشروع مشترك، أو منهجية حساب مقاصة -- يُفصَح هنا عن رقم وطني حقيقي ومؤرَّخ بدلاً من درجة مورّد مختلقة.',
  },
  'sa-likt': {
    country: 'SA', countryNameEn: 'Saudi Arabia', countryNameAr: 'المملكة العربية السعودية',
    programNameEn: 'LIKT (Localization of Industry & Knowledge Transfer)', programNameAr: 'برنامج توطين الصناعة ونقل المعرفة (LIKT)',
    mechanismType: 'not-yet-sourced', program: 'sa-likt',
    applicableContexts: [],
    sourceNoteEn: 'LCGPA\'s own official Local Content Mechanisms page names a distinct "LIKT" (Localization of Industry & Knowledge Transfer) program aimed at localizing targeted industries through collaboration with global investors and technology leaders -- genuinely new to this research pass and distinct from GAMI\'s defense-specific program. No per-supplier computable formula was found; deliberately not guessed.',
    sourceNoteAr: 'تسمّي الصفحة الرسمية لآليات المحتوى المحلي التابعة للهيئة برنامجاً مستقلاً يُدعى "LIKT" (توطين الصناعة ونقل المعرفة) يهدف إلى توطين صناعات مستهدفة عبر التعاون مع مستثمرين عالميين وقادة تقنيين -- برنامج جديد فعلاً اكتُشف في هذا البحث ومختلف عن برنامج الهيئة العامة للصناعات العسكرية الخاص بالدفاع. لم يُعثر على صيغة حساب على مستوى المورّد؛ لم يتم تخمينها عمداً.',
  },
};

// ---------------------------------------------------------------------------
// Section 1c — UAE: 2 programs (ae-icv-general + ae-tawazun-offset). See
// file header's "AE TAWAZUN SOURCING" section for the full sourcing.
// ---------------------------------------------------------------------------

const AE_PROGRAMS: Record<'ae-icv-general' | 'ae-tawazun-offset', CountryFrameworkInfo> = {
  'ae-icv-general': {
    country: 'AE', countryNameEn: 'United Arab Emirates', countryNameAr: 'دولة الإمارات العربية المتحدة',
    programNameEn: 'National In-Country Value (ICV)', programNameAr: 'برنامج القيمة الوطنية المضافة (ICV)',
    mechanismType: 'weighted-pillar-score', program: 'ae-icv-general',
    applicableContexts: ['government', 'semi-government-soe'],
    sourceNoteEn: "MoIAT National ICV Program (unified with ADNOC's original ICV program): certified weighted score across Manufacturing/Third-Party Spend, Investment, Emiratisation, Expatriate Contribution, and capped bonus categories, audited by a MoIAT-authorized firm, 14-month validity. Framed around public spending and \"Program Partner\" (government/semi-government) tenders -- no sourced evidence of a private-to-private mandate. Formula figures below are a best-available reconstruction from public secondary sourcing of the official guideline document, not a byte-verified transcription -- verify against the primary MoIAT document before relying on this for a real certification decision. MoIAT's own official ICV program page (moiat.gov.ae) confirms ICV certification is an INCENTIVE -- certified suppliers \"gain advantages during the award of tenders and contracts based on their ICV score\" -- not a mandatory category gate like Saudi's Mandatory List; this research pass found no sourced evidence of a mandatory ICV-only bidding category, so none is modeled here (a real negative finding, not an oversight).",
    sourceNoteAr: 'برنامج القيمة الوطنية المضافة الوطني التابع لوزارة الصناعة والتقنية المتقدمة (موحّد الآن مع برنامج أدنوك الأصلي): درجة مرجحة معتمدة عبر التصنيع/إنفاق الطرف الثالث، الاستثمار، التوطين، مساهمة العمالة الوافدة، وفئات مكافآت محدودة السقف، يدققها مكتب معتمد من الوزارة، وصلاحية ١٤ شهراً. يتمحور حول الإنفاق العام ومناقصات "شركاء البرنامج" (الحكومة وشبه الحكومة) -- لا يوجد دليل موثّق على إلزاميته بين القطاع الخاص فقط. أرقام الصيغة أدناه إعادة بناء اعتماداً على أفضل مصادر ثانوية متاحة للدليل الرسمي، وليست نسخاً حرفياً موثقاً -- يُنصح بالتحقق من الوثيقة الأصلية للوزارة قبل الاعتماد عليها في قرار تصديق فعلي. تؤكد الصفحة الرسمية لبرنامج ICV التابعة لوزارة الصناعة (moiat.gov.ae) أن شهادة ICV تحفيزية -- تحصل الشركات المعتمدة على "مزايا عند ترسية المناقصات والعقود بناءً على درجة ICV الخاصة بها" -- وليست بوابة فئة إلزامية كالقائمة الإلزامية السعودية؛ لم يجد هذا البحث دليلاً موثّقاً على فئة مناقصات إلزامية تقتصر على شهادة ICV، لذا لم تُنمذَج هنا (نتيجة سلبية حقيقية، وليست إغفالاً).',
    usageNotesEn: [
      'Abu Dhabi\'s own Department of Economic Development (idb.added.gov.ae, its In-Country Value / ADLC FAQ page) states: "The ICV factor accounts for 40% of the financial evaluation" in Abu Dhabi tenders, and that a bidder who does not submit an ICV certificate receives zero points on that 40% -- a real, sourced, heavily-weighted incentive, though this is an Abu Dhabi emirate-level figure, not confirmed as the UAE-wide MoIAT figure (the national MoIAT page does not itself state a percentage). Per the brief\'s own precedent for this exact situation: this is "how the score gets used" by one specific evaluating entity, not a new mechanism -- shown here as a usage note on the existing general score.',
    ],
    usageNotesAr: [
      'تذكر دائرة التنمية الاقتصادية في أبوظبي (صفحة أسئلة القيمة المحلية/ADLC على idb.added.gov.ae): "يمثّل عامل القيمة المحلية ٤٠٪ من التقييم المالي" في مناقصات أبوظبي، وأن مقدّم العطاء الذي لا يقدّم شهادة ICV يحصل على صفر نقاط من هذه الـ٤٠٪ -- حافز حقيقي وموثّق وذو وزن كبير، إلا أنه رقم على مستوى إمارة أبوظبي، وليس مؤكداً كرقم وطني موحّد لدى الوزارة (الصفحة الوطنية للوزارة لا تذكر نسبة بعينها). وفق سابقة الموجز نفسها لهذه الحالة تحديداً: هذا "كيفية استخدام الدرجة" من جهة تقييم واحدة محددة، وليس آلية جديدة -- يُعرض هنا كملاحظة استخدام على الدرجة العامة القائمة.',
    ],
  },
  'ae-tawazun-offset': {
    country: 'AE', countryNameEn: 'United Arab Emirates', countryNameAr: 'دولة الإمارات العربية المتحدة',
    programNameEn: 'Tawazun Economic Program (defense offset obligation)', programNameAr: 'البرنامج الاقتصادي توازن (التزام المقاصة الدفاعية)',
    mechanismType: 'offset-obligation-gate', program: 'ae-tawazun-offset',
    applicableContexts: ['government'],
    sourceNoteEn: 'The Tawazun Economic Council\'s 2019 policy guidelines (per afridi-angell.com, mondaq.com legal summaries, and the US government\'s own trade.gov UAE Defense Country Commercial Guide, none flagging a more recent revision): offset obligations trigger on UAE Armed Forces / Abu Dhabi Police defense contracts valued at or above USD 10 million (= AED 36.73 million at the UAE\'s fixed USD peg of 3.6725 -- the SAME threshold in two currencies, resolving a currency-citation ambiguity flagged in this module\'s original brief). The required offset-credit target is 60% of the underlying contract value; a shortfall at the end of the performance period can be settled by paying 8.5% of the shortfall value (or rolling the obligation into a new project) -- contractors also post a bank guarantee of 8.5% of their offset obligation to secure performance. This is Tawazun\'s own separate defense-sector program, run by a different body for a different buyer (UAE Armed Forces / Abu Dhabi Police, via the Tawazun Economic Council) than MoIAT\'s general ICV program -- a genuinely distinct mechanism, not a variant of the ICV score.',
    sourceNoteAr: 'إرشادات السياسة الصادرة عن مجلس توازن الاقتصادي عام ٢٠١٩ (وفق ملخصات قانونية من afridi-angell.com وmondaq.com، ودليل الحكومة الأمريكية الرسمي لقطاع الدفاع الإماراتي على trade.gov، دون أن يشير أي منها إلى تحديث أحدث): تُستحق التزامات المقاصة على عقود القوات المسلحة الإماراتية/شرطة أبوظبي الدفاعية التي تبلغ قيمتها ١٠ ملايين دولار أمريكي أو أكثر (= ٣٦.٧٣ مليون درهم إماراتي وفق سعر الصرف الثابت للدرهم عند ٣.٦٧٢٥ -- وهو نفس الحد بعملتين، مما يحسم غموضاً في الاستشهاد بالعملة أشار إليه الموجز الأصلي لهذه الوحدة). الهدف المطلوب من ائتمانات المقاصة هو ٦٠٪ من قيمة العقد الأساسي؛ ويمكن تسوية أي نقص في نهاية فترة الأداء بدفع ٨.٥٪ من قيمة النقص (أو ترحيل الالتزام إلى مشروع جديد) -- كما يقدّم المقاولون ضماناً بنكياً بنسبة ٨.٥٪ من التزامهم بالمقاصة لضمان الأداء. هذا برنامج توازن الدفاعي الخاص، تديره جهة مختلفة لمشترٍ مختلف (القوات المسلحة الإماراتية/شرطة أبوظبي، عبر مجلس توازن الاقتصادي) عن برنامج ICV العام لدى وزارة الصناعة -- آلية مختلفة فعلاً، وليست نسخة من درجة ICV.',
  },
};

// ---------------------------------------------------------------------------
// Section 1d — Jordan / Oman / Qatar / Bahrain / Kuwait: one program each
// for now (unchanged content, renamed keys -- see file header).
// ---------------------------------------------------------------------------

const JO_OM_QA_BH_KW_PROGRAMS: Record<'jo-price-preference' | 'om-icv' | 'qa-national-strategy' | 'bh-local-content' | 'kw-local-content', CountryFrameworkInfo> = {
  'jo-price-preference': {
    country: 'JO', countryNameEn: 'Jordan', countryNameAr: 'المملكة الأردنية الهاشمية',
    programNameEn: 'National Industry Price Preference', programNameAr: 'تفضيل السعر للصناعة الوطنية',
    mechanismType: 'price-preference-margin', program: 'jo-price-preference',
    applicableContexts: ['government'],
    sourceNoteEn: "Cabinet-approved 20% price preference for locally-manufactured products in public tenders, announced by Jordan's Minister of Industry, Trade & Supply (per Petra, Jordan's official state news agency). This adjusts bid evaluation (a price handicap favoring local bidders), not a company's own local-content percentage -- a different mechanism from LCGPA/ICV. The precise governing bylaw/regulation number was not identified in available sourcing; the mechanism and 20% figure are real and sourced, the exact legal citation is not.",
    sourceNoteAr: 'تفضيل سعري بنسبة ٢٠٪ للمنتجات المصنّعة محلياً في المناقصات الحكومية، أقرّه مجلس الوزراء وأعلنه وزير الصناعة والتجارة والتموين الأردني (بحسب وكالة الأنباء الأردنية الرسمية "بترا"). يُطبَّق هذا التفضيل على تقييم العطاءات (خصم سعري لصالح المورّدين المحليين)، وليس كنسبة محتوى محلي خاصة بالشركة -- آلية مختلفة عن LCGPA/ICV. لم يتم تحديد رقم النظام أو التشريع الدقيق ضمن المصادر المتاحة؛ الآلية والنسبة ٢٠٪ موثّقتان، أما الاستشهاد القانوني الدقيق فغير مؤكد.',
  },
  'om-icv': {
    country: 'OM', countryNameEn: 'Oman', countryNameAr: 'سلطنة عُمان',
    programNameEn: 'In-Country Value (ICV) -- not yet sourced', programNameAr: 'القيمة المحلية (ICV) — غير موثّقة بعد',
    mechanismType: 'not-yet-sourced', program: 'om-icv',
    applicableContexts: [],
    sourceNoteEn: "Oman runs its own separate ICV program (distinct from the UAE's, historically anchored in oil & gas / large-JV procurement). This research pass could not confirm an exact pillar formula or weighting to the same rigor as SA/AE/JO -- deliberately not guessed.",
    sourceNoteAr: 'تدير عُمان برنامج قيمة محلية (ICV) خاصاً بها (مختلف عن برنامج الإمارات، وتاريخياً مرتبط بقطاع النفط والغاز والمشاريع المشتركة الكبرى). لم يتمكن هذا البحث من تأكيد صيغة أركان دقيقة أو أوزان بنفس دقة السعودية والإمارات والأردن -- ولم يتم تخمينها عمداً.',
  },
  'qa-national-strategy': {
    country: 'QA', countryNameEn: 'Qatar', countryNameAr: 'دولة قطر',
    programNameEn: 'National Local Content Strategy -- not yet sourced', programNameAr: 'الاستراتيجية الوطنية للمحتوى المحلي — غير موثّقة بعد',
    mechanismType: 'not-yet-sourced', program: 'qa-national-strategy',
    applicableContexts: [],
    sourceNoteEn: "Qatar's Cabinet approved a National Local Content Strategy recently -- too new for a public formula to be sourced as of this research pass. Deliberately not guessed.",
    sourceNoteAr: 'أقرّ مجلس وزراء دولة قطر مؤخراً استراتيجية وطنية للمحتوى المحلي -- لا تزال حديثة العهد بحيث لم تُنشر صيغة حساب علنية حتى وقت هذا البحث. لم يتم تخمينها عمداً.',
  },
  'bh-local-content': {
    country: 'BH', countryNameEn: 'Bahrain', countryNameAr: 'مملكة البحرين',
    programNameEn: 'Local content framework -- not yet sourced', programNameAr: 'إطار المحتوى المحلي — غير موثّق بعد',
    mechanismType: 'not-yet-sourced', program: 'bh-local-content',
    applicableContexts: [],
    sourceNoteEn: 'This research pass found no formalized, publicly-documented national local-content scoring framework for Bahrain to the rigor applied to SA/AE/JO. Deliberately not guessed.',
    sourceNoteAr: 'لم يعثر هذا البحث على إطار وطني موثّق علنياً لتقييم المحتوى المحلي في مملكة البحرين بنفس دقة السعودية والإمارات والأردن. لم يتم تخمينه عمداً.',
  },
  'kw-local-content': {
    country: 'KW', countryNameEn: 'Kuwait', countryNameAr: 'دولة الكويت',
    programNameEn: 'Local content framework -- not yet sourced', programNameAr: 'إطار المحتوى المحلي — غير موثّق بعد',
    mechanismType: 'not-yet-sourced', program: 'kw-local-content',
    applicableContexts: [],
    sourceNoteEn: 'This research pass found no formalized, publicly-documented national local-content scoring framework for Kuwait to the rigor applied to SA/AE/JO. Deliberately not guessed.',
    sourceNoteAr: 'لم يعثر هذا البحث على إطار وطني موثّق علنياً لتقييم المحتوى المحلي في دولة الكويت بنفس دقة السعودية والإمارات والأردن. لم يتم تخمينه عمداً.',
  },
};

export const PROGRAMS: Record<LocalContentProgram, CountryFrameworkInfo> = {
  ...SA_PROGRAMS, ...AE_PROGRAMS, ...JO_OM_QA_BH_KW_PROGRAMS,
};

/** Derived view, kept for the UI's country-selector buttons and any caller
 * that only ever wants "the" framework for a country: each country's
 * DEFAULT program's framework. Not a second source of truth -- computed
 * from `PROGRAMS`. */
export const COUNTRY_FRAMEWORKS: Record<LocalContentCountry, CountryFrameworkInfo> = {
  SA: PROGRAMS[DEFAULT_PROGRAM_BY_COUNTRY.SA],
  AE: PROGRAMS[DEFAULT_PROGRAM_BY_COUNTRY.AE],
  JO: PROGRAMS[DEFAULT_PROGRAM_BY_COUNTRY.JO],
  OM: PROGRAMS[DEFAULT_PROGRAM_BY_COUNTRY.OM],
  QA: PROGRAMS[DEFAULT_PROGRAM_BY_COUNTRY.QA],
  BH: PROGRAMS[DEFAULT_PROGRAM_BY_COUNTRY.BH],
  KW: PROGRAMS[DEFAULT_PROGRAM_BY_COUNTRY.KW],
};

// ---------------------------------------------------------------------------
// Section 2 — supplier-level inputs (only the fields for the country/program
// you're assessing need to be populated; the rest are ignored)
// ---------------------------------------------------------------------------

export interface SupplierLocalContentInputs {
  /** LCGPA general (SA / 'sa-lcgpa-general') pillars -- SAR, same real
   * Guide G1 structure as lcgpaLocalContent.ts, expressed as this
   * SUPPLIER's own spend/labor breakdown. */
  sa?: {
    localLaborSAR: number | null; expatLaborSAR: number | null;
    localGoodsServicesSAR: number | null; foreignGoodsServicesSAR: number | null;
    capacityBuildingSAR: number | null;
    localAssetDepreciationSAR: number | null; totalAssetDepreciationSAR: number | null;
  };
  /** LCGPA Mandatory List (SA / 'sa-mandatory-list') -- category eligibility
   * gate inputs, deliberately binary (see file header: no sourced
   * percentage threshold). */
  saMandatoryList?: {
    /** Is the product/service category this supplier bids under one of
     * LCGPA's 233+ Mandatory List categories? */
    inMandatoryListCategory: boolean | null;
    /** Does this supplier hold the LCGPA certification/local-source status
     * required to bid in that category? Irrelevant if not in the list. */
    certifiedForCategory: boolean | null;
  };
  /** LCGPA national-product price preference (SA / 'sa-price-preference') --
   * % of this bid's value that is Saudi-national-product (self-reported,
   * caller-supplied), same shape as Jordan's mechanism. */
  saPricePreference?: {
    bidValueLocallyManufacturedPct: number | null;
  };
  /** Aramco IKTVA (SA / 'sa-iktva-aramco') -- SAR, per Aramco's own official
   * formula (see PROGRAMS['sa-iktva-aramco'].sourceNoteEn). */
  iktva?: {
    goodsServicesLocalSAR: number | null;
    assetDepreciationLocalSAR: number | null;
    expatCompensationInSaudiSAR: number | null;
    saudiWorkforceCompensationSAR: number | null;
    trainingDevelopmentSAR: number | null;
    supplierDevelopmentSAR: number | null;
    localRnDSAR: number | null;
    totalCostsSAR: number | null;
    /** Simplified single incentive-bonus input, 0-10 percentage points,
     * disclosed simplification of Aramco's tiered export-ratio/ESG bonus
     * sub-formula (see sourceNoteEn). */
    incentiveBonusPct: number | null;
  };
  /** UAE ICV (AE / 'ae-icv-general') pillars -- AED. Field-level sourced
   * bands documented next to their use in computeIcvAe(). */
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
  /** Tawazun defense offset (AE / 'ae-tawazun-offset') -- AED, per the
   * Tawazun Economic Council's 2019 policy guidelines (see PROGRAMS[
   * 'ae-tawazun-offset'].sourceNoteEn for the full sourcing). */
  aeTawazun?: {
    contractValueAED: number | null;
    /** Optional -- how much offset credit this contractor has already
     * earned/banked toward this obligation, if known. Omit/null if unknown
     * (e.g. early in the contract, before any offset activity). */
    offsetCreditsEarnedAED: number | null;
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

export interface CategoryEligibilityGateResult {
  mechanismType: 'category-eligibility-gate';
  inMandatoryListCategory: boolean | null;
  certifiedForCategory: boolean | null;
  /** true = may bid, false = gated out, null = insufficient inputs. */
  eligibleToBid: boolean | null;
}

export interface AnchorBuyerScoreResult {
  mechanismType: 'anchor-buyer-score';
  scorePct: number | null;
  components: { key: string; amountSAR: number; noteEn: string; noteAr: string }[];
  totalCostsSAR: number | null;
  incentiveBonusPct: number | null;
}

export interface OffsetObligationGateResult {
  mechanismType: 'offset-obligation-gate';
  /** true = contract value meets/exceeds the threshold (an obligation
   * exists), false = below threshold (no obligation), null = contract
   * value not supplied. */
  triggersObligation: boolean | null;
  thresholdAED: number;
  /** 60% of contractValueAED, only when triggersObligation === true;
   * 0 when triggersObligation === false (no obligation to speak of);
   * null when triggersObligation itself is unknown. */
  requiredOffsetCreditsAED: number | null;
  offsetCreditsEarnedAED: number | null;
  /** max(0, required - earned), only computable once both are known. */
  shortfallAED: number | null;
  /** 8.5% of shortfallAED -- the real sourced settlement/bank-guarantee
   * rate, only computable once shortfallAED is known. */
  shortfallPenaltyAED: number | null;
}

export interface NotYetSourcedResult {
  mechanismType: 'not-yet-sourced';
}

export type LocalContentComputation =
  | EligibleSpendRatioResult
  | WeightedPillarScoreResult
  | PricePreferenceMarginResult
  | CategoryEligibilityGateResult
  | AnchorBuyerScoreResult
  | OffsetObligationGateResult
  | NotYetSourcedResult;

export type LocalContentApplicability = 'applicable' | 'not-applicable' | 'insufficient-data';

export interface LocalContentAssessment {
  country: LocalContentCountry;
  /** Always resolved -- `DEFAULT_PROGRAM_BY_COUNTRY[country]` when the
   * caller omits `program`, so no caller ever has to guess a default. */
  program: LocalContentProgram;
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
// Section 4b — SA: LCGPA Mandatory List category-eligibility-gate (type 3).
// Deliberately binary -- see PROGRAMS['sa-mandatory-list'].sourceNoteEn
// for why no percentage threshold is modeled.
// ---------------------------------------------------------------------------

function computeMandatoryListSa(input: NonNullable<SupplierLocalContentInputs['saMandatoryList']>): CategoryEligibilityGateResult {
  const inList = input.inMandatoryListCategory;
  const certified = input.certifiedForCategory;
  let eligibleToBid: boolean | null;
  if (inList === null || inList === undefined) {
    eligibleToBid = null; // don't know if the gate even applies
  } else if (inList === false) {
    eligibleToBid = true; // gate doesn't apply outside Mandatory List categories
  } else if (certified === null || certified === undefined) {
    eligibleToBid = null; // in-list, but certification status unknown
  } else {
    eligibleToBid = certified === true;
  }
  return { mechanismType: 'category-eligibility-gate', inMandatoryListCategory: inList ?? null, certifiedForCategory: certified ?? null, eligibleToBid };
}

// ---------------------------------------------------------------------------
// Section 4c — SA/JO: shared price-preference-margin primitive (type 4).
// Structurally identical mechanism for both countries (see file header) --
// one computation, two source-notes.
// ---------------------------------------------------------------------------

function computePricePreferenceMargin(marginPct: number, sharePct: number | null | undefined): PricePreferenceMarginResult {
  const share = sharePct === undefined ? null : sharePct;
  return {
    mechanismType: 'price-preference-margin',
    preferenceMarginPct: marginPct,
    locallyManufacturedSharePct: share,
    effectiveBidDiscountPct: share !== null ? (marginPct * share) / 100 : null,
  };
}

// ---------------------------------------------------------------------------
// Section 4d — SA: Aramco IKTVA anchor-buyer-score (type 2). Real formula
// from Aramco's own official guideline -- see PROGRAMS['sa-iktva-aramco'].
// iktva% = ((A+B+C+D+R)/E) + I
// ---------------------------------------------------------------------------

function computeIktvaAramco(iktva: NonNullable<SupplierLocalContentInputs['iktva']>): AnchorBuyerScoreResult {
  const a = n(iktva.goodsServicesLocalSAR) + n(iktva.assetDepreciationLocalSAR) + n(iktva.expatCompensationInSaudiSAR);
  const b = n(iktva.saudiWorkforceCompensationSAR);
  const c = n(iktva.trainingDevelopmentSAR);
  const d = n(iktva.supplierDevelopmentSAR);
  const r = n(iktva.localRnDSAR);
  const totalCosts = iktva.totalCostsSAR ?? null;
  const bonus = Math.max(0, Math.min(10, n(iktva.incentiveBonusPct)));

  const components: AnchorBuyerScoreResult['components'] = [
    { key: 'A_goodsServicesDepreciationExpat', amountSAR: a, noteEn: 'A: local goods/services spend + local asset depreciation + Saudi-based expatriate compensation.', noteAr: 'A: إنفاق السلع/الخدمات المحلية + إهلاك الأصول المحلية + تعويضات العمالة الوافدة المقيمة في السعودية.' },
    { key: 'B_saudiWorkforceCompensation', amountSAR: b, noteEn: 'B: Saudi national workforce compensation.', noteAr: 'B: تعويضات القوى العاملة السعودية.' },
    { key: 'C_trainingDevelopment', amountSAR: c, noteEn: 'C: training & development spend.', noteAr: 'C: إنفاق التدريب والتطوير.' },
    { key: 'D_supplierDevelopment', amountSAR: d, noteEn: 'D: supplier development spend.', noteAr: 'D: إنفاق تطوير الموردين.' },
    { key: 'R_localRnD', amountSAR: r, noteEn: 'R: local research & development spend.', noteAr: 'R: إنفاق البحث والتطوير المحلي.' },
  ];

  const numerator = a + b + c + d + r;
  const scorePct = totalCosts !== null && totalCosts > 0 ? Math.min(100, (numerator / totalCosts) * 100 + bonus) : null;

  return { mechanismType: 'anchor-buyer-score', scorePct, components, totalCostsSAR: totalCosts, incentiveBonusPct: iktva.incentiveBonusPct ?? null };
}

// ---------------------------------------------------------------------------
// Section 5 — AE: UAE ICV weighted-pillar-score. Banded percentages sourced
// from a public secondary read of MoIAT's official supplier certification
// guidelines (see PROGRAMS['ae-icv-general'].sourceNoteEn for the
// verification caveat). Each band is disclosed per-pillar, not hidden
// inside one opaque number.
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

  const hasAnyAeInput = [
    ae.manufacturingOrThirdPartySpendTotalAED,
    ae.investmentNBVTotalAED,
    ae.emiratisationAnnualSpendAED,
    ae.expatriateHeadcount,
  ].some(v => v !== null && v !== undefined);

  return { mechanismType: 'weighted-pillar-score', scorePct: hasAnyAeInput ? scorePct : null, pillars, mainlandUpliftApplied: mainlandUplift };
}

// ---------------------------------------------------------------------------
// Section 5b — AE: Tawazun defense offset-obligation-gate (type 6). Real,
// sourced, computable -- see PROGRAMS['ae-tawazun-offset'] and the file
// header's "AE TAWAZUN SOURCING" section.
// ---------------------------------------------------------------------------

/** AED 36.73M -- the fixed-peg equivalent of the sourced USD 10M threshold
 * (AED/USD peg = 3.6725, unchanged since 1997). */
export const TAWAZUN_OFFSET_THRESHOLD_AED = 36_730_000;
export const TAWAZUN_OFFSET_TARGET_PCT = 60;
export const TAWAZUN_SHORTFALL_PENALTY_PCT = 8.5;

function computeTawazunOffset(input: NonNullable<SupplierLocalContentInputs['aeTawazun']>): OffsetObligationGateResult {
  const contractValue = input.contractValueAED;
  const triggersObligation = contractValue === null || contractValue === undefined ? null : contractValue >= TAWAZUN_OFFSET_THRESHOLD_AED;
  const requiredOffsetCreditsAED = triggersObligation === null
    ? null
    : triggersObligation === false
      ? 0
      : (contractValue as number) * TAWAZUN_OFFSET_TARGET_PCT / 100;
  const earned = input.offsetCreditsEarnedAED ?? null;
  const shortfallAED = requiredOffsetCreditsAED !== null && earned !== null ? Math.max(0, requiredOffsetCreditsAED - earned) : null;
  const shortfallPenaltyAED = shortfallAED !== null ? (shortfallAED * TAWAZUN_SHORTFALL_PENALTY_PCT) / 100 : null;
  return {
    mechanismType: 'offset-obligation-gate',
    triggersObligation, thresholdAED: TAWAZUN_OFFSET_THRESHOLD_AED,
    requiredOffsetCreditsAED, offsetCreditsEarnedAED: earned, shortfallAED, shortfallPenaltyAED,
  };
}

// ---------------------------------------------------------------------------
// Section 6 — JO/SA: price-preference-margin (a bid-evaluation adjustment,
// not a local-content score)
// ---------------------------------------------------------------------------

export const JORDAN_PRICE_PREFERENCE_MARGIN_PCT = 20;
export const SAUDI_PRICE_PREFERENCE_MARGIN_PCT = 10;

function computePricePreferenceJo(jo: NonNullable<SupplierLocalContentInputs['jo']>): PricePreferenceMarginResult {
  return computePricePreferenceMargin(JORDAN_PRICE_PREFERENCE_MARGIN_PCT, jo.bidValueLocallyManufacturedPct);
}

function computePricePreferenceSa(sa: NonNullable<SupplierLocalContentInputs['saPricePreference']>): PricePreferenceMarginResult {
  return computePricePreferenceMargin(SAUDI_PRICE_PREFERENCE_MARGIN_PCT, sa.bidValueLocallyManufacturedPct);
}

// ---------------------------------------------------------------------------
// Section 7 — top-level supplier assessment: resolves applicability first
// (government/SOE vs private-commercial, and sourced vs not-yet-sourced),
// then computes with the right mechanism. `program` defaults to
// `DEFAULT_PROGRAM_BY_COUNTRY[country]` when omitted, so every pre-existing
// caller keeps its exact prior behavior.
// ---------------------------------------------------------------------------

export function assessSupplierLocalContent(
  country: LocalContentCountry,
  procurementContext: ProcurementContext,
  inputs: SupplierLocalContentInputs,
  program?: LocalContentProgram,
): LocalContentAssessment {
  const resolvedProgram: LocalContentProgram = program ?? DEFAULT_PROGRAM_BY_COUNTRY[country];
  const framework: CountryFrameworkInfo = PROGRAMS[resolvedProgram];

  if (framework.mechanismType === 'not-yet-sourced') {
    return {
      country, program: resolvedProgram, procurementContext, applicability: 'insufficient-data', framework, computation: { mechanismType: 'not-yet-sourced' },
      certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR,
      reasonEn: `No local-content formula for ${framework.programNameEn} (${framework.countryNameEn}) has been sourced to this platform's verification standard yet. ${framework.sourceNoteEn}`,
      reasonAr: `لم يتم بعد توثيق صيغة محتوى محلي لـ${framework.programNameAr} (${framework.countryNameAr}) وفق معيار التحقق المعتمد في هذه المنصة. ${framework.sourceNoteAr}`,
    };
  }

  if (!framework.applicableContexts.includes(procurementContext)) {
    return {
      country, program: resolvedProgram, procurementContext, applicability: 'not-applicable', framework, computation: null,
      certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR,
      reasonEn: `${framework.programNameEn} is sourced as applying to ${framework.applicableContexts.join('/')} procurement in ${framework.countryNameEn}. No sourced evidence it applies to ${procurementContext} procurement -- this assessment does not apply here, not a zero score.`,
      reasonAr: `${framework.programNameAr} موثّق كأنه يسري على مشتريات ${framework.applicableContexts.map(c => PROCUREMENT_CONTEXT_LABEL_AR[c]).join(' / ')} في ${framework.countryNameAr}. لا يوجد دليل موثّق على سريانه على مشتريات من نوع ${PROCUREMENT_CONTEXT_LABEL_AR[procurementContext]} -- هذا التقييم لا ينطبق هنا، وليس درجة صفرية.`,
    };
  }

  let computation: LocalContentComputation;
  if (resolvedProgram === 'sa-lcgpa-general') {
    if (!inputs.sa) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'eligible-spend-ratio', scorePct: null, pillars: [] }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No SA/LCGPA pillar inputs supplied yet.', reasonAr: 'لم تُدخل بيانات أركان LCGPA بعد.' };
    }
    computation = computeLcgpaSa(inputs.sa);
  } else if (resolvedProgram === 'sa-mandatory-list') {
    if (!inputs.saMandatoryList) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'category-eligibility-gate', inMandatoryListCategory: null, certifiedForCategory: null, eligibleToBid: null }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No Mandatory List category/certification inputs supplied yet.', reasonAr: 'لم تُدخل بيانات فئة القائمة الإلزامية أو الاعتماد بعد.' };
    }
    computation = computeMandatoryListSa(inputs.saMandatoryList);
  } else if (resolvedProgram === 'sa-price-preference') {
    if (!inputs.saPricePreference) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: computePricePreferenceMargin(SAUDI_PRICE_PREFERENCE_MARGIN_PCT, null), certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No Saudi locally-manufactured bid share supplied yet.', reasonAr: 'لم تُدخل نسبة التصنيع المحلي في العطاء بعد.' };
    }
    computation = computePricePreferenceSa(inputs.saPricePreference);
  } else if (resolvedProgram === 'sa-iktva-aramco') {
    if (!inputs.iktva) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'anchor-buyer-score', scorePct: null, components: [], totalCostsSAR: null, incentiveBonusPct: null }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No IKTVA inputs supplied yet.', reasonAr: 'لم تُدخل بيانات إكتفاء بعد.' };
    }
    computation = computeIktvaAramco(inputs.iktva);
  } else if (resolvedProgram === 'ae-icv-general') {
    if (!inputs.ae) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'weighted-pillar-score', scorePct: null, pillars: [], mainlandUpliftApplied: false }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No AE/ICV pillar inputs supplied yet.', reasonAr: 'لم تُدخل بيانات أركان ICV بعد.' };
    }
    computation = computeIcvAe(inputs.ae);
  } else if (resolvedProgram === 'ae-tawazun-offset') {
    if (!inputs.aeTawazun) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'offset-obligation-gate', triggersObligation: null, thresholdAED: TAWAZUN_OFFSET_THRESHOLD_AED, requiredOffsetCreditsAED: null, offsetCreditsEarnedAED: null, shortfallAED: null, shortfallPenaltyAED: null }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No Tawazun contract-value inputs supplied yet.', reasonAr: 'لم تُدخل بيانات قيمة العقد الخاصة بتوازن بعد.' };
    }
    computation = computeTawazunOffset(inputs.aeTawazun);
  } else if (resolvedProgram === 'jo-price-preference') {
    if (!inputs.jo) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'price-preference-margin', preferenceMarginPct: JORDAN_PRICE_PREFERENCE_MARGIN_PCT, locallyManufacturedSharePct: null, effectiveBidDiscountPct: null }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No Jordan locally-manufactured bid share supplied yet.', reasonAr: 'لم تُدخل نسبة التصنيع المحلي في العطاء بعد.' };
    }
    computation = computePricePreferenceJo(inputs.jo);
  } else {
    computation = { mechanismType: 'not-yet-sourced' };
  }

  const scoreLine = computation.mechanismType === 'eligible-spend-ratio' || computation.mechanismType === 'weighted-pillar-score' || computation.mechanismType === 'anchor-buyer-score'
    ? (computation.scorePct !== null ? `directional score ${computation.scorePct.toFixed(1)}%` : 'incomplete inputs')
    : computation.mechanismType === 'price-preference-margin'
      ? (computation.effectiveBidDiscountPct !== null ? `effective bid discount ${computation.effectiveBidDiscountPct.toFixed(1)} points` : 'incomplete inputs')
      : computation.mechanismType === 'category-eligibility-gate'
        ? (computation.eligibleToBid !== null ? (computation.eligibleToBid ? 'eligible to bid' : 'gated out of this category') : 'incomplete inputs')
        : computation.mechanismType === 'offset-obligation-gate'
          ? (computation.triggersObligation === null ? 'incomplete inputs' : computation.triggersObligation ? `offset obligation triggered, required credits AED ${computation.requiredOffsetCreditsAED?.toLocaleString()}` : 'below threshold, no offset obligation')
          : 'not sourced';

  // scoreLineAr must carry the SAME information as scoreLine (bilingual-
  // completeness fix, 15 Sep 2026) -- never a shorter Arabic sentence.
  const scoreLineAr = computation.mechanismType === 'eligible-spend-ratio' || computation.mechanismType === 'weighted-pillar-score' || computation.mechanismType === 'anchor-buyer-score'
    ? (computation.scorePct !== null ? `درجة توجيهية ${computation.scorePct.toFixed(1)}٪` : 'بيانات غير مكتملة')
    : computation.mechanismType === 'price-preference-margin'
      ? (computation.effectiveBidDiscountPct !== null ? `خصم عطاء فعّال ${computation.effectiveBidDiscountPct.toFixed(1)} نقطة` : 'بيانات غير مكتملة')
      : computation.mechanismType === 'category-eligibility-gate'
        ? (computation.eligibleToBid !== null ? (computation.eligibleToBid ? 'مؤهل للتقديم' : 'مستبعد من هذه الفئة') : 'بيانات غير مكتملة')
        : computation.mechanismType === 'offset-obligation-gate'
          ? (computation.triggersObligation === null ? 'بيانات غير مكتملة' : computation.triggersObligation ? `تم تفعيل التزام المقاصة، الائتمانات المطلوبة ${computation.requiredOffsetCreditsAED?.toLocaleString()} درهم` : 'أقل من الحد، لا يوجد التزام مقاصة')
          : 'غير موثّق';

  return {
    country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation,
    certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR,
    reasonEn: `${framework.programNameEn} (${framework.countryNameEn}, ${procurementContext}): ${scoreLine}.`,
    reasonAr: `${framework.programNameAr} (${framework.countryNameAr}، ${PROCUREMENT_CONTEXT_LABEL_AR[procurementContext]}): ${scoreLineAr}.`,
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

  if (c.mechanismType === 'eligible-spend-ratio' || c.mechanismType === 'weighted-pillar-score' || c.mechanismType === 'anchor-buyer-score') {
    if (c.scorePct === null || targetThresholdPct === null || c.scorePct >= targetThresholdPct) return null;
    const gap = targetThresholdPct - c.scorePct;
    return {
      primaryEn: `Close the ${gap.toFixed(1)}-point gap directly: increase spend in the pillar(s)/component(s) with the lowest eligible share first (see the breakdown above) -- this raises the certified/directional score itself, the durable fix.`,
      primaryAr: `أغلق الفجوة البالغة ${gap.toFixed(1)} نقطة مباشرة: زد الإنفاق في الركن (المكوّن) ذي النسبة المؤهلة الأدنى أولاً (انظر التفصيل أعلاه) -- هذا يرفع الدرجة المعتمدة/التوجيهية نفسها، وهو الحل الدائم.`,
      alternativeEn: 'If the gap cannot close before this tender\'s deadline: partner or subcontract the shortfall portion of scope with an already-certified local entity, or target a different tender/procuring entity whose threshold this supplier already clears.',
      alternativeAr: 'إذا تعذّر إغلاق الفجوة قبل موعد هذه المناقصة: أشرك جهة محلية معتمدة مسبقاً كشريك أو مقاول من الباطن للجزء الناقص من النطاق، أو استهدف مناقصة/جهة شراء أخرى يفي هذا المورّد بحدّها الأدنى بالفعل.',
    };
  }
  if (c.mechanismType === 'price-preference-margin') {
    if (c.locallyManufacturedSharePct === null || c.locallyManufacturedSharePct >= 100) return null;
    return {
      primaryEn: `Increasing the locally-manufactured share of this bid raises the effective price-preference discount directly (currently ${c.effectiveBidDiscountPct?.toFixed(1) ?? '0'} of a possible ${c.preferenceMarginPct} points) -- source more of the bid's content from local manufacturing where the specification allows it.`,
      primaryAr: `زيادة الحصة المصنّعة محلياً في هذا العطاء ترفع الخصم السعري الفعلي مباشرة (حالياً ${c.effectiveBidDiscountPct?.toFixed(1) ?? '0'} من أصل ${c.preferenceMarginPct} نقطة ممكنة) -- استمد جزءاً أكبر من محتوى العطاء من التصنيع المحلي حيثما تسمح المواصفة.`,
      alternativeEn: 'If the specification genuinely cannot be met locally, the bid still competes on its own technical/commercial merits without the preference -- confirm whether the gap is decisive before investing in re-sourcing.',
      alternativeAr: 'إذا تعذّر فعلياً استيفاء المواصفة محلياً، يظل العطاء قادراً على المنافسة بمزاياه الفنية والتجارية دون التفضيل -- تأكد من أن الفجوة حاسمة قبل الاستثمار في إعادة التوريد.',
    };
  }
  if (c.mechanismType === 'category-eligibility-gate') {
    if (c.eligibleToBid !== false) return null; // only recommend when genuinely gated out
    return {
      primaryEn: 'This category is on LCGPA\'s Mandatory List and this supplier is not yet certified for it: pursue LCGPA certification for this specific category before the next bid cycle -- this is the only way to remove the gate itself.',
      primaryAr: 'هذه الفئة مدرجة في القائمة الإلزامية للهيئة، وهذا المورّد غير معتمد لها بعد: تابع الحصول على اعتماد الهيئة لهذه الفئة تحديداً قبل دورة العطاءات القادمة -- هذا هو السبيل الوحيد لإزالة البوابة نفسها.',
      alternativeEn: 'If certification cannot complete in time: bid jointly with, or subcontract to, an already-certified local entity for the mandatory-list portion of scope, or target a lot/category that is not on the Mandatory List.',
      alternativeAr: 'إذا تعذّر إتمام الاعتماد في الوقت المناسب: قدّم عطاءً مشتركاً مع جهة محلية معتمدة مسبقاً أو أسند لها كمقاول من الباطن الجزء المشمول بالقائمة الإلزامية من النطاق، أو استهدف حزمة/فئة غير مدرجة في القائمة الإلزامية.',
    };
  }
  if (c.mechanismType === 'offset-obligation-gate') {
    if (c.triggersObligation !== true || c.shortfallAED === null || c.shortfallAED <= 0) return null;
    return {
      primaryEn: `Bank real offset credits toward the AED ${c.shortfallAED.toLocaleString()} shortfall before the performance period closes (local investment, JV, or technology-transfer activity that Tawazun recognizes as credit) -- this is the only path that both closes the gap and avoids the cash/guarantee cost below.`,
      primaryAr: `اكتسب ائتمانات مقاصة حقيقية لسد النقص البالغ ${c.shortfallAED.toLocaleString()} درهم قبل إغلاق فترة الأداء (استثمار محلي، مشروع مشترك، أو نشاط نقل تقني يعترف به توازن كائتمان) -- هذا هو المسار الوحيد الذي يغلق الفجوة ويتجنب تكلفة النقد/الضمان أدناه معاً.`,
      alternativeEn: `If new offset activity cannot be arranged in time: settle the shortfall in cash at 8.5% (AED ${c.shortfallPenaltyAED?.toLocaleString() ?? '—'}) or negotiate rolling the remaining obligation into a future project with Tawazun -- both are the program's own disclosed fallback options, not a compliance failure.`,
      alternativeAr: `إذا تعذّر ترتيب نشاط مقاصة جديد في الوقت المناسب: سوِّ النقص نقداً بنسبة ٨.٥٪ (${c.shortfallPenaltyAED?.toLocaleString() ?? '—'} درهم) أو تفاوض مع توازن لترحيل الالتزام المتبقي إلى مشروع مستقبلي -- كلا الخيارين من البدائل المُفصَح عنها رسمياً في البرنامج نفسه، وليسا إخفاقاً في الامتثال.`,
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Section 9 — portfolio-level rollup (mirrors Module 05's HHI rollup
// pattern: weighted by spend share, grouped by mechanism type AND program,
// never averaged across incompatible mechanisms)
// ---------------------------------------------------------------------------

export interface PortfolioLocalContentInput {
  supplierId: string;
  spendShare: number; // 0-100, this supplier's share of the relevant portfolio spend
  assessment: LocalContentAssessment;
}

export interface PortfolioLocalContentGroup {
  country: LocalContentCountry;
  program: LocalContentProgram;
  procurementContext: ProcurementContext;
  mechanismType: LocalContentMechanismType;
  supplierCount: number;
  portfolioSpendSharePct: number; // sum of spendShare across suppliers in this group
  weightedScorePct: number | null; // score-based mechanisms (eligible-spend-ratio / weighted-pillar-score / anchor-buyer-score)
  weightedEffectiveDiscountPct: number | null; // only for price-preference-margin
  gateEligibleSharePct: number | null; // only for category-eligibility-gate: spend-share-weighted % eligible to bid
  /** Only for offset-obligation-gate: the plain SUM (not spend-weighted --
   * these are absolute currency exposures, not comparable percentages) of
   * every supplier's shortfallPenaltyAED in this group whose shortfall is
   * known. Client-level real-money exposure, not an averaged rate. */
  totalShortfallPenaltyAED: number | null;
  suppliersWithInsufficientData: number;
  suppliersNotApplicable: number;
}

export function rollUpPortfolioLocalContent(inputs: PortfolioLocalContentInput[]): PortfolioLocalContentGroup[] {
  const groups = new Map<string, PortfolioLocalContentInput[]>();
  for (const item of inputs) {
    const key = `${item.assessment.country}__${item.assessment.program}__${item.assessment.procurementContext}`;
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
    let gateEligibleSharePct: number | null = null;
    let totalShortfallPenaltyAED: number | null = null;

    if (first.framework.mechanismType === 'eligible-spend-ratio' || first.framework.mechanismType === 'weighted-pillar-score' || first.framework.mechanismType === 'anchor-buyer-score') {
      const scorable = applicableItems.filter(i => {
        const c = i.assessment.computation;
        return c && (c.mechanismType === 'eligible-spend-ratio' || c.mechanismType === 'weighted-pillar-score' || c.mechanismType === 'anchor-buyer-score') && c.scorePct !== null;
      });
      const scorableSpend = scorable.reduce((s, i) => s + i.spendShare, 0);
      if (scorableSpend > 0) {
        weightedScorePct = scorable.reduce((s, i) => {
          const c = i.assessment.computation as EligibleSpendRatioResult | WeightedPillarScoreResult | AnchorBuyerScoreResult;
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
    } else if (first.framework.mechanismType === 'category-eligibility-gate') {
      const scorable = applicableItems.filter(i => {
        const c = i.assessment.computation;
        return c && c.mechanismType === 'category-eligibility-gate' && c.eligibleToBid !== null;
      });
      const scorableSpend = scorable.reduce((s, i) => s + i.spendShare, 0);
      if (scorableSpend > 0) {
        gateEligibleSharePct = scorable.reduce((s, i) => {
          const c = i.assessment.computation as CategoryEligibilityGateResult;
          return s + (c.eligibleToBid ? 100 : 0) * (i.spendShare / scorableSpend);
        }, 0);
      }
    } else if (first.framework.mechanismType === 'offset-obligation-gate') {
      const withPenalty = applicableItems.filter(i => {
        const c = i.assessment.computation;
        return c && c.mechanismType === 'offset-obligation-gate' && c.shortfallPenaltyAED !== null;
      });
      if (withPenalty.length > 0) {
        totalShortfallPenaltyAED = withPenalty.reduce((s, i) => {
          const c = i.assessment.computation as OffsetObligationGateResult;
          return s + (c.shortfallPenaltyAED as number);
        }, 0);
      }
    }

    result.push({
      country: first.country, program: first.program, procurementContext: first.procurementContext, mechanismType: first.framework.mechanismType,
      supplierCount: items.length, portfolioSpendSharePct: totalSpendShare,
      weightedScorePct, weightedEffectiveDiscountPct, gateEligibleSharePct, totalShortfallPenaltyAED,
      suppliersWithInsufficientData: insufficientCount, suppliersNotApplicable: notApplicableCount,
    });
  }
  return result;
}
