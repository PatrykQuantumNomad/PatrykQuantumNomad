# Phase 86: Page Infrastructure and Navigation - Research

**Researched:** 2026-03-08
**Domain:** Astro 5 layouts, component composition, client-side scroll tracking, sidebar navigation
**Confidence:** HIGH

## Summary

Phase 86 builds the page infrastructure and navigation layer for the FastAPI Production Guide. This sits on top of the content foundation established in Phase 85 (schemas, collections, page generation). The deliverables are: a landing page at `/guides/fastapi-production/`, a `GuideLayout.astro` wrapping all guide pages, sidebar chapter navigation, breadcrumb navigation, previous/next chapter links, and a reading progress indicator.

The codebase already contains every pattern needed. The `EDALayout.astro` extends `Layout.astro` and provides a template for `GuideLayout.astro`. The `EdaBreadcrumb.astro` component demonstrates breadcrumb rendering. The existing scroll progress bar in `Layout.astro` handles the reading progress indicator at the global level -- but the guide needs a content-scoped variant that tracks only the article body, not the full page. The `Pagination.astro` component shows the prev/next link styling pattern. The EDA landing page (`/eda/index.astro`) demonstrates the card grid pattern needed for the guide landing page.

The key architectural decision is the sidebar layout. Currently, guide pages use `max-w-3xl` centered content. Introducing a sidebar requires a two-column layout: a fixed/sticky sidebar on the left and the main content area on the right. This is the only genuinely new pattern -- everything else is composition of existing pieces. The sidebar should be a separate component (`GuideSidebar.astro`) that receives the chapters array and current slug, rendering as a sticky `<nav>` element.

**Primary recommendation:** Build `GuideLayout.astro` as a wrapper around `Layout.astro` (mirroring `EDALayout.astro`), add a two-column grid with a sticky `GuideSidebar.astro`, create `GuideBreadcrumb.astro` modeled on `EdaBreadcrumb.astro`, create a `GuideChapterNav.astro` for prev/next links, create the landing page at `src/pages/guides/fastapi-production/index.astro`, and create a `src/lib/guides/routes.ts` for URL helpers (mirroring `src/lib/eda/routes.ts`).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-01 | Guide landing page at `/guides/fastapi-production/` with chapter card grid and AI agent narrative hero | EDA landing page pattern (`/eda/index.astro`) provides exact card grid template; `getCollection('guides')` provides metadata, `getCollection('guidePages')` provides chapters; hero section uses existing heading/subheading styling |
| INFRA-02 | GuideLayout.astro extending Layout.astro with guide-specific navigation and reading progress | `EDALayout.astro` extends `Layout.astro` pattern; add two-column grid, sidebar, breadcrumb slots; reading progress already exists globally in `Layout.astro` |
| INFRA-03 | Sidebar chapter navigation showing all chapters with current-page highlighting | New `GuideSidebar.astro` component; receives chapters array from `guide.json` + current slug; renders as sticky `<nav>` with `aria-current="page"` pattern from `Header.astro` |
| INFRA-04 | Breadcrumb navigation on all guide pages (Home > Guides > FastAPI Production > Chapter) | `EdaBreadcrumb.astro` provides exact pattern; new `GuideBreadcrumb.astro` with guide-specific crumbs; `BreadcrumbJsonLd.astro` already exists for structured data (Phase 89 scope) |
| INFRA-05 | Previous/next chapter navigation at bottom of each domain page | `Pagination.astro` styling pattern; compute prev/next from sorted chapters array using current page's `order` field |
| INFRA-06 | Reading progress indicator (scroll-based progress bar at top of page) | Already implemented globally in `Layout.astro` (`initScrollProgress()` function + `.scroll-progress-bar` CSS); the existing bar tracks full-page scroll which is sufficient for guide pages |
| AGENT-03 | Landing page hero frames the template as "production concerns handled, agent writes business logic" | Landing page hero copy -- the guide.json `description` already contains this framing ("so your AI agent writes business logic, not infrastructure"); hero section expands this with 2-3 sentences |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | 5.17.1 | Static site framework, layouts, components | Already installed; provides component composition, `getCollection`, `render` |
| @astrojs/tailwind | (integrated) | Utility-first CSS | Already configured; all existing components use Tailwind classes |
| @tailwindcss/typography | (plugin) | Prose styling for MDX content | Already installed in `tailwind.config.mjs`; used across blog and EDA |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| astro-expressive-code | 0.41.6 | Code block syntax highlighting in MDX | Already configured; guide MDX content will use code fences |
| zod (via astro/zod) | bundled | Schema validation | Already used for `guidePageSchema` and `guideMetaSchema` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pure CSS sticky sidebar | JS-driven sidebar with IntersectionObserver | CSS `position: sticky` is simpler, works without JS, sufficient for this use case |
| Custom reading progress | `nprogress` or similar library | Existing scroll progress bar in Layout.astro already works; no library needed |
| React sidebar component | Astro `.astro` component | No interactivity needed beyond CSS `:hover` and `aria-current`; zero JS sidebar is better |

