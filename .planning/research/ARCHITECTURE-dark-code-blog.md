# Architecture Research

**Domain:** Standalone long-form blog post integration into existing Astro 5 portfolio site
**Researched:** 2026-04-14
**Confidence:** HIGH

## System Overview

A new blog post flows through the existing site architecture without requiring any new infrastructure. The "Dark Code" post is a standalone MDX file that plugs into 7 pre-built pipelines, each of which activates automatically at build time based on content collection membership.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  NEW FILE (1 file to create)                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  src/data/blog/dark-code.mdx                                   │   │
│  │  (frontmatter + MDX content)                                   │   │
│  └────────────────────────┬────────────────────────────────────────┘   │
├───────────────────────────┼───────────────────────────────────────────┤
│  BUILD PIPELINES (all automatic, zero config)                         │
│                           │                                           │
│  ┌────────────┐  ┌────────┴───────┐  ┌──────────────┐  ┌──────────┐  │
│  │ Content    │  │ Page           │  │ OG Image     │  │ Sitemap  │  │
│  │ Collection │→ │ Generation     │  │ Generation   │  │ Entry    │  │
│  │ (Zod)     │  │ [slug].astro   │  │ [...slug]    │  │ (auto)   │  │
│  └────────────┘  └────────────────┘  │ .png.ts      │  └──────────┘  │
│                                      └──────────────┘                 │
│  ┌────────────┐  ┌────────────────┐  ┌──────────────┐                 │
│  │ RSS Feed   │  │ Blog Listing   │  │ Related      │                 │
│  │ rss.xml.ts │  │ [...page]      │  │ Posts (tag   │                 │
│  │ (auto)     │  │ .astro (auto)  │  │ overlap)     │                 │
│  └────────────┘  └────────────────┘  └──────────────┘                 │
├───────────────────────────────────────────────────────────────────────┤
│  MANUAL UPDATE (1 file to modify)                                     │
│  ┌────────────────┐                                                   │
│  │ [slug].astro   │                                                   │
│  │ (articleSection│                                                   │
│  │  + FAQ JSON-LD)│                                                   │
│  └────────────────┘                                                   │
└───────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Content Collection | Validates frontmatter against Zod schema, provides typed data | `src/content.config.ts` |
| Blog Post Page | Renders MDX, injects JSON-LD, computes related posts, adds ToC | `src/pages/blog/[slug].astro` |
| Blog Listing Page | Paginates all non-draft posts, year-groups, tag cloud | `src/pages/blog/[...page].astro` |
| OG Image Generator | Creates 1200x630 PNG from title/description/tags | `src/pages/open-graph/[...slug].png.ts` |
| RSS Feed | Lists all non-draft posts with pubDate and description | `src/pages/rss.xml.ts` |
| Sitemap | Auto-includes all pages; `serialize()` maps blog URLs to real dates | `astro.config.mjs` |
| LLMs.txt | Dynamically lists all blog posts from collection query | `src/pages/llms.txt.ts` |
| LLMs-full.txt | Extended version, also dynamic | `src/pages/llms-full.txt.ts` |
| Layout | Base HTML shell with head, nav, footer, SEO meta | `src/layouts/Layout.astro` |
| BlogPostingJsonLd | Schema.org Article structured data | `src/components/BlogPostingJsonLd.astro` |
| FAQPageJsonLd | Schema.org FAQ structured data (optional per-post) | `src/components/FAQPageJsonLd.astro` |
| TableOfContents | Auto-generated from MDX headings | `src/components/TableOfContents.astro` |
| Reading Time | remark plugin computes from content length | `remark-reading-time.mjs` |

## Recommended Project Structure

### Files to CREATE (1-2 files)

```
src/data/blog/
└── dark-code.mdx              # The blog post (frontmatter + MDX content)

public/images/                  # Optional
└── dark-code-cover.svg         # Cover image (referenced in frontmatter coverImage)
```

### Files to MODIFY (1 file)

```
src/pages/blog/
└── [slug].astro               # Add isDarkCodePost boolean, articleSection,
                               # optional aboutDataset, optional FAQ JSON-LD
```

### Files that need NO changes (auto-integrate)

