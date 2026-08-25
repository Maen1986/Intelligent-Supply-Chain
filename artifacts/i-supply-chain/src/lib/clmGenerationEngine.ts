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

function buildBodySection(category: ClauseCategory): BodyCategorySection {
  const meta = CLAUSE_CATEGORIES.find(c => c.id === category)!;
  const notApplicable = NDA_NOT_APPLICABLE_CATEGORIES[category];

  if (notApplicable) {
    return {
      category, labelEn: meta.label, labelAr: meta.labelAr,
      applicable: false,
      notApplicableNoteEn: notApplicable.en, notApplicableNoteAr: notApplicable.ar,
      subclauses: [],
    };
  }

  const subclauses: BodySubclauseOutline[] = SUBCLAUSES_BY_CATEGORY[category].map(sc => {
    const note = NDA_SUBCLAUSE_NOTES[sc.id];
    return {
      id: sc.id, labelEn: sc.label, labelAr: sc.labelAr,
      mandatory: note?.mandatory ?? false,
      guidanceEn: note?.guidanceEn ?? 'Optional for a standard NDA -- include if relevant to this specific relationship.',
      guidanceAr: note?.guidanceAr ?? 'اختياري لاتفاقية سرية معيارية -- أدرجوه إذا كان ذا صلة بهذه العلاقة تحديداً.',
      placeholderEn: '[Clause text goes here -- Module 09 v1 is a structural skeleton only; have qualified legal counsel draft or review the actual wording. This is not legal advice.]',
      placeholderAr: '[نص البند يوضع هنا -- الإصدار الأول من الوحدة 09 هيكل بنيوي فقط؛ اطلبوا من مستشار قانوني مؤهل صياغة النص الفعلي أو مراجعته. هذا ليس استشارة قانونية.]',
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
}

export interface GeneratedSkeleton {
  disclaimerEn: string; disclaimerAr: string;
  cover: CoverSection;
  body: BodyCategorySection[];
}

const DISCLAIMER_EN = 'This is a structural skeleton -- introduction facts and a classified clause outline -- not a finished legal document. No clause language has been drafted. This is not legal advice; have qualified legal counsel draft or review the actual contract text before use.';
const DISCLAIMER_AR = 'هذا هيكل بنيوي فقط -- وقائع تمهيدية ومخطط بنود مصنّف -- وليس وثيقة قانونية نهائية. لم تُصاغ أي نصوص بنود. هذا ليس استشارة قانونية؛ اطلبوا من مستشار قانوني مؤهل صياغة نص العقد الفعلي أو مراجعته قبل الاستخدام.';

/**
 * Builds the NDA pilot skeleton (Module 09 Part A, Option 1). Pure
 * function over already-tested Module 01/02/05 checks -- no AI call, no
 * new legal-content risk, honestly scoped as a skeleton per Decision
 * Record 8.7. Contract-type-specific (NDA); extending Option 1 to other
 * ContractType values is future work, not folded into this pilot.
 */
export function buildNdaSkeleton(input: GenerationInput): GeneratedSkeleton {
  return {
    disclaimerEn: DISCLAIMER_EN,
    disclaimerAr: DISCLAIMER_AR,
    cover: buildCoverSection(input),
    body: CLAUSE_CATEGORIES.map(c => buildBodySection(c.id)),
  };
}

/** Renders the skeleton as plain text (EN or AR), reusing the platform's
 *  existing downloadText() mechanism already used elsewhere in CLMTools. */
export function renderSkeletonAsText(skeleton: GeneratedSkeleton, isAr: boolean): string {
  const lines: string[] = [];
  const t = (en: string, ar: string) => isAr ? ar : en;

  lines.push(t('NDA -- STRUCTURAL SKELETON (Module 09 v1)', 'اتفاقية عدم إفصاح -- هيكل بنيوي (الوحدة 09، الإصدار 1)'));
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
