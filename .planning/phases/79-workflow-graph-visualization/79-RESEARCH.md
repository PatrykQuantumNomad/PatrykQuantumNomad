# Phase 79: Workflow Graph Visualization - Research

**Researched:** 2026-03-04
**Domain:** React Flow interactive graph, dagre hierarchical layout, GitHub Actions workflow structure extraction
**Confidence:** HIGH

## Summary

Phase 79 renders an interactive workflow graph inside the existing Graph tab placeholder (built in Phase 78's `GhaResultsPanel.tsx`). The graph visualizes GitHub Actions workflow structure with three node types (trigger events, jobs, steps), connected by dependency edges from `needs:` declarations and `on:` event-to-job relationships. Nodes are color-coded by violation status (clean/warning/error) using the existing `ghaResult` store atom. The graph component is lazy-loaded via `React.lazy` to keep React Flow's ~120KB bundle out of the initial page load.

The project already has two complete React Flow graph implementations: the Docker Compose `DependencyGraph.tsx` and the K8s `K8sResourceGraph.tsx`. Both use the identical pattern: `@xyflow/react` v12.10.1 with `@dagrejs/dagre` v2.0.4 for hierarchical layout, custom node/edge types via `nodeTypes`/`edgeTypes` module-level constants, a `layoutGraph()` function that creates a `dagre.graphlib.Graph`, and lazy loading via `React.lazy()` with a `GraphSkeleton` fallback. Phase 79 follows this exact pattern with three differences: (1) left-to-right layout (`rankdir: 'LR'`) instead of top-to-bottom, (2) three distinct node types (trigger, job, step) instead of one, and (3) job nodes act as group/container nodes with step nodes nested inside them using React Flow's `parentId` mechanism.

The main technical challenge is the dagre layout with group nodes. Dagre treats all nodes as flat -- it does not natively understand parent-child hierarchies. The established approach is to run dagre layout on job-level nodes only (triggers and jobs), then position step nodes sequentially within their parent job containers using manual relative positioning. This avoids the known dagre limitation with sub-flows while still achieving the hierarchical left-to-right layout specified in GRAPH-07.

**Primary recommendation:** Build a `gha-graph-data-extractor.ts` to parse workflow JSON into graph nodes/edges, then a `GhaWorkflowGraph.tsx` component following the existing DependencyGraph.tsx pattern with `rankdir: 'LR'`, three custom node types, and `React.lazy()` loading. Replace the Graph tab placeholder in `GhaResultsPanel.tsx`.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GRAPH-01 | Full workflow graph with 3 node types: trigger events, jobs, steps | Three custom React Flow node components (TriggerNode, JobNode, StepNode). Data extracted from parsed workflow JSON `on:` events, `jobs:` keys, and `steps:` arrays. Follows ServiceNode.tsx / K8sResourceNode.tsx pattern. |
| GRAPH-02 | Job dependency edges from `needs:` declarations with cycle detection | Port `detectCycles()` Kahn's algorithm from compose-validator `graph-builder.ts`. Extract `needs:` from each job in the parsed JSON. Cycle edges highlighted in red (same as compose DependencyGraph pattern). |
| GRAPH-03 | Trigger-to-job edges from `on:` event definitions | Every event in the `on:` block connects to every job that does not have a `needs:` dependency (entry-point jobs). Jobs with `needs:` are reached transitively. Edge label shows event name. |
| GRAPH-04 | Steps displayed as sequential nodes within job containers | Job nodes use React Flow group type with `parentId` on child step nodes. Steps positioned sequentially within the job container using manual relative coordinates (not dagre -- dagre only lays out top-level nodes). |
| GRAPH-05 | Color-coded nodes by violation status (clean/warning/error) | Map `GhaUnifiedViolation[]` from `ghaResult` store to per-job and per-step violation status. Color border: green (clean), amber (warning), red (error). Follows K8sResourceNode `categoryColor` pattern. |
| GRAPH-06 | React Flow lazy-loaded via React.lazy (separate chunk for Lighthouse 90+) | `const LazyGhaWorkflowGraph = lazy(() => import('./gha-results/GhaWorkflowGraph'))` in GhaResultsPanel.tsx. Wrap in `<Suspense fallback={<GhaGraphSkeleton />}>`. Identical to K8sResultsPanel.tsx line 21. |
| GRAPH-07 | dagre hierarchical layout (left-to-right) with grouped dependency levels | `g.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 120 })`. LR layout places triggers on the left, jobs in the middle, with steps nested inside job containers. dagre groups jobs by dependency rank automatically. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @xyflow/react | 12.10.1 | React Flow v12 graph rendering, custom nodes/edges, controls, background | Already installed; used in 2 other tool graphs (Compose, K8s) |
| @dagrejs/dagre | 2.0.4 | Directed acyclic graph layout with hierarchical ranking | Already installed; used in 2 other tool graphs |
| react | 19.2.4 | React 19 for UI components | Already installed |
| nanostores | 1.1.0 | State management -- reads `ghaResult` for violation status | Already installed |
| @nanostores/react | 1.0.0 | React bindings (`useStore`) for nanostores | Already installed |
| yaml | 2.8.2 | YAML parsing (used by existing parser.ts for AST walking) | Already installed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | 4.0.18 | Testing graph data extractor and cycle detection | Already installed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| dagre for layout | ELK (Eclipse Layout Kernel) | ELK supports compound/hierarchical nodes natively but adds ~200KB. Dagre is already installed and the two-pass layout (dagre for top-level, manual for steps) is proven in this codebase. |
| Manual step positioning | dagre sub-flow layout | Dagre has known issues with sub-flows connected to external nodes. Manual sequential positioning within job containers is simpler and more predictable. |
| Three separate node types | Single node type with conditionals | Three types gives cleaner code, each with its own Handle positions and styling. Matches the project pattern (ServiceNode, K8sResourceNode are distinct). |

**Installation:**
```bash
# No new packages needed. All dependencies already installed.
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  lib/tools/gha-validator/
    gha-graph-data-extractor.ts    # NEW: Extract trigger/job/step graph data from parsed workflow
    __tests__/
      gha-graph-data-extractor.test.ts  # NEW: Tests for graph extraction + cycle detection
  components/tools/
    gha-results/
      GhaWorkflowGraph.tsx          # NEW: React Flow graph component (lazy-loaded)
      GhaGraphSkeleton.tsx          # NEW: Loading skeleton while React Flow lazy-loads
      GhaTriggerNode.tsx            # NEW: Custom node for trigger events (push, pull_request, etc.)
      GhaJobNode.tsx                # NEW: Custom group node for jobs (container with steps inside)
      GhaStepNode.tsx               # NEW: Custom node for individual steps
      GhaDependencyEdge.tsx         # NEW: Custom edge with labels (needs/trigger relationship)
      gha-graph.css                 # NEW: Dark theme overrides for React Flow (same as k8s-graph.css)
    GhaResultsPanel.tsx             # UPDATED: Replace placeholder with lazy-loaded graph
```

### Pattern 1: Graph Data Extraction (Separation of Concerns)
**What:** A pure function that takes parsed workflow JSON and returns graph nodes + edges, separate from React Flow rendering.
**When to use:** Always. This pattern is used by both Compose (`graph-data-extractor.ts`) and K8s (`k8s-graph-data-extractor.ts`) analyzers. It enables unit testing without React/DOM dependencies.
**Example:**
```typescript
// src/lib/tools/gha-validator/gha-graph-data-extractor.ts
// Follows compose-validator/graph-data-extractor.ts pattern

export interface GhaGraphNode {
  id: string;
  type: 'trigger' | 'job' | 'step';
  label: string;
  parentJobId?: string; // For step nodes -- links to parent job
  violationStatus: 'clean' | 'warning' | 'error';
  stepIndex?: number;   // For sequential ordering within a job
}

export interface GhaGraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'needs' | 'trigger' | 'step-sequence';
  label?: string;
  isCycle?: boolean;
}

export interface GhaGraphData {
  nodes: GhaGraphNode[];
  edges: GhaGraphEdge[];
  hasCycle: boolean;
}

export function extractGhaGraphData(
  json: Record<string, unknown>,
  violations: GhaUnifiedViolation[],
): GhaGraphData {
  // 1. Extract triggers from on: block
  // 2. Extract jobs from jobs: block
  // 3. Extract steps from each job's steps: array
  // 4. Build needs: edges between jobs
  // 5. Build trigger-to-entry-job edges
  // 6. Run cycle detection on job-level edges
  // 7. Compute violation status per job/step
}
```

### Pattern 2: Two-Pass Layout (dagre for Jobs, Manual for Steps)
**What:** Run dagre layout on trigger + job nodes only. Then position step nodes sequentially within their parent job container using relative coordinates.
**When to use:** When combining dagre with React Flow's `parentId` group nodes. Dagre does not natively support compound graphs.
**Example:**
```typescript
// In GhaWorkflowGraph.tsx layoutGraph() function
function layoutGraph(
  graphData: GhaGraphData,
): { nodes: Node[]; edges: Edge[] } {
  // Phase 1: dagre layout for trigger + job nodes only
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 120 });

  const topLevelNodes = graphData.nodes.filter(n => n.type !== 'step');
  for (const node of topLevelNodes) {
    const stepCount = graphData.nodes.filter(
      n => n.type === 'step' && n.parentJobId === node.id
    ).length;
    // Job nodes are taller to contain their steps
    const height = node.type === 'job'
      ? JOB_HEADER_HEIGHT + stepCount * STEP_HEIGHT + JOB_PADDING
      : TRIGGER_HEIGHT;
    g.setNode(node.id, { width: JOB_WIDTH, height });
  }

  // Only needs: and trigger edges for dagre (not step-sequence)
  for (const edge of graphData.edges) {
    if (edge.type !== 'step-sequence') {
      g.setEdge(edge.source, edge.target);
    }
  }

  dagre.layout(g);

  // Phase 2: Position step nodes within job containers
  // Steps use parentId and relative positioning
  const stepNodes = graphData.nodes
    .filter(n => n.type === 'step')
    .map(n => ({
      id: n.id,
      type: 'gha-step' as const,
      parentId: n.parentJobId!,
      position: {
        x: STEP_PADDING_X,
        y: JOB_HEADER_HEIGHT + (n.stepIndex ?? 0) * STEP_HEIGHT,
      },
      extent: 'parent' as const,
      data: { ... },
    }));

  return { nodes: [...layoutedTopLevel, ...stepNodes], edges: rfEdges };
}
```

### Pattern 3: Lazy Loading with Suspense (GRAPH-06)
**What:** React.lazy() loads the graph component only when the Graph tab is activated. Suspense shows a skeleton placeholder during loading.
**When to use:** Always for React Flow components. This is the established pattern in the project.
**Example:**
```typescript
// In GhaResultsPanel.tsx (updating existing file)
import { lazy, Suspense } from 'react';
import { GhaGraphSkeleton } from './gha-results/GhaGraphSkeleton';
import '@xyflow/react/dist/style.css';

const LazyGhaWorkflowGraph = lazy(() => import('./gha-results/GhaWorkflowGraph'));

// In the Graph tab section (replacing the placeholder):
<Suspense fallback={<GhaGraphSkeleton />}>
  <LazyGhaWorkflowGraph />
</Suspense>
```

### Pattern 4: Violation Status Mapping (GRAPH-05)
**What:** Map violations from the `ghaResult` store to per-node color coding.
**When to use:** When building graph data from the analysis result.
**Example:**
```typescript
// Compute violation status for a job or step based on line numbers
function computeViolationStatus(
  violations: GhaUnifiedViolation[],
  startLine: number,
  endLine: number,
): 'clean' | 'warning' | 'error' {
  const relevant = violations.filter(v => v.line >= startLine && v.line <= endLine);
  if (relevant.some(v => v.severity === 'error')) return 'error';
  if (relevant.some(v => v.severity === 'warning')) return 'warning';
  return 'clean';
}

// Status colors used in node border styling
const STATUS_COLORS = {
  clean: '#10b981',   // emerald-500
  warning: '#f59e0b', // amber-500
  error: '#ef4444',   // red-500
};
```

### Pattern 5: Module-Level nodeTypes/edgeTypes Constants
**What:** React Flow warns and loses performance if `nodeTypes` or `edgeTypes` objects are re-created on every render. Define them at module level.
**When to use:** Always. Both existing graph components follow this pattern.
**Example:**
```typescript
// Top of GhaWorkflowGraph.tsx (outside component)
const nodeTypes = {
  'gha-trigger': GhaTriggerNode,
  'gha-job': GhaJobNode,
  'gha-step': GhaStepNode,
};
const edgeTypes = {
  'gha-dependency': GhaDependencyEdge,
};
```

### Anti-Patterns to Avoid
- **Running dagre on step nodes:** Dagre does not understand parent-child hierarchies. Including step nodes in the dagre graph produces overlapping positions. Only layout trigger and job nodes with dagre; position steps manually within their parent job container.
- **Creating nodeTypes/edgeTypes inside the component:** React Flow will re-register node types on every render, causing performance warnings and visual flicker. Always define at module level.
- **Importing `@xyflow/react/dist/style.css` inside the lazy-loaded component:** The CSS must be imported in the parent (GhaResultsPanel.tsx) that is always loaded, not inside the lazy chunk. If imported inside the lazy component, styles flash in after loading.
- **Using dagre with cycle edges:** Dagre assumes a DAG. Including cycle-back edges causes infinite loops in dagre's layout algorithm. Filter out cycle edges before running dagre, then re-add them after layout (same as DependencyGraph.tsx pattern).
- **Hard-coding node positions:** Let dagre compute positions. Hard-coded positions break when the workflow structure changes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Graph layout algorithm | Custom force-directed or hierarchical layout | dagre with `rankdir: 'LR'` | Dagre handles rank assignment, edge routing, node separation -- 100+ edge cases |
| Cycle detection | Custom DFS cycle finder | Port `detectCycles()` from `compose-validator/graph-builder.ts` | Kahn's algorithm is already proven in the codebase with correct edge cases |
| Interactive graph canvas | Custom SVG/Canvas rendering with zoom/pan | `@xyflow/react` ReactFlow component | Handles zoom, pan, drag, fit view, controls, background, edge routing, node selection |
| Dark theme for React Flow | Custom CSS from scratch | Copy `k8s-graph.css` pattern (same CSS variable overrides) | Identical overrides needed; the project's dark theme CSS variables are consistent |
| Loading skeleton | Custom loading spinner | Port `GraphSkeleton.tsx` / `K8sGraphSkeleton.tsx` pattern | Consistent UX with other graph tools in the project |

**Key insight:** Phase 79 is an **integration phase** -- combining React Flow (already installed), dagre (already installed), and the GHA engine's parsed data (already available in `ghaResult` store). The only genuinely new code is the data extractor and three custom node components.

## Common Pitfalls

### Pitfall 1: Dagre Infinite Loop on Cycle Edges
**What goes wrong:** Dagre's layout algorithm enters an infinite loop when the graph contains cycles.
**Why it happens:** Dagre implements Sugiyama's algorithm which requires a DAG. GitHub Actions `needs:` can theoretically create cycles (detected by actionlint GA-L003).
**How to avoid:** Filter cycle edges out before calling `dagre.layout()`. Re-add them after layout so they render as back-edges between already-positioned nodes. This is the exact approach used in `DependencyGraph.tsx` lines 69-93.
**Warning signs:** Browser tab hangs when rendering a workflow with circular `needs:` declarations.

### Pitfall 2: React Flow Parent Node Ordering
**What goes wrong:** Child step nodes don't render inside their parent job nodes.
**Why it happens:** React Flow requires parent nodes to appear before their children in the nodes array. If step nodes come before their parent job node, the parent-child relationship is ignored.
**How to avoid:** Sort the nodes array: trigger nodes first, then job nodes, then step nodes. Within steps, order by `parentJobId` to keep children grouped after their parent.
**Warning signs:** Step nodes render at absolute position (0,0) outside their job container.

### Pitfall 3: Step Node Positioning is Relative to Parent
**What goes wrong:** Step nodes appear at wrong positions, overlapping or outside the job container.
**Why it happens:** When a node has `parentId`, its `position` is relative to the parent's top-left corner, not the canvas origin. If you set absolute coordinates, steps fly off to wrong locations.
**How to avoid:** Step positions should be small relative values like `{ x: 10, y: 40 }` (padding inside the job container), not dagre-computed absolute coordinates.
**Warning signs:** Steps clustered at a distant corner of the canvas, far from their parent job.

### Pitfall 4: Job Container Size Must Account for Steps
**What goes wrong:** Job container is too small and steps overflow visually.
**Why it happens:** React Flow group nodes need explicit `style: { width, height }` dimensions. If the job node doesn't account for the number of steps, the container clips.
**How to avoid:** Calculate job node height dynamically: `JOB_HEADER_HEIGHT + stepCount * STEP_HEIGHT + JOB_PADDING`. Pass this to both dagre (for layout spacing) and the React Flow node style.
**Warning signs:** Steps extending below the job node's visible boundary.

### Pitfall 5: Graph Tab Shows Empty Before Analysis
**What goes wrong:** User clicks Graph tab before running analysis. No data to render.
**Why it happens:** `ghaResult` store is null until the user clicks Analyze.
**How to avoid:** Show an informative empty state: "Run an analysis to see the workflow graph." This matches the Results tab's pre-analysis state. Check `ghaResult` before rendering the graph.
**Warning signs:** Blank graph area with no user guidance.

### Pitfall 6: CSS Import Location for React Flow Styles
**What goes wrong:** React Flow renders with no styles -- nodes are invisible, controls missing.
**Why it happens:** `@xyflow/react/dist/style.css` not imported, or imported inside the lazy-loaded component (styles load late, causing FOUC).
**How to avoid:** Import `@xyflow/react/dist/style.css` in `GhaResultsPanel.tsx` (the eager-loaded parent), NOT inside the lazy `GhaWorkflowGraph.tsx`. This is the established pattern in both `ComposeResultsPanel.tsx` and `K8sResultsPanel.tsx`.
**Warning signs:** Graph renders with unstyled divs; controls are raw HTML buttons.

## Code Examples

### Graph Data Extractor (gha-graph-data-extractor.ts)
```typescript
// Source: Based on compose-validator/graph-data-extractor.ts pattern
import type { GhaUnifiedViolation } from './types';

export interface GhaGraphNode {
  id: string;
  type: 'trigger' | 'job' | 'step';
  label: string;
  parentJobId?: string;
  violationStatus: 'clean' | 'warning' | 'error';
  stepIndex?: number;
}

export interface GhaGraphEdge {
  id: string;
  source: string;
  target: string;
  edgeType: 'needs' | 'trigger';
  label?: string;
  isCycle?: boolean;
}

export interface GhaGraphData {
  nodes: GhaGraphNode[];
  edges: GhaGraphEdge[];
  hasCycle: boolean;
}

/**
 * Extract graph data from a parsed GHA workflow JSON.
 *
 * Creates three node types:
 *   - trigger: one per event in the `on:` block
 *   - job: one per job in the `jobs:` block
 *   - step: one per step in each job's `steps:` array
 *
 * Creates two edge types:
 *   - needs: job A depends on job B (from needs: declarations)
 *   - trigger: event connects to entry-point jobs (jobs without needs:)
 */
export function extractGhaGraphData(
  json: Record<string, unknown>,
  violations: GhaUnifiedViolation[],
): GhaGraphData {
  const nodes: GhaGraphNode[] = [];
  const edges: GhaGraphEdge[] = [];

  // 1. Extract trigger events
  const onBlock = json.on;
  const triggerEvents: string[] = [];
  if (typeof onBlock === 'string') {
    triggerEvents.push(onBlock);
  } else if (Array.isArray(onBlock)) {
    triggerEvents.push(...onBlock.map(String));
  } else if (onBlock && typeof onBlock === 'object') {
    triggerEvents.push(...Object.keys(onBlock as Record<string, unknown>));
  }

  for (const event of triggerEvents) {
    nodes.push({
      id: `trigger-${event}`,
      type: 'trigger',
      label: event,
      violationStatus: 'clean', // Triggers don't have violations
    });
  }

  // 2. Extract jobs and steps
  const jobs = json.jobs as Record<string, any> | undefined;
  if (!jobs || typeof jobs !== 'object') {
    return { nodes, edges, hasCycle: false };
  }

  const jobNeeds = new Map<string, string[]>();
  for (const [jobId, jobDef] of Object.entries(jobs)) {
    if (!jobDef || typeof jobDef !== 'object') continue;

    // Compute violation status for the job
    // (simplified -- full implementation uses line ranges)
    const jobStatus = computeViolationStatus(violations, jobId);

    nodes.push({
      id: `job-${jobId}`,
      type: 'job',
      label: jobDef.name ?? jobId,
      violationStatus: jobStatus,
    });

    // Extract needs: dependencies
    const needs = jobDef.needs;
    const needsList: string[] = [];
    if (typeof needs === 'string') needsList.push(needs);
    else if (Array.isArray(needs)) needsList.push(...needs.map(String));
    jobNeeds.set(jobId, needsList);

    for (const dep of needsList) {
      edges.push({
        id: `e-needs-${jobId}-${dep}`,
        source: `job-${dep}`,
        target: `job-${jobId}`,
        edgeType: 'needs',
        label: 'needs',
      });
    }

    // Extract steps
    const steps = Array.isArray(jobDef.steps) ? jobDef.steps : [];
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepLabel = step?.name ?? step?.uses ?? step?.run?.slice(0, 30) ?? `Step ${i + 1}`;
      nodes.push({
        id: `step-${jobId}-${i}`,
        type: 'step',
        label: stepLabel,
        parentJobId: `job-${jobId}`,
        stepIndex: i,
        violationStatus: 'clean', // Per-step status computed from line ranges
      });
    }
  }

  // 3. Connect triggers to entry-point jobs (no needs:)
  const entryJobs = [...jobNeeds.entries()]
    .filter(([, needs]) => needs.length === 0)
    .map(([id]) => id);

  for (const event of triggerEvents) {
    for (const jobId of entryJobs) {
      edges.push({
        id: `e-trigger-${event}-${jobId}`,
        source: `trigger-${event}`,
        target: `job-${jobId}`,
        edgeType: 'trigger',
        label: event,
      });
    }
  }

  // 4. Cycle detection (reuse Kahn's algorithm pattern)
  const hasCycle = detectJobCycles(jobNeeds);
  if (hasCycle) {
    // Mark cycle edges
    markCycleEdges(edges, jobNeeds);
  }

  return { nodes, edges, hasCycle };
}
```

### Custom Node Components
```typescript
// GhaTriggerNode.tsx -- follows ServiceNode.tsx pattern
// Source: Based on compose-results/ServiceNode.tsx
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';

export type GhaTriggerNodeData = {
  label: string;
};
export type GhaTriggerNodeType = Node<GhaTriggerNodeData, 'gha-trigger'>;

export function GhaTriggerNode({ data }: NodeProps<GhaTriggerNodeType>) {
  return (
    <div className="px-3 py-2 rounded-lg border text-sm w-[140px]"
      style={{
        borderColor: '#6366f1', // indigo for triggers
        backgroundColor: 'var(--color-surface-alt, rgba(0,0,0,0.4))',
      }}
    >
      <div className="text-[10px] uppercase font-mono text-indigo-400">trigger</div>
      <div className="font-bold text-[var(--color-text-primary)]">{data.label}</div>
      <Handle type="source" position={Position.Right}
        className="!bg-[var(--color-accent,#c44b20)]" />
    </div>
  );
}
```

```typescript
// GhaJobNode.tsx -- group/container node for jobs
// Source: Based on React Flow sub-flows docs + K8sResourceNode.tsx
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';

export type GhaJobNodeData = {
  label: string;
  violationStatus: 'clean' | 'warning' | 'error';
  stepCount: number;
};
export type GhaJobNodeType = Node<GhaJobNodeData, 'gha-job'>;

const STATUS_COLORS = {
  clean: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
};

export function GhaJobNode({ data }: NodeProps<GhaJobNodeType>) {
  return (
    <div
      className="rounded-lg border text-sm"
      style={{
        borderColor: STATUS_COLORS[data.violationStatus],
        backgroundColor: 'var(--color-surface-alt, rgba(0,0,0,0.3))',
        // Width and height set by the parent via style prop on the node
      }}
    >
      <Handle type="target" position={Position.Left}
        className="!bg-[var(--color-accent,#c44b20)]" />
      <div className="px-3 py-2 border-b border-[var(--color-border)]">
        <div className="text-[10px] uppercase font-mono"
          style={{ color: STATUS_COLORS[data.violationStatus] }}>job</div>
        <div className="font-bold text-[var(--color-text-primary)]">{data.label}</div>
      </div>
      {/* Step nodes render inside this container via parentId */}
      <Handle type="source" position={Position.Right}
        className="!bg-[var(--color-accent,#c44b20)]" />
    </div>
  );
}
```

```typescript
// GhaStepNode.tsx -- individual step within a job container
import { type NodeProps, type Node } from '@xyflow/react';

export type GhaStepNodeData = {
  label: string;
  violationStatus: 'clean' | 'warning' | 'error';
  stepIndex: number;
};
export type GhaStepNodeType = Node<GhaStepNodeData, 'gha-step'>;

const STATUS_BG = {
  clean: 'rgba(16, 185, 129, 0.1)',
  warning: 'rgba(245, 158, 11, 0.1)',
  error: 'rgba(239, 68, 68, 0.1)',
};
const STATUS_BORDER = {
  clean: 'rgba(16, 185, 129, 0.3)',
  warning: 'rgba(245, 158, 11, 0.3)',
  error: 'rgba(239, 68, 68, 0.3)',
};

export function GhaStepNode({ data }: NodeProps<GhaStepNodeType>) {
  return (
    <div className="px-2 py-1.5 rounded text-xs"
      style={{
        backgroundColor: STATUS_BG[data.violationStatus],
        borderLeft: `3px solid ${STATUS_BORDER[data.violationStatus]}`,
        width: 'calc(100% - 16px)', // Fill parent job width minus padding
      }}
    >
      <div className="text-[var(--color-text-primary)] truncate" title={data.label}>
        {data.label}
      </div>
    </div>
  );
}
```

### Dagre LR Layout with Job Containers
```typescript
// Source: Based on DependencyGraph.tsx layoutGraph() + dagre docs
import dagre from '@dagrejs/dagre';

const JOB_WIDTH = 240;
const JOB_HEADER_HEIGHT = 50;
const STEP_HEIGHT = 32;
const STEP_PADDING = 8;
const TRIGGER_WIDTH = 140;
const TRIGGER_HEIGHT = 50;

function layoutGraph(graphData: GhaGraphData) {
  // Filter out cycle edges before dagre (prevents infinite loop)
  const normalEdges = graphData.edges.filter(e => !e.isCycle);
  const cycleEdges = graphData.edges.filter(e => e.isCycle);

  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 120 });

  // Only add trigger and job nodes to dagre (not steps)
  for (const node of graphData.nodes) {
    if (node.type === 'step') continue;
    if (node.type === 'trigger') {
      g.setNode(node.id, { width: TRIGGER_WIDTH, height: TRIGGER_HEIGHT });
    } else {
      // Job height depends on number of steps
      const stepCount = graphData.nodes.filter(
        n => n.type === 'step' && n.parentJobId === node.id
      ).length;
      const height = JOB_HEADER_HEIGHT + stepCount * STEP_HEIGHT + STEP_PADDING * 2;
      g.setNode(node.id, { width: JOB_WIDTH, height });
    }
  }

  // Only needs: and trigger edges for dagre
  for (const edge of normalEdges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  // Position top-level nodes from dagre output
  // Position step nodes relative to their parent job
  // ... (see Architecture Patterns > Pattern 2)
}
```

### Updating GhaResultsPanel.tsx
```typescript
// Source: Based on K8sResultsPanel.tsx lazy loading pattern
import { lazy, Suspense } from 'react';
import { GhaGraphSkeleton } from './gha-results/GhaGraphSkeleton';
import '@xyflow/react/dist/style.css';

const LazyGhaWorkflowGraph = lazy(
  () => import('./gha-results/GhaWorkflowGraph')
);

// In the Graph tab section (replacing the placeholder div):
{activeTab === 'graph' ? (
  result === null ? (
    <div className="flex items-center justify-center h-full text-center py-12">
      <p className="text-[var(--color-text-secondary)]">
        Run an analysis to see the workflow graph
      </p>
    </div>
  ) : (
    <Suspense fallback={<GhaGraphSkeleton />}>
      <LazyGhaWorkflowGraph />
    </Suspense>
  )
) : ( /* ... results tab ... */ )}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `reactflow` package | `@xyflow/react` (v12) | React Flow 12 release (2024) | Import from `@xyflow/react`, CSS from `@xyflow/react/dist/style.css` |
| `node.parentNode` | `node.parentId` | React Flow 11.11.0 / v12 | v12 uses `parentId` for parent-child relationships |
| `node.width/height` | `node.measured.width/height` | React Flow v12 | Layout libraries should read dimensions from `node.measured` (but dagre layout uses explicit widths, so this doesn't affect us) |
| `position: absolute` node types | `type: 'group'` for containers | React Flow v10+ | Group nodes provide built-in parent-child positioning |

**Deprecated/outdated:**
- `parentNode` property: Deprecated in favor of `parentId` since v11.11.0. Use `parentId` exclusively.
- `reactflow` npm package: Renamed to `@xyflow/react`. Project already uses the new package.

## Open Questions

1. **Should steps be individual nodes or just rendered as a list inside the job node?**
   - What we know: GRAPH-04 says "Steps displayed as sequential nodes within job containers." This implies actual React Flow nodes with `parentId`, not just HTML list items inside the job node component.
   - What's unclear: Whether step nodes need handles (connecting edges) or are purely visual.
   - Recommendation: Implement steps as React Flow nodes with `parentId` for correctness with GRAPH-04. No handles needed since steps are sequential, not independently connected. If performance is an issue with many steps, can simplify later.

2. **How to compute per-step violation status without line range data?**
   - What we know: `GhaUnifiedViolation` has `line` and `column` but the graph data extractor works with JSON (no line numbers). The YAML parser's `lineCounter` is available.
   - What's unclear: Whether to pass the parsed document + lineCounter to the graph extractor or use a heuristic.
   - Recommendation: Accept the parsed YAML document and lineCounter alongside JSON, similar to how `GhaRuleContext` works. Use `getNodeLine()` from `parser.ts` to find line ranges for each job/step, then match violations by line range. Alternatively, for simplicity, aggregate violations at job level only (all steps in a job share the job's status) -- this is simpler and still satisfies GRAPH-05.

3. **Edge labels: show "needs" text or keep clean?**
   - What we know: Compose graph shows `condition` labels (e.g., "service_healthy"). K8s graph shows edge type labels (e.g., "selects", "mounts").
   - What's unclear: Whether GHA `needs:` edges need labels (it's obvious from context).
   - Recommendation: Show labels only on trigger edges (event name). Omit labels on `needs:` edges for cleaner visuals -- the dependency direction is self-evident from the layout. This can be adjusted based on user feedback.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.0.18 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run src/lib/tools/gha-validator/__tests__/gha-graph-data-extractor.test.ts` |
| Full suite command | `npx vitest run src/lib/tools/gha-validator/` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GRAPH-01 | Three node types extracted from workflow JSON | unit | `npx vitest run src/lib/tools/gha-validator/__tests__/gha-graph-data-extractor.test.ts -x` | Wave 0 |
| GRAPH-02 | Job dependency edges from needs: with cycle detection | unit | `npx vitest run src/lib/tools/gha-validator/__tests__/gha-graph-data-extractor.test.ts -x` | Wave 0 |
| GRAPH-03 | Trigger-to-job edges from on: events | unit | `npx vitest run src/lib/tools/gha-validator/__tests__/gha-graph-data-extractor.test.ts -x` | Wave 0 |
| GRAPH-04 | Steps as sequential nodes within job containers | unit + manual | Unit test verifies parentJobId and stepIndex; manual verifies visual nesting | Wave 0 |
| GRAPH-05 | Color-coded nodes by violation status | unit + manual | Unit test verifies violationStatus computation; manual verifies colors | Wave 0 |
| GRAPH-06 | React.lazy loading (separate chunk) | manual-only | `npm run build` and verify chunk splitting in dist output | N/A |
| GRAPH-07 | dagre LR layout with grouped dependency levels | manual-only | Visual inspection of layout direction and grouping | N/A |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/tools/gha-validator/__tests__/gha-graph-data-extractor.test.ts -x`
- **Per wave merge:** `npx vitest run src/lib/tools/gha-validator/`
- **Phase gate:** Full suite green + manual visual verification of graph rendering, layout direction, node types, and color coding

### Wave 0 Gaps
- [ ] `src/lib/tools/gha-validator/__tests__/gha-graph-data-extractor.test.ts` -- covers GRAPH-01, GRAPH-02, GRAPH-03, GRAPH-04, GRAPH-05
- Framework and test infrastructure already in place (vitest.config.ts, existing test files in `__tests__/`)

## Sources

### Primary (HIGH confidence)
- **Existing codebase** (all patterns verified by reading source files):
  - `src/components/tools/compose-results/DependencyGraph.tsx` -- React Flow + dagre layout pattern, cycle-safe layout, lazy loading
  - `src/components/tools/k8s-results/K8sResourceGraph.tsx` -- React Flow + dagre pattern, custom nodes, legend
  - `src/components/tools/compose-results/ServiceNode.tsx` -- Custom node component pattern (Handle, Position, NodeProps)
  - `src/components/tools/compose-results/DependencyEdge.tsx` -- Custom edge with labels (BaseEdge, EdgeLabelRenderer, getSmoothStepPath)
  - `src/components/tools/k8s-results/K8sResourceNode.tsx` -- Custom node with category colors
  - `src/components/tools/k8s-results/K8sRelationshipEdge.tsx` -- Custom edge with type labels
  - `src/components/tools/k8s-results/k8s-graph.css` -- Dark theme CSS overrides for React Flow
  - `src/components/tools/compose-results/dependency-graph.css` -- Dark theme CSS overrides for React Flow
  - `src/components/tools/compose-results/GraphSkeleton.tsx` -- Loading skeleton pattern
  - `src/components/tools/k8s-results/K8sGraphSkeleton.tsx` -- Loading skeleton pattern
  - `src/components/tools/K8sResultsPanel.tsx` -- lazy() + Suspense pattern (line 21, 219-221)
  - `src/components/tools/ComposeResultsPanel.tsx` -- lazy() + Suspense pattern (line 19, 199-204)
  - `src/components/tools/GhaResultsPanel.tsx` -- Graph tab placeholder (line 185-191)
  - `src/lib/tools/compose-validator/graph-builder.ts` -- Kahn's algorithm cycle detection
  - `src/lib/tools/compose-validator/graph-data-extractor.ts` -- Data extraction separation pattern
  - `src/lib/tools/gha-validator/engine.ts` -- Two-pass engine (runPass1, mergePass2)
  - `src/lib/tools/gha-validator/types.ts` -- GhaUnifiedViolation type
  - `src/stores/ghaValidatorStore.ts` -- ghaResult atom
- `@xyflow/react` v12.10.1 -- Verified installed version in node_modules
- `@dagrejs/dagre` v2.0.4 -- Verified installed version in node_modules

### Secondary (MEDIUM confidence)
- [React Flow dagre example](https://reactflow.dev/examples/layout/dagre) -- Dagre layout configuration, `rankdir: 'LR'`, node positioning
- [React Flow sub-flows docs](https://reactflow.dev/learn/layouting/sub-flows) -- `parentId`, relative positioning, parent node ordering requirement
- [dagre API / graph options](https://github.com/dagrejs/dagre/wiki) -- `rankdir`, `nodesep`, `ranksep` configuration

### Tertiary (LOW confidence)
- [React Flow v12 migration guide](https://reactflow.dev/learn/troubleshooting/migrate-to-v12) -- `parentNode` to `parentId` rename (verified by project already using v12)
- [GitHub discussion on dagre subflows](https://github.com/xyflow/xyflow/discussions/2968) -- Dagre limitation with sub-flows connected to external nodes (workaround: two-pass layout)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All libraries already installed and verified in node_modules; identical stack used by 2 other graph implementations in the project
- Architecture: HIGH -- All patterns (data extractor, custom nodes, dagre layout, lazy loading, dark theme CSS) directly port from existing Compose/K8s graph implementations verified by reading source
- Pitfalls: HIGH -- Identified from direct analysis of dagre behavior with cycles (DependencyGraph.tsx), React Flow parent-child ordering (official docs), and CSS import patterns (ComposeResultsPanel.tsx, K8sResultsPanel.tsx)

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (stable; all dependencies already locked in package.json)
