# Phase 3: Blog Infrastructure - Research

**Researched:** 2026-02-11
**Domain:** Astro 5 Content Collections, Markdown/MDX rendering, syntax highlighting, reading time
**Confidence:** HIGH

## Summary

Phase 3 delivers a fully functional blog with content collections, listing page, individual post pages, syntax-highlighted code blocks with copy buttons, reading time estimates, and draft filtering. The implementation uses Astro 5's Content Layer API (glob loader + Zod schema), astro-expressive-code for syntax highlighting, @tailwindcss/typography for prose styling, and a custom remark plugin for reading time.

The critical integration detail is syncing astro-expressive-code's theme with the existing Tailwind `darkMode: 'class'` strategy. By default, Expressive Code uses `prefers-color-scheme` media queries, which will NOT respond to the manual theme toggle already built in Phase 2. The `themeCssSelector` configuration option solves this by mapping the `.dark` class on `<html>` to the dark code theme.

**Primary recommendation:** Use Astro 5 Content Layer API with glob loader for blog posts, astro-expressive-code (before MDX in integration order) with `themeCssSelector` configured for class-based dark mode, @tailwindcss/typography for prose styling, and the official Astro reading-time remark plugin recipe.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro (already installed) | ^5.17.1 | Content Layer API, getCollection, render | Already installed; Content Layer API is the Astro 5 canonical pattern for structured content |
| @astrojs/mdx | ^4.3.13 | MDX support in content collections | Enables JSX components inside blog posts (callouts, embeds); official Astro integration |
| astro-expressive-code | ^0.41.6 | Syntax highlighting + copy buttons + frames | Built on Shiki (VS Code engine), includes copy button out of the box, theme switching, line markers, frames |
| @tailwindcss/typography | ^0.5.19 | Prose classes for rendered Markdown | The standard plugin for beautiful typographic defaults; `prose dark:prose-invert` handles dark mode |
| reading-time | ^1.5.0 | Estimated reading time calculation | 200 wpm default, returns "X min read" text; used by the official Astro recipe |
| mdast-util-to-string | ^4.0.0 | Extract text from markdown AST | Required by the reading-time remark plugin to get raw text from the AST tree |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none additional) | - | - | All requirements are covered by core libraries above |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| astro-expressive-code | Built-in Shiki (Astro default) | Shiki is already built into Astro for basic highlighting, but lacks copy buttons, window frames, line markers, and theme switching. Expressive Code wraps Shiki and adds all these features with zero custom code. |
| astro-expressive-code | rehype-pretty-code | rehype-pretty-code requires manual configuration for copy buttons, frames, and dark mode switching. Expressive Code provides all of these out of the box. |
| @tailwindcss/typography | Custom CSS for prose | Hand-rolling prose styles means maintaining heading spacing, link colors, list styles, blockquotes, table formatting, code blocks, and responsive type scale. The typography plugin handles all of this with a single class. |
| reading-time remark plugin | Manual word count in frontmatter | Manual approach requires authors to calculate and update reading time for every post. The remark plugin auto-calculates at build time. |

**Installation:**
```bash
npm install @astrojs/mdx astro-expressive-code @tailwindcss/typography reading-time mdast-util-to-string
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── content.config.ts          # Collection definitions (blog schema, glob loader)
├── data/
│   └── blog/                  # Blog post .md/.mdx files
│       ├── hello-world.md     # Sample post for testing
│       └── ...
├── pages/
│   └── blog/
│       ├── index.astro        # Blog listing page (/blog/)
│       └── [...slug].astro    # Individual post pages (/blog/[slug]/)
├── components/
│   └── BlogCard.astro         # Blog post preview card (listing page)
├── layouts/
│   └── Layout.astro           # Existing base layout (receives blog post props)
└── lib/
    └── utils.ts               # Date formatting, reading time helpers
```

**Note on `[...slug].astro` vs `[slug].astro`:** Use `[...slug].astro` (rest parameter) if post IDs from glob loader may contain forward slashes (e.g., nested directories). Use `[slug].astro` for flat directory structures. Since posts will be in a flat `src/data/blog/` directory, `[slug].astro` is sufficient, but the glob loader's `id` is auto-slugified from filenames.

### Pattern 1: Content Collection with Zod Schema and Draft Filtering

