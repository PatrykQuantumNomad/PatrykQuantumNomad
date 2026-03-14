/**
 * Setup section: dependency check + theme + imports cells.
 */

import type { Cell } from '../../types';
import type { CaseStudyConfig } from '../../registry/types';
import { codeCell } from '../../cells';

/**
 * Build setup section cells.
 */
export function buildSetup(
  config: CaseStudyConfig,
  slug: string,
  startIndex: number,
): { cells: Cell[]; nextIndex: number } {
  // Stub
  const cells: Cell[] = [
    codeCell(slug, startIndex, ['# Setup stub']),
  ];
  return { cells, nextIndex: startIndex + cells.length };
}
