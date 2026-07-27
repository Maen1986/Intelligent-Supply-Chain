/**
 * Supplier Scorecard Tool v2 — multi-supplier roster + sub-indicators
 * per dimension, weighted scoring, tier badge, RadarChart.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Printer, Plus, Trash2, Users, Download, Upload, Settings, ChevronDown, ChevronUp, RotateCcw, Sparkles, Columns, X } from 'lucide-react';
import { safeSetItem } from '@/lib/storage';
import { useAuth } from '@/lib/AuthContext';
import { API_BASE } from '@/lib/apiBase';
import { parseCsvFile, downloadCsv } from '@/lib/importCsv';
import { useAIPlan } from '@/hooks/useAIPlan';
import { AIPlanPanel } from '@/components/AIPlanPanel';
import {
  DIMS,
  SUB_INDICATORS,
  calcDimScore,
  buildScorecardCsvString,
  parseSubScoresFromRow,
  type Dimension,
  type SubIndicator,
  type SupplierRecord,
  type ScorecardConfig,
} from '@/lib/scorecardCsv';

// Re-export data constants so existing imports from this module keep working.
export { DIMS, SUB_INDICATORS };

function printZone(zone: string) {
  document.body.setAttribute('data-print', zone);
  const cleanup = () => {
    document.body.removeAttribute('data-print');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  window.print();
}

/* ─── Types ─── */
// SubIndicator, Dimension, SupplierRecord are imported from @/lib/scorecardCsv

interface RosterState {
  suppliers: SupplierRecord[];
  activeId: string;
}

/* ─── Tiers ─── */
const TIERS = [
  { label: 'Strategic',     labelAr: 'استراتيجي', min: 75, color: '#082C6B', bg: '#082C6B15' },
  { label: 'Preferred',     labelAr: 'مفضّل',     min: 55, color: '#C9A84C', bg: '#C9A84C15' },
  { label: 'Transactional', labelAr: 'معاملاتي',  min:  0, color: '#64748b', bg: '#64748b15' },
];
const TIER_OPTIONS    = ['Strategic', 'Preferred', 'Transactional', 'New Supplier'];
const TIER_OPTIONS_AR = ['استراتيجي', 'مفضّل', 'معاملاتي', 'مورّد جديد'];

/* ─── Configurable framework ─── */
// ScorecardConfig is imported from @/lib/scorecardCsv
export const DEFAULT_CONFIG: ScorecardConfig = {
  weights: { delivery: 25, quality: 25, cost: 20, compliance: 15, innovation: 10, relationship: 5 },
  tiers: { strategic: 75, preferred: 55 },
};
export const CONFIG_KEY = 'isc-tool-scorecard-config';
export function loadConfig(): ScorecardConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ScorecardConfig;
      if (parsed?.weights && parsed?.tiers) return parsed;
    }
  } catch { /* fall through */ }
  return { weights: { ...DEFAULT_CONFIG.weights }, tiers: { ...DEFAULT_CONFIG.tiers } };
}

function getTier(score: number, config: ScorecardConfig) {
  if (score >= config.tiers.strategic) return TIERS[0];
  if (score >= config.tiers.preferred) return TIERS[1];
  return TIERS[2];
}

/* ─── Compare colours (up to 3 suppliers) ─── */
const COMPARE_COLORS = ['#082C6B', '#dc2626', '#7c3aed'] as const;

function ragColor(score: number | null): string {
  if (score === null) return '#94a3b8';
  if (score >= 75) return '#22c55e';
  if (score >= 55) return '#f59e0b';
  return '#ef4444';
}

/* ─── Storage keys ─── */
const ROSTER_KEY = 'isc-tool-supplier-roster';
const LEGACY_KEY = 'isc-tool-supplier-scorecard';

