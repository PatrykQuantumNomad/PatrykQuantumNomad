# Phase 36: Results Panel & Dependency Graph - Research

**Researched:** 2026-02-22
**Domain:** React results UI components, CodeMirror annotations, React Flow graph visualization, lazy loading
**Confidence:** HIGH

## Summary

Phase 36 transforms the stub `ComposeResultsPanel` into a fully functional tabbed results panel with score gauge, category breakdown, severity-grouped violation list, click-to-navigate, empty state, and an interactive dependency graph. The project already has all the foundation pieces in place: the dockerfile-analyzer's shared `ScoreGauge`, `CategoryBreakdown`, and `ViolationList` components at `src/components/tools/results/`, the `highlightAndScroll` utility from `highlight-line.ts`, the `composeEditorViewRef` nanostore for cross-panel communication, and the `buildDependencyGraph`/`detectCycles` functions in `graph-builder.ts`. The existing inline CodeMirror annotations (squiggly underlines + gutter markers) are already working from Phase 35's `setDiagnostics` + `lintGutter()` + `editor-theme.ts` styling.

The primary new work is: (1) refactoring `ComposeResultsPanel` from a stub to a tabbed panel that reuses existing shared components with compose-specific type adapters, (2) building the dependency graph tab with React Flow v12 (`@xyflow/react`), dagre layout, custom service nodes, condition-labeled edges, and cycle highlighting, and (3) lazy-loading the React Flow bundle to maintain Lighthouse 90+ performance.

