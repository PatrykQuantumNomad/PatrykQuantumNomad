# Architecture Research: Claude Code Guide Refresh Integration

**Domain:** Astro 5 guide infrastructure -- cheatsheet page, chapter updates, blog post integration
**Researched:** 2026-04-12
**Confidence:** HIGH (based on direct codebase analysis, no external dependencies)

## Executive Summary

The Claude Code guide lives within a well-established multi-guide infrastructure on patrykgolabek.dev. The guide system uses Astro content collections (JSON metadata + MDX pages), a shared `GuideLayout.astro` for chapter pages, build-time OG image generation with content-hash caching, and centralized LLMs.txt generation. Three new deliverables -- a cheatsheet page, updated guide chapters, and a companion blog post -- each integrate differently with this architecture. The cheatsheet page is a **standalone Astro page** (not a content collection chapter), the chapter updates are in-place MDX edits, and the blog post follows the existing blog collection pattern with guide cross-linking.

## System Overview: Existing Guide Architecture

```
                           CONTENT LAYER
  ┌──────────────────────────────────────────────────────┐
  │  src/data/guides/claude-code/                        │
  │  ├── guide.json           (chapters[], metadata)     │
  │  └── pages/*.mdx          (11 chapter files)         │
  │                                                      │
  │  src/data/blog/                                      │
  │  └── claude-code-guide.mdx (companion blog post)     │
  ├──────────────────────────────────────────────────────┤
                           SCHEMA LAYER
  │  src/lib/guides/schema.ts                            │
  │  ├── guidePageSchema      (title, description,       │
  │  │                         order, slug, keywords)    │
  │  └── guideMetaSchema      (chapters[], accentColor,  │
  │                            publishedDate, etc.)      │
  │                                                      │
  │  src/content.config.ts                               │
  │  ├── claudeCodePages      (glob MDX loader)          │
  │  └── claudeCodeGuide      (file JSON loader)         │
  ├──────────────────────────────────────────────────────┤
                           PAGE LAYER
  │  src/pages/guides/claude-code/                       │
  │  ├── index.astro          (/guides/claude-code/)     │
  │  ├── [slug].astro         (/guides/claude-code/X/)   │
  │  └── [NEW] cheatsheet.astro (/guides/.../cheatsheet/)│
  ├──────────────────────────────────────────────────────┤
                           LAYOUT LAYER
  │  src/layouts/                                        │
  │  ├── Layout.astro         (base layout, all pages)   │
  │  └── GuideLayout.astro    (sidebar + breadcrumb +    │
  │                            chapter nav + JSON-LD)    │
  ├──────────────────────────────────────────────────────┤
                           OG IMAGE LAYER
  │  src/pages/open-graph/guides/claude-code/            │
  │  ├── [slug].png.ts        (per-chapter OG images)    │
  │  └── [NEW] needs OG for cheatsheet                   │
  │  src/pages/open-graph/guides/                        │
  │  └── claude-code.png.ts   (landing page OG image)    │
  ├──────────────────────────────────────────────────────┤
                           SEO LAYER
  │  src/pages/llms.txt.ts                               │
  │  src/pages/llms-full.txt.ts                          │
  │  (both iterate claudeCodePages collection)           │
  └──────────────────────────────────────────────────────┘
```

## Key Architecture Decision: Cheatsheet Page Type

### Decision: Standalone Astro page, NOT a content collection chapter

**Rationale based on codebase evidence:**

1. **guide.json chapters array drives the content collection.** The `claudeCodePages` collection uses `glob({ pattern: '**/*.mdx', base: './src/data/guides/claude-code/pages' })`. Adding a cheatsheet MDX file here would require it to have `guidePageSchema` frontmatter (title, description, order, slug, keywords) and would make it appear in the `[slug].astro` dynamic route, rendered through `GuideLayout` with full article prose treatment. This is wrong for a cheatsheet -- it is a visual reference, not a chapter to read.

