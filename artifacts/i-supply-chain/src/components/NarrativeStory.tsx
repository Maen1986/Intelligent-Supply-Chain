// src/components/NarrativeStory.tsx
//
// "Tell Me the Story" narrative button (#157, 20 Aug 2026).
// A one-click reformat of already-generated AI output into an executive
// narrative template: primary cause -> underlying cause -> exposure ->
// who's affected -> recommended intervention -> expected impact ->
// prevention. Pure client-side restructuring of data the caller already
// has in hand -- no new AI call, no new fields fabricated. Applies to:
// Consultancy Engine diagnosis, Executive Briefing (isc-ai-output-standards
// skill, Wave A-1, principle #5).
import { useState } from 'react';
import { BookOpen, X } from 'lucide-react';

export interface NarrativeStep {
  label: string;
  labelAr: string;
  value: string;
}

const EN_LABELS = ['Primary Cause', 'Underlying Cause', 'Exposure', "Who's Affected", 'Recommended Intervention', 'Expected Impact', 'Prevention'];
const AR_LABELS = ['السبب المباشر', 'السبب الجذري', 'حجم التعرض', 'الجهات المتأثرة', 'الإجراء الموصى به', 'الأثر المتوقع', 'الوقاية'];

/** Button that opens the narrative overlay. Renders nothing if steps is empty. */
export function TellMeTheStoryButton({ title, titleAr, steps, ar }: { title: string; titleAr: string; steps: NarrativeStep[]; ar?: boolean }) {
  const [open, setOpen] = useState(false);
  if (!steps || steps.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-full border border-[#082C6B]/30 text-[#082C6B] bg-white hover:bg-[#082C6B]/5 transition-colors"
      >
        <BookOpen className="w-3.5 h-3.5" />
        {ar ? 'اروِ لي القصة' : 'Tell Me the Story'}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setOpen(false)}>
          <div
            className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
            dir={ar ? 'rtl' : 'ltr'}
          >
            <div className="sticky top-0 bg-[#082C6B] text-white rounded-t-2xl px-5 py-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-widest text-white/60 font-semibold">{ar ? 'السرد التنفيذي' : 'Executive Narrative'}</p>
                <h3 className="text-base font-black mt-0.5">{ar ? titleAr : title}</h3>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-white/70 hover:text-white shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center shrink-0">
                    <span className="w-7 h-7 rounded-full bg-[#082C6B] text-white flex items-center justify-center text-xs font-black">{i + 1}</span>
                    {i < steps.length - 1 && <span className="w-px flex-1 bg-border mt-1" />}
                  </div>
                  <div className="pb-2 min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#C9A84C]">{ar ? step.labelAr : step.label}</p>
                    <p className="text-sm text-foreground mt-0.5 leading-relaxed">{step.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 pb-5">
              <p className="text-[11px] text-muted-foreground italic">
                {ar
                  ? 'هذا إعادة صياغة للنتائج الموجودة أعلاه بترتيب سردي تنفيذي — لا استدعاء ذكاء اصطناعي جديد.'
                  : 'This is a reformat of the findings above into an executive narrative order -- no new AI call.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export { EN_LABELS, AR_LABELS };
