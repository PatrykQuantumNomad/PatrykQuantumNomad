# Phase 54: Case Studies + Reference + Landing Page - Research

**Researched:** 2026-02-25
**Domain:** Astro 5 MDX content pages, React island category filtering, NIST EDA case study walkthroughs
**Confidence:** HIGH

## Summary

Phase 54 completes the EDA Visual Encyclopedia content by delivering three distinct work streams: (1) nine case study pages that walk through EDA methodology on real NIST datasets, (2) four reference pages providing lookup tables and technique taxonomies, and (3) the master landing page at `/eda/` with a CategoryFilter.tsx React island for filterable discovery across all 90+ pages.

The codebase is exceptionally well-prepared. All nine case study MDX stubs and four reference MDX stubs already exist in `src/data/eda/pages/` with frontmatter (title, description, section, category, nistSection). The `edaPages` content collection is registered with a glob loader and Zod schema supporting `category: 'foundations' | 'case-studies' | 'reference'`. The Astro 5 `render()` pattern for MDX is proven in `src/pages/eda/foundations/[...slug].astro`. The `LanguageFilter.tsx` + nanostores pattern from beauty-index provides the exact blueprint for `CategoryFilter.tsx`. All SVG generators, datasets, route helpers (`caseStudyUrl()`, `referenceUrl()`), content modules (`technique-content.ts`, `quantitative-content.ts`), and the `thumbnail.ts` generator are already in place.

The primary work is: (1) populate the nine case study MDX files with NIST walkthrough content including embedded SVG plots via Astro component imports, (2) populate the four reference MDX files with cross-linked tables and taxonomies, (3) create `src/pages/eda/case-studies/[...slug].astro` and `src/pages/eda/reference/[...slug].astro` dynamic routes following the foundations pattern, (4) build `CategoryFilter.tsx` as a nanostores-powered React island with category pill buttons, and (5) create `src/pages/eda/index.astro` landing page that aggregates all content types into a filterable card grid with section navigation.

**Primary recommendation:** Follow the established foundations MDX rendering pattern for case studies and reference pages (collection filter + `render()` + prose-foundations class), build the landing page by aggregating all four content collections (edaTechniques, edaDistributions, edaPages) into a unified card array with category tags, and implement CategoryFilter.tsx as a simplified version of LanguageFilter.tsx using nanostores with `data-category` DOM attributes.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CASE-01 | Normal random numbers case study at /eda/case-studies/normal-random-numbers/ | MDX stub exists; needs walkthrough content with 4-plot, run-sequence, lag, histogram, probability plots + quantitative summary |
| CASE-02 | Uniform random numbers case study at /eda/case-studies/uniform-random-numbers/ | MDX stub exists; same walkthrough structure as CASE-01 |
| CASE-03 | Random walk case study at /eda/case-studies/random-walk/ | MDX stub exists; demonstrates non-random data (drift detection) |
| CASE-04 | Cryothermometry case study at /eda/case-studies/cryothermometry/ | MDX stub exists; demonstrates discreteness in measurements, outlier detection |
| CASE-05 | Beam deflections case study at /eda/case-studies/beam-deflections/ | MDX stub exists; regression analysis with scatter plot + residuals |
| CASE-06 | Filter transmittance case study at /eda/case-studies/filter-transmittance/ | MDX stub exists; multi-group comparison |
| CASE-07 | Heat flow meter case study at /eda/case-studies/heat-flow-meter/ | MDX stub exists; process stability analysis |
| CASE-08 | Fatigue life case study at /eda/case-studies/fatigue-life/ | MDX stub exists; reliability/Weibull analysis |
| CASE-09 | Ceramic strength case study at /eda/case-studies/ceramic-strength/ | MDX stub exists; multi-factor DOE with batch/lab/factor effects |
| REF-01 | Analysis questions page at /eda/reference/analysis-questions/ | MDX stub exists; 13 core EDA questions from NIST 1.3.2 |
| REF-02 | Techniques by category page at /eda/reference/techniques-by-category/ | MDX stub exists; taxonomy of techniques by 7 problem categories |
| REF-03 | Distribution tables page at /eda/reference/distribution-tables/ | MDX stub exists; critical value tables for 6 distributions |
| REF-04 | Related distributions page at /eda/reference/related-distributions/ | MDX stub exists; PDF/CDF/PPF/hazard/survival function definitions |
| LAND-01 | Landing page at /eda/ with technique card grid | Aggregates edaTechniques + edaDistributions + edaPages collections |
| LAND-02 | Category filter pills (All, Graphical, Quantitative, Distributions, Case Studies, Reference) | CategoryFilter.tsx React island following LanguageFilter.tsx pattern |
| LAND-03 | Section navigation (Foundations, Techniques, Quantitative, Distributions, Case Studies, Reference) | Anchor links to section headings within the landing page |
| LAND-04 | Responsive card grid (3-col desktop, 2-col tablet, 1-col mobile) | Tailwind grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 |
| LAND-06 | Section reference on each card | nistSection from technique/distribution/page frontmatter |
| LAND-07 | CategoryFilter.tsx React island | nanostores atom + DOM data-category toggling |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | ^5.3.0 | Static site framework with MDX rendering | Already installed; drives the build |
| react | ^19.2.4 | CategoryFilter.tsx island runtime | Already installed; proven in DistributionExplorer + LanguageFilter |
| nanostores | ^1.1.0 | Reactive state for category filter | Already installed; proven pattern in languageFilterStore.ts |
| @nanostores/react | ^1.0.0 | React bindings for nanostores | Already installed; used in LanguageFilter.tsx |
| katex | (installed) | Build-time formula rendering for case studies | Already installed; proven in quantitative/distribution pages |
| tailwindcss | ^3.4.19 | Utility CSS for card grid + responsive layout | Already installed; used throughout |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| astro-expressive-code | (installed) | Python code blocks in case studies | Case study Python examples |
| astro:content | (built-in) | Content collections for MDX + JSON | getCollection, render() for all page types |

