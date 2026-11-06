/**
 * Round C #668 (RC-4/RC-6) — exact-behaviour pins for localContentReport (Module 08 final report),
 * written from Stryker survivors: status resolution order, section ids/titles, exact EN/AR strings, HTML/text output.
 * Arabic strings are pinned as they exist; they remain "reviewed, not certified" by a native reader.
 */
import { describe, it, expect } from 'vitest';
import { buildReport, reportToHtml, reportToText, type ReportInput } from './localContentReport';

const bi = (en: string, ar: string) => ({ en, ar });
const brief = {
  verdict: bi('Verdict EN', 'حكم'),
  headline: { value: bi('40%', '٤٠٪'), label: bi('Local content floor', 'الحد الأدنى') },
  next: [
    { when: 'after', text: bi('After step', 'خطوة بعد') },
    { when: 'before', text: bi('Before step', 'خطوة قبل') },
    { when: 'with-bid', text: bi('Bid step', 'خطوة العرض') },
  ],
  watch: [bi('Watch one', 'احذر ١'), bi('Watch two', 'احذر ٢')],
  confidence: 'single',
} as unknown as NonNullable<ReportInput['brief']>;
const assess = (over: Record<string, unknown> = {}) => ({
  applicability: 'applicable', reasonEn: 'Reason EN', reasonAr: 'سبب', certificationCaveatEn: 'Caveat EN', certificationCaveatAr: 'تحفظ',
  computation: { mechanismType: 'threshold' }, ...over,
}) as unknown as ReportInput['assessment'];
const reco = { primaryEn: 'P EN', primaryAr: 'أ', alternativeEn: 'A EN', alternativeAr: 'ب' } as unknown as ReportInput['recommendation'];
const base = (over: Partial<ReportInput> = {}): ReportInput => ({
  isAr: false, dateLabel: '3 Nov 2026', preparedFor: 'Rawabi', countryName: 'Saudi Arabia', programName: 'LCGPA', contextLabel: 'Government',
  assessment: null, recommendation: null, hasResult: false, brief: undefined, targetThresholdPct: null, findings: [], ...over,
});
const ids = (r: ReturnType<typeof buildReport>) => r.sections.map((s) => s.id);

describe('status resolution order', () => {
  it('not-listed beats everything', () => {
    expect(buildReport(base({ notListed: true, assessment: assess(), recommendation: reco })).status).toBe('no-program');
  });
  it('no assessment -> reference', () => {
    expect(buildReport(base()).status).toBe('reference');
  });
  it('non-applicable assessment -> not-applicable even with a recommendation', () => {
    expect(buildReport(base({ assessment: assess({ applicability: 'not-applicable' }), recommendation: reco })).status).toBe('not-applicable');
  });
  it('applicable + recommendation -> gap (before hasResult/findings)', () => {
    expect(buildReport(base({ assessment: assess(), recommendation: reco, hasResult: true })).status).toBe('gap');
  });
  it('applicable, no recommendation: hasResult OR findings -> calculated', () => {
    expect(buildReport(base({ assessment: assess(), hasResult: true })).status).toBe('calculated');
    expect(buildReport(base({ assessment: assess(), findings: [{ key: 'k', title: bi('T', 't'), lines: [bi('l', 'ل')] }] })).status).toBe('calculated');
  });
  it('nothing computed: dedicated-calculator -> reference, otherwise needs-inputs', () => {
    expect(buildReport(base({ assessment: assess({ computation: { mechanismType: 'dedicated-calculator' } }) })).status).toBe('reference');
    expect(buildReport(base({ assessment: assess() })).status).toBe('needs-inputs');
    expect(buildReport(base({ assessment: assess({ computation: undefined }) })).status).toBe('needs-inputs');
  });
  it('status labels are exact in EN and AR', () => {
    const en: Record<string, string> = {
      'no-program': 'No sourced program for this country', 'not-applicable': 'Not applicable to this buyer context',
      'needs-inputs': 'Applicable: figures still needed', gap: 'Gap to close', calculated: 'Calculated from your figures',
      reference: 'Applicable: use the calculators and checklist',
    };
    expect(buildReport(base({ notListed: true })).statusLabel).toBe(en['no-program']);
    expect(buildReport(base({ assessment: assess({ applicability: 'x' }) })).statusLabel).toBe(en['not-applicable']);
    expect(buildReport(base({ assessment: assess() })).statusLabel).toBe(en['needs-inputs']);
    expect(buildReport(base({ assessment: assess(), recommendation: reco })).statusLabel).toBe(en.gap);
    expect(buildReport(base({ assessment: assess(), hasResult: true })).statusLabel).toBe(en.calculated);
    expect(buildReport(base()).statusLabel).toBe(en.reference);
    expect(buildReport(base({ isAr: true, notListed: true })).statusLabel).toBe('لا يوجد برنامج موثّق لهذه الدولة');
    expect(buildReport(base({ isAr: true, assessment: assess({ applicability: 'x' }) })).statusLabel).toBe('لا ينطبق على سياق الجهة المشترية هذا');
    expect(buildReport(base({ isAr: true, assessment: assess() })).statusLabel).toBe('ينطبق: ما زالت الأرقام مطلوبة');
    expect(buildReport(base({ isAr: true, assessment: assess(), recommendation: reco })).statusLabel).toBe('فجوة يجب سدّها');
    expect(buildReport(base({ isAr: true, assessment: assess(), hasResult: true })).statusLabel).toBe('محسوب من أرقامك');
    expect(buildReport(base({ isAr: true })).statusLabel).toBe('ينطبق: استخدم الحاسبات وقائمة المهام');
  });
});

