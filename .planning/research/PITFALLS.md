# Pitfalls Research: EDA Case Study Deep Dive (v1.9)

**Domain:** Enhancing 8 existing EDA case studies to NIST-source depth and adding 1 new case study (Standard Resistor) to an existing Astro 5 static site with 90+ EDA pages
**Researched:** 2026-02-26
**Confidence:** HIGH (based on direct codebase analysis of existing Random Walk reference implementation, datasets.ts at 93KB, 9 existing *Plots.astro components, build-time SVG generation architecture, quick task 011 audit findings, and NIST source structure)

**Context:** This is a SUBSEQUENT milestone pitfalls document for v1.9. The v1.8 EDA Visual Encyclopedia is complete with 90+ pages, 13 SVG generators, KaTeX rendering via InlineMath component, and build-time SVG generation in TypeScript (not Python -- the original v1.8 pitfalls document assumed Python but the actual implementation uses pure TypeScript). The Random Walk case study (339 lines, 16 plot types) is the reference implementation. The remaining 8 case studies range from 121 to 266 lines and need expansion to ~300-400 lines each, plus a brand-new Standard Resistor case study.

**Key differences from v1.8 pitfalls context:**
- SVG generation is TypeScript at build time, not Python -- eliminates the Python CI pitfall entirely
- KaTeX integration is proven via InlineMath component (`katex.renderToString` with `throwOnError: false`)
- D3 is only used for distribution parameter explorers, not case studies -- case studies are 100% build-time SVG
- The build already handles 950+ pages including OG image caching
- Quick task 011 already found and fixed 5 broken cross-reference links in case study MDX files
- datasets.ts is already 93KB with 10 dataset arrays -- adding the Standard Resistor dataset (1000 values) will push it past 100KB

---

## Critical Pitfalls

### Pitfall 1: Statistical Value Transcription Errors in Quantitative Test Tables

**What goes wrong:**
Each case study contains 5-8 quantitative test result tables with specific numeric values (test statistics, critical values, regression coefficients, standard errors, t-values). These values must match the NIST source exactly. A single wrong digit in a critical value changes whether a hypothesis test "rejects" or "fails to reject" -- silently producing an incorrect statistical conclusion on a page that claims to be a reference. The Random Walk case study has 6 test tables with ~30 individual numeric values. Scaling this to 9 case studies means ~270 individual numeric values that must all be correct.

**Why it happens:**
LLM-generated content produces plausible but subtly wrong statistical values with high confidence. Rounding differences between NIST's DATAPLOT and the TypeScript `statistics.ts` implementations create small discrepancies. Copy-paste errors when transcribing from NIST HTML tables to MDX tables are common. The NIST source sometimes presents values in scientific notation (e.g., `1.071E-03`) while MDX tables use decimal notation, creating transcription errors. Quick task 011 verified that the existing 9 case study summary statistics tables match NIST values, but the expansion adds ~200+ new values that do not yet exist in the codebase.

**How to avoid:**
1. **Compute test statistics programmatically in the *Plots.astro component** where feasible, rather than hardcoding values in MDX. The RandomWalkPlots.astro already computes AR(1) regression via `linearRegression()`. Extend this pattern: compute the location test regression, Levene test statistic, runs test Z-score, and autocorrelation values in the Plots component and expose them to the MDX page.
2. **Cross-reference every hardcoded value against the NIST source page** character-by-character. Create a verification checklist per case study: (a) summary statistics table, (b) location test table, (c) variation test table, (d) randomness test tables, (e) distribution test table, (f) outlier test table, (g) model fit table (if applicable).
3. **Use the existing `statistics.ts` functions** (mean, standardDeviation, linearRegression, autocorrelation) to compute values at build time rather than manually computing and hardcoding. The autocorrelation r1 for Random Walk (0.987) is already computed this way.
4. **For critical values** (t-distribution, F-distribution, chi-squared, normal Z), these are fixed mathematical constants. Maintain a small lookup table or compute them. Do not rely on LLM-generated critical values -- they are frequently wrong in the 3rd-4th decimal place.

**Warning signs:**
- A test statistic is less than its critical value but the conclusion says "reject" (or vice versa)
- Summary statistics (mean, std dev) differ from what `statistics.ts` computes on the dataset
- Regression coefficients produce predicted values that do not match the actual data when spot-checked
- Critical values for the same test (e.g., t_0.975,498 = 1.96) differ between case studies when they should be identical

**Phase to address:**
Phase 1 (Infrastructure) -- extend `statistics.ts` with helper functions for Levene test, runs test, and t/F/chi-squared critical value lookups. Then each content phase validates computed vs. hardcoded values.

---

### Pitfall 2: Build Time Regression from 100+ New SVG Renders

