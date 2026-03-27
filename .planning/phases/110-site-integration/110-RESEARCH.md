# Phase 110: Site Integration - Research

**Researched:** 2026-03-27
**Domain:** Astro static site integration (header nav, homepage card, sitemap, LLMs.txt, blog post, OG image)
**Confidence:** HIGH

## Summary

Phase 110 is a pure site-integration phase: no new libraries, no new infrastructure, no external APIs. All seven requirements (SITE-02 through SITE-07) are achieved by editing existing Astro files, creating a new blog post MDX file, and adding a new OG image endpoint -- all following patterns established across 100+ prior phases in this codebase.

The header navigation update is a one-line addition to the `navLinks` array in `src/components/Header.astro`. The homepage callout card follows the exact pattern of the existing Beauty Index, DB Compass, and EDA cards in the Reference Guides section of `src/pages/index.astro`. The sitemap automatically includes all AI landscape pages via `@astrojs/sitemap` auto-discovery, but needs a URL-pattern rule added to `astro.config.mjs` for correct priority/changefreq. The LLMs.txt and LLMs-full.txt updates are code edits adding an "AI Landscape" section following the same pattern as Beauty Index, DB Compass, and EDA sections. The blog post is a new `.mdx` file in `src/data/blog/`. The OG image is a new endpoint at `src/pages/open-graph/ai-landscape.png.ts` using the existing `generateAiLandscapeOgImage` pattern from `src/lib/og-image.ts` (or a new overview variant).

**Primary recommendation:** Follow existing patterns exactly. No new dependencies needed. Each requirement maps to 1-2 files touching well-established codepaths. The landing page at `/ai-landscape/index.astro` needs to pass the OG image URL to the Layout component (currently missing).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SITE-02 | Header navigation link for AI Landscape | Edit `src/components/Header.astro` -- add `{ href: '/ai-landscape/', label: 'AI Landscape' }` to `navLinks` array. Placement between 'EDA' and 'Guides' (alphabetically) or at a prominent position. |
| SITE-03 | Homepage callout card linking to AI Landscape | Edit `src/pages/index.astro` -- add a card to the Reference Guides grid following the Beauty Index/DB Compass/EDA card pattern. Needs a hero visual (SVG or gradient with cluster colors). |
| SITE-04 | All AI Landscape pages in sitemap | Automatic via `@astrojs/sitemap`. Edit `astro.config.mjs` serialize function to add `/ai-landscape/` URL pattern with appropriate priority (0.5) and changefreq ('monthly'). |
| SITE-05 | LLMs.txt entries for AI Landscape section | Edit `src/pages/llms.txt.ts` and `src/pages/llms-full.txt.ts` to add AI Landscape section with concept listing, VS comparisons, tours, and cluster information. |
| SITE-06 | Companion blog post about navigating the AI landscape for non-technical readers | New `src/data/blog/ai-landscape-explorer.mdx` following blog schema. Audience: non-technical readers. Cross-links to explorer and concept pages. |
| SITE-07 | Build-time OG image for landing page | New `src/pages/open-graph/ai-landscape.png.ts` endpoint. New `generateAiLandscapeLandingOgImage()` function in `src/lib/og-image.ts`. Landing page needs ogImage prop set. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | ^5.3.0 | Static site generator, page routing, content collections | Already installed, powers entire site |
| Satori | ^0.19.2 | OG image generation from JSX-like tree to SVG | Already installed, used by all OG endpoints |
| Sharp | ^0.34.5 | SVG-to-PNG conversion for OG images | Already installed, used by all OG endpoints |
| @astrojs/sitemap | ^3.7.0 | Automatic sitemap generation from all static pages | Already installed, configured in astro.config.mjs |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | -- | -- | All dependencies already present |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| N/A | N/A | All libraries already in place -- no alternatives needed |

