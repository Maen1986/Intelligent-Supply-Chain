import { describe, it, expect } from 'vitest';
import { RESILIENCE_CASE_STUDIES } from './resilienceCaseStudies';

describe('RESILIENCE_CASE_STUDIES -- data integrity', () => {
  it('every case has a unique id', () => {
    const ids = RESILIENCE_CASE_STUDIES.map((cs) => cs.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every case has non-empty bilingual text for every field', () => {
    RESILIENCE_CASE_STUDIES.forEach((cs) => {
      expect(cs.disruptionType.length).toBeGreaterThan(0);
      expect(cs.disruptionTypeAr.length).toBeGreaterThan(0);
      expect(cs.companiesEvent.length).toBeGreaterThan(0);
      expect(cs.companiesEventAr.length).toBeGreaterThan(0);
      expect(cs.metrics.length).toBeGreaterThan(0);
      expect(cs.metricsAr.length).toBeGreaterThan(0);
      expect(cs.lesson.length).toBeGreaterThan(0);
      expect(cs.lessonAr.length).toBeGreaterThan(0);
      expect(cs.source.length).toBeGreaterThan(0);
    });
  });
});

describe('RESILIENCE_CASE_STUDIES -- #183 Playbook Library expansion (26 Aug 2026)', () => {
  it('includes the Aisin fire as a Supplier Concentration Risk case', () => {
    const aisin = RESILIENCE_CASE_STUDIES.find((cs) => cs.id === 'aisin-fire-supplier-concentration');
    expect(aisin).toBeDefined();
    expect(aisin!.disruptionType).toBe('Supplier Concentration Risk');
    expect(aisin!.year).toBe('1997');
  });

  it('includes the Apple/Imagination dispute as a Contract & IP Dispute Risk case', () => {
    const apple = RESILIENCE_CASE_STUDIES.find((cs) => cs.id === 'apple-imagination-ip-dispute');
    expect(apple).toBeDefined();
    expect(apple!.disruptionType).toBe('Contract & IP Dispute Risk');
    expect(apple!.year).toBe('2017');
  });

  it('the two new disruption types extend, not collide with, existing categories', () => {
    const types = new Set(RESILIENCE_CASE_STUDIES.map((cs) => cs.disruptionType));
    expect(types.has('Supplier Concentration Risk')).toBe(true);
    expect(types.has('Contract & IP Dispute Risk')).toBe(true);
    // library grew from 12 to 14 named cases
    expect(RESILIENCE_CASE_STUDIES.length).toBe(14);
  });
});
