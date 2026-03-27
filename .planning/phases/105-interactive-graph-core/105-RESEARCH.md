# Phase 105: Interactive Graph Core - Research

**Researched:** 2026-03-27
**Domain:** d3-zoom pan/zoom, React SVG island, interactive tooltips, edge labels
**Confidence:** HIGH

## Summary

Phase 105 transforms the static SVG graph from Phase 104 into an interactive React component with pan, zoom, tooltips, and edge labels. The core technical challenge is integrating `d3-zoom` with a React component that renders SVG from pre-computed `layout.json` positions -- there is no runtime force simulation. The component reads the same data files (`layout.json`, `graph.json`, `nodes.json`) that Phase 104 already uses and re-renders the graph as a React-managed SVG with d3-zoom controlling the viewport transform.

The project already has established patterns for this exact integration: `d3-selection` (v3.0.0) is already installed and used in `DistributionExplorer.tsx` for D3+React integration; `@astrojs/react` (v4.4.2) with React 19 is configured; and `client:only="react"` is the established directive for components that need browser APIs (used by `GhaValidator`, `K8sAnalyzer`). The only new dependency is `d3-zoom` (v3.0.0) and its types `@types/d3-zoom` (v3.0.10). The existing `DependencyGraph.tsx` component demonstrates the project's React+SVG graph pattern using ReactFlow, but Phase 105 uses raw D3+SVG instead because the graph renders from pre-computed positions rather than needing ReactFlow's layout engine.

The modifier key guard for wheel zoom (preventing scroll trap) is the most critical UX detail. The recommended pattern uses `zoom.filter()` to require `Ctrl` (desktop) or `Meta` (Mac) for wheel-to-zoom while allowing unrestricted drag-to-pan and pinch-to-zoom on touch. An overlay message ("Use Ctrl+scroll to zoom") appears when the user scrolls without the modifier, matching the pattern established by Google Maps and Mapbox.

**Primary recommendation:** Install `d3-zoom` and `@types/d3-zoom`. Create a single `InteractiveGraph.tsx` React component that renders SVG elements from `layout.json` positions, attaches `d3-zoom` via a `useEffect` + `useRef` pattern, manages tooltip state in React, and renders edge labels as SVG `<text>` elements positioned at edge midpoints. Mount it in `index.astro` with `client:only="react"`, replacing the static SVG `<Fragment>` with the interactive component while keeping the static SVG as a `<noscript>` fallback.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GRAPH-01 | D3 force-directed graph renders ~80 nodes as SVG with spatial clustering | Pre-computed positions from `layout.json` (51 nodes, 1200x900 viewport). React renders SVG circles and text from these positions. No runtime simulation needed -- Phase 104 pre-computed the layout. Cluster coloring via existing CSS classes (`.ai-cluster-{id}`). |
| GRAPH-03 | Pan and zoom via d3-zoom supporting both mouse (wheel+drag) and touch (pinch+swipe) | `d3-zoom` v3.0.0 handles mouse wheel, drag, and touch pinch/swipe natively. Apply via `select(svgRef).call(zoomBehavior)`. Use `zoom.filter()` to require modifier key for wheel zoom to prevent scroll trap. |
| GRAPH-04 | Zoom-to-fit reset button to return to full overview | Programmatic `zoom.transform(selection, d3.zoomIdentity)` with a 500ms transition. Button positioned absolutely over the SVG. The identity transform returns to the original viewport. |
| GRAPH-05 | Node hover tooltips showing brief description | React state (`hoveredNode`) updated on `mouseenter`/`mouseleave` on circle elements. Tooltip rendered as a positioned `<div>` outside the SVG (not inside SVG) for proper text wrapping and styling. Content: first sentence of `simpleDescription` from nodes.json. |
| GRAPH-06 | Edge labels visible for key relationships ("subset of" backbone always shown, others on hover) | 4 "hierarchy" (subset of) edges get permanent `<text>` labels at edge midpoints. Remaining 62 edges show labels on hover via `mouseenter`/`mouseleave` on invisible wider stroke paths (hit area). |
</phase_requirements>

## Project Constraints (from CLAUDE.md & prior decisions)

