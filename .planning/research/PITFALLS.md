# Pitfalls Research: EDA Graphical Techniques NIST Parity

**Domain:** Enhancing all 29 existing EDA graphical technique pages with NIST section depth -- adding Python code, validated SVGs, KaTeX formulas, case study cross-links, and 3-4 new content sections per page within an Astro 5 static site currently at 951 pages with Lighthouse 90+ on mobile
**Researched:** 2026-02-27
**Confidence:** HIGH (based on direct codebase analysis of existing technique-content.ts at 64KB/380 lines for 29 entries, quantitative-content.ts at 55KB/744 lines for 18 entries with KaTeX+Python already proven, technique-renderer.ts at 35KB with all 29 SVG generators operational, [slug].astro page structure, and v1.9 case study pitfalls experience)

**Context:** This is a SUBSEQUENT milestone. The v1.8 EDA Visual Encyclopedia and v1.9 Case Study Deep Dive are complete. The 29 graphical technique pages currently have 5 content fields each (definition, purpose, interpretation, assumptions, nistReference) stored in technique-content.ts. The 18 quantitative technique pages already have the target architecture: KaTeX formulas, Python code examples, and richer prose via quantitative-content.ts. This milestone extends the graphical technique pages to match that depth. The TechniquePage.astro layout already has named slots for `plot`, `description`, `formula`, `code`, and `interpretation`. The quantitative [slug].astro page is the proven reference implementation for the formula+code pattern.

**Key scale factors:**
- 29 technique entries in technique-content.ts must grow from ~5 fields to ~12+ fields
- technique-content.ts will grow from 64KB to an estimated 200-280KB
- Each page gains KaTeX formulas (new -- graphical pages currently have zero)
- Each page gains Python code (new -- only quantitative pages have this)
- Each page gains case study cross-links (new section)
- SVG plots need visual validation against NIST reference images
- All 29 pages load simultaneously during build

---

## Critical Pitfalls

### Pitfall 1: technique-content.ts Grows to 250KB+ and Becomes Unmaintainable

**What goes wrong:**
technique-content.ts currently has 29 entries with 5 string fields each at 64KB. Adding 7+ new fields per entry (formulas array with tex+label+explanation, pythonCode string, sampleOutput string, relatedCaseStudies array, softwareNotes string, questions array, examples array) will grow each entry from ~1.3KB average to ~5-8KB. At 29 entries, the file grows to 145-232KB of raw TypeScript string content. The quantitative-content.ts precedent is instructive: 18 entries with formulas+code at 55KB means ~3KB per entry -- and graphical techniques need MORE content (longer interpretation sections, more variant discussion, plot-specific examples). A single 250KB TypeScript file with string literals is unnavigable in any editor, impossible to diff meaningfully in git, and causes IDE autocompletion lag.

**Why it happens:**
The original architecture placed all technique content in a single file for discoverability and type safety. At 5 fields per entry this was reasonable. The quantitative-content.ts followed the same pattern at 18 entries. But 29 entries with 12+ fields each crosses the practical threshold. More critically, Python code examples contain multiline strings with indentation that conflict with the surrounding TypeScript template literals, making the file a formatting nightmare when using backtick strings inside backtick strings.

**How to avoid:**
1. **Split technique-content.ts into per-technique files** before adding new content. Create `src/lib/eda/technique-content/autocorrelation-plot.ts`, `src/lib/eda/technique-content/bihistogram.ts`, etc., each exporting a single `TechniqueContent` object. Create a barrel `src/lib/eda/technique-content/index.ts` that re-exports and provides the `getTechniqueContent()` lookup. This is a mechanical refactor with zero behavior change.
2. **Alternatively, split into category groups** if per-file feels too granular: time-series techniques (autocorrelation, lag, run-sequence, spectral, complex-demodulation), distribution techniques (histogram, box-plot, normal-probability, probability, qq, ppcc, weibull, box-cox-normality), comparison techniques (bihistogram, block, bootstrap, youden, mean, std-deviation), multivariate techniques (scatter, scatterplot-matrix, conditioning, contour, star), composite techniques (4-plot, 6-plot), and regression techniques (linear-plots, box-cox-linearity, doe-plots). Six files of 30-40KB each.
3. **Store Python code in separate .py files** rather than inline TypeScript strings. Create `src/lib/eda/technique-content/code/autocorrelation-plot.py` and import as raw text via Vite's `?raw` import or read at build time. This keeps Python properly syntax-highlighted in the editor and avoids backtick-in-backtick escaping issues.

**Warning signs:**
- IDE autocomplete takes >2 seconds when editing technique-content.ts
- Git diffs for a single technique's content changes show 200+ lines because the file is reformatted
- Python code indentation breaks because of template literal nesting
- Developers avoid editing the file and instead hardcode content in the .astro page

**Phase to address:**
Phase 1 (Infrastructure) -- split the file BEFORE adding any new content fields.

---

### Pitfall 2: Python Code Examples with Wrong API or Incorrect Statistical Output

