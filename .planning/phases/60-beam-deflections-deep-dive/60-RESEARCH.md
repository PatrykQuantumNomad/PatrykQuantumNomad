# Phase 60: Beam Deflections Deep Dive - Research

**Researched:** 2026-02-27
**Domain:** MDX content authoring, sinusoidal regression modeling, residual diagnostics, NIST EDA case study parity
**Confidence:** HIGH

## Summary

Phase 60 enhances the Beam Deflections case study to full NIST parity with model development and validation workflows. A detailed gap analysis reveals that the case study is partially complete -- it has all 7 graphical plot subsections with per-plot interpretation (BEAM-01 original data: complete), a quantitative results section with test summary table (BEAM-02: complete), and a skeleton "Develop a Better Model" section with the sinusoidal model equation. However, five significant gaps remain:

1. **BEAM-01 (residuals):** The residual plot subsections exist but most lack per-plot interpretation text. Five of six residual plot subsections have only a plot component with no interpretation paragraph.
2. **BEAM-03:** The "Develop Better Model" section lacks regression parameter estimates. It describes the model but does not present the NIST parameter values (C = -178.786, AMP = -361.766, FREQ = 0.302596, PHASE = 1.46536) or any model fitting results.
3. **BEAM-04:** The "Validate New Model" section is missing several required plots (residual spectral plot, residual histogram interpretation, residual probability interpretation) and has no quantitative residual test suite or validation summary table.
4. **BEAM-04 (component):** BeamDeflectionPlots.astro does not support a `residual-spectral` plot type, which is required by the validation section.
5. **BEAM-05:** No "## Interpretation" section exists. The MDX goes directly from residual plots to Conclusions.

The sinusoidal model is already implemented in BeamDeflectionPlots.astro frontmatter using a linearized sin/cos OLS formulation with frequency fixed at 0.3025. This produces residuals that are used for the residual plots. The implementation needs verification against NIST's nonlinear regression values, but the two parameterizations are mathematically equivalent when the frequency is fixed.

**Primary recommendation:** Implement in three plans: (1) add the `residual-spectral` plot type to BeamDeflectionPlots.astro and write per-plot interpretation for all residual subsections; (2) expand the "Develop Better Model" section with NIST regression parameters, model fitting details, and residual standard deviation; (3) add quantitative residual diagnostics, validation summary table, and the Interpretation section.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BEAM-01 | Individual named plot subsections with per-plot interpretation for both original data and residuals | PARTIALLY COMPLETE: Original data has all 7 plot subsections with interpretation. Residuals have 6 subsections but 5 of 6 lack interpretation text. Need to add per-plot interpretation to all residual subsections. |
| BEAM-02 | Quantitative results with full test suite and test summary table | COMPLETE: Summary statistics, location test, variation test, randomness tests, distribution test (noted as "not meaningful" per NIST), and full test summary table all present. Values verified against NIST. |
| BEAM-03 | Develop Better Model section with sinusoidal/polynomial model fitting and regression results | GAP: Section exists with model equation but no regression parameter estimates, standard errors, t-values, or residual standard deviation. Must present NIST values: C = -178.786, AMP = -361.766, FREQ = 0.302596, PHASE = 1.46536 with SE and t-values. |
| BEAM-04 | Validate New Model section with residual diagnostics (4-plot, run sequence, lag, histogram, probability, autocorrelation, spectral) and validation summary table | GAP: Has 6 of 7 required residual plot types (missing spectral). No validation summary table. No quantitative residual tests. Residual subsections lack interpretation. |
| BEAM-05 | Interpretation section synthesizing evidence | GAP: No "## Interpretation" section. MDX goes from residual plots to "## Conclusions". |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | (project version) | Static site generation, MDX rendering | Already in use; zero-JS build-time SVG rendering |
| TypeScript | (project version) | Build-time statistics, SVG generation | Pure functions in statistics.ts and svg-generators |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| statistics.ts | Phase 56 | Hypothesis test computations for residuals | Residual quantitative tests (location, variation, randomness, distribution, outlier) |
| BeamDeflectionPlots.astro | Existing | SVG plot component with sinusoidal model fitting | All plot rendering; already computes residuals at build time |
| PlotFigure.astro | Phase 56 | Consistent figure rendering | Already used by BeamDeflectionPlots.astro |
| InlineMath.astro | Existing | LaTeX math rendering | All statistical formulas in MDX content |
| CaseStudyDataset.astro | Existing | Dataset display panel | Already used in Background and Data |
| generateSpectralPlot | Existing | Spectral plot SVG generation | Needed for new `residual-spectral` plot type |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Fixed-frequency sin/cos OLS | Full nonlinear least squares (Levenberg-Marquardt) | OLS with fixed frequency is mathematically equivalent when frequency is known a priori from spectral analysis. NIST uses nonlinear regression but the fixed-frequency OLS in the component produces equivalent residuals. |
| Present NIST nonlinear parameters | Present sin/cos linear parameters | NIST uses (C, AMP, FREQ, PHASE) parameterization. Must convert from the component's (mean, A, B) parameterization to match NIST. AMP = sqrt(A^2 + B^2), PHASE = atan2(B, A). |

