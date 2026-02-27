# Phase 64: Infrastructure Foundation - Research

**Researched:** 2026-02-27
**Domain:** Astro 5 template expansion, TypeScript module splitting, build-time KaTeX/expressive-code integration
**Confidence:** HIGH

## Summary

Phase 64 prepares the graphical technique page infrastructure so that Phases 65-68 can add content without further template or interface changes. The work has three dimensions: (1) splitting `technique-content.ts` from a 64KB monolith into per-category modules, (2) extending the `TechniqueContent` interface with 7 new optional fields, and (3) updating `[slug].astro` to render new sections (questions, importance, examples, case study cross-links) and activate the existing but unused `formula` and `code` named slots.

The critical finding is that **zero new npm packages are required**. Every technology needed -- KaTeX formula rendering, Python syntax highlighting via astro-expressive-code, conditional CSS loading, case study collection queries -- already exists in the codebase and is proven on the quantitative technique pages. The quantitative `[slug].astro` is the exact blueprint: it imports `Code` from `astro-expressive-code/components`, calls `katex.renderToString()` at build time, and fills the `formula` and `code` slots that already exist in `TechniquePage.astro`. The graphical page simply needs to adopt the same patterns.

The riskiest element is the file split (INFRA-01). The `getTechniqueContent()` public API must remain unchanged after splitting. The safest approach is per-category barrel files with a central re-exporting index that preserves the existing import path. All other requirements (INFRA-02 through INFRA-06) are direct copies of patterns already proven in the codebase.

**Primary recommendation:** Split technique-content.ts into 6 category files FIRST, then extend the interface and update the template. Verify the build after each step. Copy patterns verbatim from `src/pages/eda/quantitative/[slug].astro`.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-01 | technique-content.ts is split into manageable modules (per-category or per-group) to prevent 200KB+ monolith | Architecture pattern: barrel index with per-category modules. 7 category groups identified. Current file is 64KB/380 lines at 29 entries with 5 fields; will exceed 200KB with 12+ fields. |
| INFRA-02 | TechniqueContent interface is extended with optional fields: questions, importance, definitionExpanded, formulas, pythonCode, caseStudySlugs, examples | Exact field shapes documented. Matches QuantitativeContent precedent. All fields optional for incremental migration. |
| INFRA-03 | Graphical [slug].astro template renders new sections (Questions Answered, Importance, expanded Definition, Examples, Case Studies) in the description slot | Section rendering patterns with exact Tailwind classes documented. Matches existing prose-section styling. NIST section order established. |
| INFRA-04 | Graphical [slug].astro template activates the code slot for Python examples using astro-expressive-code Code component | Proven pattern exists in quantitative/[slug].astro lines 100-107. Import path: `import { Code } from 'astro-expressive-code/components'`. Usage: `<Code code={content.pythonCode} lang="python" />`. |
| INFRA-05 | Graphical [slug].astro template renders KaTeX formulas at build time using katex.renderToString() for techniques that have formulas | Proven pattern exists in quantitative/[slug].astro lines 43-47 and 85-98. katex@0.16.33 installed as transitive dep of rehype-katex. useKatex prop already wired in TechniquePage.astro. Conditional CSS loading via EDALayout.astro. |
| INFRA-06 | Case study cross-link resolution works at build time (technique slug to case study title + URL) | 10 case studies exist in edaPages collection. Resolution via `getCollection('edaPages')` + Map lookup. `caseStudyUrl()` helper already exists in routes.ts. Pill button styling matches existing relatedTechniques pattern. |
</phase_requirements>

## Standard Stack

