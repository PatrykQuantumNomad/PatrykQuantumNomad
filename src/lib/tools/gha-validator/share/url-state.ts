/**
 * URL hash state encoding for shareable GHA Validator links.
 *
 * Encodes workflow YAML into the URL hash using lz-string compression
 * with the prefix `#gha=`. This allows one-click sharing of analyzed
 * workflows without a backend.
 *
 * Format: #gha={lz-string-compressed-yaml}
 */

import LZString from 'lz-string';

/** Prefix for GHA validator URL hash state */
const GHA_HASH_PREFIX = '#gha=';

/** Soft limit for URL length (chars). Beyond this, some browsers/platforms may truncate. */
export const GHA_URL_SOFT_LIMIT = 6000;

/**
 * Encode a YAML string into a URL hash fragment.
 * @returns Hash string starting with `#gha=`
 */
export function encodeGhaState(yaml: string): string {
  const compressed = LZString.compressToEncodedURIComponent(yaml);
  return `${GHA_HASH_PREFIX}${compressed}`;
}

/**
 * Decode a URL hash fragment back into YAML.
 * @returns Decoded YAML string, or null if hash is invalid/empty/corrupt
 */
export function decodeGhaState(hash: string): string | null {
  if (!hash || !hash.startsWith(GHA_HASH_PREFIX)) {
    return null;
  }

  const compressed = hash.slice(GHA_HASH_PREFIX.length);
  if (!compressed) {
    return null;
  }

  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(compressed);
    // lz-string returns null on invalid input, empty string on empty input
    if (!decompressed) {
      return null;
    }
    // Sanity check: valid YAML never contains null bytes (\x00).
    // Garbage decompression from invalid input often produces them.
    if (decompressed.includes('\x00')) {
      return null;
    }
    return decompressed;
  } catch {
    return null;
  }
}

/**
 * Check if a URL hash exceeds the soft limit for safe sharing.
 * Logs a warning but does not block sharing.
 */
export function isUrlTooLong(hash: string): boolean {
  return hash.length > GHA_URL_SOFT_LIMIT;
}
