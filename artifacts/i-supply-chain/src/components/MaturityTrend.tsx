/**
 * MaturityTrend — Re-assessment trend tracking component
 *
 * Renders three sections when ≥2 snapshots exist:
 *   A. Delta Summary Panel   — per-segment score change cards, sorted improved-first
 *   B. Remedy Correlation    — maps prior roadmap actions to measurable segment movement
 *   C. Trajectory Chart      — time-series line chart of all segment + overall scores
 *
 * When only 1 snapshot exists: shows the retake prompt (bilingual).
 * When 0 snapshots: renders nothing.
 *
 * All strings ship in both English and Arabic simultaneously.
 * Arabic uses formal Gulf professional register; RTL is applied to all new sections.
 */
import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, RotateCcw, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Button }    from '@/components/ui/button';
import { MATURITY_LEVELS } from '@/lib/maturityScoring';

/* ── Types ──────────────────────────────────────────────────────────────── */

export interface SegScoreItem {
  id:      string;
  title:   string;
  titleAr?: string;
  score:   number;
  level:   string;
}

interface RemedyItem {
  segmentTitle:      string;
  subQuestion?:      string;
  specificGap?:      string;
  action:            string;
  framework?:        string;
  measurableTarget?: string;
  effort?:           string;
}

interface RemediesData {
  executiveSummary?: string;
  days30: RemedyItem[];
  days60: RemedyItem[];
  days90: RemedyItem[];
  estimatedImpact?: string;
}

export interface SnapshotRecord {
  id:            number;
  takenAt:       string;          // ISO timestamp string
  industry:      string | null;
  companySize:   string | null;
  segmentScores: SegScoreItem[];
  overallScore:  string | number; // numeric from DB arrives as string
  coveragePct:   string | number;
  remedyActions: RemediesData | null;
}

export interface SegmentMeta {
  id:           string;
  color:        string;
  shortTitle:   string;
  shortTitleAr: string;
}

