/**
 * CIPS seven-step Kraljic scoring tool (Round B4, item 2).
 * Rate each CIPS factor 1-5, see the quadrant, how close it is to a boundary,
 * and which single weight change would flip it. Optionally record the result
 * as a review for a supplier, which feeds the repositioning check.
 * Nothing is guessed: too few answers shows what is missing.
 */
import { useMemo, useState } from 'react';
import { CIPS_FACTORS, SCALE_NOTE, DEFAULTS, scoreItem, type Quadrant, type Axis } from '@/lib/kraljicCipsScoring';
import { CIPS_QUADRANT_LABEL, CIPS_AXIS_LABEL, CIPS_ONE_LINE } from '@/lib/kraljicCipsWording';

export interface ScorerSupplierOption { supplierId: string; name: string }

export function KraljicScorer({
  isAr, suppliers, onRecord,
}: {
  isAr: boolean;
  suppliers: ScorerSupplierOption[];
  onRecord: (supplierId: string, point: { quadrant: Quadrant; riskPct: number; profitPct: number }) => void;
}) {
  const L = (b: { en: string; ar: string }) => (isAr ? b.ar : b.en);
  const [ratings, setRatings] = useState<Record<string, number | null>>({});
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [showWeights, setShowWeights] = useState(false);
  const [target, setTarget] = useState('');
  const [saved, setSaved] = useState(false);

  const result = useMemo(() => scoreItem(ratings, { weights }), [ratings, weights]);
  const answered = CIPS_FACTORS.filter((f) => typeof ratings[f.id] === 'number').length;

  const T = {
    title: isAr ? 'قيّم بند أو مورد بطريقة CIPS' : 'Score an item the CIPS way',
    intro: isAr ? 'طريقة CIPS ذات الخطوات السبع: عوامل مرجّحة تُقيَّم من 1 إلى 5. تبيّن الأداة مدى قرب النتيجة من الحدّ وما الذي قد يقلبها.' : 'The CIPS seven-step method: weighted factors rated 1 to 5. The tool shows how close the result is to a boundary and what could flip it.',
    progress: isAr ? 'تم الجواب عن' : 'Answered', of: isAr ? 'من' : 'of',
    risk: L(CIPS_AXIS_LABEL.risk), profit: L(CIPS_AXIS_LABEL.cost),
    weights: isAr ? 'تعديل الأوزان' : 'Adjust the weights', weightNote: isAr ? 'الأوزان المتساوية افتراضية من آي سبلاي تشين. CIPS لا تنشر أوزانًا. اجعل الوزن 0 لإيقاف عامل.' : 'Equal weights are an ISC default: CIPS publishes none. Set a weight to 0 to switch a factor off.',
    reset: isAr ? 'مسح الإجابات' : 'Clear answers',
    result: isAr ? 'النتيجة' : 'Result', needMore: isAr ? 'أجب عن مزيد من العوامل' : 'Answer more factors',
    border: isAr ? 'قريب من الحدّ: الأفضل ألّا تعتمد على هذه النتيجة وحدها.' : 'Close to a boundary: do not rely on this result alone.',
    flips: isAr ? 'تغيير وزن عامل واحد يقلب الربع' : 'Changing the weight of one factor flips the quadrant',
    flipsTo: isAr ? 'يصبح' : 'becomes', missing: isAr ? 'عوامل لم يُجَب عنها' : 'Factors not yet answered',
    record: isAr ? 'سجّل كمراجعة لمورد' : 'Record as a review for a supplier', pick: isAr ? 'اختر موردًا' : 'Choose a supplier',
    recordBtn: isAr ? 'سجّل المراجعة' : 'Record review', savedMsg: isAr ? 'سُجّلت المراجعة. ستظهر في فحص الموقع للمورد.' : 'Review recorded. It now feeds the supplier\'s position check.',
    strategy: isAr ? 'استراتيجية CIPS لهذا الربع' : 'CIPS strategy for this quadrant', weight: isAr ? 'الوزن' : 'Weight',
    boundaryNote: isAr ? `الحدّ ${DEFAULTS.boundaryPct}% والهامش ${DEFAULTS.borderlineMargin} نقاط قيمتان افتراضيتان من آي سبلاي تشين.` : `Boundary ${DEFAULTS.boundaryPct}% and margin ${DEFAULTS.borderlineMargin} points are ISC defaults.`,
  };

  const AXES: Axis[] = ['risk', 'profit'];

  function Bar({ label, pct }: { label: string; pct: number }) {
    return (
      <div>
        <div className="flex justify-between text-[11px] text-slate-700"><span>{label}</span><span dir="ltr" className="font-bold">{pct.toFixed(0)}%</span></div>
        <div className="relative h-2.5 rounded-full bg-slate-100 mt-1" role="img" aria-label={`${label}: ${pct.toFixed(0)}%`}>
          <div className="absolute inset-y-0 start-0 rounded-full bg-[#082C6B]" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
          <div className="absolute inset-y-[-3px] w-0.5 bg-red-500" style={{ insetInlineStart: `${DEFAULTS.boundaryPct}%` }} aria-hidden="true" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-slate-800">{T.title}</h3>
        <p className="text-xs text-slate-600 mt-1">{T.intro}</p>
        <p className="text-[11px] text-slate-500 mt-1">{L(SCALE_NOTE)}</p>
      </div>

      <div className="lg:hidden sticky top-0 z-10 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 flex items-center justify-between gap-2 text-xs" aria-hidden="true">
        <span className="text-slate-600">{T.progress} <span dir="ltr" className="font-bold">{answered} {T.of} {CIPS_FACTORS.length}</span></span>
        <span className="font-bold text-[#082C6B]">{result.status === 'scored' && result.quadrant ? L(CIPS_QUADRANT_LABEL[result.quadrant]) : '…'}</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 items-start">
        <div className="space-y-3">
          {AXES.map((axis) => (
            <fieldset key={axis} className="rounded-xl border border-slate-200 bg-white p-3">
              <legend className="px-1 text-xs font-bold text-slate-800">{axis === 'risk' ? T.risk : T.profit}</legend>
              <ul className="space-y-3">
                {CIPS_FACTORS.filter((f) => f.axis === axis).map((f) => (
                  <li key={f.id}>
                    <div role="radiogroup" aria-label={L(f.label)}>
                      <p className="text-[12px] text-slate-800 mb-1">{L(f.label)}</p>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={n} type="button" role="radio" aria-checked={ratings[f.id] === n}
                            onClick={() => { setRatings((r) => ({ ...r, [f.id]: r[f.id] === n ? null : n })); setSaved(false); }}
                            className={`h-10 w-10 rounded-lg border text-sm font-bold ${ratings[f.id] === n ? 'bg-[#082C6B] border-[#082C6B] text-white' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                            <span dir="ltr">{n}</span>
                          </button>
                        ))}
                        {showWeights && (
                          <label className="ms-2 text-[11px] text-slate-600 flex items-center gap-1">{T.weight}
                            <input type="number" min={0} step={1} inputMode="numeric" dir="ltr" className="w-14 border border-slate-300 rounded-md px-1.5 py-1 text-xs min-h-[36px]"
                              value={weights[f.id] ?? f.defaultWeight}
                              onChange={(e) => setWeights((w) => ({ ...w, [f.id]: Math.max(0, Number(e.target.value) || 0) }))} />
                          </label>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </fieldset>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" aria-expanded={showWeights} onClick={() => setShowWeights((v) => !v)} className="text-xs font-semibold text-[#082C6B] underline min-h-[36px]">{T.weights}</button>
            <button type="button" onClick={() => { setRatings({}); setWeights({}); setSaved(false); }} className="text-xs font-semibold text-slate-600 underline min-h-[36px]">{T.reset}</button>
          </div>
          {showWeights && <p className="text-[11px] text-slate-500">{T.weightNote}</p>}
        </div>

        <aside className="rounded-xl border border-slate-200 bg-white p-3 space-y-3 lg:sticky lg:top-4" aria-live="polite">
          <p className="text-[10px] font-bold uppercase text-slate-500">{T.result} · {T.progress} <span dir="ltr">{answered} {T.of} {CIPS_FACTORS.length}</span></p>
          {result.status === 'insufficient' ? (
            <div>
              <p className="text-sm font-bold text-amber-900">{T.needMore}</p>
              <p className="text-[11px] text-slate-600 mt-1">{isAr ? result.stepsNoteAr : result.stepsNoteEn}</p>
            </div>
          ) : (
            <>
              <div>
                <span className="inline-block text-sm font-bold px-3 py-1.5 rounded-lg bg-[#082C6B] text-white">{result.quadrant && L(CIPS_QUADRANT_LABEL[result.quadrant])}</span>
                {result.quadrant && (
                  <p className="text-[11px] text-slate-700 mt-2"><b>{T.strategy}: </b>{L(CIPS_ONE_LINE[result.quadrant].strategy)}</p>
                )}
              </div>
              <Bar label={T.risk} pct={result.risk.pct} />
              <Bar label={T.profit} pct={result.profit.pct} />
              <p className="text-[10px] text-slate-500">{T.boundaryNote}</p>
              {result.borderline && <p className="text-[11px] rounded-lg border border-amber-200 bg-amber-50 text-amber-900 p-2">{T.border}</p>}
              {result.flipFactors.length > 0 && (
                <div className="text-[11px] rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-900 p-2">
                  <p className="font-semibold">{T.flips}:</p>
                  <ul className="list-disc ms-4 mt-0.5">{result.flipFactors.map((x) => <li key={x.id}>{L(x.label)} ({T.flipsTo} {L(CIPS_QUADRANT_LABEL[x.flipsTo])})</li>)}</ul>
                </div>
              )}
              <p className="text-[10px] text-slate-500">{isAr ? result.stepsNoteAr : result.stepsNoteEn}</p>
              {suppliers.length > 0 && result.quadrant && (
                <div className="border-t border-slate-200 pt-3">
                  <p className="text-[11px] font-semibold text-slate-700">{T.record}</p>
                  <div className="flex gap-2 mt-1">
                    <select aria-label={T.pick} className="flex-1 min-w-0 text-xs border border-slate-300 rounded-md px-2 py-1.5 bg-white min-h-[40px]" value={target} onChange={(e) => { setTarget(e.target.value); setSaved(false); }}>
                      <option value="">{T.pick}</option>
                      {suppliers.map((s) => <option key={s.supplierId} value={s.supplierId}>{s.name}</option>)}
                    </select>
                    <button type="button" disabled={!target} onClick={() => { onRecord(target, { quadrant: result.quadrant as Quadrant, riskPct: result.risk.pct, profitPct: result.profit.pct }); setSaved(true); }}
                      className="text-xs font-semibold px-3 rounded-lg bg-[#082C6B] text-white disabled:opacity-40 min-h-[40px]">{T.recordBtn}</button>
                  </div>
                  {saved && <p className="text-[11px] text-emerald-800 mt-1" role="status">{T.savedMsg}</p>}
                </div>
              )}
            </>
          )}
          {result.missing.length > 0 && result.status === 'insufficient' && (
            <details className="text-[11px] text-slate-600">
              <summary className="cursor-pointer min-h-[32px] font-semibold">{T.missing} ({result.missing.length})</summary>
              <ul className="list-disc ms-4 mt-1">{result.missing.map((m) => <li key={m.id + m.axis}>{L(m.label)}</li>)}</ul>
            </details>
          )}
        </aside>
      </div>
    </div>
  );
}
