# Phase 25: Content & Rule Documentation - Research

**Researched:** 2026-02-20
**Domain:** Astro static content generation, SEO documentation pages, blog content authoring
**Confidence:** HIGH

## Summary

Phase 25 creates 39 rule documentation pages and 1 companion blog post, generating ~41 new indexable URLs (39 rules + 1 blog post + the existing tool page already exists). The technical approach is straightforward: Astro's `getStaticPaths` dynamic routing generates rule pages from the existing TypeScript rule registry, while a new MDX blog post follows the established content collection pattern.

The core challenge is not technical but structural: each rule page must be a standalone, SEO-valuable documentation page (not a thin wrapper around existing data), while 39 pages must maintain consistency. The approach should use a single Astro dynamic route template (`[code].astro`) that reads rule metadata from the TypeScript registry at build time, avoiding data duplication. The blog post is a standard MDX file in the existing content collection.

**Primary recommendation:** Use a single `src/pages/tools/dockerfile-analyzer/rules/[code].astro` dynamic route that imports from `allRules` at build time. Do NOT create a separate content collection for rules -- the TypeScript rule objects already contain all needed data (id, title, severity, category, explanation, fix with before/after code). Related rules are derived by same-category membership. The blog post is a standard MDX file at `src/data/blog/dockerfile-best-practices.mdx`.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BLOG-01 | Companion blog post covering Dockerfile best practices and tool architecture deep-dive | Standard MDX blog post in `src/data/blog/`, using existing content collection schema and blog components (TldrSummary, Callout, KeyTakeaway, Figure). Expressive Code fenced blocks for Dockerfile examples. |
| BLOG-02 | Cross-links between blog post and tool page (bidirectional) | Blog post links to `/tools/dockerfile-analyzer/` and 5+ rule pages. Tool page `index.astro` adds a "Read the blog post" link. Rule pages link back to both. |
| DOCS-01 | 39 rule documentation pages at /tools/dockerfile-analyzer/rules/[code] | Single dynamic route `[code].astro` using `getStaticPaths` over `allRules` array. 39 actual rules (not 40 -- verified count from codebase). |
| DOCS-02 | Each rule page includes: explanation, fix suggestion, before/after code, related rules | All data exists in LintRule interface (explanation, fix.description, fix.beforeCode, fix.afterCode). Related rules derived from same category. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | 5.3.0 | Static site generator, dynamic routes, content collections | Already in use; `getStaticPaths` generates pages from data at build time |
| @astrojs/mdx | 4.3.13 | MDX blog post support | Already in use for existing blog posts |
| astro-expressive-code | 0.41.6 | Syntax-highlighted code blocks in MDX and Astro | Already in use; renders Dockerfile code fences with title/lang support |
| @tailwindcss/typography | 0.5.19 | Prose styling for content pages | Already in use for blog posts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| satori + sharp | 0.19.2 + 0.34.5 | OG image generation | Generate OG images for rule pages (optional -- could reuse blog OG) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dynamic route from TS data | Content collection for rules | Unnecessary -- rule data already exists in TS; adding a content collection would duplicate it |
| MDX for each rule page | Single Astro template | 39 MDX files would create massive maintenance burden; template approach is correct |
| Markdown rule docs | Astro template rendering TS data | Would need to sync markdown files with TS rule definitions; fragile |

