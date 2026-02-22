# Phase 31: Detail Pages - Research

**Researched:** 2026-02-21
**Domain:** Astro dynamic routes (getStaticPaths), SVG-to-PNG client-side conversion, Web Share API, JSON-LD CreativeWork, prev/next navigation
**Confidence:** HIGH

## Summary

Phase 31 creates 12 model detail pages at `/tools/db-compass/[slug]/` using Astro's `getStaticPaths`. Each page combines existing build-time components (CompassRadarChart, CompassScoreBreakdown, CapBadge) with new page-specific sections (when-to-use/avoid lists, tradeoffs prose, top databases, share controls, prev/next navigation) and JSON-LD structured data. The entire architecture has a direct 1:1 precedent in the Beauty Index `[slug].astro` detail page, which already implements every pattern needed: `getStaticPaths` with content collections, prev/next navigation, share controls with SVG-to-PNG download, CreativeWork JSON-LD, and BreadcrumbList JSON-LD.

The detail page is a composition exercise, not an invention exercise. Every component used on detail pages either already exists (CompassRadarChart, CompassScoreBreakdown, CapBadge, BreadcrumbJsonLd) or has a direct Beauty Index counterpart to adapt (ShareControls.astro for share/download, LanguageNav.astro for prev/next navigation). The data model (`DbModel`) already contains all fields needed: `strengths`, `weaknesses`, `bestFor`, `avoidWhen`, `topDatabases`, `justifications`, `capTheorem`, `characterSketch`, and `summary`.

The two technically interesting parts are: (1) SVG-to-PNG radar chart download (SHARE-02), which has two proven codebase patterns -- the Beauty Index Canvas 2D composite approach and the Dockerfile Analyzer SVG-to-PNG blob approach; and (2) the share controls (SHARE-01), which the Beauty Index ShareControls.astro implements in full with Web Share API mobile detection, Clipboard API copy-link, and social platform share intents.

**Primary recommendation:** Create `src/pages/tools/db-compass/[slug].astro` following the Beauty Index `[slug].astro` pattern exactly. Sort models by `complexityPosition` for prev/next navigation. Create `CompassShareControls.astro` by adapting `ShareControls.astro` with the simpler SVG-to-PNG approach from `badge-generator.ts`. Create `ModelNav.astro` by adapting `LanguageNav.astro`. Add inline CreativeWork JSON-LD in the page frontmatter.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PAGE-02 | 12 model detail pages at /tools/db-compass/[slug]/ via getStaticPaths | Beauty Index `[slug].astro` provides exact `getStaticPaths` + content collection pattern. Models sorted by `complexityPosition` for param generation. All 12 slugs confirmed in models.json. |
| PAGE-03 | Detail pages include radar chart, score breakdown, CAP badge, when-to-use/avoid lists, tradeoffs prose, and top databases | All visual components exist (CompassRadarChart, CompassScoreBreakdown, CapBadge). Data model has all fields: `bestFor`, `avoidWhen`, `justifications`, `topDatabases`, `strengths`, `weaknesses`, `characterSketch`. |
| PAGE-04 | Prev/next navigation between detail pages by complexity position | LanguageNav.astro provides exact pattern. Models sorted by `complexityPosition` in `getStaticPaths` gives 12-element ordered list for prev/next computation. |
| SEO-02 | JSON-LD CreativeWork on each detail page | Beauty Index `[slug].astro` has inline CreativeWork JSON-LD with `isPartOf` linking to parent Dataset. Adapt for DB Compass with 8-dimension aggregate rating (max 80). |
| SHARE-01 | Share controls -- Web Share API on mobile, Clipboard API on desktop | ShareControls.astro implements full pattern: social share intents (X, LinkedIn, Reddit, Bluesky), copy-link via Clipboard API, Web Share API "More" button shown on capable devices. |
| SHARE-02 | Radar chart download-as-PNG via client-side SVG-to-PNG | Two codebase patterns: (1) badge-generator.ts SVG-string-to-PNG via Blob+Image+Canvas (simpler, exact SVG capture), (2) ShareControls.astro Canvas 2D composite (richer branded image). Recommend SVG-to-PNG approach for chart-only download. |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | ^5.3.0 (installed) | Dynamic routes via `getStaticPaths`, build-time rendering | All existing detail pages use this pattern |
| TypeScript | ^5.9.3 (installed) | Type-safe props, data handling | All source files are TS |
| Tailwind CSS | ^3.4.19 (installed) | Layout, responsive design, utility classes | Entire site uses Tailwind |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | - | - | Zero new dependencies per v1.5 constraint |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline `<script>` for share/download | React island component | Share/download are simple event handlers with no reactive state; a React island would add hydration cost for no benefit. Beauty Index uses inline `<script>` successfully. |
| Canvas 2D composite image (Beauty Index style) | SVG-to-PNG via Image+Canvas (badge-generator style) | Composite gives branded image with scores; SVG-to-PNG gives exact chart. Requirement says "radar chart download-as-PNG" which means chart-only, so SVG-to-PNG is the correct approach. |
| Inline CreativeWork JSON-LD | Separate `CompassDetailJsonLd.astro` component | Inline is simpler for a single schema object. Beauty Index does inline. Only extract to component if reused. |

