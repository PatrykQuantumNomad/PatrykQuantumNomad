/**
 * Technique content for combined-diagnostic analysis techniques.
 *
 * Techniques: ppcc-plot, weibull-plot, 4-plot
 */

import type { TechniqueContent } from './types';

export const COMBINED_DIAGNOSTIC_CONTENT: Record<string, TechniqueContent> = {
  'ppcc-plot': {
    definition:
      'A probability plot correlation coefficient (PPCC) plot displays the correlation coefficient from a probability plot as a function of a distribution shape parameter. For each candidate value of the shape parameter, a probability plot is constructed and the correlation between the ordered data and the theoretical quantiles is computed, yielding a curve whose peak identifies the best-fitting distribution.',
    purpose:
      'Use a PPCC plot when the goal is to identify which member of a distribution family best fits the data, or to estimate the optimal value of a shape parameter. The technique is particularly powerful for the Tukey-Lambda family of distributions, where the shape parameter controls tail heaviness and the PPCC plot can distinguish between short-tailed, normal, and long-tailed distributions. It provides a data-driven method for distribution selection that is more systematic than visual inspection of multiple probability plots.',
    interpretation:
      'The horizontal axis shows the shape parameter value and the vertical axis shows the corresponding probability plot correlation coefficient. The peak of the curve identifies the optimal shape parameter, and the height of the peak indicates the overall goodness of fit. A high peak close to 1.0 indicates an excellent fit. For the Tukey-Lambda PPCC plot, the optimal shape parameter near 0.14 corresponds to a normal distribution, values near -1 correspond to a Cauchy-like heavy-tailed distribution, and large positive values correspond to a short-tailed distribution approaching the uniform. The width of the peak also carries information: a broad peak suggests the data are compatible with a range of distributions, while a narrow peak indicates strong evidence for a specific shape.',
    assumptions:
      'The PPCC plot assumes that the data are a random sample from a continuous distribution. It requires a distribution family parameterized by a shape parameter, which limits its applicability to families with such structure. The correlation coefficient as a goodness-of-fit measure is most sensitive to departures in the center of the distribution and somewhat less sensitive to tail behavior compared to formal tests like Anderson-Darling.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.23',
  },

  'weibull-plot': {
    definition:
      'A Weibull plot is a probability plot specifically designed to assess whether data follow a Weibull distribution and to estimate the Weibull shape and scale parameters. The axes are scaled so that data from a Weibull distribution appear as a straight line, with the slope providing the shape parameter and the intercept providing the scale parameter.',
    purpose:
      'Use a Weibull plot primarily in reliability engineering and failure analysis, where the Weibull distribution is the standard model for time-to-failure data. The Weibull distribution is flexible enough to model decreasing failure rates (shape parameter less than 1, indicating infant mortality), constant failure rates (shape equal to 1, equivalent to the exponential distribution), and increasing failure rates (shape greater than 1, indicating wear-out). The Weibull plot provides simultaneous assessment of distributional fit and parameter estimation in a single graphical display.',
    interpretation:
      'The horizontal axis shows the logarithm of the data values and the vertical axis shows the Weibull probability scale, which is derived from the double logarithm of the inverse survival function. Points falling along a straight line indicate that the Weibull distribution is a good fit. The slope of the fitted line estimates the shape parameter beta: a slope less than 1 indicates a decreasing hazard rate, a slope of 1 indicates a constant hazard rate, and a slope greater than 1 indicates an increasing hazard rate. The scale parameter eta is read from the point where the fitted line crosses the 63.2nd percentile. Departures from linearity indicate that the Weibull model is not appropriate and an alternative distribution should be considered.',
    assumptions:
      'The Weibull plot assumes that all failure times are observed and come from a single failure mode. Censored data, where some units have not yet failed, require modified plotting positions. Mixed failure modes, where different components fail by different mechanisms, produce a curved or kinked Weibull plot and should be analyzed separately by failure mode. The visual parameter estimates from the plot are useful starting values but are less efficient than maximum likelihood estimates for formal inference.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.30',
  },

  '4-plot': {
    definition:
      'The 4-plot is a composite diagnostic display that combines four graphical panels into a single figure: a run-sequence plot, a lag plot, a histogram, and a normal probability plot. Each panel tests one of the four underlying assumptions of a univariate measurement process: fixed location, fixed variation, randomness, and distributional form.',
    purpose:
      'Use the 4-plot as a comprehensive screening tool to simultaneously check all four assumptions that underlie most univariate statistical analyses. Rather than examining each assumption separately, the 4-plot provides a single-page summary that reveals whether the data are suitable for standard statistical methods. It is the recommended starting point in the NIST/SEMATECH handbook for univariate process characterization and is particularly valuable during initial data exploration before committing to specific modeling or testing approaches.',
    interpretation:
      'The run-sequence plot (upper left) checks for fixed location and fixed variation over time: a horizontal band of points with constant spread indicates stability. The lag plot (upper right) checks for randomness: a structureless cloud indicates independence, while any pattern indicates serial correlation. The histogram (lower left) provides a visual summary of the distributional shape, center, and spread, and flags potential outliers or multimodality. The normal probability plot (lower right) specifically assesses normality: points along the reference line indicate a normal distribution. When all four panels show ideal patterns, the analyst can proceed with standard methods. When any panel shows departures, the nature of the departure guides the choice of alternative methods.',
    assumptions:
      'The 4-plot requires time-ordered data for the run-sequence and lag plot panels to be meaningful. If the data do not have a natural time ordering, only the histogram and probability plot panels are interpretable. The 4-plot is a screening tool, not a definitive test, and unusual patterns should be investigated with more specialized techniques.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.32',
  },
} as const;
