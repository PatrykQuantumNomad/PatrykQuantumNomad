/**
 * Technique content for time-series analysis techniques.
 *
 * Techniques: autocorrelation-plot, complex-demodulation, lag-plot,
 * run-sequence-plot, spectral-plot
 */

import type { TechniqueContent } from './types';

export const TIME_SERIES_CONTENT: Record<string, TechniqueContent> = {
  'autocorrelation-plot': {
    definition:
      'An autocorrelation plot displays the sample autocorrelation function of a dataset as a function of the lag. Each vertical bar in the plot represents the correlation between pairs of observations separated by that lag interval, providing a compact view of serial dependence across all relevant time offsets.',
    purpose:
      'Use an autocorrelation plot when analyzing time-ordered data to determine whether successive observations are statistically independent. It is essential for validating the randomness assumption underlying many statistical procedures, including control charts, capability studies, and regression models. The plot is also used in the model identification stage for Box-Jenkins time series modeling. After fitting a model, the plot helps verify that residuals behave as white noise rather than retaining unexplained temporal structure.',
    interpretation:
      'The horizontal axis shows the lag value and the vertical axis shows the autocorrelation coefficient, which ranges from $-1$ to $+1$. A pair of horizontal reference lines, typically drawn at $\\pm\\,1.96/\\sqrt{N}$, marks the 95 percent significance bounds. For truly random data, approximately 95 percent of the autocorrelation values should fall within these bounds. The key diagnostic is the decay pattern of the autocorrelation function. Strong autocorrelation shows a lag-1 value near 1.0 with a smooth, nearly linear decline that crosses zero into negative values — the decreasing autocorrelation has little noise and provides high predictability. Moderate autocorrelation shows a lag-1 value around 0.75 with a gradual but noisier decline that reaches the significance bounds sooner. Both patterns indicate an autoregressive process where the recommended model is $Y_i = A_0 + A_1 Y_{i-1} + E_i$. A sinusoidal pattern — alternating positive and negative spikes that do not decay toward zero — indicates periodic behavior in the data.',
    assumptions:
      'The autocorrelation plot assumes the data are uniformly spaced in time or sequence order. It requires a reasonably large sample size, typically at least 50 observations, to produce reliable estimates at moderate lags. The significance bounds assume normality and independence under the null hypothesis, so they serve as approximate guides rather than exact critical values. Note that autocorrelation measures only linear dependence; data with zero autocorrelation at all lags may still be non-random (e.g., non-linear dependence).',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.1',
    questions: [
      'Are the data random?',
      'Is an observation related to adjacent observations?',
      'Is the time series white noise, sinusoidal, or autoregressive?',
      'What model best fits the observed time series?',
      'Is the simple constant-plus-error model valid?',
      'Is the standard error formula for sample means applicable?',
    ],
    importance:
      'Randomness is one of the critical assumptions underlying the validity of engineering conclusions drawn from data. Most standard statistical tests depend on it, and common formulas such as the standard error of the mean $s/\\sqrt{N}$ become unreliable when serial dependence is present. Without randomness, the default univariate model $Y = \\text{constant} + \\text{error}$ breaks down, making parameter estimates and derived confidence intervals, control charts, and capability indices suspect. The autocorrelation plot is the primary tool for detecting this violation before flawed statistics lead to unsound engineering decisions.',
    definitionExpanded:
      'The vertical axis shows the autocorrelation coefficient, which normalizes the autocovariance at each lag by the variance. Horizontal reference lines mark the 95% significance bounds under the null hypothesis of white noise. The autocorrelation at lag 0 is always 1 by definition. See the formulas below for the precise definitions.',
    caseStudySlugs: ['beam-deflections'],
    examples: [
      {
        label: 'White Noise',
        description:
          'All autocorrelation values fall within the 95% confidence bands, with no significant spikes at any lag. This is the signature of purely random data where each observation is independent of all others and there is no ability to predict the next value from the current one. With a 95% confidence interval, roughly one in twenty lags may still fall outside the bounds due to random fluctuations alone, so an isolated spike is not cause for concern. The constant-plus-error model $Y = c + e$ is appropriate.',
        variantLabel: 'White Noise',
      },
      {
        label: 'Strong Autocorrelation',
        description:
          'The autocorrelation at lag 1 is high (only slightly less than 1) and declines slowly in a smooth, nearly linear fashion with little noise. The decay continues past zero into negative autocorrelation at higher lags. This pattern is the autocorrelation plot signature of strong autocorrelation, which provides high predictability if modeled properly. The recommended next step is to fit the autoregressive model $Y_i = A_0 + A_1 \\cdot Y_{i-1} + E_i$ using least squares or Box-Jenkins methods, then verify that the residuals are random. The residual standard deviation for this autoregressive model will be much smaller than the residual standard deviation for the default constant model.',
        variantLabel: 'Strong Autocorrelation',
      },
      {
        label: 'Moderate Autocorrelation',
        description:
          'The autocorrelation at lag 1 is moderately high (approximately 0.75) and decreases gradually over successive lags. The decay is generally linear but with significant noise — the bars are visibly jagged compared to the smooth decline of strong autocorrelation. This pattern indicates data with moderate serial dependence, providing moderate predictability if modeled properly. The same autoregressive model $Y_i = A_0 + A_1 \\cdot Y_{i-1} + E_i$ applies, but the initial spike is smaller and the decay is faster, reaching the significance bounds sooner than in the strong case.',
        variantLabel: 'Moderate Autocorrelation',
      },
      {
        label: 'Sinusoidal Model',
        description:
          'Sinusoidal models produce oscillating autocorrelation values that repeat at regular lag intervals. The alternating positive and negative spikes fail to decay toward zero. This non-decaying behavior is the key signature that distinguishes periodic data from an autoregressive process, where oscillations would diminish over successive lags. The spacing of the peaks reveals the period, and the amplitude of the oscillation indicates the strength of the cyclic component.',
        variantLabel: 'Sinusoidal Model',
      },
    ],
    formulas: [
      {
        label: 'Autocorrelation Coefficient',
        tex: String.raw`R_h = \frac{C_h}{C_0}`,
        explanation:
          'The autocorrelation at lag h is the autocovariance at lag h divided by the variance (autocovariance at lag 0), giving a value between -1 and +1.',
      },
      {
        label: 'Lag-Zero Identity',
        tex: String.raw`R_0 = \frac{C_0}{C_0} = 1`,
        explanation:
          'The autocorrelation at lag 0 is always 1 by definition, since the autocovariance at lag 0 equals the variance.',
      },
      {
        label: 'Autocovariance Function',
        tex: String.raw`C_h = \frac{1}{N}\sum_{t=1}^{N-h}(Y_t - \bar{Y})(Y_{t+h} - \bar{Y})`,
        explanation:
          'The autocovariance at lag h measures the average product of deviations from the mean for observations separated by h time steps.',
      },     
      {
        label: '95% Significance Bounds',
        tex: String.raw`\pm\,\frac{1.96}{\sqrt{N}}`,
        explanation:
          'Under the null hypothesis of white noise, approximately 95% of autocorrelation values should fall within these bounds. Uses 1.96/sqrt(N) as the exact 95% critical value.',
      },
    ],
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt
from statsmodels.graphics.tsaplots import plot_acf

# Generate AR(1) data: Y_t = 0.7 * Y_{t-1} + e_t
rng = np.random.default_rng(42)
n = 200
y = np.zeros(n)
for t in range(1, n):
    y[t] = 0.7 * y[t - 1] + rng.standard_normal()

fig, ax = plt.subplots(figsize=(8, 4))
plot_acf(y, lags=40, ax=ax, title="Autocorrelation Plot (AR(1) Process)")
ax.set_xlabel("Lag")
ax.set_ylabel("Autocorrelation")
plt.tight_layout()
plt.show()`,
  },

  'complex-demodulation': {
    definition:
      'Complex demodulation (Granger, 1964) is a time-series analysis technique that extracts the time-varying amplitude and phase of a sinusoidal component at a specified frequency. It produces two companion plots: an amplitude plot showing how the strength of the cyclic component changes over time, and a phase plot used to improve the estimate of the frequency in the sinusoidal model.',
    purpose:
      'The amplitude plot is used to determine if the assumption of constant amplitude in the sinusoidal model is justifiable. If the amplitude changes over time, the constant $\\alpha$ should be replaced with a time-varying model such as a linear fit ($B_0 + B_1 t$) or quadratic fit. The phase plot is used to improve the estimate of the frequency $\\omega$: if the phase plot shows lines sloping from left to right, the frequency estimate should be increased; if lines slope right to left, it should be decreased; if the slope is essentially zero, the frequency estimate does not need to be modified.',
    interpretation:
      'In the amplitude plot, the vertical axis shows the estimated amplitude as a function of time. A flat amplitude trace indicates a stationary cyclic component with constant $\\alpha$, while trends or abrupt changes indicate that $\\alpha$ varies with time and the model should be updated accordingly. In the phase plot, the vertical axis shows the phase angle as a function of time. Lines sloping from left to right indicate that the demodulation frequency should be increased. Lines sloping from right to left indicate the frequency should be decreased. An essentially flat phase trace confirms that the specified demodulation frequency is correct.',
    assumptions:
      'Complex demodulation requires specifying the target frequency in advance, which typically comes from a preliminary spectral plot. It assumes the signal can be approximated by a sinusoidal model at the chosen frequency, and it uses a low-pass filter whose bandwidth must be selected to balance smoothing and time resolution. The mathematical computations for determining the amplitude and phase are detailed in Granger (1964).',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Sections 1.3.3.8-9',
    questions: [
      'Does the amplitude change over time?',
      'Are there any outliers that need to be investigated?',
      'Is the amplitude different at the beginning of the series (start-up effect)?',
      'Is the specified demodulation frequency correct?',
    ],
    importance:
      'In the sinusoidal model $Y_i = C + \\alpha\\sin(2\\pi\\omega t_i + \\phi) + E_i$, the amplitude $\\alpha$ is assumed constant. The amplitude plot checks whether this assumption is reasonable; if not, $\\alpha$ should be replaced with a time-varying model. The non-linear fitting for the sinusoidal model is usually quite sensitive to the choice of good starting values. The initial estimate of $\\omega$ is obtained from a spectral plot, and the phase plot assesses whether this estimate is adequate. Using the phase plot together with the spectral plot can significantly improve the quality of the non-linear fits obtained.',
    definitionExpanded:
      'The underlying sinusoidal model is $Y_i = C + \\alpha\\sin(2\\pi\\omega t_i + \\phi) + E_i$, where $\\alpha$ is the amplitude, $\\phi$ is the phase shift, and $\\omega$ is the dominant frequency. In this model $\\alpha$ and $\\phi$ are assumed constant. The amplitude plot displays estimated amplitude vs. time, and the phase plot displays phase angle vs. time. If the amplitude is not constant, the model is typically replaced with $Y_i = C + (B_0 + B_1 t_i)\\sin(2\\pi\\omega t_i + \\phi) + E_i$, where the amplitude varies linearly with time. Quadratic amplitude models are sometimes used; higher order models are relatively rare.',
    formulas: [
      {
        label: 'Sinusoidal Model (Constant Amplitude)',
        tex: String.raw`Y_i = C + \alpha\sin(2\pi\omega\, t_i + \phi) + E_i`,
        explanation:
          'The standard sinusoidal time series model where alpha is the amplitude, phi is the phase shift, omega is the dominant frequency, C is a constant, and E_i is the error term. Both alpha and phi are assumed constant over time.',
      },
      {
        label: 'Time-Varying Amplitude Model',
        tex: String.raw`Y_i = C + (B_0 + B_1\, t_i)\sin(2\pi\omega\, t_i + \phi) + E_i`,
        explanation:
          'When the amplitude plot shows that alpha is not constant, it is replaced by a linear function of time. This is the most common replacement; quadratic models are sometimes used, but higher order models are relatively rare.',
      },
    ],
    caseStudySlugs: ['beam-deflections'],
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt

# LEW.DAT — beam deflection data (NIST Section 1.4.2.5)
# True dominant frequency ≈ 0.3026 cycles/observation.
lew = np.array([
    -213, -564,  -35,  -15,  141,  115, -420, -360,  203, -338,
    -431,  194, -220, -513,  154, -125, -559,   92,  -21, -579,
     -52,   99, -543, -175,  162, -457, -346,  204, -300, -474,
     164, -107, -572,   -8,   83, -541, -224,  180, -420, -374,
     201, -236, -531,   83,   27, -564, -112,  131, -507, -254,
     199, -311, -495,  143,  -46, -579,  -90,  136, -472, -338,
     202, -287, -477,  169, -124, -568,   17,   48, -568, -135,
     162, -430, -422,  172,  -74, -577,  -13,   92, -534, -243,
     194, -355, -465,  156,  -81, -578,  -64,  139, -449, -384,
     193, -198, -538,  110,  -44, -577,   -6,   66, -552, -164,
], dtype=float)
n = len(lew)
filter_hw = 30  # moving-average half-width

def demodulate(data, freq, hw):
    """Complex demodulation at a given frequency."""
    t = np.arange(len(data))
    kernel = np.ones(2 * hw + 1) / (2 * hw + 1)
    re = np.convolve(data * np.cos(2 * np.pi * freq * t), kernel, mode="same")
    im = np.convolve(data * np.sin(2 * np.pi * freq * t), kernel, mode="same")
    return re, im

# Amplitude: use correct frequency (0.3025) for stable envelope
re_a, im_a = demodulate(lew, 0.3025, filter_hw)
amplitude = 2 * np.sqrt(re_a**2 + im_a**2)

# Phase: use wrong frequency (0.28) to show sawtooth drift
re_p, im_p = demodulate(lew, 0.28, filter_hw)
phase = np.arctan2(im_p, re_p)  # wrapped radians

# Trim edge points where the moving average has partial windows
trim = slice(filter_hw, n - filter_hw)
t = np.arange(n)

fig, axes = plt.subplots(2, 1, figsize=(10, 6))
axes[0].plot(t, amplitude)
axes[0].set_ylabel("Estimated Amplitude")
axes[0].set_title("Complex Demodulation Amplitude Plot (freq = 0.3025)")

axes[1].scatter(t[trim], phase[trim], s=12, marker="x", color="k")
axes[1].set_xlabel("Time")
axes[1].set_ylabel("Estimated Phase")
axes[1].set_title("Complex Demodulation Phase Plot (freq = 0.28)")
plt.tight_layout()
plt.show()`,
  },

  'lag-plot': {
    definition:
      'A lag plot is a scatter plot that checks whether a dataset or time series is random. For a lag of k, each point is plotted as ($Y_{i-k}$, $Y_i$), where the horizontal axis shows the lagged value and the vertical axis shows the current value. The most commonly used lag is 1. Random data should not exhibit any identifiable structure; non-random structure indicates that the underlying data are not random.',
    purpose:
      'Use a lag plot as a simple and powerful diagnostic for detecting non-randomness in time series data. It complements the autocorrelation plot by providing a direct visual impression of how successive observations are related. The lag plot is particularly useful for detecting non-linear dependencies that might not be captured by linear autocorrelation, such as clustered or oscillating patterns. Inasmuch as randomness is an underlying assumption for most statistical estimation and testing techniques, the lag plot should be a routine tool for researchers.',
    interpretation:
      'For random data, the lag plot appears as a structureless cloud of points with no discernible pattern, indicating that knowing the current value $Y_{i-1}$ provides no information about the next value $Y_i$. A strong positive linear pattern along the diagonal indicates positive autocorrelation, meaning high values tend to follow high values and low values follow low values. Moderate autocorrelation produces a noisy elliptical cluster along the diagonal with a restricted but still wide range of possible next values. Strong autocorrelation produces a tight linear band along the diagonal, making prediction possible from one observation to the next. A tight elliptical or circular loop pattern indicates a sinusoidal model. The lag plot is also valuable for outlier detection: each data point appears twice in a lag-1 plot (once as $Y_i$ and once as $Y_{i-1}$), so apparent outliers in the lag plot can be traced back to specific data points in the original sequence.',
    assumptions:
      'The lag plot requires that the data be recorded in the order of collection. It is most effective at lag 1 for detecting first-order dependence, though lag plots can be generated for any arbitrary lag to explore more complex patterns. The visual assessment is qualitative and should be supported by quantitative tests such as the autocorrelation coefficient or the runs test.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.15',
    questions: [
      'Are the data random?',
      'Is there serial correlation in the data?',
      'What is a suitable model for the data?',
      'Are there outliers in the data?',
    ],
    importance:
      'The lag plot provides an instant visual diagnostic for randomness that requires no distributional assumptions. A single glance reveals whether successive observations are independent, which is critical because non-independence invalidates standard error formulas, makes confidence intervals too narrow, and causes control charts to generate false alarms. When the lag plot reveals autocorrelation, the next step is to estimate the parameters for an autoregressive model $Y_i = A_0 + A_1 Y_{i-1} + E_i$ using linear regression directly from the lag plot axes.',
    definitionExpanded:
      'The horizontal axis shows $Y_{i-1}$ and the vertical axis shows $Y_i$ for lag 1. Each point represents two successive observations. The plot exploits the human eye\'s pattern recognition: random data produce a structureless "shotgun" cloud, while any departure from randomness produces a recognizable geometric shape. Since the axes are exactly $Y_{i-1}$ and $Y_i$, an autoregressive fit can be performed as a linear regression directly from the lag plot.',
    caseStudySlugs: ['beam-deflections'],
    examples: [
      {
        label: 'Random Data',
        description:
          'A structureless, circular cloud of points centered on the plot with no discernible pattern — a "shotgun" pattern. One cannot infer from a current value $Y_{i-1}$ the next value $Y_i$. For example, a given value on the horizontal axis corresponds to virtually any value on the vertical axis. Such non-association is the essence of randomness.',
        variantLabel: 'Random',
      },
      {
        label: 'Moderate Autocorrelation',
        description:
          'Points cluster noisily along the diagonal, forming an elongated ellipse. This is the lag plot signature of moderate positive autocorrelation. For a known current value $Y_{i-1}$, the range of possible next values $Y_i$ is restricted but still broad, suggesting that prediction via an autoregressive model is possible but imprecise.',
        variantLabel: 'Moderate Autocorrelation',
      },
      {
        label: 'Strong Autocorrelation',
        description:
          'Points form a tight linear band along the diagonal, indicating strong positive autocorrelation. If you know $Y_{i-1}$ you can make a strong guess as to what $Y_i$ will be. The recommended next step is to fit the autoregressive model $Y_i = A_0 + A_1 Y_{i-1} + E_i$ using linear regression directly from the lag plot.',
        variantLabel: 'Strong Autocorrelation',
      },
      {
        label: 'Sinusoidal',
        description:
          'Points form a tight elliptical loop, the lag plot signature of a single-cycle sinusoidal model. The lag plot also reveals outliers: points lying off the ellipse indicate suspect data values. Each raw data point appears twice in the lag plot (once as $Y_i$ and once as $Y_{i-1}$), so apparent outlier pairs can be traced back to a single faulty observation.',
        variantLabel: 'Sinusoidal',
      },
    ],
    formulas: [
      {
        label: 'Autoregressive Model',
        tex: String.raw`Y_i = A_0 + A_1\, Y_{i-1} + E_i`,
        explanation:
          'When the lag plot reveals autocorrelation, this model is fit using linear regression directly from the lag plot axes. The residual standard deviation will be much smaller than for the default constant model.',
      },
      {
        label: 'Default (Constant) Model',
        tex: String.raw`Y_i = A_0 + E_i`,
        explanation:
          'The null model assumes each observation is a constant plus random error. When autocorrelation is present, this model is inadequate and the autoregressive model above should be used.',
      },
      {
        label: 'Sinusoidal Model',
        tex: String.raw`Y_i = C + \alpha\sin(2\pi\omega\, t_i + \phi) + E_i`,
        explanation:
          'When the lag plot shows an elliptical loop, a sinusoidal model is appropriate. Alpha is the amplitude, omega is the frequency (between 0 and 0.5 cycles per observation), and phi is the phase.',
      },
    ],
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt

# Generate AR(1) data to show serial dependence
rng = np.random.default_rng(42)
n = 200
y = np.zeros(n)
for t in range(1, n):
    y[t] = 0.7 * y[t - 1] + rng.standard_normal()

lag = 1
fig, ax = plt.subplots(figsize=(6, 6))
ax.scatter(y[:-lag], y[lag:], alpha=0.5, edgecolors="k", linewidths=0.5)
ax.set_xlabel(r"$Y_{i-1}$")
ax.set_ylabel(r"$Y_i$")
ax.set_title("Lag Plot (lag = 1)")
ax.set_aspect("equal")
plt.tight_layout()
plt.show()`,
  },

  'run-sequence-plot': {
    definition:
      'A run-sequence plot, also called a run chart, displays the measured values in the order they were collected, with the horizontal axis representing the run order or time index and the vertical axis representing the response. It is the simplest and most direct graphical diagnostic for time-ordered data.',
    purpose:
      'Use a run-sequence plot as the first step in analyzing any time-ordered dataset to detect shifts in location, changes in spread, drifts, trends, and oscillations. It addresses the fundamental question of whether the process is stable over time, which is a prerequisite for meaningful statistical analysis. The run-sequence plot is one of the four panels in the standard 4-plot diagnostic and is often the single most informative plot for process data.',
    interpretation:
      'For a stable process, the run-sequence plot shows a horizontal band of points scattered randomly around a constant mean, with no visible patterns, trends, or shifts. An upward or downward trend indicates systematic drift in the process. A sudden jump in the level of the data indicates a shift event, such as a tool change, batch change, or environmental disturbance. Increasing or decreasing spread over time indicates non-constant variability. A recurring oscillatory pattern suggests a periodic influence such as temperature cycling, operator rotation, or seasonal effects. The run-sequence plot is intentionally simple so that any departures from randomness are immediately visible.',
    assumptions:
      'The run-sequence plot requires that the data be recorded in the order of collection. It makes no distributional assumptions and is appropriate for any measurement data. The plot is purely visual and does not provide formal tests; it should be complemented with quantitative methods such as the runs test, CUSUM chart, or control chart when formal change detection is needed.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.25',
    questions: [
      'Are there any shifts in location?',
      'Are there any shifts in variation?',
      'Are there any outliers?',
    ],
    importance:
      'The run-sequence plot is the single most important first step in any time-ordered data analysis. If the process is not stable (fixed location, fixed variation), then summary statistics like the mean and standard deviation do not characterize a single, well-defined process. Process instability must be identified and addressed before meaningful statistical analysis can proceed.',
    definitionExpanded:
      'The horizontal axis shows run order index (1, 2, ..., N) and the vertical axis shows the measured response value. No smoothing or modeling is applied. The plot is intentionally raw so that any patterns -- trends, shifts, cycles, or outliers -- are visible without being obscured by statistical processing. A horizontal reference line at the overall mean is often included.',
    caseStudySlugs: ['filter-transmittance'],
    examples: [
      {
        label: 'Stable Process',
        description:
          'Data points scatter randomly within a horizontal band of constant width around the mean, with no visible trends, shifts, or patterns. This indicates a process with fixed location and fixed variation, suitable for standard statistical analysis.',
      },
      {
        label: 'Location Shift',
        description:
          'An abrupt jump in the level of the data partway through the sequence, where the mean before and after the shift are visibly different. Common causes include tool changes, batch changes, or environmental disturbances.',
      },
      {
        label: 'Trend',
        description:
          'A gradual upward or downward drift in the data over the observation period, indicating that the process mean is not constant. This can result from tool wear, temperature drift, or material degradation.',
      },
    ],
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt

# Generate normal data with constant mean and variance
rng = np.random.default_rng(42)
n = 100
data = rng.normal(loc=50, scale=5, size=n)

fig, ax = plt.subplots(figsize=(8, 4))
ax.plot(range(1, n + 1), data, "o-", markersize=3, linewidth=0.8)
ax.axhline(y=np.mean(data), color="r", linestyle="--", label="Mean")
ax.set_xlabel("Run Order")
ax.set_ylabel("Response")
ax.set_title("Run Sequence Plot")
ax.legend()
plt.tight_layout()
plt.show()`,
  },

  'spectral-plot': {
    definition:
      'A spectral plot is a graphical technique for examining cyclic structure in the frequency domain. It is a smoothed Fourier transform of the autocovariance function. The frequency is measured in cycles per unit time where unit time is defined to be the distance between two points. A frequency of 0 corresponds to an infinite cycle while a frequency of 0.5 corresponds to a cycle of 2 data points. Equi-spaced time series are inherently limited to detecting frequencies between 0 and 0.5.',
    purpose:
      'Use a spectral plot when the goal is to identify dominant frequencies, periodicities, or cyclic patterns in time series data. Trends should typically be removed from the time series before applying the spectral plot. Trends can be detected from a run sequence plot and are typically removed by differencing the series or by fitting a straight line and applying the spectral analysis to the residuals. Spectral plots are often used to find a starting value for the frequency in the sinusoidal model $Y_i = C + \\alpha\\sin(2\\pi\\omega t_i + \\phi) + E_i$.',
    interpretation:
      'The horizontal axis represents frequency in cycles per observation and the vertical axis represents smoothed variance (power). Sharp peaks in the spectral plot indicate dominant periodic components at those frequencies. The frequency of a peak can be converted to a period by taking its reciprocal. A flat spectrum indicates white noise with equal power at all frequencies, consistent with random data. A spectrum that starts with a dominant peak near zero and decays rapidly indicates strong positive autocorrelation where an autoregressive model is appropriate. A single sharp peak at a non-zero frequency indicates an underlying sinusoidal model.',
    assumptions:
      'Trends should be removed before applying spectral analysis, as they can distort the spectrum. The computations for generating the smoothed variances can be involved; details can be found in Jenkins and Watts (1968) and Bloomfield (1976). The frequency resolution depends on the length of the time series: longer series provide finer frequency resolution.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.27',
    questions: [
      'How many cyclic components are there?',
      'Is there a dominant cyclic frequency?',
      'If there is a dominant cyclic frequency, what is it?',
    ],
    importance:
      'The spectral plot is the primary technique for assessing the cyclic nature of univariate time series in the frequency domain. It is almost always the second plot (after a run sequence plot) generated in a frequency domain analysis of a time series.',
    definitionExpanded:
      'The spectral plot is formed with the vertical axis showing smoothed variance (power) and the horizontal axis showing frequency (cycles per observation). The smoothed variances are computed via the Fourier transform of the autocovariance function. Sharp peaks indicate periodic components. The frequency resolution is 1/N where N is the series length.',
    caseStudySlugs: ['beam-deflections'],
    examples: [
      {
        label: 'White Noise',
        description:
          'A flat, featureless spectrum with no dominant peaks and no identifiable pattern. The peaks fluctuate at random. This type of appearance indicates that there are no significant cyclic patterns in the data and the data are random. Corresponds to NIST Example 1 (200 normal random numbers).',
        variantLabel: 'White Noise',
      },
      {
        label: 'Autoregressive',
        description:
          'A strong dominant peak near zero frequency that decays rapidly toward zero. This is the spectral plot signature of a process with strong positive autocorrelation. Such processes are highly non-random in that there is high association between an observation and a succeeding observation. An autoregressive model $Y_i = A_0 + A_1 Y_{i-1} + E_i$ is appropriate. The next step would be to determine the model parameters and then investigate the source of the autocorrelation: is it the phenomenon under study, drifting in the environment, or contamination from the data acquisition system?',
        variantLabel: 'Autoregressive',
      },
      {
        label: 'Single Frequency',
        description:
          'A single dominant peak at a specific frequency, indicating an underlying single-cycle sinusoidal model. The proper model is $Y_i = C + \\alpha\\sin(2\\pi\\omega t_i + \\phi) + E_i$, where $\\alpha$ is the amplitude, $\\omega$ is the frequency (between 0 and 0.5 cycles per observation), and $\\phi$ is the phase. The recommended next steps are to estimate the frequency from the spectral plot, use a complex demodulation phase plot to fine-tune the estimate, and carry out a non-linear fit of the sinusoidal model.',
        variantLabel: 'Single Frequency',
      },
    ],
    formulas: [
      {
        label: 'Sinusoidal Model',
        tex: String.raw`Y_i = C + \alpha\sin(2\pi\omega\, t_i + \phi) + E_i`,
        explanation:
          'The sinusoidal time series model where alpha is the amplitude, omega is the frequency (between 0 and 0.5 cycles per observation), and phi is the phase. Spectral plots are often used to find a starting value for omega in this model.',
      },
      {
        label: 'Autoregressive Model',
        tex: String.raw`Y_i = A_0 + A_1\, Y_{i-1} + E_i`,
        explanation:
          'When the spectral plot shows a dominant peak near zero that decays rapidly, this autoregressive model is appropriate. The parameters can be estimated by linear regression or by fitting a Box-Jenkins AR model.',
      },
      {
        label: 'Frequency Range',
        tex: String.raw`f_k = \frac{k}{N}, \quad k = 0, 1, \ldots, \left\lfloor\frac{N}{2}\right\rfloor`,
        explanation:
          'The frequencies range from 0 (infinite cycle) to 0.5 (cycle of 2 data points). The frequency resolution is 1/N, determined by the series length.',
      },
    ],
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt
from scipy.signal import periodogram

# Sinusoidal signal at 0.3 cycles/observation (NIST LEW.DAT pattern)
rng = np.random.default_rng(42)
n = 200
t = np.arange(n)
signal = 10 * np.sin(2 * np.pi * 0.3 * t) + rng.standard_normal(n)

freqs, psd = periodogram(signal, fs=1.0)

# Skip DC component (freq=0) for clearer display
mask = freqs > 0
fig, ax = plt.subplots(figsize=(8, 4))
ax.plot(freqs[mask], psd[mask])
ax.set_xlabel("Frequency (cycles/observation)")
ax.set_ylabel("Smoothed Variance (Power)")
ax.set_title("Spectral Plot — Dominant Frequency at 0.3")
ax.set_ylim(bottom=0)
plt.tight_layout()
plt.show()`,
  },
} as const;
