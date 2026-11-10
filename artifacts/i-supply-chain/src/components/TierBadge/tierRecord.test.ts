import { describe, it, expect } from 'vitest';
import { validateTierRecord, parseIsoDate, toWesternDigits } from './tierRecord';

const now = new Date('2026-11-10T12:00:00Z');
const v = (r: Parameters<typeof validateTierRecord>[0]) => validateTierRecord(r, { now });

describe('validateTierRecord: Tier 1 (soft)', () => {
  it('expert route: basis + confirmer + date', () => {
    const r = v({ tier: 1, basis: 'Saudi procurement law', confirmedBy: 'Owner (SME)', confirmedOn: '2026-11-09' });
    expect(r.state).toBe('OK'); expect(r.route).toBe('expert'); expect(r.confirmedOn).toBe('2026-11-09');
  });
  it('source route: basis + opened source + date opened', () => {
    const r = v({ tier: 1, basis: 'Primary text', source: 'MoF regulation page', sourceOpenedOn: '2026-11-08' });
    expect(r.state).toBe('OK'); expect(r.route).toBe('source');
  });
  it('source route may use confirmedOn as the date', () => {
    expect(v({ tier: 1, basis: 'b', source: 's', confirmedOn: '2026-11-08' }).state).toBe('OK');
  });
});
describe('validateTierRecord: refusals (hardest)', () => {
  it('Tier 1 without basis', () => expect(v({ tier: 1, confirmedBy: 'A', confirmedOn: '2026-11-09' }).reasons).toContain('T1_NO_BASIS'));
  it('Tier 1 confirmer, no date', () => expect(v({ tier: 1, basis: 'b', confirmedBy: 'A' }).reasons).toContain('T1_NO_DATE'));
  it('Tier 1 date, no confirmer and no source', () => expect(v({ tier: 1, basis: 'b', confirmedOn: '2026-11-09' }).reasons).toContain('T1_NO_CONFIRMER_OR_OPENED_SOURCE'));
  it('Tier 1 whitespace-only values count as missing', () => {
    const r = v({ tier: 1, basis: '   ', confirmedBy: '  ', confirmedOn: ' ' });
    expect(r.state).toBe('INSUFFICIENT_DATA'); expect(r.reasons).toEqual(expect.arrayContaining(['T1_NO_BASIS', 'T1_NO_CONFIRMER_OR_OPENED_SOURCE']));
  });
  it('Tier 1 invalid date text is never guessed', () => {
    expect(v({ tier: 1, basis: 'b', confirmedBy: 'A', confirmedOn: '9 Nov 2026' }).reasons).toContain('T1_DATE_INVALID');
    expect(v({ tier: 1, basis: 'b', confirmedBy: 'A', confirmedOn: '2026-02-30' }).reasons).toContain('T1_DATE_INVALID');
  });
  it('Tier 1 future date refused', () => expect(v({ tier: 1, basis: 'b', confirmedBy: 'A', confirmedOn: '2026-11-11' }).reasons).toContain('T1_DATE_IN_FUTURE'));
  it('Tier 2 without source', () => { const r = v({ tier: 2, basis: 'b' }); expect(r.state).toBe('INSUFFICIENT_DATA'); expect(r.reasons).toEqual(['T2_NO_SOURCE']); });
  it('Tier 2 with a forbidden word in free text', () => {
    const r = v({ tier: 2, source: 'Law firm page: rule is confirmed' });
    expect(r.reasons).toContain('T2_FORBIDDEN_WORD'); expect(r.forbiddenFound).toEqual(['confirmed']);
  });
  it('Tier 2 forbidden word inside a possible answer', () => {
    expect(v({ tier: 2, source: 's', possibleAnswers: [{ text: 'It is compliant', vLevel: 'V2' }] }).reasons).toContain('T2_FORBIDDEN_WORD');
  });
  it('missing, null, 0, 4 and "1" tiers are INSUFFICIENT_DATA', () => {
    for (const t of [undefined, null, 0, 4, '1']) expect(v({ tier: t as never }).reasons).toEqual(['TIER_MISSING_OR_INVALID']);
    expect(v(null).state).toBe('INSUFFICIENT_DATA'); expect(v(undefined).state).toBe('INSUFFICIENT_DATA');
  });
  it('Tier 3 needs its prompt', () => {
    expect(validateTierRecord({ tier: 3 }, { now, tier3PromptAvailable: false }).reasons).toEqual(['T3_NO_PROMPT']);
    expect(v({ tier: 3 }).state).toBe('OK');
  });
});
describe('validateTierRecord: boundary', () => {
  it('today is allowed, tomorrow is not', () => {
    expect(v({ tier: 1, basis: 'b', confirmedBy: 'A', confirmedOn: '2026-11-10' }).state).toBe('OK');
    expect(v({ tier: 1, basis: 'b', confirmedBy: 'A', confirmedOn: '2026-11-11' }).state).toBe('INSUFFICIENT_DATA');
  });
  it('leap day valid and invalid', () => {
    expect(parseIsoDate('2024-02-29')).toEqual({ ok: true, iso: '2024-02-29' });
    expect(parseIsoDate('2025-02-29')).toMatchObject({ ok: false });
  });
  it('Arabic-Indic digits are normalised to Western', () => {
    expect(toWesternDigits('٢٠٢٦-١١-٠٩')).toBe('2026-11-09');
    expect(parseIsoDate('٢٠٢٦-١١-٠٩')).toEqual({ ok: true, iso: '2026-11-09' });
  });
  it('Date objects and ISO date-times are accepted', () => {
    expect(parseIsoDate(new Date('2026-11-09T10:00:00Z'))).toEqual({ ok: true, iso: '2026-11-09' });
    expect(parseIsoDate('2026-11-09T10:00:00Z')).toEqual({ ok: true, iso: '2026-11-09' });
    expect(parseIsoDate(new Date('x'))).toMatchObject({ ok: false });
  });
  it('Tier 2 / 3 warnings, not refusals, for missing possible answers', () => {
    expect(v({ tier: 2, source: 's' }).warnings).toContain('T2_NO_POSSIBLE_ANSWERS');
    expect(v({ tier: 3 }).warnings).toContain('T3_NO_POSSIBLE_ANSWERS');
  });
  it('Tier 2 with a confirmer: valid but confirmer ignored (warning)', () => {
    const r = v({ tier: 2, source: 's', confirmedBy: 'X' }); expect(r.state).toBe('OK'); expect(r.warnings).toContain('T2_CONFIRMER_IGNORED');
  });
  it('very long text does not throw', () => {
    const long = 'x'.repeat(50000);
    expect(v({ tier: 2, source: long, basis: long }).state).toBe('OK');
  });
});

