import { describe, it, expect } from 'vitest';
import { playbookFor, DD_DEPTH, nextDdDate, computeSavings, tcoRequired, GUARDRAILS, SAVINGS_RULES } from './kraljicPlaybook';
import { spQuadrant, spCue, allSpCells, lensSegment } from './kraljicPreferencing';
import { gccAdjustment, emptyGccFacts, methodCheck, evaluationPrice, rulesVisible, PRICE_PREFERENCES, NOT_CONFIRMED, supplierTags } from './kraljicGccModifiers';
import { ledgerKpis, movementLog, SOURCE_LEDGER, emptyOutcome, type LedgerEntry } from './kraljicLedger';
import { arabicWithEnglish, matchesKraljicTerm, ARABIC_DISCLOSURE } from './kraljicCipsWording';
import { SUBTYPES } from './supplierKraljicSubtypes';

const ar = (s: string) => /[\u0600-\u06FF]/.test(s);

describe('playbook (items 7, 8, 12, 13)', () => {
  it('every sub-type has five filled headings in both languages', () => {
    for (const k of Object.keys(SUBTYPES) as Array<keyof typeof SUBTYPES>) {
      const p = playbookFor(k, 'bottleneck');
      for (const lines of [p.objective, p.supplierView, p.contract, p.monitorExit]) {
        expect(lines.length).toBeGreaterThan(0);
        for (const l of lines) { expect(l.t.en.length).toBeGreaterThan(5); expect(ar(l.t.ar)).toBe(true); expect(['sourced', 'isc-design']).toContain(l.basis); }
      }
      expect(p.dueDiligence.depth.length).toBeGreaterThan(0);
    }
  });
  it('sub-type adds its own objective on top of the quadrant one', () => {
    expect(playbookFor('bottleneck-locked', 'bottleneck').objective.length).toBe(2);
    expect(playbookFor('unclassified', 'leverage').objective.length).toBe(1);
    expect(playbookFor('unclassified', 'leverage').quadrant).toBe('leverage');
  });
  it('due-diligence depth scales: strategic is deepest, routine lightest', () => {
    expect(DD_DEPTH.strategic.tier).toBe('comprehensive');
    expect(DD_DEPTH['non-critical'].tier).toBe('screening');
    expect(DD_DEPTH['non-critical'].cadenceMonths).toBeNull();
  });
  it('next due-diligence date: boundary and invalid inputs', () => {
    expect(nextDdDate('strategic', '2026-01-31')).toBe('2026-07-31');
    expect(nextDdDate('non-critical', '2026-01-01')).toBeNull();
    expect(nextDdDate('leverage', 'bad')).toBeNull();
    expect(nextDdDate('leverage', '2026-01-01', 3)).toBe('2026-04-01');
    expect(nextDdDate('leverage', '2026-01-01', 0)).toBeNull();
  });
  it('guardrails and savings rules are bilingual and honest about basis', () => {
    expect(GUARDRAILS.length).toBeGreaterThanOrEqual(5);
    for (const g of GUARDRAILS) { expect(ar(g.text.ar)).toBe(true); expect(ar(g.source.ar)).toBe(true); }
    expect(SAVINGS_RULES.filter((r) => r.basis === 'inference').length).toBe(1);
  });
  it('savings: baseline, in-year versus full-year, avoidance kept apart', () => {
    const r = computeSavings({ baselineUnitPrice: 10, newUnitPrice: 9, annualVolume: 1000, monthsInYear: 6, avoidedIncreasePerUnit: 0.5 });
    expect(r.fullYearSaving).toBe(1000); expect(r.inYearSaving).toBe(500); expect(r.costAvoidanceFullYear).toBe(500); expect(r.isIncrease).toBe(false);
    const up = computeSavings({ baselineUnitPrice: 10, newUnitPrice: 11, annualVolume: 100, monthsInYear: 12 });
    expect(up.isIncrease).toBe(true); expect(up.fullYearSaving).toBe(-100);
  });
  it('savings: invalid and boundary values', () => {
    expect(computeSavings({ baselineUnitPrice: -1, newUnitPrice: 1, annualVolume: 1, monthsInYear: 1 }).valid).toBe(false);
    expect(computeSavings({ baselineUnitPrice: 1, newUnitPrice: 1, annualVolume: 1, monthsInYear: 13 }).valid).toBe(false);
    expect(computeSavings({ baselineUnitPrice: NaN, newUnitPrice: 1, annualVolume: 1, monthsInYear: 1 }).valid).toBe(false);
    expect(computeSavings({ baselineUnitPrice: 5, newUnitPrice: 5, annualVolume: 10, monthsInYear: 0 }).fullYearSaving).toBe(0);
    expect(tcoRequired('strategic')).toBe(true); expect(tcoRequired('bottleneck')).toBe(true); expect(tcoRequired('leverage')).toBe(false);
  });
});

