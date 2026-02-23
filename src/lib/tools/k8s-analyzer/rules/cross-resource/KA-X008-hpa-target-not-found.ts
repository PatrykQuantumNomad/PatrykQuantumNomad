import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';

/**
 * Known workload kinds that the HPA can target.
 * If the targetKind is not in this set (e.g., a CRD), we skip the check gracefully.
 */
const KNOWN_SCALABLE_KINDS = new Set<string>([
  'Deployment',
  'StatefulSet',
  'ReplicaSet',
  'ReplicationController',
]);

/**
 * KA-X008: HPA targets a non-existent resource.
 *
 * An HPA whose scaleTargetRef points to a resource that is not defined in the
 * manifest will not be able to scale anything, failing silently.
 * Skips CRD targets (unknown kinds) gracefully since they can't be validated.
 */
export const KAX008: K8sLintRule = {
  id: 'KA-X008',
  title: 'HPA targets non-existent resource',
  severity: 'warning',
  category: 'cross-resource',
  explanation:
    'A HorizontalPodAutoscaler references a scaleTargetRef that is not defined in the manifest. ' +
    'The HPA will be unable to scale the target and will report "unable to get metrics" errors. ' +
    'Custom resource types (CRDs) are skipped since they cannot be validated from the manifest alone.',
  fix: {
    description: 'Add the HPA target resource to the manifest or correct the scaleTargetRef',
    beforeCode:
      'apiVersion: autoscaling/v2\nkind: HorizontalPodAutoscaler\nspec:\n  scaleTargetRef:\n    apiVersion: apps/v1\n    kind: Deployment\n    name: missing-deploy',
    afterCode:
      'apiVersion: autoscaling/v2\nkind: HorizontalPodAutoscaler\nspec:\n  scaleTargetRef:\n    apiVersion: apps/v1\n    kind: Deployment\n    name: my-deploy\n---\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: my-deploy',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      if (resource.kind !== 'HorizontalPodAutoscaler') continue;

      const spec = resource.json.spec as Record<string, unknown> | undefined;
      const scaleTargetRef = spec?.scaleTargetRef as Record<string, unknown> | undefined;
      if (!scaleTargetRef) continue;

      const targetKind = scaleTargetRef.kind as string | undefined;
      const targetName = scaleTargetRef.name as string | undefined;

      if (!targetKind || !targetName) continue;

      // Skip CRD/unknown kinds gracefully
      if (!KNOWN_SCALABLE_KINDS.has(targetKind)) continue;

      if (!ctx.registry.getByName(targetKind, resource.namespace, targetName)) {
        const node = resolveInstancePath(resource.doc, '/spec/scaleTargetRef/name');
        const { line, col } = getNodeLine(node, ctx.lineCounter);
        violations.push({
          ruleId: 'KA-X008',
          line,
          column: col,
          message: `HPA '${resource.name}' targets ${targetKind} '${targetName}' which is not defined in the manifest (namespace '${resource.namespace}').`,
        });
      }
    }

    return violations;
  },
};
