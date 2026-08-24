/**
 * My Workbench (#172, Wave B-4, 23 Aug 2026)
 *
 * A personal, persistent aggregation of everything the client has already
 * generated across ISC's tools -- "my actions, my investigations, my
 * commitments, my decisions" -- per the site map's own framing. Unlike the
 * Daily/Weekly Brief (#171), which is a time-windowed digest of what's
 * new, this is the full standing list: every action ever assigned, every
 * Consultancy Engine investigation ever run.
 *
 * Two of the four buckets are deliberately NOT built as new backend reads
 * here (see workbench.ts's header comment for the full reasoning):
 *
 *   - "My commitments" reuses the existing, already-shipped GET /api/plans
 *     endpoint (see plans.ts / SavedPlansSection.tsx) directly -- no
 *     second code path for the same data.
 *   - "My decisions" reads the Decision Lab's own localStorage key
 *     directly in the browser, since that tool has never had server
 *     persistence (only the single most recent scenario is saved, and
 *     only on this device) -- labeled honestly as device-local rather
 *     than presented as synced history.
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { API_BASE } from '@/lib/apiBase';
import { Button } from '@/components/ui/button';
import {
  Loader2, LayoutGrid, ListChecks, Search, FileText, Scale, ArrowRight, Clock3,
} from 'lucide-react';

interface ActionItem {
  id: number; source: string; phase: string | null; segmentTitle: string | null;
  action: string; status: string; createdAt: string; completedAt: string | null;
  dueAt: string | null; isOverdue: boolean; daysOverdue: number | null;
}
interface WorkbenchSummary {
  ok: boolean;
  hasData: boolean;
  actions: { total: number; notStarted: number; inProgress: number; done: number; items: ActionItem[] };
  investigations: Array<{ id: number; tool: string; industry: string | null; subIndustry: string | null; challenge: string | null; problemCount: number | null; createdAt: string }>;
}
interface PlanEntry { toolKey: string; text: string; savedAt: string }
interface DecisionScenario { question: string; criteria: unknown[]; options: unknown[] }

function formatDate(iso: string, ar: boolean) {
  return new Date(iso).toLocaleDateString(ar ? 'ar-SA' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
}

function readLocalDecision(): DecisionScenario | null {
  try {
    const raw = localStorage.getItem('isc-decision-lab-v1');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DecisionScenario;
    return parsed.question ? parsed : null;
  } catch { return null; }
}

export function MyWorkbench() {
  const { user, loading: authLoading } = useAuth();
  const { lang } = useLanguage();
  const ar = lang === 'ar';

  const [data, setData] = useState<WorkbenchSummary | null>(null);
  const [plans, setPlans] = useState<PlanEntry[]>([]);
  const [decision, setDecision] = useState<DecisionScenario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    setDecision(readLocalDecision());
    Promise.all([
      fetch(`${API_BASE}/workbench/summary`, { credentials: 'include' }).then(r => r.json()),
      fetch(`${API_BASE}/plans`, { credentials: 'include' }).then(r => r.json()),
    ])
      .then(([wb, pl]) => {
        if (wb.ok) setData(wb);
        if (pl.ok) setPlans(pl.plans ?? []);
      })
      .catch(() => { /* honest-empty state below handles this */ })
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  if (!authLoading && !user) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-lg text-center">
        <LayoutGrid className="w-12 h-12 text-primary/30 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-primary mb-2">{ar ? 'مساحة عملي' : 'My Workbench'}</h1>
        <p className="text-muted-foreground mb-6">
          {ar
            ? 'سجّل الدخول لعرض إجراءاتك وتحقيقاتك والتزاماتك في مكان واحد.'
            : 'Sign in to see your actions, investigations, and commitments in one place.'}
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

  const hasAnything = (data?.hasData ?? false) || plans.length > 0 || !!decision;

  return (
    <div className="w-full">
      <div className="relative w-full overflow-hidden bg-[#082C6B]" style={{ minHeight: 180 }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 60% 100%, rgba(201,168,76,0.2) 0%, transparent 60%), linear-gradient(135deg, #082C6B 0%, #0B3D91 100%)' }} />
        <div className="relative z-10 container mx-auto px-4 py-12 text-center max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-accent/20 border border-accent/30 rounded-full px-4 py-1.5 mb-4">
            <LayoutGrid className="w-4 h-4 text-accent" />
            <span className="text-accent font-bold text-sm uppercase tracking-widest">{ar ? 'مساحة عملي' : 'My Workbench'}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {ar ? 'كل ما بنيته، في مكان واحد' : 'Everything You Have Built, In One Place'}
          </h1>
          <p className="text-white/70 text-sm">
            {ar
              ? 'إجراءاتك وتحقيقاتك والتزاماتك عبر جميع أدوات المنصة — بياناتك الحقيقية فقط.'
              : 'Your actions, investigations, and commitments across every tool on the platform -- your real data only.'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-4xl">
        {!hasAnything ? (
          <div className="bg-white rounded-2xl border border-border p-10 text-center">
            <LayoutGrid className="w-10 h-10 text-primary/20 mx-auto mb-3" />
            <p className="text-muted-foreground mb-6">
              {ar
                ? 'لا يوجد شيء بعد. ابدأ بتقييم النضج أو محرك الاستشارات، وسيبدأ هذا العرض بالتكوّن تلقائيًا.'
                : "Nothing here yet. Start a Maturity Assessment or run the Consultancy Engine, and this view will start building itself automatically."}
            </p>
            <Link href="/maturity"><Button variant="outline" className="gap-2">
              {ar ? 'ابدأ تقييم النضج' : 'Start Maturity Assessment'} <ArrowRight className="w-4 h-4" />
            </Button></Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ── My Actions ── */}
            <section className="bg-white rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                  <ListChecks className="w-4 h-4" /> {ar ? 'إجراءاتي' : 'My Actions'}
                </h2>
                {data && data.actions.total > 0 && (
                  <span className="text-[11px] text-muted-foreground">
                    {data.actions.notStarted} {ar ? 'لم تبدأ' : 'not started'} · {data.actions.inProgress} {ar ? 'قيد التنفيذ' : 'in progress'} · {data.actions.done} {ar ? 'مكتملة' : 'done'}
                  </span>
                )}
              </div>
              {!data || data.actions.total === 0 ? (
                <p className="text-xs text-muted-foreground italic mt-3">{ar ? 'لا توجد إجراءات بعد.' : 'No actions yet.'}</p>
              ) : (
                <div className="space-y-2 mt-3">
                  {data.actions.items.slice(0, 12).map(item => (
                    <div key={item.id} className="flex items-start gap-2 py-1.5 border-b border-border/60 last:border-0">
                      {item.isOverdue ? <Clock3 className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" /> : <ListChecks className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />}
                      <div className="flex-1">
                        <span className="text-sm text-foreground">{item.action}</span>
                        {item.segmentTitle && <span className="text-[11px] text-muted-foreground ml-2">— {item.segmentTitle}</span>}
                      </div>
                      {item.isOverdue ? (
                        <span className="text-[11px] text-red-600 font-semibold shrink-0">
                          {ar ? `متأخر ${item.daysOverdue} يومًا` : `${item.daysOverdue}d overdue`}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground shrink-0 capitalize">{item.status.replace('_', ' ')}</span>
                      )}
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

            {/* ── My Investigations ── */}
            <section className="bg-white rounded-2xl border border-border p-6">
              <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-1 flex items-center gap-2">
                <Search className="w-4 h-4" /> {ar ? 'تحقيقاتي' : 'My Investigations'}
              </h2>
              {!data || data.investigations.length === 0 ? (
                <p className="text-xs text-muted-foreground italic mt-3">{ar ? 'لا توجد تحقيقات بعد.' : 'No investigations yet.'}</p>
              ) : (
                <div className="space-y-2 mt-3">
                  {data.investigations.map(inv => (
                    <Link key={inv.id} href="/command-center">
                      <div className="flex items-center justify-between py-1.5 border-b border-border/60 last:border-0 cursor-pointer hover:bg-slate-50 -mx-2 px-2 rounded">
                        <div>
                          <span className="text-sm text-foreground">{inv.challenge ?? (ar ? 'تحقيق' : 'Investigation')}</span>
                          <span className="text-[11px] text-muted-foreground ml-2">
                            — {inv.industry}{inv.subIndustry ? ` / ${inv.subIndustry}` : ''}
                            {inv.problemCount !== null && ` · ${inv.problemCount} ${ar ? 'مشكلة محددة' : 'problem(s) identified'}`}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground shrink-0">{formatDate(inv.createdAt, ar)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* ── My Commitments (reuses GET /api/plans, no duplicate backend read) ── */}
            <section className="bg-white rounded-2xl border border-border p-6">
              <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-1 flex items-center gap-2">
                <FileText className="w-4 h-4" /> {ar ? 'التزاماتي' : 'My Commitments'}
              </h2>
              {plans.length === 0 ? (
                <p className="text-xs text-muted-foreground italic mt-3">{ar ? 'لا توجد خطط محفوظة بعد.' : 'No saved plans yet.'}</p>
              ) : (
                <div className="space-y-2 mt-3">
                  {plans.slice(0, 8).map(p => (
                    <div key={p.toolKey} className="flex items-center justify-between py-1.5 border-b border-border/60 last:border-0">
                      <span className="text-sm text-foreground">{p.toolKey}</span>
                      <span className="text-[11px] text-muted-foreground shrink-0">{formatDate(p.savedAt, ar)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <Link href="/account"><Button variant="outline" size="sm" className="gap-2">
                  {ar ? 'عرض جميع الخطط المحفوظة' : 'View All Saved Plans'} <ArrowRight className="w-3.5 h-3.5" />
                </Button></Link>
              </div>
            </section>

            {/* ── My Decisions (device-local only, never presented as synced) ── */}
            <section className="bg-white rounded-2xl border border-border p-6">
              <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-1 flex items-center gap-2">
                <Scale className="w-4 h-4" /> {ar ? 'قراراتي' : 'My Decisions'}
              </h2>
              {!decision ? (
                <p className="text-xs text-muted-foreground italic mt-3">{ar ? 'لا يوجد قرار محفوظ على هذا الجهاز بعد.' : 'No decision saved on this device yet.'}</p>
              ) : (
                <>
                  <p className="text-sm text-foreground mt-3">{decision.question}</p>
                  <p className="text-[11px] text-amber-600 mt-1">
                    {ar ? 'محفوظ على هذا الجهاز فقط — غير متزامن عبر الأجهزة.' : 'Saved on this device only -- not synced across devices.'}
                  </p>
                </>
              )}
              <div className="mt-4">
                <Link href="/decision-lab"><Button variant="outline" size="sm" className="gap-2">
                  {ar ? 'فتح مختبر القرار' : 'Open Decision Lab'} <ArrowRight className="w-3.5 h-3.5" />
                </Button></Link>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