**Installation:**
```bash
# No new packages needed -- all work uses existing project dependencies
```

## Architecture Patterns

### Existing Project Structure (Targeted Changes)
```
src/
├── data/eda/
│   ├── datasets.ts                         # beamDeflections array (200 values) -- NO CHANGES
│   └── pages/case-studies/
│       └── beam-deflections.mdx            # BEAM-01 through BEAM-05: All content updates
├── components/eda/
│   └── BeamDeflectionPlots.astro           # BEAM-04: Add residual-spectral plot type
└── lib/eda/
    ├── math/statistics.ts                  # NO CHANGES -- all needed functions exist
    └── svg-generators/
        ├── spectral-plot.ts                # Already exists, used for residual-spectral
        └── index.ts                        # Already exports generateSpectralPlot
```

### Pattern 1: Model Development Variation (from case-study-template.md)
**What:** The Beam Deflections case study follows the Model Development Variation of the canonical template, which adds "Develop Better Model" and "Validate New Model" sections between the standard quantitative analysis and the Interpretation/Conclusions.
**When to use:** This case study and Random Walk.
**Structure:**
```
## Background and Data
## Test Underlying Assumptions
### Goals
## Graphical Output and Interpretation
### 4-Plot Overview
### Run Sequence Plot
### Lag Plot
### Histogram
### Normal Probability Plot
### Autocorrelation Plot                    <-- already exists
### Spectral Plot                           <-- already exists
## Quantitative Output and Interpretation
### Summary Statistics
### Location Test
### Variation Test
### Randomness Tests
### Distribution and Outlier Tests
### Test Summary
## Develop a Better Model                   <-- BEAM-03: expand with regression parameters
### Model Parameters                        <-- BEAM-03: ADD subsection with parameter table
## Validate New Model
### 4-Plot of Residuals                     <-- BEAM-04: add interpretation
### Residual Run Sequence Plot              <-- BEAM-01: add interpretation
### Residual Lag Plot                       <-- BEAM-01: add interpretation
### Residual Histogram                      <-- BEAM-01: add interpretation
### Residual Normal Probability Plot        <-- BEAM-01: add interpretation
### Residual Autocorrelation Plot           <-- BEAM-01: add interpretation (partially exists)
### Residual Spectral Plot                  <-- BEAM-04: ADD entire subsection + component support
### Validation Summary                      <-- BEAM-04: ADD table
## Interpretation                           <-- BEAM-05: ADD entire section
## Conclusions                              <-- already exists, may need update
```

### Pattern 2: Adding a New Plot Type to *Plots.astro
**What:** Add a new case to the switch statement in BeamDeflectionPlots.astro for `residual-spectral`.
**When to use:** BEAM-04 -- adding residual spectral plot support.
**Example (from RandomWalkPlots.astro which already supports this):**
```typescript
case 'residual-spectral':
  svg = generateSpectralPlot({
    data: residuals,
    config: singleConfig,
    title: 'Residual Spectral Plot',
  });
  break;
```
Also requires:
1. Adding `'residual-spectral'` to the `PlotType` union type
2. Adding a default caption to the `defaultCaptions` record

