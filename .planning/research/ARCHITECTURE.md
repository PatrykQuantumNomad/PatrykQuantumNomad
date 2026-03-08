# Architecture Research: FastAPI Production Guide Integration

**Domain:** Multi-page production guide section within an existing Astro 5 portfolio site
**Researched:** 2026-03-08
**Confidence:** HIGH

## System Overview

```
PatrykQuantumNomad Portfolio Site (Astro 5, static output)
┌──────────────────────────────────────────────────────────────────────────┐
│                         Content Layer                                    │
│                                                                          │
│  src/data/guides/fastapi-production/                                     │
│  ├── guide.json            <- guide metadata (title, description, etc.)  │
│  └── pages/                <- MDX content per chapter                    │
│      ├── project-structure.mdx                                           │
│      ├── docker.mdx                                                      │
│      ├── kubernetes.mdx                                                  │
│      ├── testing.mdx                                                     │
│      └── ...               <- ~10 chapters total                         │
│                                                                          │
│  src/content.config.ts     <- add guidePages + guides collections        │
├──────────────────────────────────────────────────────────────────────────┤
│                        Page Generation Layer                             │
│                                                                          │
│  src/pages/guides/fastapi-production/                                    │
│  ├── index.astro           <- guide landing page (chapter list + hero)   │
│  └── [slug].astro          <- chapter pages via getStaticPaths           │
│                                                                          │
│  src/pages/open-graph/guides/fastapi-production/                         │
│  ├── index.png.ts          <- OG image for landing page                  │
│  └── [slug].png.ts         <- OG images for each chapter                 │
├──────────────────────────────────────────────────────────────────────────┤
│                        Component Layer                                   │
│                                                                          │
│  src/layouts/GuideLayout.astro    <- extends EDALayout pattern           │
│  src/components/guides/                                                  │
│  ├── GuideBreadcrumb.astro        <- breadcrumb nav                      │
│  ├── GuideNav.astro               <- sidebar TOC + prev/next             │
│  ├── GuidePrevNext.astro          <- bottom prev/next links              │
│  ├── GuideJsonLd.astro            <- structured data                     │
│  ├── CodeFromRepo.astro           <- code snippets from template repo    │
│  ├── ArchitectureDiagram.astro    <- build-time SVG diagrams             │
│  └── FileTree.astro               <- file tree visualization             │
│                                                                          │
│  src/lib/guides/                                                         │
│  ├── schema.ts                    <- Zod schemas                         │
│  ├── routes.ts                    <- URL builders                        │
│  └── svg-generators/              <- architecture diagram SVGs           │
├──────────────────────────────────────────────────────────────────────────┤
│                        Existing Infrastructure (unchanged)               │
│                                                                          │
│  src/layouts/Layout.astro         <- base layout (SEO, animations)       │
│  src/components/Header.astro      <- add "Guides" nav link               │
│  src/data/site.ts                 <- unchanged                           │
│  astro.config.mjs                 <- unchanged (MDX + React already on)  │
└──────────────────────────────────────────────────────────────────────────┘
```

## The Core Architectural Decision: MDX Pages + JSON Metadata

### Recommendation: Hybrid approach -- MDX content collection for chapter pages, JSON data file for guide-level metadata

**Why this pattern (not alternatives):**

The existing site already uses this exact hybrid pattern for the EDA section: `edaPages` is a glob-loaded MDX collection for long-form content, while `edaTechniques` and `edaDistributions` are file-loaded JSON collections for structured data. The guide section should follow this proven pattern rather than inventing a new one.

**Alternative considered and rejected -- Pure JSON with inline content:** Storing chapter content as strings in JSON would lose MDX's component imports, code highlighting, and heading extraction. The EDA pages demonstrate that MDX is the right choice for narrative content that needs embedded components.

