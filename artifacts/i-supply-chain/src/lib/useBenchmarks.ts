/**
 * useBenchmarks — Fetches live GCC benchmark data from the database.
 *
 * The hook merges GCC-wide rows (industry = NULL) with any industry-specific
 * overrides added via the admin panel, falling back to hardcoded constants if
 * the API is unavailable.
 */

import { useState, useEffect, useRef } from 'react';
import { API_BASE } from './apiBase';

// ── Hardcoded fallbacks (match DB factory defaults) ──────────────────────────
const FALLBACK_KPI: Record<string, { median: number; topQ: number }> = {
  otif:        { median: 88, topQ: 95  },
  invTurns:    { median: 57, topQ: 100 },
  procCycle:   { median: 61, topQ: 100 },
  forecastAcc: { median: 73, topQ: 88  },
  procCost:    { median: 56, topQ: 100 },
  perfOrder:   { median: 87, topQ: 96  },
};

const FALLBACK_LEVER: Record<string, { maxPct: number }> = {
  catMgmt:  { maxPct: 0.13 },
  suppCons: { maxPct: 0.09 },
  procAuto: { maxPct: 0.05 },
  invOpt:   { maxPct: 0.07 },
  demand:   { maxPct: 0.04 },
};

const FALLBACK_RISK: Record<string, { gcMedian: number; gcTopQ: number }> = {
  supply:       { gcMedian: 45, gcTopQ: 22 },
  demand:       { gcMedian: 40, gcTopQ: 20 },
  operational:  { gcMedian: 48, gcTopQ: 25 },
  financial:    { gcMedian: 38, gcTopQ: 18 },
  geopolitical: { gcMedian: 42, gcTopQ: 20 },
  esg:          { gcMedian: 52, gcTopQ: 28 },
  cyber:        { gcMedian: 55, gcTopQ: 25 },
  contract:     { gcMedian: 44, gcTopQ: 20 },
};

export type BenchmarkRow = {
  id: number;
  category: string;
  item_id: string;
  industry: string | null;
  label: string | null;
  data: Record<string, number>;
};

export type BenchmarkData = {
  kpi:   Record<string, { median: number; topQ: number }>;
  lever: Record<string, { maxPct: number }>;
  risk:  Record<string, { gcMedian: number; gcTopQ: number }>;
};

function buildFromRows(rows: BenchmarkRow[], industry?: string): BenchmarkData {
  const result: BenchmarkData = {
    kpi:   { ...FALLBACK_KPI },
    lever: { ...FALLBACK_LEVER },
    risk:  { ...FALLBACK_RISK },
  };

  // Apply GCC-wide first, then industry overrides on top
  const gcwRows = rows.filter(r => r.industry === null);
  const indRows = industry ? rows.filter(r => r.industry === industry) : [];

  for (const row of [...gcwRows, ...indRows]) {
    const d = row.data;
    if (row.category === 'kpi'   && typeof d.median  === 'number') {
      result.kpi[row.item_id]   = { median: d.median, topQ: d.topQ };
    }
    if (row.category === 'lever' && typeof d.maxPct  === 'number') {
      result.lever[row.item_id] = { maxPct: d.maxPct };
    }
    if (row.category === 'risk'  && typeof d.gcMedian === 'number') {
      result.risk[row.item_id]  = { gcMedian: d.gcMedian, gcTopQ: d.gcTopQ };
    }
  }
  return result;
}

const FALLBACK_DATA: BenchmarkData = {
  kpi:   { ...FALLBACK_KPI },
  lever: { ...FALLBACK_LEVER },
  risk:  { ...FALLBACK_RISK },
};

// Singleton cache so all mounted tabs share one fetch
let cachedRows:    BenchmarkRow[] | null = null;
let fetchPromise:  Promise<BenchmarkRow[]> | null = null;

async function fetchRows(): Promise<BenchmarkRow[]> {
  if (cachedRows !== null) return cachedRows;
  if (!fetchPromise) {
    fetchPromise = fetch(`${API_BASE}/command-centre/benchmarks`)
      .then(r => r.json())
      .then((j: { ok: boolean; rows: BenchmarkRow[] }) => {
        cachedRows = j.ok ? j.rows : [];
        return cachedRows;
      })
      .catch(() => {
        cachedRows = [];
        return cachedRows;
      });
  }
  return fetchPromise;
}

export function useBenchmarks(industry?: string): { benchmarks: BenchmarkData; loading: boolean } {
  const [benchmarks, setBenchmarks] = useState<BenchmarkData>(FALLBACK_DATA);
  const [loading,    setLoading]    = useState(cachedRows === null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (cachedRows !== null) {
      setBenchmarks(buildFromRows(cachedRows, industry));
      setLoading(false);
      return;
    }
    fetchRows().then(rows => {
      if (mounted.current) {
        setBenchmarks(buildFromRows(rows, industry));
        setLoading(false);
      }
    });
    return () => { mounted.current = false; };
  }, [industry]);

  return { benchmarks, loading };
}
