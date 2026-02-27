# Phase 65: SVG Audit Checklist

**Audited:** 2026-02-27
**Build status:** PASS / 951 pages generated in 29.48s / 0 errors
**Auditor:** Claude (code review of all 29 technique generators against NIST/SEMATECH e-Handbook specifications)

## Methodology

Each technique SVG was audited against its NIST e-Handbook source page for:
- **Axes**: Both X and Y axes present with lines and tick marks
- **Labels**: Axis labels match NIST conventions (e.g., "Lag" not "X", "ACF" not "Y")
- **Grid**: Gridlines present for readability
- **Shapes**: Visual elements match NIST (bars, stems, dots, lines, polygons, contours, etc.)
- **Ref Lines**: Reference lines (confidence bands, mean lines, diagonals, grand means) present where NIST shows them
- **Scale**: Axis ranges appropriate for the data (nice() rounding, domain padding)
- **Data Pattern**: Generated dataset produces statistically correct visual pattern matching NIST description

## Legend

- **PASS**: Matches NIST visual conventions
- **FIXED**: Was incorrect, fixed in Phase 65 (Plans 01 or 02)
- **MINOR**: Cosmetic difference from NIST original, acceptable for web rendering
- **N/A**: Dimension not applicable to this technique

## Audit Results

| # | Technique | Slug | Renderer | Axes | Labels | Grid | Shapes | Ref Lines | Scale | Data Pattern | Status |
|---|-----------|------|----------|------|--------|------|--------|-----------|-------|--------------|--------|
| 1 | Histogram | histogram | direct | PASS | PASS | PASS | PASS | N/A | PASS | PASS | PASS |
| 2 | Box Plot | box-plot | direct | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 3 | Scatter Plot | scatter-plot | direct | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 4 | Run Sequence Plot | run-sequence-plot | direct | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 5 | Lag Plot | lag-plot | direct | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 6 | Autocorrelation Plot | autocorrelation-plot | direct | PASS | PASS | PASS | FIXED | FIXED | PASS | PASS | PASS |
| 7 | 4-Plot | 4-plot | composite | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 8 | 6-Plot | 6-plot | composite | FIXED | FIXED | PASS | FIXED | PASS | PASS | FIXED | PASS |
| 9 | Normal Probability Plot | normal-probability-plot | direct | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 10 | Probability Plot | probability-plot | direct | FIXED | FIXED | PASS | PASS | PASS | PASS | FIXED | PASS |
| 11 | Q-Q Plot | qq-plot | direct | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 12 | Spectral Plot | spectral-plot | direct | PASS | PASS | PASS | PASS | N/A | PASS | PASS | PASS |
| 13 | Contour Plot | contour-plot | direct | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 14 | Star Plot | star-plot | direct | N/A | PASS | PASS | PASS | N/A | PASS | MINOR | PASS |
| 15 | Weibull Plot | weibull-plot | direct | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 16 | PPCC Plot | ppcc-plot | direct | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 17 | Mean Plot | mean-plot | dedicated | FIXED | PASS | PASS | FIXED | FIXED | PASS | PASS | PASS |
| 18 | Std Deviation Plot | std-deviation-plot | dedicated | FIXED | PASS | PASS | FIXED | FIXED | PASS | PASS | PASS |
| 19 | Bihistogram | bihistogram | dedicated | FIXED | PASS | PASS | FIXED | PASS | PASS | PASS | PASS |
| 20 | Block Plot | block-plot | dedicated | FIXED | PASS | PASS | FIXED | N/A | PASS | PASS | PASS |
| 21 | Bootstrap Plot | bootstrap-plot | composition | PASS | PASS | PASS | PASS | N/A | PASS | PASS | PASS |
| 22 | Box-Cox Linearity | box-cox-linearity | composition | PASS | PASS | PASS | FIXED | N/A | PASS | PASS | PASS |
| 23 | Box-Cox Normality | box-cox-normality | composition | PASS | PASS | PASS | FIXED | N/A | PASS | PASS | PASS |
| 24 | Complex Demodulation | complex-demodulation | composition | PASS | PASS | PASS | PASS | N/A | PASS | PASS | PASS |
| 25 | Youden Plot | youden-plot | composition | PASS | PASS | PASS | PASS | FIXED | PASS | PASS | PASS |
| 26 | Linear Plots | linear-plots | composition | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 27 | DOE Plots | doe-plots | composition | PASS | PASS | PASS | FIXED | FIXED | PASS | PASS | PASS |
| 28 | Scatterplot Matrix | scatterplot-matrix | composition | PASS | MINOR | PASS | PASS | N/A | PASS | MINOR | PASS |
| 29 | Conditioning Plot | conditioning-plot | composition | PASS | PASS | PASS | PASS | N/A | PASS | PASS | PASS |

