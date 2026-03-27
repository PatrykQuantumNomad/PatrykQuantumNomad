import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomTransform, type ZoomBehavior } from 'd3-zoom';
import {
  type GraphProps,
  ROOT_NODE_RADIUS,
  NODE_RADIUS,
  LABEL_FONT_SIZE,
  stripParenthetical,
} from '../../lib/ai-landscape/graph-data';

/**
 * Interactive AI Landscape graph rendered as an SVG React island.
 * Uses d3-zoom for pan (drag) and zoom (Ctrl+scroll / pinch).
 * Mounted via client:only="react" in the Astro page.
 */
export default function InteractiveGraph({
  nodes,
  edges,
  positions,
  clusters,
  meta,
}: GraphProps) {
  // Refs
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // State
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);
  const [showZoomHint, setShowZoomHint] = useState(false);
  // Stub state for Plan 02 (tooltip + edge labels)
  const [_hoveredNode, _setHoveredNode] = useState<string | null>(null);
  const [_hoveredEdge, _setHoveredEdge] = useState<string | null>(null);

  // Memoized lookups
  const posMap = useMemo(
    () => new Map(positions.map((p) => [p.id, p])),
    [positions],
  );
  const _nodeMap = useMemo(
    () => new Map(nodes.map((n) => [n.id, n])),
    [nodes],
  );
  const clusterMap = useMemo(
    () => new Map(clusters.map((c) => [c.id, c])),
    [clusters],
  );
  const rootNodeIds = useMemo(
    () => new Set(nodes.filter((n) => n.parentId === null).map((n) => n.id)),
    [nodes],
  );

  // Build CSS string for cluster coloring and dark mode overrides
  const cssString = useMemo(() => {
    const lines: string[] = [];
    for (const c of clusters) {
      lines.push(
        `.ai-cluster-${c.id} { fill: ${c.color}; stroke: ${c.darkColor}; stroke-width: 1.5; }`,
      );
      lines.push(
        `html.dark .ai-cluster-${c.id} { fill: ${c.darkColor}; stroke: ${c.color}; }`,
      );
    }
    lines.push(`.ai-edge { stroke: var(--color-border); }`);
    lines.push(
      `.ai-label { fill: var(--color-text-primary); font-family: 'DM Sans', sans-serif; font-size: 9px; pointer-events: none; }`,
    );
    lines.push(
      `.ai-edge-label { fill: var(--color-text-secondary); font-family: 'DM Sans', sans-serif; font-size: 8px; pointer-events: none; }`,
    );
    return lines.join('\n');
  }, [clusters]);

  // d3-zoom setup
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .filter((event: Event) => {
        // Allow drag and touch events unconditionally
        if (event.type !== 'wheel') return true;
        // Wheel events require Ctrl (Win/Linux) or Meta/Cmd (Mac)
        return (
          (event as WheelEvent).ctrlKey || (event as WheelEvent).metaKey
        );
      })
      .on('zoom', (event) => {
        setTransform(event.transform);
      });

    zoomRef.current = zoomBehavior;
    select(svg).call(zoomBehavior);

    // Show hint overlay on unmodified wheel
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) {
        setShowZoomHint(true);
      }
    };
    svg.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      select(svg).on('.zoom', null);
      svg.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Auto-hide zoom hint after 2 seconds
  useEffect(() => {
    if (!showZoomHint) return;
    const timer = setTimeout(() => setShowZoomHint(false), 2000);
    return () => clearTimeout(timer);
  }, [showZoomHint]);

  // Reset zoom to identity (zoom-to-fit)
  const resetZoom = useCallback(() => {
    const svg = svgRef.current;
    const zoomBehavior = zoomRef.current;
    if (!svg || !zoomBehavior) return;
    select(svg)
      .transition()
      .duration(500)
      .call(zoomBehavior.transform, zoomIdentity);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${meta.width} ${meta.height}`}
        className="w-full h-auto"
        style={{ maxWidth: `${meta.width}px`, cursor: 'grab' }}
        role="img"
        aria-label={`Interactive AI Landscape graph with ${nodes.length} concepts across ${clusters.length} clusters`}
      >
        <style dangerouslySetInnerHTML={{ __html: cssString }} />
        <g transform={transform.toString()}>
          {/* Edges layer (rendered first for z-order) */}
          <g className="edges">
            {edges.map((edge) => {
              const src = posMap.get(edge.source);
              const tgt = posMap.get(edge.target);
              if (!src || !tgt) return null;

              let strokeWidth = '1';
              let strokeDasharray: string | undefined;
              let opacity: number | undefined;

              if (edge.type === 'hierarchy') {
                strokeWidth = '2';
              } else if (edge.type === 'includes') {
                strokeWidth = '1.5';
                strokeDasharray = '4 3';
              } else {
                opacity = 0.4;
              }

              const edgeKey = `${edge.source}-${edge.target}`;
              return (
                <g key={edgeKey}>
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    className="ai-edge"
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    opacity={opacity}
                  />
                </g>
              );
            })}
          </g>

          {/* Nodes layer */}
          <g className="nodes">
            {nodes.map((node) => {
              const pos = posMap.get(node.id);
              if (!pos) return null;
              const r = rootNodeIds.has(node.id)
                ? ROOT_NODE_RADIUS
                : NODE_RADIUS;
              const cluster = clusterMap.get(node.cluster);
              const clusterClass = cluster
                ? `ai-cluster-${cluster.id}`
                : '';
              const label = stripParenthetical(node.name);
              const labelY = pos.y + r + LABEL_FONT_SIZE + 2;

              return (
                <g key={node.id}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={r}
                    className={clusterClass}
                  />
                  <text
                    x={pos.x}
                    y={labelY}
                    textAnchor="middle"
                    className="ai-label"
                  >
                    {label}
                  </text>
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {/* Zoom-to-fit reset button */}
      <button
        onClick={resetZoom}
        className="absolute top-3 right-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-xs font-mono text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-secondary)] transition-colors shadow-sm"
        title="Reset zoom to fit all nodes"
        aria-label="Reset zoom to fit all nodes"
      >
        Reset View
      </button>

      {/* Modifier key zoom hint overlay */}
      {showZoomHint && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/70 text-white text-sm px-4 py-2 rounded-lg">
            Use{' '}
            <kbd className="font-mono bg-white/20 px-1.5 py-0.5 rounded text-xs">
              Ctrl
            </kbd>{' '}
            + scroll to zoom
          </div>
        </div>
      )}
    </div>
  );
}
