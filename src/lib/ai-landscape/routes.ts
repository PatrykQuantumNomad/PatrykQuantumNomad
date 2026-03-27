/** Base path for the AI Landscape section (trailing slash per Astro config) */
export const AI_LANDSCAPE_BASE = '/ai-landscape/';

/**
 * Returns the canonical URL path for an AI landscape concept page.
 * Always uses a trailing slash to match Astro's `trailingSlash: 'always'` config.
 */
export function conceptUrl(slug: string): string {
  return `/ai-landscape/${slug}/`;
}

/**
 * Returns the Open Graph image path for an AI landscape concept.
 * Uses .png extension (not a trailing slash) since it is an image file.
 */
export function ogImageUrl(slug: string): string {
  return `/open-graph/ai-landscape/${slug}.png`;
}

/**
 * Returns the canonical URL path for a VS comparison page.
 * Always uses a trailing slash to match Astro's `trailingSlash: 'always'` config.
 */
export function vsPageUrl(slug: string): string {
  return `/ai-landscape/vs/${slug}/`;
}

/**
 * Returns the Open Graph image path for a VS comparison page.
 * Uses .png extension (not a trailing slash) since it is an image file.
 */
export function vsOgImageUrl(slug: string): string {
  return `/open-graph/ai-landscape/vs/${slug}.png`;
}
