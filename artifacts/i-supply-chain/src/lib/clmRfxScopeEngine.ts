/**
 * clmRfxScopeEngine.ts
 *
 * Module 03 / #395 -- Category-Aware RFx Scope-of-Work Build Engine.
 *
 * Owner directive, 26 Aug 2026 (verbatim): "this RFx stuff must be a piece
 * of art... one point responsible for a huge number of supply chain
 * failures"; then, mid-research: "beside research you must build something
 * logical personalized, that design or review the RFx in a very
 * distinguished level, no generic, no assumption, no AI can provide the
 * same." That constraint shapes this file's design: it is not a per-bucket
 * static form. `resolveRfxScopeProfile()` COMPUTES a scope profile from a
 * composition of signals ISC already owns (industryBucket from Module 05,
 * rfxType from this module's Part D, complexityTier from Part A) crossed
 * with real, cited procurement methodology -- a combination a generic AI
 * prompt cannot reproduce because it has no access to ISC's own
 * classification state.
 *
 * Sourcing (full citations in the Module 03 doc, Section 8.2):
 * - Specification-type theory (performance/output/functional vs
 *   conformance/design/prescriptive) -- CIPS, "Procurement Specifications."
 * - WBS deliverable-oriented decomposition -- PMI, Practice Standard for
 *   Work Breakdown Structures, 3rd Edition.
 * - Elicitation-technique selection -- IIBA BABOK Guide, Section 4
 *   (Elicitation and Collaboration).
 * - Per-bucket mandatory fields -- NIGP, NY OGS, SFSU, Hawaii SPO (goods);
 *   construction RFP 10-element structure + named technical-standard
 *   convention; Oregon DOT + PMI (professional services); 3PL-industry RFP
 *   guides (logistics); ISO 41001:2018 Hard/Soft FM + SLA/KPI split (O&M);
 *   RFI question-design guidance (CloudEagle and cross-checked sources).
 *
 * Honesty discipline carried from every other engine in this codebase
 * (Decision Record 8.7): every field below is either (a) traceable to one
 * of the cited sources above, or (b) explicitly marked as ISC's own
 * first-cut synthesis pending owner confirmation (Module 03 doc, Section
 * 8.4/8.11) -- never presented as more authoritative than it is.
 */

import { type IndustryBucket } from './clmIndustryStandards';
import { type RfxType } from './clmContractLifecycle';

// ---------------------------------------------------------------------------
// Specification-type decision (CIPS performance vs conformance)
// ---------------------------------------------------------------------------

export type SpecificationType = 'performance' | 'conformance' | 'hybrid';

export const SPEC_TYPE_META: Record<SpecificationType, { labelEn: string; labelAr: string }> = {
  performance: {
    labelEn: 'Performance / Output Specification',
    labelAr: 'مواصفة أداء / مخرجات',
  },
  conformance: {
    labelEn: 'Conformance / Technical (Prescriptive) Specification',
    labelAr: 'مواصفة مطابقة / فنية (وصفية)',
  },
  hybrid: {
    labelEn: 'Hybrid -- Performance Outcome with Conformance Sub-Requirements',
    labelAr: 'مختلطة -- نتيجة أداء مع متطلبات مطابقة فرعية',
  },
};

export interface SpecTypeDecision {
  type: SpecificationType;
  reasonEn: string;
  reasonAr: string;
  sourceEn: string;
  sourceAr: string;
}

/**
 * CIPS distinguishes performance specifications (outcome, functional,
 * output specs, statements of work -- state WHAT is needed, supplier
 * proposes HOW) from conformance specifications (design, prescriptive,
 * technical -- state exactly HOW: drawings, standards, brands, tolerances).
 * Source: CIPS, "Procurement Specifications" (Module 03 doc Section 8.2).
 *
 * This is a first-cut decision table (Module 03 doc Section 8.4), open for
 * owner confirmation before it is treated as authoritative -- flagged, not
 * hidden.
 */
