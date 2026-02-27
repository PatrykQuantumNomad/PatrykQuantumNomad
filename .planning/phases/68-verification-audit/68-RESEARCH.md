# Phase 68: Verification & Audit - Research

**Researched:** 2026-02-27
**Domain:** Build verification, Lighthouse performance auditing, cross-link validation, KaTeX rendering QA, Python API deprecation scanning
**Confidence:** HIGH

## Summary

Phase 68 is a pure verification/audit phase -- the final phase of milestone v1.10. No new features are created; every task is a check against previously implemented work from Phases 64-67. The five requirements (VRFY-01 through VRFY-05) each have a clear, deterministic pass/fail criterion: clean build, Lighthouse 90+, no broken cross-links, no raw LaTeX, no deprecated Python APIs.

The project is an Astro 5.3+ static site using TypeScript, KaTeX for build-time math rendering, astro-expressive-code for Python syntax highlighting, and custom TypeScript SVG generators. All 29 graphical technique pages are already built and their content (formulas, pythonCode, caseStudySlugs) is populated across 7 category modules under `src/lib/eda/technique-content/`. Prior phase verifications (65-VERIFICATION.md, 67-VERIFICATION.md) have already confirmed much of what Phase 68 re-validates at the milestone level.

**Primary recommendation:** Structure as a single plan with 5 sequential tasks matching the 5 VRFY requirements, each producing documented evidence. The key tools are `astro build`, `lighthouse` CLI (v13.0.3 installed), `grep` for deprecated APIs, and build-output HTML inspection for KaTeX/cross-link validation.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VRFY-01 | Build completes cleanly with zero errors after all changes | `astro build` command; parse stdout for error/warning counts; 29 technique pages in dist/ confirmed |
| VRFY-02 | Lighthouse performance score remains 90+ on graphical technique pages | Lighthouse CLI v13.0.3 installed; `astro preview` serves built site; 3 representative pages identified |
| VRFY-03 | All case study cross-links resolve to valid pages (no broken links) | 10 unique caseStudySlugs across 19 technique entries; all 10 case study .mdx pages exist; build-time filter in getStaticPaths already validates |
| VRFY-04 | All KaTeX formulas render correctly (no raw LaTeX visible on page) | 13 techniques with formulas (26 total formula entries); katex.renderToString() at build time; built HTML can be inspected for `.katex` class presence |
| VRFY-05 | Python code examples use no deprecated API calls (verified via grep) | 29 pythonCode entries; grep for `distplot`, `vert=True`, `plt.acorr`, `normed=True`; Phase 67 already confirmed zero matches |
</phase_requirements>

## Standard Stack

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Astro CLI | ^5.3.0 | `astro build` for clean build verification | Project's build system; exit code 0 = success |
| Lighthouse CLI | 13.0.3 | Performance scoring of built pages | Installed globally at `/Users/patrykattc/.nvm/versions/node/v24.11.1/bin/lighthouse`; industry standard for web performance auditing |
| grep/ripgrep | system | Pattern scanning for deprecated APIs and raw LaTeX | Deterministic text search; no false positives for exact string patterns |

### Supporting
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| `astro preview` | ^5.3.0 | Local HTTP server for Lighthouse testing | After `astro build`, serves dist/ for Lighthouse to fetch |
| Node.js | v24.11.1 | Runtime for Astro and Lighthouse | Already installed |
| python3 | system | Script helper for batch validation | Optional; bash loops work equally well |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Lighthouse CLI | PageSpeed Insights API | CLI is local, faster, no API key needed, more reproducible |
| Manual HTML grep for KaTeX | Puppeteer/Playwright visual test | Overkill for "is .katex class present?"; adds 200MB+ dependency |
| Per-file grep for deprecated APIs | AST parsing | grep is sufficient for exact string matches like `distplot` |

