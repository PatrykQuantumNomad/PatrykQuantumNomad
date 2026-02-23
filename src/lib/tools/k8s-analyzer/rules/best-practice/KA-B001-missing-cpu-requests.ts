import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getContainerSpecs } from '../../container-helpers';

/**
 * KA-B001: Missing CPU requests.
 *
 * Containers without CPU requests cannot be properly scheduled by the Kubernetes
 * scheduler and may starve other workloads of CPU resources. Without requests,
 * the container runs in the BestEffort QoS class and is first to be evicted
 * under node pressure.
 */
export const KAB001: K8sLintRule = {
  id: 'KA-B001',
  title: 'Missing CPU requests',
  severity: 'warning',
  category: 'best-practice',
  explanation:
    'The container does not define a CPU request. Without CPU requests, the Kubernetes ' +
    'scheduler cannot make informed placement decisions. The container falls into the ' +
    'BestEffort QoS class and will be the first to be evicted under node memory pressure.',
  fix: {
    description: 'Add a CPU request to the container resources',
    beforeCode:
      'containers:\n  - name: app\n    image: myapp:1.0',
    afterCode:
      'containers:\n  - name: app\n    image: myapp:1.0\n    resources:\n      requests:\n        cpu: 100m',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const containerSpecs = getContainerSpecs(resource);
      for (const { container, jsonPath } of containerSpecs) {
        const resources = container.resources as Record<string, unknown> | undefined;
        const requests = resources?.requests as Record<string, unknown> | undefined;

        if (!requests?.cpu) {
          const nodePath = resources ? `${jsonPath}/resources` : jsonPath;
          const node = resolveInstancePath(resource.doc, nodePath);
          const { line, col } = getNodeLine(node, ctx.lineCounter);
          violations.push({
            ruleId: 'KA-B001',
            line,
            column: col,
            message: `Container '${container.name}' in ${resource.kind} '${resource.name}' has no CPU request defined.`,
          });
        }
      }
    }

    return violations;
  },
};
