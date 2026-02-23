/**
 * Custom React Flow edge with condition labels and cycle highlighting.
 * Normal edges use subtle white strokes; cycle edges are red (GRAPH-03/GRAPH-04).
 */
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
  type Edge,
} from '@xyflow/react';

export type DependencyEdgeData = {
  condition?: string;
  isCycle?: boolean;
};

export type DependencyEdgeType = Edge<DependencyEdgeData, 'dependency'>;

export function DependencyEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps<DependencyEdgeType>) {
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isCycle = data?.isCycle ?? false;

  return (
    <>
      <BaseEdge
        path={path}
        markerEnd={markerEnd}
        style={{
          stroke: isCycle ? '#ef4444' : 'var(--color-text-secondary, #888)',
          strokeWidth: isCycle ? 2.5 : 1.5,
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
            className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-surface,#1a1a2e)] border border-[var(--color-border,rgba(255,255,255,0.1))] text-[var(--color-text-secondary,#a0a0a0)]"
          >
            {data.condition}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
