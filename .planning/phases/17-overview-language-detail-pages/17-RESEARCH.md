# Phase 17: Overview & Language Detail Pages - Research

**Researched:** 2026-02-17
**Domain:** Astro 5 page routing, getStaticPaths, content collections, build-time syntax highlighting, client-side table sorting, responsive layout
**Confidence:** HIGH

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| OVER-01 | Overview page at /beauty-index/ with ranking chart, scoring table, and language grid | Page routing pattern, Layout reuse, existing chart components documented below |
| OVER-02 | Scoring table sortable by individual dimensions (click column header to re-sort) | Client-side table sorting approach documented in Architecture Patterns section |
| OVER-03 | 4-tier visual grouping with color-coded sections and tier labels | Existing TIERS config, getTierByScore(), tier color infrastructure ready from Phase 16 |
| OVER-04 | All 25 radar charts displayed in overview grid, each linking to detail page | RadarChart.astro with configurable size prop, grid layout pattern documented below |
| OVER-05 | Responsive layout across mobile, tablet, and desktop | Existing responsive patterns (grid breakpoints, overflow-x-auto) documented below |
| LANG-01 | Per-language detail pages at /beauty-index/[slug]/ via getStaticPaths | getStaticPaths with content collection pattern, verified against codebase examples |
| LANG-02 | Radar chart with full 6-dimension score breakdown on each detail page | RadarChart.astro (size=300) + ScoreBreakdown.astro already built in Phase 16 |
| LANG-03 | Character sketch narrative per language | Already in languages.json as `characterSketch` field -- just render it |
| LANG-04 | Signature code snippet with syntax highlighting per language | Astro `<Code />` component from `astro:components` with Shiki; data needs to be added |
| LANG-05 | Tier badge and total score prominently displayed | TierBadge.astro (size="lg") + totalScore() from schema.ts already built |
| LANG-06 | Navigation between languages (previous/next) and back to overview | getStaticPaths prev/next pattern documented below |

</phase_requirements>

## Summary

Phase 17 builds two page types on top of the Phase 16 data foundation and chart components: an overview page at `/beauty-index/` and 25 individual language detail pages at `/beauty-index/[slug]/`. The overview page assembles three existing chart components (RankingBarChart, a scoring HTML table, and a grid of RadarChart thumbnails) into a single responsive layout with tier-grouped sections. The detail pages use `getStaticPaths` with the `languages` content collection to generate static pages for all 25 languages, each rendering a radar chart, score breakdown, tier badge, character sketch, and syntax-highlighted code snippet.

The codebase already has well-established patterns for everything this phase needs: `getStaticPaths` is used in blog/[slug].astro, blog/tags/[tag].astro, and open-graph/[...slug].png.ts. The Layout.astro component handles SEO metadata, view transitions, and responsive structure. All four Phase 16 chart components (RadarChart, RankingBarChart, TierBadge, ScoreBreakdown) are ready to use. The one genuinely new capability is client-side table sorting (OVER-02), which is the sole exception to the zero-JS chart pattern.

**Primary recommendation:** Build both page types as standard Astro pages reusing the existing Layout, content collection, and chart components. Add signature code snippets to a new `snippets.ts` data file (not languages.json) to keep concerns separated. Use Astro's built-in `<Code />` component for syntax highlighting. Implement table sorting as a minimal inline `<script>` (under 40 lines) rather than importing an external library.

## Standard Stack

### Core (Already in Project)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | ^5.3.0 | Static site generator, page routing, getStaticPaths | Already configured, all patterns established |
| astro:content | built-in | Content collections, `getCollection('languages')` | Phase 16 established `languages` collection with file() loader |
| astro:components | built-in | `<Code />` component for syntax highlighting | Uses Shiki internally, build-time HTML output, zero client JS |
| Tailwind CSS | ^3.4.19 | Responsive layout, utility classes | Already configured with custom colors, typography plugin |
| @tailwindcss/typography | ^0.5.19 | Prose styling for text content | Already installed, used by blog pages |

