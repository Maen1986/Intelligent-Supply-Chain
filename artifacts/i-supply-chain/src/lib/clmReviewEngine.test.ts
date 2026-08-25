import { describe, it, expect } from 'vitest';
import { buildReviewReport, ASSURANCE_META, type ReviewReportInput } from './clmReviewEngine';

describe('ASSURANCE_META', () => {
  it('defines all three tiers with bilingual label + description', () => {
    for (const tier of ['reference-verified', 'self-declared-consistent', 'needs-counsel'] as const) {
      const meta = ASSURANCE_META[tier];
      expect(meta.labelEn.length).toBeGreaterThan(0);
      expect(meta.labelAr.length).toBeGreaterThan(0);
      expect(meta.descEn.length).toBeGreaterThan(0);
      expect(meta.descAr.length).toBeGreaterThan(0);
    }
  });
});

describe('buildReviewReport -- empty input', () => {
  it('returns 4 dimensions, all not-yet-assessed, and zero findings', () => {
    const report = buildReviewReport({});
    expect(report.dimensions).toHaveLength(4);
    expect(report.dimensions.map(d => d.dimension)).toEqual(['legal', 'clause', 'pricing', 'industry']);
    for (const d of report.dimensions) {
      expect(d.status).toBe('not-yet-assessed');
    }
    expect(report.findings).toHaveLength(0);
  });
});

describe('buildReviewReport -- dimension states never collapse into one score', () => {
  it('reports 4 independent dimension states, not a single composite', () => {
    const input: ReviewReportInput = {
      governingLawClause: 'saudi-ctl',
      counterpartyJurisdiction: 'Saudi Arabia',
      performanceLocation: 'Riyadh, Saudi Arabia',
      pricingPrimary: 'ffp',
      scopeDefiniteness: 'well-defined',
      clausesPresent: { 'commercial-payment': ['late-payment-interest-penalty'] },
    };
    const report = buildReviewReport(input);
    // 4 dimensions each carry an independent status -- structurally cannot
    // be flattened to one number (Principle #7 hard constraint).
    expect(report.dimensions).toHaveLength(4);
    const statuses = new Set(report.dimensions.map(d => d.status));
    expect(statuses.size).toBeGreaterThanOrEqual(1);
  });
});

describe('buildReviewReport -- legal governing-law mismatch finding', () => {
  it('flags a mismatch and attaches self-declared-consistent + needs-counsel tiers, no options', () => {
    const report = buildReviewReport({
      governingLawClause: 'saudi-ctl',
      counterpartyJurisdiction: 'United Kingdom',
      performanceLocation: 'London, United Kingdom',
    });
    const finding = report.findings.find(f => f.id === 'legal-governing-law-mismatch');
    expect(finding).toBeDefined();
    expect(finding!.dimension).toBe('legal');
    expect(finding!.assuranceTiers).toEqual(['self-declared-consistent', 'needs-counsel']);
    expect(finding!.causalChain.length).toBe(6);
    expect(finding!.considerAlsoEn.length).toBeGreaterThan(0);
    expect(finding!.considerAlsoAr.length).toBeGreaterThan(0);
    expect(finding!.options).toBeUndefined();
  });

  it('does not flag when jurisdiction and governing law are consistent', () => {
    const report = buildReviewReport({
      governingLawClause: 'saudi-ctl',
      counterpartyJurisdiction: 'Saudi Arabia',
      performanceLocation: 'Riyadh, Saudi Arabia',
    });
    expect(report.findings.find(f => f.id === 'legal-governing-law-mismatch')).toBeUndefined();
  });
});

describe('buildReviewReport -- pricing misuse finding', () => {
  it('flags FFP against evolving scope, no options', () => {
    const report = buildReviewReport({
      pricingPrimary: 'ffp',
      scopeDefiniteness: 'evolving',
    });
    const finding = report.findings.find(f => f.id === 'pricing-structure-scope-mismatch');
    expect(finding).toBeDefined();
    expect(finding!.dimension).toBe('pricing');
    expect(finding!.options).toBeUndefined();
    expect(finding!.causalChain.length).toBe(6);
  });
});