### Status Summary

- **PASS**: 29/29 techniques render correctly and build without errors
- **FIXED in Phase 65**: 11 techniques had issues that were corrected
- **MINOR cosmetic**: 2 techniques have acceptable cosmetic differences from NIST
- **FAIL**: 0

## Detailed Audit Notes

### Direct Generator Calls (18 techniques)

**1. Histogram** (NIST 1.3.3.14) -- All dimensions PASS. Bars with KDE overlay, proper bin computation via Sturges' rule, d3-scale for axes, gridLinesH for horizontal grid. Data: normalRandom (NIST verbatim).

**2. Box Plot** (NIST 1.3.3.4) -- All dimensions PASS. Quartile computation via d3-quantile, IQR-based whiskers, outlier circles, median line. Uses scaleBand for group placement. Data: boxPlotData with transmittance values.

**3. Scatter Plot** (NIST 1.3.3.26) -- All dimensions PASS. Data circles with regression line, confidence band polygon, R-squared annotation. Data: scatterData (Load vs Deflection). Both gridLinesH and gridLinesV present.

**4. Run Sequence Plot** (NIST 1.3.3.25) -- All dimensions PASS. Connected line path with dashed mean reference line. X-axis: "Observation", Y-axis: "Response (mV)". Data: timeSeries.

**5. Lag Plot** (NIST 1.3.3.15) -- All dimensions PASS. Plots Y(i) vs Y(i+1) with proper axis labels. Shared domain for square aspect. Diagonal reference line (y=x, dashed). Data: timeSeries.

**6. Autocorrelation Plot** (NIST 1.3.3.1) -- FIXED in 65-02. Lollipop stems (line + circle) match NIST convention. Confidence band corrected from 1.96/sqrt(N) to 2/sqrt(N) per NIST. X-axis: "Lag" with integer formatting. Y-axis: "ACF" with [-1,1] domain. Zero reference line present.

**7. 4-Plot** (NIST 1.3.3.30) -- All dimensions PASS. 2x2 grid: run-sequence (top-left), lag (top-right), histogram (bottom-left), normal probability (bottom-right). Panel order matches NIST Section 1.3.3.30.

**8. 6-Plot** (NIST 1.3.3.33) -- FIXED in 65-01. Restructured from extended-4-plot to proper 3x2 regression diagnostic. Now renders: Y vs X, residuals vs X, residuals vs predicted, lag of residuals, residual histogram, residual normal probability. Accepts bivariate scatterData and computes regression internally.

**9. Normal Probability Plot** (NIST 1.3.3.21) -- All dimensions PASS. Blom plotting position, normalQuantile for theoretical quantiles, best-fit line through data. X: "Theoretical Quantiles", Y: "Sample Quantiles". Data: normalRandom.

**10. Probability Plot** (NIST 1.3.3.22) -- FIXED in 65-02. Now uses uniformRandom data to differentiate from normal-probability-plot. Shows characteristic S-curve deviation demonstrating the general-purpose diagnostic nature of probability plots.

**11. Q-Q Plot** (NIST 1.3.3.23) -- All dimensions PASS. Theoretical vs sample quantiles with dashed diagonal reference (y = mean + sd * x). Data: normalRandom.

**12. Spectral Plot** (NIST 1.3.3.27) -- All dimensions PASS. Power spectrum via FFT (powerSpectrum function). X-axis: "Frequency (cycles/sample)" with correct 0-0.5 domain. Adaptive log/linear Y-scale based on dynamic range. Area fill under curve. DC bin (index 0) correctly skipped. Compact formatter for large PSD values.

**13. Contour Plot** (NIST 1.3.3.7) -- All dimensions PASS. d3-contour for marching squares. Dual-color fill (teal low, orange high) with opacity gradients. Color legend on right. X: "Temperature", Y: "Pressure". Data: responseSurface grid.

