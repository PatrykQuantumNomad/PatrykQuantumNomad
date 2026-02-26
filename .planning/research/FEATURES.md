# Feature Research: EDA Case Study Deep Dive

**Domain:** EDA Case Study Enhancement -- NIST/SEMATECH Source Parity
**Researched:** 2026-02-26
**Confidence:** HIGH (sourced directly from NIST handbook pages and existing codebase)

---

## Case Study Inventory & Gap Analysis

### NIST Source Structure Summary

Each NIST case study follows one of four structural patterns:

| Pattern | Sections | Case Studies |
|---------|----------|-------------|
| **Standard (4-section)** | Background, Graphical Output, Quantitative Output, Work Yourself | Normal Random, Uniform Random, Cryothermometry, Filter Transmittance, Standard Resistor, Heat Flow Meter |
| **Model Development (5-section)** | Background, Test Assumptions, Develop Better Model, Validate New Model, Work Yourself | Random Walk, Beam Deflections |
| **Designed Experiment (6-section)** | Background, Response Analysis, Batch Effect, Lab Effect, Primary Factors, Work Yourself | Ceramic Strength |
| **Reliability (2-section)** | Background and Data, Graphical Output and Interpretation | Fatigue Life |

---

## Case Study 1: Normal Random Numbers (eda421)

**NIST Source:** https://www.itl.nist.gov/div898/handbook/eda/section4/eda421.htm
**Current Status:** Substantially complete
**Has Develop/Validate sections in NIST:** NO

### NIST Structure

1. **Background and Data** -- 500 standard normal N(0,1) from Rand Corporation
2. **Graphical Output and Interpretation** -- 4-plot, run sequence, lag, histogram w/normal PDF overlay, normal probability plot
3. **Quantitative Output and Interpretation** -- summary stats, location test, Bartlett's test, runs test, autocorrelation, Anderson-Darling, PPCC, Grubbs' test, confidence intervals
4. **Work This Example Yourself** -- Dataplot/R code

### NIST Plots

| Plot | In NIST | Currently Implemented | Gap |
|------|---------|----------------------|-----|
| 4-Plot | YES | YES | None |
| Run Sequence Plot | YES | YES | None |
| Lag Plot | YES | YES | None |
| Histogram w/Normal PDF | YES | YES | None |
| Normal Probability Plot | YES | YES | None |
| Autocorrelation Plot | YES (in quantitative) | YES | None |
| Spectral Plot | NO (not in NIST) | YES (bonus) | Extra -- keep it |

### NIST Quantitative Tests

| Test | In NIST | Currently Implemented | Gap |
|------|---------|----------------------|-----|
| Summary statistics (mean, median, min, max, range, SD) | YES | YES | None |
| Location regression (slope t-test) | YES | YES | None |
| Bartlett's test (variance homogeneity) | YES | YES | None |
| Runs test | YES | YES | None |
| Lag-1 autocorrelation | YES | YES | None |
| Anderson-Darling | YES | YES | None |
| PPCC (normal) | YES | YES | None |
| Chi-square goodness-of-fit | YES | NO | Minor gap |
| Kolmogorov-Smirnov test | YES (mentioned) | NO | Minor gap |
| Grubbs' test | YES | YES | None |
| 95% CI for mean | YES | YES | None |
| 95% CI for standard deviation | YES | NO | Minor gap |

### What Makes This Case Study Unique
- **Ideal baseline** -- all 4 assumptions hold; serves as the reference for comparing against studies where assumptions fail
- Only study using Bartlett's test (others use Levene for non-normal data)
- Marginal rejection of normality despite data actually being normal -- demonstrates high-power test issue

### Gap Assessment: MINOR
Current implementation is nearly at parity. Missing: chi-square goodness-of-fit mention, K-S mention, CI for standard deviation. These are LOW priority since core content is complete.

---

## Case Study 2: Uniform Random Numbers (eda422)

**NIST Source:** https://www.itl.nist.gov/div898/handbook/eda/section4/eda422.htm
**Current Status:** Substantially complete
**Has Develop/Validate sections in NIST:** NO

### NIST Structure

1. **Background and Data** -- 500 uniform U(0,1) from Rand Corporation
2. **Graphical Output and Interpretation** -- 4-plot, run sequence, lag, histogram w/normal PDF, histogram w/uniform PDF, normal probability plot, uniform probability plot, bootstrap plots for location estimator comparison
3. **Quantitative Output and Interpretation** -- summary stats, location test, Levene test, runs test, autocorrelation, Anderson-Darling (normal + uniform), PPCC (normal + uniform), skewness/kurtosis, confidence intervals, mid-range estimator
4. **Work This Example Yourself** -- Dataplot/R code

