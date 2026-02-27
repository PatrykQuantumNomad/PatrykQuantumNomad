# Phase 63: Validation - Research

**Researched:** 2026-02-27
**Domain:** Astro SSG build validation, cross-reference link integrity, NIST statistical data verification
**Confidence:** HIGH

## Summary

Phase 63 is a verification-only phase with no new feature development. It validates the output of phases 57-62, which enhanced all 9 case studies in the EDA Visual Encyclopedia to full NIST parity. The three validation requirements (VAL-01: link integrity, VAL-02: build correctness, VAL-03: statistical accuracy) are straightforward to implement using existing project tooling: `npx astro check`, `npx astro build`, and manual cross-referencing against the NIST e-Handbook source pages.

A prior Quick Task 011 (2026-02-26) already performed a comprehensive content audit of the EDA encyclopedia, finding 5 broken cross-reference links and confirming all statistical values were correct at that time. However, that audit was performed BEFORE phases 57-62 executed, so all content added/modified by those phases (new interpretation sections, new quantitative results, new case study Standard Resistor, DOE analysis) must be re-validated. The validation scope is specifically the delta introduced by phases 57-62.

Three requirements marked "pending" in REQUIREMENTS.md (RSTR-01, RSTR-02, BEAM-02) appear to be tracking artifacts -- investigation confirms all three are functionally implemented in the codebase: `standardResistor` array exists in datasets.ts (1000 values), `StandardResistorPlots.astro` component exists and renders all plot types, and Beam Deflections has a complete Quantitative Output section with Test Summary table.

**Primary recommendation:** Execute validation in three sequential tasks: (1) extract and verify all cross-reference links across the 9 case studies, (2) run `npx astro check` and `npx astro build`, and (3) cross-reference all quantitative table values against NIST source pages. Also update the 3 stale requirement checkboxes.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VAL-01 | All cross-reference links verified working across all 9 enhanced case studies | URL cross-reference cheat sheet exists at `.planning/phases/56-infrastructure-foundation/url-cross-reference.md` with 190 total links across 10 case study files. All links follow 6 route patterns: `/eda/techniques/`, `/eda/quantitative/`, `/eda/distributions/`, `/eda/case-studies/`, `/eda/foundations/`, `/eda/reference/`. Slugs sourced from `techniques.json` (47 entries), `distributions.json` (19 entries), and MDX filenames. |
| VAL-02 | npx astro check reports 0 errors and npx astro build completes successfully | Astro 5.3+ with `@astrojs/check 0.9.6+`. Commands: `npx astro check` (TypeScript/Astro validation), `npx astro build` (full SSG build). Previous Quick Task 011 confirmed 950 pages built successfully on 2026-02-26. |
| VAL-03 | Statistical values in quantitative tables verified against NIST source data | 9 NIST source URLs identified for quantitative output verification. Prior decisions document specific value corrections (HFM PPCC 0.999 vs NIST printed 0.996, Filter Transmittance r1 0.94 vs computed 0.9380). All summary statistics, test statistics, critical values, and conclusions must be cross-referenced. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | ^5.3.0 | SSG framework -- `astro check` and `astro build` | Project framework, provides built-in TypeScript validation and static build |
| @astrojs/check | ^0.9.6 | Astro-specific TypeScript checking | Official Astro diagnostic tool, catches template errors and type mismatches |
| @astrojs/mdx | ^4.3.13 | MDX compilation for case study pages | Case study content is in MDX format with component imports |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node.js | (system) | Script execution for link extraction | Ad-hoc validation scripts |
| grep/rg | (system) | Pattern matching for link extraction | Extracting all markdown links from MDX files |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual link checking | Automated link checker (linkinator, broken-link-checker) | Not needed -- all links are internal and can be validated against known slug inventories |
| Manual NIST verification | Automated scraping | NIST pages may require manual reading; automated comparison risks false positives from formatting differences |

**Installation:**
No new packages needed. All validation uses existing project tooling.

## Architecture Patterns

### Validation Approach: Three-Layer Verification

```
Layer 1: Link Integrity (VAL-01)
  Extract all markdown links from 9 case study MDX files
  Validate each link slug exists in source data files
  Check inter-case-study references point to existing pages

Layer 2: Build Correctness (VAL-02)
  npx astro check → 0 errors
  npx astro build → successful completion

Layer 3: Statistical Accuracy (VAL-03)
  For each case study quantitative table:
    Compare summary statistics against NIST source page
    Compare test statistics against NIST source page
    Compare critical values against NIST source page
    Verify conclusions match test result logic
```

