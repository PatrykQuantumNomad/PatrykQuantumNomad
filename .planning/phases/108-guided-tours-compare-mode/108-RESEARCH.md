# Phase 108: Guided Tours & Compare Mode - Research

**Researched:** 2026-03-27
**Domain:** Curated guided tour UI, side-by-side comparison mode, VS static pages with structured data and OG images, Astro dynamic routing
**Confidence:** HIGH

## Summary

Phase 108 adds two major features to the AI landscape explorer: (1) guided learning paths that walk non-technical users through curated sequences of graph nodes, and (2) a compare mode that lets users select two concepts for side-by-side analysis, with dedicated VS pages for popular comparisons that carry SEO value.

The existing codebase is well-positioned for both features. `InteractiveGraph.tsx` (613 lines) already manages `selectedNode`, `highlightedNodeIds`, `zoomToNode`, and URL sync via `history.replaceState`. The `nodeMap` and `posMap` are memoized. The `edges` array (66 edges) and `nodes` array (51 nodes) are passed as props. The `buildAncestryChain` function already computes ancestry paths. The `groupRelationshipsByType` function already categorizes relationships. The `DetailPanel` component already renders concept details with ELI5 toggle. All the data primitives needed for tours and comparisons exist.

For the tour feature, the data is purely static (3 curated sequences of node IDs) and belongs in a new `tours.ts` data file, not in the JSON data files. The tour UI is a stepper bar (progress indicator + prev/next buttons) that sits above or below the graph and drives `selectedNode` + `zoomToNode` + edge highlighting. No external library is needed -- a `useTour` hook with `currentIndex`, `next()`, `prev()`, and `exit()` is sufficient. The tour state replaces normal selection mode: when a tour is active, clicking a node outside the tour sequence should not break the tour flow.

For VS pages, Astro's `getStaticPaths` generates pages at `/ai-landscape/vs/[slug].astro` where the slug is `{concept1}-vs-{concept2}` (single parameter, not two). A curated list of ~10-15 popular comparisons (e.g., "machine-learning-vs-deep-learning", "supervised-learning-vs-unsupervised-learning") is defined in a `comparisons.ts` data file. Each VS page is a static Astro page with both concepts' descriptions, relationships, ancestry paths, and structured data. The OG image generator already uses satori + sharp and can be extended with a new `generateVsOgImage` function showing both concept names with cluster colors.

**Primary recommendation:** Build tour and comparison as separate feature tracks. Tour is a React-only addition to InteractiveGraph (new `TourBar` component + `useTour` hook + `tours.ts` data). Compare is split between a React `ComparePanel` in the interactive graph and static Astro VS pages at `/ai-landscape/vs/[slug].astro`. Both share the same data utilities (ancestry, relationships) already implemented.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NAV-03 | Guided learning paths -- 3-4 curated tours ("The Big Picture", "How ChatGPT Works", "What is Agentic AI") | Tours are arrays of node slugs in `tours.ts`. The 51-node dataset provides all needed concepts: "The Big Picture" traverses the hierarchy backbone (AI -> ML -> NN -> DL -> GenAI -> Agentic), "How ChatGPT Works" follows the LLM lineage (AI -> ML -> NN -> DL -> Transformers -> Foundation Models -> LLMs -> Prompt Engineering), "What is Agentic AI" follows (AI -> ML -> RL -> DRL -> Foundation Models -> Reasoning Models -> Agentic AI -> Tool Use -> MCP). All nodes exist in the dataset. |
| NAV-04 | Tour UI with progress indicator, next/prev controls, sequential node highlighting | A `TourBar` component renders a progress bar (current step / total), prev/next buttons, tour title, and exit button. On step change: (1) set `selectedNode` to current tour node, (2) call `zoomToNode`, (3) highlight edges connecting the current node to the previous and next tour nodes. The `useTour` hook manages index state. No library needed. |
| SEO-07 | Compare mode -- select two concepts for side-by-side comparison | A `compareNode` state (second selection) in InteractiveGraph. When a second node is selected while in compare mode, a `ComparePanel` renders side-by-side descriptions, grouped relationships, and ancestry paths using existing `groupRelationshipsByType` and `buildAncestryChain`. Both nodes are highlighted on the graph. |
| SEO-08 | VS pages at /ai-landscape/vs/[slug1]-vs-[slug2] for popular comparisons | Static Astro pages at `/ai-landscape/vs/[slug].astro` where slug = `concept1-vs-concept2`. A curated list of ~12 popular pairs in `comparisons.ts`. Each page uses `getStaticPaths` returning one entry per comparison. JSON-LD uses DefinedTerm for both concepts. OG image shows both names side-by-side via a new `generateVsOgImage` satori template. |
</phase_requirements>

