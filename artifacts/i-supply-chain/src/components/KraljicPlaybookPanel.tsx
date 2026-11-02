/**
 * Playbook tab (Round B5, items 7, 8, 12). Pick a sub-type; see its five
 * headings (objective, supplier view, due-diligence depth, contract checklist,
 * monitoring and exit). Every line says whether it is sourced or an ISC design
 * choice. Below: due-diligence depth for all four quadrants, and the guardrails.
 */
import { useState, type ReactElement } from 'react';
import { SUBTYPES, type SubtypeKey, type Quadrant } from '@/lib/supplierKraljicSubtypes';
import { playbookFor, DD_DEPTH, DD_NOTE, GUARDRAILS, type PlaybookLine } from '@/lib/kraljicPlaybook';
import { CIPS_QUADRANT_LABEL } from '@/lib/kraljicCipsWording';

const ORDER: Quadrant[] = ['bottleneck', 'strategic', 'leverage', 'non-critical'];
const TIER_STYLE: Record<string, string> = {
  comprehensive: 'bg-red-50 border-red-200 text-red-900',
  targeted: 'bg-amber-50 border-amber-200 text-amber-900',
  standard: 'bg-sky-50 border-sky-200 text-sky-900',
  screening: 'bg-slate-50 border-slate-200 text-slate-700',
};