**What goes wrong:**
Adding matplotlib/seaborn Python code to 29 technique pages means 29 independent code examples that must (a) use correct, current API calls, (b) produce the correct statistical plot for that specific technique, (c) use the correct dataset or demonstrate with synthetic data that exhibits the right pattern, and (d) actually run without error if a reader copies the code. LLM-generated Python code is notoriously confident but subtly wrong about statistical plotting APIs. Common errors include: using `plt.acorr()` when `statsmodels.graphics.tsaplots.plot_acf()` is the standard for autocorrelation, using deprecated `seaborn.distplot()` instead of `seaborn.histplot()`, using `vert=True` (deprecated in matplotlib 3.10) instead of `orientation='vertical'` on boxplots, and confusing `scipy.stats.probplot()` (which returns a tuple) with a direct plotting function.

**Why it happens:**
matplotlib has extensive API deprecation cycles. The `vert` parameter on boxplot/bxp was deprecated in 3.10 (2024) and replaced with `orientation`. Seaborn deprecated `distplot` in 0.11 (2020) and removed it in 0.14 (2024), replacing it with `histplot` and `displot`. `plt.acorr()` plots raw autocorrelation without confidence bounds, while `plot_acf()` from statsmodels includes them -- the NIST-equivalent output requires confidence bounds. The code examples cannot be tested at build time (they are Python, the build is Node.js), so errors are invisible until a reader reports them.

**How to avoid:**
1. **Pin specific library versions in every code example.** Each code block should start with a comment: `# Requires: matplotlib>=3.9, numpy>=1.26, scipy>=1.12, statsmodels>=0.14`. This prevents readers from running with incompatible versions.
2. **Use only the current API surface.** Specifically:
   - Histogram: `plt.hist()` or `sns.histplot()` (NOT `sns.distplot()`)
   - Box plot: `plt.boxplot()` with `orientation='vertical'` (NOT `vert=True`)
   - Autocorrelation: `from statsmodels.graphics.tsaplots import plot_acf` (NOT `plt.acorr()`)
   - Probability plot: `scipy.stats.probplot(data, plot=plt)` (returns tuple AND plots when plot= is provided)
   - Q-Q plot: `from statsmodels.graphics.gofplots import qqplot` or `scipy.stats.probplot()`
   - Spectral plot: `plt.psd()` or `scipy.signal.welch()` + manual plot
3. **Create a validation script** (`scripts/validate-python-examples.sh`) that extracts all Python code blocks from technique-content files and runs them in a Docker container or virtual environment. This can run in CI nightly, not on every build.
4. **Use the quantitative-content.ts code examples as the proven template.** The 18 existing Python examples are already working with the correct API patterns. Copy the import blocks and adapt.
5. **For technique-specific gotchas:**
   - Lag plot: `plt.scatter(data[:-lag], data[lag:])` manually is safer than `pandas.plotting.lag_plot()` which has inconsistent lag parameter behavior
   - Star/radar plot: matplotlib has no built-in radar plot; use `plt.subplot(polar=True)` and manual angle computation
   - Contour plot: `plt.contour()` requires meshgrid data; `plt.tricontour()` for scattered data
   - 4-plot and 6-plot: must compose subplots with `fig, axes = plt.subplots(2, 2)` -- getting the subplot indices right for NIST's specific arrangement is error-prone

**Warning signs:**
- `DeprecationWarning` messages when running an example
- A code example imports `seaborn` but never uses it (copy-paste artifact)
- The plot output looks nothing like the build-time SVG on the same page
- A code example uses `plt.show()` at the end (harmless but unnecessary in a documentation context; replace with `plt.savefig()` or `plt.tight_layout()`)

**Phase to address:**
Phase 1 (Infrastructure) -- establish the Python code template with correct imports and version pins. Phase 2+ (Content phases) -- each batch of technique pages uses the template.

---

### Pitfall 3: KaTeX Formula Rendering Breaks on Graphical Technique Pages

**What goes wrong:**
The 29 graphical technique pages currently do NOT use KaTeX at all. The TechniquePage.astro component passes `useKatex={false}` by default, meaning the KaTeX CSS (`/styles/katex.min.css`) is not loaded on these pages. Adding formulas requires: (1) extending the [slug].astro page to pass `useKatex={true}` when formulas exist, (2) adding `katex.renderToString()` calls in the frontmatter, and (3) rendering the resulting HTML via `set:html`. If step (1) is forgotten, the formulas render as raw HTML spans without the KaTeX CSS, producing invisible or garbled math symbols. This is a silent failure -- the build succeeds, the page loads, but every formula looks broken.

**Why it happens:**
The quantitative [slug].astro page always sets `useKatex={true}` because every quantitative page has formulas. But the graphical [slug].astro page conditionally includes formulas only for techniques that have them. The developer adds formula content to technique-content.ts but forgets to update the `useKatex` prop in the [slug].astro page. Or they update it to always be true, which loads 350KB of KaTeX fonts on the 10+ graphical pages that have zero formulas (waste). The KaTeX CSS includes ~25 font files referenced via `@font-face`, and loading them on pages that never render a formula is a Lighthouse performance penalty.

