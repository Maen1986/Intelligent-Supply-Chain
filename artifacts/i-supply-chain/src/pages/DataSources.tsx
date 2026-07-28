/**
 * DataSources.tsx
 *
 * Bilingual (EN/AR) public page documenting ISC's KPI benchmark methodology,
 * primary data sources, update cadence, and a structured revision changelog.
 * Admins see before/after values in the changelog; clients see the change
 * description but not the raw numbers.
 */

import { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth }     from '@/lib/AuthContext';
import { Badge }       from '@/components/ui/badge';
import { Button }      from '@/components/ui/button';
import {
  Database, BookOpen, RefreshCw, ChevronDown, ChevronUp,
  ShieldCheck, BarChart3, Calendar, Building2, ArrowRight,
  TrendingUp, Globe, FlaskConical, Search, Award,
} from 'lucide-react';
import { BENCHMARK_CHANGELOG } from '@/lib/benchmarkChangelog';
import type { ChangelogRelease } from '@/lib/benchmarkChangelog';

/* ── helpers ─────────────────────────────────────────────────────────────── */

const formatDate = (iso: string, ar: boolean) =>
  new Date(iso).toLocaleDateString(ar ? 'ar-SA' : 'en-GB', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

const FIELD_LABELS = {
  benchmark: { en: 'Benchmark', ar: 'مؤشر مرجعي' },
  target:    { en: 'Target',    ar: 'هدف' },
  weight:    { en: 'Weight',    ar: 'وزن' },
} as const;

const FIELD_COLORS = {
  benchmark: 'bg-blue-50 text-blue-700 border-blue-200',
  target:    'bg-amber-50 text-amber-700 border-amber-200',
  weight:    'bg-violet-50 text-violet-700 border-violet-200',
} as const;

/* ── source catalogue ────────────────────────────────────────────────────── */

type Source = {
  name: string;
  nameAr: string;
  org: string;
  orgAr: string;
  year: string;
  kpis: string;
  kpisAr: string;
  url?: string;
  icon: React.ElementType;
};

const SOURCES: Source[] = [
  {
    name:    'Supply Chain Top 25',
    nameAr:  'أفضل 25 سلسلة توريد',
    org:     'Gartner',
    orgAr:   'Gartner',
    year:    '2024',
    kpis:    'Inventory, C2C, OTIF, Perfect Order, Forecast Accuracy',
    kpisAr:  'المخزون، C2C، OTIF، الطلب المثالي، دقة التوقع',
    url:     'https://www.gartner.com/en/supply-chain/research/supply-chain-top-25',
    icon:    BarChart3,
  },
  {
    name:    'World-Class Procurement Performance Study',
    nameAr:  'دراسة الأداء العالمي في المشتريات',
    org:     'Hackett Group',
    orgAr:   'Hackett Group',
    year:    '2024',
    kpis:    'Automation, STP, Savings, P2P Cycle Time',
    kpisAr:  'الأتمتة، STP، الوفورات، دورة P2P',
    url:     'https://www.thehackettgroup.com/research/procurement/',
    icon:    TrendingUp,
  },
  {
    name:    'SCOR v12 Benchmarking Study',
    nameAr:  'دراسة معايير SCOR الإصدار 12',
    org:     'APICS / ASCM',
    orgAr:   'APICS / ASCM',
    year:    '2024',
    kpis:    'Cross-industry supply chain norms, resilience metrics',
    kpisAr:  'معايير سلاسل التوريد عبر الصناعات، مؤشرات المرونة',
    url:     'https://www.ascm.org/ascm-insights/scor/',
    icon:    Globe,
  },
  {
    name:    'Annual Benchmarking Report',
    nameAr:  'تقرير المعايير السنوي',
    org:     'CIPS',
    orgAr:   'CIPS',
    year:    '2024',
    kpis:    'Savings, Compliance, Supplier Scorecard Weights',
    kpisAr:  'الوفورات، الامتثال، أوزان بطاقة الأداء',
    url:     'https://www.cips.org/intelligence/benchmarking/',
    icon:    Award,
  },
  {
    name:    'Annual Survey on Contracting',
    nameAr:  'المسح السنوي للتعاقد',
    org:     'World Commerce & Contracting (IACCM)',
    orgAr:   'World Commerce & Contracting (IACCM)',
    year:    '2024',
    kpis:    'Time-to-Contract across industries',
    kpisAr:  'الوقت حتى التعاقد عبر الصناعات',
    url:     'https://www.worldcc.com/research',
    icon:    BookOpen,
  },
  {
    name:    'GCC Supply Chain Survey',
    nameAr:  'مسح سلسلة التوريد الخليجي',
    org:     'McKinsey & Company',
    orgAr:   'McKinsey & Company',
    year:    '2024',
    kpis:    'Digitisation, Resilience (MTTR), ERP Utilisation',
    kpisAr:  'الرقمنة، المرونة (MTTR)، استخدام ERP',
    icon:    Search,
  },
  {
    name:    'IKTVA Progress Report',
    nameAr:  'تقرير تقدم برنامج إكتفاء',
    org:     'Saudi Aramco',
    orgAr:   'أرامكو السعودية',
    year:    '2023',
    kpis:    'Local Content (GCC O&G and Government)',
    kpisAr:  'المحتوى المحلي (النفط والغاز الخليجي والقطاع الحكومي)',
    url:     'https://www.aramco.com/en/creating-value/iktva',
    icon:    Building2,
  },
  {
    name:    'Logistics Performance Index',
    nameAr:  'مؤشر أداء الخدمات اللوجستية',
    org:     'World Bank',
    orgAr:   'البنك الدولي',
    year:    '2023',
    kpis:    'Logistics delivery norms, OTIF',
    kpisAr:  'معايير التسليم اللوجستي، OTIF',
    url:     'https://lpi.worldbank.org/',
    icon:    Globe,
  },
  {
    name:    'Report on Business',
    nameAr:  'تقرير الأعمال',
    org:     'ISM (Institute for Supply Management)',
    orgAr:   'معهد إدارة التوريد (ISM)',
    year:    '2024',
    kpis:    'Quality / FTR rates, Defect PPM',
    kpisAr:  'معدلات الجودة / معدل النجاح في أول مرة، معدل العيوب PPM',
    url:     'https://www.ismworld.org/supply-management-news-and-reports/reports/ism-report-on-business/',
    icon:    FlaskConical,
  },
  {
    name:    'Proprietary GCC Practitioner Data',
    nameAr:  'بيانات الممارسين الخليجيين الخاصة بـ ISC',
    org:     'I Supply Chain (ISC)',
    orgAr:   'آي سبلاي تشين (ISC)',
    year:    '2022–2025',
    kpis:    'GCC-specific calibrations across all 24 KPIs',
    kpisAr:  'معايرة خاصة بدول الخليج عبر جميع مؤشرات الأداء الـ 24',
    icon:    ShieldCheck,
  },
];

/* ── release card ─────────────────────────────────────────────────────────── */

function ReleaseCard({
  release,
  ar,
  isAdmin,
  defaultOpen,
}: {
  release: ChangelogRelease;
  ar: boolean;
  isAdmin: boolean;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card">
      {/* header */}
      <button
        className="w-full flex items-center justify-between gap-4 px-6 py-5 hover:bg-muted/40 transition-colors text-start"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <RefreshCw className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-base">
                {ar ? release.titleAr : release.titleEn}
              </span>
              <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-mono font-medium">
                v{release.version}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              <Calendar className="w-3.5 h-3.5 inline-block me-1 -mt-0.5" />
              {formatDate(release.date, ar)}
              {release.changes.length > 0 && (
                <> · {release.changes.length} {ar ? 'تغيير' : 'changes'}</>
              )}
            </p>
          </div>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" /> : <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-border px-6 py-5 space-y-5">
          {/* summary */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {ar ? release.summaryAr : release.summaryEn}
          </p>

          {/* change table */}
          {release.changes.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 text-start font-semibold">{ar ? 'المؤشر' : 'KPI / Item'}</th>
                    <th className="px-4 py-3 text-start font-semibold">{ar ? 'القطاع' : 'Industry'}</th>
                    <th className="px-4 py-3 text-start font-semibold">{ar ? 'النوع' : 'Type'}</th>
                    {isAdmin && (
                      <>
                        <th className="px-4 py-3 text-start font-semibold text-red-600">{ar ? 'القيمة السابقة' : 'Old'}</th>
                        <th className="px-4 py-3 text-start font-semibold text-green-600">{ar ? 'القيمة الجديدة' : 'New'}</th>
                      </>
                    )}
                    <th className="px-4 py-3 text-start font-semibold">{ar ? 'السبب' : 'Rationale'}</th>
                    <th className="px-4 py-3 text-start font-semibold">{ar ? 'المصدر' : 'Source'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {release.changes.map((c, i) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium max-w-[200px]">
                        {ar ? c.itemAr : c.item}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {ar ? c.industryAr : c.industry}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${FIELD_COLORS[c.field]}`}>
                          {FIELD_LABELS[c.field][ar ? 'ar' : 'en']}
                        </span>
                      </td>
                      {isAdmin && (
                        <>
                          <td className="px-4 py-3 font-mono text-red-500 whitespace-nowrap line-through text-xs">
                            {c.oldValue}
                          </td>
                          <td className="px-4 py-3 font-mono text-green-600 whitespace-nowrap font-bold text-xs">
                            {c.newValue}
                          </td>
                        </>
                      )}
                      <td className="px-4 py-3 text-muted-foreground text-xs leading-relaxed max-w-[280px]">
                        {ar ? c.rationaleAr : c.rationale}
                      </td>
                      <td className="px-4 py-3 text-xs text-primary font-medium whitespace-nowrap max-w-[180px]">
                        {c.source}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── page ─────────────────────────────────────────────────────────────────── */

export function DataSources() {
  const { lang }  = useLanguage();
  const { user }  = useAuth();
  const ar        = lang === 'ar';
  const isAdmin   = user?.role === 'admin';

  return (
    <main className="min-h-screen bg-background pt-24 pb-20" dir={ar ? 'rtl' : 'ltr'}>
      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-[#082C6B] via-[#0B3D91] to-[#1a4fa8] text-white py-16 px-4 mb-14">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 border border-white/20 mb-5">
            <Database className="w-7 h-7" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight">
            {ar ? 'مصادر البيانات والمنهجية' : 'Data Sources & Methodology'}
          </h1>
          <p className="text-white/80 text-lg leading-relaxed max-w-2xl mx-auto">
            {ar
              ? 'توثيق شامل لمصادر بيانات مؤشرات الأداء المعتمدة في منصة ISC، ومنهجية التقييم، وسجل مراجعات الأرقام المرجعية.'
              : 'Full documentation of the authoritative data sources, scoring methodology, and benchmark revision history behind the ISC KPI platform.'}
          </p>
          <div className="mt-6 inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-sm border border-white/20">
            <RefreshCw className="w-4 h-4" />
            {ar
              ? 'آخر مراجعة: يوليو 2025 — دورة تدقيق سنوية'
              : 'Last audited: July 2025 — Annual review cycle'}
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-5xl px-4 space-y-16">

        {/* ── Methodology ── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-primary shrink-0" />
            <h2 className="text-2xl font-bold">
              {ar ? 'منهجية التقييم' : 'Scoring Methodology'}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                {ar ? 'صيغة الدرجة' : 'Score Formula'}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {ar
                  ? 'تستخدم المنصة نموذج النسب الصناعية السباعي. يُحسب المؤشر بصيغة مختلفة حسب اتجاه الأداء المرغوب (أعلى يعني أفضل / أقل يعني أفضل):'
                  : 'The platform uses a 7-tier industry-percentile model. The formula differs by KPI direction:'}
              </p>
              <div className="space-y-1.5" dir="ltr">
                <div className="bg-muted rounded-xl px-4 py-2.5 text-xs font-mono">
                  <span className="text-muted-foreground">{'/* higher-is-better (e.g. forecast accuracy, savings) */'}</span><br />
                  score = 50 + 50 × (value − benchmark) / |target − benchmark|
                </div>
                <div className="bg-muted rounded-xl px-4 py-2.5 text-xs font-mono">
                  <span className="text-muted-foreground">{'/* lower-is-better (e.g. PO cycle time, MTTR) */'}</span><br />
                  score = 50 + 50 × (benchmark − value) / |target − benchmark|
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {ar
                  ? 'الدرجة 50 = المتوسط الصناعي؛ الدرجة 100 = الهدف العالمي؛ تُقيَّد النتيجة بين 0 و100.'
                  : 'Score 50 = industry median; Score 100 = world-class target; result is clamped to [0, 100].'}
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                {ar ? 'درجات الأداء السبع' : '7 Performance Tiers'}
              </h3>
              <div className="space-y-1.5 text-xs font-medium">
                {[
                  { range: '≥90',  label: ar ? 'أفضل 10% — رواد السوق'       : 'Top 10% — Market Leaders',      color: 'bg-amber-500' },
                  { range: '75–89', label: ar ? 'أفضل 25% — الربع الأعلى'    : 'Top 25%',                        color: 'bg-emerald-600' },
                  { range: '55–74', label: ar ? 'النصف الأعلى — فوق المتوسط' : 'Top 50% — Above Average',        color: 'bg-green-500' },
                  { range: '40–54', label: ar ? 'المعيار الصناعي'             : 'Industry Benchmark',             color: 'bg-blue-500' },
                  { range: '25–39', label: ar ? 'النصف الأدنى — دون المتوسط' : 'Bottom 50% — Below Average',     color: 'bg-amber-400' },
                  { range: '10–24', label: ar ? 'الربع الأدنى — بعيد جداً'   : 'Bottom 25% — Far Below',         color: 'bg-red-500' },
                  { range: '<10',   label: ar ? 'أدنى 10% — وضع حرج'         : 'Bottom 10% — Critical',          color: 'bg-red-700' },
                ].map(t => (
                  <div key={t.range} className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-sm shrink-0 ${t.color}`} />
                    <span className="text-muted-foreground font-mono w-12">{t.range}</span>
                    <span>{t.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-3 md:col-span-2">
              <h3 className="font-bold text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                {ar ? 'نطاق البيانات والتحديث' : 'Data Scope & Update Cadence'}
              </h3>
              <div className="grid sm:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div>
                  <p className="font-semibold text-foreground mb-1">{ar ? 'التغطية الجغرافية' : 'Geographic Scope'}</p>
                  <p>{ar ? 'دول مجلس التعاون الخليجي (السعودية، الإمارات، الكويت، قطر، البحرين، عُمان) مع معايرة خاصة لكل قطاع' : 'Gulf Cooperation Council (KSA, UAE, Kuwait, Qatar, Bahrain, Oman) with sector-specific calibrations'}</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">{ar ? 'القطاعات المشمولة' : 'Industries Covered'}</p>
                  <p>{ar ? '8 قطاعات: التجزئة/السلع الاستهلاكية، التصنيع، الرعاية الصحية، النفط والغاز، الحكومة، اللوجستيات، الغذاء والمشروبات، البناء' : '8 industries: Retail/FMCG, Manufacturing, Healthcare/Pharma, Oil & Gas, Government, Logistics, Food & Beverage, Construction'}</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">{ar ? 'دورة المراجعة' : 'Review Cadence'}</p>
                  <p>{ar ? 'تدقيق سنوي مقابل تقارير الصناعة الأولية. تُراجَع الأرقام ذات التغيير المادي (>5%) في الوقت المناسب.' : 'Annual audit against primary industry reports. Values with material change (>5%) are reviewed on a rolling basis.'}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Primary Sources ── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-6 h-6 text-primary shrink-0" />
            <h2 className="text-2xl font-bold">
              {ar ? 'المصادر الأولية' : 'Primary Sources'}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {SOURCES.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.name}
                  className="bg-card border border-border rounded-2xl p-5 flex gap-4 hover:border-primary/40 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm leading-tight">
                      {ar ? s.nameAr : s.name}
                    </p>
                    <p className="text-xs text-primary font-medium mt-0.5">
                      {ar ? s.orgAr : s.org}
                      <span className="text-muted-foreground font-normal"> · {s.year}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                      {ar ? s.kpisAr : s.kpis}
                    </p>
                    {s.url && (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                      >
                        {ar ? 'زيارة المصدر' : 'Visit source'}
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Changelog ── */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <RefreshCw className="w-6 h-6 text-primary shrink-0" />
            <h2 className="text-2xl font-bold">
              {ar ? 'سجل مراجعات البيانات' : 'Data Revision Log'}
            </h2>
          </div>
          {isAdmin && (
            <div className="mb-6 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-sm text-amber-800">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              {ar
                ? 'أنت تعرض طريقة العرض الإدارية — القيم السابقة والجديدة مرئية.'
                : 'You are viewing the admin view — before/after values are visible.'}
            </div>
          )}

          <div className="space-y-4">
            {BENCHMARK_CHANGELOG.map((release, i) => (
              <ReleaseCard
                key={release.version}
                release={release}
                ar={ar}
                isAdmin={isAdmin}
                defaultOpen={i === 0}
              />
            ))}
          </div>
        </section>

        {/* ── Disclaimer ── */}
        <section className="bg-muted/40 border border-border rounded-2xl p-6 text-sm text-muted-foreground leading-relaxed">
          <p className="font-semibold text-foreground mb-2">
            {ar ? 'إخلاء المسؤولية' : 'Disclaimer'}
          </p>
          <p>
            {ar
              ? 'تعكس المؤشرات المرجعية المذكورة في هذه الصفحة متوسطات قطاعية مجمّعة من مصادر بحثية عامة وبيانات ممارسين خاصة. لا تمثّل هذه الأرقام ضمانات لأداء أي منظمة بعينها. يتحمل المستخدم مسؤولية التحقق من ملاءمة هذه المؤشرات لسياقه الخاص. جميع مؤشرات الأداء وأدوات التقييم ملكية فكرية حصرية لـ ISC.'
              : 'Benchmarks on this page reflect sector-level aggregates compiled from public research and proprietary practitioner data. They are not guarantees of performance for any individual organisation. Users are responsible for validating applicability to their specific context. All KPI frameworks and assessment tools are exclusive intellectual property of ISC.'}
          </p>
        </section>

      </div>
    </main>
  );
}