**Primary recommendation:** Reuse existing shared result components (`ScoreGauge`, `CategoryBreakdown`, `ViolationList`) with thin type adapters rather than building new compose-specific versions. Lazy-load the entire dependency graph tab (React Flow + dagre) via `React.lazy()` with a `Suspense` fallback.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RESULT-01 | Inline CodeMirror annotations (squiggly underlines + gutter severity markers) | Already implemented in Phase 35 via `setDiagnostics` + `lintGutter()` + `editor-theme.ts` severity styling. Verify only. |
| RESULT-02 | Score gauge component (SVG circular gauge with letter grade) | Reuse existing `ScoreGauge` from `src/components/tools/results/ScoreGauge.tsx`. Already tool-agnostic (accepts `score`, `grade`, `size` props). |
| RESULT-03 | Category breakdown panel with sub-scores per dimension | Adapt existing `CategoryBreakdown` from `src/components/tools/results/CategoryBreakdown.tsx`. Needs compose category labels/colors (different from dockerfile categories). |
| RESULT-04 | Violation list grouped by severity with expandable details | Reuse existing `ViolationList` from `src/components/tools/results/ViolationList.tsx`. Needs compose-specific type adapter and rule link path adjustment. |
| RESULT-05 | Click-to-navigate from results panel to corresponding editor line | Use existing `highlightAndScroll` from `highlight-line.ts` + `composeEditorViewRef` nanostore (already created in Phase 35). |
| RESULT-06 | Clean compose file empty state ("No issues found" with congratulatory message) | Create compose-specific `ComposeEmptyState` modeled on existing `EmptyState` component. |
| RESULT-07 | Tabbed results panel -- Violations tab and Dependency Graph tab | Build tab UI in `ComposeResultsPanel`. State managed locally (not nanostore). |
| GRAPH-01 | Interactive service dependency graph using React Flow with dagre layout | `@xyflow/react` v12.x + `@dagrejs/dagre` 2.x. Use `buildDependencyGraph` from `graph-builder.ts` as data source. |
| GRAPH-02 | Service nodes with name, image, and port summary | Custom React Flow node component extracting data from parsed YAML JSON. |
| GRAPH-03 | Directed edges for depends_on relationships with condition labels | Custom edge component using `EdgeLabelRenderer` + `BaseEdge`. Edge data from `DependencyEdge.condition`. |
| GRAPH-04 | Cycle detection with red-highlighted cycle edges | Use existing `detectCycles` from `graph-builder.ts`. Apply red stroke to edges between `cycleParticipants`. |
| GRAPH-05 | Network membership color-coding on nodes | Derive network membership from parsed `services` map. Assign colors per network. |
| GRAPH-06 | Zoom, pan, and drag interaction controls | React Flow provides this out-of-the-box via `<Controls />` and `<Background />` components. |
| GRAPH-07 | React Flow lazy-loaded to maintain Lighthouse 90+ performance | `React.lazy(() => import('./DependencyGraph'))` + `<Suspense>` fallback. CSS imported inside lazy component. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@xyflow/react` | 12.x (latest 12.10.1) | Interactive node-based graph UI | Standard for React graph visualization. 25K+ GitHub stars, MIT licensed, built-in pan/zoom/drag. Renamed from `reactflow`. |
| `@dagrejs/dagre` | 2.x (latest 2.0.4) | Hierarchical graph layout algorithm | React Flow recommended layout engine for tree/DAG graphs. ~30-40 KB gzip. Simple synchronous API. |
| `react` | 19.x (already installed) | UI framework | Already in project |
| `@nanostores/react` | 1.x (already installed) | Nanostore bindings for React | Already in project, used by ComposeEditorPanel |
| `nanostores` | 1.x (already installed) | State management | Already in project |

### Supporting (already installed, no new deps needed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@codemirror/lint` | 6.x | `setDiagnostics`, `lintGutter` | Already used in Phase 35 for inline annotations |
| `@codemirror/view` | 6.x | `EditorView`, effects, state fields | Already used for highlight-line |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@dagrejs/dagre` | `elkjs` | elkjs produces better layouts but is 1.4 MB gzip (35x larger). Overkill for 5-30 node compose graphs. |
| `@xyflow/react` | D3.js force layout | Would need to build all interaction (zoom, pan, drag, selection) from scratch. React Flow provides this built-in. |
| `@xyflow/react` | Mermaid.js | Static rendering only, no interactive pan/zoom/click. Not suitable for tool integration. |

**Installation:**
```bash
npm install @xyflow/react @dagrejs/dagre
```

Note: `@xyflow/react` has peer dependencies on `react` (>=17) and `react-dom` (>=17), both already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/tools/
    ComposeResultsPanel.tsx     # Refactored: tabbed panel (Violations | Graph)
    ComposeEditorPanel.tsx      # Existing (Phase 35) -- no changes needed
    ComposeValidator.tsx        # Existing (Phase 35) -- no changes needed
    compose-results/
      ComposeEmptyState.tsx     # "No issues found" congratulatory state
      ComposeViolationList.tsx  # Thin wrapper adapting ViolationList for compose types
      ComposeCategoryBreakdown.tsx  # Thin wrapper with compose category labels/colors
      DependencyGraph.tsx       # Lazy-loaded React Flow graph (GRAPH-01 through GRAPH-06)
      ServiceNode.tsx           # Custom React Flow node for service display
      DependencyEdge.tsx        # Custom React Flow edge with condition labels
      GraphSkeleton.tsx         # Suspense fallback skeleton
    results/
      ScoreGauge.tsx            # Shared (already exists) -- no changes
      CategoryBreakdown.tsx     # Shared (already exists) -- no changes
      ViolationList.tsx         # Shared (already exists) -- no changes
      EmptyState.tsx            # Shared (already exists) -- no changes
  stores/
    composeValidatorStore.ts    # Existing -- already has composeEditorViewRef
  lib/tools/compose-validator/
    graph-builder.ts            # Existing -- buildDependencyGraph, detectCycles
    graph-data-extractor.ts     # NEW: extracts image, ports, networks for graph nodes
```

