/**
 * FeedbackModal.countdown.test.tsx
 *
 * Integration test using the REAL useRateLimitCountdown hook (not mocked) to
 * verify that the submit button stays disabled while the post-expiry server
 * confirmation is in-flight, and only re-enables when the server responds with
 * limited=false.  This catches the race condition where the local deadline
 * clears before resync() resolves.
 */
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

// useRateLimitCountdown is intentionally NOT mocked here —
// we exercise the real expiry → pendingConfirm → server-clear sequence.

function renderModal(onClose = vi.fn()) {
  render(
    <LanguageProvider>
      <FeedbackModal open tool="diagnostic" onClose={onClose} />
    </LanguageProvider>,
  );
  return onClose;
}

describe('FeedbackModal countdown — real hook, deferred status response', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('keeps submit disabled while the post-expiry resync is in-flight, re-enables on server confirmation', async () => {
    // The status endpoint returns a promise we resolve manually so we can
    // assert the disabled state before and after server confirmation.
    let resolveStatus!: (r: Response) => void;
    const statusDeferred = new Promise<Response>((res) => { resolveStatus = res; });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url: string) => {
        if (String(url).includes('rate-limit')) {
          // Status check — deferred so we can inspect disabled state mid-flight
          return statusDeferred;
        }
        // POST /feedback → 429 with Retry-After: 1  (1-second countdown)
        return {
          ok: false,
          status: 429,
          headers: { get: (h: string) => (h.toLowerCase() === 'retry-after' ? '1' : null) },
          json: async () => null,
        } as unknown as Response;
      }) as unknown as typeof fetch,
    );

    renderModal();
    fireEvent.click(screen.getByTestId('star-4'));

    // Submit → 429 → hook starts a 1-second countdown
    await act(async () => {
      fireEvent.click(screen.getByTestId('button-feedback-submit'));
    });

    const submit = screen.getByTestId('button-feedback-submit') as HTMLButtonElement;

    // Button is disabled immediately after the 429 (retryUntil is set)
    expect(submit.disabled).toBe(true);
    expect(screen.getByTestId('text-feedback-rate-limit')).toBeTruthy();

    // Advance past the 1-second deadline → tick fires, pendingConfirm=true, resync starts
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });

    // Button is STILL disabled — resync is in-flight (pendingConfirm=true),
    // proving no premature re-enable while the status request is outstanding.
    expect(submit.disabled).toBe(true);
    expect(screen.getByTestId('text-feedback-rate-limit')).toBeTruthy();

    // Server confirms the window has expired → limited=false
    await act(async () => {
      resolveStatus({
        ok: true,
        json: async () => ({ limited: false, retryAfterSeconds: 0 }),
      } as unknown as Response);
      // Flush the resync() async chain (fetch → json → setState)
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    // Now the button is enabled and the amber banner is gone
    expect(submit.disabled).toBe(false);
    expect(screen.queryByTestId('text-feedback-rate-limit')).toBeNull();
  });

  it('re-extends the countdown if the server still reports limited after local expiry', async () => {
    // Status endpoint first says still-limited (30 more seconds), then clears
    let callCount = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url: string) => {
        if (String(url).includes('rate-limit')) {
          callCount++;
          return {
            ok: true,
            json: async () =>
              callCount === 1
                ? { limited: true, retryAfterSeconds: 30 }   // still limited
                : { limited: false, retryAfterSeconds: 0 },   // now clear
          } as unknown as Response;
        }
        // POST /feedback → 429 with Retry-After: 1
        return {
          ok: false,
          status: 429,
          headers: { get: (h: string) => (h.toLowerCase() === 'retry-after' ? '1' : null) },
          json: async () => null,
        } as unknown as Response;
      }) as unknown as typeof fetch,
    );

    renderModal();
    fireEvent.click(screen.getByTestId('star-3'));

    await act(async () => {
      fireEvent.click(screen.getByTestId('button-feedback-submit'));
    });

    const submit = screen.getByTestId('button-feedback-submit') as HTMLButtonElement;
    expect(submit.disabled).toBe(true);

    // Advance past 1-second deadline → resync fires → server says still limited (30 s)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
      // Flush resync microtasks
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    // Still disabled — the 30-second extension is now active
    expect(submit.disabled).toBe(true);
  });
});