describe('supplier preferencing overlay and lens (items 6, 15)', () => {
  it('maps the two inputs to the four supplier views and never guesses', () => {
    expect(spQuadrant({ accountValue: 'high', attractiveness: 'high', evidence: '' })).toBe('core');
    expect(spQuadrant({ accountValue: 'low', attractiveness: 'high', evidence: '' })).toBe('development');
    expect(spQuadrant({ accountValue: 'high', attractiveness: 'low', evidence: '' })).toBe('exploitable');
    expect(spQuadrant({ accountValue: 'low', attractiveness: 'low', evidence: '' })).toBe('nuisance');
    expect(spQuadrant({ accountValue: null, attractiveness: 'low', evidence: '' })).toBeNull();
    const c = spCue('bottleneck', { accountValue: null, attractiveness: null, evidence: '' });
    expect(c.cue).toBeNull(); expect(c.ask).not.toBeNull();
  });
  it('has all 16 cells, bilingual', () => {
    const cells = allSpCells();
    expect(cells.length).toBe(16);
    for (const c of cells) { expect(c.cue.en.length).toBeGreaterThan(5); expect(ar(c.cue.ar)).toBe(true); }
  });
  it('flags missing evidence but still gives the cue', () => {
    const c = spCue('strategic', { accountValue: 'low', attractiveness: 'low', evidence: '  ' });
    expect(c.sp).toBe('nuisance'); expect(c.noEvidence).toBe(true); expect(c.cue).not.toBeNull();
    expect(spCue('strategic', { accountValue: 'low', attractiveness: 'low', evidence: 'survey Q3' }).noEvidence).toBe(false);
  });
  it('lens: four segments, null when either answer is missing', () => {
    expect(lensSegment({ capability: 'high', willingness: 'high' })?.key).toBe('invest');
    expect(lensSegment({ capability: 'low', willingness: 'high' })?.key).toBe('build');
    expect(lensSegment({ capability: 'high', willingness: 'low' })?.key).toBe('win');
    expect(lensSegment({ capability: 'low', willingness: 'low' })?.key).toBe('simple');
    expect(lensSegment({ capability: null, willingness: 'low' })).toBeNull();
  });
});

describe('GCC modifiers (item 9)', () => {
  it('private sector sees no government rule and alternatives pass through', () => {
    const f = emptyGccFacts();
    expect(rulesVisible(f.jurisdiction)).toBe(false);
    expect(gccAdjustment(3, f).effectiveAlternatives).toBe(3);
  });
  it('Mandatory List shrinks the eligible base; asks when unknown', () => {
    const f = { ...emptyGccFacts(), jurisdiction: 'saudi-gov' as const };
    expect(gccAdjustment(3, f).ask).toBe(true);
    expect(gccAdjustment(3, { ...f, mandatoryListed: false }).effectiveAlternatives).toBe(3);
    expect(gccAdjustment(3, { ...f, mandatoryListed: true }).ask).toBe(true);
    const r = gccAdjustment(3, { ...f, mandatoryListed: true, nationalAlternatives: 1 });
    expect(r.effectiveAlternatives).toBe(1); expect(r.reducedBy).toBe(2);
    expect(gccAdjustment(2, { ...f, mandatoryListed: true, nationalAlternatives: 5 }).effectiveAlternatives).toBe(2);
    expect(gccAdjustment(2, { ...f, mandatoryListed: true, nationalAlternatives: 0 }).effectiveAlternatives).toBe(0);
  });
  it('Saudi method ladder: direct procurement ceiling is inclusive and needs a value', () => {
    expect(methodCheck('saudi-gov', 'direct', 1_000_000, false).ok).toBe(true);
    expect(methodCheck('saudi-gov', 'direct', 1_000_001, false).ok).toBe(false);
    expect(methodCheck('saudi-gov', 'direct', null, false).ok).toBe(false);
    expect(methodCheck('saudi-gov', 'limited-tender', null, false).ok).toBe(false);
    expect(methodCheck('saudi-gov', 'limited-tender', null, true).ok).toBe(true);
    expect(methodCheck('uae-gov', 'direct', 9e9, false).message.en).toMatch(/not captured/);
    expect(methodCheck('private', 'direct', 9e9, false).message.en).toMatch(/Private/);
  });
  it('price preference: dated, sourced and applied only on valid input', () => {
    for (const p of PRICE_PREFERENCES) { expect(p.reviewedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/); expect(p.status).toBe('secondary'); expect(ar(p.rule.ar)).toBe(true); }
    expect(evaluationPrice(100, 10)).toBe(110);
    expect(evaluationPrice(-1, 10)).toBeNull(); expect(evaluationPrice(100, NaN)).toBeNull();
  });
  it('does not state the unconfirmed claims as values', () => {
    expect(NOT_CONFIRMED.length).toBe(4);
    expect(PRICE_PREFERENCES.some((p) => p.valuePct === 15 && /Qatar/.test(p.country.en))).toBe(false);
  });
  it('supplier tags show only what is set', () => {
    const f = emptyGccFacts(); f.supplier.sme = true; f.supplier.iktvaScore = 55;
    expect(supplierTags(f).map((t) => t.en)).toEqual(['SME', 'IKTVA score 55']);
  });
});