function makeId(): string {
  return `sup-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function newSupplier(name = ''): SupplierRecord {
  return { id: makeId(), name, tier: 'Strategic', subScores: {} };
}

/** Returns true when `name` (trimmed, case-insensitive) matches any supplier
 *  other than the one with `excludeId`. */
export function hasCaseInsensitiveDuplicate(
  name: string,
  suppliers: SupplierRecord[],
  excludeId?: string,
): boolean {
  const needle = name.trim().toLowerCase();
  if (!needle) return false;
  return suppliers.some(s => s.id !== excludeId && s.name.toLowerCase() === needle);
}

export function loadRoster(): RosterState {
  try {
    const raw = localStorage.getItem(ROSTER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as RosterState;
      if (Array.isArray(parsed.suppliers) && parsed.suppliers.length > 0) return parsed;
    }
    // Backward-compatible migration from old single-supplier key
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const old = JSON.parse(legacy) as { name?: string; tier?: string; scores?: Record<string, string> };
      const subScores: Record<string, Record<string, string>> = {};
      if (old.scores) {
        for (const dimId of Object.keys(old.scores)) {
          const firstSub = SUB_INDICATORS[dimId]?.[0];
          if (firstSub && old.scores[dimId]) {
            subScores[dimId] = { [firstSub.id]: old.scores[dimId] };
          }
        }
      }
      const migrated = newSupplier(old.name ?? '');
      migrated.tier = old.tier ?? 'Strategic';
      migrated.subScores = subScores;
      return { suppliers: [migrated], activeId: migrated.id };
    }
  } catch { /* fall through */ }
  const initial = newSupplier();
  return { suppliers: [initial], activeId: initial.id };
}

/* ─── Score helpers ─── */
// calcDimScore is imported from @/lib/scorecardCsv

function calcWeightedScore(subScores: Record<string, Record<string, string>>, config: ScorecardConfig): number | null {
  const dimScores = DIMS.map(d => calcDimScore(d.id, subScores));
  if (dimScores.some(s => s === null)) return null;
  const totalWeight = DIMS.reduce((s, d) => s + (config.weights[d.id] ?? d.weight), 0);
  if (totalWeight === 0) return null;
  return Math.round(
    DIMS.reduce((sum, d, i) => sum + ((dimScores[i] as number) / 100) * (config.weights[d.id] ?? d.weight), 0) / totalWeight * 100,
  );
}

/* ─── Comparison CSV export ─── */
function exportComparisonToCSV(
  suppliers: SupplierRecord[],
  config: ScorecardConfig,
  isAr: boolean,
) {
  const dimScoresMatrix = DIMS.map(d => suppliers.map(s => calcDimScore(d.id, s.subScores)));
  const weightedScores = suppliers.map(s => calcWeightedScore(s.subScores, config));

  const headerLabel   = isAr ? 'البُعد / المعيار' : 'Dimension / Criterion';
  const weightLabel   = isAr ? 'الوزن (%)' : 'Weight (%)';
  const winnerLabel   = isAr ? 'الأفضل' : 'Winner';
  const weightedLabel = isAr ? 'الدرجة المرجّحة' : 'Weighted Score';
  const tieLabel      = isAr ? 'تعادل' : 'Tie';
  const incompleteLabel = isAr ? 'غير مكتمل' : 'Incomplete';
  const supplierNames = suppliers.map(s => s.name || (isAr ? 'مورّد جديد' : 'New Supplier'));

  const esc = (v: string | number) => {
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const rows: string[] = [];

  // Header row
  rows.push([headerLabel, weightLabel, ...supplierNames, winnerLabel].map(esc).join(','));

  // Dimension rows
  DIMS.forEach((d, di) => {
    const scores = dimScoresMatrix[di];
    const maxScore = Math.max(...scores.filter(v => v !== null) as number[]);
    const hasData = scores.some(v => v !== null);
    const winnerCount = scores.filter(v => v === maxScore).length;
    let winner = '—';
    if (hasData) {
      if (winnerCount >= suppliers.length) {
        winner = tieLabel;
      } else {
        let winnerIdx = -1; let winnerScore = -1;
        scores.forEach((sc, si) => { if (sc !== null && sc > winnerScore) { winnerScore = sc; winnerIdx = si; } });
        if (winnerIdx >= 0) winner = supplierNames[winnerIdx];
      }
    }
    const dimName = isAr ? d.labelAr : d.label;
    const weight = config.weights[d.id] ?? d.weight;
    const scoreCells = scores.map(sc => sc !== null ? String(sc) : '—');
    rows.push([dimName, String(weight), ...scoreCells, winner].map(esc).join(','));
  });

  // Weighted score footer row
  const wsWinnerCount = weightedScores.filter(ws => ws !== null).length;
  let wsWinner = '—';
  if (wsWinnerCount >= 2) {
    const max = Math.max(...weightedScores.filter(ws => ws !== null) as number[]);
    const winners = weightedScores.map((ws, si) => ({ ws, si })).filter(x => x.ws === max);
    wsWinner = winners.length > 1 ? tieLabel : (supplierNames[winners[0].si] ?? '—');
  }
  const wsCells = weightedScores.map(ws => ws !== null ? `${ws}/100` : incompleteLabel);
  rows.push([weightedLabel, '100', ...wsCells, wsWinner].map(esc).join(','));

  const csv = rows.join('\r\n');
  const today = new Date().toISOString().split('T')[0];
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `supplier-comparison-${today}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ─── CSV export ─── */
function exportToCSV(suppliers: SupplierRecord[], config: ScorecardConfig) {
  const csv = buildScorecardCsvString(suppliers, config);
  const today = new Date().toISOString().split('T')[0];
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `supplier-scorecards-${today}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ─── Component ─── */
interface SupplierScorecardProps { isAr: boolean; }

export function SupplierScorecardTool({ isAr }: SupplierScorecardProps) {
  const { user } = useAuth();
  const [roster, setRoster] = useState<RosterState>(loadRoster);
  const [config, setConfig] = useState<ScorecardConfig>(loadConfig);
  const [configOpen, setConfigOpen] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [localSaveFailed, setLocalSaveFailed] = useState(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track which user id we last bootstrapped from the server.
  // Storing the id (not just a boolean) means logging out → logging in as a
  // different user re-runs the bootstrap for the new account.
  const serverLoadedForUserId = useRef<number | null>(null);
  // Two refs to guard the bootstrap race cleanly:
  //
  // bootstrapSettled — flips to true only when the parallel GET(s) fully
  //   resolve (any branch).  syncToServer is a no-op while this is false so
  //   no PUT fires before we know the server state.
  //
  // localWinsDuringBootstrap — flips to true the first time the user edits
  //   while the GETs are still in flight.  When the GETs eventually resolve
  //   the bootstrap effect checks this flag; if set it skips setRoster() so
  //   the server data doesn't overwrite the in-progress local edit.
  //
  // deferredSyncRosterRef — holds the most-recent roster snapshot suppressed
  //   during bootstrap so it can be replayed once the GETs settle.
  const bootstrapSettled = useRef(false);
  const localWinsDuringBootstrap = useRef(false);
  const deferredSyncRosterRef = useRef<RosterState | null>(null);
  const [importLog, setImportLog] = useState<string[] | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  /** Snapshot taken just before a successful import; null once consumed or invalidated. */
  const preImportRosterRef = useRef<RosterState | null>(null);
  const [importUndoAvailable, setImportUndoAvailable] = useState(false);
  const [dupNameWarning, setDupNameWarning] = useState<string | null>(null);
  // pendingName tracks what the user has typed but not yet committed to the roster.
  // null means "no in-progress edit; use active.name from the roster".
  const [pendingName, setPendingName] = useState<string | null>(null);

  /* ── Server load: per-user bootstrap on login / account switch ── */
  useEffect(() => {
    if (!user) {
      // User logged out — reset to fresh localStorage state so no stale
      // data from the previous account leaks into the next login.
      if (serverLoadedForUserId.current !== null) {
        serverLoadedForUserId.current = null;
        bootstrapSettled.current = false;
        localWinsDuringBootstrap.current = false;
        deferredSyncRosterRef.current = null;
        if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
        setSyncStatus('idle');
        const freshRoster = loadRoster();
        setRoster(freshRoster);
        setConfig(loadConfig());
      }
      return;
    }
    // Already bootstrapped for this exact user — skip.
    if (serverLoadedForUserId.current === user.id) return;
    serverLoadedForUserId.current = user.id;
    bootstrapSettled.current = false;
    localWinsDuringBootstrap.current = false;
    deferredSyncRosterRef.current = null;

    (async () => {
      try {
        // Bootstrap roster and config in parallel
        const [rosterRes, configRes] = await Promise.all([
          fetch(`${API_BASE}/scorecard-roster`, { credentials: 'include' }),
          fetch(`${API_BASE}/scorecard-config`, { credentials: 'include' }),
        ]);

        // ── Roster ──
        if (rosterRes.ok) {
          const data = await rosterRes.json() as { ok: boolean; roster: RosterState | null };
          if (data.ok && data.roster && Array.isArray(data.roster.suppliers) && data.roster.suppliers.length > 0) {
            // Server has data — apply it only if the user hasn't already
            // made an edit while the GETs were in flight.
            if (!localWinsDuringBootstrap.current) {
              setRoster(data.roster);
              safeSetItem(ROSTER_KEY, JSON.stringify(data.roster));
            }
          } else {
            // Server is empty — upload whatever localStorage has, but only if
            // the user hasn't already edited (the deferred sync replay below
            // will carry the current in-memory state instead).
            if (!localWinsDuringBootstrap.current) {
              const localRaw = localStorage.getItem(ROSTER_KEY);
              if (localRaw) {
                fetch(`${API_BASE}/scorecard-roster`, {
                  method: 'PUT',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: localRaw,
                }).catch(() => { /* silent — localStorage is still the fallback */ });
              }
            }
          }
        }

        // ── Config ──
        if (configRes.ok) {
          const cfgData = await configRes.json() as { ok: boolean; config: ScorecardConfig | null };
          if (cfgData.ok && cfgData.config?.weights && cfgData.config?.tiers) {
            // Server has config — use it as source of truth for this account
            setConfig(cfgData.config);
            safeSetItem(CONFIG_KEY, JSON.stringify(cfgData.config));
          } else {
            // Server is empty — upload whatever localStorage has as initial value
            const localCfgRaw = localStorage.getItem(CONFIG_KEY);
            if (localCfgRaw) {
              fetch(`${API_BASE}/scorecard-config`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: localCfgRaw,
              }).catch(() => { /* silent — localStorage is still the fallback */ });
            }
          }
        }
      } catch { /* network error — localStorage still works */ }

      // Mark bootstrap settled so syncToServer can proceed.
      bootstrapSettled.current = true;

      // Replay any roster edit that was suppressed while the GETs were in
      // flight so it reaches the server now that bootstrap is complete.
      if (localWinsDuringBootstrap.current && deferredSyncRosterRef.current) {
        const deferred = deferredSyncRosterRef.current;
        deferredSyncRosterRef.current = null;
        syncToServerImmediate(deferred);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  /** Internal: fire the debounced PUT.  Shared by syncToServer and the
   *  bootstrap deferred-replay path so the logic lives in one place. */
  const syncToServerImmediate = (next: RosterState) => {
    if (!user) return;
    setSyncStatus('saving');
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/scorecard-roster`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(next),
        });
        setSyncStatus(res.ok ? 'saved' : 'error');
        if (res.ok) setTimeout(() => setSyncStatus('idle'), 2500);
      } catch {
        setSyncStatus('error');
      }
    }, 400);
  };

  const syncToServer = (next: RosterState) => {
    if (!user) return;
    // If the bootstrap GETs haven't settled yet, record that the user has
    // edited and defer the PUT.  All subsequent pre-bootstrap edits also defer
    // (they update deferredSyncRosterRef to the latest state so only one
    // replay fires after bootstrap settles).
    if (!bootstrapSettled.current) {
      localWinsDuringBootstrap.current = true;
      deferredSyncRosterRef.current = next;
      return;
    }
    syncToServerImmediate(next);
  };

  const save = (next: RosterState) => {
    setRoster(next);
    setLocalSaveFailed(!safeSetItem(ROSTER_KEY, JSON.stringify(next)));
    syncToServer(next);
  };

  /** Invalidate the undo snapshot whenever the user makes a manual roster change. */
  const clearUndo = () => {
    preImportRosterRef.current = null;
    setImportUndoAvailable(false);
  };

  /* ── CSV template download ── */
  const downloadScorecardTemplate = () => {
    const dimHeaders = DIMS.map(d => `${d.label} Score (/100)`);
    const subHeaders: string[] = [];
    DIMS.forEach(d => { (SUB_INDICATORS[d.id] ?? []).forEach(sub => { subHeaders.push(`${d.label} — ${sub.label}`); }); });
    const headers = ['Supplier Name', 'Current Tier', ...dimHeaders, ...subHeaders, 'Weighted Score (/100)', 'Calculated Tier'];
    const example = ['Example Supplier', 'Preferred', ...dimHeaders.map(() => ''), ...subHeaders.map(() => '75'), '', ''];
    downloadCsv([headers, example], 'supplier-scorecard-template.csv');
  };

  /* ── CSV import ── */
  const handleScorecardImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;

      const { rows: csvRows, errors } = parseCsvFile(text, ['Supplier Name']);
      if (errors.length > 0 && csvRows.length === 0) { setImportLog([isAr ? 'فشل الاستيراد:' : 'Import failed:', ...errors]); return; }

      // Snapshot the roster before making any changes so undo can restore it.
      const snapshotBeforeImport: RosterState = { suppliers: roster.suppliers.map(s => ({ ...s })), activeId: roster.activeId };

      const log: string[] = [...errors];
      const nextSuppliers = [...roster.suppliers];

      // Case-insensitive duplicate detection: "alpha corp" and "Alpha Corp" are the same supplier.
      const dupNames = csvRows.map(r => r['Supplier Name']?.trim()).filter(n => n && nextSuppliers.some(s => s.name.toLowerCase() === n.toLowerCase()));
      let overwrite = false;
      if (dupNames.length > 0) {
        overwrite = window.confirm(
          isAr
            ? `${dupNames.length} مورّد(ين) موجود(ون): ${dupNames.slice(0, 3).join('، ')}${dupNames.length > 3 ? '…' : ''}.\n\nاستبدال البيانات الحالية؟ (موافق = استبدال، إلغاء = تخطّي المكررات)`
            : `${dupNames.length} supplier(s) already exist: ${dupNames.slice(0, 3).join(', ')}${dupNames.length > 3 ? '…' : ''}.\n\nOverwrite? OK = overwrite, Cancel = skip duplicates.`
        );
      }

      let imported = 0; let skipped = 0;
      csvRows.forEach((row, ri) => {
        const rowNum = ri + 2;
        const name = row['Supplier Name']?.trim();
        if (!name) { log.push(`Row ${rowNum}: Supplier Name is empty — skipped.`); return; }

        // Use the shared pure function from @/lib/scorecardCsv to parse sub-scores.
        const { subScores, errors: rowErrors } = parseSubScoresFromRow(row);
        rowErrors.forEach(e => log.push(`Row ${rowNum}: ${e}`));

        // Case-insensitive match: treat "alpha corp" and "Alpha Corp" as the same supplier.
        const existingIdx = nextSuppliers.findIndex(s => s.name.toLowerCase() === name.toLowerCase());
        if (existingIdx >= 0) {
          const existingName = nextSuppliers[existingIdx].name;
          const isCaseVariant = existingName !== name;
          if (overwrite) {
            nextSuppliers[existingIdx] = { ...nextSuppliers[existingIdx], tier: row['Current Tier']?.trim() || nextSuppliers[existingIdx].tier, subScores };
            imported++;
            if (isCaseVariant) {
              log.push(`Row ${rowNum}: '${name}' matched existing '${existingName}' — merged.`);
            }
          } else {
            skipped++;
            if (isCaseVariant) {
              log.push(`Row ${rowNum}: '${name}' matched existing '${existingName}' — skipped.`);
            }
          }
        } else {
          nextSuppliers.push({ id: makeId(), name, tier: row['Current Tier']?.trim() || 'Strategic', subScores });
          imported++;
        }
      });

      const nextActiveId = nextSuppliers.find(s => s.id === roster.activeId) ? roster.activeId : (nextSuppliers[0]?.id ?? roster.activeId);
      preImportRosterRef.current = snapshotBeforeImport;
      setImportUndoAvailable(true);
      save({ suppliers: nextSuppliers, activeId: nextActiveId });
      log.unshift(isAr ? `✓ تم استيراد ${imported} مورّد(ين)${skipped > 0 ? `، تخطّي ${skipped}` : ''}.` : `✓ Imported ${imported} supplier(s).${skipped > 0 ? ` ${skipped} skipped.` : ''}`);
      setImportLog(log);
    };
    reader.readAsText(file);
  };

  const saveConfig = (next: ScorecardConfig) => {
    setConfig(next);
    safeSetItem(CONFIG_KEY, JSON.stringify(next));
    if (user) {
      fetch(`${API_BASE}/scorecard-config`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      }).catch(() => { /* silent — localStorage is still the fallback */ });
    }
  };

  const resetConfig = () => saveConfig({ weights: { ...DEFAULT_CONFIG.weights }, tiers: { ...DEFAULT_CONFIG.tiers } });

  const setWeight = (dimId: string, raw: string) => {
    const val = Math.max(0, Math.min(100, parseInt(raw, 10) || 0));
    saveConfig({ ...config, weights: { ...config.weights, [dimId]: val } });
  };

  const setTierThreshold = (key: 'strategic' | 'preferred', raw: string) => {
    const val = Math.max(0, Math.min(100, parseInt(raw, 10) || 0));
    const next = { ...config.tiers, [key]: val };
    // Enforce strategic > preferred
    if (key === 'preferred' && val >= config.tiers.strategic) next.preferred = Math.max(0, config.tiers.strategic - 1);
    if (key === 'strategic' && val <= config.tiers.preferred) next.strategic = config.tiers.preferred + 1;
    saveConfig({ ...config, tiers: next });
  };

  const weightTotal = DIMS.reduce((s, d) => s + (config.weights[d.id] ?? d.weight), 0);

  const active = roster.suppliers.find(s => s.id === roster.activeId) ?? roster.suppliers[0] ?? null;
  const weightedScore = active ? calcWeightedScore(active.subScores, config) : null;

  /* ── AI Plan ── */
  const buildScorecardPrompt = useCallback((): string => {
    if (!active) return '';
    const ws = calcWeightedScore(active.subScores, config);
    const t  = ws !== null ? getTier(ws, config) : null;
    const dimLines = DIMS.map(d => {
      const sc   = calcDimScore(d.id, active.subScores);
      const subs = (SUB_INDICATORS[d.id] ?? [])
        .filter(s => active.subScores[d.id]?.[s.id])
        .map(s => `    - ${s.label}: ${active.subScores[d.id]![s.id]}/100`)
        .join('\n');
      return `- **${d.label}** (weight: ${config.weights[d.id] ?? d.weight}%): ${sc !== null ? `${sc}/100` : 'not fully scored'}${subs ? '\n' + subs : ''}`;
    }).join('\n');
    const allGreen = ws !== null && DIMS.every(d => (calcDimScore(d.id, active.subScores) ?? 0) >= 75);
    return [
      `## Supplier: ${active.name || 'Unnamed'} | Current tier: ${active.tier} | Weighted score: ${ws ?? 'N/A'}/100 → Calculated tier: ${t?.label ?? 'N/A'}`,
      '',
      '## Dimension Scores',
      dimLines,
      '',
      '## Your Task',
      allGreen
        ? 'All dimensions score ≥ 75. Generate a **Relationship Deepening Plan**: concrete actions to grow this supplier from Preferred to Strategic — joint business planning, co-innovation, technology integration, executive engagement, and mutual risk sharing. Use one ## heading per initiative type.'
        : 'Generate a **Supplier Development Plan**. For each dimension scoring below 75, name the specific weak sub-indicators and provide 2–3 concrete improvement actions. Label each action [HIGH], [MEDIUM], or [LOW] priority based on dimension weight × score gap. Use one ## heading per underperforming dimension.',
    ].join('\n');
  }, [active, config]);

  const { loading: planLoading, result: planResult, error: planError, rateLimited: planRateLimited, generate: generatePlan, reset: resetPlan,
          savedPlan: planSavedPlan, viewSaved: viewSavedPlan, deleteSaved: deleteSavedPlan,
          saveError: planSaveError, dismissSaveError: dismissPlanSaveError } =
    useAIPlan(buildScorecardPrompt, isAr, active?.id ? `scorecard-${active.id}` : undefined, weightedScore !== null);

  // Clear any displayed plan result when the user switches to a different supplier.
  // Also reset the pending-name edit so the new supplier starts clean.
  const prevActiveIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (active?.id && prevActiveIdRef.current !== null && prevActiveIdRef.current !== active.id) {
      resetPlan();
      setDupNameWarning(null);
      setPendingName(null);
    }
    prevActiveIdRef.current = active?.id ?? null;
  }, [active?.id, resetPlan]);

  /**
   * Called when the name field loses focus.
   * - If the typed name is a case-insensitive duplicate of another supplier,
   *   shows a warning and does NOT persist the name to the roster.
   * - Otherwise commits the name to the roster and clears any prior warning.
   */
  const handleNameBlur = (typed: string) => {
    if (hasCaseInsensitiveDuplicate(typed, roster.suppliers, active?.id)) {
      const existing = roster.suppliers.find(
        s => s.id !== active?.id && s.name.toLowerCase() === typed.trim().toLowerCase(),
      )!;
      setDupNameWarning(
        isAr
          ? `يوجد مورّد بهذا الاسم بالفعل: "${existing.name}". يرجى استخدام اسم مختلف.`
          : `A supplier named "${existing.name}" already exists. Please choose a different name.`,
      );
      // Do NOT call updateActive — the roster keeps the previous (non-duplicate) name.
    } else {
      // Safe to commit: persist the typed name and clear local pending state.
      setDupNameWarning(null);
      updateActive({ name: typed });
      setPendingName(null);
    }
  };

  const setActiveId = (id: string) => save({ ...roster, activeId: id });

  const toggleCompareMode = () => {
    setCompareMode(m => !m);
    setCompareIds([]);
  };

  const toggleCompareId = (id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const updateActive = (patch: Partial<SupplierRecord>) => {
    clearUndo();
    save({
      ...roster,
      suppliers: roster.suppliers.map(s => s.id === active?.id ? { ...s, ...patch } : s),
    });
  };

  const setSubScore = (dimId: string, subId: string, val: string) => {
    const subScores = { ...active?.subScores };
    subScores[dimId] = { ...subScores[dimId], [subId]: val };
    updateActive({ subScores });
  };

  const addSupplier = () => {
    clearUndo();
    const s = newSupplier();
    save({ suppliers: [...roster.suppliers, s], activeId: s.id });
  };

  const deleteSupplier = (id: string) => {
    const label = isAr ? 'هل تريد حذف هذا المورّد؟' : 'Delete this supplier? This cannot be undone.';
    if (!window.confirm(label)) return;
    clearUndo();
    const remaining = roster.suppliers.filter(s => s.id !== id);
    if (remaining.length === 0) {
      const blank = newSupplier();
      save({ suppliers: [blank], activeId: blank.id });
    } else {
      const nextActive = id === roster.activeId ? remaining[0].id : roster.activeId;
      save({ suppliers: remaining, activeId: nextActive });
    }
  };

  const today = new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-GB');
  const tier = weightedScore !== null && weightedScore !== undefined ? getTier(weightedScore, config) : null;
  const radarData = DIMS.map(d => ({
    dimension: isAr ? d.labelAr : d.label,
    value: calcDimScore(d.id, active?.subScores ?? {}) ?? 0,
    fullMark: 100,
  }));

  return (
    <div className="print-zone-scorecard bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
      {/* Print-only header */}
      <div className="hidden print:block mb-4 pb-3 border-b border-gray-300">
        <p className="text-lg font-extrabold text-gray-900">{isAr ? '🏆 بطاقة تقييم المورّد' : '🏆 Supplier Scorecard'}</p>
        {active?.name && <p className="text-sm font-semibold text-gray-700">{isAr ? `المورّد: ${active.name}` : `Supplier: ${active.name}`}</p>}
        <p className="text-xs text-gray-500">{isAr ? `تاريخ التصدير: ${today}` : `Exported: ${today}`}</p>
      </div>

      {/* Header bar */}
      <div className="p-5 border-b border-border bg-teal-50 flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="text-sm font-bold text-primary">{isAr ? '🏆 أداة بطاقة تقييم المورّد' : '🏆 Supplier Scorecard Tool'}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {active?.name ? (() => {
              const syncLabel = syncStatus === 'saving'
                ? (isAr ? 'جارٍ الحفظ…' : 'Saving…')
                : syncStatus === 'saved'
                ? (isAr ? 'تم الحفظ ✓' : 'Saved ✓')
                : syncStatus === 'error'
                ? (isAr ? 'تعذّر المزامنة — تم الحفظ محلياً' : 'Could not sync — saved locally')
                : localSaveFailed
                ? (isAr ? '⚠ تعذّر الحفظ محلياً' : '⚠ not saved locally')
                : (isAr ? 'يُحفظ تلقائياً' : 'auto-saved');
              return isAr ? `التقييم: ${active.name} — ${syncLabel}` : `Evaluating: ${active.name} — ${syncLabel}`;
            })() : (isAr ? 'أضف مورّداً أو اختر من القائمة' : 'Add a supplier or select from the roster')}
          </p>
        </div>
        <button
          onClick={() => printZone('scorecard')}
          className="no-print flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold bg-primary text-white hover:bg-primary/90 transition-colors shrink-0"
        >
          <Printer className="w-3.5 h-3.5" />
          {isAr ? 'تصدير PDF' : 'Export PDF'}
        </button>
      </div>

      <div className="p-5 space-y-5">

        {/* ── Supplier Roster ── */}
        <div className="no-print border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-slate-50 border-b border-border">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-widest">
                {isAr ? 'قائمة المورّدين' : 'Supplier Roster'}
              </span>
              <span className="text-xs text-muted-foreground">({roster.suppliers.length})</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {roster.suppliers.length >= 2 && (
                <button
                  onClick={toggleCompareMode}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-bold transition-colors ${
                    compareMode
                      ? 'bg-primary text-white hover:bg-primary/90'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  <Columns className="w-3 h-3" />
                  {compareMode
                    ? (isAr ? 'إلغاء المقارنة' : 'Exit Compare')
                    : (isAr ? 'مقارنة' : 'Compare')}
                </button>
              )}
              <button
                onClick={downloadScorecardTemplate}
                title={isAr ? 'تنزيل قالب CSV فارغ' : 'Download blank CSV template'}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
              >
                <Download className="w-3 h-3" />
                {isAr ? 'قالب' : 'Template'}
              </button>
              <button
                onClick={() => importInputRef.current?.click()}
                title={isAr ? 'استيراد بيانات المورّدين من CSV' : 'Import supplier data from CSV'}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
              >
                <Upload className="w-3 h-3" />
                {isAr ? 'استيراد CSV' : 'Import CSV'}
              </button>
              <button
                onClick={() => exportToCSV(roster.suppliers, config)}
                disabled={roster.suppliers.filter(s => Object.keys(s.subScores).length > 0).length < 1}
                title={isAr ? 'تنزيل جميع بطاقات التقييم كملف CSV' : 'Download all scorecards as CSV'}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-bold bg-slate-600 text-white hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="w-3 h-3" />
                {isAr ? 'تصدير CSV' : 'Export CSV'}
              </button>
              <button
                onClick={addSupplier}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-bold bg-teal-600 text-white hover:bg-teal-700 transition-colors"
              >
                <Plus className="w-3 h-3" />
                {isAr ? 'إضافة مورّد' : 'Add Supplier'}
              </button>
              <input
                type="file" accept=".csv" className="hidden" ref={importInputRef}
                aria-label={isAr ? 'استيراد ملف CSV' : 'Import CSV file'}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleScorecardImport(f); e.target.value = ''; }}
              />
            </div>
          </div>
          {compareMode && (
            <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-700 font-medium">
              {isAr
                ? `اختر 2–3 موردين للمقارنة (${compareIds.length} محدد)`
                : `Select 2–3 suppliers to compare (${compareIds.length} selected)`}
            </div>
          )}
          <div className="divide-y divide-border max-h-52 overflow-y-auto">
            {roster.suppliers.map((s, idx) => {
              const sc = calcWeightedScore(s.subScores, config);
              const t = sc !== null ? getTier(sc, config) : null;
              const isActive = s.id === roster.activeId;
              const compareIdx = compareIds.indexOf(s.id);
              const isSelected = compareIdx !== -1;
              const compareColor = isSelected ? COMPARE_COLORS[compareIdx] : undefined;
              return (
                <div
                  key={s.id}
                  onClick={() => compareMode ? toggleCompareId(s.id) : setActiveId(s.id)}
                  className={`flex items-center justify-between gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                    compareMode
                      ? isSelected ? 'bg-primary/5' : 'hover:bg-gray-50'
                      : isActive ? 'bg-primary/5' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {compareMode ? (
                      <div
                        className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors"
                        style={{
                          borderColor: isSelected ? compareColor : '#cbd5e1',
                          background: isSelected ? compareColor : 'transparent',
                        }}
                      >
                        {isSelected && <X className="w-2.5 h-2.5 text-white" />}
                      </div>
                    ) : (
                      isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    )}
                    <span className={`text-sm truncate ${(!compareMode && isActive) || (compareMode && isSelected) ? 'font-bold' : 'text-gray-700'}`}
                      style={{ color: compareMode && isSelected ? compareColor : undefined }}>
                      {s.name || (isAr ? 'مورّد جديد' : 'New Supplier')}
                    </span>
                    {t && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0"
                        style={{ background: t.bg, color: t.color }}>
                        {isAr ? t.labelAr : t.label}
                      </span>
                    )}
                    {sc !== null && (
                      <span className="text-xs font-bold shrink-0" style={{ color: t?.color }}>
                        {sc}/100
                      </span>
                    )}
                  </div>
                  {!compareMode && (
                    <button
                      onClick={e => { e.stopPropagation(); deleteSupplier(s.id); }}
                      className="text-muted-foreground hover:text-red-500 transition-colors p-1 rounded shrink-0"
                      aria-label={isAr ? 'حذف المورّد' : 'Delete supplier'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Compare View ── */}
        {compareMode && compareIds.length >= 2 && (() => {
          const suppliers = compareIds.map(id => roster.suppliers.find(s => s.id === id)!).filter(Boolean);
          const dimScoresMatrix = DIMS.map(d =>
            suppliers.map(s => calcDimScore(d.id, s.subScores))
          );
          const weightedScores = suppliers.map(s => calcWeightedScore(s.subScores, config));

          // Radar data: one entry per dimension, one key per supplier
          const radarCompareData = DIMS.map((d, di) => {
            const entry: Record<string, unknown> = {
              dimension: isAr ? d.labelAr : d.label,
              fullMark: 100,
            };
            suppliers.forEach((s, si) => {
              entry[`s${si}`] = dimScoresMatrix[di][si] ?? 0;
            });
            return entry;
          });

          return (
            <div className="print-zone-compare border border-primary/20 rounded-xl overflow-hidden bg-white">
              {/* Print-only header */}
              <div className="hidden print:block mb-4 pb-3 border-b border-gray-300">
                <p className="text-lg font-extrabold text-gray-900">{isAr ? '📊 مقارنة المورّدين' : '📊 Supplier Comparison'}</p>
                <p className="text-sm font-semibold text-gray-700">
                  {suppliers.map(s => s.name || (isAr ? 'مورّد جديد' : 'New Supplier')).join(' vs ')}
                </p>
                <p className="text-xs text-gray-500">{isAr ? `تاريخ التصدير: ${today}` : `Exported: ${today}`}</p>
              </div>

              {/* Compare header */}
              <div className="no-print flex items-center gap-2 px-4 py-2.5 bg-primary/5 border-b border-primary/10 flex-wrap">
                <Columns className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs font-bold text-primary uppercase tracking-widest shrink-0">
                  {isAr ? 'مقارنة المورّدين' : 'Supplier Comparison'}
                </span>
                <span className="text-xs text-muted-foreground flex-1 min-w-0 truncate">
                  {suppliers.map(s => s.name || (isAr ? 'مورّد جديد' : 'New Supplier')).join(' vs ')}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => exportComparisonToCSV(suppliers, config, isAr)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-bold bg-slate-600 text-white hover:bg-slate-700 transition-colors"
                    title={isAr ? 'تنزيل المقارنة كملف CSV' : 'Download comparison as CSV'}
                  >
                    <Download className="w-3 h-3" />
                    {isAr ? 'تصدير CSV' : 'Export CSV'}
                  </button>
                  <button
                    onClick={() => printZone('compare')}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-bold bg-primary text-white hover:bg-primary/90 transition-colors"
                    title={isAr ? 'طباعة / تصدير PDF' : 'Print / Export PDF'}
                  >
                    <Printer className="w-3 h-3" />
                    {isAr ? 'تصدير PDF' : 'Export PDF'}
                  </button>
                </div>
              </div>

              {/* Dimension table */}
              <div className="overflow-x-auto" dir={isAr ? 'rtl' : 'ltr'}>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-border">
                      <th className="text-start px-4 py-2.5 font-bold text-primary min-w-[140px]">
                        {isAr ? 'البُعد' : 'Dimension'}
                      </th>
                      {suppliers.map((s, si) => (
                        <th key={s.id} className="px-3 py-2.5 font-bold text-center min-w-[100px]"
                          style={{ color: COMPARE_COLORS[si] }}>
                          {s.name || (isAr ? 'مورّد جديد' : 'New Supplier')}
                        </th>
                      ))}
                      <th className="px-3 py-2.5 font-bold text-center text-amber-700 min-w-[80px]">
                        {isAr ? 'الأفضل' : 'Winner'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {DIMS.map((d, di) => {
                      const scores = dimScoresMatrix[di];
                      const maxScore = Math.max(...scores.filter(v => v !== null) as number[]);
                      const hasData = scores.some(v => v !== null);
                      const winnerCount = scores.filter(v => v === maxScore).length;
                      return (
                        <tr key={d.id} className="border-b border-border last:border-0 hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-2.5 font-medium text-gray-700">
                            <div>{isAr ? d.labelAr : d.label}</div>
                            <div className="text-[10px] text-muted-foreground">{config.weights[d.id] ?? d.weight}%</div>
                          </td>
                          {scores.map((sc, si) => {
                            const color = ragColor(sc);
                            const isWinner = sc !== null && sc === maxScore && hasData && winnerCount < suppliers.length;
                            return (
                              <td key={suppliers[si].id} className="px-3 py-2.5 text-center">
                                {sc !== null ? (
                                  <div className="inline-flex flex-col items-center gap-0.5">
                                    <span
                                      className="font-extrabold text-sm px-2.5 py-1 rounded-lg"
                                      style={{ background: color + '22', color }}
                                    >
                                      {sc}
                                    </span>
                                    {isWinner && (
                                      <span className="text-[10px] text-amber-600 font-bold">
                                        {isAr ? '🏆 الأفضل' : '🏆 Best'}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-3 py-2.5 text-center">
                            {(() => {
                              if (!hasData || winnerCount >= suppliers.length) {
                                return <span className="text-muted-foreground text-[10px]">{hasData ? (isAr ? 'تعادل' : 'Tie') : '—'}</span>;
                              }
                              let winnerIdx = -1;
                              let winnerScore = -1;
                              scores.forEach((sc, si) => {
                                if (sc !== null && sc > winnerScore) { winnerScore = sc; winnerIdx = si; }
                              });
                              if (winnerIdx < 0) return <span className="text-muted-foreground">—</span>;
                              return (
                                <span className="font-bold text-amber-700">
                                  {suppliers[winnerIdx]?.name || (isAr ? 'مورّد جديد' : 'New Supplier')}
                                </span>
                              );
                            })()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-border">
                      <td className="px-4 py-2.5 font-bold text-primary text-xs">
                        {isAr ? 'الدرجة المرجّحة' : 'Weighted Score'}
                      </td>
                      {weightedScores.map((ws, si) => {
                        const color = ragColor(ws);
                        const t = ws !== null ? getTier(ws, config) : null;
                        return (
                          <td key={suppliers[si].id} className="px-3 py-2.5 text-center">
                            {ws !== null ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className="font-extrabold text-base" style={{ color }}>
                                  {ws}/100
                                </span>
                                {t && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                    style={{ background: t.bg, color: t.color }}>
                                    {isAr ? t.labelAr : t.label}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                {isAr ? 'غير مكتمل' : 'Incomplete'}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2.5 text-center">
                        {(() => {
                          const validScores = weightedScores.map((ws, si) => ({ ws, si })).filter(x => x.ws !== null);
                          if (validScores.length < 2) return <span className="text-muted-foreground">—</span>;
                          const max = Math.max(...validScores.map(x => x.ws as number));
                          const winners = validScores.filter(x => x.ws === max);
                          if (winners.length > 1) return <span className="text-muted-foreground text-[10px]">{isAr ? 'تعادل' : 'Tie'}</span>;
                          return (
                            <span className="font-bold text-amber-700">
                              🏆 {suppliers[winners[0].si]?.name || (isAr ? 'مورّد جديد' : 'New Supplier')}
                            </span>
                          );
                        })()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Overlay radar chart */}
              <div className="p-4 border-t border-border">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 text-center">
                  {isAr ? 'ملف الأداء المقارن' : 'Comparative Performance Profile'}
                </p>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarCompareData} cx="50%" cy="50%" outerRadius="68%">
                    <PolarGrid />
                    <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 9, fill: '#6b7280' }} />
                    {suppliers.map((s, si) => (
                      <Radar
                        key={s.id}
                        name={s.name || (isAr ? 'مورّد جديد' : 'New Supplier')}
                        dataKey={`s${si}`}
                        stroke={COMPARE_COLORS[si]}
                        fill={COMPARE_COLORS[si]}
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                    ))}
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => <span style={{ fontSize: 11 }}>{value}</span>}
                    />
                    <Tooltip
                      formatter={(v: number, name: string) => [`${v}/100`, name]}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })()}

        {/* ── Import log ── */}
        {importLog && (
          <div className={`text-xs rounded-lg p-3 border ${importLog[0]?.startsWith('✓') ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">{importLog.map((m, i) => {
                const isCaseVariant = i > 0 && m.includes('matched existing');
                return (
                  <p key={i} className={
                    i === 0
                      ? 'font-bold'
                      : isCaseVariant
                        ? 'flex items-center gap-1 font-medium text-amber-700'
                        : 'opacity-75'
                  }>
                    {isCaseVariant && <span aria-hidden="true">⚠️</span>}
                    {m}
                  </p>
                );
              })}</div>
              <div className="flex items-center gap-2 shrink-0">
                {importUndoAvailable && importLog[0]?.startsWith('✓') && (
                  <button
                    onClick={() => {
                      if (preImportRosterRef.current) {
                        save(preImportRosterRef.current);
                        preImportRosterRef.current = null;
                        setImportUndoAvailable(false);
                        setImportLog(null);
                      }
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg font-bold bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-100 transition-colors"
                    title={isAr ? 'التراجع عن الاستيراد الأخير' : 'Undo last import'}
                  >
                    <RotateCcw className="w-3 h-3" />
                    {isAr ? 'تراجع' : 'Undo import'}
                  </button>
                )}
                <button onClick={() => { setImportLog(null); clearUndo(); }} className="opacity-50 hover:opacity-100 font-bold">✕</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Customise Framework ── */}
        <div className="no-print border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => setConfigOpen(o => !o)}
            className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
          >
            <div className="flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-widest">
                {isAr ? '⚙ تخصيص الإطار' : '⚙ Customise Framework'}
              </span>
              {weightTotal !== 100 && (
                <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">
                  {isAr ? `الإجمالي: ${weightTotal}%` : `Total: ${weightTotal}%`}
                </span>
              )}
            </div>
            {configOpen ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
          </button>
          {configOpen && (
            <div className="p-4 space-y-5 bg-white">
              {/* Dimension weights */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-primary">
                    {isAr ? 'أوزان الأبعاد (%)' : 'Dimension Weights (%)'}
                  </p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${weightTotal === 100 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {isAr ? `الإجمالي: ${weightTotal}%` : `Total: ${weightTotal}%`}
                  </span>
                </div>
                <div className="space-y-2">
                  {DIMS.map(d => (
                    <div key={d.id} className="grid grid-cols-[1fr_64px_28px] gap-2 items-center">
                      <label htmlFor={`weight-${d.id}`} className="text-xs text-gray-700 font-medium">
                        {isAr ? d.labelAr : d.label}
                      </label>
                      <input
                        id={`weight-${d.id}`}
                        type="number" min={0} max={100} step={1}
                        value={config.weights[d.id] ?? d.weight}
                        onChange={e => setWeight(d.id, e.target.value)}
                        className="text-center text-sm border border-border rounded-lg px-1 py-1 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  ))}
                </div>
                {weightTotal !== 100 && (
                  <p className="text-[11px] text-red-500 mt-2">
                    {isAr
                      ? 'يجب أن يساوي مجموع الأوزان 100% للحصول على درجة مرجّحة دقيقة.'
                      : 'Weights should sum to 100% for an accurate weighted score. Scoring still works but is normalised to the total.'}
                  </p>
                )}
              </div>
              {/* Tier thresholds */}
              <div>
                <p className="text-xs font-bold text-primary mb-3">
                  {isAr ? 'حدود الشرائح (الحد الأدنى للدرجة)' : 'Tier Thresholds (minimum score)'}
                </p>
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_64px_28px] gap-2 items-center">
                    <label htmlFor="tier-strategic" className="text-xs font-semibold" style={{ color: TIERS[0].color }}>
                      {isAr ? TIERS[0].labelAr : TIERS[0].label}
                    </label>
                    <input
                      id="tier-strategic"
                      type="number" min={1} max={100} step={1}
                      value={config.tiers.strategic}
                      onChange={e => setTierThreshold('strategic', e.target.value)}
                      className="text-center text-sm border border-border rounded-lg px-1 py-1 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <span className="text-xs text-muted-foreground">/100</span>
                  </div>
                  <div className="grid grid-cols-[1fr_64px_28px] gap-2 items-center">
                    <label htmlFor="tier-preferred" className="text-xs font-semibold" style={{ color: TIERS[1].color }}>
                      {isAr ? TIERS[1].labelAr : TIERS[1].label}
                    </label>
                    <input
                      id="tier-preferred"
                      type="number" min={0} max={99} step={1}
                      value={config.tiers.preferred}
                      onChange={e => setTierThreshold('preferred', e.target.value)}
                      className="text-center text-sm border border-border rounded-lg px-1 py-1 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <span className="text-xs text-muted-foreground">/100</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {isAr
                      ? `معاملاتي: 0 – ${config.tiers.preferred - 1}`
                      : `Transactional: 0 – ${config.tiers.preferred - 1}`}
                  </p>
                </div>
              </div>
              {/* Reset */}
              <button
                onClick={resetConfig}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                {isAr ? 'إعادة تعيين الإعدادات الافتراضية' : 'Reset to defaults'}
              </button>
            </div>
          )}
        </div>

        {active && (
          <>
            {/* Supplier info */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="scorecard-supplier-name" className="text-xs font-bold text-primary mb-1 block">
                  {isAr ? 'اسم المورّد' : 'Supplier Name'}
                </label>
                <input
                  id="scorecard-supplier-name"
                  className={`w-full text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 ${dupNameWarning ? 'border-red-400' : 'border-border'}`}
                  placeholder={isAr ? 'أدخل اسم المورّد' : 'Enter supplier name'}
                  value={pendingName ?? active.name}
                  onChange={e => {
                    // Update the local display only; the roster is NOT written here.
                    // Commit (or reject) happens in onBlur via handleNameBlur.
                    setPendingName(e.target.value);
                    if (dupNameWarning) setDupNameWarning(null);
                  }}
                  onBlur={e => handleNameBlur(e.target.value)}
                />
                {dupNameWarning && (
                  <p className="text-[11px] text-red-500 mt-1">{dupNameWarning}</p>
                )}
              </div>
              <div>
                <label htmlFor="scorecard-current-tier" className="text-xs font-bold text-primary mb-1 block">
                  {isAr ? 'الشريحة الحالية' : 'Current Tier'}
                </label>
                <select
                  id="scorecard-current-tier"
                  className="w-full text-sm border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={active.tier}
                  onChange={e => updateActive({ tier: e.target.value })}
                >
                  {TIER_OPTIONS.map((o, i) => (
                    <option key={o} value={o}>{isAr ? TIER_OPTIONS_AR[i] : o}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* ── Dimensions + Sub-indicators ── */}
            <div className="space-y-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                {isAr ? 'التقييم — أدخل 0–100 لكل مؤشر فرعي (100 = أفضل أداء)' : 'Evaluation — enter 0–100 per sub-indicator (100 = best)'}
              </p>
              {DIMS.map(d => {
                const dimScore = calcDimScore(d.id, active.subScores);
                const barColor = dimScore === null
                  ? '#e5e7eb'
                  : dimScore >= 75 ? '#22c55e'
                  : dimScore >= 55 ? '#f59e0b'
                  : '#ef4444';
                const subs = SUB_INDICATORS[d.id] ?? [];

                return (
                  <div key={d.id} className="border border-border rounded-xl overflow-hidden">
                    {/* Dimension header */}
                    <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-gray-50 border-b border-border">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary">{isAr ? d.labelAr : d.label}</span>
                        <span className="text-xs text-muted-foreground">{config.weights[d.id] ?? d.weight}{isAr ? '% وزن' : '% weight'}</span>
                      </div>
                      {dimScore !== null ? (
                        <span className="text-xs font-extrabold px-2 py-0.5 rounded-full shrink-0"
                          style={{ background: barColor + '22', color: barColor }}>
                          {dimScore}/100
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground shrink-0">{isAr ? 'لم يُدخَل بعد' : 'Not entered'}</span>
                      )}
                    </div>
                    {/* Progress bar */}
                    <div className="h-1 bg-gray-100">
                      <div className="h-full transition-all duration-300"
                        style={{ width: `${dimScore ?? 0}%`, background: barColor }} />
                    </div>
                    {/* Sub-indicator rows */}
                    <div className="p-3 space-y-2.5 bg-white">
                      {subs.map(sub => {
                        const note = isAr ? sub.noteAr : sub.note;
                        const currentVal = active.subScores[d.id]?.[sub.id] ?? '';
                        return (
                          <div key={sub.id} className="grid grid-cols-[1fr_68px_28px] gap-2 items-start">
                            <div>
                              <label
                                htmlFor={`sub-${d.id}-${sub.id}`}
                                className="text-xs text-gray-700 font-medium block leading-snug"
                              >
                                {isAr ? sub.labelAr : sub.label}
                              </label>
                              {note && (
                                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{note}</p>
                              )}
                            </div>
                            <input
                              id={`sub-${d.id}-${sub.id}`}
                              type="number" min={0} max={100} step={1}
                              value={currentVal}
                              onChange={e => setSubScore(d.id, sub.id, e.target.value)}
                              className="text-center text-sm border border-border rounded-lg px-1 py-1 focus:outline-none focus:ring-2 focus:ring-primary/30"
                              placeholder="0"
                            />
                            <span className="text-xs text-muted-foreground pt-1.5">/100</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Incomplete hint */}
            {weightedScore === null && Object.keys(active.subScores).length > 0 && (
              <p className="text-xs text-amber-600 text-center">
                {isAr
                  ? 'أدخل مؤشراً فرعياً واحداً على الأقل في كل بُعد لرؤية النتيجة الإجمالية'
                  : 'Enter at least one sub-indicator in every dimension to see the weighted total'}
              </p>
            )}

            {/* ── Results ── */}
            {weightedScore !== null && tier && (
              <AIPlanPanel
                loading={planLoading}
                result={planResult}
                error={planError}
                onGenerate={generatePlan}
                onReset={resetPlan}
                buttonLabel={isAr ? 'توليد خطة التطوير ✨' : 'Generate Development Plan ✨'}
                isAr={isAr}
                savedPlan={planSavedPlan}
                onViewSaved={viewSavedPlan}
                onDeleteSaved={deleteSavedPlan}
                rateLimited={planRateLimited}
                saveError={planSaveError}
                onDismissSaveError={dismissPlanSaveError}
                toolKey={active?.id ? `scorecard-${active.id}` : undefined}
              />
            )}
            {weightedScore !== null && tier && (
              <div className="grid sm:grid-cols-2 gap-5 items-start">
                <div className="space-y-3">
                  <div className="rounded-xl p-5 text-center" style={{ background: tier.bg, border: `1px solid ${tier.color}30` }}>
                    <p className="text-xs text-muted-foreground mb-1">{isAr ? 'الدرجة المرجّحة' : 'Weighted Score'}</p>
                    <p className="text-4xl font-extrabold" style={{ color: tier.color }}>
                      {weightedScore}<span className="text-lg font-normal">/100</span>
                    </p>
                  </div>
                  <div className="rounded-xl p-4 text-center" style={{ background: tier.color, color: '#fff' }}>
                    <p className="text-xs opacity-75 mb-1">{isAr ? 'تصنيف المورّد' : 'Supplier Tier'}</p>
                    <p className="text-xl font-extrabold">
                      {isAr ? TIERS.find(t => t.label === tier.label)?.labelAr : tier.label}
                    </p>
                  </div>
                  <div className="rounded-xl p-4 bg-muted text-xs space-y-1">
                    <p className="font-bold text-primary mb-2">{isAr ? 'حدود الشرائح' : 'Tier Thresholds'}</p>
                    {[
                      { t: TIERS[0], min: config.tiers.strategic },
                      { t: TIERS[1], min: config.tiers.preferred },
                      { t: TIERS[2], min: 0 },
                    ].map(({ t, min }) => (
                      <div key={t.label} className="flex items-center justify-between">
                        <span style={{ color: t.color }} className="font-semibold">{isAr ? t.labelAr : t.label}</span>
                        <span className="text-muted-foreground">≥{min}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 text-center">
                    {isAr ? 'ملف الأداء' : 'Performance Profile'}
                  </p>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                      <PolarGrid />
                      <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 9, fill: '#6b7280' }} />
                      <Radar
                        name={active.name || (isAr ? 'المورّد' : 'Supplier')}
                        dataKey="value"
                        stroke={tier.color}
                        fill={tier.color}
                        fillOpacity={0.25}
                      />
                      <Tooltip formatter={(v: number) => [`${v}/100`, isAr ? 'الدرجة' : 'Score']} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
