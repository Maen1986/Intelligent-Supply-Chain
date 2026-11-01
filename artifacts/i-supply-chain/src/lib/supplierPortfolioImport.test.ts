import { describe, it, expect } from 'vitest';
import { parseScoresCsv, parseCarsCsv, mergeImport, parseCsvText, parsePeriod, parseIsoDate, SCORES_TEMPLATE_CSV, CARS_TEMPLATE_CSV } from './supplierPortfolioImport';
import { detectSupplier, worstRecurrencePriorIds, verifyRecovery, deriveImpactsFromCars, computeSupplierExposure, type SupplierRecord, type CARRecord } from './supplierRecoveryPortfolio';

const car = (id: string, rc: string, created: string, status: 'open' | 'closed' = 'closed', closed: string | null = null): CARRecord => ({
  id, supplierId: 's', category: 'delivery', scorecardDimension: 'delivery', rootCause: rc, status, createdAt: created, closedAt: status === 'closed' ? (closed ?? created) : null,
});

describe('CSV parser', () => {
  it('handles BOM, CRLF, quotes, escaped quotes and embedded newline', () => {
    const rows = parseCsvText('﻿a,b\r\n"x, y","he said ""hi"""\r\n"l1\nl2",z\r\n');
    expect(rows).toEqual([['a', 'b'], ['x, y', 'he said "hi"'], ['l1\nl2', 'z']]);
  });
  it('boundary: period and date validators', () => {
    expect(parsePeriod('2026-01')).toBe('2026-01');
    expect(parsePeriod('2026-12-31')).toBe('2026-12');
    expect(parsePeriod('2026-13')).toBeNull();
    expect(parsePeriod('26-01')).toBeNull();
    expect(parseIsoDate('2026-02-30')).toBeNull();
    expect(parseIsoDate('2026-02-28')).toBe('2026-02-28');
  });
});

describe('parseScoresCsv', () => {
  it('imports the shipped template with zero rejections', () => {
    const r = parseScoresCsv(SCORES_TEMPLATE_CSV);
    expect(r.report.rejected).toHaveLength(0);
    expect(r.suppliers).toHaveLength(1);
    expect(r.suppliers[0]!.scoreHistory12mo).toEqual([88, 86, 81, 79]);
    expect(r.suppliers[0]!.annualSpendSAR).toBe(1200000);
    expect(r.suppliers[0]!.dataSource).toBe('imported-file');
  });
  it('sorts out-of-order periods chronologically and keeps labels parallel', () => {
    const r = parseScoresCsv('supplier,period,score\nA,2026-03,70\nA,2026-01,90\nA,2026-02,80\n');
    expect(r.suppliers[0]!.scorePeriods).toEqual(['2026-01', '2026-02', '2026-03']);
    expect(r.suppliers[0]!.scoreHistory12mo).toEqual([90, 80, 70]);
  });
  it('rejects bad rows with a reason, never silently fixes them (hardest)', () => {
    const r = parseScoresCsv('supplier,period,score,quadrant\nA,2026-01,101,\nA,2026-02,abc,\nA,2026-03,50,weird\n,2026-04,50,\nA,2026-05,60,strategic\n');
    expect(r.report.rowsRead).toBe(5);
    expect(r.report.rowsAccepted).toBe(1);
    expect(r.report.rejected.map((x) => x.line)).toEqual([2, 3, 4, 5]);
    expect(r.report.rejected.every((x) => x.reasonEn && x.reasonAr)).toBe(true);
  });
  it('boundary: score 0 and 100 accepted', () => {
    const r = parseScoresCsv('supplier,period,score\nA,2026-01,0\nA,2026-02,100\n');
    expect(r.report.rejected).toHaveLength(0);
  });
  it('duplicate period keeps the later row and warns', () => {
    const r = parseScoresCsv('supplier,period,score\nA,2026-01,50\nA,2026-01,60\n');
    expect(r.suppliers[0]!.scoreHistory12mo).toEqual([60]);
    expect(r.report.warnings.some((w) => /Duplicate period/.test(w.reasonEn))).toBe(true);
  });
  it('supplier name matching ignores case and spacing', () => {
    const r = parseScoresCsv('supplier,period,score\nAl  Rawabi,2026-01,50\nal rawabi,2026-02,60\n');
    expect(r.suppliers).toHaveLength(1);
  });
  it('missing required column is a fatal, bilingual error', () => {
    const r = parseScoresCsv('supplier,score\nA,5\n');
    expect(r.report.fatalEn).toMatch(/period/);
    expect(r.report.fatalAr).toBeTruthy();
    expect(r.suppliers).toHaveLength(0);
  });
  it('no quadrant -> defaults to non-critical WITH a warning (not silent)', () => {
    const r = parseScoresCsv('supplier,period,score\nA,2026-01,50\n');
    expect(r.suppliers[0]!.quadrant).toBe('non-critical');
    expect(r.report.warnings.some((w) => /quadrant/.test(w.reasonEn))).toBe(true);
  });
  it('empty file is fatal', () => {
    expect(parseScoresCsv('').report.fatalEn).toBe('The file is empty.');
  });
});

