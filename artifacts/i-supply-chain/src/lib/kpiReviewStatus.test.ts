import { describe, it, expect } from 'vitest';
import { getIndustryBenchmarkReviewStatus, getTargetReviewStatus } from './kpiReviewStatus';

// #382 (2026-08-23) -- sanity-checks the review-status lookup against real rows
// pulled from ISC Benchmark Final v54.xlsx's Assessment column, plus the resolution
// priority it mirrors from getContextualTarget() (combined > industry-only > sku-only).

describe('getIndustryBenchmarkReviewStatus', () => {
  it('flags a known Uncertain/Government row as context-specific', () => {
    const r = getIndustryBenchmarkReviewStatus('por', 'government');
    expect(r).not.toBeNull();
    expect(r?.status).toBe('context-specific');
    expect(r?.label).toBe('Context-specific');
  });

  it('returns null for a Verified row (retail-fmcg is not in the exceptions list)', () => {
    expect(getIndustryBenchmarkReviewStatus('por', 'retail-fmcg')).toBeNull();
  });

  it('returns null when industryKey is null (nothing selected yet)', () => {
    expect(getIndustryBenchmarkReviewStatus('por', null)).toBeNull();
  });
});

describe('getTargetReviewStatus', () => {
  it('flags a known Analytically Derived combined-target row as estimated', () => {
    const r = getTargetReviewStatus('turns', 'retail-fmcg', 'work-in-progress');
    expect(r).not.toBeNull();
    expect(r?.status).toBe('estimated');
  });

  it('prefers the combined-layer status over industry/sku layers when all three could apply', () => {
    // turns|retail-fmcg|work-in-progress is in the combined exceptions;
    // confirms the combined check short-circuits before falling through.
    const r = getTargetReviewStatus('turns', 'retail-fmcg', 'work-in-progress');
    expect(r?.status).toBe('estimated');
  });

  it('falls back to the industry-only layer when no combined entry exists', () => {
    const r = getTargetReviewStatus('por', 'government', 'finished-goods');
    expect(r).not.toBeNull();
    expect(r?.status).toBe('context-specific');
  });

  it('falls back to the sku-only layer when neither combined nor industry-only match', () => {
    const r = getTargetReviewStatus('turns', null, 'work-in-progress');
    expect(r).not.toBeNull();
    expect(r?.status).toBe('estimated');
  });

  it('returns null for a fully Verified combination', () => {
    expect(getTargetReviewStatus('por', 'retail-fmcg', 'finished-goods')).toBeNull();
  });
});
