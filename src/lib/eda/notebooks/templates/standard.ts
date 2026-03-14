/**
 * Standard notebook template entry point.
 *
 * Assembles a complete EDA notebook for any of the 7 standard
 * case studies by composing section builders in order:
 *   intro -> setup -> data-loading -> summary-stats ->
 *   four-plot -> individual-plots -> hypothesis-tests ->
 *   test-summary -> interpretation -> conclusions
 */

import type { NotebookV4, Cell } from '../types';
import { getCaseStudyConfig } from '../registry/index';
import { createNotebook } from '../notebook';
import { buildIntro } from './sections/intro';
import { buildSetup } from './sections/setup';
import { buildDataLoading } from './sections/data-loading';
import { buildSummaryStats } from './sections/summary-stats';
import { buildFourPlot } from './sections/four-plot';
import { buildIndividualPlots } from './sections/individual-plots';
import { buildHypothesisTests } from './sections/hypothesis-tests';
import { buildTestSummary } from './sections/test-summary';
import { buildInterpretation } from './sections/interpretation';
import { buildConclusions } from './sections/conclusions';

/**
 * The 7 standard case study slugs (single-response, univariate EDA).
 */
export const STANDARD_SLUGS: string[] = [
  'normal-random-numbers',
  'uniform-random-numbers',
  'heat-flow-meter',
  'filter-transmittance',
  'cryothermometry',
  'fatigue-life',
  'standard-resistor',
];

/**
 * Build a complete standard EDA notebook for the given case study slug.
 * Throws if the slug is not in the registry.
 */
export function buildStandardNotebook(slug: string): NotebookV4 {
  const config = getCaseStudyConfig(slug);
  if (!config) {
    throw new Error(`Unknown case study slug: ${slug}`);
  }

  const allCells: Cell[] = [];
  let idx = 0;

  // Section builders are called in order, each returning cells and next index
  const sections = [
    buildIntro,
    buildSetup,
    buildDataLoading,
    buildSummaryStats,
    buildFourPlot,
    buildIndividualPlots,
    buildHypothesisTests,
    buildTestSummary,
    buildInterpretation,
    buildConclusions,
  ];

  for (const buildSection of sections) {
    const result = buildSection(config, slug, idx);
    allCells.push(...result.cells);
    idx = result.nextIndex;
  }

  return createNotebook(allCells);
}
