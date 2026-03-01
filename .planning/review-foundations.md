# Foundations Section Review

## Summary

The six foundations pages are **well-written, accurate, and deployment-ready** overall. Content faithfully represents the NIST/SEMATECH Engineering Statistics Handbook source material. Key definitions, the four assumptions, the three analysis paradigms, Anscombe's Quartet, the eight problem categories, and consequences of assumption violations are all correctly conveyed. The writing is clear and educational, adds appropriate cross-references, and avoids introducing errors of interpretation.

Issues found are predominantly **minor** — small wording discrepancies with NIST source text, a few link-routing edge cases, and some missing content from the detailed NIST sub-pages. No critical errors were identified.

---

## Page-by-Page Review

### 1. what-is-eda.mdx

**Source Files:** handbook/eda/section1/eda11.htm (1.1.1), eda12.htm (1.1.2), eda121-eda126.htm, eda13.htm (1.1.3), eda14.htm (1.1.4)

**Source Match:**
- The seven EDA goals (line 13-19) match NIST 1.1.1 exactly in content and ordering.
- The "approach/philosophy" framing (line 21) closely matches NIST: "precisely that--an approach--not a set of techniques, but an attitude/philosophy."
- The EDA vs statistical graphics distinction (line 23) is accurate but slightly simplified. The NIST text says EDA "postpones the usual assumptions about what kind of model the data follow with the more direct approach of allowing the data itself to reveal its underlying structure and model." The MDX version says EDA "encompasses a larger venue" which is a good paraphrase but omits the key insight about *postponing model assumptions*.
- The three paradigm sequences (lines 33-35) match NIST 1.1.2 exactly.
- The detailed explanation of how classical vs EDA vs Bayesian differ (line 37) is a faithful paraphrase of NIST 1.1.2.
- EDA vs Summary (lines 53-55) matches NIST 1.1.3 accurately. Minor wording difference: MDX says "archival role for summary statistics" vs NIST's "archival role in the research and manufacturing world for summary statistics."
- EDA Goals list (lines 61-68) matches NIST 1.1.4 exactly.
- The "Graphics are irreplaceable" quote (line 70) is accurately attributed to Section 1.1.4.

**Issues Found:**
1. (Minor) The MDX omits the EDA vs statistical graphics nuance from NIST: that EDA "postpones the usual assumptions about what kind of model the data follow with the more direct approach of allowing the data itself to reveal its underlying structure and model." The MDX paraphrases more loosely.
2. (Minor) NIST 1.1.1 lists specific graphical techniques (data traces, histograms, bihistograms, probability plots, lag plots, block plots, Youden plots, mean plots, standard deviation plots, box plots). The MDX only mentions histograms, scatter plots, box plots, and probability plots in the "Getting Started" section.
3. (Minor) The "When to Use Each Approach" subsection (lines 41-49) and "The EDA Philosophy" section (lines 74-79) are **original editorial additions** not from NIST. They are well-written and accurate but should be noted as supplementary content.
4. (Minor) Section reference: NIST 1.1.2 has six sub-sections (Models, Focus, Techniques, Rigor, Data Treatment, Assumptions) comparing EDA vs Classical. The MDX covers the high-level distinction well but omits the detailed sub-section breakdowns. This is an acceptable editorial choice for readability.

**Recommendations:**
- Consider adding a sentence about EDA's approach of postponing model assumptions, since this is arguably the single most important distinction from NIST 1.1.1.
- No action needed on the editorial additions; they enhance the page.

---

### 2. assumptions.mdx

**Source Files:** handbook/eda/section2/eda21.htm (1.2.1), eda22.htm (1.2.2), eda23.htm (1.2.3), eda24.htm (1.2.4)

