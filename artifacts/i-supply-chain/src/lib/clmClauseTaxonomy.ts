/**
 * clmClauseTaxonomy.ts
 *
 * Module 02 (Contract Intelligence v10, Clause & Subclause Taxonomy,
 * items 31-33) -- the 6-category / 56-subclause taxonomy for the CLM
 * contract register, plus the self-declared "worth a second look" flags
 * that cross-reference Modules 01 (legal track), 04 (pricing type), and
 * 05 (industry bucket / FIDIC book).
 *
 * This is a **categorized framework**, not a drafting-ready clause-language
 * bank -- the owner selected "categorized framework, extended" over a full
 * model-clause-language library (item 32, flagged in Module 08 as a real,
 * separate, larger undertaking if ever commissioned). No specific clause
 * wording is asserted here; `clausesPresent` is a manual checklist of which
 * subclause *topics* a contract addresses, never inferred from document
 * text (Decision Record 8.7 -- same standing rule as every other module).
 *
 * Same honesty distinction as Module 04's structural correction #2: every
 * flag below is self-declared-input logic (checklist state the client
 * entered), not verified document extraction. Client-facing framing stays
 * "worth a second look", never "misuse"/"error" (item 35's rule, restated
 * here for clause-level flags).
 *
 * Strategic/Exit's own risk pattern (auto-renewal with no notice-period
 * reminder) is deliberately NOT re-implemented here -- the module doc notes
 * it is "already partially covered by CLMTools.tsx's noticePeriodDays/
 * autoRenewal fields (T1, no new infrastructure needed for this specific
 * flag)". Building a duplicate function for it here would be inventing
 * infrastructure the doc explicitly says isn't needed.
 */

export type ClauseCategory =
  | 'commercial-payment'
  | 'performance-service'
  | 'risk-allocation'
  | 'legal-governance'
  | 'data-ip-confidentiality'
  | 'strategic-exit';

export type ClauseSensitivity = 'high' | 'high-by-definition' | 'moderate' | 'low-moderate';

export interface ClauseCategoryMeta {
  id: ClauseCategory;
  label: string;
  labelAr: string;
  sensitivity: ClauseSensitivity;
  sensitivityLabelEn: string;
  sensitivityLabelAr: string;
  sensitivityNoteEn: string;
  sensitivityNoteAr: string;
}

export const CLAUSE_CATEGORIES: ClauseCategoryMeta[] = [
  {
    id: 'commercial-payment', label: 'Commercial / Payment', labelAr: 'التجاري / الدفع',
    sensitivity: 'high', sensitivityLabelEn: 'HIGH', sensitivityLabelAr: 'مرتفعة',
    sensitivityNoteEn: 'The riba/interest thread: any late-payment-interest subclause needs the Sharia-sensitivity check (Module 01). Government-track contracts additionally carry a sourced 30-day / 1%-per-week (6% cap) baseline (Module 05).',
    sensitivityNoteAr: 'خيط الربا/الفائدة: يتطلب أي بند لفائدة التأخر في السداد فحص الحساسية الشرعية (الوحدة 01). تحمل عقود المسار الحكومي أيضاً معياراً مرجعياً موثقاً (30 يوماً / 1% أسبوعياً بحد أقصى 6%) (الوحدة 05).',
  },
  {
    id: 'performance-service', label: 'Performance & Service', labelAr: 'الأداء والخدمة',
    sensitivity: 'moderate', sensitivityLabelEn: 'MODERATE', sensitivityLabelAr: 'متوسطة',
    sensitivityNoteEn: 'Less jurisdiction-sensitive than Commercial/Payment, but what counts as an acceptable SLA differs sharply by Module 05\'s industry bucket (a Construction defects-liability period is a very different concept from an O&M emergency-response SLA).',
    sensitivityNoteAr: 'أقل حساسية للولاية القضائية من فئة التجاري/الدفع، إلا أن ما يُعد اتفاقية مستوى خدمة مقبولة يختلف بشكل كبير حسب قطاع الصناعة في الوحدة 05 (فترة ضمان العيوب في الإنشاءات مفهوم مختلف تماماً عن اتفاقية مستوى خدمة الاستجابة الطارئة في التشغيل والصيانة).',
  },
  {
    id: 'risk-allocation', label: 'Risk Allocation', labelAr: 'توزيع المخاطر',
    sensitivity: 'high', sensitivityLabelEn: 'HIGH', sensitivityLabelAr: 'مرتفعة',
    sensitivityNoteEn: 'Risk allocation is where FIDIC book choice (Module 05), pricing type (Module 04), and legal track (Module 01) all converge on the same clause category simultaneously -- the clearest example of cross-module "wiring".',
    sensitivityNoteAr: 'يلتقي هنا اختيار كتاب FIDIC (الوحدة 05) ونوع التسعير (الوحدة 04) والمسار القانوني (الوحدة 01) في فئة البنود ذاتها في آن واحد -- وهو أوضح مثال على "الربط" بين الوحدات.',
  },
  {
    id: 'legal-governance', label: 'Legal / Governance', labelAr: 'القانوني / الحوكمة',
    sensitivity: 'high-by-definition', sensitivityLabelEn: 'HIGH BY DEFINITION', sensitivityLabelAr: 'مرتفعة بحكم التعريف',
    sensitivityNoteEn: 'This category IS Module 01\'s operational surface -- governing-law and dispute-resolution subclauses are exactly the two fields Module 01\'s mismatch-flag logic checks.',
    sensitivityNoteAr: 'تمثل هذه الفئة الواجهة التشغيلية للوحدة 01 بحكم التعريف -- بندا القانون الحاكم وتسوية المنازعات هما بالضبط الحقلان اللذان يفحصهما منطق تنبيه عدم التطابق في الوحدة 01.',
  },
  {
    id: 'data-ip-confidentiality', label: 'Data, IP & Confidentiality', labelAr: 'البيانات والملكية الفكرية والسرية',
    sensitivity: 'high', sensitivityLabelEn: 'HIGH (PDPL APPLIES)', sensitivityLabelAr: 'مرتفعة (يسري نظام حماية البيانات)',
    sensitivityNoteEn: 'Saudi PDPL: in force since 14 Sep 2023, full enforcement since 14 Sep 2024, regulator SDAIA. Scoping (owner-confirmed, v5): government-contract clause-review scope only for now, not asserted as a private-contract default.',
    sensitivityNoteAr: 'نظام حماية البيانات الشخصية السعودي: نافذ منذ 14 سبتمبر 2023، والتطبيق الكامل ساري منذ 14 سبتمبر 2024، والجهة المنظمة سدايا. النطاق (بتأكيد المالك، الإصدار 5): يقتصر حالياً على مراجعة بنود العقود الحكومية، ولا يُفترض كافتراضي للعقود الخاصة.',
  },
  {
    id: 'strategic-exit', label: 'Strategic / Exit', labelAr: 'الاستراتيجي / الخروج',
    sensitivity: 'low-moderate', sensitivityLabelEn: 'LOW-MODERATE', sensitivityLabelAr: 'منخفضة إلى متوسطة',
    sensitivityNoteEn: 'Mostly commercial-negotiation territory rather than jurisdiction-specific, though termination-for-cause thresholds under CTL vs common law differ in what counts as a curable breach.',
    sensitivityNoteAr: 'غالباً ضمن نطاق التفاوض التجاري أكثر من كونه مرتبطاً بولاية قضائية محددة، وإن كانت عتبات الإنهاء لسبب تختلف بين نظام المعاملات المدنية والقانون العام فيما يُعد إخلالاً قابلاً للتصحيح.',
  },
];

