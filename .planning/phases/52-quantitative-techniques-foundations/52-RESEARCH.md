# Phase 52: Quantitative Techniques + Foundations - Research

**Researched:** 2026-02-24
**Domain:** Astro MDX content pages with KaTeX formulas and Python code examples
**Confidence:** HIGH

## Summary

Phase 52 requires creating 24 content pages: 18 quantitative technique pages (each with KaTeX-rendered formulas, many with Python code examples) and 6 foundation pages (conceptual MDX content with cross-links). The infrastructure is already well-established from prior phases: remark-math@6.0.0 + rehype-katex@7.0.1 are configured in astro.config.mjs, the KaTeX CSS conditional loading pattern is proven via EDALayout.astro's `useKatex` prop, and astro-expressive-code@0.41.6 is already integrated (before MDX in the integration chain, as required).

The quantitative techniques differ fundamentally from Phase 51's graphical techniques: they have NO SVG plots and instead need KaTeX formula blocks and Python code examples. This means the planner should NOT reuse the technique-renderer.ts/technique-content.ts pattern directly. Instead, quantitative pages need a new content module (`quantitative-content.ts`) keyed by slug, containing structured prose AND formula strings. The 6 foundation pages are simpler -- they are MDX files already stubbed at `src/data/eda/pages/foundations/` and need their content populated, plus a dynamic route page at `src/pages/eda/foundations/[...slug].astro` to render them.

**Primary recommendation:** Build quantitative pages using a new `[slug].astro` route at `src/pages/eda/quantitative/[slug].astro` that filters the existing edaTechniques collection by `category === 'quantitative'`, paired with a `quantitative-content.ts` module providing prose + KaTeX formula strings + Python code blocks. Foundation pages use the existing `edaPages` collection with a new `[...slug].astro` dynamic route.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| QUANT-01 | Measures of location page with KaTeX | quantitative-content.ts entry with mean/median/mode formulas |
| QUANT-02 | Confidence limits page with KaTeX | t-distribution interval formula in KaTeX |
| QUANT-03 | Two-sample t-test page with KaTeX + Python | scipy.stats.ttest_ind code example |
| QUANT-04 | One-factor ANOVA with KaTeX + Python | scipy.stats.f_oneway code example |
| QUANT-05 | Multi-factor ANOVA with KaTeX | F-statistic, SS decomposition formulas |
| QUANT-06 | Measures of scale with KaTeX | variance/SD/range formulas |
| QUANT-07 | Bartlett's test with KaTeX + Python | scipy.stats.bartlett code example |
| QUANT-08 | Chi-square SD test with KaTeX | chi-square test statistic formula |
| QUANT-09 | F-test with KaTeX + Python | scipy.stats.levene or manual F-test |
| QUANT-10 | Levene test with KaTeX + Python | scipy.stats.levene code example |
| QUANT-11 | Skewness and kurtosis with KaTeX | g1, g2 formulas |
| QUANT-12 | Autocorrelation with KaTeX | autocorrelation coefficient formula |
| QUANT-13 | Runs test with KaTeX | expected runs / z-statistic formulas |
| QUANT-14 | Anderson-Darling with KaTeX + Python | scipy.stats.anderson code example |
| QUANT-15 | Chi-square GOF with KaTeX | chi-square GOF statistic formula |
| QUANT-16 | Kolmogorov-Smirnov with KaTeX + Python | scipy.stats.kstest code example |
| QUANT-17 | Grubbs' test with KaTeX + Python | manual Grubbs' computation example |
| QUANT-18 | Yates analysis with KaTeX | Yates algorithm table formulas |
| FOUND-01 | "What is EDA?" page | MDX stub exists, populate with NIST 1.1.1-1.1.4 content |
| FOUND-02 | "Role of Graphics" page | MDX stub exists, populate with NIST 1.1.5-1.1.6 content |
| FOUND-03 | "Problem Categories" page | MDX stub exists, populate with NIST 1.1.7 content |
| FOUND-04 | "Assumptions" page | MDX stub exists, populate with NIST 1.2.1-1.2.3 content |
| FOUND-05 | "The 4-Plot" page | MDX stub exists, populate with NIST 1.2.4 content |
| FOUND-06 | "When Assumptions Fail" page | MDX stub exists, populate with NIST 1.2.5 content |
| SITE-13 | Python code blocks with copy button | astro-expressive-code already integrated, use ```python fenced blocks |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | ^5.3.0 | Static site framework | Project's core framework |
| @astrojs/mdx | ^4.3.13 | MDX support for .mdx pages | Already configured, used by edaPages collection |
| remark-math | ^6.0.0 | Parse $...$ and $$...$$ math syntax | Already in astro.config.mjs remarkPlugins |
| rehype-katex | ^7.0.1 | Render math to KaTeX HTML at build time | Already in astro.config.mjs rehypePlugins |
| astro-expressive-code | ^0.41.6 | Code blocks with copy buttons, syntax highlighting | Already integrated before MDX in config |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @astrojs/tailwind | ^6.0.2 | Utility-first CSS | All page styling |
| katex CSS | 0.16.x (bundled via rehype-katex) | Formula styling | Loaded conditionally via EDALayout `useKatex={true}` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| rehype-katex (build-time) | Client-side KaTeX auto-render | Build-time is already working, no JS bundle needed |
| quantitative-content.ts | Inline MDX per quantitative page | TS module matches Phase 51 pattern, keeps consistency |

**Installation:** No new packages needed. All dependencies are already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── pages/eda/
│   ├── techniques/[slug].astro        # Existing graphical route (Phase 51)
│   ├── quantitative/[slug].astro      # NEW: 18 quantitative technique pages
│   └── foundations/[...slug].astro     # NEW: 6 foundation pages from edaPages collection
├── lib/eda/
│   ├── technique-renderer.ts          # Existing: graphical SVG renderers
│   ├── technique-content.ts           # Existing: graphical prose content
│   ├── quantitative-content.ts        # NEW: prose + formulas + code for 18 quant pages
│   ├── routes.ts                      # Existing: URL builders (already has quantitative/foundations)
│   └── schema.ts                      # Existing: Zod schemas
├── data/eda/
│   ├── techniques.json                # Existing: all 47 techniques (29 graphical + 18 quantitative)
│   └── pages/foundations/*.mdx        # Existing stubs: 6 foundation pages to populate
├── components/eda/
│   └── TechniquePage.astro            # Existing: page layout with formula/code slots
└── layouts/
    └── EDALayout.astro                # Existing: KaTeX conditional CSS via useKatex prop
```

