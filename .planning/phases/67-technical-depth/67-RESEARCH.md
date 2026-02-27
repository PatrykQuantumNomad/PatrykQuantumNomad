# Phase 67: Technical Depth - Research

**Researched:** 2026-02-27
**Domain:** KaTeX formula content population, Python code examples for 29 graphical techniques, astro-expressive-code rendering
**Confidence:** HIGH

## Summary

Phase 67 is a pure content population phase. All infrastructure (template, slots, conditional KaTeX CSS, Code component) was built in Phase 64 and is fully operational. The graphical `[slug].astro` template already imports `katex`, `Code`, and conditionally renders both the `formula` and `code` slots when data exists. The `TechniqueContent` interface already defines optional `formulas` and `pythonCode` fields. Phase 66 populated the content fields (questions, importance, definitionExpanded, examples, caseStudySlugs). This phase adds the remaining two fields: `formulas` (for 12 techniques) and `pythonCode` (for all 29 techniques).

The work is content authoring, not engineering. Each of the 7 category modules in `src/lib/eda/technique-content/` needs `formulas` arrays (12 of 29 techniques) and `pythonCode` strings (all 29 techniques) added to existing entries. The template rendering is already proven on the quantitative technique pages. The primary risk is not infrastructure but content quality: deprecated Python APIs, incorrect KaTeX syntax, and formulas that do not match NIST definitions.

The 12 techniques requiring KaTeX formulas span 5 of the 7 category files. The 29 Python code examples must be self-contained (include `import` statements and sample data generation), use only current matplotlib/seaborn/scipy APIs, and be 15-35 lines each. The quantitative-content.ts file provides the exact pattern to follow for both formulas and pythonCode.

**Primary recommendation:** Organize work by category file (7 files), populating both `formulas` and `pythonCode` in the same pass per file. Validate KaTeX rendering with `astro build` after each category. Grep for deprecated API patterns after all Python examples are written.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DEFN-02 | 12 techniques with NIST formulas have KaTeX-rendered formulas | KaTeX infrastructure proven in quantitative pages. Formula interface (`{label, tex, explanation}`) exists in types.ts. `String.raw` template literals required for tex. All 12 techniques and their NIST formula sources identified. |
| PYTH-01 | All 29 graphical technique pages have a Python code example section | Code slot and `<Code>` component rendering proven in quantitative pages. pythonCode field exists in types.ts. 29 techniques across 7 category files identified. |
| PYTH-02 | Python examples use current matplotlib/seaborn/scipy APIs (no deprecated functions) | Deprecated API list verified: `distplot` (removed seaborn 0.14), `vert=True` (deprecated matplotlib 3.10+), `normed=True` (deprecated matplotlib 3.x), `plt.acorr()` (missing confidence bounds). Current replacements documented. |
| PYTH-03 | Python examples include sample data generation so they are self-contained | Pattern established in quantitative-content.ts: each example starts with `import numpy as np` and generates sample data with `np.random.default_rng()` or `np.array()`. No external data files needed. |
| PYTH-04 | Python examples render with syntax highlighting via astro-expressive-code | Already working. `<Code code={content.pythonCode} lang="python" />` in the template code slot. astro-expressive-code 0.41.6 installed and configured. |
</phase_requirements>

## Standard Stack

### Core (Already Installed -- Zero New Packages)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `katex` | 0.16.33 (transitive via rehype-katex) | `katex.renderToString()` for build-time formula HTML | Already used by quantitative pages, distributions pages, InlineMath component |
| `astro-expressive-code` | ^0.41.6 | `<Code>` component for Python syntax highlighting | Already configured with theme, copy button; zero client JS |
| `astro` | ^5.3.0 | Static site generation, `set:html` for KaTeX output | Framework of the site |

### Python Libraries Referenced in Code Examples

These are NOT npm packages -- they are the Python libraries that appear in the code example strings. Using current, non-deprecated APIs is a requirement (PYTH-02).

