import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getPodSpec } from '../../container-helpers';

/**
 * KA-C017: Default ServiceAccount used.
 *
 * CIS Benchmark control. Using the 'default' ServiceAccount means pods share
 * a common identity. If one pod is compromised, the attacker could impersonate
 * any other pod using the same ServiceAccount.
 */
export const KAC017: K8sLintRule = {
  id: 'KA-C017',
  title: 'Default ServiceAccount used',
  severity: 'warning',
  category: 'security',
  explanation:
    'The pod uses the default ServiceAccount. When no serviceAccountName is specified, ' +
    'Kubernetes assigns the "default" ServiceAccount. This shares a common identity across ' +
    'all pods in the namespace. Create dedicated ServiceAccounts with least-privilege RBAC. ' +
    'CIS Benchmark recommends not using the default ServiceAccount.',
  fix: {
    description: 'Create and assign a dedicated ServiceAccount',
    beforeCode:
      'spec:\n  containers:\n    - name: app',
    afterCode:
      'spec:\n  serviceAccountName: app-sa\n  containers:\n    - name: app',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const pod = getPodSpec(resource);
      if (!pod) continue;

      const saName = pod.podSpec.serviceAccountName as string | undefined;

      // Fire when serviceAccountName is absent, empty, or literally 'default'
      if (!saName || saName === 'default') {
        const nodePath =
          saName !== undefined
            ? `${pod.podSpecPath}/serviceAccountName`
            : pod.podSpecPath;
        const node = resolveInstancePath(resource.doc, nodePath);
        const { line, col } = getNodeLine(node, ctx.lineCounter);
        violations.push({
          ruleId: 'KA-C017',
          line,
          column: col,
          message: `${resource.kind} '${resource.name}' uses the default ServiceAccount. Assign a dedicated ServiceAccount with least-privilege RBAC.`,
        });
      }
    }

    return violations;
  },
};
