# Phase 101: Site Integration - Research

**Researched:** 2026-03-15
**Domain:** Astro static site integration (landing pages, blog content, LLMs.txt, sitemap, OG images)
**Confidence:** HIGH

## Summary

Phase 101 is a pure site-integration phase: no new libraries, no new infrastructure, no external APIs. All five requirements (SITE-01 through SITE-05) are achieved by creating new Astro pages, a blog post MDX file, and small edits to existing TypeScript files -- all following patterns already established in the codebase across 100+ prior phases.

The notebooks landing page at `/eda/notebooks/` follows the exact pattern of `/eda/case-studies/index.astro` (card grid, EDALayout, BreadcrumbJsonLd, EDAJsonLd). The blog post follows the existing MDX blog convention under `src/data/blog/`. The LLMs.txt update is a code edit to `src/pages/llms.txt.ts` adding a notebooks subsection within the EDA Visual Encyclopedia section. The sitemap inclusion is automatic via `@astrojs/sitemap` (no configuration needed for new .astro pages). The OG image follows the `generateEdaSectionOgImage()` pattern from `src/lib/og-image.ts`.

The key data source for notebook listings is the existing `CASE_STUDY_REGISTRY` in `src/lib/eda/notebooks/registry/index.ts`, which has all 10 case study configs with titles, descriptions, and slugs. The existing `getDownloadUrl()` and `getColabUrl()` helpers from `notebook-urls.ts` provide download and Colab links.

**Primary recommendation:** Follow existing patterns exactly. No new dependencies needed. Each requirement maps to 1-2 files touching well-established codepaths.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SITE-01 | Notebooks landing page at /eda/notebooks/ listing all 10 notebooks with descriptions and download links | New `src/pages/eda/notebooks/index.astro` using EDALayout + card grid pattern from case-studies/index.astro. Data from CASE_STUDY_REGISTRY + notebook-urls.ts helpers. |
| SITE-02 | Companion blog post about EDA learning with Jupyter notebooks | New `src/data/blog/eda-jupyter-notebooks.mdx` following blog schema (title, description, publishedDate, tags). Pattern from existing eda-visual-encyclopedia.mdx. |
| SITE-03 | LLMs.txt updated with notebooks section | Edit `src/pages/llms.txt.ts` to add a `### Jupyter Notebooks (10 notebooks)` subsection within the EDA Visual Encyclopedia section, listing all 10 notebooks with download URLs. |
| SITE-04 | Sitemap includes notebooks landing page | Automatic -- `@astrojs/sitemap` discovers all generated pages including new `/eda/notebooks/`. Verify via `astro build` + check `dist/sitemap-0.xml`. |
| SITE-05 | OG image for notebooks landing page | New `src/pages/open-graph/eda/notebooks.png.ts` using `generateEdaSectionOgImage()` from og-image.ts with og-cache wrapper. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | ^5.3.0 | Static site generator, page routing, content collections | Already installed, powers entire site |
| Satori | ^0.19.2 | OG image generation from JSX-like tree to SVG | Already installed, used by all OG endpoints |
| Sharp | ^0.34.5 | SVG-to-PNG conversion for OG images | Already installed, used by all OG endpoints |
| @astrojs/sitemap | ^3.7.0 | Automatic sitemap generation from all static pages | Already installed, configured in astro.config.mjs |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | ^4.0.18 | Test runner for unit tests | Test notebook-urls, registry data, LLMs.txt section |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| N/A | N/A | All libraries already in place -- no alternatives needed |

**Installation:**
```bash
# No new installations required. All dependencies already present.
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  pages/
    eda/
      notebooks/
        index.astro              # SITE-01: Notebooks landing page
    open-graph/
      eda/
        notebooks.png.ts         # SITE-05: OG image endpoint
    llms.txt.ts                  # SITE-03: Edit existing file
  data/
    blog/
      eda-jupyter-notebooks.mdx  # SITE-02: New blog post
```

