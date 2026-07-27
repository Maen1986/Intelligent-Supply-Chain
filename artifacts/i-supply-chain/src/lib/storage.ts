/**
 * Shared localStorage helper with quota-exceeded and private-browsing detection.
 *
 * Drop-in replacement for the bare `try { localStorage.setItem(…) } catch {}`
 * pattern used throughout the toolkit.
 *
 * Two distinct failure modes are handled:
 *
 *  1. **Private / incognito browsing** — on iOS Safari (and some other
 *     browsers) localStorage is completely blocked and throws a SecurityError
 *     on the very first access. The module detects this with a write-then-
 *     delete probe the first time safeSetItem is called, then shows a one-time
 *     warning toast telling the user to switch to a normal tab.
 *
 *  2. **Storage quota exceeded** — when the 5 MB cap is hit (common on
 *     mobile) the user sees a toast with a one-tap "Clear saved data" action
 *     so they can recover without leaving the app.
 */
import { toast } from 'sonner';

/* ── quota-error detection ──────────────────────────────────────────────── */

/** Names browsers use for the storage-quota error. */
const QUOTA_NAMES = new Set([
  'QuotaExceededError',         // Chrome / Safari
  'NS_ERROR_DOM_QUOTA_REACHED', // Firefox
  'QUOTA_EXCEEDED_ERR',         // older WebKit
]);

/** Key prefixes that belong exclusively to this app. */
const APP_PREFIXES = ['isc-', 'isc_'];

function isQuotaError(e: unknown): boolean {
  if (!(e instanceof DOMException)) return false;
  // code 22 is the legacy numeric constant for QuotaExceededError
  return QUOTA_NAMES.has(e.name) || e.code === 22;
}

/* ── private-browsing detection ─────────────────────────────────────────── */

/**
 * Cached result of the localStorage availability probe.
 * `null` = not yet tested; `true` = available; `false` = blocked.
 */
let _storageAvailable: boolean | null = null;

/**
 * Reset the cached availability result.
 *
 * @internal Exposed for unit tests only — do not call in application code.
 */
export function _resetStorageAvailabilityCache(): void {
  _storageAvailable = null;
}

/**
 * Returns `true` when localStorage is readable and writable.
 * The result is cached after the first call so subsequent calls are free.
 *
 * On iOS Safari in private browsing mode `localStorage.setItem` throws a
 * `SecurityError`; this function catches that and returns `false`.
 */
export function isLocalStorageAvailable(): boolean {
  if (_storageAvailable !== null) return _storageAvailable;
  try {
    const probe = '__storage_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    _storageAvailable = true;
  } catch (e) {
    // QuotaExceededError means storage exists but is full — still available.
    // SecurityError (and similar access-denied errors) means storage is blocked.
    _storageAvailable = isQuotaError(e) ? true : false;
  }
  return _storageAvailable;
}

/* ── public API ─────────────────────────────────────────────────────────── */

/**
 * Removes every localStorage entry whose key starts with an app prefix.
 *
 * Only touches keys owned by this app (`isc-` / `isc_`); third-party and
 * browser-internal keys are left untouched.
 */
export function clearAppStorage(): void {
  // Collect keys first — iterating by index while removing is unsafe.
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && APP_PREFIXES.some(p => key.startsWith(p))) {
      toRemove.push(key);
    }
  }
  toRemove.forEach(key => {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  });
}

/**
 * Writes `value` to localStorage under `key`.
 *
 * Returns `true` when the value was successfully written, or `false` when the
 * write was silently dropped (storage blocked or quota exceeded).  Callers can
 * use the return value to suppress misleading success states (e.g. "Saved ✓"
 * indicators) when the write did not actually land.
 *
 * • If localStorage is completely unavailable (private/incognito mode) a
 *   toast.warning is shown with id `'storage-private-browsing'` so the user
 *   sees it only once per Sonner deduplication.
 *
 * • On a quota-exceeded error a toast.error is shown with id
 *   `'storage-quota-exceeded'` and a one-tap "Clear saved data" action button.
 *
 * • All other errors are swallowed silently (no regression from previous
 *   behaviour), and `false` is returned.
 */
export function safeSetItem(key: string, value: string): boolean {
  // Private-browsing / storage-blocked path
  if (!isLocalStorageAvailable()) {
    toast.warning(
      'Private browsing detected — your changes cannot be saved. ' +
      'Open the app in a normal tab to keep your work.\n' +
      'تم اكتشاف وضع التصفح الخاص — لا يمكن حفظ التغييرات. ' +
      'افتح التطبيق في تبويب عادي للاحتفاظ بعملك.',
      {
        id: 'storage-private-browsing', // deduplicate: only one toast at a time
        duration: 8000,
      },
    );
    return false;
  }

  // Normal path — localStorage is available
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (isQuotaError(e)) {
      toast.error(
        'Storage full — your changes could not be saved.\n' +
        'التخزين ممتلئ — تعذّر حفظ التغييرات.',
        {
          id: 'storage-quota-exceeded', // deduplicate: only one toast at a time
          duration: 12000,
          action: {
            label: 'Clear saved data / مسح البيانات',
            onClick: () => {
              const confirmed = window.confirm(
                'This will delete all your saved tool data in this app. This cannot be undone.\n\n' +
                'سيؤدي هذا إلى حذف جميع البيانات المحفوظة في هذا التطبيق. لا يمكن التراجع عن هذا الإجراء.',
              );
              if (confirmed) {
                clearAppStorage();
                toast.dismiss('storage-quota-exceeded');
                toast.success(
                  'Cleared — reloading…\nتم المسح — جارٍ إعادة التحميل…',
                  { id: 'storage-cleared', duration: 1500 },
                );
                setTimeout(() => window.location.reload(), 1500);
              }
            },
          },
        },
      );
    }
    // non-quota errors are swallowed silently
    return false;
  }
}
