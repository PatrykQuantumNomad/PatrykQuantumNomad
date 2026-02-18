# Phase 20: Blog Content & Cross-Linking - Research

**Researched:** 2026-02-17
**Domain:** Astro MDX blog content authoring + internal cross-linking for SEO
**Confidence:** HIGH

## Summary

Phase 20 has two deliverables: (1) a local MDX blog post explaining the Beauty Index methodology, and (2) bidirectional cross-links between the blog post and all Beauty Index pages (overview, 25 language pages, code comparison page). No new libraries, infrastructure, or build patterns are needed. The entire phase operates within established conventions already proven in the codebase.

The blog infrastructure is fully operational (content collection with `glob` loader from `./src/data/blog/`, MDX integration via `@astrojs/mdx`, Expressive Code for syntax highlighting, OG image generation via Satori/Sharp, BlogPostingJsonLd structured data, TableOfContents component, and a rich library of MDX blog components: Lede, TldrSummary, Callout, Figure, KeyTakeaway, ToolCard, ToolGrid). The existing MDX blog post (`building-kubernetes-observability-stack.mdx`) demonstrates every pattern needed: frontmatter schema, component imports, long-form prose structure, and embedded components.

The Beauty Index pages (overview at `/beauty-index/`, 25 language detail pages at `/beauty-index/{id}/`, and code comparison at `/beauty-index/code/`) exist and are complete but have zero references to the blog and vice versa. Cross-linking is purely an HTML/Astro template edit requiring no new components.

**Primary recommendation:** Write one MDX blog post file and add link elements to 4 Astro page templates (overview, language detail, code comparison, and the blog post itself). No new libraries, no new components, no schema changes.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@astrojs/mdx` | Already installed | MDX blog post rendering | Already configured in astro.config.mjs, proven with existing post |
| `astro-expressive-code` | Already installed | Syntax-highlighted code blocks in MDX | Already configured with github-dark/github-light themes |
| Satori + Sharp | Already installed | OG image generation for blog post | Already used by `src/pages/open-graph/[...slug].png.ts` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Existing blog components | N/A | Lede, Callout, TldrSummary, KeyTakeaway, Figure | Use within the MDX blog post for rich formatting |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Local MDX post | External link (like ext-*.md posts) | External links have no `render()` content, cannot embed components, no internal SEO value |
| Inline links in Astro pages | Dedicated cross-link component | A component adds abstraction for 4 simple `<a>` tags -- not justified |

**Installation:** None required. All dependencies already present.

## Architecture Patterns

### File Structure (Additions Only)

```
src/
├── data/
│   └── blog/
│       └── the-beauty-index.mdx          # NEW: Blog post (BLOG-01)
├── pages/
│   └── beauty-index/
│       ├── index.astro                   # EDIT: Add blog post link (BLOG-02)
│       ├── [slug].astro                  # EDIT: Add blog post link (BLOG-02)
│       └── code/
│           └── index.astro              # EDIT: Add blog post link (BLOG-02)
```

### Pattern 1: Local MDX Blog Post

**What:** A local `.mdx` file in `src/data/blog/` with frontmatter matching the blog schema, Astro component imports, and long-form prose.

**When to use:** For original, site-owned content (not external links).

**Example (from existing codebase):**

```mdx
---
title: "The Beauty Index: How I Scored 25 Programming Languages on Aesthetics"
description: "A deep dive into the methodology behind scoring languages across 6 dimensions..."
publishedDate: 2026-02-17
tags: ["programming-languages", "beauty-index", "software-aesthetics"]
draft: false
---

import Lede from '../../components/blog/Lede.astro';
import Callout from '../../components/blog/Callout.astro';
import KeyTakeaway from '../../components/blog/KeyTakeaway.astro';

<Lede>How do you measure beauty in code?</Lede>

