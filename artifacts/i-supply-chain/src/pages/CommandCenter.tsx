import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import { Link } from 'wouter';
import {
  Target, TrendingUp, ShieldAlert, Brain, ChevronRight, ChevronLeft, Check,
  AlertTriangle, Zap, BarChart2, DollarSign, Clock, Loader2,
  ArrowRight, ArrowLeft, Copy, CheckCircle2, Star, RefreshCw, Building2,
  MessageSquare, Languages, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_BASE = '/api';

// ─── KPI Configuration ────────────────────────────────────────────────────────
const KPI_CONFIG = [
  { id: 'otif',        label: 'OTIF',               unit: '%',    min: 50, max: 100, def: 76, median: 88,  topQ: 95,  norm: (v: number) => v,                                            higher: true  },
  { id: 'invTurns',   label: 'Inventory Turns',     unit: '×/yr', min: 1,  max: 20,  def: 5,  median: 57,  topQ: 100, norm: (v: number) => Math.min(100, (v / 14) * 100),                higher: true  },
  { id: 'procCycle',  label: 'Procurement Cycle',   unit: 'days', min: 3,  max: 60,  def: 28, median: 61,  topQ: 100, norm: (v: number) => Math.max(0, ((60 - v) / 53) * 100),           higher: false },
  { id: 'forecastAcc',label: 'Forecast Accuracy',   unit: '%',    min: 30, max: 99,  def: 63, median: 73,  topQ: 88,  norm: (v: number) => v,                                            higher: true  },
  { id: 'procCost',   label: 'Proc. Cost % Rev',    unit: '%rev', min: 3,  max: 25,  def: 14, median: 56,  topQ: 100, norm: (v: number) => Math.max(0, ((25 - v) / 20) * 100),           higher: false },
  { id: 'perfOrder',  label: 'Perfect Order Rate',  unit: '%',    min: 50, max: 100, def: 73, median: 87,  topQ: 96,  norm: (v: number) => v,                                            higher: true  },
];

const SAR_IMPACT_FACTOR: Record<string, number> = {
  otif: 0.0020, invTurns: 0.0018, procCycle: 0.0009, forecastAcc: 0.0025, procCost: 0.0045, perfOrder: 0.0012,
};

// ─── Savings Levers ───────────────────────────────────────────────────────────
const LEVERS = [
  { id: 'catMgmt',   label: 'Strategic Category Management',     labelAr: 'إدارة الفئات الاستراتيجية',            short: 'Category Mgmt',    shortAr: 'إدارة الفئات',  maxPct: 0.13, color: '#082C6B' },
  { id: 'suppCons',  label: 'Supplier Consolidation',            labelAr: 'توحيد الموردين',                        short: 'Supplier Consol.', shortAr: 'توحيد الموردين', maxPct: 0.09, color: '#0B3D91' },
  { id: 'procAuto',  label: 'Process & eProcurement Automation', labelAr: 'أتمتة العمليات والمشتريات الإلكترونية', short: 'Automation',       shortAr: 'الأتمتة',        maxPct: 0.05, color: '#C9A84C' },
  { id: 'invOpt',    label: 'Inventory Optimisation',            labelAr: 'تحسين المخزون',                         short: 'Inventory',        shortAr: 'المخزون',        maxPct: 0.07, color: '#1a5c2e' },
  { id: 'demand',    label: 'Demand Forecasting Improvement',    labelAr: 'تحسين التنبؤ بالطلب',                   short: 'Forecasting',      shortAr: 'التنبؤ',         maxPct: 0.04, color: '#7c3aed' },
];

// ─── Bilingual ───────────────────────────────────────────────────────────────
type Lang = 'en' | 'ar';

// ─── Industry Tree (12 industries with sub-sectors) ──────────────────────────
const INDUSTRY_TREE: Record<string, string[]> = {
  'Manufacturing':              ['Automotive & Assembly','Aerospace & Defense','Electronics & Semiconductors','FMCG Manufacturing','Heavy Industry & Steel','Chemicals & Petrochemicals','Plastics & Composites','Textiles & Apparel','Furniture & Wood Products','Medical Devices'],
  'Energy & Oil':               ['Oil & Gas Upstream','Oil & Gas Midstream / Pipelines','Oil & Gas Downstream / Refining','Petrochemicals','Renewable Energy (Solar/Wind)','Power Generation & Utilities','Mining & Extractives'],
  'Government / Public Sector': ['Federal / Central Government','Municipal Authorities','Defense & Security','Healthcare Authorities','Education Ministries','Infrastructure & Transport','Saudi Vision 2030 Entities (NDF, PIF)','Jordan Public Institutions','GCC Development Authorities'],
  'Pharmaceutical':             ['Branded Pharmaceuticals','Generic Pharmaceuticals','Medical Devices & Diagnostics','Biotechnology','Clinical Research Organizations','Healthcare Distribution','Veterinary Products'],
  'Retail & FMCG':              ['Grocery & Supermarkets','Fashion & Apparel','Electronics & Technology Retail','Home & Furniture','Health & Beauty','Foodservice & Restaurants','Wholesale & Distribution','Hypermarkets & Department Stores'],
  'Logistics & Transportation': ['3PL / 4PL Providers','Freight Forwarding','Warehousing & Distribution Centers','Last-Mile Delivery','Courier & Express','Cold Chain Logistics','Port & Customs Operations','Air Cargo','Road Haulage'],
  'Construction & EPC':         ['Residential Construction','Commercial & Office Construction','Infrastructure & Mega Projects','Oil & Gas EPC','Power & Utilities EPC','Industrial Facilities','Roads & Bridges','Smart Cities Development'],
  'Healthcare':                 ['Hospitals & Medical Centers','Diagnostics & Laboratories','Medical & Surgical Supplies','Home Healthcare','Specialist Clinics','Dental Chains','Ophthalmology Centers','Health Insurance'],
  'Technology & ICT':           ['Software & SaaS','Hardware & Electronics','Telecommunications','IT Services & Managed Services','Cloud & Data Centers','Cybersecurity','AI & Data Analytics','FinTech','EdTech'],
  'Food & Beverage':            ['Food Processing & Manufacturing','Dairy Products','Bakery & Confectionery','Beverages (Non-Alcoholic)','Halal Food Production','Agricultural Products & Trading','QSR & Fast Food Chains','Catering & Food Services'],
  'E-commerce':                 ['B2C E-Commerce Platform','B2B E-Commerce','Marketplace & Aggregators','D2C Brand','Cross-Border Trade','Social Commerce','Subscription Services'],
  'Services':                   ['Professional Services (Consulting, Legal, Audit)','Facilities Management (FM)','Hospitality & Tourism','Education & Training','Financial Services & Banking','Media & Entertainment','Real Estate & Property Management'],
};

// Arabic mirror of INDUSTRY_TREE — keys are the English industry names; values are
// [industryNameAr, subSectorsAr[]] aligned index-by-index with INDUSTRY_TREE sub-sectors.
const INDUSTRY_TREE_AR: Record<string, { name: string; subs: string[] }> = {
  'Manufacturing':              { name: 'التصنيع', subs: ['السيارات والتجميع','الطيران والدفاع','الإلكترونيات وأشباه الموصلات','تصنيع السلع الاستهلاكية سريعة التداول','الصناعات الثقيلة والصلب','الكيماويات والبتروكيماويات','البلاستيك والمواد المركبة','المنسوجات والملابس','الأثاث والمنتجات الخشبية','الأجهزة الطبية'] },
  'Energy & Oil':               { name: 'الطاقة والنفط', subs: ['النفط والغاز - الإنتاج','النفط والغاز - النقل وخطوط الأنابيب','النفط والغاز - التكرير','البتروكيماويات','الطاقة المتجددة (شمسية/رياح)','توليد الطاقة والمرافق','التعدين والصناعات الاستخراجية'] },
  'Government / Public Sector': { name: 'الحكومة / القطاع العام', subs: ['الحكومة الاتحادية / المركزية','الأمانات والبلديات','الدفاع والأمن','الهيئات الصحية','وزارات التعليم','البنية التحتية والنقل','كيانات رؤية السعودية 2030 (صندوق التنمية الوطني، صندوق الاستثمارات العامة)','المؤسسات العامة الأردنية','هيئات التنمية الخليجية'] },
  'Pharmaceutical':             { name: 'الصناعات الدوائية', subs: ['الأدوية ذات العلامات التجارية','الأدوية الجنيسة','الأجهزة الطبية والتشخيص','التقنية الحيوية','منظمات الأبحاث السريرية','توزيع الرعاية الصحية','المنتجات البيطرية'] },
  'Retail & FMCG':              { name: 'التجزئة والسلع الاستهلاكية', subs: ['البقالة والسوبرماركت','الأزياء والملابس','تجزئة الإلكترونيات والتقنية','المنزل والأثاث','الصحة والجمال','خدمات الطعام والمطاعم','الجملة والتوزيع','الهايبرماركت والمتاجر الكبرى'] },
  'Logistics & Transportation': { name: 'اللوجستيات والنقل', subs: ['مزودو الخدمات اللوجستية (3PL / 4PL)','الشحن والتخليص','المستودعات ومراكز التوزيع','توصيل الميل الأخير','البريد السريع','لوجستيات سلسلة التبريد','عمليات الموانئ والجمارك','الشحن الجوي','النقل البري'] },
  'Construction & EPC':         { name: 'الإنشاءات والمقاولات (EPC)', subs: ['الإنشاءات السكنية','الإنشاءات التجارية والمكتبية','البنية التحتية والمشاريع العملاقة','مقاولات النفط والغاز','مقاولات الطاقة والمرافق','المنشآت الصناعية','الطرق والجسور','تطوير المدن الذكية'] },
  'Healthcare':                 { name: 'الرعاية الصحية', subs: ['المستشفيات والمراكز الطبية','التشخيص والمختبرات','المستلزمات الطبية والجراحية','الرعاية الصحية المنزلية','العيادات التخصصية','سلاسل عيادات الأسنان','مراكز طب العيون','التأمين الصحي'] },
  'Technology & ICT':           { name: 'التقنية والاتصالات', subs: ['البرمجيات والحلول السحابية (SaaS)','الأجهزة والإلكترونيات','الاتصالات','خدمات تقنية المعلومات والخدمات المُدارة','السحابة ومراكز البيانات','الأمن السيبراني','الذكاء الاصطناعي وتحليل البيانات','التقنية المالية','تقنيات التعليم'] },
  'Food & Beverage':            { name: 'الأغذية والمشروبات', subs: ['تصنيع ومعالجة الأغذية','منتجات الألبان','المخبوزات والحلويات','المشروبات (غير الكحولية)','إنتاج الأغذية الحلال','المنتجات الزراعية والتجارة','سلاسل الوجبات السريعة','التموين وخدمات الطعام'] },
  'E-commerce':                 { name: 'التجارة الإلكترونية', subs: ['منصات التجارة الإلكترونية للمستهلك (B2C)','التجارة الإلكترونية بين الشركات (B2B)','الأسواق الإلكترونية والمجمّعات','العلامات التجارية المباشرة للمستهلك (D2C)','التجارة عبر الحدود','التجارة الاجتماعية','خدمات الاشتراكات'] },
  'Services':                   { name: 'الخدمات', subs: ['الخدمات المهنية (استشارات، قانونية، تدقيق)','إدارة المرافق','الضيافة والسياحة','التعليم والتدريب','الخدمات المالية والمصرفية','الإعلام والترفيه','العقارات وإدارة الممتلكات'] },
};

/** Display label for an industry (English key) in the given language */
function industryLabel(industry: string, ar: boolean): string {
  return ar ? (INDUSTRY_TREE_AR[industry]?.name ?? industry) : industry;
}

/** Display label for a sub-sector (English value) of an industry in the given language */
function subSectorLabel(industry: string, sub: string, ar: boolean): string {
  if (!ar) return sub;
  const idx = (INDUSTRY_TREE[industry] ?? []).indexOf(sub);
  return INDUSTRY_TREE_AR[industry]?.subs[idx] ?? sub;
}

const REVENUE_BANDS = ['< SAR 50M','SAR 50–200M','SAR 200M–1B','SAR 1–5B','> SAR 5B'];
const REVENUE_BANDS_AR = ['< 50 مليون ريال','50–200 مليون ريال','200 مليون–1 مليار ريال','1–5 مليار ريال','> 5 مليار ريال'];

// Arabic display maps for backend-returned English enum values
const RISK_LEVEL_AR: Record<string, string> = { Critical: 'حرج', High: 'عالٍ', Moderate: 'متوسط', Low: 'منخفض' };
const URGENCY_AR: Record<string, string> = { Immediate: 'فوري', '90-Day': 'خلال 90 يوماً', '6-Month': 'خلال 6 أشهر' };
const EFFORT_AR: Record<string, string> = { Low: 'منخفض', Medium: 'متوسط', High: 'عالٍ' };

const PAIN_POINTS = [
  // Cost & Efficiency
  'High procurement costs / maverick spend',
  'Low cost savings achievement vs targets',
  'High total cost of ownership (TCO)',
  // Cycle & Speed
  'Long procurement cycle times',
  'Slow supplier onboarding process',
  'Delayed deliveries / OTIF failures',
  // Supplier Management
  'Poor supplier performance & visibility',
  'Single-source dependencies / supply concentration',
  'No formal supplier segmentation or SRM program',
  'Weak supplier development & collaboration',
  // Inventory & Demand
  'Excess inventory / frequent stockouts',
  'Low inventory turns / high holding costs',
  'Poor demand forecasting accuracy',
  'No S&OP / IBP process',
  // Contract & Governance
  'Weak contract management & compliance',
  'Non-compliance with procurement policy',
  'Weak delegation of authority (DoA) framework',
  'No contract lifecycle management (CLM) system',
  // Digital & Process
  'Manual & paper-based processes',
  'Lack of spend visibility & analytics',
  'No integrated ERP or e-procurement system',
  'Fragmented data across departments',
  // Risk & Compliance
  'High supply chain disruption risk',
  'Weak business continuity planning (BCP)',
  'Regulatory / compliance gaps (GTPL, Vision 2030)',
  'Sole-source & geopolitical supply risk',
  // ESG & Localisation
  'ESG / sustainability compliance pressure',
  'IKTVA / local content compliance (Saudi Arabia)',
  'Vendor ESG risk & ethical sourcing gaps',
];

// ─── Maturity Domains: 8 × 5 sub-dimensions ──────────────────────────────────
const MATURITY_DOMAINS_EX = [
  {
    id: 'strategy',
    label: 'Strategy & Governance',
    labelAr: 'الاستراتيجية والحوكمة',
    icon: '🎯',
    subs: [
      { id: 'alignment',   label: 'Strategic Alignment & Vision',          labelAr: 'التوافق الاستراتيجي والرؤية' },
      { id: 'policy',      label: 'Procurement Policy & Delegation (DoA)',  labelAr: 'سياسة المشتريات وجدول التفويض' },
      { id: 'structure',   label: 'Leadership & Organisational Structure',  labelAr: 'القيادة والهيكل التنظيمي' },
      { id: 'kpi',         label: 'Performance Management & KPIs',          labelAr: 'إدارة الأداء ومؤشرات القياس' },
      { id: 'stakeholder', label: 'Stakeholder Engagement & Reporting',     labelAr: 'إشراك أصحاب المصلحة والتقارير' },
    ],
  },
  {
    id: 'procurement',
    label: 'Procurement & Sourcing',
    labelAr: 'المشتريات والتوريد',
    icon: '🛒',
    subs: [
      { id: 'category',   label: 'Category Management',                   labelAr: 'إدارة الفئات' },
      { id: 'sourcing',   label: 'Sourcing Strategy & Tendering',          labelAr: 'استراتيجية التوريد والمناقصات' },
      { id: 'onboarding', label: 'Supplier Selection & Onboarding',        labelAr: 'اختيار الموردين والتأهيل' },
      { id: 'eprocure',   label: 'eProcurement & Digital Tools',           labelAr: 'المشتريات الإلكترونية والأدوات الرقمية' },
      { id: 'spend',      label: 'Spend Analytics & Visibility',           labelAr: 'تحليلات الإنفاق والرؤية' },
    ],
  },
  {
    id: 'clm',
    label: 'Contract Management (CLM)',
    labelAr: 'إدارة العقود',
    icon: '📄',
    subs: [
      { id: 'development',  label: 'Contract Development & Standardisation', labelAr: 'تطوير العقود والتوحيس القياسي' },
      { id: 'compliance',   label: 'Contract Compliance & Monitoring',       labelAr: 'الامتثال التعاقدي والمتابعة' },
      { id: 'clmSystem',    label: 'CLM System & Automation',               labelAr: 'نظام إدارة دورة حياة العقود' },
      { id: 'risk',         label: 'Risk & Liability Management',            labelAr: 'إدارة المخاطر والمسؤولية التعاقدية' },
      { id: 'renewals',     label: 'Renewals, Lessons Learned & Closeout',  labelAr: 'التجديد والدروس المستفادة والإغلاق' },
    ],
  },
  {
    id: 'srm',
    label: 'Supplier Relationship (SRM)',
    labelAr: 'إدارة علاقات الموردين',
    icon: '🤝',
    subs: [
      { id: 'segmentation', label: 'Supplier Segmentation & Classification', labelAr: 'تصنيف وتقسيم الموردين' },
      { id: 'performance',  label: 'Supplier Performance Measurement',       labelAr: 'قياس أداء الموردين' },
      { id: 'development',  label: 'Supplier Development & Collaboration',   labelAr: 'تطوير الموردين والتعاون' },
      { id: 'srmRisk',      label: 'Supplier Risk Management',               labelAr: 'إدارة مخاطر الموردين' },
      { id: 'local',        label: 'Local Content & SME Supplier Pipeline',  labelAr: 'المحتوى المحلي وخط أنابيب الموردين الصغيرين' },
    ],
  },
  {
    id: 'operations',
    label: 'Operations & Logistics',
    labelAr: 'العمليات واللوجستيات',
    icon: '⚙️',
    subs: [
      { id: 'demand',    label: 'Demand Planning & Forecasting',           labelAr: 'تخطيط الطلب والتنبؤ' },
      { id: 'inventory', label: 'Inventory Management',                    labelAr: 'إدارة المخزون' },
      { id: 'warehouse', label: 'Warehousing & Distribution',              labelAr: 'التخزين والتوزيع' },
      { id: 'transport', label: 'Transport & Last-Mile Delivery',          labelAr: 'النقل وتوصيل الميل الأخير' },
      { id: 'sop',       label: 'S&OP / IBP Process Maturity',            labelAr: 'نضج عملية S&OP / IBP' },
    ],
  },
  {
    id: 'risk',
    label: 'Risk & Business Continuity',
    labelAr: 'المخاطر واستمرارية الأعمال',
    icon: '🛡️',
    subs: [
      { id: 'identify',   label: 'Risk Identification & Assessment',       labelAr: 'تحديد المخاطر وتقييمها' },
      { id: 'resilience', label: 'Supply Chain Resilience',                labelAr: 'مرونة سلسلة التوريد' },
      { id: 'bcp',        label: 'Business Continuity Planning (BCP)',     labelAr: 'تخطيط استمرارية الأعمال' },
      { id: 'regulatory', label: 'Regulatory & Compliance Risk',           labelAr: 'المخاطر التنظيمية والامتثال' },
      { id: 'crisis',     label: 'Crisis Response & Recovery',             labelAr: 'الاستجابة للأزمات والتعافي' },
    ],
  },
  {
    id: 'digital',
    label: 'Data & Digital Maturity',
    labelAr: 'البيانات والنضج الرقمي',
    icon: '💡',
    subs: [
      { id: 'erp',       label: 'ERP & Systems Integration',              labelAr: 'تكامل نظام ERP والأنظمة' },
      { id: 'data',      label: 'Data Quality & Governance',              labelAr: 'جودة البيانات وحوكمتها' },
      { id: 'analytics', label: 'Analytics & Reporting Capability',       labelAr: 'قدرات التحليل والتقارير' },
      { id: 'tools',     label: 'Digital Procurement Tools',              labelAr: 'أدوات المشتريات الرقمية' },
      { id: 'ai',        label: 'AI & Automation Adoption',               labelAr: 'تبني الذكاء الاصطناعي والأتمتة' },
    ],
  },
  {
    id: 'esg',
    label: 'Sustainability & ESG',
    labelAr: 'الاستدامة والحوكمة البيئية والاجتماعية',
    icon: '🌱',
    subs: [
      { id: 'enviro',   label: 'Environmental Impact Management',         labelAr: 'إدارة الأثر البيئي' },
      { id: 'ethical',  label: 'Ethical Sourcing & Labour Standards',     labelAr: 'الشراء الأخلاقي ومعايير العمل' },
      { id: 'iktva',    label: 'Local Content & IKTVA Compliance',        labelAr: 'المحتوى المحلي والامتثال لـ IKTVA' },
      { id: 'report',   label: 'ESG Reporting & Disclosure',              labelAr: 'تقارير ومتطلبات الإفصاح ESG' },
      { id: 'circular', label: 'Circular Economy & Waste Reduction',      labelAr: 'الاقتصاد الدائري وخفض النفايات' },
    ],
  },
] as const;

type MaturityDomainId = typeof MATURITY_DOMAINS_EX[number]['id'];

/** Flatten all 40 sub-dimension keys (domainId__subId) */
function allSubKeys(): string[] {
  return MATURITY_DOMAINS_EX.flatMap(d => d.subs.map(s => `${d.id}__${s.id}`));
}

/** Compute per-domain average from flat sub-ratings */
function domainAverages(ratings: Record<string, number>): Record<string, number> {
  return Object.fromEntries(
    MATURITY_DOMAINS_EX.map(d => {
      const vals = d.subs.map(s => ratings[`${d.id}__${s.id}`] ?? 2);
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      return [d.label, Math.round(avg * 10) / 10];
    })
  );
}

const MATURITY_DOMAINS_AR = [
  'الاستراتيجية والحوكمة',
  'المشتريات والتوريد',
  'إدارة العقود (CLM)',
  'إدارة علاقات الموردين (SRM)',
  'العمليات واللوجستيات',
  'المخاطر واستمرارية الأعمال',
  'نضج البيانات والرقمنة',
  'الاستدامة والحوكمة البيئية',
];

const KPI_DOMAINS = [
  'Cost Savings Achieved vs Target',
  'Supplier On-Time & In-Full (OTIF)',
  'Procurement Cycle Time',
  'Demand Forecast Accuracy',
  'Contract Compliance Rate',
  'Inventory Turnover Rate',
  'Supplier Performance Score',
];

const KPI_DOMAINS_AR = [
  'الوفورات المحققة مقابل الهدف',
  'التوريد في الوقت وبالكمية (OTIF)',
  'دورة المشتريات',
  'دقة التنبؤ بالطلب',
  'معدل الامتثال التعاقدي',
  'معدل دوران المخزون',
  'مؤشر أداء الموردين',
];

const PAIN_POINTS_AR = [
  // تكلفة وكفاءة
  'ارتفاع تكاليف المشتريات / الإنفاق غير المنضبط',
  'ضعف تحقيق وفورات التكلفة مقارنة بالأهداف',
  'ارتفاع التكلفة الإجمالية للملكية (TCO)',
  // دورة وسرعة
  'طول دورات المشتريات',
  'بطء عملية استقبال الموردين الجدد',
  'تأخر التسليمات / إخفاقات OTIF',
  // إدارة الموردين
  'ضعف أداء الموردين والرؤية',
  'الاعتماد على مصدر فردي / تركز التوريد',
  'غياب تصنيف الموردين أو برنامج SRM رسمي',
  'ضعف تطوير الموردين والتعاون معهم',
  // المخزون والطلب
  'فائض المخزون / نفاد المخزون المتكرر',
  'انخفاض معدل دوران المخزون / ارتفاع تكاليف الاحتفاظ',
  'ضعف دقة التنبؤ بالطلب',
  'غياب عملية S&OP / IBP',
  // العقود والحوكمة
  'ضعف إدارة العقود والامتثال',
  'عدم الامتثال لسياسة المشتريات',
  'ضعف إطار تفويض الصلاحيات (DoA)',
  'غياب نظام إدارة دورة حياة العقود (CLM)',
  // رقمنة وعمليات
  'العمليات اليدوية والورقية',
  'غياب الرؤية التحليلية للإنفاق',
  'غياب نظام ERP أو مشتريات إلكترونية متكامل',
  'تشتت البيانات عبر الأقسام',
  // مخاطر وامتثال
  'ارتفاع مخاطر اضطراب سلسلة الإمداد',
  'ضعف تخطيط استمرارية الأعمال (BCP)',
  'ثغرات تنظيمية (نظام المنافسات، رؤية 2030)',
  'مخاطر التوريد الجيوسياسية والمصدر الفردي',
  // ESG والتوطين
  'ضغوط امتثال الاستدامة والحوكمة (ESG)',
  'امتثال المحتوى المحلي IKTVA (المملكة العربية السعودية)',
  'مخاطر ESG للموردين وثغرات الشراء الأخلاقي',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatSAR(v: number) {
  if (v >= 1_000_000) return `SAR ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `SAR ${Math.round(v / 1_000)}K`;
  return `SAR ${Math.round(v)}`;
}

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function gaugeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const s = polarToXY(cx, cy, r, startDeg);
  const e = polarToXY(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x.toFixed(1)} ${s.y.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(1)} ${e.y.toFixed(1)}`;
}

function riskColor(score: number) {
  if (score < 30) return '#10b981';
  if (score < 55) return '#f59e0b';
  if (score < 75) return '#f97316';
  return '#ef4444';
}

function riskLabel(score: number) {
  if (score < 30) return 'LOW';
  if (score < 55) return 'MODERATE';
  if (score < 75) return 'HIGH';
  return 'CRITICAL';
}

// ─── Gauge SVG ────────────────────────────────────────────────────────────────
function RiskGauge({ score }: { score: number }) {
  const cx = 110, cy = 100, r = 72, sw = 14;
  const startDeg = 135, totalDeg = 270;
  const fillDeg = startDeg + (totalDeg * score) / 100;
  const endDeg = startDeg + totalDeg;
  const color = riskColor(score);
  return (
    <svg viewBox="0 0 220 130" className="w-full max-w-xs mx-auto">
      <path d={gaugeArc(cx, cy, r, startDeg, endDeg)} fill="none" stroke="#E5E7EB" strokeWidth={sw} strokeLinecap="round" />
      <motion.path
        d={gaugeArc(cx, cy, r, startDeg, fillDeg)}
        fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: 'easeOut' }}
      />
      <text x={cx} y={cy - 4} textAnchor="middle" className="font-bold" style={{ fontSize: 28, fontWeight: 700, fill: color }}>{score}</text>
      <text x={cx} y={cy + 16} textAnchor="middle" style={{ fontSize: 11, fill: '#6B7280' }}>/ 100</text>
      <text x={cx} y={cy + 32} textAnchor="middle" style={{ fontSize: 12, fontWeight: 700, fill: color, letterSpacing: 1 }}>{riskLabel(score)}</text>
    </svg>
  );
}

