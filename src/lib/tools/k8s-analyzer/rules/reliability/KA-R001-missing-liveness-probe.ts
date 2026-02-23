import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getContainerSpecs } from '../../container-helpers';

/**
 * KA-R001: Missing liveness probe.
 *
 * A container without a livenessProbe cannot be automatically restarted
 * by Kubernetes when the application enters a broken state.
 */
export const KAR001: K8sLintRule = {
  id: 'KA-R001',
  title: 'Missing liveness probe',
  severity: 'warning',
  category: 'reliability',
  explanation:
    'The container does not define a livenessProbe. Without a liveness probe, ' +
    'Kubernetes cannot detect if the application has entered a broken state ' +
    'and will not restart it automatically.',
  fix: {
    description: 'Add a livenessProbe to the container spec',
    beforeCode:
      'containers:\n  - name: app\n    image: myapp:1.0',
    afterCode:
      'containers:\n  - name: app\n    image: myapp:1.0\n    livenessProbe:\n      httpGet:\n        path: /healthz\n        port: 8080\n      initialDelaySeconds: 10\n      periodSeconds: 15',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const containerSpecs = getContainerSpecs(resource);
      for (const { container, jsonPath, containerType } of containerSpecs) {
        if (containerType !== 'container') continue;

        if (!container.livenessProbe) {
          const node = resolveInstancePath(resource.doc, jsonPath);
          const { line, col } = getNodeLine(node, ctx.lineCounter);
          violations.push({
            ruleId: 'KA-R001',
            line,
            column: col,
            message: `Container '${container.name}' in ${resource.kind} '${resource.name}' has no liveness probe.`,
          });
        }
      }
    }

    return violations;
  },
};