### Pattern 1: Quantitative Route (mirrors graphical [slug].astro)
**What:** Dynamic route filtering edaTechniques collection by `category === 'quantitative'`
**When to use:** All 18 quantitative technique pages
**Example:**
```typescript
// src/pages/eda/quantitative/[slug].astro
import { getCollection } from 'astro:content';
import TechniquePage from '../../../components/eda/TechniquePage.astro';
import { getQuantitativeContent } from '../../../lib/eda/quantitative-content';
import { techniqueUrl } from '../../../lib/eda/routes';

export async function getStaticPaths() {
  const allTechniques = await getCollection('edaTechniques');
  const allTechMap = new Map(allTechniques.map(t => [t.data.slug, t.data]));
  const quantitative = allTechniques
    .filter(t => t.data.category === 'quantitative')
    .map(t => t.data);

  return quantitative.map(technique => ({
    params: { slug: technique.slug },
    props: {
      technique,
      relatedTechniques: technique.relatedTechniques
        .filter(slug => allTechMap.has(slug))
        .map(slug => {
          const related = allTechMap.get(slug)!;
          return {
            slug,
            name: related.title,
            url: techniqueUrl(slug, related.category),
          };
        }),
    },
  }));
}

const { technique, relatedTechniques } = Astro.props;
const content = getQuantitativeContent(technique.slug);
```

### Pattern 2: Quantitative Content Module
**What:** TypeScript module exporting prose, KaTeX formula strings, and Python code blocks per slug
**When to use:** All quantitative technique pages for structured content
**Example:**
```typescript
// src/lib/eda/quantitative-content.ts
export interface QuantitativeContent {
  definition: string;
  purpose: string;
  formulas: Array<{
    label: string;
    /** KaTeX display-mode formula string (without $$ delimiters) */
    tex: string;
    explanation: string;
  }>;
  interpretation: string;
  assumptions: string;
  /** Python code example, if applicable */
  pythonCode?: string;
  nistReference: string;
}

const QUANTITATIVE_CONTENT: Record<string, QuantitativeContent> = {
  'measures-of-location': {
    definition: 'Measures of location summarize...',
    purpose: 'Use measures of location to...',
    formulas: [
      {
        label: 'Sample Mean',
        tex: String.raw`\bar{x} = \frac{1}{n}\sum_{i=1}^{n} x_i`,
        explanation: 'The arithmetic average of all observations.',
      },
    ],
    interpretation: '...',
    assumptions: '...',
    nistReference: 'NIST/SEMATECH e-Handbook, Section 1.3.5.1',
  },
};

export function getQuantitativeContent(slug: string): QuantitativeContent | undefined {
  return QUANTITATIVE_CONTENT[slug];
}
```

