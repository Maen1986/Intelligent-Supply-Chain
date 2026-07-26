/**
 * Generic Maturity Self-Assessment + Action Tracker
 * Works across: resiliency, value-engineering, process-improvement-policy,
 *               lean-agile-supply-chain, supply-chain-strategy, sustainability-esg, digital-transformation
 */
import React, { useState } from 'react';
import { ActionTracker } from './Primitives';
import { safeSetItem } from '@/lib/storage';

interface MaturityToolsProps { slug: string; isAr: boolean; }

interface MaturityDim { id: string; label: string; labelAr: string; desc: string; descAr: string; }

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
  { min: 4.5, label: 'World Class', labelAr: 'مستوى عالمي', color: '#059669', desc: 'Top 10% of GCC organisations', descAr: 'أفضل 10% من المنشآت الخليجية' },
  { min: 3.5, label: 'Advanced', labelAr: 'متقدّم', color: '#10b981', desc: 'Above GCC benchmark', descAr: 'فوق المعيار المرجعي الخليجي' },
  { min: 2.5, label: 'Developing', labelAr: 'ناشئ', color: '#f59e0b', desc: 'At GCC average, improvement opportunity', descAr: 'عند متوسط الخليج، فرصة تحسين' },
  { min: 1, label: 'Foundational', labelAr: 'تأسيسي', color: '#ef4444', desc: 'Below GCC benchmark, urgent action needed', descAr: 'دون المعيار الخليجي، إجراء عاجل مطلوب' },
];

function getMatureBand(score: number) {
  return MATURITY_BANDS.find(b => score >= b.min) ?? MATURITY_BANDS[MATURITY_BANDS.length - 1];
}

export function MaturityAssessmentTool({ slug, isAr }: MaturityToolsProps) {
  const SK = `isc-tool-maturity-${slug}`;
  const dims = SLUG_DIMS[slug] ?? SLUG_DIMS['resiliency'];

  const [scores, setScores] = useState<Record<string, number>>(() => {
    try { const s = localStorage.getItem(SK); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });
  const set = (id: string, val: number) => setScores(prev => {
    const next = { ...prev, [id]: val };
    safeSetItem(SK, JSON.stringify(next));
    return next;
  });

  const filled = dims.filter(d => scores[d.id] !== undefined);
  const avg = filled.length > 0 ? filled.reduce((s, d) => s + (scores[d.id] ?? 0), 0) / filled.length : 0;
  const band = avg > 0 ? getMatureBand(avg) : null;

  const LEVEL_COLORS = { 1: '#fca5a5', 2: '#fcd34d', 3: '#6ee7b7', 4: '#34d399', 5: '#059669' };
  const LEVEL_LABELS_AR = { 1: 'تأسيسي', 2: 'ناشئ', 3: 'مؤهَّل', 4: 'متقدّم', 5: 'عالمي' };
  const LEVEL_LABELS_EN = { 1: 'Foundational', 2: 'Developing', 3: 'Competent', 4: 'Advanced', 5: 'World Class' };

  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-border bg-purple-50">
        <p className="text-sm font-bold text-primary">{isAr ? '📈 تقييم النضج الذاتي' : '📈 Maturity Self-Assessment'}</p>
        <p className="text-xs text-muted-foreground mt-1">{isAr ? 'قيّم كل بُعد من 1 (تأسيسي) إلى 5 (عالمي)' : 'Rate each dimension 1 (Foundational) → 5 (World Class)'}</p>
      </div>
      <div className="p-5 space-y-5">
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

        {/* Action Tracker */}
        <ActionTracker storageKey={`isc-tool-actions-maturity-${slug}`} isAr={isAr} />
      </div>
    </div>
  );
}
