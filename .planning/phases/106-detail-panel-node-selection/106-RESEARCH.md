# Phase 106: Detail Panel & Node Selection - Research

**Researched:** 2026-03-27
**Domain:** React side panel/bottom sheet, node selection state, responsive layout, ancestry highlighting, relationship grouping
**Confidence:** HIGH

## Summary

Phase 106 adds a detail panel that opens when users click a graph node, displaying the concept's educational content with progressive disclosure (ELI5 toggle), grouped relationships, and an ancestry chain highlight on the graph. The panel renders as a slide-out side panel on desktop (>= 768px) and a bottom sheet on mobile (< 768px). This is entirely a React-within-existing-component problem: all changes happen inside `InteractiveGraph.tsx` and new child components, with no changes to the Astro page structure or data pipeline.

The existing codebase provides nearly everything needed. The `AiNode` schema already has `simpleDescription` and `technicalDescription` fields (required by the ELI5 toggle). The `buildAncestryChain` utility in `ancestry.ts` returns root-first ancestor arrays (required by the "How did we get here?" feature). The `getNodeRelationships` function in `schema.ts` returns `parents`, `children`, and `related` edge groups, though it needs enhancement for PANEL-04's four-group requirement ("Part of", "Includes", "Enables", "Examples"). The 66 edges break down across 10 types: `includes` (26), `relates` (14), `enables` (7), `characterizes` (5), `hierarchy` (4), `progression` (3), `aspires` (3), `standardizes` (2), `example` (1), `applies` (1).

The key architectural decision is that the detail panel component must live inside the same React tree as `InteractiveGraph` (since it needs shared selection state and the ability to trigger graph highlights). The panel content reads from the same `nodes`, `edges`, and `nodeMap` data already passed as props. No new data fetching or API calls are needed -- this is pure client-side state management within the existing React island.

**Primary recommendation:** Add `selectedNode` state to `InteractiveGraph.tsx`. Create `DetailPanel.tsx` (side panel content) and `BottomSheet.tsx` (mobile wrapper) as child components. Use `window.matchMedia('(min-width: 768px)')` in a `useMediaQuery` hook to switch between layouts. Add `highlightedNodeIds` state for ancestry chain highlighting. Group relationships by mapping edge `type` to four UI categories. All CSS via Tailwind utility classes + CSS custom properties for theme consistency.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PANEL-01 | Click node opens slide-out side panel with title, explanation, relationships, and link to full page | Add `selectedNode` state to InteractiveGraph. On click, set selected node. Render `DetailPanel` conditionally. Panel content: node.name, description, grouped edges, `<a href={conceptUrl(slug)}>`. Side panel position: `fixed right-0` or flex layout alongside SVG. |
| PANEL-02 | "Explain Like I'm 5" toggle switches between simple and technical descriptions (simple is default) | `AiNode` already has `simpleDescription` and `technicalDescription`. Toggle is local `useState<boolean>(true)` in DetailPanel. Default `true` = simple mode. Show `simpleDescription` or `technicalDescription` based on toggle. |
| PANEL-03 | "How did we get here?" ancestry path -- clicking highlights the full hierarchy chain | `buildAncestryChain(nodeSlug, nodesMap)` already returns root-first AncestryItem[]. To highlight on graph: set `highlightedNodeIds: Set<string>` state in InteractiveGraph, pass down. SVG nodes/edges in the chain get a highlight class (brighter fill, thicker stroke, or glow). |
| PANEL-04 | Relationships grouped by type in panel ("Part of", "Includes", "Enables", "Examples") | Current `getNodeRelationships` returns 3 groups (parents/children/related). Need a new 4-group function mapping edge types to UI labels: hierarchy+includes->source edges = "Part of"; hierarchy+includes->target edges = "Includes"; enables/applies/powers = "Enables"; example = "Examples". Remaining types (relates, progression, characterizes, aspires, standardizes) go into a 5th "Related" overflow group. |
| PANEL-05 | Bottom sheet layout on mobile instead of side panel | Use `matchMedia('(min-width: 768px)')` listener. Desktop: side panel slides from right, graph shrinks or overlays. Mobile: bottom sheet slides up from bottom with drag-to-dismiss handle. The 768px breakpoint matches the project's existing `md:` Tailwind breakpoint. |
</phase_requirements>