**Alternative considered and rejected -- Pure MDX with all metadata in frontmatter:** Frontmatter can hold chapter metadata, but guide-level metadata (overall description, chapter ordering, template repo URL) would need to be duplicated across every MDX file or hardcoded in the page template. A separate JSON file provides a single source of truth for guide structure, exactly as `edaTechniques` provides technique metadata separate from the MDX technique pages.

**Alternative considered and rejected -- Starlight docs theme:** Starlight is Astro's documentation framework, but it is a full-site theme, not a section addon. It would conflict with the existing Layout.astro, Header, Footer, animations, and styling. The portfolio site has its own established design language; the guide section should use it.

**Confidence:** HIGH -- directly validated by examining `content.config.ts`, `edaPages` collection, and `edaTechniques` collection in the existing codebase.

## Component Responsibilities

| Component | Responsibility | New/Modified | Closest Existing Analog |
|-----------|---------------|-------------|------------------------|
| `src/content.config.ts` | Register `guidePages` MDX collection + `guides` JSON collection | **MODIFIED** | Already registers `edaPages` + `edaTechniques` |
| `src/data/guides/fastapi-production/pages/*.mdx` | Chapter content (narrative, code, diagrams) | **NEW** | `src/data/eda/pages/foundations/*.mdx` |
| `src/data/guides/fastapi-production/guide.json` | Guide metadata: title, slug, chapters array with ordering | **NEW** | `src/data/eda/techniques.json` |
| `src/layouts/GuideLayout.astro` | Extends Layout with guide-specific head slots (syntax highlighting already handled by expressive-code) | **NEW** | `src/layouts/EDALayout.astro` |
| `src/pages/guides/fastapi-production/index.astro` | Landing page with chapter card grid | **NEW** | `src/pages/eda/foundations/index.astro` |
| `src/pages/guides/fastapi-production/[slug].astro` | Chapter detail page with sidebar + prev/next | **NEW** | `src/pages/eda/foundations/[...slug].astro` |
| `src/components/guides/GuideBreadcrumb.astro` | Breadcrumb: Home > Guides > FastAPI Production > Chapter | **NEW** | `src/components/eda/EdaBreadcrumb.astro` |
| `src/components/guides/GuideNav.astro` | Sidebar chapter list + on-page TOC | **NEW** | No direct analog (new pattern) |
| `src/components/guides/GuidePrevNext.astro` | Bottom prev/next navigation between chapters | **NEW** | No direct analog (blog has related posts, not sequential) |
| `src/components/guides/GuideJsonLd.astro` | Schema.org TechArticle + HowTo structured data | **NEW** | `src/components/eda/EDAJsonLd.astro` |
| `src/components/guides/CodeFromRepo.astro` | Renders code snippets with link to source in template repo | **NEW** | Blog's inline code blocks (extended) |
| `src/components/guides/ArchitectureDiagram.astro` | Build-time SVG architecture diagrams | **NEW** | `src/components/eda/PlotFigure.astro` + SVG generators |
| `src/components/guides/FileTree.astro` | Project structure tree visualization | **NEW** | No direct analog |
| `src/lib/guides/schema.ts` | Zod schemas for guide + chapter collections | **NEW** | `src/lib/eda/schema.ts` |
| `src/lib/guides/routes.ts` | URL builder functions for guide pages | **NEW** | `src/lib/eda/routes.ts` |
| `src/lib/guides/svg-generators/*.ts` | Build-time SVG for architecture diagrams | **NEW** | `src/lib/eda/svg-generators/*.ts` |
| `src/pages/open-graph/guides/fastapi-production/[slug].png.ts` | Per-chapter OG images | **NEW** | `src/pages/open-graph/eda/[...slug].png.ts` |
| `src/components/Header.astro` | Add "Guides" to navLinks array | **MODIFIED** | Already has 9 nav links |
| `src/data/projects.ts` | Link to guide from projects listing | **MODIFIED** | Already lists other projects |

## Recommended Project Structure

