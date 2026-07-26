/**
 * Shared localStorage helper with quota-exceeded detection.
 *
 * Drop-in replacement for the bare `try { localStorage.setItem(…) } catch {}`
 * pattern used throughout the toolkit. When the browser's storage quota is
 * full (common on iOS Safari at ~5 MB) the user sees a visible toast warning
 * instead of silently losing their work.
 */
import { toast } from 'sonner';

/** Names browsers use for the storage-quota error. */
const QUOTA_NAMES = new Set([
  'QuotaExceededError',          // Chrome / Safari
  'NS_ERROR_DOM_QUOTA_REACHED',  // Firefox
  'QUOTA_EXCEEDED_ERR',          // older WebKit
]);

function isQuotaError(e: unknown): boolean {
  if (!(e instanceof DOMException)) return false;
  // code 22 is the legacy numeric constant for QuotaExceededError
  return QUOTA_NAMES.has(e.name) || e.code === 22;
}

/**
 * Writes `value` to localStorage under `key`.
 *
 * On a quota-exceeded error a toast warning is shown once (deduplicated by
 * id) so the user knows their data was NOT saved. All other errors are
 * swallowed silently, matching the previous behaviour.
 */
export function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    if (isQuotaError(e)) {
      toast.error(
        'Storage full — your changes could not be saved. Clear browser storage and try again.\n' +
        'التخزين ممتلئ — تعذّر حفظ التغييرات. أفرغ مساحة المتصفح وأعد المحاولة.',
        {
          id: 'storage-quota-exceeded', // deduplicate: only one toast at a time
          duration: 8000,
        },
      );
    }
    // non-quota errors (e.g. private-browsing restrictions) are silently ignored
  }
}