## Project Constraints (from CLAUDE.md & prior decisions)

- D3 micro-module imports only (never umbrella `d3` package) -- bundle isolation critical
- `client:only="react"` for graph island (never `client:visible`) -- prevents SSR crash
- React 19.2.4 with `@astrojs/react` 4.4.2
- Tailwind CSS 3.4.19 for non-SVG styling, CSS custom properties for SVG theming
- `html.dark` class toggle for dark mode (existing project pattern)
- Pre-computed positions from `layout.json` -- no runtime force simulation
- d3-zoom + React integration: zoom behavior in useRef, transform state in single `<g>` wrapper
- Two-file data split: nodes.json (file() loader content collection) + graph.json (clusters/edges, direct import)
- `history.replaceState` for URL updates (not pushState)
- Node `id === slug` throughout the dataset (verified: all 51 nodes)
- Astro 5.17.1 with `trailingSlash: 'always'` and `output: 'static'`
- Satori 0.19.2 + sharp 0.34.5 for OG image generation (already installed)
- Vitest 4.0.18 for tests (pattern: `src/**/*.test.ts`)
- Existing conventions: 2-space indent, single quotes, no barrel files, relative imports, PascalCase components, camelCase utils
- DetailPanel is pure presentational -- no positioning or open/close state
- URL sync uses `history.replaceState` (not pushState)
- zoomToNode uses viewBox dimensions for correct transform at scale=2
- SEO is a core project priority -- VS pages must have structured data, OG images, and proper meta descriptions
- The site is `https://patrykgolabek.dev` -- hardcoded in existing JSON-LD and breadcrumb components

## Standard Stack

### Core (already installed -- no new dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | 19.2.4 | Component rendering, tour state, compare state | Already installed. All interactive UI is React islands. |
| d3-zoom | 3.0.0 | Programmatic zoom-to-node during tour steps | Already installed. zoomToNode callback exists. |
| d3-selection | 3.0.0 | `select(svg).transition().call(zoomBehavior.transform, ...)` | Already installed. Required for d3-zoom transitions. |
| satori | 0.19.2 | VS page OG image generation (side-by-side concept layout) | Already installed. Used by existing OG image pipeline. |
| sharp | 0.34.5 | Convert satori SVG to PNG for VS page OG images | Already installed. Used by existing OG image pipeline. |
| astro | 5.17.1 | Static page generation for VS pages via getStaticPaths | Already installed. Framework for the entire site. |
| tailwindcss | 3.4.19 | Tour bar styling, compare panel styling, VS page layout | Already installed. Project's CSS framework. |
| vitest | 4.0.18 | Unit tests for tour data, comparison data, route utilities | Already installed. Project's test framework. |

### NOT needed (no new dependencies)
| Library | Why Not |
|---------|---------|
| react-joyride | Tour targets are graph nodes (SVG circles), not DOM elements. Joyride uses DOM positioning which doesn't work inside SVG with d3-zoom transforms. Custom tour UI is simpler. |
| @floating-ui/react | Tour popover positions are driven by SVG node positions + d3 transform, not DOM layout. Floating UI adds no value here. |
| zustand / jotai | All state lives inside the InteractiveGraph React tree. No cross-component state needed. |
| fuzzy search lib | Tour list is 3 items, comparison list is ~12 items. No search needed. |