**Installation:**
```bash
# No new packages needed -- all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── layouts/
│   └── GuideLayout.astro              # NEW: extends Layout.astro with sidebar + guide nav
├── components/
│   └── guide/
│       ├── GuideSidebar.astro         # NEW: chapter list with current-page highlighting
│       ├── GuideBreadcrumb.astro      # NEW: Home > Guides > FastAPI Production > Chapter
│       └── GuideChapterNav.astro      # NEW: prev/next chapter links at bottom of page
├── lib/
│   └── guides/
│       ├── schema.ts                  # EXISTS: Zod schemas (from Phase 85)
│       └── routes.ts                  # NEW: URL helpers (guidePageUrl, guideLandingUrl)
├── pages/
│   └── guides/
│       └── fastapi-production/
│           ├── index.astro            # NEW: landing page with hero + chapter card grid
│           └── [slug].astro           # EXISTS: chapter page (UPDATE to use GuideLayout)
└── data/
    └── guides/
        └── fastapi-production/
            ├── guide.json             # EXISTS: guide metadata with chapters array
            └── pages/
                └── 00-builder-pattern.mdx  # EXISTS: stub chapter (from Phase 85)
```

### Pattern 1: Layout Extension (GuideLayout wraps Layout)
**What:** `GuideLayout.astro` extends `Layout.astro` by wrapping its slot content with a two-column grid containing a sidebar and content area.
**When to use:** For all guide chapter pages (`[slug].astro`).
**Example:**
```astro
---
// src/layouts/GuideLayout.astro
// Source: follows EDALayout.astro pattern in this codebase
import Layout from './Layout.astro';
import GuideSidebar from '../components/guide/GuideSidebar.astro';
import GuideBreadcrumb from '../components/guide/GuideBreadcrumb.astro';
import GuideChapterNav from '../components/guide/GuideChapterNav.astro';

interface Props {
  title: string;
  description?: string;
  ogImage?: string;
  ogImageAlt?: string;
  guideTitle: string;
  guideSlug: string;
  chapters: Array<{ slug: string; title: string }>;
  currentSlug: string;
  chapterTitle: string;
}

const { title, description, ogImage, ogImageAlt, guideTitle, guideSlug, chapters, currentSlug, chapterTitle } = Astro.props;
---

<Layout title={title} description={description} ogImage={ogImage} ogImageAlt={ogImageAlt} ogType="article">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
    <GuideBreadcrumb guideTitle={guideTitle} guideSlug={guideSlug} chapterTitle={chapterTitle} />

    <div class="lg:grid lg:grid-cols-[240px_1fr] lg:gap-8 mt-6">
      <!-- Sidebar (hidden on mobile, sticky on desktop) -->
      <aside class="hidden lg:block">
        <GuideSidebar chapters={chapters} currentSlug={currentSlug} guideSlug={guideSlug} />
      </aside>

      <!-- Main content -->
      <div>
        <slot />
        <GuideChapterNav chapters={chapters} currentSlug={currentSlug} guideSlug={guideSlug} />
      </div>
    </div>
  </div>
</Layout>
```