2. **guide.json chapters array controls sidebar navigation and prev/next links.** `GuideChapterNav` uses `currentIndex` within the chapters array for prev/next navigation. A cheatsheet has no logical prev/next relationship with chapters. Adding it to the chapters array would create a jarring navigation flow (e.g., "Security" -> next -> "Cheatsheet" instead of being the terminal chapter).

3. **Precedent: FastAPI faq.astro.** The FastAPI guide has a standalone `faq.astro` page at `/guides/fastapi-production/faq/` that lives outside the content collection. It uses `Layout.astro` directly (not `GuideLayout`), has its own breadcrumb markup, and manages its own JSON-LD. This is the exact pattern for the cheatsheet.

4. **The cheatsheet is a reference artifact, not prose.** It renders two pre-built SVG files with download buttons. The `GuideLayout` sidebar + article prose + reading-time pattern does not fit.

**Implementation:** Create `src/pages/guides/claude-code/cheatsheet.astro` as a standalone page using `Layout.astro` directly, mirroring the `faq.astro` precedent.

## Component Analysis: New vs Modified

### NEW Components to Create

| Component | Path | Purpose |
|-----------|------|---------|
| Cheatsheet page | `src/pages/guides/claude-code/cheatsheet.astro` | Standalone page rendering 2 SVGs with download buttons |
| Cheatsheet OG image | `src/pages/open-graph/guides/claude-code/cheatsheet.png.ts` | Build-time OG image for cheatsheet page |
| Companion blog post | `src/data/blog/claude-code-guide-refresh.mdx` | New blog post announcing the guide refresh |

### MODIFIED Components (In-Place Edits)

| Component | Path | Change |
|-----------|------|--------|
| Guide chapters | `src/data/guides/claude-code/pages/*.mdx` | Content updates to all 11 chapters |
| guide.json | `src/data/guides/claude-code/guide.json` | Update descriptions if chapters changed substantially |
| Landing page | `src/pages/guides/claude-code/index.astro` | Add cheatsheet card/link below the chapter grid |
| llms.txt | `src/pages/llms.txt.ts` | Add cheatsheet URL entry |
| llms-full.txt | `src/pages/llms-full.txt.ts` | Add cheatsheet URL entry |
| Blog slug template | `src/pages/blog/[slug].astro` | Add FAQ JSON-LD block for the new blog post (if applicable) |

### UNCHANGED Components (No Modification Needed)

| Component | Path | Why Unchanged |
|-----------|------|---------------|
| GuideLayout.astro | `src/layouts/GuideLayout.astro` | Cheatsheet uses Layout.astro directly |
| GuideSidebar.astro | `src/components/guide/GuideSidebar.astro` | Driven by guide.json chapters, cheatsheet is standalone |
| GuideChapterNav.astro | `src/components/guide/GuideChapterNav.astro` | Same -- cheatsheet is outside nav flow |
| GuideBreadcrumb.astro | `src/components/guide/GuideBreadcrumb.astro` | Cheatsheet page builds its own breadcrumb |
| content.config.ts | `src/content.config.ts` | No new collections needed |
| guide schema | `src/lib/guides/schema.ts` | No schema changes needed |
| guide routes | `src/lib/guides/routes.ts` | Cheatsheet URL is hardcoded, not dynamic |
| OG cache utility | `src/lib/guides/og-cache.ts` | Reused as-is by new OG endpoint |
| OG image generator | `src/lib/og-image.ts` | Reused as-is -- `generateGuideOgImage()` works for cheatsheet |

## Detailed Architecture: Cheatsheet Page

### Data Flow

```
public/images/cheatsheet/
  ├── claude-code-cheatsheet.svg       (dark theme, 1600x1000, ~56KB)
  └── claude-code-cheatsheet-print.svg (light/print theme, 1600x1000, ~56KB)
        │
        ▼
src/pages/guides/claude-code/cheatsheet.astro
  │   Renders:
  │   1. Breadcrumb (Home > Guides > Claude Code Guide > Cheatsheet)
  │   2. Hero section (title, description)
  │   3. Dark-theme SVG via <img> tag
  │   4. Print-theme SVG via <img> tag
  │   5. Download buttons (link to /images/cheatsheet/*.svg with download attr)
  │   6. Cross-link to guide landing page
  │   7. BreadcrumbJsonLd + page-level JSON-LD
  │
  ├── Uses Layout.astro (NOT GuideLayout.astro)
  ├── OG image from /open-graph/guides/claude-code/cheatsheet.png
  └── URL: /guides/claude-code/cheatsheet/
```

