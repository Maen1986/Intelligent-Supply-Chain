// Module 08 -- the personalised final report. Pure and bilingual: builds a structured report from the reader's own entry
// (country, program, buyer context), the engine's assessment, the program brief and every calculation the reader ran in the tools.
// HONESTY (Decision Record 8.7): the report only restates figures the reader entered or the engine computed from them, plus the
// brief's sourced guidance. It never adds a number of its own and always carries the "not certified" caveat and the confidence label.
import type { LocalContentAssessment, LocalContentRecommendation } from './supplierLocalContentEligibility';
import type { Bi, BriefTiming, ProgramBrief } from './localContentBriefTypes';

export interface ReportFinding { key: string; title: Bi; lines: Bi[] }

export interface ReportInput {
  isAr: boolean;
  dateLabel: string;
  preparedFor: string;
  countryName: string;
  programName: string;
  contextLabel: string;
  assessment: LocalContentAssessment | null;
  recommendation: LocalContentRecommendation | null;
  /** True when the engine has a real computed result for the entered figures (the page's hasMeaningfulResult). */
  hasResult: boolean;
  brief: ProgramBrief | undefined;
  targetThresholdPct: number | null;
  findings: ReportFinding[];
  /** Country not in the engine's sourced list ("Other / not listed"). */
  notListed?: boolean;
}

export type ReportStatus = 'not-applicable' | 'needs-inputs' | 'gap' | 'calculated' | 'reference' | 'no-program';
export interface ReportSection { id: string; title: string; paragraphs?: string[]; bullets?: string[]; groups?: { heading: string; items: string[] }[] }
export interface Report { title: string; subtitle: string; meta: { label: string; value: string }[]; status: ReportStatus; statusLabel: string; sections: ReportSection[]; footer: string }

const CONF: Record<string, Bi> = {
  official: { en: 'Official source', ar: 'مصدر رسمي' },
  corroborated: { en: 'Corroborated by two sources', ar: 'مؤيَّد بمصدرين' },
  single: { en: 'Single source: verify before relying', ar: 'مصدر واحد: تحقق قبل الاعتماد' },
  platform: { en: 'ISC default, not a published rule', ar: 'افتراض من النظام وليس قاعدة منشورة' },
  none: { en: 'Nothing published: reference only', ar: 'لا شيء منشور: للاطلاع فقط' },
};
const WHEN: Record<BriefTiming, Bi> = {
  before: { en: 'Before you bid', ar: 'قبل تقديم العرض' },
  'with-bid': { en: 'With the bid', ar: 'مع العرض' },
  after: { en: 'After award', ar: 'بعد الترسية' },
};
const STATUS: Record<ReportStatus, Bi> = {
  'no-program': { en: 'No sourced program for this country', ar: 'لا يوجد برنامج موثّق لهذه الدولة' },
  'not-applicable': { en: 'Not applicable to this buyer context', ar: 'لا ينطبق على سياق الجهة المشترية هذا' },
  'needs-inputs': { en: 'Applicable: figures still needed', ar: 'ينطبق: ما زالت الأرقام مطلوبة' },
  gap: { en: 'Gap to close', ar: 'فجوة يجب سدّها' },
  calculated: { en: 'Calculated from your figures', ar: 'محسوب من أرقامك' },
  reference: { en: 'Applicable: use the calculators and checklist', ar: 'ينطبق: استخدم الحاسبات وقائمة المهام' },
};

