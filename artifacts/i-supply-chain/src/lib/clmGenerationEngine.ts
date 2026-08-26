/**
 * clmGenerationEngine.ts
 *
 * Module 09 Part A -- Generation Engine v1, Option 1 ("Skeleton-only",
 * Part A.3): the NDA pilot. Per Decision Record 8.7 and Module 09 Part
 * A.3's own framing, this deliberately does NOT draft clause language --
 * Module 02 is a categorized framework, not a drafting-ready clause-
 * language bank, and this module will not paper over that gap with
 * placeholder text presented as if it were real. What it DOES produce,
 * honestly and buildably:
 *
 * 1. A real, factual cover/introduction section (parties, dates, purpose,
 *    scope summary, governing law/dispute forum) -- no legal-drafting
 *    blocker applies here, these are facts, not binding clause text.
 * 2. A.1b's derived "suggested reviewers/consensus parties" involvement
 *    map, driven by the same real signals Modules 01/02/05 already
 *    expose (governing-law mismatch, data/IP category content, industry
 *    bucket, counterparty type) -- not a fixed list, a derived one.
 * 3. A structured body outline, one section per Module 02 category, each
 *    subclause marked mandatory/optional/not-applicable **for an NDA
 *    specifically** with a short guidance note and an explicit
 *    placeholder marker where real clause text would go -- turning a
 *    blank page into a correctly-classified skeleton a lawyer or
 *    consultant fills in, honestly scoped as a skeleton, not a finished
 *    contract.
 *
 * The mandatory/optional/not-applicable judgment calls below reflect
 * widely-documented, generic NDA drafting convention (e.g. confidentiality
 * obligations typically surviving termination, payment/performance
 * categories not applying to a pure NDA) -- not a claimed jurisdiction-
 * specific legal citation. Nothing here is presented as legal advice; the
 * disclaimer below is carried through to every rendering of this output,
 * matching Module 00's Tier 2 schema convention already used elsewhere on
 * the platform.
 *
 * buildMsaSkeleton (NEW, 26 Aug 2026, item 53 -- MSA-specific skeleton
 * content authoring, logged as the follow-on to Module 09 item 46's
 * resolution that MSA is the next real-client pilot contract type): same
 * skeleton-only discipline as the NDA pilot, no clause language drafted.
 * The buildBodySection() judgment calls below are now parameterized by
 * contract type rather than hard-coded to NDA, so both pilots share one
 * assembly function. Unlike the NDA pilot -- which marked
 * commercial-payment, performance-service, and risk-allocation as not
 * applicable to a pure confidentiality agreement -- an MSA is the vehicle
 * that actually carries these three categories: it is the framework a
 * client signs once and then issues repeated SOWs/POs against, so pricing,
 * service levels, and risk allocation are core content, not edge cases.
 * The mandatory/optional split reflects widely-documented MSA drafting
 * convention (e.g. termination-for-convenience and transition-exit-
 * assistance are near-universal in a real MSA; liquidated-damages and
 * non-compete are common but deal-specific, not universal) -- not a
 * jurisdiction-specific legal citation, same honesty standard as the NDA
 * pilot.
 */

import {
  CLAUSE_CATEGORIES, SUBCLAUSES_BY_CATEGORY,
  checkForegroundIPGapFlag,
  type ClauseCategory, type ClausesPresent,
} from './clmClauseTaxonomy';
import { governingLawTrackLabel, checkGoverningLawMismatch, type GoverningLawTrack } from './clmLegalTrack';
import { type IndustryBucket } from './clmIndustryStandards';

// --- Involvement map (A.1b) ---

export interface InvolvementRole {
  id: string;
  labelEn: string; labelAr: string;
  mandatory: boolean;
  reasonEn: string; reasonAr: string;
}

