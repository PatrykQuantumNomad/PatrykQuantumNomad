# Phase 92: Interactive React Components - Research

**Researched:** 2026-03-10
**Domain:** React Flow interactive visualizers for Claude Code permission evaluation and hook event sequences, embedded in Astro via client:visible
**Confidence:** HIGH

## Summary

Phase 92 requires two interactive React Flow components: a permission flow explorer (INTV-01) and a hook event visualizer (INTV-02). The project already has extensive React Flow infrastructure -- `@xyflow/react@^12.10.1` with `@dagrejs/dagre@^2.0.4` are installed and actively used across five existing React Flow components (DeploymentTopology, DependencyGraph, K8sResourceGraph, GhaWorkflowGraph, plus their custom nodes). The established pattern is well-defined: a `.tsx` component file with static node/edge data, dagre layout, custom node types defined at module scope, CSS custom property theming via a companion `.css` file, and lazy loading via Astro's `client:visible` directive in MDX.

The domain data for both components was verified and implemented during Phase 91. The permission model uses a deny-then-ask-then-allow evaluation chain with three diamond decision nodes (from `permission-model.ts`), and the hook lifecycle has 18 events grouped into Session Events (2), Loop Events (12), and Standalone Async Events (4) (from `hook-lifecycle.ts`). Phase 92 transforms these static SVG representations into interactive React Flow visualizers where clicking nodes reveals additional detail -- evaluation path context for permissions and payload structure for hook events.

The key architectural decision is how to handle click-to-reveal interaction. React Flow v12 provides `onNodeClick` at the ReactFlow component level and supports arbitrary interactive elements inside custom nodes (using the `nodrag` CSS class). The recommended approach is component-local `useState` to track the selected node, with the detail panel rendered as a sibling element below the React Flow canvas (not inside the flow). This avoids complex state management libraries and follows the pattern already established by the existing `DependencyGraph` component which conditionally renders content based on graph state.

**Primary recommendation:** Follow the existing DeploymentTopology pattern exactly -- one `.tsx` component per visualizer in `src/components/guide/`, one custom node type per component in a subfolder, a companion CSS file for React Flow theme overrides, dagre for layout, and `client:visible` in MDX for lazy hydration. Use `useState` for selected-node tracking with a detail panel below the canvas.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INTV-01 | Interactive permission flow explorer (React Flow clickable decision tree with allow/ask/deny paths) | Domain data verified in Phase 91 permission-model.ts: 3 diamond decision nodes for deny/ask/allow evaluation chain, tool tiers, settings precedence, permission modes. React Flow provides onNodeClick and custom node types for click-to-reveal interaction. |
| INTV-02 | Interactive hook event visualizer (React Flow event sequence with payload reveal on click) | Domain data verified in Phase 91 hook-lifecycle.ts: 18 events across 3 categories (Session/Loop/Standalone Async). PreToolUse has CAN BLOCK capability. React Flow custom nodes with onClick handlers can reveal payload structures per event. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @xyflow/react | ^12.10.1 | Interactive node-based flow diagrams | Already installed; 5 existing React Flow components in codebase |
| @dagrejs/dagre | ^2.0.4 | Automatic graph layout (top-to-bottom) | Already installed; used by DeploymentTopology and DependencyGraph |
| react | ^19.2.4 | UI framework for interactive islands | Already installed; Astro React integration configured |
| react-dom | ^19.2.4 | React DOM renderer | Already installed |
| @astrojs/react | ^4.4.2 | Astro React integration for client:visible hydration | Already installed and configured in astro.config.mjs |
| TypeScript | ^5.9.3 | Type safety for component props and node data | Already in use across all React Flow components |
| vitest | ^4.0.18 | Unit testing | Already configured with 59+ passing tests |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @xyflow/react/dist/style.css | N/A | Base React Flow styles | Import in each component file (established pattern) |
| CSS custom properties | N/A | Dark/light theme support | Every color in nodes and edges uses var(--color-*) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| React Flow | D3.js interactive SVG | Would require building pan/zoom/drag from scratch; React Flow provides this out of the box |
| React Flow | Mermaid.js | No click-to-reveal interaction, no custom node types, limited styling control |
| dagre | elkjs | More capable layout engine but heavier bundle; dagre is already installed and proven |
| useState (local) | Zustand/nanostores | Overkill for single-component selected-node state; existing components use local state |

