// src/components/ProblemChainFlow.tsx
//
// Visual Primitive Vocabulary (#164, 21 Aug 2026) -- root-cause chain
// primitive. "Match the visualization to the content: a root-cause chain
// is a graph, not four bullet cards" (UI/UX Vision Synthesis v4, Wave A-3).
//
// Deliberately a step-flow, not a node-link graph: the underlying data
// (symptom -> trigger -> immediateCause -> contributingCauses[] ->
// rootCause -> downstreamEffects[]) is a linear causal chain with two small
// branch points, not a network. A step-flow honestly represents that shape;
// a force-directed graph would imply a complexity the data doesn't have,
// and this project has no graph/node-link library (recharts only) -- see
// Decision Record 8.7 for why the literal "Graph" primitive was scoped down
// rather than adding a new dependency or hand-rolling node-link layout.
import { AlertCircle, Zap, Crosshair, Layers, Target as RootIcon, ArrowDownCircle } from 'lucide-react';

interface ChainStep {
  icon: typeof AlertCircle;
  label: string;
  labelAr: string;
  value: string;
}

export function ProblemChainFlow({ chain, ar }: {
  chain: { symptom: string; trigger: string; immediateCause: string; contributingCauses: string[]; rootCause: string; downstreamEffects: string[] };
  ar?: boolean;
}) {
  const steps: ChainStep[] = [
    { icon: AlertCircle, label: 'Symptom',         labelAr: 'العرض',          value: chain.symptom },
    { icon: Zap,         label: 'Trigger',         labelAr: 'المحفّز',        value: chain.trigger },
    { icon: Crosshair,   label: 'Immediate Cause', labelAr: 'السبب المباشر',  value: chain.immediateCause },
    { icon: RootIcon,    label: 'Root Cause',      labelAr: 'السبب الجذري',   value: chain.rootCause },
  ];

  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const isLast = i === steps.length - 1;
        return (
          <div key={i}>
            <div className="flex gap-3">
              <div className="flex flex-col items-center shrink-0">
                <span className="w-7 h-7 rounded-full bg-[#082C6B] text-white flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </span>
                {(!isLast || chain.contributingCauses.length > 0 || chain.downstreamEffects.length > 0) && (
                  <span className="w-px flex-1 min-h-[12px] bg-border mt-1" />
                )}
              </div>
              <div className="pb-3 min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#C9A84C]">{ar ? step.labelAr : step.label}</p>
                <p className="text-sm text-foreground leading-relaxed">{step.value}</p>
              </div>
            </div>

            {/* Contributing causes branch off the Immediate Cause step */}
            {i === 2 && chain.contributingCauses.length > 0 && (
              <div className="flex gap-3 mb-3">
                <div className="w-7 flex justify-center shrink-0">
                  <span className="w-px h-full bg-border/60 border-l border-dashed border-border" />
                </div>
                <div className="min-w-0 flex-1 -mt-1">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">
                    {ar ? 'أسباب مساهمة' : 'Contributing Causes'}
                  </p>
                  <ul className="space-y-1">
                    {chain.contributingCauses.map((c, ci) => (
                      <li key={ci} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <span className="w-1 h-1 mt-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Downstream effects if unresolved */}
      {chain.downstreamEffects.length > 0 && (
        <div className="flex gap-3">
          <div className="flex flex-col items-center shrink-0">
            <span className="w-7 h-7 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0">
              <ArrowDownCircle className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wide text-red-700">
              {ar ? 'الآثار اللاحقة إن لم تُعالج' : 'Downstream Effects if Unresolved'}
            </p>
            <ul className="space-y-1 mt-1">
              {chain.downstreamEffects.map((e, ei) => (
                <li key={ei} className="flex items-start gap-1.5 text-sm text-foreground">
                  <Layers className="w-3 h-3 mt-1 text-red-500 shrink-0" />
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
