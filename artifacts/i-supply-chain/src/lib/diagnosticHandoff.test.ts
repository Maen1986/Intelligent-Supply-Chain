/**
 * Unit tests for the Diagnostic -> Maturity Assessment handoff mapping
 * (#142).
 */

import { describe, it, expect } from 'vitest';
import {
  mapDiagnosticSize,
  mapDiagnosticIndustry,
  mapDiagnosticCountry,
  buildMaturityHandoffQuery,
} from './diagnosticHandoff';

describe('mapDiagnosticSize', () => {
  it('maps every Diagnostic businessSize option to a Maturity INTAKE_SIZES id', () => {
    expect(mapDiagnosticSize('Startup')).toBe('startup');
    expect(mapDiagnosticSize('SME')).toBe('sme');
    expect(mapDiagnosticSize('Mid-Market')).toBe('midmarket');
    expect(mapDiagnosticSize('Enterprise')).toBe('enterprise');
    expect(mapDiagnosticSize('Government Entity')).toBe('government');
  });

  it('returns undefined for an unrecognised value rather than guessing', () => {
    expect(mapDiagnosticSize('Nonsense')).toBeUndefined();
    expect(mapDiagnosticSize('')).toBeUndefined();
  });
});

describe('mapDiagnosticIndustry', () => {
  it('maps every Diagnostic industry option to a Maturity INTAKE_INDUSTRIES id', () => {
    expect(mapDiagnosticIndustry('Manufacturing')).toBe('manufacturing');
    expect(mapDiagnosticIndustry('Marine')).toBe('marine');
    expect(mapDiagnosticIndustry('Retail')).toBe('retail');
    expect(mapDiagnosticIndustry('FMCG')).toBe('fmcg');
    expect(mapDiagnosticIndustry('Pharma')).toBe('pharma');
    expect(mapDiagnosticIndustry('Logistics')).toBe('logistics');
    expect(mapDiagnosticIndustry('Energy')).toBe('oil_gas');
    expect(mapDiagnosticIndustry('Construction')).toBe('construction');
    expect(mapDiagnosticIndustry('Tech')).toBe('technology');
    expect(mapDiagnosticIndustry('Government')).toBe('government');
  });

  it('maps the two categories with no direct equivalent to their closest real fit', () => {
    expect(mapDiagnosticIndustry('Ecommerce')).toBe('retail');
    expect(mapDiagnosticIndustry('Food & Beverage')).toBe('fmcg');
    expect(mapDiagnosticIndustry('Healthcare')).toBe('pharma');
  });

  it('returns undefined for an unrecognised value rather than guessing', () => {
    expect(mapDiagnosticIndustry('Nonsense')).toBeUndefined();
  });
});

describe('mapDiagnosticCountry', () => {
  it('maps the 6 countries with a real regulatory module', () => {
    expect(mapDiagnosticCountry('Saudi Arabia')).toBe('ksa');
    expect(mapDiagnosticCountry('United Arab Emirates')).toBe('uae');
    expect(mapDiagnosticCountry('Qatar')).toBe('qat');
    expect(mapDiagnosticCountry('Jordan')).toBe('jor');
    expect(mapDiagnosticCountry('Oman')).toBe('omn');
    expect(mapDiagnosticCountry('Bahrain')).toBe('bhr');
  });

  it('leaves every other region unmapped rather than guessing a country', () => {
    expect(mapDiagnosticCountry('Other GCC')).toBeUndefined();
    expect(mapDiagnosticCountry('North America')).toBeUndefined();
    expect(mapDiagnosticCountry('Europe')).toBeUndefined();
    expect(mapDiagnosticCountry('Africa')).toBeUndefined();
    expect(mapDiagnosticCountry('Asia-Pacific')).toBeUndefined();
    expect(mapDiagnosticCountry('Latin America')).toBeUndefined();
    expect(mapDiagnosticCountry('International (Other)')).toBeUndefined();
  });
});

describe('buildMaturityHandoffQuery', () => {
  it('builds a full query string when all three fields map', () => {
    const qs = buildMaturityHandoffQuery({ industry: 'Manufacturing', businessSize: 'SME', region: 'Saudi Arabia' });
    expect(qs).toBe('/maturity?industry=manufacturing&size=sme&country=ksa');
  });

  it('omits country when the region has no mapped module, keeping industry/size', () => {
    const qs = buildMaturityHandoffQuery({ industry: 'Retail', businessSize: 'Enterprise', region: 'North America' });
    expect(qs).toBe('/maturity?industry=retail&size=enterprise');
  });

  it('falls back to a bare /maturity link when nothing maps', () => {
    const qs = buildMaturityHandoffQuery({ industry: 'Nonsense', businessSize: 'Nonsense', region: 'Nonsense' });
    expect(qs).toBe('/maturity');
  });
});