Content here...
```

**Key details verified from codebase:**
- Blog loader: `glob({ pattern: '**/*.{md,mdx}', base: './src/data/blog' })` -- file goes in `src/data/blog/`
- Slug is derived from `post.id` which equals the filename without extension
- URL pattern: `/blog/{filename-without-extension}/`
- OG image auto-generated at `/open-graph/blog/{slug}.png` via `src/pages/open-graph/[...slug].png.ts`
- Only non-external, non-draft posts are rendered as pages (see `[slug].astro` filter)
- Component imports use relative paths from `src/data/blog/` to `src/components/blog/`

### Pattern 2: Bidirectional Cross-Linking

**What:** Each Beauty Index page links to the blog post; the blog post links to Beauty Index pages.

**Blog post -> Beauty Index links (within MDX content):**
- Overview: `/beauty-index/`
- Individual languages: `/beauty-index/{id}/` (e.g., `/beauty-index/haskell/`, `/beauty-index/python/`)
- Code comparison: `/beauty-index/code/`

These are standard markdown links in the MDX content body.

**Beauty Index pages -> Blog post link (in Astro templates):**
The blog post slug will be derived from its filename. Using `the-beauty-index.mdx` gives URL `/blog/the-beauty-index/`.

The link should be added as a contextual CTA, not a navigation element. Placement options:
1. **Overview page (`index.astro`):** Add after the hero section, before rankings
2. **Language detail pages (`[slug].astro`):** Add after the LanguageNav component, as a footer CTA
3. **Code comparison page (`code/index.astro`):** Add after the hero section

**Recommended pattern for the back-link:** A simple styled anchor, consistent with the site's design language:

```astro
<p class="text-sm text-[var(--color-text-secondary)] mt-4">
  Read the full methodology in the
  <a href="/blog/the-beauty-index/" class="text-[var(--color-accent)] hover:underline">
    Beauty Index blog post
  </a>.
