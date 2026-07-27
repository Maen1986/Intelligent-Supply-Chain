import React, { useState, useEffect, useCallback, useRef } from 'react';
import { safeSetItem } from '@/lib/storage';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import { useLanguage } from '@/lib/LanguageContext';
import { Info, TrendingUp, TrendingDown, Download, Upload, LogIn, ChevronDown, ChevronUp, X, Printer } from 'lucide-react';
import { parseCsvFile, downloadCsv } from '@/lib/importCsv';
import { useAIPlan } from '@/hooks/useAIPlan';
import { AIPlanPanel } from '@/components/AIPlanPanel';
import { useAuth } from '@/lib/AuthContext';
import { KPI_DATA_SPECS } from '@/lib/kpiDataSpecs';
import { INDUSTRIES, type IndustryKey, getIndustryBenchmark } from '@/lib/kpiBenchmarksByIndustry';
import { SKU_CLASSES, type SkuClassKey, getSkuClassBenchmark } from '@/lib/kpiBenchmarksBySkuClass';

/* ─── KPI definition types ─── */
export interface KpiDef {
  id: string;
  label: string; labelAr: string;
  unit: string; unitAr: string;
  targetValue: number; targetLabel: string; targetLabelAr?: string;
  benchmarkValue: number; benchmarkLabel: string; benchmarkLabelAr?: string;
  higherIsBetter: boolean;
  description: string; descriptionAr: string;
}