**What:** Define the blog collection in `src/content.config.ts` using Astro 5's Content Layer API. The glob loader reads `.md` and `.mdx` files from `src/data/blog/`. The Zod schema validates frontmatter at build time -- invalid posts fail the build with helpful errors.

**When to use:** For all blog content. This is the canonical Astro 5 pattern.

**Example:**
```typescript
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/data/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
```
Source: [Astro Content Collections docs](https://docs.astro.build/en/guides/content-collections/)

### Pattern 2: Draft Filtering with import.meta.env.PROD

**What:** Filter drafts in production while showing them in development. Use getCollection's second argument (filter callback) with `import.meta.env.PROD`.

**When to use:** Every place that queries the blog collection (listing page, getStaticPaths, RSS feed).

**Example:**
```typescript
// Get published posts only in production, all posts in dev
const posts = await getCollection('blog', ({ data }) => {
  return import.meta.env.PROD ? data.draft !== true : true;
});

// Sort by date, newest first
const sortedPosts = posts.sort(
  (a, b) => b.data.publishedDate.valueOf() - a.data.publishedDate.valueOf()
);
```
Source: [Astro Content Collections docs](https://docs.astro.build/en/guides/content-collections/)

### Pattern 3: Dynamic Routes with getStaticPaths and render()

**What:** The `[slug].astro` page exports `getStaticPaths()` to generate one static page per post. The `render()` function returns the `<Content />` component, headings array, and remarkPluginFrontmatter (including reading time).

**When to use:** For the `/blog/[slug]/` route.

**Critical Astro 5 change:** In Astro 5, `render()` is imported from `astro:content` (not called on the entry). The entry's `id` replaces the old `slug` property. IDs from the glob loader are auto-slugified from filenames.

**Example:**
```astro
---
// src/pages/blog/[slug].astro
import { getCollection, render } from 'astro:content';
import Layout from '../../layouts/Layout.astro';

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => {
    return import.meta.env.PROD ? data.draft !== true : true;
  });
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content, headings, remarkPluginFrontmatter } = await render(post);
---

<Layout title={post.data.title} description={post.data.description}>
  <article class="prose dark:prose-invert max-w-3xl mx-auto px-4 py-12">
    <h1>{post.data.title}</h1>
    <div class="flex gap-4 text-sm text-[var(--color-text-secondary)]">
      <time datetime={post.data.publishedDate.toISOString()}>
        {post.data.publishedDate.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
      </time>
      <span>{remarkPluginFrontmatter.minutesRead}</span>
    </div>
    <Content />
  </article>
</Layout>
```
Source: [Astro Content Collections API Reference](https://docs.astro.build/en/reference/modules/astro-content/)

### Pattern 4: Reading Time via Remark Plugin

**What:** A custom remark plugin that extracts text from the Markdown AST, runs it through the `reading-time` package, and injects the result into `data.astro.frontmatter.minutesRead`. Access it via `remarkPluginFrontmatter` from `render()`.

**When to use:** For all blog posts. This is the official Astro recipe.

**Example:**
```javascript
// remark-reading-time.mjs
import getReadingTime from 'reading-time';
import { toString } from 'mdast-util-to-string';

export function remarkReadingTime() {
  return function (tree, { data }) {
    const textOnPage = toString(tree);
    const readingTime = getReadingTime(textOnPage);
    data.astro.frontmatter.minutesRead = readingTime.text;
  };
}
```

```javascript
// astro.config.mjs - add to markdown.remarkPlugins
import { remarkReadingTime } from './remark-reading-time.mjs';

export default defineConfig({
  // ...existing config
  markdown: {
    remarkPlugins: [remarkReadingTime],
  },
});
```
Source: [Astro Add Reading Time Recipe](https://docs.astro.build/en/recipes/reading-time/)

### Anti-Patterns to Avoid

- **Putting content files in `src/content/`:** Astro 5 decoupled content from this directory. Use `src/data/blog/` instead. The `src/content/` path has legacy significance and can cause confusion about old vs new API.
- **Calling `render()` on the entry object:** In Astro 5, `render()` is a standalone function imported from `astro:content`, not a method on the entry. Use `render(post)`, not `post.render()`.
- **Using `post.slug` instead of `post.id`:** Astro 5 replaced `slug` with `id`. The glob loader auto-slugifies filenames into IDs.
- **Hardcoding reading time in frontmatter:** Use the remark plugin to auto-calculate at build time. Manual values become stale when content changes.
- **Forgetting draft filter in getStaticPaths:** If drafts are not filtered in `getStaticPaths()`, draft posts will generate pages in production builds even though they are hidden from listings.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Syntax highlighting | Custom Shiki integration with copy button JS | astro-expressive-code | Copy buttons, frames, line markers, theme switching, and tree-shaking are all built in. Custom solutions miss edge cases (language detection, line wrapping, accessibility). |
| Prose typography | Custom CSS for rendered Markdown | @tailwindcss/typography `prose` class | The plugin handles 30+ HTML elements (headings, lists, blockquotes, tables, code, images) with responsive type scale, proper spacing, and dark mode. Replicating this is 500+ lines of CSS. |
| Reading time | Manual word count function | reading-time package + remark plugin | The package handles edge cases (code blocks, images, CJK characters) that a naive `split(' ').length / 200` misses. |
| Content validation | Manual frontmatter checking | Zod schema in content.config.ts | Zod catches missing/wrong-type fields at build time with clear error messages. Manual validation is fragile and provides poor DX. |
| Dark mode theme sync for code | Custom CSS overrides for Shiki themes | astro-expressive-code `themeCssSelector` | The selector function maps `.dark` class to the dark theme. Custom CSS overrides for Shiki variables are brittle and break on theme updates. |

**Key insight:** The blog infrastructure domain has mature, well-tested solutions for every requirement. Every custom solution would be worse than the standard library approach in terms of features, edge case handling, and maintenance burden.

## Common Pitfalls

### Pitfall 1: Expressive Code Theme Not Syncing with Dark Mode Toggle
**What goes wrong:** Code blocks show the light theme even when the site is in dark mode (or vice versa). Toggling the theme toggle changes the site but not the code blocks.
**Why it happens:** By default, astro-expressive-code uses `prefers-color-scheme` media query for theme switching, which only responds to the OS setting, not a manual `.dark` class toggle.
**How to avoid:** Configure `themeCssSelector` to map the `.dark` class to the dark code theme:
```javascript
// In astro.config.mjs, inside expressiveCode options:
expressiveCode({
  themes: ['github-dark', 'github-light'],
  themeCssSelector: (theme) => {
    if (theme.name === 'github-dark') return '.dark';
    if (theme.name === 'github-light') return ':root:not(.dark)';
    return false;
  },
  useDarkModeMediaQuery: false,
})
```
**Warning signs:** Code blocks have a different background color than the rest of the page after toggling the theme.

### Pitfall 2: Expressive Code Integration Order with MDX
**What goes wrong:** Code blocks in MDX files are not syntax-highlighted, or they render as plain `<pre>` blocks without Expressive Code features.
**Why it happens:** `astro-expressive-code` must be listed BEFORE `@astrojs/mdx` in the integrations array. Expressive Code needs to process code blocks before MDX transforms them.
**How to avoid:** Always put `expressiveCode()` before `mdx()` in `astro.config.mjs`:
```javascript
integrations: [
  expressiveCode({ /* options */ }),  // MUST come first
  mdx(),                              // MUST come after
  tailwind(),                         // order doesn't matter for these
]
```
**Warning signs:** MDX posts have unstyled code blocks while `.md` posts work fine.

### Pitfall 3: Typography Plugin in ESM Config
**What goes wrong:** Build fails with "require is not defined" when adding `@tailwindcss/typography` to `tailwind.config.mjs`.
**Why it happens:** The project uses `"type": "module"` in package.json, so `.mjs` files cannot use `require()`. Many Tailwind examples show `require('@tailwindcss/typography')`.
**How to avoid:** Use ESM import syntax:
```javascript
// tailwind.config.mjs
import typography from '@tailwindcss/typography';

export default {
  // ...existing config
  plugins: [typography],
};
```
**Warning signs:** `ReferenceError: require is not defined` during build.

### Pitfall 4: Draft Posts Generating Pages in Production
**What goes wrong:** Draft posts are accessible at their URLs in production even though they do not appear on the listing page.
**Why it happens:** The draft filter is applied on the listing page but forgotten in `getStaticPaths()` of the `[slug].astro` page.
**How to avoid:** Apply the same `import.meta.env.PROD ? data.draft !== true : true` filter in BOTH the listing page AND `getStaticPaths()`.
**Warning signs:** Visiting `/blog/draft-post-slug/` in production loads the page.

### Pitfall 5: Prose Styles Conflicting with CSS Custom Properties
**What goes wrong:** The `prose` class overrides the existing CSS custom property colors (e.g., text becomes Tailwind's default gray instead of `--color-text-primary`).
**Why it happens:** @tailwindcss/typography applies its own color palette that may not match the site's custom property-based theme.
**How to avoid:** Customize prose colors to use the site's CSS custom properties:
```javascript
// In tailwind.config.mjs theme.extend
typography: {
  DEFAULT: {
    css: {
      '--tw-prose-body': 'var(--color-text-primary)',
      '--tw-prose-headings': 'var(--color-text-primary)',
      '--tw-prose-links': 'var(--color-accent)',
      '--tw-prose-bold': 'var(--color-text-primary)',
      '--tw-prose-code': 'var(--color-text-primary)',
      '--tw-prose-quotes': 'var(--color-text-secondary)',
      '--tw-prose-hr': 'var(--color-border)',
      '--tw-prose-th-borders': 'var(--color-border)',
      '--tw-prose-td-borders': 'var(--color-border)',
    },
  },
  invert: {
    css: {
      '--tw-prose-body': 'var(--color-text-primary)',
      '--tw-prose-headings': 'var(--color-text-primary)',
      '--tw-prose-links': 'var(--color-accent)',
      '--tw-prose-bold': 'var(--color-text-primary)',
      '--tw-prose-code': 'var(--color-text-primary)',
      '--tw-prose-quotes': 'var(--color-text-secondary)',
      '--tw-prose-hr': 'var(--color-border)',
      '--tw-prose-th-borders': 'var(--color-border)',
      '--tw-prose-td-borders': 'var(--color-border)',
    },
  },
},
```
Alternatively, since the CSS custom properties already change values between light and dark mode (via `:root` vs `:root.dark`), the DEFAULT prose config with custom property values may be sufficient without `prose-invert`. Test both approaches.
**Warning signs:** Blog post text appears in a different shade than the rest of the site.

### Pitfall 6: content.config.ts Location
**What goes wrong:** Content collections are not detected; `getCollection()` returns empty arrays.
**Why it happens:** The file is placed in the wrong location. In Astro 5, it must be at `src/content.config.ts` (inside `src/`, not at the project root).
**How to avoid:** Place the file at exactly `src/content.config.ts`.
**Warning signs:** Build completes but blog pages have no content, or `astro check` reports collection errors.

## Code Examples

Verified patterns from official sources:

### Complete astro.config.mjs Update
```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import expressiveCode from 'astro-expressive-code';
import mdx from '@astrojs/mdx';
import { remarkReadingTime } from './remark-reading-time.mjs';

export default defineConfig({
  site: 'https://patrykgolabek.dev',
  output: 'static',
  integrations: [
    expressiveCode({
      themes: ['github-dark', 'github-light'],
      themeCssSelector: (theme) => {
        if (theme.name === 'github-dark') return '.dark';
        if (theme.name === 'github-light') return ':root:not(.dark)';
        return false;
      },
      useDarkModeMediaQuery: false,
    }),
    mdx(),       // MUST come after expressiveCode
    tailwind(),  // existing integration
  ],
  markdown: {
    remarkPlugins: [remarkReadingTime],
  },
});
```
Source: [Expressive Code Configuration Reference](https://expressive-code.com/reference/configuration/), [Astro MDX Integration](https://docs.astro.build/en/guides/integrations-guide/mdx/)

### Content Collection Schema
```typescript
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/data/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
```
Source: [Astro Content Collections docs](https://docs.astro.build/en/guides/content-collections/)

### Blog Post Frontmatter Template
```markdown
---
title: "Post Title Here"
description: "A brief description for SEO and listing cards"
publishedDate: 2026-02-11
tags: ["kubernetes", "cloud-native"]
draft: false
---

Post content goes here...
```

### Blog Listing Page
```astro
---
// src/pages/blog/index.astro
import { getCollection } from 'astro:content';
import Layout from '../../layouts/Layout.astro';
import BlogCard from '../../components/BlogCard.astro';

const posts = await getCollection('blog', ({ data }) => {
  return import.meta.env.PROD ? data.draft !== true : true;
});

const sortedPosts = posts.sort(
  (a, b) => b.data.publishedDate.valueOf() - a.data.publishedDate.valueOf()
);
---

<Layout title="Blog" description="Articles on cloud-native architecture, Kubernetes, and AI/ML engineering">
  <section class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <h1 class="text-3xl sm:text-4xl font-heading font-bold mb-8">Blog</h1>
    <div class="space-y-8">
      {sortedPosts.map((post) => (
        <BlogCard post={post} />
      ))}
    </div>
  </section>
</Layout>
```

### BlogCard Component
```astro
---
// src/components/BlogCard.astro
import type { CollectionEntry } from 'astro:content';

interface Props {
  post: CollectionEntry<'blog'>;
}

const { post } = Astro.props;
const { title, description, publishedDate, tags } = post.data;
---

<article class="group">
  <a href={`/blog/${post.id}/`} class="block p-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] hover:border-[var(--color-accent)] transition-colors">
    <time datetime={publishedDate.toISOString()} class="text-sm text-[var(--color-text-secondary)]">
      {publishedDate.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
    </time>
    <h2 class="text-xl font-heading font-bold mt-2 group-hover:text-[var(--color-accent)] transition-colors">
      {title}
    </h2>
    <p class="mt-2 text-[var(--color-text-secondary)]">{description}</p>
    {tags.length > 0 && (
      <div class="flex flex-wrap gap-2 mt-4">
        {tags.map((tag) => (
          <span class="text-xs px-2 py-1 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
            {tag}
          </span>
        ))}
      </div>
    )}
  </a>
</article>
```

### Individual Post Page
```astro
---
// src/pages/blog/[slug].astro
import { getCollection, render } from 'astro:content';
import Layout from '../../layouts/Layout.astro';

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => {
    return import.meta.env.PROD ? data.draft !== true : true;
  });
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content, remarkPluginFrontmatter } = await render(post);
---

<Layout title={post.data.title} description={post.data.description}>
  <article class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <header class="mb-8">
      <h1 class="text-3xl sm:text-4xl font-heading font-bold">{post.data.title}</h1>
      <div class="flex flex-wrap items-center gap-4 mt-4 text-sm text-[var(--color-text-secondary)]">
        <time datetime={post.data.publishedDate.toISOString()}>
          {post.data.publishedDate.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
        </time>
        <span aria-label="Reading time">{remarkPluginFrontmatter.minutesRead}</span>
      </div>
      {post.data.tags.length > 0 && (
        <div class="flex flex-wrap gap-2 mt-4">
          {post.data.tags.map((tag) => (
            <span class="text-xs px-2 py-1 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
              {tag}
            </span>
          ))}
        </div>
      )}
    </header>
    <div class="prose dark:prose-invert max-w-none">
      <Content />
    </div>
  </article>
</Layout>
```

### Tailwind Config Update (ESM)
```javascript
// tailwind.config.mjs - updated for typography
import defaultTheme from 'tailwindcss/defaultTheme';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        heading: ['Space Grotesk', ...defaultTheme.fontFamily.sans],
        mono: ['JetBrains Mono', ...defaultTheme.fontFamily.mono],
      },
      colors: {
        // ...existing color config
      },
      typography: {
        DEFAULT: {
          css: {
            '--tw-prose-body': 'var(--color-text-primary)',
            '--tw-prose-headings': 'var(--color-text-primary)',
            '--tw-prose-links': 'var(--color-accent)',
            '--tw-prose-bold': 'var(--color-text-primary)',
            '--tw-prose-code': 'var(--color-text-primary)',
            '--tw-prose-quotes': 'var(--color-text-secondary)',
            '--tw-prose-hr': 'var(--color-border)',
          },
        },
      },
    },
  },
  plugins: [typography],
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `src/content/config.ts` | `src/content.config.ts` | Astro 5.0 (Dec 2024) | Config moved to src root; old path no longer works |
| `entry.slug` | `entry.id` | Astro 5.0 (Dec 2024) | slug property removed; use id (auto-slugified by glob loader) |
| `entry.render()` method | `render(entry)` function from `astro:content` | Astro 5.0 (Dec 2024) | render is now a standalone import, not a method |
| `type: 'content'` in defineCollection | `loader: glob()` in defineCollection | Astro 5.0 (Dec 2024) | Content Layer API replaces the legacy collection type |
| `@astrojs/prism` for highlighting | `astro-expressive-code` | 2023-2024 | Prism is deprecated in Astro ecosystem; Expressive Code (Shiki-based) is the standard |
| Manual CSS for code copy buttons | astro-expressive-code built-in | 2023-2024 | Copy button is a default feature, no custom JS needed |

**Deprecated/outdated:**
- `@astrojs/prism`: Deprecated; Shiki is Astro's default highlighter since v3
- `src/content/config.ts` path: Astro 5 moved this to `src/content.config.ts`
- `entry.render()` method call: Replaced by standalone `render()` import
- `entry.slug`: Replaced by `entry.id` in Astro 5

## Open Questions

1. **Prose typography colors with CSS custom properties**
   - What we know: @tailwindcss/typography supports CSS variable overrides via `--tw-prose-*` custom properties in the theme config. The site already uses CSS custom properties that change between light/dark.
   - What's unclear: Whether using CSS custom properties as prose variable values works seamlessly with the `dark:prose-invert` class, or if a simpler approach (just `prose dark:prose-invert` without customization) provides acceptable results.
   - Recommendation: Start with `prose dark:prose-invert` (zero customization). If the default prose colors clash visually with the site theme, add the CSS custom property overrides to `tailwind.config.mjs`. Test both light and dark modes.

2. **Expressive Code style sheets and page weight**
   - What we know: Expressive Code can emit styles as a separate CSS file (recommended for multi-page sites) or inline them per page.
   - What's unclear: Whether the default behavior (inline) is acceptable for a small blog, or if the `emitExternalStylesheet` option should be enabled.
   - Recommendation: Start with defaults. If blog posts with many code blocks have noticeably large HTML, enable `emitExternalStylesheet: true`.

## Sources

### Primary (HIGH confidence)
- [Astro Content Collections docs](https://docs.astro.build/en/guides/content-collections/) - glob loader, Zod schemas, draft filtering pattern
- [Astro Content Collections API Reference](https://docs.astro.build/en/reference/modules/astro-content/) - getCollection, render, getEntry function signatures
- [Astro Add Reading Time Recipe](https://docs.astro.build/en/recipes/reading-time/) - Official remark plugin recipe with remarkPluginFrontmatter access
- [Astro Upgrade to v5 Guide](https://docs.astro.build/en/guides/upgrade-to/v5/) - content.config.ts location, slug->id, render() import change
- [Expressive Code Configuration Reference](https://expressive-code.com/reference/configuration/) - themeCssSelector, useDarkModeMediaQuery, themes array
- [Expressive Code Themes Guide](https://expressive-code.com/guides/themes/) - Dark mode integration, CSS selector customization
- [Astro MDX Integration docs](https://docs.astro.build/en/guides/integrations-guide/mdx/) - Integration setup, remark plugin inheritance
- [Tailwind CSS Typography v0.5 announcement](https://tailwindcss.com/blog/tailwindcss-typography-v0-5) - prose-invert, element modifiers, color themes
- [Astro Tailwind Rendered Markdown Recipe](https://docs.astro.build/en/recipes/tailwind-rendered-markdown/) - Prose wrapper component pattern

### Secondary (MEDIUM confidence)
- npm registry version checks (2026-02-11): astro-expressive-code@0.41.6, @astrojs/mdx@4.3.13, reading-time@1.5.0, @tailwindcss/typography@0.5.19, mdast-util-to-string@4.0.0
- [Installing Expressive Code on Astro (galiata.com)](https://www.galiata.com/blog/expressive-code-install/) - Integration order confirmation (expressiveCode before mdx)

### Tertiary (LOW confidence)
- None. All findings verified with primary or secondary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries are official Astro ecosystem or well-established Tailwind plugins, versions verified via npm
- Architecture: HIGH - Patterns are directly from official Astro 5 documentation and recipes
- Pitfalls: HIGH - Integration order, ESM config, and theme sync issues are well-documented in official sources and community reports

**Project constraints verified:**
- Project uses Tailwind v3.4.19 (NOT v4) with `@astrojs/tailwind@6.0.2` and `tailwind.config.mjs`
- Project uses `"type": "module"` in package.json -- all config must use ESM imports, not `require()`
- Existing CSS custom properties define theme colors; prose styling should integrate with these
- JetBrains Mono is already configured as the `font-mono` family -- code blocks should inherit this

**Research date:** 2026-02-11
**Valid until:** 2026-03-11 (30 days -- stable domain, unlikely to change)
