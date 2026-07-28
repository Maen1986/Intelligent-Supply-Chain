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
  Clock, Zap, Server, Radio, Package, Wifi, WifiOff, Globe, X,
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

interface WebhookConfigRow {
  id: number;
  userId: number;
  maskedUrl: string;
  events: string[];
  createdAt: string;
}

interface HealthCheckResult {
  latencyMs: number;
  statusCode: number | null;
  error: string | null;
}

interface TestFireResult {
  maskedUrl: string;
  result: unknown;
}

/* ─── utility ───────────────────────────────────────────────────────────── */

/**
 * Pure placeholder-substitution logic used by PrepareDownloadModal.
 * Exported so it can be unit-tested independently of React / jsdom.
 *
 * Rules:
 *  - apiKey and domain are always substituted (domain falls back to
 *    `fallbackHostname` when blank so the caller controls the default).
 *  - n8n URL placeholders are only substituted when `n8nUrl` is non-empty;
 *    leaving the field blank intentionally preserves them in the output.
 */
export function applyTemplatePlaceholders(
  text: string,
  {
    apiKey,
    domain,
    n8nUrl,
    fallbackHostname = '',
  }: { apiKey: string; domain: string; n8nUrl: string; fallbackHostname?: string },
): string {
  text = text.replaceAll('REPLACE_WITH_ISC_API_KEY', apiKey.trim());
  text = text.replaceAll('YOUR_ISC_DOMAIN', domain.trim() || fallbackHostname);
  if (n8nUrl.trim()) {
    text = text.replaceAll('YOUR_N8N_INSTANCE_URL', n8nUrl.trim());
    text = text.replaceAll('REPLACE_WITH_N8N_INSTANCE_URL', n8nUrl.trim());
  }
  return text;
}

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

type Tab = 'overview' | 'webhook-log' | 'inbound-log' | 'schedule-log' | 'kpi-alerts' | 'event-catalog' | 'templates';

