# Phase 109: Graph Polish - Research

**Researched:** 2026-03-27
**Domain:** d3-zoom cluster zoom, GSAP SVG edge animation, SVG mini-map overlay
**Confidence:** HIGH

## Summary

Phase 109 adds three "premium feel" features to the interactive AI landscape graph: cluster zoom (GRAPH-09), animated edge traversal pulses (GRAPH-10), and a desktop mini-map (GRAPH-11). All three features build on the existing `InteractiveGraph.tsx` React component (798 lines) which already uses `d3-zoom` for pan/zoom and renders 51 nodes + 66 edges as SVG.

The cluster zoom feature is straightforward: compute a bounding box from the positions of nodes in a cluster, calculate a `ZoomTransform` that fits that box in the viewport with padding, and animate to it using d3-zoom's built-in transition API. The existing `zoomToNode()` function (line 171) already demonstrates this exact pattern -- cluster zoom is the same concept applied to a group of nodes instead of one.

The animated edge traversal uses GSAP, which is already installed (`gsap@^3.14.2`) and used extensively in the project's Astro-side animations (scroll reveals, parallax, timeline draw-line, floating orbs). As of 2025, GSAP and all its plugins (including DrawSVGPlugin, MotionPathPlugin) are 100% free. However, GSAP has not yet been used inside any React (.tsx) component in this project. The recommended approach is to install `@gsap/react` for the `useGSAP` hook (provides automatic cleanup) and use core GSAP `strokeDashoffset` animation on overlay `<line>` elements -- no premium plugin is needed for the traveling pulse effect.

The mini-map is a scaled-down replica of the full graph rendered in a small corner SVG, with a viewport rectangle that reflects the current zoom transform. The mini-map must invert the main transform to compute the visible rectangle: when the user zooms in, the rectangle shrinks; when they pan, the rectangle moves. At 51 nodes, rendering a second simplified SVG is negligible for performance.

**Primary recommendation:** Split into 3 plans. Plan 01: cluster zoom (legend click handler + bounding box zoom function). Plan 02: GSAP edge pulse animation (install @gsap/react, animate overlay lines on node selection). Plan 03: mini-map component (desktop only, static node dots + viewport rectangle synchronized with d3-zoom transform state).

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| d3-zoom | 3.0.0 | Programmatic zoom to cluster bounding box | Already used for pan/zoom in InteractiveGraph. `zoom.transform()` with transitions handles smooth animated zoom to computed transforms. |
| d3-selection | 3.0.0 | Attach zoom behavior, transition API | Already used. Required for `select(svg).transition().call(zoom.transform, t)`. |
| gsap | 3.14.2 | Animate stroke-dashoffset for edge pulse effect | Already installed. Used across the project for scroll animations, parallax, timeline draw-line. All plugins now free (2025). |
| react | 19.2.4 | Component rendering, hooks, refs | Already installed. Component framework. |

### New Dependencies Required
| Library | Version | Purpose | Why Needed |
|---------|---------|---------|------------|
| @gsap/react | ^2.1 | `useGSAP` hook for React-safe GSAP cleanup | Official GSAP React integration. Provides automatic cleanup of GSAP tweens/timelines when component unmounts. Prevents memory leaks and React strict mode double-execution issues. ~2KB. |

### NOT needed
| Library | Why Not |
|---------|---------|
| DrawSVGPlugin | The pulse effect uses plain `strokeDashoffset` + `strokeDasharray` animation via core GSAP -- no plugin required for traveling dash |
| MotionPathPlugin | Would animate a dot element along a path; the simpler approach is a traveling dash on the edge line itself |
| d3-brush | Overkill for mini-map viewport rectangle; a simple React-rendered `<rect>` synchronized with transform state is sufficient |
| framer-motion | GSAP is already in the bundle and more capable for SVG path animation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| GSAP strokeDashoffset | CSS `@keyframes` on strokeDashoffset | CSS animation can't be triggered/cleaned up programmatically from React state changes. GSAP provides timeline control, easing, and automatic cleanup via useGSAP. |
| @gsap/react useGSAP | Manual useEffect + gsap.context() | Works but requires boilerplate cleanup code. @gsap/react is the official wrapper, 2KB, and handles strict mode correctly. |
| React-rendered mini-map | Canvas-based mini-map | Canvas would be faster for very large graphs, but at 51 nodes SVG is fine and matches the main graph rendering approach. |
| Cluster bounding box from node positions | Pre-computed cluster regions in graph.json | Computing at runtime is simple (filter nodes by cluster, min/max x/y) and avoids data duplication. Cached via useMemo. |

