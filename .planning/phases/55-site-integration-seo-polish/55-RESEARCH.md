# Phase 55: Site Integration + SEO + Polish - Research

**Researched:** 2026-02-25
**Domain:** Astro static site SEO, structured data, accessibility, site integration
**Confidence:** HIGH

## Summary

Phase 55 is the final phase of the v1.8 EDA Visual Encyclopedia milestone. All 90+ EDA pages are built (Phases 48-54 complete). This phase integrates the EDA section into the existing site navigation, adds SEO infrastructure (JSON-LD, meta descriptions, OG images, sitemap, LLMs.txt), publishes a companion blog post, and validates quality (Lighthouse 90+, WCAG 2.1 AA, formula accuracy, content completeness).

The project is an Astro 5.3+ static site using Tailwind CSS, React islands, satori+sharp for OG images, and `@astrojs/sitemap` for automatic sitemap generation. Well-established patterns exist from prior milestones (Beauty Index, DB Compass, Dockerfile Analyzer, K8s Analyzer) for every requirement in this phase: header navigation, homepage callout cards, JSON-LD components, OG image endpoints, blog posts, and LLMs.txt generation. The work is primarily integration and configuration -- extending existing patterns to cover EDA pages rather than building new infrastructure.

**Primary recommendation:** Follow existing project patterns exactly. Every requirement maps to an established pattern from a prior milestone. The JSON-LD component pattern (e.g., `BeautyIndexJsonLd.astro`, `CompassJsonLd.astro`) should be replicated as `EDAJsonLd.astro`. OG images follow the `src/pages/open-graph/` endpoint pattern with `satori` + `sharp`. The blog post follows the `src/data/blog/*.mdx` frontmatter schema. No new libraries needed.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SITE-01 | "EDA" link added to Header.astro navigation between "DB Compass" and "Tools" | Header.astro `navLinks` array pattern documented; insert at index 4 |
| SITE-02 | Homepage callout card linking to /eda/ | Homepage "Reference Guides" section pattern documented with card markup |
| SITE-03 | JSON-LD structured data (TechArticle/LearningResource) on all EDA pages | Schema.org TechArticle/LearningResource properties documented; existing JsonLd component pattern verified |
| SITE-04 | Unique SEO meta description for every EDA page | Data already has `description` field in all schemas; EDALayout passes to Layout which passes to SEOHead |
| SITE-05 | All EDA pages included in sitemap | @astrojs/sitemap auto-includes all static pages; no extra config needed |
| SITE-06 | LLMs.txt updated with EDA section | `src/pages/llms.txt.ts` API route pattern documented; add EDA section between Interactive Tools and Beauty Index |
| SITE-07 | Build-time OG images for EDA overview and key pages | `src/pages/open-graph/` endpoint pattern + `src/lib/og-image.ts` satori+sharp pipeline documented |
| SITE-08 | Companion blog post covering EDA methodology | `src/data/blog/*.mdx` frontmatter schema and blog route pattern documented |
| SITE-09 | Bidirectional cross-links between blog post and EDA pages | Blog MDX inline links + EDA landing page link back to blog post |
| SITE-10 | Lighthouse 90+ on representative pages from each tier | Lighthouse 13.0.3 CLI available; run against `astro preview` server |
| SITE-11 | WCAG 2.1 AA accessibility | SVG role="img" + aria-label pattern already used on landing page cards; keyboard nav patterns documented |
| SITE-12 | Every EDA page cites its NIST source section | TechniquePage.astro and DistributionPage.astro already display NIST section; audit for completeness |
| QUAL-01 | Every formula verified character-by-character against NIST source | Manual audit task with NIST Handbook reference |
| QUAL-02 | Every page contains 200+ words of unique explanatory prose | Word count audit script needed |
| QUAL-03 | All Python code examples are runnable | Audit Python code blocks for import completeness and syntax |
| QUAL-04 | Cross-links between related techniques functional | Run link checker against built site |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | ^5.3.0 | Static site framework | Project framework, all pages use it |
| @astrojs/sitemap | ^3.7.0 | Automatic sitemap generation | Already configured, auto-includes all static pages |
| satori | ^0.19.2 | OG image generation (HTML/CSS to SVG) | Existing OG image pipeline uses it |
| sharp | ^0.34.5 | Image processing (SVG to PNG) | Existing OG image pipeline uses it |
| @astrojs/mdx | ^4.3.13 | MDX blog posts | Blog content format |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lighthouse | 13.0.3 | Performance/accessibility audit CLI | SITE-10 verification |
| tailwindcss | ^3.4.19 | Styling | All new components |

