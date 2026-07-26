/**
 * Contract Lifecycle Management (CLM) tools:
 * Contract Health Checker — 4-metric RAG dashboard + priority actions
 */
import React, { useState } from 'react';

interface CLMToolsProps { isAr: boolean; }

interface CLMDim {
  id: string; label: string; labelAr: string; unit: string; unitAr: string;
  greenMax: number; amberMax: number; higherIsBetter: boolean;
  desc: string; descAr: string;
  actions: string[]; actionsAr: string[];
}

const CLM_DIMS: CLMDim[] = [
  {
    id: 'authoring', label: 'Contract Authoring Cycle Time', labelAr: 'زمن دورة صياغة العقد', unit: 'days', unitAr: 'أيام',
    greenMax: 10, amberMax: 21, higherIsBetter: false,
    desc: 'Average days from request to fully executed contract', descAr: 'متوسط الأيام من الطلب إلى العقد المنفَّذ بالكامل',
    actions: ['Build a clause library for your top 5 contract types', 'Implement a pre-approved standard template', 'Automate negotiation workflow in CLM system'],
    actionsAr: ['بناء مكتبة بنود لأعلى 5 أنواع عقود', 'تطبيق نموذج معياري معتمد مسبقاً', 'أتمتة مسار التفاوض في نظام CLM'],
  },
  {
    id: 'deviation', label: 'Template Deviation Rate', labelAr: 'معدّل الانحراف عن النموذج', unit: '%', unitAr: '%',
    greenMax: 10, amberMax: 25, higherIsBetter: false,
    desc: '% of contracts with non-standard clauses requiring legal review', descAr: 'نسبة العقود ذات البنود غير المعيارية التي تتطلّب مراجعة قانونية',
    actions: ['Standardise clause options: approved variants for common scenarios', 'Require legal sign-off only for deviations exceeding SAR 500K contracts', 'Track deviation reasons monthly — fix root causes'],
    actionsAr: ['توحيد خيارات البنود: متغيّرات معتمدة للسيناريوهات الشائعة', 'اشتراط موافقة قانونية فقط للانحرافات في العقود التي تتجاوز 500 ألف ريال', 'تتبّع أسباب الانحراف شهرياً — معالجة الأسباب الجذرية'],
  },
  {
    id: 'renewal', label: 'On-Time Renewal Capture Rate', labelAr: 'معدّل التجديد في الوقت المحدد', unit: '%', unitAr: '%',
    greenMax: 100, amberMax: 100, higherIsBetter: true,
    desc: '% of contracts renewed before expiry without emergency sourcing', descAr: 'نسبة العقود المجدَّدة قبل انتهائها دون اللجوء إلى التوريد الطارئ',
    actions: ['Build a contract expiry calendar for next 12 months', 'Set automatic 90-day and 30-day renewal alerts', 'Start negotiation at 90 days before expiry — not 30'],
    actionsAr: ['بناء تقويم انتهاء العقود لـ 12 شهراً القادمة', 'تعيين تنبيهات تجديد تلقائية قبل 90 و30 يوماً', 'بدء التفاوض قبل 90 يوماً من الانتهاء — لا 30 يوماً'],
  },
  {
    id: 'leakage', label: 'Value Leakage Rate', labelAr: 'معدّل تسرّب القيمة', unit: '%', unitAr: '%',
    greenMax: 2, amberMax: 7, higherIsBetter: false,
    desc: '% of contracted value lost through non-enforcement or under-performance', descAr: 'نسبة القيمة التعاقدية المفقودة بسبب عدم التطبيق أو ضعف الأداء',
    actions: ['Implement 3-way match: PO / delivery / invoice for all critical contracts', 'Activate existing penalty clauses that are not being enforced', 'Monthly contract compliance review with each strategic supplier'],
    actionsAr: ['تطبيق المطابقة الثلاثية: أمر الشراء / التسليم / الفاتورة لجميع العقود الحرجة', 'تفعيل بنود الغرامات القائمة غير المُطبَّقة', 'مراجعة امتثال العقود شهرياً مع كل مورّد استراتيجي'],
  },
];

function getStatus(dim: CLMDim, value: number): 'green' | 'amber' | 'red' {
  if (dim.higherIsBetter) {
    if (value >= dim.greenMax) return 'green';
    if (value >= dim.amberMax) return 'amber';
    return 'red';
  } else {
    if (value <= dim.greenMax) return 'green';
    if (value <= dim.amberMax) return 'amber';
    return 'red';
  }
}

