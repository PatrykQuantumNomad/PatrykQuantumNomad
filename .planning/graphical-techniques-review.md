# EDA Graphical Techniques Review Report

**Date:** 2026-02-28
**Scope:** All 29 graphical technique pages vs. NIST/SEMATECH handbook source
**Reviewed by:** 7 parallel review agents

---

## Executive Summary

All 29 graphical techniques were reviewed against the NIST/SEMATECH e-Handbook source material. Each agent read the handbook HTML files, our technique-content TypeScript, SVG generators, and technique-renderer.ts, then compared definitions, plots, formulas, Python code, and completeness.

**Result:** The vast majority of content is correct. There are **3 critical errors** (factual mistakes that must be fixed), **5 significant issues** (missing NIST content or structural mismatches), and numerous minor items.

---

## CRITICAL ERRORS (Must Fix)

### 1. weibull-plot: Interpretation has REVERSED axes
**File:** `src/lib/eda/technique-content/combined-diagnostic.ts` ~line 69
**Problem:** The interpretation says "horizontal axis shows the Weibull probability scale ln(-ln(1-p)) and the vertical axis shows the natural logarithm of the data values." This is BACKWARDS.
**Correct:** Horizontal = log10(data values), Vertical = ln(-ln(1-p)). The SVG generator is correct; only the text is wrong.

### 2. weibull-plot: Shape parameter described as "slope" instead of "reciprocal of slope"
**File:** `src/lib/eda/technique-content/combined-diagnostic.ts` ~line 69
**Problem:** Interpretation says "The shape parameter beta equals the slope of the fitted line." NIST explicitly says "the shape parameter is the reciprocal of the slope of the fitted line." This contradicts the technique's own `definitionExpanded` and `formulas[0].explanation` which correctly say reciprocal.
**Fix:** Change "equals the slope" to "equals the reciprocal of the slope".

### 3. weibull-plot: "natural logarithm" should be "log base 10"
**File:** `src/lib/eda/technique-content/combined-diagnostic.ts` ~line 69
**Problem:** Interpretation says "natural logarithm of the data values." The handbook says "LOG10 scale" and the SVG generator uses `Math.log10`.
**Fix:** Change "natural logarithm" to "log base 10" (or "common logarithm").

---

## SIGNIFICANT ISSUES (Should Fix)

### 4. spectral-plot: Formula MISLABELED as "Blackman-Tukey"
**File:** `src/lib/eda/technique-content/time-series.ts`
**Problem:** First formula is labeled "Smoothed Power Spectral Density (Blackman-Tukey)" but shows the raw periodogram formula |DFT|²/N. The actual code computes a periodogram, not a Blackman-Tukey smoothed estimate.
**Fix:** Rename label to "Periodogram" or "Raw Power Spectral Density".

### 5. star-plot: Shows single star instead of multi-star grid
**File:** `src/lib/eda/svg-generators/star-plot.ts` + `technique-renderer.ts`
**Problem:** NIST star plot convention shows MULTIPLE stars (one per observation) in a grid format (e.g., 16 cars from AUTO79.DAT). Our SVG renders a single star polygon with abstract variables (Location, Scale, Skewness...). This misses the core comparative purpose of the technique. The Python code also shows only 3 overlaid polygons rather than a grid.
**Fix:** Refactor to show multiple small star plots in a grid, using multivariate data (e.g., product profiles or city comparisons).

### 6. scatter-plot: Missing 2 NIST variants, has 2 extra non-NIST variants
**File:** `src/lib/eda/technique-renderer.ts`
**Problem:** NIST has exactly 10 scatter plot examples. Our Tier B has 12 variants.
- **Missing:** "Exact Linear" (NIST 1.3.3.26.4, R=1 perfect fit) and "Homoscedastic" (NIST 1.3.3.26.8, constant Y variance)
- **Extra (not in NIST):** "Fan-shaped" and "Step Function"
- Variant order also doesn't match NIST section numbering
**Fix:** Add the 2 missing NIST variants. Consider removing or clearly marking the 2 non-NIST additions.

### 7. box-cox-normality: Renderer uses Blom formula instead of Filliben
**File:** `src/lib/eda/technique-renderer.ts` ~line 291
**Problem:** Uses Blom formula `(i + 1 - 0.375) / (n + 0.25)` for plotting positions instead of Filliben formula `(i + 1 - 0.3175) / (n + 0.365)`. The NIST handbook uses Filliben, and the `fillibenMedian` function already exists in `probability-plot.ts`.
**Fix:** Import and use `fillibenMedian` from probability-plot.ts. Also use the shared `normalQuantile` function instead of inline Abramowitz & Stegun approximation.

### 8. probability-plot: Metadata/implementation mismatch
**File:** `src/data/eda/techniques.json` + `src/lib/eda/technique-renderer.ts`
**Problem:** techniques.json says `"tier": "A", "variantCount": 0` but the renderer actually has 3 variants (Good Fit, S-Shaped Departure, Concave Departure) and the content file has 3 `examples` entries.
**Fix:** Either update to `"tier": "B", "variantCount": 3` or remove the variants from the renderer.