describe('parseCarsCsv', () => {
  it('imports the shipped template with zero rejections', () => {
    const r = parseCarsCsv(CARS_TEMPLATE_CSV);
    expect(r.report.rejected).toHaveLength(0);
    expect(r.cars).toHaveLength(2);
    expect(r.cars[0]!.estimatedCostUSD).toBe(8000);
    expect(r.cars[1]!.cause).toBe('shared');
    expect(r.cars[1]!.estimatedCostUSD).toBeUndefined();
  });
  it('rejects closed-without-date, close-before-open, bad cause, bad cost, duplicate id', () => {
    const h = 'supplier,car_id,category,dimension,root_cause,status,opened,closed,cause,cost_usd,cost_basis,customer_impact\n';
    const r = parseCarsCsv(h +
      'A,1,delivery,delivery,x,closed,2026-01-01,,,,,\n' +
      'A,2,delivery,delivery,x,closed,2026-03-01,2026-02-01,,,,\n' +
      'A,3,delivery,delivery,x,open,2026-01-01,,martian,,,\n' +
      'A,4,delivery,delivery,x,open,2026-01-01,,,-5,,\n' +
      'A,5,delivery,delivery,x,open,2026-01-01,,,,,\n' +
      'A,5,delivery,delivery,x,open,2026-01-01,,,,,\n');
    expect(r.report.rejected.map((x) => x.line)).toEqual([2, 3, 4, 5, 7]);
    expect(r.cars).toHaveLength(1);
  });
  it('cost without a valid basis is labelled estimated with a warning', () => {
    const h = 'supplier,car_id,category,dimension,root_cause,status,opened,closed,cause,cost_usd,cost_basis,customer_impact\n';
    const r = parseCarsCsv(h + 'A,1,delivery,delivery,x,open,2026-01-01,,,500,,\n');
    expect(r.cars[0]!.costBasis).toBe('estimated');
    expect(r.report.warnings).toHaveLength(1);
  });
  it('open CAR with a closed date: closed date ignored, warned', () => {
    const h = 'supplier,car_id,category,dimension,root_cause,status,opened,closed,cause,cost_usd,cost_basis,customer_impact\n';
    const r = parseCarsCsv(h + 'A,1,delivery,delivery,x,open,2026-01-01,2026-02-01,,,,\n');
    expect(r.cars[0]!.closedAt).toBeNull();
    expect(r.report.warnings).toHaveLength(1);
  });
});

describe('mergeImport', () => {
  it('adds new suppliers, updates by name, attaches CARs, reports unmatched CARs', () => {
    const existing = parseScoresCsv('supplier,period,score,category\nA,2026-01,50,P\n').suppliers;
    const incoming = parseScoresCsv('supplier,period,score,category\na,2026-01,60,P\nB,2026-01,70,Q\n').suppliers;
    const cars = parseCarsCsv('supplier,car_id,category,dimension,root_cause,status,opened\nA,1,delivery,delivery,x,open,2026-01-01\nZ,2,delivery,delivery,x,open,2026-01-01\n').cars;
    const { merged, summary } = mergeImport(existing, incoming, cars);
    expect(summary).toMatchObject({ suppliersAdded: 1, suppliersUpdated: 1, carsAdded: 1, carsUpdated: 0 });
    expect(summary.carsUnmatched).toEqual(['Z / 2']);
    expect(merged.find((s) => s.name === 'A')!.scoreHistory12mo).toEqual([60]);
    expect(merged.find((s) => s.name === 'A')!.cars[0]!.supplierId).toBe(merged.find((s) => s.name === 'A')!.supplierId);
  });
  it('re-importing the same CAR id updates, not duplicates (idempotent)', () => {
    const sup = parseScoresCsv('supplier,period,score\nA,2026-01,50\n').suppliers;
    const c1 = parseCarsCsv('supplier,car_id,category,dimension,root_cause,status,opened\nA,1,delivery,delivery,x,open,2026-01-01\n').cars;
    const once = mergeImport(sup, [], c1).merged;
    const twice = mergeImport(once, [], c1);
    expect(twice.merged[0]!.cars).toHaveLength(1);
    expect(twice.summary.carsUpdated).toBe(1);
  });
});

