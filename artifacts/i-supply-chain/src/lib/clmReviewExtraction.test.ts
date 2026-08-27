import { describe, it, expect } from 'vitest';
import { buildTaxonomyMenus, mergeExtractedFieldsIntoContract, type ExtractedContractFields } from './clmReviewExtraction';

describe('buildTaxonomyMenus', () => {
  it('drops placeholder ("" and "other") entries from every taxonomy array', () => {
    const menus = buildTaxonomyMenus(
      [{ id: 'saudi-ctl', label: 'Saudi CTL' }, { id: 'other', label: 'Other' }, { id: '', label: '' }],
      [{ id: 'scca', label: 'SCCA' }, { id: 'other', label: 'Other' }],
      [{ id: 'ffp', label: 'FFP' }, { id: 'other', label: 'Other' }],
      [{ id: 'supply-goods', label: 'Supply / Goods' }],
      [{ id: 'red', label: 'Red Book' }, { id: 'other', label: 'Other' }],
      [{ id: 'commercial-payment', label: 'Commercial / Payment' }],
      { 'commercial-payment': [{ id: 'price-consideration', label: 'Price / Consideration' }] },
    );
    expect(menus.governingLawTracks).toEqual([{ id: 'saudi-ctl', label: 'Saudi CTL' }]);
    expect(menus.arbitrationInstitutions).toEqual([{ id: 'scca', label: 'SCCA' }]);
    expect(menus.pricingTypes).toEqual([{ id: 'ffp', label: 'FFP' }]);
    expect(menus.fidicBooks).toEqual([{ id: 'red', label: 'Red Book' }]);
  });

  it('builds the subclausesByCategory map keyed by category id, carrying the category label', () => {
    const menus = buildTaxonomyMenus(
      [], [], [], [{ id: 'supply-goods', label: 'Supply / Goods' }], [],
      [{ id: 'commercial-payment', label: 'Commercial / Payment' }],
      { 'commercial-payment': [{ id: 'price-consideration', label: 'Price / Consideration' }, { id: 'payment-schedule', label: 'Payment Schedule' }] },
    );
    expect(menus.subclausesByCategory['commercial-payment'].categoryLabel).toBe('Commercial / Payment');
    expect(menus.subclausesByCategory['commercial-payment'].subclauses).toHaveLength(2);
  });

  it('produces an empty subclauses array for a category with no entries in the source map', () => {
    const menus = buildTaxonomyMenus(
      [], [], [], [], [],
      [{ id: 'data-ip-confidentiality', label: 'Data, IP & Confidentiality' }],
      {},
    );
    expect(menus.subclausesByCategory['data-ip-confidentiality'].subclauses).toEqual([]);
  });
});

function baseContract() {
  return {
    name: '', supplier: '',
    type: undefined as string | undefined,
    startDate: '2026-01-01', endDate: '2027-01-01',
    counterpartyType: undefined as string | undefined,
    governingLawClause: undefined as string | undefined,
    arbitrationInstitution: undefined as string | undefined,
    counterpartyJurisdiction: undefined as string | undefined,
    performanceLocation: undefined as string | undefined,
    pricingPrimary: undefined as string | undefined,
    scopeDefiniteness: undefined as string | undefined,
    pricingHasCapOrMilestones: undefined as boolean | undefined,
    industryBucket: undefined as string | undefined,
    fidicBook: undefined as string | undefined,
    professionalServicesTrack: undefined as string | undefined,
    logisticsMode: undefined as string | undefined,
    clausesPresent: undefined as Record<string, string[]> | undefined,
    clauseCategoriesNotApplicable: undefined as string[] | undefined,
  };
}

describe('mergeExtractedFieldsIntoContract', () => {
  it('fills empty fields on a fresh draft contract from extracted fields', () => {
    const extracted: ExtractedContractFields = {
      name: 'Supply Agreement', supplier: 'Acme Co',
      governingLawClause: 'saudi-ctl', pricingPrimary: 'ffp',
    };
    const merged = mergeExtractedFieldsIntoContract(baseContract(), extracted);
    expect(merged.name).toBe('Supply Agreement');
    expect(merged.supplier).toBe('Acme Co');
    expect(merged.governingLawClause).toBe('saudi-ctl');
    expect(merged.pricingPrimary).toBe('ffp');
  });

  it('never overwrites a field the user already entered', () => {
    const base = { ...baseContract(), name: 'User-Typed Name', supplier: 'User-Typed Supplier' };
    const extracted: ExtractedContractFields = { name: 'Extracted Name', supplier: 'Extracted Supplier' };
    const merged = mergeExtractedFieldsIntoContract(base, extracted);
    expect(merged.name).toBe('User-Typed Name');
    expect(merged.supplier).toBe('User-Typed Supplier');
  });

  it('always applies startDate/endDate when extracted, since defaultContract() always pre-fills them (extraction is more informative than today+1yr defaults)', () => {
    const base = baseContract(); // startDate/endDate already non-empty, matching defaultContract()'s real shape
    const extracted: ExtractedContractFields = { startDate: '2025-06-01', endDate: '2026-06-01' };
    const merged = mergeExtractedFieldsIntoContract(base, extracted);
    expect(merged.startDate).toBe('2025-06-01');
    expect(merged.endDate).toBe('2026-06-01');
  });

  it('merges clausesPresent only when the base has none yet', () => {
    const base = { ...baseContract(), clausesPresent: { 'data-ip-confidentiality': ['confidentiality-nda'] } };
    const extracted: ExtractedContractFields = { clausesPresent: { 'commercial-payment': ['price-consideration'] } };
    const merged = mergeExtractedFieldsIntoContract(base, extracted);
    // base already had a non-empty clausesPresent -- extraction must not clobber it
    expect(merged.clausesPresent).toEqual({ 'data-ip-confidentiality': ['confidentiality-nda'] });
  });

  it('applies clausesPresent when the base has none', () => {
    const extracted: ExtractedContractFields = { clausesPresent: { 'commercial-payment': ['price-consideration'] } };
    const merged = mergeExtractedFieldsIntoContract(baseContract(), extracted);
    expect(merged.clausesPresent).toEqual({ 'commercial-payment': ['price-consideration'] });
  });

  it('leaves fields untouched when extraction did not find them', () => {
    const base = baseContract();
    const merged = mergeExtractedFieldsIntoContract(base, {});
    expect(merged.name).toBe('');
    expect(merged.governingLawClause).toBeUndefined();
  });

  it('applies pricingHasCapOrMilestones=false correctly (falsy but defined, must not be treated as "not found")', () => {
    const extracted: ExtractedContractFields = { pricingHasCapOrMilestones: false };
    const merged = mergeExtractedFieldsIntoContract(baseContract(), extracted);
    expect(merged.pricingHasCapOrMilestones).toBe(false);
  });
});
