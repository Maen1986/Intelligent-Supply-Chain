/**
 * Challenge Toolkit Panels — World-Class Implementation for all 12 Solution slugs
 *
 * Every challenge accordion now contains a 3-tab toolkit:
 * 1. 📋 Action Steps   — priority-tagged checklist with evidence notes + action tracker
 * 2. 🔧 Impact Tool    — challenge-specific quantification calculator (ParamForm)
 * 3. ✨ AI Guidance    — AI-generated action brief for that specific challenge
 */
import React, { useState, useCallback } from 'react';
import { Wrench, ChevronDown, ChevronUp, Printer } from 'lucide-react';
import { ChecklistTool, ActionTracker, ParamForm, ParamField, ComputeResult, ChecklistItem } from './Primitives';
import { useAIPlan } from '@/hooks/useAIPlan';
import { AIPlanPanel } from '@/components/AIPlanPanel';

function printZone(zone: string) {
  document.body.setAttribute('data-print', zone);
  const cleanup = () => { document.body.removeAttribute('data-print'); window.removeEventListener('afterprint', cleanup); };
  window.addEventListener('afterprint', cleanup);
  window.print();
}

// ─── Checklist items (existing high-quality content, preserved) ───────────────

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
    /* 0 */ [
      { en: 'Define 5 Key Risk Indicators (KRIs) for your supply chain', ar: 'تحديد 5 مؤشرات مخاطر رئيسية لسلسلة الإمداد' },
      { en: 'Set amber and red threshold values for each KRI', ar: 'تحديد قيم عتبة كهرمانية وحمراء لكل مؤشر مخاطر' },
      { en: 'Assign a KRI owner responsible for weekly monitoring', ar: 'تعيين مالك مؤشر مخاطر مسؤول عن المراقبة الأسبوعية' },
      { en: 'Add KRI review as a standing agenda item in weekly operations meeting', ar: 'إضافة مراجعة مؤشرات المخاطر كبند دائم في اجتماع العمليات الأسبوعي' },
      { en: 'Create a 1-page escalation protocol: who to notify when a KRI turns red', ar: 'إنشاء بروتوكول تصعيد من صفحة واحدة: من يُبلَّغ عند تحوّل مؤشر المخاطر إلى الأحمر' },
    ],
    /* 1 */ [
      { en: 'List your top 10 Tier-1 suppliers and ask each for their top 3 Tier-2 suppliers', ar: 'إدراج أعلى 10 مورّدين من المستوى الأول وطلب كل منهم تسمية أعلى 3 مورّدين من المستوى الثاني' },
      { en: 'Add Tier-2 disclosure requirement to all new Tier-1 contracts', ar: 'إضافة متطلب الإفصاح عن مورّدي المستوى الثاني لجميع عقود المستوى الأول الجديدة' },
      { en: 'Screen disclosed Tier-2 suppliers against geopolitical and financial risk databases', ar: 'فحص مورّدي المستوى الثاني المُفصَح عنهم مقابل قواعد بيانات المخاطر الجيوسياسية والمالية' },
      { en: 'Flag any Tier-2 in high-risk geographies (conflict zones, sanctions lists)', ar: 'وضع علامة على أي مورّد من المستوى الثاني في جغرافيات عالية الخطورة' },
    ],
    /* 2 */ [
      { en: 'Print and review your current risk register — confirm all owners still active', ar: 'طباعة ومراجعة سجلّ المخاطر الحالي — تأكيد أن جميع المالكين لا يزالون نشطين' },
      { en: 'Schedule a 2-hour risk register review for next month', ar: 'جدولة مراجعة سجلّ المخاطر لمدة ساعتين خلال الشهر القادم' },
      { en: 'Update all risk scores: re-assess likelihood and impact for each risk', ar: 'تحديث جميع درجات المخاطر: إعادة تقييم الاحتمالية والأثر لكل مخاطرة' },
      { en: 'Add risk register review to quarterly management committee agenda', ar: 'إضافة مراجعة سجلّ المخاطر لجدول أعمال لجنة الإدارة الفصلية' },
      { en: 'Close all "overdue" mitigation actions or formally escalate them', ar: 'إغلاق جميع إجراءات التخفيف "المتأخرة" أو تصعيدها رسمياً' },
    ],
    /* 3 */ [
      { en: 'Identify all sole-source items by spend value and business criticality', ar: 'تحديد جميع الأصناف أحادية المصدر بقيمة الإنفاق والأهمية الحيوية' },
      { en: 'For top 3 critical sole-source items: initiate emergency second-source qualification', ar: 'للأصناف الثلاثة الأكثر أهمية أحادية المصدر: بدء تأهيل طارئ للمصدر الثاني' },
      { en: 'Set a 90-day safety stock target for each critical sole-source item', ar: 'تحديد هدف مخزون أمان لمدة 90 يوماً لكل صنف حرج أحادي المصدر' },
      { en: 'Add sole-source risk to the risk register and assign a CPO-level owner', ar: 'إضافة مخاطر المصدر الوحيد إلى سجلّ المخاطر وتعيين مالك على مستوى رئيس المشتريات' },
    ],
    /* 4 */ [
      { en: 'Identify your top 3 supply chain disruption scenarios (supplier, logistics, regulatory)', ar: 'تحديد أعلى 3 سيناريوهات اضطراب في سلسلة الإمداد' },
      { en: 'For each scenario: define the trigger, response owner, and first 24h actions', ar: 'لكل سيناريو: تحديد المحفّز ومالك الاستجابة وإجراءات الـ 24 ساعة الأولى' },
      { en: 'Identify alternate suppliers or logistics routes for each scenario', ar: 'تحديد موردين أو مسارات لوجستية بديلة لكل سيناريو' },
      { en: 'Document and sign off a 1-page BCP for each scenario', ar: 'توثيق واعتماد خطة استمرارية أعمال من صفحة واحدة لكل سيناريو' },
      { en: 'Schedule a tabletop exercise (4h) to test the BCP before it is needed', ar: 'جدولة تمرين مكتبي لاختبار خطة الاستمرارية قبل الحاجة إليها' },
    ],
  ],
  'lean-agile-supply-chain': [
    /* 0 */ [
      { en: 'Select the end-to-end process with the longest lead time for VSM', ar: 'اختيار العملية من طرف لطرف ذات أطول مهلة توريد لرسم VSM' },
      { en: 'Map current-state VSM: identify all NVA steps and wait times', ar: 'رسم VSM للحالة الحالية: تحديد جميع الخطوات غير المضيفة للقيمة وأوقات الانتظار' },
      { en: 'Calculate Process Cycle Efficiency (PCE = VA / total lead time)', ar: 'حساب كفاءة دورة العملية (PCE = وقت القيمة المضافة / إجمالي مهلة التوريد)' },
      { en: 'Run a Kaizen event on the single highest-impact NVA step', ar: 'تنظيم فعالية Kaizen على أعلى خطوة غير مضيفة للقيمة' },
      { en: 'Measure lead time weekly and post on a visual management board', ar: 'قياس مهلة التوريد أسبوعياً ونشرها على لوحة الإدارة المرئية' },
    ],
    /* 1 */ [
      { en: 'Plot order-vs-demand history for 6 months: quantify the bullwhip amplification', ar: 'رسم سجلّ الطلب مقابل الطلب الفعلي لـ 6 أشهر: قياس تضخيم أثر السوط' },
      { en: 'Identify your replenishment "decoupling point" — where pull starts', ar: 'تحديد "نقطة الفصل" في إعادة التموين — حيث يبدأ نظام السحب' },
      { en: 'Pilot DDMRP buffers for your top 10 highest-variability SKUs', ar: 'تجربة مخزونات DDMRP لأعلى 10 أصناف في التباين' },
      { en: 'Run a weekly demand review with sales and supply — share single signal', ar: 'إجراء مراجعة طلب أسبوعية مع المبيعات والعرض — مشاركة إشارة موحّدة' },
    ],
    /* 2 */ [
      { en: 'Map the handover points between demand, supply, and manufacturing teams', ar: 'رسم نقاط التسليم بين فرق الطلب والعرض والتصنيع' },
      { en: 'Establish a weekly cross-functional execution review (30-min stand-up)', ar: 'إنشاء مراجعة تنفيذية متعددة الوظائف أسبوعية' },
      { en: 'Define a single shared KPI each team is measured on (e.g. OTIF)', ar: 'تحديد مؤشر أداء مشترك واحد يُقاس به كل فريق' },
      { en: 'Implement Agile S&OP: consensus demand → supply plan → financial reconciliation', ar: 'تطبيق S&OP رشيق: طلب توافقي ← خطة العرض ← التسوية المالية' },
    ],
    /* 3 */ [
      { en: 'Count the hours spent on rework and workarounds last month', ar: 'حساب ساعات إعادة العمل والحلول البديلة خلال الشهر الماضي' },
      { en: 'Run a DMAIC project on the highest-frequency defect type', ar: 'تشغيل مشروع DMAIC على نوع العيب الأعلى تكراراً' },
      { en: 'Document the "correct" process in a Standard Operating Procedure', ar: 'توثيق العملية "الصحيحة" في إجراء تشغيل معياري' },
      { en: 'Add Poka-Yoke (error-proofing) to the step that generates most rework', ar: 'إضافة Poka-Yoke إلى الخطوة التي تولّد أكثر إعادة عمل' },
    ],
    /* 4 */ [
      { en: 'Identify why the last initiative stalled: sponsor loss? resource? competing priorities?', ar: 'تحديد سبب توقّف المبادرة الأخيرة' },
      { en: 'Establish a Lean Steering Committee meeting monthly (exec-level sponsor)', ar: 'إنشاء لجنة توجيه Lean تجتمع شهرياً' },
      { en: 'Implement a daily 15-min "huddle" at team level: yesterday/today/blockers', ar: 'تطبيق "اجتماع وقوف" يومي لمدة 15 دقيقة على مستوى الفريق' },
      { en: 'Run at least one Kaizen event per quarter — report results to leadership', ar: 'تنظيم فعالية Kaizen واحدة على الأقل كل ربع سنة' },
      { en: 'Recognise and share each improvement success — build positive culture', ar: 'الاعتراف بكل نجاح في التحسين ومشاركته — بناء ثقافة إيجابية' },
    ],
  ],
  'sustainability-esg': [
    /* 0 */ [
      { en: 'Identify your top 10 suppliers by spend — request Scope 3 emissions data', ar: 'تحديد أعلى 10 مورّدين بالإنفاق — طلب بيانات انبعاثات النطاق الثالث' },
      { en: 'Use spend-based emission factors for interim estimates (DEFRA or GHG Protocol)', ar: 'استخدام معاملات انبعاثات مبنية على الإنفاق للتقديرات المؤقتة' },
      { en: 'Add Scope 3 data reporting requirement to all new supplier contracts', ar: 'إضافة متطلب الإبلاغ عن بيانات النطاق الثالث لجميع عقود المورّدين الجديدة' },
      { en: 'Set up a supplier portal or questionnaire for annual ESG data collection', ar: 'إعداد بوابة مورّدين أو استبيان لجمع بيانات ESG السنوية' },
      { en: 'Report Scope 3 progress quarterly to leadership alongside financial KPIs', ar: 'الإبلاغ عن تقدّم النطاق الثالث فصلياً للقيادة' },
    ],
    /* 1 */ [
      { en: 'Quantify the cost of one ESG-related incident (regulatory fine, reputation loss)', ar: 'تحديد تكلفة حادثة واحدة متعلقة بـ ESG' },
      { en: 'Calculate green financing benefit: lower interest rate on ESG-linked facilities', ar: 'حساب ميزة التمويل الأخضر' },
      { en: 'List 3 customers who require ESG credentials — quantify contract revenue at risk', ar: 'إدراج 3 عملاء يتطلّبون بيانات ESG — تحديد قيمة الإيراد التعاقدي المعرّض للخطر' },
      { en: 'Present an ESG ROI case to CFO: risk reduction + financing + contract retention', ar: 'تقديم دراسة جدوى ESG للمدير المالي' },
    ],
    /* 2 */ [
      { en: 'Calculate your current Iktva / local content score using official methodology', ar: 'حساب درجة Iktva / المحتوى المحلي الحالية' },
      { en: 'Map which spend categories qualify as local content — identify gaps', ar: 'رسم فئات الإنفاق المؤهّلة كمحتوى محلي — تحديد الفجوات' },
      { en: 'Identify 3 locally-produced alternatives to your top imported categories', ar: 'تحديد 3 بدائل محلية الإنتاج لأعلى فئاتك المستوردة' },
      { en: "Engage SIDF / Monsha'at for local supplier development programme", ar: 'التعاون مع صندوق التنمية الصناعية / منشآت لبرنامج تطوير المورّدين المحليين' },
    ],
    /* 3 */ [
      { en: 'Screen all strategic suppliers against ESG risk databases (Ecovadis, CDP)', ar: 'فحص جميع المورّدين الاستراتيجيين مقابل قواعد بيانات مخاطر ESG' },
      { en: 'Issue Supplier Code of Conduct with ESG minimum standards', ar: 'إصدار مدوّنة سلوك المورّدين بمعايير ESG الدنيا' },
      { en: 'Include ESG audit right-to-audit clause in all new contracts', ar: 'تضمين بند حق التدقيق في ESG في جميع العقود الجديدة' },
      { en: 'Plan first ESG supplier audit for top 5 strategic suppliers within 6 months', ar: 'التخطيط للتدقيق الأول على ESG لأعلى 5 مورّدين استراتيجيين' },
    ],
    /* 4 */ [
      { en: 'Establish a GHG inventory baseline for Scope 1 and 2 emissions', ar: 'إنشاء خط أساس لمخزون الغازات الدفيئة للنطاقين الأول والثاني' },
      { en: 'Set a science-based reduction target aligned to 1.5°C pathway (SBTi)', ar: 'تحديد هدف خفض قائم على العلم متوائم مع مسار 1.5 درجة' },
      { en: 'Identify the 3 highest-emission procurement categories for priority action', ar: 'تحديد أعلى 3 فئات مشتريات في الانبعاثات للإجراء ذي الأولوية' },
      { en: 'Report carbon progress alongside financial results in management reporting', ar: 'الإبلاغ عن تقدّم الكربون جانباً للنتائج المالية' },
    ],
  ],
  'digital-transformation': [
    /* 0 */ [
      { en: 'Audit which ERP modules are licensed vs actively used — calculate utilisation rate', ar: 'مراجعة وحدات ERP المرخّصة مقابل المستخدمة فعلياً' },
      { en: 'Identify the top 3 manual processes that ERP already supports but team ignores', ar: 'تحديد أعلى 3 عمليات يدوية يدعمها ERP بالفعل لكن الفريق لا يستخدمها' },
      { en: 'Run a 2h ERP capability walk-through with process owners', ar: 'إجراء جلسة استعراض قدرات ERP مع أصحاب العمليات' },
      { en: 'Create an ERP adoption roadmap: 3-6-12 month milestones', ar: 'إنشاء خارطة طريق لتبنّي ERP بمعالم 3-6-12 شهراً' },
    ],
    /* 1 */ [
      { en: 'Map all manual steps in your procure-to-pay process — count handoffs', ar: 'رسم جميع الخطوات اليدوية في عملية الشراء حتى الدفع' },
      { en: 'Identify the 5 steps with highest volume × highest manual effort', ar: 'تحديد الـ 5 خطوات ذات الحجم الأعلى × الجهد اليدوي الأعلى' },
      { en: 'Score each for automation feasibility (ERP config, RPA, or AI)', ar: 'تقييم كل خطوة لجدوى الأتمتة (إعداد ERP، أو RPA، أو AI)' },
      { en: 'Automate the highest-impact step first — measure before/after cycle time', ar: 'أتمتة الخطوة الأعلى تأثيراً أولاً — قياس زمن الدورة قبل/بعد' },
      { en: 'Set a 12-month target: 60% of routine procurement steps automated', ar: 'تحديد هدف 12 شهراً: 60% من خطوات المشتريات الروتينية مؤتمتة' },
    ],
    /* 2 */ [
      { en: 'Run a master data completeness check: % of required fields populated', ar: 'إجراء فحص اكتمال البيانات الرئيسية' },
      { en: 'Define "fit for purpose" standards for each master-data object', ar: 'تحديد معايير "صالح للاستخدام" لكل كائن بيانات رئيسي' },
      { en: 'Assign a data steward for each critical data domain', ar: 'تعيين أمين بيانات لكل مجال بيانات حرج' },
      { en: 'Set up automated data quality alerts in ERP / BI system', ar: 'إعداد تنبيهات تلقائية لجودة البيانات' },
    ],
    /* 3 */ [
      { en: 'Survey team: what are the top 3 pain points with current digital tools?', ar: 'استطلاع الفريق: ما أعلى 3 نقاط ألم مع الأدوات الرقمية الحالية؟' },
      { en: 'Identify and recruit 3 "digital champions" from within the team', ar: 'تحديد وتجنيد 3 "بطلاء رقميين" من داخل الفريق' },
      { en: 'Co-design a user-friendly digital workflow with the team — not for them', ar: 'التصميم المشترك لسير عمل رقمي سهل الاستخدام مع الفريق' },
      { en: 'Measure monthly active usage per system and share results with team', ar: 'قياس الاستخدام الشهري النشط لكل نظام ومشاركة النتائج مع الفريق' },
    ],
    /* 4 */ [
      { en: 'Define your digital vision: what does "digital procurement" look like in 3 years?', ar: 'تحديد رؤيتك الرقمية للمشتريات بعد 3 سنوات' },
      { en: 'Assess current tech stack: ERP, e-procurement, analytics, contracts — gap vs vision', ar: 'تقييم مجموعة التقنيات الحالية مقابل الرؤية' },
      { en: 'Build a Digital Transformation Roadmap with 90-day sprints', ar: 'بناء خارطة طريق التحوّل الرقمي بسرعات 90 يوماً' },
      { en: 'Secure exec sponsorship and budget for Year 1 digital initiatives', ar: 'تأمين رعاية تنفيذية وميزانية لمبادرات رقمية العام الأول' },
    ],
  ],
  'contract-lifecycle-management': [
    /* 0 */ [
      { en: 'Time-stamp the last 10 contracts: calculate actual authoring cycle time', ar: 'تسجيل طوابع زمنية لآخر 10 عقود: حساب زمن دورة الصياغة الفعلي' },
      { en: 'Identify the steps consuming >50% of the authoring time', ar: 'تحديد الخطوات التي تستهلك أكثر من 50% من وقت الصياغة' },
      { en: 'Build a standard clause library for your top 5 contract types', ar: 'بناء مكتبة بنود معيارية لأعلى 5 أنواع عقود' },
      { en: 'Implement a contract template with pre-approved standard terms', ar: 'تطبيق قالب عقد ببنود معيارية معتمدة مسبقاً' },
      { en: 'Set a target: authoring cycle <10 days; measure monthly', ar: 'تحديد هدف: دورة الصياغة أقل من 10 أيام؛ قياس شهري' },
    ],
    /* 1 */ [
      { en: 'Audit 10 recent contracts: what % of deliverables were met on schedule?', ar: 'مراجعة 10 عقود حديثة: ما نسبة المخرجات المنجزة في الموعد المحدد؟' },
      { en: 'Identify which SLAs are most frequently breached and by whom', ar: 'تحديد اتفاقيات مستوى الخدمة الأكثر خرقاً' },
      { en: 'Create a SLA monitoring log: review monthly with each supplier', ar: 'إنشاء سجلّ مراقبة اتفاقية مستوى الخدمة' },
      { en: 'Activate penalty/incentive clauses that exist but are not enforced', ar: 'تفعيل بنود الغرامات/الحوافز الموجودة لكن غير المُطبَّقة' },
    ],
    /* 2 */ [
      { en: 'Build a contract expiry calendar for all contracts in next 12 months', ar: 'بناء تقويم انتهاء العقود لجميع العقود خلال 12 شهراً القادمة' },
      { en: 'Set 90-day and 30-day automatic alerts for each contract expiry', ar: 'تعيين تنبيهات تلقائية قبل 90 يوماً و30 يوماً لكل انتهاء عقد' },
      { en: 'Assign a "contract owner" responsible for renewal decision', ar: 'تعيين "مالك عقد" مسؤول عن قرار التجديد' },
      { en: 'Start renewal negotiation at 90 days before expiry (not 30 days)', ar: 'بدء تفاوض التجديد قبل 90 يوماً من الانتهاء' },
    ],
    /* 3 */ [
      { en: 'Measure contracted price vs actual invoiced price for top 10 contracts', ar: 'قياس السعر التعاقدي مقابل السعر المفوتر الفعلي لأعلى 10 عقود' },
      { en: 'Identify value leakage sources: price variance, scope creep, unenforced SLAs', ar: 'تحديد مصادر تسرّب القيمة: تباين السعر، وزحف النطاق، واتفاقيات مستوى الخدمة غير المُطبَّقة' },
      { en: 'Implement 3-way match for all critical contracts: PO / delivery / invoice', ar: 'تطبيق المطابقة الثلاثية لجميع العقود الحرجة' },
      { en: 'Add a value-leakage recovery clause to all new contracts', ar: 'إضافة بند استرداد تسرّب القيمة لجميع العقود الجديدة' },
    ],
    /* 4 */ [
      { en: 'Centralise all contracts in one repository (SharePoint minimum)', ar: 'مركزة جميع العقود في مستودع واحد' },
      { en: 'Tag each contract: type, value, expiry date, owner, status', ar: 'وضع علامات على كل عقد: النوع والقيمة وتاريخ الانتهاء والمالك والحالة' },
      { en: 'Define CLM workflow: request → draft → review → sign → store → monitor', ar: 'تحديد سير عمل CLM: طلب ← صياغة ← مراجعة ← توقيع ← تخزين ← مراقبة' },
      { en: 'Evaluate a CLM system if contract count exceeds 100 active agreements', ar: 'تقييم نظام CLM إذا تجاوز عدد العقود 100 اتفاقية نشطة' },
    ],
  ],
  'supplier-relationship-governance': [
    /* 0 */ [
      { en: 'Segment all suppliers: Strategic / Preferred / Transactional (Kraljic)', ar: 'تصنيف جميع المورّدين: استراتيجي / مفضّل / معاملاتي' },
      { en: 'Define differentiated engagement model for each segment', ar: 'تحديد نموذج مشاركة متمايز لكل قطاع' },
      { en: 'Schedule quarterly business reviews (QBRs) for all strategic suppliers', ar: 'جدولة مراجعات أعمال ربع سنوية لجميع المورّدين الاستراتيجيين' },
      { en: 'Develop a joint business plan (JBP) template for strategic suppliers', ar: 'تطوير قالب خطة أعمال مشتركة للمورّدين الاستراتيجيين' },
    ],
    /* 1 */ [
      { en: 'Create a supplier scorecard measuring: OTIF, quality, cost, compliance', ar: 'إنشاء بطاقة تقييم مورّد تقيس: OTIF والجودة والتكلفة والامتثال' },
      { en: 'Issue scorecards to all strategic suppliers monthly (preferred: quarterly)', ar: 'إصدار بطاقات التقييم لجميع المورّدين الاستراتيجيين' },
      { en: 'Issue a formal CAR for any supplier scoring below 70% for 2 consecutive periods', ar: 'إصدار طلب إجراء تصحيحي رسمي لأي مورّد يسجّل أقل من 70% لفترتين متتاليتين' },
      { en: 'Define escalation trigger: when does a supplier get placed on "improvement watch"?', ar: 'تحديد محفّز التصعيد: متى يوضع المورّد على "قائمة مراقبة التحسين"؟' },
    ],
    /* 2 */ [
      { en: 'Calculate % of spend at single-source for each category', ar: 'حساب نسبة الإنفاق على المصدر الوحيد لكل فئة' },
      { en: 'Categorise: which single-source situations are strategic vs operational risk?', ar: 'التصنيف: أي حالات المصدر الوحيد تشكّل مخاطرة استراتيجية مقابل تشغيلية؟' },
      { en: 'Initiate dual-source for all critical, non-strategic sole-source categories', ar: 'بدء التوريد الثنائي لجميع فئات المصدر الوحيد الحرجة وغير الاستراتيجية' },
      { en: 'Set a policy: new strategic contracts cannot exceed 70% concentration', ar: 'تحديد سياسة: لا يجوز تجاوز تركيز 70% في العقود الاستراتيجية الجديدة' },
    ],
    /* 3 */ [
      { en: 'Identify 3 strategic suppliers with gaps that ISC / your team can help close', ar: 'تحديد 3 مورّدين استراتيجيين لديهم فجوات يمكن مساعدتهم في سدّها' },
      { en: 'Co-invest in capability development: training, process improvement, technology', ar: 'المشاركة في تطوير القدرات: التدريب والتحسين العملياتي والتكنولوجيا' },
      { en: 'Create a supplier innovation programme: annual idea submission + selection', ar: 'إنشاء برنامج ابتكار للمورّدين: تقديم أفكار سنوية + اختيار' },
      { en: 'Measure: supplier satisfaction score with your organisation (annual survey)', ar: 'القياس: درجة رضا المورّد عن مؤسستك (استطلاع سنوي)' },
    ],
    /* 4 */ [
      { en: 'Issue an ESG self-assessment questionnaire to all strategic suppliers', ar: 'إصدار استبيان تقييم ذاتي لـ ESG لجميع المورّدين الاستراتيجيين' },
      { en: 'Review Code of Conduct — ensure it covers labour, environment, and anti-corruption', ar: 'مراجعة مدوّنة السلوك — التأكّد من تغطيتها للعمالة والبيئة ومكافحة الفساد' },
      { en: 'Plan on-site ESG audit for top 5 strategic suppliers (risk-based)', ar: 'التخطيط للتدقيق الميداني على ESG لأعلى 5 مورّدين استراتيجيين' },
      { en: 'Include ESG performance in supplier scorecard with minimum threshold', ar: 'تضمين أداء ESG في بطاقة تقييم المورّد مع حدّ أدنى' },
    ],
  ],
  'resiliency': [
    /* 0 */ [
      { en: 'List your top 5 supply chain disruption risks ranked by likelihood × impact', ar: 'إدراج أعلى 5 مخاطر اضطراب في سلسلة الإمداد' },
      { en: 'For each risk: define trigger event, response owner, and first 24h actions', ar: 'لكل مخاطرة: تحديد الحدث المحفّز ومالك الاستجابة وإجراءات الـ 24 ساعة الأولى' },
      { en: 'Identify pre-qualified alternate suppliers or routes for each top risk', ar: 'تحديد موردين أو مسارات بديلة مؤهّلة مسبقاً لكل مخاطرة رئيسية' },
      { en: 'Document a 1-page response playbook for each scenario', ar: 'توثيق دليل استجابة من صفحة واحدة لكل سيناريو' },
      { en: 'Test the playbook with a tabletop exercise before a real disruption occurs', ar: 'اختبار الدليل في تمرين مكتبي قبل وقوع اضطراب حقيقي' },
    ],
    /* 1 */ [
      { en: 'Map all sea-freight routes currently transiting the Red Sea', ar: 'رسم جميع مسارات الشحن البحري العابرة بالبحر الأحمر' },
      { en: 'Pre-approve alternative routing options: Cape of Good Hope, air, land bridge', ar: 'الموافقة المسبقة على خيارات التوجيه البديل' },
      { en: 'Calculate cost delta for each alternate route — budget contingency', ar: 'حساب الفرق في التكلفة لكل مسار بديل — موازنة الطوارئ' },
      { en: 'Identify which items require a 30-day buffer stock if Red Sea closes', ar: 'تحديد الأصناف التي تتطلّب مخزون احتياطي لمدة 30 يوماً' },
      { en: 'Add disruption clause to logistics contracts: activation criteria + response SLA', ar: 'إضافة بند اضطراب في عقود الشحن' },
    ],
    /* 2 */ [
      { en: 'Map all logistics entry points currently used — identify concentration', ar: 'رسم جميع نقاط دخول الشحن المستخدمة حالياً — تحديد التركّز' },
      { en: 'Pre-qualify a second port or customs entry point for your top import categories', ar: 'تأهيل ميناء ثانٍ أو منفذ جمركي مسبقاً لأعلى فئات الاستيراد' },
      { en: 'Assess inland customs posts (Haradh, Al-Batha) as alternatives', ar: 'تقييم المنافذ الجمركية الداخلية كبدائل' },
      { en: 'For high-value critical items: assess air freight as contingency', ar: 'للأصناف الحرجة عالية القيمة: تقييم الشحن الجوي كخيار طوارئ' },
    ],
    /* 3 */ [
      { en: 'Build a "cost of disruption" model for your top 3 risk scenarios', ar: 'بناء نموذج "تكلفة الاضطراب" لأعلى 3 سيناريوهات مخاطر' },
      { en: 'Calculate the annual buffer stock investment required for each scenario', ar: 'حساب الاستثمار السنوي المطلوب في المخزون الاحتياطي لكل سيناريو' },
      { en: 'Model: cost of buffer stock vs cost of one disruption event — break-even', ar: 'نمذجة: تكلفة المخزون الاحتياطي مقابل تكلفة حدث اضطراب — نقطة التعادل' },
      { en: 'Present risk-adjusted ROI of resilience investment to leadership', ar: 'تقديم العائد على الاستثمار المعدّل بالمخاطر لاستثمار المرونة' },
    ],
  ],
  'value-engineering': [
    /* 0 */ [
      { en: 'Open every VE exercise with a Function Analysis: what must this item DO?', ar: 'فتح كل جلسة هندسة قيمة بتحليل وظيفي: ماذا يجب أن يفعل هذا الصنف؟' },
      { en: 'Separate "required functions" from "nice-to-have" features before any cost work', ar: 'فصل "الوظائف المطلوبة" عن الميزات "الاختيارية" قبل أي عمل على التكلفة' },
      { en: 'Invite Engineering and Quality to every VE session — not procurement alone', ar: 'دعوة الهندسة والجودة لكل جلسة هندسة قيمة' },
      { en: 'Document function verification for each VE change — sign off before implementation', ar: 'توثيق التحقّق الوظيفي لكل تغيير في هندسة القيمة — الاعتماد قبل التطبيق' },
    ],
    /* 1 */ [
      { en: 'Select your top 3 spend categories for initial should-cost modelling', ar: 'اختيار أعلى 3 فئات إنفاق للنمذجة الأولية للتكلفة المتوقّعة' },
      { en: 'For each category: identify raw material, labour, overhead, and margin components', ar: 'لكل فئة: تحديد المواد الخام والعمالة والتكاليف العامة ومكوّنات الهامش' },
      { en: 'Source GCC labour rates and published commodity prices for your inputs', ar: 'الحصول على معدّلات العمالة في الخليج وأسعار السلع المنشورة' },
      { en: 'Build a bottom-up should-cost model — compare to current supplier price', ar: 'بناء نموذج تكلفة متوقّعة من القاعدة إلى الأعلى — مقارنته بسعر المورّد الحالي' },
      { en: 'Use should-cost as the anchor in your next negotiation', ar: 'استخدام التكلفة المتوقّعة كمرساة في تفاوضك القادم' },
    ],
    /* 2 */ [
      { en: 'Audit material specifications for your top 5 spend categories', ar: 'مراجعة مواصفات المواد لأعلى 5 فئات إنفاق' },
      { en: 'For each spec, ask: does this requirement drive safety / compliance, or preference?', ar: 'لكل مواصفة: هل هذا المتطلب يدفع السلامة / الامتثال، أم هو تفضيل؟' },
      { en: 'Identify specs that can be relaxed without compromising function or compliance', ar: 'تحديد المواصفات التي يمكن تخفيفها دون المساس بالوظيفة أو الامتثال' },
      { en: 'Run a specification review workshop with engineering, quality, and procurement', ar: 'تنظيم ورشة مراجعة مواصفات مع الهندسة والجودة والمشتريات' },
    ],
    /* 3 */ [
      { en: 'Review last 12 months of VE ideas: what % were implemented? Why rejected?', ar: 'مراجعة أفكار هندسة القيمة لـ 12 شهراً الماضية' },
      { en: 'Shorten the approval cycle: < 30 days from submission to decision', ar: 'تقصير دورة الاعتماد: أقل من 30 يوماً من التقديم إلى القرار' },
      { en: 'Create a VE idea tracker — visible to all contributors', ar: 'إنشاء أداة تتبّع أفكار هندسة القيمة — مرئية لجميع المساهمين' },
      { en: 'Celebrate implemented VE wins — recognise contributors publicly', ar: 'الاحتفال بانتصارات هندسة القيمة المطبّقة — الاعتراف بالمساهمين علناً' },
    ],
  ],
  'process-improvement-policy': [
    /* 0 */ [
      { en: 'List the top 10 processes your team runs that have no written SOP', ar: 'إدراج أعلى 10 عمليات يديرها فريقك دون إجراء تشغيل معياري مكتوب' },
      { en: 'Prioritise: which 3 processes cause the most variation or errors?', ar: 'ترتيب الأولويات: أي 3 عمليات تسبّب أكثر تبايناً أو أخطاء؟' },
      { en: 'Run a 2-hour process capture workshop with the people who actually do the work', ar: 'تنظيم ورشة التقاط عملية مع من ينفّذ العمل فعلياً' },
      { en: 'Draft the SOP in plain language with a swim-lane diagram', ar: 'صياغة الإجراء التشغيلي المعياري بلغة بسيطة مع مخطط مسارات السباحة' },
      { en: 'Validate with operations team and get sign-off from process owner', ar: 'التحقّق مع فريق العمليات والحصول على اعتماد مالك العملية' },
    ],
    /* 1 */ [
      { en: "Interview 3 front-line staff: why don't they follow the SOP?", ar: 'إجراء مقابلات مع 3 موظفين في الخطوط الأمامية: لماذا لا يتبعون الإجراء؟' },
      { en: 'Identify: is the issue in the SOP design, training, or enforcement?', ar: 'التحديد: هل المشكلة في تصميم الإجراء أم التدريب أم التطبيق؟' },
      { en: 'Redesign the SOP with process owners — remove steps that add no value', ar: 'إعادة تصميم الإجراء مع أصحاب العملية — إزالة الخطوات التي لا تضيف قيمة' },
      { en: 'Integrate the SOP into ERP workflow — system enforces the process', ar: 'دمج الإجراء في سير عمل ERP — النظام يفرض العملية' },
      { en: 'Measure compliance rate monthly: % of transactions following the SOP', ar: 'قياس معدّل الامتثال شهرياً' },
    ],
    /* 2 */ [
      { en: 'Map the entire approval flow — record time at each step over 10 transactions', ar: 'رسم مسار الاعتماد بالكامل — تسجيل الوقت في كل خطوة' },
      { en: 'Identify the bottleneck step consuming >40% of total cycle time', ar: 'تحديد خطوة الاختناق التي تستهلك أكثر من 40% من إجمالي زمن الدورة' },
      { en: 'Challenge every approval layer: what risk does it actually mitigate?', ar: 'التشكيك في كل طبقة اعتماد: ما المخاطرة التي تخفّفها فعلياً؟' },
      { en: 'Simplify DoA: items <SAR 50K approved by one level, not three', ar: 'تبسيط تفويض الصلاحيات' },
    ],
    /* 3 */ [
      { en: 'Audit current policies against PDPL requirements: gaps in data handling?', ar: 'مراجعة السياسات الحالية مقابل متطلبات نظام حماية البيانات الشخصية' },
      { en: 'Map procurement data flows: what personal data is collected from suppliers/vendors?', ar: 'رسم تدفّقات بيانات المشتريات: ما البيانات الشخصية المجمَّعة؟' },
      { en: 'Draft a Digital Procurement Policy covering e-invoicing, e-signatures, and data retention', ar: 'صياغة سياسة المشتريات الرقمية' },
      { en: 'Align all policies to Vision 2030 procurement targets — document alignment', ar: 'مواءمة جميع السياسات مع أهداف مشتريات رؤية 2030' },
    ],
  ],
  'training-capability-building': [
    /* 0 */ [
      { en: "Run a competency gap assessment against your team's job requirements", ar: 'إجراء تقييم فجوة الكفاءات مقابل متطلبات وظائف فريقك' },
      { en: 'Rank gaps by business impact — focus training budget on highest-impact gaps', ar: 'ترتيب الفجوات حسب الأثر على الأعمال' },
      { en: 'Design role-specific learning pathways (not a one-size-fits-all programme)', ar: 'تصميم مسارات تعلّم محدّدة لكل دور' },
      { en: 'Define 3 measurable outcomes per training module (behaviour change, KPI impact)', ar: 'تحديد 3 نتائج قابلة للقياس لكل وحدة تدريبية' },
      { en: 'Implement Kirkpatrick Level 1–4 evaluation for every programme', ar: 'تطبيق تقييم كيركباتريك من المستوى 1 إلى 4 لكل برنامج' },
    ],
    /* 1 */ [
      { en: 'Design a procurement career ladder: Junior Buyer → Category Mgr → CPO', ar: 'تصميم سلّم مهني للمشتريات' },
      { en: 'Map each career stage to CIPS qualification level (L2 → L4 → L6)', ar: 'ربط كل مرحلة مهنية بمستوى مؤهّل CIPS' },
      { en: 'Apply for Tamheer / Hadaf co-funding for CIPS study support', ar: 'التقدّم للتمويل المشترك من Tamheer / هدف' },
      { en: 'Partner with CIPS Arabia for Arabic-language certification delivery', ar: 'الشراكة مع CIPS Arabia للشهادات باللغة العربية' },
    ],
    /* 2 */ [
      { en: 'Survey team: preferred training language (Arabic / English / bilingual)', ar: 'استطلاع الفريق: لغة التدريب المفضّلة' },
      { en: 'Source bilingual training materials for all core procurement topics', ar: 'الحصول على مواد تدريبية ثنائية اللغة' },
      { en: 'Allow code-switching (Arabic/English) during group discussions', ar: 'السماح بالتبديل بين اللغتين خلال النقاشات الجماعية' },
      { en: 'Use GCC case studies and examples — not Western corporate case studies', ar: 'استخدام دراسات حالة وأمثلة من الخليج' },
    ],
    /* 3 */ [
      { en: 'Implement pre-training knowledge assessment for every programme (baseline)', ar: 'تطبيق تقييم معرفة قبل التدريب لكل برنامج' },
      { en: 'Run a post-training assessment immediately after and at 90 days', ar: 'إجراء تقييم بعد التدريب مباشرةً وبعد 90 يوماً' },
      { en: 'Define 2–3 on-the-job behaviour indicators to observe at 90 days', ar: 'تحديد مؤشرات سلوكية في العمل للملاحظة عند 90 يوماً' },
      { en: 'Track KPI improvement attributable to training — report to leadership', ar: 'تتبّع تحسّن مؤشرات الأداء العائد إلى التدريب' },
      { en: 'Calculate training ROI: (KPI value improvement - training cost) / training cost', ar: 'حساب العائد على الاستثمار في التدريب' },
    ],
  ],
};

