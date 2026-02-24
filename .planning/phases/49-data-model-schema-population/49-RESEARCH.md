# Phase 49: Data Model + Schema Population - Research

**Researched:** 2026-02-24
**Domain:** Astro content collections data population -- JSON schema population, MDX stub creation, NIST handbook data modeling, cross-link validation, sample datasets
**Confidence:** HIGH

## Summary

Phase 49 is a pure data population phase. The infrastructure is already built: Zod schemas (edaTechniqueSchema, edaDistributionSchema), three content collections (edaTechniques, edaDistributions, edaPages), and sample entries (3 techniques, 2 distributions) are validated and working from Phase 48. This phase expands those sample entries to the full data model: 48 technique entries, 19 distribution entries, 19 MDX stub files, a datasets.ts module, and a cross-link validation script.

The primary challenge is data accuracy, not code complexity. Every technique must map to the correct NIST section number, every distribution must have mathematically correct PDF/CDF formulas in KaTeX-ready LaTeX, every interactivity tier assignment must match the downstream page requirements, and every cross-linking slug must resolve to a valid route. The NIST/SEMATECH Engineering Statistics Handbook Chapter 1 is the authoritative source for all content. There are 33 graphical technique sections (1.3.3.1-1.3.3.33, consolidated into 30 entries per DATA-01), 21 quantitative technique sections (1.3.5.1-1.3.5.21, mapped to 18 entries per DATA-02), and 19 distribution sections (1.3.6.6.1-1.3.6.6.19).

The highest risk item is getting the interactivity tier assignments correct for DATA-04. Tier A (static SVG) vs Tier B (SVG variant swap) vs Tier C (D3 interactive explorer) directly determines which downstream phase handles each technique and what components are needed. Misassignment causes rework in Phases 51-53. The tier assignments are derivable from the requirements: GRAPH requirements specify variant counts and Tier B behavior; distribution pages are always Tier C; quantitative techniques are Tier A.

**Primary recommendation:** Populate JSON data files first (techniques.json, distributions.json), validate with `npm run build`, then create MDX stubs, then datasets.ts, then run a cross-link validation script. This ordering catches schema errors before creating 19 MDX files.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | techniques.json with all 30 graphical technique entries | NIST Graphical Techniques Catalog (1.3.3.1-1.3.3.33 consolidated to 30), schema fields defined in edaTechniqueSchema |
| DATA-02 | techniques.json with all 18 quantitative technique entries | NIST Quantitative Techniques Catalog (1.3.5.1-1.3.5.21 mapped to 18), same schema as graphical |
| DATA-03 | distributions.json with all 19 distribution entries | NIST Distribution Gallery (1.3.6.6.1-1.3.6.6.19), edaDistributionSchema with PDF/CDF formulas |
| DATA-04 | Each technique tagged with interactivity tier (A/B/C) and variant count | Tier Assignment Map section -- derived from GRAPH requirements |
| DATA-05 | MDX stubs for 6 foundations pages | NIST Sections 1.1.1-1.1.7 and 1.2.1-1.2.5, edaPages schema (category: foundations) |
| DATA-06 | MDX stubs for 9 case study pages | NIST Sections 1.4.2.1-1.4.2.10 (excluding 1.4.2.7), edaPages schema (category: case-studies) |
| DATA-07 | MDX stubs for 4 reference pages | NIST Sections 1.3.2, 1.3.4, 1.3.6.2-5, 1.3.6.7, edaPages schema (category: reference) |
| DATA-08 | Sample datasets in datasets.ts | NIST reference datasets (RANDN.DAT, UNIFORM.DAT, etc.), TypeScript typed arrays |
| DATA-09 | Cross-linking slug validation | Route Structure Map section, validation script pattern |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro Content Collections | 5.3.0 (installed) | `file()` loader for JSON, `glob()` for MDX | Already configured in content.config.ts from Phase 48 |
| Zod | via `astro/zod` (installed) | Schema validation for technique and distribution entries | Already defined in src/lib/eda/schema.ts from Phase 48 |
| TypeScript | 5.9.3 (installed) | Type safety for datasets.ts exports | Already configured in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node.js fs/path | built-in | Cross-link validation script | Build-time validation of slug consistency |
| `astro:content` getCollection | built-in | Querying content collections for validation | Validation script to check all entries load |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Single techniques.json | Separate graphical.json + quantitative.json | Single file is simpler; Zod validates both categories with one schema. Split only if file exceeds ~500KB (unlikely at 48 entries). |
| MDX stubs with frontmatter | JSON entries for foundations/case-studies/reference | MDX stubs allow mixing structured frontmatter with future prose content. JSON would require a different content model for pages that need rich text. |
| TypeScript datasets.ts | JSON datasets file | TypeScript provides typed exports, computed properties, and function generators. JSON would require a separate type definition and cannot compute derived values. |

**Installation:**
```bash
# No new dependencies needed -- all tools installed in Phase 48
```

## Architecture Patterns

