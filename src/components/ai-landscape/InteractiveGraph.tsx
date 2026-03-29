import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomTransform, type ZoomBehavior } from 'd3-zoom';
import {
  type GraphProps,
  type AiNode,
  type ClusterBounds,
  ROOT_NODE_RADIUS,
  NODE_RADIUS,
  LABEL_FONT_SIZE,
  EDGE_TYPE_COLORS,
  stripParenthetical,
  firstSentence,
  getClusterBounds,
  linkArc,
  arcMidpoint,
} from '../../lib/ai-landscape/graph-data';
import { DetailPanel } from './DetailPanel';
import { ComparePanel } from './ComparePanel';
import { BottomSheet } from './BottomSheet';
import { useMediaQuery } from './useMediaQuery';
import { buildAncestryChain } from '../../lib/ai-landscape/ancestry';
import { buildAdjacencyMap, nearestNeighborInDirection } from '../../lib/ai-landscape/graph-navigation';
import { useUrlNodeState } from './useUrlNodeState';
import { SearchBar } from './SearchBar';
import { useTour } from './useTour';
import { TourSelector } from './TourSelector';
import { TourBar } from './TourBar';
import { useEdgePulse } from './useEdgePulse';

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
  // Node selection state for detail panel
  const [selectedNode, setSelectedNode] = useState<AiNode | null>(null);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<Set<string>>(new Set());
  const isDesktop = useMediaQuery('(min-width: 768px)');
  // Compare mode state
  const [compareMode, setCompareMode] = useState(false);
  const [compareNode, setCompareNode] = useState<AiNode | null>(null);
  // Keyboard focus state for graph navigation
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  // Click-vs-drag discrimination
  const hasDragged = useRef(false);

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
  const adjacencyMap = useMemo(
    () => buildAdjacencyMap(edges),
    [edges],
  );

  // Pre-compute cluster bounding boxes for cluster zoom
  const clusterBoundsMap = useMemo(() => {
    const map = new Map<string, ClusterBounds>();
    for (const c of clusters) {
      const bounds = getClusterBounds(c.id, nodes, posMap);
      if (bounds) map.set(c.id, bounds);
    }
    return map;
  }, [clusters, nodes, posMap]);

  // URL state hook — reads ?node= param on mount, provides syncToUrl callback
  const { initialNodeSlug, syncToUrl } = useUrlNodeState(nodeMap);

  // Tour state machine
  const tour = useTour();

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
    for (const [type, colors] of Object.entries(EDGE_TYPE_COLORS)) {
      lines.push(`.ai-edge-${type} { stroke: ${colors.light}; fill: none; opacity: 0.45; }`);
      lines.push(`html.dark .ai-edge-${type} { stroke: ${colors.dark}; }`);
    }
    lines.push(
      `.ai-label { fill: var(--color-text-primary); font-family: 'DM Sans', sans-serif; font-size: 9px; pointer-events: none; }`,
    );
    for (const cluster of clusters) {
      lines.push(`.ai-abbr-${cluster.id} { fill: ${cluster.darkColor}; }`);
      lines.push(`html.dark .ai-abbr-${cluster.id} { fill: ${cluster.color}; }`);
    }
    lines.push(
      `.ai-node-abbr { font-family: 'DM Sans', sans-serif; font-weight: 600; pointer-events: none; }`,
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
      .extent([[0, 0], [meta.width, meta.height]])
      .filter((event: Event) => {
        // Allow drag and touch events unconditionally
        if (event.type !== 'wheel') return true;
        // Wheel events require Ctrl (Win/Linux) or Meta/Cmd (Mac)
        return (
          (event as WheelEvent).ctrlKey || (event as WheelEvent).metaKey
        );
      })
      .on('start', () => {
        hasDragged.current = false;
      })
      .on('zoom', (event) => {
        if (event.sourceEvent) hasDragged.current = true;
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

  // Reset zoom to fit entire graph
  const resetZoom = useCallback(() => {
    const svg = svgRef.current;
    const zoomBehavior = zoomRef.current;
    if (!svg || !zoomBehavior) return;
    select(svg)
      .transition()
      .duration(500)
      .call(zoomBehavior.transform, zoomIdentity);
  }, []);

  // Zoom-to-node: animate pan+zoom to center a specific node
  const zoomToNode = useCallback((nodeId: string) => {
    const svg = svgRef.current;
    const zoomBehavior = zoomRef.current;
    const pos = posMap.get(nodeId);
    if (!svg || !zoomBehavior || !pos) return;

    // Use viewBox dimensions (NOT element pixel dimensions)
    const scale = 2;
    const tx = meta.width / 2 - scale * pos.x;
    const ty = meta.height / 2 - scale * pos.y;
    const newTransform = zoomIdentity.translate(tx, ty).scale(scale);

    select(svg)
      .transition()
      .duration(750)
      .call(zoomBehavior.transform, newTransform);
  }, [posMap, meta.width, meta.height]);

  // Zoom-to-cluster: animate pan+zoom to center a cluster's bounding box
  const zoomToCluster = useCallback((clusterId: string) => {
    const svg = svgRef.current;
    const zoomBehavior = zoomRef.current;
    const bounds = clusterBoundsMap.get(clusterId);
    if (!svg || !zoomBehavior || !bounds) return;

    // Use viewBox dimensions for transform math (d3-zoom operates in viewBox space)
    const vbW = meta.width;
    const vbH = meta.height;

    const { x0, y0, x1, y1 } = bounds;
    const scale = Math.min(
      vbW / (x1 - x0),
      vbH / (y1 - y0),
    );

    // Clamp to [0.5, 3] — tighter than zoom extent [0.3, 4]
    const clampedScale = Math.max(0.5, Math.min(3, scale));
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    const tx = vbW / 2 - clampedScale * cx;
    const ty = vbH / 2 - clampedScale * cy;
    const clampedTransform = zoomIdentity.translate(tx, ty).scale(clampedScale);

    select(svg)
      .transition()
      .duration(750)
      .call(zoomBehavior.transform, clampedTransform);
  }, [clusterBoundsMap, meta.width, meta.height]);

  // Deep link restoration — select and zoom to node from URL on mount
  useEffect(() => {
    if (!initialNodeSlug) return;
    const node = nodeMap.get(initialNodeSlug);
    if (!node) return;

    // Set selection state immediately (panel opens)
    setSelectedNode(node);

    // Zoom to node — retry once if zoomRef not ready yet
    const attemptZoom = () => {
      if (zoomRef.current && svgRef.current) {
        zoomToNode(initialNodeSlug);
      } else {
        requestAnimationFrame(() => {
          if (zoomRef.current && svgRef.current) {
            zoomToNode(initialNodeSlug);
          }
        });
      }
    };
    attemptZoom();
  }, [initialNodeSlug, nodeMap, zoomToNode]);

  // Tour activation effect — drives selection, zoom, highlighting when tour step changes
  useEffect(() => {
    if (tour.isActive && tour.currentNodeId) {
      // Tour and compare mode are mutually exclusive — exit compare on tour start
      setCompareMode(false);
      setCompareNode(null);

      const node = nodeMap.get(tour.currentNodeId);
      if (node) {
        setSelectedNode(node);
        setHighlightedNodeIds(tour.highlightNodeIds);
        zoomToNode(tour.currentNodeId);
        syncToUrl(tour.currentNodeId);
      }
    }
    // When tour exits, reset graph state
    if (!tour.isActive && tour.currentNodeId === null) {
      // Only call handleClosePanel if we were previously in a tour
      // (avoid running on initial mount when isActive is already false)
    }
  }, [tour.isActive, tour.currentNodeId, tour.highlightNodeIds, nodeMap, zoomToNode, syncToUrl]);

  // Search select handler — zoom to node and update URL
  const handleSearchSelect = useCallback((node: AiNode) => {
    setSelectedNode(node);
    setHighlightedNodeIds(new Set());
    setFocusedNodeId(null);
    zoomToNode(node.id);
    syncToUrl(node.id);
    // Return focus to SVG container for keyboard nav after search
    svgRef.current?.focus();
  }, [zoomToNode, syncToUrl]);

  // Node hover handlers for tooltips
  const handleNodeEnter = (e: React.MouseEvent, node: AiNode) => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
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

  // Node click handler — opens detail panel or handles compare mode selection
  const handleNodeClick = useCallback((node: AiNode) => {
    if (tour.isActive) return; // Block clicks during guided tour
    if (hasDragged.current) return; // Ignore clicks after drag

    if (compareMode) {
      if (selectedNode) {
        // Second node selection — can't compare a node with itself
        if (node.id === selectedNode.id) return;
        setCompareNode(node);
        setHighlightedNodeIds(new Set([selectedNode.id, node.id]));
      } else {
        // First node of comparison
        setSelectedNode(node);
        setHighlightedNodeIds(new Set());
        setFocusedNodeId(null);
        syncToUrl(node.id);
      }
      return;
    }

    // Normal mode
    setSelectedNode(node);
    setHighlightedNodeIds(new Set()); // Clear ancestry highlight when selecting new node
    setFocusedNodeId(null);
    syncToUrl(node.id);
  }, [tour.isActive, compareMode, selectedNode, syncToUrl]);

  // Ancestry highlight handler — highlights ancestry chain on graph
  const handleShowAncestry = useCallback((nodeSlug: string) => {
    const chain = buildAncestryChain(nodeSlug, nodeMap);
    const highlightIds = new Set<string>();
    // Add ancestry chain nodes (slug === id in this dataset)
    for (const ancestor of chain) {
      highlightIds.add(ancestor.slug);
    }
    // Add the node itself
    highlightIds.add(nodeSlug);
    setHighlightedNodeIds(highlightIds);
  }, [nodeMap]);

  // Close panel handler — clears selection, highlights, focus, compare mode, and URL
  const handleClosePanel = useCallback(() => {
    setSelectedNode(null);
    setCompareMode(false);
    setCompareNode(null);
    setHighlightedNodeIds(new Set());
    setFocusedNodeId(null);
    syncToUrl(null);
  }, [syncToUrl]);

  // Close compare panel specifically — exits compare mode but preserves selectedNode
  const handleCloseCompare = useCallback(() => {
    setCompareMode(false);
    setCompareNode(null);
    setHighlightedNodeIds(new Set());
  }, []);

  // When tour exits, clean up graph state
  const prevTourActive = useRef(false);
  useEffect(() => {
    if (prevTourActive.current && !tour.isActive) {
      handleClosePanel();
    }
    prevTourActive.current = tour.isActive;
  }, [tour.isActive, handleClosePanel]);

  // Keyboard handler for graph navigation (arrow keys, Enter, Escape, Tab)
  const handleGraphKeyDown = useCallback((e: React.KeyboardEvent<SVGSVGElement>) => {
    // Tour mode keyboard override — arrow keys navigate tour steps, not graph neighbors
    if (tour.isActive) {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          tour.next();
          return;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          tour.prev();
          return;
        case 'Escape':
          e.preventDefault();
          tour.exit();
          return;
        default:
          e.preventDefault();
          return;
      }
    }

    const current = focusedNodeId || selectedNode?.id;

    if (!current) {
      // Nothing focused/selected — Tab focuses first node alphabetically
      if (e.key === 'Tab') {
        e.preventDefault();
        const sortedIds = [...nodeMap.keys()].sort();
        if (sortedIds.length > 0) setFocusedNodeId(sortedIds[0]);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight': {
        e.preventDefault();
        const dir = e.key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right';
        const next = nearestNeighborInDirection(current, dir, adjacencyMap, posMap);
        if (next) {
          setFocusedNodeId(next);
          // Auto-pan to keep focused node visible without changing zoom level
          const svg = svgRef.current;
          const zoomBehavior = zoomRef.current;
          const pos = posMap.get(next);
          if (svg && zoomBehavior && pos) {
            const currentTransform = transform;
            const screenX = currentTransform.applyX(pos.x);
            const screenY = currentTransform.applyY(pos.y);
            // Check if node is outside visible area (with 10% margin)
            const marginX = meta.width * 0.1;
            const marginY = meta.height * 0.1;
            if (screenX < marginX || screenX > meta.width - marginX ||
                screenY < marginY || screenY > meta.height - marginY) {
              // Pan to center the node at current zoom level
              const tx = meta.width / 2 - currentTransform.k * pos.x;
              const ty = meta.height / 2 - currentTransform.k * pos.y;
              const newTransform = zoomIdentity.translate(tx, ty).scale(currentTransform.k);
              select(svg)
                .transition()
                .duration(300)
                .call(zoomBehavior.transform, newTransform);
            }
          }
        }
        break;
      }
      case 'Enter': {
        e.preventDefault();
        const node = nodeMap.get(focusedNodeId ?? '');
        if (node) {
          setSelectedNode(node);
          setHighlightedNodeIds(new Set());
          zoomToNode(node.id);
          syncToUrl(node.id);
        }
        break;
      }
      case 'Escape': {
        e.preventDefault();
        if (compareMode) {
          // Exit compare mode first
          setCompareMode(false);
          setCompareNode(null);
          setHighlightedNodeIds(new Set());
        } else {
          setSelectedNode(null);
          setHighlightedNodeIds(new Set());
          setFocusedNodeId(null);
          syncToUrl(null);
        }
        break;
      }
      case 'Tab': {
        e.preventDefault();
        const sortedIds = [...nodeMap.keys()].sort();
        const currentIdx = sortedIds.indexOf(current);
        const nextIdx = e.shiftKey
          ? (currentIdx - 1 + sortedIds.length) % sortedIds.length
          : (currentIdx + 1) % sortedIds.length;
        setFocusedNodeId(sortedIds[nextIdx]);
        break;
      }
    }
  }, [tour, compareMode, focusedNodeId, selectedNode, nodeMap, adjacencyMap, posMap, transform, meta.width, meta.height, zoomToNode, syncToUrl]);

  // Determine if highlighting is active
  const isHighlighting = highlightedNodeIds.size > 0;

  // Edge pulse animation — animated dashes along connected edges when a node is selected
  const { pulseRefs } = useEdgePulse({
    selectedNodeId: selectedNode?.id ?? null,
    edges,
    containerRef,
  });

  return (
    <div ref={containerRef} className="relative">
      {/* Search/tour controls — constrained to content width */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Tour bar when a tour is active (replaces search bar) */}
      {tour.isActive && tour.activeTour && (
        <div className="mb-3">
          <TourBar
            tour={tour.activeTour}
            currentStep={tour.currentStep}
            narrative={tour.narrative ?? ''}
            onNext={tour.next}
            onPrev={tour.prev}
            onExit={tour.exit}
            totalSteps={tour.activeTour.steps.length}
          />
        </div>
      )}
      {/* Search bar with compare toggle when no tour is active */}
      {!tour.isActive && (
        <div className="mb-3 flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <SearchBar nodes={nodes} onSelect={handleSearchSelect} />
          </div>
          <button
            type="button"
            onClick={() => {
              setCompareMode((prev) => {
                if (prev) {
                  // Turning off: clear compare state
                  setCompareNode(null);
                  setHighlightedNodeIds(new Set());
                }
                return !prev;
              });
            }}
            disabled={tour.isActive}
            className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-mono transition-colors ${
              compareMode
                ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-secondary)]'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            title={compareMode ? 'Exit compare mode' : 'Compare two concepts side by side'}
            aria-label={compareMode ? 'Cancel compare mode' : 'Enter compare mode'}
            aria-pressed={compareMode}
          >
            {compareMode ? 'Cancel Compare' : 'Compare'}
          </button>
        </div>
      )}
      {/* Tour selector when idle (no tour active, no node selected) */}
      {!tour.isActive && !selectedNode && !compareMode && (
        <div className="mb-3">
          <TourSelector onStartTour={tour.start} />
        </div>
      )}
      {/* Compare mode hint */}
      {compareMode && selectedNode && !compareNode && (
        <div className="mb-2 rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 px-3 py-2 text-xs text-[var(--color-text-secondary)]">
          Click another node to compare with <strong className="text-[var(--color-text-primary)]">{selectedNode.name}</strong>
        </div>
      )}
      {compareMode && !selectedNode && (
        <div className="mb-2 rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 px-3 py-2 text-xs text-[var(--color-text-secondary)]">
          Click a node to start comparing
        </div>
      )}
      {/* Interactive cluster legend — click to zoom into a cluster region */}
      <div className="mb-2 hidden md:flex flex-wrap gap-1.5">
        {clusters.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => zoomToCluster(c.id)}
            className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-[10px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-secondary)] transition-colors"
            title={`Zoom to ${c.name} cluster`}
            aria-label={`Zoom to ${c.name} cluster`}
          >
            <span
              className="inline-block w-2.5 h-2.5 rounded-full shrink-0 dark:hidden"
              style={{ background: c.color, border: `1px solid ${c.darkColor}` }}
            />
            <span
              className="hidden dark:inline-block w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: c.darkColor, border: `1px solid ${c.color}` }}
            />
            {c.name}
          </button>
        ))}
      </div>
      </div>
      <div className="flex">
        {/* SVG area */}
        <div className={`${selectedNode && isDesktop ? 'flex-1 min-w-0' : 'w-full'} relative rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] overflow-hidden`}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${meta.width} ${meta.height}`}
            className="w-full"
            style={{ cursor: 'grab', outline: 'none', height: '65vh', maxHeight: '700px' }}
            tabIndex={0}
            onKeyDown={handleGraphKeyDown}
            role="application"
            aria-activedescendant={focusedNodeId ? `node-${focusedNodeId}` : undefined}
            aria-label="Interactive AI Landscape graph. Use arrow keys to navigate between connected concepts, Enter to select, Escape to deselect, Tab to cycle through all concepts."
          >
            <style dangerouslySetInnerHTML={{ __html: cssString }} />
            <defs>
              <marker
                id="arrowhead"
                viewBox="0 -5 10 10"
                refX={8}
                refY={0}
                markerWidth={6}
                markerHeight={6}
                orient="auto"
              >
                <path d="M0,-5L10,0L0,5" fill="context-stroke" />
              </marker>
            </defs>
            <g transform={transform.toString()}>
              {/* Edges layer (rendered first for z-order) */}
              <g className="edges">
                {edges.map((edge) => {
                  const src = posMap.get(edge.source);
                  const tgt = posMap.get(edge.target);
                  if (!src || !tgt) return null;

                  // Shorten target endpoint to node boundary for arrow placement
                  const dist = Math.hypot(tgt.x - src.x, tgt.y - src.y);
                  if (dist === 0) return null;
                  const tgtR = rootNodeIds.has(edge.target) ? ROOT_NODE_RADIUS : NODE_RADIUS;
                  const dx = (tgt.x - src.x) / dist;
                  const dy = (tgt.y - src.y) / dist;
                  const stx = tgt.x - dx * tgtR;
                  const sty = tgt.y - dy * tgtR;

                  const arcD = linkArc(src.x, src.y, stx, sty);

                  let strokeWidth = '1.2';
                  let strokeDasharray: string | undefined;

                  if (edge.type === 'hierarchy') {
                    strokeWidth = '2';
                  } else if (edge.type === 'includes') {
                    strokeWidth = '1.5';
                    strokeDasharray = '4 3';
                  }

                  // Ancestry highlighting for edges
                  const bothInChain = isHighlighting
                    && highlightedNodeIds.has(edge.source)
                    && highlightedNodeIds.has(edge.target);

                  if (isHighlighting && bothInChain) {
                    strokeWidth = '2.5';
                  }

                  const edgeOpacity = isHighlighting && !bothInChain ? 0.1 : undefined;

                  const edgeKey = `${edge.source}-${edge.target}`;
                  return (
                    <g key={edgeKey}>
                      <path
                        d={arcD}
                        className={`ai-edge-${edge.type}`}
                        strokeWidth={strokeWidth}
                        strokeDasharray={strokeDasharray}
                        opacity={edgeOpacity}
                        stroke={isHighlighting && bothInChain ? 'var(--color-accent)' : undefined}
                        fill="none"
                        markerEnd="url(#arrowhead)"
                      />
                      {/* Invisible wider hit-area for non-hierarchy edge hover */}
                      {edge.type !== 'hierarchy' && (
                        <path
                          d={arcD}
                          stroke="transparent"
                          fill="none"
                          strokeWidth={12}
                          style={{ cursor: 'pointer' }}
                          onMouseEnter={() => setHoveredEdge(edgeKey)}
                          onMouseLeave={() => setHoveredEdge(null)}
                        />
                      )}
                      {/* Edge label: backbone always visible, others on hover */}
                      {(edge.type === 'hierarchy' || hoveredEdge === edgeKey) && (() => {
                        const mid = arcMidpoint(src.x, src.y, stx, sty);
                        const mx = mid.x;
                        const my = mid.y - 4;
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

              {/* Edge pulse overlay — animated by GSAP, rendered above base edges */}
              <g className="edge-pulse-overlay" pointerEvents="none">
                {selectedNode &&
                  edges
                    .filter(
                      (e) =>
                        e.source === selectedNode.id ||
                        e.target === selectedNode.id,
                    )
                    .map((edge) => {
                      const src = posMap.get(edge.source);
                      const tgt = posMap.get(edge.target);
                      if (!src || !tgt) return null;
                      const dist = Math.hypot(tgt.x - src.x, tgt.y - src.y);
                      if (dist === 0) return null;
                      const tgtR = rootNodeIds.has(edge.target) ? ROOT_NODE_RADIUS : NODE_RADIUS;
                      const dx = (tgt.x - src.x) / dist;
                      const dy = (tgt.y - src.y) / dist;
                      const arcD = linkArc(src.x, src.y, tgt.x - dx * tgtR, tgt.y - dy * tgtR);
                      const key = `${edge.source}-${edge.target}`;
                      return (
                        <path
                          key={`pulse-${key}`}
                          ref={(el) => {
                            if (el) pulseRefs.current.set(key, el);
                            else pulseRefs.current.delete(key);
                          }}
                          d={arcD}
                          fill="none"
                          stroke="var(--color-accent)"
                          strokeWidth={3}
                          opacity={0}
                          strokeLinecap="round"
                          pointerEvents="none"
                        />
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

                  const inChain = highlightedNodeIds.has(node.id);
                  const isSelected = selectedNode?.id === node.id;
                  const nodeOpacity = isHighlighting && !inChain ? 0.2 : undefined;

                  return (
                    <g
                      key={node.id}
                      id={`node-${node.id}`}
                      style={{ cursor: 'pointer' }}
                      pointerEvents="all"
                      opacity={nodeOpacity}
                      onMouseEnter={(e) => handleNodeEnter(e, node)}
                      onMouseLeave={handleNodeLeave}
                      onClick={() => handleNodeClick(node)}
                    >
                      {/* Keyboard focus ring (dashed, behind selection ring) */}
                      {focusedNodeId === node.id && selectedNode?.id !== node.id && (
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={r + 4}
                          fill="none"
                          stroke="var(--color-accent)"
                          strokeWidth={2}
                          strokeDasharray="4 3"
                        />
                      )}
                      {/* Selection ring (behind the node circle) */}
                      {isSelected && (
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={r + 4}
                          fill="none"
                          stroke="var(--color-accent)"
                          strokeWidth={2}
                        />
                      )}
                      {/* Ancestry highlight ring */}
                      {isHighlighting && inChain && !isSelected && (
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={r + 2}
                          fill="none"
                          stroke="var(--color-accent)"
                          strokeWidth={3}
                        />
                      )}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={r}
                        className={clusterClass}
                      />
                      <text
                        x={pos.x}
                        y={pos.y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        className={`ai-node-abbr ai-abbr-${node.cluster}`}
                        fontSize={r <= NODE_RADIUS ? 7 : 9}
                        pointerEvents="none"
                      >
                        {node.shortLabel}
                      </text>
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

          {/* Interaction hints */}
          <div className="absolute bottom-3 right-3 flex flex-col items-end gap-1 text-[10px] font-mono text-[var(--color-text-secondary)]/60 pointer-events-none select-none">
            <span>Drag to pan</span>
            <span><kbd className="bg-[var(--color-surface)] border border-[var(--color-border)] px-1 rounded text-[9px]">Ctrl</kbd> + scroll to zoom</span>
            <span>Click node to explore</span>
          </div>

          {/* Node hover tooltip */}
          {tooltip && (
            <div
              role="tooltip"
              className="absolute z-10 pointer-events-none max-w-xs px-3 py-2 rounded-lg shadow-lg border text-sm
                bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)]"
              style={{
                left: Math.min(tooltip.x + 12, (svgRef.current?.clientWidth ?? 400) - 260),
                top: tooltip.y - 8,
              }}
            >
              <strong className="block text-xs font-heading mb-1">{tooltip.name}</strong>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{tooltip.description}</p>
            </div>
          )}
        </div>

        {/* Desktop compare panel (wider, replaces detail panel) */}
        {isDesktop && compareMode && selectedNode && compareNode && (
          <div className="w-[560px] shrink-0 border-l border-[var(--color-border)] bg-[var(--color-surface)] overflow-y-auto max-h-[70vh] sticky top-20 overscroll-contain" onWheel={(e) => e.stopPropagation()}>
            <ComparePanel
              node1={selectedNode}
              node2={compareNode}
              edges={edges}
              nodeMap={nodeMap}
              clusterMap={clusterMap}
              onClose={handleCloseCompare}
            />
          </div>
        )}
        {/* Desktop detail panel (when not in compare mode or compare incomplete) */}
        {isDesktop && !(compareMode && compareNode) && selectedNode && (
          <div className="w-[480px] shrink-0 border-l border-[var(--color-border)] bg-[var(--color-surface)] overflow-y-auto max-h-[70vh] sticky top-20 overscroll-contain" onWheel={(e) => e.stopPropagation()}>
            <DetailPanel
              node={selectedNode}
              edges={edges}
              nodeMap={nodeMap}
              onClose={handleClosePanel}
              onShowAncestry={handleShowAncestry}
            />
          </div>
        )}
      </div>

      {/* Mobile bottom sheet: compare panel */}
      {!isDesktop && compareMode && selectedNode && compareNode && (
        <BottomSheet isOpen onClose={handleCloseCompare}>
          <ComparePanel
            node1={selectedNode}
            node2={compareNode}
            edges={edges}
            nodeMap={nodeMap}
            clusterMap={clusterMap}
            onClose={handleCloseCompare}
          />
        </BottomSheet>
      )}
      {/* Mobile bottom sheet: detail panel (when not in compare mode or compare incomplete) */}
      {!isDesktop && !(compareMode && compareNode) && selectedNode && (
        <BottomSheet isOpen={!!selectedNode} onClose={handleClosePanel}>
          <DetailPanel
            node={selectedNode}
            edges={edges}
            nodeMap={nodeMap}
            onClose={handleClosePanel}
            onShowAncestry={handleShowAncestry}
          />
        </BottomSheet>
      )}
    </div>
  );
}
