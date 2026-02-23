import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getContainerSpecs } from '../../container-helpers';

/**
 * KA-B007: SSH port exposed.
 *
 * Exposing port 22 (SSH) on a container is a security smell. Kubernetes
 * provides exec and port-forward for debugging; SSH introduces an attack
 * surface that bypasses cluster RBAC and audit logging.
 */
export const KAB007: K8sLintRule = {
  id: 'KA-B007',
  title: 'SSH port exposed',
  severity: 'info',
  category: 'best-practice',
  explanation:
    'The container exposes port 22 (SSH). Running SSH inside containers is an anti-pattern ' +
    'in Kubernetes. Use kubectl exec or kubectl port-forward for debugging instead. SSH adds ' +
    'an unnecessary attack surface and bypasses cluster RBAC and audit logging.',
  fix: {
    description: 'Remove port 22 from the container ports and use kubectl exec instead',
    beforeCode:
      'containers:\n  - name: app\n    ports:\n      - containerPort: 22\n      - containerPort: 8080',
    afterCode:
      'containers:\n  - name: app\n    ports:\n      - containerPort: 8080',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const containerSpecs = getContainerSpecs(resource);
      for (const { container, jsonPath } of containerSpecs) {
        const ports = container.ports as Record<string, unknown>[] | undefined;
        if (!Array.isArray(ports)) continue;

        for (let i = 0; i < ports.length; i++) {
          if (ports[i].containerPort === 22) {
            const node = resolveInstancePath(
              resource.doc,
              `${jsonPath}/ports/${i}`,
            );
            const { line, col } = getNodeLine(node, ctx.lineCounter);
            violations.push({
              ruleId: 'KA-B007',
              line,
              column: col,
              message: `Container '${container.name}' in ${resource.kind} '${resource.name}' exposes SSH port 22.`,
            });
          }
        }
      }
    }

    return violations;
  },
};