```
src/content.config.ts          # Blog collection glob('**/*.{md,mdx}') auto-discovers
src/pages/blog/[...page].astro # Listing page queries collection dynamically
src/pages/blog/tags/[tag].astro # Tag pages query collection dynamically
src/pages/rss.xml.ts           # RSS iterates all non-draft posts
src/pages/llms.txt.ts          # Blog section iterates all non-draft posts
src/pages/llms-full.txt.ts     # Same, extended content
src/pages/open-graph/[...slug].png.ts  # OG image generated from collection
astro.config.mjs               # Sitemap buildContentDateMap() reads frontmatter dates
src/integrations/indexnow.ts   # Submits all built URLs on CI
remark-reading-time.mjs        # Computes reading time automatically
src/components/TableOfContents.astro  # Generated from headings
src/components/BlogPostingJsonLd.astro # Injected by [slug].astro
src/components/BreadcrumbJsonLd.astro  # Injected by [slug].astro
```

### Structure Rationale

- **src/data/blog/dark-code.mdx:** The blog collection uses `glob({ pattern: '**/*.{md,mdx}', base: './src/data/blog' })`. Dropping a new MDX file here automatically registers it. The filename (minus extension) becomes the slug and URL path: `/blog/dark-code/`.
- **public/images/dark-code-cover.svg:** Cover images are served as static assets. Convention is `{slug}-cover.svg` (e.g., `death-by-a-thousand-arrows-cover.svg`, `claude-code-guide-refresh-cover.svg`). Referenced via `coverImage: "/images/dark-code-cover.svg"` in frontmatter.
- **[slug].astro is the only manual edit:** It contains per-post `articleSection`, `aboutDataset`, and FAQ JSON-LD definitions via boolean checks. 7 posts already have special handling. The Dark Code post needs its own entry for SEO enrichment.

## Architectural Patterns

### Pattern 1: Content Collection Auto-Discovery

**What:** Astro's content collection with glob loader automatically discovers any new `.mdx` file placed in `src/data/blog/`. The Zod schema validates frontmatter at build time. No registration, no imports, no config changes.

**When to use:** Always -- this is the only pattern for blog posts.

**Trade-offs:** Extremely low friction; build errors from invalid frontmatter surface at build time, not in editor.

**The Zod schema (from `content.config.ts`):**
```typescript
z.object({
  title: z.string(),
  description: z.string(),
  publishedDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  coverImage: z.string().optional(),
  externalUrl: z.string().url().optional(),  // not used for native posts
  source: z.enum(['Kubert AI', 'Translucent Computing']).optional(),  // not used for native posts
})
```

### Pattern 2: MDX Component Imports for Rich Content

**What:** Blog posts import reusable Astro components for structured content blocks. All imports use relative paths from the MDX file location (`../../components/blog/`).

**When to use:** For structured content beyond plain Markdown -- summaries, callouts, key takeaways, figures.

**Available components (8 total, all pre-built):**

| Component | Purpose | Props |
|-----------|---------|-------|
| `TldrSummary` | Bullet-point summary box at top of post | `title?: string` (default: "TL;DR") |
| `KeyTakeaway` | Highlighted insight with accent border | `title?: string` (default: "Key Takeaway") |
| `Callout` | Info/warning/tip/important callout | `type?: 'info'\|'warning'\|'tip'\|'important'`, `title?: string` |
| `OpeningStatement` | Centered, bordered statement | (slot only) |
| `Lede` | Styled intro paragraph with accent left border | (slot only) |
| `Figure` | Image with caption, lazy loading, border | `src`, `alt`, `caption?` |
| `ToolCard` | Linked card for external tools | `name`, `url`, `description`, `pillar?` |
| `ToolGrid` | 2-column grid container for ToolCards | (slot only) |

**Usage example from existing posts:**
```mdx
import TldrSummary from '../../components/blog/TldrSummary.astro';
import KeyTakeaway from '../../components/blog/KeyTakeaway.astro';
import OpeningStatement from '../../components/blog/OpeningStatement.astro';

<OpeningStatement>Arrow functions are not easier to read or write.</OpeningStatement>

<TldrSummary>
- The `function` keyword **signals intent directly**
- Arrow functions trade **readability for brevity**
</TldrSummary>

<KeyTakeaway title="Hooks: 18 to 24 Events">
Important insight paragraph.
</KeyTakeaway>
```

### Pattern 3: Per-Post JSON-LD Enrichment

**What:** The `[slug].astro` page template contains per-post boolean checks that control `articleSection` (categorizes the article in Schema.org), `aboutDataset` (links to a related tool/resource), and FAQ JSON-LD (enriches search snippets with Q&A pairs).

