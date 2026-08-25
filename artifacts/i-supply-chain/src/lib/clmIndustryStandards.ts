/**
 * clmIndustryStandards.ts
 *
 * Module 05 (Contract Intelligence v10, Industry-Specific SOW Framework &
 * Body-of-Knowledge Selection) -- the 5 industry buckets, their sub-track
 * selectors (FIDIC book for Construction, engineering-vs-broader for
 * Professional Services, transport mode for Logistics), and a resolver that
 * looks up which real, sourced standard/body-of-knowledge applies to a given
 * contract.
 *
 * Standing rule carried unchanged from the module doc: government
 * (`counterpartyType === 'government'`) and private-to-private tracks are
 * two fully separate, parallel tracks -- never blended. The government
 * track (VII-A.1) is four fixed, sourced-but-not-independently-verified
 * MOF/Etimad categories with no FIDIC/ISO/IACCM sub-selection; only the
 * private track (VII-A.2) uses the FIDIC/ISO/IACCM/logistics-convention
 * selectors below. This module is a reference-lookup, not a misuse-flag --
 * unlike Modules 01 and 04, the doc defines no misuse pattern here, so none
 * is invented.
 */

export type IndustryBucket =
  | 'supply-goods' | 'construction' | 'om' | 'professional-services' | 'logistics' | '';

export interface IndustryBucketMeta { id: IndustryBucket; label: string; labelAr: string; }

export const INDUSTRY_BUCKETS: IndustryBucketMeta[] = [
  { id: 'supply-goods', label: 'Supply / Goods', labelAr: 'التوريد / البضائع' },
  { id: 'construction', label: 'Construction & Infrastructure', labelAr: 'الإنشاءات والبنية التحتية' },
  { id: 'om', label: 'Operations & Maintenance', labelAr: 'التشغيل والصيانة' },
  { id: 'professional-services', label: 'Professional / Technical Services', labelAr: 'الخدمات المهنية / الفنية' },
  { id: 'logistics', label: 'Logistics & Transportation', labelAr: 'اللوجستيات والنقل' },
];

export type FidicBook =
  | 'red' | 'yellow' | 'silver' | 'green' | 'gold' | 'blue-green' | 'emerald' | 'other' | '';

export interface FidicBookMeta { id: FidicBook; label: string; labelAr: string; applicabilityEn: string; applicabilityAr: string; }