### Supporting (Already in Project)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| astro-expressive-code | ^0.41.6 | Code block themes (github-dark/github-light) | Already configured; `<Code />` component inherits theme config |
| GSAP + ScrollTrigger | ^3.14.2 | Optional entry animations | Existing reveal patterns, can be applied to beauty index sections |

### No New Dependencies Needed

This phase requires **zero new npm packages**. Everything is available from the existing stack:
- Page routing: Astro built-in
- Syntax highlighting: `<Code />` from `astro:components`
- Chart components: Built in Phase 16
- Table sorting: Vanilla JS inline script (~30 lines)
- Layout/styling: Existing Layout.astro + Tailwind

## Architecture Patterns

### Recommended File Structure

```
src/
  pages/
    beauty-index/
      index.astro              # Overview page (OVER-01 through OVER-05)
      [slug].astro             # Language detail pages (LANG-01 through LANG-06)
  components/
    beauty-index/
      RadarChart.astro         # [EXISTS] Reuse at size=300 (detail) and size=160 (thumbnail)
      RankingBarChart.astro    # [EXISTS] Reuse on overview
      TierBadge.astro          # [EXISTS] Reuse on both pages
      ScoreBreakdown.astro     # [EXISTS] Reuse on detail pages
      ScoringTable.astro       # [NEW] HTML table with sortable columns
      LanguageGrid.astro       # [NEW] Grid of radar chart thumbnails with links
      LanguageNav.astro        # [NEW] Previous/next navigation for detail pages
  data/
    beauty-index/
      languages.json           # [EXISTS] 25 languages with scores + characterSketch
      snippets.ts              # [NEW] Signature code snippets keyed by language id
  lib/
    beauty-index/
      schema.ts                # [EXISTS] Zod schema, totalScore(), dimensionScores()
      dimensions.ts            # [EXISTS] DIMENSIONS array
      tiers.ts                 # [EXISTS] TIERS, DIMENSION_COLORS, getTierByScore()
      radar-math.ts            # [EXISTS] Polygon math utilities
```

### Pattern 1: getStaticPaths for Language Detail Pages

**What:** Generate 25 static pages from the `languages` content collection.
**When to use:** For `/beauty-index/[slug]/` routes.

```typescript
// Source: Verified against existing src/pages/blog/[slug].astro pattern
---
import { getCollection } from 'astro:content';
import Layout from '../../layouts/Layout.astro';
import { totalScore } from '../../lib/beauty-index/schema';

export async function getStaticPaths() {
  const languages = await getCollection('languages');
  // Sort by total score descending for prev/next navigation
  const sorted = [...languages].sort(
    (a, b) => totalScore(b.data) - totalScore(a.data)
  );

  return sorted.map((entry, index) => ({
    params: { slug: entry.data.id },
    props: {
      language: entry.data,
      prev: index > 0 ? sorted[index - 1].data : null,
      next: index < sorted.length - 1 ? sorted[index + 1].data : null,
      rank: index + 1,
    },
  }));
}

const { language, prev, next, rank } = Astro.props;
---
```

**Key insight:** The `entry.data.id` field (e.g., "rust", "haskell", "fsharp") serves as the URL slug. The content collection uses `file()` loader, so `entry.id` is an auto-generated numeric index -- use `entry.data.id` instead.

**CRITICAL:** When using Astro's `file()` loader, the collection entry's `.id` is NOT the JSON object's `id` field. The `.id` is an auto-incremented string ("0", "1", "2"...). The language's actual identifier lives at `entry.data.id`. This must be used in `params.slug`.

### Pattern 2: Content Collection Data Access

**What:** How the `languages` collection works in this project.
**When to use:** Any page that needs language data.

```typescript
// Source: Verified against src/pages/beauty-index/test/radar.astro
import { getCollection } from 'astro:content';

const languages = await getCollection('languages');
// languages is CollectionEntry<'languages'>[]
// Each entry: { id: "0", data: { id: "haskell", name: "Haskell", phi: 7, ... } }

// Access the actual data:
const allLanguageData = languages.map((entry) => entry.data);
```

### Pattern 3: Client-Side Table Sorting (OVER-02)