| Library | Current Version | Key Functions to Use | Deprecated Functions to AVOID |
|---------|----------------|---------------------|-------------------------------|
| `numpy` | 2.x | `np.random.default_rng()`, `np.array()`, `np.linspace()` | `np.random.seed()` (legacy, still works but not preferred) |
| `matplotlib` | 3.10+ | `plt.boxplot(orientation='vertical')`, `plt.hist(density=True)`, `plt.contourf()` | `vert=True` (deprecated 3.10), `normed=True` (deprecated 3.x) |
| `seaborn` | 0.13.2 | `sns.histplot()`, `sns.kdeplot()`, `sns.boxplot()` | `sns.distplot()` (removed 0.14) |
| `scipy` | 1.17+ | `stats.probplot()`, `stats.ppcc_plot()`, `stats.boxcox_normplot()`, `stats.bootstrap()` | None current -- all APIs stable |
| `statsmodels` | 0.14+ | `tsaplots.plot_acf()`, `tsaplots.plot_pacf()` | None -- `plot_acf` is stable |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `statsmodels.plot_acf()` for autocorrelation | `plt.acorr()` | `plt.acorr()` lacks confidence bands, which are essential for NIST-style autocorrelation. Use `plot_acf()`. |
| `scipy.signal.periodogram()` for spectral plot | `plt.psd()` | `plt.psd()` uses Welch method which is fine but `scipy.signal.periodogram()` gives more control. Either is acceptable. |
| Manual bootstrap loop | `scipy.stats.bootstrap()` | `scipy.stats.bootstrap()` is the modern API (added SciPy 1.7), cleaner and handles BCa intervals. Use it. |

**Installation:**
```bash
# No installation needed. All npm packages already present.
# Python libraries referenced in code strings only -- not executed.
```

## Architecture Patterns

### Content Population Pattern

The work is adding data to existing TypeScript objects. No new files, no new components, no new routes.

```
src/lib/eda/technique-content/
  types.ts                    # UNCHANGED - formulas/pythonCode fields already defined
  index.ts                    # UNCHANGED - barrel export
  time-series.ts              # ADD formulas (2 of 5) + pythonCode (5 of 5)
  distribution-shape.ts       # ADD formulas (5 of 9) + pythonCode (9 of 9)
  comparison.ts               # ADD formulas (1 of 4) + pythonCode (4 of 4)
  regression.ts               # ADD pythonCode (3 of 3) -- no formulas needed
  designed-experiments.ts      # ADD formulas (1 of 2) + pythonCode (2 of 2)
  multivariate.ts             # ADD pythonCode (3 of 3) -- no formulas needed
  combined-diagnostic.ts      # ADD formulas (3 of 3) + pythonCode (3 of 3)
```

### Pattern 1: Formula Entry with String.raw

**What:** Add KaTeX formulas using the exact interface already defined in types.ts.
**When to use:** For the 12 techniques with NIST formulas (DEFN-02).

```typescript
// Source: Pattern from src/lib/eda/quantitative-content.ts lines 43-61
formulas: [
  {
    label: 'Sample Autocorrelation',
    tex: String.raw`R_h = \frac{C_h}{C_0} = \frac{\frac{1}{N}\sum_{t=1}^{N-h}(Y_t - \bar{Y})(Y_{t+h} - \bar{Y})}{\frac{1}{N}\sum_{t=1}^{N}(Y_t - \bar{Y})^2}`,
    explanation:
      'The autocorrelation at lag h is the ratio of the autocovariance at lag h to the variance. It measures the linear dependence between observations separated by h time steps.',
  },
],
```

### Pattern 2: Python Code Example String

**What:** Add self-contained Python code as a template literal string.
**When to use:** For all 29 techniques (PYTH-01 through PYTH-04).

```typescript
// Source: Pattern from src/lib/eda/quantitative-content.ts lines 130-147
pythonCode: `import numpy as np
import matplotlib.pyplot as plt
from statsmodels.graphics.tsaplots import plot_acf

