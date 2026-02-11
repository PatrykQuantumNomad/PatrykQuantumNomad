# Phase 9: External Blog Integration - Research

**Researched:** 2026-02-11
**Domain:** Astro content collections, external blog post integration, RSS feed generation, static path filtering
**Confidence:** HIGH

## Summary

Phase 9 integrates 8-12 curated external blog posts from Kubert AI (mykubert.com) and Translucent Computing (translucentcomputing.com) into the existing blog system. The architecture leverages the schema extension completed in Phase 8 -- `externalUrl` and `source` fields are already in `content.config.ts`. Each external post is a frontmatter-only markdown file (no body content needed) in `src/data/blog/`. The existing `getCollection('blog')` call already returns them; the work is in (a) creating the content files, (b) modifying BlogCard to handle external links with source badges, (c) filtering external posts out of `[slug].astro` and OG image `getStaticPaths`, and (d) updating the RSS feed to use external URLs.

All required changes touch existing Astro patterns already proven in the codebase. No new dependencies are needed. The `@astrojs/rss` package (v4.0.15) natively supports absolute external URLs in the `link` field -- verified by reading the source code. The `isValidURL()` check in `@astrojs/rss/dist/index.js` (line 140) passes absolute URLs through unchanged, while relative paths get prepended with the site URL.

The `remarkReadingTime` plugin will execute on empty-body markdown files (the Astro bug that skipped remark plugins on empty files was fixed in PR #12920, merged Jan 7, 2025, and Astro 5.17.1 includes this fix). It will produce "0 min read" for external posts, but since external posts never render a detail page, the `minutesRead` value is never displayed.

**Primary recommendation:** Split into two plans: (1) Create external blog content files + filter them out of slug/OG generation, (2) Update BlogCard for external link behavior + update RSS feed.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | 5.17.1 (installed) | Content collections, getStaticPaths filtering, static output | Already installed, schema already extended for external posts |
| @astrojs/rss | 4.0.15 (installed) | RSS feed generation with external link support | Already installed, supports absolute URLs natively |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none new) | - | All work uses existing Astro + TypeScript | No new dependencies for this phase |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Frontmatter-only .md files | JSON data files in a separate collection | Markdown files maintain single-collection approach (decided in Phase 8). JSON would require a separate collection definition and merging logic |
| Filtering in getStaticPaths | Separate `external` collection | Single collection keeps sorting/filtering simple. The `externalUrl` field is the discriminator |
| Inline SVG external link icon | astro-icon package | 1 SVG icon does not justify a dependency (confirmed out-of-scope in REQUIREMENTS.md) |

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  data/
    blog/
      building-kubernetes-observability-stack.md  # EXISTING local post
      draft-placeholder.md                         # EXISTING draft (deleted in Phase 12)
      ext-ollama-kubernetes-deployment.md           # NEW external post stub
      ext-golden-paths-agentic-ai.md               # NEW external post stub
      ext-devops-handbook-ai-agents.md              # NEW external post stub
      ... (8-12 external post stubs total)
  components/
    BlogCard.astro       # MODIFY: handle external link + source badge + icon
  pages/
    blog/
      index.astro        # MINOR: no structural change (already renders all posts)
      [slug].astro        # MODIFY: filter external posts from getStaticPaths
    rss.xml.ts           # MODIFY: use externalUrl for external post links
    open-graph/
      [...slug].png.ts   # MODIFY: filter external posts from getStaticPaths
```

### Pattern 1: External Post Stub File
**What:** A markdown file with frontmatter only (no body), using the `externalUrl` and `source` fields to mark it as external.
**When to use:** For every curated external blog post.
**Example:**
```markdown
---
title: "Ollama Kubernetes Deployment: Cost-Effective and Secure"
description: "Deploy Ollama AI models in Kubernetes with scalable, secure, and cost-effective infrastructure using Terraform, GPU optimization, and security best practices."
publishedDate: 2024-09-06
tags: ["kubernetes", "ai", "ollama", "llm"]
draft: false
externalUrl: "https://mykubert.com/blog/ollama-kubernetes-deployment-cost-effective-and-secure/"
source: "Kubert AI"
---
```
No body content. The `---` closing fence is the end of the file.

### Pattern 2: getStaticPaths Guard (Slug Page)
**What:** Filter out posts with `externalUrl` from `getStaticPaths()` so no detail pages are generated.
**When to use:** In `[slug].astro` and `[...slug].png.ts` to prevent external posts from generating internal pages or OG images.
**Example:**
```typescript
// In [slug].astro getStaticPaths
export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => {
    // Exclude drafts in production AND exclude external posts always
    const isPublished = import.meta.env.PROD ? data.draft !== true : true;
    return isPublished && !data.externalUrl;
  });

  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}
