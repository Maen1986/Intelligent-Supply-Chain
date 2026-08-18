/**
 * Industry-Specific KPI Reference Benchmarks
 *
 * Represents ISC's calibrated sector-median reference point, not a raw pull
 * from a single external study.
 *
 * Content-honesty note (#183, follow-up pass, 2026-08-17): the figures below
 * are ISC's own calibration, informed by the general methodology and public
 * findings of named industry benchmarking programmes (Gartner Supply Chain
 * Top 25, Hackett Group World-Class Procurement, APICS/ASCM SCOR, IACCM,
 * CIPS, World Bank Logistics Performance Index, ISM Report on Business) --
 * not a literal, audited extraction from each paywalled report for every
 * one of the 280 individual figures below.
 *
 * EXPERT REVIEW COMPLETED (2026-08-18) for fa, turns, ftr, ftr2, and aud:
 * checked over 52 research rounds against real external sources; 9 figures
 * were corrected against real external benchmarks (see companion artifact
 * "ISC Benchmark Final v1.0.xlsx", Tab 10, for full citations per figure).
 * The remaining KPIs in this file were not part of this review pass and
 * remain pending independent expert review -- same trust model as
 * regulatory_countries and gcc_benchmarks.
 *
 * Last reviewed: 2026-08-18. Next review due: 2027-02-18 (6 months) or
 * sooner if a named subject-matter expert signs off earlier.
 */

export type IndustryKey =
  | 'retail-fmcg'
  | 'manufacturing'
  | 'healthcare-pharma'
  | 'oil-gas'
  | 'government'
  | 'logistics'
  | 'food-beverage'
  | 'construction';

export interface IndustryMeta {
  id: IndustryKey;
  label: string;
  labelAr: string;
  icon: string;
  description: string;
}

export const INDUSTRIES: IndustryMeta[] = [
  { id: 'retail-fmcg',        label: 'Retail / FMCG',              labelAr: 'تجزئة / بضائع سريعة',     icon: '🛒', description: 'Consumer goods, supermarkets, hypermarkets' },
  { id: 'manufacturing',      label: 'Manufacturing',               labelAr: 'تصنيع صناعي',              icon: '🏭', description: 'Industrial manufacturing, assembly, discrete' },
  { id: 'healthcare-pharma',  label: 'Healthcare & Pharma',         labelAr: 'رعاية صحية / دواء',        icon: '🏥', description: 'Hospitals, pharma, medical devices' },
  { id: 'oil-gas',            label: 'Oil & Gas / Energy',          labelAr: 'نفط وغاز / طاقة',          icon: '⛽', description: 'Upstream, downstream, petrochemical' },
  { id: 'government',         label: 'Government / Public Sector',  labelAr: 'حكومي / قطاع عام',         icon: '🏛️', description: 'Ministries, government entities, semi-government' },
  { id: 'logistics',          label: 'Logistics / 3PL',             labelAr: 'لوجستيات / طرف ثالث',      icon: '🚚', description: 'Freight, 3PL, warehousing, last-mile' },
  { id: 'food-beverage',      label: 'Food & Beverage',             labelAr: 'غذاء ومشروبات',            icon: '🍽️', description: 'F&B manufacturing, hospitality supply chains' },
  { id: 'construction',       label: 'Construction / Real Estate',  labelAr: 'إنشاءات / عقارات',         icon: '🏗️', description: 'Contractors, developers, infrastructure' },
];

export interface IndustryBenchmarkEntry {
  value: number;
  label: string;    // English
  labelAr: string;  // Arabic
}

type KpiIndustryBenchmarks = Partial<Record<IndustryKey, IndustryBenchmarkEntry>>;

/**
 * Industry-specific GCC median benchmarks per KPI ID.
 * Keys match the `id` field in KPI_FRAMEWORKS definitions.
 */