### Alternatives Considered
None. Every library needed is already installed. No new dependencies required.

**Installation:**
```bash
# No new packages needed. All dependencies are already in package.json.
```

## Architecture Patterns

### Existing File Structure (Extend, Don't Create New Patterns)
```
src/
├── components/
│   ├── Header.astro              # SITE-01: Add EDA nav link
│   ├── eda/
│   │   ├── EDAJsonLd.astro       # SITE-03: NEW - JSON-LD component
│   │   ├── TechniquePage.astro   # Already has breadcrumb JSON-LD
│   │   └── DistributionPage.astro
│   └── *JsonLd.astro             # Existing pattern to follow
├── data/blog/
│   └── eda-visual-encyclopedia.mdx  # SITE-08: NEW - companion blog post
├── layouts/
│   └── EDALayout.astro           # SITE-03: Add JSON-LD slot
├── lib/
│   └── og-image.ts               # SITE-07: Add EDA OG image function
├── pages/
│   ├── index.astro               # SITE-02: Add callout card
│   ├── llms.txt.ts               # SITE-06: Add EDA section
│   ├── llms-full.txt.ts          # SITE-06: Add EDA detailed section
│   └── open-graph/
│       └── eda/                   # SITE-07: NEW - OG image endpoints
│           ├── overview.png.ts
│           └── [slug].png.ts
└── ...
```

### Pattern 1: Header Navigation Link (SITE-01)
**What:** Add a new entry to the `navLinks` array in `Header.astro`
**When to use:** Adding a new top-level section to the site
**Example:**
```typescript
// Source: src/components/Header.astro (existing pattern)
const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/blog/', label: 'Blog' },
  { href: '/beauty-index/', label: 'Beauty Index' },
  { href: '/db-compass/', label: 'DB Compass' },
  { href: '/eda/', label: 'EDA' },           // NEW - insert here
  { href: '/tools/', label: 'Tools' },
  { href: '/projects/', label: 'Projects' },
  { href: '/about/', label: 'About' },
  { href: '/contact/', label: 'Contact' },
];
```

### Pattern 2: Homepage Callout Card (SITE-02)
**What:** Add an EDA card to the "Reference Guides" section on the homepage
**When to use:** Promoting a new content pillar on the homepage
**Example:**
```astro
<!-- Source: src/pages/index.astro "Reference Guides" section pattern -->
<a href="/eda/" class="block card-hover rounded-lg border border-[var(--color-border)] no-underline overflow-hidden" data-reveal data-tilt>
  <article>
    <div class="bg-[var(--color-surface-alt)] px-6 pt-6 pb-4 flex justify-center">
      <!-- SVG thumbnail or hero image for EDA -->
    </div>
    <div class="p-6 pt-4">
      <p class="meta-mono text-[var(--color-accent)]">90+ Pages</p>
      <h3 class="text-lg font-heading font-bold text-[var(--color-text-primary)] mt-2">EDA Visual Encyclopedia</h3>
      <p class="text-sm text-[var(--color-text-secondary)] mt-2">
        Interactive visual reference for Exploratory Data Analysis covering graphical techniques, quantitative methods, probability distributions, case studies, and more.
      </p>
      <span class="inline-block mt-4 text-sm font-medium text-[var(--color-accent)]">Explore techniques &rarr;</span>
    </div>
  </article>
</a>
```

