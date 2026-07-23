import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Shield, Lock, Mail, Download, RefreshCw, Search, LogOut,
  FileText, Users, ClipboardList, CalendarCheck, Gauge, Loader2,
  AlertTriangle, CheckCircle2, ShieldAlert, FileDown,
} from 'lucide-react';

import { API_BASE } from '@/lib/apiBase';

interface Submission {
  id: number;
  tool: string;
  contactName: string | null;
  contactEmail: string | null;
  contactMobile: string | null;
  contactDesignation: string | null;
  contactCompany: string | null;
  createdAt: string;
  emailSentAt: string | null;
  emailError: string | null;
  pdfObjectPath: string | null;
  pdfFilename: string | null;
}

type ResendState =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'error'; message: string };

const TOOLS = [
  { value: 'all',            en: 'All',            ar: 'الكل',            icon: ClipboardList },
  { value: 'command_centre', en: 'Command Centre', ar: 'مركز القيادة',    icon: Gauge },
  { value: 'diagnostic',     en: 'Diagnostic',     ar: 'التشخيص',         icon: Search },
  { value: 'maturity',       en: 'Maturity',       ar: 'النضج',           icon: FileText },
  { value: 'booking',        en: 'Booking',        ar: 'الحجوزات',        icon: CalendarCheck },
  { value: 'lead',           en: 'Leads',          ar: 'العملاء',         icon: Users },
] as const;

export function AdminLeads() {
  const { user, loading: authLoading, logout } = useAuth();
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

  return isAdmin
    ? <LeadsDashboard onLogout={logout} ar={ar} />
    : <AdminLogin ar={ar} />;
}

/* ── Admin sign-in gate ─────────────────────────────────────────────────── */
function AdminLogin({ ar }: { ar: boolean }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [busy, setBusy]         = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(
          data.error === 'Admin sign-in is not configured'
            ? (ar ? 'لم يتم إعداد دخول المسؤول بعد.' : 'Admin sign-in is not configured yet.')
            : (ar ? 'بيانات الدخول غير صحيحة.' : 'Invalid admin credentials.')
        );
        return;
      }
      // Reload so AuthContext re-validates the new admin session.
      window.location.reload();
    } catch {
      setError(ar ? 'تعذّر الاتصال بالخادم.' : 'Could not reach the server.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center bg-gradient-to-br from-[#082C6B] via-[#0B3D91] to-[#1a4fa8] py-12 px-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-[#082C6B] px-8 py-7 text-center">
          <div className="w-14 h-14 bg-[#C9A84C]/20 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-[#C9A84C]/30">
            <Shield className="w-7 h-7 text-[#C9A84C]" />
          </div>
          <h1 className="text-xl font-extrabold text-white">{ar ? 'دخول المسؤول' : 'Admin Access'}</h1>
          <p className="text-white/70 text-sm mt-1">
            {ar ? 'منطقة مخصّصة للمستشار فقط' : 'Restricted area for the consultant'}
          </p>
        </div>
        <form onSubmit={submit} className="px-8 py-7 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium" data-testid="text-admin-error">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">{ar ? 'البريد الإلكتروني' : 'Email'}</Label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input type="email" className="pl-9" value={email} onChange={e => setEmail(e.target.value)} data-testid="input-admin-email" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">{ar ? 'كلمة المرور' : 'Password'}</Label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input type="password" className="pl-9" value={password} onChange={e => setPassword(e.target.value)} data-testid="input-admin-password" />
            </div>
          </div>
          <Button type="submit" disabled={busy || !email || !password}
            className="w-full bg-[#082C6B] hover:bg-[#0B3D91] text-white font-bold h-11 rounded-xl"
            data-testid="button-admin-login">
            {busy ? (ar ? 'جارٍ الدخول…' : 'Signing in…') : (ar ? 'تسجيل الدخول' : 'Sign In')}
          </Button>
        </form>
      </div>
    </div>
  );
}