function decideSpecType(industryBucket: IndustryBucket, rfxType: RfxType): SpecTypeDecision {
  const sourceEn = 'CIPS, "Procurement Specifications" -- performance vs conformance specification theory.';
  const sourceAr = 'CIPS، "مواصفات المشتريات" -- نظرية مواصفات الأداء مقابل المطابقة.';

  if (industryBucket === 'om') {
    return {
      type: 'performance',
      reasonEn: 'Facility Management scopes are commitment- and measured-performance-driven (SLA/KPI), per ISO 41001:2018 -- the supplier proposes how to meet stated service levels, not a prescribed method.',
      reasonAr: 'نطاقات إدارة المرافق مبنية على الالتزام والأداء المُقاس (اتفاقيات مستوى الخدمة/مؤشرات الأداء) وفق ISO 41001:2018 -- يقترح المورد كيفية تحقيق مستويات الخدمة المذكورة، لا طريقة محددة سلفاً.',
      sourceEn, sourceAr,
    };
  }
  if (industryBucket === 'professional-services') {
    return {
      type: 'performance',
      reasonEn: 'Professional/technical services are deliverable- and methodology-driven -- the buyer states the outcome and required deliverables; the supplier proposes the approach (Oregon DOT SOW guide; PMI statement-of-work guidance).',
      reasonAr: 'الخدمات المهنية/الفنية مبنية على المخرجات والمنهجية -- يحدد المشتري النتيجة والمخرجات المطلوبة، ويقترح المورد النهج (دليل SOW لولاية أوريغون؛ إرشادات PMI لبيان العمل).',
      sourceEn, sourceAr,
    };
  }
  if (industryBucket === 'construction') {
    return {
      type: 'hybrid',
      reasonEn: 'Construction scopes blend both: structural/technical elements need conformance detail (named codes, e.g. ACI 318, AISC) to prevent reinterpretation, while overall project outcomes (load capacity, energy targets) are stated as performance requirements.',
      reasonAr: 'نطاقات الإنشاءات تمزج النوعين: العناصر الإنشائية/الفنية تحتاج تفصيلاً مطابقاً (أكواد محددة، مثل ACI 318 وAISC) لمنع سوء التفسير، بينما تُصاغ نتائج المشروع الإجمالية (السعة التحميلية، أهداف كفاءة الطاقة) كمتطلبات أداء.',
      sourceEn, sourceAr,
    };
  }
  if (industryBucket === 'logistics') {
    return {
      type: 'hybrid',
      reasonEn: 'Logistics/3PL scopes are service-level and KPI-driven at the outcome level, but carry hard conformance sub-requirements (customs handling, technology/EDI integration, mode compliance) that must be prescribed exactly.',
      reasonAr: 'نطاقات اللوجستيات/الأطراف الثالثة مبنية على مستوى الخدمة ومؤشرات الأداء على مستوى النتيجة، لكنها تحمل متطلبات مطابقة فرعية صارمة (المعاملات الجمركية، تكامل التقنية/EDI، الامتثال لوسيلة النقل) يجب وصفها بدقة.',
      sourceEn, sourceAr,
    };
  }
  // supply-goods
  if (rfxType === 'rfq') {
    return {
      type: 'conformance',
      reasonEn: 'An RFQ is used precisely when specifications are already fixed -- goods procurement at this stage needs prescriptive detail (models, tolerances, named standards) to prevent reinterpretation and enable apples-to-apples price comparison (NY OGS, SFSU scope-writing guidance).',
      reasonAr: 'يُستخدم طلب عرض الأسعار (RFQ) تحديداً عندما تكون المواصفات محددة بالفعل -- تحتاج مشتريات البضائع في هذه المرحلة إلى تفصيل وصفي (الموديلات، التفاوتات المسموحة، المعايير المسماة) لمنع سوء التفسير وتمكين مقارنة أسعار عادلة (إرشادات NY OGS وSFSU لكتابة النطاق).',
      sourceEn, sourceAr,
    };
  }
  return {
    type: 'performance',
    reasonEn: 'Specifications are not yet fixed (RFI/RFP stage) -- state the required outcome/function and let suppliers propose engineered or custom solutions before locking prescriptive detail.',
    reasonAr: 'المواصفات غير محددة بعد (مرحلة RFI/RFP) -- حدد النتيجة/الوظيفة المطلوبة ودع الموردين يقترحون حلولاً هندسية أو مخصصة قبل تثبيت التفاصيل الوصفية.',
    sourceEn, sourceAr,
  };
}

// ---------------------------------------------------------------------------
// WBS-anchored deliverable skeleton (PMI Practice Standard for WBS)
// ---------------------------------------------------------------------------

export interface WbsNode {
  id: string;
  labelEn: string;
  labelAr: string;
  guidanceEn: string;
  guidanceAr: string;
}

/**
 * PMI: a WBS is "a deliverable-oriented hierarchical decomposition of the
 * work... each descending level represents an increasingly detailed
 * definition of the project work." These are the bucket-specific top-level
 * nodes a buyer decomposes into deliverables -- not free text.
 */