// ─── Challenge-specific impact calculators ────────────────────────────────────

type CT = { title: string; titleAr: string; fields: ParamField[]; compute: (v: Record<string, string>) => ComputeResult };

function pct(v: string) { return parseFloat(v) || 0; }
function sar(v: string) { return parseFloat(v) || 0; }
function score(v: string) { return Math.min(5, Math.max(1, parseFloat(v) || 0)); }
function color3(val: number, goodThresh: number, badThresh: number, higherIsBetter = true): string {
  if (higherIsBetter) return val >= goodThresh ? '#059669' : val >= badThresh ? '#d97706' : '#dc2626';
  return val <= goodThresh ? '#059669' : val <= badThresh ? '#d97706' : '#dc2626';
}

const CHALLENGE_TOOLS: Record<string, (CT | null)[]> = {
  'supply-chain-strategy': [
    /* 0 — IBP Readiness Scorer */
    { title: 'IBP Readiness Scorer', titleAr: 'مقيّم جاهزية IBP',
      fields: [
        { id: 'demand', label: 'Demand review process maturity (1–5)', labelAr: 'نضج مراجعة الطلب (1–5)', type: 'number', min: 1, max: 5 },
        { id: 'supply', label: 'Supply planning maturity (1–5)', labelAr: 'نضج تخطيط العرض (1–5)', type: 'number', min: 1, max: 5 },
        { id: 'exec', label: 'Executive alignment maturity (1–5)', labelAr: 'نضج المواءمة التنفيذية (1–5)', type: 'number', min: 1, max: 5 },
        { id: 'data', label: 'Data / single-truth maturity (1–5)', labelAr: 'نضج البيانات / مصدر الحقيقة (1–5)', type: 'number', min: 1, max: 5 },
        { id: 'cadence', label: 'Meeting cadence & discipline (1–5)', labelAr: 'انتظام الاجتماعات (1–5)', type: 'number', min: 1, max: 5 },
      ],
      compute: v => {
        const vals = ['demand','supply','exec','data','cadence'].map(k => score(v[k]));
        const avg = vals.reduce((a,b)=>a+b,0)/5;
        const c = color3(avg, 4, 2.5);
        return [
          { label: 'IBP Readiness', labelAr: 'جاهزية IBP', value: `${avg.toFixed(1)}/5`, color: c },
          { label: 'Level', labelAr: 'المستوى', value: avg>=4?'Advanced':avg>=3?'Developing':'Initial', color: c },
          { label: '% IBP-Ready', labelAr: '% الجاهزية', value: `${Math.round((avg/5)*100)}%`, color: c, desc: 'Target: ≥80%', descAr: 'الهدف: ≥80%' },
        ];
      },
    },
    /* 1 — SCOR KPI Gap */
    { title: 'SCOR KPI Gap Calculator', titleAr: 'حاسبة فجوة مؤشرات SCOR',
      fields: [
        { id: 'otif', label: 'Your OTIF % (actual)', labelAr: 'OTIF الفعلي %', type: 'number', unit: '%', unitAr: '%' },
        { id: 'c2c', label: 'Cash-to-Cash Cycle (days)', labelAr: 'دورة النقد للنقد (أيام)', type: 'number', unit: 'days', unitAr: 'أيام' },
        { id: 'cost', label: 'SC Cost (% of revenue)', labelAr: 'تكلفة SC (% الإيراد)', type: 'number', unit: '%', unitAr: '%' },
      ],
      compute: v => {
        const results: ComputeResult = [];
        const o = pct(v.otif), c = pct(v.c2c), co = pct(v.cost);
        if (o) results.push({ label: 'OTIF Gap vs GCC Best (95%)', labelAr: 'فجوة OTIF مقابل 95%', value: `${Math.max(0,95-o).toFixed(1)}pp`, color: color3(o,90,80) });
        if (c) results.push({ label: 'C2C Excess vs GCC (45d)', labelAr: 'زيادة C2C مقابل المعيار 45 يوم', value: `+${Math.max(0,c-45)} days`, color: color3(c,45,70,false) });
        if (co) results.push({ label: 'SC Cost Gap vs GCC (8%)', labelAr: 'فجوة تكلفة SC مقابل 8%', value: `+${Math.max(0,co-8).toFixed(1)}pp`, color: color3(co,8,12,false) });
        return results;
      },
    },
    /* 2 — Strategy-SC Alignment */
    { title: 'Strategy–SC Alignment Score', titleAr: 'درجة مواءمة الاستراتيجية مع SC',
      fields: [
        { id: 'visibility', label: 'SC goals visible to all teams (1–5)', labelAr: 'رؤية أهداف SC لجميع الفرق (1–5)', type: 'number', min: 1, max: 5 },
        { id: 'kpi', label: 'SC KPIs linked to corporate KPIs (1–5)', labelAr: 'مؤشرات SC مرتبطة بالأهداف المؤسسية (1–5)', type: 'number', min: 1, max: 5 },
        { id: 'invest', label: 'SC investment tied to corporate priorities (1–5)', labelAr: 'استثمار SC مرتبط بالأولويات (1–5)', type: 'number', min: 1, max: 5 },
        { id: 'review', label: 'SC reviewed at board/exec level (1–5)', labelAr: 'SC مراجَع على مستوى الإدارة (1–5)', type: 'number', min: 1, max: 5 },
      ],
      compute: v => {
        const vals = ['visibility','kpi','invest','review'].map(k => score(v[k]));
        const avg = vals.reduce((a,b)=>a+b,0)/4;
        const c = color3(avg, 4, 2.5);
        return [
          { label: 'Alignment Score', labelAr: 'درجة المواءمة', value: `${avg.toFixed(1)}/5`, color: c },
          { label: 'Integration Level', labelAr: 'مستوى التكامل', value: avg>=4?'Strong':avg>=2.5?'Partial':'Weak', color: c },
        ];
      },
    },
    /* 3 — Concentration Risk */
    { title: 'Supply Concentration Risk', titleAr: 'مخاطر تركّز التوريد',
      fields: [
        { id: 'top1', label: 'Top supplier spend (SAR)', labelAr: 'إنفاق أكبر مورّد (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
        { id: 'total', label: 'Total category spend (SAR)', labelAr: 'إجمالي إنفاق الفئة (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
        { id: 'crit', label: 'Category criticality (1=low, 5=critical)', labelAr: 'أهمية الفئة (1=منخفض، 5=حرج)', type: 'number', min: 1, max: 5 },
      ],
      compute: v => {
        const t = sar(v.top1), tot = sar(v.total), crit = score(v.crit);
        if (!t || !tot) return [];
        const conc = Math.round((t/tot)*100);
        const risk = Math.round((conc/100)*(crit/5)*100);
        return [
          { label: 'Concentration %', labelAr: 'نسبة التركّز', value: `${conc}%`, color: color3(conc,40,60,false) },
          { label: 'Risk Score', labelAr: 'درجة المخاطرة', value: `${risk}/100`, color: color3(risk,35,60,false) },
          { label: 'Risk Level', labelAr: 'مستوى المخاطرة', value: risk>=60?'Critical':risk>=35?'High':'Acceptable', color: color3(risk,35,60,false) },
        ];
      },
    },
    /* 4 — Data Quality */
    { title: 'ERP Data Quality Scorecard', titleAr: 'بطاقة جودة بيانات ERP',
      fields: [
        { id: 'comp', label: 'Completeness (% required fields populated)', labelAr: 'الاكتمال (% الحقول المملوءة)', type: 'number', unit: '%', unitAr: '%' },
        { id: 'acc', label: 'Accuracy (% records error-free)', labelAr: 'الدقة (% السجلات الخالية من الأخطاء)', type: 'number', unit: '%', unitAr: '%' },
        { id: 'timely', label: 'Timeliness (% updated within SLA)', labelAr: 'التوقيت (% المحدَّث ضمن SLA)', type: 'number', unit: '%', unitAr: '%' },
        { id: 'cons', label: 'Consistency (% matching across systems)', labelAr: 'الاتساق (% المتطابق عبر الأنظمة)', type: 'number', unit: '%', unitAr: '%' },
      ],
      compute: v => {
        const vals = ['comp','acc','timely','cons'].map(k => pct(v[k])).filter(x => x>0);
        if (!vals.length) return [];
        const avg = vals.reduce((a,b)=>a+b,0)/vals.length;
        return [
          { label: 'Data Quality Score', labelAr: 'درجة جودة البيانات', value: `${avg.toFixed(0)}%`, color: color3(avg,90,70) },
          { label: 'Quality Level', labelAr: 'مستوى الجودة', value: avg>=90?'Excellent':avg>=70?'Acceptable':'Poor', color: color3(avg,90,70) },
        ];
      },
    },
  ],
  'procurement-excellence': [
    /* 0 — Category Coverage */
    { title: 'Category Strategy Coverage', titleAr: 'تغطية استراتيجية الفئات',
      fields: [
        { id: 'total', label: 'Total spend categories in scope', labelAr: 'إجمالي فئات الإنفاق', type: 'number' },
        { id: 'covered', label: 'Categories with an active strategy', labelAr: 'الفئات ذات استراتيجية نشطة', type: 'number' },
        { id: 'spend', label: 'Total annual spend (SAR)', labelAr: 'إجمالي الإنفاق السنوي (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
      ],
      compute: v => {
        const tot = sar(v.total), cov = sar(v.covered), spend = sar(v.spend);
        if (!tot) return [];
        const pctCov = Math.round((cov/tot)*100);
        return [
          { label: 'Categories Covered', labelAr: 'الفئات المغطّاة', value: `${pctCov}%`, color: color3(pctCov,80,50) },
          { label: 'Gap', labelAr: 'الفجوة', value: `${tot-cov} categories without strategy`, color: '#d97706' },
          { label: 'Addressable Spend', labelAr: 'الإنفاق القابل للمعالجة', value: spend ? `SAR ${Math.round(spend*(1-pctCov/100)/1000)}K` : '—', color: '#082C6B' },
        ];
      },
    },
    /* 1 — Savings Pipeline */
    { title: 'Savings Impact Calculator', titleAr: 'حاسبة أثر الوفورات',
      fields: [
        { id: 'spend', label: 'Addressable annual spend (SAR)', labelAr: 'الإنفاق السنوي القابل للتوجيه (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
        { id: 'savingsPct', label: 'Expected savings % (industry: 3–8%)', labelAr: 'نسبة الوفورات المتوقّعة (3–8%)', type: 'number', unit: '%', unitAr: '%' },
        { id: 'confidence', label: 'Confidence level (1–5)', labelAr: 'مستوى الثقة (1–5)', type: 'number', min: 1, max: 5 },
      ],
      compute: v => {
        const s = sar(v.spend), p = pct(v.savingsPct), conf = score(v.confidence);
        if (!s || !p) return [];
        const raw = s * (p/100);
        const adj = raw * (conf/5);
        return [
          { label: 'Gross Savings Opportunity', labelAr: 'فرصة الوفورات الإجمالية', value: `SAR ${Math.round(raw/1000)}K`, color: '#059669' },
          { label: 'Risk-Adjusted Savings', labelAr: 'الوفورات المعدّلة بالمخاطر', value: `SAR ${Math.round(adj/1000)}K`, color: '#082C6B' },
          { label: 'Savings as % Revenue', labelAr: 'الوفورات كنسبة من الإيراد', value: `${p.toFixed(1)}% of addressable spend`, color: '#4f46e5' },
        ];
      },
    },
    /* 2 — Maverick Spend */
    { title: 'Maverick Spend Calculator', titleAr: 'حاسبة الإنفاق خارج القنوات',
      fields: [
        { id: 'maverick', label: 'Maverick spend last 12 months (SAR)', labelAr: 'الإنفاق خارج القنوات (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
        { id: 'total', label: 'Total procurement spend (SAR)', labelAr: 'إجمالي إنفاق المشتريات (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
        { id: 'pricePremium', label: 'Avg price premium on maverick buys (%)', labelAr: 'العلاوة السعرية على المشتريات الخارجة (%)', type: 'number', unit: '%', unitAr: '%' },
      ],
      compute: v => {
        const m = sar(v.maverick), tot = sar(v.total), prem = pct(v.pricePremium)||15;
        if (!m) return [];
        const mPct = tot ? Math.round((m/tot)*100) : 0;
        const waste = m * (prem/100);
        return [
          { label: 'Maverick Spend %', labelAr: 'نسبة الإنفاق الخارج', value: `${mPct}%`, color: color3(mPct,10,25,false) },
          { label: 'Estimated Overspend', labelAr: 'الإنفاق الزائد التقديري', value: `SAR ${Math.round(waste/1000)}K/yr`, color: '#dc2626' },
          { label: 'Recoverable Savings', labelAr: 'الوفورات القابلة للاسترداد', value: `SAR ${Math.round(waste*0.7/1000)}K`, color: '#059669', desc: 'Assuming 70% recovery', descAr: 'افتراض استرداد 70%' },
        ];
      },
    },
    /* 3 — OTIF Scorer */
    { title: 'Supplier OTIF Performance Analyser', titleAr: 'محلّل أداء OTIF للمورّدين',
      fields: [
        { id: 'otif', label: 'Current average OTIF % (your suppliers)', labelAr: 'OTIF الحالي لمورّديك %', type: 'number', unit: '%', unitAr: '%' },
        { id: 'strategic', label: 'Strategic supplier OTIF %', labelAr: 'OTIF المورّدين الاستراتيجيين %', type: 'number', unit: '%', unitAr: '%' },
        { id: 'annualSpend', label: 'Annual spend with low-OTIF suppliers (SAR)', labelAr: 'الإنفاق مع المورّدين منخفضي OTIF (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
      ],
      compute: v => {
        const o = pct(v.otif), s = pct(v.strategic), spend = sar(v.annualSpend);
        const results: ComputeResult = [];
        if (o) results.push({ label: 'Avg OTIF vs GCC Best (95%)', labelAr: 'OTIF مقابل أفضل الخليج (95%)', value: `${o.toFixed(0)}% (gap: ${Math.max(0,95-o).toFixed(0)}pp)`, color: color3(o,90,80) });
        if (s) results.push({ label: 'Strategic Supplier OTIF', labelAr: 'OTIF المورّدين الاستراتيجيين', value: `${s.toFixed(0)}%`, color: color3(s,90,80) });
        if (spend && o) results.push({ label: 'Cost of Poor OTIF (est.)', labelAr: 'تكلفة ضعف OTIF (تقديري)', value: `SAR ${Math.round(spend*(1-o/100)*0.15/1000)}K/yr`, color: '#dc2626', desc: '15% expedite/impact estimate', descAr: 'تقدير 15% للتعجيل والأثر' });
        return results;
      },
    },
    /* 4 — TCO vs Unit Price */
    { title: 'TCO vs Unit Price Quick Model', titleAr: 'نموذج TCO مقابل سعر الوحدة',
      fields: [
        { id: 'unitPrice', label: 'Unit purchase price (SAR)', labelAr: 'سعر الوحدة (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
        { id: 'freight', label: 'Freight cost per unit (SAR)', labelAr: 'تكلفة الشحن للوحدة (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
        { id: 'quality', label: 'Quality / rework cost per unit (SAR)', labelAr: 'تكلفة الجودة / إعادة العمل للوحدة (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
        { id: 'admin', label: 'Admin / transaction cost per unit (SAR)', labelAr: 'التكلفة الإدارية للوحدة (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
      ],
      compute: v => {
        const u = sar(v.unitPrice); if (!u) return [];
        const f = sar(v.freight), q = sar(v.quality), a = sar(v.admin);
        const tco = u + f + q + a;
        const premium = Math.round(((tco-u)/u)*100);
        return [
          { label: 'Unit Purchase Price', labelAr: 'سعر الوحدة', value: `SAR ${u.toFixed(2)}`, color: '#082C6B' },
          { label: 'Total Cost of Ownership', labelAr: 'التكلفة الإجمالية للملكية', value: `SAR ${tco.toFixed(2)}`, color: '#dc2626' },
          { label: 'Hidden Cost Premium', labelAr: 'العلاوة الخفية', value: `+${premium}% above unit price`, color: premium>20?'#dc2626':'#d97706' },
        ];
      },
    },
  ],
  'risk-management-solution': [
    /* 0 — KRI Coverage */
    { title: 'KRI Programme Maturity', titleAr: 'نضج برنامج مؤشرات المخاطر',
      fields: [
        { id: 'defined', label: '# KRIs defined', labelAr: 'عدد مؤشرات المخاطر المحدّدة', type: 'number' },
        { id: 'owned', label: '# KRIs with a named owner', labelAr: 'عدد المؤشرات ذات مالك مسمّى', type: 'number' },
        { id: 'thresholds', label: '# KRIs with amber/red thresholds', labelAr: 'عدد المؤشرات ذات عتبات محدّدة', type: 'number' },
        { id: 'reviewed', label: 'Last reviewed (days ago)', labelAr: 'آخر مراجعة (أيام مضت)', type: 'number', unit: 'days', unitAr: 'أيام' },
      ],
      compute: v => {
        const def = sar(v.defined)||1, own = sar(v.owned), thr = sar(v.thresholds), rev = sar(v.reviewed);
        const ownPct = Math.round((own/def)*100), thrPct = Math.round((thr/def)*100);
        const score = Math.round((ownPct+thrPct+(rev<=7?100:rev<=30?60:20))/3);
        return [
          { label: 'KRIs with Owners', labelAr: 'المؤشرات ذات مالكين', value: `${ownPct}%`, color: color3(ownPct,80,50) },
          { label: 'KRIs with Thresholds', labelAr: 'المؤشرات ذات عتبات', value: `${thrPct}%`, color: color3(thrPct,80,50) },
          { label: 'Programme Maturity', labelAr: 'نضج البرنامج', value: `${score}/100`, color: color3(score,80,50) },
        ];
      },
    },
    /* 1 — Tier-2 Visibility */
    { title: 'Tier-2 Visibility Coverage', titleAr: 'تغطية رؤية المستوى الثاني',
      fields: [
        { id: 'tier1', label: '# Tier-1 strategic suppliers', labelAr: 'عدد مورّدي المستوى الأول الاستراتيجيين', type: 'number' },
        { id: 'disclosed', label: '# who have disclosed Tier-2', labelAr: 'عدد من أفصحوا عن مورّدي المستوى الثاني', type: 'number' },
        { id: 'highrisk', label: '# Tier-2 in high-risk geographies', labelAr: 'عدد مورّدي المستوى الثاني في مناطق عالية الخطورة', type: 'number' },
      ],
      compute: v => {
        const t1 = sar(v.tier1)||1, disc = sar(v.disclosed), hr = sar(v.highrisk);
        const visPct = Math.round((disc/t1)*100);
        return [
          { label: 'Tier-2 Visibility', labelAr: 'رؤية المستوى الثاني', value: `${visPct}%`, color: color3(visPct,80,50) },
          { label: 'Blind Spots', labelAr: 'البقع العمياء', value: `${t1-disc} Tier-1 suppliers undisclosed`, color: (t1-disc)>0?'#d97706':'#059669' },
          { label: 'High-Risk Tier-2', labelAr: 'مورّدو الخطر الجيوسياسي', value: `${hr} flagged`, color: hr>0?'#dc2626':'#059669' },
        ];
      },
    },
    /* 2 — Register Health */
    { title: 'Risk Register Health Score', titleAr: 'درجة صحة سجلّ المخاطر',
      fields: [
        { id: 'total', label: '# risks in register', labelAr: 'عدد المخاطر في السجلّ', type: 'number' },
        { id: 'owned', label: '# with named owner', labelAr: 'عدد ذات مالك مسمّى', type: 'number' },
        { id: 'overdue', label: '# overdue mitigation actions', labelAr: 'عدد إجراءات التخفيف المتأخرة', type: 'number' },
        { id: 'daysSince', label: 'Days since last full review', labelAr: 'أيام منذ آخر مراجعة شاملة', type: 'number', unit: 'days', unitAr: 'أيام' },
      ],
      compute: v => {
        const tot = sar(v.total)||1, own = sar(v.owned), over = sar(v.overdue), days = sar(v.daysSince);
        const ownPct = Math.round((own/tot)*100);
        const freshScore = days<=30?100:days<=90?60:days<=180?30:0;
        const health = Math.round((ownPct + (over===0?100:over<3?60:20) + freshScore)/3);
        return [
          { label: 'Ownership Coverage', labelAr: 'تغطية الملكية', value: `${ownPct}%`, color: color3(ownPct,90,70) },
          { label: 'Overdue Actions', labelAr: 'الإجراءات المتأخرة', value: over.toString(), color: over===0?'#059669':over<3?'#d97706':'#dc2626' },
          { label: 'Register Health', labelAr: 'صحة السجلّ', value: `${health}/100`, color: color3(health,80,50) },
        ];
      },
    },
    /* 3 — Sole-Source Exposure */
    { title: 'Sole-Source Exposure Calculator', titleAr: 'حاسبة التعرّض للمصدر الوحيد',
      fields: [
        { id: 'ssSpend', label: 'Sole-source spend (SAR)', labelAr: 'إنفاق المصدر الوحيد (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
        { id: 'total', label: 'Total procurement spend (SAR)', labelAr: 'إجمالي إنفاق المشتريات (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
        { id: 'critItems', label: '# critical sole-source items with no BCP', labelAr: 'عدد الأصناف الحرجة أحادية المصدر دون خطة استمرارية', type: 'number' },
      ],
      compute: v => {
        const ss = sar(v.ssSpend), tot = sar(v.total), crit = sar(v.critItems);
        if (!ss || !tot) return [];
        const ssPct = Math.round((ss/tot)*100);
        return [
          { label: 'Sole-Source %', labelAr: 'نسبة المصدر الوحيد', value: `${ssPct}%`, color: color3(ssPct,20,40,false) },
          { label: 'Spend at Risk', labelAr: 'الإنفاق المعرّض للخطر', value: `SAR ${Math.round(ss/1000)}K`, color: '#dc2626' },
          { label: 'Unprotected Critical Items', labelAr: 'الأصناف الحرجة غير المحمية', value: `${crit} items`, color: crit>0?'#dc2626':'#059669' },
        ];
      },
    },
    /* 4 — BCP Coverage */
    { title: 'BCP Coverage & Readiness', titleAr: 'تغطية خطة استمرارية الأعمال وجاهزيتها',
      fields: [
        { id: 'critItems', label: '# critical supply items', labelAr: 'عدد الأصناف الحرجة', type: 'number' },
        { id: 'bcpItems', label: '# with a tested BCP', labelAr: 'عدد الأصناف ذات خطة استمرارية مختبرة', type: 'number' },
        { id: 'lastTest', label: 'Last BCP tabletop exercise (months ago)', labelAr: 'آخر تمرين مكتبي (أشهر مضت)', type: 'number', unit: 'months', unitAr: 'أشهر' },
      ],
      compute: v => {
        const crit = sar(v.critItems)||1, bcp = sar(v.bcpItems), last = sar(v.lastTest);
        const covPct = Math.round((bcp/crit)*100);
        const readiness = covPct*0.6 + (last<=6?40:last<=12?20:0);
        return [
          { label: 'BCP Coverage', labelAr: 'تغطية خطة الاستمرارية', value: `${covPct}%`, color: color3(covPct,80,50) },
          { label: 'Unprotected Items', labelAr: 'الأصناف غير المحمية', value: `${crit-bcp} critical items`, color: (crit-bcp)>0?'#dc2626':'#059669' },
          { label: 'Overall Readiness', labelAr: 'الجاهزية الإجمالية', value: `${Math.min(100,Math.round(readiness))}/100`, color: color3(readiness,80,50) },
        ];
      },
    },
  ],
  'lean-agile-supply-chain': [
    /* 0 — PCE Calculator */
    { title: 'Process Cycle Efficiency (PCE)', titleAr: 'كفاءة دورة العملية (PCE)',
      fields: [
        { id: 'va', label: 'Value-added time (hours)', labelAr: 'وقت القيمة المضافة (ساعات)', type: 'number', unit: 'hrs', unitAr: 'ساعة' },
        { id: 'total', label: 'Total lead time (hours)', labelAr: 'إجمالي مهلة التوريد (ساعات)', type: 'number', unit: 'hrs', unitAr: 'ساعة' },
        { id: 'target', label: 'Target PCE % (world class: 25%+)', labelAr: 'هدف PCE % (عالمي: 25%+)', type: 'number', unit: '%', unitAr: '%' },
      ],
      compute: v => {
        const va = sar(v.va), tot = sar(v.total)||1, tgt = pct(v.target)||25;
        const pce = Math.round((va/tot)*100);
        const wastedHrs = tot - va;
        return [
          { label: 'Current PCE', labelAr: 'PCE الحالي', value: `${pce}%`, color: color3(pce,25,10) },
          { label: 'NVA / Wasted Time', labelAr: 'الوقت الضائع', value: `${wastedHrs.toFixed(1)} hrs`, color: '#dc2626' },
          { label: 'Gap to Target', labelAr: 'الفجوة مقابل الهدف', value: `${Math.max(0,tgt-pce)}pp to close`, color: color3(pce,tgt,tgt*0.6) },
        ];
      },
    },
    /* 1 — Bullwhip Ratio */
    { title: 'Bullwhip Effect Ratio', titleAr: 'نسبة تضخيم أثر السوط',
      fields: [
        { id: 'orderVar', label: 'Order variability (std dev / mean %)', labelAr: 'تباين الطلبات (انحراف معياري / متوسط %)', type: 'number', unit: '%', unitAr: '%' },
        { id: 'demandVar', label: 'End-customer demand variability (%)', labelAr: 'تباين طلب العميل النهائي (%)', type: 'number', unit: '%', unitAr: '%' },
      ],
      compute: v => {
        const o = pct(v.orderVar), d = pct(v.demandVar)||1;
        const ratio = o/d;
        return [
          { label: 'Bullwhip Ratio', labelAr: 'نسبة التضخيم', value: ratio.toFixed(2)+'×', color: color3(ratio,1.5,2.5,false) },
          { label: 'Amplification', labelAr: 'مستوى التضخيم', value: ratio<=1.5?'Controlled':ratio<=2.5?'Moderate':'Severe', color: color3(ratio,1.5,2.5,false) },
          { label: 'Inventory Impact', labelAr: 'أثر المخزون', value: ratio>1 ? `${Math.round((ratio-1)*100)}% excess buffer needed` : 'Demand-driven', color: ratio>2?'#dc2626':'#d97706' },
        ];
      },
    },
    /* 2 — Cross-Functional Alignment */
    { title: 'Cross-Functional Alignment Score', titleAr: 'درجة التوافق الوظيفي المتعدّد',
      fields: [
        { id: 'sharedKpi', label: 'Shared KPI ownership (1–5)', labelAr: 'امتلاك مؤشر أداء مشترك (1–5)', type: 'number', min: 1, max: 5 },
        { id: 'cadence', label: 'Joint meeting cadence (1–5)', labelAr: 'انتظام الاجتماعات المشتركة (1–5)', type: 'number', min: 1, max: 5 },
        { id: 'conflict', label: 'Inter-department conflict frequency (5=high, 1=low)', labelAr: 'تكرار النزاعات بين الأقسام (5=مرتفع)', type: 'number', min: 1, max: 5 },
        { id: 'data', label: 'Shared data / single source of truth (1–5)', labelAr: 'بيانات مشتركة / مصدر حقيقة واحد (1–5)', type: 'number', min: 1, max: 5 },
      ],
      compute: v => {
        const s = score(v.sharedKpi), c = score(v.cadence), conf = 6-score(v.conflict), d = score(v.data);
        const avg = (s+c+conf+d)/4;
        return [
          { label: 'Alignment Score', labelAr: 'درجة التوافق', value: `${avg.toFixed(1)}/5`, color: color3(avg,4,2.5) },
          { label: 'Level', labelAr: 'المستوى', value: avg>=4?'High-Performance':avg>=2.5?'Functional':'Siloed', color: color3(avg,4,2.5) },
        ];
      },
    },
    /* 3 — Cost of Poor Quality */
    { title: 'Cost of Poor Quality (COPQ)', titleAr: 'تكلفة ضعف الجودة (COPQ)',
      fields: [
        { id: 'reworkHrs', label: 'Monthly rework hours', labelAr: 'ساعات إعادة العمل الشهرية', type: 'number', unit: 'hrs', unitAr: 'ساعة' },
        { id: 'hourlyRate', label: 'Avg hourly cost (SAR)', labelAr: 'متوسط التكلفة بالساعة (ر.س)', type: 'number', unit: 'SAR/hr', unitAr: 'ر.س/ساعة' },
        { id: 'scrap', label: 'Monthly scrap / waste (SAR)', labelAr: 'الخردة / الهدر الشهري (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
        { id: 'returns', label: 'Monthly customer returns cost (SAR)', labelAr: 'تكلفة مرتجعات العملاء الشهرية (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
      ],
      compute: v => {
        const rw = sar(v.reworkHrs)*sar(v.hourlyRate), sc = sar(v.scrap), ret = sar(v.returns);
        const monthly = rw+sc+ret;
        return [
          { label: 'Monthly COPQ', labelAr: 'COPQ الشهري', value: `SAR ${Math.round(monthly/1000)}K`, color: '#dc2626' },
          { label: 'Annual COPQ', labelAr: 'COPQ السنوي', value: `SAR ${Math.round(monthly*12/1000)}K`, color: '#dc2626' },
          { label: 'COPQ Reduction Target (50%)', labelAr: 'هدف خفض COPQ (50%)', value: `SAR ${Math.round(monthly*12*0.5/1000)}K/yr saved`, color: '#059669' },
        ];
      },
    },
    /* 4 — Initiative Health */
    { title: 'Lean Initiative Health Check', titleAr: 'فحص صحة مبادرة Lean',
      fields: [
        { id: 'sponsor', label: 'Exec sponsor engagement (1–5)', labelAr: 'مشاركة الراعي التنفيذي (1–5)', type: 'number', min: 1, max: 5 },
        { id: 'resource', label: 'Dedicated resource availability (1–5)', labelAr: 'توافر الموارد المخصّصة (1–5)', type: 'number', min: 1, max: 5 },
        { id: 'cadence', label: 'Review cadence regularity (1–5)', labelAr: 'انتظام دورة المراجعة (1–5)', type: 'number', min: 1, max: 5 },
        { id: 'wins', label: '# visible wins communicated in last 3 months', labelAr: 'عدد الانتصارات المعلَنة خلال 3 أشهر', type: 'number' },
      ],
      compute: v => {
        const sp = score(v.sponsor), res = score(v.resource), cad = score(v.cadence), wins = Math.min(5, sar(v.wins));
        const health = Math.round(((sp+res+cad+wins)/20)*100);
        return [
          { label: 'Initiative Health', labelAr: 'صحة المبادرة', value: `${health}/100`, color: color3(health,75,50) },
          { label: 'Stall Risk', labelAr: 'خطر التوقّف', value: health>=75?'Low':health>=50?'Medium':'High', color: color3(health,75,50) },
          { label: 'Top Fix', labelAr: 'أولوية الإصلاح', value: Math.min(sp,res,cad)<3 ? (sp<=res&&sp<=cad?'Exec sponsorship':res<=cad?'Dedicated resource':'Review cadence') : 'Celebrate more wins!', color: '#082C6B' },
        ];
      },
    },
  ],
  'sustainability-esg': [
    /* 0 — Scope 3 Coverage */
    { title: 'Scope 3 Data Coverage Score', titleAr: 'درجة تغطية بيانات النطاق الثالث',
      fields: [
        { id: 'suppliers', label: '# strategic suppliers', labelAr: 'عدد المورّدين الاستراتيجيين', type: 'number' },
        { id: 'reporting', label: '# who report Scope 3 data', labelAr: 'عدد من يُبلّغون عن بيانات النطاق الثالث', type: 'number' },
        { id: 'spend', label: 'Total annual spend (SAR M)', labelAr: 'إجمالي الإنفاق السنوي (م ر.س)', type: 'number', unit: 'SAR M', unitAr: 'م ر.س' },
      ],
      compute: v => {
        const sup = sar(v.suppliers)||1, rep = sar(v.reporting), spend = sar(v.spend);
        const covPct = Math.round((rep/sup)*100);
        const estEmissions = spend * 0.35;
        return [
          { label: 'Supplier Data Coverage', labelAr: 'تغطية بيانات المورّدين', value: `${covPct}%`, color: color3(covPct,80,50) },
          { label: 'Blind-Spot Suppliers', labelAr: 'موردون بدون بيانات', value: `${sup-rep} unreported`, color: (sup-rep)>0?'#d97706':'#059669' },
          { label: 'Est. Scope 3 (spend-based)', labelAr: 'النطاق الثالث التقديري', value: spend ? `~${estEmissions.toFixed(0)} tCO₂e/yr` : '—', color: '#4f46e5', desc: 'Using DEFRA 0.35 kgCO₂e/SAR factor', descAr: 'باستخدام معامل DEFRA' },
        ];
      },
    },
    /* 1 — ESG ROI */
    { title: 'ESG Investment ROI', titleAr: 'العائد على الاستثمار في ESG',
      fields: [
        { id: 'riskCost', label: 'Est. annual ESG incident cost (SAR)', labelAr: 'تكلفة حوادث ESG السنوية التقديرية (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
        { id: 'greenFinance', label: 'Green finance interest saving/yr (SAR)', labelAr: 'وفر الفائدة من التمويل الأخضر (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
        { id: 'contractRevenue', label: 'ESG-dependent contract revenue (SAR)', labelAr: 'إيرادات العقود المرتبطة بـ ESG (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
        { id: 'programCost', label: 'Annual ESG programme cost (SAR)', labelAr: 'تكلفة برنامج ESG السنوية (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
      ],
      compute: v => {
        const risk = sar(v.riskCost)*0.5, gf = sar(v.greenFinance), rev = sar(v.contractRevenue)*0.05, cost = sar(v.programCost)||1;
        const benefit = risk+gf+rev;
        const roi = Math.round(((benefit-cost)/cost)*100);
        return [
          { label: 'Total Annual Benefit', labelAr: 'إجمالي الفائدة السنوية', value: `SAR ${Math.round(benefit/1000)}K`, color: '#059669' },
          { label: 'Programme Cost', labelAr: 'تكلفة البرنامج', value: `SAR ${Math.round(cost/1000)}K`, color: '#082C6B' },
          { label: 'ESG ROI', labelAr: 'العائد على الاستثمار في ESG', value: `${roi}%`, color: color3(roi,0,0) },
        ];
      },
    },
    /* 2 — Iktva Score */
    { title: 'Local Content / Iktva Score', titleAr: 'درجة المحتوى المحلي / إيكتفاء',
      fields: [
        { id: 'localSpend', label: 'Local supplier spend (SAR)', labelAr: 'إنفاق المورّدين المحليين (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
        { id: 'totalSpend', label: 'Total procurement spend (SAR)', labelAr: 'إجمالي إنفاق المشتريات (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
        { id: 'target', label: 'Required Iktva target (%)', labelAr: 'هدف إيكتفاء المطلوب (%)', type: 'number', unit: '%', unitAr: '%' },
      ],
      compute: v => {
        const loc = sar(v.localSpend), tot = sar(v.totalSpend)||1, tgt = pct(v.target)||70;
        const score = Math.round((loc/tot)*100);
        const gap = Math.max(0, tgt-score);
        const gapSar = Math.round((gap/100)*tot);
        return [
          { label: 'Current Local Content Score', labelAr: 'درجة المحتوى المحلي الحالية', value: `${score}%`, color: color3(score,tgt,tgt*0.7) },
          { label: 'Gap to Target', labelAr: 'الفجوة مقابل الهدف', value: `${gap}pp`, color: gap>20?'#dc2626':gap>10?'#d97706':'#059669' },
          { label: 'Spend to Redirect Locally', labelAr: 'الإنفاق المطلوب تحويله محلياً', value: `SAR ${Math.round(gapSar/1000)}K`, color: '#082C6B' },
        ];
      },
    },
    /* 3 — ESG Risk Score */
    { title: 'Supplier ESG Risk Exposure', titleAr: 'تعرّض المورّدين لمخاطر ESG',
      fields: [
        { id: 'screened', label: '# strategic suppliers ESG-screened', labelAr: 'عدد المورّدين الذين خضعوا لفحص ESG', type: 'number' },
        { id: 'total', label: '# total strategic suppliers', labelAr: 'إجمالي المورّدين الاستراتيجيين', type: 'number' },
        { id: 'highRisk', label: '# rated high ESG risk', labelAr: 'عدد المصنّفين بمخاطر ESG مرتفعة', type: 'number' },
      ],
      compute: v => {
        const sc = sar(v.screened), tot = sar(v.total)||1, hr = sar(v.highRisk);
        const covPct = Math.round((sc/tot)*100);
        const riskPct = sc ? Math.round((hr/sc)*100) : 0;
        return [
          { label: 'ESG Screening Coverage', labelAr: 'تغطية فحص ESG', value: `${covPct}%`, color: color3(covPct,80,50) },
          { label: 'High-Risk Suppliers', labelAr: 'الموردون عالو المخاطرة', value: `${hr} (${riskPct}% of screened)`, color: hr>0?'#dc2626':'#059669' },
          { label: 'Unscreened Exposure', labelAr: 'التعرّض دون فحص', value: `${tot-sc} not yet screened`, color: (tot-sc)>0?'#d97706':'#059669' },
        ];
      },
    },
    /* 4 — Carbon Target */
    { title: 'Carbon Reduction Target Builder', titleAr: 'بناء هدف خفض الكربون',
      fields: [
        { id: 'baseline', label: 'Current Scope 1+2 emissions (tCO₂e/yr)', labelAr: 'انبعاثات النطاق 1+2 الحالية (طن CO₂)', type: 'number', unit: 'tCO₂e', unitAr: 'طن CO₂' },
        { id: 'reductionPct', label: 'Target reduction % by 2030', labelAr: 'هدف الخفض % بحلول 2030', type: 'number', unit: '%', unitAr: '%' },
      ],
      compute: v => {
        const base = sar(v.baseline), tgt = pct(v.reductionPct)||42;
        if (!base) return [];
        const targetEmissions = base * (1-tgt/100);
        const annualReduction = (base-targetEmissions) / 6;
        return [
          { label: 'Current Baseline', labelAr: 'الخط الأساسي الحالي', value: `${base.toFixed(0)} tCO₂e`, color: '#dc2626' },
          { label: '2030 Target', labelAr: 'هدف 2030', value: `${targetEmissions.toFixed(0)} tCO₂e (−${tgt}%)`, color: '#059669' },
          { label: 'Annual Reduction Needed', labelAr: 'الخفض السنوي المطلوب', value: `${annualReduction.toFixed(0)} tCO₂e/yr`, color: '#082C6B' },
        ];
      },
    },
  ],
  'digital-transformation': [
    /* 0 — ERP Utilisation */
    { title: 'ERP Utilisation Rate', titleAr: 'معدّل استخدام ERP',
      fields: [
        { id: 'licensed', label: '# ERP modules licensed', labelAr: 'عدد وحدات ERP المرخّصة', type: 'number' },
        { id: 'active', label: '# modules actively used (>50% of features)', labelAr: 'عدد الوحدات المستخدمة فعلياً (>50% من الميزات)', type: 'number' },
        { id: 'annualCost', label: 'Annual ERP licence cost (SAR)', labelAr: 'تكلفة رخصة ERP السنوية (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
      ],
      compute: v => {
        const lic = sar(v.licensed)||1, act = sar(v.active), cost = sar(v.annualCost);
        const util = Math.round((act/lic)*100);
        const waste = cost ? Math.round(cost*(1-util/100)/1000) : 0;
        return [
          { label: 'ERP Utilisation Rate', labelAr: 'معدّل استخدام ERP', value: `${util}%`, color: color3(util,80,50) },
          { label: 'Underutilised Modules', labelAr: 'الوحدات غير المستخدمة', value: `${lic-act} of ${lic}`, color: (lic-act)>0?'#d97706':'#059669' },
          { label: 'Estimated Wasted Licence $', labelAr: 'تكلفة الرخص الضائعة التقديرية', value: waste ? `SAR ${waste}K/yr` : '—', color: '#dc2626' },
        ];
      },
    },
    /* 1 — Automation Opportunity */
    { title: 'Automation Opportunity Score', titleAr: 'درجة فرصة الأتمتة',
      fields: [
        { id: 'manualSteps', label: '# manual steps in P2P process', labelAr: 'عدد الخطوات اليدوية في P2P', type: 'number' },
        { id: 'automatable', label: '# steps automatable (ERP/RPA/AI)', labelAr: 'عدد الخطوات القابلة للأتمتة', type: 'number' },
        { id: 'timePerStep', label: 'Avg time per manual step (mins)', labelAr: 'متوسط الوقت في كل خطوة يدوية (دقيقة)', type: 'number', unit: 'mins', unitAr: 'دقيقة' },
        { id: 'txnsPerMonth', label: 'Monthly transaction volume', labelAr: 'حجم المعاملات الشهرية', type: 'number' },
      ],
      compute: v => {
        const ms = sar(v.manualSteps)||1, auto = sar(v.automatable), tps = sar(v.timePerStep), txn = sar(v.txnsPerMonth);
        const autoPct = Math.round((auto/ms)*100);
        const savedHrs = auto * tps * txn / 60;
        return [
          { label: 'Automation Potential', labelAr: 'إمكانية الأتمتة', value: `${autoPct}%`, color: color3(autoPct,60,30) },
          { label: 'Hours Saved/Month', labelAr: 'الساعات المحفوظة شهرياً', value: savedHrs ? `${savedHrs.toFixed(0)} hrs` : '—', color: '#059669' },
          { label: 'FTE Equivalent', labelAr: 'ما يعادل الموظف الكامل', value: savedHrs ? `${(savedHrs/160).toFixed(1)} FTE/month` : '—', color: '#4f46e5' },
        ];
      },
    },
    /* 2 — Data Quality Index */
    { title: 'Digital Data Quality Index', titleAr: 'مؤشر جودة البيانات الرقمية',
      fields: [
        { id: 'complete', label: 'Completeness (% required fields filled)', labelAr: 'الاكتمال (% الحقول المطلوبة)', type: 'number', unit: '%', unitAr: '%' },
        { id: 'accurate', label: 'Accuracy (% validated records)', labelAr: 'الدقة (% السجلات المتحقّق منها)', type: 'number', unit: '%', unitAr: '%' },
        { id: 'timely', label: 'Timeliness (% updated on schedule)', labelAr: 'التوقيت (% المحدَّث في الوقت المحدد)', type: 'number', unit: '%', unitAr: '%' },
      ],
      compute: v => {
        const c = pct(v.complete), a = pct(v.accurate), t = pct(v.timely);
        const idx = c*0.35 + a*0.40 + t*0.25;
        return [
          { label: 'Data Quality Index', labelAr: 'مؤشر جودة البيانات', value: `${idx.toFixed(0)}%`, color: color3(idx,90,70) },
          { label: 'Analytics Reliability', labelAr: 'موثوقية التحليلات', value: idx>=90?'High':idx>=70?'Moderate':'Low — fix before AI/BI investment', color: color3(idx,90,70) },
        ];
      },
    },
    /* 3 — Adoption Rate */
    { title: 'Digital Adoption Rate Tracker', titleAr: 'متتبّع معدّل التبنّي الرقمي',
      fields: [
        { id: 'users', label: 'Total users who should use the system', labelAr: 'إجمالي المستخدمين المفترضين للنظام', type: 'number' },
        { id: 'active', label: '# monthly active users (last 30 days)', labelAr: 'عدد المستخدمين النشطين شهرياً', type: 'number' },
        { id: 'compliance', label: '% transactions processed digitally', labelAr: '% المعاملات المعالَجة رقمياً', type: 'number', unit: '%', unitAr: '%' },
      ],
      compute: v => {
        const tot = sar(v.users)||1, act = sar(v.active), comp = pct(v.compliance);
        const adoptPct = Math.round((act/tot)*100);
        return [
          { label: 'User Adoption Rate', labelAr: 'معدّل تبنّي المستخدمين', value: `${adoptPct}%`, color: color3(adoptPct,80,50) },
          { label: 'Inactive Users', labelAr: 'المستخدمون غير النشطين', value: `${tot-act} users`, color: (tot-act)>0?'#d97706':'#059669' },
          { label: 'Digital Compliance', labelAr: 'الامتثال الرقمي', value: comp ? `${comp}%` : '—', color: color3(comp,90,70) },
        ];
      },
    },
    /* 4 — Digital Maturity */
    { title: 'Digital Procurement Maturity', titleAr: 'نضج المشتريات الرقمية',
      fields: [
        { id: 'eProcure', label: 'e-Procurement adoption (1–5)', labelAr: 'تبنّي المشتريات الإلكترونية (1–5)', type: 'number', min: 1, max: 5 },
        { id: 'analytics', label: 'Spend analytics capability (1–5)', labelAr: 'قدرة تحليل الإنفاق (1–5)', type: 'number', min: 1, max: 5 },
        { id: 'automation', label: 'P2P automation level (1–5)', labelAr: 'مستوى أتمتة P2P (1–5)', type: 'number', min: 1, max: 5 },
        { id: 'ai', label: 'AI / advanced analytics use (1–5)', labelAr: 'استخدام الذكاء الاصطناعي (1–5)', type: 'number', min: 1, max: 5 },
      ],
      compute: v => {
        const vals = ['eProcure','analytics','automation','ai'].map(k => score(v[k]));
        const avg = vals.reduce((a,b)=>a+b,0)/4;
        const level = avg>=4.5?'Leading':avg>=3.5?'Advanced':avg>=2.5?'Developing':avg>=1.5?'Basic':'Analogue';
        return [
          { label: 'Digital Maturity Score', labelAr: 'درجة النضج الرقمي', value: `${avg.toFixed(1)}/5`, color: color3(avg,4,2.5) },
          { label: 'Maturity Level', labelAr: 'مستوى النضج', value: level, color: color3(avg,4,2.5) },
          { label: 'Investment Priority', labelAr: 'أولوية الاستثمار', value: Math.min(...vals)<=2 ? ['eProcure','analytics','automation','ai'][vals.indexOf(Math.min(...vals))]:'Deepen AI & analytics', color: '#082C6B' },
        ];
      },
    },
  ],
  'contract-lifecycle-management': [
    /* 0 — Authoring Cycle Time */
    { title: 'Contract Authoring Cycle Analyser', titleAr: 'محلّل زمن دورة صياغة العقود',
      fields: [
        { id: 'avgDays', label: 'Average authoring cycle (days)', labelAr: 'متوسط دورة الصياغة (أيام)', type: 'number', unit: 'days', unitAr: 'أيام' },
        { id: 'contractsPerYear', label: '# contracts executed per year', labelAr: 'عدد العقود المنفّذة سنوياً', type: 'number' },
        { id: 'costPerDay', label: 'Internal resource cost per day (SAR)', labelAr: 'تكلفة الموارد الداخلية في اليوم (ر.س)', type: 'number', unit: 'SAR/day', unitAr: 'ر.س/يوم' },
      ],
      compute: v => {
        const days = sar(v.avgDays), count = sar(v.contractsPerYear), costDay = sar(v.costPerDay);
        const totalDays = days * count;
        const annualCost = totalDays * costDay;
        const targetDays = 10;
        const saving = Math.max(0, (days-targetDays)*count*costDay);
        return [
          { label: 'Current Avg Cycle', labelAr: 'متوسط الدورة الحالي', value: `${days} days`, color: color3(days,10,20,false) },
          { label: 'Annual Authoring Cost', labelAr: 'تكلفة الصياغة السنوية', value: annualCost ? `SAR ${Math.round(annualCost/1000)}K` : '—', color: '#dc2626' },
          { label: 'Savings if →10-day target', labelAr: 'الوفورات عند تحقيق هدف 10 أيام', value: saving ? `SAR ${Math.round(saving/1000)}K/yr` : '—', color: '#059669' },
        ];
      },
    },
    /* 1 — SLA Compliance */
    { title: 'SLA Compliance Rate', titleAr: 'معدّل الامتثال لاتفاقيات مستوى الخدمة',
      fields: [
        { id: 'contracts', label: '# contracts with SLAs', labelAr: 'عدد العقود ذات SLA', type: 'number' },
        { id: 'breached', label: '# with at least 1 SLA breach in last 12 months', labelAr: 'عدد العقود التي سُجّل بها خرق واحد على الأقل', type: 'number' },
        { id: 'annualValue', label: 'Total contract annual value (SAR)', labelAr: 'القيمة السنوية الإجمالية للعقود (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
      ],
      compute: v => {
        const tot = sar(v.contracts)||1, br = sar(v.breached), val = sar(v.annualValue);
        const compPct = Math.round(((tot-br)/tot)*100);
        const leakage = val ? Math.round(val*(br/tot)*0.05/1000) : 0;
        return [
          { label: 'SLA Compliance Rate', labelAr: 'معدّل الامتثال', value: `${compPct}%`, color: color3(compPct,90,75) },
          { label: 'Contracts with Breaches', labelAr: 'العقود ذات الخروقات', value: `${br} of ${tot}`, color: br>0?'#dc2626':'#059669' },
          { label: 'Est. Value Leakage', labelAr: 'تسرّب القيمة التقديري', value: leakage ? `SAR ${leakage}K/yr` : '—', color: '#dc2626', desc: '5% of breached contract value', descAr: '5% من قيمة العقود المخرَقة' },
        ];
      },
    },
    /* 2 — Renewal Risk */
    { title: 'Contract Renewal Risk Radar', titleAr: 'رادار مخاطر تجديد العقود',
      fields: [
        { id: 'expiring90', label: '# contracts expiring in ≤90 days', labelAr: 'عدد العقود التي تنتهي خلال ≤90 يوم', type: 'number' },
        { id: 'noOwner', label: '# of those without a named owner', labelAr: 'عدد العقود دون مالك مسمّى', type: 'number' },
        { id: 'autoRenewal', label: '# set to auto-renew (risk of passive renewal)', labelAr: 'عدد العقود ذات تجديد تلقائي', type: 'number' },
      ],
      compute: v => {
        const exp = sar(v.expiring90), noOwn = sar(v.noOwner), auto = sar(v.autoRenewal);
        const riskScore = Math.min(100, (noOwn/Math.max(exp,1))*50 + (auto/Math.max(exp,1))*30 + (exp>5?20:exp*4));
        return [
          { label: 'Contracts Expiring ≤90d', labelAr: 'العقود المنتهية ≤90 يوم', value: exp.toString(), color: exp>3?'#d97706':'#059669' },
          { label: 'Unowned (Action Needed)', labelAr: 'بدون مالك (يتطلب إجراءً)', value: `${noOwn}`, color: noOwn>0?'#dc2626':'#059669' },
          { label: 'Renewal Risk Score', labelAr: 'درجة مخاطر التجديد', value: `${Math.round(riskScore)}/100`, color: color3(riskScore,30,60,false) },
        ];
      },
    },
    /* 3 — Value Leakage */
    { title: 'Value Leakage Estimator', titleAr: 'مقدّر تسرّب القيمة',
      fields: [
        { id: 'contractValue', label: 'Total annual contract value (SAR)', labelAr: 'القيمة السنوية الإجمالية للعقود (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
        { id: 'priceVar', label: 'Price variance % (actual vs contracted)', labelAr: 'نسبة تباين السعر (فعلي مقابل تعاقدي)', type: 'number', unit: '%', unitAr: '%' },
        { id: 'scopeCreep', label: 'Scope creep additions (% of contract value)', labelAr: 'إضافات زحف النطاق (% من قيمة العقد)', type: 'number', unit: '%', unitAr: '%' },
        { id: 'unenforced', label: 'Unenforced SLA penalties (% of contract value)', labelAr: 'غرامات SLA غير المُطبَّقة (% من القيمة)', type: 'number', unit: '%', unitAr: '%' },
      ],
      compute: v => {
        const val = sar(v.contractValue);
        if (!val) return [];
        const pv = val*(pct(v.priceVar)/100), sc = val*(pct(v.scopeCreep)/100), un = val*(pct(v.unenforced)/100);
        const total = pv+sc+un;
        return [
          { label: 'Total Value Leakage', labelAr: 'إجمالي تسرّب القيمة', value: `SAR ${Math.round(total/1000)}K/yr`, color: '#dc2626' },
          { label: 'Leakage as % of Portfolio', labelAr: 'التسرّب كنسبة من المحفظة', value: `${Math.round((total/val)*100)}%`, color: color3(total/val*100,2,5,false) },
          { label: 'Recovery Potential (70%)', labelAr: 'إمكانية الاسترداد (70%)', value: `SAR ${Math.round(total*0.7/1000)}K`, color: '#059669' },
        ];
      },
    },
    /* 4 — CLM Complexity */
    { title: 'CLM System Need Assessment', titleAr: 'تقييم الحاجة لنظام CLM',
      fields: [
        { id: 'contracts', label: '# active contracts', labelAr: 'عدد العقود النشطة', type: 'number' },
        { id: 'spend', label: 'Total annual contract spend (SAR M)', labelAr: 'إجمالي الإنفاق التعاقدي (م ر.س)', type: 'number', unit: 'SAR M', unitAr: 'م ر.س' },
        { id: 'expiringPa', label: '# contracts expiring per year', labelAr: 'عدد العقود المنتهية سنوياً', type: 'number' },
      ],
      compute: v => {
        const cnt = sar(v.contracts), spend = sar(v.spend), exp = sar(v.expiringPa);
        const complexity = Math.min(100, (cnt/200)*40 + (spend/10)*30 + (exp/50)*30);
        const need = complexity>=70?'Urgent — CLM system recommended now':complexity>=40?'Consider CLM system':'Spreadsheet management still viable';
        return [
          { label: 'CLM Complexity Score', labelAr: 'درجة تعقيد CLM', value: `${Math.round(complexity)}/100`, color: color3(complexity,40,70,false) },
          { label: 'System Need', labelAr: 'الحاجة لنظام', value: need, color: color3(complexity,40,70,false) },
          { label: 'Risk Without System', labelAr: 'المخاطرة بدون نظام', value: cnt>100?'High — manual tracking fails at scale':cnt>50?'Medium':'Low', color: cnt>100?'#dc2626':cnt>50?'#d97706':'#059669' },
        ];
      },
    },
  ],
  'supplier-relationship-governance': [
    /* 0 — Supplier Segmentation */
    { title: 'Supplier Portfolio Segmentation', titleAr: 'تصنيف محفظة الموردين',
      fields: [
        { id: 'total', label: '# total active suppliers', labelAr: 'إجمالي الموردين النشطين', type: 'number' },
        { id: 'strategic', label: '# classified as Strategic', labelAr: 'عدد المصنّفين كاستراتيجيين', type: 'number' },
        { id: 'preferred', label: '# classified as Preferred', labelAr: 'عدد المصنّفين كمفضّلين', type: 'number' },
      ],
      compute: v => {
        const tot = sar(v.total)||1, str = sar(v.strategic), pref = sar(v.preferred);
        const trans = tot-str-pref;
        const segPct = Math.round(((str+pref)/tot)*100);
        return [
          { label: 'Segmented Suppliers', labelAr: 'الموردون المصنّفون', value: `${segPct}%`, color: color3(segPct,80,50) },
          { label: 'Strategic : Preferred : Transactional', labelAr: 'استراتيجي : مفضّل : معاملاتي', value: `${str} : ${pref} : ${Math.max(0,trans)}`, color: '#082C6B' },
          { label: 'Unsegmented', labelAr: 'غير مصنّفين', value: `${Math.max(0,tot-str-pref)} suppliers`, color: Math.max(0,tot-str-pref)>0?'#d97706':'#059669' },
        ];
      },
    },
    /* 1 — Performance Score */
    { title: 'Supplier Performance Index', titleAr: 'مؤشر أداء المورّدين',
      fields: [
        { id: 'otif', label: 'Average OTIF % (all strategic suppliers)', labelAr: 'متوسط OTIF % للمورّدين الاستراتيجيين', type: 'number', unit: '%', unitAr: '%' },
        { id: 'quality', label: 'Avg quality score (0–100)', labelAr: 'متوسط درجة الجودة (0–100)', type: 'number' },
        { id: 'compliance', label: 'Avg compliance score (0–100)', labelAr: 'متوسط درجة الامتثال (0–100)', type: 'number' },
        { id: 'belowThreshold', label: '# suppliers scoring <70%', labelAr: 'عدد الموردين الذين نالوا أقل من 70%', type: 'number' },
      ],
      compute: v => {
        const o = pct(v.otif), q = pct(v.quality), c = pct(v.compliance), low = sar(v.belowThreshold);
        const index = (o + q + c) / 3;
        return [
          { label: 'Overall Performance Index', labelAr: 'مؤشر الأداء الإجمالي', value: `${index.toFixed(0)}/100`, color: color3(index,85,70) },
          { label: 'Below-Threshold Suppliers', labelAr: 'الموردون دون العتبة', value: `${low} require CAR`, color: low>0?'#dc2626':'#059669' },
          { label: 'GCC Best Practice Gap', labelAr: 'الفجوة مقابل أفضل ممارسات الخليج', value: `${Math.max(0,90-index).toFixed(0)}pp to GCC top-quartile (90)`, color: color3(index,90,75) },
        ];
      },
    },
    /* 2 — Dual-Source ROI */
    { title: 'Dual-Source Investment ROI', titleAr: 'العائد على الاستثمار في التوريد الثنائي',
      fields: [
        { id: 'categorySpend', label: 'Category annual spend (SAR)', labelAr: 'إنفاق الفئة السنوي (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
        { id: 'disruptionCost', label: 'Cost of 1-month supply disruption (SAR)', labelAr: 'تكلفة شهر واحد من انقطاع التوريد (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
        { id: 'qualifyCost', label: 'Cost to qualify second source (SAR)', labelAr: 'تكلفة تأهيل المصدر الثاني (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
        { id: 'disruptionProb', label: 'Annual disruption probability (%)', labelAr: 'احتمالية الانقطاع السنوي (%)', type: 'number', unit: '%', unitAr: '%' },
      ],
      compute: v => {
        const disc = sar(v.disruptionCost), qc = sar(v.qualifyCost)||1, prob = pct(v.disruptionProb);
        const expectedLoss = disc * (prob/100);
        const roi = Math.round(((expectedLoss - qc)/qc)*100);
        const payback = qc && expectedLoss ? Math.round((qc/expectedLoss)*12) : 0;
        return [
          { label: 'Expected Annual Loss (disruption)', labelAr: 'الخسارة السنوية المتوقّعة', value: `SAR ${Math.round(expectedLoss/1000)}K`, color: '#dc2626' },
          { label: 'Dual-Source ROI', labelAr: 'العائد على الاستثمار في التوريد الثنائي', value: `${roi}%`, color: color3(roi,0,0) },
          { label: 'Payback Period', labelAr: 'مدة الاسترداد', value: payback ? `${payback} months` : '—', color: payback<=12?'#059669':'#d97706' },
        ];
      },
    },
    /* 3 — Development Investment */
    { title: 'Supplier Development ROI', titleAr: 'العائد على الاستثمار في تطوير الموردين',
      fields: [
        { id: 'investment', label: 'Annual development investment (SAR)', labelAr: 'الاستثمار السنوي في التطوير (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
        { id: 'qualityGain', label: 'Expected quality cost reduction (SAR/yr)', labelAr: 'خفض تكلفة الجودة المتوقّع (ر.س/سنة)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
        { id: 'otifGain', label: 'Expected OTIF improvement value (SAR/yr)', labelAr: 'قيمة تحسّن OTIF المتوقّع (ر.س/سنة)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
      ],
      compute: v => {
        const inv = sar(v.investment)||1, q = sar(v.qualityGain), o = sar(v.otifGain);
        const benefit = q+o;
        const roi = Math.round(((benefit-inv)/inv)*100);
        return [
          { label: 'Total Annual Benefit', labelAr: 'إجمالي الفائدة السنوية', value: `SAR ${Math.round(benefit/1000)}K`, color: '#059669' },
          { label: 'Development ROI', labelAr: 'العائد على الاستثمار في التطوير', value: `${roi}%`, color: color3(roi,0,0) },
          { label: 'Strategic Value', labelAr: 'القيمة الاستراتيجية', value: roi>=50?'Excellent':roi>=0?'Positive':'Reassess scope', color: color3(roi,50,0) },
        ];
      },
    },
    /* 4 — ESG Gap */
    { title: 'Supplier ESG Compliance Gap', titleAr: 'فجوة الامتثال لـ ESG لدى الموردين',
      fields: [
        { id: 'strategic', label: '# strategic suppliers', labelAr: 'عدد الموردين الاستراتيجيين', type: 'number' },
        { id: 'codeSigned', label: '# who have signed Code of Conduct', labelAr: 'عدد من وقّعوا مدوّنة السلوك', type: 'number' },
        { id: 'audited', label: '# audited for ESG in last 24 months', labelAr: 'عدد من خضعوا لتدقيق ESG في 24 شهراً', type: 'number' },
      ],
      compute: v => {
        const tot = sar(v.strategic)||1, sig = sar(v.codeSigned), aud = sar(v.audited);
        const sigPct = Math.round((sig/tot)*100);
        const audPct = Math.round((aud/tot)*100);
        const maturity = Math.round((sigPct+audPct)/2);
        return [
          { label: 'Code of Conduct Coverage', labelAr: 'تغطية مدوّنة السلوك', value: `${sigPct}%`, color: color3(sigPct,90,70) },
          { label: 'ESG Audit Coverage', labelAr: 'تغطية تدقيق ESG', value: `${audPct}%`, color: color3(audPct,70,40) },
          { label: 'ESG Compliance Maturity', labelAr: 'نضج امتثال ESG', value: `${maturity}/100`, color: color3(maturity,80,50) },
        ];
      },
    },
  ],
  'resiliency': [
    /* 0 — Disruption Readiness */
    { title: 'Supply Chain Disruption Readiness', titleAr: 'جاهزية سلسلة الإمداد للاضطرابات',
      fields: [
        { id: 'scenarios', label: '# documented disruption scenarios', labelAr: 'عدد سيناريوهات الاضطراب الموثّقة', type: 'number' },
        { id: 'tested', label: '# tested via tabletop exercises', labelAr: 'عدد السيناريوهات المختبرة بتمارين مكتبية', type: 'number' },
        { id: 'altSuppliers', label: '# critical items with qualified alternates', labelAr: 'عدد الأصناف الحرجة ذات بدائل مؤهّلة', type: 'number' },
        { id: 'critItems', label: '# total critical items', labelAr: 'إجمالي الأصناف الحرجة', type: 'number' },
      ],
      compute: v => {
        const sc = sar(v.scenarios)||1, tested = sar(v.tested), alt = sar(v.altSuppliers), crit = sar(v.critItems)||1;
        const testPct = Math.round((tested/sc)*100);
        const altPct = Math.round((alt/crit)*100);
        const readiness = Math.round((testPct+altPct)/2);
        return [
          { label: 'Scenario Test Coverage', labelAr: 'تغطية اختبار السيناريوهات', value: `${testPct}%`, color: color3(testPct,80,50) },
          { label: 'Alternate Supplier Coverage', labelAr: 'تغطية الموردين البديلين', value: `${altPct}%`, color: color3(altPct,80,50) },
          { label: 'Overall Readiness', labelAr: 'الجاهزية الإجمالية', value: `${readiness}/100`, color: color3(readiness,80,50) },
        ];
      },
    },
    /* 1 — Red Sea Cost Impact */
    { title: 'Logistics Disruption Cost Model', titleAr: 'نموذج تكلفة اضطراب الشحن',
      fields: [
        { id: 'seaVolume', label: 'Annual Red Sea freight volume (SAR)', labelAr: 'حجم الشحن السنوي عبر البحر الأحمر (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
        { id: 'premiumPct', label: 'Alternative routing cost premium (%)', labelAr: 'علاوة تكلفة التوجيه البديل (%)', type: 'number', unit: '%', unitAr: '%' },
        { id: 'extraDays', label: 'Additional transit days (alt. route)', labelAr: 'أيام العبور الإضافية (المسار البديل)', type: 'number', unit: 'days', unitAr: 'أيام' },
      ],
      compute: v => {
        const vol = sar(v.seaVolume), prem = pct(v.premiumPct)||30, days = sar(v.extraDays)||15;
        const annualCost = vol * (prem/100);
        const inventoryCost = vol * (days/365) * 0.25;
        return [
          { label: 'Annual Rerouting Cost Premium', labelAr: 'تكلفة إعادة التوجيه السنوية', value: vol ? `SAR ${Math.round(annualCost/1000)}K` : '—', color: '#dc2626' },
          { label: 'Additional Inventory Carrying', labelAr: 'تكاليف حمل المخزون الإضافية', value: vol ? `SAR ${Math.round(inventoryCost/1000)}K/yr` : '—', color: '#d97706' },
          { label: 'Total Disruption Cost/yr', labelAr: 'إجمالي تكلفة الاضطراب السنوية', value: vol ? `SAR ${Math.round((annualCost+inventoryCost)/1000)}K` : '—', color: '#7f1d1d' },
        ];
      },
    },
    /* 2 — Logistics Resilience */
    { title: 'Logistics Corridor Resilience', titleAr: 'مرونة ممرّات الشحن اللوجستي',
      fields: [
        { id: 'mainPort', label: '% of imports through main port', labelAr: '% من الواردات عبر الميناء الرئيسي', type: 'number', unit: '%', unitAr: '%' },
        { id: 'altPort', label: '# qualified alternative entry points', labelAr: 'عدد نقاط الدخول البديلة المؤهّلة', type: 'number' },
        { id: 'airCapable', label: '# critical items with air freight alternative', labelAr: 'عدد الأصناف الحرجة ذات بديل شحن جوي', type: 'number' },
        { id: 'critItems', label: '# total critical items', labelAr: 'إجمالي الأصناف الحرجة', type: 'number' },
      ],
      compute: v => {
        const conc = pct(v.mainPort), altPts = sar(v.altPort), airCap = sar(v.airCapable), crit = sar(v.critItems)||1;
        const airPct = Math.round((airCap/crit)*100);
        const resilience = Math.round((100-conc)*0.4 + Math.min(100,altPts*25)*0.35 + airPct*0.25);
        return [
          { label: 'Single Port Concentration', labelAr: 'تركّز الميناء الوحيد', value: `${conc}%`, color: color3(conc,50,70,false) },
          { label: 'Air Freight Capability', labelAr: 'قدرة الشحن الجوي', value: `${airPct}% of critical items`, color: color3(airPct,70,40) },
          { label: 'Logistics Resilience Score', labelAr: 'درجة المرونة اللوجستية', value: `${Math.max(0,resilience)}/100`, color: color3(resilience,70,45) },
        ];
      },
    },
    /* 3 — Resilience ROI */
    { title: 'Resilience Investment ROI', titleAr: 'العائد على الاستثمار في المرونة',
      fields: [
        { id: 'bufferCost', label: 'Annual buffer stock investment (SAR)', labelAr: 'الاستثمار السنوي في مخزون الأمان (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
        { id: 'disruptionCost', label: 'Cost of a 1-month disruption (SAR)', labelAr: 'تكلفة اضطراب لمدة شهر (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
        { id: 'disruptionProb', label: 'Annual disruption probability (%)', labelAr: 'احتمالية حدوث اضطراب سنوياً (%)', type: 'number', unit: '%', unitAr: '%' },
      ],
      compute: v => {
        const buf = sar(v.bufferCost)||1, disc = sar(v.disruptionCost), prob = pct(v.disruptionProb);
        const expectedLoss = disc * (prob/100);
        const roi = Math.round(((expectedLoss - buf)/buf)*100);
        const breakeven = disc ? Math.round((buf/disc)*100) : 0;
        return [
          { label: 'Expected Annual Loss (no buffer)', labelAr: 'الخسارة السنوية المتوقّعة بدون احتياطي', value: `SAR ${Math.round(expectedLoss/1000)}K`, color: '#dc2626' },
          { label: 'Resilience Investment ROI', labelAr: 'العائد على الاستثمار في المرونة', value: `${roi}%`, color: color3(roi,0,0) },
          { label: 'Break-even Probability', labelAr: 'احتمالية التعادل', value: `Investment breaks even at ${breakeven}% disruption probability`, color: '#082C6B' },
        ];
      },
    },
  ],
  'value-engineering': [
    /* 0 — Function Cost Efficiency */
    { title: 'Function-to-Cost Efficiency', titleAr: 'كفاءة الوظيفة مقابل التكلفة',
      fields: [
        { id: 'requiredFns', label: '# required functions identified', labelAr: 'عدد الوظائف المطلوبة المحدّدة', type: 'number' },
        { id: 'fulfillFns', label: '# functions current design fulfils', labelAr: 'عدد الوظائف التي يحقّقها التصميم الحالي', type: 'number' },
        { id: 'unitCost', label: 'Current unit cost (SAR)', labelAr: 'التكلفة الحالية للوحدة (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
        { id: 'shouldCost', label: 'Should-cost estimate (SAR)', labelAr: 'التكلفة المتوقّعة (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
      ],
      compute: v => {
        const req = sar(v.requiredFns)||1, ful = sar(v.fulfillFns), cur = sar(v.unitCost), sho = sar(v.shouldCost);
        const fnPct = Math.round((ful/req)*100);
        const gap = cur && sho ? Math.round(((cur-sho)/sho)*100) : 0;
        return [
          { label: 'Function Fulfilment', labelAr: 'اكتمال الوظائف', value: `${fnPct}%`, color: color3(fnPct,100,80) },
          { label: 'Cost vs Should-Cost', labelAr: 'التكلفة مقابل المتوقّعة', value: cur && sho ? `+${gap}% premium` : '—', color: gap>20?'#dc2626':gap>10?'#d97706':'#059669' },
          { label: 'VE Savings Opportunity', labelAr: 'فرصة وفورات هندسة القيمة', value: cur && sho ? `SAR ${(cur-sho).toFixed(2)}/unit` : '—', color: '#059669' },
        ];
      },
    },
    /* 1 — Should-Cost Model */
    { title: 'Should-Cost Model Builder', titleAr: 'بناء نموذج التكلفة المتوقّعة',
      fields: [
        { id: 'material', label: 'Raw material cost/unit (SAR)', labelAr: 'تكلفة المواد الخام للوحدة (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
        { id: 'labour', label: 'Labour cost/unit (SAR)', labelAr: 'تكلفة العمالة للوحدة (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
        { id: 'overhead', label: 'Overhead & logistics/unit (SAR)', labelAr: 'التكاليف العامة والشحن للوحدة (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
        { id: 'margin', label: 'Fair supplier margin (% of COGS)', labelAr: 'هامش المورّد العادل (% من التكلفة)', type: 'number', unit: '%', unitAr: '%' },
        { id: 'actual', label: 'Current supplier price (SAR)', labelAr: 'سعر المورّد الحالي (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
      ],
      compute: v => {
        const m = sar(v.material), l = sar(v.labour), oh = sar(v.overhead), mg = pct(v.margin)||15, act = sar(v.actual);
        const cogs = m+l+oh;
        const shouldCost = cogs * (1+mg/100);
        const variance = act ? Math.round(((act-shouldCost)/shouldCost)*100) : 0;
        return [
          { label: 'Should-Cost (bottom-up)', labelAr: 'التكلفة المتوقّعة (من القاعدة)', value: `SAR ${shouldCost.toFixed(2)}`, color: '#082C6B' },
          { label: 'Supplier Price Premium', labelAr: 'علاوة سعر المورّد', value: act ? `+${variance}%` : '—', color: variance>25?'#dc2626':variance>10?'#d97706':'#059669' },
          { label: 'Negotiation Headroom', labelAr: 'هامش التفاوض', value: act && shouldCost ? `SAR ${Math.max(0,act-shouldCost).toFixed(2)}/unit` : '—', color: '#059669' },
        ];
      },
    },
    /* 2 — Spec Savings */
    { title: 'Specification Optimisation Savings', titleAr: 'وفورات تحسين المواصفات',
      fields: [
        { id: 'spend', label: 'Category annual spend (SAR)', labelAr: 'إنفاق الفئة السنوي (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
        { id: 'overspecPct', label: 'Estimated over-specification % of spend', labelAr: 'نسبة الإفراط في المواصفات التقديرية %', type: 'number', unit: '%', unitAr: '%' },
        { id: 'capturable', label: '% of over-spec cost capturable as savings', labelAr: '% من التكلفة الزائدة قابل للتحقيق', type: 'number', unit: '%', unitAr: '%' },
      ],
      compute: v => {
        const sp = sar(v.spend), over = pct(v.overspecPct), cap = pct(v.capturable)||70;
        const overCost = sp*(over/100);
        const saving = overCost*(cap/100);
        return [
          { label: 'Over-Specification Cost', labelAr: 'تكلفة الإفراط في المواصفات', value: `SAR ${Math.round(overCost/1000)}K/yr`, color: '#dc2626' },
          { label: 'Capturable Savings', labelAr: 'الوفورات القابلة للتحقيق', value: `SAR ${Math.round(saving/1000)}K/yr`, color: '#059669' },
          { label: 'Savings as % of Spend', labelAr: 'الوفورات كنسبة من الإنفاق', value: `${Math.round((saving/sp)*100)}%`, color: color3(saving/sp*100,5,2) },
        ];
      },
    },
    /* 3 — VE Pipeline Health */
    { title: 'VE Pipeline Conversion Rate', titleAr: 'معدّل تحويل مسار هندسة القيمة',
      fields: [
        { id: 'submitted', label: '# VE ideas submitted (last 12 months)', labelAr: 'عدد أفكار VE المقدّمة (12 شهراً)', type: 'number' },
        { id: 'approved', label: '# approved for implementation', labelAr: 'عدد المعتمدة للتطبيق', type: 'number' },
        { id: 'implemented', label: '# actually implemented', labelAr: 'عدد المطبّقة فعلياً', type: 'number' },
        { id: 'avgDaysToDecision', label: 'Average days to approval decision', labelAr: 'متوسط الأيام حتى قرار الاعتماد', type: 'number', unit: 'days', unitAr: 'أيام' },
      ],
      compute: v => {
        const sub = sar(v.submitted)||1, appr = sar(v.approved), impl = sar(v.implemented), days = sar(v.avgDaysToDecision);
        const apprRate = Math.round((appr/sub)*100);
        const implRate = appr ? Math.round((impl/appr)*100) : 0;
        const overall = Math.round((impl/sub)*100);
        return [
          { label: 'Approval Rate', labelAr: 'معدّل الاعتماد', value: `${apprRate}%`, color: color3(apprRate,60,30) },
          { label: 'Implementation Rate', labelAr: 'معدّل التطبيق', value: `${implRate}%`, color: color3(implRate,80,50) },
          { label: 'End-to-End Conversion', labelAr: 'معدّل التحويل الكلي', value: `${overall}% (target: ≥40%)`, color: color3(overall,40,20) },
          { label: 'Avg Approval Cycle', labelAr: 'متوسط دورة الاعتماد', value: days ? `${days} days (target: <30)` : '—', color: days ? color3(days,30,60,false) : '#082C6B' },
        ];
      },
    },
  ],
  'process-improvement-policy': [
    /* 0 — SOP Coverage */
    { title: 'SOP Coverage & Quality Score', titleAr: 'تغطية الإجراءات المعيارية وجودتها',
      fields: [
        { id: 'processes', label: '# key processes in your team', labelAr: 'عدد العمليات الرئيسية في فريقك', type: 'number' },
        { id: 'documented', label: '# with a documented SOP', labelAr: 'عدد العمليات ذات إجراء موثّق', type: 'number' },
        { id: 'current', label: '# of those updated in last 12 months', labelAr: 'عدد المحدَّثة في 12 شهراً الأخيرة', type: 'number' },
      ],
      compute: v => {
        const tot = sar(v.processes)||1, doc = sar(v.documented), curr = sar(v.current);
        const covPct = Math.round((doc/tot)*100);
        const freshPct = doc ? Math.round((curr/doc)*100) : 0;
        return [
          { label: 'SOP Coverage', labelAr: 'تغطية الإجراءات المعيارية', value: `${covPct}%`, color: color3(covPct,90,70) },
          { label: 'Freshness (updated <12mo)', labelAr: 'الحداثة (محدَّثة <12 شهر)', value: `${freshPct}%`, color: color3(freshPct,80,50) },
          { label: 'Undocumented Processes', labelAr: 'العمليات غير الموثّقة', value: `${tot-doc}`, color: (tot-doc)>0?'#d97706':'#059669' },
        ];
      },
    },
    /* 1 — Compliance Rate */
    { title: 'SOP Compliance Rate Tracker', titleAr: 'متتبّع معدّل الامتثال للإجراءات',
      fields: [
        { id: 'transactions', label: '# sampled transactions last month', labelAr: 'عدد المعاملات المأخوذة كعيّنة الشهر الماضي', type: 'number' },
        { id: 'compliant', label: '# that fully followed the SOP', labelAr: 'عدد التي اتّبعت الإجراء الكامل', type: 'number' },
        { id: 'topBreachStep', label: 'Most-breached step # in SOP', labelAr: 'رقم الخطوة الأكثر خرقاً في الإجراء', type: 'number' },
      ],
      compute: v => {
        const tot = sar(v.transactions)||1, comp = sar(v.compliant), step = sar(v.topBreachStep);
        const rate = Math.round((comp/tot)*100);
        return [
          { label: 'Compliance Rate', labelAr: 'معدّل الامتثال', value: `${rate}%`, color: color3(rate,90,70) },
          { label: 'Non-Compliant Transactions', labelAr: 'المعاملات غير الممتثلة', value: `${tot-comp} / ${tot}`, color: (tot-comp)>0?'#d97706':'#059669' },
          { label: 'Priority Fix', labelAr: 'أولوية الإصلاح', value: step ? `Focus on Step #${step} (highest breach rate)` : 'Identify top breach step', color: '#082C6B' },
        ];
      },
    },
    /* 2 — Approval Cycle Time */
    { title: 'Approval Cycle Time Reducer', titleAr: 'مختصر زمن دورة الاعتماد',
      fields: [
        { id: 'currentDays', label: 'Current avg approval cycle (days)', labelAr: 'متوسط دورة الاعتماد الحالي (أيام)', type: 'number', unit: 'days', unitAr: 'أيام' },
        { id: 'targetDays', label: 'Target approval cycle (days)', labelAr: 'هدف دورة الاعتماد (أيام)', type: 'number', unit: 'days', unitAr: 'أيام' },
        { id: 'txnVolume', label: 'Monthly transaction volume', labelAr: 'حجم المعاملات الشهرية', type: 'number' },
        { id: 'costPerDay', label: 'Cost of 1 approval day (SAR)', labelAr: 'تكلفة يوم اعتماد واحد (ر.س)', type: 'number', unit: 'SAR/day', unitAr: 'ر.س/يوم' },
      ],
      compute: v => {
        const cur = sar(v.currentDays), tgt = sar(v.targetDays)||1, vol = sar(v.txnVolume), cpd = sar(v.costPerDay);
        const daysSaved = Math.max(0, cur-tgt) * vol;
        const annualSaving = daysSaved * cpd * 12;
        return [
          { label: 'Days Saved per Transaction', labelAr: 'الأيام المحفوظة لكل معاملة', value: `${Math.max(0,cur-tgt)} days`, color: color3(cur-tgt,0,0) },
          { label: 'Annual Time Saved', labelAr: 'الوقت المحفوظ سنوياً', value: `${daysSaved*12} person-days/yr`, color: '#059669' },
          { label: 'Annual Cost Saving', labelAr: 'الوفورات السنوية', value: annualSaving ? `SAR ${Math.round(annualSaving/1000)}K` : '—', color: '#059669' },
        ];
      },
    },
    /* 3 — Policy Gap */
    { title: 'Policy Compliance Gap Assessment', titleAr: 'تقييم فجوة امتثال السياسات',
      fields: [
        { id: 'policies', label: '# procurement policies in force', labelAr: 'عدد سياسات المشتريات السارية', type: 'number' },
        { id: 'audited', label: '# audited for compliance in last 12 months', labelAr: 'عدد التي خضعت لتدقيق الامتثال في 12 شهراً', type: 'number' },
        { id: 'gaps', label: '# with identified gaps vs Vision 2030 / PDPL', labelAr: 'عدد التي بها فجوات مقابل رؤية 2030 / نظام حماية البيانات', type: 'number' },
      ],
      compute: v => {
        const tot = sar(v.policies)||1, aud = sar(v.audited), gaps = sar(v.gaps);
        const audPct = Math.round((aud/tot)*100);
        const gapPct = tot ? Math.round((gaps/tot)*100) : 0;
        const maturity = Math.round(audPct*(1-gapPct/100));
        return [
          { label: 'Audit Coverage', labelAr: 'تغطية التدقيق', value: `${audPct}%`, color: color3(audPct,80,50) },
          { label: 'Policies with Gaps', labelAr: 'السياسات ذات الفجوات', value: `${gaps} of ${tot}`, color: gaps>0?'#d97706':'#059669' },
          { label: 'Policy Maturity Score', labelAr: 'درجة نضج السياسات', value: `${maturity}/100`, color: color3(maturity,80,50) },
        ];
      },
    },
  ],
  'training-capability-building': [
    /* 0 — Training ROI */
    { title: 'Training Budget ROI Calculator', titleAr: 'حاسبة العائد على الاستثمار في التدريب',
      fields: [
        { id: 'budget', label: 'Annual training budget (SAR)', labelAr: 'موازنة التدريب السنوية (ر.س)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
        { id: 'kpiGain', label: 'KPI value improvement attributable to training (SAR/yr)', labelAr: 'تحسّن قيمة مؤشرات الأداء الناتج عن التدريب (ر.س/سنة)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
        { id: 'savingsFromTraining', label: 'Procurement savings unlocked by trained staff (SAR/yr)', labelAr: 'وفورات المشتريات التي فتحها الموظفون المدرَّبون (ر.س/سنة)', type: 'number', unit: 'SAR', unitAr: 'ر.س' },
      ],
      compute: v => {
        const bud = sar(v.budget)||1, kpi = sar(v.kpiGain), sav = sar(v.savingsFromTraining);
        const benefit = kpi + sav;
        const roi = Math.round(((benefit-bud)/bud)*100);
        return [
          { label: 'Total Measurable Benefit', labelAr: 'إجمالي الفائدة القابلة للقياس', value: `SAR ${Math.round(benefit/1000)}K/yr`, color: '#059669' },
          { label: 'Training ROI', labelAr: 'العائد على الاستثمار في التدريب', value: `${roi}%`, color: color3(roi,50,0) },
          { label: 'Benefit per SAR Spent', labelAr: 'الفائدة لكل ريال مُنفَق', value: `${(benefit/bud).toFixed(1)}× return`, color: color3(benefit/bud,1.5,1) },
        ];
      },
    },
    /* 1 — Career Pathway Gap */
    { title: 'Procurement Career Pathway Gap', titleAr: 'فجوة المسار المهني في المشتريات',
      fields: [
        { id: 'teamSize', label: '# procurement team members', labelAr: 'عدد أعضاء فريق المشتريات', type: 'number' },
        { id: 'cipsQual', label: '# holding CIPS qualification (any level)', labelAr: 'عدد حاملي مؤهّل CIPS (أي مستوى)', type: 'number' },
        { id: 'hasCPD', label: '# on a formal CPD programme', labelAr: 'عدد المشاركين في برنامج تطوير مهني رسمي', type: 'number' },
        { id: 'avgExp', label: 'Avg years procurement experience', labelAr: 'متوسط سنوات الخبرة في المشتريات', type: 'number', unit: 'yrs', unitAr: 'سنة' },
      ],
      compute: v => {
        const ts = sar(v.teamSize)||1, cips = sar(v.cipsQual), cpd = sar(v.hasCPD), exp = sar(v.avgExp);
        const cipsPct = Math.round((cips/ts)*100);
        const cpdPct = Math.round((cpd/ts)*100);
        const maturity = Math.round((cipsPct*0.4 + cpdPct*0.3 + Math.min(100,exp*10)*0.3));
        return [
          { label: 'CIPS Qualification Coverage', labelAr: 'تغطية مؤهّل CIPS', value: `${cipsPct}%`, color: color3(cipsPct,70,40) },
          { label: 'CPD Programme Enrolment', labelAr: 'التسجيل في برنامج التطوير المهني', value: `${cpdPct}%`, color: color3(cpdPct,80,50) },
          { label: 'Team Capability Maturity', labelAr: 'نضج قدرات الفريق', value: `${maturity}/100`, color: color3(maturity,75,50) },
        ];
      },
    },
    /* 2 — Language Accessibility */
    { title: 'Training Language Accessibility Score', titleAr: 'درجة إتاحة لغة التدريب',
      fields: [
        { id: 'arabicPct', label: '% of team preferring Arabic training', labelAr: '% الفريق الذي يفضّل التدريب بالعربية', type: 'number', unit: '%', unitAr: '%' },
        { id: 'arabicContent', label: '% of current training materials in Arabic', labelAr: '% مواد التدريب الحالية المتاحة بالعربية', type: 'number', unit: '%', unitAr: '%' },
        { id: 'gccCases', label: '% of case studies from GCC / MENA context', labelAr: '% دراسات الحالة من سياق الخليج / الشرق الأوسط', type: 'number', unit: '%', unitAr: '%' },
      ],
      compute: v => {
        const ap = pct(v.arabicPct), ac = pct(v.arabicContent), gcc = pct(v.gccCases);
        const gap = Math.max(0, ap - ac);
        const accessibility = Math.round((ac*0.5 + gcc*0.3 + (100-gap)*0.2));
        return [
          { label: 'Arabic Content Gap', labelAr: 'فجوة المحتوى بالعربية', value: `${gap.toFixed(0)}pp shortfall`, color: gap>30?'#dc2626':gap>15?'#d97706':'#059669' },
          { label: 'GCC Context Coverage', labelAr: 'تغطية سياق الخليج', value: `${gcc}%`, color: color3(gcc,70,40) },
          { label: 'Accessibility Score', labelAr: 'درجة الإتاحة', value: `${Math.max(0,accessibility)}/100`, color: color3(accessibility,80,50) },
        ];
      },
    },
    /* 3 — Training Effectiveness */
    { title: 'Training Effectiveness Index (Kirkpatrick)', titleAr: 'مؤشر فاعلية التدريب (كيركباتريك)',
      fields: [
        { id: 'l1', label: 'L1 Reaction — Avg satisfaction score (0–100)', labelAr: 'المستوى الأول: متوسط الرضا (0–100)', type: 'number' },
        { id: 'l2', label: 'L2 Learning — Knowledge retention at 30d (%)', labelAr: 'المستوى الثاني: احتفاظ المعرفة عند 30 يوم (%)', type: 'number', unit: '%', unitAr: '%' },
        { id: 'l3', label: 'L3 Behaviour — Observable behaviour change (%)', labelAr: 'المستوى الثالث: التغيير السلوكي الملحوظ (%)', type: 'number', unit: '%', unitAr: '%' },
        { id: 'l4', label: 'L4 Results — KPI improvement attributable (%)', labelAr: 'المستوى الرابع: تحسّن مؤشرات الأداء المنسوب (%)', type: 'number', unit: '%', unitAr: '%' },
      ],
      compute: v => {
        const l1 = pct(v.l1), l2 = pct(v.l2), l3 = pct(v.l3), l4 = pct(v.l4);
        const idx = l1*0.1 + l2*0.2 + l3*0.3 + l4*0.4;
        return [
          { label: 'Kirkpatrick Effectiveness Index', labelAr: 'مؤشر فاعلية كيركباتريك', value: `${idx.toFixed(0)}/100`, color: color3(idx,75,50) },
          { label: 'L4 Business Impact', labelAr: 'الأثر على الأعمال (L4)', value: `${l4}%`, color: color3(l4,20,10) },
          { label: 'Training Quality', labelAr: 'جودة التدريب', value: idx>=80?'World Class':idx>=65?'Effective':idx>=50?'Developing':'Needs Redesign', color: color3(idx,80,65) },
        ];
      },
    },
  ],
};

// ─── ChallengeToolkitPanel ────────────────────────────────────────────────────

interface ChallengeToolkitPanelProps { slug: string; challengeIndex: number; isAr: boolean; }
type ChallengeTab = 'steps' | 'tool' | 'ai';

// Mini AI wrapper that uses useAIPlan at the panel level
function ChallengeAIPanel({
  slug, challengeIndex, items, isAr,
}: { slug: string; challengeIndex: number; items: ChecklistItem[]; isAr: boolean }) {
  const storageKey = `isc-challenge-ai-${slug}-${challengeIndex}`;
  const buildPrompt = useCallback(() => {
    const steps = items.map((item, i) => `${i+1}. ${item.en}`).join('\n');
    return [
      `## Supply Chain Challenge: ${slug} — Challenge #${challengeIndex + 1}`,
      '',
      '## Implementation Steps for this Challenge',
      steps,
      '',
      '## Your Task',
      'Generate a focused 2–3 paragraph action guidance brief for this specific supply chain challenge:',
      '1. Why this challenge matters and its commercial / operational impact if left unaddressed',
      '2. The most critical first 3 actions from the implementation steps above — with specific Saudi/GCC context',
      '3. Common failure modes to avoid and a 30-day "quick win" the team can demonstrate to leadership',
      'Keep the tone consulting-grade: direct, evidence-based, and actionable. No generic advice.',
    ].join('\n');
  }, [slug, challengeIndex, items]);

  const aiPlan = useAIPlan(buildPrompt, isAr, storageKey, true);
  return (
    <AIPlanPanel
      loading={aiPlan.loading} result={aiPlan.result} evidenceSummary={aiPlan.evidenceSummary} error={aiPlan.error}
      onGenerate={aiPlan.generate} onReset={aiPlan.reset}
      savedPlan={aiPlan.savedPlan} onViewSaved={aiPlan.viewSaved} onDeleteSaved={aiPlan.deleteSaved}
      rateLimited={aiPlan.rateLimited}
      retryAfterSeconds={aiPlan.retryAfterSeconds}
      saveError={aiPlan.saveError}
      onDismissSaveError={aiPlan.dismissSaveError}
      buttonLabel={isAr ? 'توليد توجيه AI لهذا التحدّي ✨' : 'Generate AI Guidance for This Challenge ✨'}
      isAr={isAr} toolKey={storageKey}
    />
  );
}

export function ChallengeToolkitPanel({ slug, challengeIndex, isAr }: ChallengeToolkitPanelProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ChallengeTab>('steps');

  const slugChecklists = CHALLENGE_CHECKLISTS[slug];
  const items = slugChecklists?.[challengeIndex] ?? null;
  if (!items || items.length === 0) return null;

  const challengeTools = CHALLENGE_TOOLS[slug];
  const tool = challengeTools?.[challengeIndex] ?? null;

  const storageKey = `isc-tool-${slug}-challenge-${challengeIndex}`;
  const actionKey  = `isc-tool-${slug}-actions-${challengeIndex}`;
  const toolKey    = `isc-tool-${slug}-calc-${challengeIndex}`;

  const today = new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-GB');

  const tabs: { id: ChallengeTab; icon: string; label: string; labelAr: string }[] = [
    { id: 'steps', icon: '📋', label: 'Action Steps', labelAr: 'خطوات التطبيق' },
    ...(tool ? [{ id: 'tool' as ChallengeTab, icon: '🔧', label: 'Impact Tool', labelAr: 'أداة القياس' }] : []),
    { id: 'ai', icon: '✨', label: 'AI Guidance', labelAr: 'توجيه AI' },
  ];

  return (
    <div className="mt-3 border-t border-dashed border-border pt-3">
      {/* Expand / collapse toggle */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 text-xs font-bold text-primary hover:text-accent transition-colors"
        >
          <Wrench className="w-3.5 h-3.5" />
          {isAr ? 'أدوات التطبيق' : 'Implementation Toolkit'}
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        {open && activeTab === 'steps' && (
          <button
            onClick={() => printZone('checklist')}
            className="no-print flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold bg-primary text-white hover:bg-primary/90 transition-colors shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            {isAr ? 'تصدير PDF' : 'Export PDF'}
          </button>
        )}
      </div>

      {open && (
        <div className="mt-3 space-y-3">
          {/* Tab selector */}
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${activeTab === t.id ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <span>{t.icon}</span><span>{isAr ? t.labelAr : t.label}</span>
              </button>
            ))}
          </div>

          {/* Steps tab */}
          {activeTab === 'steps' && (
            <div className="print-zone-checklist space-y-3">
              {/* Print-only header */}
              <div className="hidden print:block mb-4 pb-3 border-b border-gray-300">
                <p className="text-lg font-extrabold text-gray-900">{isAr ? '✅ قائمة خطوات التطبيق' : '✅ Implementation Checklist'}</p>
                <p className="text-xs text-gray-500">{isAr ? `تاريخ التصدير: ${today}` : `Exported: ${today}`}</p>
              </div>
              <ChecklistTool storageKey={storageKey} items={items} isAr={isAr} title="Action Steps" titleAr="خطوات التطبيق" />
              <ActionTracker storageKey={actionKey} isAr={isAr} />
            </div>
          )}

          {/* Tool tab */}
          {activeTab === 'tool' && tool && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                🔧 {isAr ? tool.titleAr : tool.title}
              </p>
              <ParamForm
                storageKey={toolKey}
                fields={tool.fields}
                compute={tool.compute}
                isAr={isAr}
                title={tool.title}
                titleAr={tool.titleAr}
              />
            </div>
          )}

          {/* AI tab */}
          {activeTab === 'ai' && (
            <ChallengeAIPanel
              slug={slug}
              challengeIndex={challengeIndex}
              items={items}
              isAr={isAr}
            />
          )}
        </div>
      )}
    </div>
  );
}
