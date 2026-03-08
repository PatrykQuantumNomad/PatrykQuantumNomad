# Stack Research: Interactive Architecture Diagrams for FastAPI Production Guide

**Domain:** Architecture diagrams (middleware stack flow, request lifecycle, builder pattern, deployment topologies) for a multi-page guide section on an existing Astro 5 static site
**Researched:** 2026-03-08
**Confidence:** HIGH

## Verdict: No New npm Dependencies Required

The FastAPI Production Guide's architecture diagrams should be built using two proven patterns already in the codebase:

1. **Build-time SVG generators** (extending the EDA pattern from `src/lib/eda/svg-generators/`) for static diagrams with CSS-driven hover/animation interactivity
2. **@xyflow/react + @dagrejs/dagre** (existing, proven in 3 tools) for truly interactive node-graph diagrams where users explore relationships

No Mermaid.js. No new diagram libraries. Zero new npm packages.

## Rationale: Why NOT Mermaid.js

Mermaid was the most obvious candidate, so it was investigated thoroughly and rejected.

### Mermaid Problems for This Use Case

| Issue | Impact |
|-------|--------|
| **Bundle size**: Mermaid v11.12.3 is ~2.8MB uncompressed / ~200KB+ gzipped. Even with `@mermaid-js/tiny`, it is ~1.5MB uncompressed | Unacceptable for a portfolio site that currently ships zero diagram runtime. The EDA section renders 19 plot types with zero client-side JS via build-time SVG. |
| **Build-time rendering requires Playwright**: `rehype-mermaid` (the standard Astro integration) uses `mermaid-isomorphic` which spawns a headless Chromium browser via Playwright at build time. This adds ~200MB+ to node_modules and requires `npx playwright install chromium` in CI | The current build pipeline uses only Node.js. Adding a headless browser dependency for ~8 diagrams is architecturally disproportionate. |
| **Limited interactivity**: Mermaid's `click` callbacks require `securityLevel: 'loose'` (XSS surface), only work on nodes (not subgraphs until a pending feature request), and cannot do hover-to-reveal-details, animated flow paths, or click-to-expand sections | The guide needs hover tooltips, animated request flow, and expandable detail panels -- none of which Mermaid supports natively. |
| **Styling inflexibility**: Mermaid SVG output uses inline styles and hardcoded class names. Matching the site's CSS variable theming (`var(--color-accent)`, `var(--color-border)`) requires post-processing or custom themes | The EDA SVG generators already use CSS custom properties natively (see `PALETTE` in `plot-base.ts`). |
| **No existing pattern**: The site has zero Mermaid usage. Adding it introduces a new rendering pipeline (Playwright/headless browser), a new authoring format (Mermaid DSL), and new theming concerns | Every other visual on the site is either build-time SVG, React component, or D3.js -- all TypeScript-native. |

### What Mermaid Would Give vs. What We Actually Need

| Mermaid Feature | Our Requirement | Better Approach |
|----------------|-----------------|-----------------|
| Quick flowchart from text DSL | Hand-crafted architecture diagrams with precise layout, branding, and interactivity | Build-time SVG generators (full control) |
| Sequence diagrams | Request lifecycle flow with animated arrows | Build-time SVG with CSS `stroke-dashoffset` animation |
| Auto-layout from text | Deployment topology with clickable nodes | @xyflow/react with dagre layout (already installed) |
| Subgraph grouping | Middleware stack layers with hover details | Build-time SVG with CSS `:hover` and `<details>` elements |

## Recommended Approach: Two Patterns for Two Needs

### Pattern 1: Build-Time SVG Generators (Static Diagrams with CSS Interactivity)

**Use for:** Middleware stack flow, request lifecycle, builder pattern, layered architecture
**Why:** Full control over layout, theming, animation. Zero client-side JS. Proven pattern with 19 existing generators.

Create a new generator module at `src/lib/guides/fastapi/svg-generators/` following the exact pattern from `src/lib/eda/svg-generators/`:

| File | Purpose | Pattern Source |
|------|---------|---------------|
| `diagram-base.ts` | Shared SVG primitives: boxes, arrows, labels, connectors, layer groups | `src/lib/eda/svg-generators/plot-base.ts` |
| `middleware-stack.ts` | Onion-model middleware stack with labeled layers | New, uses `diagram-base.ts` |
| `request-lifecycle.ts` | Horizontal flow: Client -> ASGI -> Middleware -> Router -> Handler -> Response | New, uses `diagram-base.ts` |
| `builder-pattern.ts` | Builder chain visualization showing method chaining and configuration assembly | New, uses `diagram-base.ts` |
| `dependency-injection.ts` | DI container tree: providers, dependencies, scope hierarchy | New, uses `diagram-base.ts` |
| `project-structure.ts` | Directory tree / module layout visualization | New, uses `diagram-base.ts` |
| `index.ts` | Barrel export | `src/lib/eda/svg-generators/index.ts` |

**Interactivity via CSS (zero JS):**

```css
/* Hover-to-highlight a middleware layer */
.diagram-layer:hover {
  fill: var(--color-accent);
  opacity: 0.15;
  transition: fill 0.2s, opacity 0.2s;
}
.diagram-layer:hover + .diagram-label {
  font-weight: 700;
}

/* Animated flow arrows using stroke-dashoffset */
.flow-arrow {
  stroke-dasharray: 8 4;
  animation: flow-pulse 1.5s linear infinite;
}
@keyframes flow-pulse {
  to { stroke-dashoffset: -12; }
}

/* Hover detail reveal */
.diagram-detail {
  opacity: 0;
  transition: opacity 0.3s;
}
.diagram-node:hover .diagram-detail {
  opacity: 1;
}
```

**Rendering in Astro pages:**

```astro
---
import { generateMiddlewareStack } from '../../../lib/guides/fastapi/svg-generators';
const svg = generateMiddlewareStack({ layers: [...], theme: 'dark' });
---
<div class="diagram-container" set:html={svg} />
```

This is identical to how EDA plots render today via `PlotFigure.astro` with `set:html={svg}`.

### Pattern 2: @xyflow/react (Interactive Node Graphs)

**Use for:** Deployment topology, service mesh, microservice communication, dependency graphs
**Why:** Users need to pan, zoom, click nodes for details. Already installed and proven in 3 tools.

| Diagram | Why React Flow | Notes |
|---------|---------------|-------|
| Deployment topology | Users explore container/service relationships, click nodes for config details | Same pattern as `DependencyGraph.tsx` in compose-validator |
| Service architecture | Microservice connections with labeled edges, hover for endpoint details | Same pattern as `K8sResourceGraph.tsx` |

**Implementation follows existing pattern exactly:**

1. Data extraction function: `src/lib/guides/fastapi/deployment-graph-data.ts`
2. React component: `src/components/guides/fastapi/DeploymentTopology.tsx`
3. Custom node types for different service kinds (FastAPI app, database, cache, reverse proxy)
4. Dagre auto-layout with `rankdir: 'LR'` for deployment diagrams
5. Lazy-loaded via `React.lazy()` -- React Flow's ~120KB only loads when user scrolls to diagram
6. Hydrated with `client:visible` in Astro page

## Existing Stack (No Changes Needed)

### Core Technologies Already Installed

| Technology | Version | Purpose for Guide Diagrams | Status |
|------------|---------|---------------------------|--------|
| Astro | ^5.3.0 | Build-time SVG generation via frontmatter scripts, `set:html` rendering | No change |
| TypeScript | ^5.9.3 | Type-safe SVG generator functions | No change |
| React | ^19.2.4 | Interactive deployment topology diagrams via React islands | No change |
| @xyflow/react | ^12.10.1 | Node-graph visualization for deployment topologies | No change; proven in 3 existing tools |
| @dagrejs/dagre | ^2.0.4 | Auto-layout for deployment graph nodes | No change; proven in 3 existing tools |
| nanostores | ^1.1.0 | State bridge for diagram interactions (e.g., selected node details) | No change |
| @nanostores/react | ^1.0.0 | React bindings for nanostores | No change |
| Tailwind CSS | ^3.4.19 | Diagram container styling, responsive layout | No change |
| astro-expressive-code | ^0.41.6 | Code snippets within guide pages (not diagrams) | No change |
| GSAP | ^3.14.2 | Optional: scroll-triggered diagram reveal animations | No change; already used for hero animations |