### NIST Plots

| Plot | In NIST | Currently Implemented | Gap |
|------|---------|----------------------|-----|
| 4-Plot | YES | YES | None |
| Run Sequence Plot | YES | YES | None |
| Lag Plot | YES | YES | None |
| Histogram w/Normal PDF | YES | YES | None |
| Histogram w/Uniform PDF | YES | NO | **GAP** |
| Normal Probability Plot | YES | YES | None |
| Uniform Probability Plot | YES | YES | None |
| Bootstrap Plots (4 estimators) | YES | NO | **GAP** |
| Autocorrelation Plot | YES (in quantitative) | YES | None |
| Spectral Plot | NO (not in NIST) | YES (bonus) | Extra -- keep it |

### NIST Quantitative Tests

| Test | In NIST | Currently Implemented | Gap |
|------|---------|----------------------|-----|
| Summary statistics | YES | YES | None |
| Location regression (slope t-test) | YES | YES | None |
| Levene test | YES | YES | None |
| Runs test | YES | YES | None |
| Lag-1 autocorrelation | YES | YES | None |
| Anderson-Darling (normal) | YES | YES | None |
| Anderson-Darling (uniform) | YES | YES | None |
| PPCC (normal) | YES | YES | None |
| PPCC (uniform) | YES | YES | None |
| Skewness/kurtosis | YES | YES | None |
| Mid-range estimator | YES | YES | None |
| Bootstrap CI comparison | YES | NO | **GAP** |
| Grubbs' test | YES (implied) | YES | None |

### What Makes This Case Study Unique
- **Non-normal distribution detection** -- 3 of 4 assumptions hold, only distribution fails
- **Estimator comparison** -- NIST compares mean, median, mid-range, and MAD via bootstrap
- **Square-shaped lag plot** (bounded support) vs. circular (unbounded)
- Demonstrates uniform PPCC and Anderson-Darling as better alternatives

### Gap Assessment: MODERATE
Missing bootstrap comparison plots for location estimators (unique NIST feature), histogram with uniform PDF overlay. The bootstrap analysis is a distinguishing feature of this case study.

---

## Case Study 3: Random Walk (eda423)

**NIST Source:** https://www.itl.nist.gov/div898/handbook/eda/section4/eda423.htm
**Current Status:** GOLD STANDARD (fully enhanced)
**Has Develop/Validate sections in NIST:** YES

### Gap Assessment: NONE
Already at full NIST parity with 16 plot types, detailed quantitative results, develop/validate model sections. This is the reference implementation for all other case studies.

---

## Case Study 4: Cryothermometry (eda424)

**NIST Source:** https://www.itl.nist.gov/div898/handbook/eda/section4/eda424.htm
**Current Status:** Moderately complete
**Has Develop/Validate sections in NIST:** NO

### NIST Structure

1. **Background and Data** -- 700 voltage count measurements, discrete integer data, collected by Bob Soulen Oct 1971
2. **Graphical Output and Interpretation** -- 4-plot, run sequence, lag, histogram w/normal PDF, normal probability plot
3. **Quantitative Output and Interpretation** -- summary stats, location test, Levene test, runs test, autocorrelation, Anderson-Darling, PPCC, Grubbs' test, adjusted CI
4. **Work This Example Yourself** -- Dataplot/R code

### NIST Plots

| Plot | In NIST | Currently Implemented | Gap |
|------|---------|----------------------|-----|
| 4-Plot | YES | YES | None |
| Run Sequence Plot | YES | YES | None |
| Lag Plot | YES | YES | None |
| Histogram w/Normal PDF | YES | YES | None |
| Normal Probability Plot | YES | YES | None |
| Autocorrelation Plot | YES (in quantitative) | YES | None |
| Spectral Plot | NO (not in NIST) | YES (bonus) | Extra -- keep it |

### NIST Quantitative Tests

| Test | In NIST | Currently Implemented | Gap |
|------|---------|----------------------|-----|
| Summary statistics | YES | YES | None |
| Location regression (slope t-test) | YES | YES | None |
| Levene test | YES | YES | None |
| Runs test | YES | YES | None |
| Lag-1 autocorrelation | YES | YES | None |
| Anderson-Darling | YES | YES | None |
| Normal PPCC | YES | YES | None |
| Grubbs' test | YES | YES | None |
| Autocorrelation-adjusted CI | YES | YES | None |

### What Makes This Case Study Unique
- **Discrete integer data** -- only a few distinct values with many repeats
- Grid-like artifacts in lag plot and staircase in normal probability plot
- Demonstrates statistically significant but practically negligible effects (location drift)
- Mild violations -- borderline case where univariate model is still acceptable

