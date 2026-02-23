import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getContainerSpecs } from '../../container-helpers';

/**
 * KA-C009: Host port specified.
 *
 * PSS Baseline profile restricts the use of host ports. Using hostPort binds
 * the container to a specific port on the host node, limiting scheduling
 * flexibility and potentially creating port conflicts.
 */
export const KAC009: K8sLintRule = {
  id: 'KA-C009',
  title: 'Host port specified',
  severity: 'info',
  category: 'security',
  explanation:
    'A container specifies a hostPort, which binds it to a specific port on the host node. ' +
    'This limits pod scheduling (only one pod per node for that port) and can create ' +
    'port conflicts. PSS Baseline profile restricts host port usage.',
  fix: {
    description: 'Remove hostPort and use a Service to expose the container port',
    beforeCode:
      'containers:\n  - name: app\n    ports:\n      - containerPort: 8080\n        hostPort: 8080',
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
          const port = ports[i];
          const hostPort = port.hostPort as number | undefined;
          if (hostPort !== undefined && hostPort !== null && hostPort !== 0) {
            const node = resolveInstancePath(
              resource.doc,
              `${jsonPath}/ports/${i}/hostPort`,
            );
            const { line, col } = getNodeLine(node, ctx.lineCounter);
            violations.push({
              ruleId: 'KA-C009',
              line,
              column: col,
              message: `Container '${container.name}' in ${resource.kind} '${resource.name}' specifies hostPort ${hostPort} (PSS Baseline restriction).`,
            });
          }
        }
      }
    }

    return violations;
  },
};