### CSS Custom Properties for Theme Consistency

The existing `PALETTE` from `plot-base.ts` uses CSS custom properties that work in both light and dark mode. The new `diagram-base.ts` should reuse the same variables:

```typescript
export const DIAGRAM_PALETTE = {
  text: 'var(--color-text-primary)',
  textSecondary: 'var(--color-text-secondary)',
  border: 'var(--color-border)',
  accent: 'var(--color-accent)',
  accentSecondary: 'var(--color-accent-secondary)',
  surface: 'var(--color-surface)',
  surfaceAlt: 'var(--color-surface-alt)',
  // Semantic diagram colors
  request: 'var(--color-accent)',         // Incoming request flow
  response: 'var(--color-accent-secondary)', // Outgoing response flow
  middleware: 'var(--color-gradient-end)',    // Middleware layer fills
  error: '#ef4444',                          // Error paths (red, both themes)
} as const;
```

## New Artifacts to Create (Zero New Dependencies)

### SVG Generator Module

| File | Purpose | Lines (est.) |
|------|---------|-------------|
| `src/lib/guides/fastapi/svg-generators/diagram-base.ts` | Shared primitives: `box()`, `arrow()`, `label()`, `layer()`, `connector()`, `svgOpen()` | ~200 |
| `src/lib/guides/fastapi/svg-generators/middleware-stack.ts` | Onion-model stack: CORS, Auth, Logging, etc. with hover highlights | ~150 |
| `src/lib/guides/fastapi/svg-generators/request-lifecycle.ts` | Left-to-right flow: Client -> Uvicorn -> ASGI -> Starlette -> FastAPI -> Handler | ~200 |
| `src/lib/guides/fastapi/svg-generators/builder-pattern.ts` | Method chain visualization for settings/config builder | ~120 |
| `src/lib/guides/fastapi/svg-generators/dependency-injection.ts` | DI tree: `Depends()` chain with scope annotations | ~150 |
| `src/lib/guides/fastapi/svg-generators/project-structure.ts` | Directory tree / module layout | ~100 |
| `src/lib/guides/fastapi/svg-generators/index.ts` | Barrel exports | ~20 |
| `src/styles/guide-diagrams.css` | CSS animations: flow-pulse, hover reveals, layer highlights | ~60 |

### Interactive Deployment Graph (React Flow)

| File | Purpose | Pattern Source |
|------|---------|---------------|
| `src/lib/guides/fastapi/deployment-graph-data.ts` | Static data for deployment topology nodes/edges | `compose-validator/graph-data-extractor.ts` |
| `src/components/guides/fastapi/DeploymentTopology.tsx` | React Flow component with custom nodes | `compose-results/DependencyGraph.tsx` |
| `src/components/guides/fastapi/DeploymentNode.tsx` | Custom node type for service boxes | `compose-results/ServiceNode.tsx` |

### Astro Page Integration

| File | Usage |
|------|-------|
| Guide `.astro` pages | Import SVG generators in frontmatter, render with `set:html={svg}`. Wrap in `<figure>` with `PlotFigure.astro` pattern. |
| Deployment topology page | Use `<DeploymentTopology client:visible />` for lazy-hydrated React Flow. |

## Diagram Type Decision Matrix

