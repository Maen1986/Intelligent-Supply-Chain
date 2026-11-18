import { REGIONAL_INDICATORS } from '@/lib/regionalIndicators';
import { REGIONAL_INDICATORS_AR, REGIONAL_GROUP_LABELS } from '@/lib/regionalIndicatorsAr';

interface Props { isAr: boolean }

const GROUP_ORDER = ['halal', 'drivers', 'otif', 'turnaround', 'spares-tooling', 'cyber'] as const;

/** Regional measures for Saudi, Jordan and GCC. ISC definitions only: no values, no thresholds, no combined score. */
export function RegionalMeasures({ isAr }: Props) {
  return (
    <section aria-labelledby="rm-title" data-testid="regional-measures" dir={isAr ? 'rtl' : 'ltr'}>
      <details className="rounded-lg border border-border bg-card">
        <summary id="rm-title" className="cursor-pointer p-4 text-lg font-bold text-primary min-h-[44px]">
          {isAr ? 'مقاييس إقليمية للسعودية والأردن ودول الخليج' : 'Regional measures for Saudi, Jordan and GCC'}
        </summary>
        <div className="p-4 pt-0 space-y-4">
          <p className="text-muted-foreground">
            {isAr
              ? 'تعريفات من آي سبلاي تشين، لا أرقام فيها. معاملات كل دولة تُملأ حين يوجد مصدر رسمي. النص العربي مراجَع وغير معتمد من قارئ أصلي.'
              : 'ISC definitions, with no values. Country parameters are filled in when an official source exists. Arabic is reviewed, not certified by a native reader.'}
          </p>
          {GROUP_ORDER.map((g) => {
            const rows = REGIONAL_INDICATORS.filter((r) => r.group === g);
            const label = REGIONAL_GROUP_LABELS[g];
            return (
              <details key={g} data-testid={`regional-group-${g}`} className="rounded-md border border-border">
                <summary className="cursor-pointer p-3 font-semibold min-h-[44px]">{isAr ? label.ar : label.en} ({rows.length})</summary>
                <div className="p-3 space-y-4">
                  {rows.map((r) => {
                    const ar = REGIONAL_INDICATORS_AR[r.id];
                    const pending = r.parameterStatus === 'unconfirmed' ? 'unconfirmed' : r.parameterStatus === 'partly-confirmed' ? 'partly' : null;
                    return (
                      <article key={r.id} data-testid="regional-indicator" className="space-y-1 border-b border-border pb-3 last:border-0">
                        <h3 className="font-semibold">{isAr ? ar.indicator : r.indicator}</h3>
                        <p className="text-sm"><span className="font-medium">{isAr ? 'الصيغة: ' : 'Formula: '}</span><bdi>{isAr ? ar.formula : r.formula}</bdi></p>
                        <p className="text-sm text-muted-foreground">{isAr ? `الوحدة: ${ar.unit} · التكرار: ${ar.frequency}` : `Unit: ${r.unit} · Frequency: ${r.frequency}`}</p>
                        <p className="text-sm">{isAr ? ar.rule : r.rule}</p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{isAr ? 'تعريف آي سبلاي تشين' : 'ISC definition'}</span>
                          {pending && (
                            <span data-testid={`param-${pending}`} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              {pending === 'unconfirmed' ? (isAr ? 'معامل غير مؤكَّد' : 'Parameter not confirmed') : (isAr ? 'معامل مؤكَّد جزئيًا' : 'Parameter partly confirmed')}
                            </span>
                          )}
                        </div>
                        {pending && <p className="text-xs text-muted-foreground">{isAr ? ar.parameter : r.parameterNote}</p>}
                      </article>
                    );
                  })}
                </div>
              </details>
            );
          })}
        </div>
      </details>
    </section>
  );
}