**Installation:**
```bash
# No new installations required. All dependencies already present.
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    Header.astro                    # SITE-02: Edit navLinks array
  pages/
    index.astro                     # SITE-03: Edit Reference Guides section
    llms.txt.ts                     # SITE-05: Edit (add AI Landscape section)
    llms-full.txt.ts                # SITE-05: Edit (add AI Landscape section)
    ai-landscape/
      index.astro                   # SITE-07: Add ogImage prop to Layout
    open-graph/
      ai-landscape.png.ts           # SITE-07: New OG image endpoint
  lib/
    og-image.ts                     # SITE-07: New generateAiLandscapeLandingOgImage()
  data/
    blog/
      ai-landscape-explorer.mdx     # SITE-06: New companion blog post
astro.config.mjs                    # SITE-04: Edit sitemap serialize function
```

### Pattern 1: Header Navigation Link
**What:** Add an entry to the `navLinks` array in Header.astro
**When to use:** When a new top-level section needs global navigation
**Example:**
```typescript
// Source: src/components/Header.astro lines 7-18
const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/blog/', label: 'Blog' },
  { href: '/ai-landscape/', label: 'AI Landscape' },  // NEW
  { href: '/beauty-index/', label: 'Beauty Index' },
  { href: '/db-compass/', label: 'DB Compass' },
  { href: '/eda/', label: 'EDA' },
  { href: '/guides/', label: 'Guides' },
  { href: '/tools/', label: 'Tools' },
  { href: '/projects/', label: 'Projects' },
  { href: '/about/', label: 'About' },
  { href: '/contact/', label: 'Contact' },
];
```
**Note:** The header uses the same `navLinks` array for both desktop and mobile navigation, so one edit covers both. The `isActive` check uses `currentPath.startsWith(link.href)` for non-root links, so `/ai-landscape/` will correctly highlight for all sub-pages (concept pages, VS pages).

