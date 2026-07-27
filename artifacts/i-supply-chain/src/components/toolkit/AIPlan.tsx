/**
 * AIPlan — thin wrapper that bridges an AIPlanState (from useAIPlan) into
 * AIPlanPanel for tools that prefer to pass state as a single prop object.
 *
 * Usage:
 *   const aiPlan = useAIPlan(buildPrompt, isAr, 'toolKey', canGenerate);
 *   <AIPlan state={aiPlan} isAr={isAr} toolKey="toolKey" />
 */
import { AIPlanPanel } from '@/components/AIPlanPanel';
import { type AIPlanState } from '@/hooks/useAIPlan';
import { useLanguage } from '@/lib/LanguageContext';

interface AIPlanProps {
  state:   AIPlanState;
  isAr:    boolean;
  toolKey: string;
  /** Override the default button label */
  buttonLabel?: string;
  /** Disable the generate button (e.g. not enough data entered yet) */
  disabled?: boolean;
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
