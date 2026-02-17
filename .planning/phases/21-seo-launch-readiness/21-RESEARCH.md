# Phase 21: SEO & Launch Readiness - Research

**Researched:** 2026-02-17
**Domain:** Astro site navigation, JSON-LD structured data, sitemap integration, Lighthouse auditing, WCAG 2.1 AA accessibility
**Confidence:** HIGH

## Summary

Phase 21 is the final integration phase for the Beauty Index section. It covers seven requirements spanning navigation (SEO-01), structured data (SEO-02, SEO-03), cross-linking (SEO-04), sitemap inclusion (SEO-05), performance auditing (SEO-06), and accessibility auditing (SEO-07). No new libraries need to be installed. Every requirement is achievable by editing existing Astro components and templates using patterns already established in the codebase.

The codebase already has all the building blocks: `BreadcrumbJsonLd.astro` (used on blog post pages), `SEOHead.astro` (used on all pages), `Header.astro` (with a simple `navLinks` array), `@astrojs/sitemap` integration (auto-includes all static pages), and existing JSON-LD patterns (`PersonJsonLd`, `BlogPostingJsonLd`, `ProjectsJsonLd`). The Beauty Index pages already use `Layout.astro` which includes SEOHead, so canonical URLs and OG tags are handled. The primary work is: (1) adding one nav link, (2) creating a new `BeautyIndexJsonLd.astro` component with Dataset/ItemList schema, (3) adding BreadcrumbJsonLd to the 3 Beauty Index page templates, (4) adding internal links from homepage and blog posts to Beauty Index, (5) verifying sitemap inclusion, (6) running Lighthouse and fixing any issues, and (7) auditing and fixing keyboard/screen reader accessibility.

The accessibility work (SEO-07) is the most substantial requirement. The `ScoringTable.astro` component's sort functionality currently uses `th` click handlers without `button` elements, lacks `aria-sort` attributes, and has no live region for sort announcements. The `CodeComparisonTabs.tsx` React component already implements proper WAI-ARIA tab patterns (roving tabindex, arrow key navigation). The SVG radar charts have `role="img"` and `aria-label` but lack a text-based data table alternative for screen readers.