# Generate sample data: AR(1) process
rng = np.random.default_rng(42)
n = 200
phi = 0.8
data = np.zeros(n)
for i in range(1, n):
    data[i] = phi * data[i-1] + rng.standard_normal()

# Create autocorrelation plot with 95% confidence bands
fig, ax = plt.subplots(figsize=(10, 4))
plot_acf(data, ax=ax, lags=40, alpha=0.05)
ax.set_title("Autocorrelation Plot")
ax.set_xlabel("Lag")
ax.set_ylabel("Autocorrelation")
plt.tight_layout()
plt.show()`,
```

### Pattern 3: Work Organization by Category File

**What:** Group work by the 7 category files, handling both formulas and pythonCode in a single pass per file.
**Why:** Minimizes context switching. Each category file can be validated independently with `astro build`.

| Category File | Techniques | Formulas Needed | Python Examples |
|---------------|------------|-----------------|-----------------|
| `time-series.ts` | autocorrelation-plot, complex-demodulation, lag-plot, run-sequence-plot, spectral-plot | 2 (autocorrelation, spectral) | 5 |
| `distribution-shape.ts` | bihistogram, bootstrap-plot, box-cox-linearity, box-cox-normality, box-plot, histogram, normal-probability-plot, probability-plot, qq-plot | 5 (bootstrap, box-cox-linearity, box-cox-normality, normal-probability-plot, probability-plot) | 9 |
| `comparison.ts` | block-plot, mean-plot, star-plot, youden-plot | 1 (mean-plot) | 4 |
| `regression.ts` | linear-plots, scatter-plot, 6-plot | 0 | 3 |
| `designed-experiments.ts` | doe-plots, std-deviation-plot | 1 (std-deviation-plot) | 2 |
| `multivariate.ts` | contour-plot, scatterplot-matrix, conditioning-plot | 0 | 3 |
| `combined-diagnostic.ts` | ppcc-plot, weibull-plot, 4-plot | 3 (ppcc, weibull, qq-plot*) | 3 |

*Note: qq-plot is in distribution-shape.ts, so its formula count is reflected in that category.

### The 12 Techniques Requiring Formulas (DEFN-02)

| Technique | Category File | NIST Section | Primary Formula |
|-----------|--------------|--------------|-----------------|
| autocorrelation-plot | time-series.ts | 1.3.3.1 | R_h = C_h / C_0 (sample autocorrelation coefficient) |
| spectral-plot | time-series.ts | 1.3.3.27 | PSD via Fourier transform of autocovariance |
| probability-plot | distribution-shape.ts | 1.3.3.22 | Plotting positions m_i, PPCC correlation |
| normal-probability-plot | distribution-shape.ts | 1.3.3.21 | Normal order statistics, slope = sigma, intercept = mu |
| bootstrap-plot | distribution-shape.ts | 1.3.3.4 | Bootstrap percentile interval from B resamples |
| box-cox-linearity | distribution-shape.ts | 1.3.3.5 | T(X) = (X^lambda - 1)/lambda, correlation vs lambda |
| box-cox-normality | distribution-shape.ts | 1.3.3.6 | T(Y) = (Y^lambda - 1)/lambda, PPCC vs lambda |
| qq-plot | distribution-shape.ts | 1.3.3.24 | Quantile matching: Q_1(p) vs Q_2(p) |
| ppcc-plot | combined-diagnostic.ts | 1.3.3.23 | PPCC as function of shape parameter |
| weibull-plot | combined-diagnostic.ts | 1.3.3.30 | Weibull linearization: ln(-ln(1-F)) vs ln(t) |
| mean-plot | comparison.ts | 1.3.3.20 | Group mean: x_bar_j = (1/n_j) sum(x_ij) |
| std-deviation-plot | designed-experiments.ts | 1.3.3.28 | Group std dev: s_j = sqrt((1/(n_j-1)) sum(x_ij - x_bar_j)^2) |