### Pattern 1: Link Extraction and Validation
**What:** Extract all internal links from MDX files and validate against slug inventories
**When to use:** VAL-01 verification
**Example:**
```bash
# Extract all EDA internal links from case study MDX files
rg -o '\(/eda/[^)]+\)' src/data/eda/pages/case-studies/*.mdx | sort -u

# Cross-reference against known slugs
# techniques.json: 29 graphical + 18 quantitative = 47 slugs
# distributions.json: 19 slugs
# case-studies directory: 10 MDX files
# foundations directory: 6 MDX files
# reference directory: 4 MDX files
```

### Pattern 2: NIST Value Cross-Referencing
**What:** Systematically compare every numerical value in quantitative tables against NIST source
**When to use:** VAL-03 verification
**Example:**
```
For each case study:
1. Read the MDX quantitative section
2. Fetch the corresponding NIST page (eda42X3.htm)
3. Compare:
   - Summary statistics (mean, std dev, median, min, max, range, n)
   - Location test (t-value, critical value)
   - Variation test (statistic, critical value)
   - Randomness tests (runs Z, autocorrelation r1, critical values)
   - Distribution test (Anderson-Darling A2, PPCC, critical values)
   - Outlier test (Grubbs G, critical value)
4. Note discrepancies with resolution (computed vs printed)
```

### Anti-Patterns to Avoid
- **Blind NIST matching:** Some values were deliberately corrected from NIST printed values based on computation (e.g., HFM PPCC 0.999 vs NIST 0.996). These are documented decisions, not errors.
- **Validating only new content:** All 9 case studies must be validated end-to-end, even if some sections existed before Phase 57.
- **Skipping build after fixes:** Any corrections must be followed by a fresh `astro check` + `astro build` cycle.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Link checking | Custom link crawler | `rg` + slug inventory comparison | Internal links follow 6 known route patterns; grep against known slugs is faster and more reliable than HTTP crawling |
| TypeScript validation | Manual code review | `npx astro check` | Official tool catches all template errors, type mismatches, import issues |
| Full build test | Selective page testing | `npx astro build` | SSG builds ALL pages; any broken import, missing component, or data error will surface |
| Statistical recomputation | Re-running all stats from datasets | Comparison against NIST source pages | Values are hardcoded in MDX, not computed at runtime; validation is comparison, not recomputation |

**Key insight:** This is a verification phase, not a development phase. Every tool already exists; the work is systematic comparison and documentation.

## Common Pitfalls

### Pitfall 1: Treating NIST Printed Values as Absolute Truth
**What goes wrong:** Flagging computed values as "wrong" because they differ from NIST printed values
**Why it happens:** NIST pages sometimes display rounded or intermediate values; the project's computed values may be more precise
**How to avoid:** Check the v1.9 decision log in STATE.md before flagging discrepancies. Known corrections: HFM PPCC (0.999 vs 0.996), Filter Transmittance r1 (0.94 vs 0.93)
**Warning signs:** Discrepancies in the last decimal place only, especially for PPCC and autocorrelation values

### Pitfall 2: Missing Inter-Case-Study Link Validation
**What goes wrong:** Validating technique/quantitative/distribution links but forgetting links between case studies themselves
**Why it happens:** Most links point to technique or quantitative pages; inter-case-study links are fewer (about 6-7 total across all files)
**How to avoid:** Explicitly check all `/eda/case-studies/` links in MDX files
**Warning signs:** Filter Transmittance links to Beam Deflections, Heat Flow Meter links to Random Walk, Standard Resistor links to Filter Transmittance, Normal Random Numbers links to Random Walk, Uniform Random Numbers links to Normal Random Numbers

### Pitfall 3: Forgetting the "Random Walk" Case Study Exists
**What goes wrong:** The 9 enhanced case studies don't include Random Walk, but links TO Random Walk from other case studies must still resolve
**Why it happens:** Random Walk is case study #9 of 10 total but not one of the 9 enhanced studies
**How to avoid:** Random Walk (random-walk.mdx) exists and is a valid link target even though it's not being validated for content accuracy in this phase

### Pitfall 4: Stale Requirement Checkboxes
**What goes wrong:** REQUIREMENTS.md shows RSTR-01, RSTR-02, BEAM-02 as "Pending" when they are actually implemented
**Why it happens:** Requirement checkboxes weren't updated when the actual implementation was completed
**How to avoid:** Verify each "pending" requirement against the codebase, then update checkboxes in REQUIREMENTS.md as part of validation
**Warning signs:** Requirement tracking says pending but code review shows implementation exists

