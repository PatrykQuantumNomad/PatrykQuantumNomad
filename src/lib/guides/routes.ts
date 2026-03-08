/**
 * Guide route map and URL builder functions.
 *
 * Centralizes all guide route patterns so that page templates, navigation
 * components, and the sidebar share a single source of truth for URL
 * generation.
 */

/** All valid guide route prefixes */
export const GUIDE_ROUTES = {
  landing: '/guides/fastapi-production/',
  guides: '/guides/',
} as const;

/** Build the URL for a guide chapter page */
export function guidePageUrl(guideSlug: string, chapterSlug: string): string {
  return `/guides/${guideSlug}/${chapterSlug}/`;
}

/** Build the URL for a guide landing page */
export function guideLandingUrl(guideSlug: string): string {
  return `/guides/${guideSlug}/`;
}