**Installation:** No new packages needed. All dependencies are already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/ai-landscape/
    TourBar.tsx              # Tour progress bar + prev/next/exit controls
    TourSelector.tsx         # Tour picker dropdown/cards (choose which tour)
    ComparePanel.tsx         # Side-by-side comparison panel (React)
    CompareButton.tsx        # "Compare" toggle button in graph toolbar
  lib/ai-landscape/
    tours.ts                 # Tour definitions: id, title, description, steps[]
    comparisons.ts           # Curated comparison pairs + helper functions
    __tests__/
      tours.test.ts          # Tour data validation tests
      comparisons.test.ts    # Comparison data validation tests
  pages/ai-landscape/
    vs/
      [slug].astro           # VS comparison page template
  pages/open-graph/ai-landscape/
    vs/
      [slug].png.ts          # VS page OG image endpoint
```

### Pattern 1: Tour State Machine (useTour hook)
**What:** A custom hook managing the tour lifecycle: idle -> active (with step index) -> completed/exited
**When to use:** When the tour bar needs to drive graph state (selectedNode, zoomToNode, highlights)

```typescript
// tours.ts -- Tour data definitions
export interface TourStep {
  nodeId: string;          // slug of the node to visit
  narrative: string;       // short explanation for this step (1-2 sentences)
}

export interface Tour {
  id: string;              // e.g. 'the-big-picture'
  title: string;           // e.g. 'The Big Picture'
  description: string;     // 1 sentence tour description
  steps: TourStep[];       // ordered sequence of nodes to visit
}

export const TOURS: Tour[] = [
  {
    id: 'the-big-picture',
    title: 'The Big Picture',
    description: 'See how the entire AI landscape fits together, from broad AI to specialized applications.',
    steps: [
      { nodeId: 'artificial-intelligence', narrative: 'Everything starts here. AI is the broad field of making machines smart.' },
      { nodeId: 'machine-learning', narrative: 'ML is a subset of AI where machines learn from data instead of following explicit rules.' },
      { nodeId: 'neural-networks', narrative: 'Neural networks are inspired by the brain and learn to recognize patterns in data.' },
      { nodeId: 'deep-learning', narrative: 'Deep learning uses many layers of neural networks to solve complex problems.' },
      { nodeId: 'generative-ai', narrative: 'GenAI creates new content -- text, images, code -- rather than just classifying data.' },
      { nodeId: 'large-language-models', narrative: 'LLMs like GPT-4 are the engines behind ChatGPT and modern AI assistants.' },
      { nodeId: 'agentic-ai', narrative: 'Agentic AI can plan, use tools, and take actions autonomously -- the cutting edge.' },
    ],
  },
  // ... more tours
];
```

### Pattern 2: Curated VS Pairs with Canonical Slug Ordering
**What:** A comparison pair always has a canonical slug order (alphabetical) to prevent duplicate pages
**When to use:** For generating VS page routes and normalizing compare mode URLs

```typescript
// comparisons.ts -- Curated comparison pairs
export interface ComparisonPair {
  slug: string;            // e.g. 'deep-learning-vs-machine-learning'
  concept1: string;        // node slug (alphabetically first)
  concept2: string;        // node slug (alphabetically second)
  question: string;        // SEO title question, e.g. "Machine Learning vs Deep Learning: What's the Difference?"
  summary: string;         // 2-3 sentence SEO meta description
}

/**
 * Creates a canonical comparison slug from two concept slugs.
 * Always alphabetical order to prevent duplicates.
 */
export function comparisonSlug(slug1: string, slug2: string): string {
  const sorted = [slug1, slug2].sort();
  return `${sorted[0]}-vs-${sorted[1]}`;
}

