// Module 08 -- interactive tools rendered under a Program Brief. All maths lives in tested lib files; this file only collects inputs.
// RTL-safe: logical classes, Latin runs in <bdi dir="ltr">. The 257 KB Mandatory List dataset is loaded on demand.
import React, { useEffect, useMemo, useState } from 'react';
import type { BriefTool } from '@/lib/localContentBriefTypes';
import { SAUDIZATION_PROGRAMS, saudizationShortfall, type SaudizationProgramId } from '@/lib/saudizationTargets';
import { MOF_CONTRACT_MODELS, MOF_DECISION_1118_SOURCE } from '@/lib/mofContractModels';
import { findMechanisms, SA_HIGH_VALUE_THRESHOLD_SAR, type SaContractType } from '@/lib/lcgpaMechanismFinder';
import { computeTargetedLocalContent, gapToThreshold } from '@/lib/lcgpaTargetedLocalContent';
import { computeContractMinimum, financialEvaluation, sectorById } from '@/lib/lcgpaContractMinimum';
import { LCGPA_SECTORS } from '@/lib/lcgpaContractMinimumData';
import { usePublishFinding } from './ReportFindings';
import { parseAmount, parsePercent } from '@/lib/parseLocaleNumber';
import type { MandatoryProduct } from '@/lib/lcgpaMandatoryList';

const fmt = (n: number, d = 0) => n.toLocaleString('en-US', { maximumFractionDigits: d });
const pct = (n: number) => `${fmt(n * 100, 1)}%`;
const num = parseAmount;

const MECH_LABEL: Record<string, { en: string; ar: string }> = {
  'sa-mandatory-list': { en: 'Mandatory List', ar: 'القائمة الإلزامية' },
  'sa-price-preference': { en: 'Price preference (10%)', ar: 'تفضيل السعر (١٠٪)' },
  'sa-sme-preference': { en: 'Local SME preference', ar: 'تفضيل المنشآت الصغيرة والمتوسطة' },
  'sa-contract-minimum': { en: 'Minimum local content (contract level)', ar: 'الحد الأدنى للمحتوى المحلي (على مستوى العقد)' },
  'sa-financial-evaluation-weight': { en: 'Local-content weight 40%', ar: 'وزن المحتوى المحلي ٤٠٪' },
};