**What goes wrong:**
The Random Walk case study generates 16 SVG plots at build time via RandomWalkPlots.astro. Each SVG generation involves computing autocorrelation (O(n*maxLag)), power spectrum via FFT (O(n log n)), probability plots with sorting (O(n log n)), and histogram binning. With 500 data points and maxLag=100, the autocorrelation alone iterates 500*100 = 50,000 times per call. Random Walk currently makes ~4 autocorrelation calls (raw + residual, 2 maxLag values). Scaling to 9 case studies with ~13-16 plots each means 120-144 total SVG renders at build time, each involving non-trivial computation. The current build of 950 pages already takes significant time; adding 100+ SVG computations could add 5-15 seconds.

**Why it happens:**
Each `<CaseStudyPlots type="X" />` invocation in MDX triggers the full Astro component evaluation, including all the computations in the component frontmatter (regression fitting, residual computation, etc.) -- even though only one plot type is rendered per invocation. The RandomWalkPlots component computes AR(1) regression and all 499 residuals every time it renders any plot type, because the computations are in the component's frontmatter scope, not gated by the `type` prop. With 16 invocations per page, the AR(1) computation runs 16 times for a single page.

**How to avoid:**
1. **Move expensive computations to a shared module** that caches results. Create a `src/lib/eda/case-study-computations.ts` that computes model fits and residuals once per dataset and memoizes the results. Import the pre-computed values in the Plots component rather than computing in the component frontmatter.
2. **Monitor build time after each case study is enhanced.** Track with `time npx astro build` and set a budget: build should not regress more than 2 seconds per case study added. If it does, investigate memoization.
3. **The spectral plot computation is the most expensive** -- `powerSpectrum()` computes autocovariance for lag 0 to N/4, then evaluates N/2 frequency bins. For a 1000-point Standard Resistor dataset, that is 250 lags * 1000 iterations + 500 frequency bins * 250 cosine evaluations = 375,000 operations. If this runs 16 times per page, it is 6 million operations for one case study page.
4. **Consider lazy evaluation per plot type** -- restructure the Plots component to only compute what the specific `type` needs, not all computations upfront.

**Warning signs:**
- Build time increases by more than 3 seconds after adding a single case study enhancement
- `astro build` output shows case study pages taking disproportionately longer than technique pages
- Standard Resistor case study (1000 data points vs 500 for most others) takes noticeably longer than other case studies
- CI build approaches the 10-minute GitHub Pages timeout

**Phase to address:**
Phase 1 (Infrastructure) -- implement memoized computation module. Measure baseline build time before any content changes. Set build time budget.

---

### Pitfall 3: Structural Inconsistency Across 9 Case Studies

**What goes wrong:**
The Random Walk case study follows a specific structure: Background and Data > Test Underlying Assumptions (Goals, 4-Plot, individual plot sections) > Quantitative Results (Summary Statistics, Location Test, Variation Test, Randomness Tests, Distribution Tests, Test Summary) > Interpretation > Develop Better Model > Validate New Model > Conclusions. The other 8 existing case studies use slightly different section structures. Normal Random Numbers uses "Graphical Output and Interpretation" and "Quantitative Output and Interpretation" as major sections. Beam Deflections uses the same but with different subsection ordering. Fatigue Life omits the autocorrelation section naming but includes the plot. When expanding all 9 to full depth, inconsistent section headers, missing subsections, and varying depth of interpretation make the collection feel like 9 separate projects rather than a unified reference.

**Why it happens:**
Case studies are written sequentially, with each taking 30-60 minutes. The writer's mental model of the structure drifts over time. Some NIST source sections include "Develop Better Model" while others do not. The Normal Random Numbers case study (all assumptions satisfied) has no model-improvement section, while Random Walk has an extensive one. Ceramic Strength has a batch comparison angle that other studies lack. These genuine structural differences get confused with accidental inconsistencies.

**How to avoid:**
1. **Define a canonical section template** before starting content work. Map each NIST case study to the template and note which sections are "N/A" vs. which need content:

```
## Background and Data
## Test Underlying Assumptions
### Goals
### 4-Plot Overview
### Fixed Location -- Run Sequence Plot
### Randomness -- Lag Plot
### Randomness -- Autocorrelation Plot
### Randomness -- Spectral Plot
### Fixed Distribution -- Histogram
### Normality -- Normal Probability Plot
## Quantitative Results
### Summary Statistics
### Location Test
### Variation Test
### Randomness Tests
### Distribution and Outlier Tests  (or "Distribution Test" + "Outlier Detection")
### Test Summary
## Interpretation
## Develop a Better Model  (only if NIST source includes this)
## Validate New Model  (only if Develop Better Model exists)
## Conclusions
```

2. **Process all 8 existing case studies through the template first** before writing new content. Identify which sections exist, which need expansion, and which need restructuring. This creates a gap analysis that guides content writing.
3. **Handle genuine structural differences explicitly.** Normal Random Numbers does not need "Develop Better Model" because all assumptions pass. Fatigue Life focuses on model selection rather than assumption violation. Document these intentional deviations from the template in a comment at the top of each MDX file.
4. **Write the section headers first for all 9 case studies** as a batch, before filling in content. Review the headers for consistency. This is 30 minutes of work that prevents 3+ hours of later restructuring.

