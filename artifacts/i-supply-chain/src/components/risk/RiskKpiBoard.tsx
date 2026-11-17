import { useState } from 'react';
import { KPI_DEFS, kpiState, type KpiState } from '@/lib/riskPageData';

interface Props { isAr: boolean; onOpenTab: (tab: number) => void }

const LAB: Record<KpiState, { en: string; ar: string; cls: string; bar: string }> = {
  healthy: { en: 'Healthy', ar: 'سليم', cls: 'bg-green-500 text-white', bar: 'bg-green-500' },
  watch: { en: 'Watch', ar: 'مراقبة', cls: 'bg-yellow-400 text-gray-900', bar: 'bg-yellow-400' },
  attention: { en: 'High attention', ar: 'يحتاج انتباها عاليا', cls: 'bg-red-500 text-white', bar: 'bg-red-500' },
  none: { en: 'No value', ar: 'لا قيمة', cls: 'bg-muted text-muted-foreground', bar: 'bg-muted' },
};

/** Six risk KPIs shown separately, opening on clearly labelled example values so the board is never empty. */
export function RiskKpiBoard({ isAr, onOpenTab }: Props) {
  const [examples, setExamples] = useState(true);
  const [typed, setTyped] = useState<Record<string, string>>({});
  const valueOf = (id: string, example: number): string => (typed[id] !== undefined ? typed[id] : examples ? String(example) : '');

  return (
    <section aria-labelledby="kb-title" data-testid="risk-kpi-board" className="space-y-4">
      <div>
        <h2 id="kb-title" className="text-2xl font-bold text-primary">{isAr ? 'ست أبعاد لمخاطرك' : 'Six dimensions of your risk'}</h2>
        <p className="text-muted-foreground mt-1">{isAr ? 'تُعرض بقيم مثال لترى طريقة العمل. اكتب أرقامك لتحل محل الأمثلة.' : 'Shown with example values so you can see how it works. Type your own numbers and they replace the examples.'}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-400 text-gray-900" data-testid="kpi-mode">{examples ? (isAr ? 'قيم مثال، استبدلها بقيمك' : 'Example values, replace with yours') : (isAr ? 'قيمك' : 'Your values')}</span>
        <button type="button" onClick={() => { setExamples(v => !v); setTyped({}); }} className="min-h-[44px] px-4 rounded-lg border border-border text-sm text-primary hover:bg-muted">
          {examples ? (isAr ? 'امسح الأمثلة' : 'Clear examples') : (isAr ? 'استعد الأمثلة' : 'Restore examples')}
        </button>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {KPI_DEFS.map(k => {
          const raw = valueOf(k.id, k.example);
          const num = raw === '' ? null : Number(raw);
          const state = kpiState(num, k.target);
          const lab = LAB[state];
          return (
            <div key={k.id} className="bg-white border border-border rounded-2xl p-4 shadow-sm" data-testid={`kpi-${k.id}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold text-primary text-sm">{isAr ? k.name.ar : k.name.en}</p>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 ${lab.cls}`} data-testid={`kpi-state-${k.id}`}>{isAr ? lab.ar : lab.en}</span>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <label htmlFor={`kpi-in-${k.id}`} className="text-xs text-muted-foreground">{isAr ? 'قيمتك' : 'Your value'}</label>
                <input id={`kpi-in-${k.id}`} type="number" inputMode="decimal" min={0} max={100} value={raw}
                  onChange={e => setTyped(prev => ({ ...prev, [k.id]: e.target.value }))}
                  className="w-24 min-h-[44px] px-2 border border-border rounded-lg bg-white" />
                <span className="text-xs text-muted-foreground">{isAr ? 'المستهدف ' : 'Target '}{k.target}</span>
              </div>
              <div className="h-2 rounded bg-muted overflow-hidden mt-3" aria-hidden="true"><div className={`h-full transition-all ${lab.bar}`} style={{ width: `${num === null || Number.isNaN(num) ? 0 : Math.max(0, Math.min(100, num))}%` }} /></div>
              <p className="text-xs text-muted-foreground mt-2">{isAr ? k.meaning.ar : k.meaning.en}</p>
              {(state === 'watch' || state === 'attention') && (
                <p className="text-xs mt-2"><b>{isAr ? 'افعل هذا بعد ذلك: ' : 'Do this next: '}</b>{isAr ? k.next.ar : k.next.en}{' '}
                  <button type="button" onClick={() => onOpenTab(k.tab)} className="min-h-[44px] px-3 rounded-lg border border-border text-primary font-semibold hover:bg-muted">{isAr ? 'افتح' : 'Open'}</button>
                </p>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground bg-muted rounded-xl px-4 py-3">{isAr ? 'ست أبعاد تُعرض منفصلة: لا تدمجها ISC في درجة واحدة. الحالة: بلوغ الهدف = سليم؛ ضمن 10 نقاط = مراقبة؛ أبعد من ذلك = يحتاج انتباها عاليا (قاعدة استرشادية من ISC). بنود الاستمرارية متوافقة مع ISO 22301 وليست معتمدة.' : 'Six dimensions, shown separately: ISC does not collapse them into one score. Status: meets target is Healthy; within 10 points is Watch; further below is High attention (ISC indicative rule). Continuity items are aligned to ISO 22301, not certified.'}</p>
    </section>
  );
}
