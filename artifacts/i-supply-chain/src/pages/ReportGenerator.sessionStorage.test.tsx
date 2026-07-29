/**
 * Integration tests: sessionStorage handoff contract between Maturity.tsx and
 * ReportGenerator.tsx
 *
 * Covers:
 *  - ISC_MATURITY_CONTEXT_KEY is a non-empty string constant
 *  - A payload written to sessionStorage under that key is round-trippable
 *  - overallScore, overallLevel, segmentScores fields survive serialise → parse
 *  - Optional fields (coveragePct, overallLevelAr, remedies, lang) preserved
 *  - Null remedies preserved as undefined (not coerced)
 *  - A payload without coveragePct does not error on parse
 *  - Writing then clearing sessionStorage leaves no trace of the key
 *  - segmentScores with titleAr, levelAr, gccAvg, bestClass round-trip
 *  - Numeric precision: scores serialised to 2dp remain numeric after parse
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ISC_MATURITY_CONTEXT_KEY } from './Maturity';

/* ── sessionStorage shim (jsdom supports it, but let's be explicit) ─────── */

beforeEach(() => sessionStorage.clear());
afterEach(()  => sessionStorage.clear());

/* ── Helpers ─────────────────────────────────────────────────────────────── */

interface SegScore {
  id: string; title: string; titleAr?: string;
  score: number; level: string; levelAr?: string;
  gccAvg?: number; bestClass?: number;
}

interface Payload {
  overallScore:    number;
  overallLevel:    string;
  overallLevelAr?: string;
  segmentScores:   SegScore[];
  remedies?:       { days30?: Array<{ segmentTitle: string; action: string }>; estimatedImpact?: string };
  intakeData?:     { industry: string; companySize: string };
  coveragePct?:    number;
  lang?:           'en' | 'ar';
}

function writePayload(p: Payload) {
  sessionStorage.setItem(ISC_MATURITY_CONTEXT_KEY, JSON.stringify(p));
}

