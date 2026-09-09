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
    expect(computePriceTrajectory(points, { flatBandPct: 10 }).direction).toBe('flat');
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
    });
    expect(brief.unsupportedCostDriverCount).toBe(0);
    expect(brief.recommendedTactics).toBeNull();
    const en = buildNegotiationBriefPrompt(brief, false);
    expect(en).toContain('INSUFFICIENT_DATA');
  });

  it('"make it great" fix: a supplied kraljicQuadrant is no longer a dead input -- it cross-references Module 02\'s real tactics library', () => {
    const brief = buildNegotiationBrief({
      supplierId: 'bottleneck-supplier',
      kraljicQuadrant: 'bottleneck',
      priceTrajectory: { direction: 'flat', periodMonths: 12, percentChange: 1, basis: 'observed', maxIntraPeriodSwingPct: 1, hasIntermediateVolatility: false },
      costDriverJustifications: [],
      tcoReferenceId: null,
      contractEntitlementId: null,
      negotiationLeverage: assessNegotiationLeverage({ lockInIndex: 4.2, isSurvivable: false }),
      negotiationRoundHistory: [],
    });

    expect(brief.kraljicQuadrant).toBe('bottleneck');
    expect(brief.recommendedTactics).not.toBeNull();
    expect(brief.recommendedTactics!.quadrant).toBe('bottleneck');
    // Every returned "for us" tactic must actually be tagged low-risk and suited to this quadrant --
    // proves this reuses Module 02's own filter rather than returning an arbitrary/unfiltered list.
    for (const t of brief.recommendedTactics!.forUs) {
      expect(t.ethicalRisk).toBe('low');
      expect(t.suitableQuadrants).toContain('bottleneck');
    }
    for (const t of brief.recommendedTactics!.watchFor) {
      expect(t.ethicalRisk).not.toBe('low');
      expect(t.suitableQuadrants).toContain('bottleneck');
    }

    const en = buildNegotiationBriefPrompt(brief, false);
    const ar = buildNegotiationBriefPrompt(brief, true);
    if (brief.recommendedTactics!.forUs.length > 0) {
      expect(en).toContain('Recommended tactics (Module 02, bottleneck quadrant)');
      expect(ar).toContain('تكتيكات موصى بها');
      expect(ar).not.toMatch(/\bbottleneck\b/);
    }
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
    });

    const en = buildNegotiationBriefPrompt(brief, false);
    expect(en).toContain('Caveat: price moved 30%');
    const ar = buildNegotiationBriefPrompt(brief, true);
    expect(ar).toContain('تنبيه');
  });
});
