# Phase 100: Advanced Case Study Notebooks - Research

**Researched:** 2026-03-14
**Domain:** TypeScript notebook generation (nbformat v4.5) for NIST EDA case studies requiring specialized statistical modeling
**Confidence:** HIGH

## Summary

Phase 100 delivers 3 specialized Jupyter notebooks for case studies that exceed the standard univariate EDA template: Beam Deflections (sinusoidal model fitting), Random Walk (AR(1) time series model), and Ceramic Strength (DOE multi-factor analysis). Each requires a dedicated template builder because the analysis flow is fundamentally different from the standard 10-section pipeline used by Phase 97.

The existing infrastructure is mature. Phase 96 established cell factories (`markdownCell`, `codeCell`), the `{ cells, nextIndex }` section builder pattern, deterministic cell IDs, the `CaseStudyConfig` type (which already includes `modelParams` and `doeFactors` fields), and the notebook assembler. Phase 97 built the standard template with 10 composable section builders. Phase 98 built the ZIP packager and Astro integration. Phase 99 committed `.ipynb` files and wired up the download UI. All reusable sections (intro, setup, data-loading, summary-stats, four-plot, individual-plots) can be imported directly into the advanced templates.

**Primary recommendation:** Create one template builder per advanced notebook type (sinusoidal, ar1, doe), each composed of reusable standard sections plus specialized sections. Extend `STANDARD_SLUGS` to `ALL_SLUGS` or add `ADVANCED_SLUGS` in the packager and generation script. Follow the same `{ cells, nextIndex }` section builder pattern established in Phase 97.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NBADV-01 | Beam Deflections notebook with sinusoidal model fitting and residual validation | NIST handbook sections 1.4.2.5.1-1.4.2.5.5 provide exact model parameters (C=-178.786, AMP=-361.766, FREQ=0.302596, PHASE=1.46536, residual SD=155.8484). Use `scipy.optimize.curve_fit` with model Y=C+A*sin(2*pi*freq*t+phi). Residual 4-plot validates the fit. |
| NBADV-02 | Random Walk notebook with AR(1) model development and residual analysis | NIST handbook sections 1.4.2.3.1-1.4.2.3.4 provide exact AR(1) coefficients (A0=0.050165, A1=0.987087, residual SD=0.2931). Use `scipy.stats.linregress` on Y(i) vs Y(i-1). Residuals should follow uniform distribution. |
| NBADV-03 | Ceramic Strength notebook with DOE analysis (batch effects, factor rankings, interaction plots) | NIST handbook sections 1.4.2.10.1-1.4.2.10.6 define: 480 rows, 15 columns, batch effect ~75 units (batch1 mean=688.9987, batch2 mean=611.1559), 3 primary factors (X1 table speed, X2 feed rate, X3 wheel grit), factor rankings differ by batch, interaction effects. Use one-way ANOVA via `scipy.stats.f_oneway`. |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| nbformat v4.5 | - | Notebook JSON schema (TypeScript types) | Already defined in `src/lib/eda/notebooks/types.ts` |
| archiver | 7.x | ZIP packaging | Already used in `src/lib/eda/notebooks/packager.ts` |
| vitest | 4.0.18 | Test framework | Already configured project-wide |
| tsx | dev dep | TypeScript script execution | Already used for `scripts/generate-notebooks.ts` |

### Python Dependencies (In Generated Notebooks)
| Library | Purpose | Why Standard |
|---------|---------|--------------|
| numpy | Array operations | Already in requirements.txt |
| scipy | `curve_fit`, `linregress`, `f_oneway`, `stats` | Already in requirements.txt |
| pandas | DataFrame operations, `read_fwf` | Already in requirements.txt |
| matplotlib | Plotting (4-plot, residuals, interaction plots) | Already in requirements.txt |
| seaborn | Styled plotting, box plots | Already in requirements.txt |

**No new dependencies needed.** All Python libraries for the advanced analysis (curve_fit, linregress, f_oneway) are in scipy, which is already in the requirements.txt template.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| scipy.optimize.curve_fit | lmfit | lmfit is more featureful but adds a dependency; curve_fit is sufficient for sinusoidal fitting |
| scipy.stats.f_oneway | statsmodels ANOVA | statsmodels is explicitly out of scope per requirements |
| Manual DOE mean/interaction plots | statsmodels or pyDOE2 | Out of scope; matplotlib groupby plots are adequate for EDA |

