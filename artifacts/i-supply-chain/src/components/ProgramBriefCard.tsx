// Module 08 -- Program Brief decision card. RTL-safe: logical (start/end) classes only, Latin runs isolated in <bdi dir="ltr">,
// direction set from the language. Every figure shown comes from the brief data (sourced) or from the user's own inputs.
import React, { useState } from 'react';
import type { BriefAction, BriefConfidence, BriefTiming, ProgramBrief } from '@/lib/localContentBriefTypes';
import { usePublishFinding } from './ReportFindings';
import { parseAmount } from '@/lib/parseLocaleNumber';
import { ProgramBriefTools } from './LocalContentBriefTools';

const CONFIDENCE: Record<BriefConfidence, { en: string; ar: string; tone: string }> = {
  official: { en: 'Official source', ar: 'مصدر رسمي', tone: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  corroborated: { en: 'Corroborated', ar: 'مؤيَّد بمصدرين', tone: 'bg-sky-50 text-sky-800 border-sky-200' },
  single: { en: 'Single source: verify', ar: 'مصدر واحد: تحقق قبل الاعتماد', tone: 'bg-amber-50 text-amber-800 border-amber-200' },
  platform: { en: 'ISC default, not a published rule', ar: 'افتراض من النظام وليس قاعدة منشورة', tone: 'bg-slate-50 text-slate-700 border-slate-200' },
  none: { en: 'Nothing published: reference only', ar: 'لا شيء منشور: للاطلاع فقط', tone: 'bg-slate-50 text-slate-700 border-slate-200' },
};
const WHEN: Record<BriefTiming, { en: string; ar: string }> = {
  before: { en: 'Before you bid', ar: 'قبل تقديم العرض' },
  'with-bid': { en: 'With the bid', ar: 'مع العرض' },
  after: { en: 'After award', ar: 'بعد الترسية' },
};

const fmt = (n: number, d = 0) => n.toLocaleString('en-US', { maximumFractionDigits: d });

function PriceTest({ spec, isAr }: { spec: NonNullable<ProgramBrief['priceTest']>; isAr: boolean }) {
  const [own, setOwn] = useState('');
  const [rival, setRival] = useState('');
  const o = parseAmount(own), r = parseAmount(rival);
  const ok = o > 0 && r > 0;
  const rivalEval = r * (1 + spec.pct);
  const ownEval = o * (1 - spec.pct);
  const wins = spec.mode === 'add-to-rival' ? o < rivalEval : ownEval < r;
  const gap = spec.mode === 'add-to-rival' ? (rivalEval - o) / r : (r - ownEval) / r;
  usePublishFinding('price-test', ok ? {
    title: { en: 'Price test', ar: 'اختبار السعر' },
    lines: [{
      en: `Your price ${fmt(o)}, rival ${fmt(r)}: ${spec.mode === 'add-to-rival' ? `rival evaluated at ${fmt(rivalEval)}` : `your price evaluated at ${fmt(ownEval)}`}; ${wins ? 'you are lower after adjustment' : 'you are not lower after adjustment'} (margin ${fmt(Math.abs(gap) * 100, 1)}%).`,
      ar: `سعرك ${fmt(o)} وسعر المنافس ${fmt(r)}: ${spec.mode === 'add-to-rival' ? `يُقيَّم المنافس بـ${fmt(rivalEval)}` : `يُقيَّم سعرك بـ${fmt(ownEval)}`}؛ ${wins ? 'عرضك الأقل بعد التعديل' : 'عرضك ليس الأقل بعد التعديل'} (الفرق ${fmt(Math.abs(gap) * 100, 1)}٪).`,
    }],
  } : null);
  return (
    <div className="rounded-lg border border-slate-200 p-3 mt-3">
      <p className="text-xs font-bold text-slate-800 mb-2">{isAr ? 'اختبار السعر' : 'Price test'} {spec.rateNote && <span className="font-normal text-slate-500">({isAr ? spec.rateNote.ar : spec.rateNote.en})</span>}</p>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[11px] text-slate-600">{isAr ? 'سعر عرضك' : 'Your price'}
          <input inputMode="decimal" value={own} onChange={e => setOwn(e.target.value)} dir="ltr" className="mt-1 w-full border rounded px-2 py-1 text-sm text-start" /></label>
        <label className="text-[11px] text-slate-600">{isAr ? 'سعر المنافس' : 'Rival price'}
          <input inputMode="decimal" value={rival} onChange={e => setRival(e.target.value)} dir="ltr" className="mt-1 w-full border rounded px-2 py-1 text-sm text-start" /></label>
      </div>
      {ok && (
        <p className="text-xs mt-2 leading-relaxed" role="status">
          {spec.mode === 'add-to-rival'
            ? (isAr ? <>سعر المنافس المقيَّم: <bdi dir="ltr">{fmt(rivalEval)}</bdi>. </> : <>Rival's evaluated price: <bdi dir="ltr">{fmt(rivalEval)}</bdi>. </>)
            : (isAr ? <>سعرك المقيَّم: <bdi dir="ltr">{fmt(ownEval)}</bdi>. </> : <>Your evaluated price: <bdi dir="ltr">{fmt(ownEval)}</bdi>. </>)}
          <strong>{wins ? (isAr ? 'عرضك الأقل بعد التعديل.' : 'You are lower after adjustment.') : (isAr ? 'عرضك ليس الأقل بعد التعديل.' : 'You are not lower after adjustment.')}</strong>{' '}
          {isAr ? 'الفرق:' : 'Margin:'} <bdi dir="ltr">{fmt(Math.abs(gap) * 100, 1)}%</bdi>
        </p>
      )}
    </div>
  );
}

function ObligationSizer({ spec, isAr }: { spec: NonNullable<ProgramBrief['obligation']>; isAr: boolean }) {
  const [base, setBase] = useState('');
  const v = parseAmount(base);
  const obligation = v > 0 ? v * spec.pct : 0;
  const triggered = spec.threshold === undefined || v >= spec.threshold;
  usePublishFinding('obligation', v > 0 ? {
    title: { en: 'Obligation sizing', ar: 'حجم الالتزام' },
    lines: [{
      en: triggered ? `${spec.baseLabel.en} ${fmt(v)} ${spec.currency}: obligation ${fmt(obligation)} ${spec.currency} (${fmt(spec.pct * 100, 1)}%).` : `${spec.baseLabel.en} ${fmt(v)} ${spec.currency} is below the trigger threshold: no obligation.`,
      ar: triggered ? `${spec.baseLabel.ar} ${fmt(v)} ${spec.currency}: الالتزام ${fmt(obligation)} ${spec.currency} (${fmt(spec.pct * 100, 1)}٪).` : `${spec.baseLabel.ar} ${fmt(v)} ${spec.currency} دون حد الانطباق: لا التزام.`,
    }],
  } : null);
  return (
    <div className="rounded-lg border border-slate-200 p-3 mt-3">
      <p className="text-xs font-bold text-slate-800 mb-2">{isAr ? 'حجم الالتزام' : 'Size the obligation'}</p>
      <label className="text-[11px] text-slate-600 block">{isAr ? spec.baseLabel.ar : spec.baseLabel.en} (<bdi dir="ltr">{spec.currency}</bdi>)
        <input inputMode="decimal" value={base} onChange={e => setBase(e.target.value)} dir="ltr" className="mt-1 w-full border rounded px-2 py-1 text-sm text-start" /></label>
      {v > 0 && !triggered && <p className="text-xs mt-2" role="status">{isAr ? 'أقل من حد الانطباق: لا التزام.' : 'Below the trigger threshold: no obligation.'}</p>}
      {v > 0 && triggered && (
        <div className="mt-2 text-xs space-y-1" role="status">
          <p>{isAr ? 'الالتزام:' : 'Obligation:'} <bdi dir="ltr">{fmt(obligation)} {spec.currency}</bdi> (<bdi dir="ltr">{fmt(spec.pct * 100, 1)}%</bdi>)</p>
          {spec.multipliers.map((m, i) => (
            <p key={i} className="text-slate-600">{isAr ? m.label.ar : m.label.en} (<bdi dir="ltr">×{m.value}</bdi>): {isAr ? 'إنفاق مطلوب' : 'spend needed'} <bdi dir="ltr">{fmt(obligation / m.value)} {spec.currency}</bdi></p>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProgramBriefCard({ brief, isAr, sourceNote, sourceTitle, mandatoryList }: {
  brief: ProgramBrief; isAr: boolean; sourceNote: string; sourceTitle: string;
  mandatoryList?: React.ReactNode;
}) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [srcOpen, setSrcOpen] = useState(false);
  const conf = CONFIDENCE[brief.confidence];
  const t = (x: { en: string; ar: string }) => (isAr ? x.ar : x.en);
  const groups: BriefTiming[] = ['before', 'with-bid', 'after'];
  const dir = isAr ? 'rtl' : 'ltr';
  return (
    <section dir={dir} lang={isAr ? 'ar' : 'en'} className="rounded-2xl border border-slate-200 bg-white mb-3 overflow-hidden text-start" aria-label={isAr ? 'بطاقة القرار' : 'Decision card'}>
      <div className="p-4 bg-gradient-to-br from-[#082C6B]/5 to-white border-b border-slate-100">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="text-2xl font-extrabold text-[#082C6B] leading-tight"><bdi>{t(brief.headline.value)}</bdi></p>
            <p className="text-xs text-slate-600 mt-0.5">{t(brief.headline.label)}</p>
          </div>
          <span className={`text-[10px] font-bold border rounded-full px-2 py-0.5 ${conf.tone}`}>{t(conf)}</span>
        </div>
        <p className="text-sm font-semibold text-slate-800 mt-3 leading-relaxed">{t(brief.verdict)}</p>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <h4 className="text-xs font-bold text-slate-800 mb-2">{isAr ? 'كيف تعمل' : 'How it works'}</h4>
          <ol className="space-y-2">
            {brief.steps.map((s, i) => (
              <li key={i} className="flex gap-2 items-start text-xs text-slate-700 leading-relaxed">
                <span className="shrink-0 w-5 h-5 rounded-full bg-[#082C6B] text-white text-[10px] font-bold flex items-center justify-center" aria-hidden="true">{i + 1}</span>
                <span>{t(s)}</span>
              </li>
            ))}
          </ol>
        </div>

        {brief.tools && brief.tools.length > 0 && <ProgramBriefTools tools={brief.tools} isAr={isAr} />}
        {mandatoryList}
        {brief.priceTest && <PriceTest spec={brief.priceTest} isAr={isAr} />}
        {brief.obligation && <ObligationSizer spec={brief.obligation} isAr={isAr} />}

        <div>
          <h4 className="text-xs font-bold text-slate-800 mb-2">{isAr ? 'ما عليك فعله' : 'What to do'}</h4>
          {groups.map(g => {
            const items = brief.next.filter((a: BriefAction) => a.when === g);
            if (!items.length) return null;
            return (
              <fieldset key={g} className="mb-2">
                <legend className="text-[11px] font-semibold text-[#082C6B] mb-1">{t(WHEN[g])}</legend>
                {items.map((a, i) => {
                  const id = `${g}-${i}`;
                  return (
                    <label key={id} className="flex gap-2 items-start text-xs text-slate-700 leading-relaxed py-0.5 cursor-pointer">
                      <input type="checkbox" checked={!!done[id]} onChange={e => setDone(d => ({ ...d, [id]: e.target.checked }))} className="mt-0.5" />
                      <span className={done[id] ? 'line-through text-slate-400' : ''}>{t(a.text)}</span>
                    </label>
                  );
                })}
              </fieldset>
            );
          })}
        </div>

        {brief.watch.length > 0 && (
          <div className="rounded-lg bg-amber-50/60 border border-amber-100 p-3">
            <h4 className="text-xs font-bold text-amber-900 mb-1.5">{isAr ? 'احذر' : 'Watch out'}</h4>
            <ul className="space-y-1.5 list-disc ps-4">
              {brief.watch.map((w, i) => <li key={i} className="text-xs text-amber-950/90 leading-relaxed">{t(w)}</li>)}
            </ul>
          </div>
        )}

        {brief.update && (
          <p className="text-[11px] text-slate-600 border-s-2 border-sky-300 ps-2">{t(brief.update.text)} <span className="text-slate-400">({brief.update.sourceName}, <bdi dir="ltr">{brief.update.asOf}</bdi>)</span></p>
        )}

        <div className="border border-slate-100 rounded-xl">
          <button type="button" aria-expanded={srcOpen} onClick={() => setSrcOpen(v => !v)} className="w-full flex items-center justify-between gap-2 px-3 py-2 text-[11px] font-bold text-slate-600 text-start">
            <span>{sourceTitle}</span><span aria-hidden="true">{srcOpen ? '−' : '+'}</span>
          </button>
          {srcOpen && <p className="px-3 pb-3 text-[11px] text-muted-foreground leading-relaxed">{sourceNote}</p>}
        </div>
      </div>
    </section>
  );
}
