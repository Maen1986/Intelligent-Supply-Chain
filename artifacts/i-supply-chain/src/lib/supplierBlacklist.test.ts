/**
 * supplierBlacklist.test.ts
 *
 * Standalone stress-test suite for Item 6's core module, run before UI
 * wiring, following the same "step zero, stress-test standalone first"
 * discipline as Items 4 and 5.
 *
 * Covers (per this build's explicit verification bar): a supplier with
 * conflicting inputs (great COPQ history but one severe periodic-evaluation
 * failure), a blacklist reversal/appeal case, a supplier already ASL-
 * inactive for unrelated reasons, the due-process finalization gate
 * (evidence threshold, right to respond, time-bound vs permanent duration),
 * and boundary conditions on event replay (expiry, draft-then-clear,
 * finalize-then-reverse-then-finalize-again).
 */
import { describe, it, expect } from 'vitest';
import {
  isIndependentlySufficientCategory,
  buildSuggestedEvidenceLinks,
  computeAdvisoryBlacklistRecommendation,
  validateBlacklistFinalization,
  computeCurrentBlacklistState,
  computeBlacklistBlockSignal,
  buildAslCrossReferenceReasonNote,
  BLACKLIST_EVIDENCE_CATEGORIES,
  type BlacklistEvidenceItem,
  type BlacklistEventLike,
} from './supplierBlacklist';

describe('isIndependentlySufficientCategory', () => {
  it('treats compliance_violation, contractual_breach, and severe_copq as independently sufficient', () => {
    expect(isIndependentlySufficientCategory('compliance_violation')).toBe(true);
    expect(isIndependentlySufficientCategory('contractual_breach')).toBe(true);
    expect(isIndependentlySufficientCategory('severe_copq')).toBe(true);
  });
  it('does not treat periodic_evaluation_failure, performance_recovery_escalation, or other_documented_evidence as independently sufficient', () => {
    expect(isIndependentlySufficientCategory('periodic_evaluation_failure')).toBe(false);
    expect(isIndependentlySufficientCategory('performance_recovery_escalation')).toBe(false);
    expect(isIndependentlySufficientCategory('other_documented_evidence')).toBe(false);
  });
  it('covers every declared category with no gaps', () => {
    for (const c of BLACKLIST_EVIDENCE_CATEGORIES) {
      expect(typeof isIndependentlySufficientCategory(c)).toBe('boolean');
    }
  });
});

describe('buildSuggestedEvidenceLinks', () => {
  it('returns empty when no Item 1/5/Module 07 signals are supplied', () => {
    expect(buildSuggestedEvidenceLinks({ evidence: [] })).toEqual([]);
  });

  it('suggests periodic_evaluation_failure only when overallRecommendation is escalate_consider', () => {
    const links = buildSuggestedEvidenceLinks({
      evidence: [],
      periodicEvaluation: { overallRecommendation: 'monitor_closely', evaluatedAtIso: '2026-09-01T00:00:00.000Z' },
    });
    expect(links.length).toBe(0);

    const links2 = buildSuggestedEvidenceLinks({
      evidence: [],
      periodicEvaluation: { overallRecommendation: 'escalate_consider', worstCategoryRating: 'at_risk', worstCategoryName: 'compliance_esg', evaluatedAtIso: '2026-09-01T00:00:00.000Z' },
    });
    expect(links2.length).toBe(1);
    expect(links2[0].category).toBe('periodic_evaluation_failure');
    expect(links2[0].independentlySufficient).toBe(false);
  });

  it('suggests severe_copq only when external-failure share is >= 50%, and marks it independently sufficient', () => {
    const lowShare = buildSuggestedEvidenceLinks({
      evidence: [],
      copqSeverity: { periodLabel: 'Q3 2026', totalCostedUSD: 50000, externalFailureShare: 0.2 },
    });
    expect(lowShare.length).toBe(0);

    const highShare = buildSuggestedEvidenceLinks({
      evidence: [],
      copqSeverity: { periodLabel: 'Q3 2026', totalCostedUSD: 500000, externalFailureShare: 0.72 },
    });
    expect(highShare.length).toBe(1);
    expect(highShare[0].category).toBe('severe_copq');
    expect(highShare[0].independentlySufficient).toBe(true);
  });

  it('does not suggest severe_copq when totalCostedUSD is null (INSUFFICIENT_DATA upstream)', () => {
    const links = buildSuggestedEvidenceLinks({
      evidence: [],
      copqSeverity: { periodLabel: 'Q3 2026', totalCostedUSD: null, externalFailureShare: 0.9 },
    });
    expect(links.length).toBe(0);
  });

  it('suggests performance_recovery_escalation when Module 07 shows an active escalation', () => {
    const links = buildSuggestedEvidenceLinks({
      evidence: [],
      activeRecoveryEscalation: { recommendedIntervention: 'Formal CAR + executive review', escalated: true, combinedSignalFlag: false },
    });
    expect(links.length).toBe(1);
    expect(links[0].category).toBe('performance_recovery_escalation');
  });
});

