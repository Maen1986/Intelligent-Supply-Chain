import { describe, it, expect } from 'vitest';
import { buildNdaSkeleton, buildMsaSkeleton, renderSkeletonAsText, buildDraftClausesRequestBody, renderDraftedContractAsText, type GenerationInput } from './clmGenerationEngine';
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

describe('buildNdaSkeleton -- involvement map, custom stakeholders (item 50)', () => {
  it('adds no custom roles when customStakeholders is absent or empty', () => {
    const none = buildNdaSkeleton({ parties: [] });
    expect(none.cover.involvementMap.filter(r => r.id.startsWith('custom-'))).toHaveLength(0);
    const empty = buildNdaSkeleton({ parties: [], customStakeholders: [] });
    expect(empty.cover.involvementMap.filter(r => r.id.startsWith('custom-'))).toHaveLength(0);
  });

  it('appends client-named stakeholders as suggested (never mandatory), after the derived roles', () => {
    const skeleton = buildNdaSkeleton({ parties: [], customStakeholders: ['External Sponsor Liaison', 'Board Observer'] });
    const custom = skeleton.cover.involvementMap.filter(r => r.id.startsWith('custom-'));
    expect(custom).toHaveLength(2);
    expect(custom.every(r => r.mandatory === false)).toBe(true);
    expect(custom.map(r => r.labelEn)).toEqual(['External Sponsor Liaison', 'Board Observer']);
    // Custom roles come after every derived role, not interleaved.
    const lastDerivedIdx = skeleton.cover.involvementMap.findIndex(r => r.id.startsWith('custom-')) - 1;
    expect(skeleton.cover.involvementMap[lastDerivedIdx].id.startsWith('custom-')).toBe(false);
  });

  it('silently skips blank/whitespace-only custom stakeholder entries rather than rendering an empty role', () => {
    const skeleton = buildNdaSkeleton({ parties: [], customStakeholders: ['', '   ', 'Real Name'] });
    const custom = skeleton.cover.involvementMap.filter(r => r.id.startsWith('custom-'));
    expect(custom).toHaveLength(1);
    expect(custom[0].labelEn).toBe('Real Name');
  });

  it('trims whitespace from a custom stakeholder label', () => {
    const skeleton = buildNdaSkeleton({ parties: [], customStakeholders: ['  Regional Auditor  '] });
    expect(skeleton.cover.involvementMap.find(r => r.id === 'custom-0')?.labelEn).toBe('Regional Auditor');
  });

  it('custom stakeholders render into the plain-text output alongside derived roles', () => {
    const skeleton = buildNdaSkeleton({ parties: [], customStakeholders: ['External Sponsor Liaison'] });
    const text = renderSkeletonAsText(skeleton, false);
    expect(text).toContain('External Sponsor Liaison');
    expect(text).toContain('(suggested)');
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

describe('buildMsaSkeleton (item 53, 26 Aug 2026 -- MSA pilot)', () => {
  it('always carries a bilingual disclaimer, same as the NDA pilot', () => {
    const skeleton = buildMsaSkeleton({ parties: [] });
    expect(skeleton.disclaimerEn.length).toBeGreaterThan(0);
    expect(skeleton.disclaimerAr.length).toBeGreaterThan(0);
    expect(skeleton.disclaimerEn.toLowerCase()).toContain('not legal advice');
  });

  it('labels itself MSA, not NDA', () => {
    const skeleton = buildMsaSkeleton({ parties: [] });
    expect(skeleton.contractTypeLabelEn).toBe('MSA');
    expect(skeleton.contractTypeLabelAr.length).toBeGreaterThan(0);
  });

  it('covers all 6 Module 02 categories, in Module 02 order', () => {
    const skeleton = buildMsaSkeleton({ parties: [] });
    expect(skeleton.body.map(s => s.category)).toEqual(CLAUSE_CATEGORIES.map(c => c.id));
  });

  it('marks every category as applicable -- unlike the NDA pilot, no category is not-applicable to an MSA', () => {
    const skeleton = buildMsaSkeleton({ parties: [] });
    for (const section of skeleton.body) {
      expect(section.applicable).toBe(true);
      expect(section.subclauses.length).toBeGreaterThan(0);
    }
  });

  it('marks commercial-payment price-consideration and performance-service SLA as mandatory (core MSA content, unlike NDA)', () => {
    const skeleton = buildMsaSkeleton({ parties: [] });
    const commercial = skeleton.body.find(s => s.category === 'commercial-payment')!;
    const price = commercial.subclauses.find(s => s.id === 'price-consideration')!;
    expect(price.mandatory).toBe(true);
    const performance = skeleton.body.find(s => s.category === 'performance-service')!;
    const sla = performance.subclauses.find(s => s.id === 'performance-service-levels')!;
    expect(sla.mandatory).toBe(true);
  });

  it('marks termination-for-convenience and transition-exit-assistance as mandatory (defining MSA features)', () => {
    const skeleton = buildMsaSkeleton({ parties: [] });
    const exit = skeleton.body.find(s => s.category === 'strategic-exit')!;
    expect(exit.subclauses.find(s => s.id === 'termination-for-convenience')!.mandatory).toBe(true);
    expect(exit.subclauses.find(s => s.id === 'transition-exit-assistance')!.mandatory).toBe(true);
  });

  it('lists every subclause in every category with a bilingual guidance note, mandatory or not', () => {
    const skeleton = buildMsaSkeleton({ parties: [] });
    for (const section of skeleton.body) {
      for (const sc of section.subclauses) {
        expect(sc.guidanceEn.length).toBeGreaterThan(0);
        expect(sc.guidanceAr.length).toBeGreaterThan(0);
        expect(sc.placeholderEn.length).toBeGreaterThan(0);
        expect(sc.placeholderAr.length).toBeGreaterThan(0);
      }
    }
  });

  it('reuses the same GenerationInput/CoverSection shape as the NDA pilot -- customStakeholders (item 50) still flow through', () => {
    const input: GenerationInput = { parties: [{ name: 'Acme Co.', role: 'Client' }], customStakeholders: ['External Auditor'] };
    const skeleton = buildMsaSkeleton(input);
    const roles = skeleton.cover.involvementMap.map(r => r.labelEn);
    expect(roles).toContain('External Auditor');
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

  it('titles the NDA skeleton "NDA" and the MSA skeleton "MSA" -- shared renderer, per-pilot title', () => {
    const nda = buildNdaSkeleton({ parties: [] });
    const msa = buildMsaSkeleton({ parties: [] });
    const ndaTitle = renderSkeletonAsText(nda, false).split('\n')[0];
    const msaTitle = renderSkeletonAsText(msa, false).split('\n')[0];
    expect(ndaTitle).toBe('NDA -- STRUCTURAL SKELETON (Module 09 v1)');
    expect(msaTitle).toBe('MSA -- STRUCTURAL SKELETON (Module 09 v1)');
  });
});

describe('buildDraftClausesRequestBody', () => {
  it('sends only applicable categories with subclauses, dropping not-applicable ones (e.g. Commercial/Payment on a pure NDA)', () => {
    const skeleton = buildNdaSkeleton({ parties: [], governingLawClause: 'saudi-ctl' });
    const reqBody = buildDraftClausesRequestBody(skeleton);
    expect(reqBody.contractTypeLabelEn).toBe('NDA');
    for (const section of reqBody.body) {
      const skeletonSection = skeleton.body.find(s => s.category === section.category);
      expect(skeletonSection?.applicable).toBe(true);
      expect(section.subclauses.length).toBeGreaterThan(0);
    }
    // Commercial/Payment is not applicable to a pure NDA -- must not appear.
    expect(reqBody.body.find(s => s.category === 'commercial-payment')).toBeUndefined();
  });

  it('carries cover facts through verbatim', () => {
    const skeleton = buildNdaSkeleton({
      parties: [{ name: 'Acme Co.', role: 'Disclosing Party' }],
      purposeStatement: { en: 'To evaluate a partnership', ar: 'لتقييم شراكة' },
      governingLawClause: 'saudi-ctl',
    });
    const reqBody = buildDraftClausesRequestBody(skeleton);
    expect(reqBody.cover.partiesEn).toBe(skeleton.cover.partiesEn);
    expect(reqBody.cover.purposeEn).toBe('To evaluate a partnership');
    expect(reqBody.cover.governingLawEn).toBe(skeleton.cover.governingLawEn);
  });

  it('passes groundingNotes through unchanged, including when omitted', () => {
    const skeleton = buildNdaSkeleton({ parties: [] });
    const withNotes = buildDraftClausesRequestBody(skeleton, { governingLawPracticeNoteEn: 'A practice note' });
    expect(withNotes.groundingNotes?.governingLawPracticeNoteEn).toBe('A practice note');
    const withoutNotes = buildDraftClausesRequestBody(skeleton);
    expect(withoutNotes.groundingNotes).toBeUndefined();
  });

  it('each subclause entry carries id/labelEn/mandatory/guidanceEn matching the skeleton, never placeholder text', () => {
    const skeleton = buildNdaSkeleton({ parties: [], governingLawClause: 'saudi-ctl' });
    const reqBody = buildDraftClausesRequestBody(skeleton);
    const confidentiality = reqBody.body.find(s => s.category === 'data-ip-confidentiality')?.subclauses.find(sc => sc.id === 'confidentiality-nda');
    expect(confidentiality).toBeDefined();
    expect(confidentiality!.mandatory).toBe(true);
    expect(confidentiality!.guidanceEn.length).toBeGreaterThan(0);
    // never leaks the skeleton's own clause-text placeholder into the request
    expect(JSON.stringify(reqBody)).not.toContain('Module 09 v1 is a structural skeleton only');
  });
});

describe('renderDraftedContractAsText', () => {
  const skeleton = buildNdaSkeleton({
    parties: [{ name: 'Acme Co.', role: 'Disclosing Party' }],
    governingLawClause: 'saudi-ctl',
  });
  const drafted = {
    ok: true,
    disclaimerEn: 'AI-drafted disclaimer EN',
    disclaimerAr: 'إخلاء مسؤولية بالعربية',
    sections: [
      {
        category: 'data-ip-confidentiality',
        subclauses: [
          { id: 'confidentiality-nda', en: 'Each party shall keep confidential all information disclosed.', ar: 'يلتزم كل طرف بالحفاظ على سرية جميع المعلومات المفصح عنها.' },
        ],
      },
    ],
  };

  it('includes the disclaimer, cover facts, and drafted clause text (EN)', () => {
    const text = renderDraftedContractAsText(skeleton, drafted, false);
    expect(text).toContain('AI-drafted disclaimer EN');
    expect(text).toContain('Acme Co.');
    expect(text).toContain('Each party shall keep confidential all information disclosed.');
  });

  it('includes the Arabic disclaimer and drafted clause text in AR mode', () => {
    const text = renderDraftedContractAsText(skeleton, drafted, true);
    expect(text).toContain('إخلاء مسؤولية بالعربية');
    expect(text).toContain('يلتزم كل طرف بالحفاظ على سرية جميع المعلومات المفصح عنها.');
  });

  it('labels the merged document as v1.5, distinct from the v1 skeleton renderer', () => {
    const text = renderDraftedContractAsText(skeleton, drafted, false);
    expect(text.split('\n')[0]).toContain('Module 09 v1.5');
  });
});
