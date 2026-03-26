# Phase 103: SEO Concept Pages - Research

**Researched:** 2026-03-26
**Domain:** Astro SSG dynamic routes, JSON-LD structured data, build-time OG image generation
**Confidence:** HIGH

## Summary

Phase 103 generates individual `/ai-landscape/[slug]/` pages for all 51 AI concept nodes from Phase 102's content collection. The codebase already has mature, well-established patterns for every component of this phase: dynamic `getStaticPaths()` routes from content collections (beauty-index, db-compass, EDA), BreadcrumbJsonLd Astro component, satori + sharp OG image pipeline, and the Layout/SEOHead infrastructure for meta tags. The main novelty is the JSON-LD `DefinedTerm` type (new to this codebase) and the ancestry breadcrumb derived from `parentId` + cluster hierarchy in graph.json.

The data layer from Phase 102 provides everything needed: `nodes.json` (51 concepts with slug, name, cluster, parentId, simpleDescription, technicalDescription, whyItMatters, examples) and `graph.json` (9 clusters with colors, 66 edges with labeled types). The `getNodeRelationships()` helper already exists in `src/lib/ai-landscape/schema.ts` for computing parents/children/related edges. Cluster color lookup requires importing `graph.json` directly.

**Primary recommendation:** Follow the exact patterns established by `src/pages/beauty-index/[slug].astro` and `src/pages/db-compass/[slug].astro` for page structure, and extend `src/lib/og-image.ts` with a new `generateAiLandscapeOgImage()` function using the existing `renderOgPng()` helper. Use the existing `BreadcrumbJsonLd.astro` component and create a new `DefinedTermJsonLd.astro` component following the same pattern as `BlogPostingJsonLd.astro`.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEO-01 | Individual /ai-landscape/[slug] page for each of the ~80 concepts | Dynamic route with `getStaticPaths()` from `aiLandscape` collection. Currently 51 nodes exist (not 80 -- requirements pre-date data authoring). Pattern proven by beauty-index (26 pages), db-compass (12 pages), EDA techniques (29 pages). |
| SEO-02 | Each concept page shows full explanation (both tiers), ancestry breadcrumb, related concepts, and link back to graph | Node data has `simpleDescription`, `technicalDescription`, `whyItMatters`, `examples`. `getNodeRelationships()` provides related concepts. Ancestry derived from `parentId` chain + cluster hierarchy in `graph.json`. |
| SEO-03 | JSON-LD DefinedTerm + BreadcrumbList structured data on each concept page | `BreadcrumbJsonLd.astro` exists and is reusable. New `DefinedTermJsonLd.astro` component needed -- schema.org DefinedTerm type with `inDefinedTermSet` pointing to `/ai-landscape/`. |
| SEO-04 | Build-time OG image per concept (shared template with concept name + cluster color) | satori 0.19.2 + sharp 0.34.5 already in dependencies. `renderOgPng()` helper in `og-image.ts` handles font loading and SVG-to-PNG conversion. New endpoint at `src/pages/open-graph/ai-landscape/[slug].png.ts`. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- SEO & visibility are primary goals -- keyword-rich content, structured formatting, backlinks
- Professional but approachable tone, first person, concise, confident
- Astro site at patrykgolabek.dev with static output (SSG)
- GitHub-flavored Markdown compatible formatting
- Tailwind CSS for styling
- TypeScript throughout

## Standard Stack

### Core (already installed -- no new dependencies needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | 5.17.1 | Static site generator, content collections, dynamic routes | Project framework |
| satori | 0.19.2 | HTML/CSS to SVG conversion for OG images | Already used in 15+ OG generators in `og-image.ts` |
| sharp | 0.34.5 | SVG to PNG conversion for OG images | Already paired with satori throughout |
| tailwindcss | 3.4.19 | Page styling | Project standard |
| zod (via astro) | built-in | Schema validation for content collections | Already used for `aiNodeSchema` |

### Supporting (already installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @astrojs/sitemap | 3.7.0 | Auto-generates sitemap including new pages | Pages auto-discovered |

### No New Dependencies

This phase requires zero new npm packages. All tooling is already in the codebase.

## Architecture Patterns