```
src/
├── content.config.ts                              # ADD guidePages + guides collections
├── data/
│   └── guides/
│       └── fastapi-production/
│           ├── guide.json                          # Guide metadata + chapter ordering
│           └── pages/
│               ├── 01-project-structure.mdx        # Chapter 1
│               ├── 02-configuration.mdx            # Chapter 2
│               ├── 03-dependency-injection.mdx     # Chapter 3
│               ├── 04-database.mdx                 # Chapter 4
│               ├── 05-authentication.mdx           # Chapter 5
│               ├── 06-testing.mdx                  # Chapter 6
│               ├── 07-docker.mdx                   # Chapter 7
│               ├── 08-kubernetes.mdx               # Chapter 8
│               ├── 09-ci-cd.mdx                    # Chapter 9
│               └── 10-monitoring.mdx               # Chapter 10
├── layouts/
│   └── GuideLayout.astro                           # New layout extending Layout
├── components/
│   └── guides/
│       ├── GuideBreadcrumb.astro
│       ├── GuideNav.astro
│       ├── GuidePrevNext.astro
│       ├── GuideJsonLd.astro
│       ├── CodeFromRepo.astro
│       ├── ArchitectureDiagram.astro
│       └── FileTree.astro
├── lib/
│   └── guides/
│       ├── schema.ts
│       ├── routes.ts
│       └── svg-generators/
│           ├── fastapi-architecture.ts
│           ├── docker-layers.ts
│           └── k8s-deployment.ts
├── pages/
│   ├── guides/
│   │   └── fastapi-production/
│   │       ├── index.astro                         # Guide landing
│   │       └── [slug].astro                        # Chapter pages
│   └── open-graph/
│       └── guides/
│           └── fastapi-production/
│               ├── index.png.ts                    # Landing OG
│               └── [slug].png.ts                   # Chapter OG
```

### Structure Rationale

- **`src/data/guides/fastapi-production/`:** Follows the EDA pattern where data lives under `src/data/eda/`. Each guide gets its own subdirectory, making it trivial to add future guides (e.g., `src/data/guides/kubernetes-operators/`).
- **Numbered MDX files (01-, 02-, ...):** Provides natural filesystem ordering that maps to chapter sequence. The number prefix is stripped from the slug during route generation. This is more robust than relying on a separate ordering field when adding/reordering chapters.
- **`guide.json` at guide level:** Contains guide-wide metadata (title, description, template repo URL, author, tags) and a `chapters` array that defines ordering, titles, and descriptions. The JSON is the source of truth for chapter order; the MDX file numbering is a convenience for filesystem browsing.
- **`src/lib/guides/`:** Mirrors `src/lib/eda/` -- schemas, routes, and SVG generators are colocated by domain rather than scattered across `src/`.
- **`src/components/guides/`:** Mirrors `src/components/eda/` -- guide-specific components are namespaced to avoid polluting the global component directory.

## Architectural Patterns

### Pattern 1: Content Collection Hybrid (MDX Pages + JSON Metadata)

**What:** Register two collections: `guidePages` (glob-loaded MDX for chapter content) and `guides` (file-loaded JSON for guide-level metadata including chapter ordering and template repo URLs).

**When to use:** When you need both renderable long-form content (chapters with embedded components, code blocks, headings) and structured metadata (ordering, cross-references, external URLs).

**Trade-offs:**
- Pro: MDX gives full component power -- import Callout, CodeFromRepo, ArchitectureDiagram directly in content
- Pro: JSON ordering array is the single source of truth for chapter sequence, making reordering trivial
- Pro: Content collections give Zod validation, TypeScript types, and build-time error reporting
- Con: Two collections for one logical entity (guide) requires joining at query time
- Con: Adding a new chapter requires editing both the MDX file and the JSON chapters array

**Implementation:**

