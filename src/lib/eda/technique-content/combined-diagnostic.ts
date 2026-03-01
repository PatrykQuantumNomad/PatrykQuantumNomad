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
      'Use a PPCC plot when the goal is to identify which member of a distribution family best fits the data, or to estimate the optimal value of a shape parameter. The technique is particularly powerful for the Tukey-Lambda family of distributions, where the shape parameter $\\lambda$ controls tail heaviness and the PPCC plot can distinguish between short-tailed, normal, and long-tailed distributions. It provides a data-driven method for distribution selection that is more systematic than visual inspection of multiple probability plots.',
    interpretation:
      'The horizontal axis shows the shape parameter value and the vertical axis shows the corresponding probability plot correlation coefficient. The peak of the curve identifies the optimal shape parameter, and the height of the peak indicates the overall goodness of fit. A high peak close to 1.0 indicates an excellent fit. For the Tukey-Lambda PPCC plot: $\\lambda \\approx -1$ corresponds to a Cauchy distribution, $\\lambda = 0$ corresponds to the logistic distribution, $\\lambda \\approx 0.14$ corresponds to the normal distribution, $\\lambda = 0.5$ yields a U-shaped distribution, and $\\lambda = 1$ is exactly uniform. If the optimal $\\lambda$ is less than 0.14, a long-tailed distribution such as the double exponential or logistic is a better choice; if greater than 0.14, a short-tailed distribution such as the beta or uniform is more appropriate. The width of the peak also carries information: a broad peak suggests the data are compatible with a range of distributions, while a narrow peak indicates strong evidence for a specific shape.',
    assumptions:
      'The PPCC plot assumes that the data are a random sample from a continuous distribution. It requires a distribution family parameterized by a shape parameter, which limits its applicability to families with such structure. The correlation coefficient as a goodness-of-fit measure is most sensitive to departures in the center of the distribution and somewhat less sensitive to tail behavior compared to formal tests like Anderson-Darling.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.23',
    questions: [
      'What is the best-fit member within a distributional family?',
      'Does the best-fit member provide a good fit?',
      'Does this distributional family provide a good fit compared to other distributions?',
      'How sensitive is the choice of the shape parameter?',
    ],
    importance:
      'The PPCC plot provides a systematic, quantitative method for selecting the best distribution from a parametric family. Rather than subjectively comparing multiple probability plots, the PPCC plot reduces distribution selection to finding a single peak, making the process both more efficient and more reproducible. However, when the peak is broad, multiple distributions may fit nearly equally well, and the analyst should use judgement when selecting among them. A recommended approach is to first perform a coarse search over a wide range of shape parameters, then refine the search around the peak to obtain a more precise estimate.',
    definitionExpanded:
      'For each candidate shape parameter $\\lambda$, a probability plot is constructed and the correlation between the ordered data and the theoretical quantiles is computed. The resulting $(\\lambda, \\text{correlation})$ pairs are plotted to form the PPCC curve. The $\\lambda$ at the peak gives the best-fit shape parameter, and the height of the peak gives the goodness-of-fit measure. For the Tukey-Lambda family: $\\lambda \\approx -1$ corresponds to Cauchy (very heavy-tailed), $\\lambda = 0$ is exactly logistic, $\\lambda \\approx 0.14$ corresponds to normal, $\\lambda = 0.5$ is U-shaped, and $\\lambda = 1$ is exactly uniform.',
    caseStudySlugs: ['normal-random-numbers'],
    formulas: [
      {
        label: 'Probability Plot Correlation Coefficient',
        tex: String.raw`\text{PPCC}(\lambda) = \operatorname{Corr}\!\bigl(X_{(i)},\; M_{(i)}(\lambda)\bigr)`,
        explanation:
          'The PPCC at shape parameter $\\lambda$ is the Pearson correlation between the ordered data $X_{(i)}$ and the theoretical quantiles $M_{(i)}$ from the candidate distribution. A value close to 1 indicates an excellent fit.',
      },
      {
        label: 'Optimal Shape Parameter',
        tex: String.raw`\hat{\lambda} = \underset{\lambda}{\arg\max}\;\text{PPCC}(\lambda)`,
        explanation:
          'The optimal shape parameter $\\hat{\\lambda}$ is the value of $\\lambda$ that maximizes the probability plot correlation coefficient. The PPCC curve is plotted across a range of $\\lambda$ values to visually identify this peak.',
      },
      {
        label: 'Tukey-Lambda Quantile Function',
        tex: String.raw`Q(p;\,\lambda) = \begin{cases} \dfrac{p^{\lambda} - (1-p)^{\lambda}}{\lambda} & \lambda \neq 0 \\[6pt] \ln\!\dfrac{p}{1-p} & \lambda = 0 \end{cases}`,
        explanation:
          'The percent point function of the Tukey-Lambda distribution. When $\\lambda = 0$ the quantile function reduces to the logistic distribution. The theoretical quantiles $M_{(i)}(\\lambda)$ are computed by applying this function to the Filliben uniform order statistic medians.',
      },
    ],
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt
from scipy.stats import ppcc_plot, tukeylambda

