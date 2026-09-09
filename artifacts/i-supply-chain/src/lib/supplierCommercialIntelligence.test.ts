import { describe, it, expect } from 'vitest';
import {
  computePriceTrajectory,
  assessCostDriverJustification,
  assessNegotiationLeverage,
  recommendNextMove,
  buildNegotiationBrief,
  buildNegotiationBriefPrompt,
  type PricePoint,
  type NegotiationRoundHistory,
} from './supplierCommercialIntelligence';
import {
  assessRelationshipCompatibility,
  recommendNegotiationStrategy,
  buildNegotiationPlan,
} from './supplierSourcingStrategy';

describe('computePriceTrajectory', () => {
  it('returns INSUFFICIENT_DATA with fewer than 3 points', () => {
    const points: PricePoint[] = [
      { periodLabel: 'Q1', price: 100, sortKey: '2026-01' },
      { periodLabel: 'Q2', price: 112, sortKey: '2026-04' },
    ];
    expect(computePriceTrajectory(points).direction).toBe('INSUFFICIENT_DATA');
  });

  it('returns INSUFFICIENT_DATA with zero points', () => {
    expect(computePriceTrajectory([]).direction).toBe('INSUFFICIENT_DATA');
  });

  it('classifies up when change exceeds the default flat band', () => {
    const points: PricePoint[] = [
      { periodLabel: 'Q1', price: 100, sortKey: '2026-01' },
      { periodLabel: 'Q2', price: 105, sortKey: '2026-04' },
      { periodLabel: 'Q3', price: 112, sortKey: '2026-07' },
    ];
    const result = computePriceTrajectory(points, { periodMonths: 6 });
    expect(result.direction).toBe('up');
    expect(result.percentChange).toBe(12);
    expect(result.basis).toBe('observed');
    expect(result.flatBandPctApplied).toBe(3);
    expect(result.flatBandSource).toBe('generic-default');
  });

  it('classifies down when change is below the negative flat band', () => {
    const points: PricePoint[] = [
      { periodLabel: 'Q1', price: 100, sortKey: '2026-01' },
      { periodLabel: 'Q2', price: 95, sortKey: '2026-04' },
      { periodLabel: 'Q3', price: 90, sortKey: '2026-07' },
    ];
    const result = computePriceTrajectory(points);
    expect(result.direction).toBe('down');
    expect(result.percentChange).toBe(-10);
  });

  it('classifies flat within the default +/-3% band', () => {
    const points: PricePoint[] = [
      { periodLabel: 'Q1', price: 100, sortKey: '2026-01' },
      { periodLabel: 'Q2', price: 101, sortKey: '2026-04' },
      { periodLabel: 'Q3', price: 102, sortKey: '2026-07' },
    ];
    expect(computePriceTrajectory(points).direction).toBe('flat');
  });

  it('exact +3% boundary is flat, not up (uses > not >=)', () => {
    const points: PricePoint[] = [
      { periodLabel: 'Q1', price: 100, sortKey: '2026-01' },
      { periodLabel: 'Q2', price: 101, sortKey: '2026-04' },
      { periodLabel: 'Q3', price: 103, sortKey: '2026-07' },
    ];
    expect(computePriceTrajectory(points).direction).toBe('flat');
  });

  it('exact -3% boundary is flat, not down', () => {
    const points: PricePoint[] = [
      { periodLabel: 'Q1', price: 100, sortKey: '2026-01' },
      { periodLabel: 'Q2', price: 99, sortKey: '2026-04' },
      { periodLabel: 'Q3', price: 97, sortKey: '2026-07' },
    ];
    expect(computePriceTrajectory(points).direction).toBe('flat');
  });

  it('sorts out-of-order points by sortKey before classifying', () => {
    const points: PricePoint[] = [
      { periodLabel: 'Q3', price: 112, sortKey: '2026-07' },
      { periodLabel: 'Q1', price: 100, sortKey: '2026-01' },
      { periodLabel: 'Q2', price: 105, sortKey: '2026-04' },
    ];
    const result = computePriceTrajectory(points);
    expect(result.direction).toBe('up');
    expect(result.percentChange).toBe(12);
  });

  it('respects a custom flatBandPct override', () => {
    const points: PricePoint[] = [
      { periodLabel: 'Q1', price: 100, sortKey: '2026-01' },
      { periodLabel: 'Q2', price: 104, sortKey: '2026-04' },
      { periodLabel: 'Q3', price: 105, sortKey: '2026-07' },
    ];
    // 5% change; default band (3%) would call this "up", a wider band should call it "flat"
    expect(computePriceTrajectory(points).direction).toBe('up');
    const overridden = computePriceTrajectory(points, { flatBandPct: 10 });
    expect(overridden.direction).toBe('flat');
    expect(overridden.flatBandSource).toBe('caller-override');
  });

  it('pressure-test-found gap, fixed: a mid-period spike that returns to baseline is not silently called flat', () => {
    // 100 -> 130 -> 128 -> 101: net change ~1% (flat under first-vs-last), but a real 30% mid-period spike occurred.
    const points: PricePoint[] = [
      { periodLabel: 'M1', price: 100, sortKey: '2026-01' },
      { periodLabel: 'M2', price: 130, sortKey: '2026-02' },
      { periodLabel: 'M3', price: 128, sortKey: '2026-03' },
      { periodLabel: 'M4', price: 101, sortKey: '2026-04' },
    ];
    const result = computePriceTrajectory(points);
    expect(result.direction).toBe('flat');
    expect(result.maxIntraPeriodSwingPct).toBe(30);
    expect(result.hasIntermediateVolatility).toBe(true);
  });

  it('does not flag volatility when the trend is monotonic (no gap introduced)', () => {
    const points: PricePoint[] = [
      { periodLabel: 'Q1', price: 100, sortKey: '2026-01' },
      { periodLabel: 'Q2', price: 105, sortKey: '2026-04' },
      { periodLabel: 'Q3', price: 112, sortKey: '2026-07' },
    ];
    const result = computePriceTrajectory(points);
    expect(result.hasIntermediateVolatility).toBe(false);
    expect(result.maxIntraPeriodSwingPct).toBe(12);
  });

  it('INSUFFICIENT_DATA case has null maxIntraPeriodSwingPct/hasIntermediateVolatility, not false/0', () => {
    const result = computePriceTrajectory([{ periodLabel: 'Q1', price: 100, sortKey: '2026-01' }]);
    expect(result.maxIntraPeriodSwingPct).toBeNull();
    expect(result.hasIntermediateVolatility).toBeNull();
  });

  it('handles zero-price first point without throwing (percentChange null)', () => {
    const points: PricePoint[] = [
      { periodLabel: 'Q1', price: 0, sortKey: '2026-01' },
      { periodLabel: 'Q2', price: 10, sortKey: '2026-04' },
      { periodLabel: 'Q3', price: 20, sortKey: '2026-07' },
    ];
    const result = computePriceTrajectory(points);
    expect(result.percentChange).toBeNull();
    expect(result.direction).toBe('INSUFFICIENT_DATA');
  });

  describe('deep-enhancement pass: quadrant-informed flat-band heuristic (KRALJIC USAGE MAP 5a)', () => {
    it('a 4% move classifies as "up" for Leverage (tight 2% band) but "flat" for Bottleneck (loose 5% band)', () => {
      const points: PricePoint[] = [
        { periodLabel: 'Q1', price: 100, sortKey: '2026-01' },
        { periodLabel: 'Q2', price: 102, sortKey: '2026-04' },
        { periodLabel: 'Q3', price: 104, sortKey: '2026-07' },
      ];
      const leverageResult = computePriceTrajectory(points, { quadrant: 'leverage' });
      expect(leverageResult.direction).toBe('up');
      expect(leverageResult.flatBandPctApplied).toBe(2);
      expect(leverageResult.flatBandSource).toBe('quadrant-informed-default');

      const bottleneckResult = computePriceTrajectory(points, { quadrant: 'bottleneck' });
      expect(bottleneckResult.direction).toBe('flat');
      expect(bottleneckResult.flatBandPctApplied).toBe(5);
      expect(bottleneckResult.flatBandSource).toBe('quadrant-informed-default');
    });

    it('an explicit flatBandPct always wins over a supplied quadrant', () => {
      const points: PricePoint[] = [
        { periodLabel: 'Q1', price: 100, sortKey: '2026-01' },
        { periodLabel: 'Q2', price: 102, sortKey: '2026-04' },
        { periodLabel: 'Q3', price: 104, sortKey: '2026-07' },
      ];
      const result = computePriceTrajectory(points, { quadrant: 'leverage', flatBandPct: 10 });
      expect(result.direction).toBe('flat');
      expect(result.flatBandSource).toBe('caller-override');
    });

    it('with no quadrant supplied, falls back to the plain generic default, not a quadrant default', () => {
      const points: PricePoint[] = [
        { periodLabel: 'Q1', price: 100, sortKey: '2026-01' },
        { periodLabel: 'Q2', price: 102, sortKey: '2026-04' },
        { periodLabel: 'Q3', price: 104, sortKey: '2026-07' },
      ];
      const result = computePriceTrajectory(points);
      expect(result.flatBandPctApplied).toBe(3);
      expect(result.flatBandSource).toBe('generic-default');
    });
  });
});