### Core (Already Installed -- Zero New Packages)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `astro` | ^5.3.0 | Static site generator, named slots, `set:html`, `getStaticPaths()` | Framework of the entire site |
| `astro-expressive-code` | 0.41.6 | Python syntax highlighting via `<Code>` component | Already used for quantitative pages and beauty-index; zero client JS |
| `katex` | 0.16.33 (via rehype-katex) | `katex.renderToString()` for build-time formula HTML | Already used by 3 files: InlineMath.astro, distributions/[slug].astro, quantitative/[slug].astro |
| `typescript` | ^5.9.3 | Interface extension, type safety for TechniqueContent | Build-time only; no version sensitivity for this work |

### Supporting (Already Installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `rehype-katex` | ^7.0.1 | MDX math pipeline (provides katex as transitive dep) | Not directly used by this phase; already configured in astro.config.mjs |
| `remark-math` | ^6.0.0 | MDX math pipeline | Not directly used by this phase |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `katex.renderToString()` in .astro frontmatter | MDX with remark-math/rehype-katex pipeline | Would require converting technique content from TS objects to MDX files -- massive migration for zero benefit |
| `astro-expressive-code` `<Code>` component | Raw Shiki API or Prism | Already installed and configured; switching would lose theme consistency, copy button, line numbers |
| Separate `.py` files for Python code | Inline strings in TechniqueContent | Inline strings follow the quantitative-content.ts precedent; separate files add file-reading complexity. For 20-35 line examples, inline is fine. |

**Installation:**
```bash
# No installation needed. All packages already present.
# Optional hygiene: add katex as direct dependency
npm install katex@^0.16.33
```

## Architecture Patterns

### Recommended Project Structure After Split (INFRA-01)

```
src/lib/eda/
  technique-content/
    index.ts                    # Re-exports getTechniqueContent(), same public API
    types.ts                    # TechniqueContent interface (extended)
    time-series.ts              # 5 techniques: autocorrelation-plot, complex-demodulation, lag-plot, run-sequence-plot, spectral-plot
    distribution-shape.ts       # 9 techniques: bihistogram, bootstrap-plot, box-cox-linearity, box-cox-normality, box-plot, histogram, normal-probability-plot, probability-plot, qq-plot
    comparison.ts               # 4 techniques: block-plot, mean-plot, star-plot, youden-plot
    regression.ts               # 3 techniques: linear-plots, scatter-plot, 6-plot
    designed-experiments.ts      # 2 techniques: doe-plots, std-deviation-plot
    multivariate.ts             # 3 techniques: contour-plot, scatterplot-matrix, conditioning-plot
    combined-diagnostic.ts      # 3 techniques: ppcc-plot, weibull-plot, 4-plot
```

**Why 7 category files (not 29 per-technique files):**
- 29 individual files is excessive for content that averages 5-8KB per technique even after expansion
- Category grouping keeps related techniques together for cross-reference during content authoring
- 7 files of ~15-40KB each after full content expansion stays well under the unmanageable threshold
- Matches the natural tag-based clustering in techniques.json

### Pattern 1: Barrel Index Preserving Public API

**What:** The split creates a `technique-content/` directory with an `index.ts` that re-exports the same `getTechniqueContent()` function. Existing imports do not change.

**When to use:** Always -- this is the required approach for INFRA-01.

**Example:**

```typescript
// src/lib/eda/technique-content/index.ts
// Source: Pattern from existing codebase barrel exports

import type { TechniqueContent } from './types';
import { TIME_SERIES_CONTENT } from './time-series';
import { DISTRIBUTION_SHAPE_CONTENT } from './distribution-shape';
import { COMPARISON_CONTENT } from './comparison';
import { REGRESSION_CONTENT } from './regression';
import { DESIGNED_EXPERIMENTS_CONTENT } from './designed-experiments';
import { MULTIVARIATE_CONTENT } from './multivariate';
import { COMBINED_DIAGNOSTIC_CONTENT } from './combined-diagnostic';

export type { TechniqueContent } from './types';

const TECHNIQUE_CONTENT: Record<string, TechniqueContent> = {
  ...TIME_SERIES_CONTENT,
  ...DISTRIBUTION_SHAPE_CONTENT,
  ...COMPARISON_CONTENT,
  ...REGRESSION_CONTENT,
  ...DESIGNED_EXPERIMENTS_CONTENT,
  ...MULTIVARIATE_CONTENT,
  ...COMBINED_DIAGNOSTIC_CONTENT,
};

/**
 * Retrieve the prose content for a graphical technique by slug.
 * PUBLIC API -- identical signature to the original monolith.
 */
export function getTechniqueContent(slug: string): TechniqueContent | undefined {
  return TECHNIQUE_CONTENT[slug];
}
```

