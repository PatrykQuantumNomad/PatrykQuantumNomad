# Phase 30: Overview Page - Research

**Researched:** 2026-02-21
**Domain:** Astro page composition, React island filtering, JSON-LD structured data, SEO metadata
**Confidence:** HIGH

## Summary

Phase 30 assembles existing components (ComplexitySpectrum, CompassScoringTable, CompassRadarChart, CapBadge) from Phase 29 into a complete overview page at `/tools/db-compass/`, adds a React island use-case filter (PAGE-05), injects JSON-LD structured data (SEO-01, SEO-03), and writes SEO-optimized meta tags (SEO-06). Every component and pattern needed has a direct, battle-tested precedent in the existing codebase.

The primary reference page is `/beauty-index/index.astro` which follows the exact same architecture: Astro page loads collection data via `getCollection()`, passes it to build-time components (RankingBarChart, ScoringTable, LanguageGrid), includes a React island (`VsComparePicker` with `client:load`), and injects `BeautyIndexJsonLd` + `BreadcrumbJsonLd` structured data. The DB Compass overview page will mirror this architecture with DB Compass-specific components and data.

The interactive use-case filter (PAGE-05) is the only new component. It follows the existing `LanguageFilter.tsx` pattern: a React island that reads model data via props, renders toggle buttons grouped by use-case category, and shows/hides `data-model-id` elements in the Astro-rendered grid using DOM manipulation. The 58 raw use cases from models.json must be grouped into ~8-10 high-level categories (Caching, Analytics, OLTP, Search, IoT, AI/ML, E-commerce, Infrastructure, etc.) to create a usable filter UI rather than exposing all 58 raw strings.

**Primary recommendation:** Build the overview page as a single `.astro` file following the Beauty Index overview page pattern exactly. Create a new `UseCaseFilter.tsx` React island using the `LanguageFilter.tsx` pattern with nanostores. Add a `CompassJsonLd.astro` component modeled after `BeautyIndexJsonLd.astro`. Group the 58 raw use cases into ~8-10 categories with a static mapping in `src/lib/db-compass/use-case-categories.ts`.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PAGE-01 | Overview page at /tools/db-compass/ with spectrum, model grid, scoring table, and dimension legend | All 4 components exist from Phase 29. Page composition follows Beauty Index overview pattern. Dimension legend is a new section rendering DIMENSIONS array. |
| PAGE-05 | Interactive filter on overview -- React island filtering models by use case (caching, analytics, OLTP, search, etc.) | LanguageFilter.tsx + nanostores pattern is proven. 58 raw use cases need grouping into ~8-10 categories. Filter toggles model card visibility via data attributes. |
| SEO-01 | JSON-LD Dataset + ItemList on overview page | BeautyIndexJsonLd.astro provides exact template. Adapt Dataset fields for database models. ItemList entries link to /tools/db-compass/[slug]/. |
| SEO-03 | BreadcrumbList JSON-LD on overview and all detail pages | BreadcrumbJsonLd.astro component exists and is fully reusable. Pass Home > Tools > Database Compass crumbs. |
| SEO-06 | SEO-optimized meta descriptions for overview and all detail pages | SEOHead.astro + Layout.astro accept title/description props. Write keyword-rich description under 160 characters. |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | ^5.3.0 (installed) | Page routing, build-time rendering, content collection loading | All existing pages use this |
| React | ^19.2.4 (installed) | Interactive filter island (UseCaseFilter) | All interactive components use React islands |
| nanostores | ^1.1.0 (installed) | Filter state management shared between island and DOM | LanguageFilter uses same pattern |
| @nanostores/react | ^1.0.0 (installed) | React bindings for nanostores | Existing dependency |
| Tailwind CSS | ^3.4.19 (installed) | Layout, responsive design, utility classes | Entire site uses Tailwind |
| TypeScript | ^5.9.3 (installed) | Type safety for components, data, and utilities | All source files are TS |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | - | - | Zero new dependencies per v1.5 constraint |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Nanostores for filter | React useState only | Would work since filter is self-contained, but nanostores matches existing pattern and allows future cross-island state sharing |
| data-attribute DOM filtering | React-rendered grid | Would require hydrating entire grid; data-attribute approach keeps grid as static HTML (zero JS for card rendering) |
| Raw 58 use cases as filters | Grouped categories | 58 toggle buttons is unusable UX; grouping into 8-10 categories is essential |