### Recommended Project Structure
```
src/
  pages/
    ai-landscape/
      [slug].astro             # Dynamic concept pages (SEO-01, SEO-02)
  pages/
    open-graph/
      ai-landscape/
        [slug].png.ts          # OG image endpoint (SEO-04)
  components/
    ai-landscape/
      DefinedTermJsonLd.astro  # JSON-LD DefinedTerm (SEO-03)
      AncestryBreadcrumb.astro # Visual breadcrumb trail (SEO-02)
      RelatedConcepts.astro    # Related concepts sidebar/section (SEO-02)
  lib/
    ai-landscape/
      schema.ts                # Existing: types + getNodeRelationships()
      routes.ts                # NEW: URL helper functions (conceptUrl, ogImageUrl)
      ancestry.ts              # NEW: Build ancestry chain from parentId + clusters
```

### Pattern 1: Dynamic Route from Content Collection
**What:** Use `getStaticPaths()` with `getCollection('aiLandscape')` to generate one page per concept
**When to use:** Always -- this is the standard Astro pattern for collection-driven pages
**Example:**
```typescript
// Source: Verified pattern from src/pages/beauty-index/[slug].astro
import { getCollection } from 'astro:content';
import graphData from '../../data/ai-landscape/graph.json';

export async function getStaticPaths() {
  const nodes = await getCollection('aiLandscape');
  const clusters = new Map(graphData.clusters.map(c => [c.id, c]));

  return nodes.map((entry) => ({
    params: { slug: entry.data.slug },
    props: {
      node: entry.data,
      cluster: clusters.get(entry.data.cluster),
      edges: graphData.edges,
    },
  }));
}
```

### Pattern 2: JSON-LD Component as Astro Component
**What:** Create a reusable Astro component that renders `<script type="application/ld+json">` with structured data
**When to use:** For every type of structured data -- one component per schema.org type
**Example:**
```typescript
// Source: Verified pattern from src/components/BreadcrumbJsonLd.astro
---
interface Props {
  name: string;
  description: string;
  url: string;
  termSetUrl: string;
  termSetName: string;
}

const { name, description, url, termSetUrl, termSetName } = Astro.props;

const schema = {
  "@context": "https://schema.org",
  "@type": "DefinedTerm",
  "name": name,
  "description": description,
  "url": url,
  "inDefinedTermSet": {
    "@type": "DefinedTermSet",
    "name": termSetName,
    "url": termSetUrl,
  },
};
---

<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

### Pattern 3: Build-Time OG Image with Satori
**What:** Add a `generateAiLandscapeOgImage()` function to `og-image.ts` and a corresponding API route
**When to use:** For per-concept OG images with cluster color accent
**Example:**
```typescript
// Source: Verified pattern from src/pages/open-graph/beauty-index/[slug].png.ts
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { generateAiLandscapeOgImage } from '../../../lib/og-image';

