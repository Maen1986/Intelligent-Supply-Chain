/**
 * Repositioning check for one supplier (Round B4, item 4).
 * Uses the supplier's recorded reviews and an optional shock to say:
 * hold, watch, treat as a short situation, or confirm a move. The rule is
 * ISC's own (no source publishes one) and every number can be changed.
 */
import { useMemo, useState } from 'react';
import { evaluateReposition, QUADRANT_NAME, type Quadrant, type ReviewPoint, type EventType, type Decision } from '@/lib/kraljicRepositioning';

const STYLE: Record<Decision, string> = {
  hold: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  'review-due': 'border-amber-200 bg-amber-50 text-amber-900',
  watch: 'border-amber-200 bg-amber-50 text-amber-900',
  situational: 'border-sky-200 bg-sky-50 text-sky-900',
  'confirm-move': 'border-indigo-300 bg-indigo-50 text-indigo-900',
  'need-facts': 'border-slate-300 bg-slate-50 text-slate-800',
};

export function KraljicPositionCheck({
  isAr, quadrant, reviews, asOfIso,
}: { isAr: boolean; quadrant: Quadrant; reviews: ReviewPoint[]; asOfIso: string }) {
  const L = (b: { en: string; ar: string }) => (isAr ? b.ar : b.en);
  const [evType, setEvType] = useState<EventType>('none');
  const [dur, setDur] = useState<string>('');
  const [surv, setSurv] = useState<string>('');
  const [confirmReviews, setConfirmReviews] = useState(2);
  const [showCfg, setShowCfg] = useState(false);

  const r = useMemo(() => evaluateReposition({
    confirmedQuadrant: quadrant, reviews, asOfIso, confirmReviews,
    event: evType === 'none' ? null : { type: evType, expectedDurationDays: dur === '' ? null : Number(dur), timeToSurviveDays: surv === '' ? null : Number(surv) },
  }), [quadrant, reviews, asOfIso, evType, dur, surv, confirmReviews]);

  const T = {
    title: isAr ? 'فحص الموقع: هل ينتقل فعلًا؟' : 'Position check: should it really move?',
    reviews: isAr ? 'مراجعات مسجّلة' : 'Reviews on record', event: isAr ? 'هل تحدث صدمة الآن؟' : 'Is a shock happening now?',
    none: isAr ? 'لا' : 'No', shock: isAr ? 'صدمة سوق' : 'Market shock', failure: isAr ? 'إخفاق مورد' : 'Supplier failure',
    dur: isAr ? 'المدة المتوقعة (أيام)' : 'Expected length (days)', surv: isAr ? 'مدة صمودنا دون إمداد (أيام)' : 'Days we can run without supply',
    cfg: isAr ? 'إعدادات القاعدة' : 'Rule settings', need: isAr ? 'عدد المراجعات المتتالية للتأكيد' : 'Consecutive reviews to confirm',
    handover: isAr ? 'عند الانتقال' : 'Handover', missing: isAr ? 'حقائق مطلوبة' : 'Facts needed',
    basis: isAr ? 'قاعدة ISC: لا يوجد مصدر منشور لها. الأرقام قابلة للتغيير.' : 'ISC rule: no published source states one. Numbers can be changed.',
    count: isAr ? 'متتالية' : 'consecutive',
  };
  const sel = 'w-full text-xs border border-slate-300 rounded-md px-2 py-1.5 bg-white min-h-[40px]';

  return (
    <details className="mt-2 rounded-lg border border-slate-200 p-2">
      <summary className="text-xs font-bold text-[#082C6B] cursor-pointer min-h-[36px] flex items-center">{T.title}</summary>
      <div className="mt-2 space-y-2">
        <div className={`rounded-lg border p-2 ${STYLE[r.decision]}`} role="status">
          <p className="text-[12px] font-bold">{L(r.headline)}</p>
          <ul className="list-disc ms-4 mt-1 text-[11px]">{r.reasons.map((x) => <li key={x.en}>{L(x)}</li>)}</ul>
          {r.candidate && <p className="text-[11px] mt-1">{L(QUADRANT_NAME[quadrant])} → {L(QUADRANT_NAME[r.candidate])} · <span dir="ltr">{r.consecutive}/{r.needed}</span> {T.count}</p>}
          {r.missing.length > 0 && <p className="text-[11px] mt-1 font-semibold">{T.missing}: <span className="font-normal">{r.missing.map((m) => L(m)).join(isAr ? '، ' : '; ')}</span></p>}
          {r.handover.length > 0 && (<><p className="text-[10px] font-bold uppercase mt-2">{T.handover}</p><ul className="list-disc ms-4 text-[11px]">{r.handover.map((x) => <li key={x.en}>{L(x)}</li>)}</ul></>)}
        </div>
        <p className="text-[10px] text-slate-500">{T.reviews}: <span dir="ltr">{reviews.length}</span>. {T.basis}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <label className="block text-[11px] text-slate-600">{T.event}
            <select className={sel} value={evType} onChange={(e) => setEvType(e.target.value as EventType)}>
              <option value="none">{T.none}</option><option value="market-shock">{T.shock}</option><option value="supplier-failure">{T.failure}</option>
            </select>
          </label>
          {evType !== 'none' && (<>
            <label className="block text-[11px] text-slate-600">{T.dur}
              <input type="number" min={0} inputMode="numeric" dir="ltr" className={sel} value={dur} onChange={(e) => setDur(e.target.value)} />
            </label>
            <label className="block text-[11px] text-slate-600">{T.surv}
              <input type="number" min={0} inputMode="numeric" dir="ltr" className={sel} value={surv} onChange={(e) => setSurv(e.target.value)} />
            </label>
          </>)}
        </div>
        <button type="button" aria-expanded={showCfg} onClick={() => setShowCfg((v) => !v)} className="text-[11px] font-semibold text-slate-600 underline min-h-[32px]">{T.cfg}</button>
        {showCfg && (
          <label className="block text-[11px] text-slate-600 max-w-[220px]">{T.need}
            <input type="number" min={1} max={6} inputMode="numeric" dir="ltr" className={sel} value={confirmReviews} onChange={(e) => setConfirmReviews(Math.min(6, Math.max(1, Math.floor(Number(e.target.value) || 2))))} />
          </label>
        )}
      </div>
    </details>
  );
}