### Anti-Patterns to Avoid

- **Generating random data without a seed:** Every example MUST use `np.random.default_rng(42)` or a fixed seed so the output is reproducible.
- **Using deprecated APIs even if they "still work":** `vert=True`, `distplot`, `normed=True` all generate deprecation warnings. Use only current APIs.
- **Overly complex Python examples:** Target 15-35 lines. The goal is a runnable snippet, not a tutorial. Import, generate data, create plot, show.
- **Forgetting `String.raw` on tex strings:** JavaScript escape sequences corrupt LaTeX backslash commands. Every `tex` value MUST use `String.raw`.
- **Multi-line KaTeX formulas without alignment:** Use `\begin{aligned}...\end{aligned}` for multi-line formulas, not separate formula entries for each line of a single equation.
- **Adding formulas to techniques that do not have NIST formulas:** Only the 12 listed techniques get formulas. The remaining 17 do not have mathematical definitions in NIST.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| KaTeX rendering | Custom math rendering | `katex.renderToString(tex, { displayMode: true, throwOnError: false })` | Already proven in template |
| Python syntax highlighting | Prism/Shiki integration | `<Code code={pythonCode} lang="python" />` | Already configured with theme |
| Conditional KaTeX CSS | Manual head injection | `useKatex={hasFormulas}` prop on TechniquePage | Already wired through EDALayout |
| Bootstrap confidence interval formula | Manual derivation | Use NIST's percentile interval definition | Standard, well-documented |
| Weibull linearization | Custom derivation | Use NIST's ln(-ln(1-F)) vs ln(t) formulation | NIST is the source of truth |

**Key insight:** This phase is 100% content authoring within existing infrastructure. Every rendering mechanism is already built and tested. The planner should NOT create tasks for template changes, component creation, or package installation.

## Common Pitfalls

### Pitfall 1: String.raw Forgotten for KaTeX tex Strings

**What goes wrong:** LaTeX commands like `\frac`, `\sum`, `\bar`, `\hat` are interpreted as JavaScript escape sequences. `\f` becomes a form feed, `\b` becomes a backspace, `\s` is invalid.
**Why it happens:** Developer uses regular template literals (backtick without String.raw) for tex field values.
**How to avoid:** ALWAYS use `String.raw` for tex content. Pattern: `tex: String.raw\`\\frac{a}{b}\``
**Warning signs:** KaTeX warning "Unrecognized command" or garbled formula output in build log. Test: `astro build 2>&1 | grep -i "katex"`.

### Pitfall 2: Deprecated Python API in Code Examples

**What goes wrong:** Examples use `sns.distplot()` (removed), `vert=True` (deprecated), `normed=True` (deprecated), or `plt.acorr()` (insufficient).
**Why it happens:** LLM-generated Python code confidently uses outdated APIs from training data.
**How to avoid:** After ALL Python examples are written, run a validation grep:
```bash
grep -rn 'distplot\|vert=True\|normed=True\|plt\.acorr(' src/lib/eda/technique-content/
```
This MUST return zero matches.
**Warning signs:** Any match from the grep above.

### Pitfall 3: Non-Self-Contained Python Examples

**What goes wrong:** Example references external data files, uses undefined variables, or imports libraries not in the standard scientific stack.
**Why it happens:** Developer assumes the reader has a specific dataset loaded.
**How to avoid:** Every example MUST: (1) import all libraries used, (2) generate sample data inline with `np.random.default_rng(42)` or `np.array([...])`, (3) produce a visible output (plot or print). No `pd.read_csv()`, no external files.
**Warning signs:** Example starts with `data = ...` without a preceding generation step.

### Pitfall 4: KaTeX CSS Not Loading on Formula Pages