### Pattern 3: JSON-LD Structured Data Component (SITE-03)
**What:** Create `EDAJsonLd.astro` following the `BeautyIndexJsonLd.astro` / `CompassJsonLd.astro` pattern
**When to use:** Adding structured data to EDA pages
**Example:**
```astro
---
// Source: Pattern from BeautyIndexJsonLd.astro + Schema.org TechArticle docs
interface Props {
  title: string;
  description: string;
  url: string;
  nistSection: string;
  dateModified?: string;
}

const { title, description, url, nistSection, dateModified = '2026-02-25' } = Astro.props;

const schema = {
  "@context": "https://schema.org",
  "@type": ["TechArticle", "LearningResource"],
  "headline": title,
  "description": description,
  "url": url,
  "datePublished": "2026-02-25",
  "dateModified": dateModified,
  "inLanguage": "en",
  "proficiencyLevel": "Expert",
  "learningResourceType": "Reference",
  "educationalLevel": "Advanced",
  "isBasedOn": {
    "@type": "TechArticle",
    "name": "NIST/SEMATECH e-Handbook of Statistical Methods",
    "url": `https://www.itl.nist.gov/div898/handbook/eda/section3/${nistSection}.htm`
  },
  "author": {
    "@type": "Person",
    "@id": "https://patrykgolabek.dev/#person",
    "name": "Patryk Golabek",
    "url": "https://patrykgolabek.dev/"
  },
  "publisher": {
    "@type": "Person",
    "@id": "https://patrykgolabek.dev/#person"
  },
  "isPartOf": {
    "@type": "WebPage",
    "name": "EDA Visual Encyclopedia",
    "url": "https://patrykgolabek.dev/eda/"
  }
};
---

<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

### Pattern 4: OG Image Endpoint (SITE-07)
**What:** Astro API route that generates PNG via satori + sharp
**When to use:** Build-time OG image generation for social sharing
**Example:**
```typescript
// Source: src/pages/open-graph/beauty-index.png.ts pattern
import type { APIRoute } from 'astro';
import { generateEdaOgImage } from '../../../lib/og-image';

export const GET: APIRoute = async () => {
  const png = await generateEdaOgImage();
  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
```

### Pattern 5: Blog Post (SITE-08)
**What:** MDX file in `src/data/blog/` with standard frontmatter
**When to use:** Publishing a companion blog post
**Example:**
```yaml
---
title: "Exploratory Data Analysis: A Visual Encyclopedia"
description: "A comprehensive interactive reference for EDA based on the NIST/SEMATECH Engineering Statistics Handbook. 90+ pages covering graphical techniques, quantitative methods, probability distributions, and case studies."
publishedDate: 2026-02-25
tags: ["eda", "statistics", "data-analysis", "nist", "data-science"]
coverImage: "/images/eda-blog-cover.svg"
draft: false
---
```

### Pattern 6: LLMs.txt Section (SITE-06)
**What:** Add EDA section to `src/pages/llms.txt.ts` API route
**When to use:** Making EDA content discoverable by LLMs
**Example:**
```typescript
// Add between Interactive Tools and Beauty Index sections in llms.txt.ts
'## EDA Visual Encyclopedia',
'',
'Interactive visual reference for Exploratory Data Analysis based on the NIST/SEMATECH Engineering Statistics Handbook.',
'90+ pages covering graphical techniques, quantitative methods, probability distributions, case studies, and reference material.',
'',
'- [EDA Overview](https://patrykgolabek.dev/eda/): Complete technique index with filterable card grid',
'- [Histogram](https://patrykgolabek.dev/eda/techniques/histogram/): 8 interpretation variants with SVG swap',
// ... key pages
```