**Warning signs:**
- Two case studies use different heading text for the same logical section (e.g., "Quantitative Output and Interpretation" vs "Quantitative Results")
- A case study is missing the Test Summary table that all others have
- Plot sections are in different order across case studies (e.g., autocorrelation before spectral in one but after in another)
- The Conclusions section has different depth across case studies (2 sentences in one vs. 2 paragraphs in another)

**Phase to address:**
Phase 1 (Template and Gap Analysis) -- create the canonical template and complete the gap analysis for all 9 case studies before any content writing begins.

---

### Pitfall 4: Broken Cross-Reference Links Multiply During Content Expansion

**What goes wrong:**
Quick task 011 found 5 broken cross-reference links in just 3 MDX files. The errors were all slug mismatches: wrong category prefix (e.g., `/eda/quantitative/autocorrelation/` instead of `/eda/techniques/autocorrelation-plot/`) or wrong slug abbreviation (e.g., `chi-square-goodness-of-fit` instead of `chi-square-gof`). Expanding each case study from ~100-250 lines to ~300-400 lines means adding ~100-200 new lines of content per study, including 10-20 new cross-reference links per study (to technique pages, quantitative test pages, distribution pages, and other case studies). That is 90-180 new links across 9 case studies, each susceptible to the same category/slug confusion that caused the original 5 errors.

**Why it happens:**
The EDA encyclopedia has three different URL category prefixes (`/eda/techniques/`, `/eda/quantitative/`, `/eda/distributions/`) and 85+ slugs. The autocorrelation technique is at `/eda/techniques/autocorrelation-plot/` but the autocorrelation quantitative test is at `/eda/quantitative/autocorrelation/`. The PPCC technique is at `/eda/techniques/ppcc-plot/` not `/eda/quantitative/ppcc/`. This technique-vs-quantitative ambiguity is the root cause of most cross-reference errors. When writing case study content, the author naturally writes "the autocorrelation plot" and links to what seems logical, not checking whether it is in the techniques or quantitative category.

**How to avoid:**
1. **Create a cross-reference cheat sheet** for case study authors. List the 20-30 most commonly referenced pages with their exact URLs:
   - `/eda/techniques/4-plot/` (not `/eda/techniques/four-plot/`)
   - `/eda/techniques/run-sequence-plot/`
   - `/eda/techniques/lag-plot/`
   - `/eda/techniques/autocorrelation-plot/` (technique -- the PLOT)
   - `/eda/quantitative/autocorrelation/` (quantitative -- the COEFFICIENT)
   - `/eda/techniques/histogram/`
   - `/eda/techniques/normal-probability-plot/`
   - `/eda/techniques/spectral-plot/`
   - `/eda/quantitative/runs-test/`
   - `/eda/quantitative/levene-test/`
   - `/eda/quantitative/bartletts-test/`
   - `/eda/quantitative/anderson-darling/`
   - `/eda/quantitative/grubbs-test/`
   - `/eda/quantitative/chi-square-gof/` (NOT `chi-square-goodness-of-fit`)
   - `/eda/techniques/ppcc-plot/` (NOT `/eda/quantitative/ppcc/`)
2. **Run link validation after every case study expansion.** The quick task 011 validation approach (grep for all `/eda/` links and verify slugs against technique/distribution inventories) should be built into the workflow.
3. **Use consistent link patterns from the Random Walk reference implementation.** Copy the exact link syntax from Random Walk when linking to techniques and quantitative tests that appear in both.
4. **Cross-case-study links are new and particularly error-prone.** The expanded content should reference other case studies (e.g., "Compare with the [random walk](/eda/case-studies/random-walk/) case study where the location assumption fails catastrophically"). Verify these case study slugs match the actual file names under `src/data/eda/pages/case-studies/`.

**Warning signs:**
- Build succeeds but clicking a link in the rendered page leads to a 404
- Astro build reports warnings about unresolved internal links (though Astro may not always catch MDX link issues in static builds)
- A reviewer notices that a link labeled "autocorrelation plot" points to the quantitative autocorrelation coefficient page instead of the plot technique page

**Phase to address:**
Every content phase -- run link validation after each case study is expanded. The cheat sheet should be created in Phase 1.

---

### Pitfall 5: datasets.ts Grows Past Maintainability and Import Performance Thresholds

**What goes wrong:**
`datasets.ts` is already 93KB with 10 dataset arrays. The Standard Resistor case study adds the DZIUBA1.DAT dataset with 1000 observations. If these are 6-digit precision decimal numbers, that is approximately 1000 * 10 characters * ~1.5 (commas, spaces, newlines) = 15KB of new data. The file grows to ~108KB. More importantly, every *Plots.astro component imports from `datasets.ts`, which means the entire 108KB file is parsed by Node.js during build for every plot component evaluation. With 100+ plot component invocations across 9 case studies, this means `datasets.ts` is parsed 100+ times during a single build (though Node.js module caching mitigates this after the first parse). The real risk is not runtime performance but developer experience: a 108KB TypeScript file with thousands of literal numbers is hard to navigate, review, and validate.

