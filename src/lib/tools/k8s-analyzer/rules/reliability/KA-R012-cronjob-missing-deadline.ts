import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';

/**
 * KA-R012: CronJob missing startingDeadlineSeconds.
 *
 * Without startingDeadlineSeconds, if the CronJob controller misses a
 * schedule (e.g., due to controller downtime), it may create many jobs
 * at once when it recovers, overwhelming the cluster.
 */
export const KAR012: K8sLintRule = {
  id: 'KA-R012',
  title: 'CronJob missing startingDeadlineSeconds',
  severity: 'warning',
  category: 'reliability',
  explanation:
    'The CronJob does not set startingDeadlineSeconds. Without a deadline, ' +
    'if the CronJob controller misses a schedule (e.g., due to controller downtime), ' +
    'it may create many jobs at once when it recovers, overwhelming the cluster.',
  fix: {
    description: 'Add startingDeadlineSeconds to the CronJob spec',
    beforeCode:
      'apiVersion: batch/v1\nkind: CronJob\nspec:\n  schedule: "*/5 * * * *"',
    afterCode:
      'apiVersion: batch/v1\nkind: CronJob\nspec:\n  schedule: "*/5 * * * *"\n  startingDeadlineSeconds: 200',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      if (resource.kind !== 'CronJob') continue;

      const spec = resource.json.spec as Record<string, unknown> | undefined;
      if (!spec) continue;

      if (spec.startingDeadlineSeconds === undefined) {
        const node = resolveInstancePath(resource.doc, '/spec');
        const { line, col } = getNodeLine(node, ctx.lineCounter);
        violations.push({
          ruleId: 'KA-R012',
          line,
          column: col,
          message: `CronJob '${resource.name}' does not set startingDeadlineSeconds. Missed schedules may cause job storms on recovery.`,
        });
      }
    }

    return violations;
  },
};