### Pattern 1: EDA Section Landing Page
**What:** An Astro page using EDALayout that renders a card grid from data
**When to use:** Every EDA subsection landing (techniques, distributions, case-studies, and now notebooks)
**Example:**
```typescript
// Source: src/pages/eda/case-studies/index.astro (existing pattern)
---
import EDALayout from '../../../layouts/EDALayout.astro';
import EdaBreadcrumb from '../../../components/eda/EdaBreadcrumb.astro';
import BreadcrumbJsonLd from '../../../components/BreadcrumbJsonLd.astro';
import EDAJsonLd from '../../../components/eda/EDAJsonLd.astro';

// Data source: notebook registry instead of content collection
import { CASE_STUDY_REGISTRY } from '../../../lib/eda/notebooks/registry/index';
import { getDownloadUrl, getColabUrl } from '../../../lib/eda/notebooks/notebook-urls';
import { caseStudyUrl } from '../../../lib/eda/routes';

const notebooks = Object.values(CASE_STUDY_REGISTRY).map((config) => ({
  slug: config.slug,
  title: config.title,
  description: config.description ?? '',
  nistSection: config.nistSection,
  downloadUrl: getDownloadUrl(config.slug),
  colabUrl: getColabUrl(config.slug),
  caseStudyUrl: caseStudyUrl(config.slug),
}));
---

<EDALayout
  title="Jupyter Notebooks | EDA Visual Encyclopedia"
  description="Download 10 Jupyter notebooks for hands-on EDA with real NIST datasets..."
  ogImage="/open-graph/eda/notebooks.png"
>
  <!-- BreadcrumbJsonLd, EDAJsonLd, header, card grid -->
</EDALayout>
```

### Pattern 2: OG Image Endpoint (Section)
**What:** Astro API route returning a PNG via Satori + Sharp with caching
**When to use:** Dedicated OG images for landing pages
**Example:**
```typescript
// Source: src/pages/open-graph/eda/case-studies.png.ts (existing pattern)
import type { APIRoute } from 'astro';
import { generateEdaSectionOgImage } from '../../../lib/og-image';
import { getOrGenerateOgImage } from '../../../lib/eda/og-cache';

export const GET: APIRoute = async () => {
  const png = await getOrGenerateOgImage(
    'Jupyter Notebooks',
    'Hands-on EDA with 10 NIST datasets in Python',
    () => generateEdaSectionOgImage(
      'Jupyter Notebooks',
      'Hands-on EDA with 10 NIST datasets in Python',
      '10 Notebooks',
    ),
  );

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
```

### Pattern 3: Blog Post MDX File
**What:** MDX file in `src/data/blog/` with frontmatter schema
**When to use:** Native blog posts (not external links)
**Example frontmatter:**
```yaml
---
title: "Learning EDA with Jupyter Notebooks"
description: "10 hands-on Jupyter notebooks for Exploratory Data Analysis using real NIST datasets. Download notebooks with data, or run them instantly in Google Colab."
publishedDate: 2026-03-15
tags: ["eda", "jupyter", "python", "data-science", "statistics", "notebooks"]
draft: false
---
```
**Required schema fields (from content.config.ts blog schema):**
- `title: string` (required)
- `description: string` (required)
- `publishedDate: date` (required)
- `tags: string[]` (defaults to [])
- `draft: boolean` (defaults to false)
- `coverImage: string` (optional)
- `externalUrl: string` (optional -- omit for native posts)
- `source: 'Kubert AI' | 'Translucent Computing'` (optional -- omit for native)

