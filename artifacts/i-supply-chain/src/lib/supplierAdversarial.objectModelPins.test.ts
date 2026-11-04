/**
 * Round C #668 (RC-4/RC-6) — exact-behaviour pins for supplierObjectModel (Module 03), written from Stryker
 * survivors: ids, defaults, role-quality text, entity-resolution tiers, normalisation, near-miss, stopwords.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  newSupplierNode,
  newSupplierRecord,
  attachFact,
  assessSupplierRoleDataQuality,
  resolveSupplierEntity,
  confirmManualResolution,
  _resetIdCounterForTests,
  type RegistryEntry,
} from '@/lib/supplierObjectModel';

beforeEach(() => _resetIdCounterForTests());

describe('ids and defaults', () => {
  it('ids are prefix-n, increment by exactly one, and reset to 0', () => {
    const n1 = newSupplierNode('legalEntity', 'A');
    const n2 = newSupplierNode('site', 'B');
    expect(n1.id).toBe('node-1');
    expect(n2.id).toBe('node-2');
    const r = newSupplierRecord(n1);
    expect(r.supplierId).toBe('supplier-3');
    const f = attachFact(r, n1.id, 'legalEntity', 'x', 1, 'CLAIMED', 'manual');
    expect(f.id).toBe('fact-4');
    _resetIdCounterForTests();
    expect(newSupplierNode('site', 'C').id).toBe('node-1');
  });
  it('node defaults are null/empty, and supplied options are kept', () => {
    const d = newSupplierNode('legalEntity', 'A');
    expect(d).toEqual({ id: 'node-1', level: 'legalEntity', name: 'A', parentNodeId: null, country: null, legalEntityNumber: null, tradingNames: [] });
    const o = newSupplierNode('site', 'B', { parentNodeId: 'p', country: 'KSA', legalEntityNumber: '123', tradingNames: ['T'] });
    expect(o.parentNodeId).toBe('p');
    expect(o.country).toBe('KSA');
    expect(o.legalEntityNumber).toBe('123');
    expect(o.tradingNames).toEqual(['T']);
  });
  it('a new record starts with empty sites, one node, the intake resolution text, and DISCOVERED', () => {
    const n = newSupplierNode('legalEntity', 'A');
    const r = newSupplierRecord(n);
    expect(r.hierarchy.siteIds).toEqual([]);
    expect(r.nodes).toEqual([n]);
    expect(r.facts).toEqual([]);
    expect(r.discoveryState).toBe('DISCOVERED');
    expect(r.supplierRole).toBe('unknown');
    expect(r.entityResolution.method).toBe('no-match-new-entity');
    expect(r.entityResolution.confidence).toBe('HIGH');
    expect(r.entityResolution.resolvedAgainst).toBeNull();
    expect(r.entityResolution.reasonEn).toBe('No existing registry entry matched at intake; recorded as a new entity.');
    expect(r.entityResolution.reasonAr).toBe('لم يتطابق أي سجل حالي عند الإدخال؛ تم تسجيله كمنشأة جديدة.');
  });
});

describe('assessSupplierRoleDataQuality exact text', () => {
  it('unknown role: gap with the trader/agent warning, EN and AR', () => {
    const r = newSupplierRecord(newSupplierNode('legalEntity', 'A'), 'unknown');
    const q = assessSupplierRoleDataQuality(r);
    expect(q.hasGap).toBe(true);
    expect(q.reasonEn.startsWith('supplierRole is unconfirmed. A trader or agent claiming')).toBe(true);
    expect(q.reasonAr.startsWith('دور المورّد غير مؤكد.')).toBe(true);
  });
  it('confirmed role: no gap and exact confirmation text', () => {
    const r = newSupplierRecord(newSupplierNode('legalEntity', 'A'), 'manufacturer');
    expect(assessSupplierRoleDataQuality(r)).toEqual({ hasGap: false, reasonEn: 'supplierRole confirmed.', reasonAr: 'تم تأكيد دور المورّد.' });
  });
});

const reg = (over: Partial<RegistryEntry> & { supplierId: string }): RegistryEntry => ({
  legalEntityNumber: null, legalName: 'Zeta', tradingNames: [], declaredParent: null, country: 'Qatar', ...over,
});
const inp = (o: Partial<Parameters<typeof resolveSupplierEntity>[0]> = {}) => ({ legalName: '', country: 'Qatar', ...o }) as Parameters<typeof resolveSupplierEntity>[0];

describe('resolution tier 1: legal entity number', () => {
  const R = [reg({ supplierId: 'S1', legalEntityNumber: 'cr-1010 123', legalName: 'Other' })];
  it('matches ignoring case, spaces and dashes, HIGH, with the id in both reasons', () => {
    const r = resolveSupplierEntity(inp({ legalEntityNumber: ' CR1010123 ' }), R);
    expect(r.isNewEntity).toBe(false);
    expect(r.resolvedAgainst).toBe('S1');
    expect(r.method).toBe('legal-entity-number');
    expect(r.confidence).toBe('HIGH');
    expect(r.reasonEn).toBe('Registered legal entity number matches existing supplier S1 exactly -- highest-reliability resolution key.');
    expect(r.reasonAr).toContain('الحالي S1');
    expect(resolveSupplierEntity(inp({ legalEntityNumber: 'cr-1010-123' }), R).resolvedAgainst).toBe('S1');
  });
  it('a registry entry with a null number never matches; a different number does not match', () => {
    const r1 = resolveSupplierEntity(inp({ legalEntityNumber: 'X1' }), [reg({ supplierId: 'S2', legalEntityNumber: null })]);
    expect(r1.resolvedAgainst).toBeNull();
    expect(resolveSupplierEntity(inp({ legalEntityNumber: 'X2' }), R).resolvedAgainst).toBeNull();
  });
  it('falls through to name tiers when the number is unknown', () => {
    const r = resolveSupplierEntity(inp({ legalEntityNumber: 'NOPE', legalName: 'Other' }), R);
    expect(r.method).toBe('legal-name-country');
  });
});

describe('resolution tier 2: legal name + country', () => {
  const R = [reg({ supplierId: 'S1', legalName: 'Gulf Line Logistics' })];
  it('matches case/punctuation-insensitively, MODERATE, exact text', () => {
    const r = resolveSupplierEntity(inp({ legalName: '  GULF-line, logistics ' }), R);
    expect(r.method).toBe('legal-name-country');
    expect(r.confidence).toBe('MODERATE');
    expect(r.isNewEntity).toBe(false);
    expect(r.reasonEn).toBe('Legal name and country match existing supplier S1 exactly; no legal entity number was available to confirm at the highest tier.');
    expect(r.reasonAr).toContain('المورّد الحالي S1');
  });
  it('same name in a different country is not a tier-2 match', () => {
    const r = resolveSupplierEntity(inp({ legalName: 'Gulf Line Logistics', country: 'Oman' }), R);
    expect(r.method).not.toBe('legal-name-country');
    expect(r.isNewEntity).toBe(true);
  });
});

describe('resolution tier 3: trading name + declared parent + country', () => {
  const R = [reg({ supplierId: 'S1', legalName: 'Unrelated Co', tradingNames: ['Quick Ship'], declaredParent: 'Mega Holding' })];
  it('needs ALL of trading name, parent and country; LOW confidence; exact text', () => {
    const r = resolveSupplierEntity(inp({ legalName: 'Nothing Matches Here', tradingName: 'quick ship', declaredParent: 'MEGA holding' }), R);
    expect(r.method).toBe('trading-name-parent-country');
    expect(r.confidence).toBe('LOW');
    expect(r.isNewEntity).toBe(false);
    expect(r.reasonEn).toBe('Trading name, declared parent, and country match existing supplier S1 -- the weakest automatic tier. Recommend confirming with a legal entity number when available.');
    expect(r.reasonAr).toContain('المورّد الحالي S1');
  });
  it('each condition individually blocks the tier', () => {
    const base = { legalName: 'Nothing Matches Here', tradingName: 'Quick Ship', declaredParent: 'Mega Holding' };
    expect(resolveSupplierEntity(inp({ ...base, tradingName: 'Slow Ship' }), R).method).not.toBe('trading-name-parent-country');
    expect(resolveSupplierEntity(inp({ ...base, declaredParent: 'Other Parent' }), R).method).not.toBe('trading-name-parent-country');
    expect(resolveSupplierEntity(inp({ ...base, country: 'Oman' }), R).method).not.toBe('trading-name-parent-country');
    expect(resolveSupplierEntity(inp({ ...base, declaredParent: undefined }), R).method).not.toBe('trading-name-parent-country');
    expect(resolveSupplierEntity(inp({ ...base, tradingName: undefined }), R).method).not.toBe('trading-name-parent-country');
    const noParent = [reg({ supplierId: 'S9', legalName: 'Unrelated Co', tradingNames: ['Quick Ship'], declaredParent: null })];
    expect(resolveSupplierEntity(inp(base), noParent).method).not.toBe('trading-name-parent-country');
  });
});

describe('near-miss detection and stopwords', () => {
  it('two shared significant words in the same country -> near-miss, never merged, candidates listed', () => {
    const R = [reg({ supplierId: 'S1', legalName: 'Gulf Line Logistics Holding W.L.L.' }), reg({ supplierId: 'S2', legalName: 'Gulf Line Trading', country: 'Oman' })];
    const r = resolveSupplierEntity(inp({ legalName: 'Gulf Line Trading Est.' }), R);
    expect(r.method).toBe('near-miss-unconfirmed');
    expect(r.isNewEntity).toBe(false);
    expect(r.resolvedAgainst).toBeNull();
    expect(r.confidence).toBe('LOW');
    expect(r.candidateMatches).toEqual(['S1']);
    expect(r.reasonEn).toBe('Partial name/country overlap with 1 existing record(s), but nothing cleared an automatic resolution tier. Flagged for manual confirmation rather than merged or discarded.');
    expect(r.reasonAr).toContain('تداخل جزئي في الاسم/الدولة مع 1 سجل(سجلات)');
  });
  it('stopwords and short tokens do not count as shared words', () => {
    for (const w of ['co', 'company', 'llc', 'wll', 'est', 'establishment', 'holding', 'group', 'services', 'service', 'the', 'of']) {
      const R = [reg({ supplierId: 'S1', legalName: `Alpha ${w} ${w} Beta` })];
      // shares only stopwords with the input -> must NOT near-miss on tokens alone
      const r = resolveSupplierEntity(inp({ legalName: `Gamma ${w} ${w} Delta` }), R);
      expect(r.method, `stopword ${w}`).toBe('no-match-new-entity');
    }
    const R2 = [reg({ supplierId: 'S1', legalName: 'Ab Cd Ef' })];
    expect(resolveSupplierEntity(inp({ legalName: 'Ab Cd Gh' }), R2).method).toBe('no-match-new-entity'); // 2-letter tokens ignored
  });
  it('a single shared significant word is not enough, but substring containment is', () => {
    const R = [reg({ supplierId: 'S1', legalName: 'Falcon Marine' })];
    expect(resolveSupplierEntity(inp({ legalName: 'Falcon Aviation' }), R).method).toBe('no-match-new-entity');
    expect(resolveSupplierEntity(inp({ legalName: 'Falcon Marine Services Arabia' }), R).method).toBe('near-miss-unconfirmed');
  });
  it('trading-name overlap can raise a near-miss; a different country cannot', () => {
    const R = [reg({ supplierId: 'S1', legalName: 'Unrelated', tradingNames: ['Blue Harbour Freight'] })];
    expect(resolveSupplierEntity(inp({ legalName: 'Different', tradingName: 'Blue Harbour Shipping' }), R).method).toBe('near-miss-unconfirmed');
    expect(resolveSupplierEntity(inp({ legalName: 'Different', tradingName: 'Blue Harbour Shipping', country: 'Oman' }), R).method).toBe('no-match-new-entity');
  });
  it('no signal at all -> new entity with exact text', () => {
    const r = resolveSupplierEntity(inp({ legalName: 'Totally New' }), [reg({ supplierId: 'S1' })]);
    expect(r.isNewEntity).toBe(true);
    expect(r.confidence).toBe('HIGH');
    expect(r.reasonEn).toBe('No existing registry entry matches on any resolution tier or partial signal. Recorded as a new entity.');
    expect(r.reasonAr.startsWith('لا يوجد سجل حالي مطابق')).toBe(true);
    expect(r.candidateMatches).toBeUndefined();
  });
});

describe('confirmManualResolution', () => {
  it('null target is a new entity; a target is a merge; both MODERATE with the reviewer note', () => {
    const n = confirmManualResolution(null, 'checked CR');
    expect(n.isNewEntity).toBe(true);
    expect(n.reasonEn).toBe('Manually confirmed by reviewer: checked CR');
    expect(n.reasonAr).toBe('تم التأكيد يدوياً من قِبل المراجع: checked CR');
    const m = confirmManualResolution('S7', 'same CR');
    expect(m.isNewEntity).toBe(false);
    expect(m.resolvedAgainst).toBe('S7');
    expect(m.confidence).toBe('MODERATE');
    expect(m.method).toBe('manual-confirmation');
  });
});
