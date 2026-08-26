import { describe, it, expect } from 'vitest';
import { resolveRfxScopeProfile } from './clmRfxScopeEngine';

describe('resolveRfxScopeProfile -- no bucket selected', () => {
  it('returns undefined when industryBucket is empty', () => {
    expect(resolveRfxScopeProfile({ industryBucket: '', rfxType: 'rfp', complexityTier: 1 })).toBeUndefined();
  });
});

describe('resolveRfxScopeProfile -- spec-type decision (CIPS)', () => {
  it('om bucket is always performance', () => {
    const p = resolveRfxScopeProfile({ industryBucket: 'om', rfxType: 'rfp', complexityTier: 2 });
    expect(p?.specType.type).toBe('performance');
  });
  it('professional-services bucket is always performance', () => {
    const p = resolveRfxScopeProfile({ industryBucket: 'professional-services', rfxType: 'rfp', complexityTier: 2 });
    expect(p?.specType.type).toBe('performance');
  });
  it('construction bucket is hybrid', () => {
    const p = resolveRfxScopeProfile({ industryBucket: 'construction', rfxType: 'rfp', complexityTier: 3 });
    expect(p?.specType.type).toBe('hybrid');
  });
  it('logistics bucket is hybrid', () => {
    const p = resolveRfxScopeProfile({ industryBucket: 'logistics', rfxType: 'rfp', complexityTier: 2 });
    expect(p?.specType.type).toBe('hybrid');
  });
  it('supply-goods + RFQ is conformance (specs already fixed)', () => {
    const p = resolveRfxScopeProfile({ industryBucket: 'supply-goods', rfxType: 'rfq', complexityTier: 1 });
    expect(p?.specType.type).toBe('conformance');
  });
  it('supply-goods + RFI is performance (specs not yet fixed)', () => {
    const p = resolveRfxScopeProfile({ industryBucket: 'supply-goods', rfxType: 'rfi', complexityTier: 1 });
    expect(p?.specType.type).toBe('performance');
  });
});

describe('resolveRfxScopeProfile -- WBS skeleton is bucket-specific, not generic', () => {
  it('construction skeleton differs from professional-services skeleton', () => {
    const c = resolveRfxScopeProfile({ industryBucket: 'construction', rfxType: 'rfp', complexityTier: 2 });
    const ps = resolveRfxScopeProfile({ industryBucket: 'professional-services', rfxType: 'rfp', complexityTier: 2 });
    const cIds = c!.wbsSkeleton.map(n => n.id);
    const psIds = ps!.wbsSkeleton.map(n => n.id);
    expect(cIds).not.toEqual(psIds);
    expect(cIds).toContain('mep');
    expect(psIds).toContain('approach');
  });
  it('every bucket has at least 4 WBS nodes', () => {
    (['supply-goods', 'construction', 'om', 'professional-services', 'logistics'] as const).forEach((b) => {
      const p = resolveRfxScopeProfile({ industryBucket: b, rfxType: 'rfp', complexityTier: 2 });
      expect(p!.wbsSkeleton.length).toBeGreaterThanOrEqual(4);
    });
  });
});

describe('resolveRfxScopeProfile -- elicitation guidance (BABOK)', () => {
  it('recommends observation for construction', () => {
    const p = resolveRfxScopeProfile({ industryBucket: 'construction', rfxType: 'rfp', complexityTier: 2 });
    expect(p?.elicitation.techniqueEn.toLowerCase()).toContain('site visit');
  });
  it('recommends interviews for a low-complexity RFI', () => {
    const p = resolveRfxScopeProfile({ industryBucket: 'professional-services', rfxType: 'rfi', complexityTier: 1 });
    expect(p?.elicitation.techniqueEn.toLowerCase()).toContain('interview');
  });
  it('recommends a workshop for a high-complexity RFP', () => {
    const p = resolveRfxScopeProfile({ industryBucket: 'professional-services', rfxType: 'rfp', complexityTier: 3 });
    expect(p?.elicitation.techniqueEn.toLowerCase()).toContain('workshop');
  });
});

describe('resolveRfxScopeProfile -- mandatory fields', () => {
  it('RFI layers on vendor-credibility and question-design fields', () => {
    const rfi = resolveRfxScopeProfile({ industryBucket: 'logistics', rfxType: 'rfi', complexityTier: 1 });
    const rfp = resolveRfxScopeProfile({ industryBucket: 'logistics', rfxType: 'rfp', complexityTier: 1 });
    expect(rfi!.mandatoryFields.length).toBeGreaterThan(rfp!.mandatoryFields.length);
    expect(rfi!.mandatoryFields.some(f => f.id === 'vendor-credibility')).toBe(true);
  });
  it('om fields include the Hard/Soft FM split and SLA/KPI distinction', () => {
    const p = resolveRfxScopeProfile({ industryBucket: 'om', rfxType: 'rfp', complexityTier: 2 });
    const ids = p!.mandatoryFields.map(f => f.id);
    expect(ids).toContain('hard-soft-split');
    expect(ids).toContain('sla');
    expect(ids).toContain('kpi');
  });
  it('every bilingual field has non-empty En and Ar text', () => {
    const p = resolveRfxScopeProfile({ industryBucket: 'construction', rfxType: 'rfp', complexityTier: 2 });
    p!.mandatoryFields.forEach((f) => {
      expect(f.labelEn.length).toBeGreaterThan(0);
      expect(f.labelAr.length).toBeGreaterThan(0);
      expect(f.whyEn.length).toBeGreaterThan(0);
      expect(f.whyAr.length).toBeGreaterThan(0);
    });
  });
});