### Pattern 4: LLMs.txt Section Addition
**What:** Add a new subsection to the dynamically generated llms.txt
**When to use:** When adding a new content section to the site
**Example:**
```typescript
// Source: src/pages/llms.txt.ts lines 150-204 (EDA section pattern)
// Insert after the existing '### Case Studies (9 pages)' subsection:
'### Jupyter Notebooks (10 notebooks)',
'',
'Download Jupyter notebooks with bundled NIST datasets for hands-on EDA practice.',
'',
'- [Notebooks Landing Page](https://patrykgolabek.dev/eda/notebooks/): All 10 notebooks with descriptions and download links',
'',
...ALL_CASE_STUDY_SLUGS.map(slug => {
  const config = CASE_STUDY_REGISTRY[slug];
  return `- ${config.title}: https://patrykgolabek.dev/downloads/notebooks/${slug}.zip (Colab: ${getColabUrl(slug)})`;
}),
```

### Pattern 5: EDA Index Page Cross-Link
**What:** Adding a notebooks link/section to the EDA landing page
**When to use:** When the notebooks section needs discoverability from `/eda/`
**Implementation:** Add a notebooks callout section to `src/pages/eda/index.astro`, similar to the existing "About This Encyclopedia" section at the bottom of the page (lines 242-257). This section links to the notebooks landing page and mentions the Colab option. Also consider adding 'Notebooks' to the NAV_ITEMS array and SECTIONS array if a full section with notebook cards is desired on the main EDA page.

### Anti-Patterns to Avoid
- **Don't create a content collection for notebooks:** The notebook data already lives in `CASE_STUDY_REGISTRY`. Creating a separate Astro content collection would duplicate data. Read from the registry directly.
- **Don't hardcode notebook count:** Use `ALL_CASE_STUDY_SLUGS.length` or `Object.keys(CASE_STUDY_REGISTRY).length` instead of hardcoding "10".
- **Don't put download/Colab URL logic in the page:** Use the existing `getDownloadUrl()` and `getColabUrl()` from `notebook-urls.ts`.
- **Don't create a new OG image generator function:** Use the existing `generateEdaSectionOgImage(title, description, count)` from og-image.ts -- it already handles the two-column layout with decorative bars.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Notebook card data | Manual JSON or MDX content | `CASE_STUDY_REGISTRY` from registry/index.ts | Data already exists with all 10 configs (title, description, slug, nistSection) |
| Download URLs | Hardcoded paths | `getDownloadUrl(slug)` from notebook-urls.ts | Centralizes path logic, already tested |
| Colab URLs | Hardcoded GitHub URLs | `getColabUrl(slug)` from notebook-urls.ts | Centralizes GitHub URL construction, already tested |
| Case study page URLs | String concatenation | `caseStudyUrl(slug)` from routes.ts | Uses EDA_ROUTES constants, consistent with entire site |
| OG image generation | Custom Satori layout | `generateEdaSectionOgImage()` from og-image.ts | Reuses battle-tested section OG template with branding |
| OG image caching | Direct file I/O | `getOrGenerateOgImage()` from og-cache.ts | Handles cache dir creation, hash computation, read/write |
| Sitemap inclusion | Manual XML generation | `@astrojs/sitemap` integration | Auto-discovers all static pages, no config needed for new pages |

**Key insight:** This phase is 100% integration work. Every component already exists. The task is wiring existing pieces together in new pages.

## Common Pitfalls

### Pitfall 1: Missing Descriptions in Notebook Registry
**What goes wrong:** The `description` field in `CaseStudyConfig` is optional. Some registry configs might have empty or undefined descriptions, causing blank text on the landing page.
**Why it happens:** The `description` field was added as optional (`description?: string`) in types.ts.
**How to avoid:** Verified -- all 10 registry configs DO have descriptions set (confirmed via grep). Use fallback `config.description ?? ''` defensively.
**Warning signs:** Blank description text in card grid on the landing page.

### Pitfall 2: Blog Post Slug Collision
**What goes wrong:** If the blog post MDX filename matches an existing post ID, it would overwrite or conflict.
**Why it happens:** Blog posts derive their ID from filename.
**How to avoid:** Use a unique filename like `eda-jupyter-notebooks.mdx`. The existing `eda-visual-encyclopedia.mdx` is the encyclopedia companion -- the notebook post should be distinct.
**Warning signs:** 404 on blog pages or wrong content rendering.

### Pitfall 3: OG Image Path Mismatch
**What goes wrong:** The notebooks page references `/open-graph/eda/notebooks.png` but the endpoint file is named differently.
**Why it happens:** Astro file-based routing maps `notebooks.png.ts` to `/open-graph/eda/notebooks.png`.
**How to avoid:** Name the file exactly `notebooks.png.ts` in `src/pages/open-graph/eda/`. The ogImage prop in EDALayout must be `/open-graph/eda/notebooks.png`.
**Warning signs:** Missing OG image in social media previews, 404 on the PNG endpoint.

### Pitfall 4: LLMs.txt Line Ordering
**What goes wrong:** The notebooks section is inserted in the wrong position, breaking the EDA Visual Encyclopedia grouping.
**Why it happens:** The llms.txt.ts file is a long array of string lines. Insertion point must be after the existing Case Studies subsection and before the next top-level section.
**How to avoid:** Insert the notebooks subsection right after the Reference subsection (the last EDA subsection, around line 204) and before the FastAPI Production Guide section.
**Warning signs:** Notebooks listed outside the EDA section in the generated llms.txt.

### Pitfall 5: EDA Index SECTIONS Array Not Updated
**What goes wrong:** If adding notebooks to the EDA landing page card grid, missing the SECTIONS array entry means no section rendered.
**Why it happens:** The EDA index uses a `SECTIONS` constant to define which category sections render.
**How to avoid:** If adding notebooks as a full section to the EDA index, add to both `SECTIONS` and `NAV_ITEMS`. However, notebooks are NOT a content collection category, so they cannot be rendered via the standard `getCards()` flow. Better approach: add a dedicated callout section (like the existing "About This Encyclopedia" section) that links to `/eda/notebooks/`.
**Warning signs:** No notebooks section visible on /eda/ despite expecting one.

### Pitfall 6: Sitemap Priority Not Set for Notebooks
**What goes wrong:** The notebooks page gets default priority 0.5 instead of something intentional.
**Why it happens:** The sitemap `serialize` function in astro.config.mjs checks URL patterns. `/eda/` pages already get priority 0.5 and changefreq 'monthly', which is appropriate.
**How to avoid:** Verify that `/eda/notebooks/` matches the existing `/eda/` URL check in the sitemap config (it will, since it checks `item.url.includes('/eda/')`).
**Warning signs:** None -- default behavior is correct.

## Code Examples

Verified patterns from the existing codebase:

### Notebook Card Grid with Download + Colab Buttons
```typescript
// Based on: NotebookActions.astro + case-studies/index.astro card pattern
{notebooks.map((nb) => (
  <div class="rounded-lg border border-[var(--color-border)] p-5">
    <h3 class="text-base font-heading font-bold">{nb.title}</h3>
    <p class="text-xs text-[var(--color-text-secondary)] mt-1">
      Section {nb.nistSection}
    </p>
    <p class="text-sm text-[var(--color-text-secondary)] mt-2 line-clamp-3">
      {nb.description}
    </p>
    <div class="flex flex-wrap items-center gap-3 mt-4">
      <a href={nb.downloadUrl} download
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded
               bg-[var(--color-accent)] !text-white hover:opacity-90 transition-opacity !no-underline">
        Download
      </a>
      <a href={nb.colabUrl} target="_blank" rel="noopener noreferrer"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded
               border border-[var(--color-border)] !text-[var(--color-text-secondary)]
               hover:!text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors !no-underline">
        Open in Colab
      </a>
      <a href={nb.caseStudyUrl}
        class="text-sm text-[var(--color-accent)] hover:underline">
        View case study
      </a>
    </div>
  </div>
))}
```

### LLMs.txt Notebook Section (insert after Reference subsection)
```typescript
// Source: Pattern from src/pages/llms.txt.ts
// Import at top of file:
import { CASE_STUDY_REGISTRY, ALL_CASE_STUDY_SLUGS } from '../lib/eda/notebooks/registry/index';
import { getDownloadUrl, getColabUrl } from '../lib/eda/notebooks/notebook-urls';

