# Phase 46: Resource Relationship Graph - Research

**Researched:** 2026-02-23
**Domain:** React Flow graph visualization for Kubernetes resource relationships, dagre layout, cross-resource edge extraction, lazy loading
**Confidence:** HIGH

## Summary

Phase 46 replaces the Graph tab placeholder in K8sResultsPanel (created in Phase 45) with an interactive React Flow dependency graph showing relationships between K8s resources. The codebase already contains a complete reference implementation: the Compose Validator's DependencyGraph (`src/components/tools/compose-results/DependencyGraph.tsx`) which uses the same `@xyflow/react` v12.10.1 + `@dagrejs/dagre` v2.0.4 stack. Both libraries are already installed and proven in the Compose graph.

The critical architectural difference from the Compose graph is **where edge data comes from**. The Compose graph derives edges from `depends_on` declarations in the YAML (a single, explicit relationship type). The K8s resource graph has **six distinct relationship types** -- selector match (Service->Pod), volume mount (Workload->ConfigMap/Secret/PVC), envFrom (Workload->ConfigMap/Secret), Ingress backend (Ingress->Service), HPA target (HPA->Deployment/StatefulSet), and RBAC binding (RoleBinding->Role/ClusterRole). The cross-resource validation rules (KA-X001 through KA-X008) already implement the logic to detect these relationships, but they only emit violations for **broken** references. The graph needs to extract **all** relationships -- both resolved and dangling.

The key design decision is building a dedicated `graph-data-extractor.ts` module (following the Compose pattern of `graph-data-extractor.ts`) that walks the parsed resources and extracts all relationships. This module runs alongside validation but extracts edges independently -- it does not reuse rule violation data because: (1) rules only flag dangling references, not successful ones; (2) the graph needs edge type metadata (selector match vs volume mount vs envFrom etc.); (3) the graph needs source and target resource identifiers, not violation messages. The engine result already provides `resources: ParsedResource[]` and `resourceSummary: Map<string, number>`, and the extractor will use the same `ResourceRegistry` lookups the rules use to determine whether references are resolved or dangling.

GRAPH-04 (dangling references as red dashed edges) maps naturally to the extractor's output: edges where `resolved: false` render with red stroke and dashed strokeDasharray, matching the Compose graph's red cycle edges pattern. GRAPH-02 (color-coded nodes) groups the 19 supported K8s resource kinds into 6 categories: workloads (Deployment, StatefulSet, DaemonSet, Job, CronJob, Pod), services (Service, Ingress), config (ConfigMap, Secret), storage (PersistentVolumeClaim), RBAC (Role, ClusterRole, RoleBinding, ClusterRoleBinding, ServiceAccount), and scaling (HorizontalPodAutoscaler, NetworkPolicy, Namespace).

**Primary recommendation:** Follow the Compose DependencyGraph pattern exactly (lazy-loaded via `React.lazy()`, dagre layout, custom node/edge components, dark theme CSS). Build a `k8s-graph-data-extractor.ts` module that walks `ParsedResource[]` to extract all 6 relationship types as graph edges with resolved/dangling status. Create a `K8sResourceNode` custom node component with kind category color-coding, and a `K8sRelationshipEdge` custom edge component with type labels and red dashed styling for dangling references.

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@xyflow/react` | 12.10.1 | Interactive node-based graph UI | Already used by Compose DependencyGraph; 25K+ GitHub stars, MIT licensed, built-in pan/zoom/drag |
| `@dagrejs/dagre` | 2.0.4 | Hierarchical directed graph layout | Already used by Compose DependencyGraph; simple synchronous API for DAG layout |
| `react` | 19.x | UI framework | Already in project |

### Supporting (already installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `nanostores` | 1.x | `k8sResult` store provides engine result to graph | Already used for K8s analyzer state |
| `@nanostores/react` | 1.x | `useStore` hook for reactive store access | Already used in K8sResultsPanel |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@dagrejs/dagre` | `elkjs` | elkjs produces better layouts for complex graphs but is 1.4 MB gzip (35x larger). Overkill for typical K8s manifests with 5-30 resources. Dagre is already proven in the Compose graph. |
| Separate graph data extractor | Reuse cross-resource rule violation data | Rules only emit violations for dangling references, not resolved ones. The graph needs ALL relationships. Also, rules don't produce structured edge metadata (type, source ID, target ID). Building a dedicated extractor is cleaner. |
| Custom node component | Default React Flow nodes | K8s nodes need kind-specific color coding (6 categories) and resource metadata display (kind, name, namespace). Default nodes only show a label. |
| Per-edge-type styling | Single edge style | GRAPH-03 requires visible edge type differentiation (selector match vs volume mount etc.) and GRAPH-04 requires dangling edges to be red dashed. Custom edge component needed. |

**Installation:**
```bash
# No new npm installs needed -- @xyflow/react and @dagrejs/dagre already in package.json
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  lib/tools/k8s-analyzer/
    k8s-graph-data-extractor.ts     # NEW: Extract all relationships from ParsedResource[]
  components/tools/
    k8s-results/
      K8sResourceGraph.tsx          # NEW: Lazy-loaded React Flow graph (default export)
      K8sResourceNode.tsx           # NEW: Custom node component with kind color-coding
      K8sRelationshipEdge.tsx       # NEW: Custom edge with type label + dangling styling
      K8sGraphSkeleton.tsx          # NEW: Suspense fallback (fork of GraphSkeleton)
      k8s-graph.css                 # NEW: Dark theme overrides (fork of dependency-graph.css)
    K8sResultsPanel.tsx             # MODIFIED: Replace placeholder with lazy-loaded graph
```

