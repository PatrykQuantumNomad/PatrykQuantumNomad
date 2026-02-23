import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getContainerSpecs } from '../../container-helpers';

/**
 * KA-C011: Capabilities not dropped.
 *
 * PSS Restricted profile requires dropping ALL capabilities. Without dropping ALL,
 * the container retains the default Linux capability set which includes capabilities
 * that may not be needed.
 */
export const KAC011: K8sLintRule = {
  id: 'KA-C011',
  title: 'Capabilities not dropped',
  severity: 'warning',
  category: 'security',
  explanation:
    'The container does not drop ALL capabilities. Without capabilities.drop: ["ALL"], ' +
    'the container retains the default Linux capability set. ' +
    'PSS Restricted profile requires spec.containers[*].securityContext.capabilities.drop to include ALL.',
  fix: {
    description: 'Add capabilities.drop: ["ALL"] to the container securityContext',
    beforeCode:
      'containers:\n  - name: app\n    securityContext:\n      runAsNonRoot: true',
    afterCode:
      'containers:\n  - name: app\n    securityContext:\n      runAsNonRoot: true\n      capabilities:\n        drop:\n          - ALL',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const containerSpecs = getContainerSpecs(resource);
      for (const { container, jsonPath } of containerSpecs) {
        const sc = container.securityContext as Record<string, unknown> | undefined;
        const caps = sc?.capabilities as Record<string, unknown> | undefined;
        const dropList = caps?.drop as string[] | undefined;

        // Check if drop list includes ALL (case-insensitive)
        const dropsAll =
          Array.isArray(dropList) &&
          dropList.some((cap) => String(cap).toUpperCase() === 'ALL');

        if (!dropsAll) {
          const nodePath = caps
            ? `${jsonPath}/securityContext/capabilities`
            : sc
              ? `${jsonPath}/securityContext`
              : jsonPath;
          const node = resolveInstancePath(resource.doc, nodePath);
          const { line, col } = getNodeLine(node, ctx.lineCounter);
          violations.push({
            ruleId: 'KA-C011',
            line,
            column: col,
            message: `Container '${container.name}' in ${resource.kind} '${resource.name}' does not drop ALL capabilities (PSS Restricted violation).`,
          });
        }
      }
    }

    return violations;
  },
};