### No New Dependencies Needed
All required libraries are already installed. No new npm installs are necessary.

## Architecture Patterns

### Recommended Project Structure
```
src/
  pages/eda/
    index.astro                           # Landing page (LAND-01 through LAND-07)
    case-studies/
      [...slug].astro                     # Dynamic route for 9 case study MDX pages
    reference/
      [...slug].astro                     # Dynamic route for 4 reference MDX pages
  components/eda/
    CategoryFilter.tsx                    # React island for landing page filtering (LAND-07)
  stores/
    categoryFilterStore.ts               # Nanostores atom for category state
  data/eda/pages/
    case-studies/
      normal-random-numbers.mdx          # (existing stub, needs content)
      uniform-random-numbers.mdx         # ...
      random-walk.mdx
      cryothermometry.mdx
      beam-deflections.mdx
      filter-transmittance.mdx
      heat-flow-meter.mdx
      fatigue-life.mdx
      ceramic-strength.mdx
    reference/
      analysis-questions.mdx             # (existing stub, needs content)
      techniques-by-category.mdx
      distribution-tables.mdx
      related-distributions.mdx
```

### Pattern 1: MDX Content Page with Astro render()
**What:** Dynamic routes that filter `edaPages` collection by category and render MDX content at build time.
**When to use:** For case study and reference pages (all MDX-based content).
**Example:**
```typescript
// Source: src/pages/eda/foundations/[...slug].astro (existing proven pattern)
import { getCollection, render } from 'astro:content';

export async function getStaticPaths() {
  const pages = await getCollection('edaPages');
  const caseStudies = pages.filter((p) => p.data.category === 'case-studies');
  return caseStudies.map((page) => ({
    params: { slug: page.id.replace('case-studies/', '') },
    props: { page },
  }));
}

const { page } = Astro.props;
const { Content } = await render(page);
```
**Key detail:** The `page.id` from the glob loader includes the subdirectory prefix (e.g., `case-studies/normal-random-numbers`), so strip the category prefix for the URL slug.

