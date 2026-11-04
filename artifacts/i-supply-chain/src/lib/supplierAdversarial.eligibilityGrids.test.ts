// Round C (#668) -- independent-oracle grid pins for the EG auto and KW Art.87 gates,
// and null-guard pins for actionableNextStepForGccOriginTreatment. The oracle below is
// written from the disclosed thresholds, not copied from the engine.
import { describe, it, expect } from 'vitest';
import { assessSupplierLocalContent, actionableNextStepForGccOriginTreatment } from './supplierLocalContentEligibility';

type N = number | null;
const tri = (f: boolean, missing: boolean): boolean | null => (f ? false : missing ? null : true);

describe('Round C grid: Egypt auto incentive gate vs independent oracle', () => {
  const cats: Array<'ice' | 'ev' | null> = ['ice', 'ev', null];
  const lc: N[] = [null, 0, 9.9, 10, 10.1, 19.9, 20, 20.1, 55];
  const price: N[] = [null, 1_250_000, 1_250_001, 900_000];
  const cc: N[] = [null, 1600, 1601, 1000];
  const units: N[] = [null, 999, 1000, 9_999, 10_000, 20_000];
  const perModel: N[] = [null, 4_999, 5_000, 8_000];
  it('matches oracle for every combination', () => {
    let n = 0;
    for (const cat of cats) for (const l of lc) for (const p of price) for (const c of cc) for (const u of units) for (const m of perModel) {
      const a = assessSupplierLocalContent('EG', 'private-commercial', { egAuto: { vehicleCategory: cat, localContentPct: l, exFactoryPriceEGP: p, engineCC: c, annualProductionUnits: u, unitsPerModel: m } }, 'eg-auto-local-content');
      const comp: any = a.computation;
      if (!comp) continue; // input-level insufficient handled elsewhere
      n++;
      const thr = cat === 'ice' ? 20 : cat === 'ev' ? 10 : null;
      const lcFail = thr !== null && l !== null && l < thr;
      const lcExp = cat === null ? null : lcFail ? false : l === null ? null : true;
      let pe: boolean | null = null;
      if (cat === 'ice') pe = tri((p !== null && p > 1_250_000) || (c !== null && c > 1600), p === null || c === null);
      let pv: boolean | null = null;
      if (cat === 'ice') pv = tri((u !== null && u < 10_000) || (m !== null && m < 5_000), u === null || m === null);
      else if (cat === 'ev') pv = tri(u !== null && u < 1_000, u === null);
      const gates = cat === 'ice' ? [lcExp, pe, pv] : cat === 'ev' ? [lcExp, pv] : [];
      const elig = cat === null ? null : gates.some(g => g === false) ? false : gates.some(g => g === null) ? null : true;
      expect(comp.vehicleCategory).toBe(cat);
      expect(comp.localContentThresholdPct).toBe(thr);
      expect(comp.meetsLocalContentThreshold).toBe(lcExp);
      expect(comp.meetsPriceAndEngineCriteria).toBe(pe);
      expect(comp.meetsProductionVolumeCriteria).toBe(pv);
      expect(comp.eligibleForIncentive).toBe(elig);
    }
    expect(n).toBeGreaterThan(1000);
  });
});

describe('Round C grid: Kuwait Art.87 dual gate vs oracle', () => {
  const v: N[] = [null, 0, 29.9, 30, 30.1, 100];
  it('matches oracle for every combination', () => {
    for (const mat of v) for (const w of v) {
      const a = assessSupplierLocalContent('KW', 'government', { kwLocalContent: { localMaterialsSharePct: mat, localWorksSharePct: w } }, 'kw-local-content');
      const c: any = a.computation;
      const mf = mat !== null && mat < 30; const wf = w !== null && w < 30;
      expect(c.meetsMaterialsThreshold).toBe(mat === null ? null : !mf);
      expect(c.meetsWorksThreshold).toBe(w === null ? null : !wf);
      expect(c.meetsLocalSourcingRequirement).toBe(tri(mf || wf, mat === null || w === null));
    }
  });
});

describe('Round C pins: GCC origin next-step null guards', () => {
  const ok: any = { mechanismType: 'gcc-origin-national-treatment-gate', gccValueAddedPct: 45, gccCitizenOwnershipPct: 60, valueAddedThresholdPct: 40, ownershipThresholdPct: 51, qualifiesAsGccNationalProduct: true };
  it('returns text only when qualifies and both pcts present', () => {
    expect(actionableNextStepForGccOriginTreatment(ok)).not.toBeNull();
    expect(actionableNextStepForGccOriginTreatment({ ...ok, qualifiesAsGccNationalProduct: false })).toBeNull();
    expect(actionableNextStepForGccOriginTreatment({ ...ok, qualifiesAsGccNationalProduct: null })).toBeNull();
    expect(actionableNextStepForGccOriginTreatment({ ...ok, gccValueAddedPct: null })).toBeNull();
    expect(actionableNextStepForGccOriginTreatment({ ...ok, gccCitizenOwnershipPct: null })).toBeNull();
    const s = actionableNextStepForGccOriginTreatment(ok)!;
    expect(s.en).toContain('45.0% GCC value-added, 60.0% GCC-citizen ownership');
    expect(s.ar).toContain('45.0٪');
  });
});

describe('Round C grid: Turkey SSB industrialization liabilities vs oracle', () => {
  const cv: N[] = [null, 0, 100_000_000];
  const ys: N[] = [null, 0, 20.9, 21, 21.1, 60];
  const ey: N[] = [null, 69.9, 70, 70.1, 100];
  const tech: N[] = [null, 0, 1_999_999, 2_000_000, 2_000_001, 5_000_000];
  it('matches oracle for every combination', () => {
    let n = 0;
    for (const c of cv) for (const y of ys) for (const e of ey) for (const t of tech) {
      const a = assessSupplierLocalContent('TR', 'government', { trDefenseOffset: { contractValueTRY: c, ysSmeWorkSharePct: y, eydepWorkSharePct: e, techAcquisitionValueTRY: t } }, 'tr-defense-offset');
      const r: any = a.computation;
      if (!r) continue;
      n++;
      const req = c === null ? null : c * 2 / 100;
      const yf = y !== null && y < 21, ef = e !== null && e < 70;
      const tf = req !== null && t !== null && t < req;
      expect(r.requiredTechAcquisitionValueTRY).toBe(req);
      expect(r.meetsYsSmeThreshold).toBe(y === null ? null : !yf);
      expect(r.meetsEydepThreshold).toBe(e === null ? null : !ef);
      expect(r.meetsTechAcquisitionThreshold).toBe(t === null ? null : !tf);
      expect(r.meetsAllLiabilities).toBe(tri(yf || ef || tf, y === null || e === null || req === null || t === null));
      expect(r.ysSmeWorkSharePct).toBe(y);
      expect(r.eydepWorkSharePct).toBe(e);
      expect(r.contractValueTRY).toBe(c);
    }
    expect(n).toBeGreaterThan(100);
  });
});
