/**
 * Interpretation section builder.
 *
 * Generates case-study-specific interpretation narratives for all 7 standard
 * case studies. Each interpretation describes the key findings specific to
 * that dataset, tying together the hypothesis test results with domain context.
 */

import type { Cell } from '../../types';
import type { CaseStudyConfig } from '../../registry/types';
import { markdownCell } from '../../cells';

/** Per-slug interpretation content */
const INTERPRETATIONS: Record<string, string[]> = {
  'normal-random-numbers': [
    '## Interpretation',
    '',
    '### Key Findings for Normal Random Numbers',
    '',
    'The normal random numbers dataset is the **baseline case study** where all',
    'standard EDA assumptions are expected to be satisfied:',
    '',
    '1. **Location:** The mean is close to the theoretical value of 0, and no',
    '   significant trend was detected. The location is fixed.',
    '2. **Variation:** The standard deviation is close to the theoretical value of 1.',
    '   Bartlett\'s test confirms equal variances across groups.',
    '3. **Randomness:** Both the runs test and lag-1 autocorrelation confirm that',
    '   the data are random with no serial dependence.',
    '4. **Distribution:** The Anderson-Darling test confirms normality. The probability',
    '   plot shows points closely following the theoretical line.',
    '5. **Outliers:** No significant outliers detected by Grubbs\' test.',
    '',
    'All assumptions are satisfied, confirming that the underlying random number',
    'generator produces data consistent with a N(0,1) process. The sample mean',
    'and sample standard deviation are sufficient statistics, and standard',
    'confidence intervals and hypothesis tests can be applied without concern.',
    '',
    'This case study serves as a **pass/fail reference**: if your EDA pipeline',
    'produces the same conclusions on this dataset, your implementation is correct.',
  ],

  'uniform-random-numbers': [
    '## Interpretation',
    '',
    '### Key Findings for Uniform Random Numbers',
    '',
    'The uniform random numbers dataset demonstrates the effect of a',
    '**non-normal distribution** on the standard EDA pipeline:',
    '',
    '1. **Location:** The mean is close to the theoretical value of 0.5.',
    '   No significant trend detected.',
    '2. **Variation:** Variances are stable across groups, as expected for',
    '   an i.i.d. uniform process.',
    '3. **Randomness:** The data pass both randomness tests, confirming',
    '   independence.',
    '4. **Distribution:** The Anderson-Darling test **rejects normality**,',
    '   correctly detecting the non-normality of the uniform distribution.',
    '   The histogram shows a flat (rectangular) shape rather than bell-curve.',
    '5. **Outliers:** No outliers expected or detected.',
    '',
    'The key lesson is that **non-normal data can still be well-behaved** in',
    'every other respect. The data are random, have fixed location and variation,',
    'but the distribution is uniform rather than normal. This means parametric',
    'methods assuming normality (t-tests, normal confidence intervals) should',
    'be replaced with non-parametric alternatives or bootstrap methods.',
  ],

  'heat-flow-meter': [
    '## Interpretation',
    '',
    '### Key Findings for Heat Flow Meter',
    '',
    'The heat flow meter dataset reveals a **mild departure from randomness**',
    'in calibration measurements:',
    '',
    '1. **Location:** The mean calibration factor is stable at approximately',
    `   9.2615. No significant trend is detected in the location.`,
    '2. **Variation:** The data show stable variation across measurement groups.',
    '3. **Randomness:** The lag-1 autocorrelation test may detect mild',
    '   non-random behavior. This is common in physical measurement processes',
    '   where consecutive readings are slightly correlated due to thermal inertia.',
    '4. **Distribution:** Despite the mild non-randomness, the distribution',
    '   tests can still be applied. The data are approximately normal.',
    '5. **Outliers:** A few potential outliers may be present.',
    '',
    'The mild departure from randomness is expected in physical calibration',
    'data. It does not invalidate the analysis but suggests that confidence',
    'intervals computed from the standard formula may be slightly narrower',
    'than the true intervals. For high-precision metrology, accounting for',
    'autocorrelation in uncertainty estimates is recommended.',
  ],

  'filter-transmittance': [
    '## Interpretation',
    '',
    '### Key Findings for Filter Transmittance',
    '',
    'The filter transmittance dataset exhibits **severe serial autocorrelation**,',
    'which is the dominant finding:',
    '',
    '1. **Location:** The mean transmittance is stable at approximately 2.0019.',
    '2. **Variation:** Variation tests should be interpreted with caution due',
    '   to the strong autocorrelation.',
    '3. **Randomness:** Both the runs test and lag-1 autocorrelation test',
    '   detect strong serial dependence. The lag-1 autocorrelation coefficient',
    '   is large, far exceeding the critical value.',
    '4. **Distribution & Outlier tests:** These tests were **skipped** because',
    '   the severe autocorrelation violates the independence assumption.',
    '   Results from Anderson-Darling or Grubbs tests would be misleading.',
    '',
    'The strong autocorrelation means consecutive measurements are not',
    'independent. This has important implications:',
    '- Standard confidence intervals **underestimate** the true uncertainty',
    '- The effective sample size is much smaller than the 50 observations',
    '- A time-series model (e.g., AR(1)) should be fit before further analysis',
    '- The omitted distribution and outlier tests require modeling the serial',
    '  dependence first',
  ],

  'cryothermometry': [
    '## Interpretation',
    '',
    '### Key Findings for Cryothermometry',
    '',
    'The cryothermometry dataset has a **discrete, integer-valued** response',
    'variable (voltage counts), which affects the interpretation:',
    '',
    '1. **Location:** The mean voltage count is approximately 2899.',
    '   No significant trend detected.',
    '2. **Variation:** The standard deviation is small relative to the mean,',
    '   indicating precise measurements.',
    '3. **Randomness:** The data appear random. Despite the discrete nature,',
    '   the runs test and autocorrelation test both indicate no serial dependence.',
    '4. **Distribution:** The Anderson-Darling test for normality should be',
    '   interpreted cautiously for discrete integer data. The data may show',
    '   departures from normality due to the discrete nature of voltage counts,',
    '   not because of a systematic non-normal process.',
    '5. **Outliers:** Grubbs test applied but results should account for the',
    '   discrete measurement scale.',
    '',
    'The discrete integer nature of the data means the histogram will show',
    'gaps rather than a smooth distribution. The normal probability plot may',
    'show a "staircase" pattern. These are artifacts of the measurement',
    'resolution, not defects in the data.',
  ],

  'fatigue-life': [
    '## Interpretation',
    '',
    '### Key Findings for Fatigue Life',
    '',
    'The fatigue-life dataset is **right-skewed** with a heavy right tail,',
    'which is characteristic of lifetime/reliability data:',
    '',
    '1. **Location:** The mean fatigue life is approximately 1401 kilocycles.',
    '   No significant trend in measurement order.',
    '2. **Variation:** Variation is substantial (std ~ 389 kilocycles),',
    '   typical of fatigue testing where specimen-to-specimen variability is high.',
    '3. **Randomness:** The data appear random with no serial dependence.',
    '4. **Distribution:** The normal distribution is rejected. The data are',
    '   better described by a **Weibull distribution**, which is the standard',
    '   model for reliability and fatigue analysis. The Gamma distribution',
    '   also provides a reasonable fit.',
    '5. **Outliers:** Some extreme values at the upper tail, but these are',
    '   expected for right-skewed lifetime data, not true outliers.',
    '',
    'For fatigue-life data, the Weibull distribution is preferred because:',
    '- It naturally models the "weakest link" failure mechanism',
    '- It accommodates the right-skewed shape with a finite lower bound',
    '- Its parameters have physical interpretations in reliability engineering',
    '- Probability plots on Weibull axes produce better linearity than normal axes',
  ],

  'standard-resistor': [
    '## Interpretation',
    '',
    '### Key Findings for Standard Resistor',
    '',
    'The standard resistor dataset shows **systematic drift and non-stationary**',
    'behavior over the measurement period (1980-1985):',
    '',
    '1. **Location:** A significant downward trend in resistance values is',
    '   detected by the location test. The resistance is drifting over time.',
    '2. **Variation:** The variation test may detect inhomogeneous variance',
    '   related to the drift.',
    '3. **Randomness:** Both the runs test and lag-1 autocorrelation test',
    '   strongly reject randomness. The data have a clear non-stationary trend',
    '   component plus strong serial correlation.',
    '4. **Distribution & Outlier tests:** These tests were **skipped** because',
    '   the severe autocorrelation and drift violate the independence assumption.',
    '   Testing the residuals after detrending would be more appropriate.',
    '',
    'The triple failure (location drift, non-randomness, autocorrelation)',
    'indicates this is fundamentally a time-series problem. The standard',
    'resistor is aging, and the data should be modeled with a trend component',
    'before computing meaningful uncertainty estimates.',
  ],
};

/**
 * Build interpretation section cells.
 */
export function buildInterpretation(
  config: CaseStudyConfig,
  slug: string,
  startIndex: number,
): { cells: Cell[]; nextIndex: number } {
  let idx = startIndex;
  const cells: Cell[] = [];

  const content = INTERPRETATIONS[slug];
  if (content) {
    cells.push(markdownCell(slug, idx++, content));
  } else {
    // Fallback for unknown slugs (should not happen for standard notebooks)
    cells.push(markdownCell(slug, idx++, [
      '## Interpretation',
      '',
      `Interpretation for ${config.title} case study.`,
    ]));
  }

  return { cells, nextIndex: idx };
}
