import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getContainerSpecs } from '../../container-helpers';

/**
 * KA-R010: Image pull policy not Always.
 *
 * When imagePullPolicy is explicitly set to something other than 'Always',
 * the node may use a cached (stale) image instead of pulling the latest
 * version from the registry.
 *
 * Note: Only flags when imagePullPolicy is explicitly set to a non-Always
 * value. If imagePullPolicy is omitted, Kubernetes determines the policy
 * from the image tag (latest -> Always, specific tag -> IfNotPresent),
 * which is acceptable default behavior.
 */
export const KAR010: K8sLintRule = {
  id: 'KA-R010',
  title: 'Image pull policy not Always',
  severity: 'info',
  category: 'reliability',
  explanation:
    'The container sets imagePullPolicy to a value other than "Always". This ' +
    'means the node may use a cached image instead of pulling the latest version ' +
    'from the registry. For production workloads, "Always" ensures you always ' +
    'run the intended image version.',
  fix: {
    description: 'Set imagePullPolicy to Always',
    beforeCode:
      'containers:\n  - name: app\n    image: myapp:1.0\n    imagePullPolicy: IfNotPresent',
    afterCode:
      'containers:\n  - name: app\n    image: myapp:1.0\n    imagePullPolicy: Always',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const containerSpecs = getContainerSpecs(resource);
      for (const { container, jsonPath } of containerSpecs) {
        const pullPolicy = container.imagePullPolicy as string | undefined;

        // Only flag when explicitly set to non-Always
        if (pullPolicy !== undefined && pullPolicy !== 'Always') {
          const node = resolveInstancePath(
            resource.doc,
            `${jsonPath}/imagePullPolicy`,
          );
          const { line, col } = getNodeLine(node, ctx.lineCounter);
          violations.push({
            ruleId: 'KA-R010',
            line,
            column: col,
            message: `Container '${container.name}' in ${resource.kind} '${resource.name}' has imagePullPolicy '${pullPolicy}' instead of 'Always'.`,
          });
        }
      }
    }

    return violations;
  },
};
