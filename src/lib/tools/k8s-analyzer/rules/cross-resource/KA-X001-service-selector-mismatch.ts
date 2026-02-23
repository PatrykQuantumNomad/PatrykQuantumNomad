import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';

/**
 * Map of workload kind -> JSON path segments to the pod template labels.
 * Used for Service selector matching and NetworkPolicy podSelector matching.
 */
export const TEMPLATE_LABEL_PATHS: Record<string, string[]> = {
  Pod: ['metadata', 'labels'],
  Deployment: ['spec', 'template', 'metadata', 'labels'],
  StatefulSet: ['spec', 'template', 'metadata', 'labels'],
  DaemonSet: ['spec', 'template', 'metadata', 'labels'],
  Job: ['spec', 'template', 'metadata', 'labels'],
  CronJob: ['spec', 'jobTemplate', 'spec', 'template', 'metadata', 'labels'],
};

/** Navigate a nested object by path segments, returning the value or undefined. */
function getNestedValue(obj: unknown, path: string[]): unknown {
  let current: unknown = obj;
  for (const segment of path) {
    if (current && typeof current === 'object' && !Array.isArray(current)) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }
  }
  return current;
}

/**
 * KA-X001: Service selector matches no Pod template in the manifest.
 *
 * A Service with a selector that does not match any workload's pod template
 * labels in the same namespace will never route traffic, causing silent failures
 * at deployment time.
 */
export const KAX001: K8sLintRule = {
  id: 'KA-X001',
  title: 'Service selector matches no Pod template',
  severity: 'warning',
  category: 'cross-resource',
  explanation:
    'A Service selector must match at least one Pod template in the same namespace ' +
    'for traffic routing to work. A dangling selector means the Service will have no ' +
    'endpoints, causing connection timeouts or refused connections at runtime.',
  fix: {
    description: 'Ensure a workload in the same namespace has labels matching the Service selector',
    beforeCode:
      'apiVersion: v1\nkind: Service\nmetadata:\n  name: my-svc\nspec:\n  selector:\n    app: my-app',
    afterCode:
      'apiVersion: v1\nkind: Service\nmetadata:\n  name: my-svc\nspec:\n  selector:\n    app: my-app\n---\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: my-app\nspec:\n  template:\n    metadata:\n      labels:\n        app: my-app',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      if (resource.kind !== 'Service') continue;

      const spec = resource.json.spec as Record<string, unknown> | undefined;
      const selector = spec?.selector as Record<string, string> | undefined;
      if (!selector || Object.keys(selector).length === 0) continue;

      const selectorEntries = Object.entries(selector);

      // Check all workload resources in the same namespace
      let matched = false;
      for (const candidate of ctx.resources) {
        if (candidate.namespace !== resource.namespace) continue;

        const labelPath = TEMPLATE_LABEL_PATHS[candidate.kind];
        if (!labelPath) continue;

        const templateLabels = getNestedValue(candidate.json, labelPath) as
          | Record<string, string>
          | undefined;
        if (!templateLabels) continue;

        // Subset match: ALL selector entries must exist in template labels
        const allMatch = selectorEntries.every(
          ([k, v]) => templateLabels[k] === v,
        );
        if (allMatch) {
          matched = true;
          break;
        }
      }

      if (!matched) {
        const node = resolveInstancePath(resource.doc, '/spec/selector');
        const { line, col } = getNodeLine(node, ctx.lineCounter);
        violations.push({
          ruleId: 'KA-X001',
          line,
          column: col,
          message: `Service '${resource.name}' selector ${JSON.stringify(selector)} matches no Pod template in namespace '${resource.namespace}'.`,
        });
      }
    }

    return violations;
  },
};