/* ─── KPI frameworks: 12 solution slugs + risk-management ─── */
export const KPI_FRAMEWORKS: Record<string, KpiDef[]> = {
  'supply-chain-strategy': [
    { id: 'por', label: 'Perfect Order Rate', labelAr: 'معدّل الطلب المثالي', unit: '%', unitAr: '%', targetValue: 95, targetLabel: '>95%', benchmarkValue: 78, benchmarkLabel: '78%', higherIsBetter: true, description: 'Orders delivered complete, on time, undamaged, with correct documentation.', descriptionAr: 'الطلبات المسلّمة بالكامل وفي الوقت وبلا أضرار وبوثائق صحيحة.' },
    { id: 'otif', label: 'OTIF', labelAr: 'OTIF', unit: '%', unitAr: '%', targetValue: 92, targetLabel: '>92%', benchmarkValue: 82, benchmarkLabel: '82%', higherIsBetter: true, description: 'On-Time In-Full delivery performance.', descriptionAr: 'أداء التسليم في الوقت وبالكامل.' },
    { id: 'sccost', label: 'SC Cost % Revenue', labelAr: 'تكلفة سلسلة الإمداد % من الإيراد', unit: '%', unitAr: '%', targetValue: 8, targetLabel: '<8%', benchmarkValue: 13, benchmarkLabel: '13%', higherIsBetter: false, description: 'Total supply chain cost as a percentage of total revenue.', descriptionAr: 'إجمالي تكلفة سلسلة الإمداد كنسبة مئوية من الإيراد الكلي.' },
    { id: 'c2c', label: 'Cash-to-Cash Days', labelAr: 'أيام دورة النقد إلى النقد', unit: 'days', unitAr: 'أيام', targetValue: 28, targetLabel: '<28 days', benchmarkValue: 48, benchmarkLabel: '48 days', higherIsBetter: false, description: 'Days from paying for inventory to collecting from customers.', descriptionAr: 'الأيام من دفع ثمن المخزون إلى تحصيل المبالغ من العملاء.' },
    { id: 'fa', label: 'Forecast Accuracy', labelAr: 'دقّة التوقّع', unit: '%', unitAr: '%', targetValue: 85, targetLabel: '>85%', benchmarkValue: 65, benchmarkLabel: '65%', higherIsBetter: true, description: 'Accuracy of demand forecast vs actual demand.', descriptionAr: 'دقّة توقّع الطلب مقارنةً بالطلب الفعلي.' },
    { id: 'turns', label: 'Inventory Turns/yr', labelAr: 'دوران المخزون/سنة', unit: 'turns', unitAr: 'دورة', targetValue: 10, targetLabel: '>10/yr', benchmarkValue: 6, benchmarkLabel: '6/yr', higherIsBetter: true, description: 'How many times inventory is sold and replaced per year.', descriptionAr: 'عدد مرات بيع المخزون واستبداله في السنة.' },
  ],
  'procurement-excellence': [
    { id: 'savings', label: 'Procurement Savings %', labelAr: 'وفورات المشتريات %', unit: '%', unitAr: '%', targetValue: 10, targetLabel: '8–15%', benchmarkValue: 4, benchmarkLabel: '4%', higherIsBetter: true, description: 'Savings captured as % of managed spend.', descriptionAr: 'الوفورات المحقّقة كنسبة من الإنفاق المُدار.' },
    { id: 'pocycle', label: 'PO Cycle Time', labelAr: 'زمن دورة أمر الشراء', unit: 'days', unitAr: 'أيام', targetValue: 10, targetLabel: '<10 days', benchmarkValue: 22, benchmarkLabel: '22 days', higherIsBetter: false, description: 'End-to-end time from requisition to PO issued.', descriptionAr: 'الزمن الكلي من الطلب إلى إصدار أمر الشراء.' },
    { id: 'pocomp', label: 'PO Compliance Rate', labelAr: 'معدّل امتثال أوامر الشراء', unit: '%', unitAr: '%', targetValue: 92, targetLabel: '>92%', benchmarkValue: 72, benchmarkLabel: '72%', higherIsBetter: true, description: 'POs raised against approved contracts vs total POs.', descriptionAr: 'أوامر الشراء مقابل العقود المعتمدة من إجمالي أوامر الشراء.' },
    { id: 'sotif', label: 'Supplier OTIF', labelAr: 'OTIF المورّد', unit: '%', unitAr: '%', targetValue: 94, targetLabel: '>94%', benchmarkValue: 80, benchmarkLabel: '80%', higherIsBetter: true, description: 'Supplier delivery on-time and in-full.', descriptionAr: 'تسليم المورّد في الوقت وبالكامل.' },
    { id: 'ccov', label: 'Contract Coverage %', labelAr: 'تغطية العقود %', unit: '%', unitAr: '%', targetValue: 88, targetLabel: '>88%', benchmarkValue: 58, benchmarkLabel: '58%', higherIsBetter: true, description: 'Spend covered by active contracts vs total spend.', descriptionAr: 'الإنفاق المغطّى بعقود نشطة من الإجمالي.' },
    { id: 'ttc', label: 'Time-to-Contract (days)', labelAr: 'الزمن حتى التعاقد (أيام)', unit: 'days', unitAr: 'أيام', targetValue: 28, targetLabel: '<28 days', benchmarkValue: 52, benchmarkLabel: '52 days', higherIsBetter: false, description: 'Days from RFQ issue to signed contract.', descriptionAr: 'الأيام من إصدار RFQ إلى التوقيع على العقد.' },
  ],
  'lean-six-sigma': [
    { id: 'pce', label: 'Process Cycle Efficiency', labelAr: 'كفاءة دورة العملية', unit: '%', unitAr: '%', targetValue: 25, targetLabel: '>25%', benchmarkValue: 8, benchmarkLabel: '8%', higherIsBetter: true, description: 'Value-added time as % of total lead time.', descriptionAr: 'الوقت المضيف للقيمة كنسبة من إجمالي مهلة التوريد.' },
    { id: 'sigma', label: 'Sigma Level', labelAr: 'مستوى سيجما', unit: 'σ', unitAr: 'σ', targetValue: 4.0, targetLabel: '>4.0σ', benchmarkValue: 2.5, benchmarkLabel: '2.5σ', higherIsBetter: true, description: 'Defects per million opportunities converted to sigma scale.', descriptionAr: 'العيوب لكل مليون فرصة محوّلة إلى مقياس سيجما.' },
    { id: 'ftr', label: 'First-Time-Right Rate', labelAr: 'معدّل الصحة من أول مرة', unit: '%', unitAr: '%', targetValue: 92, targetLabel: '>92%', benchmarkValue: 70, benchmarkLabel: '70%', higherIsBetter: true, description: 'Processes completed correctly on the first attempt.', descriptionAr: 'العمليات المنجزة بصواب من المحاولة الأولى.' },
    { id: 'ltr', label: 'Lead Time Reduction %', labelAr: 'خفض مهلة التوريد %', unit: '%', unitAr: '%', targetValue: 35, targetLabel: '>35%', benchmarkValue: 10, benchmarkLabel: '10%', higherIsBetter: true, description: 'Lead time reduction vs pre-lean baseline.', descriptionAr: 'خفض مهلة التوريد مقابل الخط الأساسي قبل Lean.' },
    { id: 'copq', label: 'Cost of Poor Quality %', labelAr: 'تكلفة الجودة الرديئة %', unit: '%', unitAr: '%', targetValue: 2, targetLabel: '<2%', benchmarkValue: 8, benchmarkLabel: '8%', higherIsBetter: false, description: 'Cost of defects, rework, and warranty as % of revenue.', descriptionAr: 'تكلفة العيوب وإعادة العمل والضمان كنسبة من الإيراد.' },
    { id: 'kaizen', label: 'Kaizen Events/Quarter', labelAr: 'أحداث كايزن/ربع', unit: 'events', unitAr: 'حدث', targetValue: 6, targetLabel: '>6/qtr', benchmarkValue: 1, benchmarkLabel: '1/qtr', higherIsBetter: true, description: 'Number of structured improvement events per quarter.', descriptionAr: 'عدد أحداث التحسين المنظّمة لكل ربع سنة.' },
  ],
  'digital-transformation': [
    { id: 'erpu', label: 'ERP Module Utilisation', labelAr: 'استخدام وحدات ERP', unit: '%', unitAr: '%', targetValue: 85, targetLabel: '>85%', benchmarkValue: 42, benchmarkLabel: '42%', higherIsBetter: true, description: 'ERP modules actively used vs licensed.', descriptionAr: 'وحدات ERP المستخدمة فعلياً من المرخّصة.' },
    { id: 'auto', label: 'Process Automation Rate', labelAr: 'معدّل أتمتة العمليات', unit: '%', unitAr: '%', targetValue: 70, targetLabel: '>70%', benchmarkValue: 22, benchmarkLabel: '22%', higherIsBetter: true, description: 'Procurement processes automated end-to-end.', descriptionAr: 'عمليات المشتريات المؤتمتة من البداية إلى النهاية.' },
    { id: 'stp', label: 'Straight-Through PO Rate', labelAr: 'معدّل أوامر الشراء المباشرة', unit: '%', unitAr: '%', targetValue: 80, targetLabel: '>80%', benchmarkValue: 28, benchmarkLabel: '28%', higherIsBetter: true, description: 'POs processed without manual intervention.', descriptionAr: 'أوامر الشراء المعالَجة بلا تدخّل يدوي.' },
    { id: 'da', label: 'Data Accuracy Rate', labelAr: 'معدّل دقّة البيانات', unit: '%', unitAr: '%', targetValue: 97, targetLabel: '>97%', benchmarkValue: 75, benchmarkLabel: '75%', higherIsBetter: true, description: 'Master data accuracy across ERP system.', descriptionAr: 'دقّة البيانات الرئيسية عبر نظام ERP.' },
    { id: 'dar', label: 'Digital Adoption Rate', labelAr: 'معدّل تبنّي الرقمنة', unit: '%', unitAr: '%', targetValue: 90, targetLabel: '>90%', benchmarkValue: 50, benchmarkLabel: '50%', higherIsBetter: true, description: 'Staff actively using digital procurement tools.', descriptionAr: 'الموظفون الذين يستخدمون أدوات المشتريات الرقمية فعلياً.' },
    { id: 'mpr', label: 'Manual Process Reduction', labelAr: 'خفض العمليات اليدوية', unit: '%', unitAr: '%', targetValue: 60, targetLabel: '>60%', benchmarkValue: 18, benchmarkLabel: '18%', higherIsBetter: true, description: 'Reduction in manual steps vs pre-digitalisation baseline.', descriptionAr: 'الخفض في الخطوات اليدوية مقابل الخط الأساسي قبل الرقمنة.' },
  ],
  'sustainability-esg': [
    { id: 'esga', label: 'Supplier ESG Audit Coverage', labelAr: 'تغطية تدقيق ESG للمورّدين', unit: '%', unitAr: '%', targetValue: 95, targetLabel: '>95%', benchmarkValue: 28, benchmarkLabel: '28%', higherIsBetter: true, description: 'Strategic suppliers with completed ESG audit.', descriptionAr: 'المورّدون الاستراتيجيون الذين اجتازوا تدقيق ESG.' },
    { id: 's3', label: 'Scope 3 Coverage', labelAr: 'تغطية النطاق 3', unit: '%', unitAr: '%', targetValue: 80, targetLabel: '>80%', benchmarkValue: 22, benchmarkLabel: '22%', higherIsBetter: true, description: 'Supply chain Scope 3 emissions measured and reported.', descriptionAr: 'انبعاثات النطاق 3 لسلسلة الإمداد المقاسة والمُبلَّغ عنها.' },
    { id: 'lc', label: 'Local Content / Iktva %', labelAr: 'المحتوى المحلي / Iktva %', unit: '%', unitAr: '%', targetValue: 50, targetLabel: '>50%', benchmarkValue: 28, benchmarkLabel: '28%', higherIsBetter: true, description: 'Local content percentage achieved or Iktva score.', descriptionAr: 'نسبة المحتوى المحلي المحقّقة أو درجة Iktva.' },
    { id: 'ss', label: 'Sustainable Spend %', labelAr: 'الإنفاق المستدام %', unit: '%', unitAr: '%', targetValue: 40, targetLabel: '>40%', benchmarkValue: 12, benchmarkLabel: '12%', higherIsBetter: true, description: 'Spend with ESG-compliant / sustainable suppliers.', descriptionAr: 'الإنفاق مع المورّدين المستدامين والمتوائمين مع ESG.' },
    { id: 'cr', label: 'Carbon Reduction YoY %', labelAr: 'خفض الكربون سنوياً %', unit: '%', unitAr: '%', targetValue: 15, targetLabel: '>15%', benchmarkValue: 3, benchmarkLabel: '3%', higherIsBetter: true, description: 'Year-on-year supply chain carbon reduction.', descriptionAr: 'خفض الكربون في سلسلة الإمداد مقارنةً بالعام السابق.' },
    { id: 'esgs', label: 'ESG-Compliant Suppliers %', labelAr: 'المورّدون المتوائمون مع ESG %', unit: '%', unitAr: '%', targetValue: 90, targetLabel: '>90%', benchmarkValue: 32, benchmarkLabel: '32%', higherIsBetter: true, description: 'Suppliers meeting minimum ESG standards.', descriptionAr: 'المورّدون الذين يستوفون الحدّ الأدنى لمعايير ESG.' },
  ],
  'governance-compliance': [
    { id: 'pcr', label: 'Policy Compliance Rate', labelAr: 'معدّل الامتثال للسياسات', unit: '%', unitAr: '%', targetValue: 92, targetLabel: '>92%', benchmarkValue: 62, benchmarkLabel: '62%', higherIsBetter: true, description: 'Procurement transactions complying with policies.', descriptionAr: 'المعاملات المشتراة المتوائمة مع السياسات.' },
    { id: 'aud', label: 'Audit Score (/100)', labelAr: 'درجة التدقيق (/100)', unit: '/100', unitAr: '/100', targetValue: 85, targetLabel: '>85/100', benchmarkValue: 60, benchmarkLabel: '60/100', higherIsBetter: true, description: 'Most recent internal or external audit score.', descriptionAr: 'درجة أحدث تدقيق داخلي أو خارجي.' },
    { id: 'cco', label: 'Contract Coverage %', labelAr: 'تغطية العقود %', unit: '%', unitAr: '%', targetValue: 90, targetLabel: '>90%', benchmarkValue: 55, benchmarkLabel: '55%', higherIsBetter: true, description: 'Spend covered by active contracts.', descriptionAr: 'الإنفاق المغطّى بعقود نشطة.' },
    { id: 'mav', label: 'Maverick Spend %', labelAr: 'الإنفاق خارج القنوات %', unit: '%', unitAr: '%', targetValue: 5, targetLabel: '<5%', benchmarkValue: 20, benchmarkLabel: '20%', higherIsBetter: false, description: 'Spend outside approved channels as % of total.', descriptionAr: 'الإنفاق خارج القنوات المعتمدة كنسبة من الإجمالي.' },
    { id: 'doa', label: 'DoA Violations /quarter', labelAr: 'مخالفات تفويض الصلاحيات /ربع', unit: '/qtr', unitAr: '/ربع', targetValue: 0, targetLabel: '0 per qtr', benchmarkValue: 4, benchmarkLabel: '4/qtr', higherIsBetter: false, description: 'Delegation of authority violations per quarter.', descriptionAr: 'مخالفات تفويض الصلاحيات لكل ربع سنة.' },
    { id: 'asa', label: 'Approved Supplier Adherence', labelAr: 'الالتزام بالمورّدين المعتمدين', unit: '%', unitAr: '%', targetValue: 95, targetLabel: '>95%', benchmarkValue: 70, benchmarkLabel: '70%', higherIsBetter: true, description: 'Purchases made from approved supplier list.', descriptionAr: 'المشتريات من قائمة المورّدين المعتمدين.' },
  ],
  'contract-lifecycle-management': [
    { id: 'cact', label: 'Contract Authoring Time (days)', labelAr: 'زمن صياغة العقد (أيام)', unit: 'days', unitAr: 'أيام', targetValue: 10, targetLabel: '<10 days', benchmarkValue: 28, benchmarkLabel: '28 days', higherIsBetter: false, description: 'Average days to author and finalise a contract.', descriptionAr: 'متوسط الأيام اللازمة لصياغة عقد وإنهائه.' },
    { id: 'neg', label: 'Negotiation Cycle Time (days)', labelAr: 'زمن دورة التفاوض (أيام)', unit: 'days', unitAr: 'أيام', targetValue: 15, targetLabel: '<15 days', benchmarkValue: 35, benchmarkLabel: '35 days', higherIsBetter: false, description: 'Days from first draft to agreed terms.', descriptionAr: 'الأيام من المسوّدة الأولى إلى الشروط المتّفق عليها.' },
    { id: 'ccomp', label: 'Contract Compliance Rate', labelAr: 'معدّل امتثال العقود', unit: '%', unitAr: '%', targetValue: 95, targetLabel: '>95%', benchmarkValue: 70, benchmarkLabel: '70%', higherIsBetter: true, description: 'Contracts complying with regulatory requirements.', descriptionAr: 'العقود المتوائمة مع المتطلبات التنظيمية.' },
    { id: 'ren', label: 'On-Time Renewal Rate', labelAr: 'معدّل التجديد في الوقت المحدد', unit: '%', unitAr: '%', targetValue: 95, targetLabel: '>95%', benchmarkValue: 58, benchmarkLabel: '58%', higherIsBetter: true, description: 'Contracts renewed before expiry without emergency sourcing.', descriptionAr: 'العقود المجدَّدة قبل انتهائها بلا توريد طارئ.' },
    { id: 'vl', label: 'Value Leakage %', labelAr: 'تسرّب القيمة %', unit: '%', unitAr: '%', targetValue: 2, targetLabel: '<2%', benchmarkValue: 9, benchmarkLabel: '9%', higherIsBetter: false, description: 'Contract value lost through non-enforcement or under-performance.', descriptionAr: 'قيمة العقد المفقودة بسبب عدم التطبيق أو ضعف الأداء.' },
    { id: 'slab', label: 'SLA Breach Rate %', labelAr: 'معدّل مخالفة SLA %', unit: '%', unitAr: '%', targetValue: 3, targetLabel: '<3%', benchmarkValue: 14, benchmarkLabel: '14%', higherIsBetter: false, description: 'Supplier SLA breaches as % of total obligations.', descriptionAr: 'مخالفات SLA للمورّد كنسبة من إجمالي الالتزامات.' },
  ],
  'supplier-relationship-governance': [
    { id: 'sotif2', label: 'Supplier OTIF %', labelAr: 'OTIF المورّد %', unit: '%', unitAr: '%', targetValue: 94, targetLabel: '>94%', benchmarkValue: 80, benchmarkLabel: '80%', higherIsBetter: true, description: 'Supplier on-time in-full delivery rate.', descriptionAr: 'معدّل تسليم المورّد في الوقت وبالكامل.' },
    { id: 'ppm', label: 'Defect Rate (PPM)', labelAr: 'معدّل العيوب (PPM)', unit: 'PPM', unitAr: 'PPM', targetValue: 500, targetLabel: '<500 PPM', benchmarkValue: 2500, benchmarkLabel: '2500 PPM', higherIsBetter: false, description: 'Supplier defects per million units delivered.', descriptionAr: 'عيوب المورّد لكل مليون وحدة مسلّمة.' },
    { id: 'ss2', label: 'Single-Source Dependency %', labelAr: 'الاعتماد على مصدر وحيد %', unit: '%', unitAr: '%', targetValue: 20, targetLabel: '<20%', benchmarkValue: 50, benchmarkLabel: '50%', higherIsBetter: false, description: 'Critical spend with single-source suppliers.', descriptionAr: 'الإنفاق الحرج مع مورّدين أحاديي المصدر.' },
    { id: 'jbp', label: 'JBP Coverage (strategic tier)', labelAr: 'تغطية خطة الأعمال المشتركة', unit: '%', unitAr: '%', targetValue: 100, targetLabel: '100%', benchmarkValue: 12, benchmarkLabel: '12%', higherIsBetter: true, description: '% of strategic suppliers with an active joint business plan.', descriptionAr: '% من المورّدين الاستراتيجيين الذين لديهم خطة أعمال مشتركة نشطة.' },
    { id: 'esga2', label: 'ESG Audit Coverage %', labelAr: 'تغطية تدقيق ESG %', unit: '%', unitAr: '%', targetValue: 100, targetLabel: '100%', benchmarkValue: 30, benchmarkLabel: '30%', higherIsBetter: true, description: 'Strategic suppliers with completed ESG audit.', descriptionAr: 'المورّدون الاستراتيجيون الذين اجتازوا تدقيق ESG.' },
    { id: 'sc2', label: 'On-Time Scorecard Review %', labelAr: 'مراجعة بطاقة التقييم في الوقت %', unit: '%', unitAr: '%', targetValue: 95, targetLabel: '>95%', benchmarkValue: 48, benchmarkLabel: '48%', higherIsBetter: true, description: 'Scorecard reviews completed on scheduled cadence.', descriptionAr: 'مراجعات بطاقة التقييم المنجزة وفق الوتيرة المجدولة.' },
  ],
  'resiliency': [
    { id: 'rtoa', label: 'RTO Attainment %', labelAr: 'تحقيق هدف زمن التعافي %', unit: '%', unitAr: '%', targetValue: 95, targetLabel: '>95%', benchmarkValue: 48, benchmarkLabel: '48%', higherIsBetter: true, description: 'Business processes recovered within Recovery Time Objective.', descriptionAr: 'العمليات المستردّة ضمن هدف زمن التعافي.' },
    { id: 'mttr', label: 'Mean Time to Recover (hrs)', labelAr: 'متوسط زمن التعافي (ساعات)', unit: 'hrs', unitAr: 'ساعة', targetValue: 72, targetLabel: '<72h', benchmarkValue: 168, benchmarkLabel: '168h', higherIsBetter: false, description: 'Average hours to recover from a supply chain disruption.', descriptionAr: 'متوسط الساعات للتعافي من اضطراب سلسلة الإمداد.' },
    { id: 'dsc', label: 'Dual-Source Coverage %', labelAr: 'تغطية المصدر الثنائي %', unit: '%', unitAr: '%', targetValue: 90, targetLabel: '>90%', benchmarkValue: 28, benchmarkLabel: '28%', higherIsBetter: true, description: 'Critical items with a qualified second source.', descriptionAr: 'الأصناف الحرجة التي لها مصدر ثانٍ مؤهَّل.' },
    { id: 'buf', label: 'Buffer Stock (days supply)', labelAr: 'المخزون الاحتياطي (أيام إمداد)', unit: 'days', unitAr: 'أيام', targetValue: 30, targetLabel: '>30 days', benchmarkValue: 10, benchmarkLabel: '10 days', higherIsBetter: true, description: 'Days of supply held as buffer for critical items.', descriptionAr: 'أيام الإمداد المحتفظ بها احتياطياً للأصناف الحرجة.' },
    { id: 'sld', label: 'Service Level During Disruption', labelAr: 'مستوى الخدمة خلال الاضطراب', unit: '%', unitAr: '%', targetValue: 80, targetLabel: '>80%', benchmarkValue: 42, benchmarkLabel: '42%', higherIsBetter: true, description: 'Customer service level maintained during a supply disruption.', descriptionAr: 'مستوى خدمة العملاء المحافَظ عليه خلال اضطراب التوريد.' },
    { id: 'rar', label: 'Revenue at Risk %', labelAr: 'الإيراد المعرّض للخطر %', unit: '%', unitAr: '%', targetValue: 3, targetLabel: '<3%', benchmarkValue: 12, benchmarkLabel: '12%', higherIsBetter: false, description: 'Annual revenue at risk from supply chain disruption.', descriptionAr: 'الإيراد السنوي المعرّض للخطر من اضطراب سلسلة الإمداد.' },
  ],
  'value-engineering': [
    { id: 'ves', label: 'VE Savings % Spend', labelAr: 'وفورات هندسة القيمة % من الإنفاق', unit: '%', unitAr: '%', targetValue: 10, targetLabel: '8–15%', benchmarkValue: 3, benchmarkLabel: '3%', higherIsBetter: true, description: 'Value engineering savings as % of addressable spend.', descriptionAr: 'وفورات هندسة القيمة كنسبة من الإنفاق القابل للمعالجة.' },
    { id: 'scv', label: 'Should-Cost Variance %', labelAr: 'انحراف التكلفة المتوقّعة %', unit: '%', unitAr: '%', targetValue: 5, targetLabel: '<5%', benchmarkValue: 18, benchmarkLabel: '18%', higherIsBetter: false, description: 'Actual cost vs should-cost model variance.', descriptionAr: 'التكلفة الفعلية مقابل انحراف نموذج التكلفة المتوقّعة.' },
    { id: 'iir', label: 'Idea-to-Implementation Rate', labelAr: 'معدّل الأفكار المطبَّقة', unit: '%', unitAr: '%', targetValue: 60, targetLabel: '>60%', benchmarkValue: 25, benchmarkLabel: '25%', higherIsBetter: true, description: 'VE ideas approved and successfully implemented.', descriptionAr: 'أفكار هندسة القيمة المعتمدة والمطبَّقة بنجاح.' },
    { id: 'spc', label: 'Specification Compliance %', labelAr: 'امتثال المواصفات %', unit: '%', unitAr: '%', targetValue: 98, targetLabel: '>98%', benchmarkValue: 84, benchmarkLabel: '84%', higherIsBetter: true, description: 'VE outcomes meeting original specification requirements.', descriptionAr: 'نتائج هندسة القيمة التي تستوفي متطلبات المواصفات الأصلية.' },
    { id: 'tis', label: 'Time to Savings Realisation (days)', labelAr: 'الوقت إلى تحقّق الوفورات (أيام)', unit: 'days', unitAr: 'أيام', targetValue: 90, targetLabel: '<90 days', benchmarkValue: 210, benchmarkLabel: '210 days', higherIsBetter: false, description: 'Average days from VE idea approval to savings realised.', descriptionAr: 'متوسط الأيام من اعتماد فكرة هندسة القيمة إلى تحقّق الوفورات.' },
    { id: 'ssat', label: 'Stakeholder Satisfaction (/5)', labelAr: 'رضا أصحاب المصلحة (/5)', unit: '/5', unitAr: '/5', targetValue: 4.2, targetLabel: '>4.2/5', benchmarkValue: 3.1, benchmarkLabel: '3.1/5', higherIsBetter: true, description: 'Stakeholder satisfaction with VE outcomes.', descriptionAr: 'رضا أصحاب المصلحة عن نتائج هندسة القيمة.' },
  ],
  'process-improvement-policy': [
    { id: 'pce2', label: 'Process Cycle Efficiency', labelAr: 'كفاءة دورة العملية', unit: '%', unitAr: '%', targetValue: 25, targetLabel: '>25%', benchmarkValue: 8, benchmarkLabel: '8%', higherIsBetter: true, description: 'Value-added time as % of total process lead time.', descriptionAr: 'الوقت المضيف للقيمة كنسبة من إجمالي مهلة العملية.' },
    { id: 'ltr2', label: 'Lead Time Reduction %', labelAr: 'خفض مهلة التوريد %', unit: '%', unitAr: '%', targetValue: 40, targetLabel: '>40%', benchmarkValue: 10, benchmarkLabel: '10%', higherIsBetter: true, description: 'Process lead time reduction vs pre-improvement baseline.', descriptionAr: 'خفض مهلة العملية مقابل الخط الأساسي قبل التحسين.' },
    { id: 'ftr2', label: 'First-Time-Right Rate %', labelAr: 'معدّل الصحة من أول مرة %', unit: '%', unitAr: '%', targetValue: 92, targetLabel: '>92%', benchmarkValue: 70, benchmarkLabel: '70%', higherIsBetter: true, description: 'Processes completed correctly on first attempt.', descriptionAr: 'العمليات المنجزة بصواب من المحاولة الأولى.' },
    { id: 'pcr2', label: 'Policy Compliance Rate %', labelAr: 'معدّل امتثال السياسات %', unit: '%', unitAr: '%', targetValue: 95, targetLabel: '>95%', benchmarkValue: 60, benchmarkLabel: '60%', higherIsBetter: true, description: 'Operations complying with documented policies.', descriptionAr: 'العمليات المتوائمة مع السياسات الموثّقة.' },
    { id: 'afct', label: 'Audit Finding Closure (days)', labelAr: 'إغلاق ملاحظات التدقيق (أيام)', unit: 'days', unitAr: 'أيام', targetValue: 30, targetLabel: '<30 days', benchmarkValue: 95, benchmarkLabel: '95 days', higherIsBetter: false, description: 'Average days to close an audit finding.', descriptionAr: 'متوسط الأيام لإغلاق ملاحظة تدقيق.' },
    { id: 'rfr', label: 'Repeat Finding Rate %', labelAr: 'معدّل تكرار الملاحظات %', unit: '%', unitAr: '%', targetValue: 5, targetLabel: '<5%', benchmarkValue: 32, benchmarkLabel: '32%', higherIsBetter: false, description: 'Audit findings that recur in the next audit cycle.', descriptionAr: 'ملاحظات التدقيق التي تتكرّر في الدورة التالية.' },
  ],
  'training-capability-building': [
    { id: 'asi', label: 'Assessment Score Improvement (pts)', labelAr: 'تحسين درجة التقييم (نقطة)', unit: 'pts', unitAr: 'نقطة', targetValue: 25, targetLabel: '>25 pts', benchmarkValue: 10, benchmarkLabel: '10 pts', higherIsBetter: true, description: 'Points improvement in pre vs post-training assessment.', descriptionAr: 'نقاط التحسّن في التقييم قبل وبعد التدريب.' },
    { id: 'tcr', label: 'Training Completion Rate %', labelAr: 'معدّل إكمال التدريب %', unit: '%', unitAr: '%', targetValue: 90, targetLabel: '>90%', benchmarkValue: 60, benchmarkLabel: '60%', higherIsBetter: true, description: 'Staff completing assigned training programmes.', descriptionAr: 'الموظفون الذين أكملوا برامج التدريب المسنَدة إليهم.' },
    { id: 'cepr', label: 'CIPS Exam Pass Rate %', labelAr: 'معدّل نجاح اختبار CIPS %', unit: '%', unitAr: '%', targetValue: 80, targetLabel: '>80%', benchmarkValue: 58, benchmarkLabel: '58%', higherIsBetter: true, description: 'Staff passing CIPS professional qualification exams.', descriptionAr: 'الموظفون الذين نجحوا في اختبارات CIPS المهنية.' },
    { id: 'bcs', label: 'Behaviour Change Score (90-day)', labelAr: 'درجة تغيير السلوك (90 يوماً)', unit: '%', unitAr: '%', targetValue: 70, targetLabel: '>70%', benchmarkValue: 30, benchmarkLabel: '30%', higherIsBetter: true, description: '% of trained behaviours observed on-the-job at 90 days.', descriptionAr: '% من السلوكيات المدرَّبة الملاحَظة في العمل عند 90 يوماً.' },
    { id: 'kpii', label: 'Post-Training KPI Improvement %', labelAr: 'تحسين مؤشرات الأداء بعد التدريب %', unit: '%', unitAr: '%', targetValue: 15, targetLabel: '>15%', benchmarkValue: 4, benchmarkLabel: '4%', higherIsBetter: true, description: 'Improvement in team KPIs attributable to training.', descriptionAr: 'تحسّن مؤشرات أداء الفريق العائد إلى التدريب.' },
    { id: 'roi', label: 'Training ROI %', labelAr: 'عائد الاستثمار في التدريب %', unit: '%', unitAr: '%', targetValue: 400, targetLabel: '>400%', benchmarkValue: 110, benchmarkLabel: '110%', higherIsBetter: true, description: 'Return on training investment (Kirkpatrick Level 4).', descriptionAr: 'عائد الاستثمار في التدريب (كيركباتريك المستوى 4).' },
  ],
  'risk-management': [
    { id: 'rrc', label: 'Risk Register Coverage %', labelAr: 'تغطية سجلّ المخاطر %', unit: '%', unitAr: '%', targetValue: 95, targetLabel: '>95%', benchmarkValue: 42, benchmarkLabel: '42%', higherIsBetter: true, description: 'Supply chain risks identified and registered.', descriptionAr: 'مخاطر سلسلة الإمداد المحدّدة والمسجَّلة.' },
    { id: 'bcpt', label: 'BCP Test Pass Rate %', labelAr: 'معدّل نجاح اختبار الاستمرارية %', unit: '%', unitAr: '%', targetValue: 100, targetLabel: '100%', benchmarkValue: 32, benchmarkLabel: '32%', higherIsBetter: true, description: 'BCP exercises completed and passed annually.', descriptionAr: 'تمارين خطة الاستمرارية المنجزة والناجحة سنوياً.' },
    { id: 'rtoa2', label: 'RTO Attainment %', labelAr: 'تحقيق هدف زمن التعافي %', unit: '%', unitAr: '%', targetValue: 95, targetLabel: '>95%', benchmarkValue: 45, benchmarkLabel: '45%', higherIsBetter: true, description: 'Processes recovered within Recovery Time Objective.', descriptionAr: 'العمليات المستردّة ضمن هدف زمن التعافي.' },
    { id: 'crm', label: 'Critical Risk Mitigation Rate %', labelAr: 'معدّل تخفيف المخاطر الحرجة %', unit: '%', unitAr: '%', targetValue: 90, targetLabel: '>90%', benchmarkValue: 48, benchmarkLabel: '48%', higherIsBetter: true, description: 'Critical risks with active mitigation controls in place.', descriptionAr: 'المخاطر الحرجة التي لديها ضوابط تخفيف نشطة.' },
    { id: 'srs', label: 'Supplier Risk Score (avg /100)', labelAr: 'درجة مخاطر المورّد (متوسط /100)', unit: '/100', unitAr: '/100', targetValue: 75, targetLabel: '>75/100', benchmarkValue: 50, benchmarkLabel: '50/100', higherIsBetter: true, description: 'Average supplier risk health score (higher = lower risk).', descriptionAr: 'متوسط درجة صحة مخاطر المورّدين (أعلى = مخاطر أقل).' },
    { id: 'rrc2', label: 'Risk Review Compliance %', labelAr: 'امتثال مراجعة المخاطر %', unit: '%', unitAr: '%', targetValue: 100, targetLabel: '100%', benchmarkValue: 52, benchmarkLabel: '52%', higherIsBetter: true, description: 'Risk reviews completed on scheduled cadence.', descriptionAr: 'مراجعات المخاطر المنجزة وفق الوتيرة المجدولة.' },
  ],
};

