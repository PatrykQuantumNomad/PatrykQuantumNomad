# Phase 107: Search, Navigation & Deep Links - Research

**Researched:** 2026-03-27
**Domain:** Search autocomplete, URL state management, keyboard navigation, programmatic d3-zoom, responsive graph layout
**Confidence:** HIGH

## Summary

Phase 107 adds four capabilities to the AI landscape graph: (1) a search autocomplete field that filters 51 nodes by name and zooms/selects on pick, (2) responsive layout refinements ensuring 350px minimum width readability, (3) URL deep links that persist and restore node selection state via query parameters, and (4) keyboard navigation allowing edge traversal, selection, and deselection without a mouse.

The existing codebase provides a strong foundation. `InteractiveGraph.tsx` (442 lines) already manages `selectedNode` state, `highlightedNodeIds`, d3-zoom via `zoomRef`, and responsive desktop/mobile switching via `useMediaQuery`. The `nodeMap` (keyed by `id`) and `posMap` (keyed by `id`) are already memoized. The `resetZoom` callback demonstrates the programmatic zoom pattern (`select(svg).transition().call(zoomBehavior.transform, ...)`) that zoom-to-node will extend. The data set is small (51 nodes, 66 edges) making client-side filtering trivial -- no fuzzy search library is needed.

The deep links feature requires syncing React state with `URLSearchParams`. Since this is a `client:only="react"` island (no SSR), `window.location.search` is always available. The pattern established by the project's tool ShareActions components (`history.replaceState`) provides the URL update mechanism. For restoring state on page load, an `initialNodeSlug` can be read from `URLSearchParams` in a `useEffect` and used to set `selectedNode` + trigger zoom-to-node. Astro's `trailingSlash: 'always'` config means the URL will be `/ai-landscape/?node=large-language-models` (trailing slash before query string).

Keyboard navigation is the most complex feature. It requires building an adjacency map from the edges array (O(E) preprocessing), tracking a "focused" node distinct from the "selected" node, and handling arrow key direction mapping relative to node positions. The ARIA pattern for this is a roving tabindex on an SVG group, with `aria-activedescendant` pointing to the focused node.

**Primary recommendation:** Add a `SearchBar` component (controlled `<input>` with `<datalist>` or custom dropdown) above the graph. Implement `useUrlState` hook for bidirectional `?node=slug` sync. Add a `zoomToNode` utility that computes the d3-zoom transform to center a node at scale ~2x. Build keyboard event handling directly in `InteractiveGraph.tsx` using an adjacency map derived from edges. No new dependencies required -- all capabilities are achievable with React state + existing d3-zoom + browser APIs.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NAV-01 | Search autocomplete that filters nodes -- on select, zooms to node and opens panel | 51 nodes is small enough for simple `String.includes()` filtering. Render filtered results in a dropdown below the input. On select: (1) set `selectedNode`, (2) call `zoomToNode(posMap.get(slug))` to animate zoom. No fuzzy search library needed at this scale. |
| NAV-02 | Mobile-responsive layout -- full-width graph on mobile, detail as bottom sheet | Phase 106 already implemented the desktop side panel (w-80) and mobile BottomSheet. This requirement needs verification that the graph + search bar work at 350px width. The search bar must be full-width on mobile. Graph SVG viewBox (1200x900) scales responsively via `w-full h-auto`. |
| SEO-05 | Shareable deep links -- URL updates with selected node (/ai-landscape?node=slug) | Use `history.replaceState` (not pushState) to update URL on node selection without creating history entries for every click. On mount, read `URLSearchParams` to restore selection. Slug is the key (matches concept page slug convention). The Astro `trailingSlash: 'always'` config produces `/ai-landscape/?node=slug`. |
| SEO-06 | Keyboard navigation -- arrow keys traverse edges, Enter selects, Escape deselects, Tab through nodes | Build adjacency map from edges. Track `focusedNodeId` state (distinct from `selectedNode`). Arrow keys move focus to nearest neighbor in that direction. Enter selects focused node (opens panel). Escape deselects and clears focus. Tab cycles through all nodes in DOM order. SVG `tabIndex={0}` enables keyboard events. |
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
- Two-file data split: nodes.json (file() loader content collection) + graph.json (clusters/edges, direct import)
- Existing conventions: 2-space indent, single quotes, no barrel files, relative imports, PascalCase components, camelCase utils
- `history.replaceState` for URL updates (established pattern in ShareActions components)
- `nanostores` available but NOT needed here -- all state lives in InteractiveGraph React tree
- Node `id === slug` throughout the dataset (verified: all 51 nodes)
- Astro `trailingSlash: 'always'` means URLs are `/ai-landscape/?node=slug`

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | 19.2.4 | Component rendering, state, effects, keyboard event handlers | Already installed. All interactive UI is React islands. |
| d3-zoom | 3.0.0 | Programmatic zoom-to-node animation via `zoomBehavior.transform` | Already installed and used in InteractiveGraph for pan/zoom. |
| d3-selection | 3.0.0 | `select(svg).transition().call(zoomBehavior.transform, ...)` for smooth zoom | Already installed. Required for d3-zoom programmatic transitions. |
| tailwindcss | 3.4.19 | Search bar styling, responsive breakpoints, focus ring utilities | Already installed. Project's primary CSS framework. |

