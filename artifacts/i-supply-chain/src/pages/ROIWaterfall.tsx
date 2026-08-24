/**
 * ROI Waterfall / Value Realization (#173, 23 Aug 2026)
 *
 * Self-reported value-realization summary built entirely from data the
 * user already generated: their own Maturity Assessment score history and
 * their own tracked action completions (see roiSummary.ts backend route
 * for the full honesty rationale). No dollar figure is invented -- ISC has
 * no access to a client's financial ledger, so this page never claims a
 * SAR amount. It shows real score movement and real action completion,
 * clearly labeled as self-reported.
 *
 * #160 (Value Funnel Labeling) is built directly into this page: the
 * funnel below breaks the single "actions completed" count into the
 * stages that are honestly derivable from this platform's actual action-
 * tracking data (Identified / In Progress / Completed / Sustained) rather
 * than presenting one lump number. See roiSummary.ts for why the original
 * 5-stage concept (which included "Approved"/"Contracted") was narrowed to
 * four stages -- this platform has no data source for those two.
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { API_BASE } from '@/lib/apiBase';
import { Button } from '@/components/ui/button';
import {
  Loader2, TrendingUp, TrendingDown, Minus, ArrowRight, Waves,
  Lightbulb, Clock3, CheckCircle2, ShieldCheck,
} from 'lucide-react';

interface FunnelCounts {
  identified: number;
  inProgress: number;
  completed: number;
  sustained: number;
}

interface SegmentMovement {
  title: string;
  scoreFirst: number | null;
  scoreLatest: number | null;
  delta: number | null;
}

interface RoiSummary {
  ok: boolean;
  hasData: boolean;
  funnel: FunnelCounts;
  segments: SegmentMovement[];
  firstSnapshotAt: string | null;
  latestSnapshotAt: string | null;
  snapshotCount: number;
}

function formatDate(iso: string, ar: boolean) {
  return new Date(iso).toLocaleDateString(ar ? 'ar-SA' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
}

const STAGES: { key: keyof FunnelCounts; en: string; ar: string; icon: React.ReactNode; color: string; descEn: string; descAr: string }[] = [
  { key: 'identified', en: 'Identified', ar: 'مُحدَّد', icon: <Lightbulb className="w-4 h-4" />, color: '#94a3b8',
    descEn: 'AI-recommended actions generated for you', descAr: 'إجراءات أوصى بها الذكاء الاصطناعي لك' },
  { key: 'inProgress', en: 'In Progress', ar: 'قيد التنفيذ', icon: <Clock3 className="w-4 h-4" />, color: '#C9A84C',
    descEn: 'You marked these as started', descAr: 'أشرت إلى أن هذه بدأت' },
  { key: 'completed', en: 'Completed', ar: 'مكتمل', icon: <CheckCircle2 className="w-4 h-4" />, color: '#16A34A',
    descEn: 'You marked these as done', descAr: 'أشرت إلى أن هذه اكتملت' },
  { key: 'sustained', en: 'Sustained', ar: 'مستدام', icon: <ShieldCheck className="w-4 h-4" />, color: '#082C6B',
    descEn: "The segment's score held or improved in a later assessment", descAr: 'ظلّت درجة القطاع كما هي أو تحسّنت في تقييم لاحق' },
];

export function ROIWaterfall() {
  const { user, loading: authLoading } = useAuth();
  const { lang } = useLanguage();
  const ar = lang === 'ar';

  const [data, setData] = useState<RoiSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    fetch(`${API_BASE}/maturity/roi-summary`, { credentials: 'include' })
      .then(r => r.json())
      .then((d: RoiSummary) => { if (d.ok) setData(d); })
      .catch(() => { /* honest-empty state below handles this */ })
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  /* ── Not signed in ── */
  if (!authLoading && !user) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-lg text-center">
        <Waves className="w-12 h-12 text-primary/30 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-primary mb-2">{ar ? 'مسار تحقيق القيمة' : 'Value Realization'}</h1>
        <p className="text-muted-foreground mb-6">
          {ar
            ? 'سجّل الدخول لعرض ملخص تحقيق القيمة الخاص بك، المبني على سجل تقييماتك وإجراءاتك الفعلية.'
            : 'Sign in to see your value-realization summary, built from your own assessment and action history.'}
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

  /* ── Honest-empty state: no assessment ever taken ── */
  if (!data || !data.hasData) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-lg text-center">
        <Waves className="w-12 h-12 text-primary/30 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-primary mb-2">{ar ? 'مسار تحقيق القيمة' : 'Value Realization'}</h1>
        <p className="text-muted-foreground mb-6">
          {ar
            ? 'لا يوجد سجل بعد. أكمل تقييم النضج وتتبّع إجراءاتك، وسيظهر ملخص تحقيق القيمة هنا تلقائيًا.'
            : "No history yet. Complete a Maturity Assessment and track your actions, and your value-realization summary will build itself here automatically."}
        </p>
        <Link href="/maturity"><Button size="lg" className="bg-accent hover:bg-accent/90 gap-2">
          {ar ? 'ابدأ تقييم النضج' : 'Start Maturity Assessment'} <ArrowRight className="w-4 h-4" />
        </Button></Link>
      </div>
    );
  }

  const { funnel, segments, firstSnapshotAt, latestSnapshotAt, snapshotCount } = data;
  const maxCount = Math.max(funnel.identified, 1);

  return (
    <div className="w-full">
      <div className="relative w-full overflow-hidden bg-[#082C6B]" style={{ minHeight: 200 }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 60% 100%, rgba(201,168,76,0.2) 0%, transparent 60%), linear-gradient(135deg, #082C6B 0%, #0B3D91 100%)' }} />
        <div className="relative z-10 container mx-auto px-4 py-14 text-center max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-accent/20 border border-accent/30 rounded-full px-4 py-1.5 mb-4">
            <Waves className="w-4 h-4 text-accent" />
            <span className="text-accent font-bold text-sm uppercase tracking-widest">{ar ? 'تحقيق القيمة' : 'Value Realization'}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {ar ? 'من التوصية إلى الأثر المستدام' : 'From Recommendation to Sustained Impact'}
          </h1>
          <p className="text-white/70 text-sm">
            {ar
              ? `مبني على ${snapshotCount} تقييم(ات) وسجل إجراءاتك الفعلي — ذاتي الإبلاغ، غير مُدقَّق مستقلاً.`
              : `Built from ${snapshotCount} assessment${snapshotCount === 1 ? '' : 's'} and your real action history -- self-reported, not independently verified.`}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-5xl">
        {/* ── #160: Value funnel, four honestly-derived stages ── */}
        <div className="bg-white rounded-2xl border border-border p-6 mb-8">
          <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-1">
            {ar ? 'مسار القيمة' : 'Value Funnel'}
          </h2>
          <p className="text-xs text-muted-foreground mb-6">
            {ar
              ? 'كل مرحلة مبنية على بيانات حقيقية من متتبّع الإجراءات الخاص بك — لا رقم واحد مجمّع.'
              : 'Each stage is built from real data in your action tracker -- never one lump number.'}
          </p>
          <div className="space-y-4">
            {STAGES.map(stage => {
              const count = funnel[stage.key];
              const widthPct = Math.max((count / maxCount) * 100, count > 0 ? 4 : 0);
              return (
                <div key={stage.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span style={{ color: stage.color }}>{stage.icon}</span>
                      <span className="text-sm font-bold text-foreground">{ar ? stage.ar : stage.en}</span>
                      <span className="text-[11px] text-muted-foreground">— {ar ? stage.descAr : stage.descEn}</span>
                    </div>
                    <span className="text-lg font-black" style={{ color: stage.color }}>{count}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${widthPct}%`, background: stage.color }} />
                  </div>
                </div>
              );
            })}
          </div>
          {funnel.completed > funnel.sustained && (
            <p className="text-[11px] text-muted-foreground mt-5 italic">
              {ar
                ? `${funnel.completed - funnel.sustained} إجراء(ات) مكتملة بانتظار تقييم لاحق للتحقق من استدامة الأثر.`
                : `${funnel.completed - funnel.sustained} completed action${funnel.completed - funnel.sustained === 1 ? '' : 's'} awaiting a later assessment to verify the impact held.`}
            </p>
          )}
        </div>

        {/* ── Per-segment score movement ── */}
        <div className="bg-white rounded-2xl border border-border p-6 mb-8">
          <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-1">
            {ar ? 'حركة الدرجات حسب القطاع' : 'Score Movement by Segment'}
          </h2>
          <p className="text-xs text-muted-foreground mb-6">
            {ar
              ? `من ${firstSnapshotAt ? formatDate(firstSnapshotAt, ar) : '—'} إلى ${latestSnapshotAt ? formatDate(latestSnapshotAt, ar) : '—'}`
              : `From ${firstSnapshotAt ? formatDate(firstSnapshotAt, ar) : '—'} to ${latestSnapshotAt ? formatDate(latestSnapshotAt, ar) : '—'}`}
          </p>
          {segments.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">{ar ? 'لا توجد بيانات قطاعات بعد' : 'No segment data yet'}</p>
          ) : (
            <div className="space-y-2">
              {segments.map(seg => {
                const Icon = seg.delta === null ? Minus : seg.delta > 0 ? TrendingUp : seg.delta < 0 ? TrendingDown : Minus;
                const color = seg.delta === null ? '#94a3b8' : seg.delta > 0 ? '#16A34A' : seg.delta < 0 ? '#DC2626' : '#94a3b8';
                return (
                  <div key={seg.title} className="flex items-center justify-between py-2 border-b border-border/60 last:border-0">
                    <span className="text-sm text-foreground">{seg.title}</span>
                    <div className="flex items-center gap-2 text-sm font-semibold" style={{ color }}>
                      <span className="text-muted-foreground font-normal">
                        {seg.scoreFirst !== null ? seg.scoreFirst.toFixed(1) : '—'} → {seg.scoreLatest !== null ? seg.scoreLatest.toFixed(1) : '—'}
                      </span>
                      <Icon className="w-3.5 h-3.5" />
                      <span>{seg.delta !== null ? (seg.delta > 0 ? `+${seg.delta.toFixed(1)}` : seg.delta.toFixed(1)) : '—'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-center gap-3">
          <Link href="/action-tracker"><Button variant="outline" className="gap-2">
            {ar ? 'الذهاب إلى متتبّع الإجراءات' : 'Go to Action Tracker'} <ArrowRight className="w-4 h-4" />
          </Button></Link>
          {/* #174 cross-link: the per-action before/after detail this funnel's counts are
              aggregated from lives at /decision-memory (same backend data, same endpoint). */}
          <Link href="/decision-memory"><Button variant="outline" className="gap-2">
            {ar ? 'عرض ما تعلمناه، إجراءً بإجراء' : 'See what we learned, action by action'} <ArrowRight className="w-4 h-4" />
          </Button></Link>
        </div>
      </div>
    </div>
  );
}