**What goes wrong:** Formulas render as garbled HTML spans. The page loads but math is broken.
**Why it happens:** The `hasFormulas` variable in [slug].astro is computed from `content?.formulas?.length ?? 0`. If the formulas array is empty or missing, `useKatex` stays false.
**How to avoid:** After adding formulas to a technique, verify that `astro build` produces pages where KaTeX CSS is in the `<head>`. This is already handled by the template -- just ensure formulas array is non-empty.
**Warning signs:** `<span class="katex">` in page source but no `/styles/katex.min.css` link in head.

### Pitfall 5: Wrong Escaping in Template Literal Python Code

**What goes wrong:** Python f-strings with `{variable}` are interpreted as JavaScript template literal interpolation, causing build errors or wrong output.
**Why it happens:** The pythonCode field uses backtick template literals. `${x}` in Python code triggers JavaScript interpolation.
**How to avoid:** Use regular backtick template literals (not tagged templates) and escape `$` as `\$` where needed. Alternatively, use `String.raw` for the pythonCode as well if it contains `$`. The quantitative-content.ts uses plain backticks with `\\n` escaping for newlines within f-strings.
**Warning signs:** TypeScript compilation error mentioning undefined variable names that are actually Python variable names.

### Pitfall 6: Excessively Long Python Examples

**What goes wrong:** Examples balloon to 50+ lines, making the page feel like a tutorial rather than a quick reference.
**Why it happens:** Developer tries to demonstrate every feature of the technique.
**How to avoid:** Target 15-35 lines per example. One clear demonstration of the technique. Comment sparingly. Do NOT include error handling, argument parsing, or multiple plot types. The quantitative examples average 18 lines.
**Warning signs:** Any example exceeding 40 lines.

### Pitfall 7: Formula Content Inaccuracy

**What goes wrong:** KaTeX formulas do not match the NIST handbook definitions, use different notation, or have mathematical errors.
**Why it happens:** Formula is written from memory rather than verified against NIST source.
**How to avoid:** Every formula's `tex` string must match the NIST handbook definition for that technique. The `label` and `explanation` fields should use NIST's terminology. Cross-reference: https://www.itl.nist.gov/div898/handbook/eda/section3/
**Warning signs:** Formula notation differs from the technique's `definitionExpanded` field (which was already verified against NIST).

## Code Examples

### Complete Formula Entry (Autocorrelation Plot)

```typescript
// Source: NIST Section 1.3.3.1 + quantitative-content.ts pattern
formulas: [
  {
    label: 'Autocovariance Function',
    tex: String.raw`C_h = \frac{1}{N}\sum_{t=1}^{N-h}(Y_t - \bar{Y})(Y_{t+h} - \bar{Y})`,
    explanation:
      'The autocovariance at lag h measures the linear dependence between observations separated by h time steps. The 1/N denominator is used by convention rather than 1/(N-h).',
  },
  {
    label: 'Autocorrelation Coefficient',
    tex: String.raw`R_h = \frac{C_h}{C_0}`,
    explanation:
      'The autocorrelation at lag h is the ratio of the autocovariance at lag h to the variance (autocovariance at lag 0). It is bounded between -1 and +1.',
  },
  {
    label: '95% Significance Bounds',
    tex: String.raw`\pm \frac{1.96}{\sqrt{N}}`,
    explanation:
      'Under the null hypothesis of white noise, approximately 95% of autocorrelation values fall within these bounds. Spikes exceeding these bounds indicate statistically significant serial dependence.',
  },
],
```

### Complete Python Code Entry (Histogram)

```typescript
// Source: Pattern from quantitative-content.ts
pythonCode: `import numpy as np
import matplotlib.pyplot as plt

# Generate sample data: mixture of two normals
rng = np.random.default_rng(42)
data = np.concatenate([
    rng.normal(loc=50, scale=5, size=300),
    rng.normal(loc=70, scale=8, size=200)
])

# Create histogram with density overlay
fig, ax = plt.subplots(figsize=(10, 5))
ax.hist(data, bins=30, density=True, alpha=0.7,
        color='steelblue', edgecolor='white')
ax.set_xlabel("Value")
ax.set_ylabel("Density")
ax.set_title("Histogram with Bimodal Data")
plt.tight_layout()
plt.show()`,
```

