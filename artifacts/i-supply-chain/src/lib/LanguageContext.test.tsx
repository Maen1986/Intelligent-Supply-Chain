/**
 * Unit tests for LanguageContext — confirming that a QuotaExceededError thrown
 * by localStorage.setItem when setLang is called surfaces a visible toast
 * rather than silently discarding the language change.
 *
 * This guards against a future refactor accidentally replacing safeSetItem with
 * a bare localStorage.setItem call, which would silently lose the preference on
 * iOS Safari when storage is full.
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';

/* ── mock sonner before importing modules that use it ───────────────────── */
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
    dismiss: vi.fn(),
  },
}));

import { toast } from 'sonner';
import { LanguageProvider, useLanguage } from './LanguageContext';

/* ── helpers ────────────────────────────────────────────────────────────── */

function makeQuotaError(name = 'QuotaExceededError'): DOMException {
  return new DOMException('The quota has been exceeded.', name);
}

/**
 * A minimal consumer that exposes setLang so tests can call it imperatively.
 * The ref is populated after the first render.
 */
function TestConsumer({
  onMount,
}: {
  onMount: (setLang: (l: 'en' | 'ar') => void) => void;
}) {
  const { setLang } = useLanguage();
  React.useEffect(() => {
    onMount(setLang);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function renderWithProvider(): Promise<(l: 'en' | 'ar') => void> {
  return new Promise((resolve) => {
    render(
      <LanguageProvider>
        <TestConsumer onMount={resolve} />
      </LanguageProvider>,
    );
  });
}

/* ── setup ──────────────────────────────────────────────────────────────── */

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

/* ══════════════════════════════════════════════════════════════════════════
   LanguageContext — setLang happy path
══════════════════════════════════════════════════════════════════════════ */

describe('LanguageContext — setLang happy path', () => {
  it('does not call toast.error when storage write succeeds', async () => {
    const setLang = await renderWithProvider();
    act(() => { setLang('ar'); });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('persists the chosen language to localStorage on a normal write', async () => {
    const setLang = await renderWithProvider();
    act(() => { setLang('ar'); });
    expect(localStorage.getItem('isc-lang')).toBe('ar');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   LanguageContext — setLang triggers toast.error on QuotaExceededError
   (the core regression guard for this task)
══════════════════════════════════════════════════════════════════════════ */

describe('LanguageContext — setLang surfaces QuotaExceededError via toast', () => {
  it('calls toast.error when localStorage is full (Chrome/Safari QuotaExceededError)', async () => {
    const setLang = await renderWithProvider();

    const spy = vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => { throw makeQuotaError('QuotaExceededError'); });

    act(() => { setLang('ar'); });

    expect(toast.error).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it('calls toast.error with id="storage-quota-exceeded" so the toast is deduplicated', async () => {
    const setLang = await renderWithProvider();

    const spy = vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => { throw makeQuotaError(); });

    act(() => { setLang('ar'); });

    expect(toast.error).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ id: 'storage-quota-exceeded' }),
    );
    spy.mockRestore();
  });

  it('calls toast.error for NS_ERROR_DOM_QUOTA_REACHED (Firefox)', async () => {
    const setLang = await renderWithProvider();

    const spy = vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => { throw makeQuotaError('NS_ERROR_DOM_QUOTA_REACHED'); });

    act(() => { setLang('ar'); });

    expect(toast.error).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it('calls toast.error for QUOTA_EXCEEDED_ERR (older WebKit)', async () => {
    const setLang = await renderWithProvider();

    const spy = vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => { throw makeQuotaError('QUOTA_EXCEEDED_ERR'); });

    act(() => { setLang('ar'); });

    expect(toast.error).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it('does not throw — the component continues rendering normally after a quota error', async () => {
    const setLang = await renderWithProvider();

    const spy = vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => { throw makeQuotaError(); });

    expect(() => act(() => { setLang('ar'); })).not.toThrow();
    spy.mockRestore();
  });

  it('does NOT call toast.error for a non-quota DOMException', async () => {
    const setLang = await renderWithProvider();

    const spy = vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => {
        throw new DOMException('Security error.', 'SecurityError');
      });

    act(() => { setLang('ar'); });

    expect(toast.error).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
