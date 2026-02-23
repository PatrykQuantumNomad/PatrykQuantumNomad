/**
 * GVK (Group/Version/Kind) Registry for Kubernetes resource type identification.
 *
 * Maps valid apiVersion/kind combinations to resource type identifiers used for
 * schema validation lookup. Also provides deprecated API version detection with
 * migration guidance.
 *
 * 19 supported resource types covering K8s 1.31 stable APIs.
 * 18 deprecated API version entries with removal version and replacement info.
 */

// ── GVK Registry ────────────────────────────────────────────────────

/** A supported Kubernetes apiVersion/kind combination. */
export interface GvkEntry {
  apiVersion: string;
  kind: string;
  resourceType: string; // matches compiled schema export name (lowercase kind)
  schemaFile: string; // file in yannh/kubernetes-json-schema repo
}

/**
 * All 19 supported apiVersion/kind combinations for K8s 1.31 stable APIs.
 * Each entry's resourceType is the lowercase kind used as the schema export name.
 */
export const GVK_REGISTRY: GvkEntry[] = [
  // v1 core resources
  { apiVersion: 'v1', kind: 'ConfigMap', resourceType: 'configmap', schemaFile: 'configmap-v1.json' },
  { apiVersion: 'v1', kind: 'Secret', resourceType: 'secret', schemaFile: 'secret-v1.json' },
  { apiVersion: 'v1', kind: 'Service', resourceType: 'service', schemaFile: 'service-v1.json' },
  { apiVersion: 'v1', kind: 'ServiceAccount', resourceType: 'serviceaccount', schemaFile: 'serviceaccount-v1.json' },
  { apiVersion: 'v1', kind: 'Namespace', resourceType: 'namespace', schemaFile: 'namespace-v1.json' },
  { apiVersion: 'v1', kind: 'Pod', resourceType: 'pod', schemaFile: 'pod-v1.json' },
  { apiVersion: 'v1', kind: 'PersistentVolumeClaim', resourceType: 'persistentvolumeclaim', schemaFile: 'persistentvolumeclaim-v1.json' },
  // apps/v1 workload resources
  { apiVersion: 'apps/v1', kind: 'Deployment', resourceType: 'deployment', schemaFile: 'deployment-apps-v1.json' },
  { apiVersion: 'apps/v1', kind: 'StatefulSet', resourceType: 'statefulset', schemaFile: 'statefulset-apps-v1.json' },
  { apiVersion: 'apps/v1', kind: 'DaemonSet', resourceType: 'daemonset', schemaFile: 'daemonset-apps-v1.json' },
  // batch/v1 job resources
  { apiVersion: 'batch/v1', kind: 'Job', resourceType: 'job', schemaFile: 'job-batch-v1.json' },
  { apiVersion: 'batch/v1', kind: 'CronJob', resourceType: 'cronjob', schemaFile: 'cronjob-batch-v1.json' },
  // networking.k8s.io/v1 resources
  { apiVersion: 'networking.k8s.io/v1', kind: 'Ingress', resourceType: 'ingress', schemaFile: 'ingress-networking-v1.json' },
  { apiVersion: 'networking.k8s.io/v1', kind: 'NetworkPolicy', resourceType: 'networkpolicy', schemaFile: 'networkpolicy-networking-v1.json' },
  // autoscaling/v2
  { apiVersion: 'autoscaling/v2', kind: 'HorizontalPodAutoscaler', resourceType: 'horizontalpodautoscaler', schemaFile: 'horizontalpodautoscaler-autoscaling-v2.json' },
  // rbac.authorization.k8s.io/v1 resources
  { apiVersion: 'rbac.authorization.k8s.io/v1', kind: 'Role', resourceType: 'role', schemaFile: 'role-rbac-v1.json' },
  { apiVersion: 'rbac.authorization.k8s.io/v1', kind: 'ClusterRole', resourceType: 'clusterrole', schemaFile: 'clusterrole-rbac-v1.json' },
  { apiVersion: 'rbac.authorization.k8s.io/v1', kind: 'RoleBinding', resourceType: 'rolebinding', schemaFile: 'rolebinding-rbac-v1.json' },
  { apiVersion: 'rbac.authorization.k8s.io/v1', kind: 'ClusterRoleBinding', resourceType: 'clusterrolebinding', schemaFile: 'clusterrolebinding-rbac-v1.json' },
];

