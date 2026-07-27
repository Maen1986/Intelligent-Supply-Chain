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
 * 10. When localStorage is fully blocked (private/incognito mode) a warning toast fires instead of
 *     silently losing the write.
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
 * ── Manual smoke-test guide (private / incognito mode) ─────────────────────
 *
 *  1. Open the app in a private/incognito tab (Safari: File → New Private
 *     Window; Chrome: ⌘/Ctrl+Shift+N).
 *  2. Interact with any toolkit control that persists data.
 *  3. Expected: a warning toast appears reading "Private browsing detected —
 *     your changes cannot be saved. Open the app in a normal tab to keep your
 *     work." (followed by the Arabic translation).
 *  4. Confirm the toast does not appear again while staying in the same tab
 *     (Sonner deduplicates by id).
 *
 * ──────────────────────────────────────────────────────────────────────────
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

/* ── mock sonner before importing the module under test ─────────────────── */
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
    dismiss: vi.fn(),
    success: vi.fn(),
  },
}));

import { toast } from 'sonner';
import { _resetStorageAvailabilityCache, clearAppStorage, safeSetItem } from './storage';

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

function makeSecurityError(): DOMException {
  return new DOMException('The operation is insecure.', 'SecurityError');
}

function makeOtherDOMException(): DOMException {
  return new DOMException('Security error.', 'SecurityError');
}

/* ── setup ──────────────────────────────────────────────────────────────── */
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  // NOTE: _resetStorageAvailabilityCache() is intentionally NOT called here.
  // The availability probe runs once at module load (jsdom → available = true)
  // and should stay cached so quota-error mocks don't accidentally retrigger
  // the probe. Private-browsing tests reset the cache explicitly.
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

  it('does not call toast.warning on a successful write', () => {
    safeSetItem('test-key', JSON.stringify({ a: 1 }));
    expect(toast.warning).not.toHaveBeenCalled();
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
    vi.useFakeTimers();
    const reloadSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload: reloadSpy },
    });

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
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining('Cleared'),
      expect.objectContaining({ id: 'storage-cleared' }),
    );

    // reload should not fire immediately — it is delayed by 1 500 ms
    expect(reloadSpy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1500);
    expect(reloadSpy).toHaveBeenCalledOnce();

    spy.mockRestore();
    vi.useRealTimers();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   safeSetItem — non-quota errors (storage available, write-time error)
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

/* ══════════════════════════════════════════════════════════════════════════
   safeSetItem — private / incognito browsing (localStorage fully blocked)
══════════════════════════════════════════════════════════════════════════ */

