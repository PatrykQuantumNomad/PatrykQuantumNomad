/**
 * Dependency graph builder and cycle detection for Docker Compose services.
 *
 * Builds a directed graph from service depends_on declarations and detects
 * cycles using Kahn's algorithm (BFS topological sort). The graph structure
 * is exported for both semantic rules (CV-M002) and Phase 36's React Flow
 * dependency graph visualization.
 */

import { isMap, isPair, isScalar, isSeq } from 'yaml';

export interface ServiceNode {
  name: string;
  dependsOn: string[];
}

export interface DependencyEdge {
  from: string;
  to: string;
  condition?: string;
}

export interface DependencyGraph {
  nodes: ServiceNode[];
  edges: DependencyEdge[];
}

export interface CycleDetectionResult {
  hasCycle: boolean;
  cycleParticipants: string[];
  topologicalOrder: string[];
}

/**
 * Extract depends_on entries from a service AST node.
 *
 * Handles BOTH depends_on forms:
 *   Short: depends_on: [redis, db]          -> YAMLSeq of scalars
 *   Long:  depends_on:                       -> YAMLMap with nested maps
 *            redis:
 *              condition: service_healthy
 *
 * Returns an array of { service, condition? } objects.
 */
export function extractDependsOn(
  serviceNode: any,
): { service: string; condition?: string }[] {
  const result: { service: string; condition?: string }[] = [];

  if (!isMap(serviceNode)) return result;

  for (const item of serviceNode.items) {
    if (!isPair(item) || !isScalar(item.key)) continue;
    if (String(item.key.value) !== 'depends_on') continue;

    const value = item.value;

    // Short form: depends_on: [redis, db]
    if (isSeq(value)) {
      for (const entry of value.items) {
        if (isScalar(entry)) {
          result.push({ service: String(entry.value) });
        }
      }
    }

    // Long form: depends_on: { redis: { condition: service_healthy } }
    if (isMap(value)) {
      for (const depItem of value.items) {
        if (!isPair(depItem) || !isScalar(depItem.key)) continue;
        const depName = String(depItem.key.value);
        let condition: string | undefined;

        if (isMap(depItem.value)) {
          for (const condItem of depItem.value.items) {
            if (
              isPair(condItem) &&
              isScalar(condItem.key) &&
              String(condItem.key.value) === 'condition' &&
              isScalar(condItem.value)
            ) {
              condition = String(condItem.value.value);
            }
          }
        }

        result.push({ service: depName, condition });
      }
    }

    break; // Only one depends_on key per service
  }

  return result;
}

/**
 * Build a dependency graph from service depends_on declarations.
 * Exported for use by CV-M002 rule and Phase 36 graph visualization.
 */
export function buildDependencyGraph(
  services: Map<string, any>,
): DependencyGraph {
  const nodes: ServiceNode[] = [];
  const edges: DependencyEdge[] = [];

  for (const [name, serviceNode] of services) {
    const deps = extractDependsOn(serviceNode);
    nodes.push({ name, dependsOn: deps.map((d) => d.service) });
    for (const dep of deps) {
      edges.push({ from: name, to: dep.service, condition: dep.condition });
    }
  }

  return { nodes, edges };
}

/**
 * Detect cycles using Kahn's algorithm (BFS topological sort).
 *
 * 1. Build adjacency map and in-degree counts from graph edges
 * 2. Start with queue of nodes with in-degree 0
 * 3. Process queue: remove node, decrement neighbors' in-degrees
 * 4. Nodes NOT in the topological order are cycle participants
 */
export function detectCycles(graph: DependencyGraph): CycleDetectionResult {
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  // Initialize all nodes
  for (const node of graph.nodes) {
    inDegree.set(node.name, 0);
    adjacency.set(node.name, []);
  }

  // Build adjacency + count in-degrees (only for known nodes)
  for (const edge of graph.edges) {
    if (!adjacency.has(edge.from)) continue;
    if (!inDegree.has(edge.to)) continue;
    adjacency.get(edge.from)!.push(edge.to);
    inDegree.set(edge.to, (inDegree.get(edge.to) ?? 0) + 1);
  }

  // Start with nodes having in-degree 0
  const queue: string[] = [];
  for (const [node, degree] of inDegree) {
    if (degree === 0) queue.push(node);
  }

  const topologicalOrder: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    topologicalOrder.push(current);
    for (const neighbor of adjacency.get(current) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  // Nodes not in topological order are cycle participants
  const sorted = new Set(topologicalOrder);
  const cycleParticipants = graph.nodes
    .map((n) => n.name)
    .filter((n) => !sorted.has(n));

  return {
    hasCycle: cycleParticipants.length > 0,
    cycleParticipants,
    topologicalOrder,
  };
}