const WBS_SKELETON_BY_BUCKET: Record<Exclude<IndustryBucket, ''>, WbsNode[]> = {
  'supply-goods': [
    { id: 'specification', labelEn: 'Specification & Quantities', labelAr: 'المواصفات والكميات',
      guidanceEn: 'Models/types, measurable tolerances, quantities per line item.', guidanceAr: 'الموديلات/الأنواع، التفاوتات القابلة للقياس، الكميات لكل بند.' },
    { id: 'delivery', labelEn: 'Delivery & Logistics', labelAr: 'التسليم واللوجستيات',
      guidanceEn: 'Delivery timeline, Incoterm/location, packaging requirements.', guidanceAr: 'الجدول الزمني للتسليم، شروط الإنكوترمز/الموقع، متطلبات التغليف.' },
    { id: 'quality', labelEn: 'Quality, Standards & Certification', labelAr: 'الجودة والمعايير والشهادات',
      guidanceEn: 'Named technical standards, inspection/acceptance criteria.', guidanceAr: 'المعايير الفنية المسماة، معايير الفحص والقبول.' },
    { id: 'warranty', labelEn: 'Warranty & After-Sales Support', labelAr: 'الضمان ودعم ما بعد البيع',
      guidanceEn: 'Warranty period/terms, spare-parts and support commitments.', guidanceAr: 'مدة الضمان وشروطه، الالتزامات بقطع الغيار والدعم.' },
  ],
  construction: [
    { id: 'site', labelEn: 'Site & Access', labelAr: 'الموقع والوصول',
      guidanceEn: 'Site constraints, staging area, access/working-hour restrictions.', guidanceAr: 'قيود الموقع، منطقة التجهيز، قيود الوصول/ساعات العمل.' },
    { id: 'structural', labelEn: 'Structural & Technical Works', labelAr: 'الأعمال الإنشائية والفنية',
      guidanceEn: 'Named codes/standards (e.g. ACI 318, AISC), tolerances, materials.', guidanceAr: 'الأكواد/المعايير المسماة (مثل ACI 318، AISC)، التفاوتات، المواد.' },
    { id: 'mep', labelEn: 'MEP (Mechanical / Electrical / Plumbing)', labelAr: 'الأعمال الميكانيكية والكهربائية والصحية',
      guidanceEn: 'Systems scope, performance requirements (load/energy targets).', guidanceAr: 'نطاق الأنظمة، متطلبات الأداء (أهداف الحمل/الطاقة).' },
    { id: 'safety', labelEn: 'Safety, Insurance & Bonding', labelAr: 'السلامة والتأمين والضمانات',
      guidanceEn: 'Required bonds, insurance coverage, safety documentation.', guidanceAr: 'الضمانات المطلوبة، تغطية التأمين، وثائق السلامة.' },
    { id: 'handover', labelEn: 'Testing, Commissioning & Handover', labelAr: 'الاختبار والتشغيل والتسليم',
      guidanceEn: 'Acceptance criteria, punch-list process, as-built documentation.', guidanceAr: 'معايير القبول، إجراء قائمة الملاحظات، توثيق ما تم تنفيذه فعلياً.' },
  ],
  om: [
    { id: 'hard-fm', labelEn: 'Hard FM Scope', labelAr: 'نطاق الصيانة الفنية (Hard FM)',
      guidanceEn: 'Mechanical/electrical/plumbing/fire-safety/HVAC, preventive maintenance.', guidanceAr: 'الأعمال الميكانيكية والكهربائية والصحية والحماية من الحريق وتكييف الهواء، الصيانة الوقائية.' },
    { id: 'soft-fm', labelEn: 'Soft FM Scope', labelAr: 'نطاق الخدمات المساندة (Soft FM)',
      guidanceEn: 'Security, cleaning, catering, mail, aesthetics.', guidanceAr: 'الأمن، النظافة، التموين، البريد، الجوانب الجمالية.' },
    { id: 'sla-kpi', labelEn: 'SLA / KPI Framework', labelAr: 'إطار اتفاقيات وأداء الخدمة',
      guidanceEn: 'Response/restore-time commitments (SLA) separate from measured KPIs (PM compliance %, alarm closure time, energy/m2, work-order ageing, occupant satisfaction).', guidanceAr: 'التزامات وقت الاستجابة/الإصلاح (SLA) منفصلة عن مؤشرات الأداء المُقاسة (نسبة الامتثال للصيانة الوقائية، زمن إغلاق الإنذار، الطاقة لكل م2، عمر أوامر العمل، رضا الشاغلين).' },
    { id: 'governance', labelEn: 'Governance & Incident Process', labelAr: 'الحوكمة وإجراءات الحوادث',
      guidanceEn: 'ISO 41001-aligned service catalogue, SOPs, vendor controls, audits.', guidanceAr: 'كتالوج خدمات متوافق مع ISO 41001، إجراءات التشغيل الموحدة، ضوابط الموردين، التدقيق.' },
  ],
  'professional-services': [
    { id: 'discovery', labelEn: 'Discovery & Requirements', labelAr: 'الاستكشاف ومتطلبات العمل',
      guidanceEn: 'Current-state assessment, stakeholder input, objectives.', guidanceAr: 'تقييم الوضع الحالي، مدخلات أصحاب المصلحة، الأهداف.' },
    { id: 'approach', labelEn: 'Methodology & Key Personnel', labelAr: 'المنهجية والكوادر الرئيسية',
      guidanceEn: 'Mandatory vs optional tasks, named key-personnel roles/authority.', guidanceAr: 'المهام الإلزامية مقابل الاختيارية، أدوار وصلاحيات الكوادر الرئيسية المسماة.' },
    { id: 'deliverables', labelEn: 'Deliverables & Acceptance', labelAr: 'المخرجات والقبول',
      guidanceEn: 'Tangible, measurable deliverables per task, acceptance criteria.', guidanceAr: 'مخرجات ملموسة وقابلة للقياس لكل مهمة، معايير القبول.' },
    { id: 'support', labelEn: 'Support, Invoicing & Exit', labelAr: 'الدعم والفوترة والإنهاء',
      guidanceEn: 'Post-delivery support terms, invoicing/travel/data terms, exit conditions.', guidanceAr: 'شروط الدعم بعد التسليم، شروط الفوترة/السفر/البيانات، شروط الإنهاء.' },
  ],
  logistics: [
    { id: 'lanes', labelEn: 'Lanes & Volumes', labelAr: 'المسارات والأحجام',
      guidanceEn: 'Lane-level detail: 12+ months history, frequency, avg weight/volume, freight class.', guidanceAr: 'تفاصيل على مستوى المسار: تاريخ 12 شهراً على الأقل، التكرار، متوسط الوزن/الحجم، فئة الشحن.' },
    { id: 'modes', labelEn: 'Modes & Technology', labelAr: 'وسائل النقل والتقنية',
      guidanceEn: 'Transport modes required, technology/EDI/tracking integration.', guidanceAr: 'وسائل النقل المطلوبة، تكامل التقنية/EDI/التتبع.' },
    { id: 'service-level', labelEn: 'Service Levels & KPIs', labelAr: 'مستويات الخدمة ومؤشرات الأداء',
      guidanceEn: 'On-time performance, claims handling, KPI definitions.', guidanceAr: 'الأداء في الوقت المحدد، معالجة المطالبات، تعريفات مؤشرات الأداء.' },
    { id: 'peak', labelEn: 'Seasonality & Peak Handling', labelAr: 'الموسمية والتعامل مع الذروة',
      guidanceEn: 'Peak-period volume-spike handling, capacity commitments.', guidanceAr: 'التعامل مع ارتفاع الأحجام في فترات الذروة، التزامات السعة.' },
  ],
};