function deriveInvolvementMap(input: {
  governingLawClause?: GoverningLawTrack;
  counterpartyJurisdiction?: string;
  performanceLocation?: string;
  counterpartyType?: 'government' | 'private';
  industryBucket?: IndustryBucket;
  clausesPresent?: ClausesPresent;
  /** Item 50 (owner-confirmed 26 Aug 2026): the derived roles above are the
   *  standard 8-role involvement map. This lets the client optionally name
   *  extra stakeholders for a special-case relationship the derived map
   *  doesn't cover (e.g. a named regulator liaison, an outside sponsor).
   *  Free-text, manual entry only, never inferred -- appended as suggested
   *  (never mandatory), matching how the derived optional roles already
   *  behave. */
  customStakeholders?: string[];
}): InvolvementRole[] {
  const roles: InvolvementRole[] = [];

  roles.push({
    id: 'legal-governance-owner', mandatory: true,
    labelEn: 'Legal/Governance Owner', labelAr: 'مالك القانوني/الحوكمة',
    reasonEn: 'Mandatory on every contract -- owns governing law, dispute resolution, and the general legal-governance category.',
    reasonAr: 'إلزامي في كل عقد -- يمتلك القانون الحاكم وتسوية المنازعات وفئة القانوني/الحوكمة بشكل عام.',
  });

  roles.push({
    id: 'data-protection-privacy-owner', mandatory: true,
    labelEn: 'Data Protection / Privacy Owner', labelAr: 'مالك حماية البيانات / الخصوصية',
    reasonEn: 'This document\'s entire subject is confidential-information handling -- a named Data Protection/Privacy owner is essential, not optional, distinct from general Compliance/Risk (real obligation-management practice tracks it as its own category).',
    reasonAr: 'موضوع هذه الوثيقة بأكملها هو التعامل مع المعلومات السرية -- وجود مالك مسمى لحماية البيانات/الخصوصية أساسي وليس اختيارياً، ومنفصل عن الامتثال/المخاطر العام (الممارسات الفعلية لإدارة الالتزامات تتعقبه كفئة قائمة بذاتها).',
  });

  roles.push({
    id: 'business-contract-owner', mandatory: true,
    labelEn: 'Business/Contract Owner', labelAr: 'مالك العلاقة التعاقدية',
    reasonEn: 'Accountable for the relationship day-to-day, ties to obligation tracking once this document is executed.',
    reasonAr: 'مسؤول عن العلاقة يومياً، ويرتبط بتتبع الالتزامات بعد توقيع هذه الوثيقة.',
  });

  roles.push({
    id: 'compliance-risk-owner', mandatory: false,
    labelEn: 'Compliance/Risk Owner', labelAr: 'مالك الامتثال/المخاطر',
    reasonEn: 'Suggested, not mandatory, for a standard NDA -- relevant if anti-corruption/sanctions or regulatory-compliance language is added to the Legal/Governance section.',
    reasonAr: 'مقترح وليس إلزامياً لاتفاقية سرية معيارية -- ذو صلة إذا أُضيفت صياغة مكافحة الفساد/العقوبات أو الامتثال التنظيمي إلى قسم القانوني/الحوكمة.',
  });

  if (input.counterpartyType === 'government') {
    roles.push({
      id: 'regulatory-liaison', mandatory: false,
      labelEn: 'Regulatory/Compliance Liaison', labelAr: 'منسق تنظيمي/امتثال',
      reasonEn: 'Counterparty is government-track -- a regulatory/compliance liaison is suggested per the GTPL/MOF track.',
      reasonAr: 'الطرف المقابل ضمن المسار الحكومي -- يُقترح وجود منسق تنظيمي/امتثال وفق مسار النظام الحكومي/وزارة المالية.',
    });
  }

  const mismatch = checkGoverningLawMismatch(input.governingLawClause, input.counterpartyJurisdiction, input.performanceLocation);
  if (mismatch.flagged) {
    roles.push({
      id: 'external-counsel', mandatory: false,
      labelEn: 'External Counsel', labelAr: 'مستشار قانوني خارجي',
      reasonEn: 'Suggested because the governing-law/jurisdiction check above flagged a possible mismatch -- worth an external legal read before signing.',
      reasonAr: 'مقترح لأن فحص القانون الحاكم/الولاية القضائية أعلاه رصد احتمال عدم تطابق -- يستحق مراجعة قانونية خارجية قبل التوقيع.',
    });
  }

  const industryPhysical: IndustryBucket[] = ['construction', 'om', 'logistics'];
  if (input.industryBucket && industryPhysical.includes(input.industryBucket)) {
    roles.push({
      id: 'safety-security-owner', mandatory: false,
      labelEn: 'Safety & Security Owner', labelAr: 'مالك السلامة والأمن',
      reasonEn: 'Industry bucket implies physical operations -- a Safety & Security owner is suggested, same derived logic as HSE/site-access subclauses.',
      reasonAr: 'يشير قطاع الصناعة إلى عمليات فعلية -- يُقترح وجود مالك للسلامة والأمن، بنفس منطق اشتقاق بنود HSE/الدخول للموقع.',
    });
  }

  if (input.industryBucket === 'construction') {
    roles.push({
      id: 'fidic-engineer', mandatory: false,
      labelEn: 'Independent Technical Role ("The Engineer")', labelAr: 'دور فني مستقل ("المهندس")',
      reasonEn: 'Construction bucket -- FIDIC\'s Red/Yellow Books formally define "The Engineer" as a named, contractually-empowered administrator role; flag whether it is filled.',
      reasonAr: 'قطاع الإنشاءات -- تُعرّف كتب FIDIC الأحمر/الأصفر رسمياً دور "المهندس" كجهة إدارية مخوّلة تعاقدياً وباسمها؛ تحقق من وجود من يشغل هذا الدور.',
    });
  }

  const ipGap = checkForegroundIPGapFlag(input.clausesPresent, input.industryBucket);
  if (ipGap.flagged) {
    roles.push({
      id: 'ip-owner-flagged', mandatory: false,
      labelEn: 'IP/Technical Owner (Foreground IP Gap)', labelAr: 'مالك الملكية الفكرية/الفني (فجوة الملكية الناتجة)',
      reasonEn: 'Background IP is checked but Foreground IP is not -- worth a technical/IP-aware reviewer confirming whether this NDA needs a foreground-IP position.',
      reasonAr: 'تم تحديد الملكية الفكرية السابقة دون الناتجة -- يستحق الأمر مراجعاً فنياً/مطلعاً على الملكية الفكرية للتأكد من حاجة هذه الاتفاقية لموقف بشأن الملكية الناتجة.',
    });
  }

  // Item 50: client-added stakeholders, always suggested (never mandatory --
  // the 8-role map above is the confirmed baseline), always appended last so
  // the derived roles stay first and predictable. Blank entries (e.g. a row
  // the client added but hasn't typed into yet) are silently skipped rather
  // than rendered as an empty role.
  const customStakeholders = (input.customStakeholders ?? []).filter(s => s && s.trim().length > 0);
  customStakeholders.forEach((label, i) => {
    const trimmed = label.trim();
    roles.push({
      id: `custom-${i}`, mandatory: false,
      labelEn: trimmed, labelAr: trimmed,
      reasonEn: 'Added by the client for this specific matter -- not part of the standard 8-role involvement map derived above.',
      reasonAr: 'أضافه العميل لهذه الحالة تحديداً -- ليس جزءاً من خريطة الأدوار الثمانية المشتقة أعلاه.',
    });
  });

  return roles;
}

// --- Cover / introduction section (A.2) ---

export interface GenerationParty { name: string; role: string; }

export interface CoverSection {
  partiesEn: string; partiesAr: string;
  effectiveDateEn: string; effectiveDateAr: string;
  termDurationEn: string; termDurationAr: string;
  purposeEn: string; purposeAr: string;
  scopeSummaryEn: string; scopeSummaryAr: string;
  governingLawEn: string; governingLawAr: string;
  disputeForumEn: string; disputeForumAr: string;
  involvementMap: InvolvementRole[];
}

const NOT_ENTERED_EN = '[Not yet entered -- add this before using the skeleton]';
const NOT_ENTERED_AR = '[لم يُدخل بعد -- أضيفوه قبل استخدام الهيكل]';

