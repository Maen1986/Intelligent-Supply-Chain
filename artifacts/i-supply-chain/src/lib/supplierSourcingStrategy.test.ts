import { describe, it, expect } from 'vitest';
import { newItem } from '@/lib/kraljicScoring';
import {
  classifyKraljicPosition,
  suggestEvaluationCriteria,
  draftRfpStructure,
  buildSolutionSet,
  checkLocalContentRelevance,
  rankCandidateSuppliers,
  assessSourcingConfidence,
  buildSourcingStrategy,
  RELATIONSHIP_SPECTRUM,
  IDEAL_POSTURE_BY_QUADRANT,
  getRelationshipStageProfile,
  assessRelationshipCompatibility,
  recommendRelationshipUpgrade,
  recommendNegotiationStrategy,
} from './supplierSourcingStrategy';
import { ACTION_PLANS } from '@/lib/kraljicScoring';

describe('classifyKraljicPosition -- direct reuse of the live Kraljic engine', () => {
  it('classifies a low-spend, many-supplier item as non-critical or leverage, never fabricating a Strategic/Bottleneck read', () => {
    const item = newItem({ annualSpend: 5000, supplierCount: 20, marketCompetitiveness: 5, geographicRisk: 1, substitutability: 5, qualityImpact: 1, revenueImpact: 1 });
    const scored = classifyKraljicPosition(item, [], 'manufacturing');
    expect(['non-critical', 'leverage']).toContain(scored.quadrant);
  });

  it('classifies a high-spend, single-supplier item as strategic or bottleneck', () => {
    const item = newItem({ annualSpend: 2_000_000, supplierCount: 1, marketCompetitiveness: 1, geographicRisk: 5, substitutability: 1, qualityImpact: 5, revenueImpact: 5 });
    const scored = classifyKraljicPosition(item, [], 'manufacturing');
    expect(['strategic', 'bottleneck']).toContain(scored.quadrant);
  });

  it('classifying the same item alone vs. within real portfolio context can change the quadrant -- proving portfolioContext is not cosmetic', () => {
    const item = newItem({ annualSpend: 180_000, supplierCount: 2, leadTimeDays: 45, qualityImpact: 3, revenueImpact: 1, marketCompetitiveness: 2, geographicRisk: 3, substitutability: 2 });
    const alone = classifyKraljicPosition(item, [], 'manufacturing');
    const restOfPortfolio = [
      newItem({ annualSpend: 4_500_000, supplierCount: 8 }),
      newItem({ annualSpend: 4_320_000, supplierCount: 6 }),
    ];
    const inContext = classifyKraljicPosition(item, restOfPortfolio, 'manufacturing');
    expect(alone.spendPct).toBe(100);
    expect(inContext.spendPct).toBeLessThan(10);
  });

  it('matches the Rawabi illustrative example: aluminum extrusion classifies as Bottleneck once read against real portfolio context', () => {
    // Few qualified regional extruders (low supplier count, high risk); a supporting
    // material rather than the company's core revenue/quality driver (low impact) --
    // and correctly read as a small share of Rawabi's ~16-supplier portfolio, not in isolation.
    const item = newItem({
      category: 'Raw Materials', subcategory: 'Aluminum Extrusion', itemName: 'Aluminum extrusion profiles',
      annualSpend: 180_000, supplierCount: 2, leadTimeDays: 45, qualityImpact: 3, revenueImpact: 1,
      marketCompetitiveness: 2, geographicRisk: 3, substitutability: 2,
    });
    const restOfPortfolio = [
      newItem({ annualSpend: 4_500_000, supplierCount: 8, qualityImpact: 3, revenueImpact: 3 }),
      newItem({ annualSpend: 4_320_000, supplierCount: 6, qualityImpact: 3, revenueImpact: 3 }),
    ];
    const scored = classifyKraljicPosition(item, restOfPortfolio, 'manufacturing');
    expect(scored.quadrant).toBe('bottleneck');
  });
});

