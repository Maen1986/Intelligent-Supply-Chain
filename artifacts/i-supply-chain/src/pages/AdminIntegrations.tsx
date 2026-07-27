/**
 * AdminIntegrations — Integration Hub
 * Route: /admin/integrations
 *
 * Sections:
 *   1. API Keys  — generate, list, revoke
 *   2. Webhooks  — add, list, test, delete
 *   3. Activity  — last 20 webhook delivery attempts
 *   4. API Reference — quick copy-paste guide for external callers
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Key, Plus, Trash2, Webhook, RefreshCw, Copy, Check,
  ChevronRight, Loader2, ShieldAlert, Activity, BookOpen,
  ArrowLeft, Eye, EyeOff, Zap,
} from 'lucide-react';
import { API_BASE } from '@/lib/apiBase';

/* ─── types ─────────────────────────────────────────────────────────────── */
interface ApiKeyRow {
  id:         number;
  nameLabel:  string;
  keyPrefix:  string;
  scope:      string;
  createdAt:  string;
  lastUsedAt: string | null;
  revokedAt:  string | null;
}
interface WebhookRow {
  id:        number;
  url:       string;
  events:    string[];
  createdAt: string;
}
interface ActivityRow {
  id:             number;
  event:          string;
  status_code:    number | null;
  success:        string;
  response_snippet: string | null;
  attempted_at:   string;
  url:            string;
}

const ALL_EVENTS = [
  { id: 'supplier.tier_changed',    label: 'Supplier tier changed'    },
  { id: 'kpi.rag_changed',          label: 'KPI RAG status changed'   },
  { id: 'kri.threshold_breached',   label: 'KRI threshold breached'   },
];

/* ─── utility ──────────────────────────────────────────────────────────── */
function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); }}
      className="ml-1 inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
      title="Copy"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
export function AdminIntegrations() {
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
        <p className="text-lg font-bold text-primary">Admin access required</p>
        <Link href="/admin" className="text-sm text-primary underline">← Back to Admin</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8" dir={ar ? 'rtl' : 'ltr'}>
      {/* ── Page header ── */}
      <div className="flex items-center gap-4">
        <Link href="/admin/leads" className="text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Zap className="w-6 h-6" />
            Integration Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            REST API keys, outbound webhooks, and delivery activity
          </p>
        </div>
      </div>

      {/* ── Admin nav tabs ── */}
      <nav className="flex gap-2 border-b border-border pb-2 text-sm">
        <Link href="/admin/leads" className="px-3 py-1.5 rounded-t-md text-muted-foreground hover:text-primary transition-colors font-medium">
          Leads &amp; Submissions
        </Link>
        <Link href="/customer-voice" className="px-3 py-1.5 rounded-t-md text-muted-foreground hover:text-primary transition-colors font-medium">
          Customer Voice
        </Link>
        <span className="px-3 py-1.5 rounded-t-md bg-primary text-white font-semibold">
          Integration Hub
        </span>
      </nav>

      <ApiKeysSection />
      <WebhooksSection />
      <ActivitySection />
      <ApiReferenceSection />
    </div>
  );
}