### SVG Rendering Approach

The two SVGs are pre-built static assets in `public/images/cheatsheet/`. They are NOT build-time generated diagram components (unlike `AgenticLoopDiagram.astro` etc.). They use external Google Font imports and have fixed 1600x1000 viewBox dimensions.

**Recommended rendering:** Use `<img>` tags with explicit width/height and responsive CSS. Reasons:
- External font `@import` in SVG `<defs><style>` works in `<img>` tags in modern browsers
- `<img>` prevents SVG from accessing page DOM (security benefit)
- `<img>` is simpler, more cacheable, and SEO-friendly with alt text
- The SVGs already have fixed dimensions and self-contained styling

**Important detail:** The dark-theme SVG has a dark background (`#0c0c14` gradient) which will look good in both site themes. The print SVG has a white background. The page should present both with labels and download buttons.

### Download Buttons

Use HTML5 download attribute pointing to the static `public/` assets. No server-side generation needed. The files are already in `public/` and served as static assets by Astro.

## Detailed Architecture: OG Image for Cheatsheet

### Pattern to Follow

The existing `[slug].png.ts` generates OG images by iterating over the `claudeCodePages` collection. Since the cheatsheet is NOT in the collection, it needs its own static OG endpoint.

**Create:** `src/pages/open-graph/guides/claude-code/cheatsheet.png.ts`

This follows the pattern of `claude-code.png.ts` (the landing page OG image) -- a non-dynamic endpoint that calls `generateGuideOgImage()` with static title/description strings, wrapped in `getOrGenerateOgImage()` for content-hash caching. Zero changes to existing utility functions.

## Detailed Architecture: Blog Post Integration

### Existing Pattern

The current companion blog post `src/data/blog/claude-code-guide.mdx` follows the standard blog collection schema:
- Frontmatter: title, description, publishedDate, tags, coverImage, draft
- Content: prose with links to guide chapters via absolute paths (`/guides/claude-code/introduction/`)
- Referenced in `src/pages/blog/[slug].astro` with special-case FAQ JSON-LD and `aboutDataset` linking to the guide

### New Blog Post

Create `src/data/blog/claude-code-guide-refresh.mdx` following the same pattern:
- Tags should overlap with the existing post tags for related-post discovery (the blog template auto-computes related posts by tag overlap)
- Include links to updated chapters AND the new cheatsheet page
- The `[slug].astro` template may need a new `isClaudeCodeRefreshPost` flag if FAQ JSON-LD is desired

### Cross-Linking Architecture

```
Blog Post (new)                    Guide Chapters (updated)
  │                                  │
  ├── links to /guides/claude-code/  ├── companionLink in [slug].astro
  ├── links to cheatsheet page       │   currently points to existing
  └── links to updated chapters      │   blog post -- may update to
                                     │   new post or keep existing
Cheatsheet Page (new)
  │
  ├── links to /guides/claude-code/ (landing)
  └── cross-linked FROM landing page index.astro
```

**Decision point for the roadmap:** The `companionLink` in `[slug].astro` currently hardcodes `href: "/blog/claude-code-guide/"` with text "The Context Window Is the Product". If the new blog post replaces it as the primary companion, update the href/text/label. If both posts should coexist, decide which one the companion link should reference.

## Detailed Architecture: Landing Page Integration

The cheatsheet should be surfaced from the guide landing page (`index.astro`) but NOT as a numbered chapter card.