- D3 micro-module imports only (never umbrella `d3` package) -- bundle isolation critical
- `client:only="react"` for graph island (never `client:visible`) -- prevents SSR crash
- React 19 with `@astrojs/react` 4.4.2
- Tailwind CSS for non-SVG styling, CSS custom properties for SVG theming
- `html.dark` class toggle for dark mode (existing project pattern)
- Pre-computed positions from `layout.json` -- no runtime force simulation
- CSS class-based cluster coloring (`.ai-cluster-{id}`) with `html.dark` overrides

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| d3-zoom | 3.0.0 | Pan, zoom, pinch behavior on SVG | Only D3 module for declarative zoom/pan. Handles mouse wheel, drag, touch pinch. ESM-native. Stable since 2021. |
| d3-selection | 3.0.0 | DOM selection for attaching zoom behavior | Already installed. Required by d3-zoom for `select(element).call(zoom)` pattern. |
| @types/d3-zoom | 3.0.10 | TypeScript definitions for d3-zoom | Provides `ZoomBehavior`, `ZoomTransform`, `D3ZoomEvent` types |
| react | 19.2.4 | Component rendering, state, refs, effects | Already installed. Project framework for interactive islands. |
| @astrojs/react | 4.4.2 | Astro integration for React islands | Already installed. Enables `client:only="react"` directive. |

### Supporting (already installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| d3-selection | 3.0.0 | Select SVG element for d3-zoom attachment | In useEffect to call `select(svgRef.current).call(zoomBehavior)` |
| astro | 5.17.1 | Page rendering, `client:only` directive | Host page mounts the React island |
| tailwindcss | 3.4.19 | Button styling, tooltip styling | Reset button, tooltip container, overlay message |

### NOT needed
| Library | Why Not |
|---------|---------|
| @xyflow/react (ReactFlow) | Overkill -- positions are pre-computed, no layout engine needed. ~120KB bundle. |
| d3-force | Already ran at build time (Phase 104). No runtime simulation. |
| react-zoom-pan-pinch | Duplicates d3-zoom functionality. Not D3-idiomatic. |
| framer-motion | Unnecessary for zoom transitions -- d3-zoom provides built-in transition support. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| d3-zoom | @xyflow/react (ReactFlow) | ReactFlow provides pan/zoom out of the box but adds ~120KB, requires its own node/edge data format, and conflicts with the pre-computed layout approach. d3-zoom is ~8KB and works directly with SVG. |
| d3-zoom | react-zoom-pan-pinch | Works with any HTML/SVG but doesn't integrate with D3 transforms. Would need manual coordinate conversion for tooltip positioning and zoom-to-fit. |
| React-managed SVG | D3-managed SVG (imperative) | D3 imperative DOM mutation conflicts with React's virtual DOM. React-managed SVG with d3-zoom only controlling the transform is the established pattern. |
| HTML div tooltip | SVG `<title>` element | `<title>` tooltips are browser-native but ugly, unstyled, delayed, and cannot show rich content. HTML div tooltips allow full styling. |

**Installation:**
```bash
npm install d3-zoom @types/d3-zoom
```

**Version verification:** d3-zoom 3.0.0 is the latest stable version (published 2021, ESM-native). @types/d3-zoom 3.0.10 is the latest (published 2024). d3-zoom depends on d3-dispatch, d3-interpolate, d3-selection, and d3-transition -- d3-selection (3.0.0) is already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/ai-landscape/
    InteractiveGraph.tsx      # NEW: React island -- pan/zoom/tooltip/edge-labels
    GraphTooltip.tsx           # NEW: Positioned tooltip for hovered node
    ZoomControls.tsx           # NEW: Zoom-to-fit reset button + zoom hint overlay
    GraphLegend.astro          # EXISTING: Static legend (no changes)
    ConceptList.astro          # EXISTING: Static concept list (no changes)
  lib/ai-landscape/
    graph-data.ts              # NEW: Shared types + data prep for interactive graph
    schema.ts                  # EXISTING: AiNode, Edge, Cluster types
    layout-schema.ts           # EXISTING: LayoutPosition, LayoutMeta types
    svg-builder.ts             # EXISTING: Static SVG builder (kept for noscript fallback)
  pages/ai-landscape/
    index.astro                # MODIFIED: Add InteractiveGraph island, keep static SVG as noscript
```

### Pattern 1: React-Managed SVG + D3-Zoom Transform (Hybrid Pattern)
**What:** React owns the SVG DOM (renders nodes, edges, labels via JSX). D3-zoom owns only the viewport transform. The zoom behavior is attached via `useEffect` and updates React state with the current transform. React re-renders the `<g>` wrapper with the new transform string.
**When to use:** Always -- this is the established pattern for D3+React that avoids DOM ownership conflicts.
**Why this way:** Letting D3 mutate the SVG DOM directly conflicts with React's virtual DOM reconciliation. By limiting D3 to transform calculation and React to rendering, both libraries operate in their own domain.
**Example:**
```typescript
// Source: d3-zoom official docs (https://d3js.org/d3-zoom) + React integration pattern
import { useRef, useEffect, useState, useCallback } from 'react';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomTransform } from 'd3-zoom';