### Data File Locations
```
src/
├── data/
│   └── eda/
│       ├── techniques.json       # 48 entries (30 graphical + 18 quantitative)
│       ├── distributions.json    # 19 entries with PDF/CDF formulas
│       ├── datasets.ts           # NEW: Sample datasets for SVG generation
│       └── pages/
│           ├── foundations/
│           │   ├── what-is-eda.mdx
│           │   ├── role-of-graphics.mdx
│           │   ├── problem-categories.mdx
│           │   ├── assumptions.mdx
│           │   ├── the-4-plot.mdx
│           │   └── when-assumptions-fail.mdx
│           ├── case-studies/
│           │   ├── normal-random-numbers.mdx
│           │   ├── uniform-random-numbers.mdx
│           │   ├── random-walk.mdx
│           │   ├── cryothermometry.mdx
│           │   ├── beam-deflections.mdx
│           │   ├── filter-transmittance.mdx
│           │   ├── heat-flow-meter.mdx
│           │   ├── fatigue-life.mdx
│           │   └── ceramic-strength.mdx
│           └── reference/
│               ├── analysis-questions.mdx
│               ├── techniques-by-category.mdx
│               ├── distribution-tables.mdx
│               └── related-distributions.mdx
├── lib/
│   └── eda/
│       ├── schema.ts             # Existing: Zod schemas
│       ├── og-cache.ts           # Existing: OG caching
│       └── routes.ts             # NEW: Route map + cross-link validator
```

### Pattern 1: JSON Technique Entry Structure
**What:** Each technique entry in techniques.json follows the edaTechniqueSchema with all required fields.
**When to use:** Every graphical and quantitative technique.
**Example:**
```json
{
  "id": "histogram",
  "title": "Histogram",
  "slug": "histogram",
  "category": "graphical",
  "section": "1.3.3.14",
  "nistSection": "1.3.3.14 Histogram",
  "description": "A histogram is a graphical summary of the frequency distribution of a single variable. It displays the shape, center, and spread of a dataset by dividing the data range into bins and counting observations in each bin.",
  "tier": "B",
  "variantCount": 4,
  "relatedTechniques": ["box-plot", "normal-probability-plot", "scatter-plot"],
  "tags": ["distribution", "shape", "frequency", "univariate"]
}
```
**Key rules:**
- `id` and `slug` are identical (kebab-case, URL-safe)
- `section` is the numeric NIST section (e.g., "1.3.3.14")
- `nistSection` is the full identifier (e.g., "1.3.3.14 Histogram")
- `relatedTechniques` contains slugs that must exist as other entries in the same file
- `tags` are lowercase kebab-case for future filtering
- `tier` must be one of "A", "B", or "C"

### Pattern 2: JSON Distribution Entry Structure
**What:** Each distribution entry follows the edaDistributionSchema with PDF/CDF formulas.
**When to use:** All 19 probability distributions.
**Example:**
```json
{
  "id": "chi-square",
  "title": "Chi-Square Distribution",
  "slug": "chi-square",
  "parameters": [
    {
      "name": "k",
      "symbol": "k",
      "min": 1,
      "max": 30,
      "default": 5,
      "step": 1
    }
  ],
  "pdfFormula": "f(x; k) = \\frac{x^{k/2 - 1} e^{-x/2}}{2^{k/2} \\Gamma(k/2)}, \\quad x > 0",
  "cdfFormula": "F(x; k) = \\frac{\\gamma(k/2, x/2)}{\\Gamma(k/2)}",
  "mean": "k",
  "variance": "2k",
  "relatedDistributions": ["normal", "gamma", "f-distribution"],
  "nistSection": "1.3.6.6.6 Chi-Square Distribution",
  "description": "The chi-square distribution with k degrees of freedom is the distribution of a sum of squares of k independent standard normal random variables."
}
```
**Key rules:**
- `pdfFormula` and `cdfFormula` are KaTeX-ready LaTeX strings (double-escaped backslashes in JSON)
- `parameters` define slider ranges for the D3 interactive explorer (min, max, default, step)
- `relatedDistributions` slugs must match other distribution entry slugs
- Parameter symbol uses LaTeX notation (e.g., "\\mu", "\\sigma", "k")

### Pattern 3: MDX Stub File Structure
**What:** Minimal MDX files with valid frontmatter that pass edaPages Zod validation.
**When to use:** Foundations, case studies, and reference pages.
**Example:**
```mdx
---
title: "What is EDA?"
description: "An introduction to Exploratory Data Analysis — what it is, how it differs from classical statistics, and why it matters for understanding data."
section: "1.1"
category: "foundations"
nistSection: "1.1.1-1.1.4"
---

{/* Content will be populated in Phase 52 (foundations) or Phase 54 (case studies, reference) */}
```
**Key rules:**
- All 5 frontmatter fields are required by the edaPages schema
- `category` must be one of: "foundations", "case-studies", "reference"
- `section` is the NIST section range
- `nistSection` is the detailed section reference
- File name matches the slug in the requirements (e.g., `what-is-eda.mdx`)
- Files are placed in category subdirectories under `src/data/eda/pages/`