```

### Pattern 3: BlogCard External Link Handling
**What:** BlogCard detects `externalUrl` and renders an external link instead of an internal `/blog/[slug]/` link.
**When to use:** In BlogCard.astro, conditionally based on `post.data.externalUrl`.
**Example:**
```astro
---
import type { CollectionEntry } from 'astro:content';

interface Props {
  post: CollectionEntry<'blog'>;
}

const { post } = Astro.props;
const { title, description, publishedDate, tags, externalUrl, source } = post.data;
const isExternal = !!externalUrl;
const href = isExternal ? externalUrl : `/blog/${post.id}/`;
---

<article class="group relative p-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] hover:border-[var(--color-accent)] transition-colors">
  <a
    href={href}
    class="absolute inset-0 z-0"
    aria-label={title}
    {...isExternal && { target: "_blank", rel: "noopener noreferrer" }}
  ></a>
  <div class="flex items-center gap-2">
    <time datetime={publishedDate.toISOString()} class="text-sm text-[var(--color-text-secondary)]">
      {publishedDate.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
    </time>
    {source && (
      <span class="text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
        on {source}
      </span>
    )}
    {isExternal && (
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-[var(--color-text-secondary)]" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fill-rule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5zm7.25-.75a.75.75 0 01.75-.75h3.5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0V6.31l-5.47 5.47a.75.75 0 01-1.06-1.06l5.47-5.47H12.25a.75.75 0 01-.75-.75z" clip-rule="evenodd" />
      </svg>
    )}
  </div>
  <h2 class="text-xl font-heading font-bold mt-2 group-hover:text-[var(--color-accent)] transition-colors">
    {title}
  </h2>
  <p class="mt-2 text-[var(--color-text-secondary)]">
    {description}
  </p>
  {tags.length > 0 && (
    <div class="flex flex-wrap gap-2 mt-4">
      {tags.map((tag) => (
        <a
          href={`/blog/tags/${tag}/`}
          class="relative z-10 text-xs px-2 py-1 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 transition-colors"
        >
          {tag}
        </a>
      ))}
    </div>
  )}
</article>
```

### Pattern 4: RSS Feed with External URLs
**What:** RSS items use the external URL as the `link` for external posts, and the local `/blog/[slug]/` URL for local posts.
**When to use:** In `rss.xml.ts`.
**Example:**
```typescript
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getCollection('blog', ({ data }) => {
    return import.meta.env.PROD ? data.draft !== true : true;
  });

  const sortedPosts = posts.sort(
    (a, b) => b.data.publishedDate.valueOf() - a.data.publishedDate.valueOf()
  );

  return rss({
    title: 'Patryk Golabek | Blog',
    description:
      'Articles on cloud-native architecture, Kubernetes, AI/ML, and platform engineering',
    site: context.site!,
    items: sortedPosts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.publishedDate,
      description: post.data.description,
      // External posts use their canonical URL; local posts use site-relative path
      link: post.data.externalUrl ?? `/blog/${post.id}/`,
    })),
  });
}
```

### Pattern 5: File Naming Convention for External Posts
**What:** External post files are prefixed with `ext-` to visually distinguish them from local content in the filesystem.
**When to use:** For all external blog post stub files.
**Why:** Makes it immediately obvious which files are stubs vs. full content. Does NOT affect slug generation since external posts never generate pages.

### Anti-Patterns to Avoid
- **Creating a separate content collection for external posts:** The decision was made in Phase 8 to use a single collection. A separate collection would require manual merging and sorting in the listing page.
- **Adding body content to external post stubs:** External posts should have NO markdown body. Any body content would be wasted (never rendered) and could confuse future maintainers.
- **Fetching external RSS feeds at build time:** Explicitly out of scope (REQUIREMENTS.md: "RSS feed loader adds build-time network dependency for quarterly publishing cadence"). External posts are manually curated .md files.
- **Generating any internal routes for external posts:** No `[slug].astro` page, no OG image, no JSON-LD for external posts. They exist only in the listing and RSS feed.
- **Using `target="_blank"` without `rel="noopener noreferrer"`:** Security requirement. Always pair them.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| RSS feed generation | Custom XML builder | `@astrojs/rss` with `link` property | Already handles URL canonicalization and XML escaping |
| Post sorting | Custom sort utility | Existing `sort()` on `publishedDate.valueOf()` | Already works for mixed local+external posts (both have `publishedDate`) |
| External link icon | Custom SVG component library | Inline SVG in BlogCard | Single icon does not justify a component or dependency |
| URL validation | Runtime URL checks | Schema-level `z.string().url()` on `externalUrl` | Build-time validation catches malformed URLs before deploy |

**Key insight:** The schema extension from Phase 8 makes external posts first-class collection entries. The getCollection API treats them identically to local posts for filtering and sorting. The only differences are in rendering (BlogCard) and route generation (getStaticPaths).

## Common Pitfalls

### Pitfall 1: Forgetting to Filter External Posts from BOTH getStaticPaths
**What goes wrong:** If you filter `[slug].astro` but forget `[...slug].png.ts`, Astro will try to generate OG images for external posts (which have no meaningful body content).
**Why it happens:** Two separate files both have `getStaticPaths` that fetch from the blog collection.
**How to avoid:** Apply the same `!data.externalUrl` filter to both `[slug].astro` and `[...slug].png.ts` in the same plan.
**Warning signs:** Build output includes `/open-graph/blog/ext-*.png` files.

### Pitfall 2: Tag Pages Linking to External Posts Incorrectly
**What goes wrong:** The `[tag].astro` page renders `BlogCard` for each post. If BlogCard is updated correctly, tag pages automatically work. But if BlogCard changes are incomplete, tag pages could link external posts to non-existent internal pages.
**Why it happens:** Tag pages use the same `BlogCard` component. This is actually a benefit -- fix BlogCard once and it works everywhere.
**How to avoid:** Ensure BlogCard handles the external case completely. Test tag pages as part of verification.
**Warning signs:** Clicking an external post from a tag page navigates to a 404.

### Pitfall 3: RSS Link Prepending Site URL to Already-Absolute URLs
**What goes wrong:** If the RSS `link` for external posts is already an absolute URL but the code wraps it in `new URL(link, site)`, the external URL gets mangled.
**Why it happens:** Misunderstanding how `@astrojs/rss` handles the `link` field.
**How to avoid:** Verified by source code inspection: `@astrojs/rss` checks `isValidURL(result.link)` first. If the link is already an absolute URL, it passes through unchanged. Simply provide the absolute external URL as the `link` value.
**Warning signs:** RSS feed shows `https://patrykgolabek.dev/https://mykubert.com/...` (doubled URL).

