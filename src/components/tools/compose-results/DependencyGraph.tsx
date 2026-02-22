/**
 * Interactive service dependency graph using React Flow with dagre layout.
 *
 * Renders service nodes with names, images, port summaries, and network
 * color-coded borders. Edges show depends_on relationships with condition
 * labels. Circular dependencies are highlighted in red.
 *
 * This entire component is lazy-loaded (React.lazy) so React Flow's ~120 KB
 * bundle only loads when the user activates the Graph tab (GRAPH-07).
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
import '@xyflow/react/dist/style.css';
import dagre from '@dagrejs/dagre';

import { ServiceNode, type ServiceNodeData } from './ServiceNode';
import { DependencyEdge, type DependencyEdgeData } from './DependencyEdge';
import { parseComposeYaml } from '../../../lib/tools/compose-validator/parser';
import {
  buildDependencyGraph,
  detectCycles,
} from '../../../lib/tools/compose-validator/graph-builder';
import { extractServiceMetadata } from '../../../lib/tools/compose-validator/graph-data-extractor';
import type { ComposeAnalysisResult } from '../../../lib/tools/compose-validator/types';
import './dependency-graph.css';

// Module-level constants to avoid re-registration on every render
const nodeTypes = { service: ServiceNode };
const edgeTypes = { dependency: DependencyEdge };

const NODE_WIDTH = 220;
const NODE_HEIGHT = 80;

// Network color palette for GRAPH-05
const NETWORK_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#6366f1', // indigo
  '#14b8a6', // teal
];

interface DependencyGraphProps {
  result: ComposeAnalysisResult;
  yamlContent: string;
}

/**
 * Dagre layout with cycle-safe edge handling.
 *
 * Cycle edges are removed before dagre runs (dagre assumes a DAG and can
 * infinite-loop on cycles), then re-added after layout so they route
 * between the positioned nodes as back-edges.
 */
function layoutGraph(
  rfNodes: Node<ServiceNodeData>[],
  rfEdges: Edge<DependencyEdgeData>[],
): { nodes: Node<ServiceNodeData>[]; edges: Edge<DependencyEdgeData>[] } {
  const normalEdges = rfEdges.filter((e) => !e.data?.isCycle);
  const cycleEdges = rfEdges.filter((e) => e.data?.isCycle);

  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 100 });

  rfNodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  normalEdges.forEach((edge) => {
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

  return { nodes: layoutedNodes, edges: [...normalEdges, ...cycleEdges] };
}

function DependencyGraph({ result, yamlContent }: DependencyGraphProps) {
  const graphData = useMemo(() => {
    if (!result.parseSuccess || !yamlContent.trim()) {
      return null;
    }

    const parseResult = parseComposeYaml(yamlContent);
    if (!parseResult.parseSuccess || parseResult.services.size === 0) {
      return null;
    }

    // Build dependency graph and detect cycles
    const graph = buildDependencyGraph(parseResult.services);
    const { cycleParticipants } = detectCycles(graph);
    const cycleSet = new Set(cycleParticipants);

    // Extract metadata for node enrichment
    const metadata = parseResult.json
      ? extractServiceMetadata(parseResult.json)
      : new Map();

    // Build network color map
    const allNetworks = new Set<string>();
    for (const meta of metadata.values()) {
      for (const net of meta.networks) {
        allNetworks.add(net);
      }
    }
    const networkColorMap = new Map<string, string>();
    let colorIndex = 0;
    for (const net of allNetworks) {
      networkColorMap.set(net, NETWORK_COLORS[colorIndex % NETWORK_COLORS.length]);
      colorIndex++;
    }

    // Convert to React Flow nodes
    const rfNodes: Node<ServiceNodeData>[] = graph.nodes.map((n) => {
      const meta = metadata.get(n.name);
      const primaryNetwork = meta?.networks[0];
      const networkColor = primaryNetwork
        ? networkColorMap.get(primaryNetwork)
        : undefined;

      return {
        id: n.name,
        type: 'service' as const,
        position: { x: 0, y: 0 },
        data: {
          label: n.name,
          image: meta?.image,
          ports: meta?.portSummary,
          networks: meta?.networks ?? [],
          networkColor,
        },
      };
    });

    // Convert to React Flow edges
    const rfEdges: Edge<DependencyEdgeData>[] = graph.edges.map((e, i) => ({
      id: `e-${e.from}-${e.to}-${i}`,
      source: e.from,
      target: e.to,
      type: 'dependency' as const,
      markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(255,255,255,0.3)' },
      data: {
        condition: e.condition,
        isCycle: cycleSet.has(e.from) && cycleSet.has(e.to),
      },
    }));

    // Run dagre layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = layoutGraph(
      rfNodes,
      rfEdges,
    );

    return {
      nodes: layoutedNodes,
      edges: layoutedEdges,
      hasCycle: cycleParticipants.length > 0,
    };
  }, [yamlContent, result.parseSuccess]);

  if (!graphData) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-[var(--color-text-secondary)]">
        <p className="text-sm">No services found in the compose file.</p>
      </div>
    );
  }

  return (
    <div className="compose-graph flex flex-col min-h-[400px] h-full">
      {graphData.hasCycle && (
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
          Circular dependency detected -- cycle edges highlighted in red
        </div>
      )}
      <div className="flex-1 min-h-[400px] rounded-lg overflow-hidden border border-[var(--color-border,rgba(255,255,255,0.1))]">
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

export default DependencyGraph;