function InteractiveGraph({ nodes, edges, positions, clusters, meta }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on('zoom', (event) => {
        setTransform(event.transform);
      });

    select(svg).call(zoomBehavior);

    // Cleanup: remove zoom listeners on unmount
    return () => {
      select(svg).on('.zoom', null);
    };
  }, []);

  return (
    <svg ref={svgRef} viewBox={`0 0 ${meta.width} ${meta.height}`}>
      <g transform={transform.toString()}>
        {/* edges, then nodes (z-order) */}
      </g>
    </svg>
  );
}
```

### Pattern 2: Modifier Key Guard for Wheel Zoom (Scroll Trap Prevention)
**What:** `zoom.filter()` requires `Ctrl` (or `Meta` on Mac) to be held for wheel events to trigger zoom. Drag-to-pan and touch pinch-to-zoom work without modifier. When the user scrolls without the modifier, an overlay hint appears briefly ("Use Ctrl+scroll to zoom").
**When to use:** Always for embedded visualizations that sit within a scrollable page.
**Why this way:** Without the guard, scrolling past the graph on the page accidentally zooms it instead, trapping the user. Google Maps, Mapbox, and Figma all use this pattern.
**Example:**
```typescript
const zoomBehavior = zoom<SVGSVGElement, unknown>()
  .filter((event: Event) => {
    // Allow all non-wheel events (drag, touch)
    if (event.type !== 'wheel') return true;
    // For wheel events, require Ctrl or Meta key
    return (event as WheelEvent).ctrlKey || (event as WheelEvent).metaKey;
  })
  .scaleExtent([0.3, 4])
  .on('zoom', (event) => setTransform(event.transform));

// Separately, listen for unmodified wheel to show hint overlay
svgEl.addEventListener('wheel', (e) => {
  if (!e.ctrlKey && !e.metaKey) {
    showZoomHint(); // Show "Use Ctrl+scroll to zoom" message
  }
}, { passive: true });
```

### Pattern 3: Zoom-to-Fit Reset
**What:** A button that smoothly transitions the viewport back to show the entire graph. Calculates the identity transform (or a fitted transform if the graph doesn't fill the viewport at 1:1).
**When to use:** When the user has zoomed/panned and wants to return to the overview.
**Example:**
```typescript
function resetZoom() {
  const svg = svgRef.current;
  if (!svg) return;

  select(svg)
    .transition()
    .duration(500)
    .call(zoomBehaviorRef.current.transform, zoomIdentity);
}
```

### Pattern 4: HTML Tooltip Outside SVG
**What:** Tooltip is a positioned `<div>` element rendered by React, not an SVG element. Positioned using the mouse event's `clientX`/`clientY` relative to the container, adjusted for the current zoom transform.
**When to use:** Always for tooltips that need text wrapping, rich styling, or accessibility.
**Why this way:** SVG `<text>` elements don't support text wrapping. SVG `<foreignObject>` has cross-browser issues. HTML divs with Tailwind classes give full styling control.
**Example:**
```typescript
const [tooltip, setTooltip] = useState<{
  x: number; y: number; node: AiNode;
} | null>(null);

// On node mouseenter:
const handleNodeEnter = (e: React.MouseEvent, node: AiNode) => {
  const rect = containerRef.current?.getBoundingClientRect();
  if (!rect) return;
  setTooltip({
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
    node,
  });
};