**Recommended: Add a "Resources" section below the chapter grid.** This mirrors how the FastAPI guide's FAQ is discoverable but not numbered as a chapter. The Resources section would contain a card linking to `/guides/claude-code/cheatsheet/` with a brief description.

## Detailed Architecture: LLMs.txt Integration

Both `llms.txt.ts` and `llms-full.txt.ts` iterate `claudeCodePagesList` to generate guide chapter entries. Since the cheatsheet is NOT in the collection, it must be added manually after the chapter loop in both files.

For `llms.txt.ts`: Add a single line entry with URL and description.
For `llms-full.txt.ts`: Add a multi-line entry with URL, description, and additional metadata about the dark/print versions.

## Suggested Build Order

Build order is driven by data dependencies and testability at each step.

### Phase 1: Chapter Content Updates (no architecture changes)

Update existing MDX files in `src/data/guides/claude-code/pages/`. This is pure content work with zero architecture impact -- the files already exist, the schema already validates them, and all rendering pipelines already handle them.

**Depends on:** Nothing
**Validates:** `npm run build` succeeds, reading times update on landing page

### Phase 2: Cheatsheet Page + OG Image (new standalone page)

1. Create `src/pages/guides/claude-code/cheatsheet.astro`
2. Create `src/pages/open-graph/guides/claude-code/cheatsheet.png.ts`

**Depends on:** Existing SVG assets in `public/images/cheatsheet/` (already present)
**Validates:** `/guides/claude-code/cheatsheet/` renders, OG image generates, breadcrumbs work

### Phase 3: Landing Page Integration (wire cheatsheet into discovery)

Modify `src/pages/guides/claude-code/index.astro` to add a Resources section with cheatsheet card.

**Depends on:** Phase 2 (cheatsheet page must exist to link to)
**Validates:** Landing page shows cheatsheet card, link works

### Phase 4: LLMs.txt Updates (SEO plumbing)

Modify both `src/pages/llms.txt.ts` and `src/pages/llms-full.txt.ts` to add cheatsheet entries.

**Depends on:** Phase 2 (cheatsheet URL must be decided)
**Validates:** `curl localhost:4321/llms.txt` includes cheatsheet entry

### Phase 5: Blog Post (new content, cross-linking)

1. Create `src/data/blog/claude-code-guide-refresh.mdx`
2. Optionally update `companionLink` in `[slug].astro`
3. Optionally add FAQ JSON-LD in `[slug].astro` for new post

**Depends on:** Phases 1-3 (needs finalized chapter content and cheatsheet URL to link to)
**Validates:** Blog post renders, related posts compute correctly, companion link works

### Phase 6: guide.json Metadata Update (descriptions, dates)

Update chapter descriptions and publishedDate in `guide.json` if chapters changed significantly.

**Depends on:** Phase 1 (need to know final chapter content)
**Can run parallel with:** Phases 2-4

## Architectural Patterns

### Pattern 1: Standalone Guide Supplementary Page

**What:** A page within a guide's URL space that is NOT part of the content collection or chapter navigation flow.
**When to use:** Reference pages (FAQ, cheatsheet, appendix) that complement a guide but are not sequential chapters.
**Trade-offs:** Requires manual breadcrumb/JSON-LD (not from GuideLayout), requires manual LLMs.txt entry, but avoids polluting the chapter navigation flow.
**Precedent:** `src/pages/guides/fastapi-production/faq.astro`

### Pattern 2: Static Asset OG Image Endpoint

**What:** A non-dynamic `.png.ts` endpoint that generates a single OG image for a page not in a content collection.
**When to use:** Standalone pages that need OG images but are not part of a dynamic `[slug]` route.
**Precedent:** `src/pages/open-graph/guides/claude-code.png.ts` (landing page OG)

### Pattern 3: Blog-Guide Cross-Linking

**What:** A blog post that references guide chapters with in-text links, and guide chapters that link back to the blog via `companionLink`.
**When to use:** Every guide should have at least one companion blog post for SEO (blog posts rank differently than guide pages in search).
**Precedent:** `claude-code-guide.mdx` linking to all 11 chapters, `[slug].astro` having `companionLink` pointing back.