**How to avoid:**
1. **Make `useKatex` data-driven.** In the graphical [slug].astro page, compute it from the content: `const useKatex = (content?.formulas?.length ?? 0) > 0;`. This eliminates the manual toggle entirely. The quantitative page already does this implicitly (all quantitative pages have formulas).
2. **Add the formula rendering pattern from quantitative [slug].astro.** The proven pattern is:
   ```typescript
   const renderedFormulas = content?.formulas.map(f => ({
     ...f,
     html: katex.renderToString(f.tex, { displayMode: true, throwOnError: false }),
   })) ?? [];
   ```
   Copy this exactly into the graphical [slug].astro frontmatter.
3. **Conditionally load KaTeX CSS using the same `useKatex` prop** that is already supported by EDALayout.astro. The plumbing exists; only the graphical page needs to use it.
4. **Avoid loading KaTeX on pages with zero formulas.** Not all 29 graphical techniques need formulas. Simple visual techniques like star-plot, block-plot, and youden-plot may only need textual descriptions. Only load KaTeX CSS when the technique actually has formula content. The data-driven approach in point 1 handles this automatically.

**Warning signs:**
- Formula HTML appears in the page source as `<span class="katex">...</span>` but no KaTeX CSS is loaded -- formulas render as garbled inline spans
- Lighthouse flags unused CSS (katex.min.css loaded on pages without math)
- KaTeX fonts appear in the network waterfall for technique pages that have no formulas
- Formulas render correctly in dev but break in production if the CSS path differs

**Phase to address:**
Phase 1 (Infrastructure) -- update the graphical [slug].astro page to support conditional KaTeX rendering before content is added.

---

### Pitfall 4: SVG Validation Against NIST Reference Is Subjective and Unscalable

**What goes wrong:**
The milestone requires "validating SVGs against NIST originals." The NIST handbook shows static GIF/PNG images of plots generated by DATAPLOT software from the 1990s. The build-time TypeScript SVG generators produce modern, styled, interactive-ready SVGs with different colors, fonts, axis styling, and data resolution. "Validation" becomes a subjective visual comparison where the reviewer must mentally map between two very different visual styles to confirm the statistical pattern matches. At 29 techniques, this manual visual comparison is tedious, error-prone, and not reproducible. Different reviewers may disagree on whether a KDE curve in the SVG "matches" the NIST histogram shape.

**Why it happens:**
There is no automated way to compare a build-time SVG (vector, specific color palette, custom fonts) against a NIST reference GIF (raster, DATAPLOT styling, aliased). Pixel-level comparison tools (BackstopJS, Cypress visual regression) require screenshots of both, which means rendering the SVG in a browser -- adding a browser-based test infrastructure that does not exist in the current build pipeline. The alternative is manual review, which does not scale to 29 techniques and is not repeatable.

**How to avoid:**
1. **Redefine "validation" as statistical pattern validation, not visual pixel matching.** The SVG does not need to look like the NIST image. It needs to show the same statistical pattern (e.g., the histogram shows a right-skewed distribution, the autocorrelation decays exponentially from lag 1). Define a checklist per technique:
   - Does the SVG show the correct plot type? (axes, data representation)
   - Does the SVG show the correct statistical pattern for the default dataset?
   - Are axis labels, title, and reference lines present and correct?
   - Do Tier B variant SVGs show visually distinct patterns?
2. **Create a visual audit page** at `/eda/dev/svg-audit/` (dev-only, excluded from production build) that renders all 29 default SVGs in a grid, side by side with NIST reference images loaded via `<img>` from a local reference directory. This allows rapid visual comparison without opening 29 separate pages.
3. **Use unit tests for statistical correctness** rather than visual comparison. Test that the autocorrelation function computed in `technique-renderer.ts` matches the expected values for the known dataset. Test that the histogram binning produces the expected bin counts. This catches computational errors without requiring visual comparison.
4. **Accept that the SVGs will never match NIST pixel-for-pixel.** The value is pedagogical equivalence, not visual reproduction. Document this explicitly in the milestone scope to prevent scope creep into visual regression testing infrastructure.

**Warning signs:**
- Reviewer spends >5 minutes per technique comparing SVG to NIST image
- Disagreements about whether a plot "matches" the NIST reference
- Someone proposes adding Playwright or Cypress for visual regression testing (massive scope creep for 29 static SVGs)
- A technique SVG shows the WRONG statistical pattern (e.g., autocorrelation for random data when it should show autocorrelation for autoregressive data) -- this is a real bug, not a styling difference

**Phase to address:**
Phase 1 (Infrastructure) -- create the SVG audit page and define the validation checklist. Phase 2+ (Content phases) -- use the checklist during review, not ad-hoc visual comparison.

---

### Pitfall 5: Content Quality Drift Across 29 Technique Pages Written Sequentially