</p>
```

### Pattern 3: Blog Post Content Structure

**What:** The methodology blog post needs specific content sections to fulfill BLOG-01.

**Required content (from success criteria):**
1. Methodology explanation -- what the 6 dimensions measure
2. Scoring rubric -- how scores 1-10 work, what the tiers mean
3. Editorial commentary -- the "deliberately opinionated" framing

**Data available in codebase for reference:**
- 6 dimensions: `src/lib/beauty-index/dimensions.ts` -- DIMENSIONS array with key, symbol, name, shortName, description
- 4 tiers: `src/lib/beauty-index/tiers.ts` -- TIERS array with name, label, minScore, maxScore, color
- Score range: 6-60 (6 dimensions x 1-10)
- 25 languages with scores, tiers, character sketches: `src/data/beauty-index/languages.json`

**Suggested structure for the blog post:**
1. Introduction / lede (why rank languages by beauty)
2. The 6 Dimensions (with Greek letter symbols)
3. Scoring Rubric (1-10 scale, what constitutes high/low)
4. The 4 Tiers (Workhorses through Beautiful, with score boundaries)
5. Notable Rankings (highlight a few interesting examples)
6. Methodology Limitations / Editorial Disclaimer
7. Explore the Index (links to overview, 3+ language pages, code comparison)

### Anti-Patterns to Avoid

- **Creating a new layout or page route for the blog post.** The blog post must go through the standard blog collection pipeline (`src/data/blog/*.mdx` -> `src/pages/blog/[slug].astro`), not a custom page.
- **Hardcoding language data in the blog post.** The post is editorial prose with inline links, not a data-driven component page. It should reference the data conceptually, not import and render it.
- **Adding a "Beauty Index" entry to the main navigation.** The header nav (`src/components/Header.astro`) currently has 5 items. The Beauty Index is discoverable via the blog post and internal links, not the main nav.
- **Over-engineering cross-link components.** Simple `<a>` tags in the Astro templates are sufficient. A reusable component for 3-4 identical links adds unnecessary abstraction.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Blog post rendering | Custom page/layout | Existing `[slug].astro` blog page | Already handles MDX rendering, TOC, JSON-LD, OG images |
| OG image for blog post | Custom OG image endpoint | Existing `[...slug].png.ts` | Automatically picks up new blog posts with no code changes |
| Syntax highlighting | Manual Shiki/Prism setup | `astro-expressive-code` already in pipeline | MDX code blocks get dual-theme highlighting for free |
| Reading time | Custom word counter | `remarkReadingTime` plugin already configured | Auto-populates `remarkPluginFrontmatter.minutesRead` |
| Table of contents | Custom heading extraction | `TableOfContents.astro` + `render()` headings | Already works for all blog posts |
| Structured data | Manual JSON-LD | `BlogPostingJsonLd.astro` component | Already added by `[slug].astro` for every local blog post |

**Key insight:** The blog pipeline is fully automated. Dropping a new `.mdx` file into `src/data/blog/` with valid frontmatter gives you: a rendered page, OG image, TOC, reading time, JSON-LD, tag pages, and blog listing inclusion -- all for free.

## Common Pitfalls

### Pitfall 1: MDX Component Import Paths

**What goes wrong:** MDX files in `src/data/blog/` use relative imports to `src/components/`. Getting the relative path wrong causes build failures.

**Why it happens:** The blog data directory (`src/data/blog/`) is two levels deep from `src/`, so imports need `../../components/`.

**How to avoid:** Follow the exact import pattern from `building-kubernetes-observability-stack.mdx`:
```
import Lede from '../../components/blog/Lede.astro';
```

**Warning signs:** Build errors mentioning "could not resolve" or "module not found" for component imports.

### Pitfall 2: Slug/URL Mismatch in Cross-Links

**What goes wrong:** Blog post filename doesn't match the URL used in Beauty Index page back-links, creating 404s.

**Why it happens:** The blog slug is derived from the filename (without extension). If the file is `the-beauty-index.mdx`, the URL is `/blog/the-beauty-index/`. A mismatch between the file name and the hardcoded URL in Beauty Index templates breaks the link.

**How to avoid:** Choose the filename first, derive the URL, and use that exact URL in all cross-link references. Validate by checking the slug at build time.

**Warning signs:** Broken links in the built site, 404s when clicking from Beauty Index pages to blog.

### Pitfall 3: Draft Flag Left On

**What goes wrong:** Blog post has `draft: true` in frontmatter and doesn't appear in production build.

**Why it happens:** The `[slug].astro` and `[...page].astro` pages filter drafts in production (`import.meta.env.PROD ? data.draft !== true : true`).

**How to avoid:** Set `draft: false` in frontmatter. The existing blog post uses `draft: false`.

**Warning signs:** Post visible in dev but missing in production build.

### Pitfall 4: Missing Back-Links (One-Way Cross-Linking)

**What goes wrong:** Blog post links to Beauty Index pages, but those pages don't link back. Phase success criteria require bidirectional links.

**Why it happens:** Easy to write the blog post content with forward links and forget to edit the 3 Astro page templates.

**How to avoid:** Treat the cross-linking as a separate task/checklist item. Verify bidirectionality by checking both directions in the built site.

**Warning signs:** Success criteria #2 fails: "those pages link back to the blog post."

### Pitfall 5: Forgetting Code Comparison Page

**What goes wrong:** Cross-links added to overview and language detail pages but not to `/beauty-index/code/`.

**Why it happens:** The code comparison page is a third template file (`code/index.astro`) that's easy to overlook.

**How to avoid:** Explicitly list all 3 Beauty Index page templates that need editing: `index.astro`, `[slug].astro`, `code/index.astro`.

## Code Examples

### Example 1: MDX Blog Post Frontmatter

Verified pattern from `src/data/blog/building-kubernetes-observability-stack.mdx`:

```yaml
---
title: "The Beauty Index: How I Scored 25 Programming Languages on Aesthetics"
description: "The methodology behind ranking Haskell, Rust, Python, and 22 other languages across 6 aesthetic dimensions -- from mathematical elegance to practitioner happiness."
publishedDate: 2026-02-17
tags: ["programming-languages", "beauty-index", "software-aesthetics"]
draft: false
---
```

**Schema reference** (from `src/content.config.ts`):
- `title: z.string()` -- required
- `description: z.string()` -- required
- `publishedDate: z.coerce.date()` -- required
- `tags: z.array(z.string()).default([])` -- optional, defaults to empty
- `draft: z.boolean().default(false)` -- optional, defaults to false
- `coverImage: z.string().optional()` -- optional, used for OG image
- `externalUrl` -- must NOT be set (external posts don't render locally)
- `source` -- must NOT be set (only for external posts)

### Example 2: Cross-Link from Blog Post to Beauty Index Pages

Standard markdown links in MDX body:

```mdx
Explore the full rankings on the [Beauty Index overview](/beauty-index/), dive into individual language profiles like [Haskell](/beauty-index/haskell/), [Python](/beauty-index/python/), or [Rust](/beauty-index/rust/), or see how languages compare side by side on the [Code Comparison](/beauty-index/code/) page.
```

### Example 3: Cross-Link from Beauty Index Overview to Blog Post

Addition to `src/pages/beauty-index/index.astro`, placed in the hero section after the subtitle:

```astro
<p class="text-sm text-[var(--color-text-secondary)] mt-4">
  <a href="/blog/the-beauty-index/" class="text-[var(--color-accent)] hover:underline">
    Read the methodology &rarr;
  </a>
</p>
```

### Example 4: Cross-Link from Language Detail Page to Blog Post

Addition to `src/pages/beauty-index/[slug].astro`, placed after the Character section or before LanguageNav:

```astro
<p class="text-sm text-[var(--color-text-secondary)] mt-8">
  How are these scores calculated?
  <a href="/blog/the-beauty-index/" class="text-[var(--color-accent)] hover:underline">
    Read the methodology
  </a>
</p>
```

### Example 5: Available MDX Components for Rich Blog Content

All already exist in `src/components/blog/`:

```mdx
import Lede from '../../components/blog/Lede.astro';
import TldrSummary from '../../components/blog/TldrSummary.astro';
import Callout from '../../components/blog/Callout.astro';
import Figure from '../../components/blog/Figure.astro';
import KeyTakeaway from '../../components/blog/KeyTakeaway.astro';

<Lede>Beauty is subjective. This index is deliberately opinionated.</Lede>

<TldrSummary>
Every language gets scored 1-10 on six dimensions. The total (6-60) places it in one of four tiers: Workhorses, Practical, Handsome, or Beautiful.
</TldrSummary>

<Callout type="tip" title="Why Greek letters?">
Each dimension uses a Greek letter symbol as shorthand...
</Callout>

<KeyTakeaway>
The Beauty Index is not about finding the "best" language. It is about examining what makes code aesthetically pleasing...
</KeyTakeaway>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Content Collections v1 (`src/content/`) | Content Collections v2 (`defineCollection` with loaders) | Astro 5.x | This project already uses v2 with `glob` and `file` loaders |

**Deprecated/outdated:**
- None relevant. The blog pipeline uses current Astro patterns.

## Content Inventory: Links Required for BLOG-02

### Blog post must link to (forward links):

1. `/beauty-index/` -- Overview page (required by success criteria)
2. At least 3 individual language pages (required by success criteria), e.g.:
   - `/beauty-index/haskell/`
   - `/beauty-index/python/`
   - `/beauty-index/rust/`
   - (Additional language links optional but encouraged)
3. `/beauty-index/code/` -- Code comparison page (required by success criteria)

### Beauty Index pages must link back to blog post (back-links):

1. `src/pages/beauty-index/index.astro` -- Overview page
2. `src/pages/beauty-index/[slug].astro` -- All 25 language detail pages (single template edit)
3. `src/pages/beauty-index/code/index.astro` -- Code comparison page

### Available language IDs for linking (all 25):

Beautiful tier: `haskell`, `rust`, `elixir`, `kotlin`, `swift`
Handsome tier: `python`, `ruby`, `typescript`, `scala`, `clojure`, `fsharp`, `ocaml`
Practical tier: `go`, `csharp`, `dart`, `julia`, `lua`, `zig`
Workhorses tier: `java`, `javascript`, `c`, `cpp`, `php`, `perl`, `cobol`

## Open Questions

1. **Blog post slug/filename**
   - What we know: Filename determines URL slug. The success criteria says "A blog post titled 'The Beauty Index' (or similar)."
   - What's unclear: Exact filename (e.g., `the-beauty-index.mdx` vs `beauty-index-methodology.mdx`)
   - Recommendation: Use `the-beauty-index.mdx` for the cleanest URL (`/blog/the-beauty-index/`), matching the heading used on the overview page

2. **Tags for the blog post**
   - What we know: Tags drive the tag cloud on `/blog/` and tag pages at `/blog/tags/{tag}/`
   - What's unclear: Whether to create new tags or reuse existing ones
   - Recommendation: Use new purpose-specific tags like `programming-languages`, `beauty-index`, `software-aesthetics`. These create new tag pages which improves SEO surface area.

3. **Blog post length and depth**
   - What we know: Success criteria says "full-length blog post" with "methodology explanation, scoring rubric, and editorial commentary"
   - What's unclear: Target word count
   - Recommendation: Aim for 1,500-2,500 words. Long enough for SEO value and substance, short enough to remain readable. The existing observability post is ~1,200 words of prose.

4. **Cover image for the blog post**
   - What we know: `coverImage` field is optional in the schema. When present, the OG image uses a cover-image layout; when absent, it uses the text-only two-column layout.
   - What's unclear: Whether to create a custom cover image
   - Recommendation: Omit cover image for now. The text-based OG layout works well and avoids needing to create a custom graphic. The title "The Beauty Index" is descriptive enough.

## Sources

### Primary (HIGH confidence)

- **Codebase inspection** -- All findings verified by reading actual source files:
  - `src/content.config.ts` -- blog collection schema and loader config
  - `src/pages/blog/[slug].astro` -- blog post rendering pipeline
  - `src/pages/blog/[...page].astro` -- blog listing with filtering
  - `src/data/blog/building-kubernetes-observability-stack.mdx` -- existing MDX blog post pattern
  - `src/data/blog/ext-ollama-kubernetes-deployment.md` -- external blog post pattern
  - `src/pages/beauty-index/index.astro` -- overview page structure
  - `src/pages/beauty-index/[slug].astro` -- language detail page structure
  - `src/pages/beauty-index/code/index.astro` -- code comparison page structure
  - `src/lib/beauty-index/dimensions.ts` -- 6 dimension definitions
  - `src/lib/beauty-index/tiers.ts` -- 4 tier definitions with score boundaries
  - `src/data/beauty-index/languages.json` -- all 25 languages with scores
  - `src/pages/open-graph/[...slug].png.ts` -- auto OG image generation
  - `src/components/BlogPostingJsonLd.astro` -- structured data
  - `src/components/blog/*.astro` -- 7 blog MDX components
  - `astro.config.mjs` -- MDX integration, Expressive Code config

### Secondary (MEDIUM confidence)

- None needed -- all findings verified from codebase source files directly.

### Tertiary (LOW confidence)

- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all tools already installed and proven in codebase
- Architecture: HIGH -- patterns verified from existing blog post and Beauty Index pages
- Pitfalls: HIGH -- derived from actual codebase conventions and known Astro MDX behavior

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (stable -- no external dependencies or fast-moving libraries)