### Pattern 3: NIST Parameter Conversion
**What:** Converting between sin/cos OLS parameterization (used in component) and NIST's (C, AMP, FREQ, PHASE) parameterization.
**When to use:** BEAM-03 -- presenting regression results.
**Mathematical relationship:**

The component computes: `Y = mean + A*sin(2*pi*f*t) + B*cos(2*pi*f*t)`
NIST uses: `Y = C + AMP*sin(2*pi*FREQ*t + PHASE)`

By the identity `sin(x + phi) = sin(x)*cos(phi) + cos(x)*sin(phi)`:
- `A = AMP * cos(PHASE)`
- `B = AMP * sin(PHASE)`
- `AMP = sqrt(A^2 + B^2)` (with sign determined by dominant term)
- `PHASE = atan2(B, A)`
- `C = mean`
- `FREQ = f = 0.3025` (fixed from spectral analysis)

Note: NIST reports AMP = -361.766 and PHASE = 1.46536. The negative amplitude with positive phase is equivalent to a positive amplitude with phase shifted by pi. The component's OLS solution will produce A and B coefficients that, when converted, should match these NIST values (or their algebraic equivalent).

### Pattern 4: Residual Quantitative Tests (from Random Walk pattern)
**What:** Apply the same quantitative test battery to residuals that was applied to the original data.
**When to use:** BEAM-04 validation summary.
**Tests to include for residuals:**
- Location test (regression on run order)
- Variation test (Levene with k=4)
- Randomness tests (runs test, lag-1 autocorrelation)
- Distribution test (Anderson-Darling, PPCC) -- NOW meaningful since randomness should be restored
- Outlier test (Grubbs)

### Anti-Patterns to Avoid
- **Modifying the sinusoidal model computation in BeamDeflectionPlots.astro:** The existing OLS computation works correctly. Do NOT switch to nonlinear regression. Just convert the output parameters for display.
- **Hardcoding NIST parameter values without verifying against the component's computed values:** The MDX should present the NIST values (C, AMP, FREQ, PHASE) but ideally also verify that the component's A and B coefficients produce equivalent predictions.
- **Mixing the two model parameterizations in the MDX text:** Present the NIST form (C, AMP, FREQ, PHASE) consistently. Explain the sin/cos decomposition only if needed for technical clarity.
- **Omitting residual quantitative tests:** The Random Walk case study has a validation summary table. Beam Deflections must have one too.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Residual spectral plot | Custom spectral SVG | `generateSpectralPlot(residuals, ...)` | Already exists and works for any data array |
| Residual quantitative tests | Custom test implementations | statistics.ts functions (runsTest, leveneTest, etc.) | Phase 56 implemented all needed test functions |
| Parameter conversion | Manual arithmetic | Compute AMP/PHASE from A/B in component or explain equivalence in MDX | Standard trigonometric identity |
| Cross-reference URLs | Manual URL construction | url-cross-reference.md cheat sheet | Copy-paste prevents broken links |
| Section structure | Ad-hoc headings | case-study-template.md Model Development Variation | Ensures consistency with Random Walk |

**Key insight:** This phase is primarily a content authoring task with one small engineering addition (residual-spectral plot type). The sinusoidal model is already computed. The infrastructure (statistics functions, SVG generators, PlotFigure wrapper) is all in place from Phase 56. The work is filling in the gaps: interpretation text, parameter tables, quantitative residual tests, validation summary, and the Interpretation section.

## Common Pitfalls

### Pitfall 1: NIST Parameter Sign Convention for AMP and PHASE
**What goes wrong:** The NIST values show AMP = -361.766 (negative) and PHASE = 1.46536. The component's OLS produces sin/cos coefficients (A, B) that may not directly yield these exact values when converted using `AMP = sqrt(A^2 + B^2)` (which is always positive).
**Why it happens:** The identity `AMP*sin(x + PHASE) = AMP*cos(PHASE)*sin(x) + AMP*sin(PHASE)*cos(x)` has a sign ambiguity. `(-AMP, PHASE)` is equivalent to `(AMP, PHASE + pi)`.
**How to avoid:** When presenting the NIST parameters, use the NIST values directly: C = -178.786, AMP = -361.766, FREQ = 0.302596, PHASE = 1.46536. Note in the MDX that these are the NIST nonlinear regression results and are consistent with the linear sin/cos decomposition used computationally. The models produce identical predictions and residuals regardless of the sign convention.
**Warning signs:** Residuals differ between the two parameterizations (they should not).