/**
 * Parses a comparison slug back into two concept slugs.
 * Returns null if the slug doesn't match the pattern.
 */
export function parseComparisonSlug(slug: string): { concept1: string; concept2: string } | null {
  const match = slug.match(/^(.+)-vs-(.+)$/);
  if (!match) return null;
  return { concept1: match[1], concept2: match[2] };
}
```

### Pattern 3: Tour Mode Replaces Normal Selection
**What:** When a tour is active, the InteractiveGraph enters "tour mode" where selection is driven by the tour stepper, not by direct node clicks
**When to use:** Prevents tour UI from being disrupted by random node clicks

```
Tour Mode State Machine:
  IDLE: Normal graph interaction (click nodes, search, keyboard nav)
  TOUR_ACTIVE: Tour drives selection. Clicking nodes outside the tour is disabled or shows "Exit tour to explore freely"
  TOUR_COMPLETE: Return to IDLE, selected node stays on last tour step
```

### Pattern 4: Astro VS Page Route with Single Slug Parameter
**What:** Use `/ai-landscape/vs/[slug].astro` where slug = `concept1-vs-concept2` (single parameter)
**When to use:** Astro requires `getStaticPaths` to return params matching the file path. A single `[slug]` is simpler and more flexible than trying to use two parameters.

```typescript
// pages/ai-landscape/vs/[slug].astro
export async function getStaticPaths() {
  const entries = await getCollection('aiLandscape');
  const nodesMap = new Map(entries.map((e) => [e.data.slug, e.data]));

  return POPULAR_COMPARISONS.map((pair) => ({
    params: { slug: pair.slug },
    props: {
      pair,
      node1: nodesMap.get(pair.concept1),
      node2: nodesMap.get(pair.concept2),
    },
  }));
}
```

### Anti-Patterns to Avoid
- **Tour as overlay/tooltip library:** Do NOT use react-joyride or similar. These libraries position tooltips relative to DOM elements. Graph nodes live inside an SVG with d3-zoom transforms. The TourBar should be a fixed UI element outside the SVG, while highlighting happens inside the SVG via the existing `highlightedNodeIds` mechanism.
- **Two dynamic route parameters for VS pages:** Do NOT use `[slug1]/vs/[slug2].astro` or `[...slug].astro` for VS pages. A single `[slug].astro` with the slug being `concept1-vs-concept2` is cleaner, produces better URLs, and avoids Astro's rest parameter limitations.
- **Generating all 1,275 possible pairs:** With 51 nodes, there are C(51,2) = 1,275 possible comparison pairs. Do NOT generate pages for all of them. Curate ~12-15 popular/meaningful comparisons that people actually search for. The interactive compare mode handles arbitrary pairs at runtime.
- **Mutating InteractiveGraph props:** Tours and comparisons should be managed via React state inside InteractiveGraph, NOT by modifying the data props from the Astro parent.
- **Separate URL parameter for compare mode:** Do NOT use `?compare=slug1,slug2` as a URL parameter. Compare mode in the interactive graph is ephemeral UI state. Only the dedicated VS pages have permanent URLs.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OG image rendering | Custom canvas/image manipulation | satori + sharp (already in project) | Satori renders JSX-like trees to SVG, sharp converts to PNG. The pattern is already established in `generateAiLandscapeOgImage`. |
| Ancestry paths for VS pages | Custom tree traversal | `buildAncestryChain()` from `ancestry.ts` | Already implemented and tested. Returns root-first ancestor array. |
| Relationship grouping for VS pages | Custom edge filtering | `groupRelationshipsByType()` from `schema.ts` | Already implemented. Returns UI-friendly groups: Part of, Includes, Enables, Examples, Related. |
| JSON-LD structured data | Custom JSON generation | Extend existing `DefinedTermJsonLd.astro` + `BreadcrumbJsonLd.astro` | These components are already tested. VS pages just need two DefinedTerm entries. |
| Graph node highlighting | Custom SVG manipulation | Existing `highlightedNodeIds` Set + opacity logic in InteractiveGraph | The highlighting system already dims non-highlighted nodes to 0.2 opacity and shows accent rings on highlighted ones. |
| Zoom-to-node animation | Custom transform calculation | Existing `zoomToNode` callback | Already implements viewBox-based transform calculation at scale=2. |

**Key insight:** This phase is primarily about orchestration (combining existing primitives in new ways) rather than building new infrastructure. The data utilities, highlighting system, zoom controls, OG image pipeline, and structured data components are all already built.

## Common Pitfalls

### Pitfall 1: Tour Step Highlight Doesn't Show Connected Edges
**What goes wrong:** Tour highlights only the current node but not the edges connecting it to adjacent tour steps, making the path invisible.
**Why it happens:** The existing `highlightedNodeIds` only highlights nodes, not specific edges. Edge highlighting is based on both endpoints being in the highlighted set.
**How to avoid:** When computing tour highlights, include both the current step node AND the previous/next step nodes in `highlightedNodeIds`. This causes the connecting edges (if they exist in the graph) to also be highlighted via the existing `bothInChain` logic.
**Warning signs:** Tour feels disconnected -- user sees highlighted node but no visual path.

### Pitfall 2: Tour Mode Breaks Keyboard Navigation
**What goes wrong:** When a tour is active, arrow keys still try to navigate the graph adjacency map instead of moving between tour steps.
**Why it happens:** The keyboard handler in InteractiveGraph doesn't check if a tour is active.
**How to avoid:** In tour mode, remap left/right arrow keys (and optionally up/down) to `prev()`/`next()` tour functions. Escape exits the tour. Enter opens the detail panel for the current tour node.
**Warning signs:** Arrow keys navigate to random neighbors instead of following the tour sequence.

### Pitfall 3: VS Page Slug Parsing Ambiguity
**What goes wrong:** The slug `retrieval-augmented-generation-vs-fine-tuning` could be parsed as concept1=`retrieval-augmented-generation`, concept2=`fine-tuning` or concept1=`retrieval-augmented`, concept2=`generation-vs-fine-tuning` (wrong).
**Why it happens:** The `-vs-` separator is ambiguous when concept slugs themselves contain hyphens.
**How to avoid:** Use a curated `POPULAR_COMPARISONS` array that maps slug -> concept1 + concept2 explicitly. Do NOT try to parse the slug at runtime. The `getStaticPaths` function passes both concept slugs as props.
**Warning signs:** VS page shows wrong concepts or 404s.

### Pitfall 4: Compare Panel Fights Detail Panel for Space
**What goes wrong:** On desktop, both the DetailPanel (right sidebar, w-80) and ComparePanel try to render simultaneously, causing layout overflow.
**Why it happens:** Compare mode and node selection mode are not mutually exclusive in the state.
**How to avoid:** Compare mode replaces the DetailPanel. When compare mode is active, the right sidebar shows the ComparePanel instead. Exiting compare mode returns to normal detail panel behavior.
**Warning signs:** Two panels render side by side or overlap.

### Pitfall 5: Tour Narrative Text in Wrong Place
**What goes wrong:** Tour narratives are shown in a tooltip-like popover near the node, which moves with zoom/pan and is hard to read.
**Why it happens:** Trying to position narrative text relative to SVG node positions.
**How to avoid:** Tour narratives go in the TourBar (fixed position above or below the graph), NOT near the node. The TourBar shows: tour title, step X of Y, narrative text, prev/next buttons. The node is highlighted in the SVG, and the DetailPanel can optionally show the full concept details.
**Warning signs:** Text overlaps with graph elements, moves when panning.

### Pitfall 6: VS Page Missing OG Image Route
**What goes wrong:** VS pages link to OG images at `/open-graph/ai-landscape/vs/[slug].png` but no route generates them, causing broken social media previews.
**Why it happens:** OG image route is forgotten when creating VS page route.
**How to avoid:** Create the VS OG image endpoint (`/pages/open-graph/ai-landscape/vs/[slug].png.ts`) at the same time as the VS page template. Use the same `POPULAR_COMPARISONS` array in both `getStaticPaths` functions.
**Warning signs:** Social media shares show default/broken image.

## Code Examples

### Tour Data: Three Curated Paths

Based on analysis of the 51-node dataset and edge relationships:

```typescript
// src/lib/ai-landscape/tours.ts

