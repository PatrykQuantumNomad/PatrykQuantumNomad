import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getPodSpec } from '../../container-helpers';

/**
 * KA-C007: Host IPC namespace shared.
 *
 * PSS Baseline profile prohibits sharing the host IPC namespace. When hostIPC
 * is true, the container can access host shared memory segments and semaphores,
 * potentially reading sensitive data from other processes.
 */
export const KAC007: K8sLintRule = {
  id: 'KA-C007',
  title: 'Host IPC namespace shared',
  severity: 'error',
  category: 'security',
  explanation:
    'The pod shares the host IPC namespace. Containers can access host shared memory ' +
    'segments and semaphores, potentially reading sensitive data from other processes. ' +
    'PSS Baseline profile prohibits spec.hostIPC=true.',
  fix: {
    description: 'Remove hostIPC: true or set it to false',
    beforeCode:
      'spec:\n  hostIPC: true\n  containers:\n    - name: app',
    afterCode:
      'spec:\n  hostIPC: false\n  containers:\n    - name: app',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const pod = getPodSpec(resource);
      if (!pod) continue;

      if (pod.podSpec.hostIPC === true) {
        const node = resolveInstancePath(
          resource.doc,
          `${pod.podSpecPath}/hostIPC`,
        );
        const { line, col } = getNodeLine(node, ctx.lineCounter);
        violations.push({
          ruleId: 'KA-C007',
          line,
          column: col,
          message: `${resource.kind} '${resource.name}' shares the host IPC namespace (PSS Baseline violation).`,
        });
      }
    }

    return violations;
  },
};
