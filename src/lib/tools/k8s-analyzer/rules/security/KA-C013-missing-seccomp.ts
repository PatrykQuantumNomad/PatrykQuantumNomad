import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getContainerSpecs, getPodSpec } from '../../container-helpers';

/**
 * KA-C013: Missing seccomp profile.
 *
 * PSS Baseline profile requires a seccomp profile to be set. Seccomp restricts
 * the system calls a container can make, reducing the kernel attack surface.
 * The profile can be set at pod level (applies to all containers) or per container.
 */
export const KAC013: K8sLintRule = {
  id: 'KA-C013',
  title: 'Missing seccomp profile',
  severity: 'warning',
  category: 'security',
  explanation:
    'No seccomp profile is configured at either the pod or container level. ' +
    'Seccomp (secure computing mode) restricts the system calls a container can make, ' +
    'reducing the kernel attack surface. PSS Baseline profile requires a seccomp profile.',
  fix: {
    description: 'Add a seccomp profile to the pod or container securityContext',
    beforeCode:
      'spec:\n  containers:\n    - name: app\n      securityContext: {}',
    afterCode:
      'spec:\n  securityContext:\n    seccompProfile:\n      type: RuntimeDefault\n  containers:\n    - name: app\n      securityContext: {}',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const pod = getPodSpec(resource);
      if (!pod) continue;

      const podSc = pod.podSpec.securityContext as Record<string, unknown> | undefined;
      const podSeccomp = podSc?.seccompProfile as Record<string, unknown> | undefined;
      const hasPodSeccomp = podSeccomp !== undefined && podSeccomp !== null;

      const containerSpecs = getContainerSpecs(resource);
      for (const { container, jsonPath } of containerSpecs) {
        const sc = container.securityContext as Record<string, unknown> | undefined;
        const containerSeccomp = sc?.seccompProfile as Record<string, unknown> | undefined;
        const hasContainerSeccomp = containerSeccomp !== undefined && containerSeccomp !== null;

        // Satisfied if either pod-level or container-level has a seccomp profile
        if (hasPodSeccomp || hasContainerSeccomp) continue;

        const nodePath = sc
          ? `${jsonPath}/securityContext`
          : jsonPath;
        const node = resolveInstancePath(resource.doc, nodePath);
        const { line, col } = getNodeLine(node, ctx.lineCounter);
        violations.push({
          ruleId: 'KA-C013',
          line,
          column: col,
          message: `Container '${container.name}' in ${resource.kind} '${resource.name}' has no seccomp profile configured (PSS Baseline violation).`,
        });
      }
    }

    return violations;
  },
};
