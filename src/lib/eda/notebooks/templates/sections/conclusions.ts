/**
 * Conclusions section builder.
 *
 * Generates key findings and next steps for each case study,
 * parameterized from the config. Includes a reference link back
 * to the NIST handbook source page.
 */

import type { Cell } from '../../types';
import type { CaseStudyConfig } from '../../registry/types';
import { markdownCell } from '../../cells';

/** Per-slug key findings and next steps */
const CONCLUSIONS: Record<string, { findings: string[]; nextSteps: string[] }> = {
  'normal-random-numbers': {
    findings: [
      'All five EDA assumptions (fixed location, fixed variation, randomness, normality, no outliers) are satisfied.',
      'The dataset confirms that the random number generator produces N(0,1) distributed data.',
      'Sample mean and standard deviation are reliable point estimates.',
    ],
    nextSteps: [
      'Use this dataset as a baseline reference for validating EDA pipelines.',
      'Standard parametric methods (t-tests, F-tests) can be applied directly.',
      'No further modeling is needed.',
    ],
  },
  'uniform-random-numbers': {
    findings: [
      'Location, variation, and randomness assumptions are satisfied.',
      'The normality assumption is violated; the data follow a uniform distribution.',
      'The uniform shape is visible in the histogram and confirmed by Anderson-Darling.',
    ],
    nextSteps: [
      'Use non-parametric methods or bootstrap intervals instead of normal-theory confidence intervals.',
      'Transform data if normality is required for downstream analysis.',
      'Consider Kolmogorov-Smirnov test for uniformity confirmation.',
    ],
  },
  'heat-flow-meter': {
    findings: [
      'The calibration factor shows stable location and variation.',
      'Mild non-randomness (short-term autocorrelation) is present in the data.',
      'The data are approximately normally distributed.',
    ],
    nextSteps: [
      'Account for autocorrelation when computing uncertainty intervals.',
      'Consider effective sample size adjustments for metrological uncertainty.',
      'Investigate the source of short-term correlation in the measurement process.',
    ],
  },
  'filter-transmittance': {
    findings: [
      'Strong serial autocorrelation dominates the data structure.',
      'Standard EDA assumptions of independence are violated.',
      'Distribution and outlier tests could not be applied due to autocorrelation.',
    ],
    nextSteps: [
      'Fit an AR(1) or higher-order autoregressive model.',
      'Analyze residuals after removing autocorrelation.',
      'Compute uncertainty intervals using time-series methods.',
    ],
  },
  'cryothermometry': {
    findings: [
      'The data are random and have fixed location and variation.',
      'The discrete integer nature of voltage counts affects distribution shape.',
      'Standard EDA methods are applicable with awareness of the measurement resolution.',
    ],
    nextSteps: [
      'Consider discrete-distribution models for refined analysis.',
      'The integer measurement scale limits precision of distributional conclusions.',
      'Standard confidence intervals for the mean are still valid.',
    ],
  },
  'fatigue-life': {
    findings: [
      'The data are right-skewed with a heavy upper tail.',
      'Normal distribution is rejected; Weibull and Gamma provide better fits.',
      'No systematic drift or autocorrelation is present.',
    ],
    nextSteps: [
      'Use Weibull distribution for reliability predictions and fatigue modeling.',
      'Compute percentile-based confidence intervals instead of normal-theory intervals.',
      'Consider log-transformation for analyses requiring normality.',
    ],
  },
  'standard-resistor': {
    findings: [
      'Significant downward drift in resistance values over the 5-year period.',
      'Strong autocorrelation and non-randomness invalidate standard i.i.d. assumptions.',
      'Distribution and outlier tests were not applicable due to non-stationarity.',
    ],
    nextSteps: [
      'Fit a trend model (linear or polynomial) to characterize the drift.',
      'Analyze detrended residuals for remaining structure.',
      'Develop a predictive model for calibration scheduling.',
    ],
  },
};

/**
 * Build conclusions section cells.
 */
export function buildConclusions(
  config: CaseStudyConfig,
  slug: string,
  startIndex: number,
): { cells: Cell[]; nextIndex: number } {
  let idx = startIndex;
  const cells: Cell[] = [];

  const data = CONCLUSIONS[slug];

  const findingLines = data
    ? data.findings.map((f, i) => `${i + 1}. ${f}`)
    : ['1. Analysis complete.'];

  const nextStepLines = data
    ? data.nextSteps.map((s, i) => `${i + 1}. ${s}`)
    : ['1. Review results.'];

  cells.push(markdownCell(slug, idx++, [
    '## Conclusions',
    '',
    '### Key Findings',
    '',
    ...findingLines,
    '',
    '### Next Steps',
    '',
    ...nextStepLines,
  ]));

  // Reference cell with NIST URL
  cells.push(markdownCell(slug, idx++, [
    '---',
    '',
    '### References',
    '',
    `- NIST/SEMATECH e-Handbook of Statistical Methods: [${config.nistUrl}](${config.nistUrl})`,
    `- Section ${config.nistSection}: ${config.title}`,
  ]));

  return { cells, nextIndex: idx };
}
