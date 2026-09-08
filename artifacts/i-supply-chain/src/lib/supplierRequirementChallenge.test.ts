import { describe, it, expect } from 'vitest';
import {
  GENERIC_CHALLENGE_QUESTIONS,
  getApplicableChallengeQuestions,
  classifyRequirement,
  assessRequirementConfidence,
  buildRequirementBrief,
} from './supplierRequirementChallenge';

describe('GENERIC_CHALLENGE_QUESTIONS', () => {
  it('has a real, non-trivial library (more than the 2 illustrative examples in SI-01.md)', () => {
    expect(GENERIC_CHALLENGE_QUESTIONS.length).toBeGreaterThanOrEqual(10);
  });

  it('every question has both English and Arabic question + rationale text, non-empty', () => {
    for (const q of GENERIC_CHALLENGE_QUESTIONS) {
      expect(q.question.trim().length).toBeGreaterThan(10);
      expect(q.questionAr.trim().length).toBeGreaterThan(10);
      expect(q.rationale.trim().length).toBeGreaterThan(10);
      expect(q.rationaleAr.trim().length).toBeGreaterThan(10);
    }
  });

  it('has unique ids', () => {
    const ids = GENERIC_CHALLENGE_QUESTIONS.map(q => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('getApplicableChallengeQuestions', () => {
  it('returns only goods + both questions for a goods requirement', () => {
    const qs = getApplicableChallengeQuestions('goods');
    expect(qs.every(q => q.appliesTo === 'goods' || q.appliesTo === 'both')).toBe(true);
    expect(qs.some(q => q.id === 'moq-real-demand')).toBe(true);
    expect(qs.some(q => q.id === 'service-scope-bundling')).toBe(false);
  });

  it('returns only services + both questions for a services requirement', () => {
    const qs = getApplicableChallengeQuestions('services');
    expect(qs.every(q => q.appliesTo === 'services' || q.appliesTo === 'both')).toBe(true);
    expect(qs.some(q => q.id === 'service-scope-bundling')).toBe(true);
    expect(qs.some(q => q.id === 'moq-real-demand')).toBe(false);
  });
});

describe('classifyRequirement — honest goods-vs-services coverage', () => {
  it('always returns covered:false for a goods requirement, with the real reason disclosed', () => {
    const result = classifyRequirement('goods', 'aluminum extrusion');
    expect(result.covered).toBe(false);
    expect(result.note.toLowerCase()).toContain('not yet covered');
    expect(result.segment).toBeUndefined();
  });

  it('returns covered:false when no segment is given for a services requirement', () => {
    const result = classifyRequirement('services', 'building maintenance');
    expect(result.covered).toBe(false);
    expect(result.note).toContain('No UNSPSC services segment selected');
  });

  it('returns covered:false with a clear message for an invalid/unsupported segment code', () => {
    const result = classifyRequirement('services', 'anything', '10');
    expect(result.covered).toBe(false);
    expect(result.note).toContain('not one of the platform');
  });

  it('attempts a real search for a valid services segment and reports the outcome honestly either way', () => {
    // Segment 72 = Building, Construction and Maintenance Services -- a real, covered segment.
    const result = classifyRequirement('services', 'construction management', '72');
    expect(result.segment).toBe('72');
    expect(result.segmentLabel).toContain('Building');
    // Whichever way the underlying dataset resolves this query, the result must be internally consistent.
    if (result.covered) {
      expect(result.family).toBeTruthy();
    } else {
      expect(result.note).toContain('No Family/Class/Commodity match');
    }
  });

  it('never fabricates a UNSPSC code for goods, even when a segment code is (incorrectly) supplied', () => {
    const result = classifyRequirement('goods', 'aluminum extrusion', '72');
    expect(result.covered).toBe(false);
    expect(result.segment).toBeUndefined();
  });
});

describe('assessRequirementConfidence', () => {
  const uncovered = { covered: false, note: 'not covered' };
  const covered = { covered: true, segment: '72', segmentLabel: 'Building', family: 'x', note: 'matched' };

  it('is LOW when classification is unresolved, even with answered challenges', () => {
    const result = assessRequirementConfidence({
      unspscClassification: uncovered,
      challengeResponses: [{ questionId: 'a', clientResponse: 'yes' }],
      specification: ['spec 1'],
      capacityRequirement: { value: 100, unit: 'units', basis: 'annual' },
    });
    expect(result).toBe('LOW');
  });

  it('is LOW when classification is unresolved even with a goods requirement, unless a free-text category is given', () => {
    const withoutCategory = assessRequirementConfidence({
      unspscClassification: uncovered,
      challengeResponses: [{ questionId: 'a', clientResponse: 'yes' }],
      specification: [],
      capacityRequirement: { value: null, unit: '', basis: '' },
    });
    expect(withoutCategory).toBe('LOW');

    const withCategory = assessRequirementConfidence({
      unspscClassification: uncovered,
      challengeResponses: [{ questionId: 'a', clientResponse: 'yes' }],
      specification: [],
      capacityRequirement: { value: null, unit: '', basis: '' },
      freeTextCategory: 'Aluminum extrusion',
    });
    expect(withCategory).not.toBe('LOW');
  });

  it('is LOW when no challenge question has been answered, even with a real classification', () => {
    const result = assessRequirementConfidence({
      unspscClassification: covered,
      challengeResponses: [{ questionId: 'a', clientResponse: null }],
      specification: ['spec 1'],
      capacityRequirement: { value: 100, unit: 'units', basis: 'annual' },
    });
    expect(result).toBe('LOW');
  });

  it('is HIGH only when classified, specified, capacity-sized, and at least 2 challenges answered', () => {
    const result = assessRequirementConfidence({
      unspscClassification: covered,
      challengeResponses: [
        { questionId: 'a', clientResponse: 'answer 1' },
        { questionId: 'b', clientResponse: 'answer 2' },
      ],
      specification: ['spec 1'],
      capacityRequirement: { value: 100, unit: 'units', basis: 'annual' },
    });
    expect(result).toBe('HIGH');
  });

  it('is MODERATE when classified and one challenge answered but specification or capacity is incomplete', () => {
    const result = assessRequirementConfidence({
      unspscClassification: covered,
      challengeResponses: [{ questionId: 'a', clientResponse: 'answer 1' }],
      specification: [],
      capacityRequirement: { value: null, unit: '', basis: '' },
    });
    expect(result).toBe('MODERATE');
  });
});

describe('buildRequirementBrief', () => {
  it('assembles a brief matching SI-01.md\'s output schema shape, tracking unresolved challenges honestly', () => {
    const questions = getApplicableChallengeQuestions('goods').slice(0, 3);
    const brief = buildRequirementBrief({
      statedNeed: "We need a new aluminum extrusion supplier.",
      requirementType: 'goods',
      questions,
      challengeResponses: [
        { questionId: questions[0].id, clientResponse: 'It is a 12% cost increase driver, not a capability gap.' },
      ],
      unspscClassification: { covered: false, note: 'goods not yet covered' },
      specification: ['6063-T6 alloy', '±0.1mm tolerance'],
      certificationRequired: [],
      capacityRequirement: { value: 5000, unit: 'kg/month', basis: 'annual' },
      geographyConstraint: null,
      assumptions: ['Client demand volume is stable year over year'],
    });

    expect(brief.statedNeed).toContain('aluminum extrusion');
    expect(brief.challengeQuestions).toHaveLength(3);
    expect(brief.challengeQuestions[0].clientResponse).toContain('12%');
    expect(brief.evidenceSummary.unresolvedChallenges).toHaveLength(2);
    expect(brief.requirementConfidence).toBe('LOW'); // uncovered classification, no freeTextCategory passed through here
    expect(brief.unspscClassification.covered).toBe(false);
  });
});
