import type { AiNode } from './schema';

/** Represents an ancestor in the ancestry chain */
export interface AncestryItem {
  slug: string;
  name: string;
  cluster: string;
}

/**
 * Walks the parentId chain from a concept node upward to the root,
 * returning an array of ancestors ordered root-first.
 *
 * Does NOT include the node itself in the chain.
 * Returns an empty array for top-level concepts (parentId is null)
 * or when the slug is not found in the map.
 * Uses a visited set to prevent infinite loops on circular references.
 */
export function buildAncestryChain(
  nodeSlug: string,
  nodesMap: Map<string, AiNode>,
): AncestryItem[] {
  const node = nodesMap.get(nodeSlug);
  if (!node || node.parentId === null) {
    return [];
  }

  const chain: AncestryItem[] = [];
  const visited = new Set<string>([nodeSlug]);

  let currentId: string | null = node.parentId;

  while (currentId !== null) {
    if (visited.has(currentId)) {
      break; // Circular reference detected
    }

    const parent = nodesMap.get(currentId);
    if (!parent) {
      break; // Parent not found in map
    }

    visited.add(currentId);
    chain.unshift({
      slug: parent.slug,
      name: parent.name,
      cluster: parent.cluster,
    });

    currentId = parent.parentId;
  }

  return chain;
}