### Pattern 2: Sticky Sidebar Navigation
**What:** A sidebar that stays visible as the user scrolls through long guide content, using CSS `position: sticky`.
**When to use:** For the chapter navigation sidebar on desktop viewports.
**Example:**
```astro
---
// src/components/guide/GuideSidebar.astro
interface Props {
  chapters: Array<{ slug: string; title: string }>;
  currentSlug: string;
  guideSlug: string;
}

const { chapters, currentSlug, guideSlug } = Astro.props;
---

<nav
  aria-label="Guide chapters"
  class="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto"
>
  <h2 class="text-sm font-heading font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-3">
    Chapters
  </h2>
  <ul class="space-y-1">
    {chapters.map((ch) => {
      const isActive = ch.slug === currentSlug;
      return (
        <li>
          <a
            href={`/guides/${guideSlug}/${ch.slug}/`}
            class:list={[
              'block px-3 py-2 rounded-lg text-sm transition-colors',
              isActive
                ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-surface-alt)]',
            ]}
            {...(isActive ? { 'aria-current': 'page' } : {})}
          >
            {ch.title}
          </a>
        </li>
      );
    })}
  </ul>
</nav>
```

### Pattern 3: Prev/Next Chapter Navigation
**What:** Navigation links at the bottom of each guide page linking to the previous and next chapters.
**When to use:** At the bottom of every guide chapter page.
**Example:**
```astro
---
// src/components/guide/GuideChapterNav.astro
interface Props {
  chapters: Array<{ slug: string; title: string }>;
  currentSlug: string;
  guideSlug: string;
}

const { chapters, currentSlug, guideSlug } = Astro.props;
const currentIndex = chapters.findIndex((ch) => ch.slug === currentSlug);
const prev = currentIndex > 0 ? chapters[currentIndex - 1] : null;
const next = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;
---

<nav aria-label="Chapter navigation" class="mt-12 pt-8 border-t border-[var(--color-border)]">
  <div class="flex justify-between">
    {prev ? (
      <a
        href={`/guides/${guideSlug}/${prev.slug}/`}
        class="group flex flex-col items-start"
      >
        <span class="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider">Previous</span>
        <span class="text-[var(--color-accent)] font-medium group-hover:underline">&larr; {prev.title}</span>
      </a>
    ) : <div />}
    {next ? (
      <a
        href={`/guides/${guideSlug}/${next.slug}/`}
        class="group flex flex-col items-end"
      >
        <span class="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider">Next</span>
        <span class="text-[var(--color-accent)] font-medium group-hover:underline">{next.title} &rarr;</span>
      </a>
    ) : <div />}
  </div>
</nav>
```

### Pattern 4: Landing Page with Chapter Card Grid
**What:** An index page at `/guides/fastapi-production/` displaying a hero section and a grid of chapter cards.
**When to use:** For the guide landing page.
**Key data flow:**
```typescript
// In src/pages/guides/fastapi-production/index.astro
import { getCollection } from 'astro:content';

const [guideMeta] = await getCollection('guides');
const guidePages = await getCollection('guidePages');

// Sort pages by order field
const sortedPages = [...guidePages].sort((a, b) => a.data.order - b.data.order);

// guideMeta.data has: title, description, chapters, templateRepo, versionTag
// sortedPages has: title, description, order, slug for each chapter
```

### Pattern 5: Route Helper Module
**What:** Centralized URL builder functions for guide pages, mirroring `src/lib/eda/routes.ts`.
**When to use:** Anywhere a guide URL is constructed -- landing page, sidebar, breadcrumb, prev/next links.
**Example:**
```typescript
// src/lib/guides/routes.ts
// Source: follows src/lib/eda/routes.ts pattern

export const GUIDE_ROUTES = {
  landing: '/guides/fastapi-production/',
  guides: '/guides/',
} as const;

/** Build the URL for a guide chapter page */
export function guidePageUrl(guideSlug: string, chapterSlug: string): string {
  return `/guides/${guideSlug}/${chapterSlug}/`;
}

/** Build the URL for a guide landing page */
export function guideLandingUrl(guideSlug: string): string {
  return `/guides/${guideSlug}/`;
}
```