### Pitfall 4: External Post Dates Not Matching Source Blog
**What goes wrong:** If the `publishedDate` in the frontmatter doesn't match the actual publication date on the external blog, the chronological sort will be wrong and visitors may notice inconsistencies.
**Why it happens:** Dates must be manually entered from the external blog.
**How to avoid:** Verify each date against the external source. Use ISO date format (YYYY-MM-DD) which Zod's `z.coerce.date()` handles correctly.
**Warning signs:** Posts appear in unexpected order on the listing page.

### Pitfall 5: Missing Tags or Inconsistent Tag Naming
**What goes wrong:** External posts with tags that don't match the local post tag format (e.g., "Kubernetes" vs "kubernetes", "AI/ML" vs "ai") will create duplicate tag pages.
**Why it happens:** Tags are case-sensitive strings. External blogs use different taxonomies.
**How to avoid:** Normalize all tags to lowercase, hyphenated format matching the existing post (e.g., "kubernetes", "ai", "cloud-native", "devops").
**Warning signs:** Tag pages like `/blog/tags/Kubernetes/` and `/blog/tags/kubernetes/` both exist.

### Pitfall 6: Empty Body Markdown and remarkReadingTime
**What goes wrong:** The `remarkReadingTime` plugin runs on all markdown files, including external post stubs with no body. It produces "0 min read".
**Why it happens:** The plugin calculates reading time from the markdown AST, which is empty for frontmatter-only files.
**How to avoid:** This is not actually a problem because external posts never render their detail page (where `minutesRead` is displayed). The `remarkPluginFrontmatter.minutesRead` value exists but is never accessed.
**Warning signs:** None -- this is a non-issue. No code change needed.

