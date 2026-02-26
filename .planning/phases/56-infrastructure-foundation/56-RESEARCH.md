# Phase 56: Infrastructure Foundation - Research

**Researched:** 2026-02-26
**Domain:** Statistical hypothesis testing (TypeScript), Astro component extraction, documentation templates
**Confidence:** HIGH

## Summary

Phase 56 establishes shared infrastructure for all subsequent case study phases (57-62). It has four requirements: (1) adding seven hypothesis test functions to the existing statistics library, (2) extracting a shared PlotFigure.astro wrapper from the highly repetitive figure HTML in all nine *Plots.astro components, (3) creating a canonical section template document for case study structure, and (4) building a URL cross-reference cheat sheet mapping all technique and quantitative slugs.

The existing codebase is well-structured for all four requirements. The statistics library (`src/lib/eda/math/statistics.ts`) already contains `mean`, `standardDeviation`, `linearRegression`, `normalQuantile`, `autocorrelation`, `kde`, `fft`, and `powerSpectrum` -- the new hypothesis tests build directly on these primitives. The nine *Plots.astro components share an identical 11-line figure HTML block that is a textbook extraction target. The case study MDX files already follow a near-identical structure (Background and Data, Test Underlying Assumptions, Graphical Output, Quantitative Results, Conclusions), making the canonical template a documentation exercise rather than a design problem. The routes.ts file already centralizes URL patterns, making the cross-reference cheat sheet a matter of enumeration.

**Primary recommendation:** Implement the four requirements in dependency order: statistics functions first (INFRA-01, since later phases compute values), then PlotFigure extraction (INFRA-02, since later phases add Plots components), then template and cheat sheet (INFRA-03/04, pure documentation).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-01 | Hypothesis test functions added to statistics library (runs test, Levene test, Bartlett test, Anderson-Darling, Grubbs test, PPCC, location regression t-test) | Full NIST formulas documented below with implementation patterns; existing statistics.ts provides all needed primitives (mean, stddev, linearRegression, normalQuantile) |
| INFRA-02 | Shared PlotFigure.astro wrapper component extracted from existing *Plots.astro pattern to reduce duplication | All 9 Plots components share identical 11-line figure/figcaption HTML block; extraction pattern documented below |
| INFRA-03 | Canonical case study section template defined and documented for consistent structure across all 9 case studies | Existing case studies analyzed; canonical structure derived from Normal Random Numbers (most complete) with variations for special cases |
| INFRA-04 | Cross-reference URL cheat sheet created mapping technique/quantitative slugs to prevent broken links | All 31 technique slugs, 18 quantitative slugs, 9 case study slugs, and distribution slugs enumerated from data files |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | (project version) | Statistics library implementation | Already used throughout; pure functions, no dependencies |
| Astro | (project version) | Component extraction (PlotFigure.astro) | Build-time SSG framework already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| katex | (project version) | Math formula rendering in case study MDX | Already imported in quantitative pages |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled stats | jstat / simple-statistics npm | Project explicitly avoids runtime dependencies for EDA; pure math functions are the established pattern |
| Markdown template doc | Astro component template | Template is for human writers, not for rendering; a markdown reference document is appropriate |

**Installation:**
```bash
# No new packages needed -- all work uses existing project dependencies
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/eda/math/
│   └── statistics.ts          # INFRA-01: Add 7 hypothesis test functions here
├── components/eda/
│   ├── PlotFigure.astro       # INFRA-02: New shared wrapper component
│   ├── NormalRandomPlots.astro # INFRA-02: Refactor to use PlotFigure
│   ├── CryothermometryPlots.astro  # (and all other *Plots.astro files)
│   └── ...
└── data/eda/
    └── pages/case-studies/    # Existing MDX files follow canonical template

.planning/
└── phases/56-infrastructure-foundation/
    ├── case-study-template.md     # INFRA-03: Canonical section template
    └── url-cross-reference.md     # INFRA-04: URL cheat sheet
```

### Pattern 1: Pure Statistical Test Functions
**What:** Each hypothesis test is a pure function that takes data arrays and returns a result object with test statistic, critical value, degrees of freedom, and pass/fail.
**When to use:** All INFRA-01 test implementations.
**Example:**
```typescript
// Follows existing pattern from statistics.ts
interface HypothesisTestResult {
  statistic: number;
  criticalValue: number;
  degreesOfFreedom?: number | [number, number];
  reject: boolean;
}

export function runsTest(data: number[]): HypothesisTestResult {
  // Pure function, no side effects, returns structured result
  const median = sortedMedian(data);
  // ... compute runs, expected runs, Z statistic
  return { statistic: z, criticalValue: 1.96, reject: Math.abs(z) > 1.96 };
}
```

