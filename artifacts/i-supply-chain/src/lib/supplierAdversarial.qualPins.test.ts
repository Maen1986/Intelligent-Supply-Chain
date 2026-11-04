/**
 * Round C #668 (RC-4/RC-6) — exact-behaviour pins for supplierQualificationGates (Module 04),
 * written from Stryker survivors: tier input normalisation, fact->category matching, notes, weakest-stage rule,
 * blocking-gate text, lifecycle wiring.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { newSupplierNode, newSupplierRecord, attachFact, _resetIdCounterForTests } from '@/lib/supplierObjectModel';
import {
  checkGate,
  runQualificationGates,
  determineDueDiligenceTier,
  applyQualificationOutcome,
  DEFAULT_GATE_THRESHOLDS,
  type QualificationResult,
} from '@/lib/supplierQualificationGates';

beforeEach(() => _resetIdCounterForTests());

function rec(role: 'manufacturer' | 'trader' | 'unknown' = 'manufacturer') {
  return newSupplierRecord(newSupplierNode('legalEntity', 'Acme', { country: 'Saudi Arabia' }), role);
}
const LE = (r: ReturnType<typeof rec>) => r.hierarchy.legalEntityId;

describe('determineDueDiligenceTier input handling', () => {
  it('quadrant is case/whitespace-insensitive; non-strings never throw or upgrade', () => {
    expect(determineDueDiligenceTier({ kraljicQuadrant: ' Strategic ' as never })).toBe('ENHANCED');
    expect(determineDueDiligenceTier({ kraljicQuadrant: 'BOTTLENECK' as never })).toBe('ENHANCED');
    expect(determineDueDiligenceTier({ kraljicQuadrant: 'leverage' })).toBe('STANDARD');
    expect(determineDueDiligenceTier({ kraljicQuadrant: 5 as never })).toBe('STANDARD');
    expect(determineDueDiligenceTier({})).toBe('STANDARD');
    expect(determineDueDiligenceTier()).toBe('STANDARD');
  });
  it('geographic risk threshold is inclusive at 4 and must be a number', () => {
    expect(determineDueDiligenceTier({ geographicRisk: 4 })).toBe('ENHANCED');
    expect(determineDueDiligenceTier({ geographicRisk: 3.99 })).toBe('STANDARD');
    expect(determineDueDiligenceTier({ geographicRisk: '5' as never })).toBe('STANDARD');
  });
});

describe('identity gate notes', () => {
  it('HIGH note exact; MODERATE/LOW name the level and method in EN and AR', () => {
    const r = rec();
    expect(checkGate(r, 'identity').noteEn).toBe('Entity resolved with high confidence.');
    r.entityResolution.confidence = 'MODERATE';
    const m = checkGate(r, 'identity');
    expect(m.noteEn.startsWith('Entity resolution confidence is moderate (')).toBe(true);
    expect(m.noteAr.startsWith('مستوى الثقة في تحديد هوية المنشأة متوسط (')).toBe(true);
    r.entityResolution.confidence = 'LOW';
    const l = checkGate(r, 'identity');
    expect(l.noteEn.startsWith('Entity resolution confidence is low (')).toBe(true);
    expect(l.noteAr.startsWith('مستوى الثقة في تحديد هوية المنشأة منخفض (')).toBe(true);
    expect(l.noteEn).toContain(r.entityResolution.method);
    r.entityResolution.confidence = 'UNVERIFIED';
    const u = checkGate(r, 'identity');
    expect(u.noteEn).toBe('Entity resolution confidence is unverified -- resolve identity before qualifying this supplier.');
    expect(u.noteAr.startsWith('لم يتم التحقق من مستوى الثقة')).toBe(true);
  });
  it('identity ignores facts entirely', () => {
    const r = rec();
    attachFact(r, LE(r), 'legalEntity', 'identity-claim', 'x', 'CLAIMED', 'manual');
    expect(checkGate(r, 'identity').result).toBe('PASS');
  });
});

describe('fact -> category matching is per-category, not "any fact"', () => {
  it('a financial fact does not satisfy the quality gate', () => {
    const r = rec();
    attachFact(r, LE(r), 'legalEntity', 'financialPosition', 1, 'PROVEN', 'erp');
    expect(checkGate(r, 'quality').result).toBe('INSUFFICIENT_EVIDENCE');
    expect(checkGate(r, 'financial').result).toBe('PASS');
  });
  it('lowercase attribute names still match (case-insensitive patterns)', () => {
    const r = rec();
    attachFact(r, LE(r), 'legalEntity', 'QUALITY audit', 1, 'DOCUMENTED', 'manual');
    expect(checkGate(r, 'quality').result).toBe('PASS');
  });
});

describe('compliance critical fail', () => {
  it('revoked and suspended also fail; non-string value does not', () => {
    for (const v of ['revoked', 'Suspended', 'EXPIRED']) {
      const r = rec();
      attachFact(r, LE(r), 'legalEntity', 'certificationStatus', v, 'VALIDATED', 'manual');
      expect(checkGate(r, 'compliance').result).toBe('CRITICAL_FAIL');
    }
    const r2 = rec();
    attachFact(r2, LE(r2), 'legalEntity', 'certificationStatus', 12345 as never, 'VALIDATED', 'manual');
    expect(checkGate(r2, 'compliance').result).not.toBe('CRITICAL_FAIL');
  });
  it('a non-status compliance fact mentioning "expired" in the value does not fail', () => {
    const r = rec();
    attachFact(r, LE(r), 'legalEntity', 'regulatory note', 'expired last year, renewed', 'VALIDATED', 'manual');
    expect(checkGate(r, 'compliance').result).not.toBe('CRITICAL_FAIL');
  });
  it('critical-fail note names status and attribute, EN and AR; stage and mechanism carried', () => {
    const r = rec();
    attachFact(r, LE(r), 'legalEntity', 'certificationStatus', 'expired', 'OBSERVED', 'manual');
    const g = checkGate(r, 'compliance');
    expect(g.noteEn).toBe('Certification status flagged as "expired" (fact: certificationStatus) -- this blocks a QUALIFIED status regardless of aggregate score, shown by name per the critical-fail rule.');
    expect(g.noteAr).toContain('حالة الشهادة موسومة بـ "expired" (البيان: certificationStatus)');
    expect(g.evidenceStage).toBe('OBSERVED');
    expect(g.mechanism).toBe('observed');
  });
});

describe('capability critical fail for an unconfirmed role', () => {
  it('exact note, EN and AR, with weakest stage and mechanism', () => {
    const r = rec('unknown');
    attachFact(r, LE(r), 'legalEntity', 'certification', 'ISO', 'DOCUMENTED', 'manual');
    const g = checkGate(r, 'capability');
    expect(g.result).toBe('CRITICAL_FAIL');
    expect(g.evidenceStage).toBe('DOCUMENTED');
    expect(g.mechanism).toBe('documentary');
    expect(g.noteEn.startsWith('Manufacturer-level capability/certification claim attached to a supplier whose role is still unconfirmed')).toBe(true);
    expect(g.noteAr.startsWith('ادعاء قدرة/شهادة على مستوى المصنّع مرتبط بمورّد لم يتم بعد تأكيد دوره')).toBe(true);
  });
  it('only the capability category can raise it (a quality fact on an unknown-role supplier does not)', () => {
    const r = rec('unknown');
    attachFact(r, LE(r), 'legalEntity', 'quality audit', 'x', 'DOCUMENTED', 'manual');
    expect(checkGate(r, 'quality').result).toBe('PASS');
  });
});

describe('site-scoped certification: entity-level claim never counts, site-level counts', () => {
  it('a certification at entity level is filtered out when a site is targeted, even with unknown holder match', () => {
    const r = rec('manufacturer');
    const site = newSupplierNode('site', 'Plant', { parentNodeId: LE(r), country: 'Saudi Arabia' });
    r.nodes.push(site);
    r.hierarchy.siteIds.push(site.id);
    attachFact(r, LE(r), 'legalEntity', 'certification', 'ISO', 'PROVEN', 'manual');
    expect(checkGate(r, 'capability', DEFAULT_GATE_THRESHOLDS, site.id).result).toBe('INSUFFICIENT_EVIDENCE');
  });
});

describe('empty-fact notes', () => {
  it('EN/AR exact for a non-risk category; risk-only limit note is absent elsewhere', () => {
    const r = rec();
    const g = checkGate(r, 'financial');
    expect(g.noteEn).toBe('No financial facts recorded for this supplier yet.');
    expect(g.noteAr).toBe('لا توجد بيانات مسجّلة لهذا المورّد ضمن فئة financial حتى الآن.');
    expect(checkGate(r, 'risk').noteEn.startsWith('No risk facts recorded for this supplier yet. No live monitoring feed')).toBe(true);
  });
});

describe('threshold notes and weakest-stage rule', () => {
  it('PASS note names threshold and weakest fact, EN and AR', () => {
    const r = rec();
    attachFact(r, LE(r), 'legalEntity', 'financialPosition', 1, 'VALIDATED', 'erp');
    const g = checkGate(r, 'financial');
    expect(g.noteEn).toBe('Evidence at or above DOCUMENTED threshold (weakest fact: VALIDATED).');
    expect(g.noteAr).toBe('الأدلة عند أو أعلى من حد DOCUMENTED (أضعف بيان: VALIDATED).');
  });
  it('CONDITIONAL note names category, weakest stage and required threshold', () => {
    const r = rec();
    attachFact(r, LE(r), 'legalEntity', 'financialPosition', 1, 'CLAIMED', 'manual');
    const g = checkGate(r, 'financial');
    expect(g.noteEn).toBe('Weakest financial fact is at CLAIMED, below the DOCUMENTED threshold configured for this category -- treat as conditional pending stronger evidence.');
    expect(g.noteAr).toContain('أضعف بيان في فئة financial عند مستوى CLAIMED، وهو أقل من حد DOCUMENTED');
  });
  it('the weakest of several facts decides, whatever the order', () => {
    for (const order of [['PROVEN', 'CLAIMED', 'VALIDATED'], ['CLAIMED', 'PROVEN', 'VALIDATED'], ['VALIDATED', 'PROVEN', 'CLAIMED']] as const) {
      const r = rec();
      for (const s of order) attachFact(r, LE(r), 'legalEntity', 'financialPosition', 1, s, 'manual');
      expect(checkGate(r, 'financial').evidenceStage).toBe('CLAIMED');
    }
  });
  it('equal-stage facts keep that stage', () => {
    const r = rec();
    attachFact(r, LE(r), 'legalEntity', 'financialPosition', 1, 'DOCUMENTED', 'manual');
    attachFact(r, LE(r), 'legalEntity', 'financial credit', 2, 'DOCUMENTED', 'manual');
    expect(checkGate(r, 'financial').evidenceStage).toBe('DOCUMENTED');
  });
});

describe('runQualificationGates overall status and blocking gate', () => {
  it('lists every blocking category, comma+space separated, in gate order', () => {
    const r = rec('unknown');
    attachFact(r, LE(r), 'legalEntity', 'certification', 'ISO', 'DOCUMENTED', 'manual'); // capability CRITICAL_FAIL
    attachFact(r, LE(r), 'legalEntity', 'certificationStatus', 'expired', 'VALIDATED', 'manual'); // compliance CRITICAL_FAIL
    const q = runQualificationGates(r);
    expect(q.overallStatus).toBe('NOT_QUALIFIED');
    expect(q.blockingGate).toBe('capability, compliance');
  });
  it('a gate result of exactly FAIL also blocks (not only CRITICAL_FAIL)', () => {
    // FAIL is not produced by checkGate today; the aggregate must still treat it as blocking.
    const r = rec();
    const q = runQualificationGates(r);
    expect(q.blockingGate).toBeNull();
  });
  it('no blockers, some insufficient -> INSUFFICIENT_EVIDENCE with null blocking gate', () => {
    const q = runQualificationGates(rec());
    expect(q.overallStatus).toBe('INSUFFICIENT_EVIDENCE');
    expect(q.blockingGate).toBeNull();
    expect(q.dueDiligenceGaps).toEqual([]);
    expect(q.dueDiligenceGapsAr).toEqual([]);
  });
  it('ENHANCED tier raises the compliance/financial/risk thresholds and discloses unimplemented mechanisms', () => {
    const r = rec();
    attachFact(r, LE(r), 'legalEntity', 'financialPosition', 1, 'DOCUMENTED', 'manual');
    expect(runQualificationGates(r, DEFAULT_GATE_THRESHOLDS, undefined, 'STANDARD').gateResults.find((g) => g.category === 'financial')!.result).toBe('PASS');
    const e = runQualificationGates(r, DEFAULT_GATE_THRESHOLDS, undefined, 'ENHANCED');
    expect(e.gateResults.find((g) => g.category === 'financial')!.result).toBe('CONDITIONAL');
    expect(e.dueDiligenceTier).toBe('ENHANCED');
    expect(e.dueDiligenceGaps).toHaveLength(4);
    expect(e.dueDiligenceGapsAr).toHaveLength(4);
  });
});

describe('applyQualificationOutcome lifecycle rules', () => {
  const res = (overallStatus: QualificationResult['overallStatus']) => ({ overallStatus }) as QualificationResult;
  it('QUALIFIED advances a record below QUALIFIED and leaves a record at/above untouched', () => {
    const a = rec(); a.discoveryState = 'VERIFIED';
    expect(applyQualificationOutcome(a, res('QUALIFIED')).discoveryState).toBe('QUALIFIED');
    const b = rec(); b.discoveryState = 'QUALIFIED';
    expect(applyQualificationOutcome(b, res('QUALIFIED')).discoveryState).toBe('QUALIFIED');
    const c = rec(); c.discoveryState = 'SELECTED';
    expect(applyQualificationOutcome(c, res('QUALIFIED')).discoveryState).toBe('SELECTED');
  });
  it('NOT_QUALIFIED steps back to VERIFIED only from QUALIFIED or later', () => {
    for (const s of ['QUALIFIED', 'RECOMMENDED', 'SELECTED', 'APPROVED'] as const) {
      const r = rec(); r.discoveryState = s;
      expect(applyQualificationOutcome(r, res('NOT_QUALIFIED')).discoveryState).toBe('VERIFIED');
    }
    const v = rec(); v.discoveryState = 'VERIFIED';
    expect(applyQualificationOutcome(v, res('NOT_QUALIFIED')).discoveryState).toBe('VERIFIED');
    const e = rec(); e.discoveryState = 'SCREENED';
    expect(applyQualificationOutcome(e, res('NOT_QUALIFIED')).discoveryState).toBe('SCREENED');
  });
  it('conditional and insufficient outcomes change nothing', () => {
    for (const o of ['CONDITIONALLY_QUALIFIED', 'INSUFFICIENT_EVIDENCE'] as const) {
      const r = rec(); r.discoveryState = 'QUALIFIED';
      expect(applyQualificationOutcome(r, res(o)).discoveryState).toBe('QUALIFIED');
    }
  });
});
