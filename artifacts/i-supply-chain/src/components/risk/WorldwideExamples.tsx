import { SOURCE_KIND_LABEL, WORLDWIDE } from '@/lib/riskPageData';

interface Props { index: number; isAr: boolean; onOpenRegister: () => void; onOpenHeatMap: () => void }

/** Worldwide, sourced examples for one risk category, with next-step buttons. */
export function WorldwideExamples({ index, isAr, onOpenRegister, onOpenHeatMap }: Props) {
  const items = WORLDWIDE[index] ?? [];
  return (
    <div className="border-t border-border p-5 space-y-3" data-testid="worldwide-examples">
      <p className="text-xs font-bold text-primary uppercase tracking-widest">{isAr ? 'أمثلة عالمية' : 'Worldwide examples'}</p>
      <ul className="space-y-2">
        {items.map(x => (
          <li key={x.url} className="text-xs text-muted-foreground">
            <span className="text-foreground font-medium">{isAr ? x.ar : x.en}</span> ({x.year}).{' '}
            <a href={x.url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">{x.sourceName}</a>
            {' · '}{isAr ? SOURCE_KIND_LABEL[x.kind].ar : SOURCE_KIND_LABEL[x.kind].en}
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-muted-foreground">{isAr ? 'سجل عام؛ المصدر مذكور لكل مثال وتم فحصه في 18 نوفمبر 2026.' : 'Public record; the source is named for each example and was checked on 18 Nov 2026.'}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onOpenRegister} className="min-h-[44px] px-4 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90">{isAr ? 'أضف إلى سجلي' : 'Add to my register'}</button>
        <button type="button" onClick={onOpenHeatMap} className="min-h-[44px] px-4 rounded-lg border border-border text-primary text-sm font-semibold hover:bg-muted">{isAr ? 'شاهدها على خريطة الحرارة' : 'See it on the heat map'}</button>
      </div>
    </div>
  );
}
