/**
 * Interactive GHA workflow graph using React Flow with dagre LR layout.
 *
 * Renders trigger, job, and step nodes in a left-to-right hierarchy.
 * Steps are nested inside job group nodes. Cycle edges are filtered
 * before dagre (which requires a DAG) and re-added after layout.
 *
 * Default-exported for React.lazy() in GhaResultsPanel (GRAPH-06/GRAPH-07).
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
import { useStore } from '@nanostores/react';

import { GhaTriggerNode, type GhaTriggerNodeData } from './GhaTriggerNode';
import { GhaJobNode, type GhaJobNodeData } from './GhaJobNode';
import { GhaStepNode, type GhaStepNodeData } from './GhaStepNode';
import { GhaDependencyEdge, type GhaDependencyEdgeData } from './GhaDependencyEdge';
import { ghaResult, ghaEditorViewRef } from '../../../stores/ghaValidatorStore';
import { parseGhaWorkflow } from '../../../lib/tools/gha-validator/parser';
import {
  extractGhaGraphData,
  type GhaGraphData,
  type GhaGraphNode,
  type GhaGraphEdge,
} from '../../../lib/tools/gha-validator/gha-graph-data-extractor';
import './gha-graph.css';

// Module-level constants to avoid React Flow re-registration warnings
const nodeTypes = {
  'gha-trigger': GhaTriggerNode,
  'gha-job': GhaJobNode,
  'gha-step': GhaStepNode,
};
const edgeTypes = {
  'gha-dependency': GhaDependencyEdge,
};

// Layout constants
const JOB_WIDTH = 240;
const JOB_HEADER_HEIGHT = 50;
const STEP_HEIGHT = 32;
const STEP_PADDING = 8;
const TRIGGER_WIDTH = 140;
const TRIGGER_HEIGHT = 50;
const STEP_PADDING_X = 8;

type AnyNodeData = GhaTriggerNodeData | GhaJobNodeData | GhaStepNodeData;

/**
 * Two-pass dagre layout: triggers+jobs via dagre LR, steps manually inside jobs.
 *
 * Cycle edges are removed before dagre (dagre assumes a DAG) and re-added
 * after layout so they route between positioned nodes as back-edges.
 */
function layoutGraph(
  graphData: GhaGraphData,
): { nodes: Node<AnyNodeData>[]; edges: Edge<GhaDependencyEdgeData>[] } {
  const { nodes: gNodes, edges: gEdges } = graphData;

  // Count steps per job for dynamic height
  const stepCountByJob = new Map<string, number>();
  for (const n of gNodes) {
    if (n.type === 'step' && n.parentJobId) {
      stepCountByJob.set(
        n.parentJobId,
        (stepCountByJob.get(n.parentJobId) ?? 0) + 1,
      );
    }
  }

  // Phase 1: dagre layout for triggers and jobs only
  const dagreNodes = gNodes.filter((n) => n.type !== 'step');
  const normalEdges = gEdges.filter((e) => !e.isCycle);
  const cycleEdges = gEdges.filter((e) => e.isCycle);

  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 120 });

  for (const n of dagreNodes) {
    if (n.type === 'trigger') {
      g.setNode(n.id, { width: TRIGGER_WIDTH, height: TRIGGER_HEIGHT });
    } else {
      const sc = stepCountByJob.get(n.id) ?? 0;
      const h = JOB_HEADER_HEIGHT + sc * STEP_HEIGHT + STEP_PADDING * 2;
      g.setNode(n.id, { width: JOB_WIDTH, height: h });
    }
  }

  for (const e of normalEdges) {
    g.setEdge(e.source, e.target);
  }

  dagre.layout(g);

  // Build React Flow nodes -- triggers first, then jobs
  const rfNodes: Node<AnyNodeData>[] = [];

  // Triggers
  for (const n of dagreNodes) {
    if (n.type !== 'trigger') continue;
    const pos = g.node(n.id);
    rfNodes.push({
      id: n.id,
      type: 'gha-trigger',
      position: { x: pos.x - TRIGGER_WIDTH / 2, y: pos.y - TRIGGER_HEIGHT / 2 },
      data: { label: n.label },
    });
  }

  // Jobs (group containers)
  for (const n of dagreNodes) {
    if (n.type !== 'job') continue;
    const pos = g.node(n.id);
    const sc = stepCountByJob.get(n.id) ?? 0;
    const h = JOB_HEADER_HEIGHT + sc * STEP_HEIGHT + STEP_PADDING * 2;
    rfNodes.push({
      id: n.id,
      type: 'gha-job',
      position: { x: pos.x - JOB_WIDTH / 2, y: pos.y - h / 2 },
      data: {
        label: n.label,
        violationStatus: n.violationStatus,
        stepCount: sc,
      },
      style: { width: JOB_WIDTH, height: h },
    });
  }

  // Phase 2: manual positioning for step nodes inside job containers
  for (const n of gNodes) {
    if (n.type !== 'step') continue;
    rfNodes.push({
      id: n.id,
      type: 'gha-step',
      parentId: n.parentJobId,
      extent: 'parent' as const,
      position: {
        x: STEP_PADDING_X,
        y: JOB_HEADER_HEIGHT + (n.stepIndex ?? 0) * STEP_HEIGHT,
      },
      data: {
        label: n.label,
        violationStatus: n.violationStatus,
        stepIndex: n.stepIndex ?? 0,
      },
    });
  }

  // Convert all edges to React Flow format (normal + cycle re-added)
  const allGEdges = [...normalEdges, ...cycleEdges];
  const rfEdges: Edge<GhaDependencyEdgeData>[] = allGEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: 'gha-dependency' as const,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#888' },
    data: { label: e.label, isCycle: e.isCycle },
  }));

  return { nodes: rfNodes, edges: rfEdges };
}

function GhaWorkflowGraph() {
  const result = useStore(ghaResult);

  const graphLayout = useMemo(() => {
    if (!result) return null;

    // Re-parse editor content to get JSON (ghaResult doesn't carry raw JSON)
    const editorView = ghaEditorViewRef.get();
    if (!editorView) return null;

    const editorContent = editorView.state.doc.toString();
    const parsed = parseGhaWorkflow(editorContent);
    if (!parsed.json) return null;

    const graphData = extractGhaGraphData(parsed.json, result.violations);
    return { ...layoutGraph(graphData), hasCycle: graphData.hasCycle };
  }, [result]);

  if (!result) {
    return (
      <div className="flex items-center justify-center h-[300px] lg:h-[450px] text-[var(--color-text-secondary)]">
        <p className="text-sm">Run an analysis to see the workflow graph</p>
      </div>
    );
  }

  if (!graphLayout) {
    return (
      <div className="flex items-center justify-center h-[300px] lg:h-[450px] text-[var(--color-text-secondary)]">
        <p className="text-sm">Could not parse workflow</p>
      </div>
    );
  }

  return (
    <div className="gha-graph flex flex-col">
      {graphLayout.hasCycle && (
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
      <div className="h-[300px] lg:h-[450px] rounded-lg overflow-hidden border border-[var(--color-border,rgba(255,255,255,0.1))]">
        <ReactFlow
          nodes={graphLayout.nodes}
          edges={graphLayout.edges}
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

export default GhaWorkflowGraph;
