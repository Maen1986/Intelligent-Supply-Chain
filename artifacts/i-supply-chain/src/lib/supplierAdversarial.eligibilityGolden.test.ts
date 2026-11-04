/**
 * Round C #668 (RC-4/RC-6) — characterization ("golden") pins for supplierLocalContentEligibility (Module 08).
 *
 * WHAT THIS IS: a recorded-output regression net. 253 distinct supplier input sets that the existing Module 08 tests
 * already use (fixtures/localContentGoldenInputs.json) are replayed against EVERY country x program x buyer-context
 * combination, through assess -> recommend (at several targets) -> portfolio roll-up -> stacked assess-all. The full
 * outputs (English and Arabic strings, numbers, flags) are folded into one SHA-1 per country/program/context group and
 * compared with fixtures/localContentGoldenHashes.json.
 *
 * WHAT THIS IS NOT: it does not prove the outputs are correct, only that they have not changed. Arabic strings are
 * pinned as they exist today (owner's native-reader sign-off recorded 4 Nov 2026, see Round C Final Status v4). If a change is intentional,
 * review the diff, then regenerate:  GOLDEN_UPDATE=1 npx vitest run src/lib/supplierAdversarial.eligibilityGolden.test.ts
 */
import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  PROGRAMS_BY_COUNTRY,
  assessSupplierLocalContent,
  recommendLocalContentAction,
  rollUpPortfolioLocalContent,
  assessAllApplicableLocalContentPrograms,
  type PortfolioLocalContentInput,
  type LocalContentCountry,
  type ProcurementContext,
  type SupplierLocalContentInputs,
} from './supplierLocalContentEligibility';

const dir = join(import.meta.dirname, '__fixtures__');
const INPUTS = JSON.parse(readFileSync(join(dir, 'localContentGoldenInputs.json'), 'utf8')) as SupplierLocalContentInputs[];
const HASH_FILE = join(dir, 'localContentGoldenHashes.json');
const CONTEXTS: ProcurementContext[] = ['government', 'semi-government-soe', 'private-commercial'];
const TARGETS: Array<number | null> = [null, 0, 40, 100];
const sha = (s: string) => createHash('sha1').update(s).digest('hex');

function groupHash(country: LocalContentCountry, program: (typeof PROGRAMS_BY_COUNTRY)[LocalContentCountry][number], ctx: ProcurementContext): string {
  const h = createHash('sha1');
  const portfolio: PortfolioLocalContentInput[] = [];
  INPUTS.forEach((inp, i) => {
    const a = assessSupplierLocalContent(country, ctx, inp, program);
    h.update(JSON.stringify(a));
    for (const t of TARGETS) h.update(JSON.stringify(recommendLocalContentAction(a, t)) ?? 'undefined');
    portfolio.push({ supplierId: `S${i}`, spendShare: ((i * 37) % 101) / 3, assessment: a });
  });
  h.update(JSON.stringify(rollUpPortfolioLocalContent(portfolio)));
  // a second roll-up with zero and fractional shares, and a single-supplier portfolio
  h.update(JSON.stringify(rollUpPortfolioLocalContent(portfolio.map((p, i) => ({ ...p, spendShare: i % 4 === 0 ? 0 : 0.5 })))));
  h.update(JSON.stringify(rollUpPortfolioLocalContent(portfolio.slice(0, 1))));
  h.update(JSON.stringify(rollUpPortfolioLocalContent([])));
  return h.digest('hex').slice(0, 16);
}

function stackedHash(country: LocalContentCountry, ctx: ProcurementContext): string {
  const h = createHash('sha1');
  for (const inp of INPUTS) h.update(JSON.stringify(assessAllApplicableLocalContentPrograms(country, ctx, inp)));
  return h.digest('hex').slice(0, 16);
}

function mixedPortfolioHash(): string {
  const h = createHash('sha1');
  const items: PortfolioLocalContentInput[] = [];
  let n = 0;
  for (const country of Object.keys(PROGRAMS_BY_COUNTRY) as LocalContentCountry[]) {
    for (const program of PROGRAMS_BY_COUNTRY[country]) {
      INPUTS.forEach((inp, i) => {
        if ((i + n) % 9 !== 0) return;
        items.push({ supplierId: `${country}-${program}-${i}`, spendShare: ((i + n) * 13) % 47, assessment: assessSupplierLocalContent(country, CONTEXTS[(i + n) % 3]!, inp, program) });
      });
      n++;
    }
  }
  h.update(JSON.stringify(rollUpPortfolioLocalContent(items)));
  return h.digest('hex').slice(0, 16);
}

function computeAll(): Record<string, string> {
  const out: Record<string, string> = { 'MIXED-PORTFOLIO': mixedPortfolioHash() };
  for (const country of Object.keys(PROGRAMS_BY_COUNTRY) as LocalContentCountry[]) {
    for (const program of PROGRAMS_BY_COUNTRY[country]) {
      for (const ctx of CONTEXTS) out[`${country}|${program}|${ctx}`] = groupHash(country, program, ctx);
    }
    for (const ctx of CONTEXTS) out[`${country}|ALL|${ctx}`] = stackedHash(country, ctx);
  }
  return out;
}

describe('Module 08 eligibility engine: recorded-output (golden) pins', () => {
  it('fixture corpus is the expected size and deterministic', () => {
    expect(INPUTS).toHaveLength(253);
    expect(sha(JSON.stringify(assessSupplierLocalContent('SA', 'government', INPUTS[0]!)))).toBe(
      sha(JSON.stringify(assessSupplierLocalContent('SA', 'government', INPUTS[0]!))),
    );
  });
  it('every country/program/context group reproduces its recorded output hash', () => {
    const actual = computeAll();
    if (process.env.GOLDEN_UPDATE === '1') {
      writeFileSync(HASH_FILE, JSON.stringify(actual, null, 1) + '\n');
      return;
    }
    const expected = JSON.parse(readFileSync(HASH_FILE, 'utf8')) as Record<string, string>;
    expect(Object.keys(actual).sort()).toEqual(Object.keys(expected).sort());
    const changed = Object.keys(expected).filter((k) => actual[k] !== expected[k]);
    expect(changed, `changed groups: ${changed.join(', ')}`).toEqual([]);
  });
});
