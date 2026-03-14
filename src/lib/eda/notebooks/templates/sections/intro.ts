/**
 * Intro section: title + background + goals markdown cells.
 *
 * Produces 2 markdown cells:
 * 1. Title with case study name and NIST section reference
 * 2. Background description and analysis goals
 */

import type { Cell } from '../../types';
import type { CaseStudyConfig } from '../../registry/types';
import { markdownCell } from '../../cells';

/**
 * Build intro section cells.
 * @param config Case study configuration
 * @param slug Case study slug
 * @param startIndex Starting cell index for ID generation
 * @returns Array of cells and the next available index
 */
export function buildIntro(
  config: CaseStudyConfig,
  slug: string,
  startIndex: number,
): { cells: Cell[]; nextIndex: number } {
  let idx = startIndex;
  const cells: Cell[] = [];

  // Title cell
  cells.push(markdownCell(slug, idx++, [
    `# ${config.title}`,
    '',
    `**NIST/SEMATECH e-Handbook of Statistical Methods, Section ${config.nistSection}**`,
    '',
    `Source: [${config.nistUrl}](${config.nistUrl})`,
  ]));

  // Background and goals cell
  const descLine = config.description
    ? `${config.description}.`
    : `EDA case study for ${config.title}.`;

  cells.push(markdownCell(slug, idx++, [
    '## Background',
    '',
    descLine,
    '',
    '### Analysis Goals',
    '',
    '1. **Location:** What is a typical value?',
    '2. **Variation:** How spread out are the data?',
    '3. **Distribution:** What is the shape of the distribution?',
    '4. **Randomness:** Are the data random (no autocorrelation or trend)?',
    '5. **Outliers:** Are there any outliers in the data?',
  ]));

  return { cells, nextIndex: idx };
}
