import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { TEMPLATE_LABEL_PATHS } from './KA-X001-service-selector-mismatch';

/**
 * KA-X007: NetworkPolicy podSelector matches no Pod template in the manifest.
 *
 * A NetworkPolicy with a non-empty podSelector that matches no workload's
 * pod template labels provides no protection and may indicate a misconfiguration.
 * Empty podSelector ({}) is intentional -- it matches all pods in the namespace.
 */
export const KAX007: K8sLintRule = {
  id: 'KA-X007',
  title: 'NetworkPolicy selector matches no Pod',
  severity: 'info',
  category: 'cross-resource',
  explanation:
    'A NetworkPolicy with a non-empty podSelector that matches no Pod template ' +
    'in the same namespace has no effect. This may indicate a label mismatch ' +
    'between the policy and workloads, leaving the intended pods unprotected.',
  fix: {
    description: 'Ensure podSelector labels match at least one workload template in the namespace',
    beforeCode:
      'apiVersion: networking.k8s.io/v1\nkind: NetworkPolicy\nspec:\n  podSelector:\n    matchLabels:\n      app: typo-app',
    afterCode:
      'apiVersion: networking.k8s.io/v1\nkind: NetworkPolicy\nspec:\n  podSelector:\n    matchLabels:\n      app: my-app',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      if (resource.kind !== 'NetworkPolicy') continue;

      const spec = resource.json.spec as Record<string, unknown> | undefined;
      const podSelector = spec?.podSelector as Record<string, unknown> | undefined;

      // Skip if podSelector is missing or empty (empty {} matches all pods)
      if (!podSelector) continue;
      const matchLabels = podSelector.matchLabels as Record<string, string> | undefined;
      if (!matchLabels || Object.keys(matchLabels).length === 0) continue;

      const selectorEntries = Object.entries(matchLabels);

      // Check all workload resources in the same namespace
      let matched = false;
      for (const candidate of ctx.resources) {
        if (candidate.namespace !== resource.namespace) continue;

        const labelPath = TEMPLATE_LABEL_PATHS[candidate.kind];
        if (!labelPath) continue;

        // Navigate to template labels
        let current: unknown = candidate.json;
        for (const segment of labelPath) {
          if (current && typeof current === 'object' && !Array.isArray(current)) {
            current = (current as Record<string, unknown>)[segment];
          } else {
            current = undefined;
            break;
          }
        }

        const templateLabels = current as Record<string, string> | undefined;
        if (!templateLabels) continue;

        const allMatch = selectorEntries.every(
          ([k, v]) => templateLabels[k] === v,
        );
        if (allMatch) {
          matched = true;
          break;
        }
      }

      if (!matched) {
        const node = resolveInstancePath(resource.doc, '/spec/podSelector/matchLabels');
        const { line, col } = getNodeLine(node, ctx.lineCounter);
        violations.push({
          ruleId: 'KA-X007',
          line,
          column: col,
          message: `NetworkPolicy '${resource.name}' podSelector ${JSON.stringify(matchLabels)} matches no Pod template in namespace '${resource.namespace}'.`,
        });
      }
    }

    return violations;
  },
};