### NOT needed (no new dependencies)
| Library | Why Not |
|---------|---------|
| fuse.js / minisearch | 51 nodes is trivially searchable with `String.includes()` or `String.startsWith()`. Fuzzy search libraries add complexity and bundle size for no benefit at this scale. |
| @headlessui/react Combobox | Full combobox with ARIA is achievable with native HTML + React event handlers for 51 items. No need for a 15KB+ library. |
| react-router / @tanstack/router | This is a single Astro page with query parameters. `URLSearchParams` + `history.replaceState` + `popstate` listener is sufficient. Adding a client-side router to an Astro static site is an anti-pattern. |
| @reach/combobox | Unmaintained since 2022. Native HTML patterns suffice. |
| downshift | Powerful but excessive for a single autocomplete with 51 static items and no async fetching. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom search dropdown | HTML `<datalist>` element | `<datalist>` is browser-native and accessible out of the box, but offers no styling control -- the dropdown appearance varies wildly across browsers and cannot match the site's design system. A custom dropdown is preferred for consistent visual design. |
| `history.replaceState` for URL | `history.pushState` | `pushState` creates a new history entry per node selection, cluttering the back button. `replaceState` updates the URL without adding history entries, which is appropriate since selecting a node is not a navigation action. |
| Arrow key edge traversal | Tab-only navigation (linear order) | Tab-only is simpler but ignores the graph's spatial structure. Arrow keys following edges are more intuitive for a graph visualization. Tab can serve as a linear fallback cycling through all nodes alphabetically. |
| Single `focusedNodeId` state | Separate focus ring vs selection ring | Keeping focus (keyboard cursor) and selection (panel open) as separate states allows keyboard exploration without opening the panel on every arrow key press. Enter commits focus to selection. |

**Installation:**
```bash
# No new packages needed. All dependencies are already installed.
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/ai-landscape/
    InteractiveGraph.tsx      # MODIFIED: Add keyboard handlers, URL state sync, zoomToNode, search integration, focusedNodeId state
    SearchBar.tsx              # NEW: Search autocomplete input with filtered dropdown
    DetailPanel.tsx            # EXISTING: No changes needed
    BottomSheet.tsx            # EXISTING: No changes needed
    useMediaQuery.ts           # EXISTING: No changes needed
    useUrlNodeState.ts         # NEW: Hook for bidirectional URL <-> selectedNode sync
  lib/ai-landscape/
    graph-navigation.ts        # NEW: Adjacency map builder, nearest-neighbor-in-direction, keyboard nav helpers
    schema.ts                  # EXISTING: No changes needed
    ancestry.ts                # EXISTING: No changes needed
    graph-data.ts              # EXISTING: No changes needed
    routes.ts                  # EXISTING: No changes needed
  pages/ai-landscape/
    index.astro                # EXISTING: No changes (InteractiveGraph already mounted)
```