**Why it happens:**
The original architecture placed all datasets in a single file for simplicity and discoverability. At 5 datasets this was reasonable. At 10 datasets it is already large. Adding the 11th (Standard Resistor) continues the pattern without questioning whether it still makes sense. The issue compounds because some case studies (Ceramic Strength) have structured data (objects with batch/lab/strength fields) while others have simple number arrays, making the file a grab-bag of different data shapes.

**How to avoid:**
1. **Accept that the current single-file approach works for v1.9.** Node.js caches module imports, so the 108KB file is parsed once per build, not 100+ times. The developer experience concern is real but manageable for 11 datasets. Do NOT refactor `datasets.ts` into multiple files as part of v1.9 -- that is a v2.0 concern.
2. **Verify the Standard Resistor data entry carefully.** The DZIUBA1.DAT dataset has 1000 observations. Manually entering 1000 values is error-prone. Programmatically download and parse the NIST .DAT file, format as TypeScript array literal, and paste into datasets.ts. Verify the array length matches 1000.
3. **Add a source comment block** above the Standard Resistor dataset following the existing pattern (see normalRandom and uniformRandom blocks), including NIST section reference, .DAT file URL, and observation count.
4. **Update CaseStudyDataset.astro's CASE_STUDY_MAP** to include the new `standard-resistor` slug pointing to the new dataset export.

**Warning signs:**
- Standard Resistor dataset array has the wrong number of elements (quick task 011 verified other array counts; the same check must run for the new dataset)
- IDE becomes sluggish when editing datasets.ts (typical at ~150KB+, not yet at 108KB)
- TypeScript compiler shows memory warnings related to large literal types

**Phase to address:**
Phase 2 (Standard Resistor case study creation) -- data entry and verification phase.

---

### Pitfall 6: *Plots.astro Component Duplication Explosion

**What goes wrong:**
There are currently 9 *Plots.astro components, one per case study. They share 70-80% identical code: the same `singleConfig` and `compositeConfig` objects, the same `<figure>` wrapper HTML, the same `switch(type)` structure, and the same `defaultCaptions` pattern. Each component independently imports from `svg-generators/index` and `datasets`. When expanding each component to support 13-16 plot types (up from the current 5-8 in most components), the duplication multiplies. The BeamDeflectionPlots component already has a custom sinusoidal model fit in its frontmatter. The CeramicStrengthPlots has batch splitting logic. The RandomWalkPlots has AR(1) regression. Adding similar model-specific computations to the other 6 components creates 9 independent, divergent copies of essentially the same rendering pattern.

**Why it happens:**
Astro components do not easily support parametric inheritance or composition for the frontmatter (server-side) logic. You cannot create a "BasePlots" component that subclasses add model-specific computations to. Each case study has unique model-fitting requirements (AR(1) for Random Walk, sinusoidal for Beam Deflections, batch comparison for Ceramic Strength), making a single generic component impractical. The natural approach is copy-paste-modify from RandomWalkPlots, but this means fixing a bug in the `<figure>` wrapper HTML requires changing 9 files.

**How to avoid:**
1. **Extract the shared rendering wrapper** into a `PlotFigure.astro` component. Each *Plots.astro component computes its SVG string and caption, then passes them to `<PlotFigure svg={svg} caption={caption} isComposite={isComposite} />`. This isolates the HTML/CSS rendering from the data/computation logic. Changes to figure styling, responsive behavior, or dark mode only need to be made in one place.
2. **Extract shared plot generation calls** into helper functions. Create a `generateStandardPlots(data: number[], config)` function that returns the 7 standard plot SVGs (4-plot, run-sequence, lag, histogram, probability, autocorrelation, spectral) as a map. Each *Plots.astro component calls this for its raw data plots, then adds custom residual/model plots.
3. **Keep model-specific computation in each *Plots.astro component** -- do not try to abstract AR(1) regression vs. sinusoidal fitting vs. batch comparison into a generic system. The computational diversity is genuine and should be explicit.
4. **Standardize the `PlotType` union** across components. Use a consistent naming convention: raw data plots use short names (`4-plot`, `run-sequence`, `lag`, `histogram`, `probability`, `autocorrelation`, `spectral`); residual plots use `residual-` prefix; model-specific plots use descriptive names (`predicted-vs-original`, `batch-box-plot`).
5. **Standardize `defaultCaptions`** structure. Each caption should follow: "[Plot type] of [dataset name] [showing/confirming] [key finding]." Review all 9 components' captions for consistent style.

**Warning signs:**
- A CSS change to the plot figure wrapper needs to be applied to 9 separate files
- Two *Plots.astro components use different `singleConfig` dimensions (currently they all use 720x450, but drift is possible)
- Caption text inconsistency: some captions describe data behavior, others describe plot construction

**Phase to address:**
Phase 1 (Infrastructure) -- extract PlotFigure.astro and generateStandardPlots() helper before expanding content.

---

