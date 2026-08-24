/**
 * Decision Memory / "What Did We Learn?" (#174, Wave B-5, 24 Aug 2026)
 *
 * An organizational-learning report: for every completed action, did the
 * segment score it targeted hold or improve by the next assessment? Reads
 * the SAME GET /api/maturity/roi-summary endpoint ROIWaterfall.tsx already
 * uses (#173) -- specifically its learningItems[] array, added in this
 * task rather than duplicating roiSummary.ts's existing sustained-count
 * loop with a second query. See roiSummary.ts's header comment for the
 * full reasoning.
 *
 * Honesty note (Decision Record 8.7): "held" means the segment score did
 * not drop by the next assessment after the action was marked done -- it
 * is a correlation, not causal proof that THIS specific action caused the
 * score to hold. Multiple actions often target the same segment in the
 * same window, and other factors (a new hire, a process change never
 * logged in ISC) can move a score too. This page states that caveat
 * directly rather than implying single-action attribution.
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { API_BASE } from '@/lib/apiBase';
import { Button } from '@/components/ui/button';
import {
  Loader2, BookOpen, CheckCircle2, XCircle, HelpCircle, ArrowRight, TrendingUp, TrendingDown,
} from 'lucide-react';

interface LearningItem {
  id: number; action: string; segmentTitle: string;
  scoreBefore: number; scoreAfter: number | null; delta: number | null;
  completedAt: string; held: boolean | null;
}
interface RoiSummary {
  ok: boolean;
  hasData: boolean;
  learningItems: LearningItem[];
}

function formatDate(iso: string, ar: boolean) {
  return new Date(iso).toLocaleDateString(ar ? 'ar-SA' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function DecisionMemory() {
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

  if (!authLoading && !user) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-lg text-center">
        <BookOpen className="w-12 h-12 text-primary/30 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-primary mb-2">{ar ? 'ما الذي تعلمناه؟' : 'What Did We Learn?'}</h1>
        <p className="text-muted-foreground mb-6">
          {ar ? 'سجّل الدخول لعرض سجل التعلم التنظيمي الخاص بك.' : 'Sign in to see your organizational-learning record.'}
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

  /* No assessment ever taken -- nothing to build a learning record from. */
  if (!data || !data.hasData) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-lg text-center">
        <BookOpen className="w-12 h-12 text-primary/30 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-primary mb-2">{ar ? 'ما الذي تعلمناه؟' : 'What Did We Learn?'}</h1>
        <p className="text-muted-foreground mb-6">
          {ar
            ? 'لا يوجد سجل بعد. أكمل تقييم النضج وتتبّع إجراءاتك، وسيبدأ سجل التعلم بالتكوّن تلقائيًا.'
            : 'No record yet. Complete a Maturity Assessment and track your actions, and your learning record will start building itself here automatically.'}
        </p>
        <Link href="/maturity"><Button size="lg" className="bg-accent hover:bg-accent/90 gap-2">
          {ar ? 'ابدأ تقييم النضج' : 'Start Maturity Assessment'} <ArrowRight className="w-4 h-4" />
        </Button></Link>
      </div>
    );
  }

  const held = data.learningItems.filter(i => i.held === true);
  const notHeld = data.learningItems.filter(i => i.held === false);
  const pending = data.learningItems.filter(i => i.held === null);

  return (
    <div className="w-full">
      <div className="relative w-full overflow-hidden bg-[#082C6B]" style={{ minHeight: 180 }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 60% 100%, rgba(201,168,76,0.2) 0%, transparent 60%), linear-gradient(135deg, #082C6B 0%, #0B3D91 100%)' }} />
        <div className="relative z-10 container mx-auto px-4 py-12 text-center max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-accent/20 border border-accent/30 rounded-full px-4 py-1.5 mb-4">
            <BookOpen className="w-4 h-4 text-accent" />
            <span className="text-accent font-bold text-sm uppercase tracking-widest">{ar ? 'ذاكرة القرار' : 'Decision Memory'}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {ar ? 'ما الذي تعلمناه؟' : 'What Did We Learn?'}
          </h1>
          <p className="text-white/70 text-sm">
            {ar
              ? 'كل إجراء أُنجز، وما حدث لدرجة القطاع بعده — مبني بالكامل من سجل تقييماتك الفعلي.'
              : 'Every completed action, and what happened to its segment score afterward -- built entirely from your real assessment history.'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-4xl">
        {data.learningItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border p-10 text-center">
            <BookOpen className="w-10 h-10 text-primary/20 mx-auto mb-3" />
            <p className="text-muted-foreground mb-6">
              {ar
                ? 'لا توجد إجراءات مكتملة مرتبطة بتقييم بعد. أكمل إجراءً من متتبّع الإجراءات لتبدأ رؤية النتائج هنا.'
                : 'No completed, assessment-linked actions yet. Complete an item in Action Tracker to start seeing outcomes here.'}
            </p>
            <Link href="/action-tracker"><Button variant="outline" className="gap-2">
              {ar ? 'عرض متتبّع الإجراءات' : 'View Action Tracker'} <ArrowRight className="w-4 h-4" />
            </Button></Link>
          </div>
        ) : (
          <>
            <p className="text-[11px] text-muted-foreground italic mb-6 text-center max-w-xl mx-auto">
              {ar
                ? '"استمرت" تعني أن درجة القطاع لم تنخفض بحلول التقييم التالي — وهو ارتباط، وليس إثباتًا سببيًا قاطعًا بأن هذا الإجراء تحديدًا هو السبب.'
                : '"Held" means the segment score did not drop by the next assessment -- a correlation, not conclusive proof this specific action was the cause.'}
            </p>

            <div className="space-y-6">
              {[
                { key: 'held', items: held, icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />, color: '#16A34A', labelEn: 'Held or Improved', labelAr: 'استمرت أو تحسّنت' },
                { key: 'notHeld', items: notHeld, icon: <XCircle className="w-4 h-4 text-red-600" />, color: '#DC2626', labelEn: 'Did Not Hold', labelAr: 'لم تستمر' },
                { key: 'pending', items: pending, icon: <HelpCircle className="w-4 h-4 text-amber-600" />, color: '#D97706', labelEn: 'Not Yet Verifiable', labelAr: 'غير قابلة للتحقق بعد' },
              ].map(group => group.items.length === 0 ? null : (
                <section key={group.key} className="bg-white rounded-2xl border border-border p-6">
                  <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                    {group.icon} {ar ? group.labelAr : group.labelEn} <span className="text-muted-foreground font-normal normal-case">({group.items.length})</span>
                  </h2>
                  <div className="space-y-2">
                    {group.items.map(item => {
                      const Icon = item.delta === null ? HelpCircle : item.delta >= 0 ? TrendingUp : TrendingDown;
                      return (
                        <div key={item.id} className="flex items-center justify-between py-1.5 border-b border-border/60 last:border-0">
                          <div>
                            <span className="text-sm text-foreground">{item.action}</span>
                            <span className="text-[11px] text-muted-foreground ml-2">— {item.segmentTitle} · {formatDate(item.completedAt, ar)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm font-semibold shrink-0" style={{ color: group.color }}>
                            <span className="text-muted-foreground font-normal">
                              {item.scoreBefore.toFixed(1)} → {item.scoreAfter !== null ? item.scoreAfter.toFixed(1) : '—'}
                            </span>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {group.key === 'pending' && (
                    <div className="mt-4">
                      <Link href="/maturity"><Button variant="outline" size="sm" className="gap-2">
                        {ar ? 'خذ تقييمًا جديدًا للتحقق' : 'Take a new assessment to verify'} <ArrowRight className="w-3.5 h-3.5" />
                      </Button></Link>
                    </div>
                  )}
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
