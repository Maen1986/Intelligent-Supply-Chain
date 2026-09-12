/**
 * SI Supplier Lifecycle Governance -- Item 4 of 7: Onboarding (12 Sep 2026).
 *
 * WHAT THIS MODULE IS: the checklist-generation and completion-tracking
 * engine that runs ONLY for a supplier already on the Approved Supplier
 * List (Item 3's real, derived ASL state -- never a standalone form a
 * supplier can start regardless of qualification). Onboarding turns an ASL
 * approval into a documented, four-domain readiness record: legal/
 * compliance, banking/financial, operational readiness, and risk/
 * compliance screening.
 *
 * SOURCED METHODOLOGY (Rule 2/10, freshly fetched 12 Sep 2026, not
 * recalled): the four-domain structure and the specific step list below
 * follow apexanalytix's 12-step supplier onboarding checklist
 * (apexanalytix.com/resources/blog/supplier-onboarding-checklist --
 * compliance & risk screening, banking & financial controls, operational
 * readiness, lifecycle management) and CIPS's "Navigating risk in
 * third-party onboarding" (cips-download.cips.org, with Dun & Bradstreet --
 * regulatory compliance, ownership/political-affiliation scrutiny, sanctions
 * watchlist checks) and Ivalua's own published 5-step onboarding process
 * (ivalua.com/blog/supplier-onboarding-process -- risk assessment,
 * compliance/documentation, evaluation/approval, contract finalization,
 * system integration). None of this is invented from first principles.
 *
 * BANKING-DETAIL VERIFICATION -- A DELIBERATE, SOURCED CONTROL POINT, NOT AN
 * AFTERTHOUGHT: apexanalytix's own checklist calls banking data "the most
 * sensitive data in the supplier record and the most frequently targeted by
 * fraudsters," and warns that "payment-diversion schemes originate during
 * onboarding" when verification is weak. The FBI's IC3 recorded $55.5B in
 * cumulative reported BEC losses 2013-2023 and $3.04B in 2025 alone (cited
 * via adaptivesecurity.com's BEC-types writeup, itself citing IC3 filings).
 * The concrete, actionable control this module encodes -- because it is the
 * one actually achievable without a live banking-API integration ISC does
 * not ship (see Competitive Moat below) -- is independently-sourced callback
 * verification: confirm any bank-detail submission or change using a phone
 * number already on file, never one supplied in the same message, and hold
 * the first payment after any change for manual review before it clears.
 * This is the same control adaptivesecurity.com's sourced guidance
 * recommends and Trustpair-style bank-account-ownership verification tools
 * (bolted onto Coupa/Ivalua as a PARTNER integration, not native to either
 * platform -- see this module's worked-example doc, section on Competitive
 * Moat, for the full disclosed comparison) exist to automate. ISC does not
 * claim to automate the verification call itself (Rule 1: never fabricate a
 * capability that is not real) -- it requires the step, requires the
 * independently-sourced contact channel to be named, and requires the
 * first-payment hold to be explicitly acknowledged before the step can be
 * marked complete.
 *
 * STANDALONE-FIRST (Rule 3, same discipline as every prior engine in this
 * build): this module has NO runtime import from supplierPreQualification.ts
 * (Item 3) or supplierRACI.ts (Item 2), even though onboarding is gated by
 * both. The caller supplies the ASL gate state as plain data
 * (ASLGateSnapshotLike, a disclosed mirror of supplierPreQualification.ts's
 * ASLCurrentState shape) and, separately, the server-side route enforces the
 * real RACI 'onboarding_signoff' Accountable-holder check (that activity key
 * already existed in supplierRACI.ts's fixed RACI_ACTIVITY_KEYS list before
 * this item began -- Item 2 anticipated it).
 *
 * TWO-TIER STANDARD (same split as every prior item): Advisory (default,
 * zero persistence) runs generateOnboardingChecklist() fresh in the browser
 * -- a checklist the client executes in their own systems, with sourced
 * guidance on why each step matters, and no client name attached to any
 * stored row. Operational (opt-in) additionally persists step-completion
 * EVENTS via the append-only onboarding_step_events table
 * (lib/db/src/schema/onboardingEvents.ts) and derives current completion
 * state by replay (computeCurrentOnboardingState()), exactly the event-log-
 * plus-replay split raciAssignments.ts and aslRegister.ts already use. Both
 * tiers share this file's identical checklist and validation logic; they
 * differ only in what gets written down.
 *
 * NEVER FABRICATE (Rule 1): generateOnboardingChecklist() refuses to
 * produce a checklist at all -- returning an explicit gated=false result --
 * when the caller-supplied ASL gate state does not show the supplier
 * currently on the ASL. Reused fields from Module 03 (contact identity) are
 * only ever offered as a PREFILL a human must still confirm
 * (confirmedFromModule03: false until an explicit completion event says
 * otherwise) -- never auto-completed on the strength of old discovery data.
 *
 * PRIMARY RECOMMENDATION + STRONG ALTERNATIVE (Rule 8): the banking-
 * verification step below states both explicitly -- see
 * BANKING_VERIFICATION_GUIDANCE.
 *
 * COMPETITIVE MOAT (Rule 10, benchmarked against SAP Ariba, Coupa, JAGGAER,
 * GEP SMART and Ivalua -- full comparison in the worked-example doc): the
 * real differentiator here is that onboarding cannot even be STARTED for a
 * supplier the platform's own ASL derivation has not actually approved --
 * none of the five named platforms' public material describes onboarding as
 * hard-gated by an adversarially-stress-tested approval derivation the way
 * Items 3+4 are wired together here. The honest gap: Coupa's own
 * documented integration with Trustpair proves real-time bank-account-
 * ownership verification is achievable in this market, and ISC does not
 * ship that -- it ships the disclosed, sourced manual control (callback
 * verification + first-payment hold) instead, named as a real limitation,
 * not hidden.
 */