### Pattern 1: Search Autocomplete with Zoom-to-Node
**What:** A controlled `<input>` renders above the graph. As the user types, a dropdown shows filtered node names (case-insensitive `includes` match). Selecting a result calls `onSelect(node)` which sets `selectedNode` and triggers `zoomToNode`.
**When to use:** NAV-01 requirement.
**Why this way:** 51 items is too small for async search or fuzzy matching. A synchronous filter on every keystroke with a simple dropdown is O(N) where N=51, which is imperceptible. The dropdown is a `<ul role="listbox">` with `aria-activedescendant` tracking for keyboard navigation within the search results.
**Example:**
```typescript
// SearchBar.tsx
interface SearchBarProps {
  nodes: AiNode[];
  onSelect: (node: AiNode) => void;
}

export function SearchBar({ nodes, onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return nodes.filter((n) =>
      n.name.toLowerCase().includes(q)
    ).slice(0, 8); // Cap visible results
  }, [nodes, query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      onSelect(filtered[activeIndex]);
      setQuery('');
      setIsOpen(false);
    } else if (e.key === 'Escape') {
      setQuery('');
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <input
        type="search"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setIsOpen(true); setActiveIndex(-1); }}
        onKeyDown={handleKeyDown}
        onFocus={() => query && setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        placeholder="Search concepts..."
        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
        role="combobox"
        aria-expanded={isOpen && filtered.length > 0}
        aria-controls="search-listbox"
        aria-activedescendant={activeIndex >= 0 ? `search-option-${activeIndex}` : undefined}
      />
      {isOpen && filtered.length > 0 && (
        <ul id="search-listbox" role="listbox" className="absolute z-20 mt-1 w-full rounded-lg border ...">
          {filtered.map((node, i) => (
            <li
              key={node.id}
              id={`search-option-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={() => { onSelect(node); setQuery(''); setIsOpen(false); }}
              className={i === activeIndex ? 'bg-[var(--color-accent)]/10' : ''}
            >
              {node.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Pattern 2: Programmatic Zoom-to-Node
**What:** Given a node's (x, y) position from `posMap`, compute a d3-zoom transform that centers that node in the SVG viewport at ~2x scale, then animate to it.
**When to use:** NAV-01 (search select) and SEO-05 (deep link restore).
**Why this way:** d3-zoom's `zoomIdentity.translate(tx, ty).scale(k)` creates a transform that positions any point at the viewport center. The existing `resetZoom` callback already demonstrates this pattern with `zoomIdentity` (scale 1, no offset). Zoom-to-node extends it with a computed transform.
**Example:**
```typescript
// In InteractiveGraph.tsx
const zoomToNode = useCallback((nodeId: string) => {
  const svg = svgRef.current;
  const zoomBehavior = zoomRef.current;
  const pos = posMap.get(nodeId);
  if (!svg || !zoomBehavior || !pos) return;

  const svgWidth = meta.width;
  const svgHeight = meta.height;
  const scale = 2; // Zoom level when focusing on a node

  // Compute transform that centers (pos.x, pos.y) in the viewport
  const tx = svgWidth / 2 - scale * pos.x;
  const ty = svgHeight / 2 - scale * pos.y;
  const newTransform = zoomIdentity.translate(tx, ty).scale(scale);

  select(svg)
    .transition()
    .duration(750)
    .call(zoomBehavior.transform, newTransform);
}, [posMap, meta.width, meta.height]);
```

### Pattern 3: URL State Synchronization (Deep Links)
**What:** A custom hook that reads `?node=slug` from the URL on mount and syncs `selectedNode` changes back to the URL via `history.replaceState`. On `popstate` events (browser back/forward), the hook updates the selected node.
**When to use:** SEO-05 requirement.
**Why this way:** The AI landscape graph is a `client:only="react"` island. There's no SSR to worry about -- `window.location` is always available. `replaceState` avoids polluting browser history. The `popstate` listener handles back/forward navigation if the user uses `pushState` elsewhere or if the behavior is changed later.
**Example:**
```typescript
// useUrlNodeState.ts
export function useUrlNodeState(
  nodeMap: Map<string, AiNode>,
): {
  initialNodeSlug: string | null;
  syncToUrl: (slug: string | null) => void;
} {
  const initialNodeSlug = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('node');
    return slug && nodeMap.has(slug) ? slug : null;
  }, []); // Only read on mount

  const syncToUrl = useCallback((slug: string | null) => {
    const url = new URL(window.location.href);
    if (slug) {
      url.searchParams.set('node', slug);
    } else {
      url.searchParams.delete('node');
    }
    history.replaceState(null, '', url.toString());
  }, []);

  return { initialNodeSlug, syncToUrl };
}
```

### Pattern 4: Keyboard Navigation via Adjacency Map
**What:** Build a bidirectional adjacency map from the edges array. On arrow key press, find the neighbor of the currently focused node that is closest in the pressed direction. Focus moves without selecting; Enter commits the selection.
**When to use:** SEO-06 requirement.
**Why this way:** The graph's spatial layout (pre-computed positions) maps naturally to directional arrow keys. Up/Down/Left/Right correspond to the relative position of neighbors. An adjacency map provides O(1) neighbor lookup. The "nearest in direction" algorithm scores each neighbor by how well its angle from the current node matches the arrow key direction (0/90/180/270 degrees).

**Adjacency map builder:**
```typescript
// graph-navigation.ts
export type AdjacencyMap = Map<string, Set<string>>;

export function buildAdjacencyMap(edges: Edge[]): AdjacencyMap {
  const adj: AdjacencyMap = new Map();
  for (const edge of edges) {
    if (!adj.has(edge.source)) adj.set(edge.source, new Set());
    if (!adj.has(edge.target)) adj.set(edge.target, new Set());
    adj.get(edge.source)!.add(edge.target);
    adj.get(edge.target)!.add(edge.source);
  }
  return adj;
}
```

**Direction-aware neighbor selection:**
```typescript
export function nearestNeighborInDirection(
  currentId: string,
  direction: 'up' | 'down' | 'left' | 'right',
  adjacencyMap: AdjacencyMap,
  posMap: Map<string, { x: number; y: number }>,
): string | null {
  const neighbors = adjacencyMap.get(currentId);
  const currentPos = posMap.get(currentId);
  if (!neighbors || !currentPos) return null;

  // Direction vectors: up = -90deg, right = 0deg, down = 90deg, left = 180deg
  const targetAngle = { up: -Math.PI / 2, down: Math.PI / 2, left: Math.PI, right: 0 }[direction];

  let bestId: string | null = null;
  let bestScore = -Infinity;

  for (const neighborId of neighbors) {
    const pos = posMap.get(neighborId);
    if (!pos) continue;

    const dx = pos.x - currentPos.x;
    const dy = pos.y - currentPos.y;
    const angle = Math.atan2(dy, dx);

    // Score: cosine similarity between desired direction and actual direction
    // Higher score = better alignment with desired direction
    const score = Math.cos(angle - targetAngle);

    // Only consider neighbors generally in the right direction (score > 0 = within 90 degrees)
    if (score > 0 && score > bestScore) {
      bestScore = score;
      bestId = neighborId;
    }
  }

  return bestId;
}
```

**Keyboard handler in InteractiveGraph:**
```typescript
const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
  const current = focusedNodeId || selectedNode?.id;
  if (!current) {
    // If nothing focused/selected, Tab focuses first node
    if (e.key === 'Tab') {
      e.preventDefault();
      setFocusedNodeId(nodes[0].id);
    }
    return;
  }

  switch (e.key) {
    case 'ArrowUp':
    case 'ArrowDown':
    case 'ArrowLeft':
    case 'ArrowRight': {
      e.preventDefault();
      const dir = e.key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right';
      const next = nearestNeighborInDirection(current, dir, adjacencyMap, posMap);
      if (next) {
        setFocusedNodeId(next);
        zoomToNode(next); // Smooth zoom to keep focused node visible
      }
      break;
    }
    case 'Enter': {
      e.preventDefault();
      const node = nodeMap.get(focusedNodeId ?? '');
      if (node) {
        setSelectedNode(node);
        zoomToNode(node.id);
      }
      break;
    }
    case 'Escape': {
      e.preventDefault();
      setSelectedNode(null);
      setFocusedNodeId(null);
      setHighlightedNodeIds(new Set());
      break;
    }
    case 'Tab': {
      e.preventDefault();
      // Cycle through all nodes alphabetically
      const sortedIds = nodes.map((n) => n.id).sort();
      const currentIdx = sortedIds.indexOf(current);
      const nextIdx = e.shiftKey
        ? (currentIdx - 1 + sortedIds.length) % sortedIds.length
        : (currentIdx + 1) % sortedIds.length;
      setFocusedNodeId(sortedIds[nextIdx]);
      break;
    }
  }
}, [focusedNodeId, selectedNode, nodes, adjacencyMap, posMap, nodeMap, zoomToNode]);
```

### Pattern 5: Focus Ring vs Selection Ring (Visual Distinction)
**What:** The focused node (keyboard cursor) gets a dashed ring (visual keyboard focus indicator). The selected node (panel open) keeps the existing solid accent ring from Phase 106. A node can be both focused and selected.
**When to use:** SEO-06 requirement -- visual distinction between keyboard focus and active selection.
**Why this way:** Users need to see where their keyboard cursor is (focus) separately from which node's panel is open (selection). The dashed ring is a standard keyboard focus indicator pattern. The solid ring already exists from Phase 106 for selection.
**Example:**
```typescript
// In the node rendering loop, alongside the existing selection ring:
{focusedNodeId === node.id && !isSelected && (
  <circle
    cx={pos.x}
    cy={pos.y}
    r={r + 4}
    fill="none"
    stroke="var(--color-accent)"
    strokeWidth={2}
    strokeDasharray="4 3"
  />
)}
```

### Anti-Patterns to Avoid
- **Using `pushState` for every node selection:** Creates a history entry per click, making the back button unusable. Use `replaceState` for state changes within the same page view.
- **Adding a client-side router:** This is a single Astro page with query parameters. A router adds complexity, bundle size, and conflicts with Astro's static routing.
- **Fuzzy search for 51 items:** Adding fuse.js or similar for 51 items is over-engineering. Simple `includes()` with case normalization works perfectly. Users typing "LLM" or "language" will find what they need.
- **Using `window.onkeydown` globally:** Keyboard events should be scoped to the SVG element (or its container). Global listeners would conflict with other page elements (search input, detail panel scrolling, site navigation).
- **Tracking focus only via CSS `:focus`:** SVG circles can't natively receive focus. The focus state must be tracked in React state and rendered as a visual indicator. The SVG container element gets `tabIndex={0}` and `onKeyDown` -- focus is "virtual" within the graph.
- **Storing full node object in URL:** Only store the slug in the URL (`?node=large-language-models`). Reconstruct the full node from the slug via `nodeMap` on load.
- **Using `popstate` + `pushState` together carelessly:** If using `replaceState`, `popstate` only fires when the user navigates using back/forward buttons to a different history entry. Be deliberate about when to use `pushState` (never in this phase) vs `replaceState` (on every selection change).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Programmatic zoom animation | Manual `requestAnimationFrame` loop interpolating transform values | d3-zoom's `select(svg).transition().duration(750).call(zoomBehavior.transform, newTransform)` | d3-zoom provides smooth easing, interruptible transitions, and keeps internal state consistent. Manual animation would desync the zoom state. |
| URL query parameter parsing | Manual `window.location.search.split('&')` string manipulation | `new URLSearchParams(window.location.search)` | URLSearchParams handles encoding, multiple params, edge cases (empty values, `+` as space). Browser-native, zero-dependency. |
| Combobox ARIA pattern | Custom aria-* attributes sprinkled ad-hoc | Follow WAI-ARIA Combobox pattern: `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, `role="listbox"`, `role="option"` | The combobox pattern is well-specified by WAI-ARIA. Following it exactly ensures screen reader compatibility. |
| Adjacency map from edges | Recomputing neighbors on every key press by filtering edges | Pre-built `Map<string, Set<string>>` via `useMemo` on `edges` | The adjacency map is O(E) to build once and O(1) to query. Filtering edges on every keypress is O(E) per press, which is 66 iterations but also harder to reason about. |
| Concept URL for deep links | Hardcoded `'/ai-landscape/?node=' + slug` | `new URL(window.location.href)` + `url.searchParams.set('node', slug)` + `url.toString()` | URL constructor handles encoding, existing params, trailing slashes, and edge cases. String concatenation risks double-slash or missing-slash bugs. |

**Key insight:** This phase adds four orthogonal features (search, URL state, keyboard nav, zoom-to-node) that all converge on the same state management point: `selectedNode` + `focusedNodeId` in `InteractiveGraph.tsx`. The complexity is in the coordination, not the individual features.

## Common Pitfalls

### Pitfall 1: Zoom-to-Node Transform Calculation Ignores SVG viewBox Scaling
**What goes wrong:** The zoom transform centers the node in the SVG's internal coordinate system (1200x900) but the SVG is displayed at a different pixel size due to CSS `w-full h-auto`. The node appears off-center or at the wrong zoom level on different viewport widths.
**Why it happens:** `meta.width` and `meta.height` (1200, 900) define the SVG viewBox, not the rendered pixel dimensions. The d3-zoom transform operates in viewBox coordinates, so the centering calculation `svgWidth/2 - scale * pos.x` must use viewBox dimensions, not element pixel dimensions.
**How to avoid:** Always use `meta.width` and `meta.height` (the viewBox dimensions) for the zoom transform calculation, NOT `svgRef.current.clientWidth`. The viewBox-to-pixel mapping is handled automatically by the browser's SVG renderer. The d3-zoom transform is in viewBox space.
**Warning signs:** Node is off-center after zoom, especially on mobile or narrow viewports; zoom level feels wrong.

### Pitfall 2: Search Input Steals Focus from Graph Keyboard Navigation
**What goes wrong:** User navigates the graph with arrow keys, then can't get back to keyboard navigation after using the search bar. Or: typing in the search bar triggers graph keyboard shortcuts.
**Why it happens:** The graph's `onKeyDown` handler is on the SVG container. When the search input has focus, keyboard events go to the input, not the graph. When the graph has focus, typing triggers arrow key handlers instead of search input.
**How to avoid:** Clear separation of keyboard contexts. The search input handles its own arrow keys (for dropdown navigation) and Enter (for selection). The graph SVG container handles arrow keys, Enter, Escape, and Tab ONLY when it has focus. After search selects a node, explicitly move focus back to the SVG container (`svgRef.current?.focus()` or container element focus). The search input's Escape key should blur the input and return focus to the graph.
**Warning signs:** Arrow keys control search dropdown when user expects graph navigation; typing "a" in search triggers no result because keydown event is captured by graph handler.

### Pitfall 3: Deep Link Restore Fires Before Component Mounts
**What goes wrong:** `useUrlNodeState` reads `?node=slug` and tries to set `selectedNode`, but `posMap`, `nodeMap`, or `zoomRef` aren't ready yet, causing zoom-to-node to fail silently.
**Why it happens:** In `client:only="react"` components, the initial render has all props available (Astro serializes them). But `zoomRef.current` is set in a `useEffect` (async), so it's `null` during the first render cycle. `posMap` and `nodeMap` are `useMemo` and available immediately.
**How to avoid:** Separate URL reading from zoom animation. Read the `?node=slug` in an early `useMemo` (synchronous, available on first render). Set `selectedNode` in a `useEffect` that also checks `zoomRef.current` is initialized. If zoom isn't ready yet, queue the zoom for the next effect cycle. Alternatively, chain effects: (1) d3-zoom setup effect, (2) initial URL restore effect with a dependency on zoomRef being set.
**Warning signs:** Visiting a deep link URL shows the correct panel but the graph is not zoomed to the node; a manual click then works fine.

### Pitfall 4: Arrow Key Navigation Gets Stuck in Dead Ends
**What goes wrong:** User arrow-keys to a leaf node (e.g., "Expert Systems" which has only 1 edge). Pressing arrow keys in most directions returns `null` from `nearestNeighborInDirection` because no neighbor exists in that direction. The focus appears frozen.
**Why it happens:** Leaf nodes in the graph may have only 1-2 neighbors, and those neighbors may not be positioned in the direction of the pressed arrow key.
**How to avoid:** When `nearestNeighborInDirection` returns `null` for the direct direction, fall back to the nearest neighbor in any direction. Or: use a relaxed angle threshold (e.g., 120 degrees instead of 90). Always ensure a key press produces movement if any neighbor exists. If the node has zero neighbors (disconnected -- not possible in this dataset but guard anyway), do nothing.
**Warning signs:** Focus gets stuck on certain nodes; user presses arrow keys with no visible response.

### Pitfall 5: URL State Sync Creates Infinite Update Loop
**What goes wrong:** Setting `selectedNode` from URL triggers `syncToUrl`, which is called from an effect that depends on `selectedNode`, creating an infinite loop.
**Why it happens:** Two-way binding between URL and state without a guard to distinguish "URL changed -> update state" from "state changed -> update URL".
**How to avoid:** Use a `skipUrlSync` ref flag. When restoring from URL, set the flag before updating state, and check it in the URL sync effect. Clear the flag after the sync. Alternatively, only sync URL on explicit user actions (click, search select, keyboard Enter), never in a generic "selectedNode changed" effect.
**Warning signs:** Page freezes on load; `history.replaceState` called thousands of times in console; "Maximum update depth exceeded" React error.

### Pitfall 6: Tab Key Conflicts with Browser Default Tab Behavior
**What goes wrong:** Pressing Tab while the graph has focus moves focus to the next page element (the detail panel's close button, the legend, etc.) instead of cycling through graph nodes.
**Why it happens:** The browser's default Tab behavior moves focus between focusable elements in the DOM. The graph SVG is a single focusable element from the browser's perspective. The "Tab to cycle nodes" feature requires `e.preventDefault()` to override this.
**How to avoid:** Call `e.preventDefault()` on Tab keydown when the graph SVG has focus. This traps Tab within the graph. Provide an explicit "escape hatch" -- Escape key releases focus from the graph, allowing normal Tab navigation to resume. Document this in a visually hidden instruction or aria-description on the SVG.
**Warning signs:** Tab key does nothing visible; screen reader users can't escape the graph to reach other page content.

## Code Examples

### Zoom-to-Node with d3-zoom (verified pattern from existing codebase)
```typescript
// Source: Extension of existing resetZoom pattern in InteractiveGraph.tsx (lines 138-146)
// Uses same d3-zoom API: select(svg).transition().call(zoomBehavior.transform, transform)

const zoomToNode = useCallback((nodeId: string) => {
  const svg = svgRef.current;
  const zoomBehavior = zoomRef.current;
  const pos = posMap.get(nodeId);
  if (!svg || !zoomBehavior || !pos) return;

  // Use viewBox dimensions (1200x900) -- NOT element pixel dimensions
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

### URL State Hook (based on project's established history.replaceState pattern)
```typescript
// Source: Pattern from src/components/tools/results/ShareActions.tsx (line 56)
// Adapts history.replaceState for node selection state

import { useMemo, useCallback } from 'react';
import type { AiNode } from '../../lib/ai-landscape/schema';

export function useUrlNodeState(
  nodeMap: Map<string, AiNode>,
): {
  initialNodeSlug: string | null;
  syncToUrl: (slug: string | null) => void;
} {
  const initialNodeSlug = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('node');
    // Validate slug exists in the dataset
    return slug && nodeMap.has(slug) ? slug : null;
  }, [nodeMap]);

  const syncToUrl = useCallback((slug: string | null) => {
    const url = new URL(window.location.href);
    if (slug) {
      url.searchParams.set('node', slug);
    } else {
      url.searchParams.delete('node');
    }
    history.replaceState(null, '', url.toString());
  }, []);

  return { initialNodeSlug, syncToUrl };
}
```

### ARIA Combobox Search Pattern
```typescript
// Source: WAI-ARIA Authoring Practices - Combobox Pattern
// Key attributes for the search autocomplete

<input
  type="search"
  role="combobox"
  aria-expanded={isOpen && filtered.length > 0}
  aria-controls="search-listbox"
  aria-activedescendant={activeIndex >= 0 ? `search-option-${activeIndex}` : undefined}
  aria-autocomplete="list"
  aria-label="Search AI landscape concepts"
/>
<ul
  id="search-listbox"
  role="listbox"
  aria-label="Search results"
>
  {filtered.map((node, i) => (
    <li
      key={node.id}
      id={`search-option-${i}`}
      role="option"
      aria-selected={i === activeIndex}
    >
      {node.name}
    </li>
  ))}
</ul>
```

### SVG Keyboard Focus Setup
```typescript
// Source: ARIA best practices for custom interactive widgets

// SVG container needs tabIndex to receive keyboard focus
<svg
  ref={svgRef}
  tabIndex={0}
  onKeyDown={handleKeyDown}
  role="application"
  aria-label="Interactive AI Landscape graph. Use arrow keys to navigate between connected concepts, Enter to select, Escape to deselect, Tab to cycle through all concepts."
  aria-activedescendant={focusedNodeId ? `node-${focusedNodeId}` : undefined}
>
  {/* Each node group gets an id for aria-activedescendant */}
  <g id={`node-${node.id}`} role="treeitem" aria-label={node.name}>
    ...
  </g>
</svg>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hash fragments (`#node-llm`) | Query parameters (`?node=llm`) | Modern web apps (2018+) | Query params are more flexible (support multiple params), work with `URLSearchParams`, and are preserved across full page reloads. Hash fragments are only accessible client-side. |
| `window.onhashchange` for state sync | `URLSearchParams` + `history.replaceState` | History API matured (2015+) | Full control over URL without page reload. `replaceState` avoids polluting history. |
| Global keyboard event listeners | Scoped `onKeyDown` on focusable container elements | React synthetic events (always) | Prevents keyboard shortcut conflicts between components. Events are automatically cleaned up. |
| Custom fuzzy search implementations | Browser-native `includes()` + custom sort for small datasets | N/A (scale-dependent) | For datasets under ~200 items, a simple substring match with alphabetical sort is indistinguishable from fuzzy search in UX. Fuzzy search shines at 1000+ items. |

**Deprecated/outdated:**
- `window.addListener()` on MediaQueryList: Use `addEventListener('change', ...)` instead
- HTML `<datalist>` for styled autocomplete: Browser implementations still vary wildly (Chrome shows differently than Firefox/Safari). Custom dropdowns preferred for design consistency.
- `onkeypress` event: Deprecated. Use `onkeydown` for all keyboard handling.

## Open Questions

1. **Should arrow keys zoom to the focused node, or just move the focus ring?**
   - What we know: The search select zooms to the node. The success criteria says "arrow keys traverse edges between nodes." It does not explicitly mention zooming on each arrow press.
   - What's unclear: If the graph is zoomed out and the user arrow-keys, the focus ring might be invisible because the focused node is off-screen.
   - Recommendation: Auto-pan (not zoom) to keep the focused node visible. If the focused node is outside the current viewport, smoothly pan to center it without changing the zoom level. This is less jarring than zooming on every arrow press. **Planner's discretion.**

2. **Should Escape key close the panel AND deselect, or just close the panel?**
   - What we know: The success criteria says "Escape deselects." Current Phase 106 implementation: `handleClosePanel` sets `selectedNode` to null and clears `highlightedNodeIds`.
   - What's unclear: Whether "deselects" means closing the panel or also clearing the focus ring and URL state.
   - Recommendation: Escape should close the panel, deselect the node, clear the focus ring, clear the URL `?node=` param, and clear ancestry highlights. Full reset. This matches user expectation of "get me out of this state." **Planner's discretion.**

3. **Should deep link restoration show a brief loading state?**
   - What we know: The zoom-to-node animation takes 750ms. During this time the user sees the full graph briefly before it zooms.
   - What's unclear: Whether the brief flash of the full graph is acceptable UX for deep link visitors.
   - Recommendation: Accept the brief flash. The graph renders at its default zoom, then animates to the target node in 750ms. This is a natural "reveal" effect. A loading spinner would feel slower and more jarring than the animation. **Low priority concern.**

4. **NAV-02 responsive requirements overlap with Phase 106**
   - What we know: Phase 106 already implemented the mobile bottom sheet and desktop side panel. NAV-02 says "full-width graph on mobile, detail as bottom sheet." This is already done. The success criterion adds "a readable experience at 350px width."
   - What's unclear: Whether "readable at 350px" requires new work or is already satisfied by the responsive SVG viewBox.
   - Recommendation: Verify the existing layout at 350px width. If the graph is too cramped, adjust the search bar layout (stack vertically) and potentially the side panel width on narrow desktops. The SVG viewBox scales automatically. **Test and verify rather than pre-building responsive adjustments.**

## Sources

### Primary (HIGH confidence)
- **Codebase inspection** -- All findings verified by reading actual source files:
  - `src/components/ai-landscape/InteractiveGraph.tsx` (442 lines, current implementation with d3-zoom, selection state, zoom patterns)
  - `src/components/ai-landscape/DetailPanel.tsx` (138 lines, panel content structure)
  - `src/components/ai-landscape/BottomSheet.tsx` (57 lines, mobile sheet implementation)
  - `src/components/ai-landscape/useMediaQuery.ts` (26 lines, responsive hook)
  - `src/lib/ai-landscape/schema.ts` (AiNode with slug/id, Edge types, groupRelationshipsByType)
  - `src/lib/ai-landscape/routes.ts` (conceptUrl, AI_LANDSCAPE_BASE)
  - `src/lib/ai-landscape/graph-data.ts` (GraphProps, constants)
  - `src/lib/ai-landscape/ancestry.ts` (buildAncestryChain)
  - `src/lib/ai-landscape/layout-schema.ts` (LayoutPosition, LayoutMeta -- viewBox 1200x900)
  - `src/pages/ai-landscape/index.astro` (React island mount, data pipeline)
  - `src/pages/ai-landscape/[slug].astro` (concept page slug format)
  - `src/components/tools/results/ShareActions.tsx` (history.replaceState URL update pattern)
  - `src/data/ai-landscape/nodes.json` (51 nodes, all id===slug confirmed)
  - `src/data/ai-landscape/graph.json` (66 edges, 9 clusters, 10 edge types)
  - `src/data/ai-landscape/layout.json` (51 positions, meta: 1200x900)
  - `astro.config.mjs` (trailingSlash: 'always', output: 'static')
  - `package.json` (all dependencies verified)
  - `.planning/phases/106-detail-panel-node-selection/106-RESEARCH.md` (Phase 106 patterns and decisions)
  - `.planning/phases/106-detail-panel-node-selection/106-VERIFICATION.md` (Phase 106 verification results)
  - `.planning/phases/105-interactive-graph-core/105-01-SUMMARY.md` (d3-zoom patterns established)

### Secondary (MEDIUM confidence)
- WAI-ARIA Authoring Practices -- Combobox pattern (role="combobox", aria-expanded, aria-activedescendant) -- well-established standard
- d3-zoom programmatic transform API (`zoomIdentity.translate(tx, ty).scale(k)`) -- verified against existing `resetZoom` usage in InteractiveGraph.tsx
- `history.replaceState` behavior with `URLSearchParams` -- verified against existing ShareActions implementation

### Tertiary (LOW confidence)
- None. All findings verified against codebase or established web standards.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No new dependencies. All libraries already installed and used. Patterns verified against existing codebase implementations.
- Architecture: HIGH -- Four features (search, URL state, keyboard nav, zoom-to-node) are well-understood React patterns. The coordination point (InteractiveGraph state) is already established. New files follow existing conventions.
- Pitfalls: HIGH -- Zoom transform calculation, keyboard focus management, URL state sync loops, and search/graph focus conflicts are all documented patterns with known solutions. Each has been verified against the specific codebase constraints.
- Data layer: HIGH -- All 51 node slugs verified, all positions confirmed, edge adjacency is computable from existing data. No new data sources needed.

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable -- no external dependencies, all patterns are project-internal)