// Render:
{tooltip && (
  <div
    role="tooltip"
    className="absolute pointer-events-none bg-[var(--color-surface)] ..."
    style={{ left: tooltip.x + 12, top: tooltip.y - 8 }}
    aria-live="polite"
  >
    <strong>{tooltip.node.name}</strong>
    <p>{firstSentence(tooltip.node.simpleDescription)}</p>
  </div>
)}
```

### Pattern 5: Edge Labels (Always-Visible Backbone + Hover for Others)
**What:** The 4 "hierarchy" (subset of) edges have permanent text labels at their midpoints. The remaining 62 edges show labels only on hover. Hover is achieved by rendering an invisible wider stroke path (hit area) on top of each edge, with `mouseenter`/`mouseleave` handlers.
**When to use:** When the graph has too many edges to label all at once (66 edges would create visual clutter).
**Example:**
```tsx
{edges.map((edge) => {
  const src = posMap.get(edge.source);
  const tgt = posMap.get(edge.target);
  if (!src || !tgt) return null;

  const mx = (src.x + tgt.x) / 2;
  const my = (src.y + tgt.y) / 2;
  const isBackbone = edge.type === 'hierarchy';

  return (
    <g key={`${edge.source}-${edge.target}`}>
      {/* Visible edge line */}
      <line x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y} className="ai-edge" ... />

      {/* Invisible hit area for hover (wider stroke) */}
      <line x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
        stroke="transparent" strokeWidth={12}
        onMouseEnter={() => setHoveredEdge(edge)}
        onMouseLeave={() => setHoveredEdge(null)}
      />

      {/* Label: always visible for backbone, hover-only for others */}
      {(isBackbone || hoveredEdge === edge) && (
        <text x={mx} y={my - 4} textAnchor="middle" className="ai-edge-label" fontSize={8}>
          {edge.label}
        </text>
      )}
    </g>
  );
})}
```

### Pattern 6: Static Fallback via `<noscript>`
**What:** The existing static SVG from Phase 104's `buildLandscapeSvg()` is preserved inside a `<noscript>` tag so users without JavaScript still see the graph.
**When to use:** Always -- the static SVG is the first meaningful paint. The React island replaces it when JS loads.
**Example in index.astro:**
```astro
{/* Interactive graph (React island, renders after JS loads) */}
<InteractiveGraph client:only="react"
  nodesJson={nodesJsonString}
  graphJson={graphJsonString}
  layoutJson={layoutJsonString}
/>

{/* Static fallback (visible before JS or if JS disabled) */}
<noscript>
  <Fragment set:html={svgString} />