// ---------------------------------------------------------------------------
// Section 0 -- caller-supplied gate inputs (standalone-first mirrors)
// ---------------------------------------------------------------------------

/** Disclosed mirror of supplierPreQualification.ts's ASLCurrentState -- only
 *  the fields this module actually needs, so onboarding never re-derives
 *  ASL status itself (that stays Item 3's job). */
export interface ASLGateSnapshotLike {
  supplierId: string;
  onASL: boolean;
  status: string;
}

export interface OnboardingGateResult {
  allowed: boolean;
  reasonEn: string;
  reasonAr: string;
}

export function canStartOnboarding(gate: ASLGateSnapshotLike | null): OnboardingGateResult {
  if (!gate) {
    return {
      allowed: false,
      reasonEn: 'No ASL state supplied -- onboarding cannot start without confirming this supplier is currently on the Approved Supplier List.',
      reasonAr: 'لم يتم توفير حالة القائمة المعتمدة -- لا يمكن بدء التهيئة دون تأكيد أن المورد مدرج حاليًا في القائمة المعتمدة.',
    };
  }
  if (!gate.onASL) {
    return {
      allowed: false,
      reasonEn: `This supplier's current ASL status is '${gate.status}', not an approved state -- onboarding is gated on Item 3's own derived ASL approval and cannot be started manually.`,
      reasonAr: `حالة هذا المورد الحالية في القائمة المعتمدة هي '${gate.status}'، وهي ليست حالة معتمدة -- تعتمد بوابة التهيئة على قرار الاعتماد المُشتق من البند 3 ولا يمكن بدؤها يدويًا.`,
    };
  }
  return { allowed: true, reasonEn: 'Supplier is currently on the ASL -- onboarding may start.', reasonAr: 'المورد مدرج حاليًا في القائمة المعتمدة -- يمكن بدء التهيئة.' };
}

// ---------------------------------------------------------------------------
// Section 1 -- the checklist catalog (four sourced domains)
// ---------------------------------------------------------------------------

export type OnboardingStepCategory = 'legal_compliance' | 'banking_financial' | 'operational_readiness' | 'risk_screening';

export type OnboardingStepKey =
  | 'contract_executed'
  | 'nda_signed'
  | 'insurance_certificate_collected'
  | 'code_of_conduct_signed'
  | 'payment_terms_agreed'
  | 'banking_details_submitted'
  | 'banking_details_verified'
  | 'tax_registration_captured'
  | 'system_access_provisioned'
  | 'ordering_edi_setup'
  | 'escalation_contacts_confirmed'
  | 'sanctions_screening_cleared'
  | 'conflict_of_interest_declared'
  | 'esg_questionnaire_completed';

export interface OnboardingStepDefinition {
  key: OnboardingStepKey;
  category: OnboardingStepCategory;
  labelEn: string;
  labelAr: string;
  whyItMattersEn: string;
  whyItMattersAr: string;
  required: boolean;
  /** True only for banking_details_verified -- the sourced fraud-prevention
   *  control point (see file header). Enforced in validateStepCompletion(). */
  requiresIndependentVerification?: boolean;
  /** This step can only be completed after the listed step(s) -- an ordered
   *  dependency, not just a category grouping (e.g. you cannot verify
   *  banking details that were never submitted). */
  dependsOn?: OnboardingStepKey[];
  sourceEn: string;
  sourceAr: string;
}