**Installation:**
```bash
# No installation needed. Zero new dependencies.
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  pages/
    tools/
      db-compass/
        index.astro                  # EXISTS (Phase 30)
        [slug].astro                 # NEW (PAGE-02) - Detail pages via getStaticPaths
  components/
    db-compass/
      CompassRadarChart.astro        # EXISTS (Phase 29) - Reused on detail pages
      CompassScoreBreakdown.astro    # EXISTS (Phase 29) - Reused on detail pages
      CapBadge.astro                 # EXISTS (Phase 29) - Reused on detail pages
      CompassShareControls.astro     # NEW (SHARE-01, SHARE-02) - Share + download controls
      ModelNav.astro                 # NEW (PAGE-04) - Prev/next by complexity position
```

### Pattern 1: Dynamic Routes with getStaticPaths + Content Collections
**What:** A `[slug].astro` file that exports `getStaticPaths()`, loads data from a content collection, and passes model-specific props to each generated page.
**When to use:** The 12 detail pages at `/tools/db-compass/[slug]/`.
**Existing precedent:**
```astro
---
// Source: src/pages/beauty-index/[slug].astro (adapted for DB Compass)
import { getCollection } from 'astro:content';
import Layout from '../../../layouts/Layout.astro';
import BreadcrumbJsonLd from '../../../components/BreadcrumbJsonLd.astro';
import CompassRadarChart from '../../../components/db-compass/CompassRadarChart.astro';
import CompassScoreBreakdown from '../../../components/db-compass/CompassScoreBreakdown.astro';
import CapBadge from '../../../components/db-compass/CapBadge.astro';
import CompassShareControls from '../../../components/db-compass/CompassShareControls.astro';
import ModelNav from '../../../components/db-compass/ModelNav.astro';
import { DIMENSIONS, DIMENSION_COLORS } from '../../../lib/db-compass/dimensions';
import { totalScore } from '../../../lib/db-compass/schema';

export async function getStaticPaths() {
  const dbModels = await getCollection('dbModels');
  // Sort by complexityPosition for prev/next nav (PAGE-04)
  const sorted = [...dbModels]
    .map((entry) => entry.data)
    .sort((a, b) => a.complexityPosition - b.complexityPosition);

  return sorted.map((model, index) => ({
    params: { slug: model.slug },
    props: {
      model,
      prev: index > 0
        ? { slug: sorted[index - 1].slug, name: sorted[index - 1].name }
        : null,
      next: index < sorted.length - 1
        ? { slug: sorted[index + 1].slug, name: sorted[index + 1].name }
        : null,
    },
  }));
}

const { model, prev, next } = Astro.props;
const total = totalScore(model);
---
```

### Pattern 2: Prev/Next Navigation Component
**What:** Static Astro component rendering prev/next links with a central "Overview" link.
**When to use:** Bottom of each detail page (PAGE-04).
**Existing precedent:**
```astro
---
// Source: src/components/beauty-index/LanguageNav.astro (adapted for DB Compass)
interface Props {
  prev: { slug: string; name: string } | null;
  next: { slug: string; name: string } | null;
}

const { prev, next } = Astro.props;
---

<nav
  aria-label="Model navigation"
  class="flex items-center justify-between mt-12 pt-6 border-t border-[var(--color-border)]"
>
  {prev ? (
    <a href={`/tools/db-compass/${prev.slug}/`} class="text-[var(--color-accent)] hover:underline flex items-center gap-1">
      <span aria-hidden="true">&larr;</span>
      <span>{prev.name}</span>
    </a>
  ) : (
    <span />
  )}

  <a href="/tools/db-compass/" class="text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors">
    Overview
  </a>

  {next ? (
    <a href={`/tools/db-compass/${next.slug}/`} class="text-[var(--color-accent)] hover:underline flex items-center gap-1">
      <span>{next.name}</span>
      <span aria-hidden="true">&rarr;</span>
    </a>
  ) : (
    <span />
  )}
</nav>
```