### Pattern 4: Typed Dataset Module
**What:** TypeScript module exporting sample numeric arrays for SVG plot generation.
**When to use:** Phase 50 SVG generators consume these datasets.
**Example:**
```typescript
// src/data/eda/datasets.ts

/** Normal random numbers (NIST RANDN.DAT subset) */
export const normalRandom: number[] = [
  -1.276, -1.218, -0.453, -0.350, 0.723,
  0.676, -1.099, -0.314, -0.394, -0.633,
  // ... 100 values total (representative subset)
];

/** Uniform random numbers (NIST UNIFORM.DAT subset) */
export const uniformRandom: number[] = [
  0.387, 0.694, 0.130, 0.812, 0.519,
  // ... 100 values total
];

/** Bivariate data for scatter plots */
export const scatterData: { x: number; y: number }[] = [
  { x: 1.0, y: 2.1 }, { x: 2.0, y: 3.8 },
  // ... 50 pairs
];

/** Time series data for run-sequence and autocorrelation plots */
export const timeSeries: number[] = [
  9.206, 9.299, 9.277, 9.268, 9.248,
  // ... from ZARR13.DAT
];

/** Categorical data for DOE/block plots */
export const doeFactors: { factor: string; level: string; response: number }[] = [
  { factor: "A", level: "low", response: 28.5 },
  // ...
];

/** Dataset metadata for attribution */
export const DATASET_SOURCES = {
  normalRandom: { name: "RANDN.DAT", nistUrl: "https://www.itl.nist.gov/div898/handbook/eda/section4/eda4211.htm" },
  uniformRandom: { name: "UNIFORM.DAT", nistUrl: "https://www.itl.nist.gov/div898/handbook/eda/section4/eda4221.htm" },
  timeSeries: { name: "ZARR13.DAT", nistUrl: "https://www.itl.nist.gov/div898/handbook/eda/section4/eda4281.htm" },
} as const;
```

### Pattern 5: Route Map and Cross-Link Validation
**What:** A utility that defines all valid EDA routes and validates cross-link slugs.
**When to use:** After populating data files, run to verify all slugs resolve.
**Example:**
```typescript
// src/lib/eda/routes.ts

/** All valid EDA route prefixes */
export const EDA_ROUTES = {
  techniques: '/eda/techniques/',     // graphical techniques
  quantitative: '/eda/quantitative/', // quantitative techniques
  distributions: '/eda/distributions/', // probability distributions
  foundations: '/eda/foundations/',    // foundation pages
  caseStudies: '/eda/case-studies/',  // case study pages
  reference: '/eda/reference/',       // reference pages
} as const;

/** Map a technique slug to its full URL path */
export function techniqueUrl(slug: string, category: 'graphical' | 'quantitative'): string {
  const prefix = category === 'graphical'
    ? EDA_ROUTES.techniques
    : EDA_ROUTES.quantitative;
  return `${prefix}${slug}/`;
}

/** Map a distribution slug to its full URL path */
export function distributionUrl(slug: string): string {
  return `${EDA_ROUTES.distributions}${slug}/`;
}
```

### Anti-Patterns to Avoid

- **Inconsistent slug casing:** All slugs must be lowercase kebab-case. Mixing camelCase or PascalCase breaks URL resolution. Use a Zod `.regex()` refinement if needed.
- **Circular relatedTechniques:** While not technically invalid, a technique listing itself in relatedTechniques is a data error. Validate during population.
- **LaTeX in description fields:** The `description` field is plain text (used in meta tags, OG images, card text). LaTeX symbols must be written as plain English (e.g., "chi-squared" not "$\chi^2$").
- **Hardcoding NIST section numbers in page routes:** Section numbers go in the data model, not in URLs. URLs use human-readable slugs.
- **Creating empty MDX files without frontmatter:** Even stub files must have complete frontmatter to pass Zod validation at build time.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON schema validation | Manual field checking | Zod via `npm run build` (content collections) | Astro validates ALL entries on every build. Catches missing fields, wrong types, invalid enums automatically. |
| Cross-link validation | Manual slug checking | Programmatic validation script that reads techniques.json and checks all relatedTechniques slugs exist | Manual checking across 48 technique entries with 3-5 cross-links each is error-prone. Script catches all broken links in seconds. |
| NIST section number formatting | Free-text section strings | Consistent format: numeric section (e.g., "1.3.3.14") + full identifier (e.g., "1.3.3.14 Histogram") | Two separate fields prevent format drift. `section` for sorting/grouping, `nistSection` for display. |
| PDF/CDF formula authoring | Writing LaTeX from memory | Copy formulas from NIST handbook pages, verify character-by-character | Mathematical formulas have precise notation. Even small errors (wrong exponent, missing denominator term) produce incorrect distributions. |
| Slug generation | Manual slug creation | Derive from technique title: lowercase, replace spaces with hyphens, remove special chars | Eliminates slug/title mismatches. But verify against requirements URLs (some slugs like "qq-plot" differ from title "Quantile-Quantile Plot"). |

**Key insight:** This phase is data entry, not engineering. The infrastructure validates correctness automatically via Zod. The risk is data accuracy (wrong NIST sections, wrong formulas, wrong tier assignments), not code bugs.

## Common Pitfalls

### Pitfall 1: Duplicate IDs in JSON Arrays
**What goes wrong:** Two entries in techniques.json have the same `id` field. Astro's `file()` loader uses `id` as the collection entry key. Duplicates cause silent overwrites -- the second entry replaces the first.
**Why it happens:** With 48 entries, copy-paste errors are likely. Especially when creating similar entries (e.g., "box-plot" vs "block-plot", "scatter-plot" vs "scatterplot-matrix").
**How to avoid:** After populating all entries, run a validation that checks `id` uniqueness: `const ids = data.map(e => e.id); const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);`
**Warning signs:** Build succeeds but collection has fewer entries than expected. `getCollection('edaTechniques').length` returns less than 48.