**Primary recommendation:** Implement as 3 sub-plans: (1) Navigation + structured data + sitemap (SEO-01, SEO-02, SEO-03, SEO-05), (2) Cross-linking + homepage integration (SEO-04), (3) Lighthouse audit + accessibility fixes (SEO-06, SEO-07). No new dependencies required.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SEO-01 | Navigation link added to site header for Beauty Index section | Header.astro has a `navLinks` array; add `{ href: '/beauty-index/', label: 'Beauty Index' }` |
| SEO-02 | JSON-LD structured data on Beauty Index pages (Dataset/ItemList schema) | Create `BeautyIndexJsonLd.astro` following existing `ProjectsJsonLd.astro` pattern; use Dataset for overview, no extra schema needed on detail pages |
| SEO-03 | Breadcrumb navigation and BreadcrumbJsonLd on all Beauty Index pages | Existing `BreadcrumbJsonLd.astro` component handles this; add to 3 page templates following blog `[slug].astro` pattern |
| SEO-04 | Internal cross-linking from existing pages (homepage, blog) to Beauty Index | Add a Beauty Index section/link on homepage `index.astro`; add inline links in at least 2 blog posts |
| SEO-05 | All Beauty Index pages in sitemap | `@astrojs/sitemap` auto-includes all static pages; verify with build output |
| SEO-06 | Lighthouse 90+ audit on all Beauty Index page types | Run Lighthouse CI on overview, one language detail, and code comparison page; fix issues found |
| SEO-07 | Accessibility audit (keyboard navigation, screen reader, WCAG 2.1 AA) | Fix ScoringTable sort accessibility, add text alternative for radar charts, verify tab/keyboard navigation |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@astrojs/sitemap` | Already installed | Auto-generates sitemap-index.xml for all static pages | Already configured in astro.config.mjs; Beauty Index pages auto-included |
| `BreadcrumbJsonLd.astro` | Existing component | Renders BreadcrumbList JSON-LD | Already used on blog `[slug].astro` pages |
| `SEOHead.astro` | Existing component | Meta tags, OG tags, canonical URLs | Already used on all pages via Layout.astro |
| `Layout.astro` | Existing component | Page shell with SEOHead, header, footer | All Beauty Index pages already use this |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Lighthouse CI | CLI tool | Automated performance/accessibility/SEO auditing | Run against built site to verify SEO-06 scores |
| Chrome DevTools Accessibility Inspector | Built-in | Manual WCAG 2.1 AA verification | For keyboard navigation and screen reader testing |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom Dataset JSON-LD component | `next-seo` or `astro-seo` | Unnecessary dependency for 1 JSON-LD type; hand-written is simpler and consistent with existing codebase pattern |
| Automated accessibility testing library (axe-core, pa11y) | Manual testing | Manual is sufficient for 3 page types; automated tools could be added later |

**Installation:** None required. All dependencies already present.

## Architecture Patterns

### File Structure (Changes Only)

```
src/
├── components/
│   ├── Header.astro                    # EDIT: Add Beauty Index to navLinks array
│   ├── BeautyIndexJsonLd.astro         # NEW: Dataset + ItemList structured data
│   └── BreadcrumbJsonLd.astro          # EXISTS: No changes needed
├── pages/
│   ├── index.astro                     # EDIT: Add Beauty Index cross-link (SEO-04)
│   └── beauty-index/
│       ├── index.astro                 # EDIT: Add BreadcrumbJsonLd + BeautyIndexJsonLd
│       ├── [slug].astro                # EDIT: Add BreadcrumbJsonLd
│       └── code/
│           └── index.astro            # EDIT: Add BreadcrumbJsonLd
├── data/
│   └── blog/
│       ├── the-beauty-index.mdx        # EDIT: Add internal links to Beauty Index pages (if not already present)
│       └── building-kubernetes-observability-stack.mdx  # EDIT: Add contextual link to Beauty Index
```

### Pattern 1: Adding Navigation Link (SEO-01)

**What:** Add "Beauty Index" to the site header navigation.

**When to use:** When a new top-level section needs global navigation presence.

**Implementation:** Edit the `navLinks` array in `src/components/Header.astro`:

```astro
const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/blog/', label: 'Blog' },
  { href: '/beauty-index/', label: 'Beauty Index' },
  { href: '/projects/', label: 'Projects' },
  { href: '/about/', label: 'About' },
  { href: '/contact/', label: 'Contact' },
];
```

**Source:** Verified from `src/components/Header.astro` lines 7-13. The array drives both desktop and mobile nav menus automatically. The `isActive` logic (`currentPath.startsWith(link.href)`) already handles sub-page highlighting for paths like `/beauty-index/python/`.

**Key consideration:** The nav currently has 5 items. Adding a 6th keeps it reasonable for desktop. On mobile, the hamburger menu handles any number of links. Place "Beauty Index" after "Blog" and before "Projects" for logical grouping (content sections together).

### Pattern 2: JSON-LD Dataset/ItemList Schema (SEO-02)

**What:** Add structured data to the Beauty Index overview page using schema.org Dataset and ItemList types.

**When to use:** On the `/beauty-index/` overview page which presents a ranked dataset.

**Implementation:** Create `src/components/BeautyIndexJsonLd.astro`:

```astro
---
import { type Language, totalScore } from '../lib/beauty-index/schema';

interface Props {
  languages: Language[];
}

const { languages } = Astro.props;

const sorted = [...languages].sort((a, b) => totalScore(b) - totalScore(a));

const schema = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  "name": "The Beauty Index",
  "description": "Ranking 25 programming languages across 6 aesthetic dimensions: Aesthetic Geometry, Mathematical Elegance, Linguistic Clarity, Practitioner Happiness, Ecosystem Craft, and Innovation Spirit.",
  "url": "https://patrykgolabek.dev/beauty-index/",
  "creator": {
    "@type": "Person",
    "@id": "https://patrykgolabek.dev/#person",
    "name": "Patryk Golabek"
  },
  "keywords": [
    "programming languages",
    "code aesthetics",
    "language ranking",
    "software aesthetics",
    "beauty index"
  ],
  "variableMeasured": [
    "Aesthetic Geometry (Phi)",
    "Mathematical Elegance (Omega)",
    "Linguistic Clarity (Lambda)",
    "Practitioner Happiness (Psi)",
    "Ecosystem Craft (Gamma)",
    "Innovation Spirit (Sigma)"
  ],
  "measurementTechnique": "Editorial scoring: each dimension rated 1-10 by expert judgment",
  "mainEntity": {
    "@type": "ItemList",
    "itemListOrder": "https://schema.org/ItemListOrderDescending",
    "numberOfItems": sorted.length,
    "itemListElement": sorted.map((lang, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": lang.name,
      "url": `https://patrykgolabek.dev/beauty-index/${lang.id}/`
    }))
  }
};
---