export interface TourStep {
  nodeId: string;
  narrative: string;
}

export interface Tour {
  id: string;
  title: string;
  description: string;
  steps: TourStep[];
}

// Tour 1: "The Big Picture" -- follows the hierarchy backbone
// Nodes: AI -> ML -> NN -> DL -> GenAI -> LLMs -> Agentic AI
// All connected by 'hierarchy' edges in graph.json

// Tour 2: "How ChatGPT Works" -- follows the LLM lineage
// Nodes: AI -> ML -> NN -> DL -> Transformers -> Foundation Models -> LLMs -> Prompt Engineering -> Context Windows -> RLHF/DPO
// Mixes hierarchy + includes + enables + relates edges

// Tour 3: "What is Agentic AI" -- follows the agentic path
// Nodes: AI -> ML -> Reinforcement Learning -> Foundation Models -> Reasoning Models -> Agentic AI -> Autonomy -> Tool Use -> MCP
// Crosses multiple clusters (ai, ml, dl, agentic, devtools)
```

### VS Page Route Pattern (Astro getStaticPaths)

```typescript
// src/pages/ai-landscape/vs/[slug].astro
import { getCollection } from 'astro:content';
import { POPULAR_COMPARISONS } from '../../../lib/ai-landscape/comparisons';

export async function getStaticPaths() {
  const entries = await getCollection('aiLandscape');
  const nodesMap = new Map(entries.map((e) => [e.data.slug, e.data]));
  const clusters = new Map(graphData.clusters.map((c) => [c.id, c]));

  return POPULAR_COMPARISONS
    .filter((pair) => nodesMap.has(pair.concept1) && nodesMap.has(pair.concept2))
    .map((pair) => ({
      params: { slug: pair.slug },
      props: {
        pair,
        node1: nodesMap.get(pair.concept1)!,
        node2: nodesMap.get(pair.concept2)!,
        cluster1: clusters.get(nodesMap.get(pair.concept1)!.cluster),
        cluster2: clusters.get(nodesMap.get(pair.concept2)!.cluster),
        ancestry1: buildAncestryChain(pair.concept1, nodesMap),
        ancestry2: buildAncestryChain(pair.concept2, nodesMap),
      },
    }));
}
```

### VS Page JSON-LD Structured Data

```typescript
// Two DefinedTerm entries + BreadcrumbList + FAQPage for "What's the difference?"
const schema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": `What is the difference between ${node1.name} and ${node2.name}?`,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": pair.summary,
    },
  }],
};
// Plus two DefinedTerm entries (reuse existing component)
```

### TourBar Component Structure

```typescript
// src/components/ai-landscape/TourBar.tsx
interface TourBarProps {
  tour: Tour;
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onExit: () => void;
}