// ---------------------------------------------------------------------------
// Elicitation-technique guidance (BABOK)
// ---------------------------------------------------------------------------

export interface ElicitationGuidance {
  techniqueEn: string;
  techniqueAr: string;
  reasonEn: string;
  reasonAr: string;
  sourceEn: string;
  sourceAr: string;
}

/**
 * Answers the owner's stated root cause directly ("people can't ...
 * determine detailed needs") -- BABOK's elicitation techniques (interviews,
 * workshops, observation, document analysis, surveys) mapped onto
 * rfxType x complexityTier x industryBucket, not offered as a generic list.
 * Source: IIBA BABOK Guide, Section 4 (Elicitation and Collaboration).
 */
function recommendElicitation(industryBucket: IndustryBucket, rfxType: RfxType, complexityTier: 1 | 2 | 3): ElicitationGuidance {
  const sourceEn = 'IIBA BABOK Guide, Section 4 -- Elicitation and Collaboration.';
  const sourceAr = 'دليل BABOK الصادر عن IIBA، القسم 4 -- الاستخلاص والتعاون.';

  if (industryBucket === 'construction' || industryBucket === 'om') {
    return {
      techniqueEn: 'Site visit / observation, supplemented by document analysis (drawings, existing-asset records).',
      techniqueAr: 'زيارة ميدانية/ملاحظة، مدعومة بتحليل الوثائق (المخططات، سجلات الأصول القائمة).',
      reasonEn: "Physical scopes carry site- and asset-condition detail that cannot be reliably gathered through interviews alone -- BABOK's observation technique is the correct fit.",
      reasonAr: 'النطاقات المادية تحمل تفاصيل عن حالة الموقع والأصول لا يمكن جمعها بشكل موثوق من خلال المقابلات وحدها -- تقنية الملاحظة في BABOK هي الأنسب.',
      sourceEn, sourceAr,
    };
  }
  if (rfxType === 'rfi' || complexityTier === 1) {
    return {
      techniqueEn: 'Structured interviews and document analysis with internal stakeholders.',
      techniqueAr: 'مقابلات منظمة وتحليل وثائق مع أصحاب المصلحة الداخليين.',
      reasonEn: 'At the RFI stage or for low-complexity needs, lightweight techniques are sufficient to establish the core problem and goals before committing to a full workshop.',
      reasonAr: 'في مرحلة طلب المعلومات أو للاحتياجات منخفضة التعقيد، تكفي التقنيات الخفيفة لتحديد المشكلة الأساسية والأهداف قبل الالتزام بورشة عمل كاملة.',
      sourceEn, sourceAr,
    };
  }
  return {
    techniqueEn: 'Structured requirements workshop with named stakeholder roles (sponsor, end-user, technical, compliance).',
    techniqueAr: 'ورشة عمل منظمة لتحديد المتطلبات بأدوار محددة لأصحاب المصلحة (الراعي، المستخدم النهائي، الفني، الامتثال).',
    reasonEn: 'RFP/RFQ-stage or higher-complexity needs benefit from a facilitated workshop that surfaces conflicting stakeholder requirements before they become scope disputes mid-contract.',
    reasonAr: 'تستفيد الاحتياجات في مرحلة RFP/RFQ أو الأعلى تعقيداً من ورشة عمل ميسَّرة تكشف متطلبات أصحاب المصلحة المتعارضة قبل أن تتحول إلى نزاعات على النطاق أثناء تنفيذ العقد.',
    sourceEn, sourceAr,
  };
}