### Gap Assessment: MINOR
Current implementation is nearly at NIST parity. The existing content covers all NIST sections. Minor refinements only: ensure the "statistically significant but practically negligible" distinction is clearly emphasized, verify all test statistics match NIST values exactly.

---

## Case Study 5: Beam Deflections (eda425)

**NIST Source:** https://www.itl.nist.gov/div898/handbook/eda/section4/eda425.htm
**Current Status:** Moderate -- has develop/validate skeleton but lacks depth
**Has Develop/Validate sections in NIST:** YES

### NIST Structure

1. **Background and Data** -- 200 measurements, H.S. Lew 1969, steel-concrete beam deflections
2. **Test Underlying Assumptions** -- 4-plot, run sequence, lag, histogram, normal prob plot, autocorrelation, spectral
3. **Develop a Better Model** -- complex demodulation (phase + amplitude plots), nonlinear least squares sinusoidal regression, parameter estimates with standard errors, outlier sensitivity analysis
4. **Validate New Model** -- 4-plot of residuals, run sequence, lag, autocorrelation of residuals, sensitivity analysis (3 outliers removed), 4-plot with outliers removed
5. **Work This Example Yourself** -- Dataplot/R code

### NIST Plots

| Plot | In NIST | Currently Implemented | Gap |
|------|---------|----------------------|-----|
| 4-Plot | YES | YES | None |
| Run Sequence Plot | YES | YES | None |
| Lag Plot | YES | YES | None |
| Histogram | YES | YES | None |
| Normal Probability Plot | YES | YES | None |
| Autocorrelation Plot | YES | YES | None |
| Spectral Plot | YES | YES | None |
| Complex Demodulation Phase Plot | YES | NO | **GAP** |
| Complex Demodulation Amplitude Plot | YES | NO | **GAP** |
| Residual 4-Plot | YES | YES (skeleton) | **Needs data** |
| Residual Run Sequence | YES | YES (skeleton) | **Needs data** |
| Residual Lag Plot | YES | YES (skeleton) | **Needs data** |
| Residual Histogram | YES | YES (skeleton) | **Needs data** |
| Residual Normal Probability Plot | YES | YES (skeleton) | **Needs data** |
| Residual Autocorrelation Plot | YES | YES (skeleton) | **Needs data** |
| 4-Plot (outliers removed) | YES | NO | **GAP** |

### NIST Quantitative Results -- Develop/Validate Section

| Feature | In NIST | Currently Implemented | Gap |
|---------|---------|----------------------|-----|
| Spectral frequency identification (f=0.3025) | YES | Partially (text only) | **Needs computation** |
| Complex demodulation for refined frequency | YES | NO | **GAP** |
| Nonlinear least squares: C, AMP, FREQ, PHASE params | YES | NO | **GAP** |
| Parameter estimates with SE and t-values | YES | NO | **GAP** |
| Residual SD comparison (before/after) | YES | Partial (text only) | **Needs computation** |
| Outlier identification (3 outliers) | YES | NO | **GAP** |
| Outlier sensitivity analysis | YES | NO | **GAP** |
| Location test on residuals | YES | NO | **GAP** |
| Variation test on residuals (Levene) | YES | NO | **GAP** |
| Runs test on residuals | YES | NO | **GAP** |
| Summary statistics table | YES | YES | None |
| Location regression (slope t-test) | YES | YES | None |
| Levene test | YES | YES | None |
| Runs test | YES | YES | None |

### NIST Parameter Estimates (from source)

| Parameter | Estimate | Std Error | t-Value |
|-----------|----------|-----------|---------|
| C (constant) | -178.786 | 11.02 | -16.22 |
| AMP (amplitude) | -361.766 | 26.19 | -13.81 |
| FREQ (frequency) | 0.302596 | 0.0001510 | 2005.00 |
| PHASE | 1.46536 | 0.04909 | 29.85 |

After removing 3 outliers: residual SD drops from 155.84 to 148.34 (5% reduction), parameter estimates barely change.

### What Makes This Case Study Unique
- **Periodic (sinusoidal) structure** -- the only case study with cyclic non-randomness (vs. drift-based)
- **Complex demodulation** -- a technique unique to this case study for refining frequency estimates
- **Nonlinear regression** -- fitting sin() model with 4 parameters
- **Outlier sensitivity analysis** -- demonstrates that removing 3 outliers reduces residual SD by 5% but barely changes parameter estimates