### Pattern 2: Astro Component Extraction (PlotFigure)
**What:** Extract the shared figure/figcaption HTML into a reusable PlotFigure.astro component.
**When to use:** INFRA-02 -- replacing the identical 11-line block in all 9 *Plots.astro files.
**Example:**
```astro
---
// PlotFigure.astro
interface Props {
  svg: string;
  caption?: string;
  maxWidth?: string;
}
const { svg, caption, maxWidth = '720px' } = Astro.props;
---
<figure class="my-8 not-prose">
  <div class="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-white dark:bg-[#1a1a2e] p-3">
    <div class="mx-auto" style={`max-width: ${maxWidth}`} set:html={svg} />
  </div>
  {caption && (
    <figcaption class="mt-2 text-center text-sm text-[var(--color-text-secondary)] italic">
      {caption}
    </figcaption>
  )}
</figure>
```

### Pattern 3: Documentation as Planning Artifacts
**What:** INFRA-03 and INFRA-04 produce reference documents used by human implementers in phases 57-62, not rendered code.
**When to use:** Canonical template and URL cheat sheet.

### Anti-Patterns to Avoid
- **Coupling test functions to datasets:** Each test function must accept generic `number[]` arrays, never import specific datasets. The case study MDX pages call the functions with their dataset arrays.
- **Hardcoding critical values in test functions:** Critical values should be computed from the appropriate distribution (chi-square, F, t, normal) or looked up from well-known tables embedded as constants. The existing `normalQuantile` function can provide z-critical values; for chi-square, F, and t distributions, use rational approximations or table lookups.
- **Breaking existing figure HTML:** The PlotFigure extraction must produce pixel-identical HTML output. Verify by diffing the rendered output before and after extraction.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chi-square quantile function | Full CDF implementation | Wilson-Hilferty approximation (chi2 -> normal) | Well-known 3-term approximation is accurate to 4+ decimals for df >= 3 |
| t-distribution quantile | Full t CDF | Hill's Algorithm 396 or Abramowitz & Stegun approximation | Existing `normalQuantile` handles the normal case; t-distribution needs a short rational approximation |
| F-distribution quantile | Full F CDF | Compute from beta incomplete function or use chi2/df ratio approximation | Only needed for Levene test critical values |
| PPCC critical values | Full PPCC table computation | Hardcode Filliben (1975) critical value table for common sample sizes | NIST uses tabulated values; interpolation between table entries is sufficient |
| Grubbs critical values | Full derivation from t-distribution | Formula: G_crit = ((N-1)/sqrt(N)) * sqrt(t^2 / (N-2+t^2)) where t = t_{alpha/(2N), N-2} | Direct formula from NIST Section 1.3.5.17.1 |

**Key insight:** The statistical test functions are well-specified by NIST formulas. The challenge is not algorithmic complexity but precision -- getting the exact same values that NIST publishes. Use the NIST formulas directly and validate against known NIST dataset results.

## Common Pitfalls

### Pitfall 1: Anderson-Darling Log(0) Singularity
**What goes wrong:** The Anderson-Darling formula computes `ln(F(Y_i))` and `ln(1 - F(Y_{N+1-i}))`. If any CDF value equals exactly 0 or 1, the log is undefined.
**Why it happens:** With sorted data, the smallest observation can produce F(Y_1) very close to 0, and the largest can produce F(Y_N) very close to 1. Floating point arithmetic can round these to exactly 0.0 or 1.0.
**How to avoid:** Clamp CDF values to [epsilon, 1-epsilon] where epsilon is a small constant like 1e-10. This is standard practice in AD test implementations.
**Warning signs:** NaN or -Infinity in the A^2 statistic.

### Pitfall 2: Runs Test Median Handling for Even-Length Data
**What goes wrong:** The runs test counts values above and below the median. When n is even, values exactly equal to the median create ambiguity.
**Why it happens:** The NIST definition splits observations into those above and below the median. With even n, the median is the average of two middle values, but some observations may equal the median.
**How to avoid:** Follow the NIST convention: classify observations as above or below the median. Observations equal to the median are typically excluded from the runs count, or assigned to the "below" group. The key is n1 + n2 must equal n (or n minus ties).
**Warning signs:** n1 + n2 != n after classification.

### Pitfall 3: Bartlett Test Sensitivity to Non-Normality
**What goes wrong:** Bartlett's test is very sensitive to departures from normality. The case studies show that NIST uses Bartlett for normal data (e.g., Normal Random Numbers, Heat Flow Meter) but switches to Levene for non-normal or discrete data (e.g., Cryothermometry, Filter Transmittance).
**Why it happens:** Bartlett assumes underlying normality; Levene does not.
**How to avoid:** Implement BOTH Bartlett and Levene tests. The case study MDX chooses which to display based on the dataset characteristics. The statistics library should provide both.
**Warning signs:** Bartlett rejecting variance homogeneity when the issue is non-normality, not heteroscedasticity.

