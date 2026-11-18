import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { riskBand, RISK_BAND_MIN } from './riskBands';

/**
 * Drift guard (#878d). Every screen that shows a risk band must read the shared
 * band file, never keep its own numbers. When the Risk and Resilience Engine
 * (RM-03, RM-04) is built, add its files to GUARDED below.
 */
const GUARDED = [
  '../pages/RiskManagement.tsx',
  '../components/toolkit/RiskTools.tsx',
  './riskPageData.ts',
];

describe('risk band drift guard (#878d)', () => {
  it.each(GUARDED)('%s imports the shared band file', (rel) => {
    const src = readFileSync(resolve(__dirname, rel), 'utf8');
    expect(src).toMatch(/from ['"](@\/lib\/riskBands|\.\/riskBands)['"]/);
  });
  it.each(GUARDED)('%s keeps no band numbers of its own', (rel) => {
    const src = readFileSync(resolve(__dirname, rel), 'utf8');
    expect(src).not.toMatch(/[sS]core\s*>=?\s*(5|6|10|12|15|20)\b/);
    expect(src).not.toMatch(/\b(l|i)\s*\*\s*(l|i)\s*>=?\s*\d+/);
  });
  it('the shared file is still 15 / 10 / 5', () => {
    expect(RISK_BAND_MIN).toEqual({ critical: 15, high: 10, medium: 5 });
    expect(riskBand(15)).toBe('critical');
    expect(riskBand(4)).toBe('low');
  });
});