function buildCoverSection(input: GenerationInput): CoverSection {
  const partiesEn = input.parties.length > 0
    ? input.parties.map(p => `${p.name} (${p.role})`).join('; ')
    : NOT_ENTERED_EN;
  const partiesAr = input.parties.length > 0
    ? input.parties.map(p => `${p.name} (${p.role})`).join('؛ ')
    : NOT_ENTERED_AR;

  const governingLawEn = input.governingLawClause
    ? governingLawTrackLabel(input.governingLawClause, false)
    : '[Governing law not yet selected -- see Module 01 fields]';
  const governingLawAr = input.governingLawClause
    ? governingLawTrackLabel(input.governingLawClause, true)
    : '[لم يُحدّد القانون الحاكم بعد -- راجعوا حقول الوحدة 01]';

  const disputeVariant = input.disputeResolutionVariant
    ? SUBCLAUSES_BY_CATEGORY['legal-governance'].find(s => s.id === 'dispute-resolution')?.variants?.find(v => v.id === input.disputeResolutionVariant)
    : undefined;
  const disputeForumEn = disputeVariant ? disputeVariant.label : '[Dispute forum not yet selected -- see body section below]';
  const disputeForumAr = disputeVariant ? disputeVariant.labelAr : '[لم تُحدّد جهة تسوية المنازعات بعد -- راجعوا القسم أدناه]';

  return {
    partiesEn, partiesAr,
    effectiveDateEn: input.effectiveDate ?? NOT_ENTERED_EN,
    effectiveDateAr: input.effectiveDate ?? NOT_ENTERED_AR,
    termDurationEn: input.termDuration ?? NOT_ENTERED_EN,
    termDurationAr: input.termDuration ?? NOT_ENTERED_AR,
    purposeEn: input.purposeStatement?.en ?? '[Enter the purpose of this NDA, e.g. "to evaluate a potential business relationship between the parties"]',
    purposeAr: input.purposeStatement?.ar ?? '[أدخلوا الغرض من اتفاقية السرية هذه، مثال: "لتقييم إمكانية إقامة علاقة عمل بين الطرفين"]',
    scopeSummaryEn: input.scopeOfWorkSummary?.en ?? '[Enter a one-line summary of what information/discussions this NDA covers]',
    scopeSummaryAr: input.scopeOfWorkSummary?.ar ?? '[أدخلوا ملخصاً من سطر واحد للمعلومات/المناقشات التي تغطيها اتفاقية السرية هذه]',
    governingLawEn, governingLawAr,
    disputeForumEn, disputeForumAr,
    involvementMap: deriveInvolvementMap(input),
  };
}

// --- Body outline (A.2 + A.3 Option 1) ---

export interface BodySubclauseOutline {
  id: string;
  labelEn: string; labelAr: string;
  mandatory: boolean;
  guidanceEn: string; guidanceAr: string;
  placeholderEn: string; placeholderAr: string;
}

export interface BodyCategorySection {
  category: ClauseCategory;
  labelEn: string; labelAr: string;
  applicable: boolean;
  notApplicableNoteEn?: string; notApplicableNoteAr?: string;
  subclauses: BodySubclauseOutline[];
}

/** NDA-specific mandatory/optional judgment per subclause -- widely-
 *  documented generic NDA drafting convention, not a jurisdiction-specific
 *  legal citation. Subclauses not listed here for an applicable category
 *  default to optional with a generic guidance note. */
const NDA_SUBCLAUSE_NOTES: Partial<Record<string, { mandatory: boolean; guidanceEn: string; guidanceAr: string }>> = {
  'confidentiality-nda': { mandatory: true,
    guidanceEn: 'The core subject of this document -- define what qualifies as confidential information, permitted use, and to whom it may be disclosed.',
    guidanceAr: 'الموضوع الجوهري لهذه الوثيقة -- حددوا ما يُعد معلومات سرية، والاستخدام المسموح به، والجهات التي يجوز الإفصاح لها.' },
  'ip-ownership-background': { mandatory: true,
    guidanceEn: 'State that any IP each party already owns coming into this NDA remains theirs -- disclosure under this NDA does not transfer ownership.',
    guidanceAr: 'وضّحوا أن أي ملكية فكرية يملكها كل طرف مسبقاً تبقى ملكاً له -- الإفصاح بموجب هذه الاتفاقية لا ينقل الملكية.' },
  'ip-ownership-foreground': { mandatory: false,
    guidanceEn: 'Not typical for a pure NDA (no new work product is usually created) -- include only if the discussions covered by this NDA might produce joint work product.',
    guidanceAr: 'غير معتاد في اتفاقية سرية بحتة (عادة لا يُستحدث نتاج عمل جديد) -- أدرجوه فقط إذا كانت المناقشات المشمولة بهذه الاتفاقية قد تنتج عملاً مشتركاً.' },
  'data-protection-pdpl': { mandatory: true,
    guidanceEn: 'If the confidential information disclosed includes personal data, PDPL compliance language is essential, not optional.',
    guidanceAr: 'إذا تضمّنت المعلومات السرية المُفصح عنها بيانات شخصية، فإن صياغة الامتثال لنظام حماية البيانات الشخصية أساسية وليست اختيارية.' },
  'data-residency-cross-border': { mandatory: false,
    guidanceEn: 'Relevant mainly if the counterparty or its systems are outside Saudi Arabia.',
    guidanceAr: 'ذو صلة بشكل أساسي إذا كان الطرف المقابل أو أنظمته خارج المملكة العربية السعودية.' },
  'governing-law': { mandatory: true, guidanceEn: 'Confirm against the counterparty jurisdiction and performance location (Module 01 flag above).', guidanceAr: 'تأكدوا من التطابق مع ولاية الطرف المقابل وموقع التنفيذ (تنبيه الوحدة 01 أعلاه).' },
  'dispute-resolution': { mandatory: true, guidanceEn: 'Choose the forum before signing -- litigation, institutional arbitration, ad-hoc arbitration, or mediation-then-arbitration.', guidanceAr: 'اختاروا الجهة قبل التوقيع -- التقاضي، أو التحكيم المؤسسي، أو التحكيم المخصص، أو الوساطة ثم التحكيم.' },
  'notices': { mandatory: true, guidanceEn: 'Name the official channel and address for legally-binding notices between the parties.', guidanceAr: 'حددوا القناة والعنوان الرسمي للإشعارات الملزمة قانونياً بين الطرفين.' },
  'entire-agreement': { mandatory: true, guidanceEn: 'Standard boilerplate confirming this document supersedes prior discussions on the same subject.', guidanceAr: 'صياغة معيارية تؤكد أن هذه الوثيقة تحل محل المناقشات السابقة حول الموضوع ذاته.' },
  'local-content-saudization': { mandatory: false,
    guidanceEn: 'Not applicable to a standard NDA -- this is a goods/construction/services special condition.',
    guidanceAr: 'لا ينطبق على اتفاقية سرية معيارية -- هذا شرط خاص بعقود البضائع/الإنشاءات/الخدمات.' },
  'term-renewal-mechanism': { mandatory: true, guidanceEn: 'How long the NDA itself stays in force -- distinct from how long confidentiality obligations survive (see Survival Clauses).', guidanceAr: 'مدة سريان اتفاقية السرية نفسها -- بخلاف مدة بقاء التزامات السرية سارية (انظر بند البقاء بعد الإنهاء).' },
  'survival-clauses': { mandatory: true,
    guidanceEn: 'The defining feature of most NDAs -- confidentiality obligations typically survive termination of the document itself for a stated period (e.g. 2-5 years) or indefinitely for trade secrets.',
    guidanceAr: 'السمة الجوهرية لمعظم اتفاقيات السرية -- تبقى التزامات السرية سارية عادة بعد انتهاء الوثيقة نفسها لمدة محددة (مثال: 2-5 سنوات) أو بلا حد زمني بالنسبة للأسرار التجارية.' },
  'non-solicitation-of-personnel': { mandatory: false,
    guidanceEn: 'Common when the NDA precedes M&A or partnership talks -- restricts either party from hiring the other\'s staff during discussions.',
    guidanceAr: 'شائع عندما تسبق اتفاقية السرية مفاوضات اندماج واستحواذ أو شراكة -- تقيّد توظيف أي طرف لموظفي الطرف الآخر أثناء المناقشات.' },
};

