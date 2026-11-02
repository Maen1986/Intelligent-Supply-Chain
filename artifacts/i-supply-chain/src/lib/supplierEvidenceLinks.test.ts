import { describe, it, expect } from 'vitest';
import { toNegotiationFacts, toRemedyCheck, toSignalFeed, LINK_REGISTRY, CONVENTION_NOTE } from './supplierEvidenceLinks';
import type { EvidencePackage } from './supplierDecisionView';
import { buildDecisions } from './supplierDecisionView';
import type { SupplierRecord, CARRecord } from './supplierRecoveryPortfolio';

const base = (o: Partial<EvidencePackage> = {}): EvidencePackage => ({
  supplierId: 's', supplierName: 'S', asOfIso: '2026-11-01',
  causeCounts: { supplier: 0, client: 0, shared: 0, external: 0, measurement: 0, unassessed: 0 },
  recurrenceCount: 0, costedCOPQUSD: null, costedCarCount: 0, totalCarCount: 0, openCarIds: [], recoveryStatus: 'NO_CLOSED_CAR', handoffTo: [], ...o,
});

describe('M06 negotiation facts', () => {
  it('no CARs: no blame, cost is not-available, never zero', () => {
    const r = toNegotiationFacts(base());
    expect(r.blameUsable).toBe(true);
    const copq = r.facts.find((f) => f.key === 'copq')!;
    expect(copq.basis).toBe('not-available');
    expect(copq.text.en).toMatch(/not costed/);
  });
  it('unassessed CARs are cautioned, never counted as supplier fault', () => {
    const r = toNegotiationFacts(base({ totalCarCount: 3, causeCounts: { supplier: 0, client: 0, shared: 0, external: 0, measurement: 0, unassessed: 3 } }));
    expect(r.facts.find((f) => f.key === 'cause-mix')).toBeUndefined();
    expect(r.cautions.some((c) => c.key === 'unassessed')).toBe(true);
  });
  it('boundary: exactly 50% non-supplier among 2 assessed blocks blame; 1 assessed does not', () => {
    const two = toNegotiationFacts(base({ totalCarCount: 2, causeCounts: { supplier: 1, client: 1, shared: 0, external: 0, measurement: 0, unassessed: 0 } }));
    expect(two.blameUsable).toBe(false);
    expect(two.cautions.some((c) => c.key === 'fix-our-side')).toBe(true);
    const one = toNegotiationFacts(base({ totalCarCount: 1, causeCounts: { supplier: 0, client: 1, shared: 0, external: 0, measurement: 0, unassessed: 0 } }));
    expect(one.blameUsable).toBe(true);
  });
  it('partial costing is flagged as a floor', () => {
    const r = toNegotiationFacts(base({ totalCarCount: 4, costedCarCount: 1, costedCOPQUSD: 1000 }));
    expect(r.cautions.some((c) => c.key === 'copq-partial')).toBe(true);
  });
  it('every fact and caution is bilingual', () => {
    const r = toNegotiationFacts(base({ totalCarCount: 3, recurrenceCount: 2, costedCOPQUSD: 500, costedCarCount: 1, recoveryStatus: 'CLOSED_NOT_RECOVERED', causeCounts: { supplier: 1, client: 1, shared: 0, external: 0, measurement: 1, unassessed: 1 } }));
    for (const x of [...r.facts, ...r.cautions]) { expect(x.text.en).toBeTruthy(); expect(x.text.ar).toMatch(/[؀-ۿ]/); }
  });
});

describe('M03 remedy check', () => {
  it('no CARs: nothing to check', () => {
    expect(toRemedyCheck(base()).items).toEqual([]);
  });
  it('boundary: recurrence 1 does not trigger penalty/step-in, 2 does', () => {
    const fams = (n: number) => toRemedyCheck(base({ totalCarCount: 2, recurrenceCount: n })).items.map((i) => i.family);
    expect(fams(1)).not.toContain('service-credits-penalties');
    expect(fams(2)).toContain('service-credits-penalties');
    expect(fams(2)).toContain('step-in-termination-persistent-breach');
  });
  it('closed-not-recovered triggers an escalation check; the convention note always travels with it', () => {
    const r = toRemedyCheck(base({ totalCarCount: 1, recoveryStatus: 'CLOSED_NOT_RECOVERED' }));
    expect(r.items.some((i) => i.triggeredBy === 'closed-not-recovered')).toBe(true);
    expect(r.convention).toBe(CONVENTION_NOTE);
    expect(CONVENTION_NOTE.en).toMatch(/not legal advice/);
  });
  it('no duplicate family+trigger pairs', () => {
    const r = toRemedyCheck(base({ totalCarCount: 5, recurrenceCount: 4, costedCOPQUSD: 10, costedCarCount: 5, recoveryStatus: 'CLOSED_NOT_RECOVERED', openCarIds: ['a'], causeCounts: { supplier: 3, client: 0, shared: 1, external: 0, measurement: 0, unassessed: 1 } }));
    const keys = r.items.map((i) => i.family + '|' + i.triggeredBy);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('CHAINED: real M07 decision -> M06 facts, M03 check, M10/M11 feed', () => {
  const car = (id: string, rc: string, created: string, o: Partial<CARRecord> = {}): CARRecord => ({
    id, supplierId: 'A', category: 'delivery', scorecardDimension: 'delivery', rootCause: rc, status: 'open', createdAt: created, closedAt: null, ...o,
  });
  const s: SupplierRecord = {
    supplierId: 'A', name: 'A', category: 'Cat', quadrant: 'leverage', quadrantPriorQuarter: null,
    scoreHistory12mo: [90, 85, 80, 75, 70, 65],
    cars: [car('1', 'x', '2026-01-01', { cause: 'supplier', estimatedCostUSD: 800 }), car('2', 'x', '2026-03-01', { cause: 'supplier' }), car('3', 'x', '2026-05-01', { cause: 'supplier' })],
  };
  const ds = buildDecisions([s], { asOfIso: '2026-11-01', categoryItems: [], shares: [] });
  it('facts reflect the real decision and the feed carries the tier', () => {
    const f = toNegotiationFacts(ds[0].evidence);
    expect(f.facts.find((x) => x.key === 'recurrence')).toBeTruthy();
    expect(f.cautions.some((c) => c.key === 'copq-partial')).toBe(true);
    const r = toRemedyCheck(ds[0].evidence);
    expect(r.items.some((i) => i.family === 'service-credits-penalties')).toBe(true);
    const feed = toSignalFeed(ds, '2026-11-01');
    expect(feed.length).toBe(1);
    expect(feed[0].source).toBe('M07');
    expect(feed[0].openCarCount).toBe(3);
  });
  it('a quiet supplier produces no feed event', () => {
    const q: SupplierRecord = { ...s, supplierId: 'Q', name: 'Q', cars: [], scoreHistory12mo: [90, 90, 90, 90, 90, 90] };
    expect(toSignalFeed(buildDecisions([q], { asOfIso: '2026-11-01', categoryItems: [], shares: [] }), '2026-11-01')).toEqual([]);
  });
});

describe('link registry is honest about what is built', () => {
  it('built entries name a real function; unbuilt entries say so', () => {
    for (const l of LINK_REGISTRY) {
      expect(l.carries.en && l.carries.ar).toBeTruthy();
      if (l.status === 'built') expect(['toNegotiationFacts', 'toRemedyCheck', 'toSignalFeed']).toContain(l.via);
    }
    expect(LINK_REGISTRY.filter((l) => l.status === 'defined-not-built').map((l) => l.module).sort()).toEqual(['M04', 'M08']);
  });
});
