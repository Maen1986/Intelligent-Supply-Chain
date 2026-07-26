/**
 * Unit tests for the safeSetItem localStorage helper.
 *
 * Verifies that:
 *  1. A normal write succeeds without triggering a toast.
 *  2. A QuotaExceededError fires toast.error with the correct id.
 *  3. A non-quota DOMException does NOT fire a toast.
 *  4. The helper never throws; callers always continue normally.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

/* ── mock sonner before importing the module under test ─────────────────── */
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

import { toast } from 'sonner';
import { safeSetItem } from './storage';

/* ── helpers ────────────────────────────────────────────────────────────── */
function makeQuotaError(): DOMException {
  // DOMException constructor: new DOMException(message, name)
  const e = new DOMException('The quota has been exceeded.', 'QuotaExceededError');
  return e;
}

function makeOtherDOMException(): DOMException {
  return new DOMException('Security error.', 'SecurityError');
}

/* ── setup ──────────────────────────────────────────────────────────────── */
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

/* ══════════════════════════════════════════════════════════════════════════
   safeSetItem — happy path
══════════════════════════════════════════════════════════════════════════ */

describe('safeSetItem — happy path', () => {
  it('writes the value to localStorage', () => {
    safeSetItem('test-key', 'hello');
    expect(localStorage.getItem('test-key')).toBe('hello');
  });

  it('does not call toast.error on a successful write', () => {
    safeSetItem('test-key', JSON.stringify({ a: 1 }));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('overwrites an existing value', () => {
    localStorage.setItem('test-key', 'old');
    safeSetItem('test-key', 'new');
    expect(localStorage.getItem('test-key')).toBe('new');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   safeSetItem — quota exceeded
══════════════════════════════════════════════════════════════════════════ */

describe('safeSetItem — quota exceeded', () => {
  it('calls toast.error when localStorage.setItem throws QuotaExceededError', () => {
    const setItemSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => { throw makeQuotaError(); });

    safeSetItem('any-key', 'any-value');

    expect(toast.error).toHaveBeenCalledOnce();
    setItemSpy.mockRestore();
  });

  it('passes id="storage-quota-exceeded" to deduplicate toasts', () => {
    const setItemSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => { throw makeQuotaError(); });

    safeSetItem('any-key', 'any-value');

    expect(toast.error).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ id: 'storage-quota-exceeded' }),
    );
    setItemSpy.mockRestore();
  });

  it('does not throw when quota is exceeded — caller continues normally', () => {
    const setItemSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => { throw makeQuotaError(); });

    expect(() => safeSetItem('any-key', 'any-value')).not.toThrow();
    setItemSpy.mockRestore();
  });

  it('fires toast once per call even if called multiple times', () => {
    const setItemSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => { throw makeQuotaError(); });

    safeSetItem('k1', 'v1');
    safeSetItem('k2', 'v2');

    // toast.error called once per safeSetItem call (deduplication is sonner's job)
    expect(toast.error).toHaveBeenCalledTimes(2);
    setItemSpy.mockRestore();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   safeSetItem — non-quota errors
══════════════════════════════════════════════════════════════════════════ */

describe('safeSetItem — non-quota errors', () => {
  it('does NOT call toast.error for a non-quota DOMException', () => {
    const setItemSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => { throw makeOtherDOMException(); });

    safeSetItem('any-key', 'any-value');

    expect(toast.error).not.toHaveBeenCalled();
    setItemSpy.mockRestore();
  });

  it('does not throw for a non-quota DOMException', () => {
    const setItemSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => { throw makeOtherDOMException(); });

    expect(() => safeSetItem('any-key', 'any-value')).not.toThrow();
    setItemSpy.mockRestore();
  });

  it('does NOT call toast.error for a plain Error', () => {
    const setItemSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => { throw new Error('unexpected'); });

    safeSetItem('any-key', 'any-value');

    expect(toast.error).not.toHaveBeenCalled();
    setItemSpy.mockRestore();
  });
});