### Pitfall 2: JSON Backslash Escaping in LaTeX Formulas
**What goes wrong:** LaTeX formulas in JSON require double-escaped backslashes (`\\frac` not `\frac`). Missing one backslash turns `\frac{a}{b}` into an invalid escape sequence, causing JSON parse errors.
**Why it happens:** LaTeX uses `\` for commands. JSON uses `\` for escape sequences. The formula `\frac{a}{b}` must be `"\\frac{a}{b}"` in JSON.
**How to avoid:** Always double-escape all backslashes in pdfFormula, cdfFormula, mean, variance, and parameter symbol fields. Validate by running `JSON.parse()` on the file before build.
**Warning signs:** Build error: "Unexpected token in JSON at position X". Or formulas render incorrectly in KaTeX (missing fraction bars, garbled text).

### Pitfall 3: MDX Frontmatter YAML Parsing Gotchas
**What goes wrong:** YAML frontmatter values containing colons, quotes, or hash characters break the parser.
**Why it happens:** YAML interprets `:` as key-value separator, `#` as comment, unquoted strings with special chars as errors.
**How to avoid:** Always quote string values in frontmatter that contain special characters. Use double quotes for descriptions that might contain apostrophes or colons.
**Warning signs:** Build error mentioning YAML parse failure. MDX page renders without frontmatter data.

### Pitfall 4: Mismatched Slug Between Data Files and Route Structure
**What goes wrong:** A technique's `relatedTechniques` array contains a slug like "std-deviation-plot" but the actual entry uses "standard-deviation-plot". The cross-link resolves to a 404.
**Why it happens:** Requirements use abbreviated slugs (e.g., "std-deviation-plot" in GRAPH-24 URL) while the technique title suggests "standard-deviation-plot".
**How to avoid:** Use the exact slugs from the REQUIREMENTS.md URLs as the authoritative source. Create a route map (routes.ts) and validate all cross-references against it before finalizing.
**Warning signs:** Building pages in Phase 51+ produces broken links. Cross-link validation script catches mismatches.

### Pitfall 5: Wrong Interactivity Tier Assignment
**What goes wrong:** A technique is tagged as Tier A (static SVG) but the requirements specify it should be Tier B (SVG variant swap). Discovered only when building the page in Phase 51.
**Why it happens:** Tier assignment requires reading each GRAPH requirement carefully for variant count mentions. Easy to miss "with 4 variants (Tier B)" in the requirement text.
**How to avoid:** Use the Tier Assignment Map in this research as the authoritative reference. Cross-check every Tier B assignment against the GRAPH requirements.
**Warning signs:** Phase 51 planner discovers technique needs variant swap but data model says Tier A. Requires data model correction.

### Pitfall 6: Astro file() Loader Expects JSON Array with id Field
**What goes wrong:** The `file()` loader for JSON files requires each entry to have a unique `id` field. If entries lack `id` or use a different field name, the collection fails to load.
**Why it happens:** Astro's `file()` loader convention. The `id` field is used as the entry identifier for `getEntry()` lookups.
**How to avoid:** Every entry in techniques.json and distributions.json MUST have an `id` field. The existing schema already requires it (`id: z.string()`).
**Warning signs:** Build error: "Cannot read id of undefined" or "Entry missing id field".

## NIST Data Catalog

### Graphical Techniques (30 entries per DATA-01)

The NIST handbook lists 33 graphical technique sections (1.3.3.1-1.3.3.33). The requirements consolidate some multi-section techniques into single entries:

