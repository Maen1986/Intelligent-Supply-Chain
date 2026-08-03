/**
 * EvidenceUploadZone — bilingual (EN/AR) upload card for a single sub-segment.
 *
 * States: idle → uploading → evaluating → done (ai-verified / flagged) | error
 */
import React, { useRef, useState } from 'react';
import { Upload, X, CheckCircle2, AlertTriangle, Loader2, FileText } from 'lucide-react';
import { API_BASE } from '@/lib/apiBase';

export interface EvidenceRecord {
  id:               number;
  segId:            string;
  subSegId:         string;
  subSegLabel:      string;
  originalFilename: string;
  mimeType:         string;
  confidenceTier:   'self_reported' | 'ai_evaluated' | 'consultant_validated';
  aiEvaluation?: {
    plausible_support: boolean;
    confidence:        'high' | 'medium' | 'low';
    flag_reason:       'generic_template' | 'blank_or_irrelevant' | 'contradicts_claimed_level' | null;
    summary:           string;
  } | null;
}

interface EvidenceUploadZoneProps {
  lang:          'en' | 'ar';
  snapshotId:    number;
  segId:         string;
  subSegId:      string;
  subSegLabel:   string;
  subSegLabelAr: string;
  subSegHint:    string;
  subSegHintAr:  string;
  existing?:     EvidenceRecord | null;
  onChanged:     () => void;
}

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/webp',
];
const MAX_BYTES = 10 * 1024 * 1024;

type UploadState = 'idle' | 'uploading' | 'evaluating' | 'done' | 'error';