export interface SubclauseMeta {
  id: string;
  label: string;
  labelAr: string;
  /** Optional plain-English explainer for jargon-heavy subclauses --
   *  client-facing value-add so a non-lawyer understands what they're
   *  checking, not just a legal term with no context. Only populated
   *  where the term genuinely needs it. */
  helpEn?: string;
  helpAr?: string;
  /** Optional named variants for subclauses whose real-world "shape" or
   *  depth commonly differs between contracts (e.g. Limitation of
   *  Liability can be uncapped, capped at contract value, or capped at
   *  insurance proceeds -- three genuinely different structures, not one
   *  fixed clause). Only populated where a real, common set of variants
   *  exists -- this is standard commercial-contracting practice, not
   *  invented for this taxonomy. Selecting a variant is optional and
   *  additional to checking the subclause present; never required. */
  variants?: { id: string; label: string; labelAr: string }[];
  /** Which Module 05 industry buckets this subclause is typically relevant
   *  to (e.g. Allocation of Design Risk is a construction/FIDIC concept;
   *  Retention of Title is a goods concept). Undefined means "generally
   *  applicable, no particular industry association" -- most subclauses.
   *  This never hides or blocks a subclause outside its typical buckets
   *  (a real contract can legitimately need an atypical clause); it only
   *  de-emphasizes it in the UI so a client isn't confused by clutter that
   *  doesn't usually apply to their contract type. */
  typicalIndustryBuckets?: string[];
}