describe('assessCostDriverJustification', () => {
  it('returns INSUFFICIENT_DATA (supported: null) when no reference figure exists', () => {
    const result = assessCostDriverJustification(
      { driver: 'Aluminum market pricing', claimedImpactPct: 12, basis: 'estimated' },
      null,
    );
    expect(result.supported).toBeNull();
    expect(result.gapPct).toBeNull();
  });

  it('returns INSUFFICIENT_DATA when claimedImpactPct is null even with a reference figure', () => {
    const result = assessCostDriverJustification(
      { driver: 'Freight surcharge', claimedImpactPct: null, basis: 'estimated' },
      4,
    );
    expect(result.supported).toBeNull();
  });

  it('the Rawabi case: 12% claimed vs 4% real aluminum move is NOT supported', () => {
    const result = assessCostDriverJustification(
      { driver: 'Aluminum market pricing', claimedImpactPct: 12, basis: 'estimated' },
      4,
    );
    expect(result.supported).toBe(false);
    expect(result.gapPct).toBe(8);
    expect(result.toleranceApplied).toBe(2);
    expect(result.toleranceSource).toBe('generic-default');
  });

  it('a claim within tolerance of the reference figure is supported', () => {
    const result = assessCostDriverJustification(
      { driver: 'Energy costs', claimedImpactPct: 5, basis: 'estimated' },
      4,
    );
    expect(result.supported).toBe(true);
  });

  it('exact tolerance boundary (2pt gap) is supported', () => {
    const result = assessCostDriverJustification(
      { driver: 'Labor costs', claimedImpactPct: 6, basis: 'estimated' },
      4,
    );
    expect(result.supported).toBe(true);
    expect(result.gapPct).toBe(2);
  });

  it('handles a negative gap (claim understates vs reference) symmetrically', () => {
    const result = assessCostDriverJustification(
      { driver: 'FX movement', claimedImpactPct: 1, basis: 'estimated' },
      6,
    );
    expect(result.supported).toBe(false);
    expect(result.gapPct).toBe(-5);
  });

  describe('deep-enhancement pass: quadrant-informed justification tolerance (KRALJIC USAGE MAP 5a)', () => {
    it('the same 3-point gap is unsupported for Leverage (1pt tolerance) but supported for Non-critical (4pt tolerance)', () => {
      const leverageResult = assessCostDriverJustification(
        { driver: 'Packaging cost', claimedImpactPct: 7, basis: 'estimated' },
        4,
        { quadrant: 'leverage' },
      );
      expect(leverageResult.supported).toBe(false);
      expect(leverageResult.toleranceApplied).toBe(1);
      expect(leverageResult.toleranceSource).toBe('quadrant-informed-default');

      const nonCriticalResult = assessCostDriverJustification(
        { driver: 'Packaging cost', claimedImpactPct: 7, basis: 'estimated' },
        4,
        { quadrant: 'non-critical' },
      );
      expect(nonCriticalResult.supported).toBe(true);
      expect(nonCriticalResult.toleranceApplied).toBe(4);
      expect(nonCriticalResult.toleranceSource).toBe('quadrant-informed-default');
    });

    it('an explicit toleranceOverride always wins over a supplied quadrant', () => {
      const result = assessCostDriverJustification(
        { driver: 'Packaging cost', claimedImpactPct: 7, basis: 'estimated' },
        4,
        { quadrant: 'leverage', toleranceOverride: 10 },
      );
      expect(result.supported).toBe(true);
      expect(result.toleranceSource).toBe('caller-override');
    });
  });
});