### Pattern 3: KaTeX Rendering in Astro Components
**What:** Render KaTeX formulas from content module strings using build-time pipeline
**When to use:** Quantitative technique pages rendering formula blocks
**Example:**
```astro
{/* In [slug].astro - pass useKatex=true to TechniquePage */}
<TechniquePage
  title={technique.title}
  description={technique.description}
  category="Quantitative Techniques"
  nistSection={technique.nistSection}
  slug={technique.slug}
  relatedTechniques={relatedTechniques}
  useKatex={true}
>
  {content && (
    <Fragment slot="formula">
      <section class="prose-section mt-8 space-y-6">
        <h2 class="text-xl font-heading font-bold mb-3">Formulas</h2>
        {content.formulas.map(f => (
          <div class="formula-block mb-6">
            <h3 class="text-lg font-semibold mb-2">{f.label}</h3>
            <div class="katex-display-wrapper my-4">
              $${f.tex}$$
            </div>
            <p class="text-[var(--color-text-secondary)]">{f.explanation}</p>
          </div>
        ))}
      </section>
    </Fragment>
  )}

  {content?.pythonCode && (
    <Fragment slot="code">
      <section class="prose-section mt-8">
        <h2 class="text-xl font-heading font-bold mb-3">Python Example</h2>
        {/* Use set:html with a pre-formatted code block, or render via MDX */}
      </section>
    </Fragment>
  )}
</TechniquePage>
```

### Pattern 4: Foundation Pages via edaPages Collection
**What:** Dynamic catch-all route rendering MDX from the edaPages collection
**When to use:** All 6 foundation pages (and future case-studies/reference pages)
**Example:**
```typescript
// src/pages/eda/foundations/[...slug].astro
import { getCollection } from 'astro:content';
import EDALayout from '../../../layouts/EDALayout.astro';

export async function getStaticPaths() {
  const pages = await getCollection('edaPages');
  const foundations = pages.filter(p => p.data.category === 'foundations');
  return foundations.map(page => ({
    params: { slug: page.id.replace('foundations/', '') },
    props: { page },
  }));
}

const { page } = Astro.props;
const { Content } = await page.render();
```

### Pattern 5: Python Code Blocks with Copy Button
**What:** astro-expressive-code renders fenced python code blocks with automatic copy buttons
**When to use:** QUANT-03, 04, 07, 09, 10, 14, 16, 17 (pages requiring Python examples)
**Critical detail:** Since quantitative pages use .astro (not .mdx), Python code must be rendered through one of these approaches:
1. **Approach A (recommended):** Make quantitative pages .mdx files instead of .astro, allowing native fenced code blocks
2. **Approach B:** Use `set:html` with pre-formatted HTML matching expressive-code output
3. **Approach C:** Create a small Astro component that wraps `<Code>` from astro-expressive-code

**Note on approach:** The graphical technique route uses `.astro` and never needed code blocks. For quantitative pages, since they need both KaTeX AND code blocks with copy buttons, using MDX-based pages OR importing the `<Code>` component from astro-expressive-code is the cleanest path.

### Anti-Patterns to Avoid
- **Putting formulas in techniques.json:** The JSON file is for metadata (slug, category, section). Formulas and prose belong in quantitative-content.ts
- **Loading KaTeX CSS globally:** EDALayout already conditionally loads it. Always pass `useKatex={true}` rather than adding to base layout
- **Client-side KaTeX rendering:** The build-time pipeline (remark-math + rehype-katex) is already configured. Never add client-side auto-render.js
- **Duplicating TechniquePage component:** The existing TechniquePage.astro has named slots (plot, description, formula, code, interpretation) -- use the formula and code slots for quantitative pages

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Math rendering | Custom LaTeX parser | remark-math + rehype-katex (already configured) | Handles edge cases, escaping, display/inline modes |
| Code copy buttons | Custom clipboard.js integration | astro-expressive-code (already integrated) | Automatic copy button, syntax highlighting, themes |
| URL generation | Hardcoded /eda/quantitative/slug/ strings | `techniqueUrl(slug, 'quantitative')` from routes.ts | Already handles all categories centrally |
| Foundation page routing | Manual file-per-page routes | edaPages collection + dynamic [slug].astro | Collection is defined, stubs exist, glob loader handles MDX |
| KaTeX CSS loading | Global stylesheet link | EDALayout `useKatex` prop | Conditional loading prevents CSS overhead on non-math pages |

**Key insight:** Nearly all infrastructure is already built. This phase is primarily a content-creation phase, not an infrastructure phase. The risk is in KaTeX formula accuracy (character-by-character NIST fidelity) and ensuring Python code examples actually run.