## Architecture Patterns

### Recommended Project Structure
```
src/lib/eda/notebooks/
  templates/
    standard.ts                    # Existing: 7 standard slugs
    advanced/
      beam-deflections.ts          # NEW: sinusoidal model template
      random-walk.ts               # NEW: AR(1) model template
      ceramic-strength.ts          # NEW: DOE analysis template
    sections/
      intro.ts                     # REUSE: unchanged
      setup.ts                     # REUSE: unchanged
      data-loading.ts              # REUSE: unchanged
      summary-stats.ts             # REUSE: unchanged
      four-plot.ts                 # REUSE: unchanged
      individual-plots.ts          # REUSE: unchanged (for beam & random-walk)
      model-fitting/
        sinusoidal.ts              # NEW: curve_fit + residual 4-plot
        ar1.ts                     # NEW: linregress on lag + residual analysis
      doe/
        batch-effect.ts            # NEW: bihistogram, box plot, t-test
        factor-analysis.ts         # NEW: DOE mean, SD, interaction plots
        anova.ts                   # NEW: one-way ANOVA
```

### Pattern 1: Advanced Template Composition
**What:** Each advanced template imports reusable standard sections and interleaves specialized sections.
**When to use:** For all 3 advanced notebooks.
**Example:**
```typescript
// beam-deflections.ts
import { buildIntro } from '../sections/intro';
import { buildSetup } from '../sections/setup';
import { buildDataLoading } from '../sections/data-loading';
import { buildSummaryStats } from '../sections/summary-stats';
import { buildFourPlot } from '../sections/four-plot';
import { buildSinusoidalFit } from '../sections/model-fitting/sinusoidal';
import { buildResidualValidation } from '../sections/model-fitting/residual-validation';

export function buildBeamDeflectionsNotebook(): NotebookV4 {
  const slug = 'beam-deflections';
  const config = getCaseStudyConfig(slug)!;
  const allCells: Cell[] = [];
  let idx = 0;

  // Reuse standard sections
  for (const builder of [buildIntro, buildSetup, buildDataLoading, buildSummaryStats, buildFourPlot]) {
    const result = builder(config, slug, idx);
    allCells.push(...result.cells);
    idx = result.nextIndex;
  }

  // Specialized sections
  for (const builder of [buildSinusoidalFit, buildResidualValidation]) {
    const result = builder(config, slug, idx);
    allCells.push(...result.cells);
    idx = result.nextIndex;
  }

  return createNotebook(allCells);
}
```

### Pattern 2: Section Builder Signature (Established)
**What:** Every section builder follows `(config, slug, startIndex) => { cells, nextIndex }`.
**When to use:** All sections, both standard and advanced.
**Example:**
```typescript
export function buildSinusoidalFit(
  config: CaseStudyConfig,
  slug: string,
  startIndex: number,
): { cells: Cell[]; nextIndex: number } {
  let idx = startIndex;
  const cells: Cell[] = [];
  // ... add cells ...
  return { cells, nextIndex: idx };
}
```

### Pattern 3: Packager Extension
**What:** The packager and generation script need to handle advanced notebooks in addition to standard ones.
**When to use:** When extending `buildNotebookZipEntries` and `notebookPackager`.
**Example:**
```typescript
// In packager.ts - extend buildNotebookZipEntries to dispatch:
export function buildNotebookZipEntries(slug: string, projectRoot: string): ZipEntry[] {
  const config = getCaseStudyConfig(slug);
  if (!config) throw new Error(`Unknown case study slug: ${slug}`);

  // Dispatch to correct builder
  let notebook: NotebookV4;
  if (slug === 'beam-deflections') {
    notebook = buildBeamDeflectionsNotebook();
  } else if (slug === 'random-walk') {
    notebook = buildRandomWalkNotebook();
  } else if (slug === 'ceramic-strength') {
    notebook = buildCeramicStrengthNotebook();
  } else {
    notebook = buildStandardNotebook(slug);
  }

  const notebookJson = JSON.stringify(notebook, null, 1) + '\n';
  // ... rest same as current ...
}
```