export const SUBCLAUSES_BY_CATEGORY: Record<ClauseCategory, SubclauseMeta[]> = {
  'commercial-payment': [
    { id: 'price-consideration', label: 'Price / Consideration', labelAr: 'السعر / المقابل المالي' },
    { id: 'payment-schedule', label: 'Payment Schedule', labelAr: 'جدول الدفعات' },
    { id: 'invoicing-mechanism', label: 'Invoicing Mechanism', labelAr: 'آلية إصدار الفواتير' },
    { id: 'payment-terms-net-days', label: 'Payment Terms (Net Days)', labelAr: 'شروط الدفع (عدد الأيام)' },
    { id: 'late-payment-interest-penalty', label: 'Late-Payment Interest / Penalty', labelAr: 'فائدة / غرامة التأخر في السداد',
      helpEn: 'What happens if an invoice is paid late. If this accrues as interest, it carries a real Sharia-sensitivity flag on Saudi-touching contracts -- a pre-agreed liquidated-damages figure is a common alternative.',
      helpAr: 'ما يترتب على تأخر سداد الفاتورة. إذا كان مستحقاً كفائدة متراكمة، فإنه يحمل حساسية شرعية حقيقية في العقود ذات الصلة بالسعودية -- ويُعد مبلغ التعويض المقطوع المتفق عليه مسبقاً بديلاً شائعاً.' },
    { id: 'currency-fx-risk-allocation', label: 'Currency & FX Risk Allocation', labelAr: 'توزيع مخاطر العملة وسعر الصرف' },
    { id: 'taxes-vat', label: 'Taxes / VAT Treatment', labelAr: 'الضرائب / معاملة ضريبة القيمة المضافة' },
    { id: 'rebates-discounts', label: 'Rebates / Discounts', labelAr: 'الخصومات / الحسومات' },
    { id: 'advance-mobilization-payment', label: 'Advance / Mobilization Payment', labelAr: 'الدفعة المقدمة / دفعة التعبئة' },
    { id: 'retention-holdback', label: 'Retention / Holdback', labelAr: 'نسبة الاحتجاز / الحسم المؤجل',
      helpEn: 'A percentage of each payment held back until final acceptance/warranty expiry, as security against defects.',
      helpAr: 'نسبة من كل دفعة تُحتجز حتى القبول النهائي/انتهاء الضمان، كضمان مقابل العيوب المحتملة.' },
    { id: 'set-off-rights', label: 'Set-Off Rights', labelAr: 'حقوق المقاصة',
      helpEn: 'Whether one party can deduct what the other owes it from a payment it is about to make, instead of paying in full and chasing the debt separately.',
      helpAr: 'هل يجوز لأحد الطرفين خصم ما يستحقه من مبلغ يوشك على دفعه للطرف الآخر، بدلاً من الدفع الكامل ومطالبته بالمبلغ المستحق بشكل منفصل.' },
    { id: 'retention-of-title', label: 'Retention of Title / Reservation of Ownership', labelAr: 'الاحتفاظ بالملكية / تحفظ الملكية',
      helpEn: 'A common special condition on goods contracts: the seller keeps legal ownership of the goods until payment is received in full, even after physical delivery -- gives the seller a real security interest if the buyer defaults or becomes insolvent.',
      helpAr: 'شرط خاص شائع في عقود البضائع: يحتفظ البائع بالملكية القانونية للبضائع حتى استلام السداد بالكامل، حتى بعد التسليم الفعلي -- يمنح البائع ضماناً حقيقياً في حال تعثر المشتري أو إعساره.',
      typicalIndustryBuckets: ['supply-goods'] },
    { id: 'cost-records-audit-rights', label: 'Cost / Records Audit Rights', labelAr: 'حقوق التدقيق على التكاليف والسجلات',
      helpEn: 'The client\'s right to inspect the supplier\'s books/cost records to verify billed amounts -- especially important on Cost-Plus or Time & Materials pricing (Module 04), where the client is paying actual cost.',
      helpAr: 'حق العميل في فحص دفاتر ومستندات تكاليف المورد للتحقق من المبالغ المفوترة -- مهم بشكل خاص في التسعير بنظام التكلفة زائد أتعاب أو الوقت والمواد (الوحدة 04)، حيث يدفع العميل التكلفة الفعلية.' },
  ],
  'performance-service': [
    { id: 'scope-of-work-reference', label: 'Scope-of-Work Reference', labelAr: 'الإشارة إلى نطاق العمل' },
    { id: 'acceptance-criteria', label: 'Acceptance Criteria', labelAr: 'معايير القبول' },
    { id: 'performance-service-levels', label: 'Performance / Service Levels (SLA/KPI)', labelAr: 'مستويات الأداء / اتفاقية مستوى الخدمة (SLA/KPI)' },
    { id: 'delivery-schedule-milestones', label: 'Delivery Schedule / Milestones', labelAr: 'جدول التسليم والمعالم الزمنية' },
    { id: 'inspection-testing-rights', label: 'Inspection & Testing Rights', labelAr: 'حقوق الفحص والاختبار' },
    { id: 'defects-liability-warranty-period', label: 'Defects-Liability / Warranty Period', labelAr: 'فترة ضمان العيوب / الكفالة' },
    { id: 'remedies-non-performance', label: 'Remedies for Non-Performance', labelAr: 'سبل العلاج عند عدم الأداء' },
    { id: 'service-credits', label: 'Service Credits', labelAr: 'خصومات مستوى الخدمة',
      helpEn: 'Automatic fee reductions when SLA targets are missed -- a lighter, faster remedy than a formal breach/damages claim.',
      helpAr: 'تخفيضات تلقائية على الرسوم عند عدم تحقيق أهداف اتفاقية مستوى الخدمة -- علاج أخف وأسرع من دعوى إخلال أو تعويض رسمية.' },
    { id: 'step-in-rights', label: 'Step-In Rights', labelAr: 'حقوق التدخل / الإحلال',
      helpEn: 'The client\'s right to take over performance directly (or bring in a replacement) if the contractor seriously fails to deliver, without terminating the whole contract.',
      helpAr: 'حق العميل في تولي التنفيذ مباشرة (أو إحلال جهة بديلة) في حال إخلال جوهري من المقاول، دون إنهاء العقد بالكامل.' },
    { id: 'hse-compliance', label: 'Health, Safety & Environment (HSE) Compliance', labelAr: 'الامتثال للصحة والسلامة والبيئة (HSE)',
      helpEn: 'A common special condition on construction, O&M, and logistics contracts specifically: minimum safety standards, incident-reporting duties, and environmental-compliance obligations during performance.',
      helpAr: 'شرط خاص شائع تحديداً في عقود الإنشاءات والتشغيل والصيانة واللوجستيات: معايير سلامة دنيا، والتزامات الإبلاغ عن الحوادث، والامتثال البيئي أثناء التنفيذ.',
      typicalIndustryBuckets: ['construction', 'om', 'logistics'] },
    { id: 'site-access-security-requirements', label: 'Site Access & Security Requirements', labelAr: 'متطلبات الدخول للموقع والأمن',
      typicalIndustryBuckets: ['construction', 'om', 'logistics'] },
  ],
  'risk-allocation': [
    { id: 'limitation-of-liability', label: 'Limitation of Liability (cap & carve-outs)', labelAr: 'حد المسؤولية (السقف والاستثناءات)',
      helpEn: 'Sets a ceiling on how much one party can be made to pay the other. The ceiling itself commonly takes one of a few different shapes.',
      helpAr: 'يضع سقفاً لما قد يُلزم أحد الطرفين بدفعه للآخر. عادة ما يأخذ هذا السقف أحد أشكال معدودة.',
      variants: [
        { id: 'uncapped', label: 'Uncapped', labelAr: 'بدون سقف' },
        { id: 'capped-contract-value', label: 'Capped at total contract value', labelAr: 'محدد بسقف القيمة الإجمالية للعقد' },
        { id: 'capped-fees-paid', label: 'Capped at fees paid (e.g. trailing 12 months)', labelAr: 'محدد بسقف الرسوم المدفوعة (مثال: آخر 12 شهراً)' },
        { id: 'capped-insurance-proceeds', label: 'Capped at insurance proceeds', labelAr: 'محدد بسقف عوائد التأمين' },
      ] },
    { id: 'indemnification', label: 'Indemnification', labelAr: 'التعويض',
      helpEn: 'A promise by one party to cover the other\'s losses from specific risks (e.g. IP infringement, third-party claims). Which direction it runs -- and whether it\'s mutual -- shapes who is actually protected.',
      helpAr: 'التزام أحد الطرفين بتغطية خسائر الطرف الآخر الناجمة عن مخاطر محددة (مثل التعدي على الملكية الفكرية أو مطالبات طرف ثالث). يحدد اتجاه الالتزام -- ومدى تبادليته -- من هو المحمي فعلياً.',
      variants: [
        { id: 'mutual', label: 'Mutual (both parties indemnify each other)', labelAr: 'تبادلي (يعوض كل طرف الآخر)' },
        { id: 'vendor-to-client', label: 'One-way -- vendor indemnifies client', labelAr: 'باتجاه واحد -- المورد يعوض العميل' },
        { id: 'client-to-vendor', label: 'One-way -- client indemnifies vendor', labelAr: 'باتجاه واحد -- العميل يعوض المورد' },
        { id: 'capped-mutual', label: 'Mutual, with its own separate liability cap', labelAr: 'تبادلي، بسقف مسؤولية منفصل خاص به' },
      ] },
    { id: 'force-majeure', label: 'Force Majeure', labelAr: 'القوة القاهرة',
      helpEn: 'Excuses non-performance caused by events outside either party\'s control. How narrowly or broadly the triggering events are defined changes how easily either side can invoke it.',
      helpAr: 'يُعفي من المسؤولية عن عدم التنفيذ الناتج عن أحداث خارجة عن سيطرة الطرفين. يؤثر مدى ضيق أو اتساع تعريف الأحداث المُحفِّزة على مدى سهولة احتجاج أي طرف به.',
      variants: [
        { id: 'narrow-named-events', label: 'Narrow -- specific named events only', labelAr: 'ضيق -- أحداث محددة بالاسم فقط' },
        { id: 'standard-list', label: 'Standard list (war, natural disaster, government action, etc.)', labelAr: 'قائمة معيارية (حرب، كارثة طبيعية، إجراء حكومي، إلخ)' },
        { id: 'broad-catch-all', label: 'Broad catch-all (any event beyond reasonable control)', labelAr: 'شامل وواسع (أي حدث خارج نطاق السيطرة المعقولة)' },
      ] },
    { id: 'insurance-requirements', label: 'Insurance Requirements', labelAr: 'متطلبات التأمين' },
    { id: 'warranty-scope-exclusions', label: 'Warranty Scope & Exclusions', labelAr: 'نطاق الضمان واستثناءاته' },
    { id: 'liquidated-damages-delay-penalties', label: 'Liquidated Damages / Delay Penalties', labelAr: 'التعويض المقطوع / غرامات التأخير',
      helpEn: 'A pre-agreed compensation amount for delay or non-performance, so neither side has to prove actual loss in the moment. Applies to any contract type, not just construction -- FIDIC Sub-Clause 8.7 (Delay Damages) is the best-known reference structure, but the same shapes appear in supply, services, and logistics contracts.',
      helpAr: 'مبلغ تعويض متفق عليه مسبقاً عن التأخير أو عدم الأداء، بحيث لا يحتاج أي طرف لإثبات الخسارة الفعلية وقت حدوثها. ينطبق على أي نوع من العقود، وليس الإنشاءات فقط -- يُعد البند الفرعي 8.7 من FIDIC (تعويضات التأخير) الهيكل المرجعي الأكثر شهرة، إلا أن نفس الأشكال تظهر في عقود التوريد والخدمات واللوجستيات.',
      variants: [
        { id: 'daily-rate-capped', label: 'Daily/weekly rate, capped (e.g. % of contract value)', labelAr: 'معدل يومي/أسبوعي، بسقف (مثال: نسبة من قيمة العقد)' },
        { id: 'daily-rate-uncapped', label: 'Daily/weekly rate, uncapped', labelAr: 'معدل يومي/أسبوعي، بدون سقف' },
        { id: 'milestone-based', label: 'Fixed amount per missed milestone', labelAr: 'مبلغ ثابت لكل معلم زمني فائت' },
        { id: 'sole-exclusive-remedy', label: 'Sole and exclusive remedy for delay (excludes further damages claims)', labelAr: 'العلاج الوحيد والحصري للتأخير (يستبعد أي مطالبات تعويض إضافية)' },
        { id: 'not-exclusive-remedy', label: 'Not exclusive -- other remedies remain available', labelAr: 'غير حصري -- تبقى سبل العلاج الأخرى متاحة' },
      ] },
    { id: 'consequential-damages-exclusion', label: 'Consequential-Damages Exclusion', labelAr: 'استبعاد الأضرار التبعية',
      helpEn: 'Rules out claims for indirect losses (e.g. lost profits, lost business) beyond the direct cost of fixing the problem -- caps how large a claim can realistically get.',
      helpAr: 'يستبعد المطالبة بالخسائر غير المباشرة (مثل فوات الأرباح أو خسارة الأعمال) بما يتجاوز التكلفة المباشرة لإصلاح المشكلة -- يحد من الحجم الواقعي لأي مطالبة.' },
    { id: 'allocation-of-design-risk', label: 'Allocation of Design Risk', labelAr: 'توزيع مخاطر التصميم',
      helpEn: 'Who bears the cost if the design itself turns out to be flawed -- the single biggest factor separating FIDIC Red (employer designs) from Silver (contractor designs, takes the risk).',
      helpAr: 'من يتحمل التكلفة إذا تبيّن أن التصميم نفسه معيب -- أهم عامل يميز بين الكتاب الأحمر لـ FIDIC (يصمم صاحب العمل) والكتاب الفضي (يصمم المقاول ويتحمل المخاطر).',
      typicalIndustryBuckets: ['construction'] },
    { id: 'change-in-law-risk', label: 'Change-in-Law Risk', labelAr: 'مخاطر تغيّر الأنظمة',
      helpEn: 'Who absorbs the extra cost if a new law or regulation (e.g. a new VAT rate, new safety standard) changes mid-contract.',
      helpAr: 'من يتحمل التكلفة الإضافية إذا تغيّر نظام أو لائحة (مثل تغيّر نسبة ضريبة القيمة المضافة أو معيار سلامة جديد) أثناء سريان العقد.' },
    { id: 'parent-company-guarantee-performance-bond', label: 'Parent Company Guarantee / Performance Bond', labelAr: 'ضمان الشركة الأم / خطاب ضمان الأداء',
      helpEn: 'A security instrument backing the contractor\'s obligations -- either a guarantee from its parent company, or a bank-issued performance bond the client can call on if the contractor defaults. Common on construction and larger government contracts.',
      helpAr: 'أداة ضمان تدعم التزامات المقاول -- إما ضمان من شركته الأم، أو خطاب ضمان أداء بنكي يمكن للعميل تفعيله في حال تعثر المقاول. شائع في عقود الإنشاءات والعقود الحكومية الكبرى.',
      typicalIndustryBuckets: ['construction', 'supply-goods'] },
  ],
  'legal-governance': [
    { id: 'governing-law', label: 'Governing Law', labelAr: 'القانون الحاكم' },
    { id: 'dispute-resolution', label: 'Dispute Resolution (forum/institution)', labelAr: 'تسوية المنازعات (الجهة/المؤسسة)',
      helpEn: 'How disputes get resolved if negotiation fails. The mechanism chosen affects cost, speed, confidentiality, and cross-border enforceability.',
      helpAr: 'الآلية المتبعة لحل النزاعات في حال فشل التفاوض. تؤثر الآلية المختارة على التكلفة والسرعة والسرية وقابلية الإنفاذ عبر الحدود.',
      variants: [
        { id: 'litigation', label: 'Litigation (national courts)', labelAr: 'التقاضي (المحاكم الوطنية)' },
        { id: 'institutional-arbitration', label: 'Institutional arbitration (e.g. SCCA, ICC, DIAC)', labelAr: 'تحكيم مؤسسي (مثل المركز السعودي للتحكيم التجاري، غرفة التجارة الدولية، مركز دبي للتحكيم)' },
        { id: 'ad-hoc-arbitration', label: 'Ad-hoc arbitration (no administering institution)', labelAr: 'تحكيم مخصص (دون مؤسسة إدارية)' },
        { id: 'mediation-then-arbitration', label: 'Mediation first, arbitration if unresolved', labelAr: 'الوساطة أولاً، ثم التحكيم في حال عدم الحل' },
      ] },
    { id: 'assignment-subcontracting', label: 'Assignment & Subcontracting Rights', labelAr: 'حقوق التنازل والتعاقد من الباطن' },
    { id: 'notices', label: 'Notices', labelAr: 'الإشعارات' },
    { id: 'entire-agreement', label: 'Entire-Agreement Clause', labelAr: 'بند الاتفاقية الكاملة' },
    { id: 'amendment-variation-procedure', label: 'Amendment / Variation Procedure', labelAr: 'إجراءات التعديل' },
    { id: 'severability', label: 'Severability', labelAr: 'قابلية الفصل' },
    { id: 'counterparts', label: 'Counterparts', labelAr: 'النظائر (نسخ العقد)' },
    { id: 'language-of-contract', label: 'Language of the Contract (Ar/En precedence)', labelAr: 'لغة العقد (أولوية العربية/الإنجليزية)' },
    { id: 'regulatory-compliance', label: 'Regulatory-Compliance Clause', labelAr: 'بند الامتثال التنظيمي' },
    { id: 'anti-corruption-sanctions', label: 'Anti-Corruption / Sanctions Compliance', labelAr: 'مكافحة الفساد والامتثال للعقوبات' },
    { id: 'local-content-saudization', label: 'Local Content / Saudization Requirements', labelAr: 'متطلبات المحتوى المحلي / السعودة',
      helpEn: 'A special condition specific to Saudi/GCC contracts: minimum local-content percentage and/or Saudization (Nitaqat) workforce requirements -- common in government and large private-sector contracts.',
      helpAr: 'شرط خاص بالعقود السعودية/الخليجية: نسبة دنيا للمحتوى المحلي و/أو متطلبات توطين القوى العاملة (نطاقات) -- شائع في العقود الحكومية وعقود القطاع الخاص الكبرى.',
      typicalIndustryBuckets: ['construction', 'om', 'supply-goods', 'logistics'] },
  ],
  'data-ip-confidentiality': [
    { id: 'confidentiality-nda', label: 'Confidentiality / NDA Terms', labelAr: 'شروط السرية / عدم الإفصاح' },
    { id: 'ip-ownership-background', label: 'IP Ownership -- Background IP (brought in by each party)', labelAr: 'ملكية الملكية الفكرية -- السابقة (التي أحضرها كل طرف)',
      helpEn: 'IP each party already owned before this contract started (e.g. a consultant\'s pre-built methodology or tools) -- who keeps owning it during and after the engagement.',
      helpAr: 'الملكية الفكرية التي كان يملكها كل طرف قبل بدء هذا العقد (مثل منهجية أو أدوات جاهزة لدى استشاري) -- من يبقى مالكاً لها أثناء التنفيذ وبعده.' },
    { id: 'ip-ownership-foreground', label: 'IP Ownership -- Foreground IP (created during the engagement)', labelAr: 'ملكية الملكية الفكرية -- الناتجة (التي نشأت أثناء التنفيذ)',
      helpEn: 'New work product created specifically for this engagement (e.g. a custom report, design, or code written for the client) -- the single most common gap when this is left silent, especially in Professional Services.',
      helpAr: 'نتاج عمل جديد أُنشئ خصيصاً لهذا التكليف (مثل تقرير أو تصميم أو برمجية مخصصة للعميل) -- أكثر فجوة شيوعاً عندما يُترك هذا البند دون تحديد، خاصة في الخدمات المهنية.',
      variants: [
        { id: 'client-owns', label: 'Client owns outright', labelAr: 'يملكها العميل بشكل كامل' },
        { id: 'vendor-owns-license-to-client', label: 'Vendor owns, client gets a usage license', labelAr: 'يملكها المورد، ويحصل العميل على ترخيص استخدام' },
        { id: 'joint-ownership', label: 'Joint ownership', labelAr: 'ملكية مشتركة' },
      ] },
    { id: 'data-protection-pdpl', label: 'Data Protection / PDPL Compliance', labelAr: 'حماية البيانات / الامتثال لنظام حماية البيانات الشخصية' },
    { id: 'data-residency-cross-border', label: 'Data Residency / Cross-Border Transfer', labelAr: 'إقامة البيانات والنقل عبر الحدود' },
    { id: 'audit-rights-data-handling', label: 'Audit Rights over Data Handling', labelAr: 'حقوق التدقيق على التعامل مع البيانات' },
    { id: 'license-grant-back', label: 'License Grant-Back', labelAr: 'منح ترخيص عكسي' },
    { id: 'publicity-non-disparagement', label: 'Publicity / Non-Disparagement', labelAr: 'الإعلان / عدم الإساءة' },
  ],
  'strategic-exit': [
    { id: 'term-renewal-mechanism', label: 'Term & Renewal Mechanism (auto vs opt-in)', labelAr: 'مدة العقد وآلية التجديد (تلقائي أم اختياري)' },
    { id: 'termination-for-convenience', label: 'Termination for Convenience', labelAr: 'الإنهاء للمصلحة (بدون سبب)',
      helpEn: 'The right to end the contract without needing to prove a breach. Whether this is available at all, and on what notice, shapes how "locked in" either party really is.',
      helpAr: 'حق إنهاء العقد دون الحاجة لإثبات إخلال. توفر هذا الحق من عدمه، والمدة اللازمة للإشعار به، يحددان مدى "الالتزام الفعلي" لكل طرف.',
      variants: [
        { id: 'not-permitted', label: 'Not permitted (fixed term, no early exit)', labelAr: 'غير مسموح به (مدة ثابتة، دون خروج مبكر)' },
        { id: 'with-notice-period', label: 'Permitted with a notice period', labelAr: 'مسموح به مع فترة إشعار' },
        { id: 'with-notice-and-compensation', label: 'Permitted with notice plus compensation/break fee', labelAr: 'مسموح به مع إشعار بالإضافة إلى تعويض / رسم إنهاء مبكر' },
      ] },
    { id: 'termination-for-cause', label: 'Termination for Cause', labelAr: 'الإنهاء لسبب' },
    { id: 'transition-exit-assistance', label: 'Transition / Exit-Assistance Obligations', labelAr: 'التزامات المساعدة في الانتقال / الخروج' },
    { id: 'non-compete-exclusivity', label: 'Non-Compete / Exclusivity', labelAr: 'عدم المنافسة / الحصرية' },
    { id: 'mfc-benchmarking-rights', label: 'Most-Favored-Customer / Benchmarking Rights', labelAr: 'حقوق العميل الأفضل / المقارنة المرجعية',
      helpEn: 'A right to have your price/terms periodically compared against market rates (or the supplier\'s other customers) and adjusted if you\'re falling behind.',
      helpAr: 'حق دوري بمقارنة السعر/الشروط الخاصة بك مع أسعار السوق (أو عملاء المورد الآخرين) وتعديلها إذا كانت أقل تنافسية.' },
    { id: 'step-in-on-termination', label: 'Step-In on Termination', labelAr: 'حق التدخل عند الإنهاء' },
    { id: 'survival-clauses', label: 'Survival Clauses (which obligations outlive termination)', labelAr: 'البنود التي تبقى سارية بعد الإنهاء' },
    { id: 'non-solicitation-of-personnel', label: 'Non-Solicitation of Personnel', labelAr: 'عدم استقطاب الموظفين',
      helpEn: 'A common special condition, especially in Professional Services: restricts either party from directly hiring the other\'s staff during and for a period after the engagement.',
      helpAr: 'شرط خاص شائع، خاصة في الخدمات المهنية: يقيّد قيام أي من الطرفين بتوظيف موظفي الطرف الآخر مباشرة أثناء التكليف ولفترة بعد انتهائه.',
      typicalIndustryBuckets: ['professional-services'] },
  ],
};

