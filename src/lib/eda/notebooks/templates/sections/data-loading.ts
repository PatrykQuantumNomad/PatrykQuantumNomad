/**
 * Data loading section: load data with Colab fallback + preview + assertion.
 */

import type { Cell } from '../../types';
import type { CaseStudyConfig } from '../../registry/types';
import { codeCell } from '../../cells';

/**
 * Build data loading section cells.
 */
export function buildDataLoading(
  config: CaseStudyConfig,
  slug: string,
  startIndex: number,
): { cells: Cell[]; nextIndex: number } {
  // Stub
  const cells: Cell[] = [
    codeCell(slug, startIndex, ['# Data loading stub']),
  ];
  return { cells, nextIndex: startIndex + cells.length };
}
