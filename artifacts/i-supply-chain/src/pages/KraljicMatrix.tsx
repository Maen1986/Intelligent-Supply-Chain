import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceArea, ReferenceLine, Label,
} from 'recharts';
import { Upload, Download, Plus, Trash2, ChevronDown, ChevronUp, Info,
  BarChart3, ClipboardList, TableProperties, Sparkles, AlertTriangle,
  TrendingUp, Package, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/LanguageContext';
import { INDUSTRIES, type IndustryKey } from '@/lib/kpiBenchmarksByIndustry';
import {
  INDUSTRY_THRESHOLDS, QUADRANT_META, ACTION_PLANS,
  type KraljicItem, type KraljicQuadrant, type KraljicScored,
  newItem, parseCSV, generateCSVTemplate, scoreItems, buildKraljicPrompt,
} from '@/lib/kraljicScoring';
import { useAIPlan } from '@/hooks/useAIPlan';
import { Button } from '@/components/ui/button';
import { AIPlan } from '@/components/toolkit/AIPlan';

// ─── Sub-components ───────────────────────────────────────────────────────────

const RATING_LABELS: Record<number, string> = { 1: '1 – Very Low', 2: '2 – Low', 3: '3 – Medium', 4: '4 – High', 5: '5 – Very High' };

function RatingSelect({ value, onChange, title }: { value: number; onChange: (v: number) => void; title?: string }) {
  return (
    <select
      value={value}
      onChange={e => onChange(parseInt(e.target.value))}
      title={title}
      className="text-[11px] border border-slate-200 rounded px-1 py-0.5 bg-white w-14 text-center focus:outline-none focus:ring-1 focus:ring-[#082C6B]"
    >
      {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
    </select>
  );
}

const QUADRANT_COLORS: Record<KraljicQuadrant, string> = {
  strategic: '#4338ca',
  leverage: '#059669',
  bottleneck: '#d97706',
  'non-critical': '#6b7280',
};

const QUADRANT_FILL: Record<KraljicQuadrant, string> = {
  strategic: '#e0e7ff',
  leverage: '#d1fae5',
  bottleneck: '#fef3c7',
  'non-critical': '#f3f4f6',
};

type Tab = 'data' | 'matrix' | 'actions' | 'ai';

// ─── Custom Tooltip for Scatter ───────────────────────────────────────────────

function ScatterTooltip({ active, payload }: { active?: boolean; payload?: { payload: KraljicScored & { x: number; y: number; z: number } }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const meta = QUADRANT_META[d.quadrant];
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-xs max-w-[220px]">
      <p className="font-bold text-slate-800 mb-1">{d.itemName || d.category}</p>
      {d.subcategory && <p className="text-slate-500 mb-1">{d.category} › {d.subcategory}</p>}
      <div className="flex items-center gap-1 mb-2">
        <span className="px-1.5 py-0.5 rounded text-white text-[10px] font-bold" style={{ background: QUADRANT_COLORS[d.quadrant] }}>
          {meta.icon} {meta.label}
        </span>
      </div>
      <div className="space-y-0.5 text-slate-600">
        <div>Annual Spend: <span className="font-semibold text-slate-800">SAR {d.annualSpend.toLocaleString()}</span></div>
        <div>Supply Risk: <span className="font-semibold">{d.supplyRiskScore}</span>/100</div>
        <div>Profit Impact: <span className="font-semibold">{d.profitImpactScore}</span>/100</div>
        <div>Suppliers: <span className="font-semibold">{d.supplierCount}</span> · Lead time: <span className="font-semibold">{d.leadTimeDays}d</span></div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function KraljicMatrix() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<KraljicItem[]>([newItem()]);
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryKey | null>(() => {
    try { return (localStorage.getItem('isc-kraljic-industry') as IndustryKey) || null; } catch { return null; }
  });
  const [activeTab, setActiveTab] = useState<Tab>('data');
  const [filterQuadrant, setFilterQuadrant] = useState<KraljicQuadrant | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [expandedSection, setExpandedSection] = useState<Record<string, string>>({});

  const handleIndustryChange = useCallback((key: IndustryKey | null) => {
    setSelectedIndustry(key);
    try { key ? localStorage.setItem('isc-kraljic-industry', key) : localStorage.removeItem('isc-kraljic-industry'); } catch {}
  }, []);

  const updateItem = useCallback((id: string, field: keyof KraljicItem, value: string | number) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  }, []);

  const addRow = () => setItems(prev => [...prev, newItem()]);
  const removeRow = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = parseCSV(ev.target?.result as string);
        if (!parsed.length) { toast.error('No valid rows found in CSV.'); return; }
        setItems(parsed);
        setActiveTab('matrix');
        toast.success(`Loaded ${parsed.length} item${parsed.length !== 1 ? 's' : ''} — matrix updated`);
      } catch { toast.error('Could not parse CSV. Download the template to see the expected format.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const downloadTemplate = () => {
    const csv = generateCSVTemplate();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'kraljic-template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Scoring ────────────────────────────────────────────────────────────────
  const validItems = useMemo(() => items.filter(i => (i.itemName || i.category) && i.annualSpend > 0), [items]);
  const scored = useMemo(() => scoreItems(validItems, selectedIndustry), [validItems, selectedIndustry]);
  const threshold = INDUSTRY_THRESHOLDS[selectedIndustry ?? 'default'] ?? INDUSTRY_THRESHOLDS.default;

  const byQuadrant = useMemo(() => ({
    strategic:     scored.filter(i => i.quadrant === 'strategic'),
    leverage:      scored.filter(i => i.quadrant === 'leverage'),
    bottleneck:    scored.filter(i => i.quadrant === 'bottleneck'),
    'non-critical': scored.filter(i => i.quadrant === 'non-critical'),
  }), [scored]);

  const scatterData = useMemo(() => {
    const q: KraljicQuadrant[] = ['strategic', 'leverage', 'bottleneck', 'non-critical'];
    return q.map(quad => ({
      quad,
      data: scored.filter(i => i.quadrant === quad).map(i => ({
        ...i, x: i.supplyRiskScore, y: i.profitImpactScore,
        z: Math.max(100, Math.sqrt(i.annualSpend / 100)),
      })),
    }));
  }, [scored]);

  // ── AI Plan ────────────────────────────────────────────────────────────────
  const industryLabel = selectedIndustry ? (INDUSTRIES.find(i => i.id === selectedIndustry)?.label ?? 'GCC') : 'GCC General';
  const buildPrompt = useCallback(() => buildKraljicPrompt(scored, industryLabel, isAr), [scored, industryLabel, isAr]);
  const aiPlan = useAIPlan(buildPrompt, isAr, 'kraljic', scored.length >= 2);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const toggleExpanded = (id: string) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleSection = (id: string, section: string) => setExpandedSection(prev => ({
    ...prev, [id]: prev[id] === section ? '' : section,
  }));

  const filteredScored = filterQuadrant ? scored.filter(i => i.quadrant === filterQuadrant) : scored;

  // ── UI Helpers ─────────────────────────────────────────────────────────────
  const tabs: { id: Tab; label: string; labelAr: string; icon: React.ReactNode }[] = [
    { id: 'data',    label: 'Data Entry',        labelAr: 'إدخال البيانات',   icon: <TableProperties className="w-4 h-4" /> },
    { id: 'matrix',  label: 'Procurement Matrix', labelAr: 'مصفوفة المشتريات', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'actions', label: 'Action Plans',       labelAr: 'خطط الإجراءات',    icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'ai',      label: 'AI Brief',           labelAr: 'تقرير ذكاء اصطناعي', icon: <Sparkles className="w-4 h-4" /> },
  ];

  const ACTION_SECTIONS = [
    { key: 'planning',          label: 'Planning Strategy',       labelAr: 'استراتيجية التخطيط',     icon: '📅' },
    { key: 'sourcing',          label: 'Sourcing Strategy',       labelAr: 'استراتيجية التوريد',      icon: '🔍' },
    { key: 'negotiation',       label: 'Negotiation Approach',    labelAr: 'أسلوب التفاوض',           icon: '🤝' },
    { key: 'supplierSelection', label: 'Supplier Selection',      labelAr: 'اختيار الموردين',         icon: '✅' },
    { key: 'srm',               label: 'Supplier Relationship',   labelAr: 'إدارة علاقات الموردين',   icon: '🔗' },
  ] as const;

  return (
    <div className={`min-h-screen bg-slate-50 ${isAr ? 'rtl' : 'ltr'}`}>
      {/* ── Hero ── */}
      <div className="relative bg-gradient-to-br from-[#082C6B] via-[#0e3d8a] to-[#1a1a3e] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #C9A84C 0%, transparent 50%), radial-gradient(circle at 80% 20%, #4f46e5 0%, transparent 50%)' }} />
        <div className="relative container mx-auto px-6 py-14">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
              <Layers className="w-8 h-8 text-[#C9A84C]" />
            </div>
            <div>
              <p className="text-[#C9A84C] text-sm font-bold uppercase tracking-widest mb-1">
                {isAr ? 'أداة تحليل المحفظة الشرائية' : 'Procurement Portfolio Intelligence'}
              </p>
              <h1 className="text-3xl lg:text-4xl font-black leading-tight">
                {isAr ? 'مصفوفة كرالجيك' : 'Kraljic Matrix Analyser'}
              </h1>
            </div>
          </div>
          <p className="text-white/75 text-base max-w-2xl leading-relaxed mb-6">
            {isAr
              ? 'صنّف فئاتك وأصنافك في المحفظة الشرائية بناءً على الأثر الربحي ومخاطر الإمداد — مع خطط عمل معايَرة حسب الصناعة في الاستراتيجية، والتوريد، والتفاوض، واختيار الموردين، وإدارة العلاقات.'
              : 'Classify your categories and SKUs across four procurement quadrants based on profit impact and supply risk — with industry-calibrated corrective action plans covering planning, sourcing, negotiation, supplier selection, and SRM.'}
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-white/60">
            {['Kraljic (1983) HBR Framework', 'CIPS Category Management', 'GCC-Calibrated Thresholds', 'Arabic / English'].map(t => (
              <span key={t} className="px-3 py-1 rounded-full border border-white/20 bg-white/5">{t}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">

        {/* ── Industry Selector ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6">
          <div className="flex items-start gap-3 flex-wrap">
            <div className="shrink-0 pt-0.5">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {isAr ? 'القطاع الصناعي' : 'Industry / Sector'}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {isAr ? 'يضبط حدود المربعات الأربعة' : 'Adjusts quadrant thresholds'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap flex-1">
              <button
                onClick={() => handleIndustryChange(null)}
                className="text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all whitespace-nowrap"
                style={!selectedIndustry ? { background: '#082C6B', color: '#fff', borderColor: '#082C6B' } : { background: '#fff', color: '#6b7280', borderColor: '#e5e7eb' }}
              >
                🌍 {isAr ? 'عام' : 'General GCC'}
              </button>
              {INDUSTRIES.map(ind => (
                <button key={ind.id} onClick={() => handleIndustryChange(ind.id)} title={ind.description}
                  className="text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all whitespace-nowrap"
                  style={selectedIndustry === ind.id ? { background: '#082C6B', color: '#fff', borderColor: '#082C6B' } : { background: '#fff', color: '#6b7280', borderColor: '#e5e7eb' }}
                >
                  {ind.icon} {isAr ? ind.labelAr : ind.label}
                </button>
              ))}
            </div>
            {selectedIndustry && (
              <p className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 shrink-0">
                ✓ {isAr ? `حدود مُعدَّلة لـ ${INDUSTRIES.find(i => i.id === selectedIndustry)?.labelAr}` : `Thresholds calibrated for ${INDUSTRIES.find(i => i.id === selectedIndustry)?.label}`}
              </p>
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 mb-6 bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                activeTab === tab.id ? 'bg-[#082C6B] text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{isAr ? tab.labelAr : tab.label}</span>
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* TAB: Data Entry                                                    */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'data' && (
          <div className="space-y-4">
            {/* Upload / Download bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap gap-3 items-center">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800">
                  {isAr ? 'استيراد البيانات من CSV' : 'Upload your portfolio data'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isAr
                    ? 'حمّل النموذج أولاً، ثم أدخل بياناتك وارفعه. أو أدخل البيانات يدوياً في الجدول أدناه.'
                    : 'Download the template, fill it with your spend data, then upload. Or enter data directly in the table below.'}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2 text-xs">
                  <Download className="w-3.5 h-3.5" />
                  {isAr ? 'تحميل النموذج' : 'Download Template'}
                </Button>
                <Button size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2 text-xs bg-[#082C6B] hover:bg-[#0e3d8a]">
                  <Upload className="w-3.5 h-3.5" />
                  {isAr ? 'رفع CSV' : 'Upload CSV'}
                </Button>
                <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
              </div>
            </div>

            {/* Column definitions */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-800 space-y-0.5">
                <p className="font-semibold">{isAr ? 'دليل التقييم (1–5):' : 'Rating guide (1–5):'}</p>
                <p>• <strong>{isAr ? 'تأثير الجودة' : 'Quality Impact'}</strong>: {isAr ? '1 = لا تأثير، 5 = حرج للعمليات' : '1 = no quality dependency, 5 = critical to product/service quality'}</p>
                <p>• <strong>{isAr ? 'تأثير الإيراد' : 'Revenue Impact'}</strong>: {isAr ? '1 = لا تأثير، 5 = محرك رئيسي للإيراد' : '1 = marginal, 5 = major revenue driver or cost-of-goods item'}</p>
                <p>• <strong>{isAr ? 'تنافسية السوق' : 'Market Competitiveness'}</strong>: {isAr ? '1 = احتكار، 5 = سوق تنافسي جداً' : '1 = monopoly/single source, 5 = many competing suppliers'}</p>
                <p>• <strong>{isAr ? 'الخطر الجغرافي' : 'Geographic Risk'}</strong>: {isAr ? '1 = محلي/منخفض الخطر، 5 = واحدة مصدر أو منطقة عالية الخطر' : '1 = local/low risk, 5 = single-country source or high geopolitical risk'}</p>
                <p>• <strong>{isAr ? 'قابلية الاستبدال' : 'Substitutability'}</strong>: {isAr ? '1 = لا بديل، 5 = يمكن استبداله بسهولة' : '1 = no substitute exists, 5 = easily replaced with alternative'}</p>
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-3 py-2.5 text-left font-semibold text-slate-600 whitespace-nowrap">{isAr ? 'الفئة' : 'Category'}</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-slate-600 whitespace-nowrap">{isAr ? 'الفئة الفرعية' : 'Subcategory'}</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-slate-600 whitespace-nowrap">{isAr ? 'اسم الصنف / الخدمة' : 'Item / Service Name'}</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-slate-600 whitespace-nowrap">{isAr ? 'الإنفاق السنوي (ر.س)' : 'Annual Spend (SAR)'}</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-slate-600 whitespace-nowrap">{isAr ? 'الكمية' : 'Qty'}</th>
                      <th className="px-3 py-2.5 text-center font-semibold text-slate-600 whitespace-nowrap">{isAr ? 'الوحدة' : 'Unit'}</th>
                      <th className="px-3 py-2.5 text-center font-semibold text-slate-600 whitespace-nowrap" title="Number of qualified suppliers currently on your approved vendor list">{isAr ? 'عدد الموردين' : '# Suppliers'}</th>
                      <th className="px-3 py-2.5 text-center font-semibold text-slate-600 whitespace-nowrap" title="Average lead time from PO to delivery">{isAr ? 'مهلة التسليم (أيام)' : 'Lead Time (d)'}</th>
                      <th className="px-3 py-2.5 text-center font-semibold text-slate-600 whitespace-nowrap" title="Quality Impact 1-5">{isAr ? 'تأثير الجودة' : 'Quality'}</th>
                      <th className="px-3 py-2.5 text-center font-semibold text-slate-600 whitespace-nowrap" title="Revenue/Business Impact 1-5">{isAr ? 'تأثير الإيراد' : 'Revenue'}</th>
                      <th className="px-3 py-2.5 text-center font-semibold text-slate-600 whitespace-nowrap" title="Market Competitiveness 1-5 (5 = many suppliers)">{isAr ? 'تنافسية السوق' : 'Mkt Comp.'}</th>
                      <th className="px-3 py-2.5 text-center font-semibold text-slate-600 whitespace-nowrap" title="Geographic / Geopolitical Risk 1-5">{isAr ? 'خطر جغرافي' : 'Geo Risk'}</th>
                      <th className="px-3 py-2.5 text-center font-semibold text-slate-600 whitespace-nowrap" title="Substitutability 1-5 (5 = very easy to substitute)">{isAr ? 'قابلية الاستبدال' : 'Substit.'}</th>
                      <th className="px-2 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-2 py-1.5">
                          <input value={item.category} onChange={e => updateItem(item.id, 'category', e.target.value)} placeholder={isAr ? 'مثال: تقنية' : 'e.g. IT Equipment'} className="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#082C6B] min-w-[110px]" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input value={item.subcategory} onChange={e => updateItem(item.id, 'subcategory', e.target.value)} placeholder={isAr ? 'فئة فرعية' : 'Hardware'} className="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#082C6B] min-w-[90px]" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input value={item.itemName} onChange={e => updateItem(item.id, 'itemName', e.target.value)} placeholder={isAr ? 'اسم الصنف' : 'Item name'} className="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#082C6B] min-w-[120px]" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" min="0" value={item.annualSpend || ''} onChange={e => updateItem(item.id, 'annualSpend', parseFloat(e.target.value) || 0)} placeholder="0" className="w-full text-xs border border-slate-200 rounded px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-[#082C6B] min-w-[100px]" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" min="0" value={item.annualQty || ''} onChange={e => updateItem(item.id, 'annualQty', parseFloat(e.target.value) || 0)} placeholder="0" className="w-full text-xs border border-slate-200 rounded px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-[#082C6B] w-20" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)} className="text-xs border border-slate-200 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#082C6B] w-14 text-center" />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <input type="number" min="1" max="99" value={item.supplierCount} onChange={e => updateItem(item.id, 'supplierCount', Math.max(1, parseInt(e.target.value) || 1))} className="text-xs border border-slate-200 rounded px-1.5 py-1 text-center focus:outline-none focus:ring-1 focus:ring-[#082C6B] w-16" />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <input type="number" min="0" value={item.leadTimeDays} onChange={e => updateItem(item.id, 'leadTimeDays', Math.max(0, parseInt(e.target.value) || 0))} className="text-xs border border-slate-200 rounded px-1.5 py-1 text-center focus:outline-none focus:ring-1 focus:ring-[#082C6B] w-16" />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <RatingSelect value={item.qualityImpact} onChange={v => updateItem(item.id, 'qualityImpact', v)} title="Quality Impact: 1 = no dependency, 5 = critical" />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <RatingSelect value={item.revenueImpact} onChange={v => updateItem(item.id, 'revenueImpact', v)} title="Revenue Impact: 1 = marginal, 5 = major revenue driver" />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <RatingSelect value={item.marketCompetitiveness} onChange={v => updateItem(item.id, 'marketCompetitiveness', v)} title="Market Competitiveness: 1 = monopoly, 5 = many suppliers" />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <RatingSelect value={item.geographicRisk} onChange={v => updateItem(item.id, 'geographicRisk', v)} title="Geographic Risk: 1 = local/low risk, 5 = very high geopolitical risk" />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <RatingSelect value={item.substitutability} onChange={v => updateItem(item.id, 'substitutability', v)} title="Substitutability: 1 = no substitute, 5 = easily substituted" />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <button onClick={() => removeRow(item.id)} disabled={items.length === 1} className="text-slate-300 hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
                <button onClick={addRow} className="flex items-center gap-1.5 text-xs text-[#082C6B] font-semibold hover:text-[#0e3d8a] transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                  {isAr ? 'إضافة صنف' : 'Add row'}
                </button>
                {validItems.length > 0 && (
                  <button onClick={() => setActiveTab('matrix')} className="flex items-center gap-2 bg-[#082C6B] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[#0e3d8a] transition-colors">
                    <BarChart3 className="w-3.5 h-3.5" />
                    {isAr ? `عرض المصفوفة (${validItems.length} صنف)` : `View Matrix (${validItems.length} item${validItems.length !== 1 ? 's' : ''})`}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* TAB: Matrix                                                        */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'matrix' && (
          <div className="space-y-6">
            {scored.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
                <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-semibold">{isAr ? 'لا توجد بيانات بعد' : 'No data yet'}</p>
                <p className="text-slate-400 text-sm mt-1">{isAr ? 'أدخل بياناتك في تبويب إدخال البيانات' : 'Enter items with spend values in the Data Entry tab'}</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => setActiveTab('data')}>
                  {isAr ? 'إدخال البيانات' : 'Go to Data Entry'}
                </Button>
              </div>
            ) : (
              <>
                {/* Quadrant summary cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {(['strategic', 'leverage', 'bottleneck', 'non-critical'] as KraljicQuadrant[]).map(q => {
                    const meta = QUADRANT_META[q];
                    const items = byQuadrant[q];
                    const spend = items.reduce((s, i) => s + i.annualSpend, 0);
                    return (
                      <div key={q} className="rounded-2xl border-2 p-4 bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                        style={{ borderColor: meta.border }}
                        onClick={() => { setFilterQuadrant(q); setActiveTab('actions'); }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{meta.icon}</span>
                          <span className="text-2xl font-black" style={{ color: meta.color }}>{items.length}</span>
                        </div>
                        <p className="font-bold text-sm" style={{ color: meta.color }}>{isAr ? meta.labelAr : meta.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{isAr ? 'إجمالي الإنفاق:' : 'Spend:'} SAR {spend.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400 mt-1 leading-tight">{isAr ? meta.taglineAr : meta.tagline}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Matrix scatter plot */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="font-bold text-slate-800 text-base">{isAr ? 'مصفوفة كرالجيك' : 'Kraljic Procurement Matrix'}</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isAr ? 'حجم الفقاعة = الإنفاق السنوي · انقر على أي نقطة للتفاصيل' : 'Bubble size = annual spend · hover for details'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(['strategic', 'leverage', 'bottleneck', 'non-critical'] as KraljicQuadrant[]).map(q => (
                        <span key={q} className="flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full" style={{ background: QUADRANT_FILL[q], color: QUADRANT_COLORS[q] }}>
                          {QUADRANT_META[q].icon} {isAr ? QUADRANT_META[q].labelAr : QUADRANT_META[q].label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={480}>
                    <ScatterChart margin={{ top: 20, right: 30, bottom: 50, left: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

                      {/* Quadrant backgrounds */}
                      <ReferenceArea x1={0} x2={threshold.riskThreshold} y1={threshold.impactThreshold} y2={100} fill={QUADRANT_FILL.leverage} fillOpacity={0.6}>
                        <Label value={isAr ? 'نفوذ سوقي' : 'LEVERAGE'} position="center" fill={QUADRANT_COLORS.leverage} fontWeight="800" fontSize={11} />
                      </ReferenceArea>
                      <ReferenceArea x1={threshold.riskThreshold} x2={100} y1={threshold.impactThreshold} y2={100} fill={QUADRANT_FILL.strategic} fillOpacity={0.6}>
                        <Label value={isAr ? 'استراتيجي' : 'STRATEGIC'} position="center" fill={QUADRANT_COLORS.strategic} fontWeight="800" fontSize={11} />
                      </ReferenceArea>
                      <ReferenceArea x1={0} x2={threshold.riskThreshold} y1={0} y2={threshold.impactThreshold} fill={QUADRANT_FILL['non-critical']} fillOpacity={0.6}>
                        <Label value={isAr ? 'غير حرج' : 'NON-CRITICAL'} position="center" fill={QUADRANT_COLORS['non-critical']} fontWeight="800" fontSize={10} />
                      </ReferenceArea>
                      <ReferenceArea x1={threshold.riskThreshold} x2={100} y1={0} y2={threshold.impactThreshold} fill={QUADRANT_FILL.bottleneck} fillOpacity={0.6}>
                        <Label value={isAr ? 'اختناق' : 'BOTTLENECK'} position="center" fill={QUADRANT_COLORS.bottleneck} fontWeight="800" fontSize={11} />
                      </ReferenceArea>

                      {/* Threshold lines */}
                      <ReferenceLine x={threshold.riskThreshold} stroke="#94a3b8" strokeDasharray="6 3" strokeWidth={1.5} />
                      <ReferenceLine y={threshold.impactThreshold} stroke="#94a3b8" strokeDasharray="6 3" strokeWidth={1.5} />

                      <XAxis dataKey="x" type="number" domain={[0, 100]} name="Supply Risk"
                        label={{ value: isAr ? '← مخاطر الإمداد →' : '← Supply Risk (0 = Low · 100 = High) →', position: 'insideBottom', offset: -12, fontSize: 12, fontWeight: 600, fill: '#475569' }}
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                      />
                      <YAxis dataKey="y" type="number" domain={[0, 100]} name="Profit Impact"
                        label={{ value: isAr ? 'الأثر الربحي' : 'Profit Impact →', angle: -90, position: 'insideLeft', offset: 12, fontSize: 12, fontWeight: 600, fill: '#475569' }}
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                      />
                      <ZAxis dataKey="z" range={[60, 800]} />
                      <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />

                      {scatterData.map(({ quad, data }) => data.length > 0 && (
                        <Scatter key={quad} name={QUADRANT_META[quad].label} data={data} fill={QUADRANT_COLORS[quad]} fillOpacity={0.8} stroke="white" strokeWidth={1.5} />
                      ))}
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>

                {/* Items list */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-sm">{isAr ? 'تفاصيل المحفظة' : 'Portfolio Breakdown'}</h3>
                    <span className="text-xs text-slate-500">{scored.length} {isAr ? 'صنف/فئة' : 'items'}</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {scored.sort((a, b) => b.annualSpend - a.annualSpend).map(item => {
                      const meta = QUADRANT_META[item.quadrant];
                      return (
                        <div key={item.id} className="px-5 py-3 flex items-center gap-4">
                          <span className="text-lg shrink-0">{meta.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{item.itemName || item.category}</p>
                            <p className="text-xs text-slate-400">{[item.category, item.subcategory].filter(Boolean).join(' › ')}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: meta.bg, color: meta.color }}>
                              {isAr ? meta.labelAr : meta.label}
                            </span>
                            <p className="text-xs text-slate-500 mt-1">SAR {item.annualSpend.toLocaleString()}</p>
                          </div>
                          <div className="shrink-0 text-right hidden sm:block">
                            <p className="text-[11px] text-slate-500">Risk <span className="font-bold text-slate-700">{item.supplyRiskScore}</span></p>
                            <p className="text-[11px] text-slate-500">Impact <span className="font-bold text-slate-700">{item.profitImpactScore}</span></p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* TAB: Action Plans                                                  */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'actions' && (
          <div className="space-y-4">
            {scored.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
                <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-semibold">{isAr ? 'لا توجد بيانات' : 'No items scored yet'}</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => setActiveTab('data')}>
                  {isAr ? 'إدخال البيانات' : 'Enter Data'}
                </Button>
              </div>
            ) : (
              <>
                {/* Quadrant filter */}
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setFilterQuadrant(null)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${!filterQuadrant ? 'bg-[#082C6B] text-white border-[#082C6B]' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                    {isAr ? `الكل (${scored.length})` : `All (${scored.length})`}
                  </button>
                  {(['strategic', 'leverage', 'bottleneck', 'non-critical'] as KraljicQuadrant[]).map(q => {
                    const meta = QUADRANT_META[q];
                    const count = byQuadrant[q].length;
                    if (!count) return null;
                    return (
                      <button key={q} onClick={() => setFilterQuadrant(filterQuadrant === q ? null : q)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-all"
                        style={filterQuadrant === q ? { background: QUADRANT_COLORS[q], color: '#fff', borderColor: QUADRANT_COLORS[q] } : { background: meta.bg, color: QUADRANT_COLORS[q], borderColor: meta.border }}>
                        {meta.icon} {isAr ? meta.labelAr : meta.label} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Item action cards */}
                {filteredScored.sort((a, b) => b.annualSpend - a.annualSpend).map(item => {
                  const meta = QUADRANT_META[item.quadrant];
                  const plan = ACTION_PLANS[item.quadrant];
                  const isOpen = expanded.has(item.id);
                  return (
                    <div key={item.id} className="bg-white border-2 rounded-2xl shadow-sm overflow-hidden" style={{ borderColor: meta.border }}>
                      {/* Card header */}
                      <button className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-slate-50/50 transition-colors"
                        onClick={() => toggleExpanded(item.id)}>
                        <span className="text-2xl shrink-0">{meta.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-slate-800 text-sm">{item.itemName || item.category}</h3>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: meta.bg, color: QUADRANT_COLORS[item.quadrant] }}>
                              {isAr ? meta.labelAr : meta.label}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
                            {item.subcategory && <span>{item.category} › {item.subcategory}</span>}
                            <span>SAR {item.annualSpend.toLocaleString()}</span>
                            <span>{isAr ? 'خطر الإمداد' : 'Risk'}: <strong>{item.supplyRiskScore}</strong>/100</span>
                            <span>{isAr ? 'الأثر الربحي' : 'Impact'}: <strong>{item.profitImpactScore}</strong>/100</span>
                            <span>{item.supplierCount} {isAr ? 'موردين' : 'suppliers'}</span>
                            <span>{item.leadTimeDays}d {isAr ? 'مهلة التسليم' : 'lead time'}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 italic">{isAr ? meta.taglineAr : meta.tagline}</p>
                        </div>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                      </button>

                      {/* Action plan sections */}
                      {isOpen && (
                        <div className="border-t border-slate-100 divide-y divide-slate-100">
                          {ACTION_SECTIONS.map(({ key, label, labelAr, icon }) => {
                            const lines = isAr ? (plan[`${key}Ar` as keyof typeof plan] as string[]) : (plan[key as keyof typeof plan] as string[]);
                            const sectionOpen = expandedSection[item.id] === key;
                            return (
                              <div key={key}>
                                <button
                                  className="w-full px-5 py-3 flex items-center gap-3 text-left hover:bg-slate-50/30 transition-colors"
                                  onClick={() => toggleSection(item.id, key)}
                                >
                                  <span className="text-base shrink-0">{icon}</span>
                                  <span className="flex-1 font-semibold text-sm text-slate-700">{isAr ? labelAr : label}</span>
                                  <span className="text-xs text-slate-400 shrink-0">{lines.length} {isAr ? 'إجراءات' : 'actions'}</span>
                                  {sectionOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                                </button>
                                {sectionOpen && (
                                  <ul className="px-5 pb-4 space-y-2">
                                    {lines.map((line, i) => (
                                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                        <span className="shrink-0 mt-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: QUADRANT_COLORS[item.quadrant] }}>{i + 1}</span>
                                        <span className="leading-relaxed">{line}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* TAB: AI Brief                                                      */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'ai' && (
          <div className="max-w-3xl mx-auto">
            {scored.length < 2 ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
                <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-semibold">{isAr ? 'أدخل صنفين على الأقل' : 'Add at least 2 items with spend'}</p>
                <p className="text-slate-400 text-sm mt-1">{isAr ? 'سيُولّد الذكاء الاصطناعي تقريراً شاملاً لمحفظة المشتريات' : 'AI will generate a full procurement portfolio brief once you have at least 2 scored items'}</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => setActiveTab('data')}>
                  {isAr ? 'إدخال البيانات' : 'Enter Data'}
                </Button>
              </div>
            ) : (
              <AIPlan state={aiPlan} isAr={isAr} toolKey="kraljic" />
            )}
          </div>
        )}

      </div>
    </div>
  );
}