| Diagram | Pattern | Why | Interactivity |
|---------|---------|-----|---------------|
| Middleware stack (onion model) | Build-time SVG | Static layout, CSS hover highlights layers | CSS `:hover` to highlight layer + show description |
| Request lifecycle flow | Build-time SVG | Linear flow, CSS animates arrow path | CSS `stroke-dashoffset` animation for flow direction |
| Builder pattern chain | Build-time SVG | Simple sequential visualization | CSS `:hover` to show method signatures |
| Dependency injection tree | Build-time SVG | Hierarchical tree, fixed structure | CSS `:hover` to show scope/lifetime |
| Project structure | Build-time SVG | Directory tree, fixed layout | None needed (static reference) |
| Deployment topology | React Flow | Users need pan/zoom, click nodes for config details | Full React Flow: pan, zoom, click, hover tooltips |
| Service communication | React Flow | Graph with edges showing HTTP/gRPC connections | Full React Flow: click edge for endpoint details |

## Click-to-Expand Pattern (No New Dependencies)

For diagrams that need "click to show more detail," use the HTML `<details>/<summary>` pattern adjacent to the SVG, not inside it:

```astro
<div class="diagram-with-details">
  <div set:html={svg} />
  <div class="diagram-details-panel">
    <details>
      <summary>CORS Middleware</summary>
      <p>Handles cross-origin requests. Configured with allowed origins, methods, headers.</p>
      <ExpressiveCode code={corsSnippet} lang="python" />
    </details>
    <details>
      <summary>Authentication Middleware</summary>
      <p>Validates JWT tokens on every request.</p>
      <ExpressiveCode code={authSnippet} lang="python" />
    </details>
  </div>
</div>
```

This avoids embedding interactive elements inside SVG (which is fragile and accessibility-hostile) while keeping the visual diagram and expandable details visually connected.

## Installation

```bash
# No npm installation needed. Zero new dependencies.
# All diagrams use existing packages.
```

## Alternatives Considered

| Decision | Chosen | Alternative | Why Not Alternative |
|----------|--------|-------------|---------------------|
| Static diagrams | Build-time SVG generators | Mermaid.js (v11.12.3) | ~200KB+ gzipped client bundle OR Playwright headless browser for build-time. Neither is justified for ~8 diagrams. Site has 19 SVG generators already. |
| Static diagrams | Build-time SVG generators | `rehype-mermaid` (v3.x) | Requires Playwright (~200MB node_modules addition), spawns headless Chromium at build time, limited interactivity (no hover details), output SVG uses hardcoded styles incompatible with CSS variable theming. |
| Interactive graphs | @xyflow/react (existing) | D3.js force layout (existing) | React Flow provides built-in pan/zoom/minimap, custom nodes, and the site has 3 proven implementations. D3 force layout would require building all interaction from scratch. |
| Interactive graphs | @xyflow/react (existing) | Mermaid.js with click callbacks | Mermaid click requires `securityLevel: 'loose'`, only supports node clicks (not edges/subgraphs), no hover tooltips. React Flow provides all of these. |
| Diagram interactivity | CSS animations + HTML `<details>` | JavaScript event handlers | CSS handles hover, focus, and animated flow arrows without JS. `<details>` is native HTML for expand/collapse. Both are SSR-friendly and work without hydration. |
| Animated flow | CSS `stroke-dashoffset` animation | GSAP SVG animation | CSS keyframes are sufficient for dashed-line flow animation. No need for GSAP's weight for this simple effect. GSAP is available if scroll-triggered reveal is wanted later. |
| Click-to-expand | HTML `<details>` adjacent to SVG | Interactive SVG with embedded `<foreignObject>` | `<foreignObject>` in SVG has inconsistent browser support, breaks accessibility, and makes the SVG generator far more complex. Adjacent `<details>` elements are native HTML, accessible, and style-able with Tailwind. |
| Diagram DSL | TypeScript functions with typed params | Mermaid DSL, Graphviz DOT, PlantUML | TypeScript functions provide type safety, IDE completion, refactoring support, and integrate with the existing build pipeline. DSL approaches add parsing complexity and are harder to version-control review. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `mermaid` (npm) | ~200KB+ gzipped client bundle. The guide section should not ship a 2.8MB diagram rendering library for 8 diagrams that can be pre-rendered. | Build-time SVG generators |
| `rehype-mermaid` / `rehype-mermaidjs` | Requires Playwright (headless Chromium) at build time. Adds ~200MB to CI and ~30s to build per diagram batch. The site currently builds with zero browser dependencies. | Build-time SVG generators |
| `@mermaid-js/mermaid-cli` | CLI tool that spawns Puppeteer. Same headless browser problem as rehype-mermaid. | Build-time SVG generators |
| `mermaid-isomorphic` | Transitive dependency of rehype-mermaid. Requires Playwright. | Not needed |
| `playwright` | Only needed for Mermaid SSR. No other use case in this project. | Not needed |
| `d3-force` / D3 force layout | Overkill for architecture diagrams. Force-directed layout produces non-deterministic positions -- architecture diagrams need precise, intentional layout. | Dagre for graphs, manual layout for SVG generators |
| `@excalidraw/excalidraw` | Whiteboard tool, not a diagram rendering library. ~500KB+ bundle. Wrong tool. | Build-time SVG generators |
| `jointjs` / `gojs` | Commercial diagramming libraries. Heavy bundles, license concerns, wrong abstraction level. | @xyflow/react (already installed, MIT) |
| SVG embedded `<foreignObject>` for interactivity | Inconsistent browser rendering, breaks accessibility, complicates SVG generation | Adjacent HTML `<details>` elements |

