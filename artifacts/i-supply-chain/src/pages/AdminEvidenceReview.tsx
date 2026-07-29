/**
 * AdminEvidenceReview — /admin/evidence-review
 *
 * Admin-only queue of AI-evaluated evidence records awaiting consultant review.
 * Supports bilingual (EN/AR) column headers and status labels, RTL layout.
 */
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { API_BASE } from '@/lib/apiBase';
import {
  CheckCircle2, X, Loader2, FileText, AlertTriangle,
  ChevronLeft, ChevronRight, RefreshCw,
} from 'lucide-react';

interface ReviewRecord {
  id:               number;
  userId:           number;
  snapshotId:       number;
  segId:            string;
  subSegId:         string;
  subSegLabel:      string;
  originalFilename: string;
  mimeType:         string;
  storagePath:      string;
  confidenceTier:   string;
  aiEvaluation: {
    plausible_support: boolean;
    confidence:        string;
    flag_reason:       string | null;
    summary:           string;
  } | null;
  consultantNotes: string | null;
  reviewedBy:      number | null;
  reviewedAt:      string | null;
  createdAt:       string;
}

export function AdminEvidenceReview() {
  const { lang } = useLanguage();
  const { user }  = useAuth();
  const ar        = lang === 'ar';

  const [records,   setRecords]   = useState<ReviewRecord[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [filter,    setFilter]    = useState<'all' | 'ai_evaluated' | 'consultant_validated'>('all');
  const [savingId,  setSavingId]  = useState<number | null>(null);
  const [notesMap,  setNotesMap]  = useState<Record<number, string>>({});

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${API_BASE}/admin/evidence-review`, { credentials: 'include' });
      const data = await res.json() as { ok: boolean; records?: ReviewRecord[]; error?: string };
      if (!data.ok) throw new Error(data.error ?? 'Fetch failed');
      setRecords(data.records ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  if (!user || (user as any).role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-md">
        <p className="text-muted-foreground">{ar ? 'هذه الصفحة للمديرين فقط.' : 'This page is for administrators only.'}</p>
        <Link href="/admin/leads"><Button variant="outline" className="mt-4">{ar ? 'لوحة التحكم' : 'Admin Dashboard'}</Button></Link>
      </div>
    );
  }

  const handleDecision = async (id: number, action: 'validate' | 'reject') => {
    setSavingId(id);
    try {
      const res = await fetch(`${API_BASE}/admin/evidence-review/${id}`, {
        method:      'PATCH',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, consultant_notes: notesMap[id] ?? null }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (!data.ok) throw new Error(data.error);
      await fetchRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSavingId(null);
    }
  };

  const visible = records.filter(r => filter === 'all' || r.confidenceTier === filter);

  const tierLabel = (tier: string) => {
    const map: Record<string, { en: string; ar: string }> = {
      self_reported:        { en: 'Self-reported',        ar: 'مُبلَّغ ذاتياً' },
      ai_evaluated:         { en: 'AI-evaluated',         ar: 'مُقيَّم بالذكاء الاصطناعي' },
      consultant_validated: { en: 'Consultant-validated', ar: 'مُعتمَد من الاستشاري' },
    };
    return ar ? (map[tier]?.ar ?? tier) : (map[tier]?.en ?? tier);
  };

  const tierBg = (tier: string) => ({
    self_reported:        'bg-slate-100 text-slate-600 border-slate-200',
    ai_evaluated:         'bg-blue-100 text-blue-800 border-blue-200',
    consultant_validated: 'bg-amber-100 text-amber-800 border-amber-300',
  }[tier] ?? 'bg-muted text-muted-foreground');

  return (
    <div className="w-full" dir={ar ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-[#082C6B] text-white">
        <div className="container mx-auto px-4 py-10 max-w-6xl">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin/leads">
              <button className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                {ar ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </Link>
            <h1 className="text-2xl font-extrabold">
              {ar ? 'قائمة مراجعة الأدلة الداعمة' : 'Evidence Review Queue'}
            </h1>
          </div>
          <p className="text-white/70 text-sm mt-1">
            {ar
              ? 'مراجعة وتحقق من الوثائق المرفوعة من العملاء لتعزيز تقييمات نضجهم.'
              : 'Review and validate documents uploaded by clients to support their maturity assessments.'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {(['all', 'ai_evaluated', 'consultant_validated'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  filter === f ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                {f === 'all'
                  ? (ar ? 'الكل' : 'All')
                  : tierLabel(f)}
                {f !== 'all' && <span className="ml-1 opacity-70">({records.filter(r => r.confidenceTier === f).length})</span>}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={fetchRecords} className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" />
            {ar ? 'تحديث' : 'Refresh'}
          </Button>
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-700 text-sm mb-6">
            {error}
          </div>
        )}

        {!loading && visible.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            {ar ? 'لا توجد سجلات تطابق الفلتر المحدد.' : 'No records match the current filter.'}
          </div>
        )}

        {!loading && visible.length > 0 && (
          <div className="rounded-2xl border border-border shadow-sm overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted text-left">
                  <th className="px-5 py-3 font-bold text-primary">{ar ? 'المجال الفرعي' : 'Sub-Segment'}</th>
                  <th className="px-4 py-3 font-bold text-primary">{ar ? 'الملف' : 'File'}</th>
                  <th className="px-4 py-3 font-bold text-primary">{ar ? 'تقييم الذكاء الاصطناعي' : 'AI Summary'}</th>
                  <th className="px-4 py-3 font-bold text-primary text-center">{ar ? 'الحالة' : 'Status'}</th>
                  <th className="px-4 py-3 font-bold text-primary text-center">{ar ? 'الإجراء' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(rec => (
                  <tr key={rec.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    {/* Sub-segment */}
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-foreground text-xs">{rec.subSegLabel || rec.subSegId}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{rec.segId}</p>
                    </td>

                    {/* File */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <a
                          href={`${API_BASE}/storage/objects${rec.storagePath.replace('/objects', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline text-xs hover:no-underline truncate max-w-[140px]"
                        >
                          {rec.originalFilename}
                        </a>
                      </div>
                    </td>

                    {/* AI Summary */}
                    <td className="px-4 py-3.5 max-w-[240px]">
                      {rec.aiEvaluation ? (
                        <div>
                          <div className="flex items-center gap-1 mb-0.5">
                            {rec.aiEvaluation.plausible_support
                              ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                              : <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                            <span className={`text-xs font-semibold ${rec.aiEvaluation.plausible_support ? 'text-green-700' : 'text-amber-700'}`}>
                              {rec.aiEvaluation.plausible_support
                                ? (ar ? 'دليل مقبول' : 'Plausible support')
                                : (ar ? 'مُحدَّد للمراجعة' : `Flagged: ${rec.aiEvaluation.flag_reason ?? 'review needed'}`)}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-snug">{rec.aiEvaluation.summary}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">{ar ? 'لا يوجد تقييم ذكاء اصطناعي' : 'No AI evaluation'}</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${tierBg(rec.confidenceTier)}`}>
                        {tierLabel(rec.confidenceTier)}
                      </span>
                      {rec.reviewedAt && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(rec.reviewedAt).toLocaleDateString()}
                        </p>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3.5">
                      {rec.confidenceTier !== 'consultant_validated' && (
                        <div className="flex flex-col gap-1.5 min-w-[160px]">
                          <textarea
                            placeholder={ar ? 'ملاحظات الاستشاري (اختياري)' : 'Consultant notes (optional)'}
                            value={notesMap[rec.id] ?? ''}
                            onChange={e => setNotesMap(m => ({ ...m, [rec.id]: e.target.value }))}
                            rows={2}
                            className="w-full rounded-lg border border-border text-xs px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-primary/40"
                          />
                          <div className="flex gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => handleDecision(rec.id, 'validate')}
                              disabled={savingId === rec.id}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs gap-1 h-7"
                            >
                              {savingId === rec.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                              {ar ? 'اعتماد ✓' : 'Validate ✓'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDecision(rec.id, 'reject')}
                              disabled={savingId === rec.id}
                              className="flex-1 text-xs border-red-200 text-red-700 hover:bg-red-50 h-7 gap-1"
                            >
                              <X className="w-3 h-3" />
                              {ar ? 'رفض' : 'Reject'}
                            </Button>
                          </div>
                        </div>
                      )}
                      {rec.confidenceTier === 'consultant_validated' && rec.consultantNotes && (
                        <p className="text-[11px] text-muted-foreground italic">{rec.consultantNotes}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary stats */}
        {!loading && records.length > 0 && (
          <div className="mt-6 grid grid-cols-3 gap-4">
            {[
              { tier: 'ai_evaluated',         label: ar ? 'قيَّمه الذكاء الاصطناعي' : 'AI-evaluated',         color: 'text-blue-700' },
              { tier: 'consultant_validated',  label: ar ? 'مُعتمَد من الاستشاري'    : 'Consultant-validated', color: 'text-amber-700' },
              { tier: 'all',                   label: ar ? 'إجمالي السجلات'           : 'Total records',       color: 'text-primary' },
            ].map(({ tier, label, color }) => (
              <div key={tier} className="rounded-xl border border-border bg-white p-4 text-center">
                <p className={`text-2xl font-extrabold ${color}`}>
                  {tier === 'all' ? records.length : records.filter(r => r.confidenceTier === tier).length}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