// ---------------------------------------------------------------------------
// Per-bucket mandatory field libraries
// ---------------------------------------------------------------------------

export interface ScopeField {
  id: string;
  labelEn: string;
  labelAr: string;
  whyEn: string;
  whyAr: string;
  /** Per CIPS/NIGP: measurable fields prevent scope creep and
   *  reinterpretation disputes -- flagged so the review engine (8.8) can
   *  check for vague/unmeasurable language specifically. */
  mustBeMeasurable: boolean;
}

const MANDATORY_FIELDS_BY_BUCKET: Record<Exclude<IndustryBucket, ''>, ScopeField[]> = {
  'supply-goods': [
    { id: 'quantities', labelEn: 'Quantities & Models', labelAr: 'الكميات والموديلات', whyEn: 'Fixed quantities/models prevent reinterpretation across bidders.', whyAr: 'الكميات والموديلات الثابتة تمنع سوء التفسير بين مقدمي العروض.', mustBeMeasurable: true },
    { id: 'tolerances', labelEn: 'Measurable Specifications / Tolerances', labelAr: 'المواصفات القابلة للقياس / التفاوتات', whyEn: 'Numeric tolerances, not descriptive language, are what prevents disputes at delivery.', whyAr: 'التفاوتات الرقمية، لا اللغة الوصفية، هي ما يمنع النزاعات عند التسليم.', mustBeMeasurable: true },
    { id: 'delivery-timeline', labelEn: 'Delivery Timeline', labelAr: 'الجدول الزمني للتسليم', whyEn: 'A firm delivery date/window is a standard mandatory field per NY OGS/SFSU guidance.', whyAr: 'تاريخ/نطاق تسليم محدد هو حقل إلزامي قياسي وفق إرشادات NY OGS/SFSU.', mustBeMeasurable: true },
    { id: 'warranty', labelEn: 'Warranty / Support Terms', labelAr: 'شروط الضمان / الدعم', whyEn: 'Warranty terms left implicit are a common post-award dispute source.', whyAr: 'شروط الضمان المتروكة ضمنياً مصدر شائع للنزاعات بعد الترسية.', mustBeMeasurable: false },
    { id: 'standards', labelEn: 'Named Standards / Certifications', labelAr: 'المعايير / الشهادات المسماة', whyEn: 'Named, verifiable standards (not "industry standard") are required to be checkable.', whyAr: 'يجب أن تكون المعايير مسماة وقابلة للتحقق (وليس "معيار الصناعة") ليتسنى فحصها.', mustBeMeasurable: true },
    { id: 'fair-comm', labelEn: 'Fair-Communication Rule Acknowledgment', labelAr: 'إقرار قاعدة التواصل العادل', whyEn: 'Any clarification given to one bidder must go to all -- a procedural fairness field, not a technical one.', whyAr: 'أي توضيح يُعطى لمقدم عرض واحد يجب أن يصل للجميع -- حقل عدالة إجرائية، لا فني.', mustBeMeasurable: false },
  ],
  construction: [
    { id: 'purpose', labelEn: 'Purpose & Project Overview', labelAr: 'الغرض ونظرة عامة على المشروع', whyEn: 'Sets evaluation context; one of the 10 standard RFP elements.', whyAr: 'يحدد سياق التقييم؛ أحد العناصر العشرة القياسية لطلب العرض.', mustBeMeasurable: false },
    { id: 'quantified-deliverables', labelEn: 'Quantified Deliverables + Named Standards', labelAr: 'مخرجات كمية + معايير مسماة', whyEn: 'Deliverables must reference named codes (e.g. ACI 318, AISC), not generic quality language.', whyAr: 'يجب أن تشير المخرجات إلى أكواد مسماة (مثل ACI 318، AISC)، لا لغة جودة عامة.', mustBeMeasurable: true },
    { id: 'site-constraints', labelEn: 'Site Constraints', labelAr: 'قيود الموقع', whyEn: 'Access, staging, and working-hour constraints materially affect bid pricing and must be disclosed upfront.', whyAr: 'قيود الوصول والتجهيز وساعات العمل تؤثر جوهرياً على تسعير العروض ويجب الإفصاح عنها مسبقاً.', mustBeMeasurable: false },
    { id: 'performance-reqs', labelEn: 'Performance Requirements', labelAr: 'متطلبات الأداء', whyEn: 'Load capacities, energy targets stated as measurable numbers.', whyAr: 'السعات التحميلية وأهداف كفاءة الطاقة تُذكر كأرقام قابلة للقياس.', mustBeMeasurable: true },
    { id: 'exclusions', labelEn: 'Explicit Exclusions', labelAr: 'الاستثناءات الصريحة', whyEn: 'Naming what is NOT in scope is the single most cited scope-creep prevention step.', whyAr: 'تسمية ما هو خارج النطاق هي أكثر خطوة يُستشهد بها لمنع زحف النطاق.', mustBeMeasurable: false },
    { id: 'bonding-insurance', labelEn: 'Bonding, Insurance & Safety Documentation', labelAr: 'الضمانات والتأمين ووثائق السلامة', whyEn: 'Construction-specific mandatory compliance documentation, not optional.', whyAr: 'وثائق امتثال إلزامية خاصة بالإنشاءات، وليست اختيارية.', mustBeMeasurable: false },
  ],
  om: [
    { id: 'hard-soft-split', labelEn: 'Hard FM vs Soft FM Split', labelAr: 'تقسيم Hard FM مقابل Soft FM', whyEn: 'ISO 41001 explicitly separates these two service families -- a blended scope is a known source of accountability gaps.', whyAr: 'يفصل ISO 41001 صراحة بين هاتين الفئتين من الخدمات -- النطاق المدمج مصدر معروف لفجوات المساءلة.', mustBeMeasurable: false },
    { id: 'sla', labelEn: 'SLA (Response/Restore Commitments)', labelAr: 'اتفاقية مستوى الخدمة (التزامات الاستجابة/الإصلاح)', whyEn: 'A commitment, distinct from a KPI -- both are required per ISO 41001 practice.', whyAr: 'التزام، يختلف عن مؤشر الأداء -- كلاهما مطلوب وفق ممارسة ISO 41001.', mustBeMeasurable: true },
    { id: 'kpi', labelEn: 'KPIs (Measured Performance)', labelAr: 'مؤشرات الأداء (الأداء المُقاس)', whyEn: 'Preventive-maintenance compliance %, alarm closure time, energy/m2, work-order ageing, occupant satisfaction.', whyAr: 'نسبة الامتثال للصيانة الوقائية، زمن إغلاق الإنذار، الطاقة لكل م2، عمر أوامر العمل، رضا الشاغلين.', mustBeMeasurable: true },
    { id: 'service-catalogue', labelEn: 'Service Catalogue', labelAr: 'كتالوج الخدمات', whyEn: 'ISO 41001 implementation element -- the explicit list of in-scope services per site.', whyAr: 'عنصر تنفيذي في ISO 41001 -- القائمة الصريحة للخدمات ضمن النطاق لكل موقع.', mustBeMeasurable: false },
    { id: 'incident-process', labelEn: 'Risk & Incident Process', labelAr: 'إجراءات المخاطر والحوادث', whyEn: 'ISO 41001 requires a defined incident/risk process, not an ad hoc one.', whyAr: 'يتطلب ISO 41001 إجراءً محدداً للمخاطر/الحوادث، لا إجراءً عشوائياً.', mustBeMeasurable: false },
  ],
  'professional-services': [
    { id: 'task-split', labelEn: 'Mandatory vs Optional Tasks', labelAr: 'المهام الإلزامية مقابل الاختيارية', whyEn: 'Oregon DOT guide: separating these avoids the supplier pricing optional work as if mandatory (or vice versa).', whyAr: 'دليل ولاية أوريغون: فصل هذين يمنع تسعير المورد للعمل الاختياري كأنه إلزامي (أو العكس).', mustBeMeasurable: false },
    { id: 'deliverables', labelEn: 'Tangible, Measurable Deliverables per Task', labelAr: 'مخرجات ملموسة وقابلة للقياس لكل مهمة', whyEn: 'PMI SOW guidance: each task needs a deliverable, not just an activity description.', whyAr: 'إرشادات PMI لبيان العمل: تحتاج كل مهمة إلى مخرج، لا مجرد وصف نشاط.', mustBeMeasurable: true },
    { id: 'key-personnel', labelEn: 'Key Personnel Roles & Authority', labelAr: 'أدوار وصلاحيات الكوادر الرئيسية', whyEn: 'Named roles with defined responsibility/authority/accountability, not just resumes.', whyAr: 'أدوار مسماة بمسؤولية وصلاحية ومساءلة محددة، لا مجرد سير ذاتية.', mustBeMeasurable: false },
    { id: 'performance-standards', labelEn: 'Performance Standards Tied to Benchmarks', labelAr: 'معايير أداء مرتبطة بمعايير مرجعية', whyEn: 'Tied to an industry benchmark, not a vague "high quality" statement.', whyAr: 'مرتبطة بمعيار مرجعي في الصناعة، لا عبارة غامضة مثل "جودة عالية".', mustBeMeasurable: true },
    { id: 'invoicing-travel', labelEn: 'Invoicing, Travel & Data Terms', labelAr: 'شروط الفوترة والسفر والبيانات', whyEn: 'Commonly omitted, commonly disputed -- Oregon DOT flags these explicitly.', whyAr: 'كثيراً ما تُغفل وكثيراً ما تكون محل نزاع -- يشير دليل أوريغون إليها صراحة.', mustBeMeasurable: false },
  ],
  logistics: [
    { id: 'lane-detail', labelEn: 'Lane-Level Detail (12+ months history)', labelAr: 'تفاصيل على مستوى المسار (تاريخ 12 شهراً على الأقل)', whyEn: 'Frequency, average weight/volume, freight class per lane -- without this, bidders cannot price accurately.', whyAr: 'التكرار، متوسط الوزن/الحجم، فئة الشحن لكل مسار -- بدون هذا لا يمكن لمقدمي العروض التسعير بدقة.', mustBeMeasurable: true },
    { id: 'modes-tech', labelEn: 'Transport Modes & Technology Requirements', labelAr: 'وسائل النقل ومتطلبات التقنية', whyEn: 'Mode mix and required system integration (EDI/tracking) materially affect capability fit.', whyAr: 'مزيج الوسائل والتكامل المطلوب مع الأنظمة (EDI/التتبع) يؤثر جوهرياً على ملاءمة القدرات.', mustBeMeasurable: true },
    { id: 'kpi-defs', labelEn: 'KPI Definitions', labelAr: 'تعريفات مؤشرات الأداء', whyEn: 'On-time-performance and claims-handling KPIs must be defined numerically, not aspirationally.', whyAr: 'يجب تعريف مؤشرات الأداء في الوقت المحدد ومعالجة المطالبات رقمياً، لا بصيغ طموحة.', mustBeMeasurable: true },
    { id: 'peak-handling', labelEn: 'Seasonal / Peak-Period Handling', labelAr: 'التعامل مع الفترات الموسمية / الذروة', whyEn: 'Volume-spike capacity commitments are a named 3PL RFP element, frequently omitted by first-time buyers.', whyAr: 'التزامات السعة عند ارتفاع الحجم عنصر معروف في طلبات عروض الأطراف الثالثة، كثيراً ما يُغفله المشترون الجدد.', mustBeMeasurable: true },
    { id: 'pricing-format', labelEn: 'Pricing Format', labelAr: 'صيغة التسعير', whyEn: 'A standardized pricing format is required for cross-bidder comparability.', whyAr: 'صيغة تسعير موحدة مطلوبة لإتاحة المقارنة بين مقدمي العروض.', mustBeMeasurable: false },
  ],
};