const APEX_SOURCE_EN = 'apexanalytix, "12-Step Supplier Onboarding Checklist to Reduce Risk" (2026)';
const APEX_SOURCE_AR = 'apexanalytix، "قائمة تحقق من 12 خطوة لتهيئة الموردين للحد من المخاطر" (2026)';
const CIPS_SOURCE_EN = 'CIPS, "Navigating risk in third-party onboarding" (with Dun & Bradstreet)';
const CIPS_SOURCE_AR = 'CIPS، "التعامل مع المخاطر في تهيئة الأطراف الثالثة" (بالشراكة مع Dun & Bradstreet)';
const IVALUA_SOURCE_EN = 'Ivalua, "Supplier Onboarding 101: Essential Tips for a Smooth Process"';
const IVALUA_SOURCE_AR = 'Ivalua، "أساسيات تهيئة الموردين: نصائح جوهرية لعملية سلسة"';
const BEC_SOURCE_EN = 'FBI IC3 BEC loss data (2013-2023: $55.5B; 2025: $3.04B), via adaptivesecurity.com sourced BEC-controls guidance';
const BEC_SOURCE_AR = 'بيانات خسائر اختراق البريد الإلكتروني للأعمال (BEC) الصادرة عن مركز شكاوى جرائم الإنترنت التابع لمكتب التحقيقات الفيدرالي (2013-2023: 55.5 مليار دولار؛ 2025: 3.04 مليار دولار)، عبر إرشادات adaptivesecurity.com الموثقة';