### Pattern 2: Extended Interface with Optional Fields

**What:** Add 7 new optional fields to TechniqueContent, matching the QuantitativeContent precedent.

**When to use:** INFRA-02. All new fields are optional so existing content compiles unchanged.

**Example:**

```typescript
// src/lib/eda/technique-content/types.ts
// Source: Pattern from src/lib/eda/quantitative-content.ts

export interface TechniqueContent {
  // --- Existing fields (REQUIRED, unchanged) ---
  /** 1-2 sentences: what this technique is */
  definition: string;
  /** 2-3 sentences: when and why to use it */
  purpose: string;
  /** 3-5 sentences: how to read the plot */
  interpretation: string;
  /** 1-3 sentences: key assumptions and limitations */
  assumptions: string;
  /** NIST/SEMATECH section reference string */
  nistReference: string;

  // --- New fields (ALL OPTIONAL for incremental migration) ---

  /** Questions this technique answers (NIST "Questions" section).
   *  Array of 2-9 question strings. */
  questions?: string[];

  /** Why this technique matters (NIST "Importance" section).
   *  2-4 sentences. */
  importance?: string;

  /** Expanded definition covering axis meanings, construction, math formulation. */
  definitionExpanded?: string;

  /** KaTeX formulas. Same structure as QuantitativeContent.formulas.
   *  Use String.raw for tex strings. */
  formulas?: Array<{
    label: string;
    /** KaTeX display-mode formula (MUST use String.raw) */
    tex: string;
    /** 1-2 sentences explaining the formula */
    explanation: string;
  }>;

  /** Python code example. Self-contained, 20-35 lines.
   *  Uses current matplotlib/seaborn/scipy APIs. */
  pythonCode?: string;

  /** Case study cross-references. Array of case study slugs.
   *  Resolved to titles + URLs at build time in [slug].astro. */
  caseStudySlugs?: string[];

  /** Worked example descriptions (NIST "Examples" section). */
  examples?: Array<{
    /** Short label, e.g., "Strong Positive Correlation" */
    label: string;
    /** 2-3 sentence description */
    description: string;
    /** Optional: link label for Tier B variant */
    variantLabel?: string;
  }>;
}
```

### Pattern 3: Conditional KaTeX Rendering (from quantitative/[slug].astro)

**What:** Pre-render formulas at build time, conditionally load KaTeX CSS only when formulas exist.

**When to use:** INFRA-05. Data-driven `useKatex` -- never hardcode to true.

**Example:**

```typescript
// In graphical [slug].astro frontmatter
// Source: src/pages/eda/quantitative/[slug].astro lines 9, 43-47

import katex from 'katex';

const content = getTechniqueContent(technique.slug);

// Pre-render KaTeX formulas at build time
const renderedFormulas = content?.formulas?.map(f => ({
  ...f,
  html: katex.renderToString(f.tex, { displayMode: true, throwOnError: false }),
})) ?? [];

const hasFormulas = renderedFormulas.length > 0;

// Pass to TechniquePage -- loads KaTeX CSS only when needed
// <TechniquePage ... useKatex={hasFormulas}>
```

### Pattern 4: Case Study Cross-Link Resolution (INFRA-06)

**What:** Store slugs in content, resolve to full display objects at build time via `getCollection('edaPages')`.

**When to use:** In `getStaticPaths()` of `[slug].astro`.

**Example:**