function Box({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <p className="text-xs font-bold text-slate-800 mb-2">{title}</p>
      {children}
      {note && <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">{note}</p>}
    </div>
  );
}
function Field({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <label className="text-[11px] text-slate-600 block">{label}
      <input inputMode="decimal" dir="ltr" value={value} onChange={e => onChange(e.target.value)} className="mt-1 w-full border rounded px-2 py-1 text-sm text-start" />
      {hint && <span className="text-[10px] text-slate-400">{hint}</span>}
    </label>
  );
}
const bi = (en: string, ar: string) => ({ en, ar });
const T = (isAr: boolean, en: string, ar: string) => (isAr ? ar : en);

/* ── Which mechanisms apply ── */
function MechanismFinder({ isAr }: { isAr: boolean }) {
  const [type, setType] = useState<SaContractType>('services-works');
  const [value, setValue] = useState('');
  const v = num(value);
  const hits = v > 0 ? findMechanisms(type, v) : [];
  usePublishFinding('mechanism-finder', v > 0 ? {
    title: bi('Mechanisms that apply to your contract', 'الآليات المنطبقة على عقدك'),
    lines: [bi(`Contract type: ${type}; value SAR ${fmt(v)}.`, `نوع العقد: ${type === 'supply' ? 'توريد' : type === 'mixed' ? 'مختلط' : 'خدمات / أعمال'}؛ القيمة ${fmt(v)} ريال.`),
      ...hits.map(h => bi(`${MECH_LABEL[h.program].en}: ${h.applies ? 'applies' : 'does not apply'}`, `${MECH_LABEL[h.program].ar}: ${h.applies ? 'تنطبق' : 'لا تنطبق'}`))],
  } : null);
  return (
    <Box title={T(isAr, 'Which mechanisms apply to your contract?', 'أي الآليات تنطبق على عقدك؟')}
      note={T(isAr, 'Mapping from a practitioner booklet describing LCGPA\'s mechanisms; the tender documents decide.', 'الربط مأخوذ من كتيّب مهني يشرح آليات الهيئة؛ وتحسم وثائق المنافسة.')}>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[11px] text-slate-600">{T(isAr, 'Contract type', 'نوع العقد')}
          <select value={type} onChange={e => setType(e.target.value as SaContractType)} className="mt-1 w-full border rounded px-2 py-1 text-sm">
            <option value="supply">{T(isAr, 'Supply', 'توريد')}</option>
            <option value="services-works">{T(isAr, 'Services / works', 'خدمات / أعمال')}</option>
            <option value="mixed">{T(isAr, 'Mixed (supply + services/works)', 'مختلط (توريد + خدمات / أعمال)')}</option>
          </select></label>
        <Field label={T(isAr, 'Contract value (SAR)', 'قيمة العقد (ريال)')} value={value} onChange={setValue} />
        <label className="text-[11px] text-slate-600 col-span-2">{T(isAr, 'Or pick the MOF model contract (sets the type above)', 'أو اختر نموذج العقد من وزارة المالية (يحدد النوع أعلاه)')}
          <select value="" onChange={e => { const m = MOF_CONTRACT_MODELS.find(x => x.id === e.target.value); if (m) setType(m.lcgpaClass); }} className="mt-1 w-full border rounded px-2 py-1 text-sm">
            <option value="">{T(isAr, '— choose a model —', '— اختر نموذجاً —')}</option>
            {MOF_CONTRACT_MODELS.map(m => <option key={m.id} value={m.id}>{isAr ? m.ar : m.en}</option>)}
          </select>
          <span className="block text-[10px] text-slate-500 mt-0.5">{isAr ? MOF_DECISION_1118_SOURCE.ar : MOF_DECISION_1118_SOURCE.en}</span>
        </label>
      </div>
      {hits.length > 0 && (
        <ul className="mt-2 space-y-1" role="status">
          {hits.map(h => (
            <li key={h.program} className={`text-xs ${h.applies ? 'text-emerald-800' : 'text-slate-400'}`}>
              <span aria-hidden="true">{h.applies ? '✓' : '–'}</span>{' '}
              {isAr ? MECH_LABEL[h.program].ar : MECH_LABEL[h.program].en}{' '}
              <span className="sr-only">{h.applies ? T(isAr, 'applies', 'تنطبق') : T(isAr, 'does not apply', 'لا تنطبق')}</span>
              <span className="text-[10px]">{h.applies ? '' : ` (${T(isAr, 'not for this type/value', 'لا تنطبق على هذا النوع أو القيمة')})`}</span>
            </li>
          ))}
          <li className="text-[10px] text-slate-500 pt-1">{T(isAr, `High-value threshold: SAR ${fmt(SA_HIGH_VALUE_THRESHOLD_SAR)}`, 'حد القيمة العالية: ٢٥ مليون ريال')}</li>
        </ul>
      )}
    </Box>
  );
}

/* ── Mandatory list lookup + exemption price-gap test ── */
function MandatoryLookup({ isAr }: { isAr: boolean }) {
  const [q, setQ] = useState('');
  const [mod, setMod] = useState<typeof import('@/lib/lcgpaMandatoryList') | null>(null);
  const [failed, setFailed] = useState(false);
  const [buyer, setBuyer] = useState<'government' | 'soe'>('government');
  const [pick, setPick] = useState<MandatoryProduct | null>(null);
  const [foreign, setForeign] = useState('');
  const [local, setLocal] = useState('');
  useEffect(() => { import('@/lib/lcgpaMandatoryList').then(setMod).catch(() => setFailed(true)); }, []);
  const res = useMemo(() => (mod && q.trim().length >= 2 ? mod.searchMandatory({ query: q, buyer, limit: 8 }) : null), [mod, q, buyer]);
  const test = pick && mod ? mod.exemptionPriceTest(num(foreign), num(local), pick.ceilingPct) : null;
  usePublishFinding('mandatory-list', pick && mod ? {
    title: bi('Mandatory List check', 'فحص القائمة الإلزامية'),
    lines: [bi(`${pick.nameEn} (code ${pick.code}), sector ${pick.sectorEn}.`, `${pick.nameAr} (الرمز ${pick.code})، القطاع ${pick.sectorAr}.`),
      bi(`Price ceiling: ${pick.ceilingPct === null ? 'none shown' : pick.ceilingPct + '%'}; duty starts ${mod.effectiveDateFor(pick, buyer) ?? 'n/a'} for ${buyer === 'soe' ? 'state-owned companies' : 'government entities'}.`,
         `السقف السعري: ${pick.ceilingPct === null ? 'غير مذكور' : pick.ceilingPct + '٪'}؛ بدء الإلزام ${mod.effectiveDateFor(pick, buyer) ?? 'غير متاح'} لـ${buyer === 'soe' ? 'الشركات المملوكة للدولة' : 'الجهات الحكومية'}.`),
      ...(test ? [bi(`Exemption price test: national premium over the highest foreign offer ${pct(test.premium)}${test.exceedsCeiling === null ? '' : test.exceedsCeiling ? '; above the ceiling, negotiate national offers down first' : '; within the ceiling'}.`,
        `اختبار الاستثناء السعري: علاوة العرض الوطني على أعلى عرض أجنبي ${pct(test.premium)}${test.exceedsCeiling === null ? '' : test.exceedsCeiling ? '؛ فوق السقف: فاوض العروض الوطنية أولاً' : '؛ ضمن السقف'}.`)] : [])],
  } : null);
  const certText = (p: MandatoryProduct) => p.cert === 0 ? T(isAr, 'No certificate required', 'لا تُشترط شهادة') : p.cert === 2 ? T(isAr, 'Baseline certificate required', 'تُشترط شهادة خط الأساس') : T(isAr, `Factory certificate required${p.certFrom ? ' from ' + p.certFrom : ''}`, `تُشترط شهادة المصنع${p.certFrom ? ' من ' + p.certFrom : ''}`);
  return (
    <Box title={T(isAr, 'Is your product on the Mandatory List?', 'هل منتجك في القائمة الإلزامية؟')}
      note={T(isAr, 'Source: LCGPA Mandatory List (government entities, June 2025; state-owned companies). The list gives a price ceiling, not a minimum percentage.', 'المصدر: القائمة الإلزامية للهيئة (الجهات الحكومية يونيو ٢٠٢٥، والشركات المملوكة للدولة). تعطي القائمة سقفاً سعرياً لا نسبة دنيا.')}>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[11px] text-slate-600">{T(isAr, 'Product name or code', 'اسم المنتج أو رمزه')}
          <input value={q} onChange={e => { setQ(e.target.value); setPick(null); }} className="mt-1 w-full border rounded px-2 py-1 text-sm" /></label>
        <label className="text-[11px] text-slate-600">{T(isAr, 'Buyer', 'الجهة المشترية')}
          <select value={buyer} onChange={e => setBuyer(e.target.value as 'government' | 'soe')} className="mt-1 w-full border rounded px-2 py-1 text-sm">
            <option value="government">{T(isAr, 'Government entity', 'جهة حكومية')}</option>
            <option value="soe">{T(isAr, 'State-owned company', 'شركة مملوكة للدولة')}</option>
          </select></label>
      </div>
      {failed && <p className="text-xs text-red-700 mt-2">{T(isAr, 'The list could not be loaded. Reload the page.', 'تعذّر تحميل القائمة. أعد تحميل الصفحة.')}</p>}
      {!mod && !failed && <p className="text-xs text-slate-500 mt-2">{T(isAr, 'Loading the list…', 'جارٍ تحميل القائمة…')}</p>}
      {res && res.total === 0 && <p className="text-xs mt-2" role="status">{T(isAr, 'Not found on this buyer\'s list. Try another spelling or the Etimad code.', 'غير موجود في قائمة هذه الجهة. جرّب صياغة أخرى أو رمز «اعتماد».')}</p>}
      {res && res.items.length > 0 && !pick && (
        <ul className="mt-2 divide-y border rounded" role="listbox">
          {res.items.map(p => (
            <li key={`${p.code}-${p.nameEn}`}><button type="button" onClick={() => setPick(p)} className="w-full text-start px-2 py-1.5 text-xs hover:bg-slate-50">
              <bdi dir="ltr" className="text-slate-400">{p.code}</bdi> {isAr ? p.nameAr : p.nameEn}</button></li>
          ))}
          {res.total > res.items.length && <li className="px-2 py-1 text-[10px] text-slate-500">{T(isAr, `${res.total} matches: refine your search`, `${res.total} نتيجة: ضيّق البحث`)}</li>}
        </ul>
      )}
      {pick && mod && (
        <div className="mt-2 text-xs space-y-1" role="status">
          <p className="font-semibold">{isAr ? pick.nameAr : pick.nameEn} <bdi dir="ltr" className="text-slate-400">{pick.code}</bdi></p>
          <p>{T(isAr, 'Sector', 'القطاع')}: {isAr ? pick.sectorAr : pick.sectorEn}</p>
          <p>{T(isAr, 'Price ceiling', 'السقف السعري')}: <bdi dir="ltr">{pick.ceilingPct === null ? '—' : pick.ceilingPct + '%'}</bdi></p>
          <p>{T(isAr, 'Duty starts', 'بدء الإلزام')}: <bdi dir="ltr">{mod.effectiveDateFor(pick, buyer) ?? '—'}</bdi></p>
          <p>{certText(pick)}</p>
          <div className="pt-2 border-t mt-2">
            <p className="font-semibold mb-1">{T(isAr, 'Exemption price test (ground: price)', 'اختبار الاستثناء السعري')}</p>
            <div className="grid grid-cols-2 gap-2">
              <Field label={T(isAr, 'Highest foreign offer', 'أعلى عرض أجنبي')} value={foreign} onChange={setForeign} />
              <Field label={T(isAr, 'Lowest national offer', 'أقل عرض وطني')} value={local} onChange={setLocal} />
            </div>
            {test && (
              <p className="mt-2 leading-relaxed">
                {T(isAr, 'National premium over the highest foreign offer:', 'علاوة العرض الوطني على أعلى عرض أجنبي:')} <bdi dir="ltr">{pct(test.premium)}</bdi>.{' '}
                {test.exceedsCeiling === null ? T(isAr, 'This product shows no ceiling on the list.', 'لا سقف لهذا المنتج في القائمة.')
                  : test.exceedsCeiling ? T(isAr, 'Above the ceiling: negotiate the national offers down first; target at most ', 'فوق السقف: فاوض العروض الوطنية أولاً؛ والهدف ألا يزيد عن ') : T(isAr, 'Within the ceiling: the price ground does not support an exemption.', 'ضمن السقف: لا يدعم السبب السعري طلب الاستثناء.')}
                {test.negotiateTargetPrice !== null && <bdi dir="ltr">{fmt(test.negotiateTargetPrice)}</bdi>}
              </p>
            )}
            <p className="text-[10px] text-slate-500 mt-1">{T(isAr, 'The exemption document does not define the base of the ceiling; ISC measures against the highest foreign offer. The buyer and LCGPA decide.', 'لا تحدد وثيقة الاستثناء أساس السقف؛ ويقيس النظام مقابل أعلى عرض أجنبي. والقرار للجهة وللهيئة.')}</p>
          </div>
          <button type="button" onClick={() => setPick(null)} className="text-[11px] text-[#082C6B] underline">{T(isAr, 'Search another product', 'ابحث عن منتج آخر')}</button>
        </div>
      )}
    </Box>
  );
}

/* ── Adjusted bid ── */
function AdjustedBid({ isAr }: { isAr: boolean }) {
  const [price, setPrice] = useState('');
  const [share, setShare] = useState('');
  const [rate, setRate] = useState('10');
  const p = num(price);
  const s = parsePercent(share) / 100;
  const r = parsePercent(rate) / 100;
  const adj = p * (1 + r * (1 - s));
  const noShare = p * (1 + r);
  usePublishFinding('adjusted-bid', p > 0 ? {
    title: bi('Adjusted bid (price preference)', 'العرض المعدَّل (تفضيل السعر)'),
    lines: [bi(`Bid SAR ${fmt(p)}, national share ${fmt(s * 100, 1)}%, rate ${fmt(r * 100, 1)}%: evaluated price SAR ${fmt(adj)}; saving from your national share SAR ${fmt(noShare - adj)}.`,
      `سعر العرض ${fmt(p)} ريال، الحصة الوطنية ${fmt(s * 100, 1)}٪، النسبة ${fmt(r * 100, 1)}٪: السعر المقيَّم ${fmt(adj)} ريال؛ وفر حصتك الوطنية ${fmt(noShare - adj)} ريال.`)],
  } : null);
  return (
    <Box title={T(isAr, 'Adjusted bid (price preference)', 'العرض المعدَّل (تفضيل السعر)')}
      note={T(isAr, 'Adjusted bid = price + rate × price × (1 − national share). National share excludes Mandatory List items.', 'العرض المعدَّل = السعر + النسبة × السعر × (١ − حصة المنتجات الوطنية). وتستثني الحصة بنود القائمة الإلزامية.')}>
      <div className="grid grid-cols-3 gap-2">
        <Field label={T(isAr, 'Bid price (SAR)', 'سعر العرض (ريال)')} value={price} onChange={setPrice} />
        <Field label={T(isAr, 'National share %', 'حصة المنتجات الوطنية ٪')} value={share} onChange={setShare} />
        <Field label={T(isAr, 'Rate %', 'النسبة ٪')} value={rate} onChange={setRate} />
      </div>
      {p > 0 && (
        <p className="text-xs mt-2 leading-relaxed" role="status">
          {T(isAr, 'Evaluated price:', 'السعر المقيَّم:')} <bdi dir="ltr"><strong>{fmt(adj)}</strong></bdi>{' '}
          ({T(isAr, 'with no national content:', 'دون محتوى وطني:')} <bdi dir="ltr">{fmt(noShare)}</bdi>; {T(isAr, 'saving from your share:', 'وفر حصتك الوطنية:')} <bdi dir="ltr">{fmt(noShare - adj)}</bdi>)
        </p>
      )}
    </Box>
  );
}

/* ── SME check ── */
function SmeCheck({ isAr }: { isAr: boolean }) {
  const [cls, setCls] = useState(false); const [own, setOwn] = useState(''); const [cert, setCert] = useState(false);
  const [type, setType] = useState<SaContractType>('services-works'); const [value, setValue] = useState('');
  const v = num(value);
  const ownPct = parsePercent(own);
  const checks = [
    { ok: cls, en: 'Classified small or medium by Monsha\'at', ar: 'مصنَّف صغيراً أو متوسطاً لدى منشآت' },
    { ok: cert, en: 'Valid Monsha\'at certificate at bid date', ar: 'شهادة منشآت سارية عند تقديم العرض' },
    { ok: ownPct >= 50, en: 'Saudi ownership of capital at least 50%', ar: 'ملكية السعوديين لرأس المال لا تقل عن ٥٠٪' },
    { ok: type !== 'supply' && v > 0 && v < SA_HIGH_VALUE_THRESHOLD_SAR, en: 'Non-supply contract below SAR 25 million', ar: 'عقد غير توريد وأقل من ٢٥ مليون ريال' },
  ];
  const all = checks.every(c => c.ok);
  usePublishFinding('sme-check', (cls || cert || own || v > 0) ? {
    title: bi('SME preference eligibility', 'أهلية تفضيل المنشآت الصغيرة والمتوسطة'),
    lines: [...checks.map(c => bi(`${c.ok ? 'Met' : 'Not met'}: ${c.en}`, `${c.ok ? 'مستوفى' : 'غير مستوفى'}: ${c.ar}`)),
      bi(all ? 'All conditions met: the 10% preference should apply.' : 'At least one condition is not met.', all ? 'استُوفيت كل الشروط: يُفترض أن تسري أفضلية ١٠٪.' : 'لم يُستوفَ شرط واحد على الأقل.')],
  } : null);
  return (
    <Box title={T(isAr, 'Do you qualify for the SME preference?', 'هل تتأهل لتفضيل المنشآت الصغيرة والمتوسطة؟')}>
      <div className="space-y-1.5">
        <label className="flex gap-2 text-xs"><input type="checkbox" checked={cls} onChange={e => setCls(e.target.checked)} />{T(isAr, 'Classified small or medium by Monsha\'at', 'مصنَّف صغيراً أو متوسطاً لدى منشآت')}</label>
        <label className="flex gap-2 text-xs"><input type="checkbox" checked={cert} onChange={e => setCert(e.target.checked)} />{T(isAr, 'Certificate valid on the bid closing date', 'الشهادة سارية في موعد إغلاق العرض')}</label>
        <div className="grid grid-cols-3 gap-2">
          <Field label={T(isAr, 'Saudi ownership %', 'ملكية السعوديين ٪')} value={own} onChange={setOwn} />
          <label className="text-[11px] text-slate-600">{T(isAr, 'Contract type', 'نوع العقد')}
            <select value={type} onChange={e => setType(e.target.value as SaContractType)} className="mt-1 w-full border rounded px-2 py-1 text-sm">
              <option value="supply">{T(isAr, 'Supply', 'توريد')}</option><option value="services-works">{T(isAr, 'Services / works', 'خدمات / أعمال')}</option></select></label>
          <Field label={T(isAr, 'Value (SAR)', 'القيمة (ريال)')} value={value} onChange={setValue} />
        </div>
      </div>
      <ul className="mt-2 space-y-0.5" role="status">
        {checks.map((c, i) => <li key={i} className={`text-xs ${c.ok ? 'text-emerald-800' : 'text-slate-500'}`}><span aria-hidden="true">{c.ok ? '✓' : '✗'}</span> {T(isAr, c.en, c.ar)}</li>)}
      </ul>
      <p className="text-xs font-semibold mt-1">{all ? T(isAr, 'All conditions met: the 10% preference should apply.', 'استُوفيت كل الشروط: يُفترض أن تسري أفضلية ١٠٪.') : T(isAr, 'At least one condition is not met.', 'لم يُستوفَ شرط واحد على الأقل.')}</p>
    </Box>
  );
}


/* ── Multi-item editor: a contract may hold several items, each with a main sector and a sub-sector ── */
interface ItemRow { sectorId: string; sub: string; spend: string; diff: string; audited: string }
const newRow = (): ItemRow => ({ sectorId: String(LCGPA_SECTORS[0].id), sub: '', spend: '', diff: '', audited: '' });
function ItemsEditor({ rows, setRows, isAr, withDiff, withAudited }: { rows: ItemRow[]; setRows: (r: ItemRow[]) => void; isAr: boolean; withDiff?: boolean; withAudited?: boolean }) {
  const upd = (i: number, k: keyof ItemRow, v: string) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: v, ...(k === 'sectorId' ? { sub: '' } : {}) } : r)));
  return (
    <div className="space-y-2">
      {rows.map((r, i) => {
        const sec = sectorById(Number(r.sectorId));
        return (
          <fieldset key={i} className="rounded border border-slate-200 p-2">
            <legend className="text-[11px] font-semibold text-slate-600 px-1">{T(isAr, `Item ${i + 1}`, `البند ${i + 1}`)}</legend>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[11px] text-slate-600">{T(isAr, 'Main sector', 'القطاع الرئيس')}
                <select value={r.sectorId} onChange={e => upd(i, 'sectorId', e.target.value)} className="mt-1 w-full border rounded px-2 py-1 text-sm">
                  {LCGPA_SECTORS.map(x => <option key={x.id} value={x.id}>{isAr ? x.nameAr : x.nameEn} ({Math.round(x.pct * 100)}%)</option>)}</select></label>
              <label className="text-[11px] text-slate-600">{T(isAr, 'Sub-sector', 'القطاع الفرعي')}
                <select value={r.sub} onChange={e => upd(i, 'sub', e.target.value)} className="mt-1 w-full border rounded px-2 py-1 text-sm">
                  <option value="">{T(isAr, '(not specified)', '(غير محدد)')}</option>
                  {(sec?.subs ?? []).map((x, k) => <option key={k} value={x.ar}>{isAr ? x.ar : x.en}</option>)}</select></label>
              <Field label={T(isAr, 'Spend (SAR)', 'الإنفاق (ريال)')} value={r.spend} onChange={v => upd(i, 'spend', v)} />
              {withDiff && <Field label={T(isAr, 'Extra cost of buying local (SAR)', 'كلفة الشراء المحلي الإضافية (ريال)')} value={r.diff} onChange={v => upd(i, 'diff', v)} />}
              {withAudited && <Field label={T(isAr, 'Supplier\'s audited local content % (if any)', 'نسبة المحتوى المحلي المدققة للمورد ٪ (إن وُجدت)')} value={r.audited} onChange={v => upd(i, 'audited', v)} />}
            </div>
            {rows.length > 1 && <button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))} className="text-[11px] text-red-700 underline mt-1">{T(isAr, 'Remove item', 'احذف البند')}</button>}
          </fieldset>
        );
      })}
      <button type="button" onClick={() => setRows([...rows, newRow()])} className="text-[11px] text-[#082C6B] underline">{T(isAr, 'Add another item to this contract', 'أضف بنداً آخر إلى هذا العقد')}</button>
    </div>
  );
}