</noscript>
```

### Anti-Patterns to Avoid
- **D3 imperatively creating/removing SVG elements:** Let React own the DOM. D3 should only calculate transforms. The `DistributionExplorer.tsx` in this project uses imperative D3 DOM manipulation, but that pattern causes issues when React tries to reconcile the DOM. For the interactive graph, React renders all SVG elements declaratively.
- **Storing zoom transform in a ref instead of state:** The transform must trigger re-renders (nodes need to update their positions visually). Using a ref would skip re-renders.
- **Attaching d3-zoom to the inner `<g>` instead of the `<svg>`:** d3-zoom should be attached to the outermost SVG element so it captures all mouse/touch events across the full viewport. The transform is applied to an inner `<g>` element.
- **Using `preventDefault()` on all wheel events:** This traps page scroll. Use the modifier key filter pattern instead.
- **Importing `d3-transition` explicitly:** d3-zoom already depends on d3-transition. Importing it again can cause duplicate module issues. Use the transition support that comes with d3-zoom.
- **Rendering tooltip inside SVG:** SVG text doesn't wrap. Use an HTML `<div>` positioned over the SVG container.
- **Using `client:visible` instead of `client:only="react"`:** `client:visible` attempts SSR first, which crashes for components using `d3-selection` (it requires a DOM). `client:only="react"` skips SSR entirely.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pan and zoom | Custom mouse/touch event handlers with manual transform math | `d3-zoom` | d3-zoom handles wheel normalization (delta modes), touch gesture recognition, momentum, boundary constraints, and smooth interpolation. Hundreds of edge cases across browsers and devices. |
| Zoom transition interpolation | Custom `requestAnimationFrame` loop with easing | `d3-zoom` built-in transitions via `selection.transition().call(zoom.transform, ...)` | Uses van Wijk & Nuij smooth zoom algorithm. Handles concurrent transitions, interruption, and different input sources. |
| Touch pinch-to-zoom | Custom touch event math for pinch distance/center | `d3-zoom` | Automatically handles multi-touch, tracks touch identifiers, computes gesture center. Cross-device tested. |
| Scroll trap prevention | Custom wheel event interception | `zoom.filter()` with modifier key check | Filter runs before d3-zoom processes the event. Clean separation of concerns. |
| SVG coordinate transforms | Manual matrix multiplication for zoom coordinates | `ZoomTransform.invert()` / `ZoomTransform.apply()` | Transform object provides correct coordinate conversion between screen and data space. |
| Tooltip positioning during zoom | Manual calculation of screen position from data coordinates | `containerRef.getBoundingClientRect()` + `event.clientX/Y` | Positioning relative to container is zoom-invariant. No need to transform coordinates. |

**Key insight:** d3-zoom is battle-tested across thousands of production visualizations. The only custom code needed is the React state bridge (updating transform via `setTransform` in the zoom handler) and the modifier key filter function. Everything else -- gesture recognition, momentum, boundary enforcement, smooth transitions -- comes from d3-zoom.

## Common Pitfalls

### Pitfall 1: Scroll Trap (Most Critical)
**What goes wrong:** The graph captures all wheel events, preventing the user from scrolling past it on the page. Users get "stuck" on the graph.
**Why it happens:** By default, `d3-zoom` calls `preventDefault()` on wheel events to zoom. Since the graph can span most of the viewport, the user cannot scroll past it.
**How to avoid:** Use `zoom.filter()` to require `Ctrl`/`Meta` key for wheel events. Show an overlay message when unmodified wheel is detected. Allow unrestricted drag-to-pan and touch pinch-to-zoom (these don't conflict with page scroll).
**Warning signs:** Users on trackpads cannot scroll past the graph section. Mobile users cannot swipe past it.

### Pitfall 2: React Re-render Storm from Zoom Events
**What goes wrong:** The zoom handler fires 60+ times per second during a pinch/drag, causing excessive React re-renders that drop frames.
**Why it happens:** Each `setTransform()` call triggers a full React re-render of all SVG elements (51 nodes + 66 edges = 117+ elements).
**How to avoid:** Apply the transform to the wrapping `<g>` element only -- not to individual nodes. The `<g transform={...}>` approach means React diffs only one attribute change per frame, not 117 elements. If performance is still an issue, use `requestAnimationFrame` throttling or apply the transform directly to the DOM via the ref (bypassing React for the transform attribute only).
**Warning signs:** Janky zoom/pan on mobile devices or slower desktops. React DevTools shows excessive re-renders during drag.

### Pitfall 3: Tooltip Flicker on Node Edge
**What goes wrong:** The tooltip appears and disappears rapidly as the mouse crosses the boundary between the circle fill and its stroke, or between the circle and its label.
**Why it happens:** `mouseenter`/`mouseleave` fire for each SVG element boundary. If the tooltip overlaps the node, it can also cause oscillation.
**How to avoid:** Group the circle and label in a `<g>` element and attach hover handlers to the `<g>`, not individual elements. Set `pointer-events: none` on the tooltip div so it doesn't intercept mouse events. Use a small delay (50ms `setTimeout`) before hiding the tooltip on mouseleave.
**Warning signs:** Tooltip flickers when hovering near node edges or moving slowly across a node.

### Pitfall 4: D3-Zoom and React Effect Cleanup
**What goes wrong:** After Astro view transitions or component unmount/remount, zoom listeners accumulate or reference stale elements.
**Why it happens:** If the `useEffect` cleanup doesn't properly remove d3-zoom event listeners, they persist across re-mounts. Astro view transitions can cause the component to unmount and remount.
**How to avoid:** Return a cleanup function from `useEffect` that calls `select(svg).on('.zoom', null)` to remove all zoom-namespaced event listeners. Store the zoom behavior in a ref so the reset button can access it.
**Warning signs:** Double-speed zooming after navigation, or zoom not working after view transition.

### Pitfall 5: Edge Label Clutter
**What goes wrong:** Showing all 66 edge labels simultaneously makes the graph unreadable -- labels overlap each other and node labels.
**Why it happens:** Edge midpoints often cluster near dense node areas. Labels for short edges overlap with node labels.
**How to avoid:** Only show "subset of" backbone labels (4 edges) permanently. Show other labels only on hover via wider invisible hit-area paths. Use a small font size (8px) and semi-transparent background for legibility.
**Warning signs:** The graph looks like a word cloud instead of a network diagram.

### Pitfall 6: Dark Mode CSS Not Applied in React Island
**What goes wrong:** Cluster colors stay in light mode because the React component's SVG doesn't inherit the page's `html.dark` class styles.
**Why it happens:** The `<style>` block with `.ai-cluster-*` and `html.dark .ai-cluster-*` rules must be inside the SVG or in the page's stylesheet. If the React component renders a new SVG without these rules, dark mode won't work.
**How to avoid:** Include the `<style>` block inside the React-rendered SVG element (same pattern as `svg-builder.ts`). Alternatively, define the styles in a CSS file that's imported into the component. The CSS classes reference `html.dark` which is on the document root, so they work regardless of where the SVG is rendered.
**Warning signs:** Interactive graph stays light when the rest of the page switches to dark mode.

### Pitfall 7: Data Serialization for Client-Only Components
**What goes wrong:** Complex objects (Maps, Sets, Astro content collection entries) can't be passed as props to `client:only` components because they must be JSON-serializable.
**Why it happens:** `client:only="react"` serializes props to JSON for client-side hydration. Non-serializable types throw errors or silently become `null`.
**How to avoid:** Pass data as JSON strings or plain objects/arrays. Parse them inside the React component. The nodes, edges, positions, and clusters are all already plain JSON -- pass them directly.
**Warning signs:** Build error about non-serializable props, or `undefined` props in the client component.

## Code Examples

Verified patterns from official sources and codebase analysis:

### Complete Interactive Graph Component Structure
```typescript
// src/components/ai-landscape/InteractiveGraph.tsx
// Source: d3-zoom docs (https://d3js.org/d3-zoom) + project React patterns
import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomTransform } from 'd3-zoom';
import type { AiNode, Edge, Cluster } from '../../lib/ai-landscape/schema';
import type { LayoutPosition, LayoutMeta } from '../../lib/ai-landscape/layout-schema';

