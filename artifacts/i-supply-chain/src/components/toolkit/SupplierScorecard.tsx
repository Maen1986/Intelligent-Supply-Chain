/**
 * Supplier Scorecard Tool v2 — multi-supplier roster + sub-indicators
 * per dimension, weighted scoring, tier badge, RadarChart.
 */
import React, { useState } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Printer, Plus, Trash2, Users } from 'lucide-react';
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

/* ─── Types ─── */
interface SubIndicator {
  id: string;
  label: string;
  labelAr: string;
  note?: string;
  noteAr?: string;
}

interface Dimension {
  id: string;
  label: string;
  labelAr: string;
  weight: number;
}

interface SupplierRecord {
  id: string;
  name: string;
  tier: string;
  subScores: Record<string, Record<string, string>>; // dimId → { subId → value }
}

interface RosterState {
  suppliers: SupplierRecord[];
  activeId: string;
}

/* ─── Dimensions (unchanged weights) ─── */
const DIMS: Dimension[] = [
  { id: 'delivery',     label: 'Delivery Performance',  labelAr: 'أداء التسليم',          weight: 25 },
  { id: 'quality',      label: 'Quality',               labelAr: 'الجودة',                weight: 25 },
  { id: 'cost',         label: 'Cost Competitiveness',  labelAr: 'التنافسية السعرية',     weight: 20 },
  { id: 'compliance',   label: 'Compliance',            labelAr: 'الامتثال',              weight: 15 },
  { id: 'innovation',   label: 'Innovation',            labelAr: 'الابتكار',              weight: 10 },
  { id: 'relationship', label: 'Relationship Quality',  labelAr: 'جودة العلاقة',          weight:  5 },
];

