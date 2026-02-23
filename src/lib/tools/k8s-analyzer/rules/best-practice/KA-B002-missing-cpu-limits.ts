import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getContainerSpecs } from '../../container-helpers';

/**
 * KA-B002: Missing CPU limits.
 *
 * Containers without CPU limits can consume unlimited CPU on the node,
 * potentially starving other workloads. Setting CPU limits ensures fair
 * resource sharing and prevents runaway processes from impacting neighbors.
 */
export const KAB002: K8sLintRule = {
  id: 'KA-B002',
  title: 'Missing CPU limits',
  severity: 'warning',
  category: 'best-practice',
  explanation:
    'The container does not define a CPU limit. Without CPU limits, the container can ' +
    'consume unlimited CPU on the node, potentially starving other workloads. CPU limits ' +
    'ensure fair resource sharing and prevent runaway processes from impacting co-located pods.',
  fix: {
    description: 'Add a CPU limit to the container resources',
    beforeCode:
      'containers:\n  - name: app\n    image: myapp:1.0\n    resources:\n      requests:\n        cpu: 100m',
    afterCode:
      'containers:\n  - name: app\n    image: myapp:1.0\n    resources:\n      requests:\n        cpu: 100m\n      limits:\n        cpu: 500m',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const containerSpecs = getContainerSpecs(resource);
      for (const { container, jsonPath } of containerSpecs) {
        const resources = container.resources as Record<string, unknown> | undefined;
        const limits = resources?.limits as Record<string, unknown> | undefined;

        if (!limits?.cpu) {
          const nodePath = resources ? `${jsonPath}/resources` : jsonPath;
          const node = resolveInstancePath(resource.doc, nodePath);
          const { line, col } = getNodeLine(node, ctx.lineCounter);
          violations.push({
            ruleId: 'KA-B002',
            line,
            column: col,
            message: `Container '${container.name}' in ${resource.kind} '${resource.name}' has no CPU limit defined.`,
          });
        }
      }
    }

    return violations;
  },
};