### Gap Assessment: SIGNIFICANT
The develop/validate sections exist as skeletons with placeholder text but lack computed residual data, actual sinusoidal model fitting, and complex demodulation analysis. This is one of the most complex case studies requiring nonlinear regression implementation. The residual plot components exist but need actual residual data computed from the sinusoidal fit.

---

## Case Study 6: Filter Transmittance (eda426)

**NIST Source:** https://www.itl.nist.gov/div898/handbook/eda/section4/eda426.htm
**Current Status:** Moderately complete
**Has Develop/Validate sections in NIST:** NO

### NIST Structure

1. **Background and Data** -- 50 measurements, Radu Mavrodineaunu 1970s, glass filter transmittance
2. **Graphical Output and Interpretation** -- 4-plot, run sequence, lag, histogram, normal probability plot
3. **Quantitative Output and Interpretation** -- summary stats, location test, Levene test, runs test, autocorrelation, root cause investigation
4. **Work This Example Yourself** -- Dataplot/R code

### NIST Plots

| Plot | In NIST | Currently Implemented | Gap |
|------|---------|----------------------|-----|
| 4-Plot | YES | YES | None |
| Run Sequence Plot | YES | YES | None |
| Lag Plot | YES | YES | None |
| Histogram | YES | Implied in 4-plot | Minor |
| Normal Probability Plot | YES | Implied in 4-plot | Minor |
| Autocorrelation Plot | YES | YES | None |
| Spectral Plot | NO | YES (bonus) | Extra -- keep |

### NIST Quantitative Tests

| Test | In NIST | Currently Implemented | Gap |
|------|---------|----------------------|-----|
| Summary statistics | YES | YES | None |
| Location regression (slope t-test) | YES | YES | None |
| Levene test | YES | YES | None |
| Runs test | YES | YES | None |
| Lag-1 autocorrelation | YES | YES | None |
| Distribution tests | Omitted (non-random) | Omitted | None |
| Outlier tests | Omitted (non-random) | Omitted | None |

### What Makes This Case Study Unique
- **Root cause investigation** -- the only case study where the resolution is "fix the instrument" rather than "fit a better model"
- Sampling rate too fast = measurement contamination from previous reading
- Smallest dataset (n=50)
- Location shift around observation 35

### Gap Assessment: MINOR
Current implementation is close to NIST parity. The Root Cause Investigation section is already well-written. Minor refinements only: ensure the "instrumentation problem" narrative is as prominent as in NIST.

---

## Case Study 7: Standard Resistor (eda427) -- NEW

**NIST Source:** https://www.itl.nist.gov/div898/handbook/eda/section4/eda427.htm
**Current Status:** DOES NOT EXIST -- needs full creation
**Has Develop/Validate sections in NIST:** NO

### NIST Structure

1. **Background and Data** -- 1000 measurements, Ron Dziuba 1980-1985, resistor values over 5 years
2. **Graphical Output and Interpretation** -- 4-plot, run sequence, lag plot
3. **Quantitative Output and Interpretation** -- summary stats, location test, Levene test, runs test, autocorrelation, root cause analysis (seasonal humidity effects)
4. **Work This Example Yourself** -- Dataplot/R code

### NIST Plots

| Plot | Needed |
|------|--------|
| 4-Plot | YES |
| Run Sequence Plot | YES |
| Lag Plot | YES |
| Histogram | YES |
| Normal Probability Plot | YES |
| Autocorrelation Plot | YES |
| Spectral Plot | YES (bonus, consistent with others) |

### NIST Quantitative Tests (values from source)

| Test | Value from NIST |
|------|-----------------|
| Sample size | 1000 |
| Mean | 28.01634 |
| Median | 28.02910 |
| Standard deviation | 0.06349 |
| Range | 0.29050 |
| Location regression slope t-value | 100.2 (significant -- reject) |
| Levene test W | 140.85 (critical: 2.614 -- reject) |
| Lag-1 autocorrelation | 0.97 (critical: +/-0.062 -- reject) |
| Runs test Z | -30.5629 (reject) |

### What Makes This Case Study Unique
- **Violations of BOTH location AND variation** -- the only case study where both drift AND scale change are detected
- **Seasonal humidity effect** -- root cause is environmental (winter vs. summer), not instrumentation
- **Long time series** (5 years, n=1000) -- largest dataset
- **Extreme autocorrelation** (r1=0.97) comparable to random walk
- All three non-distributional assumptions fail catastrophically

### Required New Assets
1. **Dataset:** ZARR14.DAT needs to be added to `datasets.ts` (1000 values)
2. **Plot Component:** `StandardResistorPlots.astro` (new file)
3. **MDX Page:** `standard-resistor.mdx` (new file)
4. **Route:** Add to case study routing
5. **Dataset metadata:** Add to dataset registry

