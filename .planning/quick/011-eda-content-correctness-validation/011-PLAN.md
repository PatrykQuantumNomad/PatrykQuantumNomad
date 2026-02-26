---
phase: quick
plan: 011
type: execute
wave: 1
depends_on: []
files_modified:
  - src/data/eda/pages/foundations/what-is-eda.mdx
  - src/data/eda/pages/foundations/the-4-plot.mdx
  - src/data/eda/pages/foundations/problem-categories.mdx
  - src/data/eda/pages/foundations/when-assumptions-fail.mdx
  - src/data/eda/pages/foundations/assumptions.mdx
  - src/data/eda/pages/foundations/role-of-graphics.mdx
  - src/data/eda/pages/reference/distribution-tables.mdx
  - src/data/eda/pages/reference/analysis-questions.mdx
  - src/data/eda/pages/reference/related-distributions.mdx
  - src/data/eda/pages/reference/techniques-by-category.mdx
  - src/data/eda/pages/case-studies/beam-deflections.mdx
  - src/data/eda/pages/case-studies/ceramic-strength.mdx
  - src/data/eda/pages/case-studies/cryothermometry.mdx
  - src/data/eda/pages/case-studies/fatigue-life.mdx
  - src/data/eda/pages/case-studies/filter-transmittance.mdx
  - src/data/eda/pages/case-studies/heat-flow-meter.mdx
  - src/data/eda/pages/case-studies/normal-random-numbers.mdx
  - src/data/eda/pages/case-studies/random-walk.mdx
  - src/data/eda/pages/case-studies/uniform-random-numbers.mdx
  - src/data/eda/techniques.json
  - src/data/eda/distributions.json
  - src/data/eda/datasets.ts
  - src/lib/eda/math/statistics.ts
autonomous: true
must_haves:
  truths:
    - "All statistical formulas and parameter descriptions in distributions.json are mathematically correct"
    - "All case study statistical values (means, std devs, test statistics, critical values) match NIST source data"
    - "All cross-references between techniques.json, distributions.json, and MDX pages use consistent naming"
    - "All prose is free of spelling errors, grammar issues, and broken sentences"
    - "Dataset metadata (sample sizes, variable descriptions, source attributions) is accurate"
  artifacts:
    - path: "src/data/eda/distributions.json"
      provides: "Verified distribution formulas and parameters"
    - path: "src/data/eda/techniques.json"
      provides: "Verified technique descriptions and cross-references"
    - path: "src/data/eda/pages/case-studies/*.mdx"
      provides: "Verified case study content with correct statistical values"
  key_links:
    - from: "distributions.json"
      to: "case-study MDX files"
      via: "distribution names and parameter symbols"
    - from: "techniques.json"
      to: "MDX cross-reference links"
      via: "slug-based URLs"
---

<objective>
Audit all EDA Visual Encyclopedia content for correctness and accuracy, fixing any errors found.

Purpose: Ensure all published statistical/mathematical content is factually accurate — incorrect statistical claims or formulas on a professional portfolio site damage credibility.

Output: Corrected content files with all errors fixed in-place.
</objective>

