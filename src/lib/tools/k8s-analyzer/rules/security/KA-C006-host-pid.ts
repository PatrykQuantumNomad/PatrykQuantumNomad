import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getPodSpec } from '../../container-helpers';

/**
 * KA-C006: Host PID namespace shared.
 *
 * PSS Baseline profile prohibits sharing the host PID namespace. When hostPID
 * is true, the container can see all processes on the host and potentially
 * interact with them, enabling process injection and information disclosure.
 */
export const KAC006: K8sLintRule = {
  id: 'KA-C006',
  title: 'Host PID namespace shared',
  severity: 'error',
  category: 'security',
  explanation:
    'The pod shares the host PID namespace. Containers can see and signal all processes ' +
    'on the host, enabling process injection and information disclosure. ' +
    'PSS Baseline profile prohibits spec.hostPID=true.',
  fix: {
    description: 'Remove hostPID: true or set it to false',
    beforeCode:
      'spec:\n  hostPID: true\n  containers:\n    - name: app',
    afterCode:
      'spec:\n  hostPID: false\n  containers:\n    - name: app',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const pod = getPodSpec(resource);
      if (!pod) continue;

      if (pod.podSpec.hostPID === true) {
        const node = resolveInstancePath(
          resource.doc,
          `${pod.podSpecPath}/hostPID`,
        );
        const { line, col } = getNodeLine(node, ctx.lineCounter);
        violations.push({
          ruleId: 'KA-C006',
          line,
          column: col,
          message: `${resource.kind} '${resource.name}' shares the host PID namespace (PSS Baseline violation).`,
        });
      }
    }

    return violations;
  },
};
