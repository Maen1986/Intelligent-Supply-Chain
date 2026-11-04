/**
 * Round C #668 (RC-4/RC-6) — exact-behaviour pins for supplierSourcingStrategy (Module 02),
 * written from Stryker survivors: confidence rule, local-content normalisation, portfolio de-dup,
 * relationship compatibility severities/text, negotiation relationship adjustment, evidence summary.
 */
import { describe, it, expect } from 'vitest';
import { newItem } from './kraljicScoring';
import {
  assessSourcingConfidence,
  checkLocalContentRelevance,
  classifyKraljicPosition,
  assessRelationshipCompatibility,
  recommendNegotiationStrategy,
  buildSourcingStrategy,
  type RelationshipPosture,
} from './supplierSourcingStrategy';
import type { KraljicQuadrant } from './kraljicScoring';

describe('assessSourcingConfidence exact rule', () => {
  const defaults = { supplierCount: 3, leadTimeDays: 14, qualityImpact: 3, revenueImpact: 3, marketCompetitiveness: 3, geographicRisk: 2, substitutability: 3 };
  const ctx = [newItem({ annualSpend: 1000 })];
  it('no/zero/negative/NaN spend -> 0, whatever else is entered', () => {
    expect(assessSourcingConfidence(newItem({ ...defaults, annualSpend: 0 }), ctx)).toBe(0);
    expect(assessSourcingConfidence(newItem({ ...defaults, annualSpend: -5, supplierCount: 9 }), ctx)).toBe(0);
    expect(assessSourcingConfidence(newItem({ ...defaults, annualSpend: NaN, supplierCount: 9 }), ctx)).toBe(0);
  });
  it('positive spend with all defaults = 30; each entered field adds exactly 10', () => {
    expect(assessSourcingConfidence(newItem({ ...defaults, annualSpend: 1 }), ctx)).toBe(30);
    expect(assessSourcingConfidence(newItem({ ...defaults, annualSpend: 1, supplierCount: 9 }), ctx)).toBe(40);
    expect(assessSourcingConfidence(newItem({ ...defaults, annualSpend: 1, supplierCount: 9, leadTimeDays: 60, geographicRisk: 5 }), ctx)).toBe(60);
  });
  it('all seven entered = 100 with context, capped at 50 without', () => {
    const full = newItem({ annualSpend: 1, supplierCount: 9, leadTimeDays: 60, qualityImpact: 5, revenueImpact: 5, marketCompetitiveness: 5, geographicRisk: 5, substitutability: 5 });
    expect(assessSourcingConfidence(full, ctx)).toBe(100);
    expect(assessSourcingConfidence(full, [])).toBe(50);
    expect(assessSourcingConfidence(full)).toBe(50);
    expect(assessSourcingConfidence(newItem({ ...defaults, annualSpend: 1 }), [])).toBe(30);
  });
});

describe('checkLocalContentRelevance normalisation', () => {
  it('null, empty and whitespace-only are "no market", never relevant', () => {
    for (const v of [null, '', '   ']) {
      const r = checkLocalContentRelevance(v);
      expect(r.relevant).toBe(false);
      expect(r.note.startsWith('No target market specified')).toBe(true);
    }
  });
  it('Saudi aliases match case-insensitively after trimming', () => {
    for (const v of ['Saudi Arabia', 'SAUDI', 'ksa', '  KSA  ', ' saudi arabia ']) {
      const r = checkLocalContentRelevance(v);
      expect(r.relevant).toBe(true);
      expect(r.note.startsWith('Saudi LCGPA local-content requirements may apply')).toBe(true);
    }
  });
  it('every other market is not relevant and the note names it without claiming Saudi equivalence', () => {
    const r = checkLocalContentRelevance('Qatar');
    expect(r.relevant).toBe(false);
    expect(r.note).toContain('"Qatar"');
    expect(r.note).toContain('not assumed equivalent to Saudi');
    expect(checkLocalContentRelevance('Saudi Arabia North').relevant).toBe(false);
  });
});

describe('classifyKraljicPosition portfolio handling', () => {
  it('an item already inside the context is not double counted', () => {
    const a = newItem({ annualSpend: 300 });
    const b = newItem({ annualSpend: 700 });
    expect(classifyKraljicPosition(a, [a, b], null).spendPct).toBeCloseTo(30, 10);
    expect(classifyKraljicPosition(a, [b], null).spendPct).toBeCloseTo(30, 10);
    expect(classifyKraljicPosition(a, [], null).spendPct).toBe(100);
  });
});