**Installation:**
No new packages needed. All dependencies are already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/guide/
    PermissionFlowExplorer.tsx         # INTV-01 main component
    permission-flow/
      PermissionDecisionNode.tsx       # Custom diamond-shaped decision node
      PermissionResultNode.tsx         # Custom result node (BLOCKED/Prompt/ALLOWED)
      PermissionDetailPanel.tsx        # Detail panel shown on node click
      permission-flow.css              # React Flow theme overrides
    HookEventVisualizer.tsx            # INTV-02 main component
    hook-events/
      HookEventNode.tsx                # Custom event node (with highlight for PreToolUse)
      HookCategoryNode.tsx             # Group header node for event categories
      HookDetailPanel.tsx              # Payload detail panel shown on event click
      hook-events.css                  # React Flow theme overrides
  lib/guides/interactive-data/
    permission-flow-data.ts            # Node/edge definitions + detail content for INTV-01
    hook-event-data.ts                 # Node/edge definitions + payload data for INTV-02
    __tests__/
      permission-flow-data.test.ts     # Data integrity tests
      hook-event-data.test.ts          # Data integrity tests
```

### Pattern 1: React Flow Interactive Component with Click-to-Reveal
**What:** A React Flow component that tracks which node is selected via `useState` and renders a detail panel below the canvas when a node is clicked.
**When to use:** Both INTV-01 and INTV-02.
**Example:**
```typescript
// Source: Derived from existing DeploymentTopology.tsx pattern + React Flow docs
import { useState, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from '@dagrejs/dagre';

import { PermissionDecisionNode } from './permission-flow/PermissionDecisionNode';
import { PermissionResultNode } from './permission-flow/PermissionResultNode';
import { PermissionDetailPanel } from './permission-flow/PermissionDetailPanel';
import { nodes, edges, detailContent } from '../../lib/guides/interactive-data/permission-flow-data';
import './permission-flow/permission-flow.css';

// Define nodeTypes at module scope to prevent re-registration
const nodeTypes = {
  decision: PermissionDecisionNode,
  result: PermissionResultNode,
};

function PermissionFlowExplorer() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId((prev) => (prev === node.id ? null : node.id));
  }, []);

  const detail = selectedNodeId ? detailContent[selectedNodeId] : null;

  return (
    <div className="permission-flow-explorer">
      <div className="h-[400px] lg:h-[500px] rounded-lg overflow-hidden border border-[var(--color-border,rgba(255,255,255,0.1))]">
        <ReactFlow
          nodes={layoutedNodes}
          edges={layoutedEdges}
          nodeTypes={nodeTypes}
          onNodeClick={handleNodeClick}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          proOptions={{ hideAttribution: true }}
          minZoom={0.3}
          maxZoom={2}
          nodesDraggable
          nodesConnectable={false}
          elementsSelectable
        >
          <Controls showInteractive={false} position="bottom-right" />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(255,255,255,0.05)" />
        </ReactFlow>
      </div>
      {detail && <PermissionDetailPanel content={detail} onClose={() => setSelectedNodeId(null)} />}
    </div>
  );
}

export default PermissionFlowExplorer;
```

### Pattern 2: Custom Node with Visual Selection State
**What:** Custom React Flow nodes that visually indicate when they are selected/active, using the `selected` prop that React Flow injects into every custom node.
**When to use:** All custom nodes in INTV-01 and INTV-02.
**Example:**
```typescript
// Source: Derived from existing TopologyNode.tsx + React Flow custom nodes docs
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';

export type DecisionNodeData = {
  label: string;
  description: string;
  outcome: 'deny' | 'ask' | 'allow';
};

export type DecisionNodeType = Node<DecisionNodeData, 'decision'>;