const NDA_NOT_APPLICABLE_CATEGORIES: Partial<Record<ClauseCategory, { en: string; ar: string }>> = {
  'commercial-payment': {
    en: 'Not applicable to a standard NDA -- there is no price, payment schedule, or invoicing under a pure confidentiality agreement.',
    ar: 'لا تنطبق على اتفاقية سرية معيارية -- لا يوجد سعر أو جدول دفعات أو فوترة بموجب اتفاقية سرية بحتة.',
  },
  'performance-service': {
    en: 'Not applicable to a standard NDA -- there is no scope-of-work, acceptance criteria, or SLA to perform against.',
    ar: 'لا تنطبق على اتفاقية سرية معيارية -- لا يوجد نطاق عمل أو معايير قبول أو اتفاقية مستوى خدمة يُقاس الأداء مقابلها.',
  },
  'risk-allocation': {
    en: 'Uncommon on a standard NDA -- most NDAs carry no liability cap or indemnification. Some parties add a liability cap for high-sensitivity disclosures; treat this category as optional, not a gap.',
    ar: 'غير معتاد في اتفاقية سرية معيارية -- معظم اتفاقيات السرية لا تتضمن سقف مسؤولية أو تعويضاً. يضيف بعض الأطراف سقف مسؤولية للإفصاحات عالية الحساسية؛ تعاملوا مع هذه الفئة كاختيارية، لا كفجوة.',
  },
};

type SubclauseNotesMap = Partial<Record<string, { mandatory: boolean; guidanceEn: string; guidanceAr: string }>>;
type NotApplicableMap = Partial<Record<ClauseCategory, { en: string; ar: string }>>;

const SKELETON_PLACEHOLDER_EN = '[Clause text goes here -- Module 09 v1 is a structural skeleton only; have qualified legal counsel draft or review the actual wording. This is not legal advice.]';
const SKELETON_PLACEHOLDER_AR = '[نص البند يوضع هنا -- الإصدار الأول من الوحدة 09 هيكل بنيوي فقط؛ اطلبوا من مستشار قانوني مؤهل صياغة النص الفعلي أو مراجعته. هذا ليس استشارة قانونية.]';

/**
 * Contract-type-parameterized body-section builder (generalized 26 Aug
 * 2026, item 53, to serve both the NDA pilot and the new MSA pilot from
 * one assembly function). subclauseNotes/notApplicableCategories carry
 * the per-contract-type judgment calls; defaultGuidanceEn/Ar is the
 * fallback for a subclause with no specific note (still contract-type-
 * aware, e.g. "Optional for a standard NDA" vs "Optional for a standard
 * MSA").
 */
function buildBodySection(
  category: ClauseCategory,
  subclauseNotes: SubclauseNotesMap,
  notApplicableCategories: NotApplicableMap,
  defaultGuidanceEn: string,
  defaultGuidanceAr: string,
): BodyCategorySection {
  const meta = CLAUSE_CATEGORIES.find(c => c.id === category)!;
  const notApplicable = notApplicableCategories[category];

  if (notApplicable) {
    return {
      category, labelEn: meta.label, labelAr: meta.labelAr,
      applicable: false,
      notApplicableNoteEn: notApplicable.en, notApplicableNoteAr: notApplicable.ar,
      subclauses: [],
    };
  }

  const subclauses: BodySubclauseOutline[] = SUBCLAUSES_BY_CATEGORY[category].map(sc => {
    const note = subclauseNotes[sc.id];
    return {
      id: sc.id, labelEn: sc.label, labelAr: sc.labelAr,
      mandatory: note?.mandatory ?? false,
      guidanceEn: note?.guidanceEn ?? defaultGuidanceEn,
      guidanceAr: note?.guidanceAr ?? defaultGuidanceAr,
      placeholderEn: SKELETON_PLACEHOLDER_EN,
      placeholderAr: SKELETON_PLACEHOLDER_AR,
    };
  });

  return { category, labelEn: meta.label, labelAr: meta.labelAr, applicable: true, subclauses };
}

// --- Assembly ---

export interface GenerationInput {
  parties: GenerationParty[];
  effectiveDate?: string;
  termDuration?: string;
  purposeStatement?: { en: string; ar: string };
  scopeOfWorkSummary?: { en: string; ar: string };
  governingLawClause?: GoverningLawTrack;
  counterpartyJurisdiction?: string;
  performanceLocation?: string;
  counterpartyType?: 'government' | 'private';
  industryBucket?: IndustryBucket;
  clausesPresent?: ClausesPresent;
  disputeResolutionVariant?: string;
  /** Item 50: optional client-named stakeholders beyond the standard
   *  8-role involvement map (see deriveInvolvementMap above). Free text,
   *  manual only, for special-case relationships. */
  customStakeholders?: string[];
}

export interface GeneratedSkeleton {
  /** Which pilot produced this skeleton -- drives the render title (item
   *  53, 26 Aug 2026, when the MSA pilot was added alongside NDA). */
  contractTypeLabelEn: string; contractTypeLabelAr: string;
  disclaimerEn: string; disclaimerAr: string;
  cover: CoverSection;
  body: BodyCategorySection[];
}