### Anti-Patterns to Avoid
- **Stuffing advanced logic into the standard template:** The standard template's 10-section flow does not accommodate model development/DOE. Do NOT add `if (slug === 'beam-deflections')` conditionals inside standard sections. Create separate builders.
- **Building a generic "advanced" template:** Each of the 3 case studies has fundamentally different analysis. Beam = nonlinear curve fitting. Random walk = autoregressive time series. Ceramic = multi-factor DOE. These share common setup but diverge after 4-plot.
- **Omitting the standard EDA before modeling:** Per NIST, ALL case studies start with the standard 4-plot and summary stats BEFORE developing the better model. The advanced notebooks must include the initial EDA that reveals why a standard model is inadequate.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sinusoidal model fitting | Manual least squares | `scipy.optimize.curve_fit` | Handles nonlinear parameter estimation, computes covariance matrix, handles convergence |
| AR(1) coefficient estimation | Manual OLS formulas | `scipy.stats.linregress(Y[:-1], Y[1:])` | Returns slope, intercept, std_err, t-value in one call |
| One-way ANOVA | Manual SS/MS/F computation | `scipy.stats.f_oneway(*groups)` | Handles unequal group sizes, returns F-stat and p-value |
| DOE interaction effects | Manual effect calculation | `df.groupby([f1, f2]).mean()` pivot | Pandas groupby + unstack produces the interaction matrix cleanly |
| Box plots by group | Manual matplotlib rectangles | `sns.boxplot(data=df, x=factor, y=response)` | Seaborn handles medians, IQR, outliers, whiskers automatically |

**Key insight:** All specialized statistical computations are one-liners in scipy/pandas. The complexity is in orchestrating the narrative flow (markdown cells explaining what each step shows), not in the math.

## Common Pitfalls

### Pitfall 1: curve_fit Convergence Failure
**What goes wrong:** `scipy.optimize.curve_fit` fails to converge for sinusoidal models without good initial guesses.
**Why it happens:** Sinusoidal fits are highly sensitive to frequency initial value. A wrong starting frequency means the optimizer finds a local minimum.
**How to avoid:** NIST specifies exact starting values: C=-177.44 (mean), amplitude=390, frequency=0.3025 (from spectral plot). Use `p0=[-177.44, -390, 0.3025, 1.5]` in curve_fit.
**Warning signs:** If fitted frequency differs significantly from 0.3026, the fit is wrong.

### Pitfall 2: AR(1) Model Off-By-One Error
**What goes wrong:** Using `Y[1:]` vs `Y[:-1]` in the wrong order, or losing one observation without explanation.
**Why it happens:** AR(1) regresses Y(i) on Y(i-1), producing N-1 residuals from N observations.
**How to avoid:** Explicitly: `slope, intercept, r, p, se = linregress(y[:-1], y[1:])`. This gives A1 (slope on Y(i-1)) and A0 (intercept). NIST values: A0=0.050165, A1=0.987087.
**Warning signs:** If residual count is not N-1 (499 for 500 observations).

### Pitfall 3: JAHANMI2.DAT Multi-Column Parsing
**What goes wrong:** The 15-column fixed-width format gets misaligned if `read_fwf` infers wrong column widths.
**Why it happens:** The file has irregular spacing (run IDs go from 1 to 960 with gaps, some IDs are 3 digits, some are 1).
**How to avoid:** Already handled: the registry config specifies `skipRows: 50` and explicit column names. The existing `buildLoadCode` in `data-loading.ts` already handles multi-column files with `pd.read_fwf(StringIO(data_text), header=None, names=[...])`. Verify with `assert len(df) == 480`.
**Warning signs:** Row count != 480 or column count != 15.

### Pitfall 4: Cell Index Collision Between Reused and New Sections
**What goes wrong:** If the advanced notebook reuses standard section builders but then starts new sections at a hardcoded index, cell IDs collide.
**Why it happens:** Cell IDs are deterministic from `cellId(slug, index)`. Same slug + same index = same ID.
**How to avoid:** Always pass `nextIndex` from the previous section to the next. Never reset `idx`. The existing pattern already handles this correctly.

### Pitfall 5: Forgetting to Extend Packager and Generation Script
**What goes wrong:** Advanced notebooks are built but not packaged into ZIPs or committed to notebooks/eda/.
**Why it happens:** The packager currently iterates only `STANDARD_SLUGS`, and `generate-notebooks.ts` only builds standard notebooks.
**How to avoid:** Export `ADVANCED_SLUGS` from the advanced template module. Update `notebookPackager` to iterate `[...STANDARD_SLUGS, ...ADVANCED_SLUGS]`. Update `generate-notebooks.ts` to also generate advanced notebooks.

