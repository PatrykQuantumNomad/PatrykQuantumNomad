import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from 'lz-string';

const HASH_PREFIX = '#k8s=';

export function encodeToHash(content: string): string {
  return `${HASH_PREFIX}${compressToEncodedURIComponent(content)}`;
}

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

export function buildShareUrl(content: string): string {
  const base = globalThis.location.origin + globalThis.location.pathname;
  return `${base}${encodeToHash(content)}`;
}

export function isUrlSafeLength(content: string): { safe: boolean; length: number } {
  const url = buildShareUrl(content);
  return { safe: url.length <= 2000, length: url.length };
}
