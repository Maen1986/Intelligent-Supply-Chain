/**
 * useAIPlan — shared hook for AI "Generate" action plan buttons.
 *
 * Usage:
 *   const { loading, result, error, generate, reset, savedPlan, viewSaved, deleteSaved }
 *     = useAIPlan(buildPrompt, isAr, 'toolKey');
 *
 * - buildPrompt: called lazily when generate() is triggered; must return the full prompt string
 * - isAr: controls the language param sent to the server
 * - toolKey: optional; when provided AND the user is authenticated, the most-recently generated
 *   plan is persisted server-side. Pass undefined for unauthenticated / ephemeral-only usage.
 *
 * Persistence contract:
 *   • On mount: if toolKey + authenticated → fetch /api/plans/:toolKey and populate savedPlan
 *   • After generate: if toolKey + authenticated → POST /api/plans/:toolKey with the new text
 *   • viewSaved(): copies savedPlan.text into `result` so the panel shows it
 *   • deleteSaved(): DELETE /api/plans/:toolKey and clears savedPlan
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { API_BASE } from '@/lib/apiBase';
import { useAuth }  from '@/lib/AuthContext';

export interface SavedPlan {
  text:    string;
  savedAt: string; // ISO-8601 date string
}

export interface AIPlanState {
  loading:      boolean;
  result:       string | null;
  error:        string | null;
  /** True when the last request was rejected with a 429 rate-limit response. */
  rateLimited:  boolean;
  generate:     () => Promise<void>;
  reset:        () => void;
  savedPlan:    SavedPlan | null;
  viewSaved:    () => void;
  deleteSaved:  () => Promise<void>;
}

export function useAIPlan(buildPrompt: () => string, isAr: boolean, toolKey?: string): AIPlanState {
  const { isAuthenticated } = useAuth();

  const [loading,     setLoading]     = useState(false);
  const [result,      setResult]      = useState<string | null>(null);
  const [error,       setError]       = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [savedPlan,   setSavedPlan]   = useState<SavedPlan | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const prevAuthenticated = useRef<boolean>(isAuthenticated);

  /* ── Auto-generate once when the user just logged in ── */
  useEffect(() => {
    const wasAuthenticated = prevAuthenticated.current;
    prevAuthenticated.current = isAuthenticated;

    if (isAuthenticated && !wasAuthenticated && !result && !savedPlan && !loading) {
      generate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, result, savedPlan]);

  /* ── Auto-generate after login (consume pendingAIPlan_<toolKey> flag) ── */
  const prevAuthRef = useRef<boolean>(false);
  useEffect(() => {
    const wasAuthenticated = prevAuthRef.current;
    prevAuthRef.current = isAuthenticated;

    if (isAuthenticated && !wasAuthenticated && toolKey) {
      const flagKey = `pendingAIPlan_${toolKey}`;
      if (sessionStorage.getItem(flagKey) === '1') {
        sessionStorage.removeItem(flagKey);
        generate();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, toolKey]);

  /* ── Load saved plan on mount / when toolKey or auth state changes ── */
  useEffect(() => {
    // Always clear stale savedPlan immediately when key or auth changes,
    // so a previous supplier's plan notice never bleeds into the next.
    setSavedPlan(null);

    if (!toolKey || !isAuthenticated) return;

    let cancelled = false;
    (async () => {
      try {
        const res  = await fetch(`${API_BASE}/plans/${toolKey}`, { credentials: 'include' });
        const data = await res.json() as { ok: boolean; plan?: SavedPlan | null };
        if (!cancelled) {
          // Explicitly set null when the server has no plan for this key
          setSavedPlan(data.ok && data.plan ? data.plan : null);
        }
      } catch {
        // Non-fatal — user just won't see a saved plan notice
      }
    })();

    return () => { cancelled = true; };
  }, [toolKey, isAuthenticated]);

  /* ── Generate (and persist if authenticated) ── */
  const generate = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setResult(null);
    setError(null);
    setRateLimited(false);

    try {
      const res = await fetch(`${API_BASE}/ai/plan`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: buildPrompt(), language: isAr ? 'ar' : 'en' }),
        signal: abortRef.current.signal,
      });

      const data = await res.json() as {
        ok: boolean;
        text?: string;
        error?: string;
        retryAfterSeconds?: number;
      };

      if (res.status === 429) {
        setRateLimited(true);
        const mins = data.retryAfterSeconds ? Math.ceil(data.retryAfterSeconds / 60) : 60;
        throw new Error(
          data.error ??
          (isAr
            ? `تجاوزت الحد المسموح. حاول مجدّداً خلال ${mins} دقيقة`
            : `AI plan limit reached. Please try again in ${mins} minute(s).`),
        );
      }

      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? (isAr ? 'تعذّر التوليد — حاول مجدّداً' : 'Could not generate — try again'));
      }

      const text = data.text ?? '';
      setResult(text);

      // Persist server-side for authenticated users
      if (toolKey && isAuthenticated && text) {
        try {
          const saveRes  = await fetch(`${API_BASE}/plans/${toolKey}`, {
            method:      'POST',
            credentials: 'include',
            headers:     { 'Content-Type': 'application/json' },
            body:        JSON.stringify({ text }),
          });
          const saveData = await saveRes.json() as { ok: boolean; savedAt?: string };
          if (saveData.ok && saveData.savedAt) {
            setSavedPlan({ text, savedAt: saveData.savedAt });
          }
        } catch {
          // Non-fatal — the plan is still shown, just not persisted
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(
        err instanceof Error
          ? err.message
          : (isAr ? 'تعذّر التوليد — حاول مجدّداً' : 'Could not generate — try again'),
      );
    } finally {
      setLoading(false);
    }
  }, [buildPrompt, isAr, toolKey, isAuthenticated]);

  /* ── Reset (clear current session result/error; leave savedPlan intact) ── */
  const reset = useCallback(() => {
    abortRef.current?.abort();
    setResult(null);
    setError(null);
    setLoading(false);
    setRateLimited(false);
  }, []);

  /* ── View saved plan ── */
  const viewSaved = useCallback(() => {
    if (savedPlan) setResult(savedPlan.text);
  }, [savedPlan]);

  /* ── Delete saved plan ── */
  const deleteSaved = useCallback(async () => {
    if (!toolKey) return;
    setSavedPlan(null); // optimistic
    try {
      await fetch(`${API_BASE}/plans/${toolKey}`, {
        method:      'DELETE',
        credentials: 'include',
      });
    } catch {
      // Silent — plan may still exist server-side but UI is cleared
    }
  }, [toolKey]);

  return { loading, result, error, rateLimited, generate, reset, savedPlan, viewSaved, deleteSaved };
}
