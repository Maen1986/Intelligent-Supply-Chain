import { describe, it, expect } from 'vitest';
import { checkGoverningLawMismatch, governingLawTrackLabel, governingLawPracticeNote, GOVERNING_LAW_TRACKS } from './clmLegalTrack';

describe('GOVERNING_LAW_TRACKS', () => {
  it('has 15 tracks including the six new GCC/Jordan tracks, uk-sga, and other', () => {
    const ids = GOVERNING_LAW_TRACKS.map(t => t.id);
    expect(ids).toEqual([
      'saudi-ctl', 'saudi-gtpl',
      'uae-ctl', 'uae-difc-adgm', 'qatar-civil', 'bahrain-civil', 'oman-civil', 'kuwait-civil', 'jordan-civil',
      'uk-common-law', 'uk-sga', 'us-ucc', 'eu-pecl', 'cisg-full', 'other',
    ]);
  });

  it('governingLawTrackLabel returns the right language', () => {
    expect(governingLawTrackLabel('uk-common-law', false)).toBe('UK / Commonwealth common law');
    expect(governingLawTrackLabel('uk-common-law', true)).toContain('البريطاني');
  });

  it('every new GCC/Jordan track has a non-empty bilingual label and at least one jurisdiction keyword', () => {
    const newIds = ['uae-ctl', 'uae-difc-adgm', 'qatar-civil', 'bahrain-civil', 'oman-civil', 'kuwait-civil', 'jordan-civil'];
    for (const id of newIds) {
      const meta = GOVERNING_LAW_TRACKS.find(t => t.id === id)!;
      expect(meta.label.length).toBeGreaterThan(0);
      expect(meta.labelAr.length).toBeGreaterThan(0);
      expect(meta.jurisdictionKeywords.length).toBeGreaterThan(0);
    }
  });

  it('uk-sga has a non-empty bilingual label and keywords, deliberately excluding "commonwealth"', () => {
    const meta = GOVERNING_LAW_TRACKS.find(t => t.id === 'uk-sga')!;
    expect(meta.label).toContain('Sale of Goods Act 1979');
    expect(meta.labelAr.length).toBeGreaterThan(0);
    expect(meta.jurisdictionKeywords).toContain('uk');
    expect(meta.jurisdictionKeywords).not.toContain('commonwealth');
  });

  it('uk-common-law and uk-sga both resolve labels independently (coexist, one does not replace the other)', () => {
    expect(governingLawTrackLabel('uk-common-law', false)).toBe('UK / Commonwealth common law');
    expect(governingLawTrackLabel('uk-sga', false)).toBe('UK Sale of Goods Act 1979 (B2B goods contracts)');
  });
});

describe('governingLawPracticeNote (GCC/Jordan real-practice recommendations, 26 Aug 2026)', () => {
  const gccJordanTracks: Array<typeof GOVERNING_LAW_TRACKS[number]['id']> = [
    'uae-ctl', 'uae-difc-adgm', 'qatar-civil', 'bahrain-civil', 'oman-civil', 'kuwait-civil', 'jordan-civil',
  ];

  it('returns a non-empty EN and AR note for all seven GCC/Jordan tracks', () => {
    for (const track of gccJordanTracks) {
      expect(governingLawPracticeNote(track, false)).toBeTruthy();
      expect(governingLawPracticeNote(track, true)).toBeTruthy();
    }
  });

  it('returns undefined for tracks with no researched practice note (Decision Record 8.7: never fabricate)', () => {
    const unresearched: Array<typeof GOVERNING_LAW_TRACKS[number]['id']> = [
      'saudi-ctl', 'saudi-gtpl', 'uk-common-law', 'uk-sga', 'us-ucc', 'eu-pecl', 'cisg-full', 'other',
    ];
    for (const track of unresearched) {
      expect(governingLawPracticeNote(track, false)).toBeUndefined();
      expect(governingLawPracticeNote(track, true)).toBeUndefined();
    }
  });

  it('returns undefined for an unknown track id', () => {
    expect(governingLawPracticeNote('' as any, false)).toBeUndefined();
  });

  it('names the correct dispute-resolution forum per GCC/Jordan track', () => {
    expect(governingLawPracticeNote('uae-ctl', false)).toContain('DIAC');
    expect(governingLawPracticeNote('qatar-civil', false)).toContain('QICCA');
    expect(governingLawPracticeNote('bahrain-civil', false)).toContain('BCDR-AAA');
    expect(governingLawPracticeNote('oman-civil', false)).toContain('OAC');
    expect(governingLawPracticeNote('kuwait-civil', false)).toContain('KCAC');
    expect(governingLawPracticeNote('jordan-civil', false)).toContain('ACAC');
  });

  it('flags the Jordan Arbitration Centre as a proposed/draft law, not yet enacted (honest scope note)', () => {
    const note = governingLawPracticeNote('jordan-civil', false)!;
    expect(note).toContain('JAC');
    expect(note.toLowerCase()).toMatch(/draft|proposed/);
    expect(note.toLowerCase()).toContain('not yet enacted');
  });

  it('flags Qatar Arabic-language requirements as an honest research gap, not assumed', () => {
    const note = governingLawPracticeNote('qatar-civil', false)!;
    expect(note.toLowerCase()).toContain('honest gap');
  });
});