### Pattern 1: Tabbed Results Panel with Local State
**What:** Tab state managed with `useState` (not nanostore) since it's purely UI-local. Active tab switches between violations view and graph view.
**When to use:** When state is component-local and doesn't need cross-component sharing.
**Example:**
```typescript
// Source: Project pattern (ComposeResultsPanel refactoring)
type ResultTab = 'violations' | 'graph';

export default function ComposeResultsPanel() {
  const [activeTab, setActiveTab] = useState<ResultTab>('violations');
  const result = useStore(composeResult);
  // ...
  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b border-[var(--color-border)]">
        <button
          onClick={() => setActiveTab('violations')}
          className={activeTab === 'violations' ? 'active-tab' : 'inactive-tab'}
        >
          Violations
        </button>
        <button
          onClick={() => setActiveTab('graph')}
          className={activeTab === 'graph' ? 'active-tab' : 'inactive-tab'}
        >
          Dependency Graph
        </button>
      </div>
      {/* Tab content */}
      {activeTab === 'violations' ? (
        <ViolationsContent result={result} />
      ) : (
        <Suspense fallback={<GraphSkeleton />}>
          <LazyDependencyGraph result={result} />
        </Suspense>
      )}
    </div>
  );
}
```

### Pattern 2: Lazy-Loaded React Flow with Suspense
**What:** The entire `DependencyGraph` component (including React Flow + dagre + CSS) is loaded only when the Graph tab is activated. This keeps the initial page bundle free of the ~120-140 KB React Flow overhead.
**When to use:** Always -- GRAPH-07 requires Lighthouse 90+.
**Example:**
```typescript
// Source: React docs + project PITFALLS.md research
import { lazy, Suspense } from 'react';

const LazyDependencyGraph = lazy(() => import('./compose-results/DependencyGraph'));

// Usage in ComposeResultsPanel:
{activeTab === 'graph' && (
  <Suspense fallback={<GraphSkeleton />}>
    <LazyDependencyGraph result={result} />
  </Suspense>
)}
```

### Pattern 3: Dagre Layout with React Flow Nodes
**What:** Convert the existing `DependencyGraph` data structure (from `graph-builder.ts`) into React Flow nodes/edges, then run dagre layout to position them.
**When to use:** Every time the graph tab renders with new analysis results.
**Example:**
```typescript
// Source: React Flow dagre example (reactflow.dev/examples/layout/dagre)
import dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/react';

const NODE_WIDTH = 220;
const NODE_HEIGHT = 80;

function layoutGraph(
  rfNodes: Node[],
  rfEdges: Edge[],
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 100 });

  rfNodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  rfEdges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = rfNodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
    };
  });

  return { nodes: layoutedNodes, edges: rfEdges };
}
```

### Pattern 4: Click-to-Navigate from ViolationList to Editor
**What:** Read the `composeEditorViewRef` nanostore to get the `EditorView`, then call `highlightAndScroll` to jump the editor to the violation's line.
**When to use:** When user clicks a line number in the violation list.
**Example:**
```typescript
// Source: Existing pattern in dockerfile-analyzer ResultsPanel.tsx
import { highlightAndScroll } from '../../lib/tools/dockerfile-analyzer/highlight-line';
import { composeEditorViewRef } from '../../stores/composeValidatorStore';

const handleNavigate = (line: number) => {
  const view = composeEditorViewRef.get();
  if (!view) return;
  highlightAndScroll(view, line);
};

// Pass to ViolationList:
<ViolationList violations={violations} onNavigate={handleNavigate} />
```

### Pattern 5: Type Adapters for Shared Components
**What:** The shared `ViolationList` and `CategoryBreakdown` accept Dockerfile-typed props. Compose uses different types (`ComposeLintViolation`, `ComposeCategoryScore`). Rather than making shared components generic (breaking existing Dockerfile usage), create thin compose-specific wrappers that map compose types to the shared component's expected shape.
**When to use:** When reusing shared components across different tools with different type hierarchies.
**Example:**
```typescript
// ComposeCategoryBreakdown.tsx - maps compose categories to shared component
import { CategoryBreakdown } from '../results/CategoryBreakdown';
import type { ComposeCategoryScore } from '../../../lib/tools/compose-validator/types';
import type { CategoryScore } from '../../../lib/tools/dockerfile-analyzer/types';

const COMPOSE_LABELS: Record<string, string> = {
  security: 'Security',
  semantic: 'Semantic',
  'best-practice': 'Best Practice',
  schema: 'Schema',
  style: 'Style',
};

// Option A: The existing CategoryBreakdown component IS generic enough
// because it reads cat.category, cat.score, cat.weight which both types share.
// Just need to ensure CATEGORY_LABELS and CATEGORY_COLORS in the shared
// component support compose's categories. If not, create a wrapper.
```

