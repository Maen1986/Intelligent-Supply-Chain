/**
 * Per-supplier extras inside the supplier card (Round B5, items 6, 9, 15).
 *  - Supplier view (Supplier Preferencing overlay) and the optional
 *    capabilities x willingness lens.
 *  - GCC modifiers: jurisdiction selector first; government rules appear only
 *    for a government jurisdiction. Every value shows its source status.
 * All inputs are optional. ISC never fills a missing answer.
 */
import { useState } from 'react';
import { PREFERENCING_LABEL } from '@/lib/kraljicCipsWording';
import {
  spCue, SP_NOTE, SP_AXIS_NOTE, lensSegment, LENS_NOTE, type SpInputs, type LensInputs, type HighLow,
} from '@/lib/kraljicPreferencing';
import {
  JURISDICTIONS, rulesVisible, gccAdjustment, PRICE_PREFERENCES, STATUS_LABEL, PLANNING_GATE, SA_METHOD_LADDER,
  methodCheck, evaluationPrice, SA_CLAUSE_PARAMS, SA_LAW_NOTE, NOT_CONFIRMED, supplierTags, emptyGccFacts, GCC_REVIEWED_ON,
  type GccFacts, type Jurisdiction, type SaMethod,
} from '@/lib/kraljicGccModifiers';
import type { Quadrant } from '@/lib/supplierKraljicSubtypes';

export interface SupplierExtras { sp: SpInputs; lens: LensInputs; gcc: GccFacts }

export function emptyExtras(): SupplierExtras {
  return { sp: { accountValue: null, attractiveness: null, evidence: '' }, lens: { capability: null, willingness: null }, gcc: emptyGccFacts() };
}

const sel = 'w-full text-xs border border-slate-300 rounded-md px-2 py-1.5 bg-white min-h-[36px]';
const lab = 'block text-[11px] text-slate-600';

function HL({ label, value, onChange, isAr, hi, lo }: { label: string; value: HighLow | null; onChange: (v: HighLow | null) => void; isAr: boolean; hi: string; lo: string }) {
  return (
    <label className={lab}>{label}
      <select className={sel} value={value ?? ''} onChange={(e) => onChange((e.target.value || null) as HighLow | null)}>
        <option value="">{isAr ? 'غير معروف' : 'Unknown'}</option>
        <option value="high">{hi}</option>
        <option value="low">{lo}</option>
      </select>
    </label>
  );
}

function Tri({ label, value, onChange, isAr }: { label: string; value: boolean | null; onChange: (v: boolean | null) => void; isAr: boolean }) {
  return (
    <label className={lab}>{label}
      <select className={sel} value={value === true ? 'y' : value === false ? 'n' : ''} onChange={(e) => onChange(e.target.value === 'y' ? true : e.target.value === 'n' ? false : null)}>
        <option value="">{isAr ? 'غير معروف' : 'Unknown'}</option>
        <option value="y">{isAr ? 'نعم' : 'Yes'}</option>
        <option value="n">{isAr ? 'لا' : 'No'}</option>
      </select>
    </label>
  );
}

function Num({ label, value, onChange, max }: { label: string; value: number | null; onChange: (v: number | null) => void; max?: number }) {
  return (
    <label className={lab}>{label}
      <input type="number" min={0} max={max} inputMode="decimal" dir="ltr" className={sel} value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Math.max(0, Number(e.target.value)))} />
    </label>
  );
}

