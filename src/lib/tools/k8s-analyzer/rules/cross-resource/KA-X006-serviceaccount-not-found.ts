import type { K8sLintRule, K8sRuleContext, K8sRuleViolation } from '../../types';
import { resolveInstancePath, getNodeLine } from '../../parser';
import { getPodSpec } from '../../container-helpers';
import { WELL_KNOWN_SERVICE_ACCOUNTS } from './well-known-resources';

/**
 * KA-X006: ServiceAccount reference not found in manifest.
 *
 * Checks podSpec.serviceAccountName (pod-level field, NOT container-level).
 * Skips undefined serviceAccountName (K8s defaults to 'default')
 * and names in the well-known ServiceAccounts list.
 */
export const KAX006: K8sLintRule = {
  id: 'KA-X006',
  title: 'ServiceAccount reference not found',
  severity: 'warning',
  category: 'cross-resource',
  explanation:
    'A workload specifies a serviceAccountName that is not defined in the manifest. ' +
    'If the ServiceAccount does not exist at deploy time, the Pod will fail to be created ' +
    'with a "serviceaccount not found" error. This may be expected if the ServiceAccount ' +
    'is created by a Helm chart or operator.',
  fix: {
    description: 'Add the referenced ServiceAccount to the manifest',
    beforeCode:
      'spec:\n  serviceAccountName: app-sa\n  containers:\n    - name: app',
    afterCode:
      'spec:\n  serviceAccountName: app-sa\n  containers:\n    - name: app\n---\napiVersion: v1\nkind: ServiceAccount\nmetadata:\n  name: app-sa',
  },

  check(ctx: K8sRuleContext): K8sRuleViolation[] {
    const violations: K8sRuleViolation[] = [];

    for (const resource of ctx.resources) {
      const pod = getPodSpec(resource);
      if (!pod) continue;

      const { podSpec, podSpecPath } = pod;
      const saName = podSpec.serviceAccountName as string | undefined;

      // Skip if not defined (K8s defaults to 'default') or well-known
      if (!saName || WELL_KNOWN_SERVICE_ACCOUNTS.has(saName)) continue;

      if (!ctx.registry.getByName('ServiceAccount', resource.namespace, saName)) {
        const jsonPath = `${podSpecPath}/serviceAccountName`;
        const node = resolveInstancePath(resource.doc, jsonPath);
        const { line, col } = getNodeLine(node, ctx.lineCounter);
        violations.push({
          ruleId: 'KA-X006',
          line,
          column: col,
          message: `${resource.kind} '${resource.name}' references ServiceAccount '${saName}' which is not defined in the manifest (namespace '${resource.namespace}').`,
        });
      }
    }

    return violations;
  },
};
