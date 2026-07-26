/**
 * Procurement Excellence embedded tools:
 * 1. CategoryProfileBuilder — Kraljic-based sourcing strategy output
 * 2. SpendParetoChart — top-10 supplier spend with live Pareto bar chart
 * 3. MarketIntelligenceScorecard — 6-dimension market risk scoring
 */
import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Line, ComposedChart,
} from 'recharts';

interface ProcurementToolsProps { isAr: boolean; }

/* ─── 1. Category Profile Builder ─── */
function CategoryProfileBuilder({ isAr }: { isAr: boolean }) {
  const SK = 'isc-tool-procurement-catprofile';
  const [v, setV] = useState<Record<string, string>>(() => {
    try { const s = localStorage.getItem(SK); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });
  const set = (k: string, val: string) => setV(prev => {
    const next = { ...prev, [k]: val };
    try { localStorage.setItem(SK, JSON.stringify(next)); } catch { }
    return next;
  });

  const strategic = parseFloat(v.strategic || '0');
  const complexity = parseFloat(v.complexity || '0');
  const spend = parseFloat(v.spend || '0');
  const suppCount = parseInt(v.suppliers || '0');
  const hasData = strategic > 0 && complexity > 0;

  let quadrant = '', strategy = '', strategyAr = '', color = '#6b7280';
  if (hasData) {
    const highStrategic = strategic > 3;
    const highComplexity = complexity > 3;
    if (highStrategic && highComplexity) {
      quadrant = isAr ? 'استراتيجي' : 'Strategic';
      strategy = 'Partner: deep collaboration, joint business plans, co-investment in resilience.';
      strategyAr = 'شراكة: تعاون عميق، خطط أعمال مشتركة، استثمار مشترك في المرونة.';
      color = '#082C6B';
    } else if (highStrategic && !highComplexity) {
      quadrant = isAr ? 'رافعة' : 'Leverage';
      strategy = 'Exploit: competitive tendering, multi-source, focus on cost reduction and savings.';
      strategyAr = 'استغلال: منافسة تنافسية، مصادر متعددة، التركيز على خفض التكلفة والوفورات.';
      color = '#16a34a';
    } else if (!highStrategic && highComplexity) {
      quadrant = isAr ? 'عنق زجاجة' : 'Bottleneck';
      strategy = 'Develop: qualify alternative suppliers, build safety stock, invest in supply security.';
      strategyAr = 'تطوير: تأهيل موردين بديلين، بناء مخزون أمان، الاستثمار في أمن التوريد.';
      color = '#d97706';
    } else {
      quadrant = isAr ? 'غير حرج' : 'Non-Critical';
      strategy = 'Streamline: automate, use catalogues, reduce admin cost, consolidate suppliers.';
      strategyAr = 'تبسيط: أتمتة، استخدام كتالوجات، تقليل تكاليف الإدارة، دمج الموردين.';
      color = '#64748b';
    }
  }

  const risk = complexity >= 4 ? (isAr ? 'مرتفعة' : 'High') : complexity >= 2.5 ? (isAr ? 'متوسطة' : 'Medium') : (isAr ? 'منخفضة' : 'Low');
  const riskColor = complexity >= 4 ? '#ef4444' : complexity >= 2.5 ? '#f59e0b' : '#22c55e';

  const fields = [
    { id: 'category', label: 'Category Name', labelAr: 'اسم الفئة', type: 'text' as const },
    { id: 'spend', label: 'Annual Spend (SAR)', labelAr: 'الإنفاق السنوي (ريال)', type: 'number' as const },
    { id: 'suppliers', label: 'Number of Qualified Suppliers', labelAr: 'عدد المورّدين المؤهّلين', type: 'number' as const },
    { id: 'strategic', label: 'Strategic Importance (1–5)', labelAr: 'الأهمية الاستراتيجية (1–5)', type: 'number' as const },
    { id: 'complexity', label: 'Market Complexity (1–5)', labelAr: 'تعقيد السوق (1–5)', type: 'number' as const },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm font-bold text-primary">{isAr ? 'بناء ملف الفئة' : 'Category Profile Builder'}</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {fields.map(f => (
          <div key={f.id}>
            <label htmlFor={`catprofile-${f.id}`} className="text-xs font-bold text-primary mb-1 block">{isAr ? f.labelAr : f.label}</label>
            <input id={`catprofile-${f.id}`} type={f.type} min={f.type === 'number' ? 1 : undefined} max={f.type === 'number' && (f.id === 'strategic' || f.id === 'complexity') ? 5 : undefined}
              value={v[f.id] ?? ''} onChange={e => set(f.id, e.target.value)}
              className="w-full text-sm border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        ))}
      </div>
      {hasData && (
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="rounded-xl p-4 text-white" style={{ background: color }}>
            <p className="text-xs opacity-80 mb-1">{isAr ? 'ربع Kraljic' : 'Kraljic Quadrant'}</p>
            <p className="text-xl font-extrabold">{quadrant}</p>
          </div>
          <div className="rounded-xl p-4 border" style={{ borderColor: riskColor + '40', background: riskColor + '10' }}>
            <p className="text-xs text-muted-foreground mb-1">{isAr ? 'مستوى مخاطر السوق' : 'Market Risk Level'}</p>
            <p className="text-xl font-extrabold" style={{ color: riskColor }}>{risk}</p>
          </div>
          <div className="rounded-xl p-4 bg-muted">
            <p className="text-xs text-muted-foreground mb-1">{isAr ? 'حجم الموردين' : 'Supplier Pool'}</p>
            <p className="text-xl font-extrabold text-primary">{suppCount > 0 ? suppCount : '—'}</p>
          </div>
          <div className="sm:col-span-3 rounded-xl p-4 bg-blue-50 border border-blue-200">
            <p className="text-xs font-bold text-blue-800 mb-1">{isAr ? 'الاستراتيجية الموصى بها' : 'Recommended Strategy'}</p>
            <p className="text-sm text-blue-900">{isAr ? strategyAr : strategy}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── 2. Spend Pareto Chart ─── */
function SpendParetoChart({ isAr }: { isAr: boolean }) {
  const SK = 'isc-tool-procurement-pareto';
  const [rows, setRows] = useState<{ name: string; spend: string }[]>(() => {
    try { const s = localStorage.getItem(SK); return s ? JSON.parse(s) : Array(10).fill({ name: '', spend: '' }).map(() => ({ name: '', spend: '' })); } catch { return Array(10).fill(null).map(() => ({ name: '', spend: '' })); }
  });

  const update = (i: number, field: 'name' | 'spend', val: string) => {
    setRows(prev => {
      const next = prev.map((r, ri) => ri === i ? { ...r, [field]: val } : r);
      try { localStorage.setItem(SK, JSON.stringify(next)); } catch { }
      return next;
    });
  };

  const parsed = rows.map(r => ({ name: r.name, spend: parseFloat(r.spend) || 0 })).filter(r => r.name && r.spend > 0).sort((a, b) => b.spend - a.spend);
  const total = parsed.reduce((s, r) => s + r.spend, 0);
  let cumulative = 0;
  const chartData = parsed.map(r => {
    cumulative += r.spend;
    return { ...r, cumPct: total > 0 ? Math.round((cumulative / total) * 100) : 0, pct: total > 0 ? Math.round((r.spend / total) * 100) : 0 };
  });
  const vital = chartData.filter(r => r.cumPct <= 80).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-primary">{isAr ? 'تحليل باريتو للإنفاق' : 'Spend Pareto Analysis'}</p>
        {vital > 0 && <span className="text-xs bg-primary text-white px-2 py-1 rounded-full">{isAr ? `${vital} موردين = 80% من الإنفاق` : `${vital} suppliers = 80% of spend`}</span>}
      </div>
      <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
        {rows.map((r, i) => (
          <div key={i} className="flex gap-2">
            <label htmlFor={`pareto-name-${i}`} className="sr-only">{isAr ? `اسم المورّد ${i + 1}` : `Supplier ${i + 1} name`}</label>
            <input id={`pareto-name-${i}`} className="flex-1 text-xs border border-border rounded px-2 py-1" placeholder={isAr ? `مورّد ${i + 1}` : `Supplier ${i + 1}`} value={r.name} onChange={e => update(i, 'name', e.target.value)} />
            <label htmlFor={`pareto-spend-${i}`} className="sr-only">{isAr ? `إنفاق المورّد ${i + 1}` : `Supplier ${i + 1} spend`}</label>
            <input id={`pareto-spend-${i}`} type="number" className="w-24 text-xs border border-border rounded px-2 py-1" placeholder={isAr ? 'الإنفاق (ريال)' : 'Spend (SAR)'} value={r.spend} onChange={e => update(i, 'spend', e.target.value)} />
          </div>
        ))}
      </div>
      {chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#6b7280' }} angle={-35} textAnchor="end" />
            <YAxis yAxisId="left" tick={{ fontSize: 9, fill: '#6b7280' }} width={40} />
            <YAxis yAxisId="right" orientation="right" tickFormatter={v => `${v}%`} tick={{ fontSize: 9, fill: '#6b7280' }} width={32} />
            <Tooltip formatter={(v: number, name: string) => [name === 'cumPct' ? `${v}%` : `SAR ${v.toLocaleString()}`, name === 'cumPct' ? (isAr ? 'تراكمي' : 'Cumulative') : (isAr ? 'الإنفاق' : 'Spend')]} />
            <Bar yAxisId="left" dataKey="spend" radius={[4, 4, 0, 0]}>
              {chartData.map((r, i) => <Cell key={i} fill={r.cumPct <= 80 ? '#082C6B' : '#94a3b8'} />)}
            </Bar>
            <Line yAxisId="right" type="monotone" dataKey="cumPct" stroke="#C9A84C" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

/* ─── 3. Market Intelligence Scorecard ─── */
function MarketIntelligenceScorecard({ isAr }: { isAr: boolean }) {
  const SK = 'isc-tool-procurement-marketintel';
  const DIMS = [
    { id: 'concentration', label: 'Supplier Concentration', labelAr: 'تركّز المورّدين', desc: '1 = many suppliers, 10 = monopoly', descAr: '1 = موردون كثيرون، 10 = احتكار' },
    { id: 'growth', label: 'Market Growth Rate', labelAr: 'معدّل نمو السوق', desc: '1 = declining, 10 = hyper-growth', descAr: '1 = تراجع، 10 = نمو هائل' },
    { id: 'technology', label: 'Technology Change Rate', labelAr: 'معدّل التغيّر التقني', desc: '1 = stable, 10 = rapid disruption', descAr: '1 = مستقر، 10 = اضطراب سريع' },
    { id: 'regulation', label: 'Regulatory Complexity', labelAr: 'تعقيد التنظيمات', desc: '1 = low, 10 = highly regulated', descAr: '1 = منخفض، 10 = شديد التنظيم' },
    { id: 'price', label: 'Price Volatility', labelAr: 'تذبذب الأسعار', desc: '1 = stable prices, 10 = extreme volatility', descAr: '1 = أسعار مستقرة، 10 = تذبذب شديد' },
    { id: 'continuity', label: 'Supply Continuity Risk', labelAr: 'مخاطر استمرارية التوريد', desc: '1 = reliable, 10 = frequent disruptions', descAr: '1 = موثوق، 10 = اضطرابات متكررة' },
  ];

  const [scores, setScores] = useState<Record<string, number>>(() => {
    try { const s = localStorage.getItem(SK); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });
  const set = (id: string, val: number) => setScores(prev => {
    const next = { ...prev, [id]: Math.min(10, Math.max(1, val)) };
    try { localStorage.setItem(SK, JSON.stringify(next)); } catch { }
    return next;
  });

  const filled = DIMS.filter(d => scores[d.id] !== undefined);
  const composite = filled.length > 0 ? Math.round(filled.reduce((s, d) => s + (scores[d.id] ?? 0), 0) / filled.length) : 0;
  const riskBand = composite >= 7 ? { label: isAr ? 'مخاطر عالية' : 'High Risk', color: '#ef4444', strategy: isAr ? 'توريد استراتيجي: شراكات، توريد ثنائي، احتياطيات.' : 'Strategic sourcing: partnerships, dual-source, safety stock.' } :
    composite >= 4 ? { label: isAr ? 'مخاطر متوسطة' : 'Medium Risk', color: '#f59e0b', strategy: isAr ? 'موازنة: مناقصات تنافسية مع علاقات مُدارة بعناية.' : 'Balance: competitive tendering with carefully managed relationships.' } :
    composite > 0 ? { label: isAr ? 'مخاطر منخفضة' : 'Low Risk', color: '#22c55e', strategy: isAr ? 'استغلال: تنافس سعري وتعزيز الوفورات.' : 'Exploit: price competition and savings maximisation.' } : null;

  return (
    <div className="space-y-4">
      <p className="text-sm font-bold text-primary">{isAr ? 'بطاقة استخبارات السوق' : 'Market Intelligence Scorecard'}</p>
      <p className="text-xs text-muted-foreground">{isAr ? 'قيّم كل بُعد من 1 إلى 10' : 'Rate each dimension 1–10'}</p>
      <div className="space-y-3">
        {DIMS.map(d => (
          <div key={d.id} className="flex items-center gap-3">
            <div className="flex-1">
              <label htmlFor={`marketintel-${d.id}`} className="text-xs font-bold text-primary">{isAr ? d.labelAr : d.label}</label>
              <p className="text-xs text-muted-foreground">{isAr ? d.descAr : d.desc}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input id={`marketintel-${d.id}`} type="range" min={1} max={10} value={scores[d.id] ?? 5} onChange={e => set(d.id, parseInt(e.target.value))} className="w-24 accent-primary" />
              <span className="text-xs font-bold text-primary w-4 text-center">{scores[d.id] ?? '—'}</span>
            </div>
          </div>
        ))}
      </div>
      {riskBand && composite > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl p-4 text-center" style={{ background: riskBand.color + '15', border: `1px solid ${riskBand.color}40` }}>
            <p className="text-xs text-muted-foreground mb-1">{isAr ? 'درجة مخاطر السوق المركّبة' : 'Composite Market Risk Score'}</p>
            <p className="text-3xl font-extrabold" style={{ color: riskBand.color }}>{composite}<span className="text-base font-normal">/10</span></p>
            <p className="text-sm font-bold mt-1" style={{ color: riskBand.color }}>{riskBand.label}</p>
          </div>
          <div className="rounded-xl p-4 bg-blue-50 border border-blue-200">
            <p className="text-xs font-bold text-blue-800 mb-1">{isAr ? 'نهج التوريد الموصى به' : 'Recommended Sourcing Approach'}</p>
            <p className="text-sm text-blue-900">{riskBand.strategy}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main export ─── */
export function ProcurementToolsSection({ isAr }: ProcurementToolsProps) {
  const TOOLS = [
    { id: 'catprofile', label: 'Category Profile Builder', labelAr: 'بناء ملف الفئة', component: <CategoryProfileBuilder isAr={isAr} /> },
    { id: 'pareto', label: 'Spend Pareto Analysis', labelAr: 'تحليل باريتو للإنفاق', component: <SpendParetoChart isAr={isAr} /> },
    { id: 'market', label: 'Market Intelligence Scorecard', labelAr: 'بطاقة استخبارات السوق', component: <MarketIntelligenceScorecard isAr={isAr} /> },
  ];
  const [active, setActive] = useState('catprofile');

  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-border bg-amber-50">
        <p className="text-sm font-bold text-primary">{isAr ? '🛠 أدوات التميّز في المشتريات' : '🛠 Procurement Excellence Tools'}</p>
        <p className="text-xs text-muted-foreground mt-1">{isAr ? 'أدوات تفاعلية — ابدأ التحليل مباشرةً' : 'Interactive tools — start your analysis immediately'}</p>
      </div>
      <div className="flex border-b border-border overflow-x-auto">
        {TOOLS.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)}
            className={`px-4 py-3 text-xs font-semibold whitespace-nowrap shrink-0 border-b-2 transition-all ${active === t.id ? 'border-amber-500 text-amber-700' : 'border-transparent text-muted-foreground hover:text-primary'}`}>
            {isAr ? t.labelAr : t.label}
          </button>
        ))}
      </div>
      <div className="p-5">
        {TOOLS.find(t => t.id === active)?.component}
      </div>
    </div>
  );
}