### Pitfall 4: PlotFigure Extraction Breaking Existing Styles
**What goes wrong:** Extracting the figure HTML into a component can subtly change CSS specificity or class ordering.
**Why it happens:** Moving HTML into a child component changes the DOM nesting, which can affect CSS selectors that depend on parent-child relationships.
**How to avoid:** The figure HTML block is self-contained (uses CSS custom properties via `var(--color-*)` and utility classes) with no parent-dependent selectors. The extraction should be safe, but verify by visual comparison of at least one rendered page before and after.
**Warning signs:** Borders, padding, or background colors looking different after extraction.

### Pitfall 5: PPCC Critical Values vs. Anderson-Darling Critical Values
**What goes wrong:** Confusing the critical value conventions. The NIST Normal Random Numbers case study shows PPCC critical value of 0.997 for n=500, but the Anderson-Darling critical value is 0.787 (for normality testing at alpha=0.05). These are completely different statistics with different scales.
**Why it happens:** Both test normality but use different metrics.
**How to avoid:** Keep PPCC and Anderson-Darling as separate functions with clearly named return values. Never mix their critical values.
**Warning signs:** Incorrect reject/fail-to-reject conclusions that don't match NIST.

### Pitfall 6: Location Regression T-Test vs. Standard Linear Regression
**What goes wrong:** The existing `linearRegression` function returns slope, intercept, and R^2, but NOT the t-statistic or standard errors needed for the location test.
**Why it happens:** The location test requires the full regression output including residual standard error, coefficient standard errors, and the t-statistic for the slope.
**How to avoid:** Implement a separate `locationTest` function that extends the existing `linearRegression` with the additional statistics, OR create a new function that computes the full regression table. The t-statistic for the slope is: t = slope / SE(slope), where SE(slope) = s_residual / sqrt(SS_xx).
**Warning signs:** Missing standard error values or incorrect degrees of freedom.

## Code Examples

Verified patterns from NIST formulas:

### Runs Test Implementation
```typescript
// Source: NIST Section 1.3.5.13
// https://www.itl.nist.gov/div898/handbook/eda/section3/eda35d.htm
export function runsTest(data: number[]): {
  statistic: number;
  criticalValue: number;
  reject: boolean;
  nRuns: number;
  expectedRuns: number;
} {
  const n = data.length;
  if (n < 10) return { statistic: 0, criticalValue: 1.96, reject: false, nRuns: 0, expectedRuns: 0 };

  const sorted = [...data].sort((a, b) => a - b);
  const med = n % 2 === 0
    ? (sorted[n/2 - 1] + sorted[n/2]) / 2
    : sorted[Math.floor(n/2)];

  // Count observations above and below median
  let n1 = 0, n2 = 0;
  const signs: boolean[] = [];
  for (const v of data) {
    if (v > med) { n1++; signs.push(true); }
    else if (v < med) { n2++; signs.push(false); }
    // Values equal to median: assign to below group
    else { n2++; signs.push(false); }
  }

  // Count runs
  let R = 1;
  for (let i = 1; i < signs.length; i++) {
    if (signs[i] !== signs[i - 1]) R++;
  }

  // Expected runs and standard deviation
  const Rbar = (2 * n1 * n2) / (n1 + n2) + 1;
  const sR = Math.sqrt(
    (2 * n1 * n2 * (2 * n1 * n2 - n1 - n2)) /
    ((n1 + n2) ** 2 * (n1 + n2 - 1))
  );

  const Z = (R - Rbar) / sR;
  return {
    statistic: Z,
    criticalValue: 1.96,
    reject: Math.abs(Z) > 1.96,
    nRuns: R,
    expectedRuns: Rbar,
  };
}
```

### Anderson-Darling Test Implementation
```typescript
// Source: NIST Section 1.3.5.14
// https://www.itl.nist.gov/div898/handbook/eda/section3/eda35e.htm
export function andersonDarlingNormal(data: number[]): {
  statistic: number;
  criticalValue: number;
  reject: boolean;
} {
  const n = data.length;
  const m = mean(data);
  const s = standardDeviation(data);

  // Sort data
  const sorted = [...data].sort((a, b) => a - b);

  // Compute CDF values using standard normal
  const eps = 1e-10;
  const F: number[] = sorted.map(y => {
    const z = (y - m) / s;
    const p = normalCDF(z); // need normalCDF from normalQuantile inverse
    return Math.max(eps, Math.min(1 - eps, p));
  });

  // Compute A^2 = -N - S
  let S = 0;
  for (let i = 0; i < n; i++) {
    const coeff = (2 * (i + 1) - 1) / n;
    S += coeff * (Math.log(F[i]) + Math.log(1 - F[n - 1 - i]));
  }

  const A2 = -n - S;

  // Critical value for normality at alpha = 0.05
  // Adjusted critical value: 0.752 * (1 + 0.75/n + 2.25/n^2) per Stephens (1974)
  const criticalValue = 0.752 * (1 + 0.75/n + 2.25/(n*n));

  return { statistic: A2, criticalValue, reject: A2 > criticalValue };
}
```

