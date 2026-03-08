/**
 * Interactive deployment topology diagram using React Flow with dagre layout.
 *
 * Renders 4 service nodes (Caddy, FastAPI App, PostgreSQL, Redis) with
 * protocol-labeled edges. Supports pan, zoom, and drag for exploring
 * the Docker Compose production architecture (DIAG-04).
 *
 * Lazy-loaded in MDX via `client:visible` to keep initial bundle small.
 */
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

import { TopologyNode, type TopologyNodeData } from './topology/TopologyNode';
import './topology/deployment-topology.css';

// Module-level constant to avoid re-registration on every render
const nodeTypes = { topology: TopologyNode };

const NODE_WIDTH = 200;
const NODE_HEIGHT = 70;

// ---------- Static topology data ----------

const rawNodes: Node<TopologyNodeData>[] = [
  {
    id: 'proxy',
    type: 'topology',
    position: { x: 0, y: 0 },
    data: { label: 'Caddy', subtitle: 'Reverse Proxy', icon: 'proxy' },
  },
  {
    id: 'app',
    type: 'topology',
    position: { x: 0, y: 0 },
    data: { label: 'FastAPI App', subtitle: 'Uvicorn Workers', icon: 'app' },
  },
  {
    id: 'postgres',
    type: 'topology',
    position: { x: 0, y: 0 },
    data: { label: 'PostgreSQL', subtitle: 'Primary Database', icon: 'db' },
  },
  {
    id: 'redis',
    type: 'topology',
    position: { x: 0, y: 0 },
    data: { label: 'Redis', subtitle: 'Cache & Rate Limits', icon: 'cache' },
  },
];

const rawEdges: Edge[] = [
  {
    id: 'e-proxy-app',
    source: 'proxy',
    target: 'app',
    label: 'HTTP/HTTPS',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#888' },
    style: { stroke: '#888' },
  },
  {
    id: 'e-app-postgres',
    source: 'app',
    target: 'postgres',
    label: 'asyncpg',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#888' },
    style: { stroke: '#888' },
  },
  {
    id: 'e-app-redis',
    source: 'app',
    target: 'redis',
    label: 'aioredis',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#888' },
    style: { stroke: '#888' },
  },
];

// ---------- Dagre layout ----------

function layoutGraph(
  nodes: Node<TopologyNodeData>[],
  edges: Edge[],
): { nodes: Node<TopologyNodeData>[]; edges: Edge[] } {
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

// Pre-compute layout (static data, no need for useMemo)
const { nodes, edges } = layoutGraph(rawNodes, rawEdges);

// ---------- Component ----------

function DeploymentTopology() {
  return (
    <div className="deployment-topology h-[350px] lg:h-[450px] rounded-lg overflow-hidden border border-[var(--color-border,rgba(255,255,255,0.1))]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.4 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.3}
        maxZoom={2}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
      >
        <Controls showInteractive={false} position="bottom-right" />
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgba(255,255,255,0.05)"
        />
      </ReactFlow>
    </div>
  );
}

export default DeploymentTopology;