describe('not-listed country report', () => {
  it('has exactly three sections with the exact honest text, EN and AR', () => {
    const r = buildReport(base({ notListed: true, countryName: 'Elbonia' }));
    expect(ids(r)).toEqual(['bottom-line', 'actions', 'evidence']);
    expect(r.title).toBe('Local-content decision report');
    expect(r.subtitle).toBe('Elbonia');
    expect(r.sections[0].title).toBe('Bottom line');
    expect(r.sections[0].paragraphs).toEqual(["ISC has no sourced local-content program for this country, so it will not invent one. Treat any local-content figure as unverified until you have the tender's own clause."]);
    expect(r.sections[1].title).toBe('Action plan');
    expect(r.sections[1].groups!.map((g) => g.heading)).toEqual(['Before you bid', 'With the bid']);
    expect(r.sections[1].groups![0].items).toHaveLength(2);
    expect(r.sections[1].groups![1].items).toHaveLength(1);
    expect(r.sections[2].title).toBe('Evidence and limits');
    expect(r.sections[2].bullets).toEqual(['No ISC figure exists for this country. This page is a to-do list, not an assessment.']);
    expect(r.meta).toEqual([{ label: 'Prepared for', value: 'Rawabi' }, { label: 'Country', value: 'Elbonia' }, { label: 'Date', value: '3 Nov 2026' }]);
    expect(r.footer).toBe('Prepared with I Supply Chain, Local Content / ICV engine.');
    const a = buildReport(base({ notListed: true, isAr: true, preparedFor: '' }));
    expect(a.title).toBe('تقرير قرار المحتوى المحلي');
    expect(a.sections[0].title).toBe('الخلاصة');
    expect(a.sections[1].title).toBe('خطة العمل');
    expect(a.sections[1].groups!.map((g) => g.heading)).toEqual(['قبل تقديم العرض', 'مع العرض']);
    expect(a.sections[2].title).toBe('الأدلة والحدود');
    expect(a.sections[0].paragraphs![0].startsWith('لا يملك النظام برنامج محتوى محلي موثّقاً')).toBe(true);
    expect(a.meta[0]).toEqual({ label: 'أُعدّ لـ', value: 'منشأتك' });
    expect(a.meta[1].label).toBe('الدولة');
    expect(a.meta[2].label).toBe('التاريخ');
    expect(a.footer).toBe('أُعدّ بواسطة آي سبلاي تشين، محرك المحتوى المحلي / القيمة المحلية المضافة.');
    expect(buildReport(base({ notListed: true, preparedFor: '' })).meta[0].value).toBe('Your organisation');
  });
});