### Pitfall 6: Ceramic Strength Direction Filter
**What goes wrong:** Using all 960 rows instead of the 480 longitudinal-only rows.
**Why it happens:** JAHANMI2.DAT contains only longitudinal data (480 rows). The full study has 960. The registry already specifies `expectedRows: 480`, and X4 (Direction) is always -1 in this subset.
**How to avoid:** The data file itself only has 480 rows (longitudinal only). The assertion `assert len(df) == 480` catches this. However, the notebook narrative should explain that only longitudinal data are used, so the user understands why X4 is not analyzed as a factor.

## Code Examples

### Beam Deflections: Sinusoidal Model Fitting (Python)
```python
# Source: NIST Handbook 1.4.2.5.3 (handbook/eda/section4/eda4253.htm)
# Model: Y(i) = C + A * sin(2*pi*freq*t + phi) + E(i)

from scipy.optimize import curve_fit

def sinusoidal_model(t, C, A, freq, phi):
    return C + A * np.sin(2 * np.pi * freq * t + phi)

y = df['Y'].values
t = np.arange(1, len(y) + 1)

# Starting values from NIST analysis:
# C = mean = -177.44, A = -390 (amplitude from complex demodulation)
# freq = 0.3025 (from spectral plot), phi = 1.5 (initial guess)
p0 = [-177.44, -390, 0.3025, 1.5]

popt, pcov = curve_fit(sinusoidal_model, t, y, p0=p0)
C_fit, A_fit, freq_fit, phi_fit = popt
perr = np.sqrt(np.diag(pcov))  # standard errors

# NIST reference values:
# C = -178.786 (+/- 11.02)
# AMP = -361.766 (+/- 26.19)
# FREQ = 0.302596 (+/- 0.000151)
# PHASE = 1.46536 (+/- 0.04909)
# Residual SD = 155.8484

y_pred = sinusoidal_model(t, *popt)
residuals = y - y_pred
resid_sd = np.std(residuals, ddof=4)  # 4 parameters estimated
```

### Random Walk: AR(1) Model (Python)
```python
# Source: NIST Handbook 1.4.2.3.3 (handbook/eda/section4/eda4233.htm)
# Model: Y(i) = A0 + A1 * Y(i-1) + E(i)

from scipy.stats import linregress

y = df['Y'].values

# AR(1): regress Y(i) on Y(i-1)
slope, intercept, r_value, p_value, std_err = linregress(y[:-1], y[1:])

# NIST reference values:
# A0 = 0.050165 (+/- 0.024171), t = 2.075
# A1 = 0.987087 (+/- 0.006313), t = 156.350
# Residual SD = 0.2931

y_pred = intercept + slope * y[:-1]
residuals = y[1:] - y_pred
resid_sd = np.std(residuals, ddof=2)  # 2 parameters estimated
```

### Ceramic Strength: DOE Analysis (Python)
```python
# Source: NIST Handbook 1.4.2.10.3-5 (handbook/eda/section4/eda42a3.htm-eda42a5.htm)

# Batch effect analysis
batch1 = df[df['Batch'] == 1]['Y']
batch2 = df[df['Batch'] == 2]['Y']

# NIST reference:
# Batch 1: N=240, mean=688.9987, SD=65.5491
# Batch 2: N=240, mean=611.1559, SD=61.8543

from scipy.stats import ttest_ind, f_oneway

# Two-sample t-test for batch means
t_stat, p_val = ttest_ind(batch1, batch2)
# NIST: T = 13.3806, pooled SD = 63.7285

# One-way ANOVA for primary factor effects (per batch)
for batch_num in [1, 2]:
    batch_data = df[df['Batch'] == batch_num]
    for factor in ['X1', 'X2', 'X3']:
        groups = [group['Y'].values for _, group in batch_data.groupby(factor)]
        f_stat, p_val = f_oneway(*groups)

# DOE Mean Plot
for factor in ['X1', 'X2', 'X3']:
    means = df.groupby(factor)['Y'].mean()

# Interaction plot
for f1, f2 in [('X1','X2'), ('X1','X3'), ('X2','X3')]:
    interaction = df.groupby([f1, f2])['Y'].mean().unstack()
```

## NIST-Verified Reference Values