### Anti-Patterns to Avoid
- **Creating new layout components:** Use existing `EDALayout.astro` -- do NOT create a new layout just for JSON-LD injection
- **Hardcoding meta descriptions:** All EDA schemas already have `description` fields -- use the data, don't duplicate it
- **Manual sitemap entries:** `@astrojs/sitemap` auto-discovers all static pages -- do NOT add EDA pages manually to sitemap config
- **Inlining JSON-LD in each page route:** Create a reusable `EDAJsonLd.astro` component and include it in template components (TechniquePage, DistributionPage, etc.)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OG images | Custom canvas/puppeteer renderer | `satori` + `sharp` (existing pipeline) | Already proven in project, handles fonts and layouts |
| Sitemap | Manual URL list | `@astrojs/sitemap` (already configured) | Auto-discovers all routes from `getStaticPaths()` |
| JSON-LD validation | Manual schema checking | Google Rich Results Test | Free, authoritative validation tool |
| Accessibility audit | Manual checklist | Lighthouse CLI (`lighthouse --only-categories=accessibility`) | Automated, reproducible, covers WCAG 2.1 |
| Link checking | Custom crawler | `astro build` + grep for 404 in build output, or `lychee` CLI | Build already reports broken links |
| Word counting | Manual page review | Script that counts words in technique-content and quantitative-content modules | Automatable, exact |

**Key insight:** This phase is integration work on a mature codebase. Every pattern already exists and is proven. The risk is deviation from established patterns, not missing capabilities.

## Common Pitfalls

### Pitfall 1: JSON-LD Type Array Syntax
**What goes wrong:** Using multiple `@type` values incorrectly -- schema.org supports arrays but Google may not validate multi-type correctly
**Why it happens:** TechArticle and LearningResource are both valid but from different branches of the schema.org hierarchy
**How to avoid:** Use `"@type": ["TechArticle", "LearningResource"]` -- schema.org supports this. Validate with Google Rich Results Test after build. If Google flags it, fall back to TechArticle only (it inherits from Article which Google fully supports).
**Warning signs:** Rich Results Test shows warnings or errors on type combination

### Pitfall 2: OG Image Build Time Regression
**What goes wrong:** Adding OG images for 90+ EDA pages causes build time to balloon (satori + sharp is ~200ms per image)
**Why it happens:** INFRA-05 implemented content-hash OG caching, but new pages won't have cached versions on first build
**How to avoid:** Generate OG images only for the EDA overview and key section landing pages (6-8 images), not all 90+ individual pages. Individual technique/distribution pages can use the overview OG image as fallback. This matches the requirement ("EDA overview and key section pages").
**Warning signs:** `astro build` taking >5 minutes

### Pitfall 3: Header Navigation Overflow on Mobile
**What goes wrong:** Adding "EDA" to the header makes the desktop nav too wide on medium-width screens
**Why it happens:** The nav already has 8 items (Home, Blog, Beauty Index, DB Compass, Tools, Projects, About, Contact) -- adding a 9th may overflow
**How to avoid:** The mobile menu already handles overflow (hamburger menu below md breakpoint). On desktop, verify the nav doesn't wrap at 768px-1024px viewports. If needed, abbreviate to "EDA" (already short) or adjust gap spacing.
**Warning signs:** Nav items wrapping to second line at tablet widths

### Pitfall 4: Forgetting to Update Both LLMs.txt Files
**What goes wrong:** Updating `llms.txt.ts` but forgetting `llms-full.txt.ts`
**Why it happens:** Two separate files serve different purposes (summary vs full content)
**How to avoid:** Update both `src/pages/llms.txt.ts` and `src/pages/llms-full.txt.ts` in the same task
**Warning signs:** `llms.txt` mentions EDA but `llms-full.txt` doesn't (or vice versa)

### Pitfall 5: SEO Meta Description Length
**What goes wrong:** Meta descriptions that are too long (>160 chars) get truncated by Google, or too short (<50 chars) don't provide value
**Why it happens:** EDA technique descriptions in the data schema may be too long for meta descriptions
**How to avoid:** Audit all `description` fields in techniques.json, distributions.json, and edaPages MDX frontmatter. Truncate to 155 characters max. Ensure each is unique (Google penalizes duplicate meta descriptions).
**Warning signs:** `description` fields longer than 160 characters

