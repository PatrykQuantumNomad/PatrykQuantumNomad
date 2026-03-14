/**
 * 4-plot section: run sequence, lag, histogram, probability combined plot.
 */

import type { Cell } from '../../types';
import type { CaseStudyConfig } from '../../registry/types';
import { codeCell } from '../../cells';

/**
 * Build 4-plot section cells.
 */
export function buildFourPlot(
  config: CaseStudyConfig,
  slug: string,
  startIndex: number,
): { cells: Cell[]; nextIndex: number } {
  // Stub
  const cells: Cell[] = [
    codeCell(slug, startIndex, ['# 4-plot stub']),
  ];
  return { cells, nextIndex: startIndex + cells.length };
}
