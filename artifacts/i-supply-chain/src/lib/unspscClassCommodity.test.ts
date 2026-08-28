/**
 * Tests: unspscClassCommodity.ts — UNSPSC Family/Class/Commodity reference
 * data + lookup helpers (registry #385 lowest-level import, 28 Aug 2026).
 *
 * Covers:
 *   1. Data shape — every segment key maps to a non-empty array of families;
 *      every family has at least one class; every class has at least one
 *      commodity (source file promises full 3-level depth, not just stubs).
 *   2. getFamiliesForSegment — returns the right list for a known segment,
 *      empty array for an unknown/undefined one.
 *   3. getClassesForFamily — returns the right list for a known
 *      segment+family pair, empty array when either doesn't match.
 *   4. getCommoditiesForClass — returns the right list for a known
 *      segment+family+class triple, empty array when any link doesn't match.
 *   5. unspscFamilyLabel — formats "code -- title", handles missing input.
 *   6. Cross-check — code prefixes are internally consistent (a family code
 *      starts with its segment code; a class code starts with its family
 *      code; a commodity code starts with its class code) — catches
 *      transcription errors from the source spreadsheet.
 */

import { describe, it, expect } from 'vitest';
import {
  UNSPSC_FAMILIES_BY_SEGMENT,
  getFamiliesForSegment,
  getClassesForFamily,
  getCommoditiesForClass,
  unspscFamilyLabel,
} from './unspscClassCommodity';

const SEGMENT_KEYS = Object.keys(UNSPSC_FAMILIES_BY_SEGMENT);

describe('UNSPSC_FAMILIES_BY_SEGMENT — data shape', () => {
  it('has exactly the 16 sourced services segments (matches unspscSegments.ts scope)', () => {
    expect(SEGMENT_KEYS.length).toBe(16);
  });

  it('every segment has at least one family', () => {
    for (const seg of SEGMENT_KEYS) {
      expect(UNSPSC_FAMILIES_BY_SEGMENT[seg].length).toBeGreaterThan(0);
    }
  });

  it('every family has at least one class, and every class has at least one commodity, except one verified source gap (class 76121800)', () => {
    const KNOWN_EMPTY_CLASSES = new Set(['76121800']); // see comment at that entry -- real UNDP source gap, not a bug
    const emptyFound: string[] = [];
    for (const seg of SEGMENT_KEYS) {
      for (const fam of UNSPSC_FAMILIES_BY_SEGMENT[seg]) {
        expect(fam.classes.length).toBeGreaterThan(0);
        for (const cls of fam.classes) {
          if (cls.commodities.length === 0) emptyFound.push(cls.code);
        }
      }
    }
    // Exactly the known exception -- no more, no fewer. A change here means either the
    // source gap was fixed (update KNOWN_EMPTY_CLASSES) or a new gap was introduced
    // (investigate before accepting).
    expect(emptyFound).toEqual(Array.from(KNOWN_EMPTY_CLASSES));
  });

  it('every family/class/commodity has a non-empty title', () => {
    for (const seg of SEGMENT_KEYS) {
      for (const fam of UNSPSC_FAMILIES_BY_SEGMENT[seg]) {
        expect(fam.title.trim().length).toBeGreaterThan(0);
        for (const cls of fam.classes) {
          expect(cls.title.trim().length).toBeGreaterThan(0);
          for (const com of cls.commodities) {
            expect(com.title.trim().length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it('code hierarchy is internally consistent: family⊂segment, class⊂family, commodity⊂class', () => {
    for (const seg of SEGMENT_KEYS) {
      for (const fam of UNSPSC_FAMILIES_BY_SEGMENT[seg]) {
        expect(fam.code.startsWith(seg)).toBe(true);
        expect(fam.code.length).toBe(8); // stored as 8-digit zero-padded family code
        for (const cls of fam.classes) {
          expect(cls.code.startsWith(fam.code.slice(0, 4))).toBe(true);
          expect(cls.code.length).toBe(8);
          for (const com of cls.commodities) {
            expect(com.code.startsWith(cls.code.slice(0, 6))).toBe(true);
            expect(com.code.length).toBe(8);
          }
        }
      }
    }
  });
});

describe('getFamiliesForSegment', () => {
  it('returns the families for a known segment (80 -- Management/business professional services)', () => {
    const families = getFamiliesForSegment('80');
    expect(families.length).toBeGreaterThan(0);
    expect(families).toBe(UNSPSC_FAMILIES_BY_SEGMENT['80']);
  });

  it('returns an empty array for an unknown segment code', () => {
    expect(getFamiliesForSegment('99')).toEqual([]);
  });

  it('returns an empty array for undefined', () => {
    expect(getFamiliesForSegment(undefined)).toEqual([]);
  });

  it('returns an empty array for "other"', () => {
    expect(getFamiliesForSegment('other')).toEqual([]);
  });
});

describe('getClassesForFamily', () => {
  it('returns the classes for a known segment+family pair', () => {
    const families = getFamiliesForSegment('80');
    const firstFamily = families[0];
    const classes = getClassesForFamily('80', firstFamily.code);
    expect(classes).toBe(firstFamily.classes);
    expect(classes.length).toBeGreaterThan(0);
  });

  it('returns an empty array when the segment does not match', () => {
    const families = getFamiliesForSegment('80');
    expect(getClassesForFamily('99', families[0].code)).toEqual([]);
  });

  it('returns an empty array when the family code does not exist under that segment', () => {
    expect(getClassesForFamily('80', '99999999')).toEqual([]);
  });

  it('returns an empty array for undefined segment or family', () => {
    expect(getClassesForFamily(undefined, '80100000')).toEqual([]);
    expect(getClassesForFamily('80', undefined)).toEqual([]);
  });
});

describe('getCommoditiesForClass', () => {
  it('returns the commodities for a known segment+family+class triple', () => {
    const families = getFamiliesForSegment('80');
    const firstFamily = families[0];
    const firstClass = firstFamily.classes[0];
    const commodities = getCommoditiesForClass('80', firstFamily.code, firstClass.code);
    expect(commodities).toBe(firstClass.commodities);
    expect(commodities.length).toBeGreaterThan(0);
  });

  it('returns an empty array when the class code does not exist under that family', () => {
    const families = getFamiliesForSegment('80');
    expect(getCommoditiesForClass('80', families[0].code, '99999999')).toEqual([]);
  });

  it('returns an empty array for undefined class', () => {
    const families = getFamiliesForSegment('80');
    expect(getCommoditiesForClass('80', families[0].code, undefined)).toEqual([]);
  });
});

describe('unspscFamilyLabel', () => {
  it('returns the family title for a known segment+family pair (label is title-only, code shown separately by callers)', () => {
    const families = getFamiliesForSegment('80');
    const label = unspscFamilyLabel('80', families[0].code);
    expect(label).toBe(families[0].title);
  });

  it('returns an empty string when the family does not resolve', () => {
    expect(unspscFamilyLabel('80', '99999999')).toBe('');
  });

  it('returns an empty string for undefined segment or family', () => {
    expect(unspscFamilyLabel(undefined, '80100000')).toBe('');
    expect(unspscFamilyLabel('80', undefined)).toBe('');
  });
});