export const INDUSTRY_KPI_BENCHMARKS: Record<string, KpiIndustryBenchmarks> = {

  // ─── Supply Chain Strategy ────────────────────────────────────────────────

  /** Perfect Order Rate — higher is better */
  por: {
    'retail-fmcg':       { value: 82,   label: '82%',      labelAr: '٨٢٪' },
    'manufacturing':     { value: 74,   label: '74%',      labelAr: '٧٤٪' },
    'healthcare-pharma': { value: 90,   label: '90%',      labelAr: '٩٠٪' },
    'oil-gas':           { value: 78,   label: '78%',      labelAr: '٧٨٪' },
    'government':        { value: 68,   label: '68%',      labelAr: '٦٨٪' },
    'logistics':         { value: 88,   label: '88%',      labelAr: '٨٨٪' },
    'food-beverage':     { value: 80,   label: '80%',      labelAr: '٨٠٪' },
    'construction':      { value: 64,   label: '64%',      labelAr: '٦٤٪' },
  },

  /** OTIF — higher is better */
  otif: {
    'retail-fmcg':       { value: 85,   label: '85%',      labelAr: '٨٥٪' },
    'manufacturing':     { value: 78,   label: '78%',      labelAr: '٧٨٪' },
    'healthcare-pharma': { value: 88,   label: '88%',      labelAr: '٨٨٪' },
    'oil-gas':           { value: 80,   label: '80%',      labelAr: '٨٠٪' },
    'government':        { value: 72,   label: '72%',      labelAr: '٧٢٪' },
    'logistics':         { value: 91,   label: '91%',      labelAr: '٩١٪' },
    'food-beverage':     { value: 82,   label: '82%',      labelAr: '٨٢٪' },
    'construction':      { value: 68,   label: '68%',      labelAr: '٦٨٪' },
  },

  /** Supply Chain Cost % Revenue — lower is better */
  sccost: {
    'retail-fmcg':       { value: 18,   label: '18%',      labelAr: '١٨٪' },
    'manufacturing':     { value: 14,   label: '14%',      labelAr: '١٤٪' },
    'healthcare-pharma': { value: 12,   label: '12%',      labelAr: '١٢٪' },
    'oil-gas':           { value: 6,    label: '6%',       labelAr: '٦٪'  },
    'government':        { value: 22,   label: '22%',      labelAr: '٢٢٪' },
    'logistics':         { value: 8,    label: '8%',       labelAr: '٨٪'  },
    'food-beverage':     { value: 20,   label: '20%',      labelAr: '٢٠٪' },
    'construction':      { value: 10,   label: '10%',      labelAr: '١٠٪' },
  },

  /** Cash-to-Cash Days — lower is better */
  c2c: {
    'retail-fmcg':       { value: 35,   label: '35 days',  labelAr: '٣٥ يوماً' },
    'manufacturing':     { value: 65,   label: '65 days',  labelAr: '٦٥ يوماً' },
    'healthcare-pharma': { value: 55,   label: '55 days',  labelAr: '٥٥ يوماً' },
    'oil-gas':           { value: 85,   label: '85 days',  labelAr: '٨٥ يوماً' },
    'government':        { value: 110,  label: '110 days', labelAr: '١١٠ أيام' },
    'logistics':         { value: 28,   label: '28 days',  labelAr: '٢٨ يوماً' },
    'food-beverage':     { value: 22,   label: '22 days',  labelAr: '٢٢ يوماً' },
    'construction':      { value: 120,  label: '120 days', labelAr: '١٢٠ يوماً' },
  },

  /** Forecast Accuracy — higher is better */
  fa: {
    'retail-fmcg':       { value: 72,   label: '72%',      labelAr: '٧٢٪' }, // ↑68% — Gartner AI/ML demand-planning adoption wave 2024
    'manufacturing':     { value: 60,   label: '60%',      labelAr: '٦٠٪' },
    'healthcare-pharma': { value: 72,   label: '72%',      labelAr: '٧٢٪' },
    'oil-gas':           { value: 55,   label: '55%',      labelAr: '٥٥٪' },
    'government':        { value: 48,   label: '48%',      labelAr: '٤٨٪' },
    'logistics':         { value: 74,   label: '74%',      labelAr: '٧٤٪' }, // ↑70% — Gartner 2024 logistics AI adoption
    'food-beverage':     { value: 62,   label: '62%',      labelAr: '٦٢٪' },
    'construction':      { value: 50,   label: '50%',      labelAr: '٥٠٪' },
  },

  /** Inventory Turns/yr — higher is better */
  turns: {
    'retail-fmcg':       { value: 8,    label: '8/yr',     labelAr: '٨/سنة' },
    'manufacturing':     { value: 5,    label: '5/yr',     labelAr: '٥/سنة' },
    'healthcare-pharma': { value: 4,    label: '4/yr',     labelAr: '٤/سنة' },
    'oil-gas':           { value: 3,    label: '3/yr',     labelAr: '٣/سنة' },
    'government':        { value: 2,    label: '2/yr',     labelAr: '٢/سنة' },
    'logistics':         { value: 9,    label: '9/yr',     labelAr: '٩/سنة' },
    'food-beverage':     { value: 9,    label: '9/yr',     labelAr: '٩/سنة' },
    'construction':      { value: 3,    label: '3/yr',     labelAr: '٣/سنة' },
  },

  // ─── Procurement Excellence ───────────────────────────────────────────────

  /** Procurement Savings % — higher is better */
  savings: {
    'retail-fmcg':       { value: 5.5,  label: '5.5%',     labelAr: '٥.٥٪' }, // ↑5% — CIPS Benchmarking Report 2024
    'manufacturing':     { value: 4,    label: '4%',       labelAr: '٤٪'   },
    'healthcare-pharma': { value: 3.5,  label: '3.5%',     labelAr: '٣.٥٪' },
    'oil-gas':           { value: 5.5,  label: '5.5%',     labelAr: '٥.٥٪' }, // ↑4.5% — CIPS + Hackett 2024 (commodity volatility windows)
    'government':        { value: 2.5,  label: '2.5%',     labelAr: '٢.٥٪' },
    'logistics':         { value: 4,    label: '4%',       labelAr: '٤٪'   },
    'food-beverage':     { value: 4.5,  label: '4.5%',     labelAr: '٤.٥٪' },
    'construction':      { value: 3,    label: '3%',       labelAr: '٣٪'   },
  },

  /** PO Cycle Time (days) — lower is better */
  pocycle: {
    'retail-fmcg':       { value: 18,   label: '18 days',  labelAr: '١٨ يوماً' },
    'manufacturing':     { value: 25,   label: '25 days',  labelAr: '٢٥ يوماً' },
    'healthcare-pharma': { value: 18,   label: '18 days',  labelAr: '١٨ يوماً' },
    'oil-gas':           { value: 32,   label: '32 days',  labelAr: '٣٢ يوماً' },
    'government':        { value: 38,   label: '38 days',  labelAr: '٣٨ يوماً' }, // ↓42 days — CIPS 2024 e-procurement improvement
    'logistics':         { value: 12,   label: '12 days',  labelAr: '١٢ يوماً' },
    'food-beverage':     { value: 15,   label: '15 days',  labelAr: '١٥ يوماً' },
    'construction':      { value: 45,   label: '45 days',  labelAr: '٤٥ يوماً' },
  },

  /** PO Compliance Rate % — higher is better */
  pocomp: {
    'retail-fmcg':       { value: 70,   label: '70%',      labelAr: '٧٠٪' },
    'manufacturing':     { value: 68,   label: '68%',      labelAr: '٦٨٪' },
    'healthcare-pharma': { value: 80,   label: '80%',      labelAr: '٨٠٪' },
    'oil-gas':           { value: 74,   label: '74%',      labelAr: '٧٤٪' },
    'government':        { value: 58,   label: '58%',      labelAr: '٥٨٪' },
    'logistics':         { value: 74,   label: '74%',      labelAr: '٧٤٪' },
    'food-beverage':     { value: 68,   label: '68%',      labelAr: '٦٨٪' },
    'construction':      { value: 52,   label: '52%',      labelAr: '٥٢٪' },
  },

  /** Supplier OTIF % — higher is better (shared by sotif and sotif2) */
  sotif: {
    'retail-fmcg':       { value: 78,   label: '78%',      labelAr: '٧٨٪' },
    'manufacturing':     { value: 75,   label: '75%',      labelAr: '٧٥٪' },
    'healthcare-pharma': { value: 86,   label: '86%',      labelAr: '٨٦٪' },
    'oil-gas':           { value: 78,   label: '78%',      labelAr: '٧٨٪' },
    'government':        { value: 70,   label: '70%',      labelAr: '٧٠٪' },
    'logistics':         { value: 84,   label: '84%',      labelAr: '٨٤٪' },
    'food-beverage':     { value: 78,   label: '78%',      labelAr: '٧٨٪' },
    'construction':      { value: 64,   label: '64%',      labelAr: '٦٤٪' },
  },
  sotif2: {
    'retail-fmcg':       { value: 78,   label: '78%',      labelAr: '٧٨٪' },
    'manufacturing':     { value: 75,   label: '75%',      labelAr: '٧٥٪' },
    'healthcare-pharma': { value: 86,   label: '86%',      labelAr: '٨٦٪' },
    'oil-gas':           { value: 78,   label: '78%',      labelAr: '٧٨٪' },
    'government':        { value: 70,   label: '70%',      labelAr: '٧٠٪' },
    'logistics':         { value: 84,   label: '84%',      labelAr: '٨٤٪' },
    'food-beverage':     { value: 78,   label: '78%',      labelAr: '٧٨٪' },
    'construction':      { value: 64,   label: '64%',      labelAr: '٦٤٪' },
  },

  /** Contract Coverage % — higher is better (shared ccov and cco) */
  ccov: {
    'retail-fmcg':       { value: 60,   label: '60%',      labelAr: '٦٠٪' },
    'manufacturing':     { value: 54,   label: '54%',      labelAr: '٥٤٪' },
    'healthcare-pharma': { value: 72,   label: '72%',      labelAr: '٧٢٪' },
    'oil-gas':           { value: 70,   label: '70%',      labelAr: '٧٠٪' },
    'government':        { value: 74,   label: '74%',      labelAr: '٧٤٪' },
    'logistics':         { value: 58,   label: '58%',      labelAr: '٥٨٪' },
    'food-beverage':     { value: 55,   label: '55%',      labelAr: '٥٥٪' },
    'construction':      { value: 42,   label: '42%',      labelAr: '٤٢٪' },
  },
  cco: {
    'retail-fmcg':       { value: 60,   label: '60%',      labelAr: '٦٠٪' },
    'manufacturing':     { value: 54,   label: '54%',      labelAr: '٥٤٪' },
    'healthcare-pharma': { value: 72,   label: '72%',      labelAr: '٧٢٪' },
    'oil-gas':           { value: 70,   label: '70%',      labelAr: '٧٠٪' },
    'government':        { value: 74,   label: '74%',      labelAr: '٧٤٪' },
    'logistics':         { value: 58,   label: '58%',      labelAr: '٥٨٪' },
    'food-beverage':     { value: 55,   label: '55%',      labelAr: '٥٥٪' },
    'construction':      { value: 42,   label: '42%',      labelAr: '٤٢٪' },
  },

  /** Time-to-Contract (days) — lower is better */
  ttc: {
    'retail-fmcg':       { value: 42,   label: '42 days',  labelAr: '٤٢ يوماً' }, // ↓45 — IACCM/WCC Survey 2024
    'manufacturing':     { value: 58,   label: '58 days',  labelAr: '٥٨ يوماً' },
    'healthcare-pharma': { value: 40,   label: '40 days',  labelAr: '٤٠ يوماً' },
    'oil-gas':           { value: 65,   label: '65 days',  labelAr: '٦٥ يوماً' },
    'government':        { value: 90,   label: '90 days',  labelAr: '٩٠ يوماً' },
    'logistics':         { value: 30,   label: '30 days',  labelAr: '٣٠ يوماً' }, // ↓35 — IACCM/WCC Survey 2024
    'food-beverage':     { value: 40,   label: '40 days',  labelAr: '٤٠ يوماً' },
    'construction':      { value: 75,   label: '75 days',  labelAr: '٧٥ يوماً' },
  },

  // ─── Lean Six Sigma ───────────────────────────────────────────────────────

  /** Process Cycle Efficiency % — higher is better (pce and pce2) */
  pce: {
    'retail-fmcg':       { value: 10,   label: '10%',      labelAr: '١٠٪' },
    'manufacturing':     { value: 8,    label: '8%',       labelAr: '٨٪'  },
    'healthcare-pharma': { value: 12,   label: '12%',      labelAr: '١٢٪' },
    'oil-gas':           { value: 6,    label: '6%',       labelAr: '٦٪'  },
    'government':        { value: 5,    label: '5%',       labelAr: '٥٪'  },
    'logistics':         { value: 14,   label: '14%',      labelAr: '١٤٪' },
    'food-beverage':     { value: 8,    label: '8%',       labelAr: '٨٪'  },
    'construction':      { value: 4,    label: '4%',       labelAr: '٤٪'  },
  },
  pce2: {
    'retail-fmcg':       { value: 10,   label: '10%',      labelAr: '١٠٪' },
    'manufacturing':     { value: 8,    label: '8%',       labelAr: '٨٪'  },
    'healthcare-pharma': { value: 12,   label: '12%',      labelAr: '١٢٪' },
    'oil-gas':           { value: 6,    label: '6%',       labelAr: '٦٪'  },
    'government':        { value: 5,    label: '5%',       labelAr: '٥٪'  },
    'logistics':         { value: 14,   label: '14%',      labelAr: '١٤٪' },
    'food-beverage':     { value: 8,    label: '8%',       labelAr: '٨٪'  },
    'construction':      { value: 4,    label: '4%',       labelAr: '٤٪'  },
  },

  /** Sigma Level (σ) — higher is better */
  sigma: {
    'retail-fmcg':       { value: 2.8,  label: '2.8σ',     labelAr: '٢.٨σ' },
    'manufacturing':     { value: 2.5,  label: '2.5σ',     labelAr: '٢.٥σ' },
    'healthcare-pharma': { value: 3.2,  label: '3.2σ',     labelAr: '٣.٢σ' },
    'oil-gas':           { value: 3.0,  label: '3.0σ',     labelAr: '٣.٠σ' },
    'government':        { value: 2.2,  label: '2.2σ',     labelAr: '٢.٢σ' },
    'logistics':         { value: 3.0,  label: '3.0σ',     labelAr: '٣.٠σ' },
    'food-beverage':     { value: 2.8,  label: '2.8σ',     labelAr: '٢.٨σ' },
    'construction':      { value: 2.0,  label: '2.0σ',     labelAr: '٢.٠σ' },
  },

  /** First-Time-Right Rate % — higher is better (ftr and ftr2) */
  ftr: {
    'retail-fmcg':       { value: 72,   label: '72%',      labelAr: '٧٢٪' },
    'manufacturing':     { value: 68,   label: '68%',      labelAr: '٦٨٪' },
    'healthcare-pharma': { value: 80,   label: '80%',      labelAr: '٨٠٪' },
    'oil-gas':           { value: 74,   label: '74%',      labelAr: '٧٤٪' },
    'government':        { value: 60,   label: '60%',      labelAr: '٦٠٪' },
    'logistics':         { value: 76,   label: '76%',      labelAr: '٧٦٪' },
    'food-beverage':     { value: 70,   label: '70%',      labelAr: '٧٠٪' },
    'construction':      { value: 60,   label: '60%',      labelAr: '٦٠٪' },
  },
  ftr2: {
    'retail-fmcg':       { value: 72,   label: '72%',      labelAr: '٧٢٪' },
    'manufacturing':     { value: 68,   label: '68%',      labelAr: '٦٨٪' },
    'healthcare-pharma': { value: 80,   label: '80%',      labelAr: '٨٠٪' },
    'oil-gas':           { value: 74,   label: '74%',      labelAr: '٧٤٪' },
    'government':        { value: 60,   label: '60%',      labelAr: '٦٠٪' },
    'logistics':         { value: 76,   label: '76%',      labelAr: '٧٦٪' },
    'food-beverage':     { value: 70,   label: '70%',      labelAr: '٧٠٪' },
    'construction':      { value: 60,   label: '60%',      labelAr: '٦٠٪' },
  },

  /** Cost of Poor Quality % — lower is better */
  copq: {
    'retail-fmcg':       { value: 7,    label: '7%',       labelAr: '٧٪'  },
    'manufacturing':     { value: 8,    label: '8%',       labelAr: '٨٪'  },
    'healthcare-pharma': { value: 4,    label: '4%',       labelAr: '٤٪'  },
    'oil-gas':           { value: 5,    label: '5%',       labelAr: '٥٪'  },
    'government':        { value: 10,   label: '10%',      labelAr: '١٠٪' },
    'logistics':         { value: 5,    label: '5%',       labelAr: '٥٪'  },
    'food-beverage':     { value: 8,    label: '8%',       labelAr: '٨٪'  },
    'construction':      { value: 10,   label: '10%',      labelAr: '١٠٪' },
  },

  // ─── Digital Transformation ───────────────────────────────────────────────

  /** ERP Module Utilisation % — higher is better */
  erpu: {
    'retail-fmcg':       { value: 58,   label: '58%',      labelAr: '٥٨٪' }, // ↑50% — McKinsey GCC Digital 2024
    'manufacturing':     { value: 50,   label: '50%',      labelAr: '٥٠٪' }, // ↑42% — McKinsey GCC Digital 2024
    'healthcare-pharma': { value: 62,   label: '62%',      labelAr: '٦٢٪' }, // ↑56% — HIMSS EMEA 2023
    'oil-gas':           { value: 48,   label: '48%',      labelAr: '٤٨٪' },
    'government':        { value: 42,   label: '42%',      labelAr: '٤٢٪' }, // ↑35% — Saudi e-Government maturity survey 2024
    'logistics':         { value: 52,   label: '52%',      labelAr: '٥٢٪' },
    'food-beverage':     { value: 42,   label: '42%',      labelAr: '٤٢٪' },
    'construction':      { value: 28,   label: '28%',      labelAr: '٢٨٪' },
  },

  /** Process Automation Rate % — higher is better */
  auto: {
    'retail-fmcg':       { value: 35,   label: '35%',      labelAr: '٣٥٪' }, // ↑28% — Hackett Group 2024
    'manufacturing':     { value: 30,   label: '30%',      labelAr: '٣٠٪' }, // ↑22% — Hackett Group 2024
    'healthcare-pharma': { value: 32,   label: '32%',      labelAr: '٣٢٪' },
    'oil-gas':           { value: 25,   label: '25%',      labelAr: '٢٥٪' },
    'government':        { value: 20,   label: '20%',      labelAr: '٢٠٪' }, // ↑14% — Saudi Digital Government Authority 2024
    'logistics':         { value: 44,   label: '44%',      labelAr: '٤٤٪' }, // ↑36% — McKinsey Logistics 2024
    'food-beverage':     { value: 22,   label: '22%',      labelAr: '٢٢٪' },
    'construction':      { value: 10,   label: '10%',      labelAr: '١٠٪' },
  },

  /** Straight-Through PO Rate % — higher is better */
  stp: {
    'retail-fmcg':       { value: 44,   label: '44%',      labelAr: '٤٤٪' }, // ↑35% — Hackett Group 2024 AI-enabled P2P
    'manufacturing':     { value: 33,   label: '33%',      labelAr: '٣٣٪' }, // ↑25% — Hackett Group 2024
    'healthcare-pharma': { value: 38,   label: '38%',      labelAr: '٣٨٪' },
    'oil-gas':           { value: 20,   label: '20%',      labelAr: '٢٠٪' },
    'government':        { value: 12,   label: '12%',      labelAr: '١٢٪' },
    'logistics':         { value: 50,   label: '50%',      labelAr: '٥٠٪' }, // ↑40% — Hackett Group 2024
    'food-beverage':     { value: 28,   label: '28%',      labelAr: '٢٨٪' },
    'construction':      { value: 8,    label: '8%',       labelAr: '٨٪'  },
  },

  /** Data Accuracy Rate % — higher is better */
  da: {
    'retail-fmcg':       { value: 78,   label: '78%',      labelAr: '٧٨٪' },
    'manufacturing':     { value: 72,   label: '72%',      labelAr: '٧٢٪' },
    'healthcare-pharma': { value: 84,   label: '84%',      labelAr: '٨٤٪' },
    'oil-gas':           { value: 76,   label: '76%',      labelAr: '٧٦٪' },
    'government':        { value: 68,   label: '68%',      labelAr: '٦٨٪' },
    'logistics':         { value: 80,   label: '80%',      labelAr: '٨٠٪' },
    'food-beverage':     { value: 74,   label: '74%',      labelAr: '٧٤٪' },
    'construction':      { value: 62,   label: '62%',      labelAr: '٦٢٪' },
  },

  // ─── Governance & Compliance ──────────────────────────────────────────────

  /** Policy Compliance Rate % — higher is better (pcr and pcr2) */
  pcr: {
    'retail-fmcg':       { value: 65,   label: '65%',      labelAr: '٦٥٪' },
    'manufacturing':     { value: 60,   label: '60%',      labelAr: '٦٠٪' },
    'healthcare-pharma': { value: 75,   label: '75%',      labelAr: '٧٥٪' },
    'oil-gas':           { value: 72,   label: '72%',      labelAr: '٧٢٪' },
    'government':        { value: 64,   label: '64%',      labelAr: '٦٤٪' },
    'logistics':         { value: 66,   label: '66%',      labelAr: '٦٦٪' },
    'food-beverage':     { value: 62,   label: '62%',      labelAr: '٦٢٪' },
    'construction':      { value: 50,   label: '50%',      labelAr: '٥٠٪' },
  },
  pcr2: {
    'retail-fmcg':       { value: 65,   label: '65%',      labelAr: '٦٥٪' },
    'manufacturing':     { value: 60,   label: '60%',      labelAr: '٦٠٪' },
    'healthcare-pharma': { value: 75,   label: '75%',      labelAr: '٧٥٪' },
    'oil-gas':           { value: 72,   label: '72%',      labelAr: '٧٢٪' },
    'government':        { value: 64,   label: '64%',      labelAr: '٦٤٪' },
    'logistics':         { value: 66,   label: '66%',      labelAr: '٦٦٪' },
    'food-beverage':     { value: 62,   label: '62%',      labelAr: '٦٢٪' },
    'construction':      { value: 50,   label: '50%',      labelAr: '٥٠٪' },
  },

  /** Audit Score /100 — higher is better */
  aud: {
    'retail-fmcg':       { value: 62,   label: '62/100',   labelAr: '٦٢/١٠٠' },
    'manufacturing':     { value: 60,   label: '60/100',   labelAr: '٦٠/١٠٠' },
    'healthcare-pharma': { value: 72,   label: '72/100',   labelAr: '٧٢/١٠٠' },
    'oil-gas':           { value: 72,   label: '72/100',   labelAr: '٧٢/١٠٠' }, // ↑68 — IOGP audit standards tightening 2023
    'government':        { value: 60,   label: '60/100',   labelAr: '٦٠/١٠٠' },
    'logistics':         { value: 64,   label: '64/100',   labelAr: '٦٤/١٠٠' },
    'food-beverage':     { value: 60,   label: '60/100',   labelAr: '٦٠/١٠٠' },
    'construction':      { value: 60,   label: '60/100',   labelAr: '٦٠/١٠٠' },
  },

  /** Maverick Spend % — lower is better */
  mav: {
    'retail-fmcg':       { value: 15,   label: '15%',      labelAr: '١٥٪' },
    'manufacturing':     { value: 20,   label: '20%',      labelAr: '٢٠٪' },
    'healthcare-pharma': { value: 10,   label: '10%',      labelAr: '١٠٪' },
    'oil-gas':           { value: 16,   label: '16%',      labelAr: '١٦٪' },
    'government':        { value: 28,   label: '28%',      labelAr: '٢٨٪' },
    'logistics':         { value: 14,   label: '14%',      labelAr: '١٤٪' },
    'food-beverage':     { value: 18,   label: '18%',      labelAr: '١٨٪' },
    'construction':      { value: 30,   label: '30%',      labelAr: '٣٠٪' },
  },

  /** Approved Supplier Adherence % — higher is better */
  asa: {
    'retail-fmcg':       { value: 74,   label: '74%',      labelAr: '٧٤٪' },
    'manufacturing':     { value: 68,   label: '68%',      labelAr: '٦٨٪' },
    'healthcare-pharma': { value: 82,   label: '82%',      labelAr: '٨٢٪' },
    'oil-gas':           { value: 76,   label: '76%',      labelAr: '٧٦٪' },
    'government':        { value: 65,   label: '65%',      labelAr: '٦٥٪' },
    'logistics':         { value: 72,   label: '72%',      labelAr: '٧٢٪' },
    'food-beverage':     { value: 68,   label: '68%',      labelAr: '٦٨٪' },
    'construction':      { value: 55,   label: '55%',      labelAr: '٥٥٪' },
  },

  // ─── Supplier Relationship Governance ────────────────────────────────────

  /** Defect Rate (PPM) — lower is better */
  ppm: {
    'retail-fmcg':       { value: 2000, label: '2000 PPM', labelAr: '٢٠٠٠ PPM' },
    'manufacturing':     { value: 2500, label: '2500 PPM', labelAr: '٢٥٠٠ PPM' },
    'healthcare-pharma': { value: 350,  label: '350 PPM',  labelAr: '٣٥٠ PPM'  }, // ↓500 — GMP enforcement tightening post-2022; ISM 2024
    'oil-gas':           { value: 1500, label: '1500 PPM', labelAr: '١٥٠٠ PPM' },
    'government':        { value: 3500, label: '3500 PPM', labelAr: '٣٥٠٠ PPM' },
    'logistics':         { value: 1800, label: '1800 PPM', labelAr: '١٨٠٠ PPM' },
    'food-beverage':     { value: 1500, label: '1500 PPM', labelAr: '١٥٠٠ PPM' },
    'construction':      { value: 4000, label: '4000 PPM', labelAr: '٤٠٠٠ PPM' },
  },

  // ─── Resiliency ───────────────────────────────────────────────────────────

  /** Mean Time to Recover (hours) — lower is better */
  mttr: {
    'retail-fmcg':       { value: 60,   label: '60h',      labelAr: '٦٠ ساعة' }, // ↓72h — McKinsey Supply Chain Resilience 2024
    'manufacturing':     { value: 168,  label: '168h',     labelAr: '١٦٨ ساعة' },
    'healthcare-pharma': { value: 48,   label: '48h',      labelAr: '٤٨ ساعة' },
    'oil-gas':           { value: 240,  label: '240h',     labelAr: '٢٤٠ ساعة' },
    'government':        { value: 240,  label: '240h',     labelAr: '٢٤٠ ساعة' },
    'logistics':         { value: 36,   label: '36h',      labelAr: '٣٦ ساعة' }, // ↓48h — McKinsey Supply Chain Resilience 2024
    'food-beverage':     { value: 72,   label: '72h',      labelAr: '٧٢ ساعة' },
    'construction':      { value: 240,  label: '240h',     labelAr: '٢٤٠ ساعة' },
  },

  /** Revenue at Risk % — lower is better */
  rar: {
    'retail-fmcg':       { value: 10,   label: '10%',      labelAr: '١٠٪' },
    'manufacturing':     { value: 14,   label: '14%',      labelAr: '١٤٪' },
    'healthcare-pharma': { value: 8,    label: '8%',       labelAr: '٨٪'  },
    'oil-gas':           { value: 18,   label: '18%',      labelAr: '١٨٪' },
    'government':        { value: 12,   label: '12%',      labelAr: '١٢٪' },
    'logistics':         { value: 8,    label: '8%',       labelAr: '٨٪'  },
    'food-beverage':     { value: 12,   label: '12%',      labelAr: '١٢٪' },
    'construction':      { value: 18,   label: '18%',      labelAr: '١٨٪' },
  },

  // ─── Value Engineering ────────────────────────────────────────────────────

  /** VE Savings % Spend — higher is better */
  ves: {
    'retail-fmcg':       { value: 4,    label: '4%',       labelAr: '٤٪'   },
    'manufacturing':     { value: 4,    label: '4%',       labelAr: '٤٪'   },
    'healthcare-pharma': { value: 3,    label: '3%',       labelAr: '٣٪'   },
    'oil-gas':           { value: 5,    label: '5%',       labelAr: '٥٪'   },
    'government':        { value: 2.5,  label: '2.5%',     labelAr: '٢.٥٪' },
    'logistics':         { value: 3.5,  label: '3.5%',     labelAr: '٣.٥٪' },
    'food-beverage':     { value: 4,    label: '4%',       labelAr: '٤٪'   },
    'construction':      { value: 3.5,  label: '3.5%',     labelAr: '٣.٥٪' },
  },

  /** Should-Cost Variance % — lower is better */
  scv: {
    'retail-fmcg':       { value: 15,   label: '15%',      labelAr: '١٥٪' },
    'manufacturing':     { value: 18,   label: '18%',      labelAr: '١٨٪' },
    'healthcare-pharma': { value: 12,   label: '12%',      labelAr: '١٢٪' },
    'oil-gas':           { value: 14,   label: '14%',      labelAr: '١٤٪' },
    'government':        { value: 25,   label: '25%',      labelAr: '٢٥٪' },
    'logistics':         { value: 14,   label: '14%',      labelAr: '١٤٪' },
    'food-beverage':     { value: 16,   label: '16%',      labelAr: '١٦٪' },
    'construction':      { value: 22,   label: '22%',      labelAr: '٢٢٪' },
  },

  // ─── Sustainability / ESG ─────────────────────────────────────────────────

  /** Local Content / Iktva % — higher is better */
  lc: {
    'retail-fmcg':       { value: 25,   label: '25%',      labelAr: '٢٥٪' },
    'manufacturing':     { value: 36,   label: '36%',      labelAr: '٣٦٪' }, // ↑30% — Vision 2030 manufacturing localisation progress 2023
    'healthcare-pharma': { value: 18,   label: '18%',      labelAr: '١٨٪' },
    'oil-gas':           { value: 50,   label: '50%',      labelAr: '٥٠٪' }, // ↑38% — Saudi Aramco IKTVA 2023: 54% achieved; peer GCC O&G avg ≈50%
    'government':        { value: 48,   label: '48%',      labelAr: '٤٨٪' }, // ↑40% — Saudi IKTVA mandate + GCC public-sector localisation 2023
    'logistics':         { value: 22,   label: '22%',      labelAr: '٢٢٪' },
    'food-beverage':     { value: 28,   label: '28%',      labelAr: '٢٨٪' },
    'construction':      { value: 40,   label: '40%',      labelAr: '٤٠٪' }, // ↑34% — NEOM & giga-project local procurement mandates 2023
  },
};

/**
 * Returns the industry-specific benchmark for a given KPI ID,
 * or `null` if no industry-specific entry exists (fall back to KpiDef defaults).
 */
export function getIndustryBenchmark(
  kpiId: string,
  industryKey: IndustryKey | null,
): IndustryBenchmarkEntry | null {
  if (!industryKey) return null;
  return INDUSTRY_KPI_BENCHMARKS[kpiId]?.[industryKey] ?? null;
}
