/**
 * Technique content for multivariate analysis techniques.
 *
 * Techniques: contour-plot, scatterplot-matrix, conditioning-plot
 */

import type { TechniqueContent } from './types';

export const MULTIVARIATE_CONTENT: Record<string, TechniqueContent> = {
  'contour-plot': {
    definition:
      'A contour plot represents a three-dimensional response surface on a two-dimensional plane by drawing lines of constant response value, called contour lines or isolines. Each contour line connects all combinations of two predictor variables that produce the same predicted response, creating a topographic map of the response surface.',
    purpose:
      'Use a contour plot when exploring the relationship between a response variable and two predictor variables, particularly in the context of response surface methodology and designed experiments. Contour plots are the primary tool for identifying optimal operating conditions, finding regions of high or low response, and understanding the curvature and interaction structure of a fitted response surface. They are widely used in process optimization, formulation studies, and engineering design problems.',
    interpretation:
      'The horizontal and vertical axes represent the two predictor variables, and the contour lines represent constant levels of the response. Closely spaced contour lines indicate a steep response surface where small changes in the predictors lead to large changes in the response. Widely spaced lines indicate a flat region where the response is insensitive to changes. Elliptical contours suggest a well-defined optimum, while saddle-shaped contours indicate a minimax point. The direction of steepest ascent is perpendicular to the contour lines. Color fills between contours, when used, provide an additional visual cue for the response magnitude.',
    assumptions:
      'Contour plots require a mathematical model or dense grid of data points to interpolate the response surface between observed data. The smoothness and accuracy of the contour lines depend on the quality of the underlying model fit. Extrapolation beyond the range of the experimental data should be avoided, as the contour shape may change dramatically outside the observed region.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.10',
  },

  'scatterplot-matrix': {
    definition:
      'A scatterplot matrix displays all pairwise scatter plots of variables in a multivariate dataset, arranged in a symmetric grid where the row and column positions identify the variable pair. The diagonal cells typically show variable names or univariate summaries such as histograms, and the off-diagonal cells show bivariate scatter plots.',
    purpose:
      'Use a scatterplot matrix when exploring a multivariate dataset to identify which variable pairs exhibit strong correlations, non-linear relationships, clusters, or outliers. It provides a comprehensive overview of the bivariate structure of the data in a single display, guiding decisions about variable selection, transformation, and modeling strategy. The scatterplot matrix is particularly useful in regression analysis, principal component analysis, and multivariate quality control.',
    interpretation:
      'Each off-diagonal cell shows the scatter plot for one pair of variables. Strong linear patterns indicate high correlation, while formless clouds indicate weak relationships. The symmetry of the matrix means that each pair appears twice, reflected across the diagonal, which allows using the lower triangle for scatter plots and the upper triangle for correlation coefficients or other summaries. Consistent patterns across multiple pairs may indicate an underlying latent factor. Outliers that appear in multiple scatter plots simultaneously are multivariate outliers that warrant investigation. Comparing the upper and lower triangles can reveal asymmetric relationships or conditioning effects.',
    assumptions:
      'The scatterplot matrix grows quadratically with the number of variables, so it is most practical for datasets with 3 to 8 variables. Beyond that, the individual panels become too small to interpret effectively. The display only reveals pairwise relationships and cannot capture higher-order interactions or conditional dependencies. Large datasets may require transparency or sampling to manage overplotting in each panel.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.26.11',
  },

  'conditioning-plot': {
    definition:
      'A conditioning plot, also called a coplot, displays the relationship between two variables conditioned on the values of one or more additional variables. The conditioning variable is divided into overlapping intervals, and a separate scatter plot of the two primary variables is drawn for each interval, arranged in a trellis-style grid.',
    purpose:
      'Use a conditioning plot when exploring how a bivariate relationship changes across levels of a third variable, a question that is central to detecting interactions and confounding in multivariate data. It is especially useful in regression diagnostics, response surface analysis, and process characterization where the effect of one predictor on the response may depend on the setting of another predictor. The conditioning plot goes beyond a simple scatter plot matrix by explicitly showing how the two-variable relationship evolves as a function of the conditioning variable.',
    interpretation:
      'Each panel in the conditioning plot shows a scatter plot of the two primary variables for a subset of data falling within a particular range of the conditioning variable. The analyst examines whether the pattern, slope, or strength of the relationship changes across panels. If the scatter plots look similar across all panels, the relationship is stable and there is no interaction with the conditioning variable. If the slope, spread, or shape changes, the conditioning variable is influencing the bivariate relationship. The panels are ordered by the conditioning variable, so systematic changes across the grid are informative.',
    assumptions:
      'The conditioning plot requires that the conditioning variable be continuous or ordinal with enough distinct values to form meaningful intervals. The overlapping interval approach introduces some smoothing but can be sensitive to the number of conditioning intervals chosen. With high-dimensional data, conditioning on multiple variables simultaneously can produce many panels, making the display difficult to interpret.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.26.12',
  },
} as const;