### Pattern 1: Graph Data Extraction (All 6 Relationship Types)
**What:** A dedicated module that walks `ParsedResource[]` and the `ResourceRegistry` to extract all inter-resource relationships as typed graph edges. Each edge has: sourceKind, sourceName, targetKind, targetName, edgeType (one of 6 types), and resolved (boolean).
**When to use:** When the Graph tab is rendered after analysis.
**Key insight:** The Compose graph builder (`graph-builder.ts`) is a separate module from the Compose rules. Same pattern here: the K8s graph data extractor is separate from the K8s cross-resource rules.

```typescript
// src/lib/tools/k8s-analyzer/k8s-graph-data-extractor.ts

import type { ParsedResource, ResourceRegistry } from './types';
import { getPodSpec, getContainerSpecs } from './container-helpers';
import { TEMPLATE_LABEL_PATHS } from './rules/cross-resource/KA-X001-service-selector-mismatch';
import {
  WELL_KNOWN_CONFIGMAPS,
  WELL_KNOWN_SECRETS,
  WELL_KNOWN_PVCS,
  WELL_KNOWN_SERVICE_ACCOUNTS,
  WELL_KNOWN_SERVICES,
} from './rules/cross-resource/well-known-resources';

/** The 6 edge types matching GRAPH-03 requirements. */
export type K8sEdgeType =
  | 'selector-match'    // Service/NetworkPolicy -> workload via label selectors
  | 'volume-mount'      // Workload -> ConfigMap/Secret/PVC via volumes
  | 'env-from'          // Workload -> ConfigMap/Secret via envFrom/env.valueFrom
  | 'ingress-backend'   // Ingress -> Service
  | 'hpa-target'        // HPA -> Deployment/StatefulSet
  | 'rbac-binding';     // RoleBinding -> Role/ClusterRole

/** A relationship edge between two K8s resources. */
export interface K8sGraphEdge {
  sourceId: string;   // "kind/namespace/name" of source resource
  targetId: string;   // "kind/namespace/name" of target resource (may not exist)
  targetKind: string; // Kind of the target resource
  targetName: string; // Name of the target resource
  edgeType: K8sEdgeType;
  resolved: boolean;  // true = target exists in manifest, false = dangling reference
  label?: string;     // Human-readable label (e.g., "configMap: app-config")
}

/** Node data for the React Flow graph. */
export interface K8sGraphNode {
  id: string;          // "kind/namespace/name"
  kind: string;
  name: string;
  namespace: string;
  category: K8sNodeCategory;
}

/** The 6 node categories for color-coding per GRAPH-02. */
export type K8sNodeCategory =
  | 'workload'   // Deployment, StatefulSet, DaemonSet, Job, CronJob, Pod
  | 'service'    // Service, Ingress
  | 'config'     // ConfigMap, Secret
  | 'storage'    // PersistentVolumeClaim
  | 'rbac'       // Role, ClusterRole, RoleBinding, ClusterRoleBinding, ServiceAccount
  | 'scaling';   // HorizontalPodAutoscaler, NetworkPolicy, Namespace

export interface K8sGraphData {
  nodes: K8sGraphNode[];
  edges: K8sGraphEdge[];
  hasDanglingRefs: boolean;
}

const KIND_TO_CATEGORY: Record<string, K8sNodeCategory> = {
  Deployment: 'workload',
  StatefulSet: 'workload',
  DaemonSet: 'workload',
  Job: 'workload',
  CronJob: 'workload',
  Pod: 'workload',
  Service: 'service',
  Ingress: 'service',
  ConfigMap: 'config',
  Secret: 'config',
  PersistentVolumeClaim: 'storage',
  Role: 'rbac',
  ClusterRole: 'rbac',
  RoleBinding: 'rbac',
  ClusterRoleBinding: 'rbac',
  ServiceAccount: 'rbac',
  HorizontalPodAutoscaler: 'scaling',
  NetworkPolicy: 'scaling',
  Namespace: 'scaling',
};

function resourceId(kind: string, namespace: string, name: string): string {
  return `${kind}/${namespace}/${name}`;
}

/**
 * Extract all inter-resource relationships from parsed K8s resources.
 * Returns nodes (one per resource) and edges (one per relationship).
 * Dangling references (target not in manifest) produce edges with resolved=false.
 */
export function extractK8sGraphData(
  resources: ParsedResource[],
  registry: ResourceRegistry,
): K8sGraphData {
  const nodes: K8sGraphNode[] = resources.map(r => ({
    id: resourceId(r.kind, r.namespace, r.name),
    kind: r.kind,
    name: r.name,
    namespace: r.namespace,
    category: KIND_TO_CATEGORY[r.kind] ?? 'scaling',
  }));

  const edges: K8sGraphEdge[] = [];
  const nodeIds = new Set(nodes.map(n => n.id));

  // 1. Service selector -> workload (selector-match)
  extractServiceSelectorEdges(resources, edges, nodeIds);

  // 2. Ingress -> Service (ingress-backend)
  extractIngressBackendEdges(resources, registry, edges, nodeIds);

  // 3. Workload -> ConfigMap via volumes/envFrom (volume-mount, env-from)
  extractConfigMapEdges(resources, registry, edges, nodeIds);

  // 4. Workload -> Secret via volumes/envFrom (volume-mount, env-from)
  extractSecretEdges(resources, registry, edges, nodeIds);

  // 5. Workload -> PVC via volumes (volume-mount)
  extractPvcEdges(resources, registry, edges, nodeIds);

  // 6. Workload -> ServiceAccount (env-from -- logically a pod-level ref)
  extractServiceAccountEdges(resources, registry, edges, nodeIds);

  // 7. HPA -> Deployment/StatefulSet (hpa-target)
  extractHpaTargetEdges(resources, registry, edges, nodeIds);

  // 8. RoleBinding/ClusterRoleBinding -> Role/ClusterRole (rbac-binding)
  extractRbacBindingEdges(resources, registry, edges, nodeIds);

  // 9. NetworkPolicy -> workloads via podSelector (selector-match)
  extractNetworkPolicySelectorEdges(resources, edges, nodeIds);

  const hasDanglingRefs = edges.some(e => !e.resolved);
  return { nodes, edges, hasDanglingRefs };
}

// Individual extraction functions follow same logic as cross-resource rules
// but capture ALL relationships (resolved + dangling), not just violations
```