**Source Match:**
- The four assumptions (lines 31-57) match NIST 1.2.1 exactly in content and ordering.
- The underlying model (response = deterministic + random, simplified to response = constant + error) at lines 21-24 matches NIST 1.2.1 accurately.
- The "probabilistic predictability" concept and the quote about processes being "drifting, unpredictable, and out of control" (lines 11-13) match NIST 1.2.2 accurately.
- The quote "not valid, are not supportable (scientifically or legally), and are not repeatable in the laboratory" (line 13) accurately reflects NIST 1.2.2.
- The residuals discussion (lines 59-68) matches NIST 1.2.1's key insight about model validation through residual analysis.
- The 4-plot layout table (lines 74-101) matches NIST 1.2.3's ordering: run sequence (upper left), lag (upper right), histogram (lower left), normal probability (lower right).
- The interpretation guidance (lines 96-101) matches NIST 1.2.4 exactly.

**Issues Found:**
1. (Minor) The assumptions MDX labels them as 1. Random Drawings, 2. Fixed Distribution, 3. Fixed Location, 4. Fixed Variation. NIST 1.2.1 orders them: 1. random drawings, 2. from a fixed distribution, 3. with fixed location, 4. with fixed variation. The MDX ordering **matches NIST**. Good.
2. (Minor) The "randomness assumption is the most critical but the least tested" statement (line 37) is attributed to Section 1.2.5.1, which is correct per the NIST source.
3. (Minor) The MDX adds tool recommendations (lag plot, autocorrelation plot, runs test for randomness; histogram, normal probability plot, Anderson-Darling, K-S, chi-square for distribution; run sequence plot for location and variation; Bartlett's and Levene tests for variation). These are **accurate** and appropriate additions that connect assumptions to concrete techniques.
4. (Minor) The phrase "heteroscedasticity" (line 56) does not appear in the NIST source at this section but is a correct and useful statistical term.

**Recommendations:**
- No changes needed. The page is thorough and accurate.

---

### 3. role-of-graphics.mdx

**Source Files:** handbook/eda/section1/eda15.htm (1.1.5), eda16.htm (1.1.6 Anscombe example)

**Source Match:**
- The quantitative/graphical split (lines 19-38) matches NIST 1.1.5 accurately, listing the same examples.
- The seven roles of graphics (lines 43-51) match NIST 1.1.5 exactly: testing assumptions, model selection, model validation, estimator selection, relationship identification, factor effect determination, outlier detection.
- The quotes match: "Graphical procedures are not just tools that we could use in an EDA context, they are tools that we must use" (line 39, paraphrased) and "If one is not using statistical graphics, then one is forfeiting insight" (line 55) both come from NIST 1.1.5.
- Anscombe's Quartet statistics (lines 60-67) match NIST 1.1.6 exactly: N=11, Mean X=9.0, Mean Y=7.5, Intercept=3, Slope=0.5, Residual SD=1.237 (1.236 for sets 3&4), Correlation=0.816 (0.817 for set 4).
- The four dataset interpretations (lines 73-76) match NIST 1.1.6 exactly.
- The "focus" vs "filter" discussion (lines 82-86) accurately captures NIST 1.1.6.

**Issues Found:**
1. (Minor) The Anscombe Quartet statistics say "Residual standard deviation = 1.237 (1.236 for data sets 3 and 4)". NIST source says the same for the residual standard deviation but the correlation difference is: "Correlation = 0.816 (0.817 for data set 4)". The MDX correctly reproduces both of these.
2. (Minor) The AnscombeQuartetPlot component imports look correct. The data values in the component match the NIST source file ANSCOMBE.DAT values from eda16.htm.
3. (Minor) NIST 1.1.6 includes the actual raw data tables for all four datasets. The MDX omits them in favor of the interactive plot, which is a reasonable editorial choice.

**Recommendations:**
- The AnscombeQuartetPlot component should be verified visually to confirm regression lines and data points render correctly.
- No content accuracy issues.

---

### 4. the-4-plot.mdx

**Source Files:** handbook/eda/section3/4plot.htm (1.3.3.32), handbook/eda/section2/eda24.htm (1.2.4)

**Source Match:**
- The opening description (lines 13-22) matches NIST 1.3.3.32's "Purpose" section accurately.
- The formula Y_i = f(X_1,...,X_k) + E_i (line 26) matches the NIST source.
- The four panels and their targets (lines 30-60) match NIST 1.3.3.32's "Definition" section.
- The 16 questions list (lines 63-81) matches NIST 1.3.3.32's "Questions" section. Comparison:
  - Q6: MDX says "is it white noise?" — NIST says "is white noise?" (missing "it" in NIST, MDX is more grammatical)
  - Q11: MDX uses InlineMath for Y_i = A_0 + E_i, matches NIST source
  - Q13: MDX uses InlineMath for s/sqrt(N), matches NIST source (which shows s_Ybar = s/sqrt(N))
- The "Probabilistic Predictability" section (lines 83-86) matches NIST 1.3.3.32's "Importance" section accurately.
- The interpretation guidance (lines 87-95) combines elements from both NIST 1.2.4 and 1.3.3.32.
- The lag plot interpretation (line 45) mentions "Clustering along the diagonal indicates positive autocorrelation and suggests an autoregressive model may be appropriate. A tight elliptical pattern indicates a sinusoidal (single-cycle) model." These details come from NIST lag plot technique page (lagplot.htm), not from the 4-plot page directly. They are accurate additions.

**Issues Found:**
1. (Minor) Section number in frontmatter says `section: "1.3.3.32"` but the page is in the foundations category. This is technically correct since the 4-plot technique is at 1.3.3.32 in NIST, but might be confusing since foundations pages otherwise use 1.1.x and 1.2.x section numbers.
2. (Minor) The normal probability plot interpretation (line 60) describes short-tailed vs long-tailed departures in detail. This comes from NIST's normal probability plot technique page rather than the 4-plot page specifically, but is accurate.
3. (Minor) Q13 in the MDX shows `s / \sqrt{N}` while NIST shows `s_Ybar = s/sqrt(N)`. The MDX formula is correct but slightly simplified (omitting the subscript on s).

**Recommendations:**
- Consider whether the section number in frontmatter should be adjusted to something like "1.2.3-1.2.4" since this page functions as a foundations page about the 4-plot diagnostic, not as the technique page itself (which would be at /eda/techniques/4-plot/).
- No content accuracy issues.

---

### 5. problem-categories.mdx

**Source Files:** handbook/eda/section1/eda17.htm (1.1.7)

**Source Match:**
- All eight categories match NIST 1.1.7 exactly in structure (Data, Model, Output, Techniques):
  - Univariate: correct (4-Plot, Probability Plot, PPCC Plot)
  - Control: correct (Control Charts)
  - Comparative: correct (Block Plot, Scatter Plot, Box Plot)
  - Screening: correct (Block Plot, Probability Plot, Bihistogram)
  - Optimization: correct (Block Plot, Least Squares Fitting, Contour Plot)
  - Regression: correct (Least Squares Fitting, Scatter Plot, 6-Plot)
  - Time Series: correct (Autocorrelation Plot, Spectrum, Complex Demodulation Amplitude/Phase, ARIMA)
  - Multivariate: correct (Star Plot, Scatter Plot Matrix, Conditioning Plot, Profile Plot, Principal Components, Clustering, Discrimination/Classification)
- The data descriptions, model specifications, and output descriptions all match NIST 1.1.7.
- The note "multivariate analysis is only covered lightly in this Handbook" matches the NIST typo-corrected text ("multivarate" in the NIST source).

**Issues Found:**
1. (Minor) The MDX adds explanatory paragraphs after each category (e.g., "The univariate category is the most fundamental..."). These are helpful editorial additions not from NIST, and are all factually correct.
2. (Minor) The "Choosing the Right Category" section (lines 173-183) is an editorial addition providing guidance on distinguishing categories. It's well-written and accurate.
3. (Minor) Time Series links to `/eda/techniques/complex-demodulation/` for both Complex Demodulation Amplitude and Phase plots. NIST has separate pages (compdeam.htm and compdeph.htm). Verify that the single route handles both or provides appropriate content.
4. (Minor) "Least Squares Fitting" and "Control Charts" appear as plain text rather than links in some categories, while others like Block Plot and Scatter Plot are linked. This is likely because those techniques don't have dedicated pages in the encyclopedia yet. Consistent linking would be ideal.
5. (Minor) "Profile Plot" under Multivariate is also plain text (no link). Same reason — likely no dedicated page.

**Recommendations:**
- Verify that `/eda/techniques/complex-demodulation/` handles both amplitude and phase content.
- Consider adding placeholder links or noting "coming soon" for unlinked techniques.

---

### 6. when-assumptions-fail.mdx

**Source Files:** handbook/eda/section2/eda25.htm (1.2.5), eda251.htm (1.2.5.1), eda252.htm (1.2.5.2), eda253.htm (1.2.5.3), eda254.htm (1.2.5.4)

**Source Match:**
- The four assumption ordering (lines 17-23) lists: 1. Randomness, 2. Fixed location, 3. Fixed variation, 4. Fixed distribution. NIST 1.2.5 lists consequences in sub-sections 1.2.5.1-1.2.5.4 ordered as: randomness, location, variation, distribution. The MDX follows the NIST consequence ordering, which differs from the assumption ordering in 1.2.1 (random, fixed distribution, fixed location, fixed variation). This is correct per the source being 1.2.5.
- Non-randomness consequences (lines 30-36) match NIST 1.2.5.1 exactly (5 items).
- Autocorrelation consequences (lines 38-44) match NIST 1.2.5.1 exactly (4 items).
- Non-fixed location consequences (lines 48-57) match NIST 1.2.5.2 exactly (6 items).
- Non-fixed variation consequences (lines 62-68) match NIST 1.2.5.3 exactly (4 items).
- Distributional consequences (lines 77-99) match NIST 1.2.5.4 with proper categorization (Distribution: 5 items, Model: 6 items, Process: 3 items).
- The introductory text about assumption-testing being a "framework for learning about the process" (line 16) matches NIST 1.2.5 accurately.
- The "primary goal" statement (line 15) matches NIST 1.2.5.

**Issues Found:**
1. (Minor) The "Remedial Actions" section (lines 102-120) is explicitly noted as "not part of Section 1.2.5, which covers only consequences." This is a correct and transparent editorial addition. The content about transformations, robust methods, non-parametric alternatives, and time-series methods is standard statistical practice and accurately described.
2. (Minor) NIST 1.2.5.2 includes the formula for the uncertainty of the mean: s(Ybar) = 1/sqrt(N(N-1)) * sqrt(sum((Yi - Ybar)^2)). The MDX omits this formula from the consequences list, instead saying "The usual formula for the uncertainty of the mean may be invalid and the numerical value optimistically small." This is an acceptable simplification.
3. (Minor) NIST 1.2.5.4 mentions specific case studies (airplane glass failure, uniform random numbers) as examples. The MDX omits these references. This is fine since those case studies may or may not have corresponding encyclopedia pages.

**Recommendations:**
- No changes needed. The Remedial Actions section is a valuable addition.

---

## Route Files Review

### [...slug].astro

**Issues Found:**
1. (Minor) Breadcrumb JSON-LD has `{ name: 'Foundations', url: 'https://patrykgolabek.dev/eda/' }` (line 40). The URL points to `/eda/` rather than `/eda/foundations/`. This should be `/eda/foundations/` for correct breadcrumb hierarchy.
2. (Minor) OG image path references `/open-graph/eda/foundations/${slug}.png` (line 31). These images may not exist. Verify that OG images are generated or fallback gracefully.
3. (Minor) `publishedDate` is hardcoded to `2026-02-25` (line 33). Consider making this dynamic or per-page.
4. (Minor) `useKatex={true}` is set for all foundations pages (line 35). Only `the-4-plot.mdx` and `when-assumptions-fail.mdx` use `InlineMath`. This is harmless but loads unnecessary CSS for pages that don't use KaTeX.

### index.astro

**Issues Found:**
1. No issues. The index page correctly filters by category, sorts by section number, and renders a card grid. The layout and SEO metadata are appropriate.

---

## Cross-Cutting Issues

### 1. Internal Link Consistency
All six pages use absolute paths (e.g., `/eda/techniques/histogram/`, `/eda/foundations/assumptions/`). These are consistent and should resolve correctly in the Astro router.

### 2. Breadcrumb Hierarchy Bug
The `[...slug].astro` route file has an incorrect breadcrumb URL for "Foundations" — it points to `/eda/` instead of `/eda/foundations/`. This affects structured data (JSON-LD) for all six foundations pages.

### 3. Original vs NIST Content
Several pages add editorial content beyond the NIST source (philosophy section in what-is-eda, remedial actions in when-assumptions-fail, explanatory paragraphs in problem-categories). All additions are factually correct, well-written, and enhance the educational value of the pages. They are clearly distinguishable from NIST-sourced content.

### 4. InlineMath Component
Used in `the-4-plot.mdx` and `when-assumptions-fail.mdx`. The component uses KaTeX server-side rendering (build-time) with `throwOnError: false`, which is a safe configuration. Formulas verified:
- `Y_i = f(X_1, \ldots, X_k) + E_i` — correct
- `Y_i` vs `Y_{i-1}` — correct
- `Y_i = A_0 + E_i` — correct
- `s / \sqrt{N}` — correct (simplified from NIST's `s_Ybar`)
- `y = \text{constant} + \text{error}` — correct
- `Y_t` and `Y_{t-k}` — correct

### 5. AnscombeQuartetPlot Component
The data values in the component match NIST eda16.htm exactly. The regression line (y = 3 + 0.5x) is correctly implemented. The component is build-time rendered (zero client JS), which is good for performance and SEO.

### 6. Missing Technique Links
Some techniques listed in problem-categories.mdx lack links: Control Charts, Least Squares Fitting, Profile Plot, Clustering, Discrimination/Classification, ARIMA Models. These are likely techniques that don't yet have dedicated pages in the encyclopedia.

---

## Severity Summary

- **Critical: 0**
- **Major: 0**
- **Minor: 12**
  1. what-is-eda.mdx: Missing key NIST insight about postponing model assumptions
  2. what-is-eda.mdx: Fewer graphical techniques listed than NIST 1.1.1
  3. the-4-plot.mdx: Section number in frontmatter (1.3.3.32) inconsistent with other foundations pages
  4. the-4-plot.mdx: Q13 formula slightly simplified (missing subscript)
  5. problem-categories.mdx: Complex Demodulation route may need verification for amplitude vs phase
  6. problem-categories.mdx: Several techniques listed as plain text (no links)
  7. when-assumptions-fail.mdx: Omits NIST 1.2.5.2 uncertainty formula
  8. [...slug].astro: Breadcrumb "Foundations" URL points to /eda/ instead of /eda/foundations/
  9. [...slug].astro: OG images may not exist for foundations pages
  10. [...slug].astro: publishedDate hardcoded
  11. [...slug].astro: KaTeX loaded for all foundations pages, not just those using math
  12. what-is-eda.mdx: Omits NIST 1.1.1's detailed list of graphical technique categories (raw data plotting, simple statistics plotting, positioning)

## Deployment Readiness

**PASS** — The foundations section is deployment-ready. All content is factually accurate, well-structured, and properly attributed to NIST sources. The minor issues identified are quality improvements that can be addressed post-launch.