// Renders: [Exit X] | Tour Title | Step 3 of 7 | narrative | [< Prev] [Next >]
// Fixed position above the graph, outside the SVG
// Uses Tailwind for styling -- matches existing project design tokens
```

### Recommended Popular Comparisons (~12 pairs)

Based on common search queries and educational value:

```typescript
export const POPULAR_COMPARISONS: ComparisonPair[] = [
  // Core distinctions people search for
  { slug: 'artificial-intelligence-vs-machine-learning', concept1: 'artificial-intelligence', concept2: 'machine-learning', ... },
  { slug: 'deep-learning-vs-machine-learning', concept1: 'deep-learning', concept2: 'machine-learning', ... },
  { slug: 'deep-learning-vs-neural-networks', concept1: 'deep-learning', concept2: 'neural-networks', ... },
  { slug: 'supervised-learning-vs-unsupervised-learning', concept1: 'supervised-learning', concept2: 'unsupervised-learning', ... },
  // GenAI distinctions
  { slug: 'generative-ai-vs-large-language-models', concept1: 'generative-ai', concept2: 'large-language-models', ... },
  { slug: 'fine-tuning-vs-prompt-engineering', concept1: 'fine-tuning', concept2: 'prompt-engineering', ... },
  { slug: 'fine-tuning-vs-retrieval-augmented-generation', concept1: 'fine-tuning', concept2: 'retrieval-augmented-generation', ... },
  // Architecture comparisons
  { slug: 'convolutional-neural-networks-vs-transformers', concept1: 'convolutional-neural-networks', concept2: 'transformers', ... },
  { slug: 'generative-adversarial-networks-vs-diffusion-models', concept1: 'diffusion-models', concept2: 'generative-adversarial-networks', ... },
  // Agentic comparisons
  { slug: 'agentic-ai-vs-large-language-models', concept1: 'agentic-ai', concept2: 'large-language-models', ... },
  // Level comparisons
  { slug: 'artificial-general-intelligence-vs-artificial-narrow-intelligence', concept1: 'artificial-general-intelligence', concept2: 'artificial-narrow-intelligence', ... },
  // Techniques
  { slug: 'computer-vision-vs-natural-language-processing', concept1: 'computer-vision', concept2: 'natural-language-processing', ... },
];
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| React product tour libraries (Joyride, Reactour) | Custom tour components for SVG/canvas contexts | 2024+ | Tour libraries assume DOM elements. SVG graphs with zoom transforms need custom solutions. |
| Generate all possible comparison pairs | Curate popular comparisons + runtime compare for the rest | Ongoing best practice | Reduces build time, focuses SEO value on high-traffic pairs |
| schema.org Product comparison markup | FAQPage + DefinedTerm for educational comparisons | 2025 | Google does not have a "ComparisonPage" schema type. FAQPage ("What's the difference?") + DefinedTerm per concept is the best fit for educational content. Schema-compliant pages are cited 3.1x more in AI Overviews per Google I/O 2026 data. |