### Pattern 2: Homepage Reference Guide Card
**What:** An anchor card in the Reference Guides grid on the homepage
**When to use:** When a new content pillar needs homepage visibility
**Example:**
```astro
// Source: src/pages/index.astro Reference Guides section (pattern from Beauty Index card)
<a href="/ai-landscape/" class="block card-hover rounded-lg border border-[var(--color-border)] no-underline overflow-hidden" data-reveal data-tilt>
  <article>
    <div class="bg-[var(--color-surface-alt)] px-6 pt-6 pb-4 flex justify-center">
      <!-- Hero visual: either a decorative SVG/gradient using cluster colors,
           or an inline SVG with graph nodes motif -->
    </div>
    <div class="p-6 pt-4">
      <p class="meta-mono text-[var(--color-accent)]">51 Concepts</p>
      <h3 class="text-lg font-heading font-bold text-[var(--color-text-primary)] mt-2">AI Landscape Explorer</h3>
      <p class="text-sm text-[var(--color-text-secondary)] mt-2">
        Visual guide to artificial intelligence — from machine learning
        fundamentals to generative AI and agentic systems.
      </p>
      <span class="inline-block mt-4 text-sm font-medium text-[var(--color-accent)]">Explore the landscape &rarr;</span>
    </div>
  </article>
</a>
```
**Card hero visual options (Claude's discretion):**
1. **Inline SVG with colored dots** representing cluster colors in a node-graph motif — lightweight, no external file, visually hints at the graph visualization.
2. **Gradient with cluster accent colors** — simpler, using CSS gradients blending 2-3 of the cluster darkColors (e.g., `#00696e`, `#c62828`, `#4527a0`).
3. **Pre-built SVG** at `public/images/ai-landscape-hero.svg` — would need to be created separately.

**Recommendation:** Use option 1 (inline SVG) for consistency with how other cards use dedicated visuals, and because the node-graph motif directly previews what the user will find on the page. This can be a small function that generates an SVG string with colored circles and connecting lines, similar to how `generateEdaHeroSvg()` works for the EDA card.

### Pattern 3: Sitemap URL Pattern
**What:** Add an AI landscape rule to the sitemap serialize function
**When to use:** When new page sections need specific priority/changefreq
**Example:**
```typescript
// Source: astro.config.mjs serialize function (add before the else clause)
} else if (item.url.includes('/ai-landscape/')) {
  item.changefreq = 'monthly';
  item.priority = 0.5;
}
```
**Note:** The landing page, 51 concept pages, and 12 VS pages will all match this rule. The `@astrojs/sitemap` integration auto-discovers all static pages from `getStaticPaths`, so the ~64 AI landscape pages are already in the sitemap -- this rule just sets priority/changefreq.

### Pattern 4: LLMs.txt Section
**What:** Add a new top-level section to the dynamically generated llms.txt
**When to use:** When adding a new content section to the site
**Example for llms.txt:**
```typescript
// Source: Pattern from src/pages/llms.txt.ts (add after Claude Code Guide section, before Blog Posts)
// New import at top:
// import { conceptUrl, vsPageUrl } from '../lib/ai-landscape/routes';

'## AI Landscape Explorer',
'',
'Visual guide to 51 key concepts in artificial intelligence, from foundational machine learning to generative AI, agentic systems, and developer tools.',
'',
'- [AI Landscape Explorer](https://patrykgolabek.dev/ai-landscape/): Interactive graph visualization with 9 clusters and 51 concepts',
'',
'### Clusters',
'',
'- Artificial Intelligence (AI): 7 concepts including NLP, Computer Vision, Reinforcement Learning',
'- Machine Learning (ML): 5 concepts including Supervised, Unsupervised, Transfer Learning',
'- Neural Networks (NN): 4 concepts including CNNs, RNNs, Transformers',
'- Deep Learning (DL): 3 concepts including Foundation Models, Attention Mechanism',
'- Generative AI (GenAI): 8 concepts including LLMs, Diffusion Models, Fine-Tuning, RAG',
'- Agentic AI Paradigm: 5 concepts including Autonomy, Tool Use, MCP',
'- AI Developer Tools: 4 concepts including AI Coding Assistants, AI IDEs',
'- Levels of Intelligence: 3 concepts including ANI, AGI, ASI',
'- Model Context Protocol: 2 concepts including MCP Servers, MCP Clients',
'',
'### Popular Comparisons',
'',
...POPULAR_COMPARISONS.slice(0, 6).map(pair =>
  `- [${pair.question}](https://patrykgolabek.dev/ai-landscape/vs/${pair.slug}/): ${pair.summary}`
),
'',
```
**For llms-full.txt:** Expand with per-concept listings (all 51 nodes with slug URLs), all 12 VS comparisons, and full cluster breakdowns.

### Pattern 5: Blog Post MDX File
**What:** MDX file in `src/data/blog/` with frontmatter schema
**When to use:** Native blog posts (not external links)
**Required schema fields (from content.config.ts blog schema):**
- `title: string` (required)
- `description: string` (required)
- `publishedDate: date` (required)
- `tags: string[]` (defaults to [])
- `draft: boolean` (defaults to false)
- `coverImage: string` (optional)
- `externalUrl: string` (optional -- omit for native posts)
- `source: 'Kubert AI' | 'Translucent Computing'` (optional -- omit for native)

**Example frontmatter:**
```yaml
---
title: "Making Sense of the AI Landscape: A Visual Guide for Everyone"
description: "A visual guide to understanding artificial intelligence in 2026. 51 key concepts organized into 9 clusters, from machine learning basics to agentic AI and developer tools — explained for non-technical readers."
publishedDate: 2026-03-27
tags: ["ai", "artificial-intelligence", "machine-learning", "generative-ai", "visual-guide", "ai-landscape"]
draft: false
---
```
**Audience:** Non-technical readers. The success criteria specifies the blog post is about "navigating the AI landscape for non-technical readers." This means:
- Avoid jargon or define it when first used
- Use the `simpleDescription` from nodes, not `technicalDescription`
- Leverage the tours (The Big Picture, How ChatGPT Works, What is Agentic AI) as narrative structure
- Cross-link to concept pages (e.g., `/ai-landscape/machine-learning/`) throughout
- Cross-link to VS pages for common confusions (e.g., "AI vs ML: What's the Difference?")
- Reference the interactive explorer for deeper exploration

### Pattern 6: Landing Page OG Image
**What:** Astro API route returning a PNG via Satori + Sharp
**When to use:** Dedicated OG images for section landing pages
**Example:**
```typescript
// Source: Pattern from src/pages/open-graph/beauty-index.png.ts
import type { APIRoute } from 'astro';
import { generateAiLandscapeLandingOgImage } from '../../lib/og-image';

export const GET: APIRoute = async () => {
  const png = await generateAiLandscapeLandingOgImage();

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
```
**OG image design considerations:**
- The concept OG images use light background (`#faf8f5`) with cluster darkColor accent bar
- The VS OG images use dark background (`#0a0a0f`) to differentiate
- The landing page OG image should use light background (matching concept pages, not VS)
- Include cluster pills or colored dots to hint at the 9 clusters
- Include title "AI Landscape Explorer" and subtitle about 51 concepts
- Follow the 1200x630 standard with the site branding row (patrykgolabek.dev | Patryk Golabek)

**Landing page fix needed:** The current `src/pages/ai-landscape/index.astro` does NOT pass `ogImage` to the Layout component (line 43-46). Without it, the default OG image is used. Add:
```astro
<Layout
  title="AI Landscape Explorer: Visual Guide to Artificial Intelligence (2026) | Patryk Golabek"
  description="Explore the AI landscape — from machine learning to generative AI..."
  ogImage={new URL('/open-graph/ai-landscape.png', Astro.site).toString()}
  ogImageAlt="AI Landscape Explorer: 51 concepts across 9 clusters visualized as an interactive graph"
>
```

### Anti-Patterns to Avoid
- **Don't create a separate AI Landscape layout:** The landing page already uses the main `Layout` component. Keep it that way -- no EDALayout-style wrapper needed since AI landscape pages are simpler.
- **Don't hardcode node/concept counts:** Use dynamic data from the `aiLandscape` collection or `nodes.json` to derive counts (currently 51 concepts, 9 clusters, 12 VS comparisons).
- **Don't duplicate concept data in LLMs.txt:** Import from existing data sources (`getCollection('aiLandscape')`, `graphData.clusters`, `POPULAR_COMPARISONS`) rather than hardcoding concept names.
- **Don't create a new content collection for the blog post:** It is just an MDX file in `src/data/blog/` -- the existing `blog` collection auto-discovers it.
- **Don't add the nav link to a dropdown or submenu:** The header has no dropdown/submenu mechanism -- it is a flat list of links. Keep it flat.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| AI landscape concept data | Manual JSON in llms.txt | `getCollection('aiLandscape')` | 51 nodes with all metadata already in content collection |
| Cluster metadata | Hardcoded cluster names/colors | `graphData.clusters` from graph.json | 9 clusters with names, colors, darkColors, hierarchy |
| Comparison data | Hardcoded VS pairs | `POPULAR_COMPARISONS` from comparisons.ts | 12 curated pairs with slugs, questions, summaries |
| Tour narratives | Rewrite tour content | `TOURS` from tours.ts | 3 guided tours with node IDs and narratives |
| Concept URLs | String concatenation | `conceptUrl(slug)` from routes.ts | Centralized URL helper with trailing slash |
| VS page URLs | String concatenation | `vsPageUrl(slug)` from routes.ts | Centralized URL helper with trailing slash |
| OG image rendering | Custom Canvas/SVG pipeline | Satori + Sharp (existing pattern) | Battle-tested across 200+ OG images in this codebase |
| Sitemap generation | Manual XML | `@astrojs/sitemap` integration | Auto-discovers all static pages, only needs serialize rules |
| Nav active state | Custom JS tracking | Header.astro `currentPath.startsWith()` | Already handles sub-page highlighting for all nav links |

**Key insight:** This phase is 100% integration work. Every component already exists. The task is wiring existing pieces together in existing files plus one new blog post and one new OG image endpoint.

## Common Pitfalls

### Pitfall 1: Header Gets Too Wide on Medium Screens
**What goes wrong:** Adding "AI Landscape" (13 characters) to a header that already has 10 links can cause horizontal overflow on tablets/medium-width screens.
**Why it happens:** The header uses `hidden md:flex items-center gap-6` for desktop nav, and `md` breakpoint is 768px. With 11 links, the text may overflow.
**How to avoid:** Test at 768px-1024px widths after adding the link. If overflow occurs, options include: (a) shortening the label to "AI" or "AI Explorer", (b) reducing gap from gap-6 to gap-4, or (c) reducing font size at the md breakpoint. The mobile menu (below md) handles overflow automatically via vertical stacking.
**Warning signs:** Navigation wrapping to two lines or overflowing the container on iPad-sized screens.

### Pitfall 2: Homepage Grid Layout with 6 Cards
**What goes wrong:** The Reference Guides section currently has 5 cards in a `lg:grid-cols-3` grid. Adding a 6th card creates a perfect 2x3 layout on desktop, which looks good. But on `sm:grid-cols-2`, 6 cards = 3 rows, which may push content further down.
**Why it happens:** More cards = more vertical space on every breakpoint.
**How to avoid:** This is not actually a problem -- 6 cards in a 2-column or 3-column grid is balanced. The 5-card layout was already slightly asymmetric (3+2 on desktop). 6 cards (3+3) is more visually balanced. No action needed.
**Warning signs:** None -- this is an improvement.

### Pitfall 3: OG Image Not Set on Landing Page
**What goes wrong:** The landing page at `/ai-landscape/index.astro` currently does NOT pass `ogImage` to the Layout component. Even if we create the OG image endpoint, the page will still use the default OG image unless the Layout prop is set.
**Why it happens:** The concept pages and VS pages set `ogImage` correctly, but the landing page was created before the OG image endpoint existed.
**How to avoid:** Add `ogImage` and `ogImageAlt` props to the `<Layout>` component in `index.astro` when creating the OG image endpoint.
**Warning signs:** Social media shares of `/ai-landscape/` show the generic site OG image instead of the AI landscape one.

### Pitfall 4: LLMs.txt Collection Import Timing
**What goes wrong:** The `llms.txt.ts` GET function uses `getCollection()` which is async. Adding `getCollection('aiLandscape')` is straightforward, but the AI landscape nodes need to be grouped by cluster for meaningful output.
**Why it happens:** The raw collection returns flat nodes. Grouping by cluster requires importing `graphData.clusters` from graph.json.
**How to avoid:** Import both `getCollection('aiLandscape')` for node data and `graphData` from graph.json for cluster metadata and comparisons. Build a cluster-to-nodes map similar to how the landing page does it.
**Warning signs:** LLMs.txt showing ungrouped or poorly organized concept listings.

### Pitfall 5: Blog Post Date and Draft Status
**What goes wrong:** If `publishedDate` is set to a future date or `draft: true`, the blog post won't appear in production blog listings (the `getCollection` filter excludes drafts).
**Why it happens:** The blog collection filter in index.astro uses `data.draft !== true` in production.
**How to avoid:** Set `draft: false` and `publishedDate` to the current date (2026-03-27) or earlier.
**Warning signs:** Blog post builds but doesn't appear in the Latest Writing section or blog index.

### Pitfall 6: Sitemap Serialize Function Ordering
**What goes wrong:** The AI landscape URL pattern check must be placed correctly in the if/else chain in `astro.config.mjs`. If placed after the generic catch-all `else`, it will never match.
**Why it happens:** The serialize function uses if/else-if/else for URL pattern matching. Order matters.
**How to avoid:** Add the `/ai-landscape/` check before the final `else` block. Place it alongside the existing `/beauty-index/`, `/db-compass/`, `/eda/` check (line 100-101 of astro.config.mjs).
**Warning signs:** AI landscape pages getting default priority instead of the intended priority.

### Pitfall 7: Blog Post SEO Keywords
**What goes wrong:** The blog post targets non-technical readers but misses SEO keywords from the CLAUDE.md strategy (e.g., "AI/ML engineer", "artificial intelligence guide").
**Why it happens:** Writing for non-technical readers can drift away from keyword-rich content.
**How to avoid:** Naturally incorporate searchable terms: "artificial intelligence", "machine learning", "deep learning", "generative AI", "LLM", "ChatGPT", "AI landscape 2026", "AI guide for beginners". The CLAUDE.md SEO strategy requires keyword-rich content.
**Warning signs:** Blog post ranks poorly for AI-related search terms.

## Code Examples

Verified patterns from the existing codebase:

### Header Navigation Entry
```typescript
// Source: src/components/Header.astro
// Add after 'Blog' and before 'Beauty Index' for logical alphabetical placement
{ href: '/ai-landscape/', label: 'AI Landscape' },
```

### Sitemap AI Landscape Rule
```typescript
// Source: astro.config.mjs, inside serialize(item) function
// Add to the existing if/else chain alongside beauty-index/db-compass/eda
} else if (item.url.includes('/ai-landscape/')) {
  item.changefreq = 'monthly';
  item.priority = 0.5;
}
```
This matches all AI landscape pages: the landing page, 51 concept pages, and 12 VS comparison pages.

### LLMs.txt AI Landscape Section (minimal)
```typescript
// Source: Pattern from src/pages/llms.txt.ts
// Imports needed at top:
import { conceptUrl, vsPageUrl } from '../lib/ai-landscape/routes';
import { POPULAR_COMPARISONS } from '../lib/ai-landscape/comparisons';

// In GET function, add:
const aiNodes = await getCollection('aiLandscape');
const aiClusters = (await import('../data/ai-landscape/graph.json')).default.clusters;

// Add to lines array (after Claude Code Guide section, before Blog Posts):
'## AI Landscape Explorer',
'',
'Visual guide to 51 key concepts in artificial intelligence organized into 9 clusters.',
'',
'- [AI Landscape Explorer](https://patrykgolabek.dev/ai-landscape/): Interactive graph with guided tours',
'',
// List concepts by cluster
...aiClusters.flatMap(cluster => {
  const clusterNodes = aiNodes.filter(n => n.data.cluster === cluster.id);
  if (clusterNodes.length === 0) return [];
  return [
    `### ${cluster.name} (${clusterNodes.length} concepts)`,
    '',
    ...clusterNodes.map(n =>
      `- [${n.data.name}](https://patrykgolabek.dev${conceptUrl(n.data.slug)}): ${n.data.simpleDescription.slice(0, 120)}...`
    ),
    '',
  ];
}),
'### Popular Comparisons',
'',
...POPULAR_COMPARISONS.map(pair =>
  `- [${pair.question}](https://patrykgolabek.dev${vsPageUrl(pair.slug)}): ${pair.summary}`
),
```

### Landing Page OG Image Prop Fix
```astro
<!-- Source: src/pages/ai-landscape/index.astro -->
<!-- Change the <Layout> opening tag to include ogImage and ogImageAlt -->
<Layout
  title="AI Landscape Explorer: Visual Guide to Artificial Intelligence (2026) | Patryk Golabek"
  description="Explore the AI landscape — from machine learning to generative AI, agentic systems, and developer tools. Visual guide with 51 concepts explained simply and technically."
  ogImage={new URL('/open-graph/ai-landscape.png', Astro.site).toString()}
  ogImageAlt="AI Landscape Explorer: Visual guide to 51 AI concepts across 9 clusters"
