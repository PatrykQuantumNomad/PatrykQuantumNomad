# EDA Case Study Review — Fix Plan

Generated: 2026-02-26 from team review of all 9 case studies against NIST source.

## P0 — CRITICAL

### 1. Cryothermometry dataset missing 10 observations
- **File**: `src/data/eda/datasets.ts` (cryothermometry array at line 462)
- **Problem**: Array has 690 values, NIST SOULEN.DAT has 700
- **Impact**: All build-time plots use wrong data; text quotes correct NIST values → text/plot mismatch
- **Fix**: Download full 700 values from https://www.itl.nist.gov/div898/handbook/datasets/SOULEN.DAT and replace array
- **Status**: DONE — replaced with full 700 values from NIST SOULEN.DAT

## HIGH Priority

### 2. Filter Transmittance: Two numerical discrepancies
- **File**: `src/data/eda/pages/case-studies/filter-transmittance.mdx`
- **a)** Line 132: Residual std dev says **0.000260**, NIST says **0.000338** (0.3376404E-03)
- **b)** Line 129: Intercept t-value says **19244.8**, NIST says **20640** (0.2064E+05)
- **c)** Line 109/174: Autocorrelation says **0.93**, NIST says **0.937998** → use **0.938**
- **d)** Line 82 vs 174: Confidence band inconsistency — line 82 says ±0.283, line 174 says 0.277. NIST uses 0.277.
- **Status**: NOT STARTED

## MEDIUM Priority — Content Gaps

### 3. Fatigue Life: Missing structural sections
- **File**: `src/data/eda/pages/case-studies/fatigue-life.mdx`
- Add "Test Underlying Assumptions" section with 3 goals (matching other case studies)
- Add quantitative assumption tests (location regression, Levene, runs test, lag-1 autocorrelation)
- Add test summary table
- Add candidate distribution comparison plot call (text describes it but no plot renders)
- Add prediction interval formula from NIST: L = x̄ + r·s = 1400.91 - 2.16(391.32) = 555.66
- **Status**: NOT STARTED

### 4. Beam Deflections: Thin model development/validation
- **File**: `src/data/eda/pages/case-studies/beam-deflections.mdx`
- Add sinusoidal fit parameter table: C=-178.786, AMP=-361.766, FREQ=0.302596, PHASE=1.46536
- Add residual std dev comparison: 277.33 → 155.85 (~44% reduction)
- Replace "should show" with actual interpretations in residual validation sections
- Add validation summary table
- **Status**: NOT STARTED

### 5. Ceramic Strength: Text/plot mismatches
- **File**: `src/data/eda/pages/case-studies/ceramic-strength.mdx`
- Line 94: Text says "bihistogram" but shows batch-box-plot → reword to "comparison" or add batch histograms
- Line 98: Text says "Q-Q plot" but none rendered → reword to "quantile-quantile analysis shows..."
- **Status**: NOT STARTED

### 6. Normal Random Numbers: CI bounds
- **File**: `src/data/eda/pages/case-studies/normal-random-numbers.mdx`
- Line 222: CI = (-0.094, 0.089) should be NIST exact: (-0.093, 0.087)
- **Status**: NOT STARTED

### 7. Filter Transmittance: Missing explanation
- Add brief paragraph explaining why no better model developed (operational fix — slower sampling rate)
- **Status**: NOT STARTED

## MEDIUM Priority — Structural/UX Consistency

### 8. Section heading standardization
- Standardize across all case studies. Current inconsistency:
  - Some use "Quantitative Output and Interpretation"
  - Others use "Quantitative Results"
- Affected: normal-random-numbers, uniform-random-numbers, beam-deflections, filter-transmittance
- **Status**: NOT STARTED

### 9. Missing "Interpretation" sections
- Normal Random Numbers, Filter Transmittance, Fatigue Life lack dedicated Interpretation sections
- Random Walk and the NIST source have them
- **Status**: NOT STARTED

## LOW Priority

### 10. Uniform Random Numbers: Skewness/kurtosis sourcing
- Line 204: Add "theoretical" qualifier — values not from NIST analysis
- **Status**: NOT STARTED

### 11. Beam Deflections: Missing outlier removal refinement
- NIST re-fits without 3 outliers: residual SD 155.84 → 148.34
- **Status**: NOT STARTED

### 12. Normal Random Numbers: Thin spectral plot interpretation
- Add 1-2 sentences about what flat spectrum means
- **Status**: NOT STARTED

### 13. Various minor rounding (all acceptable, no action needed)

## Case Studies Requiring NO Changes
- **Random Walk** — PASS (reference standard, all correct)
- **Heat Flow Meter** — PASS (all correct, complete)
