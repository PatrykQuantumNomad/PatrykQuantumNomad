/**
 * Technique content for distribution-shape analysis techniques.
 *
 * Techniques: bihistogram, bootstrap-plot, box-cox-linearity,
 * box-cox-normality, box-plot, histogram, normal-probability-plot,
 * probability-plot, qq-plot
 */

import type { TechniqueContent } from './types';
import { generateBoxPlotAnatomy } from '../svg-generators/box-plot-anatomy';

export const DISTRIBUTION_SHAPE_CONTENT: Record<string, TechniqueContent> = {
  'bihistogram': {
    definition:
      'A bihistogram is a graphical comparison tool that displays the frequency distributions of two datasets on a common horizontal axis, with one histogram plotted upward and the other plotted downward in mirror fashion. This back-to-back arrangement makes it straightforward to compare the shapes, centers, and spreads of two groups simultaneously.',
    purpose:
      'Use a bihistogram when comparing the distributional characteristics of two groups, such as a before-and-after treatment comparison, two competing manufacturing processes, or two measurement instruments. It is especially useful in quality engineering for assessing whether a process change shifted the location, altered the spread, or changed the shape of the distribution. The bihistogram provides a richer comparison than a simple comparison of summary statistics because it reveals the full distributional context.',
    interpretation:
      'The shared horizontal axis represents the measurement scale, while the upper histogram shows the frequency counts for one group and the lower histogram shows the counts for the other group reflected downward. A shift in the center of one histogram relative to the other indicates a difference in location between the two groups. A difference in the width of the two histograms suggests a difference in variability. Differences in shape, such as one distribution being symmetric while the other is skewed, are also readily apparent. When both histograms are roughly aligned and share a similar shape, the two groups are likely drawn from the same population.',
    assumptions:
      'The bihistogram requires that both datasets share a common measurement scale and that the bin widths are identical for both groups. Results can be sensitive to the choice of bin width, so it is advisable to experiment with different numbers of bins. The technique does not provide a formal statistical test and should be complemented with quantitative two-sample tests when a decision threshold is needed. The bihistogram is restricted to factors with exactly two levels due to its back-to-back layout.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.2',
    questions: ['Is a (2-level) factor significant?', 'Does a (2-level) factor have an effect?', 'Does the location change between the 2 subgroups?', 'Does the variation change between the 2 subgroups?', 'Does the distributional shape change between subgroups?', 'Are there any outliers?'],
    importance: 'The bihistogram reveals the full distributional impact of a two-level factor, not just a shift in means. It detects changes in location, spread, and shape simultaneously, catching effects that a simple t-test would miss. This comprehensive comparison is critical in manufacturing process changes where a shift in variability matters as much as a shift in average.',
    definitionExpanded: 'The upper histogram displays the frequency distribution of one group (e.g., before treatment) and the lower histogram displays the other group (e.g., after treatment) reflected downward on a shared horizontal axis. Both histograms use identical bin widths and bin boundaries so that visual comparison is valid. The back-to-back layout eliminates the alignment ambiguity of overlaid histograms.',
    caseStudySlugs: ['ceramic-strength'],
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt

# Generate two groups of data (before/after treatment)
rng = np.random.default_rng(42)
before = rng.normal(loc=50, scale=8, size=200)
after = rng.normal(loc=55, scale=6, size=200)

# Create bihistogram with shared x-axis
bins = np.linspace(25, 80, 35)
fig, (ax1, ax2) = plt.subplots(2, 1, sharex=True,
                                figsize=(10, 6))

ax1.hist(before, bins=bins, density=True, alpha=0.7,
         color='steelblue', edgecolor='white')
ax1.set_ylabel("Density")
ax1.set_title("Before Treatment")

ax2.hist(after, bins=bins, density=True, alpha=0.7,
         color='coral', edgecolor='white')
ax2.invert_yaxis()
ax2.set_ylabel("Density")
ax2.set_xlabel("Measurement Value")
ax2.set_title("After Treatment")

fig.suptitle("Bihistogram: Before vs After", y=1.02)
plt.tight_layout()
plt.show()`,
  },

  'bootstrap-plot': {
    definition:
      'A bootstrap plot displays the computed value of a sample statistic on the vertical axis against the subsample number on the horizontal axis. Each subsample is drawn with replacement from the original dataset so that any data point can be sampled multiple times or not at all. By repeating this process many times, the plot builds an empirical picture of the sampling variability without requiring distributional assumptions.',
    purpose:
      'Use a bootstrap plot when assessing the uncertainty of an estimate such as the mean, median, or midrange and when traditional confidence interval formulas are mathematically intractable or may not be valid. Bootstrap methods are valuable when the theoretical sampling distribution of a statistic is unknown or difficult to derive analytically, for example with small samples, non-normal data, or complex estimators. Comparing bootstrap plots for different statistics reveals which estimator has the smallest variance.',
    interpretation:
      'The bootstrap plot displays the computed statistic on the vertical axis against the subsample number on the horizontal axis. A stable estimate appears as a tight horizontal band, while a wide scatter indicates high sampling variability. The plot is typically followed by a histogram of the resampled values to examine the shape of the sampling distribution and read off percentile confidence intervals. For example, from 500 bootstrap samples, the 25th and 475th sorted values give a 90% confidence interval.',
    assumptions:
      'The bootstrap assumes that the observed sample is representative of the population and that observations are independent. It may perform poorly with very small samples where the original data do not adequately capture the population structure. The number of bootstrap replications is typically 500 to 1,000. The bootstrap is not appropriate for all distributions and statistics; in particular it is unsuitable for estimating the distribution of statistics that are heavily dependent on the tails, such as the range.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.4',
    questions: ['What does the sampling distribution for the statistic look like?', 'What is a 95% confidence interval for the statistic?', 'Which statistic has a sampling distribution with the smallest variance?'],
    importance: 'The most common uncertainty calculation is generating a confidence interval for the mean, which can be derived mathematically. However many real-world problems involve statistics for which the uncertainty formulas are mathematically intractable. The bootstrap provides a purely empirical alternative by resampling from the observed data, answering the question "how much would my estimate change if I collected new data?" without requiring distributional assumptions.',
    definitionExpanded: 'The bootstrap procedure draws B random subsamples of size N with replacement from the original dataset, computes the statistic of interest for each subsample, and plots the resulting B values against the subsample number as a connected line. This is typically followed by a histogram to visualize the shape of the sampling distribution. Percentile confidence intervals are read directly from the sorted bootstrap values; for example, with 500 resamples the 25th and 475th sorted values form a 90% confidence interval.',
    caseStudySlugs: ['uniform-random-numbers'],
    formulas: [
      {
        label: 'Bootstrap Resample',
        tex: String.raw`X^{*}_b = \{X^{*}_{b,1}, X^{*}_{b,2}, \ldots, X^{*}_{b,N}\} \quad \text{drawn with replacement from } \{X_1, \ldots, X_N\}`,
        explanation:
          'Each bootstrap sample draws N observations with replacement from the original dataset, so some observations may appear multiple times and others not at all.',
      },
      {
        label: 'Percentile Confidence Interval',
        tex: String.raw`CI_{1-\alpha} = \left(\hat{\theta}^{*}_{(\alpha/2)},\; \hat{\theta}^{*}_{(1-\alpha/2)}\right)`,
        explanation:
          'The bootstrap percentile interval uses the alpha/2 and 1-alpha/2 quantiles of the B bootstrap statistic values as the confidence bounds.',
      },
    ],
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt

# 500 uniform random numbers (NIST RANDU-style)
rng = np.random.default_rng(42)
data = rng.uniform(size=500)

# Bootstrap 500 subsamples, compute mean, median, midrange
B = 500
stats = {"Mean": [], "Median": [], "Midrange": []}
for _ in range(B):
    s = rng.choice(data, size=len(data), replace=True)
    stats["Mean"].append(np.mean(s))
    stats["Median"].append(np.median(s))
    stats["Midrange"].append((s.min() + s.max()) / 2)

# 6-panel plot: line plots on top, histograms below
fig, axes = plt.subplots(2, 3, figsize=(12, 6))
for i, (name, vals) in enumerate(stats.items()):
    axes[0, i].plot(vals, linewidth=0.5)
    axes[0, i].set_title(f"Bootstrap {name}")
    axes[0, i].set_xlabel("Subsample Number")
    axes[1, i].hist(vals, bins=20, edgecolor="white")
    axes[1, i].set_title(f"Bootstrap {name}")
    axes[1, i].set_xlabel("Value")
    axes[1, i].set_ylabel("Frequency")
plt.tight_layout()
plt.show()`,
  },

  'box-cox-linearity': {
    definition:
      'A Box-Cox linearity plot helps identify the optimal power transformation of the predictor (X) variable that maximizes the linear correlation between a response Y and a predictor X. It evaluates a range of power transformation exponents and displays the correlation coefficient as a function of the transformation parameter lambda.',
    purpose:
      'Use a Box-Cox linearity plot when a scatter plot suggests a curvilinear relationship between a predictor and a response and a linear model is desired. The technique finds the value of lambda that maximizes the correlation between the response and the transformed predictor, effectively straightening the relationship. This is particularly useful in regression analysis when the analyst wants to apply a simple linear model but the raw data violate the linearity assumption.',
    interpretation:
      'The horizontal axis shows the range of $\\lambda$ values tested, typically from $-2$ to $+2$, and the vertical axis shows the corresponding correlation coefficient between $Y$ and the transformed $X$. The peak of the curve identifies the optimal $\\lambda$ value. Common interpretable values include $\\lambda = 1$ (no transformation needed), $0.5$ (square root), $0$ (log transform by convention), and $-1$ (reciprocal). If the curve is relatively flat near the peak, multiple transformations give similar results and the analyst may choose the most interpretable one. A sharply peaked curve indicates that the linearity of the relationship is highly sensitive to the choice of transformation.',
    assumptions:
      'The Box-Cox linearity plot requires that the predictor values be strictly positive for most values of $\\lambda$, since raising negative numbers to fractional powers is undefined. It assumes a monotonic relationship between the predictor and response; if the relationship is not monotonic, no power transformation will produce linearity. The method targets linearity only and does not address heteroscedasticity or non-normality of residuals.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.5',
    questions: ['Would a suitable transformation improve my linear fit?', 'What is the optimal value of the transformation parameter?'],
    importance: 'Many bivariate relationships are non-linear in their original scale but become linear after a power transformation of the predictor. The Box-Cox linearity plot automates the search for this transformation, turning a difficult non-linear modeling problem into a simple linear regression. Note that the Box-Cox transformation can also be applied to the response variable Y to satisfy error assumptions such as normality and constant variance; that usage is covered by the Box-Cox normality plot.',
    definitionExpanded: 'The procedure evaluates $X^{\\lambda}$ for a range of $\\lambda$ values (typically $-2$ to $+2$) and computes the Pearson correlation between $Y$ and $X^{\\lambda}$ at each $\\lambda$. The $\\lambda = 0$ case uses $\\ln(X)$ by convention. The plot displays correlation vs. $\\lambda$, and the peak identifies the optimal transformation. Common special cases: $\\lambda = 1$ (no transform), $0.5$ (square root), $0$ (log), $-1$ (reciprocal).',
    formulas: [
      {
        label: 'Box-Cox Transformation',
        tex: String.raw`T(X) = \begin{cases} \dfrac{X^{\lambda} - 1}{\lambda} & \lambda \neq 0 \\[6pt] \ln(X) & \lambda = 0 \end{cases}`,
        explanation:
          'The Box-Cox family of power transformations applied to the predictor variable X. The lambda = 0 case uses the natural logarithm by convention as the limiting case.',
      },
      {
        label: 'Linearity Measure',
        tex: String.raw`r(\lambda) = \text{corr}\!\left(Y,\; T_{\lambda}(X)\right)`,
        explanation:
          'The Pearson correlation between the response Y and the transformed predictor is computed for each lambda value. The lambda that maximizes r(lambda) yields the most linear relationship.',
      },
    ],
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt
from scipy import stats

# Generate nonlinear relationship: Y = sqrt(X) + noise
rng = np.random.default_rng(42)
X = rng.uniform(1, 50, size=100)
Y = np.sqrt(X) + rng.normal(0, 0.5, size=100)

# Evaluate correlation for a range of lambda values
lambdas = np.linspace(-2, 2, 201)
correlations = []
for lam in lambdas:
    if abs(lam) < 1e-10:
        T = np.log(X)
    else:
        T = (X**lam - 1) / lam
    r, _ = stats.pearsonr(Y, T)
    correlations.append(r)

optimal_idx = np.argmax(correlations)
optimal_lambda = lambdas[optimal_idx]

fig, ax = plt.subplots(figsize=(10, 5))
ax.plot(lambdas, correlations, 'b-', linewidth=2)
ax.axvline(optimal_lambda, color='r', linestyle='--',
           label=f'Optimal lambda = {optimal_lambda:.2f}')
ax.set_xlabel("Lambda")
ax.set_ylabel("Correlation r(lambda)")
ax.set_title("Box-Cox Linearity Plot")
ax.legend()
plt.tight_layout()
plt.show()`,
  },

  'box-cox-normality': {
    definition:
      'A Box-Cox normality plot identifies the optimal power transformation to make a dataset approximately normally distributed. It evaluates the normality of the transformed data across a range of lambda values and selects the one that yields the best fit to a normal distribution.',
    purpose:
      'Use a Box-Cox normality plot when the data are skewed or otherwise non-normal and normality is required for downstream statistical analysis, such as t-tests, ANOVA, or control chart construction. The method automates the search for an appropriate power transformation, saving the analyst from trial-and-error experimentation with logs, square roots, and reciprocals. It is especially common in process capability studies where normality is a prerequisite for calculating capability indices.',
    interpretation:
      'The horizontal axis shows the range of $\\lambda$ values tested, typically from $-2$ to $+2$, and the vertical axis shows the corresponding normality measure — often the probability plot correlation coefficient (PPCC) or the Shapiro-Wilk statistic. The value of $\\lambda$ that maximizes the normality measure is the optimal transformation. If the optimal $\\lambda$ is near $1$, no transformation is needed. Common interpretable values include $\\lambda = 0.5$ (square root), $\\lambda = 0$ (log), and $\\lambda = -1$ (reciprocal). If the peak is broad, several transformations yield comparably normal results, and the simplest interpretable value should be chosen. A sharply peaked curve indicates that the normality of the transformed data is highly sensitive to the choice of $\\lambda$.',
    assumptions:
      'The data must be strictly positive for the Box-Cox family of transformations to be applied over the full range of $\\lambda$. Outliers can strongly influence the optimal $\\lambda$ and should be investigated before relying on the transformation. The Box-Cox approach finds the best power transformation for normality but cannot make fundamentally multi-modal data normal, since no power transformation can split a bimodal distribution into a unimodal one.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.6',
    questions: ['Is there a transformation that will normalize my data?', 'What is the optimal value of the transformation parameter?'],
    importance: 'Many statistical procedures (t-tests, ANOVA, capability indices) assume normally distributed data. When the raw data are skewed, the Box-Cox normality plot identifies the power transformation that best achieves normality, providing a systematic, data-driven alternative to ad hoc log or square root transforms.',
    definitionExpanded: 'The procedure transforms the data as $Y^{\\lambda}$ for a range of $\\lambda$ values and evaluates the normality of each transformed dataset using the probability plot correlation coefficient (PPCC). The optimal $\\lambda$ maximizes the PPCC. The $\\lambda = 0$ case uses $\\ln(Y)$ by convention. The plot typically includes a confidence interval around the peak to indicate the range of $\\lambda$ values that produce comparable normality. If the interval includes $\\lambda = 1$, no transformation is necessary. Common special cases: $\\lambda = 0.5$ (square root), $0$ (log), $-1$ (reciprocal).',
    formulas: [
      {
        label: 'Box-Cox Transformation for Normality',
        tex: String.raw`T(Y) = \begin{cases} \dfrac{Y^{\lambda} - 1}{\lambda} & \lambda \neq 0 \\[6pt] \ln(Y) & \lambda = 0 \end{cases}`,
        explanation:
          'The Box-Cox power transformation applied to the response variable Y. The optimal lambda is chosen by maximizing the probability plot correlation coefficient (PPCC) of the transformed data against normal order statistics.',
      },
    ],
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt
from scipy import stats

# Generate right-skewed sample data
rng = np.random.default_rng(42)
data = rng.lognormal(mean=2, sigma=0.8, size=200)

# Box-Cox normality plot
fig, ax = plt.subplots(figsize=(10, 5))
lmbdas, ppcc = stats.boxcox_normplot(data, la=-2, lb=2, plot=ax)

# Find and mark the optimal lambda
optimal_lambda = lmbdas[np.argmax(ppcc)]
ax.axvline(optimal_lambda, color='r', linestyle='--',
           label=f'Optimal lambda = {optimal_lambda:.2f}')
ax.set_title("Box-Cox Normality Plot")
ax.legend()
plt.tight_layout()
plt.show()`,
  },

  'box-plot': {
    definition:
      'A box plot (Chambers 1983), also known as a box-and-whisker plot, is an excellent tool for conveying location and variation information in data sets, particularly for detecting and illustrating location and variation changes between different groups of data. The central box spans from the lower quartile ($Q_1$, 25th percentile) to the upper quartile ($Q_3$, 75th percentile), representing the middle 50% of the data. A line inside the box marks the median, and whiskers extend from the quartiles to the most extreme data point within 1.5 IQR of the box (the inner fence).',
    purpose:
      'Use a box plot when comparing the location, spread, and symmetry of one or more groups in a compact graphical format. Box plots are particularly effective for side-by-side comparisons of multiple samples or factor levels, making them a staple of exploratory data analysis in quality engineering, process comparison, and designed experiments. A single box plot can be drawn for one batch of data with no distinct groups; alternatively, multiple box plots can be drawn together to compare multiple data sets or groups in a single data set.',
    interpretation:
      'The position of the median line within the box reveals the symmetry of the distribution: a centered median indicates symmetry, while a median closer to $Q_1$ or $Q_3$ suggests right or left skewness, respectively. The length of the box shows the interquartile range and serves as a robust measure of spread. Whisker lengths indicate the range of the bulk of the data, and individual points plotted beyond the whiskers are candidate outliers deserving further investigation. When comparing multiple box plots, differences in box height indicate differing variability, while vertical offsets between median lines indicate differences in location.',
    assumptions:
      'Box plots make no distributional assumptions and are appropriate for any continuous or ordinal data. However, they can be misleading for very small samples where quartile estimates are unreliable, and they do not reveal multi-modality within a group. For multiple box plots, the width of the box can be set proportional to the number of points in the given group or sample, though some implementations set all boxes to the same width.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.7',
    questions: ['Is a factor significant?', 'Does the location differ between subgroups?', 'Does the variation differ between subgroups?', 'Are there any outliers?'],
    importance: 'The box plot is an important EDA tool for determining if a factor has a significant effect on the response with respect to either location or variation. It is also an effective tool for summarizing large quantities of information.',
    anatomyDiagram: generateBoxPlotAnatomy(),
    definitionExpanded: 'A useful variation of the box plot more specifically identifies outliers using inner and outer fences. The box spans from $Q_1$ to $Q_3$ with the median marked inside, and the interquartile range ($\\text{IQR}$) measures the spread of the middle 50%. Whiskers extend from each quartile to the most extreme data point within the inner fence (1.5 IQR from the box). Points beyond the inner fence but within the outer fence (3.0 IQR) are plotted as small circles (mild outliers), and points beyond the outer fence are plotted as large circles (extreme outliers). The exact fence formulas are given below.',
    formulas: [
      {
        label: 'Interquartile Range',
        tex: String.raw`\text{IQR} = Q_3 - Q_1`,
        explanation:
          'The interquartile range is the difference between the upper quartile (75th percentile) and the lower quartile (25th percentile). It measures the spread of the middle 50% of the data and forms the height of the box.',
      },
      {
        label: 'Inner Fences (Mild Outlier Boundaries)',
        tex: String.raw`L_1 = Q_1 - 1.5 \times \text{IQR} \qquad U_1 = Q_3 + 1.5 \times \text{IQR}`,
        explanation:
          'The inner fences define the boundary for mild outliers. Whiskers extend from the quartiles to the most extreme data points within these fences. Points between the inner and outer fences are flagged as mild outliers.',
      },
      {
        label: 'Outer Fences (Extreme Outlier Boundaries)',
        tex: String.raw`L_2 = Q_1 - 3.0 \times \text{IQR} \qquad U_2 = Q_3 + 3.0 \times \text{IQR}`,
        explanation:
          'The outer fences define the boundary for extreme outliers. Points beyond these fences are flagged as extreme outliers and plotted with larger symbols to distinguish them from mild outliers.',
      },
    ],
    caseStudySlugs: ['ceramic-strength'],
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt

# Generate data for 4 groups with different characteristics
rng = np.random.default_rng(42)
group_a = rng.normal(loc=50, scale=5, size=30)
group_b = rng.normal(loc=55, scale=8, size=30)
group_c = rng.normal(loc=45, scale=5, size=30)
group_d = rng.normal(loc=50, scale=12, size=30)

# Create box plot
fig, ax = plt.subplots(figsize=(10, 5))
ax.boxplot([group_a, group_b, group_c, group_d],
           tick_labels=['Group A', 'Group B', 'Group C', 'Group D'],
           vert=True, patch_artist=True,
           boxprops=dict(facecolor='steelblue', alpha=0.7))
ax.set_ylabel("Measurement Value")
ax.set_title("Box Plot: Comparison of Four Groups")
plt.tight_layout()
plt.show()`,
    examples: [
      { label: 'Equal Groups', description: 'All box plots have similar medians, similar $\\text{IQR}$ heights, and similar whisker lengths. This indicates no significant difference between groups — the factor does not affect either the location or the spread of the response.' },
      { label: 'Location Shift', description: 'Box plots have similar heights and whisker lengths but different median positions. This indicates the factor affects the average response without changing the variability, a classic location effect.' },
      { label: 'Spread Difference', description: 'Box plots have similar medians but markedly different heights. Taller boxes indicate groups with greater variability. This dispersion effect is important for process optimization and robust parameter design.' },
    ],
  },

  'histogram': {
    definition:
      'A histogram is a graphical summary of the frequency distribution of a single variable, constructed by dividing the data range into contiguous intervals called bins and drawing rectangles whose heights represent the count or proportion of observations falling in each bin. An optional kernel density estimation (KDE) overlay provides a smooth estimate of the underlying probability density function.',
    purpose:
      'Use a histogram as the primary tool for assessing the shape, center, and spread of a univariate dataset. It is the most fundamental graphical technique in exploratory data analysis, answering questions about symmetry, skewness, modality, tail behavior, and the presence of outliers or gaps. Histograms are routinely used in process characterization, incoming inspection, and data screening to form an initial impression of the data before applying more specialized techniques.',
    interpretation:
      'The horizontal axis represents the measurement scale and the vertical axis represents frequency or relative frequency. A bell-shaped histogram centered on the mean suggests approximate normality. A histogram that peaks on one side and trails off on the other indicates skewness: a long right tail means right skew and a long left tail means left skew. Two or more distinct peaks indicate a bimodal or multimodal distribution, often arising from mixed populations or distinct operating conditions. Short-tailed histograms, where observations are tightly concentrated around the center, suggest a distribution with lighter tails than the normal. Long-tailed histograms, where observations extend far from the center, suggest heavier tails. A histogram with a single extreme observation far from the main body of data flags a potential outlier. Variant patterns include normal, short-tailed symmetric, long-tailed symmetric, bimodal, right-skewed, left-skewed, uniform, and distributions with outliers, each carrying distinct diagnostic meaning.',
    assumptions:
      'The appearance of a histogram depends on the choice of bin width and starting point. Too few bins obscure detail, while too many bins produce a noisy display that is hard to interpret. Rules of thumb such as the Sturges, Freedman-Diaconis, or Scott rules provide reasonable defaults, but the analyst should experiment with several bin widths. The histogram does not perform well for very small samples, where a dot plot or stem-and-leaf display may be more informative.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.14',
    questions: ['What kind of population distribution do the data come from?', 'Where are the data located (center)?', 'How spread out are the data?', 'Are the data symmetric or skewed?', 'Are there outliers in the data?'],
    importance: 'The histogram is the foundational graphical technique in exploratory data analysis. It provides the most direct visual answer to the question "what does my data look like?" and is the prerequisite for choosing appropriate statistical methods, since nearly every statistical procedure depends on distributional shape assumptions.',
    definitionExpanded: 'The data range is divided into $k$ contiguous, non-overlapping intervals (bins) of equal width. The height of each bar represents the count (or relative frequency) of observations falling in that bin. The number of bins affects the visual impression: too few bins over-smooth and hide structure, too many bins create noise. The Freedman-Diaconis rule ($h = 2 \\cdot \\text{IQR} \\cdot N^{-1/3}$) and Sturges\u2019 rule ($k = 1 + \\log_2 N$) provide automatic defaults. An optional kernel density estimate (KDE) overlay provides a smooth probability density curve.',
    formulas: [
      {
        label: 'Freedman-Diaconis Rule',
        tex: String.raw`h = 2 \cdot \text{IQR} \cdot N^{-1/3}`,
        explanation:
          'The optimal bin width h based on the interquartile range (IQR) and sample size N. This rule is robust to outliers because it uses the IQR rather than the standard deviation.',
      },
      {
        label: 'Sturges\u2019 Rule',
        tex: String.raw`k = 1 + \log_2 N`,
        explanation:
          'The number of bins k based on the sample size N. Simple and widely used, but tends to over-smooth for large samples.',
      },
      {
        label: 'Relative Frequency (Density Normalization)',
        tex: String.raw`f_i = \frac{n_i}{N \cdot h}`,
        explanation:
          'The normalized frequency for bin i, where n_i is the count, N is the total number of observations, and h is the bin width. Under this normalization the area under the histogram equals one, making it comparable to a probability density function.',
      },
    ],
    caseStudySlugs: ['heat-flow-meter'],
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt

# Generate bimodal data: mixture of two normals
rng = np.random.default_rng(42)
data = np.concatenate([
    rng.normal(loc=50, scale=5, size=300),
    rng.normal(loc=70, scale=8, size=200)
])

# Create histogram with density overlay
fig, ax = plt.subplots(figsize=(10, 5))
ax.hist(data, bins=30, density=True, alpha=0.7,
        color='steelblue', edgecolor='white')
ax.set_xlabel("Value")
ax.set_ylabel("Density")
ax.set_title("Histogram with Bimodal Data")
plt.tight_layout()
plt.show()`,
    examples: [
      { label: 'Normal', description: 'A bell-shaped, symmetric histogram with most frequency counts bunched in the middle and counts tapering smoothly in both tails. This is the classical moderate-tailed distribution and confirms that standard statistical methods (t-tests, confidence intervals, capability indices) are appropriate. Verify with a normal probability plot.', variantLabel: 'Normal' },
      { label: 'Short-Tailed', description: 'A symmetric histogram whose tails approach zero very fast, giving a truncated or "sawed-off" appearance. The classical short-tailed distribution is the uniform (rectangular). For short-tailed data, the midrange (smallest + largest) / 2 is the best location estimator, not the sample mean. Verify with a uniform probability plot.', variantLabel: 'Short-Tailed' },
      { label: 'Long-Tailed', description: 'A symmetric histogram whose tails decline to zero very slowly, with probability extending far from the center. The classical long-tailed distribution is the Cauchy. For long-tailed data, the median is the best location estimator because the mean is heavily influenced by extreme observations. Robust methods or a heavy-tailed model (e.g., t-distribution) may be needed.', variantLabel: 'Long-Tailed' },
      { label: 'Bimodal (Sinusoidal)', description: 'Two peaks in a symmetric histogram caused by an underlying deterministic sinusoidal pattern in the data. Unlike a mixture of populations, this bimodality arises from cyclic behavior. Investigate with a run sequence plot, lag plot (an elliptical pattern confirms sinusoidality), or spectral plot to estimate the dominant frequency.', variantLabel: 'Bimodal Sinusoidal' },
      { label: 'Bimodal (Mixture)', description: 'Two peaks where each mode has a rough bell-shaped component, indicating a mixture of two distinct populations or processes. Investigation should identify the physical source of the two modes (e.g., two machines, operators, or material batches). Fit a mixture model p \u00D7 \u03C6\u2081 + (1\u2212p) \u00D7 \u03C6\u2082 to estimate the mixing proportion and component parameters.', variantLabel: 'Bimodal Mixture' },
      { label: 'Right Skewed', description: 'The histogram peaks on the left side and has a long tail extending to the right. The mean is above the median. Right skew commonly arises from a natural lower bound, start-up effects, or reliability processes. Consider fitting a Weibull, lognormal, or gamma distribution.', variantLabel: 'Right Skewed' },
      { label: 'Left Skewed', description: 'The histogram peaks on the right side and has a long tail extending to the left. The mean is below the median. Less common than right skew, left skew occurs in failure-time data with wear-out mechanisms or processes approaching an upper bound.', variantLabel: 'Left Skewed' },
      { label: 'With Outlier', description: 'The main body of the histogram follows a recognizable pattern (often symmetric), but one or more bars appear isolated far from the bulk of the data. Outliers may indicate measurement errors, equipment failures, or genuine extreme events. Do not automatically discard outliers without investigation — a box plot provides a more sensitive outlier display.', variantLabel: 'With Outlier' },
    ],
  },

  'normal-probability-plot': {
    definition:
      'A normal probability plot displays the sorted data values on the vertical axis against the expected normal order statistics (theoretical quantiles) on the horizontal axis. If the data follow a normal distribution, the points fall approximately along a straight reference line, with departures from linearity indicating specific types of non-normality.',
    purpose:
      'Use a normal probability plot as the primary graphical tool for assessing whether a dataset is consistent with a normal distribution. Normality is a foundational assumption for many statistical procedures, including t-tests, ANOVA, regression inference, and capability analysis. The normal probability plot provides a more sensitive and detailed assessment than the histogram because it magnifies departures in the tails, which are the regions most consequential for statistical inference.',
    interpretation:
      'Points that follow the reference line closely indicate that the data are consistent with a normal distribution. For short-tailed distributions, the first few points depart above the fitted line and the last few points depart below it. For long-tailed distributions, this pattern is reversed: the first few points depart below the line and the last few depart above. Both short- and long-tailed data may also show an S-shaped pattern in the middle. Right-skewed data produce a concave (quadratic) pattern in which all points fall below a line connecting the first and last points; left-skewed data produce the mirror pattern with all points above. The correlation coefficient of the fitted line can be compared to a table of critical values to provide a formal test of normality.',
    assumptions:
      'The normal probability plot is a graphical technique and does not yield a formal p-value for normality. It is most effective for moderate to large sample sizes, as small samples may not produce a clear linear pattern even when drawn from a normal distribution. The plotting positions (theoretical quantiles) are typically computed using the Filliben, Hazen, or Blom formula, and the choice can slightly affect the visual impression for small samples. This implementation uses the Filliben approximation for uniform order statistic medians.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.21',
    questions: ['Are the data normally distributed?', 'What is the nature of the departure from normality (skewed, short tails, long tails)?'],
    importance: 'Normality is the most frequently tested distributional assumption in statistics. The normal probability plot is more sensitive than the histogram for detecting departures from normality because it magnifies tail behavior, which is exactly where non-normality has the greatest impact on statistical inference (confidence intervals, hypothesis tests, capability indices).',
    definitionExpanded: 'The ordered data values Y_{(1)} \u2264 Y_{(2)} \u2264 ... \u2264 Y_{(N)} are plotted on the vertical axis against the normal order statistic medians N_i = \u03a6\u207b\u00b9(U_i) on the horizontal axis, where U_i are the uniform order statistic medians computed via the Filliben approximation. If the data are normal, the points fall on a straight line whose slope estimates the standard deviation and whose intercept estimates the mean. The correlation coefficient of the fitted line can be compared to a table of critical values to provide a formal test of normality. The normal probability plot is a special case of the general probability plot, where the normal percent point function is replaced by the percent point function of any desired distribution.',
    caseStudySlugs: ['heat-flow-meter'],
    formulas: [
      {
        label: 'Uniform Order Statistic Medians (Filliben)',
        tex: String.raw`U_i = \begin{cases} 1 - U_n & i = 1 \\ \dfrac{i - 0.3175}{N + 0.365} & i = 2, \ldots, N{-}1 \\ 0.5^{1/N} & i = N \end{cases}`,
        explanation:
          'The Filliben approximation for uniform order statistic medians, which serve as the intermediate step in computing the normal order statistic medians.',
      },
      {
        label: 'Normal Order Statistic Medians',
        tex: String.raw`M_i = \Phi^{-1}(U_i)`,
        explanation:
          'The normal order statistic medians are obtained by applying the inverse standard normal CDF to the uniform order statistic medians. These serve as the horizontal axis values.',
      },
      {
        label: 'Parameter Estimates from Fitted Line',
        tex: String.raw`\hat{\sigma} = \text{slope}, \quad \hat{\mu} = \text{intercept}`,
        explanation:
          'When the data are normally distributed and the points fall on a straight line, the slope of the fitted line estimates the standard deviation and the intercept estimates the mean.',
      },
    ],
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt
from scipy import stats

rng = np.random.default_rng(42)

# Four NIST examples (1.3.3.21.1-4)
normal = rng.normal(0, 1, 200)

# Short tails: Tukey-Lambda (lambda=1.1)
u = rng.uniform(0.001, 0.999, 500)
lam = 1.1
short_tail = (u**lam - (1 - u)**lam) / lam

# Long tails: double exponential (Laplace)
long_tail = rng.laplace(0, 1, 500)

# Right skewed: lognormal
right_skew = rng.lognormal(0, 1, 200)

fig, axes = plt.subplots(2, 2, figsize=(10, 8))
datasets = [
    (normal, "Normal Data"),
    (short_tail, "Short-Tailed Data"),
    (long_tail, "Long-Tailed Data"),
    (right_skew, "Right Skewed Data"),
]

for ax, (data, title) in zip(axes.flat, datasets):
    res = stats.probplot(data, dist='norm', plot=ax)
    ax.set_title(title)
    ax.set_xlabel("Normal N(0,1) Order Statistic Medians")
    ax.set_ylabel("Ordered Response")
    ax.get_lines()[0].set_markerfacecolor('steelblue')
    ax.get_lines()[0].set_markeredgecolor('steelblue')

plt.suptitle("Normal Probability Plot (NIST 1.3.3.21)", y=1.02)
plt.tight_layout()
plt.show()`,
    examples: [
      { label: 'Normal Data', description: 'Points follow the reference line closely from end to end with only minor random scatter. The correlation coefficient of the fitted line is close to 1.0. This confirms that the normal distribution provides a good model for the data.', variantLabel: 'Normal' },
      { label: 'Short Tails', description: 'The middle of the data shows an S-shaped pattern. The first few points depart above the fitted line and the last few points depart below the fitted line. This indicates a distribution with shorter tails than the normal. A Tukey Lambda PPCC plot can help identify an appropriate distributional family.', variantLabel: 'Short Tails' },
      { label: 'Long Tails', description: 'The middle of the data may show a mild S-shaped pattern. The first few points depart below the fitted line and the last few points depart above the fitted line -- the opposite direction from the short-tailed case. This indicates a distribution with longer tails than the normal (e.g., double exponential). A Tukey Lambda PPCC plot can help identify an appropriate distributional family.', variantLabel: 'Long Tails' },
      { label: 'Right Skewed', description: 'Points show a strongly non-linear, concave pattern in which all points fall below a reference line drawn between the first and last points. This is the signature of a significantly right-skewed data set. A right-skewed distribution such as the Weibull or lognormal may be more appropriate.', variantLabel: 'Right Skewed' },
    ],
  },

  'probability-plot': {
    definition:
      'A probability plot is a graphical technique for assessing whether a dataset follows a specified theoretical distribution by plotting the ordered data values against the quantiles of the theoretical distribution. It generalizes the normal probability plot to any distributional family, including Weibull, lognormal, exponential, and others.',
    purpose:
      'Use a probability plot when evaluating whether data are consistent with a hypothesized distribution, a question that arises in reliability analysis, process capability studies, and statistical modeling. The probability plot is one of the most versatile graphical tools in statistics because it can assess fit to any continuous distribution, not just the normal. It also provides visual estimates of distribution parameters: the intercept and slope of the fitted line correspond to the location and scale parameters of the distribution.',
    interpretation:
      'If the data follow the hypothesized distribution, the points will fall approximately along a straight line. Systematic departures from the line indicate that the hypothesized distribution does not fit the data well. The nature of the departure provides diagnostic information: S-shaped departures suggest a different tail weight, concave or convex patterns suggest skewness mismatch, and clusters or gaps in the points suggest discreteness or contamination. For location-scale families, the fitted line directly provides parameter estimates, with the intercept estimating the location parameter and the slope estimating the scale parameter.',
    assumptions:
      'The probability plot requires that the analyst specify the family of distributions to evaluate. If the family is incorrect, the plot will show systematic departures regardless of parameter choices. Multiple probability plots for different families can be compared to find the best fit. The visual assessment should be supplemented with a quantitative goodness-of-fit test such as the Anderson-Darling test when a formal decision is needed.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.22',
    questions: ['Does a given distribution provide a good fit to the data?', 'What distribution best fits the data?', 'What are good estimates of the location and scale parameters?'],
    importance: 'Choosing the correct distributional model is essential for reliability prediction, process capability analysis, and simulation. The probability plot provides a visual goodness-of-fit assessment for any hypothesized distribution, making it the most versatile single tool for distribution identification. The slope and intercept of the fitted line directly estimate the distribution parameters.',
    definitionExpanded: 'The ordered response values are plotted on the vertical axis against order statistic medians for the hypothesized distribution on the horizontal axis. The order statistic medians are computed by applying the percent point function (inverse CDF) of the hypothesized distribution to the uniform order statistic medians. If the data follow the hypothesized distribution, the points form a straight line whose intercept and slope estimate the location and scale parameters. This technique generalizes to any distribution for which the percent point function can be computed. Comparing probability plots across several candidate distributions (normal, Weibull, lognormal, exponential, etc.) identifies the best-fitting family by selecting the one with the highest probability plot correlation coefficient.',
    caseStudySlugs: ['uniform-random-numbers'],
    formulas: [
      {
        label: 'Order Statistic Medians',
        tex: String.raw`N_i = G(U_i)`,
        explanation:
          'The order statistic medians for the hypothesized distribution are computed by applying the percent point function G (inverse CDF) to the uniform order statistic medians U_i. These form the horizontal axis of the probability plot.',
      },
      {
        label: 'Uniform Order Statistic Medians (Filliben)',
        tex: String.raw`U_i = \begin{cases} 1 - 0.5^{1/n} & i = 1 \\ \dfrac{i - 0.3175}{n + 0.365} & i = 2, \ldots, n{-}1 \\ 0.5^{1/n} & i = n \end{cases}`,
        explanation:
          'The Filliben approximation for the uniform order statistic medians. These probabilities are transformed through the percent point function of the hypothesized distribution to obtain the theoretical quantiles for the horizontal axis.',
      },
      {
        label: 'Probability Plot Correlation Coefficient',
        tex: String.raw`\text{PPCC} = \text{corr}\!\left(Y_{(i)},\; N_i\right)`,
        explanation:
          'The correlation between the ordered data values Y_(i) and the order statistic medians N_i. A PPCC close to 1.0 indicates the hypothesized distribution provides a good fit. Comparing PPCC values across distributions identifies the best-fitting family.',
      },
    ],
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt
from scipy import stats

# Generate Weibull-distributed sample data (shape=2, scale=1)
rng = np.random.default_rng(42)
data = rng.weibull(a=2.0, size=100)

# Compare probability plots for different distributions
fig, axes = plt.subplots(1, 3, figsize=(15, 5))

# Weibull probability plot (correct distribution)
res1 = stats.probplot(data, sparams=(2.0,),
                      dist='weibull_min', plot=axes[0])
axes[0].set_title("Weibull Prob Plot (Good Fit)")

# Normal probability plot (wrong distribution)
res2 = stats.probplot(data, dist='norm', plot=axes[1])
axes[1].set_title("Normal Prob Plot (Poor Fit)")

# Exponential probability plot (wrong distribution)
res3 = stats.probplot(data, dist='expon', plot=axes[2])
axes[2].set_title("Exponential Prob Plot (Poor Fit)")

for ax in axes:
    ax.set_xlabel("Theoretical Quantiles")
    ax.set_ylabel("Ordered Values")
    ax.get_lines()[0].set_markerfacecolor('steelblue')
    ax.get_lines()[0].set_markeredgecolor('steelblue')

plt.tight_layout()
plt.show()`,
    examples: [
      { label: 'Good Fit', description: 'Points follow the fitted line closely across the entire range, with only minor random scatter. The probability plot correlation coefficient is close to 1.0. The hypothesized distribution provides a good model for the data.' },
      { label: 'S-Shaped Departure', description: 'Points form an S-curve around the reference line, with systematic departures at both tails. This indicates the data have a different tail weight than the hypothesized distribution. Try a distribution with heavier or lighter tails.' },
      { label: 'Concave Departure', description: 'Points show a consistent concave curvature, bowing away from the reference line. This indicates a skewness mismatch — the data are more skewed than the hypothesized distribution. Try a more skewed distributional family.' },
    ],
  },

  'qq-plot': {
    definition:
      'A quantile-quantile (Q-Q) plot is a graphical technique for determining if two data sets come from populations with a common distribution. It plots the quantiles of one data set against the quantiles of another data set, with a $y = x$ reference line indicating identical distributions.',
    purpose:
      'Use a Q-Q plot when you have two data samples and want to determine whether they come from populations with the same distribution. The Q-Q plot can simultaneously detect differences in location, scale, symmetry, and tail behavior. For example, if the two data sets differ only by a shift in location, the points will lie along a straight line displaced from the $y = x$ reference line. The Q-Q plot provides more insight into the nature of distributional differences than analytical methods such as the chi-square or Kolmogorov-Smirnov 2-sample tests. It is similar to a probability plot, but in a probability plot one of the data samples is replaced with the quantiles of a theoretical distribution.',
    interpretation:
      'If the two distributions being compared are identical, the Q-Q plot points will fall on the $y = x$ identity line. A linear pattern with slope $\\neq 1$ indicates that the distributions have the same shape but different scales. A linear pattern shifted from the identity line indicates a location difference. Curvature in the Q-Q plot indicates a difference in distributional shape, such as one distribution being more skewed or heavy-tailed than the other. Departures at the extremes of the plot highlight differences in the tails, which may not be apparent from histograms alone. The Q-Q plot is particularly effective at detecting subtle tail differences that formal tests might miss.',
    assumptions:
      'The Q-Q plot assumes both datasets are drawn from continuous distributions. When comparing two samples, the sample sizes need not be equal; linear interpolation is used to match quantiles. The visual assessment is inherently subjective and should be accompanied by quantitative tests when formal decisions are required. For very small samples, the plot may show scatter around the reference line even when the distributions match.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.24',
    questions: ['Do two data sets come from populations with a common distribution?', 'Do two data sets have common location and scale?', 'Do two data sets have similar distributional shapes?', 'Do two data sets have similar tail behavior?'],
    importance: 'The Q-Q plot is the most powerful graphical tool for comparing two distributions because it is sensitive to differences in location, scale, and shape simultaneously. It is particularly effective at detecting subtle tail differences that histograms and summary statistics miss, making it essential for two-sample comparison and model validation.',
    definitionExpanded: 'For two-sample comparison, the quantiles of dataset 1 are plotted against the quantiles of dataset 2. If sample sizes differ, the quantiles of the smaller sample are plotted against linearly interpolated quantiles of the larger sample. If the distributions are identical, points fall on the $y = x$ identity line. A linear pattern with slope $\\neq 1$ indicates a scale difference; a linear pattern shifted from $y = x$ indicates a location difference. Curvature indicates a shape difference.',
    caseStudySlugs: ['ceramic-strength'],
    formulas: [
      {
        label: 'Quantile Matching',
        tex: String.raw`\text{Plot}\; Q_1(p_i) \;\text{vs}\; Q_2(p_i) \;\text{for percentiles}\; p_i`,
        explanation:
          'For two-sample comparison, the quantiles $Q_1(p_i)$ and $Q_2(p_i)$ of both datasets at matching cumulative probabilities $p_i$ are plotted against each other. If the distributions are identical, points fall on the $y = x$ identity line.',
      },
      {
        label: 'Hazen Plotting Position',
        tex: String.raw`p_i = \frac{i - 0.5}{N}`,
        explanation:
          'The Hazen plotting position assigns cumulative probability $p_i$ to the $i$-th ordered observation out of $N$ total. This symmetric formula avoids probabilities of exactly 0 or 1.',
      },
    ],
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt

# Generate two samples from different distributions
rng = np.random.default_rng(42)
sample1 = rng.normal(loc=50, scale=10, size=200)
sample2 = rng.normal(loc=55, scale=15, size=150)

# Compute quantiles at matching percentiles
n_quantiles = min(len(sample1), len(sample2))
probs = np.linspace(0, 1, n_quantiles + 2)[1:-1]
q1 = np.quantile(sample1, probs)
q2 = np.quantile(sample2, probs)

# Create Q-Q plot
fig, ax = plt.subplots(figsize=(8, 8))
ax.scatter(q1, q2, alpha=0.5, color='steelblue', s=15)
lims = [min(q1.min(), q2.min()), max(q1.max(), q2.max())]
ax.plot(lims, lims, 'r--', linewidth=1, label='y = x')
ax.set_xlabel("Sample 1 Quantiles")
ax.set_ylabel("Sample 2 Quantiles")
ax.set_title("Two-Sample Q-Q Plot")
ax.legend()
ax.set_aspect('equal')
plt.tight_layout()
plt.show()`,
  },
} as const;
