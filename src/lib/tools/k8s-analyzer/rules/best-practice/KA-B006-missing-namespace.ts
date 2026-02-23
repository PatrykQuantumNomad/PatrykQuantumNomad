import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';

/** Cluster-scoped resources that don't have a namespace. */
const CLUSTER_SCOPED_KINDS = new Set([
  'Namespace',
  'ClusterRole',
  'ClusterRoleBinding',
  'PersistentVolume',
  'Node',
  'CustomResourceDefinition',
]);

/**
 * KA-B006: Missing namespace.
 *
 * Resources without an explicit namespace in metadata will be deployed to
 * the default namespace. This is different from KA-C019 which fires when
 * the namespace is explicitly set to 'default'. KA-B006 fires when the
 * namespace field is entirely absent from the YAML.
 */
export const KAB006: K8sLintRule = {
  id: 'KA-B006',
  title: 'Missing namespace',
  severity: 'info',
  category: 'best-practice',
  explanation:
    'The resource does not specify a namespace in its metadata. When no namespace is specified, ' +
    'the resource will be deployed to whatever namespace is active in the kubectl context ' +
    '(usually default). Explicitly setting a namespace makes manifests self-contained and ' +
    'prevents accidental deployment to the wrong namespace.',
  fix: {
    description: 'Add an explicit namespace to the resource metadata',
    beforeCode:
      'metadata:\n  name: my-app',
    afterCode:
      'metadata:\n  name: my-app\n  namespace: production',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      // Skip cluster-scoped resources (they don't have namespaces)
      if (CLUSTER_SCOPED_KINDS.has(resource.kind)) continue;

      // Check if namespace is literally absent from the YAML metadata
      const metadata = resource.json.metadata as Record<string, unknown> | undefined;
      if (metadata && metadata.namespace === undefined) {
        const node = resolveInstancePath(resource.doc, '/metadata');
        const { line, col } = getNodeLine(node, ctx.lineCounter);
        violations.push({
          ruleId: 'KA-B006',
          line,
          column: col,
          message: `${resource.kind} '${resource.name}' does not specify a namespace.`,
        });
      }
    }

    return violations;
  },
};
