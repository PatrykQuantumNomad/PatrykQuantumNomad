# Stack Research: v1.1 Content Refresh

**Domain:** Content refresh for existing Astro 5 portfolio site (patrykgolabek.dev)
**Researched:** 2026-02-11
**Confidence:** HIGH
**Scope:** Stack additions/changes needed for external blog integration, social link updates, hero copy changes, and content curation

## Executive Finding

**Zero new npm packages required.** All v1.1 features are achievable with the existing Astro 5.17.1 stack. The work is content editing, schema extension, and component modification -- not new technology adoption.

This is deliberate: overengineering a content refresh with new dependencies would add maintenance burden, build complexity, and risk for what amounts to editing frontmatter, HTML, and TypeScript data files.

## Existing Stack (Unchanged)

These are already installed and validated in v1.0. Listed for reference only -- do NOT reinstall or upgrade.

| Technology | Installed Version | Role in v1.1 |
|------------|-------------------|---------------|
| Astro | 5.17.1 | Content collections with Content Layer API, glob() loader, Zod schemas |
| @astrojs/mdx | ^4.3.13 | MDX support for blog posts (internal posts only) |
| @astrojs/rss | ^4.0.15 | RSS feed -- needs update to handle external posts |
| @astrojs/sitemap | ^3.7.0 | Sitemap generation -- no changes needed |
| @astrojs/tailwind | ^6.0.2 | Tailwind integration (note: v1.0 used this, not @tailwindcss/vite) |
| @tailwindcss/typography | ^0.5.19 | Prose styling for blog content |
| tailwindcss | ^3.4.19 | Utility CSS (note: v1.0 shipped with Tailwind v3, not v4) |
| astro-expressive-code | ^0.41.6 | Code block syntax highlighting |
| satori + sharp | ^0.19.2 / ^0.34.5 | OG image generation at build time |
| reading-time | ^1.5.0 | Blog post reading time estimates |
| mdast-util-to-string | ^4.0.0 | Markdown AST utility for reading time plugin |

## Recommended Stack Changes for v1.1

### Feature 1: External Blog Post Integration

**Approach:** Extend the existing blog content collection schema with an optional `externalUrl` field. Create lightweight Markdown stub files for each external post. The blog listing page renders them alongside internal posts, but links to the external URL instead of an internal route.

**Why this approach over alternatives:**

| Approach | Verdict | Rationale |
|----------|---------|-----------|
| Add `externalUrl` to existing blog schema + stub .md files | **USE THIS** | Zero new dependencies. External posts get the same Zod validation, sorting, tagging, and filtering as internal posts. One unified `getCollection('blog')` call powers everything. Stub files are 5-10 lines of frontmatter each. |
| Separate `externalBlog` collection with inline loader | Rejected | Adds complexity for no benefit. You would need to merge and sort two collections in every page that lists posts. The blog listing, homepage "Latest Writing", tag pages, and RSS feed would all need dual-query logic. |
| RSS feed loader (e.g., `astro-loader-rss`) | Rejected | Fetches full RSS feeds at build time. Overkill when you want to curate specific posts, not mirror entire feeds. Adds a network dependency to the build. Fragile if the source RSS changes structure. |
| JSON/YAML data file (not a content collection) | Rejected | Loses type safety, draft filtering, tag support, and the unified `getCollection()` API. Would require separate rendering logic everywhere. |

**Schema change required in `src/content.config.ts`:**

```typescript
const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/data/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    // NEW: external blog post support
    externalUrl: z.string().url().optional(),
    source: z.string().optional(), // e.g., "Kubert AI Blog", "Translucent Computing"
  }),
});
```

**External post stub file example** (`src/data/blog/external-kubert-ai-post-title.md`):

```markdown
---
title: "The Actual Post Title from Kubert AI"
description: "Brief description of what the post covers."
publishedDate: 2025-10-15
tags: ["ai", "kubernetes", "llm-agents"]
externalUrl: "https://mykubert.com/blog/the-post-slug/"
source: "Kubert AI Blog"
---
```

Note: The Markdown body is intentionally empty. These files exist only for their frontmatter metadata. The `externalUrl` field tells components to link externally rather than rendering a post page.

**Component changes needed:**