```typescript
// In getStaticPaths():
// Source: Pattern from case-studies/[...slug].astro + routes.ts

import { caseStudyUrl } from '../../../lib/eda/routes';

const caseStudyPages = await getCollection('edaPages');
const caseStudyMap = new Map(
  caseStudyPages
    .filter(p => p.data.category === 'case-studies')
    .map(p => [p.id.replace('case-studies/', ''), p.data])
);

// In per-technique props:
const caseStudyLinks = (content?.caseStudySlugs ?? [])
  .filter(slug => caseStudyMap.has(slug))
  .map(slug => ({
    slug,
    title: caseStudyMap.get(slug)!.title,
    url: caseStudyUrl(slug),
  }));
```

### Pattern 5: Python Code via Code Component (INFRA-04)

**What:** Render Python code blocks with syntax highlighting using the existing `<Code>` component.

**When to use:** When `content.pythonCode` exists.

**Example:**

```astro
{/* Source: src/pages/eda/quantitative/[slug].astro lines 100-107 */}
{content?.pythonCode && (
  <Fragment slot="code">
    <section class="prose-section mt-8">
      <h2 class="text-xl font-heading font-bold mb-3">Python Example</h2>
      <Code code={content.pythonCode} lang="python" />
    </section>
  </Fragment>
)}
```

### Anti-Patterns to Avoid

- **Creating a new TechniqueContentV2 interface:** Fragments content, requires migration code. Extend the existing interface with optional fields instead.
- **Moving content to MDX files:** Loses structural guarantees (every page has questions, assumptions). TypeScript Record pattern enforces structure.
- **Adding new named slots to TechniquePage.astro:** All 5 needed slots already exist (plot, description, formula, code, interpretation). Use them.
- **Hardcoding `useKatex={true}` on all 29 graphical pages:** Wastes ~350KB KaTeX fonts on pages with zero formulas. Compute from content: `const hasFormulas = (content?.formulas?.length ?? 0) > 0;`
- **Creating a shared TechniqueFormulas.astro component:** Only 2-3 lines of rendering logic. Over-abstraction for trivial code.
- **Merging graphical and quantitative page templates:** They share TechniquePage layout but differ in content source and plot rendering. Merging adds unnecessary coupling.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Python syntax highlighting | Custom Prism/Shiki integration | `<Code>` from `astro-expressive-code/components` | Already configured with theme, copy button, line numbers |
| Math formula rendering | Custom LaTeX parser or MathJax | `katex.renderToString()` | Already installed, proven on 3+ page types, zero client JS |
| Conditional CSS loading | Custom head management | `useKatex` prop on TechniquePage -> EDALayout -> Layout | Entire chain already wired and working |
| Case study URL generation | Manual URL string construction | `caseStudyUrl()` from `src/lib/eda/routes.ts` | Single source of truth for all EDA URL patterns |
| Content collection queries | Manual file reading | `getCollection('edaPages')` from `astro:content` | Astro's built-in content layer with type safety |
| Pill button styling for case study links | Custom CSS for link buttons | Copy existing relatedTechniques pill pattern from TechniquePage.astro | `inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 transition-colors` |

**Key insight:** Every infrastructure piece for this phase already exists in the codebase. The work is wiring proven patterns into the graphical technique template, not building new capabilities.

## Common Pitfalls

### Pitfall 1: technique-content.ts Split Breaks Existing Import

**What goes wrong:** After splitting into a directory (`technique-content/index.ts`), the import `from '../../../lib/eda/technique-content'` in `[slug].astro` might resolve to the old file instead of the new directory's index.ts, or fail entirely.
**Why it happens:** TypeScript/Node module resolution expects either `technique-content.ts` (file) OR `technique-content/index.ts` (directory) but not both at the same path.
**How to avoid:** Delete the original `technique-content.ts` file BEFORE creating `technique-content/index.ts`. The import path remains `'../../../lib/eda/technique-content'` -- TypeScript resolves this to `technique-content/index.ts` automatically. Run `astro build` immediately after the split to verify.
**Warning signs:** Build fails with "Cannot find module" error on the technique-content import.

