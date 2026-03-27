import { z } from 'astro/zod';

/** Schema for grouped product/framework examples on a concept node */
export const exampleSchema = z.object({
  name: z.string(),
  description: z.string(),
});

/** Zod schema for an AI landscape concept node */
export const aiNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  cluster: z.string(),
  parentId: z.string().nullable(),
  simpleDescription: z.string().min(50),
  technicalDescription: z.string().min(50),
  whyItMatters: z.string(),
  examples: z.array(exampleSchema).default([]),
  dotNodeId: z.string(),
});

/** Categorized edge types derived from DOT relationship labels */
export const edgeTypeEnum = z.enum([
  'hierarchy',
  'includes',
  'enables',
  'example',
  'relates',
  'progression',
  'characterizes',
  'aspires',
  'applies',
  'standardizes',
]);

/** Schema for a relationship edge between two concept nodes */
export const edgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  label: z.string(),
  type: edgeTypeEnum,
});

/** Schema for a cluster definition with nesting hierarchy */
export const clusterSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  darkColor: z.string(),
  parentClusterId: z.string().nullable(),
});

/** TypeScript type inferred from the example schema */
export type Example = z.infer<typeof exampleSchema>;

/** TypeScript type inferred from the AI node schema */
export type AiNode = z.infer<typeof aiNodeSchema>;

/** TypeScript type inferred from the edge schema */
export type Edge = z.infer<typeof edgeSchema>;

/** TypeScript type inferred from the cluster schema */
export type Cluster = z.infer<typeof clusterSchema>;

/** Derives per-node relationships from the canonical edges array */
export function getNodeRelationships(
  nodeSlug: string,
  edges: Edge[],
): {
  parents: Edge[];
  children: Edge[];
  related: Edge[];
} {
  return {
    parents: edges.filter((e) => e.target === nodeSlug),
    children: edges.filter((e) => e.source === nodeSlug),
    related: edges.filter(
      (e) =>
        (e.source === nodeSlug || e.target === nodeSlug) &&
        !['hierarchy', 'includes'].includes(e.type),
    ),
  };
}

/** A UI-friendly group of related nodes sharing a relationship category */
export interface RelationshipGroup {
  label: string;
  items: { slug: string; name: string; edgeLabel: string }[];
}

/**
 * Groups edges connected to a node into five UI-friendly categories:
 * "Part of", "Includes", "Enables", "Examples", and "Related".
 *
 * Only returns groups that contain at least one resolved item.
 */
export function groupRelationshipsByType(
  nodeId: string,
  edges: Edge[],
  nodeMap: Map<string, { name: string; slug: string }>,
): RelationshipGroup[] {
  const partOf: RelationshipGroup['items'] = [];
  const includes: RelationshipGroup['items'] = [];
  const enables: RelationshipGroup['items'] = [];
  const examples: RelationshipGroup['items'] = [];
  const related: RelationshipGroup['items'] = [];

  for (const edge of edges) {
    const isSource = edge.source === nodeId;
    const isTarget = edge.target === nodeId;
    if (!isSource && !isTarget) continue;

    const otherId = isSource ? edge.target : edge.source;
    const other = nodeMap.get(otherId);
    if (!other) continue;

    const item = { slug: other.slug, name: other.name, edgeLabel: edge.label };

    switch (edge.type) {
      case 'hierarchy':
      case 'includes':
        if (isTarget) {
          partOf.push(item);
        } else {
          includes.push(item);
        }
        break;
      case 'enables':
      case 'applies':
        enables.push(item);
        break;
      case 'example':
        examples.push(item);
        break;
      case 'relates':
      case 'progression':
      case 'characterizes':
      case 'aspires':
      case 'standardizes':
        related.push(item);
        break;
    }
  }

  const groups: RelationshipGroup[] = [];
  if (partOf.length > 0) groups.push({ label: 'Part of', items: partOf });
  if (includes.length > 0) groups.push({ label: 'Includes', items: includes });
  if (enables.length > 0) groups.push({ label: 'Enables', items: enables });
  if (examples.length > 0) groups.push({ label: 'Examples', items: examples });
  if (related.length > 0) groups.push({ label: 'Related', items: related });

  return groups;
}
