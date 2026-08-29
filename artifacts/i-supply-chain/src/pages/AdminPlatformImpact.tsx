/**
 * AdminPlatformImpact — Platform Impact Dashboard (investor-facing, #185 /
 * registry #185)
 * Route: /admin/platform-impact
 *
 * Not a client-facing feature: a meta/admin view aggregating ISC's own
 * platform-wide usage across ALL clients for Maen's own investor
 * conversations (ISC_UIUX_Vision_Synthesis_and_Scalability_Plan_v4.pdf, F2
 * Part XXIII "Investor-Level UI"). Reads GET /api/admin/platform-impact
 * (requireAdmin-gated, same pattern as AdminLeads/AdminIntegrations).
 *
 * See platform-impact-dashboard-185-scoping-draft.md for the scoping pass
 * and adminPlatformImpact.ts (backend) for how each metric is computed and
 * why -- in particular the "gap" definition (REACTIVE_CEILING = 2.0, reused
 * from brief.ts, not invented) and the organizationsEngaged undercount
 * caveat (pre-Engine-4 users are not backfilled into an organization).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  Gauge, RefreshCw, Loader2, ShieldAlert, ArrowLeft,
  ClipboardList, FileText, ListChecks, TrendingDown, Building2, Users, BarChart3, Target,
} from 'lucide-react';
import { API_BASE } from '@/lib/apiBase';

interface PlatformImpactMetrics {
  diagnosticsRun: number;
  assessmentsCompleted: number;
  actionsTracked: number;
  actionsByStatus: Record<string, number>;
  gapsIdentified: number;
  assessedUsersWithAtLeastOneGap: number;
  distinctUsersAssessed: number;
  organizationsEngaged: number;
  totalUsers: number;
}
interface CohortProgressRow {
  industry: string;
  companySize: string;
  contributingOrganizations: number;
  needed: number;
  live: boolean;
}
interface BenchmarkCohortProgress {
  minCohortSize: number;
  cohorts: CohortProgressRow[];
  closestToLive: CohortProgressRow[];
}
interface PlatformImpactResponse {
  ok: boolean;
  generatedAt: string;
  metrics: PlatformImpactMetrics;
  benchmarkCohortProgress: BenchmarkCohortProgress;
  definitions: Record<string, string>;
}

export function AdminPlatformImpact() {
  const { user, loading: authLoading } = useAuth();
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const isAdmin = user?.role === 'admin';

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <ShieldAlert className="w-12 h-12 text-red-400" />
        <p className="text-lg font-bold text-primary">{ar ? 'يتطلب صلاحية المسؤول' : 'Admin access required'}</p>
        <Link href="/admin" className="text-sm text-primary underline">{ar ? '← رجوع إلى لوحة المسؤول' : '← Back to Admin'}</Link>
      </div>
    );
  }

  return <Dashboard ar={ar} />;
}

function Dashboard({ ar }: { ar: boolean }) {
  const [data, setData] = useState<PlatformImpactResponse | null>(null);
  const [error, setError] = useState<'unauthorized' | 'forbidden' | 'failed' | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/platform-impact`, { credentials: 'include' });
      if (res.status === 401) { setError('unauthorized'); return; }
      if (res.status === 403) { setError('forbidden'); return; }
      if (!res.ok) { setError('failed'); return; }
      const json = await res.json();
      setData(json);
    } catch {
      setError('failed');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8" dir={ar ? 'rtl' : 'ltr'}>
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/leads" className="text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Gauge className="w-6 h-6" />
            {ar ? 'أثر المنصة' : 'Platform Impact'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {ar
              ? 'عرض تجميعي عبر جميع العملاء لمحادثات المستثمرين — ليس ميزة للعملاء'
              : 'Aggregate, cross-client view for investor conversations — not a client-facing feature'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { void load(); }} data-testid="button-refresh-platform-impact">
          <RefreshCw className="w-4 h-4 me-2" />
          {ar ? 'تحديث' : 'Refresh'}
        </Button>
      </div>

      {/* Admin nav tabs */}
      <nav className="flex gap-2 border-b border-border pb-2 text-sm flex-wrap">
        <Link href="/admin/leads" className="px-3 py-1.5 rounded-t-md text-muted-foreground hover:text-primary transition-colors font-medium whitespace-nowrap">
          {ar ? 'العملاء' : 'Leads & Submissions'}
        </Link>
        <Link href="/customer-voice" className="px-3 py-1.5 rounded-t-md text-muted-foreground hover:text-primary transition-colors font-medium whitespace-nowrap">
          {ar ? 'آراء العملاء' : 'Customer Voice'}
        </Link>
        <Link href="/admin/integrations" className="px-3 py-1.5 rounded-t-md text-muted-foreground hover:text-primary transition-colors font-medium whitespace-nowrap">
          {ar ? 'مركز التكاملات' : 'Integration Hub'}
        </Link>
        <Link href="/admin/automations" className="px-3 py-1.5 rounded-t-md text-muted-foreground hover:text-primary transition-colors font-medium whitespace-nowrap">
          {ar ? 'مركز الأتمتة' : 'Automation Hub'}
        </Link>
        <span className="px-3 py-1.5 rounded-t-md bg-primary text-white font-semibold whitespace-nowrap">
          {ar ? 'أثر المنصة' : 'Platform Impact'}
        </span>
      </nav>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
          {error === 'unauthorized' && (ar ? 'يلزم تسجيل الدخول.' : 'Authentication required.')}
          {error === 'forbidden' && (ar ? 'هذه الصفحة مخصّصة للمسؤول فقط.' : 'This page is admin-only.')}
          {error === 'failed' && (ar ? 'تعذّر تحميل البيانات.' : 'Failed to load platform impact data.')}
        </div>
      )}

      {!data && !error && (
        <div className="min-h-[30vh] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {data && (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              icon={<FileText className="w-5 h-5" />}
              label={ar ? 'التشخيصات المُنجزة' : 'Diagnostics Run'}
              value={data.metrics.diagnosticsRun}
            />
            <MetricCard
              icon={<ClipboardList className="w-5 h-5" />}
              label={ar ? 'تقييمات النضج المكتملة' : 'Assessments Completed'}
              value={data.metrics.assessmentsCompleted}
            />
            <MetricCard
              icon={<ListChecks className="w-5 h-5" />}
              label={ar ? 'الإجراءات المتتبَّعة' : 'Actions Tracked'}
              value={data.metrics.actionsTracked}
              sub={Object.entries(data.metrics.actionsByStatus)
                .map(([k, v]) => `${k}: ${v}`)
                .join(' · ') || undefined}
            />
            <MetricCard
              icon={<TrendingDown className="w-5 h-5" />}
              label={ar ? 'الفجوات المُحدَّدة' : 'Gaps Identified'}
              value={data.metrics.gapsIdentified}
              sub={ar
                ? `${data.metrics.assessedUsersWithAtLeastOneGap} من ${data.metrics.distinctUsersAssessed} عميلاً لديه فجوة واحدة على الأقل`
                : `${data.metrics.assessedUsersWithAtLeastOneGap} of ${data.metrics.distinctUsersAssessed} assessed clients have at least one`}
            />
            <MetricCard
              icon={<Building2 className="w-5 h-5" />}
              label={ar ? 'المؤسسات المرتبطة' : 'Organizations Engaged'}
              value={data.metrics.organizationsEngaged}
            />
            <MetricCard
              icon={<Users className="w-5 h-5" />}
              label={ar ? 'إجمالي المستخدمين' : 'Total Users'}
              value={data.metrics.totalUsers}
            />
          </div>

          {/* Benchmark Cohort Progress (#398 addendum, 30 Aug 2026): real,
              operational visibility into how close each (industry,
              companySize) cohort is to crossing MIN_COHORT_SIZE and going
              live for real -- turns "wait for real clients" into a visible,
              trackable countdown, and points outreach at the fastest real
              path instead of a generic wishlist. Counts organizations only,
              never scores -- safe to show even for cohorts below the floor. */}
          <div className="rounded-xl border border-border p-5 space-y-3" data-testid="section-benchmark-cohort-progress">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-primary">
                {ar ? 'تقدّم معيار المقارنة الحقيقي' : 'Real Benchmark Cohort Progress'}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              {ar
                ? `يحتاج كل قطاع/حجم شركة إلى ${data.benchmarkCohortProgress.minCohortSize} مؤسسات مساهمة مختلفة قبل أن يصبح المعيار حقيقيًا (غير تجريبي). فيما يلي أقرب القطاعات إلى ذلك.`
                : `Each industry/company-size cell needs ${data.benchmarkCohortProgress.minCohortSize} distinct contributing organizations before it goes live for real (not demo mode). Closest cohorts to unlocking shown first.`}
            </p>
            {data.benchmarkCohortProgress.closestToLive.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                {ar ? 'لا توجد بيانات تقييم بعد.' : 'No assessment data yet.'}
              </p>
            ) : (
              <div className="space-y-2">
                {data.benchmarkCohortProgress.closestToLive.map(cohort => (
                  <div
                    key={`${cohort.industry}::${cohort.companySize}`}
                    data-testid={`row-cohort-${cohort.industry}-${cohort.companySize}`.replace(/\s+/g, '-').toLowerCase()}
                    className="flex items-center justify-between gap-3 text-xs bg-muted/30 rounded-lg px-3 py-2"
                  >
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <Target className="w-3.5 h-3.5 text-muted-foreground" />
                      {cohort.industry} · {cohort.companySize}
                    </span>
                    <span className="font-bold text-primary whitespace-nowrap">
                      {cohort.contributingOrganizations} / {data.benchmarkCohortProgress.minCohortSize}
                      {' '}
                      {ar ? `(يلزم ${cohort.needed} أخرى)` : `(${cohort.needed} more needed)`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Definitions / honesty panel -- every number above is explained,
              not just displayed, per this platform's anti-fabrication
              discipline. */}
          <div className="rounded-xl border border-border p-5 space-y-3 bg-muted/30">
            <h2 className="text-sm font-bold text-primary">{ar ? 'كيف تُحسب هذه الأرقام' : 'How these numbers are computed'}</h2>
            {Object.entries(data.definitions).map(([key, text]) => (
              <p key={key} className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">{key}: </span>{text}
              </p>
            ))}
            <p className="text-xs text-muted-foreground pt-1">
              {ar
                ? `آخر تحديث: ${new Date(data.generatedAt).toLocaleString()}`
                : `Last generated: ${new Date(data.generatedAt).toLocaleString()}`}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-xl border border-border p-4 space-y-1.5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-extrabold text-primary" data-testid={`text-metric-${label.replace(/\s+/g, '-').toLowerCase()}`}>
        {value.toLocaleString()}
      </div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
