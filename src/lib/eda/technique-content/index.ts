/**
 * Barrel export for technique content modules.
 *
 * Re-exports the public API (getTechniqueContent + TechniqueContent type)
 * from per-category modules. Import paths that previously resolved to
 * `technique-content.ts` now resolve here via `technique-content/index.ts`.
 */

import type { TechniqueContent } from './types';
import { TIME_SERIES_CONTENT } from './time-series';
import { DISTRIBUTION_SHAPE_CONTENT } from './distribution-shape';
import { COMPARISON_CONTENT } from './comparison';
import { REGRESSION_CONTENT } from './regression';
import { DESIGNED_EXPERIMENTS_CONTENT } from './designed-experiments';
import { MULTIVARIATE_CONTENT } from './multivariate';
import { COMBINED_DIAGNOSTIC_CONTENT } from './combined-diagnostic';

const TECHNIQUE_CONTENT: Record<string, TechniqueContent> = {
  ...TIME_SERIES_CONTENT,
  ...DISTRIBUTION_SHAPE_CONTENT,
  ...COMPARISON_CONTENT,
  ...REGRESSION_CONTENT,
  ...DESIGNED_EXPERIMENTS_CONTENT,
  ...MULTIVARIATE_CONTENT,
  ...COMBINED_DIAGNOSTIC_CONTENT,
};

/**
 * Retrieve the prose content for a graphical technique by slug.
 *
 * @param slug - Technique slug matching an entry in techniques.json
 * @returns Structured prose content or undefined if slug is not found
 */
export function getTechniqueContent(slug: string): TechniqueContent | undefined {
  return TECHNIQUE_CONTENT[slug];
}

export type { TechniqueContent } from './types';
