import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from 'lz-string';

const HASH_PREFIX = '#dockerfile=';

/** Compress Dockerfile content and return the full hash string */
export function encodeToHash(content: string): string {
  return `${HASH_PREFIX}${compressToEncodedURIComponent(content)}`;
}

/** Read and decompress Dockerfile content from current URL hash. Returns null if not present. */
export function decodeFromHash(): string | null {
  const hash = globalThis.location.hash;
  if (!hash.startsWith(HASH_PREFIX)) return null;
  const compressed = hash.slice(HASH_PREFIX.length);
  if (!compressed) return null;
  try {
    return decompressFromEncodedURIComponent(compressed);
  } catch {
    return null;
  }
}

/** Build a full shareable URL for the given Dockerfile content */
export function buildShareUrl(content: string): string {
  const base = globalThis.location.origin + globalThis.location.pathname;
  return `${base}${encodeToHash(content)}`;
}

/** Estimate whether the share URL will be safe for common platforms */
export function isUrlSafeLength(content: string): { safe: boolean; length: number } {
  const url = buildShareUrl(content);
  return { safe: url.length <= 2000, length: url.length };
}
