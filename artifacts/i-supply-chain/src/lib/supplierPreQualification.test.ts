/**
 * Tests for supplierPreQualification.ts — includes the mandatory
 * soft/hardest/boundary three-tier stress test (isc-standing-rules, Rule 7),
 * plus a cross-engine chained-adversarial replay scenario, in addition to
 * normal unit coverage. Every stress case and its outcome is also written
 * up in the Item 3 worked-example doc (docs/) per Rule 6.
 */
import { describe, it, expect } from 'vitest';
import {
  determineReviewCadence,
  computeAdvisoryASLAssessment,
  validateASLDecision,
  computeNextReviewDueDate,
  computeCurrentASLState,
  computeAllCurrentASLStates,
  decisionKeepsOnASL,
  APPROVAL_REASON_CATEGORIES,
  LIFECYCLE_REASON_CATEGORIES,
  ASL_DECISION_TYPES,
  DEFAULT_REVIEW_CADENCE_DAYS,
  type QualificationGateSnapshot,
  type ASLDecisionEventLike,
} from './supplierPreQualification';

function gate(overrides: Partial<QualificationGateSnapshot> = {}): QualificationGateSnapshot {
  return {
    overallStatus: 'QUALIFIED',
    blockingGate: null,
    dueDiligenceTier: 'STANDARD',
    dueDiligenceGaps: [],
    dueDiligenceGapsAr: [],
    ...overrides,
  };
}

