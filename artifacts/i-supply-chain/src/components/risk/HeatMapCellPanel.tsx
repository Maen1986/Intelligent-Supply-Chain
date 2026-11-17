import type { HeatMapRisk } from '@/lib/riskPageData';
import { bandView } from '@/lib/riskPageData';

interface Props { cell: string | null; risks: HeatMapRisk[]; isAr: boolean; onClear: () => void }

/** Lists the sample risks in the selected heat-map cell, or all of them ranked when none is selected. */
export function HeatMapCellPanel({ cell, risks, isAr, onClear }: Props) {
  const [l, i] = cell ? cell.split('-').map(Number) : [0, 0];
  const list = (cell ? risks.filter(r => r.l === l && r.i === i) : risks).slice().sort((a, b) => b.l * b.i - a.l * a.i);
  return (
    <div className="bg-white border border-border rounded-2xl p-5 shadow-sm" data-testid="heatmap-panel" aria-live="polite">
      <div className="flex items-center justify-between gap-2 mb-3">
        <p className="font-bold text-primary">
          {cell ? (isAr ? `في الخلية المختارة (احتمال ${l}، أثر ${i})` : `In the selected cell (likelihood ${l}, impact ${i})`) : (isAr ? 'كل المخاطر النموذجية مرتّبة' : 'All sample risks, ranked')}
        </p>
        {cell && <button type="button" onClick={onClear} className="min-h-[44px] px-3 rounded-lg border border-border text-sm text-primary hover:bg-muted">{isAr ? 'مسح الاختيار' : 'Clear selection'}</button>}
      </div>
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">{isAr ? 'لا مخاطر في هذه الخلية.' : 'No risks in this cell.'}</p>
      ) : (
        <ul className="space-y-2">
          {list.map(r => {
            const b = bandView(r.l * r.i);
            return (
              <li key={r.id} className="flex items-center gap-3 text-sm">
                <span className={`w-9 h-9 rounded-lg flex items-center justify-center font-extrabold text-xs shrink-0 ${b.cls}`}>{r.l * r.i}</span>
                <span className="flex-1">{r.id}: {isAr ? r.nameAr : r.name}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${b.cls}`}>{isAr ? b.ar : b.en}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
