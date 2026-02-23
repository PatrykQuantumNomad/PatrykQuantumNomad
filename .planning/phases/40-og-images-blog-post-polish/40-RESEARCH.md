# Phase 40: OG Images, Blog Post & Polish - Research

**Researched:** 2026-02-22
**Domain:** Satori OG image generation, MDX blog content creation, bidirectional cross-linking, Lighthouse performance, WCAG accessibility
**Confidence:** HIGH

## Summary

Phase 40 is the final phase of the Docker Compose Validator milestone (v1.6). It requires three deliverables: (1) a build-time OG image for the Compose Validator tool page via the existing Satori + Sharp pipeline, (2) a companion blog post covering Docker Compose best practices and tool architecture as an MDX file in the blog content collection, and (3) bidirectional cross-links between the blog post and tool page, plus verification that all tool and rule pages maintain Lighthouse 90+ scores and pass WCAG 2.1 AA accessibility checks.

The project has a battle-tested OG image pipeline in `src/lib/og-image.ts` that has been used for blog posts, Beauty Index pages, Database Compass pages, and the Dockerfile Analyzer tool page. The Dockerfile Analyzer OG image (`generateDockerfileAnalyzerOgImage()`) is the exact pattern to follow -- it uses a two-column layout with title + description + category pills on the left and a stylized code panel on the right. The Compose Validator OG image should follow this same structure but with YAML code lines and the 5 Compose Validator categories (Schema, Security, Semantic, Best Practice, Style).

The blog post follows the established pattern from `dockerfile-best-practices.mdx` (308 lines) and `database-compass.mdx`. Blog posts live at `src/data/blog/` as MDX files, use the glob loader defined in `content.config.ts`, and support frontmatter fields including `title`, `description`, `publishedDate`, `tags`, `draft`, and optional `coverImage`. The blog post template at `src/pages/blog/[slug].astro` automatically generates OG images via the existing catch-all route at `src/pages/open-graph/[...slug].png.ts`, handles related post computation by tag overlap, and renders BlogPostingJsonLd + BreadcrumbJsonLd structured data.

The Compose Validator tool page (`src/pages/tools/compose-validator/index.astro`) currently lacks an `ogImage` prop on the Layout component, and its aside section only links to rule documentation -- it needs an additional link to the companion blog post. The Dockerfile Analyzer tool page demonstrates the exact aside pattern needed: a link to the "companion guide" blog post alongside the rule documentation link.

**Primary recommendation:** Add `generateComposeValidatorOgImage()` to `src/lib/og-image.ts` mirroring the Dockerfile Analyzer pattern with YAML code lines, create an API route at `src/pages/open-graph/tools/compose-validator.png.ts`, wire the `ogImage` prop on the tool page, create the blog post at `src/data/blog/docker-compose-best-practices.mdx`, add bidirectional cross-links, and verify Lighthouse + accessibility scores.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SITE-07 | Build-time OG image for tool page via Satori + Sharp | Existing `generateDockerfileAnalyzerOgImage()` in `og-image.ts` is the exact pattern; `renderOgPng()`, `accentBar()`, `brandingRow()` helpers exist; API route pattern at `src/pages/open-graph/tools/` established |
| CONTENT-01 | Companion blog post covering Docker Compose best practices and tool architecture | Blog content collection uses `src/data/blog/*.mdx` with glob loader; `dockerfile-best-practices.mdx` (308 lines) establishes structure, tone, and component usage; MDX components `OpeningStatement`, `TldrSummary`, `KeyTakeaway`, `Callout` available |
| CONTENT-02 | Bidirectional cross-links between blog post and tool page | Dockerfile Analyzer aside pattern shows blog link placement on tool page; blog post links back to tool page inline and in CTA section; `[slug].astro` auto-generates OG image and structured data |
</phase_requirements>

## Standard Stack

### Core (Already Installed -- Zero New Dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Satori | ^0.19.2 | HTML/CSS object trees to SVG for OG images | Already proven in `og-image.ts`; generates blog, Beauty Index, DB Compass, and Dockerfile Analyzer OG images |
| Sharp | ^0.34.5 | SVG to PNG rasterization | Already proven, pipeline established |
| Astro | ^5.3.0 | API routes, `getStaticPaths`, static page generation, MDX support | Framework for the entire site |
| @astrojs/mdx | (installed) | MDX blog posts with Astro component imports | Already used for all original blog posts |
| @astrojs/sitemap | (installed) | Automatic sitemap generation from all static pages | Already configured; new blog post URL auto-included |