### Pattern 3: SVG-to-PNG Download via DOM SVG Capture
**What:** Client-side script that serializes the in-page SVG radar chart to a string, creates an Image from it, draws to Canvas, and exports as PNG blob for download.
**When to use:** The "Download" button in share controls (SHARE-02).
**Existing precedent (badge-generator.ts adapted):**
```typescript
// Source: Adapted from src/lib/tools/dockerfile-analyzer/badge-generator.ts
function downloadRadarPng(svgElement: SVGSVGElement, modelName: string): void {
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const dpr = Math.min(window.devicePixelRatio || 1, 3);

  // Get intrinsic SVG dimensions from viewBox
  const viewBox = svgElement.viewBox.baseVal;
  const W = viewBox.width || svgElement.width.baseVal.value;
  const H = viewBox.height || svgElement.height.baseVal.value;

  const canvas = document.createElement('canvas');
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(dpr, dpr);

  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();

  img.onload = () => {
    ctx.drawImage(img, 0, 0, W, H);
    URL.revokeObjectURL(url);
    canvas.toBlob((pngBlob) => {
      if (!pngBlob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(pngBlob);
      a.download = `${modelName.toLowerCase().replace(/\s+/g, '-')}-radar-chart.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    }, 'image/png');
  };
  img.onerror = () => URL.revokeObjectURL(url);
  img.src = url;
}
```

### Pattern 4: Share Controls with Web Share API + Clipboard API
**What:** An Astro component with social share links, copy-link button, and mobile Web Share API "More" button, plus a download button for the radar chart.
**When to use:** Detail page share/download section (SHARE-01, SHARE-02).
**Existing precedent:** `src/components/beauty-index/ShareControls.astro` -- full implementation with:
- Social share intent URLs (X, LinkedIn, Reddit, Bluesky)
- Copy-link via `navigator.clipboard.writeText()`
- Web Share API via `navigator.share()` with feature detection
- Download via Canvas (adapt to SVG-to-PNG for DB Compass)
- Toast notification for user feedback
- `astro:page-load` event listener for view transitions compatibility

### Pattern 5: CreativeWork JSON-LD for Detail Pages
**What:** Inline JSON-LD structured data marking each detail page as a CreativeWork linked to the parent Dataset.
**When to use:** Each detail page (SEO-02).
**Existing precedent:**
```typescript
// Source: src/pages/beauty-index/[slug].astro (adapted for DB Compass)
const modelSchema = {
  "@context": "https://schema.org",
  "@type": "CreativeWork",
  "name": `${model.name} -- Database Compass Score`,
  "description": metaDescription,
  "url": `https://patrykgolabek.dev/tools/db-compass/${model.slug}/`,
  "datePublished": "2026-02-22",
  "dateModified": "2026-02-22",
  "author": {
    "@type": "Person",
    "@id": "https://patrykgolabek.dev/#person",
  },
  "isPartOf": {
    "@type": "Dataset",
    "name": "Database Compass",
    "url": "https://patrykgolabek.dev/tools/db-compass/",
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": total,
    "bestRating": 80,
    "worstRating": 8,
    "ratingCount": 1,
    "author": {
      "@type": "Person",
      "@id": "https://patrykgolabek.dev/#person",
    },
  },
};
```

### Anti-Patterns to Avoid

- **Creating a React island for share controls:** The share/download functionality is pure DOM event handling with no reactive state. An inline `<script>` with `astro:page-load` is the correct approach, matching the Beauty Index pattern. A React island would add unnecessary hydration cost.

- **Sorting models by total score for prev/next navigation:** The requirement explicitly says "ordered by complexity position." The `complexityPosition` field (0.08 to 0.88) defines the natural ordering from simplest to most complex model. Using total score would give a confusing navigation order.

- **Rendering the SVG radar chart inside the `<script>` tag for download:** The radar chart already exists as a server-rendered SVG element in the DOM. Grab it with `document.querySelector('svg[role="img"]')` and serialize it with `XMLSerializer`, rather than redrawing from scratch.

- **Forgetting `xmlns` attribute when serializing SVG:** When using `XMLSerializer.serializeToString()`, the SVG element must have `xmlns="http://www.w3.org/2000/svg"` set. The `CompassRadarChart.astro` already includes this attribute. Without it, the SVG-to-Image conversion will fail silently.

- **Hardcoding the model list in `getStaticPaths`:** Use `getCollection('dbModels')` to dynamically generate routes from the content collection. This ensures new models added to `models.json` automatically get detail pages without code changes.

- **Using `data-model-name` attribute with unsanitized values for download filenames:** Model names like "Relational (SQL) Database" contain parentheses. Use `model.slug` for filenames, not `model.name`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Social share links | Custom share URL builders | Adapt ShareControls.astro pattern | Share intent URLs for X, LinkedIn, Reddit, Bluesky are already implemented and tested |
| Breadcrumb JSON-LD | New breadcrumb component | Existing BreadcrumbJsonLd.astro | Already built, accepts `crumbs` array prop |
| SEO meta tags | Manual `<meta>` tags | Layout.astro + SEOHead.astro | Already handle title, description, OG, Twitter cards |
| SVG-to-PNG conversion | Custom rasterization library | XMLSerializer + Canvas API (badge-generator.ts pattern) | Browser-native APIs, zero dependencies, proven in codebase |
| Prev/next navigation | Custom nav logic | Adapt LanguageNav.astro | Exact same pattern, just change URLs and labels |
| Radar chart rendering | New chart component | Existing CompassRadarChart.astro | Already renders 8-axis octagonal chart with colored dimension labels |
| Score breakdown display | New score component | Existing CompassScoreBreakdown.astro | Already shows all 8 dimensions with bars and total |
| CAP theorem badge | New badge component | Existing CapBadge.astro | Already handles CP/AP/CA/Tunable with color coding |

**Key insight:** This phase requires creating exactly 2 new components (CompassShareControls, ModelNav) and 1 new page file ([slug].astro). Everything else is reuse of existing components and patterns.

## Common Pitfalls

### Pitfall 1: SVG Serialization Font Issues
**What goes wrong:** The downloaded PNG shows different fonts than the on-screen SVG because the SVG references web fonts that aren't embedded in the serialized SVG string.
**Why it happens:** `XMLSerializer.serializeToString()` captures the SVG markup but not the CSS font-face rules. The Image element rendering the SVG doesn't have access to the page's fonts.
**How to avoid:** The CompassRadarChart uses `font-family="'DM Sans', 'Noto Sans', sans-serif"` for axis labels. Two options: (a) Accept minor font differences in the PNG (system sans-serif fallback looks acceptable), or (b) use `document.fonts.ready` before serialization and inline font data-URIs. Option (a) is simpler and the Beauty Index ShareControls already handles this by waiting for `document.fonts.ready` -- adapt that pattern.
**Warning signs:** Downloaded PNG shows different typeface for axis labels compared to on-screen chart.
**Recommended approach:** Add `await document.fonts.ready` before serialization. The axis labels are small Unicode symbols (single characters), so font substitution is barely noticeable. Accept this trade-off for zero-dependency simplicity.

### Pitfall 2: viewBox Mismatch in SVG-to-PNG
**What goes wrong:** The downloaded PNG is cropped or has extra whitespace because the Canvas dimensions don't match the SVG viewBox.
**Why it happens:** CompassRadarChart.astro sets `width={size}` and `height={size}` but `viewBox={`0 0 ${vbSize} ${vbSize}`}` where `vbSize = size + pad * 2`. The SVG intrinsic size differs from the viewBox.
**How to avoid:** Use the viewBox dimensions (not width/height attributes) for the Canvas size. Parse `svgElement.viewBox.baseVal` to get the correct dimensions.
**Warning signs:** PNG output has axis labels cut off or chart is tiny in a large canvas.

### Pitfall 3: Missing `astro:page-load` Event Handler
**What goes wrong:** Share controls and download buttons stop working after navigating to a different detail page via prev/next links.
**Why it happens:** Astro's View Transitions (ClientRouter) swap the page content without a full reload. Inline scripts need to re-initialize on each page load.
**How to avoid:** Wrap all DOM event setup in a function and call it from `document.addEventListener('astro:page-load', initFn)`. This is exactly what `ShareControls.astro` does with `initShareControls`.
**Warning signs:** Controls work on first page load but not after clicking prev/next navigation.

### Pitfall 4: Empty `<span />` Breaking Flexbox Alignment in Nav
**What goes wrong:** When there's no "prev" link (first model) or no "next" link (last model), the flexbox layout breaks and the remaining links aren't properly positioned.
**Why it happens:** Missing elements leave gaps in `justify-between` flex layout.
**How to avoid:** Render an empty `<span />` placeholder when prev/next is null. This is exactly what LanguageNav.astro does. The empty span takes up no visual space but maintains the flexbox three-column layout.
**Warning signs:** "Overview" link shifts to the left edge when there's no "prev" link.

### Pitfall 5: Content Security Policy Blocking Blob URLs for SVG-to-PNG
**What goes wrong:** The SVG-to-PNG download fails silently because the CSP blocks blob: URLs in img-src.
**Why it happens:** The Layout.astro CSP meta tag restricts img-src sources. SVG-to-PNG conversion creates `blob:` URLs for the Image element.
**How to avoid:** The existing CSP already includes `blob:` in img-src: `img-src 'self' data: blob:`. Verify this remains in place.
**Warning signs:** Image `onerror` fires instead of `onload`, download silently fails. Check browser console for CSP violations.

### Pitfall 6: Long Model Names Breaking Mobile Layout
**What goes wrong:** Model names like "Object-Oriented Database" or "Relational (SQL) Database" are too long for mobile headers and navigation links.
**Why it happens:** These are 25+ character strings that overflow on narrow viewports.
**How to avoid:** Use `truncate` or responsive text sizes. For nav links, consider showing shorter names on mobile via responsive classes. The data model has no `shortName` field, so truncation with CSS is the pragmatic approach.
**Warning signs:** Text overflow on screens < 375px wide.

## Code Examples

Verified patterns from the existing codebase:

### Detail Page Section: When to Use / Avoid Lists
```astro
<!-- Data source: model.bestFor (2-6 items) and model.avoidWhen (1-4 items) -->
<section class="mt-12">
  <h2 class="text-xl font-heading font-bold mb-4">When to Use</h2>
  <ul class="space-y-2">
    {model.bestFor.map((item) => (
      <li class="flex items-start gap-2 text-[var(--color-text-secondary)]">
        <span class="text-[var(--color-accent)] mt-0.5" aria-hidden="true">&#10003;</span>
        <span>{item}</span>
      </li>
    ))}
  </ul>