## Project Constraints (from CLAUDE.md & prior decisions)

- D3 micro-module imports only (never umbrella `d3` package) -- bundle isolation critical
- `client:only="react"` for graph island (never `client:visible`) -- prevents SSR crash
- React 19 with `@astrojs/react` 4.4.2
- Tailwind CSS for non-SVG styling, CSS custom properties for SVG theming
- `html.dark` class toggle for dark mode (existing project pattern)
- Pre-computed positions from `layout.json` -- no runtime force simulation
- d3-zoom + React integration: zoom behavior in useRef, transform state in single `<g>` wrapper
- Modifier key guard: d3-zoom `.filter()` rejects unmodified wheel
- Embedded SVG CSS via dangerouslySetInnerHTML for cluster coloring
- Edge type enum: 10 categories (hierarchy, includes, enables, example, relates, progression, characterizes, aspires, applies, standardizes)
- Two-file data split: nodes.json (file() loader content collection) + graph.json (clusters/edges, direct import)
- Existing conventions: 2-space indent, single quotes, no barrel files, relative imports, PascalCase components, camelCase utils

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | 19.2.4 | Component rendering, state, effects, refs | Already installed. All interactive UI is React islands. |
| d3-zoom | 3.0.0 | Programmatic zoom-to-node for focusing selected concept | Already installed. Used by InteractiveGraph for pan/zoom. |
| d3-selection | 3.0.0 | SVG element selection for programmatic zoom transitions | Already installed. Used for `select(svg).call(zoomBehavior)`. |
| tailwindcss | 3.4.19 | Panel styling, responsive breakpoints, transitions | Already installed. Project's primary CSS framework. |

### NOT needed (no new dependencies)
| Library | Why Not |
|---------|---------|
| @headlessui/react | Overkill for a single panel + toggle. `useState` + Tailwind transitions suffice. 15KB+ added. |
| framer-motion | Panel slide animation is achievable with CSS `transform` + `transition`. No need for a JS animation library. |
| react-bottom-sheet | Custom bottom sheet with touch handling is straightforward with `touchstart`/`touchmove`/`touchend`. Library adds bundle size for one component. |
| radix-ui/dialog | Panel is not a modal dialog -- it's a persistent sidebar/sheet. No focus trap or backdrop needed. |
| @floating-ui/react | Panel has fixed positioning (right edge or bottom), not floating relative to a trigger. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom bottom sheet | react-bottom-sheet / vaul | Library provides smooth spring physics and snap points, but adds ~8-12KB for a feature that needs only a simple slide-up with drag-to-dismiss. Custom is acceptable for this scope. |
| CSS transitions for panel | framer-motion AnimatePresence | framer-motion gives exit animations and layout transitions, but the panel is a simple slide-in/slide-out -- CSS `transform: translateX()` with `transition` handles this perfectly. |
| `matchMedia` hook | Tailwind responsive classes only | Tailwind `md:` classes handle static layout differences, but switching between side panel and bottom sheet requires conditional rendering (different DOM structure), so a JS media query listener is needed. |