# Generate data from Tukey-Lambda distribution (lambda=-0.5, long-tailed)
rng = np.random.default_rng(42)
uniform_samples = rng.uniform(0.005, 0.995, size=200)
data = tukeylambda.ppf(uniform_samples, -0.5)

fig, ax = plt.subplots(figsize=(8, 5))
ppcc_plot(data, -2, 2, plot=ax)
ax.set_xlabel("Shape Parameter (lambda)")
ax.set_ylabel("Correlation Coefficient")
ax.set_title("PPCC Plot (Tukey-Lambda Family)")
plt.tight_layout()
plt.show()`,
  },

  'weibull-plot': {
    definition:
      'A Weibull plot is a probability plot specifically designed to assess whether data follow a Weibull distribution and to estimate the Weibull shape and scale parameters. The axes are scaled so that data from a Weibull distribution appear as a straight line, with the slope providing the shape parameter and the intercept providing the scale parameter.',
    purpose:
      'Use a Weibull plot primarily in reliability engineering and failure analysis, where the Weibull distribution is the standard model for time-to-failure data. The Weibull distribution is flexible enough to model decreasing failure rates (shape parameter less than 1, indicating infant mortality), constant failure rates (shape equal to 1, equivalent to the exponential distribution), and increasing failure rates (shape greater than 1, indicating wear-out). The Weibull plot provides simultaneous assessment of distributional fit and parameter estimation in a single graphical display.',
    interpretation:
      'The horizontal axis shows $\\log_{10}$ of the data values and the vertical axis shows the Weibull probability scale $\\ln(-\\ln(1-p))$. Points falling along a straight line indicate that the Weibull distribution is a good fit. The shape parameter $\\beta$ equals the reciprocal of the slope of the fitted line, and the scale parameter $\\eta$ can be read at the 63.2nd percentile where $\\ln(-\\ln(1-F)) = 0$. $\\beta < 1$ indicates a decreasing hazard rate (infant mortality), $\\beta = 1$ indicates a constant hazard rate (exponential), and $\\beta > 1$ indicates an increasing hazard rate (wear-out). Departures from linearity indicate that the Weibull model is not appropriate and an alternative distribution should be considered.',
    assumptions:
      'The Weibull plot assumes that all failure times are observed and come from a single failure mode. Censored data, where some units have not yet failed, require modified plotting positions. Mixed failure modes, where different components fail by different mechanisms, produce a curved or kinked Weibull plot and should be analyzed separately by failure mode. The visual parameter estimates from the plot are useful starting values but are less efficient than maximum likelihood estimates for formal inference.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.30',
    questions: [
      'Do the data follow a 2-parameter Weibull distribution?',
      'What is the best estimate of the shape parameter?',
      'What is the best estimate of the scale parameter?',
    ],
    importance:
      'The Weibull distribution is the standard model for reliability and failure analysis because it can represent decreasing, constant, or increasing failure rates through a single shape parameter. The Weibull plot provides simultaneous fit assessment and parameter estimation, making it the most important single tool in reliability engineering.',
    definitionExpanded:
      'The axes are linearized for the Weibull distribution using the transformation: horizontal axis = $\\log_{10}(t)$ where $t$ is the ordered data value (failure time), vertical axis = $\\ln(-\\ln(1 - F(t)))$ where $F(t)$ is the cumulative probability estimated by the plotting position. On these axes, data from a Weibull distribution fall on a straight line. The shape parameter $\\beta$ is the reciprocal of the slope of the fitted line ($\\beta < 1$: infant mortality, $\\beta = 1$: exponential/constant hazard, $\\beta > 1$: wear-out). The scale parameter $\\eta$ is the exponent of the intercept and can also be read at the 63.2nd percentile (where $\\ln(-\\ln(1 - 0.632)) = 0$).',
    caseStudySlugs: ['fatigue-life'],
    formulas: [
      {
        label: 'Weibull CDF Linearization',
        tex: String.raw`\ln\!\bigl(-\ln(1 - F(t))\bigr) = \beta\,\ln(t) - \beta\,\ln(\eta)`,
        explanation:
          'Taking the double logarithm of the Weibull CDF linearizes the relationship. In this form, beta multiplies ln(t) and the intercept is -beta ln(eta). The shape parameter beta is the reciprocal of the slope of the fitted line and the scale parameter eta is the exponent of the intercept.',
      },
      {
        label: 'Plotting Position (Benard\'s Approximation)',
        tex: String.raw`\hat{F}_i = \frac{i - 0.3}{N + 0.4}`,
        explanation:
          'Benard\'s median rank approximation estimates the cumulative probability for the i-th ordered observation out of N total. It provides a less biased estimate than the simple i/N formula.',
      },
    ],
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt
from scipy.stats import probplot, weibull_min

# Generate Weibull-distributed failure times (shape=1.5, scale=100)
rng = np.random.default_rng(42)
shape = 1.5
data = weibull_min.ppf(rng.uniform(0.01, 0.99, size=50), shape, scale=100)

fig, ax = plt.subplots(figsize=(8, 5))
res = probplot(data, dist=weibull_min, sparams=(shape,), plot=ax)
ax.set_xlabel("Theoretical Quantiles (Weibull)")
ax.set_ylabel("Ordered Data")
ax.set_title("Weibull Probability Plot")
plt.tight_layout()
plt.show()`,
  },

  '4-plot': {
    definition:
      'The 4-plot is a composite diagnostic display that combines four graphical panels into a single figure: a run-sequence plot, a lag plot, a histogram, and a normal probability plot. Each panel tests one of the four underlying assumptions of a univariate measurement process: fixed location, fixed variation, randomness, and distributional form.',
    purpose:
      'Use the 4-plot as a comprehensive screening tool to simultaneously check all four assumptions that underlie most univariate statistical analyses. Rather than examining each assumption separately, the 4-plot provides a single-page summary that reveals whether the data are suitable for standard statistical methods. It is the recommended starting point in the NIST/SEMATECH handbook for univariate process characterization and is particularly valuable during initial data exploration before committing to specific modeling or testing approaches.',
    interpretation:
      'The run-sequence plot (upper left) plots $Y_i$ vs run order $i$ and checks for fixed location and fixed variation over time: a horizontal band of points with constant spread indicates stability. The lag plot (upper right) plots $Y_i$ vs $Y_{i-1}$ and checks for randomness: a structureless cloud indicates independence, while any pattern indicates serial correlation. The histogram (lower left) provides a visual summary of the distributional shape, center, and spread, and flags potential outliers or multimodality. The normal probability plot (lower right) plots ordered $Y_i$ against theoretical $N(0,1)$ quantiles and specifically assesses normality: points along the reference line indicate a normal distribution. When all four panels show ideal patterns, the analyst can proceed with standard methods. When any panel shows departures, the nature of the departure guides the choice of alternative methods.',
    assumptions:
      'The 4-plot requires time-ordered data for the run-sequence and lag plot panels to be meaningful. If the data do not have a natural time ordering, only the histogram and probability plot panels are interpretable. The 4-plot is a screening tool, not a definitive test, and unusual patterns should be investigated with more specialized techniques.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.32',
    questions: [
      'Is the process in-control, stable, and predictable?',
      'Is the process drifting with respect to location?',
      'Is the process drifting with respect to variation?',
      'Are the data random?',
      'Is an observation related to an adjacent observation?',
      'If the data are a time series, is it white noise?',
      'If not white noise, is it sinusoidal, autoregressive, etc.?',
      'If the data are non-random, what is a better model?',
      'Does the process follow a normal distribution?',
      'If non-normal, what distribution does the process follow?',
      'Is the underlying model $Y_i = A_0 + E_i$ valid and sufficient?',
      'If the default model is insufficient, what is a better model?',
      'Is the formula $s/\\sqrt{N}$ valid for computing the uncertainty of the mean?',
      'Is the sample mean a good estimator of the process location?',
      'If not, what would be a better estimator?',
      'Are there any outliers?',
    ],
    importance:
      'The 4-plot is the universal first-step diagnostic for any univariate measurement process. It simultaneously tests all four foundational assumptions (fixed location, fixed variation, randomness, and distributional form) in a single display. If any panel shows a problem, the analyst knows immediately which assumption is violated and can choose appropriate corrective methods before proceeding with analysis.',
    definitionExpanded:
      'The four panels occupy a $2 \\times 2$ grid. Upper-left: run-sequence plot ($Y_i$ vs run order $i$) tests fixed location and fixed variation. Upper-right: lag plot ($Y_i$ vs $Y_{i-1}$) tests randomness and detects serial correlation. Lower-left: histogram tests distributional shape, modality, and symmetry. Lower-right: normal probability plot specifically tests for normality. Together, these four panels answer: is the process stable, is it random, and what does the distribution look like? The 4-plot also applies to residuals from fitted models $Y_i = f(X_1, \\ldots, X_k) + E_i$, making it useful beyond simple univariate analysis.',
    caseStudySlugs: [
      'normal-random-numbers',
      'uniform-random-numbers',
      'random-walk',
      'cryothermometry',
      'beam-deflections',
      'filter-transmittance',
      'standard-resistor',
      'heat-flow-meter',
    ],
    examples: [
      {
        label: 'Ideal Process',
        description:
          'Run-sequence plot shows a stable horizontal band. Lag plot shows a structureless cloud. Histogram is bell-shaped. Normal probability plot follows the reference line. All four assumptions are satisfied \u2014 the process is stable, random, and normally distributed.',
      },
      {
        label: 'Trending Process',
        description:
          'Run-sequence plot shows a clear upward or downward drift. Lag plot shows a tight diagonal band. Histogram may appear normal but the time-dependence makes summary statistics misleading. The trend must be modeled or removed before further analysis.',
      },
      {
        label: 'Non-Normal Process',
        description:
          'Run-sequence plot and lag plot appear normal (stable, random), but the histogram is skewed and the normal probability plot curves away from the reference line. The process is in control but a normal-theory analysis would give incorrect confidence intervals.',
      },
    ],
    formulas: [
      {
        label: '4-Plot Diagnostic Ensemble',
        tex: String.raw`\text{4-Plot} = \begin{bmatrix} Y_i \text{ vs } i & Y_i \text{ vs } Y_{i-1} \\ \text{Histogram}(Y) & \text{Normal Prob. Plot}(Y) \end{bmatrix}`,
        explanation:
          'The 4-plot combines four panels in a $2 \\times 2$ grid: run-sequence plot ($Y_i$ vs $i$, tests fixed location and variation), lag plot ($Y_i$ vs $Y_{i-1}$, tests randomness), histogram (shows distributional shape), and normal probability plot (ordered $Y_i$ vs $N(0,1)$ quantiles, tests normality).',
      },
    ],
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt
from scipy.stats import probplot

# Generate sample data from a normal process
rng = np.random.default_rng(42)
n = 200
data = rng.normal(loc=10, scale=2, size=n)

fig, axes = plt.subplots(2, 2, figsize=(10, 8))

# Panel 1: Run sequence plot
axes[0, 0].plot(range(1, n + 1), data, "o", markersize=2)
axes[0, 0].axhline(y=np.mean(data), color="r", linestyle="--")
axes[0, 0].set_xlabel("Run Order")
axes[0, 0].set_ylabel("Response")
axes[0, 0].set_title("Run Sequence Plot")

# Panel 2: Lag plot
axes[0, 1].scatter(data[:-1], data[1:], alpha=0.5, s=10)
axes[0, 1].set_xlabel("Y(i-1)")
axes[0, 1].set_ylabel("Y(i)")
axes[0, 1].set_title("Lag Plot")

# Panel 3: Histogram
axes[1, 0].hist(data, bins=20, density=True, edgecolor="black")
axes[1, 0].set_xlabel("Value")
axes[1, 0].set_ylabel("Density")
axes[1, 0].set_title("Histogram")

# Panel 4: Normal probability plot
probplot(data, plot=axes[1, 1])
axes[1, 1].set_title("Normal Probability Plot")

fig.suptitle("4-Plot Diagnostic", fontsize=14)
plt.tight_layout()
plt.show()`,
  },
} as const;