describe('assessNegotiationLeverage', () => {
  it('returns INSUFFICIENT_DATA when lockInIndex is null', () => {
    expect(assessNegotiationLeverage({ lockInIndex: null, isSurvivable: true }).level).toBe('INSUFFICIENT_DATA');
  });

  it('returns INSUFFICIENT_DATA when isSurvivable is null', () => {
    expect(assessNegotiationLeverage({ lockInIndex: 1, isSurvivable: null }).level).toBe('INSUFFICIENT_DATA');
  });

  it('STRONG requires both low lock-in AND survivable', () => {
    const result = assessNegotiationLeverage({ lockInIndex: 1.5, isSurvivable: true });
    expect(result.level).toBe('STRONG');
  });

  it('low lock-in but NOT survivable is WEAK, not STRONG (conjunction, not average)', () => {
    const result = assessNegotiationLeverage({ lockInIndex: 1.5, isSurvivable: false });
    expect(result.level).toBe('WEAK');
  });

  it('high lock-in but survivable is still WEAK', () => {
    const result = assessNegotiationLeverage({ lockInIndex: 4.5, isSurvivable: true });
    expect(result.level).toBe('WEAK');
  });

  it('exact boundary lockInIndex=2 with survivable is STRONG (uses <=)', () => {
    expect(assessNegotiationLeverage({ lockInIndex: 2, isSurvivable: true }).level).toBe('STRONG');
  });

  it('exact boundary lockInIndex=4 is WEAK (uses >=)', () => {
    expect(assessNegotiationLeverage({ lockInIndex: 4, isSurvivable: true }).level).toBe('WEAK');
  });

  it('mid-range lock-in with survivable is MODERATE', () => {
    expect(assessNegotiationLeverage({ lockInIndex: 3, isSurvivable: true }).level).toBe('MODERATE');
  });

  describe('deep-enhancement pass: leverage/quadrant structural consistency check (KRALJIC USAGE MAP 5b)', () => {
    it('flags a Leverage-quadrant supplier with WEAK computed leverage as a structural mismatch worth re-verifying', () => {
      const result = assessNegotiationLeverage({ lockInIndex: 4.5, isSurvivable: true }, 'leverage');
      expect(result.level).toBe('WEAK');
      expect(result.quadrantConsistencyNote).not.toBeNull();
      expect(result.quadrantConsistencyNote).toContain('Leverage-quadrant supplier');
      expect(result.quadrantConsistencyNoteAr).not.toBeNull();
      expect(result.quadrantConsistencyNoteAr).toMatch(/[؀-ۿ]/);
    });

    it('flags a Bottleneck-quadrant supplier with STRONG computed leverage as a structural mismatch worth re-verifying', () => {
      const result = assessNegotiationLeverage({ lockInIndex: 1, isSurvivable: true }, 'bottleneck');
      expect(result.level).toBe('STRONG');
      expect(result.quadrantConsistencyNote).not.toBeNull();
      expect(result.quadrantConsistencyNote).toContain('Bottleneck-quadrant supplier');
      expect(result.quadrantConsistencyNoteAr).not.toBeNull();
    });

    it('does NOT flag a Leverage-quadrant supplier with STRONG leverage (the expected, consistent case)', () => {
      const result = assessNegotiationLeverage({ lockInIndex: 1, isSurvivable: true }, 'leverage');
      expect(result.quadrantConsistencyNote).toBeNull();
      expect(result.quadrantConsistencyNoteAr).toBeNull();
    });

    it('does NOT flag a Bottleneck-quadrant supplier with WEAK leverage (the expected, consistent case)', () => {
      const result = assessNegotiationLeverage({ lockInIndex: 4.5, isSurvivable: true }, 'bottleneck');
      expect(result.quadrantConsistencyNote).toBeNull();
      expect(result.quadrantConsistencyNoteAr).toBeNull();
    });

    it('never applies the consistency check to Strategic or Non-critical quadrants (no sourced structural prediction exists for them)', () => {
      const strategicWeak = assessNegotiationLeverage({ lockInIndex: 4.5, isSurvivable: true }, 'strategic');
      expect(strategicWeak.quadrantConsistencyNote).toBeNull();
      const strategicStrong = assessNegotiationLeverage({ lockInIndex: 1, isSurvivable: true }, 'strategic');
      expect(strategicStrong.quadrantConsistencyNote).toBeNull();
      const nonCriticalWeak = assessNegotiationLeverage({ lockInIndex: 4.5, isSurvivable: true }, 'non-critical');
      expect(nonCriticalWeak.quadrantConsistencyNote).toBeNull();
      const nonCriticalStrong = assessNegotiationLeverage({ lockInIndex: 1, isSurvivable: true }, 'non-critical');
      expect(nonCriticalStrong.quadrantConsistencyNote).toBeNull();
    });

    it('does not apply the check at all when no quadrant is supplied (existing callers unaffected)', () => {
      const result = assessNegotiationLeverage({ lockInIndex: 4.5, isSurvivable: true });
      expect(result.quadrantConsistencyNote).toBeNull();
      expect(result.quadrantConsistencyNoteAr).toBeNull();
    });
  });
});