**What goes wrong:**
Writing 7+ new content sections for 29 techniques means producing ~200+ individual content fields. When written sequentially over multiple sessions, the quality, depth, and style drift. The first 5 techniques get careful, NIST-verified descriptions with precise statistical language. Techniques 15-20 get shorter, more generic descriptions as writer fatigue sets in. Techniques 25-29 use copy-paste templates with find-replace that introduce errors (e.g., a box-cox-normality description that accidentally says "linearity" because it was copied from box-cox-linearity). The interpretation sections become formulaic ("The horizontal axis shows X and the vertical axis shows Y"), losing the technique-specific insight that makes the content valuable.

**Why it happens:**
29 techniques is a large batch for content creation. Each technique requires understanding its specific statistical purpose, reading the NIST source, writing accurate prose, writing a correct Python example, identifying appropriate formulas, and linking to relevant case studies. At 30-60 minutes per technique, the full batch is 15-30 hours of focused writing. Maintaining consistent quality across this duration is unrealistic without structure. The current technique-content.ts already shows minor drift: some interpretation sections are 3 sentences, others are 8. Some mention variant patterns, others do not.

**How to avoid:**
1. **Process techniques in categorical batches of 4-6** rather than all 29 sequentially. Group by statistical domain: time-series techniques first (5 techniques sharing similar concepts), then distribution techniques (8 techniques), etc. Within each batch, the concepts reinforce each other and the writer maintains domain context.
2. **Define a content template with mandatory and optional fields** before writing any content:
   - **Mandatory for all 29:** definition (2-3 sentences), purpose (2-3 sentences), interpretation (3-5 sentences), assumptions (2-3 sentences), nistReference
   - **Mandatory for techniques with formulas:** formulas array with tex, label, explanation
   - **Mandatory for all 29:** pythonCode with version-pinned imports
   - **Optional:** questions array, examples array, softwareNotes
   - **Mandatory for all 29:** relatedCaseStudies (even if empty array -- explicit "no case study" is better than omission)
3. **Review each batch before starting the next.** Re-read the first batch's content before writing the second. This catches drift early.
4. **Use the NIST source as the primary content driver, not LLM generation.** For each technique: (a) read the NIST page, (b) extract the key points into the template fields, (c) rewrite in the established voice. This grounds every entry in authoritative source material rather than generative fluency.
5. **Cross-check field lengths.** After all 29 are written, compute the character count of each field across all techniques. Flag any that are more than 2x shorter or longer than the median. These are likely either incomplete (too short) or verbose (too long).

**Warning signs:**
- The last 5 techniques all have identical interpretation structure ("The horizontal axis shows... The vertical axis shows... Points above the line indicate... Points below the line indicate...")
- A technique's `purpose` field mentions the wrong technique name (copy-paste error)
- Python code examples across 3+ techniques use identical synthetic data generation code with only the plot function changed
- Formula `explanation` fields become one-word labels instead of sentences

**Phase to address:**
Every content phase -- batch review gates between groups. Phase 1 defines the content template and review checklist.

---

### Pitfall 6: Build Time Regression from 29 Pages Getting 3-4x Larger

**What goes wrong:**
Each graphical technique page currently renders: 1 SVG plot (or variant set for Tier B), 4 prose sections, and a related techniques sidebar. After enhancement, each renders: 1+ SVG plots, 4 prose sections expanded by ~50%, 2-4 KaTeX formula blocks, 1 Python code block via astro-expressive-code (Shiki highlighting), 1 case study cross-links section, and potentially an examples section. The KaTeX `renderToString()` calls add ~1-5ms per formula per page. The Shiki syntax highlighter for Python code adds a meaningful per-page cost. astro-expressive-code optimized parallel highlighter initialization in recent versions, but each Python code block still requires tokenization and HTML generation. Across 29 pages, this adds approximately: 29 pages * 3 formulas * 3ms = ~260ms for KaTeX, 29 pages * 1 code block * ~50-100ms = 1.4-2.9 seconds for Shiki. The SVG generation itself is already paid. The total regression is estimated at 2-4 seconds -- noticeable but not catastrophic for a site that already builds 951 pages.

**Why it happens:**
astro-expressive-code uses Shiki under the hood, which loads grammar files and themes into memory. The Python grammar is relatively large. While Shiki reuses the highlighter instance across pages, each code block still requires O(n) tokenization where n is the code length. For 29 code blocks averaging 30 lines each, this is ~870 lines of Python to tokenize. Combined with HTML generation and wrapper element creation, each code block adds measurable latency.

**How to avoid:**
1. **Measure baseline build time BEFORE adding any content.** Run `time npx astro build` three times and record the median. Set a budget: build must not exceed baseline + 5 seconds after all 29 techniques are enhanced.
2. **Add Python code blocks in a dedicated phase** (not interleaved with prose) so the build time impact can be measured in isolation.
3. **Keep Python examples concise: 20-35 lines maximum.** The quantitative pages' examples average ~25 lines. Resist the urge to make graphical technique examples more elaborate (e.g., including data generation, plot customization, subplot arrangement). The example should demonstrate the technique, not be a comprehensive tutorial.
4. **If build regression exceeds 5 seconds**, investigate whether the expressive-code integration has a cache or precompilation option. Also verify that `shikiConfig.experimentalThemes` is not loading unnecessary themes.
5. **The OG image generation is already cached** via content-hash caching. Adding content to existing pages changes the hash, triggering OG regeneration for all 29 pages on the first build. This is a one-time cost, not a recurring one. But the first post-enhancement build will be slower than subsequent builds.

