/**
 * Interpretation section (STUB).
 * Plan 02 will implement: case-study-specific interpretation narrative.
 */

import type { Cell } from '../../types';
import type { CaseStudyConfig } from '../../registry/types';
import { markdownCell } from '../../cells';

/**
 * Build interpretation section cells (stub).
 */
export function buildInterpretation(
  config: CaseStudyConfig,
  slug: string,
  startIndex: number,
): { cells: Cell[]; nextIndex: number } {
  const cells: Cell[] = [
    markdownCell(slug, startIndex, ['## Interpretation']),
  ];
  return { cells, nextIndex: startIndex + cells.length };
}
