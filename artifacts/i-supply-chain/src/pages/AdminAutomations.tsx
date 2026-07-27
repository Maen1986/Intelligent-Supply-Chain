/**
 * AdminAutomations — Automation Hub
 * Route: /admin/automations
 *
 * Tabs:
 *   1. Overview     — live status cards per automation type
 *   2. Webhook Log  — outbound delivery log
 *   3. Inbound Log  — inbound webhook log
 *   4. Schedule Log — cron job run history + manual trigger
 *   5. KPI Alerts   — kpi.threshold_breach events
 *   6. Event Catalog — read-only ISC_EVENTS reference
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  RefreshCw, Loader2, ShieldAlert, Activity, BookOpen,
  Webhook, Calendar, Bell, ArrowLeft, Play, Copy, Check,
  ChevronDown, ChevronUp, Download, AlertTriangle, CheckCircle2,
  Clock, Zap, Server, Radio,
} from 'lucide-react';
import { API_BASE } from '@/lib/apiBase';

/* ─── types ──────────────────────────────────────────────────────────────── */

interface OverviewData {
  webhooks: {
    configCount: number;
    totalDeliveries: number;
    successful: number;
    failed: number;
    lastDeliveryAt: string | null;
    successRate: number | null;
  };
  inbound: {
    total: number;
    successful: number;
    failed: number;
    lastReceivedAt: string | null;
  };
  schedule: Record<string, { ranAt: string | null; usersProcessed: number; errors: string | null }>;
  kpiAlerts: { totalBreaches: number };
}

interface DeliveryLogRow {
  id: number;
  event: string;
  url: string;
  status_code: number | null;
  success: string;
  response_snippet: string | null;
  attempted_at: string;
  attempts: number;
  payload: unknown;
  user_id: number;
}

interface InboundLogRow {
  id: number;
  action: string;
  bodySnippet: string | null;
  status: string;
  error: string | null;
  receivedAt: string;
}

interface ScheduleLogRow {
  id: number;
  jobName: string;
  ranAt: string;
  usersProcessed: number;
  errors: string | null;
}

interface KpiAlertRow {
  id: number;
  kpi_id: string | null;
  kpi_label: string | null;
  severity: string | null;
  value: string | null;
  warn_threshold: string | null;
  critical_threshold: string | null;
  attempted_at: string;
  user_id: number;
}

/* ─── utility ───────────────────────────────────────────────────────────── */

function fmtDate(iso: string | null, ar: boolean) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(ar ? 'ar' : 'en-GB', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtRelative(iso: string | null): string {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function successRateColor(rate: number | null): string {
  if (rate === null) return 'text-muted-foreground';
  if (rate >= 95) return 'text-emerald-600';
  if (rate >= 80) return 'text-amber-600';
  return 'text-red-600';
}

function StatusBadge({ success }: { success: string }) {
  if (success === 'ok') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
      <CheckCircle2 className="w-3 h-3" /> OK
    </span>
  );
  if (success === 'error') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
      <AlertTriangle className="w-3 h-3" /> Error
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
      <Clock className="w-3 h-3" /> Pending
    </span>
  );
}

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); }}
      className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
      title="Copy"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

function ExpandableRow({ payload }: { payload: unknown }) {
  const [open, setOpen] = useState(false);
  if (!payload) return null;
  const json = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-0.5"
      >
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {open ? 'Hide payload' : 'Show payload'}
      </button>
      {open && (
        <pre className="mt-1 text-xs bg-slate-50 border border-border rounded p-2 overflow-x-auto max-h-48 whitespace-pre-wrap break-all">
          {json}
        </pre>
      )}
    </div>
  );
}

function exportCsv(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const rows = [keys.join(','), ...data.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(','))];
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════════════════════════════ */

type Tab = 'overview' | 'webhook-log' | 'inbound-log' | 'schedule-log' | 'kpi-alerts' | 'event-catalog';