describe('recurrence is per root cause (Round B fix)', () => {
  it('three CARs same root cause -> 2 prior occurrences', () => {
    expect(worstRecurrencePriorIds([car('1', 'A', '2026-01-01'), car('2', 'A', '2026-02-01'), car('3', 'A', '2026-03-01', 'open')])).toEqual(['1', '2']);
  });
  it('different root causes do NOT count as repeats (old code over-counted)', () => {
    expect(worstRecurrencePriorIds([car('1', 'A', '2026-01-01'), car('2', 'B', '2026-02-01'), car('3', 'C', '2026-03-01')])).toEqual([]);
  });
  it('empty root cause is never grouped; case/space-insensitive otherwise', () => {
    expect(worstRecurrencePriorIds([car('1', '', '2026-01-01'), car('2', '', '2026-02-01')])).toEqual([]);
    expect(worstRecurrencePriorIds([car('1', 'Late Ship', '2026-01-01'), car('2', ' late ship ', '2026-02-01')])).toEqual(['1']);
  });
  it('a lone OPEN CAR (first occurrence) no longer reads as a repeat', () => {
    const s: SupplierRecord = { supplierId: 's', name: 's', category: '', quadrant: 'leverage', quadrantPriorQuarter: null, scoreHistory12mo: [80, 80, 80, 80, 80, 80], cars: [car('1', 'A', '2026-01-01', 'open')] };
    expect(detectSupplier(s).recurrenceCount).toBe(0);
  });
});

describe('verifyRecovery', () => {
  const base = (scores: number[], periods: string[] | undefined, closed: string): SupplierRecord => ({
    supplierId: 's', name: 's', category: '', quadrant: 'leverage', quadrantPriorQuarter: null,
    scoreHistory12mo: scores, scorePeriods: periods, cars: [car('1', 'A', '2026-01-01', 'closed', closed)],
  });
  it('verified when post-closure mean >= pre-closure mean', () => {
    const r = verifyRecovery(base([70, 72, 80, 82, 84], ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05'], '2026-02-20'));
    expect(r.status).toBe('VERIFIED_RECOVERED');
  });
  it('closed but not recovered', () => {
    const r = verifyRecovery(base([85, 86, 70, 68, 66], ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05'], '2026-02-20'));
    expect(r.status).toBe('CLOSED_NOT_RECOVERED');
  });
  it('boundary: exactly 1 post-closure period is NOT enough; 2 is', () => {
    expect(verifyRecovery(base([70, 80, 90], ['2026-01', '2026-02', '2026-03'], '2026-02-20')).status).toBe('NOT_ENOUGH_POST_CLOSURE_DATA');
    expect(verifyRecovery(base([70, 80, 90, 90], ['2026-01', '2026-02', '2026-03', '2026-04'], '2026-02-20')).status).toBe('VERIFIED_RECOVERED');
  });
  it('boundary: equal means count as recovered', () => {
    expect(verifyRecovery(base([80, 80, 80, 80], ['2026-01', '2026-02', '2026-03', '2026-04'], '2026-02-20')).status).toBe('VERIFIED_RECOVERED');
  });
  it('no period labels -> says so, never guesses', () => {
    expect(verifyRecovery(base([1, 2, 3], undefined, '2026-02-20')).status).toBe('NO_PERIOD_LABELS');
  });
  it('no closed CAR', () => {
    const s = base([1], ['2026-01'], '2026-02-20');
    s.cars = [];
    expect(verifyRecovery(s).status).toBe('NO_CLOSED_CAR');
  });
});

describe('real-data helpers', () => {
  it('uncosted CARs produce no impact row (never zero-filled)', () => {
    const c1 = { ...car('1', 'A', '2026-01-01'), estimatedCostUSD: 100 };
    const c2 = car('2', 'A', '2026-02-01');
    const { impacts, overrides } = deriveImpactsFromCars([c1, { ...c2, customerImpact: 'external' }]);
    expect(impacts.map((i) => i.carId)).toEqual(['1']);
    expect(overrides).toEqual([{ carId: '2', customerImpact: 'external' }]);
  });
  it('client-supplied spend beats the mock derivation; zero spend is not treated as supplied', () => {
    const s: SupplierRecord = { supplierId: 's', name: 's', category: 'X', quadrant: 'leverage', quadrantPriorQuarter: null, scoreHistory12mo: [1], cars: [], annualSpendSAR: 500 };
    expect(computeSupplierExposure(s, [], [])).toEqual({ supplierId: 's', exposureSAR: 500, exposureBasis: 'client-supplied' });
    expect(computeSupplierExposure({ ...s, annualSpendSAR: 0 }, [], []).exposureBasis).toBe('INSUFFICIENT_DATA');
  });
});
