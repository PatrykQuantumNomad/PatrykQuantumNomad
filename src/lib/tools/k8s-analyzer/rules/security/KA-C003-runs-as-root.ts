import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getContainerSpecs, getPodSpec } from '../../container-helpers';

/**
 * KA-C003: Container could run as root.
 *
 * PSS Restricted profile recommends ensuring containers cannot run as root.
 * This rule fires when neither runAsNonRoot:true nor a non-zero runAsUser is set
 * at either the container or pod level. It does NOT fire when runAsUser:0 is
 * explicitly set (KA-C005 handles that case).
 */
export const KAC003: K8sLintRule = {
  id: 'KA-C003',
  title: 'Container could run as root',
  severity: 'warning',
  category: 'security',
  explanation:
    'Without runAsNonRoot: true or a non-zero runAsUser, this container could run as root ' +
    'depending on the container image USER directive. The actual runtime user depends on the ' +
    'image and container runtime defaults. PSS Restricted profile recommends explicit non-root enforcement.',
  fix: {
    description: 'Set runAsNonRoot: true or specify a non-zero runAsUser',
    beforeCode:
      'containers:\n  - name: app\n    securityContext: {}',
    afterCode:
      'containers:\n  - name: app\n    securityContext:\n      runAsNonRoot: true\n      runAsUser: 1000',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const pod = getPodSpec(resource);
      if (!pod) continue;

      const podSc = pod.podSpec.securityContext as Record<string, unknown> | undefined;
      const podRunAsNonRoot = podSc?.runAsNonRoot === true;
      const podRunAsUser = podSc?.runAsUser as number | undefined;
      const podHasNonZeroUser =
        podRunAsUser !== undefined && podRunAsUser !== null && podRunAsUser !== 0;

      const containerSpecs = getContainerSpecs(resource);
      for (const { container, jsonPath } of containerSpecs) {
        const sc = container.securityContext as Record<string, unknown> | undefined;
        const containerRunAsNonRoot = sc?.runAsNonRoot === true;
        const containerRunAsUser = sc?.runAsUser as number | undefined;

        // If container explicitly sets runAsUser: 0, skip -- KA-C005 handles that
        if (containerRunAsUser === 0) continue;

        // If pod explicitly sets runAsUser: 0 and container does not override with non-zero, skip
        if (podRunAsUser === 0 && containerRunAsUser === undefined) continue;

        const containerHasNonZeroUser =
          containerRunAsUser !== undefined && containerRunAsUser !== null && containerRunAsUser !== 0;

        // Check if protected at container level
        if (containerRunAsNonRoot || containerHasNonZeroUser) continue;

        // Check if protected at pod level (and container doesn't override)
        if (podRunAsNonRoot || podHasNonZeroUser) continue;

        // Not protected -- could run as root
        const nodePath = sc ? `${jsonPath}/securityContext` : jsonPath;
        const node = resolveInstancePath(resource.doc, nodePath);
        const { line, col } = getNodeLine(node, ctx.lineCounter);
        violations.push({
          ruleId: 'KA-C003',
          line,
          column: col,
          message: `Container '${container.name}' in ${resource.kind} '${resource.name}' could run as root. Set runAsNonRoot: true or specify a non-zero runAsUser.`,
        });
      }
    }

    return violations;
  },
};