### Gap Assessment: FULL BUILD
Entirely new case study. Requires dataset acquisition, full page authoring, plot component creation, and integration into the case study navigation.

---

## Case Study 8: Heat Flow Meter (eda428)

**NIST Source:** https://www.itl.nist.gov/div898/handbook/eda/section4/eda428.htm
**Current Status:** Substantially complete
**Has Develop/Validate sections in NIST:** NO

### NIST Structure

1. **Background and Data** -- 195 measurements, Bob Zarr Jan 1990, calibration factor
2. **Graphical Output and Interpretation** -- 4-plot, run sequence, lag, histogram w/normal PDF, normal probability plot
3. **Quantitative Output and Interpretation** -- summary stats, location test, Bartlett's test, runs test, autocorrelation, Anderson-Darling, PPCC, Grubbs' test
4. **Work This Example Yourself** -- Dataplot/R code

### NIST Plots

| Plot | In NIST | Currently Implemented | Gap |
|------|---------|----------------------|-----|
| 4-Plot | YES | YES | None |
| Run Sequence Plot | YES | YES | None |
| Lag Plot | YES | YES | None |
| Histogram w/Normal PDF | YES | YES | None |
| Normal Probability Plot | YES | YES | None |
| Autocorrelation Plot | YES | YES | None |
| Spectral Plot | NO | YES (bonus) | Extra -- keep |

### NIST Quantitative Tests

| Test | In NIST | Currently Implemented | Gap |
|------|---------|----------------------|-----|
| Summary statistics | YES | YES | None |
| Location regression (slope t-test) | YES | YES | None |
| Bartlett's test | YES | YES | None |
| Runs test | YES | YES | None |
| Lag-1 autocorrelation | YES | YES | None |
| Anderson-Darling | YES | YES | None |
| PPCC (normal) | YES | YES | None |
| Grubbs' test | YES | YES | None |
| 95% CI for mean | YES | YES | None |
| 95% CI for SD | YES | NO | Minor gap |

### What Makes This Case Study Unique
- **Well-behaved process** -- demonstrates the "positive" case like Normal Random but with real measurement data
- **Mild randomness violation** -- r1=0.281, runs test rejects, but NIST says "not serious enough to warrant a more complex model"
- **Borderline location test** -- t=-1.960 exactly at critical value, but practically negligible
- **Judgment calls** -- emphasizes when to accept mild violations vs. when to model them

### Gap Assessment: MINOR
Implementation is nearly at parity. Missing only CI for standard deviation. Content quality is good.

---

## Case Study 9: Fatigue Life (eda429)

**NIST Source:** https://www.itl.nist.gov/div898/handbook/eda/section4/eda429.htm
**Current Status:** Moderate -- needs significant enhancements
**Has Develop/Validate sections in NIST:** NO (but has unique model selection approach)

### NIST Structure

1. **Background and Data** -- 101 fatigue life measurements, Birnbaum & Saunders 1958, 6061-T6 aluminum
2. **Graphical Output and Interpretation** -- dot charts, box plots, histograms, kernel density, QQ plots (normal, Gaussian with envelope, fitted density comparisons for 4 distributions), comparative QQ plots

### NIST Plots

| Plot | In NIST | Currently Implemented | Gap |
|------|---------|----------------------|-----|
| Dot Chart | YES | NO | **GAP** |
| Box Plot | YES | YES | None |
| Histogram | YES | YES | None |
| Kernel Density Estimate | YES | NO | **GAP** |
| Normal QQ Plot | YES | YES | None |
| Simulated QQ Envelope (99 samples) | YES | NO | **GAP** |
| Fitted Density Curves (4 distributions) | YES | Partial (text only) | **GAP** |
| Comparative QQ Plots (4 distributions) | YES | NO | **GAP** |
| 4-Plot | NO (not in NIST) | YES (bonus) | Extra -- keep |
| Run Sequence Plot | NO (not in NIST) | YES (bonus) | Extra -- keep |
| Lag Plot | NO (not in NIST) | YES (bonus) | Extra -- keep |
| Autocorrelation Plot | NO (not in NIST) | YES (bonus) | Extra -- keep |
| Spectral Plot | NO (not in NIST) | YES (bonus) | Extra -- keep |

### NIST Quantitative Tests

