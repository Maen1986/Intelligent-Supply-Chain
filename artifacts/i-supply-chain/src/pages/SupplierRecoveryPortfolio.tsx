/**
 * Supplier Recovery Portfolio -- SI Module 07's first real integration into
 * the app (11 Sep 2026). NOT a "closeout" of an existing page: verified
 * against the live repo this session that supplierPerformanceRecovery.ts
 * (Module 07) has never previously been committed here -- this commit is its
 * first real build, alongside this dashboard, the route, and the nav entry.
 * See the commit message / delivered closeout doc for the full history of
 * that finding.
 *
 * Every number on this page traces to a real function call in
 * @/lib/supplierRecoveryPortfolio (which itself calls the real, tested
 * @/lib/supplierPerformanceRecovery functions) run against DEMO_PORTFOLIO
 * below -- a constructed, clearly-labeled 16-supplier test dataset (an
 * extension of the Rawabi worked example), not live production data. The
 * SAR exposure KPI specifically is built from an explicit MOCK per-supplier
 * spend dataset (see buildMockSupplierSpendDataset in the lib file) because
 * no real per-supplier absolute-currency field exists anywhere in the
 * platform today (Module 05 only carries a relative share; Module 02's real
 * SAR figures live on category/item records, not supplier records -- a
 * genuine cross-module gap, logged separately, tied to #668). Every
 * mock-derived value on screen carries a visible "simulated" badge; nothing
 * mock-derived is presented as if it were real.
 *
 * Bilingual EN/AR built in from the start (Rule 5 -- bilingual by default is
 * a standing rule here, not a sequencing choice), following this app's own
 * isAr-ternary convention (see SupplierDependencyCheck.tsx) rather than a
 * new pattern. Arabic quadrant labels are the app's own real QUADRANT_META
 * strings from kraljicScoring.ts, not a fresh machine translation.
 */
import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts';
import { useLanguage } from '@/lib/LanguageContext';
import {
  type SupplierRecord,
  type KraljicItemLite,
  type SupplierCategoryShare,
  type CARRecord,
  type KraljicQuadrant,
  type CARBusinessImpact,
  type CARCustomerImpactOverride,
  computePortfolioKPIs,
  computeCarCohorts,
  computeMigrationTrails,
  computeRootCauseByDimension,
  computeRootCauseCOPQBreakdown,
  computeCOPQAttentionPriority,
  computeSupplierExposure,
  detectSupplier,
} from '@/lib/supplierRecoveryPortfolio';

const ASOF = '2026-09-10';

// ---------------------------------------------------------------------------
// DEMO PORTFOLIO -- constructed, clearly-labeled test data (NOT production).
// Extends the existing Rawabi worked example to 16 suppliers / 6 categories.
// Identical to the dataset already verified this session in run_portfolio.ts
// (real function calls, real computed KPIs) -- reproduced here so the page
// has no separate, unverified data path of its own.
// ---------------------------------------------------------------------------
function flat(n: number, len: number, noise = 0.8, seedOffset = 0): number[] {
  const out: number[] = [];
  let x = seedOffset * 977;
  for (let i = 0; i < len; i++) {
    x = (x * 9301 + 49297) % 233280;
    const r = (x / 233280 - 0.5) * 2 * noise;
    out.push(Math.max(0, Math.min(100, n + r)));
  }
  return out;
}
function ramp(from: number, to: number, len: number): number[] {
  return Array.from({ length: len }, (_, i) => from + ((to - from) * i) / (len - 1));
}