### Project Libraries (Zero External Imports)
| Library | Purpose | Where Used |
|---------|---------|------------|
| `src/lib/og-image.ts` | `renderOgPng()`, `accentBar()`, `brandingRow()`, font loading | All OG image generation |
| `src/content.config.ts` | Blog content collection with glob loader for `src/data/blog/*.mdx` | Blog post auto-discovery |

### Fonts Available for Satori
| Font | Weight | File | Usage |
|------|--------|------|-------|
| Inter | 400 | `src/assets/fonts/Inter-Regular.woff` | Body text in OG images |
| Space Grotesk | 700 | `src/assets/fonts/SpaceGrotesk-Bold.woff` | Headings in OG images |

### MDX Blog Components Available
| Component | Import Path | Purpose |
|-----------|------------|---------|
| `OpeningStatement` | `../../components/blog/OpeningStatement.astro` | Bold opening line below frontmatter |
| `TldrSummary` | `../../components/blog/TldrSummary.astro` | TL;DR bullet summary box |
| `KeyTakeaway` | `../../components/blog/KeyTakeaway.astro` | Highlighted takeaway callout |
| `Callout` | `../../components/blog/Callout.astro` | General callout box |

**Installation:**
```bash
# No new packages needed. All tools are already installed.
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  lib/
    og-image.ts                                    # [MODIFY] Add generateComposeValidatorOgImage()
  pages/
    open-graph/
      tools/
        compose-validator.png.ts                   # [NEW] OG image API route
    tools/
      compose-validator/
        index.astro                                # [MODIFY] Add ogImage prop + blog aside link
  data/
    blog/
      docker-compose-best-practices.mdx            # [NEW] Companion blog post
```

### Pattern 1: Tool OG Image Generator (mirrors Dockerfile Analyzer)
**What:** A function in `og-image.ts` that generates a branded 1200x630 OG image with a two-column layout: title + description + category pills on the left, stylized code panel on the right.
**When to use:** Build-time OG image for the Compose Validator tool page.
**Example:**
```typescript
// Source: src/lib/og-image.ts (existing generateDockerfileAnalyzerOgImage pattern)
export async function generateComposeValidatorOgImage(): Promise<Buffer> {
  const categories = ['Schema', 'Security', 'Semantic', 'Best Practice', 'Style'];

  const categoryPills = {
    type: 'div',
    props: {
      style: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
      children: categories.map((name) => ({
        type: 'div',
        props: {
          style: {
            fontSize: '14px',
            color: '#c44b20',
            backgroundColor: 'rgba(196,75,32,0.1)',
            borderRadius: '20px',
            padding: '4px 14px',
          },
          children: name,
        },
      })),
    },
  };

  // YAML code panel with docker-compose lines + markers
  const codeLines = [
    { keyword: 'services:', rest: '', marker: null },
    { keyword: '  web:', rest: '', marker: null },
    { keyword: '    image:', rest: 'nginx:latest', marker: 'warning' },
    { keyword: '    ports:', rest: '"80:80"', marker: 'error' },
    { keyword: '    privileged:', rest: 'true', marker: 'error' },
  ];

  // ... two-column layout with accentBar(), brandingRow(), code panel
  // Follows generateDockerfileAnalyzerOgImage() structure exactly
  return renderOgPng(layout);
}
```

### Pattern 2: OG Image API Route (static, no getStaticPaths needed)
**What:** An Astro API route that calls the generator and returns a PNG with cache headers.
**When to use:** Single tool page (not dynamic routes).
**Example:**
```typescript
// Source: src/pages/open-graph/tools/dockerfile-analyzer.png.ts (existing pattern)
import type { APIRoute } from 'astro';
import { generateComposeValidatorOgImage } from '../../../lib/og-image';

export const GET: APIRoute = async () => {
  const png = await generateComposeValidatorOgImage();
  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
```

