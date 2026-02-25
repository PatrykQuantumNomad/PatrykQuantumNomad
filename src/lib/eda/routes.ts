/**
 * EDA route map and URL builder functions.
 *
 * Centralizes all EDA route patterns so that page templates, navigation
 * components, and the cross-link validation script share a single source
 * of truth for URL generation.
 */

/** All valid EDA route prefixes */
export const EDA_ROUTES = {
  techniques: '/eda/techniques/',
  quantitative: '/eda/quantitative/',
  distributions: '/eda/distributions/',
  foundations: '/eda/foundations/',
  caseStudies: '/eda/case-studies/',
  reference: '/eda/reference/',
  landing: '/eda/',
} as const;

/** Map a technique slug to its full URL path based on category */
export function techniqueUrl(
  slug: string,
  category: 'graphical' | 'quantitative',
): string {
  const prefix =
    category === 'graphical'
      ? EDA_ROUTES.techniques
      : EDA_ROUTES.quantitative;
  return `${prefix}${slug}/`;
}

/** Map a distribution slug to its full URL path */
export function distributionUrl(slug: string): string {
  return `${EDA_ROUTES.distributions}${slug}/`;
}

/** Map a foundation page slug to its full URL path */
export function foundationUrl(slug: string): string {
  return `${EDA_ROUTES.foundations}${slug}/`;
}

/** Map a case study slug to its full URL path */
export function caseStudyUrl(slug: string): string {
  return `${EDA_ROUTES.caseStudies}${slug}/`;
}

/** Map a reference page slug to its full URL path */
export function referenceUrl(slug: string): string {
  return `${EDA_ROUTES.reference}${slug}/`;
}
