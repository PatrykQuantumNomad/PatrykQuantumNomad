# Architecture: The Beauty Index Integration

**Domain:** Content pillar for existing Astro 5 portfolio site
**Researched:** 2026-02-17
**Overall confidence:** HIGH -- based on direct codebase analysis and verified Astro 5 / Satori documentation

## Recommended Architecture

The Beauty Index integrates as a **new content pillar** alongside `/blog/` and `/projects/`, using the same architectural patterns already established in the codebase: a JSON data file with the Astro 5 `file()` content loader for structured data, `getStaticPaths()` for dynamic routes, Satori + Sharp for OG images, and a React island for the one interactive component.

### High-Level Data Flow

```
src/data/beauty-index/languages.json     (25 languages, scores, metadata)
src/data/beauty-index/code-samples.ts    (code snippets per feature per language)
        |
        v
src/content.config.ts                    (file() loader + Zod schema for beautyIndex)
        |
        +---> src/pages/beauty-index/index.astro           (overview + rankings)
        +---> src/pages/beauty-index/[slug].astro          (per-language detail)
        +---> src/pages/beauty-index/code/index.astro      (feature-tabbed comparison)
        +---> src/pages/open-graph/beauty-index/[...slug].png.ts  (OG images)
        |
        v
src/components/beauty-index/
        RadarChart.astro           (build-time SVG, zero JS)
        RankingChart.astro         (build-time SVG bar chart, zero JS)
        CodeComparison.tsx         (React island, client:visible)
        LanguageCard.astro         (static card for overview grid)
        ScoreBadge.astro           (reusable score pill)
        CharacterSketch.astro      (character illustration wrapper)
        BeautyIndexJsonLd.astro    (structured data)
```

### Component Boundaries

| Component | Responsibility | Communicates With | JS Shipped to Client |
|-----------|---------------|-------------------|----------------------|
| `languages.json` | Single source of truth for all 25 languages + 6 scores + metadata | Content collection via `file()` loader | None |
| `code-samples.ts` | Feature-keyed code snippets for all languages | `CodeComparison.tsx`, code page | None |
| `RadarChart.astro` | Generates inline SVG radar chart at build time from 6 score values | Language detail pages, language cards | **0 bytes** |
| `RankingChart.astro` | Generates SVG horizontal bar chart of overall rankings | Overview page | **0 bytes** |
| `CodeComparison.tsx` | Interactive tabbed code viewer with feature/language switching | React island on `/beauty-index/code/` | ~3-5kb hydrated |
| `LanguageCard.astro` | Static card showing language name, rank, overall score, mini radar | Overview page grid | 0 bytes |
| `ScoreBadge.astro` | Colored score pill (gradient based on value) | Cards, detail pages | 0 bytes |
| `CharacterSketch.astro` | Wraps character illustration image with caption | Language detail pages | 0 bytes |
| `BeautyIndexJsonLd.astro` | Schema.org structured data for SEO | Layout head slot | 0 bytes |
| OG image endpoints | Build-time PNG generation via Satori + Sharp | Social sharing | 0 bytes (build only) |

---

## Data Model Design

### Primary Data: `src/data/beauty-index/languages.json`

Use the Astro 5 `file()` content loader because it provides Zod validation, TypeScript types, and `getCollection()` / `getEntry()` APIs -- matching the existing blog collection pattern. This is strictly better than a raw TypeScript array (like the current `projects.ts`) because it gives type-safe querying, Zod schema validation at build time, and avoids importing the full dataset into every page.

