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
    questions: [
      'How does the response Z change as a function of X and Y?',
    ],
    importance:
      'Contour plots are the primary tool for finding optimal operating conditions in two-factor response surface studies. They answer the central question of process optimization: what combination of settings produces the best response, and how sensitive is the response to deviations from those settings.',
    definitionExpanded:
      'A mathematical model (typically a quadratic polynomial from response surface methodology) is evaluated on a grid of (X, Y) points. Points with equal predicted response are connected by contour lines. The spacing of contour lines indicates the gradient: closely spaced lines mean steep change, widely spaced lines mean a flat region. Color fills between contours are optional but common. The contour plot is a 2D projection of a 3D response surface.',
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt

# Generate 2D bivariate normal density surface
x = np.linspace(-3, 3, 200)
y = np.linspace(-3, 3, 200)
X, Y = np.meshgrid(x, y)

# Bivariate normal with correlation rho = 0.5
rho = 0.5
Z = (1 / (2 * np.pi * np.sqrt(1 - rho**2))) * np.exp(
    -1 / (2 * (1 - rho**2)) * (X**2 - 2 * rho * X * Y + Y**2)
)

fig, ax = plt.subplots(figsize=(8, 6))
cf = ax.contourf(X, Y, Z, levels=15, cmap='viridis')
ax.contour(X, Y, Z, levels=15, colors='white',
           linewidths=0.5, alpha=0.4)
plt.colorbar(cf, ax=ax, label='Density')
ax.set_xlabel("X")
ax.set_ylabel("Y")
ax.set_title("Contour Plot — Bivariate Normal Density (rho=0.5)")
ax.set_aspect('equal')
plt.tight_layout()
plt.show()`,
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
    questions: [
      'Which variable pairs exhibit strong correlations?',
      'Are there non-linear relationships between variable pairs?',
      'Are there multivariate outliers?',
    ],
    importance:
      'The scatterplot matrix provides a comprehensive bivariate overview of multivariate data in a single display. It is the standard first step in multivariate analysis, revealing correlation structure, non-linear relationships, clusters, and outliers that inform variable selection and modeling decisions.',
    definitionExpanded:
      'For p variables, a p x p grid is created where cell (i,j) contains the scatter plot of variable i vs variable j. The diagonal cells show variable names or univariate summaries. The matrix is symmetric: cell (i,j) mirrors cell (j,i). The number of panels grows as p*(p-1)/2 unique pairs.',
    pythonCode: `import numpy as np
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# Generate 4 correlated variables
rng = np.random.default_rng(42)
n = 150
z1 = rng.standard_normal(n)
z2 = rng.standard_normal(n)
z3 = rng.standard_normal(n)

df = pd.DataFrame({
    'Strength': 50 + 5 * z1,
    'Hardness': 30 + 3 * z1 + 2 * z2,
    'Density': 7.5 + 0.5 * z1 + 0.8 * z3,
    'Elasticity': 200 + 20 * z2 + 10 * z3,
})

g = sns.pairplot(df, diag_kind='hist', plot_kws={'alpha': 0.5, 's': 20})
g.figure.suptitle("Scatterplot Matrix — 4 Material Properties", y=1.02)
plt.tight_layout()
plt.show()`,
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
    questions: [
      'Does the bivariate relationship change across levels of the conditioning variable?',
      'Is there an interaction between the primary variables and the conditioning variable?',
      'Does the slope or spread change across conditioning levels?',
    ],
    importance:
      'The conditioning plot is the most direct graphical method for detecting interactions in continuous data. It answers whether a two-variable relationship is the same everywhere or changes depending on a third variable, which is fundamental for regression modeling and process understanding.',
    definitionExpanded:
      'The conditioning variable is divided into overlapping intervals (shingles). For each interval, a separate scatter plot of the two primary variables is drawn using only observations within that interval. Panels are arranged in a trellis grid ordered by the conditioning variable. The overlapping intervals ensure smooth transitions between panels.',
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt

# Generate data with an interaction effect
rng = np.random.default_rng(42)
n = 200
x = rng.uniform(0, 10, n)
z = rng.uniform(0, 30, n)  # conditioning variable
# Slope of Y vs X changes with Z
y = (1 + 0.2 * z) * x + 10 + rng.normal(0, 3, n)

# Split Z into 3 conditioning intervals
z_cuts = np.percentile(z, [0, 33, 67, 100])
labels = [f'Z: {z_cuts[i]:.0f}-{z_cuts[i+1]:.0f}'
          for i in range(3)]

fig, axes = plt.subplots(1, 3, figsize=(15, 4),
                         sharey=True)
for i in range(3):
    mask = (z >= z_cuts[i]) & (z <= z_cuts[i + 1])
    axes[i].scatter(x[mask], y[mask], alpha=0.6, s=30)
    # Fit local trend
    coeffs = np.polyfit(x[mask], y[mask], 1)
    x_line = np.linspace(0, 10, 50)
    axes[i].plot(x_line, np.polyval(coeffs, x_line),
                 'r-', linewidth=2)
    axes[i].set_title(labels[i])
    axes[i].set_xlabel("X")
    axes[i].grid(True, alpha=0.3)

axes[0].set_ylabel("Y")
plt.suptitle("Conditioning Plot — Y vs X | Z", y=1.02)
plt.tight_layout()
plt.show()`,
  },
} as const;
