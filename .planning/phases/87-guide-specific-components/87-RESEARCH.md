# Phase 87: Guide-Specific Components - Research

**Researched:** 2026-03-08
**Domain:** Astro components for build-time SVG diagrams, interactive React Flow diagrams, and syntax-highlighted code snippets
**Confidence:** HIGH

## Summary

Phase 87 requires building two categories of reusable components: (1) build-time SVG architecture diagrams (DIAG-01, DIAG-02, DIAG-03), (2) an interactive React Flow deployment topology diagram (DIAG-04), and (3) a CodeFromRepo component for syntax-highlighted code blocks with source attribution (CODE-01, CODE-02, CODE-03).

The project already has mature, battle-tested patterns for every technology involved. Build-time SVG generation follows the `src/lib/eda/svg-generators/` architecture with a `plot-base.ts` foundation module, individual generator functions returning SVG strings, and `PlotFigure.astro` wrappers. React Flow v12.10.1 is already installed with `@dagrejs/dagre` for layout, and three working graph implementations exist (compose, k8s, gha) that demonstrate custom nodes, edges, dark-theme CSS, and lazy-loading via `React.lazy()`. Syntax highlighting uses `astro-expressive-code` v0.41.6 with `Code` component imported from `astro-expressive-code/components`.

**Primary recommendation:** Follow existing project patterns exactly -- create a `diagram-base.ts` module mirroring `plot-base.ts` for build-time SVG diagrams, reuse the React Flow node/edge/CSS pattern from compose-results for DIAG-04, and wrap expressive-code's `Code` component in a `CodeFromRepo.astro` component that adds source file path annotation and GitHub link.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DIAG-01 | Build-time SVG diagram: request flow through 8-layer middleware stack | `diagram-base.ts` + vertical stack SVG generator following `plot-base.ts` pattern |
| DIAG-02 | Build-time SVG diagram: Builder pattern composition (setup_*() method chain) | Same `diagram-base.ts` foundation, horizontal flow-chart SVG generator |
| DIAG-03 | Build-time SVG diagram: JWT auth flow across 3 validation modes | Same `diagram-base.ts` foundation, branching flow-chart SVG generator |
| DIAG-04 | Interactive React Flow deployment topology | Existing `@xyflow/react` v12.10.1 + `@dagrejs/dagre` pattern from compose-results |
| CODE-01 | Syntax-highlighted code snippets from FastAPI template | `astro-expressive-code` Code component with `lang="python"` |
| CODE-02 | Code snippets reference tagged repo version with source file path annotations | `CodeFromRepo.astro` renders file path annotation and version from `guide.json` `versionTag` |
| CODE-03 | CodeFromRepo component linking snippets to full source files on GitHub | `CodeFromRepo.astro` constructs GitHub URL from `templateRepo`, `versionTag`, and `filePath` props |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | 5.17.1 | Static site framework | Already installed, all components built on it |
| astro-expressive-code | 0.41.6 | Syntax highlighting | Already integrated, `Code` component available for `.astro` files |
| @xyflow/react | 12.10.1 | Interactive diagram (DIAG-04) | Already installed, 3 working graph implementations exist in project |
| @dagrejs/dagre | 2.0.4 | Automatic graph layout | Already installed, used by compose/k8s/gha graphs |
| @astrojs/react | 4.4.2 | React island hydration | Already configured in astro.config.mjs |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tailwindcss | 3.4.19 | Styling all components | Already installed, all project styling uses Tailwind |
| CSS custom properties | N/A | Theme-aware colors in SVGs | Follow `PALETTE` object pattern from `plot-base.ts` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Build-time SVG strings | Mermaid.js | OUT OF SCOPE per REQUIREMENTS.md -- ~200KB+ client bundle or Playwright SSR |
| Hand-crafted SVG generators | D3 for diagrams | D3 is for data-driven visuals; architecture diagrams are fixed layouts, no data binding needed |
| React Flow for all diagrams | Build-time SVG for all | Only DIAG-04 needs interactivity (pan/zoom/drag); DIAG-01/02/03 are static |