### Pitfall 2: KaTeX CSS Not Loaded on Formula Pages

**What goes wrong:** Formulas render as garbled HTML spans without KaTeX CSS. The build succeeds, the page loads, but math looks broken.
**Why it happens:** Developer adds formula content but forgets to compute and pass `useKatex={hasFormulas}` to TechniquePage.
**How to avoid:** Make `useKatex` data-driven: `const hasFormulas = (renderedFormulas.length > 0);` and pass it to TechniquePage. Never hardcode.
**Warning signs:** `<span class="katex">` appears in page source but no KaTeX CSS in `<head>`.

### Pitfall 3: String.raw Forgotten for KaTeX tex Strings

**What goes wrong:** LaTeX commands like `\frac`, `\sum`, `\hat` are interpreted as JavaScript escape sequences, producing garbled formulas or runtime errors.
**Why it happens:** Developer uses regular template literals instead of `String.raw` for `tex` field values.
**How to avoid:** ALWAYS use `String.raw` for tex content, matching the quantitative-content.ts pattern. Add a comment in the types.ts file: `/** MUST use String.raw */`.
**Warning signs:** KaTeX warning "Unrecognized command" or "Invalid expression" in build output.

### Pitfall 4: Case Study Slug Mismatch

**What goes wrong:** A technique references a case study slug that does not match any MDX filename, producing a silent empty link set.
**Why it happens:** Case study file names ARE the slugs (e.g., `heat-flow-meter.mdx` not `heat-flow.mdx`). Easy to guess wrong.
**How to avoid:** Only use slugs from this verified list of 10 case studies: `beam-deflections`, `ceramic-strength`, `cryothermometry`, `fatigue-life`, `filter-transmittance`, `heat-flow-meter`, `normal-random-numbers`, `random-walk`, `standard-resistor`, `uniform-random-numbers`.
**Warning signs:** A technique page with `caseStudySlugs` renders no "See It In Action" section despite having slug entries.

### Pitfall 5: Python Code with Deprecated APIs

**What goes wrong:** Code examples use `seaborn.distplot()` (removed in 0.14), `vert=True` (deprecated in matplotlib 3.10), or `plt.acorr()` (missing confidence bounds).
**Why it happens:** LLM-generated Python code confidently uses outdated APIs from training data.
**How to avoid:** Grep all Python code for deprecated patterns after adding. Use this validation: `grep -E 'distplot|vert=True|plt\.acorr\(' technique-content/`. Correct alternatives: `sns.histplot()`, `orientation='vertical'`, `statsmodels.graphics.tsaplots.plot_acf()`.
**Warning signs:** Any occurrence of `distplot`, `vert=True`, or `plt.acorr(` in the content files.

### Pitfall 6: Formula Slot vs Description Slot Confusion

**What goes wrong:** Formulas are rendered in the `description` slot instead of the `formula` slot, or new prose sections are put in the `formula` slot.
**Why it happens:** The quantitative page uses the `formula` slot for KaTeX formulas. The graphical page architecture research initially suggested keeping formulas in the `formula` slot as well, which is correct for display-mode formula blocks. However, the `definitionExpanded` field with inline math should stay in the `description` slot.
**How to avoid:** Clear separation: display-mode KaTeX formula blocks (the `formulas` array) go in the `formula` slot. All prose sections (questions, importance, definitionExpanded, examples, case studies) go in the `description` slot. Python code goes in the `code` slot.
**Warning signs:** Formulas appear in the wrong position on the page relative to the section heading order.

## Code Examples

### Complete Updated [slug].astro Frontmatter