describe('computeAdvisoryBlacklistRecommendation -- CORE CONFLICTING-INPUTS CASE', () => {
  it('great COPQ history (low external-failure share) + one severe periodic-evaluation failure: accumulates but is NOT independently sufficient alone, so recommendation holds at ASL suspension, not formal review', () => {
    const result = computeAdvisoryBlacklistRecommendation({
      evidence: [],
      periodicEvaluation: { overallRecommendation: 'escalate_consider', worstCategoryRating: 'at_risk', worstCategoryName: 'compliance_esg', evaluatedAtIso: '2026-09-01T00:00:00.000Z' },
      copqSeverity: { periodLabel: 'Q3 2026', totalCostedUSD: 8000, externalFailureShare: 0.05 }, // great COPQ history -- low external-failure share, does not qualify as "severe"
    });
    expect(result.suggestedEvidenceLinks.length).toBe(1); // only the periodic-evaluation failure suggested; COPQ history is genuinely good, not suggested at all
    expect(result.evidenceSufficient).toBe(false);
    expect(result.recommendation).toBe('RECOMMEND_HOLD_AT_ASL_SUSPENSION');
  });

  it('same conflicting case, but with a second accumulating item (active Module 07 escalation), crosses the 2-item accumulation threshold into a formal-review recommendation', () => {
    const result = computeAdvisoryBlacklistRecommendation({
      evidence: [],
      periodicEvaluation: { overallRecommendation: 'escalate_consider', worstCategoryRating: 'at_risk', worstCategoryName: 'compliance_esg', evaluatedAtIso: '2026-09-01T00:00:00.000Z' },
      copqSeverity: { periodLabel: 'Q3 2026', totalCostedUSD: 8000, externalFailureShare: 0.05 },
      activeRecoveryEscalation: { recommendedIntervention: 'Formal CAR + executive review', escalated: true, combinedSignalFlag: false },
    });
    expect(result.suggestedEvidenceLinks.length).toBe(2);
    expect(result.evidenceSufficient).toBe(true);
    expect(result.recommendation).toBe('RECOMMEND_FORMAL_REVIEW');
  });
});