### Pitfall 6: Missing `role="img"` on Dynamically Inserted SVGs
**What goes wrong:** SVGs rendered via `set:html` don't get accessibility attributes
**Why it happens:** `set:html` bypasses Astro's component system, so attributes must be on the container div
**How to avoid:** Wrap all `set:html` SVG injections in a `<div role="img" aria-label="description">`. The landing page already does this correctly -- replicate the pattern everywhere.
**Warning signs:** Lighthouse accessibility audit flags missing alt text on images

### Pitfall 7: Lighthouse Score Flaky Due to Dev Server
**What goes wrong:** Running Lighthouse against `astro dev` gives inconsistent scores
**Why it happens:** Dev server adds hot-reload scripts, unminified code, and source maps
**How to avoid:** Always run Lighthouse against `astro preview` (serves the production build). Build first: `astro build && astro preview`.
**Warning signs:** Performance scores varying 20+ points between runs

## Code Examples

### EDA JSON-LD for Landing Page (Dataset + ItemList pattern)
```astro
---
// Source: Pattern from BeautyIndexJsonLd.astro adapted for EDA
interface Props {
  techniques: Array<{ title: string; slug: string; category: string }>;
  distributions: Array<{ title: string; slug: string }>;
}

const { techniques, distributions } = Astro.props;

const schema = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  "name": "EDA Visual Encyclopedia",
  "alternateName": "Exploratory Data Analysis Visual Encyclopedia 2026",
  "description": "Interactive visual encyclopedia of Exploratory Data Analysis covering 90+ techniques, distributions, case studies, and reference material based on the NIST/SEMATECH Engineering Statistics Handbook.",
  "url": "https://patrykgolabek.dev/eda/",
  "datePublished": "2026-02-25",
  "dateModified": "2026-02-25",
  "license": "https://creativecommons.org/licenses/by/4.0/",
  "creator": {
    "@type": "Person",
    "@id": "https://patrykgolabek.dev/#person",
    "name": "Patryk Golabek",
    "url": "https://patrykgolabek.dev/",
  },
  "isBasedOn": {
    "@type": "TechArticle",
    "name": "NIST/SEMATECH e-Handbook of Statistical Methods",
    "url": "https://www.itl.nist.gov/div898/handbook/eda/eda.htm",
  },
  "keywords": [
    "exploratory data analysis",
    "EDA",
    "statistical techniques",
    "NIST handbook",
    "probability distributions",
    "data visualization",
  ],
};
---

<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

### Lighthouse CLI Verification Command
```bash
# Build the site first
npx astro build && npx astro preview &
sleep 3

# Tier A: Static SVG page
lighthouse http://localhost:4321/eda/techniques/box-plot/ \
  --output=json --output-path=./lighthouse-tier-a.json \
  --chrome-flags="--headless" --only-categories=performance,accessibility

# Tier B: SVG swap page
lighthouse http://localhost:4321/eda/techniques/histogram/ \
  --output=json --output-path=./lighthouse-tier-b.json \
  --chrome-flags="--headless" --only-categories=performance,accessibility

# Tier C: D3 explorer page
lighthouse http://localhost:4321/eda/distributions/normal/ \
  --output=json --output-path=./lighthouse-tier-c.json \
  --chrome-flags="--headless" --only-categories=performance,accessibility
```

### Word Count Audit Script
```bash
# Count words in technique prose (technique-content.ts)
# Each technique should have 200+ words across definition, purpose, interpretation, assumptions
node -e "
const tc = require('./src/lib/eda/technique-content.ts');
// Check each technique's total word count
"
```

### SVG Accessibility Pattern
```html
<!-- Correct: container div has role="img" + aria-label -->
<div role="img" aria-label="Histogram showing normal distribution with 8 bins"
     class="w-full overflow-hidden mb-3"
     set:html={svgMarkup} />

