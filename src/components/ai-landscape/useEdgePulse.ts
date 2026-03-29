import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import type { Edge } from '../../lib/ai-landscape/graph-data';

gsap.registerPlugin(useGSAP);

interface UseEdgePulseOptions {
  selectedNodeId: string | null;
  edges: Edge[];
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Custom hook that animates a traveling dash pulse along edges
 * connected to a selected node. Uses GSAP strokeDashoffset animation
 * with automatic cleanup via useGSAP.
 *
 * - Pulse radiates outward from the selected node
 * - Skips animation when prefers-reduced-motion is enabled
 * - Cleans up automatically on deselection or node change
 */
export function useEdgePulse({
  selectedNodeId,
  edges,
  containerRef,
}: UseEdgePulseOptions) {
  const pulseRefs = useRef<Map<string, SVGPathElement>>(new Map());

  useGSAP(
    () => {
      if (!selectedNodeId) return;

      // Respect reduced motion preference
      const REDUCED_MOTION = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;
      if (REDUCED_MOTION) return;

      // Find edges connected to selected node
      const connectedEdges = edges.filter(
        (e) => e.source === selectedNodeId || e.target === selectedNodeId,
      );

      connectedEdges.forEach((edge) => {
        const key = `${edge.source}-${edge.target}`;
        const el = pulseRefs.current.get(key);
        if (!el) return;

        // Compute path length for dash animation
        const length = el.getTotalLength();

        if (length === 0) return;

        const dashLength = length * 0.15; // 15% of edge length

        // Determine direction: pulse radiates outward from selected node
        // If selected node is the source, animate offset from length to 0 (forward)
        // If selected node is the target, animate offset from 0 to length (backward = visually outward)
        const isSource = edge.source === selectedNodeId;
        const startOffset = isSource ? length : 0;
        const endOffset = isSource ? 0 : length;

        gsap.set(el, {
          strokeDasharray: `${dashLength} ${length - dashLength}`,
          strokeDashoffset: startOffset,
          opacity: 1,
        });

        gsap.to(el, {
          strokeDashoffset: endOffset,
          duration: 1.2,
          ease: 'power1.inOut',
          repeat: -1,
        });
      });
    },
    { dependencies: [selectedNodeId], scope: containerRef },
  );

  return { pulseRefs };
}
