import React from 'react';
import type { ZoomTransform } from 'd3-zoom';
import type { LayoutPosition, LayoutMeta } from '../../lib/ai-landscape/layout-schema';
import type { Cluster } from '../../lib/ai-landscape/schema';

interface MiniMapProps {
  positions: LayoutPosition[];
  clusters: Cluster[];
  clusterMap: Map<string, Cluster>;
  nodeClusterMap: Map<string, string>; // nodeId -> clusterId
  transform: ZoomTransform;
  meta: LayoutMeta;
}

export const MiniMap = React.memo(function MiniMap({
  positions,
  clusterMap,
  nodeClusterMap,
  transform,
  meta,
}: MiniMapProps) {
  const MINI_WIDTH = 160;
  const MINI_HEIGHT = MINI_WIDTH * (meta.height / meta.width);

  // Viewport rectangle: invert the d3-zoom transform
  // to find what portion of the graph is visible
  const viewX = -transform.x / transform.k;
  const viewY = -transform.y / transform.k;
  const viewW = meta.width / transform.k;
  const viewH = meta.height / transform.k;

  return (
    <div
      className="absolute bottom-3 right-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm overflow-hidden"
      style={{ width: MINI_WIDTH, height: MINI_HEIGHT }}
      aria-hidden="true"
    >
      <svg
        width={MINI_WIDTH}
        height={MINI_HEIGHT}
        viewBox={`0 0 ${meta.width} ${meta.height}`}
        className="block"
      >
        {/* Node dots colored by cluster */}
        {positions.map((pos) => {
          const clusterId = nodeClusterMap.get(pos.id);
          const cluster = clusterId ? clusterMap.get(clusterId) : undefined;
          return (
            <circle
              key={pos.id}
              cx={pos.x}
              cy={pos.y}
              r={8}
              fill={cluster?.color ?? 'var(--color-text-secondary)'}
              opacity={0.6}
            />
          );
        })}
        {/* Viewport rectangle */}
        <rect
          x={viewX}
          y={viewY}
          width={viewW}
          height={viewH}
          fill="var(--color-accent)"
          fillOpacity={0.08}
          stroke="var(--color-accent)"
          strokeWidth={6}
          rx={4}
        />
      </svg>
    </div>
  );
});