/** Manual checklist of which subclause topics a contract addresses, per
 *  category. Optional, additive, never inferred from document text --
 *  a `true`/present entry is the client's own self-declaration, same
 *  standing rule as every other Contract Intelligence module. */
export type ClausesPresent = Partial<Record<ClauseCategory, string[]>>;

export function totalSubclauseCount(): number {
  return Object.values(SUBCLAUSES_BY_CATEGORY).reduce((sum, list) => sum + list.length, 0);
}

export function presentSubclauseCount(clausesPresent: ClausesPresent | undefined): number {
  if (!clausesPresent) return 0;
  return Object.values(clausesPresent).reduce((sum, ids) => sum + (ids?.length ?? 0), 0);
}

/** Categories a client has explicitly marked as not relevant to this
 *  contract (e.g. Data/IP on a simple one-off goods purchase). Prevents
 *  a category showing a misleading "0% / gap" reading when it was never
 *  meant to apply -- an honest opt-out, not a hidden default. */
export type ClauseCategoriesNotApplicable = ClauseCategory[];

export type ClauseCategoryStatus = 'not-applicable' | 'not-started' | 'partial' | 'complete';

export interface ClauseCategoryCompleteness {
  category: ClauseCategory;
  total: number;
  present: number;
  percent: number; // 0-100, 0 when not-applicable
  status: ClauseCategoryStatus;
}

