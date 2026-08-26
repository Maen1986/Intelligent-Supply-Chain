import { describe, it, expect } from 'vitest';
import { reviewDraftRfx, reviewSupplierResponse } from './clmRfxReviewEngine';
import { resolveRfxScopeProfile } from './clmRfxScopeEngine';

describe('reviewDraftRfx -- no bucket selected', () => {
  it('returns undefined when industryBucket is empty', () => {
    const report = reviewDraftRfx({
      industryBucket: '', rfxType: 'rfp', complexityTier: 1,
      fieldEntries: {}, wbsNodesFilled: {},
    });
    expect(report).toBeUndefined();
  });
});

describe('reviewDraftRfx -- construction, fully complete', () => {
  const profile = resolveRfxScopeProfile({ industryBucket: 'construction', rfxType: 'rfp', complexityTier: 2 })!;

  it('reports zero missing/vague when every field is entered and measurable', () => {
    const fieldEntries: Record<string, { entered: boolean; selfDeclaredMeasurable?: boolean }> = {};
    profile.mandatoryFields.forEach((f) => { fieldEntries[f.id] = { entered: true, selfDeclaredMeasurable: true }; });
    const wbsNodesFilled: Record<string, boolean> = {};
    profile.wbsSkeleton.forEach((n) => { wbsNodesFilled[n.id] = true; });

    const report = reviewDraftRfx({ industryBucket: 'construction', rfxType: 'rfp', complexityTier: 2, fieldEntries, wbsNodesFilled });
    expect(report!.counts.missing).toBe(0);
    expect(report!.counts.presentVague).toBe(0);
    expect(report!.counts.presentMeasurable).toBe(profile.mandatoryFields.length);
    expect(report!.counts.wbsNodesFilled).toBe(profile.wbsSkeleton.length);
  });
});

describe('reviewDraftRfx -- construction, nothing entered', () => {
  it('flags every mandatory field as missing and every WBS node as unfilled', () => {
    const report = reviewDraftRfx({
      industryBucket: 'construction', rfxType: 'rfp', complexityTier: 2,
      fieldEntries: {}, wbsNodesFilled: {},
    });
    expect(report!.counts.missing).toBe(report!.counts.mandatoryFieldsTotal);
    expect(report!.counts.wbsNodesFilled).toBe(0);
    expect(report!.summaryEn).toContain(String(report!.counts.missing));
  });
});

describe('reviewDraftRfx -- vague-but-present is distinguished from missing', () => {
  it('a measurable-required field entered without confirming measurability is present-vague, not missing', () => {
    const report = reviewDraftRfx({
      industryBucket: 'supply-goods', rfxType: 'rfq', complexityTier: 1,
      fieldEntries: { tolerances: { entered: true, selfDeclaredMeasurable: false } },
      wbsNodesFilled: {},
    });
    const finding = report!.fieldFindings.find(f => f.fieldId === 'tolerances');
    expect(finding!.completeness).toBe('present-vague');
  });
});

describe('reviewSupplierResponse -- compliance matrix', () => {
  it('every mandatory field for the category becomes one matrix row', () => {
    const profile = resolveRfxScopeProfile({ industryBucket: 'logistics', rfxType: 'rfp', complexityTier: 2 })!;
    const report = reviewSupplierResponse({ industryBucket: 'logistics', rfxType: 'rfp', complexityTier: 2, responseEntries: {} });
    expect(report!.matrix.length).toBe(profile.mandatoryFields.length);
    expect(report!.counts.notAnswered).toBe(profile.mandatoryFields.length);
  });

  it('distinguishes answered-specific from answered-but-placeholder', () => {
    const report = reviewSupplierResponse({
      industryBucket: 'professional-services', rfxType: 'rfp', complexityTier: 2,
      responseEntries: {
        deliverables: { answered: true, selfDeclaredSpecific: true },
        'key-personnel': { answered: true, selfDeclaredSpecific: false },
      },
    });
    const deliverables = report!.matrix.find(r => r.fieldId === 'deliverables');
    const keyPersonnel = report!.matrix.find(r => r.fieldId === 'key-personnel');
    expect(deliverables!.status).toBe('answered');
    expect(keyPersonnel!.status).toBe('placeholder-or-vague');
  });

  it('a fully-answered-specific response reports zero gaps', () => {
    const profile = resolveRfxScopeProfile({ industryBucket: 'om', rfxType: 'rfp', complexityTier: 2 })!;
    const responseEntries: Record<string, { answered: boolean; selfDeclaredSpecific?: boolean }> = {};
    profile.mandatoryFields.forEach((f) => { responseEntries[f.id] = { answered: true, selfDeclaredSpecific: true }; });
    const report = reviewSupplierResponse({ industryBucket: 'om', rfxType: 'rfp', complexityTier: 2, responseEntries });
    expect(report!.counts.notAnswered).toBe(0);
    expect(report!.counts.placeholderOrVague).toBe(0);
    expect(report!.counts.answered).toBe(profile.mandatoryFields.length);
  });
});
