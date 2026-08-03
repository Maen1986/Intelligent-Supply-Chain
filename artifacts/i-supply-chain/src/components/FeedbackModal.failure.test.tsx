import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { LanguageProvider } from '@/lib/LanguageContext';
import { FeedbackModal } from './FeedbackModal';

// Radix Slider requires ResizeObserver, which jsdom does not provide.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = ResizeObserverStub;

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

/**
 * Mock useRateLimitCountdown with real React state so that calling start()
 * properly triggers a re-render inside the test.  We also expose a module-level
 * `simulateClearCountdown` helper so tests can simulate the server confirming
 * the window is over (as the real hook does on focus/expiry).
 */
let simulateClearCountdown: (() => void) | null = null;

vi.mock('@/hooks/useRateLimitCountdown', async () => {
  const { useState, useCallback } = await import('react');
  return {
    useRateLimitCountdown: () => {
      const [limited, setLimited] = useState(false);
      const [secondsLeft, setSecondsLeft] = useState(0);
      const start = useCallback((seconds: number) => {
        setLimited(true);
        setSecondsLeft(seconds);
      }, []);
      const clear = useCallback(() => {
        setLimited(false);
        setSecondsLeft(0);
      }, []);
      // Expose clear so tests can simulate countdown expiry / server confirmation.
      simulateClearCountdown = clear;
      return { limited, secondsLeft, start, clear, resync: () => Promise.resolve() };
    },
  };
});

function renderModal(onClose = vi.fn()) {
  render(
    <LanguageProvider>
      <FeedbackModal open tool="diagnostic" onClose={onClose} />
    </LanguageProvider>,
  );
  return onClose;
}

describe('FeedbackModal failed submission', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    simulateClearCountdown = null;
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('shows an error and stays open when the server rejects (500)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 })) as unknown as typeof fetch);
    const onClose = renderModal();

    fireEvent.click(screen.getByTestId('star-4'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('button-feedback-submit'));
    });

    expect(screen.getByTestId('text-feedback-error')).toBeTruthy();
    expect(screen.queryByTestId('feedback-success')).toBeNull();
    // After a plain server error (not rate-limit) the button stays enabled so users can retry.
    const submit = screen.getByTestId('button-feedback-submit') as HTMLButtonElement;
    expect(submit.disabled).toBe(false);
    // Modal was not auto-closed
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows amber countdown and disables submit on 429, re-enables when window expires', async () => {
    const fetchMock = vi
      .fn()
      // First call: POST /feedback → 429 (no Retry-After header, body fallback → 3600 s)
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: { get: (_: string) => null },
        json: async () => null,
      })
      // Second call (after countdown clears): POST /feedback → success
      .mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ ok: true, id: 1 }) });
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);
    const onClose = renderModal();

    fireEvent.click(screen.getByTestId('star-5'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('button-feedback-submit'));
    });

    // The server-honest countdown notice is shown; generic error is NOT shown.
    expect(screen.getByTestId('text-feedback-rate-limit')).toBeTruthy();
    expect(screen.queryByTestId('text-feedback-error')).toBeNull();

    // Submit is DISABLED while the countdown is active — prevents premature retries.
    const submit = screen.getByTestId('button-feedback-submit') as HTMLButtonElement;
    expect(submit.disabled).toBe(true);

    // Simulate the server confirming the window has elapsed (real hook: focus/expiry resync).
    await act(async () => {
      simulateClearCountdown?.();
    });

    // Button is now enabled and the countdown banner is gone.
    expect(submit.disabled).toBe(false);
    expect(screen.queryByTestId('text-feedback-rate-limit')).toBeNull();

    // A retry now goes through and shows the success state.
    await act(async () => {
      fireEvent.click(submit);
    });
    expect(screen.getByTestId('feedback-success')).toBeTruthy();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1600);
    });
    expect(onClose).toHaveBeenCalled();
  });
});