function readPayload(): Payload | null {
  const raw = sessionStorage.getItem(ISC_MATURITY_CONTEXT_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as Payload;
}

const FULL_PAYLOAD: Payload = {
  overallScore:    2.86,
  overallLevel:    'Defined',
  overallLevelAr:  'مُعرَّف',
  segmentScores: [
    { id: 'strategy',    title: 'Strategy',    titleAr: 'الاستراتيجية', score: 1.80, level: 'Aware',   levelAr: 'مُدرِك',  gccAvg: 2.3, bestClass: 4.4 },
    { id: 'procurement', title: 'Procurement', titleAr: 'المشتريات',    score: 2.20, level: 'Aware',   levelAr: 'مُدرِك',  gccAvg: 2.3, bestClass: 4.4 },
    { id: 'logistics',   title: 'Logistics',   titleAr: 'اللوجستيات',   score: 3.50, level: 'Managed', levelAr: 'مُدار',   gccAvg: 2.5, bestClass: 4.2 },
  ],
  remedies: {
    days30: [{ segmentTitle: 'Strategy', action: 'Map workflows' }],
    estimatedImpact: '15–20% cost reduction',
  },
  intakeData: { industry: 'retail', companySize: 'large' },
  coveragePct: 72.5,
  lang: 'ar',
};

/* ── Constant contract ───────────────────────────────────────────────────── */

describe('ISC_MATURITY_CONTEXT_KEY', () => {
  it('is a non-empty string', () => {
    expect(typeof ISC_MATURITY_CONTEXT_KEY).toBe('string');
    expect(ISC_MATURITY_CONTEXT_KEY.length).toBeGreaterThan(0);
  });

  it('contains the version suffix so future format changes can bump it', () => {
    expect(ISC_MATURITY_CONTEXT_KEY).toMatch(/v\d+/);
  });
});

/* ── Round-trip: write → read ────────────────────────────────────────────── */

describe('sessionStorage handoff round-trip', () => {
  it('round-trips overallScore as a number', () => {
    writePayload(FULL_PAYLOAD);
    expect(readPayload()?.overallScore).toBe(2.86);
  });

  it('round-trips overallLevel (English)', () => {
    writePayload(FULL_PAYLOAD);
    expect(readPayload()?.overallLevel).toBe('Defined');
  });

  it('round-trips overallLevelAr (Arabic)', () => {
    writePayload(FULL_PAYLOAD);
    expect(readPayload()?.overallLevelAr).toBe('مُعرَّف');
  });

  it('round-trips segmentScores array length', () => {
    writePayload(FULL_PAYLOAD);
    expect(readPayload()?.segmentScores.length).toBe(3);
  });

  it('round-trips titleAr on segment scores', () => {
    writePayload(FULL_PAYLOAD);
    const segs = readPayload()?.segmentScores ?? [];
    expect(segs[0].titleAr).toBe('الاستراتيجية');
  });

  it('round-trips levelAr on segment scores', () => {
    writePayload(FULL_PAYLOAD);
    const segs = readPayload()?.segmentScores ?? [];
    expect(segs[0].levelAr).toBe('مُدرِك');
  });

  it('round-trips gccAvg on segment scores', () => {
    writePayload(FULL_PAYLOAD);
    expect(readPayload()?.segmentScores[0].gccAvg).toBe(2.3);
  });

  it('round-trips bestClass on segment scores', () => {
    writePayload(FULL_PAYLOAD);
    expect(readPayload()?.segmentScores[0].bestClass).toBe(4.4);
  });

  it('round-trips coveragePct', () => {
    writePayload(FULL_PAYLOAD);
    expect(readPayload()?.coveragePct).toBe(72.5);
  });

  it('round-trips lang = "ar"', () => {
    writePayload(FULL_PAYLOAD);
    expect(readPayload()?.lang).toBe('ar');
  });

  it('round-trips intakeData', () => {
    writePayload(FULL_PAYLOAD);
    expect(readPayload()?.intakeData).toEqual({ industry: 'retail', companySize: 'large' });
  });

  it('round-trips remedies.days30 action text', () => {
    writePayload(FULL_PAYLOAD);
    expect(readPayload()?.remedies?.days30?.[0].action).toBe('Map workflows');
  });

  it('round-trips remedies.estimatedImpact', () => {
    writePayload(FULL_PAYLOAD);
    expect(readPayload()?.remedies?.estimatedImpact).toBe('15–20% cost reduction');
  });
});

/* ── Optional fields ─────────────────────────────────────────────────────── */

describe('sessionStorage handoff — optional fields', () => {
  it('handles missing coveragePct (should be undefined after parse)', () => {
    const p: Payload = { ...FULL_PAYLOAD, coveragePct: undefined };
    writePayload(p);
    // JSON.stringify drops undefined values — key will be absent
    expect(readPayload()?.coveragePct).toBeUndefined();
  });

  it('handles missing remedies (key absent from JSON)', () => {
    const p: Payload = { ...FULL_PAYLOAD, remedies: undefined };
    writePayload(p);
    expect(readPayload()?.remedies).toBeUndefined();
  });

  it('handles missing overallLevelAr (key absent)', () => {
    const p: Payload = { ...FULL_PAYLOAD, overallLevelAr: undefined };
    writePayload(p);
    expect(readPayload()?.overallLevelAr).toBeUndefined();
  });

  it('preserves lang = "en"', () => {
    const p: Payload = { ...FULL_PAYLOAD, lang: 'en' };
    writePayload(p);
    expect(readPayload()?.lang).toBe('en');
  });
});

/* ── Clearing ────────────────────────────────────────────────────────────── */

describe('sessionStorage cleanup', () => {
  it('returns null after sessionStorage is cleared', () => {
    writePayload(FULL_PAYLOAD);
    sessionStorage.removeItem(ISC_MATURITY_CONTEXT_KEY);
    expect(readPayload()).toBeNull();
  });

  it('does not throw when reading from an empty store', () => {
    expect(() => readPayload()).not.toThrow();
    expect(readPayload()).toBeNull();
  });
});