```typescript
// src/lib/guides/schema.ts
import { z } from 'astro/zod';

export const guideChapterSchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
});

export const guideSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  templateRepo: z.string().url(),
  tags: z.array(z.string()).default([]),
  chapters: z.array(guideChapterSchema),
});

export const guidePageSchema = z.object({
  title: z.string(),
  description: z.string(),
  chapter: z.number().int().min(1),
  guide: z.string(), // matches guide.id -- used to join
  tags: z.array(z.string()).default([]),
  templateRepoPath: z.string().optional(), // path within template repo for "View Source"
});
```

```typescript
// In src/content.config.ts -- additions only
const guides = defineCollection({
  loader: file('src/data/guides/fastapi-production/guide.json'),
  schema: guideSchema,
});

const guidePages = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/data/guides' }),
  schema: guidePageSchema,
});

export const collections = {
  blog, languages, dbModels, edaTechniques, edaDistributions, edaPages,
  guides, guidePages, // NEW
};
```

### Pattern 2: Chapter-Aware Navigation (Sidebar + Prev/Next)

**What:** Compute prev/next links and sidebar state from the guide's `chapters` array at build time, passing them as props to navigation components. No client-side state needed.

**When to use:** Any sequential multi-page guide where readers progress through ordered content.

**Trade-offs:**
- Pro: Zero JavaScript for navigation -- fully static, accessible, SEO-friendly
- Pro: Chapter ordering comes from `guide.json`, not from filesystem or frontmatter
- Pro: Sidebar highlights current chapter without client JS (computed in `getStaticPaths`)
- Con: Adding a chapter requires updating `guide.json` chapters array

**Implementation:**

```typescript
// src/pages/guides/fastapi-production/[slug].astro (getStaticPaths excerpt)
export async function getStaticPaths() {
  const allPages = await getCollection('guidePages');
  const guideMeta = await getCollection('guides');
  const guide = guideMeta.find(g => g.data.slug === 'fastapi-production');

  const chapterSlugs = guide.data.chapters.map(c => c.slug);
  const pages = allPages
    .filter(p => p.data.guide === 'fastapi-production')
    .sort((a, b) => a.data.chapter - b.data.chapter);

  return pages.map((page, i) => {
    const slug = page.id.replace('fastapi-production/pages/', '').replace(/^\d+-/, '');
    return {
      params: { slug },
      props: {
        page,
        guide: guide.data,
        prev: i > 0 ? guide.data.chapters[i - 1] : null,
        next: i < pages.length - 1 ? guide.data.chapters[i + 1] : null,
        currentIndex: i,
        totalChapters: pages.length,
      },
    };
  });
}
```

### Pattern 3: Build-Time SVG Architecture Diagrams

**What:** Generate architecture diagrams as SVG strings at build time using the same TypeScript-to-SVG pattern already established for EDA plots. The SVGs are inlined into the HTML -- no external image loads, no client JavaScript.

**When to use:** For diagrams that illustrate static architecture: project structure, Docker layer composition, Kubernetes resource relationships, CI/CD pipelines.

**Trade-offs:**
- Pro: Zero CLS (Cumulative Layout Shift) -- SVG dimensions known at build time
- Pro: Theme-aware -- SVGs use CSS custom properties for colors
- Pro: No image optimization pipeline needed -- inlined directly
- Pro: Established pattern in codebase (17 existing SVG generators)
- Con: Complex diagrams require manual TypeScript SVG construction
- Con: Changes to diagrams require a rebuild

**Implementation:**

```typescript
// src/lib/guides/svg-generators/fastapi-architecture.ts
export function generateFastAPIArchitecture(opts: {
  width: number;
  height: number;
}): string {
  // Returns SVG string showing: Client -> Router -> Dependencies -> Service -> DB
  // Uses var(--color-*) for theme compatibility
  return `<svg width="${opts.width}" height="${opts.height}" ...>...</svg>`;
}
```

```astro
<!-- In MDX: -->
import ArchitectureDiagram from '../../../components/guides/ArchitectureDiagram.astro';
<ArchitectureDiagram type="fastapi-architecture" width={800} height={400} />
```

