import { describe, it, expect } from 'vitest';
import {
  CLAUSE_CATEGORIES, SUBCLAUSES_BY_CATEGORY, totalSubclauseCount, presentSubclauseCount,
  categoryCompleteness, overallClauseHealth,
  checkCommercialRibaFlag, checkPerformanceMeasurabilityFlag, checkRiskAllocationFidicMismatchFlag,
  checkForegroundIPGapFlag, checkGovernanceRibaArbitrationFlag,
  checkGccJordanInterestPermittedFlag, checkQatarInterestLenderFlag,
} from './clmClauseTaxonomy';

describe('static metadata', () => {
  it('has 6 categories in doc order', () => {
    expect(CLAUSE_CATEGORIES.map(c => c.id)).toEqual([
      'commercial-payment', 'performance-service', 'risk-allocation',
      'legal-governance', 'data-ip-confidentiality', 'strategic-exit',
    ]);
  });

  it('every category has bilingual label + sensitivity metadata', () => {
    for (const c of CLAUSE_CATEGORIES) {
      expect(c.label.length).toBeGreaterThan(0);
      expect(c.labelAr.length).toBeGreaterThan(0);
      expect(c.sensitivityNoteEn.length).toBeGreaterThan(0);
      expect(c.sensitivityNoteAr.length).toBeGreaterThan(0);
    }
  });

  it('every category has a non-empty subclause list, each bilingual', () => {
    for (const c of CLAUSE_CATEGORIES) {
      const list = SUBCLAUSES_BY_CATEGORY[c.id];
      expect(list.length).toBeGreaterThan(0);
      for (const s of list) {
        expect(s.label.length).toBeGreaterThan(0);
        expect(s.labelAr.length).toBeGreaterThan(0);
      }
    }
  });

  it('subclause ids are unique within each category', () => {
    for (const c of CLAUSE_CATEGORIES) {
      const ids = SUBCLAUSES_BY_CATEGORY[c.id].map(s => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('totalSubclauseCount matches the sum across all 6 categories', () => {
    const sum = Object.values(SUBCLAUSES_BY_CATEGORY).reduce((n, l) => n + l.length, 0);
    expect(totalSubclauseCount()).toBe(sum);
    expect(totalSubclauseCount()).toBe(63);
  });

  it('includes the most commonly needed special conditions beyond the base 56 (item 31)', () => {
    const flat = Object.values(SUBCLAUSES_BY_CATEGORY).flat().map(s => s.id);
    for (const id of [
      'retention-of-title', 'cost-records-audit-rights', 'local-content-saudization',
      'parent-company-guarantee-performance-bond', 'non-solicitation-of-personnel',
      'hse-compliance', 'site-access-security-requirements',
    ]) {
      expect(flat).toContain(id);
    }
  });

  it('data-ip-confidentiality splits IP ownership into background and foreground', () => {
    const ids = SUBCLAUSES_BY_CATEGORY['data-ip-confidentiality'].map(s => s.id);
    expect(ids).toContain('ip-ownership-background');
    expect(ids).toContain('ip-ownership-foreground');
  });

  it('the 6 clauses whose real-world shape commonly differs carry variant options', () => {
    const withVariants: [string, string][] = [
      ['risk-allocation', 'limitation-of-liability'],
      ['risk-allocation', 'indemnification'],
      ['risk-allocation', 'force-majeure'],
      ['risk-allocation', 'liquidated-damages-delay-penalties'],
      ['legal-governance', 'dispute-resolution'],
      ['data-ip-confidentiality', 'ip-ownership-foreground'],
      ['strategic-exit', 'termination-for-convenience'],
    ];
    for (const [cat, id] of withVariants) {
      const sc = SUBCLAUSES_BY_CATEGORY[cat as ClauseCategory].find(s => s.id === id);
      expect(sc?.variants && sc.variants.length).toBeGreaterThanOrEqual(2);
      for (const v of sc!.variants!) {
        expect(v.label.length).toBeGreaterThan(0);
        expect(v.labelAr.length).toBeGreaterThan(0);
      }
    }
  });

  it('industry-specific special conditions are tagged with typicalIndustryBuckets, general ones are not', () => {
    const tagged: [string, string, string[]][] = [
      ['commercial-payment', 'retention-of-title', ['supply-goods']],
      ['risk-allocation', 'allocation-of-design-risk', ['construction']],
      ['performance-service', 'hse-compliance', ['construction', 'om', 'logistics']],
      ['strategic-exit', 'non-solicitation-of-personnel', ['professional-services']],
    ];
    for (const [cat, id, buckets] of tagged) {
      const sc = SUBCLAUSES_BY_CATEGORY[cat as ClauseCategory].find(s => s.id === id);
      expect(sc?.typicalIndustryBuckets).toEqual(buckets);
    }
    // A generally-applicable subclause should carry no industry tag.
    const generic = SUBCLAUSES_BY_CATEGORY['legal-governance'].find(s => s.id === 'governing-law');
    expect(generic?.typicalIndustryBuckets).toBeUndefined();
  });

  it('core risk-allocation subclauses (liability, indemnity, force majeure, LDs) are never industry-narrowed -- risk applies to any contract type', () => {
    const universalRisk = ['limitation-of-liability', 'indemnification', 'force-majeure', 'liquidated-damages-delay-penalties',
      'insurance-requirements', 'warranty-scope-exclusions', 'consequential-damages-exclusion', 'change-in-law-risk'];
    for (const id of universalRisk) {
      const sc = SUBCLAUSES_BY_CATEGORY['risk-allocation'].find(s => s.id === id);
      expect(sc?.typicalIndustryBuckets).toBeUndefined();
    }
  });

  it('variant ids are unique within a subclause', () => {
    for (const list of Object.values(SUBCLAUSES_BY_CATEGORY)) {
      for (const sc of list) {
        if (!sc.variants) continue;
        const ids = sc.variants.map(v => v.id);
        expect(new Set(ids).size).toBe(ids.length);
      }
    }
  });
});

describe('presentSubclauseCount', () => {
  it('returns 0 for undefined or empty', () => {
    expect(presentSubclauseCount(undefined)).toBe(0);
    expect(presentSubclauseCount({})).toBe(0);
  });
  it('sums across categories', () => {
    expect(presentSubclauseCount({
      'commercial-payment': ['price-consideration', 'payment-schedule'],
      'legal-governance': ['governing-law'],
    })).toBe(3);
  });
});

describe('categoryCompleteness', () => {
  it('not-applicable status when opted out, regardless of clausesPresent', () => {
    const r = categoryCompleteness('data-ip-confidentiality', { 'data-ip-confidentiality': ['confidentiality-nda'] }, ['data-ip-confidentiality']);
    expect(r.status).toBe('not-applicable');
    expect(r.percent).toBe(0);
  });
  it('not-started when nothing checked and not opted out', () => {
    const r = categoryCompleteness('strategic-exit', {}, []);
    expect(r.status).toBe('not-started');
    expect(r.present).toBe(0);
  });
  it('partial when some but not all subclauses checked', () => {
    const r = categoryCompleteness('legal-governance', { 'legal-governance': ['governing-law'] }, []);
    expect(r.status).toBe('partial');
    expect(r.present).toBe(1);
    expect(r.total).toBe(12);
  });
  it('complete when every subclause in the category is checked', () => {
    const allIds = SUBCLAUSES_BY_CATEGORY['strategic-exit'].map(s => s.id);
    const r = categoryCompleteness('strategic-exit', { 'strategic-exit': allIds }, []);
    expect(r.status).toBe('complete');
    expect(r.percent).toBe(100);
  });
});

describe('overallClauseHealth', () => {
  it('reports "Not started" and 0% when nothing checked and nothing opted out', () => {
    const r = overallClauseHealth({}, []);
    expect(r.weightedPercent).toBe(0);
    expect(r.labelEn).toBe('Not started');
    expect(r.applicableCategoryCount).toBe(6);
  });
  it('reports "No categories applicable" when every category is opted out', () => {
    const allCategories = CLAUSE_CATEGORIES.map(c => c.id);
    const r = overallClauseHealth({}, allCategories);
    expect(r.applicableCategoryCount).toBe(0);
    expect(r.labelEn).toBe('No categories applicable');
  });
  it('reports "Comprehensive" at 100% when every applicable category is fully checked', () => {
    const cp: Record<string, string[]> = {};
    for (const cat of CLAUSE_CATEGORIES) cp[cat.id] = SUBCLAUSES_BY_CATEGORY[cat.id].map(s => s.id);
    const r = overallClauseHealth(cp, []);
    expect(r.weightedPercent).toBe(100);
    expect(r.labelEn).toBe('Comprehensive');
  });
  it('excludes opted-out categories from the weighted score entirely (not counted as gaps)', () => {
    const cp: Record<string, string[]> = {};
    for (const cat of CLAUSE_CATEGORIES) {
      if (cat.id === 'strategic-exit') continue; // leave fully unchecked, but opt it out below
      cp[cat.id] = SUBCLAUSES_BY_CATEGORY[cat.id].map(s => s.id);
    }
    const r = overallClauseHealth(cp, ['strategic-exit']);
    expect(r.weightedPercent).toBe(100);
    expect(r.applicableCategoryCount).toBe(5);
  });
  it('weights HIGH-sensitivity categories more than LOW-MODERATE ones', () => {
    // Fully cover the one LOW-MODERATE category (Strategic/Exit) only.
    const lowOnly = overallClauseHealth({ 'strategic-exit': SUBCLAUSES_BY_CATEGORY['strategic-exit'].map(s => s.id) }, []);
    // Fully cover one HIGH category (Risk Allocation) only.
    const highOnly = overallClauseHealth({ 'risk-allocation': SUBCLAUSES_BY_CATEGORY['risk-allocation'].map(s => s.id) }, []);
    expect(highOnly.weightedPercent).toBeGreaterThan(lowOnly.weightedPercent);
  });
});

describe('checkCommercialRibaFlag', () => {
  it('not flagged when interest clause not checked', () => {
    expect(checkCommercialRibaFlag({}, 'Riyadh, Saudi Arabia', undefined, 'saudi-ctl').flagged).toBe(false);
  });
  it('not flagged when LD alternative also checked', () => {
    const cp = {
      'commercial-payment': ['late-payment-interest-penalty'],
      'risk-allocation': ['liquidated-damages-delay-penalties'],
    };
    expect(checkCommercialRibaFlag(cp, undefined, undefined, 'saudi-ctl').flagged).toBe(false);
  });
  it('not flagged when not Saudi-touching', () => {
    const cp = { 'commercial-payment': ['late-payment-interest-penalty'] };
    expect(checkCommercialRibaFlag(cp, 'London, UK', 'London, UK', 'uk-common-law').flagged).toBe(false);
  });
  it('flagged when interest checked, no LD alt, Saudi-touching via governing law', () => {
    const cp = { 'commercial-payment': ['late-payment-interest-penalty'] };
    const r = checkCommercialRibaFlag(cp, undefined, undefined, 'saudi-ctl');
    expect(r.flagged).toBe(true);
    expect(r.reasonEn).toContain('Sharia');
  });
  it('flagged when Saudi-touching via jurisdiction text, not governing law', () => {
    const cp = { 'commercial-payment': ['late-payment-interest-penalty'] };
    const r = checkCommercialRibaFlag(cp, 'Jeddah, KSA', undefined, undefined);
    expect(r.flagged).toBe(true);
  });
});

describe('checkPerformanceMeasurabilityFlag', () => {
  it('not flagged when category untouched', () => {
    expect(checkPerformanceMeasurabilityFlag({}).flagged).toBe(false);
  });
  it('not flagged when acceptance-criteria checked', () => {
    expect(checkPerformanceMeasurabilityFlag({ 'performance-service': ['acceptance-criteria', 'service-credits'] }).flagged).toBe(false);
  });
  it('flagged when category touched but acceptance-criteria absent', () => {
    const r = checkPerformanceMeasurabilityFlag({ 'performance-service': ['service-credits'] });
    expect(r.flagged).toBe(true);
    expect(r.reasonEn).toContain('Acceptance Criteria');
  });
});

describe('checkRiskAllocationFidicMismatchFlag', () => {
  it('not flagged when no FIDIC book selected', () => {
    expect(checkRiskAllocationFidicMismatchFlag({}, undefined).flagged).toBe(false);
  });
  it('not flagged for Green/Gold/Emerald (not design-risk-defining)', () => {
    expect(checkRiskAllocationFidicMismatchFlag({}, 'green').flagged).toBe(false);
    expect(checkRiskAllocationFidicMismatchFlag({}, 'gold').flagged).toBe(false);
  });
  it('not flagged when design-risk subclause is checked', () => {
    const cp = { 'risk-allocation': ['allocation-of-design-risk'] };
    expect(checkRiskAllocationFidicMismatchFlag(cp, 'silver').flagged).toBe(false);
  });
  it('flagged for Red/Yellow/Silver when design-risk subclause absent', () => {
    expect(checkRiskAllocationFidicMismatchFlag({}, 'red').flagged).toBe(true);
    expect(checkRiskAllocationFidicMismatchFlag({}, 'yellow').flagged).toBe(true);
    const r = checkRiskAllocationFidicMismatchFlag({}, 'silver');
    expect(r.flagged).toBe(true);
    expect(r.reasonEn).toContain('design risk');
  });
});

describe('checkForegroundIPGapFlag', () => {
  it('not flagged when background not checked', () => {
    expect(checkForegroundIPGapFlag({}, 'professional-services').flagged).toBe(false);
  });
  it('not flagged when both background and foreground checked', () => {
    const cp = { 'data-ip-confidentiality': ['ip-ownership-background', 'ip-ownership-foreground'] };
    expect(checkForegroundIPGapFlag(cp, 'professional-services').flagged).toBe(false);
  });
  it('flagged when background checked but foreground absent', () => {
    const cp = { 'data-ip-confidentiality': ['ip-ownership-background'] };
    const r = checkForegroundIPGapFlag(cp, 'professional-services');
    expect(r.flagged).toBe(true);
    expect(r.reasonEn).toContain('Foreground IP');
    expect(r.reasonEn).toContain('Professional Services');
  });
  it('flags outside Professional Services too, without the PS-specific note', () => {
    const cp = { 'data-ip-confidentiality': ['ip-ownership-background'] };
    const r = checkForegroundIPGapFlag(cp, 'construction');
    expect(r.flagged).toBe(true);
    expect(r.reasonEn).not.toContain('Professional Services');
  });
});

describe('checkGovernanceRibaArbitrationFlag', () => {
  it('not flagged when dispute-resolution not checked', () => {
    const cp = { 'commercial-payment': ['late-payment-interest-penalty'] };
    expect(checkGovernanceRibaArbitrationFlag(cp, undefined, undefined, 'saudi-ctl').flagged).toBe(false);
  });
  it('not flagged when interest clause not checked', () => {
    const cp = { 'legal-governance': ['dispute-resolution'] };
    expect(checkGovernanceRibaArbitrationFlag(cp, undefined, undefined, 'saudi-ctl').flagged).toBe(false);
  });
  it('not flagged when not Saudi-touching', () => {
    const cp = { 'legal-governance': ['dispute-resolution'], 'commercial-payment': ['late-payment-interest-penalty'] };
    expect(checkGovernanceRibaArbitrationFlag(cp, 'New York, USA', undefined, 'us-ucc').flagged).toBe(false);
  });
  it('flagged when both checked and Saudi-touching -- cites item 33 enforcement framing', () => {
    const cp = { 'legal-governance': ['dispute-resolution'], 'commercial-payment': ['late-payment-interest-penalty'] };
    const r = checkGovernanceRibaArbitrationFlag(cp, undefined, undefined, 'saudi-ctl');
    expect(r.flagged).toBe(true);
    expect(r.reasonEn).toContain('public-policy');
    expect(r.reasonEn).not.toContain('seat/institution choice is worth');
  });
});

describe('checkGccJordanInterestPermittedFlag', () => {
  it('not flagged when interest clause not checked', () => {
    expect(checkGccJordanInterestPermittedFlag({}, 'uae-ctl').flagged).toBe(false);
  });
  it('not flagged for a track outside the 5-track set (e.g. saudi-ctl, uae-difc-adgm, undefined)', () => {
    const cp = { 'commercial-payment': ['late-payment-interest-penalty'] };
    expect(checkGccJordanInterestPermittedFlag(cp, 'saudi-ctl').flagged).toBe(false);
    expect(checkGccJordanInterestPermittedFlag(cp, 'uae-difc-adgm').flagged).toBe(false);
    expect(checkGccJordanInterestPermittedFlag(cp, undefined).flagged).toBe(false);
  });
  it('flagged for each of the 5 tracks with the right sourced cap text', () => {
    const cp = { 'commercial-payment': ['late-payment-interest-penalty'] };
    const uae = checkGccJordanInterestPermittedFlag(cp, 'uae-ctl');
    expect(uae.flagged).toBe(true);
    expect(uae.reasonEn).toContain('9%');
    const bahrain = checkGccJordanInterestPermittedFlag(cp, 'bahrain-civil');
    expect(bahrain.flagged).toBe(true);
    expect(bahrain.reasonEn).toContain('Bahrain Monetary Agency');
    const oman = checkGccJordanInterestPermittedFlag(cp, 'oman-civil');
    expect(oman.flagged).toBe(true);
    expect(oman.reasonEn).toContain('Art. 80');
    const kuwait = checkGccJordanInterestPermittedFlag(cp, 'kuwait-civil');
    expect(kuwait.flagged).toBe(true);
    expect(kuwait.reasonEn).toContain('7%');
    const jordan = checkGccJordanInterestPermittedFlag(cp, 'jordan-civil');
    expect(jordan.flagged).toBe(true);
    expect(jordan.reasonEn).toContain('9%');
  });
  it('reason text frames this as informational, not a compliance risk', () => {
    const cp = { 'commercial-payment': ['late-payment-interest-penalty'] };
    const r = checkGccJordanInterestPermittedFlag(cp, 'uae-ctl');
    expect(r.reasonEn).toContain('informational advisory');
  });
});

describe('checkQatarInterestLenderFlag', () => {
  it('not flagged when interest clause not checked', () => {
    expect(checkQatarInterestLenderFlag({}, 'qatar-civil').flagged).toBe(false);
  });
  it('not flagged for a non-Qatar track', () => {
    const cp = { 'commercial-payment': ['late-payment-interest-penalty'] };
    expect(checkQatarInterestLenderFlag(cp, 'uae-ctl').flagged).toBe(false);
    expect(checkQatarInterestLenderFlag(cp, undefined).flagged).toBe(false);
  });
  it('flagged when interest checked on qatar-civil, cites Art. 568 and QCB Art. 110', () => {
    const cp = { 'commercial-payment': ['late-payment-interest-penalty'] };
    const r = checkQatarInterestLenderFlag(cp, 'qatar-civil');
    expect(r.flagged).toBe(true);
    expect(r.reasonEn).toContain('Art. 568');
    expect(r.reasonEn).toContain('Art. 110');
    expect(r.reasonEn).toContain('licensed financial institution');
  });
});
