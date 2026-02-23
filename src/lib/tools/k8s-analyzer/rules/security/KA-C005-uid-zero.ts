import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getContainerSpecs, getPodSpec } from '../../container-helpers';

/**
 * KA-C005: Running with UID 0.
 *
 * PSS Restricted profile prohibits explicit runAsUser: 0. Unlike KA-C003 which
 * warns about the *possibility* of running as root, this rule catches the
 * definitive case where root UID is explicitly configured.
 */
export const KAC005: K8sLintRule = {
  id: 'KA-C005',
  title: 'Running with UID 0 (root)',
  severity: 'error',
  category: 'security',
  explanation:
    'The container is explicitly configured to run as UID 0 (root). ' +
    'Running as root gives the process full filesystem access and may allow container breakout. ' +
    'PSS Restricted profile prohibits spec.containers[*].securityContext.runAsUser=0.',
  fix: {
    description: 'Set runAsUser to a non-zero UID (e.g., 1000)',
    beforeCode:
      'containers:\n  - name: app\n    securityContext:\n      runAsUser: 0',
    afterCode:
      'containers:\n  - name: app\n    securityContext:\n      runAsUser: 1000\n      runAsNonRoot: true',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const pod = getPodSpec(resource);
      if (!pod) continue;

      const podSc = pod.podSpec.securityContext as Record<string, unknown> | undefined;
      const podRunAsUser = podSc?.runAsUser as number | undefined;

      const containerSpecs = getContainerSpecs(resource);
      for (const { container, jsonPath } of containerSpecs) {
        const sc = container.securityContext as Record<string, unknown> | undefined;
        const containerRunAsUser = sc?.runAsUser as number | undefined;

        // Case 1: Container explicitly sets runAsUser: 0
        if (containerRunAsUser === 0) {
          const node = resolveInstancePath(
            resource.doc,
            `${jsonPath}/securityContext/runAsUser`,
          );
          const { line, col } = getNodeLine(node, ctx.lineCounter);
          violations.push({
            ruleId: 'KA-C005',
            line,
            column: col,
            message: `Container '${container.name}' in ${resource.kind} '${resource.name}' is explicitly configured to run as UID 0 (root) (PSS Restricted violation).`,
          });
          continue;
        }

        // Case 2: Pod sets runAsUser: 0 and container does not override with non-zero
        if (
          podRunAsUser === 0 &&
          containerRunAsUser === undefined
        ) {
          const node = resolveInstancePath(
            resource.doc,
            `${pod.podSpecPath}/securityContext/runAsUser`,
          );
          const { line, col } = getNodeLine(node, ctx.lineCounter);
          violations.push({
            ruleId: 'KA-C005',
            line,
            column: col,
            message: `Container '${container.name}' in ${resource.kind} '${resource.name}' inherits pod-level runAsUser: 0 (root) (PSS Restricted violation).`,
          });
        }
      }
    }

    return violations;
  },
};