### Anti-Patterns to Avoid
- **Hardcoding chapter URLs in components:** Always use `guidePageUrl()` from `routes.ts`. Hardcoded URLs break when slugs change and violate the single-source-of-truth pattern established by `src/lib/eda/routes.ts`.
- **Building the sidebar from `guidePages` collection:** Use the `chapters` array from `guide.json` (the `guides` collection) as the source of truth for chapter ordering and titles in the sidebar. The `guidePages` collection should only be used for rendering content. This separation means the sidebar works correctly even before all chapter MDX files exist.
- **Creating a JavaScript-heavy sidebar:** The sidebar is pure navigation -- no toggle, no collapse, no interactive state. It should be a zero-JS Astro component with CSS sticky positioning. Mobile can simply hide the sidebar (it is secondary navigation, not primary).
- **Duplicating the scroll progress bar:** `Layout.astro` already has a global scroll progress bar. Do NOT create a second one in `GuideLayout.astro`. The existing bar tracks full-page scroll, which is the correct behavior for guide pages.
- **Forgetting trailing slashes:** All URLs must end with `/` per `astro.config.mjs` (`trailingSlash: 'always'`). The `guidePageUrl()` helper should enforce this.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scroll progress tracking | Custom IntersectionObserver-based progress | Existing `initScrollProgress()` in `Layout.astro` | Already implemented, tested, handles edge cases; uses efficient scroll listener with `passive: true` |
| Breadcrumb rendering | Custom breadcrumb from scratch | Adapt `EdaBreadcrumb.astro` pattern | Proven accessible pattern with proper `<nav aria-label>` and `<ol>` semantics |
| Breadcrumb JSON-LD | Custom schema.org markup | Existing `BreadcrumbJsonLd.astro` component | Already renders valid BreadcrumbList schema (used in Phase 89 for SEO, but component is ready now) |
| Active nav highlighting | JS-based scroll spy for sidebar | Astro build-time `currentSlug` comparison | Sidebar items are page links, not section anchors -- active state is known at build time |
| URL construction | String concatenation in templates | `guidePageUrl()` / `guideLandingUrl()` helpers | Single source of truth; enforces trailing slashes; matches `src/lib/eda/routes.ts` pattern |

**Key insight:** This phase is almost entirely composition of existing patterns. The only new CSS pattern is the two-column grid with sticky sidebar. Everything else (layouts, breadcrumbs, pagination-style navigation, card grids, scroll progress) exists in the codebase already.

## Common Pitfalls

### Pitfall 1: Sidebar breaks sticky positioning
**What goes wrong:** CSS `position: sticky` requires the parent to have a defined height or be part of a grid/flex layout. If the sidebar's container has `overflow: hidden`, sticky positioning silently fails.
**Why it happens:** Sticky elements are positioned relative to their scrolling ancestor. If any ancestor has `overflow: hidden` or `overflow: auto`, the sticky behavior breaks.
**How to avoid:** Use `lg:grid lg:grid-cols-[240px_1fr]` on the parent container. Do NOT add `overflow: hidden` to the grid container or sidebar column. Set `top: 5rem` (accounting for the sticky header height of 4rem + 1rem gap) and `max-h-[calc(100vh-6rem)]` with `overflow-y-auto` only on the sidebar nav itself.
**Warning signs:** Sidebar scrolls out of view instead of staying fixed. Test by scrolling a long chapter page.

### Pitfall 2: Chapter ordering inconsistency between sidebar and content
**What goes wrong:** The sidebar shows chapters in a different order than the prev/next navigation expects.
**Why it happens:** Two different ordering sources -- `guide.json` `chapters` array (positional order) vs. MDX frontmatter `order` field (numeric sort). If these diverge, navigation becomes confusing.
**How to avoid:** Use `guide.json` `chapters` array as the single source of truth for ordering in both the sidebar AND the prev/next navigation. The MDX `order` field is for sorting the `guidePages` collection when needed (e.g., landing page card grid) but the `chapters` array in `guide.json` defines the canonical sequence.
**Warning signs:** Clicking "Next" navigates to a chapter that is not the next one in the sidebar list.

### Pitfall 3: Landing page displays stale or missing chapters
**What goes wrong:** The landing page card grid shows chapters that don't have corresponding MDX pages yet, or omits chapters that exist.
**Why it happens:** The landing page pulls from `guide.json` for the card list, but some chapters may not have MDX files yet during development.
**How to avoid:** Two strategies: (a) Show all chapters from `guide.json` but mark those without MDX content as "Coming Soon" with no link, or (b) Only show chapters that exist in the `guidePages` collection. Strategy (a) is better for this project because it previews the full guide scope. Cross-reference `guide.json` chapters with `guidePages` collection to determine which are live.
**Warning signs:** Build errors or broken links on the landing page.