### Pitfall 7: KaTeX Formula Errors in Hypothesis Test Notation

**What goes wrong:**
Each case study contains 5-10 KaTeX-rendered hypothesis test formulas using the `<InlineMath tex="..." />` component. Complex formulas like `H_0\!: B_1 = 0 \quad \text{vs.} \quad H_a\!: B_1 \neq 0` require careful escaping. The `\!` (negative thin space), `\quad`, `\text{}`, and `\neq` commands must all be correctly typed. A missing backslash before `text` renders `{vs.}` as a JSX expression error. A `\ne` instead of `\neq` may render differently. The InlineMath component uses `throwOnError: false`, which means KaTeX silently fails on malformed LaTeX and renders the raw source text instead -- the build succeeds but the page shows broken formulas.

**Why it happens:**
MDX treats `{}` as JSX expressions. In `<InlineMath tex="..." />`, the `tex` prop is a string, so curly braces inside the string are safe. But if the formula is accidentally placed outside the `tex` attribute or in markdown body text, MDX parses the braces as JSX. Additionally, KaTeX's `throwOnError: false` setting (chosen to prevent build failures on minor formula issues) masks errors. A formula like `\sigma_1^2 = \sigma_2^2` works fine, but `\sigma_{1}^{2}` also works and either pattern might be used inconsistently.

**How to avoid:**
1. **Copy the exact formula patterns from the Random Walk reference implementation.** The Random Walk MDX has working examples of every common formula pattern: hypothesis tests, confidence intervals, model equations, test statistics in tables, and parameter estimates. Use these as templates.
2. **Build a formula test page** (`/eda/test-formulas.mdx` existed during v1.8 development and was deleted) or create a quick validation script that extracts all `tex="..."` strings from case study MDX files and runs `katex.renderToString()` on each one, reporting failures.
3. **Use `throwOnError: true` during development** (temporarily change in InlineMath.astro) to catch formula errors as build failures rather than silent degradation. Switch back to `false` before deployment.
4. **Standardize formula notation conventions:**
   - Hypothesis tests: `H_0\!: ... \quad \text{vs.} \quad H_a\!: ...`
   - Confidence intervals: `\bar{Y} \pm \frac{2s}{\sqrt{N}}`
   - Test statistics in tables: `t = 9.275` (no `\text{}` wrapper in table cells)
   - Negative values: `Z = {-20.324}` (braces around negative sign prevent parsing as minus operator)

**Warning signs:**
- Raw LaTeX text visible in the rendered page (e.g., user sees `\bar{Y}` instead of Y-bar)
- Formula renders in a different font size or style than surrounding formulas on the same page
- Build passes but formula shows red error text from KaTeX (when `throwOnError: false`)
- Inconsistent spacing in hypothesis test notation across case studies

**Phase to address:**
Every content phase -- formula validation is part of the per-case-study review checklist.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode all test statistics in MDX instead of computing at build time | Faster content writing; no need to extend statistics.ts | Values cannot be verified programmatically; typo in one value silently produces wrong statistical conclusion | Acceptable for critical values (t, F, chi-squared tables) that are mathematical constants. NOT acceptable for computed values (mean, std dev, regression coefficients) that can be derived from the dataset |
| Copy-paste RandomWalkPlots.astro for each new case study without extracting shared code | Each component is self-contained, easy to understand in isolation | Bug fixes to figure wrapper or config must be applied 9 times; caption style drifts; inconsistent PlotType definitions | During v1.9 only -- must refactor to shared PlotFigure component before adding more case studies |
| Skip individual plot subsections and keep the abbreviated "4-Plot Overview + summary" style | 50% less content to write per case study; faster delivery | Pages are ~150 lines shorter than Random Walk reference; Google may flag as thin content relative to the deeper pages; inconsistent depth across the collection | Never for v1.9 -- the whole point of this milestone is deepening every case study to match Random Walk |
| Put all new computations (Levene test, runs test, model fitting) inline in each *Plots.astro component | No new module files; computation visible next to rendering | 6+ independent implementations of the same test; any bug fix must be applied in multiple places; no unit testing possible | Never -- all statistical computations belong in statistics.ts or a new test-statistics.ts module |
| Use approximate critical values (e.g., t_0.975,498 "approximately equals" 1.96) for all tests | Faster writing; no lookup needed | Technically wrong for small samples (t_0.975,10 = 2.228, not 1.96); undermines precision claims | Acceptable when df > 120 where t distribution closely approximates normal. NOT acceptable for Ceramic Strength (batch1 n=240, batch2=240) or Fatigue Life (n=101) if sub-group tests are performed |
| Omit the "Develop Better Model" and "Validate New Model" sections from case studies where NIST includes them | Faster delivery; shorter pages | Missing the most pedagogically valuable part of the NIST analysis; distinguishes this resource from generic statistics tutorials | Never when the NIST source includes model development -- the full EDA cycle is the differentiator |

## Integration Gotchas