// Insert into the lines array after '### Reference (4 pages)' entries:
'',
'### Jupyter Notebooks (10 notebooks)',
'',
'Download Jupyter notebooks with bundled NIST datasets for hands-on Exploratory Data Analysis in Python. Each notebook includes data loading, 4-plot diagnostics, hypothesis tests, and interpretation.',
'',
'- [Notebooks Landing Page](https://patrykgolabek.dev/eda/notebooks/): All 10 notebooks with descriptions, download links, and Colab badges',
'',
...ALL_CASE_STUDY_SLUGS.map(slug => {
  const config = CASE_STUDY_REGISTRY[slug];
  return `- ${config.title} Notebook: Download ${SITE}/downloads/notebooks/${slug}.zip | Colab: ${getColabUrl(slug)}`;
}),
```

### Blog Post Content Structure
```markdown
---
title: "Learning EDA with Jupyter Notebooks"
description: "10 hands-on Jupyter notebooks for Exploratory Data Analysis..."
publishedDate: 2026-03-15
tags: ["eda", "jupyter", "python", "data-science", "statistics", "notebooks"]
draft: false
---

[Intro paragraph about learning EDA hands-on]

## What Is Inside Each Notebook

[Description of the standard notebook structure: imports, data loading, 4-plot, hypothesis tests]

## The 10 Case Study Notebooks

### Standard Case Studies (7 notebooks)
[Brief description of each with link to case study page and download]

### Advanced Case Studies (3 notebooks)
[Brief description of beam deflections, random walk, ceramic strength]

## How to Use the Notebooks

### Running Locally
[pip install instructions, Jupyter launch]

### Running in Google Colab
[Zero-install option, Colab badges]

## What You Will Learn

[Learning outcomes: assumption verification, 4-plot interpretation, etc.]

