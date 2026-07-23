/**
 * Unit tests for the Supply Chain Maturity Assessment scoring helpers.
 *
 * Covers:
 *  - segScore: all answered, partial (null), mixed levels
 *  - overallScore: mean of all eight segment scores, partial-segment handling
 *  - getLevel: every boundary condition across the five maturity levels
 *  - Recommendation text resolves to the correct level for each of the
 *    five maturity labels
 */

import { describe, it, expect } from 'vitest';
import {
  MATURITY_LEVELS,
  getLevel,
  segScore,
  overallScore,
} from './maturityScoring';

/* ══════════════════════════════════════════════════════════════════════════
   segScore
══════════════════════════════════════════════════════════════════════════ */

describe('segScore', () => {
  it('returns the mean when all five questions are answered', () => {
    // All level-3 answers for segment 0 → mean = 3
    const answers = { '0-0': 3, '0-1': 3, '0-2': 3, '0-3': 3, '0-4': 3 };
    expect(segScore(answers, 0)).toBe(3);
  });

  it('returns null when no questions are answered', () => {
    expect(segScore({}, 0)).toBeNull();
  });

  it('returns null when only some questions are answered (partial)', () => {
    // Only 4 of 5 answered
    const answers = { '0-0': 2, '0-1': 3, '0-2': 4, '0-3': 1 };
    expect(segScore(answers, 0)).toBeNull();
  });

  it('returns null when only one question is answered', () => {
    expect(segScore({ '0-2': 5 }, 0)).toBeNull();
  });

  it('computes the correct mean for mixed level answers', () => {
    // 1 + 2 + 3 + 4 + 5 = 15 / 5 = 3
    const answers = { '0-0': 1, '0-1': 2, '0-2': 3, '0-3': 4, '0-4': 5 };
    expect(segScore(answers, 0)).toBe(3);
  });

  it('returns 1.0 when all answers are at the lowest level', () => {
    const answers = { '0-0': 1, '0-1': 1, '0-2': 1, '0-3': 1, '0-4': 1 };
    expect(segScore(answers, 0)).toBe(1);
  });

  it('returns 5.0 when all answers are at the highest level', () => {
    const answers = { '0-0': 5, '0-1': 5, '0-2': 5, '0-3': 5, '0-4': 5 };
    expect(segScore(answers, 0)).toBe(5);
  });

  it('uses the correct segment index — does not bleed across segments', () => {
    // Segment 0 is incomplete; segment 1 is complete
    const answers = {
      '0-0': 4, '0-1': 4, // only 2 of 5 for seg 0
      '1-0': 2, '1-1': 2, '1-2': 2, '1-3': 2, '1-4': 2,
    };
    expect(segScore(answers, 0)).toBeNull();
    expect(segScore(answers, 1)).toBe(2);
  });

  it('returns a decimal mean for non-integer averages', () => {
    // 1 + 2 + 3 + 4 + 4 = 14 / 5 = 2.8
    const answers = { '2-0': 1, '2-1': 2, '2-2': 3, '2-3': 4, '2-4': 4 };
    expect(segScore(answers, 2)).toBeCloseTo(2.8);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   overallScore
══════════════════════════════════════════════════════════════════════════ */

describe('overallScore', () => {
  const NUM_SEGMENTS = 8;

  /** Build an answer map where every question in every segment has `val`. */
  function allAnswers(val: number): Record<string, number> {
    const answers: Record<string, number> = {};
    for (let s = 0; s < NUM_SEGMENTS; s++) {
      for (let q = 0; q < 5; q++) {
        answers[`${s}-${q}`] = val;
      }
    }
    return answers;
  }

  it('returns the mean across all eight segments when fully answered', () => {
    // All answers = 3 → each segScore = 3 → overall = 3
    expect(overallScore(allAnswers(3), NUM_SEGMENTS)).toBe(3);
  });

  it('equals the arithmetic mean of the eight individual segment scores', () => {
    // Give each segment a distinct uniform score 1–8 (segment i → value i+1, clamped to 5)
    // Segments: 1,2,3,4,5,5,5,5  mean = (1+2+3+4+5+5+5+5)/8 = 30/8 = 3.75
    const answers: Record<string, number> = {};
    [1, 2, 3, 4, 5, 5, 5, 5].forEach((val, s) => {
      for (let q = 0; q < 5; q++) answers[`${s}-${q}`] = val;
    });
    expect(overallScore(answers, NUM_SEGMENTS)).toBeCloseTo(30 / 8);
  });

  it('treats an incomplete segment (null segScore) as 0', () => {
    // Only segment 0 answered (all 3s); segments 1–7 get 0 by fallback
    // overall = (3 + 0*7) / 8 = 0.375
    const answers: Record<string, number> = {
      '0-0': 3, '0-1': 3, '0-2': 3, '0-3': 3, '0-4': 3,
    };
    expect(overallScore(answers, NUM_SEGMENTS)).toBeCloseTo(3 / 8);
  });

  it('returns 0 when no segment is answered', () => {
    expect(overallScore({}, NUM_SEGMENTS)).toBe(0);
  });

  it('returns 5.0 when all segments are scored at 5', () => {
    expect(overallScore(allAnswers(5), NUM_SEGMENTS)).toBe(5);
  });

  it('returns 1.0 when all segments are scored at 1', () => {
    expect(overallScore(allAnswers(1), NUM_SEGMENTS)).toBe(1);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   getLevel — boundary conditions
══════════════════════════════════════════════════════════════════════════ */

describe('getLevel', () => {
  // Derived directly from MATURITY_LEVELS to stay in sync with the source data
  const levels = MATURITY_LEVELS as readonly { label: string; min: number; max: number }[];

  it('maps scores at each exact lower boundary to the correct level', () => {
    for (const level of levels) {
      expect(getLevel(level.min).label).toBe(level.label);
    }
  });

  it('maps scores at each exact upper boundary to the correct level', () => {
    for (const level of levels) {
      expect(getLevel(level.max).label).toBe(level.label);
    }
  });

  // --- Reactive (1.0 – 1.9) ---
  it('returns Reactive for score 1.0', () => expect(getLevel(1.0).label).toBe('Reactive'));
  it('returns Reactive for score 1.5', () => expect(getLevel(1.5).label).toBe('Reactive'));
  it('returns Reactive for score 1.9', () => expect(getLevel(1.9).label).toBe('Reactive'));

  // --- Aware (2.0 – 2.9) ---
  it('returns Aware for score 2.0', () => expect(getLevel(2.0).label).toBe('Aware'));
  it('returns Aware for score 2.5', () => expect(getLevel(2.5).label).toBe('Aware'));
  it('returns Aware for score 2.9', () => expect(getLevel(2.9).label).toBe('Aware'));

  // --- Defined (3.0 – 3.9) ---
  it('returns Defined for score 3.0', () => expect(getLevel(3.0).label).toBe('Defined'));
  it('returns Defined for score 3.5', () => expect(getLevel(3.5).label).toBe('Defined'));
  it('returns Defined for score 3.9', () => expect(getLevel(3.9).label).toBe('Defined'));

  // --- Managed (4.0 – 4.4) ---
  it('returns Managed for score 4.0', () => expect(getLevel(4.0).label).toBe('Managed'));
  it('returns Managed for score 4.2', () => expect(getLevel(4.2).label).toBe('Managed'));
  it('returns Managed for score 4.4', () => expect(getLevel(4.4).label).toBe('Managed'));

  // --- Optimised (4.5 – 5.0) ---
  it('returns Optimised for score 4.5', () => expect(getLevel(4.5).label).toBe('Optimised'));
  it('returns Optimised for score 4.8', () => expect(getLevel(4.8).label).toBe('Optimised'));
  it('returns Optimised for score 5.0', () => expect(getLevel(5.0).label).toBe('Optimised'));

  // --- Below-range fallback ---
  it('falls back to Reactive for a score below 1.0', () => {
    expect(getLevel(0).label).toBe('Reactive');
  });

  it('returns the correct level object structure (label, min, max, color, bg, text, border)', () => {
    const level = getLevel(3.5);
    expect(level).toHaveProperty('label');
    expect(level).toHaveProperty('labelAr');
    expect(level).toHaveProperty('min');
    expect(level).toHaveProperty('max');
    expect(level).toHaveProperty('color');
    expect(level).toHaveProperty('bg');
    expect(level).toHaveProperty('text');
    expect(level).toHaveProperty('border');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Recommendation text resolution
══════════════════════════════════════════════════════════════════════════ */

describe('recommendation text resolution', () => {
  /**
   * A representative minimal segment that mirrors the real SEGMENTS shape.
   * We verify that for every maturity level the correct recommendation is
   * returned when code does: `seg.recommendations[getLevel(score).label]`
   */
  const mockSegment = {
    recommendations: {
      Reactive:  'Recommendation for Reactive level.',
      Aware:     'Recommendation for Aware level.',
      Defined:   'Recommendation for Defined level.',
      Managed:   'Recommendation for Managed level.',
      Optimised: 'Recommendation for Optimised level.',
    },
    recommendationsAr: {
      Reactive:  'توصية للمستوى التفاعلي.',
      Aware:     'توصية للمستوى المُدرِك.',
      Defined:   'توصية للمستوى المُعرَّف.',
      Managed:   'توصية للمستوى المُدار.',
      Optimised: 'توصية للمستوى المُحسَّن.',
    },
  };

  const scoreForLevel: Record<string, number> = {
    Reactive:  1.5,
    Aware:     2.5,
    Defined:   3.5,
    Managed:   4.2,
    Optimised: 4.8,
  };

  for (const [levelLabel, score] of Object.entries(scoreForLevel)) {
    it(`resolves the '${levelLabel}' recommendation for score ${score}`, () => {
      const level = getLevel(score);
      expect(level.label).toBe(levelLabel);

      const rec   = mockSegment.recommendations[level.label as keyof typeof mockSegment.recommendations];
      const recAr = mockSegment.recommendationsAr[level.label as keyof typeof mockSegment.recommendationsAr];

      expect(rec).toBeTruthy();
      expect(recAr).toBeTruthy();
      expect(rec).toContain(levelLabel);
    });
  }

  it('every maturity level label maps to a non-empty recommendation string', () => {
    for (const level of MATURITY_LEVELS) {
      const rec = mockSegment.recommendations[level.label as keyof typeof mockSegment.recommendations];
      expect(typeof rec).toBe('string');
      expect(rec.length).toBeGreaterThan(0);
    }
  });
});
