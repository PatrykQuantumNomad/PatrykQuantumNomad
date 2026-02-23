import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getContainerSpecs } from '../../container-helpers';

/**
 * KA-C001: Container runs as privileged.
 *
 * PSS Baseline profile prohibits spec.containers[*].securityContext.privileged=true.
 * A privileged container has full access to the host kernel and devices,
 * effectively disabling all container isolation mechanisms.
 */
export const KAC001: K8sLintRule = {
  id: 'KA-C001',
  title: 'Container runs as privileged',
  severity: 'error',
  category: 'security',
  explanation:
    'Running a container in privileged mode disables most container isolation mechanisms. ' +
    'The container gains full access to the host kernel and devices. ' +
    'PSS Baseline profile prohibits spec.containers[*].securityContext.privileged=true.',
  fix: {
    description: 'Remove privileged: true or set it to false',
    beforeCode:
      'containers:\n  - name: app\n    securityContext:\n      privileged: true',
    afterCode:
      'containers:\n  - name: app\n    securityContext:\n      privileged: false',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const containerSpecs = getContainerSpecs(resource);
      for (const { container, jsonPath } of containerSpecs) {
        const sc = container.securityContext as Record<string, unknown> | undefined;
        if (sc?.privileged === true) {
          const node = resolveInstancePath(
            resource.doc,
            `${jsonPath}/securityContext/privileged`,
          );
          const { line, col } = getNodeLine(node, ctx.lineCounter);
          violations.push({
            ruleId: 'KA-C001',
            line,
            column: col,
            message: `Container '${container.name}' in ${resource.kind} '${resource.name}' runs in privileged mode (PSS Baseline violation).`,
          });
        }
      }
    }

    return violations;
  },
};
