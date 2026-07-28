/**
 * GCC SKU / Inventory Classification Benchmarks
 *
 * These override the industry benchmarks for KPIs whose primary driver
 * is inventory type rather than sector.  All other KPIs continue to be
 * governed by the industry selection.
 *
 * Priority in KPIDashboard: SKU Class override → Industry override → KPI default.
 *
 * Data vintage: 2024-2025 (last audited July 2025).
 * Sources: CIPS Inventory Management Benchmarks 2024 · Gartner Supply Chain
 * Inventory Analytics 2024 · APICS/ASCM SCOR v12 · ISC practitioner data 2022-2025.
 */

export type SkuClassKey =
  | 'finished-goods'
  | 'raw-materials'
  | 'work-in-progress'
  | 'spare-parts-mro'
  | 'indirect-general'
  | 'packaging'
  | 'commodities';

export interface SkuClassMeta {
  id: SkuClassKey;
  label: string;
  labelAr: string;
  icon: string;
  description: string;
}

export const SKU_CLASSES: SkuClassMeta[] = [
  {
    id: 'finished-goods',
    label: 'Finished Goods / Traded',
    labelAr: 'بضائع جاهزة / مُتداوَلة',
    icon: '📦',
    description: 'Completed products, retail-ready goods, traded items',
  },
  {
    id: 'raw-materials',
    label: 'Raw Materials / Direct',
    labelAr: 'مواد خام / مباشرة',
    icon: '🧱',
    description: 'Production inputs, direct materials, feedstock',
  },
  {
    id: 'work-in-progress',
    label: 'Work-in-Progress (WIP)',
    labelAr: 'تحت التصنيع (WIP)',
    icon: '⚙️',
    description: 'Semi-finished goods, partially processed items',
  },
  {
    id: 'spare-parts-mro',
    label: 'Spare Parts / MRO',
    labelAr: 'قطع غيار / صيانة',
    icon: '🔧',
    description: 'Maintenance, repair, operations parts & capital spares',
  },
  {
    id: 'indirect-general',
    label: 'Indirect / General Items',
    labelAr: 'مستلزمات عامة / غير مباشرة',
    icon: '📋',
    description: 'Office supplies, consumables, low-value indirect spend',
  },
  {
    id: 'packaging',
    label: 'Packaging Materials',
    labelAr: 'مواد تغليف',
    icon: '🗳️',
    description: 'Boxes, labels, pallets, shrink wrap, primary/secondary packaging',
  },
  {
    id: 'commodities',
    label: 'Bulk Commodities',
    labelAr: 'سلع جملة / خام',
    icon: '⛟',
    description: 'Bulk liquids, chemicals, grains, metals, aggregate',
  },
];

export interface SkuBenchmarkEntry {
  value: number;
  label: string;
  labelAr: string;
}

type KpiSkuBenchmarks = Partial<Record<SkuClassKey, SkuBenchmarkEntry>>;

/**
 * SKU-class-specific GCC median benchmarks.
 * Only covers KPIs whose value is primarily driven by inventory type.
 * Intentionally sparse — process KPIs (POR, OTIF, savings, sigma…)
 * are NOT listed here; they remain governed by the industry layer.
 */
