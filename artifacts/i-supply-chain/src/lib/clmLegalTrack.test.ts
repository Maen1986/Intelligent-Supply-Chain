import { describe, it, expect } from 'vitest';
import { checkGoverningLawMismatch, governingLawTrackLabel, GOVERNING_LAW_TRACKS } from './clmLegalTrack';

describe('GOVERNING_LAW_TRACKS', () => {
  it('has 7 tracks including saudi-ctl, saudi-gtpl, and other', () => {
    const ids = GOVERNING_LAW_TRACKS.map(t => t.id);
    expect(ids).toEqual(['saudi-ctl', 'saudi-gtpl', 'uk-common-law', 'us-ucc', 'eu-pecl', 'cisg-full', 'other']);
  });

  it('governingLawTrackLabel returns the right language', () => {
    expect(governingLawTrackLabel('uk-common-law', false)).toBe('UK / Commonwealth common law');
    expect(governingLawTrackLabel('uk-common-law', true)).toContain('البريطاني');
  });
});

describe('checkGoverningLawMismatch', () => {
  it('does not flag when governing law is unset', () => {
    expect(checkGoverningLawMismatch(undefined, 'Germany', 'Berlin').flagged).toBe(false);
  });

  it('does not flag "other" or full-form CISG (no single home jurisdiction)', () => {
    expect(checkGoverningLawMismatch('other', 'Germany', 'Berlin').flagged).toBe(false);
    expect(checkGoverningLawMismatch('cisg-full', 'Germany', 'France').flagged).toBe(false);
  });

  it('does not flag when counterparty jurisdiction matches the track', () => {
    const r = checkGoverningLawMismatch('us-ucc', 'United States', undefined);
    expect(r.flagged).toBe(false);
  });

  it('does not flag when performance location matches the track', () => {
    const r = checkGoverningLawMismatch('eu-pecl', undefined, 'Germany');
    expect(r.flagged).toBe(false);
  });

  it('does not flag when either field mentions Saudi Arabia, regardless of track', () => {
    const r = checkGoverningLawMismatch('us-ucc', 'Saudi Arabia', undefined);
    expect(r.flagged).toBe(false);
  });

  it('does not flag when both jurisdiction fields are blank (not enough info)', () => {
    const r = checkGoverningLawMismatch('uk-common-law', undefined, undefined);
    expect(r.flagged).toBe(false);
  });

  it('flags when the named track matches neither field nor Saudi Arabia', () => {
    const r = checkGoverningLawMismatch('us-ucc', 'Germany', 'France');
    expect(r.flagged).toBe(true);
    expect(r.reasonEn).toContain('US UCC Article 2');
    expect(r.reasonAr.length).toBeGreaterThan(0);
  });

  it('is case-insensitive when matching jurisdiction keywords', () => {
    const r = checkGoverningLawMismatch('saudi-ctl', 'saudi arabia', undefined);
    expect(r.flagged).toBe(false);
  });
});