/* ─── KPI template CSV builder (pure, exported for unit tests) ─── */
/**
 * Builds the rows for the KPI data-collection CSV template.
 *
 * Column layout (7 columns):
 *   0  KPI ID
 *   1  Input Field
 *   2  Your Value
 *   3  Unit
 *   4  Target
 *   5  GCC Benchmark
 *   6  Status  ← Excel IF formula; uses >= for higherIsBetter, <= otherwise
 */
export function buildKpiTemplateRows(
  kpis: KpiDef[],
  frameworkLabel: string,
  today: string,
): string[][] {
  const EMPTY7 = ['', '', '', '', '', '', ''];

  const allRows: string[][] = [
    // Branding / title block
    ['I Supply Chain — KPI Data Collection Template', '', '', '', '', '', ''],
    [`Framework: ${frameworkLabel}`, '', '', '', '', '', ''],
    [`Generated: ${today} | Ma'in Alhaqash MCIPS CPSM | isupplychain.com`, '', '', '', '', '', ''],
    [...EMPTY7],
    ['INSTRUCTIONS:', 'Fill in the "Your Value" column (column C) for EVERY input row.', '', '', '', '', ''],
    ['', 'Do NOT modify KPI ID, Input Field, Unit, or Formula columns.', '', '', '', '', ''],
    ['', 'When complete, click "Import CSV" in the KPI Dashboard to auto-calculate results.', '', '', '', '', ''],
    ['', 'Each KPI section shows what raw data to collect and exactly where to find it.', '', '', '', '', ''],
    [...EMPTY7],
    // Column headers
    ['KPI ID', 'Input Field', 'Your Value', 'Unit', 'Target', 'GCC Benchmark', 'Status'],
  ];

  kpis.forEach(k => {
    const spec = KPI_DATA_SPECS[k.id];
    const cmp = k.higherIsBetter ? '>=' : '<=';

    // KPI section header
    allRows.push([...EMPTY7]);
    allRows.push([
      `=== ${k.label.toUpperCase()} ===`,
      spec ? spec.methodology.substring(0, 120) + (spec.methodology.length > 120 ? '…' : '') : k.description,
      '', '', '', '', spec ? spec.formula : '',
    ]);

    if (spec) {
      // One row per raw input
      spec.inputs.forEach(inp => {
        allRows.push([
          k.id,
          inp.label,
          '',                  // ← client fills this
          inp.unit,
          inp.dataSource,
          '',
          '',
        ]);
      });
      // Notes row
      if (spec.notes) {
        allRows.push(['', `📌 Note: ${spec.notes}`, '', '', '', '', '']);
      }
      // Calculated result placeholder – Status formula uses the right comparison direction
      const resultRowNum = allRows.length + 1; // 1-indexed for Excel
      allRows.push([
        `${k.id}__result`,
        `[AUTO-CALCULATED] ${k.label}`,
        '← calculated on import',
        k.unit,
        k.targetLabel,
        k.benchmarkLabel,
        `=IF(C${resultRowNum}="","",IF(C${resultRowNum}${cmp}${k.targetValue},"✅ On Target","❌ Below Target"))`,
      ]);
    } else {
      // Fallback: simple direct entry
      allRows.push([k.id, `Enter your ${k.label} value directly`, '', k.unit, k.targetLabel, k.benchmarkLabel, '']);
      const resultRowNum = allRows.length + 1;
      allRows.push([
        `${k.id}__result`,
        `[DIRECT ENTRY] ${k.label}`,
        '',
        k.unit,
        k.targetLabel,
        k.benchmarkLabel,
        `=IF(C${resultRowNum}="","",IF(C${resultRowNum}${cmp}${k.targetValue},"✅ On Target","❌ Below Target"))`,
      ]);
    }
  });

  // Footer
  allRows.push([...EMPTY7]);
  allRows.push(['--- END OF TEMPLATE ---', 'Return the completed file to I Supply Chain or import directly into the KPI Dashboard.', '', '', '', '', '']);

  return allRows;
}

/**
 * Pure helper: given the raw inputs collected per KPI from a new-format CSV,
 * calculate each KPI value and return the populated values map plus a log.
 *
 * Exported so it can be unit-tested independently of the React component.
 *
 * Graceful partial-data handling:
 *   - If no inputs at all were provided for a KPI → skip with log entry.
 *   - If some but not all required inputs were provided (partial data) →
 *     attempt positional fallback; if counts still don't match → skip with log entry.
 *   - If calculate() returns NaN → skip with log entry.
 *   - Only fully-computable KPIs are written to `values`.
 */
export function calcKpisFromInputs(
  kpis: KpiDef[],
  inputsByKpi: Record<string, Record<string, number>>,
  isAr: boolean,
): { values: Record<string, string>; log: string[]; count: number } {
  const values: Record<string, string> = {};
  const log: string[] = [];
  let count = 0;

  kpis.forEach(k => {
    const spec = KPI_DATA_SPECS[k.id];
    const inputs = inputsByKpi[k.id] ? { ...inputsByKpi[k.id] } : undefined;

    if (!inputs || !spec) {
      if (spec) log.push(isAr
        ? `${k.labelAr}: لم يتم تقديم قيم إدخال — تم التخطّي.`
        : `${k.label}: no input values found — skipped.`);
      return;
    }

    const requiredIds = spec.inputs.map(i => i.id);
    const missingIds = requiredIds.filter(id => inputs[id] === undefined);
    if (missingIds.length > 0) {
      // Try positional matching: assign provided values by input order
      const vals = Object.values(inputs);
      if (vals.length === requiredIds.length) {
        requiredIds.forEach((id, idx) => { inputs[id] = vals[idx]; });
      } else {
        log.push(`${k.label}: missing inputs (${missingIds.join(', ')}) — skipped.`);
        return;
      }
    }

    const result = spec.calculate(inputs);
    if (isNaN(result)) { log.push(`${k.label}: calculation returned invalid result — check input values.`); return; }
    values[k.id] = String(result);
    log.push(`✓ ${k.label}: calculated ${result} ${k.unit}`);
    count++;
  });

  return { values, log, count };
}

/* ─── Slug aliases: SolutionDetail slugs that map to a shared KPI framework ─── */
export const SLUG_ALIAS: Record<string, string> = {
  /** SolutionDetail uses "lean-agile-supply-chain"; the KPI framework lives under "lean-six-sigma" */
  'lean-agile-supply-chain': 'lean-six-sigma',
  /** SolutionDetail uses "risk-management-solution"; the KPI framework lives under "risk-management" */
  'risk-management-solution': 'risk-management',
};

/* ─── Scoring helpers ─── */
function scoreKpi(def: KpiDef, value: number): number {
  if (isNaN(value) || value < 0) return 0;
  if (def.higherIsBetter) {
    return Math.min(100, Math.round((value / def.targetValue) * 100));
  } else {
    if (value <= def.targetValue) return 100;
    if (value >= def.benchmarkValue) return 0;
    return Math.round(((def.benchmarkValue - value) / (def.benchmarkValue - def.targetValue)) * 100);
  }
}

/* ─── 6-tier expert scoring system ─── */
interface ScoreTier {
  label: string; labelAr: string;
  color: string; bg: string; border: string; leftBorderColor: string; badge: string;
}
export function scoreTier(score: number): ScoreTier {
  if (score >= 95) return { label: 'World Class',     labelAr: 'مستوى عالمي',      color: '#059669', bg: 'bg-emerald-50', border: 'border-emerald-200', leftBorderColor: '#059669', badge: '🏆' };
  if (score >= 80) return { label: 'Best-in-GCC',     labelAr: 'الأفضل خليجياً',   color: '#10b981', bg: 'bg-emerald-50', border: 'border-emerald-200', leftBorderColor: '#10b981', badge: '✅' };
  if (score >= 65) return { label: 'Competitive',     labelAr: 'تنافسي',            color: '#3b82f6', bg: 'bg-blue-50',    border: 'border-blue-200',    leftBorderColor: '#3b82f6', badge: '📈' };
  if (score >= 50) return { label: 'Developing',      labelAr: 'في التطوير',        color: '#f59e0b', bg: 'bg-amber-50',   border: 'border-amber-200',   leftBorderColor: '#f59e0b', badge: '⚡' };
  if (score >= 35) return { label: 'Needs Attention', labelAr: 'يحتاج معالجة',      color: '#f97316', bg: 'bg-orange-50',  border: 'border-orange-200',  leftBorderColor: '#f97316', badge: '⚠️' };
  return                   { label: 'Critical Gap',   labelAr: 'فجوة حرجة',         color: '#ef4444', bg: 'bg-red-50',     border: 'border-red-200',     leftBorderColor: '#ef4444', badge: '🔴' };
}

export function scoreColor(score: number): string {
  return scoreTier(score).color;
}

/** Pure helper — returns the clamped 0-100 score and strokeDasharray values
 *  used by MiniGauge so they can be unit-tested independently of the DOM. */
export function miniGaugeState(rawScore: number, hasValue: boolean) {
  const r = 30;
  const circumference = Math.PI * r;
  const safeScore = Math.max(0, Math.min(100, rawScore));
  const strokeDash = (safeScore / 100) * circumference;
  const color = hasValue ? scoreColor(safeScore) : '#e5e7eb';
  const angle = (safeScore / 100) * 180;
  const rad = (angle - 180) * (Math.PI / 180);
  return { safeScore, circumference, strokeDash, color, rad };
}

/** Pure helper — returns state values used by HealthGauge so they can be
 *  unit-tested independently of the DOM. */
export function buildBarChartData(
  scores: Array<{ kpi: KpiDef; score: number | null; value: number }>,
  isAr: boolean,
) {
  return scores.map(s => {
    const label = isAr ? s.kpi.labelAr : s.kpi.label;
    return {
      name: label,
      nameShort: label.substring(0, 18) + (label.length > 18 ? '…' : ''),
      yours: s.value || 0,
      target: s.kpi.targetValue,
      benchmark: s.kpi.benchmarkValue,
    };
  });
}

export function healthGaugeState(rawScore: number, hasAnyValue: boolean) {
  const r = 72;
  const circumference = Math.PI * r;
  const safeScore = Math.max(0, Math.min(100, rawScore));
  const strokeDash = hasAnyValue ? (safeScore / 100) * circumference : 0;
  const color = hasAnyValue ? scoreColor(safeScore) : '#e5e7eb';
  const angle = hasAnyValue ? (safeScore / 100) * 180 : 0;
  const rad = (angle - 180) * (Math.PI / 180);
  return { safeScore, circumference, strokeDash, color, rad };
}

function scoreBg(score: number): string {
  const t = scoreTier(score);
  return `${t.bg} ${t.border}`;
}

function healthLabel(score: number, isAr: boolean): string {
  const t = scoreTier(score);
  return isAr ? t.labelAr : t.label;
}

/* ─── GCC quartile position ─── */
function kpiQuartile(def: KpiDef, value: number): 1 | 2 | 3 | 4 {
  const { targetValue, benchmarkValue, higherIsBetter } = def;
  const mid = (targetValue + benchmarkValue) / 2;
  if (higherIsBetter) {
    if (value >= targetValue) return 1;
    if (value >= mid)         return 2;
    if (value >= benchmarkValue) return 3;
    return 4;
  } else {
    if (value <= targetValue) return 1;
    if (value <= mid)         return 2;
    if (value <= benchmarkValue) return 3;
    return 4;
  }
}

function quartileLabel(q: 1 | 2 | 3 | 4, isAr: boolean): string {
  if (isAr) return ['أعلى 25%', 'ربع أعلى', 'ربع أدنى', 'أدنى 25%'][q - 1];
  return ['Top 25%', 'Upper-Mid', 'Lower-Mid', 'Bottom 25%'][q - 1];
}

function quartileColor(q: 1 | 2 | 3 | 4): string {
  return ['#059669', '#3b82f6', '#f59e0b', '#ef4444'][q - 1];
}

/* ─── Gap annotation ─── */
function gapText(def: KpiDef, value: number, isAr: boolean): string | null {
  const { targetValue, benchmarkValue, higherIsBetter, unit } = def;
  const fmt = (n: number) => Number.isInteger(n) ? String(n) : n.toFixed(1);
  if (higherIsBetter) {
    const toTarget = targetValue - value;
    const toBenchmark = value - benchmarkValue;
    if (toTarget <= 0) return isAr ? `${fmt(Math.abs(toTarget))} ${unit} فوق الهدف ✓` : `${fmt(Math.abs(toTarget))} ${unit} above target ✓`;
    if (toBenchmark >= 0) return isAr ? `${fmt(toTarget)} ${unit} للهدف · ${fmt(toBenchmark)} ${unit} فوق المعيار` : `${fmt(toTarget)} ${unit} to target · ${fmt(toBenchmark)} ${unit} above benchmark`;
    return isAr ? `${fmt(toTarget)} ${unit} للهدف · ${fmt(Math.abs(toBenchmark))} ${unit} دون المعيار` : `${fmt(toTarget)} ${unit} to target · ${fmt(Math.abs(toBenchmark))} ${unit} below benchmark`;
  } else {
    const toTarget = value - targetValue;
    const toBenchmark = benchmarkValue - value;
    if (toTarget <= 0) return isAr ? `${fmt(Math.abs(toTarget))} ${unit} دون الهدف ✓` : `${fmt(Math.abs(toTarget))} ${unit} below target ✓`;
    if (toBenchmark >= 0) return isAr ? `${fmt(toTarget)} ${unit} فوق الهدف · ${fmt(toBenchmark)} ${unit} دون المعيار` : `${fmt(toTarget)} ${unit} above target · ${fmt(toBenchmark)} ${unit} below benchmark`;
    return isAr ? `${fmt(toTarget)} ${unit} فوق الهدف · ${fmt(Math.abs(toBenchmark))} ${unit} فوق المعيار` : `${fmt(toTarget)} ${unit} above target · ${fmt(Math.abs(toBenchmark))} ${unit} above benchmark`;
  }
}

