import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/LanguageContext';
import {
  RefreshCw, Mail, AlertTriangle, CheckCircle2, Loader2, ShieldAlert, FileDown,
} from 'lucide-react';

import { API_BASE } from '@/lib/apiBase';

interface Submission {
  id: number;
  tool: string;
  contactName: string | null;
  contactEmail: string | null;
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

export function AdminLeads() {
  const { lang } = useLanguage();
  const ar = lang === 'ar';

  const [rows, setRows] = useState<Submission[] | null>(null);
  const [loadError, setLoadError] = useState<'unauthorized' | 'forbidden' | 'failed' | null>(null);
  const [resend, setResend] = useState<Record<number, ResendState>>({});

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch(`${API_BASE}/submissions`, { credentials: 'include' });
      if (res.status === 401) { setLoadError('unauthorized'); return; }
      if (res.status === 403) { setLoadError('forbidden'); return; }
      if (!res.ok) { setLoadError('failed'); return; }
      const data = await res.json();
      setRows(data.submissions ?? []);
    } catch {
      setLoadError('failed');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleResend = async (id: number) => {
    setResend(s => ({ ...s, [id]: { status: 'sending' } }));
    try {
      const res = await fetch(`${API_BASE}/submissions/${id}/resend-email`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.sent) {
        // Update the row in place with the new sent timestamp
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

  const flaggedCount = (rows ?? []).filter(r => r.tool === 'command_centre' && !r.emailSentAt).length;

  return (
    <main className="min-h-screen bg-background pt-28 pb-16" dir={ar ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">{ar ? 'العملاء المحتملون' : 'Leads'}</h1>
            {rows && (
              <p className="text-sm text-muted-foreground mt-1">
                {ar
                  ? `${rows.length} سجلاً — ${flaggedCount} بريد إحاطة لم يُرسل`
                  : `${rows.length} records — ${flaggedCount} briefing email${flaggedCount === 1 ? '' : 's'} not sent`}
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => { setRows(null); void load(); }} data-testid="button-refresh-leads">
            <RefreshCw className="w-4 h-4 me-2" />
            {ar ? 'تحديث' : 'Refresh'}
          </Button>
        </div>

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
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            {ar ? 'تعذّر تحميل السجلات. حاول التحديث.' : 'Could not load leads. Try refreshing.'}
          </div>
        ) : rows === null ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin me-2" />
            {ar ? 'جارٍ التحميل…' : 'Loading…'}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            {ar ? 'لا توجد سجلات بعد.' : 'No leads yet.'}
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
                {rows.map(row => {
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
                        <span className="inline-block rounded bg-muted px-2 py-0.5 text-xs">{row.tool}</span>
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
          </div>
        )}
      </div>
    </main>
  );
}