### Pattern 2: Lazy-Loaded Graph Component (GRAPH-05)
**What:** The graph component (React Flow + dagre + custom nodes/edges + CSS) is lazy-loaded via `React.lazy()` exactly like the Compose DependencyGraph. This ensures the ~120KB React Flow bundle is not loaded until the user clicks the Graph tab.
**When to use:** Always -- GRAPH-05 requirement for Lighthouse 90+ scores.
**Source:** `src/components/tools/ComposeResultsPanel.tsx` line 17

```typescript
// In K8sResultsPanel.tsx:
import { lazy, Suspense } from 'react';
import { K8sGraphSkeleton } from './k8s-results/K8sGraphSkeleton';

const LazyK8sResourceGraph = lazy(() => import('./k8s-results/K8sResourceGraph'));

// In the graph tab rendering:
<Suspense fallback={<K8sGraphSkeleton />}>
  <LazyK8sResourceGraph result={result} />
</Suspense>
```

### Pattern 3: Custom K8s Resource Node (GRAPH-02)
**What:** A custom React Flow node component that displays resource kind, name, and namespace, with border color determined by the kind category (6 categories with distinct colors).
**When to use:** For every node in the K8s resource graph.
**Source:** Adapted from `src/components/tools/compose-results/ServiceNode.tsx`

```typescript
// src/components/tools/k8s-results/K8sResourceNode.tsx
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';

export type K8sResourceNodeData = {
  label: string;      // resource name
  kind: string;       // e.g., "Deployment"
  namespace: string;
  categoryColor: string;
};

export type K8sResourceNodeType = Node<K8sResourceNodeData, 'k8s-resource'>;

// GRAPH-02: Category color palette
export const CATEGORY_COLORS: Record<string, string> = {
  workload: '#3b82f6',  // blue (Deployment, StatefulSet, DaemonSet, Job, CronJob, Pod)
  service:  '#10b981',  // emerald (Service, Ingress)
  config:   '#f59e0b',  // amber (ConfigMap, Secret)
  storage:  '#8b5cf6',  // violet (PVC)
  rbac:     '#ef4444',  // red (Role, ClusterRole, RoleBinding, ClusterRoleBinding, SA)
  scaling:  '#06b6d4',  // cyan (HPA, NetworkPolicy, Namespace)
};

export function K8sResourceNode({ data }: NodeProps<K8sResourceNodeType>) {
  return (
    <div
      className="px-3 py-2 rounded-lg border text-sm w-[200px]"
      style={{
        borderColor: data.categoryColor,
        backgroundColor: 'var(--color-surface-alt, rgba(0,0,0,0.4))',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-[var(--color-accent,#c44b20)]"
      />
      <div
        className="text-[10px] font-mono uppercase tracking-wider mb-0.5"
        style={{ color: data.categoryColor }}
      >
        {data.kind}
      </div>
      <div className="font-bold text-[var(--color-text-primary,#e0e0e0)] truncate" title={data.label}>
        {data.label}
      </div>
      {data.namespace !== 'default' && (
        <div className="text-xs text-[var(--color-text-secondary,#a0a0a0)] truncate mt-0.5">
          ns: {data.namespace}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-[var(--color-accent,#c44b20)]"
      />
    </div>
  );
}
```

### Pattern 4: Custom Relationship Edge (GRAPH-03, GRAPH-04)
**What:** A custom edge component showing the relationship type as a label and rendering dangling references with red dashed strokes.
**When to use:** For every edge in the K8s resource graph.
**Source:** Adapted from `src/components/tools/compose-results/DependencyEdge.tsx`

```typescript
// src/components/tools/k8s-results/K8sRelationshipEdge.tsx
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
  type Edge,
} from '@xyflow/react';

export type K8sRelationshipEdgeData = {
  edgeType: string;
  isDangling: boolean;
  label?: string;
};

export type K8sRelationshipEdgeType = Edge<K8sRelationshipEdgeData, 'k8s-relationship'>;

// GRAPH-03: Edge type display labels
const EDGE_TYPE_LABELS: Record<string, string> = {
  'selector-match': 'selects',
  'volume-mount': 'mounts',
  'env-from': 'envFrom',
  'ingress-backend': 'routes to',
  'hpa-target': 'scales',
  'rbac-binding': 'binds',
};

export function K8sRelationshipEdge({
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data, markerEnd,
}: EdgeProps<K8sRelationshipEdgeType>) {
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const isDangling = data?.isDangling ?? false;

  return (
    <>
      <BaseEdge
        path={path}
        markerEnd={markerEnd}
        style={{
          stroke: isDangling ? '#ef4444' : 'var(--color-text-secondary, #888)',
          strokeWidth: isDangling ? 2 : 1.5,
          strokeDasharray: isDangling ? '6 3' : undefined,  // GRAPH-04: dashed for dangling
        }}
      />
      {data?.edgeType && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-surface,#1a1a2e)] border border-[var(--color-border,rgba(255,255,255,0.1))] text-[var(--color-text-secondary,#a0a0a0)]"
          >
            {EDGE_TYPE_LABELS[data.edgeType] ?? data.edgeType}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
```