export function KraljicSupplierExtras({
  isAr, quadrant, qualifiedAlternatives, extras, onChange,
}: {
  isAr: boolean; quadrant: Quadrant; qualifiedAlternatives: number | null | undefined; extras: SupplierExtras; onChange: (next: SupplierExtras) => void;
}) {
  const L = (b: { en: string; ar: string }) => (isAr ? b.ar : b.en);
  const cue = spCue(quadrant, extras.sp);
  const lens = lensSegment(extras.lens);
  const g = extras.gcc;
  const adj = gccAdjustment(qualifiedAlternatives ?? null, g);
  const tags = supplierTags(g);
  const [method, setMethod] = useState<SaMethod>('public-tender');
  const [est, setEst] = useState<string>('');
  const [reasons, setReasons] = useState(false);
  const [foreign, setForeign] = useState<string>('');
  const mc = methodCheck(g.jurisdiction, method, est === '' ? null : Number(est), reasons);
  const setSp = (p: Partial<SpInputs>) => onChange({ ...extras, sp: { ...extras.sp, ...p } });
  const setLens = (p: Partial<LensInputs>) => onChange({ ...extras, lens: { ...extras.lens, ...p } });
  const setG = (p: Partial<GccFacts>) => onChange({ ...extras, gcc: { ...g, ...p } });
  const setS = (p: Partial<GccFacts['supplier']>) => onChange({ ...extras, gcc: { ...g, supplier: { ...g.supplier, ...p } } });
  const T = {
    spTitle: isAr ? 'نظرة المورد إلينا وعدسة العلاقة (اختياري)' : 'How the supplier sees us, and the relationship lens (optional)',
    value: isAr ? 'قيمة حسابنا لدى المورد' : 'Our account value to the supplier', attract: isAr ? 'جاذبية حسابنا' : 'How attractive our account is',
    hi: isAr ? 'مرتفعة' : 'High', lo: isAr ? 'منخفضة' : 'Low', evidence: isAr ? 'الدليل (استبيان، اجتماع، رسالة)' : 'Evidence (survey, meeting, message)',
    noEv: isAr ? 'لا يوجد دليل مسجَّل: عامله كتخمين للنقاش.' : 'No evidence recorded: treat this as a guess for discussion.',
    view: isAr ? 'المورد يرانا' : 'The supplier sees us as', cueL: isAr ? 'إشارة للنقاش' : 'Cue for discussion',
    cap: isAr ? 'قدرات المورد' : 'Supplier capability', will: isAr ? 'استعداد المورد' : 'Supplier willingness',
    capH: isAr ? 'عالية' : 'High', capL: isAr ? 'منخفضة' : 'Low', segment: isAr ? 'الشريحة' : 'Segment',
    gccTitle: isAr ? 'معدِّلات الخليج (اختياري)' : 'GCC modifiers (optional)', juris: isAr ? 'نوع الجهة' : 'Buyer type',
    listed: isAr ? 'هل البند ضمن قائمة المنتجات الوطنية الإلزامية؟' : 'On the Mandatory List of National Products?', upc: isAr ? 'رمز UPC للبند' : 'UPC code of the item',
    natAlt: isAr ? 'كم من البدائل المؤهَّلة منتج وطني؟' : 'How many qualified alternatives are national products?',
    attrs: isAr ? 'سمات المورد' : 'Supplier attributes', national: isAr ? 'مورد وطني' : 'National supplier', sme: isAr ? 'منشأة صغيرة أو متوسطة' : 'SME', listedCo: isAr ? 'شركة مدرجة' : 'Listed company',
    lcc: isAr ? 'شهادة محتوى محلي' : 'Local-content certificate', iktva: isAr ? 'درجة اكتفا' : 'IKTVA score', uae: isAr ? 'القيمة المحلية المضافة (الإمارات)' : 'ICV score (UAE)', qa: isAr ? 'القيمة المحلية المضافة (قطر)' : 'ICV score (Qatar)', om: isAr ? 'JSRS (عُمان)' : 'JSRS (Oman)',
    pref: isAr ? 'أفضلية السعر (قيم مؤرخة)' : 'Price preference (dated values)', reviewed: isAr ? 'روجعت في' : 'Reviewed on', foreignP: isAr ? 'سعر العرض الأجنبي' : 'Foreign bid price', evalP: isAr ? 'سعر التقييم' : 'Evaluation price',
    gate: isAr ? 'بوابة التخطيط' : 'Planning gate', ladder: isAr ? 'سلّم طرق الشراء' : 'Method ladder', pick: isAr ? 'الطريقة المخططة' : 'Planned method', estV: isAr ? 'القيمة التقديرية (ريال)' : 'Estimated value (SAR)', reasonsL: isAr ? 'مسوّغات مسجَّلة' : 'Reasons recorded',
    clauses: isAr ? 'معاملات العقد (للتحقق)' : 'Contract parameters (verify)', notStated: isAr ? 'لا نذكرها لأنها غير مؤكدة' : 'Not stated because not confirmed', asOf: isAr ? 'بتاريخ' : 'As of',
    privateNote: isAr ? 'اختر جهة حكومية لإظهار القواعد الحكومية.' : 'Choose a government buyer to show government rules.',
  };
  return (
    <div className="mt-2 space-y-2">
      <details className="border border-slate-200 rounded-lg p-2">
        <summary className="text-[11px] font-semibold uppercase text-slate-600 cursor-pointer min-h-[32px] flex items-center">{T.spTitle}</summary>
        <div className="mt-2 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <HL isAr={isAr} label={T.value} value={extras.sp.accountValue} onChange={(v) => setSp({ accountValue: v })} hi={T.hi} lo={T.lo} />
            <HL isAr={isAr} label={T.attract} value={extras.sp.attractiveness} onChange={(v) => setSp({ attractiveness: v })} hi={T.hi} lo={T.lo} />
          </div>
          <label className={lab}>{T.evidence}
            <input type="text" className={sel} value={extras.sp.evidence} maxLength={200} onChange={(e) => setSp({ evidence: e.target.value })} />
          </label>
          {cue.ask && <p className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-2">{L(cue.ask)}</p>}
          {cue.cue && cue.spLabel && (
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-2">
              <p className="text-[11px] text-indigo-950"><b>{T.view}: </b>{L(cue.spLabel)}</p>
              <p className="text-[11px] text-indigo-950 mt-0.5"><b>{T.cueL}: </b>{L(cue.cue)}</p>
              {cue.noEvidence && <p className="text-[10px] text-amber-800 mt-0.5">{T.noEv}</p>}
            </div>
          )}
          <p className="text-[10px] text-slate-500">{L(SP_AXIS_NOTE)}</p>
          <p className="text-[10px] text-slate-500">{L(SP_NOTE)}</p>
          <p className="text-[10px] text-slate-500">{(Object.values(PREFERENCING_LABEL)).map((x) => L(x)).join(isAr ? '، ' : ', ')}</p>
          <div className="border-t border-slate-200 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <HL isAr={isAr} label={T.cap} value={extras.lens.capability} onChange={(v) => setLens({ capability: v })} hi={T.capH} lo={T.capL} />
              <HL isAr={isAr} label={T.will} value={extras.lens.willingness} onChange={(v) => setLens({ willingness: v })} hi={T.capH} lo={T.capL} />
            </div>
            {lens && <p className="text-[11px] text-slate-800 mt-1.5"><b>{T.segment}: {L(lens.label)}.</b> {L(lens.action)}</p>}
            <p className="text-[10px] text-slate-500 mt-1">{L(LENS_NOTE)}</p>
          </div>
        </div>
      </details>

      <details className="border border-slate-200 rounded-lg p-2">
        <summary className="text-[11px] font-semibold uppercase text-slate-600 cursor-pointer min-h-[32px] flex items-center">{T.gccTitle}</summary>
        <div className="mt-2 space-y-3">
          <label className={lab}>{T.juris}
            <select className={sel} value={g.jurisdiction} onChange={(e) => setG({ jurisdiction: e.target.value as Jurisdiction })}>
              {JURISDICTIONS.map((j) => <option key={j.key} value={j.key}>{L(j.label)}</option>)}
            </select>
          </label>
          {!rulesVisible(g.jurisdiction) && <p className="text-[11px] text-slate-500">{T.privateNote}</p>}
          {rulesVisible(g.jurisdiction) && (<>
            <div className="grid grid-cols-2 gap-2">
              <Tri isAr={isAr} label={T.listed} value={g.mandatoryListed} onChange={(v) => setG({ mandatoryListed: v })} />
              <label className={lab}>{T.upc}<input type="text" dir="ltr" className={sel} value={g.upcCode} maxLength={32} onChange={(e) => setG({ upcCode: e.target.value })} /></label>
              {g.mandatoryListed === true && <Num label={T.natAlt} value={g.nationalAlternatives} onChange={(v) => setG({ nationalAlternatives: v })} />}
            </div>
            <p className={`text-[11px] rounded-lg border p-2 ${adj.ask ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>{L(adj.note)}</p>
            <p className="text-[10px] font-bold uppercase text-slate-500">{T.attrs}</p>
            <div className="grid grid-cols-2 gap-2">
              <Tri isAr={isAr} label={T.national} value={g.supplier.national} onChange={(v) => setS({ national: v })} />
              <Tri isAr={isAr} label={T.sme} value={g.supplier.sme} onChange={(v) => setS({ sme: v })} />
              <Tri isAr={isAr} label={T.listedCo} value={g.supplier.listed} onChange={(v) => setS({ listed: v })} />
              <Tri isAr={isAr} label={T.lcc} value={g.supplier.localContentCertificate} onChange={(v) => setS({ localContentCertificate: v })} />
              <Num label={T.iktva} value={g.supplier.iktvaScore} max={100} onChange={(v) => setS({ iktvaScore: v })} />
              <Num label={T.uae} value={g.supplier.uaeIcv} max={100} onChange={(v) => setS({ uaeIcv: v })} />
              <Num label={T.qa} value={g.supplier.qatarIcv} max={100} onChange={(v) => setS({ qatarIcv: v })} />
              <Tri isAr={isAr} label={T.om} value={g.supplier.omanJsrs} onChange={(v) => setS({ omanJsrs: v })} />
            </div>
            {tags.length > 0 && <p className="text-[11px] text-slate-700">{tags.map((t) => L(t)).join(' · ')}</p>}

            <div className="border-t border-slate-200 pt-2 space-y-1.5">
              <p className="text-[10px] font-bold uppercase text-slate-500">{T.pref}</p>
              <ul className="space-y-1">
                {PRICE_PREFERENCES.map((p) => (
                  <li key={p.key} className="text-[11px] text-slate-800 rounded-lg border border-slate-200 p-2">
                    <b>{L(p.country)}: <span dir="ltr">{p.valuePct}%</span></b> · {L(p.rule)}
                    <span className="block text-[10px] text-slate-500">{p.source} · {L(STATUS_LABEL[p.status])} · {T.reviewed} <span dir="ltr">{p.reviewedOn}</span>. {L(p.dateNote)}</span>
                  </li>
                ))}
              </ul>
              <div className="grid grid-cols-2 gap-2">
                <label className={lab}>{T.foreignP}<input type="number" min={0} dir="ltr" inputMode="decimal" className={sel} value={foreign} onChange={(e) => setForeign(e.target.value)} /></label>
                <p className="text-[11px] text-slate-700 self-end">{T.evalP} (Saudi, <span dir="ltr">10%</span>): <b dir="ltr">{foreign === '' ? '—' : (evaluationPrice(Number(foreign), PRICE_PREFERENCES[0].valuePct) ?? '—')}</b></p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-2 space-y-1.5">
              <p className="text-[10px] font-bold uppercase text-slate-500">{T.gate}</p>
              <p className="text-[11px] text-slate-800">{L(PLANNING_GATE.text)}</p>
              <p className="text-[10px] text-amber-800">{L(PLANNING_GATE.status)} {PLANNING_GATE.source}</p>
            </div>

            <div className="border-t border-slate-200 pt-2 space-y-1.5">
              <p className="text-[10px] font-bold uppercase text-slate-500">{T.ladder}</p>
              {g.jurisdiction === 'saudi-gov' && (
                <ul className="space-y-0.5 text-[11px] text-slate-700">{SA_METHOD_LADDER.map((m) => <li key={m.key}><b>{L(m.label)}</b>: {L(m.rule)} <span className="text-[10px] text-slate-500" dir="ltr">({m.article})</span></li>)}</ul>
              )}
              <div className="grid grid-cols-2 gap-2">
                <label className={lab}>{T.pick}
                  <select className={sel} value={method} onChange={(e) => setMethod(e.target.value as SaMethod)}>
                    {SA_METHOD_LADDER.map((m) => <option key={m.key} value={m.key}>{L(m.label)}</option>)}
                  </select>
                </label>
                <label className={lab}>{T.estV}<input type="number" min={0} dir="ltr" inputMode="decimal" className={sel} value={est} onChange={(e) => setEst(e.target.value)} /></label>
                <label className="text-[11px] text-slate-600 flex items-center gap-2 min-h-[36px]"><input type="checkbox" checked={reasons} onChange={(e) => setReasons(e.target.checked)} />{T.reasonsL}</label>
              </div>
              <p className={`text-[11px] rounded-lg border p-2 ${mc.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-red-50 text-red-900'}`}>{L(mc.message)}</p>
            </div>

            {g.jurisdiction === 'saudi-gov' && (
              <div className="border-t border-slate-200 pt-2 space-y-1">
                <p className="text-[10px] font-bold uppercase text-slate-500">{T.clauses}</p>
                <ul className="text-[11px] text-slate-700 space-y-0.5">{SA_CLAUSE_PARAMS.map((c) => <li key={c.key}>{L(c.label)}: <b dir="ltr">{c.value}</b> <span className="text-[10px] text-slate-500" dir="ltr">({c.article})</span></li>)}</ul>
              </div>
            )}
            <p className="text-[10px] text-slate-500">{L(SA_LAW_NOTE)} {T.asOf} <span dir="ltr">{GCC_REVIEWED_ON}</span>.</p>
            <details>
              <summary className="text-[10px] text-slate-600 cursor-pointer min-h-[28px] flex items-center">{T.notStated}</summary>
              <ul className="list-disc ms-4 text-[10px] text-slate-600">{NOT_CONFIRMED.map((n) => <li key={n.en}>{L(n)}</li>)}</ul>
            </details>
          </>)}
        </div>
      </details>
    </div>
  );
}
