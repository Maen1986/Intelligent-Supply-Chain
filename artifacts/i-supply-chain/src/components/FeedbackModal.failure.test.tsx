import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup, waitFor } from '@testing-library/react';
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

  it('shows an error when rate-limited (429), then succeeds on retry', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 429 })
      .mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ ok: true, id: 1 }) });
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);
    const onClose = renderModal();

    fireEvent.click(screen.getByTestId('star-5'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('button-feedback-submit'));
    });
    expect(screen.getByTestId('text-feedback-error')).toBeTruthy();

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