**Warning signs:**
- Build time increases by more than 8 seconds after all techniques are enhanced
- `astro build` output shows technique pages taking >500ms each (currently ~50-100ms each)
- Total build exceeds 3 minutes (current baseline is likely 1.5-2.5 minutes for 951 pages)
- Memory usage spikes during technique page generation (Shiki grammar loading)

**Phase to address:**
Phase 1 (Infrastructure) -- record baseline build time. Each content phase -- measure after completion. Final phase -- verify total regression within budget.

---

### Pitfall 7: Case Study Cross-Links Go Stale as Case Studies and Techniques Evolve

**What goes wrong:**
Each graphical technique page will list related case studies: "See this technique applied in the [Random Walk](/eda/case-studies/random-walk/) and [Beam Deflections](/eda/case-studies/beam-deflections/) case studies." These are currently 10 case studies, and the technique-to-case-study mapping must be maintained manually. When a new case study is added or a case study is renamed/restructured, the cross-links in 29 technique pages become stale. The reverse is also true: case studies link to technique pages, and technique pages link to case studies, creating a bidirectional dependency that is easy to break.

**Why it happens:**
Cross-links are stored as static strings in technique-content.ts rather than being computed from a central mapping. If the random-walk case study slug changes to `random-walk-analysis`, every technique that references it must be updated. With 29 technique pages and 10 case studies, the cross-reference matrix has up to 290 potential links. No build-time validation exists to verify that case study slugs in technique-content references match actual case study file names.

**How to avoid:**
1. **Store the case-study-to-technique mapping in a single data file** (`src/data/eda/case-study-techniques.json`) that maps case study slugs to the technique slugs they demonstrate. The graphical [slug].astro page computes cross-links by reversing this mapping: "Which case studies reference this technique?" This eliminates string duplication and makes the mapping auditable.
2. **Validate cross-links at build time.** In the graphical [slug].astro `getStaticPaths()`, load the case study collection and verify that every case study slug referenced in the mapping actually exists. Log warnings for broken references.
3. **If a centralized mapping is too much infrastructure**, at minimum store the `relatedCaseStudies` as an array of slugs (not full URLs) in technique-content, and resolve them to full URLs in the page template using the same `techniqueUrl()` pattern already used for related techniques.
4. **Add a link validation step** to the milestone's final verification phase, similar to the quick task 011 approach that found 5 broken links in case study MDX files.

**Warning signs:**
- A technique page links to `/eda/case-studies/normal-random/` instead of `/eda/case-studies/normal-random-numbers/` (slug mismatch)
- A new case study is added but no technique pages reference it (orphaned case study)
- Two technique pages link to different case studies for the same statistical concept (inconsistency)