### Pitfall 4: Mobile layout collision with header
**What goes wrong:** On mobile, the guide content (with breadcrumb + article) feels cramped because the sticky header already takes 64px (h-16).
**Why it happens:** Mobile doesn't have the sidebar, but the breadcrumb adds vertical space, and the header's scroll-hide behavior can cause visual jank.
**How to avoid:** Use `py-6` (not `py-16`) for guide content padding on mobile. The sidebar is hidden (`hidden lg:block`), and the breadcrumb sits at the top. Ensure the content area takes full width on mobile (`lg:grid` means the grid only activates at `lg` breakpoint).
**Warning signs:** Too much whitespace above the article title on mobile, or breadcrumb overlaps with the header.

### Pitfall 5: Forgetting to pass chapter data to GuideLayout
**What goes wrong:** `[slug].astro` needs to load guide metadata (chapters array) and pass it to `GuideLayout.astro` for the sidebar and prev/next navigation. If this data loading is missing, the sidebar and nav show nothing.
**Why it happens:** Phase 85's `[slug].astro` only loads `guidePages` collection, not the `guides` (metadata) collection.
**How to avoid:** In `[slug].astro`, load both collections in `getStaticPaths`:
```typescript
const pages = await getCollection('guidePages');
const [guideMeta] = await getCollection('guides');
// Pass guideMeta.data.chapters and current slug to props
```
**Warning signs:** Sidebar is empty; prev/next links don't appear.

### Pitfall 6: Header nav item count (10th item risk)
**What goes wrong:** Adding "Guides" to the header navigation makes 10 items, which may overflow or look cramped on smaller desktop viewports.
**Why it happens:** The header uses `gap-6` for nav items. With 10 items, the total width approaches the `max-w-6xl` container limit.
**How to avoid:** This is a Phase 89 concern (SITE-01). Phase 86 does NOT modify the header. The guide is accessible via direct URL only until Phase 89 adds the header link.
**Warning signs:** N/A for this phase -- deferred.

## Code Examples

Verified patterns from the existing codebase:

### Layout Extension Pattern (from EDALayout.astro)
```astro
// Source: src/layouts/EDALayout.astro
---
import Layout from './Layout.astro';

interface Props {
  title: string;
  description?: string;
  ogImage?: string;
  ogImageAlt?: string;
  ogType?: 'website' | 'article';
  publishedDate?: Date;
  updatedDate?: Date;
  tags?: string[];
  useKatex?: boolean;
}

const { title, description, ogImage, ogImageAlt, ogType = 'article', publishedDate, updatedDate, tags, useKatex = false } = Astro.props;
---

<Layout title={title} description={description} ogImage={ogImage} ogImageAlt={ogImageAlt} ogType={ogType} publishedDate={publishedDate} updatedDate={updatedDate} tags={tags}>
  {/* Extra head content can go in named slots */}
  <slot />
</Layout>
```

### Breadcrumb Component Pattern (from EdaBreadcrumb.astro)
```astro
// Source: src/components/eda/EdaBreadcrumb.astro
---
interface Props {
  category: string;
  techniqueName?: string;
}

const { category, techniqueName } = Astro.props;

interface Crumb {
  label: string;
  href: string;
}

const crumbs: Crumb[] = [
  { label: 'EDA', href: '/eda/' },
  { label: category, href: categoryHref },
];

if (techniqueName) {
  crumbs.push({ label: techniqueName, href: '' });
}
---

<nav aria-label="Breadcrumb" class="mb-6">
  <ol class="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
    {crumbs.map((crumb, i) => (
      <li class="flex items-center gap-2">
        {i > 0 && <span aria-hidden="true">/</span>}
        {crumb.href ? (
          <a href={crumb.href} class="hover:text-[var(--color-accent)] transition-colors">
            {crumb.label}
          </a>
        ) : (
          <span class="text-[var(--color-text-primary)] font-medium">{crumb.label}</span>
        )}
      </li>
    ))}
  </ol>
</nav>
```

