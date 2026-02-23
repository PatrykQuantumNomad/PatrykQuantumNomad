import type { ParsedResource, ResourceRegistry } from './types';
import { getPodSpec, getContainerSpecs } from './container-helpers';
import { TEMPLATE_LABEL_PATHS } from './rules/cross-resource/KA-X001-service-selector-mismatch';
import {
  WELL_KNOWN_CONFIGMAPS,
  WELL_KNOWN_SECRETS,
  WELL_KNOWN_SERVICES,
  WELL_KNOWN_PVCS,
  WELL_KNOWN_SERVICE_ACCOUNTS,
} from './rules/cross-resource/well-known-resources';

// ── Types ──────────────────────────────────────────────────────────────────

export type K8sEdgeType =
  | 'selector-match'
  | 'volume-mount'
  | 'env-from'
  | 'ingress-backend'
  | 'hpa-target'
  | 'rbac-binding';

export type K8sNodeCategory =
  | 'workload'
  | 'service'
  | 'config'
  | 'storage'
  | 'rbac'
  | 'scaling';

export interface K8sGraphNode {
  id: string;
  kind: string;
  name: string;
  namespace: string;
  category: K8sNodeCategory;
  isPhantom?: boolean;
}

export interface K8sGraphEdge {
  sourceId: string;
  targetId: string;
  targetKind: string;
  targetName: string;
  edgeType: K8sEdgeType;
  resolved: boolean;
  label?: string;
}

export interface K8sGraphData {
  nodes: K8sGraphNode[];
  edges: K8sGraphEdge[];
  hasDanglingRefs: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────

export const KIND_TO_CATEGORY: Record<string, K8sNodeCategory> = {
  // Workloads
  Pod: 'workload',
  Deployment: 'workload',
  StatefulSet: 'workload',
  DaemonSet: 'workload',
  ReplicaSet: 'workload',
  Job: 'workload',
  CronJob: 'workload',
  // Services
  Service: 'service',
  Ingress: 'service',
  // Config
  ConfigMap: 'config',
  Secret: 'config',
  // Storage
  PersistentVolumeClaim: 'storage',
  // RBAC
  ServiceAccount: 'rbac',
  Role: 'rbac',
  ClusterRole: 'rbac',
  RoleBinding: 'rbac',
  ClusterRoleBinding: 'rbac',
  // Scaling
  HorizontalPodAutoscaler: 'scaling',
  // Network
  NetworkPolicy: 'service',
};

const KNOWN_SCALABLE_KINDS = new Set(['Deployment', 'StatefulSet', 'ReplicaSet']);

// ── Helpers ────────────────────────────────────────────────────────────────

function resourceId(kind: string, namespace: string, name: string): string {
  return `${kind}/${namespace}/${name}`;
}

/** Navigate a nested object by path segments, returning the value or undefined. */
function getNestedValue(obj: unknown, path: string[]): unknown {
  let current: unknown = obj;
  for (const segment of path) {
    if (current && typeof current === 'object' && !Array.isArray(current)) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }
  }
  return current;
}

// ── Extraction Functions ───────────────────────────────────────────────────

function extractServiceSelectorEdges(
  resources: ParsedResource[],
  nodeIds: Set<string>,
): K8sGraphEdge[] {
  const edges: K8sGraphEdge[] = [];
  const seen = new Set<string>();

  for (const resource of resources) {
    if (resource.kind !== 'Service') continue;

    const spec = resource.json.spec as Record<string, unknown> | undefined;
    const selector = spec?.selector as Record<string, string> | undefined;
    if (!selector || Object.keys(selector).length === 0) continue;

    const selectorEntries = Object.entries(selector);
    const sourceId = resourceId(resource.kind, resource.namespace, resource.name);

    for (const candidate of resources) {
      if (candidate.namespace !== resource.namespace) continue;

      const labelPath = TEMPLATE_LABEL_PATHS[candidate.kind];
      if (!labelPath) continue;

      const templateLabels = getNestedValue(candidate.json, labelPath) as
        | Record<string, string>
        | undefined;
      if (!templateLabels) continue;

      const allMatch = selectorEntries.every(
        ([k, v]) => templateLabels[k] === v,
      );
      if (!allMatch) continue;

      const targetId = resourceId(candidate.kind, candidate.namespace, candidate.name);
      const key = `${sourceId}->${targetId}:selector-match`;
      if (seen.has(key)) continue;
      seen.add(key);

      edges.push({
        sourceId,
        targetId,
        targetKind: candidate.kind,
        targetName: candidate.name,
        edgeType: 'selector-match',
        resolved: true,
      });
    }
    // Dangling selector does NOT create phantom edge (no specific target)
  }

  return edges;
}