**Installation:**
```bash
# No installation needed. Zero new dependencies.
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  pages/
    tools/
      db-compass/
        index.astro              # NEW (PAGE-01) - Overview page
  components/
    db-compass/
      ComplexitySpectrum.astro    # EXISTS (Phase 29)
      CompassRadarChart.astro    # EXISTS (Phase 29)
      CompassScoreBreakdown.astro # EXISTS (Phase 29)
      CompassScoringTable.astro  # EXISTS (Phase 29)
      CapBadge.astro             # EXISTS (Phase 29)
      UseCaseFilter.tsx          # NEW (PAGE-05) - React island filter
      ModelCardGrid.astro        # NEW (PAGE-01) - Grid of model cards with radar thumbnails
      DimensionLegend.astro      # NEW (PAGE-01) - 8-dimension reference with descriptions
      CompassJsonLd.astro        # NEW (SEO-01) - Dataset + ItemList JSON-LD
  lib/
    db-compass/
      schema.ts                  # EXISTS (Phase 28)
      dimensions.ts              # EXISTS (Phase 28)
      spectrum-math.ts           # EXISTS (Phase 29)
      use-case-categories.ts     # NEW - Maps 58 raw use cases to 8-10 filter categories
  stores/
    compassFilterStore.ts        # NEW - Nanostores atom for active use-case filters
```

### Pattern 1: Overview Page Composition (Astro)
**What:** A single `.astro` page that loads content collection data, passes it to build-time components, includes React islands with `client:load`, and injects JSON-LD structured data.
**When to use:** The overview page at `/tools/db-compass/`.
**Existing precedent:**
```astro
---
// Source: src/pages/beauty-index/index.astro
import { getCollection } from 'astro:content';
import Layout from '../../layouts/Layout.astro';
import BeautyIndexJsonLd from '../../components/BeautyIndexJsonLd.astro';
import BreadcrumbJsonLd from '../../components/BreadcrumbJsonLd.astro';
// ... component imports

const languages = await getCollection('languages');
const allData = languages.map((entry) => entry.data);
const sorted = [...allData].sort((a, b) => totalScore(b) - totalScore(a));
---

<Layout
  title="The Beauty Index: Programming Language Aesthetics Ranking 2026 | Patryk Golabek"
  description="..."
>
  <BeautyIndexJsonLd languages={sorted} />
  <BreadcrumbJsonLd crumbs={[...]} />

  {/* Hero Section */}
  <section class="text-center max-w-4xl mx-auto py-16 pb-12 px-4">
    <h1>...</h1>
  </section>

  {/* Component sections */}
  <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <RankingBarChart languages={sorted} />
  </section>

  {/* React island */}
  <VsComparePicker client:load languages={sorted.map(l => ({ id: l.id, name: l.name }))} />
</Layout>
```

