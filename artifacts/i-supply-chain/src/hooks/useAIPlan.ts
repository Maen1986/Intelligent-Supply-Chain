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
  loading:     boolean;
  result:      string | null;
  error:       string | null;
  generate:    () => Promise<void>;
  reset:       () => void;
  savedPlan:   SavedPlan | null;
  viewSaved:   () => void;
  deleteSaved: () => Promise<void>;
}

export function useAIPlan(buildPrompt: () => string, isAr: boolean, toolKey?: string): AIPlanState {
  const { isAuthenticated } = useAuth();

  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState<string | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [savedPlan, setSavedPlan] = useState<SavedPlan | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  /* ── Load saved plan on mount / when auth state changes ── */
  useEffect(() => {
    if (!toolKey || !isAuthenticated) {
      setSavedPlan(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res  = await fetch(`${API_BASE}/plans/${toolKey}`, { credentials: 'include' });
        const data = await res.json() as { ok: boolean; plan?: SavedPlan | null };
        if (!cancelled && data.ok && data.plan) {
          setSavedPlan(data.plan);
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

    try {
      const res = await fetch(`${API_BASE}/ai/plan`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: buildPrompt(), language: isAr ? 'ar' : 'en' }),
        signal: abortRef.current.signal,
      });

      const data = await res.json() as { ok: boolean; text?: string; error?: string };
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

  return { loading, result, error, generate, reset, savedPlan, viewSaved, deleteSaved };
}
