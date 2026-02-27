/**
 * Technique content for comparison analysis techniques.
 *
 * Techniques: block-plot, mean-plot, star-plot, youden-plot
 */

import type { TechniqueContent } from './types';

export const COMPARISON_CONTENT: Record<string, TechniqueContent> = {
  'block-plot': {
    definition:
      'A block plot displays the response values from a designed experiment organized by blocks, with group means connected to highlight blocking and treatment effects. Each block is shown as a separate cluster of points, making it easy to see whether systematic differences exist between blocks or between treatments within blocks.',
    purpose:
      'Use a block plot when running a randomized complete block design or similar blocked experiment to visualize whether blocking was effective and whether treatment effects are present. It answers the practical question of whether the variability between blocks is large enough to justify the blocking strategy and whether treatment differences are visible after removing block-to-block variation. The block plot is a standard diagnostic in design of experiments analysis and complements formal ANOVA results with visual insight.',
    interpretation:
      'The horizontal axis typically represents blocks or treatment levels, and the vertical axis represents the response. Within each block, individual observations are plotted, and the block means are connected by lines. If the connecting lines are roughly parallel, the treatment effect is consistent across blocks and no interaction exists. If the lines cross, there may be a block-by-treatment interaction that warrants further investigation. Large vertical separation between block means confirms that blocking captured meaningful variability, while minimal separation suggests blocking may not have been necessary.',
    assumptions:
      'The block plot assumes a balanced or near-balanced design where each treatment appears in every block. It is most effective when the number of blocks and treatments is moderate, as very large designs produce cluttered displays. The plot provides visual guidance rather than formal significance tests and should be used alongside ANOVA to quantify the observed effects.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.3',
  },

  'mean-plot': {
    definition:
      'A mean plot displays the group means for each level of a factor variable, with a horizontal reference line drawn at the grand mean of all observations. It provides a direct visual comparison of how the average response changes across factor levels in a designed experiment or observational study.',
    purpose:
      'Use a mean plot to determine whether a factor has a significant effect on the location of the response variable. It is one of the core graphical tools in design of experiments, providing an immediate visual answer to the question of whether factor levels produce different average responses. The mean plot is often used alongside the standard deviation plot to simultaneously assess effects on both location and spread.',
    interpretation:
      'The horizontal axis shows the factor levels and the vertical axis shows the corresponding group means. The grand mean reference line provides a baseline for comparison. Factor levels whose means are well above or below the grand mean line are likely to be statistically significant, while levels clustering near the grand mean suggest no effect. The practical significance depends on the magnitude of the departure relative to the within-group variability. When multiple factors are present, separate mean plots for each factor help identify which factors dominate.',
    assumptions:
      'The mean plot assumes that the sample means are reasonable estimators of the population means, which requires that within-group sample sizes are not too small. It does not account for variability within each group, so it should be interpreted in conjunction with the standard deviation plot or box plots. Equal sample sizes across groups are not required but simplify interpretation.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.20',
  },

  'star-plot': {
    definition:
      'A star plot, also known as a radar chart or spider chart, displays multivariate data as a series of equi-angular spokes radiating from a central point, with each spoke representing a different variable. The data value for each variable determines the length of the corresponding spoke, and the tips of the spokes are connected to form a polygon whose shape provides a visual fingerprint of the observation.',
    purpose:
      'Use a star plot when comparing the multivariate profiles of individual observations or groups across many variables simultaneously. It is especially useful for comparing products, specimens, systems, or process conditions on multiple quality characteristics at once. The star plot enables rapid visual identification of which observations are similar, which are outliers, and which variables differentiate between groups. It is commonly used in quality control, benchmarking, and competitive analysis.',
    interpretation:
      'Each spoke of the star represents one variable, and the distance from the center indicates the magnitude of that variable, typically scaled to a common range. A large, regular polygon indicates an observation that scores highly on all variables. A small polygon indicates uniformly low values. An irregular or lopsided polygon highlights variables where the observation is unusually high or low. When multiple star plots are displayed side by side, similar polygon shapes indicate similar multivariate profiles, while contrasting shapes indicate differentiation. The area of the polygon provides a rough aggregate measure, but the shape is more informative than the area alone.',
    assumptions:
      'The star plot requires that all variables be measured on comparable scales or that the data be standardized before plotting. The visual impression depends on the ordering of variables around the perimeter, and different orderings can produce different visual patterns for the same data. The technique works best with 5 to 12 variables; fewer than 5 does not justify the radial layout, and more than 12 makes individual spokes difficult to distinguish.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.29',
  },

  'youden-plot': {
    definition:
      'A Youden plot is a scatter plot used in interlaboratory studies that plots the result from one run or condition against the result from a second run or condition for each laboratory, with reference lines drawn at the medians of both runs. The resulting display separates within-laboratory variability from between-laboratory variability.',
    purpose:
      'Use a Youden plot when analyzing data from interlaboratory comparisons, proficiency testing, or paired-sample studies where each laboratory or instrument produces two measurements under different conditions. The plot reveals whether laboratories that score high on one measurement also score high on the other, which would indicate a systematic between-laboratory bias. It is a standard tool in metrology and quality assurance for identifying laboratories whose measurement systems are consistently biased.',
    interpretation:
      'The horizontal axis shows the result from one run and the vertical axis shows the result from the other run. The median reference lines divide the plot into four quadrants. Laboratories in the upper-right quadrant measure consistently high on both runs, while those in the lower-left quadrant measure consistently low. This diagonal pattern indicates between-laboratory systematic bias. Laboratories scattered uniformly across all four quadrants show primarily within-laboratory random variability and no systematic bias. A tight cluster of points along the diagonal indicates that between-laboratory variability dominates, while a diffuse cloud with no diagonal trend indicates that within-laboratory variability dominates.',
    assumptions:
      'The Youden plot requires paired measurements from each laboratory, typically two runs or two samples. It assumes that the two conditions are measured on the same scale. The plot is most informative when the number of laboratories is moderate to large, typically 10 or more. The median reference lines are used instead of means because they are robust to outlying laboratories.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.31',
  },
} as const;