**Installation:**
```bash
npm install @gsap/react
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/ai-landscape/
│   ├── InteractiveGraph.tsx    # Modified: add cluster zoom handler, edge pulse, mini-map
│   ├── MiniMap.tsx             # NEW: mini-map React component (desktop only)
│   └── useEdgePulse.ts        # NEW: custom hook for GSAP edge pulse animation
├── lib/ai-landscape/
│   └── graph-data.ts          # Modified: add cluster bounding box helper
```

### Pattern 1: Cluster Zoom via Bounding Box Transform

**What:** Compute a `ZoomTransform` that fits a cluster's nodes into the viewport with padding, then animate to it.
**When to use:** When user clicks a cluster label in the legend.

```typescript
// Source: d3js.org/d3-zoom + project's existing zoomToNode pattern (InteractiveGraph.tsx:171)
function zoomToCluster(clusterId: string) {
  const svg = svgRef.current;
  const zoomBehavior = zoomRef.current;
  if (!svg || !zoomBehavior) return;

  // Get all node positions in this cluster
  const clusterNodePositions = nodes
    .filter(n => n.cluster === clusterId)
    .map(n => posMap.get(n.id))
    .filter(Boolean);

  if (clusterNodePositions.length === 0) return;

  // Compute bounding box with padding
  const padding = 60; // SVG units
  const xs = clusterNodePositions.map(p => p.x);
  const ys = clusterNodePositions.map(p => p.y);
  const x0 = Math.min(...xs) - padding;
  const y0 = Math.min(...ys) - padding;
  const x1 = Math.max(...xs) + padding;
  const y1 = Math.max(...ys) + padding;

  // Compute transform to fit bounding box in viewport
  const scale = Math.min(
    meta.width / (x1 - x0),
    meta.height / (y1 - y0)
  );
  const tx = meta.width / 2 - scale * (x0 + x1) / 2;
  const ty = meta.height / 2 - scale * (y0 + y1) / 2;
  const newTransform = zoomIdentity.translate(tx, ty).scale(scale);

  // Clamp scale to zoom extent
  const clampedScale = Math.max(0.3, Math.min(4, scale));
  const clampedTransform = zoomIdentity
    .translate(meta.width / 2 - clampedScale * (x0 + x1) / 2,
               meta.height / 2 - clampedScale * (y0 + y1) / 2)
    .scale(clampedScale);

  select(svg)
    .transition()
    .duration(750)
    .call(zoomBehavior.transform, clampedTransform);
}
```

### Pattern 2: GSAP Edge Pulse in React

**What:** When a node is selected, animate a traveling dash/pulse along the edges connecting it to parent and child nodes.
**When to use:** Fires on `selectedNode` change.

