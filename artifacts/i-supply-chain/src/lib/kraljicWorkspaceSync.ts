/**
 * Browser side of the Kraljic workspace save (gap KR-B5-1, 2 Nov 2026).
 *
 * Working data (supplier facts, review log, supplier extras, measurement
 * ledger) stays in localStorage as the working copy and offline fallback.
 * For a signed-in user it is also saved to the server, one document per user
 * (PUT /api/kraljic-workspace). Rules, same as the other toolkit pages:
 *  - a visitor who is not signed in gets the unchanged local-only experience;
 *  - on sign-in the server copy is loaded; if the server has nothing yet, the
 *    local copy is uploaded; if the user edits during loading, local wins;
 *  - a failed save never loses local data and is shown as "not saved".
 */
import { useEffect, useRef, useState } from 'react';
import { API_BASE } from '@/lib/apiBase';

export interface KraljicWorkspaceData {
  facts: Record<string, unknown>;
  reviews: Record<string, unknown>;
  extras: Record<string, unknown>;
  ledger: unknown[];
}
export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error';

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** True when there is nothing worth saving. */
export function isEmptyWorkspace(w: KraljicWorkspaceData): boolean {
  return Object.keys(w.facts).length === 0 && Object.keys(w.reviews).length === 0
    && Object.keys(w.extras).length === 0 && w.ledger.length === 0;
}

/** Defensive parse of whatever the server returned: wrong shapes become empty, never throw. */
export function parseWorkspace(raw: unknown): KraljicWorkspaceData | null {
  if (!isObj(raw)) return null;
  const ledger = Array.isArray(raw.ledger) ? raw.ledger.slice(-500) : [];
  return {
    facts: isObj(raw.facts) ? raw.facts : {},
    reviews: isObj(raw.reviews) ? raw.reviews : {},
    extras: isObj(raw.extras) ? raw.extras : {},
    ledger,
  };
}

export function useKraljicWorkspaceSync(
  user: { id: number } | null | undefined,
  current: KraljicWorkspaceData,
  apply: (w: KraljicWorkspaceData) => void,
): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const loadedFor = useRef<number | null>(null);
  const settled = useRef(false);
  const editedDuringLoad = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(current);
  latest.current = current;
  const firstRun = useRef(true);

  const push = () => {
    if (timer.current) clearTimeout(timer.current);
    setStatus('saving');
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/kraljic-workspace`, {
          method: 'PUT', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: latest.current }),
        });
        setStatus(res.ok ? 'saved' : 'error');
        if (res.ok) setTimeout(() => setStatus('idle'), 2500);
      } catch { setStatus('error'); }
    }, 600);
  };

  // Load on sign-in.
  useEffect(() => {
    if (!user) {
      loadedFor.current = null; settled.current = false; editedDuringLoad.current = false; setStatus('idle');
      return;
    }
    if (loadedFor.current === user.id) return;
    loadedFor.current = user.id; settled.current = false; editedDuringLoad.current = false;
    const uid = user.id;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/kraljic-workspace`, { credentials: 'include' });
        if (loadedFor.current !== uid) return;
        if (res.ok) {
          const body = await res.json() as { ok: boolean; workspace: { data: unknown } | null };
          const server = body.ok && body.workspace ? parseWorkspace(body.workspace.data) : null;
          if (server && !isEmptyWorkspace(server)) {
            if (!editedDuringLoad.current) apply(server);
          } else if (!editedDuringLoad.current && !isEmptyWorkspace(latest.current)) {
            push();
          }
        }
      } catch { /* offline: local copy keeps working */ }
      settled.current = true;
      if (editedDuringLoad.current) push();
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Save on change (skip the very first render, which is just the initial load from localStorage).
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    if (!user) return;
    if (!settled.current) { editedDuringLoad.current = true; return; }
    push();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.facts, current.reviews, current.extras, current.ledger]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return status;
}
