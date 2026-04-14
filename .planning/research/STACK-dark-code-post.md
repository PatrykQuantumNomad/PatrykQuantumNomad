# Stack Research: Dark Code Blog Post

**Domain:** Long-form thought-leadership blog post (3000-5000 words) on existing Astro 5 + MDX site
**Researched:** 2026-04-14
**Confidence:** HIGH

## Verdict: No New Dependencies Required

The existing site stack already contains everything needed to write and publish a long-form thought-leadership blog post about Dark Code. The investigation focused on four areas: (1) data citations and footnotes, (2) statistics callouts, (3) pull quotes, and (4) enhanced typography. In every case, existing capabilities or new zero-dependency Astro components are the right answer.

## Existing Stack (Already Installed, Already Working)

| Technology | Version | Purpose | Status for Dark Code |
|------------|---------|---------|---------------------|
| Astro | ^5.3.0 | Static site framework | Fully sufficient |
| @astrojs/mdx | ^4.3.13 | MDX content collections | Fully sufficient |
| @tailwindcss/typography | ^0.5.19 | Prose styling (blockquotes, lists, headings) | Fully sufficient |
| astro-expressive-code | ^0.41.6 | Code blocks (if needed for Dark Code examples) | Fully sufficient |
| remark-math + rehype-katex | ^6.0.0 / ^7.0.1 | Math formulas (if citing statistical formulas) | Available, unlikely needed |
| reading-time | ^1.5.0 | Reading time calculation | Fully sufficient |
| satori + sharp | ^0.19.2 / ^0.34.5 | OG image generation | Fully sufficient |

### GFM Footnotes (Built-In, Not Yet Used)

Astro's `@astrojs/mdx` integration enables `remark-gfm` by default (configurable via `gfm: false`, which is NOT set in this project). This means GFM-style footnotes already work in MDX files without any configuration changes:

```markdown
Dark code accounts for an estimated 30-50% of production systems[^1].

[^1]: Stripe, "Developer Coefficient," 2018. Estimated $85B annually in developer time lost to bad code.
```

No existing blog posts on the site use footnotes, so this will be a first use. The footnotes render at the bottom of the post with automatic back-references. The `remarkRehype` config can optionally customize the footnote section label (e.g., `footnoteLabel: 'References'`), but the default "Footnotes" label is acceptable for a blog post.

**Confidence:** HIGH -- verified remark-gfm is a direct dependency of @astrojs/mdx in the lockfile, and the `gfm` option defaults to `true` per Astro docs.

### Why NOT rehype-citation

`rehype-citation` (v2.3.1, last published March 2025) is a rehype plugin that processes BibTeX files and renders academic-style citations with CSL formatting (APA, Chicago, etc.). It is overkill for this use case because:

1. **Dark Code is a thought-leadership piece, not an academic paper.** Formal bibliography with BibTeX `.bib` files adds complexity without matching the tone.
2. **GFM footnotes achieve the same goal** (linking claims to sources) with zero additional dependencies.
3. **The existing blog has no citation infrastructure.** Adding rehype-citation would introduce a new content pattern that no other post uses, creating maintenance divergence.
4. **Bundle impact.** rehype-citation pulls in `@citation-js/core` and CSL processing -- unnecessary weight for inline references.

Use GFM footnotes for data citations. If a future post requires formal academic citation (DOIs, bibliography sections), revisit rehype-citation at that point.

## New Components to Build (Zero Dependencies)

The post needs two new Astro components plus one optional component. These follow the existing component pattern established by `Callout.astro`, `KeyTakeaway.astro`, `TldrSummary.astro`, etc. All use Tailwind classes with CSS custom properties, `not-prose` to escape typography defaults, and `<slot />` for content projection.

### 1. StatCallout Component

**Purpose:** Visually prominent inline statistic with source attribution. Used when citing a specific number that anchors an argument (e.g., "85 billion dollars lost annually").

```astro
---
interface Props {
  stat: string;       // "85B" or "73%"
  label: string;      // "lost annually to technical debt"
  source?: string;    // "Stripe, 2018"
}
---
```

**Design rationale:** Thought-leadership posts use "big number" callouts to break up prose and give readers anchoring data points. The existing `Callout` component is for informational asides; `StatCallout` is specifically for quantitative claims that need visual weight.

**Styling approach:** Uses existing Tailwind typography plugin and CSS custom properties (`--color-accent`, `--color-surface-alt`, `--color-text-secondary`). Large stat number in `font-heading` (Bricolage Grotesque), label in body font (DM Sans), source attribution in small muted text below.

### 2. PullQuote Component