>
```

### Blog Post Structure (Companion)
```markdown
---
title: "Making Sense of the AI Landscape: A Visual Guide for Everyone"
description: "A visual guide to understanding artificial intelligence in 2026. 51 key concepts across 9 clusters, from machine learning basics to generative AI and agentic systems."
publishedDate: 2026-03-27
tags: ["ai", "artificial-intelligence", "machine-learning", "generative-ai", "visual-guide", "ai-landscape"]
draft: false
---

[Intro: AI terminology is overwhelming. This visual guide cuts through the noise.]

## The Problem: AI Terminology Overload

[Why non-technical people struggle with AI terms. AI vs ML vs Deep Learning confusion.]

## How the AI Landscape Is Organized

[Describe the 9 clusters as nested categories. Use the hierarchy: AI > ML > NN > DL > GenAI.]
[Link to /ai-landscape/ explorer]

## Three Guided Tours

### Tour 1: The Big Picture
[Walk through the 7-step tour from AI to Agentic AI]
[Link concept pages along the way]

### Tour 2: How ChatGPT Works
[Trace the tech stack: AI > ML > NN > DL > Transformers > LLMs > Prompt Engineering]
[Explain each layer in simple terms]

### Tour 3: What Is Agentic AI
[From basic AI to autonomous agents]
[Link to /ai-landscape/agentic-ai/, /ai-landscape/tool-use/, /ai-landscape/model-context-protocol/]

