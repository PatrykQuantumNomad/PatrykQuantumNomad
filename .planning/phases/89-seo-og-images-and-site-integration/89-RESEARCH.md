# Phase 89: SEO, OG Images, and Site Integration - Research

**Researched:** 2026-03-08
**Domain:** Astro site integration -- navigation, OG image generation, JSON-LD structured data, sitemap, LLMs.txt, blog authoring
**Confidence:** HIGH

## Summary

This phase integrates the FastAPI Production Guide (built in Phases 85-88) into the broader patrykgolabek.dev site. The work spans seven requirements: header navigation, homepage callout card, companion blog post, build-time OG images with content-hash caching, JSON-LD structured data (TechArticle + BreadcrumbList), LLMs.txt entries, and sitemap inclusion. Every one of these patterns already exists in the codebase for EDA Visual Encyclopedia, Beauty Index, or blog posts -- so the implementation is purely about replicating proven patterns for the guide domain.

The codebase already has a mature OG image pipeline (satori + sharp), a reusable `BreadcrumbJsonLd.astro` component, the `@astrojs/sitemap` integration with auto-inclusion, and the `llms.txt` / `llms-full.txt` endpoint pattern. The header currently has 9 nav items. The guide already has a visual breadcrumb (`GuideBreadcrumb.astro`) but lacks the JSON-LD breadcrumb counterpart. The `GuideLayout.astro` already accepts `ogImage` as a prop but it is never passed from `[slug].astro`.

**Primary recommendation:** Follow existing EDA and blog patterns exactly -- add a `generateGuideOgImage` function to `og-image.ts`, create a `GuideJsonLd.astro` component modeled on `EDAJsonLd.astro`, wire OG images through `GuideLayout`, add "Guides" to the header nav array, and author the blog post as a standard MDX file in `src/data/blog/`.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SITE-01 | Header navigation link for Guides section | Header.astro has a `navLinks` array -- add `{ href: '/guides/', label: 'Guides' }`. Currently 9 items, becomes 10. Placement decision documented below. |
| SITE-02 | Homepage callout card linking to FastAPI Production Guide | Homepage has "Reference Guides" section with 3 cards (Beauty Index, DB Compass, EDA). Add a 4th card or create a separate "Guides" subsection. Pattern is `<a href="/guides/fastapi-production/">` with card-hover styling. |
| SITE-03 | Companion blog post with bidirectional cross-links to all 11 domain pages | Blog uses MDX files in `src/data/blog/` with standard frontmatter. Use existing blog components (OpeningStatement, TldrSummary, KeyTakeaway, Callout). Cross-links use `guidePageUrl()` helper. |
| SITE-04 | Build-time OG images for landing page and all 11 domain pages (12 total) with content-hash caching | Follow EDA pattern: `generateGuideOgImage()` in `og-image.ts` + `getOrGenerateOgImage()` from `og-cache.ts` (or a new `guide/og-cache.ts`). OG endpoint at `src/pages/open-graph/guides/[...slug].png.ts`. |
| SITE-05 | JSON-LD structured data (TechArticle + BreadcrumbList) on all guide pages | Create `GuideJsonLd.astro` modeled on `EDAJsonLd.astro`. Use existing `BreadcrumbJsonLd.astro` component. Wire into `GuideLayout.astro` and landing page. |
| SITE-06 | LLMs.txt entries for guide section | Add guide section to both `src/pages/llms.txt.ts` and `src/pages/llms-full.txt.ts` using `getCollection('guides')` and `getCollection('guidePages')`. |
| SITE-07 | All guide pages included in sitemap | Already handled -- `@astrojs/sitemap` auto-includes all static pages. Verify by checking build output. The existing filter only excludes `/404`. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | ^5.3.0 | Static site framework | Already installed, all pages use it |
| satori | ^0.19.2 | OG image SVG generation | Already used for all existing OG images |
| sharp | ^0.34.5 | SVG-to-PNG conversion | Already used for all existing OG images |
| @astrojs/sitemap | ^3.7.0 | Sitemap generation | Already configured in astro.config.mjs |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @astrojs/mdx | (installed) | Blog post MDX support | Companion blog post authoring |
| vitest | ^4.0.18 | Unit testing | Validating OG cache, route helpers |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| satori | @vercel/og | Would require different setup; satori is already proven in this codebase |
| Manual sitemap entries | Already automatic | @astrojs/sitemap auto-includes all getStaticPaths pages |