```typescript
// Source: gsap.com/resources/React + gsap.com/docs/v3
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

// Inside InteractiveGraph component:
const edgePulseRefs = useRef<Map<string, SVGLineElement>>(new Map());

// useGSAP with dependency on selectedNode
useGSAP(() => {
  if (!selectedNode) return;

  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (REDUCED_MOTION) return;

  // Find edges connecting to selected node (parents + children)
  const connectedEdges = edges.filter(
    e => e.source === selectedNode.id || e.target === selectedNode.id
  );

  connectedEdges.forEach(edge => {
    const key = `${edge.source}-${edge.target}`;
    const el = edgePulseRefs.current.get(key);
    if (!el) return;

    // Get the line length for dash animation
    const length = Math.sqrt(
      Math.pow(parseFloat(el.getAttribute('x2')!) - parseFloat(el.getAttribute('x1')!), 2) +
      Math.pow(parseFloat(el.getAttribute('y2')!) - parseFloat(el.getAttribute('y1')!), 2)
    );

    const dashLength = length * 0.15; // 15% of edge length

    gsap.set(el, {
      strokeDasharray: `${dashLength} ${length - dashLength}`,
      strokeDashoffset: length,
      opacity: 1,
    });

    gsap.to(el, {
      strokeDashoffset: 0,
      duration: 1.2,
      ease: 'power1.inOut',
      repeat: -1,  // Loop continuously while selected
    });
  });
}, { dependencies: [selectedNode?.id], scope: containerRef });
```

### Pattern 3: Mini-map Viewport Rectangle

**What:** A small overlay SVG showing the full graph with a rectangle indicating the current viewport.
**When to use:** Desktop only, always visible when graph has been zoomed/panned.

```typescript
// Source: billdwhite.com minimap pattern + d3-zoom transform API
interface MiniMapProps {
  nodes: AiNode[];
  positions: LayoutPosition[];
  clusters: Cluster[];
  clusterMap: Map<string, Cluster>;
  rootNodeIds: Set<string>;
  transform: ZoomTransform;
  meta: LayoutMeta;
}

function MiniMap({ nodes, positions, clusters, clusterMap, rootNodeIds, transform, meta }: MiniMapProps) {
  const MINI_WIDTH = 160;
  const MINI_HEIGHT = MINI_WIDTH * (meta.height / meta.width); // Proportional

  // The viewport rectangle in graph coordinates:
  // Invert the transform to find what portion of the graph is visible
  const viewX = -transform.x / transform.k;
  const viewY = -transform.y / transform.k;
  const viewW = meta.width / transform.k;
  const viewH = meta.height / transform.k;

  // Scale factor from graph coords to mini-map coords
  const miniScale = MINI_WIDTH / meta.width;

  return (
    <svg width={MINI_WIDTH} height={MINI_HEIGHT} viewBox={`0 0 ${meta.width} ${meta.height}`}>
      {/* Simplified node dots */}
      {positions.map(pos => (
        <circle key={pos.id} cx={pos.x} cy={pos.y} r={4} opacity={0.5} />
      ))}
      {/* Viewport rectangle */}
      <rect
        x={viewX} y={viewY}
        width={viewW} height={viewH}
        fill="none" stroke="var(--color-accent)"
        strokeWidth={3 / miniScale}
      />
    </svg>
  );
}
```

### Anti-Patterns to Avoid
- **Animating individual node elements during pulse:** Only animate overlay edge lines; touching node circles causes React re-renders for all nodes.
- **Two-way mini-map sync on first implementation:** Start with read-only mini-map (shows viewport, not clickable). Interactive mini-map adds complexity with bidirectional d3-zoom event loops.
- **Using `useEffect` instead of `useGSAP`:** GSAP animations created in `useEffect` are not automatically cleaned up on unmount/re-render, causing memory leaks and stale animations.
- **Re-rendering entire edge layer for pulse:** Use a separate SVG group with refs for pulse overlay lines. The base edges remain static React elements.
- **Computing cluster bounding boxes on every render:** Memoize with `useMemo` keyed on nodes array reference.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Smooth zoom interpolation | Manual requestAnimationFrame zoom interpolation | `d3-zoom` transition API (`select(svg).transition().call(zoom.transform, t)`) | d3-zoom uses `interpolateZoom` (van Wijk & Nuij algorithm) for perceptually smooth zoom transitions. Manual interpolation will feel jerky at scale boundaries. |
| SVG line length calculation | Manual `Math.sqrt()` for each edge | SVG `getTotalLength()` on `<path>` or manual calc for `<line>` | For `<line>` elements, `Math.sqrt(dx^2 + dy^2)` is correct. For `<path>`, use `getTotalLength()`. The graph uses `<line>` so manual calc is fine. |
| GSAP React cleanup | Manual `gsap.context()` + cleanup in `useEffect` return | `@gsap/react` `useGSAP` hook | Handles React 18 strict mode double-execution, automatic revert on unmount, and `contextSafe` for event handlers. |
| Viewport rectangle calculation | Custom viewport tracking state | Derive from existing `transform` React state | The `transform` state (line 43) already tracks `{k, x, y}`. Viewport rect is a pure derivation: `{x: -tx/k, y: -ty/k, w: W/k, h: H/k}`. No new state needed. |

