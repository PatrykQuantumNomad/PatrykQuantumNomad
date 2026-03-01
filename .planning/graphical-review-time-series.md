# Time-Series Techniques Review: NIST Handbook vs Site Content

Reviewer: time-series-reviewer (Task #1)
Date: 2026-03-01
Source files reviewed:
- Content: `src/lib/eda/technique-content/time-series.ts`
- SVG generators: `autocorrelation-plot.ts`, `lag-plot.ts`, `line-plot.ts`, `spectral-plot.ts`
- Handbook: `handbook/eda/section3/` (autocopl.htm, autocop1-4.htm, lagplot.htm, lagplot1-4.htm, runseqpl.htm, spectrum.htm, spectru1-3.htm, compdeam.htm, compdeph.htm)

---

## 1. Autocorrelation Plot (NIST 1.3.3.1)

### Definition
**PASS.** The site definition accurately describes the autocorrelation plot as displaying sample ACF vs lag. The handbook says "Autocorrelation plots are formed by: Vertical axis: Autocorrelation coefficient ... Horizontal axis: Time lag h". The site's definition is a faithful expansion of this.

### Purpose
**PASS.** The site correctly states the purpose as checking randomness and use in Box-Jenkins model identification, matching the handbook's two stated purposes.

### Formulas
**PASS.** All four formulas are correct:
- `R_h = C_h / C_0` matches handbook exactly
- `R_0 = C_0 / C_0 = 1` matches handbook ("Note that R_h is between -1 and +1")
- Autocovariance function `C_h = (1/N) * SUM...` matches the handbook's primary formula (the handbook notes some sources use `1/(N-h)` but recommends `1/N`, and the site uses `1/N` -- correct)
- 95% significance bounds `+/- 1.96/sqrt(N)` correctly implements the handbook's formula `+/- z(1-alpha/2)/sqrt(N)` for the randomness-testing case. For alpha=0.05, z(0.975)=1.96. Correct.

### Interpretation
**PASS.** The interpretation accurately describes:
- The range [-1, +1] for the autocorrelation coefficient
- The 95% significance bounds at +/- 1.96/sqrt(N)
- The decay patterns for strong and moderate autocorrelation
- The sinusoidal pattern description

### Examples
**MINOR ISSUE.** The handbook's second example (autocop2.htm) is labeled "Moderate Autocorrelation" (titled "Weak autocorrelation" in the main page link text, but "Moderate Autocorrelation" in the actual page title). The site labels the example variants as: White Noise, Strong Autocorrelation, Moderate Autocorrelation, Sinusoidal Model. The handbook has: Random (White Noise), Weak/Moderate autocorrelation, Strong autocorrelation, Sinusoidal model. The ordering in the site puts Strong before Moderate, which is the reverse of the handbook's ordering. This is a **presentation choice**, not an error -- the descriptions are accurate.

### Questions
**PASS.** The six questions match the handbook's nine questions. The handbook asks "Is an observation related to an observation twice-removed?" separately, but the site's questions cover the same ground. The site also includes "Is the standard error formula... valid?" which directly matches the handbook.

### Importance
**PASS.** Accurately covers the three reasons from the handbook: standard tests depend on randomness, the s/sqrt(N) formula requires it, and the default Y=constant+error model breaks down.

### Assumptions
**PASS.** The site adds useful context about minimum sample size (~50) and the limitation to linear dependence. These are correct and supplement the handbook without contradicting it.

### SVG Generator (`autocorrelation-plot.ts`)
**PASS.** The generator:
- Correctly computes ACF via imported `autocorrelation()` function
- Correctly implements 95% confidence bands at +/- 1.96/sqrt(N)
- Correctly skips lag 0 in the stem display (lag 0 = 1 by definition)
- Uses vertical stems with dots at tips -- standard ACF plot style
- Y-axis domain is correctly [-1, 1]

### SVG Generator (`line-plot.ts`, autocorrelation mode)
**MINOR INCONSISTENCY.** In `line-plot.ts` line 169, the autocorrelation mode uses `2/sqrt(n)` for the significance bound, while the dedicated `autocorrelation-plot.ts` uses `1.96/sqrt(N)`. The handbook formula is `z(1-alpha/2)/sqrt(N)` with z(0.975)=1.96 for 95% bounds. So `1.96/sqrt(N)` is exact and `2/sqrt(N)` is an approximation. The comment in `line-plot.ts` says "per NIST convention" but the NIST handbook actually uses the exact z-value, not the approximation. Both are defensible (many textbooks use 2/sqrt(N) as a quick approximation), but they should be consistent across generators. **Recommend making both use 1.96/sqrt(N).**

---

## 2. Lag Plot (NIST 1.3.3.15)

### Definition
**PASS.** The site correctly defines: "A lag plot is a scatter plot ... For a lag of k, each point is plotted as (Y_{i-k}, Y_i), where the horizontal axis shows the lagged value and the vertical axis shows the current value." This matches the handbook: "Vertical axis: Y_i for all i; Horizontal axis: Y_{i-1} for all i" (for lag 1).

### Purpose
**PASS.** The site says "Use a lag plot as a simple and powerful diagnostic for detecting non-randomness in time series data" and mentions detecting non-linear dependencies. The handbook says "A lag plot checks whether a data set or time series is random or not." The site's expansion is accurate and consistent.

### Questions
**PASS.** The site lists the same four questions as the handbook:
1. Are the data random?
2. Is there serial correlation?
3. What is a suitable model?
4. Are there outliers?

### Interpretation
**PASS.** All four variant descriptions are accurate vs the handbook examples:
- **Random data** (lagplot1.htm): Site says "structureless, circular cloud... shotgun pattern". Handbook says "absence of structure... Y_i could be virtually anything... non-association is the essence of randomness." Match.
- **Moderate autocorrelation** (lagplot2.htm): Site says "Points cluster noisily along the diagonal, forming an elongated ellipse." Handbook says "the points tend to cluster (albeit noisily) along the diagonal." Match.
- **Strong autocorrelation** (lagplot3.htm): Site says "tight linear band along the diagonal." Handbook says "tight clustering of points along the diagonal." Match.
- **Sinusoidal** (lagplot4.htm): Site says "tight elliptical loop." Handbook says "tight elliptical clustering." Match.

### Formulas
**PASS.** The three formulas (autoregressive model, constant model, sinusoidal model) all match the handbook's models exactly.

### Importance
**PASS.** The site says "Inasmuch as randomness is an underlying assumption for most statistical estimation and testing techniques, the lag plot should be a routine tool for researchers." This is nearly verbatim from the handbook.

### SVG Generator (`lag-plot.ts`)
**PASS.** The generator:
- Correctly creates lag pairs: `x = data[i], y = data[i + lag]` which gives (Y_{i-k}, Y_i) pairs per NIST convention (horizontal = lagged value, vertical = current value)
- Uses shared domain for both axes (square aspect) -- appropriate
- Includes diagonal reference line (y=x) -- helpful visual aid
- Axis labels correctly show Y(i-1) and Y(i) for lag 1

---

## 3. Run-Sequence Plot (NIST 1.3.3.25)

### Definition
**PASS.** The site says "displays the measured values in the order they were collected, with the horizontal axis representing the run order or time index and the vertical axis representing the response." The handbook says: "Vertical axis: Response variable Y_i; Horizontal axis: Index i (i = 1, 2, 3, ...)". Match.

### Purpose
**PASS.** The site correctly identifies the purpose as detecting "shifts in location, changes in spread, drifts, trends, and oscillations." The handbook says: "shifts in location and scale are typically quite evident. Also, outliers can easily be detected." The site elaborates slightly but remains accurate.

### Questions
**PASS.** The three questions match the handbook exactly:
1. Are there any shifts in location?
2. Are there any shifts in variation?
3. Are there any outliers?

### Importance
**PASS.** The site correctly states that for the default model Y=constant+error, "the error is assumed to be random, from a fixed distribution, and with constant location and scale" and the run-sequence plot checks these assumptions. This closely matches the handbook.

### Interpretation
**PASS.** The site's interpretation guidance (stable process, trends, shifts, oscillations) is consistent with the handbook's description and sample plot.

### Examples
**PASS.** The three examples (Stable Process, Location Shift, Trend) are reasonable characterizations. The handbook's sample plot shows a location shift (MAVRO.DAT). The site's examples cover the main diagnostic patterns.

### Case Study Reference
**PASS.** The site references 'filter-transmittance' (Section 1.4.2.6), which matches the handbook: "demonstrated in the Filter transmittance data case study."

### SVG Generator (`line-plot.ts`, run-sequence mode)
**PASS.** The generator:
- Plots data values vs observation index (1-based) -- correct
- Includes a dashed mean reference line in run-sequence mode -- appropriate
- Supports custom reference value override
- X-axis labeled "Observation", Y-axis labeled "Value" -- appropriate

---

## 4. Spectral Plot (NIST 1.3.3.27)

### Definition
**PASS.** The site's definition closely mirrors the handbook: "a graphical technique for examining cyclic structure in the frequency domain. It is a smoothed Fourier transform of the autocovariance function." The frequency range description (0 to 0.5 cycles per observation) and the unit-time definition also match.

### Purpose
**PASS.** The site correctly states:
- Used to identify dominant frequencies and periodicities
- Trends should be removed first (handbook confirms: "Trends should typically be removed")
- Used to find starting values for frequency in sinusoidal model (handbook confirms)

### Questions
**PASS.** The three questions match the handbook exactly:
1. How many cyclic components are there?
2. Is there a dominant cyclic frequency?
3. If there is a dominant cyclic frequency, what is it?

### Importance
**PASS.** The site says "primary technique for assessing the cyclic nature of univariate time series in the frequency domain" and "almost always the second plot (after a run sequence plot)." This is verbatim from the handbook.

### Interpretation
**PASS.** The site's interpretation covers:
- Flat spectrum = white noise (matches spectru1.htm)
- Peak near zero decaying rapidly = autoregressive (matches spectru2.htm)
- Single sharp peak = sinusoidal (matches spectru3.htm)

### Examples
**PASS.** All three examples match the handbook:
- **White Noise** (spectru1.htm): "flat, featureless spectrum" -- matches handbook "no dominant peaks... no distinct pattern"
- **Autoregressive** (spectru2.htm): "strong dominant peak near zero that decays rapidly" -- matches handbook exactly
- **Single Frequency** (spectru3.htm): "single dominant peak at a specific frequency" -- matches handbook

### Formulas
**PASS.** The sinusoidal model and autoregressive model formulas match the handbook. The frequency range formula `f_k = k/N` is a correct statement of the discrete frequency resolution.

### Assumptions
**PASS.** The site mentions trends should be removed, references Jenkins and Watts (1968) and Bloomfield (1976) -- both cited in the handbook. The frequency resolution note is accurate.

### SVG Generator (`spectral-plot.ts`)
**PASS.** The generator:
- Computes power spectrum via imported `powerSpectrum()` function
- Skips DC bin (index 0) -- appropriate
- Frequency range is [0, 0.5] cycles/sample -- correct
- Supports log scale for large dynamic ranges -- good engineering choice
- Area under curve is a nice visual touch

---

## 5. Complex Demodulation (NIST 1.3.3.8-9)

### Definition
**PASS.** The site says "extracts the time-varying amplitude and phase of a sinusoidal component at a specified frequency. It produces two companion plots: an amplitude plot showing how the strength of the cyclic component changes over time, and a phase plot used to improve the estimate of the frequency." This accurately combines both handbook pages (compdeam.htm for amplitude, compdeph.htm for phase).

### Purpose
**PASS.** The site correctly describes:
- Amplitude plot: checks if constant amplitude assumption is justifiable (handbook: "used to determine if the assumption of constant amplitude is justifiable")
- Phase plot: improve frequency estimate (handbook: "used to improve the estimate of the frequency")
- Phase slope interpretation: lines sloping left-to-right = increase frequency, right-to-left = decrease frequency, zero slope = correct. This exactly matches the handbook.

### Questions
**PASS.** The four questions match the handbook's amplitude plot questions (compdeam.htm) plus the phase plot question (compdeph.htm):
1. Does the amplitude change over time? (from compdeam.htm)
2. Are there any outliers? (from compdeam.htm)
3. Is the amplitude different at the beginning (start-up effect)? (from compdeam.htm)
4. Is the specified demodulation frequency correct? (from compdeph.htm)

### Importance
**PASS.** The site accurately states: "the non-linear fitting for the sinusoidal model is usually quite sensitive to the choice of good starting values. The initial estimate of omega is obtained from a spectral plot, and the phase plot assesses whether this estimate is adequate." This matches the handbook's compdeph.htm importance section almost verbatim.

### Formulas
**PASS.** Both formulas are correct:
- Constant amplitude sinusoidal model matches handbook
- Time-varying amplitude model with (B_0 + B_1*t_i) matches handbook: "the most common case is a linear fit"

### Interpretation
**PASS.** The amplitude and phase interpretation guidance matches the handbook's descriptions for both plots.

### Assumptions
**PASS.** The site correctly notes that the target frequency must be specified in advance (from spectral plot), and references Granger (1964) for computational details, matching the handbook.

### Python Code
**PASS.** The Python implementation:
- Uses LEW.DAT data (the handbook's example dataset)
- Correctly implements complex demodulation: multiply by cos/sin, apply low-pass filter (moving average)
- Amplitude plot uses correct frequency (0.3025) -- consistent with handbook's ~0.3 cycles/observation
- Phase plot intentionally uses wrong frequency (0.28) to show sawtooth drift -- this is a pedagogical choice to demonstrate the phase plot's purpose
- Amplitude computed as `2 * sqrt(re^2 + im^2)` -- standard complex demodulation amplitude formula

### No SVG Generator
**NOTE.** There is no dedicated SVG generator file for complex demodulation. This is expected since complex demodulation produces two separate plots (amplitude and phase) that may be rendered differently than the other techniques.

---

## Summary of Issues Found

### Errors: NONE

### Minor Issues:
1. **Inconsistent significance bounds between autocorrelation generators** (`autocorrelation-plot.ts` line 51 uses `1.96/sqrt(N)`, `line-plot.ts` line 169 uses `2/sqrt(N)`). Both are valid approximations but should be consistent. Recommend standardizing on `1.96/sqrt(N)` which is the exact value.

### Observations (not issues):
- The autocorrelation example ordering (White Noise, Strong, Moderate, Sinusoidal) differs from the handbook ordering (White Noise, Weak/Moderate, Strong, Sinusoidal). This is a valid presentation choice.
- The handbook calls its second autocorrelation example "Weak autocorrelation" in the link text but "Moderate Autocorrelation" in the page title. The site uses "Moderate Autocorrelation" consistently, which matches the page title.
- All formulas verified correct.
- All five techniques are factually accurate against the NIST handbook source material.

### Overall Assessment: PASS
All five time-series techniques are accurate representations of the NIST/SEMATECH handbook content. The one minor inconsistency found (significance bound formula discrepancy between two SVG generators) does not affect the textual content accuracy and is a code-level consistency issue rather than a factual error.