// ─── Industry-Specific KPI Profiles ──────────────────────────────────────────
type KPIDef = {
  id: string; label: string; labelAr: string; unit: string;
  min: number; max: number; def: number;
  gcMedian: number; gcTopQ: number;        // normalized 0-100
  gcMedianRaw: string; gcTopQRaw: string;  // display strings
  norm: (v: number) => number;             // raw → 0-100, higher = better
  impactPct: number;                       // % revenue impact per 100 normalized pts
  howToClose: string; howToCloseAr: string;
};

const INDUSTRY_KPIS: Record<string, KPIDef[]> = {
  'Manufacturing': [
    { id:'otif',         label:'OTIF %',                  labelAr:'نسبة OTIF',                   unit:'%',    min:50,max:100,def:76, gcMedian:85,gcTopQ:95, gcMedianRaw:'85%',    gcTopQRaw:'95%',    norm:v=>v,                            impactPct:0.20, howToClose:'Implement VMI/Kanban with top-10 suppliers; set contractual OTIF KPIs with penalty clauses (CIPS Level 4).', howToCloseAr:'طبّق نموذج VMI/Kanban مع أفضل 10 موردين بمؤشرات أداء تعاقدية (CIPS المستوى 4).' },
    { id:'invTurns',     label:'Inventory Turns',          labelAr:'معدل دوران المخزون',           unit:'×/yr',min:1, max:25, def:5,  gcMedian:60,gcTopQ:88, gcMedianRaw:'8×',     gcTopQRaw:'14×',    norm:v=>Math.min(100,(v/20)*100),     impactPct:0.15, howToClose:'Introduce demand-driven MRP with 12-week rolling forecast; reduce safety stock using statistical models (APICS CPIM).', howToCloseAr:'طبّق MRP بتحفيز الطلب وقلّص مخزون الأمان بالنماذج الإحصائية.' },
    { id:'procCycle',    label:'Procurement Cycle Time',   labelAr:'دورة المشتريات',               unit:'days',min:3, max:90, def:28, gcMedian:70,gcTopQ:92, gcMedianRaw:'18d',    gcTopQRaw:'8d',     norm:v=>Math.max(0,((90-v)/82)*100),  impactPct:0.08, howToClose:'Deploy e-procurement with pre-approved vendor panels and dynamic purchasing (CIPS eSourcing).', howToCloseAr:'طبّق المشتريات الإلكترونية مع قوائم الموردين المعتمدين.' },
    { id:'forecastAcc',  label:'Forecast Accuracy',        labelAr:'دقة التنبؤ بالطلب',            unit:'%',   min:30,max:99, def:63, gcMedian:72,gcTopQ:88, gcMedianRaw:'72%',    gcTopQRaw:'88%',    norm:v=>v,                            impactPct:0.20, howToClose:'Implement collaborative S&OP with AI/ML demand sensing (APICS IBF).', howToCloseAr:'طبّق S&OP التعاوني مع استشعار الطلب بالذكاء الاصطناعي.' },
    { id:'procCost',     label:'Procurement Cost % Rev',   labelAr:'تكلفة المشتريات %',            unit:'%rev',min:3, max:30, def:15, gcMedian:60,gcTopQ:88, gcMedianRaw:'12% rev',gcTopQRaw:'8% rev', norm:v=>Math.max(0,((30-v)/27)*100),  impactPct:0.40, howToClose:'Launch strategic category management; negotiate multi-year framework agreements.', howToCloseAr:'أطلق إدارة الفئات الاستراتيجية وتفاوض على اتفاقيات إطارية.' },
    { id:'perfOrder',    label:'Perfect Order Rate',       labelAr:'معدل الطلب المثالي',           unit:'%',   min:50,max:100,def:73, gcMedian:85,gcTopQ:96, gcMedianRaw:'85%',    gcTopQRaw:'96%',    norm:v=>v,                            impactPct:0.12, howToClose:'Implement E2E order management with quality checkpoints at each SCOR Deliver milestone.', howToCloseAr:'طبّق إدارة الطلبيات الشاملة مع نقاط تفتيش SCOR Deliver.' },
    { id:'wasteRate',    label:'Waste / Scrap Rate',       labelAr:'معدل الهدر والنفايات',         unit:'%',   min:0, max:15, def:5.8,gcMedian:65,gcTopQ:90, gcMedianRaw:'3.5%',   gcTopQRaw:'1.2%',   norm:v=>Math.max(0,((15-v)/15)*100),  impactPct:0.30, howToClose:'Deploy Lean Six Sigma DMAIC: value stream mapping, waste identification, kaizen events.', howToCloseAr:'طبّق Lean Six Sigma DMAIC: خرطشة القيمة وجلسات Kaizen.' },
  ],
  'Energy & Oil': [
    { id:'matAvail',     label:'Material/Spares Availability',labelAr:'توافر المواد وقطع الغيار', unit:'%',   min:50,max:100,def:74, gcMedian:82,gcTopQ:95, gcMedianRaw:'82%',    gcTopQRaw:'95%',    norm:v=>v,                            impactPct:0.30, howToClose:'Implement critical spare parts ABCD analysis with min/max stock levels at site.', howToCloseAr:'طبّق تصنيف قطع الغيار الحرجة (ABCD) مع مستويات الحد الأدنى في الموقع.' },
    { id:'downtime',     label:'Unplanned Downtime %',     labelAr:'التوقف غير المخطط',            unit:'%',   min:0, max:20, def:7.8,gcMedian:68,gcTopQ:92, gcMedianRaw:'4.5%',   gcTopQRaw:'1.2%',   norm:v=>Math.max(0,((20-v)/20)*100),  impactPct:0.50, howToClose:'Deploy reliability-centred maintenance (RCM) with predictive sensors; reduce MTTR by 40%.', howToCloseAr:'طبّق الصيانة المتمحورة حول الموثوقية (RCM) مع أجهزة استشعار تنبؤية.' },
    { id:'procCycle',    label:'Procurement Cycle Time',   labelAr:'دورة المشتريات',               unit:'days',min:5, max:120,def:42, gcMedian:65,gcTopQ:90, gcMedianRaw:'28d',    gcTopQRaw:'12d',    norm:v=>Math.max(0,((120-v)/115)*100),impactPct:0.08, howToClose:'Pre-qualify and pre-price critical materials; deploy blanket purchase orders with call-off.', howToCloseAr:'أهّل وسعّر المواد الحرجة مسبقاً؛ أصدر أوامر شراء إطارية.' },
    { id:'supplierComp', label:'Supplier Compliance Rate', labelAr:'امتثال الموردين',              unit:'%',   min:40,max:100,def:70, gcMedian:80,gcTopQ:95, gcMedianRaw:'80%',    gcTopQRaw:'95%',    norm:v=>v,                            impactPct:0.20, howToClose:'Implement supplier development programme (SDP) with quarterly KPI reviews; CIPS SRM Level 4.', howToCloseAr:'طبّق برنامج تطوير الموردين مع مراجعات ربع سنوية (CIPS SRM المستوى 4).' },
    { id:'iktva',        label:'IKTVA Local Content %',    labelAr:'نسبة المحتوى المحلي IKTVA',   unit:'%',   min:0, max:100,def:28, gcMedian:40,gcTopQ:62, gcMedianRaw:'40%',    gcTopQRaw:'62%',    norm:v=>v,                            impactPct:0.10, howToClose:'Map sourcing categories against IKTVA scorecard; develop SME local supplier pipeline.', howToCloseAr:'خرطشة فئات التوريد مقابل بطاقة IKTVA؛ طوّر خط أنابيب موردين محليين.' },
    { id:'contractComp', label:'Contract Compliance Rate', labelAr:'الامتثال التعاقدي',            unit:'%',   min:40,max:100,def:72, gcMedian:82,gcTopQ:97, gcMedianRaw:'82%',    gcTopQRaw:'97%',    norm:v=>v,                            impactPct:0.18, howToClose:'Deploy CLM system with automated milestone alerts and deviation management workflow.', howToCloseAr:'طبّق نظام CLM مع تنبيهات آلية للمعالم وسير عمل الانحرافات.' },
  ],
  'Government / Public Sector': [
    { id:'contractComp', label:'Contract Compliance Rate', labelAr:'الامتثال التعاقدي',            unit:'%',   min:30,max:100,def:60, gcMedian:72,gcTopQ:94, gcMedianRaw:'72%',    gcTopQRaw:'94%',    norm:v=>v,                            impactPct:0.25, howToClose:'Implement CLM with GTPL-aligned workflow; train staff to CIPS Level 4 contract management.', howToCloseAr:'طبّق CLM بسير عمل متوافق مع نظام المنافسات؛ درّب الموظفين على CIPS المستوى 4.' },
    { id:'procCycle',    label:'Procurement Cycle Time',   labelAr:'دورة المشتريات',               unit:'days',min:10,max:180,def:65, gcMedian:58,gcTopQ:84, gcMedianRaw:'45d',    gcTopQRaw:'22d',    norm:v=>Math.max(0,((180-v)/170)*100),impactPct:0.06, howToClose:'Pre-approve framework agreements for repeat purchases; deploy e-procurement per GTPL Chapter 5.', howToCloseAr:'أقرّ اتفاقيات إطارية للمشتريات المتكررة؛ طبّق المشتريات الإلكترونية وفق نظام المنافسات.' },
    { id:'poaAdherence', label:'Policy / DoA Adherence',  labelAr:'الالتزام بجدول التفويض',       unit:'%',   min:30,max:100,def:65, gcMedian:78,gcTopQ:96, gcMedianRaw:'78%',    gcTopQRaw:'96%',    norm:v=>v,                            impactPct:0.20, howToClose:'Publish clear DoA matrix; automate approvals in ERP with policy guards (CIPS Governance).', howToCloseAr:'انشر مصفوفة تفويض واضحة؛ أتمتة الاعتمادات في نظام ERP.' },
    { id:'suppPerf',     label:'Supplier Performance Score',labelAr:'أداء الموردين',              unit:'/100',min:0, max:100,def:55, gcMedian:68,gcTopQ:88, gcMedianRaw:'68/100',  gcTopQRaw:'88/100', norm:v=>v,                            impactPct:0.18, howToClose:'Implement KPI-based SRM programme; conduct bi-annual supplier reviews with corrective plans.', howToCloseAr:'طبّق برنامج SRM قائم على المؤشرات ومراجعات أداء نصف سنوية.' },
    { id:'localContent', label:'Local Content / IKTVA %', labelAr:'المحتوى المحلي',               unit:'%',   min:0, max:100,def:22, gcMedian:32,gcTopQ:55, gcMedianRaw:'32%',    gcTopQRaw:'55%',    norm:v=>v,                            impactPct:0.10, howToClose:'Map spend categories to Nitaqat/IKTVA; shift non-critical commodities to SME local suppliers.', howToCloseAr:'خرطشة فئات الإنفاق مع بطاقة نطاقات/IKTVA؛ وجّه الاستهلاك نحو الموردين المحليين.' },
    { id:'savings',      label:'Budget Savings Achieved',  labelAr:'الوفورات المحققة',             unit:'%',   min:0, max:20, def:4,  gcMedian:40,gcTopQ:75, gcMedianRaw:'7%',     gcTopQRaw:'14%',    norm:v=>Math.min(100,(v/20)*100),     impactPct:0.50, howToClose:'Launch strategic category management; negotiate multi-year framework agreements with re-tendering.', howToCloseAr:'أطلق إدارة الفئات وتفاوض على اتفاقيات إطارية متعددة السنوات.' },
    { id:'auditComp',    label:'Audit Compliance Rate',    labelAr:'الامتثال للتدقيق',             unit:'%',   min:30,max:100,def:62, gcMedian:75,gcTopQ:95, gcMedianRaw:'75%',    gcTopQRaw:'95%',    norm:v=>v,                            impactPct:0.15, howToClose:'Implement continuous compliance monitoring dashboard; schedule quarterly procurement audits (GTPL Article 65).', howToCloseAr:'طبّق لوحة متابعة الامتثال وجدوِّل تدقيقات مشتريات ربع سنوية.' },
  ],
  'Pharmaceutical': [
    { id:'supplyContinu',label:'Supply Continuity Rate',   labelAr:'معدل استمرارية التوريد',       unit:'%',   min:50,max:100,def:88, gcMedian:95,gcTopQ:99, gcMedianRaw:'95%',    gcTopQRaw:'99.5%',  norm:v=>v,                            impactPct:0.40, howToClose:'Dual-source all critical APIs; maintain 12-week strategic reserve for top-20 essential medicines.', howToCloseAr:'استخدم مزودين بديلين للمكونات الفعّالة؛ احتفظ باحتياطي 12 أسبوعاً.' },
    { id:'regComp',      label:'GMP/Regulatory Compliance',labelAr:'الامتثال التنظيمي GMP',       unit:'%',   min:50,max:100,def:79, gcMedian:88,gcTopQ:99, gcMedianRaw:'88%',    gcTopQRaw:'99%',    norm:v=>v,                            impactPct:0.50, howToClose:'Implement QMS aligned to ICH Q10; automate batch record management and CAPA tracking.', howToCloseAr:'طبّق نظام إدارة الجودة ICH Q10؛ أتمتة سجلات الدفعات وتتبع الإجراءات التصحيحية.' },
    { id:'invTurns',     label:'Inventory Turns',          labelAr:'معدل دوران المخزون',           unit:'×/yr',min:1, max:20, def:3.5,gcMedian:40,gcTopQ:70, gcMedianRaw:'5×',     gcTopQRaw:'9×',     norm:v=>Math.min(100,(v/18)*100),     impactPct:0.20, howToClose:'Implement demand-driven replenishment with 26-week rolling forecasts; reduce expired inventory.', howToCloseAr:'طبّق التجديد بتحفيز الطلب مع توقع 26 أسبوعاً؛ قلّص المخزون منتهي الصلاحية.' },
    { id:'procCycle',    label:'Procurement Cycle Time',   labelAr:'دورة المشتريات',               unit:'days',min:5, max:90, def:38, gcMedian:60,gcTopQ:85, gcMedianRaw:'25d',    gcTopQRaw:'12d',    norm:v=>Math.max(0,((90-v)/85)*100),  impactPct:0.10, howToClose:'Pre-qualify and pre-price approved suppliers; deploy e-auction for commodity APIs.', howToCloseAr:'أهّل وسعّر الموردين المعتمدين مسبقاً؛ طبّق المزادات الإلكترونية.' },
    { id:'suppQuality',  label:'Supplier Quality Score',   labelAr:'مؤشر جودة الموردين',          unit:'/100',min:0, max:100,def:70, gcMedian:82,gcTopQ:97, gcMedianRaw:'82/100',  gcTopQRaw:'97/100', norm:v=>v,                            impactPct:0.30, howToClose:'Implement supplier qualification programme (SQP) with GMP audit checklist; require CoA per batch.', howToCloseAr:'طبّق برنامج تأهيل الموردين مع قائمة تدقيق GMP وشهادة التحليل لكل دفعة.' },
    { id:'coldChain',    label:'Cold Chain Compliance',    labelAr:'الامتثال للسلسلة الباردة',     unit:'%',   min:50,max:100,def:83, gcMedian:90,gcTopQ:99, gcMedianRaw:'90%',    gcTopQRaw:'99.5%',  norm:v=>v,                            impactPct:0.40, howToClose:'Deploy IoT temperature monitoring with automated alerts; qualify carriers to GDP standards.', howToCloseAr:'طبّق مراقبة IoT للحرارة مع تنبيهات آلية؛ أهّل الناقلين بمعايير GDP.' },
  ],
  'Retail & FMCG': [
    { id:'otif',         label:'OTIF %',                   labelAr:'نسبة OTIF',                   unit:'%',   min:50,max:100,def:80, gcMedian:87,gcTopQ:96, gcMedianRaw:'87%',    gcTopQRaw:'96%',    norm:v=>v,                            impactPct:0.20, howToClose:'Implement EDI with top-20 suppliers; enforce 48-hour advance shipping notices with automated OTIF reporting.', howToCloseAr:'طبّق EDI مع أفضل 20 مورد وإشعارات الشحن المسبقة مع تقارير OTIF.' },
    { id:'invTurns',     label:'Inventory Turns',          labelAr:'معدل دوران المخزون',           unit:'×/yr',min:3, max:40, def:9,  gcMedian:52,gcTopQ:82, gcMedianRaw:'14×',    gcTopQRaw:'24×',    norm:v=>Math.min(100,(v/36)*100),     impactPct:0.20, howToClose:'Switch to demand-driven replenishment (CPFR); reduce assortment complexity 20% using Pareto.', howToCloseAr:'انتقل إلى التجديد بتحفيز الطلب (CPFR)؛ قلّص تعقيد التشكيلة 20%.' },
    { id:'fillRate',     label:'Fill Rate %',              labelAr:'معدل الاستيفاء',               unit:'%',   min:50,max:100,def:78, gcMedian:86,gcTopQ:97, gcMedianRaw:'86%',    gcTopQRaw:'97%',    norm:v=>v,                            impactPct:0.25, howToClose:'Implement min/max reorder points with automatic PO generation; improve demand forecast accuracy.', howToCloseAr:'طبّق نقاط إعادة الطلب التلقائية وحسّن دقة التنبؤ بالطلب.' },
    { id:'daysSupply',   label:'Days of Supply',           labelAr:'أيام التوريد',                 unit:'days',min:5, max:90, def:35, gcMedian:60,gcTopQ:85, gcMedianRaw:'24d',    gcTopQRaw:'12d',    norm:v=>Math.max(0,((90-v)/85)*100),  impactPct:0.15, howToClose:'Align safety stock to statistical demand variability; implement seasonal buffer stock planning.', howToCloseAr:'اضبط مخزون الأمان مع تقلب الطلب الإحصائي؛ طبّق التخطيط الموسمي.' },
    { id:'shrinkage',    label:'Shrinkage / Waste Rate',   labelAr:'معدل الاختلاس والهدر',         unit:'%',   min:0, max:15, def:4.5,gcMedian:65,gcTopQ:90, gcMedianRaw:'2.8%',   gcTopQRaw:'0.9%',   norm:v=>Math.max(0,((15-v)/15)*100),  impactPct:0.40, howToClose:'Deploy RFID inventory tracking; implement cycle counting programme; strengthen receiving controls.', howToCloseAr:'طبّق تتبع RFID للمخزون؛ نفّذ برنامج الجرد الدوري وعزّز ضوابط الاستقبال.' },
    { id:'forecastAcc',  label:'Forecast Accuracy',        labelAr:'دقة التنبؤ',                   unit:'%',   min:30,max:99, def:65, gcMedian:76,gcTopQ:91, gcMedianRaw:'76%',    gcTopQRaw:'91%',    norm:v=>v,                            impactPct:0.20, howToClose:'Implement statistical forecasting (ARIMA/ML) with promotional lift factors; run monthly S&OP.', howToCloseAr:'طبّق التنبؤ الإحصائي مع عوامل العروض الترويجية ومراجعة S&OP شهرية.' },
  ],
  'Logistics & Transportation': [
    { id:'otif',         label:'OTIF %',                   labelAr:'نسبة OTIF',                   unit:'%',   min:50,max:100,def:83, gcMedian:90,gcTopQ:98, gcMedianRaw:'90%',    gcTopQRaw:'98%',    norm:v=>v,                            impactPct:0.30, howToClose:'Implement real-time GPS tracking with automated ETA updates; enforce carrier KPIs with bonuses.', howToCloseAr:'طبّق تتبع GPS مع تحديثات ETA آلية ومؤشرات أداء الناقلين.' },
    { id:'orderAccuracy',label:'Order Accuracy Rate',      labelAr:'معدل دقة الطلبيات',            unit:'%',   min:80,max:100,def:94, gcMedian:97,gcTopQ:99, gcMedianRaw:'97%',    gcTopQRaw:'99.8%',  norm:v=>v,                            impactPct:0.20, howToClose:'Deploy barcode/RFID scanning at all pick/pack stations; implement WMS.', howToCloseAr:'طبّق مسح الباركود/RFID في محطات الالتقاط والتعبئة؛ نفّذ نظام WMS.' },
    { id:'whUtil',       label:'Warehouse Utilization',    labelAr:'استغلال المستودع',              unit:'%',   min:20,max:100,def:65, gcMedian:74,gcTopQ:89, gcMedianRaw:'74%',    gcTopQRaw:'89%',    norm:v=>v,                            impactPct:0.20, howToClose:'Re-slot warehouse using ABC velocity analysis; implement dynamic slotting algorithms.', howToCloseAr:'أعد تخصيص المستودع باستخدام تحليل ABC وخوارزميات التخصيص الديناميكي.' },
    { id:'damageRate',   label:'Damage / Loss Rate',       labelAr:'معدل التلف والفقدان',           unit:'%',   min:0, max:5,  def:1.2,gcMedian:68,gcTopQ:94, gcMedianRaw:'0.6%',   gcTopQRaw:'0.1%',   norm:v=>Math.max(0,((5-v)/5)*100),    impactPct:0.50, howToClose:'Implement carrier liability KPIs; standardise packing specs; deploy claims management system.', howToCloseAr:'طبّق مؤشرات مسؤولية الناقلين وقيّس مواصفات التعبئة ونظام إدارة المطالبات.' },
    { id:'transitVar',   label:'Transit Time Variance',    labelAr:'تباين وقت العبور',              unit:'days',min:0, max:10, def:3.2,gcMedian:64,gcTopQ:92, gcMedianRaw:'1.8d',   gcTopQRaw:'0.4d',   norm:v=>Math.max(0,((10-v)/10)*100),  impactPct:0.20, howToClose:'Optimise routing with TMS; negotiate dedicated capacity with key carriers for critical lanes.', howToCloseAr:'حسّن مسارات الشحن بنظام TMS؛ تفاوض على طاقة مخصصة مع الناقلين.' },
    { id:'costEff',      label:'Cost Efficiency Score',    labelAr:'مؤشر كفاءة التكلفة',           unit:'/100',min:0, max:100,def:50, gcMedian:62,gcTopQ:88, gcMedianRaw:'62/100',  gcTopQRaw:'88/100', norm:v=>v,                            impactPct:0.30, howToClose:'Consolidate shipments; implement multi-drop routing optimisation; automate last-mile dispatch.', howToCloseAr:'دمج الشحنات؛ طبّق تحسين مسارات التوزيع المتعدد وأتمتة المرحلة الأخيرة.' },
  ],
  'Construction & EPC': [
    { id:'matAvail',     label:'Material Availability On Schedule',labelAr:'توافر المواد في الموعد',unit:'%', min:30,max:100,def:68, gcMedian:78,gcTopQ:95, gcMedianRaw:'78%',    gcTopQRaw:'95%',    norm:v=>v,                            impactPct:0.40, howToClose:'Implement MRP linked to project schedule; apply SCOR Plan-Source integration.', howToCloseAr:'طبّق تخطيط متطلبات المواد المرتبط بجدول المشروع (SCOR Plan-Source).' },
    { id:'procCycle',    label:'Procurement Cycle Time',   labelAr:'دورة المشتريات',               unit:'days',min:5, max:120,def:52, gcMedian:63,gcTopQ:85, gcMedianRaw:'35d',    gcTopQRaw:'15d',    norm:v=>Math.max(0,((120-v)/115)*100),impactPct:0.10, howToClose:'Pre-qualify tier-1 contractors; deploy blanket orders for standard materials with fast-track approval.', howToCloseAr:'أهّل مقاولي الدرجة الأولى وأصدر أوامر إطارية للمواد المعيارية.' },
    { id:'contractComp', label:'Contract Compliance Rate', labelAr:'الامتثال التعاقدي',            unit:'%',   min:40,max:100,def:70, gcMedian:82,gcTopQ:97, gcMedianRaw:'82%',    gcTopQRaw:'97%',    norm:v=>v,                            impactPct:0.20, howToClose:'Implement CLM with milestone tracking; deploy variation order management per FIDIC standards.', howToCloseAr:'طبّق CLM مع تتبع المعالم وأوامر التغيير وفق معايير FIDIC.' },
    { id:'costAdherence',label:'Cost vs Budget Adherence', labelAr:'الالتزام بالميزانية',          unit:'%',   min:50,max:100,def:85, gcMedian:93,gcTopQ:99, gcMedianRaw:'93%',    gcTopQRaw:'99%',    norm:v=>v,                            impactPct:0.50, howToClose:'Implement earned value management (EVM); deploy cost engineering and change management.', howToCloseAr:'طبّق إدارة القيمة المكتسبة (EVM) وهندسة التكلفة وبروتوكولات التغيير.' },
    { id:'localContent', label:'Local Content / IKTVA %', labelAr:'المحتوى المحلي',               unit:'%',   min:0, max:100,def:21, gcMedian:32,gcTopQ:55, gcMedianRaw:'32%',    gcTopQRaw:'55%',    norm:v=>v,                            impactPct:0.10, howToClose:'Map subcontracts against Saudi IKTVA scorecard; develop SME supplier panel for civil works.', howToCloseAr:'خرطشة عقود الباطن مع بطاقة IKTVA؛ طوّر لوحة موردين محليين للأعمال المدنية.' },
    { id:'schedAdherence',label:'Schedule Adherence Rate', labelAr:'الالتزام بالجدول',             unit:'%',   min:30,max:100,def:62, gcMedian:75,gcTopQ:94, gcMedianRaw:'75%',    gcTopQRaw:'94%',    norm:v=>v,                            impactPct:0.40, howToClose:'Deploy CPM with weekly lookahead scheduling; implement weekly material flow meetings.', howToCloseAr:'طبّق طريقة المسار الحرج (CPM) مع جدولة أسبوعية ومراجعات تدفق المواد.' },
  ],
  'Healthcare': [
    { id:'supplyAvail',  label:'Drug/Supply Availability', labelAr:'توافر الأدوية والمستلزمات',    unit:'%',   min:50,max:100,def:87, gcMedian:93,gcTopQ:99, gcMedianRaw:'93%',    gcTopQRaw:'99%',    norm:v=>v,                            impactPct:0.40, howToClose:'Implement demand-driven pharmaceutical inventory with safety stock based on lead time variability.', howToCloseAr:'طبّق مخزون دوائي بتحفيز الطلب مع مخزون أمان مبني على تباين التوريد.' },
    { id:'stockoutRate', label:'Stockout Incidence Rate',  labelAr:'معدل نفاد المخزون',            unit:'%',   min:0, max:20, def:7,  gcMedian:73,gcTopQ:94, gcMedianRaw:'4%',     gcTopQRaw:'0.6%',   norm:v=>Math.max(0,((20-v)/20)*100),  impactPct:0.60, howToClose:'Classify medications by criticality (ABC/VED analysis); set higher safety stock for vital medications.', howToCloseAr:'صنّف الأدوية حسب الأهمية (ABC/VED)؛ اضبط مخزوناً أمانياً للأدوية الحيوية.' },
    { id:'invTurns',     label:'Inventory Turns',          labelAr:'معدل دوران المخزون',           unit:'×/yr',min:1, max:20, def:4,  gcMedian:40,gcTopQ:70, gcMedianRaw:'6×',     gcTopQRaw:'11×',    norm:v=>Math.min(100,(v/18)*100),     impactPct:0.20, howToClose:'Implement consignment stock for high-value implants; automate reorder points in HIS.', howToCloseAr:'طبّق مخزون الأمانة للمستلزمات عالية القيمة؛ أتمتة نقاط إعادة الطلب.' },
    { id:'procCycle',    label:'Procurement Cycle Time',   labelAr:'دورة المشتريات',               unit:'days',min:3, max:60, def:30, gcMedian:65,gcTopQ:85, gcMedianRaw:'20d',    gcTopQRaw:'9d',     norm:v=>Math.max(0,((60-v)/57)*100),  impactPct:0.10, howToClose:'Pre-qualify and centrally contract with top suppliers; deploy e-catalog for standard consumables.', howToCloseAr:'أهّل الموردين وتعاقد مركزياً؛ طبّق الكتالوج الإلكتروني للمستهلكات.' },
    { id:'suppQuality',  label:'Supplier Quality Score',   labelAr:'مؤشر جودة الموردين',          unit:'/100',min:0, max:100,def:68, gcMedian:79,gcTopQ:95, gcMedianRaw:'79/100',  gcTopQRaw:'95/100', norm:v=>v,                            impactPct:0.30, howToClose:'Implement vendor qualification programme; require quality certificates and post-market reports.', howToCloseAr:'طبّق برنامج تأهيل الموردين واشترط شهادات الجودة وتقارير المراقبة.' },
    { id:'coldChain',    label:'Cold Chain Compliance',    labelAr:'الامتثال للسلسلة الباردة',     unit:'%',   min:50,max:100,def:83, gcMedian:90,gcTopQ:99, gcMedianRaw:'90%',    gcTopQRaw:'99.5%',  norm:v=>v,                            impactPct:0.40, howToClose:'Deploy IoT temperature monitoring; qualify all cold-chain providers to GDP standards (SFDA/MOH).', howToCloseAr:'طبّق مراقبة IoT للحرارة؛ أهّل مزودي السلسلة الباردة بمعايير GDP.' },
  ],
  'Technology & ICT': [
    { id:'vendorPerf',   label:'Vendor Performance Score', labelAr:'مؤشر أداء البائعين',           unit:'/100',min:0, max:100,def:65, gcMedian:76,gcTopQ:94, gcMedianRaw:'76/100',  gcTopQRaw:'94/100', norm:v=>v,                            impactPct:0.20, howToClose:'Implement vendor management office (VMO) with quarterly balanced scorecard reviews.', howToCloseAr:'أنشئ مكتب إدارة البائعين (VMO) مع مراجعات ربع سنوية ببطاقة أداء.' },
    { id:'contractComp', label:'Contract Compliance Rate', labelAr:'الامتثال التعاقدي',            unit:'%',   min:40,max:100,def:72, gcMedian:82,gcTopQ:97, gcMedianRaw:'82%',    gcTopQRaw:'97%',    norm:v=>v,                            impactPct:0.25, howToClose:'Deploy IT-specific CLM with auto-renewal alerts, SLA tracking, and license reconciliation.', howToCloseAr:'طبّق CLM مخصص لتقنية المعلومات مع تنبيهات التجديد وتتبع SLA.' },
    { id:'itProcCycle',  label:'IT Procurement Cycle',     labelAr:'دورة مشتريات تقنية المعلومات',unit:'days',min:3, max:60, def:24, gcMedian:63,gcTopQ:87, gcMedianRaw:'16d',    gcTopQRaw:'7d',     norm:v=>Math.max(0,((60-v)/57)*100),  impactPct:0.08, howToClose:'Standardise equipment catalogue; deploy e-procurement with pre-approved IT vendor panel.', howToCloseAr:'وحّد كتالوج المعدات؛ طبّق المشتريات الإلكترونية مع لوحة موردين IT معتمدين.' },
    { id:'slaComp',      label:'SLA Compliance Rate',      labelAr:'الامتثال لاتفاقيات الخدمة',    unit:'%',   min:50,max:100,def:80, gcMedian:89,gcTopQ:98, gcMedianRaw:'89%',    gcTopQRaw:'98%',    norm:v=>v,                            impactPct:0.30, howToClose:'Implement ITSM platform; enforce SLA breach escalation matrix with financial penalties.', howToCloseAr:'طبّق منصة ITSM؛ اشترط مصفوفة تصعيد خرق SLA مع عقوبات مالية.' },
    { id:'assetUtil',    label:'Asset / License Utilization',labelAr:'استغلال الأصول والتراخيص',  unit:'%',   min:20,max:100,def:58, gcMedian:70,gcTopQ:90, gcMedianRaw:'70%',    gcTopQRaw:'90%',    norm:v=>v,                            impactPct:0.20, howToClose:'Conduct SAM audit; implement license harvesting for unused seats; consolidate vendors.', howToCloseAr:'أجرِ تدقيق SAM؛ طبّق حصاد التراخيص وادمج الموردين.' },
    { id:'itSavings',    label:'IT Savings vs Budget %',   labelAr:'الوفورات مقابل ميزانية IT',    unit:'%',   min:0, max:25, def:4,  gcMedian:42,gcTopQ:72, gcMedianRaw:'8%',     gcTopQRaw:'16%',    norm:v=>Math.min(100,(v/25)*100),     impactPct:0.40, howToClose:'Leverage cloud economies of scale; consolidate vendors; negotiate volume discounts.', howToCloseAr:'استفد من اقتصاديات السحابة؛ دمج الموردين وتفاوض على خصومات الحجم.' },
  ],
  'Food & Beverage': [
    { id:'otif',         label:'OTIF %',                   labelAr:'نسبة OTIF',                   unit:'%',   min:50,max:100,def:78, gcMedian:86,gcTopQ:95, gcMedianRaw:'86%',    gcTopQRaw:'95%',    norm:v=>v,                            impactPct:0.20, howToClose:'Implement EDI with top suppliers; enforce 24-hour advance shipping notice for fresh categories.', howToCloseAr:'طبّق EDI مع الموردين الرئيسيين وإشعار الشحن المسبق 24 ساعة.' },
    { id:'foodSafety',   label:'Food Safety Compliance',   labelAr:'الامتثال لسلامة الغذاء SFDA', unit:'%',   min:50,max:100,def:82, gcMedian:90,gcTopQ:99, gcMedianRaw:'90%',    gcTopQRaw:'99%',    norm:v=>v,                            impactPct:0.50, howToClose:'Implement HACCP-based QMS; automate supplier food safety certification tracking (SFDA).', howToCloseAr:'طبّق نظام HACCP؛ أتمتة تتبع شهادات سلامة الغذاء للموردين (SFDA).' },
    { id:'invTurns',     label:'Inventory Turns',          labelAr:'معدل دوران المخزون',           unit:'×/yr',min:4, max:52, def:10, gcMedian:48,gcTopQ:78, gcMedianRaw:'16×',    gcTopQRaw:'28×',    norm:v=>Math.min(100,(v/50)*100),     impactPct:0.20, howToClose:'Implement FEFO warehouse management; reduce SKU complexity using Pareto analysis.', howToCloseAr:'طبّق إدارة FEFO للمستودعات؛ قلّص تعقيد SKU باستخدام باريتو.' },
    { id:'spoilage',     label:'Waste / Spoilage Rate',    labelAr:'معدل الهدر والتلف',            unit:'%',   min:0, max:20, def:3.8,gcMedian:65,gcTopQ:90, gcMedianRaw:'2.2%',   gcTopQRaw:'0.7%',   norm:v=>Math.max(0,((20-v)/20)*100),  impactPct:0.50, howToClose:'Implement dynamic pricing for near-expiry products; establish redistribution channels.', howToCloseAr:'طبّق التسعير الديناميكي للمنتجات القريبة من الانتهاء؛ أنشئ قنوات إعادة التوزيع.' },
    { id:'fillRate',     label:'Fill Rate %',              labelAr:'معدل الاستيفاء',               unit:'%',   min:50,max:100,def:79, gcMedian:87,gcTopQ:97, gcMedianRaw:'87%',    gcTopQRaw:'97%',    norm:v=>v,                            impactPct:0.25, howToClose:'Reduce minimum order quantities with key suppliers; improve SKU-level demand forecasting.', howToCloseAr:'قلّص الحد الأدنى لكميات الطلب؛ حسّن التنبؤ بالطلب على مستوى SKU.' },
    { id:'forecastAcc',  label:'Forecast Accuracy',        labelAr:'دقة التنبؤ',                   unit:'%',   min:30,max:99, def:68, gcMedian:78,gcTopQ:92, gcMedianRaw:'78%',    gcTopQRaw:'92%',    norm:v=>v,                            impactPct:0.20, howToClose:'Implement collaborative forecasting with top-10 distributors (CPFR); apply promotional uplift modelling.', howToCloseAr:'طبّق CPFR مع أفضل 10 موزعين ونمذجة رفع العروض الترويجية.' },
  ],
  'E-commerce': [
    { id:'fillRate',     label:'Order Fill Rate %',        labelAr:'معدل استيفاء الطلبيات',        unit:'%',   min:50,max:100,def:88, gcMedian:94,gcTopQ:99, gcMedianRaw:'94%',    gcTopQRaw:'99%',    norm:v=>v,                            impactPct:0.30, howToClose:'Implement real-time inventory visibility across all nodes; use available-to-promise (ATP) at checkout.', howToCloseAr:'طبّق رؤية فورية للمخزون عبر جميع العقد وكيانات ATP عند الدفع.' },
    { id:'otd',          label:'On-Time Delivery %',       labelAr:'التسليم في الوقت المحدد',      unit:'%',   min:50,max:100,def:80, gcMedian:88,gcTopQ:97, gcMedianRaw:'88%',    gcTopQRaw:'97%',    norm:v=>v,                            impactPct:0.30, howToClose:'Multi-carrier routing optimisation; implement last-mile tracking with customer notifications.', howToCloseAr:'تحسين التوجيه متعدد الناقلين وتتبع المرحلة الأخيرة مع إشعارات العملاء.' },
    { id:'returnRate',   label:'Return / Refund Rate',     labelAr:'معدل الإرجاع',                 unit:'%',   min:0, max:30, def:14, gcMedian:64,gcTopQ:90, gcMedianRaw:'8%',     gcTopQRaw:'2%',     norm:v=>Math.max(0,((30-v)/30)*100),  impactPct:0.40, howToClose:'Improve product listing accuracy; QC at fulfilment centre; launch returns analytics programme.', howToCloseAr:'حسّن دقة قوائم المنتجات؛ ضبط الجودة في مراكز التلبية وتحليلات الإرجاع.' },
    { id:'invAccuracy',  label:'Inventory Accuracy',       labelAr:'دقة المخزون',                  unit:'%',   min:60,max:100,def:91, gcMedian:96,gcTopQ:99, gcMedianRaw:'96%',    gcTopQRaw:'99.5%',  norm:v=>v,                            impactPct:0.20, howToClose:'Deploy RFID or barcode scanning; implement daily cycle count programme at fulfilment centres.', howToCloseAr:'طبّق مسح RFID أو الباركود؛ نفّذ برنامج الجرد الدوري اليومي.' },
    { id:'daysSupply',   label:'Days of Supply',           labelAr:'أيام التوريد',                 unit:'days',min:3, max:60, def:32, gcMedian:67,gcTopQ:87, gcMedianRaw:'20d',    gcTopQRaw:'10d',    norm:v=>Math.max(0,((60-v)/57)*100),  impactPct:0.15, howToClose:'Implement demand-driven reorder with ML-based demand sensing; reduce minimum order quantities.', howToCloseAr:'طبّق إعادة الطلب بتحفيز ML؛ قلّص الحد الأدنى لكميات الطلب.' },
    { id:'perfOrder',    label:'Perfect Order Rate',       labelAr:'معدل الطلب المثالي',           unit:'%',   min:50,max:100,def:79, gcMedian:87,gcTopQ:96, gcMedianRaw:'87%',    gcTopQRaw:'96%',    norm:v=>v,                            impactPct:0.30, howToClose:'Integrate order management, WMS and TMS for E2E visibility; automate exception management.', howToCloseAr:'ادمج إدارة الطلبيات وWMS وTMS للرؤية الشاملة؛ أتمتة إدارة الاستثناءات.' },
  ],
  'Services': [
    { id:'contractComp', label:'Contract Compliance Rate', labelAr:'الامتثال التعاقدي',            unit:'%',   min:30,max:100,def:68, gcMedian:80,gcTopQ:96, gcMedianRaw:'80%',    gcTopQRaw:'96%',    norm:v=>v,                            impactPct:0.30, howToClose:'Deploy CLM platform with automated milestone tracking and renewal alerts; align to CIPS standards.', howToCloseAr:'طبّق CLM مع تتبع المعالم وتنبيهات التجديد؛ توافق مع معايير CIPS.' },
    { id:'procCycle',    label:'Procurement Cycle Time',   labelAr:'دورة المشتريات',               unit:'days',min:5, max:90, def:35, gcMedian:65,gcTopQ:87, gcMedianRaw:'22d',    gcTopQRaw:'9d',     norm:v=>Math.max(0,((90-v)/85)*100),  impactPct:0.10, howToClose:'Pre-qualify service providers; deploy e-procurement with digital RFP/RFQ templates.', howToCloseAr:'أهّل مزودي الخدمات مسبقاً؛ طبّق المشتريات الإلكترونية مع قوالب RFP/RFQ.' },
    { id:'suppPerf',     label:'Supplier Performance',     labelAr:'أداء الموردين',                unit:'/100',min:0, max:100,def:62, gcMedian:74,gcTopQ:92, gcMedianRaw:'74/100',  gcTopQRaw:'92/100', norm:v=>v,                            impactPct:0.20, howToClose:'Implement quarterly supplier performance reviews with balanced scorecard (quality, delivery, cost).', howToCloseAr:'نفّذ مراجعات أداء ربع سنوية للموردين ببطاقة الأداء المتوازن.' },
    { id:'slaComp',      label:'SLA Delivery Rate',        labelAr:'الوفاء باتفاقيات الخدمة',     unit:'%',   min:50,max:100,def:74, gcMedian:85,gcTopQ:97, gcMedianRaw:'85%',    gcTopQRaw:'97%',    norm:v=>v,                            impactPct:0.30, howToClose:'Establish SLA management office; implement automated SLA monitoring with breach escalation.', howToCloseAr:'أنشئ مكتب إدارة SLA؛ طبّق المراقبة الآلية مع تصعيد الخرق.' },
    { id:'savings',      label:'Cost Savings vs Budget %', labelAr:'الوفورات مقابل الميزانية',     unit:'%',   min:0, max:20, def:3,  gcMedian:38,gcTopQ:72, gcMedianRaw:'7%',     gcTopQRaw:'14%',    norm:v=>Math.min(100,(v/20)*100),     impactPct:0.50, howToClose:'Launch strategic sourcing programme; negotiate framework agreements for top-20 spend categories.', howToCloseAr:'أطلق الشراء الاستراتيجي وتفاوض على اتفاقيات إطارية لأفضل 20 فئة إنفاق.' },
    { id:'riskCoverage', label:'Vendor Risk Coverage',     labelAr:'تغطية مخاطر البائعين',         unit:'%',   min:0, max:100,def:45, gcMedian:65,gcTopQ:92, gcMedianRaw:'65%',    gcTopQRaw:'92%',    norm:v=>v,                            impactPct:0.20, howToClose:'Implement annual vendor risk assessment for all strategic vendors; score against ISO 31000.', howToCloseAr:'طبّق تقييم مخاطر سنوي للبائعين الاستراتيجيين مقابل معايير ISO 31000.' },
  ],
};

