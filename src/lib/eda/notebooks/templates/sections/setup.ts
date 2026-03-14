/**
 * Setup section: dependency check + theme + imports cells.
 *
 * Produces 3 code cells:
 * 1. Dependency check with pip install fallback
 * 2. Quantum Explorer dark theme configuration
 * 3. Additional imports (scipy.stats for probability plots)
 */

import type { Cell } from '../../types';
import type { CaseStudyConfig } from '../../registry/types';
import { codeCell, markdownCell } from '../../cells';
import { DEPENDENCY_CHECK_CODE, THEME_SETUP_CODE } from '../../theme';

/**
 * Build setup section cells.
 */
export function buildSetup(
  config: CaseStudyConfig,
  slug: string,
  startIndex: number,
): { cells: Cell[]; nextIndex: number } {
  let idx = startIndex;
  const cells: Cell[] = [];

  // Section header
  cells.push(markdownCell(slug, idx++, [
    '## Environment Setup',
  ]));

  // Dependency check cell (from Phase 96 theme.ts)
  cells.push(codeCell(slug, idx++, DEPENDENCY_CHECK_CODE));

  // Theme setup cell (from Phase 96 theme.ts)
  cells.push(codeCell(slug, idx++, THEME_SETUP_CODE));

  // Additional imports
  cells.push(codeCell(slug, idx++, [
    '# Additional imports for statistical analysis',
    'from scipy import stats',
    'from io import StringIO',
    'import warnings',
    "warnings.filterwarnings('ignore')",
  ]));

  return { cells, nextIndex: idx };
}