export const ONBOARDING_STEP_CATALOG: OnboardingStepDefinition[] = [
  { key: 'contract_executed', category: 'legal_compliance', labelEn: 'Contract / purchase agreement executed', labelAr: 'توقيع العقد / اتفاقية الشراء', whyItMattersEn: 'A signed agreement is the legal basis for the relationship; onboarding without one leaves both sides unprotected.', whyItMattersAr: 'يمثل الاتفاق الموقّع الأساس القانوني للعلاقة؛ التهيئة دونه تترك الطرفين دون حماية.', required: true, sourceEn: IVALUA_SOURCE_EN, sourceAr: IVALUA_SOURCE_AR },
  { key: 'nda_signed', category: 'legal_compliance', labelEn: 'NDA signed', labelAr: 'توقيع اتفاقية عدم الإفصاح', whyItMattersEn: 'Protects both parties’ confidential information before any data or specifications are shared.', whyItMattersAr: 'تحمي المعلومات السرية لكلا الطرفين قبل تبادل أي بيانات أو مواصفات.', required: true, sourceEn: APEX_SOURCE_EN, sourceAr: APEX_SOURCE_AR },
  { key: 'insurance_certificate_collected', category: 'legal_compliance', labelEn: 'Insurance certificate collected', labelAr: 'استلام شهادة التأمين', whyItMattersEn: 'Confirms the supplier carries adequate liability coverage before work begins.', whyItMattersAr: 'تؤكد أن المورد يحمل تغطية تأمينية كافية قبل بدء العمل.', required: true, sourceEn: APEX_SOURCE_EN, sourceAr: APEX_SOURCE_AR },
  { key: 'code_of_conduct_signed', category: 'legal_compliance', labelEn: 'Code-of-conduct sign-off', labelAr: 'اعتماد ميثاق السلوك', whyItMattersEn: 'Documents the supplier’s agreement to ethical, labor and environmental standards.', whyItMattersAr: 'يوثّق موافقة المورد على المعايير الأخلاقية ومعايير العمل والبيئة.', required: true, sourceEn: CIPS_SOURCE_EN, sourceAr: CIPS_SOURCE_AR },
  { key: 'payment_terms_agreed', category: 'banking_financial', labelEn: 'Payment terms agreed', labelAr: 'الاتفاق على شروط الدفع', whyItMattersEn: 'Sets clear expectations on payment timing before the first invoice is ever issued.', whyItMattersAr: 'يضع توقعات واضحة بشأن توقيت الدفع قبل صدور أول فاتورة.', required: true, sourceEn: APEX_SOURCE_EN, sourceAr: APEX_SOURCE_AR },
  { key: 'banking_details_submitted', category: 'banking_financial', labelEn: 'Banking details submitted (secure channel)', labelAr: 'تقديم البيانات المصرفية (عبر قناة آمنة)', whyItMattersEn: 'Must be collected through an authenticated portal, not email, per apexanalytix’s onboarding-fraud guidance.', whyItMattersAr: 'يجب جمعها عبر بوابة موثّقة وليس عبر البريد الإلكتروني، وفق إرشادات apexanalytix بشأن الاحتيال في مرحلة التهيئة.', required: true, sourceEn: APEX_SOURCE_EN, sourceAr: APEX_SOURCE_AR },
  { key: 'banking_details_verified', category: 'banking_financial', labelEn: 'Banking details independently verified (callback + first-payment hold)', labelAr: 'التحقق المستقل من البيانات المصرفية (اتصال هاتفي مستقل + تعليق أول دفعة)', whyItMattersEn: 'The single most fraud-targeted step in onboarding (BEC losses: $55.5B 2013-2023, $3.04B in 2025 alone). Verify using a phone number already on file -- never one supplied with the submission -- and hold the first payment after this step for manual review.', whyItMattersAr: 'الخطوة الأكثر استهدافًا للاحتيال في التهيئة (خسائر اختراق البريد الإلكتروني للأعمال: 55.5 مليار دولار 2013-2023، و3.04 مليار دولار في 2025 وحدها). يجب التحقق عبر رقم هاتف مسجّل مسبقًا -- وليس رقمًا مُرسلًا مع الطلب -- وتعليق أول دفعة بعد هذه الخطوة للمراجعة اليدوية.', required: true, requiresIndependentVerification: true, dependsOn: ['banking_details_submitted'], sourceEn: BEC_SOURCE_EN, sourceAr: BEC_SOURCE_AR },
  { key: 'tax_registration_captured', category: 'banking_financial', labelEn: 'Tax registration / VAT ID captured', labelAr: 'تسجيل الرقم الضريبي / ضريبة القيمة المضافة', whyItMattersEn: 'Required for correct invoicing and statutory withholding.', whyItMattersAr: 'مطلوب لإصدار الفواتير الصحيحة والاستقطاع النظامي.', required: true, sourceEn: APEX_SOURCE_EN, sourceAr: APEX_SOURCE_AR },
  { key: 'system_access_provisioned', category: 'operational_readiness', labelEn: 'System access / supplier portal provisioned', labelAr: 'تفعيل الوصول للنظام / بوابة المورد', whyItMattersEn: 'The supplier needs a working channel to receive orders and submit invoices from day one.', whyItMattersAr: 'يحتاج المورد إلى قناة فعّالة لاستلام الطلبات وتقديم الفواتير منذ اليوم الأول.', required: true, sourceEn: IVALUA_SOURCE_EN, sourceAr: IVALUA_SOURCE_AR },
  { key: 'ordering_edi_setup', category: 'operational_readiness', labelEn: 'Ordering / EDI integration configured', labelAr: 'إعداد الطلبات / تكامل التبادل الإلكتروني للبيانات', whyItMattersEn: 'Confirms purchase orders will actually reach the supplier’s own systems correctly.', whyItMattersAr: 'يؤكد وصول أوامر الشراء فعليًا إلى أنظمة المورد بشكل صحيح.', required: false, sourceEn: APEX_SOURCE_EN, sourceAr: APEX_SOURCE_AR },
  { key: 'escalation_contacts_confirmed', category: 'operational_readiness', labelEn: 'Operational + escalation contacts confirmed', labelAr: 'تأكيد جهات الاتصال التشغيلية وجهات التصعيد', whyItMattersEn: 'A named point of contact for day-to-day issues and a separate escalation path for disputes -- reuse Module 03’s discovery contact where available, but confirm it, never assume it is still current.', whyItMattersAr: 'جهة اتصال محددة للمسائل اليومية ومسار تصعيد منفصل للنزاعات -- يُعاد استخدام جهة الاتصال المكتشفة في الوحدة 03 عند توفرها، لكن يجب تأكيدها وعدم افتراض أنها لا تزال حديثة.', required: true, sourceEn: IVALUA_SOURCE_EN, sourceAr: IVALUA_SOURCE_AR },
  { key: 'sanctions_screening_cleared', category: 'risk_screening', labelEn: 'Sanctions / watchlist screening cleared', labelAr: 'اجتياز فحص العقوبات / القوائم الرقابية', whyItMattersEn: 'Confirms no sanctions exposure before any commercial commitment is finalized.', whyItMattersAr: 'يؤكد عدم وجود تعرض لعقوبات قبل إنهاء أي التزام تجاري.', required: true, sourceEn: CIPS_SOURCE_EN, sourceAr: CIPS_SOURCE_AR },
  { key: 'conflict_of_interest_declared', category: 'risk_screening', labelEn: 'Conflict-of-interest declaration collected', labelAr: 'جمع إقرار تضارب المصالح', whyItMattersEn: 'Surfaces ownership or personal/political affiliations that could create undisclosed risk.', whyItMattersAr: 'يكشف الملكية أو الانتماءات الشخصية/السياسية التي قد تشكل مخاطر غير مُفصح عنها.', required: true, sourceEn: CIPS_SOURCE_EN, sourceAr: CIPS_SOURCE_AR },
  { key: 'esg_questionnaire_completed', category: 'risk_screening', labelEn: 'ESG questionnaire completed', labelAr: 'إتمام استبيان الاستدامة والحوكمة البيئية والاجتماعية', whyItMattersEn: 'Only applicable where the client organization has an active ESG program -- caller-flagged, never assumed.', whyItMattersAr: 'ينطبق فقط عندما يكون لدى المؤسسة العميلة برنامج فعّال للاستدامة -- يُحدَّد من قبل المستدعي وليس افتراضًا.', required: false, sourceEn: CIPS_SOURCE_EN, sourceAr: CIPS_SOURCE_AR },
];

/** Primary recommendation + strong alternative (Rule 8) for the single
 *  highest-risk step. Named explicitly rather than folded into one label so
 *  a reader sees the trade-off, not false single-path certainty. */
