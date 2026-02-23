import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getContainerSpecs, getPodSpec } from '../../container-helpers';

/**
 * KA-C004: Missing runAsNonRoot.
 *
 * PSS Restricted profile requires runAsNonRoot: true to be set. This rule checks
 * specifically for the runAsNonRoot field at both container and pod level.
 * Complementary to KA-C003: C003 checks the broader "could run as root" condition,
 * C004 specifically requires the runAsNonRoot field. Both can fire for the same container.
 */
export const KAC004: K8sLintRule = {
  id: 'KA-C004',
  title: 'Missing runAsNonRoot',
  severity: 'warning',
  category: 'security',
  explanation:
    'The runAsNonRoot field is not set to true at either the container or pod level. ' +
    'Without runAsNonRoot: true, Kubernetes will not prevent the container from running ' +
    'as root, even if the image specifies a non-root USER. ' +
    'PSS Restricted profile requires spec.securityContext.runAsNonRoot=true.',
  fix: {
    description: 'Set runAsNonRoot: true in the container or pod securityContext',
    beforeCode:
      'containers:\n  - name: app\n    securityContext:\n      readOnlyRootFilesystem: true',
    afterCode:
      'containers:\n  - name: app\n    securityContext:\n      readOnlyRootFilesystem: true\n      runAsNonRoot: true',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const pod = getPodSpec(resource);
      if (!pod) continue;

      const podSc = pod.podSpec.securityContext as Record<string, unknown> | undefined;
      const podRunAsNonRoot = podSc?.runAsNonRoot === true;

      const containerSpecs = getContainerSpecs(resource);
      for (const { container, jsonPath } of containerSpecs) {
        const sc = container.securityContext as Record<string, unknown> | undefined;
        const containerRunAsNonRoot = sc?.runAsNonRoot === true;

        // Satisfied if either container-level or pod-level has runAsNonRoot: true
        if (containerRunAsNonRoot || podRunAsNonRoot) continue;

        const nodePath = sc ? `${jsonPath}/securityContext` : jsonPath;
        const node = resolveInstancePath(resource.doc, nodePath);
        const { line, col } = getNodeLine(node, ctx.lineCounter);
        violations.push({
          ruleId: 'KA-C004',
          line,
          column: col,
          message: `Container '${container.name}' in ${resource.kind} '${resource.name}' does not set runAsNonRoot: true (PSS Restricted violation).`,
        });
      }
    }

    return violations;
  },
};