const DEMO_SUPPLIERS: SupplierRecord[] = [
  { supplierId: 'SUP-001', name: 'Al-Rawabi Manufacturing', category: 'Electro-mechanical', quadrant: 'strategic', quadrantPriorQuarter: 'strategic',
    scoreHistory12mo: [94, 89, 85, 83, 80, 77, 73, 71, 68, 67, 65, 64],
    cars: [
      { id: 'CAR-101', supplierId: 'SUP-001', category: 'delivery', scorecardDimension: 'delivery', rootCause: 'late-shipment-root-A', status: 'closed', createdAt: '2025-11-05', closedAt: '2025-12-20' },
      { id: 'CAR-114', supplierId: 'SUP-001', category: 'delivery', scorecardDimension: 'delivery', rootCause: 'late-shipment-root-A', status: 'closed', createdAt: '2026-02-10', closedAt: '2026-04-02' },
      { id: 'CAR-131', supplierId: 'SUP-001', category: 'delivery', scorecardDimension: 'delivery', rootCause: 'late-shipment-root-A', status: 'open', createdAt: '2026-08-01', closedAt: null },
    ] },
  { supplierId: 'SUP-002', name: 'Zamil Steel Co.', category: 'Electro-mechanical', quadrant: 'strategic', quadrantPriorQuarter: 'strategic',
    scoreHistory12mo: [90, 88, 91, 87, 89, 84, 79, 76, 74, 78, 75, 73],
    cars: [
      { id: 'CAR-140', supplierId: 'SUP-002', category: 'quality', scorecardDimension: 'quality', rootCause: 'coating-defect', status: 'closed', createdAt: '2026-03-15', closedAt: '2026-04-28' },
      { id: 'CAR-158', supplierId: 'SUP-002', category: 'quality', scorecardDimension: 'quality', rootCause: 'coating-defect', status: 'open', createdAt: '2026-07-20', closedAt: null },
    ] },
  { supplierId: 'SUP-003', name: 'Gulf Electronics FZE', category: 'Electro-mechanical', quadrant: 'bottleneck', quadrantPriorQuarter: 'bottleneck',
    scoreHistory12mo: [82, 80, 79, 81, 78, 76, 74, 77, 75, 72, 71, 70],
    cars: [{ id: 'CAR-162', supplierId: 'SUP-003', category: 'delivery', scorecardDimension: 'delivery', rootCause: 'lead-time-slip', status: 'open', createdAt: '2026-08-12', closedAt: null }] },
  { supplierId: 'SUP-004', name: 'Riyadh Cable Industries', category: 'Electro-mechanical', quadrant: 'leverage', quadrantPriorQuarter: 'bottleneck',
    scoreHistory12mo: flat(91, 12, 1.2, 4), cars: [] },
  { supplierId: 'SUP-005', name: 'PackCo GCC LLC', category: 'Packaging', quadrant: 'leverage', quadrantPriorQuarter: 'leverage',
    scoreHistory12mo: [88, 86, 84, 79, 74, 70, 68, 71, 74, 78, 82, 85],
    cars: [{ id: 'CAR-120', supplierId: 'SUP-005', category: 'compliance', scorecardDimension: 'compliance', rootCause: 'packaging-spec-drift', status: 'closed', createdAt: '2025-12-01', closedAt: '2026-01-15' }] },
  { supplierId: 'SUP-006', name: 'Jeddah Flexipack', category: 'Packaging', quadrant: 'non-critical', quadrantPriorQuarter: 'non-critical',
    scoreHistory12mo: flat(93, 12, 1.5, 6), cars: [] },
  { supplierId: 'SUP-007', name: 'Dammam Box Works', category: 'Packaging', quadrant: 'leverage', quadrantPriorQuarter: 'leverage',
    scoreHistory12mo: ramp(89, 72, 12),
    cars: [{ id: 'CAR-171', supplierId: 'SUP-007', category: 'quality', scorecardDimension: 'quality', rootCause: 'material-thickness-variance', status: 'open', createdAt: '2026-08-25', closedAt: null }] },
  { supplierId: 'SUP-008', name: 'TransArabia Logistics', category: 'Logistics/3PL', quadrant: 'leverage', quadrantPriorQuarter: 'strategic',
    scoreHistory12mo: [85, 83, 80, 77, 74, 76, 73, 70, 68, 71, 69, 67],
    cars: [
      { id: 'CAR-133', supplierId: 'SUP-008', category: 'delivery', scorecardDimension: 'delivery', rootCause: 'route-disruption', status: 'closed', createdAt: '2026-01-20', closedAt: '2026-03-01' },
      { id: 'CAR-149', supplierId: 'SUP-008', category: 'delivery', scorecardDimension: 'delivery', rootCause: 'route-disruption', status: 'open', createdAt: '2026-06-10', closedAt: null },
    ] },
  { supplierId: 'SUP-009', name: 'Khaleej Freight Systems', category: 'Logistics/3PL', quadrant: 'bottleneck', quadrantPriorQuarter: 'bottleneck',
    scoreHistory12mo: flat(80, 12, 2.5, 9),
    cars: [{ id: 'CAR-165', supplierId: 'SUP-009', category: 'delivery', scorecardDimension: 'delivery', rootCause: 'capacity-shortfall', status: 'open', createdAt: '2026-08-05', closedAt: null }] },
  { supplierId: 'SUP-010', name: 'Mawani Port Services', category: 'Logistics/3PL', quadrant: 'strategic', quadrantPriorQuarter: 'strategic',
    scoreHistory12mo: flat(90, 12, 1.0, 10), cars: [] },
  { supplierId: 'SUP-011', name: 'Saudi Alloy Metals', category: 'Raw materials', quadrant: 'bottleneck', quadrantPriorQuarter: 'bottleneck',
    scoreHistory12mo: [79, 77, 82, 75, 80, 74, 78, 73, 76, 72, 77, 71],
    cars: [{ id: 'CAR-155', supplierId: 'SUP-011', category: 'quality', scorecardDimension: 'quality', rootCause: 'alloy-purity-variance', status: 'open', createdAt: '2026-07-15', closedAt: null }] },
  { supplierId: 'SUP-012', name: 'Eastern Polymer Co.', category: 'Raw materials', quadrant: 'strategic', quadrantPriorQuarter: 'strategic',
    scoreHistory12mo: ramp(70, 92, 12),
    cars: [{ id: 'CAR-108', supplierId: 'SUP-012', category: 'delivery', scorecardDimension: 'delivery', rootCause: 'onboarding-ramp', status: 'closed', createdAt: '2025-10-10', closedAt: '2025-11-28' }] },
  { supplierId: 'SUP-013', name: 'Gulf Chem Supply', category: 'Raw materials', quadrant: 'leverage', quadrantPriorQuarter: 'leverage',
    scoreHistory12mo: flat(87, 12, 1.8, 13), cars: [] },
  { supplierId: 'SUP-014', name: 'NovaSoft Systems', category: 'IT/Software', quadrant: 'non-critical', quadrantPriorQuarter: 'non-critical',
    scoreHistory12mo: flat(95, 12, 0.8, 14), cars: [] },
  { supplierId: 'SUP-015', name: 'CloudArc Solutions', category: 'IT/Software', quadrant: 'leverage', quadrantPriorQuarter: 'leverage',
    scoreHistory12mo: [92, 90, 88, 85, 86, 83, 81, 84, 82, 80, 83, 81],
    cars: [{ id: 'CAR-144', supplierId: 'SUP-015', category: 'other', scorecardDimension: 'innovation', rootCause: 'roadmap-slip', status: 'closed', createdAt: '2026-02-28', closedAt: '2026-03-25' }] },
  { supplierId: 'SUP-016', name: 'Horizon Data Services', category: 'IT/Software', quadrant: 'bottleneck', quadrantPriorQuarter: 'bottleneck',
    scoreHistory12mo: flat(84, 12, 2.0, 16), cars: [] },
];