**Deprecated/outdated:**
- `schema.org/ComparisonChart`: Not a real schema.org type. Does not exist.
- `schema.org/ItemList` for comparisons: Only makes sense for ranking lists, not side-by-side educational comparison.

## Open Questions

1. **Should tour progress persist across page loads?**
   - What we know: Currently no mechanism for persisting tour state. Tours start from step 0.
   - What's unclear: Whether users expect to resume a tour after leaving the page.
   - Recommendation: Use `sessionStorage` for lightweight tour state persistence. Store `{tourId, stepIndex}`. On page load, if tour state exists, offer "Resume tour?" prompt. This is low-effort and non-critical -- can be deferred if scope is tight.

2. **Should the compare mode in the interactive graph have a URL parameter?**
   - What we know: The VS pages have permanent URLs. The interactive compare mode is ephemeral.
   - What's unclear: Whether sharing a comparison link from the interactive graph is valuable.
   - Recommendation: Do NOT add URL parameters for interactive compare mode. Keep it simple. Users who want a shareable link get the VS page link. This avoids complex URL state management.

3. **How many VS pages is the right number?**
   - What we know: 12-15 curated pairs covers the most commonly searched comparisons. Building all 1,275 is wasteful.
   - What's unclear: Whether we should have a mechanism to add more pairs over time.
   - Recommendation: Start with 12 curated pairs. The `POPULAR_COMPARISONS` array is easy to extend. Adding a comparison is just adding one entry to the array -- no structural changes needed.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.0.18 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/lib/ai-landscape/__tests__/tours.test.ts src/lib/ai-landscape/__tests__/comparisons.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NAV-03 | All tour step nodeIds exist in nodes.json | unit | `npx vitest run src/lib/ai-landscape/__tests__/tours.test.ts -x` | Wave 0 |