/* ─── Sub-indicators — all scored 0–100 (100 = best performance) ─── */
const SUB_INDICATORS: Record<string, SubIndicator[]> = {
  delivery: [
    { id: 'otif',      label: 'OTIF %',                             labelAr: 'OTIF %' },
    { id: 'lead_time', label: 'Lead Time Adherence %',              labelAr: 'الالتزام بمهلة التسليم %' },
    { id: 'fill_rate', label: 'Fill Rate %',                        labelAr: 'معدّل التعبئة %' },
    { id: 'expedite',  label: 'Low Expedite Rate score',            labelAr: 'انخفاض معدّل الطلبات الاستعجالية',
      note: '100 = zero emergency orders; deduct points for each expedite event',
      noteAr: '100 = لا طلبات استعجالية؛ اطرح نقاطاً عن كل حدث طارئ' },
  ],
  quality: [
    { id: 'defect',   label: 'Low Defect / Rejection Rate score',  labelAr: 'انخفاض معدّل العيوب / الرفض',
      note: '100 = zero defects; reduce score proportionally to defect rate',
      noteAr: '100 = لا عيوب؛ قلّل الدرجة بحسب نسبة العيوب' },
    { id: 'ftr',      label: 'First-Time-Right %',                  labelAr: 'معدّل الصحة من أول مرة %' },
    { id: 'cert',     label: 'Quality Cert Compliance %',           labelAr: 'الامتثال لشهادات الجودة %' },
    { id: 'nonconf',  label: 'Low Non-conformances score',          labelAr: 'انخفاض ملاحظات التدقيق',
      note: '100 = zero audit findings; deduct ~10 points per finding',
      noteAr: '100 = لا ملاحظات تدقيق؛ اطرح ~10 نقاط لكل ملاحظة' },
  ],
  cost: [
    { id: 'savings',        label: 'Price vs Market Benchmark (savings score)',  labelAr: 'الوفورات مقابل المعيار السوقي',
      note: 'Score 0–100 reflecting % savings versus market price',
      noteAr: 'درجة 0–100 تعكس % الوفورات مقارنةً بالسعر السوقي' },
    { id: 'invoice',        label: 'Invoice Accuracy %',                         labelAr: 'دقّة الفواتير %' },
    { id: 'cost_reduction', label: 'Cost Reduction YoY score',                   labelAr: 'درجة خفض التكلفة السنوي',
      note: '100 = ≥10% YoY reduction; 50 = flat; 0 = cost increased',
      noteAr: '100 = خفض ≥10% سنوياً؛ 50 = مستقر؛ 0 = ارتفاع التكلفة' },
    { id: 'tco',            label: 'TCO Transparency Score',                      labelAr: 'درجة شفافية إجمالي تكلفة الملكية',
      note: 'Rate 0–100: how fully the supplier discloses total cost of ownership',
      noteAr: 'قيّم 0–100: مدى إفصاح المورّد الكامل عن إجمالي تكلفة الملكية' },
  ],
  compliance: [
    { id: 'regulatory', label: 'Regulatory Compliance %',       labelAr: 'الامتثال التنظيمي %' },
    { id: 'esg',        label: 'ESG Audit Score',                labelAr: 'درجة تدقيق ESG',
      note: 'Score 0–100 from most recent ESG / sustainability assessment',
      noteAr: 'درجة 0–100 من أحدث تقييم ESG / الاستدامة' },
    { id: 'docs',       label: 'Document Completeness %',       labelAr: 'اكتمال الوثائق %' },
    { id: 'ethics',     label: 'Ethical Trading Score',          labelAr: 'درجة التداول الأخلاقي',
      note: 'Rate 0–100: code of conduct, modern slavery, anti-bribery adherence',
      noteAr: 'قيّم 0–100: قواعد السلوك، مكافحة العمل القسري، مكافحة الرشوة' },
  ],
  innovation: [
    { id: 'ideas',       label: 'Ideas Submitted score',           labelAr: 'درجة الأفكار المقدّمة',
      note: '100 = ≥10 improvement ideas contributed per year',
      noteAr: '100 = ≥10 أفكار تحسين سنوياً' },
    { id: 'implemented', label: 'Implemented Suggestions %',       labelAr: 'نسبة الاقتراحات المطبَّقة %' },
    { id: 'tech',        label: 'Technology Readiness Score',      labelAr: 'درجة الجاهزية التكنولوجية',
      note: 'Rate 0–100: e-invoicing, EDI, data sharing, digital procurement capabilities',
      noteAr: 'قيّم 0–100: الفاتورة الإلكترونية، EDI، مشاركة البيانات، المشتريات الرقمية' },
  ],
  relationship: [
    { id: 'responsiveness', label: 'Responsiveness Score',          labelAr: 'درجة سرعة الاستجابة',
      note: '100 = responds within 2 hours; reduce for slower response',
      noteAr: '100 = استجابة خلال ساعتين؛ قلّل عن كل تأخير' },
    { id: 'resolution',     label: 'Issue Resolution Speed score',  labelAr: 'درجة سرعة حلّ المشكلات',
      note: '100 = resolves issues within 1 business day',
      noteAr: '100 = حلّ المشكلات خلال يوم عمل واحد' },
    { id: 'collaboration',  label: 'Collaboration Score',           labelAr: 'درجة التعاون',
      note: 'Rate 0–100: joint planning, JBP engagement, information transparency',
      noteAr: 'قيّم 0–100: التخطيط المشترك، خطة الأعمال المشتركة، شفافية المعلومات' },
  ],
};

/* ─── Tiers ─── */
const TIERS = [
  { label: 'Strategic',     labelAr: 'استراتيجي', min: 75, color: '#082C6B', bg: '#082C6B15' },
  { label: 'Preferred',     labelAr: 'مفضّل',     min: 55, color: '#C9A84C', bg: '#C9A84C15' },
  { label: 'Transactional', labelAr: 'معاملاتي',  min:  0, color: '#64748b', bg: '#64748b15' },
];
const TIER_OPTIONS    = ['Strategic', 'Preferred', 'Transactional', 'New Supplier'];
const TIER_OPTIONS_AR = ['استراتيجي', 'مفضّل', 'معاملاتي', 'مورّد جديد'];

function getTier(score: number) { return TIERS.find(t => score >= t.min) ?? TIERS[2]; }

/* ─── Storage keys ─── */
const ROSTER_KEY = 'isc-tool-supplier-roster';
const LEGACY_KEY = 'isc-tool-supplier-scorecard';