### Beam Deflections (LEW.DAT)
| Parameter | NIST Value | Source |
|-----------|------------|--------|
| N | 200 | eda4251.htm |
| Mean | -177.435 | eda4252.htm |
| Std Dev | 277.332 | eda4252.htm |
| Min / Max | -579 / 300 | eda4252.htm |
| Fit C | -178.786 +/- 11.02 | eda4253.htm |
| Fit Amplitude | -361.766 +/- 26.19 | eda4253.htm |
| Fit Frequency | 0.302596 +/- 0.000151 | eda4253.htm |
| Fit Phase | 1.46536 +/- 0.04909 | eda4253.htm |
| Residual SD | 155.8484 | eda4253.htm |
| Residual SD (outliers removed) | 148.3398 | eda4254.htm |

### Random Walk (RANDWALK.DAT)
| Parameter | NIST Value | Source |
|-----------|------------|--------|
| N | 500 | eda4231.htm |
| Mean | 3.2167 | registry |
| Std Dev | 2.0787 | registry |
| AR(1) A0 | 0.050165 +/- 0.024171 | eda4233.htm |
| AR(1) A1 | 0.987087 +/- 0.006313 | eda4233.htm |
| AR(1) A1 t-value | 156.350 | eda4233.htm |
| Residual SD | 0.2931 | eda4233.htm |
| Variability reduction | 7x (2.079 -> 0.293) | eda4233.htm |
| Residual distribution | Uniform | eda4234.htm |

### Ceramic Strength (JAHANMI2.DAT)
| Parameter | NIST Value | Source |
|-----------|------------|--------|
| N | 480 | eda42a1.htm |
| Mean | 650.0773 | eda42a2.htm |
| Std Dev | 74.6383 | eda42a2.htm |
| Median | 646.6275 | eda42a2.htm |
| Min / Max | 345.294 / 821.654 | eda42a2.htm |
| Batch 1 N | 240 | eda42a3.htm |
| Batch 1 Mean | 688.9987 | eda42a3.htm |
| Batch 1 SD | 65.5491 | eda42a3.htm |
| Batch 2 N | 240 | eda42a3.htm |
| Batch 2 Mean | 611.1559 | eda42a3.htm |
| Batch 2 SD | 61.8543 | eda42a3.htm |
| Batch t-test T | 13.3806 | eda42a3.htm |
| Batch F-test F | 1.123 | eda42a3.htm |
| Batch effect magnitude | ~75-100 units | eda42a3.htm |
| Batch 1 dominant factor | X1 (table speed, effect=-30.77) | eda42a5.htm |
| Batch 2 dominant factor | X2 (down feed, effect=18.22) | eda42a5.htm |

## Notebook Section Flow (Per Case Study)

### Beam Deflections (NBADV-01)
1. Intro (reuse `buildIntro`)
2. Setup (reuse `buildSetup`)
3. Data Loading (reuse `buildDataLoading`) - 200 rows, single column Y
4. Summary Statistics (reuse `buildSummaryStats`)
5. 4-Plot (reuse `buildFourPlot`) - reveals non-randomness (circular lag plot)
6. **Initial EDA Interpretation** (NEW) - lag plot shows sinusoidal pattern, randomness violated
7. **Sinusoidal Model Fitting** (NEW) - curve_fit with starting values, parameter table
8. **Residual 4-Plot** (NEW) - 4-plot of residuals validates model
9. **Residual Interpretation** (NEW) - residuals are random, residual SD reduced from 277 to 156
10. Conclusions (NEW - specialized for beam deflections)

### Random Walk (NBADV-02)
1. Intro (reuse `buildIntro`)
2. Setup (reuse `buildSetup`)
3. Data Loading (reuse `buildDataLoading`) - 500 rows, single column Y
4. Summary Statistics (reuse `buildSummaryStats`)
5. 4-Plot (reuse `buildFourPlot`) - reveals strong autocorrelation (linear lag plot)
6. **Initial EDA Interpretation** (NEW) - lag plot shows linear Y(i) vs Y(i-1), strong autocorrelation
7. **AR(1) Model Development** (NEW) - linregress on Y[:-1] vs Y[1:]
8. **Predicted vs Original Plot** (NEW) - overlay predicted and actual
9. **Residual 4-Plot** (NEW) - 4-plot of residuals
10. **Residual Distribution** (NEW) - uniform probability plot of residuals
11. Conclusions (NEW - AR(1) model with uniform residuals)