export const getStaticPaths: GetStaticPaths = async () => {
  const nodes = await getCollection('aiLandscape');
  return nodes.map((entry) => ({
    params: { slug: entry.data.slug },
    props: { node: entry.data },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const { node } = props;
  const png = await generateAiLandscapeOgImage(node.name, node.cluster);
  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
```

### Pattern 4: Ancestry Chain Computation
**What:** Walk `parentId` chain to build visual breadcrumb trail from concept back to root
**When to use:** For the ancestry breadcrumb required by SEO-02
**Example:**
```typescript
// NEW utility in src/lib/ai-landscape/ancestry.ts
import type { AiNode } from './schema';

export interface AncestryItem {
  slug: string;
  name: string;
  cluster: string;
}

export function buildAncestryChain(
  nodeSlug: string,
  nodesMap: Map<string, AiNode>,
): AncestryItem[] {
  const chain: AncestryItem[] = [];
  let current = nodesMap.get(nodeSlug);
  while (current && current.parentId) {
    const parent = nodesMap.get(current.parentId);
    if (!parent) break;
    chain.unshift({ slug: parent.slug, name: parent.name, cluster: parent.cluster });
    current = parent;
  }
  return chain;
}
```

### Anti-Patterns to Avoid
- **Fetching graph.json at render time via fetch():** Import it directly as a JSON module. Astro bundles it at build time.
- **Building slug from ID with custom logic:** The `slug` field already exists on every node and matches the `id` field (verified by existing tests in `content.test.ts`).
- **Creating a separate Layout for AI landscape pages:** Reuse the existing `Layout.astro` -- it handles all SEO meta, OG images, and structured data injection via slots.
- **Using `client:` directives on concept pages:** These are static content pages with no interactivity needed. Zero JavaScript on the client.
- **Hard-coding cluster colors in page templates:** Read colors from `graph.json` clusters data to maintain single source of truth.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON-LD structured data | Custom string templates | Astro component with `set:html={JSON.stringify(schema)}` | Type safety, proper escaping, reusable pattern established in 8+ existing components |
| OG image rendering | Canvas API or imagemagick | satori + sharp via existing `renderOgPng()` helper | Already proven for 15+ OG templates, handles font loading, 1200x630 sizing |
| Breadcrumb JSON-LD | New component | Existing `BreadcrumbJsonLd.astro` | Exact component already exists and is used on 20+ page types |
| URL generation | Inline string concatenation | Dedicated `routes.ts` helpers | Prevents trailing-slash bugs (Astro uses `trailingSlash: 'always'`) |
| Sitemap inclusion | Manual sitemap entries | `@astrojs/sitemap` auto-discovery | Pages in `/src/pages/` are automatically included |
| Node relationship lookup | Custom filter logic | `getNodeRelationships()` from `schema.ts` | Already tested and handles all edge type filtering |

**Key insight:** Every building block for this phase already exists in the codebase. The work is composition and data-specific templating, not building new infrastructure.

## Common Pitfalls

### Pitfall 1: Trailing Slash Mismatch
**What goes wrong:** Links to `/ai-landscape/machine-learning` (no trailing slash) cause 301 redirects, hurting SEO
**Why it happens:** Astro config has `trailingSlash: 'always'` but developers forget when hand-writing URLs
**How to avoid:** Use a `conceptUrl(slug)` helper that always appends `/`. All internal links go through this function.
**Warning signs:** Build warnings about trailing slashes, or redirect chains in Lighthouse

### Pitfall 2: OG Image Build Time Explosion
**What goes wrong:** 51 OG images (satori SVG + sharp PNG conversion) add significant build time
**Why it happens:** Each satori render + sharp PNG conversion takes ~200-500ms
**How to avoid:** Use the `getOrGenerateOgImage()` caching utility from `src/lib/guides/og-cache.ts` that caches generated PNGs in `node_modules/.cache/`. Already proven for guide pages.
**Warning signs:** Build time increases by more than 30 seconds for the OG image generation

### Pitfall 3: Broken Ancestry Chains
**What goes wrong:** Some nodes have `parentId: null` (top-level concepts like "Artificial Intelligence"), causing the ancestry chain to be empty
**Why it happens:** Not all concepts have parents -- 8 out of 51 are top-level (parentId is null)
**How to avoid:** Handle the empty-chain case gracefully. Top-level concepts show only "AI Landscape > [Concept Name]" in the breadcrumb.
**Warning signs:** Breadcrumbs that show only one item, or missing breadcrumbs on top-level pages

### Pitfall 4: Cluster Color Lookup Failure
**What goes wrong:** Using node cluster ID but not finding the matching cluster definition
**Why it happens:** Cluster data is in `graph.json` while nodes are in `nodes.json` (content collection)
**How to avoid:** Build a `Map<string, Cluster>` from `graph.json` clusters in `getStaticPaths()` and pass the resolved cluster as a prop.
**Warning signs:** Undefined color values, missing accent colors on pages

### Pitfall 5: DefinedTerm JSON-LD Fails Rich Results Test
**What goes wrong:** Google Rich Results Test shows warnings or errors for DefinedTerm markup
**Why it happens:** DefinedTerm is not a "rich result" type -- Google does not render special SERP features for it. But the markup should still be valid.
**How to avoid:** Focus on correct schema.org markup (valid JSON-LD, required properties). Use `inDefinedTermSet` to link back to the AI Landscape collection. Test with the Schema Markup Validator (not Rich Results Test, which only validates rich-result-eligible types).
**Warning signs:** Confusion between "valid structured data" and "rich result eligible"

### Pitfall 6: Description Length for SEO Meta
**What goes wrong:** `simpleDescription` is 90-200 words (per existing tests), far too long for meta description (ideal: 150-160 chars)
**Why it happens:** Content was written for page display, not meta tags
**How to avoid:** Use `whyItMatters` (under 60 words per tests) as the seed for the meta description, or truncate `simpleDescription` to ~155 characters using the existing `truncate()` pattern from the codebase.
**Warning signs:** Google SERPs showing truncated descriptions with ellipsis

## Code Examples

### Concept Page getStaticPaths (complete pattern)
```typescript
// Source: Composition of beauty-index/[slug].astro + db-compass/[slug].astro patterns
import { getCollection } from 'astro:content';
import graphData from '../../data/ai-landscape/graph.json';
import { getNodeRelationships } from '../../lib/ai-landscape/schema';
import type { AiNode, Cluster, Edge } from '../../lib/ai-landscape/schema';

export async function getStaticPaths() {
  const entries = await getCollection('aiLandscape');
  const nodesMap = new Map(entries.map(e => [e.data.slug, e.data]));
  const clusters = new Map(graphData.clusters.map(c => [c.id, c]));

  return entries.map((entry) => {
    const node = entry.data;
    const relationships = getNodeRelationships(node.slug, graphData.edges);

    return {
      params: { slug: node.slug },
      props: {
        node,
        cluster: clusters.get(node.cluster),
        relationships,
        nodesMap: Object.fromEntries(nodesMap), // serializable
      },
    };
  });
}
```

### DefinedTerm JSON-LD Schema
```typescript
// Source: schema.org/DefinedTerm official specification
const definedTermSchema = {
  "@context": "https://schema.org",
  "@type": "DefinedTerm",
  "name": node.name,
  "description": node.simpleDescription,
  "url": `https://patrykgolabek.dev/ai-landscape/${node.slug}/`,
  "inDefinedTermSet": {
    "@type": "DefinedTermSet",
    "name": "AI Landscape Explorer",
    "url": "https://patrykgolabek.dev/ai-landscape/",
  },
};
```

### BreadcrumbList for AI Landscape Concept
```typescript
// Source: Existing BreadcrumbJsonLd.astro usage pattern
<BreadcrumbJsonLd crumbs={[
  { name: 'Home', url: 'https://patrykgolabek.dev/' },
  { name: 'AI Landscape', url: 'https://patrykgolabek.dev/ai-landscape/' },
  ...ancestryChain.map(item => ({
    name: item.name,
    url: `https://patrykgolabek.dev/ai-landscape/${item.slug}/`,
  })),
  { name: node.name, url: `https://patrykgolabek.dev/ai-landscape/${node.slug}/` },
]} />
```

### OG Image Generator Function Signature
```typescript
// Source: Pattern from generateLanguageOgImage, generateCompassModelOgImage
export async function generateAiLandscapeOgImage(
  conceptName: string,
  clusterName: string,
  clusterColor: string,   // darkColor from graph.json (e.g., "#c62828")
): Promise<Uint8Array<ArrayBuffer>> {
  // Use renderOgPng() helper with concept name as title,
  // cluster color as accent stripe/background element,
  // "AI Landscape Explorer" as subtitle,
  // "patrykgolabek.dev" branding row
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `getStaticPaths` with manual data | Content Collections + `getCollection()` | Astro 2.0+ (2023) | Type-safe, validated data from collections |
| `@resvg/resvg-js` for SVG-to-PNG | `sharp` for SVG-to-PNG | Project convention | sharp is already a dependency, no extra binary needed |
| Manual sitemap.xml | `@astrojs/sitemap` auto-discovery | Project convention | Pages auto-included, no maintenance |

**Note on node count:** The requirements reference "~80 concepts" but Phase 102 produced 51 concept nodes + 32 grouped examples. The grouped examples are nested within concept nodes (e.g., "GPT-4o" is an example under "Large Language Models"), not separate pages. The actual page count will be 51, which matches Phase 102's output.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.0.18 |
| Config file | `vitest.config.ts` (includes `src/**/*.test.ts`) |
| Quick run command | `npx vitest run src/lib/ai-landscape` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEO-01 | 51 pages generated at /ai-landscape/[slug]/ | build smoke | `npx astro build` (verify no errors + page count) | N/A -- build verification |
| SEO-02 | Page content: both tiers, breadcrumb, related, back link | unit | `npx vitest run src/lib/ai-landscape/__tests__/ancestry.test.ts -x` | Wave 0 |
| SEO-03 | JSON-LD DefinedTerm + BreadcrumbList valid | unit | `npx vitest run src/lib/ai-landscape/__tests__/jsonld.test.ts -x` | Wave 0 |
| SEO-04 | OG image generated per concept | build smoke | `npx astro build` (verify 51 .png files in dist) | N/A -- build verification |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/ai-landscape`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green + `npx astro build` succeeds

### Wave 0 Gaps
- [ ] `src/lib/ai-landscape/__tests__/ancestry.test.ts` -- covers SEO-02 (ancestry chain computation)
- [ ] `src/lib/ai-landscape/__tests__/jsonld.test.ts` -- covers SEO-03 (DefinedTerm schema validation)
- [ ] `src/lib/ai-landscape/__tests__/routes.test.ts` -- covers SEO-01 (URL helpers with trailing slashes)

## Open Questions

1. **Page count: 51 vs ~80**
   - What we know: Phase 102 produced 51 concept nodes. The requirements say "~80" which likely included grouped examples (32 additional).
   - What's unclear: Whether the success criterion "~80 static concept pages" should be taken literally or updated to match actual data.
   - Recommendation: Build pages for the 51 nodes that exist. The success criterion should read "~51" or "all nodes in the content collection." Do not create separate pages for grouped examples (they are sub-items within concept nodes, not standalone concepts).

2. **Landing page dependency**
   - What we know: Phase 103 success criteria reference "a link back to the graph landing page" but Phase 104 creates the landing page.
   - What's unclear: Whether the link should go to a page that does not exist yet.
   - Recommendation: Link to `/ai-landscape/` which will be a 404 until Phase 104. This is fine for a pre-launch build. Alternatively, create a minimal placeholder index.astro in Phase 103.

3. **Visual breadcrumb vs JSON-LD breadcrumb**
   - What we know: SEO-02 requires "ancestry breadcrumb" and SEO-03 requires BreadcrumbList JSON-LD. These can differ (visual shows concept hierarchy, JSON-LD shows site navigation hierarchy).
   - What's unclear: Should the visual breadcrumb show the AI concept ancestry (AI > ML > Deep Learning > Transformers) or the site path (Home > AI Landscape > Transformers)?
   - Recommendation: Show both. Visual ancestry breadcrumb shows the concept lineage (using parentId chain). JSON-LD BreadcrumbList shows the site navigation hierarchy (Home > AI Landscape > [concept]). The visual ancestry is the educational feature; the JSON-LD is the SEO feature.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/pages/beauty-index/[slug].astro`, `src/pages/db-compass/[slug].astro` -- established dynamic route patterns
- Codebase analysis: `src/lib/og-image.ts` -- 15+ OG image generators with `renderOgPng()` helper
- Codebase analysis: `src/components/BreadcrumbJsonLd.astro`, `src/components/BlogPostingJsonLd.astro` -- JSON-LD component patterns
- Codebase analysis: `src/lib/ai-landscape/schema.ts` -- types, Zod schemas, `getNodeRelationships()`
- Codebase analysis: `src/data/ai-landscape/nodes.json` (51 nodes), `src/data/ai-landscape/graph.json` (9 clusters, 66 edges)
- [schema.org/DefinedTerm](https://schema.org/DefinedTerm) -- official type specification
- [schema.org/DefinedTermSet](https://schema.org/DefinedTermSet) -- container for DefinedTerm items

### Secondary (MEDIUM confidence)
- [Astro routing reference](https://docs.astro.build/en/reference/routing-reference/) -- `getStaticPaths()` documentation
- [Astro content collections guide](https://docs.astro.build/en/guides/content-collections/) -- `getCollection()` usage

### Tertiary (LOW confidence)
- None -- all findings verified against codebase or official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and heavily used in the project
- Architecture: HIGH - Every pattern directly observed in 3+ existing page types in the codebase
- Pitfalls: HIGH - Derived from real patterns and constraints observed in the codebase (trailing slash config, content field lengths, cluster data split)

**Research date:** 2026-03-26
**Valid until:** 2026-04-25 (stable -- no external dependency changes expected)
