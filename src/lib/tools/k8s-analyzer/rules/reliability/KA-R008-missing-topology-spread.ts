import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getPodSpec } from '../../container-helpers';

/**
 * KA-R008: Missing topology spread constraints.
 *
 * Without topologySpreadConstraints, pods may cluster on a subset of
 * nodes or availability zones, reducing resilience to zone outages.
 */
export const KAR008: K8sLintRule = {
  id: 'KA-R008',
  title: 'Missing topology spread constraints',
  severity: 'info',
  category: 'reliability',
  explanation:
    'The workload does not define topologySpreadConstraints. Without topology ' +
    'spread constraints, pods may cluster on a subset of nodes or availability ' +
    'zones, reducing resilience to zone or node failures.',
  fix: {
    description: 'Add topologySpreadConstraints to distribute pods across zones',
    beforeCode:
      'spec:\n  template:\n    spec:\n      containers:\n        - name: app',
    afterCode:
      'spec:\n  template:\n    spec:\n      topologySpreadConstraints:\n        - maxSkew: 1\n          topologyKey: topology.kubernetes.io/zone\n          whenUnsatisfiable: DoNotSchedule\n          labelSelector:\n            matchLabels:\n              app: myapp\n      containers:\n        - name: app',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const pod = getPodSpec(resource);
      if (!pod) continue;

      const { podSpec, podSpecPath } = pod;
      const tsc = podSpec.topologySpreadConstraints;

      if (!tsc || !Array.isArray(tsc) || tsc.length === 0) {
        const node = resolveInstancePath(resource.doc, podSpecPath);
        const { line, col } = getNodeLine(node, ctx.lineCounter);
        violations.push({
          ruleId: 'KA-R008',
          line,
          column: col,
          message: `${resource.kind} '${resource.name}' has no topologySpreadConstraints. Pods may cluster in a single zone.`,
        });
      }
    }

    return violations;
  },
};
