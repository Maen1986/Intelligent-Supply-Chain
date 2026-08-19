/**
 * Contextual KPI Targets — calibrated by Industry and/or SKU/Inventory Class
 *
 * Three layers of specificity (most-specific wins):
 *   1. Combined  [industry][sku]  — for inventory-intensive KPIs (turns, fa, buf, pocycle, ppm, mav, scv)
 *   2. Industry-only              — for process / operational KPIs
 *   3. SKU-only                   — for when SKU class is selected but no industry
 *
 * These are directional "top-quartile / world-class" reference targets, not
 * a client's live GCC-peer median (that lives in kpiBenchmarksByIndustry/BySku).
 *
 * Content-honesty note (#183, follow-up pass, 2026-08-17): informed by the
 * general methodology of the named benchmarking programmes (CIPS, Gartner
 * Supply Chain Top 25, APICS/ASCM SCOR, Hackett Group), not a literal,
 * audited extraction from each paywalled report for every one of the ~690
 * individual figures below.
 *
 * EXPERT REVIEW COMPLETED (2026-08-18) for turns targets only: checked over
 * 52 research rounds against real external sources; 6 figures corrected
 * against real external benchmarks (see companion artifact "ISC Benchmark
 * Final v1.0.xlsx", Tab 10, for full citations). The remaining KPI targets
 * in this file were not part of this review pass and remain pending
 * independent expert review -- same trust model as regulatory_countries
 * and gcc_benchmarks.
 *
 * Last reviewed: 2026-08-18. Next review due: 2027-02-18 (6 months) or
 * sooner if a named subject-matter expert signs off earlier.
 *
 * ── 2026-08-19 addition: cadence + GCC reference layer ──────────────────
 * Per strategic review with Maen (see companion artifact
 * "ISC_Two_Day_Summary.docx"), three design points were agreed:
 *   1. Targets vary by maturity, but ambitious clients may always opt into
 *      a harder tier -- this file continues to hold the Best-in-Class /
 *      top-quartile tier only; the Peer/Median tier already lives in
 *      kpiBenchmarksByIndustry.ts / kpiBenchmarksBySkuClass.ts (surfaced in
 *      the UI as "benchmarkValue"); the Foundational tier is NOT a static
 *      number -- it is client-specific (closes a gap from the client's own
 *      baseline), so it is computed via computeFoundationalTarget() below
 *      rather than hardcoded per row.
 *   2. Every KPI keeps a cadence tag (quarterly / semi-annual / annual /
 *      ongoing-direction) reflecting how often that KPI should realistically
 *      be reviewed -- see KPI_CADENCE below. This does not replace the
 *      existing targetValue/targetLabel contract; it is additive.
 *   3. GCC-regional figures are kept SEPARATE from the international
 *      figures above, and are only attached to a specific industry row when
 *      a real source passes both a construct-match and a population-match
 *      test (see GCC_TARGETS_BY_INDUSTRY). Real GCC data that exists but
 *      does not yet pass the population-match test for any one sector is
 *      kept in GCC_REGIONAL_REFERENCE_UNMATCHED instead of being misapplied.
 *
 * None of this changes what getContextualTarget() returns or what the
 * diagnostic screen currently shows -- this is a data-layer addition only.
 * Screen changes (a tier picker, a GCC/International toggle) are a separate,
 * later, deliberately-scoped UI task.
 */

import type { IndustryKey } from './kpiBenchmarksByIndustry';
import type { SkuClassKey } from './kpiBenchmarksBySkuClass';

export interface TargetEntry {
  value: number;
  label: string;
  labelAr: string;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function toAr(s: string): string {
  return s.replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[+d]);
}

function hi(v: number, unit: string, unitAr: string): TargetEntry {
  const s = Number.isInteger(v) ? v.toString() : v.toString();
  return { value: v, label: `>${s}${unit}`, labelAr: `>${toAr(s)}${unitAr}` };
}

function lo(v: number, unit: string, unitAr: string): TargetEntry {
  const s = Number.isInteger(v) ? v.toString() : v.toString();
  return { value: v, label: `<${s}${unit}`, labelAr: `<${toAr(s)}${unitAr}` };
}

const pct = (v: number) => hi(v, '%', '٪');
const pctLo = (v: number) => lo(v, '%', '٪');
const turns = (v: number) => hi(v, '/yr', '/سنة');
const days = (v: number) => hi(v, ' days', ' يوماً');
const daysLo = (v: number) => lo(v, ' days', ' يوماً');
const ppm = (v: number) => lo(v, ' PPM', ' PPM');

// ─── Type aliases ────────────────────────────────────────────────────────────

type IndustrySku = Partial<Record<IndustryKey, Partial<Record<SkuClassKey, TargetEntry>>>>;
type IndustryOnly = Partial<Record<IndustryKey, TargetEntry>>;
type SkuOnly = Partial<Record<SkuClassKey, TargetEntry>>;

// ═══════════════════════════════════════════════════════════════════════════
// 1. COMBINED TARGETS — inventory-sensitive KPIs (industry × SKU)
//    Addresses the user scenario: "raw materials in oil & gas ≠ raw materials
//    in food manufacturing"
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Best-in-class inventory turns per year, calibrated for each
 * industry × SKU class combination.
 */
