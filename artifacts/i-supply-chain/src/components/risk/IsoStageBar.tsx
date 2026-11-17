import { ISO_STAGE_BY_TAB } from '@/lib/riskPageData';

/** One line naming the ISO 31000:2018 process stage of the open tab. Aligned to, not certified. */
export function IsoStageBar({ isAr, tab }: { isAr: boolean; tab: number }) {
  const stage = ISO_STAGE_BY_TAB[tab];
  if (!stage) return null;
  return (
    <p className="text-xs text-muted-foreground mb-4" data-testid="iso-stage">
      <b className="text-primary">ISO 31000</b> · {isAr ? 'المرحلة: ' : 'stage: '}{isAr ? stage.ar : stage.en}
      <span className="ms-2 opacity-80">{isAr ? '(متوافق مع المعيار، غير معتمد)' : '(aligned to the standard, not certified)'}</span>
    </p>
  );
}