### Ceramic Strength (NBADV-03)
1. Intro (reuse `buildIntro` - modified goals for DOE)
2. Setup (reuse `buildSetup`)
3. Data Loading (reuse `buildDataLoading`) - 480 rows, 15 columns
4. Summary Statistics (reuse `buildSummaryStats`)
5. 4-Plot (reuse `buildFourPlot`) - shows bimodal distribution
6. **Batch Effect Analysis** (NEW) - bihistogram, box plot, two-sample t-test, F-test
7. **Lab Effect Analysis** (NEW) - box plots by lab, by lab within each batch
8. **Primary Factor Analysis** (NEW) - DOE mean plots and SD plots per batch
9. **Interaction Effects** (NEW) - interaction plots per batch
10. **One-Way ANOVA** (NEW) - f_oneway for each factor
11. Conclusions (NEW - batch dominates, factor rankings differ by batch)

## Integration Points

### 1. Packager Extension
Currently `buildNotebookZipEntries` calls `buildStandardNotebook(slug)` for all slugs. This must be updated to dispatch to the correct builder based on slug. Options:

**Recommended approach:** Create a unified `buildNotebook(slug)` function that dispatches:
```typescript
// In a new file or in packager.ts
export function buildNotebook(slug: string): NotebookV4 {
  if (slug === 'beam-deflections') return buildBeamDeflectionsNotebook();
  if (slug === 'random-walk') return buildRandomWalkNotebook();
  if (slug === 'ceramic-strength') return buildCeramicStrengthNotebook();
  return buildStandardNotebook(slug);
}
```

Then update `buildNotebookZipEntries` to call `buildNotebook(slug)` instead of `buildStandardNotebook(slug)`.

### 2. Astro Integration Extension
`notebookPackager` currently iterates `STANDARD_SLUGS`. Add `ADVANCED_SLUGS`:
```typescript
const ADVANCED_SLUGS = ['beam-deflections', 'random-walk', 'ceramic-strength'];
const ALL_SLUGS = [...STANDARD_SLUGS, ...ADVANCED_SLUGS];
// Iterate ALL_SLUGS in the build hook
```

### 3. Generation Script Extension
`scripts/generate-notebooks.ts` must generate all 10 notebooks (7 standard + 3 advanced) to `notebooks/eda/`.

### 4. Committed Notebook Tests
`committed-notebooks.test.ts` currently validates only `STANDARD_SLUGS`. Extend to validate all 10.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Standard template for all 10 | Standard for 7, advanced for 3 | Phase 100 | Each advanced notebook gets a specialized section flow |
| STANDARD_SLUGS only | ALL_SLUGS (standard + advanced) | Phase 100 | Packager and generator produce all 10 |
| buildStandardNotebook only | buildNotebook dispatcher | Phase 100 | Single entry point for notebook generation |

## Open Questions

1. **Intro section customization for advanced notebooks**
   - What we know: The standard `buildIntro` generates generic "5 EDA goals" (location, variation, distribution, randomness, outliers). This is appropriate for beam-deflections and random-walk but NOT for ceramic-strength which has DOE-specific goals.
   - What's unclear: Should we create a separate intro builder for DOE or parameterize the existing one?
   - Recommendation: Ceramic strength should use a custom intro section that lists the DOE goals (determine strongest factor, estimate magnitudes, determine optimal settings, assess nuisance factors) per NIST 1.4.2.10.1. Beam and random-walk can reuse the standard intro.

2. **Tolerance for NIST reference value matching**
   - What we know: The success criterion says "statistical values match NIST-verified website values from v1.9". The NIST values have limited decimal precision in the HTML source.
   - What's unclear: How close is "match"? Exact to the printed precision? Within 1%?
   - Recommendation: Assert within the precision shown in the NIST tables. For example, beam fit C=-178.786 should match to +/-0.01. Use `np.isclose(computed, expected, rtol=1e-3)` or formatted string comparison.

3. **Standard hypothesis tests for ceramic strength**
   - What we know: The NIST ceramic case study does NOT run standard location/variation/randomness/distribution/outlier tests. It goes directly to batch effect and DOE analysis after the 4-plot.
   - What's unclear: Should we include standard hypothesis tests (like the other notebooks) or skip them?
   - Recommendation: Skip standard hypothesis tests for ceramic strength. The NIST analysis shows that the 4-plot reveals a bimodal distribution (batch effect), and the proper analysis path is DOE, not standard univariate tests. Including them would be misleading since the data are multi-factor.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.0.18 |
