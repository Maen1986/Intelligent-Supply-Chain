/**
 * Unit tests for the safeSetItem localStorage helper.
 *
 * Verifies that:
 *  1. A normal write succeeds without triggering a toast.
 *  2. A QuotaExceededError fires toast.error with the correct id.
 *  3. All known quota-error variants (Chrome/Safari, Firefox, old WebKit, code 22) fire the toast.
 *  4. A non-quota DOMException does NOT fire a toast.
 *  5. The helper never throws; callers always continue normally.
 *  6. The toast message is short enough to read on a mobile screen and contains actionable text.
 *  7. Realistic fill-to-capacity: writing in a loop until quota is hit calls the toast exactly once.
 *
 * ── Manual smoke-test guide (iOS Safari / Android Chrome) ──────────────────
 *
 * Because automated tests run in jsdom which does not enforce the real ~5 MB
 * storage cap, the following steps verify the toast in a real mobile browser:
 *
 *  1. Open the app on a mobile device (or DevTools → Mobile Emulation).
 *  2. Open the browser console and paste:
 *
 *       // Fill localStorage to capacity
 *       const chunk = 'x'.repeat(50_000);       // 50 KB per write
 *       try {
 *         for (let i = 0; i < 300; i++) {
 *           localStorage.setItem(`fill-${i}`, chunk);
 *         }
 *       } catch(e) { console.log('Storage full after', i, 'writes'); }
 *
 *  3. Without refreshing, interact with any toolkit control (check a checklist
 *     item, add an action tracker entry, change a calculator field).
 *  4. Expected: a toast appears at the bottom of the screen reading:
 *       "Storage full — your changes could not be saved. Clear browser storage
 *        and try again."  (followed by the Arabic translation)
 *  5. Verify on a 375 px-wide viewport that the full message is readable
 *     (Sonner's default max-width keeps toasts within the viewport).
 *  6. Clean up: localStorage.clear() in the console.
 *
 * ──────────────────────────────────────────────────────────────────────────
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
function makeQuotaError(name = 'QuotaExceededError'): DOMException {
  return new DOMException('The quota has been exceeded.', name);
}

/** Simulates a legacy WebKit error that identifies by numeric code only. */
function makeCode22Error(): DOMException {
  // DOMException code 22 === QUOTA_EXCEEDED_ERR in the legacy API.
  // Modern browsers name it 'QuotaExceededError'; old WebKit may only set code.
  const e = new DOMException('Quota exceeded.', 'QuotaExceededError');
  // Override name to something unrecognised so only code=22 matches.
  Object.defineProperty(e, 'name', { value: 'UnknownQuotaError' });
  Object.defineProperty(e, 'code', { value: 22 });
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
   safeSetItem — quota exceeded (all browser variants)
══════════════════════════════════════════════════════════════════════════ */

describe('safeSetItem — quota exceeded', () => {
  it('calls toast.error when localStorage.setItem throws QuotaExceededError (Chrome/Safari)', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => { throw makeQuotaError('QuotaExceededError'); });
    safeSetItem('any-key', 'any-value');
    expect(toast.error).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it('calls toast.error for NS_ERROR_DOM_QUOTA_REACHED (Firefox)', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => { throw makeQuotaError('NS_ERROR_DOM_QUOTA_REACHED'); });
    safeSetItem('any-key', 'any-value');
    expect(toast.error).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it('calls toast.error for QUOTA_EXCEEDED_ERR (older WebKit name)', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => { throw makeQuotaError('QUOTA_EXCEEDED_ERR'); });
    safeSetItem('any-key', 'any-value');
    expect(toast.error).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it('calls toast.error when DOMException.code === 22 (legacy numeric constant)', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => { throw makeCode22Error(); });
    safeSetItem('any-key', 'any-value');
    expect(toast.error).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it('passes id="storage-quota-exceeded" to deduplicate toasts', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => { throw makeQuotaError(); });
    safeSetItem('any-key', 'any-value');
    expect(toast.error).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ id: 'storage-quota-exceeded' }),
    );
    spy.mockRestore();
  });

  it('does not throw when quota is exceeded — caller continues normally', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => { throw makeQuotaError(); });
    expect(() => safeSetItem('any-key', 'any-value')).not.toThrow();
    spy.mockRestore();
  });

  it('fires toast once per call even if called multiple times', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => { throw makeQuotaError(); });
    safeSetItem('k1', 'v1');
    safeSetItem('k2', 'v2');
    // toast.error called once per safeSetItem call (deduplication is sonner's job)
    expect(toast.error).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });

  /**
   * Realistic fill-to-capacity simulation.
   *
   * Mocks setItem to succeed for the first N calls then throw, matching real
   * browser behaviour where the app accumulates data over time until the cap
   * is reached on a later write.  Confirms the toast fires on the write that
   * hits the limit, not before.
   */
  it('fires toast exactly once on the write that hits the quota limit', () => {
    let callCount = 0;
    const allowedWrites = 5;
    const spy = vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementation((_key: string, _value: string) => {
        callCount++;
        if (callCount > allowedWrites) throw makeQuotaError();
      });

    // Simulate multiple toolkit saves accumulating data
    for (let i = 0; i < allowedWrites; i++) {
      safeSetItem(`toolkit-key-${i}`, JSON.stringify({ data: 'x'.repeat(100) }));
    }
    expect(toast.error).not.toHaveBeenCalled(); // under quota — no toast yet

    safeSetItem('toolkit-key-final', 'overflow'); // this one hits the limit
    expect(toast.error).toHaveBeenCalledOnce();

    spy.mockRestore();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   safeSetItem — toast message content (mobile readability)
══════════════════════════════════════════════════════════════════════════ */

describe('safeSetItem — toast message readability', () => {
  it('toast message contains an English actionable sentence', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => { throw makeQuotaError(); });
    safeSetItem('any-key', 'any-value');

    const [message] = (toast.error as ReturnType<typeof vi.fn>).mock.calls[0] as [string, ...unknown[]];
    // Must mention the problem and what the user should do
    expect(message).toMatch(/storage full/i);
    expect(message).toMatch(/could not be saved/i);
    expect(message).toMatch(/clear browser storage/i);

    spy.mockRestore();
  });

  it('toast message contains an Arabic actionable sentence', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => { throw makeQuotaError(); });
    safeSetItem('any-key', 'any-value');

    const [message] = (toast.error as ReturnType<typeof vi.fn>).mock.calls[0] as [string, ...unknown[]];
    // Arabic translation must be present
    expect(message).toMatch(/التخزين ممتلئ/);
    expect(message).toMatch(/أفرغ مساحة المتصفح/);

    spy.mockRestore();
  });

  it('toast is shown for 8 seconds — long enough to read on mobile', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => { throw makeQuotaError(); });
    safeSetItem('any-key', 'any-value');

    const [, options] = (toast.error as ReturnType<typeof vi.fn>).mock.calls[0] as [string, { duration?: number }];
    // 8 000 ms gives users on slow mobile connections enough time to read the bilingual message
    expect(options.duration).toBeGreaterThanOrEqual(8000);

    spy.mockRestore();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   safeSetItem — non-quota errors
══════════════════════════════════════════════════════════════════════════ */

describe('safeSetItem — non-quota errors', () => {
  it('does NOT call toast.error for a non-quota DOMException', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => { throw makeOtherDOMException(); });
    safeSetItem('any-key', 'any-value');
    expect(toast.error).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('does not throw for a non-quota DOMException', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => { throw makeOtherDOMException(); });
    expect(() => safeSetItem('any-key', 'any-value')).not.toThrow();
    spy.mockRestore();
  });

  it('does NOT call toast.error for a plain Error', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => { throw new Error('unexpected'); });
    safeSetItem('any-key', 'any-value');
    expect(toast.error).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