/* ─── API Keys section ──────────────────────────────────────────────────── */
function ApiKeysSection() {
  const [keys, setKeys]         = useState<ApiKeyRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [newName, setNewName]   = useState('');
  const [newScope, setNewScope] = useState<'write' | 'read'>('write');
  const [creating, setCreating] = useState(false);
  const [rawKey, setRawKey]     = useState<string | null>(null);
  const [showRaw, setShowRaw]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/integrations/keys`, { credentials: 'include' });
      const d = await r.json();
      if (d.ok) setKeys(d.keys);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true); setError(null);
    try {
      const r = await fetch(`${API_BASE}/integrations/keys`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nameLabel: newName.trim(), scope: newScope }),
      });
      const d = await r.json();
      if (d.ok) { setRawKey(d.key.rawKey); setShowRaw(true); setNewName(''); load(); }
      else { setError(d.error ?? 'Failed to create key'); }
    } finally { setCreating(false); }
  };

  const handleRevoke = async (id: number) => {
    if (!confirm('Revoke this API key? Any integrations using it will stop working immediately.')) return;
    await fetch(`${API_BASE}/integrations/keys/${id}`, { method: 'DELETE', credentials: 'include' });
    load();
  };

  return (
    <section className="border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 bg-slate-50 border-b border-border">
        <Key className="w-4 h-4 text-primary" />
        <h2 className="font-bold text-sm text-primary uppercase tracking-widest">API Keys</h2>
      </div>
      <div className="p-5 space-y-5">
        <p className="text-xs text-muted-foreground">
          API keys allow external systems (ERP, scripts, cron jobs) to authenticate with the{' '}
          <code className="bg-slate-100 px-1 rounded">/api/v1/*</code> endpoints using{' '}
          <code className="bg-slate-100 px-1 rounded">Authorization: Bearer &lt;key&gt;</code>.
          The raw key is shown only once at creation.
        </p>

        {/* Raw key reveal */}
        {rawKey && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-2">
            <p className="text-xs font-bold text-emerald-800">✓ New API key created — copy it now, it won&apos;t be shown again.</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-white border border-emerald-200 rounded px-3 py-2 font-mono break-all select-all">
                {showRaw ? rawKey : '•'.repeat(rawKey.length)}
              </code>
              <button onClick={() => setShowRaw(s => !s)} className="shrink-0 p-2 rounded-lg bg-slate-100 hover:bg-slate-200">
                {showRaw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <CopyButton value={rawKey} />
            </div>
            <button onClick={() => setRawKey(null)} className="text-xs text-emerald-700 underline">Dismiss</button>
          </div>
        )}

        {/* Generate form */}
        <form onSubmit={handleCreate} className="space-y-3 bg-slate-50 rounded-lg p-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="keyName" className="text-xs text-muted-foreground mb-1 block">Key name / label</Label>
              <Input
                id="keyName"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. SAP Production"
                className="text-sm h-8"
                disabled={creating}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" size="sm" disabled={creating || !newName.trim()} className="h-8 text-xs">
                {creating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                Generate
              </Button>
            </div>
          </div>
          {/* Scope toggle */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Scope</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setNewScope('write')}
                className={`text-xs px-3 py-1.5 rounded-md border font-medium transition-colors ${newScope === 'write' ? 'bg-primary text-white border-primary' : 'bg-white text-muted-foreground border-border hover:border-primary/50'}`}
              >
                Read + Write
              </button>
              <button
                type="button"
                onClick={() => setNewScope('read')}
                className={`text-xs px-3 py-1.5 rounded-md border font-medium transition-colors ${newScope === 'read' ? 'bg-primary text-white border-primary' : 'bg-white text-muted-foreground border-border hover:border-primary/50'}`}
              >
                Read-only
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {newScope === 'read'
                ? 'Read-only keys can call GET endpoints only — POST/PUT/DELETE requests will be rejected.'
                : 'Read + Write keys have full access to all API endpoints.'}
            </p>
          </div>
        </form>
        {error && <p className="text-xs text-red-600">{error}</p>}

        {/* Keys table */}
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : keys.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No API keys yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[500px]">
              <thead>
                <tr className="border-b border-border bg-slate-50/60">
                  <th className="text-left py-2 px-3 font-bold text-muted-foreground">Name</th>
                  <th className="text-left py-2 px-3 font-bold text-muted-foreground">Prefix</th>
                  <th className="text-left py-2 px-3 font-bold text-muted-foreground">Scope</th>
                  <th className="text-left py-2 px-3 font-bold text-muted-foreground">Created</th>
                  <th className="text-left py-2 px-3 font-bold text-muted-foreground">Last used</th>
                  <th className="text-left py-2 px-3 font-bold text-muted-foreground">Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {keys.map(k => (
                  <tr key={k.id} className={`border-b border-border/50 ${k.revokedAt ? 'opacity-50' : ''}`}>
                    <td className="py-2 px-3 font-medium">{k.nameLabel}</td>
                    <td className="py-2 px-3 font-mono text-muted-foreground">{k.keyPrefix}</td>
                    <td className="py-2 px-3">
                      {k.scope === 'read'
                        ? <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold">Read-only</span>
                        : <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full font-bold">Read+Write</span>}
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">{fmtDate(k.createdAt)}</td>
                    <td className="py-2 px-3 text-muted-foreground">{fmtDate(k.lastUsedAt)}</td>
                    <td className="py-2 px-3">
                      {k.revokedAt
                        ? <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-bold">Revoked</span>
                        : <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold">Active</span>}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {!k.revokedAt && (
                        <button onClick={() => handleRevoke(k.id)} className="text-red-500 hover:text-red-700 p-1 rounded" title="Revoke">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── Webhooks section ──────────────────────────────────────────────────── */
function WebhooksSection() {
  const [webhooks, setWebhooks]   = useState<WebhookRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [newUrl, setNewUrl]       = useState('');
  const [newEvents, setNewEvents] = useState<string[]>([]);
  const [adding, setAdding]       = useState(false);
  const [testing, setTesting]     = useState<number | null>(null);
  const [testResult, setTestResult] = useState<{ id: number; msg: string; ok: boolean } | null>(null);
  const [error, setError]         = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/integrations/webhooks`, { credentials: 'include' });
      const d = await r.json();
      if (d.ok) setWebhooks(d.webhooks);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;
    setAdding(true); setError(null);
    try {
      const r = await fetch(`${API_BASE}/integrations/webhooks`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl.trim(), events: newEvents }),
      });
      const d = await r.json();
      if (d.ok) { setNewUrl(''); setNewEvents([]); load(); }
      else { setError(d.error ?? 'Failed to add webhook'); }
    } finally { setAdding(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this webhook URL?')) return;
    await fetch(`${API_BASE}/integrations/webhooks/${id}`, { method: 'DELETE', credentials: 'include' });
    load();
  };

  const handleTest = async (id: number) => {
    setTesting(id); setTestResult(null);
    try {
      const r = await fetch(`${API_BASE}/integrations/webhooks/${id}/test`, {
        method: 'POST', credentials: 'include',
      });
      const d = await r.json();
      const result = d.result;
      setTestResult({
        id,
        ok: result?.success ?? false,
        msg: result?.success
          ? `✓ Delivered (HTTP ${result.statusCode})`
          : `✗ Failed${result?.statusCode ? ` (HTTP ${result.statusCode})` : ''}: ${result?.responseSnippet ?? 'No response'}`,
      });
    } finally { setTesting(null); }
  };

  const toggleEvent = (ev: string) =>
    setNewEvents(prev => prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev]);

  return (
    <section className="border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 bg-slate-50 border-b border-border">
        <Webhook className="w-4 h-4 text-primary" />
        <h2 className="font-bold text-sm text-primary uppercase tracking-widest">Outbound Webhooks</h2>
        <span className="ml-auto text-xs text-muted-foreground">{webhooks.length}/5 configured</span>
      </div>
      <div className="p-5 space-y-5">
        <p className="text-xs text-muted-foreground">
          The platform will POST a JSON payload to each URL when the selected events occur.
          Leave events blank to receive all events.
        </p>

        {/* Add webhook form */}
        {webhooks.length < 5 && (
          <form onSubmit={handleAdd} className="space-y-3 bg-slate-50 rounded-lg p-4">
            <div>
              <Label htmlFor="whUrl" className="text-xs text-muted-foreground mb-1 block">Endpoint URL</Label>
              <Input
                id="whUrl"
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                placeholder="https://your-erp.example.com/webhook"
                className="text-sm h-8"
                disabled={adding}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Subscribe to events (leave empty = all)</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {ALL_EVENTS.map(ev => (
                  <label key={ev.id} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newEvents.includes(ev.id)}
                      onChange={() => toggleEvent(ev.id)}
                      className="rounded"
                    />
                    <span className="text-xs">{ev.label}</span>
                  </label>
                ))}
              </div>
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <Button type="submit" size="sm" disabled={adding || !newUrl.trim()} className="text-xs h-8">
              {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              Add Webhook
            </Button>
          </form>
        )}

        {/* Webhook list */}
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : webhooks.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No webhooks configured.</p>
        ) : (
          <div className="space-y-2">
            {webhooks.map(wh => (
              <div key={wh.id} className="border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <code className="text-xs break-all font-mono text-slate-700">{wh.url}</code>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleTest(wh.id)}
                      disabled={testing === wh.id}
                      className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 font-medium flex items-center gap-1 transition-colors"
                      title="Send test payload"
                    >
                      {testing === wh.id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <Zap className="w-3 h-3" />}
                      Test
                    </button>
                    <button onClick={() => handleDelete(wh.id)} className="text-red-500 hover:text-red-700 p-1 rounded">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {(Array.isArray(wh.events) && wh.events.length > 0)
                    ? wh.events.map(ev => (
                        <span key={ev} className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">{ev}</span>
                      ))
                    : <span className="text-xs text-muted-foreground">All events</span>}
                  <span className="text-xs text-muted-foreground ml-auto">Added {fmtDate(wh.createdAt)}</span>
                </div>
                {testResult?.id === wh.id && (
                  <p className={`text-xs font-medium ${testResult.ok ? 'text-emerald-700' : 'text-red-700'}`}>
                    {testResult.msg}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── Activity Log section ──────────────────────────────────────────────── */
function ActivitySection() {
  const [logs, setLogs]       = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/integrations/activity`, { credentials: 'include' });
      const d = await r.json();
      if (d.ok) setLogs(d.logs);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <section className="border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 bg-slate-50 border-b border-border">
        <Activity className="w-4 h-4 text-primary" />
        <h2 className="font-bold text-sm text-primary uppercase tracking-widest">Activity Log</h2>
        <button onClick={load} className="ml-auto text-muted-foreground hover:text-primary" title="Refresh">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="p-5">
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : logs.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">No webhook deliveries yet. Add a webhook and click Test.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[600px]">
              <thead>
                <tr className="border-b border-border bg-slate-50/60">
                  <th className="text-left py-2 px-3 font-bold text-muted-foreground">When</th>
                  <th className="text-left py-2 px-3 font-bold text-muted-foreground">Event</th>
                  <th className="text-left py-2 px-3 font-bold text-muted-foreground">URL</th>
                  <th className="text-center py-2 px-3 font-bold text-muted-foreground">Status</th>
                  <th className="text-left py-2 px-3 font-bold text-muted-foreground">Response</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b border-border/50">
                    <td className="py-2 px-3 text-muted-foreground whitespace-nowrap">{fmtDate(log.attempted_at)}</td>
                    <td className="py-2 px-3 font-mono">{log.event}</td>
                    <td className="py-2 px-3 text-muted-foreground max-w-[180px] truncate" title={log.url}>{log.url}</td>
                    <td className="py-2 px-3 text-center">
                      {log.success === 'ok'
                        ? <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold">{log.status_code ?? '2xx'}</span>
                        : <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-bold">{log.status_code ?? 'ERR'}</span>}
                    </td>
                    <td className="py-2 px-3 text-muted-foreground max-w-[200px] truncate" title={log.response_snippet ?? ''}>
                      {log.response_snippet || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── API Reference section ─────────────────────────────────────────────── */
function ApiReferenceSection() {
  const apiBase = typeof window !== 'undefined'
    ? `${window.location.origin}${API_BASE}`
    : '/api';

  return (
    <section className="border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 bg-slate-50 border-b border-border">
        <BookOpen className="w-4 h-4 text-primary" />
        <h2 className="font-bold text-sm text-primary uppercase tracking-widest">API Reference</h2>
      </div>
      <div className="p-5 space-y-4 text-xs text-muted-foreground">
        <p>All <code className="bg-slate-100 px-1 rounded">/api/v1/*</code> endpoints require authentication via either a session cookie or an API key header:</p>
        <CodeBlock value={`Authorization: Bearer <your-api-key>`} />

        <h3 className="font-bold text-slate-700 mt-4">GET endpoints</h3>
        <div className="space-y-2">
          {[
            { method: 'GET', path: '/api/v1/suppliers',  desc: 'Full supplier roster' },
            { method: 'GET', path: '/api/v1/kpis',       desc: 'KPI values for your current framework' },
            { method: 'GET', path: '/api/v1/risk-kris',  desc: 'KRI dashboard values' },
            { method: 'GET', path: '/api/v1/spend',      desc: 'Spend Pareto rows' },
            { method: 'GET', path: '/api/v1/training',   desc: 'Training assessment matrix' },
          ].map(e => (
            <div key={e.path} className="flex items-center gap-2 bg-slate-50 rounded px-3 py-2">
              <span className="font-bold text-emerald-700 w-8">{e.method}</span>
              <code className="font-mono flex-1">{e.path}</code>
              <CopyButton value={`curl -H "Authorization: Bearer <key>" ${apiBase.replace('/api', '')}${e.path}`} />
              <span className="text-muted-foreground">{e.desc}</span>
            </div>
          ))}
        </div>

        <h3 className="font-bold text-slate-700 mt-4">POST import endpoints</h3>
        <div className="space-y-2">
          {[
            { path: '/api/v1/suppliers/import', body: '{ "suppliers": [{ "id": "s1", "name": "ACME" }] }' },
            { path: '/api/v1/kpis/import',      body: '{ "slug": "cips", "values": { "kpi-ot": "94.5" } }' },
            { path: '/api/v1/spend/import',     body: '{ "rows": [{ "name": "ACME", "spend": 150000 }] }' },
          ].map(e => (
            <div key={e.path} className="bg-slate-50 rounded px-3 py-2 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-700 w-8">POST</span>
                <code className="font-mono flex-1">{e.path}</code>
              </div>
              <code className="block text-slate-500 pl-10">{e.body}</code>
            </div>
          ))}
        </div>

        <h3 className="font-bold text-slate-700 mt-4">Import response format</h3>
        <CodeBlock value={`{ "ok": true, "imported": 5, "skipped": 1, "errors": ["Row 3: name required"] }`} />

        <h3 className="font-bold text-slate-700 mt-4">Webhook payload format</h3>
        <CodeBlock value={`{
  "event": "supplier.tier_changed",
  "timestamp": "2026-07-26T12:00:00.000Z",
  "data": { /* event-specific payload */ },
  "userId": 42
}`} />
      </div>
    </section>
  );
}

function CodeBlock({ value }: { value: string }) {
  return (
    <div className="relative">
      <pre className="bg-slate-900 text-slate-100 rounded-lg px-4 py-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">{value}</pre>
      <div className="absolute top-2 right-2"><CopyButton value={value} /></div>
    </div>
  );
}