/* ─── Expert per-KPI consulting insight (CIPS-practitioner knowledge) ─── */
function getKpiExpertInsight(kpiId: string, score: number, _value: number, _unit: string, isAr: boolean): string {
  // tier index 0=Critical(<35) … 5=WorldClass(≥95)
  const t = score >= 95 ? 5 : score >= 80 ? 4 : score >= 65 ? 3 : score >= 50 ? 2 : score >= 35 ? 1 : 0;

  if (isAr) {
    const mapAr: Record<string, string[]> = {
      por: [
        'خطر حرج على ولاء العملاء في السوق الخليجي. أجرِ تحليل باريتو عاجلاً على فئات الأخطاء — أخطاء التوثيق وانحرافات OTIF تمثّل عادةً 80% من الطلبات غير المثالية.',
        'كل نقطة تحسين في POR تسترد نحو 0.3% من الإيراد. حدّد سبب الإخفاق الرئيسي أولاً — هل هو OTIF أم دقة الانتقاء أم التلف؟',
        'دون المعدّل الخليجي. الجذر المشترك للمشكلة عادةً بين أداء الناقل ودقة نظام WMS. مبادرة كايزن لمدة 90 يوماً على الاثنين تحقق تحسناً 5–8 نقاط عادةً.',
        'قريب من المعيار. التسرّب المتبقّي عند هذا المستوى غالباً في دقة الفواتير وتوقيت إيصالات التسليم — راجعهما شهرياً.',
        'فوق المعيار الخليجي. اثبّت الأداء ببطاقات تقييم أسبوعية للناقلين وسير عمل تأكيد الطلبات الخالي من الأخطاء.',
        'خدمة عالمية المستوى. انتقل من تقليل العيوب إلى تحسين تكلفة الجودة — خفّض التكلفة الضرورية لتحقيق التميّز لا معدّل العيوب فحسب.',
      ],
      otif: [
        'خطر حاد على العلاقات مع العملاء. صنّف أسوأ 3 خطوط توريد ومورّدين هذا الأسبوع وضع خطة تصحيح عاجلة.',
        'حدّد ما إذا كانت المشكلة في النقل (التوقيت) أم في المورّد (الكميات). التدخّل في الحالتين يختلف جوهرياً.',
        'دون المعيار الخليجي 82%. المخزون الاحتياطي الديناميكي وتنويع خيارات الشحن يغلق نحو 60% من الفجوة.',
        'تنافسي. ركّز الحجم على الناقلين بأداء >94% في OTIF وأدِر المتدنّيين في مراجعة العقد القادمة.',
        'قوي. أدرِج بنود مكافأة/غرامة مرتبطة بـ OTIF في تجديد العقود القادمة لتثبيت الأداء.',
        'مستوى عالمي. فكّر في تحويل موثوقية التسليم إلى ميزة تفاضلية أو مستوى خدمة مميّز للعملاء الاستراتيجيين.',
      ],
      c2c: [
        'دورة النقد بهذا المستوى تُثقل الميزانية العمومية. الرافعة الفورية: تمديد شروط دفع الموردين إلى 60 يوماً وتشديد تحصيل الذمم المدينة لـ 30 يوماً.',
        'كل 10 أيام تخفيض في C2C تُحرّر 2–3% من الإيراد السنوي رأس مالاً عاملاً. ابدأ بأيام الذمم المدينة — أعلى أثر وأسرع عائد.',
        'فوق المعيار الخليجي 48 يوماً. مراجعة شروط الدفع مع الموردين مقرونةً بالخصم الديناميكي يغلق نصف الفجوة في دورة واحدة.',
        'رأس مال عامل تنافسي. الرافعة التالية هي المخزون — كل دورة إضافية تُقلّص C2C نحو 8 أيام في المتوسط.',
        'دورة نقد كفؤة. فكّر في برامج تمويل سلسلة الإمداد لتمديد الشروط دون الإضرار بعلاقات الموردين.',
        'إدارة رأس مال عامل عالمية المستوى. هذه ميزة تنافسية حقيقية — احمِها بقوة في كل مفاوضة تجارية.',
      ],
      savings: [
        'دون الحدّ الأدنى الخليجي — المشتريات تعمل بشكل رد فعلي. أسّس إدارة الفئات أولاً قبل وضع أي أهداف وفورات.',
        'طبّق خط أنابيب منظّم للمناقصات التنافسية. إعادة طرح مناقصة فئة واحدة فحسب تُحقق عادةً 6–12% وفورات على الإنفاق المُدار.',
        'نضج إدارة الفئات هو الرافعة الرئيسية. المؤسسات التي تُقسّم إنفاقها إلى 6 فئات أو أكثر تحقق باستمرار وفورات 8–12%.',
        'أداء وفورات قوي. انتقل إلى أجندة التكلفة الإجمالية للملكية — تحسين سعر الوحدة يتراجع عائده فوق 8%.',
        'أداء استثنائي. طوّر إطار تحقّق الوفورات لضمان وصولها إلى قائمة الأرباح والخسائر فعلياً لا إلى تقارير المشتريات فحسب.',
        'مستوى عالمي. انتقل من خفض التكلفة إلى خلق القيمة — خطط ابتكار مشترك وتحالفات استثمارية مع الموردين الاستراتيجيين.',
      ],
      pocycle: [
        'زمن دورة الشراء هذا يدلّ على سير عمل موافقات مكسور. حدّد كل خطوة موافقة — يمكن عادةً إلغاء أو أتمتة أكثر من 50% منها.',
        'بسّط مصفوفة الموافقات إلى مستويين كحدّ أقصى للطلبات الاعتيادية. هذا التغيير وحده يُقلّص زمن الدورة 40–50%.',
        'أدرِج كتالوجاً ذاتياً للأصناف منخفضة القيمة بهدف إصدار أمر الشراء خلال يوم واحد. هذا يُزيل المعاملات التشغيلية من قائمة الموافقات.',
        'تنافسي. الخطوة التالية هي المعالجة المباشرة — أتمتة إنشاء أوامر الشراء للأصناف المعتمدة مسبقاً تحت العقود.',
        'سرعة شراء قوية. طبّق المعالجة اللمسية الصفرية لأصناف الكتالوج لدفع المتوسط دون 5 أيام.',
        'سرعة دورة توريد-دفع عالمية المستوى. نادر جداً في السوق الخليجي — وثّق هذه العملية وقارنها مع الأقران.',
      ],
      fa: [
        'دقة التوقّع بهذا المستوى تُولّد في آنٍ واحد مخزوناً زائداً ونقصاً في الأصناف. طبّق إيقاع S&OP منظّم قبل أي تحسين آخر.',
        'توقّع متدحرج لـ 13 أسبوعاً يُراجَع أسبوعياً مع الفرق التجارية يرفع الدقة 15–20 نقطة في الربع الأول عادةً.',
        'التوقّع الإحصائي (Holt-Winters أو المتوسط المتحرك) للأصناف الفئة A يتفوّق على التحكيم اليدوي في هذا النطاق.',
        'دقة صلبة. قسّم محفظة المنتجات حسب ربع الخطأ التوقّعي وطبّق سياسات مخزون أمان متمايزة.',
        'أداء توقّع قوي. أضف استشعار الطلب — بيانات نقاط البيع أو إشارات الطلب من العملاء — لاستهداف ما فوق 90%.',
        'توقّع عالمي المستوى. احسب وأبلّغ المدير المالي عن الفائدة في رأس المال العامل — هذا يكسب استثماراً مستداماً.',
      ],
      turns: [
        'دوران منخفض كهذا يدلّ على مخزون راكد كبير. أجرِ تحليل ABC-XYZ وتصرّف في أصناف الفئة Z فوراً لتحرير السيولة.',
        'طبّق مراجعة شهرية للمخزون بطيء الحركة والمتقادم. حتى تحسين دورة واحدة يُحرّر رأس مال عامل ذا قيمة.',
        'التجديد المدفوع بالطلب (الحدّ الأدنى/الأقصى أو كانبان) للأصناف A عادةً يُضيف 1.5–2 دورة خلال ربع سنة.',
        'تنافسي. دقّق حسابات المخزون الاحتياطي باستخدام أهداف مستوى خدمة إحصائية بدلاً من قواعد الأيام الثابتة.',
        'أداء مخزوني قوي. أدرِج مخزوناً مُداراً من قِبَل المورّد (VMI) مع كبار الموردين لدفع الدورات دون المخاطرة بمستوى الخدمة.',
        'إدارة مخزون عالمية المستوى. كفاءتك في رأس المال العامل استثنائية — اثبّتها عبر S&OP أسبوعي ونقاط إعادة طلب ديناميكية.',
      ],
      sigma: [
        'عند 2σ أو دون، تستهلك العيوب 15–40% من الإيراد كتكلفة جودة رديئة. مشروع DMAIC واحد مُركَّز على عمليتك الأعلى حجماً يحقق تحسين σ واحد عادةً.',
        'بين 2–3σ. تحليل منظّم للأسباب الجذرية (مخطط إيشيكاوا + 5 لماذا) على أبرز 3 أنواع عيوب يُعزل الأسباب الحيوية القليلة.',
        'نحو 3σ. مخططات ضبط العمليات الإحصائي تكتشف الانجراف قبل وقوع العيوب — طبّقها على المعاملات الحرجة أولاً.',
        'عند 3σ+، أنت تنافسي. تصميم التجارب على متغيرات العمليات الرئيسية هو الطريق الأكفأ للوصول إلى 4σ.',
        'أداء سيجما قوي. ركّز على التصميم من أجل الجودة لمنع أنماط عيوب جديدة مع تطور محفظة المنتجات.',
        'جودة عالمية المستوى. عند 4σ+، ينتقل التركيز إلى التحقّق من الأخطاء (Poka-Yoke) للمحافظة على هذا المستوى مع التوسع.',
      ],
      pce: [
        'أقل من 8% وقت مضيف للقيمة يعني أن 92% من وقت العملية هدر خالص. ورشة رسم تدفق القيمة تكشف أنواع الهدر الرئيسية فوراً.',
        'ركّز على وقت الانتظار والنقل — يمثّلان أكثر من 60% من الوقت غير المضيف للقيمة في معظم سلاسل الإمداد. مكاسب سريعة عبر جدولة السحب.',
        'حدث كايزن مُركَّز على أطول خطوة انتظار يضاعف PCE عادةً خلال 90 يوماً.',
        'تنافسي. رقمنة نقاط الإحالة وإزالة الموافقات الورقية هي أسرع رافعة متبقية في هذا النطاق.',
        'كفاءة عملية قوية. الآن فكّر في هندسة القيمة للتخلص من الخطوات الضرورية لكنها غير مضيفة للقيمة.',
        'تصميم عملية عالمي المستوى. مهلة توريدك ميزة تنافسية حقيقية — قيّمها وأبلّغ بها القيادة.',
      ],
      mav: [
        'إنفاق متمرّد فوق 15% هو أزمة امتثال. طبّق سياسة أمر شراء إلزامية بضوابط النظام لا بالوثائق فقط.',
        'استهدف أعلى 5 فئات إنفاق غير متوافقة — تمثّل عادةً أكثر من 70% من الإنفاق المتمرّد الكلي.',
        'كتالوج موردين معتمد يغطي 80% من الإنفاق التعاملي يُقضي على معظم المشتريات المتمرّدة. ابنِ الكتالوج أولاً.',
        'دون 10% إنفاق متمرّد تنافسي. أتمتِ الإبلاغ عن أوامر الشراء خارج العقد للمحافظة على الانضباط.',
        'وضع امتثال قوي. أتمتِ توجيه الموافقات بحيث يكون الشراء تحت العقد دائماً مسار المقاومة الأدنى.',
        'مستوى عالمي — يُحقَّق عادةً فقط بنظام P2P ناضج وإدارة فئات راسخة. احمِه بعناية.',
      ],
      rrc: [
        'بدون سجل مخاطر شامل، نقاط الفشل الفردية الحرجة غير مرئية. ابدأ بأكبر 20 مورّداً لديك.',
        'صنّف المخاطر حسب الاحتمالية × الأثر. أعلى 10 مخاطر يجب أن يكون لكل منها مالك مُعيَّن وإجراء تخفيف خلال 30 يوماً.',
        'انتقل من تحديد المخاطر إلى تكميمها. خصّص التعرّض المالي لكل مخاطرة — هذا يُحوّل محادثات القيادة.',
        'تغطية مخاطر جيدة. دمِج السجل مع بطاقات تقييم الموردين لتحديث مستويات المخاطر ديناميكياً لا في المراجعات السنوية فحسب.',
        'نضج عالٍ في إدارة المخاطر. اختبر فاعلية التخفيف بتمارين محاكاة على الطاولة للتحقّق من صمودها في الواقع.',
        'حوكمة مخاطر عالمية المستوى. مرونة سلسلة إمداديك ميزة تنافسية ملموسة في السوق الخليجي.',
      ],
      crm: [
        'معدّل تخفيف المخاطر الحرجة دون 35% يعني أن معظم المخاطر عالية الخطورة لا تملك ضوابط نشطة. عيّن فوراً مالكاً مُسمّىً لكل مخاطرة حرجة وأوجِب إجراء تخفيف خلال أسبوعين.',
        'أكثر من نصف المخاطر الحرجة لديك غير مُخفَّفة. صنّفها حسب التعرّض المالي — حتى ضوابط أساسية (التوريد المزدوج، المخزون الاحتياطي، بنود العقد) على أعلى 5 مخاطر تُغلق الفجوات الأخطر بسرعة.',
        'دون المعيار الخليجي 48%. أجرِ فحص صحة ربع سنوي للتخفيف: لكل مخاطرة حرجة، تحقّق من أن الضابط يعمل فعلياً لا أنه موثَّق فحسب. الضوابط الورقية تفشل بصمت.',
        'وضع تخفيف تنافسي. ارتقِ بالجودة بتحويل الضوابط التفاعلية إلى مؤشرات إنذار مبكر — اربط كل تخفيف بمقياس تشغيلي يُنبّه قبل تحقّق المخاطرة.',
        'تغطية تخفيف قوية. أجرِ اختباراً سنوياً لفاعلية الضوابط: محاكاة أعلى 3 سيناريوهات مخاطر والتحقّق من أن كل تخفيف يُقيّد الأثر ضمن الحدود المقبولة.',
        'إدارة مخاطر حرجة عالمية المستوى. أأسِّس النهج مؤسسياً — وثّق مكتبة ضوابط المخاطر كإطار قابل لإعادة الاستخدام وامتدّ إلى موردي المستوى الثاني حيث تكون مخاطر التركّز أعلى.',
      ],
      srs: [
        'متوسط درجة مخاطر الموردين دون 35 يُشير إلى تعرّض منهجي عبر قاعدة التوريد. صنّف الموردين في شرائح مخاطر فوراً وافرِض دورات مراجعة ربع سنوية على الربع الأسفل.',
        'دون مستوى الصحة المتوسط للموردين في الخليج. أدرِج تقييماً منظّماً لمخاطر الموردين يشمل الاستقرار المالي والتعرّض الجيوسياسي والاعتماد على مصدر وحيد وبُعد ESG — قيّم كل مورّد سنوياً على الأقل.',
        'قريب من المعيار. أكبر رافعة في هذا النطاق هي جودة البيانات: درجات المخاطر المبنية على معلومات متقادمة أو معلَنة ذاتياً مُضلِّلة. تحقّق ببيانات مالية من طرف ثالث للموردين الاستراتيجيين.',
        'وضع مخاطر موردين تنافسي. ميّز استجابتك حسب الشريحة — خصّص الإدارة المكثّفة للموردين الاستراتيجيين والحرجين؛ استخدم المراقبة الآلية (تنبيهات ائتمان، تغذية إخبارية) للقاعدة الأوسع.',
        'صحة مخاطر موردين قوية. شارك الدرجات مباشرةً مع الموردين الرئيسيين في مراجعات الأعمال الربع سنوية — الشفافية تُسرّع تحسينهم وتُشير إلى أنك تأخذ أمان التوريد بجدية.',
        'إدارة مخاطر موردين عالمية المستوى. استخدم نموذج التقييم دليلاً لاستثمار تطوير الموردين: استهدف الاستثمار المشترك في تقليل المخاطر حيث يكون تركّز إنفاقك الأعلى.',
      ],
      rrc2: [
        'امتثال مراجعة المخاطر دون 35% يعني أن سجل المخاطر مجرّد ديكور — المخاطر لا تُعاد تقييمها مع تغيّر الظروف. طبّق المراجعات عبر حوكمة مقيَّدة بالتقويم لا بالمبادرة العشوائية.',
        'معظم مراجعات المخاطر المجدولة لا تُنجَز. السبب الجذري غالباً غموض الملكية: عيّن مالك مخاطر واحد مُسمّىً لكل فئة واجعل اكتمال المراجعة مؤشر أداء لمدير المباشر.',
        'دون المعيار الخليجي 52%. قلّل الاحتكاك — مراجعة منظّمة لمدة 30 دقيقة بقالب معياري أكثر احتمالاً للحدوث من غوص عميق غير منظّم. الحجم أهم من العمق في هذه المرحلة.',
        'إيقاع مراجعة تنافسي. ارتقِ بالجودة بإلزام كل مراجعة بإنتاج تحديث واحد على الأقل لتقييم مخاطرة أو إجراء تخفيف مفتوح/مُغلَق. المراجعات التي لا تُنتج مخرجات مجرّد شكليات حوكمة.',
        'امتثال مراجعة قوي. أدرِج لوحة اتجاه مخاطر تُظهر كيف تحرّكت تقييمات المخاطر الفردية خلال الأربعة أرباع الماضية — هذا يُجلّي قيمة المراجعات للقيادة.',
        'حوكمة مراجعة مخاطر عالمية المستوى. سجل المخاطر لديك أداة إدارة حية لا وثيقة ثابتة. امتدّ بالإيقاع إلى مخاطر موردي المستوى الثاني وتأكّد من تغذية النتائج مباشرةً في تحديثات استراتيجية الفئات.',
      ],
      pocomp: [
        'امتثال أوامر الشراء دون 60% يعني تجاوز العقود — تُفقد القوة التفاوضية ويرتفع خطر التدقيق. طبّق الامتثال على مستوى النظام.',
        'حدّد أعلى 5 موظفين مشتريات يُصدرون أوامر شراء خارج العقود. التدريب والتوجيه المُستهدَف لهذه المجموعة يُغلق 60% من الفجوة.',
        'دون المعيار الخليجي 72%. سير عمل يضع العقد أولاً — النظام يمنع أوامر الشراء خارج العقد بلا مبرّر — هو الإصلاح الأسرع.',
        'امتثال تنافسي. التقارير الشهرية للامتثال التي تُشاركها مع مديري الفئات تُنشئ مساءلة تُديم الاتجاه.',
        'امتثال قوي. دقّق عيّنة عشوائية 5% شهرياً لاكتشاف الفجوات الناشئة قبل أن تتفاقم.',
        'مستوى عالمي. الامتثال عند هذا المستوى يحقّق أقصى قيمة للعقود وأدنى مخاطر للتدقيق.',
      ],
      sotif: [
        'تسليم الموردين عند هذا المستوى يمثّل خطراً مباشراً على الإيراد. أصدِر إشعار تحسين أداء رسمياً للموردين في الربع الأسفل.',
        'صنّف الموردين حسب شريحة OTIF. الربع الأسفل يتسبّب عادةً في 80% من إخفاقات التسليم — إدارته المكثّفة تحقق تحسناً غير متناسب.',
        'دون المعيار الخليجي 80%. مراجعات أداء التسليم المشتركة مع الموردين الرئيسيين شهرياً بدلاً من ربع سنوي ترفع OTIF 8–12 نقطة باستمرار.',
        'تسليم موردين تنافسي. أدرِج أداء التسليم معياراً موزوناً في تقييم المناقصات القادمة.',
        'قوي. فكّر في برنامج مخزون مُدار من قِبَل المورّد (VMI) مع أفضل 5 موردين بأداء OTIF — يُعمّق العلاقة ويُحسّن الخدمة أكثر.',
        'مستوى عالمي في تسليم الموردين. هذه ميزة تنافسية حقيقية — ادمجها في مقترح قيمة إدارة علاقات الموردين.',
      ],
    };
    const insightAr = mapAr[kpiId];
    if (insightAr) return insightAr[t] ?? insightAr[0];
    // Generic Arabic fallback by tier
    const genericAr = [
      'فجوة حرجة — حدّد خطة إجراءات تصحيحية بأفق 30 يوماً ومالك واحد مُعيَّن.',
      'فجوة كبيرة عن المعيار. شخّص السبب الجذري قبل الالتزام بحل — الإصلاحات المبنية على الأعراض نادراً ما تصمد.',
      'دون المعيار الخليجي. مبادرة تحسين منظّمة بمعالم محدّدة ستُغلق الفجوة في ربعين إلى ثلاثة أرباع.',
      'أداء تنافسي. دقّق عبر انضباط العمليات وإيقاعات القياس للوصول إلى المستوى الأفضل خليجياً.',
      'فوق المعيار الخليجي. اثبّت عبر الحوكمة — بيانات المعيار تتغيّر كل 18 شهراً، فاستمر في القياس.',
      'أداء عالمي المستوى. وثّق منهجيتك كعملية قابلة للتكرار وانقل هذه الكفاءة إلى مجالات مجاورة.',
    ];
    return genericAr[t];
  }

  const map: Record<string, string[]> = {
    por: [
      'Customer attrition risk is acute. Run an emergency Pareto on failure modes — documentation errors and OTIF shortfalls typically account for 80% of imperfect orders.',
      'Each 1pp improvement in POR recovers ~0.3% of revenue. Isolate the dominant failure mode (OTIF vs pick accuracy vs damage) before spreading effort.',
      'Below the GCC median. Root cause is typically split between carrier OTIF and WMS pick accuracy. A 90-day focused kaizen on both routinely yields 5–8pp uplift.',
      'Approaching benchmark. Residual leakage at this level is almost always documentation — audit invoice accuracy and PoD timeliness monthly.',
      'Above GCC benchmark. Sustain via weekly carrier scorecards and a zero-defect order confirmation workflow.',
      'World-class fulfilment. Focus shifts to cost-of-quality — reduce the overhead of achieving perfection, not just the defect rate.',
    ],
    otif: [
      'Critical delivery risk — customer trust erosion is accelerating. Triage your top 3 failing routes and suppliers this week.',
      'Identify whether the gap is transport (timing) or supplier (quantity). The intervention differs fundamentally between the two.',
      'Below the 82% GCC median. Dynamic safety stock and multi-modal routing optionality typically close 60% of the gap.',
      'Competitive. Carriers with consistent >94% OTIF should receive volume concentration; underperformers managed out at next review.',
      'Strong OTIF. Lock in performance with SLA penalty/reward clauses at the next contract renewal.',
      'World-class delivery performance. Consider monetising reliability as a premium service tier for key customers.',
    ],
    c2c: [
      'Cash cycle this poor is a balance-sheet drag. Immediate lever: extend supplier payment terms to 60 days and tighten AR collection to net-30.',
      'Every 10-day reduction in C2C releases ~2–3% of annual revenue as working capital. Prioritise debtor days — highest impact, fastest return.',
      'Above the 48-day GCC benchmark. A supplier payment terms review (targeting net-60) combined with dynamic discounting can close half the gap in one cycle.',
      'Competitive working capital. Next lever is inventory — each turn improvement reduces C2C by ~8 days on average.',
      'Efficient cash cycle. Consider supply chain financing programmes to extend terms without damaging supplier relationships.',
      'World-class working capital management. This is a competitive moat — protect it aggressively in commercial negotiations.',
    ],
    savings: [
      'Below the GCC floor — procurement is likely operating reactively. Establish Category Management before attempting savings targets.',
      'Implement a structured pipeline of competitive tenders. Even a single category re-bid typically yields 6–12% on addressable spend.',
      'Category management maturity is the key lever. Organisations that segment spend into 6+ categories consistently achieve 8–12% savings.',
      'Strong savings delivery. Move the agenda to total cost of ownership — unit price optimisation has diminishing returns above 8%.',
      'Exceptional performance. Build a savings validation framework to ensure realised savings hit the P&L, not just the procurement report.',
      'World-class. Focus on value creation beyond cost — innovation pipelines and co-investment with strategic suppliers.',
    ],
    pocycle: [
      'PO cycle times this long signal a broken approval workflow. Map every approval step — over 50% can typically be eliminated or automated.',
      'Streamline the approval matrix to 2 levels maximum for routine requisitions. This single change reduces cycle time by 40–50%.',
      'Introduce a self-service catalogue for C-class items targeting same-day PO. This removes low-value transactions from the approval queue.',
      'Competitive. Next step is straight-through processing — automate PO creation for pre-approved items under contract.',
      'Strong PO speed. Implement touchless processing for catalogue items to push the mean below 5 days.',
      'World-class procure-to-pay speed. This is genuinely rare in the GCC — document and benchmark the process.',
    ],
    fa: [
      'Forecast accuracy this low generates excess inventory and stockouts simultaneously. Implement a structured S&OP rhythm before any other improvement.',
      'A 13-week rolling forecast reviewed weekly with commercial teams typically lifts accuracy by 15–20pp in the first quarter.',
      'Statistical forecasting (Holt-Winters or moving average) for A-class items outperforms manual judgment at this range.',
      'Solid accuracy. Segment your SKU portfolio by forecast error quartile and apply differentiated safety-stock policies.',
      'Strong forecast performance. Layer in demand sensing — POS data or customer order signals — to target above 90%.',
      'World-class forecasting. Quantify and communicate the working capital benefit to the CFO — this earns sustained investment.',
    ],
    turns: [
      'Turns this low indicate significant dead stock. Run an ABC-XYZ analysis and liquidate Z-class items immediately to free cash.',
      'Implement a Slow-Moving and Obsolete stock review monthly. Even 1 turn improvement releases significant working capital.',
      'Demand-driven replenishment (min-max or kanban) for A-class items typically adds 1.5–2 turns within a quarter.',
      'Competitive. Fine-tune safety stock calculations using statistical service-level targets rather than fixed days-of-supply rules.',
      'Strong inventory performance. Introduce vendor-managed inventory (VMI) with top suppliers to push turns without service risk.',
      'World-class inventory management. Your working capital efficiency is exceptional — sustain via weekly S&OP and dynamic reorder points.',
    ],
    sigma: [
      'At 2σ or below, defects are consuming 15–40% of revenue in COPQ. A single focused DMAIC project on your highest-volume process will typically yield 1σ improvement.',
      'Between 2–3σ. Structured root-cause analysis (Ishikawa + 5-Why) on your top-3 defect types will isolate the vital few causes.',
      'Approaching 3σ. Statistical Process Control charts identify drift before defects occur — implement on critical parameters first.',
      'At 3σ+, you are competitive. Design of Experiments on key process variables is the most efficient path to 4σ.',
      'Strong sigma performance. Focus on design-for-quality to prevent new defect modes as your portfolio evolves.',
      'World-class quality. At 4σ+, focus shifts to poka-yoke error-proofing to maintain this level as you scale.',
    ],
    pce: [
      'Less than 8% value-added time means over 92% of your process is waste. A Value Stream Mapping workshop will expose dominant waste types immediately.',
      'Focus on wait time and transport waste — they account for 60%+ of non-value time in most supply chains. Quick wins via pull scheduling.',
      'A focused Kaizen event on your longest wait step typically doubles PCE within 90 days.',
      'Competitive. Digitising handoff points (removing paper-based approvals) is the fastest remaining lever at this PCE range.',
      'Strong process efficiency. Now consider value engineering to eliminate necessary-but-non-value-added steps.',
      'World-class process design. Your lead time is a genuine competitive advantage — quantify and communicate it.',
    ],
    mav: [
      'Maverick spend above 15% is a compliance crisis. Enforce a PO-mandatory policy with system controls, not just policy documents.',
      'Target the top 5 non-compliant spend categories — they typically represent 70%+ of total maverick spend.',
      'An approved supplier catalogue covering 80% of transactional spend eliminates most maverick purchasing. Build the catalogue first.',
      'Below 10% maverick spend is competitive. Automate flagging of off-contract POs to sustain the discipline.',
      'Strong compliance posture. Automate approval routing so on-contract purchasing is always the path of least resistance.',
      'World-class — typically only achieved with a mature P2P system and embedded category management. Protect it.',
    ],
    rrc: [
      'Without a comprehensive risk register, critical single-points-of-failure are invisible. Start with your top 20 suppliers.',
      'Prioritise risks by probability × impact. The top 10 by score should each have a named owner and mitigation action within 30 days.',
      'Move from risk identification to quantification. Assign financial exposure to each risk — this transforms leadership conversations.',
      'Good risk coverage. Integrate the register with supplier scorecards so risk levels update dynamically, not just at annual reviews.',
      'Strong risk maturity. Stress-test mitigations with tabletop exercises to validate their real-world effectiveness.',
      'World-class risk governance. Your supply chain resilience is a demonstrable competitive advantage in the GCC market.',
    ],
    crm: [
      'Critical risk mitigation rate below 35% means most high-severity risks have no active controls. Immediately assign a named owner to every critical risk and mandate a mitigation action within two weeks.',
      'Over half of your critical risks are unmitigated. Triage by financial exposure — even basic controls (dual sourcing, safety stock, contract clauses) on the top-5 risks close the most dangerous gaps quickly.',
      'Below the 48% GCC benchmark. Run a quarterly mitigation health-check: for each critical risk, verify the control is operational, not just documented. Paper controls fail silently.',
      'Competitive mitigation posture. Elevate quality by converting reactive controls into proactive early-warning indicators — link each mitigation to a trigger metric that fires before the risk materialises.',
      'Strong mitigation coverage. Conduct an annual control-effectiveness test: simulate the top-3 risk scenarios and confirm each mitigation actually limits impact to acceptable levels.',
      'World-class critical risk management. Institutionalise the approach — document your risk-control library as a reusable framework and extend it to Tier-2 suppliers where concentration risk is highest.',
    ],
    srs: [
      'Average supplier risk score below 35 signals systemic exposure across the supply base. Segment suppliers into risk tiers immediately and impose quarterly review cadences on the bottom quartile.',
      'Below the GCC median supplier health level. Introduce a structured supplier risk assessment covering financial stability, geopolitical exposure, single-source dependency, and ESG — score each annually at minimum.',
      'Approaching benchmark. The biggest lever at this range is data quality: risk scores built on stale or self-reported information are misleading. Validate with third-party financial data for strategic suppliers.',
      'Competitive supplier risk posture. Differentiate your response by tier — reserve intensive management for strategic and critical suppliers; use automated monitoring (credit alerts, news feeds) for the broader base.',
      'Strong supplier risk health. Share risk scores directly with key suppliers at quarterly business reviews — transparency accelerates their own improvement and signals that you take supply security seriously.',
      'World-class supplier risk management. Use your scoring model as a supplier development investment guide: target co-investment in risk reduction where your spend concentration is highest.',
    ],
    rrc2: [
      'Risk review compliance below 35% means your risk register is decorative — risks are not being reassessed as conditions change. Enforce reviews via calendar-locked governance, not ad-hoc initiative.',
      'Most scheduled risk reviews are being skipped. Root cause is typically ownership ambiguity: assign a single named risk owner per category and make review completion a line-manager KPI.',
      'Below the 52% GCC benchmark. Reduce friction — a 30-minute structured review using a standardised template is far more likely to happen than an unstructured deep-dive. Volume of reviews matters at this stage.',
      'Competitive review cadence. Upgrade quality by requiring each review to produce at least one updated risk rating or one new/closed mitigation action. Reviews with no output are a governance formality, not a risk-management activity.',
      'Strong review compliance. Introduce a risk-trend dashboard that visualises how individual risk ratings have moved over the past four quarters — this makes the value of reviews visible to leadership.',
      'World-class risk review governance. Your risk register is a living management tool, not a static document. Extend the cadence to Tier-2 supplier risks and ensure findings feed directly into category strategy updates.',
    ],
    pocomp: [
      'PO compliance below 60% means contracts are being bypassed — negotiate leverage is lost and audit risk is high. Enforce at system level.',
      'Identify the top 5 buyers generating off-contract POs. Training and targeted coaching on this cohort closes 60% of the gap.',
      'Below 72% GCC benchmark. A contract-first approval workflow (system blocks non-contract POs unless justified) is the fastest fix.',
      'Competitive compliance. Monthly compliance reports shared with category managers creates accountability that sustains the trend.',
      'Strong compliance. Audit a random 5% sample monthly to catch emerging gaps before they compound.',
      'World-class. Compliance at this level delivers maximum contract value and minimum audit risk.',
    ],
    sotif: [
      'Supplier delivery at this level is a direct revenue risk. Issue a formal performance improvement notice to your bottom-quartile suppliers.',
      'Segment suppliers by OTIF band. The bottom quartile typically drives 80% of delivery failures — intensive management here creates disproportionate improvement.',
      'Below 80% GCC benchmark. Joint delivery performance reviews with key suppliers, held monthly rather than quarterly, consistently lift OTIF by 8–12pp.',
      'Competitive supplier delivery. Introduce delivery performance as a weighted criterion in the next tender evaluation.',
      'Strong. Consider a vendor-managed inventory programme with your top-5 OTIF performers — it deepens the relationship and further improves service.',
      'World-class supplier delivery. This is a genuine competitive advantage — build it into your SRM value proposition.',
    ],
  };
  const insight = map[kpiId];
  if (insight) return insight[t] ?? insight[0];
  // Generic fallback by tier
  const generic = [
    'Critical gap — define a corrective action plan with a 30-day horizon and a single named owner.',
    'Significant gap to benchmark. Diagnose root cause before committing to a solution — symptom-driven fixes rarely hold.',
    'Below GCC benchmark. A structured improvement initiative with defined milestones will close the gap in 2–3 quarters.',
    'Competitive performance. Fine-tune through process discipline and measurement cadence to reach best-in-GCC tier.',
    'Above GCC benchmark. Sustain through governance — benchmark data shifts every 18 months, so keep measuring.',
    'World-class performance. Document your approach as a repeatable process and export the capability to adjacent areas.',
  ];
  return generic[t];
}