### Pattern 2: Nanostores Category Filter (LanguageFilter.tsx mirror)
**What:** React island that toggles visibility of server-rendered cards via DOM `data-category` attributes.
**When to use:** Landing page category filtering (LAND-02, LAND-07).
**Example:**
```typescript
// Source: Adapted from src/components/beauty-index/LanguageFilter.tsx
// + src/stores/languageFilterStore.ts

// categoryFilterStore.ts
import { atom } from 'nanostores';
export const activeCategory = atom<string>('all');
export function setCategory(cat: string) {
  activeCategory.set(cat);
}

// CategoryFilter.tsx
import { useState, useEffect } from 'react';
import { activeCategory, setCategory } from '../../stores/categoryFilterStore';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'graphical', label: 'Graphical' },
  { id: 'quantitative', label: 'Quantitative' },
  { id: 'distributions', label: 'Distributions' },
  { id: 'case-studies', label: 'Case Studies' },
  { id: 'reference', label: 'Reference' },
] as const;

export default function CategoryFilter() {
  const [active, setActive] = useState('all');

  useEffect(() => {
    const unsub = activeCategory.subscribe((val) => setActive(val));
    return unsub;
  }, []);

  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>('[data-category]');
    cards.forEach((card) => {
      const cat = card.dataset.category!;
      card.style.display = active === 'all' || cat === active ? '' : 'none';
    });
  }, [active]);

  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          onClick={() => setCategory(cat.id)}
          className={`px-4 py-1.5 rounded-full text-sm border transition-all ${
            active === cat.id
              ? 'border-[var(--color-accent)] text-[var(--color-accent)] font-medium'
              : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'
          }`}
          aria-pressed={active === cat.id}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
```
**Key insight:** The LanguageFilter uses multi-select (Set-based) toggling because it filters individual items. The CategoryFilter should use single-select (radio-style) because categories are mutually exclusive groups. This is simpler than LanguageFilter.

### Pattern 3: Unified Card Grid from Multiple Collections
**What:** Landing page aggregates cards from edaTechniques, edaDistributions, and edaPages into a single array with normalized fields.
**When to use:** The /eda/ index page.
**Example:**
```typescript
// In src/pages/eda/index.astro frontmatter
import { getCollection } from 'astro:content';
import { techniqueUrl, distributionUrl, caseStudyUrl, referenceUrl, foundationUrl } from '../../lib/eda/routes';
import { generateThumbnail } from '../../lib/eda/thumbnail';
import { generateDistributionCurve } from '../../lib/eda/svg-generators/distribution-curve';

interface LandingCard {
  title: string;
  url: string;
  category: string;  // matches filter pill id
  section: string;   // NIST section ref (LAND-06)
  description: string;
  thumbnail?: string; // SVG string
}

const techniques = await getCollection('edaTechniques');
const distributions = await getCollection('edaDistributions');
const pages = await getCollection('edaPages');

const cards: LandingCard[] = [
  // Graphical techniques
  ...techniques.filter(t => t.data.category === 'graphical').map(t => ({
    title: t.data.title,
    url: techniqueUrl(t.data.slug, 'graphical'),
    category: 'graphical',
    section: t.data.section,
    description: t.data.description,
    thumbnail: generateThumbnail(t.data.slug),
  })),
  // Quantitative techniques
  ...techniques.filter(t => t.data.category === 'quantitative').map(t => ({
    title: t.data.title,
    url: techniqueUrl(t.data.slug, 'quantitative'),
    category: 'quantitative',
    section: t.data.section,
    description: t.data.description,
  })),
  // Distributions
  ...distributions.map(d => ({
    title: d.data.title,
    url: distributionUrl(d.data.slug),
    category: 'distributions',
    section: d.data.nistSection.match(/[\d.]+/)?.[0] ?? '',
    description: d.data.description,
    thumbnail: generateDistributionCurve({
      type: 'pdf', distribution: d.data.id,
      params: Object.fromEntries(d.data.parameters.map(p => [p.name, p.default])),
      config: { width: 200, height: 140, margin: { top: 10, right: 10, bottom: 20, left: 25 } },
    }),
  })),
  // Case studies + Reference + Foundations from edaPages
  ...pages.map(p => {
    const urlFn = p.data.category === 'case-studies' ? caseStudyUrl
      : p.data.category === 'reference' ? referenceUrl
      : foundationUrl;
    const slug = p.id.replace(/^(case-studies|reference|foundations)\//, '');
    return {
      title: p.data.title,
      url: urlFn(slug),
      category: p.data.category,
      section: p.data.section,
      description: p.data.description,
    };
  }),
];
```