| Test | In NIST | Currently Implemented | Gap |
|------|---------|----------------------|-----|
| Summary statistics | YES | YES | None |
| MLE parameter estimates (4 distributions) | YES | Partial (text) | **Needs computation** |
| AIC comparison | YES | YES (text) | Verify values |
| BIC comparison | YES | YES (text) | Verify values |
| Posterior probabilities | YES | YES (text) | Verify values |
| 0.1st percentile estimate | YES | YES (text) | None |
| Bootstrap CI for percentile (5000 samples) | YES | YES (text) | None |
| One-sided 95% prediction interval | YES | NO | **GAP** |

### What Makes This Case Study Unique
- **Probability model selection** -- the ONLY case study focused on choosing among distributions (not testing assumptions)
- Compares Normal, Gamma, Birnbaum-Saunders, and 3-parameter Weibull
- **Reliability engineering** context -- failure prediction, B-life estimation
- Uses AIC/BIC model comparison and bootstrap confidence intervals
- Demonstrates that formal model selection (Gaussian wins) can surprise when the histogram looks skewed

### Gap Assessment: SIGNIFICANT
The case study has a fundamentally different structure from the standard EDA template. Key missing features:
1. Dot chart visualization
2. Kernel density estimate overlays
3. Simulated QQ envelope (99 Gaussian samples)
4. Comparative fitted density curves for 4 candidate distributions
5. Side-by-side QQ plots for model comparison
6. One-sided prediction interval
These are the core distinguishing features of this case study.

---

## Case Study 10: Ceramic Strength (eda42a)

**NIST Source:** https://www.itl.nist.gov/div898/handbook/eda/section4/eda42a.htm
**Current Status:** Moderate -- unique multi-factor structure partially implemented
**Has Develop/Validate sections in NIST:** NO (but has unique DOE structure)

### NIST Structure

1. **Background and Data** -- 480 observations (longitudinal only from 960 total), Said Jahanmir 1996, 2^3 factorial with batch/lab blocking
2. **Analysis of the Response Variable** -- 4-plot, summary statistics, bimodal detection
3. **Analysis of Batch Effect** -- bihistogram, QQ plot (batch comparison), box plots by batch, block plots (8 labs x 2 batches), F-test for equal variances, two-sample t-test
4. **Analysis of Lab Effect** -- box plots by lab (overall, by batch), conclude labs are homogeneous
5. **Analysis of Primary Factors** -- DOE scatter plots, DOE mean plots, DOE SD plots, interaction effects, ranked effects tables (by batch)
6. **Work This Example Yourself** -- Dataplot/R code

### NIST Plots

| Plot | In NIST | Currently Implemented | Gap |
|------|---------|----------------------|-----|
| 4-Plot | YES | YES | None |
| Run Sequence Plot | YES | YES | None |
| Lag Plot | YES | YES | None |
| Histogram (bimodal) | YES | YES | None |
| Normal Probability Plot | YES | YES | None |
| Bihistogram (Batch 1 vs 2) | YES | NO | **GAP** |
| QQ Plot (Batch 1 vs Batch 2) | YES | NO | **GAP** |
| Box Plots by Batch | YES | YES | None |
| Block Plots (8 labs x 2 batches) | YES | NO | **GAP** |
| Box Plots by Lab (overall) | YES | NO | **GAP** |
| Box Plots by Lab (per batch) | YES | NO | **GAP** |
| DOE Scatter Plots (per factor) | YES | NO | **GAP** |
| DOE Mean Plots (per factor) | YES | NO | **GAP** |
| DOE SD Plots (per factor) | YES | NO | **GAP** |
| Interaction Effects Plots | YES | NO | **GAP** |

### NIST Quantitative Tests

| Test | In NIST | Currently Implemented | Gap |
|------|---------|----------------------|-----|
| Summary statistics (pooled) | YES | YES | None |
| Summary statistics (by batch) | YES | YES | None |
| F-test for equal variances | YES | YES | None |
| Two-sample t-test | YES | YES | None |
| Ranked effects (Batch 1) | YES | YES | None |
| Ranked effects (Batch 2) | YES | YES | None |
| Anderson-Darling (pooled) | YES | YES | None |
| Grubbs' test (within-group) | YES | YES | None |
| DOE main effects estimates | YES | Partial (text) | **Needs computation** |
| DOE interaction effects estimates | YES | Partial (text) | **Needs computation** |

### What Makes This Case Study Unique
- **Multi-factor designed experiment** -- the ONLY case study with a DOE structure (2^3 factorial)
- **Bimodal discovery** -- histogram reveals completely unexpected batch effect of ~78 units
- **Inconsistent factor rankings** across batches -- X1 dominates Batch 1, X2 dominates Batch 2
- **Multiple nuisance factors** -- batch (significant) and lab (negligible)
- Requires specialized DOE plots (mean plots, SD plots, block plots, interaction plots)