export const BANKING_VERIFICATION_GUIDANCE = {
  primaryEn: 'Strong alternative in reach today: independently-sourced callback verification (call a number already on file, never one supplied with the change) plus a mandatory hold on the first payment after any banking-detail change for manual review.',
  primaryAr: 'البديل القوي المتاح اليوم: التحقق الهاتفي المستقل (الاتصال برقم مسجّل مسبقًا وليس رقمًا مُرسلًا مع طلب التغيير) إلى جانب تعليق إلزامي لأول دفعة بعد أي تغيير في البيانات المصرفية لمراجعتها يدويًا.',
  alternativeEn: 'Best-in-class (not yet built here): real-time automated bank-account-ownership verification via a dedicated fraud-prevention API/partner -- the approach Coupa and Ivalua both reach via a Trustpair-style third-party integration rather than a native feature. ISC does not fabricate having this; it is named as a real, open gap.',
  alternativeAr: 'أفضل ممارسة عالمية (لم تُبنَ هنا بعد): التحقق الآلي الفوري من ملكية الحساب المصرفي عبر واجهة برمجية/شريك متخصص في منع الاحتيال -- وهو النهج الذي تعتمد عليه كل من Coupa وIvalua عبر تكامل خارجي على غرار Trustpair وليس كميزة أصلية. لا تدّعي المنصة امتلاك هذه القدرة؛ بل تُذكر كفجوة حقيقية ومُعلنة.',
};

export function applicableSteps(esgApplicable: boolean): OnboardingStepDefinition[] {
  return ONBOARDING_STEP_CATALOG.filter((s) => s.key !== 'esg_questionnaire_completed' || esgApplicable);
}

// ---------------------------------------------------------------------------
// Section 2 -- Module 03 contact reuse (never re-collect what's known, but
// never silently trust it either)
// ---------------------------------------------------------------------------

/** Disclosed, plain-data mirror of a slice of Module 03's SupplierRecord
 *  facts -- only what this module actually reuses. Optional: onboarding
 *  works fine with none of this supplied, it just then has nothing to
 *  prefill and the step still requires an explicit confirmation event. */
export interface Module03ContactHint {
  contactNameKnown?: string;
  contactEmailKnown?: string;
  contactPhoneKnown?: string;
  /** e.g. 'VALIDATED' | 'OBSERVED' from Module 03's EvidenceStage -- passed
   *  through as-is so the UI can show how much to trust the prefill. */
  evidenceStageKnown?: string;
}

// ---------------------------------------------------------------------------
// Section 3 -- Advisory tier: checklist generation
// ---------------------------------------------------------------------------

/**
 * ADVISORY-TIER GUIDANCE, NOT ENFORCEMENT: the checklist names who SHOULD
 * hold the RACI Accountable / Responsible roles for onboarding sign-off,
 * using the same archetype data supplierRACI.ts's RACI_TEMPLATE already
 * defines for the 'onboarding_signoff' activity key (Accountable: Supplier
 * Relationship Manager; Responsible: Supplier Onboarding Coordinator) --
 * disclosed as a manually-synced mirror, standalone-first (no runtime
 * import from supplierRACI.ts), same discipline as every other
 * cross-module fact in this file. This is guidance only on the Advisory
 * tier: a client using the checklist standalone is never blocked by it.
 * Only the Operational tier's route layer turns this into a real,
 * enforced write-gate (Item 2's actual raci_assignment_events data,
 * queried server-side) -- consistent with ISC's role as a governance and
 * consultancy platform first, an operational system of record only when a
 * client opts into that heavier tier.
 */
export const ONBOARDING_SIGNOFF_RACI_GUIDANCE = {
  accountableArchetypeEn: 'Supplier Relationship Manager',
  accountableArchetypeAr: 'مدير علاقات الموردين',
  responsibleArchetypeEn: 'Supplier Onboarding Coordinator',
  responsibleArchetypeAr: 'منسّق تهيئة الموردين',
  noteEn: 'Recommended assignment per Item 2 (RACI)\'s sourced role-archetype template. On the Advisory tier this is guidance the client applies in their own sign-off process; only the Operational tier enforces it as a real, server-side write-gate against the client\'s actual RACI assignment.',
  noteAr: 'التعيين الموصى به وفق نموذج الأدوار المرجعي في البند 2 (RACI). في المستوى الاستشاري، هذا إرشاد يطبّقه العميل ضمن عملية الاعتماد الخاصة به؛ ويُفعَّل كبوابة تحكم فعلية من جانب الخادم فقط في المستوى التشغيلي، استنادًا إلى تعيين RACI الحقيقي للعميل.',
};

export interface OnboardingChecklistStep extends OnboardingStepDefinition {
  prefillHintEn: string | null;
  prefillHintAr: string | null;
}