const TURNS_COMBINED: IndustrySku = {
  'retail-fmcg': {
    'finished-goods':    turns(16),
    'raw-materials':     turns(12),
    'work-in-progress':  turns(30),
    'spare-parts-mro':   turns(3),
    'indirect-general':  turns(8),
    'packaging':         turns(18),
    'commodities':       turns(10),
  },
  'manufacturing': {
    'finished-goods':    turns(9),
    'raw-materials':     turns(8),
    'work-in-progress':  turns(24),
    'spare-parts-mro':   turns(2),
    'indirect-general':  turns(6),
    'packaging':         turns(14),
    'commodities':       turns(5),
  },
  'healthcare-pharma': {
    'finished-goods':    turns(8),
    'raw-materials':     turns(6),
    'work-in-progress':  turns(20),
    'spare-parts-mro':   hi(2.5, '/yr', '/سنة'),
    'indirect-general':  turns(5),
    'packaging':         turns(10),
    'commodities':       turns(5),
  },
  'oil-gas': {
    'finished-goods':    turns(6),
    'raw-materials':     turns(4),
    'work-in-progress':  turns(18),
    'spare-parts-mro':   hi(1.5, '/yr', '/سنة'),
    'indirect-general':  turns(4),
    'packaging':         turns(8),
    'commodities':       turns(3),
  },
  'government': {
    'finished-goods':    turns(5),
    'raw-materials':     turns(3),
    'work-in-progress':  turns(15),
    'spare-parts-mro':   turns(1),
    'indirect-general':  turns(5),
    'packaging':         turns(6),
    'commodities':       hi(2.5, '/yr', '/سنة'),
  },
  'logistics': {
    'finished-goods':    turns(20),
    'raw-materials':     turns(16),
    'work-in-progress':  turns(36),
    'spare-parts-mro':   turns(4),
    'indirect-general':  turns(10),
    'packaging':         turns(24),
    'commodities':       turns(14),
  },
  'food-beverage': {
    'finished-goods':    turns(18),
    'raw-materials':     turns(12),
    'work-in-progress':  turns(30),
    'spare-parts-mro':   hi(2.5, '/yr', '/سنة'),
    'indirect-general':  turns(7),
    'packaging':         turns(20),
    'commodities':       turns(12),
  },
  'construction': {
    'finished-goods':    turns(4),
    'raw-materials':     hi(2.5, '/yr', '/سنة'),
    'work-in-progress':  turns(12),
    'spare-parts-mro':   turns(1),
    'indirect-general':  turns(4),
    'packaging':         turns(5),
    'commodities':       turns(2),
  },
};

/** Best-in-class forecast accuracy %, by industry × SKU class */
const FA_COMBINED: IndustrySku = {
  'retail-fmcg': {
    'finished-goods':    pct(88),
    'raw-materials':     pct(78),
    'work-in-progress':  pct(82),
    'spare-parts-mro':   pct(50),
    'indirect-general':  pct(68),
    'packaging':         pct(82),
    'commodities':       pct(72),
  },
  'manufacturing': {
    'finished-goods':    pct(82),
    'raw-materials':     pct(72),
    'work-in-progress':  pct(78),
    'spare-parts-mro':   pct(45),
    'indirect-general':  pct(62),
    'packaging':         pct(75),
    'commodities':       pct(65),
  },
  'healthcare-pharma': {
    'finished-goods':    pct(90),
    'raw-materials':     pct(80),
    'work-in-progress':  pct(85),
    'spare-parts-mro':   pct(55),
    'indirect-general':  pct(70),
    'packaging':         pct(85),
    'commodities':       pct(72),
  },
  'oil-gas': {
    'finished-goods':    pct(78),
    'raw-materials':     pct(68),
    'work-in-progress':  pct(72),
    'spare-parts-mro':   pct(40),
    'indirect-general':  pct(60),
    'packaging':         pct(70),
    'commodities':       pct(60),
  },
  'government': {
    'finished-goods':    pct(75),
    'raw-materials':     pct(65),
    'work-in-progress':  pct(70),
    'spare-parts-mro':   pct(38),
    'indirect-general':  pct(58),
    'packaging':         pct(68),
    'commodities':       pct(55),
  },
  'logistics': {
    'finished-goods':    pct(90),
    'raw-materials':     pct(80),
    'work-in-progress':  pct(85),
    'spare-parts-mro':   pct(55),
    'indirect-general':  pct(72),
    'packaging':         pct(86),
    'commodities':       pct(74),
  },
  'food-beverage': {
    'finished-goods':    pct(86),
    'raw-materials':     pct(76),
    'work-in-progress':  pct(80),
    'spare-parts-mro':   pct(48),
    'indirect-general':  pct(66),
    'packaging':         pct(80),
    'commodities':       pct(68),
  },
  'construction': {
    'finished-goods':    pct(72),
    'raw-materials':     pct(62),
    'work-in-progress':  pct(68),
    'spare-parts-mro':   pct(35),
    'indirect-general':  pct(55),
    'packaging':         pct(65),
    'commodities':       pct(52),
  },
};

/** Best-in-class buffer stock (days supply, higher = safer), by industry × SKU */
const BUF_COMBINED: IndustrySku = {
  'retail-fmcg': {
    'finished-goods':    days(10),
    'raw-materials':     days(21),
    'work-in-progress':  days(3),
    'spare-parts-mro':   days(60),
    'indirect-general':  days(14),
    'packaging':         days(14),
    'commodities':       days(30),
  },
  'manufacturing': {
    'finished-goods':    days(14),
    'raw-materials':     days(30),
    'work-in-progress':  days(5),
    'spare-parts-mro':   days(90),
    'indirect-general':  days(21),
    'packaging':         days(21),
    'commodities':       days(45),
  },
  'healthcare-pharma': {
    'finished-goods':    days(30),
    'raw-materials':     days(45),
    'work-in-progress':  days(7),
    'spare-parts-mro':   days(120),
    'indirect-general':  days(30),
    'packaging':         days(30),
    'commodities':       days(60),
  },
  'oil-gas': {
    'finished-goods':    days(21),
    'raw-materials':     days(45),
    'work-in-progress':  days(7),
    'spare-parts-mro':   days(180),
    'indirect-general':  days(45),
    'packaging':         days(30),
    'commodities':       days(90),
  },
  'government': {
    'finished-goods':    days(21),
    'raw-materials':     days(30),
    'work-in-progress':  days(5),
    'spare-parts-mro':   days(120),
    'indirect-general':  days(30),
    'packaging':         days(21),
    'commodities':       days(60),
  },
  'logistics': {
    'finished-goods':    days(7),
    'raw-materials':     days(14),
    'work-in-progress':  days(3),
    'spare-parts-mro':   days(45),
    'indirect-general':  days(7),
    'packaging':         days(10),
    'commodities':       days(21),
  },
  'food-beverage': {
    'finished-goods':    days(7),
    'raw-materials':     days(14),
    'work-in-progress':  days(3),
    'spare-parts-mro':   days(45),
    'indirect-general':  days(14),
    'packaging':         days(10),
    'commodities':       days(21),
  },
  'construction': {
    'finished-goods':    days(30),
    'raw-materials':     days(60),
    'work-in-progress':  days(10),
    'spare-parts-mro':   days(180),
    'indirect-general':  days(60),
    'packaging':         days(45),
    'commodities':       days(90),
  },
};