### Pitfall 5: Ceramic Strength DOE Values Not in Standard NIST Format
**What goes wrong:** Looking for standard quantitative output format (summary stats + hypothesis tests) for Ceramic Strength
**Why it happens:** Ceramic Strength follows a DOE (Design of Experiments) template, not the standard single-factor case study template. Its quantitative results include ANOVA tables, DOE effects, and factor rankings instead of the standard hypothesis test battery.
**How to avoid:** Validate Ceramic Strength against NIST Section 1.4.2.10, which uses ANOVA F-tests and Yates analysis rather than runs test/Anderson-Darling/etc.

## Code Examples

### Link Extraction Script
```bash
# Extract all unique internal EDA links from the 9 enhanced case studies
for f in normal-random-numbers uniform-random-numbers cryothermometry \
         beam-deflections filter-transmittance standard-resistor \
         heat-flow-meter fatigue-life ceramic-strength; do
  echo "=== $f ==="
  rg -o '\[([^\]]+)\]\((/eda/[^)]+)\)' \
    "src/data/eda/pages/case-studies/${f}.mdx" \
    --replace '$2' | sort -u
done
```

### Slug Validation Against Source Data
```bash
# Verify technique slugs exist in techniques.json
rg '"id"' src/data/eda/techniques.json --replace '' | \
  rg -o '"[^"]+"' | sort

# Verify distribution slugs exist in distributions.json
rg '"id"' src/data/eda/distributions.json --replace '' | \
  rg -o '"[^"]+"' | sort

# Verify case study slugs match MDX filenames
ls src/data/eda/pages/case-studies/*.mdx | \
  sed 's|.*/||; s|\.mdx||' | sort
```