const DEMO_CATEGORY_ITEMS: KraljicItemLite[] = [
  { id: 'ITEM-EM-1', category: 'Electro-mechanical', annualSpendSAR: 22_000_000, quadrant: 'strategic' },
  { id: 'ITEM-EM-2', category: 'Electro-mechanical', annualSpendSAR: 6_400_000, quadrant: 'bottleneck' },
  { id: 'ITEM-PK-1', category: 'Packaging', annualSpendSAR: 5_100_000, quadrant: 'leverage' },
  { id: 'ITEM-LG-1', category: 'Logistics/3PL', annualSpendSAR: 14_800_000, quadrant: 'strategic' },
  { id: 'ITEM-RM-1', category: 'Raw materials', annualSpendSAR: 9_300_000, quadrant: 'bottleneck' },
  { id: 'ITEM-IT-1', category: 'IT/Software', annualSpendSAR: 3_600_000, quadrant: 'leverage' },
];

const DEMO_SHARES: SupplierCategoryShare[] = [
  { supplierId: 'SUP-001', category: 'Electro-mechanical', capacityOrSpendSharePct: 38 },
  { supplierId: 'SUP-002', category: 'Electro-mechanical', capacityOrSpendSharePct: 27 },
  { supplierId: 'SUP-003', category: 'Electro-mechanical', capacityOrSpendSharePct: 15 },
  { supplierId: 'SUP-004', category: 'Electro-mechanical', capacityOrSpendSharePct: 20 },
  { supplierId: 'SUP-005', category: 'Packaging', capacityOrSpendSharePct: 34 },
  { supplierId: 'SUP-006', category: 'Packaging', capacityOrSpendSharePct: 28 },
  { supplierId: 'SUP-007', category: 'Packaging', capacityOrSpendSharePct: 38 },
  { supplierId: 'SUP-008', category: 'Logistics/3PL', capacityOrSpendSharePct: 41 },
  { supplierId: 'SUP-009', category: 'Logistics/3PL', capacityOrSpendSharePct: 22 },
  { supplierId: 'SUP-010', category: 'Logistics/3PL', capacityOrSpendSharePct: 37 },
  { supplierId: 'SUP-011', category: 'Raw materials', capacityOrSpendSharePct: 45 },
  { supplierId: 'SUP-012', category: 'Raw materials', capacityOrSpendSharePct: 30 },
  { supplierId: 'SUP-013', category: 'Raw materials', capacityOrSpendSharePct: 25 },
  { supplierId: 'SUP-014', category: 'IT/Software', capacityOrSpendSharePct: 40 },
  { supplierId: 'SUP-015', category: 'IT/Software', capacityOrSpendSharePct: 35 },
  { supplierId: 'SUP-016', category: 'IT/Software', capacityOrSpendSharePct: 25 },
];