function extractIngressBackendEdges(
  resources: ParsedResource[],
  nodeIds: Set<string>,
): K8sGraphEdge[] {
  const edges: K8sGraphEdge[] = [];
  const seen = new Set<string>();

  for (const resource of resources) {
    if (resource.kind !== 'Ingress') continue;

    const sourceId = resourceId(resource.kind, resource.namespace, resource.name);
    const spec = resource.json.spec as Record<string, unknown> | undefined;
    if (!spec) continue;

    const serviceNames: string[] = [];

    // spec.rules[*].http.paths[*].backend.service.name
    const rules = spec.rules as Record<string, unknown>[] | undefined;
    if (Array.isArray(rules)) {
      for (const rule of rules) {
        const http = rule.http as Record<string, unknown> | undefined;
        const paths = http?.paths as Record<string, unknown>[] | undefined;
        if (!Array.isArray(paths)) continue;
        for (const p of paths) {
          const backend = p.backend as Record<string, unknown> | undefined;
          const svc = backend?.service as Record<string, unknown> | undefined;
          const name = svc?.name as string | undefined;
          if (name) serviceNames.push(name);
        }
      }
    }

    // spec.defaultBackend.service.name
    const defaultBackend = spec.defaultBackend as Record<string, unknown> | undefined;
    const defaultSvc = defaultBackend?.service as Record<string, unknown> | undefined;
    const defaultName = defaultSvc?.name as string | undefined;
    if (defaultName) serviceNames.push(defaultName);

    for (const svcName of serviceNames) {
      if (WELL_KNOWN_SERVICES.has(svcName)) continue;

      const targetId = resourceId('Service', resource.namespace, svcName);
      const key = `${sourceId}->${targetId}:ingress-backend`;
      if (seen.has(key)) continue;
      seen.add(key);

      edges.push({
        sourceId,
        targetId,
        targetKind: 'Service',
        targetName: svcName,
        edgeType: 'ingress-backend',
        resolved: nodeIds.has(targetId),
      });
    }
  }

  return edges;
}

function extractConfigMapEdges(
  resources: ParsedResource[],
  nodeIds: Set<string>,
): K8sGraphEdge[] {
  const edges: K8sGraphEdge[] = [];
  const seen = new Set<string>();

  for (const resource of resources) {
    const pod = getPodSpec(resource);
    if (!pod) continue;

    const sourceId = resourceId(resource.kind, resource.namespace, resource.name);
    const { podSpec } = pod;

    // Volumes: podSpec.volumes[*].configMap.name
    const volumes = podSpec.volumes as Record<string, unknown>[] | undefined;
    if (Array.isArray(volumes)) {
      for (const vol of volumes) {
        const cm = vol.configMap as Record<string, unknown> | undefined;
        const name = cm?.name as string | undefined;
        if (!name || WELL_KNOWN_CONFIGMAPS.has(name)) continue;

        const targetId = resourceId('ConfigMap', resource.namespace, name);
        const key = `${sourceId}->${targetId}:volume-mount`;
        if (seen.has(key)) continue;
        seen.add(key);

        edges.push({
          sourceId,
          targetId,
          targetKind: 'ConfigMap',
          targetName: name,
          edgeType: 'volume-mount',
          resolved: nodeIds.has(targetId),
        });
      }
    }

    // EnvFrom + Env valueFrom in containers
    const containers = getContainerSpecs(resource);
    for (const { container } of containers) {
      // envFrom[*].configMapRef.name
      const envFrom = container.envFrom as Record<string, unknown>[] | undefined;
      if (Array.isArray(envFrom)) {
        for (const ef of envFrom) {
          const ref = ef.configMapRef as Record<string, unknown> | undefined;
          const name = ref?.name as string | undefined;
          if (!name || WELL_KNOWN_CONFIGMAPS.has(name)) continue;

          const targetId = resourceId('ConfigMap', resource.namespace, name);
          const key = `${sourceId}->${targetId}:env-from`;
          if (seen.has(key)) continue;
          seen.add(key);

          edges.push({
            sourceId,
            targetId,
            targetKind: 'ConfigMap',
            targetName: name,
            edgeType: 'env-from',
            resolved: nodeIds.has(targetId),
          });
        }
      }

      // env[*].valueFrom.configMapKeyRef.name
      const env = container.env as Record<string, unknown>[] | undefined;
      if (Array.isArray(env)) {
        for (const e of env) {
          const valueFrom = e.valueFrom as Record<string, unknown> | undefined;
          const keyRef = valueFrom?.configMapKeyRef as Record<string, unknown> | undefined;
          const name = keyRef?.name as string | undefined;
          if (!name || WELL_KNOWN_CONFIGMAPS.has(name)) continue;

          const targetId = resourceId('ConfigMap', resource.namespace, name);
          const key = `${sourceId}->${targetId}:env-from`;
          if (seen.has(key)) continue;
          seen.add(key);

          edges.push({
            sourceId,
            targetId,
            targetKind: 'ConfigMap',
            targetName: name,
            edgeType: 'env-from',
            resolved: nodeIds.has(targetId),
          });
        }
      }
    }
  }

  return edges;
}