### Pattern 4: Template Repo Source Linking

**What:** A `CodeFromRepo` component that renders code blocks with a "View in template repo" link, connecting guide content to the actual source code in the FastAPI template repository.

**When to use:** When the guide explains code that lives in a separate GitHub repository. The guide is the narrative; the template repo is the reference implementation.

**Trade-offs:**
- Pro: Readers can jump from explanation to full implementation
- Pro: Code in MDX is curated (relevant excerpts), not full files
- Pro: Template repo link stored in `guide.json` -- single source of truth
- Con: Code in MDX can drift from template repo if repo changes -- requires manual sync
- Con: Permanent link depends on stable branch/tag (use a tagged release, not `main`)

**Implementation:**

```astro
<!-- src/components/guides/CodeFromRepo.astro -->
---
interface Props {
  path: string;       // e.g., "app/core/config.py"
  language: string;   // e.g., "python"
  title?: string;     // optional label
  repoUrl: string;    // from guide metadata
  branch?: string;    // default "main"
}
const { path, language, title, repoUrl, branch = 'main' } = Astro.props;
const sourceUrl = `${repoUrl}/blob/${branch}/${path}`;
---
<div class="relative">
  <div class="flex items-center justify-between text-xs text-[var(--color-text-secondary)] mb-1">
    <span class="font-mono">{title || path}</span>
    <a href={sourceUrl} target="_blank" rel="noopener noreferrer"
       class="text-[var(--color-accent)] hover:underline">
      View source
    </a>
  </div>
  <slot /> <!-- Code block from expressive-code goes here -->
</div>
```

Usage in MDX:

```mdx
import CodeFromRepo from '../../../components/guides/CodeFromRepo.astro';

<CodeFromRepo path="app/core/config.py" language="python" repoUrl="https://github.com/PatrykQuantumNomad/fastapi-template">

```python
# app/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "FastAPI Production App"
    debug: bool = False
    database_url: str

    class Config:
        env_file = ".env"
```

</CodeFromRepo>
```

## Data Flow

### Build-Time Page Generation

```
guide.json (chapters array)
    |
    ├── getStaticPaths() reads chapter ordering
    |
    ├── guidePages collection (MDX files)
    |   |
    |   ├── Zod validates frontmatter against guidePageSchema
    |   |
    |   └── render(page) produces { Content, headings }
    |
    ├── Joins: chapters[i] + pages[i] -> { page, prev, next, guide }
    |
    └── For each chapter:
        |
        ├── [slug].astro renders with GuideLayout
        |   ├── GuideBreadcrumb: Home > Guides > FastAPI Production > Chapter
        |   ├── GuideNav: sidebar with all chapters + on-page headings
        |   ├── Content: rendered MDX with embedded components
        |   └── GuidePrevNext: links to adjacent chapters
        |
        └── OG image endpoint generates per-chapter social card
```

### Content Authoring Flow

```
Author edits:
  1. src/data/guides/fastapi-production/pages/07-docker.mdx  (chapter content)
  2. src/data/guides/fastapi-production/guide.json            (if adding/reordering)
     |
     ├── Astro dev server hot-reloads
     ├── Zod validates schema at build time
     └── TypeScript catches type errors in page templates
```

### OG Image Generation Flow

```
src/pages/open-graph/guides/fastapi-production/[slug].png.ts
    |
    ├── getStaticPaths(): one route per chapter
    |
    ├── GET handler:
    |   ├── getOrGenerateOgImage(title, description, generateFn)
    |   |   ├── Check cache (node_modules/.cache/og-guides/)
    |   |   ├── Cache miss: generateGuideOgImage(title, description, chapterNum)
    |   |   └── Cache hit: return cached PNG
    |   |
    |   └── Return PNG response with immutable cache headers
    |
    └── Reuses existing og-cache.ts infrastructure
```

### Navigation Data Flow (No Client JS)