### Bartlett's Test Implementation
```typescript
// Source: NIST Section 1.3.5.7
// https://www.itl.nist.gov/div898/handbook/eda/section3/eda357.htm
export function bartlettTest(data: number[], k: number): {
  statistic: number;
  criticalValue: number;
  degreesOfFreedom: number;
  reject: boolean;
} {
  const n = data.length;
  const groupSize = Math.floor(n / k);

  // Split into k groups
  const groups: number[][] = [];
  for (let i = 0; i < k; i++) {
    groups.push(data.slice(i * groupSize, (i + 1) * groupSize));
  }

  // Compute group variances
  const Ni = groups.map(g => g.length);
  const variances = groups.map(g => {
    const m = mean(g);
    return g.reduce((s, v) => s + (v - m) ** 2, 0) / (g.length - 1);
  });

  // Pooled variance
  const Ntotal = Ni.reduce((s, v) => s + v, 0);
  const pooledVar = Ni.reduce((s, ni, i) => s + (ni - 1) * variances[i], 0) / (Ntotal - k);

  // Numerator: (N-k)*ln(sp^2) - sum((Ni-1)*ln(si^2))
  const numerator = (Ntotal - k) * Math.log(pooledVar)
    - Ni.reduce((s, ni, i) => s + (ni - 1) * Math.log(variances[i]), 0);

  // Denominator correction factor
  const correction = 1 + (1 / (3 * (k - 1))) * (
    Ni.reduce((s, ni) => s + 1 / (ni - 1), 0) - 1 / (Ntotal - k)
  );

  const T = numerator / correction;
  const df = k - 1;
  // chi-square critical value at alpha=0.05 with df degrees of freedom
  const criticalValue = chiSquareQuantile(0.95, df);

  return { statistic: T, criticalValue, degreesOfFreedom: df, reject: T > criticalValue };
}
```

### Levene Test Implementation
```typescript
// Source: NIST Section 1.3.5.10
// https://www.itl.nist.gov/div898/handbook/eda/section3/eda35a.htm
export function leveneTest(data: number[], k: number): {
  statistic: number;
  criticalValue: number;
  degreesOfFreedom: [number, number];
  reject: boolean;
} {
  const n = data.length;
  const groupSize = Math.floor(n / k);

  // Split into k groups
  const groups: number[][] = [];
  for (let i = 0; i < k; i++) {
    groups.push(data.slice(i * groupSize, (i + 1) * groupSize));
  }

  // Use median-based variant (Brown-Forsythe)
  const medians = groups.map(g => {
    const sorted = [...g].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid-1] + sorted[mid]) / 2 : sorted[mid];
  });

  // Z_ij = |Y_ij - median_i|
  const Z: number[][] = groups.map((g, i) => g.map(v => Math.abs(v - medians[i])));

  // Group means of Z
  const Zbar_i = Z.map(g => mean(g));
  const allZ = Z.flat();
  const Zbar = mean(allZ);

  // Levene statistic
  const Ni = groups.map(g => g.length);
  const ssb = Ni.reduce((s, ni, i) => s + ni * (Zbar_i[i] - Zbar) ** 2, 0);
  const ssw = Z.reduce((s, g, i) =>
    s + g.reduce((s2, z) => s2 + (z - Zbar_i[i]) ** 2, 0), 0);

  const W = ((n - k) / (k - 1)) * (ssb / ssw);
  const df1 = k - 1;
  const df2 = n - k;
  // F critical value at alpha=0.05
  const criticalValue = fQuantile(0.95, df1, df2);

  return { statistic: W, criticalValue, degreesOfFreedom: [df1, df2], reject: W > criticalValue };
}
```

### Grubbs Test Implementation
```typescript
// Source: NIST Section 1.3.5.17.1
// https://www.itl.nist.gov/div898/handbook/eda/section3/eda35h1.htm
export function grubbsTest(data: number[]): {
  statistic: number;
  criticalValue: number;
  reject: boolean;
} {
  const n = data.length;
  const m = mean(data);
  const s = standardDeviation(data);

  // G = max|Y_i - Ybar| / s
  const G = Math.max(...data.map(v => Math.abs(v - m))) / s;

  // Critical value: ((N-1)/sqrt(N)) * sqrt(t^2 / (N-2+t^2))
  // where t = t_{alpha/(2N), N-2}
  const alpha = 0.05;
  const tCrit = tQuantile(1 - alpha / (2 * n), n - 2);
  const criticalValue = ((n - 1) / Math.sqrt(n)) * Math.sqrt(tCrit ** 2 / (n - 2 + tCrit ** 2));

  return { statistic: G, criticalValue, reject: G > criticalValue };
}
```