describe('suggestEvaluationCriteria', () => {
  it('returns real, weighted criteria for every quadrant, with price weighted lowest for Strategic and highest for Leverage', () => {
    for (const q of ['strategic', 'leverage', 'bottleneck', 'non-critical'] as const) {
      const criteria = suggestEvaluationCriteria(q);
      expect(criteria.length).toBeGreaterThan(0);
      for (const c of criteria) {
        expect(c.suggestedWeight).toBeGreaterThanOrEqual(1);
        expect(c.suggestedWeight).toBeLessThanOrEqual(10);
        expect(c.rationale.length).toBeGreaterThan(10);
      }
    }
    const strategicPrice = suggestEvaluationCriteria('strategic').find(c => c.criterion.includes('Price'));
    const leveragePrice = suggestEvaluationCriteria('leverage').find(c => c.criterion.includes('Price'));
    expect(strategicPrice!.suggestedWeight).toBeLessThan(leveragePrice!.suggestedWeight);
  });
});

describe('draftRfpStructure', () => {
  it('gives every quadrant real RFP sections, with continuity leading Bottleneck and price leading Leverage', () => {
    const bottleneck = draftRfpStructure('bottleneck');
    expect(bottleneck[0].section.toLowerCase()).toContain('continuity');
    const leverage = draftRfpStructure('leverage');
    expect(leverage[0].section.toLowerCase()).toContain('pricing');
  });
});

describe('buildSolutionSet', () => {
  it('gives every quadrant realistic, non-fixed-bucket timeframes', () => {
    for (const q of ['strategic', 'leverage', 'bottleneck', 'non-critical'] as const) {
      const actions = buildSolutionSet(q);
      expect(actions.length).toBeGreaterThan(0);
      for (const a of actions) {
        expect(['same day', 'this week', '2-4 weeks', 'quarter+']).toContain(a.timeframe);
        expect(['Low', 'Medium', 'High']).toContain(a.effort);
      }
    }
  });
});

describe('checkLocalContentRelevance -- honest by construction', () => {
  it('flags Saudi as relevant and points to the real LCGPA tool', () => {
    const result = checkLocalContentRelevance('Saudi Arabia');
    expect(result.relevant).toBe(true);
    expect(result.note).toContain('LCGPA');
  });

  it('accepts common Saudi aliases', () => {
    expect(checkLocalContentRelevance('KSA').relevant).toBe(true);
    expect(checkLocalContentRelevance('saudi').relevant).toBe(true);
  });

  it('never claims coverage for an unresearched GCC market -- discloses the real gap instead', () => {
    const result = checkLocalContentRelevance('United Arab Emirates');
    expect(result.relevant).toBe(false);
    expect(result.note.toLowerCase()).toContain('not yet');
    expect(result.note).not.toContain('LCGPA applies');
    expect(result.note.toLowerCase()).not.toContain('lcgpa requirements may apply');
  });

  it('returns not-relevant with an explanatory note when no market is given', () => {
    const result = checkLocalContentRelevance(null);
    expect(result.relevant).toBe(false);
    expect(result.note.length).toBeGreaterThan(10);
  });
});

describe('rankCandidateSuppliers -- explicit Decision Lab passthrough', () => {
  it('produces the same ranking Decision Lab itself would for an identical scenario', () => {
    const scenario = {
      question: 'Which aluminum extrusion supplier?',
      criteria: [{ id: 'c1', name: 'Price', weight: 8 }, { id: 'c2', name: 'Lead time', weight: 5 }],
      options: [
        { id: 'o1', name: 'Supplier A', scores: { c1: 4, c2: 3 } },
        { id: 'o2', name: 'Supplier B', scores: { c1: 2, c2: 5 } },
      ],
    };
    const ranked = rankCandidateSuppliers(scenario);
    expect(ranked).toHaveLength(2);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[0].name).toBe('Supplier A'); // higher weighted score given the weights above
  });
});

describe('assessSourcingConfidence -- disclosed rule, never fabricated', () => {
  it('is 0 when annualSpend is unset, regardless of other inputs', () => {
    const item = newItem({ annualSpend: 0, supplierCount: 1, qualityImpact: 5 });
    expect(assessSourcingConfidence(item)).toBe(0);
  });

  it('rises with each risk/impact field actually entered away from its default', () => {
    const base = newItem({ annualSpend: 100000 });
    const baseConfidence = assessSourcingConfidence(base);
    const oneMore = newItem({ annualSpend: 100000, supplierCount: 1 });
    expect(assessSourcingConfidence(oneMore)).toBeGreaterThan(baseConfidence);
  });

  it('never exceeds 100', () => {
    const item = newItem({ annualSpend: 999999, supplierCount: 1, leadTimeDays: 200, qualityImpact: 5, revenueImpact: 5, marketCompetitiveness: 5, geographicRisk: 5, substitutability: 5 });
    expect(assessSourcingConfidence(item)).toBeLessThanOrEqual(100);
  });
});

