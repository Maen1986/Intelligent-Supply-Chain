import { describe, it, expect } from 'vitest';
import { buildNdaSkeleton, renderSkeletonAsText, type GenerationInput } from './clmGenerationEngine';
import { CLAUSE_CATEGORIES } from './clmClauseTaxonomy';

describe('buildNdaSkeleton -- disclaimer', () => {
  it('always carries a bilingual disclaimer regardless of input', () => {
    const skeleton = buildNdaSkeleton({ parties: [] });
    expect(skeleton.disclaimerEn.length).toBeGreaterThan(0);
    expect(skeleton.disclaimerAr.length).toBeGreaterThan(0);
    expect(skeleton.disclaimerEn.toLowerCase()).toContain('not legal advice');
  });
});

describe('buildNdaSkeleton -- cover section, empty input', () => {
  it('never fabricates facts -- uses honest placeholder markers when fields are missing', () => {
    const skeleton = buildNdaSkeleton({ parties: [] });
    expect(skeleton.cover.partiesEn).toContain('Not yet entered');
    expect(skeleton.cover.purposeEn).toContain('[Enter the purpose');
    expect(skeleton.cover.governingLawEn).toContain('[Governing law not yet selected');
  });
});

describe('buildNdaSkeleton -- cover section, populated input', () => {
  const input: GenerationInput = {
    parties: [{ name: 'Acme Co.', role: 'Disclosing Party' }, { name: 'Beta LLC', role: 'Receiving Party' }],
    effectiveDate: '2026-09-01',
    termDuration: '2 years',
    purposeStatement: { en: 'To evaluate a potential partnership', ar: 'لتقييم شراكة محتملة' },
    scopeOfWorkSummary: { en: 'Technical and commercial discussions', ar: 'مناقشات فنية وتجارية' },
    governingLawClause: 'saudi-ctl',
    disputeResolutionVariant: 'institutional-arbitration',
  };

  it('reflects entered facts verbatim, never altering them', () => {
    const skeleton = buildNdaSkeleton(input);
    expect(skeleton.cover.partiesEn).toBe('Acme Co. (Disclosing Party); Beta LLC (Receiving Party)');
    expect(skeleton.cover.effectiveDateEn).toBe('2026-09-01');
    expect(skeleton.cover.purposeEn).toBe('To evaluate a potential partnership');
    expect(skeleton.cover.purposeAr).toBe('لتقييم شراكة محتملة');
  });

  it('resolves the dispute forum from the real Module 02 variant list, bilingual', () => {
    const skeleton = buildNdaSkeleton(input);
    expect(skeleton.cover.disputeForumEn.length).toBeGreaterThan(0);
    expect(skeleton.cover.disputeForumAr.length).toBeGreaterThan(0);
    expect(skeleton.cover.disputeForumEn).not.toContain('not yet selected');
  });
});

describe('buildNdaSkeleton -- involvement map (A.1b)', () => {
  it('always includes the 3 mandatory roles', () => {
    const skeleton = buildNdaSkeleton({ parties: [] });
    const ids = skeleton.cover.involvementMap.map(r => r.id);
    expect(ids).toContain('legal-governance-owner');
    expect(ids).toContain('data-protection-privacy-owner');
    expect(ids).toContain('business-contract-owner');
    const mandatoryCount = skeleton.cover.involvementMap.filter(r => r.mandatory).length;
    expect(mandatoryCount).toBe(3);
  });

  it('adds external counsel when a governing-law mismatch is flagged', () => {
    const skeleton = buildNdaSkeleton({
      parties: [],
      governingLawClause: 'saudi-ctl',
      counterpartyJurisdiction: 'United Kingdom',
      performanceLocation: 'London',
    });
    expect(skeleton.cover.involvementMap.find(r => r.id === 'external-counsel')).toBeDefined();
  });

  it('does not add external counsel when governing law is consistent', () => {
    const skeleton = buildNdaSkeleton({
      parties: [],
      governingLawClause: 'saudi-ctl',
      counterpartyJurisdiction: 'Saudi Arabia',
      performanceLocation: 'Riyadh',
    });
    expect(skeleton.cover.involvementMap.find(r => r.id === 'external-counsel')).toBeUndefined();
  });

  it('adds regulatory liaison only for government counterparty', () => {
    const gov = buildNdaSkeleton({ parties: [], counterpartyType: 'government' });
    expect(gov.cover.involvementMap.find(r => r.id === 'regulatory-liaison')).toBeDefined();
    const priv = buildNdaSkeleton({ parties: [], counterpartyType: 'private' });
    expect(priv.cover.involvementMap.find(r => r.id === 'regulatory-liaison')).toBeUndefined();
  });

  it('adds Safety & Security owner and FIDIC Engineer only for construction industry bucket', () => {
    const construction = buildNdaSkeleton({ parties: [], industryBucket: 'construction' });
    expect(construction.cover.involvementMap.find(r => r.id === 'safety-security-owner')).toBeDefined();
    expect(construction.cover.involvementMap.find(r => r.id === 'fidic-engineer')).toBeDefined();
    const services = buildNdaSkeleton({ parties: [], industryBucket: 'professional-services' });
    expect(services.cover.involvementMap.find(r => r.id === 'safety-security-owner')).toBeUndefined();
    expect(services.cover.involvementMap.find(r => r.id === 'fidic-engineer')).toBeUndefined();
  });
});