const TABS: { id: Tab; en: string; ar: string; icon: React.ElementType }[] = [
  { id: 'overview',      en: 'Overview',      ar: 'نظرة عامة',        icon: Activity     },
  { id: 'webhook-log',   en: 'Webhook Log',   ar: 'سجل الويب-هوك',    icon: Webhook      },
  { id: 'inbound-log',   en: 'Inbound Log',   ar: 'السجل الوارد',     icon: Radio        },
  { id: 'schedule-log',  en: 'Schedule Log',  ar: 'سجل المهام',       icon: Calendar     },
  { id: 'kpi-alerts',    en: 'KPI Alerts',    ar: 'تنبيهات KPI',      icon: Bell         },
  { id: 'event-catalog', en: 'Event Catalog', ar: 'كتالوج الأحداث',   icon: BookOpen     },
  { id: 'templates',     en: 'Templates',     ar: 'القوالب',           icon: Package      },
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
        {tab === 'templates'     && <TemplatesTab     ar={ar} />}
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

      {/* Row 4: Connection Health Checker */}
      <ConnectionHealthPanel ar={ar} />
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

/* ─── TestFireModal ──────────────────────────────────────────────────────── */

function TestFireModal({ ar, result, onClose }: { ar: boolean; result: TestFireResult; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            {ar ? 'نتيجة الاختبار' : 'Test Fire Result'}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground font-mono break-all">{result.maskedUrl}</p>
        <pre className="text-xs bg-slate-50 border border-border rounded-lg p-3 overflow-x-auto max-h-72 whitespace-pre-wrap break-all">
          {JSON.stringify(result.result, null, 2)}
        </pre>
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={onClose}>
            {ar ? 'إغلاق' : 'Close'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── ConnectionHealthPanel ──────────────────────────────────────────────── */

function ConnectionHealthPanel({ ar }: { ar: boolean }) {
  const [webhooks, setWebhooks]   = useState<WebhookConfigRow[] | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  // Per-webhook ping state
  const [pinging, setPinging]     = useState<Record<number, boolean>>({});
  const [pingResults, setPingResults] = useState<Record<number, HealthCheckResult>>({});

  // Per-webhook test-fire state
  const [testing, setTesting]     = useState<Record<number, boolean>>({});
  const [testModal, setTestModal] = useState<TestFireResult | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/admin/automations/webhooks`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.ok) setWebhooks(d.webhooks); else setError(d.error ?? 'Failed'); })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, []);

  const ping = async (id: number) => {
    setPinging(p => ({ ...p, [id]: true }));
    try {
      const r = await fetch(`${API_BASE}/admin/automations/health-check/${id}`, { credentials: 'include' });
      const d = await r.json();
      if (d.ok) {
        setPingResults(p => ({ ...p, [id]: { latencyMs: d.latencyMs, statusCode: d.statusCode, error: d.error } }));
      }
    } catch {
      setPingResults(p => ({ ...p, [id]: { latencyMs: 0, statusCode: null, error: 'Network error' } }));
    } finally {
      setPinging(p => ({ ...p, [id]: false }));
    }
  };

  const testFire = async (id: number, maskedUrl: string) => {
    setTesting(t => ({ ...t, [id]: true }));
    try {
      const r = await fetch(`${API_BASE}/admin/automations/test-webhook/${id}`, {
        method: 'POST', credentials: 'include',
      });
      const d = await r.json();
      setTestModal({ maskedUrl, result: d });
    } catch {
      setTestModal({ maskedUrl, result: { ok: false, error: 'Network error' } });
    } finally {
      setTesting(t => ({ ...t, [id]: false }));
    }
  };

  function latencyColor(ms: number) {
    if (ms < 400)  return 'text-emerald-600';
    if (ms < 1200) return 'text-amber-600';
    return 'text-red-600';
  }

  function statusColor(code: number | null) {
    if (code === null)       return 'text-muted-foreground';
    if (code >= 200 && code < 300) return 'text-emerald-600';
    if (code >= 300 && code < 400) return 'text-amber-600';
    return 'text-red-600';
  }

  return (
    <>
      {testModal && <TestFireModal ar={ar} result={testModal} onClose={() => setTestModal(null)} />}

      <div className="space-y-3">
        <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" />
          {ar ? 'فحص صحة الاتصال' : 'Connection Health Checker'}
        </h3>

        {loading && (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && webhooks !== null && webhooks.length === 0 && (
          <p className="text-sm text-muted-foreground py-3">
            {ar ? 'لا توجد ويب-هوكات مُعدَّة.' : 'No webhook endpoints configured yet.'}
          </p>
        )}

        {!loading && !error && webhooks && webhooks.length > 0 && (
          <div className="border border-border rounded-xl overflow-x-auto">
            <table className="w-full text-xs min-w-[560px]">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="py-2 px-3 text-start font-bold text-muted-foreground">ID</th>
                  <th className="py-2 px-3 text-start font-bold text-muted-foreground">
                    {ar ? 'المستخدم' : 'User'}
                  </th>
                  <th className="py-2 px-3 text-start font-bold text-muted-foreground">URL</th>
                  <th className="py-2 px-3 text-start font-bold text-muted-foreground">
                    {ar ? 'نتيجة Ping' : 'Ping Result'}
                  </th>
                  <th className="py-2 px-3 text-start font-bold text-muted-foreground">
                    {ar ? 'الإجراءات' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {webhooks.map(wh => {
                  const res = pingResults[wh.id];
                  const isPinging = pinging[wh.id] ?? false;
                  const isTesting = testing[wh.id] ?? false;
                  return (
                    <tr key={wh.id} className="border-b last:border-0 align-middle">
                      <td className="py-2 px-3 text-muted-foreground">{wh.id}</td>
                      <td className="py-2 px-3 text-muted-foreground">{wh.userId}</td>
                      <td className="py-2 px-3 font-mono text-muted-foreground break-all">{wh.maskedUrl}</td>
                      <td className="py-2 px-3">
                        {!res && !isPinging && (
                          <span className="text-muted-foreground">—</span>
                        )}
                        {isPinging && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            {ar ? 'جارٍ الاختبار…' : 'Pinging…'}
                          </span>
                        )}
                        {!isPinging && res && (
                          <span className="flex items-center gap-2 flex-wrap">
                            {res.error ? (
                              <span className="flex items-center gap-1 text-red-600">
                                <WifiOff className="w-3 h-3" />
                                {res.error}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Wifi className="w-3 h-3 text-emerald-500" />
                                <span className={`font-bold ${latencyColor(res.latencyMs)}`}>
                                  {res.latencyMs}ms
                                </span>
                              </span>
                            )}
                            {res.statusCode !== null && (
                              <span className={`font-mono font-bold ${statusColor(res.statusCode)}`}>
                                HTTP {res.statusCode}
                              </span>
                            )}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2.5"
                            disabled={isPinging}
                            onClick={() => void ping(wh.id)}
                          >
                            {isPinging
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Wifi className="w-3 h-3 me-1" />}
                            {ar ? 'Ping' : 'Ping'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2.5"
                            disabled={isTesting}
                            onClick={() => void testFire(wh.id, wh.maskedUrl)}
                          >
                            {isTesting
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Zap className="w-3 h-3 me-1" />}
                            {ar ? 'اختبار' : 'Test fire'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
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

/* ════════════════════════════════════════════════════════════════════════════
   TAB 7 — n8n Workflow Templates
   ════════════════════════════════════════════════════════════════════════════ */

interface TemplateManifestItem {
  id: string;
  platform: string;
  filename: string;
  downloadPath: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  triggerEvent: string;
  category: string;
  setupTimeMinutes: number;
  nodes: string[];
}

const CATEGORY_BADGE: Record<string, string> = {
  Sales:        'bg-yellow-100 text-yellow-700',
  Alerts:       'bg-red-100 text-red-700',
  Reporting:    'bg-blue-100 text-blue-700',
  Onboarding:   'bg-green-100 text-green-700',
  Notifications:'bg-purple-100 text-purple-700',
  Integration:  'bg-cyan-100 text-cyan-700',
  Escalation:   'bg-orange-100 text-orange-700',
};

/* Platform display helpers */
const PLATFORM_LABEL: Record<string, { en: string; ar: string; color: string }> = {
  n8n:    { en: 'n8n',      ar: 'n8n',       color: 'bg-orange-100 text-orange-700' },
  make:   { en: 'Make.com', ar: 'Make.com',   color: 'bg-violet-100 text-violet-700' },
  zapier: { en: 'Zapier',   ar: 'Zapier',     color: 'bg-amber-100 text-amber-700'  },
};

const NODES_LABEL: Record<string, { en: string; ar: string }> = {
  n8n:    { en: 'Nodes used',    ar: 'العقد المُستخدمة'    },
  make:   { en: 'Modules used',  ar: 'الوحدات المُستخدمة'  },
  zapier: { en: 'Steps',         ar: 'الخطوات'              },
};

export const SETUP_GUIDES: Record<string, { en: string[]; ar: string[] }> = {
  /* ── Make.com ── */
  'make-kpi-breach-alert': {
    en: [
      '1. In Make.com, create a new scenario.',
      '2. Click the three-dot menu → Import Blueprint and select this file.',
      '3. Click the Webhook module and copy the generated webhook URL.',
      '4. In ISC → Admin → Integration Hub → Webhooks, create a webhook with event "kpi.threshold_breach" and paste that URL.',
      '5. Add your Gmail connection to the Gmail module.',
      '6. Paste your Slack Incoming Webhook URL into the HTTP (Slack) module.',
      '7. Replace Twilio credentials and phone numbers in the HTTP (Twilio) module.',
      '8. Replace YOUR_ISC_DOMAIN and alert recipient email throughout.',
      '9. Turn the scenario ON.',
    ],
    ar: [
      '١. في Make.com، أنشئ سيناريو جديداً.',
      '٢. انقر قائمة النقاط الثلاث ← استيراد Blueprint واختر هذا الملف.',
      '٣. انقر وحدة Webhook وانسخ الرابط المُنشأ.',
      '٤. في ISC ← الإدارة ← مركز التكاملات ← الويب-هوك، أضف ويب-هوك بحدث "kpi.threshold_breach" والصق الرابط.',
      '٥. أضف اتصال Gmail إلى وحدة Gmail.',
      '٦. الصق رابط Slack Incoming Webhook في وحدة HTTP (Slack).',
      '٧. استبدل بيانات Twilio وأرقام الهاتف في وحدة HTTP (Twilio).',
      '٨. استبدل YOUR_ISC_DOMAIN وعنوان البريد.',
      '٩. شغّل السيناريو.',
    ],
  },
  'make-new-user-welcome': {
    en: [
      '1. In Make.com, create a new scenario.',
      '2. Click the three-dot menu → Import Blueprint and select this file.',
      '3. Click the Webhook module and copy the generated webhook URL.',
      '4. In ISC → Admin → Integration Hub → Webhooks, create a webhook with event "user.registered" and paste that URL.',
      '5. Add your Gmail connection to both Gmail modules (EN and AR routes).',
      '6. Replace YOUR_ISC_DOMAIN in both email body templates.',
      '7. Turn the scenario ON.',
    ],
    ar: [
      '١. في Make.com، أنشئ سيناريو جديداً.',
      '٢. انقر قائمة النقاط الثلاث ← استيراد Blueprint واختر هذا الملف.',
      '٣. انقر وحدة Webhook وانسخ الرابط المُنشأ.',
      '٤. في ISC ← الإدارة ← مركز التكاملات ← الويب-هوك، أضف ويب-هوك بحدث "user.registered" والصق الرابط.',
      '٥. أضف اتصال Gmail إلى وحدتَي Gmail (المسار الإنجليزي والعربي).',
      '٦. استبدل YOUR_ISC_DOMAIN في قالبَي البريد.',
      '٧. شغّل السيناريو.',
    ],
  },
  'make-weekly-kpi-digest': {
    en: [
      '1. In Make.com, create a new scenario.',
      '2. Click the three-dot menu → Import Blueprint and select this file.',
      '3. Click the Webhook module and copy the generated webhook URL.',
      '4. In ISC → Admin → Integration Hub → Webhooks, create a webhook with event "schedule.weekly_kpi_digest" and paste that URL.',
      '5. Add your Gmail connection to the Gmail module.',
      '6. Replace YOUR_ISC_DOMAIN in the Set Variable module\'s email template.',
      '7. ISC fires this every Monday automatically — no Make.com schedule needed.',
      '8. Turn the scenario ON.',
    ],
    ar: [
      '١. في Make.com، أنشئ سيناريو جديداً.',
      '٢. انقر قائمة النقاط الثلاث ← استيراد Blueprint واختر هذا الملف.',
      '٣. انقر وحدة Webhook وانسخ الرابط المُنشأ.',
      '٤. في ISC ← الإدارة ← مركز التكاملات ← الويب-هوك، أضف ويب-هوك بحدث "schedule.weekly_kpi_digest" والصق الرابط.',
      '٥. أضف اتصال Gmail إلى وحدة Gmail.',
      '٦. استبدل YOUR_ISC_DOMAIN في قالب البريد بوحدة Set Variable.',
      '٧. تُرسل ISC هذا الحدث كل يوم اثنين تلقائياً.',
      '٨. شغّل السيناريو.',
    ],
  },
  /* ── Zapier ── */
  'zapier-kpi-breach-alert': {
    en: [
      '1. In Zapier, create a new Zap. Choose "Webhooks by Zapier" as the trigger with event "Catch Hook".',
      '2. Copy the Catch Hook URL and register it in ISC → Admin → Integration Hub → Webhooks with event "kpi.threshold_breach".',
      '3. Add a Filter step: continue only if severity (Text) Exactly matches "warn".',
      '4. Add a Webhooks POST action and paste your Slack Incoming Webhook URL.',
      '5. Create a second Zap using the same hook URL, filter for "critical", and add Gmail + SMS by Zapier actions.',
      '6. Replace YOUR_ISC_DOMAIN, recipient email, and phone number.',
      '7. Turn both Zaps ON.',
    ],
    ar: [
      '١. في Zapier، أنشئ Zap جديداً. اختر "Webhooks by Zapier" كمشغّل بحدث "Catch Hook".',
      '٢. انسخ الرابط وسجّله في ISC ← مركز التكاملات بحدث "kpi.threshold_breach".',
      '٣. أضف خطوة Filter: استمر فقط إذا كانت severity تطابق "warn".',
      '٤. أضف إجراء Webhooks POST والصق رابط Slack Incoming Webhook.',
      '٥. أنشئ Zap ثانياً بنفس الرابط، صفّه لـ "critical"، وأضف Gmail + SMS.',
      '٦. استبدل YOUR_ISC_DOMAIN والبريد ورقم الهاتف.',
      '٧. شغّل كلا الـ Zap-ين.',
    ],
  },
  'zapier-new-user-welcome': {
    en: [
      '1. In Zapier, create a new Zap. Choose "Webhooks by Zapier" → "Catch Hook".',
      '2. Copy the Catch Hook URL and register it in ISC → Admin → Integration Hub → Webhooks with event "user.registered".',
      '3. Add a Filter: continue only if lang (Text) Does not exactly match "ar" — this handles the English path.',
      '4. Add a Gmail action. Connect your account and paste the English email HTML from this file.',
      '5. Create a second Zap with the same hook URL, filter for lang equals "ar", and paste the Arabic email HTML.',
      '6. Replace YOUR_ISC_DOMAIN in both email bodies.',
      '7. Turn both Zaps ON.',
    ],
    ar: [
      '١. في Zapier، أنشئ Zap جديداً. اختر "Webhooks by Zapier" ← "Catch Hook".',
      '٢. انسخ الرابط وسجّله في ISC ← مركز التكاملات بحدث "user.registered".',
      '٣. أضف Filter: استمر فقط إذا كان lang لا يطابق "ar" — هذا المسار الإنجليزي.',
      '٤. أضف إجراء Gmail واربط حسابك والصق HTML البريد الإنجليزي.',
      '٥. أنشئ Zap ثانياً بنفس الرابط، صفّه لـ lang = "ar"، والصق HTML البريد العربي.',
      '٦. استبدل YOUR_ISC_DOMAIN في قالبَي البريد.',
      '٧. شغّل كلا الـ Zap-ين.',
    ],
  },
  'zapier-weekly-kpi-digest': {
    en: [
      '1. In Zapier, create a new Zap. Choose "Webhooks by Zapier" → "Catch Hook".',
      '2. Copy the Catch Hook URL and register it in ISC → Admin → Integration Hub → Webhooks with event "schedule.weekly_kpi_digest".',
      '3. Add a "Code by Zapier" step (Run Javascript) and paste the code from this file\'s step 3.',
      '4. Replace YOUR_ISC_DOMAIN in the code.',
      '5. Add a Gmail action. Connect your account. Set the body to the output of the Code step.',
      '6. ISC fires this every Monday automatically — no Zapier schedule trigger needed.',
      '7. Turn the Zap ON.',
    ],
    ar: [
      '١. في Zapier، أنشئ Zap جديداً. اختر "Webhooks by Zapier" ← "Catch Hook".',
      '٢. انسخ الرابط وسجّله في ISC ← مركز التكاملات بحدث "schedule.weekly_kpi_digest".',
      '٣. أضف خطوة "Code by Zapier" (Run Javascript) والصق الكود من الخطوة 3 في هذا الملف.',
      '٤. استبدل YOUR_ISC_DOMAIN في الكود.',
      '٥. أضف إجراء Gmail واربط حسابك وضع مخرجات خطوة Code في حقل الجسم.',
      '٦. تُرسل ISC هذا الحدث كل يوم اثنين تلقائياً.',
      '٧. شغّل الـ Zap.',
    ],
  },
  /* ── Make.com (new 5) ── */
  'make-lead-nurture-sequence': {
    en: [
      '1. In Make.com, create a new scenario.',
      '2. Click the three-dot menu → Import Blueprint and select this file.',
      '3. Click the Webhook module and copy the generated webhook URL.',
      '4. In ISC → Admin → Integration Hub → Webhooks, create a webhook with event "lead.captured" and paste that URL.',
      '5. Add your Gmail connection to both Gmail modules.',
      '6. Replace YOUR_ISC_DOMAIN and YOUR_CALENDAR_LINK throughout.',
      '7. The Delay module waits 48 hours before the follow-up — adjust the delay if needed.',
      '8. Note: lead fields (name, email) are in the nested data envelope — the template uses the correct paths (1.body.data.name, 1.body.data.email) already.',
      '9. Turn the scenario ON.',
    ],
    ar: [
      '١. في Make.com، أنشئ سيناريو جديداً.',
      '٢. انقر قائمة النقاط الثلاث ← استيراد Blueprint واختر هذا الملف.',
      '٣. انقر وحدة Webhook وانسخ الرابط المُنشأ.',
      '٤. في ISC ← الإدارة ← مركز التكاملات ← الويب-هوك، أضف ويب-هوك بحدث "lead.captured" والصق الرابط.',
      '٥. أضف اتصال Gmail إلى وحدتَي Gmail.',
      '٦. استبدل YOUR_ISC_DOMAIN وYOUR_CALENDAR_LINK في جميع أنحاء الملف.',
      '٧. وحدة Delay تنتظر 48 ساعة — عدّلها حسب الحاجة.',
      '٨. حقول العميل (name، email) مُدمجة في حقل data — المسارات صحيحة في القالب.',
      '٩. شغّل السيناريو.',
    ],
  },
  'make-ai-plan-ready-notification': {
    en: [
      '1. In Make.com, create a new scenario.',
      '2. Click the three-dot menu → Import Blueprint and select this file.',
      '3. Click the Webhook module and copy the generated webhook URL.',
      '4. In ISC → Admin → Integration Hub → Webhooks, create a webhook with event "ai_plan.generated" and paste that URL.',
      '5. Add your Gmail connection to the Gmail module.',
      '6. Replace YOUR_ISC_DOMAIN in the Gmail body.',
      '7. For WhatsApp: replace REPLACE_WITH_PHONE_NUMBER_ID and REPLACE_WITH_WHATSAPP_TOKEN with your Meta Business API credentials. If not using WhatsApp, disable or delete that module.',
      '8. Note: all user fields (userEmail, userName, userPhone) are nested under data — the template uses the correct paths (1.body.data.userEmail etc.) already.',
      '9. Turn the scenario ON.',
    ],
    ar: [
      '١. في Make.com، أنشئ سيناريو جديداً.',
      '٢. انقر قائمة النقاط الثلاث ← استيراد Blueprint واختر هذا الملف.',
      '٣. انقر وحدة Webhook وانسخ الرابط المُنشأ.',
      '٤. في ISC ← الإدارة ← مركز التكاملات ← الويب-هوك، أضف ويب-هوك بحدث "ai_plan.generated" والصق الرابط.',
      '٥. أضف اتصال Gmail إلى وحدة Gmail.',
      '٦. استبدل YOUR_ISC_DOMAIN في نص البريد.',
      '٧. لـ WhatsApp: استبدل REPLACE_WITH_PHONE_NUMBER_ID وREPLACE_WITH_WHATSAPP_TOKEN ببيانات Meta Business API. إذا لم تستخدم WhatsApp، عطّل تلك الوحدة.',
      '٨. حقول المستخدم (userEmail، userName، userPhone) مُدمجة في حقل data — المسارات صحيحة في القالب.',
      '٩. شغّل السيناريو.',
    ],
  },
  'make-monthly-supplier-scorecard': {
    en: [
      '1. In Make.com, create a new scenario.',
      '2. Click the three-dot menu → Import Blueprint and select this file.',
      '3. Click the Webhook module and copy the generated webhook URL.',
      '4. In ISC → Admin → Integration Hub → Webhooks, create a webhook with event "schedule.monthly_scorecard" and paste that URL.',
      '5. Replace YOUR_ISC_DOMAIN in the Set Variable module and in the Gmail "from" address.',
      '6. Add your Gmail connection to the Gmail module.',
      '7. No ISC API key needed — supplier data, user name, and month all come from the webhook payload itself.',
      '8. ISC fires this on the 1st of each month automatically — no Make.com schedule trigger needed.',
      '9. Turn the scenario ON.',
    ],
    ar: [
      '١. في Make.com، أنشئ سيناريو جديداً.',
      '٢. انقر قائمة النقاط الثلاث ← استيراد Blueprint واختر هذا الملف.',
      '٣. انقر وحدة Webhook وانسخ الرابط المُنشأ.',
      '٤. في ISC ← الإدارة ← مركز التكاملات ← الويب-هوك، أضف ويب-هوك بحدث "schedule.monthly_scorecard" والصق الرابط.',
      '٥. استبدل YOUR_ISC_DOMAIN في وحدة Set Variable وفي حقل "from" بالبريد.',
      '٦. أضف اتصال Gmail إلى وحدة Gmail.',
      '٧. لا حاجة لمفتاح ISC API — بيانات الموردين والمستخدم والشهر تأتي من الحمولة مباشرةً.',
      '٨. تُرسل ISC هذا الحدث في أول كل شهر تلقائياً.',
      '٩. شغّل السيناريو.',
    ],
  },
  'make-erp-data-sync': {
    en: [
      '1. In Make.com, create a new scenario.',
      '2. Click the three-dot menu → Import Blueprint and select this file.',
      '3. Replace YOUR_ERP_BASE_URL and REPLACE_WITH_ERP_API_TOKEN in both ERP HTTP modules.',
      '4. Replace YOUR_ISC_DOMAIN and REPLACE_WITH_ISC_API_KEY in both ISC HTTP modules (the key must have write scope).',
      '5. Review the Set Variable (KPI Mapping) module: adjust item.kpi_code and item.current_value to match your ERP. The ISC endpoint expects { slug, values: { kpiId: value } }.',
      '6. In the ISC Suppliers HTTP module, adjust item.supplier_code, item.supplier_name, item.classification, and item.country_code. Both "id" and "name" are required by ISC.',
      '7. Change the slug value "erp-sync" to match the toolkit slug you use in ISC.',
      '8. This scenario uses Make.com\'s built-in scheduler — no ISC webhook registration needed.',
      '9. Turn the scenario ON.',
    ],
    ar: [
      '١. في Make.com، أنشئ سيناريو جديداً.',
      '٢. انقر قائمة النقاط الثلاث ← استيراد Blueprint واختر هذا الملف.',
      '٣. استبدل YOUR_ERP_BASE_URL وREPLACE_WITH_ERP_API_TOKEN في وحدتَي ERP.',
      '٤. استبدل YOUR_ISC_DOMAIN وREPLACE_WITH_ISC_API_KEY في وحدتَي ISC (المفتاح يجب أن يملك صلاحية الكتابة).',
      '٥. راجع وحدة Set Variable (تعيين الحقول) وعدّل أسماء حقول ERP.',
      '٦. عدّل تعيين حقول الموردين في وحدة ISC Suppliers بالمثل.',
      '٧. غيّر قيمة slug "erp-sync" لتطابق اسم الحقيبة التي تستخدمها في ISC.',
      '٨. يستخدم السيناريو مجدول Make.com الداخلي — لا حاجة لتسجيل ويب-هوك في ISC.',
      '٩. شغّل السيناريو.',
    ],
  },
  'make-escalation-router': {
    en: [
      '1. In Make.com, create a new scenario.',
      '2. Click the three-dot menu → Import Blueprint and select this file.',
      '3. Click the Webhook module and copy the generated webhook URL.',
      '4. In ISC → Admin → Integration Hub → Webhooks, create a webhook with event "kpi.threshold_breach" and paste that URL.',
      '5. Create a Google Sheet named "TeamLeads" with columns: KPI_Category (A), Name (B), Email (C). Add your team leads.',
      '6. Connect your Google Sheets account and set the spreadsheet ID in the Google Sheets module.',
      '7. Replace REPLACE_WITH_LINEAR_API_KEY and REPLACE_WITH_LINEAR_TEAM_ID in the Linear HTTP module. Or replace it with a Jira API call.',
      '8. Add your Gmail connection and replace YOUR_ISC_DOMAIN throughout.',
      '9. This scenario only escalates "critical" severity — warn events are silently dropped.',
      '10. Turn the scenario ON.',
    ],
    ar: [
      '١. في Make.com، أنشئ سيناريو جديداً.',
      '٢. انقر قائمة النقاط الثلاث ← استيراد Blueprint واختر هذا الملف.',
      '٣. انقر وحدة Webhook وانسخ الرابط المُنشأ.',
      '٤. في ISC ← الإدارة ← مركز التكاملات ← الويب-هوك، أضف ويب-هوك بحدث "kpi.threshold_breach" والصق الرابط.',
      '٥. أنشئ جدول Google Sheets باسم "TeamLeads" بأعمدة: KPI_Category (A)، Name (B)، Email (C).',
      '٦. اربط حساب Google Sheets وعيّن معرف الجدول في الوحدة.',
      '٧. استبدل REPLACE_WITH_LINEAR_API_KEY وREPLACE_WITH_LINEAR_TEAM_ID أو استخدم Jira.',
      '٨. أضف اتصال Gmail واستبدل YOUR_ISC_DOMAIN.',
      '٩. يُصعَّد الحدث فقط للخطورة "critical" — تنبيهات "warn" تُتجاهل.',
      '١٠. شغّل السيناريو.',
    ],
  },
  /* ── Zapier (new 5) ── */
  'zapier-lead-nurture-sequence': {
    en: [
      '1. In Zapier, create a new Zap. Choose "Webhooks by Zapier" → "Catch Hook".',
      '2. Copy the Catch Hook URL and register it in ISC → Admin → Integration Hub → Webhooks with event "lead.captured".',
      '3. Add a Gmail action to send the welcome email. Replace YOUR_ISC_DOMAIN and YOUR_CALENDAR_LINK.',
      '4. Add a "Delay by Zapier → Delay For 48 hours" step.',
      '5. Add a second Gmail action to send the discovery call invitation.',
      '6. Lead fields (name, email) are nested under "data" — use {{1__data__name}} and {{1__data__email}}.',
      '7. Turn the Zap ON.',
    ],
    ar: [
      '١. في Zapier، أنشئ Zap جديداً. اختر "Webhooks by Zapier" ← "Catch Hook".',
      '٢. انسخ الرابط وسجّله في ISC ← مركز التكاملات بحدث "lead.captured".',
      '٣. أضف إجراء Gmail لإرسال بريد الترحيب. استبدل YOUR_ISC_DOMAIN وYOUR_CALENDAR_LINK.',
      '٤. أضف خطوة "Delay by Zapier → Delay For 48 hours".',
      '٥. أضف إجراء Gmail ثانياً لإرسال دعوة المكالمة.',
      '٦. حقول العميل (name، email) مُدمجة في حقل data — استخدم {{1__data__name}} و{{1__data__email}}.',
      '٧. شغّل الـ Zap.',
    ],
  },
  'zapier-ai-plan-ready-notification': {
    en: [
      '1. In Zapier, create a new Zap. Choose "Webhooks by Zapier" → "Catch Hook".',
      '2. Copy the Catch Hook URL and register it in ISC → Admin → Integration Hub → Webhooks with event "ai_plan.generated".',
      '3. Add a Gmail action. Connect your account, set To = {{1__data__userEmail}}, and replace YOUR_ISC_DOMAIN in the body.',
      '4. Optionally add a Twilio (or SMS by Zapier) step for SMS/WhatsApp. Set To = {{1__data__userPhone}}.',
      '5. Remove the SMS/Twilio step if you do not need it.',
      '6. All user fields (userEmail, userName, userPhone) are nested under "data" — use {{1__data__userEmail}} etc.',
      '7. Turn the Zap ON.',
    ],
    ar: [
      '١. في Zapier، أنشئ Zap جديداً. اختر "Webhooks by Zapier" ← "Catch Hook".',
      '٢. انسخ الرابط وسجّله في ISC ← مركز التكاملات بحدث "ai_plan.generated".',
      '٣. أضف إجراء Gmail. اربط حسابك، عيّن To = {{1__data__userEmail}}، واستبدل YOUR_ISC_DOMAIN في نص البريد.',
      '٤. اختيارياً أضف خطوة Twilio أو SMS by Zapier. عيّن To = {{1__data__userPhone}}.',
      '٥. احذف خطوة SMS إذا لم تحتجها.',
      '٦. حقول المستخدم (userEmail، userName، userPhone) مُدمجة في حقل data — استخدم {{1__data__userEmail}} إلخ.',
      '٧. شغّل الـ Zap.',
    ],
  },
  'zapier-monthly-supplier-scorecard': {
    en: [
      '1. In Zapier, create a new Zap. Choose "Webhooks by Zapier" → "Catch Hook".',
      '2. Copy the Catch Hook URL and register it in ISC → Admin → Integration Hub → Webhooks with event "schedule.monthly_scorecard".',
      '3. Add a "Code by Zapier → Run Javascript" step. Paste the code from this template file and replace YOUR_ISC_DOMAIN inside the code.',
      '4. Add a Gmail action. Set To = {{1__data__userEmail}}, Subject = {{2__subject}}, Body = {{2__html}}.',
      '5. Connect your Gmail account.',
      '6. All payload fields (userEmail, userName, month, suppliers) are nested under "data" — use {{1__data__userEmail}} etc.',
      '7. ISC fires this on the 1st of each month automatically — no Zapier schedule trigger needed.',
      '8. Turn the Zap ON.',
    ],
    ar: [
      '١. في Zapier، أنشئ Zap جديداً. اختر "Webhooks by Zapier" ← "Catch Hook".',
      '٢. انسخ الرابط وسجّله في ISC ← مركز التكاملات بحدث "schedule.monthly_scorecard".',
      '٣. أضف خطوة "Code by Zapier → Run Javascript" والصق الكود من هذا الملف واستبدل YOUR_ISC_DOMAIN داخله.',
      '٤. أضف إجراء Gmail. عيّن To = {{1__data__userEmail}}، Subject = {{2__subject}}، Body = {{2__html}}.',
      '٥. اربط حساب Gmail.',
      '٦. جميع الحقول (userEmail، userName، month، suppliers) مُدمجة في حقل data — استخدم {{1__data__userEmail}} إلخ.',
      '٧. تُرسل ISC هذا الحدث في أول كل شهر تلقائياً.',
      '٨. شغّل الـ Zap.',
    ],
  },
  'zapier-erp-data-sync': {
    en: [
      '1. In Zapier, create a new Zap. Choose "Schedule by Zapier → Every Day" as the trigger. Set time to 02:00.',
      '2. Add a "Webhooks by Zapier → GET" step for your ERP KPI endpoint. Replace YOUR_ERP_BASE_URL and REPLACE_WITH_ERP_API_TOKEN.',
      '3. Add a "Code by Zapier → Run Javascript" step and paste the KPI mapping code from step 3. Adjust field names. Output is { slug, values: { kpiId: value } } — the ISC API does NOT accept an array.',
      '4. Add a "Webhooks by Zapier → POST" step to https://YOUR_ISC_DOMAIN/api/v1/kpis/import. Body: { slug: {{3__slug}}, values: {{3__values}} }. Set x-api-key header (write scope).',
      '5. Add another "Webhooks by Zapier → GET" step for your ERP supplier endpoint.',
      '6. Add another "Code by Zapier" step and paste the supplier mapping code from step 6. Both "id" and "name" are required by ISC.',
      '7. Add a final "Webhooks by Zapier → POST" step to https://YOUR_ISC_DOMAIN/api/v1/suppliers/import. Body: { suppliers: {{6__suppliers}} }.',
      '8. No ISC webhook registration needed — this Zap is triggered by Zapier\'s own scheduler.',
      '9. Turn the Zap ON.',
    ],
    ar: [
      '١. في Zapier، أنشئ Zap جديداً. اختر "Schedule by Zapier → Every Day" وعيّن الوقت 02:00.',
      '٢. أضف خطوة "Webhooks GET" لنقطة نهاية KPIs في ERP. استبدل YOUR_ERP_BASE_URL وREPLACE_WITH_ERP_API_TOKEN.',
      '٣. أضف خطوة "Code by Zapier" والصق كود تعيين KPIs من الخطوة 3. عدّل أسماء الحقول.',
      '٤. أضف "Webhooks POST" إلى https://YOUR_ISC_DOMAIN/api/v1/kpis/import مع مفتاح API بصلاحية كتابة.',
      '٥. أضف خطوة "Webhooks GET" لنقطة نهاية الموردين في ERP.',
      '٦. أضف خطوة "Code by Zapier" أخرى للموردين. عدّل أسماء الحقول.',
      '٧. أضف "Webhooks POST" أخير إلى https://YOUR_ISC_DOMAIN/api/v1/suppliers/import.',
      '٨. لا حاجة لتسجيل ويب-هوك في ISC — الـ Zap يُشغَّل بمجدول Zapier.',
      '٩. شغّل الـ Zap.',
    ],
  },
  'zapier-escalation-router': {
    en: [
      '1. In Zapier, create a new Zap. Choose "Webhooks by Zapier" → "Catch Hook".',
      '2. Copy the Catch Hook URL and register it in ISC → Admin → Integration Hub → Webhooks with event "kpi.threshold_breach".',
      '3. Add a Filter step: continue only if severity (Text) Exactly matches "critical".',
      '4. Create a Google Sheet named "TeamLeads" with columns: KPI_Category (A), Name (B), Email (C). Fill in your team leads.',
      '5. Add a "Google Sheets → Lookup Spreadsheet Row" step. Set lookup column to KPI_Category and value to {{1__data__kpiCategory}}.',
      '6. Add a "Linear → Create Issue" step. Replace REPLACE_WITH_LINEAR_TEAM_ID and connect your Linear account. Or swap for a Jira action.',
      '7. Add a Gmail action. Set To = {{3__Email}}. Replace YOUR_ISC_DOMAIN.',
      '8. Turn the Zap ON.',
    ],
    ar: [
      '١. في Zapier، أنشئ Zap جديداً. اختر "Webhooks by Zapier" ← "Catch Hook".',
      '٢. انسخ الرابط وسجّله في ISC ← مركز التكاملات بحدث "kpi.threshold_breach".',
      '٣. أضف Filter: استمر فقط إذا كانت severity تطابق "critical".',
      '٤. أنشئ Google Sheet باسم "TeamLeads" بأعمدة: KPI_Category (A)، Name (B)، Email (C).',
      '٥. أضف "Google Sheets → Lookup Spreadsheet Row". عيّن عمود البحث KPI_Category والقيمة {{1__data__kpiCategory}}.',
      '٦. أضف "Linear → Create Issue". استبدل REPLACE_WITH_LINEAR_TEAM_ID واربط حساب Linear. أو استخدم Jira.',
      '٧. أضف إجراء Gmail. عيّن To = {{3__Email}}. استبدل YOUR_ISC_DOMAIN.',
      '٨. شغّل الـ Zap.',
    ],
  },
  /* ── n8n ── */
  'lead-nurture-sequence': {
    en: [
      '1. Import this JSON into n8n: Menu → Workflows → Import from file.',
      '2. Connect your Gmail credential (Credentials → New → Gmail OAuth2).',
      '3. Copy the Webhook URL shown at the top of the Webhook node.',
      '4. In ISC → Admin → Integration Hub → Webhooks, create a webhook with event "lead.captured" and paste that URL.',
      '5. Replace YOUR_ISC_DOMAIN and YOUR_CALENDAR_LINK placeholders in the email nodes.',
      '6. Activate the workflow using the toggle at the top right.',
    ],
    ar: [
      '١. استورد ملف JSON في n8n: القائمة ← سير العمل ← استيراد من ملف.',
      '٢. ربط بيانات اعتماد Gmail (بيانات الاعتماد ← جديد ← Gmail OAuth2).',
      '٣. انسخ عنوان URL للويب-هوك من أعلى عقدة Webhook.',
      '٤. في ISC ← الإدارة ← مركز التكاملات ← الويب-هوك، أضف ويب-هوك بحدث "lead.captured" والصق الرابط.',
      '٥. استبدل YOUR_ISC_DOMAIN وYOUR_CALENDAR_LINK في عقد البريد الإلكتروني.',
      '٦. فعّل سير العمل باستخدام مفتاح التبديل.',
    ],
  },
  'kpi-breach-alert': {
    en: [
      '1. Import the JSON into n8n.',
      '2. Connect Gmail and Twilio credentials (or replace Twilio with your SMS provider).',
      '3. Paste your Slack Incoming Webhook URL into the Slack HTTP node.',
      '4. Register the n8n Webhook URL in ISC → Integration Hub with event "kpi.threshold_breach".',
      '5. Replace placeholder phone numbers and alert email address.',
      '6. Activate the workflow.',
    ],
    ar: [
      '١. استورد ملف JSON في n8n.',
      '٢. اربط بيانات اعتماد Gmail وTwilio (أو استبدل Twilio بمزود SMS آخر).',
      '٣. الصق رابط Slack Incoming Webhook في عقدة HTTP.',
      '٤. سجّل رابط Webhook في ISC ← مركز التكاملات بحدث "kpi.threshold_breach".',
      '٥. استبدل أرقام الهاتف وعنوان البريد الإلكتروني.',
      '٦. فعّل سير العمل.',
    ],
  },
  'weekly-kpi-digest': {
    en: [
      '1. Import the JSON into n8n.',
      '2. Connect your Gmail credential.',
      '3. Replace YOUR_ISC_DOMAIN in the Code and Email nodes.',
      '4. Register the Webhook URL in ISC → Integration Hub with event "schedule.weekly_kpi_digest".',
      '5. ISC fires this every Monday automatically — no n8n cron needed.',
      '6. Activate the workflow.',
    ],
    ar: [
      '١. استورد ملف JSON في n8n.',
      '٢. اربط بيانات اعتماد Gmail.',
      '٣. استبدل YOUR_ISC_DOMAIN في عقدتَي الكود والبريد.',
      '٤. سجّل رابط Webhook في ISC بحدث "schedule.weekly_kpi_digest".',
      '٥. تُرسل ISC هذا الحدث كل يوم اثنين تلقائياً.',
      '٦. فعّل سير العمل.',
    ],
  },
  'new-user-welcome': {
    en: [
      '1. Import the JSON into n8n.',
      '2. Connect your Gmail credential.',
      '3. Replace YOUR_ISC_DOMAIN in the Code node (platformUrl variable).',
      '4. Register the Webhook URL in ISC → Integration Hub with event "user.registered".',
      '5. The email language is chosen automatically from the "lang" field in the payload (en or ar).',
      '6. Activate the workflow.',
    ],
    ar: [
      '١. استورد ملف JSON في n8n.',
      '٢. اربط بيانات اعتماد Gmail.',
      '٣. استبدل YOUR_ISC_DOMAIN في متغير platformUrl بعقدة الكود.',
      '٤. سجّل رابط Webhook في ISC بحدث "user.registered".',
      '٥. تُختار لغة البريد تلقائياً من حقل "lang" في الحمولة.',
      '٦. فعّل سير العمل.',
    ],
  },
  'ai-plan-ready-notification': {
    en: [
      '1. Import the JSON into n8n.',
      '2. Connect your Gmail credential.',
      '3. Replace YOUR_ISC_DOMAIN in both nodes.',
      '4. For WhatsApp, replace REPLACE_WITH_WHATSAPP_TOKEN; otherwise disable that node.',
      '5. Register the Webhook URL in ISC → Integration Hub with event "ai_plan.generated".',
      '6. Activate the workflow.',
    ],
    ar: [
      '١. استورد ملف JSON في n8n.',
      '٢. اربط بيانات اعتماد Gmail.',
      '٣. استبدل YOUR_ISC_DOMAIN في كلتا العقدتين.',
      '٤. لـ WhatsApp، استبدل REPLACE_WITH_WHATSAPP_TOKEN أو عطّل تلك العقدة.',
      '٥. سجّل رابط Webhook في ISC بحدث "ai_plan.generated".',
      '٦. فعّل سير العمل.',
    ],
  },
  'monthly-supplier-scorecard': {
    en: [
      '1. Import the JSON into n8n.',
      '2. Connect your Gmail credential.',
      '3. Replace YOUR_ISC_DOMAIN and REPLACE_WITH_ISC_API_KEY in the HTTP Request node.',
      '4. Register the Webhook URL in ISC → Integration Hub with event "schedule.monthly_scorecard".',
      '5. ISC fires this on the 1st of each month automatically.',
      '6. Activate the workflow.',
    ],
    ar: [
      '١. استورد ملف JSON في n8n.',
      '٢. اربط بيانات اعتماد Gmail.',
      '٣. استبدل YOUR_ISC_DOMAIN وREPLACE_WITH_ISC_API_KEY في عقدة HTTP.',
      '٤. سجّل رابط Webhook في ISC بحدث "schedule.monthly_scorecard".',
      '٥. تُرسل ISC هذا الحدث في أول كل شهر تلقائياً.',
      '٦. فعّل سير العمل.',
    ],
  },
  'erp-data-sync': {
    en: [
      '1. Import the JSON into n8n.',
      '2. Replace YOUR_ERP_BASE_URL and REPLACE_WITH_ERP_API_TOKEN with your ERP credentials.',
      '3. Replace YOUR_ISC_DOMAIN and REPLACE_WITH_ISC_API_KEY with an ISC API key that has write scope.',
      '4. Review the Code mapping nodes and adjust field names to match your ERP\'s response schema.',
      '5. This workflow uses an n8n Schedule Trigger (daily at 02:00 UTC) — no ISC webhook registration needed.',
      '6. Activate the workflow.',
    ],
    ar: [
      '١. استورد ملف JSON في n8n.',
      '٢. استبدل YOUR_ERP_BASE_URL وREPLACE_WITH_ERP_API_TOKEN ببيانات ERP الخاصة بك.',
      '٣. استبدل YOUR_ISC_DOMAIN وREPLACE_WITH_ISC_API_KEY بمفتاح API للكتابة.',
      '٤. راجع عقد تعيين الحقول وعدّل أسماء الخصائص لتتطابق مع مخطط ERP.',
      '٥. يستخدم سير العمل مشغّلاً مجدولاً في n8n — لا حاجة لتسجيل ويب-هوك في ISC.',
      '٦. فعّل سير العمل.',
    ],
  },
  'escalation-router': {
    en: [
      '1. Import the JSON into n8n.',
      '2. Create a Google Sheet named "TeamLeads" with columns: KPI_Category, Name, Email.',
      '3. Connect your Google Sheets OAuth2 credential and set the Sheet ID.',
      '4. Replace REPLACE_WITH_LINEAR_API_KEY and REPLACE_WITH_LINEAR_TEAM_ID (or swap the HTTP node for a Jira node).',
      '5. Connect your Gmail credential and replace YOUR_ISC_DOMAIN.',
      '6. Register the Webhook URL in ISC → Integration Hub with event "kpi.threshold_breach".',
      '7. This workflow only escalates "critical" severity — warn events are silently dropped.',
      '8. Activate the workflow.',
    ],
    ar: [
      '١. استورد ملف JSON في n8n.',
      '٢. أنشئ جدول Google Sheets باسم "TeamLeads" بأعمدة: KPI_Category، Name، Email.',
      '٣. اربط بيانات اعتماد Google Sheets وعيّن معرف الجدول.',
      '٤. استبدل REPLACE_WITH_LINEAR_API_KEY وREPLACE_WITH_LINEAR_TEAM_ID (أو استخدم Jira).',
      '٥. اربط بيانات اعتماد Gmail واستبدل YOUR_ISC_DOMAIN.',
      '٦. سجّل رابط Webhook في ISC بحدث "kpi.threshold_breach".',
      '٧. يُصعَّد الحدث فقط للخطورة "critical" — تنبيهات "warn" تُتجاهل.',
      '٨. فعّل سير العمل.',
    ],
  },
};

export function TemplatesTab({ ar }: { ar: boolean }) {
  const [templates, setTemplates] = useState<TemplateManifestItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/admin/automations/templates`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.ok) setTemplates(d.templates as TemplateManifestItem[]);
        else setError(d.error ?? 'Failed to load templates');
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (error) return (
    <p className="text-sm text-red-600 py-4">{error}</p>
  );

  const visible = platformFilter
    ? templates.filter(t => t.platform === platformFilter)
    : templates;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
        <Package className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sm text-indigo-900">
            {ar ? 'مكتبة قوالب الأتمتة — جاهزة للاستيراد' : 'Automation Template Library — Ready to Import'}
          </p>
          <p className="text-xs text-indigo-700 mt-0.5">
            {ar
              ? 'تتوفر القوالب لـ n8n وMake.com وZapier. نزّل أي قالب واتبع دليل الإعداد المرفق.'
              : 'Templates available for n8n, Make.com, and Zapier. Download any template and follow the included setup guide.'}
          </p>
        </div>
      </div>

      {/* Platform filter */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-muted-foreground font-medium">{ar ? 'المنصة:' : 'Platform:'}</span>
        {(['', ...Array.from(new Set(templates.map(t => t.platform))).sort()] as string[]).map(p => {
          const label = p === '' ? (ar ? 'الكل' : 'All') : PLATFORM_LABEL[p]?.en ?? p;
          const active = platformFilter === p;
          return (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                active
                  ? 'bg-primary text-white border-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50 hover:text-primary'
              }`}
            >
              {label}
            </button>
          );
        })}
        <span className="text-xs text-muted-foreground ms-auto">
          {visible.length} / {templates.length} {ar ? 'قالب' : 'templates'}
        </span>
      </div>

      {/* Template cards */}
      <div className="space-y-3">
        {visible.map(t => (
          <TemplateCard key={t.id} template={t} ar={ar} />
        ))}
        {visible.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            {ar ? 'لا توجد قوالب لهذه المنصة.' : 'No templates for this platform.'}
          </p>
        )}
      </div>
    </div>
  );
}

interface ApiKeyMeta {
  id: number;
  nameLabel: string;
  keyPrefix: string;
  scope: string;
  revokedAt: string | null;
}

export function PrepareDownloadModal({
  template,
  ar,
  onClose,
}: {
  template: TemplateManifestItem;
  ar: boolean;
  onClose: () => void;
}) {
  const [domain, setDomain]       = useState(window.location.hostname);
  const [apiKey, setApiKey]       = useState('');
  const [selectedKeyId, setSelectedKeyId] = useState('');
  const [n8nUrl, setN8nUrl]       = useState('');
  const [keys, setKeys]           = useState<ApiKeyMeta[]>([]);
  const [keysLoading, setKeysLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const rawUrl = `${API_BASE.replace('/api', '')}/public/${template.downloadPath}`;

  useEffect(() => {
    fetch(`${API_BASE}/integrations/keys`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          const active = (d.keys as ApiKeyMeta[]).filter(k => !k.revokedAt);
          setKeys(active);
        }
      })
      .catch(() => {})
      .finally(() => setKeysLoading(false));
  }, []);

  const handleDownload = async () => {
    if (!apiKey.trim()) {
      setError(ar ? 'أدخل قيمة مفتاح API' : 'Please enter an API key value');
      return;
    }
    setError(null);
    setDownloading(true);
    try {
      const resp = await fetch(rawUrl, { credentials: 'include' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      let text = await resp.text();

      // Replace known placeholders
      text = applyTemplatePlaceholders(text, {
        apiKey,
        domain,
        n8nUrl,
        fallbackHostname: window.location.hostname,
      });

      const blob = new Blob([text], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = template.filename;
      a.click();
      URL.revokeObjectURL(url);
      onClose();
    } catch (e) {
      setError(ar ? 'تعذّر تنزيل القالب' : 'Failed to fetch template — please try again');
    } finally {
      setDownloading(false);
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md space-y-5 p-6" dir={ar ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-bold text-base text-primary">
              {ar ? 'تجهيز القالب للتنزيل' : 'Prepare & Download Template'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {ar
                ? 'سيتم استبدال العناصر النائبة بالقيم التي تدخلها — كل شيء يحدث في متصفحك فقط.'
                : 'Placeholders are replaced in your browser — nothing is sent back to the server.'}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-primary transition-colors text-lg leading-none mt-0.5">✕</button>
        </div>

        {/* ISC Domain */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            {ar ? 'نطاق ISC' : 'ISC Domain'}
          </label>
          <Input
            value={domain}
            onChange={e => setDomain(e.target.value)}
            placeholder={window.location.hostname}
            className="text-sm"
          />
          <p className="text-xs text-muted-foreground">
            {ar ? 'يُستبدل بـ YOUR_ISC_DOMAIN في القالب' : 'Replaces YOUR_ISC_DOMAIN in the template'}
          </p>
        </div>

        {/* API Key select + paste */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            {ar ? 'مفتاح ISC API' : 'ISC API Key'}
          </label>
          {keysLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              {ar ? 'جارٍ تحميل المفاتيح…' : 'Loading keys…'}
            </div>
          ) : keys.length > 0 ? (
            <select
              className="w-full h-9 text-sm border border-border rounded-md px-2 bg-white mb-1"
              value={selectedKeyId}
              onChange={e => setSelectedKeyId(e.target.value)}
            >
              <option value="">{ar ? '— اختر مفتاحاً للمرجع —' : '— Select a key for reference —'}</option>
              {keys.map(k => (
                <option key={k.id} value={String(k.id)}>
                  {k.nameLabel} ({k.keyPrefix}) · {k.scope}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-1">
              {ar
                ? 'لا توجد مفاتيح نشطة. أنشئ واحداً في مركز التكاملات أولاً.'
                : 'No active keys found. Create one in Integration Hub first.'}
            </p>
          )}
          <Input
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder={ar ? 'الصق قيمة المفتاح هنا…' : 'Paste the raw key value here…'}
            className="text-sm font-mono"
            type="password"
          />
          <p className="text-xs text-muted-foreground">
            {ar
              ? 'المفتاح الخام يظهر مرة واحدة عند الإنشاء. يُستبدل بـ REPLACE_WITH_ISC_API_KEY.'
              : 'The raw key is shown once at creation. Replaces REPLACE_WITH_ISC_API_KEY.'}
          </p>
        </div>

        {/* n8n Instance URL — only relevant for n8n templates */}
        {template.platform !== 'make' && template.platform !== 'zapier' && (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              {ar ? 'عنوان n8n (اختياري)' : 'n8n Instance URL (optional)'}
            </label>
            <Input
              value={n8nUrl}
              onChange={e => setN8nUrl(e.target.value)}
              placeholder="https://your-n8n.example.com"
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {ar ? 'يُستبدل بـ YOUR_N8N_INSTANCE_URL إن وُجد' : 'Replaces YOUR_N8N_INSTANCE_URL if present'}
            </p>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onClose} disabled={downloading}>
            {ar ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button size="sm" onClick={handleDownload} disabled={downloading}>
            {downloading
              ? <Loader2 className="w-3.5 h-3.5 animate-spin me-1.5" />
              : <Download className="w-3.5 h-3.5 me-1.5" />}
            {ar ? 'تنزيل القالب' : 'Download Template'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Flow preview helpers ────────────────────────────────────────────────── */

const NODE_DESCS: Array<{ match: RegExp; en: string; ar: string; icon: React.ElementType }> = [
  { match: /schedule trigger/i,          icon: Calendar, en: 'Fires the flow on a cron schedule (no ISC webhook needed)',          ar: 'يُشغّل التدفق وفق جدول Cron دون ويب-هوك' },
  { match: /custom webhook|catch hook|webhooks by zapier/i, icon: Radio,   en: 'Catches the ISC event payload via HTTP POST',    ar: 'يلتقط حمولة حدث ISC عبر HTTP POST' },
  { match: /webhook/i,                   icon: Radio,    en: 'Receives the ISC event payload via HTTP POST',                        ar: 'يستقبل حمولة حدث ISC عبر HTTP POST' },
  { match: /wait/i,                      icon: Clock,    en: 'Pauses the flow for a set duration',                                 ar: 'يوقف التدفق لمدة محددة' },
  { match: /if \(critical only\)/i,      icon: Server,   en: 'Only continues for critical-severity breaches',                      ar: 'يتابع فقط للانتهاكات الحرجة' },
  { match: /^if$/i,                      icon: Server,   en: 'Branches the flow based on a condition',                             ar: 'يشعّب التدفق بناءً على شرط' },
  { match: /switch/i,                    icon: Server,   en: 'Routes the flow to one of several branches',                         ar: 'يوجّه التدفق إلى أحد الفروع' },
  { match: /basic router/i,             icon: Server,   en: 'Splits the flow into parallel routes',                                ar: 'يقسّم التدفق إلى مسارات متوازية' },
  { match: /filter/i,                    icon: Server,   en: 'Continues only if the filter condition is met',                       ar: 'يتابع فقط إذا تحقق شرط التصفية' },
  { match: /http request \(slack\)/i,    icon: Zap,      en: 'Posts a message to a Slack channel',                                  ar: 'يرسل رسالة إلى قناة Slack' },
  { match: /http request \(twilio\)/i,   icon: Zap,      en: 'Sends an SMS via Twilio',                                             ar: 'يرسل رسالة نصية SMS عبر Twilio' },
  { match: /http request \(whatsapp\)/i, icon: Zap,      en: 'Sends a WhatsApp message via the API',                                ar: 'يرسل رسالة WhatsApp عبر API' },
  { match: /http request \(erp\)/i,      icon: Zap,      en: 'Fetches data from your ERP REST API',                                 ar: 'يجلب البيانات من واجهة ERP' },
  { match: /http request \(isc kpis\)/i, icon: Zap,      en: 'Imports KPI values into ISC via the API',                             ar: 'يستورد قيم KPI إلى ISC عبر API' },
  { match: /http request \(isc suppliers\)/i, icon: Zap, en: 'Imports supplier data into ISC via the API',                          ar: 'يستورد بيانات الموردين إلى ISC عبر API' },
  { match: /http request \(pdf convert\)/i, icon: Zap,   en: 'Converts the HTML report to a PDF attachment',                        ar: 'يحوّل التقرير HTML إلى مرفق PDF' },
  { match: /http request \(linear\/jira\)/i, icon: Zap,  en: 'Creates a ticket in Linear or Jira',                                  ar: 'ينشئ تذكرة في Linear أو Jira' },
  { match: /http request \(isc api\)/i,  icon: Zap,      en: 'Calls the ISC REST API to fetch data',                                ar: 'يستدعي ISC API لجلب البيانات' },
  { match: /http \(slack\)/i,            icon: Zap,      en: 'Posts a message to a Slack channel',                                  ar: 'يرسل رسالة إلى قناة Slack' },
  { match: /http \(twilio\)/i,           icon: Zap,      en: 'Sends an SMS via Twilio',                                             ar: 'يرسل رسالة نصية SMS عبر Twilio' },
  { match: /webhooks post/i,             icon: Zap,      en: 'POSTs data to an external webhook URL',                               ar: 'يرسل البيانات إلى ويب-هوك خارجي' },
  { match: /http/i,                      icon: Zap,      en: 'Makes an HTTP call to an external service',                           ar: 'يُجري طلب HTTP لخدمة خارجية' },
  { match: /gmail \(en\)/i,              icon: Server,   en: 'Sends the English-language welcome email via Gmail',                  ar: 'يرسل البريد الترحيبي الإنجليزي عبر Gmail' },
  { match: /gmail \(ar\)/i,              icon: Server,   en: 'Sends the Arabic-language welcome email via Gmail',                   ar: 'يرسل البريد الترحيبي العربي عبر Gmail' },
  { match: /gmail/i,                     icon: Server,   en: 'Sends an email via the connected Gmail account',                      ar: 'يرسل بريداً عبر حساب Gmail المربوط' },
  { match: /sms by zapier/i,             icon: Radio,    en: "Sends an SMS via Zapier's built-in SMS action",                       ar: 'يرسل SMS عبر إجراء Zapier المدمج' },
  { match: /code by zapier/i,            icon: Server,   en: 'Runs JavaScript to build the email HTML body',                        ar: 'ينفّذ JavaScript لبناء جسم البريد HTML' },
  { match: /code \(field mapping\)/i,    icon: Server,   en: 'Maps ERP field names to ISC schema',                                  ar: 'يعيّن حقول ERP إلى مخطط ISC' },
  { match: /code/i,                      icon: Server,   en: 'Runs a JavaScript snippet to format or transform data',               ar: 'ينفّذ كود JavaScript لمعالجة البيانات' },
  { match: /google sheets/i,             icon: BookOpen, en: 'Looks up the responsible team lead from a Google Sheet',              ar: 'يبحث عن مسؤول الفريق في Google Sheets' },
  { match: /set variable/i,              icon: Server,   en: 'Sets variables (e.g. builds the email HTML body)',                    ar: 'يضبط متغيرات مثل بناء جسم بريد HTML' },
  { match: /email/i,                     icon: Server,   en: 'Sends an email',                                                      ar: 'يرسل بريداً إلكترونياً' },
];

function describeNode(name: string, ar: boolean): { desc: string; Icon: React.ElementType } {
  for (const entry of NODE_DESCS) {
    if (entry.match.test(name)) return { desc: ar ? entry.ar : entry.en, Icon: entry.icon };
  }
  return { desc: ar ? 'عقدة معالجة أو تحويل' : 'Processing or transformation node', Icon: Server };
}

function FlowPreview({ nodes, ar }: { nodes: string[]; ar: boolean }) {
  return (
    <div>
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
        {ar ? 'معاينة التدفق' : 'Flow preview'}
      </p>
      <div className="relative">
        {nodes.map((name, i) => {
          const { desc, Icon } = describeNode(name, ar);
          const isLast = i === nodes.length - 1;
          return (
            <div key={i} className="flex gap-3 items-start">
              {/* connector column */}
              <div className="flex flex-col items-center shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                </div>
                {!isLast && <div className="w-0.5 bg-border flex-1 min-h-[18px] my-0.5" />}
              </div>
              {/* content column */}
              <div className={`min-w-0 ${isLast ? 'pb-0' : 'pb-3'}`}>
                <p className="text-xs font-semibold text-slate-800 font-mono leading-tight">{name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TemplateCard({ template: t, ar }: { template: TemplateManifestItem; ar: boolean }) {
  const [open, setOpen] = useState(false);
  const [prepareOpen, setPrepareOpen] = useState(false);
  const badgeClass = CATEGORY_BADGE[t.category] ?? 'bg-slate-100 text-slate-600';
  const guide = SETUP_GUIDES[t.id];
  const steps = ar ? (guide?.ar ?? guide?.en ?? []) : (guide?.en ?? []);
  const platformInfo = PLATFORM_LABEL[t.platform] ?? PLATFORM_LABEL['n8n'];
  const nodesLabel = NODES_LABEL[t.platform] ?? NODES_LABEL['n8n'];

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {prepareOpen && (
        <PrepareDownloadModal template={t} ar={ar} onClose={() => setPrepareOpen(false)} />
      )}
      {/* Card header */}
      <div className="flex items-center gap-3 px-4 py-3.5 bg-white">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <p className="font-semibold text-sm text-primary">{ar ? t.nameAr : t.name}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${badgeClass}`}>{t.category}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${platformInfo.color}`}>
              {ar ? platformInfo.ar : platformInfo.en}
            </span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{ar ? t.descriptionAr : t.description}</p>
          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">{t.triggerEvent}</code>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {ar ? `${t.setupTimeMinutes} دقائق إعداد` : `~${t.setupTimeMinutes} min setup`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setPrepareOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            {ar ? 'تجهيز وتنزيل' : 'Prepare & Download'}
          </button>
          <button
            onClick={() => setOpen(v => !v)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-slate-50 transition-colors text-muted-foreground"
            title={ar ? 'دليل الإعداد' : 'Setup guide'}
          >
            {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {ar ? 'الإعداد' : 'Setup'}
          </button>
        </div>
      </div>

      {/* Expanded setup guide */}
      {open && (
        <div className="border-t border-border bg-slate-50/60 px-4 py-4 space-y-4">
          {/* Flow preview */}
          <FlowPreview nodes={t.nodes} ar={ar} />

          {/* Nodes / modules / steps used */}
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
              {ar ? nodesLabel.ar : nodesLabel.en}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {t.nodes.map(n => (
                <span key={n} className="text-xs bg-white border border-border px-2 py-0.5 rounded-md font-mono text-slate-600">
                  {n}
                </span>
              ))}
            </div>
          </div>

          {/* Step-by-step guide */}
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
              {ar ? 'خطوات الإعداد' : 'Setup steps'}
            </p>
            {steps.length > 0 ? (
              <ol className="space-y-1.5">
                {steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step.replace(/^\d+\.\s*/, '').replace(/^[٠-٩]+\.\s*/, '')}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                {ar ? 'افتح الملف المنزَّل للاطلاع على تعليمات الإعداد.' : 'Open the downloaded file for setup instructions.'}
              </p>
            )}
          </div>

          {/* Trigger event hint */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            <Server className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
            <span>
              {t.triggerEvent === 'cron.daily' ? (
                ar
                  ? 'هذا سير عمل بمشغّل مجدول داخلي — لا يلزم تسجيل ويب-هوك في ISC.'
                  : 'This workflow uses a built-in Schedule Trigger — no ISC webhook registration needed.'
              ) : (
                ar
                  ? `سجّل عنوان URL للويب-هوك في ISC → الإدارة → مركز التكاملات → الويب-هوك باستخدام الحدث "${t.triggerEvent}".`
                  : `Register the webhook URL in ISC → Admin → Integration Hub → Webhooks using event "${t.triggerEvent}".`
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
