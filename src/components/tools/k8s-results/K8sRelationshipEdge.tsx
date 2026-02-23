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

const EDGE_TYPE_LABELS: Record<string, string> = {
  'selector-match': 'selects',
  'volume-mount': 'mounts',
  'env-from': 'envFrom',
  'ingress-backend': 'routes to',
  'hpa-target': 'scales',
  'rbac-binding': 'binds',
};

export function K8sRelationshipEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps<K8sRelationshipEdgeType>) {
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isDangling = data?.isDangling ?? false;
  const edgeLabel = data?.label ?? EDGE_TYPE_LABELS[data?.edgeType ?? ''] ?? data?.edgeType;

  return (
    <>
      <BaseEdge
        path={path}
        markerEnd={markerEnd}
        style={{
          stroke: isDangling ? '#ef4444' : 'var(--color-text-secondary, #888)',
          strokeWidth: isDangling ? 2 : 1.5,
          strokeDasharray: isDangling ? '6 3' : undefined,
        }}
      />
      {edgeLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
              fontSize: '10px',
            }}
            className="px-1.5 py-0.5 rounded bg-[var(--color-surface,#1a1a2e)] border border-[var(--color-border,rgba(255,255,255,0.1))] text-[var(--color-text-secondary,#a0a0a0)]"
          >
            {edgeLabel}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
