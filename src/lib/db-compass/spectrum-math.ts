/**
 * Pure TypeScript utility for complexity spectrum positioning.
 * ZERO framework dependencies -- no Astro, no React, no DOM APIs.
 * Usable in both Astro frontmatter and Node/Satori OG image contexts.
 */

/** A positioned model on the complexity spectrum */
export interface SpectrumPoint {
  /** Pixel x-coordinate on the SVG canvas */
  x: number;
  /** Pixel y-coordinate (baseline position before stagger) */
  y: number;
  /** Full model name */
  label: string;
  /** 2-5 character abbreviated label for compact display */
  shortLabel: string;
  /** Model identifier */
  id: string;
  /** URL-safe slug */
  slug: string;
  /** Original 0-1 complexity position */
  complexityPosition: number;
}

/** Abbreviated labels for each database model -- 2-5 characters for compact SVG display */
export const MODEL_SHORT_LABELS: Record<string, string> = {
  'key-value': 'KV',
  'document': 'Doc',
  'in-memory': 'Mem',
  'time-series': 'TS',
  'relational': 'Rel',
  'search': 'Search',
  'columnar': 'Col',
  'vector': 'Vec',
  'newsql': 'NewSQL',
  'graph': 'Graph',
  'object': 'Obj',
  'multi-model': 'Multi',
};

/** Minimal model input for spectrum positioning */
interface SpectrumModel {
  id: string;
  name: string;
  slug: string;
  complexityPosition: number;
}

/**
 * Maps each model's complexityPosition (0-1) to pixel coordinates
 * within a padded horizontal axis.
 *
 * @param width - Total SVG width in pixels
 * @param models - Array of models with id, name, slug, and complexityPosition
 * @param padding - Horizontal padding on each side (default 60)
 * @param baselineY - Vertical baseline position (default 80)
 * @returns Array of SpectrumPoint with computed x/y positions
 */
export function computeSpectrumPositions(
  width: number,
  models: SpectrumModel[],
  padding: number = 60,
  baselineY: number = 80,
): SpectrumPoint[] {
  const usableWidth = width - padding * 2;

  return models.map((model) => ({
    x: padding + model.complexityPosition * usableWidth,
    y: baselineY,
    label: model.name,
    shortLabel: MODEL_SHORT_LABELS[model.id] ?? model.id.slice(0, 4),
    id: model.id,
    slug: model.slug,
    complexityPosition: model.complexityPosition,
  }));
}

/**
 * Groups spectrum points that are close together so the component
 * can apply vertical staggering to avoid label overlap.
 *
 * Points within the threshold distance are grouped together.
 * Groups are returned as arrays of indices into the input points array.
 *
 * @param points - Array of SpectrumPoint (must be sorted by x)
 * @param threshold - Minimum pixel distance before points cluster (default 0.08 * total width)
 * @returns Array of index groups -- each group is an array of point indices that are clustered
 */
export function detectClusters(
  points: SpectrumPoint[],
  threshold?: number,
): number[][] {
  if (points.length === 0) return [];

  // Default threshold: 0.08 of the span from first to last point
  const span = points.length > 1
    ? points[points.length - 1].x - points[0].x
    : 100;
  const minGap = threshold ?? span * 0.08;

  const groups: number[][] = [];
  let currentGroup: number[] = [0];

  for (let i = 1; i < points.length; i++) {
    const gap = points[i].x - points[i - 1].x;
    if (gap <= minGap) {
      currentGroup.push(i);
    } else {
      groups.push(currentGroup);
      currentGroup = [i];
    }
  }
  groups.push(currentGroup);

  return groups;
}
