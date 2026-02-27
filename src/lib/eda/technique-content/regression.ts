/**
 * Technique content for regression analysis techniques.
 *
 * Techniques: linear-plots, scatter-plot, 6-plot
 */

import type { TechniqueContent } from './types';

export const REGRESSION_CONTENT: Record<string, TechniqueContent> = {
  'linear-plots': {
    definition:
      'Linear plots are a set of four companion plots used to assess the quality of a linear fit between two variables: the linear correlation plot, the linear intercept plot, the linear slope plot, and the linear residual standard deviation plot. Together, they show how the correlation, intercept, slope, and residual variability change across subsets of the data.',
    purpose:
      'Use linear plots when evaluating whether a linear regression relationship is stable across the range of the data or across different subgroups. These plots detect local departures from linearity, non-constant variance, and influential subsets that may distort the global regression. They are particularly valuable when the data span a wide range and the analyst suspects that the relationship may differ in different regions of the predictor space.',
    interpretation:
      'In the linear correlation plot, the correlation coefficient is computed for successive subsets and plotted against the subset index. A roughly constant line near the global correlation value indicates stability. The linear intercept and slope plots show the fitted intercept and slope for each subset; stable values confirm a consistent linear relationship, while trends or jumps suggest that the model parameters shift across the data range. The residual standard deviation plot shows the spread of residuals for each subset; increasing or decreasing trends indicate heteroscedasticity, which may require a weighted regression or variance-stabilizing transformation.',
    assumptions:
      'Linear plots require enough data to form meaningful subsets, typically at least 10 observations per subset. The choice of subset size involves a trade-off between stability of the local estimates and sensitivity to local changes. These plots assume the analyst has already established that a linear model is a reasonable starting point, and they serve to diagnose whether that model holds uniformly.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Sections 1.3.3.16-19',
    questions: [
      'Are there linear relationships across groups?',
      'Are the strength of the linear relationships relatively constant across the groups?',
    ],
    importance:
      'Linear plots assess the stability of a linear fit across different regions of the data. A regression can have a high overall correlation but be driven by different relationships in different subsets. Detecting this instability prevents incorrect extrapolation and identifies subgroups that may require separate models.',
    definitionExpanded:
      'The data are divided into sequential subsets (windows), and four statistics are computed for each subset: the correlation coefficient, the intercept, the slope, and the residual standard deviation. Each statistic is plotted against the subset index, creating four companion panels. Stable (flat) lines across all four panels confirm a globally consistent linear relationship. Trends or jumps in any panel indicate local departures from the global model.',
  },

  'scatter-plot': {
    definition:
      'A scatter plot displays the relationship between two quantitative variables by plotting each observation as a point in a two-dimensional coordinate system, with one variable on the horizontal axis and the other on the vertical axis. Optional enhancements include a regression line, confidence bands, and a LOWESS smoother to highlight the underlying trend.',
    purpose:
      'Use a scatter plot as the primary tool for exploring the relationship between two continuous variables, including questions about correlation, linearity, and the presence of clusters or outliers. It is the foundation of bivariate exploratory analysis and is used before fitting regression models to verify that the assumed relationship is reasonable. Scatter plots are ubiquitous in science, engineering, and business analysis wherever two-variable relationships need to be visualized.',
    interpretation:
      'A positive linear trend, with points rising from lower left to upper right, indicates a positive correlation between the variables. A negative linear trend indicates a negative correlation. A cloud of points with no discernible pattern indicates little or no relationship. Curvature in the scatter pattern suggests a non-linear relationship that may require transformation or a polynomial model. Distinct clusters of points suggest subgroups in the data. A single point far from the main body of data is an outlier that may be influential in a fitted model. Variant patterns include no relationship (random scatter), strong positive linear, strong negative linear, exact linear, quadratic, exponential, sinusoidal, homoscedastic, heteroscedastic, outlier-contaminated, and multi-cluster patterns, each suggesting different modeling strategies.',
    assumptions:
      'The scatter plot makes no distributional assumptions and is valid for any pair of continuous variables. However, it shows only the marginal bivariate relationship and cannot account for confounding by additional variables. For datasets with many observations, overplotting can obscure patterns, and techniques such as transparency, jittering, or hexagonal binning may be needed.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.26',
    questions: [
      'Are variables X and Y related?',
      'Are variables X and Y linearly related?',
      'Are variables X and Y non-linearly related?',
      'Does the variation in Y change depending on X?',
      'Are there outliers?',
    ],
    importance:
      'The scatter plot is the single most important graphical tool for bivariate analysis. It provides a direct, assumption-free view of the relationship between two variables, revealing the form (linear, curved, none), direction (positive, negative), strength, and any anomalies (outliers, clusters, heteroscedasticity). No regression model should be fit without first examining the scatter plot.',
    definitionExpanded:
      'Each observation is plotted as a point at coordinates (X_i, Y_i). An optional fitted regression line or LOWESS smoother highlights the central trend. The vertical scatter of points around the trend line indicates the strength of the relationship \u2014 tight scatter means strong association, wide scatter means weak association. The shape of the point cloud reveals the functional form: an elliptical cloud suggests linearity, a curved band suggests a non-linear relationship.',
    caseStudySlugs: ['beam-deflections'],
  },

  '6-plot': {
    definition:
      'The 6-plot is a regression diagnostic display with six panels for validating a fitted Y versus X model. The six panels are: (1) response and predicted values versus the independent variable, (2) residuals versus the independent variable, (3) residuals versus predicted values, (4) lag plot of residuals, (5) histogram of residuals, and (6) normal probability plot of residuals. It is distinct from the 4-plot, which is a univariate diagnostic.',
    purpose:
      'Use the 6-plot after fitting a regression model to assess model adequacy. The first three panels check whether the functional form is correct and whether the residuals show any systematic patterns. The last three panels check the standard regression assumptions on the residuals: independence (lag plot), approximate normality (histogram and normal probability plot). The 6-plot is especially useful for linear regression validation and detecting model misspecification.',
    interpretation:
      'Panel 1 (response vs. predictor) overlays the raw data with the fitted curve to visually assess goodness of fit. Panel 2 (residuals vs. predictor) should show a random scatter with no systematic pattern; curvature suggests the model form is wrong. Panel 3 (residuals vs. predicted) should also be structureless; a fan shape indicates non-constant variance. Panel 4 (lag plot of residuals) checks for serial correlation in the residuals; structure indicates non-independence. Panel 5 (histogram of residuals) should be approximately bell-shaped. Panel 6 (normal probability plot of residuals) should be approximately linear; deviations suggest non-normal errors.',
    assumptions:
      'The 6-plot assumes a regression model has been fit to bivariate (X, Y) data. The residual-based panels (4 through 6) assume the model has been correctly specified in terms of the response-predictor relationship. The lag plot panel is most informative when the data have a natural ordering (e.g., time of collection). The 6-plot is a screening tool for model validation, not a formal hypothesis test.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.33',
    questions: [
      'Are the residuals approximately normally distributed with a fixed location and scale?',
      'Are there outliers?',
      'Is the fit adequate?',
      'Do the residuals suggest a better fit?',
    ],
    importance:
      'The 6-plot is the comprehensive regression diagnostic: if any of the six panels shows a problem (non-linearity, non-constant variance, non-independence, non-normality), the regression model needs revision. It prevents the common mistake of reporting regression results without validating the assumptions that make those results meaningful.',
    definitionExpanded:
      'The six panels are arranged in a 2\u00d73 grid. Top row: (1) Y and \u0176 vs X showing the fit overlay, (2) residuals vs X checking for non-linearity, (3) residuals vs \u0176 checking for heteroscedasticity. Bottom row: (4) lag plot of residuals checking for serial correlation, (5) histogram of residuals checking for symmetry and normality, (6) normal probability plot of residuals providing a sensitive normality test. Each panel tests a specific regression assumption.',
    caseStudySlugs: ['standard-resistor'],
  },
} as const;
