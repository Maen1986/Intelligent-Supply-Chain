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
  /** True when generation succeeded but the server-side save failed — plan is shown but not persisted. */
  saveError:    boolean;
  generate:     () => Promise<void>;
  reset:        () => void;
  savedPlan:    SavedPlan | null;
  viewSaved:    () => void;
  deleteSaved:  () => Promise<void>;
  dismissSaveError: () => void;
}

export function useAIPlan(
  buildPrompt: () => string,
  isAr: boolean,
  toolKey?: string,
  /** When false, auto-generate on login is suppressed (same gate as the disabled prop on the button). Defaults to true. */
  canGenerate: boolean = true,
): AIPlanState {
  const { isAuthenticated } = useAuth();

  const [loading,     setLoading]     = useState(false);
  const [result,      setResult]      = useState<string | null>(null);
  const [error,       setError]       = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [saveError,   setSaveError]   = useState(false);
  const [savedPlan,   setSavedPlan]   = useState<SavedPlan | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const prevAuthenticated = useRef<boolean>(isAuthenticated);

  /**
   * Set by Effect B when the pending-plan flag is consumed on login.
   * Effect C reads this after the saved-plan fetch resolves and only calls
   * generate() when no existing plan was found — preventing overwrites.
   */
  const pendingFlagConsumed = useRef(false);

  /* ── Auto-generate once when the user just logged in ── */
  useEffect(() => {
    const wasAuthenticated = prevAuthenticated.current;
    prevAuthenticated.current = isAuthenticated;

    if (isAuthenticated && !wasAuthenticated && !result && !savedPlan && !loading && canGenerate) {
      // Skip if the sessionStorage pending-plan hook will handle this login event
      // (that hook takes priority to avoid two simultaneous generate() calls).
      const hasPendingFlag = toolKey
        ? sessionStorage.getItem(`pendingAIPlan_${toolKey}`) === '1'
        : false;
      if (!hasPendingFlag) {
        generate();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, result, savedPlan, canGenerate]);

  /* ── Consume pendingAIPlan_<toolKey> flag on login — defer generate to Effect C ── */
  const prevAuthRef = useRef<boolean>(isAuthenticated);
  useEffect(() => {
    const wasAuthenticated = prevAuthRef.current;
    prevAuthRef.current = isAuthenticated;

    if (isAuthenticated && !wasAuthenticated && toolKey) {
      const flagKey = `pendingAIPlan_${toolKey}`;
      if (sessionStorage.getItem(flagKey) === '1') {
        // Always remove the flag on login to prevent it lingering when canGenerate
        // is false (e.g. the form is still empty). Only defer a generate() call
        // when canGenerate is true — Effect C will fire it after the saved-plan
        // fetch confirms there is no existing plan.
        sessionStorage.removeItem(flagKey);
        if (canGenerate) {
          pendingFlagConsumed.current = true;
        }
        // If !canGenerate: flag is discarded, generate() is NOT called.
      }
    } else {
      // Auth didn't just transition false→true (e.g. toolKey or canGenerate changed
      // while already authenticated). Clear any stale deferred-generate marker so it
      // can't fire unexpectedly on a subsequent Effect C run.
      pendingFlagConsumed.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, toolKey, canGenerate]);

  /* ── Load saved plan on mount / when toolKey or auth state changes ── */
  useEffect(() => {
    // Always clear stale savedPlan and in-session result immediately when key or auth changes,
    // so a previous tool's plan never flashes in the UI during tab transitions.
    setSavedPlan(null);
    setResult(null);

    if (!toolKey || !isAuthenticated) {
      pendingFlagConsumed.current = false;
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res  = await fetch(`${API_BASE}/plans/${toolKey}`, { credentials: 'include' });
        const data = await res.json() as { ok: boolean; plan?: SavedPlan | null };
        if (!cancelled) {
          const plan = data.ok && data.plan ? data.plan : null;
          setSavedPlan(plan);

          // If Effect B deferred a generate() (pending flag was set on login),
          // only proceed when the server confirmed there is no existing plan.
          if (pendingFlagConsumed.current) {
            pendingFlagConsumed.current = false;
            if (!plan) {
              generate();
            }
          }
        }
      } catch {
        // Non-fatal — user just won't see a saved plan notice
        pendingFlagConsumed.current = false;
      }
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolKey, isAuthenticated]);

  /* ── Generate (and persist if authenticated) ── */
  const generate = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setResult(null);
    setError(null);
    setRateLimited(false);
    setSaveError(false);

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
          if (saveRes.ok && saveData.ok && saveData.savedAt) {
            setSavedPlan({ text, savedAt: saveData.savedAt });
          } else {
            // HTTP error or API-level failure — plan shown but not persisted
            setSaveError(true);
          }
        } catch {
          // Network/parse error — plan shown but not persisted; surface a warning
          setSaveError(true);
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
    setSaveError(false);
  }, []);

  /* ── Dismiss save-error warning without clearing the result ── */
  const dismissSaveError = useCallback(() => setSaveError(false), []);

  /* ── View saved plan ── */
  const viewSaved = useCallback(() => {
    if (savedPlan) setResult(savedPlan.text);
  }, [savedPlan]);

  /* ── Delete saved plan ── */
  const deleteSaved = useCallback(async () => {
    if (!toolKey) return;
    const previousPlan = savedPlan;
    setSavedPlan(null); // optimistic
    try {
      const res = await fetch(`${API_BASE}/plans/${toolKey}`, {
        method:      'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        // Server rejected the delete — restore the saved plan and surface an error
        setSavedPlan(previousPlan);
        setError(isAr ? 'تعذّر حذف الخطة — حاول مجدّداً' : 'Could not delete plan — try again');
      }
    } catch {
      // Network error — restore the saved plan and surface an error
      setSavedPlan(previousPlan);
      setError(isAr ? 'تعذّر حذف الخطة — حاول مجدّداً' : 'Could not delete plan — try again');
    }
  }, [toolKey, savedPlan, isAr]);

  return { loading, result, error, rateLimited, saveError, generate, reset, savedPlan, viewSaved, deleteSaved, dismissSaveError };
}