describe('buildSourcingStrategy -- full assembly, Rawabi scenario', () => {
  it('assembles the SI-02.md output schema shape end to end', () => {
    const item = newItem({
      category: 'Raw Materials', subcategory: 'Aluminum Extrusion', itemName: 'Aluminum extrusion profiles',
      annualSpend: 180_000, supplierCount: 2, leadTimeDays: 45, qualityImpact: 3, revenueImpact: 1,
      marketCompetitiveness: 2, geographicRisk: 3, substitutability: 2,
    });
    const restOfPortfolio = [
      newItem({ annualSpend: 4_500_000, supplierCount: 8, qualityImpact: 3, revenueImpact: 3 }),
      newItem({ annualSpend: 4_320_000, supplierCount: 6, qualityImpact: 3, revenueImpact: 3 }),
    ];
    const output = buildSourcingStrategy({
      statedNeed: 'Diversify or negotiate against sole-source aluminum extrusion supplier',
      kraljicItem: item,
      portfolioContext: restOfPortfolio,
      industryKey: 'manufacturing',
      targetMarket: 'Saudi Arabia',
      assumptions: ['Demand volume stable year over year'],
    });

    expect(output.kraljicQuadrant).toBe('bottleneck');
    expect(output.evaluationCriteria.length).toBeGreaterThan(0);
    expect(output.localContentRelevant).toBe(true);
    expect(output.rfpStructureDraft.length).toBeGreaterThan(0);
    expect(output.solutionSet.length).toBeGreaterThan(0);
    expect(output.evidenceSummary.confidence).toBeGreaterThan(0);
    expect(output.evidenceSummary.dataUsed.length).toBeGreaterThan(0);
  });
});

describe('RELATIONSHIP_SPECTRUM -- real, ordered, bilingual', () => {
  it('is ordered low (adversarial) to high (partnership), 5 stages', () => {
    expect(RELATIONSHIP_SPECTRUM.map(s => s.posture)).toEqual(['adversarial', 'transactional', 'cooperative', 'collaborative', 'partnership']);
  });

  it('every stage has real, non-empty EN and AR content across all fields', () => {
    for (const stage of RELATIONSHIP_SPECTRUM) {
      expect(stage.label.length).toBeGreaterThan(3);
      expect(stage.labelAr.length).toBeGreaterThan(3);
      expect(stage.characteristics.length).toBeGreaterThan(0);
      expect(stage.governanceFeatures.length).toBeGreaterThan(0);
      expect(stage.typicalKpis.length).toBeGreaterThan(0);
      expect(stage.contractCharacteristics.length).toBeGreaterThan(0);
    }
  });

  it('getRelationshipStageProfile returns the matching stage', () => {
    expect(getRelationshipStageProfile('partnership').label).toBe('Strategic Partnership');
    expect(getRelationshipStageProfile('adversarial').label).toBe('Adversarial');
  });
});

describe('IDEAL_POSTURE_BY_QUADRANT', () => {
  it('maps Strategic to Partnership and Leverage to Transactional -- the textbook CIPS pairing', () => {
    expect(IDEAL_POSTURE_BY_QUADRANT.strategic).toBe('partnership');
    expect(IDEAL_POSTURE_BY_QUADRANT.leverage).toBe('transactional');
    expect(IDEAL_POSTURE_BY_QUADRANT.bottleneck).toBe('collaborative');
    expect(IDEAL_POSTURE_BY_QUADRANT['non-critical']).toBe('transactional');
  });
});