function extractSecretEdges(
  resources: ParsedResource[],
  nodeIds: Set<string>,
): K8sGraphEdge[] {
  const edges: K8sGraphEdge[] = [];
  const seen = new Set<string>();

  for (const resource of resources) {
    const pod = getPodSpec(resource);
    if (!pod) continue;

    const sourceId = resourceId(resource.kind, resource.namespace, resource.name);
    const { podSpec } = pod;

    // Volumes: podSpec.volumes[*].secret.secretName
    const volumes = podSpec.volumes as Record<string, unknown>[] | undefined;
    if (Array.isArray(volumes)) {
      for (const vol of volumes) {
        const secret = vol.secret as Record<string, unknown> | undefined;
        const name = secret?.secretName as string | undefined;
        if (!name || WELL_KNOWN_SECRETS.has(name)) continue;

        const targetId = resourceId('Secret', resource.namespace, name);
        const key = `${sourceId}->${targetId}:volume-mount`;
        if (seen.has(key)) continue;
        seen.add(key);

        edges.push({
          sourceId,
          targetId,
          targetKind: 'Secret',
          targetName: name,
          edgeType: 'volume-mount',
          resolved: nodeIds.has(targetId),
        });
      }
    }

    // EnvFrom + Env valueFrom in containers
    const containers = getContainerSpecs(resource);
    for (const { container } of containers) {
      // envFrom[*].secretRef.name
      const envFrom = container.envFrom as Record<string, unknown>[] | undefined;
      if (Array.isArray(envFrom)) {
        for (const ef of envFrom) {
          const ref = ef.secretRef as Record<string, unknown> | undefined;
          const name = ref?.name as string | undefined;
          if (!name || WELL_KNOWN_SECRETS.has(name)) continue;

          const targetId = resourceId('Secret', resource.namespace, name);
          const key = `${sourceId}->${targetId}:env-from`;
          if (seen.has(key)) continue;
          seen.add(key);

          edges.push({
            sourceId,
            targetId,
            targetKind: 'Secret',
            targetName: name,
            edgeType: 'env-from',
            resolved: nodeIds.has(targetId),
          });
        }
      }

      // env[*].valueFrom.secretKeyRef.name
      const env = container.env as Record<string, unknown>[] | undefined;
      if (Array.isArray(env)) {
        for (const e of env) {
          const valueFrom = e.valueFrom as Record<string, unknown> | undefined;
          const keyRef = valueFrom?.secretKeyRef as Record<string, unknown> | undefined;
          const name = keyRef?.name as string | undefined;
          if (!name || WELL_KNOWN_SECRETS.has(name)) continue;

          const targetId = resourceId('Secret', resource.namespace, name);
          const key = `${sourceId}->${targetId}:env-from`;
          if (seen.has(key)) continue;
          seen.add(key);

          edges.push({
            sourceId,
            targetId,
            targetKind: 'Secret',
            targetName: name,
            edgeType: 'env-from',
            resolved: nodeIds.has(targetId),
          });
        }
      }
    }
  }

  return edges;
}