---

## TECHNIQUE-BY-TECHNIQUE STATUS

### Group 1: Time-Series (5 techniques)

| Technique | Status | Key Finding |
|---|---|---|
| **autocorrelation-plot** | Minor Issues | Variant labels diverge from NIST: our MA(1) ≠ NIST "Moderate Autocorrelation", our "Seasonal" ≠ NIST "Sinusoidal". Missing ARIMA widening confidence band formula. All 4 core formulas correct. |
| **lag-plot** | OK | Minor variant label wording differences. All formulas correct. Python valid. |
| **run-sequence-plot** | OK | Clean pass. No formulas needed. Python valid. |
| **spectral-plot** | Significant Issue | Formula mislabeled as "Blackman-Tukey" (see #4 above). Has 4 variants vs NIST's 3 (extra "Multiple Frequencies"). Missing sinusoidal model formula. |
| **complex-demodulation** | OK | Both formulas present and correct. Uses LEW.DAT (matching NIST). Python implements full algorithm correctly. |

### Group 2: Distribution-Shape Part 1 (4 techniques)

| Technique | Status | Key Finding |
|---|---|---|
| **histogram** | OK | All 8 variant labels match NIST examples. Freedman-Diaconis, Sturges', and density formulas all correct. Missing mention of cumulative/relative histogram variants in definition. |
| **bihistogram** | OK | Clean pass. No formulas needed per NIST. Python valid. |
| **box-plot** | OK | IQR, inner/outer fence formulas all correct and match NIST. Minor: SVG doesn't distinguish mild vs extreme outlier circle sizes. |
| **bootstrap-plot** | OK | Formulas correct. 6-panel layout (3 line + 3 histogram) matches NIST. Minor: uses B=100 subsamples vs recommended 500-1000. |

### Group 3: Distribution-Shape Part 2 (5 techniques)

| Technique | Status | Key Finding |
|---|---|---|
| **box-cox-linearity** | OK | Both Box-Cox formula cases (λ≠0 and λ=0→ln) correct. 3-panel SVG layout correct. Python valid. |
| **box-cox-normality** | Significant Issue | Renderer uses Blom instead of Filliben (see #7 above). PPCC formula correct. Missing confidence interval around PPCC peak. |
| **normal-probability-plot** | OK | Filliben medians formula correct. All 4 variant labels match NIST perfectly. Parameter estimation from fitted line correct. |
| **probability-plot** | Significant Issue | Metadata mismatch (see #8 above). Default uses lognormal data on Weibull scale instead of Weibull data. Core formulas correct. |
| **qq-plot** | OK | Two-sample implementation correct. Uses Hazen plotting positions (appropriate for Q-Q). ceramicStrength data matches NIST case study reference. |

### Group 4: Comparison (5 techniques)

| Technique | Status | Key Finding |
|---|---|---|
| **block-plot** | OK | All 9 NIST questions captured. Minor: techniques.json description says "means" but NIST block plot shows individual response values (content file is correct). |
| **mean-plot** | OK | Group mean and overall mean formulas correct. Minor: SVG renderer reuses DOE generator (visually works but not canonical mean plot style). |
| **std-deviation-plot** | OK | Group SD and overall SD formulas correct (sample n-1 denominator). Minor: reference line computed as average of group SDs, not pooled SD. |
| **star-plot** | Significant Issue | Single star instead of multi-star grid (see #5 above). Uses abstract variables instead of real multivariate data. |
| **youden-plot** | OK | Core concept correct. Minor: emphasizes median reference lines more than NIST does; adds quadrant analysis not explicitly in handbook. |

### Group 5: Regression (3 techniques)

| Technique | Status | Key Finding |
|---|---|---|
| **scatter-plot** | Significant Issue | Missing 2 NIST variants, has 2 extra (see #6 above). No `formulas` array despite NIST having formulas for quadratic, exponential, sinusoidal, heteroscedastic variants. |
| **linear-plots** | OK | All 4 sub-types (correlation, intercept, slope, residual SD) correctly documented. 8 questions match NIST (2 per sub-type). No formulas needed per NIST. |
| **6-plot** | OK | All 6 panels correctly described and positioned in 3×2 grid. Missing model formula Y_i = f(X_i) + E_i from NIST importance section. |

### Group 6: Multivariate + DOE (4 techniques)

| Technique | Status | Key Finding |
|---|---|---|
| **contour-plot** | OK | Definition nearly verbatim from NIST. SVG uses d3-contour correctly. Minor: interpretation adds concepts (saddle points, steepest ascent) beyond NIST source. |
| **scatterplot-matrix** | Minor Issues | Missing "Linking and Brushing" section from NIST. 4 questions match NIST. Python uses seaborn pairplot correctly. |
| **conditioning-plot** | Minor Issues | Missing 2 of 4 NIST questions ("outliers" and "base relationship"). Adds "shingles" term not in NIST. |
| **doe-plots** | OK | Uses exact BOXBIKE2.DAT data matching all 3 NIST sample plots. All 3 formulas (group mean, grand mean, group SD) correct. Python valid with correct design matrix. |

### Group 7: Combined-Diagnostic (3 techniques)

| Technique | Status | Key Finding |
|---|---|---|
| **ppcc-plot** | Minor Issues | Both formulas correct. Missing "use judgement when selecting" guidance and coarse-then-fine iteration advice from NIST. |
| **weibull-plot** | CRITICAL | 3 errors in interpretation text (see #1-3 above). Benard's approximation formula correct. SVG implementation correct — only the descriptive text is wrong. |
| **4-plot** | OK | All 4 panels in correct 2×2 positions. Questions capture all 16 NIST questions. Could use LEW.DAT instead of ZARR13.DAT to match NIST sample. |

---

## FORMULA AUDIT SUMMARY

| Technique | Formulas Present | All Correct? | Notes |
|---|---|---|---|
| autocorrelation-plot | 4 | Yes | Missing ARIMA widening confidence bands |
| lag-plot | 3 | Yes | AR, constant, sinusoidal models |
| spectral-plot | 2 | Mislabeled | "Blackman-Tukey" label on periodogram formula |
| complex-demodulation | 2 | Yes | Sinusoidal models |
| histogram | 3 | Yes | Freedman-Diaconis, Sturges', density |
| box-plot | 3 | Yes | IQR, inner fences, outer fences |
| bootstrap-plot | 2 | Yes | Resample, percentile CI |
| box-cox-linearity | 2 | Yes | Box-Cox transform, linearity measure |
| box-cox-normality | 2 | Yes | Box-Cox transform, PPCC curve |
| normal-probability-plot | 3 | Yes | Filliben medians, normal medians, parameter estimates |
| probability-plot | 3 | Yes | Order statistic medians, Filliben, PPCC |
| qq-plot | 2 | Yes | Quantile matching, Hazen positions |
| block-plot | 0 | N/A | None needed per NIST |
| mean-plot | 2 | Yes | Group mean, overall mean |
| std-deviation-plot | 2 | Yes | Group SD, overall SD |
| star-plot | 0 | N/A | None needed per NIST |
| youden-plot | 0 | N/A | None needed per NIST |
| scatter-plot | 0 | N/A | NIST variants have formulas we don't include |
| linear-plots | 0 | N/A | No formulas in NIST pages |
| 6-plot | 0 | N/A | Missing Y_i = f(X_i) + E_i from importance section |
| contour-plot | 0 | N/A | None needed per NIST |
| scatterplot-matrix | 0 | N/A | None needed |
| conditioning-plot | 0 | N/A | None needed |
| doe-plots | 3 | Yes | Group mean, grand mean, group SD |
| ppcc-plot | 2 | Yes | PPCC correlation, argmax |
| weibull-plot | 2 | Yes | CDF linearization, Benard's approximation |
| 4-plot | 1 | Yes | Matrix notation for 2×2 layout |

---

## PYTHON CODE AUDIT SUMMARY

All 29 Python examples were reviewed. **All are structurally valid** and produce the correct type of plot. No broken imports or API errors were found. Minor notes:

- **bootstrap-plot**: Uses B=100 subsamples; NIST recommends 500-1000
- **weibull-plot**: Pre-specifies shape parameter when generating AND fitting (somewhat circular)
- **star-plot**: Shows 3 overlaid polygons on one polar plot instead of separate star grid

---

## PRIORITY ACTION ITEMS

### P0 — Critical Fixes (factual errors)
1. Fix weibull-plot interpretation: reverse axis descriptions
2. Fix weibull-plot interpretation: shape = reciprocal of slope (not slope)
3. Fix weibull-plot interpretation: log base 10 (not natural logarithm)

### P1 — Significant Fixes
4. Fix spectral-plot formula label: "Periodogram" not "Blackman-Tukey"
5. Fix box-cox-normality renderer: use Filliben instead of Blom plotting positions
6. Fix probability-plot metadata: align tier/variantCount with implementation
7. Fix scatter-plot variants: add missing "Exact Linear" and "Homoscedastic"
8. Fix star-plot: redesign to show multi-star grid per NIST convention

### P2 — Minor Improvements
9. autocorrelation-plot: align variant labels with NIST example titles
10. conditioning-plot: add missing 2 NIST questions
11. scatterplot-matrix: add "Linking and Brushing" mention
12. 4-plot: switch dataset from ZARR13.DAT to LEW.DAT
13. scatter-plot: add formulas for quadratic/exponential/sinusoidal variants
14. 6-plot: add model formula Y_i = f(X_i) + E_i
15. ppcc-plot: add "use judgement" guidance from NIST
16. autocorrelation-plot: add ARIMA widening confidence band formula
