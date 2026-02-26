# Project Research Summary

**Project:** EDA Case Study Deep Dive (v1.9)
**Domain:** Statistical content enhancement — deepening 8 existing NIST case studies + adding 1 new case study (Standard Resistor) to an existing Astro 5 static site
**Researched:** 2026-02-26
**Confidence:** HIGH

## Executive Summary

This milestone enhances an existing, fully functional EDA encyclopedia (90+ pages, 13 SVG generators, 9 case studies) to match the depth of the NIST/SEMATECH e-Handbook source material. The Random Walk case study is already the gold standard reference at 339 lines with 16 plot types, full quantitative test results, and model development/validation sections. The remaining 8 case studies range from substantially complete (Normal Random, Cryothermometry, Filter Transmittance, Heat Flow Meter) to needing significant new visualizations (Beam Deflections, Fatigue Life, Ceramic Strength). One entirely new case study (Standard Resistor, NIST Section 1.4.2.7) must be built from scratch. All research confirms this can be accomplished with zero new npm dependencies — existing SVG generators and the statistics.ts library cover every required plot type.

The recommended approach is infrastructure-first: create a new `hypothesis-tests.ts` module with 7-11 statistical test functions (runs test, Levene, Bartlett, Anderson-Darling, Grubbs, PPCC, F-test), extract a shared `PlotFigure.astro` wrapper to reduce duplication across 9 components, define a canonical section template, and establish a URL cheat sheet before writing any content. Content work then proceeds in priority order — easy wins (4 nearly-complete case studies) before the new Standard Resistor build, before complex enhancements (Beam Deflections sinusoidal model, Fatigue Life distribution comparison, Ceramic Strength DOE plots). Total estimated scope: ~2,500-3,500 lines across ~13 files.

The primary risks are statistical value transcription errors (270+ numeric values must exactly match NIST source), build time regression from 100+ SVG renders across 9 case studies, and cross-reference link errors that multiply as content expands. All three are preventable with upfront tooling: programmatic computation of test statistics from dataset arrays (not hardcoding), build time monitoring with a set budget, and a cross-reference URL cheat sheet. Quick task 011 already found 5 real broken links in the existing case studies, confirming this is an active risk.

## Key Findings

### Recommended Stack

The existing stack is entirely sufficient. Zero new npm packages are required. The 13 existing SVG generators cover every plot type referenced in NIST case studies, including residual variants (which are existing generators applied to computed residual arrays). The `statistics.ts` library covers all descriptive statistics; the only additions needed are formal hypothesis test functions in a new `hypothesis-tests.ts` module.

**Core technologies:**
- `statistics.ts` (existing, unchanged): descriptive stats, FFT, ACF, OLS regression — handles all model fitting including the AR(1) already in Random Walk
- `hypothesis-tests.ts` (new module, ~300-400 lines): formal tests (runs, Levene, Bartlett, Anderson-Darling, Grubbs, PPCC, F-test) — pure arithmetic on number arrays, no dependencies
- `*Plots.astro` components (9 existing + 1 new): per-case-study build-time computation + SVG generator dispatch — proven with 16 plot types in Random Walk
- `datasets.ts` (existing, +1 append): 10 dataset arrays at 93KB; Standard Resistor (DZIUBA1.DAT, 1000 values) adds ~15KB

### Expected Features

**Must have (table stakes):**
- Complete NIST quantitative test statistics with exact values for all 8 existing case studies — source parity is the core goal
- All NIST graphical outputs reproduced for the 3 significantly-gapped case studies (Beam Deflections, Fatigue Life, Ceramic Strength)
- Standard Resistor case study: DZIUBA1.DAT dataset + `StandardResistorPlots.astro` + `standard-resistor.mdx` + routing registration + CaseStudyDataset.astro mapping
- Test Summary table in every case study showing all assumption results (location, variation, randomness, distribution, outlier)
- Quantitative results section with hypothesis, test statistic, critical value, and conclusion for each test

**Should have (competitive differentiators):**
- Test statistics computed at build time from dataset arrays (not just hardcoded) — enables programmatic verification and prevents silent errors
- Shared `PlotFigure.astro` component — reduces duplication across 9 components
- Cross-references between related case studies at page bottom (e.g., "Also see: Random Walk for severe violations")
- Unique, dataset-specific captions for every plot (not generic "Histogram with KDE overlay")
- "Develop Better Model" and "Validate New Model" sections for Beam Deflections, matching NIST structure