const NAVY = '#082C6B';
const GOLD = '#C9A84C';

/* ─── Gauge using SVG arc ─── */
function HealthGauge({ score, hasAnyValue }: { score: number; hasAnyValue: boolean }) {
  const cx = 90, cy = 90;
  const { circumference, strokeDash, color, rad } = healthGaugeState(score, hasAnyValue);
  const needleColor = hasAnyValue ? NAVY : '#d1d5db';
  return (
    <svg width={180} height={110} viewBox="0 0 180 110" className="overflow-visible">
      {/* Track */}
      <path d={`M ${cx - 72} ${cy} A 72 72 0 0 1 ${cx + 72} ${cy}`} fill="none" stroke="#e5e7eb" strokeWidth={18} strokeLinecap="round" />
      {/* Fill — hidden when no values entered */}
      <path d={`M ${cx - 72} ${cy} A 72 72 0 0 1 ${cx + 72} ${cy}`} fill="none" stroke={color} strokeWidth={18} strokeLinecap="round"
        strokeDasharray={`${strokeDash} ${circumference}`} />
      {/* Score text — '–' when no values entered */}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize={28} fontWeight="800" fill={hasAnyValue ? NAVY : '#9ca3af'}>
        {hasAnyValue ? score : '–'}
      </text>
      <text x={cx} y={cy + 16} textAnchor="middle" fontSize={11} fill="#6b7280">/100</text>
      {/* Needle */}
      <line x1={cx} y1={cy} x2={cx + (72 - 8) * Math.cos(rad)} y2={cy + (72 - 8) * Math.sin(rad)}
        stroke={needleColor} strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={5} fill={needleColor} />
    </svg>
  );
}