/**
 * DEMO/MOCK business-impact figures for the same constructed 16-supplier
 * portfolio above -- estimated dollar costs, not observed production
 * figures (basis: 'estimated' on every entry, per supplierCOPQ.ts's own
 * disclosed BusinessImpactBasis contract). Built the same way this file's
 * SAR exposure KPI already discloses its mock data (see file header):
 * realistic, clearly-labeled synthetic values, never presented as if they
 * were a live client-supplied cost. One CAR (CAR-158, the recurrence of
 * SUP-002's coating defect) is marked externalImpact so the COPQ Attention
 * Priority panel below has a real non-zero External Failure share to show,
 * not just an all-Internal-by-default dataset.
 */
const DEMO_CAR_IMPACTS: CARBusinessImpact[] = [
  { carId: 'CAR-101', description: 'Air-freight expedite to cover late shipment', estimatedCostUSD: 8_000, basis: 'estimated' },
  { carId: 'CAR-114', description: 'Air-freight expedite, recurrence of same root cause', estimatedCostUSD: 9_500, basis: 'estimated' },
  { carId: 'CAR-131', description: 'Expedite fee, open CAR', estimatedCostUSD: 6_000, basis: 'estimated' },
  { carId: 'CAR-140', description: 'Rework + line stoppage for coating defect', estimatedCostUSD: 22_000, basis: 'estimated' },
  { carId: 'CAR-158', description: 'Coating defect recurrence -- reached customer, field replacement + credit', estimatedCostUSD: 35_000, basis: 'estimated' },
  { carId: 'CAR-162', description: 'Schedule buffer cost, lead-time slip', estimatedCostUSD: 5_500, basis: 'estimated' },
  { carId: 'CAR-120', description: 'Relabeling run, packaging spec drift', estimatedCostUSD: 12_000, basis: 'estimated' },
  { carId: 'CAR-171', description: 'Incoming-inspection hold + sort, material thickness variance', estimatedCostUSD: 18_000, basis: 'estimated' },
  { carId: 'CAR-133', description: 'Reroute cost, logistics disruption', estimatedCostUSD: 14_000, basis: 'estimated' },
  { carId: 'CAR-149', description: 'Reroute cost, recurrence', estimatedCostUSD: 16_500, basis: 'estimated' },
  { carId: 'CAR-165', description: 'Spot-capacity premium, carrier shortfall', estimatedCostUSD: 9_800, basis: 'estimated' },
  { carId: 'CAR-155', description: '100% sort + re-test, alloy purity variance', estimatedCostUSD: 27_000, basis: 'estimated' },
  { carId: 'CAR-108', description: 'Onboarding-ramp support cost', estimatedCostUSD: 4_200, basis: 'estimated' },
  { carId: 'CAR-144', description: 'Roadmap-slip opportunity cost (low-confidence estimate)', estimatedCostUSD: 3_000, basis: 'estimated' },
];

const DEMO_CAR_OVERRIDES: CARCustomerImpactOverride[] = [
  { carId: 'CAR-158', customerImpact: 'external' },
];

const MOCK_IMPACT_NOTE_EN = 'Estimated $ figures on a constructed demo portfolio, not live production cost data -- see module notes.';
const MOCK_IMPACT_NOTE_AR = 'أرقام تكلفة تقديرية على محفظة تجريبية إنشائية، وليست بيانات تكلفة إنتاجية حقيقية -- راجع ملاحظات الوحدة.';

// Real QUADRANT_META values, reused verbatim from kraljicScoring.ts (Module
// 02) rather than re-invented, so this page's quadrant colors/labels never
// drift from the real Kraljic Matrix page's own.
const QUADRANT_META: Record<KraljicQuadrant, { label: string; labelAr: string; color: string }> = {
  strategic: { label: 'Strategic', labelAr: 'استراتيجي', color: '#082C6B' },
  leverage: { label: 'Leverage', labelAr: 'نفوذ سوق', color: '#065f46' },
  bottleneck: { label: 'Bottleneck', labelAr: 'نقطة اختناق', color: '#92400e' },
  'non-critical': { label: 'Non-Critical', labelAr: 'غير حرج', color: '#374151' },
};

const DIMENSION_LABEL: Record<string, { en: string; ar: string }> = {
  delivery: { en: 'Delivery', ar: 'التسليم' },
  quality: { en: 'Quality', ar: 'الجودة' },
  cost: { en: 'Cost', ar: 'التكلفة' },
  compliance: { en: 'Compliance', ar: 'الامتثال' },
  innovation: { en: 'Innovation', ar: 'الابتكار' },
  relationship: { en: 'Relationship', ar: 'العلاقة' },
};

