/**
 * Technique content for regression analysis techniques.
 *
 * Techniques: linear-plots, scatter-plot, 6-plot
 */

import type { TechniqueContent } from './types';

export const REGRESSION_CONTENT: Record<string, TechniqueContent> = {
  'linear-plots': {
    definition:
      'Linear plots are a set of four companion plots used to assess whether linear fits are consistent across groups: the linear correlation plot (1.3.3.16), the linear intercept plot (1.3.3.17), the linear slope plot (1.3.3.18), and the linear residual standard deviation plot (1.3.3.19). Each plot shows a per-group statistic on the vertical axis against the group identifier on the horizontal axis, with a reference line at the corresponding statistic computed from all the data.',
    purpose:
      'Use linear plots when your data have groups and you need to know whether a single linear fit can be used across all groups or whether separate fits are required for each group. The correlation plot is often examined first: if correlations are high across groups, it is worthwhile to continue with the slope, intercept, and residual standard deviation plots. If correlations are weak, a different model should be pursued. When you do not have predefined groups, treat each distinct data set as a group.',
    interpretation:
      'In the linear correlation plot, the correlation for each group is plotted against the group identifier; high, roughly constant values indicate that linear fitting is appropriate across all groups. The linear intercept plot shows the fitted intercept for each group; constant values confirm a stable baseline, while shifts suggest different operating conditions. The linear slope plot shows the fitted slope for each group; constant values mean the rate of change is uniform, while variation suggests group-specific relationships. The linear residual standard deviation plot shows the residual standard deviation for each group; constant values indicate homogeneous fit quality, while trends indicate that the fit is better for some groups than others. A reference line at the overall statistic (computed from all data) appears on each plot.',
    assumptions:
      'Linear plots require grouped data with enough observations per group to compute a meaningful linear fit (at least several observations per group). The four plots assume the analyst has already established that a linear model is a reasonable starting point, and they serve to diagnose whether that model holds uniformly across groups.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Sections 1.3.3.16-19',
    questions: [
      'Are there linear relationships across groups?',
      'Are the strength of the linear relationships relatively constant across the groups?',
      'Is the intercept from linear fits relatively constant across groups?',
      'If the intercepts vary across groups, is there a discernible pattern?',
      'Do you get the same slope across groups for linear fits?',
      'If the slopes differ, is there a discernible pattern in the slopes?',
      'Is the residual standard deviation from a linear fit constant across groups?',
      'If the residual standard deviations vary, is there a discernible pattern across the groups?',
    ],
    importance:
      'For grouped data, it may be important to know whether the different groups are homogeneous (similar) or heterogeneous (different). Linear plots help answer this question in the context of linear fitting. A regression can have a high overall correlation but be driven by different relationships in different groups. Detecting this heterogeneity prevents the incorrect application of a single model to data that require group-specific models.',
    definitionExpanded:
      'For each group, a linear fit is computed and four statistics are extracted: the correlation coefficient, the intercept, the slope, and the residual standard deviation. Each statistic is plotted against the group identifier, creating four companion panels. A reference line on each panel shows the corresponding statistic from a linear fit using all the data combined. Stable (flat) lines across all four panels confirm a globally consistent linear relationship. Trends or jumps in any panel indicate that the linear model parameters differ across groups, which may require separate models per group.',
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt
from scipy import stats

# Simulate grouped calibration data (15 batches of 50 observations)
rng = np.random.default_rng(42)
n_batches, n_per_batch = 15, 50
x_all, y_all, batches = [], [], []
for b in range(1, n_batches + 1):
    x = np.linspace(1, 11, n_per_batch)
    slope = 0.174 + rng.normal(0, 0.001)
    intercept = 0.01 + rng.normal(0, 0.015)
    y = slope * x + intercept + rng.normal(0, 0.002, n_per_batch)
    x_all.extend(x); y_all.extend(y); batches.extend([b] * n_per_batch)
x_all, y_all, batches = np.array(x_all), np.array(y_all), np.array(batches)

# Compute per-batch linear fit statistics
batch_ids = np.unique(batches)
correlations, intercepts, slopes, res_sds = [], [], [], []
for b in batch_ids:
    mask = batches == b
    res = stats.linregress(x_all[mask], y_all[mask])
    correlations.append(res.rvalue)
    intercepts.append(res.intercept)
    slopes.append(res.slope)
    residuals = y_all[mask] - (res.slope * x_all[mask] + res.intercept)
    n_b = mask.sum()
    res_sds.append(np.sqrt(np.sum(residuals**2) / (n_b - 2)))

# Overall statistics for reference lines
overall = stats.linregress(x_all, y_all)
overall_resid = y_all - (overall.slope * x_all + overall.intercept)
overall_ressd = np.sqrt(np.sum(overall_resid**2) / (len(x_all) - 2))

fig, axes = plt.subplots(2, 2, figsize=(10, 8))

# Panel 1: Correlation plot
axes[0, 0].plot(batch_ids, correlations, 'o-', color='steelblue')
axes[0, 0].axhline(overall.rvalue, color='red', linestyle='--',
                    label=f'Overall r = {overall.rvalue:.4f}')
axes[0, 0].set_title("Linear Correlation Plot")
axes[0, 0].set_xlabel("Batch")
axes[0, 0].set_ylabel("Correlation(Y,X)")
axes[0, 0].legend(fontsize=8)

# Panel 2: Intercept plot
axes[0, 1].plot(batch_ids, intercepts, 'o-', color='steelblue')
axes[0, 1].axhline(overall.intercept, color='red', linestyle='--',
                    label=f'Overall = {overall.intercept:.4f}')
axes[0, 1].set_title("Linear Intercept Plot")
axes[0, 1].set_xlabel("Batch")
axes[0, 1].set_ylabel("Intercept(Y,X)")
axes[0, 1].legend(fontsize=8)

# Panel 3: Slope plot
axes[1, 0].plot(batch_ids, slopes, 'o-', color='steelblue')
axes[1, 0].axhline(overall.slope, color='red', linestyle='--',
                    label=f'Overall = {overall.slope:.4f}')
axes[1, 0].set_title("Linear Slope Plot")
axes[1, 0].set_xlabel("Batch")
axes[1, 0].set_ylabel("Slope(Y,X)")
axes[1, 0].legend(fontsize=8)

# Panel 4: Residual SD plot
axes[1, 1].plot(batch_ids, res_sds, 'o-', color='steelblue')
axes[1, 1].axhline(overall_ressd, color='red', linestyle='--',
                    label=f'Overall = {overall_ressd:.4f}')
axes[1, 1].set_title("Linear RESSD Plot")
axes[1, 1].set_xlabel("Batch")
axes[1, 1].set_ylabel("Residual SD")
axes[1, 1].legend(fontsize=8)

plt.suptitle("Linear Plots (NIST 1.3.3.16-19)", y=1.02)
plt.tight_layout()
plt.show()`,
  },

  'scatter-plot': {
    definition:
      'A scatter plot displays the relationship between two quantitative variables by plotting each observation as a point in a two-dimensional coordinate system, with one variable on the horizontal axis and the other on the vertical axis. Optional enhancements include a regression line, confidence bands, and a LOWESS smoother to highlight the underlying trend.',
    purpose:
      'Use a scatter plot as the primary tool for exploring the relationship between two continuous variables, including questions about correlation, linearity, and the presence of clusters or outliers. It is the foundation of bivariate exploratory analysis and is used before fitting regression models to verify that the assumed relationship is reasonable. Scatter plots are ubiquitous in science, engineering, and business analysis wherever two-variable relationships need to be visualized.',
    interpretation:
      'A positive linear trend, with points rising from lower left to upper right, indicates a positive correlation between the variables. A negative linear trend indicates a negative correlation. A cloud of points with no discernible pattern indicates little or no relationship. Curvature in the scatter pattern suggests a non-linear relationship that may require transformation or a polynomial model. Distinct clusters of points suggest subgroups in the data. A single point far from the main body of data is an outlier that may be influential in a fitted model. Variant patterns include no relationship (random scatter), strong positive linear, strong negative linear, exact linear ($R = 1$), quadratic, exponential, heteroscedastic, homoscedastic, clustered, outlier-contaminated, and sinusoidal patterns, each suggesting different modeling strategies.',
    assumptions:
      'The scatter plot makes no distributional assumptions and is valid for any pair of continuous variables. However, it shows only the marginal bivariate relationship and cannot account for confounding by additional variables. For datasets with many observations, overplotting can obscure patterns, and techniques such as transparency, jittering, or hexagonal binning may be needed.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.26',
    questions: [
      'Are variables $X$ and $Y$ related?',
      'Are variables $X$ and $Y$ linearly related?',
      'Are variables $X$ and $Y$ non-linearly related?',
      'Does the variation in $Y$ change depending on $X$?',
      'Are there outliers?',
    ],
    importance:
      'The scatter plot is the single most important graphical tool for bivariate analysis. It provides a direct, assumption-free view of the relationship between two variables, revealing the form (linear, curved, none), direction (positive, negative), strength, and any anomalies (outliers, clusters, heteroscedasticity). No regression model should be fit without first examining the scatter plot. Important: correlation does not imply causation. A strong association between two variables does not prove that changes in one variable cause changes in the other.',
    definitionExpanded:
      'Each observation is plotted as a point at coordinates $(X_i, Y_i)$. An optional fitted regression line or LOWESS smoother highlights the central trend. The vertical scatter of points around the trend line indicates the strength of the relationship \u2014 tight scatter means strong association, wide scatter means weak association. The shape of the point cloud reveals the functional form: an elliptical cloud suggests linearity, a curved band suggests a non-linear relationship.',
    caseStudySlugs: ['beam-deflections'],
    formulas: [
      {
        label: 'Linear Model',
        tex: String.raw`Y = B_0 + B_1 X + E`,
        explanation:
          'The simple linear regression model, appropriate for strong positive or negative linear scatter patterns.',
      },
      {
        label: 'Quadratic Model',
        tex: String.raw`Y = B_0 + B_1 X + B_2 X^2 + E`,
        explanation:
          'A polynomial model for U-shaped or inverted-U scatter patterns where curvature is present.',
      },
      {
        label: 'Exponential Model',
        tex: String.raw`Y = A + B e^{CX} + E`,
        explanation:
          'An exponential model for scatter patterns where Y increases (or decreases) at an accelerating rate.',
      },
      {
        label: 'Sinusoidal Model',
        tex: String.raw`Y = C + (B_0 + B_1 X)\sin(2\pi\omega X + \phi) + E`,
        explanation:
          'A damped sinusoidal model for oscillating scatter patterns (NIST 1.3.3.26.7).',
      },
    ],
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt

# Generate bivariate data with positive correlation
rng = np.random.default_rng(42)
n = 100
x = rng.uniform(0, 10, n)
y = 1.8 * x + 5 + rng.normal(0, 3, n)

fig, ax = plt.subplots(figsize=(8, 6))
ax.scatter(x, y, alpha=0.6, s=40, edgecolors='white',
           linewidth=0.5)
ax.set_xlabel("X")
ax.set_ylabel("Y")
ax.set_title("Scatter Plot — Bivariate Relationship")
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()`,
    examples: [
      {
        label: 'Strong Positive Correlation',
        description:
          'Points form a tight band rising from lower-left to upper-right. As $X$ increases, $Y$ increases proportionally. The correlation coefficient is close to $+1$. A linear model is appropriate.',
        variantLabel: 'Strong Positive',
      },
      {
        label: 'Strong Negative Correlation',
        description:
          'Points form a tight band falling from upper-left to lower-right. As $X$ increases, $Y$ decreases proportionally. The correlation coefficient is close to $-1$. A linear model with negative slope is appropriate.',
        variantLabel: 'Strong Negative',
      },
      {
        label: 'Weak Positive Correlation',
        description:
          'Points show a general upward trend but with considerable scatter around the trend line. The correlation coefficient is moderate ($0.3$\u2013$0.6$). The relationship exists but other factors contribute substantially to the variability in $Y$.',
        variantLabel: 'Weak Positive',
      },
      {
        label: 'No Correlation',
        description:
          'Points form a structureless circular or rectangular cloud with no discernible trend. The correlation coefficient is near zero. $X$ provides no information about $Y$, and a regression model would not be useful.',
        variantLabel: 'No Correlation',
      },
      {
        label: 'Quadratic Relationship',
        description:
          'Points follow a U-shaped or inverted-U curve. The linear correlation may be near zero despite a strong relationship existing. A quadratic model ($Y = a + bX + cX^2$) or polynomial regression is needed.',
        variantLabel: 'Quadratic',
      },
      {
        label: 'Exponential Relationship',
        description:
          'Points follow an exponential curve with $Y$ increasing (or decreasing) at an accelerating rate. A log transformation of $Y$ or an exponential model is needed. The linear correlation underestimates the true strength of the relationship.',
        variantLabel: 'Exponential',
      },
      {
        label: 'Heteroscedastic',
        description:
          'The vertical spread of points increases (or decreases) systematically as $X$ increases, forming a fan or trumpet shape. This non-constant variance violates a key regression assumption and may require weighted regression or a variance-stabilizing transformation.',
        variantLabel: 'Heteroscedastic',
      },
      {
        label: 'Clustered',
        description:
          'Points form two or more distinct groups separated by gaps, rather than a continuous distribution. This suggests the data come from different subpopulations or operating conditions. Each cluster may have its own regression relationship.',
        variantLabel: 'Clustered',
      },
      {
        label: 'With Outliers',
        description:
          'Most points follow a clear pattern, but one or more points lie far from the main body. These outliers may be influential observations that distort the regression fit. They should be investigated for measurement errors or genuine extreme conditions.',
        variantLabel: 'With Outliers',
      },
      {
        label: 'Exact Linear',
        description:
          'All points fall exactly on a straight line with no scatter whatsoever ($R = 1.0$). This perfect linear relationship is rare in practice and may indicate a deterministic formula, a calibration artifact, or data fabrication. It is included as a reference case showing the theoretical ideal that real data approach but never quite reach.',
        variantLabel: 'Exact Linear',
      },
      {
        label: 'Sinusoidal (Damped)',
        description:
          'Points follow a damped sine-wave pattern where the amplitude decreases as $X$ increases. The relationship is periodic but with diminishing oscillation. A linear or polynomial model is inadequate; a damped sinusoidal model ($Y = C + (B_0 + B_1 X)\\sin(2\\pi\\omega X + \\phi)$) is needed, as described in NIST Section 1.3.3.26.7.',
        variantLabel: 'Sinusoidal (Damped)',
      },
      {
        label: 'Homoscedastic',
        description:
          'Points scatter uniformly around the regression line with constant vertical spread across the full range of $X$. This constant variance (homoscedasticity) satisfies a key assumption of ordinary least squares regression, meaning standard confidence intervals and hypothesis tests on the regression coefficients are valid.',
        variantLabel: 'Homoscedastic',
      },
    ],
  },

  '6-plot': {
    definition:
      'The 6-plot is a regression diagnostic display with six panels for validating a fitted $Y$ versus $X$ model. The six panels are: (1) response and predicted values versus the independent variable, (2) residuals versus the independent variable, (3) residuals versus predicted values, (4) lag plot of residuals, (5) histogram of residuals, and (6) normal probability plot of residuals. It is distinct from the 4-plot, which is a univariate diagnostic.',
    purpose:
      'Use the 6-plot after fitting any $Y$ versus $X$ model to assess its validity. The fit can be linear, non-linear, LOWESS, spline, or any other fit utilizing a single independent variable. The first three panels check whether the functional form is correct and whether the residuals show systematic patterns. The last three panels check the standard assumptions on the residuals: independence (lag plot), approximate normality (histogram and normal probability plot).',
    interpretation:
      'Panel 1 ($Y$ and $\\hat{Y}$ vs $X$) overlays the raw data with the fitted curve to visually assess goodness of fit. Panel 2 (residuals vs $X$) should show a random scatter with no systematic pattern; curvature suggests the model form is wrong. Panel 3 (residuals vs $\\hat{Y}$) should also be structureless; a fan shape indicates non-constant variance. Panel 4 (lag plot of residuals) checks for serial correlation; structure indicates non-independence. Panel 5 (histogram of residuals) should be approximately bell-shaped. Panel 6 (normal probability plot of residuals) should be approximately linear; deviations suggest non-normal errors.',
    assumptions:
      'The 6-plot assumes a regression model has been fit to bivariate $(X, Y)$ data. The residual-based panels (4 through 6) assume the model has been correctly specified in terms of the response-predictor relationship. The lag plot panel is most informative when the data have a natural ordering (e.g., time of collection). The 6-plot is a screening tool for model validation, not a formal hypothesis test.',
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
      'The six panels are arranged in a $2 \\times 3$ grid (2 rows, 3 columns). Row 1: $Y$ and $\\hat{Y}$ vs $X$ (with fit overlay), residuals vs $X$ (checking for non-linearity), residuals vs $\\hat{Y}$ (checking for heteroscedasticity). Row 2: lag plot of residuals (checking for serial correlation), histogram of residuals (checking for symmetry and normality), normal probability plot of residuals (providing a sensitive normality test). Each panel tests a specific regression assumption.',
    caseStudySlugs: ['alaska-pipeline'],
    formulas: [
      {
        label: 'General Regression Model',
        tex: String.raw`Y_i = f(X_i) + E_i`,
        explanation:
          'The underlying model that the 6-plot validates: each response $Y_i$ is the sum of a deterministic function of the predictor $f(X_i)$ and a random error $E_i$. The 6-plot checks whether $f$ is correctly specified (panels 1\u20133) and whether $E_i$ satisfies the assumptions of independence, constant variance, and normality (panels 4\u20136).',
      },
    ],
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt
from scipy import stats

# Generate bivariate data with linear relationship
rng = np.random.default_rng(42)
n = 100
x = np.linspace(5, 50, n) + rng.normal(0, 1, n)
y = 3.2 * x + 15 + rng.normal(0, 6, n)

# Fit linear model
result = stats.linregress(x, y)
y_fit = result.slope * x + result.intercept
residuals = y - y_fit

fig, axes = plt.subplots(2, 3, figsize=(16, 10))

# Panel 1: Y and Y-hat vs X (Row 1, Col 1)
axes[0, 0].scatter(x, y, alpha=0.5, s=20, label='Data')
x_line = np.linspace(x.min(), x.max(), 100)
axes[0, 0].plot(x_line, result.slope * x_line + result.intercept,
                'r-', linewidth=2, label='Fit')
axes[0, 0].set_title("Y and Predicted vs X")
axes[0, 0].set_xlabel("X")
axes[0, 0].set_ylabel("Y")
axes[0, 0].legend(fontsize=8)

# Panel 2: Residuals vs X (Row 1, Col 2)
axes[0, 1].scatter(x, residuals, alpha=0.5, s=20)
axes[0, 1].axhline(0, color='red', linestyle='--')
axes[0, 1].set_title("Residuals vs X")
axes[0, 1].set_xlabel("X")
axes[0, 1].set_ylabel("Residual")

# Panel 3: Residuals vs Predicted (Row 1, Col 3)
axes[0, 2].scatter(y_fit, residuals, alpha=0.5, s=20)
axes[0, 2].axhline(0, color='red', linestyle='--')
axes[0, 2].set_title("Residuals vs Predicted")
axes[0, 2].set_xlabel("Predicted")
axes[0, 2].set_ylabel("Residual")

# Panel 4: Lag plot of residuals (Row 2, Col 1)
axes[1, 0].scatter(residuals[:-1], residuals[1:], alpha=0.5, s=20)
axes[1, 0].set_title("Lag Plot of Residuals")
axes[1, 0].set_xlabel("RES(i-1)")
axes[1, 0].set_ylabel("RES(i)")

# Panel 5: Histogram of residuals (Row 2, Col 2)
axes[1, 1].hist(residuals, bins=15, density=True,
                alpha=0.7, color='steelblue', edgecolor='white')
axes[1, 1].set_title("Residual Histogram")
axes[1, 1].set_xlabel("Residual")
axes[1, 1].set_ylabel("Density")

# Panel 6: Normal probability plot of residuals (Row 2, Col 3)
stats.probplot(residuals, dist="norm", plot=axes[1, 2])
axes[1, 2].set_title("Normal Probability Plot")

plt.suptitle("6-Plot \\u2014 Regression Diagnostic", y=1.01)
plt.tight_layout()
plt.show()`,
    examples: [
      {
        label: 'Good Fit',
        description:
          'Panel 1 shows the fit tracking the data closely. Panels 2-3 show residuals scattered randomly with no pattern. Panel 4 shows a structureless cloud. Panels 5-6 confirm approximately normal residuals. All regression assumptions are satisfied.',
      },
      {
        label: 'Non-Linear Misspecification',
        description:
          'Panel 1 shows the linear fit missing a curved pattern in the data. Panels 2-3 show systematic curvature in the residuals. The model form needs to include a quadratic or higher-order term.',
      },
      {
        label: 'Non-Constant Variance',
        description:
          'Panels 2-3 show a fan shape in the residuals with spread increasing for larger fitted values. This heteroscedasticity invalidates standard error estimates. A variance-stabilizing transformation or weighted regression is needed.',
      },
    ],
  },
} as const;