describe('computeAdvisoryBlacklistRecommendation -- other cases', () => {
  it('zero evidence at all returns RECOMMEND_INSUFFICIENT_EVIDENCE, never a guessed action (Decision Record 8.7)', () => {
    const result = computeAdvisoryBlacklistRecommendation({ evidence: [] });
    expect(result.recommendation).toBe('RECOMMEND_INSUFFICIENT_EVIDENCE');
    expect(result.evidenceSufficient).toBe(false);
  });

  it('a single independently-sufficient manual evidence item (e.g. a confirmed compliance violation) alone reaches RECOMMEND_FORMAL_REVIEW', () => {
    const evidence: BlacklistEvidenceItem[] = [
      { category: 'compliance_violation', detailEn: 'Confirmed bribery finding in a third-party audit.', independentlySufficient: true },
    ];
    const result = computeAdvisoryBlacklistRecommendation({ evidence });
    expect(result.recommendation).toBe('RECOMMEND_FORMAL_REVIEW');
    expect(result.noteEn).toContain('independently-sufficient');
  });

  it('one accumulating (non-independently-sufficient) item alone is NOT enough -- holds at ASL suspension', () => {
    const evidence: BlacklistEvidenceItem[] = [
      { category: 'other_documented_evidence', detailEn: 'One client complaint, unverified.', independentlySufficient: false },
    ];
    const result = computeAdvisoryBlacklistRecommendation({ evidence });
    expect(result.recommendation).toBe('RECOMMEND_HOLD_AT_ASL_SUSPENSION');
  });

  it('every recommendation names a genuine primary AND a strong alternative (Rule 8), in both languages, never a single false-certainty path', () => {
    const cases = [
      computeAdvisoryBlacklistRecommendation({ evidence: [] }),
      computeAdvisoryBlacklistRecommendation({ evidence: [{ category: 'other_documented_evidence', detailEn: 'x', independentlySufficient: false }] }),
      computeAdvisoryBlacklistRecommendation({ evidence: [{ category: 'compliance_violation', detailEn: 'x', independentlySufficient: true }] }),
    ];
    for (const c of cases) {
      expect(c.primaryEn.length).toBeGreaterThan(0);
      expect(c.primaryAr.length).toBeGreaterThan(0);
      expect(c.alternativeEn.length).toBeGreaterThan(0);
      expect(c.alternativeAr.length).toBeGreaterThan(0);
    }
  });
});