**Defer (v2+):**
- Bootstrap comparison plots for Uniform Random location estimators — NIST-specific but not core to the EDA narrative
- Complex demodulation plots for Beam Deflections — highly specialized, NIST treats it as supplementary
- CI for standard deviation in Normal Random and Heat Flow Meter — minor gap, low user value
- Chi-square goodness-of-fit and Kolmogorov-Smirnov for Normal Random — mentioned in NIST but not central
- `datasets.ts` split into per-case-study files — not needed until 15+ datasets

### Architecture Approach

The per-case-study `*Plots.astro` component architecture is correct and should not be refactored into a generic component. Each case study has fundamentally different model computations (AR(1), sinusoidal OLS, batch splitting, distribution fitting) that cannot be generalized without losing type safety. What can be shared is the figure wrapper HTML and plot dimension constants — extract these into `PlotFigure.astro` and `plot-configs.ts`. All computation follows a strict downward data flow: datasets.ts → statistics modules → Plots component frontmatter → SVG generators → MDX presentation. MDX files are presentation-only; they never contain computation logic.

**Major components:**
1. `hypothesis-tests.ts` (new) — formal statistical tests; feeds test statistic values computed from dataset arrays into Plots components and MDX tables
2. `*Plots.astro` components (9 existing, 1 new for Standard Resistor) — case-study-specific frontmatter computes models and residuals; dispatches to SVG generators by plot type
3. `PlotFigure.astro` (new, shared) — shared figure wrapper eliminating the 70-80% duplicated HTML across all 9 components
4. MDX case study pages (8 expanded, 1 new) — prose, InlineMath formulas, quantitative tables with verified values, plot component invocations

### Critical Pitfalls

1. **Statistical value transcription errors** — 270+ numeric values across 9 case studies must match NIST exactly; a single wrong digit changes whether a hypothesis test rejects or fails to reject. Compute test statistics from `datasets.ts` arrays programmatically rather than hardcoding; cross-reference every critical value against the NIST source page character-by-character.

2. **Build time regression from 100+ SVG renders** — each `*Plots.astro` component recomputes its full model (regression, FFT, autocorrelation) on every render; with 16 invocations per page the AR(1) computation runs 16 times for Random Walk alone. Monitor with `time npx astro build`; budget less than 2 seconds regression per case study added; memoize expensive computations.

3. **Cross-reference link errors multiply during expansion** — quick task 011 already found 5 broken links from technique/quantitative URL prefix confusion. Create a URL cheat sheet for the 20-30 most commonly referenced pages; run link validation after every case study expansion; technique-vs-quantitative ambiguity is the root cause (e.g., `/eda/techniques/autocorrelation-plot/` vs. `/eda/quantitative/autocorrelation/`).

4. **Structural inconsistency across 9 case studies** — section names and depth drift when writing sequentially. Define a canonical section template before any content writing; apply headers-first across all 9 studies before filling content; document intentional deviations (Fatigue Life and Ceramic Strength have genuinely different NIST structures).

5. **KaTeX formula errors silently degrade** — `throwOnError: false` means malformed LaTeX renders as raw text rather than failing the build. Temporarily switch to `throwOnError: true` during development; copy formula patterns verbatim from Random Walk reference implementation; standardize notation conventions for hypothesis tests, confidence intervals, and test statistics in tables.

## Implications for Roadmap

Based on research, the architecture dependency graph and feature priority matrix clearly suggest a 5-phase structure:

### Phase 1: Infrastructure Foundation
**Rationale:** All content phases depend on the hypothesis-tests module, the canonical template, and the shared PlotFigure component. Building infrastructure first prevents doing content work twice and eliminates the primary technical debt pitfall (component duplication). Baseline build time must be measured before any content changes.
**Delivers:** `hypothesis-tests.ts` with 7-11 test functions tested against known NIST values; `PlotFigure.astro` shared wrapper; `plot-configs.ts` shared constants; canonical section template document; URL cross-reference cheat sheet; baseline build time measurement.
**Addresses:** FEATURES — "computed test statistics" differentiator; ARCHITECTURE — Decision 4 (new module), Decision 1 (shared wrapper)
**Avoids:** Pitfall 2 (build regression — establish baseline), Pitfall 3 (structural inconsistency — template first), Pitfall 5 (component duplication — extract before scaling)

### Phase 2: Minor-Gap Case Studies (Quick Wins)
**Rationale:** Four case studies are already 90%+ complete (Normal Random, Cryothermometry, Filter Transmittance, Heat Flow Meter). Completing them first builds momentum, validates the canonical template in practice, and establishes the enhanced format before tackling complex studies. These studies have no model development sections and need only content deepening and test statistic verification — the lowest risk content work.
**Delivers:** Normal Random Numbers, Cryothermometry, Filter Transmittance, and Heat Flow Meter at full NIST parity — verified test statistics computed from dataset arrays, complete quantitative sections following canonical template, unique plot captions, cross-study links at page bottom.
**Uses:** `hypothesis-tests.ts` from Phase 1; existing SVG generators; no new components or plot types needed
**Avoids:** Pitfall 1 (transcription errors — use computed values), Pitfall 4 (link errors — use cheat sheet), Pitfall 7 (formula errors — follow Random Walk patterns)

