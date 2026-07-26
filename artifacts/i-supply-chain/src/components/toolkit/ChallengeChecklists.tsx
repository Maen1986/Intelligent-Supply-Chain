/**
 * Challenge-specific checklists for all 12 SolutionDetail slugs.
 * ChallengeToolkitPanel renders the appropriate checklist + action tracker
 * inside each expanded challenge accordion item.
 */
import React, { useState } from 'react';
import { Wrench, ChevronDown, ChevronUp } from 'lucide-react';
import { ChecklistTool, ActionTracker, ChecklistItem } from './Primitives';

/** Map: slug → array-of-checklists (one per challenge, in order) */
const CHALLENGE_CHECKLISTS: Record<string, ChecklistItem[][]> = {
  'supply-chain-strategy': [
    /* 0 — Siloed planning */
    [
      { en: 'Audit current planning cycles: when does demand, supply, and finance each run?', ar: 'مراجعة دورات التخطيط الحالية: متى تُجرى كل من دورات الطلب والعرض والمالية؟' },
      { en: 'Identify the data gap preventing a single agreed demand signal', ar: 'تحديد فجوة البيانات التي تمنع إشارة طلب موحّدة ومتّفقاً عليها' },
      { en: 'Define an IBP monthly rhythm: demand review → supply review → exec review', ar: 'تحديد إيقاع IBP الشهري: مراجعة الطلب ← مراجعة العرض ← مراجعة تنفيذية' },
      { en: 'Assign a named process owner for each IBP meeting', ar: 'إسناد مالك عملية مسمّى لكل اجتماع IBP' },
      { en: 'Run a pilot IBP cycle for one product family before enterprise roll-out', ar: 'تجريب دورة IBP لعائلة منتج واحدة قبل التطوير على مستوى المؤسسة' },
    ],
    /* 1 — No SCOR baseline */
    [
      { en: 'Select 3–5 core SCOR Level-1 KPIs to baseline (POR, OTIF, C2C, Cost %)', ar: 'اختيار 3–5 مؤشرات SCOR المستوى الأول الأساسية للتقييم (POR, OTIF, C2C، التكلفة%)' },
      { en: 'Extract 12 months of data from ERP for each selected KPI', ar: 'استخراج بيانات 12 شهراً من ERP لكل مؤشر أداء مختار' },
      { en: 'Compare baseline against APICS GCC industry benchmarks', ar: 'مقارنة الخط الأساسي بالمعايير المرجعية لقطاعات الخليج من APICS' },
      { en: 'Document gaps and prioritise top 3 by impact-to-effort ratio', ar: 'توثيق الفجوات وترتيب أولوية أعلى 3 فجوات بنسبة الأثر إلى الجهد' },
    ],
    /* 2 — SC strategy disconnected */
    [
      { en: 'Schedule a 2-hour strategy alignment workshop with CEO/COO and CPO', ar: 'جدولة ورشة عمل لمواءمة الاستراتيجية لمدة ساعتين مع الرئيس التنفيذي/التشغيلي ورئيس المشتريات' },
      { en: 'Map each corporate objective to the supply chain capability it requires', ar: 'ربط كل هدف مؤسسي بقدرة سلسلة الإمداد المطلوبة' },
      { en: 'Identify the top 3 supply chain investments that unlock corporate growth', ar: 'تحديد أعلى 3 استثمارات في سلسلة الإمداد تُطلق النمو المؤسسي' },
      { en: 'Draft a 1-page supply chain strategy cascade visible to all teams', ar: 'صياغة تدرّج استراتيجية سلسلة الإمداد في صفحة واحدة مرئية لجميع الفرق' },
    ],
    /* 3 — Over-reliance on single supplier */
    [
      { en: 'Identify all categories with >60% spend at a single supplier', ar: 'تحديد جميع الفئات التي يتجاوز 60% من إنفاقها لمورّد واحد' },
      { en: 'Rank single-source categories by business-criticality', ar: 'ترتيب فئات المصدر الوحيد حسب الأهمية الحيوية للأعمال' },
      { en: 'Initiate qualification of a second source for the top 3 critical categories', ar: 'بدء تأهيل مصدر ثانٍ لأعلى 3 فئات حرجة' },
      { en: 'Add dual-source requirement to all new contracts above SAR 500K', ar: 'إضافة متطلب التوريد الثنائي لجميع العقود الجديدة التي تتجاوز 500 ألف ريال' },
    ],
    /* 4 — ERP data quality */
    [
      { en: 'Run a master data audit: suppliers, items, BOMs, lead times', ar: 'إجراء تدقيق للبيانات الرئيسية: المورّدون والأصناف وقوائم المواد ومهل التوريد' },
      { en: 'Score each data field: Complete / Accurate / Timely / Consistent', ar: 'تقييم كل حقل بيانات: مكتمل / دقيق / في الوقت المناسب / متسق' },
      { en: 'Assign a data owner for each critical master-data object', ar: 'تعيين مالك بيانات لكل كائن بيانات رئيسي حرج' },
      { en: 'Define data-entry standards and validation rules in ERP', ar: 'تحديد معايير إدخال البيانات وقواعد التحقّق في ERP' },
      { en: 'Set up a monthly data-quality scorecard dashboard', ar: 'إعداد لوحة متابعة شهرية لجودة البيانات' },
    ],
  ],
  'procurement-excellence': [
    /* 0 — No strategic sourcing */
    [
      { en: 'Map top 5 spend categories by annual value — confirm no active strategy exists', ar: 'رسم أعلى 5 فئات إنفاق بالقيمة السنوية — تأكيد عدم وجود استراتيجية نشطة' },
      { en: 'Assign a category manager to each top-5 category', ar: 'إسناد مدير فئة لكل فئة من أعلى 5 فئات' },
      { en: 'Run a market scan for each category: number of suppliers, price benchmarks', ar: 'إجراء مسح للسوق لكل فئة: عدد المورّدين، ومعايير الأسعار' },
      { en: 'Develop a Category Strategy 1-pager per category', ar: 'تطوير ملخّص استراتيجية فئة في صفحة واحدة لكل فئة' },
      { en: 'Launch RFQ for the highest-spend category first', ar: 'إطلاق RFQ للفئة الأعلى إنفاقاً أولاً' },
    ],
    /* 1 — Procurement = PO clerks */
    [
      { en: 'Document 3 recent examples of early procurement involvement delivering value', ar: 'توثيق 3 أمثلة حديثة على مشاركة مبكرة للمشتريات حقّقت قيمة' },
      { en: 'Request a slot in the next budget cycle meeting to present savings pipeline', ar: 'طلب وقت في اجتماع دورة الميزانية القادم لعرض خطّ الوفورات' },
      { en: 'Publish a monthly one-page "Procurement Impact" report to senior leadership', ar: 'نشر تقرير "أثر المشتريات" من صفحة واحدة شهرياً للقيادة العليا' },
      { en: 'Complete a CIPS capability benchmark for the team and share with HR/CPO', ar: 'إجراء قياس مرجعي لقدرات CIPS للفريق ومشاركته مع الموارد البشرية/رئيس المشتريات' },
    ],
    /* 2 — High maverick spend */
    [
      { en: 'Run a spend analysis: % of spend outside procurement process last 12 months', ar: 'إجراء تحليل إنفاق: نسبة الإنفاق خارج عملية المشتريات خلال 12 شهراً الأخيرة' },
      { en: 'Identify top 3 maverick spend categories and their business owners', ar: 'تحديد أعلى 3 فئات إنفاق خارج القنوات وأصحابها من الأعمال' },
      { en: 'Issue a communication: all purchases >SAR 5K must go through procurement', ar: 'إصدار تعميم: جميع المشتريات التي تتجاوز 5 آلاف ريال تمرّ عبر المشتريات' },
      { en: 'Activate a preferred-supplier catalogue for the top 10 repeat-buy categories', ar: 'تفعيل كتالوج مورّدين مفضّلين لأعلى 10 فئات شراء متكرّرة' },
      { en: 'Measure maverick spend monthly and report to leadership dashboard', ar: 'قياس الإنفاق خارج القنوات شهرياً والإبلاغ عنه في لوحة القيادة' },
    ],
    /* 3 — Supplier quality/OTIF failures */
    [
      { en: 'Pull OTIF data for all suppliers: identify bottom quartile performers', ar: 'استخراج بيانات OTIF لجميع المورّدين: تحديد أصحاب أدنى ربع في الأداء' },
      { en: 'Issue formal Corrective Action Request (CAR) to all suppliers with OTIF <80%', ar: 'إصدار طلب إجراء تصحيحي رسمي لجميع المورّدين الذين OTIF لديهم أقل من 80%' },
      { en: 'Implement monthly supplier scorecard with OTIF, quality, compliance dimensions', ar: 'تطبيق بطاقة تقييم شهرية للمورّدين تشمل OTIF والجودة والامتثال' },
      { en: 'Schedule quarterly business reviews (QBRs) for all strategic suppliers', ar: 'جدولة مراجعات أعمال ربع سنوية لجميع المورّدين الاستراتيجيين' },
    ],
    /* 4 — No TCO visibility */
    [
      { en: 'Select the top 5 spend categories for initial TCO modelling', ar: 'اختيار أعلى 5 فئات إنفاق للنمذجة الأولية للتكلفة الإجمالية للملكية' },
      { en: 'For each category, identify all cost elements beyond unit price', ar: 'لكل فئة، تحديد جميع عناصر التكلفة بما يتجاوز سعر الوحدة' },
      { en: 'Build a TCO spreadsheet template including: price, freight, quality, warranty, admin', ar: 'بناء قالب جدول بيانات للتكلفة الإجمالية يشمل: السعر والشحن والجودة والضمان والإدارة' },
      { en: 'Use TCO in next RFQ evaluation — compare total cost, not just unit price', ar: 'استخدام TCO في تقييم RFQ التالي — مقارنة التكلفة الإجمالية لا سعر الوحدة فقط' },
    ],
  ],
  'risk-management-solution': [
    /* 0 — Risk reactive */
    [
      { en: 'Define 5 Key Risk Indicators (KRIs) for your supply chain', ar: 'تحديد 5 مؤشرات مخاطر رئيسية (KRI) لسلسلة الإمداد' },
      { en: 'Set amber and red threshold values for each KRI', ar: 'تحديد قيم عتبة كهرمانية وحمراء لكل مؤشر مخاطر' },
      { en: 'Assign a KRI owner responsible for weekly monitoring', ar: 'تعيين مالك مؤشر مخاطر مسؤول عن المراقبة الأسبوعية' },
      { en: 'Add KRI review as a standing agenda item in weekly operations meeting', ar: 'إضافة مراجعة مؤشرات المخاطر كبند دائم في اجتماع العمليات الأسبوعي' },
      { en: 'Create a 1-page escalation protocol: who to notify when a KRI turns red', ar: 'إنشاء بروتوكول تصعيد من صفحة واحدة: من يُبلَّغ عند تحوّل مؤشر المخاطر إلى الأحمر' },
    ],
    /* 1 — No Tier-2 visibility */
    [
      { en: 'List your top 10 Tier-1 suppliers and ask each for their top 3 Tier-2 suppliers', ar: 'إدراج أعلى 10 مورّدين من المستوى الأول وطلب كل منهم تسمية أعلى 3 مورّدين من المستوى الثاني' },
      { en: 'Add Tier-2 disclosure requirement to all new Tier-1 contracts', ar: 'إضافة متطلب الإفصاح عن مورّدي المستوى الثاني لجميع عقود المستوى الأول الجديدة' },
      { en: 'Screen disclosed Tier-2 suppliers against geopolitical and financial risk databases', ar: 'فحص مورّدي المستوى الثاني المُفصَح عنهم مقابل قواعد بيانات المخاطر الجيوسياسية والمالية' },
      { en: 'Flag any Tier-2 in high-risk geographies (conflict zones, sanctions lists)', ar: 'وضع علامة على أي مورّد من المستوى الثاني في جغرافيات عالية الخطورة' },
    ],
    /* 2 — Risk register not managed */
    [
      { en: 'Print and review your current risk register — confirm all owners still active', ar: 'طباعة ومراجعة سجلّ المخاطر الحالي — تأكيد أن جميع المالكين لا يزالون نشطين' },
      { en: 'Schedule a 2-hour risk register review for next month', ar: 'جدولة مراجعة سجلّ المخاطر لمدة ساعتين خلال الشهر القادم' },
      { en: 'Update all risk scores: re-assess likelihood and impact for each risk', ar: 'تحديث جميع درجات المخاطر: إعادة تقييم الاحتمالية والأثر لكل مخاطرة' },
      { en: 'Add risk register review to quarterly management committee agenda', ar: 'إضافة مراجعة سجلّ المخاطر لجدول أعمال لجنة الإدارة الفصلية' },
      { en: 'Close all "overdue" mitigation actions or formally escalate them', ar: 'إغلاق جميع إجراءات التخفيف "المتأخرة" أو تصعيدها رسمياً' },
    ],
    /* 3 — Single-source dependency */
    [
      { en: 'Identify all sole-source items by spend value and business criticality', ar: 'تحديد جميع الأصناف أحادية المصدر بقيمة الإنفاق والأهمية الحيوية' },
      { en: 'For top 3 critical sole-source items: initiate emergency second-source qualification', ar: 'للأصناف الثلاثة الأكثر أهمية أحادية المصدر: بدء تأهيل طارئ للمصدر الثاني' },
      { en: 'Set a 90-day safety stock target for each critical sole-source item', ar: 'تحديد هدف مخزون أمان لمدة 90 يوماً لكل صنف حرج أحادي المصدر' },
      { en: 'Add sole-source risk to the risk register and assign a CPO-level owner', ar: 'إضافة مخاطر المصدر الوحيد إلى سجلّ المخاطر وتعيين مالك على مستوى رئيس المشتريات' },
    ],
    /* 4 — No formal BCP */
    [
      { en: 'Identify your top 3 supply chain disruption scenarios (supplier, logistics, regulatory)', ar: 'تحديد أعلى 3 سيناريوهات اضطراب في سلسلة الإمداد (مورّد، لوجستي، تنظيمي)' },
      { en: 'For each scenario: define the trigger, response owner, and first 24h actions', ar: 'لكل سيناريو: تحديد المحفّز ومالك الاستجابة وإجراءات الـ 24 ساعة الأولى' },
      { en: 'Identify alternate suppliers or logistics routes for each scenario', ar: 'تحديد موردين أو مسارات لوجستية بديلة لكل سيناريو' },
      { en: 'Document and sign off a 1-page BCP for each scenario', ar: 'توثيق واعتماد خطة استمرارية أعمال من صفحة واحدة لكل سيناريو' },
      { en: 'Schedule a tabletop exercise (4h) to test the BCP before it is needed', ar: 'جدولة تمرين مكتبي (4 ساعات) لاختبار خطة الاستمرارية قبل الحاجة إليها' },
    ],
  ],
  'lean-agile-supply-chain': [
    /* 0 — High lead times */
    [
      { en: 'Select the end-to-end process with the longest lead time for VSM', ar: 'اختيار العملية من طرف لطرف ذات أطول مهلة توريد لرسم VSM' },
      { en: 'Map current-state VSM: identify all NVA steps and wait times', ar: 'رسم VSM للحالة الحالية: تحديد جميع الخطوات غير المضيفة للقيمة وأوقات الانتظار' },
      { en: 'Calculate Process Cycle Efficiency (PCE = VA / total lead time)', ar: 'حساب كفاءة دورة العملية (PCE = وقت القيمة المضافة / إجمالي مهلة التوريد)' },
      { en: 'Run a Kaizen event on the single highest-impact NVA step', ar: 'تنظيم فعالية Kaizen على أعلى خطوة غير مضيفة للقيمة من حيث الأثر' },
      { en: 'Measure lead time weekly and post on a visual management board', ar: 'قياس مهلة التوريد أسبوعياً ونشرها على لوحة الإدارة المرئية' },
    ],
    /* 1 — Bullwhip / excess inventory + stockouts */
    [
      { en: 'Plot order-vs-demand history for 6 months: quantify the bullwhip amplification', ar: 'رسم سجلّ الطلب مقابل الطلب الفعلي لـ 6 أشهر: قياس تضخيم أثر السوط' },
      { en: 'Identify your replenishment "decoupling point" — where pull starts', ar: 'تحديد "نقطة الفصل" في إعادة التموين — حيث يبدأ نظام السحب' },
      { en: 'Pilot DDMRP buffers for your top 10 highest-variability SKUs', ar: 'تجربة مخزونات DDMRP لأعلى 10 أصناف في التباين' },
      { en: 'Run a weekly demand review with sales and supply — share single signal', ar: 'إجراء مراجعة طلب أسبوعية مع المبيعات والعرض — مشاركة إشارة موحّدة' },
    ],
    /* 2 — Siloed operations */
    [
      { en: 'Map the handover points between demand, supply, and manufacturing teams', ar: 'رسم نقاط التسليم بين فرق الطلب والعرض والتصنيع' },
      { en: 'Establish a weekly cross-functional execution review (30-min stand-up)', ar: 'إنشاء مراجعة تنفيذية متعددة الوظائف أسبوعية (اجتماع وقوف 30 دقيقة)' },
      { en: 'Define a single shared KPI each team is measured on (e.g. OTIF)', ar: 'تحديد مؤشر أداء مشترك واحد يُقاس به كل فريق (مثل OTIF)' },
      { en: 'Implement Agile S&OP: consensus demand → supply plan → financial reconciliation', ar: 'تطبيق S&OP رشيق: طلب توافقي ← خطة العرض ← التسوية المالية' },
    ],
    /* 3 — Hidden factory / rework */
    [
      { en: 'Count the hours spent on rework and workarounds last month', ar: 'حساب ساعات إعادة العمل والحلول البديلة خلال الشهر الماضي' },
      { en: 'Run a DMAIC project on the highest-frequency defect type', ar: 'تشغيل مشروع DMAIC على نوع العيب الأعلى تكراراً' },
      { en: 'Document the "correct" process in a Standard Operating Procedure', ar: 'توثيق العملية "الصحيحة" في إجراء تشغيل معياري' },
      { en: 'Add Poka-Yoke (error-proofing) to the step that generates most rework', ar: 'إضافة Poka-Yoke (التحقّق من الأخطاء) إلى الخطوة التي تولّد أكثر إعادة عمل' },
    ],
    /* 4 — Lean initiatives stall */
    [
      { en: 'Identify why the last initiative stalled: sponsor loss? resource? competing priorities?', ar: 'تحديد سبب توقّف المبادرة الأخيرة: فقدان الراعي؟ الموارد؟ الأولويات المتنافسة؟' },
      { en: 'Establish a Lean Steering Committee meeting monthly (exec-level sponsor)', ar: 'إنشاء لجنة توجيه Lean تجتمع شهرياً (راعٍ على مستوى تنفيذي)' },
      { en: 'Implement a daily 15-min "huddle" at team level: yesterday/today/blockers', ar: 'تطبيق "اجتماع وقوف" يومي لمدة 15 دقيقة على مستوى الفريق: الأمس/اليوم/العوائق' },
      { en: 'Run at least one Kaizen event per quarter — report results to leadership', ar: 'تنظيم فعالية Kaizen واحدة على الأقل كل ربع سنة — الإبلاغ عن النتائج للقيادة' },
      { en: 'Recognise and share each improvement success — build positive culture', ar: 'الاعتراف بكل نجاح في التحسين ومشاركته — بناء ثقافة إيجابية' },
    ],
  ],
  'sustainability-esg': [
    /* 0 — Scope 3 data inconsistent */
    [
      { en: 'Identify your top 10 suppliers by spend — request Scope 3 emissions data', ar: 'تحديد أعلى 10 مورّدين بالإنفاق — طلب بيانات انبعاثات النطاق الثالث' },
      { en: 'Use spend-based emission factors for interim estimates (DEFRA or GHG Protocol)', ar: 'استخدام معاملات انبعاثات مبنية على الإنفاق للتقديرات المؤقتة (DEFRA أو بروتوكول GHG)' },
      { en: 'Add Scope 3 data reporting requirement to all new supplier contracts', ar: 'إضافة متطلب الإبلاغ عن بيانات النطاق الثالث لجميع عقود المورّدين الجديدة' },
      { en: 'Set up a supplier portal or questionnaire for annual ESG data collection', ar: 'إعداد بوابة مورّدين أو استبيان لجمع بيانات ESG السنوية' },
      { en: 'Report Scope 3 progress quarterly to leadership alongside financial KPIs', ar: 'الإبلاغ عن تقدّم النطاق الثالث فصلياً للقيادة جنباً إلى جنب مع مؤشرات الأداء المالية' },
    ],
    /* 1 — ESG seen as cost-adding */
    [
      { en: 'Quantify the cost of one ESG-related incident (regulatory fine, reputation loss)', ar: 'تحديد تكلفة حادثة واحدة متعلقة بـ ESG (غرامة تنظيمية، فقدان سمعة)' },
      { en: 'Calculate green financing benefit: lower interest rate on ESG-linked facilities', ar: 'حساب ميزة التمويل الأخضر: انخفاض سعر الفائدة على التسهيلات المرتبطة بـ ESG' },
      { en: 'List 3 customers who require ESG credentials — quantify contract revenue at risk', ar: 'إدراج 3 عملاء يتطلّبون بيانات ESG — تحديد قيمة الإيراد التعاقدي المعرّض للخطر' },
      { en: 'Present an ESG ROI case to CFO: risk reduction + financing + contract retention', ar: 'تقديم دراسة جدوى ESG للمدير المالي: خفض المخاطر + التمويل + الاحتفاظ بالعقود' },
    ],
    /* 2 — Local content compliance */
    [
      { en: 'Calculate your current Iktva / local content score using official methodology', ar: 'حساب درجة Iktva / المحتوى المحلي الحالية باستخدام المنهجية الرسمية' },
      { en: 'Map which spend categories qualify as local content — identify gaps', ar: 'رسم فئات الإنفاق المؤهّلة كمحتوى محلي — تحديد الفجوات' },
      { en: 'Identify 3 locally-produced alternatives to your top imported categories', ar: 'تحديد 3 بدائل محلية الإنتاج لأعلى فئاتك المستوردة' },
      { en: 'Engage SIDF / Monsha\'at for local supplier development programme', ar: 'التعاون مع صندوق التنمية الصناعية / منشآت لبرنامج تطوير المورّدين المحليين' },
    ],
    /* 3 — Supplier ESG risk */
    [
      { en: 'Screen all strategic suppliers against ESG risk databases (Ecovadis, CDP)', ar: 'فحص جميع المورّدين الاستراتيجيين مقابل قواعد بيانات مخاطر ESG (Ecovadis، CDP)' },
      { en: 'Issue Supplier Code of Conduct with ESG minimum standards', ar: 'إصدار مدوّنة سلوك المورّدين بمعايير ESG الدنيا' },
      { en: 'Include ESG audit right-to-audit clause in all new contracts', ar: 'تضمين بند حق التدقيق في ESG في جميع العقود الجديدة' },
      { en: 'Plan first ESG supplier audit for top 5 strategic suppliers within 6 months', ar: 'التخطيط للتدقيق الأول على ESG لأعلى 5 مورّدين استراتيجيين خلال 6 أشهر' },
    ],
    /* 4 — Carbon reporting */
    [
      { en: 'Establish a GHG inventory baseline for Scope 1 and 2 emissions', ar: 'إنشاء خط أساس لمخزون الغازات الدفيئة لانبعاثات النطاق الأول والثاني' },
      { en: 'Set a science-based reduction target aligned to 1.5°C pathway (SBTi)', ar: 'تحديد هدف خفض قائم على العلم متوائم مع مسار 1.5 درجة (SBTi)' },
      { en: 'Identify the 3 highest-emission procurement categories for priority action', ar: 'تحديد أعلى 3 فئات مشتريات في الانبعاثات للإجراء ذي الأولوية' },
      { en: 'Report carbon progress alongside financial results in management reporting', ar: 'الإبلاغ عن تقدّم الكربون جانباً للنتائج المالية في التقارير الإدارية' },
    ],
  ],
  'digital-transformation': [
    /* 0 — ERP under-utilised */
    [
      { en: 'Audit which ERP modules are licensed vs actively used — calculate utilisation rate', ar: 'مراجعة وحدات ERP المرخّصة مقابل المستخدمة فعلياً — حساب معدّل الاستخدام' },
      { en: 'Identify the top 3 manual processes that ERP already supports but team ignores', ar: 'تحديد أعلى 3 عمليات يدوية يدعمها ERP بالفعل لكن الفريق لا يستخدمها' },
      { en: 'Run a 2h ERP capability walk-through with process owners', ar: 'إجراء جلسة استعراض قدرات ERP لمدة ساعتين مع أصحاب العمليات' },
      { en: 'Create an ERP adoption roadmap: 3-6-12 month milestones', ar: 'إنشاء خارطة طريق لتبنّي ERP: معالم 3-6-12 شهراً' },
    ],
    /* 1 — Process automation low */
    [
      { en: 'Map all manual steps in your procure-to-pay process — count handoffs', ar: 'رسم جميع الخطوات اليدوية في عملية الشراء حتى الدفع — حساب نقاط التسليم' },
      { en: 'Identify the 5 steps with highest volume × highest manual effort', ar: 'تحديد الـ 5 خطوات ذات الحجم الأعلى × الجهد اليدوي الأعلى' },
      { en: 'Score each for automation feasibility (ERP config, RPA, or AI)', ar: 'تقييم كل خطوة لجدوى الأتمتة (إعداد ERP، أو RPA، أو AI)' },
      { en: 'Automate the highest-impact step first — measure before/after cycle time', ar: 'أتمتة الخطوة الأعلى تأثيراً أولاً — قياس زمن الدورة قبل/بعد' },
      { en: 'Set a 12-month target: 60% of routine procurement steps automated', ar: 'تحديد هدف 12 شهراً: 60% من خطوات المشتريات الروتينية مؤتمتة' },
    ],
    /* 2 — Data accuracy poor */
    [
      { en: 'Run a master data completeness check: % of required fields populated', ar: 'إجراء فحص اكتمال البيانات الرئيسية: نسبة الحقول المطلوبة المملوءة' },
      { en: 'Define "fit for purpose" standards for each master-data object', ar: 'تحديد معايير "صالح للاستخدام" لكل كائن بيانات رئيسي' },
      { en: 'Assign a data steward for each critical data domain', ar: 'تعيين أمين بيانات لكل مجال بيانات حرج' },
      { en: 'Set up automated data quality alerts in ERP / BI system', ar: 'إعداد تنبيهات تلقائية لجودة البيانات في ERP / نظام BI' },
    ],
    /* 3 — Digital adoption resistance */
    [
      { en: 'Survey team: what are the top 3 pain points with current digital tools?', ar: 'استطلاع الفريق: ما أعلى 3 نقاط ألم مع الأدوات الرقمية الحالية؟' },
      { en: 'Identify and recruit 3 "digital champions" from within the team', ar: 'تحديد وتجنيد 3 "بطلاء رقميين" من داخل الفريق' },
      { en: 'Co-design a user-friendly digital workflow with the team — not for them', ar: 'التصميم المشترك لسير عمل رقمي سهل الاستخدام مع الفريق — لا من أجلهم' },
      { en: 'Measure monthly active usage per system and share results with team', ar: 'قياس الاستخدام الشهري النشط لكل نظام ومشاركة النتائج مع الفريق' },
    ],
    /* 4 — No digital strategy */
    [
      { en: 'Define your digital vision: what does "digital procurement" look like in 3 years?', ar: 'تحديد رؤيتك الرقمية: كيف تبدو "المشتريات الرقمية" بعد 3 سنوات؟' },
      { en: 'Assess current tech stack: ERP, e-procurement, analytics, contracts — gap vs vision', ar: 'تقييم مجموعة التقنيات الحالية: ERP والمشتريات الإلكترونية والتحليلات والعقود — الفجوة مقابل الرؤية' },
      { en: 'Build a Digital Transformation Roadmap with 90-day sprints', ar: 'بناء خارطة طريق التحوّل الرقمي بسرعات 90 يوماً' },
      { en: 'Secure exec sponsorship and budget for Year 1 digital initiatives', ar: 'تأمين رعاية تنفيذية وميزانية لمبادرات رقمية العام الأول' },
    ],
  ],
  'contract-lifecycle-management': [
    /* 0 — Long authoring cycles */
    [
      { en: 'Time-stamp the last 10 contracts: calculate actual authoring cycle time', ar: 'تسجيل طوابع زمنية لآخر 10 عقود: حساب زمن دورة الصياغة الفعلي' },
      { en: 'Identify the steps consuming >50% of the authoring time', ar: 'تحديد الخطوات التي تستهلك أكثر من 50% من وقت الصياغة' },
      { en: 'Build a standard clause library for your top 5 contract types', ar: 'بناء مكتبة بنود معيارية لأعلى 5 أنواع عقود' },
      { en: 'Implement a contract template with pre-approved standard terms', ar: 'تطبيق قالب عقد ببنود معيارية معتمدة مسبقاً' },
      { en: 'Set a target: authoring cycle <10 days; measure monthly', ar: 'تحديد هدف: دورة الصياغة أقل من 10 أيام؛ قياس شهري' },
    ],
    /* 1 — Poor contract compliance */
    [
      { en: 'Audit 10 recent contracts: what % of deliverables were met on schedule?', ar: 'مراجعة 10 عقود حديثة: ما نسبة المخرجات المنجزة في الموعد المحدد؟' },
      { en: 'Identify which SLAs are most frequently breached and by whom', ar: 'تحديد اتفاقيات مستوى الخدمة الأكثر خرقاً ومن يرتكبها' },
      { en: 'Create a SLA monitoring log: review monthly with each supplier', ar: 'إنشاء سجلّ مراقبة اتفاقية مستوى الخدمة: مراجعة شهرية مع كل مورّد' },
      { en: 'Activate penalty/incentive clauses that exist but are not enforced', ar: 'تفعيل بنود الغرامات/الحوافز الموجودة لكن غير المُطبَّقة' },
    ],
    /* 2 — Contract renewal failures */
    [
      { en: 'Build a contract expiry calendar for all contracts in next 12 months', ar: 'بناء تقويم انتهاء العقود لجميع العقود خلال 12 شهراً القادمة' },
      { en: 'Set 90-day and 30-day automatic alerts for each contract expiry', ar: 'تعيين تنبيهات تلقائية قبل 90 يوماً و30 يوماً لكل انتهاء عقد' },
      { en: 'Assign a "contract owner" responsible for renewal decision', ar: 'تعيين "مالك عقد" مسؤول عن قرار التجديد' },
      { en: 'Start renewal negotiation at 90 days before expiry (not 30 days)', ar: 'بدء تفاوض التجديد قبل 90 يوماً من الانتهاء (لا 30 يوماً)' },
    ],
    /* 3 — Value leakage */
    [
      { en: 'Measure contracted price vs actual invoiced price for top 10 contracts', ar: 'قياس السعر التعاقدي مقابل السعر المفوتر الفعلي لأعلى 10 عقود' },
      { en: 'Identify value leakage sources: price variance, scope creep, unenforted SLAs', ar: 'تحديد مصادر تسرّب القيمة: تباين السعر، وزحف النطاق، واتفاقيات مستوى الخدمة غير المُطبَّقة' },
      { en: 'Implement 3-way match for all critical contracts: PO / delivery / invoice', ar: 'تطبيق المطابقة الثلاثية لجميع العقود الحرجة: أمر الشراء / التسليم / الفاتورة' },
      { en: 'Add a value-leakage recovery clause to all new contracts', ar: 'إضافة بند استرداد تسرّب القيمة لجميع العقود الجديدة' },
    ],
    /* 4 — No CLM system */
    [
      { en: 'Centralise all contracts in one repository (SharePoint minimum)', ar: 'مركزة جميع العقود في مستودع واحد (SharePoint كحدّ أدنى)' },
      { en: 'Tag each contract: type, value, expiry date, owner, status', ar: 'وضع علامات على كل عقد: النوع والقيمة وتاريخ الانتهاء والمالك والحالة' },
      { en: 'Define CLM workflow: request → draft → review → sign → store → monitor', ar: 'تحديد سير عمل CLM: طلب ← صياغة ← مراجعة ← توقيع ← تخزين ← مراقبة' },
      { en: 'Evaluate a CLM system if contract count exceeds 100 active agreements', ar: 'تقييم نظام CLM إذا تجاوز عدد العقود 100 اتفاقية نشطة' },
    ],
  ],
  'supplier-relationship-governance': [
    /* 0 — No formal SRM programme */
    [
      { en: 'Segment all suppliers: Strategic / Preferred / Transactional (Kraljic)', ar: 'تصنيف جميع المورّدين: استراتيجي / مفضّل / معاملاتي (Kraljic)' },
      { en: 'Define differentiated engagement model for each segment', ar: 'تحديد نموذج مشاركة متمايز لكل قطاع' },
      { en: 'Schedule quarterly business reviews (QBRs) for all strategic suppliers', ar: 'جدولة مراجعات أعمال ربع سنوية لجميع المورّدين الاستراتيجيين' },
      { en: 'Develop a joint business plan (JBP) template for strategic suppliers', ar: 'تطوير قالب خطة أعمال مشتركة (JBP) للمورّدين الاستراتيجيين' },
    ],
    /* 1 — Poor supplier performance */
    [
      { en: 'Create a supplier scorecard measuring: OTIF, quality, cost, compliance', ar: 'إنشاء بطاقة تقييم مورّد تقيس: OTIF والجودة والتكلفة والامتثال' },
      { en: 'Issue scorecards to all strategic suppliers monthly (preferred: quarterly)', ar: 'إصدار بطاقات التقييم لجميع المورّدين الاستراتيجيين شهرياً (مفضّل: ربع سنوياً)' },
      { en: 'Issue a formal CAR for any supplier scoring below 70% for 2 consecutive periods', ar: 'إصدار طلب إجراء تصحيحي رسمي لأي مورّد يسجّل أقل من 70% لفترتين متتاليتين' },
      { en: 'Define escalation trigger: when does a supplier get placed on "improvement watch"?', ar: 'تحديد محفّز التصعيد: متى يوضع المورّد على "قائمة مراقبة التحسين"؟' },
    ],
    /* 2 — Single-source concentration */
    [
      { en: 'Calculate % of spend at single-source for each category', ar: 'حساب نسبة الإنفاق على المصدر الوحيد لكل فئة' },
      { en: 'Categorise: which single-source situations are strategic vs operational risk?', ar: 'التصنيف: أي حالات المصدر الوحيد تشكّل مخاطرة استراتيجية مقابل تشغيلية؟' },
      { en: 'Initiate dual-source for all critical, non-strategic sole-source categories', ar: 'بدء التوريد الثنائي لجميع فئات المصدر الوحيد الحرجة وغير الاستراتيجية' },
      { en: 'Set a policy: new strategic contracts cannot exceed 70% concentration', ar: 'تحديد سياسة: لا يجوز تجاوز تركيز 70% في العقود الاستراتيجية الجديدة' },
    ],
    /* 3 — No supplier development */
    [
      { en: 'Identify 3 strategic suppliers with gaps that ISC / your team can help close', ar: 'تحديد 3 مورّدين استراتيجيين لديهم فجوات يمكن لـ ISC / فريقك المساعدة في سدّها' },
      { en: 'Co-invest in capability development: training, process improvement, technology', ar: 'المشاركة في تطوير القدرات: التدريب والتحسين العملياتي والتكنولوجيا' },
      { en: 'Create a supplier innovation programme: annual idea submission + selection', ar: 'إنشاء برنامج ابتكار للمورّدين: تقديم أفكار سنوية + اختيار' },
      { en: 'Measure: supplier satisfaction score with your organisation (annual survey)', ar: 'القياس: درجة رضا المورّد عن مؤسستك (استطلاع سنوي)' },
    ],
    /* 4 — ESG compliance gaps */
    [
      { en: 'Issue an ESG self-assessment questionnaire to all strategic suppliers', ar: 'إصدار استبيان تقييم ذاتي لـ ESG لجميع المورّدين الاستراتيجيين' },
      { en: 'Review Code of Conduct — ensure it covers labour, environment, and anti-corruption', ar: 'مراجعة مدوّنة السلوك — التأكّد من تغطيتها للعمالة والبيئة ومكافحة الفساد' },
      { en: 'Plan on-site ESG audit for top 5 strategic suppliers (risk-based)', ar: 'التخطيط للتدقيق الميداني على ESG لأعلى 5 مورّدين استراتيجيين (قائم على المخاطر)' },
      { en: 'Include ESG performance in supplier scorecard with minimum threshold', ar: 'تضمين أداء ESG في بطاقة تقييم المورّد مع حدّ أدنى' },
    ],
  ],
  'resiliency': [
    /* 0 — Disruption planning missing */
    [
      { en: 'List your top 5 supply chain disruption risks ranked by likelihood × impact', ar: 'إدراج أعلى 5 مخاطر اضطراب في سلسلة الإمداد مرتّبة حسب الاحتمالية × الأثر' },
      { en: 'For each risk: define trigger event, response owner, and first 24h actions', ar: 'لكل مخاطرة: تحديد الحدث المحفّز ومالك الاستجابة وإجراءات الـ 24 ساعة الأولى' },
      { en: 'Identify pre-qualified alternate suppliers or routes for each top risk', ar: 'تحديد موردين أو مسارات بديلة مؤهّلة مسبقاً لكل مخاطرة رئيسية' },
      { en: 'Document a 1-page response playbook for each scenario', ar: 'توثيق دليل استجابة من صفحة واحدة لكل سيناريو' },
      { en: 'Test the playbook with a tabletop exercise before a real disruption occurs', ar: 'اختبار الدليل في تمرين مكتبي قبل وقوع اضطراب حقيقي' },
    ],
    /* 1 — Red Sea / logistics disruption */
    [
      { en: 'Map all sea-freight routes currently transiting the Red Sea', ar: 'رسم جميع مسارات الشحن البحري العابرة حالياً بالبحر الأحمر' },
      { en: 'Pre-approve alternative routing options: Cape of Good Hope, air, land bridge', ar: 'الموافقة المسبقة على خيارات التوجيه البديل: رأس الرجاء الصالح، جوياً، جسر بري' },
      { en: 'Calculate cost delta for each alternate route — budget contingency', ar: 'حساب الفرق في التكلفة لكل مسار بديل — موازنة الطوارئ' },
      { en: 'Identify which items require a 30-day buffer stock if Red Sea closes', ar: 'تحديد الأصناف التي تتطلّب مخزون احتياطي لمدة 30 يوماً إذا أُغلق البحر الأحمر' },
      { en: 'Add disruption clause to logistics contracts: activation criteria + response SLA', ar: 'إضافة بند اضطراب في عقود الشحن: معايير التفعيل + اتفاقية مستوى الخدمة' },
    ],
    /* 2 — Single-corridor logistics */
    [
      { en: 'Map all logistics entry points currently used — identify concentration', ar: 'رسم جميع نقاط دخول الشحن المستخدمة حالياً — تحديد التركّز' },
      { en: 'Pre-qualify a second port or customs entry point for your top import categories', ar: 'تأهيل ميناء ثانٍ أو منفذ جمركي مسبقاً لأعلى فئات الاستيراد' },
      { en: 'Assess inland customs posts (Haradh, Al-Batha) as alternatives', ar: 'تقييم المنافذ الجمركية الداخلية (حرّاضة، البطحاء) كبدائل' },
      { en: 'For high-value critical items: assess air freight as contingency', ar: 'للأصناف الحرجة عالية القيمة: تقييم الشحن الجوي كخيار طوارئ' },
    ],
    /* 3 — Resilience vs efficiency trade-off */
    [
      { en: 'Build a "cost of disruption" model for your top 3 risk scenarios', ar: 'بناء نموذج "تكلفة الاضطراب" لأعلى 3 سيناريوهات مخاطر' },
      { en: 'Calculate the annual buffer stock investment required for each scenario', ar: 'حساب الاستثمار السنوي المطلوب في المخزون الاحتياطي لكل سيناريو' },
      { en: 'Model: cost of buffer stock vs cost of one disruption event — break-even', ar: 'نمذجة: تكلفة المخزون الاحتياطي مقابل تكلفة حدث اضطراب واحد — نقطة التعادل' },
      { en: 'Present risk-adjusted ROI of resilience investment to leadership', ar: 'تقديم العائد على الاستثمار المعدّل بالمخاطر لاستثمار المرونة للقيادة' },
    ],
  ],
  'value-engineering': [
    /* 0 — VE confused with cost-cutting */
    [
      { en: 'Open every VE exercise with a Function Analysis: what must this item DO?', ar: 'فتح كل جلسة هندسة قيمة بتحليل وظيفي: ماذا يجب أن يفعل هذا الصنف؟' },
      { en: 'Separate "required functions" from "nice-to-have" features before any cost work', ar: 'فصل "الوظائف المطلوبة" عن الميزات "الاختيارية" قبل أي عمل على التكلفة' },
      { en: 'Invite Engineering and Quality to every VE session — not procurement alone', ar: 'دعوة الهندسة والجودة لكل جلسة هندسة قيمة — لا المشتريات وحدها' },
      { en: 'Document function verification for each VE change — sign off before implementation', ar: 'توثيق التحقّق الوظيفي لكل تغيير في هندسة القيمة — الاعتماد قبل التطبيق' },
    ],
    /* 1 — No should-cost data */
    [
      { en: 'Select your top 3 spend categories for initial should-cost modelling', ar: 'اختيار أعلى 3 فئات إنفاق للنمذجة الأولية للتكلفة المتوقّعة' },
      { en: 'For each category: identify raw material, labour, overhead, and margin components', ar: 'لكل فئة: تحديد المواد الخام والعمالة والتكاليف العامة ومكوّنات الهامش' },
      { en: 'Source GCC labour rates and published commodity prices for your inputs', ar: 'الحصول على معدّلات العمالة في الخليج وأسعار السلع المنشورة لمدخلاتك' },
      { en: 'Build a bottom-up should-cost model — compare to current supplier price', ar: 'بناء نموذج تكلفة متوقّعة من القاعدة إلى الأعلى — مقارنته بسعر المورّد الحالي' },
      { en: 'Use should-cost as the anchor in your next negotiation', ar: 'استخدام التكلفة المتوقّعة كمرساة في تفاوضك القادم' },
    ],
    /* 2 — Over-specification */
    [
      { en: 'Audit material specifications for your top 5 spend categories', ar: 'مراجعة مواصفات المواد لأعلى 5 فئات إنفاق' },
      { en: 'For each spec, ask: does this requirement drive safety / compliance, or preference?', ar: 'لكل مواصفة، اسأل: هل هذا المتطلب يدفع السلامة / الامتثال، أم هو تفضيل؟' },
      { en: 'Identify specs that can be relaxed without compromising function or compliance', ar: 'تحديد المواصفات التي يمكن تخفيفها دون المساس بالوظيفة أو الامتثال' },
      { en: 'Run a specification review workshop with engineering, quality, and procurement', ar: 'تنظيم ورشة مراجعة مواصفات مع الهندسة والجودة والمشتريات' },
    ],
    /* 3 — Low idea conversion */
    [
      { en: 'Review last 12 months of VE ideas: what % were implemented? Why rejected?', ar: 'مراجعة أفكار هندسة القيمة لـ 12 شهراً الماضية: ما نسبة المطبّقة؟ لماذا رُفضت الباقية؟' },
      { en: 'Shorten the approval cycle: < 30 days from submission to decision', ar: 'تقصير دورة الاعتماد: أقل من 30 يوماً من التقديم إلى القرار' },
      { en: 'Create a VE idea tracker — visible to all contributors', ar: 'إنشاء أداة تتبّع أفكار هندسة القيمة — مرئية لجميع المساهمين' },
      { en: 'Celebrate implemented VE wins — recognise contributors publicly', ar: 'الاحتفال بانتصارات هندسة القيمة المطبّقة — الاعتراف بالمساهمين علناً' },
    ],
  ],
  'process-improvement-policy': [
    /* 0 — No documented SOPs */
    [
      { en: 'List the top 10 processes your team runs that have no written SOP', ar: 'إدراج أعلى 10 عمليات يديرها فريقك دون إجراء تشغيل معياري مكتوب' },
      { en: 'Prioritise: which 3 processes cause the most variation or errors?', ar: 'ترتيب الأولويات: أي 3 عمليات تسبّب أكثر تبايناً أو أخطاء؟' },
      { en: 'Run a 2-hour process capture workshop with the people who actually do the work', ar: 'تنظيم ورشة التقاط عملية لمدة ساعتين مع من ينفّذ العمل فعلياً' },
      { en: 'Draft the SOP in plain language with a swim-lane diagram', ar: 'صياغة الإجراء التشغيلي المعياري بلغة بسيطة مع مخطط مسارات السباحة' },
      { en: 'Validate with operations team and get sign-off from process owner', ar: 'التحقّق مع فريق العمليات والحصول على اعتماد مالك العملية' },
    ],
    /* 1 — SOPs not followed */
    [
      { en: 'Interview 3 front-line staff: why don\'t they follow the SOP?', ar: 'إجراء مقابلات مع 3 موظفين في الخطوط الأمامية: لماذا لا يتبعون الإجراء التشغيلي المعياري؟' },
      { en: 'Identify: is the issue in the SOP design, training, or enforcement?', ar: 'التحديد: هل المشكلة في تصميم الإجراء أم التدريب أم التطبيق؟' },
      { en: 'Redesign the SOP with process owners — remove steps that add no value', ar: 'إعادة تصميم الإجراء مع أصحاب العملية — إزالة الخطوات التي لا تضيف قيمة' },
      { en: 'Integrate the SOP into ERP workflow — system enforces the process', ar: 'دمج الإجراء في سير عمل ERP — النظام يفرض العملية' },
      { en: 'Measure compliance rate monthly: % of transactions following the SOP', ar: 'قياس معدّل الامتثال شهرياً: نسبة المعاملات التي تتّبع الإجراء التشغيلي المعياري' },
    ],
    /* 2 — Approval process too long */
    [
      { en: 'Map the entire approval flow — record time at each step over 10 transactions', ar: 'رسم مسار الاعتماد بالكامل — تسجيل الوقت في كل خطوة عبر 10 معاملات' },
      { en: 'Identify the bottleneck step consuming >40% of total cycle time', ar: 'تحديد خطوة الاختناق التي تستهلك أكثر من 40% من إجمالي زمن الدورة' },
      { en: 'Challenge every approval layer: what risk does it actually mitigate?', ar: 'التشكيك في كل طبقة اعتماد: ما المخاطرة التي تخفّفها فعلياً؟' },
      { en: 'Simplify DoA: items <SAR 50K approved by one level, not three', ar: 'تبسيط تفويض الصلاحيات: الأصناف أقل من 50 ألف ريال تُعتمد بمستوى واحد لا ثلاثة' },
    ],
    /* 3 — Policy gaps (SDAIA/Vision 2030) */
    [
      { en: 'Audit current policies against PDPL requirements: gaps in data handling?', ar: 'مراجعة السياسات الحالية مقابل متطلبات نظام حماية البيانات الشخصية: فجوات في التعامل مع البيانات؟' },
      { en: 'Map procurement data flows: what personal data is collected from suppliers/vendors?', ar: 'رسم تدفّقات بيانات المشتريات: ما البيانات الشخصية المجمَّعة من المورّدين؟' },
      { en: 'Draft a Digital Procurement Policy covering e-invoicing, e-signatures, and data retention', ar: 'صياغة سياسة المشتريات الرقمية تغطّي الفوترة الإلكترونية والتوقيعات الإلكترونية وحفظ البيانات' },
      { en: 'Align all policies to Vision 2030 procurement targets — document alignment', ar: 'مواءمة جميع السياسات مع أهداف مشتريات رؤية 2030 — توثيق المواءمة' },
    ],
  ],
  'training-capability-building': [
    /* 0 — Budget wasted on generic courses */
    [
      { en: 'Run a competency gap assessment against your team\'s job requirements', ar: 'إجراء تقييم فجوة الكفاءات مقابل متطلبات وظائف فريقك' },
      { en: 'Rank gaps by business impact — focus training budget on highest-impact gaps', ar: 'ترتيب الفجوات حسب الأثر على الأعمال — تركيز موازنة التدريب على الفجوات الأعلى أثراً' },
      { en: 'Design role-specific learning pathways (not a one-size-fits-all programme)', ar: 'تصميم مسارات تعلّم محدّدة لكل دور (لا برنامج موحّد للجميع)' },
      { en: 'Define 3 measurable outcomes per training module (behaviour change, KPI impact)', ar: 'تحديد 3 نتائج قابلة للقياس لكل وحدة تدريبية (تغيير السلوك، أثر مؤشر الأداء)' },
      { en: 'Implement Kirkpatrick Level 1–4 evaluation for every programme', ar: 'تطبيق تقييم كيركباتريك من المستوى 1 إلى 4 لكل برنامج' },
    ],
    /* 1 — No Saudi procurement career pathway */
    [
      { en: 'Design a procurement career ladder: Junior Buyer → Category Mgr → CPO', ar: 'تصميم سلّم مهني للمشتريات: مشترٍ مبتدئ ← مدير الفئة ← رئيس المشتريات' },
      { en: 'Map each career stage to CIPS qualification level (L2 → L4 → L6)', ar: 'ربط كل مرحلة مهنية بمستوى مؤهّل CIPS (L2 ← L4 ← L6)' },
      { en: 'Apply for Tamheer / Hadaf co-funding for CIPS study support', ar: 'التقدّم للتمويل المشترك من Tamheer / هدف لدعم دراسة CIPS' },
      { en: 'Partner with CIPS Arabia for Arabic-language certification delivery', ar: 'الشراكة مع CIPS Arabia لتقديم الشهادات باللغة العربية' },
    ],
    /* 2 — Training in English only */
    [
      { en: 'Survey team: preferred training language (Arabic / English / bilingual)', ar: 'استطلاع الفريق: لغة التدريب المفضّلة (عربي / إنجليزي / ثنائي اللغة)' },
      { en: 'Source bilingual training materials for all core procurement topics', ar: 'الحصول على مواد تدريبية ثنائية اللغة لجميع موضوعات المشتريات الأساسية' },
      { en: 'Allow code-switching (Arabic/English) during group discussions', ar: 'السماح بالتبديل بين اللغتين (عربي/إنجليزي) خلال النقاشات الجماعية' },
      { en: 'Use GCC case studies and examples — not Western corporate case studies', ar: 'استخدام دراسات حالة وأمثلة من الخليج — لا دراسات حالة الشركات الغربية' },
    ],
    /* 3 — No post-training measurement */
    [
      { en: 'Implement pre-training knowledge assessment for every programme (baseline)', ar: 'تطبيق تقييم معرفة قبل التدريب لكل برنامج (خط أساس)' },
      { en: 'Run a post-training assessment immediately after and at 90 days', ar: 'إجراء تقييم بعد التدريب مباشرةً وبعد 90 يوماً' },
      { en: 'Define 2–3 on-the-job behaviour indicators to observe at 90 days', ar: 'تحديد 2–3 مؤشرات سلوكية في العمل للملاحظة عند 90 يوماً' },
      { en: 'Track KPI improvement attributable to training — report to leadership', ar: 'تتبّع تحسّن مؤشرات الأداء العائد إلى التدريب — الإبلاغ للقيادة' },
      { en: 'Calculate training ROI: (KPI value improvement - training cost) / training cost', ar: 'حساب العائد على الاستثمار في التدريب: (قيمة تحسّن مؤشرات الأداء - تكلفة التدريب) / تكلفة التدريب' },
    ],
  ],
};

/* ─── ChallengeToolkitPanel component ─── */
interface ChallengeToolkitPanelProps {
  slug: string;
  challengeIndex: number;
  isAr: boolean;
}

export function ChallengeToolkitPanel({ slug, challengeIndex, isAr }: ChallengeToolkitPanelProps) {
  const [open, setOpen] = useState(false);
  const slugChecklists = CHALLENGE_CHECKLISTS[slug];
  const items = slugChecklists?.[challengeIndex] ?? null;
  if (!items || items.length === 0) return null;

  const storageKey = `isc-tool-${slug}-challenge-${challengeIndex}`;
  const actionKey = `isc-tool-${slug}-actions-${challengeIndex}`;

  return (
    <div className="mt-3 border-t border-dashed border-border pt-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-xs font-bold text-primary hover:text-accent transition-colors"
      >
        <Wrench className="w-3.5 h-3.5" />
        {isAr ? 'أدوات التطبيق المساعدة' : 'Implementation Toolkit'}
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <ChecklistTool
            storageKey={storageKey}
            items={items}
            isAr={isAr}
            title="Action Steps"
            titleAr="خطوات التطبيق"
          />
          <ActionTracker storageKey={actionKey} isAr={isAr} />
        </div>
      )}
    </div>
  );
}