| NAV-03 | Each tour has >= 5 steps | unit | `npx vitest run src/lib/ai-landscape/__tests__/tours.test.ts -x` | Wave 0 |
| NAV-04 | Tour progress index stays within bounds | unit | `npx vitest run src/lib/ai-landscape/__tests__/tours.test.ts -x` | Wave 0 |
| SEO-07 | Compare panel renders both nodes' data | manual | Visual inspection | N/A |
| SEO-08 | All comparison concept slugs exist in nodes.json | unit | `npx vitest run src/lib/ai-landscape/__tests__/comparisons.test.ts -x` | Wave 0 |
| SEO-08 | Comparison slugs are canonically ordered (alphabetical) | unit | `npx vitest run src/lib/ai-landscape/__tests__/comparisons.test.ts -x` | Wave 0 |
| SEO-08 | VS page routes are generated | unit | `npx vitest run src/lib/ai-landscape/__tests__/comparisons.test.ts -x` | Wave 0 |
| SEO-08 | comparisonSlug() and vsPageUrl() produce valid URLs | unit | `npx vitest run src/lib/ai-landscape/__tests__/comparisons.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/ai-landscape/__tests__/{tours,comparisons}.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/ai-landscape/__tests__/tours.test.ts` -- covers NAV-03, NAV-04
- [ ] `src/lib/ai-landscape/__tests__/comparisons.test.ts` -- covers SEO-08

## Sources

### Primary (HIGH confidence)
- Existing codebase analysis: `InteractiveGraph.tsx` (613 lines), `DetailPanel.tsx`, `schema.ts`, `ancestry.ts`, `graph-data.ts`, `routes.ts`, `graph-navigation.ts`, `useUrlNodeState.ts`
- `graph.json` (9 clusters, 66 edges), `nodes.json` (51 nodes) -- full dataset reviewed
- `[slug].astro`, `index.astro`, `[slug].png.ts` -- existing page and OG image patterns
- `og-image.ts` -- existing satori + sharp OG pipeline (function signature and pattern verified)
- `content.config.ts` -- Astro content collection configuration (file() loader pattern)
- `astro.config.mjs` -- routing, sitemap, trailingSlash configuration
- Astro routing docs (https://docs.astro.build/en/guides/routing/) -- getStaticPaths with single and rest parameters

### Secondary (MEDIUM confidence)
- Google structured data docs for FAQPage (https://developers.google.com/search/docs/appearance/structured-data/faqpage) -- FAQPage schema for "What's the difference?" questions
- Google I/O 2026 data on schema.org and AI Overviews citation rates (via web search)

### Tertiary (LOW confidence)
- Sandro Roth blog on evaluating tour libraries (https://sandroroth.com/blog/evaluating-tour-libraries/) -- confirms custom tour is better for SVG/canvas contexts

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and in active use in the codebase. No new dependencies.
- Architecture: HIGH - Patterns directly extend existing InteractiveGraph architecture. Tour is state + UI, compare is state + UI, VS pages follow exact same pattern as existing `[slug].astro`.
- Pitfalls: HIGH - Identified from direct codebase analysis (SVG transform issues, panel layout conflicts, slug parsing ambiguity). All mitigation strategies verified against existing code.
- Tour data: HIGH - All proposed tour step nodeIds verified against nodes.json dataset.
- VS page SEO: MEDIUM - FAQPage schema recommended based on web search. No ComparisonPage type exists in schema.org. FAQPage is the best available fit but has not been A/B tested.

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable -- no moving dependencies)