| Component | Change | Why |
|-----------|--------|-----|
| `src/components/BlogCard.astro` | Conditionally use `externalUrl` as href when present; add external link icon and source badge | External posts should open in new tab with `target="_blank"` and `rel="noopener noreferrer"` |
| `src/pages/blog/index.astro` | No query changes needed -- `getCollection('blog')` already returns all entries | The filtering/sorting logic works as-is because external posts have the same schema shape |
| `src/pages/blog/[slug].astro` | Filter out external posts from dynamic route generation | External posts should NOT generate local pages; they are link stubs only |
| `src/pages/index.astro` | BlogCard used inline here -- apply same external link logic | Homepage "Latest Writing" section must handle external posts identically |
| `src/pages/rss.xml.ts` | Conditionally use `externalUrl` for the `link` field when present | RSS readers should link to the original external post, not a non-existent local page |
| `src/pages/blog/tags/[tag].astro` | Same BlogCard logic applies -- no query changes | Tag pages already get entries via `getCollection` |
| `src/pages/open-graph/[...slug].png.ts` | Skip OG image generation for external posts | External posts do not have local pages, so no OG image is needed |

**Confidence: HIGH** -- This is standard Astro content collection usage. Zod optional fields, glob loader, and conditional rendering are all core Astro features verified in official docs.

### Feature 2: YouTube and X (Twitter) Social Link Integration

**Approach:** Pure HTML/SVG changes. No new packages needed.

**Files to modify:**

| File | Change |
|------|--------|
| `src/components/Footer.astro` | Remove LinkedIn SVG link. Add YouTube and X (Twitter) SVG icon links. Keep GitHub and Blog links. |
| `src/pages/contact.astro` | Remove LinkedIn contact card. Add YouTube and X cards. Update "Other places" section. |
| `src/pages/index.astro` | Remove "Connect on LinkedIn" CTA button. Replace with appropriate alternative (X profile or email). |
| `src/components/PersonJsonLd.astro` | Update `sameAs` array: remove LinkedIn URL, add YouTube channel URL and X profile URL. |

**SVG icons for new social links:**

YouTube and X (Twitter) icons are well-known standard SVG paths. The existing codebase uses inline SVGs (not an icon library), so maintain the same pattern. No icon library needed.

- **X (Twitter):** Use the current X logo SVG path (single path, 24x24 viewBox)
- **YouTube:** Use the standard YouTube play-button SVG path (24x24 viewBox)

**Confidence: HIGH** -- This is straightforward HTML editing with no technical risk.

### Feature 3: Hero Tagline Refresh

**Approach:** Direct copy editing in `src/pages/index.astro`. No technical changes.

**What to change:**

| Element | Current Value | What Changes |
|---------|---------------|--------------|
| Hero subtitle text | "Building resilient cloud-native systems and AI-powered solutions for 17+ years." | New tagline with craft & precision messaging |
| Typing role array | `['Cloud-Native Architect', 'Kubernetes Pioneer', 'AI/ML Engineer', 'Platform Builder']` | Potentially update role strings to match new messaging |
| CTA buttons | "View Projects" + "Read Blog" | Evaluate if these still make sense with new tone |

**No stack implications.** The typing animation is vanilla JS with `setInterval` -- it works with any string array content.

**Confidence: HIGH** -- Pure content editing.

### Feature 4: Content Removal (Projects + Blog Posts)

**Approach:** Delete entries from data files. No technical changes.

**Project removal:**

| Action | File | Details |
|--------|------|---------|
| Remove "Full-Stack Applications" category | `src/data/projects.ts` | Delete the entire category from the `categories` array and remove all projects with that category (`PatrykQuantumNomad`, `arjancode_examples`) |
| Remove `gemini-beauty-math` | `src/data/projects.ts` | Delete the project object from the array (it is in "AI/ML & LLM Agents" category) |
| Update project count | `src/pages/projects/index.astro` | The description says "19 open-source projects" -- update to reflect new count (16 after removals) |

**Blog post removal:**

| Action | File | Details |
|--------|------|---------|
| Remove draft placeholder | `src/data/blog/draft-placeholder.md` | Delete the file entirely. It is `draft: true` so it does not appear in production, but removing it keeps the repo clean. |

**No stack implications.** Deleting entries from TypeScript arrays and removing Markdown files requires no tooling.

**Confidence: HIGH** -- File deletion and array editing.

## What NOT to Add

These are tempting but wrong for a content refresh milestone:

| Avoid | Why | What to Do Instead |
|-------|-----|---------------------|
| `astro-loader-rss` or any RSS feed loader | Adds build-time network dependency. You are curating specific posts, not mirroring feeds. If the external blog changes its RSS format, your build breaks. | Markdown stub files with `externalUrl` frontmatter. You control exactly which posts appear. |
| A separate `externalPosts` content collection | Forces dual-query merging in every listing page (blog index, homepage, tags, RSS). More code, more bugs, for zero user benefit. | Single `blog` collection with optional `externalUrl` field. One query, one sort, one render path with a conditional. |
| `astro-icon` or any icon library | The codebase uses inline SVGs throughout. Adding an icon library for 2 new social icons (YouTube, X) is dependency bloat. You would need to refactor all existing SVGs for consistency. | Copy-paste the standard YouTube and X SVG paths into the existing inline SVG pattern. |
| Any new animation library | The hero tagline refresh is a copy change. The typing animation already works. Do not add GSAP, Motion, or any animation library for a text edit. | Edit the string content in the existing `<script>` block. |
| Tailwind CSS v4 upgrade | v1.0 shipped with Tailwind v3.4.19 + `@astrojs/tailwind`. A major Tailwind version upgrade is a separate milestone, not a content refresh side-effect. | Keep Tailwind v3. Upgrade to v4 in a dedicated infrastructure milestone. |
| Any CMS or headless content system | The milestone scope is adding 3-5 external blog stubs and editing a few data files. A CMS is wildly disproportionate to the task. | Markdown files with frontmatter. The same pattern that powers the entire v1.0 blog. |
| `schema-dts` or typed JSON-LD library | The existing `PersonJsonLd.astro` uses a plain object literal. Adding a typed JSON-LD library for a `sameAs` array edit is overengineering. | Edit the `sameAs` array directly in the component. |

## Installation

```bash
# No new packages to install for v1.1.
# All features are achievable with the existing stack.
```

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| External blog integration | `externalUrl` schema field + stub .md files | Separate collection with inline loader | Dual-query complexity in every listing page for no user benefit |
| External blog integration | `externalUrl` schema field + stub .md files | RSS feed loader | Build-time network dependency, fragile, fetches too much when you want to curate specific posts |
| External blog integration | `externalUrl` schema field + stub .md files | JSON data file | Loses content collection features: type safety, draft filtering, tags, unified querying |
| Social icons | Inline SVG paths | astro-icon + @iconify-json/lucide | Adding a dependency for 2 icons when the entire codebase uses inline SVGs |
| Social icons | Inline SVG paths | Font Awesome | 30KB+ icon font for 2 icons. Absurd for a performance-focused static site. |
| Content management | Markdown frontmatter | Headless CMS (Sanity, Contentful) | Massive overengineering for a site with <10 content entries being edited |

## Version Compatibility

No version compatibility concerns for v1.1. The existing stack is unchanged:

| Package | Installed | Status |
|---------|-----------|--------|
| astro | 5.17.1 | Current stable. Content Layer API with Zod schema extension is core functionality. |
| @astrojs/rss | ^4.0.15 | Supports custom `link` field per item -- needed for external post URLs in RSS. |
| All other deps | As shipped in v1.0 | No interaction with v1.1 features. |

## Sources

- [Astro Content Collections docs](https://docs.astro.build/en/guides/content-collections/) -- schema definition with Zod, glob() loader, getCollection() API (HIGH confidence)
- [Astro Content Loader API Reference](https://docs.astro.build/en/reference/content-loader-reference/) -- inline loader pattern, object loader pattern (HIGH confidence)
- [Astro Content Collections API Reference](https://docs.astro.build/en/reference/modules/astro-content/) -- getCollection(), CollectionEntry types (HIGH confidence)
- [Astro Community Loaders](https://astro.build/blog/community-loaders/) -- RSS loader exists but is overkill for curated external links (MEDIUM confidence)
- Existing codebase analysis of `src/content.config.ts`, `src/components/BlogCard.astro`, `src/pages/blog/index.astro`, `src/pages/rss.xml.ts`, `src/components/Footer.astro`, `src/pages/contact.astro`, `src/components/PersonJsonLd.astro`, `src/data/projects.ts` (HIGH confidence -- direct file inspection)

---
*Stack research for: patrykgolabek.dev v1.1 Content Refresh*
*Researched: 2026-02-11*
*Key finding: Zero new npm packages. All features are schema extensions, component edits, and content file changes.*
