import { describe, it, expect } from 'vitest';
import { saudizationShortfall } from './saudizationTargets';
describe('saudizationShortfall', () => {
  it('HRSD ICT guide example: 10 workers, 2 Saudis, 25% -> need 1 more (2.5 rounds up to 3)', () => {
    expect(saudizationShortfall('ict', 10, 2)).toEqual({ required: 1, target: 3, bound: true, compliant: false });
  });
  it('group of 4 is exempt; group of 5 is bound', () => {
    expect(saudizationShortfall('ict', 4, 0).bound).toBe(false);
    expect(saudizationShortfall('ict', 5, 0).required).toBe(1);
  });
  it('never negative, clamps bad input, boundaries', () => {
    expect(saudizationShortfall('ict', 10, 9).required).toBe(0);
    expect(saudizationShortfall('ict', 0, 5).required).toBe(0);
    expect(saudizationShortfall('ict', -3, -1).required).toBe(0);
    expect(saudizationShortfall('consulting-p1', 20, 0).required).toBe(7);
    expect(saudizationShortfall('consulting-p2', 20, 0).required).toBe(8);
    expect(saudizationShortfall('engineering', 10, 0).target).toBe(3);
  });
});