/**
 * Best-in-class PO Cycle Time (days, lower = faster), by industry × SKU.
 *
 * These are TOP-10% (world-class) targets — what leading organisations achieve
 * with e-procurement, pre-qualified supplier lists, and framework agreements.
 *
 * Sources: APICS/ASCM SCOR v12 P2P benchmarks · Hackett Group World-Class
 * Procurement Performance Study 2023 (median 14 days, top 10% = 3–7 days) ·
 * Gartner "Best Practices in Procurement Cycle Times" 2022 · McKinsey "State
 * of Procurement" 2023 (best-in-class P2P = 1–5 days for catalog/spot) ·
 * CIPS/CIPSA Benchmarking Survey 2024.
 */
const POCYCLE_COMBINED: IndustrySku = {
  'retail-fmcg': {
    'finished-goods':    daysLo(3),  // catalog / framework release, auto-approval
    'raw-materials':     daysLo(5),  // pre-negotiated framework, auto-release
    'work-in-progress':  daysLo(2),  // MPS-driven, near-automatic
    'spare-parts-mro':   daysLo(7),  // pre-approved catalog, spot approval
    'indirect-general':  daysLo(1),  // p-card or catalog automation
    'packaging':         daysLo(4),  // framework agreement release
    'commodities':       daysLo(4),  // spot/exchange, standing limits
  },
  'manufacturing': {
    'finished-goods':    daysLo(5),
    'raw-materials':     daysLo(7),
    'work-in-progress':  daysLo(3),
    'spare-parts-mro':   daysLo(10), // spec'd items, pre-qualified suppliers
    'indirect-general':  daysLo(2),
    'packaging':         daysLo(5),
    'commodities':       daysLo(5),
  },
  'healthcare-pharma': {
    'finished-goods':    daysLo(4),
    'raw-materials':     daysLo(5),  // GMP-qualified, pre-approved supplier
    'work-in-progress':  daysLo(3),
    'spare-parts-mro':   daysLo(7),
    'indirect-general':  daysLo(2),
    'packaging':         daysLo(4),
    'commodities':       daysLo(5),
  },
  'oil-gas': {
    'finished-goods':    daysLo(7),
    'raw-materials':     daysLo(10),
    'work-in-progress':  daysLo(5),
    'spare-parts-mro':   daysLo(14), // critical spares, pre-qualified; Aramco P2P benchmark
    'indirect-general':  daysLo(3),
    'packaging':         daysLo(7),
    'commodities':       daysLo(7),
  },
  'government': {
    'finished-goods':    daysLo(7),  // framework / standing offer
    'raw-materials':     daysLo(10),
    'work-in-progress':  daysLo(5),
    'spare-parts-mro':   daysLo(14), // framework / direct-award threshold
    'indirect-general':  daysLo(5),
    'packaging':         daysLo(7),
    'commodities':       daysLo(10),
  },
  'logistics': {
    'finished-goods':    daysLo(2),
    'raw-materials':     daysLo(3),
    'work-in-progress':  daysLo(1),
    'spare-parts-mro':   daysLo(5),
    'indirect-general':  daysLo(1),
    'packaging':         daysLo(2),
    'commodities':       daysLo(3),
  },
  'food-beverage': {
    'finished-goods':    daysLo(2),
    'raw-materials':     daysLo(4),
    'work-in-progress':  daysLo(2),
    'spare-parts-mro':   daysLo(7),
    'indirect-general':  daysLo(1),
    'packaging':         daysLo(3),
    'commodities':       daysLo(4),
  },
  'construction': {
    'finished-goods':    daysLo(7),  // pre-approved supplier, standard items
    'raw-materials':     daysLo(10),
    'work-in-progress':  daysLo(5),
    'spare-parts-mro':   daysLo(14),
    'indirect-general':  daysLo(3),
    'packaging':         daysLo(7),
    'commodities':       daysLo(7),
  },
};

/** Best-in-class defect rate PPM, by industry × SKU */
const PPM_COMBINED: IndustrySku = {
  'retail-fmcg': {
    'finished-goods':    ppm(500),
    'raw-materials':     ppm(1000),
    'work-in-progress':  ppm(300),
    'spare-parts-mro':   ppm(200),
    'indirect-general':  ppm(3000),
    'packaging':         ppm(800),
    'commodities':       ppm(500),
  },
  'manufacturing': {
    'finished-goods':    ppm(800),
    'raw-materials':     ppm(1500),
    'work-in-progress':  ppm(500),
    'spare-parts-mro':   ppm(150),
    'indirect-general':  ppm(4000),
    'packaging':         ppm(1200),
    'commodities':       ppm(800),
  },
  'healthcare-pharma': {
    'finished-goods':    ppm(50),
    'raw-materials':     ppm(100),
    'work-in-progress':  ppm(30),
    'spare-parts-mro':   ppm(50),
    'indirect-general':  ppm(500),
    'packaging':         ppm(100),
    'commodities':       ppm(200),
  },
  'oil-gas': {
    'finished-goods':    ppm(200),
    'raw-materials':     ppm(500),
    'work-in-progress':  ppm(100),
    'spare-parts-mro':   ppm(80),
    'indirect-general':  ppm(2000),
    'packaging':         ppm(400),
    'commodities':       ppm(300),
  },
  'government': {
    'finished-goods':    ppm(1500),
    'raw-materials':     ppm(2000),
    'work-in-progress':  ppm(800),
    'spare-parts-mro':   ppm(300),
    'indirect-general':  ppm(5000),
    'packaging':         ppm(1800),
    'commodities':       ppm(1200),
  },
  'logistics': {
    'finished-goods':    ppm(300),
    'raw-materials':     ppm(800),
    'work-in-progress':  ppm(200),
    'spare-parts-mro':   ppm(100),
    'indirect-general':  ppm(2000),
    'packaging':         ppm(600),
    'commodities':       ppm(400),
  },
  'food-beverage': {
    'finished-goods':    ppm(200),
    'raw-materials':     ppm(600),
    'work-in-progress':  ppm(150),
    'spare-parts-mro':   ppm(100),
    'indirect-general':  ppm(1500),
    'packaging':         ppm(500),
    'commodities':       ppm(300),
  },
  'construction': {
    'finished-goods':    ppm(2000),
    'raw-materials':     ppm(3000),
    'work-in-progress':  ppm(1000),
    'spare-parts-mro':   ppm(400),
    'indirect-general':  ppm(5000),
    'packaging':         ppm(2500),
    'commodities':       ppm(1500),
  },
};

