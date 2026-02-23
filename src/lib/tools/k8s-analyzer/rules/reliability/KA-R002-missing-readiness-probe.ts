import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getContainerSpecs } from '../../container-helpers';

/**
 * KA-R002: Missing readiness probe.
 *
 * A container without a readinessProbe may receive traffic before it is
 * ready to handle requests, causing errors for downstream clients.
 */
export const KAR002: K8sLintRule = {
  id: 'KA-R002',
  title: 'Missing readiness probe',
  severity: 'warning',
  category: 'reliability',
  explanation:
    'The container does not define a readinessProbe. Without a readiness probe, ' +
    'Kubernetes may route traffic to the container before it is ready to ' +
    'handle requests, causing client-facing errors during startup and rollouts.',
  fix: {
    description: 'Add a readinessProbe to the container spec',
    beforeCode:
      'containers:\n  - name: app\n    image: myapp:1.0',
    afterCode:
      'containers:\n  - name: app\n    image: myapp:1.0\n    readinessProbe:\n      httpGet:\n        path: /ready\n        port: 8080\n      initialDelaySeconds: 5\n      periodSeconds: 10',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const containerSpecs = getContainerSpecs(resource);
      for (const { container, jsonPath, containerType } of containerSpecs) {
        if (containerType !== 'container') continue;

        if (!container.readinessProbe) {
          const node = resolveInstancePath(resource.doc, jsonPath);
          const { line, col } = getNodeLine(node, ctx.lineCounter);
          violations.push({
            ruleId: 'KA-R002',
            line,
            column: col,
            message: `Container '${container.name}' in ${resource.kind} '${resource.name}' has no readiness probe.`,
          });
        }
      }
    }

    return violations;
  },
};