describe('assessRelationshipCompatibility exact severities and text', () => {
  const rc = (q: KraljicQuadrant, p: RelationshipPosture) => assessRelationshipCompatibility(q, p);
  it('bottleneck + adversarial: the named highest-risk case, gap 3', () => {
    const r = rc('bottleneck', 'adversarial');
    expect(r.severity).toBe('high-risk');
    expect(r.gap).toBe(3);
    expect(r.idealPosture).toBe('collaborative');
    expect(r.advisory.startsWith('This is the highest-risk combination in the framework')).toBe(true);
    expect(r.advisoryAr.startsWith('هذا أخطر مزيج في هذا الإطار')).toBe(true);
  });
  it('strategic + adversarial/transactional: named under-governed case', () => {
    for (const p of ['adversarial', 'transactional'] as const) {
      const r = rc('strategic', p);
      expect(r.severity).toBe('high-risk');
      expect(r.advisory.startsWith('A Strategic-quadrant supplier held at a Transactional or Adversarial distance')).toBe(true);
      expect(r.advisoryAr.startsWith('مورد فئة "استراتيجي" يُدار بمسافة معاملاتية أو عدائية')).toBe(true);
    }
  });
  it('gap exactly 2 is high-risk (not aligned, not monitor); gap 1 is monitor; gap 0 aligned', () => {
    expect(rc('strategic', 'cooperative').gap).toBe(2);
    expect(rc('strategic', 'cooperative').severity).toBe('high-risk');
    expect(rc('strategic', 'collaborative').severity).toBe('monitor');
    expect(rc('strategic', 'partnership').severity).toBe('aligned');
    expect(rc('leverage', 'transactional').severity).toBe('aligned');
    expect(rc('non-critical', 'transactional').gap).toBe(0);
  });
  it('aligned text names the posture and quadrant, EN and AR', () => {
    const r = rc('leverage', 'transactional');
    expect(r.advisory).toBe('Current posture (transactional) matches the textbook ideal for a leverage category -- no relationship-governance change indicated by this check alone.');
    expect(r.advisoryAr).toContain('يطابق المستوى المثالي لفئة "leverage"');
    expect(r.advisoryAr).toContain('لا يوجد ما يستدعي تغيير حوكمة العلاقة');
  });
  it('under-invested, high-risk gap: exact sentence plus deliberate-plan clause', () => {
    const r = rc('bottleneck', 'transactional'); // ideal collaborative, gap 2
    expect(r.severity).toBe('high-risk');
    expect(r.advisory).toBe('Relationship is under-invested for this quadrant: ideal is collaborative, actual is transactional. This gap is wide enough to warrant a deliberate plan to move up the spectrum, not just awareness of it.');
    expect(r.advisoryAr).toContain('المستوى المثالي هو "collaborative" والواقع هو "transactional"');
    expect(r.advisoryAr).toContain('هذه الفجوة كبيرة بما يكفي');
  });
  it('under-invested, monitor gap: exact sentence plus monitor clause', () => {
    const r = rc('leverage', 'adversarial'); // ideal transactional, gap 1
    expect(r.severity).toBe('monitor');
    expect(r.gap).toBe(1);
    expect(r.advisory).toBe("Relationship is under-invested for this quadrant: ideal is transactional, actual is adversarial. Worth monitoring -- not urgent, but don't let this gap widen further.");
    expect(r.advisoryAr).toContain('تستحق المتابعة دون أن تكون عاجلة');
  });
  it('over-invested: negative gap, exact sentence, never labelled under-invested', () => {
    const r = rc('leverage', 'partnership'); // ideal transactional, gap -3
    expect(r.gap).toBe(-3);
    expect(r.severity).toBe('high-risk');
    expect(r.advisory.startsWith("Relationship is over-invested relative to this quadrant's ideal (transactional)")).toBe(true);
    expect(r.advisory).not.toContain('under-invested');
    expect(r.advisoryAr.startsWith('العلاقة تحمل استثمارًا أكبر مما تتطلبه هذه الفئة (المستوى المثالي: "transactional")')).toBe(true);
    const m = rc('non-critical', 'cooperative');
    expect(m.gap).toBe(-1);
    expect(m.severity).toBe('monitor');
    expect(m.advisory).toContain('over-invested');
  });
});