**What:** Minimal vanilla JS for sorting an HTML table by clicking column headers.
**When to use:** The scoring table on the overview page. This is the ONE exception to zero-JS charts.

```typescript
// Inline <script> approach -- ~30 lines, no dependencies
<script>
  function initTableSort() {
    const table = document.querySelector('[data-sortable]') as HTMLTableElement;
    if (!table) return;
    const headers = table.querySelectorAll('th[data-sort]');
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    headers.forEach((header) => {
      header.addEventListener('click', () => {
        const key = (header as HTMLElement).dataset.sort!;
        const isNumeric = (header as HTMLElement).dataset.type === 'number';
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const currentDir = (header as HTMLElement).dataset.dir === 'asc' ? 'desc' : 'asc';

        // Reset all headers
        headers.forEach((h) => {
          (h as HTMLElement).dataset.dir = '';
          h.classList.remove('sort-asc', 'sort-desc');
        });
        (header as HTMLElement).dataset.dir = currentDir;
        header.classList.add(currentDir === 'asc' ? 'sort-asc' : 'sort-desc');

        rows.sort((a, b) => {
          const aVal = (a as HTMLElement).dataset[key] ?? a.querySelector(`[data-col="${key}"]`)?.textContent ?? '';
          const bVal = (b as HTMLElement).dataset[key] ?? b.querySelector(`[data-col="${key}"]`)?.textContent ?? '';
          const cmp = isNumeric
            ? Number(aVal) - Number(bVal)
            : aVal.localeCompare(bVal);
          return currentDir === 'asc' ? cmp : -cmp;
        });

        rows.forEach((row) => tbody.appendChild(row));
      });
    });
  }
  document.addEventListener('astro:page-load', initTableSort);
</script>
```

**Key design decision:** Use `data-*` attributes on `<tr>` elements to store sortable values (avoiding DOM text parsing). This keeps the sort logic simple and fast.

### Pattern 4: Astro `<Code />` Component for Syntax Highlighting

**What:** Build-time syntax highlighting for code snippets on language detail pages.
**When to use:** LANG-04 -- each language's signature code snippet.

```astro
// Source: Astro official docs (astro:components reference)
---
import { Code } from 'astro:components';
import { getSnippet } from '../../data/beauty-index/snippets';

const snippet = getSnippet(language.id);
---

{snippet && (
  <div class="rounded-xl overflow-hidden border border-[var(--color-border)]">
    <Code code={snippet.code} lang={snippet.lang} />
  </div>
)}
```

The `<Code />` component:
- Renders at build time (zero client JS)
- Uses Shiki internally (same engine as Expressive Code)
- Inherits theme from astro.config.mjs (`github-dark` / `github-light`)
- Outputs inline-styled HTML (no external CSS needed)
- Supports `lang` prop for language-specific highlighting

**IMPORTANT:** The `<Code />` component does NOT use Expressive Code features (copy button, file tabs). It produces plain syntax-highlighted `<pre><code>` output. This is ideal for our use case -- a short signature snippet, not a full code editor.

### Pattern 5: Responsive Layout (OVER-05)

**What:** The existing responsive approach used throughout the site.
**When to use:** All overview and detail page layouts.

The codebase consistently uses:
```
- max-w-{size} mx-auto px-4 sm:px-6 lg:px-8  (content containers)
- grid grid-cols-1 md:grid-cols-2 gap-{n}      (2-col layouts)
- grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5  (card grids)
- overflow-x-auto                                (wide SVG charts on mobile)
- text-{size} sm:text-{larger}                   (responsive typography)
```

For the overview page radar grid (25 thumbnails):
- Mobile: 2 columns
- Tablet: 3-4 columns
- Desktop: 5 columns

For the ranking bar chart SVG:
- Wrap in `overflow-x-auto` (already done in test page)
- SVG has fixed width=800 but scales with viewBox

### Anti-Patterns to Avoid

