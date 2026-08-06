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
  subSegScore,
  weightedSegScore,
  weightedOverallScore,
  countCoveredSubSegments,
  type SubSegmentLike,
  type SegmentLike,
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

  // Picker scope: custom questionIndices subset
  it('scores only the selected question indices when a subset is provided', () => {
    // Segment 0: q0=5, q2=3, q4=1 answered; q1 and q3 not in scope
    const answers = { '0-0': 5, '0-1': 99, '0-2': 3, '0-3': 99, '0-4': 1 };
    // Selected: [0, 2, 4] → values [5, 3, 1] → mean = 3
    expect(segScore(answers, 0, [0, 2, 4])).toBeCloseTo(3);
  });

  it('returns null for a partial subset (some selected questions unanswered)', () => {
    // Only q0 answered; q2 missing → incomplete
    const answers = { '0-0': 5 };
    expect(segScore(answers, 0, [0, 2])).toBeNull();
  });

  it('returns null — not NaN — when questionIndices is empty (segment excluded from scope)', () => {
    // A segment with zero selected sub-dimensions should be treated as excluded/incomplete,
    // never produce NaN that would corrupt overall scoring.
    const answers = { '0-0': 5, '0-1': 4, '0-2': 3, '0-3': 2, '0-4': 1 };
    const result = segScore(answers, 0, []);
    expect(result).toBeNull();
    // Explicitly guard against NaN — this was the crash path before the fix
    expect(result).not.toBeNaN();
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

  it('excludes incomplete segments from the average (partial-data case)', () => {
    // Only segment 0 answered (all 3s); segments 1–7 are unanswered (null)
    // The null segments are excluded, so overall = 3 / 1 = 3
    const answers: Record<string, number> = {
      '0-0': 3, '0-1': 3, '0-2': 3, '0-3': 3, '0-4': 3,
    };
    expect(overallScore(answers, NUM_SEGMENTS)).toBeCloseTo(3);
  });

  it('averages only the completed segments when some are incomplete', () => {
    // Segments 0 and 1 complete (scores 2 and 4); segments 2–7 unanswered
    // overall = (2 + 4) / 2 = 3
    const answers: Record<string, number> = {
      '0-0': 2, '0-1': 2, '0-2': 2, '0-3': 2, '0-4': 2,
      '1-0': 4, '1-1': 4, '1-2': 4, '1-3': 4, '1-4': 4,
    };
    expect(overallScore(answers, NUM_SEGMENTS)).toBeCloseTo(3);
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
   Draft restoration — results page score accuracy
   These tests mirror the two scenarios that can occur when a returning user
   has their answers rehydrated from a saved draft:

   Scenario A: all 8 segments were previously completed.
     → The redirect guard (which checks for any null segScore) must NOT fire,
       and the displayed overallScore must equal the plain arithmetic mean of
       the 8 individual segment scores.

   Scenario B: fewer than 8 segments were answered before the draft was saved.
     → At least one segScore is null, so the redirect guard MUST fire and
       send the user back to the assessment rather than showing a deflated
       (or misleadingly partial) score.
══════════════════════════════════════════════════════════════════════════ */

describe('draft restoration — all 8 segments complete', () => {
  const NUM_SEGMENTS = 8;

  /**
   * Build an answer map that assigns a specific uniform value to every
   * question within one segment, leaving all other segments at the same
   * default value.
   */
  function buildAnswers(segValues: number[]): Record<string, number> {
    const answers: Record<string, number> = {};
    segValues.forEach((val, s) => {
      for (let q = 0; q < 5; q++) {
        answers[`${s}-${q}`] = val;
      }
    });
    return answers;
  }

  it('no segment score is null — redirect guard would not fire', () => {
    // Each segment has a distinct uniform score; all 8 are fully answered.
    const segValues = [1, 2, 3, 4, 5, 3, 2, 4];
    const answers   = buildAnswers(segValues);

    for (let i = 0; i < NUM_SEGMENTS; i++) {
      expect(segScore(answers, i)).not.toBeNull();
    }
  });

  it('overallScore equals the arithmetic mean of all 8 individual segment scores', () => {
    // Assign each segment a distinct uniform level so the expected mean is
    // easy to compute by hand: (1+2+3+4+5+3+2+4) / 8 = 24 / 8 = 3
    const segValues    = [1, 2, 3, 4, 5, 3, 2, 4];
    const answers      = buildAnswers(segValues);

    // Independently compute the expected mean from the per-segment scores.
    const expectedMean = segValues.reduce((a, b) => a + b, 0) / NUM_SEGMENTS; // 3

    expect(overallScore(answers, NUM_SEGMENTS)).toBeCloseTo(expectedMean);
  });

  it('displayed overallScore matches arithmetic mean for varied segment scores', () => {
    // Scores that produce a non-trivial mean: (2+3+4+5+1+2+3+4)/8 = 24/8 = 3
    const segValues    = [2, 3, 4, 5, 1, 2, 3, 4];
    const answers      = buildAnswers(segValues);

    const segScores    = segValues.map((_, i) => segScore(answers, i) as number);
    const expectedMean = segScores.reduce((a, b) => a + b, 0) / segScores.length;

    expect(overallScore(answers, NUM_SEGMENTS)).toBeCloseTo(expectedMean);
  });

  it('overallScore with all segments at 5 equals 5 (restored perfect draft)', () => {
    const answers = buildAnswers([5, 5, 5, 5, 5, 5, 5, 5]);
    expect(overallScore(answers, NUM_SEGMENTS)).toBe(5);
  });

  it('overallScore with all segments at 1 equals 1 (restored lowest-level draft)', () => {
    const answers = buildAnswers([1, 1, 1, 1, 1, 1, 1, 1]);
    expect(overallScore(answers, NUM_SEGMENTS)).toBe(1);
  });
});

describe('draft restoration — incomplete segments trigger redirect guard', () => {
  const NUM_SEGMENTS = 8;

  it('a draft with only 7 complete segments has at least one null segScore', () => {
    // Segments 0–6 are fully answered; segment 7 has only 4 of 5 answers.
    const answers: Record<string, number> = {};
    for (let s = 0; s < 7; s++) {
      for (let q = 0; q < 5; q++) answers[`${s}-${q}`] = 3;
    }
    // Segment 7: only 4 of 5 answered — incomplete
    answers['7-0'] = 2; answers['7-1'] = 3; answers['7-2'] = 4; answers['7-3'] = 1;

    const incompleteSegments = Array.from({ length: NUM_SEGMENTS }, (_, i) => i)
      .filter(i => segScore(answers, i) === null);

    // The redirect guard fires on firstIncomplete !== -1
    expect(incompleteSegments.length).toBeGreaterThan(0);
    // Exactly segment 7 is incomplete
    expect(incompleteSegments).toEqual([7]);
  });

  it('a draft with only 4 complete segments leaves 4 null scores for the guard', () => {
    // Only segments 0–3 are complete; 4–7 are empty.
    const answers: Record<string, number> = {};
    for (let s = 0; s < 4; s++) {
      for (let q = 0; q < 5; q++) answers[`${s}-${q}`] = 3;
    }

    const nullCount = Array.from({ length: NUM_SEGMENTS }, (_, i) => i)
      .filter(i => segScore(answers, i) === null).length;

    expect(nullCount).toBe(4);
  });

  it('a draft with 0 complete segments means all 8 segScores are null', () => {
    // Only partial answers for segment 0; nothing else answered.
    const answers = { '0-0': 2, '0-1': 3 };

    const nullCount = Array.from({ length: NUM_SEGMENTS }, (_, i) => i)
      .filter(i => segScore(answers, i) === null).length;

    expect(nullCount).toBe(NUM_SEGMENTS);
  });

  it('overallScore does not include the incomplete segment in its average', () => {
    // Segments 0–6 complete at score 4; segment 7 incomplete.
    const answers: Record<string, number> = {};
    for (let s = 0; s < 7; s++) {
      for (let q = 0; q < 5; q++) answers[`${s}-${q}`] = 4;
    }
    // Segment 7: only 3 of 5 answered
    answers['7-0'] = 1; answers['7-1'] = 1; answers['7-2'] = 1;

    // overallScore excludes the null segment — result is mean of 7 × 4 = 4
    expect(overallScore(answers, NUM_SEGMENTS)).toBeCloseTo(4);
  });

  it('the first incomplete segment index matches what the redirect guard would use', () => {
    // Segments 0 and 1 complete; segment 2 is the first gap.
    const answers: Record<string, number> = {};
    for (let q = 0; q < 5; q++) { answers[`0-${q}`] = 3; answers[`1-${q}`] = 3; }
    answers['2-0'] = 2; // only 1 of 5 for seg 2 — incomplete

    // Mirror the guard: SEGMENTS.findIndex((_, i) => calcSegScore(answers, i) === null)
    const firstIncomplete = Array.from({ length: NUM_SEGMENTS }, (_, i) => i)
      .find(i => segScore(answers, i) === null);

    expect(firstIncomplete).toBe(2);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   In-session edit path — user navigates back, changes an answer, returns
   to the results page.

   Scenario A: A single answer change in one segment updates overallScore
     to the new correct arithmetic mean without zeroing any other segment.

   Scenario B: A single answer change never makes any segment score null
     (the redirect guard must not fire after a valid answer edit).
══════════════════════════════════════════════════════════════════════════ */

describe('in-session edit — overallScore updates correctly after an answer changes', () => {
  const NUM_SEGMENTS = 8;

  /** Build a fully-complete answer map with every question set to `val`. */
  function allAnswers(val: number): Record<string, number> {
    const answers: Record<string, number> = {};
    for (let s = 0; s < NUM_SEGMENTS; s++) {
      for (let q = 0; q < 5; q++) {
        answers[`${s}-${q}`] = val;
      }
    }
    return answers;
  }

  it('overallScore changes to the new arithmetic mean after one answer is mutated', () => {
    // Start: all 8 segments uniformly at 3 → overallScore = 3
    const answers = allAnswers(3);
    expect(overallScore(answers, NUM_SEGMENTS)).toBe(3);

    // Edit: change all 5 questions in segment 0 to 5 (simulates user raising
    // every answer in the first segment).
    for (let q = 0; q < 5; q++) answers[`0-${q}`] = 5;

    // Segment 0 score is now 5; segments 1–7 remain 3.
    // New mean: (5 + 3*7) / 8 = (5 + 21) / 8 = 26 / 8 = 3.25
    expect(overallScore(answers, NUM_SEGMENTS)).toBeCloseTo(26 / 8);
  });

  it('mutating a single question in one segment reflects in overallScore', () => {
    // All segments at 3; then raise one question in segment 2 from 3 → 5.
    // Segment 2 new score: (3+3+5+3+3)/5 = 17/5 = 3.4
    // Overall: (3*7 + 3.4) / 8 = (21 + 3.4) / 8 = 24.4 / 8 = 3.05
    const answers = allAnswers(3);
    answers['2-2'] = 5;

    const seg2Score = (3 + 3 + 5 + 3 + 3) / 5; // 3.4
    const expectedMean = (3 * 7 + seg2Score) / 8;

    expect(overallScore(answers, NUM_SEGMENTS)).toBeCloseTo(expectedMean);
  });

  it('lowering answers in one segment reduces overallScore accordingly', () => {
    // All segments at 4; then lower segment 5 to all 2s.
    // New overall: (4*7 + 2) / 8 = (28 + 2) / 8 = 30 / 8 = 3.75
    const answers = allAnswers(4);
    for (let q = 0; q < 5; q++) answers[`5-${q}`] = 2;

    expect(overallScore(answers, NUM_SEGMENTS)).toBeCloseTo(30 / 8);
  });
});

describe('in-session edit — redirect guard does not fire after a valid answer change', () => {
  const NUM_SEGMENTS = 8;

  /** Build a fully-complete answer map with every question set to `val`. */
  function allAnswers(val: number): Record<string, number> {
    const answers: Record<string, number> = {};
    for (let s = 0; s < NUM_SEGMENTS; s++) {
      for (let q = 0; q < 5; q++) {
        answers[`${s}-${q}`] = val;
      }
    }
    return answers;
  }

  it('no segment score becomes null when a single answer is changed to another valid value', () => {
    const answers = allAnswers(3);
    // User edits one answer in segment 4 from 3 to 1 — still a valid (non-zero) value.
    answers['4-2'] = 1;

    for (let i = 0; i < NUM_SEGMENTS; i++) {
      expect(segScore(answers, i)).not.toBeNull();
    }
  });

  it('redirect guard logic (firstIncomplete === -1) still passes after editing multiple segments', () => {
    // Start complete, then edit answers across three different segments.
    const answers = allAnswers(3);
    answers['0-0'] = 5;
    answers['3-4'] = 2;
    answers['7-1'] = 4;

    const firstIncomplete = Array.from({ length: NUM_SEGMENTS }, (_, i) => i)
      .find(i => segScore(answers, i) === null);

    // undefined means no incomplete segment — the guard would NOT redirect.
    expect(firstIncomplete).toBeUndefined();
  });

  it('editing every question in one segment to a different valid value keeps that segment non-null', () => {
    const answers = allAnswers(2);
    // Overwrite all of segment 6 with varied but all-valid values.
    answers['6-0'] = 1;
    answers['6-1'] = 3;
    answers['6-2'] = 5;
    answers['6-3'] = 2;
    answers['6-4'] = 4;

    expect(segScore(answers, 6)).not.toBeNull();
    // All other segments should also be non-null.
    for (let i = 0; i < NUM_SEGMENTS; i++) {
      expect(segScore(answers, i)).not.toBeNull();
    }
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

/* ══════════════════════════════════════════════════════════════════════════
   subSegScore — sub-segment scoring via 3-part answer keys
   Answer key format: "{segIdx}-{subIdx}-{qIdx}"
══════════════════════════════════════════════════════════════════════════ */

describe('subSegScore', () => {
  it('returns the mean when all questions in the sub-segment are answered', () => {
    // Segment 0, sub-segment 1, 2 questions — both answered 4
    const answers = { '0-1-0': 4, '0-1-1': 4 };
    expect(subSegScore(answers, 0, 1, 2)).toBe(4);
  });

  it('returns null when no questions are answered', () => {
    expect(subSegScore({}, 0, 0, 2)).toBeNull();
  });

  it('returns null when only some questions are answered (partial)', () => {
    // 1 of 2 questions answered
    const answers = { '0-0-0': 3 };
    expect(subSegScore(answers, 0, 0, 2)).toBeNull();
  });

  it('returns null when questionCount is 0', () => {
    expect(subSegScore({}, 0, 0, 0)).toBeNull();
  });

  it('computes the correct mean for a single question sub-segment', () => {
    const answers = { '2-3-0': 5 };
    expect(subSegScore(answers, 2, 3, 1)).toBe(5);
  });

  it('computes the correct mean for mixed-level answers', () => {
    // (1 + 3 + 5) / 3 = 3
    const answers = { '1-0-0': 1, '1-0-1': 3, '1-0-2': 5 };
    expect(subSegScore(answers, 1, 0, 3)).toBeCloseTo(3);
  });

  it('does not bleed across segment or sub-segment boundaries', () => {
    // Only seg 0 / sub 0 answered; seg 0 / sub 1 and seg 1 / sub 0 unanswered
    const answers = { '0-0-0': 4, '0-0-1': 4 };
    expect(subSegScore(answers, 0, 0, 2)).toBe(4);     // answered
    expect(subSegScore(answers, 0, 1, 2)).toBeNull();  // different sub
    expect(subSegScore(answers, 1, 0, 2)).toBeNull();  // different seg
  });

  it('returns 1.0 when all answers are at the lowest level', () => {
    const answers = { '0-0-0': 1, '0-0-1': 1, '0-0-2': 1 };
    expect(subSegScore(answers, 0, 0, 3)).toBe(1);
  });

  it('returns 5.0 when all answers are at the highest level', () => {
    const answers = { '0-0-0': 5, '0-0-1': 5 };
    expect(subSegScore(answers, 0, 0, 2)).toBe(5);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   weightedSegScore & weightedOverallScore — industry-weighted path
   Pharma fixture:
     Sub-segment 0: 2 questions, pharma weight = 1.5
     Sub-segment 1: 2 questions, pharma weight = 0.5
     Answers (seg 0): sub0 → [4, 4] → score 4.0
                      sub1 → [2, 2] → score 2.0
     Expected weighted mean = (4.0×1.5 + 2.0×0.5) / (1.5+0.5) = 7/2 = 3.5
══════════════════════════════════════════════════════════════════════════ */

/** Build a SubSegmentLike stub with `questionCount` questions and given weights. */
function makeSubSeg(questionCount: number, weights: Record<string, number>): SubSegmentLike {
  return {
    questions: Array.from({ length: questionCount }, () => ({})),
    industryWeights: weights,
  };
}

describe('weightedSegScore', () => {
  const pharmaAnswers: Record<string, number> = {
    // Segment 0, sub-segment 0 (2 questions)
    '0-0-0': 4, '0-0-1': 4,
    // Segment 0, sub-segment 1 (2 questions)
    '0-1-0': 2, '0-1-1': 2,
  };

  const pharmaSegment: SegmentLike = {
    subSegments: [
      makeSubSeg(2, { pharma: 1.5, retail: 0.8 }),
      makeSubSeg(2, { pharma: 0.5 }),
    ],
  };

  it('returns the industry-weighted mean of completed sub-segments (pharma fixture)', () => {
    // (4.0×1.5 + 2.0×0.5) / (1.5+0.5) = 7/2 = 3.5
    expect(weightedSegScore(pharmaAnswers, pharmaSegment, 0, 'pharma')).toBeCloseTo(3.5);
  });

  it('applies default weight 1.0 for an industry not in the weights map', () => {
    // sub0 score=4.0, weight=1.0 (default); sub1 score=2.0, weight=1.0 (default)
    // weighted mean = (4.0+2.0)/2 = 3.0
    expect(weightedSegScore(pharmaAnswers, pharmaSegment, 0, 'oil_gas')).toBeCloseTo(3.0);
  });

  it('uses the correct industry weight for retail (sub0=0.8, sub1=1.0 default)', () => {
    // sub0 weight 0.8, sub1 weight 1.0 (default — retail not in sub1 weights)
    // (4.0×0.8 + 2.0×1.0) / (0.8+1.0) = (3.2+2.0)/1.8 = 5.2/1.8 ≈ 2.889
    const expected = (4.0 * 0.8 + 2.0 * 1.0) / (0.8 + 1.0);
    expect(weightedSegScore(pharmaAnswers, pharmaSegment, 0, 'retail')).toBeCloseTo(expected);
  });

  it('returns null when no sub-segment answers exist', () => {
    expect(weightedSegScore({}, pharmaSegment, 0, 'pharma')).toBeNull();
  });

  it('returns null for a segment with no subSegments', () => {
    expect(weightedSegScore(pharmaAnswers, {}, 0, 'pharma')).toBeNull();
    expect(weightedSegScore(pharmaAnswers, { subSegments: [] }, 0, 'pharma')).toBeNull();
  });

  it('excludes partially-answered sub-segments from the weighted mean', () => {
    // Only sub-segment 0 is fully answered; sub-segment 1 has only 1 of 2 questions
    const partialAnswers: Record<string, number> = {
      '0-0-0': 4, '0-0-1': 4,  // sub0 complete → score 4.0
      '0-1-0': 2,               // sub1 partial → excluded
    };
    // Only sub0 contributes: weighted mean = 4.0 (sole contributor)
    expect(weightedSegScore(partialAnswers, pharmaSegment, 0, 'pharma')).toBeCloseTo(4.0);
  });

  it('returns null when all sub-segments are only partially answered', () => {
    const partialAnswers = { '0-0-0': 4, '0-1-0': 2 }; // 1 of 2 each
    expect(weightedSegScore(partialAnswers, pharmaSegment, 0, 'pharma')).toBeNull();
  });
});

describe('weightedOverallScore', () => {
  const seg0Answers: Record<string, number> = {
    '0-0-0': 4, '0-0-1': 4,  // seg0 / sub0 → 4.0, pharma weight 1.5
    '0-1-0': 2, '0-1-1': 2,  // seg0 / sub1 → 2.0, pharma weight 0.5
  };

  const seg1Answers: Record<string, number> = {
    '1-0-0': 5, '1-0-1': 5,  // seg1 / sub0 → 5.0, pharma weight 1.0
  };

  const pharmaSegment: SegmentLike = {
    subSegments: [
      makeSubSeg(2, { pharma: 1.5 }),
      makeSubSeg(2, { pharma: 0.5 }),
    ],
  };

  const retailSegment: SegmentLike = {
    subSegments: [
      makeSubSeg(2, { pharma: 1.0 }),
    ],
  };

  it('returns 0 when no segment has any sub-segment answers', () => {
    expect(weightedOverallScore({}, [pharmaSegment, retailSegment], 'pharma')).toBe(0);
  });

  it('equals the single segment weighted score when only one segment is answered', () => {
    // seg0 weighted score = 3.5 (as computed by pharma fixture above)
    const result = weightedOverallScore(seg0Answers, [pharmaSegment, retailSegment], 'pharma');
    expect(result).toBeCloseTo(3.5);
  });

  it('averages weighted scores across all completed segments', () => {
    const answers = { ...seg0Answers, ...seg1Answers };
    // seg0 weighted pharma = 3.5
    // seg1: sub0 score=5.0, weight pharma=1.0 → weighted = 5.0
    // overall = (3.5 + 5.0) / 2 = 4.25
    const result = weightedOverallScore(answers, [pharmaSegment, retailSegment], 'pharma');
    expect(result).toBeCloseTo(4.25);
  });

  it('excludes segments with no completed sub-segments from the average', () => {
    // Only seg1 answered (retailSegment); pharmaSegment has no answers
    const result = weightedOverallScore(seg1Answers, [pharmaSegment, retailSegment], 'pharma');
    // Only seg1 contributes: 5.0
    expect(result).toBeCloseTo(5.0);
  });

  it('returns 0 for an empty segments array', () => {
    expect(weightedOverallScore(seg0Answers, [], 'pharma')).toBe(0);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   countCoveredSubSegments — sub-segment coverage using 3-part keys only

   Critical invariant: 2-part flat segment answers MUST NOT count as
   sub-segment coverage.  Tests here verify both the pure 3-part-key path
   and the mixed 2-part/3-part answer map that occurs in normal app flow
   (legacy flat questions answered; sub-segment questions not yet answered).
══════════════════════════════════════════════════════════════════════════ */

describe('countCoveredSubSegments — 3-part key coverage', () => {
  const twoSubSegs: SegmentLike = {
    subSegments: [
      makeSubSeg(2, { pharma: 1.0 }),
      makeSubSeg(2, { pharma: 1.0 }),
    ],
  };
  const oneSubSeg: SegmentLike = {
    subSegments: [makeSubSeg(1, { pharma: 1.0 })],
  };

  it('returns 0 when no answers exist at all', () => {
    expect(countCoveredSubSegments({}, [twoSubSegs, oneSubSeg])).toBe(0);
  });

  it('returns 0 when only 2-part flat answers exist (the normal assessment flow)', () => {
    // Simulates the common case: user answered all flat segment questions
    // via the standard assessment UI but no sub-segment (3-part) answers exist.
    const flatAnswers: Record<string, number> = {};
    for (let q = 0; q < 5; q++) {
      flatAnswers[`0-${q}`] = 3;  // 2-part keys only
      flatAnswers[`1-${q}`] = 4;
    }
    // Flat answers MUST NOT count — coverage should remain 0.
    expect(countCoveredSubSegments(flatAnswers, [twoSubSegs, oneSubSeg])).toBe(0);
  });

  it('counts only fully-answered sub-segments (not partial)', () => {
    // Sub-segment 0 fully answered; sub-segment 1 partial (1 of 2 questions)
    const answers: Record<string, number> = {
      '0-0-0': 4, '0-0-1': 4,  // sub0 complete
      '0-1-0': 3,               // sub1 partial — should NOT count
    };
    expect(countCoveredSubSegments(answers, [twoSubSegs])).toBe(1);
  });

  it('counts all fully-answered sub-segments across multiple segments', () => {
    const answers: Record<string, number> = {
      '0-0-0': 4, '0-0-1': 4,  // seg0 / sub0 complete
      '0-1-0': 2, '0-1-1': 2,  // seg0 / sub1 complete
      '1-0-0': 5,               // seg1 / sub0 complete (only 1 question)
    };
    // 2 from twoSubSegs + 1 from oneSubSeg = 3 covered
    expect(countCoveredSubSegments(answers, [twoSubSegs, oneSubSeg])).toBe(3);
  });

  it('correctly handles a mixed answer map (flat 2-part + partial 3-part)', () => {
    // Flat answers for seg 0 (2-part) AND one sub-segment 3-part answer
    const mixedAnswers: Record<string, number> = {
      '0-0': 3, '0-1': 3, '0-2': 3, '0-3': 3, '0-4': 3,  // flat segment answers
      '0-0-0': 4, '0-0-1': 4,                               // sub-segment 0 answered
    };
    // Only the 3-part key sub-segment counts → 1 covered (sub0 of seg0)
    // sub1 of seg0 and all of seg1 (oneSubSeg) are not answered
    expect(countCoveredSubSegments(mixedAnswers, [twoSubSegs, oneSubSeg])).toBe(1);
  });

  it('returns 0 for segments with no subSegments defined', () => {
    const segNoSubs: SegmentLike = {};
    const answers = { '0-0-0': 5 };
    expect(countCoveredSubSegments(answers, [segNoSubs])).toBe(0);
  });

  it('returns 0 for an empty segments array', () => {
    expect(countCoveredSubSegments({ '0-0-0': 5 }, [])).toBe(0);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Weighted per-question scoring + core/bonus partial-credit completion
   (added after the expert-panel review flagged flat averaging and
   all-or-nothing completion as real risks once sub-segments grew past ~6
   questions — see Maturity_Assessment_Expert_Panel_Review.md, findings 1-2)
══════════════════════════════════════════════════════════════════════════ */

describe('subSegScore — weighted mean via options.weights', () => {
  it('uses per-question weights instead of a flat average when provided', () => {
    // (5*3 + 1*1) / (3+1) = 16/4 = 4 -- flat average would have been 3
    const answers = { '0-0-0': 5, '0-0-1': 1 };
    const score = subSegScore(answers, 0, 0, 2, { weights: [3, 1], coreCount: 2 });
    expect(score).toBeCloseTo(4);
    expect(score).not.toBe(3);
  });

  it('defaults every question to weight 1.0 (flat mean) when options are omitted', () => {
    // Preserves the exact old behaviour for every existing call site.
    const answers = { '0-0-0': 2, '0-0-1': 4 };
    expect(subSegScore(answers, 0, 0, 2)).toBe(3);
  });
});

describe('subSegScore — core/bonus partial-credit completion', () => {
  it('scores once the core questions are answered, even if trailing bonus questions are skipped', () => {
    // 5 questions, only the first 3 are core.
    const answers = { '0-0-0': 4, '0-0-1': 4, '0-0-2': 4 };
    expect(subSegScore(answers, 0, 0, 5, { coreCount: 3 })).toBe(4);
  });

  it('still returns null if a core question is missing, even when a bonus question is answered', () => {
    // q1 (core) missing; q3 (bonus) answered — must not be scoreable.
    const answers = { '0-0-0': 4, '0-0-2': 4, '0-0-3': 5 };
    expect(subSegScore(answers, 0, 0, 5, { coreCount: 3 })).toBeNull();
  });

  it('answered bonus questions refine the score rather than being ignored', () => {
    const coreOnly = { '0-0-0': 3, '0-0-1': 3, '0-0-2': 3 };
    const coreAndBonus = { '0-0-0': 3, '0-0-1': 3, '0-0-2': 3, '0-0-3': 5 };
    expect(subSegScore(coreOnly, 0, 0, 5, { coreCount: 3 })).toBe(3);
    expect(subSegScore(coreAndBonus, 0, 0, 5, { coreCount: 3 })).toBeCloseTo(3.5);
  });

  it('regression: an 11-question sub-segment with 6 core questions scores on 10/11 answered (not null)', () => {
    // This is the exact scenario the expert panel flagged: a respondent who
    // answers 10 of 11 questions in a deepened sub-segment must not get
    // zero credit for the whole sub-segment.
    const answers: Record<string, number> = {};
    for (let q = 0; q < 10; q++) answers[`0-0-${q}`] = 3; // q10 skipped
    expect(subSegScore(answers, 0, 0, 11, { coreCount: 6 })).toBe(3);
  });

  it('with no options, remains fully all-or-nothing (old behaviour, unchanged)', () => {
    const answers = { '0-0-0': 2 }; // 1 of 2 answered
    expect(subSegScore(answers, 0, 0, 2)).toBeNull();
  });
});

describe('weightedSegScore & countCoveredSubSegments honour coreQuestionCount / per-question weight from real sub-segment data', () => {
  it('weightedSegScore scores a sub-segment once its core questions are answered', () => {
    const sub: SubSegmentLike = {
      questions: Array.from({ length: 5 }, () => ({})),
      industryWeights: { pharma: 1.0 },
      coreQuestionCount: 3,
    };
    const seg: SegmentLike = { subSegments: [sub] };
    const answers = { '0-0-0': 4, '0-0-1': 4, '0-0-2': 4 };
    expect(weightedSegScore(answers, seg, 0, 'pharma')).toBeCloseTo(4.0);
  });

  it('countCoveredSubSegments counts a sub-segment as covered once its core is answered', () => {
    const sub: SubSegmentLike = {
      questions: Array.from({ length: 5 }, () => ({})),
      industryWeights: {},
      coreQuestionCount: 3,
    };
    const seg: SegmentLike = { subSegments: [sub] };
    const answers = { '0-0-0': 4, '0-0-1': 4, '0-0-2': 4 };
    expect(countCoveredSubSegments(answers, [seg])).toBe(1);
  });

  it('weightedSegScore applies each question\'s own weight, not just the sub-segment industry weight', () => {
    const sub: SubSegmentLike = {
      questions: [{ weight: 2 }, { weight: 1 }],
      industryWeights: { pharma: 1.0 },
    };
    const seg: SegmentLike = { subSegments: [sub] };
    const answers = { '0-0-0': 5, '0-0-1': 1 }; // (5*2+1*1)/3 = 11/3
    expect(weightedSegScore(answers, seg, 0, 'pharma')).toBeCloseTo(11 / 3);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Weighted-score fallback — verifies that weighted scoring returns 0
   (triggering flat-score fallback in the UI) when only flat 2-part answers
   exist.  This is the normal state before sub-segment questions are answered.
══════════════════════════════════════════════════════════════════════════ */

describe('weighted score is 0 (flat fallback) with only 2-part answers', () => {
  const segment: SegmentLike = {
    subSegments: [
      makeSubSeg(2, { pharma: 1.5 }),
      makeSubSeg(2, { pharma: 0.5 }),
    ],
  };

  it('weightedSegScore returns null when only flat (2-part) answers exist', () => {
    // All 5 flat questions answered for segment 0 — no 3-part sub-segment answers
    const flatAnswers: Record<string, number> = {
      '0-0': 4, '0-1': 3, '0-2': 3, '0-3': 4, '0-4': 5,
    };
    expect(weightedSegScore(flatAnswers, segment, 0, 'pharma')).toBeNull();
  });

  it('weightedOverallScore returns 0 when only flat answers exist (UI uses flat fallback)', () => {
    const flatAnswers: Record<string, number> = {};
    for (let q = 0; q < 5; q++) flatAnswers[`0-${q}`] = 3;
    // isWeightedScore = (weightedOverallScore > 0) → false → UI falls back to segScore
    expect(weightedOverallScore(flatAnswers, [segment], 'pharma')).toBe(0);
  });

  it('weighted path activates only when 3-part keys are present', () => {
    // Mix: flat answers (should not activate weighted) + one full sub-seg (should activate)
    const mixedAnswers: Record<string, number> = {
      '0-0': 3, '0-1': 3, '0-2': 3, '0-3': 3, '0-4': 3,  // flat
      '0-0-0': 4, '0-0-1': 4,                               // sub0 answered
    };
    // sub0 score=4, weight=1.5; sub1 null (excluded)
    // weightedSegScore = 4.0 (only sub0 contributes)
    expect(weightedSegScore(mixedAnswers, segment, 0, 'pharma')).toBeCloseTo(4.0);
    expect(weightedOverallScore(mixedAnswers, [segment], 'pharma')).toBeCloseTo(4.0);
    expect(weightedOverallScore(mixedAnswers, [segment], 'pharma')).toBeGreaterThan(0);
  });
});