**14. Star Plot** (NIST 1.3.3.29) -- MINOR: Uses hardcoded example data (Location=8, Scale=6, Skewness=3, Kurtosis=5, Randomness=9) rather than data from a real dataset. Acceptable because the technique page explains the general concept. Radar geometry (polygon + axis lines + ring grid) matches NIST description. Labels correctly positioned using polarToCartesian.

**15. Weibull Plot** (NIST 1.3.3.31) -- All dimensions PASS. Weibull plotting position: ln(-ln(1-p)) for X, ln(data) for Y. Best-fit line through Weibull-transformed coordinates. Data: exp(normalRandom) for realistic Weibull-distributed data.

**16. PPCC Plot** (NIST 1.3.3.24) -- All dimensions PASS. Tukey-Lambda shape parameter sweep (r=0.5 to 5.0, step 0.1). Connected line path with highlighted maximum point. X: "Shape Parameter (r)", Y: "PPCC".

**17. Mean Plot** (NIST 1.3.3.20) -- FIXED in 65-01. Switched from generateBarPlot (bar chart) to generateDoeMeanPlot (connected-dot plot with grand mean reference line). NIST shows dots connected by lines with a grand mean reference, not bars.

**18. Std Deviation Plot** (NIST 1.3.3.28) -- FIXED in 65-01. Switched from generateBarPlot to generateDoeMeanPlot. NIST SD plot shows connected dots per factor level with overall SD reference line, not bars.

### Composition-Based (11 techniques)

**19. Bihistogram** (NIST 1.3.3.2) -- FIXED in 65-01. Switched from composeBihistogram (two stacked independent histograms) to generateBihistogram (back-to-back bars from shared center line). Top bars UP, bottom bars DOWN from center. Shared x-axis and bin domain. Group labels near center line.

**20. Block Plot** (NIST 1.3.3.3) -- FIXED in 65-01. Switched from composeBlockPlot (bar chart via generateBarPlot) to generateBlockPlot (connected group means across blocks with colored circles, polylines, and legend).

**21. Bootstrap Plot** (NIST 1.3.3.4) -- All dimensions PASS. Generates 200 bootstrap resampled means from normalRandom using seededRandom(42). Renders as histogram with KDE overlay. Title: "Bootstrap Distribution of the Mean".

**22. Box-Cox Linearity** (NIST 1.3.3.5) -- FIXED in 65-02 (partially in 65-01). Lambda sweep (-2 to +2, 21 points). Scatter plot with polyline connecting points to show smooth curve per NIST. X: "Lambda", Y: "Correlation".

**23. Box-Cox Normality** (NIST 1.3.3.6) -- FIXED in 65-02 (partially in 65-01). Lambda sweep (-2 to +2, 21 points). PPCC-style correlation with polyline overlay. X: "Lambda", Y: "Normality Correlation".

**24. Complex Demodulation** (NIST 1.3.3.8) -- All dimensions PASS. Two stacked panels: amplitude envelope (running RMS) and phase angle (atan2-based). Both use generateLinePlot with time-series mode. Data: timeSeries.

**25. Youden Plot** (NIST 1.3.3.32) -- FIXED in 65-02. Reference lines (vertical and horizontal median lines) now use data-driven scale functions instead of hardcoded pixel math. Scatter of 20 lab-to-lab paired measurements. X: "Run 1 Measurement", Y: "Run 2 Measurement". Dashed median crosshairs.

**26. Linear Plots** (NIST 1.3.3.16-19) -- All dimensions PASS. 2x2 grid: correlation scatter with regression (top-left), intercept run sequence (top-right), slope run sequence (bottom-left), residual SD run sequence (bottom-right). Data derived from scatterData subsets.

**27. DOE Plots** (NIST 1.3.3.11-13) -- FIXED in 65-01. Three-panel layout: response vs run (scatter), mean plot (connected dots via generateDoeMeanPlot), SD plot (connected dots via generateDoeMeanPlot). Mean and SD panels include grand mean reference lines.

**28. Scatterplot Matrix** (NIST 1.3.3.26.1) -- MINOR: Variable names X1-X4 are generic (all derived from normalRandom with simple transformations). Diagonal shows histograms, off-diagonal shows scatter plots. 4x4 grid with labels. Acceptable because the technique page explains the general concept.