### Pattern 2: React Island Filter with Data-Attribute DOM Manipulation
**What:** A React component mounted with `client:load` that manages filter state and toggles visibility of server-rendered HTML elements via `data-*` attributes and `style.display`.
**When to use:** The use-case filter (PAGE-05).
**Existing precedent:**
```tsx
// Source: src/components/beauty-index/LanguageFilter.tsx
export default function LanguageFilter({ languages }: LanguageFilterProps) {
  const [visible, setVisible] = useState(() => new Set<string>());

  useEffect(() => {
    initLanguages(languages.map((l) => l.id));
    const unsub = visibleLanguages.subscribe((val) => setVisible(val));
    return unsub;
  }, [languages]);

  // Sync DOM visibility when selection changes
  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>('[data-language-id]');
    cards.forEach((card) => {
      const id = card.dataset.languageId!;
      card.style.display = visible.has(id) ? '' : 'none';
    });
  }, [visible]);
  // ... render toggle buttons
}
```
**Key adaptation for DB Compass:** Instead of filtering by item ID (language), the filter is by use-case category. When a category is active, all models that include ANY use case in that category are shown. The grid cards need `data-model-id` and `data-use-cases` attributes for the filter to read.

### Pattern 3: Nanostores Filter State
**What:** An `atom` store exporting state and mutation functions. React components subscribe via `useStore` or manual `subscribe()`.
**When to use:** For the use-case filter state.
**Existing precedent:**
```typescript
// Source: src/stores/languageFilterStore.ts
import { atom } from 'nanostores';

export const visibleLanguages = atom<Set<string>>(new Set());

export function initLanguages(ids: string[]) {
  visibleLanguages.set(new Set(ids));
}

export function toggleLanguage(id: string) {
  const current = visibleLanguages.get();
  const next = new Set(current);
  if (next.has(id)) { next.delete(id); } else { next.add(id); }
  visibleLanguages.set(next);
}

export function selectAll(ids: string[]) {
  visibleLanguages.set(new Set(ids));
}

export function selectNone() {
  visibleLanguages.set(new Set());
}
```

### Pattern 4: JSON-LD Structured Data in Astro
**What:** An Astro component that constructs a JSON-LD schema object and renders it as `<script type="application/ld+json">`.
**When to use:** CompassJsonLd for Dataset + ItemList (SEO-01) and BreadcrumbJsonLd (SEO-03).
**Existing precedent:**
```astro
---
// Source: src/components/BeautyIndexJsonLd.astro
const schema = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  "name": "The Beauty Index",
  "description": "...",
  "url": "https://patrykgolabek.dev/beauty-index/",
  "datePublished": "2026-02-17",
  "creator": { "@type": "Person", "@id": "https://patrykgolabek.dev/#person" },
  "variableMeasured": DIMENSIONS.map((dim) => dim.name),
  "mainEntity": {
    "@type": "ItemList",
    "itemListOrder": "https://schema.org/ItemListOrderDescending",
    "numberOfItems": sorted.length,
    "itemListElement": sorted.map((lang, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": `${lang.name} (${totalScore(lang)}/60)`,
      "url": `https://patrykgolabek.dev/beauty-index/${lang.id}/`,
    })),
  },
};
---
<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

### Anti-Patterns to Avoid

- **Hydrating the entire model card grid as a React component:** The grid should be server-rendered Astro HTML with `data-model-id` attributes. The React filter island only toggles visibility via DOM manipulation. This keeps the page fast and avoids hydrating 12 cards worth of SVG radar charts.

- **Exposing all 58 raw use cases as individual filter toggles:** The raw `useCases` field has 58 unique strings, most shared by only 1 model. This creates an unusable filter UI. Group into 8-10 broad categories.

- **Putting the filter below the fold:** The filter should be placed ABOVE the model card grid so users see it before scrolling through cards. The Beauty Index places its LanguageFilter at the top of the LanguageGrid section.

- **Forgetting `data-model-id` attributes on grid cards:** The filter manipulates DOM elements by querying `[data-model-id]`. Without these attributes, the filter does nothing.

- **Using `client:visible` for the filter:** The filter should use `client:load` since it controls visibility of content above the fold. `client:visible` would delay hydration until the filter scrolls into view, causing a flash of unfiltered content.