interface MaturityTrendProps {
  snapshots:   SnapshotRecord[];
  segmentList: SegmentMeta[];
  ar:          boolean;
  onRetake:    () => void;
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function numericScore(v: string | number): number {
  return typeof v === 'string' ? parseFloat(v) : v;
}

function formatSnapshotDate(isoDate: string, ar: boolean): string {
  const date = new Date(isoDate);
  if (ar) {
    return date.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' });
  }
  return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

/** Level display helpers (shared with parent via MATURITY_LEVELS) */
function levelForScore(score: number) {
  return MATURITY_LEVELS.find(l => score >= l.min && score <= l.max) ?? MATURITY_LEVELS[0];
}

const FLAT_THRESHOLD = 0.05;

function deltaCategory(delta: number): 'improved' | 'flat' | 'declined' {
  if (delta >= FLAT_THRESHOLD) return 'improved';
  if (delta <= -FLAT_THRESHOLD) return 'declined';
  return 'flat';
}

/* ── Correlation helpers ─────────────────────────────────────────────────── */

type CorrelationKey = 'moved' | 'partial' | 'no_change' | 'declined';

function correlationForDelta(delta: number | null): CorrelationKey {
  if (delta === null) return 'no_change';
  if (delta >= 0.3)   return 'moved';
  if (delta >= 0.05)  return 'partial';
  if (delta >= -0.05) return 'no_change';
  return 'declined';
}

const CORRELATION_CONFIG: Record<CorrelationKey, {
  icon: string; enLabel: string; arLabel: string;
  textClass: string; borderClass: string; bgClass: string;
}> = {
  moved:     { icon: '✓', enLabel: 'Moved',         arLabel: 'تحرّك',       textClass: 'text-green-700',  borderClass: 'border-green-200', bgClass: 'bg-green-50'  },
  partial:   { icon: '~', enLabel: 'Partial',        arLabel: 'جزئي',        textClass: 'text-blue-700',   borderClass: 'border-blue-200',  bgClass: 'bg-blue-50'   },
  no_change: { icon: '→', enLabel: 'No change yet',  arLabel: 'لا تغيير بعد', textClass: 'text-slate-600',  borderClass: 'border-slate-200', bgClass: 'bg-slate-50'  },
  declined:  { icon: '↓', enLabel: 'Declined',       arLabel: 'تراجع',       textClass: 'text-red-700',    borderClass: 'border-red-200',   bgClass: 'bg-red-50'    },
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */

export function MaturityTrend({ snapshots, segmentList, ar, onRetake }: MaturityTrendProps) {
  if (snapshots.length === 0) return null;

  /* ── Single snapshot: retake prompt ─────────────────────────────────── */
  if (snapshots.length === 1) {
    return (
      <div
        data-testid="maturity-retake-prompt"
        className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-white p-6"
        dir={ar ? 'rtl' : 'ltr'}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-primary text-base mb-1">
              {ar ? 'تتبّع تقدّمكم بمرور الوقت' : 'Track Your Progress Over Time'}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              {ar
                ? 'عُد بعد 3 إلى 6 أشهر من تطبيق خطة العمل — سيُظهر تقييمك القادم بالضبط ما الذي تغيّر وبأي مقدار.'
                : 'Come back in 3–6 months after working through your roadmap — your next assessment will show exactly what moved and by how much.'}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={onRetake}
              data-testid="button-retake-assessment"
              className="gap-2 border-primary/30 text-primary hover:bg-primary/5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {ar ? 'إعادة التقييم' : 'Retake Assessment'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ── ≥2 snapshots: compute deltas ───────────────────────────────────── */
  const prev = snapshots[snapshots.length - 2];
  const curr = snapshots[snapshots.length - 1];

  const prevOverall = numericScore(prev.overallScore);
  const currOverall = numericScore(curr.overallScore);
  const overallDelta = currOverall - prevOverall;
  const prevLevel   = levelForScore(prevOverall);
  const currLevel   = levelForScore(currOverall);

  const prevScoreMap = new Map<string, number>(
    prev.segmentScores.map(s => [s.id, s.score]),
  );

  const deltasRaw = curr.segmentScores.map(cs => {
    const prevScore = prevScoreMap.get(cs.id) ?? null;
    const delta     = prevScore !== null ? cs.score - prevScore : null;
    return { ...cs, prevScore, delta };
  });

  // Sort: improved first → flat → declined; within each group, largest delta first
  const deltas = [...deltasRaw].sort((a, b) => {
    const ca = deltaCategory(a.delta ?? 0);
    const cb = deltaCategory(b.delta ?? 0);
    const order = { improved: 0, flat: 1, declined: 2 } as const;
    if (order[ca] !== order[cb]) return order[ca] - order[cb];
    return (b.delta ?? 0) - (a.delta ?? 0);
  });

  // Map by title (EN + AR, lower-cased) for remedy correlation lookup
  const deltaByTitle = new Map<string, number>();
  deltasRaw.forEach(d => {
    deltaByTitle.set(d.title.toLowerCase(), d.delta ?? 0);
    if (d.titleAr) deltaByTitle.set(d.titleAr, d.delta ?? 0);
  });

  /* ── Trajectory chart data ─────────────────────────────────────────── */
  const trajectoryData = useMemo(() =>
    snapshots.map(snap => {
      const row: Record<string, string | number | null> = {
        date:     formatSnapshotDate(snap.takenAt, ar),
        overall:  numericScore(snap.overallScore),
      };
      snap.segmentScores.forEach(seg => { row[seg.id] = seg.score; });
      return row;
    }),
    [snapshots, ar], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const segColorMap = new Map(segmentList.map(s => [s.id, s.color]));
  const allSegIds   = Array.from(
    new Set(snapshots.flatMap(s => s.segmentScores.map(ss => ss.id))),
  );

  // Build tooltip label from snapshots by date string
  const snapByDate = new Map(snapshots.map(s => [formatSnapshotDate(s.takenAt, ar), s]));

  /* ── Remedy correlation panel data ─────────────────────────────────── */
  const prevRemedies = prev.remedyActions;
  const correlatedActions = useMemo(() => {
    if (!prevRemedies) return [];
    const all: RemedyItem[] = [
      ...(prevRemedies.days30 ?? []),
      ...(prevRemedies.days60 ?? []),
      ...(prevRemedies.days90 ?? []),
    ];
    return all.map(item => {
      const segDelta = deltaByTitle.get(item.segmentTitle.toLowerCase()) ?? null;
      return { ...item, segDelta, correlationKey: correlationForDelta(segDelta) as CorrelationKey };
    });
  }, [prevRemedies]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-8" dir={ar ? 'rtl' : 'ltr'} data-testid="maturity-trend-panel">

      {/* ═══════════════════════════════════════════════════════════════
          SECTION A — Delta Summary Panel
      ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* Overall delta header */}
        <div className="bg-[#082C6B] px-6 py-5" data-testid="trend-overall-delta">
          <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-2">
            {ar ? 'التغيّر الإجمالي — آخر تقييمَين' : 'Overall Delta — Last Two Assessments'}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-3xl font-extrabold text-white">
              {prevOverall.toFixed(1)} → {currOverall.toFixed(1)}
            </span>
            <DeltaBadge delta={overallDelta} ar={ar} size="lg" />
            <span className="text-white/70 text-sm">
              {ar
                ? `${prevLevel.labelAr} → ${currLevel.labelAr}`
                : `${prevLevel.label} → ${currLevel.label}`}
            </span>
          </div>
          {/* Snapshot dates */}
          <div className="mt-2 flex items-center gap-2 text-white/50 text-xs">
            <span>{formatSnapshotDate(prev.takenAt, ar)}</span>
            <span>→</span>
            <span>{formatSnapshotDate(curr.takenAt, ar)}</span>
          </div>
        </div>

        {/* Per-segment delta cards */}
        <div className="p-6">
          <p className="text-sm text-muted-foreground mb-4">
            {ar
              ? 'مُرتَّبة: المتحسّن أولاً، ثم الثابت، ثم المتراجع.'
              : 'Sorted: improved first, then flat, then declined.'}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {deltas.map(d => {
              const level    = levelForScore(d.score);
              const segMeta  = segmentList.find(s => s.id === d.id);
              const topQ     = 4.4; // shared Top Quartile benchmark
              const pctToTop = Math.min(100, (d.score / topQ) * 100);

              return (
                <div
                  key={d.id}
                  data-testid={`delta-card-${d.id}`}
                  className={`rounded-xl border p-4 ${level.border} ${level.bg}`}
                >
                  {/* Segment name */}
                  <div className="flex items-center gap-2 mb-2">
                    {segMeta && (
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: segMeta.color }}
                      />
                    )}
                    <p className="font-bold text-sm text-foreground leading-tight">
                      {ar ? (d.titleAr ?? d.title) : d.title}
                    </p>
                  </div>

                  {/* Previous → current score + delta badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-muted-foreground text-sm font-medium">
                      {d.prevScore !== null ? d.prevScore.toFixed(1) : '–'}
                    </span>
                    <span className="text-muted-foreground text-xs">→</span>
                    <span className={`text-lg font-extrabold ${level.text}`}>{d.score.toFixed(1)}</span>
                    {d.delta !== null && <DeltaBadge delta={d.delta} ar={ar} size="sm" />}
                  </div>

                  {/* Level label */}
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${level.bg} ${level.text} ${level.border}`}>
                    {ar ? level.labelAr : level.label}
                  </span>

                  {/* Progress bar vs Top Quartile */}
                  <div className="mt-3">
                    <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pctToTop}%`, backgroundColor: level.color }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {pctToTop.toFixed(0)}% {ar ? 'من أفضل ربع' : 'of Top Quartile'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Retake button */}
        <div className="px-6 pb-5 flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={onRetake}
            data-testid="button-retake-assessment"
            className="gap-2 border-primary/30 text-primary hover:bg-primary/5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {ar ? 'إعادة التقييم' : 'Retake Assessment'}
          </Button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION B — Remedy Correlation Panel
      ═══════════════════════════════════════════════════════════════ */}
      {prevRemedies && correlatedActions.length > 0 && (
        <div
          className="bg-white rounded-2xl border border-border shadow-sm p-6"
          data-testid="remedy-correlation-panel"
        >
          <h3 className="text-xl font-bold text-primary mb-1">
            {ar ? 'هل أسفرت إجراءات خطتك عن نتائج ملموسة؟' : 'Did your roadmap actions make a difference?'}
          </h3>
          <p className="text-muted-foreground text-sm mb-1">
            {ar
              ? 'ارتباط، لا سببية — عوامل أخرى تؤثر في درجات النضج.'
              : 'Correlation, not causation — other factors affect maturity scores.'}
          </p>
          <p className="text-xs text-muted-foreground mb-5">
            {ar
              ? `الإجراءات من تقييم ${formatSnapshotDate(prev.takenAt, ar)}`
              : `Actions from ${formatSnapshotDate(prev.takenAt, ar)} assessment`}
          </p>

          <div className="space-y-2">
            {correlatedActions.map((item, idx) => {
              const cfg = CORRELATION_CONFIG[item.correlationKey];
              return (
                <div
                  key={idx}
                  data-testid={`correlation-row-${idx}`}
                  className={`rounded-xl border p-4 flex items-start gap-3 ${cfg.borderClass} ${cfg.bgClass}`}
                >
                  {/* Correlation indicator */}
                  <span
                    className={`w-7 h-7 rounded-full border flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 bg-white ${cfg.borderClass} ${cfg.textClass}`}
                  >
                    {cfg.icon}
                  </span>

                  <div className="flex-1 min-w-0">
                    {/* Correlation label + segment + delta */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs font-bold ${cfg.textClass}`}>
                        {ar ? cfg.arLabel : cfg.enLabel}
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground font-medium">
                        {item.segmentTitle}
                      </span>
                      {item.segDelta !== null && (
                        <DeltaBadge delta={item.segDelta} ar={ar} size="xs" />
                      )}
                    </div>

                    {/* Action text */}
                    <p className="text-sm text-foreground leading-snug">{item.action}</p>

                    {item.measurableTarget && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {ar ? 'الهدف: ' : 'Target: '}{item.measurableTarget}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          SECTION C — Trajectory Chart
      ═══════════════════════════════════════════════════════════════ */}
      {snapshots.length >= 2 && (
        <div
          className="bg-white rounded-2xl border border-border shadow-sm p-6"
          data-testid="trajectory-chart"
        >
          <h3 className="text-xl font-bold text-primary mb-1">
            {ar ? 'مسار النضج بمرور الوقت' : 'Maturity Trajectory Over Time'}
          </h3>
          <p className="text-muted-foreground text-sm mb-5">
            {ar
              ? 'مسار درجات جميع المجالات عبر تقييماتكم — الخط الذهبي هو الدرجة الإجمالية.'
              : 'Score trajectory across all segments — the gold line is your overall score.'}
          </p>

          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={trajectoryData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#64748B' }}
                reversed={ar}
              />
              <YAxis
                domain={[0, 5]}
                tickCount={6}
                tick={{ fontSize: 10, fill: '#94A3B8' }}
                orientation={ar ? 'right' : 'left'}
              />
              <Tooltip
                formatter={(value: number, name: string, props: any) => {
                  // Compute delta vs previous data point for this segment
                  const pointIndex = trajectoryData.findIndex(
                    d => d.date === props.payload?.date,
                  );
                  let deltaStr = '';
                  if (pointIndex > 0) {
                    const prevVal = trajectoryData[pointIndex - 1][name];
                    if (prevVal !== undefined && prevVal !== null) {
                      const d = value - (prevVal as number);
                      const snap = snapByDate.get(trajectoryData[pointIndex - 1].date as string);
                      const prevDate = snap ? formatSnapshotDate(snap.takenAt, ar) : '';
                      const sign = d >= 0 ? '+' : '';
                      if (ar) {
                        deltaStr = `\n(${sign}${d.toFixed(2)} منذ ${prevDate})`;
                      } else {
                        deltaStr = ` (${sign}${d.toFixed(2)} since ${prevDate})`;
                      }
                    }
                  }
                  return [`${value.toFixed(2)}${deltaStr}`, name];
                }}
                contentStyle={{ fontSize: 12 }}
              />
              <Legend
                iconSize={10}
                iconType="circle"
                wrapperStyle={{ fontSize: 11, fontWeight: 600 }}
              />

              {/* Per-segment lines */}
              {allSegIds.map(segId => {
                const meta  = segmentList.find(s => s.id === segId);
                const color = segColorMap.get(segId) ?? '#94A3B8';
                const label = ar
                  ? (meta?.shortTitleAr ?? segId)
                  : (meta?.shortTitle   ?? segId);
                return (
                  <Line
                    key={segId}
                    type="monotone"
                    dataKey={segId}
                    name={label}
                    stroke={color}
                    strokeWidth={1.4}
                    dot={{ r: 3, fill: color }}
                    activeDot={{ r: 5 }}
                    connectNulls={false}
                  />
                );
              })}

              {/* Overall score — gold, slightly thicker */}
              <Line
                type="monotone"
                dataKey="overall"
                name={ar ? 'الإجمالي' : 'Overall'}
                stroke="#C9A84C"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#C9A84C' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/* ── DeltaBadge ──────────────────────────────────────────────────────────── */

interface DeltaBadgeProps {
  delta: number;
  ar:    boolean;
  size:  'xs' | 'sm' | 'lg';
}

function DeltaBadge({ delta, ar, size }: DeltaBadgeProps) {
  const cat = deltaCategory(delta);

  const textSizeClass =
    size === 'lg' ? 'text-sm px-3 py-1'
    : size === 'sm' ? 'text-xs px-2 py-0.5'
    : 'text-[10px] px-1.5 py-0.5';

  if (cat === 'improved') {
    return (
      <span
        data-testid="delta-badge-improved"
        className={`inline-flex items-center gap-0.5 rounded-full font-bold bg-green-100 text-green-700 border border-green-200 ${textSizeClass}`}
      >
        <ArrowUp className="w-3 h-3 shrink-0" />
        {delta > 0 ? '+' : ''}{delta.toFixed(2)}
        {size === 'lg' && <span className="ml-1">{ar ? '↑ تحسّن' : '↑ Improved'}</span>}
      </span>
    );
  }
  if (cat === 'declined') {
    return (
      <span
        data-testid="delta-badge-declined"
        className={`inline-flex items-center gap-0.5 rounded-full font-bold bg-red-100 text-red-700 border border-red-200 ${textSizeClass}`}
      >
        <ArrowDown className="w-3 h-3 shrink-0" />
        {delta.toFixed(2)}
        {size === 'lg' && <span className="ml-1">{ar ? '↓ تراجع' : '↓ Declined'}</span>}
      </span>
    );
  }
  // flat
  return (
    <span
      data-testid="delta-badge-flat"
      className={`inline-flex items-center gap-0.5 rounded-full font-bold bg-slate-100 text-slate-600 border border-slate-200 ${textSizeClass}`}
    >
      <Minus className="w-3 h-3 shrink-0" />
      {delta.toFixed(2)}
      {size === 'lg' && <span className="ml-1">{ar ? '— ثابت' : '— No change'}</span>}
    </span>
  );
}