### Pattern 6: Custom React Flow Node for Service Display
**What:** Custom node component showing service name, image, and port summary. Styled to match the site's dark theme.
**When to use:** GRAPH-02 requirement.
**Example:**
```typescript
// Source: React Flow custom nodes docs (reactflow.dev/learn/customization/custom-nodes)
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';

type ServiceNodeData = {
  label: string;
  image?: string;
  ports?: string;
  networks?: string[];
  networkColor?: string;
};

type ServiceNodeType = Node<ServiceNodeData, 'service'>;

function ServiceNode({ data }: NodeProps<ServiceNodeType>) {
  return (
    <div
      className="px-3 py-2 rounded-lg border text-sm min-w-[180px]"
      style={{
        borderColor: data.networkColor ?? 'var(--color-border)',
        backgroundColor: 'var(--color-surface-alt, rgba(0,0,0,0.4))',
      }}
    >
      <Handle type="target" position={Position.Top} />
      <div className="font-bold text-[var(--color-text-primary)]">{data.label}</div>
      {data.image && (
        <div className="text-xs text-[var(--color-text-secondary)] truncate">
          {data.image}
        </div>
      )}
      {data.ports && (
        <div className="text-xs text-[var(--color-accent)] mt-0.5">
          {data.ports}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
```

### Pattern 7: Custom Edge with Condition Label
**What:** Edge component that shows depends_on condition labels (e.g., "service_healthy") along the edge path.
**When to use:** GRAPH-03 requirement.
**Example:**
```typescript
// Source: React Flow edge labels docs (reactflow.dev/learn/customization/edge-labels)
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
  type Edge,
} from '@xyflow/react';

type DependencyEdgeData = {
  condition?: string;
  isCycle?: boolean;
};

type DependencyEdgeType = Edge<DependencyEdgeData, 'dependency'>;

function DependencyEdge({
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data, markerEnd,
}: EdgeProps<DependencyEdgeType>) {
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  return (
    <>
      <BaseEdge
        path={path}
        markerEnd={markerEnd}
        style={{
          stroke: data?.isCycle ? '#ef4444' : 'var(--color-border)',
          strokeWidth: data?.isCycle ? 2.5 : 1.5,
        }}
      />
      {data?.condition && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)]"
          >
            {data.condition}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
```

