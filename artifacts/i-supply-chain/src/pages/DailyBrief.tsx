/**
 * Daily / Weekly Brief (#171, Wave B-4, 23 Aug 2026)
 *
 * A digest screen built entirely from data the platform already has on
 * file for this user -- see brief.ts backend route for the full sourcing
 * and honesty rationale (no "last login" field exists in this schema, so
 * this uses a real named time window instead; Consultancy Engine activity
 * has no natural "done" state so it is deliberately left out of the
 * completions feed rather than mislabeled).
 *
 * Four sections, each independently empty-safe: What Changed, What Needs
 * You, What's Emerging, Recent Completions. Refreshed on view (a toggle
 * switches between the last 24 hours and the last 7 days), not pushed
 * live -- matching the plan doc's own framing.
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { API_BASE } from '@/lib/apiBase';
import { Button } from '@/components/ui/button';
import {
  Loader2, Newspaper, TrendingUp, TrendingDown, AlertCircle, Sparkles,
  CheckCircle2, ArrowRight, Clock3, Target,
} from 'lucide-react';

interface ChangedSegment { title: string; scoreLatest: number; scorePrevious: number; delta: number }
interface Changed {
  hasComparison: boolean;
  latestSnapshotAt: string | null;
  previousSnapshotAt: string | null;
  segments: ChangedSegment[];
}
interface NeedsYouOverdue { id: number; phase: string; action: string; segmentTitle: string | null; dueAt: string }
interface NeedsYouNotStarted { id: number; action: string; segmentTitle: string | null; source: string; createdAt: string }
interface EmergingItem { id: number; action: string; segmentTitle: string | null; source: string; createdAt: string }
interface CompletionItem { type: string; label: string; occurredAt: string; href: string }

interface BriefSummary {
  ok: boolean;
  hasData: boolean;
  window: 'daily' | 'weekly';
  windowDays: number;
  changed: Changed;
  needsYou: { overdue: NeedsYouOverdue[]; notStarted: NeedsYouNotStarted[] };
  emerging: EmergingItem[];
  completions: CompletionItem[];
}

function formatDate(iso: string, ar: boolean) {
  return new Date(iso).toLocaleDateString(ar ? 'ar-SA' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
}
function formatDateTime(iso: string, ar: boolean) {
  return new Date(iso).toLocaleDateString(ar ? 'ar-SA' : 'en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function DailyBrief() {
  const { user, loading: authLoading } = useAuth();
  const { lang } = useLanguage();
  const ar = lang === 'ar';

  const [windowKey, setWindowKey] = useState<'daily' | 'weekly'>('weekly');
  const [data, setData] = useState<BriefSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    setLoading(true);
    fetch(`${API_BASE}/brief/summary?window=${windowKey}`, { credentials: 'include' })
      .then(r => r.json())
      .then((d: BriefSummary) => { if (d.ok) setData(d); })
      .catch(() => { /* honest-empty state below handles this */ })
      .finally(() => setLoading(false));
  }, [user, authLoading, windowKey]);

  /* ── Not signed in ── */
  if (!authLoading && !user) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-lg text-center">
        <Newspaper className="w-12 h-12 text-primary/30 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-primary mb-2">{ar ? 'ملخصك اليومي' : 'Your Brief'}</h1>
        <p className="text-muted-foreground mb-6">
          {ar
            ? 'سجّل الدخول لعرض ملخصك المبني على بيانات تقييماتك وإجراءاتك الفعلية.'
            : 'Sign in to see your brief, built from your own assessment and action data.'}
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

  const empty = !data || !data.hasData;
  const windowLabel = windowKey === 'daily' ? (ar ? 'آخر 24 ساعة' : 'last 24 hours') : (ar ? 'آخر 7 أيام' : 'last 7 days');

  return (
    <div className="w-full">
      <div className="relative w-full overflow-hidden bg-[#082C6B]" style={{ minHeight: 180 }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 60% 100%, rgba(201,168,76,0.2) 0%, transparent 60%), linear-gradient(135deg, #082C6B 0%, #0B3D91 100%)' }} />
        <div className="relative z-10 container mx-auto px-4 py-12 text-center max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-accent/20 border border-accent/30 rounded-full px-4 py-1.5 mb-4">
            <Newspaper className="w-4 h-4 text-accent" />
            <span className="text-accent font-bold text-sm uppercase tracking-widest">{ar ? 'ملخصك' : 'Your Brief'}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {ar ? 'ما تغيّر، وما يحتاج إليك' : 'What Changed, What Needs You'}
          </h1>
          <p className="text-white/70 text-sm mb-4">
            {ar
              ? `مبني بالكامل من بياناتك الحقيقية — لا يوجد بث مباشر، فقط يُحدَّث عند العرض.`
              : `Built entirely from your own real data -- not a live feed, refreshed only when you view it.`}
          </p>
          <div className="inline-flex rounded-full bg-white/10 p-1">
            <button
              onClick={() => setWindowKey('daily')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${windowKey === 'daily' ? 'bg-white text-primary' : 'text-white/70 hover:text-white'}`}
            >{ar ? 'يومي' : 'Daily'}</button>
            <button
              onClick={() => setWindowKey('weekly')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${windowKey === 'weekly' ? 'bg-white text-primary' : 'text-white/70 hover:text-white'}`}
            >{ar ? 'أسبوعي' : 'Weekly'}</button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-4xl">
        {empty ? (
          <div className="bg-white rounded-2xl border border-border p-10 text-center">
            <Newspaper className="w-10 h-10 text-primary/20 mx-auto mb-3" />
            <p className="text-muted-foreground mb-6">
              {ar
                ? `لا يوجد نشاط جديد خلال ${windowLabel}. أكمل تقييمًا أو تابع إجراءاتك ليظهر هنا تلقائيًا.`
                : `No new activity in the ${windowLabel}. Complete an assessment or work your actions, and it will show up here automatically.`}
            </p>
            <Link href="/action-tracker"><Button variant="outline" className="gap-2">
              {ar ? 'الذهاب إلى متتبّع الإجراءات' : 'Go to Action Tracker'} <ArrowRight className="w-4 h-4" />
            </Button></Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ── What Changed ── */}
            <section className="bg-white rounded-2xl border border-border p-6">
              <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-1 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> {ar ? 'ما تغيّر' : 'What Changed'}
              </h2>
              {!data!.changed.hasComparison ? (
                <p className="text-xs text-muted-foreground italic mt-3">
                  {ar ? 'يلزم تقييمان على الأقل لعرض حركة الدرجات.' : 'Needs at least two assessments to show score movement.'}
                </p>
              ) : data!.changed.segments.length === 0 ? (
                <p className="text-xs text-muted-foreground italic mt-3">
                  {ar ? 'لا تغيّر في الدرجات بين آخر تقييمين.' : 'No score movement between your last two assessments.'}
                </p>
              ) : (
                <div className="space-y-2 mt-3">
                  {data!.changed.segments.map(seg => {
                    const Icon = seg.delta > 0 ? TrendingUp : TrendingDown;
                    const color = seg.delta > 0 ? '#16A34A' : '#DC2626';
                    return (
                      <div key={seg.title} className="flex items-center justify-between py-1.5 border-b border-border/60 last:border-0">
                        <span className="text-sm text-foreground">{seg.title}</span>
                        <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color }}>
                          <span className="text-muted-foreground font-normal">{seg.scorePrevious.toFixed(1)} → {seg.scoreLatest.toFixed(1)}</span>
                          <Icon className="w-3.5 h-3.5" />
                          <span>{seg.delta > 0 ? `+${seg.delta.toFixed(1)}` : seg.delta.toFixed(1)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ── What Needs You ── */}
            <section className="bg-white rounded-2xl border border-border p-6">
              <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-1 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {ar ? 'ما يحتاج إليك' : 'What Needs You'}
              </h2>
              {data!.needsYou.overdue.length === 0 && data!.needsYou.notStarted.length === 0 ? (
                <p className="text-xs text-muted-foreground italic mt-3">{ar ? 'لا توجد عناصر متأخرة أو معلّقة.' : 'Nothing overdue or stalled.'}</p>
              ) : (
                <div className="space-y-2 mt-3">
                  {data!.needsYou.overdue.map(item => (
                    <div key={`ov-${item.id}`} className="flex items-start gap-2 py-1.5 border-b border-border/60 last:border-0">
                      <Clock3 className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-sm text-foreground">{item.action}</span>
                        <span className="text-[11px] text-red-600 font-semibold ml-2">
                          {ar ? 'متأخر منذ ' : 'overdue since '}{formatDate(item.dueAt, ar)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {data!.needsYou.notStarted.map(item => (
                    <div key={`ns-${item.id}`} className="flex items-start gap-2 py-1.5 border-b border-border/60 last:border-0">
                      <Target className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-sm text-foreground">{item.action}</span>
                        <span className="text-[11px] text-amber-600 font-semibold ml-2">
                          {ar ? 'لم يبدأ بعد' : 'not started yet'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <Link href="/action-tracker"><Button variant="outline" size="sm" className="gap-2">
                  {ar ? 'عرض متتبّع الإجراءات' : 'View Action Tracker'} <ArrowRight className="w-3.5 h-3.5" />
                </Button></Link>
              </div>
            </section>

            {/* ── What's Emerging ── */}
            <section className="bg-white rounded-2xl border border-border p-6">
              <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> {ar ? "ما يستجد" : "What's Emerging"}
              </h2>
              {data!.emerging.length === 0 ? (
                <p className="text-xs text-muted-foreground italic mt-3">
                  {ar ? `لا توجد توصيات جديدة خلال ${windowLabel}.` : `No new recommendations in the ${windowLabel}.`}
                </p>
              ) : (
                <div className="space-y-2 mt-3">
                  {data!.emerging.map(item => (
                    <div key={item.id} className="flex items-start gap-2 py-1.5 border-b border-border/60 last:border-0">
                      <Sparkles className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
                      <div>
                        <span className="text-sm text-foreground">{item.action}</span>
                        {item.segmentTitle && <span className="text-[11px] text-muted-foreground ml-2">— {item.segmentTitle}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ── Recent Completions ── */}
            <section className="bg-white rounded-2xl border border-border p-6">
              <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-1 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {ar ? 'الإنجازات الأخيرة' : 'Recent Completions'}
              </h2>
              {data!.completions.length === 0 ? (
                <p className="text-xs text-muted-foreground italic mt-3">
                  {ar ? `لا توجد إنجازات خلال ${windowLabel}.` : `No completions in the ${windowLabel}.`}
                </p>
              ) : (
                <div className="space-y-2 mt-3">
                  {data!.completions.map((item, i) => (
                    <Link key={i} href={item.href}>
                      <div className="flex items-center justify-between py-1.5 border-b border-border/60 last:border-0 cursor-pointer hover:bg-slate-50 -mx-2 px-2 rounded">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="text-sm text-foreground">{item.label}</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground">{formatDateTime(item.occurredAt, ar)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