**Installation:**
```bash
# No new packages needed -- everything is already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/guide/
│   ├── GuideBreadcrumb.astro          # Existing
│   ├── GuideSidebar.astro             # Existing
│   ├── GuideChapterNav.astro          # Existing
│   ├── CodeFromRepo.astro             # NEW: Code snippet with source attribution
│   ├── MiddlewareStackDiagram.astro   # NEW: DIAG-01 wrapper
│   ├── BuilderPatternDiagram.astro    # NEW: DIAG-02 wrapper
│   ├── JwtAuthFlowDiagram.astro       # NEW: DIAG-03 wrapper
│   └── DeploymentTopology.tsx         # NEW: DIAG-04 React Flow component
├── components/guide/topology/
│   ├── TopologyNode.tsx               # NEW: Custom node for DIAG-04
│   ├── TopologyEdge.tsx               # NEW: Custom edge for DIAG-04
│   └── deployment-topology.css        # NEW: Dark-theme overrides for DIAG-04
├── lib/guides/
│   ├── schema.ts                      # Existing
│   ├── routes.ts                      # Existing
│   └── svg-diagrams/
│       ├── diagram-base.ts            # NEW: Shared foundation (mirrors plot-base.ts)
│       ├── middleware-stack.ts         # NEW: DIAG-01 generator
│       ├── builder-pattern.ts         # NEW: DIAG-02 generator
│       ├── jwt-auth-flow.ts           # NEW: DIAG-03 generator
│       └── index.ts                   # NEW: Barrel export
```

### Pattern 1: Build-Time SVG Diagram Generator
**What:** TypeScript functions that return SVG markup strings, rendered at build time via `.astro` wrapper components.
**When to use:** Static architecture diagrams (DIAG-01, DIAG-02, DIAG-03) that do not need user interaction.
**Example:**
```typescript
// Source: Existing pattern from src/lib/eda/svg-generators/plot-base.ts
// New file: src/lib/guides/svg-diagrams/diagram-base.ts

/** Semantic color palette using CSS custom properties (theme-aware) */
export const DIAGRAM_PALETTE = {
  text: 'var(--color-text-primary)',
  textSecondary: 'var(--color-text-secondary)',
  border: 'var(--color-border)',
  accent: 'var(--color-accent)',
  accentSecondary: 'var(--color-accent-secondary)',
  surface: 'var(--color-surface)',
  surfaceAlt: 'var(--color-surface-alt)',
} as const;

export interface DiagramConfig {
  width: number;
  height: number;
  fontFamily?: string;
}

export const DEFAULT_DIAGRAM_CONFIG: DiagramConfig = {
  width: 720,
  height: 500,
  fontFamily: "'DM Sans', sans-serif",
};

/** Root SVG open tag with responsive viewBox, role="img", and aria-label */
export function diagramSvgOpen(config: DiagramConfig, ariaLabel: string): string {
  return `<svg viewBox="0 0 ${config.width} ${config.height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${ariaLabel}" style="width:100%;height:auto;max-width:${config.width}px">`;
}

/** Rounded rectangle with optional fill and border */
export function roundedRect(
  x: number, y: number, w: number, h: number,
  opts: { fill?: string; stroke?: string; rx?: number }
): string {
  const { fill = DIAGRAM_PALETTE.surfaceAlt, stroke = DIAGRAM_PALETTE.border, rx = 8 } = opts;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" />`;
}

