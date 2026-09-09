import { describe, it, expect } from 'vitest';
import {
  computePriceTrajectory,
  assessCostDriverJustification,
  assessNegotiationLeverage,
  recommendNextMove,
  buildNegotiationBrief,
  buildNegotiationBriefPrompt,
  assessShouldCostGap,
  assessNegotiationOutcome,
  buildNegotiationValueLedger,
  assessPaymentTermsValue,
  assessRebateTierPosition,
  assessVolumeConsolidationOpportunity,
  type PricePoint,
  type NegotiationRoundHistory,
  type ShouldCostModel,
  type QuotedCostBreakdown,
  type RebateTier,
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

  describe('expertise-viewpoint enhancement: index-linked-clause suggestion', () => {
    it('suggests an index-linked clause only when a real reference exists AND the claim is unsupported', () => {
      const result = assessCostDriverJustification({ driver: 'Aluminum market pricing', claimedImpactPct: 12, basis: 'estimated' }, 4);
      expect(result.supported).toBe(false);
      expect(result.suggestIndexLinkedClause).toBe(true);
      expect(result.indexLinkedClauseNoteEn).toContain('index-linked pricing clause');
      expect(result.indexLinkedClauseNoteAr).toMatch(/[؀-ۿ]/);
    });

    it('does not suggest an index-linked clause when the claim is supported', () => {
      const result = assessCostDriverJustification({ driver: 'Energy costs', claimedImpactPct: 5, basis: 'estimated' }, 4);
      expect(result.suggestIndexLinkedClause).toBe(false);
      expect(result.indexLinkedClauseNoteEn).toBeUndefined();
    });

    it('does not suggest an index-linked clause on INSUFFICIENT_DATA (no reference figure at all)', () => {
      const result = assessCostDriverJustification({ driver: 'Freight surcharge', claimedImpactPct: 5, basis: 'estimated' }, null);
      expect(result.suggestIndexLinkedClause).toBe(false);
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

describe('assessShouldCostGap (expertise-viewpoint enhancement: Section 7)', () => {
  it('returns INSUFFICIENT_DATA with no model or no quoted price', () => {
    expect(assessShouldCostGap(null, 100).severity).toBe('INSUFFICIENT_DATA');
    const model: ShouldCostModel = { components: [{ category: 'raw_materials', description: 'x', amount: 10, basis: 'estimated' }], currency: 'SAR', basis: 'estimated', archetype: 'manufactured_goods' };
    expect(assessShouldCostGap(model, null).severity).toBe('INSUFFICIENT_DATA');
  });

  it('classifies ALIGNED / MODERATE_GAP / MATERIAL_GAP using the generic default tolerance (10%)', () => {
    const model: ShouldCostModel = {
      components: [
        { category: 'raw_materials', description: 'steel', amount: 60, basis: 'estimated' },
        { category: 'direct_labor', description: 'assembly', amount: 40, basis: 'estimated' },
      ],
      currency: 'SAR',
      basis: 'estimated',
      archetype: 'manufactured_goods',
    };
    expect(assessShouldCostGap(model, 105).severity).toBe('ALIGNED'); // 5% gap
    expect(assessShouldCostGap(model, 115).severity).toBe('MODERATE_GAP'); // 15% gap
    expect(assessShouldCostGap(model, 140).severity).toBe('MATERIAL_GAP'); // 40% gap
  });

  it('applies a quadrant-informed tolerance in place of the generic default', () => {
    const model: ShouldCostModel = { components: [{ category: 'raw_materials', description: 'x', amount: 100, basis: 'estimated' }], currency: 'SAR', basis: 'estimated', archetype: 'manufactured_goods' };
    const leverageResult = assessShouldCostGap(model, 107, { quadrant: 'leverage' }); // 7% gap
    expect(leverageResult.toleranceApplied).toBe(6);
    expect(leverageResult.toleranceSource).toBe('quadrant-informed-default');
    expect(leverageResult.severity).toBe('MODERATE_GAP'); // 7% > 6% leverage tolerance
    const bottleneckResult = assessShouldCostGap(model, 107, { quadrant: 'bottleneck' });
    expect(bottleneckResult.toleranceApplied).toBe(15);
    expect(bottleneckResult.severity).toBe('ALIGNED'); // 7% <= 15% bottleneck tolerance
  });

  it('computes a cost-structure fingerprint sorted descending by amount', () => {
    const model: ShouldCostModel = {
      components: [
        { category: 'raw_materials', description: 'x', amount: 30, basis: 'estimated' },
        { category: 'direct_labor', description: 'y', amount: 50, basis: 'estimated' },
        { category: 'sga_allocation', description: 'z', amount: 20, basis: 'estimated' },
      ],
      currency: 'SAR',
      basis: 'estimated',
      archetype: 'manufactured_goods',
    };
    const result = assessShouldCostGap(model, 100);
    expect(result.categoryFingerprint.map((c) => c.category)).toEqual(['direct_labor', 'raw_materials', 'sga_allocation']);
    expect(result.categoryFingerprint[0].pctOfTotal).toBe(50);
  });

  it('produces category-level gaps and identifies the top driver only when a supplier quoted breakdown is supplied', () => {
    const model: ShouldCostModel = {
      components: [
        { category: 'raw_materials', description: 'x', amount: 40, basis: 'estimated' },
        { category: 'supplier_margin', description: 'margin', amount: 10, basis: 'estimated' },
      ],
      currency: 'SAR',
      basis: 'estimated',
      archetype: 'manufactured_goods',
    };
    const aggregateOnly = assessShouldCostGap(model, 70);
    expect(aggregateOnly.granularity).toBe('aggregate');
    expect(aggregateOnly.categoryGaps).toBeNull();

    const quotedBreakdown: QuotedCostBreakdown = {
      components: [
        { category: 'raw_materials', description: 'x', amount: 40, basis: 'observed' },
        { category: 'supplier_margin', description: 'margin', amount: 30, basis: 'observed' },
      ],
      currency: 'SAR',
    };
    const categoryLevel = assessShouldCostGap(model, 70, { quotedBreakdown });
    expect(categoryLevel.granularity).toBe('category-level');
    expect(categoryLevel.categoryGaps).not.toBeNull();
    expect(categoryLevel.categoryGaps![0].category).toBe('supplier_margin'); // largest abs gap (20) sorted first
    expect(categoryLevel.narrativeEn).toContain('Supplier margin');
  });

  it('reports a margin observation only when a supplier_margin component exists, evaluative only with a caller-supplied expectation', () => {
    const withMargin: ShouldCostModel = {
      components: [
        { category: 'raw_materials', description: 'x', amount: 80, basis: 'estimated' },
        { category: 'supplier_margin', description: 'margin', amount: 20, basis: 'estimated' },
      ],
      currency: 'SAR',
      basis: 'estimated',
      archetype: 'manufactured_goods',
    };
    const noExpectation = assessShouldCostGap(withMargin, 100);
    expect(noExpectation.marginObservation!.marginPctOfShouldCost).toBe(20);
    expect(noExpectation.marginObservation!.expectationPct).toBeNull();
    expect(noExpectation.marginObservation!.exceedsExpectation).toBeNull();

    const withExpectation = assessShouldCostGap(withMargin, 100, { marginExpectationPct: 15 });
    expect(withExpectation.marginObservation!.exceedsExpectation).toBe(true);

    const noMargin: ShouldCostModel = { components: [{ category: 'raw_materials', description: 'x', amount: 100, basis: 'estimated' }], currency: 'SAR', basis: 'estimated', archetype: 'manufactured_goods' };
    expect(assessShouldCostGap(noMargin, 100).marginObservation).toBeNull();
  });

  describe('industry-archetype category-taxonomy check (owner follow-up: "should-cost models vary per industry")', () => {
    it('flags a category unusual for the declared archetype (raw_materials on a professional_services model)', () => {
      const model: ShouldCostModel = {
        components: [
          { category: 'direct_labor', description: 'consulting hours', amount: 80, basis: 'estimated' },
          { category: 'raw_materials', description: 'unexpected', amount: 20, basis: 'estimated' },
        ],
        currency: 'SAR',
        basis: 'estimated',
        archetype: 'professional_services',
      };
      const result = assessShouldCostGap(model, 100);
      expect(result.categoryArchetypeWarnings).toContain('raw_materials');
      expect(result.narrativeEn).toContain('professional_services'.length > 0 ? 'unusual for that archetype' : '');
    });

    it('does not flag any category for the generic archetype (always permissive)', () => {
      const model: ShouldCostModel = {
        components: [
          { category: 'license_royalty_fee', description: 'SaaS license', amount: 50, basis: 'estimated' },
          { category: 'raw_materials', description: 'unexpected', amount: 50, basis: 'estimated' },
        ],
        currency: 'SAR',
        basis: 'estimated',
        archetype: 'generic',
      };
      expect(assessShouldCostGap(model, 100).categoryArchetypeWarnings).toEqual([]);
    });

    it('does not flag fuel_energy/equipment_depreciation for a logistics_freight_services archetype (the categories this archetype exists for)', () => {
      const model: ShouldCostModel = {
        components: [
          { category: 'fuel_energy', description: 'diesel', amount: 40, basis: 'estimated' },
          { category: 'equipment_depreciation', description: 'trucks', amount: 30, basis: 'estimated' },
          { category: 'direct_labor', description: 'drivers', amount: 30, basis: 'estimated' },
        ],
        currency: 'SAR',
        basis: 'estimated',
        archetype: 'logistics_freight_services',
      };
      expect(assessShouldCostGap(model, 100).categoryArchetypeWarnings).toEqual([]);
    });
  });

  describe('category-specific override of the archetype default (owner follow-up: "should-cost differ also per category")', () => {
    it('defaults categoryCheckSource to archetype-default when no override is supplied', () => {
      const model: ShouldCostModel = {
        components: [{ category: 'raw_materials', description: 'x', amount: 100, basis: 'estimated' }],
        currency: 'SAR',
        basis: 'estimated',
        archetype: 'manufactured_goods',
      };
      const result = assessShouldCostGap(model, 100);
      expect(result.categoryCheckSource).toBe('archetype-default');
      expect(result.narrativeEn).toContain('archetype default');
    });

    it('flags equipment_depreciation on a manufactured_goods model with no override (not in the archetype default set)', () => {
      const model: ShouldCostModel = {
        components: [
          { category: 'raw_materials', description: 'aluminum billet', amount: 60, basis: 'estimated' },
          { category: 'equipment_depreciation', description: 'dedicated tooled sub-assembly line', amount: 40, basis: 'estimated' },
        ],
        currency: 'SAR',
        basis: 'estimated',
        archetype: 'manufactured_goods',
      };
      const withoutOverride = assessShouldCostGap(model, 100);
      expect(withoutOverride.categoryArchetypeWarnings).toContain('equipment_depreciation');
      expect(withoutOverride.categoryCheckSource).toBe('archetype-default');
    });

    it('a caller-supplied categoryTypicalOverride permits equipment_depreciation for a specific tooled sub-assembly category and sets categoryCheckSource to caller-override', () => {
      const model: ShouldCostModel = {
        components: [
          { category: 'raw_materials', description: 'aluminum billet', amount: 60, basis: 'estimated' },
          { category: 'equipment_depreciation', description: 'dedicated tooled sub-assembly line', amount: 40, basis: 'estimated' },
        ],
        currency: 'SAR',
        basis: 'estimated',
        archetype: 'manufactured_goods',
        unspscCategoryCode: '23153000',
        categoryLabel: 'Tooled aluminum sub-assemblies',
      };
      const withOverride = assessShouldCostGap(model, 100, {
        categoryTypicalOverride: ['raw_materials', 'direct_labor', 'manufacturing_overhead', 'tooling_equipment', 'equipment_depreciation', 'packaging', 'supplier_margin'],
      });
      expect(withOverride.categoryArchetypeWarnings).toEqual([]);
      expect(withOverride.categoryCheckSource).toBe('caller-override');
      expect(withOverride.narrativeEn).toContain('caller-supplied category-specific override');
    });

    it('a categoryTypicalOverride can also narrow the check tighter than the archetype default (flags a category the archetype default would have allowed)', () => {
      const model: ShouldCostModel = {
        components: [
          { category: 'raw_materials', description: 'aluminum billet', amount: 60, basis: 'estimated' },
          { category: 'tooling_equipment', description: 'one-off die charge', amount: 40, basis: 'estimated' },
        ],
        currency: 'SAR',
        basis: 'estimated',
        archetype: 'manufactured_goods',
      };
      // manufactured_goods archetype default includes tooling_equipment, so with no override it should not be flagged.
      expect(assessShouldCostGap(model, 100).categoryArchetypeWarnings).toEqual([]);
      // a category-specific override for e.g. an injection-molded plastic part that never carries its own tooling line
      // narrows the check and correctly flags tooling_equipment as unusual for THIS specific category.
      const narrowed = assessShouldCostGap(model, 100, {
        categoryTypicalOverride: ['raw_materials', 'direct_labor', 'manufacturing_overhead', 'packaging', 'supplier_margin'],
      });
      expect(narrowed.categoryArchetypeWarnings).toContain('tooling_equipment');
      expect(narrowed.categoryCheckSource).toBe('caller-override');
    });
  });
});

describe('Negotiated Value Tracking (expertise-viewpoint enhancement: Section 8)', () => {
  describe('assessNegotiationOutcome', () => {
    it('classifies a reduction from an already-paid baseline as HARD_SAVINGS', () => {
      const result = assessNegotiationOutcome({ id: '1', description: 'Unit price cut', baselinePrice: 100, negotiatedPrice: 90, volumeOrSpend: 1000, wasBaselineAlreadyPaid: true, recurring: false });
      expect(result.valueType).toBe('HARD_SAVINGS');
      expect(result.absoluteValue).toBe(10000);
    });

    it('classifies a reduction from a proposed (not-yet-paid) increase as COST_AVOIDANCE', () => {
      const result = assessNegotiationOutcome({ id: '2', description: 'Increase negotiated down', baselinePrice: 112, negotiatedPrice: 103, volumeOrSpend: 1000, wasBaselineAlreadyPaid: false, recurring: false });
      expect(result.valueType).toBe('COST_AVOIDANCE');
      expect(result.absoluteValue).toBe(9000);
    });

    it('never claims value when the negotiated price does not improve on the baseline', () => {
      const result = assessNegotiationOutcome({ id: '3', description: 'No improvement', baselinePrice: 100, negotiatedPrice: 100, volumeOrSpend: 1000, wasBaselineAlreadyPaid: true, recurring: false });
      expect(result.valueType).toBe('NO_VALUE_CAPTURED');
      expect(result.absoluteValue).toBe(0);
    });

    it('annualizes a recurring value only when periodsPerYear is supplied -- never guessed', () => {
      const withPeriods = assessNegotiationOutcome({ id: '4', description: 'Monthly recurring cut', baselinePrice: 10, negotiatedPrice: 9, volumeOrSpend: 100, wasBaselineAlreadyPaid: true, recurring: true, periodsPerYear: 12 });
      expect(withPeriods.annualizedValue).toBe(1200); // 100 absoluteValue * 12
      const withoutPeriods = assessNegotiationOutcome({ id: '5', description: 'Recurring but unspecified', baselinePrice: 10, negotiatedPrice: 9, volumeOrSpend: 100, wasBaselineAlreadyPaid: true, recurring: true });
      expect(withoutPeriods.annualizedValue).toBeNull();
      expect(withoutPeriods.narrativeEn).toContain('not computed rather than guessed');
    });
  });

  describe('assessNegotiationOutcome -- forecast-vs-actual "leakage" governance (10/10 challenge: sourced JAGGAER Value Tracker parity, see SI-06 doc re-rating)', () => {
    it('marks varianceStatus NOT_ASSESSED and leaves all variance fields null when no forecastValue is supplied (never guessed)', () => {
      const result = assessNegotiationOutcome({ id: 'v1', description: 'No forecast on file', baselinePrice: 100, negotiatedPrice: 90, volumeOrSpend: 1000, wasBaselineAlreadyPaid: true, recurring: false });
      expect(result.varianceStatus).toBe('NOT_ASSESSED');
      expect(result.forecastValue).toBeNull();
      expect(result.forecastVariance).toBeNull();
      expect(result.forecastVariancePct).toBeNull();
      expect(result.varianceToleranceAppliedPct).toBeNull();
      expect(result.varianceToleranceSource).toBeNull();
    });

    it('flags ON_TRACK when realized value falls within the generic +/-5% default tolerance of the forecast', () => {
      const result = assessNegotiationOutcome({ id: 'v2', description: 'On track', baselinePrice: 100, negotiatedPrice: 90, volumeOrSpend: 1000, wasBaselineAlreadyPaid: true, recurring: false, forecastValue: 9800 });
      expect(result.absoluteValue).toBe(10000);
      expect(result.forecastVariancePct).toBeCloseTo(2.04, 1);
      expect(result.varianceStatus).toBe('ON_TRACK');
      expect(result.varianceToleranceAppliedPct).toBe(5);
      expect(result.varianceToleranceSource).toBe('generic-default');
      expect(result.narrativeEn).toContain('Tracking to the forecast value');
    });

    it('flags SHORTFALL when realized value falls short of the forecast beyond tolerance -- the real leakage case', () => {
      const result = assessNegotiationOutcome({ id: 'v3', description: 'Underdelivered vs business case', baselinePrice: 100, negotiatedPrice: 95, volumeOrSpend: 1000, wasBaselineAlreadyPaid: true, recurring: false, forecastValue: 20000 });
      expect(result.absoluteValue).toBe(5000);
      expect(result.varianceStatus).toBe('SHORTFALL');
      expect(result.forecastVariancePct).toBe(-75);
      expect(result.narrativeEn).toContain('Falls short of the forecast value');
      expect(result.narrativeEn).toContain('flagged for leakage review');
    });

    it('flags SHORTFALL correctly even on a NO_VALUE_CAPTURED result -- the exact case leakage-tracking exists to catch', () => {
      const result = assessNegotiationOutcome({ id: 'v4', description: 'Failed renegotiation against a real forecast', baselinePrice: 100, negotiatedPrice: 100, volumeOrSpend: 1000, wasBaselineAlreadyPaid: true, recurring: false, forecastValue: 15000 });
      expect(result.valueType).toBe('NO_VALUE_CAPTURED');
      expect(result.absoluteValue).toBe(0);
      expect(result.varianceStatus).toBe('SHORTFALL');
      expect(result.forecastVariancePct).toBe(-100);
    });

    it('flags EXCEEDED when realized value beats the forecast beyond tolerance', () => {
      const result = assessNegotiationOutcome({ id: 'v5', description: 'Beat the business case', baselinePrice: 100, negotiatedPrice: 80, volumeOrSpend: 1000, wasBaselineAlreadyPaid: true, recurring: false, forecastValue: 10000 });
      expect(result.absoluteValue).toBe(20000);
      expect(result.varianceStatus).toBe('EXCEEDED');
      expect(result.narrativeEn).toContain('Exceeds the forecast value');
      expect(result.narrativeEn).toContain("confirming the original forecast wasn't understated");
    });

    it('a caller-supplied varianceToleranceOverridePct always wins over the generic default and is disclosed as caller-override', () => {
      const result = assessNegotiationOutcome({ id: 'v6', description: 'Tight tolerance', baselinePrice: 100, negotiatedPrice: 90, volumeOrSpend: 1000, wasBaselineAlreadyPaid: true, recurring: false, forecastValue: 9800, varianceToleranceOverridePct: 1 });
      // Same 2.04% positive variance as the ON_TRACK case above, but a tightened 1% override band now flags it as EXCEEDED rather than ON_TRACK.
      expect(result.varianceStatus).toBe('EXCEEDED');
      expect(result.varianceToleranceAppliedPct).toBe(1);
      expect(result.varianceToleranceSource).toBe('caller-override');
    });

    it('handles a zero forecastValue as an honest edge case -- unplanned upside, not a shortfall, and no division-by-zero percent', () => {
      const result = assessNegotiationOutcome({ id: 'v7', description: 'Unplanned win, no forecast set', baselinePrice: 100, negotiatedPrice: 90, volumeOrSpend: 1000, wasBaselineAlreadyPaid: true, recurring: false, forecastValue: 0 });
      expect(result.forecastVariancePct).toBeNull();
      expect(result.varianceStatus).toBe('EXCEEDED');
      expect(result.narrativeEn).toContain('unplanned upside, not a shortfall');
    });
  });

  describe('buildNegotiationValueLedger', () => {
    it('aggregates hard savings and cost avoidance separately, never combining them into one undifferentiated figure', () => {
      const outcomes = [
        assessNegotiationOutcome({ id: '1', description: 'Hard saving A', baselinePrice: 100, negotiatedPrice: 90, volumeOrSpend: 100, wasBaselineAlreadyPaid: true, recurring: false }),
        assessNegotiationOutcome({ id: '2', description: 'Avoidance A', baselinePrice: 112, negotiatedPrice: 103, volumeOrSpend: 100, wasBaselineAlreadyPaid: false, recurring: false }),
        assessNegotiationOutcome({ id: '3', description: 'No value', baselinePrice: 100, negotiatedPrice: 100, volumeOrSpend: 100, wasBaselineAlreadyPaid: true, recurring: false }),
      ];
      const ledger = buildNegotiationValueLedger(outcomes);
      expect(ledger.recordCount).toBe(3);
      expect(ledger.hardSavingsCount).toBe(1);
      expect(ledger.costAvoidanceCount).toBe(1);
      expect(ledger.noValueCapturedCount).toBe(1);
      expect(ledger.totalHardSavings).toBe(1000);
      expect(ledger.totalCostAvoidance).toBe(900);
      expect(ledger.totalCombinedValue).toBe(1900);
      expect(ledger.narrativeEn).toContain('kept separate per CIPS');
    });

    it('handles an empty ledger without throwing', () => {
      const ledger = buildNegotiationValueLedger([]);
      expect(ledger.recordCount).toBe(0);
      expect(ledger.narrativeEn).toContain('No negotiation outcomes recorded');
    });

    it('rolls up forecast-vs-actual leakage status across a portfolio, excluding NOT_ASSESSED records from the counts', () => {
      const outcomes = [
        assessNegotiationOutcome({ id: 'p1', description: 'On track', baselinePrice: 100, negotiatedPrice: 90, volumeOrSpend: 1000, wasBaselineAlreadyPaid: true, recurring: false, forecastValue: 9800 }),
        assessNegotiationOutcome({ id: 'p2', description: 'Shortfall', baselinePrice: 100, negotiatedPrice: 95, volumeOrSpend: 1000, wasBaselineAlreadyPaid: true, recurring: false, forecastValue: 20000 }),
        assessNegotiationOutcome({ id: 'p3', description: 'Exceeded', baselinePrice: 100, negotiatedPrice: 80, volumeOrSpend: 1000, wasBaselineAlreadyPaid: true, recurring: false, forecastValue: 10000 }),
        assessNegotiationOutcome({ id: 'p4', description: 'No forecast on file', baselinePrice: 100, negotiatedPrice: 92, volumeOrSpend: 1000, wasBaselineAlreadyPaid: true, recurring: false }),
      ];
      const ledger = buildNegotiationValueLedger(outcomes);
      expect(ledger.onTrackCount).toBe(1);
      expect(ledger.shortfallCount).toBe(1);
      expect(ledger.exceededCount).toBe(1);
      expect(ledger.notAssessedCount).toBe(1);
      expect(ledger.narrativeEn).toContain('Forecast-vs-actual tracking');
      expect(ledger.narrativeEn).toContain('1 shortfall(s) flagged for leakage review');
      expect(ledger.narrativeEn).toContain('1 record(s) had no forecast supplied and are excluded');
    });

    it('omits the leakage clause entirely when no record in the ledger had a forecast supplied', () => {
      const outcomes = [assessNegotiationOutcome({ id: 'p5', description: 'No forecast', baselinePrice: 100, negotiatedPrice: 90, volumeOrSpend: 100, wasBaselineAlreadyPaid: true, recurring: false })];
      const ledger = buildNegotiationValueLedger(outcomes);
      expect(ledger.onTrackCount).toBe(0);
      expect(ledger.shortfallCount).toBe(0);
      expect(ledger.exceededCount).toBe(0);
      expect(ledger.notAssessedCount).toBe(1);
      expect(ledger.narrativeEn).not.toContain('Forecast-vs-actual tracking');
    });
  });

  describe('assessPaymentTermsValue (working-capital / DPO financing value -- distinct from savings/avoidance)', () => {
    it('monetizes an extension of payment terms as a positive financing value', () => {
      const result = assessPaymentTermsValue({ baselineDays: 30, negotiatedDays: 60, annualSpend: 1_000_000, costOfCapitalPctAnnual: 8 });
      expect(result.daysDelta).toBe(30);
      expect(result.annualFinancingValue).toBeCloseTo((30 / 365) * 1_000_000 * 0.08, 2);
      expect(result.narrativeEn).toContain('working-capital');
    });

    it('treats a tightening of terms as a cost, not a saving', () => {
      const result = assessPaymentTermsValue({ baselineDays: 60, negotiatedDays: 30, annualSpend: 1_000_000, costOfCapitalPctAnnual: 8 });
      expect(result.daysDelta).toBeLessThan(0);
      expect(result.annualFinancingValue).toBeLessThan(0);
      expect(result.narrativeEn).toContain('COST');
    });
  });
});

describe('Rebate-Tier Positioning & Volume Consolidation (expertise-viewpoint enhancement: Section 9)', () => {
  const tiers: RebateTier[] = [
    { thresholdVolume: 0, rebatePct: 2, label: 'Base' },
    { thresholdVolume: 1000, rebatePct: 5, label: 'Silver' },
    { thresholdVolume: 5000, rebatePct: 8, label: 'Gold' },
  ];

  describe('assessRebateTierPosition', () => {
    it('returns a no-structure result when no tiers are supplied', () => {
      const result = assessRebateTierPosition([], 500);
      expect(result.currentTier).toBeNull();
      expect(result.ladder).toEqual([]);
    });

    it('builds the full ladder tagging every rung achieved/current/next/future', () => {
      const result = assessRebateTierPosition(tiers, 1500);
      expect(result.ladder.map((l) => l.status)).toEqual(['achieved', 'current', 'next']);
      expect(result.currentTier!.label).toBe('Silver');
      expect(result.nextTier!.label).toBe('Gold');
      expect(result.volumeToNextTier).toBe(3500);
      expect(result.progressToNextTierPct).toBeCloseTo(30, 5);
    });

    it('computes rebate value at the current tier from ACTUAL volume, distinct from the ladder\'s threshold-based reference points', () => {
      const result = assessRebateTierPosition(tiers, 1500, { unitValue: 10 });
      expect(result.rebateValueAtCurrentTier).toBe(1500 * 10 * 0.05); // actual volume, current tier rate
      expect(result.ladder.find((l) => l.status === 'current')!.rebateValueAtThreshold).toBe(1000 * 10 * 0.05); // threshold-based reference
    });

    it('projects periods-to-next-tier only when a run-rate is supplied -- disclosed as a projection', () => {
      const result = assessRebateTierPosition(tiers, 1500, { runRatePerPeriod: 500 });
      expect(result.estimatedPeriodsToNextTier).toBe(7); // ceil(3500 / 500)
      expect(result.narrativeEn).toContain('projected to take approximately 7');
      const noRunRate = assessRebateTierPosition(tiers, 1500);
      expect(noRunRate.estimatedPeriodsToNextTier).toBeNull();
    });

    it('reports no further upside at the top tier', () => {
      const result = assessRebateTierPosition(tiers, 6000);
      expect(result.nextTier).toBeNull();
      expect(result.narrativeEn).toContain('top rebate tier');
    });
  });

  describe('assessVolumeConsolidationOpportunity (Kraljic Leverage-quadrant "aggregate volume" tactic)', () => {
    it('identifies fragmented entities sitting below the tier the consolidated volume would reach', () => {
      const result = assessVolumeConsolidationOpportunity(tiers, [
        { entityLabel: 'Riyadh BU', currentVolume: 800 },
        { entityLabel: 'Jeddah BU', currentVolume: 900 },
        { entityLabel: 'Dammam BU', currentVolume: 3500 },
      ]);
      expect(result.consolidatedVolume).toBe(5200);
      expect(result.tierConsolidated!.label).toBe('Gold');
      expect(result.entities.find((e) => e.entityLabel === 'Riyadh BU')!.tierAlone!.label).toBe('Base');
      expect(result.narrativeEn).toContain('structural/organizational finding');
    });

    it('quantifies the value uplift from consolidation when a unit value is supplied', () => {
      const result = assessVolumeConsolidationOpportunity(
        tiers,
        [
          { entityLabel: 'A', currentVolume: 800 },
          { entityLabel: 'B', currentVolume: 900 },
          { entityLabel: 'C', currentVolume: 3500 },
        ],
        { unitValue: 10 },
      );
      expect(result.valueUpliftFromConsolidation).not.toBeNull();
      expect(result.valueUpliftFromConsolidation!).toBeGreaterThan(0);
    });

    it('reports no upside when all entities already sit at the consolidated tier', () => {
      const result = assessVolumeConsolidationOpportunity(tiers, [
        { entityLabel: 'A', currentVolume: 6000 },
        { entityLabel: 'B', currentVolume: 7000 },
      ]);
      expect(result.narrativeEn).toContain('no structural consolidation upside');
    });

    it('returns an INSUFFICIENT_DATA-style result when tiers or entities are missing', () => {
      expect(assessVolumeConsolidationOpportunity([], [{ entityLabel: 'A', currentVolume: 100 }]).tierConsolidated).toBeNull();
      expect(assessVolumeConsolidationOpportunity(tiers, []).entities).toEqual([]);
    });
  });
});

describe('buildNegotiationBrief integration: expertise-viewpoint enhancement fields are optional and roll up automatically', () => {
  it('defaults all four new fields safely when the caller omits them (backward compatible with every existing test above)', () => {
    const brief = buildNegotiationBrief({
      supplierId: 'legacy-caller',
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
      // shouldCostGap, negotiationValueHistory, rebateTierPosition, volumeConsolidationOpportunity all omitted
    });
    expect(brief.shouldCostGap).toBeNull();
    expect(brief.negotiationValueHistory).toEqual([]);
    expect(brief.negotiationValueLedger.recordCount).toBe(0);
    expect(brief.rebateTierPosition).toBeNull();
    expect(brief.volumeConsolidationOpportunity).toBeNull();
  });

  it('rolls up a supplied negotiationValueHistory into negotiationValueLedger automatically', () => {
    const outcome = assessNegotiationOutcome({ id: '1', description: 'Price cut', baselinePrice: 100, negotiatedPrice: 90, volumeOrSpend: 100, wasBaselineAlreadyPaid: true, recurring: false });
    const brief = buildNegotiationBrief({
      supplierId: 'ledger-test',
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
      negotiationValueHistory: [outcome],
    });
    expect(brief.negotiationValueLedger.recordCount).toBe(1);
    expect(brief.negotiationValueLedger.totalHardSavings).toBe(1000);
    const en = buildNegotiationBriefPrompt(brief, false);
    expect(en).toContain('1 negotiation outcome(s) recorded');
  });

  it('renders should-cost gap and rebate-tier narratives in the bilingual brief prompt when supplied', () => {
    const model: ShouldCostModel = { components: [{ category: 'raw_materials', description: 'x', amount: 100, basis: 'estimated' }], currency: 'SAR', basis: 'estimated', archetype: 'manufactured_goods' };
    const shouldCostGap = assessShouldCostGap(model, 140);
    const rebateTierPosition = assessRebateTierPosition([{ thresholdVolume: 0, rebatePct: 2 }, { thresholdVolume: 1000, rebatePct: 5 }], 500);
    const brief = buildNegotiationBrief({
      supplierId: 'narrative-test',
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
      shouldCostGap,
      rebateTierPosition,
    });
    const en = buildNegotiationBriefPrompt(brief, false);
    expect(en).toContain('material'); // should-cost gap severity language
    expect(en).toContain('rung'); // rebate tier ladder language
    const ar = buildNegotiationBriefPrompt(brief, true);
    expect(ar).toMatch(/[؀-ۿ]/);
  });
});
