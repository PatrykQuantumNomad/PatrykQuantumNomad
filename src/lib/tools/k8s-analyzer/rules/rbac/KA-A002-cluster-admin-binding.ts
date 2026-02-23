import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';

/**
 * KA-A002: RoleBinding or ClusterRoleBinding grants cluster-admin.
 *
 * CIS Kubernetes Benchmark 5.1.1 recommends ensuring that the cluster-admin
 * role is only used where required. Binding cluster-admin grants unrestricted
 * access to all resources in all namespaces.
 */
export const KAA002: K8sLintRule = {
  id: 'KA-A002',
  title: 'RoleBinding grants cluster-admin role',
  severity: 'error',
  category: 'security',
  explanation:
    'Binding the cluster-admin ClusterRole grants unrestricted access to all resources ' +
    'in all namespaces. CIS Kubernetes Benchmark 5.1.1 recommends ensuring that the ' +
    'cluster-admin role is only used where required. Use more restrictive roles instead.',
  fix: {
    description: 'Bind a more restrictive role instead of cluster-admin',
    beforeCode:
      'roleRef:\n  apiGroup: rbac.authorization.k8s.io\n  kind: ClusterRole\n  name: cluster-admin',
    afterCode:
      'roleRef:\n  apiGroup: rbac.authorization.k8s.io\n  kind: ClusterRole\n  name: view',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      if (resource.kind !== 'RoleBinding' && resource.kind !== 'ClusterRoleBinding') continue;

      const roleRef = resource.json.roleRef as Record<string, unknown> | undefined;
      if (roleRef?.name === 'cluster-admin') {
        const node = resolveInstancePath(resource.doc, '/roleRef/name');
        const { line, col } = getNodeLine(node, ctx.lineCounter);
        violations.push({
          ruleId: 'KA-A002',
          line,
          column: col,
          message: `${resource.kind} '${resource.name}' grants cluster-admin role (CIS 5.1.1 violation).`,
        });
      }
    }

    return violations;
  },
};
