import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';

/** Cluster-scoped resources that don't have a namespace. */
const CLUSTER_SCOPED_KINDS = new Set([
  'Namespace',
  'ClusterRole',
  'ClusterRoleBinding',
]);

/**
 * KA-C019: Default namespace used.
 *
 * CIS Benchmark control. The default namespace lacks isolation and RBAC boundaries.
 * Using dedicated namespaces provides better security isolation, resource quotas,
 * and network policy segmentation.
 */
export const KAC019: K8sLintRule = {
  id: 'KA-C019',
  title: 'Default namespace used',
  severity: 'info',
  category: 'security',
  explanation:
    'The resource is deployed in the default namespace. The default namespace lacks ' +
    'isolation and RBAC boundaries. Use dedicated namespaces for better security isolation, ' +
    'resource quotas, and network policy segmentation. CIS Benchmark recommends not using ' +
    'the default namespace for workloads.',
  fix: {
    description: 'Specify a dedicated namespace in the resource metadata',
    beforeCode:
      'metadata:\n  name: my-app',
    afterCode:
      'metadata:\n  name: my-app\n  namespace: production',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      // Skip cluster-scoped resources (they don't have namespaces)
      if (CLUSTER_SCOPED_KINDS.has(resource.kind)) continue;

      if (resource.namespace === 'default') {
        const node = resolveInstancePath(resource.doc, '/metadata');
        const { line, col } = getNodeLine(node, ctx.lineCounter);
        violations.push({
          ruleId: 'KA-C019',
          line,
          column: col,
          message: `${resource.kind} '${resource.name}' uses the default namespace. Use a dedicated namespace for isolation.`,
        });
      }
    }

    return violations;
  },
};