const E = (o: Partial<LedgerEntry> & Pick<LedgerEntry, 'supplierId' | 'dateIso' | 'quadrant'>): LedgerEntry => ({
  id: o.supplierId + o.dateIso, subtype: null, riskPct: null, profitPct: null, mode: 'manual', reviewer: 'r', version: '1', trigger: null, persistence: null, hysteresisCount: null,
  outcome: emptyOutcome(), metricName: '', pre: null, post: null, note: '', ...o,
});

describe('evidence and measurement ledger (item 10)', () => {
  it('source ledger tags every claim and keeps unconfirmed claims unconfirmed', () => {
    expect(SOURCE_LEDGER.length).toBeGreaterThanOrEqual(10);
    for (const s of SOURCE_LEDGER) { expect(s.opened.length).toBeGreaterThan(0); expect(ar(s.claim.ar)).toBe(true); expect(ar(s.limit.ar)).toBe(true); }
    expect(SOURCE_LEDGER.find((s) => s.id === 'qa-15')?.status).toBe('unconfirmed');
    expect(SOURCE_LEDGER.find((s) => s.id === 'isc-movement')?.status).toBe('isc-synthesis');
  });
  it('KPIs are null until there is history', () => {
    const k = ledgerKpis([E({ supplierId: 'a', dateIso: '2026-01-01', quadrant: 'bottleneck' })]);
    expect(k.classificationStability).toBeNull(); expect(k.meanDaysBetweenReviews).toBeNull(); expect(k.movedOutOfBottleneck).toBe(0);
  });
  it('stability, gap, and items moved out of Bottleneck', () => {
    const k = ledgerKpis([
      E({ supplierId: 'a', dateIso: '2026-01-01', quadrant: 'bottleneck' }), E({ supplierId: 'a', dateIso: '2026-03-02', quadrant: 'bottleneck' }), E({ supplierId: 'a', dateIso: '2026-05-01', quadrant: 'non-critical' }),
      E({ supplierId: 'b', dateIso: '2026-01-01', quadrant: 'leverage' }), E({ supplierId: 'b', dateIso: '2026-01-31', quadrant: 'leverage' }),
    ]);
    expect(k.suppliers).toBe(2); expect(k.classificationStability).toBeCloseTo(2 / 3, 5); expect(k.movedOutOfBottleneck).toBe(1);
    expect(k.meanDaysBetweenReviews).toBe(Math.round((60 + 60 + 30) / 3));
  });
  it('savings need a declared baseline and unchanged quality; avoidance stays separate', () => {
    const ok = { ...emptyOutcome(), baselinePrice: 10, inYearSaving: 100, fullYearSaving: 200, costAvoidance: 50, qualityUnchanged: true };
    const noBase = { ...emptyOutcome(), inYearSaving: 999, fullYearSaving: 999 };
    const worse = { ...emptyOutcome(), baselinePrice: 10, inYearSaving: 777, fullYearSaving: 777, qualityUnchanged: false };
    const k = ledgerKpis([
      E({ supplierId: 'a', dateIso: '2026-01-01', quadrant: 'leverage', outcome: ok }),
      E({ supplierId: 'b', dateIso: '2026-01-01', quadrant: 'leverage', outcome: noBase }),
      E({ supplierId: 'c', dateIso: '2026-01-01', quadrant: 'leverage', outcome: worse }),
    ]);
    expect(k.savings).toEqual({ inYear: 100, fullYear: 200, counted: 1, skippedNoBaseline: 2 });
    expect(k.costAvoidance).toBe(50);
  });
  it('pre/post comparison and movement log', () => {
    const k = ledgerKpis([E({ supplierId: 'a', dateIso: '2026-01-01', quadrant: 'leverage', pre: 10, post: 7 }), E({ supplierId: 'b', dateIso: '2026-01-01', quadrant: 'leverage', pre: 4, post: 6 })]);
    expect(k.prePost).toEqual({ n: 2, meanChange: -0.5 });
    const m = movementLog([E({ supplierId: 'a', dateIso: '2026-01-01', quadrant: 'bottleneck' }), E({ supplierId: 'a', dateIso: '2026-06-01', quadrant: 'non-critical', trigger: 'event', persistence: 'structural', hysteresisCount: 2 })]);
    expect(m.length).toBe(1); expect(m[0].toQuadrant).toBe('non-critical'); expect(m[0].trigger).toBe('event');
  });
});

describe('wording pack (item 11)', () => {
  it('shows Arabic with the English name in brackets', () => {
    expect(arabicWithEnglish('bottleneck')).toBe('نقطة اختناق (إمداد هش) [Bottleneck]');
  });
  it('keeps every Arabic spelling of Kraljic searchable and rejects unfound variants', () => {
    for (const q of ['كرالجيك', 'كراجيك', 'كرلجيك', 'Kraljic matrix']) expect(matchesKraljicTerm(q)).toBe(true);
    expect(matchesKraljicTerm('كراليك')).toBe(false); expect(matchesKraljicTerm('')).toBe(false);
  });
  it('discloses honestly that the Arabic is not human-certified', () => {
    expect(ARABIC_DISCLOSURE.en).toMatch(/not certified by a human/);
    expect(ARABIC_DISCLOSURE.ar).toMatch(/ولم يعتمدها ممارس مشتريات بشري/);
  });
});