## Further Reading
[Links to EDA Visual Encyclopedia, foundations, techniques]
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual sitemap.xml | @astrojs/sitemap auto-generation | Astro 3+ | No manual XML needed for new pages |
| External OG image services | Satori + Sharp build-time generation | Project inception | Zero external dependencies for OG images |
| Separate blog CMS | Astro content collections from MDX files | Project inception | Blog posts are just MDX files with frontmatter |

**Deprecated/outdated:**
- Nothing relevant to this phase. All patterns are current.

## Open Questions

1. **Blog post depth and length**
   - What we know: The blog post should cover what the notebooks contain, how to use them, and why hands-on EDA matters
   - What is unclear: Exact length and depth. The existing EDA Visual Encyclopedia blog post is quite long and thorough.
   - Recommendation: Write a focused 800-1200 word post. This is a companion piece, not the main EDA reference. Link heavily to the encyclopedia and notebooks landing page. Include the SEO keywords from CLAUDE.md (data science, Jupyter, Python, EDA).

2. **EDA index page integration style**
   - What we know: The success criteria says "The EDA index page links to the notebooks section"
   - What is unclear: Should it be a new card grid section, a nav item, or a callout like the existing "About This Encyclopedia" block?
   - Recommendation: Add a callout section similar to the "About This Encyclopedia" block (lines 242-257 of eda/index.astro) that links to `/eda/notebooks/`. Also add "Notebooks" to the NAV_ITEMS quick links for in-page navigation if a section anchor is added. Do NOT try to add notebooks to the SECTIONS card grid -- notebooks are not a content collection category and would require a different data flow.

3. **Route addition to EDA_ROUTES**
   - What we know: All EDA URL patterns are centralized in `src/lib/eda/routes.ts`
   - What is unclear: Whether to add a `notebooks` entry to EDA_ROUTES
   - Recommendation: Add `notebooks: '/eda/notebooks/'` to EDA_ROUTES for consistency, even though the notebooks landing page is the only consumer initially. This keeps the single-source-of-truth pattern intact.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.0.18 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SITE-01 | Landing page renders all 10 notebooks with correct URLs | smoke (build check) | `npx astro build && test -f dist/eda/notebooks/index.html` | No -- Wave 0 |
| SITE-02 | Blog post renders without errors | smoke (build check) | `npx astro build && test -f dist/blog/eda-jupyter-notebooks/index.html` | No -- Wave 0 |
| SITE-03 | LLMs.txt includes notebooks section | unit | `npx vitest run src/lib/eda/notebooks/__tests__/llms-notebooks.test.ts` | No -- Wave 0 |
| SITE-04 | Sitemap includes /eda/notebooks/ | smoke (build check) | `npx astro build && grep 'eda/notebooks' dist/sitemap-0.xml` | No -- Wave 0 |
| SITE-05 | OG image endpoint returns PNG | unit | `npx vitest run src/pages/open-graph/eda/__tests__/notebooks-og.test.ts` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose && npx astro build`
- **Phase gate:** Full suite green + `astro build` successful + manual spot-check of landing page

### Wave 0 Gaps
- [ ] Verify all 10 registry configs have non-empty `description` field (defensive test)
- [ ] Test that LLMs.txt contains "Jupyter Notebooks" section after edit
- [ ] Build smoke test: `astro build` completes without errors (validates all new pages)

## Sources

### Primary (HIGH confidence)
- `src/pages/eda/case-studies/index.astro` -- Landing page card grid pattern
- `src/pages/open-graph/eda/case-studies.png.ts` -- OG image endpoint pattern
- `src/pages/llms.txt.ts` -- LLMs.txt generation with EDA section
- `src/lib/eda/notebooks/registry/index.ts` -- Notebook data source (all 10 configs)
- `src/lib/eda/notebooks/notebook-urls.ts` -- Download and Colab URL helpers
- `src/lib/og-image.ts` -- `generateEdaSectionOgImage()` function
- `src/lib/eda/og-cache.ts` -- OG image caching utility
- `src/content.config.ts` -- Blog schema definition
- `astro.config.mjs` -- Sitemap integration config
- `src/pages/eda/index.astro` -- EDA landing page structure

### Secondary (MEDIUM confidence)
- @astrojs/sitemap documentation: new `.astro` pages are auto-discovered for sitemap inclusion

### Tertiary (LOW confidence)
- None -- all findings are from direct codebase inspection

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and in use
- Architecture: HIGH -- every pattern has 1+ existing example in the codebase
- Pitfalls: HIGH -- identified from direct codebase inspection, verified data availability

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable patterns, no external dependencies)