## Code Examples

### External Post Frontmatter Template
```markdown
---
title: "[Exact title from external blog]"
description: "[1-2 sentence description]"
publishedDate: YYYY-MM-DD
tags: ["tag1", "tag2"]
draft: false
externalUrl: "https://[domain]/blog/[slug]/"
source: "Kubert AI"
---
```

### Conditional Spread for target/rel Attributes
```astro
{/* Astro supports conditional spread for HTML attributes */}
<a
  href={href}
  {...isExternal && { target: "_blank", rel: "noopener noreferrer" }}
>
```
This pattern uses the short-circuit evaluation: if `isExternal` is false, the spread receives `false` which Astro ignores. If true, it spreads the object with `target` and `rel`.

### Checking isExternal in Template Logic
```typescript
// In BlogCard frontmatter
const isExternal = !!post.data.externalUrl;
const href = isExternal ? post.data.externalUrl : `/blog/${post.id}/`;
```
The double-bang coerces `string | undefined` to `boolean`. TypeScript narrows `externalUrl` to `string` after the truthy check.

## Curated External Blog Posts

Research identified the following posts suitable for curation. The goal is 8-12 posts total, prioritizing technical relevance to Patryk's professional brand (Kubernetes, AI/ML, DevOps, platform engineering).

### Kubert AI (mykubert.com) - Recommended 6 Posts

| # | Title | Date | Tags | Relevance |
|---|-------|------|------|-----------|
| 1 | Ollama Kubernetes Deployment: Cost-Effective and Secure | 2024-09-06 | kubernetes, ai, ollama, llm | Core brand: K8s + AI intersection |
| 2 | Introducing Open Source Kubernetes AI Assistant | 2024-08-22 | kubernetes, ai, open-source | Flagship Kubert product launch |
| 3 | Building a Custom AI Agent for SQL Server: DevOps Practices | 2024-08-28 | ai, devops, kubernetes, cloud-native | Core brand: AI agents + DevOps |
| 4 | Red Teaming LLMs to AI Agents: Beyond One-shot Prompts | 2024-09-26 | ai, llm, security | AI security expertise |
| 5 | From Golden Paths to Agentic AI: A New Era of Kubernetes Management | 2025-01-16 | kubernetes, ai, platform-engineering | Core brand: K8s + AI future |
| 6 | DevOps Handbook with AI Agents | 2024-11-05 | ai, devops, kubernetes, platform-engineering | Core brand: DevOps + AI agents |

### Translucent Computing (translucentcomputing.com) - Recommended 4 Posts

| # | Title | Date | Tags | Relevance |
|---|-------|------|------|-----------|
| 7 | What is Kubernetes, and Why are My Cloud Costs So High?! -- Part 1 | 2025-03-20 | kubernetes, cloud-native | Core brand: K8s cost management |
| 8 | Apache Airflow -- Data Pipeline | 2025-03-22 | data-engineering, cloud-native | Data pipeline expertise |
| 9 | Cloud Composer -- Terraform Deployment | 2021-12-10 | cloud-native, devops, terraform | DevSecOps + IaC expertise |
| 10 | Kubernetes, Elasticsearch, Python Importer | 2019-05-11 | kubernetes, python, data-engineering | Early K8s + data expertise |

**Total: 10 posts** (6 Kubert AI + 4 Translucent Computing). Falls within the 8-12 target range. All selected posts are authored by or closely associated with Patryk Golabek and align with the target brand (Kubernetes architect, AI/ML engineer, platform builder).

### File Names for External Posts
```
ext-ollama-kubernetes-deployment.md
ext-open-source-kubernetes-ai-assistant.md
ext-custom-ai-agent-sql-server.md
ext-red-teaming-llms-ai-agents.md
ext-golden-paths-agentic-ai.md
ext-devops-handbook-ai-agents.md
ext-kubernetes-cloud-costs.md
ext-apache-airflow-data-pipeline.md
ext-cloud-composer-terraform.md
ext-kubernetes-elasticsearch-python.md
```

