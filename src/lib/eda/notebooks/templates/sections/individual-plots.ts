/**
 * Individual plots section: 4 separate full-size plot cells.
 */

import type { Cell } from '../../types';
import type { CaseStudyConfig } from '../../registry/types';
import { codeCell } from '../../cells';

/**
 * Build individual plot section cells.
 */
export function buildIndividualPlots(
  config: CaseStudyConfig,
  slug: string,
  startIndex: number,
): { cells: Cell[]; nextIndex: number } {
  // Stub
  const cells: Cell[] = [
    codeCell(slug, startIndex, ['# Individual plots stub']),
  ];
  return { cells, nextIndex: startIndex + cells.length };
}