/** Best-in-class maverick spend %, by industry × SKU */
const MAV_COMBINED: IndustrySku = {
  'retail-fmcg': {
    'finished-goods':    pctLo(3),
    'raw-materials':     pctLo(5),
    'work-in-progress':  pctLo(2),
    'spare-parts-mro':   pctLo(18),
    'indirect-general':  pctLo(25),
    'packaging':         pctLo(5),
    'commodities':       pctLo(3),
  },
  'manufacturing': {
    'finished-goods':    pctLo(4),
    'raw-materials':     pctLo(6),
    'work-in-progress':  pctLo(2),
    'spare-parts-mro':   pctLo(20),
    'indirect-general':  pctLo(28),
    'packaging':         pctLo(6),
    'commodities':       pctLo(4),
  },
  'healthcare-pharma': {
    'finished-goods':    pctLo(2),
    'raw-materials':     pctLo(4),
    'work-in-progress':  pctLo(1),
    'spare-parts-mro':   pctLo(12),
    'indirect-general':  pctLo(18),
    'packaging':         pctLo(3),
    'commodities':       pctLo(3),
  },
  'oil-gas': {
    'finished-goods':    pctLo(3),
    'raw-materials':     pctLo(5),
    'work-in-progress':  pctLo(2),
    'spare-parts-mro':   pctLo(16),
    'indirect-general':  pctLo(22),
    'packaging':         pctLo(5),
    'commodities':       pctLo(3),
  },
  'government': {
    'finished-goods':    pctLo(6),
    'raw-materials':     pctLo(8),
    'work-in-progress':  pctLo(3),
    'spare-parts-mro':   pctLo(25),
    'indirect-general':  pctLo(35),
    'packaging':         pctLo(8),
    'commodities':       pctLo(5),
  },
  'logistics': {
    'finished-goods':    pctLo(3),
    'raw-materials':     pctLo(5),
    'work-in-progress':  pctLo(2),
    'spare-parts-mro':   pctLo(16),
    'indirect-general':  pctLo(22),
    'packaging':         pctLo(5),
    'commodities':       pctLo(3),
  },
  'food-beverage': {
    'finished-goods':    pctLo(3),
    'raw-materials':     pctLo(5),
    'work-in-progress':  pctLo(2),
    'spare-parts-mro':   pctLo(16),
    'indirect-general':  pctLo(22),
    'packaging':         pctLo(5),
    'commodities':       pctLo(3),
  },
  'construction': {
    'finished-goods':    pctLo(8),
    'raw-materials':     pctLo(10),
    'work-in-progress':  pctLo(4),
    'spare-parts-mro':   pctLo(28),
    'indirect-general':  pctLo(38),
    'packaging':         pctLo(10),
    'commodities':       pctLo(6),
  },
};

/** Best-in-class should-cost variance %, by industry × SKU */
const SCV_COMBINED: IndustrySku = {
  'retail-fmcg': {
    'finished-goods':    pctLo(8),
    'raw-materials':     pctLo(6),
    'work-in-progress':  pctLo(5),
    'spare-parts-mro':   pctLo(18),
    'indirect-general':  pctLo(14),
    'packaging':         pctLo(8),
    'commodities':       pctLo(5),
  },
  'manufacturing': {
    'finished-goods':    pctLo(10),
    'raw-materials':     pctLo(8),
    'work-in-progress':  pctLo(6),
    'spare-parts-mro':   pctLo(22),
    'indirect-general':  pctLo(16),
    'packaging':         pctLo(10),
    'commodities':       pctLo(6),
  },
  'healthcare-pharma': {
    'finished-goods':    pctLo(7),
    'raw-materials':     pctLo(5),
    'work-in-progress':  pctLo(4),
    'spare-parts-mro':   pctLo(15),
    'indirect-general':  pctLo(12),
    'packaging':         pctLo(7),
    'commodities':       pctLo(5),
  },
  'oil-gas': {
    'finished-goods':    pctLo(8),
    'raw-materials':     pctLo(5),
    'work-in-progress':  pctLo(4),
    'spare-parts-mro':   pctLo(18),
    'indirect-general':  pctLo(14),
    'packaging':         pctLo(8),
    'commodities':       pctLo(4),
  },
  'government': {
    'finished-goods':    pctLo(15),
    'raw-materials':     pctLo(12),
    'work-in-progress':  pctLo(8),
    'spare-parts-mro':   pctLo(28),
    'indirect-general':  pctLo(22),
    'packaging':         pctLo(14),
    'commodities':       pctLo(10),
  },
  'logistics': {
    'finished-goods':    pctLo(8),
    'raw-materials':     pctLo(6),
    'work-in-progress':  pctLo(4),
    'spare-parts-mro':   pctLo(18),
    'indirect-general':  pctLo(14),
    'packaging':         pctLo(8),
    'commodities':       pctLo(5),
  },
  'food-beverage': {
    'finished-goods':    pctLo(8),
    'raw-materials':     pctLo(6),
    'work-in-progress':  pctLo(5),
    'spare-parts-mro':   pctLo(18),
    'indirect-general':  pctLo(14),
    'packaging':         pctLo(8),
    'commodities':       pctLo(5),
  },
  'construction': {
    'finished-goods':    pctLo(14),
    'raw-materials':     pctLo(10),
    'work-in-progress':  pctLo(7),
    'spare-parts-mro':   pctLo(26),
    'indirect-general':  pctLo(20),
    'packaging':         pctLo(12),
    'commodities':       pctLo(8),
  },
};

/** Master combined-target table — keyed by KPI id */
const COMBINED_TARGETS: Record<string, IndustrySku> = {
  turns:   TURNS_COMBINED,
  fa:      FA_COMBINED,
  buf:     BUF_COMBINED,
  pocycle: POCYCLE_COMBINED,
  ppm:     PPM_COMBINED,
  mav:     MAV_COMBINED,
  scv:     SCV_COMBINED,
};

// ═══════════════════════════════════════════════════════════════════════════
// 2. INDUSTRY-ONLY TARGETS
//    Best-in-class for each sector when no SKU class is selected.
// ═══════════════════════════════════════════════════════════════════════════

