import { describe, it, expect } from 'vitest';
import { buildReport, reportToHtml, reportToText } from './localContentReport';
import { assessSupplierLocalContent, recommendLocalContentAction, PROGRAMS_BY_COUNTRY, COUNTRY_FRAMEWORKS, PROGRAMS } from './supplierLocalContentEligibility';
import { briefFor } from './localContentBriefs';

const base = (country: any, program: any, isAr: boolean, findings: any[] = []) => {
  const a = assessSupplierLocalContent(country, 'government', {} as never, program);
  return buildReport({ isAr, dateLabel: '24/10/2026', preparedFor: 'Rawabi Co. & <Sons>', countryName: COUNTRY_FRAMEWORKS[country as keyof typeof COUNTRY_FRAMEWORKS].countryNameEn, programName: PROGRAMS[program as keyof typeof PROGRAMS].programNameEn, contextLabel: 'Government', assessment: a, recommendation: recommendLocalContentAction(a, 60), hasResult: false, brief: briefFor(program), targetThresholdPct: 60, findings });
};
describe('personalised report', () => {
  it('every program in both languages builds a complete report with action plan, evidence and caveat', () => {
    for (const [country, progs] of Object.entries(PROGRAMS_BY_COUNTRY)) for (const p of progs) for (const isAr of [false, true]) {
      const r = base(country, p, isAr);
      const ids = r.sections.map(s => s.id);
      expect(ids, `${p} ${isAr}`).toContain('bottom-line'); expect(ids).toContain('results'); expect(ids).toContain('evidence');
      expect(ids, p).toContain('actions');
      expect(reportToText(r).length).toBeGreaterThan(300);
      if (isAr) expect(/[؀-ۿ]/.test(r.title + r.statusLabel)).toBe(true);
    }
  });
  it('includes the reader\'s own findings and target, and escapes HTML in names', () => {
    const r = base('SA', 'sa-contract-minimum', false, [{ key: 'k', title: { en: 'Calc', ar: 'حساب' }, lines: [{ en: 'Targeted 63%', ar: 'المستهدف 63٪' }] }]);
    const txt = reportToText(r);
    expect(txt).toContain('Targeted 63%'); expect(txt).toContain('60%');
    const html = reportToHtml(r, false);
    expect(html).toContain('Rawabi Co. &amp; &lt;Sons&gt;'); expect(html).not.toContain('<Sons>');
    expect(r.status).toBe('calculated');
  });
  it('RTL html carries dir=rtl and lang=ar', () => {
    const html = reportToHtml(base('SA', 'sa-mandatory-list', true), true);
    expect(html).toContain('dir="rtl"'); expect(html).toContain('lang="ar"');
  });
  it('not-listed country gets an honest to-do report, never an invented figure', () => {
    const r = buildReport({ isAr: false, dateLabel: 'x', preparedFor: '', countryName: 'Other', programName: '', contextLabel: '', assessment: null, recommendation: null, hasResult: false, brief: undefined, targetThresholdPct: null, findings: [], notListed: true });
    expect(r.status).toBe('no-program'); expect(reportToText(r)).toMatch(/not invent|no sourced/i);
  });
});