/** RFI-specific fields layered on top of the bucket library regardless of
 *  bucket -- an RFI's purpose (pre-qualification, comparability) differs
 *  from RFP/RFQ's purpose (execution-ready scope), per CloudEagle and
 *  cross-checked RFI-guidance sources. */
const RFI_UNIVERSAL_FIELDS: ScopeField[] = [
  { id: 'vendor-credibility', labelEn: 'Vendor Credibility & Stability Screen', labelAr: 'فحص مصداقية واستقرار المورد', whyEn: 'History, financial stability, certifications, capacity -- eliminates unqualified vendors before RFP/RFQ.', whyAr: 'التاريخ، الاستقرار المالي، الشهادات، القدرة -- يستبعد الموردين غير المؤهلين قبل مرحلة RFP/RFQ.', mustBeMeasurable: false },
  { id: 'closed-open-mix', labelEn: 'Mixed Closed/Open Questions', labelAr: 'مزيج من الأسئلة المغلقة/المفتوحة', whyEn: 'Closed questions with defined answer choices enable direct cross-supplier comparison; open questions capture nuance.', whyAr: 'الأسئلة المغلقة بخيارات إجابة محددة تتيح مقارنة مباشرة بين الموردين؛ الأسئلة المفتوحة تلتقط التفاصيل الدقيقة.', mustBeMeasurable: false },
  { id: 'measurable-experience', labelEn: 'Measurable Experience Questions', labelAr: 'أسئلة خبرة قابلة للقياس', whyEn: 'Ask "how many similar projects in 3 years, with what outcomes," not "do you have relevant experience."', whyAr: 'اسأل "كم عدد المشاريع المماثلة خلال 3 سنوات وما نتائجها"، لا "هل لديكم خبرة ذات صلة".', mustBeMeasurable: true },
];

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export interface RfxScopeProfileInputs {
  industryBucket: IndustryBucket;
  rfxType: RfxType;
  complexityTier: 1 | 2 | 3;
}

