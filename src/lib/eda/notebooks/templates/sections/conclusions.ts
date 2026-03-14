/**
 * Conclusions section (STUB).
 * Plan 02 will implement: key findings + next steps markdown.
 */

import type { Cell } from '../../types';
import type { CaseStudyConfig } from '../../registry/types';
import { markdownCell } from '../../cells';

/**
 * Build conclusions section cells (stub).
 */
export function buildConclusions(
  config: CaseStudyConfig,
  slug: string,
  startIndex: number,
): { cells: Cell[]; nextIndex: number } {
  const cells: Cell[] = [
    markdownCell(slug, startIndex, ['## Conclusions']),
  ];
  return { cells, nextIndex: startIndex + cells.length };
}
