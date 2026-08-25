import { describe, it, expect } from 'vitest';
import { CLM_SUB_SEGMENTS } from './maturitySubSegData1to5';
import { ITEM_42_QUESTIONS, applyItem42ComplianceQuestions } from './clmComplianceItem42';

function findClmCompliance() {
  const seg = CLM_SUB_SEGMENTS.find((s) => s.id === 'clm-compliance');
  if (!seg) throw new Error('clm-compliance sub-segment not found');
  return seg;
}

describe('ITEM_42_QUESTIONS', () => {
  it('has exactly 3 questions, each with 5 EN and 5 AR levels', () => {
    expect(ITEM_42_QUESTIONS).toHaveLength(3);
    for (const q of ITEM_42_QUESTIONS) {
      expect(q.q.length).toBeGreaterThan(0);
      expect(q.qAr.length).toBeGreaterThan(0);
      expect(q.levels).toHaveLength(5);
      expect(q.levelsAr).toHaveLength(5);
      for (const level of q.levels) expect(level.length).toBeGreaterThan(0);
      for (const level of q.levelsAr) expect(level.length).toBeGreaterThan(0);
    }
  });

  it('does not include per-question frameworks/evidence fields (not part of the real schema)', () => {
    for (const q of ITEM_42_QUESTIONS) {
      expect((q as Record<string, unknown>).frameworks).toBeUndefined();
      expect((q as Record<string, unknown>).evidence).toBeUndefined();
    }
  });

  it('covers CTL, GTPL/Etimad, and riba in that order', () => {
    expect(ITEM_42_QUESTIONS[0].q).toContain('Civil Transactions Law');
    expect(ITEM_42_QUESTIONS[1].q).toContain('GTPL');
    expect(ITEM_42_QUESTIONS[2].q).toContain('riba');
  });
});

describe('applyItem42ComplianceQuestions', () => {
  it('appends the 3 questions to the live clm-compliance sub-segment', () => {
    const beforeCount = findClmCompliance().questions.length;
    applyItem42ComplianceQuestions();
    const after = findClmCompliance().questions;
    expect(after.length).toBe(beforeCount + 3);
    expect(after.slice(-3).map((q) => q.q)).toEqual(ITEM_42_QUESTIONS.map((q) => q.q));
  });

  it('is idempotent -- calling it again does not duplicate the questions', () => {
    const before = findClmCompliance().questions.length;
    applyItem42ComplianceQuestions();
    applyItem42ComplianceQuestions();
    const after = findClmCompliance().questions.length;
    expect(after).toBe(before);
  });

  it('every appended question conforms to the 5-level schema used by the rest of clm-compliance', () => {
    applyItem42ComplianceQuestions();
    const seg = findClmCompliance();
    for (const q of seg.questions) {
      expect(q.levels).toHaveLength(5);
      expect(q.levelsAr).toHaveLength(5);
    }
  });
});