function evt(overrides: Partial<ASLDecisionEventLike> = {}): ASLDecisionEventLike {
  return {
    id: Math.random().toString(36).slice(2),
    supplierId: 'SUP-1',
    decisionType: 'approved',
    reasonCategory: 'audit',
    reasonNote: null,
    approverUserId: 7,
    qualificationGateStatusAtDecision: 'QUALIFIED',
    reviewDueAt: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Section 1 — fixed vocabulary
// ---------------------------------------------------------------------------

describe('fixed vocabulary', () => {
  it('has exactly 6 approval reason categories, matching the 4 sourced references', () => {
    expect(APPROVAL_REASON_CATEGORIES).toHaveLength(6);
    expect(APPROVAL_REASON_CATEGORIES).toEqual([
      'audit', 'qualification_form', 'certification', 'engineering_approval', 'performance_record', 'commercial_agreement',
    ]);
  });

  it('has exactly 6 lifecycle reason categories, disjoint from the approval set', () => {
    expect(LIFECYCLE_REASON_CATEGORIES).toHaveLength(6);
    for (const c of LIFECYCLE_REASON_CATEGORIES) {
      expect(APPROVAL_REASON_CATEGORIES).not.toContain(c);
    }
  });

  it('has exactly 6 decision types', () => {
    expect(ASL_DECISION_TYPES).toHaveLength(6);
  });

  it('decisionKeepsOnASL is true only for approved/conditionally_approved/reinstated', () => {
    expect(decisionKeepsOnASL('approved')).toBe(true);
    expect(decisionKeepsOnASL('conditionally_approved')).toBe(true);
    expect(decisionKeepsOnASL('reinstated')).toBe(true);
    expect(decisionKeepsOnASL('declined')).toBe(false);
    expect(decisionKeepsOnASL('suspended')).toBe(false);
    expect(decisionKeepsOnASL('revoked')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Section 2 — determineReviewCadence (reuses Module 02/05 signals)
// ---------------------------------------------------------------------------

describe('determineReviewCadence', () => {
  it('QUARTERLY for strategic quadrant', () => {
    expect(determineReviewCadence({ kraljicQuadrant: 'strategic' }).tier).toBe('QUARTERLY');
  });
  it('QUARTERLY for bottleneck quadrant', () => {
    expect(determineReviewCadence({ kraljicQuadrant: 'bottleneck' }).tier).toBe('QUARTERLY');
  });
  it('ANNUAL for leverage quadrant alone', () => {
    expect(determineReviewCadence({ kraljicQuadrant: 'leverage' }).tier).toBe('ANNUAL');
  });
  it('ANNUAL for non-critical quadrant alone', () => {
    expect(determineReviewCadence({ kraljicQuadrant: 'non-critical' }).tier).toBe('ANNUAL');
  });
  it('SEMI_ANNUAL for highlyConcentrated when Kraljic criticality does not already trigger QUARTERLY', () => {
    expect(determineReviewCadence({ concentrationBand: 'highlyConcentrated' }).tier).toBe('SEMI_ANNUAL');
  });
  it('SEMI_ANNUAL for moderatelyConcentrated', () => {
    expect(determineReviewCadence({ concentrationBand: 'moderatelyConcentrated' }).tier).toBe('SEMI_ANNUAL');
  });
  it('ANNUAL for competitive band alone', () => {
    expect(determineReviewCadence({ concentrationBand: 'competitive' }).tier).toBe('ANNUAL');
  });
  it('ANNUAL (honest default) when neither signal is supplied', () => {
    const r = determineReviewCadence({});
    expect(r.tier).toBe('ANNUAL');
    expect(r.noteEn).toMatch(/honest default/);
  });
  it('QUARTERLY wins over a concentration signal when both are present (criticality takes precedence)', () => {
    expect(determineReviewCadence({ kraljicQuadrant: 'strategic', concentrationBand: 'competitive' }).tier).toBe('QUARTERLY');
  });
});

// ---------------------------------------------------------------------------
// Section 3 — computeNextReviewDueDate (boundary: exact day-count arithmetic)
// ---------------------------------------------------------------------------

describe('computeNextReviewDueDate', () => {
  const d0 = new Date('2026-09-11T00:00:00Z');
  it('QUARTERLY (90 days) lands on 2026-12-10', () => {
    const due = computeNextReviewDueDate(d0, { tier: 'QUARTERLY', days: DEFAULT_REVIEW_CADENCE_DAYS.QUARTERLY, noteEn: '', noteAr: '' });
    expect(due.toISOString()).toBe('2026-12-10T00:00:00.000Z');
  });
  it('SEMI_ANNUAL (182 days) lands on 2027-03-12', () => {
    const due = computeNextReviewDueDate(d0, { tier: 'SEMI_ANNUAL', days: DEFAULT_REVIEW_CADENCE_DAYS.SEMI_ANNUAL, noteEn: '', noteAr: '' });
    expect(due.toISOString()).toBe('2027-03-12T00:00:00.000Z');
  });
  it('ANNUAL (365 days) lands on 2027-09-11', () => {
    const due = computeNextReviewDueDate(d0, { tier: 'ANNUAL', days: DEFAULT_REVIEW_CADENCE_DAYS.ANNUAL, noteEn: '', noteAr: '' });
    expect(due.toISOString()).toBe('2027-09-11T00:00:00.000Z');
  });
});

// ---------------------------------------------------------------------------
// Section 4 — computeAdvisoryASLAssessment (Advisory tier, Rule 8 primary+alternative)
// ---------------------------------------------------------------------------

describe('computeAdvisoryASLAssessment', () => {
  it('RECOMMEND_APPROVE for QUALIFIED, and always carries a non-empty alternative (Rule 8)', () => {
    const r = computeAdvisoryASLAssessment(gate({ overallStatus: 'QUALIFIED' }), {});
    expect(r.recommendation).toBe('RECOMMEND_APPROVE');
    expect(r.alternativeEn.length).toBeGreaterThan(0);
    expect(r.alternativeAr.length).toBeGreaterThan(0);
  });

  it('RECOMMEND_CONDITIONAL for CONDITIONALLY_QUALIFIED', () => {
    const r = computeAdvisoryASLAssessment(gate({ overallStatus: 'CONDITIONALLY_QUALIFIED', blockingGate: 'financial' }), {});
    expect(r.recommendation).toBe('RECOMMEND_CONDITIONAL');
    expect(r.noteEn).toContain('financial');
  });

  it('RECOMMEND_HOLD for NOT_QUALIFIED, names the blocking gate', () => {
    const r = computeAdvisoryASLAssessment(gate({ overallStatus: 'NOT_QUALIFIED', blockingGate: 'compliance, identity' }), {});
    expect(r.recommendation).toBe('RECOMMEND_HOLD');
    expect(r.primaryEn).toContain('compliance, identity');
  });

  it('RECOMMEND_INSUFFICIENT_DATA for INSUFFICIENT_EVIDENCE', () => {
    const r = computeAdvisoryASLAssessment(gate({ overallStatus: 'INSUFFICIENT_EVIDENCE' }), {});
    expect(r.recommendation).toBe('RECOMMEND_INSUFFICIENT_DATA');
  });

  it('RECOMMEND_INSUFFICIENT_DATA and an explicit "no responsible alternative" note when gate is null (never fabricate)', () => {
    const r = computeAdvisoryASLAssessment(null, {});
    expect(r.recommendation).toBe('RECOMMEND_INSUFFICIENT_DATA');
    expect(r.alternativeEn).toMatch(/N\/A/);
    expect(r.reviewCadence.tier).toBe('ANNUAL');
  });

  it('carries dueDiligenceGaps through unchanged, never drops a disclosed ENHANCED-DD gap', () => {
    const gaps = ['Sanctions/PEP screening -- no data source integrated'];
    const r = computeAdvisoryASLAssessment(gate({ dueDiligenceTier: 'ENHANCED', dueDiligenceGaps: gaps, dueDiligenceGapsAr: gaps }), {});
    expect(r.dueDiligenceGaps).toEqual(gaps);
  });

  it('ENHANCED due-diligence tier changes the QUALIFIED alternative wording to flag the disclosed gaps', () => {
    const r = computeAdvisoryASLAssessment(gate({ overallStatus: 'QUALIFIED', dueDiligenceTier: 'ENHANCED' }), {});
    expect(r.alternativeEn).toMatch(/Enhanced Due Diligence/);
  });
});

// ---------------------------------------------------------------------------
// Section 5 — validateASLDecision: the "derived, not manual" enforcement
// (soft / hardest-adversarial cases)
// ---------------------------------------------------------------------------

describe('validateASLDecision — soft cases', () => {
  it('valid approval with a real gate and a documented reason', () => {
    const v = validateASLDecision({ decisionType: 'approved', gate: gate({ overallStatus: 'QUALIFIED' }), reasonCategory: 'audit', reasonNote: 'Q3 2026 audit' });
    expect(v.valid).toBe(true);
  });

  it('rejects an approval missing a reasonCategory', () => {
    const v = validateASLDecision({ decisionType: 'approved', gate: gate({ overallStatus: 'QUALIFIED' }), reasonCategory: null, reasonNote: null });
    expect(v.valid).toBe(false);
    expect(v.errorsEn[0]).toMatch(/documented approval reason/);
  });
});

describe('validateASLDecision — hardest adversarial cases', () => {
  it('REJECTS approving a NOT_QUALIFIED supplier even with a plausible reason (manual-override attack)', () => {
    const v = validateASLDecision({ decisionType: 'approved', gate: gate({ overallStatus: 'NOT_QUALIFIED', blockingGate: 'compliance' }), reasonCategory: 'commercial_agreement', reasonNote: 'Client insists, urgent PO' });
    expect(v.valid).toBe(false);
    expect(v.errorsEn.join(' ')).toMatch(/derived from the gate result, not a manual flag/);
  });

  it('REJECTS conditionally-approving an INSUFFICIENT_EVIDENCE supplier (upgrade attack)', () => {
    const v = validateASLDecision({ decisionType: 'conditionally_approved', gate: gate({ overallStatus: 'INSUFFICIENT_EVIDENCE' }), reasonCategory: 'qualification_form', reasonNote: null });
    expect(v.valid).toBe(false);
  });

  it('REJECTS declining a QUALIFIED supplier (a decline must be grounded in an actual blocking result)', () => {
    const v = validateASLDecision({ decisionType: 'declined', gate: gate({ overallStatus: 'QUALIFIED' }), reasonCategory: null, reasonNote: null });
    expect(v.valid).toBe(false);
  });

  it('REJECTS a fabricated reinstatement with no prior suspended state', () => {
    const v = validateASLDecision({ decisionType: 'reinstated', gate: gate({ overallStatus: 'QUALIFIED' }), reasonCategory: 'failed_re_review', reasonNote: null, priorStateWasSuspended: false });
    expect(v.valid).toBe(false);
    expect(v.errorsEn.join(' ')).toMatch(/no suspended prior state/);
  });

  it('REJECTS suspending with an approval-only reason category (cross-vocabulary attack)', () => {
    const v = validateASLDecision({ decisionType: 'suspended', gate: null, reasonCategory: 'audit' as any, reasonNote: 'trying to reuse an approval reason' });
    expect(v.valid).toBe(false);
    expect(v.errorsEn.join(' ')).toMatch(/documented lifecycle reason/);
  });

  it('ACCEPTS a valid reinstatement: prior suspended, fresh QUALIFIED gate, valid lifecycle reason', () => {
    const v = validateASLDecision({ decisionType: 'reinstated', gate: gate({ overallStatus: 'QUALIFIED' }), reasonCategory: 'failed_re_review', reasonNote: 'Corrective action verified', priorStateWasSuspended: true });
    expect(v.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Section 6 — computeCurrentASLState / computeAllCurrentASLStates (boundary
// + cross-engine chained adversarial replay)
// ---------------------------------------------------------------------------

describe('computeCurrentASLState — boundary', () => {
  it('NEVER_ASSESSED with no events', () => {
    const s = computeCurrentASLState('SUP-NEW', [], new Date());
    expect(s.status).toBe('NEVER_ASSESSED');
    expect(s.onASL).toBe(false);
  });

  it('isReviewOverdue is false exactly AT the due instant (strict <, not <=)', () => {
    const due = '2026-12-10T00:00:00.000Z';
    const events = [evt({ decisionType: 'approved', reviewDueAt: due })];
    expect(computeCurrentASLState('SUP-1', events, new Date(due)).isReviewOverdue).toBe(false);
  });

  it('isReviewOverdue is true one millisecond after the due instant', () => {
    const due = '2026-12-10T00:00:00.000Z';
    const events = [evt({ decisionType: 'approved', reviewDueAt: due })];
    expect(computeCurrentASLState('SUP-1', events, new Date('2026-12-10T00:00:00.001Z')).isReviewOverdue).toBe(true);
  });

  it('a null reviewDueAt is never treated as overdue', () => {
    const events = [evt({ decisionType: 'declined', reviewDueAt: null })];
    expect(computeCurrentASLState('SUP-1', events, new Date('2099-01-01')).isReviewOverdue).toBe(false);
  });
});

describe('computeCurrentASLState — cross-engine chained adversarial replay', () => {
  it('approve -> suspend -> reinstate resolves to the REINSTATED event, not stale approval data, even out of insertion order', () => {
    const chain: ASLDecisionEventLike[] = [
      evt({ id: 3, decisionType: 'reinstated', reasonCategory: 'failed_re_review', reviewDueAt: '2027-01-15T00:00:00.000Z', createdAt: '2026-11-15T00:00:00.000Z' }),
      evt({ id: 1, decisionType: 'approved', reasonCategory: 'audit', reviewDueAt: '2026-12-10T00:00:00.000Z', createdAt: '2026-09-01T00:00:00.000Z' }),
      evt({ id: 2, decisionType: 'suspended', reasonCategory: 'compliance_violation', reviewDueAt: null, createdAt: '2026-10-01T00:00:00.000Z' }),
    ];
    const s = computeCurrentASLState('SUP-1', chain, new Date('2026-11-20T00:00:00.000Z'));
    expect(s.status).toBe('reinstated');
    expect(s.onASL).toBe(true);
    expect(s.reviewDueAt).toBe('2027-01-15T00:00:00.000Z');
  });

  it('computeAllCurrentASLStates isolates suppliers correctly and never cross-contaminates state', () => {
    const events: ASLDecisionEventLike[] = [
      evt({ id: 1, supplierId: 'SUP-A', decisionType: 'approved' }),
      evt({ id: 2, supplierId: 'SUP-B', decisionType: 'declined', qualificationGateStatusAtDecision: 'NOT_QUALIFIED' }),
    ];
    const states = computeAllCurrentASLStates(events);
    expect(states).toHaveLength(2);
    expect(states.find((s) => s.supplierId === 'SUP-A')!.onASL).toBe(true);
    expect(states.find((s) => s.supplierId === 'SUP-B')!.onASL).toBe(false);
  });
});
