/**
 * Evidence tab (Round B5, items 10, 11, 13).
 *  1. Measurement ledger: KPIs, an entry form, the entries and the movement log.
 *  2. Savings calculator that follows the CIPS savings rules.
 *  3. Source ledger: what each claim rests on, and how strongly.
 *  4. Wording pack: English crosswalk, Arabic with English in brackets, spellings.
 * Entries live in the browser (localStorage) until a database table is built:
 * that is a logged gap, not a hidden one.
 */
import { useMemo, useState } from 'react';
import { CIPS_QUADRANT_LABEL, CROSSWALK, CIPS_SYLLABUS_ANCHORS, arabicWithEnglish, KRALJIC_SPELLINGS_AR, KRALJIC_PREFERRED_AR, ARABIC_DISCLOSURE, type Q } from '@/lib/kraljicCipsWording';
import {
  ledgerKpis, movementLog, emptyOutcome, SOURCE_LEDGER, EVIDENCE_LABEL, LEDGER_NOTE, type LedgerEntry, type EvidenceStatus,
} from '@/lib/kraljicLedger';
import { computeSavings, SAVINGS_RULES, tcoRequired } from '@/lib/kraljicPlaybook';

export interface LedgerSupplier { supplierId: string; name: string; quadrant: Q; subtype: string }

const sel = 'w-full text-xs border border-slate-300 rounded-md px-2 py-1.5 bg-white min-h-[36px]';
const lab = 'block text-[11px] text-slate-600';
const STATUS_STYLE: Record<EvidenceStatus, string> = {
  verified: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  secondary: 'bg-sky-50 border-sky-200 text-sky-800',
  snippet: 'bg-amber-50 border-amber-200 text-amber-800',
  'member-only': 'bg-slate-100 border-slate-300 text-slate-700',
  unconfirmed: 'bg-red-50 border-red-200 text-red-800',
  'isc-synthesis': 'bg-indigo-50 border-indigo-200 text-indigo-800',
};