### Pattern 3: Wiring ogImage on Tool Page
**What:** Pass the `ogImage` prop to the Layout component with the absolute URL to the OG image.
**When to use:** Every page that should show a custom social preview.
**Example:**
```astro
<!-- Source: src/pages/tools/dockerfile-analyzer/index.astro (existing pattern) -->
<Layout
  title="Docker Compose Validator | Patryk Golabek"
  description="Free Docker Compose validator..."
  ogImage={new URL('/open-graph/tools/compose-validator.png', Astro.site).toString()}
  ogImageAlt="Docker Compose Validator -- browser-based compose file linter with 52 rules across schema, security, semantic, best-practice, and style categories"
>
```

### Pattern 4: Blog Post with Cross-Links (mirrors dockerfile-best-practices.mdx)
**What:** MDX blog post that covers tool-adjacent best practices and links to the tool and individual rule documentation pages.
**When to use:** Companion blog posts for tools.
**Example frontmatter:**
```yaml
---
title: "Docker Compose Best Practices From a Kubernetes Architect"
description: "A production-tested guide to writing secure, efficient Docker Compose files. 52 rules explained with real-world consequences and fix examples. Try the free browser-based validator."
publishedDate: 2026-02-23
tags: ["docker", "docker-compose", "kubernetes", "devops", "cloud-native", "security", "containers"]
draft: false
---
```

### Pattern 5: Bidirectional Cross-Links
**What:** The tool page aside links to the blog post, and the blog post links to the tool page inline and at the end.
**When to use:** Every tool + companion blog post pair.

**Tool page aside (add to compose-validator/index.astro):**
```astro
<!-- Source: src/pages/tools/dockerfile-analyzer/index.astro (existing pattern) -->
<aside class="mt-8 p-4 rounded-lg border border-[var(--color-border)]">
  <p class="text-sm text-[var(--color-text-secondary)]">
    Want to learn the rules in depth? Read the
    <a href="/blog/docker-compose-best-practices/" class="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors font-medium">
      companion guide: Docker Compose Best Practices
    </a>
    or browse
    <a href="/tools/compose-validator/rules/cv-c001/" class="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors font-medium">
      individual rule documentation
    </a>.
  </p>
</aside>
```

**Blog post inline link:**
```markdown
I wrote the rules down. Then I turned them into a [validator you can run right now](/tools/compose-validator/).
```

**Blog post CTA section:**
```markdown
## Start Validating

The [Docker Compose Validator](/tools/compose-validator/) is free, private, and instant.
Paste your docker-compose.yml, read the results, and follow the links to individual
rule documentation pages for detailed fix guidance.
```

### Anti-Patterns to Avoid
- **Not wiring ogImage prop:** The Layout component defaults to `/open-graph/default.png` -- the generic fallback. Every tool page MUST pass a custom `ogImage` prop.
- **Blog slug mismatch:** The aside link on the tool page MUST use the exact slug that matches the blog post filename. If the file is `docker-compose-best-practices.mdx`, the URL is `/blog/docker-compose-best-practices/`.
- **OG image without ogImageAlt:** Always provide `ogImageAlt` for accessibility. SEOHead.astro uses it for `og:image:alt` and `twitter:image:alt`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OG image generation | Custom canvas/image library | Satori + Sharp via `renderOgPng()` | Established pipeline, font loading cached, branding helpers exist |
| Blog post rendering | Custom MDX pipeline | Astro content collection with glob loader | Auto-discovery, frontmatter validation, OG image generation, related posts |
| Social meta tags | Manual meta tag insertion | SEOHead.astro via Layout props | All og:*, twitter:*, article:* handled; just pass ogImage/ogImageAlt |
| Sitemap inclusion | Manual sitemap entries | @astrojs/sitemap | Auto-includes all static pages; zero config needed |
| Blog OG images | Separate blog OG route | `src/pages/open-graph/[...slug].png.ts` | Catch-all route already generates OG images for all blog posts |
| Structured data | Manual JSON-LD | BlogPostingJsonLd.astro + BreadcrumbJsonLd.astro | Blog post template auto-includes; just needs correct frontmatter |

**Key insight:** This phase requires zero new libraries. Every capability is already built and proven across previous milestones. The work is: (1) add one function to `og-image.ts`, (2) create one API route, (3) modify one Astro page, (4) write one MDX file, and (5) verify Lighthouse/accessibility scores.

## Common Pitfalls

