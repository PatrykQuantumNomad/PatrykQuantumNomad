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
 * KA-A004: Role/ClusterRole grants access to secrets.
 *
 * CIS Kubernetes Benchmark 5.1.2 recommends minimizing access to secrets.
 * Granting get, list, or watch on secrets exposes sensitive data including
 * passwords, tokens, and certificates.
 */
export const KAA004: K8sLintRule = {
  id: 'KA-A004',
  title: 'Role grants access to secrets',
  severity: 'warning',
  category: 'security',
  explanation:
    'Granting get, list, or watch access to secrets exposes sensitive data including ' +
    'passwords, tokens, and certificates. CIS Kubernetes Benchmark 5.1.2 recommends ' +
    'minimizing access to secrets and using RBAC to restrict which subjects can read them.',
  fix: {
    description: 'Remove secrets from the role resources or restrict verbs',
    beforeCode:
      'rules:\n  - apiGroups: [""]\n    resources: ["secrets"]\n    verbs: ["get", "list", "watch"]',
    afterCode:
      'rules:\n  - apiGroups: [""]\n    resources: ["configmaps"]\n    verbs: ["get", "list", "watch"]',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];
    const targetResources = ['secrets'];
    const targetVerbs = ['get', 'list', 'watch', '*'];

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
            ruleId: 'KA-A004',
            line,
            column: col,
            message: `${resource.kind} '${resource.name}' grants access to secrets (CIS 5.1.2 violation).`,
          });
        }
      }
    }

    return violations;
  },
};
