import { useCallback, useEffect, useState } from 'react';

/**
 * Rate-limit retry countdown that stays honest against the server.
 *
 * Device clocks drift — especially across laptop sleep/wake — so the server
 * is the source of truth for whether the visitor is still limited. The hook:
 * - ticks a local countdown once started (`start(seconds)` after a 429),
 * - resyncs against `statusUrl` (GET → { limited, retryAfterSeconds }) on
 *   visibilitychange/focus and whenever the local countdown reaches zero,
 * - holds `limited = true` while the post-expiry resync is in-flight so the
 *   caller cannot submit before the server confirms the window is over,
 * - fails open on network errors (clears pending state, re-enables the caller).
 */
export function useRateLimitCountdown(statusUrl: string) {
  const [retryUntil, setRetryUntil] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  /**
   * True while a post-expiry server confirmation is in-flight.
   * Keeps `limited = true` even after the local deadline clears so submit
   * buttons remain disabled until the server confirms the window is over.
   */
  const [pendingConfirm, setPendingConfirm] = useState(false);

  // Re-validate the countdown against the server (does not consume quota).
  const resync = useCallback(async () => {
    try {
      const res = await fetch(statusUrl);
      if (!res.ok) return;
      const data = await res.json();
      const seconds = Number(data?.retryAfterSeconds);
      if (data?.limited && Number.isFinite(seconds) && seconds > 0) {
        setRetryUntil(Date.now() + seconds * 1000);
      } else {
        setRetryUntil(null);
        setSecondsLeft(0);
      }
    } catch { /* offline — fail open: clear pending so the caller isn't locked out */ }
    finally {
      // Always clear the pending flag after the request settles (success,
      // still-limited, or network failure) so `limited` reflects reality.
      setPendingConfirm(false);
    }
  }, [statusUrl]);

  useEffect(() => {
    if (retryUntil === null) return;
    const tick = () => {
      const remaining = Math.ceil((retryUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        // Local clock says the window is over.  Set pendingConfirm=true BEFORE
        // clearing retryUntil so `limited` stays true while the status request
        // is in-flight — prevents a premature re-enable before confirmation.
        setPendingConfirm(true);
        setRetryUntil(null);
        setSecondsLeft(0);
        void resync();
      } else {
        setSecondsLeft(remaining);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    // After tab wake / visibility change the local deadline may be stale
    // (clock drift, suspended timers) — resync with the server.
    const onVisible = () => {
      if (document.visibilityState === 'visible') void resync();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [retryUntil, resync]);

  /** Start (or restart) the countdown, e.g. from a 429's Retry-After. */
  const start = useCallback((seconds: number) => {
    setPendingConfirm(false);
    // Set secondsLeft eagerly so the first render after start() already shows
    // a non-zero value — the effect-driven ticker would set it asynchronously,
    // causing a flicker where limited=true but secondsLeft=0.
    setSecondsLeft(seconds);
    setRetryUntil(Date.now() + seconds * 1000);
  }, []);

  /** Clear the countdown (e.g. before a fresh submission attempt). */
  const clear = useCallback(() => {
    setRetryUntil(null);
    setSecondsLeft(0);
    setPendingConfirm(false);
  }, []);

  return { limited: retryUntil !== null || pendingConfirm, secondsLeft, start, clear, resync };
}
