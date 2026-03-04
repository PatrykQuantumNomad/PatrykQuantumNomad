/**
 * 3-tier share fallback for the GHA Validator.
 *
 * Attempts sharing in order:
 *   1. Web Share API (navigator.share) -- native mobile/desktop share sheet
 *   2. Clipboard API (navigator.clipboard.writeText) -- silent copy
 *   3. window.prompt() -- manual copy fallback for legacy browsers
 *
 * Returns which tier was used so the caller can show appropriate feedback.
 */

export type ShareResult = 'shared' | 'copied' | 'prompted';

/**
 * Share a URL using the best available browser API.
 *
 * @param url   The URL to share
 * @param title Title for the share dialog (used by Web Share API)
 * @returns Which sharing tier was used
 */
export async function shareUrl(url: string, title: string): Promise<ShareResult> {
  // Tier 1: Web Share API
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, url });
      return 'shared';
    } catch (err) {
      // AbortError = user cancelled the share sheet -- not an error
      if (err instanceof DOMException && err.name === 'AbortError') {
        return 'shared';
      }
      // Other errors (e.g., NotAllowedError) -- fall through to Tier 2
    }
  }

  // Tier 2: Clipboard API
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      return 'copied';
    } catch {
      // Clipboard write failed (e.g., permissions) -- fall through to Tier 3
    }
  }

  // Tier 3: prompt() fallback
  if (typeof window !== 'undefined') {
    window.prompt('Copy this link to share:', url);
  }
  return 'prompted';
}