## Common Confusions Cleared Up

[Use VS pages to address common misconceptions]
- AI vs Machine Learning: [link to vs page]
- Deep Learning vs Machine Learning: [link to vs page]
- Generative AI vs LLMs: [link to vs page]
- Fine-Tuning vs RAG: [link to vs page]

## How to Use the Explorer

[Explain the interactive graph, click to explore, guided tours, search]
[Link to /ai-landscape/]

## What's Next

[Brief note about the field evolving, how the explorer will be updated]
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual sitemap.xml | @astrojs/sitemap auto-generation | Astro 3+ | No manual XML needed for new pages |
| External OG image services | Satori + Sharp build-time generation | Project inception | Zero external dependencies for OG images |
| Separate blog CMS | Astro content collections from MDX files | Project inception | Blog posts are just MDX files with frontmatter |

**Deprecated/outdated:**
- Nothing relevant to this phase. All patterns are current.

## Open Questions

1. **Header navigation link placement and label**
   - What we know: The navLinks array is currently 10 items. Adding "AI Landscape" makes 11.
   - What's unclear: Whether 11 links will overflow on medium screens, and where exactly to place it.
   - Recommendation: Place after "Blog" and before "Beauty Index" for alphabetical consistency among reference content. Label: "AI Landscape". If overflow occurs at md breakpoint, shorten to "AI" or reduce gap spacing. Test at 768px width.