**Installation:**
```bash
# No new packages needed. All tools are already available.
# Lighthouse: /Users/patrykattc/.nvm/versions/node/v24.11.1/bin/lighthouse
# Astro: npx astro build / npx astro preview
```

## Architecture Patterns

### Verification Execution Structure
```
Phase 68 (single plan)
  Task 1: VRFY-01 — Clean build
  Task 2: VRFY-05 — Deprecated API grep (fast, no build needed)
  Task 3: VRFY-03 — Cross-link validation (inspect build output)
  Task 4: VRFY-04 — KaTeX formula rendering (inspect build output HTML)
  Task 5: VRFY-02 — Lighthouse scoring (requires running preview server)
```

### Pattern 1: Build Verification (VRFY-01)
**What:** Run `astro build` and capture stdout/stderr. Check exit code = 0 and scan output for any error or warning lines related to EDA technique pages.
**When to use:** First task, gates all subsequent checks.
**Command:**
```bash
npx astro build 2>&1 | tee /tmp/astro-build-output.txt
echo "Exit code: $?"
# Check for EDA-related warnings
grep -i -E "warn|error" /tmp/astro-build-output.txt | grep -i "eda\|technique\|katex\|formula" || echo "No EDA-related warnings"
```

### Pattern 2: Deprecated API Grep (VRFY-05)
**What:** Search all 7 technique-content .ts files for deprecated Python patterns.
**When to use:** Quick check, no build dependency.
**Target patterns:**
- `distplot` (deprecated in seaborn 0.11, replaced by `displot`/`histplot`)
- `vert=True` (deprecated in matplotlib boxplots, replaced by `orientation='vertical'`)
- `plt.acorr` without confidence bounds (replaced by manual computation per NIST)
- `normed=True` (deprecated in matplotlib hist, replaced by `density=True`)
- `random_state=` (older numpy API, project uses `np.random.default_rng(42)`)
**Command:**
```bash
grep -rn "distplot\|vert=True\|plt\.acorr\|normed=True\|random_state=" \
  src/lib/eda/technique-content/*.ts && echo "FAIL: deprecated patterns found" || echo "PASS: zero deprecated patterns"
```

### Pattern 3: Cross-Link Validation (VRFY-03)
**What:** For each technique with `caseStudySlugs`, verify the referenced case study page exists in dist/.
**When to use:** After build (Task 1).
**Key data:** 10 unique case study slugs referenced across 19 technique entries. All 10 exist as both `.mdx` source files and `dist/eda/case-studies/{slug}/index.html` outputs.
**Build-time safety net:** The `getStaticPaths()` in `[slug].astro` already filters caseStudySlugs through `caseStudyMap.has(slug)`, silently dropping invalid slugs. This means broken references produce no link rather than a 404. Verification should check both:
1. All expected links are present in built HTML (no silently dropped slugs)
2. All linked URLs resolve to existing pages in dist/
**Command:**
```bash
# Verify all 10 case study pages exist in dist
for slug in beam-deflections ceramic-strength cryothermometry fatigue-life filter-transmittance heat-flow-meter normal-random-numbers random-walk standard-resistor uniform-random-numbers; do
  test -f "dist/eda/case-studies/$slug/index.html" && echo "OK: $slug" || echo "MISSING: $slug"
done
```