## Stack Patterns by Diagram Type

**If the diagram is a static architecture/flow visualization:**
- Use build-time SVG generator
- Add CSS animations for flow arrows and hover highlights
- Because: zero client JS, theme-aware via CSS variables, proven pattern with 19 generators

**If the diagram needs pan/zoom/click with rich node details:**
- Use @xyflow/react with `client:visible` hydration
- Because: lazy-loaded (~120KB only when visible), proven in 3 tools, full interaction model

**If the diagram accompanies a code example:**
- Use build-time SVG adjacent to astro-expressive-code block
- With HTML `<details>` for expandable explanation
- Because: keeps diagram and code visually connected without JS coupling

**If the diagram needs scroll-triggered reveal:**
- Use GSAP `ScrollTrigger` (already installed) on the SVG container
- Because: proven pattern in the hero section, works with build-time SVGs

## Version Compatibility

| Package | Version | Guide Diagram Support | Notes |
|---------|---------|----------------------|-------|
| @xyflow/react | ^12.10.1 | Full support | Custom nodes, edges, dagre layout. Proven in compose-validator, k8s-analyzer, gha-validator. |
| @dagrejs/dagre | ^2.0.4 | Full support | Auto-layout for deployment topology graph. Proven in 3 tools. |
| nanostores | ^1.1.0 | Full support | Optional: bridge diagram selection to side panel. Proven in 3 tools. |
| Astro | ^5.3.0 | Full support | `set:html` for SVG injection, `client:visible` for React Flow lazy hydration. |
| Tailwind CSS | ^3.4.19 | Full support | Container styling, responsive layout for diagram + details panels. |
| GSAP | ^3.14.2 | Full support | Optional: scroll-triggered diagram reveal. Already installed. |
| TypeScript | ^5.9.3 | Full support | Type-safe generator functions with typed diagram configs. |

## Key Technical Decisions

### Build-Time SVG Generator Architecture

The `diagram-base.ts` module provides a different set of primitives than `plot-base.ts` (which is data-visualization focused). Architecture diagrams need:

- **Boxes** with rounded corners, optional icons, and labels (service nodes, middleware layers)
- **Arrows** with optional labels, dashed/solid styles, and directional markers
- **Layers** (nested rectangles for middleware stack / onion model)
- **Connectors** (lines between boxes with bend points)
- **Groups** (labeled regions containing multiple boxes)

These are fundamentally different from chart axes, grids, and data points -- so a separate `diagram-base.ts` is appropriate rather than extending `plot-base.ts`. However, the `PALETTE` and `svgOpen()` conventions should be reused for consistency.