interface Props {
  nodes: AiNode[];
  edges: Edge[];
  positions: LayoutPosition[];
  clusters: Cluster[];
  meta: LayoutMeta;
}

const ROOT_NODE_RADIUS = 24;
const NODE_RADIUS = 18;
const LABEL_FONT_SIZE = 9;

export default function InteractiveGraph({ nodes, edges, positions, clusters, meta }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<ReturnType<typeof zoom<SVGSVGElement, unknown>>>();
  const containerRef = useRef<HTMLDivElement>(null);

  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);
  const [hoveredNode, setHoveredNode] = useState<AiNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [hoveredEdge, setHoveredEdge] = useState<Edge | null>(null);
  const [showZoomHint, setShowZoomHint] = useState(false);

  // Build lookup maps (memoized)
  const posMap = useMemo(() => new Map(positions.map(p => [p.id, p])), [positions]);
  const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);
  const rootNodeIds = useMemo(
    () => new Set(nodes.filter(n => n.parentId === null).map(n => n.id)),
    [nodes],
  );

  // Attach d3-zoom
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .filter((event: Event) => {
        if (event.type !== 'wheel') return true;
        return (event as WheelEvent).ctrlKey || (event as WheelEvent).metaKey;
      })
      .on('zoom', (event) => {
        setTransform(event.transform);
      });

    zoomRef.current = zoomBehavior;
    select(svg).call(zoomBehavior);

    // Show hint on unmodified wheel
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) {
        setShowZoomHint(true);
        // Auto-hide after 2 seconds
      }
    };
    svg.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      select(svg).on('.zoom', null);
      svg.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const resetZoom = useCallback(() => {
    const svg = svgRef.current;
    const zoomBehavior = zoomRef.current;
    if (!svg || !zoomBehavior) return;
    select(svg).transition().duration(500).call(zoomBehavior.transform, zoomIdentity);
  }, []);

  // ... render SVG with <g transform={transform.toString()}>
}
```

### Zoom Filter with Modifier Key (Scroll Trap Prevention)
```typescript
// Source: d3-zoom docs zoom.filter() (https://d3js.org/d3-zoom)
const zoomBehavior = zoom<SVGSVGElement, unknown>()
  .filter((event: Event) => {
    // Allow drag (mousedown) and touch events unconditionally
    if (event.type !== 'wheel') return true;
    // Wheel events require Ctrl (Windows/Linux) or Meta/Cmd (Mac)
    const we = event as WheelEvent;
    return we.ctrlKey || we.metaKey;
  })
  .scaleExtent([0.3, 4]);
```

### Zoom-to-Fit Reset Button
```typescript
// Source: d3-zoom docs zoom.transform (https://d3js.org/d3-zoom)
function resetZoom() {
  const svg = svgRef.current;
  const zoomBehavior = zoomRef.current;
  if (!svg || !zoomBehavior) return;

  select(svg)
    .transition()
    .duration(500)
    .call(zoomBehavior.transform, zoomIdentity);
}
```

### Edge Label at Midpoint
```typescript
// Source: Force directed graph with labelled edges pattern
// (https://gist.github.com/fancellu/2c782394602a93921faff74e594d1bb1)
const midX = (srcPos.x + tgtPos.x) / 2;
const midY = (srcPos.y + tgtPos.y) / 2;

// SVG text element at midpoint, offset slightly above the line
<text x={midX} y={midY - 4} textAnchor="middle" fontSize={8}
  fill="var(--color-text-secondary)" pointerEvents="none">
  {edge.label}
