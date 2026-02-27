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
    questions: [
      'Is the factor of interest significant?',
      'Does the factor of interest have an effect?',
      'Does the location change between levels of the primary factor?',
      'Has the process improved?',
      'What is the best setting (level) of the primary factor?',
      'How much of an average improvement can we expect with this best setting?',
      'Is there an interaction between the primary factor and one or more nuisance factors?',
      'Does the effect of the primary factor change depending on the setting of some nuisance factor?',
      'Are there any outliers?',
    ],
    importance:
      'The block plot is the most information-rich graphical display for randomized block designs. It simultaneously shows treatment effects, blocking effectiveness, and potential interactions in a single figure, providing more insight than the ANOVA table alone because it reveals the pattern and consistency of effects rather than just their statistical significance.',
    definitionExpanded:
      'Each block is represented as a vertical cluster of observations on the horizontal axis. Within each block, individual data points are plotted and connected by lines to the block mean. Treatment levels may be distinguished by color or symbol. The vertical axis shows the response. Parallel connecting lines across blocks indicate consistent treatment effects (no interaction), while crossing lines indicate block-by-treatment interaction.',
    caseStudySlugs: ['ceramic-strength'],
    examples: [
      {
        label: 'Consistent Treatment Effect',
        description:
          'Connecting lines across blocks are roughly parallel, indicating the treatment effect is the same regardless of the block. The factor of interest has a main effect with no interaction.',
      },
      {
        label: 'Block-by-Treatment Interaction',
        description:
          'Connecting lines cross between blocks, indicating the treatment effect depends on the block. The factor of interest behaves differently under different blocking conditions, and the interaction must be modeled.',
      },
      {
        label: 'Effective Blocking',
        description:
          'Large vertical separation between block means confirms that blocking captured meaningful nuisance variability. Without blocking, this variability would inflate the error term and reduce the ability to detect treatment effects.',
      },
    ],
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
    questions: [
      'Are there any shifts in location?',
      'What is the magnitude of the shifts in location?',
      'Is there a distinct pattern in the shifts in location?',
    ],
    importance:
      'The mean plot is the most direct visual tool for detecting location effects in designed experiments. It provides immediate visual answers to the central DOE question: does changing the factor setting change the average response? The magnitude of the shift relative to the grand mean indicates practical significance.',
    definitionExpanded:
      'The horizontal axis shows factor levels (categorical or ordered). The vertical axis shows the group mean for each level. A horizontal reference line at the grand mean (mean of all observations) provides a baseline for comparison. The deviation of each group mean from the grand mean line indicates the size and direction of the factor effect at that level.',
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
    questions: [
      'What variables are dominant for a given observation?',
      'Which observations are most similar (are there clusters)?',
      'Are there outliers?',
    ],
    importance:
      'The star plot enables the comparison of multivariate profiles across observations in a compact, visually intuitive format. It answers the question "which variables differentiate these observations?" at a glance, making it valuable for benchmarking, quality profiling, and competitive analysis where many attributes must be compared simultaneously.',
    definitionExpanded:
      'Each observation is represented as a separate star (polygon) with p spokes radiating from a center point at equal angles (360/p degrees apart). Each spoke represents one variable, and the spoke length is proportional to the variable\'s value (typically scaled to 0\u20131 range). The tips of the spokes are connected to form a polygon. Large, regular polygons indicate uniformly high values; small polygons indicate uniformly low values; irregular shapes highlight dominant variables.',
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
    questions: [
      'Are all labs equivalent?',
      'What labs have between-lab problems (reproducibility)?',
      'What labs have within-lab problems (repeatability)?',
      'What labs are outliers?',
    ],
    importance:
      'The Youden plot is the standard graphical tool for interlaboratory studies and proficiency testing. It uniquely separates between-lab systematic bias (points along the diagonal) from within-lab random variability (scatter perpendicular to the diagonal), providing targeted diagnostic information that summary statistics cannot reveal.',
    definitionExpanded:
      'Each laboratory is plotted as a single point with horizontal coordinate = result from run/sample 1 and vertical coordinate = result from run/sample 2. Vertical and horizontal reference lines are drawn at the medians of each run, dividing the plot into four quadrants. A 45-degree reference line through the median intersection highlights systematic bias. Points near this diagonal have high between-lab bias; points far from the diagonal have high within-lab variability.',
  },
} as const;
