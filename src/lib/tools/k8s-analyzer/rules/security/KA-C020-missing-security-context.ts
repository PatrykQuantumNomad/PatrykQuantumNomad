import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getContainerSpecs } from '../../container-helpers';

/**
 * KA-C020: Missing security context entirely.
 *
 * Best practice: every container should have a securityContext defined. When
 * securityContext is completely absent (undefined), the container uses all
 * defaults which are typically permissive.
 *
 * NOTE: This rule fires only for undefined securityContext, NOT for empty
 * object (securityContext: {}). An empty object is explicitly set.
 */
export const KAC020: K8sLintRule = {
  id: 'KA-C020',
  title: 'Missing security context',
  severity: 'warning',
  category: 'security',
  explanation:
    'The container has no securityContext defined at all. Without a security context, ' +
    'the container uses all default settings which are typically permissive (writable ' +
    'filesystem, default capabilities, no user restrictions). Define a securityContext ' +
    'with appropriate security settings.',
  fix: {
    description: 'Add a securityContext with security settings',
    beforeCode:
      'containers:\n  - name: app\n    image: nginx',
    afterCode:
      'containers:\n  - name: app\n    image: nginx\n    securityContext:\n      runAsNonRoot: true\n      allowPrivilegeEscalation: false\n      readOnlyRootFilesystem: true\n      capabilities:\n        drop:\n          - ALL',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const containerSpecs = getContainerSpecs(resource);
      for (const { container, jsonPath } of containerSpecs) {
        // Fire ONLY when securityContext is undefined, NOT when it is {}
        if (!('securityContext' in container)) {
          const node = resolveInstancePath(resource.doc, jsonPath);
          const { line, col } = getNodeLine(node, ctx.lineCounter);
          violations.push({
            ruleId: 'KA-C020',
            line,
            column: col,
            message: `Container '${container.name}' in ${resource.kind} '${resource.name}' has no securityContext defined. Add security settings.`,
          });
        }
      }
    }

    return violations;
  },
};