function extractPvcEdges(
  resources: ParsedResource[],
  nodeIds: Set<string>,
): K8sGraphEdge[] {
  const edges: K8sGraphEdge[] = [];
  const seen = new Set<string>();

  for (const resource of resources) {
    const pod = getPodSpec(resource);
    if (!pod) continue;

    const sourceId = resourceId(resource.kind, resource.namespace, resource.name);
    const volumes = pod.podSpec.volumes as Record<string, unknown>[] | undefined;
    if (!Array.isArray(volumes)) continue;

    for (const vol of volumes) {
      const pvc = vol.persistentVolumeClaim as Record<string, unknown> | undefined;
      const claimName = pvc?.claimName as string | undefined;
      if (!claimName || WELL_KNOWN_PVCS.has(claimName)) continue;

      const targetId = resourceId('PersistentVolumeClaim', resource.namespace, claimName);
      const key = `${sourceId}->${targetId}:volume-mount`;
      if (seen.has(key)) continue;
      seen.add(key);

      edges.push({
        sourceId,
        targetId,
        targetKind: 'PersistentVolumeClaim',
        targetName: claimName,
        edgeType: 'volume-mount',
        resolved: nodeIds.has(targetId),
      });
    }
  }

  return edges;
}

function extractServiceAccountEdges(
  resources: ParsedResource[],
  nodeIds: Set<string>,
): K8sGraphEdge[] {
  const edges: K8sGraphEdge[] = [];
  const seen = new Set<string>();

  for (const resource of resources) {
    const pod = getPodSpec(resource);
    if (!pod) continue;

    const sourceId = resourceId(resource.kind, resource.namespace, resource.name);
    const saName = (pod.podSpec.serviceAccountName ?? pod.podSpec.serviceAccount) as
      | string
      | undefined;
    if (!saName || WELL_KNOWN_SERVICE_ACCOUNTS.has(saName)) continue;

    const targetId = resourceId('ServiceAccount', resource.namespace, saName);
    const key = `${sourceId}->${targetId}:rbac-binding`;
    if (seen.has(key)) continue;
    seen.add(key);

    edges.push({
      sourceId,
      targetId,
      targetKind: 'ServiceAccount',
      targetName: saName,
      edgeType: 'rbac-binding',
      resolved: nodeIds.has(targetId),
    });
  }

  return edges;
}

function extractHpaTargetEdges(
  resources: ParsedResource[],
  nodeIds: Set<string>,
): K8sGraphEdge[] {
  const edges: K8sGraphEdge[] = [];
  const seen = new Set<string>();

  for (const resource of resources) {
    if (resource.kind !== 'HorizontalPodAutoscaler') continue;

    const sourceId = resourceId(resource.kind, resource.namespace, resource.name);
    const spec = resource.json.spec as Record<string, unknown> | undefined;
    const scaleTargetRef = spec?.scaleTargetRef as Record<string, unknown> | undefined;
    if (!scaleTargetRef) continue;

    const targetKind = scaleTargetRef.kind as string | undefined;
    const targetName = scaleTargetRef.name as string | undefined;
    if (!targetKind || !targetName) continue;
    if (!KNOWN_SCALABLE_KINDS.has(targetKind)) continue;

    const targetId = resourceId(targetKind, resource.namespace, targetName);
    const key = `${sourceId}->${targetId}:hpa-target`;
    if (seen.has(key)) continue;
    seen.add(key);

    edges.push({
      sourceId,
      targetId,
      targetKind,
      targetName,
      edgeType: 'hpa-target',
      resolved: nodeIds.has(targetId),
    });
  }

  return edges;
}

function extractRbacBindingEdges(
  resources: ParsedResource[],
  nodeIds: Set<string>,
): K8sGraphEdge[] {
  const edges: K8sGraphEdge[] = [];
  const seen = new Set<string>();

  for (const resource of resources) {
    if (resource.kind !== 'RoleBinding' && resource.kind !== 'ClusterRoleBinding') continue;

    const sourceId = resourceId(resource.kind, resource.namespace, resource.name);
    const roleRef = resource.json.roleRef as Record<string, unknown> | undefined;
    if (!roleRef) continue;

    const targetKind = roleRef.kind as string | undefined;
    const targetName = roleRef.name as string | undefined;
    if (!targetKind || !targetName) continue;

    // ClusterRole uses 'default' namespace for target ID (consistent with ResourceRegistry)
    const targetNs = targetKind === 'ClusterRole' ? 'default' : resource.namespace;
    const targetId = resourceId(targetKind, targetNs, targetName);
    const key = `${sourceId}->${targetId}:rbac-binding`;
    if (seen.has(key)) continue;
    seen.add(key);

    edges.push({
      sourceId,
      targetId,
      targetKind,
      targetName,
      edgeType: 'rbac-binding',
      resolved: nodeIds.has(targetId),
    });
  }

  return edges;
}