describe('safeSetItem — private browsing (localStorage unavailable)', () => {
  /**
   * Helper: mock ALL setItem calls to throw a SecurityError (simulating iOS
   * Safari private mode), reset the cached availability result so the probe
   * reruns, then run the callback, and finally restore everything.
   */
  function withBlockedStorage(fn: (spy: ReturnType<typeof vi.spyOn>) => void): void {
    const spy = vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => { throw makeSecurityError(); });
    _resetStorageAvailabilityCache(); // force probe to rerun inside next safeSetItem call
    try {
      fn(spy);
    } finally {
      spy.mockRestore();
      _resetStorageAvailabilityCache(); // clean up so later tests start fresh
    }
  }

  it('calls toast.warning when localStorage is completely blocked', () => {
    withBlockedStorage(() => {
      safeSetItem('any-key', 'any-value');
      expect(toast.warning).toHaveBeenCalledOnce();
    });
  });

  it('does NOT call toast.error when localStorage is completely blocked', () => {
    withBlockedStorage(() => {
      safeSetItem('any-key', 'any-value');
      expect(toast.error).not.toHaveBeenCalled();
    });
  });

  it('does not throw when localStorage is completely blocked', () => {
    withBlockedStorage(() => {
      expect(() => safeSetItem('any-key', 'any-value')).not.toThrow();
    });
  });

  it('passes id="storage-private-browsing" so the toast is deduplicated', () => {
    withBlockedStorage(() => {
      safeSetItem('any-key', 'any-value');
      expect(toast.warning).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ id: 'storage-private-browsing' }),
      );
    });
  });

  it('private-browsing toast contains an English actionable sentence', () => {
    withBlockedStorage(() => {
      safeSetItem('any-key', 'any-value');
      const [message] = (toast.warning as ReturnType<typeof vi.fn>).mock.calls[0] as [string, ...unknown[]];
      expect(message).toMatch(/private browsing/i);
      expect(message).toMatch(/cannot be saved/i);
      expect(message).toMatch(/normal tab/i);
    });
  });

  it('private-browsing toast contains an Arabic actionable sentence', () => {
    withBlockedStorage(() => {
      safeSetItem('any-key', 'any-value');
      const [message] = (toast.warning as ReturnType<typeof vi.fn>).mock.calls[0] as [string, ...unknown[]];
      expect(message).toMatch(/وضع التصفح الخاص/);
      expect(message).toMatch(/تبويب عادي/);
    });
  });

  it('private-browsing toast is shown for 8 seconds — long enough to read on mobile', () => {
    withBlockedStorage(() => {
      safeSetItem('any-key', 'any-value');
      const [, options] = (toast.warning as ReturnType<typeof vi.fn>).mock.calls[0] as [string, { duration?: number }];
      expect(options.duration).toBeGreaterThanOrEqual(8000);
    });
  });

  it('fires the warning toast on every call while blocked (Sonner deduplicates by id)', () => {
    // Each safeSetItem call fires toast.warning — Sonner's id-deduplication
    // ensures only one notification is visible on screen at any time.
    withBlockedStorage(() => {
      safeSetItem('k1', 'v1');
      safeSetItem('k2', 'v2');
      expect(toast.warning).toHaveBeenCalledTimes(2);
    });
  });

  it('caches the unavailability result — probe runs only once across multiple calls', () => {
    // The probe write is Storage.prototype.setItem. Count calls to confirm only
    // one probe write happens regardless of how many safeSetItem calls are made.
    withBlockedStorage((spy) => {
      safeSetItem('k1', 'v1');
      safeSetItem('k2', 'v2');
      safeSetItem('k3', 'v3');
      // Only the very first call triggers the probe (1 setItem call).
      // Subsequent calls skip the probe and go straight to toast.warning.
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   safeSetItem — boolean return value
   Callers can use the return value to suppress misleading "Saved ✓" states.
══════════════════════════════════════════════════════════════════════════ */

describe('safeSetItem — boolean return value', () => {
  it('returns true on a successful write', () => {
    const result = safeSetItem('test-key', 'hello');
    expect(result).toBe(true);
  });

  it('returns false when localStorage is completely blocked (private browsing)', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => { throw new DOMException('The operation is insecure.', 'SecurityError'); });
    _resetStorageAvailabilityCache();
    try {
      const result = safeSetItem('any-key', 'any-value');
      expect(result).toBe(false);
    } finally {
      spy.mockRestore();
      _resetStorageAvailabilityCache();
    }
  });

  it('returns false when quota is exceeded', () => {
    // Use a persistent mock (not mockImplementationOnce) so both the
    // availability probe and the real write throw QuotaExceededError.
    // The probe handles a quota error by marking storage as available
    // (full but not blocked), so isLocalStorageAvailable() still returns true
    // and the real write is attempted — which also throws, giving us false.
    const spy = vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => { throw makeQuotaError(); });
    const result = safeSetItem('any-key', 'any-value');
    expect(result).toBe(false);
    spy.mockRestore();
  });

  it('returns false for a non-quota DOMException (other write-time error)', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => { throw makeOtherDOMException(); });
    const result = safeSetItem('any-key', 'any-value');
    expect(result).toBe(false);
    spy.mockRestore();
  });

  it('returns true even when called multiple times back-to-back', () => {
    expect(safeSetItem('k1', 'v1')).toBe(true);
    expect(safeSetItem('k2', 'v2')).toBe(true);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   clearAppStorage — full toolkit coverage
   Seeds one representative key from every toolkit component and verifies
   that clearAppStorage() wipes all of them.  Any component whose key
   survives the clear has stepped outside the isc- / isc_ prefix contract.
══════════════════════════════════════════════════════════════════════════ */

describe('clearAppStorage — full toolkit key coverage', () => {
  /**
   * One representative localStorage key per toolkit component / feature.
   * These mirror the exact constant or template strings used in production code.
   *
   * Sources (all under artifacts/i-supply-chain/src/):
   *  - ChecklistTool   → ChallengeChecklists.tsx  storageKey
   *  - ActionTracker   → ChallengeChecklists.tsx  actionKey
   *  - ParamForm       → ChallengeChecklists.tsx  toolKey (calc)
   *  - ProcurementTools→ ProcurementTools.tsx     SK_SPEND / SK_PORTER / SK_STRATEGY
   *  - RiskTools       → RiskTools.tsx             SK_RISKS / SK_KRI
   *  - SupplierScorecard→ SupplierScorecard.tsx   CONFIG_KEY / ROSTER_KEY / LEGACY_KEY
   *  - TrainingTools   → TrainingTools.tsx         SK_MEMBERS / SK_SCORES
   *  - CLMTools        → CLMTools.tsx              SK_CONTRACTS
   *  - MaturityTools   → MaturityTools.tsx         SK / action SK
   *  - KPIDashboard    → KPIDashboard.tsx          storageKey / industry / skuClass / banner
   *  - CommandCenter   → CommandCenter.tsx         BRIEFING_DRAFT_KEY
   *  - Language pref   → LanguageContext.tsx       isc-lang
   *  - Announcement    → uses isc_ prefix          isc_banner_dismissed_v2
   *  - FeedbackModal   → FeedbackModal.tsx         isc-feedback-shown-<tool>
   */
  const TOOLKIT_KEYS: Record<string, string> = {
    // ChecklistTool (challenge checklist items)
    'ChecklistTool':            'isc-tool-checklist-challenge-0',
    // ActionTracker (challenge action items)
    'ActionTracker':            'isc-tool-checklist-actions-0',
    // ParamForm / calculator
    'ParamForm':                'isc-tool-checklist-calc-0',
    // ProcurementTools
    'ProcurementTools-spend':   'isc-tool-catmgmt-spend-v2',
    'ProcurementTools-porter':  'isc-tool-catmgmt-porter-v2',
    'ProcurementTools-strategy':'isc-tool-catmgmt-strategy-v2',
    // RiskTools
    'RiskTools-register':       'isc-tool-risk-register-v2',
    'RiskTools-kri':            'isc-tool-risk-kri-v2',
    // SupplierScorecard
    'SupplierScorecard-config': 'isc-tool-scorecard-config',
    'SupplierScorecard-roster': 'isc-tool-supplier-roster',
    'SupplierScorecard-legacy': 'isc-tool-supplier-scorecard',
    // TrainingTools
    'TrainingTools-members':    'isc-tool-training-members',
    'TrainingTools-scores':     'isc-tool-training-scores',
    // CLMTools
    'CLMTools-contracts':       'isc-tool-clm-contracts-v2',
    // MaturityTools
    'MaturityTools-scores':     'isc-tool-maturity-procurement',
    'MaturityTools-actions':    'isc-tool-actions-maturity-procurement',
    // KPIDashboard
    'KPIDashboard-data':        'isc-kpi-procurement',
    'KPIDashboard-industry':    'isc-kpi-industry',
    'KPIDashboard-skuClass':    'isc-kpi-sku-class',
    'KPIDashboard-banner':      'isc-kpi-banner-dismissed-procurement',
    // CommandCenter draft
    'CommandCenter-draft':      'isc-briefing-draft-v1',
    // Language preference
    'LanguagePref':             'isc-lang',
    // Announcement banner (uses isc_ prefix)
    'AnnouncementBanner':       'isc_banner_dismissed_v2',
    // Feedback modal
    'FeedbackModal':            'isc-feedback-shown-checklist',
  };

  it('wipes every toolkit component key after clearAppStorage()', () => {
    // Seed every key with a non-empty value
    for (const key of Object.values(TOOLKIT_KEYS)) {
      localStorage.setItem(key, 'test-value');
    }

    clearAppStorage();

    // Every key must now be null — a non-null value means the key escaped the
    // isc- / isc_ prefix contract and would silently survive a real clear.
    for (const [component, key] of Object.entries(TOOLKIT_KEYS)) {
      expect(
        localStorage.getItem(key),
        `${component} key "${key}" survived clearAppStorage() — it may use an unexpected prefix`,
      ).toBeNull();
    }
  });

  it('does not remove non-app keys while wiping all toolkit keys', () => {
    // Mix app keys with third-party keys
    for (const key of Object.values(TOOLKIT_KEYS)) {
      localStorage.setItem(key, 'data');
    }
    localStorage.setItem('_ga', 'analytics-id');
    localStorage.setItem('intercom.user', '{}');
    localStorage.setItem('other-app-pref', 'dark');

    clearAppStorage();

    // All toolkit keys gone
    for (const key of Object.values(TOOLKIT_KEYS)) {
      expect(localStorage.getItem(key)).toBeNull();
    }

    // Third-party keys untouched
    expect(localStorage.getItem('_ga')).toBe('analytics-id');
    expect(localStorage.getItem('intercom.user')).toBe('{}');
    expect(localStorage.getItem('other-app-pref')).toBe('dark');
  });
});
