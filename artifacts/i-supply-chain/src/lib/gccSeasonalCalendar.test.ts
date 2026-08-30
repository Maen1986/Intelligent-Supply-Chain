import { describe, it, expect } from 'vitest';
import {
  GCC_COUNTRIES, GCC_SEASONAL_DATA, hasYearData, getYearData, getHajjAdvisory,
  buildCountdown, buildSeasonalCalendarPrompt,
} from './gccSeasonalCalendar';

describe('GCC_SEASONAL_DATA', () => {
  it('has all 6 countries', () => {
    expect(GCC_COUNTRIES).toHaveLength(6);
    expect(GCC_COUNTRIES).toEqual(['saudi', 'uae', 'qatar', 'jordan', 'oman', 'bahrain']);
  });

  it('every country has bilingual labels and a Ramadan hours rule', () => {
    for (const c of GCC_COUNTRIES) {
      const d = GCC_SEASONAL_DATA[c];
      expect(d.labelEn.length).toBeGreaterThan(0);
      expect(d.labelAr.length).toBeGreaterThan(0);
      expect(d.ramadanHours.legalBasisEn.length).toBeGreaterThan(0);
      expect(d.ramadanHours.sourceNoteEn.length).toBeGreaterThan(0);
    }
  });

  it('Jordan is the real outlier -- not mandated, employer discretion', () => {
    const jordan = GCC_SEASONAL_DATA.jordan.ramadanHours;
    expect(jordan.mandated).toBe(false);
    expect(jordan.appliesTo).toBe('employer_discretion');
    expect(jordan.privateSectorHoursPerDay).toBeNull();
  });

  it('Oman has a lower weekly cap (30h) than the other mandated countries (36h)', () => {
    expect(GCC_SEASONAL_DATA.oman.ramadanHours.privateSectorHoursPerWeek).toBe(30);
    expect(GCC_SEASONAL_DATA.saudi.ramadanHours.privateSectorHoursPerWeek).toBe(36);
    expect(GCC_SEASONAL_DATA.uae.ramadanHours.privateSectorHoursPerWeek).toBe(36);
    expect(GCC_SEASONAL_DATA.qatar.ramadanHours.privateSectorHoursPerWeek).toBe(36);
    expect(GCC_SEASONAL_DATA.bahrain.ramadanHours.privateSectorHoursPerWeek).toBe(36);
  });

  it('Qatar cites Article 73 of Law No. 14 of 2004, not the incorrect "Law No. 3 of 1962" found in one search result', () => {
    expect(GCC_SEASONAL_DATA.qatar.ramadanHours.legalBasisEn).toContain('No. 14 of 2004');
    expect(GCC_SEASONAL_DATA.qatar.ramadanHours.legalBasisEn).toContain('Article 73');
    expect(GCC_SEASONAL_DATA.qatar.ramadanHours.legalBasisEn).not.toContain('1962');
  });

  it('UAE Ramadan hours apply to all employees regardless of religion, unlike Saudi/Oman/Bahrain', () => {
    expect(GCC_SEASONAL_DATA.uae.ramadanHours.appliesTo).toBe('all_employees');
    expect(GCC_SEASONAL_DATA.qatar.ramadanHours.appliesTo).toBe('all_employees');
    expect(GCC_SEASONAL_DATA.saudi.ramadanHours.appliesTo).toBe('muslim_employees_only');
  });
});

describe('hasYearData / getYearData', () => {
  it('has 2026 data for every country', () => {
    for (const c of GCC_COUNTRIES) {
      expect(hasYearData(c, 2026)).toBe(true);
      expect(getYearData(c, 2026)).not.toBeNull();
    }
  });

  it('honestly returns false/null for an unsourced year rather than guessing', () => {
    for (const c of GCC_COUNTRIES) {
      expect(hasYearData(c, 2027)).toBe(false);
      expect(getYearData(c, 2027)).toBeNull();
    }
  });
});

describe('getHajjAdvisory', () => {
  it('is Saudi-only', () => {
    expect(getHajjAdvisory('saudi', false)).not.toBeNull();
    for (const c of GCC_COUNTRIES.filter(c => c !== 'saudi')) {
      expect(getHajjAdvisory(c, false)).toBeNull();
    }
  });

  it('discloses the Red Sea-diversion confound rather than presenting 2026 severity as a guaranteed annual pattern', () => {
    const text = getHajjAdvisory('saudi', false)!;
    expect(text.toLowerCase()).toContain('red sea');
    expect(text.toLowerCase()).not.toContain('every year');
  });
});

describe('buildCountdown', () => {
  it('produces 90/60/30/14-day markers for Ramadan, Eid al-Fitr and Eid al-Adha for a non-Saudi country', () => {
    const items = buildCountdown('uae', '2025-01-01', false);
    const types = new Set(items.map(i => i.milestoneType));
    expect(types.has('ramadanStart')).toBe(true);
    expect(types.has('eidAlFitr')).toBe(true);
    expect(types.has('eidAlAdha')).toBe(true);
    expect(types.has('hajjSeason')).toBe(false);
    // 3 milestones x 4 T-markers = 12
    expect(items).toHaveLength(12);
  });

  it('adds a 4th Hajj-season milestone for Saudi only', () => {
    const saudiItems = buildCountdown('saudi', '2025-01-01', false);
    const uaeItems = buildCountdown('uae', '2025-01-01', false);
    expect(saudiItems).toHaveLength(16); // 4 milestones x 4 markers
    expect(uaeItems).toHaveLength(12);
  });

  it('marks a due date as past when it falls before "today"', () => {
    const items = buildCountdown('saudi', '2026-08-30', false);
    expect(items.every(i => i.isPast)).toBe(true);
  });

  it('marks a due date as upcoming when "today" is well before the sourced milestones', () => {
    const items = buildCountdown('saudi', '2025-01-01', false);
    expect(items.some(i => !i.isPast)).toBe(true);
  });

  it('computes dueDate as exactly tMinusDays before the milestone date', () => {
    const items = buildCountdown('bahrain', '2025-01-01', false);
    const eidAlFitr90 = items.find(i => i.milestoneType === 'eidAlFitr' && i.tMinusDays === 90);
    expect(eidAlFitr90).toBeDefined();
    // Eid al-Fitr 2026 starts 2026-03-20; T-90 => 2025-12-20
    expect(eidAlFitr90!.dueDate).toBe('2025-12-20');
  });

  it('sorts items chronologically by dueDate', () => {
    const items = buildCountdown('saudi', '2025-01-01', false);
    const dueDates = items.map(i => i.dueDate);
    const sorted = [...dueDates].sort();
    expect(dueDates).toEqual(sorted);
  });

  it('produces bilingual action text', () => {
    const en = buildCountdown('jordan', '2025-01-01', false);
    const ar = buildCountdown('jordan', '2025-01-01', true);
    expect(en[0].actionEn.length).toBeGreaterThan(0);
    expect(ar[0].actionAr.length).toBeGreaterThan(0);
  });
});

describe('buildSeasonalCalendarPrompt', () => {
  it('includes the country label, industry, and does not assume 2027 dates', () => {
    const prompt = buildSeasonalCalendarPrompt('saudi', 'manufacturing', false);
    expect(prompt).toContain('Saudi Arabia');
    expect(prompt).toContain('manufacturing');
    expect(prompt.toLowerCase()).toContain('2027');
  });
});