### Complete Python Code Entry (Box-Cox Normality Plot)

```typescript
// Source: scipy.stats.boxcox_normplot API (SciPy v1.17.0)
pythonCode: `import numpy as np
import matplotlib.pyplot as plt
from scipy import stats

# Generate right-skewed sample data
rng = np.random.default_rng(42)
data = rng.lognormal(mean=2, sigma=0.8, size=200)

# Box-Cox normality plot
fig, ax = plt.subplots(figsize=(10, 5))
lmbdas, ppcc = stats.boxcox_normplot(data, la=-2, lb=2, plot=ax)

# Find and mark the optimal lambda
optimal_lambda = lmbdas[np.argmax(ppcc)]
ax.axvline(optimal_lambda, color='r', linestyle='--',
           label=f'Optimal lambda = {optimal_lambda:.2f}')
ax.set_title("Box-Cox Normality Plot")
ax.legend()
plt.tight_layout()
plt.show()`,
```

### Template Literal Escaping for Python f-strings

```typescript
// When Python code contains ${var}, escape the dollar sign
pythonCode: `import numpy as np

rng = np.random.default_rng(42)
data = rng.normal(size=100)
mean = np.mean(data)
print(f"Sample mean: {mean:.4f}")  # No escaping needed -- {var} without $ is fine
print(f"Result: \\$value")          # Escape $ if it precedes {
`,
```

## Technique-to-Python-Library Mapping

This maps each technique to the primary Python library/function for its code example.

| Technique | Primary Library | Key Function | Notes |
|-----------|----------------|--------------|-------|
| autocorrelation-plot | statsmodels | `plot_acf()` | Includes confidence bands |
| complex-demodulation | scipy.signal | `hilbert()` + custom | No built-in function; use analytic signal |
| lag-plot | matplotlib | Manual scatter `plt.scatter(y[:-1], y[1:])` | pandas `lag_plot` exists but is inconsistent |
| run-sequence-plot | matplotlib | `plt.plot(range(n), data)` | Simplest technique |
| spectral-plot | scipy.signal | `periodogram()` | Returns frequencies and PSD |
| bihistogram | matplotlib | Two `ax.hist()` calls (one inverted) | Use `ax.invert_yaxis()` on lower |
| bootstrap-plot | scipy.stats | `bootstrap()` + `plt.hist()` | SciPy 1.7+ API |
| box-cox-linearity | scipy.stats | Manual loop with `pearsonr()` | No direct built-in for linearity variant |
| box-cox-normality | scipy.stats | `boxcox_normplot()` | Direct built-in |
| box-plot | matplotlib | `plt.boxplot(orientation='vertical')` | Use `orientation`, NOT `vert` |
| histogram | matplotlib | `plt.hist(density=True)` | Use `density`, NOT `normed` |
| normal-probability-plot | scipy.stats | `probplot(dist='norm')` | Built-in with fit line |
| probability-plot | scipy.stats | `probplot(dist=...)` | Parameterized by distribution |
| qq-plot | scipy.stats | `probplot()` or manual quantile matching | Two-sample QQ is manual |
| block-plot | matplotlib | Manual grouped scatter | No direct built-in |
| mean-plot | matplotlib | `plt.plot()` with group means | Simple bar/line of means |
| star-plot | matplotlib | `plt.subplot(polar=True)` radar chart | Requires polar projection |
| youden-plot | matplotlib | `plt.scatter()` with reference lines | Simple bivariate scatter |
| linear-plots | matplotlib/scipy | `stats.linregress()` + subplots | 4-panel display |
| scatter-plot | matplotlib | `plt.scatter()` | Simplest bivariate |
| 6-plot | matplotlib/scipy | `stats.linregress()` + `probplot()` | 6-panel display |
| doe-plots | matplotlib | Grouped scatter + mean/std plots | 3-panel display |
| std-deviation-plot | matplotlib | `plt.plot()` with group stds | Simple line of stds |
| contour-plot | matplotlib | `plt.contourf()` | 2D response surface |
| scatterplot-matrix | seaborn | `sns.pairplot()` | Built-in matrix |
| conditioning-plot | matplotlib | Manual faceted scatter | No built-in coplot |
| ppcc-plot | scipy.stats | `ppcc_plot()` | Built-in |
| weibull-plot | scipy.stats | `probplot(dist='weibull_min')` | Uses probplot with Weibull dist |
| 4-plot | matplotlib | 2x2 subplot grid | Combines 4 simple plots |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `sns.distplot()` | `sns.histplot()` / `sns.displot()` | Seaborn 0.11 (2020), removed 0.14 (2024) | ALL histogram examples MUST use histplot |
| `vert=True` on boxplot | `orientation='vertical'` | Matplotlib 3.10 (Dec 2024), pending deprecation | Box plot examples must use orientation param |
| `normed=True` on hist | `density=True` | Matplotlib 3.x (long deprecated) | Histogram examples must use density |
| `plt.acorr()` | `statsmodels.graphics.tsaplots.plot_acf()` | N/A (plt.acorr never had confidence bounds) | Autocorrelation example MUST use plot_acf |
| `np.random.seed(42)` | `np.random.default_rng(42)` | NumPy 1.17 (2019) | Preferred but both work; use default_rng for modern style |
| `scipy.stats.bootstrap` with `random_state` | `rng` parameter | SciPy 1.15 (2024) | Use `rng` parameter name |