### Pattern 5: Dagre Layout with Dangling Reference Handling
**What:** Dagre requires a DAG (directed acyclic graph). Dangling references point to nodes that do not exist in the manifest. These phantom targets must be added as special nodes (with a "dangling" flag) so dagre can position them. The Compose graph handles this with cycle detection -- same concept but for dangling targets instead of cycles.
**When to use:** When building the React Flow graph from K8sGraphData.
**Key insight:** For each dangling edge, create a ghost/phantom node for the missing target. These phantom nodes render with a red dashed border to visually indicate they are undefined.

```typescript
// Inside K8sResourceGraph.tsx:
function buildReactFlowGraph(graphData: K8sGraphData) {
  const nodeMap = new Map(graphData.nodes.map(n => [n.id, n]));

  // Collect phantom nodes for dangling targets
  const phantomNodes = new Map<string, K8sGraphNode>();
  for (const edge of graphData.edges) {
    if (!edge.resolved && !nodeMap.has(edge.targetId)) {
      phantomNodes.set(edge.targetId, {
        id: edge.targetId,
        kind: edge.targetKind,
        name: edge.targetName,
        namespace: edge.targetId.split('/')[1] ?? 'default',
        category: KIND_TO_CATEGORY[edge.targetKind] ?? 'scaling',
      });
    }
  }

  // Merge real nodes + phantom nodes
  const allNodes = [...graphData.nodes, ...phantomNodes.values()];
  // ... convert to React Flow nodes with phantom flag for styling
}
```

### Anti-Patterns to Avoid
- **Reusing violation data for graph edges:** Cross-resource rules only emit violations for dangling references. The graph needs ALL relationships (resolved + dangling). Build a separate extractor.
- **Not creating dagre graph fresh each render cycle:** The Compose graph uses a module-level `new dagre.graphlib.Graph()`, but with `useMemo`, the graph must be created fresh inside the memo function to avoid stale state. The Compose implementation creates the graph inside `layoutGraph()` function -- follow this pattern.
- **Registering nodeTypes/edgeTypes inside the component:** React Flow re-renders every time nodeTypes/edgeTypes changes. Declare them as module-level constants (proven in Compose DependencyGraph line 36-37).
- **Importing React Flow CSS at module top level:** Import CSS inside the lazy-loaded component file only. This ensures the ~8KB CSS is code-split with the graph bundle.
- **Skipping well-known resource filtering:** The graph data extractor must skip well-known resources (default ServiceAccount, kube-root-ca.crt ConfigMap) just like the cross-resource rules do. Otherwise, every workload using the default SA would show a dangling reference edge.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Graph layout algorithm | Manual node positioning | `@dagrejs/dagre` with `dagre.layout()` | Dagre handles directed graph hierarchical layout automatically. Manual positioning is error-prone for variable node counts. Already proven in Compose graph. |
| Interactive graph UI | Custom SVG with drag/zoom | `@xyflow/react` ReactFlow component | Built-in pan, zoom, drag, selection, fit view. ~120KB. Building from scratch would be 10x more code. |
| Edge routing | Manual path calculation | `getSmoothStepPath()` from `@xyflow/react` | Automatic smooth step edge routing between nodes. Already used by Compose DependencyEdge. |
| Edge labels | Custom SVG text elements | `EdgeLabelRenderer` from `@xyflow/react` | HTML-based labels positioned at edge midpoints. Avoids SVG text scaling issues. |
| Resource relationship extraction | Parsing violations text | Walk `ParsedResource[]` JSON with `getPodSpec`/`getContainerSpecs`/registry lookups | Violations are text messages. Graph needs structured data (source ID, target ID, edge type, resolved boolean). Reuse existing helpers. |
| Node category color mapping | Inline switch statements | `CATEGORY_COLORS` constant lookup by `KIND_TO_CATEGORY[kind]` | Clean constant-based mapping, easy to maintain. Same pattern as Compose `NETWORK_COLORS`. |

**Key insight:** The Compose DependencyGraph provides an exact template. Phase 46 is 80% adapting the Compose graph pattern with K8s-specific node/edge types, and 20% building the graph data extractor (which reuses helpers from the cross-resource rules).

## Common Pitfalls

### Pitfall 1: Graph Data Extraction Missing Resolved Relationships
**What goes wrong:** The graph only shows dangling references (red dashed edges) because the extractor reuses cross-resource violation data, which only contains dangling references.
**Why it happens:** Confusing "violations" with "relationships." Cross-resource rules emit violations only when references are broken. The graph needs all references.
**How to avoid:** Build a dedicated `k8s-graph-data-extractor.ts` that walks ALL resources and extracts ALL relationships. Check `registry.getByName()` to determine `resolved: true/false`, but emit an edge regardless.
**Warning signs:** Graph shows only red dashed edges; resolved references (e.g., Ingress -> existing Service) are missing.

### Pitfall 2: Dagre Crash on Phantom (Dangling) Nodes Without Edges
**What goes wrong:** Dagre ignores nodes with no edges, leaving phantom nodes unpositioned at (0,0).
**Why it happens:** Phantom nodes for dangling targets only have incoming edges. If dagre doesn't know about them, they pile up at the origin.
**How to avoid:** Always call `g.setNode()` for phantom nodes AND `g.setEdge()` for their incoming edges before calling `dagre.layout()`. The Compose graph's `layoutGraph` function adds all nodes and edges to dagre before calling layout.
**Warning signs:** Some nodes stack at position (0,0) in the top-left corner.