export function PermissionDecisionNode({ data, selected }: NodeProps<DecisionNodeType>) {
  return (
    <div
      className={`px-3 py-2 rounded-lg border text-sm cursor-pointer transition-all ${
        selected ? 'ring-2 ring-[var(--color-accent,#c44b20)]' : ''
      }`}
      style={{
        borderColor: selected
          ? 'var(--color-accent, #c44b20)'
          : 'var(--color-border, rgba(255,255,255,0.1))',
        backgroundColor: 'var(--color-surface-alt, rgba(0,0,0,0.4))',
        // Diamond shape via clip-path for decision nodes
        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
        width: '120px',
        height: '80px',
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-[var(--color-accent,#c44b20)]" />
      <div className="flex items-center justify-center h-full">
        <span className="font-bold text-[var(--color-text-primary,#e0e0e0)] text-xs text-center">
          {data.label}
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-[var(--color-accent,#c44b20)]" />
    </div>
  );
}
```

### Pattern 3: Detail Panel Below Canvas
**What:** A collapsible panel rendered below the React Flow canvas (not inside the flow) that shows contextual detail about the selected node. This keeps the flow clean and provides enough space for explanatory content.
**When to use:** Both INTV-01 (permission evaluation context) and INTV-02 (hook payload structure).
**Example:**
```typescript
// Source: New pattern for this project
interface DetailPanelProps {
  content: {
    title: string;
    description: string;
    details: Array<{ key: string; value: string }>;
  };
  onClose: () => void;
}

export function PermissionDetailPanel({ content, onClose }: DetailPanelProps) {
  return (
    <div className="mt-3 p-4 rounded-lg border border-[var(--color-border,rgba(255,255,255,0.1))] bg-[var(--color-surface,#1a1a2e)]">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-[var(--color-text-primary,#e0e0e0)] text-sm">
          {content.title}
        </h4>
        <button
          onClick={onClose}
          className="text-[var(--color-text-secondary,#a0a0a0)] hover:text-[var(--color-text-primary,#e0e0e0)] text-xs"
          aria-label="Close detail panel"
        >
          Close
        </button>
      </div>
      <p className="text-xs text-[var(--color-text-secondary,#a0a0a0)] mb-2">
        {content.description}
      </p>
      <dl className="grid grid-cols-2 gap-1 text-xs">
        {content.details.map((d) => (
          <div key={d.key}>
            <dt className="text-[var(--color-text-secondary,#a0a0a0)]">{d.key}</dt>
            <dd className="text-[var(--color-text-primary,#e0e0e0)] font-mono">{d.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
```

### Pattern 4: Astro MDX Integration with client:visible
**What:** Import the React Flow component in MDX and hydrate it lazily when the reader scrolls to it.
**When to use:** Every interactive React Flow component in guide chapters.
**Example:**
```mdx
---
title: "Models, Cost Economics & Permissions"
description: "..."
order: 3
slug: "models-and-costs"
---

import PermissionFlowExplorer from '../../../../components/guide/PermissionFlowExplorer';

## Permission Evaluation

The permission system evaluates tool calls in a strict order: deny rules first, then ask rules, then allow rules.

<PermissionFlowExplorer client:visible />
```

### Pattern 5: Data Separation from Components
**What:** Node/edge definitions and detail content are stored in separate data files under `src/lib/guides/interactive-data/`, not inline in the component. This enables unit testing of data integrity independently from React rendering.
**When to use:** Both INTV-01 and INTV-02.
**Example:**
```typescript
// src/lib/guides/interactive-data/permission-flow-data.ts
import type { Node, Edge } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';

// Node and edge data for the permission flow explorer
export const rawNodes: Node[] = [
  {
    id: 'entry',
    type: 'input',
    position: { x: 0, y: 0 },
    data: { label: 'Tool Call Request' },
  },
  {
    id: 'deny-check',
    type: 'decision',
    position: { x: 0, y: 0 },
    data: { label: 'Deny rules match?', outcome: 'deny' },
  },
  // ... more nodes
];

export const rawEdges: Edge[] = [
  {
    id: 'e-entry-deny',
    source: 'entry',
    target: 'deny-check',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#888' },
    label: '',
  },
  // ... more edges with Yes/No labels
];

// Detail content revealed when a node is clicked
export const detailContent: Record<string, {
  title: string;
  description: string;
  details: Array<{ key: string; value: string }>;
}> = {
  'deny-check': {
    title: 'Deny Rule Evaluation',
    description: 'Deny rules are evaluated first and always take precedence. If any deny rule matches the tool call, it is immediately blocked.',
    details: [
      { key: 'Evaluation Order', value: '1st (highest priority)' },
      { key: 'On Match', value: 'Tool call rejected immediately' },
      { key: 'Rule Syntax', value: 'Tool(specifier) with glob patterns' },
      { key: 'Example', value: 'Bash(rm -rf *)' },
    ],
  },
  // ... more detail content
};
```

### Anti-Patterns to Avoid
- **Defining nodeTypes inside the component function:** This causes re-registration on every render and degrades performance. Always define `const nodeTypes = { ... }` at module scope (already established in all 5 existing React Flow components).
- **Embedding detail content in custom nodes:** Placing large content blocks inside React Flow nodes makes the flow visually cluttered and hard to interact with. Use a detail panel below the canvas instead.
- **Hardcoded hex colors in node styles:** Use CSS custom property variables (`var(--color-*)`) for theme support, matching the deployment-topology.css pattern.
- **Using nodesConnectable={true}:** These are read-only visualizers, not editors. Always set `nodesConnectable={false}` to prevent users from adding connections.
- **Heavy state management (Zustand/Redux):** A single `useState<string | null>` for selected node ID is sufficient. The existing codebase uses local state for all React Flow components.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Graph layout | Manual x/y coordinate calculation | dagre auto-layout | Already proven in 4 existing components; handles variable node sizes |
| Pan/zoom/drag | Custom touch/mouse handlers | ReactFlow built-in | Handles touch, mouse, trackpad; responsive to viewport resize |
| Node selection state | Custom selection tracking | ReactFlow `selected` prop on NodeProps | Automatically injected; handles multi-select, deselect, keyboard |
| Edge routing | Manual SVG path calculation | ReactFlow edge rendering | Handles smoothstep, bezier, straight edge types with markers |
| Theme dark/light | Per-component color switching | CSS custom property variables + companion CSS | System already works across all existing components |
| Lazy hydration | Custom IntersectionObserver | Astro `client:visible` directive | Framework-level optimization; zero custom code |

**Key insight:** React Flow provides the entire interactive graph infrastructure. The Phase 92 work is defining node/edge data, custom node visuals, and click-to-reveal detail content -- not building graph interaction from scratch.

## Common Pitfalls

### Pitfall 1: nodeTypes Defined Inside Component Causing Re-renders
**What goes wrong:** If `nodeTypes` is defined inside the component function, React Flow re-registers all node type components on every render, causing flicker and performance degradation.
**Why it happens:** React creates a new object reference on each render, and React Flow compares by reference.
**How to avoid:** Always define `const nodeTypes = { ... }` at module scope, outside the component function. All 5 existing React Flow components in this codebase follow this pattern.
**Warning signs:** Console warnings about node type re-registration; visual flicker when interacting with the flow.

### Pitfall 2: React Flow CSS Import Missing
**What goes wrong:** Nodes render but have no visible borders, handles are invisible, controls panel is unstyled.
**Why it happens:** Forgetting to import `@xyflow/react/dist/style.css` in the component file.
**How to avoid:** Every React Flow component file must include `import '@xyflow/react/dist/style.css';` at the top. The companion CSS file (e.g., `permission-flow.css`) provides theme overrides on top of these base styles.
**Warning signs:** Nodes appear as plain divs; zoom controls are missing.

### Pitfall 3: Container Height Not Set
**What goes wrong:** React Flow renders as a zero-height element (invisible).
**Why it happens:** ReactFlow requires its parent container to have an explicit height. Without it, the canvas collapses.
**How to avoid:** Always wrap ReactFlow in a div with an explicit height class: `className="h-[400px] lg:h-[500px]"`. All existing components use this pattern.
**Warning signs:** Component mounts but nothing is visible; no console errors.

### Pitfall 4: client:visible Not Applied in MDX
**What goes wrong:** The React Flow component loads eagerly on page load, adding ~120KB to the initial bundle and hurting page performance.
**Why it happens:** Forgetting the `client:visible` directive or using `client:load` instead.
**How to avoid:** Always use `<ComponentName client:visible />` in MDX files. This is a success criterion for this phase: "Both components load via client:visible (lazy) and do not impact page load performance."
**Warning signs:** Large JavaScript bundle in Lighthouse report; React Flow code visible in initial page source.

### Pitfall 5: Diamond Node Shape Rendering Issues
**What goes wrong:** Diamond-shaped decision nodes in INTV-01 have clipped content or misaligned handles.
**Why it happens:** Using CSS `clip-path: polygon(...)` cuts off Handle elements and text that extend beyond the diamond boundary.
**How to avoid:** Use the diamond shape as a visual indicator (a rotated square div or an inline SVG diamond) inside a regular rectangular node container. The handles attach to the rectangular container while the diamond is purely decorative. Alternatively, use a background SVG within the node div.
**Warning signs:** Handles are invisible or non-functional; text is cut off at diamond edges.

### Pitfall 6: Stale Domain Data from Phase 91
**What goes wrong:** Interactive components show different data than the static SVG diagrams, causing reader confusion.
**Why it happens:** Duplicating the domain data instead of referencing a shared source.
**How to avoid:** Define domain data in `src/lib/guides/interactive-data/` with clear references to the verified sources from Phase 91 research. Cross-check: permission model uses 3 decision nodes (deny/ask/allow), hook lifecycle has 18 events (not 13 or 17 -- the 91-01-SUMMARY confirms 18 was the implemented count).
**Warning signs:** Diagram labels that differ between the SVG version and the interactive version.

## Code Examples

Verified patterns from existing codebase:

### React Flow Component with dagre Layout (Existing Pattern)
```typescript
// Source: src/components/guide/DeploymentTopology.tsx
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  MarkerType,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from '@dagrejs/dagre';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 70;

function layoutGraph(
  nodes: Node[],
  edges: Edge[],
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 120 });
  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });
  edges.forEach((edge) => {
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
  return { nodes: layoutedNodes, edges };
}
```

### Custom Node with Theme Variables (Existing Pattern)
```typescript
// Source: src/components/guide/topology/TopologyNode.tsx
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';

export type TopologyNodeData = {
  label: string;
  subtitle?: string;
  icon: 'app' | 'db' | 'cache' | 'proxy';
};

export type TopologyNodeType = Node<TopologyNodeData, 'topology'>;

export function TopologyNode({ data }: NodeProps<TopologyNodeType>) {
  return (
    <div
      className="px-3 py-2 rounded-lg border text-sm w-[200px]"
      style={{
        borderColor: iconInfo.color,
        backgroundColor: 'var(--color-surface-alt, rgba(0,0,0,0.4))',
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-[var(--color-accent,#c44b20)]" />
      {/* ... content ... */}
      <Handle type="source" position={Position.Bottom} className="!bg-[var(--color-accent,#c44b20)]" />
    </div>
  );
}
```

### React Flow CSS Theme Overrides (Existing Pattern)
```css
/* Source: src/components/guide/topology/deployment-topology.css */
.deployment-topology .react-flow {
  --xy-background-color: transparent;
  --xy-node-color: var(--color-text-primary, #e0e0e0);
  --xy-edge-stroke: var(--color-text-secondary, #888);
  --xy-edge-stroke-selected: var(--color-accent, #c44b20);
  --xy-connectionline-stroke: var(--color-accent, #c44b20);
  --xy-attribution-background-color: transparent;
}

.deployment-topology .react-flow__controls button {
  background-color: var(--color-surface, #1a1a2e);
  border-color: var(--color-border, rgba(255, 255, 255, 0.1));
  color: var(--color-text-primary, #e0e0e0);
  fill: var(--color-text-primary, #e0e0e0);
}

.deployment-topology .react-flow__controls button:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.deployment-topology .react-flow__attribution {
  display: none;
}
```

### MDX Usage with client:visible (Existing Pattern)
```mdx
<!-- Source: src/data/guides/fastapi-production/pages/docker.mdx -->
import DeploymentTopology from '../../../../components/guide/DeploymentTopology';

<DeploymentTopology client:visible />
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| reactflow (default import) | @xyflow/react (named imports) | React Flow v12 (2024) | Import as `import { ReactFlow } from '@xyflow/react'` |
| node.width/height for layout | node.measured.width/height | React Flow v12 | Layout libraries must read from node.measured after RF measures |
| Custom expand/collapse logic | Built-in hidden attribute + custom hooks | React Flow v12 | Can use node.hidden to toggle visibility |
| SSE transport for MCP | HTTP Streamable transport | 2025-2026 | Permission flow data should reflect current transport options |

**Deprecated/outdated:**
- `reactflow` package name: Replaced by `@xyflow/react` in v12. This project already uses the new package.
- `xPos`/`yPos` in NodeProps: Renamed to `positionAbsoluteX`/`positionAbsoluteY` in v12.
- `parentNode` prop: Renamed to `parentId` in v12.

## Open Questions

1. **Should the interactive components share data modules with the static SVG generators?**
   - What we know: The SVG generators in Phase 91 have hardcoded domain data inline (e.g., event names, decision labels). The interactive components need the same data plus additional detail content (descriptions, payload schemas).
   - What's unclear: Whether to extract shared constants (event names, evaluation order) into a common module or keep the data separate.
   - Recommendation: Create independent data files in `src/lib/guides/interactive-data/` for the interactive components. The data overlap is small (event names, decision labels) and the interactive components need significantly more detail (descriptions, payload schemas, examples). Duplication of a few string constants is preferable to coupling the SVG generators to the interactive data modules.

2. **What payload schemas should be shown for each hook event?**
   - What we know: Official docs at code.claude.com/docs/en/hooks describe the hook configuration schema and handler types (command, HTTP, prompt, agent). Each event fires with context data.
   - What's unclear: The exact JSON payload structure for each of the 18 events is not fully documented in a single place.
   - Recommendation: Show the common hook handler schema (the `hooks` settings object structure) plus event-specific fields where documented. For events without detailed payload docs, show the handler configuration schema and note "see official docs for event-specific payload fields." This is honest and avoids fabricating payload structures.

3. **Should the detail panel animate open/closed?**
   - What we know: The existing codebase uses Tailwind utility classes. GSAP is installed (`gsap@^3.14.2`) but only used by the HeadScene 3D component.
   - What's unclear: Whether animation adds value for an educational detail panel.
   - Recommendation: Use a simple CSS transition (`transition-all`) for the detail panel appearance. No GSAP needed. The panel should appear/disappear smoothly but animation is not a core requirement.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ^4.0.18 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run src/lib/guides/interactive-data/__tests__/ --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INTV-01 | Permission flow data has correct node structure, edge connections, and detail content | unit | `npx vitest run src/lib/guides/interactive-data/__tests__/permission-flow-data.test.ts -x` | Wave 0 |
| INTV-02 | Hook event data has all 18 events, correct categories, and payload descriptions | unit | `npx vitest run src/lib/guides/interactive-data/__tests__/hook-event-data.test.ts -x` | Wave 0 |
| INTV-01 | Permission flow explorer renders in Astro build (no build errors) | smoke | `npx astro build 2>&1 \| tail -5` | N/A (build test) |
| INTV-02 | Hook event visualizer renders in Astro build (no build errors) | smoke | `npx astro build 2>&1 \| tail -5` | N/A (build test) |
| INTV-01+02 | Components use client:visible directive (verified in MDX source) | manual-only | Verify MDX import uses `client:visible` directive | N/A |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/guides/interactive-data/__tests__/ --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green + production build succeeds before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/guides/interactive-data/__tests__/permission-flow-data.test.ts` -- covers INTV-01 data integrity
- [ ] `src/lib/guides/interactive-data/__tests__/hook-event-data.test.ts` -- covers INTV-02 data integrity
- [ ] `src/lib/guides/interactive-data/` directory -- needs to be created

No framework install needed -- vitest is already configured and running (59+ existing tests pass).

## INTV-01 Domain Data: Permission Flow Explorer

Source: Phase 91 `permission-model.ts` + https://code.claude.com/docs/en/permissions

### Decision Tree Structure
```
Tool Call Request
  |
  v
[Deny rules match?] --Yes--> BLOCKED (tool call rejected)
  |No
  v
[Ask rules match?] --Yes--> Prompt User (user approves/denies)
  |No
  v
[Allow rules match?] --Yes--> ALLOWED (tool call proceeds)
  |No
  v
Default: Ask
```

### Detail Content Per Node
- **Tool Call Request:** Claude attempts to use a tool (file read, bash command, file write, etc.)
- **Deny Check:** Deny rules evaluated first. Syntax: `Tool(specifier)` with glob patterns. Examples: `Bash(rm -rf *)`, `Edit(*.env)`
- **Ask Check:** Ask rules prompt the user for approval. Can be permanent (per-project) or session-scoped
- **Allow Check:** Allow rules auto-approve without prompting. Useful for trusted read-only operations
- **BLOCKED:** Tool call is immediately rejected. No user intervention possible
- **Prompt User:** User sees approval dialog. Options: Allow Once, Allow for Session, Allow for Project, Deny
- **ALLOWED:** Tool call proceeds without user interaction
- **Default: Ask:** If no rule matches, the default behavior is to ask the user

### Supplementary Data
- **Tool Tiers:** Read-only (no approval), Bash commands (permanent per project), File modification (session end)
- **Settings Precedence:** Managed > CLI > Local > Shared > User
- **Permission Modes:** default, acceptEdits, plan, dontAsk, bypassPermissions

## INTV-02 Domain Data: Hook Event Visualizer

Source: Phase 91 `hook-lifecycle.ts` + https://code.claude.com/docs/en/hooks

### Event Categories and Sequence
**Session Events (2):**
- SessionStart -- fires when session begins/resumes
- SessionEnd -- fires when session terminates

**Loop Events (12) -- fire repeatedly inside the agentic loop:**
1. UserPromptSubmit -- user submits a prompt
2. PreToolUse -- before tool call execution (CAN BLOCK -- only blocking hook)
3. PermissionRequest -- permission dialog appears
4. PostToolUse -- after tool call succeeds
5. PostToolUseFailure -- after tool call fails
6. Notification -- notification sent to user
7. SubagentStart -- subagent spawns
8. SubagentStop -- subagent finishes
9. Stop -- Claude finishes responding
10. TeammateIdle -- agent team teammate about to idle
11. TaskCompleted -- task marked completed
12. PreCompact -- before context compaction

**Standalone Async Events (4) -- fire independently:**
- InstructionsLoaded -- CLAUDE.md or rules file loaded
- ConfigChange -- configuration file changes
- WorktreeCreate -- worktree being created
- WorktreeRemove -- worktree being removed

### Detail Content Per Event (Payload Schemas)
Each event click should reveal:
- **Handler Types:** command, HTTP, prompt, agent
- **Configuration Location:** `.claude/hooks` section in settings
- **Common Fields:** event type, session context, timestamp
- **Event-Specific Fields:** e.g., PreToolUse includes tool_name, tool_input; PostToolUse includes tool_output, exit_code
- **Blocking Behavior:** Only PreToolUse can block (exit code 2 = block with message)
- **Exit Codes:** 0 = success (proceed), non-zero = error (logged but continues), 2 = block (PreToolUse only)

### Hook Configuration Schema
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Bash tool about to run'"
          }
        ]
      }
    ]
  }
}
```

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/components/guide/DeploymentTopology.tsx` -- established React Flow pattern with dagre, custom nodes, CSS theming, client:visible
- Existing codebase: `src/components/guide/topology/` -- custom node types, CSS override pattern
- Existing codebase: `src/components/tools/compose-results/DependencyGraph.tsx` -- dynamic React Flow with useMemo, conditional rendering
- Phase 91 outputs: `src/lib/guides/svg-diagrams/permission-model.ts` and `hook-lifecycle.ts` -- verified domain data
- https://reactflow.dev/learn/customization/custom-nodes -- Custom node creation, TypeScript types, nodrag class
- https://reactflow.dev/api-reference/react-flow -- onNodeClick, nodeTypes, fitView, proOptions props

### Secondary (MEDIUM confidence)
- https://reactflow.dev/examples/layout/expand-collapse -- Expand/collapse pattern concept (Pro example, code not fully accessible)
- https://reactflow.dev/learn/troubleshooting/migrate-to-v12 -- v12 breaking changes (node.measured, TypeScript generics)
- https://xyflow.com/blog/react-flow-12-release -- v12 new features (colorMode, SSR support)

### Tertiary (LOW confidence)
- None -- all findings verified against codebase and official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and actively used in 5+ existing components
- Architecture: HIGH -- following established patterns from DeploymentTopology.tsx and 4 other React Flow components in the codebase
- Pitfalls: HIGH -- identified from codebase analysis (5 existing components show exact patterns to follow and anti-patterns to avoid)
- Domain data: HIGH -- verified in Phase 91 against official docs at code.claude.com/docs, confirmed in implemented SVG generators

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable -- React Flow v12 API is mature; domain data from Phase 91 is verified)