| # | Slug | Title | NIST Section | Tier | Variants | Notes |
|---|------|-------|-------------|------|----------|-------|
| 1 | autocorrelation-plot | Autocorrelation Plot | 1.3.3.1 | B | 4 | GRAPH-07 |
| 2 | bihistogram | Bihistogram | 1.3.3.2 | A | 0 | GRAPH-13 |
| 3 | block-plot | Block Plot | 1.3.3.3 | A | 0 | GRAPH-14 |
| 4 | bootstrap-plot | Bootstrap Plot | 1.3.3.4 | A | 0 | GRAPH-15 |
| 5 | box-cox-linearity | Box-Cox Linearity Plot | 1.3.3.5 | A | 0 | GRAPH-16 |
| 6 | box-cox-normality | Box-Cox Normality Plot | 1.3.3.6 | A | 0 | GRAPH-17 |
| 7 | box-plot | Box Plot | 1.3.3.7 | A | 0 | GRAPH-02 |
| 8 | complex-demodulation | Complex Demodulation | 1.3.3.8-9 | A | 0 | GRAPH-18 (amplitude + phase combined) |
| 9 | contour-plot | Contour Plot | 1.3.3.10 | A | 0 | GRAPH-19 |
| 10 | doe-plots | DOE Plots | 1.3.3.11-13 | A | 0 | GRAPH-27 (scatter, mean, SD combined) |
| 11 | histogram | Histogram | 1.3.3.14 | B | 8 | GRAPH-01 |
| 12 | lag-plot | Lag Plot | 1.3.3.15 | B | 4 | GRAPH-06 |
| 13 | linear-plots | Linear Plots | 1.3.3.16-19 | A | 0 | GRAPH-26 (correlation, intercept, slope, residual SD) |
| 14 | mean-plot | Mean Plot | 1.3.3.20 | A | 0 | GRAPH-23 |
| 15 | normal-probability-plot | Normal Probability Plot | 1.3.3.21 | B | 4 | GRAPH-04 |
| 16 | probability-plot | Probability Plot | 1.3.3.22 | A | 0 | GRAPH-10 |
| 17 | ppcc-plot | PPCC Plot | 1.3.3.23 | A | 0 | GRAPH-25 |
| 18 | qq-plot | Q-Q Plot | 1.3.3.24 | A | 0 | GRAPH-11 |
| 19 | run-sequence-plot | Run-Sequence Plot | 1.3.3.25 | A | 0 | GRAPH-05 |
| 20 | scatter-plot | Scatter Plot | 1.3.3.26 | B | 12 | GRAPH-03 |
| 21 | spectral-plot | Spectral Plot | 1.3.3.27 | B | 3 | GRAPH-12 |
| 22 | std-deviation-plot | Standard Deviation Plot | 1.3.3.28 | A | 0 | GRAPH-24 |
| 23 | star-plot | Star Plot | 1.3.3.29 | A | 0 | GRAPH-20 |
| 24 | weibull-plot | Weibull Plot | 1.3.3.30 | A | 0 | GRAPH-21 |
| 25 | youden-plot | Youden Plot | 1.3.3.31 | A | 0 | GRAPH-22 |
| 26 | 4-plot | 4-Plot | 1.3.3.32 | A | 0 | GRAPH-08 |
| 27 | 6-plot | 6-Plot | 1.3.3.33 | A | 0 | GRAPH-09 |
| 28 | scatterplot-matrix | Scatterplot Matrix | 1.3.3.26.1 | A | 0 | GRAPH-28 (subsection of scatter plot) |
| 29 | conditioning-plot | Conditioning Plot | 1.3.3.26.2 | A | 0 | GRAPH-29 (subsection of scatter plot) |

**Count:** 29 unique entries from the mapping above. DATA-01 requires 30 graphical entries. The 30th entry likely corresponds to separating one of the consolidated NIST sections. See Open Questions section for resolution guidance.

**Tier B techniques (6 total):** histogram (8 variants), scatter-plot (12 variants), normal-probability-plot (4 variants), lag-plot (4 variants), autocorrelation-plot (4 variants), spectral-plot (3 variants). These are explicitly specified in GRAPH requirements with variant counts.

### Quantitative Techniques (18 entries per DATA-02)

| # | Slug | Title | NIST Section | Requirement |
|---|------|-------|-------------|-------------|
| 1 | measures-of-location | Measures of Location | 1.3.5.1 | QUANT-01 |
| 2 | confidence-limits | Confidence Limits for the Mean | 1.3.5.2 | QUANT-02 |
| 3 | two-sample-t-test | Two-Sample t-Test | 1.3.5.3 | QUANT-03 |
| 4 | one-factor-anova | One-Factor ANOVA | 1.3.5.4 | QUANT-04 |
| 5 | multi-factor-anova | Multi-Factor ANOVA | 1.3.5.5 | QUANT-05 |
| 6 | measures-of-scale | Measures of Scale | 1.3.5.6 | QUANT-06 |
| 7 | bartletts-test | Bartlett's Test | 1.3.5.7 | QUANT-07 |
| 8 | chi-square-sd-test | Chi-Square SD Test | 1.3.5.8 | QUANT-08 |
| 9 | f-test | F-Test | 1.3.5.9 | QUANT-09 |
| 10 | levene-test | Levene Test | 1.3.5.10 | QUANT-10 |
| 11 | skewness-kurtosis | Skewness and Kurtosis | 1.3.5.11 | QUANT-11 |
| 12 | autocorrelation | Autocorrelation | 1.3.5.12 | QUANT-12 |
| 13 | runs-test | Runs Test | 1.3.5.13 | QUANT-13 |
| 14 | anderson-darling | Anderson-Darling Test | 1.3.5.14 | QUANT-14 |
| 15 | chi-square-gof | Chi-Square Goodness-of-Fit | 1.3.5.15 | QUANT-15 |
| 16 | kolmogorov-smirnov | Kolmogorov-Smirnov Test | 1.3.5.16 | QUANT-16 |
| 17 | grubbs-test | Grubbs' Test | 1.3.5.18 | QUANT-17 |
| 18 | yates-analysis | Yates Analysis | 1.3.5.21 | QUANT-18 |

**Notes on quantitative mapping:**
- NIST has 21 quantitative sections (1.3.5.1-1.3.5.21) but requirements map to 18 entries
- NIST sections 1.3.5.17 (Detection of Outliers overview), 1.3.5.19 (Tietjen-Moore Test), and 1.3.5.20 (Generalized Extreme Deviate Test) are not included in the requirements
- All quantitative techniques are Tier A (static SVG with KaTeX formulas), no Tier B or C

### Probability Distributions (19 entries per DATA-03)

