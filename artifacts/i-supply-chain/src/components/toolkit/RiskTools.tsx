/**
 * Risk Management interactive tools:
 * 1. KRIDashboard — live KRI monitoring table with RAG status
 * 2. SupplierAlertConfig — tier-based alert threshold configurator
 * 3. WeeklyRiskReview — template generator
 */
import React, { useState } from 'react';
import { AlertTriangle, Copy, CheckCircle, Settings, Printer } from 'lucide-react';
import { safeSetItem } from '@/lib/storage';

function printZone(zone: string) {
  document.body.setAttribute('data-print', zone);
  const cleanup = () => {
    document.body.removeAttribute('data-print');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  window.print();
}

interface RiskToolsProps { isAr: boolean; }

/* ─── KRI definitions ─── */
interface KRIDef {
  id: string; label: string; labelAr: string; unit: string; unitAr: string;
  amber: number; red: number; higherIsBetter: boolean;
  desc: string; descAr: string;
}
const KRI_DEFS: KRIDef[] = [
  { id: 'concentration', label: 'Supplier Concentration Index', labelAr: 'مؤشر تركّز المورّدين', unit: '% with top supplier', unitAr: '% مع أعلى مورّد', amber: 50, red: 70, higherIsBetter: false, desc: '% of total spend with a single supplier', descAr: 'نسبة الإنفاق الكلي مع مورّد واحد' },
  { id: 'dio', label: 'Days Inventory Outstanding', labelAr: 'أيام المخزون القائم', unit: 'days', unitAr: 'أيام', amber: 45, red: 60, higherIsBetter: false, desc: 'Average days of inventory held', descAr: 'متوسط أيام الاحتفاظ بالمخزون' },
  { id: 'ltvariance', label: 'Lead Time Variance', labelAr: 'تباين مهلة التوريد', unit: '%', unitAr: '%', amber: 20, red: 40, higherIsBetter: false, desc: '% variance vs planned supplier lead time', descAr: 'نسبة التباين مقابل مهلة التوريد المخطّطة' },
  { id: 'geo', label: 'Geopolitical Exposure Score', labelAr: 'درجة التعرّض الجيوسياسي', unit: '/100', unitAr: '/100', amber: 45, red: 65, higherIsBetter: false, desc: 'Supply chain exposure to high-risk geographies (0=none, 100=critical)', descAr: 'تعرّض سلسلة الإمداد للجغرافيات عالية الخطورة (0=لا شيء، 100=حرج)' },
  { id: 'otif', label: 'Supplier OTIF Performance', labelAr: 'أداء OTIF للمورّد', unit: '%', unitAr: '%', amber: 80, red: 65, higherIsBetter: true, desc: 'On-time in-full delivery rate across strategic suppliers', descAr: 'معدّل التسليم في الوقت وبالكامل عبر المورّدين الاستراتيجيين' },
];

function kpiStatus(def: KRIDef, value: number) {
  if (def.higherIsBetter) {
    if (value >= def.amber) return 'green';
    if (value >= def.red) return 'amber';
    return 'red';
  } else {
    if (value <= def.amber) return 'green';
    if (value <= def.red) return 'amber';
    return 'red';
  }
}
const STATUS_STYLE = {
  green: 'bg-emerald-100 text-emerald-800',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
};
const STATUS_LABEL = { green: { en: 'On Track', ar: 'على المسار' }, amber: { en: 'Watch', ar: 'مراقبة' }, red: { en: 'Alert', ar: 'تنبيه' } };

/* ─── 1. KRI Dashboard ─── */
function KRIDashboard({ isAr }: { isAr: boolean }) {
  const SK = 'isc-tool-risk-kri';
  const [values, setValues] = useState<Record<string, string>>(() => {
    try { const s = localStorage.getItem(SK); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });
  const set = (id: string, val: string) => setValues(prev => {
    const next = { ...prev, [id]: val };
    safeSetItem(SK, JSON.stringify(next));
    return next;
  });

  const entries = KRI_DEFS.map(def => {
    const raw = parseFloat(values[def.id] ?? '');
    return { def, value: isNaN(raw) ? null : raw };
  });
  const filled = entries.filter(e => e.value !== null);
  const redCount = filled.filter(e => kpiStatus(e.def, e.value!) === 'red').length;
  const amberCount = filled.filter(e => kpiStatus(e.def, e.value!) === 'amber').length;
  const heatScore = filled.length > 0 ? Math.round(filled.reduce((s, e) => {
    const st = kpiStatus(e.def, e.value!);
    return s + (st === 'red' ? 3 : st === 'amber' ? 1.5 : 0);
  }, 0) / KRI_DEFS.length * 33.3) : 0;

  const today = new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-GB');

  return (
    <div className="print-zone-kri space-y-4">
      {/* Print-only header */}
      <div className="hidden print:block mb-4 pb-3 border-b border-gray-300">
        <p className="text-lg font-extrabold text-gray-900">{isAr ? '🛡 لوحة مؤشرات المخاطر الرئيسية (KRI)' : '🛡 Key Risk Indicator (KRI) Dashboard'}</p>
        <p className="text-xs text-gray-500">{isAr ? `تاريخ التصدير: ${today}` : `Exported: ${today}`}</p>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm font-bold text-primary">{isAr ? 'لوحة مؤشرات المخاطر الرئيسية (KRI)' : 'Key Risk Indicator (KRI) Dashboard'}</p>
        <div className="flex items-center gap-2 flex-wrap">
          {filled.length > 0 && (
            <div className="flex gap-2 text-xs">
              {redCount > 0 && <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full font-bold">🔴 {redCount} {isAr ? 'تنبيه' : 'Alert'}</span>}
              {amberCount > 0 && <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-bold">🟡 {amberCount} {isAr ? 'مراقبة' : 'Watch'}</span>}
            </div>
          )}
          <button
            onClick={() => printZone('kri')}
            className="no-print flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            {isAr ? 'تصدير PDF' : 'Export PDF'}
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[500px]">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left py-2 px-3 font-bold text-primary">{isAr ? 'المؤشر' : 'KRI'}</th>
              <th className="text-center py-2 px-2 font-bold text-primary w-20">{isAr ? 'القيمة الحالية' : 'Current'}</th>
              <th className="text-center py-2 px-2 font-bold text-primary w-16">{isAr ? 'كهرماني' : 'Amber'}</th>
              <th className="text-center py-2 px-2 font-bold text-primary w-16">{isAr ? 'أحمر' : 'Red'}</th>
              <th className="text-center py-2 px-2 font-bold text-primary w-24">{isAr ? 'الحالة' : 'Status'}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(({ def, value }) => {
              const status = value !== null ? kpiStatus(def, value) : null;
              return (
                <tr key={def.id} className={`border-b border-border/50 ${status === 'red' ? 'bg-red-50' : status === 'amber' ? 'bg-amber-50' : ''}`}>
                  <td className="py-3 px-3">
                    <p className="font-semibold text-primary">{isAr ? def.labelAr : def.label}</p>
                    <p className="text-muted-foreground mt-0.5">{isAr ? def.descAr : def.desc}</p>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <div className="flex items-center gap-1 justify-center">
                      <input type="number" step="any" value={values[def.id] ?? ''} onChange={e => set(def.id, e.target.value)}
                        className="w-16 text-center text-xs border border-border rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-primary/30" placeholder="—" />
                      <span className="text-muted-foreground">{isAr ? def.unitAr : def.unit}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center font-bold text-amber-700">{def.amber}</td>
                  <td className="py-3 px-2 text-center font-bold text-red-600">{def.red}</td>
                  <td className="py-3 px-2 text-center">
                    {status ? (
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${STATUS_STYLE[status]}`}>
                        {STATUS_LABEL[status][isAr ? 'ar' : 'en']}
                      </span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {filled.length > 0 && (
        <div className="flex items-center gap-4 bg-muted rounded-xl px-4 py-3">
          <div>
            <p className="text-xs text-muted-foreground">{isAr ? 'درجة حرارة المخاطر' : 'Risk Heat Score'}</p>
            <p className="text-2xl font-extrabold text-primary">{Math.min(100, heatScore)}<span className="text-sm font-normal">/100</span></p>
          </div>
          <p className="text-xs text-muted-foreground flex-1">
            {redCount + amberCount === 0 ? (isAr ? '✓ جميع المؤشرات في المنطقة الخضراء.' : '✓ All KRIs in green zone.') :
              isAr ? `تحتاج ${redCount} مؤشرات اتّخاذ إجراء فوري، و${amberCount} تستدعي المراقبة.` : `${redCount} KRIs require immediate action; ${amberCount} need monitoring.`}
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── 2. Supplier Alert Configurator ─── */
function SupplierAlertConfig({ isAr }: { isAr: boolean }) {
  const SK = 'isc-tool-risk-alerts';
  const TIERS = ['Strategic', 'Preferred', 'Transactional'];
  const TIERS_AR = ['استراتيجي', 'مفضّل', 'معاملاتي'];
  const DEFAULTS = [{ otif: 90, defect: 1000, financial: 70 }, { otif: 85, defect: 2000, financial: 55 }, { otif: 80, defect: 3000, financial: 40 }];

  const [cfg, setCfg] = useState<{ otif: string; defect: string; financial: string }[]>(() => {
    try { const s = localStorage.getItem(SK); return s ? JSON.parse(s) : DEFAULTS.map(d => ({ otif: String(d.otif), defect: String(d.defect), financial: String(d.financial) })); } catch { return DEFAULTS.map(d => ({ otif: String(d.otif), defect: String(d.defect), financial: String(d.financial) })); }
  });
  const update = (ti: number, field: 'otif' | 'defect' | 'financial', val: string) => setCfg(prev => {
    const next = prev.map((c, i) => i === ti ? { ...c, [field]: val } : c);
    safeSetItem(SK, JSON.stringify(next));
    return next;
  });

  const today = new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-GB');

  return (
    <div className="print-zone-alert-config space-y-4">
      {/* Print-only header */}
      <div className="hidden print:block mb-4 pb-3 border-b border-gray-300">
        <p className="text-lg font-extrabold text-gray-900">{isAr ? '🔔 إعداد تنبيهات المورّدين' : '🔔 Supplier Alert Configuration'}</p>
        <p className="text-xs text-gray-500">{isAr ? `تاريخ التصدير: ${today}` : `Exported: ${today}`}</p>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm font-bold text-primary">{isAr ? 'إعداد تنبيهات المورّدين' : 'Supplier Alert Configuration'}</p>
        <button
          onClick={() => printZone('alert-config')}
          className="no-print flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          <Printer className="w-3.5 h-3.5" />
          {isAr ? 'تصدير PDF' : 'Export PDF'}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[400px]">
          <thead><tr className="border-b border-border bg-muted/30">
            <th className="text-left py-2 px-3 font-bold text-primary">{isAr ? 'الشريحة' : 'Tier'}</th>
            <th className="text-center py-2 px-2 font-bold text-primary">{isAr ? 'حدّ OTIF (%)' : 'OTIF Threshold (%)'}</th>
            <th className="text-center py-2 px-2 font-bold text-primary">{isAr ? 'حدّ العيوب (PPM)' : 'Defect Threshold (PPM)'}</th>
            <th className="text-center py-2 px-2 font-bold text-primary">{isAr ? 'الحدّ المالي (/100)' : 'Financial Score Min'}</th>
          </tr></thead>
          <tbody>{TIERS.map((tier, ti) => (
            <tr key={tier} className="border-b border-border/50">
              <td className="py-2 px-3 font-semibold text-primary">{isAr ? TIERS_AR[ti] : tier}</td>
              {(['otif', 'defect', 'financial'] as const).map(field => (
                <td key={field} className="py-2 px-2 text-center">
                  <input type="number" value={cfg[ti][field]} onChange={e => update(ti, field, e.target.value)}
                    className="w-20 text-center text-xs border border-border rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-primary/30" />
                </td>
              ))}
            </tr>
          ))}</tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">{isAr ? '✓ تُحفظ التكوينات تلقائياً. أنشئ تنبيهات في نظام ERP أو البريد الإلكتروني بناءً على هذه الحدود.' : '✓ Configuration auto-saved. Create alerts in your ERP or email system based on these thresholds.'}</p>
    </div>
  );
}

/* ─── 3. Weekly Risk Review Generator ─── */
function WeeklyRiskReview({ isAr }: { isAr: boolean }) {
  const [copied, setCopied] = useState(false);
  const today = new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-GB');

  const template = isAr
    ? `مراجعة مخاطر سلسلة الإمداد الأسبوعية
التاريخ: ${today}
المُعِدّ: [اسم المالك]
الحضور: [الأعضاء]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. حالة مؤشرات المخاطر الرئيسية (KRI)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] تركّز المورّدين: ___% (حدّ: 70% أحمر)
[ ] أيام المخزون القائم: ___ (حدّ: 60 أحمر)
[ ] تباين مهلة التوريد: ___% (حدّ: 40% أحمر)
[ ] التعرّض الجيوسياسي: ___/100 (حدّ: 65 أحمر)
[ ] OTIF المورّد: ___% (حدّ: 65% أحمر)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. أعلى 3 مخاطر نشطة هذا الأسبوع
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. [المخاطرة] — المالك: [الاسم] — الحالة: [ ] مفتوح / [ ] متحكّم به
2. [المخاطرة] — المالك: [الاسم] — الحالة: [ ] مفتوح / [ ] متحكّم به
3. [المخاطرة] — المالك: [الاسم] — الحالة: [ ] مفتوح / [ ] متحكّم به

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. إجراءات مستحقة من الأسبوع الماضي
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] [الإجراء] — المسؤول: [الاسم] — تاريخ الاستحقاق: [التاريخ]
[ ] [الإجراء] — المسؤول: [الاسم] — تاريخ الاستحقاق: [التاريخ]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. القرارات والتصعيدات
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] يتطلّب اتخاذ قرار: [الموضوع]
[ ] يتطلّب تصعيداً: [المخاطرة] → [المستوى]

القائد: _______________  التاريخ: ${today}`
    : `Weekly Supply Chain Risk Review
Date: ${today}
Prepared by: [Owner Name]
Attendees: [Names]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. KRI Status Update
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] Supplier Concentration: ___% (Red threshold: 70%)
[ ] Days Inventory Outstanding: ___ days (Red: 60 days)
[ ] Lead Time Variance: ___% (Red: 40%)
[ ] Geopolitical Exposure Score: ___/100 (Red: 65)
[ ] Supplier OTIF: ___% (Red: <65%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. Top 3 Active Risks This Week
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. [Risk] — Owner: [Name] — Status: [ ] Open / [ ] Controlled
2. [Risk] — Owner: [Name] — Status: [ ] Open / [ ] Controlled
3. [Risk] — Owner: [Name] — Status: [ ] Open / [ ] Controlled

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. Actions Due From Last Week
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] [Action] — Owner: [Name] — Due: [Date]
[ ] [Action] — Owner: [Name] — Due: [Date]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. Decisions & Escalations Required
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] Decision needed: [Topic]
[ ] Escalation required: [Risk] → [Level]

Signed: _______________  Date: ${today}`;

  const copy = () => {
    navigator.clipboard.writeText(template).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <div className="print-zone-weekly-review space-y-3">
      {/* Print-only header */}
      <div className="hidden print:block mb-4 pb-3 border-b border-gray-300">
        <p className="text-lg font-extrabold text-gray-900">{isAr ? '📋 نموذج المراجعة الأسبوعية لمخاطر سلسلة الإمداد' : '📋 Weekly Supply Chain Risk Review'}</p>
        <p className="text-xs text-gray-500">{isAr ? `تاريخ التصدير: ${today}` : `Exported: ${today}`}</p>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-bold text-primary">{isAr ? 'نموذج المراجعة الأسبوعية للمخاطر' : 'Weekly Risk Review Template'}</p>
        <div className="no-print flex items-center gap-2">
          <button onClick={copy} className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${copied ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-primary hover:bg-muted/70 border border-border'}`}>
            {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ النموذج' : 'Copy Template')}
          </button>
          <button
            onClick={() => printZone('weekly-review')}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            {isAr ? 'تصدير PDF' : 'Export PDF'}
          </button>
        </div>
      </div>
      <pre className="print-weekly-template text-xs bg-muted rounded-xl p-4 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed border border-border max-h-64 overflow-y-auto">
        {template}
      </pre>
    </div>
  );
}

/* ─── Main export ─── */
export function RiskToolsSection({ isAr }: RiskToolsProps) {
  const TOOLS = [
    { id: 'kri', label: 'KRI Dashboard', labelAr: 'لوحة مؤشرات المخاطر', component: <KRIDashboard isAr={isAr} /> },
    { id: 'alerts', label: 'Supplier Alert Config', labelAr: 'إعداد تنبيهات المورّدين', icon: Settings, component: <SupplierAlertConfig isAr={isAr} /> },
    { id: 'review', label: 'Weekly Review Template', labelAr: 'نموذج المراجعة الأسبوعية', component: <WeeklyRiskReview isAr={isAr} /> },
  ];
  const [active, setActive] = useState('kri');
  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-border bg-red-50">
        <p className="text-sm font-bold text-primary">{isAr ? '🛡 أدوات إدارة المخاطر الحيّة' : '🛡 Live Risk Management Tools'}</p>
        <p className="text-xs text-muted-foreground mt-1">{isAr ? 'أدخل بياناتك الحقيقية — تُحفظ تلقائياً' : 'Enter your real data — auto-saved'}</p>
      </div>
      <div className="flex border-b border-border overflow-x-auto">
        {TOOLS.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)}
            className={`px-4 py-3 text-xs font-semibold whitespace-nowrap shrink-0 border-b-2 transition-all ${active === t.id ? 'border-red-600 text-red-700' : 'border-transparent text-muted-foreground hover:text-primary'}`}>
            {isAr ? t.labelAr : t.label}
          </button>
        ))}
      </div>
      <div className="p-5">{TOOLS.find(t => t.id === active)?.component}</div>
    </div>
  );
}
