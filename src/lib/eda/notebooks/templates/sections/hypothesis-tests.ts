/**
 * Hypothesis tests section (STUB).
 * Plan 02 will implement: location, variation, randomness, distribution, outlier tests.
 */

import type { Cell } from '../../types';
import type { CaseStudyConfig } from '../../registry/types';
import { markdownCell } from '../../cells';

/**
 * Build hypothesis tests section cells (stub).
 */
export function buildHypothesisTests(
  config: CaseStudyConfig,
  slug: string,
  startIndex: number,
): { cells: Cell[]; nextIndex: number } {
  const cells: Cell[] = [
    markdownCell(slug, startIndex, ['## Hypothesis Tests']),
  ];
  return { cells, nextIndex: startIndex + cells.length };
}