- **DO NOT install a charting library** (Chart.js, D3, Recharts) -- all charts are build-time SVG components from Phase 16
- **DO NOT put code snippets in languages.json** -- JSON is not the right format for multi-line code strings with escaping. Use a TypeScript data file.
- **DO NOT use an external table sorting library** -- the sorting requirement is trivial (25 rows, 8 columns, all numeric except name). A 30-line inline script is lighter than any npm dependency.
- **DO NOT use React for table sorting** -- this page should follow the Astro zero-JS-by-default pattern. The sort script uses `astro:page-load` event for view transition compatibility.
- **DO NOT use `entry.id` from file() loader as the URL slug** -- it will be "0", "1", "2", not "haskell", "rust". Always use `entry.data.id`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Syntax highlighting | Custom regex-based tokenizer | `<Code />` from `astro:components` | Shiki handles 200+ languages, handles edge cases in all grammars |
| Radar charts | New SVG math for thumbnails | RadarChart.astro with `size={160}` | Component already supports configurable size prop |
| Score computation | Inline arithmetic in templates | `totalScore()` and `dimensionScores()` from schema.ts | Centralized, tested functions |
| Tier color lookup | Hardcoded color strings | `getTierByScore()` and `getTierColor()` from tiers.ts | Single source of truth for tier boundaries and colors |
| URL generation | Manual string concatenation | Template literals with `entry.data.id` | Consistent slug pattern |

**Key insight:** Phase 16 built all the foundational utilities specifically so this phase could be assembly, not invention. The only new logic is the table sort script and the page layouts.

## Common Pitfalls

### Pitfall 1: file() Loader Entry ID Mismatch
**What goes wrong:** Using `entry.id` as the URL slug produces routes like `/beauty-index/0/` instead of `/beauty-index/haskell/`.
**Why it happens:** Astro's `file()` loader generates sequential string IDs ("0", "1", "2"...) for JSON array entries, unlike `glob()` which uses filenames.
**How to avoid:** Always use `entry.data.id` for routing params. The existing test pages already demonstrate the correct pattern: `languages.map((entry) => entry.data)`.
**Warning signs:** Routes with numeric paths in dev server.

### Pitfall 2: SVG Overflow on Mobile
**What goes wrong:** The RankingBarChart (800px wide) overflows the viewport on mobile, breaking layout.
**Why it happens:** SVG has a fixed `width` attribute that doesn't respect parent container width.
**How to avoid:** Wrap in `<div class="overflow-x-auto">` -- already demonstrated in the test/ranking.astro page. Alternatively, add `class="w-full"` and `preserveAspectRatio` to the SVG.
**Warning signs:** Horizontal scroll bars, layout shift.

### Pitfall 3: View Transition Compatibility
**What goes wrong:** Client-side sort state resets on page navigation (back button) because Astro's ClientRouter triggers full page re-render.
**Why it happens:** The `astro:page-load` event fires on every navigation, resetting the DOM to its initial server-rendered state.
**How to avoid:** Use `document.addEventListener('astro:page-load', initTableSort)` to re-attach event listeners. The sort state will reset naturally (table returns to default sort order), which is acceptable behavior.
**Warning signs:** Sort indicators disappear after using browser back button.

### Pitfall 4: Expressive Code vs `<Code />` Component Confusion
**What goes wrong:** Expecting `<Code />` to render with Expressive Code features (copy button, file name tabs, line highlighting).
**Why it happens:** Expressive Code is configured for MDX/Markdown code blocks. The `<Code />` component is a separate Astro built-in that uses Shiki directly.
**How to avoid:** For language detail pages, `<Code />` is the correct choice -- it produces clean, minimal highlighted output. Do not try to import Expressive Code components directly.
**Warning signs:** Missing copy buttons in code snippets (this is expected and desired).

### Pitfall 5: Code Snippet Data Format
**What goes wrong:** Putting multi-line code strings in JSON requires heavy escaping (`\\n`, `\\"`, `\\t`) and is error-prone.
**Why it happens:** JSON doesn't support template literals or raw strings.
**How to avoid:** Store code snippets in a TypeScript file using template literals (backticks). This allows natural multi-line strings with proper indentation.
**Warning signs:** JSON parse errors, missing newlines in rendered code.