describe('full report sections', () => {
  const full = base({ assessment: assess(), recommendation: reco, brief, targetThresholdPct: 40, hasResult: true,
    findings: [{ key: 'f', title: bi('Finding T', 'عنوان'), lines: [bi('line one', 'سطر ١'), bi('line two', 'سطر ٢')] }] });
  it('section order and ids', () => {
    expect(ids(buildReport(full))).toEqual(['bottom-line', 'results', 'recommendation', 'actions', 'watch', 'evidence']);
  });
  it('bottom line: assessment reason + brief verdict + headline bullet (EN/AR)', () => {
    const r = buildReport(full);
    expect(r.sections[0].title).toBe('Bottom line');
    expect(r.sections[0].paragraphs).toEqual(['Reason EN', 'Verdict EN']);
    expect(r.sections[0].bullets).toEqual(['40%: Local content floor']);
    const ar = buildReport({ ...full, isAr: true });
    expect(ar.sections[0].paragraphs).toEqual(['سبب', 'حكم']);
    expect(ar.sections[0].bullets).toEqual(['٤٠٪: الحد الأدنى']);
  });
  it('bottom line without a brief has no bullets; calculator programs use the generic sentence', () => {
    expect(buildReport({ ...full, brief: undefined }).sections[0].bullets).toBeUndefined();
    const calc = buildReport({ ...full, assessment: assess({ computation: { mechanismType: 'dedicated-calculator' } }), brief: undefined });
    expect(calc.sections[0].paragraphs).toEqual(['This mechanism applies to your buyer context.']);
    const calcAr = buildReport({ ...full, isAr: true, assessment: assess({ computation: { mechanismType: 'dedicated-calculator' } }), brief: undefined });
    expect(calcAr.sections[0].paragraphs).toEqual(['تنطبق هذه الآلية على سياق الجهة المشترية لديك.']);
    const na = buildReport({ ...full, assessment: assess({ applicability: 'not-applicable', computation: { mechanismType: 'dedicated-calculator' } }), brief: undefined });
    expect(na.sections[0].paragraphs).toEqual([]);
  });
  it('results: target line, findings groups, and empty-state sentences', () => {
    const r = buildReport(full);
    expect(r.sections[1].title).toBe('Your figures and results');
    expect(r.sections[1].paragraphs).toEqual(['Target you set: 40%.']);
    expect(r.sections[1].groups).toEqual([{ heading: 'Finding T', items: ['line one', 'line two'] }]);
    expect(buildReport({ ...full, isAr: true }).sections[1].paragraphs).toEqual(['الهدف الذي حددته: 40٪.']);
    expect(buildReport({ ...full, isAr: true }).sections[1].groups).toEqual([{ heading: 'عنوان', items: ['سطر ١', 'سطر ٢'] }]);
    const zero = buildReport({ ...full, targetThresholdPct: 0, findings: [] });
    expect(zero.sections[1].paragraphs).toEqual(['Target you set: 0%.', 'The engine calculated a result from the figures entered above; see the result block on screen.']);
    const none = buildReport({ ...full, targetThresholdPct: null, findings: [], hasResult: false });
    expect(none.sections[1].paragraphs).toEqual(['No calculation has been run yet. Open the calculators above and enter your figures, then regenerate this report.']);
    expect(buildReport({ ...full, isAr: true, targetThresholdPct: null, findings: [], hasResult: false }).sections[1].paragraphs![0].startsWith('لم يُجرَ أي حساب بعد.')).toBe(true);
    expect(buildReport({ ...full, isAr: true, targetThresholdPct: null, findings: [] }).sections[1].paragraphs![0].startsWith('حسب النظام نتيجة')).toBe(true);
  });
  it('recommendation: primary then alternative, exact headings, EN/AR', () => {
    const r = buildReport(full);
    expect(r.sections[2].title).toBe('Recommendation');
    expect(r.sections[2].groups).toEqual([{ heading: 'Primary recommendation', items: ['P EN'] }, { heading: 'Strong alternative', items: ['A EN'] }]);
    const ar = buildReport({ ...full, isAr: true });
    expect(ar.sections[2].title).toBe('التوصية');
    expect(ar.sections[2].groups).toEqual([{ heading: 'التوصية الأساسية', items: ['أ'] }, { heading: 'البديل القوي', items: ['ب'] }]);
  });
  it('action plan groups in before / with-bid / after order, empty groups dropped', () => {
    const r = buildReport(full);
    expect(r.sections[3].title).toBe('Action plan');
    expect(r.sections[3].groups).toEqual([
      { heading: 'Before you bid', items: ['Before step'] }, { heading: 'With the bid', items: ['Bid step'] }, { heading: 'After award', items: ['After step'] },
    ]);
    expect(buildReport({ ...full, isAr: true }).sections[3].groups!.map((g) => g.heading)).toEqual(['قبل تقديم العرض', 'مع العرض', 'بعد الترسية']);
    const onlyAfter = buildReport({ ...full, brief: { ...brief, next: [brief.next[0]] } as typeof brief });
    expect(onlyAfter.sections.find((s) => s.id === 'actions')!.groups).toEqual([{ heading: 'After award', items: ['After step'] }]);
    const none = buildReport({ ...full, brief: { ...brief, next: [] } as typeof brief });
    expect(ids(none)).not.toContain('actions');
  });
  it('watch-outs: present only with items, exact titles', () => {
    const r = buildReport(full);
    expect(r.sections[4].title).toBe('Watch out for');
    expect(r.sections[4].bullets).toEqual(['Watch one', 'Watch two']);
    expect(buildReport({ ...full, isAr: true }).sections[4].title).toBe('احذر');
    expect(ids(buildReport({ ...full, brief: { ...brief, watch: [] } as typeof brief }))).not.toContain('watch');
    expect(ids(buildReport({ ...full, brief: undefined }))).not.toContain('watch');
  });
  it('evidence: confidence label, certification caveat (only when applicable), standing caveats', () => {
    const r = buildReport(full);
    const ev = r.sections[ids(r).indexOf('evidence')];
    expect(ev.title).toBe('Evidence and limits');
    expect(ev.bullets).toEqual([
      'Evidence level: Single source: verify before relying.',
      'Caveat EN',
      'This report restates the figures you entered and the sourced rules of this program. It is planning support, not legal advice and not an official determination.',
      'Re-run it whenever your figures, the buyer or the tender terms change.',
    ]);
    const ar = buildReport({ ...full, isAr: true });
    const evAr = ar.sections[ids(ar).indexOf('evidence')];
    expect(evAr.title).toBe('الأدلة والحدود');
    expect(evAr.bullets![0]).toBe('مستوى الأدلة: مصدر واحد: تحقق قبل الاعتماد.');
    expect(evAr.bullets![1]).toBe('تحفظ');
    expect(evAr.bullets!.length).toBe(4);
    const noBriefNa = buildReport({ ...full, brief: undefined, assessment: assess({ applicability: 'not-applicable' }) });
    expect(noBriefNa.sections[ids(noBriefNa).indexOf('evidence')].bullets).toHaveLength(2);
  });
  it('every confidence level has its exact EN label', () => {
    const lab: Record<string, string> = {
      official: 'Official source', corroborated: 'Corroborated by two sources', single: 'Single source: verify before relying',
      platform: 'ISC default, not a published rule', none: 'Nothing published: reference only',
    };
    for (const [k, v] of Object.entries(lab)) {
      const r = buildReport({ ...base({ assessment: assess(), brief: { ...brief, confidence: k } as typeof brief }) });
      expect(r.sections.find((s) => s.id === 'evidence')!.bullets![0]).toBe(`Evidence level: ${v}.`);
    }
    const arLab: Record<string, string> = {
      official: 'مصدر رسمي', corroborated: 'مؤيَّد بمصدرين', platform: 'افتراض من النظام وليس قاعدة منشورة', none: 'لا شيء منشور: للاطلاع فقط',
    };
    for (const [k, v] of Object.entries(arLab)) {
      const r = buildReport({ ...base({ isAr: true, assessment: assess(), brief: { ...brief, confidence: k } as typeof brief }) });
      expect(r.sections.find((s) => s.id === 'evidence')!.bullets![0]).toBe(`مستوى الأدلة: ${v}.`);
    }
  });
  it('title, subtitle, meta and footer', () => {
    const r = buildReport(full);
    expect(r.title).toBe('Local-content decision report');
    expect(r.subtitle).toBe('LCGPA · Saudi Arabia');
    expect(r.meta).toEqual([
      { label: 'Prepared for', value: 'Rawabi' }, { label: 'Country', value: 'Saudi Arabia' }, { label: 'Program', value: 'LCGPA' },
      { label: 'Buyer context', value: 'Government' }, { label: 'Date', value: '3 Nov 2026' },
    ]);
    const ar = buildReport({ ...full, isAr: true, preparedFor: '' });
    expect(ar.meta.map((m) => m.label)).toEqual(['أُعدّ لـ', 'الدولة', 'البرنامج', 'سياق الجهة المشترية', 'التاريخ']);
    expect(ar.meta[0].value).toBe('منشأتك');
    expect(ar.title).toBe('تقرير قرار المحتوى المحلي');
    expect(ar.footer).toBe('أُعدّ بواسطة آي سبلاي تشين، محرك المحتوى المحلي / القيمة المحلية المضافة.');
    expect(buildReport({ ...full, preparedFor: '' }).meta[0].value).toBe('Your organisation');
  });
});

