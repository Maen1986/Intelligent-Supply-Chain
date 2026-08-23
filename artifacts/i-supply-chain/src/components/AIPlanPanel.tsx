/**
 * AIPlanPanel — shared UI for every AI "Generate" action plan feature.
 *
 * Shows:
 *   • A "Last plan (from [date])" notice with View / Delete links when a
 *     server-persisted plan exists and the user hasn't loaded a result yet
 *   • A "Generate ✨" button (when idle, authenticated) or sign-in prompt (unauthenticated)
 *   • A spinner while generating
 *   • A collapsible panel with formatted AI output when ready
 *   • An inline error + retry button on failure
 */
import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Sparkles, Loader2, Copy, Check, ChevronDown, ChevronUp, RefreshCw, AlertCircle, LogIn, History, Trash2, CloudOff, Clock } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { type SavedPlan } from '@/hooks/useAIPlan';
import { EvidenceSummary, type EvidenceSummaryData } from '@/components/EvidenceSummary';

interface AIPlanPanelProps {
  loading:    boolean;
  result:     string | null;
  /** #158 (23 Aug 2026): evidence/confidence badge, same component and pattern
   * as the other five AI surfaces. Undefined on a viewed saved plan (not
   * persisted yet) or if the model's JSON response omitted it. */
  evidenceSummary?: EvidenceSummaryData;
  error:      string | null;
  onGenerate: () => void;
  onReset:    () => void;
  /** Label for the initial generate button, e.g. "Generate Supplier Plan ✨" */
  buttonLabel: string;
  isAr:       boolean;
  /** Disable the generate button (e.g. not enough data entered yet) */
  disabled?:  boolean;
  /** Server-persisted plan from a previous session */
  savedPlan?:    SavedPlan | null;
  onViewSaved?:  () => void;
  onDeleteSaved?: () => void;
  /** True when the last request was rejected with a 429 — hides Retry and shows countdown */
  rateLimited?: boolean;
  /**
   * Remaining seconds until the rate-limit window expires (live countdown from the hook).
   * null when not rate-limited.
   */
  retryAfterSeconds?: number | null;
  /** Tool key used to set a pending-generate flag in sessionStorage before redirecting to login */
  toolKey?: string;
  /** True when the plan was generated but the server-side save failed */
  saveError?: boolean;
  onDismissSaveError?: () => void;
  /** Allows the user to retry saving without re-generating (Task 375) */
  onRetrySave?: () => void;
  /** Delete-failure message — separate from generation `error` so the Generate button stays visible (Task 373) */
  deleteError?: string | null;
  onDismissDeleteError?: () => void;
}

