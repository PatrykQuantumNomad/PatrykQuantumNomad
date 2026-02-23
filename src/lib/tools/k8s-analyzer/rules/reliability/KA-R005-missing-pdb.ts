import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';

/**
 * KA-R005: Missing PodDisruptionBudget.
 *
 * For Deployments with 2+ replicas, a PodDisruptionBudget (PDB) ensures
 * that voluntary disruptions (node drains, upgrades) do not take down
 * all pods simultaneously. This is an informational recommendation since
 * PDB is not in the analyzer's GVK registry for cross-resource lookup.
 */
export const KAR005: K8sLintRule = {
  id: 'KA-R005',
  title: 'Missing PodDisruptionBudget',
  severity: 'info',
  category: 'reliability',
  explanation:
    'The Deployment has multiple replicas but no PodDisruptionBudget (PDB) ' +
    'was found in the manifest. Without a PDB, voluntary disruptions such as ' +
    'node drains or cluster upgrades may evict all pods simultaneously, ' +
    'causing downtime.',
  fix: {
    description: 'Add a PodDisruptionBudget for the Deployment',
    beforeCode:
      'apiVersion: apps/v1\nkind: Deployment\nspec:\n  replicas: 3',
    afterCode:
      'apiVersion: policy/v1\nkind: PodDisruptionBudget\nspec:\n  minAvailable: 1\n  selector:\n    matchLabels:\n      app: myapp',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      if (resource.kind !== 'Deployment') continue;

      const spec = resource.json.spec as Record<string, unknown> | undefined;
      if (!spec) continue;

      const replicas = spec.replicas as number | undefined;
      // Only recommend PDB for Deployments with 2+ replicas
      if (replicas !== undefined && replicas >= 2) {
        const node = resolveInstancePath(resource.doc, '/spec');
        const { line, col } = getNodeLine(node, ctx.lineCounter);
        violations.push({
          ruleId: 'KA-R005',
          line,
          column: col,
          message: `Deployment '${resource.name}' has ${replicas} replicas. Consider adding a PodDisruptionBudget for high availability.`,
        });
      }
    }

    return violations;
  },
};
