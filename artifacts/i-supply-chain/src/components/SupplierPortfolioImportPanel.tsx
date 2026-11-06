/**
 * SI Module 07 -- CSV import panel (Round B1). Two files (scores, corrective
 * actions), a downloadable template for each, a plain report of what was
 * accepted/rejected/warned, and an explicit "Apply" step so nothing changes
 * until the user has read the report.
 */
import { useState } from 'react';
import { Upload, Download } from 'lucide-react';
import {
  parseScoresCsv, parseCarsCsv, mergeImport, SCORES_TEMPLATE_CSV, CARS_TEMPLATE_CSV,
  type ScoreImportResult, type CarImportResult, type MergeSummary,
} from '@/lib/supplierPortfolioImport';
import type { SupplierRecord } from '@/lib/supplierRecoveryPortfolio';

function download(name: string, text: string) {
  const blob = new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export function SupplierPortfolioImportPanel({
  isAr, existing, onApply,
}: {
  isAr: boolean;
  existing: SupplierRecord[];
  onApply: (merged: SupplierRecord[]) => void;
}) {
  const [scores, setScores] = useState<ScoreImportResult | null>(null);
  const [cars, setCars] = useState<CarImportResult | null>(null);
  const [applied, setApplied] = useState<MergeSummary | null>(null);

  const T = {
    title: isAr ? 'استيراد من ملف CSV' : 'Import from CSV',
    intro: isAr
      ? 'بدلاً من إدخال كل مورد يدوياً: ارفع ملف الدرجات الدورية، وملف طلبات الإجراء التصحيحي (اختياري). لن يتغير شيء قبل أن تراجع التقرير وتضغط "تطبيق".'
      : 'Instead of typing every supplier by hand: upload a scores file and, optionally, a corrective-actions file. Nothing changes until you read the report and press Apply.',
    scoresFile: isAr ? 'ملف الدرجات' : 'Scores file',
    carsFile: isAr ? 'ملف طلبات الإجراء التصحيحي (اختياري)' : 'Corrective-actions file (optional)',
    template: isAr ? 'تنزيل القالب' : 'Download template',
    policy: isAr
      ? 'عند التطبيق: ملف الدرجات هو المرجع لسلسلة درجات كل مورد يرد فيه؛ الموردون غير الواردين لا يتغيرون؛ تُطابق الطلبات حسب اسم المورد + معرّف الطلب (الجديد يُضاف والمطابق يُحدَّث)؛ طلب لمورد غير موجود يُعرض ولا يُنشأ له مورد تلقائياً.'
      : 'When applied: the scores file is the source of truth for each supplier it lists; suppliers not in the file are untouched; CARs match on supplier name + car_id (new are added, same id updated); a CAR for an unknown supplier is reported, never auto-created.',
    accepted: isAr ? 'صفوف مقبولة' : 'rows accepted',
    rejected: isAr ? 'صفوف مرفوضة' : 'rows rejected',
    warnings: isAr ? 'تنبيهات' : 'warnings',
    line: isAr ? 'سطر' : 'line',
    apply: isAr ? 'تطبيق الاستيراد' : 'Apply import',
    done: (s: MergeSummary) => isAr
      ? `تم: ${s.suppliersAdded} مورد جديد، ${s.suppliersUpdated} محدَّث، ${s.carsAdded} طلب جديد، ${s.carsUpdated} محدَّث${s.carsUnmatched.length ? `، ${s.carsUnmatched.length} طلب لمورد غير موجود (لم يُستورد): ${s.carsUnmatched.join('، ')}` : ''}.`
      : `Done: ${s.suppliersAdded} supplier(s) added, ${s.suppliersUpdated} updated, ${s.carsAdded} CAR(s) added, ${s.carsUpdated} updated${s.carsUnmatched.length ? `; ${s.carsUnmatched.length} CAR(s) for unknown suppliers were NOT imported: ${s.carsUnmatched.join(', ')}` : ''}.`,
  };

  async function readFile(f: File | undefined, kind: 'scores' | 'cars') {
    setApplied(null);
    if (!f) { if (kind === 'scores') setScores(null); else setCars(null); return; }
    const text = await f.text();
    if (kind === 'scores') setScores(parseScoresCsv(text)); else setCars(parseCarsCsv(text));
  }

  function Report({ r, name }: { r: ScoreImportResult['report']; name: string }) {
    return (
      <div className="text-[11px] mt-2 rounded-lg border border-slate-200 p-2 bg-slate-50" role="status">
        <p className="font-semibold text-slate-700">{name}</p>
        {r.fatalEn ? (
          <p className="text-red-700 mt-1">{isAr ? r.fatalAr : r.fatalEn}</p>
        ) : (
          <>
            <p className="text-slate-700 mt-1">
              <span className="text-emerald-700 font-semibold">{r.rowsAccepted}</span> {T.accepted} ·{' '}
              <span className={r.rejected.length ? 'text-red-700 font-semibold' : 'text-slate-500'}>{r.rejected.length}</span> {T.rejected} ·{' '}
              <span className={r.warnings.length ? 'text-amber-700 font-semibold' : 'text-slate-500'}>{r.warnings.length}</span> {T.warnings}
            </p>
            {r.rejected.slice(0, 20).map((x, i) => (
              <p key={`r${i}`} className="text-red-700 mt-0.5">{T.line} {x.line}: {isAr ? x.reasonAr : x.reasonEn}</p>
            ))}
            {r.warnings.slice(0, 20).map((x, i) => (
              <p key={`w${i}`} className="text-amber-700 mt-0.5">{x.line ? `${T.line} ${x.line}: ` : ''}{isAr ? x.reasonAr : x.reasonEn}</p>
            ))}
          </>
        )}
      </div>
    );
  }

  const canApply = (!!scores && !scores.report.fatalEn && scores.suppliers.length > 0) || (!!cars && !cars.report.fatalEn && cars.cars.length > 0);

  function apply() {
    const { merged, summary } = mergeImport(existing, scores && !scores.report.fatalEn ? scores.suppliers : [], cars && !cars.report.fatalEn ? cars.cars : []);
    onApply(merged);
    setApplied(summary);
    setScores(null); setCars(null);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
      <h2 className="text-sm font-bold text-slate-800 mb-1">{T.title}</h2>
      <p className="text-xs text-slate-600 mb-3">{T.intro}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {([['scores', T.scoresFile, SCORES_TEMPLATE_CSV, 'isc-m07-scores-template.csv'], ['cars', T.carsFile, CARS_TEMPLATE_CSV, 'isc-m07-cars-template.csv']] as const).map(([kind, label, tpl, fname]) => (
          <div key={kind}>
            <label htmlFor={`m07-import-${kind}`} className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">{label}</label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                id={`m07-import-${kind}`} type="file" accept=".csv,text/csv"
                onChange={(e) => { void readFile(e.target.files?.[0], kind); e.target.value = ''; }}
                className="text-xs max-w-full"
              />
              <button type="button" onClick={() => download(fname, tpl)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1">
                <Download className="w-3 h-3" aria-hidden="true" />{T.template}
              </button>
            </div>
            {kind === 'scores' && scores && <Report r={scores.report} name={label} />}
            {kind === 'cars' && cars && <Report r={cars.report} name={label} />}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-slate-500 mt-3">{T.policy}</p>
      <div className="mt-3 flex items-center gap-3">
        <button type="button" disabled={!canApply} onClick={apply} className="text-xs font-semibold px-4 py-2 rounded-lg bg-[#082C6B] text-white hover:bg-[#0a3a8c] disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5">
          <Upload className="w-3.5 h-3.5" aria-hidden="true" />{T.apply}
        </button>
        {applied && <span className="text-[11px] text-emerald-700" role="status">{T.done(applied)}</span>}
      </div>
    </div>
  );
}