```typescript
// Source: Pattern from src/pages/eda/quantitative/[slug].astro
// adapted for graphical techniques

import { getCollection } from 'astro:content';
import { Code } from 'astro-expressive-code/components';
import katex from 'katex';
import TechniquePage from '../../../components/eda/TechniquePage.astro';
import PlotVariantSwap from '../../../components/eda/PlotVariantSwap.astro';
import { renderTechniquePlot, renderVariants } from '../../../lib/eda/technique-renderer';
import { getTechniqueContent } from '../../../lib/eda/technique-content';
import { techniqueUrl, caseStudyUrl } from '../../../lib/eda/routes';

export async function getStaticPaths() {
  const allTechniques = await getCollection('edaTechniques');
  const allTechMap = new Map(allTechniques.map(t => [t.data.slug, t.data]));
  const graphical = allTechniques
    .filter(t => t.data.category === 'graphical')
    .map(t => t.data);

  // Case study resolution map
  const caseStudyPages = await getCollection('edaPages');
  const caseStudyMap = new Map(
    caseStudyPages
      .filter(p => p.data.category === 'case-studies')
      .map(p => [p.id.replace('case-studies/', ''), p.data])
  );

  return graphical.map(technique => {
    const content = getTechniqueContent(technique.slug);
    const caseStudyLinks = (content?.caseStudySlugs ?? [])
      .filter(slug => caseStudyMap.has(slug))
      .map(slug => ({
        slug,
        title: caseStudyMap.get(slug)!.title,
        url: caseStudyUrl(slug),
      }));

    return {
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
        caseStudyLinks,
      },
    };
  });
}
```

### Case Study Pill Buttons Rendering

```astro
{/* Source: Matches relatedTechniques pattern from TechniquePage.astro lines 61-73 */}
{caseStudyLinks.length > 0 && (
  <div>
    <h2 class="text-xl font-heading font-bold mb-3">See It In Action</h2>
    <p class="text-[var(--color-text-secondary)] mb-3">
      This technique is demonstrated in the following case studies:
    </p>
    <div class="flex flex-wrap gap-3">
      {caseStudyLinks.map(cs => (
        <a href={cs.url}
           class="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 transition-colors">
          {cs.title}
        </a>
      ))}
    </div>
  </div>
)}
```

### Per-Category Content Module

```typescript
// src/lib/eda/technique-content/time-series.ts
// Source: Pattern from existing technique-content.ts structure

import type { TechniqueContent } from './types';

export const TIME_SERIES_CONTENT: Record<string, TechniqueContent> = {
  'autocorrelation-plot': {
    definition: '...existing...',
    purpose: '...existing...',
    interpretation: '...existing...',
    assumptions: '...existing...',
    nistReference: 'NIST/SEMATECH e-Handbook of Statistical Methods, Section 1.3.3.1',
    // New fields added in later phases:
    // questions: [...],
    // importance: '...',
    // formulas: [{ label: '...', tex: String.raw`...`, explanation: '...' }],
    // pythonCode: '...',
    // caseStudySlugs: ['random-walk', 'uniform-random-numbers', 'filter-transmittance'],
  },
  // ... other time-series techniques
};
```

## Section Ordering on Technique Pages

The updated description slot renders sections in this fixed order (matching NIST flow). Empty/absent sections are simply not rendered:

| Order | Section Heading | Content Field | Slot |
|-------|----------------|---------------|------|
| 1 | What It Is | `definition` + `definitionExpanded` | description |
| 2 | Questions This Plot Answers | `questions` array | description |
| 3 | Why It Matters | `importance` | description |
| 4 | When to Use It | `purpose` | description |
| 5 | How to Interpret | `interpretation` | description |
| 6 | Examples | `examples` array | description |
| 7 | Assumptions and Limitations | `assumptions` | description |
| 8 | See It In Action | `caseStudySlugs` resolved | description |
| 9 | Reference | `nistReference` | description |
| 10 | Formulas | `formulas` array via KaTeX | formula |
| 11 | Python Example | `pythonCode` via Code | code |

