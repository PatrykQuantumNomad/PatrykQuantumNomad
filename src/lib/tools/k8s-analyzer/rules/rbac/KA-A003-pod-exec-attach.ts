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
 * KA-A003: Role/ClusterRole grants pod exec or attach permissions.
 *
 * Granting create or get access to pods/exec, pods/attach, or pods/* allows
 * arbitrary command execution inside running containers, effectively bypassing
 * container isolation for interactive access.
 */
export const KAA003: K8sLintRule = {
  id: 'KA-A003',
  title: 'Role grants pod exec/attach permissions',
  severity: 'warning',
  category: 'security',
  explanation:
    'Granting access to pods/exec or pods/attach allows executing arbitrary commands ' +
    'inside running containers. This effectively bypasses container isolation for ' +
    'interactive access and should be restricted to trusted administrators only.',
  fix: {
    description: 'Remove pods/exec and pods/attach from the role resources',
    beforeCode:
      'rules:\n  - apiGroups: [""]\n    resources: ["pods/exec", "pods/attach"]\n    verbs: ["create"]',
    afterCode:
      'rules:\n  - apiGroups: [""]\n    resources: ["pods"]\n    verbs: ["get", "list", "watch"]',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];
    const targetResources = ['pods/exec', 'pods/attach', 'pods/*'];
    const targetVerbs = ['create', 'get', '*'];

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
            ruleId: 'KA-A003',
            line,
            column: col,
            message: `${resource.kind} '${resource.name}' grants pod exec/attach permissions.`,
          });
        }
      }
    }

    return violations;
  },
};
