# Phase 7: Enhanced Blog + Advanced SEO - Research

**Researched:** 2026-02-11
**Domain:** Blog discoverability (tags, ToC, OG images), advanced SEO (LLMs.txt, GEO), Lighthouse performance
**Confidence:** HIGH

## Summary

Phase 7 covers six requirements spanning three domains: blog enhancements (tag pages, table of contents), dynamic OG image generation (Satori + Sharp), and advanced SEO (LLMs.txt, GEO optimization, Lighthouse 90+). The existing codebase is well-structured for these additions -- content collections already have `tags` in the schema, the `SEOHead` component already handles OG meta (missing `og:image`), and the site uses Astro 5 static output which naturally scores well on Lighthouse.

The highest-risk item is dynamic OG image generation with Satori + Sharp. Satori converts JSX-like objects to SVG, then Sharp converts SVG to PNG at build time. This requires downloading font files (TTF/OTF, not WOFF2) since Satori cannot use web fonts. Each OG image takes roughly 1 second to generate, adding linear build time. The approach is well-documented across the Astro community with dozens of production implementations.

**Primary recommendation:** Implement tag pages and ToC first (straightforward Astro patterns), then OG image generation (most complex), then LLMs.txt and GEO (content/configuration work), finishing with a Lighthouse audit pass.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| satori | ^0.18.3 | Convert JSX objects to SVG | Vercel-maintained, de facto standard for programmatic OG images |
| sharp | ^0.34.5 | Convert SVG to PNG | 29M+ weekly npm downloads, fastest Node.js image processing |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none needed) | - | Tag pages | Built-in Astro `getStaticPaths` + `getCollection` |
| (none needed) | - | Table of contents | Built-in Astro `render()` returns `headings` array |
| (none needed) | - | LLMs.txt | Static file at `src/pages/llms.txt.ts` API route |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| satori + sharp (manual) | `astro-og-canvas` integration | Less control over design, but simpler setup. Manual approach recommended for full branding control |
| satori-html (HTML strings) | Plain JSX objects to satori | satori-html is 3 years stale (v0.3.2). Use plain JSX object syntax directly -- more reliable, no extra dependency |
| remark-toc (plugin) | Manual `getHeadings()` from render() | remark-toc injects TOC into markdown content itself. Manual approach via `render()` gives full control over TOC placement and styling as a separate component |
| rehype-slug | Astro built-in heading IDs | Astro already generates heading IDs via github-slugger by default. No plugin needed |

**Installation:**
```bash
npm install satori sharp
```

No other new dependencies required. Tag pages, ToC, and LLMs.txt use built-in Astro APIs.

## Architecture Patterns

### Recommended Project Structure
```
src/
  pages/
    blog/
      [slug].astro            # existing - add ToC + og:image meta
      index.astro             # existing - no changes
      tags/
        [tag].astro            # NEW - tag listing page
    open-graph/
      [...slug].png.ts         # NEW - OG image API endpoint
    llms.txt.ts                # NEW - LLMs.txt API endpoint
  components/
    TableOfContents.astro      # NEW - ToC component
    SEOHead.astro              # existing - add og:image + twitter:image
  assets/
    fonts/
      Inter-Regular.ttf        # NEW - downloaded for Satori (body font)
      SpaceGrotesk-Bold.ttf    # NEW - downloaded for Satori (heading font)
  lib/
    og-image.ts                # NEW - OG image generation utility
```

### Pattern 1: Tag Pages with getStaticPaths
**What:** Dynamic route at `/blog/tags/[tag]/` generates a page per unique tag
**When to use:** Content collections with tag arrays in frontmatter
**Example:**
```typescript
// Source: Astro docs - dynamic routing
// src/pages/blog/tags/[tag].astro
---
import { getCollection } from 'astro:content';
import Layout from '../../../layouts/Layout.astro';
import BlogCard from '../../../components/BlogCard.astro';

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => {
    return import.meta.env.PROD ? data.draft !== true : true;
  });

  const uniqueTags = [...new Set(posts.flatMap((post) => post.data.tags))];

  return uniqueTags.map((tag) => ({
    params: { tag },
    props: {
      tag,
      posts: posts
        .filter((post) => post.data.tags.includes(tag))
        .sort((a, b) => b.data.publishedDate.valueOf() - a.data.publishedDate.valueOf()),
    },
  }));
}

const { tag, posts } = Astro.props;
---
```

