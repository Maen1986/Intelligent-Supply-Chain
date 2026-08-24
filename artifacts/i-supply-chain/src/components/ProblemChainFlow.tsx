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
//
// #177 delta (24 Aug 2026): the 4 top-level steps were always a connected
// step-flow; contributingCauses[] and downstreamEffects[] were still plain
// <ul><li> bullet lists, which is exactly the "bullet text" #177 asked to
// replace. Both now render as their own connected step-nodes in the same
// icon-in-circle + line vocabulary as the main chain, rather than being
// rebuilt from scratch -- contributing causes as smaller dashed-line branch
// nodes off Immediate Cause (parallel inputs, not sequential steps, so the
// smaller size + dashed connector honestly signals "branch" vs "chain"),
// downstream effects as full-size solid-line nodes cascading from Root
// Cause (genuinely sequential-reading consequences, same visual weight as
// the main chain).
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

            {/* Contributing causes branch off the Immediate Cause step (#177: connected
                branch nodes, not a bullet list -- smaller badge + dashed connector honestly
                signals "parallel input," distinct from the main chain's solid sequential line) */}
            {i === 2 && chain.contributingCauses.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1 ml-10">
                  {ar ? 'أسباب مساهمة' : 'Contributing Causes'}
                </p>
                {chain.contributingCauses.map((cause, ci) => {
                  const isLastCause = ci === chain.contributingCauses.length - 1;
                  return (
                    <div key={ci} className="flex gap-3">
                      <div className="flex flex-col items-center shrink-0 pl-2">
                        <span className="w-5 h-5 rounded-full bg-muted border border-dashed border-muted-foreground/40 text-muted-foreground flex items-center justify-center shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60" />
                        </span>
                        {!isLastCause && (
                          <span className="w-px flex-1 min-h-[8px] border-l border-dashed border-border mt-1" />
                        )}
                      </div>
                      <div className="pb-2 min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground leading-relaxed">{cause}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Downstream effects if unresolved (#177: each effect is now its own
          connected node cascading from Root Cause, same solid-line weight as
          the main chain -- these read as genuinely sequential consequences,
          not an unordered bullet list) */}
      {chain.downstreamEffects.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-red-700 mb-1">
            {ar ? 'الآثار اللاحقة إن لم تُعالج' : 'Downstream Effects if Unresolved'}
          </p>
          {chain.downstreamEffects.map((effect, ei) => {
            const isLastEffect = ei === chain.downstreamEffects.length - 1;
            return (
              <div key={ei} className="flex gap-3">
                <div className="flex flex-col items-center shrink-0">
                  <span className="w-7 h-7 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                    {ei === 0 ? <ArrowDownCircle className="w-3.5 h-3.5" /> : <Layers className="w-3 h-3" />}
                  </span>
                  {!isLastEffect && (
                    <span className="w-px flex-1 min-h-[10px] bg-red-200 mt-1" />
                  )}
                </div>
                <div className="pb-2 min-w-0 flex-1">
                  <p className="text-sm text-foreground leading-relaxed">{effect}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