describe('recommendNegotiationStrategy relationship adjustment', () => {
  const QUADS: KraljicQuadrant[] = ['strategic', 'leverage', 'bottleneck', 'non-critical'];
  it('null compatibility -> both adjustments null', () => {
    for (const q of QUADS) {
      const s = recommendNegotiationStrategy(q, null);
      expect(s.relationshipAdjustment).toBeNull();
      expect(s.relationshipAdjustmentAr).toBeNull();
    }
  });
  it('high-risk wording switches on the approach (distributive vs usual), EN and AR', () => {
    const seen = new Set<boolean>();
    for (const q of QUADS) for (const p of ['adversarial', 'transactional', 'cooperative', 'collaborative', 'partnership'] as const) {
      const compat = assessRelationshipCompatibility(q, p);
      const s = recommendNegotiationStrategy(q, compat);
      if (compat.severity === 'high-risk') {
        const dist = s.recommendedApproach === 'distributive';
        seen.add(dist);
        expect(s.relationshipAdjustment).toContain(`makes ${dist ? 'distributive, price-led' : 'the usual'} tactics especially likely to backfire`);
        expect(s.relationshipAdjustment!.startsWith(`The client's actual ${p} posture on this ${q} supplier`)).toBe(true);
        expect(s.relationshipAdjustmentAr).toContain(dist ? 'التفاوض التوزيعي القائم على السعر' : 'التفاوض المعتادة');
        expect(s.relationshipAdjustmentAr!.startsWith('الوضع العلائقي الفعلي')).toBe(true);
      }
    }
    expect(seen.has(true)).toBe(true);
    expect(seen.has(false)).toBe(true);
    // at least one quadrant takes each branch, otherwise the test above proves nothing
    const approaches = QUADS.map((q) => recommendNegotiationStrategy(q, null).recommendedApproach);
    expect(approaches).toContain('distributive');
    expect(approaches.some((a) => a !== 'distributive')).toBe(true);
  });
  it('monitor wording is distinct and names the ideal', () => {
    const compat = assessRelationshipCompatibility('strategic', 'collaborative');
    const s = recommendNegotiationStrategy('strategic', compat);
    expect(compat.severity).toBe('monitor');
    expect(s.relationshipAdjustment).toBe("The client's current collaborative posture is close to, but not fully at, this quadrant's ideal (partnership) -- proceed with the strategy below, but treat closing that gap as part of the negotiation's own agenda, not a separate initiative.");
    expect(s.relationshipAdjustmentAr).toContain('قريب من المستوى المثالي لهذا الربع');
  });
  it('aligned wording says no relationship-repair step first', () => {
    const compat = assessRelationshipCompatibility('leverage', 'transactional');
    const s = recommendNegotiationStrategy('leverage', compat);
    expect(s.relationshipAdjustment).toBe("The client's current transactional posture already matches this quadrant's ideal -- the strategy below can be applied directly without a relationship-repair step first.");
    expect(s.relationshipAdjustmentAr).toContain('يطابق بالفعل المستوى المثالي لهذا الربع');
  });
});

describe('buildSourcingStrategy evidence summary', () => {
  const item = newItem({ annualSpend: 500, supplierCount: 2 });
  const other = newItem({ annualSpend: 1500 });
  it('without context: assumption appended exactly once, confidence capped at 50', () => {
    const o = buildSourcingStrategy({ statedNeed: 'need', kraljicItem: item, industryKey: null, targetMarket: null, assumptions: ['a1'] });
    expect(o.evidenceSummary.assumptions).toEqual(['a1', "No wider portfolio context was provided -- this item's spend is being read as 100% of the comparison set, which caps confidence at 50."]);
    expect(o.evidenceSummary.confidence).toBeLessThanOrEqual(50);
    expect(o.relationshipCompatibility).toBeNull();
    expect(o.negotiationStrategy.relationshipAdjustment).toBeNull();
  });
  it('with context: assumptions pass through untouched and dataUsed is the exact 3-line list', () => {
    const o = buildSourcingStrategy({ statedNeed: 'need', kraljicItem: item, portfolioContext: [other], industryKey: 'manufacturing', targetMarket: 'KSA', assumptions: [] });
    expect(o.evidenceSummary.assumptions).toEqual([]);
    expect(o.evidenceSummary.dataUsed).toHaveLength(3);
    expect(o.evidenceSummary.dataUsed[0]).toMatch(/^Kraljic profit-impact score: \d/);
    expect(o.evidenceSummary.dataUsed[1]).toMatch(/^Kraljic supply-risk score: \d/);
    expect(o.evidenceSummary.dataUsed[2]).toBe('industry: manufacturing');
    expect(o.localContentRelevant).toBe(true);
    expect(o.sourcingBrief).toBe('need');
  });
  it('missing industry reads "default"; a supplied posture produces compatibility and an adjustment', () => {
    const o = buildSourcingStrategy({ statedNeed: 'n', kraljicItem: item, portfolioContext: [other], industryKey: null, targetMarket: null, currentRelationshipPosture: 'adversarial', assumptions: [] });
    expect(o.evidenceSummary.dataUsed[2]).toBe('industry: default');
    expect(o.relationshipCompatibility).not.toBeNull();
    expect(o.negotiationStrategy.relationshipAdjustment).not.toBeNull();
  });
});