describe('buildNdaSkeleton -- body outline', () => {
  it('covers all 6 Module 02 categories, in Module 02 order', () => {
    const skeleton = buildNdaSkeleton({ parties: [] });
    expect(skeleton.body.map(s => s.category)).toEqual(CLAUSE_CATEGORIES.map(c => c.id));
  });

  it('marks commercial-payment and performance-service as not applicable to NDA, with zero subclauses listed', () => {
    const skeleton = buildNdaSkeleton({ parties: [] });
    const commercial = skeleton.body.find(s => s.category === 'commercial-payment')!;
    const performance = skeleton.body.find(s => s.category === 'performance-service')!;
    expect(commercial.applicable).toBe(false);
    expect(commercial.subclauses).toHaveLength(0);
    expect(commercial.notApplicableNoteEn?.length).toBeGreaterThan(0);
    expect(performance.applicable).toBe(false);
    expect(performance.subclauses).toHaveLength(0);
  });

  it('marks data-ip-confidentiality as applicable with confidentiality-nda as mandatory', () => {
    const skeleton = buildNdaSkeleton({ parties: [] });
    const dataIp = skeleton.body.find(s => s.category === 'data-ip-confidentiality')!;
    expect(dataIp.applicable).toBe(true);
    const confSub = dataIp.subclauses.find(s => s.id === 'confidentiality-nda')!;
    expect(confSub.mandatory).toBe(true);
    expect(confSub.guidanceEn.length).toBeGreaterThan(0);
    expect(confSub.placeholderEn).toContain('not legal advice');
  });

  it('marks strategic-exit survival-clauses as mandatory (the defining NDA feature)', () => {
    const skeleton = buildNdaSkeleton({ parties: [] });
    const exit = skeleton.body.find(s => s.category === 'strategic-exit')!;
    const survival = exit.subclauses.find(s => s.id === 'survival-clauses')!;
    expect(survival.mandatory).toBe(true);
  });

  it('lists every subclause in a category with a bilingual guidance note, mandatory or not', () => {
    const skeleton = buildNdaSkeleton({ parties: [] });
    const legal = skeleton.body.find(s => s.category === 'legal-governance')!;
    expect(legal.subclauses.length).toBeGreaterThan(5);
    for (const sc of legal.subclauses) {
      expect(sc.guidanceEn.length).toBeGreaterThan(0);
      expect(sc.guidanceAr.length).toBeGreaterThan(0);
      expect(sc.placeholderEn.length).toBeGreaterThan(0);
      expect(sc.placeholderAr.length).toBeGreaterThan(0);
    }
  });
});

describe('renderSkeletonAsText', () => {
  it('produces non-empty EN and AR text containing the disclaimer and all category headers', () => {
    const skeleton = buildNdaSkeleton({
      parties: [{ name: 'Acme Co.', role: 'Disclosing Party' }],
      governingLawClause: 'saudi-ctl',
    });
    const en = renderSkeletonAsText(skeleton, false);
    const ar = renderSkeletonAsText(skeleton, true);
    expect(en.length).toBeGreaterThan(200);
    expect(ar.length).toBeGreaterThan(200);
    expect(en).toContain('not legal advice');
    for (const cat of CLAUSE_CATEGORIES) {
      expect(en).toContain(cat.label);
      expect(ar).toContain(cat.labelAr);
    }
  });
});
