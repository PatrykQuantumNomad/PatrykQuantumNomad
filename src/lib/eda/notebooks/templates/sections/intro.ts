/**
 * Intro section: title + background + goals markdown cells.
 */

import type { Cell } from '../../types';
import type { CaseStudyConfig } from '../../registry/types';
import { markdownCell } from '../../cells';

/**
 * Build intro section cells.
 * @param config Case study configuration
 * @param slug Case study slug
 * @param startIndex Starting cell index for ID generation
 * @returns Array of cells and the next available index
 */
export function buildIntro(
  config: CaseStudyConfig,
  slug: string,
  startIndex: number,
): { cells: Cell[]; nextIndex: number } {
  // Stub: returns a minimal placeholder
  const cells: Cell[] = [
    markdownCell(slug, startIndex, [`# ${config.title}`]),
  ];
  return { cells, nextIndex: startIndex + cells.length };
}