</section>

<section class="mt-8">
  <h2 class="text-xl font-heading font-bold mb-4">Avoid When</h2>
  <ul class="space-y-2">
    {model.avoidWhen.map((item) => (
      <li class="flex items-start gap-2 text-[var(--color-text-secondary)]">
        <span class="text-red-500 mt-0.5" aria-hidden="true">&#10007;</span>
        <span>{item}</span>
      </li>
    ))}
  </ul>
</section>
```

### Detail Page Section: Dimension Analysis (Tradeoffs Prose)
```astro
<!-- Data source: model.justifications -- one paragraph per dimension -->
<!-- Pattern: src/pages/beauty-index/[slug].astro dimension analysis section -->
<section class="mt-12">
  <h2 class="text-xl font-heading font-bold mb-6">Dimension Analysis</h2>
  <div class="space-y-6">
    {DIMENSIONS.map((dim) => (
      <div>
        <h3 class="font-heading font-bold text-base flex items-center gap-2">
          <span style={`color: ${DIMENSION_COLORS[dim.key]};`}>{dim.symbol}</span>
          {dim.name}
          <span class="meta-mono text-sm text-[var(--color-text-secondary)]">
            {model.scores[dim.key]}/10
          </span>
        </h3>
        <p class="text-[var(--color-text-secondary)] leading-relaxed mt-1">
          {model.justifications[dim.key]}
        </p>
      </div>
    ))}
  </div>
