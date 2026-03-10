/**
 * Interactive hook event visualizer using React Flow with dagre layout.
 *
 * Renders 18 hook events across 3 categories (Session, Loop, Standalone Async)
 * with click-to-reveal detail panel showing handler types, payload fields,
 * and configuration examples. PreToolUse is visually distinguished with a
 * CAN BLOCK badge (INTV-02).
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

import { HookEventNode } from './hook-events/HookEventNode';
import { HookCategoryNode } from './hook-events/HookCategoryNode';
import { HookDetailPanel } from './hook-events/HookDetailPanel';
import {
  rawNodes,
  rawEdges,
  detailContent,
} from '../../lib/guides/interactive-data/hook-event-data';
import './hook-events/hook-events.css';

// Module-level constant to avoid re-registration on every render
const nodeTypes = { event: HookEventNode, category: HookCategoryNode };

const NODE_WIDTH = 200;
const NODE_HEIGHT = 50;
const CATEGORY_NODE_HEIGHT = 40;

// ---------- Dagre layout ----------

function layoutGraph(
  nodes: Node[],
  edges: Edge[],
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 40, ranksep: 80 });

  nodes.forEach((node) => {
    const height = node.type === 'category' ? CATEGORY_NODE_HEIGHT : NODE_HEIGHT;
    g.setNode(node.id, { width: NODE_WIDTH, height });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id);
    const height = node.type === 'category' ? CATEGORY_NODE_HEIGHT : NODE_HEIGHT;
    return {
      ...node,
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - height / 2 },
    };
  });

  return { nodes: layoutedNodes, edges };
}

// Pre-compute layout (static data, no need for useMemo)
const { nodes, edges } = layoutGraph(rawNodes, rawEdges);

// ---------- Component ----------

function HookEventVisualizer() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    // Ignore clicks on category header nodes (no detail content)
    if (node.type === 'category') return;
    setSelectedNodeId((prev) => (prev === node.id ? null : node.id));
  }, []);

  const detail = selectedNodeId ? detailContent[selectedNodeId] : null;

  return (
    <div className="hook-event-visualizer">
      <div className="h-[500px] lg:h-[600px] rounded-lg overflow-hidden border border-[var(--color-border,rgba(255,255,255,0.1))]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={handleNodeClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          minZoom={0.2}
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
        <HookDetailPanel
          content={detail}
          onClose={() => setSelectedNodeId(null)}
        />
      )}
    </div>
  );
}

export default HookEventVisualizer;