### Pitfall 3: Well-Known Resources Creating Noise
**What goes wrong:** Every workload shows a dangling red edge to "ServiceAccount/default/default" because the default ServiceAccount is not in the manifest.
**Why it happens:** The graph data extractor checks ServiceAccount references without consulting the well-known resources whitelist.
**How to avoid:** Import and use `WELL_KNOWN_SERVICE_ACCOUNTS`, `WELL_KNOWN_CONFIGMAPS`, `WELL_KNOWN_SECRETS`, `WELL_KNOWN_PVCS`, `WELL_KNOWN_SERVICES` from `well-known-resources.ts`. Skip these references in the extractor, exactly as the cross-resource rules do.
**Warning signs:** Multiple red dashed edges pointing to "default" ServiceAccount or "kube-root-ca.crt" ConfigMap.

### Pitfall 4: Duplicate Edges Between Same Resources
**What goes wrong:** A Deployment that mounts a ConfigMap via both a volume AND envFrom produces two edges to the same ConfigMap, cluttering the graph.
**Why it happens:** Multiple reference locations (volumes, envFrom, env.valueFrom) can reference the same target.
**How to avoid:** Deduplicate edges by source+target+type combination. Use a `Set` or `Map` keyed by `${sourceId}->${targetId}:${edgeType}` to prevent duplicates. The cross-resource rules already deduplicate by name per resource (KA-X003 uses a `seen` Map).
**Warning signs:** Multiple parallel edges between the same two nodes.

### Pitfall 5: RoleBinding Target Resolution Across Namespaces
**What goes wrong:** A namespaced RoleBinding references a ClusterRole (not a namespaced Role). The graph data extractor looks for `Role/namespace/name` and doesn't find it because the actual target is a ClusterRole.
**Why it happens:** RoleBinding's `roleRef.kind` can be either `Role` or `ClusterRole`. ClusterRoles are cluster-scoped (no namespace).
**How to avoid:** Check `roleRef.kind` to determine whether to look up `Role` (namespace-scoped) or `ClusterRole` (use empty namespace or skip namespace check). For ClusterRole lookups, use `registry.getByKind('ClusterRole')` and filter by name.
**Warning signs:** RoleBinding -> ClusterRole edges always show as dangling even when the ClusterRole is in the manifest.

### Pitfall 6: React Flow nodeTypes/edgeTypes Re-Creation
**What goes wrong:** The graph re-renders excessively, causing performance issues and flickering.
**Why it happens:** `nodeTypes` and `edgeTypes` objects are created inside the component body, causing React Flow to re-register them on every render.
**How to avoid:** Declare `nodeTypes` and `edgeTypes` as module-level constants outside the component function. This is already done correctly in the Compose DependencyGraph (lines 36-37).
**Warning signs:** Console warnings about "changing nodeTypes" or visible graph flickering.

### Pitfall 7: Large Graph Layout Performance
**What goes wrong:** Manifests with 20+ resources and many cross-references cause noticeable layout delay.
**Why it happens:** Dagre layout is O(V + E) but with many edges, it can take 50-100ms. Combined with React Flow rendering, this could cause a visible delay.
**How to avoid:** Wrap the entire graph computation in `useMemo` with proper dependencies (same as Compose DependencyGraph). The dagre layout runs once per analysis result, not per render. For typical K8s manifests (5-20 resources), this is not a concern. Only extreme manifests (50+ resources) might notice delay.
**Warning signs:** Graph tab is slow to render for large manifests.

### Pitfall 8: Missing Namespace for Cluster-Scoped Resources
**What goes wrong:** ClusterRole, ClusterRoleBinding, and Namespace resources have no namespace, but the `resourceId()` function expects one. This creates inconsistent IDs.
**Why it happens:** The `ParsedResource` type defaults namespace to `'default'` for all resources, but cluster-scoped resources (ClusterRole, ClusterRoleBinding, Namespace) are not truly in the `'default'` namespace.
**How to avoid:** The ResourceRegistry already defaults namespace to `'default'` when unspecified (`resource-registry.ts` line 116). The graph data extractor should use the same `resource.namespace` value consistently. The node ID `ClusterRole/default/admin` is fine as long as it is consistent between nodes and edges. The display can omit the namespace for cluster-scoped resources.
**Warning signs:** Edge references don't match node IDs because of inconsistent namespace handling.

## Code Examples

### Graph Data Extraction: Service Selector Match
```typescript
// Source: Adapted from KA-X001 rule logic
// Extracts Service -> workload edges (resolved when selector matches pod template labels)

function extractServiceSelectorEdges(
  resources: ParsedResource[],
  edges: K8sGraphEdge[],
  nodeIds: Set<string>,
): void {
  for (const resource of resources) {
    if (resource.kind !== 'Service') continue;

    const spec = resource.json.spec as Record<string, unknown> | undefined;
    const selector = spec?.selector as Record<string, string> | undefined;
    if (!selector || Object.keys(selector).length === 0) continue;

    const selectorEntries = Object.entries(selector);
    const sourceId = resourceId(resource.kind, resource.namespace, resource.name);

    // Find all matching workloads in the same namespace
    let foundMatch = false;
    for (const candidate of resources) {
      if (candidate.namespace !== resource.namespace) continue;
      const labelPath = TEMPLATE_LABEL_PATHS[candidate.kind];
      if (!labelPath) continue;

      // Navigate to template labels
      let current: unknown = candidate.json;
      for (const segment of labelPath) {
        if (current && typeof current === 'object' && !Array.isArray(current)) {
          current = (current as Record<string, unknown>)[segment];
        } else { current = undefined; break; }
      }
      const templateLabels = current as Record<string, string> | undefined;
      if (!templateLabels) continue;

      const allMatch = selectorEntries.every(([k, v]) => templateLabels[k] === v);
      if (allMatch) {
        const targetId = resourceId(candidate.kind, candidate.namespace, candidate.name);
        edges.push({
          sourceId,
          targetId,
          targetKind: candidate.kind,
          targetName: candidate.name,
          edgeType: 'selector-match',
          resolved: true,
          label: `selects ${candidate.kind}`,
        });
        foundMatch = true;
      }
    }

    // If no match found, the Service has a dangling selector
    // (This is already flagged by KA-X001, but the graph still needs the edge)
    // For dangling selectors, we don't create a phantom edge since there's no specific target
  }
}
```