function extractNetworkPolicySelectorEdges(
  resources: ParsedResource[],
  nodeIds: Set<string>,
): K8sGraphEdge[] {
  const edges: K8sGraphEdge[] = [];
  const seen = new Set<string>();

  for (const resource of resources) {
    if (resource.kind !== 'NetworkPolicy') continue;

    const sourceId = resourceId(resource.kind, resource.namespace, resource.name);
    const spec = resource.json.spec as Record<string, unknown> | undefined;
    const podSelector = spec?.podSelector as Record<string, unknown> | undefined;
    const matchLabels = podSelector?.matchLabels as Record<string, string> | undefined;
    if (!matchLabels || Object.keys(matchLabels).length === 0) continue;

    const selectorEntries = Object.entries(matchLabels);

    for (const candidate of resources) {
      if (candidate.namespace !== resource.namespace) continue;

      const labelPath = TEMPLATE_LABEL_PATHS[candidate.kind];
      if (!labelPath) continue;

      const templateLabels = getNestedValue(candidate.json, labelPath) as
        | Record<string, string>
        | undefined;
      if (!templateLabels) continue;

      const allMatch = selectorEntries.every(
        ([k, v]) => templateLabels[k] === v,
      );
      if (!allMatch) continue;

      const targetId = resourceId(candidate.kind, candidate.namespace, candidate.name);
      const key = `${sourceId}->${targetId}:selector-match`;
      if (seen.has(key)) continue;
      seen.add(key);

      edges.push({
        sourceId,
        targetId,
        targetKind: candidate.kind,
        targetName: candidate.name,
        edgeType: 'selector-match',
        resolved: true,
      });
    }
  }

  return edges;
}

// ── Main Extraction Function ───────────────────────────────────────────────

export function extractK8sGraphData(
  resources: ParsedResource[],
  registry: ResourceRegistry,
): K8sGraphData {
  // Build node list from actual resources
  const nodes: K8sGraphNode[] = [];
  const nodeIds = new Set<string>();

  for (const r of resources) {
    const id = resourceId(r.kind, r.namespace, r.name);
    if (nodeIds.has(id)) continue;
    nodeIds.add(id);
    nodes.push({
      id,
      kind: r.kind,
      name: r.name,
      namespace: r.namespace,
      category: KIND_TO_CATEGORY[r.kind] ?? 'workload',
    });
  }

  // Extract all edges
  const allEdges: K8sGraphEdge[] = [
    ...extractServiceSelectorEdges(resources, nodeIds),
    ...extractIngressBackendEdges(resources, nodeIds),
    ...extractConfigMapEdges(resources, nodeIds),
    ...extractSecretEdges(resources, nodeIds),
    ...extractPvcEdges(resources, nodeIds),
    ...extractServiceAccountEdges(resources, nodeIds),
    ...extractHpaTargetEdges(resources, nodeIds),
    ...extractRbacBindingEdges(resources, nodeIds),
    ...extractNetworkPolicySelectorEdges(resources, nodeIds),
  ];

  // Global deduplication pass
  const edgeKeys = new Set<string>();
  const edges: K8sGraphEdge[] = [];
  for (const edge of allEdges) {
    const key = `${edge.sourceId}->${edge.targetId}:${edge.edgeType}`;
    if (edgeKeys.has(key)) continue;
    edgeKeys.add(key);
    edges.push(edge);
  }

  // Add phantom nodes for unresolved references
  let hasDanglingRefs = false;
  for (const edge of edges) {
    if (!edge.resolved && !nodeIds.has(edge.targetId)) {
      hasDanglingRefs = true;
      nodeIds.add(edge.targetId);
      nodes.push({
        id: edge.targetId,
        kind: edge.targetKind,
        name: edge.targetName,
        namespace: edge.targetId.split('/')[1] ?? 'default',
        category: KIND_TO_CATEGORY[edge.targetKind] ?? 'config',
        isPhantom: true,
      });
    }
  }

  // Check if there are any unresolved edges even without phantom nodes
  if (!hasDanglingRefs) {
    hasDanglingRefs = edges.some((e) => !e.resolved);
  }

  return { nodes, edges, hasDanglingRefs };
}