**Installation:**
```bash
# No new packages needed. All dependencies are already installed.
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/ai-landscape/
    InteractiveGraph.tsx      # MODIFIED: Add selectedNode state, click handler, highlight state, layout wrapper
    DetailPanel.tsx            # NEW: Panel content (title, description, relationships, ancestry, links)
    BottomSheet.tsx            # NEW: Mobile bottom sheet wrapper with drag-to-dismiss
    useMediaQuery.ts           # NEW: Hook for responsive breakpoint detection
    GraphLegend.astro          # EXISTING: No changes
    ConceptList.astro          # EXISTING: No changes
    AncestryBreadcrumb.astro   # EXISTING: No changes (Astro SSR component, not used in React)
    RelatedConcepts.astro      # EXISTING: No changes (Astro SSR component, not used in React)
  lib/ai-landscape/
    schema.ts                  # MODIFIED: Add groupRelationshipsByType() helper
    ancestry.ts                # EXISTING: No changes (buildAncestryChain already works)
    graph-data.ts              # EXISTING: No changes (types already exported)
    routes.ts                  # EXISTING: No changes (conceptUrl already exists)
  pages/ai-landscape/
    index.astro                # MINOR CHANGE: Adjust container width to accommodate side panel
```

### Pattern 1: Selected Node State + Click Handler
**What:** Add `selectedNode: AiNode | null` state to InteractiveGraph. Attach `onClick` to node `<g>` groups. Clicking a node sets it as selected; clicking the same node or an explicit close button deselects it.
**When to use:** This phase -- node selection is the primary interaction trigger.
**Why this way:** Selection state must live in InteractiveGraph because it affects both the panel (content) and the graph (highlight styling). Lifting it higher would require prop drilling through the Astro boundary.
**Example:**
```typescript
const [selectedNode, setSelectedNode] = useState<AiNode | null>(null);

const handleNodeClick = useCallback((node: AiNode) => {
  setSelectedNode((prev) => (prev?.id === node.id ? null : node));
}, []);

// In the node rendering loop:
<g
  key={node.id}
  style={{ cursor: 'pointer' }}
  onClick={() => handleNodeClick(node)}
>
  <circle
    cx={pos.x}
    cy={pos.y}
    r={r}
    className={clusterClass}
    stroke={selectedNode?.id === node.id ? 'var(--color-accent)' : undefined}
    strokeWidth={selectedNode?.id === node.id ? 3 : undefined}
  />
</g>
```

### Pattern 2: Responsive Layout (Side Panel vs Bottom Sheet)
**What:** Use a `useMediaQuery` hook to detect `(min-width: 768px)`. On desktop, render the panel as a fixed-position sidebar to the right of the graph. On mobile, render it as a bottom sheet that slides up from the bottom.
**When to use:** PANEL-01 + PANEL-05 requirement.
**Why this way:** The two layouts have different DOM structures (side panel needs different positioning and sizing than a bottom sheet), so Tailwind responsive classes alone are insufficient -- conditional rendering is required. The 768px breakpoint aligns with Tailwind's `md:` breakpoint and the project's established mobile detection pattern (HeadScene.tsx uses `window.innerWidth < 768`).
**Example:**
```typescript
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// Usage in InteractiveGraph:
const isDesktop = useMediaQuery('(min-width: 768px)');

{selectedNode && isDesktop && (
  <DetailPanel node={selectedNode} ... variant="side" onClose={() => setSelectedNode(null)} />
)}
{selectedNode && !isDesktop && (
  <BottomSheet onClose={() => setSelectedNode(null)}>
    <DetailPanel node={selectedNode} ... variant="sheet" />
  </BottomSheet>
)}
```

### Pattern 3: Ancestry Chain Highlighting
**What:** When the user clicks "How did we get here?" in the panel, compute the ancestry chain via `buildAncestryChain` and store the resulting node slugs (plus the selected node itself) in a `highlightedNodeIds: Set<string>` state. SVG nodes in the set get a visual highlight (accent stroke, slight scale). Edges connecting consecutive chain members get highlighted styling (thicker, colored).
**When to use:** PANEL-03 requirement.
**Why this way:** The ancestry chain is already computed by `buildAncestryChain()`. Storing highlighted IDs as a Set gives O(1) lookup when rendering each node/edge. The highlight is purely visual -- CSS classes applied conditionally.
**Example:**
```typescript
const [highlightedNodeIds, setHighlightedNodeIds] = useState<Set<string>>(new Set());

const handleShowAncestry = useCallback((node: AiNode) => {
  const nodesMap = new Map(nodes.map((n) => [n.slug ?? n.id, n]));
  const chain = buildAncestryChain(node.id, nodesMap);
  const ids = new Set(chain.map((a) => a.slug));
  ids.add(node.id);
  setHighlightedNodeIds(ids);
}, [nodes]);

// In SVG rendering:
const isHighlighted = highlightedNodeIds.has(node.id);
const dimmed = highlightedNodeIds.size > 0 && !isHighlighted;
<circle
  opacity={dimmed ? 0.2 : 1}
  stroke={isHighlighted ? 'var(--color-accent)' : undefined}
  strokeWidth={isHighlighted ? 3 : undefined}
/>
```