/* ── Leads dashboard (admin only) ───────────────────────────────────────── */
function LeadsDashboard({ onLogout, ar }: { onLogout: () => Promise<void>; ar: boolean }) {
  const [rows, setRows]       = useState<Submission[] | null>(null);
  const [loadError, setLoadError] = useState<'unauthorized' | 'forbidden' | 'failed' | null>(null);
  const [resend, setResend]   = useState<Record<number, ResendState>>({});
  const [tool, setTool]       = useState<string>('all');
  const [query, setQuery]     = useState('');

  const load = useCallback(async (selectedTool: string) => {
    setLoadError(null);
    setRows(null);
    try {
      const url = selectedTool === 'all'
        ? `${API_BASE}/submissions`
        : `${API_BASE}/submissions/by-tool/${selectedTool}`;
      const res = await fetch(url, { credentials: 'include' });
      if (res.status === 401) { setLoadError('unauthorized'); return; }
      if (res.status === 403) { setLoadError('forbidden'); return; }
      if (!res.ok) { setLoadError('failed'); return; }
      const data = await res.json();
      setRows(data.submissions ?? []);
    } catch {
      setLoadError('failed');
    }
  }, []);

  useEffect(() => { void load(tool); }, [load, tool]);

  const handleResend = async (id: number) => {
    setResend(s => ({ ...s, [id]: { status: 'sending' } }));
    try {
      const res = await fetch(`${API_BASE}/submissions/${id}/resend-email`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.sent) {
        setRows(rs => (rs ?? []).map(r =>
          r.id === id ? { ...r, emailSentAt: data.emailSentAt ?? new Date().toISOString(), emailError: null } : r
        ));
        setResend(s => ({ ...s, [id]: { status: 'idle' } }));
      } else {
        setResend(s => ({
          ...s,
          [id]: { status: 'error', message: data.error || (ar ? 'فشل إعادة الإرسال' : 'Resend failed') },
        }));
      }
    } catch {
      setResend(s => ({
        ...s,
        [id]: { status: 'error', message: ar ? 'تعذّر الاتصال بالخادم' : 'Could not reach the server' },
      }));
    }
  };

  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString(ar ? 'ar' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  const toolLabel = (value: string) => {
    const t = TOOLS.find(t => t.value === value);
    return t ? (ar ? t.ar : t.en) : value;
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !rows) return rows ?? [];
    return rows.filter(r =>
      [r.contactName, r.contactEmail, r.contactCompany, r.contactDesignation]
        .some(v => v?.toLowerCase().includes(q))
    );
  }, [rows, query]);

  const flaggedCount = (rows ?? []).filter(r => r.tool === 'command_centre' && !r.emailSentAt).length;

  return (
    <main className="min-h-screen bg-background pt-28 pb-16" dir={ar ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 max-w-6xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-[#C9A84C]" />
              {ar ? 'العملاء المحتملون' : 'Leads'}
            </h1>
            {rows && (
              <p className="text-sm text-muted-foreground mt-1">
                {ar
                  ? `${rows.length} سجلاً — ${flaggedCount} بريد إحاطة لم يُرسل`
                  : `${rows.length} records — ${flaggedCount} briefing email${flaggedCount === 1 ? '' : 's'} not sent`}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { void load(tool); }} data-testid="button-refresh-leads">
              <RefreshCw className="w-4 h-4 me-2" />
              {ar ? 'تحديث' : 'Refresh'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onLogout().then(() => window.location.reload())} data-testid="button-admin-logout">
              <LogOut className="w-4 h-4 me-2" />
              {ar ? 'خروج' : 'Sign out'}
            </Button>
          </div>
        </div>

        {/* Filters + search */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {TOOLS.map(t => (
            <button
              key={t.value}
              onClick={() => setTool(t.value)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold border transition-colors ${
                tool === t.value
                  ? 'bg-[#082C6B] text-white border-[#082C6B]'
                  : 'bg-white text-muted-foreground border-border hover:border-[#082C6B]/40 hover:text-[#082C6B]'
              }`}
              data-testid={`filter-${t.value}`}
            >
              <t.icon className="w-4 h-4" /> {ar ? t.ar : t.en}
            </button>
          ))}
          <div className="relative ml-auto w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={ar ? 'بحث بالاسم أو الشركة…' : 'Search name, email, company…'}
              value={query}
              onChange={e => setQuery(e.target.value)}
              data-testid="input-search-leads"
            />
          </div>
        </div>

        {/* Error states */}
        {loadError === 'unauthorized' || loadError === 'forbidden' ? (
          <div className="rounded-lg border p-8 text-center">
            <ShieldAlert className="w-10 h-10 mx-auto mb-3 text-destructive" />
            <p className="font-medium mb-1">
              {loadError === 'unauthorized'
                ? (ar ? 'يجب تسجيل الدخول أولاً' : 'Sign in required')
                : (ar ? 'هذه الصفحة للمسؤول فقط' : 'Admin access only')}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {ar ? 'هذه الصفحة متاحة فقط لحساب المسؤول.' : 'This page is only available to the admin account.'}
            </p>
            <Link href="/login"><Button size="sm">{ar ? 'تسجيل الدخول' : 'Sign in'}</Button></Link>
          </div>
        ) : loadError === 'failed' ? (
          <div className="rounded-lg border p-8 text-center text-muted-foreground" data-testid="text-leads-error">
            {ar ? 'تعذّر تحميل السجلات. حاول التحديث.' : 'Could not load leads. Try refreshing.'}
          </div>
        ) : rows === null ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin me-2" />
            {ar ? 'جارٍ التحميل…' : 'Loading…'}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border p-8 text-center text-muted-foreground" data-testid="text-no-leads">
            {ar ? 'لا توجد سجلات.' : 'No leads yet.'}
          </div>
        ) : (
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-start">
                  <th className="px-4 py-3 text-start font-medium">{ar ? 'الاسم' : 'Name'}</th>
                  <th className="px-4 py-3 text-start font-medium">{ar ? 'الشركة' : 'Company'}</th>
                  <th className="px-4 py-3 text-start font-medium">{ar ? 'الأداة' : 'Tool'}</th>
                  <th className="px-4 py-3 text-start font-medium">{ar ? 'التاريخ' : 'Date'}</th>
                  <th className="px-4 py-3 text-start font-medium">{ar ? 'البريد' : 'Email status'}</th>
                  <th className="px-4 py-3 text-start font-medium">{ar ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => {
                  const flagged = row.tool === 'command_centre' && !row.emailSentAt;
                  const state = resend[row.id] ?? { status: 'idle' as const };
                  return (
                    <tr key={row.id} className="border-b last:border-0 align-top" data-testid={`row-lead-${row.id}`}>
                      <td className="px-4 py-3">
                        <div className="font-medium">{row.contactName || '—'}</div>
                        <div className="text-muted-foreground text-xs">{row.contactEmail || '—'}</div>
                      </td>
                      <td className="px-4 py-3">{row.contactCompany || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block rounded bg-muted px-2 py-0.5 text-xs font-semibold">
                          {toolLabel(row.tool)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{fmt(row.createdAt)}</td>
                      <td className="px-4 py-3">
                        {row.tool !== 'command_centre' ? (
                          <span className="text-muted-foreground">—</span>
                        ) : row.emailSentAt ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600" data-testid={`status-sent-${row.id}`}>
                            <CheckCircle2 className="w-4 h-4" />
                            {ar ? 'أُرسل' : 'Sent'} {fmt(row.emailSentAt)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600" data-testid={`status-flagged-${row.id}`}>
                            <AlertTriangle className="w-4 h-4" />
                            {ar ? 'لم يُرسل' : 'Not sent'}
                            {row.emailError && (
                              <span className="text-xs text-muted-foreground ms-1" title={row.emailError}>
                                ({row.emailError.length > 60 ? `${row.emailError.slice(0, 60)}…` : row.emailError})
                              </span>
                            )}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {flagged && (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={state.status === 'sending'}
                              onClick={() => void handleResend(row.id)}
                              data-testid={`button-resend-${row.id}`}
                            >
                              {state.status === 'sending' ? (
                                <Loader2 className="w-4 h-4 me-1 animate-spin" />
                              ) : (
                                <Mail className="w-4 h-4 me-1" />
                              )}
                              {ar ? 'إعادة إرسال البريد' : 'Resend email'}
                            </Button>
                          )}
                          {row.pdfObjectPath && (
                            <a
                              href={`${API_BASE}/submissions/${row.id}/briefing-pdf`}
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                              data-testid={`link-pdf-${row.id}`}
                            >
                              <FileDown className="w-4 h-4" />
                              PDF
                            </a>
                          )}
                        </div>
                        {state.status === 'error' && (
                          <p className="text-xs text-destructive mt-1" data-testid={`error-resend-${row.id}`}>
                            {state.message}
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t text-xs text-muted-foreground">
              {ar ? `${filtered.length} سجل` : `${filtered.length} record${filtered.length === 1 ? '' : 's'}`}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