describe('buildReviewReport -- clause findings carry real options only where a sourced variant list exists', () => {
  const saudiTouchingBase: ReviewReportInput = {
    governingLawClause: 'saudi-ctl',
    counterpartyJurisdiction: 'Saudi Arabia',
    performanceLocation: 'Riyadh, Saudi Arabia',
  };

  it('riba/LD flag carries the real liquidated-damages variant list', () => {
    const report = buildReviewReport({
      ...saudiTouchingBase,
      clausesPresent: { 'commercial-payment': ['late-payment-interest-penalty'] },
    });
    const finding = report.findings.find(f => f.id === 'clause-commercial-riba');
    expect(finding).toBeDefined();
    expect(finding!.options).toBeDefined();
    expect(finding!.options!.length).toBeGreaterThan(0);
    for (const opt of finding!.options!) {
      expect(opt.labelEn.length).toBeGreaterThan(0);
      expect(opt.labelAr.length).toBeGreaterThan(0);
    }
  });

  it('performance-measurability flag carries no options (no sourced variant list)', () => {
    const report = buildReviewReport({
      clausesPresent: { 'performance-service': ['scope-of-work'] },
    });
    const finding = report.findings.find(f => f.id === 'clause-performance-measurability');
    expect(finding).toBeDefined();
    expect(finding!.options).toBeUndefined();
  });

  it('FIDIC design-risk mismatch flag carries no options (no sourced variant list)', () => {
    const report = buildReviewReport({
      fidicBook: 'red',
      clausesPresent: {},
    });
    const finding = report.findings.find(f => f.id === 'clause-risk-fidic-mismatch');
    expect(finding).toBeDefined();
    expect(finding!.options).toBeUndefined();
  });

  it('foreground-IP-gap flag carries the real IP-ownership variant list', () => {
    const report = buildReviewReport({
      clausesPresent: { 'data-ip-confidentiality': ['ip-ownership-background'] },
    });
    const finding = report.findings.find(f => f.id === 'clause-foreground-ip-gap');
    expect(finding).toBeDefined();
    expect(finding!.options).toBeDefined();
    expect(finding!.options!.length).toBeGreaterThan(0);
  });

  it('governance-riba-arbitration flag carries the real dispute-resolution variant list', () => {
    const report = buildReviewReport({
      ...saudiTouchingBase,
      clausesPresent: {
        'legal-governance': ['dispute-resolution'],
        'commercial-payment': ['late-payment-interest-penalty'],
      },
    });
    const finding = report.findings.find(f => f.id === 'clause-governance-riba-arbitration');
    expect(finding).toBeDefined();
    expect(finding!.options).toBeDefined();
    expect(finding!.options!.length).toBeGreaterThan(0);
  });
});

describe('buildReviewReport -- every finding is fully bilingual with a 6-step causal chain', () => {
  it('checks all findings across a saturated input', () => {
    const report = buildReviewReport({
      governingLawClause: 'saudi-ctl',
      counterpartyJurisdiction: 'United Kingdom',
      performanceLocation: 'London, United Kingdom',
      pricingPrimary: 'ffp',
      scopeDefiniteness: 'evolving',
      fidicBook: 'red',
      industryBucket: 'construction',
      clausesPresent: {
        'commercial-payment': ['late-payment-interest-penalty'],
        'performance-service': ['scope-of-work'],
        'data-ip-confidentiality': ['ip-ownership-background'],
        'legal-governance': ['dispute-resolution'],
      },
    });
    expect(report.findings.length).toBeGreaterThanOrEqual(6);
    for (const f of report.findings) {
      expect(f.titleEn.length).toBeGreaterThan(0);
      expect(f.titleAr.length).toBeGreaterThan(0);
      expect(f.sourceEn.length).toBeGreaterThan(0);
      expect(f.sourceAr.length).toBeGreaterThan(0);
      expect(f.considerAlsoEn.length).toBeGreaterThan(0);
      expect(f.considerAlsoAr.length).toBeGreaterThan(0);
      expect(f.assuranceTiers).toContain('needs-counsel');
      expect(f.causalChain).toHaveLength(6);
      for (const step of f.causalChain) {
        expect(step.stepEn.length).toBeGreaterThan(0);
        expect(step.stepAr.length).toBeGreaterThan(0);
        expect(step.textEn.length).toBeGreaterThan(0);
        expect(step.textAr.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('buildReviewReport -- industry dimension resolves a real standard', () => {
  it('reports strong status with a named standard when industry + FIDIC book are set', () => {
    const report = buildReviewReport({
      counterpartyType: 'private',
      industryBucket: 'construction',
      fidicBook: 'red',
    });
    const dim = report.dimensions.find(d => d.dimension === 'industry')!;
    expect(dim.status).toBe('strong');
    expect(dim.noteEn.length).toBeGreaterThan(0);
  });

  it('reports not-yet-assessed when no industry bucket is set', () => {
    const report = buildReviewReport({});
    const dim = report.dimensions.find(d => d.dimension === 'industry')!;
    expect(dim.status).toBe('not-yet-assessed');
  });
});