/** Per-category completion, aware of the Not-Applicable opt-out. Drives
 *  the progress bar and status chip for one category's accordion header. */
export function categoryCompleteness(
  category: ClauseCategory,
  clausesPresent: ClausesPresent | undefined,
  notApplicable: ClauseCategoriesNotApplicable | undefined,
): ClauseCategoryCompleteness {
  const total = SUBCLAUSES_BY_CATEGORY[category].length;
  if ((notApplicable ?? []).includes(category)) {
    return { category, total, present: 0, percent: 0, status: 'not-applicable' };
  }
  const present = (clausesPresent?.[category] ?? []).length;
  const percent = total === 0 ? 0 : Math.round((present / total) * 100);
  const status: ClauseCategoryStatus = present === 0 ? 'not-started' : present >= total ? 'complete' : 'partial';
  return { category, total, present, percent, status };
}

const SENSITIVITY_WEIGHT: Record<ClauseSensitivity, number> = {
  'high': 3,
  'high-by-definition': 3,
  'moderate': 2,
  'low-moderate': 1,
};

export interface ClauseHealthResult {
  /** 0-100, weighted so HIGH-sensitivity categories (Commercial/Payment,
   *  Risk Allocation, Legal/Governance, Data/IP) count for more than
   *  LOW-MODERATE ones (Strategic/Exit) -- a client who has thoroughly
   *  covered the high-stakes categories but skipped a low-stakes one
   *  scores better than the reverse, which a flat average would not
   *  capture. Categories marked Not Applicable are excluded entirely,
   *  not counted as gaps. */
  weightedPercent: number;
  applicableCategoryCount: number;
  labelEn: string;
  labelAr: string;
}

/**
 * Sensitivity-weighted overall clause coverage score. Purely a self-
 * declared-checklist rollup -- not a legal-quality assessment, not a
 * verified-document score. Gives the client one honest, at-a-glance
 * number instead of making them read six separate progress bars to
 * judge "is this contract reasonably documented".
 */
export function overallClauseHealth(
  clausesPresent: ClausesPresent | undefined,
  notApplicable: ClauseCategoriesNotApplicable | undefined,
): ClauseHealthResult {
  let weightedPresent = 0;
  let weightedTotal = 0;
  let applicableCategoryCount = 0;

  for (const meta of CLAUSE_CATEGORIES) {
    const c = categoryCompleteness(meta.id, clausesPresent, notApplicable);
    if (c.status === 'not-applicable') continue;
    applicableCategoryCount++;
    const weight = SENSITIVITY_WEIGHT[meta.sensitivity];
    weightedPresent += c.present * weight;
    weightedTotal += c.total * weight;
  }

  const weightedPercent = weightedTotal === 0 ? 0 : Math.round((weightedPresent / weightedTotal) * 100);

  let labelEn: string; let labelAr: string;
  if (applicableCategoryCount === 0) { labelEn = 'No categories applicable'; labelAr = 'لا توجد فئات منطبقة'; }
  else if (weightedPercent === 0) { labelEn = 'Not started'; labelAr = 'لم يبدأ'; }
  else if (weightedPercent < 40) { labelEn = 'Getting started'; labelAr = 'بداية التوثيق'; }
  else if (weightedPercent < 75) { labelEn = 'Solid coverage'; labelAr = 'تغطية جيدة'; }
  else { labelEn = 'Comprehensive'; labelAr = 'تغطية شاملة'; }

  return { weightedPercent, applicableCategoryCount, labelEn, labelAr };
}

export interface ClauseFlagCheck { flagged: boolean; reasonEn: string; reasonAr: string; }

const notFlagged: ClauseFlagCheck = { flagged: false, reasonEn: '', reasonAr: '' };

const SAUDI_KEYWORDS = ['saudi', 'ksa', 'kingdom of saudi arabia'];

function mentionsAny(text: string | undefined, keywords: string[]): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

function isSaudiTouching(
  governingLawClause: string | undefined,
  counterpartyJurisdiction: string | undefined,
  performanceLocation: string | undefined,
): boolean {
  if (governingLawClause === 'saudi-ctl' || governingLawClause === 'saudi-gtpl') return true;
  return mentionsAny(counterpartyJurisdiction, SAUDI_KEYWORDS) || mentionsAny(performanceLocation, SAUDI_KEYWORDS);
}

/**
 * Commercial/Payment category flag. An interest-bearing late-payment
 * subclause with no Sharia-compliant alternative (a pre-agreed liquidated-
 * damages figure instead of accruing interest) is worth flagging for a
 * Saudi-touching contract, regardless of pricing type (Module 04).
 */
export function checkCommercialRibaFlag(
  clausesPresent: ClausesPresent | undefined,
  counterpartyJurisdiction: string | undefined,
  performanceLocation: string | undefined,
  governingLawClause: string | undefined,
): ClauseFlagCheck {
  const hasInterestClause = (clausesPresent?.['commercial-payment'] ?? []).includes('late-payment-interest-penalty');
  if (!hasInterestClause) return notFlagged;

  const hasLdAlternative = (clausesPresent?.['risk-allocation'] ?? []).includes('liquidated-damages-delay-penalties');
  if (hasLdAlternative) return notFlagged;

  if (!isSaudiTouching(governingLawClause, counterpartyJurisdiction, performanceLocation)) return notFlagged;

  return {
    flagged: true,
    reasonEn: 'A late-payment interest/penalty subclause is checked, with no liquidated-damages alternative also checked, on a Saudi-touching contract. Interest-bearing structures carry a real Sharia-compliance sensitivity -- a pre-agreed liquidated-damages figure is a common alternative -- worth a second look, based on what you told us.',
    reasonAr: 'تم تحديد بند فائدة/غرامة التأخر في السداد دون تحديد بديل التعويض المقطوع، في عقد ذي صلة بالسعودية. تحمل الهياكل التي تتضمن فائدة حساسية شرعية حقيقية -- ويُعد مبلغ التعويض المقطوع المتفق عليه مسبقاً بديلاً شائعاً -- يستحق نظرة ثانية، بناءً على ما أفدتم به.',
  };
}