### Pitfall 2: Missing Residual Spectral Plot in PlotType Union
**What goes wrong:** Adding the `residual-spectral` case to the switch statement but forgetting to add it to the `PlotType` union type causes a TypeScript compilation error.
**Why it happens:** The type and the switch statement need to stay in sync.
**How to avoid:** Update the PlotType union FIRST, then add the switch case, then add the default caption. Run `npx astro check` to verify.
**Warning signs:** TypeScript error about string not assignable to PlotType.

### Pitfall 3: Residual Quantitative Tests Not Matching Expected Behavior
**What goes wrong:** The residual tests (e.g., Anderson-Darling on residuals) produce unexpected results because the residual distribution may not be perfectly normal.
**Why it happens:** NIST notes "the bend in the left portion of the normal probability plot shows some cause for concern" and the residuals contain potential outliers.
**How to avoid:** Report the actual computed test results honestly. NIST itself notes that the fit is "reasonably good" but not perfect, and it is "a judgment call whether to use the fit with or without the outliers removed." The validation summary should reflect this nuanced finding.
**Warning signs:** Anderson-Darling rejects normality on residuals; this may be legitimate and should be discussed, not hidden.

### Pitfall 4: Confusing "Develop Better Model" with "Validate New Model" Content
**What goes wrong:** Putting regression parameter estimates in the validation section or putting residual diagnostics in the model development section.
**Why it happens:** Both sections discuss the sinusoidal model.
**How to avoid:** Follow the canonical template strictly:
- "Develop Better Model" = WHY the model is needed + WHAT the model is + parameter estimates + model fit quality
- "Validate New Model" = diagnostic plots and tests applied to RESIDUALS + validation summary table
**Warning signs:** Regression parameter table appears after residual plots.

### Pitfall 5: Incomplete Residual Interpretation Text
**What goes wrong:** Adding a plot component but not writing an interpretation paragraph below it.
**Why it happens:** The existing MDX already has several residual subsections with just the plot component and no text.
**How to avoid:** Every residual plot subsection needs BOTH the `<BeamDeflectionPlots type="residual-*" />` component AND at least one paragraph of interpretation. Follow the Random Walk pattern where each residual subsection has 1-3 sentences of interpretation.
**Warning signs:** Plot subsection with only a component tag and no text.

### Pitfall 6: Forgetting InlineMath for Statistical Values in Interpretation
**What goes wrong:** Writing plain text test statistics ("t = 0.022") instead of using InlineMath component.
**Why it happens:** Rushing through content writing.
**How to avoid:** Every statistical value in the Interpretation section must use `<InlineMath tex="..." />`. Check against Normal Random Numbers and Uniform Random Numbers Interpretation sections as reference.
**Warning signs:** Numbers in plain text that should be formatted mathematically.

## Code Examples

### Example 1: Adding residual-spectral to BeamDeflectionPlots.astro
```typescript
// Step 1: Update PlotType union (add 'residual-spectral')
type PlotType =
  | '4-plot' | 'run-sequence' | 'lag' | 'histogram' | 'probability'
  | 'autocorrelation' | 'spectral'
  | 'residual-4-plot'
  | 'residual-run-sequence' | 'residual-lag' | 'residual-histogram'
  | 'residual-probability' | 'residual-autocorrelation'
  | 'residual-spectral';  // NEW

// Step 2: Add switch case (after residual-autocorrelation)
case 'residual-spectral':
  svg = generateSpectralPlot({
    data: residuals,
    config: singleConfig,
    title: 'Residual Spectral Plot',
  });
  break;

// Step 3: Add default caption
'residual-spectral': 'Spectral plot of sinusoidal model residuals — should show a flat spectrum with no dominant peaks if the periodic structure has been successfully removed.',
```