export const SKU_CLASS_KPI_BENCHMARKS: Record<string, KpiSkuBenchmarks> = {

  // ─── Inventory Turns — the most SKU-class-sensitive KPI ──────────────────
  turns: {
    'finished-goods':    { value: 8,    label: '8/yr',    labelAr: '٨/سنة'    },
    'raw-materials':     { value: 6,    label: '6/yr',    labelAr: '٦/سنة'    },
    'work-in-progress':  { value: 18,   label: '18/yr',   labelAr: '١٨/سنة'   },
    'spare-parts-mro':   { value: 1.5,  label: '1.5/yr',  labelAr: '١.٥/سنة'  },
    'indirect-general':  { value: 4,    label: '4/yr',    labelAr: '٤/سنة'    },
    'packaging':         { value: 10,   label: '10/yr',   labelAr: '١٠/سنة'   },
    'commodities':       { value: 3,    label: '3/yr',    labelAr: '٣/سنة'    },
  },

  // ─── Forecast Accuracy — intermittent demand (MRO) crushes this metric ───
  fa: {
    'finished-goods':    { value: 72,   label: '72%',     labelAr: '٧٢٪'      },
    'raw-materials':     { value: 65,   label: '65%',     labelAr: '٦٥٪'      },
    'work-in-progress':  { value: 70,   label: '70%',     labelAr: '٧٠٪'      },
    'spare-parts-mro':   { value: 38,   label: '38%',     labelAr: '٣٨٪'      },
    'indirect-general':  { value: 55,   label: '55%',     labelAr: '٥٥٪'      },
    'packaging':         { value: 68,   label: '68%',     labelAr: '٦٨٪'      },
    'commodities':       { value: 60,   label: '60%',     labelAr: '٦٠٪'      },
  },

  // ─── Buffer Stock (days supply) — safety stock norms by class ────────────
  buf: {
    'finished-goods':    { value: 15,   label: '15 days', labelAr: '١٥ يوماً' },
    'raw-materials':     { value: 30,   label: '30 days', labelAr: '٣٠ يوماً' },
    'work-in-progress':  { value: 5,    label: '5 days',  labelAr: '٥ أيام'   },
    'spare-parts-mro':   { value: 90,   label: '90 days', labelAr: '٩٠ يوماً' },
    'indirect-general':  { value: 30,   label: '30 days', labelAr: '٣٠ يوماً' },
    'packaging':         { value: 20,   label: '20 days', labelAr: '٢٠ يوماً' },
    'commodities':       { value: 45,   label: '45 days', labelAr: '٤٥ يوماً' },
  },

  // ─── Defect Rate PPM — criticality and inspection regime differ by class ─
  ppm: {
    'finished-goods':    { value: 2000, label: '2000 PPM', labelAr: '٢٠٠٠ PPM' },
    'raw-materials':     { value: 3000, label: '3000 PPM', labelAr: '٣٠٠٠ PPM' },
    'work-in-progress':  { value: 1500, label: '1500 PPM', labelAr: '١٥٠٠ PPM' },
    'spare-parts-mro':   { value: 500,  label: '500 PPM',  labelAr: '٥٠٠ PPM'  },
    'indirect-general':  { value: 5000, label: '5000 PPM', labelAr: '٥٠٠٠ PPM' },
    'packaging':         { value: 2500, label: '2500 PPM', labelAr: '٢٥٠٠ PPM' },
    'commodities':       { value: 1000, label: '1000 PPM', labelAr: '١٠٠٠ PPM' },
  },

  // ─── Maverick Spend — indirect/general items have the highest leakage ────
  mav: {
    'finished-goods':    { value: 8,    label: '8%',      labelAr: '٨٪'       },
    'raw-materials':     { value: 10,   label: '10%',     labelAr: '١٠٪'      },
    'work-in-progress':  { value: 5,    label: '5%',      labelAr: '٥٪'       },
    'spare-parts-mro':   { value: 25,   label: '25%',     labelAr: '٢٥٪'      },
    'indirect-general':  { value: 38,   label: '38%',     labelAr: '٣٨٪'      },
    'packaging':         { value: 12,   label: '12%',     labelAr: '١٢٪'      },
    'commodities':       { value: 6,    label: '6%',      labelAr: '٦٪'       },
  },

  // ─── PO Cycle Time — capital spares & MRO require longer lead times ──────
  pocycle: {
    'finished-goods':    { value: 14,   label: '14 days', labelAr: '١٤ يوماً' },
    'raw-materials':     { value: 22,   label: '22 days', labelAr: '٢٢ يوماً' },
    'work-in-progress':  { value: 10,   label: '10 days', labelAr: '١٠ أيام'  },
    'spare-parts-mro':   { value: 38,   label: '38 days', labelAr: '٣٨ يوماً' },
    'indirect-general':  { value: 8,    label: '8 days',  labelAr: '٨ أيام'   },
    'packaging':         { value: 15,   label: '15 days', labelAr: '١٥ يوماً' },
    'commodities':       { value: 20,   label: '20 days', labelAr: '٢٠ يوماً' },
  },

  // ─── Service Level During Disruption — criticality varies by class ───────
  sld: {
    'finished-goods':    { value: 45,   label: '45%',     labelAr: '٤٥٪'      },
    'raw-materials':     { value: 42,   label: '42%',     labelAr: '٤٢٪'      },
    'work-in-progress':  { value: 50,   label: '50%',     labelAr: '٥٠٪'      },
    'spare-parts-mro':   { value: 35,   label: '35%',     labelAr: '٣٥٪'      },
    'indirect-general':  { value: 60,   label: '60%',     labelAr: '٦٠٪'      },
    'packaging':         { value: 48,   label: '48%',     labelAr: '٤٨٪'      },
    'commodities':       { value: 38,   label: '38%',     labelAr: '٣٨٪'      },
  },

  // ─── Single-Source Dependency — MRO OEM parts often have no alternative ──
  ss2: {
    'finished-goods':    { value: 35,   label: '35%',     labelAr: '٣٥٪'      },
    'raw-materials':     { value: 45,   label: '45%',     labelAr: '٤٥٪'      },
    'work-in-progress':  { value: 30,   label: '30%',     labelAr: '٣٠٪'      },
    'spare-parts-mro':   { value: 68,   label: '68%',     labelAr: '٦٨٪'      },
    'indirect-general':  { value: 25,   label: '25%',     labelAr: '٢٥٪'      },
    'packaging':         { value: 40,   label: '40%',     labelAr: '٤٠٪'      },
    'commodities':       { value: 50,   label: '50%',     labelAr: '٥٠٪'      },
  },

  // ─── Dual-Source Coverage — inverse of single-source ────────────────────
  dsc: {
    'finished-goods':    { value: 40,   label: '40%',     labelAr: '٤٠٪'      },
    'raw-materials':     { value: 32,   label: '32%',     labelAr: '٣٢٪'      },
    'work-in-progress':  { value: 45,   label: '45%',     labelAr: '٤٥٪'      },
    'spare-parts-mro':   { value: 18,   label: '18%',     labelAr: '١٨٪'      },
    'indirect-general':  { value: 55,   label: '55%',     labelAr: '٥٥٪'      },
    'packaging':         { value: 38,   label: '38%',     labelAr: '٣٨٪'      },
    'commodities':       { value: 28,   label: '28%',     labelAr: '٢٨٪'      },
  },

  // ─── Should-Cost Variance — raw materials & commodities have market refs ─
  scv: {
    'finished-goods':    { value: 16,   label: '16%',     labelAr: '١٦٪'      },
    'raw-materials':     { value: 12,   label: '12%',     labelAr: '١٢٪'      },
    'work-in-progress':  { value: 10,   label: '10%',     labelAr: '١٠٪'      },
    'spare-parts-mro':   { value: 28,   label: '28%',     labelAr: '٢٨٪'      },
    'indirect-general':  { value: 22,   label: '22%',     labelAr: '٢٢٪'      },
    'packaging':         { value: 14,   label: '14%',     labelAr: '١٤٪'      },
    'commodities':       { value: 8,    label: '8%',      labelAr: '٨٪'       },
  },
};