export interface OnboardingChecklistResult {
  gated: boolean;
  gateReasonEn: string;
  gateReasonAr: string;
  supplierId: string | null;
  steps: OnboardingChecklistStep[];
  requiredStepCount: number;
  /** Advisory-tier RACI guidance (Rule 8 style: named, not enforced) -- null on a gated=false result, since there is no checklist to assign a sign-off role for yet. */
  signoffGuidance: typeof ONBOARDING_SIGNOFF_RACI_GUIDANCE | null;
}

export function generateOnboardingChecklist(input: {
  supplierId: string;
  aslGate: ASLGateSnapshotLike | null;
  esgApplicable?: boolean;
  contactHint?: Module03ContactHint;
}): OnboardingChecklistResult {
  const gate = canStartOnboarding(input.aslGate);
  if (!gate.allowed) {
    return { gated: false, gateReasonEn: gate.reasonEn, gateReasonAr: gate.reasonAr, supplierId: null, steps: [], requiredStepCount: 0, signoffGuidance: null };
  }
  const steps = applicableSteps(input.esgApplicable ?? false).map((def): OnboardingChecklistStep => {
    if (def.key === 'escalation_contacts_confirmed' && input.contactHint) {
      const parts: string[] = [];
      if (input.contactHint.contactNameKnown) parts.push(input.contactHint.contactNameKnown);
      if (input.contactHint.contactEmailKnown) parts.push(input.contactHint.contactEmailKnown);
      if (input.contactHint.contactPhoneKnown) parts.push(input.contactHint.contactPhoneKnown);
      if (parts.length > 0) {
        const stageNote = input.contactHint.evidenceStageKnown ? ` (Module 03 evidence stage: ${input.contactHint.evidenceStageKnown} -- confirm before relying on it)` : '';
        const stageNoteAr = input.contactHint.evidenceStageKnown ? ` (مرحلة الأدلة في الوحدة 03: ${input.contactHint.evidenceStageKnown} -- يجب التأكيد قبل الاعتماد عليها)` : '';
        return { ...def, prefillHintEn: `From Module 03 discovery: ${parts.join(', ')}${stageNote}`, prefillHintAr: `من اكتشاف الوحدة 03: ${parts.join('، ')}${stageNoteAr}` };
      }
    }
    return { ...def, prefillHintEn: null, prefillHintAr: null };
  });
  return {
    gated: true,
    gateReasonEn: gate.reasonEn,
    gateReasonAr: gate.reasonAr,
    supplierId: input.supplierId,
    steps,
    requiredStepCount: steps.filter((s) => s.required).length,
    signoffGuidance: ONBOARDING_SIGNOFF_RACI_GUIDANCE,
  };
}

// ---------------------------------------------------------------------------
// Section 4 -- Operational tier: event replay + validation
// ---------------------------------------------------------------------------

export type OnboardingEventAction = 'completed' | 'reopened';

export interface OnboardingStepEventLike {
  id: number | string;
  supplierId: string;
  stepKey: string;
  action: OnboardingEventAction;
  actorUserId: number;
  note: string | null;
  /** Required only for banking_details_verified completions -- see
   *  validateStepCompletion(). Plain string, never validated as a real
   *  phone number here (that would be fabricating a capability); its
   *  presence is what's enforced. */
  verificationChannelNote: string | null;
  firstPaymentHoldAcknowledged: boolean | null;
  createdAt: string;
}

function sortChrono(events: OnboardingStepEventLike[]): OnboardingStepEventLike[] {
  return [...events].sort((a, b) => {
    const t = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (t !== 0) return t;
    return String(a.id).localeCompare(String(b.id));
  });
}

export interface OnboardingCurrentState {
  supplierId: string;
  completedStepKeys: string[];
  isComplete: boolean;
  requiredStepCount: number;
  completedRequiredCount: number;
  lastActivityAt: string | null;
  events: OnboardingStepEventLike[];
}

/** Replays one supplier's onboarding events against its checklist to derive
 *  current completion state -- mirrors computeCurrentASLState()'s and
 *  computeCurrentRaci()'s "replay, never a separately-maintained status
 *  column" discipline. A 'reopened' event removes a step from the completed
 *  set (supports the brief's "re-entering onboarding after a prior failed
 *  attempt" soft-tier scenario) without deleting the historical record --
 *  both events remain in `events`. */
export function computeCurrentOnboardingState(
  supplierId: string,
  events: OnboardingStepEventLike[],
  checklist: OnboardingChecklistResult,
): OnboardingCurrentState {
  const own = sortChrono(events.filter((e) => e.supplierId === supplierId));
  const validKeys = new Set<string>(checklist.steps.map((s) => s.key));
  const completed = new Set<string>();
  let lastActivityAt: string | null = null;

  for (const ev of own) {
    if (!validKeys.has(ev.stepKey)) continue; // HARDEST: event for a step not in the checklist definition -- ignored, never crashes derivation
    if (ev.action === 'completed') completed.add(ev.stepKey);
    else if (ev.action === 'reopened') completed.delete(ev.stepKey);
    lastActivityAt = ev.createdAt;
  }

  const requiredKeys = checklist.steps.filter((s) => s.required).map((s) => s.key);
  const completedRequiredCount = requiredKeys.filter((k) => completed.has(k)).length;

  return {
    supplierId,
    completedStepKeys: Array.from(completed),
    isComplete: requiredKeys.length > 0 && completedRequiredCount === requiredKeys.length,
    requiredStepCount: requiredKeys.length,
    completedRequiredCount,
    lastActivityAt,
    events: own,
  };
}