describe('validateBlacklistFinalization -- due-process enforcement (evidence threshold, right to respond, duration typing)', () => {
  const sufficientEvidence: BlacklistEvidenceItem[] = [
    { category: 'compliance_violation', detailEn: 'Confirmed regulatory violation.', independentlySufficient: true },
  ];

  it('rejects finalization when evidence threshold is not met', () => {
    const result = validateBlacklistFinalization({
      evidence: [{ category: 'other_documented_evidence', detailEn: 'One weak item.', independentlySufficient: false }],
      rightToRespondConfirmed: true,
      durationType: 'time_bound',
      effectiveUntilIso: '2027-01-01T00:00:00.000Z',
    });
    expect(result.valid).toBe(false);
    expect(result.errorsEn.some((e) => e.includes('Evidence threshold'))).toBe(true);
  });

  it('rejects finalization when right-to-respond has not been confirmed, even with sufficient evidence -- due process cannot be skipped', () => {
    const result = validateBlacklistFinalization({
      evidence: sufficientEvidence,
      rightToRespondConfirmed: false,
      durationType: 'permanent',
      effectiveUntilIso: null,
    });
    expect(result.valid).toBe(false);
    expect(result.errorsEn.some((e) => e.includes('right-to-respond'))).toBe(true);
  });

  it('rejects finalization with no duration type chosen -- never defaults silently', () => {
    const result = validateBlacklistFinalization({
      evidence: sufficientEvidence,
      rightToRespondConfirmed: true,
      durationType: null,
      effectiveUntilIso: null,
    });
    expect(result.valid).toBe(false);
    expect(result.errorsEn.some((e) => e.includes('duration type'))).toBe(true);
  });

  it('rejects a time_bound duration with no effectiveUntilIso', () => {
    const result = validateBlacklistFinalization({
      evidence: sufficientEvidence,
      rightToRespondConfirmed: true,
      durationType: 'time_bound',
      effectiveUntilIso: null,
    });
    expect(result.valid).toBe(false);
    expect(result.errorsEn.some((e) => e.includes('end/review date'))).toBe(true);
  });

  it('accepts a fully valid time_bound finalization', () => {
    const result = validateBlacklistFinalization({
      evidence: sufficientEvidence,
      rightToRespondConfirmed: true,
      durationType: 'time_bound',
      effectiveUntilIso: '2027-01-01T00:00:00.000Z',
    });
    expect(result.valid).toBe(true);
    expect(result.errorsEn.length).toBe(0);
  });

  it('accepts a fully valid permanent finalization (no effectiveUntilIso required)', () => {
    const result = validateBlacklistFinalization({
      evidence: sufficientEvidence,
      rightToRespondConfirmed: true,
      durationType: 'permanent',
      effectiveUntilIso: null,
    });
    expect(result.valid).toBe(true);
  });

  it('accepts a fully valid indefinite_pending_review finalization (no effectiveUntilIso required)', () => {
    const result = validateBlacklistFinalization({
      evidence: sufficientEvidence,
      rightToRespondConfirmed: true,
      durationType: 'indefinite_pending_review',
      effectiveUntilIso: null,
    });
    expect(result.valid).toBe(true);
  });

  it('BOUNDARY: exactly two accumulating (non-independently-sufficient) items meets the threshold', () => {
    const result = validateBlacklistFinalization({
      evidence: [
        { category: 'periodic_evaluation_failure', detailEn: 'a', independentlySufficient: false },
        { category: 'performance_recovery_escalation', detailEn: 'b', independentlySufficient: false },
      ],
      rightToRespondConfirmed: true,
      durationType: 'time_bound',
      effectiveUntilIso: '2027-01-01T00:00:00.000Z',
    });
    expect(result.valid).toBe(true);
  });

  it('BOUNDARY: exactly one accumulating item does NOT meet the threshold', () => {
    const result = validateBlacklistFinalization({
      evidence: [{ category: 'periodic_evaluation_failure', detailEn: 'a', independentlySufficient: false }],
      rightToRespondConfirmed: true,
      durationType: 'time_bound',
      effectiveUntilIso: '2027-01-01T00:00:00.000Z',
    });
    expect(result.valid).toBe(false);
  });

  it('HARDEST: all four gates fail simultaneously -- reports every violation, not just the first', () => {
    const result = validateBlacklistFinalization({
      evidence: [],
      rightToRespondConfirmed: false,
      durationType: null,
      effectiveUntilIso: null,
    });
    expect(result.valid).toBe(false);
    expect(result.errorsEn.length).toBe(3); // evidence threshold + right-to-respond + duration type (the time_bound-specific check does not fire when durationType itself is null)
  });
});