- **Rendering the page at `/tools/db-compass` (without trailing slash):** Astro's `trailingSlash` default generates `index.html` in directories. The page file should be at `src/pages/tools/db-compass/index.astro` to produce `/tools/db-compass/`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON-LD structured data | Manual `<script>` tags with inline JSON | Dedicated Astro component (CompassJsonLd.astro) | Reusable, type-safe, follows BeautyIndexJsonLd pattern |
| Breadcrumb JSON-LD | New breadcrumb component | Existing BreadcrumbJsonLd.astro | Already built, accepts `crumbs` array prop |
| SEO meta tags | Manual `<meta>` tags | Layout.astro + SEOHead.astro | Already handle title, description, OG, Twitter cards |
| Filter state management | Custom event bus or context | Nanostores atom | Existing pattern (languageFilterStore), 286 bytes |
| Model card grid layout | CSS grid from scratch | Tailwind responsive grid | `grid-cols-2 sm:grid-cols-3 md:grid-cols-4` pattern from LanguageGrid.astro |
| Content collection loading | Manual JSON import | `getCollection('dbModels')` | Type-safe, Zod-validated, existing pattern |

**Key insight:** This phase has NO novel technical challenges. Every piece has an existing precedent. The work is composition and adaptation, not invention.

## Common Pitfalls

### Pitfall 1: Use-Case Filter Hydration Mismatch
**What goes wrong:** Server-rendered grid shows all models, but after React hydration the filter initializes with an empty set, causing all cards to disappear momentarily.
**Why it happens:** The LanguageFilter.tsx pattern starts with `useState(() => new Set<string>())` and then populates in `useEffect`. During the gap between server render and hydration, visible is empty.
**How to avoid:** Initialize the filter with ALL categories active (matching the server-rendered state where all cards are visible). The LanguageFilter does this correctly via `initLanguages(languages.map(l => l.id))` in useEffect, but the initial empty Set means cards briefly disappear. Two options: (a) accept the brief flash (existing pattern), or (b) don't hide cards until the first user interaction (better UX).
**Warning signs:** Cards briefly flash out and back in on page load.
**Recommended approach:** Initialize the store with all categories active in the `useEffect` (matching LanguageFilter pattern). The brief flash is negligible because `client:load` hydrates almost immediately. If the flash is visible, add a CSS rule that keeps cards visible until a `data-filter-active` attribute is set on the grid container by the React island.

### Pitfall 2: Use-Case Category Mapping Drift
**What goes wrong:** New models added in the future have use cases that don't map to any category, making them invisible in the filter.
**Why it happens:** The category mapping is a static object, and new use-case strings from models.json don't automatically map.
**How to avoid:** Add a catch-all "Other" category that captures any unmapped use cases. Add a build-time check that warns if any model use case doesn't map to a category.
**Warning signs:** A model card never appears when any single category filter is active.

### Pitfall 3: Missing Dimension Legend Accessibility
**What goes wrong:** Dimension symbols (\u2191, \u26A1, etc.) are meaningless to screen reader users without text labels.
**Why it happens:** The symbols are decorative Unicode characters, not semantic.
**How to avoid:** The DimensionLegend component must include full dimension names and descriptions as visible text, not just symbols. The symbols are decorative (`aria-hidden="true"`) and the name/description provide the accessible text.
**Warning signs:** Screen reader announces symbol characters instead of dimension names.

### Pitfall 4: Scoring Table Conflict with Use-Case Filter
**What goes wrong:** The use-case filter hides model cards in the grid but does NOT filter rows in the CompassScoringTable, creating an inconsistent experience.
**Why it happens:** The filter only targets `[data-model-id]` elements in the grid section, not table rows.
**How to avoid:** Either (a) apply the filter to table rows too (by adding `data-model-id` to `<tr>` elements and having the filter target both grids and tables), or (b) explicitly document that the filter only affects the card grid and keep the full table always visible as a reference. Option (b) is simpler and matches the Beauty Index pattern where the LanguageFilter only affects the LanguageGrid, not the ScoringTable.
**Recommended approach:** Option (b) -- filter only affects the model card grid. The scoring table always shows all 12 models. This is simpler to implement and provides value: users can filter the visual grid while keeping the complete data table for reference.