**When to use:** Every native blog post should have at least `articleSection`. FAQ JSON-LD is optional but highly valuable for SEO.

**Current pattern (7 posts already enriched):**
```typescript
// In [slug].astro
const isDarkCodePost = post.id === 'dark-code';

const articleSection = isDarkCodePost ? 'Software Engineering'
  : isBeautyIndexPost ? 'Programming Languages'
  : /* ...existing checks... */ undefined;

// For standalone posts with no companion tool:
const aboutDataset = isDarkCodePost ? undefined
  : /* ...existing checks... */ undefined;

// FAQ JSON-LD (optional, add if the post naturally answers questions):
const darkCodeFAQ = isDarkCodePost ? [
  {
    question: 'What is dark code?',
    answer: 'Concise answer...',
  },
  // ...more Q&A pairs
] : [];
```

**Trade-offs:** The boolean pattern is growing (7 entries) but works. Moving to frontmatter-based enrichment would be cleaner long-term but is a refactor, not needed for this milestone.

### Pattern 4: Tag Strategy for Cross-Linking

**What:** Tags in frontmatter drive three systems: tag cloud on blog listing, tag filter pages, and related posts computation. The related posts algorithm counts tag overlap between the current post and all others, sorts by overlap count then date, and shows the top 5.

**When to use:** Choose tags deliberately to influence which posts appear as "Related Articles."

**Tag design for Dark Code:**
- Tags should overlap with `death-by-a-thousand-arrows` (`["javascript", "programming-languages", "code-quality", "software-aesthetics"]`) since it is thematically related
- Tags should also connect to `the-beauty-index` (`["programming-languages", ...]`) for cross-pollination
- Avoid tags that only appear on unrelated posts (e.g., `"kubernetes"`) as that would dilute related post relevance

## Data Flow

### Build-Time Data Flow for a New Blog Post

```
dark-code.mdx (frontmatter + MDX content)
    │
    ├──→ content.config.ts (Zod validation at build time)
    │        │
    │        ├──→ [slug].astro (getStaticPaths → static HTML page)
    │        │        ├──→ Layout.astro (head, nav, footer, SEO meta)
    │        │        ├──→ render() → Content component + headings + remarkPluginFrontmatter
    │        │        ├──→ TableOfContents.astro (auto from headings, depth 2-3)
    │        │        ├──→ BlogPostingJsonLd.astro (Schema.org Article)
    │        │        ├──→ BreadcrumbJsonLd.astro (Home > Blog > Title)
    │        │        ├──→ FAQPageJsonLd.astro (optional, per-post)
    │        │        └──→ Related Posts (top 5 by tag overlap, then by date)
    │        │
    │        ├──→ [...page].astro (blog listing: year-grouped, paginated by 10)
    │        │
    │        ├──→ tags/[tag].astro (tag page for each tag in frontmatter)
    │        │
    │        ├──→ rss.xml.ts (RSS entry: title, pubDate, description, link)
    │        │
    │        ├──→ llms.txt.ts (blog section entry: title + description + URL)
    │        │
    │        └──→ llms-full.txt.ts (extended entry)
    │
    ├──→ open-graph/[...slug].png.ts
    │        └──→ generateOgImage(title, description, tags, coverImage) → satori → sharp → PNG
    │             Output: /open-graph/blog/dark-code.png (1200x630)
    │
    └──→ astro.config.mjs buildContentDateMap()
             └──→ DATE_RE regex extracts publishedDate from raw file
                  └──→ Map entry: "https://patrykgolabek.dev/blog/dark-code/" → ISO date
                       └──→ sitemap serialize() sets item.lastmod, changefreq: 'monthly', priority: 0.7
```

### Key Data Flows