describe('computeCurrentBlacklistState -- append-only event replay', () => {
  it('never assessed: no events at all', () => {
    const state = computeCurrentBlacklistState('SUP-1', []);
    expect(state.isBlacklisted).toBe(false);
    expect(state.hasOpenDraft).toBe(false);
    expect(state.latestEvent).toBeNull();
  });

  it('a draft_set with no finalize does not blacklist the supplier -- draft is non-binding', () => {
    const events: BlacklistEventLike[] = [
      { id: 1, supplierId: 'SUP-1', action: 'draft_set', durationType: null, effectiveUntilIso: null, createdAt: '2026-09-01T00:00:00.000Z' },
    ];
    const state = computeCurrentBlacklistState('SUP-1', events);
    expect(state.isBlacklisted).toBe(false);
    expect(state.hasOpenDraft).toBe(true);
  });

  it('a draft_set followed by draft_clear clears the open-draft flag', () => {
    const events: BlacklistEventLike[] = [
      { id: 1, supplierId: 'SUP-1', action: 'draft_set', durationType: null, effectiveUntilIso: null, createdAt: '2026-09-01T00:00:00.000Z' },
      { id: 2, supplierId: 'SUP-1', action: 'draft_clear', durationType: null, effectiveUntilIso: null, createdAt: '2026-09-02T00:00:00.000Z' },
    ];
    const state = computeCurrentBlacklistState('SUP-1', events);
    expect(state.hasOpenDraft).toBe(false);
  });

  it('a finalized (permanent) event blacklists the supplier and never expires', () => {
    const events: BlacklistEventLike[] = [
      { id: 1, supplierId: 'SUP-1', action: 'finalized', durationType: 'permanent', effectiveUntilIso: null, createdAt: '2026-09-01T00:00:00.000Z' },
    ];
    const state = computeCurrentBlacklistState('SUP-1', events, new Date('2030-01-01T00:00:00.000Z'));
    expect(state.isBlacklisted).toBe(true);
    expect(state.isExpired).toBe(false);
  });

  it('CORE REVERSAL/APPEAL CASE: a finalized entry followed by a reversed event lifts the blacklist entirely', () => {
    const events: BlacklistEventLike[] = [
      { id: 1, supplierId: 'SUP-1', action: 'finalized', durationType: 'time_bound', effectiveUntilIso: '2027-01-01T00:00:00.000Z', createdAt: '2026-09-01T00:00:00.000Z' },
      { id: 2, supplierId: 'SUP-1', action: 'reversed', durationType: null, effectiveUntilIso: null, createdAt: '2026-09-15T00:00:00.000Z' },
    ];
    const state = computeCurrentBlacklistState('SUP-1', events, new Date('2026-10-01T00:00:00.000Z'));
    expect(state.isBlacklisted).toBe(false);
    expect(state.isExpired).toBe(false);
  });

  it('a reversed entry can be superseded by a LATER re-finalize (appeal rejected on a fresh review) -- the latest event always wins', () => {
    const events: BlacklistEventLike[] = [
      { id: 1, supplierId: 'SUP-1', action: 'finalized', durationType: 'permanent', effectiveUntilIso: null, createdAt: '2026-09-01T00:00:00.000Z' },
      { id: 2, supplierId: 'SUP-1', action: 'reversed', durationType: null, effectiveUntilIso: null, createdAt: '2026-09-15T00:00:00.000Z' },
      { id: 3, supplierId: 'SUP-1', action: 'finalized', durationType: 'time_bound', effectiveUntilIso: '2027-06-01T00:00:00.000Z', createdAt: '2026-10-01T00:00:00.000Z' },
    ];
    const state = computeCurrentBlacklistState('SUP-1', events, new Date('2026-11-01T00:00:00.000Z'));
    expect(state.isBlacklisted).toBe(true);
    expect(state.latestEvent?.id).toBe(3);
  });

  it('BOUNDARY: a time_bound entry expires the instant effectiveUntilIso is in the past, derived at read time, never a stored flag', () => {
    const events: BlacklistEventLike[] = [
      { id: 1, supplierId: 'SUP-1', action: 'finalized', durationType: 'time_bound', effectiveUntilIso: '2027-01-01T00:00:00.000Z', createdAt: '2026-09-01T00:00:00.000Z' },
    ];
    const beforeExpiry = computeCurrentBlacklistState('SUP-1', events, new Date('2026-12-31T23:59:59.000Z'));
    expect(beforeExpiry.isBlacklisted).toBe(true);
    expect(beforeExpiry.isExpired).toBe(false);

    const afterExpiry = computeCurrentBlacklistState('SUP-1', events, new Date('2027-01-01T00:00:01.000Z'));
    expect(afterExpiry.isBlacklisted).toBe(false);
    expect(afterExpiry.isExpired).toBe(true);
  });

  it('an indefinite_pending_review entry never auto-expires (by design -- it requires an explicit future review/reverse, not a timer)', () => {
    const events: BlacklistEventLike[] = [
      { id: 1, supplierId: 'SUP-1', action: 'finalized', durationType: 'indefinite_pending_review', effectiveUntilIso: null, createdAt: '2026-09-01T00:00:00.000Z' },
    ];
    const state = computeCurrentBlacklistState('SUP-1', events, new Date('2035-01-01T00:00:00.000Z'));
    expect(state.isBlacklisted).toBe(true);
    expect(state.isExpired).toBe(false);
  });

  it('events for a different supplierId are correctly excluded from this supplier’s replay', () => {
    const events: BlacklistEventLike[] = [
      { id: 1, supplierId: 'SUP-OTHER', action: 'finalized', durationType: 'permanent', effectiveUntilIso: null, createdAt: '2026-09-01T00:00:00.000Z' },
    ];
    const state = computeCurrentBlacklistState('SUP-1', events);
    expect(state.isBlacklisted).toBe(false);
  });
});