</text>
```

### Tooltip First-Sentence Extraction
```typescript
// Extract first sentence from simpleDescription for tooltip content
function firstSentence(text: string): string {
  const match = text.match(/^[^.!?]+[.!?]/);
  return match ? match[0] : text.slice(0, 120) + '...';
}
```

### Data Serialization for Astro client:only
```astro
---
// src/pages/ai-landscape/index.astro
// Pass data as JSON-serializable props to client:only component
import InteractiveGraph from '../../components/ai-landscape/InteractiveGraph';
import graphData from '../../data/ai-landscape/graph.json';
import layoutData from '../../data/ai-landscape/layout.json';

const entries = await getCollection('aiLandscape');
const allNodes = entries.map(e => e.data as AiNode);
---

<InteractiveGraph
  client:only="react"
  nodes={allNodes}
  edges={graphData.edges}
  positions={layoutData.positions}
  clusters={graphData.clusters}
  meta={layoutData.meta}
/>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Runtime force simulation in browser | Pre-computed layout + d3-zoom for viewport only | Best practice for SSG sites, ~2020+ | Zero physics computation at runtime. Instant first paint from static SVG. |
| D3 imperative DOM mutation in React | React declarative SVG + D3 for behavior only (zoom/drag) | React 16.8+ (hooks), established ~2019+ | No DOM ownership conflicts. Clean effect cleanup. Predictable rendering. |
| Unrestricted wheel zoom on embedded vis | Modifier key guard (Ctrl+scroll) | Google Maps pattern, adopted widely ~2018+ | Users can scroll past the visualization without getting trapped. |
| SVG `<title>` for tooltips | HTML div tooltip positioned over SVG | Long-standing best practice | Full CSS styling, text wrapping, rich content, accessibility. |
| All edge labels visible at once | Backbone labels permanent, others on hover | Standard for dense graphs | Readable graph at overview zoom. Detail available on demand. |