Common mistakes when adding deep content to the existing EDA case study system.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| New Standard Resistor dataset + CaseStudyDataset.astro | Adding the dataset to datasets.ts but forgetting to add the mapping in CaseStudyDataset.astro's `CASE_STUDY_MAP`. Result: the dataset panel does not render on the page. | Add both: (1) the dataset export in datasets.ts, (2) the slug mapping in CASE_STUDY_MAP, (3) import the dataset in CaseStudyDataset.astro's import block. The pattern exists for all 9 current datasets -- follow exactly. |
| New StandardResistorPlots.astro + case study MDX | Creating the component but using the wrong import path in the MDX file. The relative path from `src/data/eda/pages/case-studies/standard-resistor.mdx` to `src/components/eda/StandardResistorPlots.astro` is `../../../../components/eda/StandardResistorPlots.astro`. Getting the depth wrong is a silent build error. | Copy the import line from an existing case study MDX (e.g., random-walk.mdx) and change only the component name. |
| Expanding existing case studies + existing cross-links | Adding new content to a case study that was previously linked from technique pages. The technique page says "see the [beam deflections](/eda/case-studies/beam-deflections/) case study" -- if the beam deflections page restructures its section headers, these links still work (anchor-free) but readers may land at unexpected content. | Keep all existing MDX file names and URL slugs identical. Only ADD sections; do not rename or remove existing sections that other pages may reference. |
| New quantitative test links + technique vs. quantitative ambiguity | Adding a link to "Levene test" and pointing to `/eda/quantitative/levene-test/` -- correct. But adding a link to "autocorrelation" and not knowing whether to link to `/eda/techniques/autocorrelation-plot/` (the plot) or `/eda/quantitative/autocorrelation/` (the quantitative coefficient). | Follow the Random Walk pattern: when discussing the PLOT, link to techniques. When discussing the COEFFICIENT or test result, link to quantitative. When in doubt, check what the existing case study links use. |
| Standard Resistor page + dynamic route | The case study dynamic route at `src/pages/eda/case-studies/[...slug].astro` loads MDX files from `src/data/eda/pages/case-studies/`. Adding `standard-resistor.mdx` should be automatically picked up. But the file must have the correct frontmatter (section, category, nistSection) or the page may not render correctly in the layout. | Copy frontmatter from an existing case study, change title/description/nistSection to match Standard Resistor (NIST 1.4.2.7). Verify the page renders by checking `localhost:4321/eda/case-studies/standard-resistor/` after creation. |
| OG image for Standard Resistor | The new case study needs an OG image. The existing OG image generation at `src/pages/open-graph/eda/[...slug].png.ts` should automatically pick it up if the page is in the right collection. But the OG cache (`og-cache.ts`) is hash-based on title+description. If the title or description changes after first build, the old cached image persists until the cache is cleared. | After finalizing the Standard Resistor page's title and description, clear the OG cache (`rm -rf node_modules/.cache/og-eda`) and rebuild to generate the correct OG image. |

## Performance Traps

Patterns that work at the current scale but fail as case study depth increases.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Every *Plots.astro component recomputes all model fits on every render | Invisible at 5 plot types per page; painful at 16 plot types when frontmatter runs 16 times | Memoize model fits in a shared module; the component just reads pre-computed values | At 9 case studies * 16 plot types = 144 total renders, each recomputing regression/FFT/autocorrelation |
| Autocorrelation computation with maxLag=100 on 1000-point Standard Resistor data | ~100,000 iterations per autocorrelation call; with 2-4 calls per page, that is 200-400K iterations for one page | Use maxLag=50 unless the data specifically needs higher lag analysis; compute once and cache | When a single case study page takes >1 second to render in build output |
| Inline KaTeX rendering for 50+ formulas per expanded case study | Each `katex.renderToString()` call takes ~1-5ms; 50 formulas adds 50-250ms per page | This is acceptable at current scale; becomes a concern only if case studies grow to 100+ formulas | Not a problem at v1.9 scale (50 formulas * 9 pages = 450 total KaTeX calls, ~1-2 seconds total) |
| Large MDX files (300-400 lines) with 13-16 embedded SVG components | Page HTML output grows to 50-100KB per case study (SVGs are typically 5-10KB each); browser downloads all SVGs on page load | Already mitigated: SVGs are inline (`set:html`), which means they are part of the initial HTML. No additional HTTP requests. But large HTML pages may cause slow initial paint. | At 16 inline SVGs * ~8KB average = ~128KB of SVG content per page; combined with text, KaTeX, and layout, a single case study page could be 200KB+ HTML. Consider `loading="lazy"` for below-fold figures. |
| The `powerSpectrum()` function zero-pads data but the Blackman-Tukey method does not need zero-padding | Wasted computation if the function is called with the wrong expectation of output length | The current implementation uses Blackman-Tukey correlogram method (not FFT-based periodogram), so it does not zero-pad. Verify this is consistent when adding new case studies. | Non-issue with current implementation, but if someone refactors to FFT-based periodogram, zero-padding for non-power-of-2 dataset sizes becomes important |

