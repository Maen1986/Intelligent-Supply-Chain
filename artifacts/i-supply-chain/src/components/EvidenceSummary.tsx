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
import { Link } from 'wouter';
import { ChevronRight, ChevronLeft, Microscope, History } from 'lucide-react';

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

// Shared "Similar case" callout (#176, 24 Aug 2026) -- surfaces the SAME
// signed-in user's own most recent PRIOR diagnostic submission when its
// industry (+ subIndustry, when given) matches the one just diagnosed. A
// categorical match on the client's own dropdown choices, not a semantic
// claim -- so the copy says "same industry," never "similar problem," which
// this data cannot actually prove. Distinct blue theme (not the amber used
// by ConsiderAlso, not to be confused with a counter-argument) since this is
// context, not a caveat.
export interface SimilarCaseData {
  challenge: string;
  challengeSummary: string | null;
  industry: string;
  subIndustry: string | null;
  takenAt: string;
}

export function SimilarCase({ similarCase, ar }: { similarCase?: SimilarCaseData | null; ar?: boolean }) {
  if (!similarCase) return null;
  const dateStr = new Date(similarCase.takenAt).toLocaleDateString(ar ? 'ar-SA' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
  const summary = similarCase.challengeSummary ?? similarCase.challenge;
  return (
    <div className="flex items-start gap-2.5 text-xs sm:text-sm text-blue-900 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5">
      <History className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
      <div>
        <p>
          <span className="font-bold">{ar ? `لديك تشخيص سابق لنفس القطاع (${similarCase.industry})` : `You raised a similar-industry challenge before (${similarCase.industry})`}</span>
          {ar ? `، بتاريخ ${dateStr}: ` : `, on ${dateStr}: `}
          <span className="italic">{summary}</span>
        </p>
        <Link href="/my-assessments" className="inline-block mt-1 text-blue-700 font-semibold hover:underline">
          {ar ? 'عرض التشخيص السابق' : 'View that prior diagnosis'}
        </Link>
      </div>
    </div>
  );
}