**Purpose:** Full-width emphasized quotation pulled from the article text or attributed to an external source. Different from the existing `Lede` component (which is a styled lead paragraph) and `OpeningStatement` (which is a centered opening line).

```astro
---
interface Props {
  author?: string;     // Attribution (omit for self-quotes)
  cite?: string;       // Source title
}
---
```

**Design rationale:** The existing `Lede` component renders as a left-bordered italic block -- appropriate for subheading-style lead text but not for pull quotes. A `PullQuote` should be visually distinct: centered, larger text, decorative quotation marks, optional attribution. This is a standard long-form editorial pattern that the site currently lacks.

**Note on blockquote mapping:** MDX allows mapping standard Markdown `>` blockquotes to a custom component via the `components` export. However, for this post it is better to use explicit `<PullQuote>` imports rather than overriding the global blockquote element. Reason: blockquotes serve multiple purposes in Markdown (actual quotes, indented commentary, email-style references), and hijacking all of them for pull-quote styling would break any standard blockquote usage in other posts.

### 3. CitedParagraph Component (Optional)

**Purpose:** A paragraph wrapper that visually connects a claim to its source, useful for paragraphs that synthesize data from a specific report or study.

```astro
---
interface Props {
  source: string;      // "McKinsey Digital, 2023"
  href?: string;       // Optional link to source
}
---
```

**Design rationale:** This is a "nice to have" rather than essential. GFM footnotes handle citation linking. But for a thought-leadership piece with heavy data sourcing, having a visual indicator that "this paragraph's claims come from X" improves scannability. If the post ends up using fewer than 3-4 cited sources, skip this component and use footnotes exclusively.

## Existing Components to Reuse

These components from `src/components/blog/` are directly applicable to the Dark Code post:

| Component | File | Use in Dark Code Post |
|-----------|------|----------------------|
| `TldrSummary` | `TldrSummary.astro` | Opening summary of key arguments |
| `KeyTakeaway` | `KeyTakeaway.astro` | End-of-section takeaway boxes (e.g., after each major Dark Code category) |
| `Callout` | `Callout.astro` | Informational asides, warnings, tips (types: info, warning, tip, important) |
| `OpeningStatement` | `OpeningStatement.astro` | Bold opening thesis statement |
| `Lede` | `Lede.astro` | Section lead-in text (italic, left-bordered) |
| `Figure` | `Figure.astro` | Any diagrams or illustrations with captions |

## Content Schema (No Changes Needed)

The existing blog content schema in `src/content.config.ts` supports all required frontmatter fields:

```typescript
z.object({
  title: z.string(),
  description: z.string(),
  publishedDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  coverImage: z.string().optional(),
  externalUrl: z.string().url().optional(),   // Not used (this is a local post)
  source: z.enum(['Kubert AI', 'Translucent Computing']).optional(), // Not used
})
```

No schema changes are needed. The `tags` field will use new tag values (e.g., `"technical-debt"`, `"code-quality"`, `"software-architecture"`, `"dark-code"`).

## Blog Post Page (Minor Addition Needed)

The `[slug].astro` page currently hardcodes FAQ JSON-LD and `articleSection` metadata for specific post slugs. For the Dark Code post, add:

- `articleSection`: "Software Engineering" or "Code Quality"
- Optional `FAQPageJsonLd` for SEO (3-5 FAQ entries about dark code)
- `aboutDataset`: Not applicable unless the post links to an interactive tool

This is a pattern already established in the codebase (see the cascading `isBeautyIndexPost`, `isK8sPost`, etc. conditionals). Follow the same pattern.

## Astro Config (No Changes Needed)

The `astro.config.mjs` already includes:
- `remarkReadingTime` -- will auto-calculate for the 3000-5000 word post (estimated 15-25 min read)
- `remarkMath` + `rehypeKatex` -- available if statistical formulas are needed
- `expressiveCode()` -- available for code block examples of "dark code"
- `sitemap` with blog post date extraction from frontmatter

No config changes required.

## Optional Footnote Label Customization

If "Footnotes" as a section heading feels too academic, customize it in `astro.config.mjs`:

```javascript
markdown: {
  remarkPlugins: [remarkReadingTime, remarkMath],
  rehypePlugins: [rehypeKatex],
  remarkRehype: {
    footnoteLabel: 'References',
    footnoteLabelTagName: 'h2',
  },
},
```

**Recommendation:** Keep the default "Footnotes" label. It is clear and widely understood. The `remarkRehype` options apply globally to all MDX/MD files, so changing the label affects every post, not just this one. If the label must differ per-post, handle it with CSS (`[data-footnotes] h2 { ... }`) rather than global config.

## Footnote Styling Consideration