</section>
```

### Detail Page Section: Top Databases
```astro
<!-- Data source: model.topDatabases (3-6 items) with name, description, license, url -->
<section class="mt-12">
  <h2 class="text-xl font-heading font-bold mb-4">Top Databases</h2>
  <div class="space-y-4">
    {model.topDatabases.map((db) => (
      <div class="border border-[var(--color-border)] rounded-lg p-4">
        <div class="flex items-center justify-between">
          <a
            href={db.url}
            target="_blank"
            rel="noopener noreferrer"
            class="font-heading font-bold text-[var(--color-accent)] hover:underline"
          >
            {db.name}
          </a>
          <span class="text-xs text-[var(--color-text-secondary)]">{db.license}</span>
        </div>
        <p class="text-sm text-[var(--color-text-secondary)] mt-1">{db.description}</p>
      </div>
    ))}
  </div>
</section>
```

### SEO Meta Description Generation
```typescript
// Source: Adapted from Beauty Index [slug].astro meta description pattern
const capLabel = model.capTheorem.classification;
const fullDescription = `${model.name} scores ${total}/80 in the Database Compass. ${capLabel} classification. ${model.summary}`;
const metaDescription = fullDescription.length <= 155
  ? fullDescription
  : fullDescription.slice(0, 155).replace(/\s+\S*$/, '') + '...';