## Technique-to-Category Mapping (for INFRA-01 Split)

| Category File | Techniques | Count |
|---------------|------------|-------|
| `time-series.ts` | autocorrelation-plot, complex-demodulation, lag-plot, run-sequence-plot, spectral-plot | 5 |
| `distribution-shape.ts` | bihistogram, bootstrap-plot, box-cox-linearity, box-cox-normality, box-plot, histogram, normal-probability-plot, probability-plot, qq-plot | 9 |
| `comparison.ts` | block-plot, mean-plot, star-plot, youden-plot | 4 |
| `regression.ts` | linear-plots, scatter-plot, 6-plot | 3 |
| `designed-experiments.ts` | doe-plots, std-deviation-plot | 2 |
| `multivariate.ts` | contour-plot, scatterplot-matrix, conditioning-plot | 3 |
| `combined-diagnostic.ts` | ppcc-plot, weibull-plot, 4-plot | 3 |
| **Total** | | **29** |

## Existing Case Studies (for INFRA-06 Cross-Link Reference)

| Slug | Title | File |
|------|-------|------|
| `beam-deflections` | Beam Deflections Case Study | src/data/eda/pages/case-studies/beam-deflections.mdx |
| `ceramic-strength` | Ceramic Strength Case Study | src/data/eda/pages/case-studies/ceramic-strength.mdx |
| `cryothermometry` | Josephson Junction Cryothermometry | src/data/eda/pages/case-studies/cryothermometry.mdx |
| `fatigue-life` | Fatigue Life of Aluminum Alloy Specimens | src/data/eda/pages/case-studies/fatigue-life.mdx |
| `filter-transmittance` | Filter Transmittance Case Study | src/data/eda/pages/case-studies/filter-transmittance.mdx |
| `heat-flow-meter` | Heat Flow Meter 1 Case Study | src/data/eda/pages/case-studies/heat-flow-meter.mdx |
| `normal-random-numbers` | Normal Random Numbers Case Study | src/data/eda/pages/case-studies/normal-random-numbers.mdx |
| `random-walk` | Random Walk Case Study | src/data/eda/pages/case-studies/random-walk.mdx |
| `standard-resistor` | Standard Resistor Case Study | src/data/eda/pages/case-studies/standard-resistor.mdx |
| `uniform-random-numbers` | Uniform Random Numbers Case Study | src/data/eda/pages/case-studies/uniform-random-numbers.mdx |

## Existing Slot Map in TechniquePage.astro

| Slot Name | Currently Used By Graphical Pages | After Phase 64 |
|-----------|----------------------------------|----------------|
| `plot` | YES (SVG/PlotVariantSwap) | Unchanged |
| `description` | YES (4 prose sections) | Expanded to 9 sections |
| `formula` | NO (unused) | Activated for KaTeX formulas |
| `code` | NO (unused) | Activated for Python examples |
| `interpretation` | NO (unused) | Remains unused |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `seaborn.distplot()` | `seaborn.histplot()` | Seaborn 0.11 (2020), removed in 0.14 (2024) | All Python histogram examples MUST use histplot |
| `vert=True` on boxplot | `orientation='vertical'` | Matplotlib 3.10 (2024) | Box plot Python examples must use orientation param |
| `plt.acorr()` | `statsmodels.graphics.tsaplots.plot_acf()` | N/A (plt.acorr never had confidence bounds) | Autocorrelation Python example must use plot_acf |
| KaTeX as CDN link | Self-hosted `/public/styles/katex.min.css` | Site convention since v1.8 | Never CDN-link; always use local file |

**Deprecated/outdated patterns to avoid in Python examples:**
- `seaborn.distplot()` -- removed in seaborn 0.14
- `vert=True` on matplotlib boxplot -- deprecated in 3.10
- `normed=True` on matplotlib hist -- deprecated since 3.x, use `density=True`
- `plt.acorr()` for NIST-style autocorrelation -- missing confidence bounds
- `pandas.plotting.lag_plot()` -- inconsistent lag parameter; use manual scatter