| Config file | vitest.config.ts (project root) |
| Quick run command | `npx vitest run src/lib/eda/notebooks/__tests__/ --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NBADV-01 | Beam notebook has sinusoidal model fit with curve_fit | unit | `npx vitest run src/lib/eda/notebooks/__tests__/advanced-notebooks.test.ts -t "beam" -x` | No - Wave 0 |
| NBADV-01 | Beam notebook residuals 4-plot section present | unit | `npx vitest run src/lib/eda/notebooks/__tests__/advanced-notebooks.test.ts -t "residual" -x` | No - Wave 0 |
| NBADV-02 | Random walk notebook has AR(1) linregress fit | unit | `npx vitest run src/lib/eda/notebooks/__tests__/advanced-notebooks.test.ts -t "random-walk" -x` | No - Wave 0 |
| NBADV-02 | Random walk residual analysis present | unit | `npx vitest run src/lib/eda/notebooks/__tests__/advanced-notebooks.test.ts -t "residual" -x` | No - Wave 0 |
| NBADV-03 | Ceramic notebook has batch effect analysis | unit | `npx vitest run src/lib/eda/notebooks/__tests__/advanced-notebooks.test.ts -t "ceramic" -x` | No - Wave 0 |
| NBADV-03 | Ceramic notebook has interaction plots | unit | `npx vitest run src/lib/eda/notebooks/__tests__/advanced-notebooks.test.ts -t "interaction" -x` | No - Wave 0 |
| NBADV-03 | Ceramic notebook has one-way ANOVA | unit | `npx vitest run src/lib/eda/notebooks/__tests__/advanced-notebooks.test.ts -t "anova" -x` | No - Wave 0 |
| ALL | All 3 notebooks produce valid nbformat v4.5 JSON | unit | `npx vitest run src/lib/eda/notebooks/__tests__/advanced-notebooks.test.ts -t "nbformat" -x` | No - Wave 0 |
| ALL | All 3 .ipynb committed files exist in notebooks/eda/ | unit | `npx vitest run src/lib/eda/notebooks/__tests__/committed-notebooks.test.ts -x` | Yes (needs update) |
| ALL | Packager produces ZIPs for all 10 slugs | unit | `npx vitest run src/lib/eda/notebooks/__tests__/notebook-packager.test.ts -x` | Yes (needs update) |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/eda/notebooks/__tests__/ --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/eda/notebooks/__tests__/advanced-notebooks.test.ts` -- covers NBADV-01, NBADV-02, NBADV-03
- [ ] Update `committed-notebooks.test.ts` -- extend to validate all 10 slugs
- [ ] Update `notebook-packager.test.ts` -- extend to package all 10 slugs

## Sources

### Primary (HIGH confidence)
- NIST Handbook Section 1.4.2.5 (Beam Deflections) - local files `handbook/eda/section4/eda4251.htm` through `eda4255.htm` - model parameters, fit results, residual analysis
- NIST Handbook Section 1.4.2.3 (Random Walk) - local files `handbook/eda/section4/eda4231.htm` through `eda4234.htm` - AR(1) coefficients, residual distribution
- NIST Handbook Section 1.4.2.10 (Ceramic Strength) - local files `handbook/eda/section4/eda42a1.htm` through `eda42a6.htm` - DOE analysis, batch effects, factor rankings
- Project source code - `src/lib/eda/notebooks/` - types, cells, registry, templates, packager
- Dataset files - `handbook/datasets/LEW.DAT`, `RANDWALK.DAT`, `JAHANMI2.DAT` - data format and structure verified

### Secondary (MEDIUM confidence)
- scipy.optimize.curve_fit API - well-known, stable API for nonlinear least squares
- scipy.stats.linregress API - standard OLS linear regression
- scipy.stats.f_oneway API - standard one-way ANOVA

### Tertiary (LOW confidence)
- None. All findings based on project source code and local NIST handbook files.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all dependencies already installed, no new packages needed
- Architecture: HIGH - follows exact patterns established in Phase 96-97, all section builders verified
- NIST reference values: HIGH - extracted directly from local handbook HTML files
- Pitfalls: HIGH - based on actual code review of existing templates and data files
- Validation: HIGH - test framework and patterns are established

**Research date:** 2026-03-14
**Valid until:** No expiration - based on stable NIST reference data and established project patterns