function getIndustryKPIs(industry: string): KPIDef[] {
  return INDUSTRY_KPIS[industry] ?? INDUSTRY_KPIS['Manufacturing'];
}

// ─── Tab 1: Benchmark Radar (Industry-Specific) ───────────────────────────────
function BenchmarkTab({ lang }: { lang: Lang }) {
  const ar = lang === 'ar';
  const [industry, setIndustry]       = useState(Object.keys(INDUSTRY_TREE)[0]);
  const [subIndustry, setSubIndustry] = useState('');
  const [revenue, setRevenue]         = useState(200); // SAR M
  const [vals, setVals]               = useState<Record<string, number>>({});
  const [targets, setTargets]         = useState<Record<string, number>>({});

  const kpis = useMemo(() => getIndustryKPIs(industry), [industry]);

  const handleIndustryChange = useCallback((ind: string) => {
    setIndustry(ind); setSubIndustry(''); setVals({}); setTargets({});
  }, []);

  const getVal = (k: KPIDef) => vals[k.id] ?? k.def;

  const radarData = useMemo(() => kpis.map(k => ({
    metric: ar ? k.labelAr : k.label,
    'As-Is':        Math.round(k.norm(getVal(k))),
    'GCC Median':   k.gcMedian,
    'Top Quartile': k.gcTopQ,
  })), [kpis, vals, ar]);

  const gaps = useMemo(() => kpis.map(k => {
    const asIs       = Math.round(k.norm(getVal(k)));
    const targetNorm = targets[k.id] ?? k.gcTopQ;
    const gapToMed   = k.gcMedian - asIs;
    const gapToTgt   = targetNorm - asIs;
    const sarImpact  = Math.max(0, gapToTgt) * revenue * 1_000_000 * k.impactPct / 100;
    return { ...k, asIs, targetNorm, gapToMed, gapToTgt, sarImpact };
  }), [kpis, vals, targets, revenue]);

  const totalImpact = gaps.reduce((s, g) => s + g.sarImpact, 0);
  const avgAsIs     = Math.round(gaps.reduce((s, g) => s + g.asIs, 0) / Math.max(gaps.length, 1));
  const avgMedian   = Math.round(kpis.reduce((s, k) => s + k.gcMedian, 0) / Math.max(kpis.length, 1));
  const avgTopQ     = Math.round(kpis.reduce((s, k) => s + k.gcTopQ, 0) / Math.max(kpis.length, 1));

  return (
    <div className="space-y-8" dir={ar ? 'rtl' : 'ltr'}>
      {/* Company Profile */}
      <div className="grid sm:grid-cols-3 gap-4 bg-[#082C6B]/5 border border-[#082C6B]/20 rounded-xl p-5">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#082C6B] uppercase tracking-wider">{ar ? 'القطاع الصناعي' : 'Industry Sector'}</label>
          <select value={industry} onChange={e => handleIndustryChange(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#082C6B]/30">
            {Object.keys(INDUSTRY_TREE).map(i => <option key={i} value={i}>{industryLabel(i, ar)}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#082C6B] uppercase tracking-wider">{ar ? 'القطاع الفرعي' : 'Sub-Sector'}</label>
          <select value={subIndustry} onChange={e => setSubIndustry(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#082C6B]/30">
            <option value="">{ar ? '— الكل —' : '— All sub-sectors —'}</option>
            {(INDUSTRY_TREE[industry] ?? []).map(s => <option key={s} value={s}>{subSectorLabel(industry, s, ar)}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#082C6B] uppercase tracking-wider">{ar ? 'الإيرادات السنوية' : 'Annual Revenue'}</label>
          <div className="flex items-center gap-2">
            <input type="range" min={10} max={5000} step={10} value={revenue} onChange={e => setRevenue(+e.target.value)} className="flex-1 accent-[#C9A84C]" />
            <span className="text-sm font-bold text-[#C9A84C] whitespace-nowrap w-24 text-right">
              {revenue >= 1000 ? `SAR ${(revenue/1000).toFixed(1)}B` : `SAR ${revenue}M`}
            </span>
          </div>
        </div>
      </div>

      {/* Sector label */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs font-bold text-[#082C6B] uppercase tracking-widest px-3 py-1 bg-[#082C6B]/8 rounded-full whitespace-nowrap">
          {ar ? 'مؤشرات قطاع:' : 'KPIs for:'} {industry}{subIndustry ? ` — ${subIndustry}` : ''}
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* KPI Sliders — As-Is inputs */}
        <div className="space-y-4">
          <h3 className="font-bold text-[#082C6B] text-sm uppercase tracking-wider">{ar ? 'أدخل أرقامك الحالية (As-Is)' : 'Your Current Numbers — As-Is'}</h3>
          {kpis.map(k => {
            const v     = getVal(k);
            const normV = Math.round(k.norm(v));
            const ok    = normV >= k.gcMedian;
            return (
              <div key={k.id} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">{ar ? k.labelAr : k.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#C9A84C]">{v}{k.unit}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{normV}/100</span>
                  </div>
                </div>
                <input type="range" min={k.min} max={k.max} step={(k.max - k.min) < 5 ? 0.1 : 1}
                  value={v} onChange={e => setVals(p => ({ ...p, [k.id]: +e.target.value }))}
                  className="w-full accent-[#082C6B]" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{ar ? 'وسيط الخليج:' : 'GCC Median:'} {k.gcMedianRaw}</span>
                  <span>{ar ? 'أفضل ربع:' : 'Top Quartile:'} {k.gcTopQRaw}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Radar + 3-number summary */}
        <div className="space-y-5">
          <h3 className="font-bold text-[#082C6B] text-sm uppercase tracking-wider">{ar ? 'رادار المقارنة (As-Is / وسيط الخليج / أفضل ربع)' : 'Benchmark Radar (As-Is / GCC Median / Top Quartile)'}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#E5E7EB" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 8, fill: '#6B7280' }} />
              <Radar name={ar ? 'أداؤك' : 'Your Score (As-Is)'}    dataKey="As-Is"        stroke="#C9A84C" fill="#C9A84C" fillOpacity={0.4} strokeWidth={2} />
              <Radar name={ar ? 'وسيط الخليج' : 'GCC Median'}       dataKey="GCC Median"   stroke="#082C6B" fill="none"    strokeDasharray="6 3" strokeWidth={1.5} />
              <Radar name={ar ? 'أفضل ربع (الهدف)' : 'Top Quartile Target'} dataKey="Top Quartile" stroke="#10b981" fill="none" strokeDasharray="3 2" strokeWidth={1.2} />
              <Legend iconSize={10} iconType="circle" />
            </RadarChart>
          </ResponsiveContainer>

          {/* 3-number score cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: ar ? 'As-Is (أداؤك)' : 'As-Is', value: avgAsIs,  color: '#C9A84C' },
              { label: ar ? 'وسيط الخليج' : 'GCC Median', value: avgMedian, color: '#082C6B' },
              { label: ar ? 'الهدف (Top Q)' : 'Target (Top Q)', value: avgTopQ,  color: '#10b981' },
            ].map(c => (
              <div key={c.label} className="text-center rounded-xl border border-border p-3">
                <p className="text-xs text-muted-foreground mb-1 leading-tight">{c.label}</p>
                <p className="text-2xl font-black" style={{ color: c.color }}>{c.value}</p>
                <p className="text-xs text-muted-foreground">{ar ? '/100 درجة' : '/ 100 pts'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gap Analysis Table */}
      <div>
        <h3 className="font-bold text-[#082C6B] text-sm uppercase tracking-wider mb-3">{ar ? 'تحليل الفجوات والأثر المالي' : 'Gap Analysis & Financial Impact'}</h3>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-xs">
            <thead className="bg-[#082C6B] text-white">
              <tr>
                {(ar
                  ? ['مؤشر الأداء','As-Is','وسيط الخليج','هدفك (Top Q)','الفجوة للوسيط','الفجوة للهدف','الأثر السنوي (ريال)','كيف تسدّها؟']
                  : ['KPI','As-Is','GCC Median','Your Target','Gap to Median','Gap to Target','Annual SAR Impact','How to Close']
                ).map(h => <th key={h} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {gaps.map((g, i) => (
                <tr key={g.id} className={i % 2 === 0 ? 'bg-white' : 'bg-muted/30'}>
                  <td className="px-3 py-2.5 font-semibold">{ar ? g.labelAr : g.label}</td>
                  <td className="px-3 py-2.5">
                    <span className={`font-bold px-2 py-0.5 rounded-full ${g.asIs >= g.gcMedian ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{g.asIs}</span>
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-muted-foreground">{g.gcMedianRaw}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      <input type="number" min={0} max={100}
                        value={Math.round(targets[g.id] ?? g.gcTopQ)}
                        onChange={e => setTargets(p => ({ ...p, [g.id]: +e.target.value }))}
                        className="w-14 border border-border rounded px-1.5 py-0.5 text-xs text-center bg-white focus:outline-none focus:ring-1 focus:ring-[#082C6B]" />
                      <span className="text-muted-foreground">/100</span>
                    </div>
                  </td>
                  <td className={`px-3 py-2.5 font-bold ${g.gapToMed > 10 ? 'text-red-600' : g.gapToMed > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {g.gapToMed > 0 ? `−${Math.round(g.gapToMed)}` : `+${Math.abs(Math.round(g.gapToMed))}`}
                  </td>
                  <td className={`px-3 py-2.5 font-bold ${g.gapToTgt > 15 ? 'text-red-600' : g.gapToTgt > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {g.gapToTgt > 0 ? `−${Math.round(g.gapToTgt)}` : `+${Math.abs(Math.round(g.gapToTgt))}`}
                  </td>
                  <td className="px-3 py-2.5 font-bold text-[#082C6B]">
                    {g.sarImpact > 10000 ? formatSAR(g.sarImpact) : g.sarImpact > 0 ? '< SAR 10K' : <span className="text-emerald-600">✓ On Target</span>}
                  </td>
                  <td className="px-3 py-2.5 max-w-xs">
                    <p className="text-muted-foreground leading-snug">{ar ? g.howToCloseAr : g.howToClose}</p>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-[#082C6B]/8 border-t-2 border-[#082C6B]/20">
              <tr>
                <td colSpan={6} className="px-3 py-3 font-black text-[#082C6B] text-sm">{ar ? 'إجمالي الفرصة السنوية' : 'Total Annual Improvement Opportunity'}</td>
                <td className="px-3 py-3 font-black text-[#C9A84C] text-base">{formatSAR(totalImpact)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {ar ? '* التقديرات مبنية على قاعدة بيانات ISC الخليجية. يمكنك تعديل هدفك في عمود Target.' : '* Estimates based on ISC GCC benchmark database. Adjust your target in the table above.'}
        </p>
      </div>

      {/* ISC Value Add CTA */}
      <div className="bg-[#082C6B] rounded-2xl p-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-white font-black text-base">
            {ar ? `مع ISC، تُغلق شركات قطاع ${industry} هذه الفجوات خلال 3–6 أشهر.` : `With ISC, ${industry} organisations close these gaps in 3–6 months.`}
          </p>
          <p className="text-white/70 text-sm mt-1">
            {ar ? `فرصتك المحددة: ${formatSAR(totalImpact)} سنوياً — دعنا نحوّل هذه الأرقام إلى خطة عمل.` : `Your identified opportunity: ${formatSAR(totalImpact)} annually. Let us build an action plan together.`}
          </p>
        </div>
        <Link href="/consultant">
          <Button className="bg-[#C9A84C] hover:bg-[#b8973e] text-white font-bold shrink-0">
            {ar ? 'احجز استشارة مجانية' : 'Book Free Consultation'} {ar ? <ArrowLeft className="w-4 h-4 mr-1" /> : <ArrowRight className="w-4 h-4 ml-1" />}
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ─── Tab 2: Savings Calculator ────────────────────────────────────────────────
function SavingsTab({ lang }: { lang: Lang }) {
  const ar = lang === 'ar';
  const [revenue, setRevenue] = useState(500);
  const [spendPct, setSpendPct] = useState(28);
  const [industry, setIndustry] = useState(Object.keys(INDUSTRY_TREE)[0]);
  const [levers, setLevers] = useState<Record<string, number>>(Object.fromEntries(LEVERS.map(l => [l.id, 40])));

  const spend = revenue * 1_000_000 * spendPct / 100;
  const calcSaving = (id: string, pct: number) => {
    const lever = LEVERS.find(l => l.id === id)!;
    return spend * lever.maxPct * pct / 100;
  };
  const totalSaving = useMemo(() => LEVERS.reduce((s, l) => s + calcSaving(l.id, levers[l.id] ?? 40), 0), [levers, spend]);
  const roi = totalSaving / (revenue * 1_000_000) * 100;

  const barData = LEVERS.map(l => ({ name: ar ? l.shortAr : l.short, value: Math.round(calcSaving(l.id, levers[l.id] ?? 40) / 1000) }));

  return (
    <div className="space-y-7" dir={ar ? 'rtl' : 'ltr'}>
      {/* Inputs row */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#082C6B] uppercase tracking-wider">
            {ar ? 'الإيرادات السنوية' : 'Annual Revenue'}
          </label>
          <div className="flex items-center gap-2">
            <input type="range" min={50} max={5000} step={50} value={revenue} onChange={e => setRevenue(+e.target.value)} className="flex-1 accent-[#082C6B]" />
            <span className="text-sm font-bold text-[#C9A84C] w-20 text-right">SAR {revenue >= 1000 ? `${(revenue/1000).toFixed(1)}B` : `${revenue}M`}</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#082C6B] uppercase tracking-wider">
            {ar ? 'الإنفاق الشرائي % من الإيرادات' : 'Procurement Spend % of Revenue'}
          </label>
          <div className="flex items-center gap-2">
            <input type="range" min={5} max={70} value={spendPct} onChange={e => setSpendPct(+e.target.value)} className="flex-1 accent-[#082C6B]" />
            <span className="text-sm font-bold text-[#C9A84C] w-12 text-right">{spendPct}%</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#082C6B] uppercase tracking-wider">
            {ar ? 'القطاع' : 'Industry'}
          </label>
          <select value={industry} onChange={e => setIndustry(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#082C6B]/30">
            {Object.keys(INDUSTRY_TREE).map(i => <option key={i} value={i}>{industryLabel(i, ar)}</option>)}
          </select>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-8 items-start">
        {/* Levers */}
        <div className="lg:col-span-3 space-y-5">
          <h3 className="font-bold text-[#082C6B] text-sm uppercase tracking-wider">
            {ar ? 'محاور مبادرات التحسين' : 'Improvement Initiative Levers'}
          </h3>
          <p className="text-xs text-muted-foreground -mt-3">
            {ar
              ? 'اضبط كل محور ليعكس مدى تطبيق المبادرة (0% = لا إجراء، 100% = تطبيق كامل)'
              : 'Slide each lever to indicate how fully you plan to deploy each initiative (0% = no action, 100% = full deployment)'}
          </p>
          {LEVERS.map(l => (
            <div key={l.id} className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-sm font-semibold">{ar ? l.labelAr : l.label}</span>
                <span className="text-sm font-bold" style={{ color: l.color }}>{formatSAR(calcSaving(l.id, levers[l.id] ?? 40))}</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="range" min={0} max={100} value={levers[l.id] ?? 40}
                  onChange={e => setLevers(prev => ({ ...prev, [l.id]: +e.target.value }))}
                  className="flex-1" style={{ accentColor: l.color }} />
                <span className="text-xs text-muted-foreground w-10 text-right">{levers[l.id] ?? 40}%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {ar
                  ? `أقصى إمكانية: ${formatSAR(calcSaving(l.id, 100))} (عند التطبيق الكامل 100%)`
                  : `Max potential: ${formatSAR(calcSaving(l.id, 100))} (at 100% deployment)`}
              </p>
            </div>
          ))}
        </div>

        {/* Total + Chart */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            key={Math.round(totalSaving / 10000)}
            initial={{ scale: 0.97, opacity: 0.8 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-[#082C6B] rounded-2xl p-6 text-white text-center shadow-xl"
          >
            <p className="text-xs uppercase tracking-widest text-white/60 mb-1">
              {ar ? 'إجمالي الوفورات المحتملة' : 'Total Savings Potential'}
            </p>
            <p className="text-4xl font-black text-[#C9A84C] mb-1">{formatSAR(totalSaving)}</p>
            <p className="text-sm text-white/80">
              {ar ? `سنوياً · ${roi.toFixed(1)}% من الإيرادات` : `per annum · ${roi.toFixed(1)}% of revenue`}
            </p>
            <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-2 gap-3 text-center">
              <div>
                <p className="text-white/60 text-xs">{ar ? 'الإنفاق القابل للتحسين' : 'Addressable Spend'}</p>
                <p className="font-bold">{formatSAR(spend)}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">{ar ? 'فترة الاسترداد' : 'Payback Period'}</p>
                <p className="font-bold">{ar ? '6–12 شهراً' : '6–12 months'}</p>
              </div>
            </div>
          </motion.div>

          <div>
            <h4 className="text-xs font-bold text-[#082C6B] uppercase tracking-wider mb-3">
              {ar ? 'تفصيل الوفورات (ألف ريال)' : 'Savings Breakdown (SAR K)'}
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} layout="vertical" margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => ar ? `${v} ألف` : `${v}K`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                <Tooltip formatter={(v: number) => [ar ? `${v} ألف ريال` : `SAR ${v}K`, '']} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {LEVERS.map(l => <Cell key={l.id} fill={l.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
        {ar ? (
          <><strong className="font-bold">ملاحظة ISC:</strong> تستند هذه التقديرات إلى قاعدة بيانات معايير الخليج الخاصة بـ ISC ومنحنيات وفورات إدارة الفئات من CIPS لقطاع {industry}. تعتمد الوفورات الفعلية على الجاهزية التنظيمية ونضج المشتريات وجودة التنفيذ. احجز استشارة للحصول على تقييم دقيق للفرص.</>
        ) : (
          <><strong className="font-bold">ISC Note:</strong> These estimates are based on ISC's GCC benchmark database and CIPS Category Management savings curves for {industry}. Actual savings depend on organisational readiness, procurement maturity, and implementation quality. Book a consultation for a precise opportunity assessment.</>
        )}
      </div>
    </div>
  );
}

// ─── Risk Category Definitions ────────────────────────────────────────────────
const RISK_CATEGORIES_DATA = [
  { id:'supply',      icon:'🏭', label:'Supply Risk',                   labelAr:'مخاطر التوريد',                  desc:'Supplier concentration, sole-source dependencies, lead time, quality failures',           descAr:'تركز الموردين، المصدر الفردي، وقت التوريد، إخفاقات الجودة',               gcMedian:45, gcTopQ:22, examples:['Sole-source dependencies','Supplier financial risk','Geographic concentration','Long lead times'] },
  { id:'demand',      icon:'📊', label:'Demand Risk',                   labelAr:'مخاطر الطلب',                    desc:'Forecast inaccuracy, demand volatility, customer concentration',                            descAr:'عدم دقة التنبؤ، تقلب الطلب، تركز العملاء',                                gcMedian:40, gcTopQ:20, examples:['Demand volatility','Forecast inaccuracy','Seasonal spikes','Customer concentration'] },
  { id:'operational', icon:'⚙️', label:'Operational Risk',              labelAr:'المخاطر التشغيلية',               desc:'Process failures, capacity constraints, quality escapes, BCP gaps',                          descAr:'إخفاقات العمليات، قيود الطاقة، هروب الجودة، ثغرات BCP',                   gcMedian:48, gcTopQ:25, examples:['Process failures','BCP gaps','Capacity constraints','Quality escapes'] },
  { id:'financial',   icon:'💰', label:'Financial Risk',                labelAr:'المخاطر المالية',                 desc:'Currency exposure, price volatility, payment terms, supplier credit risk',                   descAr:'تعرض العملة، تقلب الأسعار، شروط الدفع، مخاطر الائتمان',                   gcMedian:38, gcTopQ:18, examples:['Currency fluctuation','Commodity price volatility','Supplier credit risk','Payment terms'] },
  { id:'geopolitical',icon:'🌍', label:'Geopolitical / Regulatory Risk',labelAr:'المخاطر الجيوسياسية والتنظيمية',desc:'Trade restrictions, sanctions, GCC regulatory changes (GTPL, Vision 2030)',                  descAr:'القيود التجارية، العقوبات، التغييرات التنظيمية في الخليج',                  gcMedian:42, gcTopQ:20, examples:['Import/export restrictions','GTPL/IKTVA compliance','Sanctions risk','Political instability'] },
  { id:'esg',         icon:'🌱', label:'ESG / Sustainability Risk',     labelAr:'مخاطر الاستدامة والحوكمة',        desc:'Environmental compliance, ethical sourcing, social responsibility, ESG reporting',             descAr:'الامتثال البيئي، الشراء الأخلاقي، المسؤولية الاجتماعية',                  gcMedian:52, gcTopQ:28, examples:['Carbon footprint','Supplier ethical sourcing','Water/energy usage','ESG reporting gaps'] },
  { id:'cyber',       icon:'🔒', label:'Cyber / Technology Risk',       labelAr:'مخاطر الأمن السيبراني',           desc:'Data breaches, system outages, digital supply chain vulnerabilities',                        descAr:'اختراقات البيانات، انقطاع الأنظمة، ثغرات سلسلة التوريد الرقمية',           gcMedian:55, gcTopQ:25, examples:['Cybersecurity incidents','System downtime','Data integrity','Third-party digital risk'] },
  { id:'contract',    icon:'📜', label:'Contract / Governance Risk',    labelAr:'مخاطر العقود والحوكمة',           desc:'Contract non-compliance, governance gaps, legal/liability exposure',                         descAr:'عدم الامتثال التعاقدي، ثغرات الحوكمة، التعرض القانوني',                   gcMedian:44, gcTopQ:20, examples:['Contract compliance gaps','IP/liability exposure','PoA violations','Audit findings'] },
];

type RiskRating = { likelihood: number; impact: number; mitigation: 'none' | 'partial' | 'full' };

// ─── Tab 3: Risk Engine ──────────────────────────────────────────────────────
function RiskTab({ lang }: { lang: Lang }) {
  const ar = lang === 'ar';
  const [ratings, setRatings] = useState<Record<string, RiskRating>>(
    Object.fromEntries(RISK_CATEGORIES_DATA.map(c => [c.id, { likelihood: 3, impact: 3, mitigation: 'partial' }]))
  );
  const [revenue, setRevenue] = useState(300);
  const [industry, setIndustry] = useState(Object.keys(INDUSTRY_TREE)[0]);
  const [aiPlan, setAiPlan]   = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiErr,   setAiErr]   = useState('');

  const exposureScore = useMemo(() => {
    let total = 0;
    RISK_CATEGORIES_DATA.forEach(cat => {
      const r = ratings[cat.id] ?? { likelihood: 3, impact: 3, mitigation: 'partial' };
      const raw = r.likelihood * r.impact;                                 // 1–25
      const mitFactor = r.mitigation === 'full' ? 0.6 : r.mitigation === 'partial' ? 0.3 : 0;
      total += raw * (1 - mitFactor);
    });
    return Math.round(Math.min(100, (total / 200) * 100));
  }, [ratings]);

  const industryBenchmark = Math.round(RISK_CATEGORIES_DATA.reduce((s,c)=>s+c.gcMedian,0)/RISK_CATEGORIES_DATA.length / 2);
  const targetScore        = Math.round(RISK_CATEGORIES_DATA.reduce((s,c)=>s+c.gcTopQ,0)/RISK_CATEGORIES_DATA.length / 2);
  const annualExposure     = revenue * 1_000_000 * Math.max(0, exposureScore - targetScore) * 0.0003;

  const highRisks = useMemo(() =>
    RISK_CATEGORIES_DATA.filter(cat => {
      const r = ratings[cat.id] ?? { likelihood: 3, impact: 3 };
      return r.likelihood * r.impact >= 9;
    }), [ratings]);

  const setRating = useCallback((id: string, field: keyof RiskRating, value: number | string) => {
    setRatings(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }, []);

  const generatePlan = async () => {
    setLoading(true); setAiErr(''); setAiPlan(null);
    try {
      const desc = RISK_CATEGORIES_DATA.map(cat => {
        const r = ratings[cat.id] ?? { likelihood: 3, impact: 3 };
        return `${cat.label}: L${r.likelihood}×I${r.impact}=${r.likelihood*r.impact}`;
      }).join('; ');
      const resp = await fetch(`${API_BASE}/consultancy/diagnose`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ industry, challenge: `Risk assessment: ${desc}. Exposure score: ${exposureScore}/100. Generate ISO 31000-aligned mitigation plan.`, language: lang }),
      });
      const data = await resp.json();
      if (!data.ok) throw new Error(data.error ?? 'AI error');
      setAiPlan(data.diagnosis);
    } catch (e) { setAiErr(String(e)); }
    setLoading(false);
  };

  return (
    <div className="space-y-7" dir={ar ? 'rtl' : 'ltr'}>
      {/* Profile row */}
      <div className="grid sm:grid-cols-2 gap-4 bg-[#082C6B]/5 border border-[#082C6B]/20 rounded-xl p-5">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#082C6B] uppercase tracking-wider">{ar ? 'القطاع' : 'Industry Sector'}</label>
          <select value={industry} onChange={e => setIndustry(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white">
            {Object.keys(INDUSTRY_TREE).map(i => <option key={i} value={i}>{industryLabel(i, ar)}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#082C6B] uppercase tracking-wider">{ar ? 'الإيرادات السنوية' : 'Annual Revenue'}</label>
          <div className="flex items-center gap-2">
            <input type="range" min={10} max={5000} step={10} value={revenue} onChange={e => setRevenue(+e.target.value)} className="flex-1 accent-[#C9A84C]" />
            <span className="text-sm font-bold text-[#C9A84C] whitespace-nowrap w-24 text-right">
              {revenue >= 1000 ? `SAR ${(revenue/1000).toFixed(1)}B` : `SAR ${revenue}M`}
            </span>
          </div>
        </div>
      </div>

      {/* 3-Number Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: ar ? 'مؤشر تعرضك (As-Is)' : 'Your Exposure Score (As-Is)', value: exposureScore, color: riskColor(exposureScore), sub: riskLabel(exposureScore) },
          { label: ar ? 'معيار الخليج' : 'GCC Industry Benchmark', value: industryBenchmark, color: '#082C6B', sub: ar ? 'متوسط القطاع' : 'Sector median' },
          { label: ar ? 'الهدف (Top Quartile)' : 'Target (Top Quartile)', value: targetScore, color: '#10b981', sub: ar ? 'أفضل ربع' : 'Top quartile' },
        ].map(s => (
          <div key={s.label} className="text-center rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 leading-tight">{s.label}</p>
            <p className="text-3xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs font-semibold mt-1" style={{ color: s.color }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Risk Category Ratings */}
      <div>
        <h3 className="font-bold text-[#082C6B] text-sm uppercase tracking-wider mb-4">
          {ar ? 'قيّم كل فئة من فئات المخاطر (1=منخفض، 5=حرج)' : 'Rate Each Risk Category (1=Low, 5=Critical)'}
        </h3>
        <div className="space-y-3">
          {RISK_CATEGORIES_DATA.map(cat => {
            const r     = ratings[cat.id] ?? { likelihood: 3, impact: 3, mitigation: 'partial' };
            const score = r.likelihood * r.impact;
            const lvl   = score >= 16 ? 'Critical' : score >= 9 ? 'High' : score >= 4 ? 'Medium' : 'Low';
            const brdCls = score >= 16 ? 'border-red-200 bg-red-50' : score >= 9 ? 'border-orange-200 bg-orange-50' : score >= 4 ? 'border-amber-100 bg-amber-50/50' : 'border-emerald-200 bg-emerald-50/50';
            const bdgCls = score >= 16 ? 'bg-red-100 text-red-700' : score >= 9 ? 'bg-orange-100 text-orange-700' : score >= 4 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700';
            return (
              <div key={cat.id} className={`rounded-xl border p-4 transition-all ${brdCls}`}>
                <div className="flex flex-wrap items-start gap-3">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <span className="text-xl leading-none mt-0.5 shrink-0">{cat.icon}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm">{ar ? cat.labelAr : cat.label}</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${bdgCls}`}>{lvl} · {score}/25</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{ar ? cat.descAr : cat.desc}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 shrink-0 flex-wrap">
                    {/* Likelihood */}
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{ar ? 'الاحتمالية' : 'Likelihood'}</p>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(n => (
                          <button key={n} onClick={() => setRating(cat.id, 'likelihood', n)}
                            className={`w-8 h-8 rounded text-xs font-bold border transition-all ${r.likelihood >= n ? (n >= 4 ? 'bg-red-500 text-white border-red-500' : n >= 2 ? 'bg-amber-400 text-white border-amber-400' : 'bg-emerald-400 text-white border-emerald-400') : 'bg-white text-muted-foreground border-border hover:border-[#082C6B]/40'}`}>
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Impact */}
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{ar ? 'التأثير' : 'Impact'}</p>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(n => (
                          <button key={n} onClick={() => setRating(cat.id, 'impact', n)}
                            className={`w-8 h-8 rounded text-xs font-bold border transition-all ${r.impact >= n ? (n >= 4 ? 'bg-red-500 text-white border-red-500' : n >= 2 ? 'bg-amber-400 text-white border-amber-400' : 'bg-emerald-400 text-white border-emerald-400') : 'bg-white text-muted-foreground border-border hover:border-[#082C6B]/40'}`}>
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Mitigation */}
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{ar ? 'التخفيف' : 'Mitigation'}</p>
                      <div className="flex gap-1">
                        {(['none','partial','full'] as const).map(opt => (
                          <button key={opt} onClick={() => setRating(cat.id, 'mitigation', opt)}
                            className={`px-2 h-8 rounded text-xs font-semibold border transition-all ${r.mitigation === opt ? 'bg-[#082C6B] text-white border-[#082C6B]' : 'bg-white text-muted-foreground border-border hover:border-[#082C6B]/40'}`}>
                            {ar ? (opt==='none'?'لا يوجد':opt==='partial'?'جزئي':'كامل') : opt.charAt(0).toUpperCase()+opt.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Risk Heat Map 5×5 */}
      <div>
        <h3 className="font-bold text-[#082C6B] text-sm uppercase tracking-wider mb-3">
          {ar ? 'خريطة حرارة المخاطر (بناءً على تقييمك)' : 'Risk Heat Map — Live (Based on Your Assessment)'}
        </h3>
        <div className="bg-white rounded-xl border border-border p-4 space-y-2">
          <div className="flex items-start gap-2">
            <div className="flex flex-col justify-between text-xs text-muted-foreground w-6 text-right" style={{ height: 220 }}>
              {[5,4,3,2,1].map(n => <span key={n} className="leading-none py-2">{n}</span>)}
            </div>
            <div className="flex-1 space-y-1">
              {[5,4,3,2,1].map(impactLvl => (
                <div key={impactLvl} className="grid grid-cols-5 gap-1">
                  {[1,2,3,4,5].map(likeLvl => {
                    const sc   = impactLvl * likeLvl;
                    const cats = RISK_CATEGORIES_DATA.filter(cat => {
                      const r = ratings[cat.id] ?? { likelihood: 3, impact: 3 };
                      return r.likelihood === likeLvl && r.impact === impactLvl;
                    });
                    const bg = sc >= 16 ? 'bg-red-500 text-white' : sc >= 9 ? 'bg-orange-400 text-white' : sc >= 4 ? 'bg-amber-300 text-foreground' : 'bg-emerald-200 text-foreground';
                    return (
                      <div key={likeLvl} title={cats.map(c=>c.label).join(', ')}
                        className={`h-10 rounded flex items-center justify-center text-center ${bg} cursor-default transition-all`}>
                        {cats.length > 0 && (
                          <span className="text-[8px] font-bold leading-none px-0.5">
                            {cats.map(c => c.label.split(' ')[0]).join(',')}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-1 ml-8">
            {[1,2,3,4,5].map(n => <div key={n} className="flex-1 text-center text-xs text-muted-foreground">{n}</div>)}
          </div>
          <div className="flex items-center justify-between ml-8 mt-1">
            <span className="text-xs text-muted-foreground">{ar ? 'الاحتمالية ←' : '← Likelihood →'}</span>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {[['bg-emerald-200',ar?'منخفض':'Low'],['bg-amber-300',ar?'متوسط':'Medium'],['bg-orange-400',ar?'عالٍ':'High'],['bg-red-500',ar?'حرج':'Critical']].map(([cls,lbl])=>(
                <span key={lbl} className="flex items-center gap-1"><span className={`w-3 h-3 rounded ${cls} inline-block`} />{lbl}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Risk Register — High & Critical */}
      {highRisks.length > 0 && (
        <div>
          <h3 className="font-bold text-[#082C6B] text-sm uppercase tracking-wider mb-3">
            {ar ? 'سجل المخاطر — المخاطر العالية والحرجة' : 'Risk Register — High & Critical Risks'}
          </h3>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-xs">
              <thead className="bg-[#082C6B] text-white">
                <tr>
                  {(ar
                    ? ['فئة المخاطر','الاحتمالية','التأثير','الدرجة','المستوى','التخفيف الحالي','المالك','الإجراء المطلوب']
                    : ['Risk Category','Likelihood','Impact','Score','Level','Mitigation','Suggested Owner','Required Action']
                  ).map(h => <th key={h} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {highRisks.map((cat, i) => {
                  const r     = ratings[cat.id] ?? { likelihood: 3, impact: 3, mitigation: 'partial' };
                  const score = r.likelihood * r.impact;
                  const lvl   = score >= 16 ? 'Critical' : 'High';
                  const lvlCls = lvl === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700';
                  const mitCls = r.mitigation === 'none' ? 'bg-red-100 text-red-700' : r.mitigation === 'partial' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700';
                  return (
                    <tr key={cat.id} className={i%2===0?'bg-white':'bg-muted/30'}>
                      <td className="px-3 py-2.5 font-semibold">{cat.icon} {ar ? cat.labelAr : cat.label}</td>
                      <td className="px-3 py-2.5 text-center font-bold">{r.likelihood}/5</td>
                      <td className="px-3 py-2.5 text-center font-bold">{r.impact}/5</td>
                      <td className="px-3 py-2.5 text-center font-black text-[#082C6B]">{score}/25</td>
                      <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded-full font-bold text-xs ${lvlCls}`}>{lvl}</span></td>
                      <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded-full font-bold text-xs ${mitCls}`}>{r.mitigation.charAt(0).toUpperCase()+r.mitigation.slice(1)}</span></td>
                      <td className="px-3 py-2.5 text-muted-foreground">{ar ? 'مدير سلسلة التوريد' : 'Supply Chain Director'}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{cat.examples[0]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Financial Exposure + Opportunity */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className={`rounded-xl p-5 border ${exposureScore >= 60 ? 'bg-red-50 border-red-200' : exposureScore >= 40 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{ar ? 'التكلفة السنوية المقدرة للمخاطر' : 'Est. Annual Risk Exposure Cost'}</p>
          <p className={`text-2xl font-black ${exposureScore >= 60 ? 'text-red-700' : exposureScore >= 40 ? 'text-amber-700' : 'text-emerald-700'}`}>{formatSAR(annualExposure)}</p>
          <p className="text-xs text-muted-foreground mt-1">{ar ? 'إذا بقيت المخاطر دون معالجة' : 'if risks remain unaddressed'}</p>
        </div>
        <div className="rounded-xl p-5 bg-[#082C6B]/5 border border-[#082C6B]/20">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{ar ? 'فرصة التحسين نحو أفضل ربع' : 'Opportunity: Close to Top Quartile'}</p>
          <p className="text-2xl font-black text-[#082C6B]">{exposureScore} → {targetScore} <span className="text-base font-semibold">pts</span></p>
          <p className="text-xs text-muted-foreground mt-1">{ar ? `تحسين بمقدار ${exposureScore - targetScore} نقطة يرفعك إلى أفضل ربع` : `Improve by ${exposureScore - targetScore} pts to reach sector top quartile`}</p>
        </div>
      </div>

      {/* AI Mitigation Plan Generator */}
      <div className="border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-bold text-[#082C6B] text-base">{ar ? 'خطة التخفيف بالذكاء الاصطناعي' : 'AI Risk Mitigation Plan'}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{ar ? 'مبنية على ISO 31000 وCIPS وأطر الخليج' : 'ISO 31000 · CIPS · GCC regulatory frameworks'}</p>
          </div>
          <Button onClick={generatePlan} disabled={loading} className="bg-[#082C6B] hover:bg-[#0B3D91] text-white font-bold">
            {loading
              ? <><Loader2 className={`w-4 h-4 animate-spin ${ar ? 'ml-2' : 'mr-2'}`} />{ar ? 'جارٍ الإنشاء...' : 'Generating...'}</>
              : <><Brain className={`w-4 h-4 ${ar ? 'ml-2' : 'mr-2'}`} />{ar ? 'إنشاء خطة التخفيف' : 'Generate Mitigation Plan'}</>}
          </Button>
        </div>
        {aiErr && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{aiErr}</div>}
        {aiPlan && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="bg-[#082C6B] rounded-xl p-5 text-white">
              <p className="text-xs uppercase tracking-widest text-white/60 mb-2">{ar ? 'ملخص التشخيص' : 'Diagnostic Summary'}</p>
              <p className="text-sm leading-relaxed">{String((aiPlan as any).challengeSummary ?? '')}</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#082C6B] uppercase tracking-wider mb-2">{ar ? 'الإجراءات العاجلة' : 'Urgent Actions'}</h4>
              <div className="space-y-2">
                {((aiPlan as any).urgentActions ?? []).map((a: string, i: number) => (
                  <div key={i} className="flex gap-3 items-start bg-white rounded-xl border border-border p-3">
                    <span className="w-6 h-6 rounded-full bg-[#082C6B] text-white flex items-center justify-center text-xs font-black shrink-0">{i+1}</span>
                    <p className="text-sm">{a}</p>
                  </div>
                ))}
              </div>
            </div>
            {(aiPlan as any).estimatedAnnualCost && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-900">
                <strong>{ar ? 'التكلفة المقدرة إذا لم تُعالَج:' : 'Estimated cost if unresolved:'}</strong> {String((aiPlan as any).estimatedAnnualCost)}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* ISC Value Add CTA */}
      <div className="bg-[#082C6B] rounded-2xl p-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-white font-black text-base">{ar ? 'هل تريد خطة إدارة مخاطر مخصصة بالكامل؟' : 'Need a fully customised risk management plan?'}</p>
          <p className="text-white/70 text-sm mt-1">{ar ? `تعرضك: ${exposureScore}/100 · الهدف: ${targetScore}/100 · ISC تسدّ هذه الفجوة بدقة ISO 31000.` : `Your exposure: ${exposureScore}/100 · Target: ${targetScore}/100 · ISC closes this gap with ISO 31000 precision.`}</p>
        </div>
        <Link href="/consultant">
          <Button className="bg-[#C9A84C] hover:bg-[#b8973e] text-white font-bold shrink-0">
            {ar ? "تحدّث مع ما'ين" : "Talk to Ma'in"} {ar ? <ArrowLeft className="w-4 h-4 mr-1" /> : <ArrowRight className="w-4 h-4 ml-1" />}
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ─── Tab 4: AI Executive Briefing ─────────────────────────────────────────────
type BriefingStep = 'step1' | 'step2' | 'step3' | 'generating' | 'result';

interface Briefing {
  executiveSummary: string;
  maturityLevel: string;
  maturityScore: number;
  overallRiskLevel: string;
  criticalGaps: { title: string; businessImpact: string; urgency: string; detail: string; framework: string }[];
  quickWins: { action: string; timeframe: string; expectedSavingPct: number; effort: string; framework: string }[];
  strategicPriorities: { priority: number; title: string; rationale: string; expectedROI: string; timeline: string }[];
  ninetyDayPlan: { month1: { focus: string; milestones: string[] }; month2: { focus: string; milestones: string[] }; month3: { focus: string; milestones: string[] }; totalProjectedSaving: string };
  benchmarkInsight: string;
  sustainabilityOpportunity?: string;
  resiliencyGap?: string;
  recommendedPackage: string;
  recommendedPackageRationale: string;
  consultantNote: string;
}

// ─── Assessment draft persistence (localStorage) ────────────────────────────
const BRIEFING_DRAFT_KEY = 'isc-briefing-draft-v1';

interface BriefingDraft {
  industry?: string;
  subIndustry?: string;
  revenueBand?: string;
  painPoints?: string[];
  kpiRatings?: Record<string, number>;
  maturityRatings?: Record<string, number>;
}

function loadBriefingDraft(): BriefingDraft {
  try {
    const raw = localStorage.getItem(BRIEFING_DRAFT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed as BriefingDraft : {};
  } catch {
    return {};
  }
}

function BriefingTab({ lang }: { lang: Lang }) {
  const ar = lang === 'ar';
  const [draft] = useState<BriefingDraft>(loadBriefingDraft);
  const [step, setStep] = useState<BriefingStep>('step1');
  const [industry, setIndustry] = useState(() =>
    draft.industry && INDUSTRY_TREE[draft.industry] ? draft.industry : Object.keys(INDUSTRY_TREE)[0]);
  const [subIndustry, setSubIndustry] = useState(() =>
    draft.industry && INDUSTRY_TREE[draft.industry] && draft.subIndustry && INDUSTRY_TREE[draft.industry].includes(draft.subIndustry) ? draft.subIndustry : '');
  const [revenueBand, setRevenueBand] = useState(() =>
    draft.revenueBand && REVENUE_BANDS.includes(draft.revenueBand) ? draft.revenueBand : REVENUE_BANDS[1]);
  const [painPoints, setPainPoints] = useState<string[]>(() =>
    Array.isArray(draft.painPoints) ? draft.painPoints.filter(p => PAIN_POINTS.includes(p)) : []);
  const [kpiRatings, setKpiRatings] = useState<Record<string, number>>(() => ({
    ...Object.fromEntries(KPI_DOMAINS.map(d => [d, 3])),
    ...Object.fromEntries(Object.entries(draft.kpiRatings ?? {}).filter(([k, v]) => KPI_DOMAINS.includes(k) && typeof v === 'number' && v >= 1 && v <= 5)),
  }));
  const [maturityRatings, setMaturityRatings] = useState<Record<string, number>>(() => {
    const validKeys = new Set(allSubKeys());
    return {
      ...Object.fromEntries(allSubKeys().map(k => [k, 2])),
      ...Object.fromEntries(Object.entries(draft.maturityRatings ?? {}).filter(([k, v]) => validKeys.has(k) && typeof v === 'number' && v >= 1 && v <= 5)),
    };
  });
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>(Object.fromEntries(MATURITY_DOMAINS_EX.map(d => [d.id, d.id === 'strategy'])));
  const toggleDomain = (id: string) => setExpandedDomains(prev => ({ ...prev, [id]: !prev[id] }));
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const togglePain = (p: string) => setPainPoints(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  // Auto-save draft on every change
  useEffect(() => {
    try {
      localStorage.setItem(BRIEFING_DRAFT_KEY, JSON.stringify({ industry, subIndustry, revenueBand, painPoints, kpiRatings, maturityRatings } satisfies BriefingDraft));
    } catch { /* storage unavailable — ignore */ }
  }, [industry, subIndustry, revenueBand, painPoints, kpiRatings, maturityRatings]);

  const clearDraft = () => {
    try { localStorage.removeItem(BRIEFING_DRAFT_KEY); } catch { /* ignore */ }
    setIndustry(Object.keys(INDUSTRY_TREE)[0]);
    setSubIndustry('');
    setRevenueBand(REVENUE_BANDS[1]);
    setPainPoints([]);
    setKpiRatings(Object.fromEntries(KPI_DOMAINS.map(d => [d, 3])));
    setMaturityRatings(Object.fromEntries(allSubKeys().map(k => [k, 2])));
    setBriefing(null);
    setError('');
    setStep('step1');
  };

  const generate = useCallback(async () => {
    setStep('generating');
    setError('');
    try {
      const resp = await fetch(`${API_BASE}/assessment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ industry, subIndustry: subIndustry || undefined, revenueBand, painPoints, kpiRatings, maturityRatings: domainAverages(maturityRatings), language: lang }),
      });
      const data = await resp.json() as { success: boolean; briefing: Briefing; error?: string };
      if (!data.success || !data.briefing) throw new Error(data.error || 'No briefing returned');
      setBriefing(data.briefing);
      setStep('result');
      // Persist to database — fire-and-forget, never blocks the UI
      fetch(`${API_BASE}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          tool: 'command_centre',
          inputs: { industry, revenueBand, painPoints, kpiRatings, maturityRatings },
          outputs: data.briefing,
        }),
      }).catch(() => { /* non-blocking */ });
    } catch (err) {
      setError(String(err));
      setStep('step3');
    }
  }, [industry, revenueBand, painPoints, kpiRatings, maturityRatings]);

  const copyBriefing = () => {
    if (!briefing) return;
    const domainLines = MATURITY_DOMAINS_EX.map(d => {
      const vals = d.subs.map(s => maturityRatings[`${d.id}__${s.id}`] ?? 2);
      const avg = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
      return `• ${ar ? d.labelAr : d.label}: ${avg}/5`;
    }).join('\n');
    let text: string;
    if (ar) {
      const header = [
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        'سري — © 2026 آي سبلاي تشين. جميع الحقوق محفوظة.',
        'منهجية خاصة — معين الحقاش MCIPS · CPSM · MSc · MIPP',
        'يُحظر إعادة الإنتاج أو التوزيع أو الإفصاح غير المصرح به.',
        'مُنشأ بواسطة ISC Command Centre — isupplychain.com',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
      ].join('\n');
      const body = `إحاطة سلسلة الإمداد التنفيذية — ISC\n\nالملخص التنفيذي:\n${briefing.executiveSummary}\n\nمستوى النضج: ${briefing.maturityLevel} (${briefing.maturityScore}/100)\n\nنضج المجالات:\n${domainLines}\n\nالفجوات الحرجة:\n${briefing.criticalGaps.map((g, i) => `${i+1}. ${g.title} — ${g.businessImpact}`).join('\n')}\n\nالمكاسب السريعة:\n${briefing.quickWins.map((w, i) => `${i+1}. ${w.action} (${w.timeframe}, ~${w.expectedSavingPct}% وفر)`).join('\n')}\n\nخطة 90 يوماً:\nالشهر 1: ${briefing.ninetyDayPlan.month1.focus}\nالشهر 2: ${briefing.ninetyDayPlan.month2.focus}\nالشهر 3: ${briefing.ninetyDayPlan.month3.focus}\n\nالوفر المتوقع — السنة الأولى: ${briefing.ninetyDayPlan.totalProjectedSaving}\n\n— معين الحقاش، MCIPS · CPSM · MSc · MIPP\n   آي سبلاي تشين | haqash.maen@gmail.com\n\n© 2026 آي سبلاي تشين. جميع الحقوق محفوظة. سري وخاص.`;
      text = header + body;
    } else {
      const header = [
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        'CONFIDENTIAL — © 2026 I Supply Chain. All Rights Reserved.',
        'Proprietary methodology — Ma\'in Alhaqash MCIPS · CPSM · MSc · MIPP',
        'Unauthorised reproduction, distribution or disclosure is strictly prohibited.',
        'Generated by ISC Command Centre — isupplychain.com',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
      ].join('\n');
      const body = `ISC EXECUTIVE SUPPLY CHAIN BRIEFING\n\nExecutive Summary:\n${briefing.executiveSummary}\n\nMaturity: ${briefing.maturityLevel} (${briefing.maturityScore}/100)\n\nDomain Maturity:\n${domainLines}\n\nCritical Gaps:\n${briefing.criticalGaps.map((g, i) => `${i+1}. ${g.title} — ${g.businessImpact}`).join('\n')}\n\nQuick Wins:\n${briefing.quickWins.map((w, i) => `${i+1}. ${w.action} (${w.timeframe}, ~${w.expectedSavingPct}% savings)`).join('\n')}\n\n90-Day Plan:\nMonth 1: ${briefing.ninetyDayPlan.month1.focus}\nMonth 2: ${briefing.ninetyDayPlan.month2.focus}\nMonth 3: ${briefing.ninetyDayPlan.month3.focus}\n\nProjected Year-1 Saving: ${briefing.ninetyDayPlan.totalProjectedSaving}\n\n— Ma'in Alhaqash, MCIPS · CPSM · MSc · MIPP\n   I Supply Chain | haqash.maen@gmail.com\n\n© 2026 I Supply Chain. All Rights Reserved. Proprietary & Confidential.`;
      text = header + body;
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const urgencyColor: Record<string, string> = { Immediate: 'text-red-700 bg-red-50 border-red-200', '90-Day': 'text-amber-700 bg-amber-50 border-amber-200', '6-Month': 'text-blue-700 bg-blue-50 border-blue-200' };
  const effortColor: Record<string, string> = { Low: 'text-emerald-700 bg-emerald-50', Medium: 'text-amber-700 bg-amber-50', High: 'text-red-700 bg-red-50' };

  if (step === 'generating') {
    const genSteps = ar
      ? ['تحليل الفجوات في KPI مقابل أفضل ربع الخليج…','المرجعية بإطارَي CIPS وAPACS SCOR…','تحديد التدخلات الأعلى عائداً على الاستثمار…','صياغة خطة العمل التسعينية…']
      : ['Analysing KPI gaps vs GCC top quartile…','Cross-referencing CIPS & APICS SCOR frameworks…','Identifying highest-ROI interventions…','Drafting your 90-day action plan…'];
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}>
          <Loader2 className="w-12 h-12 text-[#082C6B]" />
        </motion.div>
        <div className="text-center">
          <p className="font-bold text-[#082C6B] text-lg">
            {ar ? 'جارٍ إنشاء إحاطتك التنفيذية…' : 'Generating your Executive Briefing…'}
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            {ar ? 'يحلّل الذكاء الاصطناعي ملفك مقارنةً بمعايير الخليج' : "Ma'in's AI is analysing your profile against GCC benchmarks"}
          </p>
        </div>
        {genSteps.map((t, i) => (
          <motion.p key={t} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.6 }} className="text-xs text-muted-foreground">{t}</motion.p>
        ))}
      </div>
    );
  }

  if (step === 'result' && briefing) {
    const maturityBg = briefing.maturityScore < 40 ? 'bg-red-600' : briefing.maturityScore < 60 ? 'bg-amber-500' : briefing.maturityScore < 80 ? 'bg-blue-600' : 'bg-emerald-600';
    const monthLabels = ar
      ? [['month1','الشهر 1','#082C6B'],['month2','الشهر 2','#0B3D91'],['month3','الشهر 3','#C9A84C']] as const
      : [['month1','Month 1','#082C6B'],['month2','Month 2','#0B3D91'],['month3','Month 3','#C9A84C']] as const;
    const radarData = MATURITY_DOMAINS_EX.map(d => {
      const vals = d.subs.map(s => maturityRatings[`${d.id}__${s.id}`] ?? 2);
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      return {
        domain: lang === 'ar' ? d.labelAr : d.label,
        score: Math.round(avg * 10) / 10,
      };
    });
    return (
      <div className="space-y-7" dir={ar ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
              {ar ? 'إحاطة تنفيذية سرية' : 'Confidential Executive Briefing'}
            </span>
            <h2 className="text-2xl font-black text-[#082C6B] mt-0.5">
              {ar ? `تقييم سلسلة إمداد — ${industry}` : `${industry} Supply Chain Assessment`}
            </h2>
            <p className="text-sm text-muted-foreground">{revenueBand} · Ma'in Alhaqash MCIPS CPSM MSc</p>
          </div>
          <div className="flex gap-2">
            <button onClick={copyBriefing} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-muted transition-colors">
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? (ar ? 'تم النسخ!' : 'Copied!') : (ar ? 'نسخ الإحاطة' : 'Copy Briefing')}
            </button>
            <button onClick={clearDraft} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-muted transition-colors">
              <RefreshCw className="w-4 h-4" /> {ar ? 'تقييم جديد' : 'New Assessment'}
            </button>
          </div>
        </div>

        {/* Scores row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-border p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {ar ? 'مستوى النضج' : 'Maturity Level'}
            </p>
            <span className={`inline-block px-3 py-1 rounded-full text-white text-sm font-bold ${maturityBg}`}>{briefing.maturityLevel}</span>
            <p className="text-3xl font-black text-[#082C6B] mt-2">{briefing.maturityScore}<span className="text-sm font-normal text-muted-foreground">/100</span></p>
          </div>
          <div className="rounded-xl border border-border p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {ar ? 'مستوى المخاطر' : 'Risk Level'}
            </p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${briefing.overallRiskLevel === 'Critical' ? 'bg-red-100 text-red-700' : briefing.overallRiskLevel === 'High' ? 'bg-orange-100 text-orange-700' : briefing.overallRiskLevel === 'Moderate' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {ar ? (RISK_LEVEL_AR[briefing.overallRiskLevel] ?? briefing.overallRiskLevel) : briefing.overallRiskLevel}
            </span>
            <p className="text-sm text-muted-foreground mt-3">
              {ar ? 'التعرض الإجمالي لمخاطر سلسلة الإمداد' : 'Overall supply chain risk exposure'}
            </p>
          </div>
          <div className="rounded-xl border border-[#C9A84C]/40 bg-[#C9A84C]/5 p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {ar ? 'الباقة الموصى بها' : 'Recommended Package'}
            </p>
            <span className="inline-block px-3 py-1 rounded-full bg-[#082C6B] text-white text-sm font-bold">{briefing.recommendedPackage}</span>
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{briefing.recommendedPackageRationale}</p>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="bg-[#082C6B] rounded-2xl p-6 text-white">
          <h3 className="text-xs uppercase tracking-widest text-white/60 mb-3 font-semibold">
            {ar ? 'الملخص التنفيذي' : 'Executive Summary'}
          </h3>
          <p className="text-base leading-relaxed">{briefing.executiveSummary}</p>
        </div>

        {/* Domain Maturity Radar */}
        <div className="rounded-xl border border-border p-4">
          <h3 className="font-bold text-[#082C6B] text-sm uppercase tracking-wider mb-1">
            {lang === 'ar' ? 'نضج المجالات — نظرة شاملة' : 'Domain Maturity — At a Glance'}
          </h3>
          <p className="text-xs text-muted-foreground mb-2">
            {lang === 'ar' ? 'متوسط درجات النضج لكل مجال (مقياس ١–٥)' : 'Average maturity score per domain (1–5 scale)'}
          </p>
          <div className="w-full h-80" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="70%">
                <PolarGrid stroke="#E5E7EB" />
                <PolarAngleAxis dataKey="domain" tick={{ fontSize: 11, fill: '#374151' }} />
                <PolarRadiusAxis angle={90} domain={[0, 5]} tickCount={6} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                <Radar
                  name={lang === 'ar' ? 'درجة النضج' : 'Maturity Score'}
                  dataKey="score"
                  stroke="#082C6B"
                  fill="#082C6B"
                  fillOpacity={0.25}
                />
                <Tooltip formatter={(v: number) => [`${v} / 5`, lang === 'ar' ? 'درجة النضج' : 'Maturity Score']} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Critical Gaps */}
        <div>
          <h3 className="font-bold text-[#082C6B] text-sm uppercase tracking-wider mb-3">
            {ar ? 'الفجوات الحرجة — تتطلب اهتماماً فورياً' : 'Critical Gaps — Immediate Attention Required'}
          </h3>
          <div className="space-y-3">
            {briefing.criticalGaps.map((g, i) => (
              <div key={i} className={`rounded-xl border p-4 ${urgencyColor[g.urgency] || 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                  <h4 className="font-bold">{i + 1}. {g.title}</h4>
                  <div className="flex gap-2 items-center shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${urgencyColor[g.urgency]}`}>
                      {ar ? (URGENCY_AR[g.urgency] ?? g.urgency) : g.urgency}
                    </span>
                    <span className="text-xs bg-white/60 px-2 py-0.5 rounded-full font-semibold">{g.framework}</span>
                  </div>
                </div>
                <p className="font-bold text-sm mb-1">{g.businessImpact}</p>
                <p className="text-sm leading-relaxed opacity-90">{g.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Wins */}
        <div>
          <h3 className="font-bold text-[#082C6B] text-sm uppercase tracking-wider mb-3">
            {ar ? 'المكاسب السريعة — نفّذ الآن' : 'Quick Wins — Implement Now'}
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {briefing.quickWins.map((w, i) => (
              <div key={i} className="bg-white rounded-xl border border-border p-4 flex gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black shrink-0">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-snug">{w.action}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className="text-xs bg-[#082C6B]/10 text-[#082C6B] px-2 py-0.5 rounded-full font-semibold"><Clock className={`w-2.5 h-2.5 inline ${ar ? 'ml-1' : 'mr-1'}`} />{w.timeframe}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${effortColor[w.effort]}`}>
                      {ar ? (EFFORT_AR[w.effort] ?? w.effort) : w.effort} {ar ? 'جهد' : 'effort'}
                    </span>
                    <span className="text-xs bg-[#C9A84C]/20 text-[#C9A84C] px-2 py-0.5 rounded-full font-semibold">
                      ~{w.expectedSavingPct}% {ar ? 'وفر' : 'saving'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{w.framework}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 90-Day Plan */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-[#082C6B] text-sm uppercase tracking-wider">
              {ar ? 'خارطة طريق التحول — 90 يوماً' : '90-Day Transformation Roadmap'}
            </h3>
            <span className="text-sm font-bold text-[#C9A84C]">
              {briefing.ninetyDayPlan.totalProjectedSaving} {ar ? 'وفر متوقع — السنة الأولى' : 'projected Year 1'}
            </span>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {monthLabels.map(([key, label, color]) => (
              <div key={key} className="rounded-xl border border-border p-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black mb-3" style={{ backgroundColor: color }}>{label.split(' ')[1]}</div>
                <p className="font-bold text-sm mb-2" style={{ color }}>{briefing.ninetyDayPlan[key].focus}</p>
                <ul className="space-y-1.5">
                  {briefing.ninetyDayPlan[key].milestones.map((m, i) => (
                    <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                      <Check className="w-3 h-3 shrink-0 mt-0.5 text-emerald-600" />{m}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Benchmark + Consultant Note */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-muted rounded-xl p-5">
            <h4 className="font-bold text-[#082C6B] text-xs uppercase tracking-wider mb-2">
              {ar ? 'السياق المرجعي — نظراء الخليج' : 'GCC Peer Benchmark Context'}
            </h4>
            <p className="text-sm text-foreground leading-relaxed">{briefing.benchmarkInsight}</p>
          </div>
          <div className="bg-[#082C6B]/5 border border-[#082C6B]/20 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <img src="/i-supply-chain/maen-photo.jpg" alt="Ma'in" className="w-10 h-10 rounded-full object-cover object-top border-2 border-[#C9A84C]" />
              <div>
                <p className="font-bold text-[#082C6B] text-sm">Ma'in Alhaqash</p>
                <p className="text-xs text-muted-foreground">MCIPS · CPSM · MSc · MIPP</p>
              </div>
            </div>
            <p className="text-sm italic text-foreground leading-relaxed">"{briefing.consultantNote}"</p>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-[#082C6B] rounded-2xl p-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-white font-bold text-lg">
              {ar ? 'هل أنت مستعد لتفعيل هذه التوصيات؟' : 'Ready to activate these recommendations?'}
            </p>
            <p className="text-white/70 text-sm">
              {ar ? 'احجز استشارة مجانية لمدة 45 دقيقة لبناء خطة التنفيذ.' : 'Book a free 45-minute consultation to build your implementation plan.'}
            </p>
          </div>
          <Link href="/consultant">
            <Button className="bg-[#C9A84C] hover:bg-[#b8973e] text-white font-bold shrink-0">
              {ar ? 'احجز استشارة' : 'Book Consultation'} {ar ? <ArrowLeft className="w-4 h-4 mr-2" /> : <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Wizard Steps ───────────────────────────────────────────────────────────
  const stepTitles = ar
    ? ['مؤسستك', 'نقاط الألم', 'التقييم الذاتي']
    : ['Your Organisation', 'Pain Points', 'Self-Assessment'];
  const stepIcons = [Building2, AlertTriangle, BarChart2];

  // For step 2: use Arabic pain points when in Arabic mode, with English keys for state
  const displayPainPoints = ar ? PAIN_POINTS_AR : PAIN_POINTS;

  return (
    <div className="max-w-2xl mx-auto space-y-8" dir={ar ? 'rtl' : 'ltr'}>
      {/* Progress */}
      <div className="flex items-center gap-0">
        {stepTitles.map((t, i) => {
          const currentIdx = step === 'step1' ? 0 : step === 'step2' ? 1 : 2;
          const Icon = stepIcons[i];
          return (
            <React.Fragment key={t}>
              <div className={`flex flex-col items-center gap-1 ${i <= currentIdx ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${i < currentIdx ? 'bg-emerald-500 text-white' : i === currentIdx ? 'bg-[#082C6B] text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {i < currentIdx ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className="text-xs font-semibold whitespace-nowrap">{t}</span>
              </div>
              {i < stepTitles.length - 1 && <div className={`flex-1 h-0.5 mb-4 ${i < currentIdx ? 'bg-emerald-500' : 'bg-gray-200'}`} />}
            </React.Fragment>
          );
        })}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div>}

      <div className="flex justify-end">
        <button type="button" onClick={clearDraft}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-red-600 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> {ar ? 'مسح والبدء من جديد' : 'Clear & Start Over'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {step === 'step1' && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
            <h3 className="text-xl font-bold text-[#082C6B]">
              {ar ? 'أخبرنا عن مؤسستك' : 'Tell us about your organisation'}
            </h3>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">{ar ? 'القطاع الصناعي' : 'Industry / Sector'}</label>
              <select value={industry} onChange={e => { setIndustry(e.target.value); setSubIndustry(''); }}
                className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#082C6B]/30">
                {Object.keys(INDUSTRY_TREE).map(i => <option key={i} value={i}>{industryLabel(i, ar)}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">{ar ? 'القطاع الفرعي (اختياري)' : 'Sub-Sector (optional)'}</label>
              <select value={subIndustry} onChange={e => setSubIndustry(e.target.value)}
                className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#082C6B]/30">
                <option value="">{ar ? '— كل القطاعات الفرعية —' : '— All sub-sectors —'}</option>
                {(INDUSTRY_TREE[industry] ?? []).map(s => <option key={s} value={s}>{subSectorLabel(industry, s, ar)}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">{ar ? 'نطاق الإيرادات السنوية' : 'Annual Revenue Band'}</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {REVENUE_BANDS.map((b, idx) => (
                  <button key={b} onClick={() => setRevenueBand(b)}
                    className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all ${revenueBand === b ? 'bg-[#082C6B] text-white border-[#082C6B]' : 'bg-white text-foreground border-border hover:border-[#082C6B]/40'}`}>
                    {ar ? REVENUE_BANDS_AR[idx] : b}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={() => setStep('step2')} className="w-full bg-[#082C6B] hover:bg-[#0B3D91] text-white">
              {ar ? 'التالي' : 'Continue'} {ar ? <ChevronLeft className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </motion.div>
        )}

        {step === 'step2' && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
            <h3 className="text-xl font-bold text-[#082C6B]">
              {ar ? 'ما أبرز تحدياتك؟' : 'What are your biggest challenges?'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {ar ? 'اختر كل ما ينطبق — 2 على الأقل' : 'Select all that apply — minimum 2'}
            </p>
            <div className="flex flex-wrap gap-2">
              {displayPainPoints.map((p, idx) => {
                const key = PAIN_POINTS[idx]; // always use English key for state
                return (
                  <button key={key} onClick={() => togglePain(key)}
                    className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${painPoints.includes(key) ? 'bg-[#082C6B] text-white border-[#082C6B]' : 'bg-white text-foreground border-border hover:border-[#082C6B]/40'}`}>
                    {painPoints.includes(key) && <Check className={`w-3 h-3 inline ${ar ? 'ml-1' : 'mr-1'}`} />}{p}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('step1')} className="flex-1">
                {ar ? 'السابق' : 'Back'}
              </Button>
              <Button onClick={() => setStep('step3')} disabled={painPoints.length < 2} className="flex-1 bg-[#082C6B] hover:bg-[#0B3D91] text-white">
                {ar ? 'التالي' : 'Continue'} {ar ? <ChevronLeft className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'step3' && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <h3 className="text-xl font-bold text-[#082C6B]">
              {ar ? 'قيّم أداءك الحالي' : 'Rate your current performance'}
            </h3>
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {ar ? 'أداء مؤشرات KPI (1 = ضعيف جداً، 5 = ممتاز)' : 'KPI Performance (1 = Very Poor, 5 = Excellent)'}
              </h4>
              {KPI_DOMAINS.map((d, idx) => (
                <div key={d} className="flex items-center gap-3">
                  <span className="text-sm w-48 shrink-0">{ar ? KPI_DOMAINS_AR[idx] : d}</span>
                  <div className="flex gap-1.5">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => setKpiRatings(prev => ({ ...prev, [d]: n }))}
                        className={`w-9 h-9 rounded-lg text-sm font-bold border transition-all ${(kpiRatings[d] ?? 3) >= n ? 'bg-[#082C6B] text-white border-[#082C6B]' : 'bg-white text-muted-foreground border-border hover:border-[#082C6B]/40'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {ar ? 'نضج العمليات (1 = تفاعلي، 5 = عالمي المستوى)' : 'Process Maturity (1 = Reactive, 5 = World-Class)'}
                </h4>
                <span className="text-xs text-muted-foreground">{ar ? 'انقر لتوسيع كل مجال' : 'Click domain to expand'}</span>
              </div>
              {MATURITY_DOMAINS_EX.map(domain => {
                const domainVals = domain.subs.map(s => maturityRatings[`${domain.id}__${s.id}`] ?? 2);
                const domainAvg = Math.round((domainVals.reduce((a, b) => a + b, 0) / domainVals.length) * 10) / 10;
                const avgColor = domainAvg <= 2 ? '#ef4444' : domainAvg <= 3 ? '#f59e0b' : domainAvg <= 4 ? '#3b82f6' : '#10b981';
                const isOpen = expandedDomains[domain.id];
                return (
                  <div key={domain.id} className="border border-border rounded-xl overflow-hidden">
                    {/* Domain header — click to expand */}
                    <button
                      type="button"
                      onClick={() => toggleDomain(domain.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-[#082C6B]/5 hover:bg-[#082C6B]/10 transition-colors text-left"
                    >
                      <span className="text-lg leading-none">{domain.icon}</span>
                      <span className="flex-1 font-bold text-sm text-[#082C6B]">
                        {ar ? domain.labelAr : domain.label}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: avgColor }}>
                        {domainAvg} / 5
                      </span>
                      {ar
                        ? <ChevronLeft className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? '-rotate-90' : ''}`} />
                        : <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />}
                    </button>
                    {/* Sub-dimensions */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="sub"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="divide-y divide-border">
                            {domain.subs.map(sub => {
                              const key = `${domain.id}__${sub.id}`;
                              const val = maturityRatings[key] ?? 2;
                              return (
                                <div key={sub.id} className="flex items-center gap-3 px-4 py-2.5">
                                  <span className="text-sm flex-1 text-muted-foreground leading-snug">
                                    {ar ? sub.labelAr : sub.label}
                                  </span>
                                  <div className="flex gap-1 shrink-0">
                                    {[1,2,3,4,5].map(n => (
                                      <button
                                        key={n}
                                        type="button"
                                        onClick={() => setMaturityRatings(prev => ({ ...prev, [key]: n }))}
                                        className={`w-8 h-8 rounded-md text-xs font-bold border transition-all ${val >= n ? 'bg-[#C9A84C] text-white border-[#C9A84C]' : 'bg-white text-muted-foreground border-border hover:border-[#C9A84C]/40'}`}
                                      >
                                        {n}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('step2')} className="flex-1">
                {ar ? 'السابق' : 'Back'}
              </Button>
              <Button onClick={generate} className="flex-1 bg-[#082C6B] hover:bg-[#0B3D91] text-white font-bold">
                <Brain className={`w-4 h-4 ${ar ? 'ml-2' : 'mr-2'}`} /> {ar ? 'إنشاء إحاطتي التنفيذية' : 'Generate My Briefing'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Tab 5: AI Consultancy Engine ────────────────────────────────────────────
type ConsultStage = 'input' | 'diagnosing' | 'diagnosis' | 'solving' | 'solution' | 'refining';

interface DiagnosisResult {
  challengeSummary: string;
  rootCauses: { cause: string; framework: string; severity: string }[];
  riskAssessment: { level: string; topRisks: string[]; iso31000Score: number };
  maturityAssessment: { level: string; score: number; keyGaps: string[] };
  diagnosticSummary: string;
  urgentActions: string[];
  estimatedAnnualCost: string;
  consultantNote: string;
}

interface SolutionResult {
  executiveSolution: string;
  solutionPhases: { phase: number; title: string; duration: string; focus: string; activities: string[]; deliverables: string[]; kpis: string[]; framework: string }[];
  kpiDashboard: { kpi: string; baseline: string; target: string; timeframe: string }[];
  sustainabilityImpact: string;
  resiliencyImpact: string;
  totalProjectedSaving: string;
  roi: string;
  nextStep: string;
  consultantNote: string;
}

function ConsultancyTab({ lang }: { lang: Lang }) {
  const [stage, setStage]           = useState<ConsultStage>('input');
  const [industry, setIndustry]     = useState(Object.keys(INDUSTRY_TREE)[0]);
  const [subIndustry, setSubIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [challenge, setChallenge]   = useState('');
  const [diagnosis, setDiagnosis]   = useState<DiagnosisResult | null>(null);
  const [solution, setSolution]     = useState<SolutionResult | null>(null);
  const [error, setError]           = useState('');
  const [satisfaction, setSatisfaction] = useState(0);
  const [feedback, setFeedback]     = useState('');
  const [escalated, setEscalated]   = useState(false);
  const ar = lang === 'ar';

  const runDiagnosis = useCallback(async () => {
    if (challenge.trim().length < 20) return;
    setStage('diagnosing'); setError('');
    try {
      const r = await fetch(`${API_BASE}/consultancy/diagnose`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ industry, subIndustry: subIndustry || undefined, challenge, companySize: companySize || undefined, language: lang }),
      });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || 'Diagnosis failed');
      setDiagnosis(d.diagnosis); setStage('diagnosis');
    } catch (e) { setError(String(e)); setStage('input'); }
  }, [industry, subIndustry, challenge, companySize, lang]);

  const generateSolution = useCallback(async () => {
    if (!diagnosis) return;
    setStage('solving'); setError('');
    try {
      const r = await fetch(`${API_BASE}/consultancy/solution`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ industry, subIndustry: subIndustry || undefined, challenge, diagnosis, language: lang }),
      });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || 'Solution failed');
      setSolution(d.solution); setStage('solution');
    } catch (e) { setError(String(e)); setStage('diagnosis'); }
  }, [industry, subIndustry, challenge, diagnosis, lang]);

  const refineSolution = useCallback(async () => {
    if (!solution || !feedback.trim()) return;
    setStage('refining'); setError('');
    try {
      const r = await fetch(`${API_BASE}/consultancy/refine`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ industry, subIndustry: subIndustry || undefined, challenge, previousSolution: solution, feedback, language: lang }),
      });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || 'Refinement failed');
      setSolution(d.solution); setFeedback(''); setStage('solution');
    } catch (e) { setError(String(e)); setStage('solution'); }
  }, [industry, subIndustry, challenge, solution, feedback, lang]);

  const escalate = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/consultancy/escalate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ industry, subIndustry, challenge, diagnosis, solution, satisfactionScore: satisfaction }),
      });
      setEscalated(true);
    } catch { /* best-effort */ }
  }, [industry, subIndustry, challenge, diagnosis, solution, satisfaction]);

  const isLoading = stage === 'diagnosing' || stage === 'solving' || stage === 'refining';

  if (isLoading) {
    const msg = stage === 'diagnosing' ? (ar ? 'جارٍ تشخيص تحديك...' : 'Running AI diagnosis...')
               : stage === 'solving'   ? (ar ? 'جارٍ إنشاء خطة الحل...' : 'Generating solution plan...')
               : (ar ? 'جارٍ تحسين الحل...' : 'Refining solution...');
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}>
          <Loader2 className="w-12 h-12 text-[#082C6B]" />
        </motion.div>
        <p className="font-bold text-[#082C6B] text-lg text-center">{msg}</p>
        {stage === 'diagnosing' && (
          <div className="space-y-2 text-center">
            {[
              ar ? 'تطبيق نموذج SCOR...' : 'Applying SCOR model analysis...',
              ar ? 'تقييم إطار CIPS...' : 'Evaluating CIPS framework gaps...',
              ar ? 'تحديد الأسباب الجذرية...' : 'Identifying root causes (Six Sigma)...',
              ar ? 'تقييم مخاطر ISO 31000...' : 'Assessing ISO 31000 risk exposure...',
            ].map((t, i) => (
              <motion.p key={t} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.7 }} className="text-xs text-muted-foreground">{t}</motion.p>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-7 ${ar ? 'text-right' : ''}`} dir={ar ? 'rtl' : 'ltr'}>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div>}

      {/* INPUT */}
      {stage === 'input' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 max-w-2xl mx-auto">
          <div>
            <h3 className="text-xl font-black text-[#082C6B]">{ar ? 'محرك الاستشارات الذكي' : 'AI Consultancy Engine'}</h3>
            <p className="text-muted-foreground text-sm mt-1">{ar ? 'صِف تحديك وسيقوم الذكاء الاصطناعي بتشخيصه وتقديم حلول عالمية المستوى بناءً على SCOR وCIPS وLean وSix Sigma' : 'Describe your challenge and receive a world-class, framework-grounded diagnosis and solution plan. Powered by SCOR, CIPS, Lean, Six Sigma, ISO 31000.'}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">{ar ? 'القطاع الصناعي' : 'Industry / Sector'}</label>
              <select value={industry} onChange={e => { setIndustry(e.target.value); setSubIndustry(''); }} className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#082C6B]/30">
                {Object.keys(INDUSTRY_TREE).map(i => <option key={i} value={i}>{industryLabel(i, ar)}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">{ar ? 'القطاع الفرعي' : 'Sub-Sector'}</label>
              <select value={subIndustry} onChange={e => setSubIndustry(e.target.value)} className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#082C6B]/30">
                <option value="">{ar ? '— اختر —' : '— All sub-sectors —'}</option>
                {(INDUSTRY_TREE[industry] ?? []).map(s => <option key={s} value={s}>{subSectorLabel(industry, s, ar)}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">{ar ? 'حجم الشركة / الإيرادات' : 'Company Size / Revenue Band'}</label>
            <select value={companySize} onChange={e => setCompanySize(e.target.value)} className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#082C6B]/30">
              <option value="">{ar ? '— اختر —' : '— Select —'}</option>
              {REVENUE_BANDS.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">{ar ? 'صِف تحديك أو مشكلتك' : 'Describe your challenge or pain point'}</label>
            <textarea value={challenge} onChange={e => setChallenge(e.target.value)} rows={5}
              placeholder={ar ? 'مثال: نعاني من ارتفاع تكاليف المشتريات وطول دورة الشراء وضعف أداء الموردين وانعدام الرؤية في بيانات الإنفاق...' : 'Example: We struggle with high procurement costs, long cycle times, poor supplier performance, excess inventory, weak contract compliance, or lack of spend visibility...'}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#082C6B]/30 resize-none" />
            <p className="text-xs text-muted-foreground">{challenge.length}/2000</p>
          </div>
          <Button onClick={runDiagnosis} disabled={challenge.trim().length < 20} className="w-full bg-[#082C6B] hover:bg-[#0B3D91] text-white font-bold py-3">
            <Brain className={`w-4 h-4 ${ar ? 'ml-2' : 'mr-2'}`} />{ar ? 'ابدأ التشخيص الذكي' : 'Run AI Diagnosis'}
          </Button>
        </motion.div>
      )}

      {/* DIAGNOSIS */}
      {stage === 'diagnosis' && diagnosis && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{ar ? 'نتائج التشخيص' : 'AI Diagnosis Results'}</span>
              <h2 className="text-xl font-black text-[#082C6B] mt-0.5">{industry}{subIndustry ? ` — ${subIndustry}` : ''}</h2>
            </div>
            <button onClick={() => setStage('input')} className="text-xs text-muted-foreground hover:text-foreground underline">{ar ? 'تشخيص جديد' : 'New Diagnosis'}</button>
          </div>
          <div className="bg-[#082C6B] rounded-2xl p-6 text-white">
            <p className="text-xs uppercase tracking-widest text-white/60 mb-2">{ar ? 'ملخص التحدي' : 'Challenge Summary'}</p>
            <p className="text-base leading-relaxed">{diagnosis.challengeSummary}</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{ar ? 'مستوى النضج' : 'Maturity'}</p>
              <p className="font-black text-[#082C6B] text-sm">{diagnosis.maturityAssessment.level}</p>
              <p className="text-2xl font-black text-[#082C6B] mt-1">{diagnosis.maturityAssessment.score}<span className="text-sm font-normal">/100</span></p>
            </div>
            <div className="rounded-xl border p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{ar ? 'المخاطر' : 'Risk Level'}</p>
              <p className={`font-black text-sm ${diagnosis.riskAssessment.level === 'Critical' ? 'text-red-600' : diagnosis.riskAssessment.level === 'High' ? 'text-orange-600' : diagnosis.riskAssessment.level === 'Moderate' ? 'text-amber-600' : 'text-emerald-600'}`}>{diagnosis.riskAssessment.level}</p>
              <p className="text-2xl font-black mt-1" style={{ color: riskColor(diagnosis.riskAssessment.iso31000Score) }}>{diagnosis.riskAssessment.iso31000Score}<span className="text-sm font-normal">/100</span></p>
            </div>
            <div className="rounded-xl border p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{ar ? 'التكلفة السنوية' : 'Annual Cost'}</p>
              <p className="font-black text-[#C9A84C] text-sm mt-2 leading-tight">{diagnosis.estimatedAnnualCost}</p>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#082C6B] uppercase tracking-wider mb-3">{ar ? 'الأسباب الجذرية' : 'Root Causes'}</h4>
            <div className="space-y-2">
              {(diagnosis.rootCauses ?? []).map((rc, i) => (
                <div key={i} className={`flex gap-3 rounded-xl p-4 border ${rc.severity === 'High' ? 'bg-red-50 border-red-200' : rc.severity === 'Medium' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
                  <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${rc.severity === 'High' ? 'text-red-600' : rc.severity === 'Medium' ? 'text-amber-600' : 'text-blue-600'}`} />
                  <div className="flex-1 min-w-0"><p className="text-sm font-semibold">{rc.cause}</p><p className="text-xs text-muted-foreground mt-0.5">{rc.framework}</p></div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full h-fit shrink-0 ${rc.severity === 'High' ? 'bg-red-100 text-red-700' : rc.severity === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{rc.severity}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-muted rounded-xl p-5">
            <h4 className="text-xs font-bold text-[#082C6B] uppercase tracking-wider mb-2">{ar ? 'التشخيص التفصيلي' : 'Detailed Diagnosis'}</h4>
            <p className="text-sm leading-relaxed whitespace-pre-line">{diagnosis.diagnosticSummary}</p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#082C6B] uppercase tracking-wider mb-3">{ar ? 'إجراءات فورية هذا الأسبوع' : 'Urgent Actions — This Week'}</h4>
            <div className="space-y-2">
              {(diagnosis.urgentActions ?? []).map((a, i) => (
                <div key={i} className="flex gap-3 items-start bg-white rounded-xl border border-border p-3">
                  <span className="w-6 h-6 rounded-full bg-[#082C6B] text-white flex items-center justify-center text-xs font-black shrink-0">{i+1}</span>
                  <p className="text-sm">{a}</p>
                </div>
              ))}
            </div>
          </div>
          {diagnosis.consultantNote && (
            <div className="bg-[#082C6B]/5 border border-[#082C6B]/20 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <img src="/i-supply-chain/maen-photo.jpg" alt="Ma'in" className="w-9 h-9 rounded-full object-cover object-top border-2 border-[#C9A84C]" />
                <div><p className="font-bold text-[#082C6B] text-sm">Ma'in Alhaqash</p><p className="text-xs text-muted-foreground">MCIPS · CPSM · MSc · MIPP</p></div>
              </div>
              <p className="text-sm italic">"{diagnosis.consultantNote}"</p>
            </div>
          )}
          <Button onClick={generateSolution} className="w-full bg-[#082C6B] hover:bg-[#0B3D91] text-white font-bold py-3">
            <Zap className={`w-4 h-4 ${ar ? 'ml-2' : 'mr-2'}`} />{ar ? 'إنشاء خطة الحل الكاملة' : 'Generate Full Solution Plan'}
          </Button>
        </motion.div>
      )}

      {/* SOLUTION */}
      {stage === 'solution' && solution && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{ar ? 'خطة الحل' : 'Solution Plan'}</span>
              <h2 className="text-xl font-black text-[#082C6B] mt-0.5">{industry}{subIndustry ? ` — ${subIndustry}` : ''}</h2>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStage('diagnosis')} className="text-xs text-muted-foreground hover:text-foreground underline">{ar ? 'العودة للتشخيص' : 'Back to Diagnosis'}</button>
              <button onClick={() => { setStage('input'); setDiagnosis(null); setSolution(null); setSatisfaction(0); }} className="text-xs text-muted-foreground hover:text-foreground underline">{ar ? 'بدء جديد' : 'Start Over'}</button>
            </div>
          </div>
          <div className="bg-[#082C6B] rounded-2xl p-6 text-white">
            <p className="text-xs uppercase tracking-widest text-white/60 mb-2">{ar ? 'ملخص الحل التنفيذي' : 'Executive Solution'}</p>
            <p className="text-base leading-relaxed">{solution.executiveSolution}</p>
            <div className="flex gap-6 mt-4 flex-wrap">
              <div><p className="text-[#C9A84C] font-black text-lg">{solution.totalProjectedSaving}</p><p className="text-white/60 text-xs">{ar ? 'التوفير المتوقع' : 'Projected Saving'}</p></div>
              <div><p className="text-[#C9A84C] font-black text-lg">{solution.roi}</p><p className="text-white/60 text-xs">{ar ? 'العائد على الاستثمار' : 'ROI'}</p></div>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#082C6B] uppercase tracking-wider mb-3">{ar ? 'مراحل التنفيذ' : 'Implementation Phases'}</h4>
            <div className="space-y-4">
              {(solution.solutionPhases ?? []).map(phase => (
                <div key={phase.phase} className="rounded-xl border border-border p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-8 h-8 rounded-full bg-[#082C6B] text-white flex items-center justify-center text-sm font-black shrink-0">{phase.phase}</span>
                    <div><p className="font-bold text-[#082C6B]">{phase.title}</p><p className="text-xs text-muted-foreground">{phase.duration} · {phase.framework}</p></div>
                  </div>
                  <p className="text-sm font-semibold mb-3">{phase.focus}</p>
                  <div className="grid sm:grid-cols-3 gap-3 text-xs">
                    <div><p className="font-bold text-muted-foreground uppercase tracking-wider mb-1">{ar ? 'الأنشطة' : 'Activities'}</p>{phase.activities.map((a,i) => <p key={i} className="flex gap-1 mt-0.5"><Check className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />{a}</p>)}</div>
                    <div><p className="font-bold text-muted-foreground uppercase tracking-wider mb-1">{ar ? 'المخرجات' : 'Deliverables'}</p>{phase.deliverables.map((d,i) => <p key={i} className="flex gap-1 mt-0.5">{ar ? <ChevronLeft className="w-3 h-3 text-[#082C6B] shrink-0 mt-0.5" /> : <ChevronRight className="w-3 h-3 text-[#082C6B] shrink-0 mt-0.5" />}{d}</p>)}</div>
                    <div><p className="font-bold text-muted-foreground uppercase tracking-wider mb-1">{ar ? 'مؤشرات الأداء' : 'KPIs'}</p>{phase.kpis.map((k,i) => <p key={i} className="flex gap-1 mt-0.5"><BarChart2 className="w-3 h-3 text-[#C9A84C] shrink-0 mt-0.5" />{k}</p>)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {(solution.kpiDashboard ?? []).length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-[#082C6B] uppercase tracking-wider mb-3">{ar ? 'لوحة مؤشرات الأداء' : 'KPI Dashboard'}</h4>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-xs">
                  <thead><tr className="bg-muted border-b border-border">
                    <th className="px-4 py-2 text-left font-bold text-muted-foreground uppercase">{ar ? 'المؤشر' : 'KPI'}</th>
                    <th className="px-4 py-2 text-center font-bold text-muted-foreground uppercase">{ar ? 'الوضع الحالي' : 'Baseline'}</th>
                    <th className="px-4 py-2 text-center font-bold text-muted-foreground uppercase">{ar ? 'الهدف' : 'Target'}</th>
                    <th className="px-4 py-2 text-center font-bold text-muted-foreground uppercase">{ar ? 'الإطار الزمني' : 'Timeframe'}</th>
                  </tr></thead>
                  <tbody>{solution.kpiDashboard.map((row, i) => (
                    <tr key={i} className={`border-b border-border ${i%2===0?'bg-white':'bg-muted/20'}`}>
                      <td className="px-4 py-2 font-semibold">{row.kpi}</td>
                      <td className="px-4 py-2 text-center text-muted-foreground">{row.baseline}</td>
                      <td className="px-4 py-2 text-center font-bold text-emerald-700">{row.target}</td>
                      <td className="px-4 py-2 text-center text-[#082C6B] font-semibold">{row.timeframe}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}
          <div className="bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-xl p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-[#C9A84C] mb-1">{ar ? 'الخطوة التالية الفورية' : 'Immediate Next Step'}</p>
            <p className="text-sm font-semibold">{solution.nextStep}</p>
          </div>
          {/* Sustainability + Resiliency */}
          {(solution.sustainabilityImpact || solution.resiliencyImpact) && (
            <div className="grid sm:grid-cols-2 gap-4">
              {solution.sustainabilityImpact && <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4"><p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">{ar ? 'أثر الاستدامة' : 'Sustainability Impact'}</p><p className="text-sm text-emerald-900 leading-relaxed">{solution.sustainabilityImpact}</p></div>}
              {solution.resiliencyImpact && <div className="bg-blue-50 border border-blue-200 rounded-xl p-4"><p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">{ar ? 'أثر المرونة' : 'Resiliency Impact'}</p><p className="text-sm text-blue-900 leading-relaxed">{solution.resiliencyImpact}</p></div>}
            </div>
          )}
          {/* Satisfaction */}
          {!escalated && (
            <div className="rounded-xl border border-border p-5 space-y-3">
              <h4 className="text-sm font-bold text-[#082C6B]">{ar ? 'ما مدى رضاك عن هذا الحل؟' : 'How satisfied are you with this solution?'}</h4>
              <div className="flex gap-2 items-center">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setSatisfaction(n)}
                    className={`w-10 h-10 rounded-full border text-sm font-bold transition-all ${satisfaction >= n ? 'bg-[#C9A84C] text-white border-[#C9A84C]' : 'bg-white text-muted-foreground border-border hover:border-[#C9A84C]'}`}>
                    {n}
                  </button>
                ))}
                {satisfaction > 0 && <span className={`text-sm text-muted-foreground ${ar ? 'mr-2' : 'ml-2'}`}>{satisfaction >= 4 ? (ar ? '— ممتاز!' : '— Great!') : (ar ? '— دعنا نحسّنه' : '— Let us improve')}</span>}
              </div>
              {satisfaction > 0 && satisfaction < 4 && (
                <div className="space-y-2">
                  <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={3}
                    placeholder={ar ? 'ما الذي تريد تحسينه أو توضيحه؟' : 'What would you like improved or clarified?'}
                    className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#082C6B]/30 resize-none" />
                  <Button onClick={refineSolution} disabled={!feedback.trim()} className="bg-[#082C6B] hover:bg-[#0B3D91] text-white text-sm">
                    <RefreshCw className={`w-3 h-3 ${ar ? 'ml-1' : 'mr-1'}`} />{ar ? 'تحسين الحل' : 'Refine Solution'}
                  </Button>
                </div>
              )}
            </div>
          )}
          {/* Escalate CTA */}
          <div className="bg-[#082C6B] rounded-2xl p-6 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-white font-bold text-base">{ar ? "تريد متابعة شخصية من ما'ين الحقاش؟" : "Need personalised follow-up from Ma'in?"}</p>
              <p className="text-white/70 text-sm mt-1">{escalated ? (ar ? 'تم الإرسال! ستتلقى ردًا خلال 4 ساعات عمل.' : 'Escalated! Response within 4 business hours.') : (ar ? 'أرسل تحديك وتشخيصك لما\'ين مباشرة' : "Send your AI diagnosis to Ma'in for a human consultation.")}</p>
            </div>
            {!escalated ? (
              <div className="flex gap-2 flex-wrap">
                <Button onClick={escalate} className="bg-[#C9A84C] hover:bg-[#b8973e] text-white font-bold shrink-0">
                  <MessageSquare className={`w-4 h-4 ${ar ? 'ml-2' : 'mr-2'}`} />{ar ? 'إحالة للمستشار' : 'Escalate to Consultant'}
                </Button>
                <Link href="/consultant">
                  <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 shrink-0">
                    {ar ? 'احجز موعداً' : 'Book Consultation'} {ar ? <ArrowLeft className="w-4 h-4 mr-1" /> : <ArrowRight className="w-4 h-4 ml-1" />}
                  </Button>
                </Link>
              </div>
            ) : <CheckCircle2 className="w-8 h-8 text-[#C9A84C]" />}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'benchmark',   label: 'GCC Benchmark Radar',   icon: Target,      desc: 'Compare your KPIs against GCC quartiles' },
  { id: 'savings',     label: 'Savings Calculator',     icon: TrendingUp,  desc: 'Model your savings potential by initiative' },
  { id: 'risk',        label: 'Risk Exposure Score',    icon: ShieldAlert, desc: 'Quantify and prioritise supply chain risk' },
  { id: 'briefing',    label: 'AI Executive Briefing',  icon: Brain,       desc: 'Receive a personalised, AI-generated strategy report' },
  { id: 'consultancy', label: 'AI Consultancy Engine',  icon: Sparkles,    desc: 'Full AI diagnostic & solution workflow — SCOR, Lean, Six Sigma, ISO 31000' },
] as const;
type TabId = typeof TABS[number]['id'];

const TAB_LABELS_AR: Record<string, { label: string; desc: string }> = {
  benchmark:   { label: 'رادار المعيار الخليجي',   desc: 'قارن مؤشراتك بنظراء الخليج' },
  savings:     { label: 'حاسبة التوفير',            desc: 'احسب إمكانات التوفير المحتملة' },
  risk:        { label: 'مؤشر المخاطر',             desc: 'قيّم مخاطر سلسلة التوريد' },
  briefing:    { label: 'التقرير التنفيذي الذكي',   desc: 'تقرير استراتيجي مخصص بالذكاء الاصطناعي' },
  consultancy: { label: 'محرك الاستشارات الذكي',    desc: 'تشخيص وحل كامل بالذكاء الاصطناعي' },
};

const STAT_ITEMS = [
  { value: '14%', label: 'avg. procurement savings unlocked by ISC clients' },
  { value: '23d',  label: 'average reduction in procurement cycle time' },
  { value: '38%', label: 'reduction in supply chain disruption exposure' },
  { value: '6mo', label: 'typical payback period for ISC engagements' },
];

export function CommandCenter() {
  const [tab,  setTab]  = useState<TabId>('benchmark');
  const { lang } = useLanguage();
  const ar = lang === 'ar';

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative bg-[#082C6B] overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,#C9A84C,transparent)]" />
        <div className="container mx-auto px-4 py-16 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[#C9A84C] text-xs font-bold uppercase tracking-[0.2em]">ISC Intelligence Platform</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
              Supply Chain<br /><span className="text-[#C9A84C]">Command Centre</span>
            </h1>
            <p className="text-white/70 text-lg leading-relaxed max-w-2xl">
              The GCC's most advanced AI supply chain intelligence hub. Benchmark your KPIs, model savings potential, score your risk exposure, and receive an AI-generated executive strategy briefing — all in minutes, not months.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
            {STAT_ITEMS.map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <p className="text-2xl font-black text-[#C9A84C]">{s.value}</p>
                <p className="text-white/70 text-xs mt-1 leading-relaxed">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Tabs + Content */}
      <section className="container mx-auto px-4 py-10">
        {/* Tab Nav */}
        <div className={`grid grid-cols-2 md:grid-cols-5 gap-3 mb-8 ${ar ? 'direction-rtl' : ''}`}>
          {TABS.map(t => {
            const Icon = t.icon;
            const arLabels = TAB_LABELS_AR[t.id];
            const label = ar ? arLabels.label : t.label;
            const desc  = ar ? arLabels.desc  : t.desc;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`rounded-xl p-4 text-left border transition-all ${tab === t.id ? 'bg-[#082C6B] text-white border-[#082C6B] shadow-lg' : 'bg-white text-foreground border-border hover:border-[#082C6B]/40 hover:shadow-sm'}`}>
                <Icon className={`w-5 h-5 mb-2 ${tab === t.id ? 'text-[#C9A84C]' : 'text-[#082C6B]'}`} />
                <p className="font-bold text-sm leading-tight">{label}</p>
                <p className={`text-xs mt-1 leading-relaxed ${tab === t.id ? 'text-white/70' : 'text-muted-foreground'}`}>{desc}</p>
              </button>
            );
          })}
        </div>

        {/* Active Panel */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
              {tab === 'benchmark'   && <BenchmarkTab lang={lang} />}
              {tab === 'savings'     && <SavingsTab lang={lang} />}
              {tab === 'risk'        && <RiskTab lang={lang} />}
              {tab === 'briefing'    && <BriefingTab lang={lang} />}
              {tab === 'consultancy' && <ConsultancyTab lang={lang} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── How We Compare ──────────────────────────────────────────────── */}
        <div className="mt-10 rounded-2xl overflow-hidden border border-border">
          <div className="bg-[#082C6B] px-6 py-4">
            <h3 className="text-white font-black text-base">How ISC Command Centre Compares</h3>
            <p className="text-white/60 text-xs mt-0.5">The only AI supply chain intelligence platform built for the GCC — CIPS-grounded, affordable plans sized to your organisation.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider bg-muted w-44">What you need</th>
                  <th className="px-5 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider bg-muted">Traditional Consultant</th>
                  <th className="px-5 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider bg-muted">McKinsey / Big-4</th>
                  <th className="px-5 py-3 text-center text-xs font-black uppercase tracking-wider bg-[#082C6B]/8 text-[#082C6B]">⚡ ISC Command Centre</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Time to first insight',         '2 – 4 weeks',        '3 – 6 months',        '60 seconds'],
                  ['Cost',                          'SAR 50K – 150K',     'SAR 500K – 2M+',      'SAR 250 – 2,500 / mo'],
                  ['GCC & Vision 2030 expertise',   '⚠️ Variable',         '⚠️ Variable',          '✅ Embedded'],
                  ['CIPS / APICS SCOR grounding',   '⚠️ Variable',         '❌ Rarely',            '✅ Always'],
                  ['Personalised to your data',     '✅ Manual',           '✅ Manual',            '✅ AI-powered'],
                  ['Quantified SAR impact',         '✅ Yes (delayed)',    '✅ Yes (delayed)',     '✅ Instant'],
                  ['90-day actionable roadmap',     '✅ Yes (weeks)',      '✅ Yes (months)',      '✅ In 60 seconds'],
                  ['Immediate next steps',          '⚠️ After engagement', '⚠️ After engagement', '✅ Right now'],
                ].map(([label, trad, big4, isc], i) => (
                  <tr key={i} className={`border-b border-border ${i % 2 === 0 ? 'bg-white' : 'bg-muted/30'}`}>
                    <td className="px-5 py-3 text-xs font-semibold text-foreground">{label}</td>
                    <td className="px-5 py-3 text-center text-xs text-muted-foreground">{trad}</td>
                    <td className="px-5 py-3 text-center text-xs text-muted-foreground">{big4}</td>
                    <td className="px-5 py-3 text-center text-xs font-bold text-[#082C6B] bg-[#082C6B]/5">{isc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-[#C9A84C]" />
            <p className="text-sm text-muted-foreground">These tools are powered by ISC's GCC benchmark database and 20+ years of hands-on transformation experience.</p>
          </div>
          <Link href="/consultant">
            <Button className="bg-[#082C6B] hover:bg-[#0B3D91] text-white shrink-0">
              Talk to Ma'in <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