/* ── Targeted local content (official forms) ── */
function Targeted({ mode, isAr }: { mode: 'contract' | 'enterprise'; isAr: boolean }) {
  const [f, setF] = useState({ saudi: '', foreign: '', gs: '', train: '', supp: '', rd: '', dep: '', depSa: '', rev: '', min: '' });
  const [rows, setRows] = useState<ItemRow[]>([newRow()]);
  const set = (k: keyof typeof f) => (v: string) => setF(p => ({ ...p, [k]: v }));
  const gsTotal = num(f.gs);
  const lines = rows.filter(r => num(r.spend) > 0).map(r => ({ sectorId: Number(r.sectorId), spend: num(r.spend), auditedPct: parsePercent(r.audited) / 100 }));
  const r = computeTargetedLocalContent({
    mode, saudiCompensation: num(f.saudi), foreignCompensation: num(f.foreign), goodsServicesTotal: gsTotal, goodsServicesLines: lines,
    saudiTraining: num(f.train), supplierDevelopment: num(f.supp), researchDevelopment: num(f.rd),
    depreciationTotal: num(f.dep), depreciationSaudiMade: num(f.depSa), revenue: num(f.rev),
  });
  const minPct = parsePercent(f.min) / 100;
  const gap = minPct > 0 ? gapToThreshold(r.targetedPct, minPct) : null;
  usePublishFinding('targeted-' + mode, r.totalCost > 0 ? {
    title: mode === 'contract' ? bi('Targeted local content (contract-level form)', 'المحتوى المحلي المستهدف (نموذج العقد)') : bi('Targeted local content (enterprise-level form)', 'المحتوى المحلي المستهدف (نموذج المنشأة)'),
    lines: [bi(`Targeted local content: ${pct(r.targetedPct)} on a total related cost of SAR ${fmt(r.totalCost)}.`, `المحتوى المحلي المستهدف: ${pct(r.targetedPct)} على تكلفة ذات صلة إجمالها ${fmt(r.totalCost)} ريال.`),
      ...(mode === 'enterprise' && r.rdIncentive > 0 ? [bi(`Includes R&D incentive of ${pct(r.rdIncentive)}.`, `يشمل حافز البحث والتطوير ${pct(r.rdIncentive)}.`)] : []),
      ...(gap ? [bi(gap.meets ? `Meets the buyer's minimum of ${pct(minPct)}.` : `Short of the buyer's minimum of ${pct(minPct)} by ${pct(gap.shortfallPts)} points.`, gap.meets ? `يستوفي حد الجهة الأدنى ${pct(minPct)}.` : `دون حد الجهة الأدنى ${pct(minPct)} بمقدار ${pct(gap.shortfallPts)} نقطة.`)] : []),
      ...(r.warnings.includes('itemised-below-70pct') ? [bi('Less than 70% of goods and services is itemised; the form asks for at least 70%.', 'أقل من ٧٠٪ من السلع والخدمات مفصَّل؛ ويطلب النموذج ٧٠٪ على الأقل.')] : [])],
  } : null);
  return (
    <Box title={mode === 'contract' ? T(isAr, 'Targeted local content: contract level (form OM-LRF-09)', 'المحتوى المحلي المستهدف: على مستوى العقد (نموذج OM-LRF-09)') : T(isAr, 'Targeted local content: enterprise level (form OM-LRF-10)', 'المحتوى المحلي المستهدف: على مستوى المنشأة (نموذج OM-LRF-10)')}
      note={T(isAr, 'Official form formulas: Saudi pay counts 100%, non-Saudi pay 53.4%, assets not made in Saudi Arabia 30%. Not an LCGPA determination.', 'صيغ النموذج الرسمي: أجور السعوديين ١٠٠٪، وأجور غير السعوديين ٥٣٫٤٪، والأصول غير المصنوعة في المملكة ٣٠٪. وليست قراراً من الهيئة.')}>
      <div className="grid grid-cols-2 gap-2">
        <Field label={T(isAr, 'Saudi pay (SAR)', 'أجور السعوديين (ريال)')} value={f.saudi} onChange={set('saudi')} />
        <Field label={T(isAr, 'Non-Saudi pay (SAR)', 'أجور غير السعوديين (ريال)')} value={f.foreign} onChange={set('foreign')} />
        <Field label={T(isAr, 'Goods and services, total (SAR)', 'إجمالي السلع والخدمات (ريال)')} value={f.gs} onChange={set('gs')} />
        <Field label={T(isAr, 'Saudi training (SAR)', 'تدريب السعوديين (ريال)')} value={f.train} onChange={set('train')} />
        <Field label={T(isAr, 'Supplier development (SAR)', 'تطوير الموردين (ريال)')} value={f.supp} onChange={set('supp')} />
        <Field label={T(isAr, 'Research and development (SAR)', 'البحث والتطوير (ريال)')} value={f.rd} onChange={set('rd')} />
        <Field label={T(isAr, 'Depreciation, total (SAR)', 'إجمالي الإهلاك (ريال)')} value={f.dep} onChange={set('dep')} />
        <Field label={T(isAr, 'of which Saudi-made assets (SAR)', 'منه أصول مصنوعة في المملكة (ريال)')} value={f.depSa} onChange={set('depSa')} />
        {mode === 'enterprise' && <Field label={T(isAr, 'Revenue (SAR)', 'الإيرادات (ريال)')} value={f.rev} onChange={set('rev')} />}
        <Field label={T(isAr, 'Buyer\'s minimum % (from tender)', 'الحد الأدنى للجهة ٪ (من المنافسة)')} value={f.min} onChange={set('min')} />
      </div>
      <div className="mt-2">
        <p className="text-[11px] font-semibold text-slate-700 mb-1">{T(isAr, 'Goods and services by supplier item', 'السلع والخدمات بحسب بنود الموردين')}</p>
        <ItemsEditor rows={rows} setRows={setRows} isAr={isAr} withAudited />
        <p className="text-[10px] text-slate-400 mt-1">{T(isAr, 'Un-itemised spend is valued at the weighted average of the listed items.', 'الإنفاق غير المفصَّل يُقيَّم بالمتوسط المرجّح للبنود المدرجة.')}</p>
      </div>
      {r.totalCost > 0 && (
        <div className="mt-2 text-xs space-y-1" role="status">
          <p className="text-sm font-bold text-[#082C6B]">{T(isAr, 'Targeted local content:', 'المحتوى المحلي المستهدف:')} <bdi dir="ltr">{pct(r.targetedPct)}</bdi></p>
          {mode === 'enterprise' && r.rdIncentive > 0 && <p>{T(isAr, 'Includes R&D incentive:', 'يشمل حافز البحث والتطوير:')} <bdi dir="ltr">+{pct(r.rdIncentive)}</bdi></p>}
          {gap && <p className={gap.meets ? 'text-emerald-800' : 'text-red-700'}>{gap.meets ? T(isAr, 'Meets the buyer\'s minimum.', 'يستوفي حد الجهة الأدنى.') : T(isAr, `Short of the minimum by ${pct(gap.shortfallPts)} points.`, `دون الحد الأدنى بمقدار ${pct(gap.shortfallPts)} نقطة.`)}</p>}
          {r.warnings.includes('itemised-below-70pct') && <p className="text-amber-800">{T(isAr, 'The form asks for at least 70% of goods and services itemised.', 'يطلب النموذج تفصيل ٧٠٪ على الأقل من السلع والخدمات.')}</p>}
        </div>
      )}
    </Box>
  );
}