**Installation:**
No new packages needed. All dependencies already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── pages/
│   └── tools/
│       └── dockerfile-analyzer/
│           ├── index.astro            # Existing tool page (add blog link)
│           └── rules/
│               └── [code].astro       # NEW: dynamic route for 39 rule pages
├── data/
│   └── blog/
│       └── dockerfile-best-practices.mdx  # NEW: companion blog post
├── lib/
│   └── tools/
│       └── dockerfile-analyzer/
│           └── rules/
│               ├── index.ts           # Existing: allRules array, getRuleById()
│               ├── related.ts         # NEW: getRelatedRules() utility
│               └── [category]/*.ts    # Existing: 39 rule definitions
├── components/
│   └── BlogPostingJsonLd.astro        # Existing: reuse for blog post
│   └── BreadcrumbJsonLd.astro         # Existing: reuse for rule pages
└── pages/
    └── open-graph/
        └── [...slug].png.ts           # Existing: extend for rule page OG images
```

### Pattern 1: Dynamic Route from TypeScript Data
**What:** A single `[code].astro` file generates 39 static pages at build time by iterating over the `allRules` array.
**When to use:** When page data already exists in TypeScript (as it does here with LintRule objects).
**Example:**
```typescript
// src/pages/tools/dockerfile-analyzer/rules/[code].astro
---
import { allRules } from '../../../../lib/tools/dockerfile-analyzer/rules/index';
import { getRelatedRules } from '../../../../lib/tools/dockerfile-analyzer/rules/related';
import Layout from '../../../../layouts/Layout.astro';
import BreadcrumbJsonLd from '../../../../components/BreadcrumbJsonLd.astro';

export function getStaticPaths() {
  return allRules.map((rule) => ({
    params: { code: rule.id.toLowerCase() },
    props: { rule, relatedRules: getRelatedRules(rule.id) },
  }));
}

const { rule, relatedRules } = Astro.props;
---
```

### Pattern 2: Related Rules by Category
**What:** Derive related rules from category membership (same category, excluding self), sorted by severity.
**When to use:** DOCS-02 requires "links to related rules" but LintRule has no `relatedRules` field.
**Example:**
```typescript
// src/lib/tools/dockerfile-analyzer/rules/related.ts
import { allRules } from './index';
import type { LintRule } from '../types';

const SEVERITY_ORDER: Record<string, number> = { error: 0, warning: 1, info: 2 };

export function getRelatedRules(ruleId: string, limit = 5): LintRule[] {
  const rule = allRules.find((r) => r.id === ruleId);
  if (!rule) return [];
  return allRules
    .filter((r) => r.id !== ruleId && r.category === rule.category)
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
    .slice(0, limit);
}
```

### Pattern 3: Blog Post as Standard MDX Content
**What:** The companion blog post follows the exact same pattern as existing native blog posts (MDX in `src/data/blog/`, using content collection schema).
**When to use:** For BLOG-01 and BLOG-02.
**Example frontmatter:**
```yaml
---
title: "40 Dockerfile Mistakes You're Probably Making (And How to Fix Them)"
description: "A Kubernetes architect's guide to writing production-grade Dockerfiles. Learn the rules, understand why they matter, and try the free browser-based analyzer."
publishedDate: 2026-02-20
tags: ["docker", "kubernetes", "devops", "cloud-native", "security"]
draft: false
---
```

### Pattern 4: Cross-Linking (BLOG-02)
**What:** Three-way bidirectional linking between tool page, blog post, and rule pages.
**Links needed:**
- Blog post -> tool page: Markdown link in MDX content
- Blog post -> 5+ rule pages: Markdown links inline (e.g., "See [DL3006](/tools/dockerfile-analyzer/rules/dl3006/)")
- Tool page -> blog post: Add a section/link in `index.astro`
- Rule pages -> tool page: Link in rule page template
- Rule pages -> blog post: Link in rule page template

### Anti-Patterns to Avoid
- **Creating 39 individual MDX/MD files for rules:** Massive duplication of data already in TypeScript. Use the single dynamic route template.
- **Creating a separate content collection for rules:** allRules is already the data source. Adding a content collection would create a sync problem.
- **Using client-side rendering for rule pages:** These are SEO content pages -- they MUST be statically generated at build time. No `client:only` needed.
- **Thin rule pages with only one paragraph:** Each page needs enough content to be SEO-valuable. Include: full explanation, before/after code, severity/category metadata, related rules with descriptions, breadcrumbs, and back-links.
- **Hardcoding related rules:** Derive them programmatically from the registry to keep maintenance zero.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Code syntax highlighting | Custom highlight logic | astro-expressive-code (already in Astro config) | Handles Dockerfile highlighting, line numbers, titles, diffing |
| OG images | Custom canvas/image generation | Existing `generateOgImage()` in `src/lib/og-image.ts` | Already handles satori + sharp pipeline with branded layout |
| JSON-LD structured data | Manual JSON construction | Existing `BreadcrumbJsonLd.astro`, `BlogPostingJsonLd.astro` | Already tested and in production |
| Blog post rendering | Custom MDX pipeline | Astro content collection + `render()` | Existing `[slug].astro` handles everything |
| SEO meta tags | Manual meta tag insertion | Existing `SEOHead.astro` via `Layout.astro` | Already handles title, description, OG, Twitter cards |
| Sitemap inclusion | Manual sitemap entries | `@astrojs/sitemap` integration (auto-discovers pages) | New pages at `/tools/dockerfile-analyzer/rules/*` will be auto-included |
| IndexNow submission | Manual API calls | Existing `indexnow` integration | Auto-submits all pages on CI build |

**Key insight:** Almost all infrastructure needed for this phase already exists. The primary work is creating the `[code].astro` template, the `related.ts` utility, the MDX blog post content, and updating `index.astro` with a blog post link.

## Common Pitfalls

### Pitfall 1: Rule Count Mismatch
**What goes wrong:** The roadmap and requirements say "40 rules" but there are actually 39 rule files in the codebase (10 security + 8 efficiency + 7 maintainability + 5 reliability + 9 best-practice = 39).
**Why it happens:** Count may have included the `index.ts` barrel file, or a rule was removed/not implemented.
**How to avoid:** Use `allRules.length` dynamically rather than hardcoding "40" anywhere. Reference "39 rules" in documentation content.
**Warning signs:** Tests expecting exactly 40 pages; hardcoded "40" in blog post text.

### Pitfall 2: URL Casing for Rule Codes
**What goes wrong:** Rule IDs are mixed case (e.g., "DL3006", "PG001") but URLs should be lowercase for consistency and SEO.
**Why it happens:** TypeScript rule IDs use uppercase convention.
**How to avoid:** Use `rule.id.toLowerCase()` in `getStaticPaths` params. Ensure all internal links use lowercase. The dynamic route parameter should be `[code]` matching lowercase.
**Warning signs:** 404 errors when clicking links between pages; duplicate content from case-sensitive vs case-insensitive URL handling.

### Pitfall 3: Expressive Code Language for Dockerfile
**What goes wrong:** Code blocks in rule pages need `dockerfile` language for syntax highlighting but the language identifier might not be registered.
**Why it happens:** astro-expressive-code supports many languages but "dockerfile" needs to be specified correctly.
**How to avoid:** Use ` ```dockerfile ` as the fence language in MDX. In the Astro template, use `<Code code={...} lang="dockerfile" />` from astro-expressive-code's `<Code>` component. Verify at dev time.
**Warning signs:** Code blocks render as plain text without highlighting.

### Pitfall 4: Missing Trailing Slashes in Links
**What goes wrong:** Internal links without trailing slashes may cause redirects or 404s depending on the static host.
**Why it happens:** GitHub Pages and some CDNs handle `/path` differently from `/path/`.
**How to avoid:** Always use trailing slashes in cross-links: `/tools/dockerfile-analyzer/rules/dl3006/` not `/tools/dockerfile-analyzer/rules/dl3006`.
**Warning signs:** 301 redirects in production; broken links in sitemap.

### Pitfall 5: Thin Content on Rule Pages
**What goes wrong:** Rule pages that just show a title and one paragraph get flagged as thin content by search engines, harming site-wide SEO.
**Why it happens:** Temptation to generate minimal pages from limited rule data.
**How to avoid:** Each rule page should include: heading with rule ID and title, severity badge, category badge, full explanation paragraph, "How to Fix" section with description and before/after code blocks, "Related Rules" section with links to same-category rules, breadcrumb navigation, and back-links to tool page and blog post. This creates ~300-500 words of content per page.
**Warning signs:** Pages with fewer than 200 words of text content.

### Pitfall 6: Blog Post Not Appearing in Blog Listing
**What goes wrong:** New MDX blog post doesn't show up at `/blog/`.
**Why it happens:** Missing or malformed frontmatter; `draft: true` left in; file not in `src/data/blog/` directory.
**How to avoid:** Follow exact frontmatter schema from `content.config.ts`: title, description, publishedDate (as YYYY-MM-DD), tags array, draft: false.
**Warning signs:** Build succeeds but post missing from listing; Zod validation errors during build.

## Code Examples

Verified patterns from the existing codebase:

### Dynamic Route Template (Rule Documentation Page)
```typescript
// src/pages/tools/dockerfile-analyzer/rules/[code].astro
---
import { allRules } from '../../../../lib/tools/dockerfile-analyzer/rules/index';
import { getRelatedRules } from '../../../../lib/tools/dockerfile-analyzer/rules/related';
import Layout from '../../../../layouts/Layout.astro';
import BreadcrumbJsonLd from '../../../../components/BreadcrumbJsonLd.astro';
import type { LintRule } from '../../../../lib/tools/dockerfile-analyzer/types';

export function getStaticPaths() {
  return allRules.map((rule) => ({
    params: { code: rule.id.toLowerCase() },
    props: { rule },
  }));
}

interface Props {
  rule: LintRule;
}

const { rule } = Astro.props;
const relatedRules = getRelatedRules(rule.id);

const severityLabel: Record<string, string> = {
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
};
const categoryLabel: Record<string, string> = {
  security: 'Security',
  efficiency: 'Efficiency',
  maintainability: 'Maintainability',
  reliability: 'Reliability',
  'best-practice': 'Best Practice',
};

const pageTitle = `${rule.id}: ${rule.title} — Dockerfile Analyzer`;
const pageDesc = `${rule.explanation.slice(0, 155)}...`;
const pageUrl = new URL(`/tools/dockerfile-analyzer/rules/${rule.id.toLowerCase()}/`, Astro.site).toString();
---

<Layout title={pageTitle} description={pageDesc}>
  <article class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <!-- Metadata badges -->
    <!-- Rule explanation -->
    <!-- Fix suggestion with before/after code -->
    <!-- Related rules -->
    <!-- Back-links to tool page and blog post -->
  </article>
  <BreadcrumbJsonLd crumbs={[
    { name: "Home", url: `${Astro.site}` },
    { name: "Tools", url: `${new URL('/tools/', Astro.site)}` },
    { name: "Dockerfile Analyzer", url: `${new URL('/tools/dockerfile-analyzer/', Astro.site)}` },
    { name: rule.id, url: pageUrl },
  ]} />
</Layout>
```

### Severity Badge Component Pattern (inline in template)
```html
<!-- Follow existing tag pill pattern from blog -->
<span class:list={[
  'text-xs px-2 py-1 rounded-full font-medium',
  rule.severity === 'error' && 'bg-red-100 text-red-700',
  rule.severity === 'warning' && 'bg-amber-100 text-amber-700',
  rule.severity === 'info' && 'bg-blue-100 text-blue-700',
]}>
  {severityLabel[rule.severity]}
</span>
<span class="text-xs px-2 py-1 rounded-full font-medium bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
  {categoryLabel[rule.category]}
</span>
```

### Before/After Code Blocks Using Expressive Code
```html
<!-- Use Astro's Code component from astro-expressive-code -->
<!-- In the [code].astro template, use inline <pre><code> with class for EC -->
<div class="not-prose">
  <h3>Before (incorrect)</h3>
  <pre class="expressive-code"><code class="language-dockerfile">{rule.fix.beforeCode}</code></pre>

  <h3>After (correct)</h3>
  <pre class="expressive-code"><code class="language-dockerfile">{rule.fix.afterCode}</code></pre>
</div>
```

**Note on Expressive Code in Astro templates:** Expressive Code's automatic processing works in MDX content but NOT in `.astro` template files. For `.astro` files, you need to either:
1. Use the `<Code>` component from `astro-expressive-code` (if it exports one), OR
2. Use Astro's built-in `<Code>` component: `import { Code } from 'astro:components'`
3. Or simply use styled `<pre><code>` with Tailwind Typography prose classes

The safest approach for the template is Astro's built-in `<Code>` component which handles syntax highlighting at build time:
```typescript
import { Code } from 'astro:components';
// Then in template:
<Code code={rule.fix.beforeCode} lang="dockerfile" />
<Code code={rule.fix.afterCode} lang="dockerfile" />
```

### Blog Post Cross-Links Pattern
```mdx
<!-- In the MDX blog post -->
For example, [DL3006](/tools/dockerfile-analyzer/rules/dl3006/) flags
untagged base images, while [PG001](/tools/dockerfile-analyzer/rules/pg001/)
catches hardcoded secrets.

Try the [Dockerfile Analyzer](/tools/dockerfile-analyzer/) yourself -- paste
any Dockerfile and get instant feedback.
```

### Tool Page Blog Link (added to index.astro)
```html
<!-- Add to existing tool page -->
<aside class="mt-8 p-4 rounded-lg border border-[var(--color-border)]">
  <p class="text-sm text-[var(--color-text-secondary)]">
    Learn more about Dockerfile best practices in the
    <a href="/blog/dockerfile-best-practices/" class="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors">
      companion blog post
    </a>.
  </p>
</aside>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Astro content collections in `src/content/` | Astro 5.x loader-based collections in `src/content.config.ts` | Astro 5.0 (late 2025) | This project uses the new `defineCollection` + `glob` loader pattern. Blog posts are in `src/data/blog/`, not `src/content/blog/`. |
| `getCollection()` + `getEntry()` with folder-based IDs | `getCollection()` with glob-loader-derived IDs | Astro 5.0 | Post IDs are filename-based (e.g., `dockerfile-best-practices` not `blog/dockerfile-best-practices`) |
| `Astro.glob()` for data | `import` directly from TypeScript | Astro 4+ | Rule data is imported directly, not through content collections |

**Deprecated/outdated:**
- `src/content/` directory-based collections: This project uses Astro 5's `src/content.config.ts` with `glob` loader pointing to `src/data/blog/`.
- `Astro.glob()`: Replaced by content collections and direct imports.

## Open Questions

1. **OG images for rule pages**
   - What we know: The existing `[...slug].png.ts` generates OG images for blog posts only. Rule pages could benefit from custom OG images showing the rule ID, title, severity, and category.
   - What's unclear: Whether the effort of 39 custom OG images is worth it vs. using a generic Dockerfile Analyzer OG image for all rule pages.
   - Recommendation: Start with a shared generic OG image for all rule pages (showing "Dockerfile Analyzer - Rule Documentation" branding). Custom per-rule OG images can be added later as an enhancement. This keeps Phase 25 focused on content.

2. **Exact blog post slug**
   - What we know: The MDX filename determines the slug. Need to choose between `dockerfile-best-practices.mdx`, `dockerfile-analyzer-best-practices.mdx`, etc.
   - What's unclear: Optimal SEO slug for the companion post.
   - Recommendation: Use `dockerfile-best-practices.mdx` -> URL `/blog/dockerfile-best-practices/`. Short, keyword-rich, matches search intent.

3. **Rule page URL format: ID vs slug**
   - What we know: Rule IDs like `DL3006` and `PG001` are short codes. URLs will be `/tools/dockerfile-analyzer/rules/dl3006/`.
   - What's unclear: Whether to include a slug after the code (e.g., `/rules/dl3006-tag-version/`) for SEO.
   - Recommendation: Use just the lowercase ID (`/rules/dl3006/`). The rule codes are the primary search terms for anyone looking up Dockerfile lint rules. Hadolint users search for "DL3006" not "tag-version". Shorter URLs are better for sharing.

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `src/content.config.ts` -- content collection schema (blog collection with glob loader)
- Codebase inspection: `src/pages/blog/[slug].astro` -- blog post rendering pattern with `getStaticPaths`, JSON-LD, related posts
- Codebase inspection: `src/lib/tools/dockerfile-analyzer/types.ts` -- LintRule interface with explanation, fix (description, beforeCode, afterCode)
- Codebase inspection: `src/lib/tools/dockerfile-analyzer/rules/index.ts` -- allRules array (39 rules), getRuleById()
- Codebase inspection: All 39 rule files -- verified each has id, title, severity, category, explanation, and fix fields
- Codebase inspection: `src/pages/open-graph/[...slug].png.ts` -- OG image generation pattern
- Codebase inspection: `src/integrations/indexnow.ts` -- automatic URL submission on CI build
- Codebase inspection: `astro.config.mjs` -- sitemap, expressive-code, mdx, react integrations

### Secondary (MEDIUM confidence)
- Astro 5 documentation on `getStaticPaths` and dynamic routes (verified by existing usage in codebase)
- Astro built-in `<Code>` component for syntax highlighting in `.astro` templates

### Tertiary (LOW confidence)
- None -- all findings verified against the actual codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in use, no new dependencies needed
- Architecture: HIGH -- pattern follows exact existing patterns (dynamic routes, content collections, JSON-LD components)
- Pitfalls: HIGH -- identified from direct codebase inspection (rule count mismatch verified, URL casing observed, content collection schema verified)
- Content strategy: MEDIUM -- blog post structure and SEO approach based on established patterns but content quality depends on execution

**Research date:** 2026-02-20
**Valid until:** 2026-04-20 (stable -- no external dependencies changing)
