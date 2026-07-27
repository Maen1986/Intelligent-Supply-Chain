import React, { useState, useEffect, useCallback, useRef } from 'react';
import { safeSetItem } from '@/lib/storage';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts';
import { useLanguage } from '@/lib/LanguageContext';
import { Info, TrendingUp, TrendingDown, Download, Upload, LogIn } from 'lucide-react';
import { parseCsvFile, downloadCsv } from '@/lib/importCsv';
import { useAIPlan } from '@/hooks/useAIPlan';
import { AIPlanPanel } from '@/components/AIPlanPanel';
import { useAuth } from '@/lib/AuthContext';

/* ─── KPI definition types ─── */
interface KpiDef {
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

export function scoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
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

function scoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-50 border-emerald-200';
  if (score >= 50) return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
}

function healthLabel(score: number, isAr: boolean): string {
  if (score >= 80) return isAr ? 'أداء جيد — فوق المعيار المرجعي' : 'Strong — above GCC benchmark';
  if (score >= 60) return isAr ? 'متوسط — يحتاج إلى تحسين مُركَّز' : 'Developing — targeted improvement needed';
  if (score >= 40) return isAr ? 'ضعيف — فجوات أداء حرجة' : 'Weak — critical performance gaps';
  return isAr ? 'يتطلّب تدخّلاً فورياً' : 'Immediate intervention required';
}

const NAVY = '#082C6B';
const GOLD = '#C9A84C';

