/**
 * Private-browsing detection — unit tests for storage.ts
 *
 * Confirms that:
 *  1. isLocalStorageAvailable() returns false when localStorage is blocked
 *     (simulating iOS Safari / Chrome Incognito private-browsing mode).
 *  2. The module-level cache means repeated calls in the same "page load"
 *     do NOT re-probe localStorage (cheap after the first call).
 *  3. _resetStorageAvailabilityCache() clears the cache, so the next call
 *     re-probes — this is exactly what happens on every full page reload
 *     because the module is re-initialised and _storageAvailable starts null.
 *  4. After a cache reset in a still-blocked environment the probe returns
 *     false again, confirming the warning would reappear on reload.
 *  5. QuotaExceededError is NOT treated as "storage unavailable" — the probe
 *     returns true so the quota-exceeded toast path runs instead.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock sonner so toast calls don't hit the real DOM
vi.mock('sonner', () => ({
  toast: { warning: vi.fn(), error: vi.fn(), dismiss: vi.fn() },
}));

import {
  isLocalStorageAvailable,
  _resetStorageAvailabilityCache,
} from './storage';

// ─── helpers ────────────────────────────────────────────────────────────────

function blockLocalStorage() {
  return vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('The operation is insecure.', 'SecurityError');
  });
}

function makeQuotaError() {
  return new DOMException('The quota has been exceeded.', 'QuotaExceededError');
}

// ─── tests ───────────────────────────────────────────────────────────────────

describe('isLocalStorageAvailable — private-browsing simulation', () => {
  beforeEach(() => {
    _resetStorageAvailabilityCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false when localStorage.setItem throws a SecurityError (private mode)', () => {
    blockLocalStorage();
    expect(isLocalStorageAvailable()).toBe(false);
  });

  it('returns true in a normal (non-private) environment', () => {
    // jsdom provides a real localStorage — no spy needed
    expect(isLocalStorageAvailable()).toBe(true);
  });

  it('caches the result: subsequent calls within the same page load skip the probe', () => {
    const spy = blockLocalStorage();
    isLocalStorageAvailable(); // first call — probes, caches false
    isLocalStorageAvailable(); // second call — should use cache, NOT probe again
    isLocalStorageAvailable(); // third call — still cached

    // setItem is only called once (during the initial probe write attempt)
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('re-probes after _resetStorageAvailabilityCache() — simulates a full page reload', () => {
    const spy = blockLocalStorage();

    // First "page load"
    expect(isLocalStorageAvailable()).toBe(false);
    expect(spy).toHaveBeenCalledTimes(1);

    // Page reload: module re-initialises → cache is null again
    _resetStorageAvailabilityCache();

    // Second "page load" — must re-probe and still return false
    expect(isLocalStorageAvailable()).toBe(false);
    expect(spy).toHaveBeenCalledTimes(2); // probe ran again
  });

  it('keeps returning false across multiple simulated page reloads in private mode', () => {
    blockLocalStorage();

    for (let reload = 0; reload < 3; reload++) {
      _resetStorageAvailabilityCache();
      expect(isLocalStorageAvailable()).toBe(false);
    }
  });

  it('returns true after cache is reset and private-mode block is lifted', () => {
    // First load: storage blocked
    const spy = blockLocalStorage();
    expect(isLocalStorageAvailable()).toBe(false);
    spy.mockRestore();

    // User switches to a normal tab (or re-enables storage): cache reset
    _resetStorageAvailabilityCache();
    expect(isLocalStorageAvailable()).toBe(true);
  });

  it('treats QuotaExceededError as available (quota path, not private-browsing path)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw makeQuotaError();
    });
    // Storage exists but is full — the quota-exceeded toast path should fire,
    // not the private-browsing one.
    expect(isLocalStorageAvailable()).toBe(true);
  });
});