### Location Regression T-Test
```typescript
// Source: NIST case study quantitative sections
// Extension of existing linearRegression function
export function locationTest(data: number[]): {
  slope: number;
  intercept: number;
  slopeStdError: number;
  interceptStdError: number;
  tStatistic: number;
  criticalValue: number;
  residualStdDev: number;
  degreesOfFreedom: number;
  reject: boolean;
} {
  const n = data.length;
  const x = data.map((_, i) => i + 1); // run order 1..N
  const reg = linearRegression(x, data);

  // Residual standard deviation
  const residuals = data.map((y, i) => y - (reg.intercept + reg.slope * (i + 1)));
  const ssRes = residuals.reduce((s, r) => s + r * r, 0);
  const df = n - 2;
  const sResidual = Math.sqrt(ssRes / df);

  // SS_xx
  const mx = mean(x);
  const ssxx = x.reduce((s, xi) => s + (xi - mx) ** 2, 0);

  // Standard errors
  const seSlope = sResidual / Math.sqrt(ssxx);
  const seIntercept = sResidual * Math.sqrt(x.reduce((s, xi) => s + xi * xi, 0) / (n * ssxx));

  const tStat = reg.slope / seSlope;
  const tCrit = 1.96; // approximate for large n; use tQuantile(0.975, df) for exact

  return {
    slope: reg.slope,
    intercept: reg.intercept,
    slopeStdError: seSlope,
    interceptStdError: seIntercept,
    tStatistic: tStat,
    criticalValue: tCrit,
    residualStdDev: sResidual,
    degreesOfFreedom: df,
    reject: Math.abs(tStat) > tCrit,
  };
}
```

### PPCC (Probability Plot Correlation Coefficient)
```typescript
// Source: Filliben (1975), NIST Section 1.3.3.23
export function ppccNormal(data: number[]): {
  statistic: number;
  criticalValue: number;
  reject: boolean;
} {
  const n = data.length;
  const sorted = [...data].sort((a, b) => a - b);

  // Compute normal order statistics (Filliben's plotting positions)
  // m_i = normalQuantile((i - 0.3175) / (n + 0.365))
  const m: number[] = sorted.map((_, i) =>
    normalQuantile((i + 1 - 0.3175) / (n + 0.365))
  );

  // PPCC = correlation(sorted data, normal order statistics)
  const r = pearsonCorrelation(sorted, m);

  // Critical values from Filliben (1975) table -- approximate formula
  // For alpha=0.05, approximate: r_crit ~ 1 - exp(a + b*ln(n))
  // Tabulated values for common n:
  // n=50: 0.978, n=100: 0.987, n=200: 0.992, n=500: 0.997, n=700: 0.987 (adjusted)
  const criticalValue = ppccCriticalValue(n); // lookup table

  return { statistic: r, criticalValue, reject: r < criticalValue };
}
```

### PlotFigure.astro Component
```astro
---
// PlotFigure.astro -- shared figure wrapper for all EDA plot components
interface Props {
  svg: string;
  caption?: string;
  maxWidth?: string;
}
const { svg, caption, maxWidth = '720px' } = Astro.props;
---
<figure class="my-8 not-prose">
  <div class="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-white dark:bg-[#1a1a2e] p-3">
    <div class="mx-auto" style={`max-width: ${maxWidth}`} set:html={svg} />
  </div>
  {caption && (
    <figcaption class="mt-2 text-center text-sm text-[var(--color-text-secondary)] italic">
      {caption}
    </figcaption>
  )}
</figure>
```

