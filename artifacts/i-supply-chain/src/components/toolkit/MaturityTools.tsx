/**
 * Generic Maturity Self-Assessment + Action Tracker
 * Works across: resiliency, value-engineering, process-improvement-policy,
 *               lean-agile-supply-chain, supply-chain-strategy, sustainability-esg, digital-transformation
 * When no slug is supplied, renders the generic 5-domain
 * (Strategy / People / Process / Technology / Governance) assessment.
 */
import React, { useState, useCallback, useRef } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import { Download } from 'lucide-react';
import { ActionTracker } from './Primitives';
import { safeSetItem } from '@/lib/storage';
import { useAIPlan } from '@/hooks/useAIPlan';

/** Stable server-side key for the Maturity AI plan slot. */
export const MATURITY_TOOL_KEY = 'maturity' as const;
import { AIPlanPanel } from '@/components/AIPlanPanel';

interface MaturityToolsProps { slug?: string; isAr: boolean; }

interface MaturityDim { id: string; label: string; labelAr: string; desc: string; descAr: string; }

/* ── helper ── */
function downloadText(filename: string, content: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ── Generic 5-domain set (Strategy / People / Process / Technology / Governance) ── */
const GENERIC_DIMS: MaturityDim[] = [
  { id: 'strategy',   label: 'Strategy & Planning',       labelAr: 'الاستراتيجية والتخطيط',     desc: 'SC strategy aligned to corporate objectives with SCOR baseline', descAr: 'استراتيجية سلسلة الإمداد متوافقة مع الأهداف المؤسسية' },
  { id: 'people',     label: 'People & Capability',       labelAr: 'الكوادر والقدرات',           desc: 'Competency frameworks, training plans, and CIPS certification levels', descAr: 'أطر الكفاءات وخطط التدريب ومستويات الشهادات' },
  { id: 'process',    label: 'Process & Efficiency',      labelAr: 'العمليات والكفاءة',          desc: 'Documented SOPs, CI programme, and process automation coverage', descAr: 'إجراءات موثَّقة وبرنامج تحسين مستمر وتغطية الأتمتة' },
  { id: 'technology', label: 'Technology & Data',         labelAr: 'التكنولوجيا والبيانات',      desc: 'ERP utilisation, analytics capability, and data quality', descAr: 'استخدام ERP وقدرة التحليلات وجودة البيانات' },
  { id: 'governance', label: 'Governance & Compliance',   labelAr: 'الحوكمة والامتثال',          desc: 'Policy suite, DoA, audit frequency, and ESG compliance', descAr: 'مجموعة السياسات وتفويض الصلاحيات وتكرار التدقيق وامتثال ESG' },
];

const SLUG_DIMS: Record<string, MaturityDim[]> = {
  'resiliency': [
    { id: 'visibility', label: 'Supply Chain Visibility', labelAr: 'رؤية سلسلة الإمداد', desc: 'End-to-end visibility across all tiers', descAr: 'الرؤية من طرف لطرف عبر جميع المستويات' },
    { id: 'dual_source', label: 'Dual-Source Coverage', labelAr: 'تغطية التوريد الثنائي', desc: 'Critical items with qualified alternate source', descAr: 'الأصناف الحرجة التي لها مصدر بديل مؤهَّل' },
    { id: 'bcp', label: 'BCP Maturity', labelAr: 'نضج خطة الاستمرارية', desc: 'Documented, tested, and updated BCP', descAr: 'خطة استمرارية موثَّقة ومختبَرة ومحدَّثة' },
    { id: 'kri', label: 'Risk Monitoring (KRI)', labelAr: 'مراقبة المخاطر (KRI)', desc: 'Live KRI tracking with escalation protocol', descAr: 'تتبُّع KRI المباشر مع بروتوكول تصعيد' },
    { id: 'recovery', label: 'Recovery Speed', labelAr: 'سرعة التعافي', desc: 'Ability to restore operations within target RTO', descAr: 'القدرة على استعادة العمليات ضمن هدف زمن التعافي' },
  ],
  'value-engineering': [
    { id: 'function', label: 'Function Analysis', labelAr: 'التحليل الوظيفي', desc: 'Systematic function identification before cost work', descAr: 'تحديد الوظائف بشكل منهجي قبل عمل التكلفة' },
    { id: 'should_cost', label: 'Should-Cost Modelling', labelAr: 'نمذجة التكلفة المتوقّعة', desc: 'Bottom-up should-cost for top categories', descAr: 'تكلفة متوقَّعة من القاعدة إلى الأعلى للفئات الرئيسية' },
    { id: 'cross_func', label: 'Cross-Functional VE', labelAr: 'هندسة القيمة متعددة الوظائف', desc: 'Engineering, quality, procurement collaborating on VE', descAr: 'تعاون الهندسة والجودة والمشتريات في هندسة القيمة' },
    { id: 'conversion', label: 'Idea Conversion Rate', labelAr: 'معدّل تحويل الأفكار', desc: '% of VE ideas approved and implemented', descAr: 'نسبة أفكار هندسة القيمة المعتمدة والمطبَّقة' },
    { id: 'tracking', label: 'Savings Tracking', labelAr: 'تتبُّع الوفورات', desc: 'VE savings tracked and reported to leadership', descAr: 'وفورات هندسة القيمة مُتتبَّعة ومُبلَّغ عنها للقيادة' },
  ],
  'process-improvement-policy': [
    { id: 'documentation', label: 'Process Documentation', labelAr: 'توثيق العمليات', desc: '% of key processes with up-to-date SOPs', descAr: 'نسبة العمليات الرئيسية ذات الإجراءات المحدَّثة' },
    { id: 'compliance', label: 'Policy Compliance', labelAr: 'امتثال السياسات', desc: 'Measured compliance rate against documented policies', descAr: 'معدّل الامتثال المقيَّس مقابل السياسات الموثَّقة' },
    { id: 'improvement', label: 'Continuous Improvement', labelAr: 'التحسين المستمر', desc: 'Structured CI programme with governance', descAr: 'برنامج تحسين مستمر منظَّم مع حوكمة' },
    { id: 'automation', label: 'Process Automation', labelAr: 'أتمتة العمليات', desc: 'Key processes embedded in ERP/workflow systems', descAr: 'العمليات الرئيسية مضمَّنة في ERP/أنظمة سير العمل' },
    { id: 'measurement', label: 'Performance Measurement', labelAr: 'قياس الأداء', desc: 'KPIs defined and tracked for all key processes', descAr: 'مؤشرات الأداء محدَّدة ومُتتبَّعة لجميع العمليات الرئيسية' },
  ],
  'lean-agile-supply-chain': [
    { id: 'waste', label: 'Waste Identification', labelAr: 'تحديد الهدر', desc: 'VSM and waste identification capability', descAr: 'قدرة رسم VSM وتحديد الهدر' },
    { id: 'flow', label: 'Flow & Pull', labelAr: 'التدفّق والسحب', desc: 'Pull-based replenishment across key processes', descAr: 'إعادة التموين القائمة على السحب عبر العمليات الرئيسية' },
    { id: 'kaizen', label: 'Kaizen Culture', labelAr: 'ثقافة Kaizen', desc: 'Regular improvement events and CI governance', descAr: 'فعاليات تحسين منتظمة وحوكمة التحسين المستمر' },
    { id: 'standard', label: 'Standard Work', labelAr: 'العمل المعياري', desc: '% of processes with documented standard work', descAr: 'نسبة العمليات التي لها عمل معياري موثَّق' },
    { id: 'agility', label: 'Demand Agility', labelAr: 'رشاقة الطلب', desc: 'Speed of response to demand changes', descAr: 'سرعة الاستجابة لتغيّرات الطلب' },
  ],
  'supply-chain-strategy': [
    { id: 'alignment', label: 'Corporate Alignment', labelAr: 'المواءمة المؤسسية', desc: 'SC strategy explicitly linked to corporate objectives', descAr: 'استراتيجية سلسلة الإمداد مرتبطة صراحةً بالأهداف المؤسسية' },
    { id: 'baseline', label: 'SCOR Baseline', labelAr: 'خط أساس SCOR', desc: 'All Level-1 SCOR KPIs baselined and benchmarked', descAr: 'جميع مؤشرات SCOR المستوى الأول مؤسَّسة ومقارَنة بمرجع' },
    { id: 'ibp', label: 'IBP / S&OP Maturity', labelAr: 'نضج IBP / S&OP', desc: 'Cross-functional planning rhythm established', descAr: 'إيقاع التخطيط متعدد الوظائف مُرسَّخ' },
    { id: 'network', label: 'Network Optimisation', labelAr: 'تحسين الشبكة', desc: 'Supply chain network designed for cost and resilience', descAr: 'شبكة سلسلة الإمداد مصمَّمة للتكلفة والمرونة' },
    { id: 'talent', label: 'SC Talent Capability', labelAr: 'قدرات كفاءات سلسلة الإمداد', desc: 'Team competency aligned to strategy requirements', descAr: 'كفاءة الفريق متوائمة مع متطلبات الاستراتيجية' },
  ],
  'sustainability-esg': [
    { id: 'measurement', label: 'GHG Measurement', labelAr: 'قياس غازات الدفيئة', desc: 'Scope 1, 2, and 3 measured and reported', descAr: 'النطاقات 1 و2 و3 مقيَّسة ومُبلَّغ عنها' },
    { id: 'supplier_esg', label: 'Supplier ESG Governance', labelAr: 'حوكمة ESG للمورّدين', desc: '% of strategic suppliers with ESG audit', descAr: 'نسبة المورّدين الاستراتيجيين الذين خضعوا لتدقيق ESG' },
    { id: 'local', label: 'Local Content', labelAr: 'المحتوى المحلي', desc: 'Iktva / local content score and improvement programme', descAr: 'درجة Iktva / المحتوى المحلي وبرنامج التحسين' },
    { id: 'policy', label: 'Sustainable Procurement Policy', labelAr: 'سياسة المشتريات المستدامة', desc: 'Formal policy covering ESG minimum standards', descAr: 'سياسة رسمية تغطّي معايير ESG الدنيا' },
    { id: 'reporting', label: 'ESG Reporting', labelAr: 'إبلاغ ESG', desc: 'Annual ESG report published with supply chain data', descAr: 'تقرير ESG سنوي منشور بيانات سلسلة الإمداد' },
  ],
  'digital-transformation': [
    { id: 'erp', label: 'ERP Utilisation', labelAr: 'استخدام ERP', desc: 'Key procurement modules fully adopted', descAr: 'وحدات المشتريات الرئيسية مُتبنَّاة بالكامل' },
    { id: 'automation', label: 'Process Automation', labelAr: 'أتمتة العمليات', desc: '% of routine procurement steps automated', descAr: 'نسبة الخطوات الروتينية في المشتريات المؤتمَتة' },
    { id: 'data', label: 'Data Quality', labelAr: 'جودة البيانات', desc: 'Master data accuracy and completeness', descAr: 'دقّة البيانات الرئيسية واكتمالها' },
    { id: 'analytics', label: 'Analytics & Reporting', labelAr: 'التحليلات والتقارير', desc: 'Real-time dashboards and KPI visibility', descAr: 'لوحات معلومات لحظية ومرئية لمؤشرات الأداء' },
    { id: 'adoption', label: 'Digital Adoption', labelAr: 'تبنّي الرقمنة', desc: '% of team actively using digital tools', descAr: 'نسبة الفريق الذي يستخدم الأدوات الرقمية فعلياً' },
  ],
  'governance-compliance': [
    { id: 'policy', label: 'Procurement Policy Suite', labelAr: 'مجموعة سياسات المشتريات', desc: 'Documented, approved, current policies covering all activities', descAr: 'سياسات موثَّقة ومعتمَدة وحالية تغطّي جميع الأنشطة' },
    { id: 'audit', label: 'Internal Audit Maturity', labelAr: 'نضج التدقيق الداخلي', desc: 'Frequency, scope, and action-tracking of procurement audits', descAr: 'تكرار ونطاق وتتبّع إجراءات تدقيق المشتريات' },
    { id: 'supplier_compliance', label: 'Supplier Compliance Programme', labelAr: 'برنامج امتثال المورّدين', desc: 'Code of conduct, screening, and ESG audit coverage', descAr: 'مدوّنة السلوك والفحص والتغطية بالتدقيق ESG' },
    { id: 'doa', label: 'Delegation of Authority', labelAr: 'تفويض الصلاحيات', desc: 'DoA clarity, enforcement, and ERP integration', descAr: 'وضوح تفويض الصلاحيات وتطبيقه وتكاملهم مع ERP' },
    { id: 'reporting', label: 'Compliance Reporting', labelAr: 'إبلاغ الامتثال', desc: 'Board/management reporting on compliance KPIs', descAr: 'الإبلاغ للمجلس/الإدارة عن مؤشرات الامتثال' },
  ],
};

const MATURITY_BANDS = [
  { min: 4.5, label: 'World Class',   labelAr: 'مستوى عالمي',  color: '#059669', desc: 'Top 10% of GCC organisations',               descAr: 'أفضل 10% من المنشآت الخليجية' },
  { min: 3.5, label: 'Advanced',      labelAr: 'متقدّم',        color: '#10b981', desc: 'Above GCC benchmark',                         descAr: 'فوق المعيار المرجعي الخليجي' },
  { min: 2.5, label: 'Developing',    labelAr: 'ناشئ',          color: '#f59e0b', desc: 'At GCC average, improvement opportunity',     descAr: 'عند متوسط الخليج، فرصة تحسين' },
  { min: 1,   label: 'Foundational',  labelAr: 'تأسيسي',        color: '#ef4444', desc: 'Below GCC benchmark, urgent action needed',   descAr: 'دون المعيار الخليجي، إجراء عاجل مطلوب' },
];

function getMatureBand(score: number) {
  return MATURITY_BANDS.find(b => score >= b.min) ?? MATURITY_BANDS[MATURITY_BANDS.length - 1];
}

/* ── Gap action hints per generic dimension ── */
const GAP_ACTIONS: Record<string, { en: string; ar: string }[]> = {
  strategy:   [
    { en: 'Develop a 3-year SC strategy document linked to Vision 2030 objectives', ar: 'وضع وثيقة استراتيجية 3 سنوات مرتبطة بأهداف رؤية 2030' },
    { en: 'Establish SCOR Level-1 baseline KPIs and benchmark against GCC peers', ar: 'إنشاء مؤشرات SCOR المستوى 1 ومقارنتها بنظرائها الخليجيين' },
    { en: 'Launch a monthly S&OP/IBP rhythm with cross-functional participation', ar: 'إطلاق إيقاع S&OP/IBP شهري بمشاركة متعددة الوظائف' },
  ],
  people:     [
    { en: 'Map current team competencies against CIPS/APICS frameworks', ar: 'رسم كفاءات الفريق الحالية مقابل أطر CIPS/APICS' },
    { en: 'Design a 12-month training calendar with CIPS L4/L5 pathway', ar: 'تصميم تقويم تدريبي 12 شهرًا مع مسار CIPS L4/L5' },
    { en: 'Introduce a mentoring scheme pairing senior and junior SC professionals', ar: 'إدخال برنامج إرشاد يربط المهنيين الكبار والجدد في سلسلة الإمداد' },
  ],
  process:    [
    { en: 'Identify and document top 10 high-value procurement processes as SOPs', ar: 'تحديد وتوثيق أهم 10 عمليات مشتريات ذات قيمة عالية' },
    { en: 'Launch a structured CI programme with monthly kaizen cadence', ar: 'إطلاق برنامج تحسين مستمر منظَّم بإيقاع kaizen شهري' },
    { en: 'Automate at least 3 routine purchase-to-pay steps in ERP', ar: 'أتمتة 3 خطوات روتينية على الأقل في دورة الشراء حتى الدفع ضمن ERP' },
  ],
  technology: [
    { en: 'Conduct an ERP utilisation audit and close gaps in unused modules', ar: 'إجراء تدقيق استخدام ERP وسد الثغرات في الوحدات غير المستخدمة' },
    { en: 'Implement a procurement analytics dashboard with weekly refresh', ar: 'تطبيق لوحة تحليلات مشتريات بتحديث أسبوعي' },
    { en: 'Launch a master data quality programme (suppliers, items, contracts)', ar: 'إطلاق برنامج جودة البيانات الرئيسية (الموردون، الأصناف، العقود)' },
  ],
  governance: [
    { en: 'Publish a consolidated procurement policy suite covering all spend categories', ar: 'نشر مجموعة سياسات مشتريات موحَّدة تغطي جميع فئات الإنفاق' },
    { en: 'Establish quarterly internal procurement audits with formal action-tracking', ar: 'إرساء تدقيق مشتريات داخلي ربع سنوي مع تتبُّع الإجراءات الرسمي' },
    { en: 'Define and enforce a Delegation of Authority matrix in ERP', ar: 'تحديد وتطبيق مصفوفة تفويض الصلاحيات في نظام ERP' },
  ],
};

function buildMaturityProfileText(
  slug: string | undefined,
  dims: MaturityDim[],
  scores: Record<string, number>,
  avg: number,
  band: typeof MATURITY_BANDS[0] | null,
  isAr: boolean,
): string {
  const date = new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-GB');
  const lines = [
    isAr ? '═══════════════════════════════════════════' : '═══════════════════════════════════════════',
    isAr ? `   تقرير نضج سلسلة الإمداد — ${date}` : `   Supply Chain Maturity Profile — ${date}`,
    isAr ? '═══════════════════════════════════════════' : '═══════════════════════════════════════════',
    '',
    isAr ? `الموضوع: ${slug ?? 'تقييم عام'}` : `Assessment: ${slug ?? 'General Maturity Assessment'}`,
    isAr ? `الدرجة الإجمالية: ${avg.toFixed(2)} / 5.0` : `Overall Score: ${avg.toFixed(2)} / 5.0`,
    isAr ? `مستوى النضج: ${band ? band.labelAr : '—'}` : `Maturity Band: ${band ? band.label : '—'}`,
    isAr ? `وصف المستوى: ${band ? band.descAr : '—'}` : `Band Description: ${band ? band.desc : '—'}`,
    '',
    isAr ? '─── تفاصيل الأبعاد ──────────────────────' : '─── Dimension Detail ─────────────────────',
    '',
  ];
  const LEVEL_EN: Record<number, string> = { 0: 'Not assessed', 1: 'Foundational', 2: 'Developing', 3: 'Competent', 4: 'Advanced', 5: 'World Class' };
  const LEVEL_AR: Record<number, string> = { 0: 'غير مقيَّم', 1: 'تأسيسي', 2: 'ناشئ', 3: 'مؤهَّل', 4: 'متقدّم', 5: 'عالمي' };
  dims.forEach(d => {
    const v = scores[d.id] ?? 0;
    const label = isAr ? LEVEL_AR[v] : LEVEL_EN[v];
    const bar = '█'.repeat(v) + '░'.repeat(5 - v);
    lines.push(isAr
      ? `  ${d.labelAr.padEnd(30)}  ${bar}  ${v}/5 — ${label}`
      : `  ${d.label.padEnd(30)}  ${bar}  ${v}/5 — ${label}`);
  });
  lines.push('');
  lines.push(isAr ? '─── الفجوات والأولويات ───────────────────' : '─── Gap Analysis & Priorities ─────────────');
  lines.push('');
  const gaps = dims.filter(d => (scores[d.id] ?? 0) > 0 && (scores[d.id] ?? 5) < 4)
    .sort((a, b) => (scores[a.id] ?? 5) - (scores[b.id] ?? 5));
  if (gaps.length === 0) {
    lines.push(isAr ? '  ✓ لا توجد فجوات حرجة — جميع الأبعاد المقيَّمة عند المستوى 4 أو أعلى' : '  ✓ No critical gaps — all assessed dimensions at Level 4 or above');
  } else {
    gaps.forEach((d, i) => {
      const v = scores[d.id] ?? 0;
      lines.push(isAr
        ? `  ${i + 1}. ${d.labelAr} (${v}/5) — فجوة ${4 - v} مستويات حتى "متقدّم"`
        : `  ${i + 1}. ${d.label} (${v}/5) — gap of ${4 - v} level${4 - v !== 1 ? 's' : ''} to reach "Advanced"`);
    });
  }
  lines.push('');
  lines.push(isAr ? '─── المرحلة القادمة (90 يومًا) ──────────' : '─── Suggested 90-Day Actions ──────────────');
  lines.push('');
  gaps.slice(0, 3).forEach((d, i) => {
    const actions = (GAP_ACTIONS[d.id] ?? []).slice(0, 2);
    lines.push(isAr ? `  الأولوية ${i + 1}: ${d.labelAr}` : `  Priority ${i + 1}: ${d.label}`);
    actions.forEach(a => lines.push(isAr ? `    • ${a.ar}` : `    • ${a.en}`));
    lines.push('');
  });
  lines.push('');
  lines.push(isAr ? '═══════════════════════════════════════════' : '═══════════════════════════════════════════');
  return lines.join('\n');
}

export function MaturityAssessmentTool({ slug, isAr }: MaturityToolsProps) {
  const SK = `isc-tool-maturity-${slug ?? 'generic'}`;
  const dims = slug ? (SLUG_DIMS[slug] ?? SLUG_DIMS['resiliency']) : GENERIC_DIMS;

  const [scores, setScores] = useState<Record<string, number>>(() => {
    try { const s = localStorage.getItem(SK); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });
  const [targetScore] = useState<number>(4); // target = "Advanced" (level 4)

  /* ── Tab navigation ── */
  type MaturityTab = 'assess' | 'analysis' | 'ai';
  const MATURITY_TABS: { id: MaturityTab; icon: string; label: string; labelAr: string }[] = [
    { id: 'assess',   icon: '📋', label: 'Assessment',   labelAr: 'التقييم'        },
    { id: 'analysis', icon: '📊', label: 'Gap Analysis',  labelAr: 'تحليل الفجوات' },
    { id: 'ai',       icon: '✨', label: 'AI Roadmap',    labelAr: 'خارطة AI'       },
  ];
  const [activeTab, setActiveTab] = useState<MaturityTab>('assess');
  const tabListRef = useRef<HTMLDivElement>(null);
  const handleTabKey = useCallback((e: React.KeyboardEvent, idx: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = e.key === 'ArrowRight'
      ? (idx + 1) % MATURITY_TABS.length
      : (idx - 1 + MATURITY_TABS.length) % MATURITY_TABS.length;
    setActiveTab(MATURITY_TABS[next].id);
    (tabListRef.current?.querySelectorAll('[role="tab"]')[next] as HTMLElement | undefined)?.focus();
  }, []);

  const set = (id: string, val: number) => setScores(prev => {
    const next = { ...prev, [id]: val };
    safeSetItem(SK, JSON.stringify(next));
    return next;
  });

  const filled = dims.filter(d => scores[d.id] !== undefined);
  const avg = filled.length > 0 ? filled.reduce((s, d) => s + (scores[d.id] ?? 0), 0) / filled.length : 0;
  const band = avg > 0 ? getMatureBand(avg) : null;

  /* ── Radar data ── */
  const radarData = dims.map(d => ({
    dimension: isAr ? d.labelAr : d.label,
    [isAr ? 'الحالي' : 'Current']: scores[d.id] ?? 0,
    [isAr ? 'الهدف' : 'Target']: targetScore,
  }));

  /* ── Gap analysis ── */
  const gapDims = dims
    .filter(d => (scores[d.id] ?? 0) > 0 && (scores[d.id] ?? 5) < targetScore)
    .sort((a, b) => (scores[a.id] ?? 5) - (scores[b.id] ?? 5));

  /* ── AI Plan ── */
  const buildMaturityPrompt = useCallback((): string => {
    const nextBand = MATURITY_BANDS.find(b => b.min > avg);
    const dimLines = dims.map(d => {
      const v = scores[d.id];
      return v !== undefined
        ? `- **${d.label}**: ${v}/5 — ${d.desc}`
        : `- **${d.label}**: not yet assessed`;
    }).join('\n');
    const topGaps = dims
      .filter(d => scores[d.id] !== undefined && (scores[d.id] ?? 5) < 4)
      .sort((a, b) => (scores[a.id] ?? 5) - (scores[b.id] ?? 5))
      .slice(0, 3);
    return [
      `## Maturity Assessment: ${slug ?? 'General'}`,
      `Current score: ${avg.toFixed(1)}/5 → Level: ${band ? band.label : 'Not assessed'}`,
      `Next level: ${nextBand ? nextBand.label : 'Already World Class'} (requires ≥${nextBand?.min ?? 5}/5)`,
      '',
      '## Dimension Scores',
      dimLines,
      '',
      '## Your Task',
      'Generate a staged maturity improvement roadmap:',
      '1. State the current level and gap to the next maturity band',
      `2. Focus on these highest-priority dimensions: ${topGaps.map(d => d.label).join(', ') || 'all dimensions'}`,
      '3. For each priority dimension, provide 3–5 specific improvement initiatives as project briefs:',
      '   - Objective (what will be achieved)',
      '   - Success metric (how progress will be measured)',
      '   - Estimated effort: weeks or months',
      '4. Assign overall initiative priority labels [HIGH], [MEDIUM], or [LOW]',
      'Structure with one ## heading per priority dimension.',
    ].join('\n');
  }, [slug, scores, dims, avg, band]);

  const { loading: planLoading, result: planResult, evidenceSummary: planEvidenceSummary, error: planError, rateLimited: planRateLimited,
          retryAfterSeconds: planRetryAfterSeconds, generate: generatePlan, reset: resetPlan,
          savedPlan: planSavedPlan, viewSaved: viewSavedPlan, deleteSaved: deleteSavedPlan,
          saveError: planSaveError, dismissSaveError: dismissPlanSaveError } =
    useAIPlan(buildMaturityPrompt, isAr, MATURITY_TOOL_KEY, filled.length > 0);

  const LEVEL_COLORS = { 1: '#fca5a5', 2: '#fcd34d', 3: '#6ee7b7', 4: '#34d399', 5: '#059669' };
  const LEVEL_LABELS_AR = { 1: 'تأسيسي', 2: 'ناشئ', 3: 'مؤهَّل', 4: 'متقدّم', 5: 'عالمي' };
  const LEVEL_LABELS_EN = { 1: 'Foundational', 2: 'Developing', 3: 'Competent', 4: 'Advanced', 5: 'World Class' };

  const handleDownload = () => {
    const txt = buildMaturityProfileText(slug, dims, scores, avg, band, isAr);
    downloadText(`maturity-profile-${slug ?? 'general'}.txt`, txt);
  };

  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-border bg-purple-50">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-bold text-primary">{isAr ? '📈 تقييم النضج الذاتي' : '📈 Maturity Self-Assessment'}</p>
            <p className="text-xs text-muted-foreground mt-1">{isAr ? 'قيّم كل بُعد من 1 (تأسيسي) إلى 5 (عالمي)' : 'Rate each dimension 1 (Foundational) → 5 (World Class)'}</p>
          </div>
          <button
            onClick={handleDownload}
            disabled={filled.length === 0}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold bg-purple-200 text-purple-800 hover:bg-purple-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            {isAr ? 'تنزيل الملف الشخصي' : 'Download Profile'}
          </button>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div role="tablist" ref={tabListRef} className="flex gap-1 bg-slate-50 border-b border-slate-200 px-4 pt-3 overflow-x-auto">
        {MATURITY_TABS.map((t, idx) => (
          <button key={t.id}
            id={`${t.id}-tab`}
            role="tab"
            aria-selected={activeTab === t.id}
            aria-controls={`${t.id}-panel`}
            tabIndex={activeTab === t.id ? 0 : -1}
            onClick={() => setActiveTab(t.id)}
            onKeyDown={e => handleTabKey(e, idx)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-[12px] font-semibold whitespace-nowrap transition-all border-b-2 ${activeTab === t.id ? 'border-purple-600 text-purple-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
            <span>{t.icon}</span><span>{isAr ? t.labelAr : t.label}</span>
          </button>
        ))}
      </div>

      <div className="p-5">

        {/* ── Tab: Assessment ── */}
        {activeTab === 'assess' && <div role="tabpanel" id="assess-panel" aria-labelledby="assess-tab" className="space-y-5">

        {/* ── Dimension rating buttons ── */}
        <div className="space-y-3">
          {dims.map(d => {
            const val = scores[d.id] ?? 0;
            return (
              <div key={d.id} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-primary">{isAr ? d.labelAr : d.label}</p>
                  <p className="text-xs text-muted-foreground">{isAr ? d.descAr : d.desc}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {[1, 2, 3, 4, 5].map(l => (
                    <button key={l} onClick={() => set(d.id, val === l ? 0 : l)}
                      aria-label={isAr ? `${d.labelAr}: ${LEVEL_LABELS_AR[l as keyof typeof LEVEL_LABELS_AR]} (${l})` : `${d.label}: ${LEVEL_LABELS_EN[l as keyof typeof LEVEL_LABELS_EN]} (${l})`}
                      aria-pressed={val >= l}
                      className="w-8 h-8 rounded-lg text-xs font-bold border-2 transition-all"
                      style={{
                        background: val >= l ? LEVEL_COLORS[l as keyof typeof LEVEL_COLORS] : 'transparent',
                        borderColor: val >= l ? LEVEL_COLORS[l as keyof typeof LEVEL_COLORS] : '#e2e8f0',
                        color: val >= l && l >= 4 ? '#fff' : val >= l ? '#1e293b' : '#94a3b8',
                      }}>
                      {l}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground w-20 shrink-0 text-right">
                  {val > 0 ? (isAr ? LEVEL_LABELS_AR[val as keyof typeof LEVEL_LABELS_AR] : LEVEL_LABELS_EN[val as keyof typeof LEVEL_LABELS_EN]) : '—'}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Score badge ── */}
        {band && filled.length > 0 && (
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="rounded-xl p-4 text-center" style={{ background: band.color + '15', border: `1px solid ${band.color}40` }}>
              <p className="text-xs text-muted-foreground mb-1">{isAr ? 'درجة النضج' : 'Maturity Score'}</p>
              <p className="text-3xl font-extrabold" style={{ color: band.color }}>{avg.toFixed(1)}<span className="text-base font-normal">/5</span></p>
            </div>
            <div className="sm:col-span-2 rounded-xl p-4" style={{ background: band.color + '10', border: `1px solid ${band.color}30` }}>
              <p className="text-xs font-bold mb-1" style={{ color: band.color }}>{isAr ? band.labelAr : band.label}</p>
              <p className="text-xs text-muted-foreground">{isAr ? band.descAr : band.desc}</p>
              {filled.length < dims.length && (
                <p className="text-xs text-muted-foreground mt-2 italic">{isAr ? `${dims.length - filled.length} أبعاد لم تُقيَّم بعد` : `${dims.length - filled.length} dimensions not yet assessed`}</p>
              )}
            </div>
          </div>
        )}

        </div>} {/* end assess tab */}

        {/* ── Tab: Gap Analysis ── */}
        {activeTab === 'analysis' && <div role="tabpanel" id="analysis-panel" aria-labelledby="analysis-tab" className="space-y-5">

        {/* ── Radar chart: Current vs Target ── */}
        {filled.length >= 2 && (
          <div className="rounded-xl border border-border p-4">
            <p className="text-xs font-bold text-primary mb-3 uppercase tracking-widest">
              {isAr ? 'رادار النضج — الحالي مقابل الهدف (المستوى 4)' : 'Maturity Radar — Current vs. Target (Level 4)'}
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="68%">
                <PolarGrid />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 9, fill: '#6b7280' }} />
                <Radar
                  name={isAr ? 'الهدف' : 'Target'}
                  dataKey={isAr ? 'الهدف' : 'Target'}
                  stroke="#94a3b8"
                  fill="none"
                  strokeDasharray="5 3"
                  strokeWidth={1.5}
                />
                <Radar
                  name={isAr ? 'الحالي' : 'Current'}
                  dataKey={isAr ? 'الحالي' : 'Current'}
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip formatter={(v: number) => [`${v}/5`]} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 10 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Gap analysis ── */}
        {gapDims.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-3">
              {isAr ? 'تحليل الفجوات — خارطة التحسين (90 يومًا)' : 'Gap Analysis — 90-Day Improvement Roadmap'}
            </p>
            <div className="space-y-3">
              {gapDims.map((d, i) => {
                const v = scores[d.id] ?? 0;
                const gap = targetScore - v;
                const hints = (GAP_ACTIONS[d.id] ?? []).slice(0, 2);
                return (
                  <div key={d.id} className="bg-white border border-amber-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-amber-900">
                          {isAr ? d.labelAr : d.label}
                          <span className="ml-2 font-normal text-muted-foreground">
                            {isAr ? `${v}/5 — فجوة ${gap} مستوى` : `${v}/5 — gap of ${gap} level${gap !== 1 ? 's' : ''}`}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{isAr ? d.descAr : d.desc}</p>
                        {hints.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {hints.map((h, hi) => (
                              <li key={hi} className="text-xs text-amber-800 flex gap-1.5">
                                <span className="shrink-0">→</span>
                                <span>{isAr ? h.ar : h.en}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {gapDims.length === 0 && filled.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <p className="text-xs font-bold text-emerald-800">
              {isAr ? '✓ لا توجد فجوات حرجة — جميع الأبعاد المقيَّمة عند المستوى 4 أو أعلى' : '✓ No critical gaps — all assessed dimensions at Level 4 or above'}
            </p>
          </div>
        )}
        {filled.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">
            {isAr ? 'قيّم الأبعاد في علامة التبويب "التقييم" لعرض تحليل الفجوات.' : 'Rate dimensions in the Assessment tab to view gap analysis.'}
          </p>
        )}

        </div>} {/* end analysis tab */}

        {/* ── Tab: AI Roadmap ── */}
        {activeTab === 'ai' && <div role="tabpanel" id="ai-panel" aria-labelledby="ai-tab" className="space-y-5">
        <AIPlanPanel
          loading={planLoading}
          result={planResult}
          evidenceSummary={planEvidenceSummary}
          error={planError}
          onGenerate={generatePlan}
          onReset={resetPlan}
          buttonLabel={isAr ? 'توليد خارطة طريق النضج ✨' : 'Generate Maturity Roadmap ✨'}
          isAr={isAr}
          disabled={filled.length === 0}
          savedPlan={planSavedPlan}
          onViewSaved={viewSavedPlan}
          onDeleteSaved={deleteSavedPlan}
          rateLimited={planRateLimited}
          retryAfterSeconds={planRetryAfterSeconds}
          saveError={planSaveError}
          onDismissSaveError={dismissPlanSaveError}
          toolKey="maturity"
        />
        <ActionTracker storageKey={`isc-tool-actions-maturity-${slug ?? 'generic'}`} isAr={isAr} />
        </div>} {/* end ai tab */}

      </div>
    </div>
  );
}