describe('recommendNextMove (Tit-for-Tat, Module 02 rule)', () => {
  it('opens cooperatively with no history', () => {
    expect(recommendNextMove([]).move).toBe('cooperate');
  });

  it('matches a defection once', () => {
    const history: NegotiationRoundHistory = [
      { date: '2026-06-01', ourMove: 'cooperated', counterpartMove: 'defected', note: 'renegotiated agreed price mid-contract' },
    ];
    expect(recommendNextMove(history).move).toBe('match-defection');
  });

  it('never holds a grudge past one retaliatory round', () => {
    const history: NegotiationRoundHistory = [
      { date: '2026-06-01', ourMove: 'cooperated', counterpartMove: 'defected', note: 'renegotiated agreed price mid-contract' },
      { date: '2026-07-01', ourMove: 'defected', counterpartMove: 'defected', note: 'we matched, they defected again' },
    ];
    // We already retaliated last round -- must return to cooperate regardless of continued defection.
    expect(recommendNextMove(history).move).toBe('cooperate');
  });

  it('continues cooperating after mutual cooperation', () => {
    const history: NegotiationRoundHistory = [
      { date: '2026-06-01', ourMove: 'cooperated', counterpartMove: 'cooperated', note: 'smooth renewal' },
    ];
    expect(recommendNextMove(history).move).toBe('cooperate');
  });

  it('treats an unclear signal as cooperate, not a defection trigger', () => {
    const history: NegotiationRoundHistory = [
      { date: '2026-06-01', ourMove: 'cooperated', counterpartMove: 'unclear', note: 'ambiguous delay, cause not confirmed' },
    ];
    expect(recommendNextMove(history).move).toBe('cooperate');
  });

  it('resumes tit-for-tat after the one-round grace period if a new defection occurs', () => {
    const history: NegotiationRoundHistory = [
      { date: '2026-05-01', ourMove: 'cooperated', counterpartMove: 'defected', note: 'first defection' },
      { date: '2026-06-01', ourMove: 'defected', counterpartMove: 'cooperated', note: 'we matched, they came back' },
      { date: '2026-07-01', ourMove: 'cooperated', counterpartMove: 'defected', note: 'second, later defection' },
    ];
    // Last round: our move was 'cooperated' (the grace-period round), counterpart defected again -> should retaliate fresh.
    expect(recommendNextMove(history).move).toBe('match-defection');
  });
});