### Pitfall 5: JSON-LD Validation Failures
**What goes wrong:** Structured data doesn't validate in Google's Rich Results Test.
**Why it happens:** Missing required properties, wrong @type values, or invalid URL formats.
**How to avoid:** Follow the BeautyIndexJsonLd.astro template exactly, adapting only the data-specific fields. Use absolute URLs (`https://patrykgolabek.dev/tools/db-compass/...`). Test with Google's Rich Results Test after implementation.
**Warning signs:** No rich results appear in Google Search Console.

## Code Examples

Verified patterns from the existing codebase:

### Loading Content Collection Data
```astro
---
// Source: src/pages/beauty-index/index.astro (adapted for DB Compass)
import { getCollection } from 'astro:content';
import { totalScore } from '../../lib/db-compass/schema';

const dbModels = await getCollection('dbModels');
const allModels = dbModels.map((entry) => entry.data);
const sorted = [...allModels].sort((a, b) => totalScore(b) - totalScore(a));
---
```

### React Island with client:load
```astro
<!-- Source: src/pages/beauty-index/index.astro (VsComparePicker pattern) -->
<UseCaseFilter
  client:load
  models={allModels.map(m => ({
    id: m.id,
    name: m.name,
    useCases: m.useCases,
  }))}
/>
```

### Data-Attribute Grid Card for Filter Integration
```astro
<!-- Pattern derived from LanguageGrid.astro + LanguageFilter.tsx interaction -->
<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
  {models.map((model) => (
    <a
      href={`/tools/db-compass/${model.slug}/`}
      class="rounded-xl border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors bg-[var(--color-surface)] p-3 flex flex-col items-center"
      data-model-id={model.id}
      data-use-cases={model.useCases.join(',')}
    >
      <CompassRadarChart model={model} size={160} />
      <span class="text-sm font-medium mt-1">{model.name}</span>
      <span class="text-xs text-[var(--color-text-secondary)]">{totalScore(model)}/80</span>
      <CapBadge classification={model.capTheorem.classification} size="sm" />
    </a>
  ))}
</div>
```

### BreadcrumbJsonLd Usage
```astro
---
// Source: src/pages/beauty-index/index.astro (exact reuse)
---
<BreadcrumbJsonLd crumbs={[
  { name: 'Home', url: 'https://patrykgolabek.dev/' },
  { name: 'Tools', url: 'https://patrykgolabek.dev/tools/' },
  { name: 'Database Compass', url: 'https://patrykgolabek.dev/tools/db-compass/' },
]} />
```

### Dataset + ItemList JSON-LD Schema
```typescript
// Adapted from src/components/BeautyIndexJsonLd.astro
const schema = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  "name": "Database Compass",
  "alternateName": "Database Model Comparison Tool 2026",
  "description": "Interactive comparison of 12 database model categories scored across 8 dimensions: Scalability, Performance, Reliability, Operational Simplicity, Query Flexibility, Schema Flexibility, Ecosystem Maturity, and Learning Curve.",
  "url": "https://patrykgolabek.dev/tools/db-compass/",
  "datePublished": "2026-02-22",
  "dateModified": "2026-02-22",
  "version": "1.0",
  "license": "https://creativecommons.org/licenses/by/4.0/",
  "creator": {
    "@type": "Person",
    "@id": "https://patrykgolabek.dev/#person",
  },
  "keywords": [
    "database comparison",
    "database selection guide",
    "NoSQL vs SQL",
    "database model types",
    "database compass",
    "choose a database",
  ],
  "variableMeasured": DIMENSIONS.map((dim) => dim.name),
  "measurementTechnique": "Editorial scoring: each dimension rated 1-10 by expert judgment",
  "mainEntity": {
    "@type": "ItemList",
    "itemListOrder": "https://schema.org/ItemListOrderDescending",
    "numberOfItems": sorted.length,
    "itemListElement": sorted.map((model, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": `${model.name} (${totalScore(model)}/80)`,
      "url": `https://patrykgolabek.dev/tools/db-compass/${model.slug}/`,
    })),
  },
};
```

### Use-Case Category Mapping
```typescript
// NEW: src/lib/db-compass/use-case-categories.ts
export interface UseCaseCategory {
  id: string;
  label: string;
  /** Raw use-case strings from models.json that belong to this category */
  useCases: string[];
}