/**
 * Performance & Service category flag. A performance clause with no
 * measurable acceptance criteria is the single most common quality gap
 * this category should flag -- ties to Module 06's "measurable obligation
 * objects, flag when unmeasurable" maturity dimension.
 */
export function checkPerformanceMeasurabilityFlag(clausesPresent: ClausesPresent | undefined): ClauseFlagCheck {
  const categoryEntries = clausesPresent?.['performance-service'] ?? [];
  if (categoryEntries.length === 0) return notFlagged;
  if (categoryEntries.includes('acceptance-criteria')) return notFlagged;

  return {
    flagged: true,
    reasonEn: 'Performance & Service subclauses are checked, but Acceptance Criteria is not among them. A performance obligation with no measurable acceptance test is hard to enforce -- worth a second look, based on what you told us.',
    reasonAr: 'تم تحديد بنود ضمن فئة الأداء والخدمة، دون تحديد بند معايير القبول ضمنها. يصعب إنفاذ التزام أداء لا يوجد له اختبار قبول قابل للقياس -- يستحق نظرة ثانية، بناءً على ما أفدتم به.',
  };
}

/**
 * Risk Allocation category flag. Risk allocation is where the FIDIC book
 * choice (Module 05) directly maps to who carries design risk -- the
 * differentiator between Red/Yellow/Silver Book. If one of those three
 * design-risk-defining books is selected but the design-risk subclause
 * itself isn't checked as addressed, that is a real, checkable gap.
 */
export function checkRiskAllocationFidicMismatchFlag(
  clausesPresent: ClausesPresent | undefined,
  fidicBook: string | undefined,
): ClauseFlagCheck {
  const designRiskDefiningBooks = ['red', 'yellow', 'silver'];
  if (!fidicBook || !designRiskDefiningBooks.includes(fidicBook)) return notFlagged;

  const hasDesignRiskSubclause = (clausesPresent?.['risk-allocation'] ?? []).includes('allocation-of-design-risk');
  if (hasDesignRiskSubclause) return notFlagged;

  return {
    flagged: true,
    reasonEn: 'A FIDIC design-risk-defining book (Red/Yellow/Silver) is selected, but the Allocation of Design Risk subclause is not checked as addressed. Who carries design risk is THE differentiator between these three books -- worth confirming it is actually documented and matches the selected book, based on what you told us.',
    reasonAr: 'تم اختيار كتاب من كتب FIDIC التي تحدد مخاطر التصميم (الأحمر / الأصفر / الفضي)، دون تحديد بند توزيع مخاطر التصميم كبند تم تناوله. تحديد الجهة التي تتحمل مخاطر التصميم هو العامل الفاصل بين هذه الكتب الثلاثة -- يستحق التأكد من توثيقه فعلياً وتطابقه مع الكتاب المختار، بناءً على ما أفدتم به.',
  };
}

/**
 * Data, IP & Confidentiality category flag. An IP-ownership clause silent
 * on foreground IP (work product created during the engagement, distinct
 * from background IP each party brought in) is the single most common gap
 * this category has -- most common in Professional Services (Module 05)
 * specifically, but not restricted to it.
 */
export function checkForegroundIPGapFlag(
  clausesPresent: ClausesPresent | undefined,
  industryBucket: string | undefined,
): ClauseFlagCheck {
  const entries = clausesPresent?.['data-ip-confidentiality'] ?? [];
  const hasBackground = entries.includes('ip-ownership-background');
  const hasForeground = entries.includes('ip-ownership-foreground');
  if (!hasBackground || hasForeground) return notFlagged;

  const psNote = industryBucket === 'professional-services'
    ? ' This is the single most common IP-clause gap in Professional Services contracts specifically (Module 05).'
    : '';
  const psNoteAr = industryBucket === 'professional-services'
    ? ' وهذه أكثر فجوة شائعة في بنود الملكية الفكرية ضمن عقود الخدمات المهنية تحديداً (الوحدة 05).'
    : '';

  return {
    flagged: true,
    reasonEn: `Background IP ownership is checked, but Foreground IP (work product created during the engagement) is not.${psNote} Worth a second look, based on what you told us.`,
    reasonAr: `تم تحديد بند ملكية الملكية الفكرية السابقة، دون تحديد بند الملكية الفكرية الناتجة (نتاج العمل الذي نشأ أثناء التنفيذ).${psNoteAr} يستحق نظرة ثانية، بناءً على ما أفدتم به.`,
  };
}

/**
 * Legal/Governance category flag -- item 33's corrected framing. The
 * dominant Saudi enforcement risk for an arbitral award is NOT seat/
 * institution choice (Saudi Arabia is a New York Convention Contracting
 * State since 1994, albeit with a reciprocity reservation); it is Saudi
 * courts' public-policy Sharia-compliance review of the award's substance
 * -- awards granting interest (riba) are generally unenforceable. So the
 * checkable pattern here is the same combination Commercial/Payment
 * flags (interest clause) co-occurring with a dispute-resolution
 * subclause on a Saudi-touching contract, viewed from the enforcement
 * angle rather than the drafting-quality angle.
 */
export function checkGovernanceRibaArbitrationFlag(
  clausesPresent: ClausesPresent | undefined,
  counterpartyJurisdiction: string | undefined,
  performanceLocation: string | undefined,
  governingLawClause: string | undefined,
): ClauseFlagCheck {
  const hasDisputeResolution = (clausesPresent?.['legal-governance'] ?? []).includes('dispute-resolution');
  if (!hasDisputeResolution) return notFlagged;

  const hasInterestClause = (clausesPresent?.['commercial-payment'] ?? []).includes('late-payment-interest-penalty');
  if (!hasInterestClause) return notFlagged;

  if (!isSaudiTouching(governingLawClause, counterpartyJurisdiction, performanceLocation)) return notFlagged;

  return {
    flagged: true,
    reasonEn: 'Dispute Resolution and a late-payment interest subclause are both checked on a Saudi-touching contract. Saudi courts apply a public-policy Sharia review to an award\'s substance -- awards granting interest (riba) are generally unenforceable, regardless of a validly chosen seat. This is a real, sourced enforcement-risk pattern (item 33), distinct from the seat/institution itself -- worth a second look.',
    reasonAr: 'تم تحديد بند تسوية المنازعات وبند فائدة التأخر في السداد معاً في عقد ذي صلة بالسعودية. تُخضِع المحاكم السعودية جوهر الحكم لمراجعة النظام العام الشرعية -- والأحكام التي تمنح فائدة (ربا) غير قابلة للإنفاذ عموماً، بصرف النظر عن صحة اختيار مقر التحكيم. هذا نمط حقيقي وموثق لمخاطر الإنفاذ (البند 33)، مختلف عن مسألة المقر/المؤسسة نفسها -- يستحق نظرة ثانية.',
  };
}

