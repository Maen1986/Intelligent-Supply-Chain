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
import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts';
import { Plus, Trash2, Pencil, X } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { API_BASE } from '@/lib/apiBase';
import { safeSetItem } from '@/lib/storage';
import {
  type SupplierRecord,
  type KraljicItemLite,
  type SupplierCategoryShare,
  type CARRecord,
  type KraljicQuadrant,
  type CARCategory,
  type CARStatus,
  type ScorecardDimension,
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
// Persistence layer (SI Module 07 -- added 17 Sep 2026, closing the gap
// disclosed in docs/SI_Module07_PerformanceRecovery_Worked_Example.md
// Section 7/11: "None yet ... logged here explicitly as the natural next
// step"). Mirrors SupplierDependencyCheck.tsx's server-sync-with-
// localStorage-fallback block exactly (see that file's header for the full
// rationale): whole-list PUT, localStorage remains the source of truth on
// fetch failure, an unauthenticated visitor gets a local-only experience.
// Deliberately does NOT touch categoryItems/shares (the SAR exposure KPI's
// MOCK basis, see supplierRecoveryPortfolio.ts's file header) -- that stays
// the existing constructed dataset; #668 (a real per-supplier spend field
// in Module 05) is a separate, out-of-scope gap per the owner's own 17 Sep
// 2026 scoping decision.
// ---------------------------------------------------------------------------

const MY_PORTFOLIO_STORAGE_KEY = 'isc-supplier-recovery-portfolio-v1';

function newSupplierId(): string {
  return `sup-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
function newCarId(): string {
  return `car-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function emptySupplier(): SupplierRecord {
  return {
    supplierId: newSupplierId(),
    name: '',
    category: '',
    quadrant: 'non-critical',
    quadrantPriorQuarter: null,
    scoreHistory12mo: [80, 80, 80],
    cars: [],
  };
}

function emptyCar(supplierId: string): CARRecord {
  return {
    id: newCarId(),
    supplierId,
    category: 'delivery',
    scorecardDimension: 'delivery',
    rootCause: '',
    status: 'open',
    createdAt: ASOF,
    closedAt: null,
  };
}

function loadMyEntries(): SupplierRecord[] {
  try {
    const raw = localStorage.getItem(MY_PORTFOLIO_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

interface ServerSupplierEntryRow {
  id: number;
  clientKey: string;
  name: string;
  data: SupplierRecord;
  updatedAt: string;
}
function serverRowToSupplier(row: ServerSupplierEntryRow): SupplierRecord {
  return { ...row.data, supplierId: row.clientKey, name: row.name };
}
function supplierToPayload(s: SupplierRecord) {
  return { clientKey: s.supplierId, name: s.name, data: s };
}


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
  const [portfolioMode, setPortfolioMode] = useState<'demo' | 'mine'>('demo');
  const [myEntries, setMyEntries] = useState<SupplierRecord[]>(loadMyEntries);
  const [editingSupplier, setEditingSupplier] = useState<SupplierRecord | null>(null);

  // ── Server sync ("mine" mode only -- added 17 Sep 2026, see file header
  // above the ASOF constant for the full rationale). Mirrors
  // SupplierDependencyCheck.tsx's sync block exactly. ──
  const { user } = useAuth();
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const serverLoadedForUserId = useRef<number | null>(null);
  const bootstrapSettled = useRef(false);
  const localWinsDuringBootstrap = useRef(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const myEntriesRef = useRef<SupplierRecord[]>(myEntries);
  myEntriesRef.current = myEntries;

  const syncToServerImmediate = useCallback((list: SupplierRecord[]) => {
    if (!user) return;
    setSyncStatus('saving');
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/supplier-recovery-entries`, {
          method: 'PUT', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entries: list.map(supplierToPayload) }),
        });
        setSyncStatus(res.ok ? 'saved' : 'error');
        if (res.ok) setTimeout(() => setSyncStatus('idle'), 2500);
      } catch {
        setSyncStatus('error');
      }
    }, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  const syncToServer = useCallback((list: SupplierRecord[]) => {
    if (!user) return;
    if (!bootstrapSettled.current) { localWinsDuringBootstrap.current = true; return; }
    syncToServerImmediate(list);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, syncToServerImmediate]);

  const persistMyEntries = useCallback((next: SupplierRecord[]) => {
    setMyEntries(next);
    safeSetItem(MY_PORTFOLIO_STORAGE_KEY, JSON.stringify(next));
    syncToServer(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!user) {
      if (serverLoadedForUserId.current !== null) {
        serverLoadedForUserId.current = null;
        bootstrapSettled.current = false;
        localWinsDuringBootstrap.current = false;
        setSyncStatus('idle');
      }
      return;
    }
    if (serverLoadedForUserId.current === user.id) return;
    serverLoadedForUserId.current = user.id;
    bootstrapSettled.current = false;
    localWinsDuringBootstrap.current = false;
    const bootstrapUserId = user.id;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/supplier-recovery-entries`, { credentials: 'include' });
        if (serverLoadedForUserId.current !== bootstrapUserId) return;
        if (res.ok) {
          const data = await res.json() as { ok: boolean; entries: ServerSupplierEntryRow[] };
          if (data.ok && Array.isArray(data.entries) && data.entries.length > 0) {
            if (!localWinsDuringBootstrap.current) {
              const converted = data.entries.map(serverRowToSupplier);
              setMyEntries(converted);
              safeSetItem(MY_PORTFOLIO_STORAGE_KEY, JSON.stringify(converted));
            }
          } else if (!localWinsDuringBootstrap.current) {
            const current = myEntriesRef.current;
            if (current && current.length > 0) syncToServerImmediate(current);
          }
        }
      } catch { /* offline -- localStorage keeps working */ }
      bootstrapSettled.current = true;
      if (localWinsDuringBootstrap.current) {
        const current = myEntriesRef.current;
        if (current) syncToServerImmediate(current);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const suppliers = portfolioMode === 'mine' ? myEntries : (showEmptyState ? [] : DEMO_SUPPLIERS);
  const categoryItems = portfolioMode === 'mine' ? DEMO_CATEGORY_ITEMS : (showEmptyState ? [] : DEMO_CATEGORY_ITEMS);
  const shares = portfolioMode === 'mine' ? DEMO_SHARES : (showEmptyState ? [] : DEMO_SHARES);

  function upsertSupplier(next: SupplierRecord) {
    const idx = myEntries.findIndex((s) => s.supplierId === next.supplierId);
    const updated = idx === -1 ? [...myEntries, next] : myEntries.map((s, i) => (i === idx ? next : s));
    persistMyEntries(updated);
    setEditingSupplier(null);
  }
  function deleteSupplier(supplierId: string) {
    persistMyEntries(myEntries.filter((s) => s.supplierId !== supplierId));
  }
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
    exposureExcludedNote: (n: number) => isAr
      ? `${n} ${n === 1 ? 'مورد واحد' : 'موردون'} قيد التصعيد ببيانات فئة غير مطابقة لمرجع Kraljic -- غير مُدرَج في الإجمالي (بيانات غير كافية، وليس صفراً)`
      : `${n} escalated supplier${n === 1 ? '' : 's'} excluded from this total -- category has no matching Kraljic reference (insufficient data, not zero risk)`,
    modeDemo: isAr ? 'المثال التوضيحي (الروابي)' : 'Worked Example (Al-Rawabi)',
    modeMine: isAr ? 'محفظتي' : 'My Portfolio',
    addSupplier: isAr ? 'إضافة مورد' : 'Add supplier',
    editSupplier: isAr ? 'تعديل المورد' : 'Edit supplier',
    myPortfolioTitle: isAr ? 'موردوّ محفظتي' : 'My Suppliers',
    myPortfolioEmpty: isAr
      ? 'لم تُضف أي موردين بعد. أضف مورداً لبدء بناء محفظتك الخاصة -- تُحفظ بياناتك تلقائياً.'
      : 'No suppliers added yet. Add one to start building your own portfolio -- your data is saved automatically.',
    savingLabel: isAr ? 'جارٍ الحفظ...' : 'Saving...',
    savedLabel: isAr ? 'تم الحفظ' : 'Saved',
    errorLabel: isAr ? 'تعذّر الحفظ (محفوظ محلياً)' : 'Save failed (kept locally)',
    signInNote: isAr
      ? 'سجّل الدخول لحفظ محفظتك على الخادم -- تُحفظ محلياً في هذا المتصفح حتى ذلك الحين.'
      : 'Sign in to save your portfolio to the server -- it stays saved locally in this browser until then.',
    deleteConfirm: isAr ? 'حذف' : 'Delete',
    editAction: isAr ? 'تعديل' : 'Edit',
  };

  return (
    <div className={`min-h-screen bg-slate-50 px-4 sm:px-6 lg:px-10 py-8 ${isAr ? 'rtl text-right' : 'ltr text-left'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#082C6B]">{t.title}</h1>
            <p className="text-sm text-slate-600 mt-1">{t.subtitle}</p>
          </div>
          {portfolioMode === 'demo' && (
            <button
              type="button"
              onClick={() => setShowEmptyState((v) => !v)}
              className="shrink-0 text-xs font-semibold px-3 py-2 rounded-lg border border-[#082C6B]/20 text-[#082C6B] hover:bg-[#082C6B]/5 transition-colors"
            >
              {showEmptyState ? t.emptyToggleOff : t.emptyToggleOn}
            </button>
          )}
        </div>

        {/* Mode tabs -- worked example (unchanged, pre-existing, QA'd demo)
            vs. a user's own persisted, editable portfolio (added 17 Sep 2026). */}
        <div className="flex flex-wrap items-center gap-1.5 mb-6" role="group" aria-label={isAr ? 'اختيار مصدر البيانات' : 'Select data source'}>
          {(['demo', 'mine'] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={portfolioMode === m}
              onClick={() => setPortfolioMode(m)}
              className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-colors ${
                portfolioMode === m ? 'bg-[#082C6B] border-[#082C6B] text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {m === 'demo' ? t.modeDemo : t.modeMine}
            </button>
          ))}
          {portfolioMode === 'mine' && (
            <>
              <button
                type="button"
                onClick={() => setEditingSupplier(emptySupplier())}
                className="text-xs font-semibold px-3 py-2 rounded-lg border border-[#082C6B] bg-[#082C6B] text-white hover:bg-[#0a3a8c] transition-colors inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                {t.addSupplier}
              </button>
              {user ? (
                syncStatus !== 'idle' && (
                  <span className="text-[11px] text-slate-500">
                    {syncStatus === 'saving' ? t.savingLabel : syncStatus === 'saved' ? t.savedLabel : t.errorLabel}
                  </span>
                )
              ) : (
                <span className="text-[11px] text-slate-500">{t.signInNote}</span>
              )}
            </>
          )}
        </div>

        {/* My Portfolio management -- add/edit/delete a real, persisted
            SupplierRecord. Real <table>/<button> elements, keyboard-reachable,
            no hover-only affordances (Section-9-style QA discipline). */}
        {portfolioMode === 'mine' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
            <h2 className="text-sm font-bold text-slate-800 mb-3">{t.myPortfolioTitle} ({myEntries.length})</h2>
            {myEntries.length === 0 ? (
              <p className="text-xs text-slate-500">{t.myPortfolioEmpty}</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    <th className={isAr ? 'text-right py-2' : 'text-left py-2'}>{isAr ? 'المورد' : 'Supplier'}</th>
                    <th className={isAr ? 'text-right py-2' : 'text-left py-2'}>{isAr ? 'الفئة' : 'Category'}</th>
                    <th className={isAr ? 'text-right py-2' : 'text-left py-2'}>{isAr ? 'الربع' : 'Quadrant'}</th>
                    <th className={isAr ? 'text-right py-2' : 'text-left py-2'}>{isAr ? 'الطلبات' : 'CARs'}</th>
                    <th className={isAr ? 'text-right py-2' : 'text-left py-2'} />
                  </tr>
                </thead>
                <tbody>
                  {myEntries.map((s) => (
                    <tr key={s.supplierId} className="border-b border-slate-50 last:border-0">
                      <td className="py-2 font-semibold text-slate-800">{s.name || (isAr ? '(بدون اسم)' : '(unnamed)')}</td>
                      <td className="py-2 text-slate-600">{s.category || '—'}</td>
                      <td className="py-2 text-slate-600">{isAr ? QUADRANT_META[s.quadrant].labelAr : QUADRANT_META[s.quadrant].label}</td>
                      <td className="py-2 text-slate-600">{s.cars.length}</td>
                      <td className="py-2">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => setEditingSupplier(s)}
                            aria-label={`${t.editAction}: ${s.name}`}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                          >
                            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSupplier(s.supplierId)}
                            aria-label={`${t.deleteConfirm}: ${s.name}`}
                            className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {editingSupplier && (
          <SupplierEditorForm
            supplier={editingSupplier}
            isAr={isAr}
            onCancel={() => setEditingSupplier(null)}
            onSave={upsertSupplier}
          />
        )}

        {/* KPI row -- every value from kpis, a real computePortfolioKPIs() call above */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <KpiCard label={t.kpiEscalation} value={String(kpis.suppliersInEscalation)} sub={`/ ${kpis.totalActiveSuppliers}`} critical={kpis.suppliersInEscalation > 0} />
          <KpiCard
            label={t.kpiExposure}
            value={fmtSAR(kpis.totalExposureAtRiskSAR, isAr)}
            sub={kpis.exposureInsufficientDataCount > 0
              ? `${t.mockBadge} \u00b7 ${t.exposureExcludedNote(kpis.exposureInsufficientDataCount)}`
              : t.mockBadge}
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
                            {row.detection.shockFlag && (
                              <span
                                className="ml-1 mr-1 inline-block px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[9px] font-bold align-middle"
                                title={isAr ? row.detection.shockRuleSourceAr : row.detection.shockRuleSourceEn}
                              >
                                {isAr ? 'صدمة فترة واحدة' : 'SHOCK'}
                                {row.detection.shockChangePct !== null ? ` ${row.detection.shockChangePct.toFixed(0)}%` : ''}
                              </span>
                            )}
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
              {watchlist.some((r) => r.detection.shockFlag) && (
                <p className="text-[10px] text-slate-400 mt-1">
                  {isAr
                    ? 'شارة \u201cصدمة\u201d: تغيّر فردي بين آخر فترتين يتجاوز الحد المصدره من اتفاقية الوحدة 06 (maxIntraPeriodSwingPct)، مستقل عن قراءة الاتجاه العامة.'
                    : 'SHOCK badge: a single period-over-period swing past the Module-06-sourced threshold (maxIntraPeriodSwingPct convention), independent of the whole-series trend read above.'}
                </p>
              )}
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

// ---------------------------------------------------------------------------
// SupplierEditorForm -- real add/edit UI for a user's own persisted
// SupplierRecord (added 17 Sep 2026, closing Module 07's persistence gap).
// Real <input>/<select>/<button> elements throughout, keyboard-reachable,
// no hover-only affordances -- same accessibility discipline already
// applied to this page's watchlist and every other input-bearing page in
// this app (see e.g. LocalContentICVCheck.tsx's NumberField).
// ---------------------------------------------------------------------------

const CAR_CATEGORY_OPTIONS: CARCategory[] = ['quality', 'delivery', 'compliance', 'safety', 'documentation', 'other'];
const CAR_STATUS_OPTIONS: CARStatus[] = ['open', 'in-progress', 'closed'];
const SCORECARD_DIMENSION_OPTIONS: ScorecardDimension[] = ['delivery', 'quality', 'cost', 'compliance', 'innovation', 'relationship'];
const QUADRANT_OPTIONS: KraljicQuadrant[] = ['strategic', 'leverage', 'bottleneck', 'non-critical'];

const CAR_CATEGORY_LABEL: Record<CARCategory, { en: string; ar: string }> = {
  quality: { en: 'Quality', ar: 'الجودة' },
  delivery: { en: 'Delivery', ar: 'التسليم' },
  compliance: { en: 'Compliance', ar: 'الامتثال' },
  safety: { en: 'Safety', ar: 'السلامة' },
  documentation: { en: 'Documentation', ar: 'التوثيق' },
  other: { en: 'Other', ar: 'أخرى' },
};
const CAR_STATUS_LABEL: Record<CARStatus, { en: string; ar: string }> = {
  open: { en: 'Open', ar: 'مفتوح' },
  'in-progress': { en: 'In progress', ar: 'قيد التنفيذ' },
  closed: { en: 'Closed', ar: 'مغلق' },
};

function SupplierEditorForm({
  supplier, isAr, onCancel, onSave,
}: {
  supplier: SupplierRecord;
  isAr: boolean;
  onCancel: () => void;
  onSave: (s: SupplierRecord) => void;
}) {
  const [draft, setDraft] = useState<SupplierRecord>(supplier);
  const isNew = !supplier.name && supplier.scoreHistory12mo.length <= 3 && supplier.cars.length === 0;

  const canSave = draft.name.trim().length > 0 && draft.category.trim().length > 0 && draft.scoreHistory12mo.length > 0;

  function updateHistoryAt(i: number, v: number) {
    setDraft((d) => ({ ...d, scoreHistory12mo: d.scoreHistory12mo.map((h, idx) => (idx === i ? v : h)) }));
  }
  function addPeriod() {
    setDraft((d) => ({ ...d, scoreHistory12mo: [...d.scoreHistory12mo, d.scoreHistory12mo[d.scoreHistory12mo.length - 1] ?? 80] }));
  }
  function removePeriod(i: number) {
    setDraft((d) => ({ ...d, scoreHistory12mo: d.scoreHistory12mo.filter((_, idx) => idx !== i) }));
  }

  function addCar() {
    setDraft((d) => ({ ...d, cars: [...d.cars, emptyCar(d.supplierId)] }));
  }
  function updateCar(i: number, patch: Partial<CARRecord>) {
    setDraft((d) => ({ ...d, cars: d.cars.map((c, idx) => (idx === i ? { ...c, ...patch } : c)) }));
  }
  function removeCar(i: number) {
    setDraft((d) => ({ ...d, cars: d.cars.filter((_, idx) => idx !== i) }));
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-[#082C6B]/30 p-4 mb-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-800">
          {isNew ? (isAr ? 'إضافة مورد' : 'Add supplier') : (isAr ? 'تعديل المورد' : 'Edit supplier')}
        </h2>
        <button type="button" onClick={onCancel} aria-label={isAr ? 'إغلاق' : 'Close'} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50">
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">{isAr ? 'اسم المورد' : 'Supplier name'}</label>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#082C6B]"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">{isAr ? 'الفئة' : 'Category'}</label>
          <input
            type="text"
            value={draft.category}
            onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
            placeholder={isAr ? 'مثال: إلكتروميكانيكي' : 'e.g. Electro-mechanical'}
            className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#082C6B]"
          />
          <p className="text-[10px] text-muted-foreground mt-1.5">
            {isAr
              ? 'يُستخدم لمطابقة فئة مشتريات موجودة لتقدير التعرّض؛ فئة جديدة تعرض "بيانات غير كافية" بصدق بدلاً من رقم ملفّق.'
              : 'Used to match an existing spend category for the exposure estimate; a novel category honestly shows "insufficient data" rather than a fabricated figure.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{isAr ? 'الربع الاستراتيجي (الحالي)' : 'Kraljic quadrant (current)'}</p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={isAr ? 'الربع الحالي' : 'Current quadrant'}>
            {QUADRANT_OPTIONS.map((q) => (
              <button
                key={q}
                type="button"
                aria-pressed={draft.quadrant === q}
                onClick={() => setDraft((d) => ({ ...d, quadrant: q }))}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${
                  draft.quadrant === q ? 'bg-[#082C6B] border-[#082C6B] text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {isAr ? QUADRANT_META[q].labelAr : QUADRANT_META[q].label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{isAr ? 'الربع الاستراتيجي (الربع السابق، اختياري)' : 'Kraljic quadrant (prior quarter, optional)'}</p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={isAr ? 'الربع السابق' : 'Prior quadrant'}>
            <button
              type="button"
              aria-pressed={draft.quadrantPriorQuarter === null}
              onClick={() => setDraft((d) => ({ ...d, quadrantPriorQuarter: null }))}
              className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${
                draft.quadrantPriorQuarter === null ? 'bg-[#082C6B] border-[#082C6B] text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {isAr ? 'غير معروف' : 'Unknown'}
            </button>
            {QUADRANT_OPTIONS.map((q) => (
              <button
                key={q}
                type="button"
                aria-pressed={draft.quadrantPriorQuarter === q}
                onClick={() => setDraft((d) => ({ ...d, quadrantPriorQuarter: q }))}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${
                  draft.quadrantPriorQuarter === q ? 'bg-[#082C6B] border-[#082C6B] text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {isAr ? QUADRANT_META[q].labelAr : QUADRANT_META[q].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          {isAr ? 'تاريخ الأداء (بالترتيب الزمني، الأقدم أولاً)' : 'Score history (chronological, oldest first)'}
        </p>
        <div className="flex flex-wrap gap-2">
          {draft.scoreHistory12mo.map((v, i) => (
            <div key={i} className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={100}
                value={v}
                onChange={(e) => updateHistoryAt(i, Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                aria-label={isAr ? `الفترة ${i + 1}` : `Period ${i + 1}`}
                className="w-16 text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#082C6B]"
              />
              {draft.scoreHistory12mo.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePeriod(i)}
                  aria-label={isAr ? `إزالة الفترة ${i + 1}` : `Remove period ${i + 1}`}
                  className="p-1 rounded text-slate-400 hover:text-red-500"
                >
                  <X className="w-3 h-3" aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addPeriod}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" aria-hidden="true" />
            {isAr ? 'فترة' : 'Period'}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">
          {isAr
            ? 'يغذّي هذا حساب الاتجاه والتذبذب الحقيقي (computeTrend / classifyVariability) -- أقل من 4 فترات سابقة يُظهر بصدق "بيانات غير كافية".'
            : 'Feeds the real computeTrend / classifyVariability calculation -- fewer than 4 prior periods honestly shows INSUFFICIENT_DATA.'}
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{isAr ? 'طلبات الإجراء التصحيحي (CAR)' : 'Corrective Action Requests (CARs)'}</p>
          <button
            type="button"
            onClick={addCar}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" aria-hidden="true" />
            {isAr ? 'إضافة CAR' : 'Add CAR'}
          </button>
        </div>
        {draft.cars.length === 0 ? (
          <p className="text-[11px] text-slate-400">{isAr ? 'لا توجد طلبات إجراء تصحيحي.' : 'No CARs recorded.'}</p>
        ) : (
          <div className="space-y-3">
            {draft.cars.map((c, i) => (
              <div key={c.id} className="border border-slate-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">{c.id}</span>
                  <button type="button" onClick={() => removeCar(i)} aria-label={isAr ? 'إزالة CAR' : 'Remove CAR'} className="p-1 rounded text-slate-400 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">{isAr ? 'الفئة' : 'Category'}</label>
                    <select
                      value={c.category}
                      onChange={(e) => updateCar(i, { category: e.target.value as CARCategory })}
                      className="w-full text-[11px] border border-slate-200 rounded-lg px-2 py-1.5"
                    >
                      {CAR_CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{isAr ? CAR_CATEGORY_LABEL[opt].ar : CAR_CATEGORY_LABEL[opt].en}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">{isAr ? 'بُعد بطاقة الأداء' : 'Scorecard dimension'}</label>
                    <select
                      value={c.scorecardDimension}
                      onChange={(e) => updateCar(i, { scorecardDimension: e.target.value as ScorecardDimension })}
                      className="w-full text-[11px] border border-slate-200 rounded-lg px-2 py-1.5"
                    >
                      {SCORECARD_DIMENSION_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{isAr ? DIMENSION_LABEL[opt].ar : DIMENSION_LABEL[opt].en}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">{isAr ? 'الحالة' : 'Status'}</label>
                    <select
                      value={c.status}
                      onChange={(e) => updateCar(i, { status: e.target.value as CARStatus, closedAt: e.target.value === 'closed' ? (c.closedAt ?? ASOF) : null })}
                      className="w-full text-[11px] border border-slate-200 rounded-lg px-2 py-1.5"
                    >
                      {CAR_STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{isAr ? CAR_STATUS_LABEL[opt].ar : CAR_STATUS_LABEL[opt].en}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">{isAr ? 'تاريخ الفتح' : 'Opened'}</label>
                    <input
                      type="date"
                      value={c.createdAt}
                      onChange={(e) => updateCar(i, { createdAt: e.target.value })}
                      className="w-full text-[11px] border border-slate-200 rounded-lg px-2 py-1.5"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">{isAr ? 'السبب الجذري (مُعرِّف)' : 'Root cause (identifier)'}</label>
                  <input
                    type="text"
                    value={c.rootCause}
                    onChange={(e) => updateCar(i, { rootCause: e.target.value })}
                    placeholder={isAr ? 'مثال: late-shipment-root-A' : 'e.g. late-shipment-root-A'}
                    className="w-full text-[11px] border border-slate-200 rounded-lg px-2 py-1.5"
                  />
                  <p className="text-[9px] text-muted-foreground mt-1">
                    {isAr
                      ? 'استخدم نفس المُعرِّف عبر عدة CARs لنفس السبب الجذري -- هذا ما يغذّي كشف التكرار الحقيقي (assessRecurrence).'
                      : 'Reuse the same identifier across multiple CARs for the same root cause -- this is what feeds real recurrence detection (assessRecurrence).'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        <button
          type="button"
          disabled={!canSave}
          onClick={() => onSave({ ...draft, name: draft.name.trim(), category: draft.category.trim() })}
          className="text-xs font-semibold px-4 py-2 rounded-lg bg-[#082C6B] text-white hover:bg-[#0a3a8c] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isAr ? 'حفظ' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          {isAr ? 'إلغاء' : 'Cancel'}
        </button>
        {!canSave && (
          <span className="text-[11px] text-amber-600">{isAr ? 'الاسم والفئة وفترة أداء واحدة على الأقل مطلوبة.' : 'Name, category, and at least one score period are required.'}</span>
        )}
      </div>
    </div>
  );
}