### Pattern 4: Case Study MDX Content Structure
**What:** Each case study MDX follows the NIST walkthrough structure: Background, Graphical Analysis (4-plot), Quantitative Analysis, Conclusion.
**When to use:** All 9 case study pages.
**Structure per case study:**
```markdown
## Background and Data
[Dataset description, source, NIST section reference, purpose]

## Graphical Output and Interpretation
### 4-Plot Overview
[Embedded SVG of the 4-plot or relevant composite plot]

### Run Sequence Plot
[SVG + interpretation of location/scale stability]

### Lag Plot
[SVG + interpretation of randomness]

### Histogram
[SVG + interpretation of distributional shape]

### Normal Probability Plot
[SVG + interpretation of normality assumption]

## Quantitative Output and Interpretation
### Summary Statistics
[KaTeX-rendered mean, std dev, etc.]

### Location Test
[Drift analysis]

### Variation Test
[Bartlett's or similar]

### Randomness Tests
[Autocorrelation, runs test]

### Distribution Test
[Anderson-Darling, PPCC]

### Outlier Detection
[Grubbs' test]

## Conclusions
[Model summary, confidence intervals, what was learned]
```

### Anti-Patterns to Avoid
- **DO NOT create separate content modules for case studies.** Unlike technique-content.ts (Phase 51 pattern), case studies are MDX-native with rich formatted content, embedded plots, and cross-links. MDX is the right format here.
- **DO NOT use `client:load` for CategoryFilter.** Use `client:visible` to avoid loading React on first paint. The filter is below the fold on the landing page.
- **DO NOT build separate landing pages per content type.** The entire point of the /eda/ landing page is unified discovery. Foundations pages should also appear on the landing page (they are edaPages with category 'foundations').
- **DO NOT hand-code SVG in MDX files.** Import and call existing SVG generators from technique-renderer.ts / distribution-curve.ts. MDX can import .astro components that render SVGs.
- **DO NOT add `foundations` to the category filter pills.** The requirements specify: All, Graphical, Quantitative, Distributions, Case Studies, Reference. Foundations pages should appear under "All" but do not need their own pill per LAND-02 spec. However, they need to be reachable via section navigation (LAND-03).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Category filter state | Custom event system or localStorage sync | nanostores atom (existing pattern) | Proven in LanguageFilter, tiny bundle, SSR-safe |
| Card visibility toggling | Complex React state managing 90+ cards | DOM data-attribute toggling via useEffect | Cards are server-rendered HTML; React only controls which are visible |
| SVG plot thumbnails | New thumbnail generators | existing `generateThumbnail()` + `generateDistributionCurve()` | Already built and proven in Phase 51 + Phase 53 |
| MDX rendering pipeline | Custom markdown processor | Astro's built-in `render()` from `astro:content` | Handles imports, components, frontmatter automatically |
| Route generation | Manual URL construction | `routes.ts` helpers (caseStudyUrl, referenceUrl, etc.) | Single source of truth, already validated |
| Responsive grid | Custom CSS grid | Tailwind `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` | Consistent with rest of site |
| Formula rendering | Client-side KaTeX | `katex.renderToString()` at build time | Zero client-side JS, proven in Phase 52 |
| Code highlighting | Custom highlighter | `Code` from `astro-expressive-code/components` | Already configured with copy button |

**Key insight:** This phase is primarily a content creation + assembly phase. Nearly all infrastructure exists. The work is populating MDX files with NIST-sourced content, creating two more dynamic routes following the exact foundations pattern, and building a landing page that aggregates existing collections.

## Common Pitfalls

