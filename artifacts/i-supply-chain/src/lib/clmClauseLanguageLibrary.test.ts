import { describe, it, expect } from 'vitest';
import { CLAUSE_CATEGORIES, SUBCLAUSES_BY_CATEGORY, totalSubclauseCount } from './clmClauseTaxonomy';
import {
  CLAUSE_LANGUAGE_LIBRARY, CLAUSE_ASSURANCE_META, COUNSEL_REVIEW_DISCLAIMER,
  getClauseLanguage, getClauseLanguageByCategory, clauseLanguageLibraryCoverageCount,
} from './clmClauseLanguageLibrary';

describe('coverage -- Option 3 must cover every taxonomy subclause, no more, no less', () => {
  it('has exactly one entry per taxonomy subclause id (all 63, zero drift)', () => {
    const taxonomyIds = Object.values(SUBCLAUSES_BY_CATEGORY).flat().map(s => s.id);
    const libraryIds = CLAUSE_LANGUAGE_LIBRARY.map(e => e.id);
    expect(libraryIds.length).toBe(taxonomyIds.length);
    expect(libraryIds.length).toBe(63);
    expect(new Set(libraryIds)).toEqual(new Set(taxonomyIds));
  });

  it('has no duplicate ids', () => {
    const ids = CLAUSE_LANGUAGE_LIBRARY.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('clauseLanguageLibraryCoverageCount() reports 63', () => {
    expect(clauseLanguageLibraryCoverageCount()).toBe(63);
    expect(clauseLanguageLibraryCoverageCount()).toBe(totalSubclauseCount());
  });

  it('every entry\'s category matches its id\'s real taxonomy category', () => {
    for (const cat of CLAUSE_CATEGORIES) {
      const taxonomyIdsForCat = new Set(SUBCLAUSES_BY_CATEGORY[cat.id].map(s => s.id));
      const libraryEntriesForCat = getClauseLanguageByCategory(cat.id);
      expect(libraryEntriesForCat.length).toBe(taxonomyIdsForCat.size);
      for (const e of libraryEntriesForCat) {
        expect(taxonomyIdsForCat.has(e.id)).toBe(true);
        expect(e.category).toBe(cat.id);
      }
    }
  });
});

describe('content integrity -- every clause is real, bilingual, and honestly tiered', () => {
  it('every entry has non-empty bilingual clause text', () => {
    for (const e of CLAUSE_LANGUAGE_LIBRARY) {
      expect(e.clauseTextEn.trim().length).toBeGreaterThan(40);
      expect(e.clauseTextAr.trim().length).toBeGreaterThan(40);
    }
  });

  it('every entry has a non-empty bilingual source note (Decision Record 8.7 -- never fake things)', () => {
    for (const e of CLAUSE_LANGUAGE_LIBRARY) {
      expect(e.sourceNoteEn.trim().length).toBeGreaterThan(20);
      expect(e.sourceNoteAr.trim().length).toBeGreaterThan(20);
    }
  });

  it('every entry has a valid, recognized assurance tier', () => {
    const validTiers = new Set(Object.keys(CLAUSE_ASSURANCE_META));
    for (const e of CLAUSE_LANGUAGE_LIBRARY) {
      expect(validTiers.has(e.assuranceTier)).toBe(true);
    }
  });

  it('assurance tier metadata is fully bilingual', () => {
    for (const tier of Object.values(CLAUSE_ASSURANCE_META)) {
      expect(tier.labelEn.length).toBeGreaterThan(0);
      expect(tier.labelAr.length).toBeGreaterThan(0);
      expect(tier.descEn.length).toBeGreaterThan(0);
      expect(tier.descAr.length).toBeGreaterThan(0);
    }
  });

  it('variant notes, where present, are always bilingual together (never English-only or Arabic-only)', () => {
    for (const e of CLAUSE_LANGUAGE_LIBRARY) {
      const hasEn = !!e.variantNoteEn;
      const hasAr = !!e.variantNoteAr;
      expect(hasEn).toBe(hasAr);
    }
  });

  it('the mandatory counsel-review disclaimer is bilingual and non-empty', () => {
    expect(COUNSEL_REVIEW_DISCLAIMER.labelEn.length).toBeGreaterThan(0);
    expect(COUNSEL_REVIEW_DISCLAIMER.labelAr.length).toBeGreaterThan(0);
    expect(COUNSEL_REVIEW_DISCLAIMER.textEn.length).toBeGreaterThan(50);
    expect(COUNSEL_REVIEW_DISCLAIMER.textAr.length).toBeGreaterThan(50);
  });
});

describe('getClauseLanguage lookup helper', () => {
  it('returns the correct entry for a known id', () => {
    const entry = getClauseLanguage('force-majeure');
    expect(entry).toBeDefined();
    expect(entry?.category).toBe('risk-allocation');
    expect(entry?.assuranceTier).toBe('reference-verified');
  });

  it('returns undefined for an unknown id -- never fabricates a fallback clause', () => {
    expect(getClauseLanguage('not-a-real-subclause-id')).toBeUndefined();
  });

  it('resolves every real taxonomy id via the lookup helper', () => {
    const taxonomyIds = Object.values(SUBCLAUSES_BY_CATEGORY).flat().map(s => s.id);
    for (const id of taxonomyIds) {
      expect(getClauseLanguage(id)).toBeDefined();
    }
  });
});

describe('specific high-stakes entries are grounded as expected', () => {
  it('late-payment-interest-penalty is reference-verified and names the Sharia-sensitivity fork', () => {
    const e = getClauseLanguage('late-payment-interest-penalty');
    expect(e?.assuranceTier).toBe('reference-verified');
    expect(e?.clauseTextEn).toMatch(/Sharia|Ta'widh|specific performance/i);
    expect(e?.sourceNoteEn).toMatch(/385|Civil Transactions Law/);
  });

  it('force-majeure cites the real ICC 2020 clause', () => {
    const e = getClauseLanguage('force-majeure');
    expect(e?.sourceNoteEn).toMatch(/ICC/);
    expect(e?.sourceNoteEn).toMatch(/2020/);
  });

  it('dispute-resolution cites SCCA, ICC, and DIAC official model clauses', () => {
    const e = getClauseLanguage('dispute-resolution');
    expect(e?.sourceNoteEn).toMatch(/SCCA/);
    expect(e?.sourceNoteEn).toMatch(/ICC/);
    expect(e?.sourceNoteEn).toMatch(/DIAC/);
  });

  it('data-protection-pdpl cites SDAIA as the primary regulator source', () => {
    const e = getClauseLanguage('data-protection-pdpl');
    expect(e?.assuranceTier).toBe('reference-verified');
    expect(e?.sourceNoteEn).toMatch(/SDAIA/);
  });

  it('local-content-saudization honestly states the private-B2B-vs-government-procurement fork', () => {
    const e = getClauseLanguage('local-content-saudization');
    expect(e?.clauseTextEn).toMatch(/scope fork/i);
    expect(e?.clauseTextEn).toMatch(/not applicable/i);
  });

  it('step-in-on-termination is honestly tiered self-declared-consistent (weakest-verified subclause)', () => {
    const e = getClauseLanguage('step-in-on-termination');
    expect(e?.assuranceTier).toBe('self-declared-consistent');
  });
});