### Pattern 4: KaTeX Rendering Validation (VRFY-04)
**What:** Inspect built HTML of formula-bearing technique pages for `.katex` class (rendered math) and absence of raw LaTeX strings (e.g., `\frac`, `\sum`, `\bar`).
**When to use:** After build (Task 1).
**13 formula techniques:** autocorrelation-plot, spectral-plot, ppcc-plot, weibull-plot, 4-plot, mean-plot, std-deviation-plot, bootstrap-plot, box-cox-linearity, box-cox-normality, normal-probability-plot, probability-plot, qq-plot
**Command:**
```bash
for slug in autocorrelation-plot spectral-plot ppcc-plot weibull-plot 4-plot mean-plot std-deviation-plot bootstrap-plot box-cox-linearity box-cox-normality normal-probability-plot probability-plot qq-plot; do
  html="dist/eda/techniques/$slug/index.html"
  katex_count=$(grep -c 'class="katex' "$html" 2>/dev/null || echo 0)
  raw_latex=$(grep -oP '(?<!class=")\\\\(frac|sum|bar|sqrt|int)\b' "$html" 2>/dev/null | wc -l)
  echo "$slug: katex_elements=$katex_count raw_latex_leaks=$raw_latex"
done
```
**Important note:** KaTeX's `renderToString()` uses `throwOnError: false` in this project, which means malformed LaTeX will render as red error text (still wrapped in `.katex` class) rather than throwing. Check for `katex-error` class as well.

### Pattern 5: Lighthouse Performance Scoring (VRFY-02)
**What:** Run Lighthouse CLI against 3 representative pages served by `astro preview`.
**When to use:** Last task -- requires both a clean build and a running preview server.
**Three representative pages:**
1. **With formulas (Tier A):** `/eda/techniques/bootstrap-plot/` -- has 2 KaTeX formulas, no variants, pythonCode, case study links
2. **Without formulas (Tier A):** `/eda/techniques/bihistogram/` -- no formulas, no variants, pythonCode, case study links
3. **Tier B with variants:** `/eda/techniques/histogram/` -- 4 SVG variants via PlotVariantSwap, no formulas, pythonCode
**Command:**
```bash
# Start preview server in background
npx astro preview --port 4321 &
PREVIEW_PID=$!
sleep 3

# Run Lighthouse for each page
for page in eda/techniques/bootstrap-plot eda/techniques/bihistogram eda/techniques/histogram; do
  lighthouse "http://localhost:4321/$page/" \
    --output=json \
    --output-path="/tmp/lighthouse-${page//\//-}.json" \
    --chrome-flags="--headless --no-sandbox" \
    --only-categories=performance \
    --quiet
  score=$(node -e "const r=require('/tmp/lighthouse-${page//\//-}.json'); console.log(Math.round(r.categories.performance.score * 100))")
  echo "$page: performance=$score"
done

kill $PREVIEW_PID
```
**Threshold:** All 3 pages must score >= 90.

### Anti-Patterns to Avoid
- **Running Lighthouse without `--headless`:** Will try to open a Chrome window in terminal
- **Running Lighthouse on development server:** `astro dev` adds dev tools overhead; always use `astro preview` on built output
- **Checking only formula presence, not rendering:** A `.katex` class existing does not mean the formula is correct; must also check for `katex-error` class
- **Trusting getStaticPaths filter alone for VRFY-03:** The build-time filter silently drops invalid slugs; must also verify expected links ARE present, not just that no 404s exist

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Link checking | Custom crawler | Build output inspection + dist/ file existence | Static site: all pages are files; no need for HTTP crawling |
| Performance auditing | Manual DevTools scoring | Lighthouse CLI `--output=json` | Automated, reproducible, parseable output |
| KaTeX validation | Browser-based visual testing | HTML grep for `.katex` class + absence of raw LaTeX | Build-time rendering means HTML is deterministic; no JS needed |
| Deprecated API scan | Custom TypeScript parser | grep for exact string patterns | The deprecated patterns (`distplot`, `vert=True`) are unique enough that substring match is perfectly reliable |

**Key insight:** Since this is a static site with build-time rendering, almost all verification can be done by inspecting files on disk. The only exception is Lighthouse, which requires a running HTTP server.

## Common Pitfalls

### Pitfall 1: Lighthouse Score Variability
**What goes wrong:** Lighthouse performance scores can vary 5-10 points between runs due to system load, Chrome startup timing, and network simulation variance.
**Why it happens:** Lighthouse simulates network throttling and CPU throttling; local system state affects results.
**How to avoid:** Run each page 3 times and take the median. Use `--only-categories=performance` to skip irrelevant audits. Close other browser instances.
**Warning signs:** Score of 88-89 (borderline fail) -- re-run before declaring failure.