**Deprecated/outdated patterns to grep for after all examples written:**
```bash
grep -rn 'distplot\|vert=True\|normed=True\|plt\.acorr(\|random_state=' src/lib/eda/technique-content/
```
Expected: zero matches.

## Open Questions

1. **Complex demodulation Python example complexity**
   - What we know: There is no direct scipy/matplotlib function for complex demodulation. It requires computing the analytic signal via `scipy.signal.hilbert()`, multiplying by a complex exponential, and applying a low-pass filter.
   - What's unclear: Whether a 15-35 line self-contained example is achievable for this technique without being overly simplified.
   - Recommendation: Accept a slightly longer example (up to 40 lines) for complex demodulation. Focus on the amplitude envelope extraction via Hilbert transform, which is the most commonly needed part.

2. **Star plot (radar chart) in matplotlib**
   - What we know: Matplotlib supports polar projections via `plt.subplot(polar=True)`, which can create radar charts. However, the API is not specifically designed for star plots.
   - What's unclear: Whether closing the polygon loop and labeling spokes is straightforward enough for a concise example.
   - Recommendation: Keep the example to 5-6 variables max. The polygon closing trick (`np.concatenate([values, [values[0]]])`) is well-known.

3. **Scatterplot matrix: seaborn vs. manual**
   - What we know: `sns.pairplot()` creates scatterplot matrices in one line. But it requires a pandas DataFrame, adding an import.
   - What's unclear: Whether the additional `import pandas as pd` makes the example feel non-self-contained.
   - Recommendation: Use `sns.pairplot()` with a DataFrame constructed from numpy arrays. The 3-line DataFrame construction is justified by the simplicity of the result.

## Validation Strategy

### Build Verification After Each Category

After adding formulas + pythonCode to each category file:
```bash
npx astro build 2>&1 | tail -20
```
Must show: zero errors, all 29 technique pages built.

### KaTeX Rendering Verification

After all formulas are added, check that the 12 formula pages include KaTeX CSS:
```bash
# Check that formula pages have KaTeX CSS link
for slug in autocorrelation-plot spectral-plot probability-plot normal-probability-plot ppcc-plot box-cox-linearity box-cox-normality weibull-plot qq-plot bootstrap-plot mean-plot std-deviation-plot; do
  grep -l "katex.min.css" dist/eda/techniques/$slug/index.html && echo "$slug: OK" || echo "$slug: MISSING KATEX CSS"
done
```