**Confidence:** HIGH -- verified against [Astro 5 Content Collections docs](https://docs.astro.build/en/guides/content-collections/) and the [Content Loader API reference](https://docs.astro.build/en/reference/content-loader-reference/). The `file()` loader accepts a base file path to a JSON file, requires each entry to have a unique `id` property, and supports Zod schema validation. The existing `content.config.ts` in this codebase already uses content collections.

**Example entry in `languages.json`:**

```json
[
  {
    "id": "python",
    "name": "Python",
    "slug": "python",
    "rank": 1,
    "year": 1991,
    "paradigm": "multi-paradigm",
    "tagline": "Readability counts.",
    "description": "Python's beauty lies in its insistence that there should be one obvious way to do it...",
    "characterName": "The Zen Poet",
    "characterDescription": "Calm, deliberate, believes less is more...",
    "characterImage": "/images/beauty-index/characters/python.png",
    "scores": {
      "readability": 9.2,
      "expressiveness": 8.5,
      "consistency": 8.8,
      "elegance": 8.0,
      "ecosystem": 9.5,
      "joy": 8.7
    },
    "overallScore": 8.78,
    "color": "#3776ab",
    "accentColor": "#ffd43b",
    "funFact": "Python was named after Monty Python, not the snake.",
    "tags": ["beginner-friendly", "data-science", "scripting", "web"]
  }
]
```

### Content Collection Schema: `src/content.config.ts`

Extend the existing config. The blog collection remains unchanged. Add the `beautyIndex` collection alongside it:

```typescript
import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/data/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    coverImage: z.string().optional(),
    externalUrl: z.string().url().optional(),
    source: z.enum(['Kubert AI', 'Translucent Computing']).optional(),
  }),
});

const beautyIndex = defineCollection({
  loader: file('src/data/beauty-index/languages.json'),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    rank: z.number().int().positive(),
    year: z.number().int(),
    paradigm: z.string(),
    tagline: z.string(),
    description: z.string(),
    characterName: z.string(),
    characterDescription: z.string(),
    characterImage: z.string(),
    scores: z.object({
      readability: z.number().min(0).max(10),
      expressiveness: z.number().min(0).max(10),
      consistency: z.number().min(0).max(10),
      elegance: z.number().min(0).max(10),
      ecosystem: z.number().min(0).max(10),
      joy: z.number().min(0).max(10),
    }),
    overallScore: z.number().min(0).max(10),
    color: z.string(),
    accentColor: z.string(),
    funFact: z.string(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { blog, beautyIndex };
```

**Why the `file()` loader and not `glob()` or a TypeScript module:**
- `glob()` is for markdown/MDX files. Language data is structured JSON, not prose content.
- A TypeScript module (`languages.ts`) like `projects.ts` works but loses Zod validation at build time and does not integrate with `getCollection()` / `getEntry()` APIs.
- `file()` gives the best of both worlds: JSON data with schema validation, type inference, and the collection query API.

### Code Samples: `src/data/beauty-index/code-samples.ts`

Code samples stay as a TypeScript file (not JSON) because they contain multi-line template literal strings that are painful to escape in JSON. They are keyed by feature, then contain an array of language samples:

```typescript
export interface CodeSample {
  language: string;  // slug matching languages.json id
  label: string;     // display name
  code: string;      // the actual code snippet
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  samples: CodeSample[];
}

export const features: Feature[] = [
  {
    id: 'hello-world',
    name: 'Hello World',
    description: 'The classic first program.',
    samples: [
      { language: 'python', label: 'Python', code: `print("Hello, World!")` },
      { language: 'rust', label: 'Rust', code: `fn main() {\n    println!("Hello, World!");\n}` },
      // ... 25 languages
    ],
  },
  // ... more features (error handling, iteration, pattern matching, etc.)
];
```

**Why not a content collection for code samples?** The code comparison page needs to access ALL samples at once grouped by feature. Content collections are optimized for per-entry access. A TypeScript import gives direct array access without async `getCollection()` overhead and allows complex grouping logic. The data model is inherently two-dimensional (features x languages), which maps better to nested TypeScript arrays than flat collection entries.

---

## Routing Strategy

### New Pages

| Route | File | Data Source | Purpose |
|-------|------|-------------|---------|
| `/beauty-index/` | `src/pages/beauty-index/index.astro` | `getCollection('beautyIndex')` | Overview: rankings chart, language grid, intro |
| `/beauty-index/[slug]/` | `src/pages/beauty-index/[slug].astro` | `getStaticPaths()` from collection | Per-language: radar chart, scores, character, full description |
| `/beauty-index/code/` | `src/pages/beauty-index/code/index.astro` | `import { features }` from code-samples.ts | Feature-tabbed code comparison (React island) |

### Dynamic Route Pattern

This mirrors the exact pattern used by `src/pages/blog/[slug].astro`:

```typescript
// src/pages/beauty-index/[slug].astro
---
import { getCollection } from 'astro:content';
import Layout from '../../layouts/Layout.astro';
import RadarChart from '../../components/beauty-index/RadarChart.astro';
import ScoreBadge from '../../components/beauty-index/ScoreBadge.astro';
import CharacterSketch from '../../components/beauty-index/CharacterSketch.astro';
import BreadcrumbJsonLd from '../../components/BreadcrumbJsonLd.astro';

export async function getStaticPaths() {
  const languages = await getCollection('beautyIndex');
  return languages.map((lang) => ({
    params: { slug: lang.data.slug },
    props: { language: lang },
  }));
}

const { language } = Astro.props;
const { name, scores, description, tagline, rank, overallScore } = language.data;
const ogImageURL = new URL(
  `/open-graph/beauty-index/${language.data.slug}.png`,
  Astro.site
).toString();
---

<Layout
  title={`${name} — The Beauty Index | Patryk Golabek`}
  description={`${name} scores ${overallScore}/10 in The Beauty Index. ${tagline}`}
  ogImage={ogImageURL}
>
  <!-- page content: radar chart, scores grid, character, description -->
  <BreadcrumbJsonLd crumbs={[
    { name: "Home", url: `${Astro.site}` },
    { name: "Beauty Index", url: `${new URL('/beauty-index/', Astro.site)}` },
    { name: name, url: `${new URL(`/beauty-index/${language.data.slug}/`, Astro.site)}` },
  ]} />
</Layout>
```

**Confidence:** HIGH -- this is the exact same `getStaticPaths` + props pattern used by `src/pages/blog/[slug].astro` in this codebase. The only difference is the data source (content collection vs content collection).

---

## Chart Rendering Strategy

### Decision: Build-Time SVG (not client-side JS charts)

**Use pure SVG generated at build time in Astro components.** Do NOT use Chart.js, D3, Recharts, or any client-side charting library.

**Rationale:**
1. The data is static (scores do not change at runtime) -- there is no interactivity needed on charts
2. SVG renders instantly with zero JavaScript payload
3. The site is statically generated -- build time is the correct time to compute SVG paths
4. Matches the site's performance philosophy (GSAP for scroll animations, not for rendering content)
5. SVG supports dark/light theme adaptation via CSS `currentColor` and `var(--color-*)` custom properties
6. SVG is accessible -- `aria-label` on the root element, semantic structure

**Confidence:** HIGH -- the math is standard polar-to-cartesian coordinate conversion. SVG polygon and path elements are universally supported by all browsers.

### Radar Chart: `src/components/beauty-index/RadarChart.astro`

Generate SVG polygon paths from the 6 scores using trigonometry in the Astro component frontmatter. The core math is approximately 40 lines:

```typescript
// In the frontmatter of RadarChart.astro
interface Props {
  scores: Record<string, number>;
  size?: number;
  showLabels?: boolean;
  color?: string;
}

const { scores, size = 200, showLabels = true, color = 'var(--color-accent)' } = Astro.props;

const categories = Object.keys(scores);
const values = Object.values(scores);
const count = categories.length; // 6
const cx = size / 2;
const cy = size / 2;
const radius = (size / 2) - (showLabels ? 30 : 10); // padding for labels

function polarToCartesian(angle: number, r: number): [number, number] {
  // Offset by -90 degrees so first axis points up
  const radian = ((angle - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(radian), cy + r * Math.sin(radian)];
}

const angleStep = 360 / count;

// Grid rings (3 concentric hexagons for the 6-axis chart)
const rings = [0.33, 0.66, 1.0];

// Score polygon points
const points = values.map((val, i) => {
  const normalizedRadius = (val / 10) * radius;
  return polarToCartesian(i * angleStep, normalizedRadius);
});

const polygonPoints = points.map(([x, y]) => `${x},${y}`).join(' ');
```

The template renders pure SVG:

```html
<svg viewBox={`0 0 ${size} ${size}`} class="radar-chart"
     role="img" aria-label={`Radar chart showing scores: ${categories.map((c, i) => `${c} ${values[i]}`).join(', ')}`}>
  <!-- Grid rings -->
  {rings.map((scale) => (
    <polygon
      points={Array.from({ length: count }, (_, i) =>
        polarToCartesian(i * angleStep, radius * scale).join(',')
      ).join(' ')}
      fill="none"
      stroke="var(--color-border)"
      stroke-width="1"
    />
  ))}
  <!-- Axis lines -->
  {categories.map((_, i) => {
    const [x, y] = polarToCartesian(i * angleStep, radius);
    return <line x1={cx} y1={cy} x2={x} y2={y} stroke="var(--color-border)" stroke-width="0.5" />;
  })}
  <!-- Score polygon (filled area) -->
  <polygon points={polygonPoints} fill={`${color}20`} stroke={color} stroke-width="2" />
  <!-- Score dots -->
  {points.map(([x, y]) => (
    <circle cx={x} cy={y} r="3" fill={color} />
  ))}
  <!-- Labels -->
  {showLabels && categories.map((cat, i) => {
    const [x, y] = polarToCartesian(i * angleStep, radius + 18);
    return (
      <text x={x} y={y} text-anchor="middle" dominant-baseline="central"
            class="text-[10px] fill-[var(--color-text-secondary)] font-mono uppercase">
        {cat}
      </text>
    );
  })}
</svg>
```

**No external library needed.** The `svg-radar-chart` package (9kb) exists but is unnecessary overhead for what amounts to ~40 lines of trigonometry. Keeping it inline means zero dependencies, full control over styling with CSS custom properties, and no virtual-dom-to-string conversion step.

### Shared Radar Math: `src/lib/radar-svg.ts`

Extract the polar-to-cartesian math into a shared utility because BOTH the Astro component and the OG image generator need the same calculations:

```typescript
// src/lib/radar-svg.ts
export interface RadarConfig {
  scores: Record<string, number>;
  size: number;
  padding: number;
}

export interface RadarGeometry {
  cx: number;
  cy: number;
  radius: number;
  angleStep: number;
  points: [number, number][];
  polygonPoints: string;
  axisEndpoints: [number, number][];
  labelPositions: [number, number][];
}

export function computeRadarGeometry(config: RadarConfig): RadarGeometry {
  // ... shared math used by RadarChart.astro and beauty-index-og.ts
}

export function generateRadarSvgString(config: RadarConfig, color: string): string {
  // Returns a complete SVG string (for embedding as data URI in OG images)
}
```

### Ranking Bar Chart: `src/components/beauty-index/RankingChart.astro`

Generate horizontal SVG bars at build time. Each bar width is proportional to the overall score. This is even simpler than the radar chart -- just `<rect>` elements with `<text>` labels. The maximum score (10.0) maps to 100% width; each language bar scales proportionally.

### Theme Compatibility

Both charts use `var(--color-*)` CSS custom properties, which means they automatically adapt to the site's existing light theme defined in `src/styles/global.css`. The CSS custom properties are:
- `var(--color-border)` for grid lines and axes
- `var(--color-text-secondary)` for labels
- `var(--color-accent)` as default polygon fill/stroke (overridable per-language via `color` prop)

If dark mode is added later, the charts will adapt with zero changes because they inherit from CSS variables.

---

## OG Image Strategy

### Approach: Extend Existing Satori + Sharp Pipeline

The site already generates OG images at `/open-graph/[...slug].png` using Satori + Sharp (see `src/lib/og-image.ts`). The Beauty Index OG images follow the exact same pattern with a custom layout.

### New OG Image Endpoints

| Route | File | What It Shows |
|-------|------|---------------|
| `/open-graph/beauty-index/overview.png` | `src/pages/open-graph/beauty-index/overview.png.ts` | "The Beauty Index" title card with top-5 ranking snippet |
| `/open-graph/beauty-index/[slug].png` | `src/pages/open-graph/beauty-index/[slug].png.ts` | Language name, rank badge, overall score, mini radar chart |
| `/open-graph/beauty-index/code.png` | `src/pages/open-graph/beauty-index/code.png.ts` | "Code Comparison" title card |

### Radar Chart in OG Images via Satori

Satori supports SVG elements embedded as data URIs inside `<img>` tags. This was confirmed via [vercel/satori#86](https://github.com/vercel/satori/issues/86), resolved in PR #98. The implementation serializes SVG to an XML string encoded as a data URI and embeds it within an `<img>` element. The approach:

1. Generate the radar chart SVG string using `generateRadarSvgString()` from `src/lib/radar-svg.ts`
2. Encode as a data URI: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
3. Embed in the Satori layout tree as an `<img>` element with `width` and `height`

```typescript
// src/lib/beauty-index-og.ts
import { generateRadarSvgString } from './radar-svg';
import { loadOgFonts, renderOgPng } from './og-shared';

export async function generateBeautyIndexOgImage(
  name: string,
  rank: number,
  overallScore: number,
  scores: Record<string, number>,
  color: string,
): Promise<Buffer> {
  await loadOgFonts();

  const radarSvg = generateRadarSvgString({ scores, size: 200, padding: 10 }, color);
  const radarUri = `data:image/svg+xml;base64,${Buffer.from(radarSvg).toString('base64')}`;

  const layout = {
    type: 'div',
    props: {
      style: { width: '1200px', height: '630px', display: 'flex', /* ... */ },
      children: [
        // Left column: "The Beauty Index", language name, rank, score
        // Right column: <img src={radarUri} width={200} height={200} />
      ],
    },
  };

  return renderOgPng(layout);
}
```

**Important Satori limitation:** Satori does not support native inline SVG elements in its JSX tree. You MUST use the `<img>` + data URI approach for embedding SVG content. This is a documented design decision, not a bug.

**Confidence:** HIGH -- the existing `src/lib/og-image.ts` already uses Satori + Sharp with the exact same rendering pattern. The SVG data URI embedding approach is documented and tested.

### Shared OG Utility Refactor

Extract common branding elements from the existing `src/lib/og-image.ts` to avoid duplication:

```typescript
// src/lib/og-shared.ts -- extracted from og-image.ts
export async function loadOgFonts(): Promise<{ inter: Buffer; spaceGrotesk: Buffer }> { ... }
export function brandingRow(): object { ... }      // "PG" badge + "patrykgolabek.dev"
export function accentBar(): object { ... }        // Gradient bar at top
export async function renderOgPng(layout: object): Promise<Buffer> { ... }  // Satori + Sharp
```

This is an optional refactor. If time-constrained, the Beauty Index OG file can duplicate the branding elements from `og-image.ts` (they are ~30 lines). The refactor is cleaner but not blocking.

---

## Code Comparison: Interactive Tab Component

### Decision: React Island with `client:visible`

The code comparison page needs tab switching to select a feature (e.g., "Error Handling") and see code samples from all 25 languages. This is the ONE place in the Beauty Index that requires client-side JavaScript.

**Use a React component** because:
1. React is already installed and configured (`@astrojs/react` in `astro.config.mjs`, React 19 in `package.json`)
2. The project already ships React for the Three.js 3D head scene on the about page
3. Managing two-dimensional tab state (feature selection + language filtering) is more ergonomic in React than vanilla JS
4. `client:visible` means the component hydrates only when scrolled into view

### Implementation Approach: Pre-rendered Code + React Tab Controller

The code blocks themselves are **pre-rendered at build time** using `astro-expressive-code`. The React island only handles tab state and visibility toggling. This keeps the JavaScript payload minimal (~3-5kb) because the heavy lifting (syntax highlighting) happens at build time.

```astro
<!-- src/pages/beauty-index/code/index.astro -->
---
import Layout from '../../../layouts/Layout.astro';
import { features } from '../../../data/beauty-index/code-samples';
import { Code } from 'astro-expressive-code/components';
import CodeTabs from '../../../components/beauty-index/CodeTabs';
---

<Layout title="Code Comparison — The Beauty Index | Patryk Golabek">
  <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <h1 class="text-3xl sm:text-4xl font-heading font-bold mb-4">Code Comparison</h1>

    {/* All code blocks pre-rendered into hidden panels */}
    <div id="code-panels">
      {features.map((feature) => (
        <div data-feature={feature.id} class="hidden">
          {feature.samples.map((sample) => (
            <div data-language={sample.language} class="hidden">
              <Code code={sample.code} lang={sample.language} />
            </div>
          ))}
        </div>
      ))}
    </div>

    {/* React island only manages which panels are visible */}
    <CodeTabs
      client:visible
      features={features.map(f => ({ id: f.id, name: f.name, description: f.description }))}
      languages={features[0]?.samples.map(s => ({ slug: s.language, label: s.label })) ?? []}
    />
  </section>
</Layout>
```

The React `CodeTabs` component is lightweight -- it renders feature tabs and language pills, then toggles `hidden` classes on the pre-rendered DOM elements via `document.querySelector`. It ships no code rendering logic and no syntax highlighting runtime.

**Fallback if the hybrid approach proves tricky:** Use vanilla JavaScript with `data-*` attributes for tab switching. The pre-rendered code blocks pattern works the same way. This is a valid alternative if passing feature/language metadata between Astro's static render and React's hydration creates friction.

**Confidence:** MEDIUM -- the hybrid pre-render + React tab controller pattern is architecturally sound, but the exact mechanics of a React island manipulating sibling DOM elements (not its own children) needs validation during implementation. The vanilla JS fallback is trivial to implement if needed.

---

## Navigation Integration

### Modified File: `src/components/Header.astro`

Add "Beauty Index" to the `navLinks` array. This is a one-line change:

```typescript
const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/blog/', label: 'Blog' },
  { href: '/projects/', label: 'Projects' },
  { href: '/beauty-index/', label: 'Beauty Index' },  // NEW
  { href: '/about/', label: 'About' },
  { href: '/contact/', label: 'Contact' },
];
```

The existing `isActive` logic on line 43 of `Header.astro` already handles nested routes correctly:

```typescript
const isActive = currentPath === link.href || (link.href !== '/' && currentPath.startsWith(link.href));
```

This means `/beauty-index/python/` will correctly highlight the "Beauty Index" nav link. No other Header changes needed. The mobile menu also iterates `navLinks`, so both desktop and mobile navigation are automatically updated.

---

## SEO Integration

### Existing SEO Components: No Changes Needed

The existing `SEOHead.astro` component (at `src/components/SEOHead.astro`) already supports all the props needed:
- Custom `title` and `description` per page
- Custom `ogImage` per page
- `ogType` ("website" for overview, can use "website" for language pages too)
- Canonical URL auto-generated from `Astro.url.pathname`
- Twitter Card with `summary_large_image`

The existing `Layout.astro` passes all these through to `SEOHead.astro`. Each Beauty Index page simply provides the correct props. No component modifications required.

### New Structured Data: `BeautyIndexJsonLd.astro`

Add Schema.org `ItemList` structured data for the overview page (ranking of languages) and article-like structured data for individual language pages. Follow the established pattern of `ProjectsJsonLd.astro` and `BlogPostingJsonLd.astro` already in the codebase.

### Breadcrumb Structured Data

Use the existing `BreadcrumbJsonLd.astro` component on all Beauty Index pages:
- Overview: Home > Beauty Index
- Language: Home > Beauty Index > [Language Name]
- Code: Home > Beauty Index > Code Comparison

### Sitemap

The existing `@astrojs/sitemap` integration in `astro.config.mjs` automatically discovers all static pages generated by `getStaticPaths()`. No configuration changes needed -- the 25+ new Beauty Index pages will appear in the sitemap at the next build.

---

## Complete File Manifest

### New Files (create)

| File | Type | Purpose |
|------|------|---------|
| `src/data/beauty-index/languages.json` | Data | 25 languages with scores, metadata, characters |
| `src/data/beauty-index/code-samples.ts` | Data | Code snippets grouped by feature |
| `src/pages/beauty-index/index.astro` | Page | Overview with rankings chart + language card grid |
| `src/pages/beauty-index/[slug].astro` | Page | Per-language detail page |
| `src/pages/beauty-index/code/index.astro` | Page | Feature-tabbed code comparison |
| `src/pages/open-graph/beauty-index/overview.png.ts` | Endpoint | OG image for overview page |
| `src/pages/open-graph/beauty-index/[slug].png.ts` | Endpoint | OG images for each language |
| `src/pages/open-graph/beauty-index/code.png.ts` | Endpoint | OG image for code comparison page |
| `src/components/beauty-index/RadarChart.astro` | Component | Build-time SVG radar chart |
| `src/components/beauty-index/RankingChart.astro` | Component | Build-time SVG horizontal bar chart |
| `src/components/beauty-index/LanguageCard.astro` | Component | Card for overview grid |
| `src/components/beauty-index/ScoreBadge.astro` | Component | Score display pill with color gradient |
| `src/components/beauty-index/CharacterSketch.astro` | Component | Character illustration wrapper |
| `src/components/beauty-index/CodeTabs.tsx` | Component | React island for tab switching |
| `src/components/beauty-index/BeautyIndexJsonLd.astro` | Component | Schema.org structured data |
| `src/lib/radar-svg.ts` | Utility | Shared radar chart geometry + SVG string generation |
| `src/lib/beauty-index-og.ts` | Utility | OG image generation specific to Beauty Index |
| `public/images/beauty-index/characters/*.png` | Assets | 25 character illustrations |

### Modified Files (edit)

| File | Change | Scope of Change |
|------|--------|----------------|
| `src/content.config.ts` | Add `beautyIndex` collection with `file()` loader + Zod schema | ~15 lines added, existing blog collection untouched |
| `src/components/Header.astro` | Add `{ href: '/beauty-index/', label: 'Beauty Index' }` to `navLinks` | 1 line added |

### Optional Refactor (not blocking)

| File | Change | Reason |
|------|--------|--------|
| `src/lib/og-image.ts` | Extract branding helpers to `src/lib/og-shared.ts` | Avoids duplicating accent bar, PG monogram, font loading in beauty-index-og.ts |

### Files NOT Modified

| File | Reason |
|------|--------|
| `astro.config.mjs` | No new integrations needed. React already configured. Sitemap auto-discovers. Expressive Code already configured. |
| `src/layouts/Layout.astro` | Already supports all needed props (title, description, ogImage, tags, canonicalURL) |
| `src/components/SEOHead.astro` | Already generic enough for Beauty Index pages |
| `tailwind.config.mjs` | No new Tailwind plugins or theme extensions needed. Existing CSS custom properties are sufficient. |
| `src/styles/global.css` | Component-scoped styles preferred over global additions |
| `package.json` | No new npm dependencies required -- all tech is already installed |

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Client-Side Chart Rendering
**What:** Using Chart.js, D3, Recharts, or any JS charting library to render radar/bar charts in the browser.
**Why bad:** Adds 50-200kb of JavaScript for completely static data. Causes layout shift as charts render after hydration. Violates the site's zero-JS-by-default philosophy. The data never changes at runtime.
**Instead:** Generate SVG at build time in Astro component frontmatter. Zero JS, instant render, accessible.

### Anti-Pattern 2: Separate Content Collections per Data Type
**What:** Creating separate collections for scores, characters, code samples, and metadata.
**Why bad:** Creates N+1 query patterns. Forces cross-collection joins in page templates. Complicates the build.
**Instead:** One flat JSON file with all language data. Code samples separate only because they need a different access pattern (grouped by feature, not by language).

### Anti-Pattern 3: Using MDX Files for Language Pages
**What:** Writing each of the 25 languages as an `.mdx` file with frontmatter scores.
**Why bad:** 25 nearly-identical files with copy-pasted templates. Hard to maintain rankings (changing rank #5 requires editing multiple files). No single-source-of-truth for the ranking order. MDX parsing overhead for what is fundamentally structured data, not prose.
**Instead:** One JSON file with all 25 languages. One dynamic route `[slug].astro` renders them all from the same template.

### Anti-Pattern 4: Full Page Hydration for Code Tabs
**What:** Using `client:load` on a large component that re-renders all code blocks client-side.
**Why bad:** Ships all 25 * N code samples as JavaScript strings. Slow initial load. Duplicates what Expressive Code already does at build time.
**Instead:** Pre-render all code blocks at build time with Expressive Code. React island only toggles visibility via DOM class manipulation.

### Anti-Pattern 5: Hardcoded Radar Chart SVG Paths
**What:** Manually computing and pasting SVG path coordinates for each language.
**Why bad:** Unmaintainable. Any score change requires recalculating coordinates by hand. Error-prone.
**Instead:** Compute SVG geometry programmatically from scores using `src/lib/radar-svg.ts`.

### Anti-Pattern 6: Duplicating OG Image Code
**What:** Copy-pasting the entire `og-image.ts` and modifying it for Beauty Index.
**Why bad:** Two copies of font loading, branding elements, Satori config, and Sharp conversion. Changes to the PG branding require updates in two places.
**Instead:** Extract shared helpers (font loading, branding row, accent bar, render-to-PNG) into `og-shared.ts`. Both the existing blog OG and Beauty Index OG import from it.

---

## Build Order (Dependency Graph)

The phases below are ordered by dependency. Items within a phase can be built in parallel.

```
Phase 1: Data Foundation (no dependencies)
  1.1  Create src/data/beauty-index/languages.json (start with 3-5 seed languages)
  1.2  Add beautyIndex collection to src/content.config.ts
  1.3  Create src/lib/radar-svg.ts (shared radar geometry math)
       Verify: `astro check` passes, collection is queryable

Phase 2: Core Components (depends on 1.1, 1.3)
  2.1  RadarChart.astro (uses radar-svg.ts for geometry)
  2.2  ScoreBadge.astro (standalone, no dependencies)
  2.3  RankingChart.astro (standalone SVG bar chart)
  2.4  LanguageCard.astro (composes RadarChart + ScoreBadge)
  2.5  CharacterSketch.astro (standalone image wrapper)
       Verify: components render correctly in isolation

Phase 3: Pages (depends on Phase 2)
  3.1  /beauty-index/[slug].astro (uses RadarChart, ScoreBadge, CharacterSketch)
  3.2  /beauty-index/index.astro (uses RankingChart, LanguageCard, links to [slug])
       Verify: pages build, routes resolve, layout/nav work

Phase 4: Code Comparison (can be built in parallel with Phase 3)
  4.1  Create src/data/beauty-index/code-samples.ts
  4.2  CodeTabs.tsx React component
  4.3  /beauty-index/code/index.astro
       Verify: tab switching works, code blocks render with syntax highlighting

Phase 5: OG Images (depends on 1.3, can parallel with Phases 3-4)
  5.1  src/lib/beauty-index-og.ts (or src/lib/og-shared.ts refactor first)
  5.2  OG image endpoints (overview.png.ts, [slug].png.ts, code.png.ts)
       Verify: OG images generate at build time, radar chart visible in PNGs

Phase 6: Integration Polish (depends on all above)
  6.1  Add "Beauty Index" to Header.astro navLinks
  6.2  BeautyIndexJsonLd.astro structured data
  6.3  BreadcrumbJsonLd on all Beauty Index pages
  6.4  Complete all 25 languages in languages.json
  6.5  Complete all character illustrations in public/images/
  6.6  Optional: Add Beauty Index teaser card to homepage
       Verify: full build passes, sitemap includes all pages, OG images valid
```

**Phase ordering rationale:**
- **Data model first** because every other component reads from it. If the schema is wrong, everything downstream breaks.
- **Shared radar math** in Phase 1 because both Astro components (Phase 2) and OG images (Phase 5) depend on it.
- **Components before pages** because pages compose components. Building pages without components means dummy markup that gets replaced.
- **Code comparison is independent** -- it uses its own data source (`code-samples.ts`) and its own component tree. Can be developed in parallel with the main pages.
- **OG images can also parallel** -- they only depend on the radar math utility, not on the page components.
- **Navigation last** because it is a one-line edit with zero risk. Adding it early creates dead links during development.

---

## Scalability Considerations

| Concern | At 25 languages (launch) | At 50 languages | At 100+ languages |
|---------|-------------------------|------------------|--------------------|
| Build time | Negligible (~25 SVGs + 25 pages + 27 OG images) | Still fast (< 5s additional) | Consider pagination on overview page |
| `languages.json` size | ~15kb | ~30kb | Split into category files with multiple `file()` loaders |
| OG image generation | ~27 images, ~10-15s build time | ~52 images, ~20s | Acceptable for static build; cache if needed |
| Code samples file | ~50kb (25 langs x ~6 features) | ~100kb | Split into per-feature files |
| Overview page DOM | 25 cards -- fine | 50 cards -- add category filtering | 100+ cards -- paginate or virtualize |
| Navigation | Single "Beauty Index" link | Same | May need dropdown submenu |

---

## Sources

- [Astro 5 Content Collections documentation](https://docs.astro.build/en/guides/content-collections/) -- `file()` loader, Zod schema, `getCollection` API (HIGH confidence)
- [Astro Content Loader API reference](https://docs.astro.build/en/reference/content-loader-reference/) -- `file()` loader specification, id requirements (HIGH confidence)
- [Astro Islands Architecture](https://docs.astro.build/en/concepts/islands/) -- `client:visible` directive, partial hydration (HIGH confidence)
- [Astro Routing Reference](https://docs.astro.build/en/reference/routing-reference/) -- `getStaticPaths` for dynamic routes (HIGH confidence)
- [Satori GitHub repository](https://github.com/vercel/satori) -- CSS/HTML subset, SVG generation capabilities, flexbox layout (HIGH confidence)
- [Satori SVG support issue #86](https://github.com/vercel/satori/issues/86) -- confirmed SVG data URI embedding approach, resolved in PR #98 (HIGH confidence)
- [SVG Radar Charts without D3](https://data-witches.com/2023/12/radar-chart-fun-with-svgs-aka-no-small-multiples-no-problem/) -- pure SVG polar coordinate approach (MEDIUM confidence)
- [svg-radar-chart library](https://github.com/derhuerst/svg-radar-chart) -- 9kb alternative considered and rejected in favor of inline math (MEDIUM confidence)
- Existing codebase files examined: `src/content.config.ts`, `src/pages/blog/[slug].astro`, `src/pages/open-graph/[...slug].png.ts`, `src/lib/og-image.ts`, `src/components/Header.astro`, `src/components/SEOHead.astro`, `src/layouts/Layout.astro`, `src/data/projects.ts`, `src/data/site.ts`, `astro.config.mjs`, `package.json`, `tailwind.config.mjs`, `src/styles/global.css`

---

*Architecture research for: The Beauty Index content pillar*
*Researched: 2026-02-17*