### Pitfall 1: MDX Import Resolution in Glob-Loaded Collections
**What goes wrong:** MDX files in `src/data/eda/pages/` cannot use standard Astro component imports because they are loaded via glob, not from `src/content/`.
**Why it happens:** The glob loader path is `./src/data/eda/pages` which is outside the standard content directory.
**How to avoid:** For embedded SVG plots in case studies, generate SVGs in the `.astro` route file frontmatter (like distributions do) and pass them as props or inline them. Alternatively, keep MDX prose-only and render SVGs in the Astro template slots.
**Warning signs:** Build errors mentioning "Cannot find module" in MDX imports.

### Pitfall 2: page.id Prefix in Slug Extraction
**What goes wrong:** The `page.id` from the glob loader includes the subdirectory path (e.g., `case-studies/normal-random-numbers`), and using it directly as a URL slug produces double-prefixed routes.
**Why it happens:** The glob loader preserves the directory structure relative to the base path.
**How to avoid:** Always strip the category prefix: `page.id.replace('case-studies/', '')` or `page.id.replace(/^[^/]+\//, '')`.
**Warning signs:** Routes like `/eda/case-studies/case-studies/normal-random-numbers/`.

### Pitfall 3: Category Filter Hydration Mismatch
**What goes wrong:** All cards render visible on the server (correct), but when CategoryFilter hydrates, it immediately hides cards if initial state does not match.
**Why it happens:** If nanostores initializes with a category other than 'all', the useEffect fires and hides cards before the user interacts.
**How to avoid:** Initialize `activeCategory` atom with `'all'` so hydration matches server-rendered state (all cards visible). The LanguageFilter pattern already handles this correctly by starting with an empty Set then syncing.
**Warning signs:** Flash of cards disappearing on page load.

### Pitfall 4: Foundations Pages Missing from Landing Page
**What goes wrong:** The landing page only aggregates techniques, distributions, case studies, and reference pages, omitting the 6 foundations pages.
**Why it happens:** Foundations pages are in the edaPages collection but have category 'foundations', which is not one of the LAND-02 filter pills.
**How to avoid:** Include foundations pages in the card array. They appear when "All" is selected and via section navigation (LAND-03). Consider adding a "Foundations" section heading in the grid even without a dedicated filter pill.
**Warning signs:** Only 84 cards instead of 90+ on the landing page.

### Pitfall 5: Case Study SVG Embedding Strategy
**What goes wrong:** Trying to import SVG generators directly inside MDX files fails because MDX files loaded via glob have limited import resolution.
**Why it happens:** MDX rendering via `render()` in Astro does support component imports, but the build paths can be tricky with glob-loaded content.
**How to avoid:** Two viable strategies: (A) Generate all case study SVGs in the `[...slug].astro` route frontmatter and pass them as slot content around the MDX `<Content />`, or (B) Keep case study MDX purely textual and render SVGs via the Astro template. Strategy B is simpler and matches the quantitative page pattern where formulas are rendered in the .astro file.
**Warning signs:** Build errors in MDX component resolution.

### Pitfall 6: Landing Page Build Performance with 90+ Thumbnails
**What goes wrong:** Generating 90+ SVG thumbnails at build time causes noticeable build slowdown.
**Why it happens:** Each `generateThumbnail()` and `generateDistributionCurve()` call does CPU-intensive SVG generation.
**How to avoid:** These generators are already optimized (pure math, no I/O). Build time should be acceptable. If needed, thumbnails for techniques are already generated in Phase 51 -- the landing page just reuses them. Only new thumbnails are for distributions (19, already proven fast in Phase 53 landing page).
**Warning signs:** Build time exceeding 60 seconds.

### Pitfall 7: Quantitative Technique Thumbnails on Landing Page
**What goes wrong:** Quantitative techniques have no SVG generator (they are formula-based, not graphical), so `generateThumbnail()` returns empty string.
**Why it happens:** Only graphical techniques have SVG plot generators. Quantitative techniques use KaTeX formulas as their primary visual.
**How to avoid:** Design the card component to gracefully handle cards without thumbnails. Use a formula icon or text-only card variant for quantitative techniques. Same for case studies and reference pages.
**Warning signs:** Empty thumbnail containers on quantitative/case-study/reference cards.

## Code Examples

