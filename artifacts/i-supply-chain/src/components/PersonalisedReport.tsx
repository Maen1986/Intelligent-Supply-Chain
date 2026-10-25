// Final step of every country flow: the reader's own personalised report (results, actions, recommendation), on screen,
// printable as PDF, downloadable for Word, copyable. Built by lib/localContentReport from the reader's actual entries and calculations.
import React, { useMemo, useState } from 'react';
import { buildReport, reportToHtml, reportToText, type ReportInput } from '@/lib/localContentReport';
import { useReportFindings } from './ReportFindings';

export function PersonalisedReport(props: Omit<ReportInput, 'findings'>) {
  const findings = useReportFindings();
  const { isAr } = props;
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const report = useMemo(() => buildReport({ ...props, findings }), [props, findings]);
  const fileBase = `ISC-local-content-report-${(props.preparedFor || props.countryName).replace(/[^\p{L}\p{N}]+/gu, '-').slice(0, 40)}`;

  const print = () => {
    const f = document.createElement('iframe');
    f.setAttribute('aria-hidden', 'true');
    f.style.cssText = 'position:fixed;inset-inline-end:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(f);
    const doc = f.contentDocument;
    if (!doc) { f.remove(); return; }
    doc.open(); doc.write(reportToHtml(report, isAr)); doc.close();
    setTimeout(() => { f.contentWindow?.focus(); f.contentWindow?.print(); setTimeout(() => f.remove(), 1500); }, 250);
  };
  const word = () => {
    const blob = new Blob(['﻿', reportToHtml(report, isAr)], { type: 'application/msword' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `${fileBase}.doc`; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(reportToText(report)); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard unavailable */ }
  };
  const tone = report.status === 'gap' ? 'bg-amber-50 border-amber-300 text-amber-900'
    : report.status === 'calculated' ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
    : report.status === 'not-applicable' ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-sky-50 border-sky-300 text-sky-900';

  return (
    <section dir={isAr ? 'rtl' : 'ltr'} lang={isAr ? 'ar' : 'en'} aria-label={isAr ? 'تقريرك الشخصي' : 'Your personalised report'} className="no-print rounded-2xl border-2 border-[#082C6B] bg-white overflow-hidden text-start mt-4">
      <div className="bg-[#082C6B] text-white px-4 py-3 flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{isAr ? 'الخطوة الأخيرة' : 'Final step'}</p>
          <h3 className="text-base font-extrabold">{report.title}</h3>
          <p className="text-xs opacity-90">{report.subtitle}</p>
        </div>
        <button type="button" aria-expanded={open} onClick={() => setOpen(v => !v)} className="text-[11px] font-semibold border border-white/40 rounded-lg px-2.5 py-1">{open ? (isAr ? 'إخفاء التقرير' : 'Hide report') : (isAr ? 'أنشئ تقريري' : 'Generate my report')}</button>
      </div>
      {open && (
        <div className="p-4 space-y-3">
          <p className={`inline-block text-xs font-bold border rounded-full px-3 py-1 ${tone}`}>{report.statusLabel}</p>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
            {report.meta.map(m => (<React.Fragment key={m.label}><dt className="text-slate-500">{m.label}</dt><dd className="font-semibold text-slate-800"><bdi>{m.value}</bdi></dd></React.Fragment>))}
          </dl>
          {report.sections.map(s => (
            <div key={s.id}>
              <h4 className="text-xs font-bold text-[#082C6B] border-b border-slate-200 pb-1 mb-1.5">{s.title}</h4>
              {s.paragraphs?.map((p, i) => <p key={i} className="text-xs text-slate-700 leading-relaxed mb-1">{p}</p>)}
              {s.bullets && <ul className="list-disc ps-4 space-y-1">{s.bullets.map((b, i) => <li key={i} className="text-xs text-slate-700 leading-relaxed">{b}</li>)}</ul>}
              {s.groups?.map(g => (
                <div key={g.heading} className="mt-1.5">
                  <p className="text-[11px] font-semibold text-slate-800">{g.heading}</p>
                  <ul className="list-disc ps-4 space-y-1">{g.items.map((x, i) => <li key={i} className="text-xs text-slate-700 leading-relaxed">{x}</li>)}</ul>
                </div>
              ))}
            </div>
          ))}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={print} className="text-xs font-bold bg-[#082C6B] text-white rounded-lg px-3 py-2">{isAr ? 'طباعة / حفظ PDF' : 'Print / save as PDF'}</button>
            <button type="button" onClick={word} className="text-xs font-bold border border-[#082C6B] text-[#082C6B] rounded-lg px-3 py-2">{isAr ? 'تنزيل ملف Word' : 'Download for Word'}</button>
            <button type="button" onClick={copy} className="text-xs font-bold border border-slate-300 text-slate-700 rounded-lg px-3 py-2">{copied ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ النص' : 'Copy text')}</button>
          </div>
        </div>
      )}
    </section>
  );
}