### Graph Data Extraction: Ingress Backend
```typescript
// Source: Adapted from KA-X002 rule logic

function extractIngressBackendEdges(
  resources: ParsedResource[],
  registry: ResourceRegistry,
  edges: K8sGraphEdge[],
  nodeIds: Set<string>,
): void {
  for (const resource of resources) {
    if (resource.kind !== 'Ingress') continue;

    const spec = resource.json.spec as Record<string, unknown> | undefined;
    if (!spec) continue;
    const sourceId = resourceId(resource.kind, resource.namespace, resource.name);

    // Check spec.rules[*].http.paths[*].backend.service.name
    const rules = spec.rules as Record<string, unknown>[] | undefined;
    if (Array.isArray(rules)) {
      for (const rule of rules) {
        const http = rule.http as Record<string, unknown> | undefined;
        const paths = http?.paths as Record<string, unknown>[] | undefined;
        if (!Array.isArray(paths)) continue;

        for (const path of paths) {
          const backend = path.backend as Record<string, unknown> | undefined;
          const service = backend?.service as Record<string, unknown> | undefined;
          const serviceName = service?.name as string | undefined;
          if (!serviceName || WELL_KNOWN_SERVICES.has(serviceName)) continue;

          const targetId = resourceId('Service', resource.namespace, serviceName);
          const resolved = nodeIds.has(targetId);
          edges.push({
            sourceId,
            targetId,
            targetKind: 'Service',
            targetName: serviceName,
            edgeType: 'ingress-backend',
            resolved,
          });
        }
      }
    }

    // Check spec.defaultBackend.service.name
    const defaultBackend = spec.defaultBackend as Record<string, unknown> | undefined;
    const defaultService = defaultBackend?.service as Record<string, unknown> | undefined;
    const defaultServiceName = defaultService?.name as string | undefined;
    if (defaultServiceName && !WELL_KNOWN_SERVICES.has(defaultServiceName)) {
      const targetId = resourceId('Service', resource.namespace, defaultServiceName);
      const resolved = nodeIds.has(targetId);
      edges.push({
        sourceId,
        targetId,
        targetKind: 'Service',
        targetName: defaultServiceName,
        edgeType: 'ingress-backend',
        resolved,
      });
    }
  }
}
```

### Graph Data Extraction: RBAC Binding
```typescript
// Source: Adapted from KA-A002 rule logic (but extracting all bindings, not just cluster-admin)

function extractRbacBindingEdges(
  resources: ParsedResource[],
  registry: ResourceRegistry,
  edges: K8sGraphEdge[],
  nodeIds: Set<string>,
): void {
  for (const resource of resources) {
    if (resource.kind !== 'RoleBinding' && resource.kind !== 'ClusterRoleBinding') continue;

    const roleRef = resource.json.roleRef as Record<string, unknown> | undefined;
    if (!roleRef) continue;

    const refKind = roleRef.kind as string | undefined;  // 'Role' or 'ClusterRole'
    const refName = roleRef.name as string | undefined;
    if (!refKind || !refName) continue;

    const sourceId = resourceId(resource.kind, resource.namespace, resource.name);
    // ClusterRoles are cluster-scoped, use 'default' namespace for consistency
    const targetNamespace = refKind === 'ClusterRole' ? 'default' : resource.namespace;
    const targetId = resourceId(refKind, targetNamespace, refName);
    const resolved = nodeIds.has(targetId);

    edges.push({
      sourceId,
      targetId,
      targetKind: refKind,
      targetName: refName,
      edgeType: 'rbac-binding',
      resolved,
    });
  }
}
```

### K8sResultsPanel Modification (Replace Placeholder)
```typescript
// Modification to src/components/tools/K8sResultsPanel.tsx
// Replace the graph tab placeholder with lazy-loaded component

import { lazy, Suspense } from 'react';
import { K8sGraphSkeleton } from './k8s-results/K8sGraphSkeleton';

const LazyK8sResourceGraph = lazy(() => import('./k8s-results/K8sResourceGraph'));

// In the graph tab rendering section (replacing lines 146-159):
/* Graph tab content */
result === null ? (
  <div className="flex items-center justify-center h-full text-center">
    <p className="text-[var(--color-text-secondary)]">
      Run analysis first to see the resource graph
    </p>
  </div>
) : !result.parseSuccess ? (
  <div className="flex items-center justify-center h-full text-center">
    <p className="text-[var(--color-text-secondary)]">
      Fix YAML parse errors to see the resource graph
    </p>
  </div>
) : (
  <Suspense fallback={<K8sGraphSkeleton />}>
    <LazyK8sResourceGraph result={result} />
  </Suspense>
)
```