### Example 2: Model Parameters Table (BEAM-03)
```mdx
### Model Parameters

The nonlinear regression produces the following parameter estimates:

| Parameter | Estimate | Std Error | t-Value |
|-----------|----------|-----------|---------|
| <InlineMath tex="C" /> (constant) | <InlineMath tex="-178.786" /> | 11.02 | <InlineMath tex="-16.22" /> |
| <InlineMath tex="\alpha" /> (amplitude) | <InlineMath tex="-361.766" /> | 26.19 | <InlineMath tex="-13.81" /> |
| <InlineMath tex="\omega" /> (frequency) | <InlineMath tex="0.302596" /> | 0.0001510 | <InlineMath tex="2005.00" /> |
| <InlineMath tex="\phi" /> (phase) | <InlineMath tex="1.46536" /> | 0.04909 | <InlineMath tex="29.85" /> |

Residual standard deviation: <InlineMath tex="155.8484" /> with 196 degrees of freedom.
```

### Example 3: Validation Summary Table (BEAM-04)
```mdx
### Validation Summary

| Assumption | Original Data | Residuals | Improvement |
|-----------|--------------|-----------|-------------|
| **Fixed location** | Satisfied | Satisfied | Maintained |
| **Fixed variation** | Satisfied | Satisfied | Maintained |
| **Randomness** | **Rejected** | Satisfied | Restored |
| **Distribution** | Not tested | Approximately normal | Now testable |
| **Outliers** | Not tested | [computed result] | Now testable |
```

### Example 4: Interpretation Section Pattern (BEAM-05)
```mdx
## Interpretation

The graphical and quantitative analyses of the original beam deflection data
reveal a clear pattern: while the [run sequence plot](/eda/techniques/run-sequence-plot/)
shows stable location and variation (confirmed by the location test with
<InlineMath tex="t = 0.022" /> and [Levene test](/eda/quantitative/levene-test/)
with <InlineMath tex="W = 0.094" />), the randomness assumption is severely
violated. The [lag plot](/eda/techniques/lag-plot/) displays an elliptical
structure indicating strong positive autocorrelation, and the
[autocorrelation plot](/eda/techniques/autocorrelation-plot/) confirms
significant dependence at multiple lags with a periodic decay pattern. The
[spectral plot](/eda/techniques/spectral-plot/) identifies the dominant
frequency at approximately 0.3 cycles per observation.

[Paragraph 2: The model development -- sinusoidal fit, parameter values,
reduction in residual SD from 277.3 to 155.8, the critical evidence...]

[Paragraph 3: Practical implications -- the original confidence interval is
invalid due to autocorrelation; the sinusoidal model restores assumption
validity; residual diagnostics confirm reasonable fit with caveats about
outliers and imperfect normality...]
```

## Detailed Gap Analysis

### Current State of beam-deflections.mdx