describe('reportToHtml', () => {
  const r = buildReport(base({ assessment: assess(), recommendation: reco, brief, hasResult: true, preparedFor: 'A & B <Co>' }));
  it('escapes &, < and > everywhere and sets lang/dir', () => {
    const h = reportToHtml(r, false);
    expect(h).toContain('A &amp; B &lt;Co&gt;');
    expect(h).not.toContain('A & B <Co>');
    expect(h.startsWith('<!doctype html><html lang="en" dir="ltr">')).toBe(true);
    expect(h).toContain('direction:ltr');
    expect(h).toContain("font-family:Arial,Helvetica,sans-serif");
    const ar = reportToHtml(r, true);
    expect(ar.startsWith('<!doctype html><html lang="ar" dir="rtl">')).toBe(true);
    expect(ar).toContain('direction:rtl');
    expect(ar).toContain("font-family:'Segoe UI',Tahoma,Arial,sans-serif");
  });
  it('renders title, subtitle, status, meta table, sections and footer', () => {
    const h = reportToHtml(r, false);
    expect(h).toContain(`<title>${r.title}</title>`);
    expect(h).toContain(`<h1>${r.title}</h1><p class="sub">${r.subtitle}</p><div class="status">${r.statusLabel}</div>`);
    expect(h).toContain('<tr><td>Prepared for</td><td>A &amp; B &lt;Co&gt;</td></tr>');
    expect(h).toContain('<h2>Bottom line</h2>');
    expect(h).toContain('<p>Reason EN</p>');
    expect(h).toContain('<ul><li>40%: Local content floor</li></ul>');
    expect(h).toContain('<h3>Primary recommendation</h3><ul><li>P EN</li></ul>');
    expect(h).toContain(`<p class="foot">${r.footer}</p></body></html>`);
  });
  it('omits an empty bullet list', () => {
    const h = reportToHtml({ ...r, sections: [{ id: 'x', title: 'T', bullets: [] }] }, false);
    expect(h).toContain('<h2>T</h2>');
    expect(h).not.toContain('<ul></ul>');
    expect(h).not.toContain('<ul>');
  });
});

describe('reportToText', () => {
  it('exact layout: header, meta, upper-cased titles, dashed bullets and groups, footer', () => {
    const r = { title: 'Ti', subtitle: 'Su', statusLabel: 'St', meta: [{ label: 'L', value: 'V' }], status: 'gap', footer: 'Fo',
      sections: [{ id: 'a', title: 'Sec One', paragraphs: ['p1'], bullets: ['b1'], groups: [{ heading: 'G', items: ['i1', 'i2'] }] }, { id: 'b', title: 'Two' }] } as unknown as ReturnType<typeof buildReport>;
    expect(reportToText(r)).toBe(['Ti', 'Su', 'St', '', 'L: V', '', 'SEC ONE', 'p1', '- b1', 'G', '- i1', '- i2', '', 'TWO', '', 'Fo'].join('\n'));
  });
});