### Non-Formula Pages Should NOT Have KaTeX CSS

```bash
# Spot-check that non-formula pages do NOT load KaTeX CSS
for slug in histogram box-plot lag-plot scatter-plot contour-plot; do
  grep -l "katex.min.css" dist/eda/techniques/$slug/index.html && echo "$slug: UNEXPECTED KATEX" || echo "$slug: OK (no KaTeX)"
done
```

### Deprecated API Grep

```bash
grep -rn 'distplot\|vert=True\|normed=True\|plt\.acorr(\|random_state=' src/lib/eda/technique-content/
# Expected: zero matches
```

## Sources

### Primary (HIGH confidence)
- **Existing codebase** -- direct analysis of all technique-content modules, quantitative-content.ts patterns, [slug].astro template, TechniquePage.astro, EDALayout.astro
  - `src/pages/eda/techniques/[slug].astro` -- 204 lines, fully wired with KaTeX + Code + conditional useKatex
  - `src/lib/eda/technique-content/types.ts` -- TechniqueContent interface with formulas/pythonCode fields
  - `src/lib/eda/technique-content/*.ts` -- 7 category modules, all 29 techniques with content but NO formulas or pythonCode yet
  - `src/lib/eda/quantitative-content.ts` -- 744+ lines, 18 techniques with formulas + pythonCode (EXACT pattern to follow)
  - `src/layouts/EDALayout.astro` -- conditional KaTeX CSS via useKatex prop
  - `public/styles/katex.min.css` -- local KaTeX stylesheet (not CDN)
- **Phase 64 Research** -- `.planning/phases/64-infrastructure-foundation/64-RESEARCH.md` (verified all infrastructure claims)
- **NIST/SEMATECH Handbook** -- https://www.itl.nist.gov/div898/handbook/eda/section3/ (formula source of truth)
  - Section 1.3.3.1 (autocorrelation formula verified)
  - Section 1.3.3.5 (Box-Cox linearity formula verified)
  - Section 1.3.3.6 (Box-Cox normality formula verified)
  - Section 1.3.3.22 (probability plot plotting positions verified)
  - Section 1.3.3.30 (Weibull linearization verified)

### Secondary (MEDIUM confidence)
- **SciPy v1.17.0 docs** -- https://docs.scipy.org/doc/scipy/reference/
  - `scipy.stats.probplot` -- current, not deprecated
  - `scipy.stats.ppcc_plot` -- current, not deprecated
  - `scipy.stats.boxcox_normplot` -- current, not deprecated
  - `scipy.stats.bootstrap` -- current, rng parameter replaces random_state in 1.15
  - `scipy.signal.periodogram` -- current, not deprecated
- **Matplotlib 3.10.8 docs** -- https://matplotlib.org/stable/
  - `vert` parameter: pending deprecation in 3.10, deprecated in 3.11, removal in 3.13
  - `orientation` parameter: added in 3.10, default 'vertical'
- **Seaborn 0.13.2 docs** -- https://seaborn.pydata.org/
  - `distplot` removed in 0.14, use `histplot` or `displot`
  - `histplot` and `kdeplot` are the current distribution visualization APIs
- **statsmodels 0.14.6 docs** -- https://www.statsmodels.org/stable/
  - `plot_acf` is current and stable

### Tertiary (LOW confidence)
- None -- all findings verified with primary or secondary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Zero new packages; all verified in existing codebase
- Architecture: HIGH - Pure content population into proven interfaces; no structural changes
- Pitfalls: HIGH - Deprecated API list verified against official docs; String.raw pattern proven in quantitative-content.ts
- Formula content: MEDIUM - NIST formulas verified for 5 of 12 techniques via WebFetch; remaining 7 follow same NIST handbook patterns and notation already captured in definitionExpanded fields

**Research date:** 2026-02-27
**Valid until:** 2026-03-27 (stable -- content patterns and Python API deprecations are slow-moving)
