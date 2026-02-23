import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';

/** Resource kinds that use spec.selector.matchLabels with spec.template.metadata.labels. */
const SELECTOR_RESOURCE_KINDS = new Set(['Deployment', 'StatefulSet', 'DaemonSet']);

/**
 * KA-R011: Selector/template label mismatch.
 *
 * Every key-value pair in spec.selector.matchLabels must exist in
 * spec.template.metadata.labels (subset check, NOT exact match).
 * A mismatch causes the resource to fail to manage its pods.
 */
export const KAR011: K8sLintRule = {
  id: 'KA-R011',
  title: 'Selector/template label mismatch',
  severity: 'error',
  category: 'reliability',
  explanation:
    'The resource has a mismatch between spec.selector.matchLabels and ' +
    'spec.template.metadata.labels. Every label in the selector must exist ' +
    'with the same value in the pod template labels. A mismatch causes the ' +
    'controller to fail to manage its pods, and Kubernetes will reject the ' +
    'resource at creation time.',
  fix: {
    description:
      'Ensure all selector matchLabels appear in the template metadata labels',
    beforeCode:
      'spec:\n  selector:\n    matchLabels:\n      app: myapp\n  template:\n    metadata:\n      labels:\n        app: other-app',
    afterCode:
      'spec:\n  selector:\n    matchLabels:\n      app: myapp\n  template:\n    metadata:\n      labels:\n        app: myapp\n        version: v1',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      if (!SELECTOR_RESOURCE_KINDS.has(resource.kind)) continue;

      const spec = resource.json.spec as Record<string, unknown> | undefined;
      if (!spec) continue;

      const selector = spec.selector as Record<string, unknown> | undefined;
      const matchLabels = selector?.matchLabels as
        | Record<string, string>
        | undefined;
      if (!matchLabels) continue; // no selector to check

      const template = spec.template as Record<string, unknown> | undefined;
      const templateMeta = template?.metadata as
        | Record<string, unknown>
        | undefined;
      const templateLabels = templateMeta?.labels as
        | Record<string, string>
        | undefined;

      for (const [key, value] of Object.entries(matchLabels)) {
        if (!templateLabels || templateLabels[key] !== value) {
          const node = resolveInstancePath(
            resource.doc,
            '/spec/selector/matchLabels',
          );
          const { line, col } = getNodeLine(node, ctx.lineCounter);
          violations.push({
            ruleId: 'KA-R011',
            line,
            column: col,
            message: `${resource.kind} '${resource.name}': selector label '${key}=${value}' not found in template labels.`,
          });
          break; // One violation per resource is sufficient
        }
      }
    }

    return violations;
  },
};
