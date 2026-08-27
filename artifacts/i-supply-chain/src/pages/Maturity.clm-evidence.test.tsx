/**
 * Module 06 gap #2 (27 Aug 2026) -- CLM_SUB_SEGMENTS <-> CLMTools.tsx
 * cross-link. Pure-function unit tests for computeClmObligationEvidence(),
 * the helper behind the evidence callout shown next to the clm-obligations
 * / clm-renewal deep-mode questions. Real math, no rendering -- deliberately
 * decoupled from the heavy component-level test setup used elsewhere in
 * this directory (framer-motion/AuthContext mocks), since this function
 * has no React or fetch dependency.
 */

import { describe, it, expect } from 'vitest';
import { computeClmObligationEvidence } from '@/pages/Maturity';

type Contract = Parameters<typeof computeClmObligationEvidence>[0][number];

function makeContract(overrides: Partial<Contract>): Contract {
  return {
    endDate: '2027-01-01',
    noticePeriodDays: 30,
    autoRenewal: false,
    renewalDecision: 'undecided',
    status: 'active',
    ...overrides,
  };
}

const TODAY = new Date('2026-08-27T00:00:00.000Z');

describe('computeClmObligationEvidence', () => {
  it('returns all zeros for an empty contract list', () => {
    const stats = computeClmObligationEvidence([], TODAY);
    expect(stats).toEqual({ totalLive: 0, undecidedRenewalCount: 0, autoRenewalUnreviewedCount: 0, overdueNoticeCount: 0 });
  });

  it('excludes expired and draft contracts from totalLive', () => {
    const contracts = [
      makeContract({ status: 'expired' }),
      makeContract({ status: 'draft' }),
      makeContract({ status: 'active' }),
    ];
    const stats = computeClmObligationEvidence(contracts, TODAY);
    expect(stats.totalLive).toBe(1);
  });

  it('counts undecided renewals only among live contracts', () => {
    const contracts = [
      makeContract({ renewalDecision: 'undecided' }),
      makeContract({ renewalDecision: 'renew' }),
      makeContract({ renewalDecision: 'undecided', status: 'expired' }), // not live -- excluded
    ];
    const stats = computeClmObligationEvidence(contracts, TODAY);
    expect(stats.totalLive).toBe(2);
    expect(stats.undecidedRenewalCount).toBe(1);
  });

  it('flags auto-renewing contracts with no reviewed decision', () => {
    const contracts = [
      makeContract({ autoRenewal: true,  renewalDecision: 'undecided' }),
      makeContract({ autoRenewal: true,  renewalDecision: 'renew' }),       // reviewed -- not flagged
      makeContract({ autoRenewal: false, renewalDecision: 'undecided' }),   // not auto-renewal -- not counted here
    ];
    const stats = computeClmObligationEvidence(contracts, TODAY);
    expect(stats.autoRenewalUnreviewedCount).toBe(1);
    expect(stats.undecidedRenewalCount).toBe(2);
  });

  it('flags contracts whose notice-period deadline has already passed with no decision', () => {
    const contracts = [
      // endDate 10 days from "today", noticePeriodDays 30 -> already inside/past the notice window
      makeContract({ endDate: '2026-09-06', noticePeriodDays: 30, renewalDecision: 'undecided' }),
      // endDate far out, well outside the notice window -- not overdue yet
      makeContract({ endDate: '2027-06-01', noticePeriodDays: 30, renewalDecision: 'undecided' }),
      // overdue by date, but already decided -- must not be flagged
      makeContract({ endDate: '2026-09-06', noticePeriodDays: 30, renewalDecision: 'renew' }),
    ];
    const stats = computeClmObligationEvidence(contracts, TODAY);
    expect(stats.overdueNoticeCount).toBe(1);
  });

  it('ignores contracts with an unparseable endDate rather than throwing', () => {
    const contracts = [makeContract({ endDate: 'not-a-date', renewalDecision: 'undecided' })];
    expect(() => computeClmObligationEvidence(contracts, TODAY)).not.toThrow();
    const stats = computeClmObligationEvidence(contracts, TODAY);
    expect(stats.overdueNoticeCount).toBe(0);
  });
});
