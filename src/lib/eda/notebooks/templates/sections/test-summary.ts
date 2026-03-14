/**
 * Test summary section (STUB).
 * Plan 02 will implement: test summary table computation + display.
 */

import type { Cell } from '../../types';
import type { CaseStudyConfig } from '../../registry/types';
import { markdownCell } from '../../cells';

/**
 * Build test summary section cells (stub).
 */
export function buildTestSummary(
  config: CaseStudyConfig,
  slug: string,
  startIndex: number,
): { cells: Cell[]; nextIndex: number } {
  const cells: Cell[] = [
    markdownCell(slug, startIndex, ['## Test Summary']),
  ];
  return { cells, nextIndex: startIndex + cells.length };
}