/**
 * Returns the SKU-class-specific GCC median benchmark for a given KPI ID,
 * or `null` if no SKU-class override exists for this KPI.
 */
export function getSkuClassBenchmark(
  kpiId: string,
  skuClass: SkuClassKey | null,
): SkuBenchmarkEntry | null {
  if (!skuClass) return null;
  return SKU_CLASS_KPI_BENCHMARKS[kpiId]?.[skuClass] ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Top-Quartile targets by SKU class
//
// GCC top-25% performance for each inventory class.
// Used in the Benchmark Radar "Top Quartile" polygon when a SKU class is set.
//
// Sources: APICS/ASCM SCOR v12 Benchmarking 2024, Gartner Inventory Analytics
// 2024, Hackett Group World-Class Procurement 2024, ISC GCC practitioner data.
// ─────────────────────────────────────────────────────────────────────────────
export const SKU_CLASS_KPI_TOP_QUARTILE: Record<string, KpiSkuBenchmarks> = {

  turns: {
    'finished-goods':    { value: 14,   label: '14/yr',   labelAr: '١٤/سنة'   },
    'raw-materials':     { value: 12,   label: '12/yr',   labelAr: '١٢/سنة'   },
    'work-in-progress':  { value: 26,   label: '26/yr',   labelAr: '٢٦/سنة'   },
    'spare-parts-mro':   { value: 2.5,  label: '2.5/yr',  labelAr: '٢.٥/سنة'  },
    'indirect-general':  { value: 8,    label: '8/yr',    labelAr: '٨/سنة'    },
    'packaging':         { value: 18,   label: '18/yr',   labelAr: '١٨/سنة'   },
    'commodities':       { value: 6,    label: '6/yr',    labelAr: '٦/سنة'    },
  },

  fa: {
    'finished-goods':    { value: 88,   label: '88%',     labelAr: '٨٨٪'      },
    'raw-materials':     { value: 80,   label: '80%',     labelAr: '٨٠٪'      },
    'work-in-progress':  { value: 85,   label: '85%',     labelAr: '٨٥٪'      },
    'spare-parts-mro':   { value: 55,   label: '55%',     labelAr: '٥٥٪'      },
    'indirect-general':  { value: 70,   label: '70%',     labelAr: '٧٠٪'      },
    'packaging':         { value: 84,   label: '84%',     labelAr: '٨٤٪'      },
    'commodities':       { value: 78,   label: '78%',     labelAr: '٧٨٪'      },
  },

  pocycle: {
    'finished-goods':    { value: 7,    label: '7 days',  labelAr: '٧ أيام'   },
    'raw-materials':     { value: 10,   label: '10 days', labelAr: '١٠ أيام'  },
    'work-in-progress':  { value: 5,    label: '5 days',  labelAr: '٥ أيام'   },
    'spare-parts-mro':   { value: 18,   label: '18 days', labelAr: '١٨ يوماً' },
    'indirect-general':  { value: 3,    label: '3 days',  labelAr: '٣ أيام'   },
    'packaging':         { value: 7,    label: '7 days',  labelAr: '٧ أيام'   },
    'commodities':       { value: 10,   label: '10 days', labelAr: '١٠ أيام'  },
  },

  buf: {
    'finished-goods':    { value: 10,   label: '10 days', labelAr: '١٠ أيام'  },
    'raw-materials':     { value: 21,   label: '21 days', labelAr: '٢١ يوماً' },
    'work-in-progress':  { value: 3,    label: '3 days',  labelAr: '٣ أيام'   },
    'spare-parts-mro':   { value: 60,   label: '60 days', labelAr: '٦٠ يوماً' },
    'indirect-general':  { value: 14,   label: '14 days', labelAr: '١٤ يوماً' },
    'packaging':         { value: 14,   label: '14 days', labelAr: '١٤ يوماً' },
    'commodities':       { value: 30,   label: '30 days', labelAr: '٣٠ يوماً' },
  },

  ppm: {
    'finished-goods':    { value: 800,  label: '800 ppm',  labelAr: '٨٠٠ ppm'  },
    'raw-materials':     { value: 1200, label: '1200 ppm', labelAr: '١٢٠٠ ppm' },
    'work-in-progress':  { value: 600,  label: '600 ppm',  labelAr: '٦٠٠ ppm'  },
    'spare-parts-mro':   { value: 150,  label: '150 ppm',  labelAr: '١٥٠ ppm'  },
    'indirect-general':  { value: 2000, label: '2000 ppm', labelAr: '٢٠٠٠ ppm' },
    'packaging':         { value: 1000, label: '1000 ppm', labelAr: '١٠٠٠ ppm' },
    'commodities':       { value: 400,  label: '400 ppm',  labelAr: '٤٠٠ ppm'  },
  },

  mav: {
    'finished-goods':    { value: 3,    label: '3%',      labelAr: '٣٪'       },
    'raw-materials':     { value: 4,    label: '4%',      labelAr: '٤٪'       },
    'work-in-progress':  { value: 2,    label: '2%',      labelAr: '٢٪'       },
    'spare-parts-mro':   { value: 10,   label: '10%',     labelAr: '١٠٪'      },
    'indirect-general':  { value: 15,   label: '15%',     labelAr: '١٥٪'      },
    'packaging':         { value: 4,    label: '4%',      labelAr: '٤٪'       },
    'commodities':       { value: 2,    label: '2%',      labelAr: '٢٪'       },
  },

  sld: {
    'finished-goods':    { value: 65,   label: '65%',     labelAr: '٦٥٪'      },
    'raw-materials':     { value: 60,   label: '60%',     labelAr: '٦٠٪'      },
    'work-in-progress':  { value: 70,   label: '70%',     labelAr: '٧٠٪'      },
    'spare-parts-mro':   { value: 55,   label: '55%',     labelAr: '٥٥٪'      },
    'indirect-general':  { value: 80,   label: '80%',     labelAr: '٨٠٪'      },
    'packaging':         { value: 68,   label: '68%',     labelAr: '٦٨٪'      },
    'commodities':       { value: 58,   label: '58%',     labelAr: '٥٨٪'      },
  },

  ss2: {
    'finished-goods':    { value: 18,   label: '18%',     labelAr: '١٨٪'      },
    'raw-materials':     { value: 22,   label: '22%',     labelAr: '٢٢٪'      },
    'work-in-progress':  { value: 14,   label: '14%',     labelAr: '١٤٪'      },
    'spare-parts-mro':   { value: 45,   label: '45%',     labelAr: '٤٥٪'      },
    'indirect-general':  { value: 10,   label: '10%',     labelAr: '١٠٪'      },
    'packaging':         { value: 20,   label: '20%',     labelAr: '٢٠٪'      },
    'commodities':       { value: 28,   label: '28%',     labelAr: '٢٨٪'      },
  },

  dsc: {
    'finished-goods':    { value: 65,   label: '65%',     labelAr: '٦٥٪'      },
    'raw-materials':     { value: 58,   label: '58%',     labelAr: '٥٨٪'      },
    'work-in-progress':  { value: 68,   label: '68%',     labelAr: '٦٨٪'      },
    'spare-parts-mro':   { value: 35,   label: '35%',     labelAr: '٣٥٪'      },
    'indirect-general':  { value: 78,   label: '78%',     labelAr: '٧٨٪'      },
    'packaging':         { value: 62,   label: '62%',     labelAr: '٦٢٪'      },
    'commodities':       { value: 50,   label: '50%',     labelAr: '٥٠٪'      },
  },

  scv: {
    'finished-goods':    { value: 6,    label: '6%',      labelAr: '٦٪'       },
    'raw-materials':     { value: 4,    label: '4%',      labelAr: '٤٪'       },
    'work-in-progress':  { value: 4,    label: '4%',      labelAr: '٤٪'       },
    'spare-parts-mro':   { value: 12,   label: '12%',     labelAr: '١٢٪'      },
    'indirect-general':  { value: 8,    label: '8%',      labelAr: '٨٪'       },
    'packaging':         { value: 5,    label: '5%',      labelAr: '٥٪'       },
    'commodities':       { value: 3,    label: '3%',      labelAr: '٣٪'       },
  },
};

/**
 * Returns the SKU-class top-quartile target for a given KPI ID,
 * or `null` if no override exists.
 */
export function getSkuClassTopQuartile(
  kpiId: string,
  skuClass: SkuClassKey | null,
): SkuBenchmarkEntry | null {
  if (!skuClass) return null;
  return SKU_CLASS_KPI_TOP_QUARTILE[kpiId]?.[skuClass] ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Industry → available SKU classes
// Limits the SKU class dropdown to classes that are relevant per sector.
// ─────────────────────────────────────────────────────────────────────────────
export const INDUSTRY_SKU_CLASSES: Record<string, SkuClassKey[]> = {
  'Manufacturing':              ['finished-goods', 'raw-materials', 'work-in-progress', 'spare-parts-mro', 'packaging', 'commodities'],
  'Energy & Oil':               ['spare-parts-mro', 'raw-materials', 'commodities', 'indirect-general'],
  'Government / Public Sector': ['indirect-general', 'spare-parts-mro'],
  'Pharmaceutical':             ['finished-goods', 'raw-materials', 'packaging', 'commodities'],
  'Retail & FMCG':              ['finished-goods', 'packaging', 'indirect-general'],
  'Logistics & Transportation': ['finished-goods', 'indirect-general', 'spare-parts-mro'],
  'Construction & EPC':         ['raw-materials', 'spare-parts-mro', 'indirect-general', 'commodities'],
  'Healthcare':                 ['finished-goods', 'spare-parts-mro', 'indirect-general'],
  'Technology & ICT':           ['finished-goods', 'indirect-general'],
  'Food & Beverage':            ['finished-goods', 'raw-materials', 'packaging', 'commodities'],
  'E-commerce':                 ['finished-goods', 'packaging', 'indirect-general'],
  'Services':                   ['indirect-general'],
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-sector → suggested default SKU class
// Auto-suggested when user picks a specific sub-sector.
// ─────────────────────────────────────────────────────────────────────────────
export const SUB_SECTOR_DEFAULT_SKU: Partial<Record<string, SkuClassKey>> = {
  'Automotive & Assembly':                              'work-in-progress',
  'Aerospace & Defense':                               'spare-parts-mro',
  'Electronics & Semiconductors':                      'finished-goods',
  'FMCG Manufacturing':                                'packaging',
  'Heavy Industry & Steel':                            'raw-materials',
  'Chemicals & Petrochemicals':                        'commodities',
  'Plastics & Composites':                             'raw-materials',
  'Textiles & Apparel':                                'finished-goods',
  'Furniture & Wood Products':                         'raw-materials',
  'Medical Devices':                                   'finished-goods',
  'Oil & Gas Upstream':                                'spare-parts-mro',
  'Oil & Gas Midstream / Pipelines':                   'spare-parts-mro',
  'Oil & Gas Downstream / Refining':                   'commodities',
  'Petrochemicals':                                    'commodities',
  'Renewable Energy (Solar/Wind)':                     'spare-parts-mro',
  'Power Generation & Utilities':                      'spare-parts-mro',
  'Mining & Extractives':                              'commodities',
  'Defense & Security':                                'spare-parts-mro',
  'Healthcare Authorities':                            'finished-goods',
  'Infrastructure & Transport':                        'indirect-general',
  'Branded Pharmaceuticals':                           'finished-goods',
  'Generic Pharmaceuticals':                           'finished-goods',
  'Medical Devices & Diagnostics':                     'finished-goods',
  'Biotechnology':                                     'raw-materials',
  'Healthcare Distribution':                           'finished-goods',
  'Grocery & Supermarkets':                            'finished-goods',
  'Fashion & Apparel':                                 'finished-goods',
  'Electronics & Technology Retail':                   'finished-goods',
  'Health & Beauty':                                   'finished-goods',
  'Wholesale & Distribution':                          'finished-goods',
  'Hypermarkets & Department Stores':                  'finished-goods',
  '3PL / 4PL Providers':                              'finished-goods',
  'Cold Chain Logistics':                              'finished-goods',
  'Warehousing & Distribution Centers':                'finished-goods',
  'Port & Customs Operations':                         'commodities',
  'Residential Construction':                          'raw-materials',
  'Commercial & Office Construction':                  'raw-materials',
  'Infrastructure & Mega Projects':                    'raw-materials',
  'Oil & Gas EPC':                                     'spare-parts-mro',
  'Industrial Facilities':                             'spare-parts-mro',
  'Roads & Bridges':                                   'commodities',
  'Hospitals & Medical Centers':                       'spare-parts-mro',
  'Diagnostics & Laboratories':                        'spare-parts-mro',
  'Medical & Surgical Supplies':                       'finished-goods',
  'Home Healthcare':                                   'indirect-general',
  'Software & SaaS':                                   'indirect-general',
  'Hardware & Electronics':                            'finished-goods',
  'Food Processing & Manufacturing':                   'raw-materials',
  'Dairy Products':                                    'raw-materials',
  'Bakery & Confectionery':                            'raw-materials',
  'Beverages (Non-Alcoholic)':                         'raw-materials',
  'Halal Food Production':                             'raw-materials',
  'Agricultural Products & Trading':                   'commodities',
  'B2C E-Commerce Platform':                           'finished-goods',
  'B2B E-Commerce':                                    'finished-goods',
  'Marketplace & Aggregators':                         'finished-goods',
  'Facilities Management (FM)':                        'indirect-general',
  'Professional Services (Consulting, Legal, Audit)':  'indirect-general',
};

// ─────────────────────────────────────────────────────────────────────────────
// INDUSTRY_KPIS KPI id → SKU_CLASS_KPI_BENCHMARKS key
// Only KPIs that have meaningful SKU-class adjustments are listed.
// ─────────────────────────────────────────────────────────────────────────────
export const SKU_KPI_MAP: Record<string, string> = {
  invTurns:    'turns',
  forecastAcc: 'fa',
  procCycle:   'pocycle',
  itProcCycle: 'pocycle',
  daysSupply:  'buf',
  // wasteRate / shrinkage / spoilage intentionally omitted:
  // INDUSTRY_KPIS norm() for those KPIs expects a % value (0–15 range),
  // but SKU_CLASS_KPI_BENCHMARKS['ppm'] stores parts-per-million integers
  // (800–2000). Passing e.g. 800 into norm: v=>((15-v)/15)*100 yields −5233
  // which clamps to 0 (worst possible score). Until a unit-conversion bridge
  // exists, leave these KPIs on sector-wide data when a SKU class is active.
};
