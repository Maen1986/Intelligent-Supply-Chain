/** Round C #668 (RC-6): mutation-driven pins for kraljicCipsScoring -- exact scoring, coverage, borderline and flip behaviour. */
import { describe, it, expect } from 'vitest';
import { scoreItem, quadrantFor, CIPS_FACTORS } from './kraljicCipsScoring';

const RISK = ['exp', 'sdbal', 'complex', 'fin', 'safeenv', 'design', 'mfg'];
const PROFIT = ['mkt', 'spend', 'psdbal', 'peff', 'pdev'];
const rate = (ids: string[], v: number) => Object.fromEntries(ids.map((i) => [i, v]));
const all = (r: number, p: number) => ({ ...rate(RISK, r), ...rate(PROFIT, p) });

describe('quadrantFor boundary rule', () => {
  it('at-or-above the boundary counts as high on that axis', () => {
    expect(quadrantFor(50, 50, 50)).toBe('strategic');
    expect(quadrantFor(49.9, 50, 50)).toBe('leverage');
    expect(quadrantFor(50, 49.9, 50)).toBe('bottleneck');
    expect(quadrantFor(49.9, 49.9, 50)).toBe('non-critical');
  });
});

describe('scoreItem exact behaviour', () => {
  it('extremes', () => {
    expect(scoreItem(all(5, 5))).toMatchInlineSnapshot(`
      {
        "borderline": false,
        "borderlineAxes": [],
        "flipFactors": [],
        "missing": [],
        "profit": {
          "answered": 5,
          "coverage": 1,
          "maxWeighted": 25,
          "pct": 100,
          "total": 5,
          "weighted": 25,
        },
        "quadrant": "strategic",
        "risk": {
          "answered": 7,
          "coverage": 1,
          "maxWeighted": 35,
          "pct": 100,
          "total": 7,
          "weighted": 35,
        },
        "status": "scored",
        "stepsNoteAr": "تم التقييم بطريقة CIPS ذات الخطوات السبع. الأوزان والحد والهامش قيم افتراضية من آي سبلاي تشين يمكنك تغييرها.",
        "stepsNoteEn": "Scored with the CIPS seven-step method. Weights, boundary and margin are ISC defaults you can change.",
      }
    `);
    expect(scoreItem(all(1, 1))).toMatchInlineSnapshot(`
      {
        "borderline": false,
        "borderlineAxes": [],
        "flipFactors": [],
        "missing": [],
        "profit": {
          "answered": 5,
          "coverage": 1,
          "maxWeighted": 25,
          "pct": 20,
          "total": 5,
          "weighted": 5,
        },
        "quadrant": "non-critical",
        "risk": {
          "answered": 7,
          "coverage": 1,
          "maxWeighted": 35,
          "pct": 20,
          "total": 7,
          "weighted": 7,
        },
        "status": "scored",
        "stepsNoteAr": "تم التقييم بطريقة CIPS ذات الخطوات السبع. الأوزان والحد والهامش قيم افتراضية من آي سبلاي تشين يمكنك تغييرها.",
        "stepsNoteEn": "Scored with the CIPS seven-step method. Weights, boundary and margin are ISC defaults you can change.",
      }
    `);
  });
  it('nothing answered is insufficient, not a quadrant', () => {
    expect(scoreItem({})).toMatchInlineSnapshot(`
      {
        "borderline": false,
        "borderlineAxes": [],
        "flipFactors": [],
        "missing": [
          {
            "axis": "risk",
            "id": "exp",
            "label": {
              "ar": "الخبرة بالمنتج",
              "en": "Experience with the product",
            },
          },
          {
            "axis": "risk",
            "id": "sdbal",
            "label": {
              "ar": "توازن العرض والطلب",
              "en": "Supply / demand balance",
            },
          },
          {
            "axis": "risk",
            "id": "complex",
            "label": {
              "ar": "تعقيد سلسلة الإمداد",
              "en": "Supply chain complexity",
            },
          },
          {
            "axis": "risk",
            "id": "fin",
            "label": {
              "ar": "المخاطر المالية",
              "en": "Financial risks",
            },
          },
          {
            "axis": "risk",
            "id": "safeenv",
            "label": {
              "ar": "مخاطر السلامة والبيئة",
              "en": "Safety and environmental risk",
            },
          },
          {
            "axis": "risk",
            "id": "design",
            "label": {
              "ar": "نضج التصميم",
              "en": "Design maturity",
            },
          },
          {
            "axis": "risk",
            "id": "mfg",
            "label": {
              "ar": "تعقيد التصنيع",
              "en": "Manufacturing complexity",
            },
          },
          {
            "axis": "profit",
            "id": "mkt",
            "label": {
              "ar": "هيكل السوق",
              "en": "Structure of the market",
            },
          },
          {
            "axis": "profit",
            "id": "spend",
            "label": {
              "ar": "قيمة الإنفاق",
              "en": "Value of spend",
            },
          },
          {
            "axis": "profit",
            "id": "psdbal",
            "label": {
              "ar": "توازن العرض والطلب",
              "en": "Supply / demand balance",
            },
          },
          {
            "axis": "profit",
            "id": "peff",
            "label": {
              "ar": "كفاءة عملية الشراء",
              "en": "Efficiency of the procurement process",
            },
          },
          {
            "axis": "profit",
            "id": "pdev",
            "label": {
              "ar": "تطوير عملية الشراء",
              "en": "Development of the procurement process",
            },
          },
        ],
        "profit": {
          "answered": 0,
          "coverage": 0,
          "maxWeighted": 0,
          "pct": 0,
          "total": 5,
          "weighted": 0,
        },
        "quadrant": null,
        "risk": {
          "answered": 0,
          "coverage": 0,
          "maxWeighted": 0,
          "pct": 0,
          "total": 7,
          "weighted": 0,
        },
        "status": "insufficient",
        "stepsNoteAr": "عدد العوامل المُجاب عنها غير كافٍ (يلزم 60% على الأقل لكل محور). آي سبلاي تشين لا تخمّن.",
        "stepsNoteEn": "Not enough factors answered (need at least 60% on each axis). ISC does not guess.",
      }
    `);
  });
  it('coverage exactly at the minimum is scored; just below is insufficient', () => {
    const justEnough = { ...rate(RISK.slice(0, 5), 4), ...rate(PROFIT.slice(0, 3), 4) }; // risk 5/7=71%, profit 3/5=60%
    expect(scoreItem(justEnough).status).toBe('scored');
    const tooFew = { ...rate(RISK.slice(0, 4), 4), ...rate(PROFIT, 4) }; // risk 4/7=57% < 60%
    expect(scoreItem(tooFew).status).toBe('insufficient');
    expect(scoreItem(tooFew, { minCoverage: 0.5 }).status).toBe('scored');
  });
  it('borderline flags: exactly one margin from the boundary is borderline, beyond is not', () => {
    expect(scoreItem(all(2.8, 5), { borderlineMargin: 5 })).toMatchInlineSnapshot(`
      {
        "borderline": false,
        "borderlineAxes": [],
        "flipFactors": [],
        "missing": [],
        "profit": {
          "answered": 5,
          "coverage": 1,
          "maxWeighted": 25,
          "pct": 100,
          "total": 5,
          "weighted": 25,
        },
        "quadrant": "strategic",
        "risk": {
          "answered": 7,
          "coverage": 1,
          "maxWeighted": 35,
          "pct": 56,
          "total": 7,
          "weighted": 19.6,
        },
        "status": "scored",
        "stepsNoteAr": "تم التقييم بطريقة CIPS ذات الخطوات السبع. الأوزان والحد والهامش قيم افتراضية من آي سبلاي تشين يمكنك تغييرها.",
        "stepsNoteEn": "Scored with the CIPS seven-step method. Weights, boundary and margin are ISC defaults you can change.",
      }
    `);
    expect(scoreItem(all(2.6, 2.6), { borderlineMargin: 5 })).toMatchInlineSnapshot(`
      {
        "borderline": true,
        "borderlineAxes": [
          "risk",
          "profit",
        ],
        "flipFactors": [],
        "missing": [],
        "profit": {
          "answered": 5,
          "coverage": 1,
          "maxWeighted": 25,
          "pct": 52,
          "total": 5,
          "weighted": 13,
        },
        "quadrant": "strategic",
        "risk": {
          "answered": 7,
          "coverage": 1,
          "maxWeighted": 35,
          "pct": 52,
          "total": 7,
          "weighted": 18.2,
        },
        "status": "scored",
        "stepsNoteAr": "تم التقييم بطريقة CIPS ذات الخطوات السبع. الأوزان والحد والهامش قيم افتراضية من آي سبلاي تشين يمكنك تغييرها.",
        "stepsNoteEn": "Scored with the CIPS seven-step method. Weights, boundary and margin are ISC defaults you can change.",
      }
    `);
    expect(scoreItem(all(4, 4), { borderlineMargin: 5 })).toMatchInlineSnapshot(`
      {
        "borderline": false,
        "borderlineAxes": [],
        "flipFactors": [],
        "missing": [],
        "profit": {
          "answered": 5,
          "coverage": 1,
          "maxWeighted": 25,
          "pct": 80,
          "total": 5,
          "weighted": 20,
        },
        "quadrant": "strategic",
        "risk": {
          "answered": 7,
          "coverage": 1,
          "maxWeighted": 35,
          "pct": 80,
          "total": 7,
          "weighted": 28,
        },
        "status": "scored",
        "stepsNoteAr": "تم التقييم بطريقة CIPS ذات الخطوات السبع. الأوزان والحد والهامش قيم افتراضية من آي سبلاي تشين يمكنك تغييرها.",
        "stepsNoteEn": "Scored with the CIPS seven-step method. Weights, boundary and margin are ISC defaults you can change.",
      }
    `);
  });
  it('flip factors list the factors whose weight change would move the item, once each', () => {
    const ratings = { ...all(3, 3), exp: 5, mkt: 1 };
    expect(scoreItem(ratings, { boundaryPct: 52 })).toMatchInlineSnapshot(`
      {
        "borderline": true,
        "borderlineAxes": [
          "profit",
        ],
        "flipFactors": [
          {
            "flipsTo": "bottleneck",
            "id": "mkt",
            "label": {
              "ar": "هيكل السوق",
              "en": "Structure of the market",
            },
          },
          {
            "flipsTo": "bottleneck",
            "id": "spend",
            "label": {
              "ar": "قيمة الإنفاق",
              "en": "Value of spend",
            },
          },
          {
            "flipsTo": "bottleneck",
            "id": "psdbal",
            "label": {
              "ar": "توازن العرض والطلب",
              "en": "Supply / demand balance",
            },
          },
          {
            "flipsTo": "bottleneck",
            "id": "peff",
            "label": {
              "ar": "كفاءة عملية الشراء",
              "en": "Efficiency of the procurement process",
            },
          },
          {
            "flipsTo": "bottleneck",
            "id": "pdev",
            "label": {
              "ar": "تطوير عملية الشراء",
              "en": "Development of the procurement process",
            },
          },
        ],
        "missing": [],
        "profit": {
          "answered": 5,
          "coverage": 1,
          "maxWeighted": 25,
          "pct": 52,
          "total": 5,
          "weighted": 13,
        },
        "quadrant": "strategic",
        "risk": {
          "answered": 7,
          "coverage": 1,
          "maxWeighted": 35,
          "pct": 65.7,
          "total": 7,
          "weighted": 23,
        },
        "status": "scored",
        "stepsNoteAr": "تم التقييم بطريقة CIPS ذات الخطوات السبع. الأوزان والحد والهامش قيم افتراضية من آي سبلاي تشين يمكنك تغييرها.",
        "stepsNoteEn": "Scored with the CIPS seven-step method. Weights, boundary and margin are ISC defaults you can change.",
      }
    `);
  });
  it('custom weights and zero-weight factors are honoured', () => {
    expect(scoreItem(all(5, 5), { weights: { exp: 0, sdbal: 0 } }).risk.maxWeighted).toBe(25);
    expect(scoreItem(all(3, 3), { weights: { exp: 3 } }).risk.weighted).toBe(27);
  });
  it('out-of-range or non-numeric ratings count as unanswered', () => {
    const r = scoreItem({ ...all(4, 4), exp: 0, sdbal: 6, complex: null, fin: undefined });
    expect(r.missing.map((m) => m.id).sort()).toEqual(['complex', 'exp', 'fin', 'sdbal']);
  });
  it('factor list is the CIPS 7 + 5', () => { expect(CIPS_FACTORS).toHaveLength(12); });
});