const DISCLAIMER_EN = 'This is a structural skeleton -- introduction facts and a classified clause outline -- not a finished legal document. No clause language has been drafted. This is not legal advice; have qualified legal counsel draft or review the actual contract text before use.';
const DISCLAIMER_AR = 'هذا هيكل بنيوي فقط -- وقائع تمهيدية ومخطط بنود مصنّف -- وليس وثيقة قانونية نهائية. لم تُصاغ أي نصوص بنود. هذا ليس استشارة قانونية؛ اطلبوا من مستشار قانوني مؤهل صياغة نص العقد الفعلي أو مراجعته قبل الاستخدام.';

const NDA_DEFAULT_GUIDANCE_EN = 'Optional for a standard NDA -- include if relevant to this specific relationship.';
const NDA_DEFAULT_GUIDANCE_AR = 'اختياري لاتفاقية سرية معيارية -- أدرجوه إذا كان ذا صلة بهذه العلاقة تحديداً.';

/**
 * Builds the NDA pilot skeleton (Module 09 Part A, Option 1). Pure
 * function over already-tested Module 01/02/05 checks -- no AI call, no
 * new legal-content risk, honestly scoped as a skeleton per Decision
 * Record 8.7.
 */
export function buildNdaSkeleton(input: GenerationInput): GeneratedSkeleton {
  return {
    contractTypeLabelEn: 'NDA', contractTypeLabelAr: 'اتفاقية عدم إفصاح',
    disclaimerEn: DISCLAIMER_EN,
    disclaimerAr: DISCLAIMER_AR,
    cover: buildCoverSection(input),
    body: CLAUSE_CATEGORIES.map(c => buildBodySection(c.id, NDA_SUBCLAUSE_NOTES, NDA_NOT_APPLICABLE_CATEGORIES, NDA_DEFAULT_GUIDANCE_EN, NDA_DEFAULT_GUIDANCE_AR)),
  };
}

/** MSA-specific mandatory/optional judgment per subclause (item 53, 26 Aug
 *  2026) -- widely-documented generic MSA drafting convention, not a
 *  jurisdiction-specific legal citation, same honesty standard as the NDA
 *  notes above. Unlike the NDA pilot, no category is marked not-applicable:
 *  an MSA is exactly the vehicle that carries pricing, service levels, and
 *  risk allocation for an ongoing relationship, so
 *  commercial-payment/performance-service/risk-allocation are core content
 *  here, not edge cases. */