### Active Nav Link Pattern (from Header.astro)
```astro
// Source: src/components/Header.astro (lines 46-62)
{navLinks.map((link) => {
  const isActive = currentPath === link.href || (link.href !== '/' && currentPath.startsWith(link.href));
  return (
    <a
      href={link.href}
      class:list={[
        'nav-link font-medium transition-colors',
        isActive
          ? 'text-[var(--color-accent)]'
          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]',
      ]}
      {...(isActive ? { 'aria-current': 'page' } : {})}
    >
      {link.label}
    </a>
  );
})}
```

### Route Helpers Pattern (from src/lib/eda/routes.ts)
```typescript
// Source: src/lib/eda/routes.ts
export const EDA_ROUTES = {
  techniques: '/eda/techniques/',
  quantitative: '/eda/quantitative/',
  distributions: '/eda/distributions/',
  foundations: '/eda/foundations/',
  caseStudies: '/eda/case-studies/',
  reference: '/eda/reference/',
  landing: '/eda/',
} as const;

export function techniqueUrl(slug: string, category: 'graphical' | 'quantitative'): string {
  const prefix = category === 'graphical' ? EDA_ROUTES.techniques : EDA_ROUTES.quantitative;
  return `${prefix}${slug}/`;
}
```

### Card Grid Pattern (from /eda/index.astro)
```astro
// Source: src/pages/eda/index.astro (lines 210-238)
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {sectionCards.map((card) => (
    <a
      href={card.url}
      class="group rounded-lg border border-[var(--color-border)] p-4 hover:border-[var(--color-accent)] transition-colors"
    >
      <h3 class="text-base font-heading font-bold group-hover:text-[var(--color-accent)] transition-colors">
        {card.title}
      </h3>
      <p class="text-sm text-[var(--color-text-secondary)] mt-2 line-clamp-2">
        {card.description}
      </p>
    </a>
  ))}
</div>
```

### Global Scroll Progress (already in Layout.astro)
```javascript
// Source: src/layouts/Layout.astro (lines 180-196)
function initScrollProgress() {
  const bar = document.getElementById('scroll-progress-bar');
  if (!bar) return;

  function updateProgress() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar!.style.width = `${progress}%`;
  }

  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JS-based sticky positioning | CSS `position: sticky` | CSS standard, widely supported | No JavaScript needed for sidebar stickiness |
| JS scroll spy for active sidebar item | Build-time active state (`currentSlug` comparison) | N/A -- sidebar links are page navigation, not section anchors | Zero JS for active highlighting |
| Custom progress bar library | CSS gradient + JS scroll listener | Already in codebase | No new dependency needed |

**Deprecated/outdated:**
- `position: fixed` for sidebars: replaced by `position: sticky` which respects document flow and doesn't require manual offset calculations
- jQuery-based scroll tracking: replaced by vanilla JS `scroll` event with `passive: true` (already in use)

## Open Questions

1. **Mobile sidebar access**
   - What we know: The sidebar is `hidden lg:block` -- completely hidden on mobile. Users on mobile can only navigate via breadcrumb (up to landing) or prev/next links (sequential).
   - What's unclear: Whether mobile users need a dropdown or hamburger-style chapter menu.
   - Recommendation: For v1.15, mobile users navigate via prev/next links and the breadcrumb back to the landing page. The landing page card grid serves as the chapter index on mobile. A collapsible mobile chapter menu can be added in a future iteration if analytics show demand. This keeps Phase 86 scope tight.

2. **Landing page with only one chapter stub**
   - What we know: Phase 85 created only one stub chapter (`00-builder-pattern.mdx`). The guide will eventually have 11 chapters. Phase 86 is before content authoring (Phase 88).
   - What's unclear: Should the landing page show only the one stub chapter, or display all 11 planned chapters from `guide.json`?
   - Recommendation: Show all chapters from `guide.json` `chapters` array. Chapters without corresponding MDX content should render as cards without links (or with a "Coming Soon" badge). This previews the full guide scope and validates the landing page layout with realistic content. Update `guide.json` to include all 11 chapter entries during this phase.

3. **Reading progress: global vs. content-scoped**
   - What we know: INFRA-06 requires a "reading progress indicator (scroll-based progress bar at top of page)." `Layout.astro` already has a global scroll progress bar that tracks full-page scroll position.
   - What's unclear: Whether the requirement means full-page scroll (which already works) or article-body-only scroll tracking (which would require a new implementation).
   - Recommendation: The existing global scroll progress bar satisfies INFRA-06. It already shows reading progress for the full page, which includes the guide content. No additional implementation needed. If content-scoped tracking is desired later, it would require an `IntersectionObserver`-based approach scoped to the article element -- but this is unnecessary for v1.15.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.0.18 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01 | Landing page builds and renders chapter cards | smoke | `npx astro build 2>&1 \| tail -10` | -- Wave 0 |
| INFRA-02 | GuideLayout wraps content with sidebar and nav | smoke | `npx astro build 2>&1 \| tail -10` | -- Wave 0 |
| INFRA-03 | Sidebar renders all chapters with current-page highlighting | manual-only | Visual inspection in browser | N/A (Astro template logic, no unit-testable function) |
| INFRA-04 | Breadcrumb renders correct path segments | unit | `npx vitest run src/lib/guides/__tests__/routes.test.ts` | -- Wave 0 |
| INFRA-05 | Prev/next chapter links point to correct adjacent chapters | unit | `npx vitest run src/lib/guides/__tests__/routes.test.ts` | -- Wave 0 |
| INFRA-06 | Reading progress indicator tracks scroll position | manual-only | Visual inspection in browser | N/A (already implemented in Layout.astro) |
| AGENT-03 | Landing hero has AI agent narrative framing | manual-only | Visual inspection of landing page copy | N/A (content/copy check) |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/guides/ && npx astro build`
- **Per wave merge:** `npx vitest run --reporter=verbose && npx astro build`
- **Phase gate:** Full vitest suite green + `astro build` success + visual inspection of landing page, sidebar, breadcrumb, and prev/next navigation