### Pattern 4: Relationship Grouping by UI Category
**What:** Map the 10 edge types to 4 primary UI groups plus a "Related" overflow. The grouping function takes a node slug and the full edges array, returning categorized arrays.
**When to use:** PANEL-04 requirement.
**Why this way:** The success criteria specifies 4 groups: "Part of", "Includes", "Enables", "Examples". The existing `getNodeRelationships` returns 3 groups by direction (parents/children/related) which doesn't match the UI requirement. A new function maps by edge type semantics.

**Grouping logic:**
| UI Group | Edge Types | Direction | Count in Dataset |
|----------|------------|-----------|-----------------|
| Part of | hierarchy, includes | node is TARGET | ~30 edges (a node is typically child of 1-2 parents) |
| Includes | hierarchy, includes | node is SOURCE | ~30 edges |
| Enables | enables, applies | either direction | 8 edges |
| Examples | example | either direction | 1 edge |
| Related (overflow) | relates, progression, characterizes, aspires, standardizes | either direction | 27 edges |

### Pattern 5: ELI5 Toggle
**What:** A toggle button in the detail panel defaults to "simple" mode (showing `simpleDescription`). Clicking it switches to "technical" mode (showing `technicalDescription`). The toggle label shows "Explain Like I'm 5" when in technical mode and "Show Technical Details" when in simple mode (or the reverse -- the label indicates what you'll switch TO).
**When to use:** PANEL-02 requirement.
**Why this way:** Both description fields already exist on every node (required by Zod schema, min 50 chars each). Simple boolean state with immediate UI swap. No animation needed beyond a subtle transition.
**Example:**
```typescript
const [isSimple, setIsSimple] = useState(true);

<button
  onClick={() => setIsSimple(!isSimple)}
  className="text-xs font-mono text-[var(--color-accent)] hover:underline"
  aria-pressed={!isSimple}
>
  {isSimple ? 'Show Technical Details' : 'Explain Like I\'m 5'}
</button>

<p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
  {isSimple ? node.simpleDescription : node.technicalDescription}
</p>
```

### Pattern 6: Panel Slide-In Animation (CSS only)
**What:** Panel enters with a CSS `transform` transition. Side panel slides from `translateX(100%)` to `translateX(0)`. Bottom sheet slides from `translateY(100%)` to `translateY(0)`. Exit is the reverse.
**When to use:** Both desktop and mobile panel presentations.
**Why this way:** CSS transitions are sufficient for linear slide animations. No need for framer-motion or GSAP. The `transition-transform` property is GPU-accelerated. `prefers-reduced-motion` should disable the animation.

### Anti-Patterns to Avoid
- **Creating a separate React island for the panel:** The panel must share state (selectedNode, highlightedNodeIds) with the graph. Separate islands can't share React state without a global store. Keep everything in the same React tree under InteractiveGraph.
- **Using React portals for the panel:** The panel div is inside the same container as the SVG. No need for portals -- the panel is a sibling element positioned with CSS, not escaping the DOM hierarchy.
- **Modifying the Astro page layout for every state change:** The panel is purely React-managed. The Astro page renders once with the container; React handles the internal layout shifts.
- **Trying to animate SVG highlight with d3-transition:** Keep highlight styling as React-managed class names/attributes. D3 transitions conflict with React's reconciliation. Use CSS transitions on SVG elements for any animation.
- **Using `overflow: hidden` on the graph container when panel opens:** This would clip the panel. Instead, use a flex layout where the graph and panel are siblings, or position the panel with `fixed`/`absolute`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Responsive breakpoint detection | Inline `window.innerWidth` checks on render | `useMediaQuery` hook with `matchMedia` listener | `innerWidth` doesn't update reactively; `matchMedia` fires events on breakpoint crosses. SSR-safe with initial `false` default. |
| Ancestry chain computation | Walking parentId manually in the component | `buildAncestryChain()` from `src/lib/ai-landscape/ancestry.ts` | Already tested, handles circular refs, returns root-first order. Proven in Phase 103. |
| Concept page URLs | String concatenation | `conceptUrl(slug)` from `src/lib/ai-landscape/routes.ts` | Handles trailing slash convention consistently across the site. |
| Node relationship lookup | Filtering edges inline in JSX | A dedicated `groupRelationshipsByType()` helper in `schema.ts` | Complex grouping logic (10 types -> 5 UI groups, bidirectional matching) is error-prone if inlined. Testable as a pure function. |

**Key insight:** The data layer for this phase is already complete. Every function and data field needed exists -- the work is purely UI component creation and state management.

## Common Pitfalls

### Pitfall 1: Click vs Drag Conflict on Nodes
**What goes wrong:** When the user drags to pan starting from a node, the `mouseup` fires an `onClick`, unintentionally selecting the node.
**Why it happens:** d3-zoom handles drag on the SVG; React handles click on nodes. If the user mousedowns on a node and drags, d3-zoom pans the graph, but the mouseup also triggers React's click event on the node.
**How to avoid:** Track whether a drag occurred. Option A: In the `onClick` handler, check if the d3-zoom transform changed between mousedown and mouseup (compare transforms). Option B: Use a `hasDragged` ref set by d3-zoom's `'start'` and `'zoom'` events -- if the transform changes, set a flag that the click handler checks and resets.
**Warning signs:** Nodes get selected whenever the user pans the graph; users report accidental panel opens.

### Pitfall 2: Bottom Sheet Touch Conflict with Graph Pan
**What goes wrong:** On mobile, touching the bottom sheet to scroll its content triggers d3-zoom's pan behavior on the underlying graph.
**Why it happens:** Touch events bubble up from the bottom sheet through the container to the SVG where d3-zoom is listening. The bottom sheet and the graph share the same touch event space.
**How to avoid:** The bottom sheet container must call `e.stopPropagation()` on touch events to prevent them from reaching the SVG. Alternatively, position the bottom sheet outside the SVG container's DOM subtree so events don't bubble to d3-zoom's listeners. The simplest approach: render the bottom sheet as a sibling of the SVG (not a child), so d3-zoom's event listeners on the SVG don't capture it.
**Warning signs:** Scrolling the panel content on mobile causes the graph to pan simultaneously.

### Pitfall 3: Panel Opens Off-Screen on Narrow Desktop
**What goes wrong:** On narrow desktop viewports (768px - 1024px), the side panel (e.g., 360px wide) plus the graph don't fit, causing horizontal overflow or squishing the graph to unusability.
**How to avoid:** Set a maximum panel width (e.g., `max-w-sm` = 384px or `w-80` = 320px). On desktop viewports below ~1024px, consider using an overlay panel (position: absolute/fixed, overlapping the graph) instead of a side-by-side flex layout. The side panel should be closeable to recover full graph width.
**Warning signs:** Horizontal scrollbar appears; graph becomes unreadably small.

### Pitfall 4: Ancestry Highlight Doesn't Clear
**What goes wrong:** User clicks "How did we get here?", sees the highlighted chain, then selects a different node -- but the old highlight persists, confusing the visualization.
**Why it happens:** `highlightedNodeIds` state isn't cleared when `selectedNode` changes.
**How to avoid:** Clear `highlightedNodeIds` in the node click handler when the selected node changes. Re-triggering "How did we get here?" on the new node should compute a fresh chain.
**Warning signs:** Multiple ancestry chains highlighted simultaneously; dimmed nodes from a previous selection remain dimmed.

### Pitfall 5: Missing Node ID Mapping Between slug and id
**What goes wrong:** `buildAncestryChain` uses `slug` keys in its Map, but `InteractiveGraph` uses `id` keys in its `posMap` and `nodeMap`. If `slug !== id` for any node, the ancestry chain IDs won't match the position map keys, breaking highlight rendering.
**Why it happens:** The `AiNode` schema has both `id` and `slug` fields. In the current dataset they happen to be identical (both are the kebab-case concept name like `deep-learning`), but this is not guaranteed by the schema.
**How to avoid:** Always use consistent keys. Since `buildAncestryChain` returns slugs, and the graph rendering uses `id`, either: (a) build a slug-to-id mapping, or (b) verify that all nodes have `id === slug` (they currently do) and add a test to guard this assumption, or (c) modify the ancestry chain code to also return `id`.
**Warning signs:** Ancestry highlight appears to do nothing despite the chain being computed correctly.

### Pitfall 6: React Re-renders Entire Graph on Panel State Change
**What goes wrong:** Every state change in the detail panel (ELI5 toggle, scroll) causes the entire InteractiveGraph component to re-render, recalculating all 51 nodes and 66 edges.
**Why it happens:** Panel state lives in InteractiveGraph, so state changes trigger re-renders of the full tree.
**How to avoid:** Panel-internal state (isSimple toggle, scroll position) should live inside the `DetailPanel` component, not in InteractiveGraph. Only `selectedNode` and `highlightedNodeIds` need to live in InteractiveGraph. Additionally, memoize the SVG rendering with `useMemo` or extract it into a `React.memo()` sub-component that only receives `transform`, `selectedNode?.id`, and `highlightedNodeIds` (not the full panel state).
**Warning signs:** Typing or scrolling in the panel causes visible jank in the graph.

## Code Examples

### Relationship Grouping Helper
```typescript
// Source: Project-specific mapping of edge types to UI groups
// Add to src/lib/ai-landscape/schema.ts

export interface GroupedRelationships {
  partOf: Edge[];    // node is target of hierarchy/includes edge
  includes: Edge[];  // node is source of hierarchy/includes edge
  enables: Edge[];   // enables, applies edges in either direction
  examples: Edge[];  // example edges in either direction
  related: Edge[];   // everything else: relates, progression, characterizes, aspires, standardizes
}

export function groupRelationshipsByType(
  nodeId: string,
  edges: Edge[],
): GroupedRelationships {
  const partOf: Edge[] = [];
  const includes: Edge[] = [];
  const enables: Edge[] = [];
  const examples: Edge[] = [];
  const related: Edge[] = [];

  for (const edge of edges) {
    const isSource = edge.source === nodeId;
    const isTarget = edge.target === nodeId;
    if (!isSource && !isTarget) continue;

    switch (edge.type) {
      case 'hierarchy':
      case 'includes':
        if (isTarget) partOf.push(edge);
        else includes.push(edge);
        break;
      case 'enables':
      case 'applies':
        enables.push(edge);
        break;
      case 'example':
        examples.push(edge);
        break;
      default:
        related.push(edge);
        break;
    }
  }

  return { partOf, includes, enables, examples, related };
}
```

### useMediaQuery Hook
```typescript
// Source: Standard React pattern, verified via React docs
// New file: src/components/ai-landscape/useMediaQuery.ts

import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
```

### Click-vs-Drag Discrimination
```typescript
// Source: d3-zoom integration pattern
// In InteractiveGraph.tsx, alongside existing zoom setup

const hasDragged = useRef(false);

// In the useEffect where zoomBehavior is created:
const zoomBehavior = zoom<SVGSVGElement, unknown>()
  .scaleExtent([0.3, 4])
  .filter(/* existing filter */)
  .on('start', () => { hasDragged.current = false; })
  .on('zoom', (event) => {
    hasDragged.current = true;
    setTransform(event.transform);
  });

// In node click handler:
const handleNodeClick = useCallback((node: AiNode) => {
  if (hasDragged.current) return; // Ignore click after drag
  setSelectedNode((prev) => (prev?.id === node.id ? null : node));
  setHighlightedNodeIds(new Set()); // Clear ancestry highlight
}, []);
```

### Side Panel Component Structure
```typescript
// Source: Project conventions (Tailwind + CSS custom properties)
// New file: src/components/ai-landscape/DetailPanel.tsx

interface DetailPanelProps {
  node: AiNode;
  relationships: GroupedRelationships;
  ancestry: AncestryItem[];
  onClose: () => void;
  onShowAncestry: () => void;
}

export default function DetailPanel({
  node, relationships, ancestry, onClose, onShowAncestry,
}: DetailPanelProps) {
  const [isSimple, setIsSimple] = useState(true);

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[var(--color-surface)] border-l border-[var(--color-border)]">
      {/* Header with close button */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
        <h2 className="text-lg font-heading font-bold">{node.name}</h2>
        <button onClick={onClose} aria-label="Close panel">...</button>
      </div>

      {/* ELI5 Toggle */}
      <div className="px-4 pt-3">
        <button onClick={() => setIsSimple(!isSimple)} ...>
          {isSimple ? 'Show Technical Details' : 'Explain Like I\'m 5'}
        </button>
      </div>

      {/* Description */}
      <p className="px-4 py-3 text-sm leading-relaxed">
        {isSimple ? node.simpleDescription : node.technicalDescription}
      </p>

      {/* Ancestry path */}
      {ancestry.length > 0 && (
        <button onClick={onShowAncestry}>How did we get here?</button>
      )}

      {/* Grouped relationships */}
      {/* ... render partOf, includes, enables, examples, related groups ... */}

      {/* Link to full page */}
      <a href={conceptUrl(node.slug)}>View full page</a>
    </div>
  );
}
```

### Bottom Sheet with Drag-to-Dismiss
```typescript
// Source: Standard mobile bottom sheet pattern
// New file: src/components/ai-landscape/BottomSheet.tsx

interface BottomSheetProps {
  onClose: () => void;
  children: React.ReactNode;
}

export default function BottomSheet({ onClose, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    currentY.current = e.touches[0].clientY;
    const delta = currentY.current - startY.current;
    if (delta > 0 && sheetRef.current) {
      // Only allow downward drag (dismiss direction)
      sheetRef.current.style.transform = `translateY(${delta}px)`;
    }
  };

  const handleTouchEnd = () => {
    const delta = currentY.current - startY.current;
    if (delta > 100) {
      onClose(); // Dismiss threshold: 100px downward drag
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = 'translateY(0)';
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 max-h-[70vh]"
      ref={sheetRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Drag handle */}
      <div className="flex justify-center py-2">
        <div className="w-10 h-1 rounded-full bg-[var(--color-border)]" />
      </div>
      <div className="overflow-y-auto max-h-[calc(70vh-2rem)]">
        {children}
      </div>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate React islands per panel/graph | Single React tree with shared state | Always (React architecture) | Avoids global store complexity; state sharing via props/context |
| JS-based mobile detection (window.innerWidth) | matchMedia with event listener | 2020+ (matchMedia widely supported) | Reactive to viewport changes (device rotation, resize); no polling |
| Custom slide-in animations with JS | CSS `transform` + `transition` | CSS transitions matured ~2018 | GPU-accelerated, no JS frame loop, respects prefers-reduced-motion |
| Modal/dialog for detail views | Persistent panel/sheet (non-blocking) | Modern data viz convention | User can see both the graph and the detail simultaneously |

**Deprecated/outdated:**
- `window.addListener()` on MediaQueryList: Use `addEventListener('change', ...)` instead (addListener is deprecated)
- `resize` event listener for mobile detection: Use `matchMedia` instead (no polling, fires on breakpoint cross only)

## Open Questions

1. **Panel positioning strategy: overlay vs flex?**
   - What we know: On desktop, the panel can either overlay the graph (fixed/absolute) or sit beside it (flex layout, shrinking the graph). Overlay preserves graph size but hides content. Flex ensures both are fully visible but makes the graph narrower.
   - Recommendation: Use overlay with semi-transparent backdrop or z-layering. The graph is already in a `max-w-6xl` container; splitting it further would make the graph too small. Clicking outside the panel (on the graph) could dismiss it. The existing concept page ([slug].astro) uses max-w-4xl for content, so a ~320px panel is consistent with content widths. **Planner's discretion.**

2. **Should clicking a node also zoom to center it?**
   - What we know: Phase 107 (Search, Navigation & Deep Links) explicitly includes "selecting a result zooms the graph to that node". Phase 106 success criteria says only "opens a slide-out side panel" -- no mention of zoom.
   - Recommendation: Do NOT zoom on click in Phase 106. Keep it simple -- just open the panel. Phase 107 will add zoom-to-node as part of search/navigation. Adding it now risks scope creep and complicates the click-vs-drag logic.

3. **Should the backdrop/scrim behind the bottom sheet be interactive?**
   - What we know: On mobile, a bottom sheet typically has a scrim that dismisses on tap. But the graph behind it is interactive (pan/zoom). Dismissing via scrim tap would conflict with graph interaction.
   - Recommendation: No scrim on mobile. The bottom sheet overlays the lower portion; the upper portion of the graph remains interactive. The sheet has a drag handle for dismissal and a close button. Tapping outside the sheet on the graph should either do nothing or dismiss the sheet -- **planner's discretion**.

## Sources

### Primary (HIGH confidence)
- **Codebase inspection** -- All findings verified by reading actual source files:
  - `src/components/ai-landscape/InteractiveGraph.tsx` (326 lines, current implementation)
  - `src/lib/ai-landscape/schema.ts` (AiNode, Edge, getNodeRelationships)
  - `src/lib/ai-landscape/ancestry.ts` (buildAncestryChain)
  - `src/lib/ai-landscape/routes.ts` (conceptUrl)
  - `src/lib/ai-landscape/graph-data.ts` (GraphProps, constants)
  - `src/pages/ai-landscape/index.astro` (React island mount)
  - `src/pages/ai-landscape/[slug].astro` (concept detail page structure)
  - `src/data/ai-landscape/graph.json` (66 edges, 9 clusters)
  - `src/data/ai-landscape/nodes.json` (51 nodes with all fields)
  - `src/styles/global.css` (CSS custom properties, reduced motion patterns)
  - `tailwind.config.mjs` (color aliases, breakpoints)
  - `package.json` (all dependencies with versions)
- **Phase 105 research and verification** -- Established patterns for d3-zoom + React integration
- **Phase 103 verification** -- Established patterns for ancestry breadcrumb and related concepts

### Secondary (MEDIUM confidence)
- React `matchMedia` hook pattern -- Standard React pattern documented in React docs and widely used
- CSS `transform` + `transition` for slide animations -- Well-established browser capability
- Bottom sheet drag-to-dismiss pattern -- Common mobile UI pattern (Google Maps, Apple Maps)

### Tertiary (LOW confidence)
- None. All findings verified against codebase or well-established patterns.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No new dependencies. All libraries already installed and used in the project.
- Architecture: HIGH -- All patterns verified against existing codebase. Component structure follows established conventions (React island, Tailwind styling, CSS custom properties).
- Pitfalls: HIGH -- Click-vs-drag and touch event conflicts are well-documented D3+React integration issues. Verified against Phase 105's existing implementation.
- Data layer: HIGH -- All data fields, utility functions, and type definitions verified to exist in the codebase. Edge type distribution counted from actual graph.json.

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable -- no external dependencies, all patterns are project-internal)