/* ── Contract-minimum study ── */
function ContractMinimum({ isAr }: { isAr: boolean }) {
  const [saudi, setSaudi] = useState(''); const [foreign, setForeign] = useState('');
  const [rows, setRows] = useState<ItemRow[]>([newRow()]);
  const items = rows.filter(r => num(r.spend) > 0).map(r => ({ sectorId: Number(r.sectorId), subSector: r.sub || undefined, spend: num(r.spend), localPriceDifferential: num(r.diff) }));
  const r = computeContractMinimum({ workforce: { saudiCompensation: num(saudi), foreignCompensation: num(foreign) }, items });
  usePublishFinding('contract-minimum', r.totalCost > 0 ? {
    title: bi('Pre-award study: cost of local content', 'دراسة ما قبل الترسية: كلفة المحتوى المحلي'),
    lines: [bi(`${r.items.length} item(s). Baseline local content ${pct(r.baselinePct)}; minimum case ${pct(r.minimumPct)}.`, `${r.items.length} بند. المحتوى المحلي الأساسي ${pct(r.baselinePct)}؛ حالة الحد الأدنى ${pct(r.minimumPct)}.`),
      bi(`Financial impact of buying local: SAR ${fmt(r.financialImpact)} (${pct(r.financialImpactPct)}).`, `الأثر المالي للشراء المحلي: ${fmt(r.financialImpact)} ريال (${pct(r.financialImpactPct)}).`),
      ...r.items.map((it, i) => bi(`Item ${i + 1}: ${it.sector?.nameEn ?? 'unclassified'} (${pct(it.baselinePct)}).`, `البند ${i + 1}: ${it.sector?.nameAr ?? 'غير مصنَّف'} (${pct(it.baselinePct)}).`))],
  } : null);
  return (
    <Box title={T(isAr, 'Pre-award study: what local content could cost you', 'دراسة ما قبل الترسية: كم قد يكلفك المحتوى المحلي')}
      note={T(isAr, 'Uses the official study form\'s sector percentages (38 main sectors, with sub-sectors). The minimum your contract must meet comes from the tender; enter it in the calculator above.', 'تستخدم نسب القطاعات في نموذج الدراسة الرسمي (٣٨ قطاعاً رئيساً مع قطاعاتها الفرعية). والحد الأدنى لعقدك يرد في المنافسة؛ أدخله في الحاسبة أعلاه.')}>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <Field label={T(isAr, 'Saudi pay (SAR)', 'أجور السعوديين (ريال)')} value={saudi} onChange={setSaudi} />
        <Field label={T(isAr, 'Non-Saudi pay (SAR)', 'أجور غير السعوديين (ريال)')} value={foreign} onChange={setForeign} />
      </div>
      <ItemsEditor rows={rows} setRows={setRows} isAr={isAr} withDiff />
      {r.totalCost > 0 && (
        <div className="mt-2 text-xs space-y-1" role="status">
          <p>{T(isAr, 'Baseline local content:', 'المحتوى المحلي الأساسي:')} <bdi dir="ltr">{pct(r.baselinePct)}</bdi></p>
          <p>{T(isAr, 'Minimum case:', 'حالة الحد الأدنى:')} <bdi dir="ltr">{pct(r.minimumPct)}</bdi></p>
          <p>{T(isAr, 'Financial impact of buying local:', 'الأثر المالي للشراء المحلي:')} <bdi dir="ltr">{fmt(r.financialImpact)} SAR ({pct(r.financialImpactPct)})</bdi></p>
          {r.items.length > 1 && (
            <ul className="text-[11px] text-slate-600 list-disc ps-4">
              {r.items.map((it, i) => <li key={i}>{T(isAr, `Item ${i + 1}`, `البند ${i + 1}`)}: {it.sector ? (isAr ? it.sector.nameAr : it.sector.nameEn) : '—'} (<bdi dir="ltr">{pct(it.baselinePct)}</bdi>)</li>)}
            </ul>
          )}
          {r.warnings.includes('cost-mismatch-10pct') && <p className="text-amber-800">{T(isAr, 'Workforce plus items differ from the total cost by more than 10%: check the figures.', 'مجموع القوى العاملة والبنود يختلف عن الكلفة الإجمالية بأكثر من ١٠٪: راجع الأرقام.')}</p>}
        </div>
      )}
    </Box>
  );
}

