import { describe, it, expect } from 'vitest';
import { makeLesson, findPastExperience, capCases, eraseOrArchive, isArchived, normName, FIELD_MAX, type Lesson } from './deskLessons';

const L = (over: Partial<Lesson> = {}): Lesson => ({ outcome: 'held', expected: '', happened: 'x', why: 'other', whyNote: '', repeat: '', change: '', evidence: 'client-reported', closedAt: '2026-11-01T00:00:00.000Z', ...over });
const C = (key: string, supplier: string, quadrant = 'leverage', lesson?: Lesson, archivedAt?: string) => ({ clientKey: key, name: supplier, data: { supplier, quadrant, lesson, archivedAt } });

describe('makeLesson', () => {
  it('needs an outcome', () => { expect(makeLesson({ happened: 'x' }, 'n')).toBeNull(); });
  it('needs at least one of happened, repeat, change', () => { expect(makeLesson({ outcome: 'held' }, 'n')).toBeNull(); });
  it('accepts a minimal valid lesson and marks it client-reported', () => {
    const l = makeLesson({ outcome: 'improved', repeat: 'Show the alternative' }, '2026-11-06T00:00:00.000Z');
    expect(l).not.toBeNull();
    expect(l?.evidence).toBe('client-reported');
    expect(l?.why).toBe('other');
    expect(l?.closedAt).toBe('2026-11-06T00:00:00.000Z');
  });
  it('rejects unknown outcome values and falls back for unknown why', () => {
    expect(makeLesson({ outcome: 'great', happened: 'x' }, 'n')).toBeNull();
    expect(makeLesson({ outcome: 'held', happened: 'x', why: 'nonsense' }, 'n')?.why).toBe('other');
  });
  it('trims and clips text at the boundary', () => {
    const long = 'a'.repeat(FIELD_MAX + 50);
    const l = makeLesson({ outcome: 'held', happened: `  ${long}  ` }, 'n');
    expect(l?.happened.length).toBe(FIELD_MAX);
    expect(makeLesson({ outcome: 'held', happened: 'a'.repeat(FIELD_MAX) }, 'n')?.happened.length).toBe(FIELD_MAX);
  });
  it('ignores non-string text input', () => { expect(makeLesson({ outcome: 'held', happened: 5, repeat: 'ok' }, 'n')?.happened).toBe(''); });
});

describe('findPastExperience', () => {
  it('returns nothing without a supplier name', () => {
    expect(findPastExperience({ supplier: '  ', quadrant: 'leverage' }, [C('a', 'Acme', 'leverage', L())])).toEqual({ primary: null, alternative: null });
  });
  it('ignores cases without a lesson', () => {
    expect(findPastExperience({ supplier: 'Acme', quadrant: 'leverage' }, [C('a', 'Acme')])).toEqual({ primary: null, alternative: null });
  });
  it('matches the same supplier ignoring case and spacing, most recent first', () => {
    const older = C('a', 'Acme  Packaging', 'leverage', L({ closedAt: '2026-01-01T00:00:00.000Z' }));
    const newer = C('b', 'acme packaging', 'leverage', L({ closedAt: '2026-06-01T00:00:00.000Z' }));
    expect(findPastExperience({ supplier: 'ACME PACKAGING', quadrant: 'leverage' }, [older, newer]).primary?.clientKey).toBe('b');
  });
  it('offers a different-supplier, same-quadrant alternative that is not the primary', () => {
    const p = C('p', 'Acme', 'leverage', L({ closedAt: '2026-05-01T00:00:00.000Z' }));
    const alt = C('alt', 'Other Co', 'leverage', L({ closedAt: '2026-04-01T00:00:00.000Z' }));
    const wrongQuad = C('wq', 'Third', 'strategic', L({ closedAt: '2026-06-01T00:00:00.000Z' }));
    const r = findPastExperience({ supplier: 'Acme', quadrant: 'leverage' }, [wrongQuad, alt, p]);
    expect(r.primary?.clientKey).toBe('p');
    expect(r.alternative?.clientKey).toBe('alt');
  });
  it('includes archived cases', () => {
    const arch = C('z', 'Acme', 'leverage', L(), '2026-07-01T00:00:00.000Z');
    expect(findPastExperience({ supplier: 'Acme', quadrant: 'leverage' }, [arch]).primary?.clientKey).toBe('z');
  });
  it('normName collapses whitespace', () => { expect(normName('  A   B ')).toBe('a b'); });
});

describe('capCases and archive', () => {
  it('caps active and archived separately', () => {
    const list = [...Array.from({ length: 25 }, (_, i) => C(`a${i}`, `S${i}`)), ...Array.from({ length: 90 }, (_, i) => C(`z${i}`, `Z${i}`, 'leverage', L(), 'd'))];
    const out = capCases(list, 19, 80);
    expect(out.filter(c => !isArchived(c)).length).toBe(19);
    expect(out.filter(isArchived).length).toBe(80);
  });
  it('exact boundary keeps everything', () => {
    const list = Array.from({ length: 19 }, (_, i) => C(`a${i}`, `S${i}`));
    expect(capCases(list, 19, 80).length).toBe(19);
  });
  it('erasing a case with a lesson archives it; without a lesson removes it; others untouched', () => {
    const list = [C('keep', 'K'), C('withLesson', 'W', 'leverage', L()), C('plain', 'P')];
    const a = eraseOrArchive(list, 'withLesson', '2026-11-06T00:00:00.000Z');
    expect(a.length).toBe(3);
    expect(a.find(c => c.clientKey === 'withLesson')?.data.archivedAt).toBe('2026-11-06T00:00:00.000Z');
    const b = eraseOrArchive(list, 'plain', 'n');
    expect(b.map(c => c.clientKey)).toEqual(['keep', 'withLesson']);
    expect(eraseOrArchive(list, 'missing', 'n').length).toBe(3);
  });
});