| # | Slug | Title | NIST Section | Parameters |
|---|------|-------|-------------|------------|
| 1 | normal | Normal Distribution | 1.3.6.6.1 | mu, sigma |
| 2 | uniform | Uniform Distribution | 1.3.6.6.2 | a, b |
| 3 | cauchy | Cauchy Distribution | 1.3.6.6.3 | x0, gamma |
| 4 | t-distribution | Student's t-Distribution | 1.3.6.6.4 | nu (df) |
| 5 | f-distribution | F-Distribution | 1.3.6.6.5 | d1, d2 |
| 6 | chi-square | Chi-Square Distribution | 1.3.6.6.6 | k |
| 7 | exponential | Exponential Distribution | 1.3.6.6.7 | lambda |
| 8 | weibull | Weibull Distribution | 1.3.6.6.8 | alpha, beta |
| 9 | lognormal | Lognormal Distribution | 1.3.6.6.9 | mu, sigma |
| 10 | fatigue-life | Birnbaum-Saunders Distribution | 1.3.6.6.10 | alpha, beta |
| 11 | gamma | Gamma Distribution | 1.3.6.6.11 | alpha, beta |
| 12 | double-exponential | Double Exponential Distribution | 1.3.6.6.12 | mu, beta |
| 13 | power-normal | Power Normal Distribution | 1.3.6.6.13 | p |
| 14 | power-lognormal | Power Lognormal Distribution | 1.3.6.6.14 | p, sigma |
| 15 | tukey-lambda | Tukey-Lambda Distribution | 1.3.6.6.15 | lambda |
| 16 | extreme-value | Extreme Value Type I (Gumbel) | 1.3.6.6.16 | mu, beta |
| 17 | beta | Beta Distribution | 1.3.6.6.17 | alpha, beta |
| 18 | binomial | Binomial Distribution | 1.3.6.6.18 | n, p |
| 19 | poisson | Poisson Distribution | 1.3.6.6.19 | lambda |

**Notes:**
- DIST-05 and DIST-16 both reference "Lognormal" in the requirements. REQUIREMENTS.md notes this is a duplicate. Only one entry needed in distributions.json (slug: "lognormal").
- All distributions are Tier C (D3 interactive parameter explorer). The `tier` field is not in edaDistributionSchema -- tier is implied by being a distribution.
- The `fatigue-life` slug is used for Birnbaum-Saunders to match the requirement CASE-08 naming pattern, but could also be `birnbaum-saunders`. Use the NIST common name.

### Tier Assignment Map (DATA-04)

| Tier | Description | Count | Entries |
|------|-------------|-------|---------|
| A | Static SVG only | 42 | All 18 quantitative + 24 graphical (every graphical not listed below) |
| B | SVG variant swap (PlotVariantSwap component) | 6 | histogram, scatter-plot, normal-probability-plot, lag-plot, autocorrelation-plot, spectral-plot |
| C | D3 interactive explorer | 0 in techniques.json | Distributions use separate collection (edaDistributions), not tagged in techniques |

**Derivation:** Tier B assignments come directly from GRAPH requirements that specify variant counts:
- GRAPH-01: histogram -- "8 interpretation variant sub-sections and SVG swap (Tier B)"
- GRAPH-03: scatter-plot -- "12 relationship variant sub-sections and SVG swap (Tier B)"
- GRAPH-04: normal-probability-plot -- "4 shape variants (Tier B)"
- GRAPH-06: lag-plot -- "4 variants (Tier B)"
- GRAPH-07: autocorrelation-plot -- "4 variants (Tier B)"
- GRAPH-12: spectral-plot -- "3 variants (Tier B)"

### Route Structure Map (DATA-09)

The complete route structure for cross-link validation:

| Route Pattern | Source | Count |
|--------------|--------|-------|
| `/eda/techniques/{slug}/` | techniques.json where category="graphical" | 30 |
| `/eda/quantitative/{slug}/` | techniques.json where category="quantitative" | 18 |
| `/eda/distributions/{slug}/` | distributions.json | 19 |
| `/eda/foundations/{slug}/` | edaPages where category="foundations" | 6 |
| `/eda/case-studies/{slug}/` | edaPages where category="case-studies" | 9 |
| `/eda/reference/{slug}/` | edaPages where category="reference" | 4 |
| `/eda/` | Landing page (Phase 54) | 1 |
| `/eda/distributions/` | Distribution landing (Phase 53) | 1 |

**Cross-link validation rules:**
1. Every slug in `relatedTechniques` array must exist as an entry in techniques.json
2. Every slug in `relatedDistributions` array must exist as an entry in distributions.json
3. Graphical technique slugs resolve to `/eda/techniques/{slug}/`
4. Quantitative technique slugs resolve to `/eda/quantitative/{slug}/`
5. Distribution slugs resolve to `/eda/distributions/{slug}/`
6. No technique may reference itself in relatedTechniques

### Sample Datasets (DATA-08)

Five representative chart types that need sample data:

| Chart Type | Dataset | Source | Array Type | Size |
|-----------|---------|--------|------------|------|
| Histogram | Normal random numbers | NIST RANDN.DAT | `number[]` | 100 values |
| Scatter plot | Bivariate data | Synthetic or NIST | `{x: number, y: number}[]` | 50 pairs |
| Run-sequence plot | Time series | NIST ZARR13.DAT | `number[]` | 100 values |
| Box plot | Multi-group data | Synthetic | `{group: string, values: number[]}[]` | 4 groups x 25 |
| Probability plot | Ordered normal data | NIST RANDN.DAT (sorted) | `number[]` | 100 values |

**Data requirements:**
- Arrays must be plottable immediately by SVG generators (no parsing needed)
- Include at least 5 representative chart types per success criteria
- Data sourced from NIST reference datasets where available
- Include DATASET_SOURCES metadata for attribution