**Key insight:** All three features are layered on top of existing infrastructure. Cluster zoom extends `zoomToNode`. Edge pulse uses GSAP (already installed) on overlay SVG elements. Mini-map derives from existing `transform` state. No new architectural patterns -- just extensions of established ones.

## Common Pitfalls

### Pitfall 1: Cluster Zoom Exceeds Scale Extent
**What goes wrong:** Computing a zoom transform for a small cluster (e.g., "nn" has only 1 node) produces a scale factor beyond the `[0.3, 4]` scaleExtent, causing d3-zoom to clamp silently and the viewport jumps unexpectedly.
**Why it happens:** `Math.min(W/(x1-x0), H/(y1-y0))` can produce very large values for tight bounding boxes.
**How to avoid:** Clamp the computed scale to `[0.5, 3]` (tighter than the zoom extent) before building the transform. Add minimum bounding box dimensions (e.g., 200x150 SVG units).
**Warning signs:** Clicking a single-node cluster causes the view to jump rather than smoothly zoom.

### Pitfall 2: GSAP Animations Not Cleaned Up on Node Deselection
**What goes wrong:** Edge pulse animations continue running after the user closes the detail panel or selects a different node.
**Why it happens:** GSAP tweens with `repeat: -1` run indefinitely. If cleanup relies on React's `useEffect` return, but GSAP tweens outlive the effect.
**How to avoid:** Use `useGSAP` with `dependencies: [selectedNode?.id]`. The hook automatically reverts all tweens created in the previous execution when dependencies change.
**Warning signs:** Multiple pulse animations stack on edges, performance degrades with each node selection.

### Pitfall 3: Mini-map Rectangle Flickers During Rapid Pan
**What goes wrong:** The mini-map viewport rectangle lags or flickers because React re-renders can't keep up with d3-zoom's ~60fps transform updates.
**Why it happens:** Every `setTransform()` call triggers a React re-render of the entire component tree, including the mini-map.
**How to avoid:** The mini-map is already a child of the InteractiveGraph component which re-renders on transform change. Since the mini-map is a simple SVG with ~51 circles and 1 rect, React's reconciliation handles this at 60fps for this graph size. If jitter occurs, extract MiniMap as a `React.memo` component with transform as prop.
**Warning signs:** Visible lag between main viewport movement and mini-map rectangle update.

### Pitfall 4: Edge Pulse Overlay Lines Out of Sync with Base Edges
**What goes wrong:** Pulse overlay lines don't align with the actual rendered edges because they use different coordinate sources or are in a different SVG group with different transforms.
**Why it happens:** If overlay lines are rendered outside the `<g transform={transform.toString()}>` group, they won't track with pan/zoom.
**How to avoid:** Render pulse overlay `<line>` elements INSIDE the same transform group as the base edges, in a sibling `<g>` element with higher z-order.
**Warning signs:** Pulse lines appear in wrong positions when the graph is panned or zoomed.

### Pitfall 5: Legend Click Event Doesn't Reach Graph Component
**What goes wrong:** The `GraphLegend.astro` component is a server-rendered Astro component outside the React island. Click events on cluster labels can't call `zoomToCluster()` inside the React component.
**Why it happens:** Astro components and React islands are separate DOM trees with no shared state.
**How to avoid:** Two options: (A) Move the legend into the React component as a sub-component so click handlers work naturally, or (B) use a custom DOM event: Astro legend dispatches `new CustomEvent('cluster-zoom', {detail: {clusterId}})` on `document`, and the React component listens via `useEffect`. Option A is simpler and recommended.
**Warning signs:** Legend renders correctly but clicking cluster labels does nothing.