### Pitfall 2: Raw LaTeX False Positives in HTML
**What goes wrong:** Grepping for `\frac` or `\sum` in HTML may match content inside KaTeX's rendered output (attribute values, MathML, etc.).
**Why it happens:** KaTeX's HTML output contains the original TeX in aria-labels and annotation elements.
**How to avoid:** Check for raw LaTeX visible as TEXT content, not inside HTML attributes. Better approach: check that `class="katex"` elements exist AND that there are no strings matching `\frac{` or `\sum_{` appearing outside of KaTeX HTML wrapper elements. Alternatively, check for the specific failure mode: raw LaTeX displayed as visible text (which would appear as unescaped `\frac`, `\bar`, etc. in a `<p>` or `<span>` without `.katex` class).
**Warning signs:** grep matches in `<annotation>` tags -- these are expected (MathML accessibility), not failures.

### Pitfall 3: Preview Server Port Conflict
**What goes wrong:** `astro preview` fails because port 4321 is already in use.
**Why it happens:** Previous dev or preview session still running.
**How to avoid:** Use `--port 4322` or check and kill existing process on the port first. Always `kill $PREVIEW_PID` in cleanup.
**Warning signs:** Lighthouse returns "Failed to connect" errors.

### Pitfall 4: Build Cache Producing Stale Output
**What goes wrong:** `astro build` uses cached output from a previous build, not reflecting latest changes.
**Why it happens:** Astro may cache built pages.
**How to avoid:** Delete `dist/` before building: `rm -rf dist && npx astro build`.
**Warning signs:** File timestamps in dist/ older than source file timestamps.

### Pitfall 5: Silent Cross-Link Drops
**What goes wrong:** A technique's `caseStudySlugs` references a non-existent case study, but the build succeeds because `getStaticPaths()` filters it out with `.filter(slug => caseStudyMap.has(slug))`.
**Why it happens:** The build-time safety net hides broken references.
**How to avoid:** Verify that the COUNT of case study links in built HTML matches the count of caseStudySlugs in source for each technique.
**Warning signs:** Technique page HTML has "See It In Action" heading but fewer links than expected.

## Code Examples

### VRFY-01: Full Build with Error Scanning
```bash
# Clean build
rm -rf dist
npx astro build 2>&1 | tee /tmp/astro-build.log

# Verify exit code
if [ $? -ne 0 ]; then
  echo "VRFY-01 FAIL: Build exited with non-zero status"
  exit 1
fi

# Count pages built
page_count=$(grep -oP '\d+ page\(s\) built' /tmp/astro-build.log | grep -oP '\d+')
echo "Pages built: $page_count"

# Scan for EDA-related warnings
eda_warnings=$(grep -i -E "warn|error" /tmp/astro-build.log | grep -i -E "eda|technique|katex|formula|svg" | wc -l)
echo "EDA-related warnings: $eda_warnings"

# Verify all 29 technique pages in output
for slug in autocorrelation-plot bihistogram block-plot bootstrap-plot box-cox-linearity box-cox-normality box-plot complex-demodulation contour-plot doe-plots histogram lag-plot linear-plots mean-plot normal-probability-plot probability-plot ppcc-plot qq-plot run-sequence-plot scatter-plot spectral-plot std-deviation-plot star-plot weibull-plot youden-plot 4-plot 6-plot scatterplot-matrix conditioning-plot; do
  test -f "dist/eda/techniques/$slug/index.html" || echo "MISSING: $slug"
done
```