```

### BreadcrumbJsonLd for Detail Pages
```astro
<BreadcrumbJsonLd crumbs={[
  { name: 'Home', url: 'https://patrykgolabek.dev/' },
  { name: 'Tools', url: 'https://patrykgolabek.dev/tools/' },
  { name: 'Database Compass', url: 'https://patrykgolabek.dev/tools/db-compass/' },
  { name: model.name, url: `https://patrykgolabek.dev/tools/db-compass/${model.slug}/` },
]} />
```

### Model Complexity Order (for prev/next navigation)
```
 1. Key-Value Store      (key-value)    -- position: 0.08
 2. Document Database    (document)     -- position: 0.22
 3. In-Memory Database   (in-memory)    -- position: 0.30
 4. Time-Series Database (time-series)  -- position: 0.35
 5. Relational (SQL)     (relational)   -- position: 0.42
 6. Search Engine        (search)       -- position: 0.45
 7. Wide-Column Store    (columnar)     -- position: 0.58
 8. Vector Database      (vector)       -- position: 0.65
 9. NewSQL Database      (newsql)       -- position: 0.72
10. Graph Database       (graph)        -- position: 0.78
11. Object-Oriented DB   (object)       -- position: 0.82
12. Multi-Model Database (multi-model)  -- position: 0.88
```

### Complete Share Controls Adaptation Points
```
Beauty Index ShareControls.astro --> DB Compass CompassShareControls.astro
Changes needed:
1. Props: model-specific data instead of language-specific (slug, name, total/80)
2. Share text: "${model.name} scores ${total}/80 in the Database Compass!"
3. Page URL: /tools/db-compass/${slug}/ instead of /beauty-index/${id}/
4. Download: SVG-to-PNG (grab DOM SVG, serialize, canvas) instead of Canvas 2D composite
5. Social links: same pattern (X, LinkedIn, Reddit, Bluesky, Copy Link, Web Share)
6. Toast: same toast pattern for feedback
7. astro:page-load: same event listener pattern for view transitions
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Canvas 2D redraw for chart download | SVG-to-PNG via XMLSerializer + Canvas | Established browser API | Simpler code, exact chart reproduction, no redraw logic |
| Custom share dialog | Web Share API + fallback social links | Web Share API widely supported on mobile since 2023 | Native OS sharing on mobile, social links on desktop |
| Separate JSON-LD component per page type | Inline JSON-LD in page frontmatter | Established pattern | Simpler for one-off schema, component only needed if reused |

**Deprecated/outdated:**
- `navigator.share()` without feature detection: Always check `'share' in navigator` before showing the Web Share button. Desktop Firefox does not support it.
- Using `btoa()` for SVG encoding: Use `Blob` + `URL.createObjectURL()` instead of base64 encoding. The Blob approach handles Unicode characters correctly and is the pattern used in `badge-generator.ts`.

## Open Questions