```
guide.json chapters array (ordered)
    |
    ├── getStaticPaths() computes for each page:
    |   ├── prev: chapters[i-1] or null
    |   ├── next: chapters[i+1] or null
    |   ├── currentIndex: i
    |   └── allChapters: chapters[] (for sidebar)
    |
    ├── Passed as Astro.props to page template
    |
    ├── GuideNav.astro receives allChapters + currentIndex
    |   └── Renders sidebar with aria-current on active chapter
    |
    └── GuidePrevNext.astro receives prev + next
        └── Renders bottom nav links (or null at start/end)
```

## Integration Points

### New Content Collections

| Collection | Loader | Source | Schema |
|------------|--------|--------|--------|
| `guides` | `file()` | `src/data/guides/fastapi-production/guide.json` | `guideSchema` (id, title, slug, description, templateRepo, chapters[]) |
| `guidePages` | `glob()` | `./src/data/guides` with `**/*.mdx` pattern | `guidePageSchema` (title, description, chapter, guide, tags, templateRepoPath) |

### Modifications to Existing Files

| File | Change | Risk |
|------|--------|------|
| `src/content.config.ts` | Add 2 collection definitions + import schema | LOW -- additive, no changes to existing collections |
| `src/components/Header.astro` | Add `{ href: '/guides/', label: 'Guides' }` to navLinks | LOW -- single array push, 10th nav item |
| `src/data/projects.ts` | Add guide entry to projects array | LOW -- additive |

### Reused Existing Infrastructure (No Modifications)

| Component | How It Is Reused |
|-----------|-----------------|
| `Layout.astro` | GuideLayout wraps it (same as EDALayout) |
| `SEOHead.astro` | Via Layout -- title, description, og props |
| `BreadcrumbJsonLd.astro` | Imported directly in guide page templates |
| `TableOfContents.astro` | Imported in [slug].astro for on-page headings |
| `lib/og-image.ts` | Add `generateGuideOgImage()` function |
| `lib/eda/og-cache.ts` | `getOrGenerateOgImage()` is domain-agnostic |
| `blog/Callout.astro` | Imported in guide MDX pages for tips/warnings |
| `blog/KeyTakeaway.astro` | Imported in guide MDX pages for summaries |
| `Expressive Code` | Already configured in astro.config.mjs -- code blocks work in MDX |
| `View Transitions` | Already in Layout.astro via ClientRouter |

### External Integration

| External | Integration | Notes |
|----------|-------------|-------|
| FastAPI template repo | `CodeFromRepo` links to source files | Use tagged release (e.g., `v1.0.0`) not `main` branch for stable links |
| Google Search | Schema.org TechArticle + BreadcrumbList JSON-LD | Reuses existing structured data patterns |
| GitHub Pages | Static output, no deployment changes | Existing `withastro/action@v3` workflow handles new pages automatically |

## Anti-Patterns

### Anti-Pattern 1: Putting Guide Content in `src/pages/` as Astro Files

**What people do:** Write each guide chapter as a standalone `.astro` page file instead of MDX content in a collection.
**Why it's wrong:** Loses content collection benefits: no Zod validation, no `getCollection()` queries, no `render()` with heading extraction, no separation of content from presentation. Makes prev/next navigation require hardcoded arrays in every page file.
**Do this instead:** Use MDX content collection with `glob()` loader. Page templates in `src/pages/` query the collection via `getStaticPaths()`.

### Anti-Pattern 2: Storing Chapter Ordering in MDX Frontmatter Only

**What people do:** Add an `order: 3` field to each MDX file's frontmatter and sort by it at query time.
**Why it's wrong:** Ordering is distributed across 10+ files. Reordering requires editing multiple frontmatter blocks and hoping you didn't create gaps or duplicates. No single view of the chapter sequence.
**Do this instead:** Define chapter ordering in `guide.json` as a single array. Each MDX file has a `chapter` number that can be validated against the JSON. The JSON array is the source of truth.

### Anti-Pattern 3: Creating a Separate Layout for Every Section