### Pitfall 6: Previous/Next Navigation Sort Order
**What goes wrong:** Prev/next links jump between languages in a confusing order.
**Why it happens:** No consistent sort order for navigation.
**How to avoid:** Sort by total score descending (matching the ranking bar chart order). This way, "previous" means higher-ranked and "next" means lower-ranked. The navigation order matches the visual ranking.
**Warning signs:** Users confused by navigation order.

## Code Examples

### Overview Page Structure (index.astro)

```astro
// Source: Synthesized from existing codebase patterns
---
import { getCollection } from 'astro:content';
import Layout from '../../layouts/Layout.astro';
import RankingBarChart from '../../components/beauty-index/RankingBarChart.astro';
import RadarChart from '../../components/beauty-index/RadarChart.astro';
import TierBadge from '../../components/beauty-index/TierBadge.astro';
import BreadcrumbJsonLd from '../../components/BreadcrumbJsonLd.astro';
import { totalScore } from '../../lib/beauty-index/schema';
import { TIERS, DIMENSION_COLORS } from '../../lib/beauty-index/tiers';
import { DIMENSIONS } from '../../lib/beauty-index/dimensions';

const languages = await getCollection('languages');
const allData = languages.map((entry) => entry.data);
const sorted = [...allData].sort((a, b) => totalScore(b) - totalScore(a));
---

<Layout
  title="The Beauty Index — Patryk Golabek"
  description="Ranking 25 programming languages across 6 aesthetic dimensions..."
>
  <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <!-- Hero -->
    <!-- Ranking Bar Chart -->
    <!-- Scoring Table (sortable) -->
    <!-- Radar Chart Grid (25 thumbnails) -->
  </section>
  <BreadcrumbJsonLd crumbs={[
    { name: "Home", url: `${Astro.site}` },
    { name: "Beauty Index", url: `${new URL('/beauty-index/', Astro.site)}` },
  ]} />
</Layout>
```

### Scoring Table with data-* Attributes for Sorting

```astro
// Source: Synthesized pattern for client-side sort
<table data-sortable class="w-full text-sm">
  <thead>
    <tr class="border-b border-[var(--color-border)]">
      <th class="text-left py-2 cursor-pointer" data-sort="rank" data-type="number">Rank</th>
      <th class="text-left py-2 cursor-pointer" data-sort="name">Language</th>
      {DIMENSIONS.map((dim) => (
        <th class="text-center py-2 cursor-pointer" data-sort={dim.key} data-type="number" title={dim.name}>
          {dim.symbol}
        </th>
      ))}
      <th class="text-right py-2 cursor-pointer" data-sort="total" data-type="number">Total</th>
    </tr>
  </thead>
  <tbody>
    {sorted.map((lang, i) => (
      <tr
        class="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-surface-alt)]"
        data-rank={i + 1}
        data-name={lang.name}
        data-phi={lang.phi}
        data-omega={lang.omega}
        data-lambda={lang.lambda}
        data-psi={lang.psi}
        data-gamma={lang.gamma}
        data-sigma={lang.sigma}
        data-total={totalScore(lang)}
      >
        <td class="py-2">{i + 1}</td>
        <td class="py-2">
          <a href={`/beauty-index/${lang.id}/`} class="text-[var(--color-accent)] hover:underline">
            {lang.name}
          </a>
        </td>
        {DIMENSIONS.map((dim) => (
          <td class="text-center py-2" data-col={dim.key}>{lang[dim.key]}</td>
        ))}
        <td class="text-right py-2 font-semibold">{totalScore(lang)}</td>
      </tr>
    ))}
  </tbody>
</table>
```

### Snippet Data File (snippets.ts)

```typescript
// Source: Design recommendation -- TypeScript for multi-line code
export interface CodeSnippet {
  /** Language identifier for Shiki highlighting */
  lang: string;
  /** Display label (e.g., "Fibonacci in Rust") */
  label: string;
  /** The actual code string */
  code: string;
}

/** Signature code snippets keyed by language id */
export const SNIPPETS: Record<string, CodeSnippet> = {
  rust: {
    lang: 'rust',
    label: 'Pattern matching',
    code: `enum Shape {
    Circle(f64),
    Rectangle(f64, f64),
}