2. **Homepage card hero visual**
   - What we know: Each Reference Guides card has a unique visual in the top section. Beauty Index uses an SVG, DB Compass uses an SVG, EDA uses an inline-generated SVG via `generateEdaHeroSvg()`.
   - What's unclear: What visual to use for the AI Landscape card.
   - Recommendation: Generate an inline SVG function (similar to `generateEdaHeroSvg()`) that renders a small cluster of colored dots/circles connected by lines, using 4-5 of the cluster darkColors. This hints at the graph visualization and is lightweight (no external file). Alternatively, use a CSS gradient approach with cluster colors for simplicity.

3. **LLMs-full.txt depth for AI Landscape**
   - What we know: LLMs-full.txt includes expanded content for all sections (e.g., full justifications for Beauty Index, all chapters for guides).
   - What's unclear: How detailed the AI Landscape section should be. The full simpleDescription + technicalDescription for all 51 nodes would be substantial.
   - Recommendation: Include per-concept slug URLs and simpleDescriptions (truncated to ~200 chars) in llms.txt; include full simpleDescription + technicalDescription + whyItMatters in llms-full.txt. This mirrors the Beauty Index pattern where llms.txt has scores only and llms-full.txt has full justifications.

4. **Blog post length and tone**
   - What we know: Success criteria specifies "non-technical readers" as the audience. The blog must cross-link to the explorer and concept pages.
   - What's unclear: Exact length. Companion posts in this codebase range from 800 words (shorter) to 3000+ words (longer ones like EDA visual encyclopedia).
   - Recommendation: Target 1500-2000 words. The three guided tours provide natural narrative structure. Each tour section walks through concept pages with simple explanations, providing organic internal links. The "Common Confusions" section uses VS pages for additional cross-linking. This length supports SEO without being overwhelming for non-technical readers.