export const FIDIC_BOOKS: FidicBookMeta[] = [
  { id: 'red', label: 'Red Book (Construction)', labelAr: 'الكتاب الأحمر (الإنشاءات)',
    applicabilityEn: 'Employer designs, contractor builds only; employer carries design risk.',
    applicabilityAr: 'صاحب العمل يصمم، والمقاول ينفذ فقط؛ يتحمل صاحب العمل مخاطر التصميم.' },
  { id: 'yellow', label: 'Yellow Book (Plant & Design-Build)', labelAr: 'الكتاب الأصفر (المعدات والتصميم والبناء)',
    applicabilityEn: 'Contractor designs and builds, especially electro-mechanical plant (e.g. pumping stations, water treatment).',
    applicabilityAr: 'المقاول يصمم وينفذ، خاصة المنشآت الكهروميكانيكية (مثل محطات الضخ ومعالجة المياه).' },
  { id: 'silver', label: 'Silver Book (EPC/Turnkey)', labelAr: 'الكتاب الفضي (EPC / تسليم مفتاح)',
    applicabilityEn: "Employer wants lump-sum price certainty; contractor takes on most risk including accuracy of the employer's own requirements -- highest contractor risk of the main three.",
    applicabilityAr: 'صاحب العمل يريد يقيناً في السعر الإجمالي؛ يتحمل المقاول معظم المخاطر، بما في ذلك دقة متطلبات صاحب العمل نفسه -- أعلى مخاطر على المقاول من بين الكتب الثلاثة الرئيسية.' },
  { id: 'green', label: 'Green Book (Short Form)', labelAr: 'الكتاب الأخضر (الصيغة المختصرة)',
    applicabilityEn: 'Small/simple/repetitive-work test first, not a hard budget ceiling -- 2021 edition confirmed real use above USD 10M and beyond 2 years; the "under $500K / 6 months" figure is the original 1999 guidance, not current practice.',
    applicabilityAr: 'اختبار قائم على البساطة/الأعمال المتكررة أولاً وليس سقفاً مالياً صارماً -- أكدت نسخة 2021 استخداماً حقيقياً لمشاريع تتجاوز 10 ملايين دولار وأكثر من عامين؛ رقم "أقل من 500 ألف دولار / 6 أشهر" هو الإرشاد الأصلي لعام 1999 وليس الممارسة الحالية.' },
  { id: 'gold', label: 'Gold Book (Design, Build and Operate)', labelAr: 'الكتاب الذهبي (التصميم والبناء والتشغيل)',
    applicabilityEn: 'One contract spanning construction AND long-term operation (~20-year horizon). Governs combined DBO delivery specifically -- a standalone O&M-only contract uses ISO 41001 instead.',
    applicabilityAr: 'عقد واحد يشمل الإنشاء والتشغيل طويل الأمد (أفق ~20 عاماً). يحكم تسليم DBO المدمج تحديداً -- أما عقد التشغيل والصيانة القائم بذاته فيستخدم ISO 41001 بدلاً منه.' },
  { id: 'blue-green', label: 'Blue-Green Book (Dredging & Reclamation)', labelAr: 'الكتاب الأزرق-الأخضر (الجرف والاستصلاح)',
    applicabilityEn: 'Specialized marine construction: dredging and land reclamation, with contractor extension-of-time tied to increased dredging quantities.',
    applicabilityAr: 'إنشاءات بحرية متخصصة: الجرف واستصلاح الأراضي، مع ربط تمديد المدة للمقاول بزيادة كميات الجرف.' },
  { id: 'emerald', label: 'Emerald Book (Underground Works)', labelAr: 'الكتاب الزمردي (الأعمال تحت الأرض)',
    applicabilityEn: 'FIDIC/International Tunnelling Association joint venture (1st ed. 2019) for tunnelling/underground/sub-surface works; requires a Geotechnical Baseline Report.',
    applicabilityAr: 'مشروع مشترك بين FIDIC والرابطة الدولية للأنفاق (الطبعة الأولى 2019) لأعمال الأنفاق والأعمال تحت الأرض؛ يتطلب تقرير خط الأساس الجيوتقني.' },
  { id: 'other', label: 'Other / not specified', labelAr: 'أخرى / غير محدد',
    applicabilityEn: '', applicabilityAr: '' },
];

export type ProfessionalServicesTrack = 'engineering-consultancy' | 'broader-professional' | '';

export const PROFESSIONAL_SERVICES_TRACKS: { id: ProfessionalServicesTrack; label: string; labelAr: string }[] = [
  { id: 'engineering-consultancy', label: 'Engineering / Technical Consultancy', labelAr: 'استشارات هندسية / فنية' },
  { id: 'broader-professional', label: 'Broader Professional Services (IT, general consulting, facility services)', labelAr: 'خدمات مهنية أوسع (تقنية المعلومات، استشارات عامة، خدمات المرافق)' },
];

export type LogisticsMode = 'road' | 'sea' | 'air' | 'rail' | 'multimodal' | '';

export const LOGISTICS_MODES: { id: LogisticsMode; label: string; labelAr: string }[] = [
  { id: 'road', label: 'Road', labelAr: 'بري' },
  { id: 'sea', label: 'Sea / Maritime', labelAr: 'بحري' },
  { id: 'air', label: 'Air', labelAr: 'جوي' },
  { id: 'rail', label: 'Rail', labelAr: 'سكك حديدية' },
  { id: 'multimodal', label: 'Multimodal / Freight Forwarding', labelAr: 'متعدد الوسائط / الشحن' },
];

export interface ApplicableStandardResult {
  standardEn: string;
  standardAr: string;
  noteEn?: string;
  noteAr?: string;
}

/**
 * Resolves which real, sourced standard/body-of-knowledge applies, honoring
 * the "never mix government and private" rule. Returns undefined when there
 * isn't enough information yet (no fabricated defaults) or when the sourced
 * material genuinely doesn't cover the combination (e.g. Logistics under
 * the government track's four fixed VII-A.1 categories, which predate the
 * 5th bucket and were never extended to cover it in the source doc).
 */