fn area(shape: &Shape) -> f64 {
    match shape {
        Shape::Circle(r) => std::f64::consts::PI * r * r,
        Shape::Rectangle(w, h) => w * h,
    }
}`,
  },
  haskell: {
    lang: 'haskell',
    label: 'List comprehension',
    code: `quicksort :: Ord a => [a] -> [a]
quicksort []     = []
quicksort (x:xs) = quicksort smaller ++ [x] ++ quicksort bigger
  where
    smaller = [a | a <- xs, a <= x]
    bigger  = [a | a <- xs, a > x]`,
  },
  // ... 23 more languages
};

export function getSnippet(languageId: string): CodeSnippet | undefined {
  return SNIPPETS[languageId];
}
```

### Language Detail Page with Previous/Next Navigation

```astro
// Source: Synthesized from blog/[slug].astro and tag patterns
---
import { Code } from 'astro:components';
import { getSnippet } from '../../data/beauty-index/snippets';

// In getStaticPaths, prev/next are already computed:
const { language, prev, next, rank } = Astro.props;
const snippet = getSnippet(language.id);
---

<!-- Previous/Next navigation -->
<nav class="flex items-center justify-between mt-12 pt-6 border-t border-[var(--color-border)]" aria-label="Language navigation">
  {prev ? (
    <a href={`/beauty-index/${prev.id}/`} class="text-[var(--color-accent)] hover:underline">
      &larr; {prev.name}
    </a>
  ) : <span />}

  <a href="/beauty-index/" class="text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]">
    Overview
  </a>

  {next ? (
    <a href={`/beauty-index/${next.id}/`} class="text-[var(--color-accent)] hover:underline">
      {next.name} &rarr;
    </a>
  ) : <span />}
</nav>
```

### Tier-Grouped Radar Grid