### Case Study Dynamic Route
```typescript
// src/pages/eda/case-studies/[...slug].astro
// Follows exact pattern from src/pages/eda/foundations/[...slug].astro
import { getCollection, render } from 'astro:content';
import EDALayout from '../../../layouts/EDALayout.astro';
import EdaBreadcrumb from '../../../components/eda/EdaBreadcrumb.astro';
import BreadcrumbJsonLd from '../../../components/BreadcrumbJsonLd.astro';

export async function getStaticPaths() {
  const pages = await getCollection('edaPages');
  const caseStudies = pages.filter((p) => p.data.category === 'case-studies');
  return caseStudies.map((page) => ({
    params: { slug: page.id.replace('case-studies/', '') },
    props: { page },
  }));
}

const { page } = Astro.props;
const { Content } = await render(page);
const slug = page.id.replace('case-studies/', '');
```

### Reference Dynamic Route
```typescript
// src/pages/eda/reference/[...slug].astro
// Identical pattern, filter by 'reference' category
export async function getStaticPaths() {
  const pages = await getCollection('edaPages');
  const reference = pages.filter((p) => p.data.category === 'reference');
  return reference.map((page) => ({
    params: { slug: page.id.replace('reference/', '') },
    props: { page },
  }));
}
```

### Landing Page Card Rendering with data-category
```astro
<!-- In src/pages/eda/index.astro -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {cards.map((card) => (
    <a
      href={card.url}
      data-category={card.category}
      class="group rounded-lg border border-[var(--color-border)] p-4 hover:border-[var(--color-accent)] transition-colors"
    >
      {card.thumbnail && (
        <div
          role="img"
          aria-label={`${card.title} preview`}
          class="w-full overflow-hidden mb-3"
          set:html={card.thumbnail}
        />
      )}
      <h3 class="text-base font-heading font-bold group-hover:text-[var(--color-accent)] transition-colors">
        {card.title}
      </h3>
      <p class="text-xs text-[var(--color-text-secondary)] mt-1">
        Section {card.section}
      </p>
      <p class="text-sm text-[var(--color-text-secondary)] mt-2 line-clamp-2">
        {card.description}
      </p>
    </a>
  ))}
</div>
```

### Case Study MDX Content Example (Normal Random Numbers)
```mdx
---
title: "Normal Random Numbers Case Study"
description: "EDA case study analyzing..."
section: "1.4.2"
category: "case-studies"
nistSection: "1.4.2.1 Normal Random Numbers"
---

## Background and Data

This case study demonstrates the EDA methodology on an ideal dataset:
500 standard normal random numbers (N(0,1)) from the Rand Corporation.
The purpose is to show how the standard EDA tools confirm that all
four underlying assumptions hold...

[Dataset: RANDN.DAT — NIST/SEMATECH Section 1.4.2.1]

## Graphical Output and Interpretation

### 4-Plot Diagnostic

The 4-plot simultaneously tests location stability, variation stability,
randomness, and distributional normality...

[SVG rendered in .astro template, not inline in MDX]

### Run Sequence Plot
The run sequence plot shows no significant shifts in location or scale
over time. Data points scatter randomly around the mean with no visible
trend, seasonality, or outliers...

### Lag Plot
The lag plot shows a circular scatter cloud with no discernible structure,
confirming that successive observations are statistically independent...

### Histogram
The histogram displays a roughly symmetric, bell-shaped distribution
centered near zero, consistent with the expected normal distribution...

### Normal Probability Plot
Points fall approximately along a straight line, confirming that the
normality assumption is reasonable for this dataset...

## Quantitative Output and Interpretation

### Summary Statistics

| Statistic | Value |
|-----------|-------|
| Mean | -0.003 |
| Standard Deviation | 1.021 |
| Median | -0.093 |
| Range | 6.083 |
| n | 500 |

### Location Test
Linear regression of data against run order yields slope = -0.0004
(t = -0.125), indicating no significant drift...

### Variation Test
Bartlett's test statistic = 2.374 (critical value = 7.815 at alpha = 0.05),
confirming constant variance across time intervals...

## Conclusions

All four assumptions (fixed location, fixed variation, randomness, fixed
distribution) are validated. The data are well-modeled by...
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `getEntries()` for content | `getCollection()` + `render()` | Astro 5 (2024) | Direct MDX rendering without content layer abstraction |
| Separate content directories per type | Single glob loader with category-based filtering | Phase 49 (project decision) | All MDX pages in `src/data/eda/pages/` filtered by frontmatter category |
| CSS @media for responsive grid | Tailwind responsive prefixes | Established pattern | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` |
| Multi-select filter (LanguageFilter) | Single-select category pills | Phase 54 simplification | Categories are mutually exclusive; single active state is simpler |