const TABS: { id: Tab; en: string; ar: string; icon: React.ElementType }[] = [
  { id: 'overview',      en: 'Overview',      ar: 'نظرة عامة',        icon: Activity     },
  { id: 'webhook-log',   en: 'Webhook Log',   ar: 'سجل الويب-هوك',    icon: Webhook      },
  { id: 'inbound-log',   en: 'Inbound Log',   ar: 'السجل الوارد',     icon: Radio        },
  { id: 'schedule-log',  en: 'Schedule Log',  ar: 'سجل المهام',       icon: Calendar     },
  { id: 'kpi-alerts',    en: 'KPI Alerts',    ar: 'تنبيهات KPI',      icon: Bell         },
  { id: 'event-catalog', en: 'Event Catalog', ar: 'كتالوج الأحداث',   icon: BookOpen     },
];

export function AdminAutomations() {
  const { user, loading: authLoading } = useAuth();
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const isAdmin = user?.role === 'admin';

  const [tab, setTab] = useState<Tab>('overview');
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Auto-refresh every 60s
  useEffect(() => {
    const id = setInterval(() => setLastRefresh(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (authLoading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (!isAdmin) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
      <ShieldAlert className="w-12 h-12 text-red-400" />
      <p className="text-lg font-bold text-primary">{ar ? 'يجب تسجيل الدخول كمسؤول' : 'Admin access required'}</p>
      <Link href="/admin/leads" className="text-sm text-primary underline">
        {ar ? '← العودة إلى الإدارة' : '← Back to Admin'}
      </Link>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6" dir={ar ? 'rtl' : 'ltr'}>

      {/* Page header */}
      <div className="flex items-center gap-4 flex-wrap">
        <Link href="/admin/leads" className="text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Zap className="w-6 h-6" />
            {ar ? 'مركز الأتمتة' : 'Automation Hub'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {ar ? 'مراقبة ومراجعة جميع الأتمتة في المنصة' : 'Monitor and govern every automation flow on the platform'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setLastRefresh(Date.now())}>
          <RefreshCw className="w-4 h-4 me-2" />
          {ar ? 'تحديث' : 'Refresh'}
        </Button>
      </div>

      {/* Admin nav */}
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
        <span className="px-3 py-1.5 rounded-t-md bg-primary text-white font-semibold whitespace-nowrap">
          {ar ? 'مركز الأتمتة' : 'Automation Hub'}
        </span>
      </nav>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap border-b border-border pb-0">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-primary hover:border-primary/40'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {ar ? t.ar : t.en}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="pt-2">
        {tab === 'overview'      && <OverviewTab      ar={ar} refresh={lastRefresh} />}
        {tab === 'webhook-log'   && <WebhookLogTab    ar={ar} refresh={lastRefresh} />}
        {tab === 'inbound-log'   && <InboundLogTab    ar={ar} refresh={lastRefresh} />}
        {tab === 'schedule-log'  && <ScheduleLogTab   ar={ar} refresh={lastRefresh} />}
        {tab === 'kpi-alerts'    && <KpiAlertsTab     ar={ar} refresh={lastRefresh} />}
        {tab === 'event-catalog' && <EventCatalogTab  ar={ar} />}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TAB 1 — Overview
   ════════════════════════════════════════════════════════════════════════════ */

function OverviewTab({ ar, refresh }: { ar: boolean; refresh: number }) {
  const [data, setData]     = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/admin/automations/overview`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.ok) setData(d); else setError(d.error ?? 'Failed'); })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, [refresh]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  if (error)   return <p className="text-sm text-red-600 py-4">{error}</p>;
  if (!data)   return null;

  const JOBS = [
    { key: 'weekly_kpi_digest',  en: 'Weekly KPI Digest',      ar: 'ملخص KPI الأسبوعي',      schedule: 'Mon 08:00 UTC'  },
    { key: 'monthly_scorecard',  en: 'Monthly Scorecard',      ar: 'التقرير الشهري',           schedule: '1st 08:00 UTC'  },
    { key: 'lead_followup',      en: 'Lead Follow-up',         ar: 'متابعة العملاء',           schedule: 'Daily 09:00 UTC' },
    { key: 'stale_data_nudge',   en: 'Stale Data Nudge',       ar: 'تذكير البيانات القديمة',   schedule: 'Daily 09:30 UTC' },
  ];

  return (
    <div className="space-y-6">
      {/* Row 1: Webhooks + Inbound */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Outbound webhooks card */}
        <div className="border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Webhook className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-sm">{ar ? 'الويب-هوك الصادرة' : 'Outbound Webhooks'}</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <StatItem label={ar ? 'الإعدادات النشطة' : 'Active configs'} value={String(data.webhooks.configCount)} />
            <StatItem label={ar ? 'التسليمات (30 يوم)' : 'Deliveries (30d)'} value={String(data.webhooks.totalDeliveries)} />
            <StatItem
              label={ar ? 'معدل النجاح' : 'Success rate'}
              value={data.webhooks.successRate !== null ? `${data.webhooks.successRate}%` : '—'}
              className={successRateColor(data.webhooks.successRate)}
            />
            <StatItem label={ar ? 'آخر تسليم' : 'Last delivery'} value={fmtRelative(data.webhooks.lastDeliveryAt)} />
          </div>
          {data.webhooks.failed > 0 && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {data.webhooks.failed} {ar ? 'تسليم فشل' : 'failed deliveries'}
            </p>
          )}
        </div>

        {/* Inbound webhooks card */}
        <div className="border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-sm">{ar ? 'الويب-هوك الواردة' : 'Inbound Webhooks'}</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <StatItem label={ar ? 'الطلبات (30 يوم)' : 'Requests (30d)'} value={String(data.inbound.total)} />
            <StatItem label={ar ? 'ناجح' : 'Successful'} value={String(data.inbound.successful)} className="text-emerald-600" />
            <StatItem label={ar ? 'فشل' : 'Failed'} value={String(data.inbound.failed)} className={data.inbound.failed > 0 ? 'text-red-600' : undefined} />
            <StatItem label={ar ? 'آخر استلام' : 'Last received'} value={fmtRelative(data.inbound.lastReceivedAt)} />
          </div>
        </div>
      </div>

      {/* Row 2: KPI Alerts */}
      <div className="border border-border rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-sm">{ar ? 'تنبيهات KPI (30 يوم)' : 'KPI Alerts (last 30 days)'}</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-3xl font-extrabold ${data.kpiAlerts.totalBreaches > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {data.kpiAlerts.totalBreaches}
          </span>
          <span className="text-sm text-muted-foreground">
            {ar ? 'خرق للحدود' : data.kpiAlerts.totalBreaches === 1 ? 'threshold breach' : 'threshold breaches'}
          </span>
        </div>
      </div>

      {/* Row 3: Scheduled Jobs */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-widest">
          {ar ? 'المهام المجدولة' : 'Scheduled Jobs'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {JOBS.map(j => {
            const s = data.schedule[j.key];
            const hasError = !!s?.errors;
            return (
              <div key={j.key} className={`border rounded-xl p-4 space-y-2 ${hasError ? 'border-amber-300 bg-amber-50' : 'border-border'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{ar ? j.ar : j.en}</p>
                    <p className="text-xs text-muted-foreground">{j.schedule}</p>
                  </div>
                  {hasError && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
                </div>
                <div className="text-xs space-y-1">
                  <p className="text-muted-foreground">
                    {ar ? 'آخر تشغيل:' : 'Last run:'}{' '}
                    <span className="text-foreground font-medium">{s?.ranAt ? fmtDate(s.ranAt, ar) : '—'}</span>
                  </p>
                  <p className="text-muted-foreground">
                    {ar ? 'المستخدمون:' : 'Users processed:'}{' '}
                    <span className="text-foreground font-medium">{s?.usersProcessed ?? 0}</span>
                  </p>
                  {hasError && (
                    <p className="text-amber-700 text-xs truncate" title={s.errors ?? ''}>
                      {ar ? 'خطأ:' : 'Error:'} {s.errors}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-bold text-base ${className ?? ''}`}>{value}</p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TAB 2 — Webhook Delivery Log
   ════════════════════════════════════════════════════════════════════════════ */

function WebhookLogTab({ ar, refresh }: { ar: boolean; refresh: number }) {
  const [rows, setRows]     = useState<DeliveryLogRow[]>([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage]     = useState(0);
  const [eventFilter, setEventFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const PAGE = 50;

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(PAGE), offset: String(page * PAGE) });
    if (eventFilter.trim())  params.set('event', eventFilter.trim());
    if (statusFilter) params.set('status', statusFilter);
    fetch(`${API_BASE}/admin/automations/webhook-log?${params}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.ok) { setRows(d.logs); setTotal(d.total); } })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, eventFilter, statusFilter]);

  useEffect(() => { load(); }, [load, refresh]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          className="w-48 h-8 text-xs"
          placeholder={ar ? 'تصفية حسب الحدث…' : 'Filter by event…'}
          value={eventFilter}
          onChange={e => { setEventFilter(e.target.value); setPage(0); }}
        />
        <select
          className="h-8 text-xs border border-border rounded-md px-2 bg-white"
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
        >
          <option value="">{ar ? 'كل الحالات' : 'All statuses'}</option>
          <option value="ok">OK</option>
          <option value="error">Error</option>
          <option value="pending">Pending</option>
        </select>
        <span className="text-xs text-muted-foreground ms-auto">{total} {ar ? 'سجل' : 'records'}</span>
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => exportCsv(rows as unknown as Record<string, unknown>[], 'webhook-log.csv')}>
          <Download className="w-3 h-3 me-1" /> {ar ? 'تصدير' : 'Export CSV'}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">{ar ? 'لا توجد سجلات.' : 'No records found.'}</p>
      ) : (
        <div className="border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-xs min-w-[640px]">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="py-2 px-3 text-start font-bold text-muted-foreground">{ar ? 'الحدث' : 'Event'}</th>
                <th className="py-2 px-3 text-start font-bold text-muted-foreground">URL</th>
                <th className="py-2 px-3 text-start font-bold text-muted-foreground">{ar ? 'الوقت' : 'Time'}</th>
                <th className="py-2 px-3 text-start font-bold text-muted-foreground">HTTP</th>
                <th className="py-2 px-3 text-start font-bold text-muted-foreground">{ar ? 'الحالة' : 'Status'}</th>
                <th className="py-2 px-3 text-start font-bold text-muted-foreground">{ar ? 'المحاولات' : 'Attempts'}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b last:border-0 align-top">
                  <td className="py-2 px-3">
                    <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">{r.event}</code>
                    <ExpandableRow payload={r.payload} />
                  </td>
                  <td className="py-2 px-3 font-mono text-muted-foreground">{r.url}</td>
                  <td className="py-2 px-3 whitespace-nowrap text-muted-foreground">{fmtDate(r.attempted_at, ar)}</td>
                  <td className="py-2 px-3">{r.status_code ?? '—'}</td>
                  <td className="py-2 px-3"><StatusBadge success={r.success} /></td>
                  <td className="py-2 px-3 text-center">{r.attempts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > PAGE && (
        <div className="flex items-center gap-2 justify-center text-xs">
          <Button variant="outline" size="sm" className="h-7" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            {ar ? 'السابق' : 'Previous'}
          </Button>
          <span>{page + 1} / {Math.ceil(total / PAGE)}</span>
          <Button variant="outline" size="sm" className="h-7" disabled={(page + 1) * PAGE >= total} onClick={() => setPage(p => p + 1)}>
            {ar ? 'التالي' : 'Next'}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TAB 3 — Inbound Webhook Log
   ════════════════════════════════════════════════════════════════════════════ */

function InboundLogTab({ ar, refresh }: { ar: boolean; refresh: number }) {
  const [rows, setRows]     = useState<InboundLogRow[]>([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage]     = useState(0);
  const PAGE = 50;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(PAGE), offset: String(page * PAGE) });
    fetch(`${API_BASE}/admin/automations/inbound-log?${params}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.ok) { setRows(d.logs); setTotal(d.total); } })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, refresh]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{total} {ar ? 'سجل' : 'records total'}</p>
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => exportCsv(rows as unknown as Record<string, unknown>[], 'inbound-log.csv')}>
          <Download className="w-3 h-3 me-1" /> {ar ? 'تصدير' : 'Export CSV'}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">{ar ? 'لا توجد سجلات واردة.' : 'No inbound webhook calls recorded yet.'}</p>
      ) : (
        <div className="border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-xs min-w-[580px]">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="py-2 px-3 text-start font-bold text-muted-foreground">{ar ? 'الإجراء' : 'Action'}</th>
                <th className="py-2 px-3 text-start font-bold text-muted-foreground">{ar ? 'الوقت' : 'Time'}</th>
                <th className="py-2 px-3 text-start font-bold text-muted-foreground">{ar ? 'الحالة' : 'Status'}</th>
                <th className="py-2 px-3 text-start font-bold text-muted-foreground">{ar ? 'البيانات' : 'Snippet'}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b last:border-0 align-top">
                  <td className="py-2 px-3">
                    <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">{r.action}</code>
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap text-muted-foreground">{fmtDate(r.receivedAt, ar)}</td>
                  <td className="py-2 px-3"><StatusBadge success={r.status} /></td>
                  <td className="py-2 px-3">
                    {r.error && <p className="text-red-600 text-xs">{r.error}</p>}
                    {r.bodySnippet && (
                      <pre className="text-xs bg-slate-50 border border-border rounded p-1 max-w-xs overflow-x-auto whitespace-pre-wrap break-all">
                        {r.bodySnippet}
                      </pre>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > PAGE && (
        <div className="flex items-center gap-2 justify-center text-xs">
          <Button variant="outline" size="sm" className="h-7" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            {ar ? 'السابق' : 'Previous'}
          </Button>
          <span>{page + 1} / {Math.ceil(total / PAGE)}</span>
          <Button variant="outline" size="sm" className="h-7" disabled={(page + 1) * PAGE >= total} onClick={() => setPage(p => p + 1)}>
            {ar ? 'التالي' : 'Next'}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TAB 4 — Schedule Log + Run Now
   ════════════════════════════════════════════════════════════════════════════ */

const SCHEDULE_JOBS = [
  { key: 'weekly_kpi_digest', en: 'Weekly KPI Digest',    ar: 'ملخص KPI الأسبوعي'      },
  { key: 'monthly_scorecard', en: 'Monthly Scorecard',    ar: 'التقرير الشهري'           },
  { key: 'lead_followup',     en: 'Lead Follow-up',       ar: 'متابعة العملاء'           },
  { key: 'stale_data_nudge',  en: 'Stale Data Nudge',     ar: 'تذكير البيانات القديمة'   },
];

function ScheduleLogTab({ ar, refresh }: { ar: boolean; refresh: number }) {
  const [rows, setRows]     = useState<ScheduleLogRow[]>([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage]     = useState(0);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [triggerMsg, setTriggerMsg] = useState<{ job: string; msg: string; ok: boolean } | null>(null);
  const PAGE = 50;

  const loadRows = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(PAGE), offset: String(page * PAGE) });
    fetch(`${API_BASE}/admin/automations/schedule-log?${params}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.ok) { setRows(d.logs); setTotal(d.total); } })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { loadRows(); }, [loadRows, refresh]);

  const runNow = async (jobKey: string) => {
    setTriggering(jobKey);
    setTriggerMsg(null);
    try {
      const r = await fetch(`${API_BASE}/admin/automations/trigger/${jobKey}`, {
        method: 'POST', credentials: 'include',
      });
      const d = await r.json();
      setTriggerMsg({ job: jobKey, ok: d.ok, msg: d.ok ? (ar ? 'بدأت المهمة بنجاح' : 'Job started successfully') : (d.error ?? 'Failed') });
      if (d.ok) setTimeout(loadRows, 3000); // Reload logs after a short delay
    } catch {
      setTriggerMsg({ job: jobKey, ok: false, msg: ar ? 'تعذّر الاتصال' : 'Network error' });
    } finally {
      setTriggering(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Manual trigger cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SCHEDULE_JOBS.map(j => (
          <div key={j.key} className="border border-border rounded-xl p-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-sm">{ar ? j.ar : j.en}</p>
              <code className="text-xs text-muted-foreground">{j.key}</code>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs shrink-0"
              disabled={triggering === j.key}
              onClick={() => void runNow(j.key)}
            >
              {triggering === j.key
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <Play className="w-3 h-3 me-1" />}
              {ar ? 'تشغيل الآن' : 'Run Now'}
            </Button>
          </div>
        ))}
      </div>

      {triggerMsg && (
        <div className={`text-xs px-4 py-2.5 rounded-lg border ${triggerMsg.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {triggerMsg.msg}
        </div>
      )}

      {/* Log table */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm">{ar ? 'سجل التشغيل' : 'Run History'}</h3>
        <p className="text-xs text-muted-foreground">{total} {ar ? 'سجل' : 'records'}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">{ar ? 'لا توجد سجلات بعد.' : 'No job runs recorded yet.'}</p>
      ) : (
        <div className="border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-xs min-w-[520px]">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="py-2 px-3 text-start font-bold text-muted-foreground">{ar ? 'المهمة' : 'Job'}</th>
                <th className="py-2 px-3 text-start font-bold text-muted-foreground">{ar ? 'وقت التشغيل' : 'Ran At'}</th>
                <th className="py-2 px-3 text-start font-bold text-muted-foreground">{ar ? 'المستخدمون' : 'Users'}</th>
                <th className="py-2 px-3 text-start font-bold text-muted-foreground">{ar ? 'الأخطاء' : 'Errors'}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-2 px-3">
                    <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">{r.jobName}</code>
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap text-muted-foreground">{fmtDate(r.ranAt, ar)}</td>
                  <td className="py-2 px-3 text-center">{r.usersProcessed}</td>
                  <td className="py-2 px-3">
                    {r.errors ? (
                      <span className="text-amber-700 truncate max-w-xs inline-block" title={r.errors}>
                        <AlertTriangle className="w-3 h-3 inline me-1" />{r.errors.length > 60 ? `${r.errors.slice(0, 60)}…` : r.errors}
                      </span>
                    ) : (
                      <span className="text-emerald-600">✓</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > PAGE && (
        <div className="flex items-center gap-2 justify-center text-xs">
          <Button variant="outline" size="sm" className="h-7" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            {ar ? 'السابق' : 'Previous'}
          </Button>
          <span>{page + 1} / {Math.ceil(total / PAGE)}</span>
          <Button variant="outline" size="sm" className="h-7" disabled={(page + 1) * PAGE >= total} onClick={() => setPage(p => p + 1)}>
            {ar ? 'التالي' : 'Next'}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TAB 5 — KPI Alerts
   ════════════════════════════════════════════════════════════════════════════ */

function KpiAlertsTab({ ar, refresh }: { ar: boolean; refresh: number }) {
  const [rows, setRows]     = useState<KpiAlertRow[]>([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage]     = useState(0);
  const [severity, setSeverity] = useState('');
  const PAGE = 50;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(PAGE), offset: String(page * PAGE) });
    if (severity) params.set('severity', severity);
    fetch(`${API_BASE}/admin/automations/kpi-alerts?${params}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.ok) { setRows(d.alerts); setTotal(d.total); } })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, severity, refresh]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <select
          className="h-8 text-xs border border-border rounded-md px-2 bg-white"
          value={severity}
          onChange={e => { setSeverity(e.target.value); setPage(0); }}
        >
          <option value="">{ar ? 'كل الحدّة' : 'All severities'}</option>
          <option value="warn">{ar ? 'تحذير' : 'Warn'}</option>
          <option value="critical">{ar ? 'حرج' : 'Critical'}</option>
        </select>
        <span className="text-xs text-muted-foreground ms-auto">{total} {ar ? 'سجل' : 'records'}</span>
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => exportCsv(rows as unknown as Record<string, unknown>[], 'kpi-alerts.csv')}>
          <Download className="w-3 h-3 me-1" /> {ar ? 'تصدير' : 'Export CSV'}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {ar ? 'لا توجد تنبيهات KPI مسجّلة.' : 'No KPI threshold breaches recorded yet.'}
          <br />
          <span className="text-xs mt-1 block">
            {ar ? 'تظهر التنبيهات عند إرسالها عبر ويب-هوك مُعدَّل.' : 'Alerts appear here once delivered via a configured webhook.'}
          </span>
        </p>
      ) : (
        <div className="border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-xs min-w-[600px]">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="py-2 px-3 text-start font-bold text-muted-foreground">{ar ? 'مؤشر KPI' : 'KPI'}</th>
                <th className="py-2 px-3 text-start font-bold text-muted-foreground">{ar ? 'الحدّة' : 'Severity'}</th>
                <th className="py-2 px-3 text-start font-bold text-muted-foreground">{ar ? 'القيمة' : 'Value'}</th>
                <th className="py-2 px-3 text-start font-bold text-muted-foreground">{ar ? 'الحد (تحذير/حرج)' : 'Threshold (warn/critical)'}</th>
                <th className="py-2 px-3 text-start font-bold text-muted-foreground">{ar ? 'الوقت' : 'Time'}</th>
                <th className="py-2 px-3 text-start font-bold text-muted-foreground">{ar ? 'المستخدم' : 'User'}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-2 px-3">
                    <p className="font-medium">{r.kpi_label || r.kpi_id || '—'}</p>
                    {r.kpi_id && r.kpi_label && r.kpi_id !== r.kpi_label && (
                      <p className="text-muted-foreground font-mono">{r.kpi_id}</p>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {r.severity === 'critical' ? (
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">
                        {ar ? 'حرج' : 'Critical'}
                      </span>
                    ) : r.severity === 'warn' ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">
                        {ar ? 'تحذير' : 'Warn'}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="py-2 px-3 font-mono">{r.value ?? '—'}</td>
                  <td className="py-2 px-3 text-muted-foreground">
                    {r.warn_threshold ?? '—'} / {r.critical_threshold ?? '—'}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap text-muted-foreground">{fmtDate(r.attempted_at, ar)}</td>
                  <td className="py-2 px-3 text-muted-foreground font-mono">u:{r.user_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > PAGE && (
        <div className="flex items-center gap-2 justify-center text-xs">
          <Button variant="outline" size="sm" className="h-7" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            {ar ? 'السابق' : 'Previous'}
          </Button>
          <span>{page + 1} / {Math.ceil(total / PAGE)}</span>
          <Button variant="outline" size="sm" className="h-7" disabled={(page + 1) * PAGE >= total} onClick={() => setPage(p => p + 1)}>
            {ar ? 'التالي' : 'Next'}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TAB 6 — Event Catalog
   ════════════════════════════════════════════════════════════════════════════ */

// Inline the event catalog (mirrors ISC_EVENTS from eventCatalog.ts)
const EVENT_CATALOG = [
  { name: 'user.registered',             description: 'A new user account was created',                                  category: 'auth'       },
  { name: 'user.login',                  description: 'A user signed in to their account',                               category: 'auth'       },
  { name: 'assessment.saved',            description: 'A command-centre briefing / assessment was submitted',            category: 'assessment' },
  { name: 'ai_plan.generated',           description: 'An AI action plan was generated for a toolkit tool',             category: 'ai'         },
  { name: 'supplier.updated',            description: 'The supplier scorecard roster was saved via the UI',             category: 'supplier'   },
  { name: 'supplier.imported',           description: 'Suppliers were bulk-imported via the M2M API',                   category: 'supplier'   },
  { name: 'supplier.tier_changed',       description: 'A supplier\'s tier classification changed',                      category: 'supplier'   },
  { name: 'kpi.imported',                description: 'KPI values were imported via the M2M API',                       category: 'kpi'        },
  { name: 'kpi.rag_changed',             description: 'A KPI crossed a RAG band threshold on import',                   category: 'kpi'        },
  { name: 'kpi.threshold_breach',        description: 'A KPI value crossed a user-defined warn or critical threshold',  category: 'kpi'        },
  { name: 'spend.imported',              description: 'Spend Pareto data was imported via the M2M API',                 category: 'spend'      },
  { name: 'risk_kri.imported',           description: 'KRI values were imported via the M2M API',                       category: 'risk'       },
  { name: 'kri.threshold_breached',      description: 'A KRI crossed its amber or red threshold',                       category: 'risk'       },
  { name: 'feedback.submitted',          description: 'A visitor submitted tool feedback',                               category: 'feedback'   },
  { name: 'lead.captured',               description: 'A lead submitted the command-centre briefing form',              category: 'lead'       },
  { name: 'plan.saved',                  description: 'A generated AI plan was saved to a toolkit',                     category: 'plan'       },
  { name: 'plan.deleted',               description: 'A saved AI plan was deleted from a toolkit',                     category: 'plan'       },
  { name: 'schedule.weekly_kpi_digest',  description: 'Weekly KPI summary digest sent to user',                         category: 'system'     },
  { name: 'schedule.monthly_scorecard',  description: 'Monthly supplier scorecard digest sent to user',                 category: 'system'     },
  { name: 'schedule.lead_followup',      description: 'Uncontacted lead flagged for follow-up after 48 hours',          category: 'system'     },
  { name: 'schedule.stale_data_nudge',   description: 'User nudged to re-import KPI data after 14+ days',              category: 'system'     },
  { name: 'webhook.test',                description: 'A test ping was sent from the integrations UI',                  category: 'system'     },
  { name: 'test.ping',                   description: 'A connectivity test from the Automation Hub',                    category: 'system'     },
];

const CATEGORY_COLORS: Record<string, string> = {
  auth:       'bg-blue-100 text-blue-700',
  assessment: 'bg-violet-100 text-violet-700',
  ai:         'bg-purple-100 text-purple-700',
  supplier:   'bg-cyan-100 text-cyan-700',
  kpi:        'bg-green-100 text-green-700',
  spend:      'bg-orange-100 text-orange-700',
  risk:       'bg-red-100 text-red-700',
  feedback:   'bg-pink-100 text-pink-700',
  lead:       'bg-yellow-100 text-yellow-700',
  plan:       'bg-indigo-100 text-indigo-700',
  system:     'bg-slate-100 text-slate-600',
};

function EventCatalogTab({ ar }: { ar: boolean }) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');

  const categories = [...new Set(EVENT_CATALOG.map(e => e.category))].sort();

  const filtered = EVENT_CATALOG.filter(e => {
    if (catFilter && e.category !== catFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return e.name.includes(q) || e.description.toLowerCase().includes(q);
    }
    return true;
  });

  const examplePayload = (name: string) => JSON.stringify({
    event: name,
    source: 'isc',
    version: '1',
    timestamp: new Date().toISOString(),
    userId: 42,
    data: { /* event-specific fields */ },
  }, null, 2);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          className="w-52 h-8 text-xs"
          placeholder={ar ? 'بحث في الأحداث…' : 'Search events…'}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="h-8 text-xs border border-border rounded-md px-2 bg-white"
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
        >
          <option value="">{ar ? 'كل الفئات' : 'All categories'}</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="text-xs text-muted-foreground ms-auto">{filtered.length} / {EVENT_CATALOG.length}</span>
      </div>

      <div className="space-y-2">
        {filtered.map(e => (
          <EventCatalogItem key={e.name} ev={e} ar={ar} examplePayload={examplePayload(e.name)} />
        ))}
      </div>
    </div>
  );
}

function EventCatalogItem({
  ev, ar, examplePayload,
}: {
  ev: typeof EVENT_CATALOG[number];
  ar: boolean;
  examplePayload: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50" onClick={() => setOpen(v => !v)}>
        <div className="flex items-center gap-3 min-w-0">
          <code className="text-sm font-mono font-bold text-primary truncate">{ev.name}</code>
          <span className={`hidden sm:inline-block text-xs px-2 py-0.5 rounded-full font-semibold ${CATEGORY_COLORS[ev.category] ?? 'bg-slate-100'}`}>
            {ev.category}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <CopyBtn value={ev.name} />
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-border bg-slate-50/50">
          <p className="text-sm text-muted-foreground pt-3">{ev.description}</p>
          <div>
            <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-widest">
              {ar ? 'مثال على الحمولة' : 'Example payload envelope'}
            </p>
            <div className="relative">
              <pre className="text-xs bg-white border border-border rounded-lg p-3 overflow-x-auto max-h-40">
                {examplePayload}
              </pre>
              <div className="absolute top-2 end-2">
                <CopyBtn value={examplePayload} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
