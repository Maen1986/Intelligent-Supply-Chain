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
 * Returns the SKU-class-specific benchmark for a given KPI ID,
 * or `null` if no SKU-class override exists for this KPI.
 */
export function getSkuClassBenchmark(
  kpiId: string,
  skuClass: SkuClassKey | null,
): SkuBenchmarkEntry | null {
  if (!skuClass) return null;
  return SKU_CLASS_KPI_BENCHMARKS[kpiId]?.[skuClass] ?? null;
}