const MSA_SUBCLAUSE_NOTES: Partial<Record<string, { mandatory: boolean; guidanceEn: string; guidanceAr: string }>> = {
  // -- commercial-payment --
  'price-consideration': { mandatory: true,
    guidanceEn: 'The commercial anchor of the MSA -- typically a rate card, unit pricing, or pricing mechanism that each SOW/PO issued under this agreement then references, not a single fixed price.',
    guidanceAr: 'المرتكز التجاري لهذا الاتفاق الإطاري -- عادة بطاقة أسعار أو تسعير بالوحدة أو آلية تسعير تشير إليها كل أوامر العمل الصادرة بموجبه، لا سعراً ثابتاً واحداً.' },
  'payment-schedule': { mandatory: true,
    guidanceEn: 'State how invoicing cadence ties to milestones, deliverables, or a recurring billing cycle across the term of the agreement.',
    guidanceAr: 'وضّحوا كيف يرتبط توقيت الفوترة بالمعالم الزمنية أو المخرجات أو دورة فوترة متكررة طوال مدة الاتفاق.' },
  'invoicing-mechanism': { mandatory: true,
    guidanceEn: 'Name the invoicing process and any PO-matching requirement -- critical for an ongoing relationship spanning multiple SOWs/orders.',
    guidanceAr: 'حددوا آلية إصدار الفواتير وأي متطلب لمطابقة أوامر الشراء -- أمر جوهري لعلاقة مستمرة تشمل عدة أوامر عمل.' },
  'payment-terms-net-days': { mandatory: true,
    guidanceEn: 'Standard commercial term (e.g. Net 30/45/60) -- confirm consistency with the counterparty\'s own standard terms before signing.',
    guidanceAr: 'شرط تجاري معياري (مثال: صافي 30/45/60 يوماً) -- تأكدوا من اتساقه مع الشروط المعيارية للطرف المقابل قبل التوقيع.' },
  'late-payment-interest-penalty': { mandatory: false,
    guidanceEn: 'Common in MSAs with recurring invoicing; confirm it does not conflict with interest-treatment rules under the chosen governing law.',
    guidanceAr: 'شائع في الاتفاقيات الإطارية ذات الفوترة المتكررة؛ تأكدوا من عدم تعارضه مع قواعد معاملة الفائدة بموجب القانون الحاكم المختار.' },
  'taxes-vat': { mandatory: true,
    guidanceEn: 'Confirm VAT treatment and responsibility, especially for a multi-year MSA that may span a tax-rate or regulation change.',
    guidanceAr: 'تأكدوا من معاملة ضريبة القيمة المضافة والمسؤولية عنها، خاصة في اتفاق إطاري متعدد السنوات قد يشهد تغيّراً في نسبة الضريبة أو الأنظمة.' },
  'retention-of-title': { mandatory: false,
    guidanceEn: 'Relevant mainly if the MSA covers supply of goods -- confirms ownership does not transfer until payment.',
    guidanceAr: 'ذو صلة أساساً إذا كان الاتفاق الإطاري يغطي توريد بضائع -- يؤكد أن الملكية لا تنتقل إلا بعد السداد.' },
  'cost-records-audit-rights': { mandatory: false,
    guidanceEn: 'Important if any SOW under this MSA is priced cost-plus or time-and-materials -- gives the client the right to audit the vendor\'s cost records.',
    guidanceAr: 'مهم إذا كان أي أمر عمل بموجب هذا الاتفاق مسعّراً على أساس التكلفة زائد هامش أو الوقت والمواد -- يمنح العميل حق تدقيق سجلات تكلفة المورد.' },
  // -- performance-service --
  'scope-of-work-reference': { mandatory: true,
    guidanceEn: 'The MSA itself typically has no fixed scope -- state explicitly that scope is defined by the SOWs/work orders issued under it, and how each SOW incorporates this MSA\'s terms.',
    guidanceAr: 'لا يحمل الاتفاق الإطاري نفسه عادة نطاق عمل ثابتاً -- وضّحوا صراحة أن النطاق يُحدد عبر أوامر العمل الصادرة بموجبه، وكيفية تضمين كل أمر عمل لشروط هذا الاتفاق.' },
  'acceptance-criteria': { mandatory: true,
    guidanceEn: 'Define a default at the MSA level, with room for each SOW to set its own specific acceptance criteria.',
    guidanceAr: 'حددوا معياراً افتراضياً على مستوى الاتفاق الإطاري، مع إتاحة المجال لكل أمر عمل لتحديد معايير قبول خاصة به.' },
  'performance-service-levels': { mandatory: true,
    guidanceEn: 'Central to most MSAs -- the SLA/KPI framework the vendor is held to across every SOW issued under this agreement.',
    guidanceAr: 'جوهري في معظم الاتفاقيات الإطارية -- إطار مستوى الخدمة ومؤشرات الأداء الذي يُقاس عليه المورد في كل أمر عمل صادر بموجب هذا الاتفاق.' },
  'delivery-schedule-milestones': { mandatory: true,
    guidanceEn: 'MSA-level default milestone/delivery framework, with each SOW able to set its own schedule.',
    guidanceAr: 'إطار افتراضي للمعالم الزمنية والتسليم على مستوى الاتفاق الإطاري، مع إمكانية أن يحدد كل أمر عمل جدوله الخاص.' },
  'defects-liability-warranty-period': { mandatory: true,
    guidanceEn: 'Standard warranty period applying across the relationship unless a specific SOW states otherwise.',
    guidanceAr: 'فترة ضمان معيارية تسري على العلاقة التعاقدية ككل ما لم ينص أمر عمل محدد على خلاف ذلك.' },
  'remedies-non-performance': { mandatory: true,
    guidanceEn: 'What happens when service levels are missed -- service credits, cure periods, or escalation toward termination for cause.',
    guidanceAr: 'ما الذي يحدث عند عدم الوفاء بمستويات الخدمة -- خصومات مستوى الخدمة، أو فترات معالجة، أو تصعيد نحو الإنهاء لسبب.' },
  'service-credits': { mandatory: false,
    guidanceEn: 'Common where performance-service-levels are quantified (SLA/KPI) -- ties a real remedy to a missed metric.',
    guidanceAr: 'شائع عندما تكون مستويات الأداء مقيسة رقمياً (اتفاقية مستوى الخدمة/مؤشرات الأداء) -- يربط علاجاً حقيقياً بمؤشر لم يتحقق.' },
  'hse-compliance': { mandatory: false,
    guidanceEn: 'Effectively mandatory for any MSA involving on-site work, logistics, or construction; not typically relevant to a pure remote-services MSA.',
    guidanceAr: 'إلزامي فعلياً لأي اتفاق إطاري يشمل عملاً ميدانياً أو لوجستياً أو إنشائياً؛ غير ذي صلة عادة باتفاق خدمات عن بُعد بحت.' },
  // -- risk-allocation --
  'limitation-of-liability': { mandatory: true,
    guidanceEn: 'One of the most negotiated MSA terms -- confirm the cap basis (contract value, fees paid, uncapped) applies consistently across every SOW issued under this agreement.',
    guidanceAr: 'من أكثر بنود الاتفاق الإطاري خضوعاً للتفاوض -- تأكدوا من أن أساس السقف (قيمة العقد، الرسوم المدفوعة، بدون سقف) يسري بشكل متسق على كل أمر عمل صادر بموجب هذا الاتفاق.' },
  'indemnification': { mandatory: true,
    guidanceEn: 'Define direction (mutual, one-way) and scope -- especially IP-infringement and third-party claims, both common in ongoing vendor relationships.',
    guidanceAr: 'حددوا الاتجاه (تبادلي أم باتجاه واحد) والنطاق -- خاصة مطالبات التعدي على الملكية الفكرية ومطالبات الغير، الشائعة في علاقات الموردين المستمرة.' },
  'force-majeure': { mandatory: true,
    guidanceEn: 'Standard boilerplate, but confirm it covers events actually relevant to the services/goods supplied (e.g. supply-chain disruption for a logistics MSA).',
    guidanceAr: 'صياغة معيارية، لكن تأكدوا من أنها تغطي الأحداث ذات الصلة الفعلية بالخدمات/البضائع المورَّدة (مثال: اضطراب سلسلة الإمداد في اتفاق لوجستي).' },
  'insurance-requirements': { mandatory: true,
    guidanceEn: 'MSAs commonly require the vendor to carry and evidence specific insurance coverage (professional indemnity, public liability) for the life of the agreement.',
    guidanceAr: 'تشترط الاتفاقيات الإطارية عادة أن يحمل المورد ويثبت تغطية تأمينية محددة (تعويض مهني، مسؤولية عامة) طوال مدة الاتفاق.' },
  'consequential-damages-exclusion': { mandatory: true,
    guidanceEn: 'Standard MSA risk-shifting clause -- confirm it is mutual, not one-sided, unless there is a specific commercial reason for asymmetry.',
    guidanceAr: 'بند معياري لتوزيع المخاطر في الاتفاقيات الإطارية -- تأكدوا من أنه تبادلي وليس باتجاه واحد، ما لم يوجد سبب تجاري محدد لعدم التماثل.' },
  'liquidated-damages-delay-penalties': { mandatory: false,
    guidanceEn: 'Relevant where delivery-schedule-milestones carries real commercial consequence (e.g. logistics, construction-adjacent services).',
    guidanceAr: 'ذو صلة عندما يترتب على جدول التسليم/المعالم الزمنية أثر تجاري حقيقي (مثال: الخدمات اللوجستية أو شبه الإنشائية).' },
  // -- legal-governance --
  'governing-law': { mandatory: true, guidanceEn: 'Confirm against the counterparty jurisdiction and performance location (Module 01 flag above).', guidanceAr: 'تأكدوا من التطابق مع ولاية الطرف المقابل وموقع التنفيذ (تنبيه الوحدة 01 أعلاه).' },
  'dispute-resolution': { mandatory: true, guidanceEn: 'Choose the forum before signing -- litigation, institutional arbitration, ad-hoc arbitration, or mediation-then-arbitration.', guidanceAr: 'اختاروا الجهة قبل التوقيع -- التقاضي، أو التحكيم المؤسسي، أو التحكيم المخصص، أو الوساطة ثم التحكيم.' },
  'assignment-subcontracting': { mandatory: true,
    guidanceEn: 'Confirm whether the vendor may subcontract SOW delivery, and whether assignment of the MSA itself requires consent -- both common negotiation points in ongoing vendor relationships.',
    guidanceAr: 'حددوا ما إذا كان يجوز للمورد التعاقد من الباطن لتنفيذ أوامر العمل، وما إذا كان التنازل عن الاتفاق الإطاري نفسه يستلزم موافقة -- نقطتان شائعتا التفاوض في علاقات الموردين المستمرة.' },
  'notices': { mandatory: true, guidanceEn: 'Name the official channel and address for legally-binding notices between the parties.', guidanceAr: 'حددوا القناة والعنوان الرسمي للإشعارات الملزمة قانونياً بين الطرفين.' },
  'entire-agreement': { mandatory: true,
    guidanceEn: 'Needs a specific carve-out stating that SOWs/purchase orders issued under this MSA are incorporated by reference, not excluded by the entire-agreement clause.',
    guidanceAr: 'يحتاج استثناءً محدداً ينص على أن أوامر العمل والشراء الصادرة بموجب هذا الاتفاق مُدرجة بالإشارة، وليست مستبعدة ببند الاتفاقية الكاملة.' },
  'amendment-variation-procedure': { mandatory: true,
    guidanceEn: 'Define how the MSA itself is amended, distinct from how an individual SOW\'s scope is varied (change-order procedure).',
    guidanceAr: 'حددوا آلية تعديل الاتفاق الإطاري نفسه، تمييزاً عن آلية تعديل نطاق أمر عمل محدد (إجراء أمر التغيير).' },
  'severability': { mandatory: true, guidanceEn: 'Standard boilerplate -- confirm an invalid clause does not void the entire MSA.', guidanceAr: 'صياغة معيارية -- تؤكد أن بطلان بند واحد لا يُبطل الاتفاق الإطاري بأكمله.' },
  'language-of-contract': { mandatory: true, guidanceEn: 'State which language version prevails, matching Module 01\'s governing-law practice note above where applicable.', guidanceAr: 'حددوا النسخة اللغوية السارية، بما يتسق مع ملاحظة الممارسة الخاصة بالقانون الحاكم في الوحدة 01 أعلاه حيثما انطبق.' },
  'regulatory-compliance': { mandatory: true, guidanceEn: 'Standard boilerplate confirming both parties will comply with applicable law throughout the term.', guidanceAr: 'صياغة معيارية تؤكد التزام الطرفين بالأنظمة المعمول بها طوال مدة الاتفاق.' },
  'anti-corruption-sanctions': { mandatory: true, guidanceEn: 'Standard boilerplate, increasingly expected in any real commercial MSA.', guidanceAr: 'صياغة معيارية، باتت متوقعة في أي اتفاق إطاري تجاري حقيقي.' },
  'local-content-saudization': { mandatory: false,
    guidanceEn: 'Applicable when at least one party or the performance location is in Saudi Arabia -- confirm against Module 05\'s industry/SOW fields.',
    guidanceAr: 'ينطبق عندما يكون أحد الطرفين أو موقع التنفيذ في المملكة العربية السعودية -- تأكدوا بالرجوع إلى حقول الصناعة/نطاق العمل في الوحدة 05.' },
  // -- data-ip-confidentiality --
  'confidentiality-nda': { mandatory: true,
    guidanceEn: 'MSAs typically embed confidentiality terms directly rather than requiring a separate NDA -- confirm this MSA is not meant to sit alongside a standalone NDA already in place with the same counterparty.',
    guidanceAr: 'تُضمّن الاتفاقيات الإطارية عادة شروط السرية مباشرة بدلاً من اشتراط اتفاقية سرية منفصلة -- تأكدوا من أن هذا الاتفاق لا يُقصد به التزامن مع اتفاقية سرية قائمة مسبقاً مع الطرف المقابل نفسه.' },
  'ip-ownership-background': { mandatory: true,
    guidanceEn: 'State that any IP each party already owns coming into this MSA remains theirs -- work performed under it does not transfer background IP ownership.',
    guidanceAr: 'وضّحوا أن أي ملكية فكرية يملكها كل طرف مسبقاً تبقى ملكاً له -- العمل المُنفَّذ بموجب هذا الاتفاق لا ينقل ملكية الملكية الفكرية السابقة.' },
  'ip-ownership-foreground': { mandatory: true,
    guidanceEn: 'More consequential than in an NDA -- an MSA usually results in real deliverables/work product; state ownership clearly (client-owns, vendor-owns-with-license, joint ownership).',
    guidanceAr: 'أكثر أهمية من الحال في اتفاقية السرية -- ينتج عن الاتفاق الإطاري عادة مخرجات عمل حقيقية؛ حددوا الملكية بوضوح (يملكها العميل، يملكها المورد مع ترخيص، ملكية مشتركة).' },
  'data-protection-pdpl': { mandatory: true,
    guidanceEn: 'If any SOW under this MSA involves personal data, PDPL compliance language is essential, not optional.',
    guidanceAr: 'إذا تضمّن أي أمر عمل بموجب هذا الاتفاق بيانات شخصية، فإن صياغة الامتثال لنظام حماية البيانات الشخصية أساسية وليست اختيارية.' },
  // -- strategic-exit --
  'term-renewal-mechanism': { mandatory: true,
    guidanceEn: 'MSAs commonly run multi-year with auto-renewal or an explicit renewal decision point -- confirm which, and the notice period required to opt out.',
    guidanceAr: 'تمتد الاتفاقيات الإطارية عادة لسنوات متعددة مع تجديد تلقائي أو نقطة قرار تجديد صريحة -- حددوا أيّهما، ومدة الإشعار المطلوبة للانسحاب.' },
  'termination-for-convenience': { mandatory: true,
    guidanceEn: 'A defining MSA feature -- confirm the notice period and whether any break fee or wind-down compensation applies.',
    guidanceAr: 'سمة جوهرية للاتفاقيات الإطارية -- تأكدوا من مدة الإشعار وما إذا كان يسري رسم إنهاء مبكر أو تعويض تصفية.' },
  'termination-for-cause': { mandatory: true, guidanceEn: 'Name the specific breach thresholds that trigger termination for cause, distinct from termination for convenience above.', guidanceAr: 'حددوا عتبات الإخلال المحددة التي تُفعّل الإنهاء لسبب، تمييزاً عن الإنهاء للمصلحة أعلاه.' },
  'transition-exit-assistance': { mandatory: true,
    guidanceEn: 'Important for an ongoing relationship -- what the vendor must do to help transition services back in-house or to a new vendor at term-end.',
    guidanceAr: 'مهم لعلاقة مستمرة -- ما الذي يجب على المورد فعله للمساعدة في نقل الخدمات داخلياً أو إلى مورد جديد عند انتهاء المدة.' },
  'survival-clauses': { mandatory: true, guidanceEn: 'Name which obligations (confidentiality, IP, indemnification) survive termination and for how long.', guidanceAr: 'حددوا الالتزامات (السرية، الملكية الفكرية، التعويض) التي تبقى سارية بعد الإنهاء ولأي مدة.' },
  'non-compete-exclusivity': { mandatory: false,
    guidanceEn: 'Relevant only if this MSA is meant to be an exclusive/preferred-vendor arrangement.',
    guidanceAr: 'ذو صلة فقط إذا كان هذا الاتفاق يُقصد به ترتيب مورد حصري/مفضّل.' },
  'mfc-benchmarking-rights': { mandatory: false,
    guidanceEn: 'Common in larger, longer-term MSAs -- a periodic right to benchmark pricing/terms against market rates.',
    guidanceAr: 'شائع في الاتفاقيات الإطارية الأكبر والأطول أجلاً -- حق دوري بمقارنة الأسعار/الشروط مرجعياً مع أسعار السوق.' },
};

