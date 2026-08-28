import { describe, it, expect } from 'vitest';
import {
  INDUSTRY_BUCKETS, FIDIC_BOOKS, PROFESSIONAL_SERVICES_TRACKS, LOGISTICS_MODES,
  resolveApplicableStandard, subSelectorsApplicable,
} from './clmIndustryStandards';

describe('static metadata', () => {
  it('has 5 industry buckets', () => {
    expect(INDUSTRY_BUCKETS.map(b => b.id)).toEqual(
      ['supply-goods', 'construction', 'om', 'professional-services', 'logistics']);
  });
  it('has 8 FIDIC book entries (7 named + other)', () => {
    expect(FIDIC_BOOKS).toHaveLength(8);
    expect(FIDIC_BOOKS.map(b => b.id)).toContain('emerald');
    expect(FIDIC_BOOKS.map(b => b.id)).toContain('other');
  });
  it('has 2 professional-services tracks', () => {
    expect(PROFESSIONAL_SERVICES_TRACKS).toHaveLength(2);
  });
  it('has 5 logistics modes', () => {
    expect(LOGISTICS_MODES.map(m => m.id)).toEqual(['road', 'sea', 'air', 'rail', 'multimodal']);
  });
});

describe('resolveApplicableStandard', () => {
  it('returns undefined when no industry bucket is set', () => {
    expect(resolveApplicableStandard(undefined, undefined, undefined, undefined, undefined)).toBeUndefined();
    expect(resolveApplicableStandard('private', '', undefined, undefined, undefined)).toBeUndefined();
  });

  describe('government track (VII-A.1 fixed categories)', () => {
    it('resolves all 4 covered buckets to their fixed MOF/Etimad category', () => {
      expect(resolveApplicableStandard('government', 'supply-goods', undefined, undefined, undefined)?.standardEn)
        .toContain('General Supply Contract');
      expect(resolveApplicableStandard('government', 'construction', undefined, undefined, undefined)?.standardEn)
        .toContain('General Construction Contract');
      expect(resolveApplicableStandard('government', 'om', undefined, undefined, undefined)?.standardEn)
        .toContain('Operations & Maintenance Contract');
      expect(resolveApplicableStandard('government', 'professional-services', undefined, undefined, undefined)?.standardEn)
        .toContain('Services Contract');
    });
    it('honestly flags Logistics as not covered by the sourced government track', () => {
      const r = resolveApplicableStandard('government', 'logistics', undefined, undefined, undefined);
      expect(r?.standardEn).toContain('Not covered');
      expect(r?.noteEn).toContain('real gap');
    });
    it('never uses FIDIC/ISO/IACCM selectors on the government track', () => {
      const r = resolveApplicableStandard('government', 'construction', 'red', undefined, undefined);
      expect(r?.standardEn).not.toContain('FIDIC');
    });
  });

  describe('private track (VII-A.2)', () => {
    it('supply-goods resolves to CTL + Incoterms', () => {
      const r = resolveApplicableStandard('private', 'supply-goods', undefined, undefined, undefined);
      expect(r?.standardEn).toContain('Civil Transactions Law');
      expect(r?.standardEn).toContain('Incoterms');
    });

    it('construction with no book selected prompts for a book, still names FIDIC', () => {
      const r = resolveApplicableStandard('private', 'construction', undefined, undefined, undefined);
      expect(r?.standardEn).toContain('FIDIC');
      expect(r?.standardEn).toContain('not yet selected');
    });

    it('construction resolves each named FIDIC book with its applicability note', () => {
      const red = resolveApplicableStandard('private', 'construction', 'red', undefined, undefined);
      expect(red?.standardEn).toBe('FIDIC Red Book (Construction)');
      expect(red?.noteEn).toContain('design risk');

      const gold = resolveApplicableStandard('private', 'construction', 'gold', undefined, undefined);
      expect(gold?.noteEn).toContain('ISO 41001');

      const green = resolveApplicableStandard('private', 'construction', 'green', undefined, undefined);
      expect(green?.noteEn).toContain('10M');

      const emerald = resolveApplicableStandard('private', 'construction', 'emerald', undefined, undefined);
      expect(emerald?.noteEn).toContain('Geotechnical Baseline Report');
    });

    it('construction with "other" book returns a generic label, no fabricated applicability text', () => {
      const r = resolveApplicableStandard('private', 'construction', 'other', undefined, undefined);
      expect(r?.standardEn).toContain('other/unspecified');
      expect(r?.noteEn).toBeUndefined();
    });

    it('om resolves to ISO 41001 with a Gold Book cross-reference note', () => {
      const r = resolveApplicableStandard('private', 'om', undefined, undefined, undefined);
      expect(r?.standardEn).toContain('ISO 41001');
      expect(r?.noteEn).toContain('Gold Book');
    });

    it('professional-services requires a track selection first', () => {
      const r = resolveApplicableStandard('private', 'professional-services', undefined, undefined, undefined);
      expect(r?.standardEn).toContain('not yet selected');
    });

    it('professional-services resolves engineering-consultancy to FIDIC White Book', () => {
      const r = resolveApplicableStandard('private', 'professional-services', undefined, 'engineering-consultancy', undefined);
      expect(r?.standardEn).toContain('White Book');
    });

    it('professional-services resolves broader-professional to IACCM/ISO 9001', () => {
      const r = resolveApplicableStandard('private', 'professional-services', undefined, 'broader-professional', undefined);
      expect(r?.standardEn).toContain('IACCM');
      expect(r?.standardEn).toContain('ISO 9001');
    });

    it('logistics requires a mode selection first', () => {
      const r = resolveApplicableStandard('private', 'logistics', undefined, undefined, undefined);
      expect(r?.standardEn).toContain('not yet selected');
    });

    it('logistics/road resolves to CMR with an unverified-Saudi-ratification caveat', () => {
      const r = resolveApplicableStandard('private', 'logistics', undefined, undefined, 'road');
      expect(r?.standardEn).toContain('CMR');
      expect(r?.noteEn).toContain('NOT independently confirmed');
    });

    it('logistics/sea resolves to Hague-Visby with an unverified-Saudi-ratification caveat', () => {
      const r = resolveApplicableStandard('private', 'logistics', undefined, undefined, 'sea');
      expect(r?.standardEn).toContain('Hague-Visby');
      expect(r?.noteEn).toContain('NOT independently confirmed');
    });

    it('logistics/air resolves to Montreal Convention with confirmed Saudi ratification', () => {
      const r = resolveApplicableStandard('private', 'logistics', undefined, undefined, 'air');
      expect(r?.standardEn).toContain('Montreal Convention 1999');
      expect(r?.noteEn).toContain('CONFIRMED ratifying party');
    });

    it('logistics/rail resolves to COTIF/CIM', () => {
      const r = resolveApplicableStandard('private', 'logistics', undefined, undefined, 'rail');
      expect(r?.standardEn).toContain('COTIF');
    });

    it('logistics/multimodal resolves to FIATA Model Rules + FBL', () => {
      const r = resolveApplicableStandard('private', 'logistics', undefined, undefined, 'multimodal');
      expect(r?.standardEn).toContain('FIATA');
      expect(r?.standardEn).toContain('FBL');
    });
  });

  it('defaults to the private track when counterpartyType is not yet specified', () => {
    const r = resolveApplicableStandard(undefined, 'supply-goods', undefined, undefined, undefined);
    expect(r?.standardEn).toContain('Civil Transactions Law');
  });
});

describe('subSelectorsApplicable (Part E, rule 1: counterpartyType gates Module 05 sub-selection)', () => {
  it('returns false for government (no FIDIC/professional-services/logistics sub-selection)', () => {
    expect(subSelectorsApplicable('government')).toBe(false);
  });
  it('returns true for private', () => {
    expect(subSelectorsApplicable('private')).toBe(true);
  });
  it('returns true when counterpartyType is not yet specified (private is the default track)', () => {
    expect(subSelectorsApplicable(undefined)).toBe(true);
  });
});
