// Saudi end-to-end local-content journey: tender discovery to final report. Each stage names the ISC tool that serves it
// and jumps to that program. Timings are those in LCGPA's official forms/reports supplied by the platform owner (24 Oct 2026).
import React from 'react';
import type { LocalContentProgram } from '@/lib/supplierLocalContentEligibility';

interface Stage { id: string; en: string; ar: string; detailEn: string; detailAr: string; program?: LocalContentProgram; toolEn?: string; toolAr?: string }
const STAGES: Stage[] = [
  { id: 'scope', en: '1. Classify the tender', ar: '١. صنّف المنافسة', detailEn: 'Contract type and value decide which LCGPA mechanisms apply.', detailAr: 'نوع العقد وقيمته يحددان آليات الهيئة المنطبقة.', program: 'sa-lcgpa-general', toolEn: 'Mechanism finder', toolAr: 'محدد الآليات' },
  { id: 'list', en: '2. Check the Mandatory List', ar: '٢. افحص القائمة الإلزامية', detailEn: 'Look up each product; note ceiling, certificate and start date. Exemptions are the buyer\'s request (10 working days).', detailAr: 'ابحث عن كل منتج ودوّن السقف والشهادة وتاريخ البدء. والاستثناء بطلب من الجهة (١٠ أيام عمل).', program: 'sa-mandatory-list', toolEn: 'Product lookup', toolAr: 'البحث عن المنتج' },
  { id: 'study', en: '3. Study the cost of local content', ar: '٣. ادرس كلفة المحتوى المحلي', detailEn: 'Several items per contract, each with main and sub-sector.', detailAr: 'عدة بنود في العقد، لكل منها قطاع رئيس وفرعي.', program: 'sa-contract-minimum', toolEn: 'Contract-minimum study', toolAr: 'دراسة الحد الأدنى' },
  { id: 'sme', en: '4. Check SME eligibility', ar: '٤. تحقق من أهلية المنشآت الصغيرة والمتوسطة', detailEn: 'Non-supply contracts below SAR 25 million only.', detailAr: 'عقود غير التوريد التي تقل عن ٢٥ مليون ريال فقط.', program: 'sa-sme-preference', toolEn: 'SME check', toolAr: 'فحص الأهلية' },
  { id: 'bid', en: '5. Build the bid', ar: '٥. أعدّ العرض', detailEn: 'Adjusted bid under the price preference, and the targeted local-content form for high-value contracts.', detailAr: 'العرض المعدَّل وفق تفضيل السعر، ونموذج المحتوى المحلي المستهدف للعقود عالية القيمة.', program: 'sa-price-preference', toolEn: 'Adjusted-bid calculator', toolAr: 'حاسبة العرض المعدَّل' },
  { id: 'eval', en: '6. Evaluation', ar: '٦. التقييم', detailEn: 'After technical qualification: 60% price, 40% local content.', detailAr: 'بعد التأهل الفني: ٦٠٪ للسعر و٤٠٪ للمحتوى المحلي.', program: 'sa-financial-evaluation-weight', toolEn: '60/40 illustration', toolAr: 'توضيح ٦٠/٤٠' },
  { id: 'award', en: '7. After award', ar: '٧. بعد الترسية', detailEn: 'Phased plan within 60 days of award.', detailAr: 'خطة تدرجية خلال ٦٠ يوماً من الترسية.' },
  { id: 'deliver', en: '8. During delivery', ar: '٨. أثناء التنفيذ', detailEn: 'Periodic reports (none in the first six months or on contracts under a year). Price-preference report within 30 days of contract end; buyer reviews in 10 days.', detailAr: 'تقارير دورية (لا تُطلب في الأشهر الستة الأولى ولا في العقود دون سنة). وتقرير تفضيل السعر خلال ٣٠ يوماً من نهاية العقد؛ وتراجعه الجهة خلال ١٠ أيام.' },
  { id: 'close', en: '9. Close-out', ar: '٩. الإقفال', detailEn: 'Audited final report within seven months; it releases the final guarantee. Shortfalls carry fines.', detailAr: 'تقرير نهائي مدقَّق خلال سبعة أشهر؛ وبه يُفرج عن الضمان النهائي. والنقص يترتب عليه غرامات.' },
];

export function SaudiJourney({ isAr, current, onSelect }: { isAr: boolean; current: LocalContentProgram; onSelect: (p: LocalContentProgram) => void }) {
  return (
    <nav dir={isAr ? 'rtl' : 'ltr'} aria-label={isAr ? 'رحلة المحتوى المحلي من المنافسة إلى الإقفال' : 'Local-content journey from tender to close-out'} className="rounded-2xl border border-slate-200 bg-white mb-3 p-4 text-start">
      <h4 className="text-xs font-bold text-slate-800 mb-3">{isAr ? 'الرحلة الكاملة في السعودية: من المنافسة إلى الإقفال' : 'The full Saudi journey: tender to close-out'}</h4>
      <ol className="space-y-2">
        {STAGES.map(s => {
          const active = s.program === current;
          return (
            <li key={s.id} className={`rounded-lg border p-2 ${active ? 'border-[#082C6B] bg-[#082C6B]/5' : 'border-slate-100'}`} aria-current={active ? 'step' : undefined}>
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <p className="text-xs font-semibold text-slate-800">{isAr ? s.ar : s.en}</p>
                {s.program && (
                  <button type="button" onClick={() => onSelect(s.program!)} disabled={active} className="text-[11px] font-semibold text-[#082C6B] underline disabled:no-underline disabled:text-slate-400">
                    {active ? (isAr ? 'أنت هنا' : 'You are here') : (isAr ? s.toolAr : s.toolEn)}
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">{isAr ? s.detailAr : s.detailEn}</p>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