export function resolveApplicableStandard(
  counterpartyType: 'government' | 'private' | undefined,
  industryBucket: IndustryBucket | undefined,
  fidicBook: FidicBook | undefined,
  professionalServicesTrack: ProfessionalServicesTrack | undefined,
  logisticsMode: LogisticsMode | undefined,
): ApplicableStandardResult | undefined {
  if (!industryBucket) return undefined;

  if (counterpartyType === 'government') {
    switch (industryBucket) {
      case 'supply-goods':
        return { standardEn: 'General Supply Contract (MOF/Etimad)', standardAr: 'عقد التوريد العام (وزارة المالية / اعتماد)',
          noteEn: 'Payment due within 30 days of invoice approval + performance certificate; delay penalty 1%/week capped at 6% of total value; warranty >=12 months. Third-party-sourced, not independently verified.',
          noteAr: 'يستحق الدفع خلال 30 يوماً من اعتماد الفاتورة + شهادة الأداء؛ غرامة تأخير 1% أسبوعياً بحد أقصى 6% من القيمة الإجمالية؛ ضمان لا يقل عن 12 شهراً. مصدره طرف ثالث، لم يتم التحقق منه بشكل مستقل.' };
      case 'construction':
        return { standardEn: 'General Construction Contract (MOF/Etimad)', standardAr: 'عقد الإنشاءات العام (وزارة المالية / اعتماد)',
          noteEn: 'Phased delivery, local-content compliance, subcontractor/licensing provisions, safety/engineering/environmental standards. Third-party-sourced, not independently verified.',
          noteAr: 'تسليم على مراحل، الامتثال للمحتوى المحلي، أحكام المقاولين من الباطن والتراخيص، معايير السلامة والهندسة والبيئة. مصدره طرف ثالث، لم يتم التحقق منه بشكل مستقل.' };
      case 'om':
        return { standardEn: 'Operations & Maintenance Contract (MOF/Etimad)', standardAr: 'عقد التشغيل والصيانة (وزارة المالية / اعتماد)',
          noteEn: 'O&M scope, maintenance intervals, emergency response, performance evaluation, penalties for non-performance. Third-party-sourced, not independently verified.',
          noteAr: 'نطاق التشغيل والصيانة، فترات الصيانة، الاستجابة للطوارئ، تقييم الأداء، غرامات عدم الأداء. مصدره طرف ثالث، لم يتم التحقق منه بشكل مستقل.' };
      case 'professional-services':
        return { standardEn: 'Services Contract (MOF/Etimad)', standardAr: 'عقد الخدمات (وزارة المالية / اعتماد)',
          noteEn: 'Consulting/technical support/urban cleaning/engineering supervision/IT; defined scope, qualification requirements, approval process, termination conditions. Third-party-sourced, not independently verified.',
          noteAr: 'استشارات/دعم فني/نظافة حضرية/إشراف هندسي/تقنية معلومات؛ نطاق محدد، متطلبات تأهيل، إجراءات اعتماد، شروط إنهاء. مصدره طرف ثالث، لم يتم التحقق منه بشكل مستقل.' };
      case 'logistics':
        return { standardEn: 'Not covered by the sourced government track', standardAr: 'غير مشمول في مسار القطاع الحكومي المصدر',
          noteEn: 'The four VII-A.1 government categories predate the Logistics & Transportation bucket and were not extended to cover it in the source material -- flagged as a real gap, not a fabricated category.',
          noteAr: 'الفئات الحكومية الأربع (VII-A.1) سابقة لإضافة قطاع اللوجستيات والنقل ولم يتم تمديدها لتغطيته في المصدر -- يُعرض هذا كفجوة حقيقية، وليس فئة مُختلقة.' };
    }
  }

  // Private track (VII-A.2), or counterpartyType not yet specified -- the
  // private track is the more detailed, generally-applicable default.
  switch (industryBucket) {
    case 'supply-goods':
      return { standardEn: 'Civil Transactions Law (CTL) + ICC Incoterms', standardAr: 'نظام المعاملات المدنية + قواعد إنكوترمز',
        noteEn: 'CTL is the substantive law for Saudi-touching contracts; CISG supplies formation rules only (Module 01). ICC Incoterms remain relevant for delivery/risk-transfer regardless of governing law.',
        noteAr: 'نظام المعاملات المدنية هو القانون الموضوعي للعقود ذات الصلة بالسعودية؛ توفر اتفاقية البيع الدولي (CISG) قواعد التكوين فقط (الوحدة 01). تظل قواعد إنكوترمز ذات صلة بالتسليم ونقل المخاطر بصرف النظر عن القانون الحاكم.' };
    case 'construction': {
      if (!fidicBook) {
        return { standardEn: 'FIDIC (book not yet selected)', standardAr: 'FIDIC (لم يتم اختيار الكتاب بعد)',
          noteEn: 'FIDIC confirmed dominant in Saudi/GCC private construction. Select a specific book above for its applicability guidance.',
          noteAr: 'تأكدت هيمنة FIDIC على الإنشاءات الخاصة في السعودية/دول الخليج. اختر كتاباً محدداً أعلاه للاطلاع على إرشادات انطباقه.' };
      }
      const book = FIDIC_BOOKS.find(b => b.id === fidicBook);
      if (!book || fidicBook === 'other') {
        return { standardEn: 'FIDIC (other/unspecified book)', standardAr: 'FIDIC (كتاب آخر / غير محدد)' };
      }
      return { standardEn: `FIDIC ${book.label}`, standardAr: `FIDIC ${book.labelAr}`, noteEn: book.applicabilityEn, noteAr: book.applicabilityAr };
    }
    case 'om':
      return { standardEn: 'ISO 41001 (+ ISO 41011 vocabulary, ISO 41012 sourcing guidance)', standardAr: 'ISO 41001 (+ مفردات ISO 41011، إرشادات التعاقد ISO 41012)',
        noteEn: 'For standalone O&M contracts. If O&M is bundled into one contract with construction (design-build-operate), use the FIDIC Gold Book instead.',
        noteAr: 'للعقود القائمة بذاتها للتشغيل والصيانة. إذا كان التشغيل والصيانة مدمجاً في عقد واحد مع الإنشاء (تصميم-بناء-تشغيل)، استخدم الكتاب الذهبي لـ FIDIC بدلاً من ذلك.' };
    case 'professional-services': {
      if (!professionalServicesTrack) {
        return { standardEn: 'Professional Services (track not yet selected)', standardAr: 'الخدمات المهنية (لم يتم اختيار المسار بعد)',
          noteEn: 'Select engineering/technical consultancy or broader professional services above.', noteAr: 'اختر استشارات هندسية/فنية أو خدمات مهنية أوسع أعلاه.' };
      }
      if (professionalServicesTrack === 'engineering-consultancy') {
        return { standardEn: 'FIDIC White Book (Client/Consultant Model Services Agreement, 5th Ed 2017)', standardAr: 'الكتاب الأبيض لـ FIDIC (اتفاقية الخدمات النموذجية بين العميل والاستشاري، الطبعة الخامسة 2017)',
          noteEn: 'A FIDIC product but a consultancy-services agreement, not a construction-execution document -- flagged for owner confirmation given the "FIDIC only for construction" instruction.',
          noteAr: 'منتج من FIDIC لكنه اتفاقية خدمات استشارية وليس وثيقة تنفيذ إنشائي -- يُعرض للتأكيد من المالك في ضوء توجيه "FIDIC للإنشاءات فقط".' };
      }
      return { standardEn: 'IACCM/WorldCC + ISO 9001', standardAr: 'IACCM/WorldCC + ISO 9001',
        noteEn: 'Reuses the two frameworks already live in CLM_SUB_SEGMENTS (Module 06) rather than inventing a new standard.',
        noteAr: 'يُعاد استخدام الإطارين المعتمدين بالفعل في CLM_SUB_SEGMENTS (الوحدة 06) بدلاً من ابتكار معيار جديد.' };
    }
    case 'logistics': {
      if (!logisticsMode) {
        return { standardEn: 'Logistics & Transportation (mode not yet selected)', standardAr: 'اللوجستيات والنقل (لم يتم اختيار الوسيلة بعد)',
          noteEn: 'Select a transport mode above for its liability-convention reference.', noteAr: 'اختر وسيلة النقل أعلاه للاطلاع على مرجع اتفاقية المسؤولية الخاصة بها.' };
      }
      switch (logisticsMode) {
        case 'road':
          return { standardEn: 'CMR Convention (Geneva, 1956)', standardAr: 'اتفاقية CMR (جنيف، 1956)',
            noteEn: "Quasi-strict carrier liability, capped at 8.33 SDR/kg gross weight. Saudi Arabia's CMR ratification status was NOT independently confirmed this pass -- do not represent as a CMR party without a dedicated verification pass.",
            noteAr: 'مسؤولية شبه صارمة على الناقل، بحد أقصى 8.33 وحدة حقوق سحب خاصة لكل كيلوغرام من الوزن الإجمالي. لم يتم التحقق بشكل مستقل من حالة انضمام السعودية لاتفاقية CMR في هذه الجولة -- لا تُمثَّل كطرف في الاتفاقية دون تحقق مخصص.' };
        case 'sea':
          return { standardEn: 'Hague-Visby Rules', standardAr: 'قواعد لاهاي-فيسبي',
            noteEn: 'Carrier liability capped at 666.67 SDR/package or 2 SDR/kg, whichever is higher (17 carrier defenses apply). Rotterdam Rules (2008) have NOT entered into force. BIMCO standard contracts (GENCON/BARECON/SUPPLYTIME/SHIPMAN/GUARDCON) apply for maritime charter/ship-management specifically. Saudi Hague-Visby ratification NOT independently confirmed.',
            noteAr: 'مسؤولية الناقل محددة بحد أقصى 666.67 وحدة حقوق سحب خاصة للطرد أو 2 وحدة لكل كيلوغرام أيهما أعلى (مع 17 دفاعاً متاحاً للناقل). لم تدخل قواعد روتردام (2008) حيز النفاذ بعد. تنطبق عقود BIMCO القياسية على مساحيق الإيجار البحري وإدارة السفن تحديداً. لم يتم التحقق بشكل مستقل من انضمام السعودية لقواعد لاهاي-فيسبي.' };
        case 'air':
          return { standardEn: 'Montreal Convention 1999', standardAr: 'اتفاقية مونتريال 1999',
            noteEn: 'Cargo liability cap 26 SDR/kg (effective 28 Dec 2024, up from 22). Saudi Arabia is a CONFIRMED ratifying party (primary source: ICAO), with a reservation against Article 14(1). The one logistics mode with independently confirmed Saudi adoption.',
            noteAr: 'حد مسؤولية الشحن 26 وحدة حقوق سحب خاصة لكل كيلوغرام (نافذ اعتباراً من 28 ديسمبر 2024، ارتفاعاً من 22). السعودية طرف مصادق مؤكد (المصدر الأساسي: منظمة الطيران المدني الدولي)، مع تحفظ على المادة 14(1). وسيلة النقل الوحيدة المؤكد انضمام السعودية إليها بشكل مستقل.' };
        case 'rail':
          return { standardEn: 'COTIF / CIM (Uniform Rules)', standardAr: 'COTIF / CIM (القواعد الموحدة)',
            noteEn: 'Governs international rail freight carrier/consignor rights and obligations.', noteAr: 'يحكم حقوق والتزامات الناقل والمرسل في الشحن الدولي بالسكك الحديدية.' };
        case 'multimodal':
          return { standardEn: 'FIATA Model Rules on Freight Forwarding Services + FBL', standardAr: 'قواعد FIATA النموذجية لخدمات الشحن + وثيقة FBL',
            noteEn: "The internationally recognized default for forwarder rights/obligations/liability, whether acting as agent or contractual carrier. Most national forwarder associations' Standard Trading Conditions build on this base.",
            noteAr: 'المرجع الافتراضي المعترف به دولياً لحقوق والتزامات ومسؤولية وكيل الشحن، سواء كان يعمل كوكيل أو كناقل تعاقدي. تُبنى معظم شروط التداول القياسية لجمعيات وكلاء الشحن الوطنية على هذا الأساس.' };
      }
    }
  }
  return undefined;
}