### Pitfall 1: OG Image YAML Code Panel Font Rendering
**What goes wrong:** YAML syntax has significant whitespace (indentation), and Satori uses proportional fonts by default. If the code panel uses Inter for YAML, indentation looks wrong.
**Why it happens:** Satori supports only the fonts you explicitly load. There is no monospace font loaded in the current pipeline.
**How to avoid:** The Dockerfile Analyzer OG image code panel uses Inter (proportional) and it works fine because the code is short and decorative, not meant to be readable. Follow the same approach -- short decorative YAML lines where exact indentation does not matter visually.
**Warning signs:** Code panel looks misaligned or squished.

### Pitfall 2: Blog Post Slug vs. Cross-Link URL Mismatch
**What goes wrong:** The tool page aside links to `/blog/compose-best-practices/` but the blog post file is named `docker-compose-best-practices.mdx`, resulting in a 404.
**Why it happens:** Astro's glob loader uses the filename (without extension) as the content ID, which becomes the URL slug.
**How to avoid:** Choose the slug first, then use it consistently. The filename IS the slug. If the file is `docker-compose-best-practices.mdx`, the URL is `/blog/docker-compose-best-practices/`.
**Warning signs:** Build succeeds but aside link returns 404 at runtime.

### Pitfall 3: Missing ogImage Prop on Tool Page
**What goes wrong:** Sharing the tool page URL on social media shows the generic default OG image instead of the custom one.
**Why it happens:** The Layout component has a default: `ogImage = new URL('/open-graph/default.png', Astro.site)`. If you create the OG image API route but forget to pass the `ogImage` prop on the tool page, the default is used.
**How to avoid:** After creating the OG image route, immediately update the tool page's Layout component to pass `ogImage`.
**Warning signs:** `astro build` succeeds, but opening the page source shows `og:image` pointing to `default.png`.

### Pitfall 4: Blog Post OG Image Cache Busting
**What goes wrong:** Social media platforms cache OG images aggressively. If you update the blog post and its OG image, platforms may show the old version.
**Why it happens:** The blog OG image route uses `Cache-Control: public, max-age=31536000, immutable`. Social platforms (Twitter, LinkedIn, Facebook) cache the first OG image they fetch.
**How to avoid:** Add a cache-busting query parameter to the ogImage URL in the blog template. The existing pattern in `[slug].astro` already does this: `ogImageURL = new URL('/open-graph/blog/' + post.id + '.png?cb=20260216', Astro.site).toString()`. Blog posts get this automatically.
**Warning signs:** Updated blog post shows old OG image on social media. Use Twitter Card Validator or Facebook Debugger to refresh.

### Pitfall 5: Lighthouse Performance Regression from OG Image Route
**What goes wrong:** OG image generation adds build time but should NOT affect runtime performance since images are pre-rendered at build time.
**Why it happens:** Confusion between build-time and runtime. OG images are static files served by the CDN; they do not affect page load metrics.
**How to avoid:** OG images are generated at build time only. The PNG file is served as a static asset. No client-side JavaScript, no runtime rendering.
**Warning signs:** None expected for runtime. Build time may increase by a few seconds.

### Pitfall 6: Blog Post Content Too Short or Too Long
**What goes wrong:** A blog post that is too short (under 1000 words) provides minimal SEO value. One that is too long (over 5000 words) may have poor engagement metrics.
**Why it happens:** No clear target word count.
**How to avoid:** Target 2000-3000 words, matching `dockerfile-best-practices.mdx` (~308 lines, ~2500 words). Cover each of the 5 rule categories with 2-3 highlighted rules per category, include before/after YAML examples, explain the tool architecture briefly, and end with a CTA linking to the tool.
**Warning signs:** Blog post feels like it is either padding content or rushing through rules.

## Code Examples

Verified patterns from the existing codebase:

### Compose Validator OG Image Generator (based on Dockerfile Analyzer pattern)
```typescript
// Source: src/lib/og-image.ts -- generateDockerfileAnalyzerOgImage() as template
// Key differences for Compose Validator:
// 1. Title: "Docker Compose Validator" instead of "Dockerfile Analyzer"
// 2. Description: "Free browser-based Docker Compose linter..."
// 3. Categories: ['Schema', 'Security', 'Semantic', 'Best Practice', 'Style']
// 4. Code panel: YAML lines instead of Dockerfile instructions
//    - YAML keywords (services:, image:, ports:) in blue (#7aa2f7)
//    - Values in light gray (#a9b1d6)
//    - Error/warning markers for security violations
// 5. Uses renderOgPng(), accentBar(), brandingRow() helpers (existing)
```

