/**
 * Report pack extras (Round B5, items 13 and 14), shown inside the management
 * report: a portfolio bubble chart (size = annual spend), the movement log,
 * savings and TCO rules, and an evidence summary. Printable. Bubbles use the
 * latest scored review when there is one and are marked "not scored" otherwise.
 */
import { useMemo } from 'react';
import { bubblePoints, type BubbleIn } from '@/lib/kraljicPack';
import { movementLog, SOURCE_LEDGER, EVIDENCE_LABEL, type LedgerEntry, type EvidenceStatus } from '@/lib/kraljicLedger';
import { SAVINGS_RULES, tcoRequired } from '@/lib/kraljicPlaybook';
import { CIPS_QUADRANT_LABEL, type Q } from '@/lib/kraljicCipsWording';

const FILL: Record<Q, string> = { strategic: '#6366f1', leverage: '#059669', bottleneck: '#d97706', 'non-critical': '#6b7280' };
const BG: Record<Q, string> = { leverage: '#ECFDF5', strategic: '#EEF2FF', 'non-critical': '#F9FAFB', bottleneck: '#FFFBEB' };

export function KraljicReportPack({
  isAr, items, entries, nameOf,
}: {
  isAr: boolean; items: BubbleIn[]; entries: LedgerEntry[]; nameOf: (id: string) => string;
}) {
  const L = (b: { en: string; ar: string }) => (isAr ? b.ar : b.en);
  const bubbles = useMemo(() => bubblePoints(items), [items]);
  const moves = useMemo(() => movementLog(entries), [entries]);
  const counts = useMemo(() => {
    const c: Record<EvidenceStatus, number> = { verified: 0, secondary: 0, snippet: 0, 'member-only': 0, unconfirmed: 0, 'isc-synthesis': 0 };
    for (const s of SOURCE_LEDGER) c[s.status]++;
    return c;
  }, []);
  const unscored = bubbles.filter((b) => !b.scored).length;
  const T = {
    port: isAr ? 'عرض المحفظة' : 'Portfolio view', note: isAr ? 'حجم الدائرة يتبع الإنفاق السنوي. الموقع من آخر مراجعة مُقيَّمة، أو من مركز الربع إن لم توجد.' : 'Bubble size follows annual spend. Position comes from the latest scored review, or the quadrant centre when there is none.',
    risk: isAr ? 'خطر الإمداد (يرتفع نحو اليمين)' : 'Supply risk (rises to the right)', profit: isAr ? 'أثر التكلفة (يرتفع نحو الأعلى)' : 'Cost impact (rises upward)', unscored: isAr ? 'دوائر بلا تقييم' : 'bubbles not scored',
    move: isAr ? 'سجل الانتقالات' : 'Movement log', none: isAr ? 'لا انتقالات مسجّلة بعد.' : 'No movements recorded yet.',
    sav: isAr ? 'قواعد الوفر وإجمالي تكلفة الملكية' : 'Savings and total-cost-of-ownership rules', tco: isAr ? 'بنود تتطلب إجمالي تكلفة الملكية أساسًا' : 'Items that need total cost of ownership as the base',
    ev: isAr ? 'ملخص الأدلة' : 'Evidence summary', evNote: isAr ? 'كل ادعاء في هذا التقرير يستند إلى أحد هذه المستويات. التفاصيل في تبويب الأدلة.' : 'Every claim in this report rests on one of these levels. Details are in the Evidence tab.',
  };
  const tcoItems = items.filter((i) => tcoRequired(i.quadrant));
  return (
    <div className="space-y-4">
      <section className="border border-slate-200 rounded-xl p-3 break-inside-avoid">
        <h3 className="text-sm font-bold text-slate-800">{T.port}</h3>
        <figure className="mt-2" dir="ltr">
          <svg viewBox="0 0 330 270" role="img" className="w-full h-auto max-w-[520px] mx-auto" aria-label={T.port}>
            <rect x="30" y="8" width="145" height="110" fill={BG.leverage} stroke="#a7f3d0" /><rect x="175" y="8" width="145" height="110" fill={BG.strategic} stroke="#c7d2fe" />
            <rect x="30" y="118" width="145" height="110" fill={BG['non-critical']} stroke="#e5e7eb" /><rect x="175" y="118" width="145" height="110" fill={BG.bottleneck} stroke="#fde68a" />
            <text x="36" y="22" fontSize="10" fill="#065f46">{L(CIPS_QUADRANT_LABEL.leverage)}</text>
            <text x="181" y="22" fontSize="10" fill="#3730a3">{L(CIPS_QUADRANT_LABEL.strategic)}</text>
            <text x="36" y="224" fontSize="10" fill="#374151">{L(CIPS_QUADRANT_LABEL['non-critical'])}</text>
            <text x="181" y="224" fontSize="10" fill="#92400e">{L(CIPS_QUADRANT_LABEL.bottleneck)}</text>
            <text x="175" y="248" fontSize="10" fill="#374151" textAnchor="middle">{T.risk}</text>
            <text x="12" y="118" fontSize="10" fill="#374151" textAnchor="middle" transform="rotate(-90 12 118)">{T.profit}</text>
            {bubbles.map((b) => {
              const cx = 30 + (b.x / 100) * 290; const cy = 228 - (b.y / 100) * 220;
              return (
                <g key={b.supplierId}>
                  <title>{`${b.name}${b.scored ? '' : ` (${T.unscored})`}`}</title>
                  <circle cx={cx} cy={cy} r={b.r} fill={FILL[b.quadrant]} fillOpacity={b.scored ? 0.75 : 0.35} stroke={FILL[b.quadrant]} strokeDasharray={b.scored ? undefined : '3 2'} />
                </g>
              );
            })}
          </svg>
        </figure>
        <p className="text-[10px] text-slate-500">{T.note} {unscored > 0 && <span>({unscored} {T.unscored})</span>}</p>
        <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
          {bubbles.map((b) => <li key={b.supplierId} className="text-[10px] text-slate-600 inline-flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full" style={{ background: FILL[b.quadrant] }} aria-hidden="true" /><bdi>{b.name}</bdi></li>)}
        </ul>
      </section>

      <section className="border border-slate-200 rounded-xl p-3 break-inside-avoid">
        <h3 className="text-sm font-bold text-slate-800">{T.move}</h3>
        {moves.length === 0 ? <p className="text-[11px] text-slate-500">{T.none}</p> : (
          <ul className="mt-1 text-[11px] text-slate-700 space-y-0.5">
            {moves.map((m) => <li key={m.supplierId + m.dateIso}><bdi>{nameOf(m.supplierId)}</bdi> <span dir="ltr">{m.dateIso}</span>: {L(CIPS_QUADRANT_LABEL[m.fromQuadrant])} → {L(CIPS_QUADRANT_LABEL[m.toQuadrant])}</li>)}
          </ul>
        )}
      </section>

      <section className="border border-slate-200 rounded-xl p-3 break-inside-avoid">
        <h3 className="text-sm font-bold text-slate-800">{T.sav}</h3>
        <ul className="mt-1 list-disc ms-5 text-[11px] text-slate-700 space-y-0.5">{SAVINGS_RULES.map((r) => <li key={r.text.en}>{L(r.text)}</li>)}</ul>
        {tcoItems.length > 0 && <p className="text-[11px] text-slate-700 mt-1.5"><b>{T.tco}: </b>{tcoItems.map((i, k) => <span key={i.supplierId}>{k > 0 ? (isAr ? '، ' : ', ') : ''}<bdi>{i.name}</bdi></span>)}</p>}
      </section>

      <section className="border border-slate-200 rounded-xl p-3 break-inside-avoid">
        <h3 className="text-sm font-bold text-slate-800">{T.ev}</h3>
        <ul className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4 text-[11px] text-slate-700">
          {(Object.keys(counts) as EvidenceStatus[]).map((k) => <li key={k}>{L(EVIDENCE_LABEL[k])}: <b dir="ltr">{counts[k]}</b></li>)}
        </ul>
        <p className="text-[10px] text-slate-500 mt-1">{T.evNote}</p>
      </section>
    </div>
  );
}
