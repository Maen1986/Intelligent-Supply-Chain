/**
 * Supplier Scorecard Tool — weighted scoring across 6 dimensions,
 * tier badge, and RadarChart visualization.
 */
import React, { useState } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Printer } from 'lucide-react';

function printZone(zone: string) {
  document.body.setAttribute('data-print', zone);
  const cleanup = () => {
    document.body.removeAttribute('data-print');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  window.print();
}

interface SupplierScorecardProps { isAr: boolean; }

interface Dimension { id: string; label: string; labelAr: string; weight: number; }
const DIMS: Dimension[] = [
  { id: 'delivery', label: 'Delivery Performance', labelAr: 'أداء التسليم', weight: 25 },
  { id: 'quality', label: 'Quality', labelAr: 'الجودة', weight: 25 },
  { id: 'cost', label: 'Cost Competitiveness', labelAr: 'التنافسية السعرية', weight: 20 },
  { id: 'compliance', label: 'Compliance', labelAr: 'الامتثال', weight: 15 },
  { id: 'innovation', label: 'Innovation', labelAr: 'الابتكار', weight: 10 },
  { id: 'relationship', label: 'Relationship Quality', labelAr: 'جودة العلاقة', weight: 5 },
];

const TIERS = [
  { label: 'Strategic', labelAr: 'استراتيجي', min: 75, color: '#082C6B', bg: '#082C6B15' },
  { label: 'Preferred', labelAr: 'مفضّل', min: 55, color: '#C9A84C', bg: '#C9A84C15' },
  { label: 'Transactional', labelAr: 'معاملاتي', min: 0, color: '#64748b', bg: '#64748b15' },
];

function getTier(score: number) {
  return TIERS.find(t => score >= t.min) ?? TIERS[2];
}

export function SupplierScorecardTool({ isAr }: SupplierScorecardProps) {
  const SK = 'isc-tool-supplier-scorecard';
  const [state, setState] = useState<{ name: string; tier: string; scores: Record<string, string> }>(() => {
    try {
      const s = localStorage.getItem(SK);
      return s ? JSON.parse(s) : { name: '', tier: 'Strategic', scores: {} };
    } catch { return { name: '', tier: 'Strategic', scores: {} }; }
  });

  const update = (patch: Partial<typeof state>) => setState(prev => {
    const next = { ...prev, ...patch };
    try { localStorage.setItem(SK, JSON.stringify(next)); } catch { }
    return next;
  });

  const setScore = (id: string, val: string) => update({ scores: { ...state.scores, [id]: val } });

  const totalWeight = DIMS.reduce((s, d) => s + d.weight, 0);
  const filledDims = DIMS.filter(d => state.scores[d.id] !== undefined && state.scores[d.id] !== '');
  const weightedScore = filledDims.length === DIMS.length
    ? Math.round(DIMS.reduce((s, d) => s + (parseFloat(state.scores[d.id] ?? '0') / 100) * d.weight, 0) / totalWeight * 100)
    : null;
  const tier = weightedScore !== null ? getTier(weightedScore) : null;

  const radarData = DIMS.map(d => ({
    dimension: isAr ? d.labelAr : d.label,
    value: parseFloat(state.scores[d.id] ?? '0') || 0,
    fullMark: 100,
  }));

  const TIER_OPTIONS = ['Strategic', 'Preferred', 'Transactional', 'New Supplier'];
  const TIER_OPTIONS_AR = ['استراتيجي', 'مفضّل', 'معاملاتي', 'مورّد جديد'];

  const today = new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-GB');

  return (
    <div className="print-zone-scorecard bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
      {/* Print-only header */}
      <div className="hidden print:block mb-4 pb-3 border-b border-gray-300">
        <p className="text-lg font-extrabold text-gray-900">{isAr ? '🏆 بطاقة تقييم المورّد' : '🏆 Supplier Scorecard'}</p>
        <p className="text-xs text-gray-500">{isAr ? `تاريخ التصدير: ${today}` : `Exported: ${today}`}</p>
      </div>

      <div className="p-5 border-b border-border bg-teal-50 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-primary">{isAr ? '🏆 أداة بطاقة تقييم المورّد' : '🏆 Supplier Scorecard Tool'}</p>
          <p className="text-xs text-muted-foreground mt-1">{isAr ? 'قيّم مورّداً واحداً — يُحفظ تلقائياً' : 'Score one supplier — auto-saved'}</p>
        </div>
        <button
          onClick={() => printZone('scorecard')}
          className="no-print flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold bg-primary text-white hover:bg-primary/90 transition-colors shrink-0"
        >
          <Printer className="w-3.5 h-3.5" />
          {isAr ? 'تصدير PDF' : 'Export PDF'}
        </button>
      </div>
      <div className="p-5 space-y-5">
        {/* Supplier info */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-primary mb-1 block">{isAr ? 'اسم المورّد' : 'Supplier Name'}</label>
            <input className="w-full text-sm border border-border rounded-lg px-3 py-1.5" placeholder={isAr ? 'أدخل اسم المورّد' : 'Enter supplier name'} value={state.name} onChange={e => update({ name: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-bold text-primary mb-1 block">{isAr ? 'الشريحة الحالية' : 'Current Tier'}</label>
            <select className="w-full text-sm border border-border rounded-lg px-3 py-1.5" value={state.tier} onChange={e => update({ tier: e.target.value })}>
              {TIER_OPTIONS.map((o, i) => <option key={o} value={o}>{isAr ? TIER_OPTIONS_AR[i] : o}</option>)}
            </select>
          </div>
        </div>

        {/* Scoring inputs */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">{isAr ? 'التقييم (0–100 لكل بُعد)' : 'Scores (0–100 per dimension)'}</p>
          <div className="space-y-3">
            {DIMS.map(d => {
              const val = parseFloat(state.scores[d.id] ?? '0') || 0;
              const barColor = val >= 75 ? '#22c55e' : val >= 55 ? '#f59e0b' : '#ef4444';
              return (
                <div key={d.id} className="grid grid-cols-[1fr_80px_40px] gap-3 items-center">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-primary">{isAr ? d.labelAr : d.label}</span>
                      <span className="text-xs text-muted-foreground">{isAr ? `وزن ${d.weight}%` : `${d.weight}% weight`}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${val}%`, background: barColor }} />
                    </div>
                  </div>
                  <input type="number" min={0} max={100} value={state.scores[d.id] ?? ''} onChange={e => setScore(d.id, e.target.value)}
                    className="text-center text-sm border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="0" />
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Results */}
        {weightedScore !== null && tier && (
          <div className="grid sm:grid-cols-2 gap-5 items-start">
            <div className="space-y-3">
              <div className="rounded-xl p-5 text-center" style={{ background: tier.bg, border: `1px solid ${tier.color}30` }}>
                <p className="text-xs text-muted-foreground mb-1">{isAr ? 'الدرجة المرجّحة' : 'Weighted Score'}</p>
                <p className="text-4xl font-extrabold" style={{ color: tier.color }}>{weightedScore}<span className="text-lg font-normal">/100</span></p>
              </div>
              <div className="rounded-xl p-4 text-center" style={{ background: tier.color, color: '#fff' }}>
                <p className="text-xs opacity-75 mb-1">{isAr ? 'تصنيف المورّد' : 'Supplier Tier'}</p>
                <p className="text-xl font-extrabold">{isAr ? TIERS.find(t => t.label === tier.label)?.labelAr : tier.label}</p>
              </div>
              <div className="rounded-xl p-4 bg-muted text-xs space-y-1">
                <p className="font-bold text-primary mb-2">{isAr ? 'حدود الشرائح' : 'Tier Thresholds'}</p>
                {TIERS.map(t => <div key={t.label} className="flex items-center justify-between"><span style={{ color: t.color }} className="font-semibold">{isAr ? (TIERS.find(x => x.label === t.label)?.labelAr) : t.label}</span><span className="text-muted-foreground">≥{t.min}</span></div>)}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 text-center">{isAr ? 'ملف الأداء' : 'Performance Profile'}</p>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 9, fill: '#6b7280' }} />
                  <Radar name={state.name || 'Supplier'} dataKey="value" stroke={tier.color} fill={tier.color} fillOpacity={0.25} />
                  <Tooltip formatter={(v: number) => [`${v}/100`, isAr ? 'الدرجة' : 'Score']} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {filledDims.length > 0 && filledDims.length < DIMS.length && (
          <p className="text-xs text-amber-600 text-center">{isAr ? `أكمل جميع الأبعاد الـ ${DIMS.length} لرؤية النتيجة المرجّحة` : `Complete all ${DIMS.length} dimensions to see weighted score`}</p>
        )}
      </div>
    </div>
  );
}
