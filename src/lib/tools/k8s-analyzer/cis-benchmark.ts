/**
 * CIS Kubernetes Benchmark v1.8 reference mapping.
 *
 * Maps K8s analyzer security and RBAC rule IDs to the applicable
 * CIS Benchmark section numbers and titles. Used by rule documentation
 * pages to display compliance references.
 *
 * Only rules with a clear, direct CIS Benchmark mapping are included.
 * Rules like KA-C012 (read-only filesystem) and KA-C018 (secrets in env)
 * are omitted because they lack a direct CIS section equivalent.
 */

export const CIS_BENCHMARK_REFS: Record<string, { section: string; title: string }> = {
  // ── Security Rules (KA-C series) ──────────────────────────────────
  'KA-C001': {
    section: '5.2.1',
    title: 'Ensure that the cluster has at least one active policy control mechanism in place',
  },
  'KA-C002': {
    section: '5.2.5',
    title: 'Minimize the admission of containers with allowPrivilegeEscalation',
  },
  'KA-C003': {
    section: '5.2.6',
    title: 'Minimize the admission of root containers',
  },
  'KA-C004': {
    section: '5.2.6',
    title: 'Minimize the admission of root containers',
  },
  'KA-C005': {
    section: '5.2.6',
    title: 'Minimize the admission of root containers',
  },
  'KA-C006': {
    section: '5.2.4',
    title: 'Minimize the admission of containers sharing host PID namespace',
  },
  'KA-C007': {
    section: '5.2.3',
    title: 'Minimize the admission of containers sharing host IPC namespace',
  },
  'KA-C008': {
    section: '5.2.4',
    title: 'Minimize the admission of containers wishing to share the host network namespace',
  },
  'KA-C010': {
    section: '5.2.7',
    title: 'Minimize the admission of containers with added capabilities',
  },
  'KA-C011': {
    section: '5.2.7',
    title: 'Minimize the admission of containers with added capabilities',
  },
  'KA-C013': {
    section: '5.7.2',
    title: 'Ensure that the seccomp profile is set to docker/default in your Pod definitions',
  },
  'KA-C014': {
    section: '5.2.12',
    title: 'Minimize the admission of HostPath volumes',
  },
  'KA-C015': {
    section: '5.2.12',
    title: 'Minimize the admission of HostPath volumes',
  },
  'KA-C016': {
    section: '5.1.6',
    title: 'Ensure that Service Account Tokens are only mounted where necessary',
  },
  'KA-C017': {
    section: '5.1.5',
    title: 'Ensure that default service accounts are not actively used',
  },
  'KA-C019': {
    section: '5.7.1',
    title: 'Create administrative boundaries between resources using namespaces',
  },
  'KA-C020': {
    section: '5.7.3',
    title: 'Apply Security Context to Your Pods and Containers',
  },

  // ── RBAC Rules (KA-A series) ──────────────────────────────────────
  'KA-A001': {
    section: '5.1.3',
    title: 'Minimize wildcard use in Roles and ClusterRoles',
  },
  'KA-A002': {
    section: '5.1.1',
    title: 'Ensure that the cluster-admin role is only used where required',
  },
  'KA-A003': {
    section: '5.1.4',
    title: 'Minimize access to create pods',
  },
  'KA-A004': {
    section: '5.1.2',
    title: 'Minimize access to secrets',
  },
};