### Refactored Plots Component (using PlotFigure)
```astro
---
// Example: NormalRandomPlots.astro after refactoring
import PlotFigure from './PlotFigure.astro';
// ... existing imports and switch statement unchanged ...
const figCaption = caption ?? defaultCaptions[type];
---
<PlotFigure svg={svg} caption={figCaption} />
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Inline figure HTML in each Plots component | Shared PlotFigure.astro wrapper | Phase 56 (new) | Reduces 11 lines x 9 components = 99 lines of duplication |
| No hypothesis test functions | Full test suite in statistics.ts | Phase 56 (new) | Enables computed quantitative tables in all case studies |
| Ad-hoc case study structure | Canonical section template | Phase 56 (new) | Ensures consistent heading hierarchy across 9 case studies |
| Manual link construction | URL cross-reference cheat sheet | Phase 56 (new) | Prevents broken links in cross-references between case studies and techniques |

**Deprecated/outdated:**
- None -- this phase creates new infrastructure, does not replace deprecated approaches.

## INFRA-01: Hypothesis Test Functions -- Detailed Reference

### Functions to Implement

| Function | Signature | Returns | NIST Section |
|----------|-----------|---------|--------------|
| `runsTest` | `(data: number[]) => RunsTestResult` | Z statistic, critical value, reject boolean, nRuns, expectedRuns | 1.3.5.13 |
| `leveneTest` | `(data: number[], k: number) => LeveneResult` | W statistic, critical value, df [k-1, N-k], reject boolean | 1.3.5.10 |
| `bartlettTest` | `(data: number[], k: number) => BartlettResult` | T statistic, critical value, df k-1, reject boolean | 1.3.5.7 |
| `andersonDarlingNormal` | `(data: number[]) => ADResult` | A^2 statistic, critical value, reject boolean | 1.3.5.14 |
| `grubbsTest` | `(data: number[]) => GrubbsResult` | G statistic, critical value, reject boolean | 1.3.5.17.1 |
| `ppccNormal` | `(data: number[]) => PPCCResult` | r statistic, critical value, reject boolean | 1.3.3.23 |
| `locationTest` | `(data: number[]) => LocationResult` | slope, intercept, SEs, t-statistic, critical value, residual SD, reject boolean | Case studies |

### Helper Functions Needed

| Function | Purpose | Used By |
|----------|---------|---------|
| `normalCDF(z)` | Standard normal CDF | Anderson-Darling, PPCC |
| `chiSquareQuantile(p, df)` | Chi-square inverse CDF | Bartlett test critical value |
| `tQuantile(p, df)` | Student's t inverse CDF | Grubbs test, location test critical values |
| `fQuantile(p, df1, df2)` | F-distribution inverse CDF | Levene test critical value |
| `pearsonCorrelation(x, y)` | Pearson r | PPCC computation |
| `sortedMedian(data)` | Median of sorted array | Runs test, Levene test |

### Validation Values from NIST Case Studies

These are the known-correct values from the existing case study pages that the implementations MUST reproduce:

| Dataset | Test | Expected Value | Source |
|---------|------|---------------|--------|
| Normal Random (n=500) | Runs test Z | -1.0744 | normal-random-numbers.mdx |
| Normal Random (n=500) | Bartlett T | 2.3737 | normal-random-numbers.mdx |
| Normal Random (n=500) | Anderson-Darling A^2 | 1.0612 | normal-random-numbers.mdx |
| Normal Random (n=500) | Grubbs G | 3.3681 | normal-random-numbers.mdx |
| Normal Random (n=500) | PPCC | 0.996 | normal-random-numbers.mdx |
| Normal Random (n=500) | Location t | -0.1251 | normal-random-numbers.mdx |
| Cryothermometry (n=700) | Runs test Z | -13.4162 | cryothermometry.mdx |
| Cryothermometry (n=700) | Levene W | 1.43 | cryothermometry.mdx |
| Cryothermometry (n=700) | Anderson-Darling A^2 | 16.858 | cryothermometry.mdx |
| Cryothermometry (n=700) | Grubbs G | 2.729 | cryothermometry.mdx |
| Cryothermometry (n=700) | PPCC | 0.975 | cryothermometry.mdx |
| Cryothermometry (n=700) | Location t | 4.445 | cryothermometry.mdx |
| Heat Flow Meter (n=195) | Runs test Z | -3.2306 | heat-flow-meter.mdx |
| Heat Flow Meter (n=195) | Bartlett T | 3.147 | heat-flow-meter.mdx |
| Heat Flow Meter (n=195) | Anderson-Darling A^2 | 0.129 | heat-flow-meter.mdx |
| Heat Flow Meter (n=195) | Grubbs G | 2.918673 | heat-flow-meter.mdx |
| Heat Flow Meter (n=195) | PPCC | 0.996 | heat-flow-meter.mdx |
| Heat Flow Meter (n=195) | Location t | -1.960 | heat-flow-meter.mdx |
| Filter Transmittance (n=50) | Runs test Z | -5.3246 | filter-transmittance.mdx |
| Filter Transmittance (n=50) | Levene W | 0.971 | filter-transmittance.mdx |
| Filter Transmittance (n=50) | Location t | 5.582 | filter-transmittance.mdx |

## INFRA-02: PlotFigure Extraction -- Exact Pattern

### Current Duplicated Block (identical in all 9 *Plots.astro files)
```astro
<figure class="my-8 not-prose">
  <div class="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-white dark:bg-[#1a1a2e] p-3">
    <div class="mx-auto" style={`max-width: ${type === '4-plot' ? '720px' : '720px'}`} set:html={svg} />
  </div>
  {figCaption && (
    <figcaption class="mt-2 text-center text-sm text-[var(--color-text-secondary)] italic">
      {figCaption}
    </figcaption>
  )}
