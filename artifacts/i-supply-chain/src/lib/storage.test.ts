/**
 * Unit tests for safeSetItem and clearAppStorage.
 *
 * Verifies that:
 *  1. A normal write succeeds without triggering a toast.
 *  2. A QuotaExceededError fires toast.error with the correct id.
 *  3. All known quota-error variants (Chrome/Safari, Firefox, old WebKit, code 22) fire the toast.
 *  4. A non-quota DOMException does NOT fire a toast.
 *  5. The helper never throws; callers always continue normally.
 *  6. The toast message is short enough to read on a mobile screen.
 *  7. The toast includes an action button (label + onClick) for one-tap recovery.
 *  8. Realistic fill-to-capacity: writing in a loop until quota is hit calls the toast exactly once.
 *  9. clearAppStorage removes only isc-/isc_ prefixed keys, leaving others intact.
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
 *  4. Expected: a toast appears at the bottom of the screen with the bilingual
 *     message and a "Clear saved data / مسح البيانات" action button.
 *  5. Verify on a 375 px-wide viewport that the button is large enough to tap
 *     (Sonner renders action buttons as full-width on narrow viewports).
 *  6. Tap the button, confirm the dialog, and verify the toast dismisses and
 *     all isc- keys are gone from Application → Local Storage in DevTools.
 *  7. Clean up any remaining fill-N keys: localStorage.clear() in the console.
 *
 * ──────────────────────────────────────────────────────────────────────────
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

/* ── mock sonner before importing the module under test ─────────────────── */
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    dismiss: vi.fn(),
  },
}));

import { toast } from 'sonner';
import { safeSetItem, clearAppStorage } from './storage';

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
  it('toast message contains an English error description', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => { throw makeQuotaError(); });
    safeSetItem('any-key', 'any-value');

    const [message] = (toast.error as ReturnType<typeof vi.fn>).mock.calls[0] as [string, ...unknown[]];
    expect(message).toMatch(/storage full/i);
    expect(message).toMatch(/could not be saved/i);

    spy.mockRestore();
  });

  it('toast message contains an Arabic error description', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => { throw makeQuotaError(); });
    safeSetItem('any-key', 'any-value');

    const [message] = (toast.error as ReturnType<typeof vi.fn>).mock.calls[0] as [string, ...unknown[]];
    expect(message).toMatch(/التخزين ممتلئ/);
    expect(message).toMatch(/تعذّر حفظ التغييرات/);

    spy.mockRestore();
  });

  it('toast is shown for at least 8 seconds — long enough to read on mobile', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => { throw makeQuotaError(); });
    safeSetItem('any-key', 'any-value');

    const [, options] = (toast.error as ReturnType<typeof vi.fn>).mock.calls[0] as [string, { duration?: number }];
    expect(options.duration).toBeGreaterThanOrEqual(8000);

    spy.mockRestore();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   safeSetItem — action button (one-tap recovery)
══════════════════════════════════════════════════════════════════════════ */

describe('safeSetItem — action button', () => {
  it('includes an action object in the toast options', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => { throw makeQuotaError(); });
    safeSetItem('any-key', 'any-value');

    const [, options] = (toast.error as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      { action?: { label: string; onClick: () => void } },
    ];
    expect(options.action).toBeDefined();
    expect(typeof options.action?.label).toBe('string');
    expect(options.action?.label.length).toBeGreaterThan(0);
    expect(typeof options.action?.onClick).toBe('function');

    spy.mockRestore();
  });

  it('action label is readable on a 375 px iOS Safari viewport (≤ 40 chars)', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => { throw makeQuotaError(); });
    safeSetItem('any-key', 'any-value');

    const [, options] = (toast.error as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      { action?: { label: string; onClick: () => void } },
    ];
    // Keeps the button label concise so it is not clipped on narrow screens
    expect(options.action!.label.length).toBeLessThanOrEqual(40);

    spy.mockRestore();
  });

  it('action onClick does nothing when the user cancels the confirmation', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => { throw makeQuotaError(); });
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false);

    safeSetItem('any-key', 'any-value');
    const [, options] = (toast.error as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      { action?: { label: string; onClick: () => void } },
    ];

    // Seed some app keys so we can verify they are NOT removed
    localStorage.setItem('isc-tool-test', 'should-remain');
    options.action!.onClick();

    expect(localStorage.getItem('isc-tool-test')).toBe('should-remain');
    expect(toast.dismiss).not.toHaveBeenCalled();

    spy.mockRestore();
  });

  it('action onClick clears app storage and dismisses the toast when confirmed', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => { throw makeQuotaError(); });
    vi.spyOn(window, 'confirm').mockReturnValueOnce(true);

    safeSetItem('any-key', 'any-value');
    const [, options] = (toast.error as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      { action?: { label: string; onClick: () => void } },
    ];

    localStorage.setItem('isc-tool-test', 'data');
    localStorage.setItem('isc-kpi-foo', 'data');
    localStorage.setItem('other-app-key', 'keep-me');

    options.action!.onClick();

    expect(localStorage.getItem('isc-tool-test')).toBeNull();
    expect(localStorage.getItem('isc-kpi-foo')).toBeNull();
    expect(localStorage.getItem('other-app-key')).toBe('keep-me');
    expect(toast.dismiss).toHaveBeenCalledWith('storage-quota-exceeded');

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

/* ══════════════════════════════════════════════════════════════════════════
   clearAppStorage
══════════════════════════════════════════════════════════════════════════ */

describe('clearAppStorage', () => {
  it('removes keys with the isc- prefix', () => {
    localStorage.setItem('isc-tool-checklist', '[]');
    localStorage.setItem('isc-kpi-overview', '{}');
    clearAppStorage();
    expect(localStorage.getItem('isc-tool-checklist')).toBeNull();
    expect(localStorage.getItem('isc-kpi-overview')).toBeNull();
  });

  it('removes keys with the isc_ prefix', () => {
    localStorage.setItem('isc_banner_dismissed_v2', '1');
    clearAppStorage();
    expect(localStorage.getItem('isc_banner_dismissed_v2')).toBeNull();
  });

  it('leaves keys that do not belong to the app untouched', () => {
    localStorage.setItem('some-other-app', 'value');
    localStorage.setItem('_ga', 'analytics');
    localStorage.setItem('isc-tool-test', 'mine');
    clearAppStorage();
    expect(localStorage.getItem('some-other-app')).toBe('value');
    expect(localStorage.getItem('_ga')).toBe('analytics');
  });

  it('does not throw when localStorage is empty', () => {
    expect(() => clearAppStorage()).not.toThrow();
  });

  it('removes all isc- keys in a mixed store', () => {
    localStorage.setItem('isc-a', '1');
    localStorage.setItem('isc-b', '2');
    localStorage.setItem('isc-c', '3');
    localStorage.setItem('keep-me', 'yes');
    clearAppStorage();
    expect(localStorage.length).toBe(1);
    expect(localStorage.getItem('keep-me')).toBe('yes');
  });
});