export function EvidenceUploadZone({
  lang, snapshotId, segId, subSegId,
  subSegLabel, subSegLabelAr, subSegHint, subSegHintAr,
  existing, onChanged,
}: EvidenceUploadZoneProps) {
  const ar  = lang === 'ar';
  const ref = useRef<HTMLInputElement>(null);

  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [errorMsg,    setErrorMsg]    = useState<string | null>(null);
  const [removing,    setRemoving]    = useState(false);

  const label    = ar ? subSegLabelAr : subSegLabel;
  const hint     = ar ? subSegHintAr  : subSegHint;
  const baseDir  = API_BASE;

  /* ── Remove existing evidence ──────────────────────────────────────────── */
  const handleRemove = async () => {
    if (!existing) return;
    setRemoving(true);
    try {
      const res = await fetch(`${baseDir}/maturity/evidence/${existing.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok && res.status !== 204) throw new Error(await res.text());
      onChanged();
    } catch {
      setErrorMsg(ar ? 'تعذّر حذف الملف. حاول مجدداً.' : 'Could not remove file. Please try again.');
    } finally {
      setRemoving(false);
    }
  };

  /* ── Upload flow ────────────────────────────────────────────────────────── */
  const handleFile = async (file: File) => {
    setErrorMsg(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMsg(ar
        ? 'نوع الملف غير مسموح. المقبول: PDF, Word, PNG, JPEG, WebP.'
        : 'File type not allowed. Accepted: PDF, Word, PNG, JPEG, WebP.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setErrorMsg(ar ? 'الملف أكبر من 10 ميغابايت.' : 'File exceeds 10 MB limit.');
      return;
    }

    setUploadState('uploading');
    try {
      // 1 — Get presigned URL + pending evidence ID
      const urlRes = await fetch(`${baseDir}/maturity/evidence/upload-url`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          snapshot_id:  snapshotId,
          seg_id:       segId,
          subseg_id:    subSegId,
          filename:     file.name,
          mime_type:    file.type,
          file_size:    file.size,
          subseg_label: subSegLabel,
          subseg_hint:  subSegHint,
        }),
      });
      const urlData = await urlRes.json() as { ok: boolean; evidence_id?: number; upload_url?: string; error?: string };
      if (!urlData.ok || !urlData.upload_url || !urlData.evidence_id) {
        throw new Error(urlData.error ?? 'Failed to get upload URL');
      }

      // 2 — PUT file directly to GCS
      const putRes = await fetch(urlData.upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error(`GCS upload failed: ${putRes.status}`);

      // 3 — Confirm (triggers AI eval, synchronous ~3s)
      setUploadState('evaluating');
      const confirmRes = await fetch(`${baseDir}/maturity/evidence/${urlData.evidence_id}/confirm`, {
        method:      'POST',
        credentials: 'include',
      });
      const confirmData = await confirmRes.json() as { ok: boolean; confidence_tier?: string; error?: string };
      if (!confirmData.ok) throw new Error(confirmData.error ?? 'Confirm failed');

      setUploadState('done');
      onChanged();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : (ar ? 'فشل رفع الملف.' : 'Upload failed.'));
      setUploadState('error');
    }
  };

  /* ── Render existing evidence result ───────────────────────────────────── */
  if (existing) {
    const isVerified = existing.confidenceTier === 'ai_evaluated' || existing.confidenceTier === 'consultant_validated';
    const isFlagged  = existing.aiEvaluation?.plausible_support === false;
    const isConsultant = existing.confidenceTier === 'consultant_validated';

    return (
      <div className="rounded-xl border bg-white p-3 text-sm" dir={ar ? 'rtl' : 'ltr'}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="font-semibold text-foreground text-xs">{label}</p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground text-xs truncate max-w-[180px]">{existing.originalFilename}</span>
              {isConsultant && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                  ✓ {ar ? 'مُعتمَد من الاستشاري' : 'Consultant-validated'}
                </span>
              )}
              {!isConsultant && isVerified && !isFlagged && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-[10px] font-bold border border-green-200">
                  <CheckCircle2 className="w-3 h-3" />
                  {ar ? 'مُتحقَّق منه بالذكاء الاصطناعي ✓' : 'AI-verified ✓'}
                </span>
              )}
              {!isConsultant && isFlagged && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                  <AlertTriangle className="w-3 h-3" />
                  {ar ? 'مُحدَّد — نموذج عام غير مُعدَّل' : `Flagged — ${existing.aiEvaluation?.flag_reason?.replace(/_/g, ' ') ?? 'review needed'}`}
                </span>
              )}
              {!isConsultant && !isVerified && !isFlagged && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-medium border">
                  {ar ? 'مُبلَّغ ذاتياً' : 'Self-reported'}
                </span>
              )}
            </div>
            {existing.aiEvaluation?.summary && (
              <p className="text-[11px] text-muted-foreground mt-1 leading-snug max-w-xs">{existing.aiEvaluation.summary}</p>
            )}
          </div>
          {existing.confidenceTier?.toLowerCase() !== 'consultant_validated' && (
            <button
              onClick={handleRemove}
              disabled={removing}
              className="shrink-0 p-1 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
              title={ar ? 'إزالة الدليل' : 'Remove evidence'}
            >
              {removing ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
            </button>
          )}
        </div>
        {/* Remove-error feedback — shown inside the file card so users know
            the deletion failed without the card disappearing (Task 838).  */}
        {errorMsg && (
          <p className="mt-2 text-xs text-red-600">{errorMsg}</p>
        )}
      </div>
    );
  }

  /* ── Upload idle / in-progress / error ─────────────────────────────────── */
  return (
    <div dir={ar ? 'rtl' : 'ltr'}>
      <input
        ref={ref}
        type="file"
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />

      <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
      <p className="text-[11px] text-muted-foreground mb-2 leading-snug">{hint}</p>

      {(uploadState === 'idle' || uploadState === 'error') && (
        <button
          onClick={() => ref.current?.click()}
          className="w-full rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/3 transition-all px-4 py-3 flex items-center gap-3 group"
        >
          <Upload className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
          <span className="text-xs text-muted-foreground group-hover:text-foreground">
            {ar
              ? 'أضف دليلاً داعماً (اختياري) — PDF، Word، أو صورة'
              : 'Add supporting evidence (optional) — PDF, Word, or image'}
          </span>
        </button>
      )}

      {uploadState === 'uploading' && (
        <div className="w-full rounded-xl border border-border px-4 py-3 flex items-center gap-3 bg-muted/30">
          <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
          <span className="text-xs text-muted-foreground">{ar ? 'جارٍ رفع الملف…' : 'Uploading…'}</span>
        </div>
      )}

      {uploadState === 'evaluating' && (
        <div className="w-full rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-center gap-3">
          <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
          <span className="text-xs text-primary font-medium">{ar ? 'يُقيَّم بالذكاء الاصطناعي…' : 'AI evaluation in progress…'}</span>
        </div>
      )}

      {errorMsg && (
        <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          {errorMsg}
          {' '}
          <button
            onClick={() => { setErrorMsg(null); setUploadState('idle'); }}
            className="underline hover:no-underline"
          >
            {ar ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </p>
      )}
    </div>
  );
}