## Build Verification Strategy

After each implementation step, run `astro build` and verify:

1. **After file split (INFRA-01):** Build succeeds with zero changes to rendered output. All 29 technique pages identical to before.
2. **After interface extension (INFRA-02):** Build succeeds. `astro check` passes. No visible changes (all new fields optional and empty).
3. **After template update (INFRA-03, INFRA-04, INFRA-05, INFRA-06):** Build succeeds. Adding one test technique entry with all new fields renders all new sections correctly. Removing that test entry shows no regressions.

## Open Questions

1. **Formulas in description slot vs formula slot**
   - What we know: The quantitative page uses the `formula` slot for display-mode formulas. Architecture research recommended using `formula` slot for graphical pages too.
   - What's unclear: Should the `formula` slot appear between description and code, or could embedding formulas inline in the description be better for reading flow?
   - Recommendation: Use the `formula` slot (matches quantitative precedent). The section order in TechniquePage.astro already places formula between description and code.

2. **katex as direct dependency**
   - What we know: katex 0.16.33 is a transitive dep of rehype-katex. Three existing files import it directly and it works.
   - What's unclear: Whether npm hoisting will always resolve this in future npm versions.
   - Recommendation: Optionally add `katex@^0.16.33` as a direct dependency for hygiene. Low priority -- the current setup works.

## Sources

### Primary (HIGH confidence)
- **Existing codebase** -- direct analysis of all files listed below. These are the authoritative patterns:
  - `src/lib/eda/technique-content.ts` -- 64KB, 380 lines, 29 entries, current TechniqueContent interface (5 fields)
  - `src/lib/eda/quantitative-content.ts` -- 744 lines, 18 entries, QuantitativeContent interface with formulas + pythonCode (reference architecture)
  - `src/pages/eda/quantitative/[slug].astro` -- 108 lines, proven KaTeX + Code component integration (exact blueprint to follow)
  - `src/pages/eda/techniques/[slug].astro` -- 87 lines, current graphical page template (target for modification)
  - `src/components/eda/TechniquePage.astro` -- 75 lines, 5 named slots including unused formula + code
  - `src/layouts/EDALayout.astro` -- conditional KaTeX CSS loading via useKatex prop
  - `src/lib/eda/routes.ts` -- `caseStudyUrl()` helper for URL generation
  - `src/data/eda/techniques.json` -- 29 graphical + 18 quantitative entries with tags for category grouping
  - `src/data/eda/pages/case-studies/*.mdx` -- 10 case studies with slug-based routing
  - `src/content.config.ts` -- Astro content collections including edaPages
  - `astro.config.mjs` -- expressiveCode() integration, remarkMath/rehypeKatex configured
  - `package.json` -- astro-expressive-code@^0.41.6, rehype-katex@^7.0.1

- **Project-level research** (written same day):
  - `.planning/research/STACK.md` -- Confirmed zero new npm packages, documented all integration points
  - `.planning/research/ARCHITECTURE.md` -- 5 architecture decisions with rationale, section ordering, data flow
  - `.planning/research/PITFALLS.md` -- 7 critical pitfalls with prevention strategies

### Secondary (MEDIUM confidence)
- `node_modules/katex/package.json` -- Version 0.16.33 confirmed
- `node_modules/astro-expressive-code/package.json` -- Version 0.41.6 confirmed

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Zero new packages; all verified in existing codebase and node_modules
- Architecture: HIGH - Splitting pattern is mechanical refactor; template patterns copied from quantitative pages; all slots exist
- Pitfalls: HIGH - Based on direct codebase analysis and project-level pitfalls research; deprecated API list verified

**Research date:** 2026-02-27
**Valid until:** 2026-03-27 (stable -- all findings based on installed dependencies, not external APIs)
