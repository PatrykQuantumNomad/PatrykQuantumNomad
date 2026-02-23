import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';

/**
 * Check if an RBAC rule entry grants access to specific resources with specific verbs.
 * Both conditions must be true: resources match AND verbs match.
 * Wildcard (*) in either field counts as a match.
 */
function ruleGrantsPermission(
  rule: Record<string, unknown>,
  targetResources: string[],
  targetVerbs: string[],
): boolean {
  const resources = rule.resources as string[] | undefined;
  const verbs = rule.verbs as string[] | undefined;
  if (!Array.isArray(resources) || !Array.isArray(verbs)) return false;

  const resourceMatch = resources.includes('*') || targetResources.some((r) => resources.includes(r));
  const verbMatch = verbs.includes('*') || targetVerbs.some((v) => verbs.includes(v));
  return resourceMatch && verbMatch;
}

/**
 * KA-A005: Role/ClusterRole grants pod creation permissions.
 *
 * CIS Kubernetes Benchmark 5.1.4 recommends minimizing access to create pods.
 * Pod creation access allows deploying arbitrary workloads that could escalate
 * privileges, access secrets, or consume cluster resources.
 */
export const KAA005: K8sLintRule = {
  id: 'KA-A005',
  title: 'Role grants pod creation permissions',
  severity: 'warning',
  category: 'security',
  explanation:
    'Granting create access to pods allows deploying arbitrary workloads that could ' +
    'escalate privileges, access secrets, or consume cluster resources. ' +
    'CIS Kubernetes Benchmark 5.1.4 recommends minimizing access to create pods.',
  fix: {
    description: 'Remove pod creation permissions or use more restrictive roles',
    beforeCode:
      'rules:\n  - apiGroups: [""]\n    resources: ["pods"]\n    verbs: ["create"]',
    afterCode:
      'rules:\n  - apiGroups: [""]\n    resources: ["pods"]\n    verbs: ["get", "list", "watch"]',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];
    const targetResources = ['pods'];
    const targetVerbs = ['create', '*'];

    for (const resource of ctx.resources) {
      if (resource.kind !== 'Role' && resource.kind !== 'ClusterRole') continue;

      const rules = (resource.json.rules as unknown[] | undefined);
      if (!Array.isArray(rules)) continue;

      for (let i = 0; i < rules.length; i++) {
        const rule = rules[i] as Record<string, unknown>;
        if (ruleGrantsPermission(rule, targetResources, targetVerbs)) {
          const node = resolveInstancePath(resource.doc, `/rules/${i}`);
          const { line, col } = getNodeLine(node, ctx.lineCounter);
          violations.push({
            ruleId: 'KA-A005',
            line,
            column: col,
            message: `${resource.kind} '${resource.name}' grants pod creation permissions (CIS 5.1.4 violation).`,
          });
        }
      }
    }

    return violations;
  },
};
