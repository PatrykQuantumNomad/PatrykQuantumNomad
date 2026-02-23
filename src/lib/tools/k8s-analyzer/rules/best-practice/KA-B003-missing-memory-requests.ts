import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getContainerSpecs } from '../../container-helpers';

/**
 * KA-B003: Missing memory requests.
 *
 * Containers without memory requests cannot be properly scheduled and fall
 * into the BestEffort QoS class. Memory requests are critical for the
 * scheduler to bin-pack pods onto nodes and for the kubelet to make
 * eviction decisions under memory pressure.
 */
export const KAB003: K8sLintRule = {
  id: 'KA-B003',
  title: 'Missing memory requests',
  severity: 'warning',
  category: 'best-practice',
  explanation:
    'The container does not define a memory request. Without memory requests, the Kubernetes ' +
    'scheduler cannot make informed placement decisions and the container falls into the ' +
    'BestEffort QoS class. It will be the first to be OOM-killed under node memory pressure.',
  fix: {
    description: 'Add a memory request to the container resources',
    beforeCode:
      'containers:\n  - name: app\n    image: myapp:1.0',
    afterCode:
      'containers:\n  - name: app\n    image: myapp:1.0\n    resources:\n      requests:\n        memory: 128Mi',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const containerSpecs = getContainerSpecs(resource);
      for (const { container, jsonPath } of containerSpecs) {
        const resources = container.resources as Record<string, unknown> | undefined;
        const requests = resources?.requests as Record<string, unknown> | undefined;

        if (!requests?.memory) {
          const nodePath = resources ? `${jsonPath}/resources` : jsonPath;
          const node = resolveInstancePath(resource.doc, nodePath);
          const { line, col } = getNodeLine(node, ctx.lineCounter);
          violations.push({
            ruleId: 'KA-B003',
            line,
            column: col,
            message: `Container '${container.name}' in ${resource.kind} '${resource.name}' has no memory request defined.`,
          });
        }
      }
    }

    return violations;
  },
};