## Common Pitfalls

### Pitfall 1: KaTeX Formula Escaping in .astro Files
**What goes wrong:** LaTeX backslashes like `\frac` or `\sum` get interpreted as escape sequences in template literals or JSX
**Why it happens:** Astro/JSX processes backslash characters before they reach remark-math
**How to avoid:** Use `String.raw` template literals in quantitative-content.ts for all formula strings: `tex: String.raw\`\bar{x} = \frac{1}{n}\sum_{i=1}^{n} x_i\``
**Warning signs:** Formulas render as broken text or missing characters

### Pitfall 2: KaTeX in .astro vs .mdx Files
**What goes wrong:** remark-math + rehype-katex only process Markdown/MDX content, NOT Astro template expressions
**Why it happens:** The remark/rehype pipeline runs on markdown content nodes, not on Astro component props or `set:html`
**How to avoid:** If using .astro for quantitative pages, formulas passed as component props will NOT be processed by remark-math. Either: (a) use .mdx pages, (b) pre-render KaTeX server-side using the katex npm package directly, or (c) embed formula strings in a markdown-rendered section
**Warning signs:** Raw `$$...$$` text appears on the page instead of rendered math

### Pitfall 3: astro-expressive-code Must Come Before MDX in Integrations
**What goes wrong:** Code blocks don't get copy buttons or syntax highlighting
**Why it happens:** Expressive-code needs to process code blocks before MDX compilation
**How to avoid:** Already correct in astro.config.mjs: `[expressiveCode(), mdx(), ...]` - do not reorder
**Warning signs:** Plain `<pre><code>` blocks without expressive-code styling

### Pitfall 4: Content Collection ID Structure for edaPages
**What goes wrong:** Dynamic route params don't match expected slugs
**Why it happens:** Astro glob loader uses file path relative to base as the entry ID, so `foundations/what-is-eda.mdx` has ID `foundations/what-is-eda`
**How to avoid:** In getStaticPaths, strip the `foundations/` prefix from the ID when building params: `page.id.replace('foundations/', '')`
**Warning signs:** 404 errors on foundation page URLs

### Pitfall 5: KaTeX Display Mode ($$) vs Inline ($) Confusion
**What goes wrong:** Formulas render inline when they should be display-mode, or vice versa
**Why it happens:** Single `$` = inline, double `$$` = display block. Easy to mix up in content strings
**How to avoid:** Use `$$` (display mode) for all standalone formula blocks in quantitative pages. Use `$` only for inline references like "the statistic $t$"
**Warning signs:** Large formulas squeezed into text lines, or simple symbols taking up full-width blocks

### Pitfall 6: Python Code Examples Must Be Syntactically Valid
**What goes wrong:** Copy-pasted code doesn't run, eroding user trust
**Why it happens:** Code written as illustration without testing
**How to avoid:** Every Python example should use real scipy/numpy/matplotlib function signatures. Verify import statements are correct (e.g., `from scipy import stats`, not `from scipy.stats import *`)
**Warning signs:** Wrong function names, missing imports, incorrect parameter names

## Code Examples

### KaTeX Formula in MDX (verified working - test-formulas.mdx)
```mdx
// Source: src/pages/eda/test-formulas.mdx (confirmed working)
### Sample Mean

$$\bar{x} = \frac{1}{n}\sum_{i=1}^{n} x_i$$

### t-Test Statistic

$$t = \frac{\bar{x}_1 - \bar{x}_2}{s_p\sqrt{\frac{1}{n_1} + \frac{1}{n_2}}}$$
```

### Python Code Block with Copy Button (expressive-code)
````mdx
```python
# Two-sample t-test using SciPy
import numpy as np
from scipy import stats

# Sample data
group_a = np.array([24.5, 23.8, 25.1, 22.9, 24.2])
group_b = np.array([26.3, 27.1, 25.8, 26.9, 27.5])

# Perform two-sample t-test (assuming equal variances)
t_stat, p_value = stats.ttest_ind(group_a, group_b, equal_var=True)

print(f"t-statistic: {t_stat:.4f}")
print(f"p-value: {p_value:.4f}")
```
````

### String.raw for Formula Strings in TypeScript
```typescript
// Source: Pattern for quantitative-content.ts
const formula = {
  label: 'F-Statistic',
  tex: String.raw`F = \frac{s_1^2}{s_2^2}`,
  explanation: 'Ratio of the two sample variances.',
};
```