```astro
// Source: Pattern combining existing TIERS config with grid layout
---
import { TIERS } from '../../lib/beauty-index/tiers';
import { totalScore } from '../../lib/beauty-index/schema';

// Group languages by tier
const tiers = TIERS.slice().reverse(); // Beautiful first
const grouped = tiers.map((tier) => ({
  tier,
  languages: sorted.filter((lang) => lang.tier === tier.name),
}));
---

{grouped.map(({ tier, languages: tierLangs }) => (
  <div class="mb-10">
    <div class="flex items-center gap-3 mb-4">
      <h3 class="text-lg font-heading font-bold" style={`color: ${tier.color};`}>
        {tier.label}
      </h3>
      <span class="text-xs text-[var(--color-text-secondary)]">
        {tier.minScore}-{tier.maxScore} points
      </span>
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {tierLangs.map((lang) => (
        <a
          href={`/beauty-index/${lang.id}/`}
          class="flex flex-col items-center p-3 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors bg-[var(--color-surface)]"
        >
          <RadarChart language={lang} size={160} />
          <span class="text-sm font-medium mt-1">{lang.name}</span>
          <span class="text-xs text-[var(--color-text-secondary)]">{totalScore(lang)}</span>
        </a>
      ))}
    </div>
  </div>
))}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side charting (Chart.js/D3) | Build-time SVG in Astro frontmatter | Phase 16 decision | Zero JS for charts, faster page loads |
| `glob()` loader for collections | `file()` loader for JSON data | Astro 5+ | Single JSON file, Zod validation, different entry.id behavior |
| External sorting libraries | Inline vanilla JS (~30 lines) | This phase | No new dependencies, minimal JS footprint |
| Code snippets in JSON | TypeScript data file with template literals | This phase | Clean multi-line strings, no escaping |
| Shiki standalone config | Built-in `<Code />` component | Astro 4+ | Zero-config syntax highlighting in .astro files |

**Deprecated/outdated:**
- `Astro.glob()` -- replaced by content collections with `getCollection()`
- `@astrojs/prism` -- Shiki is now the default and preferred highlighter
- Code component theme config -- `<Code />` automatically inherits from astro.config.mjs markdown settings

## Open Questions

1. **Signature Code Snippet Content**
   - What we know: Each of the 25 languages needs a short, representative code snippet that showcases the language's character
   - What's unclear: The actual code content needs to be authored for all 25 languages
   - Recommendation: Create the `snippets.ts` file with all 25 entries. Each snippet should be 5-12 lines, focusing on what makes the language distinctive (pattern matching for Rust, monads for Haskell, goroutines for Go, etc.)

2. **Radar Chart Thumbnail Size**
   - What we know: RadarChart.astro accepts a `size` prop, default 300. The test page uses 280.
   - What's unclear: Optimal thumbnail size for a 5-column grid
   - Recommendation: Use `size={160}` for the overview grid thumbnails. At 5 columns in a max-w-6xl container (~1152px), each cell is ~200px wide, so 160px gives breathing room. Labels may overlap at this size -- consider a `showLabels` prop or a thumbnail variant that hides axis labels.

3. **Table Default Sort Order**
   - What we know: The table should be sortable by clicking headers
   - What's unclear: What should the default (initial) sort be?
   - Recommendation: Default to sort by total score descending (matching the ranking bar chart). This provides visual consistency between the bar chart and the table.

4. **Overview Page Section Order**
   - What we know: Need ranking chart, scoring table, and radar grid
   - What's unclear: Which order produces the best user experience
   - Recommendation: (1) Hero/intro, (2) Ranking Bar Chart (visual impact first), (3) Scoring Table (detailed data), (4) Radar Grid by tier (browsing/exploration). This follows a narrative arc: big picture -> details -> individual exploration.

5. **Radar Chart Labels at Thumbnail Size**
   - What we know: Labels at size=300 use font-size 11px and labelRadius = maxRadius + 24
   - What's unclear: Whether labels are readable/visible at size=160
   - Recommendation: Either hide labels at thumbnail size (pass a `showLabels={false}` prop) or make RadarChart accept a `compact` mode. The full labels are on the detail page, so thumbnails only need the polygon shape for visual recognition.

## Sources

### Primary (HIGH confidence)
- **Existing codebase** -- All patterns verified by reading actual source files:
  - `src/pages/blog/[slug].astro` -- getStaticPaths with content collections
  - `src/pages/blog/tags/[tag].astro` -- getStaticPaths with computed params
  - `src/pages/open-graph/[...slug].png.ts` -- getStaticPaths for API routes
  - `src/content.config.ts` -- Content collection definitions with file() loader
  - `src/pages/beauty-index/test/radar.astro` -- Language data access pattern
  - `src/components/beauty-index/*` -- All 4 chart components
  - `src/lib/beauty-index/*` -- All utility modules
  - `src/layouts/Layout.astro` -- Layout component interface
  - `src/data/beauty-index/languages.json` -- Full language data
- [Astro Syntax Highlighting docs](https://docs.astro.build/en/guides/syntax-highlighting/) -- `<Code />` component API
- [Astro Routing Reference](https://docs.astro.build/en/reference/routing-reference/) -- getStaticPaths specification
- [Astro Components Reference](https://docs.astro.build/en/reference/components-reference/) -- Code component props

### Secondary (MEDIUM confidence)
- [Astro Dynamic Routes guide](https://docs.astro.build/en/guides/routing/) -- Dynamic routing patterns
- Astro config in project (`astro.config.mjs`) -- Expressive Code theme configuration verified

### Tertiary (LOW confidence)
- None -- all findings verified against codebase or official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- everything exists in current project, no new dependencies
- Architecture: HIGH -- all patterns verified against actual codebase files, 3+ examples of each pattern
- Content collection: HIGH -- file() loader behavior verified against content.config.ts and test pages
- Syntax highlighting: HIGH -- `<Code />` component API verified against official Astro docs
- Table sorting: HIGH -- trivial requirement, vanilla JS approach is well-understood
- Pitfalls: HIGH -- based on actual codebase analysis (file() loader ID behavior, SVG overflow pattern)
- Code snippets data: MEDIUM -- recommended approach (TypeScript file) is sound but needs authoring work

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (stable -- no external dependencies, all patterns are project-internal)