### VRFY-03: Cross-Link Completeness Check
```bash
# For each technique with caseStudySlugs, verify links in built HTML
# Technique -> expected case study slugs mapping:
declare -A expected_cases=(
  ["autocorrelation-plot"]="beam-deflections"
  ["lag-plot"]="beam-deflections"
  ["run-sequence-plot"]="beam-deflections"
  ["spectral-plot"]="beam-deflections"
  ["bootstrap-plot"]="uniform-random-numbers"
  ["histogram"]="ceramic-strength"
  ["normal-probability-plot"]="heat-flow-meter"
  ["ppcc-plot"]="normal-random-numbers"
  ["probability-plot"]="uniform-random-numbers"
  ["qq-plot"]="ceramic-strength"
  ["weibull-plot"]="fatigue-life"
  ["bihistogram"]="ceramic-strength"
  ["mean-plot"]=""  # no caseStudySlugs
  ["block-plot"]="ceramic-strength"
  ["linear-plots"]="beam-deflections"
  ["scatter-plot"]="standard-resistor"
  ["std-deviation-plot"]=""  # no caseStudySlugs
  ["complex-demodulation"]="filter-transmittance"
  ["4-plot"]="normal-random-numbers uniform-random-numbers random-walk cryothermometry beam-deflections filter-transmittance standard-resistor heat-flow-meter"
  ["box-cox-linearity"]=""  # no caseStudySlugs
  ["box-cox-normality"]=""  # no caseStudySlugs
  ["6-plot"]="fatigue-life"
)

for technique in "${!expected_cases[@]}"; do
  html="dist/eda/techniques/$technique/index.html"
  for case_slug in ${expected_cases[$technique]}; do
    if grep -q "/eda/case-studies/$case_slug/" "$html" 2>/dev/null; then
      echo "OK: $technique -> $case_slug"
    else
      echo "FAIL: $technique missing link to $case_slug"
    fi
  done
done
```

### VRFY-04: KaTeX Rendering Check
```bash
FORMULA_TECHNIQUES="autocorrelation-plot spectral-plot ppcc-plot weibull-plot 4-plot mean-plot std-deviation-plot bootstrap-plot box-cox-linearity box-cox-normality normal-probability-plot probability-plot qq-plot"

for slug in $FORMULA_TECHNIQUES; do
  html="dist/eda/techniques/$slug/index.html"

  # Check .katex class elements exist (rendered formulas)
  katex_present=$(grep -c 'class="katex"' "$html" 2>/dev/null)

  # Check for katex-error class (malformed formula rendering)
  katex_errors=$(grep -c 'katex-error' "$html" 2>/dev/null)

  # Check KaTeX CSS is loaded
  katex_css=$(grep -c 'katex.min.css' "$html" 2>/dev/null)

  echo "$slug: rendered=$katex_present errors=$katex_errors css_loaded=$katex_css"
done

# Also verify KaTeX CSS is NOT loaded on non-formula pages
for slug in bihistogram box-plot histogram; do
  html="dist/eda/techniques/$slug/index.html"
  katex_css=$(grep -c 'katex.min.css' "$html" 2>/dev/null)
  echo "$slug (no formulas): katex_css_loaded=$katex_css (should be 0)"
done
```

