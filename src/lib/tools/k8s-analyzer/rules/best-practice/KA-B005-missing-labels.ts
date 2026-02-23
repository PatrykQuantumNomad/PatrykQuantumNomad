import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';

/** Labels that every resource should have for operational visibility. */
const REQUIRED_LABELS = ['app', 'version'] as const;

/**
 * KA-B005: Missing required labels.
 *
 * Resources without standard labels (app, version) are harder to identify,
 * query, and manage in production. Labels are essential for selectors,
 * monitoring dashboards, and operational tooling.
 */
export const KAB005: K8sLintRule = {
  id: 'KA-B005',
  title: 'Missing required labels',
  severity: 'info',
  category: 'best-practice',
  explanation:
    'The resource is missing recommended labels (app, version). Standard labels enable ' +
    'consistent service discovery, monitoring dashboard filters, and operational tooling. ' +
    'Without them, resources are harder to identify and manage at scale.',
  fix: {
    description: 'Add app and version labels to the resource metadata',
    beforeCode:
      'metadata:\n  name: my-app',
    afterCode:
      'metadata:\n  name: my-app\n  labels:\n    app: my-app\n    version: "1.0"',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const metadata = resource.json.metadata as Record<string, unknown> | undefined;
      const labels = metadata?.labels as Record<string, string> | undefined;

      const missing: string[] = [];
      for (const label of REQUIRED_LABELS) {
        if (!labels || !(label in labels)) {
          missing.push(label);
        }
      }

      if (missing.length > 0) {
        // Point to /metadata/labels if labels object exists, else /metadata
        const nodePath = labels ? '/metadata/labels' : '/metadata';
        const node = resolveInstancePath(resource.doc, nodePath);
        const { line, col } = getNodeLine(node, ctx.lineCounter);
        violations.push({
          ruleId: 'KA-B005',
          line,
          column: col,
          message: `${resource.kind} '${resource.name}' is missing labels: ${missing.join(', ')}.`,
        });
      }
    }

    return violations;
  },
};