/* ── 60/40 financial evaluation (illustrative) ── */
function FinancialEval({ isAr }: { isAr: boolean }) {
  const [rows, setRows] = useState([{ name: 'A', price: '', lc: '' }, { name: 'B', price: '', lc: '' }]);
  const out = financialEvaluation({ bidders: rows.map(r => ({ name: r.name, price: num(r.price), localContentPct: parsePercent(r.lc) / 100 })) });
  const upd = (i: number, k: 'price' | 'lc', v: string) => setRows(rs => rs.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  usePublishFinding('financial-evaluation', out.length > 1 ? {
    title: bi('60/40 evaluation (illustration)', 'تقييم ٦٠/٤٠ (توضيحي)'),
    lines: [...[...out].sort((a, b) => a.rank - b.rank).map(o => bi(`${o.rank}. ${o.name}: ${fmt(o.total * 100, 1)} / 100`, `${o.rank}. ${o.name}: ${fmt(o.total * 100, 1)} / 100`)),
      bi('Illustration only: the tender documents set the real formula.', 'توضيح فقط: صيغة المنافسة الفعلية في وثائقها.')],
  } : null);
  return (
    <Box title={T(isAr, 'See how 60/40 could rank bidders (illustration)', 'كيف قد يرتّب ٦٠/٤٠ المتنافسين (توضيحي)')}
      note={T(isAr, 'Illustration only: proportional scoring. The tender documents set the real formula.', 'توضيح فقط: تقدير تناسبي. وصيغة المنافسة الفعلية في وثائقها.')}>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-3 gap-2 items-end">
            <span className="text-xs font-bold pb-1.5"><bdi dir="ltr">{r.name}</bdi></span>
            <Field label={T(isAr, 'Price (SAR)', 'السعر (ريال)')} value={r.price} onChange={v => upd(i, 'price', v)} />
            <Field label={T(isAr, 'Local content %', 'المحتوى المحلي ٪')} value={r.lc} onChange={v => upd(i, 'lc', v)} />
          </div>
        ))}
        <button type="button" onClick={() => setRows(rs => [...rs, { name: String.fromCharCode(65 + rs.length), price: '', lc: '' }])} className="text-[11px] text-[#082C6B] underline">{T(isAr, 'Add a bidder', 'أضف متنافساً')}</button>
      </div>
      {out.length > 1 && (
        <ol className="mt-2 text-xs space-y-0.5" role="status">
          {[...out].sort((a, b) => a.rank - b.rank).map(o => (
            <li key={o.name}><bdi dir="ltr">{o.rank}. {o.name}</bdi>: <bdi dir="ltr">{fmt(o.total * 100, 1)}</bdi> / 100</li>
          ))}
        </ol>
      )}
    </Box>
  );
}

