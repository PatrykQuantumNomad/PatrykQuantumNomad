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
      'Use an autocorrelation plot when analyzing time-ordered data to determine whether successive observations are statistically independent. It is essential for validating the randomness assumption underlying many statistical procedures, including control charts, capability studies, and regression models. The plot is particularly valuable after fitting a model, where it helps verify that residuals behave as white noise rather than retaining unexplained temporal structure.',
    interpretation:
      'The horizontal axis shows the lag value and the vertical axis shows the autocorrelation coefficient, which ranges from -1 to +1. A pair of horizontal reference lines, typically drawn at plus and minus 1.96 divided by the square root of the sample size, marks the 95 percent significance bounds. For truly random data, approximately 95 percent of the autocorrelation values should fall within these bounds. A pattern where the autocorrelation decays slowly from a large positive value at lag 1 indicates a trend or drift in the process. A single dominant spike at lag 1 that cuts off sharply suggests a first-order autoregressive process, while a sinusoidal pattern in the autocorrelation function indicates periodic behavior in the data. Variant patterns include random data showing no significant spikes, moderate autocorrelation with a gradual exponential decay, strong autocorrelation from an autoregressive model with slow decay, and sinusoidal models producing oscillating autocorrelation values.',
    assumptions:
      'The autocorrelation plot assumes the data are uniformly spaced in time or sequence order. It requires a reasonably large sample size, typically at least 50 observations, to produce reliable estimates at moderate lags. The significance bounds assume normality and independence under the null hypothesis, so they serve as approximate guides rather than exact critical values.',
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
      'Randomness is the foundational assumption underlying most statistical estimation and testing. If violated, confidence intervals, control charts, and capability indices become invalid. The autocorrelation plot is the primary tool for detecting this violation.',
    definitionExpanded:
      'The vertical axis shows the autocorrelation coefficient R_h = C_h / C_0, where C_h is the autocovariance at lag h and C_0 is the variance. Horizontal reference lines at plus or minus 2/sqrt(N) mark the 95% significance bounds under the null hypothesis of white noise. The autocorrelation at lag 0 is always 1 by definition.',
    caseStudySlugs: ['beam-deflections'],
    examples: [
      {
        label: 'White Noise',
        description:
          'All autocorrelation values fall within the 95% confidence bands, with no significant spikes at any lag. This is the signature of purely random data where each observation is independent of all others. The constant-plus-error model Y = c + e is appropriate.',
        variantLabel: 'White Noise',
      },
      {
        label: 'AR(1) Process',
        description:
          'A large positive spike at lag 1 followed by exponentially decaying values indicates a first-order autoregressive process. Each observation depends primarily on its immediate predecessor. The decay rate reflects the strength of the serial dependence.',
        variantLabel: 'AR(1)',
      },
      {
        label: 'MA(1) Process',
        description:
          'A single significant spike at lag 1 that cuts off sharply to zero at lag 2 and beyond is the hallmark of a first-order moving average process. The data have short-range dependence limited to adjacent observations.',
        variantLabel: 'MA(1)',
      },
      {
        label: 'Seasonal Pattern',
        description:
          'Oscillating autocorrelation values that repeat at regular lag intervals indicate periodic behavior in the time series. The spacing of the peaks reveals the seasonal period, and the amplitude of the oscillation indicates the strength of the cyclic component.',
        variantLabel: 'Seasonal',
      },
    ],
    formulas: [
      {
        label: 'Autocovariance Function',
        tex: String.raw`C_h = \frac{1}{N}\sum_{t=1}^{N-h}(Y_t - \bar{Y})(Y_{t+h} - \bar{Y})`,
        explanation:
          'The autocovariance at lag h measures the average product of deviations from the mean for observations separated by h time steps.',
      },
      {
        label: 'Autocorrelation Coefficient',
        tex: String.raw`R_h = \frac{C_h}{C_0}`,
        explanation:
          'The autocorrelation at lag h is the autocovariance at lag h divided by the variance (autocovariance at lag 0), giving a value between -1 and +1.',
      },
      {
        label: '95% Significance Bounds',
        tex: String.raw`\pm\,\frac{2}{\sqrt{N}}`,
        explanation:
          'Under the null hypothesis of white noise, approximately 95% of autocorrelation values should fall within these bounds. Uses 2/sqrt(N) per NIST convention.',
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
      'Complex demodulation is a time-series analysis technique that extracts the time-varying amplitude and phase of a sinusoidal component at a specified frequency. It produces two companion plots: an amplitude plot showing how the strength of the cyclic component changes over time, and a phase plot showing how the timing or alignment of the cycle shifts.',
    purpose:
      'Use complex demodulation when a time series contains a known or suspected periodic component and the analyst needs to determine whether that component is stationary or whether its amplitude or phase drifts over time. This is particularly important in manufacturing process monitoring, vibration analysis, and environmental science where cyclic effects may strengthen, weaken, or shift in timing. Unlike spectral analysis, which gives a single global frequency decomposition, complex demodulation tracks the evolution of a specific frequency component across the observation period.',
    interpretation:
      'In the amplitude plot, the vertical axis shows the estimated amplitude of the sinusoidal component as a function of time. A flat amplitude trace indicates a stationary cyclic component, while trends or abrupt changes indicate non-stationarity in the cycle strength. In the phase plot, the vertical axis shows the phase angle in degrees or radians. A constant phase indicates a stable cycle aligned with the demodulation frequency, while a linear drift in phase suggests that the true frequency differs slightly from the specified demodulation frequency. Sudden phase jumps may indicate structural changes in the underlying process.',
    assumptions:
      'Complex demodulation requires specifying the target frequency in advance, which typically comes from prior domain knowledge or a preliminary spectral analysis. It assumes the signal can be approximated by a sinusoidal model at the chosen frequency, and it uses a low-pass filter whose bandwidth must be selected to balance smoothing and time resolution. The technique is most effective when the cyclic component is well-separated in frequency from other signals and noise.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Sections 1.3.3.8-9',
    questions: [
      'Does the amplitude change over time?',
      'Are there any outliers that need to be investigated?',
      'Is the amplitude different at the beginning of the series (start-up effect)?',
    ],
    importance:
      'Non-stationary cyclic components invalidate spectral analysis assumptions. Complex demodulation is the only technique that tracks time-varying amplitude and phase, making it essential for detecting when periodic behavior strengthens, weakens, or shifts timing during a process.',
    definitionExpanded:
      'The display consists of two panels: an amplitude plot (vertical axis = estimated amplitude of the sinusoidal component vs. time) and a phase plot (vertical axis = phase angle in degrees vs. time). The demodulation process multiplies the signal by a complex exponential at the target frequency, then applies a low-pass filter to extract the slowly varying envelope. The filter bandwidth controls the trade-off between time resolution and noise suppression.',
    caseStudySlugs: ['beam-deflections'],
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt
from scipy.signal import hilbert

# Generate sinusoidal signal with time-varying amplitude
rng = np.random.default_rng(42)
n = 500
t = np.linspace(0, 10, n)
freq = 2.0  # target frequency in Hz
amplitude_envelope = 1.0 + 0.5 * np.sin(2 * np.pi * 0.2 * t)
signal = amplitude_envelope * np.sin(2 * np.pi * freq * t)
signal += 0.3 * rng.standard_normal(n)

# Complex demodulation via analytic signal
analytic = hilbert(signal)
envelope = np.abs(analytic)
phase = np.unwrap(np.angle(analytic))

fig, axes = plt.subplots(2, 1, figsize=(10, 6), sharex=True)
axes[0].plot(t, envelope, label="Amplitude envelope")
axes[0].plot(t, amplitude_envelope, "--", alpha=0.7, label="True envelope")
axes[0].set_ylabel("Amplitude")
axes[0].set_title("Complex Demodulation")
axes[0].legend()

axes[1].plot(t, np.degrees(phase))
axes[1].set_xlabel("Time")
axes[1].set_ylabel("Phase (degrees)")
plt.tight_layout()
plt.show()`,
  },

  'lag-plot': {
    definition:
      'A lag plot is a scatter plot of each observation in a dataset against the observation at a fixed lag, typically lag 1. That is, the point at position i is plotted as (Y_i, Y_{i+k}) where k is the chosen lag, creating a visual test for serial dependence in time-ordered data.',
    purpose:
      'Use a lag plot as a simple and powerful diagnostic for detecting non-randomness in time series data. It complements the autocorrelation plot by providing a direct visual impression of how successive observations are related. The lag plot is particularly useful for detecting non-linear dependencies that might not be captured by linear autocorrelation, such as clustered or oscillating patterns. It is one of the four panels in the standard 4-plot diagnostic display.',
    interpretation:
      'For random data, the lag plot appears as a structureless cloud of points with no discernible pattern, indicating that knowing the value at time i provides no information about the value at time i+1. A strong positive linear pattern in the lag plot indicates positive autocorrelation, meaning high values tend to follow high values and low values follow low values. A cluster of points along the diagonal suggests a slowly drifting process. An elliptical or circular pattern suggests oscillatory behavior. A pattern of distinct clusters indicates that the data alternate between distinct states. Variant patterns include random data showing a formless scatter, moderate autocorrelation producing an elongated ellipse along the diagonal, strong autocorrelation displaying a tight linear band, and sinusoidal models creating a structured elliptical loop.',
    assumptions:
      'The lag plot requires that the data be recorded in the order of collection. It is most effective at lag 1 for detecting first-order dependence, though higher lags can be explored for more complex patterns. The visual assessment is qualitative and should be supported by quantitative tests such as the autocorrelation coefficient or the Durbin-Watson statistic.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.15',
    questions: [
      'Are the data random?',
      'Is there serial correlation in the data?',
      'What is a suitable model for the data?',
      'Are there outliers in the data?',
    ],
    importance:
      'The lag plot provides an instant visual diagnostic for randomness that requires no distributional assumptions. A single glance reveals whether successive observations are independent, which is critical because non-independence invalidates standard error formulas, makes confidence intervals too narrow, and causes control charts to generate false alarms.',
    definitionExpanded:
      'The plot shows Y_i on the horizontal axis vs Y_{i+k} on the vertical axis, where k is the lag (default k=1). Each point represents two successive observations. The plot exploits the human eye\'s pattern recognition: random data produce a structureless cloud, while any departure from randomness produces a recognizable geometric shape.',
    caseStudySlugs: ['beam-deflections'],
    examples: [
      {
        label: 'Random Data',
        description:
          'A structureless, circular cloud of points centered on the plot with no discernible pattern. This indicates that knowing the value at time i provides no information about the value at time i+1. The data satisfy the randomness assumption.',
        variantLabel: 'Random',
      },
      {
        label: 'Autoregressive',
        description:
          'Points form a tight ellipse aligned along the diagonal, indicating strong positive autocorrelation. High values tend to follow high values and low values follow low values. The tighter the ellipse, the stronger the serial dependence.',
        variantLabel: 'Autoregressive',
      },
      {
        label: 'Seasonal',
        description:
          'Points form a structured elliptical or circular loop pattern rather than a random cloud. The cyclic structure in the data creates a recognizable geometric shape in the lag plot that is distinct from both random scatter and linear autocorrelation.',
        variantLabel: 'Seasonal',
      },
      {
        label: 'Trend',
        description:
          'Points cluster tightly along the diagonal with the cloud displaced from the center, indicating a strong trend in the data. The linear structure arises because successive values in a trending series are nearly identical, differing only by the trend increment plus noise.',
        variantLabel: 'Trend',
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

fig, ax = plt.subplots(figsize=(6, 6))
ax.scatter(y[:-1], y[1:], alpha=0.5, edgecolors="k", linewidths=0.5)
ax.set_xlabel("Y(t)")
ax.set_ylabel("Y(t+1)")
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
      'A spectral plot, also known as a power spectral density (PSD) plot, displays the contribution of each frequency component to the total variance of a time series. It transforms the time-domain representation into the frequency domain using the Fourier transform, revealing the dominant periodicities and cyclic behavior in the data.',
    purpose:
      'Use a spectral plot when the goal is to identify dominant frequencies, periodicities, or cyclic patterns in time series data. It provides a global frequency decomposition that complements the time-domain information from run-sequence and autocorrelation plots. Spectral analysis is particularly important in vibration monitoring, signal processing, environmental science, and manufacturing process diagnostics where cyclic patterns may be caused by rotating equipment, seasonal effects, or periodic disturbances.',
    interpretation:
      'The horizontal axis represents frequency, often in cycles per unit time, and the vertical axis represents power spectral density, typically on a logarithmic scale when the dynamic range is large. Sharp peaks in the spectral plot indicate dominant periodic components at those frequencies. The frequency of a peak can be converted to a period by taking its reciprocal. A flat spectrum indicates white noise with equal power at all frequencies, consistent with random data. A spectrum that decreases with frequency indicates a red noise process where low-frequency variations dominate. Variant patterns include white noise (flat spectrum), autoregressive processes with broad spectral peaks, and sinusoidal signals producing sharp narrow spikes at the signal frequency and its harmonics.',
    assumptions:
      'Spectral analysis assumes that the time series is stationary, meaning that its statistical properties do not change over time. Non-stationary data should be detrended or differenced before applying spectral methods. The frequency resolution depends on the length of the time series: longer series provide finer frequency resolution. Windowing functions such as Hanning or Hamming are typically applied to reduce spectral leakage from the finite sample length.',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.27',
    questions: [
      'How many cyclic components are there?',
      'Is there a dominant cyclic frequency?',
      'If there is a dominant cyclic frequency, what is it?',
    ],
    importance:
      'Identifying the dominant frequencies in a time series is essential for understanding the underlying physical mechanism generating the data. In manufacturing, a spectral peak at a specific frequency can identify the rotating component or periodic process responsible for variation, enabling targeted corrective action rather than broad process changes.',
    definitionExpanded:
      'The power spectral density is computed via the Fourier transform of the autocovariance function (or equivalently, the squared magnitude of the discrete Fourier transform of the data, suitably normalized). The horizontal axis shows frequency in cycles per observation interval, and the vertical axis shows power spectral density. Sharp peaks indicate periodic components; the frequency resolution is 1/N where N is the series length.',
    caseStudySlugs: ['beam-deflections'],
    examples: [
      {
        label: 'Single Frequency',
        description:
          'A single sharp peak rises prominently above a flat noise floor, identifying one dominant periodic component in the data. The frequency of the peak can be converted to a period by taking its reciprocal. This pattern is typical of data driven by a single cyclic mechanism.',
        variantLabel: 'Single Frequency',
      },
      {
        label: 'Multiple Frequencies',
        description:
          'Two or more distinct peaks appear at different frequencies, indicating that the time series contains multiple periodic components. Each peak represents an independent cyclic mechanism. The relative heights indicate which frequency contributes most to the total variance.',
        variantLabel: 'Multiple Frequencies',
      },
      {
        label: 'White Noise',
        description:
          'A flat, featureless spectrum with roughly equal power at all frequencies. This is the spectral signature of purely random data with no periodic structure. The absence of peaks confirms that no cyclic model is needed.',
        variantLabel: 'White Noise',
      },
    ],
    formulas: [
      {
        label: 'Power Spectral Density (Periodogram)',
        tex: String.raw`S(f_k) = \frac{1}{N}\left|\sum_{t=0}^{N-1} Y_t\, e^{-i\,2\pi f_k t}\right|^2`,
        explanation:
          'The periodogram estimates the power spectral density at frequency f_k as the squared magnitude of the discrete Fourier transform of the data, divided by the number of observations.',
      },
      {
        label: 'Frequency Range',
        tex: String.raw`f_k = \frac{k}{N}, \quad k = 0, 1, \ldots, \left\lfloor\frac{N}{2}\right\rfloor`,
        explanation:
          'The frequencies range from 0 to the Nyquist frequency (0.5 cycles per observation interval). The frequency resolution is 1/N, determined by the series length.',
      },
    ],
    pythonCode: `import numpy as np
import matplotlib.pyplot as plt
from scipy.signal import periodogram

# Generate sinusoidal signal at 0.1 Hz plus noise
rng = np.random.default_rng(42)
n = 500
fs = 1.0  # sampling frequency
t = np.arange(n) / fs
signal = 2.0 * np.sin(2 * np.pi * 0.1 * t) + rng.standard_normal(n)

freqs, psd = periodogram(signal, fs=fs)

fig, ax = plt.subplots(figsize=(8, 4))
ax.semilogy(freqs, psd)
ax.set_xlabel("Frequency (Hz)")
ax.set_ylabel("Power Spectral Density")
ax.set_title("Spectral Plot")
plt.tight_layout()
plt.show()`,
  },
} as const;