</figure>
```

Note: The ternary `type === '4-plot' ? '720px' : '720px'` always evaluates to `'720px'` -- this is a no-op that can be simplified to a constant.

### Files to Refactor
All 9 *Plots.astro files:
1. `NormalRandomPlots.astro`
2. `CryothermometryPlots.astro`
3. `FilterTransmittancePlots.astro`
4. `HeatFlowMeterPlots.astro`
5. `FatigueLifePlots.astro`
6. `CeramicStrengthPlots.astro`
7. `UniformRandomPlots.astro`
8. `BeamDeflectionPlots.astro`
9. `RandomWalkPlots.astro`

### Refactoring Strategy
1. Create `PlotFigure.astro` with the shared HTML
2. Update ONE component (e.g., NormalRandomPlots) as proof of concept
3. Run `npx astro build` to verify no regressions
4. Update remaining 8 components

## INFRA-03: Canonical Case Study Section Template

### Derived from Existing Case Studies

Analyzing the 8 existing case study MDX files reveals this consistent structure (Normal Random Numbers being the most complete example):

```markdown
# Canonical Case Study Template

## Background and Data
- Dataset description, NIST source section reference
- Motivation and purpose of the analysis
- Sample size, response variable description
- <CaseStudyDataset slug="..." />

## Test Underlying Assumptions
### Goals
1. Model validation (Y_i = C + E_i)
2. Assumption testing (4 assumptions)
3. Confidence interval validity

## Graphical Output and Interpretation
### 4-Plot Overview
### Run Sequence Plot
### Lag Plot
### Histogram
### Normal Probability Plot
### Autocorrelation Plot
### Spectral Plot

## Quantitative Output and Interpretation
### Summary Statistics
### Location Test
### Variation Test
### Randomness Tests
### Distribution Test
### Outlier Detection
### Test Summary