### TechniquePage with useKatex Prop
```astro
// Source: src/components/eda/TechniquePage.astro (existing component)
// The useKatex prop is already defined in the Props interface
<TechniquePage
  title={technique.title}
  description={technique.description}
  category="Quantitative Techniques"
  nistSection={technique.nistSection}
  slug={technique.slug}
  relatedTechniques={relatedTechniques}
  useKatex={true}
>
```

### Foundation Page MDX Content Pattern
```mdx
---
title: "What is EDA?"
description: "Learn what Exploratory Data Analysis is..."
section: "1.1"
category: "foundations"
nistSection: "1.1.1-1.1.4 EDA Introduction"
---

## What is Exploratory Data Analysis?

Exploratory Data Analysis (EDA) is an approach to data analysis that
emphasizes visualization and flexible investigation of data structure...

### EDA vs. Classical Analysis

Classical statistical analysis follows a rigid sequence...

### Cross-References

See [Histogram](/eda/techniques/histogram/) for the most common EDA
graphical tool, and [Measures of Location](/eda/quantitative/measures-of-location/)
for the fundamental quantitative summary.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side KaTeX auto-render | Build-time remark-math + rehype-katex | Astro 4+ | Zero client JS for math rendering |
| Manual `<pre>` code blocks | astro-expressive-code | 2024 | Automatic copy buttons, themes, line highlighting |
| Content in individual .astro files | Content Collections with glob loader | Astro 5 | Type-safe content, automatic path handling |

**Deprecated/outdated:**
- `@astrojs/mdx` v3.x: Project uses v4.x which requires expressive-code before mdx in integration chain
- `remark-math` v5.x: Project correctly uses v6.0.0 (ESM-only, compatible with Astro 5)

## Open Questions

1. **Quantitative pages: .astro vs .mdx for the dynamic route?**
   - What we know: Graphical pages use .astro (no KaTeX needed). Quantitative pages need KaTeX + code blocks. remark-math only processes markdown content, not Astro template expressions.
   - What's unclear: Whether to use .mdx for the quantitative route file or keep .astro and find another way to render formulas
   - Recommendation: Use .astro route but store formulas in quantitative-content.ts as pre-rendered KaTeX HTML (using the `katex` npm package at build time) OR render formulas within a markdown-processed slot. Test both approaches in Wave 1 with a single page before committing to all 18.

2. **How to render KaTeX from TypeScript content strings in .astro pages?**
   - What we know: `$$...$$` works in .mdx files. In .astro files, remark-math does not process template expressions.
   - What's unclear: Best approach for dynamic KaTeX in .astro components
   - Recommendation: Install `katex` as a dev dependency and call `katex.renderToString()` at build time in the .astro frontmatter, then inject via `set:html`. This avoids the remark-math pipeline entirely and gives full control. Alternative: use the `<Content>` component from an MDX file that contains the formulas.

3. **Python code examples: which techniques need them?**
   - What we know: Requirements specify Python code for QUANT-03, 04, 07, 09, 10, 14, 16, 17 (8 of 18 pages)
   - What's unclear: Exact scipy function signatures for less common tests (Grubbs' test has no direct scipy function)
   - Recommendation: Use `scipy.stats` for all tests that have built-in functions. For Grubbs' test, implement the formula manually in numpy and note it. Verify all imports against scipy 1.12+ documentation.

## Sources

### Primary (HIGH confidence)
- Project codebase: astro.config.mjs, content.config.ts, EDALayout.astro, TechniquePage.astro -- all directly read
- Project codebase: src/pages/eda/test-formulas.mdx -- confirmed KaTeX pipeline working
- Project codebase: src/pages/eda/techniques/[slug].astro -- Phase 51 pattern directly read
- Project codebase: src/lib/eda/routes.ts -- URL builders for quantitative/ and foundations/ already exist
- Project codebase: src/data/eda/pages/foundations/*.mdx -- all 6 stubs confirmed existing

### Secondary (MEDIUM confidence)
- Package versions from package.json (astro ^5.3.0, remark-math ^6.0.0, rehype-katex ^7.0.1, astro-expressive-code ^0.41.6)
- KaTeX rendering approach (katex.renderToString for .astro files) -- standard API but needs verification of exact import

### Tertiary (LOW confidence)
- scipy.stats function signatures for Grubbs' test -- needs validation against current scipy docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all packages already installed and configured, versions verified from package.json
- Architecture: HIGH - patterns directly derived from existing Phase 51 codebase, routes.ts already has quantitative/foundations URL builders
- Pitfalls: HIGH - KaTeX escaping and .astro vs .mdx rendering behavior verified against existing test-formulas.mdx
- Content accuracy: MEDIUM - formula accuracy against NIST requires character-by-character verification during implementation

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (stable stack, no expected breaking changes)