describe('checkGoverningLawMismatch', () => {
  it('uk-sga matches on UK jurisdiction text but a bare "Commonwealth" country does not falsely match it', () => {
    expect(checkGoverningLawMismatch('uk-sga', 'United Kingdom', undefined).flagged).toBe(false);
    // Australia is Commonwealth but not "UK" -- uk-sga's keywords exclude
    // 'commonwealth' on purpose (see file header), so this should flag.
    expect(checkGoverningLawMismatch('uk-sga', 'Australia', 'Sydney').flagged).toBe(true);
  });

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

  // ── New GCC/Jordan tracks ──────────────────────────────────────────────

  it('does not flag UAE onshore track when counterparty is in Dubai', () => {
    const r = checkGoverningLawMismatch('uae-ctl', 'Dubai, UAE', undefined);
    expect(r.flagged).toBe(false);
  });

  it('does not flag DIFC/ADGM track when performance location names DIFC', () => {
    const r = checkGoverningLawMismatch('uae-difc-adgm', undefined, 'DIFC, Dubai');
    expect(r.flagged).toBe(false);
  });

  it('flags DIFC/ADGM track when neither field mentions DIFC/ADGM (generic "Dubai" alone does not match the free-zone track)', () => {
    const r = checkGoverningLawMismatch('uae-difc-adgm', 'Dubai, UAE', undefined);
    expect(r.flagged).toBe(true);
  });

  it('does not flag Qatar track when counterparty jurisdiction is Qatar', () => {
    const r = checkGoverningLawMismatch('qatar-civil', 'Doha, Qatar', undefined);
    expect(r.flagged).toBe(false);
  });

  it('does not flag Bahrain track when performance location is Bahrain', () => {
    const r = checkGoverningLawMismatch('bahrain-civil', undefined, 'Manama, Bahrain');
    expect(r.flagged).toBe(false);
  });

  it('does not flag Oman track when counterparty jurisdiction is Oman', () => {
    const r = checkGoverningLawMismatch('oman-civil', 'Muscat, Oman', undefined);
    expect(r.flagged).toBe(false);
  });

  it('does not flag Kuwait track when counterparty jurisdiction is Kuwait', () => {
    const r = checkGoverningLawMismatch('kuwait-civil', 'Kuwait City, Kuwait', undefined);
    expect(r.flagged).toBe(false);
  });

  it('does not flag Jordan track when performance location is Jordan', () => {
    const r = checkGoverningLawMismatch('jordan-civil', undefined, 'Amman, Jordan');
    expect(r.flagged).toBe(false);
  });

  it('flags Jordan track when neither field nor Saudi is mentioned', () => {
    const r = checkGoverningLawMismatch('jordan-civil', 'Germany', 'France');
    expect(r.flagged).toBe(true);
    expect(r.reasonEn).toContain('Jordan Civil Code');
  });

  it('does not flag any new GCC/Jordan track when the other field mentions Saudi Arabia', () => {
    const r = checkGoverningLawMismatch('kuwait-civil', 'Saudi Arabia', undefined);
    expect(r.flagged).toBe(false);
  });
});
