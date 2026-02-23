import type { Document } from 'yaml';
import type {
  ParsedDocument,
  ParsedResource,
  ResourceRegistry as IResourceRegistry,
} from './types';

/**
 * Multi-index registry for cross-resource lookups.
 * Indexes parsed K8s resources by kind, qualified name, namespace, and labels.
 * Used by Phase 44 cross-resource validation (selector matching, reference checks).
 */
export class ResourceRegistry implements IResourceRegistry {
  private byKindIndex = new Map<string, ParsedResource[]>();
  private byNameIndex = new Map<string, ParsedResource[]>(); // key: "kind/namespace/name"
  private byNamespaceIndex = new Map<string, ParsedResource[]>();
  private allResources: ParsedResource[] = [];

  /**
   * Add a resource to all four indexes.
   */
  add(resource: ParsedResource): void {
    this.allResources.push(resource);

    // Index by kind
    const kindList = this.byKindIndex.get(resource.kind) ?? [];
    kindList.push(resource);
    this.byKindIndex.set(resource.kind, kindList);

    // Index by qualified name: "kind/namespace/name"
    const qualName = `${resource.kind}/${resource.namespace}/${resource.name}`;
    const nameList = this.byNameIndex.get(qualName) ?? [];
    nameList.push(resource);
    this.byNameIndex.set(qualName, nameList);

    // Index by namespace
    const nsList = this.byNamespaceIndex.get(resource.namespace) ?? [];
    nsList.push(resource);
    this.byNamespaceIndex.set(resource.namespace, nsList);
  }

  /**
   * Return all resources of a given kind.
   */
  getByKind(kind: string): ParsedResource[] {
    return this.byKindIndex.get(kind) ?? [];
  }

  /**
   * Return the first resource matching a qualified name (kind/namespace/name).
   */
  getByName(
    kind: string,
    namespace: string,
    name: string,
  ): ParsedResource | undefined {
    return this.byNameIndex.get(`${kind}/${namespace}/${name}`)?.[0];
  }

  /**
   * Return all resources in a namespace.
   */
  getByNamespace(namespace: string): ParsedResource[] {
    return this.byNamespaceIndex.get(namespace) ?? [];
  }

  /**
   * Return resources matching all selector key-value pairs.
   * All entries in the selector must match for a resource to be included.
   */
  getByLabels(selector: Record<string, string>): ParsedResource[] {
    const entries = Object.entries(selector);
    if (entries.length === 0) return [];

    return this.allResources.filter((r) =>
      entries.every(([k, v]) => r.labels[k] === v),
    );
  }

  /**
   * Return all registered resources.
   */
  getAll(): ParsedResource[] {
    return this.allResources;
  }

  /**
   * Return count of resources per kind.
   */
  getSummary(): Map<string, number> {
    const summary = new Map<string, number>();
    for (const [kind, resources] of this.byKindIndex) {
      summary.set(kind, resources.length);
    }
    return summary;
  }

  /**
   * Factory method: build a ResourceRegistry from parsed YAML documents.
   * Converts valid (non-empty, has apiVersion/kind/name) ParsedDocuments
   * into ParsedResources with default namespace and annotations extraction.
   */
  static buildFromDocuments(documents: ParsedDocument[]): ResourceRegistry {
    const registry = new ResourceRegistry();

    for (const doc of documents) {
      // Skip empty documents or documents missing required fields
      if (doc.isEmpty || !doc.apiVersion || !doc.kind || !doc.name || !doc.json) {
        continue;
      }

      const resource: ParsedResource = {
        apiVersion: doc.apiVersion,
        kind: doc.kind,
        name: doc.name,
        namespace: doc.namespace ?? 'default',
        labels: doc.labels,
        annotations:
          (doc.json?.metadata as Record<string, unknown>)?.annotations as Record<string, string> ?? {},
        doc: doc.doc,
        json: doc.json,
        startLine: doc.startLine,
      };

      registry.add(resource);
    }

    return registry;
  }
}
