/**
 * Problem Map (#192, 30 Aug 2026, Decision Record 8.7/8.10)
 *
 * Real, previously-blocked build item. Design proposal delivered 30 Aug
 * 2026 (ISC_Problem_Map_192_Design_Proposal.docx v2), approved with one
 * material correction made during build-out -- see resolveProblemMapPoints()
 * in workbench.ts for the full reasoning. In short:
 *
 *   Scatter (has severityScore): X = industry (Command Centre's own
 *   24-item INDUSTRY_TREE, the one dimension that genuinely co-occurs with
 *   severityScore), Y = severityScore 0-100 with Low/Medium/High bands,
 *   color = status, size = confidence%, tooltip carries subIndustry as the
 *   real Level-2 drill-down (mirrors KraljicMatrix.tsx's ScatterTooltip
 *   category -> subcategory pattern).
 *
 *   Wizard tally strip (Decision 2, Option A, "enhanced to the maximum"):
 *   Diagnostic-wizard submissions have no severityScore, so they can never
 *   honestly appear on the Y-axis. Tallied instead by focusArea (the one
 *   real taxonomy the wizard actually captures), with an explicit
 *   explanation of why, a link to the underlying list, and a CTA toward a
 *   full Consultancy Engine diagnosis that would produce real Problem DNA.
 *
 * Reuses KraljicMatrix.tsx's exact recharts import set and visual
 * conventions (ReferenceArea bands, custom Tooltip, legend-as-filter,
 * ResponsiveContainer) and MyWorkbench.tsx's data-fetch/auth-gate pattern.
 * No new backend table -- resolveProblemMapPoints() is a read-side
 * aggregation over data #167 (Problem DNA) and the Diagnostic wizard
 * already write.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceArea, Label,
} from 'recharts';
import {
  Loader2, Map as MapIcon, ListChecks, ArrowRight, Info, AlertCircle,
  CircleDot, Triangle, Square, Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { API_BASE } from '@/lib/apiBase';
import { Button } from '@/components/ui/button';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ProblemPoint {
  id: string; submissionId: number; industry: string; subIndustry: string | null;
  title: string; severityScore: number; status: string; framework: string | null;
  confidence: number | null; createdAt: string;
}
interface WizardTallyRow { focusArea: string; count: number; mostRecentAt: string }
interface ProblemMapResponse {
  ok: boolean; hasData: boolean; points: ProblemPoint[]; wizardTally: WizardTallyRow[];
}

type Tab = 'map' | 'list';
type Status = 'Active' | 'Recurring' | 'Resolved';

const STATUS_META: Record<Status, { color: string; fill: string; icon: React.ReactNode; label: string; labelAr: string }> = {
  Active:    { color: '#dc2626', fill: '#fee2e2', icon: <CircleDot className="w-3 h-3" />, label: 'Active',    labelAr: 'نشطة' },
  Recurring: { color: '#d97706', fill: '#fef3c7', icon: <Triangle className="w-3 h-3" />,  label: 'Recurring', labelAr: 'متكررة' },
  Resolved:  { color: '#059669', fill: '#d1fae5', icon: <Square className="w-3 h-3" />,    label: 'Resolved',  labelAr: 'محلولة' },
};
const STATUS_ORDER: Status[] = ['Active', 'Recurring', 'Resolved'];

const FOCUS_AREA_AR: Record<string, string> = {
  'Supply Chain Strategy': 'استراتيجية سلسلة الإمداد', Procurement: 'المشتريات', CLM: 'إدارة دورة حياة العقود',
  'Supplier Governance': 'حوكمة الموردين', 'Risk Management': 'إدارة المخاطر', Sustainability: 'الاستدامة',
  Resiliency: 'المرونة', 'Digital Transformation': 'التحول الرقمي', 'Organizational Design': 'التصميم التنظيمي',
  'Government Compliance': 'الامتثال الحكومي',
};

function severityBand(score: number): 'Low' | 'Medium' | 'High' {
  if (score >= 67) return 'High';
  if (score >= 34) return 'Medium';
  return 'Low';
}

// ─── Custom Tooltip ─────────────────────────────────────────────────────────

function ProblemTooltip({ active, payload, ar }: { active?: boolean; payload?: { payload: ProblemPoint & { x: number; y: number; z: number } }[]; ar: boolean }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const meta = STATUS_META[(d.status as Status) in STATUS_META ? (d.status as Status) : 'Active'];
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-xs max-w-[240px]">
      <p className="font-bold text-slate-800 mb-1">{d.title}</p>
      <p className="text-slate-500 mb-1.5">{d.industry}{d.subIndustry ? ` › ${d.subIndustry}` : ''}</p>
      <div className="flex items-center gap-1 mb-2">
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-white text-[10px] font-bold" style={{ background: meta.color }}>
          {meta.icon} {ar ? meta.labelAr : meta.label}
        </span>
      </div>
      <div className="space-y-0.5 text-slate-600">
        <div>{ar ? 'شدة المشكلة' : 'Severity'}: <span className="font-semibold text-slate-800">{d.severityScore}</span>/100 ({severityBand(d.severityScore)})</div>
        {d.framework && <div>{ar ? 'الإطار' : 'Framework'}: <span className="font-semibold">{d.framework}</span></div>}
        {d.confidence !== null && <div>{ar ? 'مستوى الثقة' : 'Confidence'}: <span className="font-semibold">{d.confidence}%</span></div>}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ProblemMap() {
  const { user, loading: authLoading } = useAuth();
  const { lang } = useLanguage();
  const ar = lang === 'ar';

  const [data, setData] = useState<ProblemMapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('map');
  const [visibleStatuses, setVisibleStatuses] = useState<Set<Status>>(new Set(STATUS_ORDER));
  const [industryFilter, setIndustryFilter] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    fetch(`${API_BASE}/workbench/problem-map`, { credentials: 'include' })
      .then(r => r.json())
      .then((res: ProblemMapResponse) => { if (res.ok) setData(res); })
      .catch(() => { /* honest-empty state below handles this */ })
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  // Mobile fallback (#192 Section 6): a 24-category scatter isn't legible
  // below a phone-width viewport, so default to the List tab there -- the
  // user can still switch to Map manually, this only sets the initial tab.
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) setActiveTab('list');
  }, []);

  const toggleStatus = (s: Status) => setVisibleStatuses(prev => {
    const next = new Set(prev);
    next.has(s) ? next.delete(s) : next.add(s);
    return next.size === 0 ? new Set(STATUS_ORDER) : next; // never allow isolating to zero
  });

  const industries = useMemo(() => Array.from(new Set((data?.points ?? []).map(p => p.industry))).sort(), [data]);

  const filteredPoints = useMemo(() => {
    return (data?.points ?? [])
      .filter(p => visibleStatuses.has((p.status as Status) in STATUS_META ? (p.status as Status) : 'Active'))
      .filter(p => !industryFilter || p.industry === industryFilter);
  }, [data, visibleStatuses, industryFilter]);

  const scatterByStatus = useMemo(() => {
    return STATUS_ORDER.map(status => ({
      status,
      data: filteredPoints
        .filter(p => ((p.status as Status) in STATUS_META ? p.status : 'Active') === status)
        .map(p => ({ ...p, x: p.industry, y: p.severityScore, z: p.confidence ?? 50 })),
    }));
  }, [filteredPoints]);

  const wizardTally = data?.wizardTally ?? [];
  const totalWizard = wizardTally.reduce((s, r) => s + r.count, 0);

  // ── Auth gate ─────────────────────────────────────────────────────────────
  if (!authLoading && !user) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-lg text-center">
        <MapIcon className="w-12 h-12 text-primary/30 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-primary mb-2">{ar ? 'خريطة المشكلات' : 'Problem Map'}</h1>
        <p className="text-muted-foreground mb-6">
          {ar
            ? 'سجّل الدخول لعرض مشكلاتك المشخَّصة موزعة حسب القطاع وشدة المشكلة.'
            : 'Sign in to see your diagnosed problems plotted by industry and severity.'}
        </p>
        <Link href="/login"><Button size="lg" className="bg-accent hover:bg-accent/90">{ar ? 'تسجيل الدخول' : 'Sign In'}</Button></Link>
      </div>
    );
  }

  if (loading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-24 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasAnything = (data?.hasData ?? false);

  return (
    <div className={`w-full ${ar ? 'rtl' : 'ltr'}`}>
      {/* ── Hero ── */}
      <div className="relative w-full overflow-hidden bg-[#082C6B]" style={{ minHeight: 180 }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 60% 100%, rgba(201,168,76,0.2) 0%, transparent 60%), linear-gradient(135deg, #082C6B 0%, #0B3D91 100%)' }} />
        <div className="relative z-10 container mx-auto px-4 py-12 text-center max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-accent/20 border border-accent/30 rounded-full px-4 py-1.5 mb-4">
            <MapIcon className="w-4 h-4 text-accent" />
            <span className="text-accent font-bold text-sm uppercase tracking-widest">{ar ? 'خريطة المشكلات' : 'Problem Map'}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {ar ? 'مشكلاتك المشخَّصة، بصريًا' : 'Your Diagnosed Problems, Visually'}
          </h1>
          <p className="text-white/70 text-sm">
            {ar
              ? 'كل مشكلة حقيقية من محرك الاستشارات موزَّعة حسب القطاع وشدة المشكلة — بياناتك الفعلية فقط، دون تقديرات.'
              : 'Every real problem from the Consultancy Engine, plotted by industry and severity -- your actual data only, nothing estimated.'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {!hasAnything ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <MapIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-semibold">{ar ? 'لا توجد بيانات بعد' : 'No problems logged yet'}</p>
            <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">
              {ar
                ? 'شغّل تشخيصًا عبر محرك الاستشارات أو أداة التشخيص، وستبدأ هذه الخريطة بالتكوّن تلقائيًا.'
                : 'Run a Consultancy Engine diagnosis or the Diagnostic tool, and this map will start populating automatically.'}
            </p>
            <Link href="/command-center"><Button size="sm" className="mt-4 gap-2 bg-[#082C6B] hover:bg-[#0e3d8a]">
              {ar ? 'فتح محرك الاستشارات' : 'Open the Consultancy Engine'} <ArrowRight className="w-3.5 h-3.5" />
            </Button></Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ── Tabs ── */}
            <div className="flex gap-1 bg-white border border-slate-200 rounded-2xl p-1 shadow-sm w-fit">
              {([
                { id: 'map' as Tab, label: 'Map', labelAr: 'الخريطة', icon: <MapIcon className="w-4 h-4" /> },
                { id: 'list' as Tab, label: 'List', labelAr: 'القائمة', icon: <ListChecks className="w-4 h-4" /> },
              ]).map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${
                    activeTab === tab.id ? 'bg-[#082C6B] text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {tab.icon} {ar ? tab.labelAr : tab.label}
                </button>
              ))}
            </div>

            {filteredPoints.length === 0 && data && data.points.length === 0 ? null : (
              <>
                {/* ── Legend / filters (as a real control, not decoration) ── */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-wrap items-center gap-3">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{ar ? 'الحالة' : 'Status'}</span>
                  {STATUS_ORDER.map(s => {
                    const meta = STATUS_META[s];
                    const on = visibleStatuses.has(s);
                    return (
                      <button key={s} onClick={() => toggleStatus(s)}
                        className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all"
                        style={on ? { background: meta.fill, color: meta.color, borderColor: meta.color } : { background: '#fff', color: '#cbd5e1', borderColor: '#e5e7eb' }}
                        title={ar ? 'انقر للعزل/المقارنة' : 'Click to isolate/compare'}
                      >
                        {meta.icon} {ar ? meta.labelAr : meta.label}
                      </button>
                    );
                  })}
                  {industries.length > 1 && (
                    <>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ms-2">{ar ? 'القطاع' : 'Industry'}</span>
                      <select value={industryFilter ?? ''} onChange={e => setIndustryFilter(e.target.value || null)}
                        className="text-[11px] border border-slate-200 rounded-full px-2.5 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-[#082C6B]">
                        <option value="">{ar ? 'كل القطاعات' : 'All industries'}</option>
                        {industries.map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </>
                  )}
                </div>

                {/* ── TAB: Map ── */}
                {activeTab === 'map' && (
                  filteredPoints.length === 0 ? (
                    <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center">
                      <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500 text-sm">{ar ? 'لا توجد نقاط مطابقة للفلاتر الحالية' : 'No points match the current filters'}</p>
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                      <div className="mb-4">
                        <h2 className="font-bold text-slate-800 text-base">{ar ? 'خريطة المشكلات' : 'Problem Map'}</h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {ar ? 'حجم الفقاعة = مستوى الثقة · انقر على شريحة الحالة أعلاه للعزل أو المقارنة' : 'Bubble size = confidence % · click a status chip above to isolate or compare'}
                        </p>
                      </div>
                      <ResponsiveContainer width="100%" height={440}>
                        <ScatterChart margin={{ top: 20, right: 30, bottom: 60, left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <ReferenceArea y1={0} y2={33} fill="#f0fdf4" fillOpacity={0.5}>
                            <Label value={ar ? 'منخفضة' : 'LOW'} position="insideTopLeft" fill="#059669" fontWeight="700" fontSize={10} />
                          </ReferenceArea>
                          <ReferenceArea y1={34} y2={66} fill="#fffbeb" fillOpacity={0.5}>
                            <Label value={ar ? 'متوسطة' : 'MEDIUM'} position="insideTopLeft" fill="#d97706" fontWeight="700" fontSize={10} />
                          </ReferenceArea>
                          <ReferenceArea y1={67} y2={100} fill="#fef2f2" fillOpacity={0.5}>
                            <Label value={ar ? 'عالية' : 'HIGH'} position="insideTopLeft" fill="#dc2626" fontWeight="700" fontSize={10} />
                          </ReferenceArea>
                          <XAxis dataKey="x" type="category" allowDuplicatedCategory={false} name="Industry"
                            angle={-28} textAnchor="end" height={70}
                            label={{ value: ar ? 'القطاع' : 'Industry', position: 'insideBottom', offset: -55, fontSize: 12, fontWeight: 600, fill: '#475569' }}
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                          />
                          <YAxis dataKey="y" type="number" domain={[0, 100]} name="Severity"
                            label={{ value: ar ? '← شدة المشكلة' : '← Severity Score', angle: -90, position: 'insideLeft', offset: 8, fontSize: 12, fontWeight: 600, fill: '#475569' }}
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                          />
                          <ZAxis dataKey="z" range={[60, 500]} />
                          <Tooltip content={<ProblemTooltip ar={ar} />} cursor={{ strokeDasharray: '3 3' }} />
                          {scatterByStatus.map(({ status, data: sd }) => sd.length > 0 && (
                            <Scatter key={status} name={status} data={sd} fill={STATUS_META[status].color} fillOpacity={0.8} stroke="white" strokeWidth={1.5} />
                          ))}
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  )
                )}

                {/* ── TAB: List ── */}
                {activeTab === 'list' && (
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="font-bold text-slate-800 text-sm">{ar ? 'المشكلات' : 'Problems'}</h3>
                      <span className="text-xs text-slate-500">{filteredPoints.length} {ar ? 'مشكلة' : 'problems'}</span>
                    </div>
                    {filteredPoints.length === 0 ? (
                      <p className="text-slate-400 text-sm text-center py-10">{ar ? 'لا توجد نقاط مطابقة للفلاتر الحالية' : 'No points match the current filters'}</p>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {[...filteredPoints].sort((a, b) => b.severityScore - a.severityScore).map(p => {
                          const meta = STATUS_META[(p.status as Status) in STATUS_META ? (p.status as Status) : 'Active'];
                          return (
                            <div key={p.id} className="px-5 py-3 flex items-center gap-4">
                              <span className="shrink-0" style={{ color: meta.color }}>{meta.icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-800 truncate">{p.title}</p>
                                <p className="text-xs text-slate-400">{p.industry}{p.subIndustry ? ` › ${p.subIndustry}` : ''}{p.framework ? ` · ${p.framework}` : ''}</p>
                              </div>
                              <div className="shrink-0 text-right">
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: meta.fill, color: meta.color }}>
                                  {ar ? meta.labelAr : meta.label}
                                </span>
                                <p className="text-xs text-slate-500 mt-1">{p.severityScore}/100 · {severityBand(p.severityScore)}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ── Wizard-only tally strip (Decision 2, Option A, enhanced) ── */}
            {totalWizard > 0 && (
              <div className="bg-gradient-to-br from-slate-50 to-white border-2 border-dashed border-slate-300 rounded-2xl shadow-sm p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="shrink-0 p-2 rounded-xl bg-slate-100">
                    <Info className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800 text-base">
                      {ar ? 'مشكلات بلا نقاط شدة (أداة التشخيص)' : 'Problems With No Severity Score (Diagnostic Wizard)'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
                      {ar
                        ? 'أداة التشخيص العامة لا تُنتج بيانات المشكلة الكاملة (DNA) التي تولّد نقاط الشدة أعلاه — فقط تقريرًا نصيًا مصنّفًا حسب مجال التركيز. لا نخترع قيمة شدة لهذه الصفوف؛ نعرضها كتجميع منفصل حسب المجال بدلًا من ذلك.'
                        : "The public Diagnostic wizard doesn't produce the Problem DNA that generates the severity scores above -- only a flat report tagged by focus area. Rather than invent a severity value for these, they're tallied separately by domain instead."}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
                  {wizardTally.map(row => (
                    <div key={row.focusArea} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5">
                      <p className="text-[11px] font-semibold text-slate-600 leading-tight">{ar ? (FOCUS_AREA_AR[row.focusArea] ?? row.focusArea) : row.focusArea}</p>
                      <p className="text-lg font-black text-slate-800 mt-0.5">{row.count}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-200">
                  <Link href="/my-assessments">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                      {ar ? 'عرض هذه التقارير' : 'View these reports'} <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  <Link href="/command-center">
                    <Button size="sm" className="gap-1.5 text-xs bg-[#082C6B] hover:bg-[#0e3d8a]">
                      <Sparkles className="w-3.5 h-3.5" />
                      {ar ? 'تشخيص كامل عبر محرك الاستشارات' : 'Get a full Consultancy Engine diagnosis'}
                    </Button>
                  </Link>
                  <span className="text-[11px] text-slate-400">
                    {ar ? 'يولّد تشخيصًا مع نقاط شدة حقيقية لكل مشكلة' : 'Produces a diagnosis with real per-problem severity scores'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