### Pattern 2: Table of Contents from render() headings
**What:** Extract headings from rendered markdown to build a navigable ToC
**When to use:** Blog posts with multiple headings (h2-h4)
**Example:**
```typescript
// Source: Astro docs - Markdown getHeadings
// In [slug].astro
const { Content, headings, remarkPluginFrontmatter } = await render(post);
// headings = [{ depth: 2, slug: 'the-three-pillars', text: 'The Three Pillars of Observability' }, ...]

// TableOfContents.astro
---
interface Props {
  headings: { depth: number; slug: string; text: string }[];
  minDepth?: number;
  maxDepth?: number;
}
const { headings, minDepth = 2, maxDepth = 3 } = Astro.props;
const filtered = headings.filter((h) => h.depth >= minDepth && h.depth <= maxDepth);
---
{filtered.length > 1 && (
  <nav aria-label="Table of contents">
    <ul>
      {filtered.map((heading) => (
        <li style={`margin-left: ${(heading.depth - minDepth) * 1}rem`}>
          <a href={`#${heading.slug}`}>{heading.text}</a>
        </li>
      ))}
    </ul>
  </nav>
)}
```

### Pattern 3: OG Image Generation via API Endpoint
**What:** Astro static API endpoint that generates PNG images at build time
**When to use:** Every blog post needs a unique OG image
**Example:**
```typescript
// Source: Multiple Astro + Satori tutorials (verified pattern)
// src/pages/open-graph/[...slug].png.ts
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { generateOgImage } from '../../lib/og-image';

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection('blog', ({ data }) => {
    return import.meta.env.PROD ? data.draft !== true : true;
  });

  return posts.map((post) => ({
    params: { slug: `blog/${post.id}` },
    props: {
      title: post.data.title,
      description: post.data.description,
      tags: post.data.tags,
    },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const png = await generateOgImage(props.title, props.description, props.tags);
  return new Response(png, {
    headers: { 'Content-Type': 'image/png' },
  });
};
```

### Pattern 4: OG Image Utility with Satori + Sharp
**What:** Core utility that converts JSX-like objects to PNG via SVG intermediate
**Key constraints:** Satori uses JSX object syntax (NOT HTML strings), requires TTF/OTF font files, supports only Flexbox layout, 1200x630 dimensions standard
**Example:**
```typescript
// Source: Satori GitHub README + community patterns
// src/lib/og-image.ts
import satori from 'satori';
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';

let interFont: Buffer;
let spaceGroteskFont: Buffer;

async function loadFonts() {
  if (!interFont) {
    interFont = await readFile('./src/assets/fonts/Inter-Regular.ttf');
    spaceGroteskFont = await readFile('./src/assets/fonts/SpaceGrotesk-Bold.ttf');
  }
}

export async function generateOgImage(
  title: string,
  description: string,
  tags: string[] = []
): Promise<Buffer> {
  await loadFonts();

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: '#0a0a1a',
          padding: '60px',
          fontFamily: 'Inter',
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                fontSize: '42px',
                fontWeight: 700,
                color: '#e8e8f0',
                fontFamily: 'Space Grotesk',
                lineHeight: 1.2,
                marginBottom: '20px',
              },
              children: title,
            },
          },
          {
            type: 'div',
            props: {
              style: {
                fontSize: '20px',
                color: '#9898b8',
                lineHeight: 1.5,
                marginBottom: '30px',
              },
              children: description,
            },
          },
          // ... tags and branding elements
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Inter', data: interFont, weight: 400, style: 'normal' },
        { name: 'Space Grotesk', data: spaceGroteskFont, weight: 700, style: 'normal' },
      ],
    }
  );

  return await sharp(Buffer.from(svg)).png().toBuffer();
}
```

### Pattern 5: LLMs.txt as Astro API Endpoint
**What:** Static endpoint that serves an LLM-friendly markdown summary
**When to use:** Sites wanting AI-powered discovery
**Example:**
```typescript
// Source: llmstxt.org specification
// src/pages/llms.txt.ts
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