<!-- Wrong: role/aria on the SVG itself won't work with set:html -->
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Meta keywords tag | Ignored by Google since 2009 | N/A | Do NOT add meta keywords |
| Manual sitemap.xml | @astrojs/sitemap auto-generation | Astro 3+ | No manual sitemap entries needed |
| Puppeteer OG images | satori + sharp (no browser) | 2023+ | Faster, no browser dependency |
| Single `@type` in JSON-LD | Array `@type` supported | schema.org 14+ | Can combine TechArticle + LearningResource |
| Lighthouse v10 | Lighthouse v13 | 2025 | Updated scoring, better accessibility checks |

**Deprecated/outdated:**
- **Meta keywords:** Google ignores them completely -- do not add
- **`lastmod` in sitemap for static content:** Google has stated `lastmod` is only useful if accurate; for a static site with no frequent updates, omitting is fine

## Open Questions

1. **EDA OG Image Design**
   - What we know: The project uses satori+sharp for all OG images. Existing overview images use a two-column layout with cover image + title + pills.
   - What's unclear: What visual element should represent EDA in the OG image (scatter plot SVG? histogram? abstract chart graphic?)
   - Recommendation: Generate a composite SVG showing 4 small statistical plots (histogram, scatter, box plot, distribution curve) as the visual element, matching the "4-plot" concept from the EDA methodology. Use the Quantum Explorer palette.

2. **Blog Post Length and Depth**
   - What we know: Existing companion blog posts (database-compass, the-beauty-index) are 2000-4000 words covering methodology and walkthrough.
   - What's unclear: Exact word count target for the EDA blog post.
   - Recommendation: Target 2000-3000 words. Cover: what EDA is, the NIST source material, how the encyclopedia is structured, key techniques with inline links, and the interactive features (D3 explorers, SVG swap). Include at least 10 cross-links to EDA pages.

3. **QUAL-01 Formula Verification Scope**
   - What we know: 18 quantitative technique pages have KaTeX formulas, 19 distribution pages have PDF/CDF formulas.
   - What's unclear: Whether "every formula" means sampling or exhaustive check of all ~80+ formulas.
   - Recommendation: Verify all formulas character-by-character against the NIST source. For efficiency, generate a checklist of all formula references (technique slug + formula label) and verify systematically. Flag any discrepancies.

4. **Homepage Layout After Adding EDA Card**
   - What we know: The "Reference Guides" section currently has 2 cards (Beauty Index, DB Compass) in a 2-column grid. Adding a 3rd card will break the symmetry.
   - What's unclear: Whether to use a 3-column grid, keep 2-column with EDA in a new row, or reorganize.
   - Recommendation: Change to a 3-column grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) matching the Tools section layout. This keeps visual consistency.

## Sources

### Primary (HIGH confidence)
- Schema.org TechArticle: https://schema.org/TechArticle - Type hierarchy, properties (dependencies, proficiencyLevel)
- Schema.org LearningResource: https://schema.org/LearningResource - Properties (learningResourceType, educationalLevel, teaches)
- Astro Sitemap Docs: https://docs.astro.build/en/guides/integrations-guide/sitemap/ - Auto-inclusion of static pages, filter/custom config
- Project source code: Direct reading of Header.astro, Layout.astro, SEOHead.astro, og-image.ts, llms.txt.ts, all JsonLd components, blog route, EDA page routes

### Secondary (MEDIUM confidence)
- Lighthouse CLI 13.0.3 locally installed and verified
- Google Rich Results Test for JSON-LD validation (community standard)

### Tertiary (LOW confidence)
- None -- all findings verified against project source code or official schema.org docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and patterns established in prior phases
- Architecture: HIGH - Every pattern has 2+ existing implementations in the codebase to follow
- Pitfalls: HIGH - Based on direct source code analysis and established web standards
- SEO/structured data: HIGH - Verified against schema.org official type definitions

**Research date:** 2026-02-25
**Valid until:** 2026-03-25 (stable -- no fast-moving dependencies)