### K8sResourceGraph Main Component
```typescript
// src/components/tools/k8s-results/K8sResourceGraph.tsx
// Default export for React.lazy() loading
import { useMemo } from 'react';
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

import { K8sResourceNode, type K8sResourceNodeData, CATEGORY_COLORS } from './K8sResourceNode';
import { K8sRelationshipEdge, type K8sRelationshipEdgeData } from './K8sRelationshipEdge';
import { extractK8sGraphData, type K8sGraphData } from '../../../lib/tools/k8s-analyzer/k8s-graph-data-extractor';
import { ResourceRegistry } from '../../../lib/tools/k8s-analyzer/resource-registry';
import type { K8sAnalysisResult } from '../../../lib/tools/k8s-analyzer/types';
import './k8s-graph.css';

const nodeTypes = { 'k8s-resource': K8sResourceNode };
const edgeTypes = { 'k8s-relationship': K8sRelationshipEdge };

const NODE_WIDTH = 200;
const NODE_HEIGHT = 70;

interface K8sResourceGraphProps {
  result: K8sAnalysisResult;
}

function K8sResourceGraph({ result }: K8sResourceGraphProps) {
  const graphData = useMemo(() => {
    if (!result.parseSuccess || result.resources.length === 0) return null;

    // Rebuild registry for the graph data extractor
    const registry = new ResourceRegistry();
    for (const r of result.resources) registry.add(r);

    const data = extractK8sGraphData(result.resources, registry);
    if (data.nodes.length === 0) return null;

    // Convert to React Flow nodes + edges, run dagre layout
    // ... (conversion + layout logic)
    return layoutResult;
  }, [result]);

  if (!graphData) {
    return (
      <div className="flex items-center justify-center h-[300px] text-[var(--color-text-secondary)]">
        <p className="text-sm">No resources found in the manifest.</p>
      </div>
    );
  }

  return (
    <div className="k8s-graph flex flex-col">
      {graphData.hasDanglingRefs && (
        <div className="text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2 text-xs mb-3 flex items-center gap-2">
          {/* Warning icon SVG */}
          Dangling references detected -- broken edges highlighted in red
        </div>
      )}
      <div className="h-[300px] rounded-lg overflow-hidden border border-[var(--color-border)]">
        <ReactFlow
          nodes={graphData.nodes}
          edges={graphData.edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
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
    </div>
  );
}

export default K8sResourceGraph;
```