### CSS-Only Interactivity Strategy

All hover/animation effects use CSS only, not JavaScript:

1. **Layer highlighting**: `:hover` on SVG `<g>` elements changes `fill` opacity
2. **Flow animation**: `@keyframes` with `stroke-dashoffset` creates moving dashed arrows
3. **Detail reveal**: `:hover` toggles `opacity` on description `<text>` elements
4. **Focus indicators**: `:focus-visible` outlines for keyboard navigation

This ensures diagrams work in the static HTML output with zero hydration cost.

### Responsive Diagram Strategy

SVG generators use `viewBox` (no width/height attributes) following the EDA pattern:

```typescript
function svgOpen(width: number, height: number, ariaLabel: string): string {
  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${ariaLabel}" style="width:100%;height:auto;max-width:${width}px">`;
}
```

This makes diagrams responsive out of the box -- they scale to container width on mobile.

### Accessibility

- All SVGs include `role="img"` and `aria-label`
- Interactive elements (hover targets) are `<g>` elements with `tabindex="0"` and `aria-describedby`
- Flow arrows include `aria-hidden="true"` (decorative)
- Adjacent `<details>` elements provide the same information as hover tooltips for screen reader and keyboard users
- Color is never the only distinguishing factor (shapes and labels always present)

## Sources

- **Existing codebase:** Direct inspection of `src/lib/eda/svg-generators/plot-base.ts` (SVG generator pattern), `src/lib/eda/svg-generators/index.ts` (19 generators using this pattern), `src/components/eda/PlotFigure.astro` (Astro rendering with `set:html`), `src/components/tools/compose-results/DependencyGraph.tsx` (React Flow pattern)
- **Existing codebase:** `src/components/tools/ComposeResultsPanel.tsx`, `K8sResultsPanel.tsx`, `GhaResultsPanel.tsx` (3 tools using @xyflow/react with lazy loading)
- [Mermaid.js npm](https://www.npmjs.com/package/mermaid) -- v11.12.3 latest, ~2.8MB uncompressed bundle
- [@mermaid-js/tiny npm](https://www.npmjs.com/package/@mermaid-js/tiny) -- v11.12.2, approximately half the size of full mermaid, but still ~1.5MB. Not meant for npm install (CDN only).
- [Mermaid bundle size discussion](https://github.com/orgs/mermaid-js/discussions/4314) -- Documents significant bundle size increase since v9.3.0
- [Mermaid SSR Issue #3650](https://github.com/mermaid-js/mermaid/issues/3650) -- Browser environment required for text measurement; alternatives need JSDOM/Playwright
- [rehype-mermaid GitHub](https://github.com/remcohaszing/rehype-mermaid) -- Uses mermaid-isomorphic internally, requires Playwright peer dependency for SSR
- [Mermaid flowchart click interaction](https://mermaid.js.org/syntax/flowchart.html) -- Click callbacks require `securityLevel: 'loose'`, only on nodes (not subgraphs per [Issue #5428](https://github.com/mermaid-js/mermaid/issues/5428))
- [Astro 5.5 Mermaid support](https://astro.build/blog/astro-550/) -- Added support for rehype-mermaid plugin, but still requires Playwright
- [React Flow 12 static rendering](https://github.com/xyflow/xyflow/discussions/4078) -- Supports static HTML diagrams for docs sites
- [@xyflow/react npm](https://www.npmjs.com/package/@xyflow/react) -- v12.10.1, proven in 3 existing tools in this codebase
- [CSS SVG animation tutorial](https://blog.logrocket.com/how-to-animate-svg-css-tutorial-examples/) -- `stroke-dashoffset` animation for flow arrows
- [FastAPI middleware architecture](https://deepwiki.com/fastapi-practices/fastapi_best_architecture/5.1-middleware-pipeline) -- Onion model middleware stack, request processing flow

---
*Stack research for: Interactive Architecture Diagrams in FastAPI Production Guide*
*Researched: 2026-03-08*
