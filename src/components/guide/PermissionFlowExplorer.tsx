/**
 * Interactive permission flow explorer using React Flow with dagre layout.
 *
 * Renders the Claude Code permission evaluation decision tree:
 *   Tool Call Request -> deny rules -> ask rules -> allow rules -> default ask
 *
 * Clicking a node reveals evaluation context in a detail panel below the canvas.
 * Clicking the same node again (or the Close button) dismisses the panel.
 *
 * Lazy-loaded in MDX via `client:visible` to keep initial bundle small.
 */
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
import {
  rawNodes,
  rawEdges,
  detailContent,
} from '../../lib/guides/interactive-data/permission-flow-data';
import './permission-flow/permission-flow.css';

// Module-level constant to avoid re-registration on every render (Pitfall 1)
const nodeTypes = { decision: PermissionDecisionNode, result: PermissionResultNode };

const NODE_WIDTH = 160;
const NODE_HEIGHT = 60;

// ---------- Dagre layout ----------

function layoutGraph(
  nodes: Node[],
  edges: Edge[],
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 100 });

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
          nodes={nodes}
          edges={edges}
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
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="rgba(255,255,255,0.05)"
          />
        </ReactFlow>
      </div>
      {detail && (
        <PermissionDetailPanel
          content={detail}
          onClose={() => setSelectedNodeId(null)}
        />
      )}
    </div>
  );
}

export default PermissionFlowExplorer;