describe('ANSWER_NO_SOURCE_OR_VLEVEL warning (v2; test 264)', () => {
  const now = new Date('2026-11-10T12:00:00Z');
  const base2 = { tier: 2 as const, basis: 'b', source: 's', sourceOpenedOn: '2026-11-09' };
  it('Tier 2 or Tier 3 answer with no source or no V level: warning, state stays OK', () => {
    for (const a of [{ text: 'x', vLevel: 'V2' }, { text: 'x', source: 's' }, 'plain']) {
      const r2 = validateTierRecord({ ...base2, possibleAnswers: [a] }, { now });
      expect(r2.state).toBe('OK'); expect(r2.warnings).toContain('ANSWER_NO_SOURCE_OR_VLEVEL');
      const r3 = validateTierRecord({ tier: 3, possibleAnswers: [a] }, { now });
      expect(r3.state).toBe('OK'); expect(r3.warnings).toContain('ANSWER_NO_SOURCE_OR_VLEVEL');
    }
  });
  it('complete answers and blank answers give no such warning', () => {
    expect(validateTierRecord({ ...base2, possibleAnswers: [{ text: 'x', source: 's', vLevel: 'V1' }] }, { now }).warnings).not.toContain('ANSWER_NO_SOURCE_OR_VLEVEL');
    expect(validateTierRecord({ tier: 3, possibleAnswers: ['', { text: ' ' }] }, { now }).warnings).not.toContain('ANSWER_NO_SOURCE_OR_VLEVEL');
  });
});