export function buildReport(i: ReportInput): Report {
  const t = (b: Bi) => (i.isAr ? b.ar : b.en);
  const L = (en: string, ar: string) => (i.isAr ? ar : en);
  const a = i.assessment;
  const calcProgram = a?.computation?.mechanismType === 'dedicated-calculator';
  let status: ReportStatus;
  if (i.notListed) status = 'no-program';
  else if (!a) status = 'reference';
  else if (a.applicability !== 'applicable') status = 'not-applicable';
  else if (i.recommendation) status = 'gap';
  else if (i.hasResult || i.findings.length > 0) status = 'calculated';
  else status = calcProgram ? 'reference' : 'needs-inputs';

  const sections: ReportSection[] = [];

  if (i.notListed) {
    sections.push({ id: 'bottom-line', title: L('Bottom line', 'الخلاصة'), paragraphs: [L('ISC has no sourced local-content program for this country, so it will not invent one. Treat any local-content figure as unverified until you have the tender\'s own clause.', 'لا يملك النظام برنامج محتوى محلي موثّقاً لهذه الدولة، ولذلك لن يختلق واحداً. اعتبر أي رقم للمحتوى المحلي غير موثّق حتى تحصل على بند المنافسة نفسه.')] });
    sections.push({ id: 'actions', title: L('Action plan', 'خطة العمل'), groups: [
      { heading: L('Before you bid', 'قبل تقديم العرض'), items: [L('Ask the buyer in writing whether the tender carries a local-content, local-preference or offset requirement, and for its exact clause and scoring weight.', 'اطلب كتابياً من الجهة المشترية هل تتضمن المنافسة اشتراط محتوى محلي أو أفضلية محلية أو مقابل اقتصادي، مع نص البند ووزنه في التقييم.'), L('Ask which authority certifies local content, and what evidence it accepts.', 'اسأل أي جهة تعتمد المحتوى المحلي وما الأدلة التي تقبلها.')] },
      { heading: L('With the bid', 'مع العرض'), items: [L('State your local spend, local workforce and local suppliers with supporting documents, even if no formula is published.', 'اذكر إنفاقك المحلي وقوتك العاملة المحلية وموردينك المحليين مع المستندات الداعمة حتى لو لم تُنشر صيغة.')] },
    ] });
    sections.push({ id: 'evidence', title: L('Evidence and limits', 'الأدلة والحدود'), bullets: [L('No ISC figure exists for this country. This page is a to-do list, not an assessment.', 'لا يوجد رقم من النظام لهذه الدولة. هذه الصفحة قائمة مهام وليست تقييماً.')] });
    return { title: L('Local-content decision report', 'تقرير قرار المحتوى المحلي'), subtitle: i.countryName,
      meta: [{ label: L('Prepared for', 'أُعدّ لـ'), value: i.preparedFor || L('Your organisation', 'منشأتك') }, { label: L('Country', 'الدولة'), value: i.countryName }, { label: L('Date', 'التاريخ'), value: i.dateLabel }],
      status, statusLabel: t(STATUS[status]), sections, footer: L('Prepared with I Supply Chain, Local Content / ICV engine.', 'أُعدّ بواسطة I Supply Chain، محرك المحتوى المحلي / القيمة المحلية المضافة.') };
  }

  // 1. Bottom line
  const bl: string[] = [];
  if (a && !calcProgram) bl.push(i.isAr ? a.reasonAr : a.reasonEn);
  else if (a && a.applicability === 'applicable') bl.push(L('This mechanism applies to your buyer context.', 'تنطبق هذه الآلية على سياق الجهة المشترية لديك.'));
  if (i.brief) { bl.push(t(i.brief.verdict)); }
  sections.push({ id: 'bottom-line', title: L('Bottom line', 'الخلاصة'), paragraphs: bl,
    bullets: i.brief ? [`${t(i.brief.headline.value)}: ${t(i.brief.headline.label)}`] : undefined });

  // 2. Your figures and results
  const res: ReportSection = { id: 'results', title: L('Your figures and results', 'أرقامك ونتائجك'), groups: [], paragraphs: [] };
  if (i.targetThresholdPct !== null) res.paragraphs!.push(L(`Target you set: ${i.targetThresholdPct}%.`, `الهدف الذي حددته: ${i.targetThresholdPct}٪.`));
  for (const f of i.findings) res.groups!.push({ heading: t(f.title), items: f.lines.map(t) });
  if (!i.findings.length) res.paragraphs!.push(i.hasResult
    ? L('The engine calculated a result from the figures entered above; see the result block on screen.', 'حسب النظام نتيجة من الأرقام المدخلة أعلاه؛ انظر كتلة النتيجة على الشاشة.')
    : L('No calculation has been run yet. Open the calculators above and enter your figures, then regenerate this report.', 'لم يُجرَ أي حساب بعد. افتح الحاسبات أعلاه وأدخل أرقامك ثم أعد إنشاء هذا التقرير.'));
  sections.push(res);

  // 3. Recommendation
  if (i.recommendation) {
    sections.push({ id: 'recommendation', title: L('Recommendation', 'التوصية'), groups: [
      { heading: L('Primary recommendation', 'التوصية الأساسية'), items: [i.isAr ? i.recommendation.primaryAr : i.recommendation.primaryEn] },
      { heading: L('Strong alternative', 'البديل القوي'), items: [i.isAr ? i.recommendation.alternativeAr : i.recommendation.alternativeEn] },
    ] });
  }

  // 4. Action plan
  if (i.brief) {
    const groups = (['before', 'with-bid', 'after'] as BriefTiming[]).map(w => ({ heading: t(WHEN[w]), items: i.brief!.next.filter(n => n.when === w).map(n => t(n.text)) })).filter(g => g.items.length);
    if (groups.length) sections.push({ id: 'actions', title: L('Action plan', 'خطة العمل'), groups });
  }

  // 5. Watch-outs
  if (i.brief?.watch.length) sections.push({ id: 'watch', title: L('Watch out for', 'احذر'), bullets: i.brief.watch.map(t) });

  // 6. Evidence, confidence, limits
  const ev: string[] = [];
  if (i.brief) ev.push(L(`Evidence level: ${t(CONF[i.brief.confidence])}.`, `مستوى الأدلة: ${t(CONF[i.brief.confidence])}.`));
  if (a && a.applicability === 'applicable') ev.push(i.isAr ? a.certificationCaveatAr : a.certificationCaveatEn);
  ev.push(L('This report restates the figures you entered and the sourced rules of this program. It is planning support, not legal advice and not an official determination.', 'يعيد هذا التقرير صياغة الأرقام التي أدخلتها والقواعد الموثّقة لهذا البرنامج. وهو دعم للتخطيط وليس مشورة قانونية ولا قراراً رسمياً.'));
  ev.push(L('Re-run it whenever your figures, the buyer or the tender terms change.', 'أعد تشغيله كلما تغيّرت أرقامك أو الجهة المشترية أو شروط المنافسة.'));
  sections.push({ id: 'evidence', title: L('Evidence and limits', 'الأدلة والحدود'), bullets: ev });

  return {
    title: L('Local-content decision report', 'تقرير قرار المحتوى المحلي'),
    subtitle: `${i.programName} · ${i.countryName}`,
    meta: [
      { label: L('Prepared for', 'أُعدّ لـ'), value: i.preparedFor || L('Your organisation', 'منشأتك') },
      { label: L('Country', 'الدولة'), value: i.countryName },
      { label: L('Program', 'البرنامج'), value: i.programName },
      { label: L('Buyer context', 'سياق الجهة المشترية'), value: i.contextLabel },
      { label: L('Date', 'التاريخ'), value: i.dateLabel },
    ],
    status, statusLabel: t(STATUS[status]), sections,
    footer: L('Prepared with I Supply Chain, Local Content / ICV engine.', 'أُعدّ بواسطة I Supply Chain، محرك المحتوى المحلي / القيمة المحلية المضافة.'),
  };
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Self-contained HTML (A4, RTL-aware). Used for the print/PDF frame and the Word download. */
export function reportToHtml(r: Report, isAr: boolean): string {
  const dir = isAr ? 'rtl' : 'ltr';
  const body = r.sections.map(s => `
    <h2>${esc(s.title)}</h2>
    ${(s.paragraphs ?? []).map(p => `<p>${esc(p)}</p>`).join('')}
    ${s.bullets?.length ? `<ul>${s.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
    ${(s.groups ?? []).map(g => `<h3>${esc(g.heading)}</h3><ul>${g.items.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`).join('')}`).join('');
  return `<!doctype html><html lang="${isAr ? 'ar' : 'en'}" dir="${dir}"><head><meta charset="utf-8"><title>${esc(r.title)}</title>
<style>
@page{size:A4;margin:18mm}
body{font-family:${isAr ? "'Segoe UI',Tahoma,Arial" : "Arial,Helvetica"},sans-serif;color:#0f172a;font-size:11pt;line-height:1.55;direction:${dir};text-align:start}
h1{color:#082C6B;font-size:20pt;margin:0 0 2pt} .sub{color:#475569;margin:0 0 10pt}
.status{display:inline-block;border:1px solid #082C6B;color:#082C6B;border-radius:12px;padding:2pt 10pt;font-weight:bold;margin:4pt 0 10pt}
table{border-collapse:collapse;width:100%;margin-bottom:8pt} td{border:1px solid #e2e8f0;padding:4pt 8pt;font-size:10pt} td:first-child{background:#f1f5f9;font-weight:bold;width:30%}
h2{color:#082C6B;font-size:13pt;border-bottom:1px solid #cbd5e1;padding-bottom:2pt;margin:14pt 0 6pt} h3{font-size:11pt;margin:8pt 0 2pt}
ul{margin:2pt 0 6pt;padding-inline-start:18pt} li{margin:2pt 0} .foot{margin-top:18pt;color:#64748b;font-size:9pt;border-top:1px solid #e2e8f0;padding-top:6pt}
</style></head><body>
<h1>${esc(r.title)}</h1><p class="sub">${esc(r.subtitle)}</p><div class="status">${esc(r.statusLabel)}</div>
<table>${r.meta.map(m => `<tr><td>${esc(m.label)}</td><td>${esc(m.value)}</td></tr>`).join('')}</table>
${body}<p class="foot">${esc(r.footer)}</p></body></html>`;
}

export function reportToText(r: Report): string {
  const out = [r.title, r.subtitle, r.statusLabel, '', ...r.meta.map(m => `${m.label}: ${m.value}`)];
  for (const s of r.sections) {
    out.push('', s.title.toUpperCase(), ...(s.paragraphs ?? []), ...(s.bullets ?? []).map(b => `- ${b}`));
    for (const g of s.groups ?? []) out.push(g.heading, ...g.items.map(x => `- ${x}`));
  }
  out.push('', r.footer);
  return out.join('\n');
}