/**
 * Commercial/Payment category flag, GCC/Jordan wave (item 25, 29 Aug 2026).
 * The five tracks below are NOT governed by Saudi's riba treatment -- each
 * has its own Commercial Code / Law of Commerce provision that makes
 * commercial interest legally chargeable and enforceable, subject to a
 * jurisdiction-specific statutory rate ceiling (sourced, not assumed):
 * UAE (Federal Decree-Law No. 50/2022, Art. 72 -- 9% p.a. cap), Jordan
 * (Code of Civil Procedure Art. 167 -- 9% p.a. cap on delay interest),
 * Kuwait (Commercial Code Art. 102 -- 7% default legal rate), Bahrain (Law
 * of Commerce Art. 76 -- BMA-set or agreed rate, plus a separate cap so
 * total interest cannot exceed principal on debts running over 7 years),
 * Oman (Commercial Code Art. 80 -- market rate, consistently upheld by
 * courts). This function does NOT claim to verify the contract's actual
 * stated rate against these caps -- `clausesPresent` only captures whether
 * an interest clause topic is checked, not its numeric rate (no rate field
 * exists in the contract model today). The honest, buildable-today flag is
 * an informational advisory: the clause is enforceable here (unlike
 * Saudi), but the client should confirm their own stated rate sits within
 * the track's statutory ceiling. A future T2 (capturing the actual rate
 * and comparing it automatically) is a real, separate, larger build, not
 * this one. UAE DIFC/ADGM (a common-law free-zone track, not Sharia-
 * sensitive in the same way) is deliberately excluded -- not researched
 * this pass, so not asserted here.
 */
const GCC_JORDAN_INTEREST_PERMITTED_TRACKS: Record<string, { capEn: string; capAr: string }> = {
  'uae-ctl': {
    capEn: 'UAE Commercial Transactions Law (Federal Decree-Law No. 50/2022, Art. 72) caps commercial interest at 9% per annum.',
    capAr: 'يحدد قانون المعاملات التجارية الإماراتي (المرسوم بقانون اتحادي رقم 50 لسنة 2022، المادة 72) سقف الفائدة التجارية بنسبة 9% سنوياً.',
  },
  'bahrain-civil': {
    capEn: 'Bahrain’s Law of Commerce (Art. 76) permits interest at a Bahrain Monetary Agency-set or agreed rate, with total interest capped at the principal amount for debts running over 7 years.',
    capAr: 'يسمح قانون التجارة البحريني (المادة 76) بالفائدة بالمعدل الذي تحدده مؤسسة نقد البحرين أو المتفق عليه، مع سقف إجمالي للفائدة لا يتجاوز أصل الدين للديون التي تمتد لأكثر من 7 سنوات.',
  },
  'oman-civil': {
    capEn: 'Oman’s Commercial Code (Art. 80) entitles a creditor to interest on a commercial loan or debt at the applicable market rate, consistently upheld by Omani courts.',
    capAr: 'يمنح قانون التجارة العماني (المادة 80) الدائن حق الحصول على فائدة على القرض أو الدين التجاري بالمعدل السوقي المعمول به، وقد أقرّت المحاكم العمانية ذلك باستمرار.',
  },
  'kuwait-civil': {
    capEn: 'Kuwait’s Commercial Code (Art. 102) entitles a creditor to commercial-loan interest, defaulting to a 7% legal rate if no rate is stated in the contract.',
    capAr: 'يمنح قانون التجارة الكويتي (المادة 102) الدائن حق الحصول على فائدة القرض التجاري، وتُطبَّق نسبة قانونية افتراضية 7% في حال عدم تحديد المعدل في العقد.',
  },
  'jordan-civil': {
    capEn: 'Jordan’s Code of Civil Procedure (Art. 167) caps delay interest on commercial debts at 9% per annum; the Commercial Code (Art. 88) imposes legal interest for payment delay.',
    capAr: 'يحدد قانون أصول المحاكمات المدنية الأردني (المادة 167) سقف فائدة التأخير على الديون التجارية بنسبة 9% سنوياً؛ ويفرض القانون التجاري (المادة 88) فائدة قانونية عن التأخر في السداد.',
  },
};

export function checkGccJordanInterestPermittedFlag(
  clausesPresent: ClausesPresent | undefined,
  governingLawClause: string | undefined,
): ClauseFlagCheck {
  if (!governingLawClause || !(governingLawClause in GCC_JORDAN_INTEREST_PERMITTED_TRACKS)) return notFlagged;

  const hasInterestClause = (clausesPresent?.['commercial-payment'] ?? []).includes('late-payment-interest-penalty');
  if (!hasInterestClause) return notFlagged;

  const track = GCC_JORDAN_INTEREST_PERMITTED_TRACKS[governingLawClause];
  return {
    flagged: true,
    reasonEn: `A late-payment interest/penalty subclause is checked on a contract governed by this track. Unlike Saudi law, this jurisdiction’s Commercial Code makes commercial interest legally chargeable and enforceable -- ${track.capEn} This is an informational advisory, not a compliance risk: confirm the contract’s stated rate sits within the statutory ceiling above (the platform does not yet capture or verify the numeric rate itself).`,
    reasonAr: `تم تحديد بند فائدة/غرامة التأخر في السداد في عقد يخضع لهذا المسار القانوني. وخلافاً للنظام السعودي، يجعل القانون التجاري لهذه الجهة الفائدة التجارية قابلة للفرض والإنفاذ قانونياً -- ${track.capAr} هذا تنبيه معلوماتي وليس مخاطرة امتثال: يُرجى التأكد من أن المعدل المذكور في العقد يقع ضمن السقف القانوني أعلاه (لا تلتقط المنصة أو تتحقق بعد من المعدل الرقمي نفسه).`,
  };
}

/**
 * Commercial/Payment category flag, Qatar (item 25, 29 Aug 2026). Qatar's
 * Civil Code (Art. 568) is structurally different from the other five GCC/
 * Jordan tracks above: a loan contract's interest/remuneration term is
 * VOID by default (though the rest of the contract survives) unless the
 * lender is a licensed financial institution (Qatar Central Bank Law,
 * Art. 110). This is a real enforceability risk pattern, closer in kind to
 * the existing Saudi riba flag than to the other five tracks' blanket
 * commercial carve-out -- flagged as "worth a second look", not merely
 * informational.
 */
export function checkQatarInterestLenderFlag(
  clausesPresent: ClausesPresent | undefined,
  governingLawClause: string | undefined,
): ClauseFlagCheck {
  if (governingLawClause !== 'qatar-civil') return notFlagged;

  const hasInterestClause = (clausesPresent?.['commercial-payment'] ?? []).includes('late-payment-interest-penalty');
  if (!hasInterestClause) return notFlagged;

  return {
    flagged: true,
    reasonEn: 'A late-payment interest/penalty subclause is checked on a Qatar-governed contract. Under Qatar’s Civil Code (Art. 568), a loan contract’s interest term is void by default -- the rest of the contract survives, but the interest itself is unenforceable -- unless the lender is a licensed financial institution (Qatar Central Bank Law, Art. 110). Worth confirming the lending counterparty’s status, based on what you told us.',
    reasonAr: 'تم تحديد بند فائدة/غرامة التأخر في السداد في عقد يخضع للقانون القطري. بموجب القانون المدني القطري (المادة 568)، يُعتبر بند الفائدة في عقد القرض باطلاً افتراضياً -- ويبقى العقد نافذاً فيما عدا ذلك، لكن الفائدة نفسها غير قابلة للإنفاذ -- ما لم يكن المُقرض مؤسسة مالية مرخصة (قانون مصرف قطر المركزي، المادة 110). يستحق التأكد من صفة الطرف المُقرض، بناءً على ما أفدتم به.',
  };
}

/**
 * Risk Allocation category flags, governing-law-aware (#399 Piece A, 30 Aug
 * 2026 -- scoped and built same day per owner green-light, following
 * clause-governing-law-harmonization-338-scoping-draft.md). The same
 * liquidated-damages or force-majeure clause text carries a materially
 * different real-world legal effect depending on the contract's governing
 * law, and until this pass the platform said nothing about it either way.
 *
 * Scoped strictly to the tracks this pass actually sourced -- not extended
 * to every nominally "civil-law" or "common-law" track without dedicated
 * research (Decision Record 8.7, same discipline as the Qatar-specific
 * interest flag above rather than lumping it into the blanket GCC/Jordan
 * set).
 *
 * Civil-law, codified-obligations tradition (courts retain a mandatory,
 * non-waivable power to reduce an excessive liquidated-damages figure; the
 * civil code itself supplies a force-majeure default even with no clause):
 * Saudi (both tracks), UAE, Egypt, Jordan -- sourced to the UAE's new Civil
 * Transactions Law, Federal Decree-Law No. 25/2025, Article 340 (replacing
 * Article 390, effective 1 Jun 2026), and the same codified-obligations
 * family for the other three.
 *
 * Common law, contract-freedom tradition (an agreed damages figure is
 * enforced largely as written; no general force-majeure doctrine exists
 * absent an express clause): UK common law, UK SGA, US UCC -- sourced to
 * the UK Supreme Court's 2015 Cavendish Square Holding BV v Makdessi
 * decision.
 */