/* ─── Mini per-KPI gauge (embedded in each KPI card) ─── */
function MiniGauge({ score, hasValue }: { score: number; hasValue: boolean }) {
  const r = 30, cx = 40, cy = 36;
  const circumference = Math.PI * r;
  const safeScore = Math.max(0, Math.min(100, score));
  const strokeDash = (safeScore / 100) * circumference;
  const angle = (safeScore / 100) * 180;
  const rad = (angle - 180) * (Math.PI / 180);
  const color = hasValue ? scoreColor(safeScore) : '#e5e7eb';
  return (
    <svg width={80} height={46} viewBox="0 0 80 46" className="overflow-visible" aria-hidden="true">
      {/* Track */}
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="#e5e7eb" strokeWidth={8} strokeLinecap="round" />
      {/* Fill */}
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke={color} strokeWidth={8} strokeLinecap="round"
        strokeDasharray={`${strokeDash} ${circumference}`} />
      {/* Score label */}
      <text x={cx} y={cy - 3} textAnchor="middle" fontSize={13} fontWeight="800"
        fill={hasValue ? NAVY : '#9ca3af'}>{hasValue ? safeScore : '–'}</text>
      <text x={cx} y={cy + 9} textAnchor="middle" fontSize={8} fill="#9ca3af">/100</text>
      {/* Needle */}
      <line x1={cx} y1={cy}
        x2={cx + (r - 5) * Math.cos(rad)} y2={cy + (r - 5) * Math.sin(rad)}
        stroke={hasValue ? NAVY : '#d1d5db'} strokeWidth={1.5} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={3} fill={hasValue ? NAVY : '#d1d5db'} />
    </svg>
  );
}