<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

**Source:** Pattern follows existing `ProjectsJsonLd.astro` (line-for-line structural match). Dataset properties verified from [schema.org/Dataset](https://schema.org/Dataset). ItemList properties verified from [schema.org/ItemList](https://schema.org/ItemList).

### Pattern 3: Breadcrumb JSON-LD (SEO-03)

**What:** Add BreadcrumbJsonLd to all Beauty Index pages for structured breadcrumb data.

**When to use:** On every Beauty Index page (overview, language detail, code comparison).

**Implementation examples (following blog `[slug].astro` pattern):**

Overview page (`/beauty-index/`):
```astro
<BreadcrumbJsonLd crumbs={[
  { name: "Home", url: "https://patrykgolabek.dev/" },
  { name: "Beauty Index", url: "https://patrykgolabek.dev/beauty-index/" },
]} />
```

Language detail page (`/beauty-index/{slug}/`):
```astro
<BreadcrumbJsonLd crumbs={[
  { name: "Home", url: `${Astro.site}` },
  { name: "Beauty Index", url: `${new URL('/beauty-index/', Astro.site)}` },
  { name: language.name, url: `${new URL('/beauty-index/' + language.id + '/', Astro.site)}` },
]} />
```

Code comparison page (`/beauty-index/code/`):
```astro
<BreadcrumbJsonLd crumbs={[
  { name: "Home", url: `${Astro.site}` },
  { name: "Beauty Index", url: `${new URL('/beauty-index/', Astro.site)}` },
  { name: "Code Comparison", url: `${new URL('/beauty-index/code/', Astro.site)}` },
]} />
```

**Source:** Verified from `src/components/BreadcrumbJsonLd.astro` (accepts `crumbs: Crumb[]` where each has `name` and `url`). Usage pattern verified from `src/pages/blog/[slug].astro` lines 73-77.

### Pattern 4: Visual Breadcrumb Navigation

**What:** Add visible breadcrumb trail in addition to JSON-LD (best practice for UX and SEO).

**Implementation:** Add a visual breadcrumb nav above the h1 on each Beauty Index page:

```astro
<nav aria-label="Breadcrumb" class="text-sm text-[var(--color-text-secondary)] mb-4">
  <ol class="flex items-center gap-1">
    <li><a href="/" class="hover:text-[var(--color-accent)] transition-colors">Home</a></li>
    <li aria-hidden="true" class="mx-1">/</li>
    <li><a href="/beauty-index/" class="hover:text-[var(--color-accent)] transition-colors">Beauty Index</a></li>
    <li aria-hidden="true" class="mx-1">/</li>
    <li aria-current="page">{language.name}</li>
  </ol>
</nav>
```

### Pattern 5: Homepage Cross-Linking (SEO-04)

**What:** Add an internal link from the homepage to the Beauty Index section.

**Implementation:** Add a Beauty Index callout section on the homepage, either as a new section or integrated into an existing section. The homepage (`src/pages/index.astro`) has: Hero, "What I Build", divider, "Latest Writing", divider, "Contact CTA". A natural placement is after "What I Build" or as a featured link in the hero CTA buttons.

Option A -- Add to hero CTAs:
```astro
<a
  href="/beauty-index/"
  class="inline-flex items-center text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] font-medium transition-colors"
  data-magnetic
>
  Explore the Beauty Index &rarr;
</a>
```

Option B -- Add a dedicated section between "What I Build" and "Latest Writing":
```astro
<section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-reveal>
  <a href="/beauty-index/" class="block card-hover p-6 rounded-lg border border-[var(--color-border)]" data-tilt>
    <h3 class="text-lg font-heading font-bold">The Beauty Index</h3>
    <p class="text-sm text-[var(--color-text-secondary)] mt-2">
      25 programming languages ranked across 6 aesthetic dimensions. From Haskell's mathematical purity to COBOL's industrial grit.
    </p>
    <span class="text-[var(--color-accent)] text-sm mt-2 inline-block">Explore rankings &rarr;</span>
  </a>
</section>
```

### Anti-Patterns to Avoid

- **Hardcoding sitemap entries for Beauty Index pages.** The `@astrojs/sitemap` integration auto-discovers all static pages. Adding `customPages` entries for `/beauty-index/` paths would create duplicates.
- **Creating separate JSON-LD schemas for each language detail page.** The Dataset/ItemList schema belongs on the overview page. Individual language pages get breadcrumbs only (plus the existing SEOHead meta tags which are sufficient).
- **Using `aria-sort="none"` on unsorted columns.** Per Adrian Roselli's research, omit `aria-sort` entirely from unsorted columns rather than using `aria-sort="none"`.
- **Adding too many nav items.** 6 items (Home, Blog, Beauty Index, Projects, About, Contact) is the maximum. Do not add sub-items or dropdowns.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Breadcrumb JSON-LD | Custom schema builder | `BreadcrumbJsonLd.astro` component | Already exists, tested, matches schema.org spec |
| Sitemap entries | Manual XML or `customPages` config | `@astrojs/sitemap` auto-discovery | Static pages auto-included; manual would create duplicates |
| Meta tags (title, description, OG, Twitter) | Custom meta component | `SEOHead.astro` via `Layout.astro` | All Beauty Index pages already use this |
| Canonical URLs | Manual URL construction | `SEOHead.astro` auto-computes from `Astro.url` | Already working for all pages |
| Tab keyboard navigation | Custom tablist implementation | Existing `CodeComparisonTabs.tsx` | Already implements WAI-ARIA tabs with roving tabindex |
| OG images for Beauty Index | New OG image endpoint | Existing `/open-graph/[...slug].png.ts` | Already generates images for `/beauty-index/*` paths |

**Key insight:** The SEO infrastructure is already mature. Phase 5 and Phase 7 established all the patterns. This phase is integration work -- wiring existing components into Beauty Index pages and fixing accessibility gaps -- not building new infrastructure.

## Common Pitfalls

### Pitfall 1: ScoringTable Sort Not Keyboard Accessible

**What goes wrong:** The scoring table headers use `th` elements with click handlers but no `button` elements inside them. Screen reader users and keyboard-only users cannot activate sort controls.

**Why it happens:** The original implementation used `th.addEventListener('click')` which works with mouse but not keyboard focus/activation. The `th` elements lack `tabindex`, `role="button"`, or nested `<button>` elements.

**How to avoid:** Wrap sort trigger text in a `<button>` element inside each `<th>`. Add `aria-sort` attribute to the active sort column header. Add an `aria-live="polite"` region to announce sort changes.

**Warning signs:** Tab key skips over table headers entirely. Screen reader does not announce sort state.

**Fix pattern:**
```astro
<th>
  <button
    type="button"
    data-sort="rank"
    data-type="number"
    class="sort-button"
    aria-label="Sort by rank"
  >
    Rank
  </button>
</th>
```

The JavaScript handler should:
1. Set `aria-sort="ascending"` or `aria-sort="descending"` on the parent `<th>`
2. Remove `aria-sort` from all other `<th>` elements
3. Update a live region: `liveRegion.textContent = "Sorted by ${column}, ${direction}"`

### Pitfall 2: SVG Radar Charts Not Accessible to Screen Readers

**What goes wrong:** The radar charts use `role="img"` with an `aria-label` like "Radar chart for Python showing scores across 6 dimensions" but do not provide the actual score data in a text format that screen readers can access.

**Why it happens:** SVG chart content (polygon coordinates, text labels) is visual-only. The `aria-label` summarizes but doesn't convey the data.

**How to avoid:** Add a visually hidden data table (or `<dl>` definition list) adjacent to each radar chart that provides the same data in text form. Use `sr-only` class (Tailwind's screen-reader-only utility) for the table so sighted users see the chart while screen reader users get the data.

**Warning signs:** Screen reader announces "Radar chart for Python" but never reads the actual scores.

**Fix pattern:**
```astro
<div class="sr-only">
  <table>
    <caption>Score breakdown for {language.name}</caption>
    <thead><tr><th>Dimension</th><th>Score</th></tr></thead>
    <tbody>
      {DIMENSIONS.map((dim) => (
        <tr>
          <td>{dim.name}</td>
          <td>{language[dim.key]}/10</td>
        </tr>
      ))}
      <tr><td>Total</td><td>{totalScore(language)}/60</td></tr>
    </tbody>
  </table>
</div>
```

### Pitfall 3: Lighthouse Performance Hit from Code Comparison Page

**What goes wrong:** The code comparison page renders 250 syntax-highlighted code blocks at build time. Lighthouse performance score drops below 90 due to excessive DOM size and long initial paint.

**Why it happens:** All 250 code blocks exist in the HTML even though only 25 are visible at a time (10 tabs x 25 languages per tab, but 9 tabs hidden).

**How to avoid:** The page already uses `content-visibility: auto` and `contain-intrinsic-size` on tab panels (verified in `code/index.astro` line 55). This should help. If Lighthouse still flags DOM size, ensure the hidden panels truly have `hidden` attribute applied (which CodeComparisonTabs.tsx already manages). The `content-visibility: auto` approach is the correct solution for this -- do not try to lazy-load or dynamically render panels.

**Warning signs:** Lighthouse Performance score below 90 specifically on the code comparison page. "Avoid an excessive DOM size" warning.

### Pitfall 4: Duplicate Sitemap Entries

**What goes wrong:** Manually adding Beauty Index URLs to the `customPages` array in `astro.config.mjs` creates duplicates because `@astrojs/sitemap` already auto-discovers all static routes.

**Why it happens:** The `customPages` array is currently used for external subdomain apps (`networking-tools.patrykgolabek.dev`, etc.) which are NOT auto-discovered. Beauty Index pages ARE auto-discovered because they're generated by Astro's static build.

**How to avoid:** Do NOT add any `/beauty-index/*` entries to `customPages`. Simply verify they appear in the auto-generated sitemap after build.

**Warning signs:** Duplicate URL entries in `sitemap-0.xml`.

### Pitfall 5: Missing Breadcrumb URL Consistency

**What goes wrong:** Breadcrumb URLs use relative paths or inconsistent formats, causing structured data validation errors.

**Why it happens:** Mixing `Astro.site` (which includes trailing slash) with manual string concatenation.

**How to avoid:** Follow the exact pattern from blog `[slug].astro`:
```astro
{ name: "Home", url: `${Astro.site}` }
{ name: "Beauty Index", url: `${new URL('/beauty-index/', Astro.site)}` }
```
Always use `new URL(path, Astro.site)` for consistent absolute URLs.

**Warning signs:** Google Rich Results Test shows "URL is not valid" errors for breadcrumb items.

### Pitfall 6: nav aria-label Collision

**What goes wrong:** Adding a visual breadcrumb `<nav>` without a unique `aria-label` creates confusion for screen reader users who navigate by landmarks.

**Why it happens:** The page already has `<nav aria-label="Main navigation">` (desktop) and `<nav aria-label="Mobile navigation">` (mobile) from Header.astro. Adding another `<nav>` without a distinct label makes them indistinguishable.

**How to avoid:** Use `aria-label="Breadcrumb"` on the breadcrumb nav element.

## Code Examples

### Example 1: BeautyIndexJsonLd Component

See Pattern 2 above for the complete component code. Key schema.org types used:
- `Dataset` -- for the overall Beauty Index dataset
- `ItemList` with `ItemListOrderDescending` -- for the ranked list of languages
- `ListItem` with `position` -- for each language entry

### Example 2: ScoringTable Accessible Sort Headers

Replacement pattern for the current `<th>` elements in `ScoringTable.astro`:

```astro
<th scope="col">
  <button
    type="button"
    class="sort-btn inline-flex items-center gap-1 px-2 py-2 w-full text-left cursor-pointer select-none bg-transparent border-none font-inherit"
    data-sort="rank"
    data-type="number"
    aria-label="Sort by rank, currently sorted descending"
  >
    Rank
    <span class="sort-indicator" aria-hidden="true"></span>
  </button>
</th>
```

JavaScript update pattern:
```javascript
// After sorting
const th = button.closest('th');
// Clear all aria-sort
headers.forEach(h => h.closest('th')?.removeAttribute('aria-sort'));
// Set current
th.setAttribute('aria-sort', newDir === 'asc' ? 'ascending' : 'descending');
// Announce
const liveRegion = document.getElementById('sort-status');
if (liveRegion) {
  liveRegion.textContent = `Table sorted by ${key}, ${newDir === 'asc' ? 'ascending' : 'descending'}`;
  setTimeout(() => { liveRegion.textContent = ''; }, 1000);
}
```

### Example 3: Accessible Radar Chart Alternative

Screen-reader-only data table placed adjacent to the SVG radar chart:

```astro
<div class="sr-only" aria-label={`Score data for ${language.name}`}>
  <dl>
    {DIMENSIONS.map((dim) => (
      <>
        <dt>{dim.name}</dt>
        <dd>{language[dim.key]} out of 10</dd>
      </>
    ))}
    <dt>Total</dt>
    <dd>{totalScore(language)} out of 60</dd>
  </dl>
</div>
```

### Example 4: Blog Post Cross-Link for SEO-04

Adding a Beauty Index link to an existing blog post. The blog post `building-kubernetes-observability-stack.mdx` could include a contextual mention if relevant, or a simpler approach is to add a "Related content" section at the end of 2+ blog posts:

```mdx
---

**Related:** Curious how programming languages compare on aesthetics?
Check out the [Beauty Index](/beauty-index/) where 25 languages are scored across 6 dimensions.
```

The `the-beauty-index.mdx` blog post already links extensively to Beauty Index pages (overview, individual languages, code comparison). Phase 20 verified this.

### Example 5: Sitemap Verification

After build, verify sitemap includes Beauty Index pages:

```bash
npx astro build && grep "beauty-index" dist/sitemap-0.xml
```

Expected output should include:
- `https://patrykgolabek.dev/beauty-index/`
- `https://patrykgolabek.dev/beauty-index/haskell/` (and 24 other languages)
- `https://patrykgolabek.dev/beauty-index/code/`

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `src/content/` directory for collections | `defineCollection` with `glob`/`file` loaders | Astro 5.x | This project uses v2 already |
| `@astrojs/sitemap` manual page lists | Auto-discovery of all static routes | Astro 4.x+ | Beauty Index pages auto-included |
| `aria-sort="none"` on unsorted columns | Omit `aria-sort` entirely | WAI-ARIA best practice | Reduces screen reader noise |
| Custom meta tag management | `SEOHead.astro` component | Phase 5 | All pages already have proper meta |
| Client-side breadcrumb rendering | Build-time JSON-LD + visual breadcrumbs | Standard practice | Better for SEO crawlability |

**Deprecated/outdated:**
- None relevant. All patterns are current.

## Accessibility Audit Checklist (SEO-07)

This section catalogs every interactive element across Beauty Index pages that must be tested:

### Overview Page (`/beauty-index/`)

| Element | Current State | Required Fix |
|---------|--------------|--------------|
| Ranking bar chart (SVG) | `role="img"` with aria-label | Add sr-only data table with all scores |
| Scoring table sort headers | `th` with click handlers, no buttons | Wrap in `<button>`, add `aria-sort`, add live region |
| Language grid links | Standard `<a>` tags | Verify focus visible, verify link text is descriptive |

### Language Detail Page (`/beauty-index/{slug}/`)

| Element | Current State | Required Fix |
|---------|--------------|--------------|
| Radar chart (SVG) | `role="img"` with aria-label | Add sr-only description list with scores |
| Share controls buttons | Have `aria-label` | Already accessible; verify with keyboard |
| Language nav (prev/next) | Standard `<a>` tags | Already accessible |
| Code snippet (Expressive Code) | Built-in accessibility | Verify focus management |

### Code Comparison Page (`/beauty-index/code/`)

| Element | Current State | Required Fix |
|---------|--------------|--------------|
| Tab buttons (React) | WAI-ARIA tabs with roving tabindex | Already implemented correctly; verify |
| Feature matrix table | Standard table with sticky column | Add `scope="col"` to headers, verify keyboard scroll |
| Code blocks | Expressive Code managed | Verify focus and keyboard navigation |

### Cross-Page Checks

| Check | WCAG Criterion | How to Verify |
|-------|----------------|---------------|
| All interactive elements keyboard-reachable | 2.1.1 Keyboard (A) | Tab through entire page, verify all controls reachable |
| No keyboard trap | 2.1.2 No Keyboard Trap (A) | Verify Tab/Shift+Tab can exit all controls |
| Focus visible on all interactive elements | 2.4.7 Focus Visible (AA) | Tab through page, verify visible focus indicator |
| Color contrast 4.5:1 for text | 1.4.3 Contrast (AA) | Lighthouse automated check |
| Non-text contrast 3:1 for UI components | 1.4.11 Non-text Contrast (AA) | Check chart colors, sort indicators, tier badges |
| Text alternatives for non-text content | 1.1.1 Non-text Content (A) | Verify all SVG charts have text alternatives |
| Meaningful sequence | 1.3.2 Meaningful Sequence (A) | Verify DOM order matches visual order |
| Info and relationships | 1.3.1 Info and Relationships (A) | Verify table headers use `scope`, lists use proper markup |

## Lighthouse Audit Strategy (SEO-06)

### Pages to Audit

1. `/beauty-index/` -- Overview (heaviest page: bar chart SVG + full table + 25 radar thumbnails)
2. `/beauty-index/python/` -- Representative language detail page
3. `/beauty-index/code/` -- Code comparison (250 code blocks, largest DOM)

### Expected Issue Areas

| Category | Likely Issue | Mitigation |
|----------|-------------|------------|
| Performance | Large DOM size on code comparison page | Already uses `content-visibility: auto`; verify hidden panels reduce layout cost |
| Performance | Multiple SVG charts on overview page | Build-time rendered, no JS overhead; should be fine |
| Accessibility | Missing form labels (sort buttons) | Fix as part of SEO-07 |
| Accessibility | Missing link names | Verify all `<a>` elements have discernible text |
| SEO | Missing structured data | Added by SEO-02 and SEO-03 |
| Best Practices | CSP issues with inline scripts | Existing CSP allows `'unsafe-inline'`; no new issues |

### Running Lighthouse

```bash
# Build the site first
npx astro build

# Serve locally
npx astro preview &

# Run Lighthouse CI (install if needed: npm i -g lighthouse)
lighthouse http://localhost:4321/beauty-index/ --output=json --output-path=./lighthouse-overview.json
lighthouse http://localhost:4321/beauty-index/python/ --output=json --output-path=./lighthouse-detail.json
lighthouse http://localhost:4321/beauty-index/code/ --output=json --output-path=./lighthouse-code.json
```

Target: All four categories (Performance, Accessibility, Best Practices, SEO) at 90+.

## Open Questions

1. **Homepage Beauty Index placement**
   - What we know: The homepage has 3 sections (What I Build, Latest Writing, Contact CTA). A Beauty Index link needs to go somewhere.
   - What's unclear: Whether to add it as a hero CTA button, a standalone section, or inline within "What I Build."
   - Recommendation: Add as a standalone card section between "What I Build" and "Latest Writing" for maximum visibility. It's the site's most distinctive content and deserves prominent placement.

2. **Which existing blog posts to cross-link (SEO-04)**
   - What we know: Success criteria requires "at least 2 existing blog posts contain internal links to Beauty Index pages." The blog currently has `the-beauty-index.mdx` (which already links to Beauty Index) and `building-kubernetes-observability-stack.mdx` (about Kubernetes, no natural connection).
   - What's unclear: Whether the many `ext-*.md` external blog posts count (they redirect externally and are not editable content).
   - Recommendation: The `the-beauty-index.mdx` counts as one. For the second, add a brief contextual mention in `building-kubernetes-observability-stack.mdx` (e.g., "See how different languages compare in the [Beauty Index](/beauty-index/)"). Alternatively, any external blog post frontmatter cannot be edited since the content lives externally.

3. **Visual breadcrumb styling**
   - What we know: BreadcrumbJsonLd provides schema.org markup but no visible UI. Blog posts currently have no visible breadcrumbs either (only JSON-LD).
   - What's unclear: Whether to add visible breadcrumb navigation or just the JSON-LD.
   - Recommendation: Add both visible breadcrumbs and JSON-LD to Beauty Index pages. The visible breadcrumbs improve UX (users can navigate back to overview from detail pages) and provide additional internal linking signals for SEO. Blog posts were never given visible breadcrumbs; the Beauty Index has deeper hierarchy (3 levels) which benefits more from visible breadcrumbs.

4. **RankingBarChart SVG accessibility depth**
   - What we know: The bar chart renders all 25 languages with 6-segment stacked bars. It has `role="img"` and a generic `aria-label`.
   - What's unclear: Whether a full sr-only data table is needed for the bar chart given that the ScoringTable immediately below it provides the same data in a real HTML table.
   - Recommendation: The ScoringTable already provides the data in accessible table format. For the bar chart, enhance the `aria-label` to be more descriptive (e.g., "Bar chart ranking 25 programming languages by total beauty score, from Haskell at 53 to COBOL at 21") but do NOT duplicate the data in a separate sr-only table. The adjacent ScoringTable serves that purpose.

## Sources

### Primary (HIGH confidence)

- **Codebase inspection** -- All findings verified by reading actual source files:
  - `src/components/Header.astro` -- navigation structure, `navLinks` array, active state logic
  - `src/components/BreadcrumbJsonLd.astro` -- existing breadcrumb component interface
  - `src/components/BlogPostingJsonLd.astro` -- existing JSON-LD pattern
  - `src/components/PersonJsonLd.astro` -- existing JSON-LD pattern
  - `src/components/ProjectsJsonLd.astro` -- existing JSON-LD pattern
  - `src/components/SEOHead.astro` -- meta tag management
  - `src/layouts/Layout.astro` -- page shell structure, WebSite JSON-LD
  - `src/pages/index.astro` -- homepage structure for cross-linking
  - `src/pages/beauty-index/index.astro` -- overview page structure
  - `src/pages/beauty-index/[slug].astro` -- language detail page structure
  - `src/pages/beauty-index/code/index.astro` -- code comparison page structure
  - `src/pages/blog/[slug].astro` -- existing BreadcrumbJsonLd usage pattern
  - `src/components/beauty-index/ScoringTable.astro` -- sort implementation (accessibility gap identified)
  - `src/components/beauty-index/CodeComparisonTabs.tsx` -- tab implementation (already accessible)
  - `src/components/beauty-index/RadarChart.astro` -- SVG chart accessibility
  - `src/components/beauty-index/RankingBarChart.astro` -- SVG chart accessibility
  - `src/components/beauty-index/FeatureMatrix.astro` -- table accessibility
  - `src/components/beauty-index/ShareControls.astro` -- button accessibility
  - `src/components/beauty-index/LanguageNav.astro` -- navigation accessibility
  - `src/components/beauty-index/LanguageGrid.astro` -- grid link accessibility
  - `astro.config.mjs` -- sitemap integration configuration
  - `src/content.config.ts` -- content collection schema

- [schema.org/Dataset](https://schema.org/Dataset) -- Dataset type properties
- [schema.org/ItemList](https://schema.org/ItemList) -- ItemList type properties and ListItem structure

### Secondary (MEDIUM confidence)

- [Adrian Roselli - Sortable Table Columns](https://adrianroselli.com/2021/04/sortable-table-columns.html) -- Authoritative reference for accessible sortable tables with aria-sort, button patterns, and live region announcements
- [@astrojs/sitemap documentation](https://docs.astro.build/en/guides/integrations-guide/sitemap/) -- Confirmed auto-discovery of static routes
- [Google Dataset Structured Data](https://developers.google.com/search/docs/appearance/structured-data/dataset) -- Google's requirements for Dataset markup

### Tertiary (LOW confidence)

- None. All findings verified from primary or secondary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all tools already installed, verified from codebase
- Architecture: HIGH -- all patterns follow existing codebase conventions verified from source
- Pitfalls: HIGH -- accessibility gaps identified by direct code inspection; WCAG requirements verified from authoritative sources
- JSON-LD schema: HIGH -- verified from schema.org official documentation
- Lighthouse targets: MEDIUM -- actual scores depend on runtime performance which can only be verified by running audits

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (stable -- no external dependencies or fast-moving libraries)