GFM footnotes render with a default structure that uses `data-footnotes` attributes. The current Tailwind prose configuration styles links, blockquotes, and borders via CSS custom properties. Footnote styling will inherit from prose defaults, but may benefit from targeted CSS for:

- Footnote reference superscript numbers (size, color)
- Footnote section separator (the `<hr>` before footnotes)
- Back-reference arrows

This is CSS-only work within the existing `tailwind.config.mjs` typography configuration or a scoped style block in `[slug].astro`. No plugins needed.

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| rehype-citation | Academic citation tooling (BibTeX, CSL) is overkill for a blog post; adds ~200KB+ of dependencies | GFM footnotes (built-in) |
| remark-directive / remark-admonitions | Adds custom Markdown syntax (e.g., `:::callout`) that diverges from standard GFM; the site already uses JSX imports for callouts | Existing `<Callout>` component via MDX import |
| Custom remark plugin for statistics | Over-engineering; a simple Astro component with props achieves the same visual result without AST manipulation | `<StatCallout>` Astro component |
| rehype-autolink-headings | The site already has heading anchors via the `TableOfContents` component and prose styling | Existing TOC infrastructure |
| Markdown blockquote override | Hijacking `>` for pull quotes breaks standard blockquote usage across all posts | Explicit `<PullQuote>` component |
| Animated counter components (React) | Adds client-side JavaScript for a static content page; unnecessary hydration cost | Static `<StatCallout>` Astro component (zero JS) |

## Installation

```bash
# No new packages needed.
# All capabilities are already installed or achievable with zero-dependency Astro components.
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| GFM footnotes | rehype-citation | When building an academic publication with BibTeX bibliography, DOI resolution, and formal CSL formatting |
| Astro `<StatCallout>` component | React client-side counter component | When statistics need animated count-up effects on scroll (adds client JS; unnecessary for static content) |
| Explicit `<PullQuote>` import | MDX `components` export overriding `blockquote` | When every blog post should render all blockquotes as pull quotes (not the case here) |
| Tailwind prose styling | Custom CSS file | When typography needs exceed what @tailwindcss/typography provides (not the case here) |

## Stack Patterns for This Post

**For data citations:**
- Inline with GFM footnote syntax: `claim text[^1]` with `[^1]: source` at bottom
- For high-impact statistics: `<StatCallout stat="85B" label="lost annually" source="Stripe, 2018" />`

**For editorial emphasis:**
- Section takeaways: `<KeyTakeaway>` (existing)
- Opening thesis: `<OpeningStatement>` (existing)
- Pull quotes: `<PullQuote>` (new component, zero dependencies)
- Informational asides: `<Callout type="info|warning|tip|important">` (existing)

**For article structure:**
- TL;DR at top: `<TldrSummary>` (existing)
- Table of contents: Automatic via `TableOfContents` component in `[slug].astro`
- Reading time: Automatic via `remarkReadingTime` plugin

## Version Compatibility

No compatibility concerns. All recommended approaches use existing installed packages at their current versions.

| Component | Depends On | Notes |
|-----------|------------|-------|
| GFM footnotes | @astrojs/mdx ^4.3.13 (remark-gfm bundled) | Enabled by default, no config needed |
| StatCallout | Tailwind ^3.4.19, @tailwindcss/typography ^0.5.19 | Uses existing CSS custom properties |
| PullQuote | Tailwind ^3.4.19 | Uses existing CSS custom properties |
| Expressive Code blocks | astro-expressive-code ^0.41.6 | For Dark Code examples if applicable |

## Sources

- [Astro MDX Integration Docs](https://docs.astro.build/en/guides/integrations-guide/mdx/) -- verified GFM enabled by default in MDX, footnote support confirmed
- [Astro Markdown Content Docs](https://docs.astro.build/en/guides/markdown-content/) -- verified remarkRehype footnote customization options
- [remark-gfm on GitHub](https://github.com/remarkjs/remark-gfm) -- confirmed footnote syntax and back-reference behavior
- [rehype-citation on npm](https://www.npmjs.com/package/rehype-citation) -- evaluated and rejected (v2.3.1, March 2025)
- [rehype-citation on GitHub](https://github.com/timlrx/rehype-citation) -- reviewed BibTeX/CSL capabilities, confirmed overkill for blog use case
- Existing codebase: `astro.config.mjs`, `content.config.ts`, `package.json`, `tailwind.config.mjs`, `src/components/blog/*.astro`, `src/pages/blog/[slug].astro`, `src/data/blog/death-by-a-thousand-arrows.mdx` -- all reviewed directly

---
*Stack research for: Dark Code blog post on patrykgolabek.dev*
*Researched: 2026-04-14*
