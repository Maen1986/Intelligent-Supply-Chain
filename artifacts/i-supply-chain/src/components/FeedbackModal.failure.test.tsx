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
 * properly triggers a re-render inside the test.  The tick/resync behaviour
 * is already covered by the Diagnostic.rate-limit tests; here we only care
 * that FeedbackModal reacts correctly to the hook's limited/secondsLeft values.
 */
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
    // Retry button is still available and enabled
    const submit = screen.getByTestId('button-feedback-submit') as HTMLButtonElement;
    expect(submit.disabled).toBe(false);
    // Modal was not auto-closed
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows a live rate-limit countdown (429) and succeeds on retry', async () => {
    const fetchMock = vi
      .fn()
      // First call: POST /feedback → 429 (no body / headers, fallback to 3600 s)
      .mockResolvedValueOnce({ ok: false, status: 429 })
      // Second call: POST /feedback → success
      .mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ ok: true, id: 1 }) });
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);
    const onClose = renderModal();

    fireEvent.click(screen.getByTestId('star-5'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('button-feedback-submit'));
    });

    // The honest countdown notice is shown (mock hook: limited=true, secondsLeft=3600).
    // The generic error is NOT shown.
    expect(screen.getByTestId('text-feedback-rate-limit')).toBeTruthy();
    expect(screen.queryByTestId('text-feedback-error')).toBeNull();

    // Submit is still enabled — the server decides whether to accept a retry.
    const submit = screen.getByTestId('button-feedback-submit') as HTMLButtonElement;
    expect(submit.disabled).toBe(false);

    // Retry succeeds → success state is shown, onClose fires after 1.5 s.
    await act(async () => {
      fireEvent.click(screen.getByTestId('button-feedback-submit'));
    });
    expect(screen.getByTestId('feedback-success')).toBeTruthy();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1600);
    });
    expect(onClose).toHaveBeenCalled();
  });
});