/** Directional arrow line */
export function arrowLine(
  x1: number, y1: number, x2: number, y2: number,
  markerId: string
): string {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${DIAGRAM_PALETTE.textSecondary}" stroke-width="1.5" marker-end="url(#${markerId})" />`;
}

/** Arrow marker definition for SVG defs block */
export function arrowMarkerDef(id: string): string {
  return `<marker id="${id}" viewBox="0 0 10 7" refX="10" refY="3.5" markerWidth="10" markerHeight="7" orient="auto-start-reverse">
    <polygon points="0 0, 10 3.5, 0 7" fill="${DIAGRAM_PALETTE.textSecondary}" />
  </marker>`;
}
```

### Pattern 2: Astro Wrapper for Build-Time SVG
**What:** `.astro` component that calls the SVG generator function and renders the result using `PlotFigure.astro` (or a new `DiagramFigure.astro`).
**When to use:** Embedding build-time SVG diagrams in MDX content pages.
**Example:**
```astro
---
// Source: Pattern from src/components/eda/NormalRandomPlots.astro
// New file: src/components/guide/MiddlewareStackDiagram.astro
import PlotFigure from '../eda/PlotFigure.astro';
import { generateMiddlewareStack } from '../../lib/guides/svg-diagrams';

const svg = generateMiddlewareStack();
---

<PlotFigure svg={svg} caption="Request flow through the 8-layer middleware stack" />
```

### Pattern 3: CodeFromRepo Component
**What:** An `.astro` component wrapping `astro-expressive-code`'s `Code` component, adding a file path annotation header and a "View on GitHub" link.
**When to use:** Every code snippet in the guide pages (CODE-01, CODE-02, CODE-03).
**Example:**
```astro
---
// New file: src/components/guide/CodeFromRepo.astro
import { Code } from 'astro-expressive-code/components';

interface Props {
  code: string;
  lang: string;
  filePath: string;
  title?: string;
  templateRepo: string;
  versionTag: string;
}

const { code, lang, filePath, title, templateRepo, versionTag } = Astro.props;
const githubUrl = `${templateRepo}/blob/${versionTag}/${filePath}`;
const displayTitle = title || filePath;
---

<div class="my-6 not-prose">
  <div class="flex items-center justify-between px-3 py-2 bg-[var(--color-surface-alt)] border border-b-0 border-[var(--color-border)] rounded-t-lg text-sm">
    <span class="font-mono text-[var(--color-text-secondary)] truncate">{displayTitle}</span>
    <a
      href={githubUrl}
      target="_blank"
      rel="noopener noreferrer"
      class="text-[var(--color-accent)] hover:underline whitespace-nowrap ml-4"
    >
      View source &rarr;
    </a>
  </div>
  <div class="[&_.expressive-code]:!rounded-t-none [&_.expressive-code]:!mt-0">
    <Code code={code} lang={lang} title={displayTitle} />
  </div>
</div>
```

### Pattern 4: Interactive React Flow Diagram (DIAG-04)
**What:** A React component using `@xyflow/react` with custom nodes/edges and `@dagrejs/dagre` layout, rendered as a client-side island.
**When to use:** The deployment topology diagram that needs pan, zoom, and drag interactivity.
**Example:**
```typescript
// Source: Existing pattern from src/components/tools/compose-results/DependencyGraph.tsx
// New file: src/components/guide/DeploymentTopology.tsx

import { useMemo } from 'react';
import {
  ReactFlow, Controls, Background, BackgroundVariant,
  MarkerType, type Node, type Edge,
} from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import { TopologyNode, type TopologyNodeData } from './topology/TopologyNode';
import './topology/deployment-topology.css';

const nodeTypes = { topology: TopologyNode };

// Define static deployment nodes: app, Postgres, Redis, reverse proxy
const DEPLOYMENT_NODES = [
  { id: 'proxy', label: 'Reverse Proxy (Caddy)', icon: 'proxy' },
  { id: 'app', label: 'FastAPI App', icon: 'app' },
  { id: 'postgres', label: 'PostgreSQL', icon: 'db' },
  { id: 'redis', label: 'Redis', icon: 'cache' },
];

const DEPLOYMENT_EDGES = [
  { source: 'proxy', target: 'app', label: 'HTTP/HTTPS' },
  { source: 'app', target: 'postgres', label: 'asyncpg' },
  { source: 'app', target: 'redis', label: 'aioredis' },
];
```

### Anti-Patterns to Avoid
- **Using Mermaid.js:** Explicitly out of scope per REQUIREMENTS.md. ~200KB+ client bundle or Playwright SSR requirement.
- **Auto-extracting code from template repo at build time:** Out of scope per REQUIREMENTS.md. Curated excerpts with version annotations are more maintainable.
- **Putting SVG diagram data in content collections:** The diagrams are fixed architectural illustrations, not data-driven. Hard-code the structure in generator functions.
- **Using `client:load` for React Flow:** Use `client:visible` for the deployment topology since it may be below the fold. The existing compose/k8s graphs use `client:only="react"` because they are the primary page content; for an embedded diagram in a guide chapter, `client:visible` is more appropriate.
- **Re-creating PlotFigure for diagrams:** Reuse the existing `PlotFigure.astro` component which already provides the figure wrapper, overflow handling, border, and optional caption. No need to duplicate.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Syntax highlighting | Custom code block renderer | `astro-expressive-code` `Code` component | Handles 100+ languages, theme integration, line highlighting, copy button |
| Interactive graph layout | Manual node positioning | `@dagrejs/dagre` with `@xyflow/react` | Automatic directed graph layout with customizable rank direction |
| SVG arrow markers | Manual path calculations | `diagram-base.ts` shared `arrowMarkerDef()` | SVG marker-end is standard and handles rotation/scaling automatically |
| Dark theme for React Flow | Inline style overrides | CSS custom properties file (`.css`) | Matches existing pattern in `dependency-graph.css`; consistent, maintainable |
| Code block framing/copy | Custom clipboard handler | expressive-code built-in frame | Includes file tab, copy button, and terminal frame out of the box |

**Key insight:** Every piece of technology needed is already installed and has working examples in this codebase. The implementation is primarily about applying existing patterns to new domain-specific data.

## Common Pitfalls

### Pitfall 1: Expressive Code Component Not Found in MDX
**What goes wrong:** Import path confusion -- `astro-expressive-code/components` vs `astro:components` vs direct MDX code fences.
**Why it happens:** Expressive Code automatically handles fenced code blocks in MDX/markdown. The `Code` component is only needed when rendering code from variables.
**How to avoid:** Use `import { Code } from 'astro-expressive-code/components'` in `.astro` files. In MDX files, standard fenced code blocks already use expressive-code. The `CodeFromRepo` component should be an `.astro` component, not MDX.
**Warning signs:** Build errors mentioning "Code is not a function" or missing imports.

### Pitfall 2: React Flow CSS Not Loading
**What goes wrong:** React Flow renders but without proper styling -- missing backgrounds, broken controls, invisible edges.
**Why it happens:** `@xyflow/react/dist/style.css` must be imported. In the project's existing pattern, this CSS is imported in the parent ResultsPanel component, not in the graph component itself.
**How to avoid:** Import `@xyflow/react/dist/style.css` in the component that wraps `DeploymentTopology` -- either in the `.astro` wrapper or in the React component file that gets hydrated. The existing pattern imports it at the ResultsPanel level.
**Warning signs:** Graph container renders but nodes appear unstyled or controls are missing.

### Pitfall 3: SVG ID Collisions
**What goes wrong:** Multiple SVG diagrams on the same page share the same marker/gradient IDs, causing visual artifacts.
**Why it happens:** SVG `<defs>` elements use `id` attributes for reference. If two diagrams both define `<marker id="arrow">`, only the first takes effect.
**How to avoid:** Prefix all SVG IDs with the diagram name: `middleware-arrow`, `builder-arrow`, `jwt-arrow`. The `diagram-base.ts` helpers should accept a prefix parameter.
**Warning signs:** Arrows or gradients appearing wrong on pages with multiple diagrams.

### Pitfall 4: React Flow fitView Fails on SSR
**What goes wrong:** React Flow renders blank when server-side rendered because it needs DOM measurements for `fitView`.
**Why it happens:** React Flow v12 supports SSR but `fitView` requires layout calculations that need a browser.
**How to avoid:** Use `client:visible` (not `client:load`) on the React Flow island wrapper. This ensures the component only hydrates when visible in the viewport, at which point the DOM is available. The existing project pattern uses `client:only="react"` for tools -- for an embedded diagram, `client:visible` defers JS until needed.
**Warning signs:** Empty or collapsed container with no visible nodes/edges.

### Pitfall 5: PlotFigure Width Mismatch
**What goes wrong:** Architecture diagram SVGs appear too small or have awkward whitespace.
**Why it happens:** `PlotFigure.astro` defaults to `maxWidth: '720px'` which may not suit all diagram proportions.
**How to avoid:** Pass the appropriate `maxWidth` prop matching the diagram's `viewBox` width. Each diagram generator should use a width appropriate to its content (wider for horizontal flows, narrower for vertical stacks).
**Warning signs:** Diagram appears with excessive padding or is cut off.

### Pitfall 6: CodeFromRepo GitHub URL Construction
**What goes wrong:** "View source" links lead to 404 pages on GitHub.
**Why it happens:** The template repo needs a `v1.0.0` tag (noted as a blocker). Also, file paths must match exactly (case-sensitive, no leading slash confusion).
**How to avoid:** Construct URL as `${templateRepo}/blob/${versionTag}/${filePath}` where `filePath` does NOT start with `/`. Validate that the tag exists before content authoring (Phase 88 concern, but CodeFromRepo should handle gracefully).
**Warning signs:** Broken links in production. Test with the actual repo URL format.

## Code Examples

Verified patterns from this project's codebase:

### Build-Time SVG in Astro Component (Existing Pattern)
```astro
---
// Source: src/components/eda/NormalRandomPlots.astro
import PlotFigure from './PlotFigure.astro';
import { generateHistogram } from '../../lib/eda/svg-generators/index';

const svg = generateHistogram({ data: [1, 2, 3], config: { width: 720, height: 450 } });
---

<PlotFigure svg={svg} caption="Distribution histogram" />
```

### React Flow with Custom Nodes (Existing Pattern)
```typescript
// Source: src/components/tools/compose-results/DependencyGraph.tsx
import { ReactFlow, Controls, Background, BackgroundVariant, MarkerType } from '@xyflow/react';
import dagre from '@dagrejs/dagre';

// Module-level constants avoid re-registration
const nodeTypes = { service: ServiceNode };
const edgeTypes = { dependency: DependencyEdge };

// Dagre layout
const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 100 });
```

### React Flow CSS Dark Theme (Existing Pattern)
```css
/* Source: src/components/tools/compose-results/dependency-graph.css */
.compose-graph .react-flow {
  --xy-background-color: transparent;
  --xy-node-color: var(--color-text-primary, #e0e0e0);
  --xy-edge-stroke: var(--color-text-secondary, #888);
  --xy-edge-stroke-selected: var(--color-accent, #c44b20);
}
```

### Expressive Code Component Usage (Existing Pattern)
```astro
---
// Source: src/pages/beauty-index/[slug].astro
import { Code } from 'astro-expressive-code/components';
---
<Code code={snippet.code} lang={snippet.lang} />
```

### Lazy-Loading React Flow (Existing Pattern)
```typescript
// Source: src/components/tools/ComposeResultsPanel.tsx
import { lazy, Suspense } from 'react';
import '@xyflow/react/dist/style.css';

const LazyDependencyGraph = lazy(() => import('./compose-results/DependencyGraph'));

// In render:
<Suspense fallback={<GraphSkeleton />}>
  <LazyDependencyGraph result={result} yamlContent={yamlContent} />
</Suspense>
```

### Custom React Flow Node (Existing Pattern)
```typescript
// Source: src/components/tools/compose-results/ServiceNode.tsx
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';

export type ServiceNodeData = { label: string; image?: string; };
export type ServiceNodeType = Node<ServiceNodeData, 'service'>;

export function ServiceNode({ data }: NodeProps<ServiceNodeType>) {
  return (
    <div className="px-3 py-2 rounded-lg border text-sm w-[220px]"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-alt)' }}>
      <Handle type="target" position={Position.Top} />
      <div className="font-bold">{data.label}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `reactflow` package | `@xyflow/react` package | React Flow v12 (2024) | New import paths, built-in SSR support, TypeScript-first |
| `code` fences only in MDX | `Code` component from expressive-code | astro-expressive-code 0.30+ | Dynamic code blocks from variables, file imports |
| Manual SVG in JSX | Build-time SVG string generation | Project pattern (EDA phase) | Zero client-side JS for static diagrams |

**Deprecated/outdated:**
- `reactflow` npm package: Replaced by `@xyflow/react` in v12. Project already uses the new package.
- `BaseHTTPMiddleware` in FastAPI: Mentioned in the guide content (middleware chapter covers why raw ASGI is preferred). Not relevant to component implementation.

## Open Questions

1. **Tag existence on template repo**
   - What we know: `guide.json` specifies `versionTag: "v1.0.0"` and `templateRepo: "https://github.com/Translucent-Computing/fastapi-template"`
   - What's unclear: Whether `v1.0.0` tag exists yet. This was flagged as a Phase 88 blocker.
   - Recommendation: Build CodeFromRepo to work with the configured values. If the tag does not exist, the "View source" links will 404, but the component itself will still render correctly. Tag creation is a Phase 88 prerequisite, not Phase 87.

2. **Diagram dimensions for each architecture diagram**
   - What we know: The middleware stack is an 8-layer vertical stack. The builder pattern is a horizontal composition. The JWT flow has 3 branching paths.
   - What's unclear: Exact pixel dimensions and layout proportions until implementation.
   - Recommendation: Start with 720px width (matching EDA plot pattern), adjust height per diagram. Vertical stack (DIAG-01) may need 600-700px height. Horizontal flow (DIAG-02) may need 800px width. JWT branching (DIAG-03) may need 720x600.

3. **DeploymentTopology component embedding in MDX**
   - What we know: The Docker chapter (PAGE-06) will embed the interactive deployment topology. React components can be used in MDX via import + `client:visible` directive.
   - What's unclear: Whether to embed directly in MDX or use an Astro wrapper component.
   - Recommendation: Create a `DeploymentTopologyWrapper.astro` component that handles the CSS import and provides a loading skeleton, then import and use it in the MDX. This matches the ResultsPanel pattern and keeps MDX clean. In MDX, use: `import DeploymentTopologyWrapper from '../../components/guide/DeploymentTopologyWrapper.astro'` then `<DeploymentTopologyWrapper client:visible />`.

   **Update:** Astro components cannot use `client:` directives -- those are for framework components (React/Vue/Svelte). The correct pattern is to have the `.astro` wrapper import and render the React component with `client:visible`. MDX pages would import the `.astro` wrapper normally without a directive, since the wrapper itself handles hydration.

   Actually, let me clarify: In Astro, `client:*` directives are placed on framework (React/Vue) components, not on Astro components. So the pattern should be:
   - `DeploymentTopology.tsx` -- the React component
   - In the MDX file: `import DeploymentTopology from '../../components/guide/DeploymentTopology'` and use `<DeploymentTopology client:visible />`
   - OR: Create an Astro wrapper that renders `<DeploymentTopology client:visible />` and import the wrapper in MDX (Astro components in MDX don't need client directives since they execute at build time).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.0.18 |
| Config file | `vitest.config.ts` (exists) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DIAG-01 | Middleware stack SVG generator returns valid SVG with 8 labeled layers | unit | `npx vitest run src/lib/guides/svg-diagrams/__tests__/middleware-stack.test.ts -x` | Wave 0 |
| DIAG-02 | Builder pattern SVG generator returns valid SVG with setup_*() labels | unit | `npx vitest run src/lib/guides/svg-diagrams/__tests__/builder-pattern.test.ts -x` | Wave 0 |
| DIAG-03 | JWT auth flow SVG generator returns valid SVG with 3 validation paths | unit | `npx vitest run src/lib/guides/svg-diagrams/__tests__/jwt-auth-flow.test.ts -x` | Wave 0 |
| DIAG-04 | DeploymentTopology renders 4 nodes and 3 edges | manual-only | Visual verification in browser (React component with DOM dependency) | N/A |
| CODE-01 | Code rendered with syntax highlighting | manual-only | Visual verification (expressive-code renders at build time) | N/A |
| CODE-02 | Code snippet shows file path and version tag | unit | `npx vitest run src/lib/guides/__tests__/code-from-repo.test.ts -x` | Wave 0 |
| CODE-03 | CodeFromRepo GitHub URL construction | unit | `npx vitest run src/lib/guides/__tests__/code-from-repo.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/guides/svg-diagrams/__tests__/middleware-stack.test.ts` -- covers DIAG-01 (SVG output contains 8 layer labels, has valid SVG structure)
- [ ] `src/lib/guides/svg-diagrams/__tests__/builder-pattern.test.ts` -- covers DIAG-02 (SVG output contains setup_*() method names)
- [ ] `src/lib/guides/svg-diagrams/__tests__/jwt-auth-flow.test.ts` -- covers DIAG-03 (SVG output contains 3 validation mode labels)
- [ ] `src/lib/guides/__tests__/code-from-repo.test.ts` -- covers CODE-02/CODE-03 (GitHub URL construction helper)

## Sources

### Primary (HIGH confidence)
- Project codebase: `src/lib/eda/svg-generators/plot-base.ts` -- SVG generation foundation pattern
- Project codebase: `src/components/tools/compose-results/DependencyGraph.tsx` -- React Flow graph pattern
- Project codebase: `src/components/tools/compose-results/ServiceNode.tsx` -- Custom React Flow node pattern
- Project codebase: `src/components/tools/compose-results/dependency-graph.css` -- Dark theme CSS pattern
- Project codebase: `src/components/eda/PlotFigure.astro` -- SVG wrapper component pattern
- Project codebase: `src/pages/beauty-index/[slug].astro` -- Expressive Code `Code` component usage
- Project codebase: `astro.config.mjs` -- Integration configuration
- Project codebase: `ec.config.mjs` -- Expressive Code configuration
- `@xyflow/react` v12.10.1 installed, verified via `node_modules`
- `astro-expressive-code` v0.41.6 installed, verified via `node_modules`

### Secondary (MEDIUM confidence)
- [Expressive Code docs](https://expressive-code.com/key-features/code-component/) -- Code component props and import syntax
- [React Flow SSR discussion](https://github.com/xyflow/xyflow/discussions/4078) -- Static rendering guidance for v12
- [React Flow v12 release](https://xyflow.com/blog/react-flow-12-release) -- SSR support details

### Tertiary (LOW confidence)
- None -- all findings verified against installed packages and project codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and used in production in this project
- Architecture: HIGH -- patterns directly replicated from existing EDA SVG generators and compose-results React Flow
- Pitfalls: HIGH -- identified from actual project code and verified library documentation

**Research date:** 2026-03-08
**Valid until:** 2026-04-07 (30 days -- stable stack, no version changes expected)
