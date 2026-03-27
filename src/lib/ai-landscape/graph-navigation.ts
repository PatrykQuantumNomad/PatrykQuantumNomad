import type { Edge } from './schema';

/** Bidirectional adjacency map: each node ID maps to the set of its neighbors */
export type AdjacencyMap = Map<string, Set<string>>;

/**
 * Builds a bidirectional adjacency map from the edges array.
 * For each edge, both source->target and target->source entries are created
 * so the graph is navigable in either direction.
 *
 * Runs in O(E) time where E is the number of edges.
 */
export function buildAdjacencyMap(edges: Edge[]): AdjacencyMap {
  const map: AdjacencyMap = new Map();

  for (const edge of edges) {
    if (!map.has(edge.source)) {
      map.set(edge.source, new Set());
    }
    if (!map.has(edge.target)) {
      map.set(edge.target, new Set());
    }
    map.get(edge.source)!.add(edge.target);
    map.get(edge.target)!.add(edge.source);
  }

  return map;
}

/** Direction constant for arrow-key navigation */
const DIRECTION_ANGLES: Record<'up' | 'down' | 'left' | 'right', number> = {
  right: 0,
  down: Math.PI / 2,
  left: Math.PI,
  up: -Math.PI / 2,
};

/**
 * Finds the neighbor of `currentId` that best matches the given arrow-key direction.
 *
 * For each neighbor, computes the angle from the current node's position to
 * the neighbor's position, then scores it using cosine similarity against the
 * target direction angle. Returns the neighbor with the highest score that is
 * within 90 degrees of the desired direction (score > 0).
 *
 * **Dead-end fallback:** If no neighbor scores > 0, returns the neighbor with
 * the best score regardless (nearest neighbor in any direction). Only returns
 * null if the node has zero neighbors.
 */
export function nearestNeighborInDirection(
  currentId: string,
  direction: 'up' | 'down' | 'left' | 'right',
  adjacencyMap: AdjacencyMap,
  posMap: Map<string, { x: number; y: number }>,
): string | null {
  const neighbors = adjacencyMap.get(currentId);
  if (!neighbors || neighbors.size === 0) return null;

  const currentPos = posMap.get(currentId);
  if (!currentPos) return null;

  const targetAngle = DIRECTION_ANGLES[direction];
  let bestId: string | null = null;
  let bestScore = -Infinity;

  for (const neighborId of neighbors) {
    const neighborPos = posMap.get(neighborId);
    if (!neighborPos) continue;

    const dx = neighborPos.x - currentPos.x;
    const dy = neighborPos.y - currentPos.y;
    const angle = Math.atan2(dy, dx);
    const score = Math.cos(angle - targetAngle);

    if (score > bestScore) {
      bestScore = score;
      bestId = neighborId;
    }
  }

  return bestId;
}
