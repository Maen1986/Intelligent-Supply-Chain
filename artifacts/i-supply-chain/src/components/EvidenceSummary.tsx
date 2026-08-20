// src/components/EvidenceSummary.tsx
//
// Shared "Show me why" evidence-disclosure component (#153, 20 Aug 2026).
// Renders the evidenceSummary{dataUsed[], assumptions[], confidence} object now
// returned by all four AI-output surfaces (Consultancy Engine, Diagnostic,
// Executive Briefing, Report Generator) -- see isc-ai-output-standards skill,
// Wave A-1, principle #1 (Evidence-First AI Output): never present a
// conclusion with no visible path back to the data that produced it.
//
// Collapsed by default so it doesn't compete with the primary finding; click
// to expand. Neutral theme-token styling (bg-muted/text-primary) so it reads
// consistently across every surface it's dropped into.
import { useState } from 'react';
import { ChevronRight, ChevronLeft, Microscope } from 'lucide-react';

export interface EvidenceSummaryData {
  dataUsed: string[];
  assumptions: string[];
  confidence: number | string;
}

export function EvidenceSummary({ evidence, ar }: { evidence?: EvidenceSummaryData | null; ar?: boolean }) {
  const [open, setOpen] = useState(false);
  if (!evidence || (!evidence.dataUsed?.length && !evidence.assumptions?.length)) return null;

  const confidenceNum = typeof evidence.confidence === 'number' ? evidence.confidence : parseFloat(String(evidence.confidence));
  const confidenceLabel = Number.isFinite(confidenceNum) ? `${Math.round(confidenceNum)}%` : String(evidence.confidence ?? '');

  return (
    <div className="rounded-xl border border-border bg-muted/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted transition-colors"
      >
        <Microscope className="w-4 h-4 text-primary shrink-0" />
        <span className="flex-1 text-sm font-bold text-primary">{ar ? 'كيف توصلنا لهذا؟' : 'Show me why'}</span>
        {confidenceLabel && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white border border-border text-muted-foreground shrink-0">
            {ar ? `الثقة ${confidenceLabel}` : `${confidenceLabel} confidence`}
          </span>
        )}
        {ar
          ? <ChevronLeft className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? '-rotate-90' : ''}`} />
          : <ChevronRight className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 space-y-3 text-sm">
          {evidence.dataUsed?.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">
                {ar ? 'البيانات المستخدمة' : 'Data used'}
              </p>
              <ul className="space-y-1">
                {evidence.dataUsed.map((d, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-primary/60 shrink-0" />
                    <span className="text-foreground">{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {evidence.assumptions?.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">
                {ar ? 'الافتراضات' : 'Assumptions'}
              </p>
              <ul className="space-y-1">
                {evidence.assumptions.map((a, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-amber-500/70 shrink-0" />
                    <span className="text-foreground">{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Shared "Consider also" counter-argument note (#154, 20 Aug 2026) --
// deliberately much lighter-weight than EvidenceSummary (always visible,
// no collapse) since it's one or two sentences, not a data list.
export function ConsiderAlso({ text, ar }: { text?: string | null; ar?: boolean }) {
  if (!text) return null;
  return (
    <div className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
      <span className="font-bold text-amber-700 shrink-0">{ar ? 'من الجهة الأخرى:' : 'Consider also:'}</span>
      <span>{text}</span>
    </div>
  );
}