const STATUS_CONFIG = {
  green: { label: 'Healthy', labelAr: 'جيد', bg: 'bg-emerald-50 border-emerald-200', badge: 'bg-emerald-100 text-emerald-800', dot: '#22c55e' },
  amber: { label: 'At Risk', labelAr: 'في خطر', bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-800', dot: '#f59e0b' },
  red: { label: 'Critical', labelAr: 'حرج', bg: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-800', dot: '#ef4444' },
};

export function ContractHealthChecker({ isAr }: CLMToolsProps) {
  const SK = 'isc-tool-clm-health';
  const [values, setValues] = useState<Record<string, string>>(() => {
    try { const s = localStorage.getItem(SK); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });
  const set = (id: string, val: string) => setValues(prev => {
    const next = { ...prev, [id]: val };
    try { localStorage.setItem(SK, JSON.stringify(next)); } catch { }
    return next;
  });

  const [contracts, setContracts] = useState<string>(() => {
    try { return localStorage.getItem('isc-tool-clm-count') ?? ''; } catch { return ''; }
  });
  const setContractsVal = (v: string) => { setContracts(v); try { localStorage.setItem('isc-tool-clm-count', v); } catch { } };

  const statuses = CLM_DIMS.map(d => {
    const raw = parseFloat(values[d.id] ?? '');
    return { dim: d, value: raw, status: isNaN(raw) ? null as 'green' | 'amber' | 'red' | null : getStatus(d, raw) };
  });
  const filled = statuses.filter(s => s.status !== null);
  const redCount = filled.filter(s => s.status === 'red').length;
  const amberCount = filled.filter(s => s.status === 'amber').length;
  const overallHealth = filled.length === 0 ? null :
    redCount > 0 ? 'red' : amberCount > 0 ? 'amber' : 'green';

  const priorityActions = statuses.filter(s => s.status === 'red' || s.status === 'amber').flatMap(s => (isAr ? s.dim.actionsAr : s.dim.actions).slice(0, 2));

  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-border bg-violet-50">
        <p className="text-sm font-bold text-primary">{isAr ? '📋 فاحص صحة العقود' : '📋 Contract Health Checker'}</p>
        <p className="text-xs text-muted-foreground mt-1">{isAr ? 'أدخل أرقامك الفعلية — يُحدَّث RAG لحظياً' : 'Enter your actual metrics — RAG updates live'}</p>
      </div>
      <div className="p-5 space-y-5">
        <div>
          <label className="text-xs font-bold text-primary mb-1 block">{isAr ? 'عدد العقود النشطة' : 'Number of Active Contracts'}</label>
          <input type="number" className="w-36 text-sm border border-border rounded-lg px-3 py-1.5" placeholder="0" value={contracts} onChange={e => setContractsVal(e.target.value)} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {statuses.map(({ dim, value, status }) => {
            const cfg = status ? STATUS_CONFIG[status] : null;
            return (
              <div key={dim.id} className={`rounded-xl p-4 border ${cfg ? cfg.bg : 'bg-muted border-border'}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-xs font-bold text-primary">{isAr ? dim.labelAr : dim.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{isAr ? dim.descAr : dim.desc}</p>
                  </div>
                  {cfg && <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${cfg.badge}`}>{isAr ? cfg.labelAr : cfg.label}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" step="any" min={0} max={dim.unit === '%' ? 100 : undefined}
                    value={values[dim.id] ?? ''} onChange={e => set(dim.id, e.target.value)}
                    className="flex-1 text-sm border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white" placeholder="—" />
                  <span className="text-xs text-muted-foreground shrink-0">{isAr ? dim.unitAr : dim.unit}</span>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>{isAr ? `جيد: ≤${dim.greenMax}${dim.unit}` : `Healthy: ≤${dim.greenMax}${dim.unit}`}</span>
                  <span>{isAr ? `حرج: >${dim.amberMax}${dim.unit}` : `Critical: >${dim.amberMax}${dim.unit}`}</span>
                </div>
                {status && (
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, dim.unit === '%' ? (value || 0) : Math.min(100, (value / dim.amberMax) * 80))}%`, background: cfg?.dot }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {overallHealth && (
          <>
            <div className={`rounded-xl p-4 border ${STATUS_CONFIG[overallHealth].bg}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{isAr ? 'الصحة الكلية لنظام CLM' : 'Overall CLM Health'}</p>
                  <p className="text-lg font-extrabold" style={{ color: STATUS_CONFIG[overallHealth].dot }}>
                    {isAr ? STATUS_CONFIG[overallHealth].labelAr : STATUS_CONFIG[overallHealth].label}
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  {redCount > 0 && <p className="text-red-600 font-bold">{redCount} {isAr ? 'حرج' : 'critical'}</p>}
                  {amberCount > 0 && <p className="text-amber-600 font-bold">{amberCount} {isAr ? 'في خطر' : 'at risk'}</p>}
                </div>
              </div>
            </div>
            {priorityActions.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-3">{isAr ? 'الإجراءات ذات الأولوية' : 'Priority Actions'}</p>
                <ul className="space-y-2">
                  {priorityActions.slice(0, 4).map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-blue-900">
                      <span className="w-4 h-4 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">{i + 1}</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