/* ── Saudization shortfall (HRSD job-group targets) ── */
function SaudizationCheck({ isAr }: { isAr: boolean }) {
  const [prog, setProg] = useState<SaudizationProgramId>('ict');
  const [total, setTotal] = useState(''); const [saudis, setSaudis] = useState('');
  const t = num(total); const sa = num(saudis);
  const p = SAUDIZATION_PROGRAMS.find(x => x.id === prog)!;
  const r = t > 0 ? saudizationShortfall(prog, t, sa) : null;
  usePublishFinding('saudization-check', r ? {
    title: bi('Saudization shortfall', 'نقص التوطين'),
    lines: [bi(`${p.en}: target ${r.target} Saudis of ${fmt(t)} workers; you have ${fmt(sa)}.`, `${p.ar}: المستهدف ${r.target} سعوديين من ${fmt(t)} عاملاً؛ لديك ${fmt(sa)}.`),
      bi(!r.bound ? 'This group is below the minimum size, so the target does not bind.' : r.compliant ? 'Target met.' : `You need ${r.required} more Saudi worker(s) in this job group.`,
         !r.bound ? 'المجموعة دون الحد الأدنى للحجم فلا يسري المستهدف.' : r.compliant ? 'المستهدف محقق.' : `تحتاج إلى ${r.required} عامل/عاملين سعوديين إضافيين في هذه المجموعة.`)],
  } : null);
  return (
    <Box title={T(isAr, 'Saudization: how many Saudi workers do you need?', 'التوطين: كم سعودياً تحتاج؟')}
      note={T(isAr, 'Count all workers in one job group (not per occupation). Penalty amounts are set by HRSD and are not computed here.', 'احسب كل العاملين في مجموعة وظيفية واحدة (لا لكل مهنة). مبالغ الغرامات تحددها وزارة الموارد البشرية ولا تُحتسب هنا.')}>
      <div className="grid grid-cols-3 gap-2">
        <label className="text-[11px] text-slate-600 col-span-3">{T(isAr, 'Program', 'البرنامج')}
          <select value={prog} onChange={e => setProg(e.target.value as SaudizationProgramId)} className="mt-1 w-full border rounded px-2 py-1 text-sm">
            {SAUDIZATION_PROGRAMS.map(x => <option key={x.id} value={x.id}>{isAr ? x.ar : x.en}</option>)}
          </select></label>
        <Field label={T(isAr, 'All workers in the group', 'كل العاملين في المجموعة')} value={total} onChange={setTotal} />
        <Field label={T(isAr, 'Saudis among them', 'السعوديون منهم')} value={saudis} onChange={setSaudis} />
      </div>
      {r && (
        <p className="text-xs font-semibold mt-2" role="status">
          {!r.bound ? T(isAr, 'Below the minimum group size: the target does not bind.', 'دون الحد الأدنى لحجم المجموعة: لا يسري المستهدف.')
            : r.compliant ? T(isAr, `Target met (${r.target} Saudis needed).`, `المستهدف محقق (المطلوب ${r.target} سعوديين).`)
            : T(isAr, `Short by ${r.required}: hire ${r.required} more Saudi worker(s) (target ${r.target}).`, `نقص ${r.required}: وظِّف ${r.required} سعودياً إضافياً (المستهدف ${r.target}).`)}
        </p>
      )}
      <p className="text-[10px] text-slate-500 mt-1">{isAr ? p.source.ar : p.source.en}</p>
    </Box>
  );
}

export function ProgramBriefTools({ tools, isAr }: { tools: BriefTool[]; isAr: boolean }) {
  return (
    <div className="space-y-3">
      {tools.map(t => {
        switch (t) {
          case 'mechanism-finder': return <MechanismFinder key={t} isAr={isAr} />;
          case 'mandatory-list': return <MandatoryLookup key={t} isAr={isAr} />;
          case 'sa-adjusted-bid': return <AdjustedBid key={t} isAr={isAr} />;
          case 'sme-check': return <SmeCheck key={t} isAr={isAr} />;
          case 'targeted-contract': return <Targeted key={t} mode="contract" isAr={isAr} />;
          case 'targeted-enterprise': return <Targeted key={t} mode="enterprise" isAr={isAr} />;
          case 'contract-minimum': return <ContractMinimum key={t} isAr={isAr} />;
          case 'financial-evaluation': return <FinancialEval key={t} isAr={isAr} />;
          case 'saudization-check': return <SaudizationCheck key={t} isAr={isAr} />;
          default: return null;
        }
      })}
    </div>
  );
}