export function AIPlanPanel({
  loading, result, evidenceSummary, error, onGenerate, onReset, buttonLabel, isAr, disabled,
  savedPlan, onViewSaved, onDeleteSaved, rateLimited, retryAfterSeconds, toolKey,
  saveError, onDismissSaveError, onRetrySave,
  deleteError, onDismissDeleteError,
}: AIPlanPanelProps) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [location, navigate] = useLocation();
  const [open,   setOpen]   = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  /* ── Format savedAt date ── */
  const savedAtLabel = savedPlan
    ? new Date(savedPlan.savedAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-GB', {
        year: 'numeric', month: 'short', day: 'numeric',
      })
    : null;

  /* Whether to show the "last saved plan" notice (only when idle and form is filled) */
  const showSavedNotice = !!savedPlan && !result && !loading && !error && !disabled;

  return (
    <div className="no-print mt-3 space-y-2">

      {/* ── Saved plan notice ── */}
      {showSavedNotice && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 border border-primary/15 rounded-lg px-3 py-2 max-w-xl">
          <History className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="flex-1">
            {isAr
              ? `آخر خطة (بتاريخ ${savedAtLabel})`
              : `Last plan (from ${savedAtLabel})`}
          </span>
          <button
            onClick={onViewSaved}
            className="font-bold text-primary underline underline-offset-2 hover:opacity-70 shrink-0"
          >
            {isAr ? 'عرض' : 'View'}
          </button>
          <button
            onClick={onDeleteSaved}
            className="p-0.5 rounded hover:text-red-500 transition-colors shrink-0"
            title={isAr ? 'حذف الخطة المحفوظة' : 'Delete saved plan'}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* ── Idle: show Generate button (authenticated) or sign-in prompt ── */}
      {/* authLoading guard: hide both the Generate button and the sign-in prompt
          while the session check is still in flight — prevents a cold-load flicker */}
      {!result && !loading && !error && !authLoading && (
        isAuthenticated ? (
          <button
            onClick={onGenerate}
            disabled={disabled || !!rateLimited}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold bg-gradient-to-r from-[#082C6B] to-[#1a4a9e] text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {buttonLabel}
          </button>
        ) : (
          <button
            onClick={() => {
              if (toolKey) {
                sessionStorage.setItem(`pendingAIPlan_${toolKey}`, '1');
              }
              navigate(`/login?from=${encodeURIComponent(location)}`);
            }}
            className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 border border-border rounded-lg px-3 py-2 hover:bg-muted/80 hover:border-primary/30 transition-colors cursor-pointer text-left"
          >
            <LogIn className="w-3.5 h-3.5 shrink-0 text-primary/60" />
            <span>
              {isAr
                ? 'سجِّل دخولك لتوليد خطة الذكاء الاصطناعي'
                : 'Sign in to generate an AI plan'}
            </span>
          </button>
        )
      )}

      {/* ── Loading spinner ── */}
      {loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
          <span>{isAr ? 'جارٍ التوليد… (15–30 ثانية)' : 'Generating… (15–30 s)'}</span>
        </div>
      )}

      {/* ── Rate-limit banner (amber, distinct from generic errors) ── */}
      {rateLimited && error && !loading && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-2 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2.5 text-xs text-amber-800 max-w-xl"
        >
          <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
          <span className="flex-1">
            {retryAfterSeconds != null && retryAfterSeconds > 0
              ? (isAr
                  ? `تجاوزت الحد المسموح — يُرجى المحاولة بعد ${Math.ceil(retryAfterSeconds / 60)} دقيقة (${retryAfterSeconds} ث)`
                  : `AI plan limit reached — try again in ${Math.ceil(retryAfterSeconds / 60)} min (${retryAfterSeconds}s)`)
              : (isAr
                  ? 'تجاوزت الحد المسموح — يُرجى المحاولة لاحقاً'
                  : 'AI plan limit reached — please try again later')}
          </span>
          <button
            onClick={onReset}
            className="font-bold opacity-50 hover:opacity-100 shrink-0"
            title={isAr ? 'إغلاق' : 'Dismiss'}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Generic error state (not rate-limit) ── */}
      {error && !rateLimited && !loading && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 max-w-xl">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1">{error}</span>
          {isAuthenticated && (
            <button
              onClick={onGenerate}
              className="font-bold underline underline-offset-2 shrink-0 hover:opacity-80"
            >
              {isAr ? 'إعادة المحاولة' : 'Retry'}
            </button>
          )}
          <button
            onClick={onReset}
            className="font-bold opacity-50 hover:opacity-100 shrink-0"
            title={isAr ? 'إغلاق' : 'Dismiss'}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Save-error warning (plan shown but not persisted) ── */}
      {saveError && result && !loading && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800 max-w-3xl">
          <CloudOff className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1">
            {isAr
              ? 'تعذّر حفظ الخطة — قد تُفقد عند تحديث الصفحة'
              : 'Plan not saved — refresh may lose it'}
          </span>
          {onRetrySave && (
            <button
              onClick={onRetrySave}
              className="underline underline-offset-2 font-semibold opacity-80 hover:opacity-100 shrink-0"
              title={isAr ? 'إعادة الحفظ' : 'Retry save'}
            >
              {isAr ? 'إعادة الحفظ' : 'Retry save'}
            </button>
          )}
          <button
            onClick={onDismissSaveError}
            className="font-bold opacity-50 hover:opacity-100 shrink-0"
            title={isAr ? 'إغلاق' : 'Dismiss'}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Delete-error banner (separate from generation error so Generate stays visible — Task 373) ── */}
      {deleteError && !loading && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-800 max-w-3xl">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1">{deleteError}</span>
          <button
            onClick={onDismissDeleteError}
            className="font-bold opacity-50 hover:opacity-100 shrink-0"
            title={isAr ? 'إغلاق' : 'Dismiss'}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Result panel ── */}
      {result && !loading && (
        <div className="border border-primary/20 rounded-xl overflow-hidden shadow-sm max-w-3xl">
          {/* Panel header */}
          <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-primary/5 border-b border-primary/10">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold text-primary">
                {isAr ? 'الخطة المُولَّدة بالذكاء الاصطناعي' : 'AI-Generated Plan'}
              </span>
            </div>
            <div className="flex items-center gap-0.5">
              {/* Copy */}
              <button
                onClick={handleCopy}
                className="p-1.5 rounded hover:bg-primary/10 transition-colors"
                title={isAr ? 'نسخ إلى الحافظة' : 'Copy to clipboard'}
              >
                {copied
                  ? <Check  className="w-3.5 h-3.5 text-emerald-600" />
                  : <Copy   className="w-3.5 h-3.5 text-muted-foreground" />}
              </button>
              {/* Regenerate — only when authenticated */}
              {isAuthenticated && (
                <button
                  onClick={onGenerate}
                  className="p-1.5 rounded hover:bg-primary/10 transition-colors"
                  title={isAr ? 'إعادة التوليد' : 'Regenerate'}
                >
                  <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
              {/* Collapse / expand */}
              <button
                onClick={() => setOpen(o => !o)}
                className="p-1.5 rounded hover:bg-primary/10 transition-colors"
                title={open ? (isAr ? 'طيّ' : 'Collapse') : (isAr ? 'توسيع' : 'Expand')}
              >
                {open
                  ? <ChevronUp   className="w-3.5 h-3.5 text-muted-foreground" />
                  : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
              </button>
              {/* Close */}
              <button
                onClick={onReset}
                className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors text-xs font-bold leading-none"
                title={isAr ? 'إغلاق' : 'Close'}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Rendered content */}
          {open && (
            <div
              className={`px-5 py-4 max-h-[32rem] overflow-y-auto text-xs leading-relaxed space-y-1.5 ${isAr ? 'text-right' : ''}`}
              dir={isAr ? 'rtl' : 'ltr'}
            >
              <AIPlanContent text={result} />
              {/* #158: evidence/confidence badge -- renders nothing when absent (viewed saved plan, or model omitted it) */}
              <div className="pt-1">
                <EvidenceSummary evidence={evidenceSummary} ar={isAr} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Markdown-lite renderer ─── */

function AIPlanContent({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => {
        const t = line.trim();
        if (!t) return <div key={i} className="h-1.5" />;

        if (t.startsWith('### ')) return (
          <h4 key={i} className="font-bold text-primary text-[11px] uppercase tracking-wide mt-3 mb-0.5">
            {renderInline(t.slice(4))}
          </h4>
        );
        if (t.startsWith('## ')) return (
          <h3 key={i} className="font-bold text-primary text-sm mt-4 first:mt-0 pb-1 border-b border-border/60">
            {renderInline(t.slice(3))}
          </h3>
        );
        if (t.startsWith('# ')) return (
          <h2 key={i} className="font-extrabold text-primary text-sm mb-1">
            {renderInline(t.slice(2))}
          </h2>
        );

        // Bullet points (-, *, •)
        if (/^[-*•]\s/.test(t)) return (
          <div key={i} className="flex gap-2 items-start">
            <span className="text-primary shrink-0 mt-0.5 leading-none">•</span>
            <span className="flex-1">{renderInline(t.replace(/^[-*•]\s/, ''))}</span>
          </div>
        );

        // Numbered list  1. or 1)
        const numMatch = t.match(/^(\d+)[.)]\s(.*)$/);
        if (numMatch) return (
          <div key={i} className="flex gap-2 items-start">
            <span className="text-primary font-bold shrink-0 w-5 text-right">{numMatch[1]}.</span>
            <span className="flex-1">{renderInline(numMatch[2])}</span>
          </div>
        );

        return <p key={i} className="text-foreground/90">{renderInline(t)}</p>;
      })}
    </>
  );
}

const PRIORITY_CLASSES: Record<string, string> = {
  '[HIGH]':              'bg-red-100     text-red-800',
  '[MEDIUM]':            'bg-amber-100   text-amber-800',
  '[LOW]':               'bg-emerald-100 text-emerald-800',
  '[عالية]':             'bg-red-100     text-red-800',
  '[متوسطة]':            'bg-amber-100   text-amber-800',
  '[منخفضة]':            'bg-emerald-100 text-emerald-800',
  '[أولوية عالية]':       'bg-red-100     text-red-800',
  '[أولوية متوسطة]':      'bg-amber-100   text-amber-800',
  '[أولوية منخفضة]':      'bg-emerald-100 text-emerald-800',
};

function renderInline(text: string): React.ReactNode {
  // Split on **bold**, priority badges
  const pattern = /(\*\*[^*]+\*\*|\[[^\]]{1,30}\])/g;
  const parts = text.split(pattern);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    const priorityCls = PRIORITY_CLASSES[part];
    if (priorityCls) {
      return (
        <span key={i} className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full font-bold mx-0.5 leading-tight ${priorityCls}`}>
          {part.slice(1, -1)}
        </span>
      );
    }
    return part;
  });
}