### Phase 3: Standard Resistor — New Case Study
**Rationale:** Building one complete new case study before tackling complex enhancements of existing studies tests the full pipeline (dataset → component → MDX → routing → OG image). Standard Resistor follows the standard 4-section NIST pattern (same as Phase 2 studies), making it achievable without new SVG generators. Placing it before the complex enhancements allows the full new-case-study workflow to be validated on a simpler study.
**Delivers:** Complete Standard Resistor case study — DZIUBA1.DAT dataset (1000 values, programmatically parsed from NIST) verified in datasets.ts; `StandardResistorPlots.astro` following RandomWalkPlots.astro pattern; `standard-resistor.mdx` with full NIST-parity content; CaseStudyDataset.astro CASE_STUDY_MAP update; OG image generation.
**Uses:** All infrastructure from Phase 1; follows the same component pattern as Phase 2
**Avoids:** Pitfall 5 (dataset growth — verify 1000-element array count before proceeding); integration gotcha (CaseStudyDataset.astro mapping, MDX relative import path, OG cache clear after finalizing title/description)

### Phase 4: Complex Enhancements — Beam Deflections and Fatigue Life
**Rationale:** These two case studies have NIST Develop/Validate sections requiring model fitting and specialized visualizations. Beam Deflections needs sinusoidal model computation and residual analysis (16+ plot types matching Random Walk depth); Fatigue Life needs Weibull probability plot and distribution comparison visualization. Both share the "model-based residual analysis" architecture pattern. Tackling them together allows the residual analysis pattern established in Random Walk to be extended to two more studies while the pattern is fresh.
**Delivers:** Beam Deflections with sinusoidal model fit, all residual plots populated with computed data (residual-4-plot, residual-run-sequence, residual-lag, residual-autocorrelation), and parameter estimates table (C=-178.786, AMP=-361.766, FREQ=0.302596, PHASE=1.46536 verified against NIST). Fatigue Life with Weibull probability plot, distribution comparison discussion, verified AIC/BIC/posterior values, and one-sided prediction interval.
**Uses:** Existing `generateProbabilityPlot({ type: 'weibull' })` for Fatigue Life; existing scatter/line/lag/histogram/autocorrelation generators for Beam Deflections residuals; linearized sinusoidal OLS from existing BeamDeflectionPlots.astro frontmatter
**Avoids:** Pitfall 1 (parameter estimates verified against NIST source table before building residual plots on top of them); Pitfall 2 (Beam Deflections residual computation runs on every render — memoize in Phase 1 infrastructure)

