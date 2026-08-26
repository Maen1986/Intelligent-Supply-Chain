import { describe, it, expect } from 'vitest';
import { checkGoverningLawMismatch, governingLawTrackLabel, governingLawPracticeNote, GOVERNING_LAW_TRACKS, internationalContractingPracticeGuide, type GoverningLawTrack } from './clmLegalTrack';

describe('GOVERNING_LAW_TRACKS', () => {
  it('has 19 tracks including the six new GCC/Jordan tracks, uk-sga, the wave-1 Asia/Africa tracks, and other', () => {
    const ids = GOVERNING_LAW_TRACKS.map(t => t.id);
    expect(ids).toEqual([
      'saudi-ctl', 'saudi-gtpl',
      'uae-ctl', 'uae-difc-adgm', 'qatar-civil', 'bahrain-civil', 'oman-civil', 'kuwait-civil', 'jordan-civil',
      'uk-common-law', 'uk-sga', 'us-ucc', 'eu-pecl', 'cisg-full',
      'china-civil', 'india-contract-act', 'egypt-civil', 'south-africa-common-law',
      'other',
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

describe('governingLawPracticeNote (Saudi/UK/US/EU/CISG real-practice recommendations, round 2, 26 Aug 2026)', () => {
  const round2Tracks: Array<typeof GOVERNING_LAW_TRACKS[number]['id']> = [
    'saudi-ctl', 'saudi-gtpl', 'uk-common-law', 'uk-sga', 'us-ucc', 'eu-pecl', 'cisg-full',
  ];

  it('returns a non-empty EN and AR note for all seven round-2 tracks', () => {
    for (const track of round2Tracks) {
      expect(governingLawPracticeNote(track, false)).toBeTruthy();
      expect(governingLawPracticeNote(track, true)).toBeTruthy();
    }
  });

  it('names the correct dispute-resolution forum per round-2 track', () => {
    expect(governingLawPracticeNote('saudi-ctl', false)).toContain('SCCA');
    expect(governingLawPracticeNote('saudi-gtpl', false)).toContain('Board of Grievances');
    expect(governingLawPracticeNote('uk-common-law', false)).toContain('LCIA');
    expect(governingLawPracticeNote('uk-sga', false)).toContain('Arbitration Act 2025');
    expect(governingLawPracticeNote('us-ucc', false)).toContain('AAA');
    expect(governingLawPracticeNote('eu-pecl', false)).toContain('Rome I');
    expect(governingLawPracticeNote('cisg-full', false)).toContain('New York Convention');
  });

  it('flags the new Saudi GTPL (approved 4 Aug 2026) as pending implementing regulations (honest, time-stamped note)', () => {
    const note = governingLawPracticeNote('saudi-gtpl', false)!;
    expect(note).toContain('4 Aug 2026');
    expect(note.toLowerCase()).toContain('not yet been published');
  });

  it('flags PECL as soft law, not enacted EU/member-state legislation (fabrication-adjacent honest gap)', () => {
    const note = governingLawPracticeNote('eu-pecl', false)!;
    expect(note).toContain('Honest gap');
    expect(note.toLowerCase()).toContain('soft law');
    expect(note).toContain('Rome I Regulation');
  });

  it('names Louisiana\'s non-adoption of UCC Article 2 by name (US law is not internally uniform)', () => {
    const note = governingLawPracticeNote('us-ucc', false)!;
    expect(note).toContain('Louisiana');
    expect(note).toContain('has not adopted UCC Article 2');
  });

  it('every round-2 note has a non-empty Arabic translation distinct from the English text', () => {
    for (const track of round2Tracks) {
      const en = governingLawPracticeNote(track, false)!;
      const ar = governingLawPracticeNote(track, true)!;
      expect(ar.length).toBeGreaterThan(50);
      expect(ar).not.toBe(en);
    }
  });
});

describe('"other" track -- professional label + scope-boundary disclosure (round 3, 26 Aug 2026)', () => {
  it('label is no longer the vague "not specified" -- names what selecting it means', () => {
    expect(governingLawTrackLabel('other', false)).toBe('Other / Rest of World (not yet modeled)');
    expect(governingLawTrackLabel('other', false)).not.toContain('not specified');
    expect(governingLawTrackLabel('other', true)).toContain('بقية دول العالم');
  });

  it('now has a non-empty EN and AR recommendedPractice, unlike round 2', () => {
    expect(governingLawPracticeNote('other', false)).toBeTruthy();
    expect(governingLawPracticeNote('other', true)).toBeTruthy();
  });

  it('honestly names the real coverage gap -- Asia, Africa, Latin America, Canada, Australia', () => {
    const note = governingLawPracticeNote('other', false)!;
    expect(note).toContain('Asia');
    expect(note).toContain('Africa');
    expect(note).toContain('Latin America');
    expect(note).toContain('Canada');
    expect(note).toContain('Australia');
  });

  it('recommends local counsel rather than presenting itself as legal coverage', () => {
    const note = governingLawPracticeNote('other', false)!;
    expect(note.toLowerCase()).toContain('local counsel');
  });

  it('every track except the empty string now has a non-empty recommendedPractice note', () => {
    for (const meta of GOVERNING_LAW_TRACKS) {
      expect(governingLawPracticeNote(meta.id, false)).toBeTruthy();
      expect(governingLawPracticeNote(meta.id, true)).toBeTruthy();
    }
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

describe('governingLawPracticeNote (China/India/Egypt/South Africa, wave 1 of world/continent coverage, registry #387, 26 Aug 2026)', () => {
  const waveOneTracks: GoverningLawTrack[] = ['china-civil', 'india-contract-act', 'egypt-civil', 'south-africa-common-law'];

  it('returns non-empty EN and AR practice notes for all 4 wave-1 tracks', () => {
    for (const t of waveOneTracks) {
      expect(governingLawPracticeNote(t, false)).toBeTruthy();
      expect(governingLawPracticeNote(t, true)).toBeTruthy();
    }
  });

  it('China note names CIETAC and the PRC Civil Code Article 466 language presumption', () => {
    const note = governingLawPracticeNote('china-civil', false);
    expect(note).toContain('CIETAC');
    expect(note).toContain('Article 466');
  });

  it('China note confirms CISG ratification and the 2013 Article 96 withdrawal', () => {
    const note = governingLawPracticeNote('china-civil', false);
    expect(note).toContain('1986');
    expect(note).toContain('Article 96');
    expect(note).toContain('2013');
  });

  it('India note names MCIA and the Indian Stamp Act 1899 inadmissibility point', () => {
    const note = governingLawPracticeNote('india-contract-act', false);
    expect(note).toContain('MCIA');
    expect(note).toContain('Indian Stamp Act 1899');
    expect(note).toContain('inadmissible');
  });

  it('India note confirms India is not a CISG Contracting State', () => {
    const note = governingLawPracticeNote('india-contract-act', false);
    expect(note).toContain('not a CISG Contracting State');
  });

  it('Egypt note names CRCICA and discloses the honest gap on Arabic-language convention', () => {
    const note = governingLawPracticeNote('egypt-civil', false);
    expect(note).toContain('CRCICA');
    expect(note).toContain('Honest gap');
  });

  it('Egypt note confirms CISG accession and the inconsistent-application caveat', () => {
    const note = governingLawPracticeNote('egypt-civil', false);
    expect(note).toContain('1 Jan 1988');
    expect(note).toContain('inconsistent');
  });

  it('South Africa note names AFSA and the Roman-Dutch law origin', () => {
    const note = governingLawPracticeNote('south-africa-common-law', false);
    expect(note).toContain('AFSA');
    expect(note).toContain('Roman-Dutch');
  });

  it('South Africa note confirms South Africa is not a CISG Contracting State', () => {
    const note = governingLawPracticeNote('south-africa-common-law', false);
    expect(note).toContain('not a CISG Contracting State');
  });

  it('every wave-1 track has a non-empty, distinct Arabic translation from its English note', () => {
    for (const t of waveOneTracks) {
      const en = governingLawPracticeNote(t, false);
      const ar = governingLawPracticeNote(t, true);
      expect(ar).toBeTruthy();
      expect(ar).not.toBe(en);
    }
  });

  it('all 4 wave-1 tracks are present in GOVERNING_LAW_TRACKS with correct labels', () => {
    const ids = GOVERNING_LAW_TRACKS.map((t) => t.id);
    expect(ids).toContain('china-civil');
    expect(ids).toContain('india-contract-act');
    expect(ids).toContain('egypt-civil');
    expect(ids).toContain('south-africa-common-law');
  });
});

describe('internationalContractingPracticeGuide (common GCC/Jordan/Middle East cross-border practice, owner-prompted research, 26 Aug 2026)', () => {
  it('returns non-empty EN and AR guides', () => {
    expect(internationalContractingPracticeGuide(false)).toBeTruthy();
    expect(internationalContractingPracticeGuide(true)).toBeTruthy();
  });

  it('EN guide cites English law global dominance stats', () => {
    const guide = internationalContractingPracticeGuide(false);
    expect(guide).toContain('English law');
    expect(guide).toContain('40%');
    expect(guide).toContain('LCIA');
  });

  it('EN guide cites the 2025 QMUL/White & Case Middle East seat data', () => {
    const guide = internationalContractingPracticeGuide(false);
    expect(guide).toContain('London');
    expect(guide).toContain('Singapore');
    expect(guide).toContain('ICC Rules');
  });

  it('EN guide names the 2024-2025 DIFC reform nuance', () => {
    const guide = internationalContractingPracticeGuide(false);
    expect(guide).toContain('DIFC Law No. 8 of 2024');
    expect(guide).toContain('Dubai Law No. 2 of 2025');
    expect(guide).toContain('asymmetric jurisdiction');
  });

  it('EN guide covers Saudi/Jordan party autonomy and Asia-linked (China) arbitration institutions', () => {
    const guide = internationalContractingPracticeGuide(false);
    expect(guide).toContain('SCCA');
    expect(guide).toContain('New York Convention');
    expect(guide).toContain('CIETAC');
    expect(guide).toContain('Belt and Road');
  });

  it('EN guide is explicit that this is market observation, not a recommendation', () => {
    const guide = internationalContractingPracticeGuide(false);
    expect(guide).toContain('not a recommendation');
  });

  it('AR guide is non-empty and distinct from the EN guide', () => {
    const en = internationalContractingPracticeGuide(false);
    const ar = internationalContractingPracticeGuide(true);
    expect(ar).toBeTruthy();
    expect(ar).not.toBe(en);
  });
});