### VRFY-02: Lighthouse Performance Audit
```bash
# Start preview server
npx astro preview --port 4322 &
PREVIEW_PID=$!
sleep 4

PAGES=("eda/techniques/bootstrap-plot" "eda/techniques/bihistogram" "eda/techniques/histogram")
ALL_PASS=true

for page in "${PAGES[@]}"; do
  lighthouse "http://localhost:4322/$page/" \
    --output=json \
    --output-path="/tmp/lh-${page//\//-}.json" \
    --chrome-flags="--headless --no-sandbox" \
    --only-categories=performance \
    --quiet 2>/dev/null

  score=$(node -e "const r=require('/tmp/lh-${page//\//-}.json'); console.log(Math.round(r.categories.performance.score * 100))")
  echo "$page: performance=$score"

  if [ "$score" -lt 90 ]; then
    ALL_PASS=false
    echo "  FAIL: Below 90 threshold"
  fi
done

kill $PREVIEW_PID 2>/dev/null
echo "Overall: $ALL_PASS"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| seaborn `distplot()` | `sns.histplot()` or `sns.displot()` | seaborn 0.11 (2020) | Deprecated API; must NOT appear in Python examples |
| matplotlib `vert=True` for boxplots | `orientation='vertical'` | matplotlib 3.5+ | Deprecated kwarg; must NOT appear in Python examples |
| `plt.acorr()` for autocorrelation | Manual computation with `np.correlate` | NIST convention | `plt.acorr` does not provide confidence bounds; manual computation matches NIST methodology |
| `normed=True` in `plt.hist()` | `density=True` | matplotlib 3.1+ | Deprecated alias; must NOT appear |
| `np.random.RandomState` / `random_state=` | `np.random.default_rng(42)` | numpy 1.17+ (2019) | Legacy API; project standardized on new Generator API |

**Deprecated/outdated:**
- `distplot`: Removed from seaborn; project uses `histplot`/`displot`
- `vert=True`: Deprecated matplotlib parameter; project avoids it
- `plt.acorr`: Not deprecated per se, but project uses manual autocorrelation per NIST specification
- `normed=True`: Deprecated matplotlib parameter; project uses `density=True`

## Open Questions

1. **CASE-03 requirement status**
   - What we know: CASE-03 ("Case study links render as styled pill buttons matching the existing Related Techniques pattern") is marked Pending in REQUIREMENTS.md traceability. It's assigned to Phase 66 but not to Phase 68.
   - What's unclear: Whether Phase 68 needs to verify CASE-03 or if it's considered out-of-scope for this final verification phase.
   - Recommendation: Visual inspection of case study links in built output confirms pill-button styling is already implemented (see `[slug].astro` lines 161-167: `rounded-full` class with accent color). Phase 68 can note this as verified even though CASE-03 is not in its explicit requirement list.

2. **Build warning tolerance**
   - What we know: VRFY-01 says "zero errors and zero warnings related to EDA technique pages." Prior builds had 951 pages, 0 errors.
   - What's unclear: Whether non-EDA warnings (e.g., unrelated deprecation notices from dependencies) should be flagged.
   - Recommendation: Filter warnings to only EDA-related patterns. Non-EDA warnings are not regressions from this milestone.

3. **Lighthouse score variation**
   - What we know: Lighthouse scores vary 5-10 points between runs. Threshold is 90.
   - What's unclear: Whether a single run or median-of-3 is expected.
   - Recommendation: Run each page once. If any score is 85-89 (borderline), re-run 3x and take median. Scores above 90 on first run are definitive.

## Sources

### Primary (HIGH confidence)
- Project source code inspection: `src/pages/eda/techniques/[slug].astro`, `src/lib/eda/technique-content/`, `src/layouts/EDALayout.astro`, `astro.config.mjs`
- Prior phase verifications: `65-VERIFICATION.md`, `67-VERIFICATION.md` -- confirmed patterns, tool availability, and partial verification of VRFY requirements
- `package.json` -- confirmed Astro ^5.3.0, astro-expressive-code ^0.41.6, katex via rehype-katex ^7.0.1
- Lighthouse CLI v13.0.3 confirmed installed at system path

### Secondary (MEDIUM confidence)
- Technique content field completeness derived from grep across 7 category modules (29 pythonCode entries, 13 formula techniques, 19 technique-caseStudy linkages)
- Case study slug cross-reference: 10 unique slugs, all 10 have matching .mdx source files and dist/ output directories

### Tertiary (LOW confidence)
- None. All findings verified directly from project source code and installed tools.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all tools already installed and used in prior phases
- Architecture: HIGH - verification pattern is well-understood for static sites; all data gathered from actual source code
- Pitfalls: HIGH - identified from direct experience with prior phase verifications (65, 67) and known Lighthouse behavior

**Research date:** 2026-02-27
**Valid until:** 2026-03-29 (30 days; stable tools, static project)