/* ─── Performance Intelligence Panel ─── */
interface PIScore { kpi: KpiDef; score: number; value: number; }
function PerformanceIntelligence({ scores, isAr, kpisTotal }: {
  scores: PIScore[]; isAr: boolean; kpisTotal: number;
}) {
  const entered = scores.filter(s => s.score !== null) as PIScore[];
  if (entered.length < 3) return null;

  const sorted = [...entered].sort((a, b) => b.score - a.score);
  const strengths = sorted.slice(0, 3);
  const gaps      = sorted.slice(-Math.min(3, sorted.length)).reverse()
                          .filter(g => g.score < 80); // only show genuine gaps
  const avgScore  = Math.round(entered.reduce((s, e) => s + e.score, 0) / entered.length);

  const verdict = avgScore >= 80
    ? (isAr
        ? 'أداء سلسلة الإمداد لديك فوق المعدّل الخليجي — الخطوة التالية هي تعزيز الفجوات المتبقية للانتقال من مشغّل موثوق إلى رائد في السوق.'
        : 'Your supply chain performance is above the GCC average. The next phase is converting your remaining gaps into structural advantages. Concentrate effort on your bottom-quartile KPIs — they represent the highest ROI improvement opportunity and the most direct path to market leadership.')
    : avgScore >= 65
    ? (isAr
        ? 'أداء تنافسي مع فجوات قابلة للمعالجة. التركيز المنضبط على المؤشرات الحرجة مع مالكين واضحين يُحوّل الوضع خلال ربعين.'
        : 'Competitive performance with addressable gaps. Disciplined focus on your critical KPIs — with structured root-cause analysis and a single named owner per gap — will shift your GCC ranking significantly within two quarters. Avoid the common trap of launching too many initiatives simultaneously.')
    : avgScore >= 50
    ? (isAr
        ? 'الأداء دون المعيار الخليجي في عدة مجالات. الأولوية هي إصلاح الأساس — البيانات والحوكمة وملكية العمليات — قبل الطموح بالتميّز.'
        : 'Performance is below the GCC benchmark across multiple areas. The priority is fixing foundations — data quality, governance structures, and clear process ownership — before pursuing best-in-class ambitions. A 90-day stabilisation plan with three focused initiatives is the right starting point; attempting everything in parallel is the most common failure mode.')
    : (isAr
        ? 'فجوات أداء حرجة تستدعي تدخّلاً فورياً. ابدأ بأعلى مؤشرَين تأثيراً وعيّن مالكاً واحداً لكل مسار تحسين.'
        : 'Critical performance gaps require immediate executive intervention. Start with the two highest-impact KPIs, assign single accountable owners, and establish a 30-day crisis review cadence. Attempting to fix everything simultaneously is guaranteed to fail — sequenced, focused effort is what produces results at this stage.');

  return (
    <div className="rounded-2xl border border-[#082C6B]/12 overflow-hidden shadow-sm">
      {/* Panel header */}
      <div className="px-5 py-3.5 flex items-center gap-3" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #0B3D91 100%)` }}>
        <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
          <span className="text-sm">🎯</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm leading-tight">
            {isAr ? 'ذكاء الأداء — تحليل ISC' : 'Performance Intelligence — ISC Diagnostic'}
          </p>
          <p className="text-white/60 text-[10px] mt-0.5">
            {isAr
              ? `بناءً على ${entered.length} من ${kpisTotal} مؤشراً مُدخَلاً`
              : `${entered.length} of ${kpisTotal} KPIs entered · Ma'in Alhaqash MCIPS CPSM`}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-white/50 text-[10px] uppercase tracking-wider">{isAr ? 'متوسط الأداء' : 'Avg Score'}</p>
          <p className="font-extrabold text-xl leading-tight" style={{ color: scoreColor(avgScore) }}>{avgScore}</p>
        </div>
      </div>

      <div className="bg-white p-5">
        <div className="grid md:grid-cols-2 gap-5 mb-5">
          {/* Strengths */}
          <div>
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-emerald-100 inline-flex items-center justify-center">✅</span>
              {isAr ? 'المزايا التنافسية' : 'Competitive Strengths'}
            </p>
            <div className="space-y-2">
              {strengths.map(({ kpi, score }) => {
                const t = scoreTier(score);
                const q = kpiQuartile(kpi, score); // approximate quartile from score
                return (
                  <div key={kpi.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-xs"
                      style={{ background: t.color + '15', color: t.color }}>
                      {score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 leading-snug truncate">{isAr ? kpi.labelAr : kpi.label}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ background: t.color + '15', color: t.color }}>{isAr ? t.labelAr : t.label}</span>
                        <span className="text-[10px] text-muted-foreground">{kpi.unit}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-bold" style={{ color: t.color }}>{t.badge}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Priority Gaps */}
          <div>
            <p className="text-[10px] font-bold text-red-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-red-100 inline-flex items-center justify-center text-red-600">⚠</span>
              {isAr ? 'أولويات التحسين' : 'Priority Improvement Areas'}
            </p>
            <div className="space-y-2">
              {(gaps.length ? gaps : sorted.slice(-3).reverse()).map(({ kpi, score, value }) => {
                const t = scoreTier(score);
                const insight = getKpiExpertInsight(kpi.id, score, value, kpi.unit, isAr);
                return (
                  <div key={kpi.id} className="p-2.5 rounded-xl border" style={{ borderColor: t.color + '30', background: t.color + '06' }}>
                    <div className="flex items-center gap-3 mb-1.5">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-xs"
                        style={{ background: t.color + '15', color: t.color }}>
                        {score}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 leading-snug truncate">{isAr ? kpi.labelAr : kpi.label}</p>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full inline-block mt-0.5"
                          style={{ background: t.color + '15', color: t.color }}>{isAr ? t.labelAr : t.label}</span>
                      </div>
                    </div>
                    {!isAr && insight && (
                      <p className="text-[10px] text-slate-600 leading-relaxed border-t pt-1.5" style={{ borderColor: t.color + '20' }}>
                        {insight}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Expert Verdict */}
        <div className="rounded-xl p-4 border border-[#082C6B]/10" style={{ background: 'linear-gradient(135deg, #082C6B08, #082C6B03)' }}>
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-[#082C6B]/10 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs">💼</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <p className="text-xs font-bold text-primary">{isAr ? 'الحكم التنفيذي' : 'Expert Verdict'}</p>
                <p className="text-[10px] text-muted-foreground/70 italic">Ma'in Alhaqash MCIPS CPSM</p>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">{verdict}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Print helper ─── */
function printKpiZone() {
  document.body.setAttribute('data-print', 'kpi');
  const cleanup = () => {
    document.body.removeAttribute('data-print');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  window.print();
}

/* ─── Main component ─── */
interface KPIDashboardProps { slug: string; }

const SAVE_DELAY = 400;

export function KPIDashboard({ slug }: KPIDashboardProps) {
  const { lang } = useLanguage();
  const { isAuthenticated } = useAuth();
  const isAr = lang === 'ar';
  const resolvedSlug = SLUG_ALIAS[slug] ?? slug;
  const kpis = KPI_FRAMEWORKS[resolvedSlug] ?? null;
  const storageKey = `isc-kpi-${resolvedSlug}`;

  const [values, setValues] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [importLog, setImportLog] = useState<string[] | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [expandedKpi, setExpandedKpi] = useState<string | null>(null);
  const [manualKpis, setManualKpis] = useState<KpiDef[]>([]);
  const [highlightedKpi, setHighlightedKpi] = useState<string | null>(null);

  /* ── Industry benchmark selection ── */
  const industryStorageKey = 'isc-kpi-industry';
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryKey | null>(() => {
    try { return (localStorage.getItem(industryStorageKey) as IndustryKey) || null; } catch { return null; }
  });
  const handleIndustryChange = useCallback((key: IndustryKey | null) => {
    setSelectedIndustry(key);
    try {
      if (key) localStorage.setItem(industryStorageKey, key);
      else localStorage.removeItem(industryStorageKey);
    } catch {}
  }, []);

  /* ── SKU / Inventory class selection ── */
  const skuClassStorageKey = 'isc-kpi-sku-class';
  const [selectedSkuClass, setSelectedSkuClass] = useState<SkuClassKey | null>(() => {
    try { return (localStorage.getItem(skuClassStorageKey) as SkuClassKey) || null; } catch { return null; }
  });
  const handleSkuClassChange = useCallback((key: SkuClassKey | null) => {
    setSelectedSkuClass(key);
    try {
      if (key) localStorage.setItem(skuClassStorageKey, key);
      else localStorage.removeItem(skuClassStorageKey);
    } catch {}
  }, []);

  /**
   * Returns a KpiDef with the effective benchmark substituted.
   * Priority: SKU class override → Industry override → KPI definition default.
   * SKU class wins for inventory-intensive KPIs (turns, fa, buf, ppm, mav, pocycle…).
   * Industry wins for process/operational KPIs not covered by SKU class.
   */
  const withIndustryBenchmark = useCallback((kpi: KpiDef): KpiDef => {
    const skuOverride = getSkuClassBenchmark(kpi.id, selectedSkuClass);
    if (skuOverride) return { ...kpi, benchmarkValue: skuOverride.value, benchmarkLabel: skuOverride.label, benchmarkLabelAr: skuOverride.labelAr };
    const indOverride = getIndustryBenchmark(kpi.id, selectedIndustry);
    if (indOverride) return { ...kpi, benchmarkValue: indOverride.value, benchmarkLabel: indOverride.label, benchmarkLabelAr: indOverride.labelAr };
    return kpi;
  }, [selectedIndustry, selectedSkuClass]);

  // Re-load values from localStorage whenever the resolved slug (and therefore the storage key) changes
  // on an already-mounted component.  The lazy initializer only runs once on mount, so without this
  // effect slug A's values would leak into slug B's inputs on a prop change.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setValues(saved ? JSON.parse(saved) : {});
    } catch {
      setValues({});
    }
  }, [storageKey]);

  const bannerDismissKey = `isc-kpi-banner-dismissed-${resolvedSlug}`;
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(() => {
    try { return localStorage.getItem(`isc-kpi-banner-dismissed-${resolvedSlug}`) === '1'; } catch { return false; }
  });
  // Re-evaluate the dismiss state whenever the slug changes on an already-mounted component.
  useEffect(() => {
    try { setBannerDismissed(localStorage.getItem(bannerDismissKey) === '1'); } catch { setBannerDismissed(false); }
  }, [bannerDismissKey]);
  const dismissBanner = useCallback(() => {
    try { localStorage.setItem(bannerDismissKey, '1'); } catch {}
    setBannerDismissed(true);
  }, [bannerDismissKey]);

  /* ── AI Plan (hook must be called before the !kpis early return) ── */
  const buildKpiPrompt = useCallback((): string => {
    if (!kpis) return '';
    const industryMeta = selectedIndustry ? INDUSTRIES.find(i => i.id === selectedIndustry) : null;
    const kpiLines = kpis.map(k => {
      const ek = withIndustryBenchmark(k);
      const raw = parseFloat(values[k.id] ?? '');
      if (isNaN(raw)) return null;
      const score = ek.higherIsBetter
        ? Math.min(100, Math.round((raw / ek.targetValue) * 100))
        : raw > 0 ? Math.min(100, Math.round((ek.targetValue / raw) * 100)) : 0;
      const tier = score >= 95 ? 'WORLD CLASS' : score >= 80 ? 'BEST-IN-GCC' : score >= 65 ? 'COMPETITIVE' : score >= 50 ? 'DEVELOPING' : score >= 35 ? 'NEEDS ATTENTION' : 'CRITICAL GAP';
      const bLabel = industryMeta ? `${ek.benchmarkLabel} (${industryMeta.label} sector median)` : `${ek.benchmarkLabel} (GCC general median)`;
      return `- **${k.label}**: ${raw} ${k.unit} vs target ${k.targetLabel} | peer benchmark: ${bLabel} → ${tier}`;
    }).filter(Boolean).join('\n');
    const entered = kpis.filter(k => !isNaN(parseFloat(values[k.id] ?? ''))).length;
    const rawScores = kpis.map(k => {
      const ek = withIndustryBenchmark(k);
      const raw = parseFloat(values[k.id] ?? '');
      if (isNaN(raw)) return null;
      return ek.higherIsBetter
        ? Math.min(100, Math.round((raw / ek.targetValue) * 100))
        : raw > 0 ? Math.min(100, Math.round((ek.targetValue / raw) * 100)) : 0;
    }).filter((v): v is number => v !== null);
    const overallScore = rawScores.length > 0 ? Math.round(rawScores.reduce((a, b) => a + b, 0) / rawScores.length) : 0;
    const skuMeta = selectedSkuClass ? SKU_CLASSES.find(s => s.id === selectedSkuClass) : null;
    const industryContext = industryMeta
      ? `Industry: ${industryMeta.label} (GCC sector median benchmarks applied)`
      : 'Industry: General GCC cross-sector benchmarks';
    const skuContext = skuMeta
      ? `Inventory class: ${skuMeta.label} — ${skuMeta.description}. SKU-class benchmarks override industry values for inventory-intensive KPIs (turns, forecast accuracy, buffer stock, defect rate, maverick spend, PO cycle time).`
      : 'Inventory class: All classes (no SKU-class filter applied)';
    return [
      `## KPI Performance Brief — Framework: ${resolvedSlug}`,
      `Health Score: ${overallScore}/100 | KPIs entered: ${entered} of ${kpis.length}`,
      industryContext,
      skuContext,
      '',
      '## KPI Status (6-tier: World Class / Best-in-GCC / Competitive / Developing / Needs Attention / Critical Gap)',
      kpiLines || '(no KPI values entered)',
      '',
      '## Your Task',
      `Generate a 3–5 paragraph executive performance brief for a ${industryMeta?.label ?? 'GCC'} organisation${skuMeta ? ` focusing on ${skuMeta.label} inventory` : ''}:`,
      '1. Lead with an overall health score narrative calibrated to this industry and inventory class',
      '2. Call out CRITICAL GAP and NEEDS ATTENTION KPIs with actual vs target and the peer gap',
      `3. For each underperforming KPI: one root-cause specific to ${skuMeta ? skuMeta.label + ' inventory in the ' + (industryMeta?.label ?? 'GCC') + ' context' : (industryMeta?.label ?? 'GCC') + ' sector'}, one corrective action`,
      '4. Close with a prioritised 30-day action list ([HIGH] / [MEDIUM] / [LOW])',
      '5. Where relevant, reference GCC Vision 2030 priorities (Iktva, localisation, digital transformation)',
    ].join('\n');
  }, [kpis, values, resolvedSlug, selectedIndustry, selectedSkuClass, withIndustryBenchmark]);

  // Compute hasAnyValue here (before hook) so canGenerate can be passed to useAIPlan
  const hasAnyValue = !!kpis && kpis.some(k => !isNaN(parseFloat(values[k.id] ?? '')));

  const { loading: planLoading, result: planResult, error: planError, rateLimited: planRateLimited, generate: generatePlan, reset: resetPlan,
          savedPlan: planSavedPlan, viewSaved: viewSavedPlan, deleteSaved: deleteSavedPlan,
          saveError: planSaveError, dismissSaveError: dismissPlanSaveError } =
    useAIPlan(buildKpiPrompt, isAr, 'kpi', hasAnyValue);

  const scrollToKpi = useCallback((kpiId: string) => {
    const el = document.getElementById(`kpi-card-${kpiId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedKpi(kpiId);
      setTimeout(() => setHighlightedKpi(null), 2000);
    }
  }, []);

  const handleChange = useCallback((id: string, raw: string) => {
    setValues(prev => {
      const next = { ...prev, [id]: raw };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        setSaveFailed(!safeSetItem(storageKey, JSON.stringify(next)));
      }, SAVE_DELAY);
      return next;
    });
  }, [storageKey]);

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  /* ── CSV template (professional data-collection format) ── */
  const downloadKpiTemplate = () => {
    if (!kpis) return;

    const frameworkLabel = resolvedSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const today = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });

    const allRows = buildKpiTemplateRows(kpis, frameworkLabel, today);
    downloadCsv(allRows, `ISC-KPI-Data-Collection-${resolvedSlug}-${today.replace(/\s/g, '-')}.csv`);
  };

  /* ── CSV import — supports both the new data-collection format and the legacy direct-entry format ── */
  const handleKpiImport = (file: File) => {
    if (!kpis) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const log: string[] = [];
      const nextValues = { ...values };
      let count = 0;
      let foundManualKpis: KpiDef[] = [];
      const importedKpiIds: string[] = [];

      // Detect format: new data-collection template has "Input Field" and "Your Value" columns
      const isNewFormat = text.includes('Your Value') && text.includes('Input Field');

      if (isNewFormat) {
        // ── New format: collect raw inputs per KPI, then calculate ──
        const { rows: csvRows } = parseCsvFile(text, ['KPI ID', 'Input Field', 'Your Value', 'Unit']);
        if (!csvRows.length) { setImportLog([isAr ? 'فشل الاستيراد: لا توجد بيانات.' : 'Import failed: no data rows found.']); return; }

        // Group input values by kpiId
        const inputsByKpi: Record<string, Record<string, number>> = {};
        csvRows.forEach(row => {
          const kpiId = row['KPI ID']?.trim().toLowerCase();
          const inputLabel = row['Input Field']?.trim();
          const rawVal = row['Your Value']?.trim();
          if (!kpiId || kpiId.startsWith('===') || kpiId.startsWith('---') || kpiId === '' || kpiId.endsWith('__result')) return;
          if (!rawVal || rawVal === '← calculated on import') return;
          const num = parseFloat(rawVal.replace(/,/g, ''));
          if (isNaN(num)) { log.push(`Skipped "${inputLabel}": "${rawVal}" is not a number.`); return; }

          const spec = KPI_DATA_SPECS[kpiId];
          if (!spec) return;
          // Match input field by position / label
          const inputDef = spec.inputs.find(inp =>
            inputLabel.toLowerCase().includes(inp.id.toLowerCase()) ||
            inp.label.toLowerCase().substring(0, 30) === inputLabel.toLowerCase().substring(0, 30),
          ) ?? spec.inputs.find((_, idx) => {
            // fallback: match by row order within this KPI's inputs
            const kpiRows = csvRows.filter(r => r['KPI ID']?.trim().toLowerCase() === kpiId && r['Your Value']?.trim() && r['Your Value']?.trim() !== '← calculated on import');
            return kpiRows.indexOf(row) === idx;
          });

          if (!inputDef) return;
          if (!inputsByKpi[kpiId]) inputsByKpi[kpiId] = {};
          inputsByKpi[kpiId][inputDef.id] = num;
        });

        // Calculate each KPI from collected inputs
        const { values: calcValues, log: calcLog, count: calcCount } =
          calcKpisFromInputs(kpis, inputsByKpi, isAr);
        Object.assign(nextValues, calcValues);
        log.push(...calcLog);
        count += calcCount;
        importedKpiIds.push(...Object.keys(calcValues));

        // Identify KPIs in this framework that have no calculation spec — user must enter them manually
        foundManualKpis = kpis.filter(k => !KPI_DATA_SPECS[k.id]);
        if (foundManualKpis.length > 0) {
          const labels = foundManualKpis.map(k => isAr ? k.labelAr : k.label).join(', ');
          log.push(isAr
            ? `📝 ${foundManualKpis.length} مؤشر(ات) تتطلّب إدخالاً يدوياً: ${labels}`
            : `📝 ${foundManualKpis.length} KPI(s) require manual entry: ${labels}`);
        }

      } else {
        // ── Legacy format: direct KPI value entry (KPI ID + Actual Value) ──
        const { rows: csvRows, errors } = parseCsvFile(text, ['KPI ID', 'Actual Value']);
        if (errors.length > 0 && csvRows.length === 0) { setImportLog([isAr ? 'فشل الاستيراد:' : 'Import failed:', ...errors]); return; }
        log.push(...errors);
        csvRows.forEach((row, i) => {
          const kpiId = row['KPI ID']?.trim();
          const val = row['Actual Value']?.trim();
          const kpiDef = kpis.find(k => k.id === kpiId || k.label === row['KPI Name']?.trim());
          if (!kpiDef) { if (kpiId) log.push(`Row ${i + 2}: KPI ID "${kpiId}" not recognised — skipped.`); return; }
          if (val !== undefined && val !== '') {
            const num = parseFloat(val);
            if (isNaN(num)) { log.push(`Row ${i + 2}: "${val}" must be a number — skipped.`); return; }
            nextValues[kpiDef.id] = val; count++;
            importedKpiIds.push(kpiDef.id);
          }
        });
      }

      // ── Per-KPI on-target status summary ──
      if (importedKpiIds.length > 0) {
        const statusLines: string[] = [];
        kpis.forEach(k => {
          if (!importedKpiIds.includes(k.id)) return;
          const rawVal = nextValues[k.id];
          if (rawVal === undefined || rawVal === '') return;
          const num = parseFloat(String(rawVal));
          if (isNaN(num)) return;
          const onTarget = k.higherIsBetter ? num >= k.targetValue : num <= k.targetValue;
          const label = isAr ? k.labelAr : k.label;
          const unit  = isAr ? k.unitAr  : k.unit;
          statusLines.push(
            onTarget
              ? (isAr ? `✅ ${label}: ${num} ${unit} — حسب الهدف`    : `✅ ${label}: ${num} ${unit} — On Target`)
              : (isAr ? `❌ ${label}: ${num} ${unit} — دون الهدف` : `❌ ${label}: ${num} ${unit} — Below Target`),
          );
        });
        if (statusLines.length > 0) log.push(...statusLines);
      }

      setValues(nextValues);
      setSaveFailed(!safeSetItem(storageKey, JSON.stringify(nextValues)));
      if (isNewFormat) {
        const manualSuffix = foundManualKpis.length > 0
          ? (isAr ? `، ${foundManualKpis.length} تتطلّب إدخالاً يدوياً` : `, ${foundManualKpis.length} require manual entry`)
          : '';
        log.unshift(isAr
          ? `✓ تم احتساب ${count} مؤشر(ات) تلقائياً${manualSuffix}.`
          : `✓ ${count} KPI(s) auto-calculated${manualSuffix}.`);
      } else {
        log.unshift(isAr ? `✓ تم احتساب ${count} مؤشر(ات) وتحديثها.` : `✓ ${count} KPI(s) calculated and updated.`);
      }
      setManualKpis(foundManualKpis);
      setImportLog(log);
    };
    reader.readAsText(file);
  };

  /* scores */
  /* Strict guard — show explicit error state if slug has no configured framework */
  if (!kpis) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center text-muted-foreground">
        <Info className="w-8 h-8 text-amber-400" />
        <p className="font-semibold text-sm">
          {isAr
            ? `لا يوجد إطار مؤشرات أداء مُعدَّ للمسار: "${slug}"`
            : `No KPI framework configured for slug: "${slug}"`}
        </p>
        <p className="text-xs max-w-xs">
          {isAr
            ? 'أضف مفتاح هذا المسار إلى KPI_FRAMEWORKS في KPIDashboard.tsx أو أضفه إلى SLUG_ALIAS.'
            : 'Add this slug to KPI_FRAMEWORKS in KPIDashboard.tsx, or map it via SLUG_ALIAS.'}
        </p>
      </div>
    );
  }

  const scores = kpis.map(k => {
    const ek = withIndustryBenchmark(k);
    const raw = parseFloat(values[k.id] ?? '');
    return { kpi: ek, score: isNaN(raw) ? null as number | null : scoreKpi(ek, raw), value: raw };
  });

  const scoredKpis = scores.filter(s => s.score !== null);
  const healthScore = scoredKpis.length
    ? Math.round(scoredKpis.reduce((sum, s) => sum + (s.score ?? 0), 0) / scoredKpis.length)
    : 0;

  /* scored entries used by Performance Intelligence */
  const piScores = scores.filter(s => s.score !== null) as { kpi: KpiDef; score: number; value: number }[];

  /* bar chart data — uses industry-resolved benchmark via ek stored in scores */
  const barData = buildBarChartData(scores, isAr);

  return (
    <div className="space-y-6 print-zone-kpi">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-2xl font-bold text-primary">{isAr ? 'لوحة مؤشرات الأداء — ISC' : 'ISC KPI Dashboard'}</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {!planResult && !planLoading && (
              isAuthenticated ? (
                hasAnyValue && (
                  <button
                    onClick={generatePlan}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold bg-gradient-to-r from-[#082C6B] to-[#1a4a9e] text-white hover:opacity-90 transition-all shadow-sm"
                  >
                    <span className="text-sm leading-none">✨</span>
                    {isAr ? 'توليد التقرير التنفيذي' : 'Generate Performance Brief'}
                  </button>
                )
              ) : (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 border border-border rounded-lg px-3 py-2">
                  <LogIn className="w-3.5 h-3.5 shrink-0 text-primary/60" />
                  <span>{isAr ? 'سجِّل دخولك لتوليد خطة الذكاء الاصطناعي' : 'Sign in to generate an AI plan'}</span>
                </div>
              )
            )}
            {(planResult || planLoading) && !planResult && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="animate-spin">⟳</span>{isAr ? 'جارٍ التوليد…' : 'Generating…'}
              </span>
            )}
            <button onClick={downloadKpiTemplate} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors">
              <Download className="w-3 h-3" />{isAr ? 'قالب CSV' : 'Template'}
            </button>
            <button onClick={() => importInputRef.current?.click()} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors">
              <Upload className="w-3 h-3" />{isAr ? 'استيراد CSV' : 'Import CSV'}
            </button>
            <button onClick={printKpiZone} className="print-hide flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors">
              <Printer className="w-3 h-3" />{isAr ? 'طباعة' : 'Print'}
            </button>
            <input type="file" accept=".csv" className="hidden" ref={importInputRef}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleKpiImport(f); e.target.value = ''; }} />
          </div>
        </div>
        <p className={`mt-1 text-sm ${saveFailed ? 'text-amber-700' : 'text-muted-foreground'}`}>
          {saveFailed
            ? (isAr ? '⚠ تعذّر حفظ القيم — التخزين ممتلئ أو محظور.' : '⚠ Values not saved — storage is full or blocked.')
            : (isAr
                ? 'أدخل أرقامك الفعلية — تتحدّث اللوحة لحظياً. تُحفظ قيمك تلقائياً.'
                : 'Enter your actual numbers — the dashboard updates live. Your values are auto-saved.')}
        </p>
        {importLog && (
          <div className={`mt-2 text-xs rounded-lg p-3 border ${importLog[0]?.startsWith('✓') ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                {importLog.map((m, i) => {
                  // Render the manual-entry line with clickable KPI labels
                  if (m.startsWith('📝') && manualKpis.length > 0) {
                    const prefix = isAr
                      ? `📝 ${manualKpis.length} مؤشر(ات) تتطلّب إدخالاً يدوياً: `
                      : `📝 ${manualKpis.length} KPI(s) require manual entry: `;
                    return (
                      <p key={i} className="opacity-75">
                        {prefix}
                        {manualKpis.map((k, ki) => (
                          <React.Fragment key={k.id}>
                            <button
                              onClick={() => scrollToKpi(k.id)}
                              className="underline font-semibold hover:opacity-70 transition-opacity focus:outline-none"
                            >
                              {isAr ? k.labelAr : k.label}
                            </button>
                            {ki < manualKpis.length - 1 && ', '}
                          </React.Fragment>
                        ))}
                      </p>
                    );
                  }
                  if (m.startsWith('✅') || m.startsWith('❌')) {
                    const ok = m.startsWith('✅');
                    return (
                      <p key={i} className={`font-medium ${ok ? 'text-emerald-700' : 'text-red-700'}`}>{m}</p>
                    );
                  }
                  return <p key={i} className={i === 0 ? 'font-bold' : 'opacity-75'}>{m}</p>;
                })}
              </div>
              <button onClick={() => { setImportLog(null); setManualKpis([]); }} className="shrink-0 opacity-50 hover:opacity-100 font-bold">✕</button>
            </div>
          </div>
        )}
      </div>

      {/* Industry benchmark selector */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-start gap-3 flex-wrap">
          <div className="shrink-0 pt-0.5">
            <p className="text-[11px] font-bold text-primary uppercase tracking-wider">
              {isAr ? 'المقارنة القطاعية' : 'Industry Benchmark'}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 whitespace-nowrap">
              {isAr ? 'اختر قطاعك للمقارنة الدقيقة' : 'Select your sector for peer comparison'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap flex-1">
            <button
              onClick={() => handleIndustryChange(null)}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all whitespace-nowrap"
              style={!selectedIndustry ? {
                background: '#082C6B', color: '#fff', borderColor: '#082C6B',
              } : {
                background: '#fff', color: '#6b7280', borderColor: '#e5e7eb',
              }}
            >
              {isAr ? '🌍 عام' : '🌍 General GCC'}
            </button>
            {INDUSTRIES.map(ind => (
              <button
                key={ind.id}
                onClick={() => handleIndustryChange(ind.id)}
                title={ind.description}
                className="text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all whitespace-nowrap"
                style={selectedIndustry === ind.id ? {
                  background: '#082C6B', color: '#fff', borderColor: '#082C6B',
                } : {
                  background: '#fff', color: '#6b7280', borderColor: '#e5e7eb',
                }}
              >
                {ind.icon} {isAr ? ind.labelAr : ind.label}
              </button>
            ))}
          </div>
          {selectedIndustry && (
            <div className="shrink-0 pt-0.5">
              <p className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                <span>✓</span>
                {isAr
                  ? `المعايير مُعدَّلة لـ ${INDUSTRIES.find(i => i.id === selectedIndustry)?.labelAr}`
                  : `Benchmarks calibrated for ${INDUSTRIES.find(i => i.id === selectedIndustry)?.label}`}
              </p>
            </div>
          )}
        </div>

        {/* SKU / Inventory class row */}
        <div className="flex items-start gap-3 flex-wrap pt-2.5 border-t border-slate-200 mt-2.5">
          <div className="shrink-0 pt-0.5">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isAr ? 'تصنيف المخزون / الصنف' : 'SKU / Inventory Class'}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 whitespace-nowrap">
              {isAr ? 'يُعدِّل مؤشرات المخزون' : 'Adjusts inventory-intensive KPIs'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap flex-1">
            <button
              onClick={() => handleSkuClassChange(null)}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all whitespace-nowrap"
              style={!selectedSkuClass ? {
                background: '#475569', color: '#fff', borderColor: '#475569',
              } : {
                background: '#fff', color: '#9ca3af', borderColor: '#e5e7eb',
              }}
            >
              {isAr ? '📦 كل الأصناف' : '📦 All Classes'}
            </button>
            {SKU_CLASSES.map(sc => (
              <button
                key={sc.id}
                onClick={() => handleSkuClassChange(sc.id)}
                title={sc.description}
                className="text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all whitespace-nowrap"
                style={selectedSkuClass === sc.id ? {
                  background: '#475569', color: '#fff', borderColor: '#475569',
                } : {
                  background: '#fff', color: '#9ca3af', borderColor: '#e5e7eb',
                }}
              >
                {sc.icon} {isAr ? sc.labelAr : sc.label}
              </button>
            ))}
          </div>
          {selectedSkuClass && (
            <div className="shrink-0 pt-0.5">
              <p className="text-[10px] text-slate-600 font-semibold flex items-center gap-1">
                <span>✓</span>
                {isAr
                  ? `مُعدَّل لـ ${SKU_CLASSES.find(s => s.id === selectedSkuClass)?.labelAr}`
                  : `Overrides: ${SKU_CLASSES.find(s => s.id === selectedSkuClass)?.label}`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Data-collection guidance banner — shown once per framework until dismissed or values are entered */}
      {!bannerDismissed && !hasAnyValue && (
        <div className="relative rounded-xl border border-blue-200 bg-blue-50 p-4 pr-10 text-sm shadow-sm">
          <button
            onClick={dismissBanner}
            aria-label={isAr ? 'إغلاق' : 'Dismiss'}
            className="absolute top-3 right-3 text-blue-400 hover:text-blue-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 shrink-0 mt-0.5 text-blue-500" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-blue-900 mb-1">
                {isAr ? 'كيف تُدخل بياناتك بدقة؟' : 'How to get accurate KPI results'}
              </p>
              <ol className={`space-y-1 text-blue-800 mb-3 ${isAr ? 'list-none' : 'list-none'}`}>
                <li className="flex items-start gap-2">
                  <span className="shrink-0 font-bold text-blue-500">1.</span>
                  <span>
                    {isAr
                      ? 'حمّل نموذج CSV — يحتوي على كل حقل بيانات خام تحتاجه، مع وصف المصدر ومثال.'
                      : 'Download the CSV Template — it lists every raw data field you need, with source guidance and examples.'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="shrink-0 font-bold text-blue-500">2.</span>
                  <span>
                    {isAr
                      ? 'أدخل الأرقام الخام في عمود "قيمتك" من تقارير ERP أو المحاسبة أو إدارة الجودة.'
                      : 'Fill in the raw numbers in the "Your Value" column from your ERP, finance, or quality reports.'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="shrink-0 font-bold text-blue-500">3.</span>
                  <span>
                    {isAr
                      ? 'استورد الملف — يحتسب النظام قيم مؤشرات الأداء تلقائياً من بياناتك الخام.'
                      : 'Import the file — the system auto-calculates every KPI value from your raw inputs.'}
                  </span>
                </li>
              </ol>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => { downloadKpiTemplate(); dismissBanner(); }}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isAr ? 'تنزيل النموذج' : 'Download Template'}
                </button>
                <button
                  onClick={dismissBanner}
                  className="text-xs text-blue-500 hover:text-blue-700 transition-colors underline underline-offset-2"
                >
                  {isAr ? 'سأدخل الأرقام يدوياً' : "I'll enter numbers manually"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Health score + inputs grid */}
      <div className="grid lg:grid-cols-[200px_1fr] gap-6 items-start">
        {/* Gauge panel */}
        <div className="bg-white border border-border rounded-2xl p-5 flex flex-col items-center gap-2 shadow-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">
            {isAr ? 'صحة مؤشرات الأداء' : 'KPI Health Score'}
          </p>
          <HealthGauge score={healthScore} hasAnyValue={hasAnyValue} />
          {hasAnyValue ? (
            <>
              <div className="w-full rounded-xl px-3 py-2 text-center text-xs font-semibold mt-1"
                style={{ background: scoreColor(healthScore) + '18', color: scoreColor(healthScore) }}>
                {healthLabel(healthScore, isAr)}
              </div>
              <p className="text-xs text-muted-foreground text-center mt-1">
                {isAr ? `${scoredKpis.length} من ${kpis.length} مؤشرات مُدخَلة` : `${scoredKpis.length} of ${kpis.length} KPIs entered`}
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground text-center">
              {isAr ? 'أدخل أرقامك لرؤية نتيجتك' : 'Enter your numbers to see your score'}
            </p>
          )}
          <div className="w-full mt-3 space-y-1.5">
            <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-1">
              {isAr ? 'مستويات الأداء' : 'Performance Tiers'}
            </p>
            {([95, 80, 65, 50, 35, 0] as const).map(threshold => {
              const t = scoreTier(threshold);
              return (
                <div key={t.label} className="flex items-center gap-2 text-[10px]">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: t.color }} />
                  <span className="text-muted-foreground font-medium">
                    {isAr ? t.labelAr : t.label}
                    <span className="opacity-50 ml-1 font-normal">
                      {threshold === 0 ? (isAr ? '<35' : '<35') : `≥${threshold}`}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* KPI input cards — premium design */}
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {scores.map(({ kpi, score, value }) => {
            const spec   = KPI_DATA_SPECS[kpi.id];
            const isExp  = expandedKpi === kpi.id;
            const t      = score !== null ? scoreTier(score) : null;
            const q      = (score !== null && !isNaN(value)) ? kpiQuartile(kpi, value) : null;
            const gap    = (score !== null && !isNaN(value)) ? gapText(kpi, value, isAr) : null;
            const insight = (score !== null && !isNaN(value))
              ? getKpiExpertInsight(kpi.id, score, value, kpi.unit, isAr) : null;

            return (
              <div key={kpi.id}
                id={`kpi-card-${kpi.id}`}
                className="bg-white rounded-xl shadow-sm overflow-hidden flex"
                style={{
                  border: `1px solid ${t ? t.color + '35' : '#e5e7eb'}`,
                  transition: 'box-shadow 0.4s ease',
                  boxShadow: highlightedKpi === kpi.id
                    ? '0 0 0 3px #3b82f6aa, 0 4px 24px #3b82f640'
                    : undefined,
                }}>

                {/* Left tier accent bar */}
                <div className="w-1 shrink-0 rounded-l-xl" style={{ background: t ? t.color : '#e5e7eb' }} />

                <div className="flex-1 min-w-0">
                  {/* Card header */}
                  <div className="p-3 pb-0">
                    <div className="flex items-start gap-1.5 mb-2">
                      <label className="text-xs font-bold text-primary leading-snug flex-1 cursor-pointer" htmlFor={`kpi-${kpi.id}`}>
                        {isAr ? kpi.labelAr : kpi.label}
                      </label>
                      {/* Tier + quartile badges */}
                      {t && q && (
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                            style={{ background: t.color + '18', color: t.color }}>
                            {t.badge} {isAr ? t.labelAr : t.label}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                            style={{ background: quartileColor(q) + '15', color: quartileColor(q) }}>
                            {quartileLabel(q, isAr)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Input row */}
                    <div className="flex items-center gap-2 mb-1">
                      <input id={`kpi-${kpi.id}`} type="number" step="any" min="0"
                        value={values[kpi.id] ?? ''}
                        onChange={e => handleChange(kpi.id, e.target.value)}
                        placeholder={isAr ? `المرجع: ${kpi.benchmarkLabel}` : `Benchmark: ${kpi.benchmarkLabel}`}
                        className="w-full text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:border-transparent bg-white transition-colors"
                        style={{
                          borderColor: t ? t.color + '50' : '#e5e7eb',
                          ['--tw-ring-color' as string]: t ? t.color + '40' : '#e5e7eb',
                        }}
                      />
                      <span className="text-xs text-muted-foreground shrink-0 font-medium">{isAr ? kpi.unitAr : kpi.unit}</span>
                    </div>

                    {/* Mini gauge */}
                    <div className="flex justify-center my-0.5">
                      <MiniGauge score={score ?? 0} hasValue={score !== null} />
                    </div>

                    {/* Target row */}
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
                      <span className="font-medium">
                        {isAr ? `هدف: ${kpi.targetLabelAr ?? kpi.targetLabel}` : `Target: ${kpi.targetLabel}`}
                      </span>
                      <span className="flex items-center gap-0.5">
                        {kpi.higherIsBetter
                          ? <TrendingUp className="w-2.5 h-2.5 text-emerald-500" />
                          : <TrendingDown className="w-2.5 h-2.5 text-blue-500" />}
                        {kpi.higherIsBetter ? (isAr ? 'أعلى أفضل' : 'Higher') : (isAr ? 'أقل أفضل' : 'Lower')}
                      </span>
                    </div>

                    {/* Gap annotation */}
                    {gap && (
                      <p className="text-[9px] font-semibold mb-1.5 leading-snug"
                        style={{ color: t ? t.color : '#6b7280' }}>
                        ↗ {gap}
                      </p>
                    )}

                    {/* Expert insight */}
                    {insight && (
                      <div className="rounded-lg p-2 mb-2 text-[10px] leading-relaxed"
                        style={{ background: t ? t.color + '08' : '#f8fafc', borderLeft: `2px solid ${t ? t.color + '40' : '#e5e7eb'}` }}>
                        <span className="text-slate-600">{insight}</span>
                      </div>
                    )}

                    {/* Calc toggle */}
                    {spec && (
                      <button
                        onClick={() => setExpandedKpi(isExp ? null : kpi.id)}
                        className="flex items-center gap-1 text-[10px] font-semibold transition-colors w-full pb-2.5"
                        style={{ color: t ? t.color + 'cc' : '#9ca3af' }}>
                        {isExp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {isAr ? 'كيف نحسب هذا؟' : 'How is this calculated?'}
                      </button>
                    )}
                  </div>

                  {/* Expanded methodology */}
                  {spec && isExp && (
                    <div className="border-t bg-slate-50/80 p-3 space-y-3 text-xs"
                      style={{ borderColor: t ? t.color + '20' : '#e5e7eb' }}>

                      <div>
                        <p className="font-bold text-primary mb-1">📊 {isAr ? 'ما الذي يقيسه' : 'What it measures'}</p>
                        <p className="text-muted-foreground leading-relaxed">
                          {spec.methodology.substring(0, 220)}{spec.methodology.length > 220 ? '…' : ''}
                        </p>
                      </div>

                      <div>
                        <p className="font-bold text-primary mb-1">🧮 {isAr ? 'طريقة الحساب' : 'Formula'}</p>
                        <pre className="text-[10px] bg-white border border-border rounded-lg p-2 whitespace-pre-wrap font-mono text-slate-700 leading-relaxed">
                          {spec.formula}
                        </pre>
                      </div>

                      <div>
                        <p className="font-bold text-primary mb-1.5">📋 {isAr ? 'البيانات المطلوبة' : 'Data inputs required'}</p>
                        <div className="space-y-1.5">
                          {spec.inputs.map((inp, i) => (
                            <div key={inp.id} className="bg-white border border-border/60 rounded-lg p-2">
                              <div className="flex items-start gap-2">
                                <span className="shrink-0 w-4 h-4 rounded-full font-bold flex items-center justify-center text-[9px] mt-0.5"
                                  style={{ background: t ? t.color + '15' : '#f1f5f9', color: t ? t.color : '#6b7280' }}>{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-slate-800 leading-snug text-[11px]">{inp.label}</p>
                                  <p className="text-muted-foreground text-[10px] leading-snug mt-0.5">
                                    <span className="font-medium text-slate-600">Source:</span> {inp.dataSource.substring(0, 110)}{inp.dataSource.length > 110 ? '…' : ''}
                                  </p>
                                  <p className="text-slate-400 text-[9px] mt-0.5">{inp.unit} · e.g. {inp.example.toLocaleString()}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {spec.notes && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                          <p className="font-bold text-amber-800 mb-0.5 text-[10px]">💡 {isAr ? 'ملاحظة' : 'Note'}</p>
                          <p className="text-amber-700 leading-relaxed text-[10px]">{spec.notes}</p>
                        </div>
                      )}

                      <p className="text-[9px] text-muted-foreground/60 italic">
                        {isAr ? 'حمّل قالب CSV لجمع البيانات الخام — تُحسَب النتيجة تلقائياً عند الاستيراد.' : 'Download the CSV Template to collect raw data — results auto-calculate on import.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Intelligence — appears once ≥3 KPIs are entered */}
      {hasAnyValue && (
        <PerformanceIntelligence
          scores={piScores}
          isAr={isAr}
          kpisTotal={kpis.length}
        />
      )}

      {/* Bar chart — only when values exist */}
      {hasAnyValue && (
        <div
          className="bg-white border border-border rounded-2xl p-6 shadow-sm kpi-chart-wrap"
          style={{ WebkitPrintColorAdjust: 'exact' } as React.CSSProperties}
        >
          <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
            <div>
              <p className="text-sm font-bold text-primary">
                {isAr ? 'مقارنة: قيمتك · المستهدف · المعيار الخليجي' : 'GCC Benchmark Comparison'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isAr ? 'مقارنة أدائك بالأهداف والمعيار الخليجي لكل مؤشر' : 'Your performance vs target and GCC benchmark for each KPI'}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {[
                { color: '#059669', label: isAr ? 'عالمي/أفضل خليجياً' : 'World Class / Best-in-GCC' },
                { color: '#f59e0b', label: isAr ? 'تنافسي/في التطوير' : 'Competitive / Developing' },
                { color: '#ef4444', label: isAr ? 'يحتاج تحسين' : 'Needs Attention / Critical' },
                { color: GOLD,      label: isAr ? 'الهدف' : 'Target', shape: 'square' },
                { color: '#cbd5e1', label: isAr ? 'المعيار الخليجي' : 'GCC Benchmark', shape: 'square' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <div className={`w-2.5 h-2.5 shrink-0 ${l.shape === 'square' ? 'rounded-sm' : 'rounded-full'}`} style={{ background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 64 }} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="nameShort" tick={{ fontSize: 10, fill: '#6b7280' }} angle={-38} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} width={36} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                formatter={(v: number, name: string) => {
                  const label = name === 'yours'
                    ? (isAr ? 'قيمتك' : 'Your value')
                    : name === 'target'
                      ? (isAr ? 'الهدف' : 'Target')
                      : (isAr ? 'المعيار الخليجي' : 'GCC Benchmark');
                  return [v, label];
                }}
              />
              <Bar dataKey="yours" name="yours" radius={[4, 4, 0, 0]} maxBarSize={28}>
                {barData.map((_, i) => (
                  <Cell key={i} fill={scoreColor(scores[i].score ?? 0)} fillOpacity={0.9} />
                ))}
              </Bar>
              <Bar dataKey="target"    name="target"    fill={GOLD}    radius={[4, 4, 0, 0]} fillOpacity={0.55} maxBarSize={28} />
              <Bar dataKey="benchmark" name="benchmark" fill="#cbd5e1" radius={[4, 4, 0, 0]} fillOpacity={0.55} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* AI Plan panel */}
      {(planLoading || planResult || planError || planSavedPlan) && (
        <AIPlanPanel
          loading={planLoading}
          result={planResult}
          error={planError}
          onGenerate={generatePlan}
          onReset={resetPlan}
          buttonLabel={isAr ? 'توليد التقرير التنفيذي ✨' : 'Generate Performance Brief ✨'}
          isAr={isAr}
          savedPlan={planSavedPlan}
          onViewSaved={viewSavedPlan}
          onDeleteSaved={deleteSavedPlan}
          rateLimited={planRateLimited}
          saveError={planSaveError}
          onDismissSaveError={dismissPlanSaveError}
          toolKey="kpi"
        />
      )}

      {/* ISC CTA */}
      <div className="rounded-2xl p-6 text-white" style={{ background: `linear-gradient(135deg, ${NAVY}, #0B3D91)` }}>
        <p className="font-bold mb-1">
          {isAr ? 'هل تريد تحسين هذه المؤشرات؟' : 'Ready to improve these KPIs?'}
        </p>
        <p className="text-white/70 text-sm mb-3">
          {isAr
            ? 'احجز استشارة مجانية مدّتها 45 دقيقة مع مَعِن الحقش MCIPS CPSM — لمناقشة أرقامك والأثر القابل للتحقيق.'
            : "Book a free 45-min consultation with Ma'in Alhaqash MCIPS CPSM — to discuss your numbers and the achievable impact."}
        </p>
        <a href="/consultant" className="inline-block text-sm font-bold px-4 py-2 rounded-lg" style={{ background: GOLD }}>
          {isAr ? 'احجز الآن ←' : 'Book Now →'}
        </a>
      </div>
    </div>
  );
}
