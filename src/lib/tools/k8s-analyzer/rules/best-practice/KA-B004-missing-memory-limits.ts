import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getContainerSpecs } from '../../container-helpers';

/**
 * KA-B004: Missing memory limits.
 *
 * Containers without memory limits can consume unlimited memory on the node,
 * potentially causing OOM kills of other pods. Setting memory limits protects
 * co-located workloads and enables the Guaranteed QoS class when set equal
 * to requests.
 */
export const KAB004: K8sLintRule = {
  id: 'KA-B004',
  title: 'Missing memory limits',
  severity: 'warning',
  category: 'best-practice',
  explanation:
    'The container does not define a memory limit. Without memory limits, the container can ' +
    'consume unlimited memory on the node, potentially causing OOM kills of other pods. ' +
    'Setting memory limits equal to requests enables the Guaranteed QoS class for predictable scheduling.',
  fix: {
    description: 'Add a memory limit to the container resources',
    beforeCode:
      'containers:\n  - name: app\n    image: myapp:1.0\n    resources:\n      requests:\n        memory: 128Mi',
    afterCode:
      'containers:\n  - name: app\n    image: myapp:1.0\n    resources:\n      requests:\n        memory: 128Mi\n      limits:\n        memory: 256Mi',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const containerSpecs = getContainerSpecs(resource);
      for (const { container, jsonPath } of containerSpecs) {
        const resources = container.resources as Record<string, unknown> | undefined;
        const limits = resources?.limits as Record<string, unknown> | undefined;

        if (!limits?.memory) {
          const nodePath = resources ? `${jsonPath}/resources` : jsonPath;
          const node = resolveInstancePath(resource.doc, nodePath);
          const { line, col } = getNodeLine(node, ctx.lineCounter);
          violations.push({
            ruleId: 'KA-B004',
            line,
            column: col,
            message: `Container '${container.name}' in ${resource.kind} '${resource.name}' has no memory limit defined.`,
          });
        }
      }
    }

    return violations;
  },
};
