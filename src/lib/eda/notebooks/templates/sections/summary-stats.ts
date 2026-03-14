/**
 * Summary statistics section: computation + display cell.
 */

import type { Cell } from '../../types';
import type { CaseStudyConfig } from '../../registry/types';
import { codeCell } from '../../cells';

/**
 * Build summary statistics section cells.
 */
export function buildSummaryStats(
  config: CaseStudyConfig,
  slug: string,
  startIndex: number,
): { cells: Cell[]; nextIndex: number } {
  // Stub
  const cells: Cell[] = [
    codeCell(slug, startIndex, ['# Summary stats stub']),
  ];
  return { cells, nextIndex: startIndex + cells.length };
}
