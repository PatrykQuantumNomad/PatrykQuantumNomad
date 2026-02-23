import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getPodSpec } from '../../container-helpers';

/**
 * KA-B011: Missing priorityClassName.
 *
 * Workloads without a priorityClassName rely on the default scheduling
 * priority. In clusters with mixed workloads, this can lead to critical
 * pods being preempted by less important ones. Setting priorityClassName
 * ensures the scheduler respects workload importance.
 */
export const KAB011: K8sLintRule = {
  id: 'KA-B011',
  title: 'Missing priorityClassName',
  severity: 'info',
  category: 'best-practice',
  explanation:
    'The workload does not specify a priorityClassName. Without it, pods use the default ' +
    'scheduling priority. In clusters with mixed workloads, critical pods may be preempted ' +
    'by less important ones. Set priorityClassName to ensure proper scheduling priority.',
  fix: {
    description: 'Add a priorityClassName to the pod spec',
    beforeCode:
      'spec:\n  template:\n    spec:\n      containers:\n        - name: app',
    afterCode:
      'spec:\n  template:\n    spec:\n      priorityClassName: high-priority\n      containers:\n        - name: app',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const pod = getPodSpec(resource);
      if (!pod) continue;

      const { podSpec, podSpecPath } = pod;
      if (podSpec.priorityClassName === undefined) {
        const node = resolveInstancePath(resource.doc, podSpecPath);
        const { line, col } = getNodeLine(node, ctx.lineCounter);
        violations.push({
          ruleId: 'KA-B011',
          line,
          column: col,
          message: `${resource.kind} '${resource.name}' does not specify a priorityClassName.`,
        });
      }
    }

    return violations;
  },
};
