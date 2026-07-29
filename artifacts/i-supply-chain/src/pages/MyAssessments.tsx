import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { API_BASE } from '@/lib/apiBase';
import { getLevel, MATURITY_LEVELS } from '@/lib/maturityScoring';
import { CORE_SEGMENTS, INDUSTRY_MODULES } from './maturityData';
import { EvidenceUploadZone, type EvidenceRecord } from '@/components/EvidenceUploadZone';
import { ConfidenceTierBadge, getSegmentTier } from '@/components/ConfidenceTierBadge';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, Cell, CartesianGrid,
} from 'recharts';
import {
  BarChart3, FileText, ClipboardList, ChevronDown, ChevronUp, Award, Loader2,
  CalendarDays, RotateCcw, TrendingUp, Building2, Users2, Sparkles,
  AlertCircle, Clock, ChevronRight, ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface SegScore {
  id:    string;
  title: string;
  score: number;
  level: string;
}

interface MaturityInputs  { intakeData?: { industry?: string; companySize?: string }; segmentCount?: number }
interface MaturityOutputs { overallScore?: string | number; overallLevel?: string; segmentScores?: SegScore[] }

interface DiagnosticInputs  { businessSize?: string; region?: string; industry?: string; focusArea?: string }
interface DiagnosticOutputs { executiveSummary?: string }

interface CommandCentreInputs  { industry?: string; revenueBand?: string }
interface CommandCentreOutputs { maturityScore?: string | number; maturityLevel?: string }

type AnyInputs  = MaturityInputs  | DiagnosticInputs  | CommandCentreInputs  | Record<string, unknown>;
type AnyOutputs = MaturityOutputs | DiagnosticOutputs | CommandCentreOutputs | Record<string, unknown>;

interface Submission {
  id:        number;
  tool:      string;
  inputs:    AnyInputs  | null;
  outputs:   AnyOutputs | null;
  createdAt: string;
}

/* ── Helpers ───────────────────────────────────────────────────────────────── */

/** All known segments (core + all industry modules) keyed by id */
const ALL_SEGMENTS = Object.fromEntries(
  [...CORE_SEGMENTS, ...INDUSTRY_MODULES].map(s => [s.id, s])
);

function formatDate(iso: string, lang: string) {
  return new Date(iso).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-GB', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function toolLabel(tool: string, ar: boolean) {
  const map: Record<string, { en: string; ar: string }> = {
    maturity:        { en: 'Maturity Assessment',       ar: 'تقييم النضج' },
    diagnostic:      { en: 'Supply Chain Diagnostic',   ar: 'التشخيص المنهجي' },
    command_centre:  { en: 'Command Centre Report',     ar: 'تقرير مركز القيادة' },
    report_generator:{ en: 'Report Generator',          ar: 'مولّد التقارير' },
    booking:         { en: 'Consultation Booking',      ar: 'حجز استشارة' },
    lead:            { en: 'Enquiry',                   ar: 'استفسار' },
  };
  return ar ? (map[tool]?.ar ?? tool) : (map[tool]?.en ?? tool);
}

function ToolIcon({ tool, className, style }: { tool: string; className?: string; style?: React.CSSProperties }) {
  if (tool === 'maturity')        return <BarChart3    className={className} style={style} />;
  if (tool === 'diagnostic')      return <ClipboardList className={className} style={style} />;
  if (tool === 'command_centre')  return <TrendingUp   className={className} style={style} />;
  return <FileText className={className} style={style} />;
}

function toolColor(tool: string) {
  if (tool === 'maturity')       return '#0B3D91';
  if (tool === 'diagnostic')     return '#C9A84C';
  if (tool === 'command_centre') return '#10b981';
  return '#64748b';
}

/* ── Maturity detail sub-component ─────────────────────────────────────────── */

function MaturityDetail({ inputs, outputs, ar, snapshotId, lang }: {
  inputs:     MaturityInputs;
  outputs:    MaturityOutputs;
  ar:         boolean;
  snapshotId: number;
  lang:       'en' | 'ar';
}) {
  const segs: SegScore[] = outputs.segmentScores ?? [];
  const score  = parseFloat(String(outputs.overallScore ?? 0));
  const level  = getLevel(score);

  /* ── Evidence state ──────────────────────────────────────────────────── */
  const [evidenceList,    setEvidenceList]    = useState<EvidenceRecord[]>([]);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [expandedEvSeg,   setExpandedEvSeg]   = useState<Set<string>>(new Set());

  const loadEvidence = () => {
    if (!snapshotId) return;
    setEvidenceLoading(true);
    fetch(`${API_BASE}/maturity/evidence?snapshot_id=${snapshotId}`, { credentials: 'include' })
      .then(r => r.json())
      .then((data: { ok: boolean; evidence?: EvidenceRecord[] }) => {
        if (data.ok && data.evidence) setEvidenceList(data.evidence);
      })
      .catch(() => {/* silent — evidence is optional */})
      .finally(() => setEvidenceLoading(false));
  };

  useEffect(() => { loadEvidence(); }, [snapshotId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Build radar data by matching stored segment IDs to CORE_SEGMENTS/modules */
  const asIsLabel  = ar ? 'نتيجتك (الوضع الراهن)' : 'Your Score (As-Is)';
  const gccLabel   = ar ? 'وسيط الخليج'           : 'GCC Median';
  const topLabel   = ar ? 'أفضل ربع (الهدف)'      : 'Top Quartile';

  const radarData = segs.map(s => {
    const def = ALL_SEGMENTS[s.id];
    return {
      segment:      ar ? (def?.shortTitleAr ?? s.title) : (def?.shortTitle ?? s.title),
      [asIsLabel]:  +s.score.toFixed(2),
      [gccLabel]:   def?.benchmarks?.gcc  ?? 2.3,
      [topLabel]:   def?.benchmarks?.best ?? 4.4,
    };
  });

  /* Bar chart — weakest first */
  const barData = [...segs]
    .sort((a, b) => a.score - b.score)
    .map(s => ({
      segment: ar ? (ALL_SEGMENTS[s.id]?.shortTitleAr ?? s.title) : (ALL_SEGMENTS[s.id]?.shortTitle ?? s.title),
      [asIsLabel]: +s.score.toFixed(2),
    }));

  const industry   = inputs.intakeData?.industry;
  const companySize = inputs.intakeData?.companySize;

  return (
    <div className="space-y-6 pt-2">
      {/* Hero score */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-extrabold text-primary">{score.toFixed(1)}</span>
          <span className="text-muted-foreground text-lg">/5.0</span>
        </div>
        <span className={`px-4 py-1.5 rounded-full text-sm font-bold border-2 ${level.bg} ${level.text} ${level.border}`}>
          {ar ? level.labelAr : level.label}
        </span>
        {(industry || companySize) && (
          <div className="flex gap-2 flex-wrap">
            {industry && (
              <span className="inline-flex items-center gap-1 bg-primary/8 rounded-full px-3 py-1 text-xs font-semibold text-primary">
                <Building2 className="w-3 h-3" /> {industry}
              </span>
            )}
            {companySize && (
              <span className="inline-flex items-center gap-1 bg-primary/8 rounded-full px-3 py-1 text-xs font-semibold text-primary">
                <Users2 className="w-3 h-3" /> {companySize}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Benchmark quick-stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: ar ? 'مقابل متوسط الخليج'   : 'vs GCC Avg',    val: score - 2.3, ref: 2.3 },
          { label: ar ? 'مقابل المتوسط العالمي' : 'vs Global Avg', val: score - 2.8, ref: 2.8 },
          { label: ar ? 'مقابل الأفضل في الفئة' : 'vs Best-in-Class', val: score - 4.4, ref: 4.4 },
        ].map(b => (
          <div key={b.label} className="rounded-xl border border-border bg-muted/40 p-3 text-center">
            <p className="text-[11px] text-muted-foreground leading-tight mb-1">{b.label}</p>
            <p className={`text-base font-extrabold ${b.val >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {b.val >= 0 ? '+' : ''}{b.val.toFixed(1)}
            </p>
          </div>
        ))}
      </div>

      {/* Radar chart */}
      {radarData.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-4">
          <h3 className="font-bold text-primary text-sm mb-3">
            {ar ? 'رادار النضج' : 'Maturity Radar'}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid stroke="#E5E7EB" />
              <PolarAngleAxis dataKey="segment" tick={{ fontSize: 10, fontWeight: 600, fill: '#1E3A5F' }} />
              <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 9, fill: '#94A3B8' }} tickCount={6} />
              <Radar name={topLabel}  dataKey={topLabel}  stroke="#10b981" fill="none"    strokeDasharray="3 2" strokeWidth={1.2} />
              <Radar name={gccLabel}  dataKey={gccLabel}  stroke="#082C6B" fill="none"    strokeDasharray="6 3" strokeWidth={1.5} />
              <Radar name={asIsLabel} dataKey={asIsLabel} stroke="#C9A84C" fill="#C9A84C" fillOpacity={0.4}    strokeWidth={2}   />
              <Legend iconSize={9} iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
              <Tooltip formatter={(v: number) => v.toFixed(2)} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Gap bar chart */}
      {barData.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-4">
          <h3 className="font-bold text-primary text-sm mb-3">
            {ar ? 'تحليل الفجوة — الأضعف أولاً' : 'Gap Analysis — Weakest First'}
          </h3>
          <ResponsiveContainer width="100%" height={Math.max(240, segs.length * 38 + 40)}>
            <BarChart
              layout="vertical"
              data={barData}
              margin={{ top: 4, right: 50, left: 8, bottom: 4 }}
              barCategoryGap="30%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" domain={[0, 5]} tickCount={6} tick={{ fontSize: 10, fill: '#94A3B8' }} />
              <YAxis dataKey="segment" type="category" width={90} tick={{ fontSize: 10, fontWeight: 600, fill: '#1E3A5F' }} />
              <Tooltip formatter={(v: number) => v.toFixed(2)} />
              <Bar dataKey={asIsLabel} radius={[0, 3, 3, 0]} barSize={14}
                label={{ position: 'right', fontSize: 10, fill: '#475569',
                  formatter: (v: number) => v > 0 ? v.toFixed(1) : '' }}>
                {barData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={getLevel(entry[asIsLabel] as number).color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Segment score table + per-segment evidence accordions */}
      {segs.length > 0 && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted text-left">
                <th className="px-4 py-2.5 font-bold text-primary text-xs">{ar ? 'المجال' : 'Segment'}</th>
                <th className="px-4 py-2.5 font-bold text-primary text-xs text-center">{ar ? 'النتيجة' : 'Score'}</th>
                <th className="px-4 py-2.5 font-bold text-primary text-xs text-center">{ar ? 'المستوى' : 'Level'}</th>
                <th className="px-4 py-2.5 font-bold text-primary text-xs text-center">{ar ? 'الثقة' : 'Evidence'}</th>
              </tr>
            </thead>
            <tbody>
              {segs.map((s, i) => {
                const lvl        = getLevel(s.score);
                const def        = ALL_SEGMENTS[s.id];
                const segEv      = evidenceList.filter(e => e.segId === s.id);
                const qualSubs   = (def?.subSegments ?? []).filter((ss: { evidence?: unknown }) => ss.evidence);
                const isEvOpen   = expandedEvSeg.has(s.id);
                const toggleEv   = () => setExpandedEvSeg(prev => {
                  const next = new Set(prev);
                  if (next.has(s.id)) next.delete(s.id); else next.add(s.id);
                  return next;
                });
                return (
                  <React.Fragment key={i}>
                    <tr className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          {def && (
                            <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                              style={{ backgroundColor: def.color + '20' }}>
                              <def.icon className="w-3.5 h-3.5" style={{ color: def.color }} />
                            </div>
                          )}
                          <span className="font-medium text-foreground text-xs">
                            {ar ? (def?.shortTitleAr ?? s.title) : (def?.shortTitle ?? s.title)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="font-extrabold text-primary text-sm">{s.score.toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${lvl.bg} ${lvl.text} border ${lvl.border}`}>
                          {ar ? lvl.labelAr : lvl.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {evidenceLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground mx-auto" />
                        ) : qualSubs.length > 0 ? (
                          <button
                            onClick={toggleEv}
                            className="inline-flex items-center gap-1 group"
                            title={ar ? 'إدارة الأدلة' : 'Manage evidence'}
                          >
                            {segEv.length > 0 ? (
                              <ConfidenceTierBadge lang={lang} evidence={segEv} asPill />
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border bg-muted/50 text-muted-foreground border-border hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-colors">
                                <ShieldCheck className="w-3 h-3" />
                                {ar ? 'أضف دليلاً' : 'Add'}
                              </span>
                            )}
                            <span className="text-muted-foreground text-[10px]">{isEvOpen ? '▲' : '▼'}</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/50">—</span>
                        )}
                      </td>
                    </tr>

                    {/* Evidence accordion row */}
                    {isEvOpen && qualSubs.length > 0 && (
                      <tr className="border-t border-border bg-muted/20">
                        <td colSpan={4} className="px-4 py-3">
                          <div className="space-y-3">
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                              {ar ? 'أدلة داعمة' : 'Supporting Evidence'}
                              {' — '}
                              {ar ? (def?.shortTitleAr ?? s.title) : (def?.shortTitle ?? s.title)}
                            </p>
                            {(qualSubs as Array<{
                              id: string; title: string; titleAr: string;
                              evidence: { hint: string; hintAr: string };
                            }>).map(ss => (
                              <EvidenceUploadZone
                                key={ss.id}
                                lang={lang}
                                snapshotId={snapshotId}
                                segId={s.id}
                                subSegId={ss.id}
                                subSegLabel={ss.title}
                                subSegLabelAr={ss.titleAr}
                                subSegHint={ss.evidence.hint}
                                subSegHintAr={ss.evidence.hintAr}
                                existing={evidenceList.find(e => e.subSegId === ss.id) ?? null}
                                onChanged={loadEvidence}
                              />
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* CTA */}
      <div className="flex flex-wrap gap-3">
        <Link href="/maturity">
          <Button size="sm" className="bg-primary hover:bg-primary/90 text-white gap-2">
            <RotateCcw className="w-3.5 h-3.5" />
            {ar ? 'أعد التقييم' : 'Retake Assessment'}
          </Button>
        </Link>
      </div>
    </div>
  );
}

/* ── Diagnostic detail sub-component ───────────────────────────────────────── */

function DiagnosticDetail({ inputs, outputs, ar }: {
  inputs:  DiagnosticInputs;
  outputs: DiagnosticOutputs;
  ar:      boolean;
}) {
  return (
    <div className="space-y-4 pt-2">
      {(inputs.industry || inputs.businessSize || inputs.region || inputs.focusArea) && (
        <div className="flex flex-wrap gap-2">
          {[inputs.industry, inputs.businessSize, inputs.region, inputs.focusArea]
            .filter(Boolean)
            .map((v, i) => (
              <span key={i} className="bg-primary/8 text-primary text-xs font-semibold px-3 py-1 rounded-full">
                {v}
              </span>
            ))}
        </div>
      )}
      {outputs.executiveSummary && (
        <div className="bg-muted/40 rounded-xl border border-border p-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
            {ar ? 'الملخص التنفيذي' : 'Executive Summary'}
          </p>
          <p className="text-sm text-foreground leading-relaxed line-clamp-4">
            {outputs.executiveSummary}
          </p>
        </div>
      )}
      <Link href="/diagnostic">
        <Button size="sm" variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/5">
          <RotateCcw className="w-3.5 h-3.5" />
          {ar ? 'أعد التشخيص' : 'Retake Diagnostic'}
        </Button>
      </Link>
    </div>
  );
}

/* ── Command Centre detail sub-component ───────────────────────────────────── */

function CommandCentreDetail({ inputs, outputs, ar }: {
  inputs:  CommandCentreInputs;
  outputs: CommandCentreOutputs;
  ar:      boolean;
}) {
  const score  = outputs.maturityScore ? parseFloat(String(outputs.maturityScore)) : null;
  const lvlStr = outputs.maturityLevel;
  const lvl    = score !== null ? getLevel(score) : null;

  return (
    <div className="space-y-4 pt-2">
      {(inputs.industry || inputs.revenueBand) && (
        <div className="flex flex-wrap gap-2">
          {[inputs.industry, inputs.revenueBand].filter(Boolean).map((v, i) => (
            <span key={i} className="bg-accent/10 text-accent text-xs font-semibold px-3 py-1 rounded-full">
              {v}
            </span>
          ))}
        </div>
      )}
      {score !== null && lvl && (
        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-primary">{score.toFixed(1)}</span>
            <span className="text-muted-foreground">/5.0</span>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-bold border-2 ${lvl.bg} ${lvl.text} ${lvl.border}`}>
            {ar ? lvl.labelAr : (lvlStr ?? lvl.label)}
          </span>
        </div>
      )}
      <Link href="/command-center">
        <Button size="sm" variant="outline" className="gap-2 border-accent/40 text-accent hover:bg-accent/5">
          <RotateCcw className="w-3.5 h-3.5" />
          {ar ? 'مركز القيادة' : 'Command Centre'}
        </Button>
      </Link>
    </div>
  );
}

/* ── Submission card ────────────────────────────────────────────────────────── */

function SubmissionCard({ sub, ar, defaultOpen }: { sub: Submission; ar: boolean; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const color  = toolColor(sub.tool);
  const inputs  = (sub.inputs  ?? {}) as AnyInputs;
  const outputs = (sub.outputs ?? {}) as AnyOutputs;

  /* Headline summary shown even when collapsed */
  const headline = (() => {
    if (sub.tool === 'maturity') {
      const o = outputs as MaturityOutputs;
      const s = parseFloat(String(o.overallScore ?? 0));
      if (s > 0) return ar
        ? `${s.toFixed(1)} / 5.0 — ${getLevel(s).labelAr}`
        : `${s.toFixed(1)} / 5.0 — ${getLevel(s).label}`;
    }
    if (sub.tool === 'command_centre') {
      const o = outputs as CommandCentreOutputs;
      if (o.maturityLevel) return ar ? o.maturityLevel : o.maturityLevel;
    }
    if (sub.tool === 'diagnostic') {
      const i = inputs as DiagnosticInputs;
      return [i.industry, i.businessSize].filter(Boolean).join(' · ') || null;
    }
    return null;
  })();

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      <button
        className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-muted/30 transition-colors"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
      >
        {/* Tool icon */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: color + '15' }}>
          <ToolIcon tool={sub.tool} className="w-5 h-5" style={{ color } as React.CSSProperties} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-primary text-sm leading-tight">{toolLabel(sub.tool, ar)}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {formatDate(sub.createdAt, ar ? 'ar' : 'en')}
            </span>
            {headline && (
              <span className="text-xs font-semibold text-foreground/80">{headline}</span>
            )}
          </div>
        </div>

        {/* Chevron */}
        <div className="shrink-0 mt-1">
          {open
            ? <ChevronUp   className="w-4 h-4 text-muted-foreground" />
            : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-6 border-t border-border pt-4">
              {sub.tool === 'maturity' && (
                <MaturityDetail
                  inputs={inputs as MaturityInputs}
                  outputs={outputs as MaturityOutputs}
                  ar={ar}
                  snapshotId={sub.id}
                  lang={ar ? 'ar' : 'en'}
                />
              )}
              {sub.tool === 'diagnostic' && (
                <DiagnosticDetail
                  inputs={inputs as DiagnosticInputs}
                  outputs={outputs as DiagnosticOutputs}
                  ar={ar}
                />
              )}
              {(sub.tool === 'command_centre' || sub.tool === 'report_generator') && (
                <CommandCentreDetail
                  inputs={inputs as CommandCentreInputs}
                  outputs={outputs as CommandCentreOutputs}
                  ar={ar}
                />
              )}
              {(sub.tool === 'booking' || sub.tool === 'lead') && (
                <p className="text-sm text-muted-foreground pt-2">
                  {ar ? 'تم تسجيل طلبك بنجاح.' : 'Your request was recorded successfully.'}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */

const TOOL_ORDER = ['maturity', 'command_centre', 'diagnostic', 'report_generator', 'booking', 'lead'];

export function MyAssessments() {
  const { user, isAuthenticated, loading } = useAuth();
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const [, navigate] = useLocation();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [fetching,    setFetching]    = useState(true);
  const [fetchError,  setFetchError]  = useState<string | null>(null);

  /* Auth guard */
  useEffect(() => {
    if (!loading && !isAuthenticated) navigate('/login');
  }, [loading, isAuthenticated, navigate]);

  /* Fetch submissions */
  useEffect(() => {
    if (!isAuthenticated) return;
    setFetching(true);
    setFetchError(null);
    fetch(`${API_BASE}/submissions/mine`, { credentials: 'include' })
      .then(r => r.json())
      .then((data: { ok: boolean; submissions?: Submission[]; error?: string }) => {
        if (data.ok && data.submissions) {
          setSubmissions(data.submissions);
        } else {
          setFetchError(data.error ?? 'Failed to load assessments');
        }
      })
      .catch(() => setFetchError('Network error'))
      .finally(() => setFetching(false));
  }, [isAuthenticated]);

  /* Group submissions by tool for the summary badges */
  const toolCounts = submissions.reduce<Record<string, number>>((acc, s) => {
    acc[s.tool] = (acc[s.tool] ?? 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* ── Hero banner ── */}
      <div className="bg-[#082C6B] text-white">
        <div className="container mx-auto px-4 py-10 max-w-5xl">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-4">
            <Award className="w-4 h-4 text-accent" />
            <span className="text-accent font-bold text-xs uppercase tracking-widest">
              {ar ? 'سجلّي' : 'My History'}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold mb-2">
            {ar ? 'تقييماتي ونتائجي' : 'My Assessments & Results'}
          </h1>
          <p className="text-white/70 text-sm md:text-base">
            {ar
              ? 'جميع تقييماتك ونتائجك المحفوظة في مكان واحد — راجع تقدمك وقارن نتائجك عبر الزمن.'
              : 'All your saved assessments and results in one place — review your progress and compare results over time.'}
          </p>

          {/* Summary chips */}
          {!fetching && submissions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5">
              {TOOL_ORDER.filter(t => toolCounts[t]).map(t => (
                <span key={t}
                  className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5 text-xs font-semibold text-white/90">
                  <ToolIcon tool={t} className="w-3.5 h-3.5" />
                  {toolLabel(t, ar)}
                  <span className="ml-0.5 bg-white/20 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-extrabold">
                    {toolCounts[t]}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="container mx-auto px-4 py-10 max-w-4xl">

        {/* Loading */}
        {fetching && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">
              {ar ? 'جاري تحميل سجلّك…' : 'Loading your history…'}
            </p>
          </div>
        )}

        {/* Error */}
        {!fetching && fetchError && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">{ar ? 'تعذّر تحميل السجلّ' : 'Could not load history'}</p>
              <p className="text-sm mt-0.5">{fetchError}</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!fetching && !fetchError && submissions.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-primary/40" />
            </div>
            <h2 className="text-xl font-bold text-primary mb-2">
              {ar ? 'لا توجد تقييمات بعد' : 'No assessments yet'}
            </h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
              {ar
                ? 'أكمل أحد تقييماتنا وستظهر نتائجك هنا تلقائياً.'
                : 'Complete one of our tools and your results will appear here automatically.'}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/maturity">
                <Button className="bg-primary hover:bg-primary/90 text-white gap-2">
                  <BarChart3 className="w-4 h-4" />
                  {ar ? 'ابدأ تقييم النضج' : 'Start Maturity Assessment'}
                </Button>
              </Link>
              <Link href="/diagnostic">
                <Button variant="outline" className="border-accent text-accent hover:bg-accent/5 gap-2">
                  <ClipboardList className="w-4 h-4" />
                  {ar ? 'التشخيص المنهجي' : 'Supply Chain Diagnostic'}
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Submissions list — newest first */}
        {!fetching && !fetchError && submissions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">
                {ar
                  ? `${submissions.length} سجلّ محفوظ`
                  : `${submissions.length} saved record${submissions.length !== 1 ? 's' : ''}`}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="w-3.5 h-3.5" />
                {ar ? 'الأحدث أولاً' : 'Newest first'}
              </div>
            </div>
            {submissions.map((sub, i) => (
              <SubmissionCard key={sub.id} sub={sub} ar={ar} defaultOpen={i === 0} />
            ))}
          </div>
        )}

        {/* Navigation footer */}
        {!fetching && (
          <div className="mt-10 pt-6 border-t border-border flex flex-wrap gap-3">
            <Link href="/account">
              <Button variant="outline" size="sm" className="gap-2 text-muted-foreground">
                {ar ? <ChevronRight className="w-3.5 h-3.5" /> : null}
                {ar ? 'إعدادات الحساب' : 'Account Settings'}
                {!ar ? <ChevronRight className="w-3.5 h-3.5" /> : null}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
