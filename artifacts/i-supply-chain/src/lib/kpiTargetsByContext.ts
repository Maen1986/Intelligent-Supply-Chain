/**
 * Contextual KPI Targets — calibrated by Industry and/or SKU/Inventory Class
 *
 * Three layers of specificity (most-specific wins):
 *   1. Combined  [industry][sku]  — for inventory-intensive KPIs (turns, fa, buf, pocycle, ppm, mav, scv)
 *   2. Industry-only              — for process / operational KPIs
 *   3. SKU-only                   — for when SKU class is selected but no industry
 *
 * These are international best-in-class targets (top-quartile / World-Class).
 * They are NOT GCC medians — those live in kpiBenchmarksByIndustry/BySku.
 *
 * Sources: CIPS benchmarking, Gartner Supply Chain Top 25, APICS/ASCM standards,
 * McKinsey supply chain surveys, ISC practitioner data 2022-2025.
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
    'finished-goods':    turns(10),
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

/** Best-in-class PO Cycle Time (days, lower = faster), by industry × SKU */
const POCYCLE_COMBINED: IndustrySku = {
  'retail-fmcg': {
    'finished-goods':    daysLo(7),
    'raw-materials':     daysLo(14),
    'work-in-progress':  daysLo(5),
    'spare-parts-mro':   daysLo(25),
    'indirect-general':  daysLo(4),
    'packaging':         daysLo(10),
    'commodities':       daysLo(12),
  },
  'manufacturing': {
    'finished-goods':    daysLo(10),
    'raw-materials':     daysLo(18),
    'work-in-progress':  daysLo(7),
    'spare-parts-mro':   daysLo(30),
    'indirect-general':  daysLo(5),
    'packaging':         daysLo(12),
    'commodities':       daysLo(16),
  },
  'healthcare-pharma': {
    'finished-goods':    daysLo(8),
    'raw-materials':     daysLo(12),
    'work-in-progress':  daysLo(5),
    'spare-parts-mro':   daysLo(22),
    'indirect-general':  daysLo(4),
    'packaging':         daysLo(8),
    'commodities':       daysLo(12),
  },
  'oil-gas': {
    'finished-goods':    daysLo(15),
    'raw-materials':     daysLo(25),
    'work-in-progress':  daysLo(10),
    'spare-parts-mro':   daysLo(45),
    'indirect-general':  daysLo(7),
    'packaging':         daysLo(18),
    'commodities':       daysLo(22),
  },
  'government': {
    'finished-goods':    daysLo(20),
    'raw-materials':     daysLo(30),
    'work-in-progress':  daysLo(15),
    'spare-parts-mro':   daysLo(55),
    'indirect-general':  daysLo(10),
    'packaging':         daysLo(25),
    'commodities':       daysLo(28),
  },
  'logistics': {
    'finished-goods':    daysLo(5),
    'raw-materials':     daysLo(10),
    'work-in-progress':  daysLo(4),
    'spare-parts-mro':   daysLo(20),
    'indirect-general':  daysLo(3),
    'packaging':         daysLo(8),
    'commodities':       daysLo(10),
  },
  'food-beverage': {
    'finished-goods':    daysLo(6),
    'raw-materials':     daysLo(12),
    'work-in-progress':  daysLo(4),
    'spare-parts-mro':   daysLo(22),
    'indirect-general':  daysLo(3),
    'packaging':         daysLo(8),
    'commodities':       daysLo(10),
  },
  'construction': {
    'finished-goods':    daysLo(20),
    'raw-materials':     daysLo(30),
    'work-in-progress':  daysLo(12),
    'spare-parts-mro':   daysLo(50),
    'indirect-general':  daysLo(8),
    'packaging':         daysLo(22),
    'commodities':       daysLo(25),
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
    'retail-fmcg':       daysLo(20),
    'manufacturing':     daysLo(45),
    'healthcare-pharma': daysLo(35),
    'oil-gas':           daysLo(60),
    'government':        daysLo(80),
    'logistics':         daysLo(15),
    'food-beverage':     daysLo(10),
    'construction':      daysLo(90),
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
    'retail-fmcg':       turns(12),
    'manufacturing':     turns(8),
    'healthcare-pharma': turns(6),
    'oil-gas':           turns(4),
    'government':        turns(3),
    'logistics':         turns(18),
    'food-beverage':     turns(15),
    'construction':      hi(2.5, '/yr', '/سنة'),
  },

  // ── Procurement Excellence ────────────────────────────────────────────

  savings: {
    'retail-fmcg':       pct(8),
    'manufacturing':     pct(7),
    'healthcare-pharma': pct(6),
    'oil-gas':           pct(8),
    'government':        pct(5),
    'logistics':         pct(7),
    'food-beverage':     pct(8),
    'construction':      pct(6),
  },

  pocycle: {
    'retail-fmcg':       daysLo(12),
    'manufacturing':     daysLo(16),
    'healthcare-pharma': daysLo(12),
    'oil-gas':           daysLo(22),
    'government':        daysLo(30),
    'logistics':         daysLo(8),
    'food-beverage':     daysLo(10),
    'construction':      daysLo(28),
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
    'retail-fmcg':       daysLo(30),
    'manufacturing':     daysLo(40),
    'healthcare-pharma': daysLo(28),
    'oil-gas':           daysLo(45),
    'government':        daysLo(60),
    'logistics':         daysLo(22),
    'food-beverage':     daysLo(28),
    'construction':      daysLo(55),
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
    'healthcare-pharma': pct(78),
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
    'logistics':         pct(60),
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
    'retail-fmcg':       { value: 36,  label: '<36h',   labelAr: '<٣٦ ساعة'  },
    'manufacturing':     { value: 96,  label: '<96h',   labelAr: '<٩٦ ساعة'  },
    'healthcare-pharma': { value: 24,  label: '<24h',   labelAr: '<٢٤ ساعة'  },
    'oil-gas':           { value: 120, label: '<120h',  labelAr: '<١٢٠ ساعة' },
    'government':        { value: 120, label: '<120h',  labelAr: '<١٢٠ ساعة' },
    'logistics':         { value: 24,  label: '<24h',   labelAr: '<٢٤ ساعة'  },
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
    'oil-gas':           pct(55),
    'government':        pct(60),
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
    'finished-goods':    turns(12),
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
    'finished-goods':    daysLo(8),
    'raw-materials':     daysLo(16),
    'work-in-progress':  daysLo(6),
    'spare-parts-mro':   daysLo(30),
    'indirect-general':  daysLo(5),
    'packaging':         daysLo(10),
    'commodities':       daysLo(14),
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
