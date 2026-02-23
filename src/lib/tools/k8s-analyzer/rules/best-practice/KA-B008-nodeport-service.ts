import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';

/**
 * KA-B008: NodePort service type used.
 *
 * NodePort services expose ports directly on cluster nodes, bypassing
 * load balancers and making services harder to secure. Prefer ClusterIP
 * with an Ingress controller or LoadBalancer type for production.
 */
export const KAB008: K8sLintRule = {
  id: 'KA-B008',
  title: 'NodePort service type used',
  severity: 'info',
  category: 'best-practice',
  explanation:
    'The Service uses type NodePort, which exposes ports directly on cluster nodes. ' +
    'NodePort services bypass load balancers and are harder to secure in production. ' +
    'Prefer ClusterIP with an Ingress controller or LoadBalancer type.',
  fix: {
    description: 'Use ClusterIP type with an Ingress, or LoadBalancer type',
    beforeCode: 'spec:\n  type: NodePort',
    afterCode: 'spec:\n  type: ClusterIP',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      if (resource.kind !== 'Service') continue;

      const spec = resource.json.spec as Record<string, unknown> | undefined;
      if (spec?.type === 'NodePort') {
        const node = resolveInstancePath(resource.doc, '/spec/type');
        const { line, col } = getNodeLine(node, ctx.lineCounter);
        violations.push({
          ruleId: 'KA-B008',
          line,
          column: col,
          message: `Service '${resource.name}' uses NodePort type. Prefer ClusterIP with Ingress or LoadBalancer.`,
        });
      }
    }

    return violations;
  },
};
