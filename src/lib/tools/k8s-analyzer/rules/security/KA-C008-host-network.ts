import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getPodSpec } from '../../container-helpers';

/**
 * KA-C008: Host network enabled.
 *
 * PSS Baseline profile restricts host network access. When hostNetwork is true,
 * the pod uses the host network namespace, exposing all host network interfaces
 * and potentially allowing network-based attacks on other pods and services.
 */
export const KAC008: K8sLintRule = {
  id: 'KA-C008',
  title: 'Host network enabled',
  severity: 'warning',
  category: 'security',
  explanation:
    'The pod uses the host network namespace. This exposes all host network interfaces ' +
    'and ports, bypassing Kubernetes network policies and potentially allowing ' +
    'network-based attacks. PSS Baseline profile restricts spec.hostNetwork=true.',
  fix: {
    description: 'Remove hostNetwork: true or set it to false',
    beforeCode:
      'spec:\n  hostNetwork: true\n  containers:\n    - name: app',
    afterCode:
      'spec:\n  hostNetwork: false\n  containers:\n    - name: app',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const pod = getPodSpec(resource);
      if (!pod) continue;

      if (pod.podSpec.hostNetwork === true) {
        const node = resolveInstancePath(
          resource.doc,
          `${pod.podSpecPath}/hostNetwork`,
        );
        const { line, col } = getNodeLine(node, ctx.lineCounter);
        violations.push({
          ruleId: 'KA-C008',
          line,
          column: col,
          message: `${resource.kind} '${resource.name}' uses the host network namespace (PSS Baseline restriction).`,
        });
      }
    }

    return violations;
  },
};