function makeId(): string {
  return `sup-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function newSupplier(name = ''): SupplierRecord {
  return { id: makeId(), name, tier: 'Strategic', subScores: {} };
}

function loadRoster(): RosterState {
  try {
    const raw = localStorage.getItem(ROSTER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as RosterState;
      if (Array.isArray(parsed.suppliers) && parsed.suppliers.length > 0) return parsed;
    }
    // Backward-compatible migration from old single-supplier key
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const old = JSON.parse(legacy) as { name?: string; tier?: string; scores?: Record<string, string> };
      const subScores: Record<string, Record<string, string>> = {};
      if (old.scores) {
        for (const dimId of Object.keys(old.scores)) {
          const firstSub = SUB_INDICATORS[dimId]?.[0];
          if (firstSub && old.scores[dimId]) {
            subScores[dimId] = { [firstSub.id]: old.scores[dimId] };
          }
        }
      }
      const migrated = newSupplier(old.name ?? '');
      migrated.tier = old.tier ?? 'Strategic';
      migrated.subScores = subScores;
      return { suppliers: [migrated], activeId: migrated.id };
    }
  } catch { /* fall through */ }
  const initial = newSupplier();
  return { suppliers: [initial], activeId: initial.id };
}

/* ─── Score helpers ─── */
function calcDimScore(dimId: string, subScores: Record<string, Record<string, string>>): number | null {
  const subs = SUB_INDICATORS[dimId] ?? [];
  const vals = subs
    .map(s => parseFloat(subScores[dimId]?.[s.id] ?? ''))
    .filter(v => !isNaN(v) && v >= 0);
  if (vals.length === 0) return null;
  return Math.min(100, Math.max(0, Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)));
}

function calcWeightedScore(subScores: Record<string, Record<string, string>>): number | null {
  const dimScores = DIMS.map(d => calcDimScore(d.id, subScores));
  if (dimScores.some(s => s === null)) return null;
  const totalWeight = DIMS.reduce((s, d) => s + d.weight, 0);
  return Math.round(
    DIMS.reduce((sum, d, i) => sum + ((dimScores[i] as number) / 100) * d.weight, 0) / totalWeight * 100,
  );
}

/* ─── Component ─── */
interface SupplierScorecardProps { isAr: boolean; }

export function SupplierScorecardTool({ isAr }: SupplierScorecardProps) {
  const [roster, setRoster] = useState<RosterState>(loadRoster);

  const save = (next: RosterState) => {
    setRoster(next);
    safeSetItem(ROSTER_KEY, JSON.stringify(next));
  };

  const active = roster.suppliers.find(s => s.id === roster.activeId) ?? roster.suppliers[0] ?? null;

  const setActiveId = (id: string) => save({ ...roster, activeId: id });

  const updateActive = (patch: Partial<SupplierRecord>) => {
    save({
      ...roster,
      suppliers: roster.suppliers.map(s => s.id === active?.id ? { ...s, ...patch } : s),
    });
  };

  const setSubScore = (dimId: string, subId: string, val: string) => {
    const subScores = { ...active?.subScores };
    subScores[dimId] = { ...subScores[dimId], [subId]: val };
    updateActive({ subScores });
  };

  const addSupplier = () => {
    const s = newSupplier();
    save({ suppliers: [...roster.suppliers, s], activeId: s.id });
  };

  const deleteSupplier = (id: string) => {
    const label = isAr ? 'هل تريد حذف هذا المورّد؟' : 'Delete this supplier? This cannot be undone.';
    if (!window.confirm(label)) return;
    const remaining = roster.suppliers.filter(s => s.id !== id);
    if (remaining.length === 0) {
      const blank = newSupplier();
      save({ suppliers: [blank], activeId: blank.id });
    } else {
      const nextActive = id === roster.activeId ? remaining[0].id : roster.activeId;
      save({ suppliers: remaining, activeId: nextActive });
    }
  };

  const today = new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-GB');
  const weightedScore = active ? calcWeightedScore(active.subScores) : null;
  const tier = weightedScore !== null && weightedScore !== undefined ? getTier(weightedScore) : null;
  const radarData = DIMS.map(d => ({
    dimension: isAr ? d.labelAr : d.label,
    value: calcDimScore(d.id, active?.subScores ?? {}) ?? 0,
    fullMark: 100,
  }));

  return (
    <div className="print-zone-scorecard bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
      {/* Print-only header */}
      <div className="hidden print:block mb-4 pb-3 border-b border-gray-300">
        <p className="text-lg font-extrabold text-gray-900">{isAr ? '🏆 بطاقة تقييم المورّد' : '🏆 Supplier Scorecard'}</p>
        {active?.name && <p className="text-sm font-semibold text-gray-700">{isAr ? `المورّد: ${active.name}` : `Supplier: ${active.name}`}</p>}
        <p className="text-xs text-gray-500">{isAr ? `تاريخ التصدير: ${today}` : `Exported: ${today}`}</p>
      </div>

      {/* Header bar */}
      <div className="p-5 border-b border-border bg-teal-50 flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="text-sm font-bold text-primary">{isAr ? '🏆 أداة بطاقة تقييم المورّد' : '🏆 Supplier Scorecard Tool'}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {active?.name
              ? (isAr ? `التقييم: ${active.name} — يُحفظ تلقائياً` : `Evaluating: ${active.name} — auto-saved`)
              : (isAr ? 'أضف مورّداً أو اختر من القائمة' : 'Add a supplier or select from the roster')}
          </p>
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

        {/* ── Supplier Roster ── */}
        <div className="no-print border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-slate-50 border-b border-border">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-widest">
                {isAr ? 'قائمة المورّدين' : 'Supplier Roster'}
              </span>
              <span className="text-xs text-muted-foreground">({roster.suppliers.length})</span>
            </div>
            <button
              onClick={addSupplier}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-bold bg-teal-600 text-white hover:bg-teal-700 transition-colors"
            >
              <Plus className="w-3 h-3" />
              {isAr ? 'إضافة مورّد' : 'Add Supplier'}
            </button>
          </div>
          <div className="divide-y divide-border max-h-52 overflow-y-auto">
            {roster.suppliers.map(s => {
              const sc = calcWeightedScore(s.subScores);
              const t = sc !== null ? getTier(sc) : null;
              const isActive = s.id === roster.activeId;
              return (
                <div
                  key={s.id}
                  onClick={() => setActiveId(s.id)}
                  className={`flex items-center justify-between gap-3 px-4 py-2.5 cursor-pointer transition-colors ${isActive ? 'bg-primary/5' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                    <span className={`text-sm truncate ${isActive ? 'font-bold text-primary' : 'text-gray-700'}`}>
                      {s.name || (isAr ? 'مورّد جديد' : 'New Supplier')}
                    </span>
                    {t && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0"
                        style={{ background: t.bg, color: t.color }}>
                        {isAr ? t.labelAr : t.label}
                      </span>
                    )}
                    {sc !== null && (
                      <span className="text-xs font-bold shrink-0" style={{ color: t?.color }}>
                        {sc}/100
                      </span>
                    )}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); deleteSupplier(s.id); }}
                    className="text-muted-foreground hover:text-red-500 transition-colors p-1 rounded shrink-0"
                    aria-label={isAr ? 'حذف المورّد' : 'Delete supplier'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {active && (
          <>
            {/* Supplier info */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="scorecard-supplier-name" className="text-xs font-bold text-primary mb-1 block">
                  {isAr ? 'اسم المورّد' : 'Supplier Name'}
                </label>
                <input
                  id="scorecard-supplier-name"
                  className="w-full text-sm border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder={isAr ? 'أدخل اسم المورّد' : 'Enter supplier name'}
                  value={active.name}
                  onChange={e => updateActive({ name: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="scorecard-current-tier" className="text-xs font-bold text-primary mb-1 block">
                  {isAr ? 'الشريحة الحالية' : 'Current Tier'}
                </label>
                <select
                  id="scorecard-current-tier"
                  className="w-full text-sm border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={active.tier}
                  onChange={e => updateActive({ tier: e.target.value })}
                >
                  {TIER_OPTIONS.map((o, i) => (
                    <option key={o} value={o}>{isAr ? TIER_OPTIONS_AR[i] : o}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* ── Dimensions + Sub-indicators ── */}
            <div className="space-y-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                {isAr ? 'التقييم — أدخل 0–100 لكل مؤشر فرعي (100 = أفضل أداء)' : 'Evaluation — enter 0–100 per sub-indicator (100 = best)'}
              </p>
              {DIMS.map(d => {
                const dimScore = calcDimScore(d.id, active.subScores);
                const barColor = dimScore === null
                  ? '#e5e7eb'
                  : dimScore >= 75 ? '#22c55e'
                  : dimScore >= 55 ? '#f59e0b'
                  : '#ef4444';
                const subs = SUB_INDICATORS[d.id] ?? [];

                return (
                  <div key={d.id} className="border border-border rounded-xl overflow-hidden">
                    {/* Dimension header */}
                    <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-gray-50 border-b border-border">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary">{isAr ? d.labelAr : d.label}</span>
                        <span className="text-xs text-muted-foreground">{d.weight}{isAr ? '% وزن' : '% weight'}</span>
                      </div>
                      {dimScore !== null ? (
                        <span className="text-xs font-extrabold px-2 py-0.5 rounded-full shrink-0"
                          style={{ background: barColor + '22', color: barColor }}>
                          {dimScore}/100
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground shrink-0">{isAr ? 'لم يُدخَل بعد' : 'Not entered'}</span>
                      )}
                    </div>
                    {/* Progress bar */}
                    <div className="h-1 bg-gray-100">
                      <div className="h-full transition-all duration-300"
                        style={{ width: `${dimScore ?? 0}%`, background: barColor }} />
                    </div>
                    {/* Sub-indicator rows */}
                    <div className="p-3 space-y-2.5 bg-white">
                      {subs.map(sub => {
                        const note = isAr ? sub.noteAr : sub.note;
                        const currentVal = active.subScores[d.id]?.[sub.id] ?? '';
                        return (
                          <div key={sub.id} className="grid grid-cols-[1fr_68px_28px] gap-2 items-start">
                            <div>
                              <label
                                htmlFor={`sub-${d.id}-${sub.id}`}
                                className="text-xs text-gray-700 font-medium block leading-snug"
                              >
                                {isAr ? sub.labelAr : sub.label}
                              </label>
                              {note && (
                                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{note}</p>
                              )}
                            </div>
                            <input
                              id={`sub-${d.id}-${sub.id}`}
                              type="number" min={0} max={100} step={1}
                              value={currentVal}
                              onChange={e => setSubScore(d.id, sub.id, e.target.value)}
                              className="text-center text-sm border border-border rounded-lg px-1 py-1 focus:outline-none focus:ring-2 focus:ring-primary/30"
                              placeholder="0"
                            />
                            <span className="text-xs text-muted-foreground pt-1.5">/100</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Incomplete hint */}
            {weightedScore === null && Object.keys(active.subScores).length > 0 && (
              <p className="text-xs text-amber-600 text-center">
                {isAr
                  ? 'أدخل مؤشراً فرعياً واحداً على الأقل في كل بُعد لرؤية النتيجة الإجمالية'
                  : 'Enter at least one sub-indicator in every dimension to see the weighted total'}
              </p>
            )}

            {/* ── Results ── */}
            {weightedScore !== null && tier && (
              <div className="grid sm:grid-cols-2 gap-5 items-start">
                <div className="space-y-3">
                  <div className="rounded-xl p-5 text-center" style={{ background: tier.bg, border: `1px solid ${tier.color}30` }}>
                    <p className="text-xs text-muted-foreground mb-1">{isAr ? 'الدرجة المرجّحة' : 'Weighted Score'}</p>
                    <p className="text-4xl font-extrabold" style={{ color: tier.color }}>
                      {weightedScore}<span className="text-lg font-normal">/100</span>
                    </p>
                  </div>
                  <div className="rounded-xl p-4 text-center" style={{ background: tier.color, color: '#fff' }}>
                    <p className="text-xs opacity-75 mb-1">{isAr ? 'تصنيف المورّد' : 'Supplier Tier'}</p>
                    <p className="text-xl font-extrabold">
                      {isAr ? TIERS.find(t => t.label === tier.label)?.labelAr : tier.label}
                    </p>
                  </div>
                  <div className="rounded-xl p-4 bg-muted text-xs space-y-1">
                    <p className="font-bold text-primary mb-2">{isAr ? 'حدود الشرائح' : 'Tier Thresholds'}</p>
                    {TIERS.map(t => (
                      <div key={t.label} className="flex items-center justify-between">
                        <span style={{ color: t.color }} className="font-semibold">{isAr ? t.labelAr : t.label}</span>
                        <span className="text-muted-foreground">≥{t.min}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 text-center">
                    {isAr ? 'ملف الأداء' : 'Performance Profile'}
                  </p>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                      <PolarGrid />
                      <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 9, fill: '#6b7280' }} />
                      <Radar
                        name={active.name || (isAr ? 'المورّد' : 'Supplier')}
                        dataKey="value"
                        stroke={tier.color}
                        fill={tier.color}
                        fillOpacity={0.25}
                      />
                      <Tooltip formatter={(v: number) => [`${v}/100`, isAr ? 'الدرجة' : 'Score']} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
