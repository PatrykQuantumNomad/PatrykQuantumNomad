import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';

/**
 * KA-A001: Wildcard permissions in Role/ClusterRole.
 *
 * CIS Kubernetes Benchmark 5.1.3 recommends minimizing wildcard use in Roles
 * and ClusterRoles. Wildcard (*) in apiGroups, resources, or verbs grants
 * overly broad access that violates the principle of least privilege.
 */
export const KAA001: K8sLintRule = {
  id: 'KA-A001',
  title: 'Wildcard permissions in Role/ClusterRole',
  severity: 'error',
  category: 'security',
  explanation:
    'Using wildcard (*) in apiGroups, resources, or verbs grants overly broad access. ' +
    'CIS Kubernetes Benchmark 5.1.3 recommends minimizing wildcard use in Roles and ClusterRoles. ' +
    'Wildcards bypass the principle of least privilege and can expose the cluster to privilege escalation.',
  fix: {
    description: 'Replace wildcards with specific API groups, resources, and verbs',
    beforeCode:
      'rules:\n  - apiGroups: ["*"]\n    resources: ["*"]\n    verbs: ["*"]',
    afterCode:
      'rules:\n  - apiGroups: [""]\n    resources: ["pods"]\n    verbs: ["get", "list", "watch"]',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      if (resource.kind !== 'Role' && resource.kind !== 'ClusterRole') continue;

      const rules = (resource.json.rules as unknown[] | undefined);
      if (!Array.isArray(rules)) continue; // Gracefully skip aggregated ClusterRoles

      for (let i = 0; i < rules.length; i++) {
        const rule = rules[i] as Record<string, unknown>;
        const wildcardFields: string[] = [];

        const apiGroups = rule.apiGroups as string[] | undefined;
        if (Array.isArray(apiGroups) && apiGroups.includes('*')) {
          wildcardFields.push('apiGroups');
        }

        const resources = rule.resources as string[] | undefined;
        if (Array.isArray(resources) && resources.includes('*')) {
          wildcardFields.push('resources');
        }

        const verbs = rule.verbs as string[] | undefined;
        if (Array.isArray(verbs) && verbs.includes('*')) {
          wildcardFields.push('verbs');
        }

        if (wildcardFields.length > 0) {
          const node = resolveInstancePath(resource.doc, `/rules/${i}`);
          const { line, col } = getNodeLine(node, ctx.lineCounter);
          violations.push({
            ruleId: 'KA-A001',
            line,
            column: col,
            message: `${resource.kind} '${resource.name}' has wildcard (*) in ${wildcardFields.join(', ')} (CIS 5.1.3 violation).`,
          });
        }
      }
    }

    return violations;
  },
};