const INTERVENTION_COLOR: Record<string, string> = {
  REPAIR: '#065f46',
  DEVELOP: '#92400e',
  COLLABORATE: '#92400e',
  REDESIGN: '#b45309',
  DUAL_SOURCE: '#b91c1c',
  MULTI_SOURCE: '#b91c1c',
  REPLACE: '#7f1d1d',
  EXIT: '#7f1d1d',
};

function fmtSAR(n: number, isAr: boolean): string {
  const abs = Math.abs(n);
  const val = abs >= 1_000_000 ? `${(abs / 1_000_000).toFixed(1)}M` : abs >= 1_000 ? `${(abs / 1_000).toFixed(0)}K` : `${abs}`;
  return isAr ? `${val} ر.س` : `SAR ${val}`;
}

function fmtUSD(n: number | null): string {
  if (n === null) return '—';
  const abs = Math.abs(n);
  const val = abs >= 1_000_000 ? `${(abs / 1_000_000).toFixed(1)}M` : abs >= 1_000 ? `${(abs / 1_000).toFixed(1)}K` : `${abs}`;
  return `$${val}`;
}

export function SupplierRecoveryPortfolio() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const [showEmptyState, setShowEmptyState] = useState(false);

  const suppliers = showEmptyState ? [] : DEMO_SUPPLIERS;
  const categoryItems = showEmptyState ? [] : DEMO_CATEGORY_ITEMS;
  const shares = showEmptyState ? [] : DEMO_SHARES;
  const allCars: CARRecord[] = useMemo(() => suppliers.flatMap((s) => s.cars), [suppliers]);

  const { kpis } = useMemo(() => computePortfolioKPIs(suppliers, categoryItems, shares, ASOF), [suppliers, categoryItems, shares]);
  const cohorts = useMemo(() => computeCarCohorts(allCars, ASOF), [allCars]);
  const trails = useMemo(() => computeMigrationTrails(suppliers), [suppliers]);
  const rootCause = useMemo(() => computeRootCauseByDimension(allCars), [allCars]);
  const rootCauseCOPQ = useMemo(
    () => computeRootCauseCOPQBreakdown(allCars, DEMO_CAR_IMPACTS, DEMO_CAR_OVERRIDES, ASOF),
    [allCars]
  );
  const copqPriority = useMemo(
    () => computeCOPQAttentionPriority(suppliers, DEMO_CAR_IMPACTS, DEMO_CAR_OVERRIDES, ASOF).filter((p) => p.priorityScore > 0),
    [suppliers]
  );
  const migrated = trails.filter((t) => t.migrated);

  const watchlist = useMemo(
    () =>
      suppliers
        .map((s) => {
          const d = detectSupplier(s);
          const exposure = computeSupplierExposure(s, categoryItems, shares);
          const openCar = s.cars.find((c) => c.status !== 'closed');
          const daysOpen = openCar ? Math.round((new Date(ASOF).getTime() - new Date(openCar.createdAt).getTime()) / 86400000) : null;
          return { supplier: s, detection: d, exposure, daysOpen };
        })
        .filter((r) => r.detection.recommendedIntervention !== 'REPAIR')
        .sort((a, b) => b.exposure.exposureSAR - a.exposure.exposureSAR),
    [suppliers, categoryItems, shares]
  );

  const rootCauseChartData = rootCause
    .filter((d) => d.count > 0)
    .map((d) => {
      const copqRow = rootCauseCOPQ.find((r) => r.dimension === d.dimension);
      return {
        name: isAr ? DIMENSION_LABEL[d.dimension]?.ar ?? d.dimension : DIMENSION_LABEL[d.dimension]?.en ?? d.dimension,
        count: d.count,
        pct: d.pctOfTotal,
        costPct: copqRow?.pctOfCostedTotal ?? 0,
        costUSD: copqRow?.costedUSD ?? null,
      };
    });

  const cohortChartData = cohorts.map((c) => ({
    name: c.quarter,
    resolved: c.resolvedWithin90dPct,
    stillOpen: c.stillOpenAtEndOfQuarter,
  }));

  const t = {
    title: isAr ? 'محفظة تعافي أداء الموردين' : 'Supplier Recovery Portfolio',
    subtitle: isAr
      ? 'الوحدة 07 من محرك ذكاء الموردين — أول بناء حقيقي متكامل مع الوحدتين 02 و05 وبطاقة الأداء'
      : 'SI Module 07 — first real build, wired to Modules 02, 05, and the CAR scorecard',
    mockBadge: isAr ? 'بيانات محاكاة/تجريبية' : 'SIMULATED / MOCK DATA',
    kpiEscalation: isAr ? 'موردون قيد التصعيد' : 'Suppliers in Escalation',
    kpiExposure: isAr ? 'التعرّض المالي المعرّض للخطر (ريال)' : 'SAR Exposure at Risk',
    kpiDays: isAr ? 'متوسط أيام التعافي' : 'Avg Days in Recovery',
    kpiFlag: isAr ? 'إشارات مزدوجة مؤكدة' : 'Confirmed Dual-Signal Flags',
    rootCauseTitle: isAr ? 'الأسباب الجذرية حسب بُعد بطاقة الأداء' : 'Root Cause by Scorecard Dimension',
    rootCauseCountLegend: isAr ? '% من عدد الطلبات' : '% of CAR count',
    rootCauseCostLegend: isAr ? '% من تكلفة COPQ المقدّرة' : '% of estimated COPQ cost',
    rootCauseCostNote: isAr ? MOCK_IMPACT_NOTE_AR : MOCK_IMPACT_NOTE_EN,
    copqPriorityTitle: isAr ? 'أولوية معالجة COPQ' : 'COPQ Attention Priority',
    copqPriorityEmpty: isAr ? 'لا توجد بيانات COPQ مكلَّفة كافية لترتيب الأولوية حالياً.' : 'No costed COPQ data yet to rank priority.',
    copqPriorityExternal: isAr ? 'حصة الفشل الخارجي' : 'External Failure share',
    cohortTitle: isAr ? 'أفواج إجراءات التصحيح (CAR) — نسبة الحل خلال 90 يوم' : 'CAR Cohorts — % Resolved Within 90 Days',
    migrationTitle: isAr ? 'مسارات انتقال الربع الاستراتيجي' : 'Quadrant Migration Trails',
    watchlistTitle: isAr ? 'قائمة المراقبة — الموردون المُصعّدون' : 'Watchlist — Escalated Suppliers',
    emptyToggleOn: isAr ? 'عرض حالة عدم وجود موردين (تجربة الحافة)' : 'Show zero-suppliers state (edge case)',
    emptyToggleOff: isAr ? 'عرض بيانات العرض التوضيحي' : 'Show demo data',
    emptyStateHeading: isAr ? 'لا يوجد موردون قيد التعافي حالياً' : 'No suppliers currently in recovery',
    emptyStateBody: isAr
      ? 'جميع الموردين ضمن الأداء الطبيعي (REPAIR)، أو لا توجد بيانات موردين محملة. لا توجد إجراءات تصعيد معلقة.'
      : 'Every supplier is at baseline performance (REPAIR), or no supplier data is loaded. No escalations pending.',
    noOpenCars: isAr ? '—' : '—',
    daysOpenLabel: isAr ? 'يوم مفتوح' : 'days open',
    exposureBasisLabel: isAr ? MOCK_NOTE_AR_SHORT : 'mock/simulated basis',
  };

  return (
    <div className={`min-h-screen bg-slate-50 px-4 sm:px-6 lg:px-10 py-8 ${isAr ? 'rtl text-right' : 'ltr text-left'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#082C6B]">{t.title}</h1>
            <p className="text-sm text-slate-600 mt-1">{t.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowEmptyState((v) => !v)}
            className="shrink-0 text-xs font-semibold px-3 py-2 rounded-lg border border-[#082C6B]/20 text-[#082C6B] hover:bg-[#082C6B]/5 transition-colors"
          >
            {showEmptyState ? t.emptyToggleOff : t.emptyToggleOn}
          </button>
        </div>

        {/* KPI row -- every value from kpis, a real computePortfolioKPIs() call above */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <KpiCard label={t.kpiEscalation} value={String(kpis.suppliersInEscalation)} sub={`/ ${kpis.totalActiveSuppliers}`} critical={kpis.suppliersInEscalation > 0} />
          <KpiCard
            label={t.kpiExposure}
            value={fmtSAR(kpis.totalExposureAtRiskSAR, isAr)}
            sub={t.mockBadge}
            subMuted
            critical={kpis.totalExposureAtRiskSAR > 20_000_000}
          />
          <KpiCard label={t.kpiDays} value={kpis.avgDaysInRecovery === null ? '—' : String(kpis.avgDaysInRecovery)} sub={isAr ? 'يوم' : 'days'} />
          <KpiCard label={t.kpiFlag} value={String(kpis.combinedSignalFlagCount)} critical={kpis.combinedSignalFlagCount > 0} />
        </div>

        {suppliers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center mb-6">
            <p className="text-lg font-semibold text-slate-700">{t.emptyStateHeading}</p>
            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">{t.emptyStateBody}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <h2 className="text-sm font-bold text-slate-800 mb-3">{t.rootCauseTitle}</h2>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={rootCauseChartData} layout="vertical" margin={{ left: isAr ? 0 : 8, right: isAr ? 8 : 16 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} orientation={isAr ? 'right' : 'left'} />
                    <Tooltip
                      formatter={(v: number, key: string, item: any) => {
                        if (key === 'pct') return [`${v}%`, t.rootCauseCountLegend];
                        if (key === 'costPct') {
                          const usd = item?.payload?.costUSD;
                          return [usd === null || usd === undefined ? (isAr ? 'بيانات غير كافية' : 'insufficient data') : `${v}% (${fmtUSD(usd)})`, t.rootCauseCostLegend];
                        }
                        return [v, key];
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 10 }} formatter={(value: string) => (value === 'pct' ? t.rootCauseCountLegend : t.rootCauseCostLegend)} />
                    <Bar dataKey="pct" radius={[0, 4, 4, 0]} name="pct">
                      {rootCauseChartData.map((_, i) => (
                        <Cell key={i} fill="#92400e" fillOpacity={0.85 - i * 0.1} />
                      ))}
                    </Bar>
                    <Bar dataKey="costPct" radius={[0, 4, 4, 0]} name="costPct" fill="#082C6B" fillOpacity={0.75} />
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-[10px] text-slate-400 mt-2">* {t.rootCauseCostNote}</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <h2 className="text-sm font-bold text-slate-800 mb-3">{t.cohortTitle}</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={cohortChartData} margin={{ left: 0, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="resolved" fill="#065f46" radius={[4, 4, 0, 0]} name={isAr ? '% محلول خلال 90 يوم' : '% resolved ≤90d'} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Migration trails -- quadrant-change highlight, real data from computeMigrationTrails() */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
              <h2 className="text-sm font-bold text-slate-800 mb-3">
                {t.migrationTitle} {migrated.length > 0 && <span className="text-xs font-normal text-amber-700">({migrated.length} {isAr ? 'تغيّر' : 'changed'})</span>}
              </h2>
              <div className="flex flex-wrap gap-2">
                {trails.map((tr) => {
                  const s = suppliers.find((x) => x.supplierId === tr.supplierId)!;
                  const meta = QUADRANT_META[tr.current];
                  const priorMeta = tr.prior ? QUADRANT_META[tr.prior] : null;
                  return (
                    <div
                      key={tr.supplierId}
                      className={`text-xs rounded-lg px-2.5 py-1.5 border ${tr.migrated ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}
                      title={`${s.name}: ${priorMeta ? (isAr ? priorMeta.labelAr : priorMeta.label) : '—'} → ${isAr ? meta.labelAr : meta.label}`}
                    >
                      <span className="font-semibold">{s.name}</span>{' '}
                      {tr.migrated && priorMeta && (
                        <span className="text-slate-400 line-through mr-1 ml-1">{isAr ? priorMeta.labelAr : priorMeta.label}</span>
                      )}
                      <span className="font-semibold" style={{ color: meta.color }}>
                        {isAr ? meta.labelAr : meta.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Watchlist -- real per-supplier rows, joining detection + exposure + CAR age */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <h2 className="text-sm font-bold text-slate-800 mb-3">{t.watchlistTitle} ({watchlist.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-200">
                      <th className={`py-2 font-semibold ${isAr ? 'text-right' : 'text-left'}`}>{isAr ? 'المورد' : 'Supplier'}</th>
                      <th className={`py-2 font-semibold ${isAr ? 'text-right' : 'text-left'}`}>{isAr ? 'الربع' : 'Quadrant'}</th>
                      <th className={`py-2 font-semibold ${isAr ? 'text-right' : 'text-left'}`}>{isAr ? 'الاتجاه' : 'Trend'}</th>
                      <th className={`py-2 font-semibold ${isAr ? 'text-right' : 'text-left'}`}>{isAr ? 'التدخل الموصى به' : 'Recommended'}</th>
                      <th className={`py-2 font-semibold ${isAr ? 'text-right' : 'text-left'}`}>{t.kpiExposure}</th>
                      <th className={`py-2 font-semibold ${isAr ? 'text-right' : 'text-left'}`}>{isAr ? 'أيام مفتوحة' : 'Days Open'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {watchlist.map((row) => {
                      const meta = QUADRANT_META[row.supplier.quadrant];
                      return (
                        <tr key={row.supplier.supplierId} className="border-b border-slate-100 last:border-0">
                          <td className="py-2 font-medium text-slate-800">{row.supplier.name}</td>
                          <td className="py-2">
                            <span className="px-2 py-0.5 rounded-full text-white text-[10px] font-semibold" style={{ backgroundColor: meta.color }}>
                              {isAr ? meta.labelAr : meta.label}
                            </span>
                          </td>
                          <td className="py-2 capitalize">{row.detection.trend}</td>
                          <td className="py-2">
                            <span
                              className="px-2 py-0.5 rounded-full text-white text-[10px] font-semibold"
                              style={{ backgroundColor: INTERVENTION_COLOR[row.detection.recommendedIntervention] ?? '#374151' }}
                            >
                              {row.detection.recommendedIntervention}
                              {row.detection.combinedSignalFlag ? ' ⚠' : ''}
                            </span>
                          </td>
                          <td className="py-2">
                            {row.exposure.exposureBasis === 'INSUFFICIENT_DATA' ? (
                              <span className="text-slate-400">{isAr ? 'بيانات غير كافية' : 'insufficient data'}</span>
                            ) : (
                              <span title={t.exposureBasisLabel}>
                                {fmtSAR(row.exposure.exposureSAR, isAr)}
                                <sup className="text-amber-600 ml-0.5">*</sup>
                              </span>
                            )}
                          </td>
                          <td className="py-2">{row.daysOpen === null ? t.noOpenCars : `${row.daysOpen} ${t.daysOpenLabel}`}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-slate-400 mt-3">
                * {isAr ? MOCK_NOTE_AR_SHORT : 'SAR exposure is a labeled mock/simulated derivation (category spend × relative supplier share), not a live production figure -- see module notes.'}
              </p>
            </div>

            {/* COPQ Attention Priority -- real cross-module ranking: Module 02's
                per-supplier Kraljic quadrant + Module 01's costed COPQ + External
                Failure share, formula fully disclosed per row (Decision Record 8.7 /
                isc-ai-output-standards #7 -- never a black-box composite score). */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 mt-6">
              <h2 className="text-sm font-bold text-slate-800 mb-1">{t.copqPriorityTitle} ({copqPriority.length})</h2>
              <p className="text-[10px] text-slate-400 mb-3">{isAr ? MOCK_IMPACT_NOTE_AR : MOCK_IMPACT_NOTE_EN}</p>
              {copqPriority.length === 0 ? (
                <p className="text-xs text-slate-400">{t.copqPriorityEmpty}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-200">
                        <th className={`py-2 font-semibold ${isAr ? 'text-right' : 'text-left'}`}>{isAr ? 'المورد' : 'Supplier'}</th>
                        <th className={`py-2 font-semibold ${isAr ? 'text-right' : 'text-left'}`}>{isAr ? 'الربع' : 'Quadrant'}</th>
                        <th className={`py-2 font-semibold ${isAr ? 'text-right' : 'text-left'}`}>{isAr ? 'COPQ المكلَّفة' : 'Costed COPQ'}</th>
                        <th className={`py-2 font-semibold ${isAr ? 'text-right' : 'text-left'}`}>{t.copqPriorityExternal}</th>
                        <th className={`py-2 font-semibold ${isAr ? 'text-right' : 'text-left'}`}>{isAr ? 'درجة الأولوية' : 'Priority Score'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {copqPriority.map((row) => {
                        const s = suppliers.find((x) => x.supplierId === row.supplierId)!;
                        const meta = QUADRANT_META[row.quadrant];
                        return (
                          <tr key={row.supplierId} className="border-b border-slate-100 last:border-0">
                            <td className="py-2 font-medium text-slate-800">{s.name}</td>
                            <td className="py-2">
                              <span className="px-2 py-0.5 rounded-full text-white text-[10px] font-semibold" style={{ backgroundColor: meta.color }}>
                                {isAr ? meta.labelAr : meta.label}
                              </span>
                            </td>
                            <td className="py-2">{fmtUSD(row.costedCOPQUSD)}</td>
                            <td className="py-2">{row.externalFailureSharePct === null ? '—' : `${row.externalFailureSharePct}%`}</td>
                            <td className="py-2 font-bold text-[#082C6B]">{row.priorityScore}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-[10px] text-slate-400 mt-3">{isAr ? copqPriority[0]?.formulaAr ?? '' : copqPriority[0]?.formulaEn ?? ''}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, subMuted, critical }: { label: string; value: string; sub?: string; subMuted?: boolean; critical?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl border p-4 ${critical ? 'border-red-300' : 'border-slate-200'}`}>
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl sm:text-3xl font-extrabold ${critical ? 'text-red-700' : 'text-[#082C6B]'}`}>{value}</p>
      {sub && <p className={`text-[11px] mt-1 ${subMuted ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>{sub}</p>}
    </div>
  );
}

const MOCK_NOTE_AR_SHORT = 'مشتق من بيانات محاكاة، وليس رقمًا إنتاجيًا حقيقيًا';
