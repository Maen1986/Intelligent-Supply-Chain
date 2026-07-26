/**
 * useAIPlan — shared hook for AI "Generate" action plan buttons.
 *
 * Usage:
 *   const { loading, result, error, generate, reset } = useAIPlan(buildPrompt, isAr);
 *
 * - buildPrompt: called lazily when generate() is triggered; must return the full prompt string
 * - isAr: controls the language param sent to the server
 *
 * Output is ephemeral — not persisted to localStorage or the server.
 */
import { useState, useCallback, useRef } from 'react';
import { API_BASE } from '@/lib/apiBase';

export interface AIPlanState {
  loading: boolean;
  result:  string | null;
  error:   string | null;
  generate: () => Promise<void>;
  reset:    () => void;
}

export function useAIPlan(buildPrompt: () => string, isAr: boolean): AIPlanState {
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<string | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(async () => {
    // Cancel any in-flight request before starting a new one
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
      setResult(data.text ?? '');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return; // user navigated away
      setError(
        err instanceof Error
          ? err.message
          : (isAr ? 'تعذّر التوليد — حاول مجدّداً' : 'Could not generate — try again'),
      );
    } finally {
      setLoading(false);
    }
  }, [buildPrompt, isAr]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setResult(null);
    setError(null);
    setLoading(false);
  }, []);

  return { loading, result, error, generate, reset };
}