## UX Pitfalls

Common user experience mistakes when adding deep statistical content to case study pages.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Walls of hypothesis test tables without visual breaks | The quantitative results section becomes a 100-line slog of tables; users lose context of which assumption each table tests | Interleave tables with 1-2 sentence conclusions in bold. Use the pattern from Random Walk: each test has its own subsection with hypothesis, table, and conclusion paragraph. |
| Inconsistent conclusion formatting across case studies | In Random Walk, conclusions are bold and start with "Conclusion:". In Cryothermometry, some conclusions are italic, others plain text. | Standardize: every test conclusion starts with `**Conclusion:**` in bold, followed by the test statistic interpretation and the assumption verdict in bold (e.g., "the **fixed-location assumption is satisfied**"). |
| No visual indicator of test result (reject vs fail-to-reject) in the Test Summary table | User must mentally cross-reference test statistic vs. critical value to determine the outcome; the "Result" column helps but is easy to overlook | Use the Random Walk Test Summary pattern: Result column uses `**Reject**` or `**Fail to reject**` in bold, making the verdict immediately scannable. For edge cases like Cryothermometry's "Reject (but practically negligible)", include the qualifier in parentheses. |
| Identical plot captions across case studies | Every histogram caption says "Histogram with KDE overlay" -- no information about what makes THIS histogram different from the others | Each caption should mention the specific dataset name AND the key finding: "Histogram of cryothermometry voltage counts showing a discrete, approximately symmetric distribution with only 8 distinct values." |
| Missing "so what" in the Interpretation section | The section lists which assumptions failed but does not explain the practical consequences | After listing violations, explain what they mean for the analyst: "Because the randomness assumption is violated, the standard confidence interval formula underestimates the true uncertainty in the mean." |
| No clear navigation between related case studies | User finishes one case study and has no guidance on which to read next | Add a "Related Case Studies" callout at the bottom of each case study, grouping by assumption violation type: "Also see: [Random Walk](/eda/case-studies/random-walk/) (severe assumption violations) and [Normal Random Numbers](/eda/case-studies/normal-random-numbers/) (all assumptions satisfied)." |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Test Summary table:** Often missing one test -- verify every case study has ALL tests: location (regression), variation (Levene or Bartlett), randomness (runs test), randomness (autocorrelation lag-1), distribution (PPCC or Anderson-Darling or both), outliers (Grubbs or omitted with explanation)
- [ ] **Summary statistics match datasets.ts:** Compute `mean()` and `standardDeviation()` on the dataset array and verify they match the values in the Summary Statistics table (the Quick Task 011 audit verified existing values; new content must also match)
- [ ] **Critical values are correct:** t critical value with N-2 degrees of freedom, F critical value with correct df1 and df2, chi-squared critical value with k-1 degrees of freedom -- verify the degrees of freedom match the sample size and group count for each case study
- [ ] **Plot captions are unique:** Every `defaultCaptions` entry should mention the specific dataset name and key finding. No two case studies should have identical caption text for the same plot type.
- [ ] **The "Develop Better Model" section exists where NIST includes it:** Random Walk (AR(1)), Beam Deflections (sinusoidal), and potentially others. Check the NIST source for each case study.
- [ ] **Residual validation plots exist where a model is developed:** If the case study develops a better model, there must be residual plots (residual-4-plot, residual-run-sequence, residual-lag, residual-autocorrelation at minimum)
- [ ] **All cross-reference links resolve:** Run link validation script on every case study after expansion. The 5 errors found in quick task 011 establish that this is a real, recurring issue.
- [ ] **Standard Resistor dataset has correct count:** The DZIUBA1.DAT file has 1000 observations. Verify `standardResistor.length === 1000` in datasets.ts.
- [ ] **Standard Resistor slug is registered everywhere:** datasets.ts export, CaseStudyDataset.astro CASE_STUDY_MAP, DATASET_SOURCES object, MDX file name, and the frontmatter nistSection field.
- [ ] **KaTeX formulas render correctly in dark mode:** The Random Walk formulas are verified, but new formulas added during expansion (especially complex Levene test notation or Bartlett test chi-squared notation) must be checked in both light and dark themes.
- [ ] **Accessibility alt text on all plots:** Each `<figure>` element has a `<figcaption>` (already the pattern from RandomWalkPlots), but verify the caption provides enough context for screen readers to understand the key finding without seeing the plot.
- [ ] **SEO: Each expanded case study has a unique meta description:** The frontmatter `description` field should be specific to the case study, naming the NIST dataset and the key statistical finding. Verify no two case studies share the same description text.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Wrong test statistic in quantitative table | LOW | Fix the single value in MDX; verify conclusion still matches. But if the wrong value changed a "reject" to "fail to reject", review the entire Interpretation and Conclusions section for cascading errors. |
| Build time doubles after adding all case studies | LOW-MEDIUM | Implement memoized computation module (statistics-cache.ts); restructure *Plots.astro to only compute what the current `type` prop needs. Can be done in 2-4 hours. |
| Inconsistent section structure across 9 case studies | MEDIUM | Create a restructuring PR that normalizes all section headers. Content is preserved, just reorganized. Effort: 30 min per case study = 4.5 hours. Harder if external pages already link to specific section anchors. |
| 20+ broken cross-reference links across expanded content | LOW-MEDIUM | Run bulk grep for all `/eda/` links in case study MDX files. Validate each against the technique/distribution slug inventory. Fix in a single PR. Effort: 1-2 hours for 20 links. |
| Standard Resistor dataset transcription errors | MEDIUM | Must re-download DZIUBA1.DAT from NIST, parse programmatically, and diff against the committed dataset. If the dataset is wrong, all computed test statistics and plots are wrong -- requiring regeneration of all Standard Resistor plots. |
| *Plots.astro code duplication causes inconsistent rendering | MEDIUM | Extract PlotFigure.astro and migrate all 9 components. Effort: 1-2 hours for the extraction, plus testing all 9 case study pages. The migration is mechanical but touches many files. |
| Formula errors visible in production | LOW | Fix the `tex` string in the MDX file; rebuild; deploy. Each formula fix is <1 minute. The risk is not the fix time but the credibility damage while the error is live. |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Statistical value errors | Every content phase | Computed values match `statistics.ts` output; critical values verified against standard tables; reject/fail-to-reject conclusions consistent with statistic vs critical value comparison |
| Build time regression | Phase 1 (Infrastructure) | Baseline build time recorded; each case study enhancement adds <2 seconds; total build stays under 2x baseline |
| Structural inconsistency | Phase 1 (Template/Gap Analysis) | Canonical template created; gap analysis for all 9 case studies completed; section header review passed |
| Cross-reference link errors | Every content phase | Link validation script runs after each case study expansion; 0 broken links in the final build |
| datasets.ts growth | Phase for Standard Resistor | Array length verified (1000 elements); source comment block present; CaseStudyDataset mapping added |
| *Plots.astro duplication | Phase 1 (Infrastructure) | PlotFigure.astro extracted; shared singleConfig/compositeConfig in one place; all 9 components use consistent pattern |
| KaTeX formula errors | Every content phase | All `tex` strings render without raw LaTeX visible; formula notation consistent across case studies; dark mode tested |
| Page size concerns | Phase 2+ (Content phases) | No case study page exceeds 250KB HTML output; below-fold plots use lazy loading if needed |
| Accessibility | Every content phase | All `<figure>` elements have descriptive `<figcaption>` text; captions mention dataset name and key finding |
| SEO thin/duplicate content | Phase 3+ (Review phase) | Each case study has unique description; unique interpretation section; unique conclusions; no template-only content |

