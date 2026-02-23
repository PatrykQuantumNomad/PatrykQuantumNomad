import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getPodSpec } from '../../container-helpers';

/**
 * KA-R007: Missing pod anti-affinity.
 *
 * Without podAntiAffinity, the scheduler may place all replicas on the
 * same node, creating a single point of failure.
 */
export const KAR007: K8sLintRule = {
  id: 'KA-R007',
  title: 'Missing pod anti-affinity',
  severity: 'info',
  category: 'reliability',
  explanation:
    'The workload does not define podAntiAffinity. Without anti-affinity rules, ' +
    'the Kubernetes scheduler may place all replicas on the same node, creating ' +
    'a single point of failure if that node goes down.',
  fix: {
    description: 'Add podAntiAffinity to spread pods across nodes',
    beforeCode:
      'spec:\n  template:\n    spec:\n      containers:\n        - name: app',
    afterCode:
      'spec:\n  template:\n    spec:\n      affinity:\n        podAntiAffinity:\n          preferredDuringSchedulingIgnoredDuringExecution:\n            - weight: 100\n              podAffinityTerm:\n                labelSelector:\n                  matchLabels:\n                    app: myapp\n                topologyKey: kubernetes.io/hostname\n      containers:\n        - name: app',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const pod = getPodSpec(resource);
      if (!pod) continue;

      const { podSpec, podSpecPath } = pod;
      const affinity = podSpec.affinity as Record<string, unknown> | undefined;

      if (!affinity?.podAntiAffinity) {
        const node = resolveInstancePath(resource.doc, podSpecPath);
        const { line, col } = getNodeLine(node, ctx.lineCounter);
        violations.push({
          ruleId: 'KA-R007',
          line,
          column: col,
          message: `${resource.kind} '${resource.name}' has no podAntiAffinity. Pods may be co-located on the same node.`,
        });
      }
    }

    return violations;
  },
};