### Pitfall 6: GSAP and d3-zoom Transform Conflicts
**What goes wrong:** GSAP animations on SVG elements interfere with d3-zoom's transform on the parent `<g>` element.
**Why it happens:** If GSAP animates `x`, `y`, or `transform` on elements that d3-zoom also controls, the two systems fight.
**How to avoid:** GSAP should ONLY animate `strokeDashoffset`, `strokeDasharray`, and `opacity` on pulse overlay elements. Never animate positional properties. The pulse overlay lines get their positions from React props (same as base edges) and their animation from GSAP (dash offset only).
**Warning signs:** Nodes or edges teleport to wrong positions when pulse animation starts.

## Code Examples

Verified patterns from the existing codebase and official documentation:

### Existing zoomToNode Pattern (InteractiveGraph.tsx:171-187)
```typescript
// Source: src/components/ai-landscape/InteractiveGraph.tsx
const zoomToNode = useCallback((nodeId: string) => {
  const svg = svgRef.current;
  const zoomBehavior = zoomRef.current;
  const pos = posMap.get(nodeId);
  if (!svg || !zoomBehavior || !pos) return;

  const scale = 2;
  const tx = meta.width / 2 - scale * pos.x;
  const ty = meta.height / 2 - scale * pos.y;
  const newTransform = zoomIdentity.translate(tx, ty).scale(scale);

  select(svg)
    .transition()
    .duration(750)
    .call(zoomBehavior.transform, newTransform);
}, [posMap, meta.width, meta.height]);
```

### Existing GSAP Pattern in Project (scroll-animations.ts)
```typescript
// Source: src/lib/scroll-animations.ts
import { gsap } from 'gsap';

const REDUCED_MOTION = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Project already checks reduced motion before running GSAP animations
if (REDUCED_MOTION) {
  // Skip animations, show elements in final state
  return;
}
```

### Cluster Bounding Box Helper
```typescript
// Source: Derived from project's posMap pattern (graph-data.ts)
export interface ClusterBounds {
  x0: number; y0: number;
  x1: number; y1: number;
  cx: number; cy: number;
}

export function getClusterBounds(
  clusterId: string,
  nodes: AiNode[],
  posMap: Map<string, LayoutPosition>,
  padding = 60,
): ClusterBounds | null {
  const positions = nodes
    .filter(n => n.cluster === clusterId)
    .map(n => posMap.get(n.id))
    .filter((p): p is LayoutPosition => p !== undefined);

  if (positions.length === 0) return null;

  const xs = positions.map(p => p.x);
  const ys = positions.map(p => p.y);
  const x0 = Math.min(...xs) - padding;
  const y0 = Math.min(...ys) - padding;
  const x1 = Math.max(...xs) + padding;
  const y1 = Math.max(...ys) + padding;

  // Enforce minimum dimensions to prevent extreme zoom
  const minDim = 200;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const finalX0 = Math.min(x0, cx - minDim / 2);
  const finalY0 = Math.min(y0, cy - minDim / 2);
  const finalX1 = Math.max(x1, cx + minDim / 2);
  const finalY1 = Math.max(y1, cy + minDim / 2);

  return { x0: finalX0, y0: finalY0, x1: finalX1, y1: finalY1, cx, cy };
}
```

