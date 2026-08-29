/**
 * Industry Benchmark (#398, 30 Aug 2026, Score-Maximization Plan v3 Lever 3)
 *
 * Cross-client benchmarking infrastructure -- the one credible path to a
 * second Hamilton Helmer power (network economies) that ISC can build
 * pre-client. Scoped 27 Aug 2026 (cross-client-benchmarking-infrastructure-
 * scoping-v1.md), built 30 Aug 2026.
 *
 * Shows the signed-in user's own segment scores plotted against the
 * anonymized cohort distribution (mean, median, p25/p75) for their
 * industry + company-size band, computed server-side by
 * recomputeIndustryBenchmarks() (nightly cron) from the *latest* snapshot
 * per organization, never surfaced below MIN_COHORT_SIZE (5) contributing
 * organizations -- enforced server-side, not just a UI convention (same
 * privacy floor discipline as GASTAT/Tamkeen SME publication rules).
 *
 * Honest by construction: with zero real paying/piloting clients as of
 * this build, every segment will show insufficientSample: true until real
 * usage accumulates -- the infrastructure is real and live; a populated,
 * credible benchmark is not yet, and this page says so plainly rather than
 * hiding the fact.
 *
 * Reuses MyWorkbench.tsx's data-fetch/auth-gate pattern and ProblemMap.tsx's
 * hero/empty-state visual language.
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Loader2, BarChart3, ArrowRight, Users, Info } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { API_BASE } from '@/lib/apiBase';
import { Button } from '@/components/ui/button';

// ─── Types ──────────────────────────────────────────────────────────────────

interface BenchmarkRow {
  segmentId: string;
  segmentTitle: string | null;
  segmentTitleAr: string | null;
  yourScore: number;
  insufficientSample: boolean;
  sampleSize: number | null;
  mean: number | null;
  median: number | null;
  p25: number | null;
  p75: number | null;
}
interface BenchmarkResponse {
  ok: boolean;
  minCohortSize: number;
  hasSnapshot: boolean;
  industry: string | null;
  companySize: string | null;
  takenAt: string | null;
  rows: BenchmarkRow[];
}

// ─── Segment comparison bar ─────────────────────────────────────────────────

function SegmentCompareBar({ row, ar }: { row: BenchmarkRow; ar: boolean }) {
  const label = (ar ? row.segmentTitleAr : row.segmentTitle) ?? row.segmentId;
  const pct = (v: number) => Math.min(100, Math.max(0, (v / 5) * 100));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-slate-800 text-sm">{label}</span>
        <span className="text-xs font-bold text-[#082C6B]">{row.yourScore.toFixed(1)}/5.0</span>
      </div>

      {row.insufficientSample ? (
        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 rounded-lg px-2.5 py-1.5 mt-1">
          <Info className="w-3.5 h-3.5 flex-shrink-0" />
          {ar
            ? 'عيّنة غير كافية بعد لهذا القطاع/الحجم — كن أول من يساهم في هذا المعيار.'
            : 'Not enough contributing organizations yet for your industry/size band -- be one of the first to help build this benchmark.'}
        </div>
      ) : (
        <div className="mt-2">
          <div className="relative h-6 bg-slate-100 rounded-full overflow-hidden">
            {row.p25 != null && row.p75 != null && (
              <div
                className="absolute top-0 bottom-0 bg-[#C9A84C]/25"
                style={{ left: `${pct(row.p25)}%`, width: `${pct(row.p75) - pct(row.p25)}%` }}
                title={ar ? 'المدى الربيعي (25-75٪)' : 'Interquartile range (p25-p75)'}
              />
            )}
            {row.median != null && (
              <div className="absolute top-0 bottom-0 w-0.5 bg-slate-500" style={{ left: `${pct(row.median)}%` }}
                title={ar ? 'الوسيط' : 'Median'} />
            )}
            <div className="absolute top-0 bottom-0 w-1 bg-[#082C6B] rounded-full" style={{ left: `calc(${pct(row.yourScore)}% - 2px)` }}
              title={ar ? 'نقاطك' : 'Your score'} />
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {ar
                ? `بناءً على ${row.sampleSize} من عملاء ISC في قطاعك وحجم شركتك`
                : `Based on ${row.sampleSize} ISC clients in your industry and size band`}
            </span>
            <span>{ar ? 'المتوسط' : 'Mean'}: <span className="font-semibold text-slate-700">{row.mean?.toFixed(1)}</span></span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export function IndustryBenchmark() {
  const { user, loading: authLoading } = useAuth();
  const { lang } = useLanguage();
  const ar = lang === 'ar';

  const [data, setData] = useState<BenchmarkResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    fetch(`${API_BASE}/benchmarks/mine`, { credentials: 'include' })
      .then(r => r.json())
      .then((res: BenchmarkResponse) => { if (res.ok) setData(res); })
      .catch(() => { /* honest-empty state below handles this */ })
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  if (!authLoading && !user) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-lg text-center">
        <BarChart3 className="w-12 h-12 text-primary/30 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-primary mb-2">{ar ? 'مقارنة القطاع' : 'Industry Benchmark'}</h1>
        <p className="text-muted-foreground mb-6">
          {ar
            ? 'سجّل الدخول لمقارنة نتائجك بمتوسط عملاء ISC المجهولين في قطاعك وحجم شركتك.'
            : 'Sign in to compare your scores against the anonymized average of ISC clients in your industry and size band.'}
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

  const hasSnapshot = data?.hasSnapshot ?? false;

  return (
    <div className={`w-full ${ar ? 'rtl' : 'ltr'}`}>
      {/* ── Hero ── */}
      <div className="relative w-full overflow-hidden bg-[#082C6B]" style={{ minHeight: 180 }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 60% 100%, rgba(201,168,76,0.2) 0%, transparent 60%), linear-gradient(135deg, #082C6B 0%, #0B3D91 100%)' }} />
        <div className="relative z-10 container mx-auto px-4 py-12 text-center max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-accent/20 border border-accent/30 rounded-full px-4 py-1.5 mb-4">
            <BarChart3 className="w-4 h-4 text-accent" />
            <span className="text-accent font-bold text-sm uppercase tracking-widest">{ar ? 'مقارنة القطاع' : 'Industry Benchmark'}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {ar ? 'كيف تقارن نتائجك بالآخرين؟' : 'How Do You Compare?'}
          </h1>
          <p className="text-white/70 text-sm">
            {ar
              ? 'نقاطك الفعلية مقابل متوسط عملاء ISC المجهولين في نفس القطاع وحجم الشركة — كل ما زاد عدد العملاء، زادت دقة هذا المعيار.'
              : 'Your real scores against the anonymized average of ISC clients in the same industry and company-size band -- the more clients who assess, the sharper this benchmark gets for everyone.'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {!hasSnapshot ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-semibold">{ar ? 'لا يوجد تقييم بعد' : 'No assessment yet'}</p>
            <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">
              {ar
                ? 'أكمل تقييم النضج لبدء مقارنة نتائجك بالمعيار المجهول لقطاعك.'
                : 'Complete a Maturity Assessment to start comparing your scores against your industry\'s anonymized benchmark.'}
            </p>
            <Link href="/maturity"><Button size="sm" className="mt-4 gap-2 bg-[#082C6B] hover:bg-[#0e3d8a]">
              {ar ? 'بدء التقييم' : 'Start the Assessment'} <ArrowRight className="w-3.5 h-3.5" />
            </Button></Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              {ar
                ? `${data?.industry ?? ''} · ${data?.companySize ?? ''} — يتطلب كل معيار ${data?.minCohortSize ?? 5} مؤسسات مساهمة على الأقل لحماية الخصوصية.`
                : `${data?.industry ?? ''} · ${data?.companySize ?? ''} -- every benchmark requires at least ${data?.minCohortSize ?? 5} contributing organizations to protect privacy.`}
            </div>
            {(data?.rows ?? []).map(row => (
              <SegmentCompareBar key={row.segmentId} row={row} ar={ar} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