5. **OG image design for landing page**
   - What we know: Concept OG images use light bg with cluster-colored accent bar. VS OG images use dark bg. The landing page should be distinct from both.
   - What's unclear: Exact visual design.
   - Recommendation: Use light background (`#faf8f5`) with a multi-color accent bar (gradient of 3+ cluster darkColors). Include cluster name pills similar to how the EDA overview OG image uses category pills. Display "AI Landscape Explorer" as the title, "51 Concepts | 9 Clusters | Interactive Guide" as subtitle, and the standard branding row.

## Sources

### Primary (HIGH confidence)
- `src/components/Header.astro` -- Navigation link array structure (lines 7-18)
- `src/pages/index.astro` -- Homepage Reference Guides card grid pattern (lines 162-271)
- `astro.config.mjs` -- Sitemap serialize function with URL pattern rules (lines 76-112)
- `src/pages/llms.txt.ts` -- LLMs.txt generation with section-per-content-pillar pattern
- `src/pages/llms-full.txt.ts` -- Expanded LLMs.txt with full content per section
- `src/pages/ai-landscape/index.astro` -- Landing page (currently missing ogImage prop)
- `src/pages/open-graph/ai-landscape/[slug].png.ts` -- Concept OG image pattern
- `src/lib/og-image.ts` -- `generateAiLandscapeOgImage()` and `generateAiLandscapeVsOgImage()` functions
- `src/lib/ai-landscape/routes.ts` -- URL helpers (conceptUrl, vsPageUrl)
- `src/lib/ai-landscape/comparisons.ts` -- 12 curated VS comparison pairs
- `src/lib/ai-landscape/tours.ts` -- 3 guided tour definitions
- `src/lib/ai-landscape/schema.ts` -- AiNode, Cluster types
- `src/data/ai-landscape/graph.json` -- 9 clusters with colors
- `src/data/ai-landscape/nodes.json` -- 51 concept nodes
- `src/content.config.ts` -- Blog schema (title, description, publishedDate, tags, draft)
- `src/data/blog/eda-visual-encyclopedia.mdx` -- Companion blog post pattern
- `src/data/blog/claude-code-guide.mdx` -- Companion blog post pattern
- `.planning/phases/101-site-integration/101-RESEARCH.md` -- Prior site integration research

### Secondary (MEDIUM confidence)
- @astrojs/sitemap documentation: new static pages are auto-discovered for sitemap inclusion

### Tertiary (LOW confidence)
- None -- all findings are from direct codebase inspection

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and in use
- Architecture: HIGH -- every pattern has 1+ existing example in the codebase
- Pitfalls: HIGH -- identified from direct codebase inspection of existing integration patterns
- Blog content: MEDIUM -- tone and length for non-technical audience requires judgment, but schema and delivery mechanism are fully verified

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable patterns, no external dependencies)