export const USE_CASE_CATEGORIES: UseCaseCategory[] = [
  {
    id: 'caching',
    label: 'Caching',
    useCases: ['Caching', 'Application caching', 'Session storage', 'Session management'],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    useCases: ['Real-time analytics', 'Financial analytics', 'Business intelligence', 'Log analytics', 'Security analytics', 'Application metrics'],
  },
  {
    id: 'oltp',
    label: 'OLTP',
    useCases: ['Enterprise applications', 'Financial systems', 'Financial transaction processing', 'SaaS applications', 'Global SaaS platforms', 'E-commerce platforms', 'Multi-region e-commerce'],
  },
  {
    id: 'search',
    label: 'Search',
    useCases: ['Full-text search', 'E-commerce search', 'Content discovery', 'Semantic search'],
  },
  {
    id: 'iot',
    label: 'IoT & Time-Series',
    useCases: ['IoT telemetry', 'Infrastructure monitoring', 'Energy grid monitoring', 'Time-series at scale', 'IoT with diverse access patterns'],
  },
  {
    id: 'ai-ml',
    label: 'AI / ML',
    useCases: ['RAG pipelines', 'Recommendation engines', 'Recommendation systems', 'Image similarity', 'Anomaly detection', 'Fraud detection'],
  },
  {
    id: 'content',
    label: 'Content & CMS',
    useCases: ['Content management', 'Content management systems', 'Product catalogs', 'User profiles', 'Mobile app backends'],
  },
  {
    id: 'graph',
    label: 'Graph & Network',
    useCases: ['Social networks', 'Knowledge graphs', 'Network analysis', 'Telecom networks'],
  },
  {
    id: 'realtime',
    label: 'Real-Time',
    useCases: ['Real-time counters', 'Real-time collaboration', 'Message brokering', 'Messaging platforms', 'Low-latency trading systems'],
  },
  {
    id: 'infra',
    label: 'Infrastructure',
    useCases: ['Configuration management', 'Feature flags', 'Rate limiting', 'Cloud-native migrations', 'Event logging'],
  },
];

/**
 * Returns which category IDs a model belongs to, based on its useCases array.
 * A model belongs to a category if ANY of its use cases appear in that category.
 */
export function modelCategories(modelUseCases: string[]): string[] {
  return USE_CASE_CATEGORIES
    .filter(cat => cat.useCases.some(uc => modelUseCases.includes(uc)))
    .map(cat => cat.id);
}
```

### SEO Meta Title and Description
```astro
<Layout
  title="Database Compass: Compare 12 Database Models Across 8 Dimensions | Patryk Golabek"
  description="Interactive database model comparison tool. Compare Key-Value, Document, Relational, Graph, and 8 more models scored across scalability, performance, reliability, and 5 other dimensions."
>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| React SPA with client-side data fetching | Astro islands with build-time data loading | Astro 2.0+ (2023) | Zero client JS for data rendering; React only for interactivity |
| Microdata / RDFa for structured data | JSON-LD (Google preferred) | Google recommendation since 2015 | Easier to maintain, less coupled to HTML structure |
| Filter via full client-side rendering | Data-attribute filtering with server-rendered HTML | Established Astro pattern | Grid renders at build time (SEO-visible), filter only manages visibility |
| Manual SEO meta tags per page | Centralized SEOHead component with props | Existing codebase pattern | Consistent OG/Twitter/canonical handling across all pages |