**Phase to address:**
Phase 1 (Infrastructure) -- create the mapping data file and resolution logic. Every content phase -- verify links resolve correctly.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Keep all content in one technique-content.ts file | No refactoring needed; single import | 250KB+ file is unnavigable; git diffs are massive; Python strings lose syntax highlighting | Never for this milestone -- split before adding content |
| Inline Python code as template literal strings in .ts | No new file infrastructure; single source of truth | Backtick-in-backtick escaping breaks indentation; no syntax highlighting in editor; hard to validate Python without extracting it first | Acceptable for short code (< 15 lines). For 20+ line examples, use separate .py files with raw import |
| Copy formulas from quantitative-content.ts for overlapping techniques (e.g., autocorrelation formula used in both autocorrelation-plot and autocorrelation quantitative pages) | Faster authoring; each page is self-contained | Duplicate formula definitions drift when one is updated but not the other; inconsistent tex notation | Acceptable if the formula is technique-specific. For shared formulas (sample mean, standard deviation), create a `shared-formulas.ts` module that both content files import |
| Add `useKatex={true}` to ALL 29 graphical pages unconditionally | Simple; no conditional logic needed | ~10 pages with zero formulas load 350KB+ of KaTeX fonts for nothing; Lighthouse performance penalty on those pages | Never -- the conditional pattern already exists in the codebase; use it |
| Write all 29 Python examples using only matplotlib (no seaborn, no statsmodels) | Fewer dependencies to document; simpler install instructions | Missing the idiomatic approach for many techniques (seaborn's `histplot`, statsmodels' `plot_acf`, scipy's `probplot`); readers expect modern Python ecosystem usage | Never -- use the best-fit library for each technique, matching what working data scientists actually use |
| Skip the SVG audit page and rely on individual page review | No new infrastructure needed | 29 individual page reviews take 5-10 minutes each; inconsistencies between technique SVGs are invisible without side-by-side comparison | Acceptable for initial content phases if time is tight. Must be done before final verification phase. |

## Integration Gotchas

Common mistakes when adding formula+code sections to existing graphical technique pages.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| KaTeX CSS loading on graphical pages | Adding `useKatex={true}` as a hardcoded prop instead of computing from content | Compute: `const useKatex = (content?.formulas?.length ?? 0) > 0;` and pass dynamically. The EDALayout.astro already conditionally loads the CSS based on this prop. |
| katex.renderToString() in graphical [slug].astro | Forgetting to import katex in the frontmatter -- build fails with "katex is not defined" | Add `import katex from 'katex';` to the graphical [slug].astro frontmatter. The quantitative [slug].astro already has this import as a reference. |
| Python code rendering via Code component | Importing `Code` from `astro-expressive-code/components` but forgetting to pass `lang="python"` | Always pass `lang="python"` explicitly. Without it, the code renders as plain text with no syntax highlighting. The quantitative [slug].astro has the working pattern: `<Code code={content.pythonCode} lang="python" />` |
| TechniqueContent interface extension | Adding new fields to the interface but not updating all 29 entries -- TypeScript errors for missing required fields | Make new fields optional (`formulas?: Array<...>`, `pythonCode?: string`) and check for existence in the template with nullish coalescing. This allows incremental content addition across multiple phases. |
| New content slots in TechniquePage.astro | TechniquePage already has `<slot name="formula" />` and `<slot name="code" />` but they are unused by graphical pages. Adding content to these slots works immediately. The mistake is creating NEW slots instead of using existing ones. | Use the existing named slots. The template is already designed for this expansion. Check TechniquePage.astro before adding any new slot declarations. |
| Case study cross-link URLs | Linking to `/eda/case-studies/heat-flow/` instead of `/eda/case-studies/heat-flow-meter/` (slug mismatch from case study file name) | Check the actual MDX file names in `src/data/eda/pages/case-studies/` before writing any cross-link. The file name IS the slug. |
| String.raw for KaTeX tex strings | Using regular template literals for tex strings, causing `\frac` and `\sum` to be interpreted as escape sequences | Always use `String.raw` for tex content, exactly as quantitative-content.ts does: `tex: String.raw\`\\bar{x} = \\frac{1}{n}\\sum_{i=1}^{n} x_i\`` |

## Performance Traps

Patterns that work at the current scale but may degrade as technique pages grow 3-4x in content.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| KaTeX CSS loaded on pages without formulas | Lighthouse flags render-blocking CSS; WOFF2 font requests for ~25 KaTeX fonts appear in network tab on pages with no math | Data-driven `useKatex` prop computed from content.formulas.length | Immediate -- any page loading KaTeX CSS unnecessarily loses 5-10 Lighthouse points on performance |
| All 29 technique SVGs re-rendered on every build even if content did not change | Build time increases linearly with technique count; no caching for SVG output | SVGs are generated from deterministic functions with fixed datasets -- the output is identical across builds. Consider adding a build-cache layer that hashes the generator function + dataset and skips re-rendering if unchanged. | Not a problem until technique count exceeds ~50 or SVG generation becomes more complex. At 29 techniques, the SVG generation is <2 seconds total. |
| astro-expressive-code Shiki highlighter initialization for Python | First Python code block loads the Python grammar; subsequent blocks reuse it. But if the build processes pages in random order, the grammar load may happen multiple times in parallel workers. | Expressive-code already fixed this: "async tasks like creating syntax highlighters are never started multiple times in parallel." Verify by checking build logs for duplicate grammar loading messages. | Not expected to break. astro-expressive-code has explicit parallel-safe initialization since v0.38+. |
| Large HTML output per page from inline SVGs + KaTeX + code blocks | Page HTML grows from ~15KB to ~50-80KB; FCP increases; Lighthouse Content metrics may degrade | Inline SVGs are already the pattern. KaTeX renders to compact HTML. Code blocks produce well-structured HTML. The risk is cumulative: 5KB SVG + 3KB KaTeX HTML + 8KB code HTML + 15KB prose = 31KB of content HTML per page. Combined with layout HTML, total page could reach 60-80KB. | Not a problem until page HTML exceeds 100KB. Monitor with `ls -la dist/eda/techniques/*/index.html` after build. |
| OG image cache invalidation on first post-enhancement build | All 29 technique OG images regenerate because content-hash changed; adds 29 * ~2-3 seconds = ~60-90 seconds to first build | Expected behavior; subsequent builds reuse cache. Not a trap, but worth knowing: the first build after content enhancement will be measurably slower. | One-time cost per content change cycle. Not a recurring problem. |

## UX Pitfalls

Common user experience mistakes when adding NIST-depth content to graphical technique pages.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Adding formulas to technique pages without visual differentiation from prose | Formulas appear inline in the middle of paragraphs, making the page feel like a textbook rather than a practical reference | Use the proven pattern from quantitative pages: dedicated "Formulas" section with `<h2>`, each formula in its own block with label, rendered display-mode KaTeX, and explanation paragraph beneath |
| Python code examples that are too long (50+ lines) | Reader cannot see the essential technique call; boilerplate drowns the signal | Keep examples to 20-35 lines: imports (3-4 lines), data setup (3-5 lines), core plot call (3-10 lines), customization (3-5 lines), output (2 lines). The quantitative pages' examples are the benchmark. |
| Case study cross-links that say "See case study X" without explaining WHY | Reader does not know if the linked case study is relevant to their current problem | Each cross-link should explain what the case study demonstrates for this technique: "The [Random Walk](/eda/case-studies/random-walk/) case study shows how the autocorrelation plot reveals severe serial dependence in a non-stationary process." |
| Inconsistent section ordering across the 29 technique pages | Reader learns the page structure on one technique, then encounters a different layout on the next | Enforce a fixed section order on all 29 pages: Plot > What It Is > When to Use > How to Interpret > Formulas > Python Example > Assumptions > Related Case Studies > Related Techniques. Some sections may be empty/absent (e.g., no formulas for star-plot), but present sections must be in this order. |
| Loading KaTeX fonts on pages where no formula exists | Page Load Event delayed by font requests; mobile users on slow connections see a longer white-screen period | Conditional KaTeX CSS loading (already supported by EDALayout.astro). The `useKatex` prop must be computed from content, not hardcoded. |
| Python examples that import data from files the reader does not have | Code example fails immediately when reader copies it; "FileNotFoundError" is a terrible first experience | Generate synthetic data inline in every example: `data = np.random.default_rng(42).normal(0, 1, 100)`. This makes every example self-contained and reproducible. For technique-specific datasets, generate data that exhibits the relevant pattern (e.g., autocorrelated data for autocorrelation-plot). |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **KaTeX CSS loading:** Verify that graphical technique pages with formulas load katex.min.css AND that pages without formulas do NOT load it. Check the `<head>` of 3 pages with formulas and 3 without.
- [ ] **Python code actually runs:** Extract 5 random Python examples from the content file, paste into a Python 3.11+ environment with matplotlib/seaborn/scipy/statsmodels, and verify they execute without error and produce the expected plot type.
- [ ] **String.raw used for ALL tex strings:** Grep technique-content for `tex:` fields that do NOT use `String.raw`. Any bare template literal or regular string will silently break `\frac`, `\sum`, `\hat`, etc.
- [ ] **All 29 techniques have content:** After adding fields incrementally, verify no technique entry was accidentally skipped. Count the entries in technique-content and verify === 29.
- [ ] **Formulas render in both light and dark mode:** KaTeX `color` is set via `var(--color-text-primary)` in the dark-mode override style. Verify that formula text is visible against both light and dark backgrounds on 3 technique pages.
- [ ] **Case study cross-links resolve to real pages:** For every `relatedCaseStudies` slug referenced across all 29 techniques, verify a corresponding MDX file exists in `src/data/eda/pages/case-studies/`.
- [ ] **Python examples use CURRENT API:** Grep all Python code for `distplot` (deprecated seaborn), `normed=True` (deprecated matplotlib), `vert=True` (deprecated matplotlib 3.10), `plt.acorr` (wrong for NIST-style autocorrelation). Zero matches expected.
- [ ] **technique-content interface matches actual usage:** The TypeScript interface for TechniqueContent defines all new fields; the [slug].astro page accesses them without type errors; `astro check` passes.
- [ ] **SVG audit page exists and shows all 29 techniques:** Navigate to `/eda/dev/svg-audit/` in dev mode and visually confirm all 29 SVGs render with correct statistical patterns.
- [ ] **Build time within budget:** Measure `time npx astro build` and verify it is within baseline + 5 seconds.
- [ ] **No Lighthouse regression on sample technique pages:** Run Lighthouse on 3 representative technique pages (one with formulas, one without, one Tier B with variants). All must score 90+ on mobile performance.
- [ ] **Section ordering is consistent:** Open 5 random technique pages and verify sections appear in the canonical order: Plot > What It Is > When to Use > How to Interpret > Formulas > Python Example > Assumptions > Related Case Studies > Related Techniques.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| technique-content.ts at 250KB is unmanageable | MEDIUM (4-6 hours) | Split into per-category files retroactively. This is a mechanical refactor: extract each technique's content object, create a new file, update the barrel import. TypeScript compiler validates correctness. |
| 5+ Python examples have deprecated API calls | LOW (1-2 hours) | Grep for deprecated patterns, find-replace across affected examples. Each fix is 1-2 line changes. Revalidation by running the examples catches remaining issues. |
| KaTeX CSS loaded on wrong pages | LOW (30 min) | Change `useKatex` from hardcoded to computed (`content?.formulas?.length > 0`). Single line change in [slug].astro. |
| SVG for a technique shows wrong statistical pattern | LOW-MEDIUM (30-60 min) | Identify the incorrect generator call or dataset in technique-renderer.ts. Fix the data or function call. The SVG generators are well-tested and the issue is almost always incorrect input data, not a generator bug. |
| Content quality varies wildly across 29 techniques | HIGH (8-12 hours) | Review all 29 entries, identify the weakest 10, rewrite those to match the quality of the best. This is editorial work that cannot be automated. Prevention (batch review gates) is far cheaper. |
| Build time exceeds budget by >10 seconds | MEDIUM (2-4 hours) | Profile with `ASTRO_PERF=1 astro build` or `astro-speed-measure`. Identify whether the bottleneck is KaTeX, Shiki, SVG generation, or OG images. Apply targeted optimization: shorter Python examples reduce Shiki cost; fewer formulas reduce KaTeX cost; SVG caching reduces generation cost. |
| Case study cross-links break after case study refactor | LOW (1-2 hours) | If using centralized mapping file: fix the mapping, all pages update automatically. If using inline strings: grep for the old slug, replace with new slug across technique-content files. |
| Formula renders raw LaTeX on production page | LOW (15 min) | Three possible causes: (1) missing `import katex`, (2) missing `useKatex={true}` in layout, (3) malformed tex string. Check in this order. Fix and rebuild. |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| technique-content.ts file size | Phase 1 (Infrastructure) | File split into per-category or per-technique modules before content work begins; no single file exceeds 60KB |
| Python code API correctness | Phase 1 (Template + validation script) | Python template established; validation script exists and runs; deprecated API grep returns zero matches |
| KaTeX rendering on graphical pages | Phase 1 (Infrastructure) | [slug].astro updated with conditional KaTeX; verified on 3 test pages before content phases |
| SVG validation subjectivity | Phase 1 (SVG audit page + checklist) | Dev-only audit page renders all 29 SVGs; validation checklist defined per technique |
| Content quality drift | Every content phase (batch review gates) | Each batch of 4-6 techniques reviewed before starting next batch; field length variance within 2x of median |
| Build time regression | Phase 1 (baseline) + every content phase | Baseline recorded; each phase measures post-build time; total within baseline + 5s |
| Case study cross-link staleness | Phase 1 (centralized mapping) + every content phase | Mapping file created; link validation runs after each content batch |
| Lighthouse performance on formula pages | Final verification phase | Lighthouse 90+ on mobile for 3 representative technique pages (with/without formulas, Tier B) |
| Section ordering consistency | Phase 1 (template definition) + final verification | Canonical section order defined; 5 random pages spot-checked at each phase boundary |
| Python examples self-contained | Every content phase | Every example uses inline synthetic data; no `read_csv()` or file paths; validated by running extracted examples |

## Sources

- Existing codebase: `src/lib/eda/technique-content.ts` -- 64KB, 380 lines, 29 entries with 5 fields each (definition, purpose, interpretation, assumptions, nistReference)
- Existing codebase: `src/lib/eda/quantitative-content.ts` -- 55KB, 744 lines, 18 entries with formulas+pythonCode -- the proven reference architecture for formula+code content
- Existing codebase: `src/pages/eda/quantitative/[slug].astro` -- Reference implementation for KaTeX rendering in page frontmatter + Code component usage
- Existing codebase: `src/pages/eda/techniques/[slug].astro` -- Current graphical page without KaTeX/Python; target for enhancement
- Existing codebase: `src/components/eda/TechniquePage.astro` -- Layout with existing `formula` and `code` named slots already defined but unused by graphical pages
- Existing codebase: `src/components/eda/InlineMath.astro` -- Build-time KaTeX rendering with `throwOnError: false`
- Existing codebase: `src/layouts/EDALayout.astro` -- Conditional KaTeX CSS loading via `useKatex` prop
- Existing codebase: `src/lib/eda/technique-renderer.ts` -- 35KB, all 29 SVG generators with variant support
- Existing v1.9 pitfalls: `.planning/research/PITFALLS.md` (2026-02-26) -- Case study deep dive pitfalls; informed by similar content expansion challenges
- [Matplotlib 3.10 API changes](https://matplotlib.org/stable/api/prev_api_changes/api_changes_3.10.0.html) -- `vert` parameter deprecation on boxplot/bxp
- [Seaborn migration: distplot to histplot](https://seaborn.pydata.org/tutorial/introduction.html) -- `distplot` deprecated since 0.11, removed in 0.14
- [KaTeX font documentation](https://katex.org/docs/font) -- ~350KB font files, `font-display: block` default, WOFF2 optimization
- [KaTeX common issues](https://katex.org/docs/issues.html) -- Known rendering issues and workarounds
- [astro-expressive-code CHANGELOG](https://github.com/expressive-code/expressive-code/blob/main/packages/astro-expressive-code/CHANGELOG.md) -- Parallel-safe Shiki initialization, on-demand language loading
- [Astro Content Layer deep dive](https://astro.build/blog/content-layer-deep-dive/) -- 5x faster builds, 50% less memory with Content Layer API
- [Astro build speed optimization](https://www.bitdoze.com/astro-ssg-build-optimization/) -- Pages/second benchmarking methodology
- [NIST Histogram page](https://www.itl.nist.gov/div898/handbook/eda/section3/histogra.htm) -- Reference for NIST section depth: Purpose, Sample Plot, Definition, Questions, Examples, Related Techniques, Case Study, Software

---
*Pitfalls research for: EDA Graphical Techniques NIST Parity -- enhancing 29 graphical technique pages with formulas, Python code, SVG validation, and case study cross-links*
*Researched: 2026-02-27*