1. **Should the download be chart-only or a branded composite image?**
   - What we know: SHARE-02 says "radar chart download-as-PNG." This implies chart-only. Beauty Index creates a branded composite (chart + scores + branding footer).
   - What's unclear: Whether a branded composite would be more useful for sharing.
   - Recommendation: Start with chart-only SVG-to-PNG (simpler, matches requirement text). A branded composite can be added later if users want it. The SVG-to-PNG approach captures the exact rendered chart including axis labels and colors.

2. **Should detail page sections have anchor links for deep linking?**
   - What we know: Beauty Index detail pages do NOT have anchor links on section headings. The DB Compass detail pages have more sections (when-to-use, avoid, dimension analysis, top databases) that could benefit from anchors.
   - What's unclear: Whether anchor links add SEO value or just UX convenience.
   - Recommendation: Add `id` attributes to major section headings (`when-to-use`, `avoid-when`, `dimension-analysis`, `top-databases`) for potential future deep linking, but don't add visible anchor link icons in this phase. The `id` attributes cost nothing and enable future use.

3. **Should the characterSketch section use the same "Character" heading as Beauty Index or something more domain-appropriate?**
   - What we know: Beauty Index uses "Character" as the section heading for `characterSketch`. The DB Compass `characterSketch` field contains personality-style descriptions of each database model.
   - What's unclear: Whether "Character" makes sense for databases.
   - Recommendation: Use "In a Nutshell" or "Character" -- either works. The content is already written in this style ("The sprinter of the database world..."). Match the Beauty Index pattern with "Character" for consistency.

## Sources

### Primary (HIGH confidence)
- `src/pages/beauty-index/[slug].astro` -- Complete detail page pattern with getStaticPaths, CreativeWork JSON-LD, prev/next nav, share controls
- `src/components/beauty-index/ShareControls.astro` -- Full share/download implementation (Web Share API, Clipboard API, Canvas 2D composite, social share intents, toast feedback)
- `src/components/beauty-index/LanguageNav.astro` -- Prev/next navigation component pattern
- `src/components/BreadcrumbJsonLd.astro` -- BreadcrumbList JSON-LD (reusable as-is)
- `src/lib/tools/dockerfile-analyzer/badge-generator.ts` -- SVG-to-PNG via Blob + Image + Canvas pattern
- `src/components/db-compass/CompassRadarChart.astro` -- 8-axis octagonal radar chart (reuse on detail pages)
- `src/components/db-compass/CompassScoreBreakdown.astro` -- Dimension score display (reuse on detail pages)
- `src/components/db-compass/CapBadge.astro` -- CAP theorem badge (reuse on detail pages)
- `src/lib/db-compass/schema.ts` -- DbModel type with all fields needed: bestFor, avoidWhen, justifications, topDatabases, strengths, weaknesses, characterSketch
- `src/data/db-compass/models.json` -- 12 model entries with all detail page data
- `src/content.config.ts` -- Content collection config for dbModels
- `src/layouts/Layout.astro` -- Layout with SEOHead, CSP (blob: allowed in img-src), view transitions

### Secondary (MEDIUM confidence)
- [Schema.org CreativeWork](https://schema.org/CreativeWork) -- CreativeWork type properties for JSON-LD
- [MDN Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share) -- navigator.share() browser support and usage
- [Astro Routing Reference](https://docs.astro.build/en/reference/routing-reference/) -- getStaticPaths API reference
- [Can I Use Web Share](https://caniuse.com/web-share) -- Browser support table for Web Share API

### Tertiary (LOW confidence)
- None -- all findings verified against codebase or official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- entire stack is already installed and used; zero new dependencies
- Architecture: HIGH -- every pattern has a direct 1:1 precedent in the Beauty Index detail pages
- Pitfalls: HIGH -- derived from actual code inspection (CSP blob: check, viewBox mismatch, font issues) and Beauty Index production experience
- SEO/JSON-LD: HIGH -- Beauty Index CreativeWork JSON-LD provides exact template; schema.org docs confirm structure
- Share controls: HIGH -- ShareControls.astro is a complete 500+ line working implementation to adapt
- SVG-to-PNG: HIGH -- badge-generator.ts provides proven Blob+Image+Canvas pattern; CSP already allows blob:

**Research date:** 2026-02-21
**Valid until:** 2026-03-21 (30 days -- stable patterns, no dependency changes expected)