### Edge Pulse Overlay Rendering Pattern
```tsx
// Pulse overlay lines rendered inside the transform group, above base edges
<g className="edge-pulse-overlay">
  {selectedNode && edges
    .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
    .map(edge => {
      const src = posMap.get(edge.source);
      const tgt = posMap.get(edge.target);
      if (!src || !tgt) return null;
      const key = `pulse-${edge.source}-${edge.target}`;
      return (
        <line
          key={key}
          ref={el => { if (el) edgePulseRefs.current.set(`${edge.source}-${edge.target}`, el); }}
          x1={src.x} y1={src.y}
          x2={tgt.x} y2={tgt.y}
          stroke="var(--color-accent)"
          strokeWidth={3}
          opacity={0}
          strokeLinecap="round"
          pointerEvents="none"
        />
      );
    })}
</g>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| GSAP premium plugins (paid) | All GSAP plugins free | April 2025 (Webflow acquisition) | DrawSVGPlugin, MotionPathPlugin, MorphSVGPlugin all free. No need to avoid premium plugins. |
| Manual gsap.context() in React | @gsap/react useGSAP hook | 2023 (v2.0 2024) | Automatic cleanup, strict mode support, contextSafe for event handlers. |
| useEffect for GSAP in React | useGSAP drop-in replacement | 2023+ | Prevents memory leaks, handles React 18 double-effect execution. |
| Imperative D3 DOM for mini-map | React-rendered SVG mini-map | Current best practice for React+D3 | React manages the DOM, D3 only provides transform math. Consistent with project's existing pattern. |

**Deprecated/outdated:**
- GSAP 2.x `TweenMax`/`TimelineMax`: Replaced by unified `gsap.to()`/`gsap.timeline()` API in v3
- Manual `gsap.context()` cleanup: Superseded by `useGSAP` hook from `@gsap/react`

## Codebase-Specific Findings

### Current Graph Dimensions
- **ViewBox:** 1200 x 900
- **Nodes:** 51 (5 root nodes with r=24, 46 child nodes with r=18)
- **Edges:** 66 (4 hierarchy, 26 includes, 14 relates, 7 enables, 5 characterizes, 3 aspires, 3 progression, 2 standardizes, 1 applies, 1 example)
- **Clusters:** 9 (ai, ml, nn, dl, genai, levels, agentic, agent-frameworks, devtools)

### Cluster Bounding Boxes (pre-computed from layout.json)
| Cluster | Nodes | Bounding Box | Notes |
|---------|-------|--------------|-------|
| ai | 10 | [438,149]-[627,286] | Largest, center of graph |
| ml | 6 | [319,305]-[586,396] | Wide horizontal spread |
| nn | 1 | [394,458]-[394,458] | Single node -- needs minimum bbox enforcement |
| dl | 10 | [365,470]-[655,620] | Large, lower-center |
| genai | 12 | [500,555]-[706,724] | Most nodes, lower-right |
| levels | 4 | [757,172]-[952,362] | Right side, well-separated |
| agentic | 6 | [775,402]-[923,528] | Right side, compact |
| agent-frameworks | 2 | (subset of agentic) | Small cluster |
| devtools | 2 | [799,607]-[871,617] | Bottom-right, very compact |

### Legend Integration Challenge
The `GraphLegend.astro` component (server-rendered, zero JS) renders cluster labels as a static list. To make cluster labels clickable for zoom, the legend must either:
1. **Move inside the React island** (recommended) -- simplest, no cross-boundary event coordination
2. **Emit custom DOM events** -- GraphLegend adds `onclick="document.dispatchEvent(new CustomEvent('cluster-zoom', {detail:{clusterId:'ai'}}))"` inline handlers, React listens via `useEffect`

Option 1 is recommended because it keeps click-to-zoom behavior colocated with the zoom logic.

### Edge Rendering for Pulse
Current edges are rendered as `<line>` elements (not `<path>`). This means:
- Edge length can be computed as `sqrt(dx^2 + dy^2)` (no need for `getTotalLength()`)
- `strokeDashoffset` / `strokeDasharray` work on `<line>` elements the same as `<path>`
- Pulse overlay lines should be rendered as parallel `<line>` elements in a separate `<g>` group

### Transform State
The `transform` state (line 43) already stores the current `ZoomTransform` and triggers re-renders on pan/zoom. The mini-map viewport rectangle is a pure derivation of this state -- no new state management needed.

### Performance at Current Scale
At 51 nodes and 66 edges, all three features have negligible performance impact:
- **Cluster zoom:** Single d3 transition, same as existing zoomToNode
- **Edge pulse:** Maximum ~15 overlay lines per selected node (average connected edges per node is ~2.6). GSAP handles this trivially.
- **Mini-map:** 51 tiny circles + 1 rect = ~52 SVG elements. React reconciles this in <1ms.

### Reduced Motion Pattern
The project has an established pattern for `prefers-reduced-motion` (used in 15+ files). For Phase 109:
- **Cluster zoom:** Zoom transitions should still work (they're navigational, not decorative), but use shorter duration (300ms vs 750ms)
- **Edge pulse:** Skip entirely when reduced motion is preferred (decorative animation)
- **Mini-map:** Always show (it's a static UI element, viewport rectangle updates are functional not animated)

## Open Questions

1. **Interactive mini-map or read-only?**
   - What we know: The success criteria says "shows the full graph with a highlighted rectangle indicating the current viewport position" -- this implies read-only display.
   - What's unclear: Should clicking on the mini-map pan the main view? (Common UX pattern but not in requirements.)
   - Recommendation: Start read-only. Add click-to-pan as a stretch goal if time permits.

2. **Legend as React or Astro component?**
   - What we know: Current `GraphLegend.astro` is server-rendered (zero JS). Making cluster labels clickable requires JS.
   - What's unclear: Should the existing Astro legend be replaced with a React version, or should a separate in-graph legend be added?
   - Recommendation: Add a compact interactive legend inside the React island (near the mini-map or as part of the graph controls). Keep the static Astro legend below the graph for SEO and noscript support.

3. **Edge pulse direction?**
   - What we know: Success criteria says "pulse travels along the edges connecting it to its parent and child nodes"
   - What's unclear: Should the pulse travel FROM the selected node outward, or TOWARD it? Should parent edges animate differently from child edges?
   - Recommendation: Pulse radiates outward from selected node (source-to-target for child edges, target-to-source for parent edges). This visually communicates the node's relationships.

## Sources

### Primary (HIGH confidence)
- d3js.org/d3-zoom -- Programmatic transform API, transition support, scaleExtent, translateExtent
- gsap.com/resources/React -- useGSAP hook API, contextSafe pattern, automatic cleanup
- gsap.com/docs/v3/Plugins/MotionPathPlugin -- MotionPathPlugin API (confirmed free)
- gsap.com/docs/v3/Plugins/DrawSVGPlugin -- DrawSVGPlugin API (confirmed free, but not needed)

### Secondary (MEDIUM confidence)
- bundlephobia.com/package/gsap -- GSAP core ~23KB gzipped (approximate)
- medium.com/@chedganemouhssine -- Confirmed all GSAP plugins are free as of April 2025
- billdwhite.com/d3-minimap -- Mini-map implementation pattern with viewport rectangle inversion

### Codebase (HIGH confidence)
- `src/components/ai-landscape/InteractiveGraph.tsx` -- 798 lines, existing zoomToNode pattern, d3-zoom setup, transform state
- `src/lib/ai-landscape/graph-data.ts` -- GraphProps interface, shared constants
- `src/lib/ai-landscape/schema.ts` -- AiNode, Edge, Cluster types, edgeTypeEnum
- `src/lib/scroll-animations.ts` -- Existing GSAP usage pattern in the project
- `src/components/ai-landscape/GraphLegend.astro` -- Current static legend (must be extended or duplicated)
- `src/data/ai-landscape/graph.json` -- 9 clusters, 66 edges with type/label
- `src/data/ai-landscape/layout.json` -- 51 positions, 1200x900 viewBox
- `package.json` -- gsap@^3.14.2 already installed, @gsap/react NOT installed

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- GSAP and d3-zoom already installed and used; @gsap/react is the official companion
- Architecture: HIGH -- All three features extend existing patterns (zoomToNode, GSAP animations, transform state derivation)
- Pitfalls: HIGH -- Identified from direct codebase analysis (legend cross-boundary issue, single-node cluster edge case, GSAP cleanup)

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable domain, no rapidly evolving APIs)