### OG Image API Route
```typescript
// Source: src/pages/open-graph/tools/dockerfile-analyzer.png.ts (exact pattern)
import type { APIRoute } from 'astro';
import { generateComposeValidatorOgImage } from '../../../lib/og-image';

export const GET: APIRoute = async () => {
  const png = await generateComposeValidatorOgImage();
  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
```

### Blog Post Frontmatter Structure
```yaml
# Source: src/data/blog/dockerfile-best-practices.mdx (frontmatter pattern)
---
title: "Docker Compose Best Practices From a Kubernetes Architect"
description: "A production-tested guide to writing secure, efficient Docker Compose files. 52 rules explained with real-world consequences and fix examples. Try the free browser-based validator."
publishedDate: 2026-02-23
tags: ["docker", "docker-compose", "kubernetes", "devops", "cloud-native", "security", "containers"]
draft: false
---
```

### Blog Post Structure (content outline based on dockerfile-best-practices.mdx)
```mdx
---
[frontmatter as above]
---

import OpeningStatement from '../../components/blog/OpeningStatement.astro';
import TldrSummary from '../../components/blog/TldrSummary.astro';
import KeyTakeaway from '../../components/blog/KeyTakeaway.astro';
import Callout from '../../components/blog/Callout.astro';

<OpeningStatement>Most docker-compose.yml files in production have at least five preventable issues. I built a tool to find all of them.</OpeningStatement>

[Opening paragraphs: context, experience, why compose files matter]

I wrote the rules down. Then I turned them into a [validator you can run right now](/tools/compose-validator/).

<TldrSummary>
- **52 rules** across **5 categories**: Schema, Security, Semantic, Best Practice, Style
- Scoring: **0-100** with letter grades, category-weighted by production impact
- **100% client-side** -- your compose file never leaves your browser
- Interactive dependency graph visualizes service relationships
- Try it now: [Docker Compose Validator](/tools/compose-validator/)
</TldrSummary>

## Why Your Docker Compose File Matters
[Why compose files are critical infrastructure]

## Security Rules: The Non-Negotiables
[2-3 key security rules with before/after YAML: privileged mode, Docker socket, secrets in env]
- Link to rules: [CV-C001](/tools/compose-validator/rules/cv-c001/)

## Semantic Rules: Catching What Humans Miss
[2-3 key semantic rules: circular deps, undefined refs, port conflicts]
- Link to rules: [CV-M001](/tools/compose-validator/rules/cv-m001/)

## Best Practice Rules: Production Readiness
[2-3 key best practice rules: healthchecks, resource limits, restart policies]
- Link to rules: [CV-B001](/tools/compose-validator/rules/cv-b001/)

## Schema Rules: Structural Correctness
[Brief coverage of schema validation against compose-spec]

## How the Validator Works
[Brief architecture: YAML 1.1 parser, Ajv schema validation, rule engine, scoring, dependency graph]

## Start Validating
[CTA with link to /tools/compose-validator/]
```

