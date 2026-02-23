import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';

/**
 * KA-R004: Single replica Deployment.
 *
 * A Deployment with only 1 replica (explicit or default) has no redundancy
 * and will experience downtime during rolling updates or node failures.
 */
export const KAR004: K8sLintRule = {
  id: 'KA-R004',
  title: 'Single replica Deployment',
  severity: 'warning',
  category: 'reliability',
  explanation:
    'The Deployment specifies only 1 replica (or omits the replicas field, ' +
    'which defaults to 1). A single-replica Deployment has no redundancy ' +
    'and will experience downtime during rolling updates or node failures.',
  fix: {
    description: 'Set replicas to 2 or more for production workloads',
    beforeCode: 'spec:\n  replicas: 1',
    afterCode: 'spec:\n  replicas: 2',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      if (resource.kind !== 'Deployment') continue;

      const spec = resource.json.spec as Record<string, unknown> | undefined;
      if (!spec) continue;

      const replicas = spec.replicas as number | undefined;
      // Default replicas is 1 when omitted
      if (replicas === undefined || replicas === 1) {
        const nodePath = replicas !== undefined ? '/spec/replicas' : '/spec';
        const node = resolveInstancePath(resource.doc, nodePath);
        const { line, col } = getNodeLine(node, ctx.lineCounter);
        violations.push({
          ruleId: 'KA-R004',
          line,
          column: col,
          message: `Deployment '${resource.name}' has ${replicas ?? 1} replica. Use 2+ replicas for high availability.`,
        });
      }
    }

    return violations;
  },
};