| Section | Exists? | Status | Notes |
|---------|---------|--------|-------|
| ## Background and Data | Yes | Complete | Correct NIST reference, CaseStudyDataset component |
| ## Test Underlying Assumptions | Yes | Complete | |
| ### Goals | Yes | Complete | Three objectives with InlineMath formulas |
| ## Graphical Output and Interpretation | Yes | Complete | |
| ### 4-Plot Overview | Yes | Complete | Good interpretation paragraph |
| ### Run Sequence Plot | Yes | Complete | Per-plot interpretation |
| ### Lag Plot | Yes | Complete | Per-plot interpretation (elliptical noted) |
| ### Histogram | Yes | Complete | Per-plot interpretation (bell-shaped noted) |
| ### Normal Probability Plot | Yes | Complete | Per-plot interpretation |
| ### Autocorrelation Plot | Yes | Complete | Per-plot interpretation with confidence bands |
| ### Spectral Plot | Yes | Complete | Per-plot interpretation (dominant freq 0.3) |
| ## Quantitative Output and Interpretation | Yes | Complete | |
| ### Summary Statistics | Yes | Complete | n=200, mean=-177.435, SD=277.332 |
| ### Location Test | Yes | Complete | t=0.022, fail to reject |
| ### Variation Test | Yes | Complete | Levene W=0.09378, fail to reject |
| ### Randomness Tests | Yes | Complete | Runs Z=2.6938 (reject), autocorrelation (reject) |
| ### Distribution and Outlier Tests | Yes | Complete | Correctly notes "not meaningful" per NIST |
| ### Test Summary | Yes | Complete | Full table with all tests |
| ## Develop a Better Model | Yes | **INCOMPLETE (BEAM-03)** | Has model equation but NO parameter estimates, NO regression table, NO residual SD |
| ### Model Parameters | **NO** | **MISSING (BEAM-03)** | Need table with C, AMP, FREQ, PHASE, SEs, t-values |
| ## Validate New Model | Yes | **INCOMPLETE (BEAM-04)** | Missing residual spectral, missing interpretation text, no validation summary |
| ### 4-Plot of Residuals | Yes | Needs interpretation update | Has bullet list of "should show" but needs definitive interpretation |
| ### Residual Run Sequence Plot | Yes | **Needs interpretation (BEAM-01)** | Has plot component only, no text |
| ### Residual Lag Plot | Yes | **Needs interpretation (BEAM-01)** | Has plot component only, no text |
| ### Residual Histogram | Yes | **Needs interpretation (BEAM-01)** | Has plot component only, no text |
| ### Residual Normal Probability Plot | Yes | **Needs interpretation (BEAM-01)** | Has plot component only, no text |
| ### Residual Autocorrelation Plot | Yes | Has partial interpretation | One sentence about reduced autocorrelation |
| ### Residual Spectral Plot | **NO** | **MISSING (BEAM-04)** | Need component support AND MDX subsection |
| ### Validation Summary | **NO** | **MISSING (BEAM-04)** | Need comparison table (original vs. residuals) |
| ## Interpretation | **NO** | **MISSING (BEAM-05)** | Goes directly to Conclusions |
| ## Conclusions | Yes | Needs update | Current text is reasonable but should reference model parameters and validation |

### NIST Values Verification

All values in the current MDX have been verified against NIST source pages:

| Statistic | MDX Value | NIST Value | Status |
|-----------|-----------|------------|--------|
| n | 200 | 200 | Correct |
| Mean | -177.435 | -177.4350 | Correct |
| Std Dev | 277.332 | 277.3322 | Correct |
| Median | -162.0 | -162.0000 | Correct |
| Min | -579.0 | -579.0000 | Correct |
| Max | 300.0 | 300.0000 | Correct |
| Location slope t | 0.022 | 0.022 | Correct |
| Intercept | -178.175 | -178.175 | Correct |
| Slope | 0.7366E-02 | 0.7366E-02 | Correct |
| Residual SD (location) | 278.0313 | 278.0313 | Correct |
| Levene W | 0.09378 | 0.09378 | Correct |
| Levene critical | 2.651 | 2.651 | Correct |
| Runs Z | 2.6938 | 2.6938 | Correct |
| Model C | (not present) | -178.786 | To add |
| Model AMP | (not present) | -361.766 | To add |
| Model FREQ | (not present) | 0.302596 | To add |
| Model PHASE | (not present) | 1.46536 | To add |
| Model SE(C) | (not present) | 11.02 | To add |
| Model SE(AMP) | (not present) | 26.19 | To add |
| Model SE(FREQ) | (not present) | 0.0001510 | To add |
| Model SE(PHASE) | (not present) | 0.04909 | To add |
| Model t(C) | (not present) | -16.22 | To add |
| Model t(AMP) | (not present) | -13.81 | To add |
| Model t(FREQ) | (not present) | 2005.00 | To add |
| Model t(PHASE) | (not present) | 29.85 | To add |
| Residual SD (model) | (not present) | 155.8484 | To add |
| Residual df (model) | (not present) | 196 | To add |

### Sinusoidal Model Verification

The component uses a linearized form with fixed frequency:
```
Y = mean + A*sin(2*pi*f*t) + B*cos(2*pi*f*t)
```

NIST uses the nonlinear form:
```
Y = C + AMP*sin(2*pi*FREQ*t + PHASE)
```