## Sources

- Existing codebase: `src/data/eda/pages/case-studies/random-walk.mdx` -- Reference implementation (339 lines, 16 plot types, full quantitative results, model development, residual validation)
- Existing codebase: `src/components/eda/RandomWalkPlots.astro` -- Reference Plots component pattern (226 lines, AR(1) model computation, 16 plot type switch)
- Existing codebase: `src/components/eda/BeamDeflectionPlots.astro` -- Sinusoidal model computation pattern (216 lines, OLS normal equations via Cramer's rule)
- Existing codebase: `src/lib/eda/math/statistics.ts` -- Shared math functions (mean, standardDeviation, linearRegression, autocorrelation, fft, powerSpectrum, normalQuantile)
- Existing codebase: `src/lib/eda/svg-generators/index.ts` -- 13 SVG generators barrel export
- Existing codebase: `src/data/eda/datasets.ts` -- 93KB, 10 dataset arrays, DATASET_SOURCES metadata
- Existing codebase: `src/components/eda/CaseStudyDataset.astro` -- Dataset panel with slug-to-dataset mapping
- Existing codebase: `src/components/eda/InlineMath.astro` -- KaTeX build-time rendering with `throwOnError: false`
- Quick task 011: `.planning/quick/011-eda-content-correctness-validation/011-SUMMARY.md` -- Found 5 broken cross-reference links; verified all existing statistical values correct
- [NIST/SEMATECH e-Handbook, Section 1.4.2](https://www.itl.nist.gov/div898/handbook/eda/section4/eda42.htm) -- Source material for all 10 case studies
- [NIST Standard Resistor case study](https://www.itl.nist.gov/div898/handbook/eda/section4/eda427.htm) -- Section 1.4.2.7, DZIUBA1.DAT, 1000 observations
- [Dataplot Commands for Resistor Case Study](https://www.itl.nist.gov/div898/handbook/eda/section4/resistor/resistor.htm) -- NIST analysis methodology
- Existing PITFALLS.md (v1.8): `.planning/research/PITFALLS.md` (previous version, 2026-02-24) -- Foundation pitfalls for the original EDA encyclopedia build

---
*Pitfalls research for: EDA Case Study Deep Dive (v1.9) -- enhancing 8 existing case studies and adding Standard Resistor*
*Researched: 2026-02-26*