**Deprecated/outdated:**
- `d3.event` global (d3 v5 and earlier): Removed in d3 v6+. Use the event parameter passed to event handler callbacks.
- `d3-zoom` v1/v2 API: v3 is ESM-native. Use `import { zoom } from 'd3-zoom'` (not `require`).
- Class components with `componentDidMount` for d3-zoom: Use `useEffect` with cleanup return. Hooks are the standard React pattern.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.0.18 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/components/ai-landscape` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command |
|--------|----------|-----------|-------------------|
| GRAPH-01 | Interactive SVG renders all 51 nodes from layout.json positions | unit | Component render test -- verify 51 circle elements with correct cx/cy |
| GRAPH-03 | Zoom behavior attached to SVG; transform updates on zoom events | unit | Verify d3-zoom is called on SVG ref; mock zoom event triggers state update |
| GRAPH-04 | Reset button returns transform to identity | unit | Simulate click, verify transform === zoomIdentity |
| GRAPH-05 | Tooltip appears on node hover with description text | unit | Simulate mouseenter on node circle, verify tooltip div renders with node name |
| GRAPH-06 | 4 backbone edge labels always visible; others hidden until hover | unit | Verify 4 `<text>` elements for hierarchy edges; simulate hover on non-backbone edge, verify label appears |

### Visual Verification (Human)
- Pan and zoom feel smooth on desktop (Chrome, Firefox, Safari)
- Pinch-to-zoom works on mobile (iOS Safari, Android Chrome)
- Scrolling past the graph works without Ctrl key
- Ctrl+scroll zooms the graph
- Zoom hint overlay appears when scrolling without Ctrl
- Reset button returns to full overview with smooth animation
- Tooltips appear at correct position during zoom
- Dark mode colors switch correctly in the interactive graph
- Edge labels are readable and don't overlap node labels

## Open Questions

1. **Performance with 51 nodes + 66 edges during rapid zoom**
   - What we know: React re-renders the entire `<g>` content on each zoom frame. At 60fps, this means 60 re-renders/second, each diffing ~120 SVG elements.
   - What's unclear: Whether React 19's reconciliation is fast enough for smooth 60fps zoom on mobile devices with 120+ SVG elements.
   - Recommendation: Start with the pure React state approach (Pattern 1). If jank appears, fall back to applying the transform directly to the `<g>` DOM element via the ref (bypassing React for the transform-only update), while keeping React for all other rendering. This is a progressive enhancement -- measure first, optimize only if needed.

2. **Tooltip position during zoom**
   - What we know: The tooltip is positioned using `event.clientX/Y` relative to the container. This is zoom-invariant because it uses screen coordinates.
   - What's unclear: Whether `clientX/Y` is reliable across all zoom levels and during active pan gestures.
   - Recommendation: Use `containerRef.getBoundingClientRect()` + `event.clientX - rect.left` for positioning. This is container-relative and zoom-invariant. If needed, transform data coordinates to screen coordinates using `transform.apply([dataX, dataY])` for fixed-position tooltips that follow the node rather than the mouse.

3. **Edge label collision with node labels**
   - What we know: Edge midpoints can fall near or on top of node positions, causing label overlap.
   - What's unclear: How many of the 4 backbone edge midpoints actually collide with node labels in the current layout.
   - Recommendation: Offset edge labels 4-6px above the midpoint. Use a semi-transparent background rect behind edge labels for contrast. Verify visually after implementation and adjust offsets for specific problematic edges if needed.

4. **View Transitions compatibility**
   - What we know: Astro view transitions can unmount/remount React islands. The `client:only` directive means no SSR, so re-mount is a full client-side render.
   - What's unclear: Whether d3-zoom state (current transform) persists across view transitions or resets.
   - Recommendation: Accept the reset on navigation for now. Persisting zoom state across view transitions is a Phase 109 concern (if needed at all). The `useEffect` cleanup handles listener removal correctly.

## Sources

### Primary (HIGH confidence)
- [D3-Zoom API Documentation](https://d3js.org/d3-zoom) -- zoom behavior, filter, scaleExtent, transform, events, touch support. Fetched 2026-03-27.
- [D3-Selection API Documentation](https://d3js.org/d3-selection) -- select, call, events. Fetched 2026-03-27.
- Codebase analysis: `src/components/eda/DistributionExplorer.tsx` -- existing d3-selection + React pattern in this project
- Codebase analysis: `src/components/tools/compose-results/DependencyGraph.tsx` -- existing React+SVG graph component pattern (ReactFlow-based)
- Codebase analysis: `src/lib/ai-landscape/svg-builder.ts` -- existing SVG generation pattern with CSS classes and dark mode
- Codebase analysis: `src/lib/ai-landscape/schema.ts` -- AiNode, Edge, Cluster types used by the interactive component
- Codebase analysis: `src/data/ai-landscape/layout.json` -- 51 pre-computed positions, 1200x900 viewport
- Codebase analysis: `src/data/ai-landscape/graph.json` -- 66 edges (4 hierarchy, 26 includes, 14 relates, etc.), 9 clusters
- Codebase analysis: `src/pages/ai-landscape/index.astro` -- existing landing page to be modified
- Codebase analysis: `package.json` -- d3-selection 3.0.0 installed, React 19.2.4, @astrojs/react 4.4.2

### Secondary (MEDIUM confidence)
- [Force directed graph with labelled edges (GitHub Gist)](https://gist.github.com/fancellu/2c782394602a93921faff74e594d1bb1) -- edge label positioning with SVG textPath and midpoint placement
- [Two ways to build zoomable dataviz with d3.zoom and React (Swizec)](https://swizec.com/blog/the-two-ways-to-build-a-zoomable-dataviz-component-with-d3zoom-and-react/) -- React+d3-zoom integration approaches (scale zoom vs detail zoom)
- [d3-zoom npm page](https://www.npmjs.com/package/d3-zoom) -- version 3.0.0 confirmed
- [GitHub d3/d3-zoom Issue #2549](https://github.com/d3/d3/issues/2549) -- scroll trap behavior discussion, scaleExtent boundary handling

### Tertiary (LOW confidence)
- Performance of React 19 reconciliation at 60fps with 120+ SVG elements -- estimate based on general React SVG rendering benchmarks, not measured for this specific graph size. Needs validation.
- Tooltip positioning reliability during active pinch-to-zoom on iOS Safari -- known to have edge cases with `clientX/Y` during gesture recognition. Needs device testing.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- d3-zoom 3.0.0 is the only option for D3-based pan/zoom; version verified; d3-selection already installed; React/Astro integration patterns verified in codebase
- Architecture: HIGH -- React+d3-zoom hybrid pattern is well-established (React owns DOM, D3 owns transform); modifier key filter verified in d3-zoom docs; tooltip and edge label patterns verified from multiple sources
- Pitfalls: HIGH -- scroll trap is extensively documented in D3 community; React re-render perf is well-understood; tooltip flicker prevention is standard SVG technique
- Performance: MEDIUM -- 120 SVG elements at 60fps is within React's capability for simple attribute diffs, but mobile device performance needs validation

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable -- d3-zoom 3.0.0 is mature and unchanged since 2021; React 19 patterns are established)
