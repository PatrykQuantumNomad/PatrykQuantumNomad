import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getPodSpec } from '../../container-helpers';

/**
 * KA-C016: ServiceAccount token auto-mounted.
 *
 * CIS Benchmark control. Auto-mounting the ServiceAccount token makes it
 * available to all containers in the pod. If a container is compromised,
 * the attacker can use this token to access the Kubernetes API.
 */
export const KAC016: K8sLintRule = {
  id: 'KA-C016',
  title: 'ServiceAccount token auto-mounted',
  severity: 'warning',
  category: 'security',
  explanation:
    'The pod does not set automountServiceAccountToken: false. The ServiceAccount token ' +
    'is automatically mounted at /var/run/secrets/kubernetes.io/serviceaccount, making it ' +
    'available to all containers. If a container is compromised, the attacker can use this ' +
    'token to access the Kubernetes API. CIS Benchmark recommends disabling auto-mount.',
  fix: {
    description: 'Set automountServiceAccountToken: false in the pod spec',
    beforeCode:
      'spec:\n  containers:\n    - name: app',
    afterCode:
      'spec:\n  automountServiceAccountToken: false\n  containers:\n    - name: app',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const pod = getPodSpec(resource);
      if (!pod) continue;

      if (pod.podSpec.automountServiceAccountToken !== false) {
        const nodePath =
          'automountServiceAccountToken' in pod.podSpec
            ? `${pod.podSpecPath}/automountServiceAccountToken`
            : pod.podSpecPath;
        const node = resolveInstancePath(resource.doc, nodePath);
        const { line, col } = getNodeLine(node, ctx.lineCounter);
        violations.push({
          ruleId: 'KA-C016',
          line,
          column: col,
          message: `${resource.kind} '${resource.name}' does not set automountServiceAccountToken: false (CIS Benchmark recommendation).`,
        });
      }
    }

    return violations;
  },
};