### Modified Tool Page Aside (bidirectional cross-link)
```astro
<!-- Source: src/pages/tools/dockerfile-analyzer/index.astro (pattern to follow) -->
<!-- Replace existing aside with one that links to both blog and rule docs -->
<aside class="mt-8 p-4 rounded-lg border border-[var(--color-border)]">
  <p class="text-sm text-[var(--color-text-secondary)]">
    Want to learn the rules in depth? Read the
    <a href="/blog/docker-compose-best-practices/" class="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors font-medium">
      companion guide: Docker Compose Best Practices
    </a>
    or browse
    <a href="/tools/compose-validator/rules/cv-c001/" class="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors font-medium">
      individual rule documentation
    </a>.
  </p>
</aside>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Generic default OG image for all pages | Per-page custom OG images via Satori + Sharp | Phase 7 (v1.0) onwards | Each page has branded social preview |
| Manually referencing blog posts | Content collection with glob loader + auto OG | Phase 7 (v1.0) onwards | Blog posts auto-get OG images, structured data, related posts |
| No tool-blog cross-linking | Bidirectional aside + inline links | Phase 25 (Dockerfile Analyzer) | SEO value flows between blog post and tool page |

**No deprecated or outdated patterns to avoid.** The OG image pipeline, blog content collection, and cross-linking patterns are all current and proven across multiple milestones.

## Open Questions

1. **Blog post cover image**
   - What we know: The `coverImage` field is optional in blog frontmatter. `dockerfile-best-practices.mdx` does NOT use a coverImage. `database-compass.mdx` DOES use one (`/images/database-compass-blog-cover.svg`).
   - What's unclear: Whether the Compose Validator blog post should have a cover image.
   - Recommendation: Skip the cover image, matching the Dockerfile Analyzer blog post pattern. The OG image serves the social preview purpose; a cover image adds visual noise to a technical guide.

2. **Lighthouse CI automation**
   - What we know: There is no automated Lighthouse CI in the project. The success criteria mention "Lighthouse 90+ scores and WCAG 2.1 AA accessibility checks" but this is verified manually.
   - What's unclear: Whether automated Lighthouse CI should be set up.
   - Recommendation: Verify manually with Chrome DevTools Lighthouse after build. Setting up Lighthouse CI is out of scope for this phase. The site has maintained 90+ scores throughout all milestones.

3. **Blog post tags optimization**
   - What we know: Related posts are computed by tag overlap. The Dockerfile Analyzer blog post uses tags: `["docker", "kubernetes", "devops", "cloud-native", "security", "containers"]`.
   - What's unclear: Optimal tag overlap for cross-linking between the two blog posts.
   - Recommendation: Use tags `["docker", "docker-compose", "kubernetes", "devops", "cloud-native", "security", "containers"]` -- all Dockerfile tags plus "docker-compose". This maximizes tag overlap so the two posts appear as related posts for each other.

## Sources

### Primary (HIGH confidence)
- `src/lib/og-image.ts` -- Existing OG image pipeline with `generateDockerfileAnalyzerOgImage()`, `renderOgPng()`, `accentBar()`, `brandingRow()` (read directly from codebase)
- `src/pages/open-graph/tools/dockerfile-analyzer.png.ts` -- OG image API route pattern (read directly)
- `src/pages/tools/dockerfile-analyzer/index.astro` -- Tool page with ogImage prop and blog aside pattern (read directly)
- `src/pages/tools/compose-validator/index.astro` -- Current tool page without ogImage prop or blog aside (read directly)
- `src/data/blog/dockerfile-best-practices.mdx` -- Companion blog post pattern: frontmatter, structure, tone, components, cross-links (read directly)
- `src/data/blog/database-compass.mdx` -- Alternative blog post pattern with cover image (read directly)
- `src/content.config.ts` -- Blog content collection definition with glob loader (read directly)
- `src/pages/blog/[slug].astro` -- Blog rendering template with OG image wiring, structured data, related posts (read directly)
- `src/components/SEOHead.astro` -- SEO meta tag generation including og:image, twitter:card (read directly)
- `src/layouts/Layout.astro` -- Layout component with ogImage default fallback (read directly)
- `.planning/phases/32-og-images-site-integration/32-RESEARCH.md` -- Prior OG image research for Database Compass (read directly)
- `.planning/phases/18-og-images-shareability/18-RESEARCH.md` -- Original OG image research for Beauty Index (read directly)
- `src/lib/tools/compose-validator/types.ts` -- ComposeCategory type: 'schema' | 'security' | 'semantic' | 'best-practice' | 'style' (read directly)
- `src/lib/tools/compose-validator/rules/index.ts` -- 52 total rules (44 custom + 8 schema) (read directly)

### Secondary (MEDIUM confidence)
- `package.json` -- Satori ^0.19.2, Sharp ^0.34.5 versions confirmed (read directly)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Zero new dependencies; all libraries already installed and proven across 4 prior OG image implementations
- Architecture: HIGH -- Every pattern (OG generator, API route, ogImage prop, blog post, cross-links) has been implemented at least twice before in this codebase
- Pitfalls: HIGH -- Documented from actual patterns observed in prior phases; all mitigations are established practices
- Blog content: MEDIUM -- Content structure is clear from prior blog posts, but the actual content (Docker Compose best practices) needs to be written to match the quality level of `dockerfile-best-practices.mdx`

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (stable -- no dependency changes expected)