// ── Lookup Functions ────────────────────────────────────────────────

/**
 * Get the resource type identifier for a given apiVersion/kind combination.
 * Returns the lowercase kind (e.g., 'deployment') or null if not recognized.
 */
export function getResourceType(apiVersion: string, kind: string): string | null {
  const entry = GVK_REGISTRY.find(
    (e) => e.apiVersion === apiVersion && e.kind === kind,
  );
  return entry?.resourceType ?? null;
}

/**
 * Check whether an apiVersion/kind combination is supported.
 */
export function isValidGvk(apiVersion: string, kind: string): boolean {
  return GVK_REGISTRY.some(
    (e) => e.apiVersion === apiVersion && e.kind === kind,
  );
}

/**
 * Case-insensitive near-match lookup for helpful error messages.
 * Returns the closest GVK entry if the user typed the wrong case,
 * or null if no near-match is found.
 */
export function findNearMatch(apiVersion: string, kind: string): GvkEntry | null {
  const lowerApi = apiVersion.toLowerCase();
  const lowerKind = kind.toLowerCase();
  return (
    GVK_REGISTRY.find(
      (e) => e.apiVersion.toLowerCase() === lowerApi && e.kind.toLowerCase() === lowerKind,
    ) ?? null
  );
}

// ── Deprecated API Versions ─────────────────────────────────────────

/** A deprecated Kubernetes API version with migration guidance. */
export interface DeprecatedApiVersion {
  apiVersion: string;
  kind: string;
  removedIn: string; // K8s version where this API was removed
  replacement: string; // stable apiVersion to migrate to
  message: string; // human-readable migration guidance
}

/**
 * All 18 deprecated apiVersion/kind combinations with removal version and
 * migration guidance, covering K8s 1.16 through 1.26 deprecations.
 */