describe('buildNegotiationBrief + buildNegotiationBriefPrompt (orchestration)', () => {
  it('counts unsupported cost-driver justifications and surfaces them in the narrative', () => {
    const brief = buildNegotiationBrief({
      supplierId: 'test-supplier',
      kraljicQuadrant: 'strategic',
      priceTrajectory: { direction: 'up', periodMonths: 6, percentChange: 12, basis: 'observed', maxIntraPeriodSwingPct: 12, hasIntermediateVolatility: false },
      costDriverJustifications: [
        assessCostDriverJustification({ driver: 'Aluminum market pricing', claimedImpactPct: 12, basis: 'estimated' }, 4),
        assessCostDriverJustification({ driver: 'Freight', claimedImpactPct: 3, basis: 'estimated' }, 3),
      ],
      tcoReferenceId: 'tco-123',
      contractEntitlementId: null,
      negotiationLeverage: assessNegotiationLeverage({ lockInIndex: 3, isSurvivable: true }),
      negotiationRoundHistory: [],
      relationshipCompatibility: null,
      negotiationStrategy: null,
      negotiationPlan: null,
    });

    expect(brief.unsupportedCostDriverCount).toBe(1);
    expect(brief.nextMove.move).toBe('cooperate');

    const en = buildNegotiationBriefPrompt(brief, false);
    expect(en).toContain('1 cost-driver justification(s) not supported');
    expect(en).toContain('up');

    const ar = buildNegotiationBriefPrompt(brief, true);
    expect(ar).toContain('محرّكات التكلفة غير مدعومة');
  });

  it('QA-found gap, fixed: Arabic narrative translates the direction/basis enums instead of leaking raw English words', () => {
    const baseInput = {
      supplierId: 'test-supplier',
      kraljicQuadrant: 'strategic' as const,
      costDriverJustifications: [],
      tcoReferenceId: null,
      contractEntitlementId: null,
      negotiationLeverage: assessNegotiationLeverage({ lockInIndex: 3, isSurvivable: true }),
      negotiationRoundHistory: [],
      relationshipCompatibility: null,
      negotiationStrategy: null,
      negotiationPlan: null,
    };

    const upBrief = buildNegotiationBrief({
      ...baseInput,
      priceTrajectory: { direction: 'up', periodMonths: 6, percentChange: 12, basis: 'estimated', maxIntraPeriodSwingPct: 12, hasIntermediateVolatility: false },
    });
    const ar = buildNegotiationBriefPrompt(upBrief, true);
    // Before the fix this string contained the raw English enum values ("up", "estimated").
    expect(ar).not.toMatch(/\bup\b/);
    expect(ar).not.toMatch(/\bestimated\b/);
    expect(ar).toContain('ارتفاع');
    expect(ar).toContain('مُقدَّر');

    const downBrief = buildNegotiationBrief({
      ...baseInput,
      priceTrajectory: { direction: 'down', periodMonths: 6, percentChange: -12, basis: 'calculated', maxIntraPeriodSwingPct: 12, hasIntermediateVolatility: false },
    });
    const arDown = buildNegotiationBriefPrompt(downBrief, true);
    expect(arDown).not.toMatch(/\bdown\b/);
    expect(arDown).not.toMatch(/\bcalculated\b/);
    expect(arDown).toContain('انخفاض');
    expect(arDown).toContain('مُحتسب');
  });

  it('QA-found gap, fixed: INSUFFICIENT_DATA leverage message is grammatical Arabic, not a garbled "and/or" construction', () => {
    const leverage = assessNegotiationLeverage({ lockInIndex: null, isSurvivable: null });
    expect(leverage.framingAr).not.toContain('ولم/أو');
    expect(leverage.framingAr).toContain('لم تُصدر الوحدة 05');
  });

  it('handles a fully INSUFFICIENT_DATA supplier without throwing', () => {
    const brief = buildNegotiationBrief({
      supplierId: 'new-supplier',
      kraljicQuadrant: null,
      priceTrajectory: { direction: 'INSUFFICIENT_DATA', periodMonths: null, percentChange: null, basis: null, maxIntraPeriodSwingPct: null, hasIntermediateVolatility: null },
      costDriverJustifications: [],
      tcoReferenceId: null,
      contractEntitlementId: null,
      negotiationLeverage: assessNegotiationLeverage({ lockInIndex: null, isSurvivable: null }),
      negotiationRoundHistory: [],
      relationshipCompatibility: null,
      negotiationStrategy: null,
      negotiationPlan: null,
    });
    expect(brief.unsupportedCostDriverCount).toBe(0);
    expect(brief.relationshipCompatibility).toBeNull();
    expect(brief.negotiationStrategy).toBeNull();
    expect(brief.negotiationPlan).toBeNull();
    const en = buildNegotiationBriefPrompt(brief, false);
    expect(en).toContain('INSUFFICIENT_DATA');
  });

  it('surfaces the intermediate-volatility caveat in the narrative when flagged (pressure-test-found gap, fixed)', () => {
    const brief = buildNegotiationBrief({
      supplierId: 'volatile-supplier',
      kraljicQuadrant: 'leverage',
      priceTrajectory: computePriceTrajectory([
        { periodLabel: 'M1', price: 100, sortKey: '2026-01' },
        { periodLabel: 'M2', price: 130, sortKey: '2026-02' },
        { periodLabel: 'M3', price: 128, sortKey: '2026-03' },
        { periodLabel: 'M4', price: 101, sortKey: '2026-04' },
      ]),
      costDriverJustifications: [],
      tcoReferenceId: null,
      contractEntitlementId: null,
      negotiationLeverage: assessNegotiationLeverage({ lockInIndex: 2.5, isSurvivable: true }),
      negotiationRoundHistory: [],
      relationshipCompatibility: null,
      negotiationStrategy: null,
      negotiationPlan: null,
    });

    const en = buildNegotiationBriefPrompt(brief, false);
    expect(en).toContain('Caveat: price moved 30%');
    const ar = buildNegotiationBriefPrompt(brief, true);
    expect(ar).toContain('تنبيه');
  });

  describe('deep-enhancement pass: architecture correction -- real Module 02 pass-through, not a hard import', () => {
    // These tests deliberately call Module 02's OWN real functions to build the input --
    // proving buildNegotiationBrief() is a pure pass-through of already-computed Module 02
    // output, not a reimplementation, and not a hard runtime dependency (this test file, not
    // supplierCommercialIntelligence.ts, is what imports supplierSourcingStrategy).

    it('passes through a real relationshipCompatibility, negotiationStrategy, and negotiationPlan unchanged', () => {
      const quadrant = 'bottleneck' as const;
      const relationshipCompatibility = assessRelationshipCompatibility(quadrant, 'adversarial');
      const negotiationStrategy = recommendNegotiationStrategy(quadrant, relationshipCompatibility);
      const negotiationPlan = buildNegotiationPlan(quadrant);

      const brief = buildNegotiationBrief({
        supplierId: 'bottleneck-supplier',
        kraljicQuadrant: quadrant,
        priceTrajectory: { direction: 'flat', periodMonths: 12, percentChange: 1, basis: 'observed', maxIntraPeriodSwingPct: 1, hasIntermediateVolatility: false },
        costDriverJustifications: [],
        tcoReferenceId: null,
        contractEntitlementId: null,
        negotiationLeverage: assessNegotiationLeverage({ lockInIndex: 4.2, isSurvivable: false }, quadrant),
        negotiationRoundHistory: [],
        relationshipCompatibility,
        negotiationStrategy,
        negotiationPlan,
      });

      // Pure pass-through: same object references/values, nothing recomputed.
      expect(brief.relationshipCompatibility).toBe(relationshipCompatibility);
      expect(brief.negotiationStrategy).toBe(negotiationStrategy);
      expect(brief.negotiationPlan).toBe(negotiationPlan);
      // The Bottleneck + Adversarial case is Module 02's own named highest-risk combination.
      expect(brief.relationshipCompatibility!.severity).toBe('high-risk');
      expect(brief.negotiationPlan!.team.length).toBeGreaterThan(0);
      expect(brief.negotiationPlan!.levels.length).toBeGreaterThan(0);
    });

    it('the bilingual narrative renders the real Module 02 team/level/tactics/strategy/relationship content correctly', () => {
      const quadrant = 'bottleneck' as const;
      const relationshipCompatibility = assessRelationshipCompatibility(quadrant, 'adversarial');
      const negotiationStrategy = recommendNegotiationStrategy(quadrant, relationshipCompatibility);
      const negotiationPlan = buildNegotiationPlan(quadrant);

      const brief = buildNegotiationBrief({
        supplierId: 'bottleneck-supplier',
        kraljicQuadrant: quadrant,
        priceTrajectory: { direction: 'flat', periodMonths: 12, percentChange: 1, basis: 'observed', maxIntraPeriodSwingPct: 1, hasIntermediateVolatility: false },
        costDriverJustifications: [],
        tcoReferenceId: null,
        contractEntitlementId: null,
        negotiationLeverage: assessNegotiationLeverage({ lockInIndex: 4.2, isSurvivable: false }, quadrant),
        negotiationRoundHistory: [],
        relationshipCompatibility,
        negotiationStrategy,
        negotiationPlan,
      });

      const en = buildNegotiationBriefPrompt(brief, false);
      expect(en).toContain(`${negotiationPlan.team.length}-role team`);
      expect(en).toContain('Recommended negotiation approach (Module 02, bottleneck quadrant)');
      expect(en).toContain(negotiationStrategy.approachRationale);
      expect(en).toContain(relationshipCompatibility.advisory);
      if (negotiationPlan.recommendedTactics.length > 0) {
        expect(en).toContain(negotiationPlan.recommendedTactics[0].name.en);
      }
      if (negotiationPlan.watchForTactics.length > 0) {
        expect(en).toContain(negotiationPlan.watchForTactics[0].name.en);
      }

      const ar = buildNegotiationBriefPrompt(brief, true);
      // Canonical quadrant Arabic label from kraljicScoring.ts's QUADRANT_META, not a
      // re-invented one -- this is the terminology-consistency fix.
      expect(ar).toContain('نقطة اختناق');
      expect(ar).toContain(negotiationStrategy.approachRationaleAr);
      expect(ar).toContain(relationshipCompatibility.advisoryAr);
      expect(ar).toMatch(/[؀-ۿ]/);
      if (negotiationPlan.recommendedTactics.length > 0) {
        expect(ar).toContain(negotiationPlan.recommendedTactics[0].name.ar);
      }
    });

    it('terminology-consistency fix: quadrant Arabic label matches kraljicScoring.ts\'s canonical QUADRANT_META, not an independently-invented label', () => {
      // Regression for the specific mismatch found this pass: an earlier local
      // QUADRANT_LABEL_AR map used 'عنق زجاجة' for bottleneck and 'ذو قوة تفاوضية' for
      // leverage -- both inconsistent with the platform's one canonical source.
      for (const quadrant of ['strategic', 'leverage', 'bottleneck', 'non-critical'] as const) {
        const strategy = recommendNegotiationStrategy(quadrant, null);
        const brief = buildNegotiationBrief({
          supplierId: 'terminology-check',
          kraljicQuadrant: quadrant,
          priceTrajectory: { direction: 'INSUFFICIENT_DATA', periodMonths: null, percentChange: null, basis: null, maxIntraPeriodSwingPct: null, hasIntermediateVolatility: null },
          costDriverJustifications: [],
          tcoReferenceId: null,
          contractEntitlementId: null,
          negotiationLeverage: assessNegotiationLeverage({ lockInIndex: null, isSurvivable: null }),
          negotiationRoundHistory: [],
          relationshipCompatibility: null,
          negotiationStrategy: strategy,
          negotiationPlan: null,
        });
        const ar = buildNegotiationBriefPrompt(brief, true);
        const expectedLabelAr: Record<typeof quadrant, string> = {
          strategic: 'استراتيجي',
          leverage: 'نفوذ سوقي',
          bottleneck: 'نقطة اختناق',
          'non-critical': 'غير حرج',
        };
        expect(ar).toContain(expectedLabelAr[quadrant]);
      }
    });

    it('does not render a relationship-adjustment line when Module 02 found none to give (aligned posture)', () => {
      const quadrant = 'leverage' as const;
      const relationshipCompatibility = assessRelationshipCompatibility(quadrant, 'transactional'); // aligned -- leverage's ideal is transactional
      const strategy = recommendNegotiationStrategy(quadrant, relationshipCompatibility);
      expect(strategy.relationshipAdjustment).not.toBeNull(); // aligned still gets a reassuring note, per Module 02's own design
      const brief = buildNegotiationBrief({
        supplierId: 'aligned-supplier',
        kraljicQuadrant: quadrant,
        priceTrajectory: { direction: 'flat', periodMonths: 12, percentChange: 0, basis: 'observed', maxIntraPeriodSwingPct: 0, hasIntermediateVolatility: false },
        costDriverJustifications: [],
        tcoReferenceId: null,
        contractEntitlementId: null,
        negotiationLeverage: assessNegotiationLeverage({ lockInIndex: 1, isSurvivable: true }),
        negotiationRoundHistory: [],
        relationshipCompatibility,
        negotiationStrategy: strategy,
        negotiationPlan: null,
      });
      const ar = buildNegotiationBriefPrompt(brief, true);
      expect(ar).toContain(strategy.relationshipAdjustmentAr);
    });
  });
});