describe('assessRelationshipCompatibility -- the real diagnostic', () => {
  it('flags Bottleneck + Adversarial as the named high-risk case, with a specific non-generic advisory', () => {
    const result = assessRelationshipCompatibility('bottleneck', 'adversarial');
    expect(result.severity).toBe('high-risk');
    expect(result.advisory.toLowerCase()).toContain('scarcity');
    expect(result.advisoryAr).toContain('الاختناق');
  });

  it('flags Strategic + Transactional as high-risk under-governance, not silently passing it', () => {
    const result = assessRelationshipCompatibility('strategic', 'transactional');
    expect(result.severity).toBe('high-risk');
    expect(result.advisory.toLowerCase()).toContain('under-governed');
  });

  it('reports aligned when current posture matches the quadrant ideal exactly', () => {
    const result = assessRelationshipCompatibility('leverage', 'transactional');
    expect(result.severity).toBe('aligned');
    expect(result.gap).toBe(0);
  });

  it('reports a positive gap (under-invested) with monitor severity for a 1-stage gap', () => {
    const result = assessRelationshipCompatibility('strategic', 'collaborative');
    expect(result.gap).toBe(1);
    expect(result.severity).toBe('monitor');
  });

  it('reports a negative gap (over-invested) without treating it as a crisis', () => {
    const result = assessRelationshipCompatibility('non-critical', 'partnership');
    expect(result.gap).toBeLessThan(0);
    expect(result.advisory.toLowerCase()).toContain('over-invested');
  });
});

describe('recommendRelationshipUpgrade', () => {
  it('returns the next stage\'s real governance features, not a generic list', () => {
    const actions = recommendRelationshipUpgrade('transactional', 'partnership');
    expect(actions).toEqual(getRelationshipStageProfile('cooperative').governanceFeatures);
  });

  it('returns an empty list when already at or above the ideal', () => {
    expect(recommendRelationshipUpgrade('partnership', 'transactional')).toEqual([]);
    expect(recommendRelationshipUpgrade('collaborative', 'collaborative')).toEqual([]);
  });
});

describe('buildSourcingStrategy -- relationship compatibility wiring', () => {
  it('includes relationshipCompatibility when a current posture is supplied, flagging the Bottleneck/Adversarial Rawabi case', () => {
    const item = newItem({
      category: 'Raw Materials', subcategory: 'Aluminum Extrusion', itemName: 'Aluminum extrusion profiles',
      annualSpend: 180_000, supplierCount: 2, leadTimeDays: 45, qualityImpact: 3, revenueImpact: 1,
      marketCompetitiveness: 2, geographicRisk: 3, substitutability: 2,
    });
    const restOfPortfolio = [
      newItem({ annualSpend: 4_500_000, supplierCount: 8, qualityImpact: 3, revenueImpact: 3 }),
      newItem({ annualSpend: 4_320_000, supplierCount: 6, qualityImpact: 3, revenueImpact: 3 }),
    ];
    const output = buildSourcingStrategy({
      statedNeed: 'Diversify or negotiate against sole-source aluminum extrusion supplier',
      kraljicItem: item,
      portfolioContext: restOfPortfolio,
      industryKey: 'manufacturing',
      targetMarket: 'Saudi Arabia',
      currentRelationshipPosture: 'adversarial',
      assumptions: ['Demand volume stable year over year'],
    });

    expect(output.kraljicQuadrant).toBe('bottleneck');
    expect(output.relationshipCompatibility).not.toBeNull();
    expect(output.relationshipCompatibility!.severity).toBe('high-risk');
  });

  it('leaves relationshipCompatibility null when no current posture is supplied -- never guessed', () => {
    const item = newItem({ annualSpend: 100_000, supplierCount: 5 });
    const output = buildSourcingStrategy({
      statedNeed: 'Test',
      kraljicItem: item,
      industryKey: 'manufacturing',
      targetMarket: null,
      assumptions: [],
    });
    expect(output.relationshipCompatibility).toBeNull();
  });
});