1. **Content date to sitemap:** `buildContentDateMap()` in `astro.config.mjs` reads raw file content with regex `DATE_RE` at config load time (before Astro's content layer initializes). It prefers `updatedDate` over `publishedDate`. The sitemap `serialize()` function looks up the URL in this map to set `lastmod`. No configuration needed -- the function scans all files in `src/data/blog/` automatically.

2. **Tag overlap to related posts:** In `[slug].astro`, all posts are loaded via `getCollection('blog')`. For each other post, tag overlap is counted. Posts are sorted by overlap count descending, then by date descending. Top 5 are displayed in the "Related Articles" sidebar. Tags chosen for Dark Code directly control which posts appear as related.

3. **OG image pipeline:** `[...slug].png.ts` calls `getCollection('blog')` filtering for non-draft, non-external posts. Each post maps to `params: { slug: 'blog/' + post.id }`. The `generateOgImage()` function in `src/lib/og-image.ts` (3,879 lines) uses Satori to render an SVG layout and Sharp to convert to PNG. The URL `ogImageURL` is constructed in `[slug].astro` as `/open-graph/blog/${post.id}.png?cb=20260216`.

4. **Reading time:** The `remarkReadingTime` remark plugin runs during MDX rendering. It computes word count and reading time, exposing them via `remarkPluginFrontmatter.minutesRead` and `remarkPluginFrontmatter.words`. Both are used in the page template.

## Anti-Patterns

### Anti-Pattern 1: External Data Files for Single-Use Data

**What people do:** Create `src/data/dark-code/statistics.json` or `src/data/dark-code/languages.ts` for data only consumed by the blog post.

**Why it's wrong:** Adds indirection, requires imports and type declarations, creates maintenance burden. The site's external data files (languages.json, models.json, techniques.json, nodes.json) all serve multiple pages and dynamic routes. A blog post essay is not a data-driven feature.

**Do this instead:** Use inline Markdown tables, fenced code blocks with expressive-code titles, and MDX component slots for all post-specific data. For statistics, Markdown tables render natively in prose.

### Anti-Pattern 2: Creating New Blog Components for One Post

**What people do:** Build `<DarkCodeComparison />` or `<SyntaxTimeline />` for visuals that appear once.

**Why it's wrong:** The site has 8 blog components covering common patterns. One-off components fragment the component library. If the visual truly needs a custom component, it should be designed to be reusable across future posts.

**Do this instead:** Compose existing components: `<Figure>` for SVG diagrams, `<KeyTakeaway>` for highlighted insights, `<TldrSummary>` for bullet summaries, `<Callout>` for warnings/tips, and Markdown tables for data comparisons. If a new component is truly needed, design it generically (e.g., `<ComparisonTable>` not `<DarkCodeTable>`).

### Anti-Pattern 3: Forgetting [slug].astro Updates

**What people do:** Create the MDX file and assume everything is done.

**Why it's wrong:** The post renders fine but lacks `articleSection` in JSON-LD, has no FAQ structured data, and the SEO-shortened title may not be optimal. These are invisible to visual review but affect search engine understanding.

**Do this instead:** Always add the post's `isDarkCodePost` boolean check in `[slug].astro` with appropriate `articleSection`. Evaluate whether FAQ JSON-LD adds value (it does if the post naturally answers common questions). Check that the title + suffix fits within 65 characters for the `<title>` tag.

### Anti-Pattern 4: Using `draft: true` in Final Commits

**What people do:** Develop with `draft: true` and forget to flip it.

**Why it's wrong:** The production filter is `import.meta.env.PROD ? data.draft !== true : true`. Draft posts are excluded from all production outputs: page generation, blog listing, RSS, LLMs.txt, OG images, and sitemap.

**Do this instead:** Set `draft: false` in the final commit. Include a verification step that checks the production build output page count and confirms the post URL is accessible.

## Integration Points

### Automatic Integrations (Zero Config Required)

| Integration | Mechanism | File |
|-------------|-----------|------|
| Blog listing page | `getCollection('blog')` query in `getStaticPaths` | `src/pages/blog/[...page].astro` |
| Individual post page | `getCollection('blog')` + filter non-external | `src/pages/blog/[slug].astro` |
| Tag pages | Tag values from frontmatter | `src/pages/blog/tags/[tag].astro` |
| RSS feed | `getCollection('blog')` with draft filter | `src/pages/rss.xml.ts` |
| LLMs.txt | `getCollection('blog')` with draft filter | `src/pages/llms.txt.ts` |
| LLMs-full.txt | Same | `src/pages/llms-full.txt.ts` |
| OG image | `getCollection('blog')` maps to PNG endpoints | `src/pages/open-graph/[...slug].png.ts` |
| Sitemap lastmod | `buildContentDateMap()` reads raw frontmatter | `astro.config.mjs` |
| Sitemap priority | URL pattern matching in `serialize()` | `astro.config.mjs` (blog = 0.7, monthly) |
| IndexNow submission | All built URLs submitted on CI | `src/integrations/indexnow.ts` |
| Reading time | remarkReadingTime plugin | `remark-reading-time.mjs` |
| Table of contents | Heading extraction from rendered MDX | `src/components/TableOfContents.astro` |
| Related posts | Tag overlap algorithm | `src/pages/blog/[slug].astro` |
| Breadcrumb JSON-LD | Home > Blog > Title | `src/components/BreadcrumbJsonLd.astro` |
| BlogPosting JSON-LD | Schema.org Article structured data | `src/components/BlogPostingJsonLd.astro` |
| Image lightbox | All `article figure img` and `.prose img` elements | Script in `[slug].astro` |
| GSAP heading animations | All `.prose h2` elements | Script in `[slug].astro` |
| Back to top button | Scroll-triggered visibility | Script in `[slug].astro` |
| TOC active indicator | IntersectionObserver on heading targets | Script in `[slug].astro` |

### Manual Integrations (Code Changes Required)

| Integration | What to Change | File |
|-------------|---------------|------|
| Article section JSON-LD | Add `isDarkCodePost` boolean + `articleSection` value | `src/pages/blog/[slug].astro` |
| FAQ JSON-LD (optional) | Add FAQ array for key questions/answers from the post | `src/pages/blog/[slug].astro` |
| Cover image (optional) | Create SVG in `public/images/`, reference in frontmatter | `public/images/dark-code-cover.svg` |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| MDX content to Page template | `render()` returns `Content`, `headings`, `remarkPluginFrontmatter` | Content rendered as component; headings feed ToC |
| Blog collection to All consumers | `getCollection('blog')` with filter | Same query pattern in 6+ files |
| Frontmatter to Sitemap | Regex parsing at config load time | Uses `DATE_RE` on raw file, not Zod-parsed data |
| Post tags to Related posts | Tag overlap count in `[slug].astro` | Tags influence discoverability; choose carefully |
| Cover image to OG image | `coverImage` frontmatter field passed to `generateOgImage()` | Optional; generates branded image if omitted |

## Build Order

Build order accounts for dependencies on existing infrastructure.

### Phase 1: Content Creation (no code dependencies)
1. Write `src/data/blog/dark-code.mdx` with valid frontmatter and full MDX content
2. Optionally create `public/images/dark-code-cover.svg`
3. Use `draft: true` during development if iterating

### Phase 2: Template Integration (depends on Phase 1 being structurally complete)
4. Update `src/pages/blog/[slug].astro`:
   - Add `isDarkCodePost` boolean check
   - Add `articleSection` (e.g., `'Software Engineering'`)
   - Optionally add FAQ JSON-LD array
5. Set `draft: false` in frontmatter

### Phase 3: Build Verification (depends on Phases 1-2)
6. Run `npm run build` and verify:
   - Post page renders at `/blog/dark-code/`
   - Blog listing includes the post in correct year group
   - Tag pages exist for each tag
   - OG image generates at `/open-graph/blog/dark-code.png`
   - RSS feed includes the post
   - Sitemap includes URL with correct `lastmod`
   - LLMs.txt includes the post in Blog Posts section
   - JSON-LD structured data is valid (BlogPosting + Breadcrumb + optional FAQ)
   - Title tag fits within 65 characters
   - Related posts section shows relevant posts
   - Reading time displays correctly

No new infrastructure, no new components, no new collections, no config changes. The existing architecture handles everything through auto-discovery.

## Sources

- `src/content.config.ts` lines 9-22 -- blog collection Zod schema
- `src/pages/blog/[slug].astro` -- full page template with JSON-LD enrichment (362 lines)
- `src/pages/blog/[...page].astro` -- blog listing with pagination (200 lines)
- `src/pages/open-graph/[...slug].png.ts` -- OG image generation from collection
- `src/pages/rss.xml.ts` -- RSS feed from collection
- `src/pages/llms.txt.ts` -- LLMs.txt dynamic blog section
- `astro.config.mjs` -- sitemap serialize() and buildContentDateMap()
- `src/components/blog/*.astro` -- 8 reusable blog components
- `src/components/BlogPostingJsonLd.astro` -- Article structured data
- `src/data/blog/death-by-a-thousand-arrows.mdx` -- standalone post pattern reference
- `src/data/blog/claude-code-guide-refresh.mdx` -- companion post pattern reference
- 14 existing native blog posts for pattern verification

---
*Architecture research for: Dark Code blog post integration*
*Researched: 2026-04-14*