/* ─── Gauge using SVG arc ─── */
function HealthGauge({ score }: { score: number }) {
  const r = 72, cx = 90, cy = 90;
  const circumference = Math.PI * r; // half circle
  const angle = (score / 100) * 180; // degrees for half-circle gauge
  const rad = (angle - 180) * (Math.PI / 180);
  // Simple semicircle gauge with SVG
  const strokeDash = (score / 100) * circumference;
  const color = scoreColor(score);
  return (
    <svg width={180} height={110} viewBox="0 0 180 110" className="overflow-visible">
      {/* Track */}
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="#e5e7eb" strokeWidth={18} strokeLinecap="round" />
      {/* Fill */}
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke={color} strokeWidth={18} strokeLinecap="round"
        strokeDasharray={`${strokeDash} ${circumference}`} />
      {/* Score text */}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize={28} fontWeight="800" fill={NAVY}>{score}</text>
      <text x={cx} y={cy + 16} textAnchor="middle" fontSize={11} fill="#6b7280">/100</text>
      {/* Needle */}
      <line x1={cx} y1={cy} x2={cx + (r - 8) * Math.cos(rad)} y2={cy + (r - 8) * Math.sin(rad)}
        stroke={NAVY} strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={5} fill={NAVY} />
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

  /* ── AI Plan (hook must be called before the !kpis early return) ── */
  const buildKpiPrompt = useCallback((): string => {
    if (!kpis) return '';
    const kpiLines = kpis.map(k => {
      const raw = parseFloat(values[k.id] ?? '');
      if (isNaN(raw)) return null;
      const score = k.higherIsBetter
        ? Math.min(100, Math.round((raw / k.targetValue) * 100))
        : raw > 0 ? Math.min(100, Math.round((k.targetValue / raw) * 100)) : 0;
      const status = score >= 70 ? '🟢 GREEN' : score >= 40 ? '🟡 AMBER' : '🔴 RED';
      return `- **${k.label}**: actual ${raw} ${k.unit} vs target ${k.targetLabel} (benchmark: ${k.benchmarkLabel}) → ${status}`;
    }).filter(Boolean).join('\n');
    const entered = kpis.filter(k => !isNaN(parseFloat(values[k.id] ?? ''))).length;
    const rawScores = kpis.map(k => {
      const raw = parseFloat(values[k.id] ?? '');
      if (isNaN(raw)) return null;
      return k.higherIsBetter
        ? Math.min(100, Math.round((raw / k.targetValue) * 100))
        : raw > 0 ? Math.min(100, Math.round((k.targetValue / raw) * 100)) : 0;
    }).filter((v): v is number => v !== null);
    const overallScore = rawScores.length > 0 ? Math.round(rawScores.reduce((a, b) => a + b, 0) / rawScores.length) : 0;
    return [
      `## KPI Performance Brief — Framework: ${resolvedSlug}`,
      `Health Score: ${overallScore}/100 | KPIs entered: ${entered} of ${kpis.length}`,
      '',
      '## KPI Status',
      kpiLines || '(no KPI values entered)',
      '',
      '## Your Task',
      'Generate a 3–5 paragraph executive performance brief:',
      '1. Lead with an overall health score narrative (what the number means for the business)',
      '2. Call out the specific RED and AMBER KPIs by name with their actual values vs targets',
      '3. For each RED KPI: one root-cause hypothesis and one recommended corrective action',
      '4. Close with a prioritised 30-day action list (label each item [HIGH], [MEDIUM], or [LOW])',
    ].join('\n');
  }, [kpis, values, resolvedSlug]);

  // Compute hasAnyValue here (before hook) so canGenerate can be passed to useAIPlan
  const hasAnyValue = !!kpis && kpis.some(k => !isNaN(parseFloat(values[k.id] ?? '')));

  const { loading: planLoading, result: planResult, error: planError, rateLimited: planRateLimited, generate: generatePlan, reset: resetPlan,
          savedPlan: planSavedPlan, viewSaved: viewSavedPlan, deleteSaved: deleteSavedPlan } =
    useAIPlan(buildKpiPrompt, isAr, 'kpi', hasAnyValue);

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

  /* ── CSV template ── */
  const downloadKpiTemplate = () => {
    if (!kpis) return;
    const headers = ['KPI ID', 'KPI Name', 'Actual Value', 'Unit', 'Target', 'Benchmark', 'Status'];
    const rows = kpis.map((k, i) => {
      const row = i + 2; // row 1 is header
      // Parse numeric target from targetLabel (e.g. ">95%" → 95, "<28 days" → 28)
      const targetNum = k.targetValue;
      // Direction: higherIsBetter → ">", lowerIsBetter → "<"
      const dir = k.higherIsBetter ? '>' : '<';
      // Formula: if Actual is empty → blank; compare C against E (Target col)
      const formula = `=IF(C${row}="","",IF(ISNUMBER(C${row}*1),IF("${dir}"=">",IF(C${row}*1>=${targetNum},"🟢 GREEN","🔴 RED"),IF(C${row}*1<=${targetNum},"🟢 GREEN","🔴 RED")),""))`;
      return [k.id, k.label, '', k.unit, k.targetLabel, k.benchmarkLabel, formula];
    });
    downloadCsv([headers, ...rows], `kpi-template-${resolvedSlug}.csv`);
  };

  /* ── CSV import ── */
  const handleKpiImport = (file: File) => {
    if (!kpis) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { rows: csvRows, errors } = parseCsvFile(text, ['KPI ID', 'Actual Value']);
      if (errors.length > 0 && csvRows.length === 0) { setImportLog([isAr ? 'فشل الاستيراد:' : 'Import failed:', ...errors]); return; }
      const log: string[] = [...errors];
      const nextValues = { ...values };
      let count = 0;
      csvRows.forEach((row, i) => {
        const kpiId = row['KPI ID']?.trim();
        const val = row['Actual Value']?.trim();
        const kpiDef = kpis.find(k => k.id === kpiId || k.label === row['KPI Name']?.trim());
        if (!kpiDef) { if (kpiId) log.push(`Row ${i + 2}: KPI ID "${kpiId}" not in this framework — skipped.`); return; }
        if (val !== undefined && val !== '') {
          const num = parseFloat(val);
          if (isNaN(num)) { log.push(`Row ${i + 2}: Actual Value "${val}" must be a number — skipped.`); return; }
          nextValues[kpiDef.id] = val; count++;
        }
      });
      setValues(nextValues);
      setSaveFailed(!safeSetItem(storageKey, JSON.stringify(nextValues)));
      log.unshift(isAr ? `✓ تم تحديث ${count} مؤشر(ات).` : `✓ Updated ${count} KPI(s).`);
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
    const raw = parseFloat(values[k.id] ?? '');
    return { kpi: k, score: isNaN(raw) ? null as number | null : scoreKpi(k, raw), value: raw };
  });

  const scoredKpis = scores.filter(s => s.score !== null);
  const healthScore = scoredKpis.length
    ? Math.round(scoredKpis.reduce((sum, s) => sum + (s.score ?? 0), 0) / scoredKpis.length)
    : 0;

  /* bar chart data */
  const barData = scores.map(s => ({
    name: isAr ? s.kpi.labelAr : s.kpi.label,
    nameShort: (isAr ? s.kpi.labelAr : s.kpi.label).substring(0, 18) + ((isAr ? s.kpi.labelAr : s.kpi.label).length > 18 ? '…' : ''),
    yours: s.value || 0,
    target: s.kpi.targetValue,
    benchmark: s.kpi.benchmarkValue,
  }));

  return (
    <div className="space-y-6">
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
              <div className="space-y-0.5">{importLog.map((m, i) => <p key={i} className={i === 0 ? 'font-bold' : 'opacity-75'}>{m}</p>)}</div>
              <button onClick={() => setImportLog(null)} className="shrink-0 opacity-50 hover:opacity-100 font-bold">✕</button>
            </div>
          </div>
        )}
      </div>

      {/* Health score + inputs grid */}
      <div className="grid lg:grid-cols-[200px_1fr] gap-6 items-start">
        {/* Gauge panel */}
        <div className="bg-white border border-border rounded-2xl p-5 flex flex-col items-center gap-2 shadow-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">
            {isAr ? 'صحة مؤشرات الأداء' : 'KPI Health Score'}
          </p>
          <HealthGauge score={hasAnyValue ? healthScore : 0} />
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
          <div className="w-full mt-2 space-y-1">
            {[{ label: isAr ? 'ممتاز ≥80' : 'Strong ≥80', color: '#22c55e' }, { label: isAr ? 'متوسط ≥50' : 'Developing ≥50', color: '#f59e0b' }, { label: isAr ? 'ضعيف <50' : 'Weak <50', color: '#ef4444' }].map(b => (
              <div key={b.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: b.color }} />
                {b.label}
              </div>
            ))}
          </div>
        </div>

        {/* KPI input cards */}
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {scores.map(({ kpi, score, value }) => (
            <div key={kpi.id} className={`bg-white border rounded-xl p-4 shadow-sm ${score !== null ? scoreBg(score) : 'border-border'}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <label className="text-xs font-bold text-primary leading-snug flex-1" htmlFor={`kpi-${kpi.id}`}>
                  {isAr ? kpi.labelAr : kpi.label}
                </label>
                {score !== null && (
                  <span className="text-xs font-extrabold shrink-0 px-1.5 py-0.5 rounded-full" style={{ background: scoreColor(score) + '20', color: scoreColor(score) }}>
                    {score}%
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input id={`kpi-${kpi.id}`} type="number" step="any" min="0"
                  value={values[kpi.id] ?? ''}
                  onChange={e => handleChange(kpi.id, e.target.value)}
                  placeholder={isAr ? `المرجع: ${kpi.benchmarkLabel}` : `Benchmark: ${kpi.benchmarkLabel}`}
                  className="w-full text-sm border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                />
                <span className="text-xs text-muted-foreground shrink-0">{isAr ? kpi.unitAr : kpi.unit}</span>
              </div>
              {/* Mini speedometer gauge */}
              <div className="flex justify-center mt-1 mb-0.5">
                <MiniGauge score={score ?? 0} hasValue={score !== null} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span title={isAr ? 'المستهدف' : 'Target'}>
                  {isAr ? `هدف: ${kpi.targetLabelAr ?? kpi.targetLabel}` : `Target: ${kpi.targetLabel}`}
                </span>
                <span className="flex items-center gap-1">
                  {kpi.higherIsBetter ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-blue-500" />}
                  {kpi.higherIsBetter ? (isAr ? 'أعلى أفضل' : 'Higher better') : (isAr ? 'أقل أفضل' : 'Lower better')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bar chart — only when values exist */}
      {hasAnyValue && (
        <div
          className="bg-white border border-border rounded-2xl p-6 shadow-sm kpi-chart-wrap"
          style={{ WebkitPrintColorAdjust: 'exact' } as React.CSSProperties}
        >
          <p className="text-sm font-bold text-primary mb-4">
            {isAr ? 'مقارنة: قيمتك · المستهدف · المعيار الخليجي' : 'Comparison: Yours · Target · GCC Benchmark'}
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="nameShort" tick={{ fontSize: 10, fill: '#6b7280' }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} width={36} />
              <Tooltip formatter={(v: number, name: string) => [v, name === 'yours' ? (isAr ? 'قيمتك' : 'Yours') : name === 'target' ? (isAr ? 'الهدف' : 'Target') : (isAr ? 'المعيار الخليجي' : 'GCC Benchmark')]} />
              <Bar dataKey="yours" name="yours" radius={[4, 4, 0, 0]}>
                {barData.map((_, i) => <Cell key={i} fill={scoreColor(scores[i].score ?? 0)} />)}
              </Bar>
              <Bar dataKey="target" name="target" fill={GOLD} radius={[4, 4, 0, 0]} fillOpacity={0.7} />
              <Bar dataKey="benchmark" name="benchmark" fill="#cbd5e1" radius={[4, 4, 0, 0]} fillOpacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-5 mt-2 flex-wrap">
            {[{ color: '#22c55e', label: isAr ? 'قيمتك (ممتاز)' : 'Yours (strong)', }, { color: '#f59e0b', label: isAr ? 'قيمتك (متوسط)' : 'Yours (developing)' }, { color: GOLD, label: isAr ? 'الهدف' : 'Target' }, { color: '#cbd5e1', label: isAr ? 'المعيار الخليجي' : 'GCC Benchmark' }].map(l => (
              <div key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
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