### Gap Assessment: SIGNIFICANT
The DOE-specific visualizations are the most complex missing features. Key gaps:
1. Bihistogram generator (new plot type needed)
2. QQ plot comparing two groups (new variant)
3. Block plots (new plot type)
4. DOE mean/SD plots by factor level (new plot types)
5. Box plots by lab (extension of existing box plot)
6. Interaction effects visualization

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that must be present for each case study to match NIST source quality.

| Feature | Why Expected | Complexity | Affected Case Studies |
|---------|--------------|------------|----------------------|
| Complete NIST test statistics with exact values | Source parity with NIST handbook | LOW | All 8 non-gold-standard |
| All NIST graphical outputs reproduced | Core visual content | MEDIUM | Beam Deflections, Fatigue Life, Ceramic Strength |
| Test Summary table with all assumption results | Standard structure across all case studies | LOW | All (mostly done) |
| Background section with dataset context | Foundation for analysis | LOW | Standard Resistor (new) |
| Conclusions with model recommendation | Analysis resolution | LOW | Verify all match NIST |
| CaseStudyDataset component for each study | Interactive data exploration | LOW | Standard Resistor (new) |

### Differentiators (Competitive Advantage)

Features that go beyond NIST parity and add unique value.

| Feature | Value Proposition | Complexity | Affected Case Studies |
|---------|-------------------|------------|----------------------|
| Interactive plot variant swapping | Explore plots without leaving page | LOW | Already exists, extend to new plots |
| Bonus plots (spectral, autocorrelation) beyond NIST | More thorough analysis than source | LOW | Already implemented for most |
| Cross-references between case studies | Connect related concepts | LOW | All |
| KaTeX formula rendering | Professional mathematical notation | LOW | Already exists |
| Interpretation sections (beyond NIST) | Deeper pedagogical value | MEDIUM | Random Walk has this, extend to others |
| Build-time SVG generation | Zero client-side JS, perfect Core Web Vitals | LOW | Architecture already supports this |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Client-side interactive D3 plots | Zoom, pan, hover on charts | Breaks Astro static build, hurts Core Web Vitals, adds JS bundle | Build-time SVG with PlotVariantSwap component |
| Downloadable Dataplot/R code | NIST has "Work This Example Yourself" | Out of scope for web encyclopedia, maintenance burden | Link to NIST source for code |
| Real-time computation | Compute statistics live in browser | Violates zero-JS architecture, not needed for static content | Build-time computation in Astro frontmatter |
| Complex demodulation implementation | NIST Beam Deflections uses it | Highly specialized algorithm, overkill for educational content | Document the technique with text and formulas, show NIST results without reimplementing algorithm |

---

## Feature Dependencies

```
Standard Resistor Dataset (new)
    |-- requires --> datasets.ts addition (ZARR14.DAT, 1000 values)
    |-- requires --> StandardResistorPlots.astro (new component)
    |-- requires --> standard-resistor.mdx (new page)
    |-- requires --> Case study routing update

Beam Deflections Residual Plots (enhancement)
    |-- requires --> Sinusoidal model fitting (nonlinear regression in statistics.ts)
    |-- requires --> Residual computation pipeline
    |-- enhances --> Existing BeamDeflectionPlots.astro

Fatigue Life Model Selection Plots (enhancement)
    |-- requires --> Fitted density curve overlay (new generator or extension)
    |-- requires --> QQ plot for multiple distributions (probability-plot.ts extension)
    |-- requires --> Dot chart generator (new or extend scatter-plot.ts)
    |-- requires --> Kernel density overlay (KDE already in statistics.ts)

Ceramic Strength DOE Plots (enhancement)
    |-- requires --> Bihistogram generator (new or extend histogram.ts)
    |-- requires --> Block plot generator (new)
    |-- requires --> DOE mean/SD plot generator (new or extend bar-plot.ts)
    |-- requires --> Multi-group box plot (extend box-plot.ts)
    |-- requires --> Interaction plot generator (new)

All Case Studies
    |-- depend on --> Existing SVG generators (13+ types)
    |-- depend on --> Existing statistics.ts math library
    |-- depend on --> Existing datasets.ts data
    |-- depend on --> PlotVariantSwap.astro for interactivity
```

### Dependency Notes

- **Standard Resistor requires new dataset:** The ZARR14.DAT file must be sourced from NIST and added to datasets.ts before any work can begin
- **Beam Deflections residuals require nonlinear regression:** A sinusoidal model fitter is needed in statistics.ts; this is mathematically non-trivial but the NIST source provides the parameter values, so hardcoding results is an option
- **Fatigue Life needs multiple distribution fitting:** MLE for Gamma, Weibull, Birnbaum-Saunders requires new math functions; alternatively, hardcode the NIST parameter values
- **Ceramic Strength needs new plot types:** Bihistogram, block plot, and DOE mean/SD plots are not covered by existing generators and require new SVG generator code