### Build Validation Commands
```bash
# Type checking (catches import errors, type mismatches, template issues)
npx astro check

# Full static site generation (catches all build-time errors)
npx astro build
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Quick Task 011 audit (pre-v1.9) | Phase 63 post-enhancement validation | 2026-02-27 | Must re-validate all content added by phases 57-62 |
| 9 case studies (pre-v1.9) | 10 case studies (Standard Resistor added in Phase 58) | Phase 58 | New case study with 1000-observation dataset needs full validation |
| Standard 4-assumption template only | DOE variation template for Ceramic Strength | Phase 62 | Different validation criteria for DOE-structured content |

## NIST Source Reference URLs

Critical for VAL-03 verification. Each case study has a NIST quantitative output page:

| Case Study | NIST Section | Quantitative Output URL |
|------------|-------------|------------------------|
| Normal Random Numbers | 1.4.2.1 | https://www.itl.nist.gov/div898/handbook/eda/section4/eda4213.htm |
| Uniform Random Numbers | 1.4.2.2 | https://www.itl.nist.gov/div898/handbook/eda/section4/eda4223.htm |
| Cryothermometry | 1.4.2.4 | https://www.itl.nist.gov/div898/handbook/eda/section4/eda4243.htm |
| Beam Deflections | 1.4.2.5 | https://www.itl.nist.gov/div898/handbook/eda/section4/eda4252.htm (assumptions) |
| Beam Deflections | 1.4.2.5 | https://www.itl.nist.gov/div898/handbook/eda/section4/eda4253.htm (model) |
| Beam Deflections | 1.4.2.5 | https://www.itl.nist.gov/div898/handbook/eda/section4/eda4254.htm (validation) |
| Filter Transmittance | 1.4.2.6 | https://www.itl.nist.gov/div898/handbook/eda/section4/eda4263.htm |
| Standard Resistor | 1.4.2.7 | https://www.itl.nist.gov/div898/handbook/eda/section4/eda4273.htm |
| Heat Flow Meter | 1.4.2.8 | https://www.itl.nist.gov/div898/handbook/eda/section4/eda4283.htm |
| Fatigue Life | 1.4.2.9 | https://www.itl.nist.gov/div898/handbook/eda/section4/eda4293.htm |
| Ceramic Strength | 1.4.2.10 | https://www.itl.nist.gov/div898/handbook/eda/section4/eda42a3.htm |

## Known NIST Value Corrections (Documented Decisions)

These discrepancies between the project's values and NIST printed values are INTENTIONAL and documented in STATE.md:

| Case Study | Value | Project | NIST Printed | Reason |
|------------|-------|---------|-------------|--------|
| Heat Flow Meter | PPCC | 0.999 | 0.996 | Computed from ppccNormal function; matches actual computation |
| Filter Transmittance | r1 | 0.94 | 0.93 | Computed 0.9380 from dataset; rounds to 0.94 not 0.93 |
| Beam Deflections | Runs Z | 2.6938 | (verify) | Computed from runsTest function |
| Standard Resistor | t-critical | ~1.962 | ~2.01? | df=998 yields ~1.962 (correct), different from Filter Transmittance's df=48 |

## Existing Codebase Assets for Validation

| Asset | Path | Relevance |
|-------|------|-----------|
| URL cross-reference cheat sheet | `.planning/phases/56-infrastructure-foundation/url-cross-reference.md` | Complete slug inventory for link validation (190 links, 6 route patterns) |
| Techniques JSON | `src/data/eda/techniques.json` | 47 entries (29 graphical + 18 quantitative) -- authoritative slug source |
| Distributions JSON | `src/data/eda/distributions.json` | 19 entries -- authoritative slug source |
| Datasets | `src/data/eda/datasets.ts` | All dataset arrays with NIST source URLs |
| Statistics library | `src/lib/eda/math/statistics.ts` | Hypothesis test functions used for computed values |
| CaseStudyDataset component | `src/components/eda/CaseStudyDataset.astro` | Maps all 10 case study slugs to dataset arrays |
| StandardResistorPlots | `src/components/eda/StandardResistorPlots.astro` | Plot component for Standard Resistor (addresses RSTR-02) |
| Prior validation | `.planning/quick/011-eda-content-correctness-validation/011-SUMMARY.md` | Pre-v1.9 audit baseline -- shows what was already verified |

## Pending Requirement Investigation

| Requirement | Status in REQUIREMENTS.md | Actual Status | Evidence |
|-------------|--------------------------|---------------|----------|
| RSTR-01 | Pending | IMPLEMENTED | `export const standardResistor: number[]` exists in datasets.ts with 1000 values, DATASET_SOURCES.standardResistor entry exists |
| RSTR-02 | Pending | IMPLEMENTED | `src/components/eda/StandardResistorPlots.astro` exists, renders all 7 plot types (4-plot, run-sequence, lag, histogram, probability, autocorrelation, spectral) |
| BEAM-02 | Pending | IMPLEMENTED | Beam Deflections MDX has full Quantitative Output section (lines 104-197) with Summary Statistics, Location Test, Variation Test, Randomness Tests, Distribution/Outlier Tests, and Test Summary table |

## Open Questions

1. **Ceramic Strength NIST validation format**
   - What we know: Ceramic Strength uses DOE template with ANOVA F-tests, not the standard hypothesis test battery
   - What's unclear: Exact NIST values for lab ANOVA F=1.837, batch effects, and Yates analysis rankings
   - Recommendation: Fetch https://www.itl.nist.gov/div898/handbook/eda/section4/eda42a3.htm during execution and compare DOE-specific values

2. **Fatigue Life distribution comparison values**
   - What we know: Fatigue Life uses Weibull and gamma probability plots with distribution comparison
   - What's unclear: Whether NIST publishes exact Weibull/gamma parameter estimates for comparison
   - Recommendation: Fetch https://www.itl.nist.gov/div898/handbook/eda/section4/eda4293.htm during execution

3. **Beam Deflections model parameters**
   - What we know: NIST reports C=-178.786, AMP=-361.766, FREQ=0.302596, PHASE=1.46536 for sinusoidal model
   - What's unclear: Whether all four parameters are reproduced exactly in the MDX
   - Recommendation: Verify against NIST Section 1.4.2.5.3 during execution

## Sources

### Primary (HIGH confidence)
- Codebase inspection -- all file paths, component structures, and data verified by reading actual source files
- NIST e-Handbook Section 1.4.2 -- quantitative output pages fetched and values extracted for Normal Random Numbers, Beam Deflections, Standard Resistor, Cryothermometry, Heat Flow Meter
- Quick Task 011 summary -- prior validation results documented with specific findings

### Secondary (MEDIUM confidence)
- NIST URLs for unfetched case studies (Uniform Random Numbers, Filter Transmittance, Fatigue Life, Ceramic Strength) -- URL patterns confirmed by fetching adjacent sections, but specific values not yet extracted

### Tertiary (LOW confidence)
- None -- all findings based on codebase inspection and official NIST source pages

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- using existing project tooling only (Astro check/build)
- Architecture: HIGH -- validation pattern is systematic comparison, no architectural decisions
- Pitfalls: HIGH -- based on documented project decisions and prior validation findings
- NIST values: MEDIUM -- 5 of 9 case studies independently verified; remaining 4 use same URL pattern

**Research date:** 2026-02-27
**Valid until:** 2026-03-30 (stable -- validation methodology doesn't change)