export function computeAllCurrentOnboardingStates(
  events: OnboardingStepEventLike[],
  checklistsBySupplier: Map<string, OnboardingChecklistResult>,
): OnboardingCurrentState[] {
  const ids = Array.from(new Set(events.map((e) => e.supplierId)));
  return ids
    .map((id) => {
      const checklist = checklistsBySupplier.get(id);
      return checklist ? computeCurrentOnboardingState(id, events, checklist) : null;
    })
    .filter((s): s is OnboardingCurrentState => s !== null);
}

export interface StepCompletionValidation {
  valid: boolean;
  errorsEn: string[];
  errorsAr: string[];
}

/** Validates a single completion event BEFORE it is appended -- mirrors
 *  validateASLDecision()'s "refuse before insert" discipline. Enforced
 *  again, independently, at the API route (never trust a client check
 *  alone). */
export function validateStepCompletion(
  stepKey: string,
  checklist: OnboardingChecklistResult,
  currentState: OnboardingCurrentState,
  opts: { verificationChannelNote?: string | null; firstPaymentHoldAcknowledged?: boolean | null } = {},
): StepCompletionValidation {
  const errorsEn: string[] = [];
  const errorsAr: string[] = [];

  if (!checklist.gated) {
    errorsEn.push('This supplier is not currently gated into onboarding (ASL approval not confirmed).');
    errorsAr.push('هذا المورد غير مُفعَّل حاليًا لبدء التهيئة (لم يتم تأكيد اعتماد القائمة المعتمدة).');
  }

  const def = checklist.steps.find((s) => s.key === stepKey);
  if (!def) {
    errorsEn.push(`'${stepKey}' is not a step in this supplier's checklist -- cannot record a completion for a step that does not exist.`);
    errorsAr.push(`'${stepKey}' ليست خطوة ضمن قائمة تحقق هذا المورد -- لا يمكن تسجيل إتمام لخطوة غير موجودة.`);
    return { valid: false, errorsEn, errorsAr };
  }

  if (currentState.completedStepKeys.includes(stepKey)) {
    errorsEn.push(`'${def.labelEn}' is already marked complete -- reopen it first if it needs to be redone (duplicate completion events are refused, not silently merged).`);
    errorsAr.push(`'${def.labelAr}' مُعلَّمة بالفعل كمكتملة -- يجب إعادة فتحها أولًا إذا احتاجت إلى إعادة الإجراء (تُرفض أحداث الإتمام المكررة ولا يتم دمجها بصمت).`);
  }

  if (def.dependsOn) {
    const missing = def.dependsOn.filter((dep) => !currentState.completedStepKeys.includes(dep));
    if (missing.length > 0) {
      const missingLabels = missing.map((k) => checklist.steps.find((s) => s.key === k)?.labelEn ?? k).join(', ');
      errorsEn.push(`'${def.labelEn}' requires these steps to be completed first: ${missingLabels}.`);
      errorsAr.push(`تتطلب '${def.labelAr}' إتمام الخطوات التالية أولًا: ${missingLabels}.`);
    }
  }

  if (def.requiresIndependentVerification) {
    if (!opts.verificationChannelNote || opts.verificationChannelNote.trim().length === 0) {
      errorsEn.push('Independently-sourced verification channel (e.g. a phone number already on file) must be recorded before this step can be marked complete.');
      errorsAr.push('يجب تسجيل قناة تحقق مستقلة (مثل رقم هاتف مسجّل مسبقًا) قبل إمكانية تعليم هذه الخطوة كمكتملة.');
    }
    if (opts.firstPaymentHoldAcknowledged !== true) {
      errorsEn.push('First-payment-hold acknowledgement is required for a banking-detail verification (sourced fraud-prevention control -- see file header).');
      errorsAr.push('يتطلب التحقق من البيانات المصرفية الإقرار بتعليق أول دفعة (إجراء موثق للوقاية من الاحتيال -- انظر رأس الملف).');
    }
  }

  return { valid: errorsEn.length === 0, errorsEn, errorsAr };
}

// ---------------------------------------------------------------------------
// Section 5 -- stalled-onboarding alert (Operational tier)
// ---------------------------------------------------------------------------

