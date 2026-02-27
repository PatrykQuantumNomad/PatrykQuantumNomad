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
  },
} as const;