const INDUSTRY_TARGETS: Record<string, IndustryOnly> = {

  // ── Supply Chain Strategy ─────────────────────────────────────────────

  por: {
    'retail-fmcg':       pct(93),
    'manufacturing':     pct(90),
    'healthcare-pharma': pct(97),
    'oil-gas':           pct(90),
    'government':        pct(85),
    'logistics':         pct(97),
    'food-beverage':     pct(92),
    'construction':      pct(82),
  },

  otif: {
    'retail-fmcg':       pct(95),
    'manufacturing':     pct(92),
    'healthcare-pharma': pct(97),
    'oil-gas':           pct(90),
    'government':        pct(87),
    'logistics':         pct(98),
    'food-beverage':     pct(94),
    'construction':      pct(84),
  },

  sccost: {
    'retail-fmcg':       pctLo(12),
    'manufacturing':     pctLo(8),
    'healthcare-pharma': pctLo(7),
    'oil-gas':           pctLo(3),
    'government':        pctLo(15),
    'logistics':         pctLo(5),
    'food-beverage':     pctLo(10),
    'construction':      pctLo(6),
  },

  c2c: {
    // World-class Cash-to-Cash cycle days. Gartner SCM Top 25 (2024):
    // retail top-10% ≈ 20 days; mfg top-25% ≈ 30–35 days; food leaders ≤8 days.
    'retail-fmcg':       daysLo(20),
    'manufacturing':     daysLo(35),
    'healthcare-pharma': daysLo(35),
    'oil-gas':           daysLo(60),
    'government':        daysLo(50), // OECD public-sector payment-cycle guidance
    'logistics':         daysLo(15),
    'food-beverage':     daysLo(8),  // ↓10 days — Gartner SCM Top-25 2024 food leaders
    'construction':      daysLo(60), // top-quartile construction; CIOB benchmarking
  },

  fa: {
    'retail-fmcg':       pct(82),
    'manufacturing':     pct(75),
    'healthcare-pharma': pct(85),
    'oil-gas':           pct(70),
    'government':        pct(65),
    'logistics':         pct(85),
    'food-beverage':     pct(80),
    'construction':      pct(60),
  },

  turns: {
    'retail-fmcg':       turns(9),
    'manufacturing':     turns(8),
    'healthcare-pharma': turns(6),
    'oil-gas':           turns(4),
    'government':        turns(3),
    'logistics':         turns(9),
    'food-beverage':     turns(9),
    'construction':      turns(3),
  },

  // ── Procurement Excellence ────────────────────────────────────────────

  savings: {
    'retail-fmcg':       pct(9),   // ↑8% — CIPS top-quartile 2024
    'manufacturing':     pct(7),
    'healthcare-pharma': pct(6),
    'oil-gas':           pct(10),  // ↑8% — Hackett top-decile commodity AI sourcing 2024
    'government':        pct(5),
    'logistics':         pct(7),
    'food-beverage':     pct(8),
    'construction':      pct(6),
  },

  pocycle: {
    // Industry-blended world-class targets (no SKU selected).
    // Gartner top-10% P2P: retail/FMCG 3–5 days, mfg 5–7 days.
    'retail-fmcg':       daysLo(4),
    'manufacturing':     daysLo(5),
    'healthcare-pharma': daysLo(4),
    'oil-gas':           daysLo(7),
    'government':        daysLo(8),
    'logistics':         daysLo(2),
    'food-beverage':     daysLo(3),
    'construction':      daysLo(7),
  },

  pocomp: {
    'retail-fmcg':       pct(88),
    'manufacturing':     pct(85),
    'healthcare-pharma': pct(92),
    'oil-gas':           pct(90),
    'government':        pct(80),
    'logistics':         pct(90),
    'food-beverage':     pct(86),
    'construction':      pct(75),
  },

  sotif: {
    'retail-fmcg':       pct(90),
    'manufacturing':     pct(88),
    'healthcare-pharma': pct(95),
    'oil-gas':           pct(88),
    'government':        pct(83),
    'logistics':         pct(95),
    'food-beverage':     pct(92),
    'construction':      pct(78),
  },

  sotif2: {
    'retail-fmcg':       pct(90),
    'manufacturing':     pct(88),
    'healthcare-pharma': pct(95),
    'oil-gas':           pct(88),
    'government':        pct(83),
    'logistics':         pct(95),
    'food-beverage':     pct(92),
    'construction':      pct(78),
  },

  ccov: {
    'retail-fmcg':       pct(82),
    'manufacturing':     pct(78),
    'healthcare-pharma': pct(88),
    'oil-gas':           pct(88),
    'government':        pct(90),
    'logistics':         pct(80),
    'food-beverage':     pct(78),
    'construction':      pct(68),
  },

  cco: {
    'retail-fmcg':       pct(82),
    'manufacturing':     pct(78),
    'healthcare-pharma': pct(88),
    'oil-gas':           pct(88),
    'government':        pct(90),
    'logistics':         pct(80),
    'food-beverage':     pct(78),
    'construction':      pct(68),
  },

  ttc: {
    // World-class Time-to-Contract with CLM software.
    // CIPS top-quartile: 21–35 days standard contracts; IACCM 2023 survey.
    'retail-fmcg':       daysLo(21),
    'manufacturing':     daysLo(28),
    'healthcare-pharma': daysLo(21),
    'oil-gas':           daysLo(35),
    'government':        daysLo(45), // mandatory tender timelines constraint
    'logistics':         daysLo(14),
    'food-beverage':     daysLo(21),
    'construction':      daysLo(42),
  },

  // ── Lean Six Sigma ────────────────────────────────────────────────────

  pce: {
    'retail-fmcg':       pct(20),
    'manufacturing':     pct(18),
    'healthcare-pharma': pct(25),
    'oil-gas':           pct(16),
    'government':        pct(14),
    'logistics':         pct(28),
    'food-beverage':     pct(20),
    'construction':      pct(12),
  },

  pce2: {
    'retail-fmcg':       pct(20),
    'manufacturing':     pct(18),
    'healthcare-pharma': pct(25),
    'oil-gas':           pct(16),
    'government':        pct(14),
    'logistics':         pct(28),
    'food-beverage':     pct(20),
    'construction':      pct(12),
  },

  sigma: {
    'retail-fmcg':       hi(3.5, 'σ', 'σ'),
    'manufacturing':     hi(3.2, 'σ', 'σ'),
    'healthcare-pharma': hi(4.0, 'σ', 'σ'),
    'oil-gas':           hi(3.5, 'σ', 'σ'),
    'government':        hi(3.0, 'σ', 'σ'),
    'logistics':         hi(3.8, 'σ', 'σ'),
    'food-beverage':     hi(3.4, 'σ', 'σ'),
    'construction':      hi(2.8, 'σ', 'σ'),
  },

  ftr: {
    'retail-fmcg':       pct(88),
    'manufacturing':     pct(85),
    'healthcare-pharma': pct(92),
    'oil-gas':           pct(88),
    'government':        pct(80),
    'logistics':         pct(90),
    'food-beverage':     pct(87),
    'construction':      pct(75),
  },

  ftr2: {
    'retail-fmcg':       pct(88),
    'manufacturing':     pct(85),
    'healthcare-pharma': pct(92),
    'oil-gas':           pct(88),
    'government':        pct(80),
    'logistics':         pct(90),
    'food-beverage':     pct(87),
    'construction':      pct(75),
  },

  copq: {
    'retail-fmcg':       pctLo(3),
    'manufacturing':     pctLo(4),
    'healthcare-pharma': pctLo(2),
    'oil-gas':           pctLo(2.5),
    'government':        pctLo(5),
    'logistics':         pctLo(2.5),
    'food-beverage':     pctLo(3.5),
    'construction':      pctLo(5),
  },

  // ── Digital Transformation ────────────────────────────────────────────

  erpu: {
    'retail-fmcg':       pct(70),
    'manufacturing':     pct(62),
    'healthcare-pharma': pct(82),  // ↑78% — HIMSS top-quartile 2024
    'oil-gas':           pct(70),
    'government':        pct(55),
    'logistics':         pct(72),
    'food-beverage':     pct(64),
    'construction':      pct(48),
  },

  auto: {
    'retail-fmcg':       pct(50),
    'manufacturing':     pct(42),
    'healthcare-pharma': pct(56),
    'oil-gas':           pct(48),
    'government':        pct(28),
    'logistics':         pct(70),  // ↑60% — Hackett World-Class Procurement 2024
    'food-beverage':     pct(44),
    'construction':      pct(25),
  },

  stp: {
    'retail-fmcg':       pct(60),
    'manufacturing':     pct(48),
    'healthcare-pharma': pct(65),
    'oil-gas':           pct(42),
    'government':        pct(28),
    'logistics':         pct(68),
    'food-beverage':     pct(52),
    'construction':      pct(22),
  },

  da: {
    'retail-fmcg':       pct(92),
    'manufacturing':     pct(88),
    'healthcare-pharma': pct(96),
    'oil-gas':           pct(92),
    'government':        pct(85),
    'logistics':         pct(94),
    'food-beverage':     pct(90),
    'construction':      pct(80),
  },

  // ── Governance & Compliance ───────────────────────────────────────────

  pcr: {
    'retail-fmcg':       pct(88),
    'manufacturing':     pct(85),
    'healthcare-pharma': pct(93),
    'oil-gas':           pct(92),
    'government':        pct(88),
    'logistics':         pct(88),
    'food-beverage':     pct(85),
    'construction':      pct(75),
  },

  pcr2: {
    'retail-fmcg':       pct(88),
    'manufacturing':     pct(85),
    'healthcare-pharma': pct(93),
    'oil-gas':           pct(92),
    'government':        pct(88),
    'logistics':         pct(88),
    'food-beverage':     pct(85),
    'construction':      pct(75),
  },

  aud: {
    'retail-fmcg':       hi(80, '/100', '/١٠٠'),
    'manufacturing':     hi(76, '/100', '/١٠٠'),
    'healthcare-pharma': hi(90, '/100', '/١٠٠'),
    'oil-gas':           hi(86, '/100', '/١٠٠'),
    'government':        hi(80, '/100', '/١٠٠'),
    'logistics':         hi(82, '/100', '/١٠٠'),
    'food-beverage':     hi(78, '/100', '/١٠٠'),
    'construction':      hi(68, '/100', '/١٠٠'),
  },

  mav: {
    'retail-fmcg':       pctLo(8),
    'manufacturing':     pctLo(10),
    'healthcare-pharma': pctLo(5),
    'oil-gas':           pctLo(8),
    'government':        pctLo(18),
    'logistics':         pctLo(7),
    'food-beverage':     pctLo(8),
    'construction':      pctLo(18),
  },

  asa: {
    'retail-fmcg':       pct(90),
    'manufacturing':     pct(88),
    'healthcare-pharma': pct(95),
    'oil-gas':           pct(92),
    'government':        pct(85),
    'logistics':         pct(90),
    'food-beverage':     pct(88),
    'construction':      pct(75),
  },

  // ── Supplier Relationship Governance ─────────────────────────────────

  ppm: {
    'retail-fmcg':       ppm(500),
    'manufacturing':     ppm(800),
    'healthcare-pharma': ppm(50),
    'oil-gas':           ppm(200),
    'government':        ppm(1500),
    'logistics':         ppm(300),
    'food-beverage':     ppm(200),
    'construction':      ppm(2000),
  },

  // ── Resiliency ────────────────────────────────────────────────────────

  mttr: {
    'retail-fmcg':       { value: 24,  label: '<24h',   labelAr: '<٢٤ ساعة'  }, // ↓36h — McKinsey resilience top-10% 2024
    'manufacturing':     { value: 96,  label: '<96h',   labelAr: '<٩٦ ساعة'  },
    'healthcare-pharma': { value: 24,  label: '<24h',   labelAr: '<٢٤ ساعة'  },
    'oil-gas':           { value: 120, label: '<120h',  labelAr: '<١٢٠ ساعة' },
    'government':        { value: 120, label: '<120h',  labelAr: '<١٢٠ ساعة' },
    'logistics':         { value: 18,  label: '<18h',   labelAr: '<١٨ ساعة'  }, // ↓24h — McKinsey resilience top-10% 2024
    'food-beverage':     { value: 36,  label: '<36h',   labelAr: '<٣٦ ساعة'  },
    'construction':      { value: 120, label: '<120h',  labelAr: '<١٢٠ ساعة' },
  },

  rar: {
    'retail-fmcg':       pctLo(4),
    'manufacturing':     pctLo(6),
    'healthcare-pharma': pctLo(3),
    'oil-gas':           pctLo(8),
    'government':        pctLo(5),
    'logistics':         pctLo(3),
    'food-beverage':     pctLo(4),
    'construction':      pctLo(8),
  },

  // ── Value Engineering ─────────────────────────────────────────────────

  ves: {
    'retail-fmcg':       pct(7),
    'manufacturing':     pct(7),
    'healthcare-pharma': pct(6),
    'oil-gas':           pct(9),
    'government':        pct(5),
    'logistics':         pct(6),
    'food-beverage':     pct(7),
    'construction':      pct(6),
  },

  scv: {
    'retail-fmcg':       pctLo(8),
    'manufacturing':     pctLo(10),
    'healthcare-pharma': pctLo(7),
    'oil-gas':           pctLo(8),
    'government':        pctLo(16),
    'logistics':         pctLo(8),
    'food-beverage':     pctLo(8),
    'construction':      pctLo(12),
  },

  // ── Sustainability / ESG ──────────────────────────────────────────────

  lc: {
    'retail-fmcg':       pct(40),
    'manufacturing':     pct(45),
    'healthcare-pharma': pct(30),
    'oil-gas':           pct(65),  // ↑55% — Aramco IKTVA 70% target; top-10% ≈65% today (2023 report)
    'government':        pct(68),  // ↑60% — Saudi IKTVA mandate trajectory 2030
    'logistics':         pct(35),
    'food-beverage':     pct(42),
    'construction':      pct(50),
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// 3. SKU-CLASS-ONLY TARGETS
//    Used when a SKU class is selected but no industry is chosen.
// ═══════════════════════════════════════════════════════════════════════════

const SKU_TARGETS: Record<string, SkuOnly> = {
  turns: {
    'finished-goods':    turns(9),
    'raw-materials':     turns(9),
    'work-in-progress':  turns(25),
    'spare-parts-mro':   hi(2.5, '/yr', '/سنة'),
    'indirect-general':  turns(6),
    'packaging':         turns(14),
    'commodities':       turns(5),
  },

  fa: {
    'finished-goods':    pct(82),
    'raw-materials':     pct(72),
    'work-in-progress':  pct(78),
    'spare-parts-mro':   pct(48),
    'indirect-general':  pct(62),
    'packaging':         pct(76),
    'commodities':       pct(68),
  },

  buf: {
    'finished-goods':    days(10),
    'raw-materials':     days(21),
    'work-in-progress':  days(5),
    'spare-parts-mro':   days(60),
    'indirect-general':  days(14),
    'packaging':         days(14),
    'commodities':       days(30),
  },

  pocycle: {
    // SKU-blended world-class targets (no industry selected).
    'finished-goods':    daysLo(4),
    'raw-materials':     daysLo(6),
    'work-in-progress':  daysLo(2),
    'spare-parts-mro':   daysLo(9),
    'indirect-general':  daysLo(2),
    'packaging':         daysLo(4),
    'commodities':       daysLo(5),
  },

  ppm: {
    'finished-goods':    ppm(500),
    'raw-materials':     ppm(1000),
    'work-in-progress':  ppm(300),
    'spare-parts-mro':   ppm(200),
    'indirect-general':  ppm(3000),
    'packaging':         ppm(800),
    'commodities':       ppm(500),
  },

  mav: {
    'finished-goods':    pctLo(4),
    'raw-materials':     pctLo(5),
    'work-in-progress':  pctLo(2),
    'spare-parts-mro':   pctLo(16),
    'indirect-general':  pctLo(25),
    'packaging':         pctLo(6),
    'commodities':       pctLo(3),
  },

  scv: {
    'finished-goods':    pctLo(8),
    'raw-materials':     pctLo(6),
    'work-in-progress':  pctLo(5),
    'spare-parts-mro':   pctLo(20),
    'indirect-general':  pctLo(14),
    'packaging':         pctLo(8),
    'commodities':       pctLo(4),
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// 4. PUBLIC LOOKUP FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Returns the most specific calibrated target available for a KPI.
 *
 * Resolution order (most-specific wins):
 *   1. Combined [industry][sku]  — inventory-sensitive KPIs with both dims
 *   2. Industry-only             — process KPIs or when only industry selected
 *   3. SKU-only                  — inventory KPIs when only SKU class selected
 *   4. null                      — caller falls back to static KPI_FRAMEWORKS default
 */
export function getContextualTarget(
  kpiId: string,
  industryKey: IndustryKey | null,
  skuClassKey: SkuClassKey | null,
): TargetEntry | null {
  // 1. Combined
  if (industryKey && skuClassKey) {
    const combined = COMBINED_TARGETS[kpiId]?.[industryKey]?.[skuClassKey];
    if (combined) return combined;
  }
  // 2. Industry-only
  if (industryKey) {
    const ind = INDUSTRY_TARGETS[kpiId]?.[industryKey];
    if (ind) return ind;
  }
  // 3. SKU-only
  if (skuClassKey) {
    const sku = SKU_TARGETS[kpiId]?.[skuClassKey];
    if (sku) return sku;
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. CADENCE — how often each KPI's target should realistically be reviewed
//    Added 2026-08-19. A property of the KPI itself (how fast the underlying
//    process moves), not of the industry/SKU context, so it is a flat map
//    rather than duplicated across all ~690 rows above.
// ═══════════════════════════════════════════════════════════════════════════

export type TargetCadence = 'quarterly' | 'semi-annual' | 'annual' | 'ongoing-direction';

export const KPI_CADENCE: Record<string, TargetCadence> = {
  por:     'quarterly',       // Perfect Order Rate — fast-moving operational metric
  otif:    'quarterly',
  sccost:  'annual',          // SC Cost % Revenue — tied to annual budget cycle
  c2c:     'quarterly',       // Cash-to-Cash Days — tracked with quarterly financials
  fa:      'quarterly',       // Forecast Accuracy
  turns:   'quarterly',       // Inventory Turns/yr
  savings: 'annual',          // Procurement Savings % — program/budget cycle
  pocycle: 'quarterly',       // PO Cycle Time
  pocomp:  'quarterly',       // PO Compliance Rate
  sotif:   'quarterly',       // Supplier OTIF
  sotif2:  'quarterly',
  ccov:    'semi-annual',     // Contract Coverage % — contract renewal cycles are slower
  cco:     'semi-annual',
  ttc:     'quarterly',       // Time-to-Contract
  pce:     'semi-annual',     // Process Cycle Efficiency — lean initiative, slower to shift
  pce2:    'semi-annual',
  sigma:   'semi-annual',     // Sigma Level — structural quality metric
  ftr:     'quarterly',       // First-Time-Right Rate
  ftr2:    'quarterly',
  copq:    'semi-annual',     // Cost of Poor Quality %
  erpu:    'semi-annual',     // ERP Module Utilisation — digital adoption, slow-moving
  auto:    'semi-annual',     // Process Automation Rate
  stp:     'quarterly',       // Straight-Through PO Rate
  da:      'ongoing-direction', // Data Accuracy Rate — continuous hygiene, not a checkpoint
  pcr:     'semi-annual',     // Policy Compliance Rate
  pcr2:    'semi-annual',
  aud:     'annual',          // Audit Score — audits are periodic/annual by nature
  mav:     'quarterly',       // Maverick Spend %
  asa:     'quarterly',       // Approved Supplier Adherence
  ppm:     'quarterly',       // Defect Rate (PPM)
  mttr:    'ongoing-direction', // Mean Time to Recover — incident-driven, not scheduled
  rar:     'ongoing-direction', // Revenue at Risk % — continuously monitored exposure
  ves:     'annual',          // VE Savings % Spend — project/program cycle
  scv:     'quarterly',       // Should-Cost Variance %
  lc:      'annual',          // Local Content / Iktva % — reported annually
  buf:     'quarterly',       // Buffer Stock (days supply)
};

/** Falls back to 'annual' for any KPI id not yet tagged above. */
export function getKpiCadence(kpiId: string): TargetCadence {
  return KPI_CADENCE[kpiId] ?? 'annual';
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. FOUNDATIONAL TIER — deliberately NOT a static table
//    A client just starting out shouldn't be handed a top-quartile target on
//    day one. But there is no honest single "foundational number" per KPI —
//    it depends on where that specific client is starting from. So instead
//    of fabricating 690 more static figures, this is computed: it closes a
//    portion of the gap between the client's current value and the
//    Peer/Median benchmark (from kpiBenchmarksByIndustry / BySkuClass).
//    Ambitious clients can still ignore this and target Best-in-Class
//    (the value already returned by getContextualTarget) from day one.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @param currentValue   the client's own measured value for this KPI
 * @param peerValue      the Peer/Median benchmark for this KPI (from
 *                       getIndustryBenchmark / getSkuClassBenchmark)
 * @param closeGapFraction how much of the gap to close — default 0.4 (40%),
 *                       a realistic first-step improvement horizon
 */
export function computeFoundationalTarget(
  currentValue: number,
  peerValue: number,
  closeGapFraction = 0.4,
): number {
  const gap = peerValue - currentValue;
  return currentValue + gap * closeGapFraction;
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. GCC-SPECIFIC REFERENCE DATA
//    Added 2026-08-19, from a dedicated research round (see companion
//    artifact "ISC_Two_Day_Summary.docx", Section 4).
//
//    Reconciliation rule applied here: before a regional figure is attached
//    to a specific industry row, it must pass (a) a construct match — same
//    calculation method — and (b) a population match — comparable sector,
//    company size, and period. A source that passes (a) but not (b) is kept
//    in GCC_REGIONAL_REFERENCE_UNMATCHED below instead of being attached to
//    a row it doesn't actually describe.
// ═══════════════════════════════════════════════════════════════════════════

export interface GccReference {
  value: number;
  label: string;
  labelAr: string;
  range?: string;
  source: string;
  matchQuality: 'sector-matched';
}

/**
 * (kpiId → industryKey → GccReference), only for pairs where a real,
 * population-matched regional source was found. Every pair NOT listed here
 * has no GCC-specific figure yet — the international target above (from
 * getContextualTarget) is the correct number to show until one is found.
 */
export const GCC_TARGETS_BY_INDUSTRY: Partial<Record<string, Partial<Record<IndustryKey, GccReference>>>> = {
  turns: {
    manufacturing: {
      value: 8,
      label: '~8/yr (sample range 4–16)',
      labelAr: '~8/سنة (مدى العيّنة 4-16)',
      range: '4–16x/yr across sample; mean ≈ 8x/yr',
      source: 'Saudi Tadawul-listed manufacturers, 78 firms, 2017–2021, peer-reviewed ' +
        '(MDPI, journal "Processes"). This independently converges with the existing ' +
        'international target of 8x/yr for manufacturing in this file — treated as a ' +
        'confidence signal per the reconciliation rule, not a conflicting figure. Note: ' +
        'this is separate from the "benchmarkValue" (today\'s typical/peer performance, ' +
        '~5x/yr) shown elsewhere in the product — this figure is the aspirational target.',
      matchQuality: 'sector-matched',
    },
  },
};

export function getGccTarget(kpiId: string, industryKey: IndustryKey | null): GccReference | null {
  if (!industryKey) return null;
  return GCC_TARGETS_BY_INDUSTRY[kpiId]?.[industryKey] ?? null;
}

/**
 * Real, current, regionally-specific figures that exist but do not yet pass
 * the population-match test for any single sector in this file (they are
 * all-sector regional blends). Kept here so the research is not lost, and
 * NOT attached to any industry row until a sector-level breakdown is found —
 * see "ISC_Two_Day_Summary.docx", Section 5, open flag.
 */
export const GCC_REGIONAL_REFERENCE_UNMATCHED = {
  workingCapital: {
    netWorkingCapitalDays: {
      value: 101.7,
      source: 'PwC Middle East Working Capital Study 2025, region-wide all-sector aggregate.',
    },
    dso: {
      value: 81.1,
      trendNote: 'improving, down from 83.9 days prior period',
      source: 'PwC Middle East Working Capital Study 2025, region-wide all-sector aggregate.',
    },
    dpo: {
      value: 60.8,
      rangeNote: 'broadly stable; ranges roughly 40–100+ days by sector/country',
      source: 'PwC Middle East Working Capital Study 2025, region-wide all-sector aggregate.',
    },
    dioTrendNote: 'improving roughly 3 days year-over-year (no absolute figure extracted yet)',
    source: 'PwC Middle East Working Capital Study 2025.',
  },
  qatarManufacturingStudy: {
    note: '10 manufacturing firms, Qatar Stock Exchange, 2015–2019 — smaller academic sample; ' +
      'figures not yet extracted into structured form.',
  },
};