---

## MVP Definition

### Launch With (Priority 1 -- Highest Impact, Lowest Risk)

Case studies that are nearly at NIST parity and need only minor refinements:

- [ ] **Normal Random Numbers** -- verify all test statistics match NIST exactly, add CI for SD
- [ ] **Cryothermometry** -- minor text refinements, verify discreteness discussion
- [ ] **Filter Transmittance** -- minor text refinements, verify root cause narrative
- [ ] **Heat Flow Meter** -- add CI for SD, verify borderline location test discussion

### Add After MVP (Priority 2 -- Moderate Effort)

- [ ] **Standard Resistor (NEW)** -- full new case study build (dataset + component + page)
- [ ] **Uniform Random Numbers** -- add histogram with uniform PDF overlay, bootstrap comparison discussion

### Complex Enhancements (Priority 3 -- High Effort, High Value)

- [ ] **Beam Deflections** -- implement sinusoidal model fitting, compute residuals, populate residual plots, add parameter tables
- [ ] **Fatigue Life** -- implement distribution comparison plots (dot chart, fitted densities, comparative QQ), verify model selection numbers
- [ ] **Ceramic Strength** -- implement DOE-specific plots (bihistogram, block plots, DOE mean/SD plots, interaction plots)

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority | Case Study |
|---------|------------|---------------------|----------|------------|
| Verify test statistics (4 studies) | HIGH | LOW | P1 | Normal, Cryo, Filter, Heat Flow |
| Standard Resistor full build | HIGH | MEDIUM | P1 | Standard Resistor |
| Beam Deflections sinusoidal model + residuals | HIGH | HIGH | P2 | Beam Deflections |
| Uniform bootstrap comparison | MEDIUM | MEDIUM | P2 | Uniform Random |
| Fatigue Life distribution plots | HIGH | HIGH | P2 | Fatigue Life |
| Ceramic Strength DOE plots | HIGH | HIGH | P3 | Ceramic Strength |
| Complex demodulation plots | LOW | HIGH | P3 | Beam Deflections |
| CI for standard deviation | LOW | LOW | P2 | Normal, Heat Flow |
| Dot chart generator | MEDIUM | LOW | P2 | Fatigue Life |
| Bihistogram generator | MEDIUM | MEDIUM | P3 | Ceramic Strength |
| Block plot generator | MEDIUM | HIGH | P3 | Ceramic Strength |
| DOE mean/SD plots | MEDIUM | MEDIUM | P3 | Ceramic Strength |

---

## Competitor Feature Analysis

| Feature | NIST/SEMATECH (source) | Our Implementation | Assessment |
|---------|------------------------|-------------------|------------|
| Plot images | Low-res raster GIFs from 1990s | Build-time SVG, responsive, dark mode | We are BETTER |
| Dataplot code examples | Yes, with R code | No code examples | Intentional omission (link to NIST) |
| Mathematical formulas | ASCII math notation | KaTeX rendered LaTeX | We are BETTER |
| Navigation/cross-references | Basic hyperlinks | Breadcrumbs + cross-study links | We are BETTER |
| Dataset downloads | .DAT text files | Inline data display component | We are BETTER |
| Mobile responsiveness | Not responsive | Fully responsive | We are BETTER |
| Accessibility | Minimal alt text | SVG aria labels, semantic HTML | We are BETTER |
| SEO/structured data | None | JSON-LD, Open Graph | We are BETTER |

---

## Sources

- NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.4.2 (all subsections fetched directly via WebFetch):
  - Normal Random Numbers: eda421, eda4211-4214
  - Uniform Random Numbers: eda422, eda4221-4224
  - Random Walk: eda423 (reference only)
  - Cryothermometry: eda424, eda4241-4244
  - Beam Deflections: eda425, eda4251-4255
  - Filter Transmittance: eda426, eda4261-4264
  - Standard Resistor: eda427, eda4271-4274
  - Heat Flow Meter: eda428, eda4281-4284
  - Fatigue Life: eda429, eda4291-4292
  - Ceramic Strength: eda42a, eda42a1-42a6
- Existing codebase: all 9 case study MDX files, all 9 plot components, datasets.ts, statistics.ts, svg-generators/index.ts
- Random Walk gold standard implementation (reviewed in full as reference)

---
*Feature research for: EDA Case Study Deep Dive*
*Researched: 2026-02-26*