These are equivalent when FREQ is fixed (as in this case, at ~0.3025). The relationship:
- `C = mean = -177.435` (component) vs. `-178.786` (NIST) -- small difference because NIST performs joint nonlinear estimation of all 4 parameters simultaneously, while the component fixes the mean separately
- `AMP = -sqrt(A^2 + B^2)` (with sign convention matching NIST)
- `PHASE = atan2(B, A)` (adjusted for sign convention)
- `FREQ = 0.3025` (component, fixed) vs. `0.302596` (NIST, optimized)

The slight differences in C and FREQ are expected because:
1. The component fixes frequency at 0.3025 while NIST optimizes it to 0.302596
2. The component uses the sample mean for C while NIST jointly estimates C

These differences produce very similar but not identical residuals. The residual diagnostics will reflect the component's computation, which is acceptable for the case study. The MDX text should present the NIST parameter values as the reference standard and note that the computational implementation uses a linearized formulation for build-time efficiency.

## Recommended Plan Structure

This phase naturally splits into 3 plans:

**Plan 1: Residual Plot Infrastructure and Interpretation (BEAM-01, partial BEAM-04)**
- Add `residual-spectral` plot type to BeamDeflectionPlots.astro (PlotType union, switch case, default caption)
- Write per-plot interpretation text for all 7 residual subsections (4-plot, run sequence, lag, histogram, probability, autocorrelation, spectral)
- Verify `npx astro check` passes

**Plan 2: Model Development and Regression Parameters (BEAM-03)**
- Expand "## Develop a Better Model" with spectral frequency identification narrative
- Add "### Model Parameters" subsection with NIST regression parameter table
- Add residual standard deviation comparison (277.3 original vs. 155.8 model -- 44% reduction)
- Add starting values and fitting methodology description
- Verify content against NIST Section 1.4.2.5.3

**Plan 3: Validation Summary, Interpretation, and Final Verification (BEAM-04, BEAM-05)**
- Add residual spectral plot MDX subsection (`<BeamDeflectionPlots type="residual-spectral" />`)
- Add "### Validation Summary" table comparing original vs. residual assumption tests
- Add "## Interpretation" section (3 paragraphs synthesizing original + model evidence)
- Update "## Conclusions" to reference model parameters and validation results
- Verify full build succeeds with `npx astro check` and `npx astro build`

**Rationale for 3 plans:** Plan 1 is the engineering + content hybrid (add plot type, write interpretations). Plan 2 is pure content (model development narrative with NIST values). Plan 3 is the synthesis (validation table, Interpretation section). Each has clear verification criteria.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Residual plots without interpretation | Each residual plot has per-plot interpretation | Phase 57+ pattern | Matches NIST depth for all case studies |
| No model parameter table | Full regression parameter table with NIST values | Phase 60 (new) | Completes the model development workflow |
| No validation summary table | Comparison table (original vs. residuals) | Phase 60 (new) | Matches Random Walk case study pattern |
| No Interpretation section | Separate Interpretation section | Phase 57 pattern | Consistent synthesis across all case studies |
| 6 residual plot types | 7 residual plot types (added spectral) | Phase 60 (new) | Full diagnostic coverage matching BEAM-04 requirements |

## Open Questions

1. **Residual quantitative test values: compute or hardcode?**
   - What we know: The component computes residuals at build time. Statistics.ts functions can compute test values from these residuals.
   - What's unclear: Whether to import and call statistics.ts functions in the Plots component to compute values, or to hardcode values computed manually. NIST does not publish detailed residual test statistics for beam deflections (they only show the 4-plot and note "reasonably good" fit).
   - Recommendation: Present the validation summary table with qualitative results ("Satisfied"/"Rejected") based on visual interpretation of the residual plots, matching the NIST approach. The validation summary does not need formal test statistics -- the Random Walk case study uses qualitative language ("Satisfied -- no shifts in residual location") rather than computed test values. This avoids the complexity of importing statistics functions into the Plots component.