### Anti-Patterns to Avoid
- **Defining `nodeTypes`/`edgeTypes` inside the component:** This causes re-renders and re-registration on every render. Define them at module level outside the component.
- **Running dagre on every render:** Memoize layout computation. Only recompute when graph data actually changes.
- **Importing React Flow CSS globally:** Import `@xyflow/react/dist/style.css` only inside the lazy-loaded `DependencyGraph` component so it does not inflate the main bundle.
- **Using `client:load` or `client:visible` for React Flow:** Only `client:only="react"` avoids SSR entirely. React Flow crashes during SSR because it accesses `window` and `document`.
- **Building compose-specific ScoreGauge/ViolationList from scratch:** The existing shared components are tool-agnostic by design. Reuse them.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Graph visualization (pan/zoom/drag/nodes/edges) | Custom SVG/Canvas graph renderer | `@xyflow/react` v12 | Months of work for pan, zoom, drag, edge routing, selection that React Flow provides in an afternoon |
| Graph node layout/positioning | Manual coordinate calculation | `@dagrejs/dagre` | Hierarchical layout is a solved problem. Manual positioning breaks for any non-trivial graph. |
| SVG circular gauge | Custom Canvas/SVG gauge from scratch | Existing `ScoreGauge` component | Already built, tested, accessible (has aria-label) |
| Violation grouping by severity | Custom grouping logic | Existing `ViolationList.groupBySeverity` | Already handles severity ordering, expandable details, click-to-navigate |
| Category breakdown bars | Custom progress bars | Existing `CategoryBreakdown` component | Already built with proper styling and proportional bars |
| Click-to-navigate line highlight | Custom scroll + highlight logic | Existing `highlightAndScroll` + `highlightLineField` | Already handles clamping, auto-clear after 1.5s, flash animation |
| Cycle detection | Custom graph traversal | Existing `detectCycles` (Kahn's algorithm) | Already implemented and tested in Phase 34 |
| Edge direction arrows | Custom SVG arrowheads | React Flow's `markerEnd` prop with `MarkerType.ArrowClosed` | Built-in, properly positioned and styled |

**Key insight:** Phase 34 and the v1.4 Dockerfile Analyzer already built most of the UI components and graph analysis infrastructure this phase needs. The unique work is wiring them together with a tabbed UI and the React Flow visualization layer.

## Common Pitfalls

### Pitfall 1: React Flow CSS Conflicts with Site Dark Theme
**What goes wrong:** React Flow's default light-background styles clash with the Quantum Explorer dark theme. White backgrounds, wrong fonts, z-index conflicts.
**Why it happens:** React Flow ships its own design system via `@xyflow/react/dist/style.css`.
**How to avoid:** Override React Flow CSS custom properties to match the site theme:
```css
.react-flow {
  --xy-background-color: transparent;
  --xy-node-background-color: var(--color-surface, #1a1a2e);
  --xy-node-border-color: var(--color-border, #2a2a4a);
  --xy-node-color: var(--color-text-primary, #e0e0e0);
  --xy-edge-stroke: var(--color-accent, #c44b20);
  font-family: 'Inter', system-ui, sans-serif;
}
```
**Warning signs:** White background in graph area, serif fonts on nodes.

### Pitfall 2: Dagre Layout with Cycles Causes Infinite Loop
**What goes wrong:** Dagre does not handle cycles gracefully. Feeding circular dependencies directly into dagre can cause infinite loops or crashes.
**Why it happens:** Dagre assumes a DAG (directed acyclic graph). Compose files can have circular depends_on.
**How to avoid:** Run `detectCycles()` BEFORE passing edges to dagre. For cycle edges, temporarily remove them from the dagre layout input, then re-add them after layout with the same source/target positions. The cycle edges will appear as back-edges in the visualization.
**Warning signs:** Browser tab freezes when analyzing a compose file with circular dependencies.

### Pitfall 3: React Flow Bundle Loaded Eagerly Kills Lighthouse Score
**What goes wrong:** React Flow (~120-140 KB gzip) + dagre (~30-40 KB gzip) loaded on initial page render even though user may never click the Graph tab.
**Why it happens:** Static import at top of ComposeResultsPanel.
**How to avoid:** Use `React.lazy()` dynamic import. The `DependencyGraph` component and all its dependencies (React Flow, dagre, CSS) are in a separate chunk loaded only on tab activation.
**Warning signs:** Lighthouse Performance drops below 90; initial JS payload exceeds 350 KB.

### Pitfall 4: NodeTypes/EdgeTypes Defined Inside Component Cause Re-renders
**What goes wrong:** React Flow re-registers and re-renders all nodes on every parent render cycle.
**Why it happens:** If `nodeTypes` or `edgeTypes` objects are created inside the component function, they are new references every render.
**How to avoid:** Define `nodeTypes` and `edgeTypes` as module-level constants outside the component.
```typescript
// CORRECT: outside component
const nodeTypes = { service: ServiceNode };
const edgeTypes = { dependency: DependencyEdge };

function DependencyGraph() { /* ... */ }
```
**Warning signs:** Graph flickers or nodes lose selection state after any state change.

### Pitfall 5: Shared CategoryBreakdown Has Dockerfile-Specific Labels
**What goes wrong:** The existing `CategoryBreakdown` component has hardcoded `CATEGORY_LABELS` and `CATEGORY_COLORS` for dockerfile categories (security, efficiency, maintainability, reliability, best-practice). Compose uses different categories (security, semantic, best-practice, schema, style).
**Why it happens:** The shared component was built for the Dockerfile Analyzer and not parameterized for different category sets.
**How to avoid:** Either (a) make the shared component accept labels/colors as props, or (b) create a `ComposeCategoryBreakdown` wrapper that provides compose-specific labels/colors. Option (b) is safer since it avoids changing the working Dockerfile Analyzer.
**Warning signs:** "undefined" or wrong labels next to category bars.

### Pitfall 6: ViolationList Rule Links Point to Dockerfile Rule Pages
**What goes wrong:** The existing `ViolationList` has hardcoded links to `/tools/dockerfile-analyzer/rules/${violation.ruleId.toLowerCase()}/`. Compose violations would link to non-existent pages.
**Why it happens:** ViolationList was built specifically for the Dockerfile Analyzer.
**How to avoid:** Create a `ComposeViolationList` wrapper that either removes rule links (if compose rule pages don't exist yet in Phase 36) or adjusts the URL pattern. The `onNavigate` callback pattern is already generic and can be reused as-is.
**Warning signs:** Clicking a rule ID in the compose results 404s.

### Pitfall 7: Graph Data Missing Image/Port/Network Information
**What goes wrong:** The existing `buildDependencyGraph` only extracts service names and depends_on relationships. It does not extract image, ports, or network information needed for GRAPH-02 and GRAPH-05.
**Why it happens:** `graph-builder.ts` was designed for cycle detection (CV-M002), not visualization.
**How to avoid:** Create a `graph-data-extractor.ts` helper that enriches graph nodes with image, port summary, and network membership by reading from the parsed JSON (`json.services`). Do not modify `graph-builder.ts` (it serves the rules correctly).
**Warning signs:** Service nodes show only names, missing image and port details.

### Pitfall 8: React Flow Needs Explicit Container Height
**What goes wrong:** React Flow renders as 0px height if its container does not have an explicit height.
**Why it happens:** React Flow uses a ResizeObserver on its container. Without a height, it collapses.
**How to avoid:** Set the graph container to `min-h-[400px]` or use flex layout to give it a defined height. The existing results panel already uses `flex-1` which should work if the parent has a defined height.
**Warning signs:** Graph tab appears blank -- React Flow exists in DOM but has 0 height.

## Code Examples

Verified patterns from official sources and existing codebase:

### Graph Data Extraction from Parsed Compose JSON
```typescript
// NEW: graph-data-extractor.ts
// Extracts image, port summary, and network info from parsed compose JSON
// for use in React Flow custom nodes.
import type { DependencyGraph } from './graph-builder';

export interface EnrichedServiceNode {
  name: string;
  image?: string;
  portSummary?: string;  // e.g., "8080:80, 3000:3000"
  networks: string[];
}

export function extractServiceMetadata(
  json: Record<string, unknown>,
): Map<string, EnrichedServiceNode> {
  const result = new Map<string, EnrichedServiceNode>();
  const services = json.services as Record<string, any> | undefined;
  if (!services) return result;

  for (const [name, svc] of Object.entries(services)) {
    if (!svc || typeof svc !== 'object') continue;

    const image = typeof svc.image === 'string' ? svc.image : undefined;
    const ports = Array.isArray(svc.ports)
      ? svc.ports.map((p: any) => String(p)).slice(0, 3).join(', ')
      : undefined;
    const networks = svc.networks
      ? (Array.isArray(svc.networks)
          ? svc.networks.map(String)
          : Object.keys(svc.networks))
      : [];

    result.set(name, {
      name,
      image,
      portSummary: ports,
      networks,
    });
  }

  return result;
}
```

### Converting Graph Data to React Flow Format
```typescript
// Inside DependencyGraph.tsx
import type { Node, Edge } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';
import { buildDependencyGraph, detectCycles } from '../../lib/tools/compose-validator/graph-builder';
import { extractServiceMetadata } from '../../lib/tools/compose-validator/graph-data-extractor';

function buildReactFlowData(
  services: Map<string, any>,
  json: Record<string, unknown>,
): { nodes: Node[]; edges: Edge[]; hasCycle: boolean } {
  const graph = buildDependencyGraph(services);
  const { cycleParticipants } = detectCycles(graph);
  const cycleSet = new Set(cycleParticipants);
  const metadata = extractServiceMetadata(json);

  const nodes: Node[] = graph.nodes.map((n) => {
    const meta = metadata.get(n.name);
    return {
      id: n.name,
      type: 'service',
      position: { x: 0, y: 0 }, // dagre will set this
      data: {
        label: n.name,
        image: meta?.image,
        ports: meta?.portSummary,
        networks: meta?.networks ?? [],
      },
    };
  });

  const edges: Edge[] = graph.edges.map((e, i) => ({
    id: `e-${e.from}-${e.to}-${i}`,
    source: e.from,
    target: e.to,
    type: 'dependency',
    markerEnd: { type: MarkerType.ArrowClosed },
    data: {
      condition: e.condition,
      isCycle: cycleSet.has(e.from) && cycleSet.has(e.to),
    },
  }));

  return { nodes, edges, hasCycle: cycleParticipants.length > 0 };
}
```

### React Flow Theme Override CSS
```css
/* Inside DependencyGraph.tsx or a co-located CSS file */
.compose-graph .react-flow {
  --xy-background-color: transparent;
  --xy-node-color: var(--color-text-primary);
  --xy-edge-stroke: rgba(255, 255, 255, 0.2);
  --xy-edge-stroke-selected: var(--color-accent);
  --xy-connectionline-stroke: var(--color-accent);
  --xy-attribution-background-color: transparent;
}

.compose-graph .react-flow__controls button {
  background-color: var(--color-surface, #1a1a2e);
  border-color: var(--color-border, rgba(255,255,255,0.1));
  color: var(--color-text-primary);
  fill: var(--color-text-primary);
}

.compose-graph .react-flow__controls button:hover {
  background-color: rgba(255, 255, 255, 0.05);
}
```

### Dagre Cycle-Safe Layout
```typescript
// Remove cycle edges before dagre, re-add after with positions
function layoutGraphSafe(
  nodes: Node[],
  edges: Edge[],
): { nodes: Node[]; edges: Edge[] } {
  // Separate cycle edges from normal edges
  const normalEdges = edges.filter((e) => !e.data?.isCycle);
  const cycleEdges = edges.filter((e) => e.data?.isCycle);

  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 100 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  // Only add non-cycle edges for layout
  normalEdges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
    };
  });

  // Re-combine all edges (cycle edges will route between positioned nodes)
  return { nodes: layoutedNodes, edges: [...normalEdges, ...cycleEdges] };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `reactflow` (unscoped npm) | `@xyflow/react` (scoped package) | React Flow v12 (2024) | Must use new package name and named imports |
| `ReactFlow` default export | `{ ReactFlow }` named export | React Flow v12 | Import destructuring required |
| `node.__rf.width/height` | `node.measured.width/height` | React Flow v12 | Layout code must use new property paths |
| `useNodes()`/`useEdges()` | `useNodesState()`/`useEdgesState()` with state management | React Flow v12 | Hooks return state + setter + change handler |

**Deprecated/outdated:**
- `reactflow` npm package: Redirects to `@xyflow/react`. Do not install the old package.
- `dagre` (original): Unmaintained since 2018. Use `@dagrejs/dagre` (actively maintained fork).

## Open Questions

1. **Shared CategoryBreakdown extensibility**
   - What we know: The existing component has hardcoded Dockerfile-specific `CATEGORY_LABELS` and `CATEGORY_COLORS` maps. Compose uses different categories.
   - What's unclear: Whether to refactor the shared component to accept labels/colors as props or to create a compose-specific wrapper.
   - Recommendation: Create a compose-specific `ComposeCategoryBreakdown` wrapper to avoid touching the working Dockerfile Analyzer code. The refactoring to a truly generic shared component can happen as tech debt later.

2. **ViolationList rule link behavior for compose rules**
   - What we know: Compose rule pages (like `/tools/compose-validator/rules/cv-c001/`) do not exist yet (that's a later phase). The existing ViolationList links to dockerfile rule pages.
   - What's unclear: Whether to show rule links that 404, hide links, or link to a future path.
   - Recommendation: Create a `ComposeViolationList` wrapper that omits the rule link `<a>` tag (just show the rule ID as text, not a link). When rule pages are created in a later phase, the link can be added.

3. **Network color assignment strategy**
   - What we know: GRAPH-05 requires network-based color coding. Docker Compose files can define multiple networks. Services can belong to multiple networks.
   - What's unclear: How to handle services in multiple networks (which color wins?) and how many distinct colors to support.
   - Recommendation: Use primary network (first in list) for border color. Assign from a fixed palette of 6-8 colors. Show network badges/tags for multi-network services.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/components/tools/results/ScoreGauge.tsx` -- reusable SVG gauge component
- Existing codebase: `src/components/tools/results/CategoryBreakdown.tsx` -- category bar component
- Existing codebase: `src/components/tools/results/ViolationList.tsx` -- severity-grouped violation list
- Existing codebase: `src/components/tools/results/EmptyState.tsx` -- "no issues found" component
- Existing codebase: `src/lib/tools/dockerfile-analyzer/highlight-line.ts` -- click-to-navigate utility
- Existing codebase: `src/lib/tools/compose-validator/graph-builder.ts` -- dependency graph + cycle detection
- Existing codebase: `src/stores/composeValidatorStore.ts` -- nanostore with `composeEditorViewRef`
- Existing codebase: `src/components/tools/ComposeResultsPanel.tsx` -- stub to be replaced
- Existing codebase: `src/components/tools/ResultsPanel.tsx` -- Dockerfile results panel (reference pattern)
- [React Flow dagre layout example](https://reactflow.dev/examples/layout/dagre) -- official dagre integration pattern
- [React Flow custom nodes](https://reactflow.dev/learn/customization/custom-nodes) -- custom node registration and implementation
- [React Flow edge labels](https://reactflow.dev/learn/customization/edge-labels) -- EdgeLabelRenderer pattern
- [React Flow TypeScript guide](https://reactflow.dev/learn/advanced-use/typescript) -- Node<Data, Type> pattern, AppNode union type
- [React Flow custom edges](https://reactflow.dev/examples/edges/custom-edges) -- BaseEdge + getSmoothStepPath pattern

### Secondary (MEDIUM confidence)
- Project research: `.planning/research/PITFALLS.md` -- React Flow CSS conflicts, lazy-loading strategy, cycle handling
- Project research: `.planning/research/STACK.md` -- dagre vs elkjs comparison, React Flow integration patterns
- Project research: `.planning/research/ARCHITECTURE.md` -- React Flow + Astro integration notes
- [@xyflow/react npm](https://www.npmjs.com/package/@xyflow/react) -- v12.10.1, latest version confirmed
- [Bundlephobia @xyflow/react](https://bundlephobia.com/package/@xyflow/react) -- bundle size analysis (exact numbers not retrieved but ~120-140 KB gzip per project research)

### Tertiary (LOW confidence)
- None -- all findings verified through official docs or existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- `@xyflow/react` v12 + `@dagrejs/dagre` confirmed via npm + official docs. Already planned in project research.
- Architecture: HIGH -- Patterns derived from existing codebase (Dockerfile Analyzer) + official React Flow examples. All code paths verified against existing project conventions.
- Pitfalls: HIGH -- Comprehensive pitfall list drawn from project's own PITFALLS.md research + verified against React Flow docs. CSS conflicts, cycle handling, bundle size, container height all documented.

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (30 days -- React Flow and dagre are stable libraries)