**29. Conditioning Plot** (NIST 1.3.3.26.12) -- All dimensions PASS. 3x2 grid (6 panels), one per temperature level from conditioningData (NIST PR1.DAT). Each panel: Torque vs Time scatter. Temperature level shown in panel title.

## Issues Fixed in Phase 65

| # | Issue | Severity | Plan | Fix | Commit |
|---|-------|----------|------|-----|--------|
| 1 | Bihistogram: stacked histograms instead of back-to-back | HIGH | 65-01 | Switched to generateBihistogram dedicated generator | 59afd23 |
| 2 | Mean Plot: bar chart instead of connected dots | HIGH | 65-01 | Switched to generateDoeMeanPlot | 59afd23 |
| 3 | Std Deviation Plot: bar chart instead of connected dots | HIGH | 65-01 | Switched to generateDoeMeanPlot | 59afd23 |
| 4 | Block Plot: bar chart instead of connected group means | HIGH | 65-01 | Switched to generateBlockPlot dedicated generator | 59afd23 |
| 5 | DOE Plots: bar charts in mean/SD panels | HIGH | 65-01 | Switched inner panels to generateDoeMeanPlot | 59afd23 |
| 6 | 6-Plot: extended 4-plot instead of regression diagnostic | HIGH | 65-01 | Restructured as 3x2 regression diagnostic with residual analysis | df06bd2 |
| 7 | Autocorrelation: 1.96/sqrt(N) instead of 2/sqrt(N) | MEDIUM | 65-02 | Changed constant in line-plot.ts | 672b9fb |
| 8 | Box-Cox Linearity: scatter dots instead of connected line | MEDIUM | 65-01/02 | Added polyline overlay connecting sorted points | 59afd23 |
| 9 | Box-Cox Normality: scatter dots instead of connected line | MEDIUM | 65-01/02 | Added polyline overlay connecting sorted points | 59afd23 |
| 10 | Youden Plot: hardcoded pixel math for reference lines | MEDIUM | 65-02 | Replaced with data-driven scale functions | e709c9e |
| 11 | Probability Plot: identical to Normal Probability Plot | MEDIUM | 65-02 | Changed to use uniformRandom data for differentiation | e709c9e |

### Issues by Severity

- **HIGH**: 6 fixed (all in 65-01)
- **MEDIUM**: 5 fixed (3 in 65-01/02, 2 in 65-02)
- **LOW**: 0 remaining (star-plot and scatterplot-matrix cosmetic items documented as MINOR, not requiring fixes)

### Cross-Reference to 65-RESEARCH.md Identified Issues

| Research # | Issue Description | Status |
|------------|-------------------|--------|
| HIGH-1 | Bihistogram stacked vs back-to-back | FIXED |
| HIGH-2 | Mean Plot/SD Plot bar chart vs connected dots | FIXED |
| HIGH-3 | Block Plot bar chart vs connected group means | FIXED |
| HIGH-4 | 6-Plot not regression diagnostic | FIXED |
| HIGH-5 | DOE Plots bar charts vs connected-dot mean/SD | FIXED |
| MEDIUM-6 | Autocorrelation 1.96/sqrt(N) vs 2/sqrt(N) | FIXED |
| MEDIUM-7 | Box-Cox Linearity/Normality dots vs line | FIXED |
| MEDIUM-8 | Youden Plot hardcoded reference lines | FIXED |
| MEDIUM-9 | Probability Plot identical to Normal Prob Plot | FIXED |
| LOW-10 | Star Plot hardcoded example data | MINOR (documented) |
| LOW-11 | Scatterplot Matrix generic variable names | MINOR (documented) |

**All HIGH and MEDIUM issues: FIXED (11/11)**
**LOW issues: Documented as MINOR (2/2) -- no fix required**

## Tier B Variant Validation

See Task 3 results below for per-variant validation of all 6 Tier B techniques (35 total variants).

### Histogram Variants (8)