### Phase 5: Ceramic Strength — DOE Case Study
**Rationale:** Ceramic Strength requires the most new visualization variants of any case study: bihistogram, block plots, DOE mean/SD plots, interaction plots, and multi-group box plots. These extend existing generators (generateBarPlot, generateLinePlot, generateBoxPlot) rather than requiring entirely new generator files. Placed last because it is the most complex, its DOE structure is genuinely different from all other case studies, and it benefits from all infrastructure and patterns being proven in Phases 2-4.
**Delivers:** Ceramic Strength at full NIST parity — batch comparison deepening (bihistogram variant, QQ plot batch comparison), lab effect analysis (box plots by lab overall and per batch), DOE primary factors analysis (mean plots per factor, SD plots per factor, interaction effects), all quantitative DOE effects computed, F-test and two-sample t-test results verified.
**Uses:** Extended `generateBoxPlot` (multi-group); `generateBarPlot` or `generateLinePlot` extended for DOE means/interaction; existing histogram for bihistogram variant
**Avoids:** Pitfall 3 (structural inconsistency — Ceramic Strength's 6-section NIST structure is an intentional deviation from the canonical template; document explicitly at top of MDX file)

### Phase Ordering Rationale

- Infrastructure before content: `hypothesis-tests.ts` is referenced by all content phases; building it once with verified outputs prevents 9 independent implementations of the same tests
- Easy wins before complex: validates the canonical template and enhanced format on low-risk studies before high-stakes model-development sections; Quick confidence checkpoints before committing to Beam Deflections nonlinear regression
- New case study in the middle: tests the full new-case-study pipeline without the complexity of model fitting; natural checkpoint between "content deepening" and "content plus model development"
- Most complex last: Ceramic Strength's DOE plots are the highest-effort items and benefit from all prior phases being complete and stable; its unique 6-section structure is less confusing to handle after the standard template is fully internalized

### Research Flags

Phases requiring careful implementation attention (known risks, not missing research):
- **Phase 4 (Beam Deflections sinusoidal model):** The linearized OLS approach in BeamDeflectionPlots.astro must produce values matching NIST (C, AMP, FREQ, PHASE) within rounding before residual plots are built on top of it. Verify parameter match before proceeding to residual analysis.
- **Phase 5 (Ceramic Strength DOE plots):** Whether existing generators (generateBarPlot, generateLinePlot) can be extended for DOE mean/SD/interaction plots without new generator files should be re-evaluated at implementation time. Research leans toward extension being sufficient, but assess hands-on.

Phases with well-documented patterns (straightforward execution):
- **Phase 1 (Infrastructure):** All functions are pure arithmetic on number arrays; no external dependencies; RandomWalkPlots.astro is the complete reference pattern
- **Phase 2 (Minor Gaps):** All existing generators used as-is; content writing + test statistic verification only
- **Phase 3 (Standard Resistor):** Standard 4-section NIST pattern; copy RandomWalkPlots.astro as template; follow integration checklist from PITFALLS.md

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified by direct codebase analysis of all 13 SVG generators, statistics.ts, package.json; zero new packages required; confirmed no plot type gaps |
| Features | HIGH | Sourced directly from NIST handbook pages; gap analysis done per-case-study with plot-by-plot and test-by-test comparison against NIST source |
| Architecture | HIGH | Based on codebase analysis of all 9 existing components; Random Walk 339-line gold standard is a fully working reference; patterns are proven |
| Pitfalls | HIGH | Based on existing codebase analysis, quick task 011 audit findings (5 real broken links found), and v1.8 pitfalls experience; risks are concrete not speculative |

**Overall confidence:** HIGH

### Gaps to Address

- **Standard Resistor dataset values:** The DZIUBA1.DAT file with 1000 values must be downloaded from NIST and parsed programmatically. Handle during Phase 3 by programmatic download and parse rather than manual entry; verify array length === 1000 before committing.
- **Ceramic Strength DOE generator strategy:** Whether existing generators (generateBarPlot, generateLinePlot) can be extended for DOE mean/SD/interaction plots without new generator files is an implementation-time decision. Research suggests extension is sufficient but assess hands-on during Phase 5 execution.
- **Beam Deflections sinusoidal regression match:** NIST used DATAPLOT nonlinear least squares; the codebase uses a linearized OLS approximation. Verify the linearized approach produces NIST-matching parameter values (C=-178.786, AMP=-361.766, FREQ=0.302596, PHASE=1.46536) before building the residual analysis layer in Phase 4.

## Sources

### Primary (HIGH confidence)
- NIST/SEMATECH e-Handbook Section 1.4.2 (all 10 case study subsections, fetched directly via WebFetch) — complete feature gap analysis per case study with plot-by-plot and test-by-test comparison
- Existing codebase: `src/lib/eda/math/statistics.ts` — 248 lines, 9 functions; baseline math library verified
- Existing codebase: `src/lib/eda/svg-generators/index.ts` — 13 generators + 2 composite; all verified against case study plot requirements
- Existing codebase: `src/components/eda/RandomWalkPlots.astro` — 339-line reference implementation, 16 plot types, AR(1) model, full quantitative results
- Existing codebase: `src/components/eda/BeamDeflectionPlots.astro` — sinusoidal model via OLS normal equations, 13 plot types
- Existing codebase: `src/data/eda/datasets.ts` — 93KB, 10 dataset arrays
- Quick task 011 audit — `.planning/quick/011-eda-content-correctness-validation/011-SUMMARY.md` — found 5 broken cross-reference links; verified all existing statistical values correct against NIST

### Secondary (MEDIUM confidence)
- NIST Quantitative Output pages for each case study (eda4213, eda4223, eda4233, eda4243, eda4253, eda4263, eda4273, eda4283, eda42a3) — exact test statistic values used for gap analysis
- Existing 9 case study MDX files — current state baseline for each study; line count and section structure assessed
- NIST Standard Resistor case study (eda427) — DZIUBA1.DAT metadata, quantitative test values (regression slope t=100.2, Levene W=140.85, autocorrelation r1=0.97, runs Z=-30.56)

### Tertiary (LOW confidence, needs validation)
- Beam Deflections linearized OLS vs. NIST nonlinear least squares match — assumed from the existing BeamDeflectionPlots.astro implementation but not verified end-to-end; validate parameter estimates in Phase 4 before building residual plots

---
*Research completed: 2026-02-26*
*Ready for roadmap: yes*
*Supersedes: v1.8 SUMMARY.md (2026-02-24)*