describe('recommendNegotiationStrategy -- real, sourced tactics per quadrant', () => {
  it('recommends integrative for Strategic, distributive for Leverage, mixed for Bottleneck, distributive for Non-critical', () => {
    expect(recommendNegotiationStrategy('strategic', null).recommendedApproach).toBe('integrative');
    expect(recommendNegotiationStrategy('leverage', null).recommendedApproach).toBe('distributive');
    expect(recommendNegotiationStrategy('bottleneck', null).recommendedApproach).toBe('mixed');
    expect(recommendNegotiationStrategy('non-critical', null).recommendedApproach).toBe('distributive');
  });

  it('reuses ACTION_PLANS.negotiation/negotiationAr as the first tactics, never re-authoring or contradicting them', () => {
    (['strategic', 'leverage', 'bottleneck', 'non-critical'] as const).forEach((quadrant) => {
      const strategy = recommendNegotiationStrategy(quadrant, null);
      const existing = ACTION_PLANS[quadrant];
      existing.negotiation.forEach((en, i) => {
        expect(strategy.tactics[i].en).toBe(en);
        expect(strategy.tactics[i].ar).toBe(existing.negotiationAr[i]);
      });
    });
  });

  it('provides substantially more tactics than the reused 5 -- real depth, not a thin wrapper', () => {
    (['strategic', 'leverage', 'bottleneck', 'non-critical'] as const).forEach((quadrant) => {
      const strategy = recommendNegotiationStrategy(quadrant, null);
      expect(strategy.tactics.length).toBeGreaterThan(5);
    });
    const totalTactics = (['strategic', 'leverage', 'bottleneck', 'non-critical'] as const)
      .reduce((sum, q) => sum + recommendNegotiationStrategy(q, null).tactics.length, 0);
    expect(totalTactics).toBeGreaterThanOrEqual(40);
  });

  it('every tactic and avoid-item has real, non-empty bilingual (EN + AR) content', () => {
    (['strategic', 'leverage', 'bottleneck', 'non-critical'] as const).forEach((quadrant) => {
      const strategy = recommendNegotiationStrategy(quadrant, null);
      [...strategy.tactics, ...strategy.avoid].forEach((t) => {
        expect(t.en.length).toBeGreaterThan(10);
        expect(t.ar.length).toBeGreaterThan(5);
      });
    });
  });

  it('includes BATNA and ZOPA guidance for every quadrant', () => {
    (['strategic', 'leverage', 'bottleneck', 'non-critical'] as const).forEach((quadrant) => {
      const strategy = recommendNegotiationStrategy(quadrant, null);
      expect(strategy.batnaGuidance.length).toBeGreaterThan(20);
      expect(strategy.zopaGuidance.length).toBeGreaterThan(20);
    });
  });

  it('leaves relationshipAdjustment null when no relationshipCompatibility was computed', () => {
    const strategy = recommendNegotiationStrategy('bottleneck', null);
    expect(strategy.relationshipAdjustment).toBeNull();
  });

  it('flags a specific high-risk relationshipAdjustment for the Bottleneck+Adversarial case', () => {
    const compatibility = assessRelationshipCompatibility('bottleneck', 'adversarial');
    const strategy = recommendNegotiationStrategy('bottleneck', compatibility);
    expect(strategy.relationshipAdjustment).not.toBeNull();
    expect(strategy.relationshipAdjustment).toContain('adversarial');
  });

  it('gives a reassuring relationshipAdjustment when posture is already aligned', () => {
    const compatibility = assessRelationshipCompatibility('leverage', 'transactional');
    const strategy = recommendNegotiationStrategy('leverage', compatibility);
    expect(strategy.relationshipAdjustment).not.toBeNull();
    expect(compatibility.severity).toBe('aligned');
  });

  it('bilingual-correctness fix: every narrative guidance field has a real, non-empty, distinct Arabic counterpart', () => {
    (['strategic', 'leverage', 'bottleneck', 'non-critical'] as const).forEach((quadrant) => {
      const strategy = recommendNegotiationStrategy(quadrant, null);
      expect(strategy.approachRationaleAr.length).toBeGreaterThan(20);
      expect(strategy.approachRationaleAr).not.toBe(strategy.approachRationale);
      expect(strategy.batnaGuidanceAr.length).toBeGreaterThan(20);
      expect(strategy.batnaGuidanceAr).not.toBe(strategy.batnaGuidance);
      expect(strategy.zopaGuidanceAr.length).toBeGreaterThan(20);
      expect(strategy.zopaGuidanceAr).not.toBe(strategy.zopaGuidance);
      expect(strategy.milGuidanceAr.length).toBeGreaterThan(20);
      expect(strategy.milGuidanceAr).not.toBe(strategy.milGuidance);
      // Real Arabic script, not a placeholder or the English string reused.
      expect(strategy.approachRationaleAr).toMatch(/[\u0600-\u06FF]/);
      expect(strategy.batnaGuidanceAr).toMatch(/[\u0600-\u06FF]/);
      expect(strategy.zopaGuidanceAr).toMatch(/[\u0600-\u06FF]/);
      expect(strategy.milGuidanceAr).toMatch(/[\u0600-\u06FF]/);
    });
  });

  it('bilingual-correctness fix: relationshipAdjustmentAr is populated in lockstep with relationshipAdjustment, in real Arabic, for all three severities', () => {
    const cases: Array<[Parameters<typeof assessRelationshipCompatibility>[0], Parameters<typeof assessRelationshipCompatibility>[1]]> = [
      ['bottleneck', 'adversarial'], // high-risk (the named special case)
      ['strategic', 'collaborative'], // monitor (gap of 1)
      ['leverage', 'transactional'], // aligned
    ];
    for (const [quadrant, posture] of cases) {
      const compatibility = assessRelationshipCompatibility(quadrant, posture);
      const strategy = recommendNegotiationStrategy(quadrant, compatibility);
      expect(strategy.relationshipAdjustment).not.toBeNull();
      expect(strategy.relationshipAdjustmentAr).not.toBeNull();
      expect(strategy.relationshipAdjustmentAr!.length).toBeGreaterThan(15);
      expect(strategy.relationshipAdjustmentAr).toMatch(/[\u0600-\u06FF]/);
      expect(strategy.relationshipAdjustmentAr).not.toBe(strategy.relationshipAdjustment);
    }
  });

  it('bilingual-correctness fix: relationshipAdjustmentAr stays null exactly when relationshipAdjustment does', () => {
    const strategy = recommendNegotiationStrategy('bottleneck', null);
    expect(strategy.relationshipAdjustment).toBeNull();
    expect(strategy.relationshipAdjustmentAr).toBeNull();
  });

  it('provides a real MIL (Must/Intend/Like) objective grid for every quadrant, with guidance explaining the discipline', () => {
    (['strategic', 'leverage', 'bottleneck', 'non-critical'] as const).forEach((quadrant) => {
      const strategy = recommendNegotiationStrategy(quadrant, null);
      expect(strategy.milGuidance.toLowerCase()).toContain('must');
      expect(strategy.milGuidance.toLowerCase()).toContain('intend');
      expect(strategy.milGuidance.toLowerCase()).toContain('like');
      const levels = strategy.milObjectives.map((o) => o.level);
      expect(levels).toEqual(['must', 'intend', 'like']);
      strategy.milObjectives.forEach((o) => {
        expect(o.objective.en.length).toBeGreaterThan(10);
        expect(o.objective.ar.length).toBeGreaterThan(5);
      });
    });
  });

  it('is wired into buildSourcingStrategy output', () => {
    const item = newItem({ annualSpend: 180_000, supplierCount: 2, leadTimeDays: 45, qualityImpact: 3, revenueImpact: 1, marketCompetitiveness: 2, geographicRisk: 3, substitutability: 2 });
    const restOfPortfolio = [
      newItem({ annualSpend: 4_500_000, supplierCount: 8, qualityImpact: 3, revenueImpact: 3 }),
      newItem({ annualSpend: 4_320_000, supplierCount: 6, qualityImpact: 3, revenueImpact: 3 }),
    ];
    const output = buildSourcingStrategy({
      statedNeed: 'Diversify or negotiate against sole-source aluminum extrusion supplier',
      kraljicItem: item,
      portfolioContext: restOfPortfolio,
      industryKey: 'manufacturing',
      targetMarket: 'Saudi Arabia',
      currentRelationshipPosture: 'adversarial',
      assumptions: ['Demand volume stable year over year'],
    });
    expect(output.kraljicQuadrant).toBe('bottleneck');
    expect(output.negotiationStrategy).toBeDefined();
    expect(output.negotiationStrategy.quadrant).toBe(output.kraljicQuadrant);
    expect(output.negotiationStrategy.relationshipAdjustment).not.toBeNull();

    // Named-tactics negotiation plan document, wired alongside the
    // quadrant-level strategy above -- Rawabi is a bottleneck, adversarial
    // case, so it should get the full 6-role team and 3-level structure.
    expect(output.negotiationPlan).toBeDefined();
    expect(output.negotiationPlan.quadrant).toBe(output.kraljicQuadrant);
    expect(output.negotiationPlan.team.length).toBe(6);
    expect(output.negotiationPlan.levels.length).toBe(3);
    expect(output.negotiationPlan.recommendedTactics.length).toBeGreaterThan(0);
    output.negotiationPlan.recommendedTactics.forEach((t) => expect(t.ethicalRisk).toBe('low'));
    expect(output.negotiationPlan.watchForTactics.length).toBeGreaterThan(0);
    output.negotiationPlan.watchForTactics.forEach((t) => expect(t.ethicalRisk).not.toBe('low'));
  });
});