describe('SUPPLIER ALREADY ASL-INACTIVE FOR UNRELATED REASONS -- this module’s honest scope boundary', () => {
  it('computeCurrentBlacklistState is purely about blacklist_events -- it has no opinion on, and never reads, ASL state; a supplier who is off the ASL for an unrelated reason (e.g. Item 3’s own ‘commercial_relationship_ended’ revocation) is NOT blacklisted unless blacklist_events says so', () => {
    // No blacklist_events for this supplier at all -- correctly not blacklisted,
    // regardless of whatever unrelated ASL state Item 3 may separately hold.
    const state = computeCurrentBlacklistState('SUP-ASL-INACTIVE-UNRELATED', []);
    expect(state.isBlacklisted).toBe(false);
  });

  it('the advisory recommendation likewise never infers blacklist-worthiness from ASL status alone -- ASL state is not one of this module’s inputs at all, by design (only Item 1/5/Module 07 evidence and manual evidence are)', () => {
    const result = computeAdvisoryBlacklistRecommendation({ evidence: [] });
    expect(result.recommendation).toBe('RECOMMEND_INSUFFICIENT_EVIDENCE');
  });
});

describe('computeBlacklistBlockSignal (documented forward contract for a future PO/commercial-transaction engine)', () => {
  it('returns blocked=false when the supplier is not blacklisted', () => {
    const state = computeCurrentBlacklistState('SUP-1', []);
    const signal = computeBlacklistBlockSignal(state);
    expect(signal.blocked).toBe(false);
  });

  it('returns blocked=true with a bilingual reason when the supplier is actively blacklisted', () => {
    const events: BlacklistEventLike[] = [
      { id: 1, supplierId: 'SUP-1', action: 'finalized', durationType: 'permanent', effectiveUntilIso: null, createdAt: '2026-09-01T00:00:00.000Z' },
    ];
    const state = computeCurrentBlacklistState('SUP-1', events);
    const signal = computeBlacklistBlockSignal(state);
    expect(signal.blocked).toBe(true);
    expect(signal.reasonEn.length).toBeGreaterThan(0);
    expect(signal.reasonAr.length).toBeGreaterThan(0);
  });

  it('an EXPIRED time-bound entry does not block -- expiry genuinely lifts the block, not just a display label', () => {
    const events: BlacklistEventLike[] = [
      { id: 1, supplierId: 'SUP-1', action: 'finalized', durationType: 'time_bound', effectiveUntilIso: '2027-01-01T00:00:00.000Z', createdAt: '2026-09-01T00:00:00.000Z' },
    ];
    const state = computeCurrentBlacklistState('SUP-1', events, new Date('2027-02-01T00:00:00.000Z'));
    const signal = computeBlacklistBlockSignal(state);
    expect(signal.blocked).toBe(false);
  });
});

describe('buildAslCrossReferenceReasonNote', () => {
  it('produces a bilingual note referencing the specific blacklist event id, never a generic unattributed reason', () => {
    const note = buildAslCrossReferenceReasonNote(42);
    expect(note.en).toContain('#42');
    expect(note.ar.length).toBeGreaterThan(0);
  });
});
