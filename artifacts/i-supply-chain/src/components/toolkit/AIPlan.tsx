/**
 * AIPlan — thin adapter that bridges useAIPlan's AIPlanState object into
 * AIPlanPanel's individual props.  Used by pages (e.g. KraljicMatrix) that
 * call useAIPlan themselves and just need to render the panel.
 *
 * Usage:
 *   const aiPlan = useAIPlan(buildPrompt, isAr, 'toolKey', canGenerate);
 *   <AIPlan state={aiPlan} isAr={isAr} toolKey="toolKey" />
 */
import React from 'react';
import { AIPlanPanel } from '@/components/AIPlanPanel';
import { type AIPlanState } from '@/hooks/useAIPlan';

interface AIPlanProps {
  state:        AIPlanState;
  isAr:         boolean;
  toolKey?:     string;
  /** Override the generate button label. Defaults to a generic label. */
  buttonLabel?: string;
  /** Disable the generate button (e.g. not enough data entered yet). */
  disabled?:    boolean;
}

export function AIPlan({ state, isAr, toolKey, buttonLabel, disabled }: AIPlanProps) {
  const label = buttonLabel ?? (isAr ? 'توليد خطة الذكاء الاصطناعي ✨' : 'Generate AI Plan ✨');

  return (
    <AIPlanPanel
      loading={state.loading}
      result={state.result}
      error={state.error}
      rateLimited={state.rateLimited}
      onGenerate={state.generate}
      onReset={state.reset}
      savedPlan={state.savedPlan}
      onViewSaved={state.viewSaved}
      onDeleteSaved={state.deleteSaved}
      buttonLabel={label}
      isAr={isAr}
      toolKey={toolKey}
      disabled={disabled}
    />
  );
}