<context>
@src/data/eda/distributions.json
@src/data/eda/techniques.json
@src/data/eda/datasets.ts
@src/lib/eda/math/statistics.ts
@src/data/eda/pages/foundations/*.mdx
@src/data/eda/pages/case-studies/*.mdx
@src/data/eda/pages/reference/*.mdx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Audit and fix data files — distributions.json, techniques.json, datasets.ts, statistics.ts</name>
  <files>
    src/data/eda/distributions.json
    src/data/eda/techniques.json
    src/data/eda/datasets.ts
    src/lib/eda/math/statistics.ts
  </files>
  <action>
Read all four data files and audit for the following specific categories of errors. Fix any issues found in-place.

**distributions.json — Mathematical formula verification:**
- Verify all pdfFormula and cdfFormula LaTeX expressions are mathematically correct for each distribution
- Verify mean and variance expressions match standard statistical references
- Verify parameter names (symbol field) use standard notation
- Verify relatedDistributions entries reference valid distribution IDs that exist in the file
- Verify nistSection references are plausible (1.3.6.6.X numbering)
- Check the Birnbaum-Saunders (fatigue-life) PDF and CDF formulas carefully — these use phi/Phi notation which must be consistent
- Check the Tukey-Lambda PDF/CDF — these are defined via quantile function, verify the formulas are self-consistent
- Check that the power-normal PDF uses Phi(-x) not Phi(x) in the survival function form
- Check all LaTeX for balanced braces, correct use of \left/\right, and proper function names (\exp, \operatorname{erf}, etc.)

**techniques.json — Cross-reference and metadata verification:**
- Verify all relatedTechniques entries reference valid technique IDs that exist in the file
- Verify nistSection numbering is sequential and consistent (no gaps or duplicates in section numbers)
- Verify tier assignments are consistent (B = has variants/interactive plots, A = standard)
- Verify variantCount is 0 for all tier A techniques
- Check that descriptions accurately characterize each technique (no technique described as doing what another does)

**datasets.ts — Data accuracy verification:**
- Verify the normalRandom array has exactly 500 values (count the array)
- Verify the uniformRandom array has exactly 500 values (count the array)
- Verify the timeSeries (ZARR13) array has exactly 195 values
- Verify the beamDeflections (LEW) array has exactly 200 values
- Verify source comments cite correct NIST .DAT filenames and section numbers
- Verify the scatterData array is monotonically increasing in x

**statistics.ts — Algorithm correctness verification:**
- Verify the Silverman bandwidth formula uses the correct constant (0.9) and exponent (-0.2 = -1/5)
- Verify the autocorrelation function uses biased estimator (divides by c0, not by n-k)
- Verify the FFT implementation uses the standard Cooley-Tukey algorithm correctly (angle sign for forward transform)
- Verify the powerSpectrum uses Blackman-Tukey (correlogram) method as documented
- Verify the normalQuantile rational approximation constants match the Beasley-Springer-Moro algorithm

For each error found, fix it directly in the file. Keep a mental tally of all changes made.
  </action>
  <verify>
Run `npx astro check 2>&1 | tail -20` to confirm no TypeScript errors were introduced. Run `node -e "const d = require('./src/data/eda/distributions.json'); console.log(d.length + ' distributions, all have id+title+pdfFormula+mean+variance'); d.forEach(x => { if(!x.id||!x.pdfFormula||!x.mean||!x.variance) throw new Error('Missing field in '+x.id) })"` to validate JSON structure.
  </verify>
  <done>
All data files audited. Mathematical formulas verified against standard references. Cross-references validated for consistency. Dataset array lengths verified. Any errors found have been corrected in-place.
  </done>
</task>

<task type="auto">
  <name>Task 2: Audit and fix all MDX content — foundations, case studies, and reference pages</name>
  <files>
    src/data/eda/pages/foundations/what-is-eda.mdx
    src/data/eda/pages/foundations/the-4-plot.mdx
    src/data/eda/pages/foundations/problem-categories.mdx
    src/data/eda/pages/foundations/when-assumptions-fail.mdx
    src/data/eda/pages/foundations/assumptions.mdx
    src/data/eda/pages/foundations/role-of-graphics.mdx
    src/data/eda/pages/reference/distribution-tables.mdx
    src/data/eda/pages/reference/analysis-questions.mdx
    src/data/eda/pages/reference/related-distributions.mdx
    src/data/eda/pages/reference/techniques-by-category.mdx
    src/data/eda/pages/case-studies/beam-deflections.mdx
    src/data/eda/pages/case-studies/ceramic-strength.mdx
    src/data/eda/pages/case-studies/cryothermometry.mdx
    src/data/eda/pages/case-studies/fatigue-life.mdx
    src/data/eda/pages/case-studies/filter-transmittance.mdx
    src/data/eda/pages/case-studies/heat-flow-meter.mdx
    src/data/eda/pages/case-studies/normal-random-numbers.mdx
    src/data/eda/pages/case-studies/random-walk.mdx
    src/data/eda/pages/case-studies/uniform-random-numbers.mdx
  </files>
  <action>
Read every MDX file and audit for the following categories of errors. Fix any issues found in-place.

**Textual correctness (all pages):**
- Spelling errors (proper nouns like Tukey, Anscombe, Birnbaum, Saunders, Levene, Bartlett, Grubbs, Kolmogorov, Smirnov, Josephson, Zarr, Lew, Mavrodineaunu must be spelled correctly)
- Grammar issues (subject-verb agreement, dangling modifiers, missing articles)
- Broken or incomplete sentences
- Inconsistent use of em-dashes vs hyphens (MDX uses -- for em-dashes, verify consistency)
- Inconsistent use of American vs British English (should be American)

**Statistical accuracy (case study pages):**
- Verify all summary statistics tables quote correct values. Cross-check:
  - Normal random: mean -0.0029, std dev 1.0210, n=500
  - Uniform random: mean 0.5078, std dev 0.2943, n=500
  - Random walk: mean 3.2167, std dev 2.0787, n=500
  - Cryothermometry: mean 2898.562, std dev 1.305, n=700
  - Beam deflections: mean -177.435, std dev 277.332, n=200
  - Heat flow meter: mean 9.261460, std dev 0.022789, n=195
  - Filter transmittance: mean 2.0019, std dev 0.0004, n=50
  - Ceramic strength: mean 650.0773, std dev 74.6383, n=480
  - Fatigue life: mean 1401, std dev 389, n=101
- Verify all test statistic values, critical values, and conclusions are internally consistent (e.g., if |Z| > critical value, the conclusion must say "reject")
- Verify confidence interval calculations are arithmetically correct
- Verify NIST section references in frontmatter match the content described

**Cross-reference verification (all pages):**
- Verify all internal links use correct URL patterns:
  - Techniques: /eda/techniques/{slug}/ (slug must exist in techniques.json)
  - Quantitative: /eda/quantitative/{slug}/ (slug must exist in techniques.json with category "quantitative")
  - Distributions: /eda/distributions/{slug}/ (slug must exist in distributions.json)
  - Foundations: /eda/foundations/{slug}/ (slug must match filename without .mdx)
  - Reference: /eda/reference/{slug}/ (slug must match filename without .mdx)
  - Case studies: /eda/case-studies/{slug}/ (slug must match filename without .mdx)
- Check that chi-square-goodness-of-fit link in assumptions.mdx uses the correct slug (chi-square-gof, not chi-square-goodness-of-fit)

**Reference page accuracy (distribution-tables.mdx):**
- Verify Normal critical values: z_0.05 = 1.645, z_0.025 = 1.960, z_0.01 = 2.326, z_0.005 = 2.576
- Verify t-distribution critical values for key df (1, 2, 5, 10, 20, 30, 60, 120, inf) against standard tables
- Verify Chi-square critical values for df = 1, 2, 5, 10, 20, 30, 50, 100
- Verify F-distribution critical values at alpha = 0.05

**Consistency between related-distributions.mdx and distributions.json:**
- Verify all distribution names and links in the related-distributions page reference valid slugs from distributions.json
- Verify the mathematical relationships stated are correct (e.g., Chi-Square(k) = Gamma(k/2, 2) is correct; Exponential = Gamma(1, beta) is correct if the Gamma parameterization matches)

For each error found, fix it directly in the file. After fixing, add a brief comment in the plan summary about what was changed.
  </action>
  <verify>
Run `npx astro check 2>&1 | tail -30` to confirm no Astro/TypeScript compilation errors. Run `grep -rn "chi-square-goodness-of-fit" src/data/eda/pages/` to confirm no broken slugs remain (should return 0 results; the correct slug is chi-square-gof).
  </verify>
  <done>
All 19 MDX files audited for textual correctness, statistical accuracy, and cross-reference validity. Every numerical value in case study tables verified for internal consistency. All cross-reference links validated against technique/distribution slug inventories. Any errors found have been corrected in-place. A summary of all changes is documented.
  </done>
</task>

</tasks>

<verification>
1. `npx astro check` completes without errors
2. `npx astro build 2>&1 | tail -5` completes successfully (site builds)
3. All distribution formulas in distributions.json are mathematically valid LaTeX
4. All case study statistical values are internally consistent (test stat vs critical value vs conclusion)
5. All internal links reference valid slugs
</verification>

<success_criteria>
- Zero mathematical/statistical errors remain in distributions.json formulas
- Zero factual errors in case study summary statistics or test conclusions
- Zero broken cross-reference links between pages
- Zero spelling errors in proper nouns (statistician names, NIST references)
- Site builds successfully with no compilation errors
</success_criteria>

<output>
After completion, create `.planning/quick/011-eda-content-correctness-validation/011-SUMMARY.md` documenting:
- Total number of errors found and fixed, categorized by type
- List of files modified with brief description of changes
- Any areas where content accuracy could not be verified (e.g., values that would require checking against actual NIST .DAT files)
</output>