/** No category is not-applicable for an MSA (see header comment) -- kept
 *  as an explicit empty object, not omitted, so the parallel with
 *  NDA_NOT_APPLICABLE_CATEGORIES stays visible and intentional at the call
 *  site. */
const MSA_NOT_APPLICABLE_CATEGORIES: Partial<Record<ClauseCategory, { en: string; ar: string }>> = {};

const MSA_DEFAULT_GUIDANCE_EN = 'Optional for a standard MSA -- include if relevant to this specific ongoing commercial relationship.';
const MSA_DEFAULT_GUIDANCE_AR = 'اختياري لاتفاق إطاري معياري -- أدرجوه إذا كان ذا صلة بهذه العلاقة التجارية المستمرة تحديداً.';

/**
 * Builds the MSA pilot skeleton (Module 09 Part A, item 53, 26 Aug 2026 --
 * the follow-on to item 46's resolution that MSA is the next real-client
 * pilot contract type). Same skeleton-only discipline, same
 * GenerationInput/CoverSection reuse as the NDA pilot -- only the
 * per-subclause judgment calls differ.
 */
export function buildMsaSkeleton(input: GenerationInput): GeneratedSkeleton {
  return {
    contractTypeLabelEn: 'MSA', contractTypeLabelAr: 'اتفاقية إطارية',
    disclaimerEn: DISCLAIMER_EN,
    disclaimerAr: DISCLAIMER_AR,
    cover: buildCoverSection(input),
    body: CLAUSE_CATEGORIES.map(c => buildBodySection(c.id, MSA_SUBCLAUSE_NOTES, MSA_NOT_APPLICABLE_CATEGORIES, MSA_DEFAULT_GUIDANCE_EN, MSA_DEFAULT_GUIDANCE_AR)),
  };
}