## Anti-Patterns

### Anti-Pattern 1: Adding Cheatsheet to guide.json Chapters Array

**What people do:** Add `{ "slug": "cheatsheet", "title": "Cheatsheet" }` to the chapters array in guide.json and create a corresponding `cheatsheet.mdx` in the pages directory.
**Why it is wrong:** The cheatsheet would appear in the sidebar as Chapter 12, get prev/next navigation linking it to Chapter 11 (Security), receive article prose rendering treatment (reading time, ToC), and be counted as a guide chapter in analytics. None of this is appropriate for a visual reference sheet.
**Do this instead:** Create a standalone `.astro` page file following the `faq.astro` precedent.

### Anti-Pattern 2: Inline SVG for Cheatsheets

**What people do:** Read the SVG file contents and embed them directly in the page markup.
**Why it is wrong:** At ~56KB each, inline SVGs bloat the HTML document by 112KB, they include `@import url()` font references that may behave differently when inlined (CORS), and they pollute the page CSS scope with SVG-internal styles. The SVGs also use `bx:export` namespace attributes from Boxy SVG editor that are irrelevant in an inline context.
**Do this instead:** Use `<img>` tags pointing to the static assets in `public/images/cheatsheet/`.

### Anti-Pattern 3: Modifying GuideLayout for Non-Chapter Pages

**What people do:** Add conditional logic to GuideLayout.astro (e.g., `{!isCheatsheet && <GuideSidebar />}`) to handle non-chapter pages.
**Why it is wrong:** GuideLayout's single responsibility is rendering guide chapters with sidebar, breadcrumb, and chapter nav. Adding conditionals creates a god-layout that serves multiple purposes. The FastAPI FAQ already established the correct precedent: use Layout.astro directly for supplementary pages.
**Do this instead:** Use Layout.astro and build page-specific markup inline.

## Integration Points

### External Services

None. All components are build-time static. No runtime services, APIs, or databases involved.

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Cheatsheet page to SVG assets | Static file reference via `<img src>` | Assets already in `public/`, no build step needed |
| Cheatsheet page to OG image | URL reference in Layout ogImage prop | OG endpoint must exist before build validates |
| Landing page to Cheatsheet page | Hyperlink in Resources section | One-way link, cheatsheet page has its own back-link |
| Blog post to Guide chapters | In-text hyperlinks | Standard markdown links to chapter URLs |
| LLMs.txt to Cheatsheet | Manually added entry | Not auto-discovered from collection |
| Guide chapters to Blog post | `companionLink` prop in `[slug].astro` | Hardcoded, requires manual update if blog post changes |

## Sources

- Direct codebase analysis of `/Users/patrykattc/work/git/PatrykQuantumNomad/` (HIGH confidence)
- `src/content.config.ts` -- collection definitions
- `src/data/guides/claude-code/guide.json` -- chapter registry
- `src/lib/guides/schema.ts` -- Zod schemas for guide pages and metadata
- `src/pages/guides/claude-code/[slug].astro` -- chapter page template
- `src/pages/guides/claude-code/index.astro` -- landing page template
- `src/layouts/GuideLayout.astro` -- guide chapter layout
- `src/pages/guides/fastapi-production/faq.astro` -- standalone guide page precedent
- `src/pages/open-graph/guides/claude-code/[slug].png.ts` -- OG image generation pattern
- `src/pages/open-graph/guides/claude-code.png.ts` -- static OG endpoint pattern
- `src/pages/llms.txt.ts` and `src/pages/llms-full.txt.ts` -- LLMs.txt generation
- `src/data/blog/claude-code-guide.mdx` -- companion blog post pattern
- `src/pages/blog/[slug].astro` -- blog template with guide-specific JSON-LD
- `public/images/cheatsheet/*.svg` -- cheatsheet assets (1600x1000, ~56KB each)

---
*Architecture research for: Claude Code Guide Refresh Integration*
*Researched: 2026-04-12*
