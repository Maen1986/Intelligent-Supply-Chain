// src/components/AccountabilityLine.tsx
//
// Visible human-accountability labeling (#375, 30 Aug 2026). Owner-signed-off
// packaging principle, not a new engine: every AI-generated deliverable
// platform-wide should carry a consistent, visible line making clear this
// is reviewed against ISC's own standards and that a named human is
// accountable for it -- rather than an implicit persona claim buried in a
// system prompt (see #156 AI Persona Modes) that the end user never sees.
//
// Deliberately tiny and stateless -- a label, not a feature. Dropped next to
// every AI-output surface already carrying EvidenceSummary (the #153
// Evidence-First pattern), plus Contract Intelligence's Generation/Review
// outputs (Module 09), since those are exactly the "AI-generated" surfaces
// this principle is meant to cover.
import { ShieldCheck } from 'lucide-react';

export function AccountabilityLine({ ar }: { ar?: boolean }) {
  return (
    <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80 mt-2">
      <ShieldCheck className="w-3 h-3 shrink-0" />
      {ar
        ? "تمت مراجعته وفق معايير I Supply Chain؛ للتصعيد تواصل مباشرة مع مَعِين الحقش."
        : "Reviewed against ISC's standards; escalate to Ma'in Alhaqash directly."}
    </p>
  );
}