export interface RfxScopeProfile {
  industryBucket: IndustryBucket;
  rfxType: RfxType;
  specType: SpecTypeDecision;
  wbsSkeleton: WbsNode[];
  elicitation: ElicitationGuidance;
  mandatoryFields: ScopeField[];
  sourceNoteEn: string;
  sourceNoteAr: string;
}

export function resolveRfxScopeProfile(inputs: RfxScopeProfileInputs): RfxScopeProfile | undefined {
  const { industryBucket, rfxType, complexityTier } = inputs;
  if (!industryBucket) return undefined;

  const fields = [...MANDATORY_FIELDS_BY_BUCKET[industryBucket]];
  if (rfxType === 'rfi') fields.push(...RFI_UNIVERSAL_FIELDS);

  return {
    industryBucket,
    rfxType,
    specType: decideSpecType(industryBucket, rfxType),
    wbsSkeleton: WBS_SKELETON_BY_BUCKET[industryBucket],
    elicitation: recommendElicitation(industryBucket, rfxType, complexityTier),
    mandatoryFields: fields,
    sourceNoteEn: 'Derived from CIPS specification theory, PMI WBS practice standard, IIBA BABOK elicitation guidance, and category-specific sourced scope-writing guidance (NIGP, NY OGS, ISO 41001, Oregon DOT, PMI, 3PL-industry RFP guides) -- see Module 03 doc Section 8 for full citations. First-cut synthesis, open for owner confirmation before treated as final.',
    sourceNoteAr: 'مُشتق من نظرية مواصفات CIPS، ومعيار PMI لهيكل تجزئة العمل، وإرشادات استخلاص BABOK الصادرة عن IIBA، وإرشادات كتابة نطاق العمل الموثقة الخاصة بكل فئة (NIGP، NY OGS، ISO 41001، دليل أوريغون، PMI، أدلة طلبات عروض صناعة الأطراف الثالثة) -- راجع القسم 8 من وثيقة الوحدة 03 للاطلاع على كامل المصادر. توليف أولي، مفتوح لتأكيد المالك قبل اعتماده نهائياً.',
  };
}