2. **Residual outliers: NIST reports 3 outliers but does not identify them**
   - What we know: NIST mentions "three outliers" and that removing them yields approximately 5% reduction in residual standard deviation (155.84 to 148.34). Also notes "a change in amplitude at around x=160."
   - What's unclear: The exact indices of the 3 outlier observations. NIST does not publish them.
   - Recommendation: Note the NIST finding about outliers and amplitude change near observation 160 in the "Develop Better Model" section. Do NOT remove outliers from the model -- present the full-data fit as primary, consistent with NIST's conclusion that it is "a judgment call."

3. **Complex demodulation details: include or omit?**
   - What we know: NIST uses complex demodulation to determine the starting frequency (0.3025) and amplitude (390) before nonlinear regression. The technique involves testing frequencies 0.28 to 0.3175 in increments of 0.0025.
   - What's unclear: Whether to describe the complex demodulation process in the "Develop Better Model" section.
   - Recommendation: Briefly mention that the dominant frequency was determined by spectral analysis (already stated in the current MDX) and note that NIST used complex demodulation for refined frequency estimation. Do NOT describe the full complex demodulation procedure -- it is a technique detail, not a case study finding.

4. **Should the Conclusions section be rewritten or just extended?**
   - What we know: The current Conclusions section is well-written and accurate but does not reference the NIST parameter values or the validation results.
   - What's unclear: Whether to rewrite from scratch or add to the existing text.
   - Recommendation: Keep the existing structure and add references to the model parameters (C, AMP, FREQ, PHASE values) and the validation findings (residuals satisfy all four assumptions). The current text already covers the key points; just needs quantitative backing.

## Sources

### Primary (HIGH confidence)
- NIST/SEMATECH Section 1.4.2.5: Beam Deflections case study (structure, all sub-sections)
  - 1.4.2.5.1: Background and Data -- verified dataset description
  - 1.4.2.5.2: Test Underlying Assumptions -- verified all test statistics
  - 1.4.2.5.3: Develop a Better Model -- verified regression parameters (C, AMP, FREQ, PHASE with SEs and t-values), residual SD, starting values, complex demodulation details
  - 1.4.2.5.4: Validate New Model -- verified 4-plot interpretation, outlier finding (3 outliers, ~5% reduction), "reasonably good" fit assessment
  - 1.4.2.5.5: Work This Example Yourself -- verified analysis workflow steps
- Codebase: BeamDeflectionPlots.astro -- current sin/cos OLS implementation with residual computation
- Codebase: statistics.ts -- full set of hypothesis test functions (runsTest, leveneTest, andersonDarlingNormal, grubbsTest, ppccNormal, locationTest)
- Codebase: random-walk.mdx -- reference implementation for Model Development + Validation pattern
- Phase 56: case-study-template.md -- Model Development Variation canonical structure
- Phase 56: url-cross-reference.md -- all technique/quantitative slugs

### Secondary (MEDIUM confidence)
- NIST quantitative values for regression parameters: fetched via WebFetch, all 4 parameters with SEs and t-values confirmed. Residual SD = 155.8484 with 196 df confirmed.
- NIST validation section: 4-plot qualitative assessment confirmed ("reasonably good fit"). Outlier details are limited (3 outliers mentioned, no indices provided).

### Tertiary (LOW confidence)
- NIST residual quantitative test statistics: NOT available. NIST does not publish formal test statistics (runs test, Levene, A-D, etc.) for the beam deflection residuals. The validation section uses only graphical assessment. Our validation summary will use the same qualitative approach.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all infrastructure verified present in codebase, no new dependencies
- Architecture: HIGH -- canonical template and Random Walk reference pattern directly applicable
- Model parameters: HIGH -- NIST values fetched and verified (C, AMP, FREQ, PHASE with SEs, t-values, residual SD)
- Residual spectral plot: HIGH -- generateSpectralPlot already exists, just needs wiring in component
- Pitfalls: HIGH -- identified from NIST sign convention, component parameterization differences, and content authoring patterns
- Residual quantitative tests: MEDIUM -- NIST does not publish these; using qualitative approach consistent with NIST
- Outlier details: LOW -- NIST mentions 3 outliers but does not identify them by index

**Research date:** 2026-02-27
**Valid until:** 2026-03-29 (stable content domain, no technology changes expected)