## Code Examples

### Validation Script for Cross-Links
```typescript
// scripts/validate-eda-data.ts
// Run with: npx tsx scripts/validate-eda-data.ts
import { readFileSync } from 'node:fs';
import { edaTechniqueSchema, edaDistributionSchema } from '../src/lib/eda/schema';
import { z } from 'astro/zod';

const techniques = JSON.parse(readFileSync('src/data/eda/techniques.json', 'utf-8'));
const distributions = JSON.parse(readFileSync('src/data/eda/distributions.json', 'utf-8'));

// 1. Validate schemas
const techResult = z.array(edaTechniqueSchema).safeParse(techniques);
if (!techResult.success) {
  console.error('Technique schema errors:', techResult.error.format());
  process.exit(1);
}

const distResult = z.array(edaDistributionSchema).safeParse(distributions);
if (!distResult.success) {
  console.error('Distribution schema errors:', distResult.error.format());
  process.exit(1);
}

// 2. Check unique IDs
const techIds = techniques.map((t: any) => t.id);
const dupes = techIds.filter((id: string, i: number) => techIds.indexOf(id) !== i);
if (dupes.length > 0) {
  console.error('Duplicate technique IDs:', dupes);
  process.exit(1);
}

// 3. Validate cross-links
const techSlugs = new Set(techIds);
const distSlugs = new Set(distributions.map((d: any) => d.id));

let errors = 0;
for (const tech of techniques) {
  for (const related of tech.relatedTechniques) {
    if (!techSlugs.has(related)) {
      console.error(`Broken cross-link: ${tech.id} -> ${related} (not found in techniques)`);
      errors++;
    }
    if (related === tech.id) {
      console.error(`Self-reference: ${tech.id} references itself`);
      errors++;
    }
  }
}
for (const dist of distributions) {
  for (const related of dist.relatedDistributions) {
    if (!distSlugs.has(related)) {
      console.error(`Broken cross-link: ${dist.id} -> ${related} (not found in distributions)`);
      errors++;
    }
  }
}

// 4. Count check
const graphical = techniques.filter((t: any) => t.category === 'graphical').length;
const quantitative = techniques.filter((t: any) => t.category === 'quantitative').length;
console.log(`Techniques: ${graphical} graphical + ${quantitative} quantitative = ${techniques.length} total`);
console.log(`Distributions: ${distributions.length}`);
console.log(`Cross-link errors: ${errors}`);

if (errors > 0) process.exit(1);
console.log('All validations passed!');
```

### MDX Stub File Template
```mdx
---
title: "Normal Random Numbers"
description: "Case study analyzing 500 normal random numbers to demonstrate EDA when all underlying assumptions are satisfied."
section: "1.4.2"
category: "case-studies"
nistSection: "1.4.2.1 Normal Random Numbers"
---

{/* Content stub -- populated in Phase 54 */}
{/* This case study demonstrates EDA analysis on a dataset where all four */}
{/* underlying assumptions (fixed location, fixed variation, randomness, */}
{/* fixed distribution) are satisfied. Data source: NIST RANDN.DAT */}
```