### Important Note on Content Verification
The STATE.md notes: "External post titles/descriptions need verification against actual external blog posts during Phase 9." The titles and dates above were verified by fetching the actual blog pages during this research. Descriptions should be verified during execution but the titles and dates are confirmed accurate.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate data source for external links | Single content collection with schema discriminator | Astro 5 Content Layer API (Dec 2024) | Simpler -- one `getCollection('blog')` returns everything |
| Remark plugins skipped on empty markdown | Remark/rehype plugins process empty files | Astro 5.x, PR #12920 (Jan 2025) | External stubs safe with remarkReadingTime |
| RSS items only for local content | RSS items can use absolute external URLs via `link` | @astrojs/rss v4.x | `isValidURL()` check preserves external URLs |

**Deprecated/outdated:**
- None for this phase. All patterns use current Astro 5 APIs.

## Open Questions

1. **Should the blog listing page show a count or label for external vs local posts?**
   - What we know: Requirements only specify source badge on individual cards, not a section-level label.
   - What's unclear: Whether "10 external + 1 local" imbalance looks odd without context.
   - Recommendation: No section label needed. The source badges on individual cards provide sufficient context. A filtering UI is explicitly deferred to v1.2+ (BLOG-08).

2. **Should external posts appear on tag pages?**
   - What we know: The `[tag].astro` page uses `getCollection('blog')` and renders BlogCard. External posts with matching tags will naturally appear.
   - What's unclear: Whether this is desired behavior.
   - Recommendation: Yes, include them. Tag pages use the same BlogCard component, so external posts will render correctly with source badges and external links. This enriches the tag pages with more content, which is good for SEO.

3. **What if an external blog URL changes or goes down?**
   - What we know: External URLs are hardcoded in frontmatter. There's no link-checking at build time.
   - What's unclear: Whether link rot is a concern for 10 curated posts.
   - Recommendation: Not in scope for Phase 9. A future CI step could check external links, but the curated nature (10 posts from the owner's own blogs) makes this low risk. Document as a potential v1.2+ enhancement.

## Sources

### Primary (HIGH confidence)
- **Codebase inspection** - `src/content.config.ts`, `src/pages/blog/[slug].astro`, `src/pages/rss.xml.ts`, `src/pages/open-graph/[...slug].png.ts`, `src/components/BlogCard.astro`, `src/pages/blog/tags/[tag].astro`
- **@astrojs/rss source code** - `node_modules/@astrojs/rss/dist/index.js` (line 140: `isValidURL` check confirms external URLs pass through unchanged)
- **@astrojs/rss schema** - `node_modules/@astrojs/rss/dist/schema.js` (link field is `z.string().optional()`)
- **Astro version** - 5.17.1 installed (includes PR #12920 fix for empty-body markdown remark processing)
- [Astro Content Collections Guide](https://docs.astro.build/en/guides/content-collections/) - getCollection filter API
- [Astro RSS Recipe](https://docs.astro.build/en/recipes/rss/) - RSS feed item properties

### Secondary (MEDIUM confidence)
- [Kubert AI Blog Sitemap](https://mykubert.com/post-sitemap.xml) - Full post URL list with dates
- [Translucent Computing Blog Sitemap](https://translucentcomputing.com/post-sitemap.xml) - Full post URL list with dates
- Individual blog post pages fetched for title/date/tag verification

### Tertiary (LOW confidence)
- None. All findings verified against source code or official documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new libraries, all changes use existing Astro built-ins verified by source code inspection
- Architecture: HIGH - Single-collection pattern was a locked decision from Phase 8, all code patterns verified against existing codebase
- Pitfalls: HIGH - Each pitfall identified from direct codebase analysis and @astrojs/rss source code reading
- Content curation: MEDIUM - Titles and dates verified against live blog pages, but descriptions may need minor adjustments during execution

**Research date:** 2026-02-11
**Valid until:** 2026-04-11 (stable domain -- Astro 5 APIs stable, no fast-moving dependencies)