export function EvidenceBadge({ isAr, status }: { isAr: boolean; status: EvidenceStatus }) {
  return <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded border whitespace-nowrap ${STATUS_STYLE[status]}`}>{isAr ? EVIDENCE_LABEL[status].ar : EVIDENCE_LABEL[status].en}</span>;
}

function numOrNull(v: string): number | null { if (v.trim() === '') return null; const n = Number(v); return Number.isFinite(n) ? n : null; }

export function KraljicEvidencePanel({
  isAr, suppliers, entries, asOfIso, onAdd, onRemove,
}: {
  isAr: boolean; suppliers: LedgerSupplier[]; entries: LedgerEntry[]; asOfIso: string; onAdd: (e: LedgerEntry) => void; onRemove: (id: string) => void;
}) {
  const L = (b: { en: string; ar: string }) => (isAr ? b.ar : b.en);
  const name = (id: string) => suppliers.find((s) => s.supplierId === id)?.name ?? id;
  const kpi = useMemo(() => ledgerKpis(entries), [entries]);
  const moves = useMemo(() => movementLog(entries), [entries]);
  const [supId, setSupId] = useState<string>(suppliers[0]?.supplierId ?? '');
  const [f, setF] = useState({ risk: '', profit: '', mode: 'manual' as 'manual' | 'cips-weighted', reviewer: '', trigger: '' as '' | 'calendar' | 'event', persistence: '' as '' | 'short-shock' | 'structural', hyst: '', base: '', inYear: '', fullYear: '', avoid: '', quality: '' as '' | 'y' | 'n', metric: '', pre: '', post: '', note: '' });
  const [sv, setSv] = useState({ base: '', next: '', vol: '', months: '12', avoid: '' });
  const sav = computeSavings({ baselineUnitPrice: Number(sv.base), newUnitPrice: Number(sv.next), annualVolume: Number(sv.vol), monthsInYear: Number(sv.months), avoidedIncreasePerUnit: sv.avoid === '' ? 0 : Number(sv.avoid) });
  const savShown = sv.base !== '' && sv.next !== '' && sv.vol !== '';
  const cur = suppliers.find((s) => s.supplierId === supId);
  const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  const pct = (n: number | null) => (n === null ? '—' : `${Math.round(n * 100)}%`);
  const T = {
    title: isAr ? 'الأدلة والقياس' : 'Evidence and measurement',
    intro: isAr ? 'نسجّل هنا ما قسناه فعلًا، ونبيّن لكل ادعاء مصدره ودرجة قوته. الغاية أن تبني ISC أدلتها الخاصة بعملك.' : 'Here we record what was actually measured, and show what every claim rests on and how strongly. The aim is for ISC to build its own evidence for your business.',
    k: { entries: isAr ? 'سجلات القياس' : 'Ledger entries', stab: isAr ? 'استقرار التصنيف' : 'Classification stability', gap: isAr ? 'متوسط الأيام بين المراجعات' : 'Mean days between reviews', out: isAr ? 'بنود خرجت من الاختناق' : 'Items moved out of Bottleneck', sav: isAr ? 'الوفر (السنة الحالية / الكاملة)' : 'Savings (in-year / full-year)', av: isAr ? 'تجنّب التكلفة (منفصل)' : 'Cost avoidance (separate)', pp: isAr ? 'متوسط التغير قبل/بعد' : 'Mean before/after change' },
    add: isAr ? 'سجّل قياسًا' : 'Record a measurement', sup: isAr ? 'المورد' : 'Supplier', risk: isAr ? 'نسبة الخطر (0-100)' : 'Risk % (0-100)', profit: isAr ? 'نسبة الربحية (0-100)' : 'Profit % (0-100)',
    mode: isAr ? 'طريقة التقييم' : 'Scoring mode', manual: isAr ? 'يدوي' : 'Manual', cips: isAr ? 'مرجّح (CIPS)' : 'Weighted (CIPS)', reviewer: isAr ? 'المراجِع' : 'Reviewer', trig: isAr ? 'المحفِّز' : 'Trigger', cal: isAr ? 'مراجعة دورية' : 'Calendar review', ev: isAr ? 'حدث' : 'Event',
    pers: isAr ? 'نتيجة اختبار الاستمرارية' : 'Persistence-test result', shock: isAr ? 'صدمة قصيرة' : 'Short shock', struct: isAr ? 'تغيّر هيكلي' : 'Structural', hyst: isAr ? 'عدد المراجعات المتتالية' : 'Consecutive reviews',
    base: isAr ? 'سعر الأساس المعلن' : 'Declared baseline price', inY: isAr ? 'وفر السنة الحالية' : 'In-year saving', fullY: isAr ? 'وفر السنة الكاملة' : 'Full-year saving', avoid: isAr ? 'تجنّب التكلفة' : 'Cost avoidance', quality: isAr ? 'الجودة لم تتغير؟' : 'Quality unchanged?',
    metric: isAr ? 'مقياس قبل/بعد (الاسم)' : 'Before/after metric (name)', pre: isAr ? 'قبل' : 'Before', post: isAr ? 'بعد' : 'After', note: isAr ? 'ملاحظة' : 'Note', unknown: isAr ? 'غير معروف' : 'Unknown', yes: isAr ? 'نعم' : 'Yes', no: isAr ? 'لا' : 'No', none: isAr ? 'بلا' : 'None',
    save: isAr ? 'احفظ السجل' : 'Save entry', baseHint: isAr ? 'بلا سعر أساس معلن لا يُحتسب الوفر.' : 'Without a declared baseline no saving is counted.', needSup: isAr ? 'أضف موردًا أولًا.' : 'Add a supplier first.',
    list: isAr ? 'آخر السجلات' : 'Recent entries', del: isAr ? 'حذف' : 'Delete', moveT: isAr ? 'سجل الانتقالات' : 'Movement log', noMoves: isAr ? 'لا انتقالات مسجّلة بعد.' : 'No movements recorded yet.',
    calc: isAr ? 'حاسبة الوفر (قواعد CIPS)' : 'Savings calculator (CIPS rules)', next: isAr ? 'السعر الجديد للوحدة' : 'New unit price', baseU: isAr ? 'سعر الأساس للوحدة' : 'Baseline unit price', vol: isAr ? 'الحجم السنوي' : 'Annual volume', months: isAr ? 'أشهر السنة المالية بالسعر الجديد' : 'Months of the year at the new price', avU: isAr ? 'زيادة تم تجنبها للوحدة' : 'Price rise avoided per unit',
    rFull: isAr ? 'الوفر للسنة الكاملة' : 'Full-year saving', rIn: isAr ? 'الوفر للسنة الحالية' : 'In-year saving', rAv: isAr ? 'تجنّب التكلفة (ليس وفرًا)' : 'Cost avoidance (not a saving)', incr: isAr ? 'زيادة في السعر وليست وفرًا' : 'A price increase, not a saving', bad: isAr ? 'تحقق من الأرقام المدخلة.' : 'Check the numbers entered.',
    tco: isAr ? 'اعتمد إجمالي تكلفة الملكية لهذا الربع' : 'Use total cost of ownership for this quadrant',
    src: isAr ? 'سجل المصادر' : 'Source ledger', opened: isAr ? 'فُتح' : 'Opened', limit: isAr ? 'الحدود' : 'Limits',
    wp: isAr ? 'حزمة الصياغة (إنجليزي/عربي)' : 'Wording pack (EN/AR)', cw: isAr ? 'المصطلحات المقابلة' : 'Crosswalk', spell: isAr ? 'الكتابة العربية للاسم' : 'Arabic spellings of the name', shown: isAr ? 'المعروضة' : 'Shown', also: isAr ? 'وتبقى قابلة للبحث' : 'and kept searchable', anch: isAr ? 'مراجع مقررات CIPS لهذا المجال' : 'CIPS syllabus anchors for this area',
    ncol: { c: isAr ? 'المفهوم' : 'Concept', p: 'CIPS', i: 'ISM / CPSM', n: 'NIGP' },
  };
  const submit = () => {
    if (!cur) return;
    const o = { ...emptyOutcome(), baselinePrice: numOrNull(f.base), inYearSaving: numOrNull(f.inYear), fullYearSaving: numOrNull(f.fullYear), costAvoidance: numOrNull(f.avoid), qualityUnchanged: f.quality === 'y' ? true : f.quality === 'n' ? false : null };
    onAdd({
      id: `${cur.supplierId}-${asOfIso}-${entries.length + 1}`, supplierId: cur.supplierId, dateIso: asOfIso, quadrant: cur.quadrant, subtype: cur.subtype === 'unclassified' ? null : cur.subtype,
      riskPct: numOrNull(f.risk), profitPct: numOrNull(f.profit), mode: f.mode, reviewer: f.reviewer.trim().slice(0, 60), version: 'isc-b5',
      trigger: f.trigger || null, persistence: f.persistence || null, hysteresisCount: numOrNull(f.hyst), outcome: o, metricName: f.metric.trim().slice(0, 60), pre: numOrNull(f.pre), post: numOrNull(f.post), note: f.note.trim().slice(0, 200),
    });
    setF({ ...f, risk: '', profit: '', base: '', inYear: '', fullYear: '', avoid: '', quality: '', metric: '', pre: '', post: '', note: '' });
  };
  const kcards: Array<[string, string]> = [
    [T.k.entries, String(kpi.entries)], [T.k.stab, pct(kpi.classificationStability)], [T.k.gap, kpi.meanDaysBetweenReviews === null ? '—' : String(kpi.meanDaysBetweenReviews)], [T.k.out, String(kpi.movedOutOfBottleneck)],
    [T.k.sav, `${fmt(kpi.savings.inYear)} / ${fmt(kpi.savings.fullYear)}`], [T.k.av, fmt(kpi.costAvoidance)], [T.k.pp, kpi.prePost.meanChange === null ? '—' : fmt(kpi.prePost.meanChange)],
  ];
  return (
    <div className="space-y-4">
      <div><h2 className="text-base font-bold text-slate-800">{T.title}</h2><p className="text-xs text-slate-600 mt-1">{T.intro}</p></div>

      <section aria-label={T.title} className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {kcards.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-[10px] font-semibold uppercase text-slate-500 leading-tight">{label}</p>
            <p className="text-lg font-bold text-slate-800 mt-1" dir="ltr">{value}</p>
          </div>
        ))}
      </section>
      {kpi.savings.skippedNoBaseline > 0 && <p className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-2">{isAr ? `${kpi.savings.skippedNoBaseline} سجلات وفر لم تُحتسب: لا سعر أساس معلن أو تغيّرت الجودة.` : `${kpi.savings.skippedNoBaseline} saving record(s) not counted: no declared baseline, or quality changed.`}</p>}
      <p className="text-[10px] text-slate-500">{L(LEDGER_NOTE)}</p>

      <details className="rounded-xl border border-slate-200 bg-white p-3" open={entries.length === 0}>
        <summary className="text-xs font-bold text-[#082C6B] cursor-pointer min-h-[32px] flex items-center">{T.add}</summary>
        {suppliers.length === 0 ? <p className="text-[11px] text-slate-500 mt-2">{T.needSup}</p> : (
          <div className="mt-2 grid grid-cols-2 lg:grid-cols-4 gap-2">
            <label className={`${lab} col-span-2`}>{T.sup}<select className={sel} value={supId} onChange={(e) => setSupId(e.target.value)}>{suppliers.map((s) => <option key={s.supplierId} value={s.supplierId}>{s.name}</option>)}</select></label>
            <label className={lab}>{T.risk}<input type="number" min={0} max={100} dir="ltr" className={sel} value={f.risk} onChange={(e) => setF({ ...f, risk: e.target.value })} /></label>
            <label className={lab}>{T.profit}<input type="number" min={0} max={100} dir="ltr" className={sel} value={f.profit} onChange={(e) => setF({ ...f, profit: e.target.value })} /></label>
            <label className={lab}>{T.mode}<select className={sel} value={f.mode} onChange={(e) => setF({ ...f, mode: e.target.value as 'manual' | 'cips-weighted' })}><option value="manual">{T.manual}</option><option value="cips-weighted">{T.cips}</option></select></label>
            <label className={lab}>{T.reviewer}<input type="text" className={sel} value={f.reviewer} maxLength={60} onChange={(e) => setF({ ...f, reviewer: e.target.value })} /></label>
            <label className={lab}>{T.trig}<select className={sel} value={f.trigger} onChange={(e) => setF({ ...f, trigger: e.target.value as '' | 'calendar' | 'event' })}><option value="">{T.none}</option><option value="calendar">{T.cal}</option><option value="event">{T.ev}</option></select></label>
            <label className={lab}>{T.pers}<select className={sel} value={f.persistence} onChange={(e) => setF({ ...f, persistence: e.target.value as '' | 'short-shock' | 'structural' })}><option value="">{T.none}</option><option value="short-shock">{T.shock}</option><option value="structural">{T.struct}</option></select></label>
            <label className={lab}>{T.hyst}<input type="number" min={0} dir="ltr" className={sel} value={f.hyst} onChange={(e) => setF({ ...f, hyst: e.target.value })} /></label>
            <label className={lab}>{T.base}<input type="number" min={0} dir="ltr" className={sel} value={f.base} onChange={(e) => setF({ ...f, base: e.target.value })} /></label>
            <label className={lab}>{T.inY}<input type="number" dir="ltr" className={sel} value={f.inYear} onChange={(e) => setF({ ...f, inYear: e.target.value })} /></label>
            <label className={lab}>{T.fullY}<input type="number" dir="ltr" className={sel} value={f.fullYear} onChange={(e) => setF({ ...f, fullYear: e.target.value })} /></label>
            <label className={lab}>{T.avoid}<input type="number" min={0} dir="ltr" className={sel} value={f.avoid} onChange={(e) => setF({ ...f, avoid: e.target.value })} /></label>
            <label className={lab}>{T.quality}<select className={sel} value={f.quality} onChange={(e) => setF({ ...f, quality: e.target.value as '' | 'y' | 'n' })}><option value="">{T.unknown}</option><option value="y">{T.yes}</option><option value="n">{T.no}</option></select></label>
            <label className={lab}>{T.metric}<input type="text" className={sel} value={f.metric} maxLength={60} onChange={(e) => setF({ ...f, metric: e.target.value })} /></label>
            <label className={lab}>{T.pre}<input type="number" dir="ltr" className={sel} value={f.pre} onChange={(e) => setF({ ...f, pre: e.target.value })} /></label>
            <label className={lab}>{T.post}<input type="number" dir="ltr" className={sel} value={f.post} onChange={(e) => setF({ ...f, post: e.target.value })} /></label>
            <label className={`${lab} col-span-2 lg:col-span-3`}>{T.note}<input type="text" className={sel} value={f.note} maxLength={200} onChange={(e) => setF({ ...f, note: e.target.value })} /></label>
            <div className="col-span-2 lg:col-span-4 flex flex-wrap items-center gap-3">
              <button type="button" onClick={submit} className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#082C6B] text-white hover:bg-[#0a3a8c] min-h-[36px]">{T.save}</button>
              <span className="text-[10px] text-slate-500">{T.baseHint}</span>
              {cur && tcoRequired(cur.quadrant) && <span className="text-[10px] text-indigo-800">{T.tco}</span>}
            </div>
          </div>
        )}
      </details>

      {entries.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-3">
          <h3 className="text-sm font-bold text-slate-800">{T.list}</h3>
          <ul className="mt-2 space-y-1.5">
            {[...entries].sort((a, b) => b.dateIso.localeCompare(a.dateIso)).slice(0, 12).map((e) => (
              <li key={e.id} className="rounded-lg border border-slate-200 p-2 text-[11px] text-slate-700 flex flex-wrap items-center gap-x-3 gap-y-1">
                <b><bdi>{name(e.supplierId)}</bdi></b>
                <span dir="ltr">{e.dateIso}</span>
                <span>{isAr ? CIPS_QUADRANT_LABEL[e.quadrant].ar : CIPS_QUADRANT_LABEL[e.quadrant].en}</span>
                {e.riskPct !== null && e.profitPct !== null && <span dir="ltr">{e.riskPct}% / {e.profitPct}%</span>}
                <button type="button" onClick={() => onRemove(e.id)} className="ms-auto text-[11px] text-red-700 underline min-h-[32px]">{T.del}</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-3">
        <h3 className="text-sm font-bold text-slate-800">{T.moveT}</h3>
        {moves.length === 0 ? <p className="text-[11px] text-slate-500 mt-1">{T.noMoves}</p> : (
          <ul className="mt-2 space-y-1">
            {moves.map((m) => (
              <li key={m.supplierId + m.dateIso} className="text-[11px] text-slate-700"><b><bdi>{name(m.supplierId)}</bdi></b> <span dir="ltr">{m.dateIso}</span>: {L(CIPS_QUADRANT_LABEL[m.fromQuadrant])} → {L(CIPS_QUADRANT_LABEL[m.toQuadrant])}{m.trigger ? ` · ${m.trigger === 'event' ? T.ev : T.cal}` : ''}{m.persistence ? ` · ${m.persistence === 'structural' ? T.struct : T.shock}` : ''}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-3">
        <h3 className="text-sm font-bold text-slate-800">{T.calc}</h3>
        <ul className="mt-1 list-disc ms-5 text-[11px] text-slate-700 space-y-0.5">{SAVINGS_RULES.map((r) => <li key={r.text.en}>{L(r.text)} <span className="text-[10px] text-slate-500">({r.basis === 'sourced' ? (isAr ? 'موثّق' : 'sourced') : (isAr ? 'استنتاج' : 'inference')})</span></li>)}</ul>
        <div className="mt-2 grid grid-cols-2 lg:grid-cols-5 gap-2">
          <label className={lab}>{T.baseU}<input type="number" min={0} dir="ltr" className={sel} value={sv.base} onChange={(e) => setSv({ ...sv, base: e.target.value })} /></label>
          <label className={lab}>{T.next}<input type="number" min={0} dir="ltr" className={sel} value={sv.next} onChange={(e) => setSv({ ...sv, next: e.target.value })} /></label>
          <label className={lab}>{T.vol}<input type="number" min={0} dir="ltr" className={sel} value={sv.vol} onChange={(e) => setSv({ ...sv, vol: e.target.value })} /></label>
          <label className={lab}>{T.months}<input type="number" min={0} max={12} dir="ltr" className={sel} value={sv.months} onChange={(e) => setSv({ ...sv, months: e.target.value })} /></label>
          <label className={lab}>{T.avU}<input type="number" min={0} dir="ltr" className={sel} value={sv.avoid} onChange={(e) => setSv({ ...sv, avoid: e.target.value })} /></label>
        </div>
        {savShown && !sav.valid && <p className="text-[11px] text-red-800 mt-2">{T.bad}</p>}
        {savShown && sav.valid && (
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="rounded-lg border border-slate-200 p-2"><p className="text-[10px] uppercase text-slate-500">{T.rFull}</p><p className="text-sm font-bold" dir="ltr">{fmt(sav.fullYearSaving)}</p>{sav.isIncrease && <p className="text-[10px] text-red-800">{T.incr}</p>}</div>
            <div className="rounded-lg border border-slate-200 p-2"><p className="text-[10px] uppercase text-slate-500">{T.rIn}</p><p className="text-sm font-bold" dir="ltr">{fmt(sav.inYearSaving)}</p></div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-2"><p className="text-[10px] uppercase text-amber-900">{T.rAv}</p><p className="text-sm font-bold" dir="ltr">{fmt(sav.costAvoidanceFullYear)}</p></div>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-3">
        <h3 className="text-sm font-bold text-slate-800">{T.src}</h3>
        <ul className="mt-2 space-y-2">
          {SOURCE_LEDGER.map((s) => (
            <li key={s.id} className="rounded-lg border border-slate-200 p-2">
              <p className="text-[11px] text-slate-800">{L(s.claim)}</p>
              <p className="mt-1 flex flex-wrap items-center gap-1.5"><EvidenceBadge isAr={isAr} status={s.status} /><span className="text-[10px] text-slate-600">{s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline" dir="ltr">{s.source}</a> : <span dir="ltr">{s.source}</span>} · {T.opened} <span dir="ltr">{s.opened}</span></span></p>
              <p className="text-[10px] text-slate-500 mt-0.5">{T.limit}: {L(s.limit)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
        <h3 className="text-sm font-bold text-slate-800">{T.wp}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] text-slate-700 border-collapse">
            <thead><tr className="text-start text-slate-500"><th className="text-start p-1.5 border-b border-slate-200">{T.ncol.c}</th><th className="text-start p-1.5 border-b border-slate-200">{T.ncol.p}</th><th className="text-start p-1.5 border-b border-slate-200">{T.ncol.i}</th><th className="text-start p-1.5 border-b border-slate-200">{T.ncol.n}</th></tr></thead>
            <tbody>{CROSSWALK.map((c) => (<tr key={c.concept.en} className="align-top"><td className="p-1.5 border-b border-slate-100">{L(c.concept)}</td><td className="p-1.5 border-b border-slate-100" dir="ltr">{c.cips}</td><td className="p-1.5 border-b border-slate-100" dir="ltr">{c.ism}</td><td className="p-1.5 border-b border-slate-100" dir="ltr">{c.nigp}</td></tr>))}</tbody>
          </table>
        </div>
        <ul className="space-y-0.5 text-[11px] text-slate-800">
          {(['strategic', 'leverage', 'bottleneck', 'non-critical'] as Q[]).map((q) => <li key={q}>{isAr ? arabicWithEnglish(q) : CIPS_QUADRANT_LABEL[q].en}</li>)}
        </ul>
        <p className="text-[11px] text-slate-700"><b>{T.spell}: </b>{T.shown} <span lang="ar">{KRALJIC_PREFERRED_AR}</span>{isAr ? '، ' : ', '}{T.also}: <span lang="ar">{KRALJIC_SPELLINGS_AR.join('، ')}</span></p>
        <p className="text-[10px] text-slate-500"><b>{T.anch}: </b><span dir="ltr">{CIPS_SYLLABUS_ANCHORS.join('; ')}</span></p>
        <p className="text-[10px] text-slate-500">{L(ARABIC_DISCLOSURE)}</p>
      </section>
    </div>
  );
}