export async function GET(context: APIContext) {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const sortedPosts = posts.sort(
    (a, b) => b.data.publishedDate.valueOf() - a.data.publishedDate.valueOf()
  );

  const lines = [
    '# Patryk Golabek',
    '',
    '> Cloud-Native Software Architect with 17+ years in Kubernetes, AI/ML systems, platform engineering, and DevSecOps. Ontario, Canada.',
    '',
    '## Blog Posts',
    '',
    ...sortedPosts.map(
      (p) => `- [${p.data.title}](https://patrykgolabek.dev/blog/${p.id}/): ${p.data.description}`
    ),
    '',
    '## Optional',
    '',
    '- [Projects](https://patrykgolabek.dev/projects/): Featured open-source projects and work',
    '- [About](https://patrykgolabek.dev/about/): Background and experience',
    '- [Contact](https://patrykgolabek.dev/contact/): Get in touch',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
```

### Anti-Patterns to Avoid
- **Using satori-html:** The package is 3 years unmaintained (v0.3.2). Use plain JSX object syntax directly with satori -- it is more reliable and has no dependency risk.
- **Using WOFF2 fonts with Satori:** Satori does NOT support WOFF2 format. Must use TTF or OTF files. Download from Google Fonts or the font's official source.
- **Inline remark-toc plugin for ToC:** Injects the ToC directly into the markdown rendered output, giving no control over styling or placement. Use `render()` headings array for a standalone component.
- **Hardcoding tag lists:** Tags should be derived dynamically from content collection data, not maintained as a separate list.
- **Using `post.slug` in Astro 5:** The `slug` property was removed in Astro 5. Use `post.id` for URLs and path generation.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Heading ID generation | Custom slug function | Astro built-in (github-slugger) | Already generates IDs on headings automatically |
| SVG to PNG conversion | Canvas-based rendering | sharp | Battle-tested, handles edge cases, 29M+ weekly downloads |
| HTML to SVG | Custom renderer | satori | Handles text wrapping, line breaking, font metrics correctly |
| RSS feed | Custom XML builder | @astrojs/rss (already installed) | Already implemented in codebase |
| Sitemap | Custom generation | @astrojs/sitemap (already installed) | Already configured |
| Tag URL slugification | Custom slug function | Direct tag string in URL | Tags are simple strings; use encodeURIComponent if needed |

**Key insight:** The heaviest lift (OG image generation) is already solved by satori + sharp. Everything else uses built-in Astro APIs that require zero new dependencies.

## Common Pitfalls

### Pitfall 1: Satori Font Format Incompatibility
**What goes wrong:** OG images fail to render or show fallback font
**Why it happens:** Satori requires TTF or OTF font files. WOFF2 (the format served by Google Fonts CDN) is NOT supported. The site currently uses Google Fonts via CDN `<link>` tags.
**How to avoid:** Download Inter, Space Grotesk, and optionally JetBrains Mono as TTF files from Google Fonts. Store in `src/assets/fonts/`. Load via `readFile()` at build time.
**Warning signs:** Blank text in generated images, "could not load font" errors during build.

### Pitfall 2: Satori CSS Limitations
**What goes wrong:** OG image layout breaks or looks wrong
**Why it happens:** Satori supports ONLY Flexbox layout (no Grid, no `calc()`, no `z-index`, no advanced CSS). All positioning must use `display: 'flex'` and flex properties.
**How to avoid:** Design OG image template using only flexbox. Test in Satori Playground (https://og-playground.vercel.app/) before coding. Keep design simple -- title, description, author, tags, branding.
**Warning signs:** Elements overlapping, text not wrapping, background not rendering.

### Pitfall 3: OG Image Build Time Impact
**What goes wrong:** Build time increases significantly
**Why it happens:** Each OG image takes ~1 second to generate. With 50 posts, that is 50 extra seconds.
**How to avoid:** This is acceptable for a personal blog with moderate post count. Cache fonts in module scope (load once, reuse). Keep image dimensions at 1200x630 (the standard). If build time becomes an issue, consider generating only for posts that changed.
**Warning signs:** Build time exceeding 2+ minutes for a small blog.

### Pitfall 4: Missing og:image Meta Tags
**What goes wrong:** Social sharing shows no image preview
**Why it happens:** The current `SEOHead.astro` has no `og:image` or `twitter:image` meta tags. Generating images without referencing them in HTML is useless.
**How to avoid:** Update `SEOHead.astro` to accept an `ogImage` prop. Set `twitter:card` to `summary_large_image` (currently `summary`). Ensure the URL is absolute (full `https://` URL, not relative).
**Warning signs:** Images exist in build output but social media previews show no image.

### Pitfall 5: Tag Page URL Encoding
**What goes wrong:** Tags with spaces or special characters produce broken URLs
**Why it happens:** Tags like "cloud-native" are fine, but "AI/ML" would break a URL path.
**How to avoid:** Either constrain tags to URL-safe kebab-case strings in the content schema, or apply URL encoding. Since existing tags are `["kubernetes", "observability", "cloud-native", "devops"]` (all safe), this is low risk currently. Add a validation note for future content authors.
**Warning signs:** 404s on tag pages, broken links in tag lists.

### Pitfall 6: ToC Display for Short Posts
**What goes wrong:** ToC shows for posts with only 1-2 headings, adding visual clutter
**Why it happens:** No minimum threshold for showing the ToC
**How to avoid:** Only render the ToC when there are 2+ qualifying headings (h2-h3). The component should check `filtered.length > 1` before rendering.
**Warning signs:** Single-item ToC on short posts, looking out of place.

### Pitfall 7: Lighthouse Font Loading Penalty
**What goes wrong:** Lighthouse performance drops below 90 due to font loading
**Why it happens:** The current site loads 3 Google Fonts via external `<link>` tag, which is render-blocking and adds DNS resolution + download time.
**How to avoid:** Use `font-display: swap` (currently not explicitly set in the CSS link). Consider self-hosting fonts via `@font-face` in global CSS for better control. Preconnect hints are already present (good).
**Warning signs:** LCP > 2.5s, "Eliminate render-blocking resources" in Lighthouse report.

### Pitfall 8: LLMs.txt Content Staleness
**What goes wrong:** LLMs.txt becomes outdated as content changes
**Why it happens:** If hardcoded instead of dynamically generated
**How to avoid:** Generate from content collection data at build time (as shown in the pattern above). Every `astro build` produces a fresh llms.txt.
**Warning signs:** New blog posts not appearing in llms.txt.

## Code Examples

Verified patterns from official sources:

### Updating SEOHead for OG Images
```typescript
// Source: Open Graph protocol + existing SEOHead.astro
// Add to SEOHead.astro Props interface:
interface Props {
  title: string;
  description: string;
  canonicalURL?: URL | string;
  ogType?: 'website' | 'article';
  ogImage?: string;           // NEW - absolute URL to OG image
  publishedDate?: Date;
  updatedDate?: Date;
  tags?: string[];
}

// Add to template (after existing og: meta tags):
{ogImage && (
  <>
    <meta property="og:image" content={ogImage} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:type" content="image/png" />
  </>
)}

// Update twitter:card when image present:
<meta name="twitter:card" content={ogImage ? "summary_large_image" : "summary"} />
{ogImage && <meta name="twitter:image" content={ogImage} />}
```

### Tag Links in Blog Post (update existing spans to links)
```astro
<!-- Source: existing [slug].astro tag display, updated to link -->
{tags.map((tag) => (
  <a
    href={`/blog/tags/${tag}/`}
    class="text-xs px-2 py-1 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 transition-colors"
  >
    {tag}
  </a>
))}
```

### Computing OG Image URL for Blog Posts
```typescript
// Source: community pattern, adapted for this codebase
// In [slug].astro:
const ogImageURL = new URL(`/open-graph/blog/${post.id}.png`, Astro.site).toString();

// Pass to Layout:
<Layout
  title={`${title} - Patryk Golabek`}
  description={description}
  ogType="article"
  ogImage={ogImageURL}
  publishedDate={publishedDate}
  updatedDate={post.data.updatedDate}
  tags={tags}
>
```

### robots.txt Update for LLMs.txt Discovery
```
User-agent: *
Allow: /
Sitemap: https://patrykgolabek.dev/sitemap-index.xml
```
Note: LLMs.txt does not require a robots.txt entry. AI crawlers discover it by convention at `/llms.txt`, similar to how browsers discover `/favicon.ico`.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Static OG images (one per site) | Dynamic per-post OG images via Satori | 2023+ | Each blog post gets a unique, branded social preview |
| satori-html for HTML string input | Plain JSX object syntax | 2024+ | satori-html unmaintained; JSX objects are the recommended approach |
| Manual robots.txt for AI | LLMs.txt alongside robots.txt | 2024+ | Complements robots.txt with AI-specific content discovery |
| Traditional SEO only | GEO (Generative Engine Optimization) | 2024-2025 | Content structured for AI citation, not just search ranking |
| `post.slug` in Astro | `post.id` in Astro 5 | Astro 5 (2024) | slug property removed from content collections |

**Deprecated/outdated:**
- **satori-html:** Last published 3 years ago (v0.3.2). Use direct JSX objects instead.
- **`post.slug`:** Removed in Astro 5. Use `post.id` (already handled in codebase).

## GEO Optimization Specifics

GEO (Generative Engine Optimization) is about structuring content so AI engines (ChatGPT, Perplexity, Claude, Google AI Overviews) can extract and cite it. For a personal portfolio/blog:

### Technical Implementation
1. **Schema markup already in place:** BlogPostingJsonLd and PersonJsonLd components exist. Verify they include all recommended fields.
2. **Answer-first content structure:** Opening 40-60 words should directly answer the post's core question.
3. **Self-contained H2 sections:** Each section should be independently extractable as a citation.
4. **Fact density:** One statistic or data point every 150-200 words in blog content.
5. **Author E-E-A-T signals:** About page with credentials, blog posts with author attribution (already present via PersonJsonLd).

### Actionable Steps for This Site
- Ensure all blog posts follow answer-first structure in the opening paragraph
- Add `dateModified` to BlogPostingJsonLd (already handled via `updatedDate`)
- Add `image` property to BlogPostingJsonLd schema (OG image URL)
- Verify About page has detailed credentials and expertise signals
- Ensure external citations in blog posts link to authoritative sources
- Add `keywords` meta tag (low effort, potential signal) from post tags

### Content Structure Template for Future Posts
```markdown
---
title: "Direct Answer Headline"
description: "40-60 word summary that directly answers the core question"
---

[Direct answer in first 40-60 words]

## [Topic Section - Self-Contained]
[Complete explanation, readable independently]

## [Supporting Evidence]
[Statistics, citations, examples]
```

**Confidence:** MEDIUM - GEO is an emerging field. Best practices are based on research papers (Princeton GEO study) and industry recommendations, not confirmed AI engine behavior. The implementations above are low-cost and align with good SEO practices regardless.

## LLMs.txt Specification Details

Based on the official specification at llmstxt.org:

### Required Structure
1. **H1 heading** (required): Project/site name
2. **Blockquote** (optional): Brief summary with key context
3. **Body text** (optional): Additional context paragraphs
4. **H2 sections** (optional): Organized resource lists with markdown links
5. **## Optional section** (special): URLs that can be skipped for shorter context

### Format Rules
- Plain Markdown (not HTML, not XML)
- Links formatted as `- [Name](URL): Description`
- The `## Optional` section heading has special meaning (skippable content)
- Served at `/llms.txt` root path
- Content-Type: `text/plain; charset=utf-8`

### Adoption Status
Over 844,000 websites implemented as of October 2025. Major adopters include Anthropic (Claude docs), Cloudflare, and Stripe. However, no major AI platform has officially confirmed they read these files. Implementation is low-cost and future-facing.

**Confidence:** HIGH for format specification, MEDIUM for actual utility/impact.

## Lighthouse Performance Strategy

The site is already well-positioned for Lighthouse 90+ due to Astro's static output and zero-JS-by-default architecture. Key areas to audit and optimize:

### Current State Assessment
- **Static HTML output:** Excellent baseline (no server-side rendering overhead)
- **Minimal JavaScript:** Only inline scripts (theme toggle, typing animation, scroll reveal)
- **External font loading:** Google Fonts via `<link>` tag -- potential LCP bottleneck
- **No image optimization:** No `<Image>` component usage (no images on site currently)
- **Preconnect hints:** Already present for Google Fonts (good)

### Optimization Checklist
1. **Font loading:** Verify `font-display: swap` is applied via Google Fonts URL parameter (`&display=swap`). The current URL includes `display=swap` -- confirmed good.
2. **Eliminate render-blocking resources:** The Google Fonts `<link>` is render-blocking. Consider preloading the CSS. Alternatively, self-host fonts for maximum control.
3. **Accessibility:** Verify color contrast ratios (especially `--color-text-secondary` on `--color-surface`), ARIA labels, heading hierarchy, and focus indicators.
4. **Best Practices:** Ensure HTTPS, no console errors, no deprecated APIs, proper `meta` viewport.
5. **SEO checklist:** Meta description on all pages (already done), canonical URLs (done), sitemap (done), robots.txt (done). Add structured data validation.
6. **CLS prevention:** The typing animation in the hero could cause layout shift if the text changes width. Use `min-width` or fixed container width.
7. **New OG images impact:** Generated PNG images are served as static files. They do NOT affect page load performance (only loaded by social media crawlers via meta tags).

### Performance Budget
- **LCP target:** < 2.5s (Astro static sites typically achieve < 1s)
- **FID target:** < 100ms (minimal JS means near-zero FID)
- **CLS target:** < 0.1 (watch the typing animation)
- **Total JS:** Currently minimal; keep it that way

**Confidence:** HIGH - Astro static sites consistently score 90+ on Lighthouse. The main risks are font loading and accessibility, not architecture.

## Open Questions

1. **Font file licensing for OG images**
   - What we know: Inter, Space Grotesk, and JetBrains Mono are all open-source (OFL license) and freely downloadable as TTF
   - What's unclear: Whether Google Fonts download URLs are stable for CI/CD
   - Recommendation: Download TTF files once and commit to `src/assets/fonts/`. OFL license allows redistribution.

2. **OG image caching strategy**
   - What we know: Images are generated at build time and served as static files. Social platforms cache OG images aggressively.
   - What's unclear: If a post title changes, the old cached image may persist on social platforms for days/weeks.
   - Recommendation: Accept this as a known limitation. Include cache-busting only if it becomes a problem.

3. **Default OG image for non-blog pages**
   - What we know: Blog posts will get dynamic OG images. The homepage, about, projects, contact pages currently have no OG image.
   - What's unclear: Whether to generate OG images for these too or use a static default.
   - Recommendation: Create one static default OG image for non-blog pages (simpler). Blog posts get dynamic images. The endpoint can be extended later for other pages.

4. **Tag page SEO value**
   - What we know: Tag pages create additional indexable pages with focused keyword content.
   - What's unclear: Whether thin tag pages (1-2 posts) provide SEO benefit or get flagged as low-quality.
   - Recommendation: Generate tag pages regardless of post count. Add `noindex` only if the blog scales to have tags with zero meaningful content. Not a concern at current scale.

## Sources

### Primary (HIGH confidence)
- [Astro Docs - Markdown Content](https://docs.astro.build/en/guides/markdown-content/) - getHeadings() API, heading ID generation, rehype plugins
- [Astro Docs - Dynamic Routing](https://docs.astro.build/en/guides/routing/) - getStaticPaths for tag pages
- [Astro Docs - Tag Pages Tutorial](https://docs.astro.build/en/tutorial/5-astro-api/2/) - Official tag page implementation pattern
- [Satori GitHub README](https://github.com/vercel/satori) - Supported CSS, limitations, font requirements, API
- [llmstxt.org](https://llmstxt.org/) - Official LLMs.txt specification
- [sharp official site](https://sharp.pixelplumbing.com/) - Installation, API reference

### Secondary (MEDIUM confidence)
- [Static OG Images in Astro (arne.me)](https://arne.me/blog/static-og-images-in-astro/) - Complete Satori + Sharp build-time pattern
- [Generate OG Images with Astro and Satori (jafaraziz.com)](https://www.jafaraziz.com/blog/generate-open-graph-images-with-astro-and-satori/) - Detailed endpoint implementation
- [AstroPaper OG Image Generation](https://astro-paper.pages.dev/posts/dynamic-og-image-generation-in-astropaper-blog-posts/) - Build time impact (~1s per image)
- [Complete GEO Guide (frase.io)](https://www.frase.io/blog/what-is-generative-engine-optimization-geo) - GEO implementation practices
- [Astro Performance Optimization Guide (eastondev.com)](https://eastondev.com/blog/en/posts/dev/20251202-astro-performance-optimization/) - Lighthouse optimization techniques
- [What Is llms.txt (semrush.com)](https://www.semrush.com/blog/llms-txt/) - Adoption status and practical guidance

### Tertiary (LOW confidence)
- GEO best practices are based on emerging research and industry speculation, not confirmed AI engine behavior. Treat as directional guidance.

## Metadata

**Confidence breakdown:**
- Standard stack (satori + sharp): HIGH - well-documented, widely used, Vercel-maintained
- Tag pages: HIGH - official Astro tutorial pattern, exact match to codebase conventions
- Table of contents: HIGH - built-in Astro `render()` API returns headings array
- OG image generation: HIGH - dozens of production Astro implementations documented
- LLMs.txt: HIGH for format spec, MEDIUM for actual impact on AI discovery
- GEO optimization: MEDIUM - emerging field, recommendations align with good SEO regardless
- Lighthouse 90+: HIGH - Astro static sites inherently score well; main work is audit + minor fixes

**Research date:** 2026-02-11
**Valid until:** 2026-04-11 (90 days -- satori and Astro APIs are stable)
