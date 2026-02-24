/**
 * Interactive K8s resource relationship graph using React Flow with dagre layout.
 *
 * Renders resource nodes color-coded by category with relationship edges.
 * Dangling references show as red dashed edges to phantom nodes.
 *
 * Lazy-loaded via React.lazy() so React Flow's bundle only loads when
 * the user activates the Graph tab.
 */
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
import dagre from '@dagrejs/dagre';

import { K8sResourceNode, type K8sResourceNodeData, CATEGORY_COLORS } from './K8sResourceNode';
import { K8sRelationshipEdge, type K8sRelationshipEdgeData } from './K8sRelationshipEdge';
import { extractK8sGraphData } from '../../../lib/tools/k8s-analyzer/k8s-graph-data-extractor';
import { ResourceRegistry } from '../../../lib/tools/k8s-analyzer/resource-registry';
import type { K8sAnalysisResult } from '../../../lib/tools/k8s-analyzer/types';
import './k8s-graph.css';

// Module-level constants to avoid re-registration on every render
const nodeTypes = { 'k8s-resource': K8sResourceNode };
const edgeTypes = { 'k8s-relationship': K8sRelationshipEdge };
const NODE_WIDTH = 200;
const NODE_HEIGHT = 70;

/**
 * Dagre layout positions nodes hierarchically top-to-bottom.
 * All edges (including dangling) are included so phantom nodes get positioned.
 */
function layoutGraph(
  rfNodes: Node<K8sResourceNodeData>[],
  rfEdges: Edge<K8sRelationshipEdgeData>[],
): { nodes: Node<K8sResourceNodeData>[]; edges: Edge<K8sRelationshipEdgeData>[] } {
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

interface K8sResourceGraphProps {
  result: K8sAnalysisResult;
}

const LEGEND_CATEGORIES: { key: string; label: string }[] = [
  { key: 'workload', label: 'Workload' },
  { key: 'service', label: 'Service' },
  { key: 'config', label: 'Config' },
  { key: 'storage', label: 'Storage' },
  { key: 'rbac', label: 'RBAC' },
  { key: 'scaling', label: 'Scaling' },
];

function K8sResourceGraph({ result }: K8sResourceGraphProps) {
  const graphData = useMemo(() => {
    if (!result.parseSuccess || result.resources.length === 0) {
      return null;
    }

    // Rebuild ResourceRegistry from result resources
    const registry = new ResourceRegistry();
    for (const r of result.resources) registry.add(r);

    const data = extractK8sGraphData(result.resources, registry);

    if (data.nodes.length === 0) {
      return null;
    }

    // Convert K8sGraphNode[] to React Flow nodes
    const rfNodes: Node<K8sResourceNodeData>[] = data.nodes.map((node) => ({
      id: node.id,
      type: 'k8s-resource' as const,
      position: { x: 0, y: 0 },
      data: {
        label: node.name,
        kind: node.kind,
        namespace: node.namespace,
        categoryColor: CATEGORY_COLORS[node.category] ?? '#888',
        isPhantom: node.isPhantom ?? false,
      },
    }));

    // Convert K8sGraphEdge[] to React Flow edges
    const rfEdges: Edge<K8sRelationshipEdgeData>[] = data.edges.map((edge) => ({
      id: `e-${edge.sourceId}-${edge.targetId}-${edge.edgeType}`,
      source: edge.sourceId,
      target: edge.targetId,
      type: 'k8s-relationship' as const,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edge.resolved ? '#888' : '#ef4444',
      },
      data: {
        edgeType: edge.edgeType,
        isDangling: !edge.resolved,
      },
    }));

    // Run dagre layout
    const { nodes, edges } = layoutGraph(rfNodes, rfEdges);

    return { nodes, edges, hasDanglingRefs: data.hasDanglingRefs };
  }, [result]);

  if (!graphData) {
    return (
      <div className="flex items-center justify-center h-[300px] lg:h-[450px] text-[var(--color-text-secondary)]">
        <p className="text-sm">No resources found in the manifest.</p>
      </div>
    );
  }

  return (
    <div className="k8s-graph flex flex-col">
      {graphData.hasDanglingRefs && (
        <div className="text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2 text-xs mb-3 flex items-center gap-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Dangling references detected -- broken edges highlighted in red
        </div>
      )}
      <div className="text-[10px] text-[var(--color-text-secondary)] flex flex-wrap gap-x-3 gap-y-1 mb-2">
        {LEGEND_CATEGORIES.map((cat) => (
          <span key={cat.key} className="flex items-center gap-1">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: CATEGORY_COLORS[cat.key] }}
            />
            {cat.label}
          </span>
        ))}
      </div>
      <div className="h-[300px] lg:h-[450px] rounded-lg overflow-hidden border border-[var(--color-border,rgba(255,255,255,0.1))]">
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
          <Controls
            showInteractive={false}
            position="bottom-right"
          />
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="rgba(255,255,255,0.05)"
          />
        </ReactFlow>
      </div>
    </div>
  );
}

export default K8sResourceGraph;