export function BasisBadge({ isAr, basis }: { isAr: boolean; basis: 'sourced' | 'isc-design' }) {
  const sourced = basis === 'sourced';
  return (
    <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded border whitespace-nowrap ${sourced ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-300 text-slate-600'}`}>
      {sourced ? (isAr ? 'موثّق' : 'Sourced') : (isAr ? 'اختيار تصميمي من ISC' : 'ISC design choice')}
    </span>
  );
}

function Lines({ isAr, lines }: { isAr: boolean; lines: PlaybookLine[] }) {
  return (
    <ul className="space-y-1.5">
      {lines.map((l) => (
        <li key={l.t.en} className="text-[11px] text-slate-800 flex flex-col gap-0.5">
          <span>{isAr ? l.t.ar : l.t.en}</span>
          <BasisBadge isAr={isAr} basis={l.basis} />
        </li>
      ))}
    </ul>
  );
}

export function KraljicPlaybookPanel({ isAr }: { isAr: boolean }) {
  const [sel, setSel] = useState<SubtypeKey>('bottleneck-movable');
  const L = (b: { en: string; ar: string }) => (isAr ? b.ar : b.en);
  const def = SUBTYPES[sel];
  const pb = playbookFor(sel, def.quadrant as Quadrant);
  const dd = pb.dueDiligence;
  const H = {
    pick: isAr ? 'اختر نوعًا فرعيًا لترى دليل العمل الخاص به.' : 'Pick a sub-type to see its playbook.',
    obj: isAr ? '1. الهدف' : '1. Objective', sv: isAr ? '2. نظرة المورد إلينا' : '2. How the supplier sees us',
    dd: isAr ? '3. عمق العناية الواجبة' : '3. Due-diligence depth', ct: isAr ? '4. قائمة العقد' : '4. Contract checklist',
    me: isAr ? '5. المتابعة والخروج' : '5. Monitoring and exit',
    cad: isAr ? 'إعادة التقييم' : 'Reassess', anchor: isAr ? 'السند' : 'Anchor',
    ddAll: isAr ? 'عمق العناية الواجبة حسب الربع' : 'Due-diligence depth by quadrant',
    guard: isAr ? 'ضوابط الاستخدام' : 'Guardrails',
    months: isAr ? 'أشهر' : 'months', intro: isAr ? 'خمسة عناوين لكل نوع فرعي. كل سطر يوضح هل هو موثّق أم اختيار تصميمي من ISC، فلا نُنسب إلى CIPS ما لم تنشره.' : 'Five headings per sub-type. Every line says whether it is sourced or an ISC design choice, so nothing is attributed to CIPS that CIPS has not published.',
  };
  const cards: Array<{ key: string; title: string; body: ReactElement }> = [
    { key: 'o', title: H.obj, body: <Lines isAr={isAr} lines={pb.objective} /> },
    { key: 's', title: H.sv, body: <Lines isAr={isAr} lines={pb.supplierView} /> },
    {
      key: 'd', title: H.dd,
      body: (
        <div className="space-y-1.5">
          <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded border ${TIER_STYLE[dd.tier]}`}>{L(dd.tierLabel)}</span>
          <ul className="list-disc ms-4 text-[11px] text-slate-800 space-y-0.5">{dd.depth.map((x) => <li key={x.en}>{L(x)}</li>)}</ul>
          <p className="text-[10px] text-slate-600"><b>{H.cad}: </b>{L(dd.cadenceNote)}{dd.cadenceMonths !== null ? <> (<span dir="ltr">{dd.cadenceMonths}</span> {H.months})</> : null}</p>
          <p className="text-[10px] text-slate-500"><b>{H.anchor}: </b>{L(dd.anchor)}</p>
          <BasisBadge isAr={isAr} basis="isc-design" />
        </div>
      ),
    },
    { key: 'c', title: H.ct, body: <Lines isAr={isAr} lines={pb.contract} /> },
    { key: 'm', title: H.me, body: <Lines isAr={isAr} lines={pb.monitorExit} /> },
  ];
  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-600">{H.intro}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" dir="ltr">
        {ORDER.map((q) => (
          <div key={q} dir={isAr ? 'rtl' : 'ltr'} className="rounded-xl border border-slate-200 bg-white p-3">
            <h3 className="text-sm font-bold text-slate-800">{L(CIPS_QUADRANT_LABEL[q])}</h3>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(Object.values(SUBTYPES)).filter((d) => d.quadrant === q).map((d) => (
                <button key={d.key} type="button" aria-pressed={sel === d.key} onClick={() => setSel(d.key as SubtypeKey)}
                  className={`text-[11px] px-2 py-1.5 rounded-lg border min-h-[36px] ${sel === d.key ? 'bg-[#082C6B] border-[#082C6B] text-white' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                  {L(d.label)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-[#082C6B]/30 bg-[#EEF2FF] p-3">
        <p className="text-sm font-bold text-[#082C6B]">{L(def.label)}</p>
        <p className="text-[11px] text-slate-700">{L(def.meaning)}</p>
      </div>
      <ol className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {cards.map((c) => (
          <li key={c.key} className="rounded-xl border border-slate-200 bg-white p-3">
            <h4 className="text-[12px] font-bold text-slate-800 mb-1.5">{c.title}</h4>
            {c.body}
          </li>
        ))}
      </ol>
      <section className="rounded-xl border border-slate-200 bg-white p-3">
        <h3 className="text-sm font-bold text-slate-800">{H.ddAll}</h3>
        <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(['strategic', 'bottleneck', 'leverage', 'non-critical'] as Quadrant[]).map((q) => (
            <li key={q} className={`rounded-lg border p-2 ${TIER_STYLE[DD_DEPTH[q].tier]}`}>
              <p className="text-[11px] font-bold">{L(CIPS_QUADRANT_LABEL[q])}: {L(DD_DEPTH[q].tierLabel)}</p>
              <p className="text-[10px]">{L(DD_DEPTH[q].cadenceNote)}</p>
            </li>
          ))}
        </ul>
        <p className="text-[10px] text-slate-500 mt-2">{L(DD_NOTE)}</p>
      </section>
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-3">
        <h3 className="text-sm font-bold text-amber-900">{H.guard}</h3>
        <ul className="mt-1.5 space-y-1.5">
          {GUARDRAILS.map((g) => (
            <li key={g.text.en} className="text-[11px] text-amber-950">
              {L(g.text)} <span className="text-[10px] text-amber-800">({L(g.source)})</span> <BasisBadge isAr={isAr} basis={g.basis} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