**What people do:** Build `GuideLayout.astro` from scratch, duplicating the head tags, fonts, analytics, animations, header, and footer from `Layout.astro`.
**Why it's wrong:** Any change to the base layout (new font, CSP update, analytics tag) must be propagated to every layout variant. The EDA section already demonstrates the correct pattern: `EDALayout.astro` wraps `Layout.astro` and adds only section-specific concerns (KaTeX CSS).
**Do this instead:** `GuideLayout.astro` wraps `Layout.astro` with a `<slot />`. It adds only guide-specific concerns: nothing in the current guide design requires anything beyond what `Layout.astro` already provides, so `GuideLayout` may be a near-empty wrapper. That is fine -- it provides the extension point for future needs.

### Anti-Pattern 4: Using React Islands for Guide Navigation

**What people do:** Build the sidebar and prev/next navigation as React components with `client:visible` or `client:load`.
**Why it's wrong:** Guide navigation is entirely deterministic at build time. There is no user interaction that changes which chapters exist or their order. Client-side JavaScript for static navigation is unnecessary weight and delays interactivity.
**Do this instead:** Build navigation as Astro components (`.astro` files). Compute all navigation data in `getStaticPaths()` and pass as props. Reserve React islands for genuinely interactive elements (e.g., a code playground if added later).

### Anti-Pattern 5: Inlining Full Source Files from the Template Repo

**What people do:** Copy entire files from the template repo into MDX, creating 200-line code blocks.
**Why it's wrong:** Readers cannot absorb 200 lines of code in a guide context. Long code blocks push other content off-screen. Full files drift out of sync with the repo faster than curated excerpts.
**Do this instead:** Show curated excerpts (10-40 lines) that illustrate the specific concept being discussed. Use `CodeFromRepo` with a "View source" link for readers who want the full file. The guide is narrative, not a code dump.

## Build Order

The following sequence respects dependencies between components. Items at the same level can be built in parallel.

### Phase 1: Foundation (no dependencies on other new components)

1. **`src/lib/guides/schema.ts`** -- Zod schemas for `guideSchema` and `guidePageSchema`
2. **`src/lib/guides/routes.ts`** -- URL builder functions: `guideUrl(guideSlug)`, `guideChapterUrl(guideSlug, chapterSlug)`
3. **`src/data/guides/fastapi-production/guide.json`** -- Guide metadata with chapter ordering array

### Phase 2: Content Infrastructure (depends on Phase 1 schemas)

4. **`src/content.config.ts`** -- Add `guides` and `guidePages` collections with schema imports
5. **`src/layouts/GuideLayout.astro`** -- Thin wrapper around `Layout.astro`
6. **`src/data/guides/fastapi-production/pages/01-project-structure.mdx`** -- First chapter MDX (start with one to validate pipeline)

### Phase 3: Navigation Components (depends on Phase 1 routes + Phase 2 collections)

7. **`src/components/guides/GuideBreadcrumb.astro`** -- Breadcrumb using routes.ts helpers
8. **`src/components/guides/GuidePrevNext.astro`** -- Bottom prev/next links
9. **`src/components/guides/GuideNav.astro`** -- Sidebar chapter list + on-page TOC integration

### Phase 4: Page Templates (depends on Phase 2 + Phase 3)

10. **`src/pages/guides/fastapi-production/[slug].astro`** -- Chapter page with getStaticPaths, layout, nav components
11. **`src/pages/guides/fastapi-production/index.astro`** -- Landing page with chapter card grid

### Phase 5: Guide-Specific Components (can be built in parallel with Phase 4)

12. **`src/components/guides/CodeFromRepo.astro`** -- Code block wrapper with source link
13. **`src/components/guides/FileTree.astro`** -- Project structure tree visualization
14. **`src/components/guides/ArchitectureDiagram.astro`** -- SVG diagram wrapper
15. **`src/lib/guides/svg-generators/fastapi-architecture.ts`** -- First architecture diagram