## Conclusions
```

**Variations by case study type:**
- **Standard univariate** (Normal Random, Cryothermometry, Heat Flow, Filter): Full template as above
- **Distribution focus** (Uniform Random, Fatigue Life): Add Distribution Comparison section
- **Model development** (Beam Deflections): Add "Develop Better Model" and "Validate New Model" sections
- **DOE** (Ceramic Strength): Replace standard sections with Response Variable Analysis, Batch Effect, Lab Effect, Primary Factors, Interpretation

## INFRA-04: URL Cross-Reference Cheat Sheet

### URL Pattern Summary
| Route Pattern | Example | Source Data |
|--------------|---------|-------------|
| `/eda/techniques/{slug}/` | `/eda/techniques/histogram/` | techniques.json (graphical category) |
| `/eda/quantitative/{slug}/` | `/eda/quantitative/bartletts-test/` | techniques.json (quantitative category) |
| `/eda/distributions/{slug}/` | `/eda/distributions/normal/` | distributions.json |
| `/eda/case-studies/{slug}/` | `/eda/case-studies/normal-random-numbers/` | case-studies/*.mdx |
| `/eda/foundations/{slug}/` | `/eda/foundations/what-is-eda/` | foundations/*.mdx |
| `/eda/reference/{slug}/` | `/eda/reference/distribution-tables/` | reference/*.mdx |

### Complete Technique Slugs (Graphical)
From techniques.json, category="graphical" (28 techniques):
`autocorrelation-plot`, `bihistogram`, `block-plot`, `bootstrap-plot`, `box-cox-linearity`, `box-cox-normality`, `box-plot`, `complex-demodulation`, `contour-plot`, `doe-plots`, `histogram`, `lag-plot`, `linear-plots`, `mean-plot`, `normal-probability-plot`, `probability-plot`, `ppcc-plot`, `qq-plot`, `run-sequence-plot`, `scatter-plot`, `spectral-plot`, `std-deviation-plot`, `star-plot`, `weibull-plot`, `youden-plot`, `4-plot`, `6-plot`, `scatterplot-matrix`, `conditioning-plot`

### Complete Technique Slugs (Quantitative)
From techniques.json, category="quantitative" (18 techniques):
`measures-of-location`, `confidence-limits`, `two-sample-t-test`, `one-factor-anova`, `multi-factor-anova`, `measures-of-scale`, `bartletts-test`, `chi-square-sd-test`, `f-test`, `levene-test`, `skewness-kurtosis`, `autocorrelation`, `runs-test`, `anderson-darling`, `chi-square-gof`, `kolmogorov-smirnov`, `grubbs-test`, `yates-analysis`

### Case Study Slugs
`normal-random-numbers`, `uniform-random-numbers`, `random-walk`, `cryothermometry`, `beam-deflections`, `filter-transmittance`, `heat-flow-meter`, `fatigue-life`, `ceramic-strength`

### Most Commonly Cross-Referenced URLs in Case Studies
Based on analysis of existing MDX files, these links appear most frequently:
- `/eda/techniques/4-plot/` -- referenced in every case study
- `/eda/techniques/run-sequence-plot/` -- referenced in every case study
- `/eda/techniques/lag-plot/` -- referenced in every case study
- `/eda/techniques/histogram/` -- referenced in every case study
- `/eda/techniques/normal-probability-plot/` -- referenced in every case study
- `/eda/techniques/autocorrelation-plot/` -- referenced in every case study
- `/eda/techniques/spectral-plot/` -- referenced in every case study
- `/eda/quantitative/bartletts-test/` -- variation test (normal data)
- `/eda/quantitative/levene-test/` -- variation test (non-normal data)
- `/eda/quantitative/runs-test/` -- randomness test
- `/eda/quantitative/autocorrelation/` -- randomness test
- `/eda/quantitative/anderson-darling/` -- distribution test
- `/eda/quantitative/grubbs-test/` -- outlier detection
- `/eda/case-studies/random-walk/` -- comparison reference
- `/eda/case-studies/normal-random-numbers/` -- baseline reference
- `/eda/case-studies/beam-deflections/` -- periodic structure reference

## Open Questions

1. **Anderson-Darling Critical Value Formula**
   - What we know: NIST uses 0.787 as critical value in case studies; Stephens (1974) provides the adjustment formula. The GeeksforGeeks and Stephens sources give the adjusted formula as `A2* = A2 * (1 + 0.75/n + 2.25/n^2)` compared against distribution-specific critical values.
   - What's unclear: The exact critical value convention varies between sources. The existing case studies use 0.787 consistently, which corresponds to the adjusted statistic approach.
   - Recommendation: Use the NIST convention (compare raw A^2 against 0.787 for normality at alpha=0.05). Validate against all four datasets.

2. **PPCC Critical Value Table**
   - What we know: The case studies use specific critical values (0.997 for n=500, 0.987 for n=195/700). Filliben (1975) tabulates these.
   - What's unclear: Whether there is a closed-form approximation or whether a lookup table is needed.
   - Recommendation: Hardcode a lookup table for the sample sizes used in the case studies (50, 101, 195, 200, 480, 500, 700, 1000). For other sizes, use linear interpolation. This avoids implementing the full Filliben computation.

3. **Chi-square, t, and F Quantile Functions**
   - What we know: These are needed as helper functions for Bartlett, Grubbs, Levene, and location test critical values.
   - What's unclear: Whether to implement full inverse CDF functions or use approximations.
   - Recommendation: Use well-known approximations: Wilson-Hilferty for chi-square, Hill's algorithm for t, and the relationship F = chi2_1/df1 / (chi2_2/df2) or a direct approximation. These only need to be accurate to 3-4 decimal places to match NIST values.

## Sources

### Primary (HIGH confidence)
- [NIST 1.3.5.13 Runs Test](https://www.itl.nist.gov/div898/handbook/eda/section3/eda35d.htm) - Complete formula for Z statistic, expected runs, variance
- [NIST 1.3.5.14 Anderson-Darling](https://www.itl.nist.gov/div898/handbook/eda/section3/eda35e.htm) - A^2 formula and computation steps
- [NIST 1.3.5.7 Bartlett's Test](https://www.itl.nist.gov/div898/handbook/eda/section3/eda357.htm) - T statistic formula with correction factor
- [NIST 1.3.5.10 Levene Test](https://www.itl.nist.gov/div898/handbook/eda/section3/eda35a.htm) - W statistic formula with median-based variant
- [NIST 1.3.5.17.1 Grubbs' Test](https://www.itl.nist.gov/div898/handbook/eda/section3/eda35h1.htm) - G statistic and critical value formula
- Existing codebase: `src/lib/eda/math/statistics.ts` - Current function signatures and patterns
- Existing codebase: `src/components/eda/*Plots.astro` - Figure HTML pattern to extract
- Existing codebase: `src/data/eda/techniques.json` - All technique slugs
- Existing codebase: `src/data/eda/pages/case-studies/*.mdx` - Existing case study structures
- Existing codebase: `src/lib/eda/routes.ts` - URL pattern definitions

### Secondary (MEDIUM confidence)
- NIST case study MDX pages with hardcoded test results - Validation values for test implementations
- Filliben (1975) via NIST references - PPCC critical value methodology

### Tertiary (LOW confidence)
- Anderson-Darling critical value adjustment formula (`0.752 * (1 + 0.75/n + 2.25/n^2)`) - Multiple web sources cite this but exact Stephens (1974) paper not directly verified. Validate against NIST case study values.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, extends existing pure TypeScript pattern
- Architecture: HIGH - Patterns derived directly from existing codebase analysis
- Pitfalls: HIGH - Identified from real formula edge cases and existing code patterns
- INFRA-01 formulas: HIGH - Sourced from official NIST pages
- INFRA-02 extraction: HIGH - Exact duplicated HTML block identified across all 9 files
- INFRA-03 template: HIGH - Derived from analysis of 8 existing case study MDX files
- INFRA-04 cheat sheet: HIGH - Enumerated from actual data files in the codebase
- Statistical helper functions (chi2, t, F quantiles): MEDIUM - Approximation formulas need validation against NIST values

**Research date:** 2026-02-26
**Valid until:** 2026-03-28 (stable domain -- statistical formulas don't change)
