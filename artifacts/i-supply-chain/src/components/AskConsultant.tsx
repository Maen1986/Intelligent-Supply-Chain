// src/components/AskConsultant.tsx
//
// Ask the Consultant (#191, 24 Aug 2026) -- a client's follow-up question
// about a diagnosis (and solution, when one exists), answered by the same
// CONSULTANT_IDENTITY persona every other Consultancy Engine route already
// uses. Surfaced during a live conversation: the only prior follow-up path
// was the low-satisfaction "feedback" textarea, which only appears at the
// solution stage after a sub-4-star rating -- a satisfied client, or one
// still at the diagnosis stage, had no way to ask anything. This component
// is deliberately decoupled from that satisfaction/refine flow.
//
// The owner's requirement was explicit: answers must be profound, not
// generic reassurance. The backend enforces that by grounding every answer
// in a specific framework already named in the diagnosis's own problems[]
// (Problem DNA's `framework` field, #167) -- this component surfaces that
// framework as a visible badge so the client can see the depth is real, not
// a black box. Reuses EvidenceSummary and ConsiderAlso (the same
// evidence-disclosure and counter-argument components #153/#154 already
// established) rather than inventing new ones.
//
// Session-only Q&A history (component state, not persisted) -- see
// consultancy.ts's file header for why /ask is deliberately stateless in V1.
import { useState } from 'react';
import { MessageCircleQuestion, Loader2, Send } from 'lucide-react';
import { API_BASE } from '@/lib/apiBase';
import { EvidenceSummary, ConsiderAlso, type EvidenceSummaryData } from '@/components/EvidenceSummary';

interface QAEntry {
  question: string;
  answer: string;
  frameworkApplied: string;
  evidenceSummary?: EvidenceSummaryData | null;
  considerAlso?: string | null;
}

export function AskConsultant({
  industry, subIndustry, challenge, diagnosis, solution, lang, ar,
}: {
  industry: string;
  subIndustry?: string;
  challenge: string;
  diagnosis: unknown;
  solution?: unknown | null;
  lang?: 'en' | 'ar';
  ar?: boolean;
}) {
  const [question, setQuestion] = useState('');
  const [asking, setAsking]     = useState(false);
  const [error, setError]       = useState('');
  const [history, setHistory]   = useState<QAEntry[]>([]);

  const submitQuestion = async () => {
    const q = question.trim();
    if (!q || asking) return;
    setAsking(true); setError('');
    try {
      const r = await fetch(`${API_BASE}/consultancy/ask`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ industry, subIndustry: subIndustry || undefined, challenge, diagnosis, solution: solution ?? undefined, question: q, language: lang }),
      });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || 'Could not get an answer');
      const a = d.answer;
      setHistory(prev => [{
        question: q,
        answer: a.answer,
        frameworkApplied: a.frameworkApplied,
        evidenceSummary: a.evidenceSummary ?? null,
        considerAlso: a.considerAlso ?? null,
      }, ...prev]);
      setQuestion('');
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <h4 className="text-xs font-bold text-[#082C6B] uppercase tracking-wider mb-2 flex items-center gap-2">
        <MessageCircleQuestion className="w-4 h-4 text-[#C9A84C]" />
        {ar ? "اسأل ما'ين سؤالاً" : "Ask Ma'in a Question"}
      </h4>
      <p className="text-xs text-muted-foreground mb-3">
        {ar
          ? 'هل لديك استفسار أو تحتاج توضيحًا حول هذا التشخيص؟ اطرح سؤالك وستجيب عليه في إطار المنهجية الأكثر صلة به.'
          : 'Have a question or need something clarified about this diagnosis? Ask it, and it will be answered in whichever methodology is most relevant.'}
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !asking) submitQuestion(); }}
          placeholder={ar ? 'اكتب سؤالك هنا...' : 'Type your question here...'}
          className="flex-1 min-w-0 border border-border rounded-lg px-3 py-2 text-sm"
          disabled={asking}
        />
        <button
          type="button"
          onClick={submitQuestion}
          disabled={asking || !question.trim()}
          className="shrink-0 bg-[#082C6B] hover:bg-[#0B3D91] disabled:opacity-50 text-white text-sm font-semibold rounded-lg px-4 py-2 flex items-center gap-1.5"
        >
          {asking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          {ar ? 'إرسال' : 'Ask'}
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

      {history.length > 0 && (
        <div className="mt-4 space-y-4">
          {history.map((entry, i) => (
            <div key={i} className="border-t border-border/60 pt-3">
              <p className="text-sm font-semibold text-foreground mb-1">{entry.question}</p>
              <p className="text-sm text-foreground leading-relaxed">{entry.answer}</p>
              <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {ar ? 'الإطار المطبّق:' : 'Framework applied:'} {entry.frameworkApplied}
              </span>
              <div className="mt-2 space-y-2">
                <EvidenceSummary evidence={entry.evidenceSummary} ar={ar} />
                <ConsiderAlso text={entry.considerAlso} ar={ar} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
