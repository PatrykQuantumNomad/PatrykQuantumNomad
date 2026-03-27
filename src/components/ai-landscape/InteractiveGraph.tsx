import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomTransform, type ZoomBehavior } from 'd3-zoom';
import {
  type GraphProps,
  type AiNode,
  ROOT_NODE_RADIUS,
  NODE_RADIUS,
  LABEL_FONT_SIZE,
  stripParenthetical,
  firstSentence,
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
  // Tooltip state for node hover
  const [tooltip, setTooltip] = useState<{
    x: number; y: number; name: string; description: string;
  } | null>(null);
  // Edge hover state for showing non-hierarchy edge labels
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);

  // Memoized lookups
  const posMap = useMemo(
    () => new Map(positions.map((p) => [p.id, p])),
    [positions],
  );
  const nodeMap = useMemo(
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

  // Node hover handlers for tooltips
  const handleNodeEnter = (e: React.MouseEvent, node: AiNode) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      name: node.name,
      description: firstSentence(node.simpleDescription),
    });
  };

  const handleNodeLeave = () => {
    setTooltip(null);
  };

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
                  {/* Invisible wider hit-area for non-hierarchy edge hover */}
                  {edge.type !== 'hierarchy' && (
                    <line
                      x1={src.x}
                      y1={src.y}
                      x2={tgt.x}
                      y2={tgt.y}
                      stroke="transparent"
                      strokeWidth={12}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredEdge(edgeKey)}
                      onMouseLeave={() => setHoveredEdge(null)}
                    />
                  )}
                  {/* Edge label: backbone always visible, others on hover */}
                  {(edge.type === 'hierarchy' || hoveredEdge === edgeKey) && (() => {
                    const mx = (src.x + tgt.x) / 2;
                    const my = (src.y + tgt.y) / 2 - 4;
                    const labelWidth = edge.label.length * 4.5 + 8;
                    return (
                      <>
                        <rect
                          x={mx - labelWidth / 2}
                          y={my - 7}
                          width={labelWidth}
                          height={12}
                          rx={3}
                          className="fill-[var(--color-surface)]"
                          opacity={0.85}
                        />
                        <text
                          x={mx}
                          y={my}
                          textAnchor="middle"
                          className="ai-edge-label"
                          fontSize={8}
                        >
                          {edge.label}
                        </text>
                      </>
                    );
                  })()}
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
                <g
                  key={node.id}
                  style={{ cursor: 'pointer' }}
                  pointerEvents="all"
                  onMouseEnter={(e) => handleNodeEnter(e, node)}
                  onMouseLeave={handleNodeLeave}
                >
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

      {/* Node hover tooltip */}
      {tooltip && (
        <div
          role="tooltip"
          className="absolute z-10 pointer-events-none max-w-xs px-3 py-2 rounded-lg shadow-lg border text-sm
            bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)]"
          style={{
            left: Math.min(tooltip.x + 12, (containerRef.current?.clientWidth ?? 400) - 260),
            top: tooltip.y - 8,
          }}
        >
          <strong className="block text-xs font-heading mb-1">{tooltip.name}</strong>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{tooltip.description}</p>
        </div>
      )}
    </div>
  );
}
