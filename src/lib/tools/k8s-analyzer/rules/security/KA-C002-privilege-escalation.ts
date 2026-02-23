import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getContainerSpecs } from '../../container-helpers';

/**
 * KA-C002: Privilege escalation allowed.
 *
 * PSS Restricted profile requires allowPrivilegeEscalation to be explicitly set to false.
 * When not set, it defaults to true, allowing child processes to gain more privileges
 * than their parent via setuid binaries or other mechanisms.
 */
export const KAC002: K8sLintRule = {
  id: 'KA-C002',
  title: 'Privilege escalation allowed',
  severity: 'error',
  category: 'security',
  explanation:
    'When allowPrivilegeEscalation is not explicitly set to false, child processes can ' +
    'gain more privileges than their parent via setuid binaries or filesystem capabilities. ' +
    'PSS Restricted profile requires spec.containers[*].securityContext.allowPrivilegeEscalation=false.',
  fix: {
    description: 'Set allowPrivilegeEscalation to false in the container securityContext',
    beforeCode:
      'containers:\n  - name: app\n    securityContext:\n      runAsNonRoot: true',
    afterCode:
      'containers:\n  - name: app\n    securityContext:\n      runAsNonRoot: true\n      allowPrivilegeEscalation: false',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const containerSpecs = getContainerSpecs(resource);
      for (const { container, jsonPath } of containerSpecs) {
        const sc = container.securityContext as Record<string, unknown> | undefined;

        // Fire whenever allowPrivilegeEscalation is NOT explicitly false
        if (sc?.allowPrivilegeEscalation !== false) {
          // Point to the specific field if it exists, otherwise to securityContext or container
          let nodePath: string;
          if (sc && 'allowPrivilegeEscalation' in sc) {
            nodePath = `${jsonPath}/securityContext/allowPrivilegeEscalation`;
          } else if (sc) {
            nodePath = `${jsonPath}/securityContext`;
          } else {
            nodePath = jsonPath;
          }

          const node = resolveInstancePath(resource.doc, nodePath);
          const { line, col } = getNodeLine(node, ctx.lineCounter);
          violations.push({
            ruleId: 'KA-C002',
            line,
            column: col,
            message: `Container '${container.name}' in ${resource.kind} '${resource.name}' does not set allowPrivilegeEscalation: false (PSS Restricted violation).`,
          });
        }
      }
    }

    return violations;
  },
};
