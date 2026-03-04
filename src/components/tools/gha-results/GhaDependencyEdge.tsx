/**
 * Custom React Flow edge for GHA workflow dependencies. Uses smooth step paths
 * with cycle-aware coloring (red for cycles) and optional trigger event labels.
 * Labels appear only on trigger edges, not on needs: edges (GRAPH-04/GRAPH-05).
 */
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
  type Edge,
} from '@xyflow/react';

export type GhaDependencyEdgeData = {
  label?: string;
  isCycle?: boolean;
};

export type GhaDependencyEdgeType = Edge<GhaDependencyEdgeData, 'gha-dependency'>;

export function GhaDependencyEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps<GhaDependencyEdgeType>) {
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
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-surface,#1a1a2e)] border border-[var(--color-border,rgba(255,255,255,0.1))] text-[var(--color-text-secondary,#a0a0a0)]"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