export const DEPRECATED_API_VERSIONS: DeprecatedApiVersion[] = [
  // ── Removed in K8s 1.16 ────────────────────────────────────────────
  { apiVersion: 'extensions/v1beta1', kind: 'Deployment', removedIn: '1.16', replacement: 'apps/v1', message: 'extensions/v1beta1 Deployment was removed in K8s 1.16. Use apps/v1 instead.' },
  { apiVersion: 'extensions/v1beta1', kind: 'DaemonSet', removedIn: '1.16', replacement: 'apps/v1', message: 'extensions/v1beta1 DaemonSet was removed in K8s 1.16. Use apps/v1 instead.' },
  { apiVersion: 'extensions/v1beta1', kind: 'ReplicaSet', removedIn: '1.16', replacement: 'apps/v1', message: 'extensions/v1beta1 ReplicaSet was removed in K8s 1.16. Use apps/v1 instead.' },
  { apiVersion: 'extensions/v1beta1', kind: 'NetworkPolicy', removedIn: '1.16', replacement: 'networking.k8s.io/v1', message: 'extensions/v1beta1 NetworkPolicy was removed in K8s 1.16. Use networking.k8s.io/v1 instead.' },
  { apiVersion: 'apps/v1beta1', kind: 'Deployment', removedIn: '1.16', replacement: 'apps/v1', message: 'apps/v1beta1 Deployment was removed in K8s 1.16. Use apps/v1 instead.' },
  { apiVersion: 'apps/v1beta1', kind: 'StatefulSet', removedIn: '1.16', replacement: 'apps/v1', message: 'apps/v1beta1 StatefulSet was removed in K8s 1.16. Use apps/v1 instead.' },
  { apiVersion: 'apps/v1beta2', kind: 'Deployment', removedIn: '1.16', replacement: 'apps/v1', message: 'apps/v1beta2 Deployment was removed in K8s 1.16. Use apps/v1 instead.' },
  { apiVersion: 'apps/v1beta2', kind: 'StatefulSet', removedIn: '1.16', replacement: 'apps/v1', message: 'apps/v1beta2 StatefulSet was removed in K8s 1.16. Use apps/v1 instead.' },
  { apiVersion: 'apps/v1beta2', kind: 'DaemonSet', removedIn: '1.16', replacement: 'apps/v1', message: 'apps/v1beta2 DaemonSet was removed in K8s 1.16. Use apps/v1 instead.' },
  // ── Removed in K8s 1.22 ────────────────────────────────────────────
  { apiVersion: 'extensions/v1beta1', kind: 'Ingress', removedIn: '1.22', replacement: 'networking.k8s.io/v1', message: 'extensions/v1beta1 Ingress was removed in K8s 1.22. Use networking.k8s.io/v1 instead.' },
  { apiVersion: 'networking.k8s.io/v1beta1', kind: 'Ingress', removedIn: '1.22', replacement: 'networking.k8s.io/v1', message: 'networking.k8s.io/v1beta1 Ingress was removed in K8s 1.22. Use networking.k8s.io/v1 instead.' },
  { apiVersion: 'rbac.authorization.k8s.io/v1beta1', kind: 'Role', removedIn: '1.22', replacement: 'rbac.authorization.k8s.io/v1', message: 'rbac.authorization.k8s.io/v1beta1 Role was removed in K8s 1.22. Use rbac.authorization.k8s.io/v1 instead.' },
  { apiVersion: 'rbac.authorization.k8s.io/v1beta1', kind: 'ClusterRole', removedIn: '1.22', replacement: 'rbac.authorization.k8s.io/v1', message: 'rbac.authorization.k8s.io/v1beta1 ClusterRole was removed in K8s 1.22. Use rbac.authorization.k8s.io/v1 instead.' },
  { apiVersion: 'rbac.authorization.k8s.io/v1beta1', kind: 'RoleBinding', removedIn: '1.22', replacement: 'rbac.authorization.k8s.io/v1', message: 'rbac.authorization.k8s.io/v1beta1 RoleBinding was removed in K8s 1.22. Use rbac.authorization.k8s.io/v1 instead.' },
  { apiVersion: 'rbac.authorization.k8s.io/v1beta1', kind: 'ClusterRoleBinding', removedIn: '1.22', replacement: 'rbac.authorization.k8s.io/v1', message: 'rbac.authorization.k8s.io/v1beta1 ClusterRoleBinding was removed in K8s 1.22. Use rbac.authorization.k8s.io/v1 instead.' },
  // ── Removed in K8s 1.25 ────────────────────────────────────────────
  { apiVersion: 'batch/v1beta1', kind: 'CronJob', removedIn: '1.25', replacement: 'batch/v1', message: 'batch/v1beta1 CronJob was removed in K8s 1.25. Use batch/v1 instead.' },
  { apiVersion: 'autoscaling/v2beta1', kind: 'HorizontalPodAutoscaler', removedIn: '1.25', replacement: 'autoscaling/v2', message: 'autoscaling/v2beta1 HPA was removed in K8s 1.25. Use autoscaling/v2 instead.' },
  // ── Removed in K8s 1.26 ────────────────────────────────────────────
  { apiVersion: 'autoscaling/v2beta2', kind: 'HorizontalPodAutoscaler', removedIn: '1.26', replacement: 'autoscaling/v2', message: 'autoscaling/v2beta2 HPA was removed in K8s 1.26. Use autoscaling/v2 instead.' },
];

/**
 * Check if an apiVersion/kind combination is deprecated.
 * Returns deprecation info with migration guidance, or null if not deprecated.
 */
export function getDeprecation(apiVersion: string, kind: string): DeprecatedApiVersion | null {
  return (
    DEPRECATED_API_VERSIONS.find(
      (d) => d.apiVersion === apiVersion && d.kind === kind,
    ) ?? null
  );
}
