/**
 * Technique content for multivariate analysis techniques.
 *
 * Techniques: contour-plot, scatterplot-matrix, conditioning-plot
 */

import type { TechniqueContent } from './types';

export const MULTIVARIATE_CONTENT: Record<string, TechniqueContent> = {
  'contour-plot': {
    definition:
      'A contour plot is a graphical technique for representing a three-dimensional surface by plotting constant $z$ slices, called contours, on a two-dimensional format. Given a value for $z$, lines are drawn connecting the $(x, y)$ coordinates where that $z$ value occurs. The contour plot is an alternative to a 3-D surface plot.',
    purpose:
      'Use a contour plot when visualizing three-dimensional data on a two-dimensional display. For large data sets, a contour plot or a 3-D surface plot should be considered a necessary first step in understanding the data. Contour plots are also the primary tool for identifying optimal operating conditions in response surface methodology and designed experiments, and are widely used in process optimization, formulation studies, and engineering design.',
    interpretation:
      'The horizontal axis represents one independent variable and the vertical axis represents the other; the contour lines represent iso-response values of the third variable. Closely spaced contour lines indicate a steep surface where small changes in the inputs produce large changes in the response. Widely spaced lines indicate a flat region. Elliptical contours suggest a well-defined optimum, while saddle-shaped contours indicate a minimax point. The direction of steepest ascent is perpendicular to the contour lines. Color fills between contours, when used, provide an additional visual cue for the response magnitude.',
    assumptions:
      'The independent variables are usually restricted to a regular grid. If the data do not form a regular grid, a 2-D interpolation is typically needed to produce one. The smoothness and accuracy of the contour lines depend on the quality of the underlying model or interpolation. An additional variable may be required to specify the $z$ values for drawing the iso-lines; some software packages require explicit values while others determine them automatically. Extrapolation beyond the range of the observed data should be avoided, as the contour shape may change dramatically outside that region.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.10',
    questions: [
      'How does Z change as a function of X and Y?',
    ],
    importance:
      'For univariate data, a run sequence plot and a histogram are necessary first steps. For two-dimensional data, a scatter plot fills that role. In a similar manner, three-dimensional data should be plotted. Small data sets from designed experiments can typically be represented by block plots, DOE mean plots, and the like. For large data sets, a contour plot or a 3-D surface plot should be considered a necessary first step in understanding the data. A specialized DOE contour plot variant exists for full and fractional factorial designs.',
    definitionExpanded:
      'The contour plot is formed with the horizontal axis as one independent variable, the vertical axis as the other independent variable, and the contour lines as iso-response values. The techniques for determining correct iso-response values are complex and almost always computer-generated. If the data (or function) do not form a regular grid, a 2-D interpolation is typically needed. Color fills between contours are optional but common. The spacing of contour lines indicates the gradient: closely spaced lines mean steep change, widely spaced lines mean a flat region.',
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
      'A scatterplot matrix displays all pairwise scatter plots of variables in a multivariate dataset, arranged in a symmetric grid where the row and column positions identify the variable pair. The diagonal cells show the identity line (X_i vs X_i) by default; modern implementations commonly substitute variable names or univariate summaries such as histograms, and the off-diagonal cells show bivariate scatter plots.',
    purpose:
      'Use a scatterplot matrix when exploring a multivariate dataset to identify which variable pairs exhibit strong correlations, non-linear relationships, clusters, or outliers. It provides a comprehensive overview of the bivariate structure of the data in a single display, guiding decisions about variable selection, transformation, and modeling strategy. The scatterplot matrix is particularly useful in regression analysis, principal component analysis, and multivariate quality control.',
    interpretation:
      'Each off-diagonal cell shows the scatter plot for one pair of variables. Strong linear patterns indicate high correlation, while formless clouds indicate weak relationships. The symmetry of the matrix means that each pair appears twice, reflected across the diagonal, which allows using the lower triangle for scatter plots and the upper triangle for correlation coefficients or other summaries. Consistent patterns across multiple pairs may indicate an underlying latent factor. Outliers that appear in multiple scatter plots simultaneously are multivariate outliers that warrant investigation. Comparing the upper and lower triangles can reveal asymmetric relationships or conditioning effects.',
    assumptions:
      'The scatterplot matrix grows quadratically with the number of variables, so it is most practical for datasets with 3 to 8 variables. Beyond that, the individual panels become too small to interpret effectively. The display only reveals pairwise relationships and cannot capture higher-order interactions or conditional dependencies. Large datasets may require transparency or sampling to manage overplotting in each panel.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.26.11',
    questions: [
      'Are there pairwise relationships between the variables?',
      'What is the nature of these relationships (linear, non-linear)?',
      'Are there outliers in the data?',
      'Is there clustering by groups in the data?',
    ],
    importance:
      'The scatterplot matrix provides a comprehensive bivariate overview of multivariate data in a single display. It is the standard first step in multivariate analysis, revealing correlation structure, non-linear relationships, clusters, and outliers that inform variable selection and modeling decisions. In interactive implementations, linking and brushing allows the analyst to select (brush) a subset of points in one panel and see the same observations highlighted in all other panels, making it easy to trace multivariate patterns across variable pairs.',
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
      'A conditioning plot, also called a coplot or subset plot, is a plot of two variables conditional on the value of a third variable (called the conditioning variable). The conditioning variable may be either a variable that takes on only a few discrete values or a continuous variable that is divided into a limited number of subsets.',
    purpose:
      'Use a conditioning plot when exploring how a bivariate relationship changes across levels of a third variable, a question that is central to detecting interactions and confounding in multivariate data. One limitation of the scatterplot matrix is that it cannot show interaction effects with another variable; this is the strength of the conditioning plot. It is also useful for displaying scatter plots for groups in the data. Although these groups can also be plotted on a single plot with different plot symbols, it can often be visually easier to distinguish the groups using the conditioning plot.',
    interpretation:
      'Each panel in the conditioning plot shows a scatter plot of the two primary variables for a subset of data falling within a particular range of the conditioning variable. The analyst examines whether the pattern or strength of the relationship changes across panels. If the scatter plots look similar across all panels, the relationship is stable and there is no interaction with the conditioning variable. If the pattern changes, the conditioning variable is influencing the bivariate relationship. It can be helpful to overlay a fitted curve such as a lowess smooth on each panel. The panels are ordered by the conditioning variable, so systematic changes across the grid are informative.',
    assumptions:
      'The conditioning plot requires that the conditioning variable have enough distinct values to form meaningful groups. Although the basic concept is simple, there are numerous alternatives in the details: the type of fitted curve overlay (linear, quadratic, or lowess), the axis labeling scheme (alternating labels across rows and columns works well when axis limits are common), whether panels are connected or separated by gaps, and the extension of the concept to plot formats beyond scatter plots.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.26.12',
    questions: [
      'Is there a relationship between two variables?',
      'If there is a relationship, does the nature of the relationship depend on the value of a third variable?',
      'Are groups in the data similar?',
      'Are there outliers in the data?',
    ],
    importance:
      'The conditioning plot is the most direct graphical method for detecting interactions in continuous data. It answers whether a two-variable relationship is the same everywhere or changes depending on a third variable, which is fundamental for regression modeling and process understanding.',
    definitionExpanded:
      'Given the variables X, Y, and Z, the conditioning plot is formed by dividing the values of Z into k groups. There are several ways these groups may be formed: there may be a natural grouping of the data, the data may be divided into several equal-sized groups, the grouping may be determined by clusters in the data, and so on. The page is divided into n rows and c columns where nc >= k. Each cell defines a single scatter plot with Y on the vertical axis and X on the horizontal axis, using only points in the corresponding group.',
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