/** Renders the skeleton as plain text (EN or AR), reusing the platform's
 *  existing downloadText() mechanism already used elsewhere in CLMTools. */
export function renderSkeletonAsText(skeleton: GeneratedSkeleton, isAr: boolean): string {
  const lines: string[] = [];
  const t = (en: string, ar: string) => isAr ? ar : en;

  lines.push(`${isAr ? skeleton.contractTypeLabelAr : skeleton.contractTypeLabelEn} -- ${t('STRUCTURAL SKELETON (Module 09 v1)', 'هيكل بنيوي (الوحدة 09، الإصدار 1)')}`);
  lines.push(isAr ? skeleton.disclaimerAr : skeleton.disclaimerEn);
  lines.push('');
  lines.push(t('== INTRODUCTION / COVER ==', '== المقدمة / الغلاف =='));
  lines.push(`${t('Parties', 'الأطراف')}: ${isAr ? skeleton.cover.partiesAr : skeleton.cover.partiesEn}`);
  lines.push(`${t('Effective Date', 'تاريخ السريان')}: ${isAr ? skeleton.cover.effectiveDateAr : skeleton.cover.effectiveDateEn}`);
  lines.push(`${t('Term/Duration', 'المدة')}: ${isAr ? skeleton.cover.termDurationAr : skeleton.cover.termDurationEn}`);
  lines.push(`${t('Governing Law', 'القانون الحاكم')}: ${isAr ? skeleton.cover.governingLawAr : skeleton.cover.governingLawEn}`);
  lines.push(`${t('Dispute Forum', 'جهة تسوية المنازعات')}: ${isAr ? skeleton.cover.disputeForumAr : skeleton.cover.disputeForumEn}`);
  lines.push(`${t('Purpose', 'الغرض')}: ${isAr ? skeleton.cover.purposeAr : skeleton.cover.purposeEn}`);
  lines.push(`${t('Scope Summary', 'ملخص النطاق')}: ${isAr ? skeleton.cover.scopeSummaryAr : skeleton.cover.scopeSummaryEn}`);
  lines.push('');
  lines.push(t('Suggested Reviewers / Consensus Parties:', 'مقترح: المراجعون/أطراف التوافق:'));
  for (const role of skeleton.cover.involvementMap) {
    lines.push(`  - ${isAr ? role.labelAr : role.labelEn} ${role.mandatory ? t('(mandatory)', '(إلزامي)') : t('(suggested)', '(مقترح)')} -- ${isAr ? role.reasonAr : role.reasonEn}`);
  }
  lines.push('');

  for (const section of skeleton.body) {
    lines.push(`== ${isAr ? section.labelAr : section.labelEn} ==`);
    if (!section.applicable) {
      lines.push(isAr ? section.notApplicableNoteAr! : section.notApplicableNoteEn!);
      lines.push('');
      continue;
    }
    for (const sc of section.subclauses) {
      lines.push(`  [${sc.mandatory ? t('MANDATORY', 'إلزامي') : t('optional', 'اختياري')}] ${isAr ? sc.labelAr : sc.labelEn}`);
      lines.push(`    ${t('Guidance', 'إرشاد')}: ${isAr ? sc.guidanceAr : sc.guidanceEn}`);
      lines.push(`    ${isAr ? sc.placeholderAr : sc.placeholderEn}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