**Deprecated/outdated:**
- None. All patterns used in this phase are current and proven in prior phases.

## Open Questions

1. **SVG Embedding Strategy for Case Studies**
   - What we know: MDX files can contain prose, tables, links. SVG generation happens in TypeScript modules.
   - What's unclear: Whether to embed pre-rendered SVG strings in the MDX or render them in the .astro template.
   - Recommendation: Render SVGs in the `[...slug].astro` route file and place them in template slots above/around the `<Content />`. This matches the quantitative page pattern where KaTeX is rendered in .astro, not in MDX. Keep MDX purely textual. The case study page template should have slots for SVG plots at specific points in the walkthrough.

2. **Case Study Page Template Design**
   - What we know: Case studies have more structured content than foundations pages (Background, Graphical, Quantitative, Conclusions).
   - What's unclear: Whether to use TechniquePage.astro's slot pattern or foundations' simpler prose-foundations approach.
   - Recommendation: Create a new `CaseStudyPage.astro` template with named slots for each section (background, graphical, quantitative, conclusions) where SVGs can be injected, plus a default prose slot for the MDX content. Alternatively, use the simpler foundations approach and render SVGs as part of the MDX prose flow using a dedicated CaseStudyPlot.astro component.

3. **Foundations Pages on Landing Page**
   - What we know: LAND-02 specifies 6 category pills: All, Graphical, Quantitative, Distributions, Case Studies, Reference. Foundations is not listed.
   - What's unclear: Whether foundations pages should appear on the landing page at all.
   - Recommendation: Include foundations pages on the landing page. They appear when "All" is selected and in the section navigation (LAND-03 explicitly lists "Foundations"). Give them a "Foundations" section heading in the grid layout. They do not need a filter pill.

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `src/pages/eda/foundations/[...slug].astro` - proven MDX rendering pattern
- Codebase inspection: `src/components/beauty-index/LanguageFilter.tsx` - proven React filter island pattern
- Codebase inspection: `src/stores/languageFilterStore.ts` - proven nanostores state pattern
- Codebase inspection: `src/content.config.ts` - edaPages collection schema and loader
- Codebase inspection: `src/data/eda/pages/case-studies/*.mdx` - 9 existing stubs with frontmatter
- Codebase inspection: `src/data/eda/pages/reference/*.mdx` - 4 existing stubs with frontmatter
- Codebase inspection: `src/lib/eda/routes.ts` - caseStudyUrl(), referenceUrl() helpers
- Codebase inspection: `src/lib/eda/thumbnail.ts` - generateThumbnail() for technique cards
- Codebase inspection: `src/pages/eda/distributions/index.astro` - distribution landing page pattern

### Secondary (MEDIUM confidence)
- NIST/SEMATECH e-Handbook Section 1.4.2 - Case study walkthrough structure (fetched)
- NIST Section 1.4.2.1 - Normal random numbers: Background + Graphical + Quantitative sections
- NIST Section 1.3.2 - Analysis questions: 13 core EDA questions
- NIST Section 1.3.4 - Techniques by category: 7 problem categories
- NIST Section 1.3.6.7 - Distribution tables: 6 table types
- NIST Section 1.3.6.2 - Related distributions: PDF/CDF/PPF/hazard/survival definitions

### Tertiary (LOW confidence)
- None. All findings verified against codebase and NIST source material.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and proven in prior phases
- Architecture: HIGH - patterns directly mirror existing foundations/distributions code; no new patterns needed
- Pitfalls: HIGH - identified from actual codebase analysis of glob loader behavior, hydration patterns, and SVG generation constraints

**Research date:** 2026-02-25
**Valid until:** 2026-03-25 (stable; no dependency changes expected)