### Phase 6: SEO + OG Images (depends on Phase 4 pages existing)

16. **`src/components/guides/GuideJsonLd.astro`** -- Schema.org structured data
17. **`src/pages/open-graph/guides/fastapi-production/[slug].png.ts`** -- Per-chapter OG images
18. **`src/pages/open-graph/guides/fastapi-production/index.png.ts`** -- Landing page OG image
19. **Add `generateGuideOgImage()` to `src/lib/og-image.ts`**

### Phase 7: Site Integration (final, depends on pages existing)

20. **`src/components/Header.astro`** -- Add "Guides" nav link
21. **`src/data/projects.ts`** -- Add guide to projects listing
22. **Remaining chapter MDX files** (02 through 10) -- content authoring

### Dependency Graph

```
schema.ts ─────┐
               ├── content.config.ts ──┐
routes.ts ─────┤                       │
guide.json ────┘                       │
                                       ├── [slug].astro ──── Header.astro (nav link)
GuideLayout.astro ─────────────────────┤                     projects.ts (listing)
                                       │
GuideBreadcrumb.astro ─────────────────┤
GuidePrevNext.astro ───────────────────┤
GuideNav.astro ────────────────────────┘

CodeFromRepo.astro ────── (used in MDX, independent of page template)
FileTree.astro ────────── (used in MDX, independent of page template)
ArchitectureDiagram.astro + svg-generators ── (used in MDX, independent)

GuideJsonLd.astro ──── (embedded in page template after it works)
OG image endpoints ─── (depend on og-image.ts + og-cache.ts)
```

## Scaling Considerations

| Concern | At 1 guide (10 chapters) | At 5 guides (50 chapters) | At 20+ guides |
|---------|--------------------------|---------------------------|---------------|
| Content organization | Single directory under `src/data/guides/` | Each guide gets its own subdirectory -- clean | Consider a `/guides/` landing page listing all guides |
| Build time | Negligible -- 10 MDX pages add ~2-3 seconds | Still fast -- Astro 5 MDX builds are ~2x faster | May want to profile; 200+ MDX pages could add 30+ seconds |
| Navigation | Sidebar + prev/next per guide | Same pattern per guide, no cross-guide nav needed | May want a guides index page with search/filter |
| OG images | 11 images (landing + 10 chapters) | 55 images -- caching essential | OG cache prevents regeneration; fine at this scale |
| Content collections | 2 new collections | Same 2 collections with more entries | Same 2 collections; glob pattern handles subdirectories automatically |
| Header nav | "Guides" link sufficient | Still fine -- dropdown could list guides | Dropdown or dedicated nav section |

### Scaling Priority

1. **First concern:** At 5+ guides, the `/guides/` landing page should become a listing page showing all available guides (not just FastAPI). This is a trivial index.astro page querying the `guides` collection.
2. **Second concern:** At 20+ guides, consider whether the `guides` JSON collection should become a glob-loaded collection of individual `guide.json` files per directory, rather than a single combined JSON file.

## Sources

- [Astro Content Collections Documentation](https://docs.astro.build/en/guides/content-collections/) -- glob() and file() loaders, schema validation, collection querying
- [Astro MDX Integration](https://docs.astro.build/en/guides/integrations-guide/mdx/) -- MDX component imports, rendering, heading extraction
- [Astro Pages Documentation](https://docs.astro.build/en/basics/astro-pages/) -- getStaticPaths, dynamic routes, props
- Existing codebase patterns: `src/content.config.ts`, `src/layouts/EDALayout.astro`, `src/pages/eda/foundations/[...slug].astro`, `src/lib/eda/routes.ts`, `src/lib/eda/schema.ts`, `src/lib/eda/og-cache.ts`, `src/pages/open-graph/eda/[...slug].png.ts`

---
*Architecture research for: FastAPI Production Guide integration with Astro 5 portfolio site*
*Researched: 2026-03-08*