### Wave 0 Gaps
- [ ] `src/lib/guides/__tests__/routes.test.ts` -- covers INFRA-04, INFRA-05 (route helpers produce correct URLs with trailing slashes)
- [ ] Build smoke test via `npx astro build` -- covers INFRA-01, INFRA-02 (full pipeline validation of landing page and layout)

## Sources

### Primary (HIGH confidence)
- Existing codebase `src/layouts/Layout.astro` -- verified scroll progress bar implementation, layout structure, slot mechanism
- Existing codebase `src/layouts/EDALayout.astro` -- verified layout extension pattern
- Existing codebase `src/components/eda/EdaBreadcrumb.astro` -- verified breadcrumb component pattern
- Existing codebase `src/components/Header.astro` -- verified active nav link pattern (`aria-current`, `class:list`)
- Existing codebase `src/components/Pagination.astro` -- verified prev/next link styling pattern
- Existing codebase `src/pages/eda/index.astro` -- verified card grid landing page pattern
- Existing codebase `src/lib/eda/routes.ts` -- verified route helper module pattern
- Existing codebase `src/components/BreadcrumbJsonLd.astro` -- verified BreadcrumbList schema.org component
- Existing codebase `src/data/guides/fastapi-production/guide.json` -- verified guide metadata structure
- Existing codebase `src/lib/guides/schema.ts` -- verified Zod schemas from Phase 85
- Existing codebase `src/pages/guides/fastapi-production/[slug].astro` -- verified current page template from Phase 85
- Existing codebase `src/styles/global.css` -- verified CSS custom properties, scroll progress bar styles, design tokens

### Secondary (MEDIUM confidence)
- CSS `position: sticky` specification -- widely supported, verified behavior with `top` offset and scrolling containers

### Tertiary (LOW confidence)
- None -- all findings verified against codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new packages; all patterns exist in codebase
- Architecture: HIGH - every component pattern has an exact analog in the existing EDA or blog implementations
- Pitfalls: HIGH - derived from direct analysis of existing codebase patterns and CSS sticky positioning behavior

**Research date:** 2026-03-08
**Valid until:** 2026-04-07 (30 days -- Astro stable, all patterns established in codebase)
