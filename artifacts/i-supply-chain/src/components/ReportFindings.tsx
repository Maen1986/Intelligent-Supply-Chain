// Lets every calculator publish what the reader entered and got, so the final personalised report can include it.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReportFinding } from '@/lib/localContentReport';

interface Ctx { findings: ReportFinding[]; publish: (f: ReportFinding) => void; clear: (key: string) => void }
const FindingsContext = createContext<Ctx | null>(null);

export function ReportFindingsProvider({ children }: { children: React.ReactNode }) {
  const [map, setMap] = useState<Record<string, ReportFinding>>({});
  const publish = useCallback((f: ReportFinding) => setMap(m => (JSON.stringify(m[f.key]) === JSON.stringify(f) ? m : { ...m, [f.key]: f })), []);
  const clear = useCallback((key: string) => setMap(m => { if (!(key in m)) return m; const n = { ...m }; delete n[key]; return n; }), []);
  const value = useMemo(() => ({ findings: Object.values(map), publish, clear }), [map, publish, clear]);
  return <FindingsContext.Provider value={value}>{children}</FindingsContext.Provider>;
}

export function useReportFindings(): ReportFinding[] { return useContext(FindingsContext)?.findings ?? []; }

/** Publish (or withdraw, when null) one tool's finding. Safe outside a provider. */
export function usePublishFinding(key: string, finding: Omit<ReportFinding, 'key'> | null): void {
  const ctx = useContext(FindingsContext);
  const sig = JSON.stringify(finding);
  useEffect(() => {
    if (!ctx) return;
    if (finding) ctx.publish({ key, ...finding }); else ctx.clear(key);
    return () => ctx.clear(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, key, ctx?.publish, ctx?.clear]);
}
