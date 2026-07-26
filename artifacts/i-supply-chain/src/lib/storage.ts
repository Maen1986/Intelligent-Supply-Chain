/**
 * Shared localStorage helper with quota-exceeded detection.
 *
 * Drop-in replacement for the bare `try { localStorage.setItem(…) } catch {}`
 * pattern used throughout the toolkit. When the browser's storage quota is
 * full (common on iOS Safari at ~5 MB) the user sees a visible toast warning
 * with a one-tap "Clear saved data" action so they can recover without leaving
 * the app.
 */
import { toast } from 'sonner';

/** Names browsers use for the storage-quota error. */
const QUOTA_NAMES = new Set([
  'QuotaExceededError',          // Chrome / Safari
  'NS_ERROR_DOM_QUOTA_REACHED',  // Firefox
  'QUOTA_EXCEEDED_ERR',          // older WebKit
]);

/** Key prefixes that belong exclusively to this app. */
const APP_PREFIXES = ['isc-', 'isc_'];

function isQuotaError(e: unknown): boolean {
  if (!(e instanceof DOMException)) return false;
  // code 22 is the legacy numeric constant for QuotaExceededError
  return QUOTA_NAMES.has(e.name) || e.code === 22;
}

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
 * On a quota-exceeded error a toast warning is shown once (deduplicated by
 * id) with a "Clear saved data" action button so users can recover in one tap.
 * All other errors are swallowed silently, matching the previous behaviour.
 */
export function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
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
              }
            },
          },
        },
      );
    }
    // non-quota errors (e.g. private-browsing restrictions) are silently ignored
  }
}