const LD_CIVIL_LAW_JUDICIAL_REDUCTION_TRACKS = new Set([
  'saudi-ctl', 'saudi-gtpl', 'uae-ctl', 'egypt-civil', 'jordan-civil',
]);
const LD_COMMON_LAW_CONTRACT_FREEDOM_TRACKS = new Set([
  'uk-common-law', 'uk-sga', 'us-ucc',
]);

export function checkLiquidatedDamagesGovLawFlag(
  clausesPresent: ClausesPresent | undefined,
  governingLawClause: string | undefined,
): ClauseFlagCheck {
  if (!governingLawClause) return notFlagged;
  const hasLdClause = (clausesPresent?.['risk-allocation'] ?? []).includes('liquidated-damages-delay-penalties');
  if (!hasLdClause) return notFlagged;

  if (LD_CIVIL_LAW_JUDICIAL_REDUCTION_TRACKS.has(governingLawClause)) {
    return {
      flagged: true,
      reasonEn: 'A liquidated-damages/delay-penalty subclause is checked on a contract governed by this track. Civil-law jurisdictions in this codified-obligations tradition give courts a mandatory, non-waivable power to reduce an agreed sum if the paying party proves it is excessive relative to actual harm -- parties cannot contract out of this by agreement alone. The UAE’s Civil Transactions Law (Federal Decree-Law No. 25/2025, Article 340, replacing the prior Article 390, effective 1 Jun 2026) codifies this explicitly, and Saudi, Egyptian, and Jordanian law follow the same tradition. This is an informational advisory, not a certainty of reduction -- worth knowing the agreed figure is not automatically the final word, based on what you told us.',
      reasonAr: 'تم تحديد بند التعويض المقطوع/غرامات التأخير في عقد يخضع لهذا المسار القانوني. تمنح الأنظمة القانونية المدنية ضمن هذا التقليد المقنّن المحاكم سلطة إلزامية وغير قابلة للتنازل عنها لخفض المبلغ المتفق عليه إذا أثبت الطرف الملزم بالدفع أنه مبالغ فيه مقارنة بالضرر الفعلي -- ولا يمكن للأطراف استبعاد هذا الحكم بالاتفاق فقط. يُقنّن قانون المعاملات المدنية الإماراتي (المرسوم بقانون اتحادي رقم 25 لسنة 2025، المادة 340، التي حلت محل المادة 390 سابقاً، سارية اعتباراً من 1 يونيو 2026) هذا الحكم صراحةً، وتتبع الأنظمة السعودية والمصرية والأردنية التقليد ذاته. هذا تنبيه معلوماتي وليس يقيناً بالخفض -- يستحق معرفة أن المبلغ المتفق عليه ليس بالضرورة الكلمة الأخيرة، بناءً على ما أفدتم به.',
    };
  }
  if (LD_COMMON_LAW_CONTRACT_FREEDOM_TRACKS.has(governingLawClause)) {
    return {
      flagged: true,
      reasonEn: 'A liquidated-damages/delay-penalty subclause is checked on a contract governed by this track. Common-law jurisdictions take a contract-freedom-respecting approach: since the UK Supreme Court’s 2015 Cavendish Square Holding BV v Makdessi decision, an agreed damages figure is generally enforced as written unless it is "out of all proportion to the innocent party’s legitimate interest" in enforcement -- a materially higher bar to disturb the clause than in civil-law jurisdictions. This is an informational advisory: the agreed figure is more likely to be enforced as stated here, based on what you told us.',
      reasonAr: 'تم تحديد بند التعويض المقطوع/غرامات التأخير في عقد يخضع لهذا المسار القانوني. تتبنى الأنظمة القانونية العامة (الكومن لو) نهجاً يحترم حرية التعاقد: منذ قرار المحكمة العليا البريطانية لعام 2015 في قضية Cavendish Square Holding BV v Makdessi، يُنفذ مبلغ التعويض المتفق عليه عادةً كما ورد ما لم يكن "غير متناسب إطلاقاً مع المصلحة المشروعة" للطرف المتضرر في الإنفاذ -- وهو معيار أعلى بكثير لإسقاط البند مقارنة بالأنظمة المدنية. هذا تنبيه معلوماتي: من المرجّح أن يُنفذ المبلغ المتفق عليه كما ورد هنا، بناءً على ما أفدتم به.',
    };
  }
  return notFlagged;
}

export function checkForceMajeureStatutoryDefaultFlag(
  clausesPresent: ClausesPresent | undefined,
  governingLawClause: string | undefined,
): ClauseFlagCheck {
  if (!governingLawClause) return notFlagged;
  const categoryEntries = clausesPresent?.['risk-allocation'] ?? [];
  if (categoryEntries.length === 0) return notFlagged;
  if (categoryEntries.includes('force-majeure')) return notFlagged;

  if (LD_CIVIL_LAW_JUDICIAL_REDUCTION_TRACKS.has(governingLawClause)) {
    return {
      flagged: true,
      reasonEn: 'Force Majeure is not among the Risk Allocation subclauses checked on a contract governed by this track. Civil-law jurisdictions in this tradition write force majeure into the civil code itself as a default rule that can excuse non-performance even with no clause in the contract at all -- so this is lower urgency than in a common-law jurisdiction, but the statutory default’s scope is typically narrower and less predictable than a bespoke clause the parties actually negotiated. Worth adding an explicit clause rather than relying on the default, based on what you told us.',
      reasonAr: 'بند القوة القاهرة غير مدرج ضمن بنود توزيع المخاطر المحددة في عقد يخضع لهذا المسار القانوني. تُدرج الأنظمة القانونية المدنية ضمن هذا التقليد القوة القاهرة في صلب القانون المدني نفسه كقاعدة افتراضية يمكن أن تُعفي من عدم التنفيذ حتى دون وجود بند في العقد على الإطلاق -- لذا فإن هذا الأمر أقل إلحاحاً منه في الأنظمة القانونية العامة، إلا أن نطاق القاعدة القانونية الافتراضية عادةً ما يكون أضيق وأقل قابلية للتنبؤ من بند مخصص اتفق عليه الطرفان فعلياً. يستحق إضافة بند صريح بدلاً من الاعتماد على القاعدة الافتراضية، بناءً على ما أفدتم به.',
    };
  }
  if (LD_COMMON_LAW_CONTRACT_FREEDOM_TRACKS.has(governingLawClause)) {
    return {
      flagged: true,
      reasonEn: 'Force Majeure is not among the Risk Allocation subclauses checked on a contract governed by this track. Common-law jurisdictions have no general force-majeure doctrine -- courts will not imply one, and protection exists only to the extent the contract expressly grants it (narrower fallback doctrines like frustration or impossibility exist but are harder to invoke). With no clause present, this contract currently has no force-majeure protection at all under this governing law -- worth a second look, based on what you told us.',
      reasonAr: 'بند القوة القاهرة غير مدرج ضمن بنود توزيع المخاطر المحددة في عقد يخضع لهذا المسار القانوني. لا تعرف الأنظمة القانونية العامة مبدأً عاماً للقوة القاهرة -- فلن تفترضه المحاكم ضمناً، ولا تنشأ الحماية إلا بقدر ما يمنحه العقد صراحةً (توجد مبادئ احتياطية أضيق مثل الإحباط أو الاستحالة، لكنها أصعب في الاحتجاج). مع غياب البند، لا يتمتع هذا العقد حالياً بأي حماية من القوة القاهرة على الإطلاق بموجب هذا القانون الحاكم -- يستحق نظرة ثانية، بناءً على ما أفدتم به.',
    };
  }
  return notFlagged;
}