| Variant | Data Generation | Expected Pattern | Status |
|---------|----------------|------------------|--------|
| Symmetric | normalRandom | Single bell curve peak | PASS |
| Right Skewed | exp(normalRandom * 0.5) | Asymmetric tail extending right | PASS |
| Left Skewed | -exp(-normalRandom * 0.5) + 5 | Asymmetric tail extending left | PASS |
| Bimodal | normalRandom +/- 2 (split at 50) | Two distinct peaks | PASS |
| Uniform | uniformRandom | Flat bars, no peak | PASS |
| Heavy Tailed | normalRandom * (1 + |normalRandom|) | Wider spread than normal | PASS |
| Peaked | normalRandom * 0.3 | Narrow, tall peak (leptokurtic) | PASS |
| With Outlier | normalRandom[0:99] + [8.5] | Normal with visible outlier bar | PASS |

### Scatter Plot Variants (12)

| Variant | Data Generation | Expected Pattern | Status |
|---------|----------------|------------------|--------|
| Strong Positive | scatterData + regression | Tight upward trend with R-squared | PASS |
| Strong Negative | y = -y + 7 | Tight downward trend | PASS |
| Weak Positive | y + random * 4 | Loose upward trend | PASS |
| No Correlation | shuffled y | Random cloud | PASS |
| Quadratic | y = 0.02(x-12)^2 + noise | Parabolic U-shape | PASS |
| Exponential | y = exp(x * 0.1) | Exponential growth curve | PASS |
| Heteroscedastic | y + random * x * 0.3 | Fan-shaped spread increasing with x | PASS |
| Clustered | 3 centroids (5,2), (15,5), (22,3) | Three distinct groups | PASS |
| With Outliers | scatterData + 2 outliers | Linear with 2 obvious outliers | PASS |
| Fan-shaped | y * 0.5 + random * (x/24) * 4 | Variance increases with x | PASS |
| Sinusoidal | y = 3 + 2sin(x * 0.4) | Sine wave pattern | PASS |
| Step Function | y = floor(x/5) * 1.5 + 1 + noise | Discrete step levels | PASS |

### Normal Probability Plot Variants (4)

| Variant | Data Generation | Expected Pattern | Status |
|---------|----------------|------------------|--------|
| Normal | normalRandom | Points follow diagonal line | PASS |
| Right Skewed | exp(normalRandom * 0.5) | S-curve deviation at upper end | PASS |
| Heavy Tailed | normalRandom * (1 + |normalRandom| * 0.3) | S-curve deviation at both ends | PASS |
| Bimodal | normalRandom +/- 2 (split at 50) | Step-like deviation from diagonal | PASS |

### Lag Plot Variants (4)

| Variant | Data Generation | Expected Pattern | Status |
|---------|----------------|------------------|--------|
| Random | normalRandom | Uniform cloud, no structure | PASS |
| Autoregressive | AR(1) phi=0.9, seeded(888) | Strong positive diagonal correlation | PASS |
| Seasonal | sin(2pi*i/12) + noise, seeded(999) | Elliptical/periodic structure | PASS |
| Trend | i*0.05 + noise, seeded(1111) | Cluster along diagonal | PASS |

### Autocorrelation Plot Variants (4)

| Variant | Data Generation | Expected Pattern | Status |
|---------|----------------|------------------|--------|
| White Noise | normalRandom | All ACF values within confidence band | PASS |
| AR(1) | phi=0.9, seeded(1234) | Exponential ACF decay | PASS |
| MA(1) | theta=0.7, seeded(2345) | Spike at lag 1, near-zero after | PASS |
| Seasonal | sin(2pi*i/12) + noise, seeded(3456) | Periodic ACF peaks at multiples of 12 | PASS |

### Spectral Plot Variants (3)

| Variant | Data Generation | Expected Pattern | Status |
|---------|----------------|------------------|--------|
| Single Frequency | sin(2pi*i/10) + noise, seeded(4567) | One dominant peak at f=0.1 | PASS |
| Multiple Frequencies | sin(2pi*i/10) + 0.5*sin(2pi*i/25) + 0.3*sin(2pi*i/5) + noise | Three peaks at f=0.1, 0.04, 0.2 | PASS |
| White Noise | normalRandom | Flat spectrum, no dominant peaks | PASS |

### Tier B Summary

- **35 total variants** across 6 techniques
- **35/35 PASS** -- all produce visually distinct, statistically correct patterns
- All variants use seededRandom() for deterministic reproducibility across builds
- Data generation approaches are statistically sound (AR processes, mixture distributions, known transformations)