export interface StalledOnboardingAlert {
  stalled: boolean;
  /** True only for a record with zero recorded activity at all -- see the
   *  disclosed-limitation note below for why this is deliberately NOT
   *  folded into `stalled`. */
  notStarted: boolean;
  daysSinceLastActivity: number | null;
  messageEn: string | null;
  messageAr: string | null;
}

/**
 * QA-CAUGHT FIX (12 Sep 2026, during this item's own mandatory QA 10/10
 * customer-simulation pass, Operational-tier scenario, dimension 5 "Edge
 * cases"): the first version of this function returned stalled=true for
 * ANY supplier with zero recorded activity, with no regard for how long
 * ago onboarding actually became eligible. That meant a supplier approved
 * onto the ASL five minutes ago, whose onboarding record simply has not
 * been touched yet, would immediately show the same alarming "stalled"
 * banner as a record that has genuinely sat untouched for weeks -- a real
 * false-positive defect, not a hypothetical one.
 *
 * DISCLOSED LIMITATION driving the fix: this append-only event model has
 * no separate "onboarding opened" timestamp independent of step-completion
 * events (Rule 3's own append-only discipline -- see
 * onboarding_step_events's schema header), so a genuinely brand-new record
 * cannot be numerically distinguished from a genuinely neglected one purely
 * from zero events. Rather than fabricate a days-since-stalled number this
 * system cannot actually support (Rule 1), a zero-activity record is now
 * surfaced as an honest, non-alarming `notStarted` notice -- never as
 * `stalled`. `stalled` is reserved for a record that had SOME activity and
 * then genuinely went quiet past the threshold, which this model can
 * measure correctly. A future version could close this gap by capturing a
 * real "eligible since" timestamp at the ASL-approval boundary itself
 * (Item 3) if this proves insufficient in practice -- named here as a real,
 * open follow-on, not smoothed over.
 */
export function detectStalledOnboarding(
  state: OnboardingCurrentState,
  asOf: Date = new Date(),
  thresholdDays = 14,
): StalledOnboardingAlert {
  if (state.isComplete) {
    return { stalled: false, notStarted: false, daysSinceLastActivity: null, messageEn: null, messageAr: null };
  }
  if (!state.lastActivityAt) {
    return {
      stalled: false,
      notStarted: true,
      daysSinceLastActivity: null,
      messageEn: `Onboarding for ${state.supplierId} has not been started yet.`,
      messageAr: `لم تبدأ بعد تهيئة المورد ${state.supplierId}.`,
    };
  }
  const daysSince = Math.floor((asOf.getTime() - new Date(state.lastActivityAt).getTime()) / (24 * 60 * 60 * 1000));
  const stalled = daysSince >= thresholdDays;
  return {
    stalled,
    notStarted: false,
    daysSinceLastActivity: daysSince,
    messageEn: stalled ? `Onboarding for ${state.supplierId} has been stalled for ${daysSince} day(s) (${state.completedRequiredCount}/${state.requiredStepCount} required steps done) -- primary recommendation: the RACI Accountable holder for onboarding sign-off should follow up directly; strong alternative: reassign the Responsible coordinator if the current one is unavailable, rather than letting the record sit unowned.` : null,
    messageAr: stalled ? `تهيئة المورد ${state.supplierId} متوقفة منذ ${daysSince} يومًا (${state.completedRequiredCount}/${state.requiredStepCount} من الخطوات المطلوبة مكتملة) -- التوصية الأساسية: يجب على صاحب الصلاحية (Accountable) في مصفوفة RACI لاعتماد التهيئة المتابعة مباشرة؛ البديل القوي: إعادة تعيين منسّق المسؤولية (Responsible) إذا تعذّر الوصول إلى الحالي، بدلاً من ترك السجل دون مالك.` : null,
  };
}

// ---------------------------------------------------------------------------
// Section 6 -- graduation readiness (handoff to Supplier Scorecard, see
// worked-example doc for the honest disclosure on why this is a one-click
// action, not a silent automatic transition)
// ---------------------------------------------------------------------------

export interface GraduationReadiness {
  readyToGraduate: boolean;
  reasonEn: string;
  reasonAr: string;
}

export function computeGraduationReadiness(state: OnboardingCurrentState): GraduationReadiness {
  if (state.isComplete) {
    return {
      readyToGraduate: true,
      reasonEn: 'All required onboarding steps are complete -- this supplier can be added to the Supplier Scorecard active roster.',
      reasonAr: 'تم إتمام جميع خطوات التهيئة المطلوبة -- يمكن إضافة هذا المورد إلى قائمة بطاقة تقييم الموردين النشطة.',
    };
  }
  return {
    readyToGraduate: false,
    reasonEn: `${state.completedRequiredCount}/${state.requiredStepCount} required steps complete -- not yet ready to graduate to the active roster.`,
    reasonAr: `تم إتمام ${state.completedRequiredCount} من ${state.requiredStepCount} من الخطوات المطلوبة -- غير جاهز بعد للانتقال إلى القائمة النشطة.`,
  };
}