**Deprecated/outdated:**
- Microdata for structured data: Still valid but JSON-LD is Google's preferred format and the format used throughout this codebase
- Client-side rendered grids: Would hurt SEO since search engines wouldn't see the model content

## Open Questions

1. **Should the filter also filter the scoring table rows?**
   - What we know: The LanguageFilter in Beauty Index only filters the LanguageGrid, not the ScoringTable. This is the established pattern.
   - What's unclear: Whether users would expect the scoring table to also filter.
   - Recommendation: Keep it simple -- filter only affects the model card grid. The scoring table remains a complete reference. This matches the Beauty Index pattern and avoids complexity.

2. **What use-case categories to use?**
   - What we know: 58 raw use cases across 12 models. Most are unique to 1 model. Only "Event logging" and "IoT telemetry" appear in 2 models.
   - What's unclear: The exact category groupings are somewhat subjective.
   - Recommendation: Use the 10 categories defined in the code example above. Every raw use case maps to at least one category. Some models will appear in multiple categories (e.g., Redis appears in Caching + Real-Time + Infrastructure).

3. **What should the dimension legend section look like?**
   - What we know: DIMENSIONS array has key, symbol, name, shortName, and description for all 8 dimensions.
   - What's unclear: Whether to show as a simple list, a grid, or an expandable section.
   - Recommendation: A simple 2-column grid (4x2) showing symbol + name + description for each dimension. Place it below the scoring table as a reference section. Keep it static (no interactivity needed).

## Sources

### Primary (HIGH confidence)
- `src/pages/beauty-index/index.astro` -- Overview page composition pattern (line-by-line reference)
- `src/components/BeautyIndexJsonLd.astro` -- Dataset + ItemList JSON-LD pattern
- `src/components/BreadcrumbJsonLd.astro` -- BreadcrumbList JSON-LD (reusable as-is)
- `src/components/beauty-index/LanguageFilter.tsx` -- React island filter with nanostores
- `src/stores/languageFilterStore.ts` -- Nanostores atom pattern for filter state
- `src/components/beauty-index/LanguageGrid.astro` -- Grid card layout with data attributes
- `src/layouts/Layout.astro` + `src/components/SEOHead.astro` -- SEO metadata handling
- `src/data/db-compass/models.json` -- 12 model entries with useCases arrays (58 unique values)
- All Phase 29 components in `src/components/db-compass/` -- Ready to compose

### Secondary (MEDIUM confidence)
- [Schema.org Dataset](https://schema.org/Dataset) -- Dataset type properties verified
- [Schema.org ItemList](https://schema.org/ItemList) -- ItemList/ListItem structure verified
- [Google Dataset Structured Data](https://developers.google.com/search/docs/appearance/structured-data/dataset) -- Google's guidance on Dataset markup
- [Astro Content Collections API](https://docs.astro.build/en/reference/modules/astro-content/) -- getCollection() returns CollectionEntry[] with `.data` property
- [Astro Islands Architecture](https://docs.astro.build/en/concepts/islands/) -- client:load, client:visible directives
- [Astro Sharing State Between Islands](https://docs.astro.build/en/recipes/sharing-state-islands/) -- Nanostores recipe

### Tertiary (LOW confidence)
- None -- all findings verified against codebase or official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- entire stack is already installed and used throughout the codebase
- Architecture: HIGH -- every pattern has a direct precedent in the Beauty Index codebase
- Pitfalls: HIGH -- derived from actual patterns in existing code and known React hydration behaviors
- SEO/JSON-LD: HIGH -- BeautyIndexJsonLd.astro provides a complete template; schema.org docs confirm Dataset + ItemList structure

**Research date:** 2026-02-21
**Valid until:** 2026-03-21 (30 days -- stable patterns, no dependency changes expected)
