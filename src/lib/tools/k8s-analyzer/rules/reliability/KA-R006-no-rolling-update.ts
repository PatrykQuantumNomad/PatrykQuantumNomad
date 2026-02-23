import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';

/**
 * KA-R006: No rolling update strategy.
 *
 * A Deployment using the Recreate strategy kills all existing pods before
 * creating new ones, causing downtime during every update. RollingUpdate
 * is the Kubernetes default and should be used for zero-downtime deployments.
 *
 * Note: If strategy is completely absent, Kubernetes defaults to RollingUpdate,
 * so this rule only flags when strategy exists and type is not RollingUpdate.
 */
export const KAR006: K8sLintRule = {
  id: 'KA-R006',
  title: 'No rolling update strategy',
  severity: 'warning',
  category: 'reliability',
  explanation:
    'The Deployment uses a non-RollingUpdate strategy (e.g., Recreate). ' +
    'The Recreate strategy terminates all existing pods before creating new ones, ' +
    'causing downtime during every deployment. Use RollingUpdate for zero-downtime ' +
    'rollouts.',
  fix: {
    description: 'Set strategy type to RollingUpdate',
    beforeCode:
      'spec:\n  strategy:\n    type: Recreate',
    afterCode:
      'spec:\n  strategy:\n    type: RollingUpdate\n    rollingUpdate:\n      maxSurge: 1\n      maxUnavailable: 0',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      if (resource.kind !== 'Deployment') continue;

      const spec = resource.json.spec as Record<string, unknown> | undefined;
      if (!spec) continue;

      const strategy = spec.strategy as Record<string, unknown> | undefined;
      // If strategy is absent, K8s defaults to RollingUpdate -- no violation
      if (!strategy) continue;

      const strategyType = strategy.type as string | undefined;
      if (strategyType && strategyType !== 'RollingUpdate') {
        const node = resolveInstancePath(resource.doc, '/spec/strategy/type');
        const { line, col } = getNodeLine(node, ctx.lineCounter);
        violations.push({
          ruleId: 'KA-R006',
          line,
          column: col,
          message: `Deployment '${resource.name}' uses '${strategyType}' strategy instead of RollingUpdate.`,
        });
      }
    }

    return violations;
  },
};