**Installation:**
```bash
# No new packages needed -- all dependencies are already installed
```

## Architecture Patterns

### Recommended File Structure
```
src/
├── components/
│   └── guide/
│       └── GuideJsonLd.astro           # NEW: TechArticle JSON-LD
├── data/
│   └── blog/
│       └── fastapi-production-guide.mdx # NEW: companion blog post
├── lib/
│   └── guides/
│       └── og-cache.ts                  # NEW: guide-specific OG cache (CACHE_DIR = 'node_modules/.cache/og-guide')
├── pages/
│   ├── open-graph/
│   │   └── guides/
│   │       ├── fastapi-production.png.ts       # NEW: landing page OG
│   │       └── fastapi-production/
│   │           └── [slug].png.ts               # NEW: chapter OG images
│   └── guides/
│       └── fastapi-production/
│           ├── index.astro              # MODIFY: add OG image + JSON-LD
│           └── [slug].astro             # MODIFY: add OG image + JSON-LD
└── pages/
    ├── llms.txt.ts                      # MODIFY: add guide section
    └── llms-full.txt.ts                 # MODIFY: add guide section
```

### Pattern 1: OG Image Generation (following EDA pattern)
**What:** Build-time static PNG generation using satori + sharp with content-hash caching
**When to use:** Every guide page needs a unique OG image
**Example:**
```typescript
// Source: src/pages/open-graph/eda/[...slug].png.ts (existing pattern)
export const GET: APIRoute = async ({ props }) => {
  const { title, description, category } = props as OgEntry;
  const png = await getOrGenerateOgImage(
    title,
    description,
    () => generateGuideOgImage(title, description, chapterLabel),
  );
  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
```

### Pattern 2: JSON-LD Structured Data (following EDA pattern)
**What:** Schema.org TechArticle + BreadcrumbList JSON-LD for SEO
**When to use:** Every guide page, including the landing page
**Example:**
```typescript
// Source: src/components/eda/EDAJsonLd.astro (existing pattern)
// GuideJsonLd.astro should follow the same structure:
// - TechArticle for chapter pages
// - WebPage or Collection for landing page
// - Always include isPartOf referencing the guide landing URL
const schema = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "headline": title,
  "description": description,
  "url": url,
  "author": { "@type": "Person", "@id": "https://patrykgolabek.dev/#person" },
  "isPartOf": {
    "@type": "WebPage",
    "name": "FastAPI Production Guide",
    "url": "https://patrykgolabek.dev/guides/fastapi-production/",
  },
};
```

### Pattern 3: Header Navigation Addition
**What:** Adding a 10th nav item to the header
**When to use:** SITE-01 requirement
**Example:**
```typescript
// Source: src/components/Header.astro (existing pattern)
const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/blog/', label: 'Blog' },
  { href: '/beauty-index/', label: 'Beauty Index' },
  { href: '/db-compass/', label: 'DB Compass' },
  { href: '/eda/', label: 'EDA' },
  { href: '/guides/', label: 'Guides' },  // NEW -- insert after EDA
  { href: '/tools/', label: 'Tools' },
  { href: '/projects/', label: 'Projects' },
  { href: '/about/', label: 'About' },
  { href: '/contact/', label: 'Contact' },
];
```

