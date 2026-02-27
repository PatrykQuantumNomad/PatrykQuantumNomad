/**
 * Technique content for designed-experiments analysis techniques.
 *
 * Techniques: doe-plots, std-deviation-plot
 */

import type { TechniqueContent } from './types';

export const DESIGNED_EXPERIMENTS_CONTENT: Record<string, TechniqueContent> = {
  'doe-plots': {
    definition:
      'DOE plots are a set of three diagnostic scatter plots used in designed experiments: the DOE scatter plot, the DOE mean plot, and the DOE standard deviation plot. Together, they show the raw data, group means, and group standard deviations for each factor level, providing a comprehensive graphical summary of factor effects on both location and spread.',
    purpose:
      'Use DOE plots when analyzing results from a factorial or screening experiment to quickly identify which factors have significant effects on the response. The DOE scatter plot reveals the raw data distribution by factor level, the mean plot highlights location shifts, and the standard deviation plot highlights dispersion effects. These plots are especially useful as a first step before formal ANOVA, as they provide immediate visual evidence of which factors matter and whether assumptions of equal variance hold.',
    interpretation:
      'In the DOE scatter plot, the horizontal axis represents factor levels and the vertical axis represents the response; the spread of points at each level shows within-group variability. In the mean plot, each factor level is represented by its sample mean, with a horizontal reference line at the grand mean; large deviations from the grand mean indicate significant effects. In the standard deviation plot, each factor level shows its sample standard deviation; if the standard deviations differ markedly across levels, the factor affects the process variability and not just the average. Factors whose mean plots show large separation and whose standard deviation plots show roughly equal values are strong candidates for location effects.',
    assumptions:
      'DOE plots assume that the experiment was conducted according to the planned design with proper randomization. They are most effective for two-level or low-level factorial designs. The visual assessment should be confirmed with formal ANOVA or effect significance tests, as visual impressions can be misleading when sample sizes are small.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Sections 1.3.3.11-13',
    questions: [
      'Which factors are important with respect to location and scale?',
      'Are there outliers?',
    ],
    importance:
      'In designed experiments, quickly identifying which factors affect the response (and whether they affect the mean, the variability, or both) is the first analytical step. DOE plots provide this visual screening before formal ANOVA, catching issues like non-constant variance and outliers that could invalidate the analysis.',
    definitionExpanded:
      'The display consists of three panels: (1) DOE scatter plot showing all raw data points by factor level, (2) DOE mean plot showing group means vs. factor level with a grand mean reference line, (3) DOE standard deviation plot showing group standard deviations vs. factor level with an overall standard deviation reference line. Each panel addresses a different aspect of factor effects.',
    caseStudySlugs: ['ceramic-strength'],
  },

  'std-deviation-plot': {
    definition:
      'A standard deviation plot displays the sample standard deviations for each level of a factor variable, with a horizontal reference line drawn at the pooled or overall standard deviation. It is the spread counterpart to the mean plot, focusing on whether a factor affects process variability rather than process average.',
    purpose:
      'Use a standard deviation plot in designed experiments to determine whether a factor influences the variability of the response. Dispersion effects, where a factor setting changes the spread of the output, are as important as location effects in process optimization and quality improvement. The standard deviation plot helps identify factors that can be used to reduce variability, which is a primary objective of robust parameter design and Taguchi methods.',
    interpretation:
      'The horizontal axis shows the factor levels and the vertical axis shows the sample standard deviations. The overall reference line serves as a benchmark for comparison. Factor levels with standard deviations well above the reference line indicate conditions that increase variability, while levels below the line indicate conditions that reduce variability. When comparing the standard deviation plot to the corresponding mean plot, a factor may affect both location and spread, only location, or only spread. Factors that affect spread are particularly valuable because setting them to the low-variability level can improve process consistency.',
    assumptions:
      'The standard deviation plot requires multiple observations per factor level to compute meaningful within-group standard deviations. The sample standard deviation is a less robust measure of spread than the interquartile range, so it can be sensitive to outliers within a group. For very small within-group sample sizes, the standard deviation estimates have high uncertainty and visual differences between factor levels may not be statistically significant.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.28',
    questions: [
      'Are there any shifts in variation?',
      'What is the magnitude of the shifts in variation?',
      'Is there a distinct pattern in the shifts in variation?',
    ],
    importance:
      'Dispersion effects (factors that change process variability) are as important as location effects in quality engineering. A factor that reduces variability without shifting the mean is ideal for robust parameter design. The standard deviation plot is the primary graphical tool for detecting these dispersion effects.',
    definitionExpanded:
      'The horizontal axis shows factor levels (categorical), and the vertical axis shows within-group sample standard deviations. A horizontal reference line is drawn at the pooled (overall) standard deviation. Factor levels whose standard deviations differ markedly from the reference line indicate dispersion effects.',
  },
} as const;