### Dark Theme CSS (fork of Compose)
```css
/* src/components/tools/k8s-results/k8s-graph.css */
/* Dark theme overrides for K8s React Flow graph */
.k8s-graph .react-flow {
  --xy-background-color: transparent;
  --xy-node-color: var(--color-text-primary, #e0e0e0);
  --xy-edge-stroke: var(--color-text-secondary, #888);
  --xy-edge-stroke-selected: var(--color-accent, #c44b20);
  --xy-connectionline-stroke: var(--color-accent, #c44b20);
  --xy-attribution-background-color: transparent;
}

.k8s-graph .react-flow__controls button {
  background-color: var(--color-surface, #1a1a2e);
  border-color: var(--color-border, rgba(255, 255, 255, 0.1));
  color: var(--color-text-primary, #e0e0e0);
  fill: var(--color-text-primary, #e0e0e0);
}

.k8s-graph .react-flow__controls button:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.k8s-graph .react-flow__attribution {
  display: none;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Static K8s architecture diagrams | Interactive dependency graphs from live manifests | 2024+ | Users can explore resource relationships visually instead of reading YAML |
| Single-resource linting only | Cross-resource relationship visualization | Phase 44 (cross-resource validation) + Phase 46 (graph) | Both validation AND visualization of resource relationships |
| Compose dependency graph (single relationship type: depends_on) | K8s resource graph (6 relationship types) | Phase 46 | Much richer graph with selector matches, volume mounts, envFrom, Ingress backends, HPA targets, RBAC bindings |
| React Flow v11 (reactflow package) | React Flow v12 (@xyflow/react package) | 2024 | New package name, `node.measured` for dimensions, improved TypeScript generics |

**Deprecated/outdated:**
- `reactflow` npm package: Renamed to `@xyflow/react` in v12. The project already uses the new package name.
- Dagre's original `dagre` npm package: Now maintained as `@dagrejs/dagre`. The project already uses the new package.

## Open Questions

1. **Should the graph support click-to-navigate to the resource in the editor?**
   - What we know: The violations list supports click-to-navigate via `highlightAndScroll(view, line)`. Each `ParsedResource` has a `startLine` property.
   - What's unclear: Whether clicking a graph node should scroll the editor to that resource's definition.
   - Recommendation: Implement click-to-navigate on graph nodes. It is a natural extension of the existing click-to-navigate pattern and adds significant value. The data (`resource.startLine`) is already available. This can be done by reading `k8sEditorViewRef` from the store and calling `highlightAndScroll` on node click.

2. **Should the graph show edge labels by default or on hover?**
   - What we know: The Compose graph shows condition labels on edges by default. With 6 edge types, the K8s graph could have many labels cluttering the view.
   - What's unclear: Whether all edge labels should be visible at once for small graphs but hidden for large graphs.
   - Recommendation: Show edge labels by default. For typical K8s manifests (5-20 resources), the label count is manageable. The labels are short (selects, mounts, envFrom, routes to, scales, binds) and provide essential context for understanding the graph.

3. **Should the graph add a legend showing category colors?**
   - What we know: GRAPH-02 requires color-coding by category. Users may not know what each color means.
   - What's unclear: Whether to add a color legend overlay or rely on the kind label on each node.
   - Recommendation: Add a compact legend (small colored dots with category names) below the graph or as a React Flow Panel overlay. The Compose graph doesn't have a legend because it uses a single relationship type; the K8s graph has 6 categories and needs one.

4. **How should the ResourceRegistry be passed to the graph data extractor?**
   - What we know: The K8sAnalysisResult stores `resources: ParsedResource[]` but not the `ResourceRegistry`. The registry is created inside `runK8sEngine()` and not exposed in the result.
   - What's unclear: Whether to rebuild the registry in the graph component or expose it in the engine result.
   - Recommendation: Rebuild the registry from `result.resources` inside the graph component. This avoids changing the engine result type (which would be a cross-cutting change). Rebuilding is O(n) and cheap for typical manifests. Use `ResourceRegistry.buildFromDocuments()` or create a simpler factory method from `ParsedResource[]`. Alternatively, since `ParsedResource` already has all fields, create a local registry via `new ResourceRegistry()` + `registry.add()` for each resource.

5. **Should phantom nodes for dangling references have a different visual style?**
   - What we know: GRAPH-04 requires "dangling references shown as red dashed edges." The requirement says nothing about the target node's appearance.
   - What's unclear: Whether the phantom node (the missing target) should look different from real nodes.
   - Recommendation: Yes -- render phantom nodes with a red dashed border and slightly transparent background to visually distinguish them from resources that are actually defined in the manifest. This is intuitive: the node itself is "missing" so it should look different.

## Sources

### Primary (HIGH confidence)
- **Codebase analysis** -- All patterns verified by reading the actual source code:
  - `src/components/tools/compose-results/DependencyGraph.tsx` -- Complete React Flow + dagre graph implementation (reference)
  - `src/components/tools/compose-results/ServiceNode.tsx` -- Custom React Flow node component (reference)
  - `src/components/tools/compose-results/DependencyEdge.tsx` -- Custom React Flow edge component (reference)
  - `src/components/tools/compose-results/GraphSkeleton.tsx` -- Suspense fallback (reference)
  - `src/components/tools/compose-results/dependency-graph.css` -- Dark theme CSS overrides (reference)
  - `src/components/tools/ComposeResultsPanel.tsx` -- Lazy loading via React.lazy() (reference)
  - `src/lib/tools/compose-validator/graph-builder.ts` -- Graph data extraction pattern (reference)
  - `src/lib/tools/compose-validator/graph-data-extractor.ts` -- Node enrichment pattern (reference)
  - `src/lib/tools/k8s-analyzer/rules/cross-resource/KA-X001-service-selector-mismatch.ts` -- Selector match logic
  - `src/lib/tools/k8s-analyzer/rules/cross-resource/KA-X002-ingress-undefined-service.ts` -- Ingress backend logic
  - `src/lib/tools/k8s-analyzer/rules/cross-resource/KA-X003-configmap-not-found.ts` -- ConfigMap reference logic
  - `src/lib/tools/k8s-analyzer/rules/cross-resource/KA-X004-secret-not-found.ts` -- Secret reference logic
  - `src/lib/tools/k8s-analyzer/rules/cross-resource/KA-X005-pvc-not-found.ts` -- PVC reference logic
  - `src/lib/tools/k8s-analyzer/rules/cross-resource/KA-X006-serviceaccount-not-found.ts` -- ServiceAccount reference logic
  - `src/lib/tools/k8s-analyzer/rules/cross-resource/KA-X007-networkpolicy-no-match.ts` -- NetworkPolicy selector logic
  - `src/lib/tools/k8s-analyzer/rules/cross-resource/KA-X008-hpa-target-not-found.ts` -- HPA target logic
  - `src/lib/tools/k8s-analyzer/rules/rbac/KA-A002-cluster-admin-binding.ts` -- RBAC binding logic
  - `src/lib/tools/k8s-analyzer/rules/cross-resource/well-known-resources.ts` -- Well-known resource whitelist
  - `src/lib/tools/k8s-analyzer/container-helpers.ts` -- getPodSpec/getContainerSpecs helpers
  - `src/lib/tools/k8s-analyzer/resource-registry.ts` -- ResourceRegistry class
  - `src/lib/tools/k8s-analyzer/types.ts` -- K8sAnalysisResult, ParsedResource, ResourceRegistry interface
  - `src/lib/tools/k8s-analyzer/engine.ts` -- Engine result structure, registry build
  - `src/stores/k8sAnalyzerStore.ts` -- Nanostore atoms
  - `src/components/tools/K8sResultsPanel.tsx` -- Current graph tab placeholder (lines 146-159)
  - `src/components/tools/K8sEditorPanel.tsx` -- Engine result processing and k8sResult.set() call
  - `package.json` -- @xyflow/react v12.10.1 and @dagrejs/dagre v2.0.4 already installed

### Secondary (MEDIUM confidence)
- [React Flow dagre layout example](https://reactflow.dev/examples/layout/dagre) -- Official dagre layout pattern with `getLayoutedElements`
- [React Flow v12 migration guide](https://reactflow.dev/learn/troubleshooting/migrate-to-v12) -- v12 changes including `node.measured` dimensions

### Tertiary (LOW confidence)
- None -- all findings verified from codebase analysis and official React Flow docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All libraries already installed and proven in Compose DependencyGraph
- Architecture: HIGH -- Complete reference implementation exists in the same codebase (Compose graph)
- Graph data extraction: HIGH -- All 8 cross-resource rules provide verified logic for relationship detection; extraction follows the exact same JSON traversal patterns
- Pitfalls: HIGH -- Based on direct codebase analysis, Compose graph learnings, and K8s cross-resource rule logic analysis
- Edge types and node categories: HIGH -- Requirements explicitly list all 6 edge types and 6 node categories

**Research date:** 2026-02-23
**Valid until:** 2026-04-23 (stable domain; React Flow v12 and dagre APIs are stable, K8s resource relationships are well-defined)