### Building and Validating
```bash
# After populating all data files:

# 1. Validate JSON parses correctly
node -e "JSON.parse(require('fs').readFileSync('src/data/eda/techniques.json','utf8'))"
node -e "JSON.parse(require('fs').readFileSync('src/data/eda/distributions.json','utf8'))"

# 2. Run cross-link validation
npx tsx scripts/validate-eda-data.ts

# 3. Full Astro build validates Zod schemas
npm run build

# 4. Verify collection entry counts
npx tsx -e "
import { getCollection } from 'astro:content';
const t = await getCollection('edaTechniques');
const d = await getCollection('edaDistributions');
const p = await getCollection('edaPages');
console.log('Techniques:', t.length, '(expect 48)');
console.log('Distributions:', d.length, '(expect 19)');
console.log('Pages:', p.length, '(expect 19)');
"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate JSON files per technique | Single techniques.json with category field | Astro 5.0 file() loader (2024) | One file = one collection = one schema validation pass |
| Markdown frontmatter for all metadata | JSON for structured data, MDX for prose pages | Astro Content Layer API (2024) | JSON validates faster, supports complex nested objects (distribution parameters) |
| Manual route checking | Programmatic slug validation | Best practice for 90+ page sites | Catches broken cross-links before they ship |

**Deprecated/outdated:**
- Content Collections v1 (`type: 'content'` / `type: 'data'`): Replaced by Content Layer API with `file()` and `glob()` loaders in Astro 5.0

## Open Questions

1. **30th Graphical Technique Entry**
   - What we know: DATA-01 requires "all 30 graphical technique entries." The NIST handbook has 33 sections (1.3.3.1-1.3.3.33). After consolidation (complex demodulation 2->1, linear plots 4->1, DOE plots 3->1), there are 27 groups. Adding scatterplot-matrix and conditioning-plot from sub-sections gives 29.
   - What's unclear: Which is the 30th entry? Options include: (a) splitting one of the consolidated groups back into separate entries, (b) a conditioning-plot sub-section not yet identified, (c) the count in DATA-01 includes one of the NIST sub-sections not in the 1.3.3 range.
   - Recommendation: Check if one of the consolidated entries (DOE plots or linear plots) should be split. If not resolvable, create 29 graphical entries and note the discrepancy. The planner should verify the exact count against the GRAPH requirements (GRAPH-01 to GRAPH-29 = 29 pages, GRAPH-30 is a component). It is possible DATA-01's "30" refers to the count of GRAPH requirements (including the component), not data entries. In that case, create 29 graphical technique data entries.

2. **Distribution Slug Naming Convention**
   - What we know: Some distributions have common-name slugs (e.g., "normal", "exponential") while others have more technical names. The "Birnbaum-Saunders (Fatigue Life) Distribution" could be slug "birnbaum-saunders" or "fatigue-life".
   - What's unclear: Which naming convention to use for distributions with multiple common names.
   - Recommendation: Use the name most commonly associated with the NIST page title. For Birnbaum-Saunders, use "fatigue-life" as it aligns with NIST's alternate naming and is more recognizable. For Double Exponential, use "double-exponential" (also called Laplace). For Power Normal/Lognormal, use "power-normal" and "power-lognormal".

3. **Quantitative Technique Route Prefix**
   - What we know: Graphical techniques use `/eda/techniques/{slug}/`. The requirements show quantitative techniques at `/eda/quantitative/{slug}/`. However, both graphical and quantitative are stored in the same techniques.json.
   - What's unclear: Whether the route prefix should be derived from the `category` field in the data model, or hardcoded per page template.
   - Recommendation: The `category` field ("graphical" or "quantitative") drives the route prefix. Graphical -> `/eda/techniques/`, Quantitative -> `/eda/quantitative/`. The TechniquePage.astro component already accepts a `category` prop. Pages will use `getStaticPaths()` with category filtering.

4. **getCollection vs Direct JSON Import for Validation**
   - What we know: `getCollection('edaTechniques')` works at build time in Astro page frontmatter. It does NOT work in standalone scripts (requires Astro runtime).
   - What's unclear: How to run cross-link validation outside of the Astro build.
   - Recommendation: Use direct `JSON.parse(readFileSync(...))` with Zod in a standalone validation script (scripts/validate-eda-data.ts). The Astro build itself also validates via content collections. Both approaches catch errors, the script runs faster for iterative data entry.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/lib/eda/schema.ts` -- Verified Zod schemas with all field definitions
- Existing codebase: `src/content.config.ts` -- Content collection registrations with file() and glob() loaders
- Existing codebase: `src/data/eda/techniques.json` -- Sample entries (3) validated by Astro build
- Existing codebase: `src/data/eda/distributions.json` -- Sample entries (2) validated by Astro build
- Existing codebase: `src/components/eda/TechniquePage.astro` -- Template consuming technique data
- NIST/SEMATECH Engineering Statistics Handbook Chapter 1 -- Authoritative source for all section numbers, technique names, distribution formulas
  - [Graphical techniques index](https://www.itl.nist.gov/div898/handbook/eda/section3/eda33.htm) -- 33 sections (1.3.3.1-1.3.3.33)
  - [Quantitative techniques index](https://www.itl.nist.gov/div898/handbook/eda/section3/eda35.htm) -- 21 sections (1.3.5.1-1.3.5.21)
  - [Distribution gallery](https://www.itl.nist.gov/div898/handbook/eda/section3/eda366.htm) -- 19 distributions
  - [Case studies index](https://www.itl.nist.gov/div898/handbook/eda/section4/eda42.htm) -- 10 case studies
  - [Foundations](https://www.itl.nist.gov/div898/handbook/eda/section1/eda1.htm) -- Sections 1.1.x
  - [Assumptions](https://www.itl.nist.gov/div898/handbook/eda/section2/eda2.htm) -- Sections 1.2.x
- `.planning/REQUIREMENTS.md` -- Authoritative requirement IDs, slugs, route paths, tier assignments

### Secondary (MEDIUM confidence)
- Phase 48 Research (`48-RESEARCH.md`) -- Confirmed patterns for content collections, Zod schemas, route structure
- Phase 48 Plan 02 (`48-02-PLAN.md`) -- Confirmed file() loader pattern, schema field definitions
- NIST individual distribution pages (e.g., [Normal](https://www.itl.nist.gov/div898/handbook/eda/section3/eda3661.htm)) -- Section numbering convention verified (1.3.6.6.1 format)
- NIST case study data pages (e.g., [RANDN.DAT](https://www.itl.nist.gov/div898/handbook/eda/section4/eda4211.htm)) -- Dataset descriptions and sample values

### Tertiary (LOW confidence)
- NIST section numbers for scatterplot-matrix and conditioning-plot (1.3.3.26.1 and 1.3.3.26.2) -- Inferred from being sub-sections of scatter plot (1.3.3.26), needs verification against actual NIST page structure

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No new dependencies, all tools from Phase 48
- Architecture: HIGH -- Follows proven patterns from existing collections (Beauty Index: 25 entries, DB Compass: 12 entries), just at larger scale (48 + 19 entries)
- Data accuracy: MEDIUM -- NIST section numbers and distribution formulas verified against handbook, but the full 48-entry + 19-entry dataset needs character-by-character formula verification during implementation
- Pitfalls: HIGH -- Data entry pitfalls well-understood (JSON escaping, duplicate IDs, slug mismatches); validation patterns documented

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (data model is stable; NIST handbook content does not change)