### Pattern 4: Homepage Callout Card
**What:** A card on the homepage linking to the guide
**When to use:** SITE-02 requirement
**Example:**
```astro
<!-- Source: src/pages/index.astro existing "Reference Guides" section pattern -->
<a href="/guides/fastapi-production/" class="block card-hover rounded-lg border border-[var(--color-border)] no-underline overflow-hidden" data-reveal data-tilt>
  <article>
    <div class="p-6">
      <p class="meta-mono text-[var(--color-accent)]">Production Guide</p>
      <h3 class="text-lg font-heading font-bold text-[var(--color-text-primary)] mt-2">FastAPI Production Guide</h3>
      <p class="text-sm text-[var(--color-text-secondary)] mt-2">
        11 chapters covering middleware, auth, observability, database, Docker,
        testing, health checks, security headers, rate limiting, and caching.
      </p>
      <span class="inline-block mt-4 text-sm font-medium text-[var(--color-accent)]">Read the guide &rarr;</span>
    </div>
  </article>
</a>
```

### Pattern 5: LLMs.txt Guide Section
**What:** Adding guide entries to both llms.txt and llms-full.txt endpoints
**When to use:** SITE-06 requirement
**Example:**
```typescript
// Source: src/pages/llms.txt.ts (existing pattern for EDA section)
// Add after EDA section:
'## FastAPI Production Guide',
'',
'Production-ready FastAPI template guide covering 11 chapters.',
'',
`- [FastAPI Production Guide](https://patrykgolabek.dev/guides/fastapi-production/): ${guideMeta.data.description}`,
...guidePages
  .sort((a, b) => a.data.order - b.data.order)
  .map(p => `- [${p.data.title}](https://patrykgolabek.dev${guidePageUrl(guideMeta.data.slug, p.data.slug)}): ${p.data.description}`),
```

### Anti-Patterns to Avoid
- **Creating a /guides/ index page:** Not required by the requirements. Only add the header nav link pointing to `/guides/`. Since there is only one guide, `/guides/` can redirect or link directly to `/guides/fastapi-production/`. Keep it simple.
- **Different OG image template per chapter:** Use ONE template function (`generateGuideOgImage`) with a chapter label parameter, just like EDA uses one `generateEdaPillarOgImage` for all categories.
- **Inlining JSON-LD in page files:** Always use a dedicated component (like `GuideJsonLd.astro`), matching the established pattern.
- **Adding OG images to Layout.astro defaults:** Always pass `ogImage` explicitly from the page route, not from the layout.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OG image generation | Custom canvas/image library | satori + sharp (already installed) | Proven pipeline, consistent branding across 90+ existing pages |
| Content-hash caching | Custom file hash system | `og-cache.ts` pattern (computeOgHash + getOrGenerateOgImage) | Handles cache directory, version bumping, hash collisions |
| Sitemap entries | Manual XML generation | @astrojs/sitemap (auto-includes all static pages) | Zero configuration for new pages |
| Breadcrumb JSON-LD | Inline JSON-LD objects | BreadcrumbJsonLd.astro component | Reusable, validated, consistent format |
| Blog post structure | Custom page template | Standard blog MDX + existing blog layout | Gets OG images, breadcrumbs, related posts, lightbox, TOC for free |

**Key insight:** Every single requirement in this phase has a direct precedent in the codebase. The implementation should be copy-adapt, not invent.

## Common Pitfalls

### Pitfall 1: Missing OG Image URL Construction
**What goes wrong:** OG image URLs are constructed incorrectly, resulting in broken social media previews
**Why it happens:** The OG image URL must match the exact path pattern of the `.png.ts` endpoint
**How to avoid:** Follow the blog pattern exactly: `const ogImageURL = new URL('/open-graph/guides/fastapi-production/' + slug + '.png', Astro.site).toString()`. Verify with `curl` or browser dev tools after build.
**Warning signs:** Sharing a page link shows the default OG image instead of the guide-specific one

### Pitfall 2: Header Navigation Overflow on Mobile
**What goes wrong:** Adding a 10th nav item causes the mobile menu to feel crowded or the desktop nav to wrap
**Why it happens:** The desktop nav uses `gap-6` between 9 items; adding a 10th might exceed the `max-w-6xl` container
**How to avoid:** Test at `md` breakpoint (768px). If needed, reduce `gap-6` to `gap-4` or use smaller font. The mobile menu uses full-width block links so it handles additional items gracefully.
**Warning signs:** Desktop nav wraps to two lines at 768-900px viewport widths

### Pitfall 3: OG Cache Version Not Bumped
**What goes wrong:** Stale cached OG images are served after template changes
**Why it happens:** The `og-cache.ts` uses a `CACHE_VERSION` constant. If you create a new `guide/og-cache.ts`, you need your own version constant.
**How to avoid:** Create `src/lib/guides/og-cache.ts` with its own `CACHE_DIR = 'node_modules/.cache/og-guide'` and `CACHE_VERSION = '1'`. Or reuse `src/lib/eda/og-cache.ts` by extracting the cache dir parameter.
**Warning signs:** OG images don't update after changing the template

### Pitfall 4: Blog Post Missing Bidirectional Links
**What goes wrong:** Blog post links to guide pages but guide pages don't link back
**Why it happens:** Forgetting the "bidirectional" requirement -- need links in BOTH directions
**How to avoid:** The companion blog post links to all 11 chapter pages. Each chapter page's MDX content should include a callout or footer referencing the blog post. Alternatively, add a "Read the companion blog post" link in GuideLayout.astro.
**Warning signs:** SITE-03 success criteria says "bidirectional cross-links"

### Pitfall 5: JSON-LD Missing from Landing Page
**What goes wrong:** Landing page at `/guides/fastapi-production/` has no structured data
**Why it happens:** Focus goes to chapter pages, landing page is forgotten
**How to avoid:** Landing page should have its own JSON-LD: either a `CollectionPage` or `WebPage` type with itemListElement pointing to chapters. Include BreadcrumbJsonLd too.
**Warning signs:** Google Search Console shows no structured data for the landing URL

### Pitfall 6: LLMs.txt Order of Collection Fetching
**What goes wrong:** Build fails because `getCollection('guides')` returns the guide JSON array and needs array destructuring
**Why it happens:** The `guides` collection uses `file()` loader which returns an array, not a single entry
**How to avoid:** Use `const [guideMeta] = await getCollection('guides');` (already established in landing page code)
**Warning signs:** TypeScript error about array vs. object access

## Code Examples

Verified patterns from the existing codebase:

### OG Image Endpoint with Caching (EDA pattern)
```typescript
// Source: src/pages/open-graph/eda/[...slug].png.ts
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { generateEdaPillarOgImage } from '../../../lib/og-image';
import { getOrGenerateOgImage } from '../../../lib/eda/og-cache';

export const getStaticPaths = async () => {
  const pages = await getCollection('guidePages');
  return pages.map((page) => ({
    params: { slug: page.data.slug },
    props: { title: page.data.title, description: page.data.description },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const { title, description } = props;
  const png = await getOrGenerateOgImage(
    title, description,
    () => generateGuideOgImage(title, description, 'Chapter'),
  );
  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
```

### JSON-LD TechArticle Component (EDA pattern)
```astro
// Source: src/components/eda/EDAJsonLd.astro (adapted for guides)
---
interface Props {
  title: string;
  description: string;
  url: string;
  isLanding?: boolean;
}

const { title, description, url, isLanding = false } = Astro.props;

const person = {
  "@type": "Person",
  "@id": "https://patrykgolabek.dev/#person",
  "name": "Patryk Golabek",
  "url": "https://patrykgolabek.dev/",
};

const schema = isLanding ? {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": title,
  "description": description,
  "url": url,
  "author": person,
} : {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "headline": title,
  "description": description,
  "url": url,
  "inLanguage": "en",
  "proficiencyLevel": "Expert",
  "author": person,
  "publisher": person,
  "isPartOf": {
    "@type": "WebPage",
    "name": "FastAPI Production Guide",
    "url": "https://patrykgolabek.dev/guides/fastapi-production/",
  },
};
---
<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

### BreadcrumbJsonLd Usage (blog pattern)
```astro
// Source: src/pages/blog/[slug].astro
<BreadcrumbJsonLd crumbs={[
  { name: 'Home', url: 'https://patrykgolabek.dev/' },
  { name: 'Guides', url: 'https://patrykgolabek.dev/guides/' },
  { name: 'FastAPI Production Guide', url: 'https://patrykgolabek.dev/guides/fastapi-production/' },
  { name: chapterTitle, url: `https://patrykgolabek.dev/guides/fastapi-production/${slug}/` },
]} />
```

### OG Cache Module (EDA pattern)
```typescript
// Source: src/lib/eda/og-cache.ts
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const CACHE_DIR = 'node_modules/.cache/og-guide';  // Different from EDA cache
const CACHE_VERSION = '1';

export function computeOgHash(title: string, description: string): string {
  return createHash('md5')
    .update(`${CACHE_VERSION}:${title}:${description}`)
    .digest('hex')
    .slice(0, 12);
}

// Same getOrGenerateOgImage pattern as EDA
```

### Blog Post Frontmatter (existing pattern)
```yaml
---
title: "FastAPI Production Guide: What Your AI Agent Inherits"
description: "A companion overview of the FastAPI Production Guide covering 11 production concerns -- middleware, auth, observability, database, Docker, testing, health checks, security headers, rate limiting, and caching."
publishedDate: 2026-03-08
tags: ["fastapi", "python", "production", "kubernetes", "docker", "ai-agent", "devops"]
draft: false
---
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Per-page OG image hardcoding | Dynamic OG image generation via satori | Phases 30+ | Every new page auto-gets branded OG image |
| Manual sitemap XML | @astrojs/sitemap integration | Project inception | All pages auto-included |
| No LLMs.txt | llms.txt + llms-full.txt endpoints | Phase ~70 | LLM discoverability for all content |
| BlogPosting JSON-LD only | TechArticle + BreadcrumbList per section | EDA phase ~55 | Richer search snippets |

**Deprecated/outdated:**
- Nothing deprecated in this domain. All patterns are current and actively used.

## Open Questions

1. **Header nav item placement for "Guides"**
   - What we know: Currently 9 items. The prior decision note mentions "10th nav item risk." EDA sits at position 5. Content sections (Blog, Beauty Index, DB Compass, EDA) are grouped before utility sections (Tools, Projects, About, Contact).
   - What's unclear: Exact position -- should "Guides" go after EDA (position 6) or should reference content be regrouped?
   - Recommendation: Insert "Guides" after "EDA" (position 6). This keeps content-oriented items together. Test at `md` breakpoint for overflow.

2. **Homepage card placement for SITE-02**
   - What we know: The "Reference Guides" section has 3 cards in a 3-column grid. Adding a 4th breaks the grid symmetry (4 items in a 3-col grid = 3+1 layout).
   - What's unclear: Should the FastAPI guide card go in the existing "Reference Guides" section or be a separate section?
   - Recommendation: Add the guide card to the "Reference Guides" section. A 4-item grid wraps naturally (3+1 on lg, 2+2 on sm) and the CSS already supports it. Alternatively, rename the section to "Reference Guides & Tutorials" to accommodate.

3. **Blog post back-links from chapter pages**
   - What we know: SITE-03 requires "bidirectional cross-links." The blog post will link to all 11 chapters. The reverse direction (chapters -> blog) needs a mechanism.
   - What's unclear: Should back-links be added inline in each chapter's MDX, or as a shared component in GuideLayout?
   - Recommendation: Add a small callout component or text line in `GuideLayout.astro` (e.g., "Read the companion blog post" link). This is DRY and ensures all chapters link back without editing 11 MDX files.

4. **Whether to create a `/guides/` index page**
   - What we know: SITE-01 says "Header navigation link for Guides section" pointing to `/guides/`. There is no `/guides/index.astro` currently. The route helper has `GUIDE_ROUTES.guides = '/guides/'`.
   - What's unclear: Should `/guides/` be a simple redirect to `/guides/fastapi-production/` or a proper landing page?
   - Recommendation: Create a minimal `/guides/index.astro` page that lists available guides (currently just one). This future-proofs for GUIDE-01/02/03 requirements and gives the nav link a proper destination.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ^4.0.18 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements --> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SITE-01 | Header nav includes Guides link | manual | Visual check after `npm run dev` | N/A -- template change |
| SITE-02 | Homepage has guide callout card | manual | Visual check after `npm run dev` | N/A -- template change |
| SITE-03 | Blog post exists with cross-links | manual | Verify MDX renders, check links | N/A -- content file |
| SITE-04 | OG images generated with caching | unit | `npx vitest run src/lib/guides/__tests__/og-cache.test.ts -x` | No -- Wave 0 |
| SITE-05 | JSON-LD on all guide pages | smoke | `npm run build && grep -l "TechArticle" dist/guides/fastapi-production/*/index.html` | N/A -- build check |
| SITE-06 | LLMs.txt includes guide entries | smoke | `npm run build && grep "FastAPI Production Guide" dist/llms.txt` | N/A -- build check |
| SITE-07 | All guide pages in sitemap | smoke | `npm run build && grep "guides/fastapi-production" dist/sitemap-0.xml` | N/A -- build check |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/guides/ -x`
- **Per wave merge:** `npx vitest run && npm run build`
- **Phase gate:** Full build succeeds, sitemap includes guide pages, OG images render

### Wave 0 Gaps
- [ ] `src/lib/guides/__tests__/og-cache.test.ts` -- covers SITE-04 (content-hash caching logic)
- [ ] Guide OG cache module: `src/lib/guides/og-cache.ts` -- needed before OG endpoint

*(Test infrastructure (vitest) already exists. Only guide-specific OG cache tests are needed.)*

## Sources

### Primary (HIGH confidence)
- Existing codebase analysis -- `src/lib/og-image.ts` (13 generator functions), `src/lib/eda/og-cache.ts`, `src/pages/open-graph/eda/[...slug].png.ts`
- Existing codebase analysis -- `src/components/BreadcrumbJsonLd.astro`, `src/components/eda/EDAJsonLd.astro`, `src/components/BlogPostingJsonLd.astro`
- Existing codebase analysis -- `src/components/Header.astro` (navLinks array pattern)
- Existing codebase analysis -- `src/pages/llms.txt.ts`, `src/pages/llms-full.txt.ts`
- Existing codebase analysis -- `astro.config.mjs` (@astrojs/sitemap configuration, auto-includes all pages)
- Existing codebase analysis -- `src/pages/index.astro` (Reference Guides section, card grid pattern)
- Existing codebase analysis -- `src/pages/blog/[slug].astro` (blog post layout, JSON-LD, OG image URL construction)
- Existing codebase analysis -- `src/content.config.ts` (guides and guidePages collections)

### Secondary (MEDIUM confidence)
- Schema.org TechArticle type documentation -- standard structured data type for technical articles

### Tertiary (LOW confidence)
- None -- all patterns are verified from existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and in use
- Architecture: HIGH -- every pattern has a direct codebase precedent
- Pitfalls: HIGH -- identified from actual codebase patterns and prior phase experiences

**Research date:** 2026-03-08
**Valid until:** 2026-04-07 (30 days -- stable patterns, no external dependencies)
