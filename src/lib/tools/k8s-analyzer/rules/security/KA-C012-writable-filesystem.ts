import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getContainerSpecs } from '../../container-helpers';

/**
 * KA-C012: Filesystem not read-only.
 *
 * Best practice: set readOnlyRootFilesystem: true to prevent processes from
 * writing to the container filesystem. This limits the impact of a compromised
 * container and prevents attackers from installing malware or modifying binaries.
 */
export const KAC012: K8sLintRule = {
  id: 'KA-C012',
  title: 'Filesystem not read-only',
  severity: 'warning',
  category: 'security',
  explanation:
    'The container does not set readOnlyRootFilesystem: true. A writable root filesystem ' +
    'allows processes to modify binaries, install malware, or alter configuration files. ' +
    'Use readOnlyRootFilesystem: true and mount writable volumes only where needed.',
  fix: {
    description: 'Set readOnlyRootFilesystem: true in the container securityContext',
    beforeCode:
      'containers:\n  - name: app\n    securityContext:\n      runAsNonRoot: true',
    afterCode:
      'containers:\n  - name: app\n    securityContext:\n      runAsNonRoot: true\n      readOnlyRootFilesystem: true',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const containerSpecs = getContainerSpecs(resource);
      for (const { container, jsonPath } of containerSpecs) {
        const sc = container.securityContext as Record<string, unknown> | undefined;

        if (sc?.readOnlyRootFilesystem !== true) {
          const nodePath = sc
            ? `${jsonPath}/securityContext`
            : jsonPath;
          const node = resolveInstancePath(resource.doc, nodePath);
          const { line, col } = getNodeLine(node, ctx.lineCounter);
          violations.push({
            ruleId: 'KA-C012',
            line,
            column: col,
            message: `Container '${container.name}' in ${resource.kind} '${resource.name}' does not set readOnlyRootFilesystem: true.`,
          });
        }
      }
    }

    return violations;
  },
};
