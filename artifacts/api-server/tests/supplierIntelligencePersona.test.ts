import { describe, it, expect } from 'vitest';
import { supplierIntelligencePersona } from '../src/lib/supplierIntelligencePersona';
import { consultantPersona } from '../src/lib/consultantPersona';

describe('supplierIntelligencePersona', () => {
  it('extends, rather than replaces, the shared base persona (EN)', () => {
    const composed = supplierIntelligencePersona('en');
    const base = consultantPersona('en');
    expect(composed.startsWith(base)).toBe(true);
    expect(composed.length).toBeGreaterThan(base.length);
  });

  it('extends, rather than replaces, the shared base persona (AR)', () => {
    const composed = supplierIntelligencePersona('ar');
    const base = consultantPersona('ar');
    expect(composed.startsWith(base)).toBe(true);
    expect(composed.length).toBeGreaterThan(base.length);
  });

  it('enforces the evidence-stage vocabulary in English', () => {
    const text = supplierIntelligencePersona('en');
    expect(text).toContain('CLAIMED');
    expect(text).toContain('DOCUMENTED');
    expect(text).toContain('VALIDATED');
    expect(text).toContain('OBSERVED');
    expect(text).toContain('PROVEN');
    expect(text.toLowerCase()).toContain('never say "confirmed"'.toLowerCase());
  });

  it('states the anti-fabrication rule explicitly in English', () => {
    const text = supplierIntelligencePersona('en');
    expect(text.toLowerCase()).toContain('never fabricate a supplier');
  });

  it('states the anti-fabrication rule explicitly in Arabic', () => {
    const text = supplierIntelligencePersona('ar');
    expect(text).toContain('ولا تختلق بأي حال حقيقة عن مورد');
  });

  it('states the true-diversification (common-mode dependency) rule in both languages', () => {
    expect(supplierIntelligencePersona('en').toLowerCase()).toContain('never diversification on its own');
    expect(supplierIntelligencePersona('ar')).toContain('تنوّعًا حقيقيًا');
  });

  it('states the performance-model discipline (level+trend+variability+recurrence+cause) in both languages', () => {
    expect(supplierIntelligencePersona('en').toLowerCase()).toContain('level, trend, variability, recurrence, and cause');
    expect(supplierIntelligencePersona('ar')).toContain('مستوًى واتجاهًا وتذبذبًا وتكرارًا وسببًا');
  });

  it('states the compounding-signal discipline (no single weak signal in isolation) in both languages', () => {
    expect(supplierIntelligencePersona('en').toLowerCase()).toContain('do not judge any');
    expect(supplierIntelligencePersona('ar')).toContain('لا تُصدر حكمًا مطمئنًا أو منذرًا بناءً على إشارة ضعيفة');
  });

  it('defaults to English for any lang value other than "ar"', () => {
    // @ts-expect-error -- intentionally passing an invalid value to check the fallback branch
    const text = supplierIntelligencePersona('fr');
    expect(text).toBe(supplierIntelligencePersona('en'));
  });
});
