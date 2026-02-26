import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

/** Directory for cached OG images (build-only cache, not deployed) */
const CACHE_DIR = 'node_modules/.cache/og-eda';

/** Bump when OG template markup or fonts change to invalidate all cached images */
const CACHE_VERSION = '3';

/**
 * Compute a deterministic hash for OG image caching.
 * Includes CACHE_VERSION so template changes invalidate stale images.
 * Returns first 12 hex characters (sufficient for uniqueness at 90+ page scale).
 */
export function computeOgHash(title: string, description: string): string {
  return createHash('md5')
    .update(`${CACHE_VERSION}:${title}:${description}`)
    .digest('hex')
    .slice(0, 12);
}

/**
 * Check for a cached OG image by hash.
 * Uses stat() for existence check (faster than try/catch on readFile).
 * Returns the PNG as Uint8Array if cached, null otherwise.
 */
export async function getCachedOgImage(hash: string): Promise<Uint8Array<ArrayBuffer> | null> {
  const cachePath = join(CACHE_DIR, `${hash}.png`);
  try {
    await stat(cachePath);
    const buf = await readFile(cachePath);
    return new Uint8Array(buf.buffer as ArrayBuffer, buf.byteOffset, buf.byteLength);
  } catch {
    return null;
  }
}

/**
 * Write a generated OG image to the cache.
 * Creates the cache directory if it does not exist.
 */
export async function cacheOgImage(hash: string, png: Uint8Array<ArrayBuffer>): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(join(CACHE_DIR, `${hash}.png`), png);
}

/**
 * Convenience wrapper: compute hash, check cache, generate if missing, cache result.
 * This is the function OG image endpoints will call in Phase 55.
 *
 * @param title - Page title used for both hash key and OG rendering
 * @param description - Page description used for both hash key and OG rendering
 * @param generateFn - Async function that produces the PNG buffer (called only on cache miss)
 * @returns PNG buffer (from cache or freshly generated)
 */
export async function getOrGenerateOgImage(
  title: string,
  description: string,
  generateFn: () => Promise<Uint8Array<ArrayBuffer>>,
): Promise<Uint8Array<ArrayBuffer>> {
  const hash = computeOgHash(title, description);
  const cached = await getCachedOgImage(hash);
  if (cached) return cached;

  const png = await generateFn();
  await cacheOgImage(hash, png);
  return png;
}
